/**
 * ID Generation Utilities
 *
 * Provides centralized functions for generating unique identifiers
 * used throughout the application.
 *
 * @module shared/utils/id
 */

/**
 * Generate a unique ID with a given prefix
 *
 * Format: `{prefix}-{timestamp}-{random}`
 *
 * @param prefix - The prefix for the ID (e.g., "notification", "conv", "msg")
 * @returns A unique ID string
 *
 * @example
 * ```typescript
 * const id = generateId("notification"); // "notification-1704067200000-k3j8f9g2h"
 * const convId = generateId("conv"); // "conv-1704067200000-m9n2b4v7x"
 * ```
 */
export function generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Create an ID generator factory for a specific prefix
 *
 * Use this when you need to generate many IDs with the same prefix.
 *
 * @param prefix - The prefix for generated IDs
 * @returns A function that generates IDs with the given prefix
 *
 * @example
 * ```typescript
 * const createNotificationId = createIdGenerator("notification");
 * const id1 = createNotificationId(); // "notification-1704067200000-k3j8f9g2h"
 * const id2 = createNotificationId(); // "notification-1704067200001-m9n2b4v7x"
 * ```
 */
export function createIdGenerator(prefix: string): () => string {
    return () => generateId(prefix);
}

/**
 * Standard ID prefixes used in the application
 */
export const ID_PREFIXES = {
    /** For notification messages */
    NOTIFICATION: "notification",
    /** For conversations */
    CONVERSATION: "conv",
    /** For chat messages */
    MESSAGE: "msg",
    /** For tool use blocks */
    TOOL_USE: "tool",
    /** For permission requests */
    PERMISSION: "perm",
    /** For session identifiers */
    SESSION: "session",
    /** For file attachments */
    ATTACHMENT: "attach",
    /** For MCP servers */
    MCP_SERVER: "mcp",
} as const;

/**
 * Pre-built ID generators for common use cases
 */
export const idGenerators = {
    /** Generate notification IDs */
    notification: createIdGenerator(ID_PREFIXES.NOTIFICATION),
    /** Generate conversation IDs */
    conversation: createIdGenerator(ID_PREFIXES.CONVERSATION),
    /** Generate message IDs */
    message: createIdGenerator(ID_PREFIXES.MESSAGE),
    /** Generate tool use IDs */
    toolUse: createIdGenerator(ID_PREFIXES.TOOL_USE),
    /** Generate permission request IDs */
    permission: createIdGenerator(ID_PREFIXES.PERMISSION),
    /** Generate session IDs */
    session: createIdGenerator(ID_PREFIXES.SESSION),
    /** Generate attachment IDs */
    attachment: createIdGenerator(ID_PREFIXES.ATTACHMENT),
    /** Generate MCP server IDs */
    mcpServer: createIdGenerator(ID_PREFIXES.MCP_SERVER),
};

/**
 * Generate a simple random string (no timestamp, no prefix)
 *
 * @param length - Length of the random string (default: 9)
 * @returns A random alphanumeric string
 *
 * @example
 * ```typescript
 * const token = generateRandomString(); // "k3j8f9g2h"
 * const longToken = generateRandomString(16); // "k3j8f9g2h5m7n4b2"
 * ```
 */
export function generateRandomString(length: number = 9): string {
    let result = "";
    while (result.length < length) {
        result += Math.random().toString(36).substring(2);
    }
    return result.substring(0, length);
}

/**
 * Generate a UUID v4 (random)
 *
 * @returns A UUID v4 string
 *
 * @example
 * ```typescript
 * const uuid = generateUUID(); // "550e8400-e29b-41d4-a716-446655440000"
 * ```
 */
export function generateUUID(): string {
    // Use crypto.randomUUID if available (modern browsers/Node.js)
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    // Fallback implementation
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
