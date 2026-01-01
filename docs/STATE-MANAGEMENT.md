# State Management Documentation

## Overview

Claude Code GUI uses **Zustand** for state management with 6 specialized stores. Each store handles a specific domain with appropriate persistence strategies.

## Store Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Zustand Stores                                │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Chat Store    │ Settings Store  │       UI Store              │
│  • messages     │ • selectedModel │  • modals                   │
│  • tokens       │ • thinkingMode  │  • sidebar                  │
│  • costs        │ • UISettings    │  • notifications            │
│  • sessions     │ • WSL Config    │  • connection               │
├─────────────────┼─────────────────┼─────────────────────────────┤
│ Conversation    │ Permission      │       MCP Store             │
│    Store        │    Store        │                             │
│ • conversations │ • pending       │  • servers                  │
│ • current       │ • allowed       │  • status                   │
│ • tags/search   │ • denied        │  • tools                    │
└─────────────────┴─────────────────┴─────────────────────────────┘
                           │
                   localStorage persistence
```

## Chat Store

**File:** `src/webview/stores/chatStore.ts`

**Purpose:** Core conversation state with token and cost tracking.

### State Shape

```typescript
interface ChatState {
  messages: ChatMessage[];
  isProcessing: boolean;
  currentSessionId: string | null;
  tokens: {
    current: TokenUsage;
    cumulative: CumulativeTokenUsage;
  };
  costs: {
    sessionCostUsd: number;
    allTimeCostUsd: number;
    breakdown: CostBreakdown;
    lastUpdated: number;
  };
  requestStartTime: number | null;
  numTurns: number;
}

interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens: number;
  cache_creation_input_tokens: number;
}

interface CumulativeTokenUsage {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheReadTokens: number;
  totalCacheCreationTokens: number;
}
```

### Actions

```typescript
// Message Management
addMessage(message: ChatMessage): void
updateMessage(id: string, updates: Partial<ChatMessage>): void
removeMessage(id: string): void
clearMessages(): void

// Session Tracking
setSessionId(sessionId: string | null): void
setProcessing(isProcessing: boolean): void
startRequestTiming(): void
stopRequestTiming(): void
incrementTurns(): void

// Token/Cost Updates
updateTokens(usage: TokenUsage): void
updateCumulativeTokens(usage: Partial<CumulativeTokenUsage>): void
updateSessionCost(costUsd: number): void
resetTokenTracking(): void

// State Reset
resetChat(): void  // Keeps allTimeCostUsd

// Conversation Hydration (NEW)
hydrateConversation(payload: HydratePayload): void
```

### Hydrate Conversation Action

```typescript
// Restores chat state from a saved conversation
interface HydratePayload {
  messages: ChatMessage[];
  sessionId?: string | null;
  totalCost?: number;
  totalTokens?: {
    input: number;
    output: number;
  };
}

hydrateConversation(payload): void
// - Sets messages directly from payload
// - Restores sessionId if provided
// - Resets isProcessing to false
// - Resets requestStartTime to null
// - Calculates numTurns from user messages
// - Restores token cumulative totals
// - Restores sessionCostUsd from totalCost
// - Preserves allTimeCostUsd
```

### Persistence

```typescript
// Only persists all-time costs
partialize: (state) => ({
  costs: { allTimeCostUsd: state.costs.allTimeCostUsd },
});
```

**Storage Key:** `claude-code-gui-store`

---

## Settings Store

**File:** `src/webview/stores/settingsStore.ts`

**Purpose:** Persistent application configuration.

### State Shape

```typescript
interface SettingsState {
  // Model & Claude CLI
  selectedModel: ClaudeModel;
  claudeExecutable: string;

  // Thinking/Planning Modes
  thinkingMode: boolean;
  thinkingIntensity: ThinkingIntensity; // 'think' | 'think-hard' | 'think-harder' | 'ultrathink'
  showThinkingProcess: boolean;
  planMode: boolean;
  yoloMode: boolean;

  // WSL Configuration
  wsl: {
    enabled: boolean;
    distro: string;
    nodePath: string;
    claudePath: string;
  };

  // UI Preferences
  fontSize: number;
  compactMode: boolean;
  showAvatars: boolean;
  showTimestamps: boolean;
  codeBlockTheme:
    | "auto"
    | "github-dark"
    | "github-light"
    | "monokai"
    | "dracula"
    | "one-dark-pro";

  // Context Management
  includeFileContext: boolean;
  includeWorkspaceInfo: boolean;
  maxContextLines: number;
  maxHistorySize: number;

  // Streaming
  streamResponses: boolean;

  // Permissions
  autoApprovePatterns: string[];
}

type ClaudeModel =
  | "claude-sonnet-4-5-20250929"
  | "claude-opus-4-5-20251101"
  | "claude-haiku-4-5-20251001";
```

### Actions

```typescript
// Model Selection
setSelectedModel(model: ClaudeModel): void
setThinkingMode(enabled: boolean): void
setThinkingIntensity(intensity: ThinkingIntensity): void

// Mode Management
togglePlanMode(): void
setPlanMode(enabled: boolean): void
toggleYoloMode(): void
setYoloMode(enabled: boolean): void

// UI Updates
updateUISettings(settings: Partial<UISettings>): void
updateContextSettings(settings: Partial<ContextSettings>): void

// Permissions
addAutoApprovePattern(pattern: string): void
removeAutoApprovePattern(pattern: string): void

// Configuration
updateWSL(config: Partial<WSLConfig>): void
loadFromVSCode(settings: ExtensionSettings): void
resetToDefaults(): void
```

### Selectors

```typescript
selectSelectedModel(state): ClaudeModel
selectThinkingSettings(state): { enabled, intensity, showProcess }
selectUISettings(state): { fontSize, compactMode, ... }
selectContextSettings(state): { includeFileContext, ... }
selectWSL(state): WSLConfig
```

**Storage Key:** `claude-flow-settings-store`

---

## UI Store

**File:** `src/webview/stores/uiStore.ts`

**Purpose:** Runtime UI state (non-persisted).

### State Shape

```typescript
interface UIState {
  // Modal Management
  activeModal: ModalType | null;
  modalProps: Record<string, unknown>;

  // Sidebar
  sidebarOpen: boolean;
  sidebarWidth: number; // 200-500px, default 280

  // Connection State
  connectionStatus: ConnectionStatus;
  connectionError: string | null;

  // Draft & Focus
  draftMessage: string;
  inputFocused: boolean;

  // Notifications
  notifications: Notification[];
  maxVisibleNotifications: number;

  // Display
  isFullscreen: boolean;
  breakpoint: "xs" | "sm" | "md" | "lg" | "xl";
}

type ModalType =
  | "settings"
  | "mcp"
  | "model"
  | "permission"
  | "install"
  | "login"
  | "confirm"
  | "error"
  | "about"
  | "export"
  | "keyboard-shortcuts";

type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error"
  | "reconnecting";
```

### Actions

```typescript
// Modal Management
openModal(type: ModalType, props?: Record<string, unknown>): void
closeModal(): void

// Sidebar Control
toggleSidebar(): void
setSidebarOpen(open: boolean): void
setSidebarWidth(width: number): void  // Clamped 200-500

// Connection
setConnectionStatus(status: ConnectionStatus, error?: string): void

// Draft Management
setDraftMessage(message: string): void
clearDraftMessage(): void

// Notifications
addNotification(notification: Omit<Notification, 'id' | 'createdAt'>): string
removeNotification(id: string): void
clearNotifications(): void
showInfo(title: string, message?: string): void
showSuccess(title: string, message?: string): void
showWarning(title: string, message?: string): void
showError(title: string, message?: string): void

// UI State
setInputFocused(focused: boolean): void
toggleFullscreen(): void
setBreakpoint(breakpoint: Breakpoint): void
```

**No Persistence** - UI state resets on reload.

---

## Conversation Store

**File:** `src/webview/stores/conversationStore.ts`

**Purpose:** Persistent conversation history with search.

### State Shape

```typescript
interface ConversationState {
  conversations: ConversationSummary[];
  currentConversation: Conversation | null;
  isLoading: boolean;
  maxConversations: number; // default 100
}

interface ConversationSummary {
  id: string;
  title: string;
  preview: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  sessionId?: string;
  tags?: string[];
}

interface Conversation {
  summary: ConversationSummary;
  messages: ChatMessage[];
  thread?: ConversationThread;
}
```

### Storage Architecture

```
localStorage:
├── claude-flow-conversation-index     # ConversationSummary[]
├── claude-flow-conv-{id-1}            # Full Conversation
├── claude-flow-conv-{id-2}            # Full Conversation
└── ...
```

### Actions

```typescript
// Conversation Lifecycle
saveConversation(messages: ChatMessage[], title?: string): string
loadConversation(id: string): Promise<boolean>
updateConversation(id: string, messages: ChatMessage[], title?: string): void
deleteConversation(id: string): void
clearCurrentConversation(): void
createConversation(title?: string): string

// Metadata Management
updateTitle(id: string, title: string): void
addTag(id: string, tag: string): void
removeTag(id: string, tag: string): void

// Search & Retrieval
searchConversations(query: string): ConversationSummary[]
getRecentConversations(limit?: number): ConversationSummary[]

// Import/Export
exportConversation(id: string): string | null  // JSON
importConversation(json: string): string | null

// Maintenance
pruneOldConversations(): void  // Keeps maxConversations
```

---

## Permission Store

**File:** `src/webview/stores/permissionStore.ts`

**Purpose:** Tool access control with pattern matching.

### State Shape

```typescript
interface PermissionState {
  pendingPermissions: PermissionRequest[];
  allowedPermissions: AllowedPermission[];
  deniedPatterns: string[];
}

interface AllowedPermission {
  toolName: string;
  pattern?: string;
  scope: "once" | "session" | "always";
  grantedAt: number;
  expiresAt?: number; // For session scope (24h)
}

interface PermissionRequest {
  requestId: string;
  toolUseId: string;
  toolName: string;
  input: ToolInput;
  description: string;
  suggestions: PermissionSuggestion[];
  decisionReason?: string;
  blockedPath?: string;
  timestamp: number;
  status: "pending" | "approved" | "denied" | "expired";
}
```

### Pattern Matching

```typescript
// Glob-style patterns
const matchesPattern = (path: string, pattern: string): boolean => {
  // Supports: *, **, ?
  // Examples:
  //   "*.ts" → matches any .ts file
  //   "/src/**/*.ts" → matches any .ts in src tree
  //   "/src/data/*" → matches files in src/data/
};
```

### Actions

```typescript
// Permission Handling
addPending(request: PermissionRequest): void
resolvePending(requestId: string, decision: 'allow' | 'deny'): void
removePending(requestId: string): void
updatePendingStatus(requestId: string, status: PermissionStatus): void

// Allowed Permissions
addAllowed(permission: AllowedPermission): void
removeAllowed(toolName: string, pattern?: string): void
clearAllowed(): void
clearSessionPermissions(): void

// Denial Management
addDeniedPattern(pattern: string): void
removeDeniedPattern(pattern: string): void

// Queries
isAutoAllowed(toolName: string, input: ToolInput): boolean
isDenied(pattern: string): boolean
getPendingById(requestId: string): PermissionRequest | undefined
hasPendingPermissions: boolean
pendingCount: number
```

### Persistence

```typescript
// Only persists 'always' scoped permissions
partialize: (state) => ({
  allowedPermissions: state.allowedPermissions.filter(
    (p) => p.scope === "always",
  ),
  deniedPatterns: state.deniedPatterns,
});
```

**Storage Key:** `claude-flow-permission-store`

---

## MCP Store

**File:** `src/webview/stores/mcpStore.ts`

**Purpose:** MCP server configuration and status.

### State Shape

```typescript
interface MCPState {
  servers: MCPServerState[];
  selectedServerId: string | null;
}

interface MCPServerConfig {
  id: string;
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  enabled: boolean;
  description?: string;
  icon?: string;
}

interface MCPServerState {
  config: MCPServerConfig;
  status: MCPServerStatus;
  error?: string;
  tools: ToolDefinition[];
  lastConnected?: number;
  retryCount: number;
}

type MCPServerStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error"
  | "disabled";
```

### Actions

```typescript
// Server Management
addServer(config: MCPServerConfig): void
updateServer(id: string, updates: Partial<MCPServerConfig>): void
deleteServer(id: string): void
toggleServer(id: string): void

// Status Management
setServerStatus(id: string, status: MCPServerStatus, error?: string): void
setServerTools(id: string, tools: ToolDefinition[]): void
incrementRetryCount(id: string): void
resetRetryCount(id: string): void
updateLastConnected(id: string): void

// Queries
getServerById(id: string): MCPServerState | undefined
getEnabledServers(): MCPServerState[]
getConnectedServers(): MCPServerState[]
setSelectedServer(id: string | null): void

// Bulk Operations
resetAllServers(): void
importServers(configs: MCPServerConfig[]): void
exportServers(): MCPServerConfig[]
```

### Persistence

```typescript
// Only persists config, resets status/tools on load
partialize: (state) => ({
  servers: state.servers.map((server) => ({
    config: server.config,
    status: "disconnected",
    tools: [],
    retryCount: 0,
  })),
});
```

**Storage Key:** `claude-flow-mcp-store`

---

## Usage Patterns

### Selecting State

```typescript
// Simple selector
const messages = useChatStore((state) => state.messages);

// Pre-defined selector
const thinkingSettings = useSettingsStore(selectThinkingSettings);

// Multiple selections
const { messages, isProcessing } = useChatStore((state) => ({
  messages: state.messages,
  isProcessing: state.isProcessing,
}));
```

### Updating State

```typescript
// Direct action call
useChatStore.getState().addMessage(newMessage);

// In component
const addMessage = useChatStore((state) => state.addMessage);
addMessage(newMessage);
```

### Subscribing to Changes

```typescript
// Auto-updates on state change
function Component() {
  const messages = useChatStore((state) => state.messages);
  // Re-renders when messages change
}

// Manual subscription
const unsubscribe = useChatStore.subscribe(
  (state) => state.messages,
  (messages) => console.log("Messages updated:", messages),
);
```

---

## Persistence Summary

| Store        | Persisted Data             | Storage Key                    |
| ------------ | -------------------------- | ------------------------------ |
| Chat         | `allTimeCostUsd` only      | `claude-code-gui-store`        |
| Settings     | All state                  | `claude-flow-settings-store`   |
| UI           | None                       | -                              |
| Conversation | Index + full conversations | `claude-flow-conversation-*`   |
| Permission   | Always-scope + denied      | `claude-flow-permission-store` |
| MCP          | Config only                | `claude-flow-mcp-store`        |
