/**
 * Shared Utilities
 *
 * This module exports utility functions that can be used across
 * both the extension and webview components.
 *
 * @module shared/utils
 */

// ============================================================================
// ID Generation
// ============================================================================

export {
    generateId,
    createIdGenerator,
    generateRandomString,
    generateUUID,
    idGenerators,
    ID_PREFIXES,
} from "./id";

// ============================================================================
// Logging
// ============================================================================

export {
    logger,
    createModuleLogger,
    configureLogger,
    resetLoggerConfig,
    LogLevel,
    LOG_PREFIXES,
} from "./logger";

export type { LogEntry, LoggerConfig } from "./logger";
