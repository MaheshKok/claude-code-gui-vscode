/**
 * Chat Store
 *
 * Manages the chat state including messages, processing state,
 * session tracking, and token/cost tracking.
 *
 * @module stores/chatStore
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ChatMessage, TokenUsage, CumulativeTokenUsage, CostBreakdown } from "../types";
import type { TodoItem } from "../components/Tools";
import { STORAGE_KEYS, MessageType } from "../../shared/constants";

// ============================================================================
// Types
// ============================================================================

/**
 * Token tracking state
 */
export interface TokenTracking {
    /** Current message token usage */
    current: TokenUsage;
    /** Cumulative session token usage */
    cumulative: CumulativeTokenUsage;
}

/**
 * Cost tracking state
 */
export interface CostTracking {
    /** Total cost in USD for current session */
    sessionCostUsd: number;
    /** Total cost across all sessions */
    allTimeCostUsd: number;
    /** Cost breakdown by operation */
    breakdown: CostBreakdown;
    /** Last updated timestamp */
    lastUpdated: number;
}

/**
 * Chat store state
 */
export interface ChatState {
    /** All messages in the current conversation */
    messages: ChatMessage[];
    /** Whether the chat is currently processing a request */
    isProcessing: boolean;
    /** Current session identifier */
    currentSessionId: string | null;
    /** Current todo list */
    todos: TodoItem[];
    /** Token tracking */
    tokens: TokenTracking;
    /** Cost tracking */
    costs: CostTracking;
    /** Request start time for timing */
    requestStartTime: number | null;
    /** Number of conversation turns */
    numTurns: number;
}

/**
 * Chat store actions
 */
export interface ChatActions {
    /** Add a new message to the chat */
    addMessage: (message: ChatMessage) => void;
    /** Update an existing message by ID */
    updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
    /** Remove a message by ID */
    removeMessage: (id: string) => void;
    /** Clear all messages */
    clearMessages: () => void;
    /** Set processing state */
    setProcessing: (isProcessing: boolean) => void;
    /** Set the current session ID */
    setSessionId: (sessionId: string | null) => void;
    /** Set the current todo list */
    setTodos: (todos: TodoItem[]) => void;
    /** Clear the current todo list */
    clearTodos: () => void;
    /** Update current token usage */
    updateTokens: (usage: TokenUsage) => void;
    /** Update cumulative token usage */
    updateCumulativeTokens: (usage: Partial<CumulativeTokenUsage>) => void;
    /** Update session cost */
    updateSessionCost: (costUsd: number) => void;
    /** Reset token tracking for new session */
    resetTokenTracking: () => void;
    /** Start timing a request */
    startRequestTiming: () => void;
    /** Stop timing a request */
    stopRequestTiming: () => void;
    /** Increment turn count */
    incrementTurns: () => void;
    /** Reset chat state for new conversation */
    resetChat: () => void;
    /** Hydrate chat state from saved conversation */
    hydrateConversation: (payload: {
        messages: ChatMessage[];
        sessionId?: string | null;
        totalCost?: number;
        totalTokens?: {
            input: number;
            output: number;
        };
        todos?: TodoItem[];
    }) => void;
}

export type ChatStore = ChatState & ChatActions;

// ============================================================================
// Initial State
// ============================================================================

const initialTokenTracking: TokenTracking = {
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
};

const initialCostTracking: CostTracking = {
    sessionCostUsd: 0,
    allTimeCostUsd: 0,
    breakdown: {
        inputCost: 0,
        outputCost: 0,
        cacheCost: 0,
    },
    lastUpdated: 0,
};

const initialState: ChatState = {
    messages: [],
    isProcessing: false,
    currentSessionId: null,
    todos: [],
    tokens: initialTokenTracking,
    costs: initialCostTracking,
    requestStartTime: null,
    numTurns: 0,
};

// ============================================================================
// Store
// ============================================================================

/**
 * Chat store for managing conversation state
 */
export const useChatStore = create<ChatStore>()(
    persist(
        (set, get) => ({
            ...initialState,

            addMessage: (message) =>
                set((state) => ({
                    messages: [...state.messages, message],
                })),

            updateMessage: (id, updates) =>
                set((state) => ({
                    messages: state.messages.map((msg) =>
                        msg.id === id ? ({ ...msg, ...updates } as ChatMessage) : msg,
                    ),
                })),

            removeMessage: (id) =>
                set((state) => ({
                    messages: state.messages.filter((msg) => msg.id !== id),
                })),

            clearMessages: () =>
                set({
                    messages: [],
                    numTurns: 0,
                }),

            setProcessing: (isProcessing) => set({ isProcessing }),

            setSessionId: (sessionId) => set({ currentSessionId: sessionId }),

            setTodos: (todos) => set({ todos }),

            clearTodos: () => set({ todos: [] }),

            updateTokens: (usage) =>
                set((state) => ({
                    tokens: {
                        ...state.tokens,
                        current: usage,
                        cumulative: {
                            totalInputTokens:
                                state.tokens.cumulative.totalInputTokens + usage.input_tokens,
                            totalOutputTokens:
                                state.tokens.cumulative.totalOutputTokens + usage.output_tokens,
                            totalCacheReadTokens:
                                state.tokens.cumulative.totalCacheReadTokens +
                                (usage.cache_read_input_tokens || 0),
                            totalCacheCreationTokens:
                                state.tokens.cumulative.totalCacheCreationTokens +
                                (usage.cache_creation_input_tokens || 0),
                        },
                    },
                })),

            updateCumulativeTokens: (usage) =>
                set((state) => ({
                    tokens: {
                        ...state.tokens,
                        cumulative: {
                            ...state.tokens.cumulative,
                            ...usage,
                        },
                    },
                })),

            updateSessionCost: (costUsd) =>
                set((state) => {
                    const delta = costUsd - state.costs.sessionCostUsd;
                    return {
                        costs: {
                            ...state.costs,
                            sessionCostUsd: costUsd,
                            allTimeCostUsd: state.costs.allTimeCostUsd + Math.max(0, delta),
                            lastUpdated: Date.now(),
                        },
                    };
                }),

            resetTokenTracking: () =>
                set({
                    tokens: initialTokenTracking,
                    costs: {
                        ...initialCostTracking,
                        allTimeCostUsd: get().costs.allTimeCostUsd,
                    },
                }),

            startRequestTiming: () => set({ requestStartTime: Date.now() }),

            stopRequestTiming: () => set({ requestStartTime: null }),

            incrementTurns: () => set((state) => ({ numTurns: state.numTurns + 1 })),

            resetChat: () =>
                set({
                    ...initialState,
                    costs: {
                        ...initialCostTracking,
                        allTimeCostUsd: get().costs.allTimeCostUsd,
                    },
                }),

            hydrateConversation: ({ messages, sessionId, totalCost, totalTokens, todos }) =>
                set((state) => ({
                    messages,
                    currentSessionId: sessionId ?? null,
                    isProcessing: false,
                    requestStartTime: null,
                    todos: todos ?? state.todos,
                    numTurns: messages.filter((message) => message.type === MessageType.User)
                        .length,
                    tokens: {
                        current: {
                            input_tokens: 0,
                            output_tokens: 0,
                            cache_read_input_tokens: 0,
                            cache_creation_input_tokens: 0,
                        },
                        cumulative: {
                            totalInputTokens: totalTokens?.input ?? 0,
                            totalOutputTokens: totalTokens?.output ?? 0,
                            totalCacheReadTokens: 0,
                            totalCacheCreationTokens: 0,
                        },
                    },
                    costs: {
                        ...state.costs,
                        sessionCostUsd: totalCost ?? 0,
                        breakdown: {
                            inputCost: 0,
                            outputCost: 0,
                            cacheCost: 0,
                        },
                        lastUpdated: Date.now(),
                    },
                })),
        }),
        {
            name: STORAGE_KEYS.CHAT_STORE,
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                // Only persist costs across sessions
                costs: {
                    allTimeCostUsd: state.costs.allTimeCostUsd,
                },
            }),
        },
    ),
);

// ============================================================================
// Selectors
// ============================================================================

/**
 * Select all messages
 */
export const selectMessages = (state: ChatStore) => state.messages;

/**
 * Select processing state
 */
export const selectIsProcessing = (state: ChatStore) => state.isProcessing;

/**
 * Select current session ID
 */
export const selectSessionId = (state: ChatStore) => state.currentSessionId;

/**
 * Select todo list
 */
export const selectTodos = (state: ChatStore) => state.todos;

/**
 * Select token tracking
 */
export const selectTokens = (state: ChatStore) => state.tokens;

/**
 * Select cost tracking
 */
export const selectCosts = (state: ChatStore) => state.costs;

/**
 * Select message by ID
 */
export const selectMessageById = (id: string) => (state: ChatStore) =>
    state.messages.find((msg) => msg.id === id);

/**
 * Select last message
 */
export const selectLastMessage = (state: ChatStore) => state.messages[state.messages.length - 1];

/**
 * Select messages by type
 */
export const selectMessagesByType = (type: ChatMessage["type"]) => (state: ChatStore) =>
    state.messages.filter((msg) => msg.type === type);
