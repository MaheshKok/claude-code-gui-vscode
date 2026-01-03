/**
 * Chat Mutations Tests
 *
 * Tests for chat mutation hooks including send, update, delete,
 * and clear message operations.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock the stores and hooks
const mockPostMessage = vi.fn();
const mockAddMessage = vi.fn();
const mockUpdateMessage = vi.fn();
const mockRemoveMessage = vi.fn();
const mockClearMessages = vi.fn();
const mockClearTodos = vi.fn();
const mockSetProcessing = vi.fn();
const mockStartRequestTiming = vi.fn();
const mockIncrementTurns = vi.fn();
const mockResetChat = vi.fn();
const mockSetSessionId = vi.fn();

vi.mock("../../webview/hooks/useVSCode", () => ({
    useVSCode: () => ({
        postMessage: mockPostMessage,
        isVSCode: true,
    }),
}));

vi.mock("../../webview/stores/chatStore", () => ({
    useChatStore: vi.fn((selector) => {
        const state = {
            messages: [],
            addMessage: mockAddMessage,
            updateMessage: mockUpdateMessage,
            removeMessage: mockRemoveMessage,
            clearMessages: mockClearMessages,
            clearTodos: mockClearTodos,
            setProcessing: mockSetProcessing,
            startRequestTiming: mockStartRequestTiming,
            incrementTurns: mockIncrementTurns,
            resetChat: mockResetChat,
            setSessionId: mockSetSessionId,
        };
        return selector(state);
    }),
}));

// Import after mocks
import {
    useSendMessage,
    useUpdateMessage,
    useDeleteMessage,
    useClearChat,
    useResetChat,
} from "../../webview/mutations/useChatMutations";

describe("useSendMessage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should send a message and update state optimistically", async () => {
        const { result } = renderHook(() => useSendMessage());

        await act(async () => {
            result.current.mutate({
                content: "Hello, Claude!",
                attachments: [],
            });
        });

        // Verify optimistic update was applied
        expect(mockAddMessage).toHaveBeenCalled();
        expect(mockSetProcessing).toHaveBeenCalledWith(true);
        expect(mockStartRequestTiming).toHaveBeenCalled();
        expect(mockIncrementTurns).toHaveBeenCalled();

        // Verify message was sent to extension
        expect(mockPostMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "sendMessage",
                message: "Hello, Claude!",
            }),
        );
    });

    it("should include attachments when provided", async () => {
        const { result } = renderHook(() => useSendMessage());

        await act(async () => {
            result.current.mutate({
                content: "Review this file",
                attachments: ["/path/to/file.ts"],
            });
        });

        // Verify message was sent
        expect(mockPostMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "sendMessage",
                message: "Review this file",
            }),
        );
    });

    it("should have correct initial state", () => {
        const { result } = renderHook(() => useSendMessage());

        expect(result.current.isIdle).toBe(true);
        expect(result.current.isPending).toBe(false);
        expect(result.current.isError).toBe(false);
    });
});

describe("useUpdateMessage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should update a message by ID", async () => {
        const { result } = renderHook(() => useUpdateMessage());

        await act(async () => {
            await result.current.mutateAsync({
                id: "msg-123",
                updates: { content: "Updated content" },
            });
        });

        expect(mockUpdateMessage).toHaveBeenCalledWith("msg-123", { content: "Updated content" });
    });

    it("should handle partial updates", async () => {
        const { result } = renderHook(() => useUpdateMessage());

        await act(async () => {
            await result.current.mutateAsync({
                id: "msg-456",
                updates: { status: "delivered" },
            });
        });

        expect(mockUpdateMessage).toHaveBeenCalledWith("msg-456", { status: "delivered" });
    });
});

describe("useDeleteMessage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should delete a message by ID", async () => {
        const { result } = renderHook(() => useDeleteMessage());

        await act(async () => {
            await result.current.mutateAsync({ id: "msg-to-delete" });
        });

        expect(mockRemoveMessage).toHaveBeenCalledWith("msg-to-delete");
    });

    it("should set success state after deletion", async () => {
        const { result } = renderHook(() => useDeleteMessage());

        await act(async () => {
            await result.current.mutateAsync({ id: "msg-123" });
        });

        expect(result.current.isSuccess).toBe(true);
        expect(result.current.isError).toBe(false);
    });
});

describe("useClearChat", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should clear all messages and todos", async () => {
        const { result } = renderHook(() => useClearChat());

        await act(async () => {
            await result.current.mutateAsync();
        });

        expect(mockClearMessages).toHaveBeenCalled();
        expect(mockClearTodos).toHaveBeenCalled();
    });

    it("should transition through states correctly", async () => {
        const { result } = renderHook(() => useClearChat());

        expect(result.current.isIdle).toBe(true);

        await act(async () => {
            await result.current.mutateAsync();
        });

        expect(result.current.isSuccess).toBe(true);
    });
});

describe("useResetChat", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should reset chat and notify extension", async () => {
        const { result } = renderHook(() => useResetChat());

        await act(async () => {
            await result.current.mutateAsync();
        });

        expect(mockResetChat).toHaveBeenCalled();
        expect(mockSetSessionId).toHaveBeenCalledWith(null);
        expect(mockPostMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "clearConversation",
            }),
        );
    });
});
