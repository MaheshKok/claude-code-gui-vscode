/**
 * VSCode Webview API Message Types
 *
 * These types define the message protocol between the VSCode extension
 * and the webview. Messages flow bidirectionally:
 * - ExtensionToWebview: Messages from the extension to the webview
 * - WebviewToExtension: Messages from the webview to the extension
 *
 * @module webview-api
 */

import type {
    ToolDefinition,
    MCPServerInfo,
    AccountInfo,
    TokenUsage,
    ToolInput,
    PermissionDecision,
    PermissionSuggestion,
} from "./claude-events";
import type { SessionInitOptions, SettingsState } from "./state";

// ============================================================================
// Extension to Webview Messages
// ============================================================================

/**
 * All message types sent from extension to webview
 */
export type ExtensionToWebviewMessageType =
    | "sessionInfo"
    | "accountInfo"
    | "output"
    | "thinking"
    | "toolUse"
    | "toolResult"
    | "updateTokens"
    | "updateTotals"
    | "compacting"
    | "compactBoundary"
    | "permissionRequest"
    | "setProcessing"
    | "loading"
    | "clearLoading"
    | "error"
    | "showInstallModal"
    | "showLoginModal"
    | "settingsUpdate"
    | "themeUpdate"
    | "restoreState"
    | "conversationList"
    | "conversationDeleted"
    | "mcpServers"
    | "usageData";

/**
 * Union type of all extension to webview messages
 */
export type ExtensionToWebviewMessage =
    | SessionInfoMessage
    | AccountInfoMessage
    | OutputMessage
    | ThinkingMessage
    | ToolUseMessage
    | ToolResultMessage
    | UpdateTokensMessage
    | UpdateTotalsMessage
    | CompactingMessage
    | CompactBoundaryMessage
    | PermissionRequestMessage
    | SetProcessingMessage
    | LoadingMessage
    | ClearLoadingMessage
    | ErrorMessage
    | ShowInstallModalMessage
    | ShowLoginModalMessage
    | SettingsUpdateMessage
    | ThemeUpdateMessage
    | RestoreStateMessage
    | ConversationListMessage
    | ConversationDeletedMessage;

/**
 * Base interface for extension to webview messages
 */
interface BaseExtensionMessage {
    type: ExtensionToWebviewMessageType;
}

/**
 * Session info message - sent on session init and result
 */
export interface SessionInfoMessage extends BaseExtensionMessage {
    type: "sessionInfo";
    /** Session ID */
    sessionId: string;
    /** Available tools */
    tools: ToolDefinition[];
    /** Connected MCP servers */
    mcpServers: MCPServerInfo[];
}

/**
 * Account info message - sent from control response
 */
export interface AccountInfoMessage extends BaseExtensionMessage {
    type: "accountInfo";
    /** Account information */
    account: AccountInfo;
}

/**
 * Output message - assistant text content
 */
export interface OutputMessage extends BaseExtensionMessage {
    type: "output";
    /** Text content to display */
    text: string;
    /** Whether this is the final output chunk */
    isFinal?: boolean;
}

/**
 * Thinking message - Claude's reasoning process
 */
export interface ThinkingMessage extends BaseExtensionMessage {
    type: "thinking";
    /** Thinking content */
    thinking: string;
}

/**
 * Tool use message - tool invocation by assistant
 */
export interface ToolUseMessage extends BaseExtensionMessage {
    type: "toolUse";
    /** Unique tool use ID */
    toolUseId: string;
    /** Tool name */
    toolName: string;
    /** Raw input passed to the tool */
    rawInput: ToolInput;
    /** Formatted human-readable tool info */
    toolInfo: string;
    /** File content before operation (for diff) */
    fileContentBefore?: string;
    /** Starting line number for diff context */
    startLine?: number;
    /** Array of starting lines (for MultiEdit) */
    startLines?: number[];
    /** Duration in milliseconds */
    duration?: number;
    /** Token count for this tool use */
    tokens?: number;
    /** Cache read tokens for this tool use */
    cacheReadTokens?: number;
    /** Cache creation tokens for this tool use */
    cacheCreationTokens?: number;
}

/**
 * Tool result message - result of tool execution
 */
export interface ToolResultMessage extends BaseExtensionMessage {
    type: "toolResult";
    /** ID of the tool_use this is a result for */
    toolUseId: string;
    /** Tool name (for display) */
    toolName?: string;
    /** Result content (stringified if originally object) */
    content: string;
    /** Whether the tool execution resulted in an error */
    isError: boolean;
    /** Whether this result should be hidden in UI */
    hidden: boolean;
    /** File content after operation (for diff) */
    fileContentAfter?: string;
    /** Starting line number for diff context */
    startLine?: number;
    /** Array of starting lines (for MultiEdit) */
    startLines?: number[];
    /** Duration in milliseconds */
    duration?: number;
    /** Token count for this tool result */
    tokens?: number;
    /** Cache read tokens for this tool result */
    cacheReadTokens?: number;
    /** Cache creation tokens for this tool result */
    cacheCreationTokens?: number;
}

/**
 * Update tokens message - per-message token counts
 */
export interface UpdateTokensMessage extends BaseExtensionMessage {
    type: "updateTokens";
    /** Current message token usage */
    current: TokenUsage;
    /** Cumulative token totals */
    total: {
        inputTokens: number;
        outputTokens: number;
        cacheReadTokens: number;
        cacheCreationTokens: number;
    };
}

/**
 * Update totals message - end-of-request summary
 */
export interface UpdateTotalsMessage extends BaseExtensionMessage {
    type: "updateTotals";
    /** Total cost in USD */
    totalCostUsd: number;
    /** Duration in milliseconds */
    durationMs: number;
    /** Number of conversation turns */
    numTurns: number;
    /** Session total cost in USD */
    totalCost?: number;
    /** Session total input tokens */
    totalTokensInput?: number;
    /** Session total output tokens */
    totalTokensOutput?: number;
    /** Number of requests in session */
    requestCount?: number;
}

/**
 * Compacting message - indicates compaction status
 */
export interface CompactingMessage extends BaseExtensionMessage {
    type: "compacting";
    /** Whether compaction is in progress */
    isCompacting: boolean;
}

/**
 * Compact boundary message - marks compaction event
 */
export interface CompactBoundaryMessage extends BaseExtensionMessage {
    type: "compactBoundary";
    /** What triggered the compaction */
    trigger: "auto" | "manual" | "limit";
    /** Tokens before compaction */
    preTokens: number;
}

/**
 * Permission request message - tool permission request
 */
export interface PermissionRequestMessage extends BaseExtensionMessage {
    type: "permissionRequest";
    /** Unique request ID */
    requestId: string;
    /** ID of the tool_use content block */
    toolUseId: string;
    /** Name of the tool requesting permission */
    toolName: string;
    /** Input that would be passed to the tool */
    input: ToolInput;
    /** Formatted human-readable description */
    description: string;
    /** Suggested permission actions */
    suggestions: PermissionSuggestion[];
    /** Reason for the permission decision (if auto-decided) */
    decisionReason?: string;
    /** Path that was blocked (for file operations) */
    blockedPath?: string;
}

/**
 * Set processing message - controls processing state
 */
export interface SetProcessingMessage extends BaseExtensionMessage {
    type: "setProcessing";
    /** Whether processing is in progress */
    isProcessing: boolean;
}

/**
 * Loading message - shows loading indicator
 */
export interface LoadingMessage extends BaseExtensionMessage {
    type: "loading";
    /** Loading message to display */
    message?: string;
}

/**
 * Clear loading message - hides loading indicator
 */
export interface ClearLoadingMessage extends BaseExtensionMessage {
    type: "clearLoading";
}

/**
 * Error message - displays error to user
 */
export interface ErrorMessage extends BaseExtensionMessage {
    type: "error";
    /** Error message */
    message: string;
    /** Error code */
    code?: string;
    /** Whether the error is recoverable */
    recoverable?: boolean;
}

/**
 * Show install modal message - prompts Claude installation
 */
export interface ShowInstallModalMessage extends BaseExtensionMessage {
    type: "showInstallModal";
    /** Installation instructions */
    instructions?: string;
}

/**
 * Show login modal message - prompts authentication
 */
export interface ShowLoginModalMessage extends BaseExtensionMessage {
    type: "showLoginModal";
    /** Login URL */
    loginUrl?: string;
}

/**
 * Settings update message - pushes settings to webview
 */
export interface SettingsUpdateMessage extends BaseExtensionMessage {
    type: "settingsUpdate";
    /** Updated settings */
    settings: Partial<SettingsState>;
}

/**
 * Theme update message - notifies of theme change
 */
export interface ThemeUpdateMessage extends BaseExtensionMessage {
    type: "themeUpdate";
    /** New theme mode */
    theme: "light" | "dark";
}

/**
 * Restore state message - restores webview state
 */
export interface RestoreStateMessage extends BaseExtensionMessage {
    type: "restoreState";
    /** Serialized state to restore */
    state: unknown;
}

/**
 * Conversation summary from the extension
 */
export interface ConversationListItem {
    filename: string;
    timestamp: string;
    preview: string;
    messageCount: number;
    sessionId?: string;
    totalCost?: number;
}

/**
 * Conversation list message - sends conversation summaries
 */
export interface ConversationListMessage extends BaseExtensionMessage {
    type: "conversationList";
    conversations: ConversationListItem[];
    data?: ConversationListItem[];
}

/**
 * Conversation deleted message
 */
export interface ConversationDeletedMessage extends BaseExtensionMessage {
    type: "conversationDeleted";
    filename: string;
}

// ============================================================================
// Webview to Extension Messages
// ============================================================================

/**
 * All message types sent from webview to extension
 */
export type WebviewToExtensionMessageType =
    | "sendMessage"
    | "stopGeneration"
    | "permissionResponse"
    | "openFile"
    | "openDiff"
    | "openMarkdownPreview"
    | "openFolder"
    | "copyToClipboard"
    | "saveSettings"
    | "getSettings"
    | "startSession"
    | "endSession"
    | "clearConversation"
    | "exportConversation"
    | "login"
    | "logout"
    | "installClaude"
    | "saveState"
    | "requestState"
    | "openExternal"
    | "showInfo"
    | "showError"
    | "telemetry"
    | "getConversationList"
    | "loadConversation"
    | "deleteConversation"
    | "refreshUsage"
    | "loadMCPServers"
    | "saveMCPServer"
    | "deleteMCPServer"
    | "revertFile";

/**
 * Union type of all webview to extension messages
 */
export type WebviewToExtensionMessage =
    | SendMessageRequest
    | StopGenerationRequest
    | PermissionResponseRequest
    | OpenFileRequest
    | OpenDiffRequest
    | OpenMarkdownPreviewRequest
    | OpenFolderRequest
    | CopyToClipboardRequest
    | SaveSettingsRequest
    | GetSettingsRequest
    | StartSessionRequest
    | EndSessionRequest
    | ClearConversationRequest
    | ExportConversationRequest
    | LoginRequest
    | LogoutRequest
    | InstallClaudeRequest
    | SaveStateRequest
    | RequestStateRequest
    | OpenExternalRequest
    | ShowInfoRequest
    | ShowErrorRequest
    | TelemetryRequest
    | GetConversationListRequest
    | LoadConversationRequest
    | DeleteConversationRequest
    | RefreshUsageRequest
    | LoadMCPServersRequest
    | SaveMCPServerRequest
    | DeleteMCPServerRequest
    | RevertFileRequest;

/**
 * Base interface for webview to extension messages
 */
interface BaseWebviewMessage {
    type: WebviewToExtensionMessageType;
}

/**
 * Send message request - sends user message to Claude
 */
export interface SendMessageRequest extends BaseWebviewMessage {
    type: "sendMessage";
    /** Message content */
    message: string;
    /** Optional plan mode toggle */
    planMode?: boolean;
    /** Optional thinking mode toggle */
    thinkingMode?: boolean;
    /** Optional file attachments */
    attachments?: Array<{
        type: "file" | "image";
        path: string;
        name: string;
    }>;
}

/**
 * Stop generation request - stops current Claude response
 */
export interface StopGenerationRequest extends BaseWebviewMessage {
    type: "stopGeneration";
}

/**
 * Permission response request - responds to permission request
 */
export interface PermissionResponseRequest extends BaseWebviewMessage {
    type: "permissionResponse";
    /** Request ID being responded to */
    requestId: string;
    /** Permission decision */
    decision: PermissionDecision;
    /** Tool name (for permission persistence) */
    toolName?: string;
    /** Tool input (for permission persistence) */
    input?: unknown;
}

/**
 * Open file request - opens file in editor
 */
export interface OpenFileRequest extends BaseWebviewMessage {
    type: "openFile";
    /** File path to open */
    filePath: string;
    /** Line number to jump to */
    line?: number;
    /** Column number */
    column?: number;
    /** Whether to preview only */
    preview?: boolean;
}

/**
 * Open diff request - opens a diff view
 */
export interface OpenDiffRequest extends BaseWebviewMessage {
    type: "openDiff";
    /** Original file content */
    oldContent: string;
    /** Updated file content */
    newContent: string;
    /** File path for the diff title */
    filePath: string;
}

/**
 * Open markdown preview request - opens a markdown preview for content
 */
export interface OpenMarkdownPreviewRequest extends BaseWebviewMessage {
    type: "openMarkdownPreview";
    /** Markdown content to preview */
    content: string;
    /** Optional preview title */
    title?: string;
}

/**
 * Open folder request - opens folder in explorer
 */
export interface OpenFolderRequest extends BaseWebviewMessage {
    type: "openFolder";
    /** Folder path to open */
    folderPath: string;
}

/**
 * Copy to clipboard request - copies text to clipboard
 */
export interface CopyToClipboardRequest extends BaseWebviewMessage {
    type: "copyToClipboard";
    /** Text to copy */
    text: string;
}

/**
 * Save settings request - saves settings to storage
 */
export interface SaveSettingsRequest extends BaseWebviewMessage {
    type: "saveSettings";
    /** Settings to save */
    settings: Partial<SettingsState>;
}

/**
 * Get settings request - retrieves current settings
 */
export interface GetSettingsRequest extends BaseWebviewMessage {
    type: "getSettings";
}

/**
 * Start session request - starts new Claude session
 */
export interface StartSessionRequest extends BaseWebviewMessage {
    type: "startSession";
    /** Session initialization options */
    options?: SessionInitOptions;
}

/**
 * End session request - ends current session
 */
export interface EndSessionRequest extends BaseWebviewMessage {
    type: "endSession";
}

/**
 * Clear conversation request - clears message history
 */
export interface ClearConversationRequest extends BaseWebviewMessage {
    type: "clearConversation";
}

/**
 * Export conversation request - exports conversation to file
 */
export interface ExportConversationRequest extends BaseWebviewMessage {
    type: "exportConversation";
    /** Export format */
    format: "json" | "markdown" | "html";
}

/**
 * Conversation list request - retrieves saved conversations
 */
export interface GetConversationListRequest extends BaseWebviewMessage {
    type: "getConversationList";
}

/**
 * Load conversation request - loads a saved conversation
 */
export interface LoadConversationRequest extends BaseWebviewMessage {
    type: "loadConversation";
    filename: string;
}

/**
 * Delete conversation request - deletes a saved conversation
 */
export interface DeleteConversationRequest extends BaseWebviewMessage {
    type: "deleteConversation";
    filename: string;
}

/**
 * Refresh usage request - requests updated usage data
 */
export interface RefreshUsageRequest extends BaseWebviewMessage {
    type: "refreshUsage";
}

/**
 * Load MCP servers request - loads configured MCP servers
 */
export interface LoadMCPServersRequest extends BaseWebviewMessage {
    type: "loadMCPServers";
}

/**
 * Save MCP server request - saves an MCP server configuration
 */
export interface SaveMCPServerRequest extends BaseWebviewMessage {
    type: "saveMCPServer";
    /** Server name */
    name: string;
    /** Server configuration */
    config: {
        type?: "http" | "sse" | "stdio";
        command?: string;
        args?: string[];
        env?: Record<string, string>;
        cwd?: string;
        url?: string;
        headers?: Record<string, string>;
    };
}

/**
 * Delete MCP server request - deletes an MCP server configuration
 */
export interface DeleteMCPServerRequest extends BaseWebviewMessage {
    type: "deleteMCPServer";
    /** Server name to delete */
    name: string;
}

/**
 * Login request - initiates authentication
 */
export interface LoginRequest extends BaseWebviewMessage {
    type: "login";
}

/**
 * Logout request - logs out current user
 */
export interface LogoutRequest extends BaseWebviewMessage {
    type: "logout";
}

/**
 * Install Claude request - opens installation flow
 */
export interface InstallClaudeRequest extends BaseWebviewMessage {
    type: "installClaude";
}

/**
 * Save state request - saves webview state for restoration
 */
export interface SaveStateRequest extends BaseWebviewMessage {
    type: "saveState";
    /** State to save */
    state: unknown;
}

/**
 * Request state - requests saved state from extension
 */
export interface RequestStateRequest extends BaseWebviewMessage {
    type: "requestState";
}

/**
 * Open external request - opens URL in external browser
 */
export interface OpenExternalRequest extends BaseWebviewMessage {
    type: "openExternal";
    /** URL to open */
    url: string;
}

/**
 * Show info request - shows info notification
 */
export interface ShowInfoRequest extends BaseWebviewMessage {
    type: "showInfo";
    /** Message to show */
    message: string;
}

/**
 * Show error request - shows error notification
 */
export interface ShowErrorRequest extends BaseWebviewMessage {
    type: "showError";
    /** Error message to show */
    message: string;
}

/**
 * Telemetry request - sends telemetry event
 */
export interface TelemetryRequest extends BaseWebviewMessage {
    type: "telemetry";
    /** Event name */
    event: string;
    /** Event properties */
    properties?: Record<string, unknown>;
}

/**
 * Revert file request - reverts a file to its original content
 */
export interface RevertFileRequest extends BaseWebviewMessage {
    type: "revertFile";
    /** File path to revert */
    filePath: string;
    /** Original content to restore */
    oldContent: string;
}

// ============================================================================
// VSCode API Types
// ============================================================================

/**
 * VSCode webview API interface
 * This is provided by VSCode in the webview context
 */
export interface VSCodeApi {
    /**
     * Post a message to the extension
     * @param message The message to send
     */
    postMessage(message: WebviewToExtensionMessage): void;

    /**
     * Get the current state
     * @returns The saved state or undefined
     */
    getState(): unknown;

    /**
     * Set the state (persisted across webview lifecycle)
     * @param state The state to save
     */
    setState(state: unknown): void;
}

/**
 * Acquire the VSCode API
 * This function is provided by VSCode in the webview context
 */
declare function acquireVsCodeApi(): VSCodeApi;

// ============================================================================
// Message Handlers
// ============================================================================

/**
 * Handler function type for extension to webview messages
 */
export type ExtensionMessageHandler<T extends ExtensionToWebviewMessage> = (message: T) => void;

/**
 * Map of message type to handler
 */
export type ExtensionMessageHandlerMap = {
    [K in ExtensionToWebviewMessageType]?: ExtensionMessageHandler<
        Extract<ExtensionToWebviewMessage, { type: K }>
    >;
};

/**
 * Handler function type for webview to extension messages
 */
export type WebviewMessageHandler<T extends WebviewToExtensionMessage> = (
    message: T,
) => void | Promise<void>;

/**
 * Map of message type to handler
 */
export type WebviewMessageHandlerMap = {
    [K in WebviewToExtensionMessageType]?: WebviewMessageHandler<
        Extract<WebviewToExtensionMessage, { type: K }>
    >;
};

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for extension to webview messages
 */
export function isExtensionMessage(message: unknown): message is ExtensionToWebviewMessage {
    return (
        typeof message === "object" &&
        message !== null &&
        "type" in message &&
        typeof (message as { type: unknown }).type === "string"
    );
}

/**
 * Type guard for webview to extension messages
 */
export function isWebviewMessage(message: unknown): message is WebviewToExtensionMessage {
    return (
        typeof message === "object" &&
        message !== null &&
        "type" in message &&
        typeof (message as { type: unknown }).type === "string"
    );
}

/**
 * Type guard for specific extension message type
 */
export function isExtensionMessageOfType<T extends ExtensionToWebviewMessageType>(
    message: ExtensionToWebviewMessage,
    type: T,
): message is Extract<ExtensionToWebviewMessage, { type: T }> {
    return message.type === type;
}

/**
 * Type guard for specific webview message type
 */
export function isWebviewMessageOfType<T extends WebviewToExtensionMessageType>(
    message: WebviewToExtensionMessage,
    type: T,
): message is Extract<WebviewToExtensionMessage, { type: T }> {
    return message.type === type;
}
