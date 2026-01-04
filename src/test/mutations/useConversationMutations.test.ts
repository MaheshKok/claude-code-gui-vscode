import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import {
    useSaveConversation,
    useUpdateConversation,
    useDeleteConversation,
    useLoadConversation,
    useImportConversation,
    useExportConversation,
    useUpdateConversationTitle,
    useAddConversationTag,
    useRemoveConversationTag,
} from "../../webview/mutations/useConversationMutations";
import { useConversationStore } from "../../webview/stores/conversationStore";
import { useChatStore } from "../../webview/stores/chatStore";
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

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

describe("useConversationMutations", () => {
    const mockMessages: ChatMessage[] = [
        { id: "1", type: "user", content: "Hello", timestamp: Date.now() } as ChatMessage,
        { id: "2", type: "assistant", content: "Hi there!", timestamp: Date.now() } as ChatMessage,
    ];

    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
        useConversationStore.setState({
            conversations: [],
            currentConversation: null,
            isLoading: false,
            maxConversations: 100,
        });
        useChatStore.setState({
            messages: [],
            isProcessing: false,
            sessionId: null,
        });
    });

    describe("useSaveConversation", () => {
        it("should save a conversation", async () => {
            const { result } = renderHook(() => useSaveConversation());

            await act(async () => {
                result.current.mutate({ messages: mockMessages, title: "Test Chat" });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toBeDefined();
            expect(useConversationStore.getState().conversations.length).toBe(1);
        });

        it("should set isPending during mutation", async () => {
            const { result } = renderHook(() => useSaveConversation());

            act(() => {
                result.current.mutate({ messages: mockMessages });
            });

            // isPending should be true initially
            expect(result.current.isPending).toBe(true);

            await waitFor(() => {
                expect(result.current.isPending).toBe(false);
            });
        });
    });

    describe("useUpdateConversation", () => {
        it("should update an existing conversation", async () => {
            // First save a conversation
            const id = useConversationStore.getState().saveConversation(mockMessages, "Original");
            const { result } = renderHook(() => useUpdateConversation());

            const updatedMessages = [
                ...mockMessages,
                { id: "3", type: "user", content: "More" } as ChatMessage,
            ];

            await act(async () => {
                result.current.mutate({ id, messages: updatedMessages, title: "Updated" });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(useConversationStore.getState().conversations[0].title).toBe("Updated");
        });

        it("should update only title when no messages provided", async () => {
            const id = useConversationStore.getState().saveConversation(mockMessages, "Original");
            const { result } = renderHook(() => useUpdateConversation());

            await act(async () => {
                result.current.mutate({ id, title: "New Title" });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(useConversationStore.getState().conversations[0].title).toBe("New Title");
        });
    });

    describe("useDeleteConversation", () => {
        it("should delete a conversation", async () => {
            const id = useConversationStore.getState().saveConversation(mockMessages, "To Delete");
            expect(useConversationStore.getState().conversations.length).toBe(1);

            const { result } = renderHook(() => useDeleteConversation());

            await act(async () => {
                result.current.mutate({ id });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(useConversationStore.getState().conversations.length).toBe(0);
        });
    });

    describe("useLoadConversation", () => {
        it("should load a conversation", async () => {
            const id = useConversationStore.getState().saveConversation(mockMessages, "To Load");
            useConversationStore.getState().clearCurrentConversation();

            const { result } = renderHook(() => useLoadConversation());

            await act(async () => {
                result.current.mutate({ id });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toBe(true);
        });

        it("should return false for non-existent conversation", async () => {
            const { result } = renderHook(() => useLoadConversation());

            await act(async () => {
                result.current.mutate({ id: "non-existent" });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toBe(false);
        });
    });

    describe("useImportConversation", () => {
        it("should import a conversation from JSON", async () => {
            const conversation = {
                summary: {
                    id: "imported",
                    title: "Imported",
                    preview: "",
                    createdAt: 0,
                    updatedAt: 0,
                    messageCount: 0,
                },
                messages: mockMessages,
            };
            const { result } = renderHook(() => useImportConversation());

            await act(async () => {
                result.current.mutate({ json: JSON.stringify(conversation) });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toBeDefined();
            expect(useConversationStore.getState().conversations.length).toBe(1);
        });

        it("should fail for invalid JSON", async () => {
            const { result } = renderHook(() => useImportConversation());

            await act(async () => {
                result.current.mutate({ json: "invalid json" });
            });

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });
        });
    });

    describe("useExportConversation", () => {
        it("should export a conversation to JSON", async () => {
            const id = useConversationStore.getState().saveConversation(mockMessages, "To Export");
            const { result } = renderHook(() => useExportConversation());

            await act(async () => {
                result.current.mutate({ id });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toBeDefined();
            const parsed = JSON.parse(result.current.data!);
            expect(parsed.summary.title).toBe("To Export");
        });

        it("should fail for non-existent conversation", async () => {
            const { result } = renderHook(() => useExportConversation());

            await act(async () => {
                result.current.mutate({ id: "non-existent" });
            });

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });
        });
    });

    describe("useUpdateConversationTitle", () => {
        it("should update conversation title", async () => {
            const id = useConversationStore.getState().saveConversation(mockMessages, "Original");
            const { result } = renderHook(() => useUpdateConversationTitle());

            await act(async () => {
                result.current.mutate({ id, title: "New Title" });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(useConversationStore.getState().conversations[0].title).toBe("New Title");
        });
    });

    describe("useAddConversationTag", () => {
        it("should add tag to conversation", async () => {
            const id = useConversationStore.getState().saveConversation(mockMessages, "Test");
            const { result } = renderHook(() => useAddConversationTag());

            await act(async () => {
                result.current.mutate({ id, tag: "important" });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(useConversationStore.getState().conversations[0].tags).toContain("important");
        });
    });

    describe("useRemoveConversationTag", () => {
        it("should remove tag from conversation", async () => {
            const id = useConversationStore.getState().saveConversation(mockMessages, "Test");
            useConversationStore.getState().addTag(id, "important");
            expect(useConversationStore.getState().conversations[0].tags).toContain("important");

            const { result } = renderHook(() => useRemoveConversationTag());

            await act(async () => {
                result.current.mutate({ id, tag: "important" });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(useConversationStore.getState().conversations[0].tags).not.toContain(
                "important",
            );
        });
    });
});
