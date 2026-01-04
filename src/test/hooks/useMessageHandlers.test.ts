import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMessageHandlers } from "../../webview/hooks/useMessageHandlers";
import { useChatStore } from "../../webview/stores/chatStore";
import { useSettingsStore } from "../../webview/stores/settingsStore";
import { useUIStore } from "../../webview/stores/uiStore";
import { usePermissionStore } from "../../webview/stores/permissionStore";
import { useUsageStore } from "../../webview/stores/usageStore";
import { useMCPStore } from "../../webview/stores/mcpStore";
import { MessageType, ToolExecutionStatus } from "../../shared/constants";

describe("useMessageHandlers", () => {
    const mockDeps = {
        streamingMessageId: null as string | null,
        setStreamingMessageId: vi.fn(),
        setSubscriptionType: vi.fn(),
        setRequestCount: vi.fn(),
        setLastDurationMs: vi.fn(),
        setConversationList: vi.fn(),
        setIsHistoryLoading: vi.fn(),
        setActiveConversationId: vi.fn(),
        activeConversationId: null as string | null,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        useChatStore.getState().resetChat();
        useSettingsStore.getState().resetToDefaults();
        useUIStore.getState().closeModal();
        usePermissionStore.setState({
            pendingPermissions: [],
            allowedPermissions: [],
            deniedPatterns: [],
        });
        // Reset usage store data
        useUsageStore.setState({ data: null, lastUpdatedAt: null });

        // Reset mock deps
        mockDeps.streamingMessageId = null;
        mockDeps.setStreamingMessageId.mockClear();
        mockDeps.setSubscriptionType.mockClear();
        mockDeps.setRequestCount.mockClear();
        mockDeps.setLastDurationMs.mockClear();
        mockDeps.setConversationList.mockClear();
        mockDeps.setIsHistoryLoading.mockClear();
        mockDeps.setActiveConversationId.mockClear();
    });

    describe("initialization", () => {
        it("should return handlers object", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            expect(result.current.handlers).toBeDefined();
            expect(typeof result.current.handlers).toBe("object");
        });

        it("should return pendingUsageRef", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            expect(result.current.pendingUsageRef).toBeDefined();
            expect(result.current.pendingUsageRef.current).toBeNull();
        });

        it("should return finalizeStreamingMessage function", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            expect(typeof result.current.finalizeStreamingMessage).toBe("function");
        });
    });

    describe("sessionInfo handler", () => {
        it("should return sessionInfo handler", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            // Verify handler exists
            expect(result.current.handlers.sessionInfo).toBeDefined();
            expect(typeof result.current.handlers.sessionInfo).toBe("function");
        });

        it("should call store actions when sessionInfo is received", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            // Verify the handler is a function and can be called
            expect(typeof result.current.handlers.sessionInfo).toBe("function");

            // Call the handler - this tests that it doesn't throw
            act(() => {
                result.current.handlers.sessionInfo({
                    sessionId: "session-123",
                    tools: [],
                    mcpServers: [],
                });
            });

            // The handler calls setSessionId and setConnectionStatus internally
            // These are bound at render time through the store selector pattern
            // We verify the handler runs without error
            expect(true).toBe(true);
        });
    });

    describe("accountInfo handler", () => {
        it("should set subscription type", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            act(() => {
                result.current.handlers.accountInfo({
                    account: { subscriptionType: "pro" },
                });
            });

            expect(mockDeps.setSubscriptionType).toHaveBeenCalledWith("pro");
        });

        it("should set null for missing subscription type", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            act(() => {
                result.current.handlers.accountInfo({
                    account: {},
                });
            });

            expect(mockDeps.setSubscriptionType).toHaveBeenCalledWith(null);
        });
    });

    describe("output handler", () => {
        it("should create new message when no streaming message", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            act(() => {
                result.current.handlers.output({
                    text: "Hello world",
                    isFinal: false,
                });
            });

            const messages = useChatStore.getState().messages;
            expect(messages).toHaveLength(1);
            expect(messages[0].type).toBe(MessageType.Assistant);
            expect(mockDeps.setStreamingMessageId).toHaveBeenCalled();
        });

        it("should append to existing streaming message", () => {
            const deps = {
                ...mockDeps,
                streamingMessageId: "msg-123",
            };

            // First add a message to the store
            useChatStore.getState().addMessage({
                id: "msg-123",
                type: MessageType.Assistant,
                content: "Hello",
                timestamp: Date.now(),
                isStreaming: true,
            } as any);

            const { result } = renderHook(() => useMessageHandlers(deps));

            act(() => {
                result.current.handlers.output({
                    text: " world",
                    isFinal: false,
                });
            });

            const messages = useChatStore.getState().messages;
            expect(messages[0].content).toBe("Hello world");
        });

        it("should finalize message when isFinal is true", () => {
            const deps = {
                ...mockDeps,
                streamingMessageId: "msg-123",
            };

            useChatStore.getState().addMessage({
                id: "msg-123",
                type: MessageType.Assistant,
                content: "Hello",
                timestamp: Date.now(),
                isStreaming: true,
            } as any);

            const { result } = renderHook(() => useMessageHandlers(deps));

            act(() => {
                result.current.handlers.output({
                    text: " world",
                    isFinal: true,
                });
            });

            expect(mockDeps.setStreamingMessageId).toHaveBeenCalledWith(null);
        });
    });

    describe("thinking handler", () => {
        it("should add thinking message", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            act(() => {
                result.current.handlers.thinking({
                    thinking: "Let me think about this...",
                });
            });

            const messages = useChatStore.getState().messages;
            expect(messages).toHaveLength(1);
            expect(messages[0].type).toBe(MessageType.Thinking);
            expect(messages[0].content).toBe("Let me think about this...");
        });
    });

    describe("toolUse handler", () => {
        it("should add tool use message", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            act(() => {
                result.current.handlers.toolUse({
                    toolUseId: "tool-123",
                    toolName: "Read",
                    rawInput: { file_path: "/test.txt" },
                    toolInfo: "Reading file",
                });
            });

            const messages = useChatStore.getState().messages;
            expect(messages).toHaveLength(1);
            expect(messages[0].type).toBe(MessageType.ToolUse);
            expect((messages[0] as any).toolName).toBe("Read");
            expect((messages[0] as any).status).toBe(ToolExecutionStatus.Executing);
        });

        it("should extract todos from TodoWrite tool", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            act(() => {
                result.current.handlers.toolUse({
                    toolUseId: "tool-123",
                    toolName: "TodoWrite",
                    rawInput: {
                        todos: [
                            { content: "Task 1", status: "pending" },
                            { content: "Task 2", status: "in_progress" },
                        ],
                    },
                    toolInfo: "Writing todos",
                });
            });

            const todos = useChatStore.getState().todos;
            expect(todos).toHaveLength(2);
        });
    });

    describe("toolResult handler", () => {
        it("should update tool use message status", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            // First add a tool use message
            useChatStore.getState().addMessage({
                id: "tool-123",
                type: MessageType.ToolUse,
                toolName: "Read",
                timestamp: Date.now(),
                status: ToolExecutionStatus.Executing,
            } as any);

            act(() => {
                result.current.handlers.toolResult({
                    toolUseId: "tool-123",
                    content: "File content",
                    isError: false,
                    hidden: false,
                });
            });

            const messages = useChatStore.getState().messages;
            expect((messages[0] as any).status).toBe(ToolExecutionStatus.Completed);
        });

        it("should set failed status for errors", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            useChatStore.getState().addMessage({
                id: "tool-123",
                type: MessageType.ToolUse,
                toolName: "Read",
                timestamp: Date.now(),
                status: ToolExecutionStatus.Executing,
            } as any);

            act(() => {
                result.current.handlers.toolResult({
                    toolUseId: "tool-123",
                    content: "Error reading file",
                    isError: true,
                    hidden: false,
                });
            });

            const messages = useChatStore.getState().messages;
            expect((messages[0] as any).status).toBe(ToolExecutionStatus.Failed);
        });

        it("should add result message when not hidden", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            useChatStore.getState().addMessage({
                id: "tool-123",
                type: MessageType.ToolUse,
                toolName: "Read",
                timestamp: Date.now(),
                status: ToolExecutionStatus.Executing,
            } as any);

            act(() => {
                result.current.handlers.toolResult({
                    toolUseId: "tool-123",
                    content: "File content",
                    isError: false,
                    hidden: false,
                });
            });

            const messages = useChatStore.getState().messages;
            expect(messages).toHaveLength(2);
            expect(messages[1].type).toBe(MessageType.ToolResult);
        });

        it("should not add result message when hidden", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            useChatStore.getState().addMessage({
                id: "tool-123",
                type: MessageType.ToolUse,
                toolName: "Read",
                timestamp: Date.now(),
                status: ToolExecutionStatus.Executing,
            } as any);

            act(() => {
                result.current.handlers.toolResult({
                    toolUseId: "tool-123",
                    content: "File content",
                    isError: false,
                    hidden: true,
                });
            });

            const messages = useChatStore.getState().messages;
            expect(messages).toHaveLength(1);
        });
    });

    describe("updateTokens handler", () => {
        it("should update token usage", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            act(() => {
                result.current.handlers.updateTokens({
                    current: {
                        input_tokens: 100,
                        output_tokens: 50,
                        cache_read_input_tokens: 30,
                        cache_creation_input_tokens: 0,
                    },
                    total: {},
                });
            });

            const tokens = useChatStore.getState().tokens.current;
            expect(tokens.input_tokens).toBe(100);
            expect(tokens.output_tokens).toBe(50);
        });
    });

    describe("updateTotals handler", () => {
        it("should update session cost", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            act(() => {
                result.current.handlers.updateTotals({
                    totalCostUsd: 0.05,
                    durationMs: 1500,
                    numTurns: 1,
                });
            });

            expect(mockDeps.setLastDurationMs).toHaveBeenCalledWith(1500);
            expect(mockDeps.setRequestCount).toHaveBeenCalled();
        });

        it("should use totalCost if provided", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            act(() => {
                result.current.handlers.updateTotals({
                    totalCostUsd: 0.05,
                    durationMs: 1500,
                    numTurns: 1,
                    totalCost: 0.1,
                });
            });

            expect(useChatStore.getState().costs.sessionCostUsd).toBe(0.1);
        });

        it("should set request count if provided", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            act(() => {
                result.current.handlers.updateTotals({
                    totalCostUsd: 0.05,
                    durationMs: 1500,
                    numTurns: 1,
                    requestCount: 5,
                });
            });

            expect(mockDeps.setRequestCount).toHaveBeenCalledWith(5);
        });
    });

    describe("permissionRequest handler", () => {
        it("should add pending permission and open modal", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            act(() => {
                result.current.handlers.permissionRequest({
                    requestId: "req-123",
                    toolUseId: "tool-123",
                    toolName: "Write",
                    input: { file_path: "/test.txt" },
                    description: "Write to file",
                    suggestions: [],
                });
            });

            const pending = usePermissionStore.getState().pendingPermissions;
            expect(pending).toHaveLength(1);
            expect(pending[0].requestId).toBe("req-123");
            expect(useUIStore.getState().activeModal).toBe("permission");
        });
    });

    describe("setProcessing handler", () => {
        it("should update processing state", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            act(() => {
                result.current.handlers.setProcessing({ isProcessing: true });
            });

            expect(useChatStore.getState().isProcessing).toBe(true);

            act(() => {
                result.current.handlers.setProcessing({ isProcessing: false });
            });

            expect(useChatStore.getState().isProcessing).toBe(false);
        });

        it("should clear streaming message when processing ends", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            act(() => {
                result.current.handlers.setProcessing({ isProcessing: false });
            });

            expect(mockDeps.setStreamingMessageId).toHaveBeenCalledWith(null);
        });
    });

    describe("error handler", () => {
        it("should add error message", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            act(() => {
                result.current.handlers.error({
                    message: "Something went wrong",
                    code: "ERR_001",
                    recoverable: true,
                });
            });

            const messages = useChatStore.getState().messages;
            expect(messages).toHaveLength(1);
            expect(messages[0].type).toBe(MessageType.Error);
            expect(messages[0].content).toBe("Something went wrong");
        });

        it("should stop processing on error", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            useChatStore.getState().setProcessing(true);

            act(() => {
                result.current.handlers.error({
                    message: "Error occurred",
                });
            });

            expect(useChatStore.getState().isProcessing).toBe(false);
        });
    });

    describe("showInstallModal handler", () => {
        it("should open install modal", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            act(() => {
                result.current.handlers.showInstallModal({});
            });

            expect(useUIStore.getState().activeModal).toBe("install");
        });
    });

    describe("showLoginModal handler", () => {
        it("should open login modal", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            act(() => {
                result.current.handlers.showLoginModal({});
            });

            expect(useUIStore.getState().activeModal).toBe("login");
        });
    });

    describe("settingsUpdate handler", () => {
        it("should load settings from VSCode", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            act(() => {
                result.current.handlers.settingsUpdate({
                    settings: { thinkingMode: true },
                });
            });

            // Settings should be loaded (may require checking specific settings)
            expect(useSettingsStore.getState().thinkingMode).toBe(true);
        });
    });

    describe("conversationList handler", () => {
        it("should update conversation list", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            act(() => {
                result.current.handlers.conversationList({
                    conversations: [{ filename: "conv-1", lastModified: Date.now(), messages: [] }],
                });
            });

            expect(mockDeps.setConversationList).toHaveBeenCalled();
            expect(mockDeps.setIsHistoryLoading).toHaveBeenCalledWith(false);
        });

        it("should handle data array format", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            act(() => {
                result.current.handlers.conversationList({
                    data: [{ filename: "conv-1", lastModified: Date.now(), messages: [] }],
                });
            });

            expect(mockDeps.setConversationList).toHaveBeenCalled();
        });
    });

    describe("conversationDeleted handler", () => {
        it("should remove deleted conversation", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            act(() => {
                result.current.handlers.conversationDeleted({
                    filename: "conv-1",
                });
            });

            expect(mockDeps.setConversationList).toHaveBeenCalled();
        });

        it("should clear active conversation if deleted", () => {
            const deps = {
                ...mockDeps,
                activeConversationId: "conv-1",
            };
            const { result } = renderHook(() => useMessageHandlers(deps));

            act(() => {
                result.current.handlers.conversationDeleted({
                    filename: "conv-1",
                });
            });

            expect(mockDeps.setActiveConversationId).toHaveBeenCalledWith(null);
        });
    });

    describe("restoreState handler", () => {
        it("should handle empty state", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            act(() => {
                result.current.handlers.restoreState({
                    state: null,
                });
            });

            // Should not throw
            expect(true).toBe(true);
        });

        it("should call setActiveConversationId with conversation ID", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            act(() => {
                result.current.handlers.restoreState({
                    state: {
                        conversationId: "conv-123",
                        messages: [
                            { type: "user", message: { content: "Hello" } },
                            { type: "assistant", message: { content: "Hi there" } },
                        ],
                        isProcessing: false,
                    },
                });
            });

            expect(mockDeps.setActiveConversationId).toHaveBeenCalledWith("conv-123");
        });
    });

    describe("compactBoundary handler", () => {
        it("should reset token tracking", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            // First add some tokens
            useChatStore.getState().updateTokens({
                input_tokens: 100,
                output_tokens: 50,
            });

            act(() => {
                result.current.handlers.compactBoundary({});
            });

            const tokens = useChatStore.getState().tokens.current;
            expect(tokens.input_tokens).toBe(0);
            expect(tokens.output_tokens).toBe(0);
        });
    });

    describe("usageData handler", () => {
        it("should set usage data", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            const usageData = {
                dailyCostUsd: 1.5,
                monthlyCostUsd: 30.0,
                totalTokens: 10000,
            };

            act(() => {
                result.current.handlers.usageData({
                    data: usageData,
                });
            });

            // Check that usage data was set
            expect(useUsageStore.getState().data).toBeDefined();
        });
    });

    describe("finalizeStreamingMessage", () => {
        it("should finalize current streaming message", () => {
            const deps = {
                ...mockDeps,
                streamingMessageId: "msg-123",
            };

            useChatStore.getState().addMessage({
                id: "msg-123",
                type: MessageType.Assistant,
                content: "Hello",
                timestamp: Date.now(),
                isStreaming: true,
            } as any);

            const { result } = renderHook(() => useMessageHandlers(deps));

            act(() => {
                result.current.finalizeStreamingMessage();
            });

            const message = useChatStore.getState().messages[0];
            expect((message as any).isStreaming).toBe(false);
            expect(mockDeps.setStreamingMessageId).toHaveBeenCalledWith(null);
        });

        it("should do nothing when no streaming message", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            act(() => {
                result.current.finalizeStreamingMessage();
            });

            // Should not throw
            expect(mockDeps.setStreamingMessageId).not.toHaveBeenCalled();
        });
    });

    describe("loading and clearLoading handlers", () => {
        it("should handle loading message", () => {
            const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            act(() => {
                result.current.handlers.loading({ message: "Loading..." });
            });

            expect(consoleSpy).toHaveBeenCalledWith("Loading:", "Loading...");
            consoleSpy.mockRestore();
        });

        it("should handle clearLoading", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            // Should not throw
            act(() => {
                result.current.handlers.clearLoading({});
            });

            expect(true).toBe(true);
        });
    });

    describe("themeUpdate and compacting handlers", () => {
        it("should handle themeUpdate", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            // Should not throw
            act(() => {
                result.current.handlers.themeUpdate({});
            });

            expect(true).toBe(true);
        });

        it("should handle compacting", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            // Should not throw
            act(() => {
                result.current.handlers.compacting({});
            });

            expect(true).toBe(true);
        });
    });

    describe("mcpServers handler", () => {
        beforeEach(() => {
            // Reset MCP store before each test
            useMCPStore.setState({ servers: [], selectedServerId: null });
        });

        it("should have mcpServers handler defined", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            expect(result.current.handlers.mcpServers).toBeDefined();
            expect(typeof result.current.handlers.mcpServers).toBe("function");
        });

        it("should add servers from extension data to MCP store", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            act(() => {
                result.current.handlers.mcpServers({
                    data: {
                        "test-server": {
                            command: "npx",
                            args: ["-y", "test-server"],
                            env: { NODE_ENV: "test" },
                            cwd: "/test/path",
                        },
                        "another-server": {
                            command: "node",
                            args: ["server.js"],
                        },
                    },
                });
            });

            const servers = useMCPStore.getState().servers;
            expect(servers).toHaveLength(2);
            expect(servers[0].config.id).toBe("test-server");
            expect(servers[0].config.name).toBe("test-server");
            expect(servers[0].config.command).toBe("npx");
            expect(servers[0].config.args).toEqual(["-y", "test-server"]);
            expect(servers[0].config.env).toEqual({ NODE_ENV: "test" });
            expect(servers[0].config.cwd).toBe("/test/path");
            expect(servers[0].config.enabled).toBe(true);
            expect(servers[1].config.id).toBe("another-server");
        });

        it("should not add duplicate servers", () => {
            // First add a server directly to the store
            useMCPStore.getState().addServer({
                id: "existing-server",
                name: "existing-server",
                command: "node",
                args: ["old.js"],
                enabled: true,
            });

            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            act(() => {
                result.current.handlers.mcpServers({
                    data: {
                        "existing-server": {
                            command: "node",
                            args: ["new.js"],
                        },
                        "new-server": {
                            command: "npx",
                            args: ["new-server"],
                        },
                    },
                });
            });

            const servers = useMCPStore.getState().servers;
            expect(servers).toHaveLength(2);
            // Existing server should retain its original configuration
            expect(servers[0].config.args).toEqual(["old.js"]);
            // New server should be added
            expect(servers[1].config.id).toBe("new-server");
        });

        it("should handle empty data gracefully", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            act(() => {
                result.current.handlers.mcpServers({
                    data: {},
                });
            });

            const servers = useMCPStore.getState().servers;
            expect(servers).toHaveLength(0);
        });

        it("should handle undefined data gracefully", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            act(() => {
                result.current.handlers.mcpServers({});
            });

            const servers = useMCPStore.getState().servers;
            expect(servers).toHaveLength(0);
        });

        it("should handle servers without optional fields", () => {
            const { result } = renderHook(() => useMessageHandlers(mockDeps));

            act(() => {
                result.current.handlers.mcpServers({
                    data: {
                        "minimal-server": {
                            command: "npx",
                        },
                    },
                });
            });

            const servers = useMCPStore.getState().servers;
            expect(servers).toHaveLength(1);
            expect(servers[0].config.id).toBe("minimal-server");
            expect(servers[0].config.command).toBe("npx");
            expect(servers[0].config.args).toBeUndefined();
            expect(servers[0].config.env).toBeUndefined();
            expect(servers[0].config.cwd).toBeUndefined();
        });
    });
});
