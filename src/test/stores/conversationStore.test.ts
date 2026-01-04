import { describe, it, expect, beforeEach, vi } from "vitest";
import {
    useConversationStore,
    type ConversationSummary,
} from "../../webview/stores/conversationStore";
import type { ChatMessage } from "../../webview/types";

// Mock localStorage
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

Object.defineProperty(globalThis, "localStorage", {
    value: localStorageMock,
});

describe("conversationStore", () => {
    const mockMessages: ChatMessage[] = [
        { id: "1", type: "user", content: "Hello, world!", timestamp: Date.now() } as ChatMessage,
        { id: "2", type: "assistant", content: "Hi there!", timestamp: Date.now() } as ChatMessage,
    ];

    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
        // Reset the store
        useConversationStore.setState({
            conversations: [],
            currentConversation: null,
            isLoading: false,
            maxConversations: 100,
        });
    });

    describe("initial state", () => {
        it("should have empty conversations array", () => {
            expect(useConversationStore.getState().conversations).toEqual([]);
        });

        it("should have null currentConversation", () => {
            expect(useConversationStore.getState().currentConversation).toBeNull();
        });

        it("should not be loading", () => {
            expect(useConversationStore.getState().isLoading).toBe(false);
        });
    });

    describe("saveConversation", () => {
        it("should save a conversation with messages", () => {
            const id = useConversationStore.getState().saveConversation(mockMessages);
            expect(id).toBeDefined();
            expect(useConversationStore.getState().conversations.length).toBe(1);
        });

        it("should save conversation with custom title", () => {
            useConversationStore.getState().saveConversation(mockMessages, "My Chat");
            expect(useConversationStore.getState().conversations[0].title).toBe("My Chat");
        });

        it("should auto-generate title from first user message", () => {
            useConversationStore.getState().saveConversation(mockMessages);
            expect(useConversationStore.getState().conversations[0].title).toBe("Hello, world!");
        });

        it("should truncate long titles", () => {
            const longMessage: ChatMessage = {
                id: "1",
                type: "user",
                content: "A".repeat(100),
                timestamp: Date.now(),
            } as ChatMessage;
            useConversationStore.getState().saveConversation([longMessage]);
            const title = useConversationStore.getState().conversations[0].title;
            expect(title.length).toBeLessThanOrEqual(53); // 50 chars + "..."
        });

        it("should set current conversation after save", () => {
            useConversationStore.getState().saveConversation(mockMessages);
            expect(useConversationStore.getState().currentConversation).not.toBeNull();
        });
    });

    describe("createConversation", () => {
        it("should create a new empty conversation", () => {
            const id = useConversationStore.getState().createConversation();
            expect(id).toBeDefined();
            expect(useConversationStore.getState().conversations.length).toBe(1);
            expect(useConversationStore.getState().currentConversation?.messages).toEqual([]);
        });

        it("should create conversation with custom title", () => {
            useConversationStore.getState().createConversation("New Chat");
            expect(useConversationStore.getState().conversations[0].title).toBe("New Chat");
        });
    });

    describe("updateConversation", () => {
        it("should update an existing conversation", () => {
            const id = useConversationStore.getState().saveConversation(mockMessages);
            const newMessages = [
                ...mockMessages,
                { id: "3", type: "user", content: "More" } as ChatMessage,
            ];
            useConversationStore.getState().updateConversation(id, newMessages);
            expect(useConversationStore.getState().conversations[0].messageCount).toBe(3);
        });

        it("should update title if provided", () => {
            const id = useConversationStore.getState().saveConversation(mockMessages);
            useConversationStore.getState().updateConversation(id, mockMessages, "New Title");
            expect(useConversationStore.getState().conversations[0].title).toBe("New Title");
        });

        it("should create new conversation if id not found", () => {
            useConversationStore.getState().updateConversation("non-existent", mockMessages);
            expect(useConversationStore.getState().conversations.length).toBe(1);
        });
    });

    describe("deleteConversation", () => {
        it("should delete a conversation", () => {
            const id = useConversationStore.getState().saveConversation(mockMessages);
            useConversationStore.getState().deleteConversation(id);
            expect(useConversationStore.getState().conversations.length).toBe(0);
        });

        it("should clear currentConversation if deleted", () => {
            const id = useConversationStore.getState().saveConversation(mockMessages);
            useConversationStore.getState().deleteConversation(id);
            expect(useConversationStore.getState().currentConversation).toBeNull();
        });

        it("should not affect currentConversation if different conversation deleted", () => {
            const id1 = useConversationStore.getState().saveConversation(mockMessages);
            useConversationStore.getState().saveConversation([...mockMessages], "Second");
            useConversationStore.getState().deleteConversation(id1);
            expect(useConversationStore.getState().currentConversation).not.toBeNull();
        });
    });

    describe("clearCurrentConversation", () => {
        it("should clear current conversation", () => {
            useConversationStore.getState().saveConversation(mockMessages);
            useConversationStore.getState().clearCurrentConversation();
            expect(useConversationStore.getState().currentConversation).toBeNull();
        });
    });

    describe("setCurrentConversation", () => {
        it("should set current conversation", () => {
            const conversation = {
                summary: {
                    id: "test",
                    title: "Test",
                    preview: "",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    messageCount: 0,
                },
                messages: [],
            };
            useConversationStore.getState().setCurrentConversation(conversation);
            expect(useConversationStore.getState().currentConversation).toEqual(conversation);
        });
    });

    describe("updateTitle", () => {
        it("should update conversation title", () => {
            const id = useConversationStore.getState().saveConversation(mockMessages);
            useConversationStore.getState().updateTitle(id, "Updated Title");
            expect(useConversationStore.getState().conversations[0].title).toBe("Updated Title");
        });

        it("should update currentConversation title if same id", () => {
            const id = useConversationStore.getState().saveConversation(mockMessages);
            useConversationStore.getState().updateTitle(id, "Updated Title");
            expect(useConversationStore.getState().currentConversation?.summary.title).toBe(
                "Updated Title",
            );
        });
    });

    describe("tags", () => {
        it("should add tag to conversation", () => {
            const id = useConversationStore.getState().saveConversation(mockMessages);
            useConversationStore.getState().addTag(id, "important");
            expect(useConversationStore.getState().conversations[0].tags).toContain("important");
        });

        it("should remove tag from conversation", () => {
            const id = useConversationStore.getState().saveConversation(mockMessages);
            useConversationStore.getState().addTag(id, "important");
            useConversationStore.getState().removeTag(id, "important");
            expect(useConversationStore.getState().conversations[0].tags).not.toContain(
                "important",
            );
        });
    });

    describe("searchConversations", () => {
        beforeEach(() => {
            useConversationStore.getState().saveConversation(mockMessages, "First Chat");
            useConversationStore.getState().saveConversation(
                [
                    {
                        id: "1",
                        type: "user",
                        content: "Python tutorial",
                        timestamp: Date.now(),
                    } as ChatMessage,
                ],
                "Python Chat",
            );
        });

        it("should search by title", () => {
            const results = useConversationStore.getState().searchConversations("Python");
            expect(results.length).toBe(1);
            expect(results[0].title).toBe("Python Chat");
        });

        it("should search case-insensitively", () => {
            const results = useConversationStore.getState().searchConversations("python");
            expect(results.length).toBe(1);
        });

        it("should search by tags", () => {
            const conversations = useConversationStore.getState().conversations;
            useConversationStore.getState().addTag(conversations[0].id, "programming");
            const results = useConversationStore.getState().searchConversations("programming");
            expect(results.length).toBe(1);
        });
    });

    describe("getRecentConversations", () => {
        it("should return recent conversations sorted by updatedAt", () => {
            useConversationStore.getState().saveConversation(mockMessages, "First");
            useConversationStore.getState().saveConversation(mockMessages, "Second");
            const recent = useConversationStore.getState().getRecentConversations(1);
            expect(recent.length).toBe(1);
            expect(recent[0].title).toBe("Second");
        });
    });

    describe("exportConversation", () => {
        it("should export conversation as JSON", () => {
            const id = useConversationStore.getState().saveConversation(mockMessages);
            const exported = useConversationStore.getState().exportConversation(id);
            expect(exported).not.toBeNull();
        });

        it("should return null for non-existent conversation", () => {
            const exported = useConversationStore.getState().exportConversation("non-existent");
            expect(exported).toBeNull();
        });
    });

    describe("importConversation", () => {
        it("should import conversation from JSON", () => {
            const conversation = {
                summary: {
                    id: "old-id",
                    title: "Imported",
                    preview: "",
                    createdAt: 0,
                    updatedAt: 0,
                    messageCount: 0,
                },
                messages: [],
            };
            const newId = useConversationStore
                .getState()
                .importConversation(JSON.stringify(conversation));
            expect(newId).not.toBeNull();
            expect(newId).not.toBe("old-id"); // Should generate new ID
        });

        it("should return null for invalid JSON", () => {
            const result = useConversationStore.getState().importConversation("invalid json");
            expect(result).toBeNull();
        });
    });

    describe("pruneOldConversations", () => {
        it("should prune conversations when exceeding max", () => {
            useConversationStore.setState({ maxConversations: 2 });
            useConversationStore.getState().saveConversation(mockMessages, "First");
            useConversationStore.getState().saveConversation(mockMessages, "Second");
            useConversationStore.getState().saveConversation(mockMessages, "Third");
            expect(useConversationStore.getState().conversations.length).toBe(2);
        });
    });

    describe("loadConversation", () => {
        it("should load conversation from localStorage", async () => {
            const id = useConversationStore.getState().saveConversation(mockMessages);
            useConversationStore.getState().clearCurrentConversation();
            const result = await useConversationStore.getState().loadConversation(id);
            expect(result).toBe(true);
            expect(useConversationStore.getState().currentConversation).not.toBeNull();
        });

        it("should return false for non-existent conversation", async () => {
            const result = await useConversationStore.getState().loadConversation("non-existent");
            expect(result).toBe(false);
        });

        it("should set isLoading during load", async () => {
            const id = useConversationStore.getState().saveConversation(mockMessages);
            const loadPromise = useConversationStore.getState().loadConversation(id);
            await loadPromise;
            expect(useConversationStore.getState().isLoading).toBe(false);
        });
    });
});
