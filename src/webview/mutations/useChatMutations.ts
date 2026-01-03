/**
 * Chat Mutations
 *
 * Mutation hooks for chat operations including sending messages,
 * updating messages, and managing chat state.
 *
 * @module mutations/useChatMutations
 */

import { useCallback } from "react";
import { useMutation, useOptimisticMutation } from "./useMutation";
import { useChatStore } from "../stores/chatStore";
import { useVSCode } from "../hooks/useVSCode";
import type { ChatMessage } from "../types";
import type {
    SendMessageVariables,
    UpdateMessageVariables,
    DeleteMessageVariables,
    MutationResult,
} from "./types";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a unique message ID
 */
function generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a user message object
 */
function createUserMessage(
    content: string,
    attachments?: string[],
    messageId?: string,
): ChatMessage {
    return {
        id: messageId ?? generateMessageId(),
        type: "user",
        content,
        timestamp: Date.now(),
        attachments,
    } as ChatMessage;
}

// ============================================================================
// useSendMessage
// ============================================================================

/**
 * Mutation hook for sending chat messages with optimistic updates
 *
 * @example
 * ```tsx
 * const { mutate: sendMessage, isPending } = useSendMessage();
 *
 * const handleSend = () => {
 *   sendMessage({ content: "Hello, Claude!", attachments: [] });
 * };
 * ```
 */
export function useSendMessage(): MutationResult<ChatMessage, SendMessageVariables, Error> {
    const { postMessage } = useVSCode();
    const addMessage = useChatStore((state) => state.addMessage);
    const setProcessing = useChatStore((state) => state.setProcessing);
    const messages = useChatStore((state) => state.messages);
    const startRequestTiming = useChatStore((state) => state.startRequestTiming);
    const incrementTurns = useChatStore((state) => state.incrementTurns);

    const mutation = useOptimisticMutation<ChatMessage, SendMessageVariables, ChatMessage[]>({
        mutationFn: async (variables) => {
            const messageId = variables.messageId ?? generateMessageId();
            const userMessage = createUserMessage(
                variables.content,
                variables.attachments,
                messageId,
            );

            // Send to extension
            postMessage({
                type: "sendMessage",
                message: variables.content,
            });

            return userMessage;
        },
        getSnapshot: () => [...messages],
        optimisticUpdate: (variables) => {
            const messageId = variables.messageId ?? generateMessageId();
            const userMessage = createUserMessage(
                variables.content,
                variables.attachments,
                messageId,
            );
            addMessage(userMessage);
            setProcessing(true);
            startRequestTiming();
            incrementTurns();
        },
        rollback: (previousMessages) => {
            // Rollback handled by store
            useChatStore.setState({ messages: previousMessages, isProcessing: false });
        },
        onSuccess: () => {
            // Message sent successfully - processing continues in background
        },
        onError: (error) => {
            console.error("[useSendMessage] Failed to send message:", error);
            setProcessing(false);
        },
    });

    const withMessageId = useCallback(
        (variables: SendMessageVariables): SendMessageVariables => ({
            ...variables,
            messageId: variables.messageId ?? generateMessageId(),
        }),
        [],
    );

    const { mutate: baseMutate, mutateAsync: baseMutateAsync } = mutation;

    const mutate = useCallback(
        (variables: SendMessageVariables) => {
            baseMutate(withMessageId(variables));
        },
        [baseMutate, withMessageId],
    );

    const mutateAsync = useCallback(
        (variables: SendMessageVariables) => baseMutateAsync(withMessageId(variables)),
        [baseMutateAsync, withMessageId],
    );

    return {
        ...mutation,
        mutate,
        mutateAsync,
    };
}

// ============================================================================
// useUpdateMessage
// ============================================================================

/**
 * Mutation hook for updating an existing message
 *
 * @example
 * ```tsx
 * const { mutate: updateMessage } = useUpdateMessage();
 *
 * updateMessage({ id: "msg-123", updates: { content: "Updated content" } });
 * ```
 */
export function useUpdateMessage(): MutationResult<void, UpdateMessageVariables, Error> {
    const updateMessage = useChatStore((state) => state.updateMessage);
    const messages = useChatStore((state) => state.messages);

    return useOptimisticMutation<void, UpdateMessageVariables, ChatMessage[]>({
        mutationFn: async () => {},
        getSnapshot: () => [...messages],
        optimisticUpdate: (variables) => {
            updateMessage(variables.id, variables.updates as Partial<ChatMessage>);
        },
        rollback: (previousMessages) => {
            useChatStore.setState({ messages: previousMessages });
        },
    });
}

// ============================================================================
// useDeleteMessage
// ============================================================================

/**
 * Mutation hook for deleting a message
 *
 * @example
 * ```tsx
 * const { mutate: deleteMessage, isPending } = useDeleteMessage();
 *
 * const handleDelete = (id: string) => {
 *   deleteMessage({ id });
 * };
 * ```
 */
export function useDeleteMessage(): MutationResult<void, DeleteMessageVariables, Error> {
    const removeMessage = useChatStore((state) => state.removeMessage);
    const messages = useChatStore((state) => state.messages);

    return useOptimisticMutation<void, DeleteMessageVariables, ChatMessage[]>({
        mutationFn: async () => {},
        getSnapshot: () => [...messages],
        optimisticUpdate: (variables) => {
            removeMessage(variables.id);
        },
        rollback: (previousMessages) => {
            useChatStore.setState({ messages: previousMessages });
        },
    });
}

// ============================================================================
// useClearChat
// ============================================================================

/**
 * Mutation hook for clearing all chat messages
 *
 * @example
 * ```tsx
 * const { mutate: clearChat, isPending } = useClearChat();
 *
 * const handleClear = () => {
 *   clearChat();
 * };
 * ```
 */
export function useClearChat(): MutationResult<void, void, Error> {
    const clearMessages = useChatStore((state) => state.clearMessages);
    const clearTodos = useChatStore((state) => state.clearTodos);
    const messages = useChatStore((state) => state.messages);

    return useOptimisticMutation<void, void, ChatMessage[]>({
        mutationFn: async () => {},
        getSnapshot: () => [...messages],
        optimisticUpdate: () => {
            clearMessages();
            clearTodos();
        },
        rollback: (previousMessages) => {
            useChatStore.setState({ messages: previousMessages });
        },
    });
}

// ============================================================================
// useResetChat
// ============================================================================

/**
 * Mutation hook for resetting chat to initial state
 *
 * @example
 * ```tsx
 * const { mutate: resetChat } = useResetChat();
 *
 * const handleNewConversation = () => {
 *   resetChat();
 * };
 * ```
 */
export function useResetChat(): MutationResult<void, void, Error> {
    const resetChat = useChatStore((state) => state.resetChat);
    const setSessionId = useChatStore((state) => state.setSessionId);
    const { postMessage } = useVSCode();

    return useMutation<void, void, Error>({
        mutationFn: async () => {
            resetChat();
            setSessionId(null);

            // Notify extension - clear conversation
            postMessage({
                type: "clearConversation",
            });
        },
        onSuccess: () => {
            console.log("[useResetChat] Chat reset successfully");
        },
        onError: (error) => {
            console.error("[useResetChat] Failed to reset chat:", error);
        },
    });
}
