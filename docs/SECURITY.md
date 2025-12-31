# Security Documentation

## Overview

This document outlines security considerations, known vulnerabilities, and recommended mitigations for the Claude Code GUI VS Code extension.

---

## Security Architecture

### Trust Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                    VS Code Extension Host                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Extension Layer                         │  │
│  │  • ClaudeService (process spawning)                       │  │
│  │  • PermissionService (access control)                     │  │
│  │  • ConversationService (data storage)                     │  │
│  │  • MCPService (server configuration)                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            ↕ postMessage                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Webview Layer                           │  │
│  │  • React UI (sandboxed iframe)                            │  │
│  │  • localStorage (client-side persistence)                 │  │
│  │  • User input handling                                     │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            ↕ stdin/stdout
              ┌─────────────────────────────────────┐
              │         Claude CLI Process          │
              │   (External system process)         │
              └─────────────────────────────────────┘
```

---

## Known Security Issues

### Critical Severity

#### 1. WSL Command Injection

**Location:** `src/extension/services/ClaudeService.ts`

**Issue:** User-controlled paths passed to WSL command without proper escaping.

```typescript
// VULNERABLE: Path not properly escaped for shell
const wslPath = this.convertToWslPath(cwd);
const command = `wsl -d ${distro} bash -ic "claude ..."`;
```

**Risk:** Arbitrary command execution via crafted file paths.

**Mitigation:**
- Validate paths against allowlist
- Use proper shell escaping
- Consider using execFile instead of exec

---

#### 2. YOLO Mode Permission Bypass

**Location:** `src/extension/services/ClaudeService.ts`

**Issue:** YOLO mode passes `--dangerously-skip-permissions` flag, bypassing all permission checks.

```typescript
if (yoloMode) {
  args.push('--dangerously-skip-permissions');
}
```

**Risk:** All tool executions bypass user approval, enabling potential malicious actions.

**Mitigation:**
- Add prominent warning in UI when enabled
- Require explicit confirmation each session
- Log all actions taken in YOLO mode
- Consider removing or restricting this feature

---

### High Severity

#### 3. Missing postMessage Origin Validation

**Location:** `src/webview/hooks/useMessages.ts`

**Issue:** Message handler does not validate message origin.

```typescript
// VULNERABLE: No origin check
window.addEventListener('message', (event) => {
  const message = event.data as ExtensionToWebviewMessage;
  // ... process message
});
```

**Risk:** Malicious iframes could inject messages into webview.

**Mitigation:**
```typescript
window.addEventListener('message', (event) => {
  // Validate origin
  if (event.origin !== 'vscode-webview://') {
    console.warn('Rejected message from untrusted origin:', event.origin);
    return;
  }
  // ... process message
});
```

---

#### 4. XSS via innerHTML

**Location:** `src/webview/main.tsx`

**Issue:** Dynamic HTML content set via innerHTML without sanitization.

**Risk:** Reflected XSS if attacker-controlled content rendered.

**Mitigation:**
- Use React's built-in XSS protection
- Sanitize any raw HTML with DOMPurify
- Avoid dangerouslySetInnerHTML

---

#### 5. localStorage Permission Tampering

**Location:** `src/webview/stores/permissionStore.ts`

**Issue:** Permission decisions stored in localStorage can be modified via DevTools.

**Risk:** Users could grant themselves permanent permissions or attackers with physical access could modify permissions.

**Mitigation:**
- Store critical permissions in extension storage
- Sign/verify permission entries
- Implement server-side validation for sensitive operations

---

### Medium Severity

#### 6. Path Traversal in File Operations

**Locations:**
- `src/extension/webview/PanelProvider.ts`
- `src/extension/services/ConversationService.ts`

**Issue:** File paths from Claude CLI passed to file operations without validation.

```typescript
// VULNERABLE: Path from external source
await vscode.workspace.openTextDocument(filePath);
```

**Risk:** Access to files outside workspace.

**Mitigation:**
```typescript
function isPathSafe(filePath: string, workspaceRoot: string): boolean {
  const resolved = path.resolve(filePath);
  return resolved.startsWith(path.resolve(workspaceRoot));
}
```

---

#### 7. Sensitive Data in localStorage

**Location:** `src/webview/stores/`

**Issue:** Cost data, session IDs, and conversation history stored in localStorage.

**Risk:** Data accessible via XSS or shared computer access.

**Mitigation:**
- Use VS Code's SecretStorage for sensitive data
- Encrypt localStorage content
- Implement auto-expiry for session data

---

#### 8. MCP Server Configuration Injection

**Location:** `src/extension/services/MCPService.ts`

**Issue:** MCP server commands not validated before execution.

**Risk:** Malicious MCP configurations could execute arbitrary commands.

**Mitigation:**
- Validate command paths against allowlist
- Require explicit user approval for new servers
- Sandbox MCP server processes

---

### Low Severity

#### 9. Verbose Error Messages

**Location:** Multiple files

**Issue:** Detailed error messages may expose system paths or configuration.

**Mitigation:**
- Sanitize error messages before display
- Log detailed errors, show generic messages to user

---

#### 10. No Rate Limiting

**Location:** `src/extension/services/ClaudeService.ts`

**Issue:** No limits on API calls or process spawning.

**Mitigation:**
- Implement request throttling
- Add concurrent process limits

---

## Permission System

### Permission Flow

```
┌──────────┐    ┌─────────────────┐    ┌──────────────┐
│  Claude  │───▶│ PermissionCheck │───▶│ Auto-Allowed │──Yes─▶ Execute
│   CLI    │    │                 │    │   Pattern?   │
└──────────┘    └─────────────────┘    └──────────────┘
                                              │No
                                              ▼
                                    ┌──────────────────┐
                                    │   User Prompt    │
                                    │                  │
                                    │ Allow │ Deny │   │
                                    │ Always Allow     │
                                    └──────────────────┘
```

### Pre-Approved Patterns

```typescript
// Package managers
'npm install *', 'yarn add *', 'pnpm add *'

// Version control
'git add *', 'git commit *', 'git push *'

// Build tools
'make *', 'cargo build *'
```

### Permission Scopes

| Scope | Duration | Storage |
|-------|----------|---------|
| `once` | Single execution | Memory only |
| `session` | Until extension restart | Memory only |
| `always` | Persistent | localStorage + disk |

---

## Security Best Practices

### For Developers

1. **Input Validation**
   - Validate all paths against workspace root
   - Sanitize user input before shell execution
   - Validate message origins in webview

2. **Output Encoding**
   - Use React's default XSS protection
   - Sanitize any HTML content with DOMPurify
   - Escape shell metacharacters

3. **Secure Storage**
   - Use VS Code's SecretStorage for API keys
   - Don't store sensitive data in localStorage
   - Encrypt persisted session data

4. **Principle of Least Privilege**
   - Request minimal permissions
   - Validate file paths are within workspace
   - Sandbox child processes where possible

### For Users

1. **Review Permissions**
   - Don't enable YOLO mode without understanding risks
   - Review always-allow patterns periodically
   - Check MCP server configurations

2. **Workspace Security**
   - Only open trusted workspaces
   - Be cautious with Claude-suggested commands
   - Review file changes before committing

3. **Session Management**
   - Clear conversation history if it contains sensitive data
   - Don't share exported conversations publicly
   - Log out when using shared computers

---

## Security Audit Checklist

- [ ] Validate all user input
- [ ] Sanitize file paths
- [ ] Verify postMessage origins
- [ ] Escape shell commands
- [ ] Use secure storage for secrets
- [ ] Log security-relevant events
- [ ] Rate limit API calls
- [ ] Handle errors securely
- [ ] Review MCP configurations
- [ ] Audit permission patterns

---

## Reporting Security Issues

If you discover a security vulnerability, please report it responsibly:

1. **Do not** open a public issue
2. Email details to the maintainers
3. Include steps to reproduce
4. Allow time for a fix before disclosure

---

## References

- [VS Code Extension Security](https://code.visualstudio.com/api/extension-guides/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
