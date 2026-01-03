/**
 * Centralized Logger Utility
 *
 * Provides consistent logging across the application with proper error
 * context, log levels, and optional structured data.
 *
 * @module shared/utils/logger
 */

/**
 * Log levels in order of severity
 */
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    NONE = 4,
}

/**
 * Log entry structure for structured logging
 */
export interface LogEntry {
    /** Log level */
    level: LogLevel;
    /** Log message */
    message: string;
    /** Optional error object */
    error?: Error;
    /** Optional structured data */
    data?: Record<string, unknown>;
    /** Timestamp */
    timestamp: Date;
    /** Module/component name */
    module?: string;
}

/**
 * Logger configuration options
 */
export interface LoggerConfig {
    /** Minimum log level to output */
    minLevel: LogLevel;
    /** Whether to include timestamps in output */
    includeTimestamp: boolean;
    /** Whether to include module name in output */
    includeModule: boolean;
    /** Custom log handler for external logging systems */
    customHandler?: (entry: LogEntry) => void;
}

const defaultConfig: LoggerConfig = {
    minLevel: LogLevel.DEBUG,
    includeTimestamp: false,
    includeModule: true,
    customHandler: undefined,
};

let globalConfig = { ...defaultConfig };

/**
 * Configure the global logger settings
 *
 * @param config - Partial configuration to merge with defaults
 */
export function configureLogger(config: Partial<LoggerConfig>): void {
    globalConfig = { ...globalConfig, ...config };
}

/**
 * Reset logger configuration to defaults
 */
export function resetLoggerConfig(): void {
    globalConfig = { ...defaultConfig };
}

/**
 * Format a log message with optional prefix
 */
function formatMessage(module: string | undefined, message: string): string {
    if (globalConfig.includeModule && module) {
        return `[${module}] ${message}`;
    }
    return message;
}

/**
 * Internal logging function
 */
function log(
    level: LogLevel,
    message: string,
    options?: { error?: Error; data?: Record<string, unknown>; module?: string },
): void {
    if (level < globalConfig.minLevel) {
        return;
    }

    const entry: LogEntry = {
        level,
        message,
        error: options?.error,
        data: options?.data,
        timestamp: new Date(),
        module: options?.module,
    };

    // Call custom handler if configured
    if (globalConfig.customHandler) {
        globalConfig.customHandler(entry);
    }

    const formattedMessage = formatMessage(options?.module, message);

    // Output to console based on level
    switch (level) {
        case LogLevel.DEBUG:
            if (options?.data) {
                console.debug(formattedMessage, options.data);
            } else {
                console.debug(formattedMessage);
            }
            break;

        case LogLevel.INFO:
            if (options?.data) {
                console.info(formattedMessage, options.data);
            } else {
                console.info(formattedMessage);
            }
            break;

        case LogLevel.WARN:
            if (options?.error) {
                console.warn(formattedMessage, options.error);
            } else if (options?.data) {
                console.warn(formattedMessage, options.data);
            } else {
                console.warn(formattedMessage);
            }
            break;

        case LogLevel.ERROR:
            if (options?.error) {
                console.error(formattedMessage, options.error);
            } else if (options?.data) {
                console.error(formattedMessage, options.data);
            } else {
                console.error(formattedMessage);
            }
            break;
    }
}

/**
 * Centralized logger object
 *
 * Provides consistent logging methods across the application.
 *
 * @example
 * ```typescript
 * import { logger } from "../shared/utils";
 *
 * // Simple logging
 * logger.info("User logged in");
 * logger.error("Failed to save", new Error("Connection lost"));
 *
 * // With module context
 * logger.info("Request received", { module: "API" });
 *
 * // With structured data
 * logger.debug("Processing", { data: { userId: 123, action: "save" } });
 * ```
 */
export const logger = {
    /**
     * Log a debug message
     */
    debug: (
        message: string,
        options?: { data?: Record<string, unknown>; module?: string },
    ): void => {
        log(LogLevel.DEBUG, message, options);
    },

    /**
     * Log an info message
     */
    info: (
        message: string,
        options?: { data?: Record<string, unknown>; module?: string },
    ): void => {
        log(LogLevel.INFO, message, options);
    },

    /**
     * Log a warning message
     */
    warn: (
        message: string,
        options?: { error?: Error; data?: Record<string, unknown>; module?: string },
    ): void => {
        log(LogLevel.WARN, message, options);
    },

    /**
     * Log an error message
     */
    error: (
        message: string,
        errorOrOptions?: Error | { error?: Error; data?: Record<string, unknown>; module?: string },
    ): void => {
        if (errorOrOptions instanceof Error) {
            log(LogLevel.ERROR, message, { error: errorOrOptions });
        } else {
            log(LogLevel.ERROR, message, errorOrOptions);
        }
    },
};

/**
 * Create a logger instance with a fixed module name
 *
 * Useful for creating module-specific loggers.
 *
 * @param module - The module name to include in all log messages
 * @returns A logger object with the module name pre-configured
 *
 * @example
 * ```typescript
 * const log = createModuleLogger("ClaudeService");
 * log.info("Starting...");  // Outputs: [ClaudeService] Starting...
 * log.error("Failed", new Error("timeout"));
 * ```
 */
export function createModuleLogger(module: string) {
    return {
        debug: (message: string, data?: Record<string, unknown>): void => {
            log(LogLevel.DEBUG, message, { module, data });
        },

        info: (message: string, data?: Record<string, unknown>): void => {
            log(LogLevel.INFO, message, { module, data });
        },

        warn: (message: string, errorOrData?: Error | Record<string, unknown>): void => {
            if (errorOrData instanceof Error) {
                log(LogLevel.WARN, message, { module, error: errorOrData });
            } else {
                log(LogLevel.WARN, message, { module, data: errorOrData });
            }
        },

        error: (message: string, errorOrData?: Error | Record<string, unknown>): void => {
            if (errorOrData instanceof Error) {
                log(LogLevel.ERROR, message, { module, error: errorOrData });
            } else {
                log(LogLevel.ERROR, message, { module, data: errorOrData });
            }
        },
    };
}

/**
 * Log prefixes used in the application
 *
 * These are standard prefixes that can be used for consistent log formatting
 * when not using the structured logger.
 */
export const LOG_PREFIXES = {
    /** Extension host logs */
    EXTENSION: "[Extension]",
    /** Webview logs */
    WEBVIEW: "[Webview]",
    /** Claude service logs */
    CLAUDE_SERVICE: "[ClaudeService]",
    /** MCP service logs */
    MCP_SERVICE: "[MCPService]",
    /** Permission service logs */
    PERMISSION_SERVICE: "[PermissionService]",
    /** Conversation service logs */
    CONVERSATION_SERVICE: "[ConversationService]",
    /** Panel provider logs */
    PANEL_PROVIDER: "[PanelProvider]",
    /** Message handler logs */
    MESSAGE_HANDLER: "[MessageHandler]",
    /** Store logs */
    STORE: "[Store]",
    /** Hook logs */
    HOOK: "[Hook]",
    /** Component logs */
    COMPONENT: "[Component]",
    /** API logs */
    API: "[API]",
    /** Error boundary logs */
    ERROR_BOUNDARY: "[ErrorBoundary]",
} as const;
