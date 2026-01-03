/**
 * Type Definitions for Claude Code GUI VSCode Extension
 *
 * This module exports all TypeScript type definitions for the webview
 * components, including Claude CLI event types, message types,
 * application state, and the VSCode webview API protocol.
 *
 * @module types
 *
 * @example
 * ```typescript
 * import type {
 *   ClaudeEvent,
 *   ChatMessage,
 *   SessionState,
 *   ExtensionToWebviewMessage,
 * } from './types';
 * ```
 */

// ============================================================================
// Claude CLI Event Types
// ============================================================================
export type {
    // Base types
    BaseClaudeEvent,
    ClaudeEventType,
    ClaudeEvent,

    // System events
    SystemEventSubtype,
    SystemEvent,
    SystemInitEvent,
    SystemStatusEvent,
    SystemCompactBoundaryEvent,
    ToolDefinition,
    MCPServerInfo,
    CompactMetadata,

    // Assistant events
    AssistantEvent,
    AssistantMessage,
    TokenUsage,
    AssistantContentBlock,
    BaseContentBlock,
    TextContentBlock,
    ThinkingContentBlock,
    ToolUseContentBlock,
    ToolInput,

    // Specific tool inputs
    ReadToolInput,
    WriteToolInput,
    EditToolInput,
    MultiEditToolInput,
    TodoWriteToolInput,
    TodoItem,
    BashToolInput,

    // User events
    UserEvent,
    UserMessage as ClaudeUserMessage,
    UserContentBlock,
    ToolResultContentBlock,
    ToolResultContent,

    // Result events
    ResultSubtype,
    ResultEvent,

    // Control request/response
    ControlRequestSubtype,
    ControlRequest,
    CanUseToolRequest,
    PermissionSuggestion,
    ControlResponse,
    ControlResponseData,
    AccountInfo,

    // Permission handling
    PermissionResponse,
    PermissionDecision,
} from "./claude-events";

// Export type guards from claude-events
export {
    isSystemEvent,
    isSystemInitEvent,
    isSystemStatusEvent,
    isSystemCompactBoundaryEvent,
    isAssistantEvent,
    isUserEvent,
    isResultEvent,
    isControlRequest,
    isCanUseToolRequest,
    isControlResponse,
    isTextContentBlock,
    isThinkingContentBlock,
    isToolUseContentBlock,
    isToolResultContentBlock,
} from "./claude-events";

// ============================================================================
// Chat Message Types
// ============================================================================
export type {
    // Message types
    MessageType,
    MessageRole,
    BaseMessage,
    ChatMessage,
    UserMessage,
    AssistantMessage as ChatAssistantMessage,
    ToolUseMessage as ChatToolUseMessage,
    ToolResultMessage as ChatToolResultMessage,
    ThinkingMessage as ChatThinkingMessage,
    ErrorMessage as ChatErrorMessage,
    SystemMessage as ChatSystemMessage,
    MessageAttachment,
    ToolExecutionStatus,

    // Permission request
    PermissionRequest,
    PermissionRequestStatus,

    // Message groups
    MessageGroup,
    MessageGroupType,

    // Conversation
    ConversationThread,

    // Rendering
    MessageRenderOptions,
    DiffInfo,
} from "./messages";

// Export type guards from messages
export {
    isUserMessage,
    isAssistantMessage,
    isToolUseMessage,
    isToolResultMessage,
    isThinkingMessage,
    isErrorMessage,
    isSystemMessage,
} from "./messages";

// ============================================================================
// Application State Types
// ============================================================================
export type {
    // Session state
    SessionState,
    SessionStatus,
    SessionInitOptions,

    // Conversation state
    ConversationState,

    // Token tracking
    TokenTrackingState,
    CumulativeTokenUsage,
    TokenLimits,

    // Cost tracking
    CostTrackingState,
    CostBreakdown,

    // Timing
    TimingState,

    // Settings
    SettingsState,
    ThemeSettings,
    EditorSettings,
    ClaudeSettings,
    PermissionSettings,
    AutoApproveSettings,
    DisplaySettings,
    ShortcutSettings,

    // UI state
    UIState,
    SidebarState,
    SidebarTab,
    InputState,
    AttachmentState,
    MentionSuggestion,
    ModalState,
    ModalType,
    NotificationState,
    Notification,
    NotificationAction,
    LayoutState,
    Breakpoint,

    // Root state
    AppState,
} from "./state";

// Export initial state values
export {
    initialSessionState,
    initialConversationState,
    initialTokenTrackingState,
    initialTimingState,
} from "./state";

// ============================================================================
// VSCode Webview API Types
// ============================================================================
export type {
    // Extension to webview messages
    ExtensionToWebviewMessageType,
    ExtensionToWebviewMessage,
    SessionInfoMessage,
    AccountInfoMessage,
    OutputMessage,
    ThinkingMessage,
    ToolUseMessage,
    ToolResultMessage,
    UpdateTokensMessage,
    UpdateTotalsMessage,
    CompactingMessage,
    CompactBoundaryMessage,
    PermissionRequestMessage,
    SetProcessingMessage,
    LoadingMessage,
    ClearLoadingMessage,
    ErrorMessage,
    ShowInstallModalMessage,
    ShowLoginModalMessage,
    SettingsUpdateMessage,
    ThemeUpdateMessage,
    RestoreStateMessage,

    // Webview to extension messages
    WebviewToExtensionMessageType,
    WebviewToExtensionMessage,
    SendMessageRequest,
    StopGenerationRequest,
    PermissionResponseRequest,
    OpenFileRequest,
    OpenFolderRequest,
    CopyToClipboardRequest,
    SaveSettingsRequest,
    GetSettingsRequest,
    StartSessionRequest,
    EndSessionRequest,
    ClearConversationRequest,
    ExportConversationRequest,
    LoginRequest,
    LogoutRequest,
    InstallClaudeRequest,
    SaveStateRequest,
    RequestStateRequest,
    OpenExternalRequest,
    ShowInfoRequest,
    ShowErrorRequest,
    TelemetryRequest,

    // VSCode API
    VSCodeApi,

    // Handler types
    ExtensionMessageHandler,
    ExtensionMessageHandlerMap,
    WebviewMessageHandler,
    WebviewMessageHandlerMap,
} from "./webview-api";

// Export type guards from webview-api
export {
    isExtensionMessage,
    isWebviewMessage,
    isExtensionMessageOfType,
    isWebviewMessageOfType,
} from "./webview-api";
