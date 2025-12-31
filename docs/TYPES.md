# TypeScript Types Documentation

## Overview

The type system is organized into shared types (used by both extension and webview) and domain-specific types.

## Type Organization

```
src/
├── shared/types/           # Shared between extension & webview
│   └── index.ts            # Core message and settings types
│
└── webview/types/          # Webview-specific types
    ├── index.ts            # Re-exports
    ├── messages.ts         # Chat message types
    ├── state.ts            # Application state types
    ├── claude-events.ts    # Claude CLI event types
    ├── webview-api.ts      # Extension communication types
    └── vscode.d.ts         # VS Code API declarations
```

---

## Claude CLI Event Types

**File:** `src/webview/types/claude-events.ts`

### Base Event

```typescript
interface BaseClaudeEvent {
  type: ClaudeEventType;
}

type ClaudeEventType =
  | 'system'
  | 'assistant'
  | 'user'
  | 'result'
  | 'control_request'
  | 'control_response';
```

### System Events

```typescript
interface SystemInitEvent {
  type: 'system';
  subtype: 'init';
  session_id: string;
  tools: ToolDefinition[];
  mcp_servers: MCPServerInfo[];
}

interface SystemStatusEvent {
  type: 'system';
  subtype: 'status';
  status: 'compacting' | null;
}

interface ToolDefinition {
  name: string;
  description?: string;
  input_schema?: Record<string, unknown>;
}
```

### Assistant Events

```typescript
interface AssistantEvent {
  type: 'assistant';
  message: AssistantMessage;
}

interface AssistantMessage {
  id?: string;
  role: 'assistant';
  content: AssistantContentBlock[];
  usage?: TokenUsage;
  model?: string;
  stop_reason?: 'end_turn' | 'tool_use' | 'max_tokens' | 'stop_sequence';
}

type AssistantContentBlock =
  | TextContentBlock
  | ThinkingContentBlock
  | ToolUseContentBlock;

interface TextContentBlock {
  type: 'text';
  text: string;
}

interface ThinkingContentBlock {
  type: 'thinking';
  thinking: string;
}

interface ToolUseContentBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: ToolInput;
}
```

### Token Usage

```typescript
interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
}
```

### Tool Input Types

```typescript
interface ReadToolInput {
  file_path: string;
  start_line?: number;
  end_line?: number;
}

interface WriteToolInput {
  file_path: string;
  content: string;
}

interface EditToolInput {
  file_path: string;
  old_string: string;
  new_string: string;
}

interface MultiEditToolInput {
  file_path: string;
  edits: Array<{ old_string: string; new_string: string }>;
}

interface BashToolInput {
  command: string;
  cwd?: string;
  timeout?: number;
}

interface TodoWriteToolInput {
  todos: TodoItem[];
}

interface TodoItem {
  id?: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
}
```

### Control Requests (Permissions)

```typescript
interface CanUseToolRequest {
  type: 'control_request';
  subtype: 'can_use_tool';
  request_id: string;
  tool_name: string;
  input: ToolInput;
  tool_use_id: string;
  permission_suggestions?: PermissionSuggestion[];
  decision_reason?: string;
  blocked_path?: string;
}

interface PermissionSuggestion {
  type: 'allow_once' | 'allow_session' | 'allow_always' | 'deny';
  description?: string;
}

type PermissionDecision =
  | 'allow'
  | 'deny'
  | 'allow_session'
  | 'allow_always';
```

### Result Event

```typescript
interface ResultEvent {
  type: 'result';
  subtype: 'success' | 'error';
  session_id: string;
  total_cost_usd: number;
  duration_ms: number;
  num_turns: number;
  is_error: boolean;
  result: string;
}
```

---

## Chat Message Types

**File:** `src/webview/types/messages.ts`

### Message Type System

```typescript
type MessageType =
  | 'user'
  | 'assistant'
  | 'tool_use'
  | 'tool_result'
  | 'thinking'
  | 'error'
  | 'system';

interface BaseMessage {
  id: string;
  type: MessageType;
  timestamp: number;
  isStreaming?: boolean;
}

type ChatMessage =
  | UserMessage
  | AssistantMessage
  | ToolUseMessage
  | ToolResultMessage
  | ThinkingMessage
  | ErrorMessage
  | SystemMessage;
```

### User Messages

```typescript
interface UserMessage extends BaseMessage {
  type: 'user';
  content: string;
  attachments?: MessageAttachment[];
}

interface MessageAttachment {
  type: 'file' | 'image';
  name: string;
  path?: string;
  mimeType?: string;
  size?: number;
  content?: string;  // base64
}
```

### Assistant Messages

```typescript
interface AssistantMessage extends BaseMessage {
  type: 'assistant';
  content: string;
  usage?: TokenUsage;
  model?: string;
  isComplete?: boolean;
}
```

### Tool Messages

```typescript
interface ToolUseMessage extends BaseMessage {
  type: 'tool_use';
  toolUseId: string;
  toolName: string;
  rawInput: ToolInput;
  toolInfo: string;
  status: ToolExecutionStatus;
  fileContentBefore?: string;
  startLine?: number;
  startLines?: number[];  // MultiEdit
  duration?: number;
}

type ToolExecutionStatus =
  | 'pending'
  | 'approved'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'denied';

interface ToolResultMessage extends BaseMessage {
  type: 'tool_result';
  toolUseId: string;
  toolName?: string;
  content: string;
  isError: boolean;
  hidden: boolean;
  fileContentAfter?: string;
  startLine?: number;
  startLines?: number[];
}
```

### Thinking Messages

```typescript
interface ThinkingMessage extends BaseMessage {
  type: 'thinking';
  content: string;
  isExpanded?: boolean;
  isStreaming?: boolean;
}
```

### Error & System Messages

```typescript
interface ErrorMessage extends BaseMessage {
  type: 'error';
  content: string;
  code?: string;
  recoverable?: boolean;
  suggestedAction?: 'retry' | 'login' | 'install' | 'configure' | 'contact_support';
}

interface SystemMessage extends BaseMessage {
  type: 'system';
  content: string;
  severity: 'info' | 'warning' | 'success';
}
```

### Permission Request

```typescript
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
  status: 'pending' | 'approved' | 'denied' | 'expired';
  decision?: PermissionDecision;
}
```

---

## Application State Types

**File:** `src/webview/types/state.ts`

### Session State

```typescript
interface SessionState {
  sessionId: string | null;
  status: 'initializing' | 'active' | 'compacting' | 'error' | 'closed';
  tools: ToolDefinition[];
  mcpServers: MCPServerInfo[];
  account: AccountInfo | null;
  createdAt: number | null;
  lastActivityAt: number | null;
}
```

### Token Tracking

```typescript
interface TokenTrackingState {
  current: TokenUsage;
  cumulative: CumulativeTokenUsage;
  limits: TokenLimits;
  isApproachingLimit: boolean;
}

interface CumulativeTokenUsage {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheReadTokens: number;
  totalCacheCreationTokens: number;
}

interface TokenLimits {
  maxContextTokens: number;
  warningThreshold: number;
  usagePercentage: number;
}
```

### Cost Tracking

```typescript
interface CostTrackingState {
  sessionCostUsd: number;
  allTimeCostUsd: number;
  breakdown: CostBreakdown;
  lastUpdated: number;
}

interface CostBreakdown {
  inputCost: number;
  outputCost: number;
  cacheCost: number;
}
```

### Settings State

```typescript
interface SettingsState {
  theme: ThemeSettings;
  editor: EditorSettings;
  claude: ClaudeSettings;
  permissions: PermissionSettings;
  display: DisplaySettings;
  shortcuts: ShortcutSettings;
}

interface PermissionSettings {
  autoApprove: AutoApproveSettings;
  denyList: string[];
  timeoutMs: number;
  showPrompts: boolean;
}

interface AutoApproveSettings {
  enabled: boolean;
  tools: string[];
  patterns: string[];
  readOperations: boolean;
  projectDirectory: boolean;
}
```

### UI State

```typescript
interface UIState {
  sidebar: SidebarState;
  input: InputState;
  modal: ModalState;
  notifications: NotificationState;
  layout: LayoutState;
}

type ModalType =
  | 'permission'
  | 'install'
  | 'login'
  | 'settings'
  | 'confirm'
  | 'error'
  | 'about';
```

---

## Extension Communication Types

**File:** `src/webview/types/webview-api.ts`

### Extension → Webview

```typescript
type ExtensionToWebviewMessageType =
  | 'sessionInfo'
  | 'accountInfo'
  | 'output'
  | 'thinking'
  | 'toolUse'
  | 'toolResult'
  | 'updateTokens'
  | 'updateTotals'
  | 'compacting'
  | 'compactBoundary'
  | 'permissionRequest'
  | 'setProcessing'
  | 'loading'
  | 'clearLoading'
  | 'error'
  | 'showInstallModal'
  | 'showLoginModal'
  | 'settingsUpdate'
  | 'themeUpdate'
  | 'restoreState';

// Example messages
interface SessionInfoMessage {
  type: 'sessionInfo';
  sessionId: string;
  tools: ToolDefinition[];
  mcpServers: MCPServerInfo[];
}

interface PermissionRequestMessage {
  type: 'permissionRequest';
  requestId: string;
  toolUseId: string;
  toolName: string;
  input: ToolInput;
  description: string;
  suggestions: PermissionSuggestion[];
}
```

### Webview → Extension

```typescript
type WebviewToExtensionMessageType =
  | 'sendMessage'
  | 'stopGeneration'
  | 'permissionResponse'
  | 'openFile'
  | 'openFolder'
  | 'copyToClipboard'
  | 'saveSettings'
  | 'getSettings'
  | 'startSession'
  | 'endSession'
  | 'clearConversation'
  | 'exportConversation'
  | 'login'
  | 'logout'
  | 'installClaude'
  | 'saveState'
  | 'requestState';

// Example messages
interface SendMessageRequest {
  type: 'sendMessage';
  message: string;
  planMode?: boolean;
  thinkingMode?: boolean;
  attachments?: Array<{ type: 'file' | 'image'; path: string; name: string }>;
}

interface PermissionResponseRequest {
  type: 'permissionResponse';
  requestId: string;
  decision: PermissionDecision;
  toolName?: string;
  input?: unknown;
}
```

---

## Type Guards

### Claude Event Guards

```typescript
function isSystemEvent(event: ClaudeEvent): event is SystemEvent
function isSystemInitEvent(event: ClaudeEvent): event is SystemInitEvent
function isAssistantEvent(event: ClaudeEvent): event is AssistantEvent
function isUserEvent(event: ClaudeEvent): event is UserEvent
function isResultEvent(event: ClaudeEvent): event is ResultEvent
function isControlRequest(event: ClaudeEvent): event is ControlRequest
function isCanUseToolRequest(event: ClaudeEvent): event is CanUseToolRequest
```

### Content Block Guards

```typescript
function isTextContentBlock(block: AssistantContentBlock): block is TextContentBlock
function isThinkingContentBlock(block: AssistantContentBlock): block is ThinkingContentBlock
function isToolUseContentBlock(block: AssistantContentBlock): block is ToolUseContentBlock
```

### Chat Message Guards

```typescript
function isUserMessage(message: ChatMessage): message is UserMessage
function isAssistantMessage(message: ChatMessage): message is AssistantMessage
function isToolUseMessage(message: ChatMessage): message is ToolUseMessage
function isToolResultMessage(message: ChatMessage): message is ToolResultMessage
function isThinkingMessage(message: ChatMessage): message is ThinkingMessage
function isErrorMessage(message: ChatMessage): message is ErrorMessage
function isSystemMessage(message: ChatMessage): message is SystemMessage
```

### Message Type Guards

```typescript
function isExtensionMessage(message: unknown): message is ExtensionToWebviewMessage
function isWebviewMessage(message: unknown): message is WebviewToExtensionMessage
function isExtensionMessageOfType<T>(message: ExtensionToWebviewMessage, type: T): boolean
function isWebviewMessageOfType<T>(message: WebviewToExtensionMessage, type: T): boolean
```

---

## Utility Types

```typescript
// Deep partial for flexible updates
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Make specific keys optional
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
```

---

## VS Code API Types

**File:** `src/webview/types/vscode.d.ts`

```typescript
interface VSCodeApi {
  postMessage(message: WebviewToExtensionMessage): void;
  getState(): unknown;
  setState(state: unknown): void;
}

declare function acquireVsCodeApi(): VSCodeApi;

interface Window {
  vscode?: VSCodeApi;
}
```
