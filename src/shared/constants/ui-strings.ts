/**
 * UI String Constants
 *
 * Centralized location for all UI strings including labels, placeholders,
 * tooltips, modal titles, and error messages. This improves maintainability
 * and enables potential future internationalization.
 *
 * @module shared/constants/ui-strings
 */

// ============================================================================
// Modal Titles
// ============================================================================

export const MODAL_TITLES = {
    SETTINGS: "Settings",
    SELECT_FILE: "Select File",
    ENFORCE_MODEL: "Enforce Model",
    PERMISSION_REQUEST: "Permission Request",
    MCP_SERVERS: "MCP Servers",
    THINKING_INTENSITY: "Thinking Mode Intensity",
    SLASH_COMMANDS: "Commands & Prompt Snippets",
    INSTALL_CLAUDE: "Install Claude CLI",
    CONFIRM_ACTION: "Confirm Action",
    ERROR: "Error",
    ABOUT: "About",
} as const;

// ============================================================================
// Placeholder Text
// ============================================================================

export const PLACEHOLDERS = {
    // WSL Settings
    WSL_DISTRO: "Ubuntu",
    NODE_PATH: "/usr/bin/node",
    CLAUDE_PATH: "/usr/local/bin/claude",

    // Search
    SEARCH_FILES: "Search files...",
    SEARCH_COMMANDS: "Search commands and snippets...",
    SEARCH_CONVERSATIONS: "Search conversations...",

    // Permissions
    DENY_REASON: "Explain why you're denying this request...",
    PERMISSION_PATTERN: "e.g., npm i * or git status",
    COMMAND_PATTERN: "Command pattern (e.g., npm i *)",

    // Commands
    COMMAND_NAME: "e.g., fix-bug",
    COMMAND_PROMPT: "e.g., Help me fix this bug in my code...",

    // MCP
    MCP_SERVER_NAME: "my-server",
    SERVER_PATH: "/path/to/server",

    // Chat
    MESSAGE_INPUT: "Ask Claude anything...",
    NEW_CONVERSATION: "New Conversation",
} as const;

// ============================================================================
// UI Labels
// ============================================================================

export const UI_LABELS = {
    // Actions
    COPY: "Copy",
    COPIED: "Copied",
    STOP: "Stop",
    CANCEL: "Cancel",
    CONFIRM: "Confirm",
    SAVE: "Save",
    DELETE: "Delete",
    CLOSE: "Close",
    CLEAR: "Clear",
    RESET: "Reset",
    APPLY: "Apply",
    DONE: "Done",

    // Status
    RUNNING: "Running",
    LOADING: "Loading",
    PROCESSING: "Processing",
    CONNECTING: "Connecting",
    CONNECTED: "Connected",
    DISCONNECTED: "Disconnected",

    // Navigation
    CHAT_HISTORY: "Chat History",
    NO_CONVERSATIONS: "No conversations found",
    NO_RESULTS: "No results found",

    // Settings
    ENABLE_YOLO: "Enable Yolo Mode",
    PLAN: "Plan",
    YOLO: "YOLO",

    // Commands
    ADD_CUSTOM_COMMAND: "Add Custom Command",
    QUICK_COMMAND: "Quick Command",

    // Modals
    ALLOW: "Allow",
    DENY: "Deny",
    ALLOW_ALWAYS: "Allow Always",
    DENY_ALWAYS: "Deny Always",
} as const;

// ============================================================================
// Tooltips
// ============================================================================

export const TOOLTIPS = {
    // Clipboard
    COPY_TO_CLIPBOARD: "Copy to clipboard",
    COPY_CODE: "Copy code",

    // Actions
    CONFIRM_DELETE: "Confirm delete",
    DELETE_CONVERSATION: "Delete conversation",
    OPEN_DIFF_VIEW: "Open Diff View",
    OPEN_DIFF: "Open diff",

    // Cache
    CACHE_CREATED: "Cache created",
    CACHE_READ: "Cache read",

    // Todo
    TODO_UPDATE: "Todo Update",

    // Input
    ADD_FILE: "Add File (@)",
    MCP_TOOLS: "MCP Tools",
    ADD_IMAGE: "Add Image",
    COMMANDS: "Commands (/)",

    // Status
    TOTAL_TOKENS: "Total Tokens",
    TOTAL_REQUESTS: "Total Requests",
    SESSION_COST: "Session Cost",
    STOP_PROCESSING: "Stop processing (Escape)",

    // History
    CLEAR_SEARCH: "Clear search (Esc)",
    CLOSE_HISTORY: "Close history (Esc)",

    // Header
    NEW_SESSION: "Start new session",
    OPEN_HISTORY: "Open conversation history",
    OPEN_SETTINGS: "Open settings",
} as const;

// ============================================================================
// Error Messages
// ============================================================================

export const ERROR_MESSAGES = {
    // Clipboard
    COPY_FAILED: "Copy failed",
    COPY_COMMAND_FAILED: "Copy command failed",

    // Rendering
    JS_ERROR: "JavaScript Error",
    RENDER_FAILED: "Failed to render application",

    // File Operations
    BLOB_CONVERT_FAILED: "Failed to convert blob to base64",
    FILE_READER_ERROR: "FileReader error",
    FILE_NOT_FOUND: "File not found",
    FILE_TOO_LARGE: "File is too large",

    // Network
    CONNECTION_FAILED: "Connection failed",
    REQUEST_TIMEOUT: "Request timed out",
    NETWORK_ERROR: "Network error",

    // Session
    SESSION_EXPIRED: "Session expired",
    SESSION_NOT_FOUND: "Session not found",

    // Authentication
    AUTH_REQUIRED: "Authentication required",
    AUTH_FAILED: "Authentication failed",

    // Generic
    UNKNOWN_ERROR: "An unknown error occurred",
    OPERATION_FAILED: "Operation failed",
} as const;

// ============================================================================
// ARIA Labels (Accessibility)
// ============================================================================

export const ARIA_LABELS = {
    CLOSE_MODAL: "Close modal",
    CLOSE_DIALOG: "Close dialog",
    TOGGLE_MENU: "Toggle menu",
    EXPAND_SECTION: "Expand section",
    COLLAPSE_SECTION: "Collapse section",
    NAVIGATION: "Navigation",
    MAIN_CONTENT: "Main content",
    SEARCH_INPUT: "Search input",
    MESSAGE_LIST: "Message list",
    SEND_MESSAGE: "Send message",
    STOP_GENERATION: "Stop generation",
} as const;

// ============================================================================
// Log Prefixes
// ============================================================================

export const LOG_PREFIXES = {
    WEBVIEW: "[Webview]",
    USE_VSCODE: "[useVSCode]",
    USE_MESSAGES: "[useMessages]",
    CHAT_STORE: "[ChatStore]",
    SETTINGS_STORE: "[SettingsStore]",
    MCP_STORE: "[MCPStore]",
    PERMISSION_STORE: "[PermissionStore]",
} as const;

// ============================================================================
// Confirmation Messages
// ============================================================================

export const CONFIRMATION_MESSAGES = {
    DELETE_CONVERSATION: "Are you sure you want to delete this conversation?",
    CLEAR_HISTORY: "Are you sure you want to clear all conversation history?",
    RESET_SETTINGS: "Are you sure you want to reset all settings to defaults?",
    DISCONNECT_SERVER: "Are you sure you want to disconnect this server?",
} as const;

// ============================================================================
// Success Messages
// ============================================================================

export const SUCCESS_MESSAGES = {
    COPIED: "Copied to clipboard",
    SAVED: "Settings saved successfully",
    DELETED: "Deleted successfully",
    CONNECTED: "Connected successfully",
} as const;
