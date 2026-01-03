/**
 * Application Limits and Configuration Constants
 *
 * Centralized location for all numeric limits, thresholds, and configuration
 * values used throughout the application.
 *
 * @module shared/constants/limits
 */

// ============================================================================
// File Limits
// ============================================================================

/**
 * File size and attachment limits
 */
export const FILE_LIMITS = {
    /** Maximum attachment size in bytes (10MB) */
    MAX_ATTACHMENT_SIZE: 10 * 1024 * 1024,
    /** Maximum number of attachments per message */
    MAX_ATTACHMENTS: 10,
    /** Maximum file name length */
    MAX_FILENAME_LENGTH: 255,
    /** Maximum path length */
    MAX_PATH_LENGTH: 4096,
} as const;

/**
 * Supported file types for attachments
 */
export const SUPPORTED_FILE_TYPES = {
    /** Supported image file extensions */
    IMAGES: ["png", "jpg", "jpeg", "gif", "webp", "svg"],
    /** Supported code file extensions */
    CODE: ["ts", "tsx", "js", "jsx", "py", "rb", "go", "rs", "java", "c", "cpp", "h", "hpp"],
    /** Supported document file extensions */
    DOCUMENTS: ["md", "txt", "json", "yaml", "yml", "toml", "xml"],
    /** All supported extensions (wildcard means all) */
    ALL: ["*"],
} as const;

// ============================================================================
// Message Limits
// ============================================================================

/**
 * Message content limits
 */
export const MESSAGE_LIMITS = {
    /** Maximum message length in characters */
    MAX_LENGTH: 100000,
    /** Maximum code block length before truncation */
    MAX_CODE_BLOCK_LENGTH: 50000,
    /** Maximum number of messages to display */
    MAX_DISPLAY_MESSAGES: 1000,
    /** Truncation indicator suffix */
    TRUNCATION_INDICATOR: "...[truncated]",
} as const;

// ============================================================================
// Notification Configuration
// ============================================================================

/**
 * Notification timing and display settings
 */
export const NOTIFICATION_CONFIG = {
    /** Info notification timeout in milliseconds */
    INFO_TIMEOUT: 5000,
    /** Success notification timeout in milliseconds */
    SUCCESS_TIMEOUT: 3000,
    /** Warning notification timeout in milliseconds */
    WARNING_TIMEOUT: 7000,
    /** Error notification timeout in milliseconds */
    ERROR_TIMEOUT: 10000,
    /** Default auto-dismiss timeout in milliseconds */
    DEFAULT_TIMEOUT: 5000,
    /** Maximum number of visible notifications */
    MAX_VISIBLE: 5,
} as const;

// ============================================================================
// Retry Configuration
// ============================================================================

/**
 * Retry logic configuration for network operations
 */
export const RETRY_CONFIG = {
    /** Maximum number of retry attempts */
    MAX_ATTEMPTS: 3,
    /** Base delay between retries in milliseconds */
    BASE_DELAY: 1000,
    /** Maximum delay between retries in milliseconds */
    MAX_DELAY: 10000,
    /** Backoff multiplier for exponential backoff */
    BACKOFF_MULTIPLIER: 2,
} as const;

// ============================================================================
// UI Thresholds
// ============================================================================

/**
 * UI behavior thresholds
 */
export const UI_THRESHOLDS = {
    /** Scroll distance from bottom to trigger auto-scroll */
    AUTO_SCROLL_THRESHOLD: 100,
    /** Minimum drag distance to register as a resize */
    MIN_DRAG_DISTANCE: 5,
    /** Double-click time window in milliseconds */
    DOUBLE_CLICK_DELAY: 300,
    /** Long press duration in milliseconds */
    LONG_PRESS_DURATION: 500,
} as const;

// ============================================================================
// Token Limits
// ============================================================================

/**
 * Token-related limits and thresholds
 */
export const TOKEN_LIMITS = {
    /** Warning threshold percentage of context window */
    CONTEXT_WARNING_PERCENT: 80,
    /** Critical threshold percentage of context window */
    CONTEXT_CRITICAL_PERCENT: 95,
    /** Maximum tokens to display in abbreviated format */
    ABBREVIATION_THRESHOLD: 1000,
} as const;

// ============================================================================
// Cache Configuration
// ============================================================================

/**
 * Cache timing and size configuration
 */
export const CACHE_CONFIG = {
    /** Default cache TTL in milliseconds (1 hour) */
    DEFAULT_TTL: 60 * 60 * 1000,
    /** Short-lived cache TTL in milliseconds (5 minutes) */
    SHORT_TTL: 5 * 60 * 1000,
    /** Long-lived cache TTL in milliseconds (24 hours) */
    LONG_TTL: 24 * 60 * 60 * 1000,
    /** Maximum number of cached items */
    MAX_ITEMS: 100,
} as const;

// ============================================================================
// History Limits
// ============================================================================

/**
 * Conversation history limits
 */
export const HISTORY_LIMITS = {
    /** Maximum number of conversations to store */
    MAX_CONVERSATIONS: 1000,
    /** Maximum number of messages per conversation to store */
    MAX_MESSAGES_PER_CONVERSATION: 500,
    /** Maximum age of conversations in days before cleanup */
    MAX_AGE_DAYS: 90,
    /** Number of recent conversations to show by default */
    RECENT_COUNT: 20,
} as const;
