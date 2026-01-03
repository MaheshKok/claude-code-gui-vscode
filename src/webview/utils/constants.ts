/**
 * Application Constants
 *
 * This module re-exports shared constants and provides webview-specific constants.
 * All common constants are defined in `../../shared/constants` for consistency
 * across the application.
 *
 * @module utils/constants
 */

// ============================================================================
// Imports from shared constants (for creating legacy aliases)
// ============================================================================
import {
    BREAKPOINT_VALUES as SharedBreakpointValues,
    SIDEBAR_CONFIG as SharedSidebarConfig,
    INPUT_CONFIG as SharedInputConfig,
    ANIMATION_DURATION as SharedAnimationDuration,
    DEBOUNCE_DELAY as SharedDebounceDelay,
    STATUS_COLORS as SharedStatusColors,
    PATTERNS as SharedPatterns,
    Breakpoint,
} from "../../shared/constants";

// ============================================================================
// Re-export all shared constants
// ============================================================================
export {
    // Enums (core)
    MessageType,
    MessageRole,
    MessageStatus,
    ToolExecutionStatus,
    ToolName,
    PermissionStatus,
    PermissionDecision,
    ClaudeModel,
    ThinkingIntensity,
    SessionStatus,
    ThemeMode,
    CodeBlockTheme,
    SidebarTab,
    ModalType,
    Breakpoint,
    NotificationType,
    SystemMessageSeverity,
    ErrorAction,

    // Enums (additional - from enums.ts)
    FileSystemItemType,
    AttachmentStatus,
    AttachmentType,
    MCPConnectionType,
    MCPServerCategory,
    CopyState,
    InstallState,
    LoadingState,
    ClipboardContentType,
    ExportFormat,
    InsertPosition,
    DiffLineType,
    SlashCommandType,
    MentionSuggestionType,
    MessageGroupType,

    // Display name mappings
    MCP_CONNECTION_TYPE_LABELS,
    FILE_SYSTEM_ITEM_TYPE_LABELS,
    INSTALL_STATE_LABELS,
    SLASH_COMMAND_TYPE_LABELS,

    // Model constants
    MODEL_DISPLAY_NAMES,
    MODEL_DESCRIPTIONS,
    DEFAULT_MODEL,
    THINKING_INTENSITY_NAMES,
    DEFAULT_THINKING_INTENSITY,

    // Layout constants (shared format with UPPER_CASE keys)
    BREAKPOINT_VALUES,
    SIDEBAR_CONFIG as SHARED_SIDEBAR_CONFIG,
    INPUT_CONFIG as SHARED_INPUT_CONFIG,
    ANIMATION_DURATION,
    DEBOUNCE_DELAY,

    // Token and pricing
    TOKEN_PRICING,
    CONTEXT_WINDOW_SIZE,
    DEFAULT_CONTEXT_WINDOW_SIZE,
    type TokenPricing,

    // Default settings (shared format)
    DEFAULT_WSL_CONFIG,
    DEFAULT_UI_SETTINGS,
    DEFAULT_CHAT_SETTINGS,
    DEFAULT_PERMISSION_SETTINGS as SHARED_PERMISSION_SETTINGS,
    DEFAULT_THINKING_SETTINGS,

    // Tool and message icons
    TOOL_ICONS,
    MESSAGE_TYPE_ICONS,

    // Status colors (shared format with UPPER_CASE keys)
    STATUS_COLORS as SHARED_STATUS_COLORS,
    TOOL_STATUS_COLORS,

    // Patterns and language mappings (shared format with UPPER_CASE keys)
    PATTERNS as SHARED_PATTERNS,
    EXTENSION_TO_LANGUAGE,
    COMMAND_PATTERNS,

    // VSCode extension constants
    CONFIG_KEYS,
    COMMAND_IDS,
    VIEW_IDS,
    STORAGE_KEYS,

    // Helper functions
    getToolIcon,
    getLanguageFromPath,
    getCommandPattern,
    getTokenPricing,
    getContextWindowSize,
    isTerminalStatus,
    isActiveSessionStatus,

    // UI Strings (from ui-strings.ts)
    MODAL_TITLES,
    PLACEHOLDERS,
    UI_LABELS,
    TOOLTIPS,
    ERROR_MESSAGES,
    ARIA_LABELS,
    LOG_PREFIXES,
    CONFIRMATION_MESSAGES,
    SUCCESS_MESSAGES,

    // Limits and configuration (from limits.ts)
    FILE_LIMITS,
    SUPPORTED_FILE_TYPES,
    MESSAGE_LIMITS,
    NOTIFICATION_CONFIG,
    RETRY_CONFIG,
    UI_THRESHOLDS,
    TOKEN_LIMITS,
    CACHE_CONFIG,
    HISTORY_LIMITS,
} from "../../shared/constants";

// ============================================================================
// Webview-specific Default Settings
// ============================================================================

/**
 * Default theme settings (webview-specific)
 */
export const DEFAULT_THEME_SETTINGS = {
    mode: "auto" as const,
    fontSize: 14,
    fontFamily: "var(--vscode-font-family)",
};

/**
 * Default editor settings (webview-specific)
 */
export const DEFAULT_EDITOR_SETTINGS = {
    tabSize: 2,
    useTabs: false,
    wordWrap: true,
    showLineNumbers: true,
    showMinimap: false,
    bracketMatching: true,
};

/**
 * Default Claude settings (webview-specific)
 */
export const DEFAULT_CLAUDE_SETTINGS = {
    cliPath: null,
    defaultModel: "claude-sonnet-4-5-20250929",
    useWsl: false,
    defaultWorkingDirectory: null,
    maxTokensPerRequest: null,
    customEnv: {},
};

/**
 * Default permission settings (webview-specific format)
 */
export const DEFAULT_PERMISSION_SETTINGS = {
    autoApprove: {
        enabled: false,
        tools: ["Read", "Glob", "Grep", "LSP", "TodoRead"],
        patterns: [],
        readOperations: true,
        projectDirectory: true,
    },
    denyList: [],
    timeoutMs: 60000,
    showPrompts: true,
};

/**
 * Default display settings (webview-specific)
 */
export const DEFAULT_DISPLAY_SETTINGS = {
    messageRendering: {
        showTimestamps: true,
        showToolDetails: true,
        showThinking: true,
        enableSyntaxHighlighting: true,
        maxContentLength: 50000,
        codeTheme: "auto" as const,
    },
    showTokenCounts: true,
    showCostEstimates: true,
    showTiming: true,
    showToolDetails: true,
    showThinking: true,
    enableAnimations: true,
};

/**
 * Default keyboard shortcuts (webview-specific)
 */
export const DEFAULT_SHORTCUTS = {
    submit: "Enter",
    newLine: "Shift+Enter",
    stop: "Escape",
    clear: "Ctrl+L",
    toggleSidebar: "Ctrl+B",
    focusInput: "Ctrl+/",
};

// ============================================================================
// Popular MCP Servers (webview-specific)
// ============================================================================

/**
 * List of popular/recommended MCP servers
 */
export interface MCPServerConfig {
    name: string;
    displayName: string;
    description: string;
    command: string;
    args?: string[];
    category: "filesystem" | "git" | "database" | "web" | "tools" | "other";
    recommended?: boolean;
    docsUrl?: string;
}

export const POPULAR_MCP_SERVERS: MCPServerConfig[] = [
    {
        name: "filesystem",
        displayName: "Filesystem",
        description: "Access to local filesystem with configurable allowed paths",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed"],
        category: "filesystem",
        recommended: true,
        docsUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem",
    },
    {
        name: "github",
        displayName: "GitHub",
        description: "GitHub API integration for repositories, issues, and PRs",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-github"],
        category: "git",
        recommended: true,
        docsUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/github",
    },
    {
        name: "postgres",
        displayName: "PostgreSQL",
        description: "Connect to PostgreSQL databases with read/write access",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-postgres", "postgresql://..."],
        category: "database",
        docsUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/postgres",
    },
    {
        name: "sqlite",
        displayName: "SQLite",
        description: "SQLite database access for local data storage",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-sqlite", "/path/to/database.db"],
        category: "database",
        docsUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/sqlite",
    },
    {
        name: "puppeteer",
        displayName: "Puppeteer",
        description: "Browser automation for web scraping and testing",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-puppeteer"],
        category: "web",
        docsUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer",
    },
    {
        name: "fetch",
        displayName: "Fetch",
        description: "HTTP fetch capabilities for web requests",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
        category: "web",
        docsUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/fetch",
    },
    {
        name: "memory",
        displayName: "Memory",
        description: "Persistent memory storage across sessions",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-memory"],
        category: "tools",
        docsUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/memory",
    },
    {
        name: "slack",
        displayName: "Slack",
        description: "Slack workspace integration for messaging",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-slack"],
        category: "tools",
        docsUrl: "https://github.com/modelcontextprotocol/servers/tree/main/src/slack",
    },
    {
        name: "claude-flow",
        displayName: "Claude Flow",
        description: "Multi-agent swarm orchestration and coordination",
        command: "npx",
        args: ["claude-flow@alpha", "mcp", "start"],
        category: "tools",
        recommended: true,
        docsUrl: "https://github.com/ruvnet/claude-flow",
    },
];

// ============================================================================
// Backward Compatibility Aliases
// These maintain the original API for existing consumers
// ============================================================================

/**
 * Context window sizes by model (legacy format for backward compatibility)
 * @deprecated Use CONTEXT_WINDOW_SIZE from shared constants instead
 */
export const CONTEXT_WINDOW_SIZES: Record<string, number> = {
    "claude-sonnet-4-5-20250929": 200000,
    "claude-opus-4-5-20251101": 200000,
    "claude-haiku-4-5-20251001": 200000,
    default: 200000,
};

/**
 * Layout breakpoints in pixels (legacy format with lowercase keys)
 * @deprecated Use BREAKPOINT_VALUES from shared constants instead
 */
export const BREAKPOINTS = {
    xs: SharedBreakpointValues[Breakpoint.XS],
    sm: SharedBreakpointValues[Breakpoint.SM],
    md: SharedBreakpointValues[Breakpoint.MD],
    lg: SharedBreakpointValues[Breakpoint.LG],
    xl: SharedBreakpointValues[Breakpoint.XL],
};

/**
 * Sidebar configuration (legacy format with camelCase keys)
 * @deprecated Use SHARED_SIDEBAR_CONFIG from shared constants instead
 */
export const SIDEBAR_CONFIG = {
    minWidth: SharedSidebarConfig.MIN_WIDTH,
    maxWidth: SharedSidebarConfig.MAX_WIDTH,
    defaultWidth: SharedSidebarConfig.DEFAULT_WIDTH,
    collapsedWidth: SharedSidebarConfig.COLLAPSED_WIDTH,
};

/**
 * Input area configuration (legacy format with camelCase keys)
 * @deprecated Use SHARED_INPUT_CONFIG from shared constants instead
 */
export const INPUT_CONFIG = {
    minHeight: SharedInputConfig.MIN_HEIGHT,
    maxHeight: SharedInputConfig.MAX_HEIGHT,
    defaultHeight: SharedInputConfig.DEFAULT_HEIGHT,
};

/**
 * Animation durations in milliseconds (legacy format with camelCase keys)
 * @deprecated Use ANIMATION_DURATION from shared constants instead
 */
export const ANIMATION_DURATIONS = {
    fast: SharedAnimationDuration.FAST,
    normal: SharedAnimationDuration.NORMAL,
    slow: SharedAnimationDuration.SLOW,
};

/**
 * Debounce delays in milliseconds (legacy format with camelCase keys)
 * @deprecated Use DEBOUNCE_DELAY from shared constants instead
 */
export const DEBOUNCE_DELAYS = {
    input: SharedDebounceDelay.INPUT,
    search: SharedDebounceDelay.SEARCH,
    resize: SharedDebounceDelay.RESIZE,
    autosave: SharedDebounceDelay.AUTOSAVE,
};

/**
 * Status indicator colors (legacy format with camelCase keys)
 * @deprecated Use SHARED_STATUS_COLORS from shared constants instead
 */
export const STATUS_COLORS = {
    success: SharedStatusColors.SUCCESS,
    error: SharedStatusColors.ERROR,
    warning: SharedStatusColors.WARNING,
    info: SharedStatusColors.INFO,
    pending: SharedStatusColors.PENDING,
    active: SharedStatusColors.ACTIVE,
};

/**
 * Common regex patterns (legacy format with camelCase keys)
 * @deprecated Use SHARED_PATTERNS from shared constants instead
 */
export const PATTERNS = {
    /** Matches file paths */
    filePath: SharedPatterns.FILE_PATH,

    /** Matches glob patterns */
    glob: SharedPatterns.GLOB,

    /** Matches URL */
    url: SharedPatterns.URL,

    /** Matches code blocks in markdown */
    codeBlock: SharedPatterns.CODE_BLOCK,

    /** Matches inline code */
    inlineCode: SharedPatterns.INLINE_CODE,

    /** Matches markdown links */
    markdownLink: SharedPatterns.MARKDOWN_LINK,

    /** Matches @-mentions */
    mention: SharedPatterns.MENTION,

    /** Matches file extensions */
    fileExtension: SharedPatterns.FILE_EXTENSION,
};
