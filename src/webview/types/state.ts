/**
 * Application State Types
 *
 * These types define the structure of the application state,
 * including session management, conversation state, settings,
 * and UI state.
 *
 * @module state
 */

import type { ToolDefinition, MCPServerInfo, AccountInfo, TokenUsage } from "./claude-events";
import type {
    ChatMessage,
    PermissionRequest,
    ConversationThread,
    MessageRenderOptions,
} from "./messages";
import {
    SessionStatus,
    ThemeMode,
    SidebarTab,
    ModalType,
    Breakpoint,
    NotificationType,
    DEFAULT_CONTEXT_WINDOW_SIZE,
} from "../../shared/constants";

// Re-export enums for backward compatibility
export { SessionStatus, ThemeMode, SidebarTab, ModalType, Breakpoint, NotificationType };

// ============================================================================
// Session State
// ============================================================================

/**
 * Current session state
 */
export interface SessionState {
    /** Unique session identifier */
    sessionId: string | null;
    /** Session status */
    status: SessionStatus;
    /** Available tools in the session */
    tools: ToolDefinition[];
    /** Connected MCP servers */
    mcpServers: MCPServerInfo[];
    /** Account information */
    account: AccountInfo | null;
    /** Session creation timestamp */
    createdAt: number | null;
    /** Last activity timestamp */
    lastActivityAt: number | null;
}

/**
 * Session status type alias for backward compatibility
 * @deprecated Use SessionStatus enum from shared/constants instead
 */
export type SessionStatusType = `${SessionStatus}`;

/**
 * Session initialization options
 */
export interface SessionInitOptions {
    /** Working directory for the session */
    workingDirectory?: string;
    /** Environment variables to pass to Claude */
    env?: Record<string, string>;
    /** Whether to resume a previous session */
    resumeSession?: boolean;
    /** Session ID to resume */
    sessionIdToResume?: string;
    /** Model to use for the session */
    model?: string;
    /** Whether to use WSL (Windows Subsystem for Linux) */
    useWsl?: boolean;
}

// ============================================================================
// Conversation State
// ============================================================================

/**
 * Conversation state
 */
export interface ConversationState {
    /** Current conversation thread */
    currentThread: ConversationThread | null;
    /** All messages in the current conversation */
    messages: ChatMessage[];
    /** Pending permission requests */
    pendingPermissions: PermissionRequest[];
    /** Whether the conversation is loading */
    isLoading: boolean;
    /** Whether a response is being processed */
    isProcessing: boolean;
    /** Current input value */
    inputValue: string;
    /** Draft message (auto-saved) */
    draftMessage: string | null;
}

// ============================================================================
// Token Tracking State
// ============================================================================

/**
 * Token usage tracking state
 */
export interface TokenTrackingState {
    /** Current message token usage */
    current: TokenUsage;
    /** Cumulative session token usage */
    cumulative: CumulativeTokenUsage;
    /** Token limit information */
    limits: TokenLimits;
    /** Whether approaching token limit */
    isApproachingLimit: boolean;
}

/**
 * Cumulative token usage across the session
 */
export interface CumulativeTokenUsage {
    /** Total input tokens used */
    totalInputTokens: number;
    /** Total output tokens used */
    totalOutputTokens: number;
    /** Total cache read tokens */
    totalCacheReadTokens: number;
    /** Total cache creation tokens */
    totalCacheCreationTokens: number;
}

/**
 * Token limit information
 */
export interface TokenLimits {
    /** Maximum context window size */
    maxContextTokens: number;
    /** Warning threshold (percentage of max) */
    warningThreshold: number;
    /** Current usage percentage */
    usagePercentage: number;
}

// ============================================================================
// Cost Tracking State
// ============================================================================

/**
 * Cost tracking state
 */
export interface CostTrackingState {
    /** Total cost in USD for current session */
    sessionCostUsd: number;
    /** Total cost across all sessions */
    allTimeCostUsd: number;
    /** Cost breakdown by operation */
    breakdown: CostBreakdown;
    /** Last updated timestamp */
    lastUpdated: number;
}

/**
 * Cost breakdown by operation type
 */
export interface CostBreakdown {
    /** Cost for input tokens */
    inputCost: number;
    /** Cost for output tokens */
    outputCost: number;
    /** Cost for cache operations */
    cacheCost: number;
}

// ============================================================================
// Timing State
// ============================================================================

/**
 * Timing and duration tracking state
 */
export interface TimingState {
    /** Request start time */
    requestStartTime: number | null;
    /** Current elapsed time in ms */
    elapsedMs: number;
    /** Total duration from Claude result */
    totalDurationMs: number | null;
    /** Number of conversation turns */
    numTurns: number;
    /** Whether the timer is running */
    isTimerRunning: boolean;
}

// ============================================================================
// Settings State
// ============================================================================

/**
 * Application settings state
 */
export interface SettingsState {
    /** Theme settings */
    theme: ThemeSettings;
    /** Editor settings */
    editor: EditorSettings;
    /** Claude settings */
    claude: ClaudeSettings;
    /** Permission settings */
    permissions: PermissionSettings;
    /** Display settings */
    display: DisplaySettings;
    /** Keyboard shortcuts */
    shortcuts: ShortcutSettings;
}

/**
 * Theme settings
 */
export interface ThemeSettings {
    /** Current theme mode */
    mode: ThemeMode;
    /** Custom accent color */
    accentColor?: string;
    /** Font family */
    fontFamily?: string;
    /** Font size in pixels */
    fontSize: number;
}

/**
 * Editor settings
 */
export interface EditorSettings {
    /** Tab size */
    tabSize: number;
    /** Whether to use tabs or spaces */
    useTabs: boolean;
    /** Whether to enable word wrap */
    wordWrap: boolean;
    /** Whether to show line numbers */
    showLineNumbers: boolean;
    /** Whether to enable minimap */
    showMinimap: boolean;
    /** Whether to enable bracket matching */
    bracketMatching: boolean;
}

/**
 * Claude-specific settings
 */
export interface ClaudeSettings {
    /** Path to Claude CLI executable */
    cliPath: string | null;
    /** Default model to use */
    defaultModel: string;
    /** Whether to use WSL on Windows */
    useWsl: boolean;
    /** Default working directory */
    defaultWorkingDirectory: string | null;
    /** Maximum tokens per request */
    maxTokensPerRequest: number | null;
    /** Custom environment variables */
    customEnv: Record<string, string>;
}

/**
 * Permission handling settings
 */
export interface PermissionSettings {
    /** Auto-approve settings */
    autoApprove: AutoApproveSettings;
    /** Tools that are always denied */
    denyList: string[];
    /** Default permission timeout in ms */
    timeoutMs: number;
    /** Whether to show permission prompts */
    showPrompts: boolean;
}

/**
 * Auto-approve settings for tools
 */
export interface AutoApproveSettings {
    /** Whether auto-approve is enabled */
    enabled: boolean;
    /** Tools to auto-approve */
    tools: string[];
    /** Patterns to auto-approve (glob patterns for paths) */
    patterns: string[];
    /** Whether to auto-approve read operations */
    readOperations: boolean;
    /** Whether to auto-approve within project directory */
    projectDirectory: boolean;
}

/**
 * Display settings
 */
export interface DisplaySettings {
    /** Message rendering options */
    messageRendering: MessageRenderOptions;
    /** Whether to show token counts */
    showTokenCounts: boolean;
    /** Whether to show cost estimates */
    showCostEstimates: boolean;
    /** Whether to show timing information */
    showTiming: boolean;
    /** Whether to show tool execution details */
    showToolDetails: boolean;
    /** Whether to show thinking blocks */
    showThinking: boolean;
    /** Whether to enable animations */
    enableAnimations: boolean;
}

/**
 * Keyboard shortcut settings
 */
export interface ShortcutSettings {
    /** Submit message shortcut */
    submit: string;
    /** New line in input shortcut */
    newLine: string;
    /** Stop generation shortcut */
    stop: string;
    /** Clear conversation shortcut */
    clear: string;
    /** Toggle sidebar shortcut */
    toggleSidebar: string;
    /** Focus input shortcut */
    focusInput: string;
}

// ============================================================================
// UI State
// ============================================================================

/**
 * UI component state
 */
export interface UIState {
    /** Sidebar state */
    sidebar: SidebarState;
    /** Input area state */
    input: InputState;
    /** Modal state */
    modal: ModalState;
    /** Notification state */
    notifications: NotificationState;
    /** Layout state */
    layout: LayoutState;
}

/**
 * Sidebar state
 */
export interface SidebarState {
    /** Whether the sidebar is visible */
    isVisible: boolean;
    /** Current sidebar width in pixels */
    width: number;
    /** Currently active tab */
    activeTab: SidebarTab;
    /** Whether the sidebar is resizing */
    isResizing: boolean;
}

/**
 * Sidebar tabs type alias for backward compatibility
 * @deprecated Use SidebarTab enum from shared/constants instead
 */
export type SidebarTabType = `${SidebarTab}`;

/**
 * Input area state
 */
export interface InputState {
    /** Whether the input is focused */
    isFocused: boolean;
    /** Current input height in pixels */
    height: number;
    /** Whether the input is expanded */
    isExpanded: boolean;
    /** Files being attached */
    attachments: AttachmentState[];
    /** Mention suggestions (for @-mentions) */
    mentionSuggestions: MentionSuggestion[];
    /** Whether suggestions are visible */
    showSuggestions: boolean;
}

/**
 * Attachment state
 */
export interface AttachmentState {
    /** Attachment ID */
    id: string;
    /** File name */
    name: string;
    /** File path */
    path: string;
    /** File type */
    type: "file" | "image" | "directory";
    /** Upload status */
    status: "pending" | "uploading" | "ready" | "error";
    /** Error message if upload failed */
    error?: string;
}

/**
 * Mention suggestion for @-mentions
 */
export interface MentionSuggestion {
    /** Suggestion type */
    type: "file" | "tool" | "command";
    /** Display label */
    label: string;
    /** Value to insert */
    value: string;
    /** Description */
    description?: string;
    /** Icon to display */
    icon?: string;
}

/**
 * Modal state
 */
export interface ModalState {
    /** Currently active modal */
    activeModal: ModalType | null;
    /** Modal props (varies by modal type) */
    props: Record<string, unknown>;
}

/**
 * Modal types type alias for backward compatibility
 * @deprecated Use ModalType enum from shared/constants instead
 */
export type ModalTypeAlias = `${ModalType}`;

/**
 * Notification state
 */
export interface NotificationState {
    /** Active notifications */
    items: Notification[];
    /** Maximum number of visible notifications */
    maxVisible: number;
}

/**
 * Notification item
 */
export interface Notification {
    /** Notification ID */
    id: string;
    /** Notification type */
    type: NotificationType;
    /** Notification title */
    title: string;
    /** Notification message */
    message?: string;
    /** Auto-dismiss timeout in ms (0 = no auto-dismiss) */
    timeout: number;
    /** Actions available on the notification */
    actions?: NotificationAction[];
    /** Timestamp when created */
    createdAt: number;
}

/**
 * Notification action
 */
export interface NotificationAction {
    /** Action label */
    label: string;
    /** Action handler ID */
    action: string;
    /** Whether this is the primary action */
    primary?: boolean;
}

/**
 * Layout state
 */
export interface LayoutState {
    /** Current breakpoint */
    breakpoint: Breakpoint;
    /** Whether in compact mode */
    isCompact: boolean;
    /** Whether in fullscreen mode */
    isFullscreen: boolean;
    /** Window dimensions */
    windowSize: {
        width: number;
        height: number;
    };
}

/**
 * Layout breakpoints type alias for backward compatibility
 * @deprecated Use Breakpoint enum from shared/constants instead
 */
export type BreakpointType = `${Breakpoint}`;

// ============================================================================
// Root Application State
// ============================================================================

/**
 * Root application state
 */
export interface AppState {
    /** Session state */
    session: SessionState;
    /** Conversation state */
    conversation: ConversationState;
    /** Token tracking state */
    tokens: TokenTrackingState;
    /** Cost tracking state */
    costs: CostTrackingState;
    /** Timing state */
    timing: TimingState;
    /** Settings state */
    settings: SettingsState;
    /** UI state */
    ui: UIState;
}

/**
 * Initial/default session state
 */
export const initialSessionState: SessionState = {
    sessionId: null,
    status: SessionStatus.Initializing,
    tools: [],
    mcpServers: [],
    account: null,
    createdAt: null,
    lastActivityAt: null,
};

/**
 * Initial/default conversation state
 */
export const initialConversationState: ConversationState = {
    currentThread: null,
    messages: [],
    pendingPermissions: [],
    isLoading: false,
    isProcessing: false,
    inputValue: "",
    draftMessage: null,
};

/**
 * Initial/default token tracking state
 */
export const initialTokenTrackingState: TokenTrackingState = {
    current: {
        input_tokens: 0,
        output_tokens: 0,
        cache_read_input_tokens: 0,
        cache_creation_input_tokens: 0,
    },
    cumulative: {
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCacheReadTokens: 0,
        totalCacheCreationTokens: 0,
    },
    limits: {
        maxContextTokens: DEFAULT_CONTEXT_WINDOW_SIZE,
        warningThreshold: 0.8,
        usagePercentage: 0,
    },
    isApproachingLimit: false,
};

/**
 * Initial/default timing state
 */
export const initialTimingState: TimingState = {
    requestStartTime: null,
    elapsedMs: 0,
    totalDurationMs: null,
    numTurns: 0,
    isTimerRunning: false,
};
