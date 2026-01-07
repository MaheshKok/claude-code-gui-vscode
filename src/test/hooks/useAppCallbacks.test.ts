import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAppCallbacks, type AppCallbackDeps } from "../../webview/hooks/useAppCallbacks";
import { MessageType, ThinkingIntensity } from "../../shared/constants";
import { useMCPStore } from "../../webview/stores/mcpStore";

describe("useAppCallbacks", () => {
    const mockPostMessage = vi.fn();
    const mockAddMessage = vi.fn();
    const mockSetProcessing = vi.fn();
    const mockStartRequestTiming = vi.fn();
    const mockStopRequestTiming = vi.fn();
    const mockResetChat = vi.fn();
    const mockClearTodos = vi.fn();
    const mockSetStreamingMessageId = vi.fn();
    const mockSetActiveConversationId = vi.fn();
    const mockSetRequestCount = vi.fn();
    const mockSetLastDurationMs = vi.fn();
    const mockSetIsHistoryOpen = vi.fn();
    const mockSetShowWSLAlert = vi.fn();
    const mockSetSelectedModel = vi.fn();
    const mockTogglePlanMode = vi.fn();
    const mockToggleThinkingMode = vi.fn();
    const mockSetThinkingIntensity = vi.fn();
    const mockToggleYoloMode = vi.fn();
    const mockOpenModal = vi.fn();
    const mockCloseModal = vi.fn();
    const mockShowSuccess = vi.fn();
    const mockResolvePending = vi.fn();

    const createMockDeps = (): AppCallbackDeps => ({
        state: {
            chatActions: {
                addMessage: mockAddMessage,
                setProcessing: mockSetProcessing,
                startRequestTiming: mockStartRequestTiming,
                stopRequestTiming: mockStopRequestTiming,
                resetChat: mockResetChat,
                clearTodos: mockClearTodos,
            },
            settings: {
                planMode: false,
                thinkingMode: true,
                yoloMode: false,
            },
            settingsActions: {
                setSelectedModel: mockSetSelectedModel,
                togglePlanMode: mockTogglePlanMode,
                toggleThinkingMode: mockToggleThinkingMode,
                setThinkingIntensity: mockSetThinkingIntensity,
                toggleYoloMode: mockToggleYoloMode,
            },
            uiActions: {
                openModal: mockOpenModal,
                closeModal: mockCloseModal,
                showSuccess: mockShowSuccess,
            },
            permission: {
                resolvePending: mockResolvePending,
            },
            local: {
                setStreamingMessageId: mockSetStreamingMessageId,
                setActiveConversationId: mockSetActiveConversationId,
                setRequestCount: mockSetRequestCount,
                setLastDurationMs: mockSetLastDurationMs,
                setIsHistoryOpen: mockSetIsHistoryOpen,
                setShowWSLAlert: mockSetShowWSLAlert,
            },
        } as unknown as AppCallbackDeps["state"],
        vscode: {
            postMessage: mockPostMessage,
        } as unknown as AppCallbackDeps["vscode"],
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("handleSendMessage", () => {
        it("should create user message and post message", () => {
            const deps = createMockDeps();
            const { result } = renderHook(() => useAppCallbacks(deps));

            act(() => {
                result.current.handleSendMessage("Hello world");
            });

            expect(mockAddMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: MessageType.User,
                    content: "Hello world",
                }),
            );
            expect(mockSetProcessing).toHaveBeenCalledWith(true);
            expect(mockStartRequestTiming).toHaveBeenCalled();
            expect(mockPostMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: "sendMessage",
                    message: "Hello world",
                }),
            );
        });

        it("should include attachments in message", () => {
            const deps = createMockDeps();
            const { result } = renderHook(() => useAppCallbacks(deps));
            const attachments = [{ type: "file", name: "test.txt", path: "/path" }];

            act(() => {
                result.current.handleSendMessage("Check this", attachments);
            });

            expect(mockAddMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    attachments,
                }),
            );
            expect(mockPostMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    attachments,
                }),
            );
        });
    });

    describe("handleStopProcessing", () => {
        it("should stop generation and reset processing state", () => {
            const deps = createMockDeps();
            const { result } = renderHook(() => useAppCallbacks(deps));

            act(() => {
                result.current.handleStopProcessing();
            });

            expect(mockPostMessage).toHaveBeenCalledWith({ type: "stopGeneration" });
            expect(mockSetProcessing).toHaveBeenCalledWith(false);
            expect(mockSetStreamingMessageId).toHaveBeenCalledWith(null);
            expect(mockStopRequestTiming).toHaveBeenCalled();
        });
    });

    describe("handleNewChat", () => {
        it("should reset chat and clear conversation state", () => {
            const deps = createMockDeps();
            const { result } = renderHook(() => useAppCallbacks(deps));

            act(() => {
                result.current.handleNewChat();
            });

            expect(mockResetChat).toHaveBeenCalled();
            expect(mockSetActiveConversationId).toHaveBeenCalledWith(null);
            expect(mockSetRequestCount).toHaveBeenCalledWith(0);
            expect(mockSetLastDurationMs).toHaveBeenCalledWith(null);
            expect(mockClearTodos).toHaveBeenCalled();
            expect(mockPostMessage).toHaveBeenCalledWith({ type: "clearConversation" });
            expect(mockShowSuccess).toHaveBeenCalledWith("New Chat", expect.any(String));
        });
    });

    describe("handleToggleHistory", () => {
        it("should toggle history open state", () => {
            const deps = createMockDeps();
            const { result } = renderHook(() => useAppCallbacks(deps));

            act(() => {
                result.current.handleToggleHistory();
            });

            expect(mockSetIsHistoryOpen).toHaveBeenCalledWith(expect.any(Function));
        });
    });

    describe("handleCloseHistory", () => {
        it("should close history", () => {
            const deps = createMockDeps();
            const { result } = renderHook(() => useAppCallbacks(deps));

            act(() => {
                result.current.handleCloseHistory();
            });

            expect(mockSetIsHistoryOpen).toHaveBeenCalledWith(false);
        });
    });

    describe("handleConversationLoad", () => {
        it("should load conversation and show success message", () => {
            const deps = createMockDeps();
            const { result } = renderHook(() => useAppCallbacks(deps));

            act(() => {
                result.current.handleConversationLoad("conv-123");
            });

            expect(mockPostMessage).toHaveBeenCalledWith({
                type: "loadConversation",
                filename: "conv-123",
            });
            expect(mockSetActiveConversationId).toHaveBeenCalledWith("conv-123");
            expect(mockShowSuccess).toHaveBeenCalledWith("Conversation Loaded", expect.any(String));
        });
    });

    describe("handleConversationDelete", () => {
        it("should delete conversation", () => {
            const deps = createMockDeps();
            const { result } = renderHook(() => useAppCallbacks(deps));

            act(() => {
                result.current.handleConversationDelete("conv-123");
            });

            expect(mockPostMessage).toHaveBeenCalledWith({
                type: "deleteConversation",
                filename: "conv-123",
            });
        });
    });

    describe("handleModelChange", () => {
        it("should change model and save settings", () => {
            const deps = createMockDeps();
            const { result } = renderHook(() => useAppCallbacks(deps));

            act(() => {
                result.current.handleModelChange("claude-3-opus");
            });

            expect(mockSetSelectedModel).toHaveBeenCalledWith("claude-3-opus");
            expect(mockPostMessage).toHaveBeenCalledWith({
                type: "saveSettings",
                settings: { selectedModel: "claude-3-opus" },
            });
        });
    });

    describe("handlePlanModeToggle", () => {
        it("should toggle plan mode", () => {
            const deps = createMockDeps();
            const { result } = renderHook(() => useAppCallbacks(deps));

            act(() => {
                result.current.handlePlanModeToggle();
            });

            expect(mockTogglePlanMode).toHaveBeenCalled();
        });
    });

    describe("handleThinkingModeToggle", () => {
        it("should toggle thinking mode", () => {
            const deps = createMockDeps();
            const { result } = renderHook(() => useAppCallbacks(deps));

            act(() => {
                result.current.handleThinkingModeToggle();
            });

            expect(mockToggleThinkingMode).toHaveBeenCalled();
        });
    });

    describe("handleThinkingIntensityChange", () => {
        it("should change thinking intensity", () => {
            const deps = createMockDeps();
            const { result } = renderHook(() => useAppCallbacks(deps));

            act(() => {
                result.current.handleThinkingIntensityChange(ThinkingIntensity.High);
            });

            expect(mockSetThinkingIntensity).toHaveBeenCalledWith(ThinkingIntensity.High);
        });
    });

    describe("handleYoloModeToggle", () => {
        it("should toggle yolo mode and save settings", () => {
            const deps = createMockDeps();
            const { result } = renderHook(() => useAppCallbacks(deps));

            act(() => {
                result.current.handleYoloModeToggle();
            });

            expect(mockToggleYoloMode).toHaveBeenCalled();
            expect(mockPostMessage).toHaveBeenCalledWith({
                type: "saveSettings",
                settings: { yoloMode: true }, // toggled from false to true
            });
        });
    });

    describe("handleMcpAction", () => {
        it("should open MCP modal and load servers", () => {
            const deps = createMockDeps();
            const { result } = renderHook(() => useAppCallbacks(deps));

            act(() => {
                result.current.handleMcpAction();
            });

            expect(mockPostMessage).toHaveBeenCalledWith({ type: "loadMCPServers" });
            expect(mockOpenModal).toHaveBeenCalledWith("mcp");
        });
    });

    describe("MCP callbacks", () => {
        beforeEach(() => {
            // Reset MCP store before each test
            useMCPStore.setState({ servers: [], selectedServerId: null });
        });

        describe("mcpServers", () => {
            it("should return empty array when no servers", () => {
                const deps = createMockDeps();
                const { result } = renderHook(() => useAppCallbacks(deps));

                expect(result.current.mcpServers).toEqual([]);
            });

            it("should return servers from store", () => {
                // Add a server to the store
                useMCPStore.getState().addServer({
                    id: "test-server",
                    name: "Test Server",
                    command: "npx",
                    args: ["-y", "test-mcp"],
                    enabled: true,
                });

                const deps = createMockDeps();
                const { result } = renderHook(() => useAppCallbacks(deps));

                expect(result.current.mcpServers).toHaveLength(1);
                expect(result.current.mcpServers[0]).toMatchObject({
                    id: "test-server",
                    name: "Test Server",
                    type: "stdio",
                    enabled: true,
                    command: "npx",
                    args: ["-y", "test-mcp"],
                });
            });
        });

        describe("handleMcpLoadServers", () => {
            it("should post loadMCPServers message", () => {
                const deps = createMockDeps();
                const { result } = renderHook(() => useAppCallbacks(deps));

                act(() => {
                    result.current.handleMcpLoadServers();
                });

                expect(mockPostMessage).toHaveBeenCalledWith({ type: "loadMCPServers" });
            });
        });

        describe("handleMcpAddServer", () => {
            it("should add server to store and post save message", () => {
                const deps = createMockDeps();
                const { result } = renderHook(() => useAppCallbacks(deps));

                act(() => {
                    result.current.handleMcpAddServer({
                        name: "new-server",
                        type: "stdio",
                        enabled: true,
                        command: "/usr/bin/server",
                        args: ["--arg1"],
                        env: { API_KEY: "secret" },
                    });
                });

                // Check store was updated
                const servers = useMCPStore.getState().servers;
                expect(servers).toHaveLength(1);
                expect(servers[0].config.name).toBe("new-server");
                expect(servers[0].config.command).toBe("/usr/bin/server");
                expect(servers[0].config.args).toEqual(["--arg1"]);
                expect(servers[0].config.env).toEqual({ API_KEY: "secret" });

                // Check message was posted
                expect(mockPostMessage).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: "saveMCPServer",
                        name: "new-server",
                        config: expect.objectContaining({
                            type: "stdio",
                            command: "/usr/bin/server",
                            args: ["--arg1"],
                            env: { API_KEY: "secret" },
                        }),
                    }),
                );

                // Check success notification
                expect(mockShowSuccess).toHaveBeenCalledWith(
                    "MCP Server Added",
                    "Added server: new-server",
                );
            });

            it("should handle server without optional fields", () => {
                const deps = createMockDeps();
                const { result } = renderHook(() => useAppCallbacks(deps));

                act(() => {
                    result.current.handleMcpAddServer({
                        name: "simple-server",
                        type: "http",
                        enabled: true,
                        url: "https://example.com",
                    });
                });

                const servers = useMCPStore.getState().servers;
                expect(servers).toHaveLength(1);
                expect(servers[0].config.name).toBe("simple-server");
            });
        });

        describe("handleMcpDeleteServer", () => {
            it("should delete server from store and post delete message", () => {
                // Add a server first
                useMCPStore.getState().addServer({
                    id: "server-to-delete",
                    name: "Delete Me",
                    command: "npx",
                    enabled: true,
                });

                const deps = createMockDeps();
                const { result } = renderHook(() => useAppCallbacks(deps));

                expect(useMCPStore.getState().servers).toHaveLength(1);

                act(() => {
                    result.current.handleMcpDeleteServer("server-to-delete");
                });

                // Check store was updated
                expect(useMCPStore.getState().servers).toHaveLength(0);

                // Check message was posted
                expect(mockPostMessage).toHaveBeenCalledWith({
                    type: "deleteMCPServer",
                    name: "Delete Me",
                });

                // Check success notification
                expect(mockShowSuccess).toHaveBeenCalledWith(
                    "MCP Server Deleted",
                    "Removed server: Delete Me",
                );
            });

            it("should do nothing if server not found", () => {
                const deps = createMockDeps();
                const { result } = renderHook(() => useAppCallbacks(deps));

                act(() => {
                    result.current.handleMcpDeleteServer("non-existent");
                });

                expect(mockPostMessage).not.toHaveBeenCalledWith(
                    expect.objectContaining({ type: "deleteMCPServer" }),
                );
            });
        });

        describe("handleMcpToggleServer", () => {
            it("should toggle server enabled state", () => {
                // Add a server first
                useMCPStore.getState().addServer({
                    id: "toggle-server",
                    name: "Toggle Me",
                    command: "npx",
                    enabled: true,
                });

                const deps = createMockDeps();
                const { result } = renderHook(() => useAppCallbacks(deps));

                // Server is enabled
                expect(useMCPStore.getState().servers[0].config.enabled).toBe(true);

                act(() => {
                    result.current.handleMcpToggleServer("toggle-server", false);
                });

                // Server should now be disabled
                expect(useMCPStore.getState().servers[0].config.enabled).toBe(false);

                // Check success notification
                expect(mockShowSuccess).toHaveBeenCalledWith(
                    "MCP Server Updated",
                    "Toggle Me is now disabled",
                );
            });

            it("should toggle server from disabled to enabled", () => {
                // Add a disabled server
                useMCPStore.getState().addServer({
                    id: "toggle-server",
                    name: "Toggle Me",
                    command: "npx",
                    enabled: false,
                });

                const deps = createMockDeps();
                const { result } = renderHook(() => useAppCallbacks(deps));

                act(() => {
                    result.current.handleMcpToggleServer("toggle-server", true);
                });

                expect(useMCPStore.getState().servers[0].config.enabled).toBe(true);
                expect(mockShowSuccess).toHaveBeenCalledWith(
                    "MCP Server Updated",
                    "Toggle Me is now enabled",
                );
            });
        });
    });

    describe("handlePermissionResponse", () => {
        it("should resolve permission and post message", () => {
            const deps = createMockDeps();
            const { result } = renderHook(() => useAppCallbacks(deps));

            act(() => {
                result.current.handlePermissionResponse("req-123", "approve");
            });

            expect(mockResolvePending).toHaveBeenCalledWith("req-123", "approve");
            expect(mockPostMessage).toHaveBeenCalledWith({
                type: "permissionResponse",
                requestId: "req-123",
                decision: "approve",
            });
            expect(mockCloseModal).toHaveBeenCalled();
        });
    });

    describe("handleWSLConfigure", () => {
        it("should open settings modal and hide WSL alert", () => {
            const deps = createMockDeps();
            const { result } = renderHook(() => useAppCallbacks(deps));

            act(() => {
                result.current.handleWSLConfigure();
            });

            expect(mockOpenModal).toHaveBeenCalledWith("settings");
            expect(mockSetShowWSLAlert).toHaveBeenCalledWith(false);
        });
    });
});
