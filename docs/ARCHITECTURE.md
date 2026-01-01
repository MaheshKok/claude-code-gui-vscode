# Claude Code GUI - System Architecture

## High-Level System Architecture

```
+-----------------------------------------------------------------------------------+
|                              VSCode Extension Host                                 |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  +---------------------------+     +------------------------------------------+   |
|  |   Extension Entry Point   |     |           Webview Panel                  |   |
|  |      (extension.ts)       |     |     (React + Vite + TailwindCSS)         |   |
|  +---------------------------+     +------------------------------------------+   |
|            |                                    |                                  |
|            v                                    v                                  |
|  +---------------------------+     +------------------------------------------+   |
|  |    ClaudeCodeService      |<--->|        WebviewBridge                     |   |
|  |  (CLI Process Manager)    |     |    (postMessage API)                     |   |
|  +---------------------------+     +------------------------------------------+   |
|            |                                    |                                  |
|            v                                    v                                  |
|  +---------------------------+     +------------------------------------------+   |
|  |   StreamJsonParser        |     |         React Application                 |   |
|  | (NDJSON Event Handler)    |     |                                          |   |
|  +---------------------------+     |  +-------------+  +-------------------+  |   |
|            |                       |  | Zustand     |  | Component Tree    |  |   |
|            v                       |  | Store       |  |                   |  |   |
|  +---------------------------+     |  +-------------+  +-------------------+  |   |
|  |    PermissionManager      |     |        |                |               |   |
|  +---------------------------+     |        v                v               |   |
|            |                       |  +-------------+  +-------------------+  |   |
|  +---------------------------+     |  | Hooks       |  | UI Components     |  |   |
|  |    SessionManager         |     |  | Layer       |  | (TailwindCSS)     |  |   |
|  +---------------------------+     |  +-------------+  +-------------------+  |   |
|            |                       +------------------------------------------+   |
|            v                                                                      |
|  +---------------------------+                                                    |
|  |    Claude CLI Process     |                                                    |
|  |  (stream-json I/O)        |                                                    |
|  +---------------------------+                                                    |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

## Component Hierarchy

### Extension Layer (Node.js / TypeScript)

```
extension/
+-- Extension                           # Main VSCode extension entry
|   +-- ClaudeChatProvider              # Main panel provider
|   +-- ClaudeChatWebviewProvider       # Sidebar webview provider
|   +-- DiffContentProvider             # Read-only diff document provider
|
+-- Services/
|   +-- ClaudeCodeService               # CLI process lifecycle management
|   |   +-- spawn()                     # Start claude process
|   |   +-- send()                      # Write to stdin
|   |   +-- stop()                      # Abort running process
|   |   +-- onEvent()                   # Event emitter for stream events
|   |
|   +-- StreamJsonParser                # NDJSON stdout parser
|   |   +-- parse()                     # Line-by-line JSON parsing
|   |   +-- buffer                      # Incomplete line buffer
|   |
|   +-- PermissionService               # Tool permission management
|   |   +-- checkPermission()           # Check if tool is pre-approved
|   |   +-- addPermission()             # Add always-allow rule
|   |   +-- removePermission()          # Remove permission rule
|   |   +-- respondToRequest()          # Send control_response
|   |
|   +-- SessionService                  # Session & conversation management
|   |   +-- getCurrentSession()         # Get active session ID
|   |   +-- newSession()                # Start fresh session
|   |   +-- loadConversation()          # Restore conversation history
|   |   +-- saveConversation()          # Persist conversation data
|   |
|   +-- MCPConfigService                # MCP server configuration
|   |   +-- loadServers()               # Read .mcp.json
|   |   +-- saveServer()                # Add/update server config
|   |   +-- deleteServer()              # Remove server config
|   |
|   +-- FileService                     # Workspace file operations
|       +-- getWorkspaceFiles()         # List project files
|       +-- readFile()                  # Read file content
|       +-- selectImage()               # Image picker dialog
|
+-- Bridge/
    +-- WebviewBridge                   # postMessage communication layer
        +-- postMessage()               # Send to webview
        +-- onMessage()                 # Handle from webview
        +-- registerHandler()           # Type-safe message handlers
```

### Webview Layer (React + TypeScript)

```
webview/
+-- App.tsx                             # Root component
|
+-- stores/                             # Zustand state management
|   +-- useChatStore.ts                 # Chat messages & session state
|   +-- useSettingsStore.ts             # User preferences & config
|   +-- useUIStore.ts                   # Modal & UI state
|   +-- usePermissionStore.ts           # Permission request state
|
+-- hooks/                              # Custom React hooks
|   +-- useVSCodeAPI.ts                 # VSCode postMessage bridge
|   +-- useStreamHandler.ts             # Process incoming stream events
|   +-- useAutoScroll.ts                # Smart scroll behavior
|   +-- useKeyboardShortcuts.ts         # Keyboard navigation
|   +-- useTheme.ts                     # VSCode theme integration
|   +-- useMarkdown.ts                  # Markdown rendering
|
+-- components/
|   +-- layout/
|   |   +-- Header.tsx                  # Title bar with controls
|   |   +-- StatusBar.tsx               # Connection & token status
|   |   +-- Sidebar.tsx                 # Optional sidebar layout
|   |
|   +-- chat/
|   |   +-- ChatContainer.tsx           # Main chat area
|   |   +-- MessageList.tsx             # Scrollable message container
|   |   +-- Message.tsx                 # Base message component
|   |   +-- UserMessage.tsx             # User input display
|   |   +-- AssistantMessage.tsx        # Claude response display
|   |   +-- ThinkingBlock.tsx           # Extended thinking display
|   |   +-- ToolExecution.tsx           # Tool use visualization
|   |   +-- ToolResult.tsx              # Tool result display
|   |   +-- DiffViewer.tsx              # Inline diff visualization
|   |   +-- CodeBlock.tsx               # Syntax highlighted code
|   |
|   +-- input/
|   |   +-- InputContainer.tsx          # Input area wrapper
|   |   +-- MessageInput.tsx            # Textarea with controls
|   |   +-- ModeToggles.tsx             # Plan/Thinking mode switches
|   |   +-- ModelSelector.tsx           # Model dropdown
|   |   +-- AttachmentBar.tsx           # File/image attachments
|   |   +-- SlashCommandTrigger.tsx     # Slash command button
|   |   +-- SendButton.tsx              # Submit with stop control
|   |
|   +-- modals/
|   |   +-- ModalContainer.tsx          # Modal wrapper
|   |   +-- SettingsModal.tsx           # Extension settings
|   |   +-- MCPServersModal.tsx         # MCP configuration
|   |   +-- ModelSelectorModal.tsx      # Model selection
|   |   +-- SlashCommandsModal.tsx      # Slash commands list
|   |   +-- FilePickerModal.tsx         # File reference picker
|   |   +-- ThinkingIntensityModal.tsx  # Thinking level config
|   |   +-- InstallModal.tsx            # CLI installation prompt
|   |   +-- ConversationHistoryModal.tsx # Past sessions
|   |
|   +-- permissions/
|   |   +-- PermissionRequest.tsx       # Permission approval UI
|   |   +-- PermissionList.tsx          # Allowed permissions list
|   |   +-- YoloModeWarning.tsx         # Auto-approve warning
|   |
|   +-- common/
|       +-- Button.tsx                  # Styled button variants
|       +-- Modal.tsx                   # Base modal component
|       +-- Toggle.tsx                  # Switch component
|       +-- Dropdown.tsx                # Select dropdown
|       +-- Input.tsx                   # Text input
|       +-- Tooltip.tsx                 # Hover tooltips
|       +-- Spinner.tsx                 # Loading indicator
|       +-- Badge.tsx                   # Status badges
|
+-- utils/
    +-- markdown.ts                     # Markdown parser with code blocks
    +-- diff.ts                         # Diff computation utilities
    +-- formatters.ts                   # Data formatting helpers
    +-- clipboard.ts                    # Clipboard operations
    +-- escape.ts                       # HTML/text escaping
```

## Data Flow for Claude CLI Stream-JSON

```
+-------------------+     spawn      +----------------------+
|   User sends      |--------------->|   Claude CLI         |
|   message         |    stdin       |   (child_process)    |
+-------------------+                +----------------------+
                                              |
                                              | stdout (NDJSON)
                                              v
+-------------------+     parse      +----------------------+
| StreamJsonParser  |<---------------|   Line Buffer        |
| (extension.ts)    |                |   (accumulator)      |
+-------------------+                +----------------------+
        |
        | Typed Events
        v
+-------------------+
| Event Router      |
+-------------------+
        |
        +---> system.init          --> sessionInfo message
        +---> system.status        --> compacting message
        +---> system.compact       --> compactBoundary message
        +---> assistant            --> output/thinking/toolUse
        +---> user.tool_result     --> toolResult message
        +---> result               --> updateTotals, sessionInfo
        +---> control_request      --> permissionRequest message
        +---> control_response     --> accountInfo message
        |
        v
+-------------------+     postMessage    +-------------------+
| WebviewBridge     |<------------------>| React Store       |
| (extension.ts)    |                    | (Zustand)         |
+-------------------+                    +-------------------+
                                                 |
                                                 v
                                         +-------------------+
                                         | Component Re-     |
                                         | render            |
                                         +-------------------+
```

### Stream Event Type Mapping

| CLI Event Type     | Subtype/Field               | Webview Message     | React Store Action   |
| ------------------ | --------------------------- | ------------------- | -------------------- |
| `system`           | `init`                      | `sessionInfo`       | `setSession()`       |
| `system`           | `status:compacting`         | `compacting`        | `setCompacting()`    |
| `system`           | `compact_boundary`          | `compactBoundary`   | `resetTokens()`      |
| `assistant`        | `content[type=text]`        | `output`            | `appendMessage()`    |
| `assistant`        | `content[type=thinking]`    | `thinking`          | `appendThinking()`   |
| `assistant`        | `content[type=tool_use]`    | `toolUse`           | `addToolExecution()` |
| `assistant`        | `usage`                     | `updateTokens`      | `updateTokenCount()` |
| `user`             | `content[type=tool_result]` | `toolResult`        | `addToolResult()`    |
| `result`           | `success`                   | `updateTotals`      | `completeRequest()`  |
| `control_request`  | `can_use_tool`              | `permissionRequest` | `addPermission()`    |
| `control_response` | `response.account`          | `accountInfo`       | `setAccount()`       |

## State Management Strategy (Zustand)

### Store Architecture

```typescript
// stores/useChatStore.ts
interface ChatState {
  // Session
  sessionId: string | null;
  isProcessing: boolean;

  // Messages
  messages: Message[];
  pendingToolExecutions: Map<string, ToolExecution>;

  // Tokens
  currentTokens: TokenCount;
  totalTokens: TokenCount;
  totalCost: number;

  // Actions
  addUserMessage: (content: string, attachments?: Attachment[]) => void;
  appendAssistantContent: (content: string) => void;
  addToolExecution: (tool: ToolUse) => void;
  addToolResult: (result: ToolResult) => void;
  setSession: (sessionId: string) => void;
  clearMessages: () => void;
  loadConversation: (messages: Message[]) => void;
}

// stores/useSettingsStore.ts
interface SettingsState {
  // WSL
  wslEnabled: boolean;
  wslDistro: string;
  wslNodePath: string;
  wslClaudePath: string;

  // Modes
  selectedModel: "opus" | "sonnet" | "default";
  planModeEnabled: boolean;
  thinkingModeEnabled: boolean;
  thinkingIntensity: ThinkingIntensity;

  // Permissions
  yoloMode: boolean;
  allowedPermissions: Permission[];

  // Actions
  updateSettings: (partial: Partial<SettingsState>) => void;
  addPermission: (permission: Permission) => void;
  removePermission: (toolName: string, command?: string) => void;
}

// stores/useUIStore.ts
interface UIState {
  // Modals
  activeModal: ModalType | null;

  // Input
  draftMessage: string;
  attachments: Attachment[];

  // Status
  statusText: string;
  isWslAlertDismissed: boolean;

  // Actions
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  setDraftMessage: (text: string) => void;
  addAttachment: (attachment: Attachment) => void;
}

// stores/usePermissionStore.ts
interface PermissionState {
  pendingRequests: PermissionRequest[];

  // Actions
  addRequest: (request: PermissionRequest) => void;
  resolveRequest: (id: string, approved: boolean, alwaysAllow: boolean) => void;
  clearPending: () => void;
}
```

### State Flow

```
User Action
    |
    v
+-------------------+
| Component Event   |
| (onClick, etc.)   |
+-------------------+
    |
    v
+-------------------+     postMessage     +-------------------+
| Zustand Action    |-------------------->| Extension Host    |
| (optimistic)      |                     | (handleMessage)   |
+-------------------+                     +-------------------+
    |                                             |
    v                                             v
+-------------------+                     +-------------------+
| Local State       |                     | Claude CLI        |
| Update            |                     | (if needed)       |
+-------------------+                     +-------------------+
                                                  |
                                                  v
                                          +-------------------+
                                          | Stream Events     |
                                          +-------------------+
                                                  |
                                          postMessage
                                                  |
                                                  v
                                          +-------------------+
                                          | Store Update      |
                                          | (authoritative)   |
                                          +-------------------+
```

## File Structure Overview

```
claude-code-gui/
+-- .vscode/
|   +-- extensions.json                 # Recommended extensions
|   +-- launch.json                     # Debug configuration
|   +-- tasks.json                      # Build tasks
|
+-- docs/
|   +-- ARCHITECTURE.md                 # This file
|   +-- FEATURES.md                     # Feature specifications
|
+-- src/
|   +-- extension/                      # VSCode extension (Node.js)
|   |   +-- index.ts                    # Extension entry point
|   |   +-- providers/
|   |   |   +-- ClaudeChatProvider.ts   # Main panel provider
|   |   |   +-- WebviewProvider.ts      # Sidebar provider
|   |   |   +-- DiffProvider.ts         # Diff content provider
|   |   +-- services/
|   |   |   +-- ClaudeCodeService.ts    # CLI process manager
|   |   |   +-- StreamParser.ts         # NDJSON parser
|   |   |   +-- PermissionService.ts    # Permission handling
|   |   |   +-- SessionService.ts       # Session management
|   |   |   +-- MCPService.ts           # MCP configuration
|   |   |   +-- FileService.ts          # File operations
|   |   +-- bridge/
|   |   |   +-- WebviewBridge.ts        # Message passing
|   |   |   +-- messages.ts             # Message type definitions
|   |   +-- types/
|   |       +-- claude.ts               # Claude CLI types
|   |       +-- events.ts               # Stream event types
|   |       +-- config.ts               # Configuration types
|   |
|   +-- webview/                        # React application
|   |   +-- index.tsx                   # Webview entry point
|   |   +-- App.tsx                     # Root component
|   |   +-- vite-env.d.ts               # Vite type declarations
|   |   +-- stores/                     # Zustand stores
|   |   +-- hooks/                      # Custom hooks
|   |   +-- components/                 # React components
|   |   +-- utils/                      # Utility functions
|   |   +-- types/                      # TypeScript types
|   |   +-- styles/
|   |       +-- index.css               # Tailwind entry
|   |       +-- themes.css              # VSCode theme integration
|   |
|   +-- shared/                         # Shared between extension & webview
|       +-- types/
|       |   +-- messages.ts             # postMessage contracts
|       |   +-- models.ts               # Domain models
|       +-- constants.ts                # Shared constants
|
+-- webview-dist/                       # Vite build output (gitignored)
|
+-- out/                                # TypeScript build output
|
+-- assets/
|   +-- icon.png                        # Extension icon
|   +-- icon-bubble.png                 # Sidebar icon
|
+-- package.json                        # Extension manifest
+-- tsconfig.json                       # TypeScript config (extension)
+-- tsconfig.webview.json               # TypeScript config (webview)
+-- vite.config.ts                      # Vite configuration
+-- tailwind.config.js                  # Tailwind configuration
+-- postcss.config.js                   # PostCSS configuration
+-- .vscodeignore                       # Package exclusions
+-- CHANGELOG.md                        # Version history
+-- LICENSE                             # License file
```

## Key Architectural Decisions

### ADR-001: React with Vite for Webview

**Context**: The webview needs a modern, performant UI framework with excellent DX.

**Decision**: Use React 18 with Vite for the webview layer.

**Rationale**:

- React provides a robust component model and ecosystem
- Vite offers fast HMR for development and optimized production builds
- TypeScript integration is seamless
- Large community and extensive documentation

**Consequences**:

- Need to configure Vite for webview-specific constraints (CSP, base path)
- Bundle size considerations for extension package

### ADR-002: Zustand for State Management

**Context**: The application needs predictable state management across components.

**Decision**: Use Zustand instead of Redux or React Context.

**Rationale**:

- Minimal boilerplate compared to Redux
- TypeScript-first design
- Small bundle size (~1KB gzipped)
- No providers required (works outside React tree)
- Supports middleware (persist, devtools)

**Consequences**:

- Team needs to learn Zustand patterns
- Less ecosystem tooling than Redux

### ADR-003: TailwindCSS for Styling

**Context**: The UI needs to integrate with VSCode themes while being customizable.

**Decision**: Use TailwindCSS with CSS variables for VSCode theme integration.

**Rationale**:

- Utility-first approach enables rapid UI development
- Easy to match VSCode's visual language
- CSS variables allow dynamic theme switching
- Smaller final CSS bundle through purging

**Consequences**:

- HTML can become verbose with utility classes
- Team needs to learn Tailwind conventions

### ADR-004: Separation of Extension and Webview

**Context**: VSCode extensions have distinct runtime contexts.

**Decision**: Maintain strict separation between extension host and webview code.

**Rationale**:

- Extension host runs in Node.js context
- Webview runs in browser-like context with restrictions
- Separation enables independent testing
- Clear contracts via postMessage API

**Consequences**:

- All communication must go through message passing
- Types must be shared between contexts
- Need separate build pipelines

### ADR-005: Stream Processing Architecture

**Context**: Claude CLI outputs newline-delimited JSON that must be parsed in real-time.

**Decision**: Use a streaming parser with event-based architecture.

**Rationale**:

- Enables real-time UI updates as responses stream
- Handles incomplete JSON lines gracefully
- Event-driven design allows loose coupling
- Easy to add new event handlers

**Consequences**:

- Must handle partial JSON lines
- Need robust error handling for malformed data
- UI must handle incremental updates

## Technology Stack Summary

| Layer              | Technology            | Purpose                             |
| ------------------ | --------------------- | ----------------------------------- |
| Extension Host     | Node.js + TypeScript  | VSCode API integration              |
| Process Management | child_process         | Claude CLI spawning                 |
| Webview Framework  | React 18              | Component-based UI                  |
| Build Tool         | Vite                  | Fast development & optimized builds |
| State Management   | Zustand               | Predictable state updates           |
| Styling            | TailwindCSS           | Utility-first CSS                   |
| Type Safety        | TypeScript            | End-to-end type safety              |
| Markdown           | marked + highlight.js | Rich text rendering                 |
| Diff Visualization | diff-match-patch      | Inline change display               |

## Security Considerations

1. **Content Security Policy (CSP)**: Strict CSP in webview to prevent XSS
2. **Input Sanitization**: All user input sanitized before display
3. **Permission Model**: Explicit approval required for tool execution
4. **Credential Handling**: No secrets stored in extension state
5. **WSL Integration**: Path validation for WSL commands
