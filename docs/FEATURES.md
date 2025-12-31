# Claude Code GUI - Feature Specification

## Overview

This document specifies all features to be implemented in the claude-code-gui VSCode extension. Features are organized by category with detailed implementation requirements.

---

## 1. Chat Interface Features

### 1.1 Message Display

**Description**: Render chat messages with proper formatting and visual hierarchy.

**Requirements**:
- [ ] Display user messages with "You" header and user icon
- [ ] Display Claude responses with "Claude" header and AI icon
- [ ] Support streaming text display (character-by-character or chunk-based)
- [ ] Render markdown content with proper formatting
  - Headings, bold, italic, links
  - Code blocks with syntax highlighting
  - Lists (ordered and unordered)
  - Tables
  - Blockquotes
- [ ] Code blocks with:
  - Language detection and syntax highlighting
  - Copy button with clipboard feedback
  - Language label badge
  - Line numbers (optional toggle)
- [ ] Error messages with distinct styling and icon
- [ ] System messages for status updates
- [ ] Message timestamps (optional, on hover)
- [ ] Copy entire message button

**Components**:
```
MessageList.tsx
+-- Message.tsx
    +-- MessageHeader.tsx
    +-- MessageContent.tsx
    +-- CodeBlock.tsx
    +-- CopyButton.tsx
```

### 1.2 Message Input

**Description**: Rich text input area for composing messages.

**Requirements**:
- [ ] Auto-resizing textarea (min 1 row, max configurable)
- [ ] Keyboard shortcuts:
  - Enter to send (configurable)
  - Shift+Enter for newline
  - Ctrl+Enter alternative send (configurable)
  - Up arrow to edit last message
  - Escape to clear input
- [ ] Character/word count display (optional)
- [ ] Paste handling for text and images
- [ ] Draft auto-save between sessions
- [ ] Input disabled state during processing
- [ ] Placeholder text with helpful hints

**Components**:
```
InputContainer.tsx
+-- MessageInput.tsx (textarea)
+-- InputControls.tsx
    +-- AttachmentBar.tsx
    +-- SendButton.tsx
```

### 1.3 Smart Scrolling

**Description**: Intelligent auto-scroll behavior during message streaming.

**Requirements**:
- [ ] Auto-scroll to bottom when new content arrives
- [ ] Disable auto-scroll when user scrolls up (threshold detection)
- [ ] Re-enable auto-scroll when user scrolls to bottom
- [ ] "Jump to bottom" button when scrolled up
- [ ] Smooth scroll animation for manual jumps
- [ ] Preserve scroll position on window resize

**Hook**: `useAutoScroll.ts`

### 1.4 Conversation History

**Description**: Browse and restore previous chat sessions.

**Requirements**:
- [ ] List all saved conversations
- [ ] Display metadata:
  - First/last user message preview
  - Start/end timestamps
  - Message count
  - Token usage and cost
- [ ] Search/filter conversations
- [ ] Load conversation into current view
- [ ] Delete individual conversations
- [ ] Export conversation (markdown, JSON)
- [ ] Session ID display

**Components**:
```
ConversationHistoryModal.tsx
+-- ConversationList.tsx
    +-- ConversationItem.tsx
+-- ConversationSearch.tsx
```

### 1.5 New Session Management

**Description**: Start fresh conversations while preserving history.

**Requirements**:
- [ ] "New Chat" button in header
- [ ] Confirmation if current session has unsent draft
- [ ] Clear message display
- [ ] Generate new session ID
- [ ] Preserve settings and preferences
- [ ] Optional: Compact current session before starting new

---

## 2. Tool Execution Visualization

### 2.1 Tool Use Display

**Description**: Visual representation of Claude executing tools.

**Requirements**:
- [ ] Collapsible tool execution card
- [ ] Tool name with icon (wrench icon)
- [ ] Tool-specific formatting:
  - **Bash**: Command with syntax highlighting
  - **Read**: File path with icon
  - **Write/Edit**: File path with diff preview
  - **Glob/Grep**: Search pattern display
  - **TodoWrite**: Formatted todo list
  - **WebSearch/WebFetch**: URL display
- [ ] Input parameters (expandable for long content)
- [ ] Execution status indicator (pending, running, complete, error)
- [ ] Duration timer while executing

**Components**:
```
ToolExecution.tsx
+-- ToolHeader.tsx
+-- ToolInput.tsx
    +-- BashInput.tsx
    +-- FileInput.tsx
    +-- EditInput.tsx
    +-- SearchInput.tsx
    +-- TodoInput.tsx
```

### 2.2 Tool Result Display

**Description**: Show outcomes of tool executions.

**Requirements**:
- [ ] Success/error status indication
- [ ] Truncation for long results with "Show more" button
- [ ] Syntax highlighting for code results
- [ ] Error messages with clear formatting
- [ ] Hidden results for certain tools (Read, TodoWrite success)
- [ ] File content diffs for edit operations

**Components**:
```
ToolResult.tsx
+-- ResultContent.tsx
+-- ExpandableResult.tsx
```

### 2.3 Diff Viewer

**Description**: Inline diff visualization for file modifications.

**Requirements**:
- [ ] Side-by-side or unified diff view
- [ ] Syntax highlighting preserved
- [ ] Line number gutter
- [ ] Added/removed/modified line highlighting
- [ ] "Open in VSCode Diff" button
- [ ] Context lines around changes
- [ ] File path header with action buttons
- [ ] Preview before tool result (show expected changes)
- [ ] Update after tool result (show actual changes)

**Components**:
```
DiffViewer.tsx
+-- DiffHeader.tsx
+-- DiffLine.tsx
+-- DiffGutter.tsx
```

### 2.4 Multi-Edit Support

**Description**: Handle MultiEdit tool with multiple changes in one file.

**Requirements**:
- [ ] Display each edit block separately
- [ ] Combined diff view option
- [ ] Individual edit status
- [ ] Navigation between edits

---

## 3. Permission Management

### 3.1 Permission Request UI

**Description**: Interactive approval/denial interface for tool permissions.

**Requirements**:
- [ ] Modal or inline permission card
- [ ] Tool name and description
- [ ] Input parameters preview
- [ ] Decision reason (if provided by Claude)
- [ ] Action buttons:
  - Approve (this time)
  - Always Allow (add to permissions)
  - Deny
- [ ] Timeout indicator (optional)
- [ ] Suggestion chips from Claude

**Components**:
```
PermissionRequest.tsx
+-- PermissionDetails.tsx
+-- PermissionActions.tsx
+-- SuggestionChips.tsx
```

### 3.2 Permission Management Settings

**Description**: Configure always-allowed permissions.

**Requirements**:
- [ ] List all allowed permissions
- [ ] Group by tool type
- [ ] Command patterns for Bash
- [ ] Add new permission:
  - Tool type selector
  - Command pattern input (for Bash)
- [ ] Remove individual permissions
- [ ] Import/export permissions
- [ ] Scope indicators (global vs project)

**Components**:
```
PermissionList.tsx
+-- PermissionItem.tsx
+-- AddPermissionForm.tsx
```

### 3.3 Yolo Mode

**Description**: Auto-approve all permission requests.

**Requirements**:
- [ ] Toggle in settings
- [ ] Persistent warning banner when active
- [ ] Confirmation dialog to enable
- [ ] Quick disable from status bar
- [ ] Log all auto-approved actions

**Components**:
```
YoloModeToggle.tsx
YoloModeWarning.tsx
```

---

## 4. MCP Server Configuration

### 4.1 MCP Server List

**Description**: View and manage configured MCP servers.

**Requirements**:
- [ ] List all configured servers from .mcp.json
- [ ] Server status indicators (connected, disconnected, error)
- [ ] Server type badge (stdio, http, sse)
- [ ] Available tools count per server
- [ ] Enable/disable individual servers

**Components**:
```
MCPServersModal.tsx
+-- MCPServerList.tsx
    +-- MCPServerItem.tsx
```

### 4.2 Add MCP Server

**Description**: Configure new MCP servers.

**Requirements**:
- [ ] Server name input
- [ ] Server type selection (stdio, http, sse)
- [ ] Type-specific configuration:
  - **stdio**: Command, arguments, environment variables
  - **http/sse**: URL, headers
- [ ] Validation before save
- [ ] Test connection button
- [ ] Popular servers quick-add:
  - Context7
  - Sequential Thinking
  - Memory
  - Puppeteer
  - Fetch
  - Filesystem

**Components**:
```
AddServerForm.tsx
+-- ServerTypeSelector.tsx
+-- StdioConfig.tsx
+-- HttpConfig.tsx
+-- PopularServers.tsx
```

### 4.3 Edit/Delete MCP Server

**Description**: Modify or remove existing servers.

**Requirements**:
- [ ] Edit all server properties
- [ ] Delete with confirmation
- [ ] Restart server after changes

---

## 5. Session Management

### 5.1 Session State

**Description**: Maintain and display session information.

**Requirements**:
- [ ] Session ID display
- [ ] Session status badge
- [ ] Resume previous session
- [ ] Session persistence across reloads
- [ ] Multiple active sessions (future)

**Components**:
```
SessionBadge.tsx
SessionStatus.tsx
```

### 5.2 Token & Cost Tracking

**Description**: Monitor token usage and API costs.

**Requirements**:
- [ ] Current request tokens (input/output)
- [ ] Session total tokens
- [ ] Estimated cost display (API users)
- [ ] Usage limits indicator (subscription users)
- [ ] Token count in status bar
- [ ] Detailed breakdown on hover
- [ ] Cost/usage command shortcuts

**Components**:
```
TokenDisplay.tsx
CostIndicator.tsx
UsageTooltip.tsx
```

### 5.3 Processing Indicator

**Description**: Visual feedback during Claude processing.

**Requirements**:
- [ ] Animated spinner/dots
- [ ] Elapsed time counter
- [ ] Status text (processing, thinking, executing)
- [ ] Stop button
- [ ] Progress estimation (if available)

**Components**:
```
ProcessingIndicator.tsx
StopButton.tsx
ElapsedTimer.tsx
```

---

## 6. Model Selection

### 6.1 Model Selector

**Description**: Choose Claude model for conversation.

**Requirements**:
- [ ] Current model display in input area
- [ ] Dropdown/modal selector
- [ ] Available models:
  - Opus (most capable)
  - Sonnet (balanced)
  - Default (user configured)
- [ ] Model description/capabilities
- [ ] Session-scoped override
- [ ] Configure default (opens terminal)

**Components**:
```
ModelSelector.tsx
ModelSelectorModal.tsx
+-- ModelOption.tsx
```

---

## 7. Thinking Modes

### 7.1 Plan Mode

**Description**: Request Claude to plan before executing.

**Requirements**:
- [ ] Toggle switch in input area
- [ ] Persisted preference
- [ ] Visual indicator when active
- [ ] CLI flag: `--plan`

**Components**:
```
ModeToggle.tsx (shared)
```

### 7.2 Thinking Mode

**Description**: Enable extended thinking output.

**Requirements**:
- [ ] Toggle switch in input area
- [ ] Intensity selector modal:
  - Think (default)
  - Think Hard
  - Think Harder
  - Ultrathink
- [ ] Persisted intensity preference
- [ ] Thinking block display in messages
- [ ] Collapsible thinking content
- [ ] CLI flag based on intensity

**Components**:
```
ThinkingModeToggle.tsx
ThinkingIntensityModal.tsx
ThinkingBlock.tsx
```

---

## 8. Slash Commands

### 8.1 Built-in Commands

**Description**: Claude CLI slash commands.

**Requirements**:
- [ ] Searchable command list modal
- [ ] Command categories:
  - Session: /clear, /compact, /rewind
  - Configuration: /config, /model, /permissions
  - Info: /help, /cost, /usage, /status
  - Auth: /login, /logout
  - Tools: /mcp, /agents
  - Development: /bug, /doctor, /init
- [ ] Command descriptions
- [ ] Opens in VSCode terminal
- [ ] Quick command input field

**Components**:
```
SlashCommandsModal.tsx
+-- CommandSection.tsx
+-- CommandItem.tsx
+-- QuickCommandInput.tsx
```

### 8.2 Custom Commands (Snippets)

**Description**: User-defined prompt snippets.

**Requirements**:
- [ ] Create custom slash commands
- [ ] Command name (e.g., /my-command)
- [ ] Prompt template
- [ ] Edit/delete custom commands
- [ ] Built-in snippets:
  - /performance-analysis
  - /security-review
  - /implementation-review
  - /code-explanation
  - /bug-fix
  - /refactor
  - /test-generation
  - /documentation
- [ ] Insert into message input

**Components**:
```
CustomSnippetForm.tsx
SnippetList.tsx
```

---

## 9. File & Image Attachments

### 9.1 File Reference (@)

**Description**: Reference project files in messages.

**Requirements**:
- [ ] @ button trigger
- [ ] File picker modal
- [ ] Workspace file search
- [ ] Recently used files
- [ ] File type icons
- [ ] Selected file badges in input
- [ ] Remove attachment button
- [ ] Multiple file selection

**Components**:
```
FilePickerModal.tsx
+-- FileSearch.tsx
+-- FileList.tsx
+-- FileItem.tsx
AttachmentBadge.tsx
```

### 9.2 Image Attachment

**Description**: Attach images to messages.

**Requirements**:
- [ ] Image button trigger
- [ ] File picker (image filter)
- [ ] Drag & drop support
- [ ] Paste from clipboard
- [ ] Image preview thumbnail
- [ ] Remove attachment
- [ ] Supported formats: PNG, JPG, GIF, WebP
- [ ] Base64 encoding for transfer

**Components**:
```
ImagePicker.tsx
ImagePreview.tsx
DropZone.tsx
```

---

## 10. WSL Support

### 10.1 WSL Configuration

**Description**: Windows Subsystem for Linux integration.

**Requirements**:
- [ ] WSL enable toggle
- [ ] Distribution selection
- [ ] Node.js path in WSL
- [ ] Claude path in WSL
- [ ] Path validation
- [ ] Auto-detect WSL availability
- [ ] Windows platform detection
- [ ] WSL-specific process spawning

**Components**:
```
WSLSettings.tsx
+-- DistroSelector.tsx
+-- PathInput.tsx
```

### 10.2 WSL Alert

**Description**: Prompt Windows users about WSL option.

**Requirements**:
- [ ] One-time alert for Windows users
- [ ] Quick enable button
- [ ] Dismiss and remember
- [ ] Settings link

**Components**:
```
WSLAlert.tsx
```

---

## 11. Additional Features

### 11.1 Installation Assistant

**Description**: Help users install Claude CLI.

**Requirements**:
- [ ] Detect missing CLI
- [ ] Installation modal
- [ ] One-click install command
- [ ] Progress indicator
- [ ] Success confirmation
- [ ] Documentation link

**Components**:
```
InstallModal.tsx
+-- InstallProgress.tsx
+-- InstallSuccess.tsx
```

### 11.2 Settings Modal

**Description**: Centralized extension settings.

**Requirements**:
- [ ] WSL configuration section
- [ ] Permissions section
- [ ] Display preferences
- [ ] Keyboard shortcuts reference
- [ ] Reset to defaults

**Components**:
```
SettingsModal.tsx
+-- SettingsSection.tsx
+-- SettingsItem.tsx
```

### 11.3 Keyboard Shortcuts

**Description**: Keyboard navigation and shortcuts.

**Requirements**:
- [ ] Cmd/Ctrl+Shift+C: Open chat
- [ ] Cmd/Ctrl+Enter: Send message
- [ ] Escape: Close modals
- [ ] Cmd/Ctrl+K: Clear chat
- [ ] Cmd/Ctrl+/: Show shortcuts
- [ ] Tab navigation in modals

**Hook**: `useKeyboardShortcuts.ts`

### 11.4 Theme Integration

**Description**: Match VSCode theme.

**Requirements**:
- [ ] Read VSCode CSS variables
- [ ] Light/dark mode support
- [ ] High contrast support
- [ ] Custom accent colors
- [ ] Semantic color tokens

**Implementation**:
```css
:root {
  --background: var(--vscode-editor-background);
  --foreground: var(--vscode-editor-foreground);
  --primary: var(--vscode-button-background);
  /* ... more mappings */
}
```

### 11.5 Status Bar Integration

**Description**: Extension status in VSCode status bar.

**Requirements**:
- [ ] "Claude" status bar item
- [ ] Click to open chat
- [ ] Processing indicator
- [ ] Token count display
- [ ] Tooltip with details

---

## Implementation Priority

### Phase 1: Core Chat (MVP)
1. Message display (text, code blocks)
2. Message input with send
3. Claude CLI integration (spawn, stream parse)
4. Basic error handling
5. Status indicator

### Phase 2: Tool Visualization
1. Tool use display
2. Tool result display
3. Basic diff viewer
4. Permission requests

### Phase 3: Settings & Config
1. Settings modal
2. MCP server management
3. Model selection
4. Mode toggles (plan, thinking)

### Phase 4: Enhanced Features
1. Conversation history
2. File attachments
3. Image attachments
4. Slash commands
5. Custom snippets

### Phase 5: Platform & Polish
1. WSL support
2. Keyboard shortcuts
3. Theme polish
4. Performance optimization
5. Accessibility improvements

---

## Testing Strategy

### Unit Tests
- Store actions and reducers
- Utility functions
- Component logic (hooks)

### Integration Tests
- Message flow (send -> display)
- CLI process lifecycle
- Permission flow

### E2E Tests
- Full conversation flow
- Settings persistence
- File operations

### Manual Testing
- Cross-platform (Windows, Mac, Linux)
- Theme compatibility
- Extension lifecycle (install, update, uninstall)
