# Extension Services Documentation

## Overview

The extension layer consists of four core services that handle all backend functionality.

## ClaudeService

**Location:** `src/extension/services/ClaudeService.ts`

**Purpose:** Direct communication with Claude CLI via stdin/stdout JSON streaming.

### Properties

```typescript
private _process: cp.ChildProcess | undefined;
private _abortController: AbortController | undefined;
private _sessionId: string | undefined;
private _isWslProcess: boolean = false;
private _pendingPermissionRequests: Map<string, PendingPermissionRequest>;
```

### Event Emitters

| Emitter | Purpose |
|---------|---------|
| `_messageEmitter` | JSON stream data from Claude |
| `_processEndEmitter` | Process termination |
| `_errorEmitter` | Process errors |
| `_permissionRequestEmitter` | Permission requests from Claude |

### Core Methods

#### sendMessage()

```typescript
async sendMessage(
  message: string,
  options: {
    cwd?: string;
    planMode?: boolean;
    yoloMode?: boolean;
    model?: string;
    mcpConfigPath?: string;
  }
): Promise<void>
```

**CLI Arguments:**
- `--output-format stream-json`
- `--input-format stream-json`
- `--verbose`
- `--permission-prompt-tool stdio`
- `--dangerously-skip-permissions` (if yoloMode)
- `--permission-mode plan` (if planMode)
- `--model <model-name>` (if specified)
- `--resume <sessionId>` (if resuming)
- `--mcp-config <path>` (if provided)

**Message Format:**
```typescript
const userMessage = {
  type: 'user',
  session_id: this._sessionId || '',
  message: {
    role: 'user',
    content: [{ type: 'text', text: message }]
  },
  parent_tool_use_id: null
};
```

#### sendPermissionResponse()

```typescript
sendPermissionResponse(
  requestId: string,
  approved: boolean,
  alwaysAllow?: boolean
): void
```

Sends control response back to Claude CLI:
```typescript
{
  type: 'control_response',
  request_id: requestId,
  permissions: {
    allow: approved,
    updated_permissions: alwaysAllow ? [...] : undefined
  }
}
```

#### stopProcess()

```typescript
async stopProcess(): Promise<void>
```

Gracefully terminates Claude process:
- WSL: Uses `taskkill` on Windows
- Native: Uses `process.kill()`
- Aborts via AbortController
- Closes stdin

### WSL Support

```typescript
// Path conversion
convertToWslPath(windowsPath: string): string
// C:\Users\name\project → /mnt/c/Users/name/project

// Command execution
wsl -d Ubuntu bash -ic "claude --output-format stream-json ..."
```

---

## ConversationService

**Location:** `src/extension/services/ConversationService.ts`

**Purpose:** Persistent storage and retrieval of conversations.

### Data Structures

```typescript
interface ConversationMessage {
  type: string;
  data?: any;
  timestamp?: string;
  [key: string]: unknown;
}

interface Conversation {
  sessionId: string;
  startTime?: string;
  endTime: string;
  messageCount: number;
  totalCost: number;
  totalTokens: { input: number; output: number };
  messages: ConversationMessage[];
  filename: string;
}

interface ConversationIndexEntry {
  filename: string;
  sessionId: string;
  startTime: string;
  endTime: string;
  messageCount: number;
  totalCost: number;
  firstUserMessage: string;
  lastUserMessage: string;
}
```

### Storage Location

```
${storageUri}/conversations/
├── conversation-2025-01-15T10-30-45-123Z.json
├── conversation-2025-01-15T11-15-22-456Z.json
└── ...
```

Index stored in workspace state: `claude.conversationIndex`

### Core Methods

```typescript
// Save current conversation
async saveCurrentConversation(options: SaveConversationOptions): Promise<void>

// Load conversation by filename
loadConversation(filename: string): Conversation | undefined

// Add message to current conversation
addMessage(message: ConversationMessage): void

// Clear current conversation
clearCurrentConversation(): void

// Get conversation index
getConversationIndex(): ConversationIndexEntry[]

// Get latest conversation
getLatestConversation(): ConversationIndexEntry | undefined

// Delete conversation
deleteConversation(filename: string): Promise<void>
```

---

## PermissionService

**Location:** `src/extension/services/PermissionService.ts`

**Purpose:** Pre-approval system for tools and commands.

### Data Structure

```typescript
interface Permissions {
  alwaysAllow: Record<string, boolean | string[]>;
}

// Example:
{
  "Bash": ["npm install *", "git add *"],
  "ReadFile": true,
  "WriteFile": false
}
```

### Storage Location

```
${storageUri}/permissions/permissions.json
```

### Pattern Matching

**Supported Patterns:**
```typescript
// Package managers
['npm', 'install', 'npm install *'],
['yarn', 'add', 'yarn add *'],
['pnpm', 'add', 'pnpm add *'],

// Version control
['git', 'add', 'git add *'],
['git', 'commit', 'git commit *'],
['git', 'push', 'git push *'],

// Containerization
['docker', 'run', 'docker run *'],
['docker', 'build', 'docker build *'],

// Build tools
['make', 'make *'],
['cargo', 'build', 'cargo build *'],
```

**Wildcard Matching:**
```typescript
// Pattern "npm install *" matches:
// - "npm install express"
// - "npm install lodash@latest"
// - "npm install --save-dev typescript"
```

### Core Methods

```typescript
// Check if tool is pre-approved
async isToolPreApproved(toolName: string, input: Record): Promise<boolean>

// Save permission decision
async savePermission(toolName: string, input: Record): Promise<void>

// Add new permission
async addPermission(toolName: string, command: string | null): Promise<void>

// Remove permission
async removePermission(toolName: string, command: string | null): Promise<void>

// Get all permissions
async getPermissions(): Promise<Permissions>
```

---

## MCPService

**Location:** `src/extension/services/MCPService.ts`

**Purpose:** MCP (Model Context Protocol) server configuration management.

### Data Structure

```typescript
interface MCPServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
}

interface MCPConfig {
  mcpServers: Record<string, MCPServerConfig>;
}
```

### Storage Location

```
${storageUri}/mcp/mcp-servers.json
```

### Core Methods

```typescript
// Initialize configuration
async initializeConfig(): Promise<void>

// Load all servers
loadServers(): Record<string, MCPServerConfig>

// Save server configuration
async saveServer(name: string, config: MCPServerConfig): Promise<void>

// Delete server
async deleteServer(name: string): Promise<void>

// Update server
async updateServer(name: string, partialConfig: Partial<MCPServerConfig>): Promise<void>

// Check if server exists
hasServer(name: string): boolean

// Get config file path (with WSL conversion if needed)
getConfigPath(): string
```

### WSL Path Conversion

```typescript
convertToWSLPath(windowsPath: string): string
// C:\Users\name\config.json → /mnt/c/Users/name/config.json
```

---

## PanelProvider

**Location:** `src/extension/webview/PanelProvider.ts`

**Purpose:** Core UI logic, message routing, and state management.

### Session State

```typescript
private _totalCost: number = 0;
private _totalTokensInput: number = 0;
private _totalTokensOutput: number = 0;
private _totalCacheReadTokens: number = 0;
private _totalCacheCreationTokens: number = 0;
private _requestCount: number = 0;
private _isProcessing: boolean = false;
private _hasOpenOutput: boolean = false;
private _draftMessage: string = '';
private _selectedModel: string;
private _subscriptionType: string | undefined;
```

### Webview Dual Support

```typescript
private _panel: vscode.WebviewPanel | undefined;      // Editor area
private _webview: vscode.Webview | undefined;         // Sidebar
private _webviewView: vscode.WebviewView | undefined; // Sidebar view
```

### Message Routing

**Webview → Extension:**

| Message Type | Handler |
|--------------|---------|
| `sendMessage` | `_sendMessageToClaude()` |
| `startSession` | `newSession()` |
| `endSession` | `claudeService.stopProcess()` |
| `clearConversation` | `newSession()` |
| `getConversationList` | `_sendConversationList()` |
| `loadConversation` | `loadConversation(filename)` |
| `deleteConversation` | `_deleteConversation(filename)` (NEW) |
| `getSettings` | `_sendCurrentSettings()` |
| `saveSettings` | `_updateSettings()` |
| `selectModel` | `_setSelectedModel()` |
| `openFile` | `_openFileInEditor()` |
| `openDiff` | `_openDiffEditor()` |
| `permissionResponse` | `claudeService.sendPermissionResponse()` |
| `copyToClipboard` | `vscode.env.clipboard.writeText()` |
| `getPermissions` | `_sendPermissions()` |
| `loadMCPServers` | `_loadMCPServers()` |
| `saveMCPServer` | `mcpService.saveServer()` |
| `deleteMCPServer` | `mcpService.deleteServer()` |
| `openExternal` | `vscode.env.openExternal(url)` (NEW) |
| `showInfo` | `vscode.window.showInformationMessage()` (NEW) |
| `showError` | `vscode.window.showErrorMessage()` (NEW) |
| `telemetry` | `_handleTelemetry()` (NEW) |

**Extension → Webview:**

| Message Type | Purpose |
|--------------|---------|
| `sessionInfo` | Session ID, tools, MCP servers |
| `accountInfo` | Subscription details |
| `output` | Assistant text response |
| `thinking` | Extended thinking content |
| `toolUse` | Tool execution request |
| `toolResult` | Tool execution result |
| `updateTokens` | Token usage update |
| `updateTotals` | Cumulative totals |
| `permissionRequest` | Permission prompt |
| `setProcessing` | Processing state |
| `error` | Error message |
| `settingsUpdate` | Settings changed |
| `restoreState` | Restore saved state |
| `conversationList` | List of saved conversations (NEW) |
| `conversationDeleted` | Confirmation of deletion (NEW) |

### Conversation Management Handlers

```typescript
// Send list of saved conversations to webview
async _sendConversationList(): Promise<void> {
  const index = this.conversationService.getConversationIndex();
  const conversations = index.map(entry => ({
    filename: entry.filename,
    timestamp: entry.endTime,
    preview: entry.firstUserMessage?.slice(0, 100) || 'No preview',
    messageCount: entry.messageCount,
    sessionId: entry.sessionId,
    totalCost: entry.totalCost
  }));
  this._postMessage({ type: 'conversationList', conversations });
}

// Load a saved conversation and hydrate chat state
async loadConversation(filename: string): Promise<void> {
  const conversation = this.conversationService.loadConversation(filename);
  if (conversation) {
    // Convert to ChatMessage[] format
    // Send to webview for hydration
    this._postMessage({
      type: 'restoreState',
      state: { messages, sessionId, totalCost, totalTokens }
    });
  }
}

// Delete a saved conversation
async _deleteConversation(filename: string): Promise<void> {
  await this.conversationService.deleteConversation(filename);
  this._postMessage({ type: 'conversationDeleted', filename });
}
```

### Thinking Mode

```typescript
const intensityPrefixes = {
  'think': 'THINK',
  'think-hard': 'THINK HARD',
  'think-harder': 'THINK HARDER',
  'ultrathink': 'ULTRATHINK'
};

// Message transformation:
actualMessage = `${prefix} THROUGH THIS STEP BY STEP: \n${message}`;
```

---

## WebviewProvider

**Location:** `src/extension/webview/WebviewProvider.ts`

**Purpose:** Sidebar webview integration (delegates to PanelProvider).

### Lifecycle

```typescript
resolveWebviewView(webviewView, _context, _token): void {
  // Enable scripts
  webviewView.webview.options = { enableScripts: true };

  // Delegate to PanelProvider
  this._panelProvider.showInWebview(webviewView.webview, webviewView);

  // Handle visibility changes
  webviewView.onDidChangeVisibility(() => {
    if (webviewView.visible) {
      this._panelProvider.closeMainPanel();
      this._panelProvider.reinitializeWebview();
    }
  });
}
```

### Panel Conflict Management

Only one UI active at a time:
- When sidebar becomes visible → Close editor panel
- When editor panel opens → Sidebar remains but inactive
