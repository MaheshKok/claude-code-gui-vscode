import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
    logger,
    LogLevel,
    configureLogger,
    resetLoggerConfig,
    createModuleLogger,
    LOG_PREFIXES,
} from "../../shared/utils/logger";

describe("logger", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        resetLoggerConfig();
        vi.spyOn(console, "debug").mockImplementation(() => {});
        vi.spyOn(console, "info").mockImplementation(() => {});
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("logger.debug", () => {
        it("should log debug message", () => {
            logger.debug("Debug message");
            expect(console.debug).toHaveBeenCalledWith("Debug message");
        });

        it("should log debug message with data", () => {
            const data = { userId: 123 };
            logger.debug("Debug message", { data });
            expect(console.debug).toHaveBeenCalledWith("Debug message", data);
        });

        it("should log debug message with module", () => {
            logger.debug("Debug message", { module: "TestModule" });
            expect(console.debug).toHaveBeenCalledWith("[TestModule] Debug message");
        });
    });

    describe("logger.info", () => {
        it("should log info message", () => {
            logger.info("Info message");
            expect(console.info).toHaveBeenCalledWith("Info message");
        });

        it("should log info message with data", () => {
            const data = { action: "login" };
            logger.info("Info message", { data });
            expect(console.info).toHaveBeenCalledWith("Info message", data);
        });

        it("should log info message with module", () => {
            logger.info("Info message", { module: "API" });
            expect(console.info).toHaveBeenCalledWith("[API] Info message");
        });
    });

    describe("logger.warn", () => {
        it("should log warning message", () => {
            logger.warn("Warning message");
            expect(console.warn).toHaveBeenCalledWith("Warning message");
        });

        it("should log warning message with data", () => {
            const data = { retryCount: 3 };
            logger.warn("Warning message", { data });
            expect(console.warn).toHaveBeenCalledWith("Warning message", data);
        });

        it("should log warning message with error", () => {
            const error = new Error("Test error");
            logger.warn("Warning message", { error });
            expect(console.warn).toHaveBeenCalledWith("Warning message", error);
        });

        it("should log warning message with module", () => {
            logger.warn("Warning message", { module: "Auth" });
            expect(console.warn).toHaveBeenCalledWith("[Auth] Warning message");
        });
    });

    describe("logger.error", () => {
        it("should log error message", () => {
            logger.error("Error message");
            expect(console.error).toHaveBeenCalledWith("Error message");
        });

        it("should log error message with Error object", () => {
            const error = new Error("Test error");
            logger.error("Error message", error);
            expect(console.error).toHaveBeenCalledWith("Error message", error);
        });

        it("should log error message with options object", () => {
            const data = { errorCode: 500 };
            logger.error("Error message", { data });
            expect(console.error).toHaveBeenCalledWith("Error message", data);
        });

        it("should log error message with error in options", () => {
            const error = new Error("Test error");
            logger.error("Error message", { error, module: "Service" });
            expect(console.error).toHaveBeenCalledWith("[Service] Error message", error);
        });
    });

    describe("configureLogger", () => {
        it("should configure minimum log level", () => {
            configureLogger({ minLevel: LogLevel.ERROR });

            logger.debug("Debug");
            logger.info("Info");
            logger.warn("Warning");
            logger.error("Error");

            expect(console.debug).not.toHaveBeenCalled();
            expect(console.info).not.toHaveBeenCalled();
            expect(console.warn).not.toHaveBeenCalled();
            expect(console.error).toHaveBeenCalledWith("Error");
        });

        it("should disable module prefix when configured", () => {
            configureLogger({ includeModule: false });
            logger.info("Test", { module: "TestModule" });
            expect(console.info).toHaveBeenCalledWith("Test");
        });

        it("should call custom handler when configured", () => {
            const customHandler = vi.fn();
            configureLogger({ customHandler });

            logger.info("Test message");

            expect(customHandler).toHaveBeenCalledWith(
                expect.objectContaining({
                    level: LogLevel.INFO,
                    message: "Test message",
                    timestamp: expect.any(Date),
                }),
            );
        });

        it("should support NONE level to disable all logging", () => {
            configureLogger({ minLevel: LogLevel.NONE });

            logger.debug("Debug");
            logger.info("Info");
            logger.warn("Warning");
            logger.error("Error");

            expect(console.debug).not.toHaveBeenCalled();
            expect(console.info).not.toHaveBeenCalled();
            expect(console.warn).not.toHaveBeenCalled();
            expect(console.error).not.toHaveBeenCalled();
        });
    });

    describe("resetLoggerConfig", () => {
        it("should reset to default config", () => {
            configureLogger({ minLevel: LogLevel.ERROR });
            resetLoggerConfig();

            logger.debug("Debug");
            expect(console.debug).toHaveBeenCalledWith("Debug");
        });
    });

    describe("createModuleLogger", () => {
        it("should create logger with fixed module", () => {
            const log = createModuleLogger("TestComponent");

            log.debug("Debug message");
            expect(console.debug).toHaveBeenCalledWith("[TestComponent] Debug message");

            log.info("Info message");
            expect(console.info).toHaveBeenCalledWith("[TestComponent] Info message");

            log.warn("Warning message");
            expect(console.warn).toHaveBeenCalledWith("[TestComponent] Warning message");

            log.error("Error message");
            expect(console.error).toHaveBeenCalledWith("[TestComponent] Error message");
        });

        it("should support data in debug", () => {
            const log = createModuleLogger("Test");
            const data = { key: "value" };

            log.debug("Debug", data);
            expect(console.debug).toHaveBeenCalledWith("[Test] Debug", data);
        });

        it("should support data in info", () => {
            const log = createModuleLogger("Test");
            const data = { key: "value" };

            log.info("Info", data);
            expect(console.info).toHaveBeenCalledWith("[Test] Info", data);
        });

        it("should support error in warn", () => {
            const log = createModuleLogger("Test");
            const error = new Error("Test error");

            log.warn("Warning", error);
            expect(console.warn).toHaveBeenCalledWith("[Test] Warning", error);
        });

        it("should support data object in warn", () => {
            const log = createModuleLogger("Test");
            const data = { retries: 3 };

            log.warn("Warning", data);
            expect(console.warn).toHaveBeenCalledWith("[Test] Warning", data);
        });

        it("should support error in error", () => {
            const log = createModuleLogger("Test");
            const error = new Error("Test error");

            log.error("Error", error);
            expect(console.error).toHaveBeenCalledWith("[Test] Error", error);
        });

        it("should support data object in error", () => {
            const log = createModuleLogger("Test");
            const data = { errorCode: 500 };

            log.error("Error", data);
            expect(console.error).toHaveBeenCalledWith("[Test] Error", data);
        });
    });

    describe("LOG_PREFIXES", () => {
        it("should have all expected prefixes", () => {
            expect(LOG_PREFIXES.EXTENSION).toBe("[Extension]");
            expect(LOG_PREFIXES.WEBVIEW).toBe("[Webview]");
            expect(LOG_PREFIXES.CLAUDE_SERVICE).toBe("[ClaudeService]");
            expect(LOG_PREFIXES.MCP_SERVICE).toBe("[MCPService]");
            expect(LOG_PREFIXES.PERMISSION_SERVICE).toBe("[PermissionService]");
            expect(LOG_PREFIXES.CONVERSATION_SERVICE).toBe("[ConversationService]");
            expect(LOG_PREFIXES.PANEL_PROVIDER).toBe("[PanelProvider]");
            expect(LOG_PREFIXES.MESSAGE_HANDLER).toBe("[MessageHandler]");
            expect(LOG_PREFIXES.STORE).toBe("[Store]");
            expect(LOG_PREFIXES.HOOK).toBe("[Hook]");
            expect(LOG_PREFIXES.COMPONENT).toBe("[Component]");
            expect(LOG_PREFIXES.API).toBe("[API]");
            expect(LOG_PREFIXES.ERROR_BOUNDARY).toBe("[ErrorBoundary]");
        });
    });

    describe("LogLevel enum", () => {
        it("should have correct numeric values", () => {
            expect(LogLevel.DEBUG).toBe(0);
            expect(LogLevel.INFO).toBe(1);
            expect(LogLevel.WARN).toBe(2);
            expect(LogLevel.ERROR).toBe(3);
            expect(LogLevel.NONE).toBe(4);
        });
    });
});
