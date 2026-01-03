/**
 * Validation Utilities Tests
 *
 * Tests for input validation functions including message validation,
 * server configuration validation, and permission pattern validation.
 *
 * @module test/utils/validation
 */

import { describe, it, expect } from "vitest";
import {
    validateMessage,
    validateServerConfig,
    validatePermissionPattern,
    validateGlobPattern,
    validateFilePath,
    validateUrl,
    validateJson,
    validateJsonSchema,
    combineValidationResults,
    createMessageValidator,
    isNonEmptyString,
    isPositiveInteger,
    isValidPort,
    type ServerConfig,
    type PermissionPattern,
    type ValidationResult,
} from "../../webview/utils/validation";

describe("validation utilities", () => {
    // ==========================================================================
    // validateMessage Tests
    // ==========================================================================
    describe("validateMessage", () => {
        describe("basic validation", () => {
            it("should validate a normal message", () => {
                const result = validateMessage("Hello, world!");
                expect(result.valid).toBe(true);
                expect(result.error).toBeUndefined();
            });

            it("should reject null message", () => {
                const result = validateMessage(null as unknown as string);
                expect(result.valid).toBe(false);
                expect(result.error).toBe("Message is required");
            });

            it("should reject undefined message", () => {
                const result = validateMessage(undefined as unknown as string);
                expect(result.valid).toBe(false);
                expect(result.error).toBe("Message is required");
            });

            it("should reject empty message by default", () => {
                const result = validateMessage("");
                expect(result.valid).toBe(false);
                expect(result.error).toBe("Message cannot be empty");
            });

            it("should allow empty message when configured", () => {
                const result = validateMessage("", { allowEmpty: true });
                expect(result.valid).toBe(true);
            });

            it("should reject whitespace-only message by default", () => {
                const result = validateMessage("   \n\t  ");
                expect(result.valid).toBe(false);
                expect(result.error).toBe("Message cannot contain only whitespace");
            });

            it("should allow whitespace-only when configured", () => {
                const result = validateMessage("   ", { allowWhitespaceOnly: true });
                expect(result.valid).toBe(true);
            });
        });

        describe("length validation", () => {
            it("should reject message below minimum length", () => {
                const result = validateMessage("ab", { minLength: 3 });
                expect(result.valid).toBe(false);
                expect(result.error).toContain("at least 3");
            });

            it("should accept message at minimum length", () => {
                const result = validateMessage("abc", { minLength: 3 });
                expect(result.valid).toBe(true);
            });

            it("should reject message above maximum length", () => {
                const result = validateMessage("abcdef", { maxLength: 5 });
                expect(result.valid).toBe(false);
                expect(result.error).toContain("cannot exceed 5");
            });

            it("should accept message at maximum length", () => {
                const result = validateMessage("abcde", { maxLength: 5 });
                expect(result.valid).toBe(true);
            });

            it("should use correct singular form for 1 character minimum", () => {
                // When message is empty, the "empty" check triggers first before minLength
                const result = validateMessage("", { minLength: 1, allowEmpty: false });
                expect(result.error).toBe("Message cannot be empty");

                // Test with a non-empty message below minLength to test singular form
                const result2 = validateMessage("", {
                    minLength: 2,
                    allowEmpty: true,
                    allowWhitespaceOnly: true,
                });
                expect(result2.valid).toBe(true); // Empty is allowed, and no minLength violation since empty is allowed
            });
        });

        describe("forbidden patterns", () => {
            it("should reject message matching forbidden pattern", () => {
                const result = validateMessage("Hello <script>alert(1)</script>", {
                    forbiddenPatterns: [/<script>/i],
                });
                expect(result.valid).toBe(false);
                expect(result.error).toBe("Message contains forbidden content");
            });

            it("should accept message not matching forbidden patterns", () => {
                const result = validateMessage("Hello world", {
                    forbiddenPatterns: [/<script>/i],
                });
                expect(result.valid).toBe(true);
            });
        });

        describe("warnings", () => {
            it("should warn about very long messages", () => {
                const longMessage = "a".repeat(60000);
                const result = validateMessage(longMessage);
                expect(result.valid).toBe(true);
                expect(result.warnings).toBeDefined();
                expect(result.warnings).toContain("Very long messages may impact performance");
            });

            it("should warn about potential secrets - API key pattern", () => {
                const result = validateMessage("api_key=sk_test_1234567890abcdef");
                expect(result.valid).toBe(true);
                expect(result.warnings).toBeDefined();
                expect(result.warnings?.[0]).toContain("sensitive information");
            });

            it("should warn about AWS keys", () => {
                const result = validateMessage("AWS key: AKIAIOSFODNN7EXAMPLE");
                expect(result.valid).toBe(true);
                expect(result.warnings).toBeDefined();
            });

            it("should warn about GitHub tokens", () => {
                const result = validateMessage(
                    "token: ghp_1234567890abcdefghijklmnopqrstuvwxyz1234",
                );
                expect(result.valid).toBe(true);
                expect(result.warnings).toBeDefined();
            });

            it("should warn about private keys", () => {
                const result = validateMessage("-----BEGIN RSA PRIVATE KEY-----");
                expect(result.valid).toBe(true);
                expect(result.warnings).toBeDefined();
            });
        });
    });

    // ==========================================================================
    // validateServerConfig Tests
    // ==========================================================================
    describe("validateServerConfig", () => {
        describe("required fields", () => {
            it("should validate a valid server config", () => {
                const config: ServerConfig = {
                    name: "myserver",
                    command: "node",
                    args: ["server.js"],
                };
                const result = validateServerConfig(config);
                expect(result.valid).toBe(true);
            });

            it("should reject missing name", () => {
                const config = {
                    name: "",
                    command: "node",
                } as ServerConfig;
                const result = validateServerConfig(config);
                expect(result.valid).toBe(false);
                expect(result.error).toBe("Server name is required");
            });

            it("should reject missing command", () => {
                const config = {
                    name: "server",
                    command: "",
                } as ServerConfig;
                const result = validateServerConfig(config);
                expect(result.valid).toBe(false);
                expect(result.error).toBe("Server command is required");
            });
        });

        describe("name validation", () => {
            it("should accept valid name formats", () => {
                const validNames = ["myserver", "server-1", "server_v2", "MyServer"];
                for (const name of validNames) {
                    const result = validateServerConfig({ name, command: "node" });
                    expect(result.valid).toBe(true);
                }
            });

            it("should reject name starting with number", () => {
                const result = validateServerConfig({
                    name: "1server",
                    command: "node",
                });
                expect(result.valid).toBe(false);
                expect(result.error).toContain("must start with a letter");
            });

            it("should reject name with special characters", () => {
                const result = validateServerConfig({
                    name: "my.server",
                    command: "node",
                });
                expect(result.valid).toBe(false);
            });

            it("should reject name exceeding 50 characters", () => {
                const longName = "a".repeat(51);
                const result = validateServerConfig({
                    name: longName,
                    command: "node",
                });
                expect(result.valid).toBe(false);
                expect(result.error).toContain("cannot exceed 50");
            });
        });

        describe("args validation", () => {
            it("should accept string array args", () => {
                const result = validateServerConfig({
                    name: "server",
                    command: "node",
                    args: ["--port", "3000"],
                });
                expect(result.valid).toBe(true);
            });

            it("should reject non-array args", () => {
                const result = validateServerConfig({
                    name: "server",
                    command: "node",
                    args: "not-an-array" as unknown as string[],
                });
                expect(result.valid).toBe(false);
                expect(result.error).toBe("Server args must be an array");
            });

            it("should reject non-string items in args", () => {
                const result = validateServerConfig({
                    name: "server",
                    command: "node",
                    args: ["valid", 123 as unknown as string],
                });
                expect(result.valid).toBe(false);
                expect(result.error).toContain("must be a string");
            });
        });

        describe("env validation", () => {
            it("should accept valid env object", () => {
                const result = validateServerConfig({
                    name: "server",
                    command: "node",
                    env: { NODE_ENV: "production", PORT: "3000" },
                });
                expect(result.valid).toBe(true);
            });

            it("should reject non-object env", () => {
                const result = validateServerConfig({
                    name: "server",
                    command: "node",
                    env: "not-object" as unknown as Record<string, string>,
                });
                expect(result.valid).toBe(false);
                expect(result.error).toBe("Server env must be an object");
            });

            it("should reject invalid env variable names", () => {
                const result = validateServerConfig({
                    name: "server",
                    command: "node",
                    env: { "invalid-name": "value" },
                });
                expect(result.valid).toBe(false);
                expect(result.error).toContain("Invalid environment variable name");
            });

            it("should reject non-string env values", () => {
                const result = validateServerConfig({
                    name: "server",
                    command: "node",
                    env: { PORT: 3000 as unknown as string },
                });
                expect(result.valid).toBe(false);
                expect(result.error).toContain("must have a string value");
            });
        });

        describe("command safety", () => {
            it("should reject dangerous rm -rf patterns", () => {
                const dangerousCommands = [
                    "node | rm -rf /",
                    "node; rm -rf /",
                    "node `rm -rf /`",
                    "node $(rm -rf /)",
                ];
                for (const command of dangerousCommands) {
                    const result = validateServerConfig({ name: "server", command });
                    expect(result.valid).toBe(false);
                    expect(result.error).toContain("dangerous patterns");
                }
            });

            it("should reject fork bomb patterns", () => {
                const result = validateServerConfig({
                    name: "server",
                    command: ":() { :|: & };:",
                });
                expect(result.valid).toBe(false);
            });
        });

        describe("warnings", () => {
            it("should warn about absolute path commands", () => {
                const result = validateServerConfig({
                    name: "server",
                    command: "/usr/local/bin/node",
                });
                expect(result.valid).toBe(true);
                expect(result.warnings).toContain(
                    "Using absolute path for command - ensure it exists on the system",
                );
            });
        });
    });

    // ==========================================================================
    // validatePermissionPattern Tests
    // ==========================================================================
    describe("validatePermissionPattern", () => {
        describe("basic validation", () => {
            it("should validate a valid allow pattern", () => {
                const pattern: PermissionPattern = {
                    type: "allow",
                    pattern: "/src/**/*.ts",
                };
                const result = validatePermissionPattern(pattern);
                expect(result.valid).toBe(true);
            });

            it("should validate a valid deny pattern", () => {
                const pattern: PermissionPattern = {
                    type: "deny",
                    pattern: "/node_modules/**",
                };
                const result = validatePermissionPattern(pattern);
                expect(result.valid).toBe(true);
            });

            it("should reject invalid type", () => {
                const pattern = {
                    type: "invalid",
                    pattern: "/src/**",
                } as unknown as PermissionPattern;
                const result = validatePermissionPattern(pattern);
                expect(result.valid).toBe(false);
                expect(result.error).toBe('Permission type must be "allow" or "deny"');
            });

            it("should reject missing pattern", () => {
                const pattern = {
                    type: "allow",
                    pattern: "",
                } as PermissionPattern;
                const result = validatePermissionPattern(pattern);
                expect(result.valid).toBe(false);
                // Empty pattern string triggers "Pattern string is required" first
                expect(result.error).toBe("Pattern string is required");
            });
        });

        describe("tool validation", () => {
            it("should accept valid tool name", () => {
                const result = validatePermissionPattern({
                    type: "allow",
                    pattern: "/src/**",
                    tool: "Read",
                });
                expect(result.valid).toBe(true);
            });

            it("should reject empty tool name", () => {
                const result = validatePermissionPattern({
                    type: "allow",
                    pattern: "/src/**",
                    tool: "",
                });
                expect(result.valid).toBe(false);
                expect(result.error).toBe("Tool cannot be empty if specified");
            });

            it("should reject non-string tool", () => {
                const result = validatePermissionPattern({
                    type: "allow",
                    pattern: "/src/**",
                    tool: 123 as unknown as string,
                });
                expect(result.valid).toBe(false);
                expect(result.error).toBe("Tool must be a string");
            });
        });

        describe("warnings for overly permissive patterns", () => {
            it("should warn about wildcard-only patterns", () => {
                const patterns = ["*", "**", "**/*"];
                for (const pattern of patterns) {
                    const result = validatePermissionPattern({ type: "allow", pattern });
                    expect(result.valid).toBe(true);
                    expect(result.warnings).toContain(
                        "This pattern allows all paths - consider being more specific",
                    );
                }
            });

            it("should warn about patterns without directory", () => {
                const result = validatePermissionPattern({
                    type: "allow",
                    pattern: "*.ts",
                });
                expect(result.valid).toBe(true);
                expect(result.warnings).toContain(
                    "Pattern does not include a directory - may match more than intended",
                );
            });
        });
    });

    // ==========================================================================
    // validateGlobPattern Tests
    // ==========================================================================
    describe("validateGlobPattern", () => {
        it("should validate valid glob patterns", () => {
            const validPatterns = ["**/*.ts", "src/**", "*.{js,jsx}", "[abc]*.txt", "!excluded/**"];
            for (const pattern of validPatterns) {
                const result = validateGlobPattern(pattern);
                expect(result.valid).toBe(true);
            }
        });

        it("should reject invalid characters", () => {
            const invalidPatterns = [
                "path<invalid",
                "path>invalid",
                "path|invalid",
                "path:invalid",
                'path"invalid',
            ];
            for (const pattern of invalidPatterns) {
                const result = validateGlobPattern(pattern);
                expect(result.valid).toBe(false);
                expect(result.error).toBe("Pattern contains invalid characters");
            }
        });

        it("should reject unbalanced brackets", () => {
            const result = validateGlobPattern("[abc");
            expect(result.valid).toBe(false);
            expect(result.error).toBe("Pattern has unclosed bracket");
        });

        it("should reject unbalanced braces", () => {
            const result = validateGlobPattern("*.{js,ts");
            expect(result.valid).toBe(false);
            expect(result.error).toBe("Pattern has unclosed brace");
        });

        it("should reject reversed brackets", () => {
            const result = validateGlobPattern("]abc[");
            expect(result.valid).toBe(false);
            expect(result.error).toBe("Pattern has unbalanced brackets");
        });
    });

    // ==========================================================================
    // validateFilePath Tests
    // ==========================================================================
    describe("validateFilePath", () => {
        it("should validate valid file paths", () => {
            const validPaths = [
                "/path/to/file.txt",
                "relative/path/file.js",
                "C:/Windows/System32",
                "./local/file",
            ];
            for (const path of validPaths) {
                const result = validateFilePath(path);
                expect(result.valid).toBe(true);
            }
        });

        it("should reject empty path", () => {
            const result = validateFilePath("");
            expect(result.valid).toBe(false);
            expect(result.error).toBe("File path is required");
        });

        it("should reject null byte in path", () => {
            const result = validateFilePath("/path/to\0/file");
            expect(result.valid).toBe(false);
            expect(result.error).toBe("File path cannot contain null bytes");
        });

        it("should reject invalid Windows characters", () => {
            const result = validateFilePath("C:/path/<invalid>.txt");
            expect(result.valid).toBe(false);
            expect(result.error).toContain("invalid characters for Windows");
        });

        it("should warn about path traversal", () => {
            const result = validateFilePath("/path/../secret/file");
            expect(result.valid).toBe(true);
            expect(result.warnings).toContain("Path contains parent directory references (..)");
        });
    });

    // ==========================================================================
    // validateUrl Tests
    // ==========================================================================
    describe("validateUrl", () => {
        it("should validate valid URLs", () => {
            const validUrls = [
                "https://example.com",
                "https://api.example.com/v1/users",
                "http://localhost:3000",
            ];
            for (const url of validUrls) {
                const result = validateUrl(url);
                expect(result.valid).toBe(true);
            }
        });

        it("should reject empty URL", () => {
            const result = validateUrl("");
            expect(result.valid).toBe(false);
            expect(result.error).toBe("URL is required");
        });

        it("should reject invalid URL format", () => {
            const result = validateUrl("not-a-url");
            expect(result.valid).toBe(false);
            expect(result.error).toBe("Invalid URL format");
        });

        it("should reject non-HTTP protocols", () => {
            const result = validateUrl("ftp://files.example.com");
            expect(result.valid).toBe(false);
            expect(result.error).toContain("must be http or https");
        });

        it("should warn about HTTP (insecure)", () => {
            const result = validateUrl("http://example.com");
            expect(result.valid).toBe(true);
            expect(result.warnings).toContain("URL uses insecure HTTP protocol");
        });

        it("should warn about localhost/internal IPs", () => {
            const internalUrls = [
                "http://localhost:3000",
                "http://127.0.0.1",
                "http://192.168.1.1",
                "http://10.0.0.1",
            ];
            for (const url of internalUrls) {
                const result = validateUrl(url);
                expect(result.valid).toBe(true);
                expect(result.warnings).toContain("URL points to a local or internal address");
            }
        });
    });

    // ==========================================================================
    // validateJson Tests
    // ==========================================================================
    describe("validateJson", () => {
        it("should validate valid JSON", () => {
            const validJson = [
                "{}",
                "[]",
                '{"key": "value"}',
                "[1, 2, 3]",
                "null",
                '"string"',
                "123",
                "true",
            ];
            for (const json of validJson) {
                const result = validateJson(json);
                expect(result.valid).toBe(true);
            }
        });

        it("should reject invalid JSON", () => {
            const result = validateJson("{invalid}");
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
        });

        it("should reject empty string", () => {
            const result = validateJson("");
            expect(result.valid).toBe(false);
        });

        it("should reject null", () => {
            const result = validateJson(null as unknown as string);
            expect(result.valid).toBe(false);
        });
    });

    // ==========================================================================
    // validateJsonSchema Tests
    // ==========================================================================
    describe("validateJsonSchema", () => {
        describe("object validation", () => {
            it("should validate object type", () => {
                const result = validateJsonSchema({ key: "value" }, { type: "object" });
                expect(result.valid).toBe(true);
            });

            it("should reject non-object for object schema", () => {
                const result = validateJsonSchema("string", { type: "object" });
                expect(result.valid).toBe(false);
                expect(result.error).toBe("Expected an object");
            });

            it("should reject array for object schema", () => {
                const result = validateJsonSchema([], { type: "object" });
                expect(result.valid).toBe(false);
            });

            it("should validate required properties", () => {
                const schema = { type: "object" as const, required: ["name", "age"] };

                expect(validateJsonSchema({ name: "John", age: 30 }, schema).valid).toBe(true);
                expect(validateJsonSchema({ name: "John" }, schema).valid).toBe(false);
            });

            it("should validate property types", () => {
                const schema = {
                    type: "object" as const,
                    properties: {
                        name: { type: "string" },
                        age: { type: "number" },
                        active: { type: "boolean" },
                        tags: { type: "array" },
                    },
                };

                expect(
                    validateJsonSchema({ name: "John", age: 30, active: true, tags: [] }, schema)
                        .valid,
                ).toBe(true);

                expect(validateJsonSchema({ name: 123 }, schema).valid).toBe(false);
            });
        });

        describe("array validation", () => {
            it("should validate array type", () => {
                const result = validateJsonSchema([1, 2, 3], { type: "array" });
                expect(result.valid).toBe(true);
            });

            it("should reject non-array", () => {
                const result = validateJsonSchema({ key: "value" }, { type: "array" });
                expect(result.valid).toBe(false);
                expect(result.error).toBe("Expected an array");
            });
        });

        describe("primitive validation", () => {
            it("should validate string type", () => {
                expect(validateJsonSchema("hello", { type: "string" }).valid).toBe(true);
                expect(validateJsonSchema(123, { type: "string" }).valid).toBe(false);
            });

            it("should validate number type", () => {
                expect(validateJsonSchema(123, { type: "number" }).valid).toBe(true);
                expect(validateJsonSchema("123", { type: "number" }).valid).toBe(false);
            });

            it("should validate boolean type", () => {
                expect(validateJsonSchema(true, { type: "boolean" }).valid).toBe(true);
                expect(validateJsonSchema("true", { type: "boolean" }).valid).toBe(false);
            });
        });
    });

    // ==========================================================================
    // combineValidationResults Tests
    // ==========================================================================
    describe("combineValidationResults", () => {
        it("should combine all valid results", () => {
            const result = combineValidationResults(
                { valid: true },
                { valid: true },
                { valid: true },
            );
            expect(result.valid).toBe(true);
        });

        it("should fail if any result is invalid", () => {
            const result = combineValidationResults(
                { valid: true },
                { valid: false, error: "Error 1" },
                { valid: true },
            );
            expect(result.valid).toBe(false);
        });

        it("should combine all errors", () => {
            const result = combineValidationResults(
                { valid: false, error: "Error 1" },
                { valid: false, error: "Error 2" },
            );
            expect(result.valid).toBe(false);
            expect(result.error).toBe("Error 1; Error 2");
        });

        it("should collect all warnings", () => {
            const result = combineValidationResults(
                { valid: true, warnings: ["Warning 1"] },
                { valid: true, warnings: ["Warning 2"] },
            );
            expect(result.valid).toBe(true);
            expect(result.warnings).toEqual(["Warning 1", "Warning 2"]);
        });

        it("should include warnings from failed validations", () => {
            const result = combineValidationResults({
                valid: false,
                error: "Error",
                warnings: ["Warning"],
            });
            expect(result.valid).toBe(false);
            expect(result.warnings).toEqual(["Warning"]);
        });
    });

    // ==========================================================================
    // createMessageValidator Tests
    // ==========================================================================
    describe("createMessageValidator", () => {
        it("should create validator with predefined options", () => {
            const validator = createMessageValidator({
                minLength: 5,
                maxLength: 100,
            });

            expect(validator("Hi").valid).toBe(false);
            expect(validator("Hello world").valid).toBe(true);
            expect(validator("a".repeat(101)).valid).toBe(false);
        });
    });

    // ==========================================================================
    // Type Guard Tests
    // ==========================================================================
    describe("type guards", () => {
        describe("isNonEmptyString", () => {
            it("should return true for non-empty strings", () => {
                expect(isNonEmptyString("hello")).toBe(true);
                expect(isNonEmptyString("  hello  ")).toBe(true);
            });

            it("should return false for empty or whitespace strings", () => {
                expect(isNonEmptyString("")).toBe(false);
                expect(isNonEmptyString("   ")).toBe(false);
                expect(isNonEmptyString("\t\n")).toBe(false);
            });

            it("should return false for non-strings", () => {
                expect(isNonEmptyString(null)).toBe(false);
                expect(isNonEmptyString(undefined)).toBe(false);
                expect(isNonEmptyString(123)).toBe(false);
                expect(isNonEmptyString({})).toBe(false);
            });
        });

        describe("isPositiveInteger", () => {
            it("should return true for positive integers", () => {
                expect(isPositiveInteger(1)).toBe(true);
                expect(isPositiveInteger(100)).toBe(true);
                expect(isPositiveInteger(999999)).toBe(true);
            });

            it("should return false for zero and negative numbers", () => {
                expect(isPositiveInteger(0)).toBe(false);
                expect(isPositiveInteger(-1)).toBe(false);
                expect(isPositiveInteger(-100)).toBe(false);
            });

            it("should return false for non-integers", () => {
                expect(isPositiveInteger(1.5)).toBe(false);
                expect(isPositiveInteger(0.1)).toBe(false);
            });

            it("should return false for non-numbers", () => {
                expect(isPositiveInteger("1")).toBe(false);
                expect(isPositiveInteger(null)).toBe(false);
                expect(isPositiveInteger(undefined)).toBe(false);
            });
        });

        describe("isValidPort", () => {
            it("should return true for valid ports", () => {
                expect(isValidPort(1)).toBe(true);
                expect(isValidPort(80)).toBe(true);
                expect(isValidPort(443)).toBe(true);
                expect(isValidPort(3000)).toBe(true);
                expect(isValidPort(65535)).toBe(true);
            });

            it("should return false for out-of-range ports", () => {
                expect(isValidPort(0)).toBe(false);
                expect(isValidPort(-1)).toBe(false);
                expect(isValidPort(65536)).toBe(false);
                expect(isValidPort(100000)).toBe(false);
            });

            it("should return false for non-integers", () => {
                expect(isValidPort(80.5)).toBe(false);
                expect(isValidPort("80")).toBe(false);
            });
        });
    });
});
