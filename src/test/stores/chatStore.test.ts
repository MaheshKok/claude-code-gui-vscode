/**
 * Chat Store Tests
 *
 * Tests for the Zustand chat store including message management,
 * token tracking, and session handling.
 *
 * @module test/stores/chatStore
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
    useChatStore,
    selectMessages,
    selectIsProcessing,
    selectSessionId,
    selectTokens,
    selectCosts,
    selectMessageById,
    selectLastMessage,
    selectMessagesByType,
    type ChatState,
} from "../../webview/stores/chatStore";
import type { ChatMessage, TokenUsage } from "../../webview/types";

// Mock localStorage for persistence tests
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
    };
})();

Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
});

// Helper to create a mock message
function createMockMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
    return {
        id: `msg-${Date.now()}-${Math.random()}`,
        type: "user",
        content: "Test message",
        timestamp: Date.now(),
        ...overrides,
    } as ChatMessage;
}

describe("chatStore", () => {
    beforeEach(() => {
        // Clear localStorage first to prevent hydration of old state
        localStorageMock.clear();

        // Reset store state before each test by setting state directly
        // Note: resetChat() preserves allTimeCostUsd, so we use setState for a complete reset
        const { result } = renderHook(() => useChatStore());
        act(() => {
            useChatStore.setState({
                messages: [],
                isProcessing: false,
                currentSessionId: null,
                todos: [],
                tokens: {
                    current: {
                        input_tokens: 0,
                        output_tokens: 0,
                        cache_read_input_tokens: 0,
                        cache_creation_input_tokens: 0,
                    },
                    cumulative: {
                        totalInputTokens: 0,
                        totalOutputTokens: 0,
                        totalCacheReadTokens: 0,
                        totalCacheCreationTokens: 0,
                    },
                },
                costs: {
                    sessionCostUsd: 0,
                    allTimeCostUsd: 0,
                    breakdown: { inputCost: 0, outputCost: 0, cacheCost: 0 },
                    lastUpdated: 0,
                },
                requestStartTime: null,
                numTurns: 0,
            });
        });
    });

    // ==========================================================================
    // Message Management Tests
    // ==========================================================================
    describe("message management", () => {
        describe("addMessage", () => {
            it("should add a message to the store", () => {
                const { result } = renderHook(() => useChatStore());
                const message = createMockMessage({ content: "Hello" });

                act(() => {
                    result.current.addMessage(message);
                });

                expect(result.current.messages).toHaveLength(1);
                expect(result.current.messages[0]).toEqual(message);
            });

            it("should append messages in order", () => {
                const { result } = renderHook(() => useChatStore());
                const message1 = createMockMessage({ id: "1", content: "First" });
                const message2 = createMockMessage({ id: "2", content: "Second" });

                act(() => {
                    result.current.addMessage(message1);
                    result.current.addMessage(message2);
                });

                expect(result.current.messages).toHaveLength(2);
                expect(result.current.messages[0].id).toBe("1");
                expect(result.current.messages[1].id).toBe("2");
            });

            it("should handle different message types", () => {
                const { result } = renderHook(() => useChatStore());
                const userMsg = createMockMessage({ type: "user" });
                const assistantMsg = createMockMessage({ type: "assistant" });
                const toolMsg = createMockMessage({ type: "tool_use" });

                act(() => {
                    result.current.addMessage(userMsg);
                    result.current.addMessage(assistantMsg);
                    result.current.addMessage(toolMsg);
                });

                expect(result.current.messages).toHaveLength(3);
            });
        });

        describe("updateMessage", () => {
            it("should update an existing message by ID", () => {
                const { result } = renderHook(() => useChatStore());
                const message = createMockMessage({
                    id: "update-test",
                    content: "Original",
                });

                act(() => {
                    result.current.addMessage(message);
                });

                act(() => {
                    result.current.updateMessage("update-test", { content: "Updated" });
                });

                expect(result.current.messages[0].content).toBe("Updated");
            });

            it("should preserve other message properties", () => {
                const { result } = renderHook(() => useChatStore());
                const message = createMockMessage({
                    id: "preserve-test",
                    content: "Original",
                    type: "user",
                });

                act(() => {
                    result.current.addMessage(message);
                });

                act(() => {
                    result.current.updateMessage("preserve-test", { content: "Updated" });
                });

                expect(result.current.messages[0].type).toBe("user");
                expect(result.current.messages[0].id).toBe("preserve-test");
            });

            it("should not modify other messages", () => {
                const { result } = renderHook(() => useChatStore());
                const msg1 = createMockMessage({ id: "1", content: "First" });
                const msg2 = createMockMessage({ id: "2", content: "Second" });

                act(() => {
                    result.current.addMessage(msg1);
                    result.current.addMessage(msg2);
                });

                act(() => {
                    result.current.updateMessage("1", { content: "Updated" });
                });

                expect(result.current.messages[0].content).toBe("Updated");
                expect(result.current.messages[1].content).toBe("Second");
            });

            it("should do nothing for non-existent ID", () => {
                const { result } = renderHook(() => useChatStore());
                const message = createMockMessage({ id: "existing" });

                act(() => {
                    result.current.addMessage(message);
                });

                act(() => {
                    result.current.updateMessage("non-existent", { content: "Updated" });
                });

                expect(result.current.messages).toHaveLength(1);
                expect(result.current.messages[0].content).toBe(message.content);
            });
        });

        describe("removeMessage", () => {
            it("should remove a message by ID", () => {
                const { result } = renderHook(() => useChatStore());
                const message = createMockMessage({ id: "remove-test" });

                act(() => {
                    result.current.addMessage(message);
                });

                act(() => {
                    result.current.removeMessage("remove-test");
                });

                expect(result.current.messages).toHaveLength(0);
            });

            it("should only remove the specified message", () => {
                const { result } = renderHook(() => useChatStore());
                const msg1 = createMockMessage({ id: "1" });
                const msg2 = createMockMessage({ id: "2" });
                const msg3 = createMockMessage({ id: "3" });

                act(() => {
                    result.current.addMessage(msg1);
                    result.current.addMessage(msg2);
                    result.current.addMessage(msg3);
                });

                act(() => {
                    result.current.removeMessage("2");
                });

                expect(result.current.messages).toHaveLength(2);
                expect(result.current.messages.map((m) => m.id)).toEqual(["1", "3"]);
            });

            it("should do nothing for non-existent ID", () => {
                const { result } = renderHook(() => useChatStore());
                const message = createMockMessage({ id: "existing" });

                act(() => {
                    result.current.addMessage(message);
                });

                act(() => {
                    result.current.removeMessage("non-existent");
                });

                expect(result.current.messages).toHaveLength(1);
            });
        });

        describe("clearMessages", () => {
            it("should remove all messages", () => {
                const { result } = renderHook(() => useChatStore());

                act(() => {
                    result.current.addMessage(createMockMessage());
                    result.current.addMessage(createMockMessage());
                    result.current.addMessage(createMockMessage());
                });

                expect(result.current.messages).toHaveLength(3);

                act(() => {
                    result.current.clearMessages();
                });

                expect(result.current.messages).toHaveLength(0);
            });

            it("should reset turn count", () => {
                const { result } = renderHook(() => useChatStore());

                act(() => {
                    result.current.incrementTurns();
                    result.current.incrementTurns();
                });

                expect(result.current.numTurns).toBe(2);

                act(() => {
                    result.current.clearMessages();
                });

                expect(result.current.numTurns).toBe(0);
            });
        });
    });

    // ==========================================================================
    // Token Tracking Tests
    // ==========================================================================
    describe("token tracking", () => {
        describe("updateTokens", () => {
            it("should update current token usage", () => {
                const { result } = renderHook(() => useChatStore());
                const usage: TokenUsage = {
                    input_tokens: 100,
                    output_tokens: 50,
                    cache_read_input_tokens: 20,
                    cache_creation_input_tokens: 10,
                };

                act(() => {
                    result.current.updateTokens(usage);
                });

                expect(result.current.tokens.current).toEqual(usage);
            });

            it("should accumulate cumulative tokens", () => {
                const { result } = renderHook(() => useChatStore());
                const usage1: TokenUsage = {
                    input_tokens: 100,
                    output_tokens: 50,
                    cache_read_input_tokens: 0,
                    cache_creation_input_tokens: 0,
                };
                const usage2: TokenUsage = {
                    input_tokens: 200,
                    output_tokens: 100,
                    cache_read_input_tokens: 0,
                    cache_creation_input_tokens: 0,
                };

                act(() => {
                    result.current.updateTokens(usage1);
                });

                act(() => {
                    result.current.updateTokens(usage2);
                });

                expect(result.current.tokens.cumulative.totalInputTokens).toBe(300);
                expect(result.current.tokens.cumulative.totalOutputTokens).toBe(150);
            });

            it("should handle missing cache tokens", () => {
                const { result } = renderHook(() => useChatStore());
                const usage: TokenUsage = {
                    input_tokens: 100,
                    output_tokens: 50,
                } as TokenUsage;

                act(() => {
                    result.current.updateTokens(usage);
                });

                expect(result.current.tokens.cumulative.totalCacheReadTokens).toBe(0);
                expect(result.current.tokens.cumulative.totalCacheCreationTokens).toBe(0);
            });
        });

        describe("updateCumulativeTokens", () => {
            it("should update specific cumulative token fields", () => {
                const { result } = renderHook(() => useChatStore());

                act(() => {
                    result.current.updateCumulativeTokens({
                        totalInputTokens: 1000,
                    });
                });

                expect(result.current.tokens.cumulative.totalInputTokens).toBe(1000);
                expect(result.current.tokens.cumulative.totalOutputTokens).toBe(0);
            });
        });

        describe("resetTokenTracking", () => {
            it("should reset token tracking to initial state", () => {
                const { result } = renderHook(() => useChatStore());

                act(() => {
                    result.current.updateTokens({
                        input_tokens: 100,
                        output_tokens: 50,
                        cache_read_input_tokens: 0,
                        cache_creation_input_tokens: 0,
                    });
                });

                act(() => {
                    result.current.resetTokenTracking();
                });

                expect(result.current.tokens.current.input_tokens).toBe(0);
                expect(result.current.tokens.current.output_tokens).toBe(0);
                expect(result.current.tokens.cumulative.totalInputTokens).toBe(0);
            });

            it("should preserve all-time cost", () => {
                const { result } = renderHook(() => useChatStore());

                act(() => {
                    result.current.updateSessionCost(5.0);
                });

                const allTimeCost = result.current.costs.allTimeCostUsd;

                act(() => {
                    result.current.resetTokenTracking();
                });

                expect(result.current.costs.allTimeCostUsd).toBe(allTimeCost);
            });
        });
    });

    // ==========================================================================
    // Processing State Tests
    // ==========================================================================
    describe("processing state", () => {
        describe("setProcessing", () => {
            it("should set processing state to true", () => {
                const { result } = renderHook(() => useChatStore());

                act(() => {
                    result.current.setProcessing(true);
                });

                expect(result.current.isProcessing).toBe(true);
            });

            it("should set processing state to false", () => {
                const { result } = renderHook(() => useChatStore());

                act(() => {
                    result.current.setProcessing(true);
                });

                act(() => {
                    result.current.setProcessing(false);
                });

                expect(result.current.isProcessing).toBe(false);
            });
        });

        describe("request timing", () => {
            it("should start request timing", () => {
                const { result } = renderHook(() => useChatStore());
                const beforeTime = Date.now();

                act(() => {
                    result.current.startRequestTiming();
                });

                expect(result.current.requestStartTime).toBeGreaterThanOrEqual(beforeTime);
            });

            it("should stop request timing", () => {
                const { result } = renderHook(() => useChatStore());

                act(() => {
                    result.current.startRequestTiming();
                });

                act(() => {
                    result.current.stopRequestTiming();
                });

                expect(result.current.requestStartTime).toBeNull();
            });
        });
    });

    // ==========================================================================
    // Session Management Tests
    // ==========================================================================
    describe("session management", () => {
        describe("setSessionId", () => {
            it("should set the session ID", () => {
                const { result } = renderHook(() => useChatStore());

                act(() => {
                    result.current.setSessionId("session-123");
                });

                expect(result.current.currentSessionId).toBe("session-123");
            });

            it("should allow clearing the session ID", () => {
                const { result } = renderHook(() => useChatStore());

                act(() => {
                    result.current.setSessionId("session-123");
                });

                act(() => {
                    result.current.setSessionId(null);
                });

                expect(result.current.currentSessionId).toBeNull();
            });
        });

        describe("incrementTurns", () => {
            it("should increment turn count", () => {
                const { result } = renderHook(() => useChatStore());

                expect(result.current.numTurns).toBe(0);

                act(() => {
                    result.current.incrementTurns();
                });

                expect(result.current.numTurns).toBe(1);

                act(() => {
                    result.current.incrementTurns();
                });

                expect(result.current.numTurns).toBe(2);
            });
        });

        describe("resetChat", () => {
            it("should reset all chat state", () => {
                const { result } = renderHook(() => useChatStore());

                // Set up some state
                act(() => {
                    result.current.addMessage(createMockMessage());
                    result.current.setProcessing(true);
                    result.current.setSessionId("session-123");
                    result.current.incrementTurns();
                });

                act(() => {
                    result.current.resetChat();
                });

                expect(result.current.messages).toHaveLength(0);
                expect(result.current.isProcessing).toBe(false);
                expect(result.current.currentSessionId).toBeNull();
                expect(result.current.numTurns).toBe(0);
            });

            it("should preserve all-time cost", () => {
                const { result } = renderHook(() => useChatStore());

                act(() => {
                    result.current.updateSessionCost(10.0);
                });

                const allTimeCost = result.current.costs.allTimeCostUsd;

                act(() => {
                    result.current.resetChat();
                });

                expect(result.current.costs.allTimeCostUsd).toBe(allTimeCost);
            });
        });
    });

    // ==========================================================================
    // Cost Tracking Tests
    // ==========================================================================
    describe("cost tracking", () => {
        describe("updateSessionCost", () => {
            it("should update session cost", () => {
                const { result } = renderHook(() => useChatStore());

                act(() => {
                    result.current.updateSessionCost(1.5);
                });

                expect(result.current.costs.sessionCostUsd).toBe(1.5);
            });

            it("should accumulate all-time cost", () => {
                const { result } = renderHook(() => useChatStore());

                act(() => {
                    result.current.updateSessionCost(1.0);
                });

                act(() => {
                    result.current.updateSessionCost(2.0);
                });

                // updateSessionCost accumulates the DELTA (difference from previous session cost)
                // First call: delta = 1.00 - 0 = 1.00, allTime = 0 + 1.00 = 1.00
                // Second call: delta = 2.00 - 1.00 = 1.00, allTime = 1.00 + 1.00 = 2.00
                expect(result.current.costs.allTimeCostUsd).toBe(2.0);
            });

            it("should update lastUpdated timestamp", () => {
                const { result } = renderHook(() => useChatStore());
                const beforeTime = Date.now();

                act(() => {
                    result.current.updateSessionCost(1.0);
                });

                expect(result.current.costs.lastUpdated).toBeGreaterThanOrEqual(beforeTime);
            });
        });
    });

    // ==========================================================================
    // Selector Tests
    // ==========================================================================
    describe("selectors", () => {
        it("selectMessages should return messages array", () => {
            const { result } = renderHook(() => useChatStore());
            const message = createMockMessage();

            act(() => {
                result.current.addMessage(message);
            });

            const messages = selectMessages(result.current);
            expect(messages).toHaveLength(1);
        });

        it("selectIsProcessing should return processing state", () => {
            const { result } = renderHook(() => useChatStore());

            act(() => {
                result.current.setProcessing(true);
            });

            expect(selectIsProcessing(result.current)).toBe(true);
        });

        it("selectSessionId should return current session ID", () => {
            const { result } = renderHook(() => useChatStore());

            act(() => {
                result.current.setSessionId("test-session");
            });

            expect(selectSessionId(result.current)).toBe("test-session");
        });

        it("selectTokens should return token tracking state", () => {
            const { result } = renderHook(() => useChatStore());
            const tokens = selectTokens(result.current);

            expect(tokens).toHaveProperty("current");
            expect(tokens).toHaveProperty("cumulative");
        });

        it("selectCosts should return cost tracking state", () => {
            const { result } = renderHook(() => useChatStore());
            const costs = selectCosts(result.current);

            expect(costs).toHaveProperty("sessionCostUsd");
            expect(costs).toHaveProperty("allTimeCostUsd");
        });

        it("selectMessageById should find message by ID", () => {
            const { result } = renderHook(() => useChatStore());
            const message = createMockMessage({ id: "find-me" });

            act(() => {
                result.current.addMessage(message);
            });

            const found = selectMessageById("find-me")(result.current);
            expect(found).toEqual(message);
        });

        it("selectMessageById should return undefined for non-existent ID", () => {
            const { result } = renderHook(() => useChatStore());

            const found = selectMessageById("non-existent")(result.current);
            expect(found).toBeUndefined();
        });

        it("selectLastMessage should return the last message", () => {
            const { result } = renderHook(() => useChatStore());
            const msg1 = createMockMessage({ id: "1" });
            const msg2 = createMockMessage({ id: "2" });

            act(() => {
                result.current.addMessage(msg1);
                result.current.addMessage(msg2);
            });

            const last = selectLastMessage(result.current);
            expect(last.id).toBe("2");
        });

        it("selectMessagesByType should filter messages by type", () => {
            const { result } = renderHook(() => useChatStore());
            const userMsg = createMockMessage({ type: "user" });
            const assistantMsg = createMockMessage({ type: "assistant" });
            const anotherUserMsg = createMockMessage({ type: "user" });

            act(() => {
                result.current.addMessage(userMsg);
                result.current.addMessage(assistantMsg);
                result.current.addMessage(anotherUserMsg);
            });

            const userMessages = selectMessagesByType("user")(result.current);
            expect(userMessages).toHaveLength(2);
            expect(userMessages.every((m) => m.type === "user")).toBe(true);
        });
    });

    // ==========================================================================
    // Initial State Tests
    // ==========================================================================
    describe("initial state", () => {
        it("should have empty messages array", () => {
            const { result } = renderHook(() => useChatStore());
            // After reset
            act(() => {
                result.current.resetChat();
            });
            expect(result.current.messages).toEqual([]);
        });

        it("should have isProcessing as false", () => {
            const { result } = renderHook(() => useChatStore());
            act(() => {
                result.current.resetChat();
            });
            expect(result.current.isProcessing).toBe(false);
        });

        it("should have null session ID", () => {
            const { result } = renderHook(() => useChatStore());
            act(() => {
                result.current.resetChat();
            });
            expect(result.current.currentSessionId).toBeNull();
        });

        it("should have zero tokens", () => {
            const { result } = renderHook(() => useChatStore());
            act(() => {
                result.current.resetChat();
            });
            expect(result.current.tokens.current.input_tokens).toBe(0);
            expect(result.current.tokens.current.output_tokens).toBe(0);
        });

        it("should have zero session cost", () => {
            const { result } = renderHook(() => useChatStore());
            act(() => {
                result.current.resetChat();
            });
            expect(result.current.costs.sessionCostUsd).toBe(0);
        });
    });
});
