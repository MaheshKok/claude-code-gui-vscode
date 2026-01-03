/**
 * Shared Constants and Enums
 *
 * Central location for all application-wide constants, enums, and configuration values.
 * This file provides type-safe constants that can be used across both the extension
 * and webview components.
 *
 * @module shared/constants
 */

// ============================================================================
// Re-export from modular constant files
// ============================================================================

// Additional enums for type safety
export {
    // File System
    FileSystemItemType,
    AttachmentStatus,
    AttachmentType,
    // MCP
    MCPConnectionType,
    MCPServerCategory,
    // UI State
    CopyState,
    InstallState,
    LoadingState,
    // Content Types
    ClipboardContentType,
    ExportFormat,
    InsertPosition,
    // Diff
    DiffLineType,
    // Commands
    SlashCommandType,
    MentionSuggestionType,
    // Message Groups
    MessageGroupType,
    // Display name mappings
    MCP_CONNECTION_TYPE_LABELS,
    FILE_SYSTEM_ITEM_TYPE_LABELS,
    INSTALL_STATE_LABELS,
    SLASH_COMMAND_TYPE_LABELS,
} from "./enums";

// UI Strings
export {
    MODAL_TITLES,
    PLACEHOLDERS,
    UI_LABELS,
    TOOLTIPS,
    ERROR_MESSAGES,
    ARIA_LABELS,
    LOG_PREFIXES,
    CONFIRMATION_MESSAGES,
    SUCCESS_MESSAGES,
} from "./ui-strings";

// Limits and configuration
export {
    FILE_LIMITS,
    SUPPORTED_FILE_TYPES,
    MESSAGE_LIMITS,
    NOTIFICATION_CONFIG,
    RETRY_CONFIG,
    UI_THRESHOLDS,
    TOKEN_LIMITS,
    CACHE_CONFIG,
    HISTORY_LIMITS,
} from "./limits";

// ============================================================================
// Message Enums
// ============================================================================

/**
 * Message types in the chat system
 */
export enum MessageType {
    User = "user",
    Assistant = "assistant",
    ToolUse = "tool_use",
    ToolResult = "tool_result",
    Thinking = "thinking",
    Error = "error",
    System = "system",
}

/**
 * Message sender roles
 */
export enum MessageRole {
    User = "user",
    Assistant = "assistant",
    System = "system",
    Tool = "tool",
    Error = "error",
}

/**
 * Message status states
 */
export enum MessageStatus {
    Pending = "pending",
    Streaming = "streaming",
    Complete = "complete",
    Error = "error",
}

// ============================================================================
// Tool Enums
// ============================================================================

/**
 * Tool execution status
 */
export enum ToolExecutionStatus {
    Pending = "pending",
    Approved = "approved",
    Executing = "executing",
    Completed = "completed",
    Failed = "failed",
    Denied = "denied",
    Cancelled = "cancelled",
}

/**
 * Built-in tool names
 */
export enum ToolName {
    Read = "Read",
    Write = "Write",
    Edit = "Edit",
    MultiEdit = "MultiEdit",
    Glob = "Glob",
    Grep = "Grep",
    Bash = "Bash",
    Task = "Task",
    TodoRead = "TodoRead",
    TodoWrite = "TodoWrite",
    WebFetch = "WebFetch",
    WebSearch = "WebSearch",
    NotebookRead = "NotebookRead",
    NotebookEdit = "NotebookEdit",
    LSP = "LSP",
}

/**
 * Permission request status
 */
export enum PermissionStatus {
    Pending = "pending",
    Approved = "approved",
    Denied = "denied",
    Expired = "expired",
    Cancelled = "cancelled",
}

/**
 * Permission decision types
 */
export enum PermissionDecision {
    Allow = "allow",
    Deny = "deny",
    AllowOnce = "allowOnce",
    DenyOnce = "denyOnce",
}

// ============================================================================
// Claude Model Enums
// ============================================================================

/**
 * Available Claude models
 */
export enum ClaudeModel {
    Sonnet = "claude-sonnet-4-5-20250929",
    Opus = "claude-opus-4-5-20251101",
    Haiku = "claude-haiku-4-5-20251001",
}

/**
 * Model display names
 */
export const MODEL_DISPLAY_NAMES: Record<ClaudeModel, string> = {
    [ClaudeModel.Sonnet]: "Claude Sonnet 4.5",
    [ClaudeModel.Opus]: "Claude Opus 4.5",
    [ClaudeModel.Haiku]: "Claude Haiku 4.5",
};

/**
 * Model descriptions
 */
export const MODEL_DESCRIPTIONS: Record<ClaudeModel, string> = {
    [ClaudeModel.Sonnet]: "Balanced performance (default)",
    [ClaudeModel.Opus]: "Most capable model",
    [ClaudeModel.Haiku]: "Fast and efficient",
};

/**
 * Default model to use
 */
export const DEFAULT_MODEL = ClaudeModel.Sonnet;

// ============================================================================
// Thinking Mode Enums
// ============================================================================

/**
 * Thinking intensity levels
 */
export enum ThinkingIntensity {
    Think = "think",
    ThinkHard = "think-hard",
    ThinkHarder = "think-harder",
    Ultrathink = "ultrathink",
}

/**
 * Thinking intensity display names
 */
export const THINKING_INTENSITY_NAMES: Record<ThinkingIntensity, string> = {
    [ThinkingIntensity.Think]: "Think",
    [ThinkingIntensity.ThinkHard]: "Think Hard",
    [ThinkingIntensity.ThinkHarder]: "Think Harder",
    [ThinkingIntensity.Ultrathink]: "Ultrathink",
};

/**
 * Default thinking intensity
 */
export const DEFAULT_THINKING_INTENSITY = ThinkingIntensity.Think;

// ============================================================================
// Session Enums
// ============================================================================

/**
 * Session status states
 */
export enum SessionStatus {
    Initializing = "initializing",
    Active = "active",
    Compacting = "compacting",
    Error = "error",
    Closed = "closed",
}

// ============================================================================
// UI Enums
// ============================================================================

/**
 * Theme modes
 */
export enum ThemeMode {
    Light = "light",
    Dark = "dark",
    Auto = "auto",
}

/**
 * Code block themes
 */
export enum CodeBlockTheme {
    Auto = "auto",
    GithubDark = "github-dark",
    GithubLight = "github-light",
    Monokai = "monokai",
    Dracula = "dracula",
    OneDarkPro = "one-dark-pro",
}

/**
 * Sidebar tabs
 */
export enum SidebarTab {
    History = "history",
    Files = "files",
    Tools = "tools",
    Settings = "settings",
}

/**
 * Modal types
 */
export enum ModalType {
    Permission = "permission",
    Install = "install",
    Login = "login",
    Settings = "settings",
    Confirm = "confirm",
    Error = "error",
    About = "about",
    FilePicker = "filePicker",
    ModelSelector = "modelSelector",
    ThinkingIntensity = "thinkingIntensity",
    SlashCommands = "slashCommands",
    MCP = "mcp",
}

/**
 * Layout breakpoints
 */
export enum Breakpoint {
    XS = "xs",
    SM = "sm",
    MD = "md",
    LG = "lg",
    XL = "xl",
}

/**
 * Notification types
 */
export enum NotificationType {
    Info = "info",
    Success = "success",
    Warning = "warning",
    Error = "error",
}

/**
 * System message severity levels
 */
export enum SystemMessageSeverity {
    Info = "info",
    Warning = "warning",
    Success = "success",
}

// ============================================================================
// Error Enums
// ============================================================================

/**
 * Error recovery actions
 */
export enum ErrorAction {
    Retry = "retry",
    Login = "login",
    Install = "install",
    Configure = "configure",
    ContactSupport = "contact_support",
}

// ============================================================================
// Numeric Constants
// ============================================================================

/**
 * Layout breakpoint values in pixels
 */
export const BREAKPOINT_VALUES: Record<Breakpoint, number> = {
    [Breakpoint.XS]: 0,
    [Breakpoint.SM]: 576,
    [Breakpoint.MD]: 768,
    [Breakpoint.LG]: 992,
    [Breakpoint.XL]: 1200,
};

/**
 * Sidebar configuration
 */
export const SIDEBAR_CONFIG = {
    MIN_WIDTH: 200,
    MAX_WIDTH: 600,
    DEFAULT_WIDTH: 280,
    COLLAPSED_WIDTH: 48,
} as const;

/**
 * Input area configuration
 */
export const INPUT_CONFIG = {
    MIN_HEIGHT: 44,
    MAX_HEIGHT: 300,
    DEFAULT_HEIGHT: 44,
} as const;

/**
 * Animation durations in milliseconds
 */
export const ANIMATION_DURATION = {
    FAST: 100,
    NORMAL: 200,
    SLOW: 300,
} as const;

/**
 * Debounce delays in milliseconds
 */
export const DEBOUNCE_DELAY = {
    INPUT: 100,
    SEARCH: 300,
    RESIZE: 50,
    AUTOSAVE: 1000,
} as const;

/**
 * Token context window sizes by model
 */
export const CONTEXT_WINDOW_SIZE: Record<ClaudeModel, number> = {
    [ClaudeModel.Sonnet]: 200000,
    [ClaudeModel.Opus]: 200000,
    [ClaudeModel.Haiku]: 200000,
};

/**
 * Default context window size
 */
export const DEFAULT_CONTEXT_WINDOW_SIZE = 200000;

// ============================================================================
// Token Pricing
// ============================================================================

/**
 * Token pricing per million tokens (in USD)
 */
export interface TokenPricing {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
}

export const TOKEN_PRICING: Record<ClaudeModel | "default", TokenPricing> = {
    [ClaudeModel.Sonnet]: {
        input: 3.0,
        output: 15.0,
        cacheRead: 0.3,
        cacheWrite: 3.75,
    },
    [ClaudeModel.Opus]: {
        input: 15.0,
        output: 75.0,
        cacheRead: 1.5,
        cacheWrite: 18.75,
    },
    [ClaudeModel.Haiku]: {
        input: 1.0,
        output: 5.0,
        cacheRead: 0.1,
        cacheWrite: 1.25,
    },
    default: {
        input: 3.0,
        output: 15.0,
        cacheRead: 0.3,
        cacheWrite: 3.75,
    },
};

// ============================================================================
// Default Settings
// ============================================================================

/**
 * Default WSL configuration
 */
export const DEFAULT_WSL_CONFIG = {
    ENABLED: false,
    DISTRO: "Ubuntu",
    NODE_PATH: "/usr/bin/node",
    CLAUDE_PATH: "/usr/local/bin/claude",
} as const;

/**
 * Default UI settings
 */
export const DEFAULT_UI_SETTINGS = {
    FONT_SIZE: 14,
    MAX_FONT_SIZE: 24,
    MIN_FONT_SIZE: 10,
    COMPACT_MODE: false,
    SHOW_AVATARS: true,
    SHOW_TIMESTAMPS: true,
    CODE_BLOCK_THEME: CodeBlockTheme.Auto,
} as const;

/**
 * Default chat settings
 */
export const DEFAULT_CHAT_SETTINGS = {
    MAX_HISTORY_SIZE: 100,
    MIN_HISTORY_SIZE: 10,
    MAX_HISTORY_SIZE_LIMIT: 1000,
    STREAM_RESPONSES: true,
    MAX_CONTEXT_LINES: 500,
    MIN_CONTEXT_LINES: 50,
    MAX_CONTEXT_LINES_LIMIT: 2000,
} as const;

/**
 * Default permission settings
 */
export const DEFAULT_PERMISSION_SETTINGS = {
    YOLO_MODE: false,
    TIMEOUT_MS: 60000,
    SHOW_PROMPTS: true,
    AUTO_APPROVE_TOOLS: [
        ToolName.Read,
        ToolName.Glob,
        ToolName.Grep,
        ToolName.LSP,
        ToolName.TodoRead,
    ],
} as const;

/**
 * Default thinking settings
 */
export const DEFAULT_THINKING_SETTINGS = {
    ENABLED: true,
    INTENSITY: ThinkingIntensity.Think,
    SHOW_PROCESS: true,
} as const;

// ============================================================================
// Tool Icon Mapping
// ============================================================================

/**
 * Tool icons (using VS Code Codicons naming convention)
 */
export const TOOL_ICONS: Record<string, string> = {
    // File Operations
    [ToolName.Read]: "file",
    [ToolName.Write]: "file-add",
    [ToolName.Edit]: "edit",
    [ToolName.MultiEdit]: "files",

    // Search and Navigation
    [ToolName.Glob]: "search",
    [ToolName.Grep]: "search",

    // Terminal
    [ToolName.Bash]: "terminal",

    // Task Management
    [ToolName.Task]: "checklist",
    [ToolName.TodoRead]: "checklist",
    [ToolName.TodoWrite]: "tasklist",

    // Web Operations
    [ToolName.WebFetch]: "globe",
    [ToolName.WebSearch]: "globe",

    // Notebook
    [ToolName.NotebookRead]: "notebook",
    [ToolName.NotebookEdit]: "notebook",

    // LSP
    [ToolName.LSP]: "symbol-method",

    // MCP Tools (prefix matching)
    mcp__: "extensions",

    // Default
    default: "tools",
};

/**
 * Message type icons
 */
export const MESSAGE_TYPE_ICONS: Record<MessageRole, string> = {
    [MessageRole.User]: "account",
    [MessageRole.Assistant]: "sparkle",
    [MessageRole.Tool]: "tools",
    [MessageRole.Error]: "error",
    [MessageRole.System]: "info",
};

// ============================================================================
// Status Colors (CSS variable names)
// ============================================================================

/**
 * Status indicator colors
 */
export const STATUS_COLORS = {
    SUCCESS: "var(--vscode-testing-iconPassed)",
    ERROR: "var(--vscode-testing-iconFailed)",
    WARNING: "var(--vscode-editorWarning-foreground)",
    INFO: "var(--vscode-editorInfo-foreground)",
    PENDING: "var(--vscode-editorLightBulb-foreground)",
    ACTIVE: "var(--vscode-progressBar-background)",
} as const;

/**
 * Tool status colors
 */
export const TOOL_STATUS_COLORS: Record<ToolExecutionStatus, string> = {
    [ToolExecutionStatus.Pending]: STATUS_COLORS.PENDING,
    [ToolExecutionStatus.Approved]: STATUS_COLORS.INFO,
    [ToolExecutionStatus.Executing]: STATUS_COLORS.ACTIVE,
    [ToolExecutionStatus.Completed]: STATUS_COLORS.SUCCESS,
    [ToolExecutionStatus.Failed]: STATUS_COLORS.ERROR,
    [ToolExecutionStatus.Denied]: STATUS_COLORS.WARNING,
    [ToolExecutionStatus.Cancelled]: STATUS_COLORS.WARNING,
};

// ============================================================================
// Regex Patterns
// ============================================================================

/**
 * Common regex patterns used in the application
 */
export const PATTERNS = {
    /** Matches file paths */
    FILE_PATH: /^[a-zA-Z]?:?[\\/]?(?:[^<>:"|?*\n\r]+[\\/])*[^<>:"|?*\n\r]*$/,

    /** Matches glob patterns */
    GLOB: /^[^<>:"|?\n\r]+$/,

    /** Matches URL */
    URL: /^https?:\/\/[^\s]+$/,

    /** Matches code blocks in markdown */
    CODE_BLOCK: /```(\w+)?\n([\s\S]*?)```/g,

    /** Matches inline code */
    INLINE_CODE: /`([^`]+)`/g,

    /** Matches markdown links */
    MARKDOWN_LINK: /\[([^\]]+)\]\(([^)]+)\)/g,

    /** Matches @-mentions */
    MENTION: /@(\w+)/g,

    /** Matches file extensions */
    FILE_EXTENSION: /\.([a-zA-Z0-9]+)$/,
} as const;

// ============================================================================
// Language Mappings
// ============================================================================

/**
 * File extension to language ID mapping for syntax highlighting
 */
export const EXTENSION_TO_LANGUAGE: Record<string, string> = {
    ts: "typescript",
    tsx: "typescriptreact",
    js: "javascript",
    jsx: "javascriptreact",
    py: "python",
    rb: "ruby",
    rs: "rust",
    go: "go",
    java: "java",
    kt: "kotlin",
    swift: "swift",
    cs: "csharp",
    cpp: "cpp",
    c: "c",
    h: "c",
    hpp: "cpp",
    php: "php",
    sh: "shellscript",
    bash: "shellscript",
    zsh: "shellscript",
    ps1: "powershell",
    sql: "sql",
    json: "json",
    jsonc: "jsonc",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
    xml: "xml",
    html: "html",
    css: "css",
    scss: "scss",
    less: "less",
    md: "markdown",
    mdx: "mdx",
    vue: "vue",
    svelte: "svelte",
    dockerfile: "dockerfile",
    makefile: "makefile",
    cmake: "cmake",
    r: "r",
    scala: "scala",
    clj: "clojure",
    ex: "elixir",
    exs: "elixir",
    erl: "erlang",
    hs: "haskell",
    lua: "lua",
    perl: "perl",
    graphql: "graphql",
    proto: "protobuf",
    tf: "terraform",
    hcl: "hcl",
};

// ============================================================================
// Command Patterns (for Bash auto-approve)
// ============================================================================

/**
 * Command pattern mappings for permission auto-approval
 */
export const COMMAND_PATTERNS: Array<[string, string, string]> = [
    ["npm", "install", "npm install *"],
    ["npm", "i", "npm i *"],
    ["npm", "run", "npm run *"],
    ["yarn", "add", "yarn add *"],
    ["yarn", "install", "yarn install *"],
    ["pnpm", "install", "pnpm install *"],
    ["git", "add", "git add *"],
    ["git", "commit", "git commit *"],
    ["git", "push", "git push *"],
    ["git", "pull", "git pull *"],
    ["git", "checkout", "git checkout *"],
    ["docker", "run", "docker run *"],
    ["docker", "build", "docker build *"],
    ["node", "", "node *"],
    ["python", "", "python *"],
    ["python3", "", "python3 *"],
    ["pip", "install", "pip install *"],
    ["pip3", "install", "pip3 install *"],
];

// ============================================================================
// VSCode Extension Constants
// ============================================================================

/**
 * Extension configuration keys
 */
export const CONFIG_KEYS = {
    CLAUDE_EXECUTABLE: "claudeCodeGui.claude.executable",
    CLAUDE_MODEL: "claudeCodeGui.claude.model",
    THINKING_ENABLED: "claudeCodeGui.thinking.enabled",
    THINKING_INTENSITY: "claudeCodeGui.thinking.intensity",
    THINKING_SHOW_PROCESS: "claudeCodeGui.thinking.showProcess",
    YOLO_MODE: "claudeCodeGui.permissions.yoloMode",
    AUTO_APPROVE: "claudeCodeGui.permissions.autoApprove",
    MAX_HISTORY_SIZE: "claudeCodeGui.chat.maxHistorySize",
    STREAM_RESPONSES: "claudeCodeGui.chat.streamResponses",
    SHOW_TIMESTAMPS: "claudeCodeGui.chat.showTimestamps",
    CODE_BLOCK_THEME: "claudeCodeGui.chat.codeBlockTheme",
    WSL_ENABLED: "claudeCodeGui.wsl.enabled",
    WSL_DISTRO: "claudeCodeGui.wsl.distro",
    WSL_NODE_PATH: "claudeCodeGui.wsl.nodePath",
    WSL_CLAUDE_PATH: "claudeCodeGui.wsl.claudePath",
    UI_FONT_SIZE: "claudeCodeGui.ui.fontSize",
    UI_COMPACT_MODE: "claudeCodeGui.ui.compactMode",
    UI_SHOW_AVATARS: "claudeCodeGui.ui.showAvatars",
    CONTEXT_INCLUDE_FILE: "claudeCodeGui.context.includeFileContext",
    CONTEXT_INCLUDE_WORKSPACE: "claudeCodeGui.context.includeWorkspaceInfo",
    CONTEXT_MAX_LINES: "claudeCodeGui.context.maxContextLines",
} as const;

/**
 * Extension command IDs
 */
export const COMMAND_IDS = {
    OPEN_CHAT: "claude-code-gui.openChat",
    NEW_CONVERSATION: "claude-code-gui.newConversation",
    CLEAR_HISTORY: "claude-code-gui.clearHistory",
    EXPORT_CHAT: "claude-code-gui.exportChat",
    TOGGLE_THINKING_MODE: "claude-code-gui.toggleThinkingMode",
    SEND_SELECTION: "claude-code-gui.sendSelection",
    EXPLAIN_CODE: "claude-code-gui.explainCode",
    REFACTOR_CODE: "claude-code-gui.refactorCode",
    GENERATE_TESTS: "claude-code-gui.generateTests",
    FIX_ERROR: "claude-code-gui.fixError",
    LOAD_CONVERSATION: "claude-code-gui.loadConversation",
    NEW_SESSION: "claude-code-gui.newSession",
    STOP_REQUEST: "claude-code-gui.stopRequest",
} as const;

/**
 * View IDs
 */
export const VIEW_IDS = {
    CHAT_VIEW: "claude-code-gui.chatView",
    HISTORY_VIEW: "claude-code-gui.historyView",
} as const;

// ============================================================================
// Storage Keys
// ============================================================================

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
    CHAT_STORE: "claude-code-gui-store",
    SETTINGS_STORE: "claude-flow-settings-store",
    CONVERSATION_STORE: "claude-code-gui-conversation-store",
    PERMISSION_STORE: "claude-code-gui-permission-store",
    MCP_STORE: "claude-code-gui-mcp-store",
    UI_STORE: "claude-code-gui-ui-store",
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get tool icon name for a given tool
 */
export function getToolIcon(toolName: string): string {
    // Direct match
    if (TOOL_ICONS[toolName]) {
        return TOOL_ICONS[toolName];
    }

    // MCP tool prefix match
    if (toolName.startsWith("mcp__")) {
        return TOOL_ICONS["mcp__"];
    }

    return TOOL_ICONS.default;
}

/**
 * Get language ID from file path
 */
export function getLanguageFromPath(filePath: string): string {
    const match = filePath.match(PATTERNS.FILE_EXTENSION);
    if (match) {
        const ext = match[1].toLowerCase();
        return EXTENSION_TO_LANGUAGE[ext] || ext;
    }

    // Check for special filenames
    const filename = filePath.split(/[\\/]/).pop()?.toLowerCase() || "";
    if (filename === "dockerfile") return "dockerfile";
    if (filename === "makefile") return "makefile";
    if (filename === ".gitignore") return "ignore";
    if (filename === ".env") return "dotenv";

    return "plaintext";
}

/**
 * Get command pattern for permission auto-approval
 */
export function getCommandPattern(command: string): string {
    const parts = command.trim().split(/\s+/);
    if (parts.length === 0) return command;

    const baseCmd = parts[0];
    const subCmd = parts.length > 1 ? parts[1] : "";

    for (const [cmd, sub, pattern] of COMMAND_PATTERNS) {
        if (baseCmd === cmd && (sub === "" || subCmd === sub)) {
            return pattern;
        }
    }

    return command;
}

/**
 * Get token pricing for a model
 */
export function getTokenPricing(model: string): TokenPricing {
    return TOKEN_PRICING[model as ClaudeModel] || TOKEN_PRICING.default;
}

/**
 * Get context window size for a model
 */
export function getContextWindowSize(model: string): number {
    return CONTEXT_WINDOW_SIZE[model as ClaudeModel] || DEFAULT_CONTEXT_WINDOW_SIZE;
}

/**
 * Check if a tool execution status represents a terminal state
 */
export function isTerminalStatus(status: ToolExecutionStatus): boolean {
    return [
        ToolExecutionStatus.Completed,
        ToolExecutionStatus.Failed,
        ToolExecutionStatus.Denied,
        ToolExecutionStatus.Cancelled,
    ].includes(status);
}

/**
 * Check if a session status represents an active state
 */
export function isActiveSessionStatus(status: SessionStatus): boolean {
    return status === SessionStatus.Active || status === SessionStatus.Compacting;
}
