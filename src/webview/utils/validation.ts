/**
 * Input Validation Utilities
 *
 * Provides functions for validating user input, configuration,
 * and permission patterns used throughout the application.
 *
 * @module utils/validation
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Result of a validation operation
 */
export interface ValidationResult {
    /** Whether the validation passed */
    valid: boolean;
    /** Error message if validation failed */
    error?: string;
    /** Warning messages (validation passes but with notes) */
    warnings?: string[];
}

/**
 * Server configuration for validation
 */
export interface ServerConfig {
    name: string;
    command: string;
    args?: string[];
    env?: Record<string, string>;
}

/**
 * Permission pattern for validation
 */
export interface PermissionPattern {
    type: "allow" | "deny";
    pattern: string;
    tool?: string;
}

// ============================================================================
// Message Validation
// ============================================================================

/**
 * Options for message validation
 */
export interface MessageValidationOptions {
    /** Maximum message length */
    maxLength?: number;
    /** Minimum message length */
    minLength?: number;
    /** Whether to allow empty messages */
    allowEmpty?: boolean;
    /** Whether to allow only whitespace */
    allowWhitespaceOnly?: boolean;
    /** Patterns that should not appear in the message */
    forbiddenPatterns?: RegExp[];
}

const defaultMessageOptions: MessageValidationOptions = {
    maxLength: 100000,
    minLength: 1,
    allowEmpty: false,
    allowWhitespaceOnly: false,
    forbiddenPatterns: [],
};

/**
 * Validate a user message
 */
export function validateMessage(
    message: string,
    options: MessageValidationOptions = {},
): ValidationResult {
    const opts = { ...defaultMessageOptions, ...options };
    const warnings: string[] = [];

    // Check for null/undefined
    if (message === null || message === undefined) {
        return { valid: false, error: "Message is required" };
    }

    // Check for empty message
    if (message.length === 0) {
        if (opts.allowEmpty) {
            return { valid: true };
        }
        return { valid: false, error: "Message cannot be empty" };
    }

    // Check for whitespace-only
    if (!opts.allowWhitespaceOnly && message.trim().length === 0) {
        return { valid: false, error: "Message cannot contain only whitespace" };
    }

    // Check minimum length
    if (opts.minLength && message.length < opts.minLength) {
        return {
            valid: false,
            error: `Message must be at least ${opts.minLength} character${opts.minLength !== 1 ? "s" : ""}`,
        };
    }

    // Check maximum length
    if (opts.maxLength && message.length > opts.maxLength) {
        return {
            valid: false,
            error: `Message cannot exceed ${opts.maxLength} characters (current: ${message.length})`,
        };
    }

    // Check for forbidden patterns
    if (opts.forbiddenPatterns) {
        for (const pattern of opts.forbiddenPatterns) {
            if (pattern.test(message)) {
                return {
                    valid: false,
                    error: "Message contains forbidden content",
                };
            }
        }
    }

    // Warn about very long messages
    if (message.length > 50000) {
        warnings.push("Very long messages may impact performance");
    }

    // Warn about potential secrets
    if (containsPotentialSecrets(message)) {
        warnings.push("Message may contain sensitive information like API keys or passwords");
    }

    return {
        valid: true,
        warnings: warnings.length > 0 ? warnings : undefined,
    };
}

/**
 * Check if a string might contain secrets
 */
function containsPotentialSecrets(text: string): boolean {
    const secretPatterns = [
        // API keys and tokens
        /(?:api[_-]?key|apikey|token|secret|password|auth)[=:]["']?[A-Za-z0-9_-]{16,}/i,
        // AWS keys
        /AKIA[0-9A-Z]{16}/,
        // Generic tokens
        /(?:sk|pk|rk|ak)[-_][a-zA-Z0-9]{20,}/,
        // GitHub tokens
        /gh[opsu]_[A-Za-z0-9_]{36,}/,
        // JWT tokens
        /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/,
        // Private keys
        /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    ];

    return secretPatterns.some((pattern) => pattern.test(text));
}

// ============================================================================
// Server Configuration Validation
// ============================================================================

/**
 * Validate an MCP server configuration
 */
export function validateServerConfig(config: ServerConfig): ValidationResult {
    const warnings: string[] = [];

    // Check required fields
    if (!config.name || typeof config.name !== "string") {
        return { valid: false, error: "Server name is required" };
    }

    if (!config.command || typeof config.command !== "string") {
        return { valid: false, error: "Server command is required" };
    }

    // Validate name format
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(config.name)) {
        return {
            valid: false,
            error: "Server name must start with a letter and contain only letters, numbers, underscores, and hyphens",
        };
    }

    // Validate name length
    if (config.name.length > 50) {
        return { valid: false, error: "Server name cannot exceed 50 characters" };
    }

    // Validate command
    const commandValidation = validateCommand(config.command);
    if (!commandValidation.valid) {
        return commandValidation;
    }

    // Validate args if present
    if (config.args !== undefined) {
        if (!Array.isArray(config.args)) {
            return { valid: false, error: "Server args must be an array" };
        }

        for (let i = 0; i < config.args.length; i++) {
            const arg = config.args[i];
            if (typeof arg !== "string") {
                return {
                    valid: false,
                    error: `Server arg at index ${i} must be a string`,
                };
            }
        }
    }

    // Validate env if present
    if (config.env !== undefined) {
        if (typeof config.env !== "object" || config.env === null) {
            return { valid: false, error: "Server env must be an object" };
        }

        for (const [key, value] of Object.entries(config.env)) {
            if (!/^[A-Z_][A-Z0-9_]*$/i.test(key)) {
                return {
                    valid: false,
                    error: `Invalid environment variable name: ${key}`,
                };
            }

            if (typeof value !== "string") {
                return {
                    valid: false,
                    error: `Environment variable ${key} must have a string value`,
                };
            }
        }
    }

    // Check for common MCP server patterns
    if (config.command === "npx" || config.command === "node") {
        // Common and expected
    } else if (config.command.includes("/")) {
        warnings.push("Using absolute path for command - ensure it exists on the system");
    }

    return {
        valid: true,
        warnings: warnings.length > 0 ? warnings : undefined,
    };
}

/**
 * Validate a shell command (basic security check)
 */
function validateCommand(command: string): ValidationResult {
    if (!command || command.trim().length === 0) {
        return { valid: false, error: "Command cannot be empty" };
    }

    // Check for obviously dangerous patterns
    const dangerousPatterns = [
        /\|.*rm\s+-rf/,
        /;\s*rm\s+-rf/,
        /`.*rm\s+-rf.*`/,
        /\$\(.*rm\s+-rf.*\)/,
        />\s*\/etc\//,
        />\s*\/dev\//,
        /:\(\)\s*{\s*:\|\s*:/, // Fork bomb
    ];

    for (const pattern of dangerousPatterns) {
        if (pattern.test(command)) {
            return {
                valid: false,
                error: "Command contains potentially dangerous patterns",
            };
        }
    }

    return { valid: true };
}

// ============================================================================
// Permission Pattern Validation
// ============================================================================

/**
 * Validate a permission pattern
 */
export function validatePermissionPattern(pattern: PermissionPattern): ValidationResult {
    const warnings: string[] = [];

    // Validate type
    if (pattern.type !== "allow" && pattern.type !== "deny") {
        return { valid: false, error: 'Permission type must be "allow" or "deny"' };
    }

    // Validate pattern string
    if (!pattern.pattern || typeof pattern.pattern !== "string") {
        return { valid: false, error: "Pattern string is required" };
    }

    // Check for empty pattern
    if (pattern.pattern.trim().length === 0) {
        return { valid: false, error: "Pattern cannot be empty" };
    }

    // Validate glob pattern syntax
    const globValidation = validateGlobPattern(pattern.pattern);
    if (!globValidation.valid) {
        return globValidation;
    }

    // Warn about overly permissive patterns
    if (pattern.type === "allow") {
        if (pattern.pattern === "*" || pattern.pattern === "**" || pattern.pattern === "**/*") {
            warnings.push("This pattern allows all paths - consider being more specific");
        }

        if (pattern.pattern.startsWith("/") && !pattern.pattern.includes("*")) {
            // Exact path match - this is fine
        } else if (!pattern.pattern.includes("/")) {
            warnings.push("Pattern does not include a directory - may match more than intended");
        }
    }

    // Validate tool if present
    if (pattern.tool !== undefined) {
        if (typeof pattern.tool !== "string") {
            return { valid: false, error: "Tool must be a string" };
        }

        if (pattern.tool.trim().length === 0) {
            return { valid: false, error: "Tool cannot be empty if specified" };
        }
    }

    return {
        valid: true,
        warnings: warnings.length > 0 ? warnings : undefined,
    };
}

/**
 * Validate a glob pattern syntax
 */
export function validateGlobPattern(pattern: string): ValidationResult {
    // Check for invalid characters
    const invalidChars = /[<>|:"\0]/;
    if (invalidChars.test(pattern)) {
        return { valid: false, error: "Pattern contains invalid characters" };
    }

    // Check for unbalanced brackets
    let bracketDepth = 0;
    let braceDepth = 0;

    for (const char of pattern) {
        if (char === "[") bracketDepth++;
        if (char === "]") bracketDepth--;
        if (char === "{") braceDepth++;
        if (char === "}") braceDepth--;

        if (bracketDepth < 0 || braceDepth < 0) {
            return { valid: false, error: "Pattern has unbalanced brackets" };
        }
    }

    if (bracketDepth !== 0) {
        return { valid: false, error: "Pattern has unclosed bracket" };
    }

    if (braceDepth !== 0) {
        return { valid: false, error: "Pattern has unclosed brace" };
    }

    return { valid: true };
}

// ============================================================================
// File Path Validation
// ============================================================================

/**
 * Validate a file path
 */
export function validateFilePath(path: string): ValidationResult {
    if (!path || typeof path !== "string") {
        return { valid: false, error: "File path is required" };
    }

    if (path.trim().length === 0) {
        return { valid: false, error: "File path cannot be empty" };
    }

    // Check for null bytes
    if (path.includes("\0")) {
        return { valid: false, error: "File path cannot contain null bytes" };
    }

    // Platform-specific validation
    const isWindows = /^[a-zA-Z]:/.test(path);

    if (isWindows) {
        // Windows path validation
        const invalidWindowsChars = /[<>"|?*]/;
        if (invalidWindowsChars.test(path.slice(2))) {
            return {
                valid: false,
                error: "File path contains invalid characters for Windows",
            };
        }
    } else {
        // Unix path validation - fewer restrictions
        // Just check for obviously bad patterns
    }

    // Check for path traversal attempts
    const normalizedPath = path.replace(/\\/g, "/");
    if (normalizedPath.includes("../") || normalizedPath.includes("/..")) {
        return {
            valid: true,
            warnings: ["Path contains parent directory references (..)"],
        };
    }

    // Warn about absolute paths
    const warnings: string[] = [];
    if (path.startsWith("/") || /^[a-zA-Z]:/.test(path)) {
        // This is fine, just informational
    }

    return {
        valid: true,
        warnings: warnings.length > 0 ? warnings : undefined,
    };
}

// ============================================================================
// URL Validation
// ============================================================================

/**
 * Validate a URL
 */
export function validateUrl(url: string): ValidationResult {
    if (!url || typeof url !== "string") {
        return { valid: false, error: "URL is required" };
    }

    if (url.trim().length === 0) {
        return { valid: false, error: "URL cannot be empty" };
    }

    try {
        const parsed = new URL(url);

        // Check for allowed protocols
        const allowedProtocols = ["http:", "https:"];
        if (!allowedProtocols.includes(parsed.protocol)) {
            return {
                valid: false,
                error: `URL protocol must be http or https (got: ${parsed.protocol})`,
            };
        }

        // Warn about insecure URLs
        const warnings: string[] = [];
        if (parsed.protocol === "http:") {
            warnings.push("URL uses insecure HTTP protocol");
        }

        // Check for localhost/internal IPs
        const host = parsed.hostname.toLowerCase();
        if (
            host === "localhost" ||
            host === "127.0.0.1" ||
            host.startsWith("192.168.") ||
            host.startsWith("10.")
        ) {
            warnings.push("URL points to a local or internal address");
        }

        return {
            valid: true,
            warnings: warnings.length > 0 ? warnings : undefined,
        };
    } catch {
        return { valid: false, error: "Invalid URL format" };
    }
}

// ============================================================================
// JSON Validation
// ============================================================================

/**
 * Validate JSON string
 */
export function validateJson(jsonString: string): ValidationResult {
    if (!jsonString || typeof jsonString !== "string") {
        return { valid: false, error: "JSON string is required" };
    }

    try {
        JSON.parse(jsonString);
        return { valid: true };
    } catch (error) {
        const message = error instanceof SyntaxError ? error.message : "Invalid JSON";
        return { valid: false, error: message };
    }
}

/**
 * Validate JSON against a simple schema
 */
export function validateJsonSchema(
    data: unknown,
    schema: {
        type: "object" | "array" | "string" | "number" | "boolean";
        required?: string[];
        properties?: Record<string, { type: string }>;
    },
): ValidationResult {
    // Check type
    if (schema.type === "object") {
        if (typeof data !== "object" || data === null || Array.isArray(data)) {
            return { valid: false, error: "Expected an object" };
        }

        const obj = data as Record<string, unknown>;

        // Check required properties
        if (schema.required) {
            for (const prop of schema.required) {
                if (!(prop in obj)) {
                    return { valid: false, error: `Missing required property: ${prop}` };
                }
            }
        }

        // Check property types
        if (schema.properties) {
            for (const [prop, propSchema] of Object.entries(schema.properties)) {
                if (prop in obj) {
                    const value = obj[prop];
                    const expectedType = propSchema.type;

                    if (expectedType === "array") {
                        if (!Array.isArray(value)) {
                            return {
                                valid: false,
                                error: `Property ${prop} must be an array`,
                            };
                        }
                    } else if (typeof value !== expectedType) {
                        return {
                            valid: false,
                            error: `Property ${prop} must be a ${expectedType}`,
                        };
                    }
                }
            }
        }
    } else if (schema.type === "array") {
        if (!Array.isArray(data)) {
            return { valid: false, error: "Expected an array" };
        }
    } else if (typeof data !== schema.type) {
        return { valid: false, error: `Expected a ${schema.type}` };
    }

    return { valid: true };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Combine multiple validation results
 */
export function combineValidationResults(...results: ValidationResult[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const result of results) {
        if (!result.valid && result.error) {
            errors.push(result.error);
        }
        if (result.warnings) {
            warnings.push(...result.warnings);
        }
    }

    if (errors.length > 0) {
        return {
            valid: false,
            error: errors.join("; "),
            warnings: warnings.length > 0 ? warnings : undefined,
        };
    }

    return {
        valid: true,
        warnings: warnings.length > 0 ? warnings : undefined,
    };
}

/**
 * Create a validator function with predefined options
 */
export function createMessageValidator(
    options: MessageValidationOptions,
): (message: string) => ValidationResult {
    return (message: string) => validateMessage(message, options);
}

/**
 * Check if a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

/**
 * Check if a value is a positive integer
 */
export function isPositiveInteger(value: unknown): value is number {
    return typeof value === "number" && Number.isInteger(value) && value > 0;
}

/**
 * Check if a value is a valid port number
 */
export function isValidPort(value: unknown): value is number {
    return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 65535;
}
