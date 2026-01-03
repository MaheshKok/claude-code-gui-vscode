/**
 * Conversation Store
 *
 * Manages conversation history, including loading, saving,
 * and deleting conversations.
 *
 * @module stores/conversationStore
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ChatMessage, ConversationThread } from "../types";
import { idGenerators } from "../../shared/utils";

// ============================================================================
// Types
// ============================================================================

/**
 * Conversation summary for the index
 */
export interface ConversationSummary {
    /** Unique conversation ID */
    id: string;
    /** Conversation title (auto-generated or user-set) */
    title: string;
    /** Preview of the first message */
    preview: string;
    /** Creation timestamp */
    createdAt: number;
    /** Last update timestamp */
    updatedAt: number;
    /** Number of messages */
    messageCount: number;
    /** Associated session ID if any */
    sessionId?: string;
    /** Tags for organization */
    tags?: string[];
}

/**
 * Full conversation data
 */
export interface Conversation {
    /** Conversation metadata */
    summary: ConversationSummary;
    /** All messages in the conversation */
    messages: ChatMessage[];
    /** Full thread data if available */
    thread?: ConversationThread;
}

/**
 * Conversation store state
 */
export interface ConversationState {
    /** Index of all conversations (metadata only) */
    conversations: ConversationSummary[];
    /** Currently loaded conversation */
    currentConversation: Conversation | null;
    /** Whether a conversation is being loaded */
    isLoading: boolean;
    /** Maximum number of conversations to keep */
    maxConversations: number;
}

/**
 * Conversation store actions
 */
export interface ConversationActions {
    /** Load a conversation by ID */
    loadConversation: (id: string) => Promise<boolean>;
    /** Save the current conversation */
    saveConversation: (messages: ChatMessage[], title?: string) => string;
    /** Update an existing conversation */
    updateConversation: (id: string, messages: ChatMessage[], title?: string) => void;
    /** Delete a conversation by ID */
    deleteConversation: (id: string) => void;
    /** Clear the current conversation */
    clearCurrentConversation: () => void;
    /** Create a new conversation */
    createConversation: (title?: string) => string;
    /** Set the current conversation */
    setCurrentConversation: (conversation: Conversation | null) => void;
    /** Update conversation title */
    updateTitle: (id: string, title: string) => void;
    /** Add tag to conversation */
    addTag: (id: string, tag: string) => void;
    /** Remove tag from conversation */
    removeTag: (id: string, tag: string) => void;
    /** Search conversations */
    searchConversations: (query: string) => ConversationSummary[];
    /** Get recent conversations */
    getRecentConversations: (limit?: number) => ConversationSummary[];
    /** Export conversation to JSON */
    exportConversation: (id: string) => string | null;
    /** Import conversation from JSON */
    importConversation: (json: string) => string | null;
    /** Prune old conversations beyond max limit */
    pruneOldConversations: () => void;
}

export type ConversationStore = ConversationState & ConversationActions;

// ============================================================================
// Initial State
// ============================================================================

const initialState: ConversationState = {
    conversations: [],
    currentConversation: null,
    isLoading: false,
    maxConversations: 100,
};

// ============================================================================
// Helpers
// ============================================================================

/** Generate a unique conversation ID - uses shared ID generator */
const generateConversationId = idGenerators.conversation;

/**
 * Generate a title from messages
 */
const generateTitle = (messages: ChatMessage[]): string => {
    const firstUserMessage = messages.find((m) => m.type === "user");
    if (firstUserMessage && "content" in firstUserMessage) {
        const content = firstUserMessage.content as string;
        return content.length > 50 ? `${content.substring(0, 50)}...` : content;
    }
    return `Conversation ${new Date().toLocaleDateString()}`;
};

/**
 * Generate a preview from messages
 */
const generatePreview = (messages: ChatMessage[]): string => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && "content" in lastMessage) {
        const content = lastMessage.content as string;
        return content.length > 100 ? `${content.substring(0, 100)}...` : content;
    }
    return "";
};

/**
 * Storage key for conversation data
 */
const getConversationStorageKey = (id: string) => `claude-flow-conv-${id}`;

// ============================================================================
// Store
// ============================================================================

/**
 * Conversation store for managing chat history
 */
export const useConversationStore = create<ConversationStore>()(
    persist(
        (set, get) => ({
            ...initialState,

            loadConversation: async (id) => {
                set({ isLoading: true });
                try {
                    const key = getConversationStorageKey(id);
                    const stored = localStorage.getItem(key);

                    if (stored) {
                        const conversation: Conversation = JSON.parse(stored);
                        set({
                            currentConversation: conversation,
                            isLoading: false,
                        });
                        return true;
                    }

                    set({ isLoading: false });
                    return false;
                } catch (error) {
                    console.error("Failed to load conversation:", error);
                    set({ isLoading: false });
                    return false;
                }
            },

            saveConversation: (messages, title) => {
                const id = generateConversationId();
                const now = Date.now();

                const summary: ConversationSummary = {
                    id,
                    title: title || generateTitle(messages),
                    preview: generatePreview(messages),
                    createdAt: now,
                    updatedAt: now,
                    messageCount: messages.length,
                };

                const conversation: Conversation = {
                    summary,
                    messages,
                };

                // Save to localStorage
                const key = getConversationStorageKey(id);
                localStorage.setItem(key, JSON.stringify(conversation));

                // Update index
                set((state) => ({
                    conversations: [summary, ...state.conversations],
                    currentConversation: conversation,
                }));

                // Prune if needed
                get().pruneOldConversations();

                return id;
            },

            updateConversation: (id, messages, title) => {
                const state = get();
                const existingIndex = state.conversations.findIndex((c) => c.id === id);

                if (existingIndex === -1) {
                    // Create new if doesn't exist
                    get().saveConversation(messages, title);
                    return;
                }

                const now = Date.now();
                const existing = state.conversations[existingIndex];

                const summary: ConversationSummary = {
                    ...existing,
                    title: title || existing.title,
                    preview: generatePreview(messages),
                    updatedAt: now,
                    messageCount: messages.length,
                };

                const conversation: Conversation = {
                    summary,
                    messages,
                };

                // Update localStorage
                const key = getConversationStorageKey(id);
                localStorage.setItem(key, JSON.stringify(conversation));

                // Update index
                set((state) => ({
                    conversations: state.conversations.map((c) => (c.id === id ? summary : c)),
                    currentConversation: conversation,
                }));
            },

            deleteConversation: (id) => {
                // Remove from localStorage
                const key = getConversationStorageKey(id);
                localStorage.removeItem(key);

                set((state) => ({
                    conversations: state.conversations.filter((c) => c.id !== id),
                    currentConversation:
                        state.currentConversation?.summary.id === id
                            ? null
                            : state.currentConversation,
                }));
            },

            clearCurrentConversation: () => set({ currentConversation: null }),

            createConversation: (title) => {
                const id = generateConversationId();
                const now = Date.now();

                const summary: ConversationSummary = {
                    id,
                    title: title || `New Conversation`,
                    preview: "",
                    createdAt: now,
                    updatedAt: now,
                    messageCount: 0,
                };

                const conversation: Conversation = {
                    summary,
                    messages: [],
                };

                set((state) => ({
                    conversations: [summary, ...state.conversations],
                    currentConversation: conversation,
                }));

                return id;
            },

            setCurrentConversation: (conversation) => set({ currentConversation: conversation }),

            updateTitle: (id, title) =>
                set((state) => {
                    const conversations = state.conversations.map((c) =>
                        c.id === id ? { ...c, title, updatedAt: Date.now() } : c,
                    );

                    // Update in localStorage too
                    const key = getConversationStorageKey(id);
                    const stored = localStorage.getItem(key);
                    if (stored) {
                        const conversation: Conversation = JSON.parse(stored);
                        conversation.summary.title = title;
                        conversation.summary.updatedAt = Date.now();
                        localStorage.setItem(key, JSON.stringify(conversation));
                    }

                    return {
                        conversations,
                        currentConversation:
                            state.currentConversation?.summary.id === id
                                ? {
                                      ...state.currentConversation,
                                      summary: {
                                          ...state.currentConversation.summary,
                                          title,
                                          updatedAt: Date.now(),
                                      },
                                  }
                                : state.currentConversation,
                    };
                }),

            addTag: (id, tag) =>
                set((state) => ({
                    conversations: state.conversations.map((c) =>
                        c.id === id
                            ? {
                                  ...c,
                                  tags: c.tags ? [...c.tags, tag] : [tag],
                                  updatedAt: Date.now(),
                              }
                            : c,
                    ),
                })),

            removeTag: (id, tag) =>
                set((state) => ({
                    conversations: state.conversations.map((c) =>
                        c.id === id
                            ? {
                                  ...c,
                                  tags: c.tags?.filter((t) => t !== tag),
                                  updatedAt: Date.now(),
                              }
                            : c,
                    ),
                })),

            searchConversations: (query) => {
                const state = get();
                const lowerQuery = query.toLowerCase();

                return state.conversations.filter(
                    (c) =>
                        c.title.toLowerCase().includes(lowerQuery) ||
                        c.preview.toLowerCase().includes(lowerQuery) ||
                        c.tags?.some((t) => t.toLowerCase().includes(lowerQuery)),
                );
            },

            getRecentConversations: (limit = 10) => {
                const state = get();
                return [...state.conversations]
                    .sort((a, b) => b.updatedAt - a.updatedAt)
                    .slice(0, limit);
            },

            exportConversation: (id) => {
                const key = getConversationStorageKey(id);
                const stored = localStorage.getItem(key);
                return stored || null;
            },

            importConversation: (json) => {
                try {
                    const conversation: Conversation = JSON.parse(json);
                    const newId = generateConversationId();
                    const now = Date.now();

                    const summary: ConversationSummary = {
                        ...conversation.summary,
                        id: newId,
                        createdAt: now,
                        updatedAt: now,
                    };

                    const newConversation: Conversation = {
                        ...conversation,
                        summary,
                    };

                    // Save to localStorage
                    const key = getConversationStorageKey(newId);
                    localStorage.setItem(key, JSON.stringify(newConversation));

                    // Update index
                    set((state) => ({
                        conversations: [summary, ...state.conversations],
                    }));

                    return newId;
                } catch (error) {
                    console.error("Failed to import conversation:", error);
                    return null;
                }
            },

            pruneOldConversations: () => {
                const state = get();
                if (state.conversations.length <= state.maxConversations) {
                    return;
                }

                // Sort by updatedAt and keep only the most recent
                const sorted = [...state.conversations].sort((a, b) => b.updatedAt - a.updatedAt);
                const toKeep = sorted.slice(0, state.maxConversations);
                const toRemove = sorted.slice(state.maxConversations);

                // Remove old conversations from localStorage
                toRemove.forEach((c) => {
                    const key = getConversationStorageKey(c.id);
                    localStorage.removeItem(key);
                });

                set({ conversations: toKeep });
            },
        }),
        {
            name: "claude-flow-conversation-index",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                // Only persist the conversation index, not the full conversations
                conversations: state.conversations,
                maxConversations: state.maxConversations,
            }),
        },
    ),
);

// ============================================================================
// Selectors
// ============================================================================

/**
 * Select all conversations
 */
export const selectConversations = (state: ConversationStore) => state.conversations;

/**
 * Select current conversation
 */
export const selectCurrentConversation = (state: ConversationStore) => state.currentConversation;

/**
 * Select loading state
 */
export const selectIsLoading = (state: ConversationStore) => state.isLoading;

/**
 * Select conversation count
 */
export const selectConversationCount = (state: ConversationStore) => state.conversations.length;

/**
 * Select conversation by ID
 */
export const selectConversationById = (id: string) => (state: ConversationStore) =>
    state.conversations.find((c) => c.id === id);

/**
 * Select conversations by tag
 */
export const selectConversationsByTag = (tag: string) => (state: ConversationStore) =>
    state.conversations.filter((c) => c.tags?.includes(tag));
