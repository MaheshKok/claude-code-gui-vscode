import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAppState } from "../../webview/hooks/useAppState";
import { useChatStore } from "../../webview/stores/chatStore";
import { useSettingsStore } from "../../webview/stores/settingsStore";
import { useUIStore } from "../../webview/stores/uiStore";
import { usePermissionStore } from "../../webview/stores/permissionStore";

describe("useAppState", () => {
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
    });

    describe("chat state", () => {
        it("should return initial chat state", () => {
            const { result } = renderHook(() => useAppState());

            expect(result.current.chat.messages).toEqual([]);
            expect(result.current.chat.isProcessing).toBe(false);
            expect(result.current.chat.todos).toEqual([]);
        });

        it("should update messages via chat actions", () => {
            const { result } = renderHook(() => useAppState());

            act(() => {
                result.current.chatActions.addMessage({
                    id: "msg-1",
                    role: "user",
                    content: "Hello",
                    timestamp: Date.now(),
                });
            });

            expect(result.current.chat.messages).toHaveLength(1);
            expect(result.current.chat.messages[0].content).toBe("Hello");
        });

        it("should update processing state", () => {
            const { result } = renderHook(() => useAppState());

            act(() => {
                result.current.chatActions.setProcessing(true);
            });

            expect(result.current.chat.isProcessing).toBe(true);

            act(() => {
                result.current.chatActions.setProcessing(false);
            });

            expect(result.current.chat.isProcessing).toBe(false);
        });

        it("should manage todos", () => {
            const { result } = renderHook(() => useAppState());

            act(() => {
                result.current.chatActions.setTodos([{ content: "Task 1", status: "pending" }]);
            });

            expect(result.current.chat.todos).toHaveLength(1);

            act(() => {
                result.current.chatActions.clearTodos();
            });

            expect(result.current.chat.todos).toEqual([]);
        });

        it("should track tokens", () => {
            const { result } = renderHook(() => useAppState());

            act(() => {
                result.current.chatActions.updateTokens({
                    input_tokens: 100,
                    output_tokens: 50,
                    cache_read_input_tokens: 60,
                    cache_creation_input_tokens: 0,
                });
            });

            expect(result.current.chat.tokens.current.input_tokens).toBe(100);
            expect(result.current.chat.tokens.current.output_tokens).toBe(50);
            expect(result.current.chat.tokens.current.cache_read_input_tokens).toBe(60);
        });

        it("should manage session cost", () => {
            const { result } = renderHook(() => useAppState());

            act(() => {
                result.current.chatActions.updateSessionCost(0.05);
            });

            expect(result.current.chat.costs.sessionCostUsd).toBe(0.05);
        });

        it("should handle request timing", () => {
            const { result } = renderHook(() => useAppState());

            act(() => {
                result.current.chatActions.startRequestTiming();
            });

            expect(result.current.chat.requestStartTime).not.toBeNull();

            act(() => {
                result.current.chatActions.stopRequestTiming();
            });

            expect(result.current.chat.requestStartTime).toBeNull();
        });

        it("should reset token tracking", () => {
            const { result } = renderHook(() => useAppState());

            act(() => {
                result.current.chatActions.updateTokens({
                    input_tokens: 100,
                    output_tokens: 50,
                    cache_read_input_tokens: 60,
                    cache_creation_input_tokens: 0,
                });
                result.current.chatActions.resetTokenTracking();
            });

            expect(result.current.chat.tokens.current.input_tokens).toBe(0);
            expect(result.current.chat.tokens.current.output_tokens).toBe(0);
        });

        it("should reset chat", () => {
            const { result } = renderHook(() => useAppState());

            act(() => {
                result.current.chatActions.addMessage({
                    id: "msg-1",
                    role: "user",
                    content: "Hello",
                    timestamp: Date.now(),
                });
                result.current.chatActions.resetChat();
            });

            expect(result.current.chat.messages).toEqual([]);
        });
    });

    describe("settings state", () => {
        it("should return initial settings state", () => {
            const { result } = renderHook(() => useAppState());

            expect(result.current.settings.thinkingMode).toBeDefined();
            expect(result.current.settings.planMode).toBe(false);
            expect(result.current.settings.yoloMode).toBe(false);
        });

        it("should update selected model", () => {
            const { result } = renderHook(() => useAppState());

            act(() => {
                result.current.settingsActions.setSelectedModel("claude-3-opus-20240229");
            });

            expect(result.current.settings.selectedModel).toBe("claude-3-opus-20240229");
        });

        it("should toggle thinking mode", () => {
            const { result } = renderHook(() => useAppState());
            const initial = result.current.settings.thinkingMode;

            act(() => {
                result.current.settingsActions.toggleThinkingMode();
            });

            expect(result.current.settings.thinkingMode).toBe(!initial);
        });

        it("should toggle plan mode", () => {
            const { result } = renderHook(() => useAppState());

            act(() => {
                result.current.settingsActions.togglePlanMode();
            });

            expect(result.current.settings.planMode).toBe(true);
        });

        it("should toggle yolo mode", () => {
            const { result } = renderHook(() => useAppState());

            act(() => {
                result.current.settingsActions.toggleYoloMode();
            });

            expect(result.current.settings.yoloMode).toBe(true);
        });

        it("should set thinking intensity", () => {
            const { result } = renderHook(() => useAppState());

            act(() => {
                result.current.settingsActions.setThinkingIntensity("think-harder");
            });

            expect(result.current.settings.thinkingIntensity).toBe("think-harder");
        });
    });

    describe("ui state", () => {
        it("should return initial ui state", () => {
            const { result } = renderHook(() => useAppState());

            expect(result.current.ui.activeModal).toBeNull();
            expect(result.current.ui.isConnected).toBe(false);
        });

        it("should manage modal state", () => {
            const { result } = renderHook(() => useAppState());

            act(() => {
                result.current.uiActions.openModal("settings");
            });

            expect(result.current.ui.activeModal).toBe("settings");

            act(() => {
                result.current.uiActions.closeModal();
            });

            expect(result.current.ui.activeModal).toBeNull();
        });

        it("should set connection status", () => {
            const { result } = renderHook(() => useAppState());

            act(() => {
                result.current.uiActions.setConnectionStatus("connected");
            });

            expect(result.current.ui.isConnected).toBe(true);
        });

        it("should show error", () => {
            const { result } = renderHook(() => useAppState());

            expect(() => {
                act(() => {
                    result.current.uiActions.showError("Error message");
                });
            }).not.toThrow();
        });

        it("should show success", () => {
            const { result } = renderHook(() => useAppState());

            expect(() => {
                act(() => {
                    result.current.uiActions.showSuccess("Success message");
                });
            }).not.toThrow();
        });
    });

    describe("local state", () => {
        it("should manage showWSLAlert", () => {
            const { result } = renderHook(() => useAppState());

            expect(result.current.local.showWSLAlert).toBe(false);

            act(() => {
                result.current.local.setShowWSLAlert(true);
            });

            expect(result.current.local.showWSLAlert).toBe(true);
        });

        it("should manage streamingMessageId", () => {
            const { result } = renderHook(() => useAppState());

            expect(result.current.local.streamingMessageId).toBeNull();

            act(() => {
                result.current.local.setStreamingMessageId("msg-1");
            });

            expect(result.current.local.streamingMessageId).toBe("msg-1");
        });

        it("should manage isHistoryOpen", () => {
            const { result } = renderHook(() => useAppState());

            expect(result.current.local.isHistoryOpen).toBe(false);

            act(() => {
                result.current.local.setIsHistoryOpen(true);
            });

            expect(result.current.local.isHistoryOpen).toBe(true);
        });

        it("should manage conversationList", () => {
            const { result } = renderHook(() => useAppState());

            expect(result.current.local.conversationList).toEqual([]);

            act(() => {
                result.current.local.setConversationList([
                    {
                        id: "conv-1",
                        title: "Test Conversation",
                        lastUpdated: Date.now(),
                        messageCount: 5,
                    },
                ]);
            });

            expect(result.current.local.conversationList).toHaveLength(1);
        });

        it("should manage isHistoryLoading", () => {
            const { result } = renderHook(() => useAppState());

            expect(result.current.local.isHistoryLoading).toBe(false);

            act(() => {
                result.current.local.setIsHistoryLoading(true);
            });

            expect(result.current.local.isHistoryLoading).toBe(true);
        });

        it("should manage activeConversationId", () => {
            const { result } = renderHook(() => useAppState());

            expect(result.current.local.activeConversationId).toBeNull();

            act(() => {
                result.current.local.setActiveConversationId("conv-123");
            });

            expect(result.current.local.activeConversationId).toBe("conv-123");
        });

        it("should manage subscriptionType", () => {
            const { result } = renderHook(() => useAppState());

            expect(result.current.local.subscriptionType).toBeNull();

            act(() => {
                result.current.local.setSubscriptionType("pro");
            });

            expect(result.current.local.subscriptionType).toBe("pro");
        });

        it("should manage requestCount", () => {
            const { result } = renderHook(() => useAppState());

            expect(result.current.local.requestCount).toBe(0);

            act(() => {
                result.current.local.setRequestCount(5);
            });

            expect(result.current.local.requestCount).toBe(5);
        });

        it("should manage lastDurationMs", () => {
            const { result } = renderHook(() => useAppState());

            expect(result.current.local.lastDurationMs).toBeNull();

            act(() => {
                result.current.local.setLastDurationMs(1500);
            });

            expect(result.current.local.lastDurationMs).toBe(1500);
        });
    });

    describe("permission state", () => {
        it("should return pending permission", () => {
            const { result } = renderHook(() => useAppState());

            expect(result.current.permission.pendingPermission).toBeUndefined();
        });

        it("should add pending permission", () => {
            const { result } = renderHook(() => useAppState());

            act(() => {
                result.current.permission.addPending({
                    requestId: "req-1",
                    toolName: "Read",
                    input: { file_path: "/test.txt" },
                    status: "pending",
                    timestamp: Date.now(),
                });
            });

            expect(result.current.permission.pendingPermission).toBeDefined();
            expect(result.current.permission.pendingPermission?.toolName).toBe("Read");
        });
    });
});
