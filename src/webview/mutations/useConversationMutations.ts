/**
 * Conversation Mutations
 *
 * Mutation hooks for conversation management including save, update,
 * delete, import, and export operations.
 *
 * @module mutations/useConversationMutations
 */

import { useMutation, useOptimisticMutation } from "./useMutation";
import { useConversationStore, type ConversationSummary } from "../stores/conversationStore";
import { useChatStore } from "../stores/chatStore";
import type { ChatMessage } from "../types";
import type {
    SaveConversationVariables,
    UpdateConversationVariables,
    DeleteConversationVariables,
    ImportConversationVariables,
    MutationResult,
} from "./types";

// ============================================================================
// useSaveConversation
// ============================================================================

/**
 * Mutation hook for saving the current conversation
 *
 * @example
 * ```tsx
 * const { mutate: saveConversation, isPending } = useSaveConversation();
 *
 * const handleSave = () => {
 *   const messages = useChatStore.getState().messages;
 *   saveConversation({ messages, title: "My Conversation" });
 * };
 * ```
 */
export function useSaveConversation(): MutationResult<string, SaveConversationVariables, Error> {
    const saveConversation = useConversationStore((state) => state.saveConversation);

    return useMutation<string, SaveConversationVariables, Error>({
        mutationFn: async (variables) => {
            const id = saveConversation(variables.messages as ChatMessage[], variables.title);
            return id;
        },
        onSuccess: (id) => {
            console.log("[useSaveConversation] Saved conversation:", id);
        },
        onError: (error) => {
            console.error("[useSaveConversation] Failed to save:", error);
        },
    });
}

// ============================================================================
// useUpdateConversation
// ============================================================================

/**
 * Mutation hook for updating an existing conversation
 *
 * @example
 * ```tsx
 * const { mutate: updateConversation } = useUpdateConversation();
 *
 * updateConversation({
 *   id: "conv-123",
 *   messages: updatedMessages,
 *   title: "Updated Title",
 * });
 * ```
 */
export function useUpdateConversation(): MutationResult<void, UpdateConversationVariables, Error> {
    const updateConversation = useConversationStore((state) => state.updateConversation);
    const updateTitle = useConversationStore((state) => state.updateTitle);
    const conversations = useConversationStore((state) => state.conversations);

    return useOptimisticMutation<void, UpdateConversationVariables, ConversationSummary[]>({
        mutationFn: async () => {},
        getSnapshot: () => [...conversations],
        optimisticUpdate: (variables) => {
            if (variables.messages) {
                updateConversation(
                    variables.id,
                    variables.messages as ChatMessage[],
                    variables.title,
                );
                return;
            }
            if (variables.title) {
                updateTitle(variables.id, variables.title);
            }
        },
        rollback: (previousConversations) => {
            useConversationStore.setState({ conversations: previousConversations });
        },
    });
}

// ============================================================================
// useDeleteConversation
// ============================================================================

/**
 * Mutation hook for deleting a conversation
 *
 * @example
 * ```tsx
 * const { mutate: deleteConversation, isPending } = useDeleteConversation();
 *
 * const handleDelete = (id: string) => {
 *   deleteConversation({ id });
 * };
 * ```
 */
export function useDeleteConversation(): MutationResult<void, DeleteConversationVariables, Error> {
    const deleteConversation = useConversationStore((state) => state.deleteConversation);
    const conversations = useConversationStore((state) => state.conversations);

    return useOptimisticMutation<void, DeleteConversationVariables, ConversationSummary[]>({
        mutationFn: async () => {},
        getSnapshot: () => [...conversations],
        optimisticUpdate: (variables) => {
            deleteConversation(variables.id);
        },
        rollback: (previousConversations) => {
            useConversationStore.setState({ conversations: previousConversations });
        },
        onSuccess: () => {
            console.log("[useDeleteConversation] Conversation deleted");
        },
    });
}

// ============================================================================
// useLoadConversation
// ============================================================================

interface LoadConversationVariables {
    id: string;
}

/**
 * Mutation hook for loading a conversation
 *
 * @example
 * ```tsx
 * const { mutate: loadConversation, isPending } = useLoadConversation();
 *
 * const handleLoad = (id: string) => {
 *   loadConversation({ id });
 * };
 * ```
 */
export function useLoadConversation(): MutationResult<boolean, LoadConversationVariables, Error> {
    const loadConversation = useConversationStore((state) => state.loadConversation);
    const hydrateConversation = useChatStore((state) => state.hydrateConversation);

    return useMutation<boolean, LoadConversationVariables, Error>({
        mutationFn: async (variables) => {
            const success = await loadConversation(variables.id);
            return success;
        },
        onSuccess: (success, variables) => {
            if (success) {
                // Hydrate chat store with loaded conversation
                const conversation = useConversationStore.getState().currentConversation;
                if (conversation) {
                    hydrateConversation({
                        messages: conversation.messages,
                        sessionId: conversation.summary.sessionId,
                    });
                }
                console.log("[useLoadConversation] Loaded:", variables.id);
            }
        },
        onError: (error) => {
            console.error("[useLoadConversation] Failed to load:", error);
        },
    });
}

// ============================================================================
// useImportConversation
// ============================================================================

/**
 * Mutation hook for importing a conversation from JSON
 *
 * @example
 * ```tsx
 * const { mutate: importConversation } = useImportConversation();
 *
 * const handleImport = (jsonString: string) => {
 *   importConversation({ json: jsonString });
 * };
 * ```
 */
export function useImportConversation(): MutationResult<
    string | null,
    ImportConversationVariables,
    Error
> {
    const importConversation = useConversationStore((state) => state.importConversation);

    return useMutation<string | null, ImportConversationVariables, Error>({
        mutationFn: async (variables) => {
            const id = importConversation(variables.json);
            if (!id) {
                throw new Error("Failed to import conversation: invalid JSON");
            }
            return id;
        },
        onSuccess: (id) => {
            console.log("[useImportConversation] Imported:", id);
        },
        onError: (error) => {
            console.error("[useImportConversation] Import failed:", error);
        },
    });
}

// ============================================================================
// useExportConversation
// ============================================================================

interface ExportConversationVariables {
    id: string;
}

/**
 * Mutation hook for exporting a conversation to JSON
 *
 * @example
 * ```tsx
 * const { mutate: exportConversation } = useExportConversation();
 *
 * const handleExport = (id: string) => {
 *   exportConversation({ id }, {
 *     onSuccess: (json) => {
 *       downloadFile(json, `conversation-${id}.json`);
 *     },
 *   });
 * };
 * ```
 */
export function useExportConversation(): MutationResult<
    string,
    ExportConversationVariables,
    Error
> {
    const exportConversation = useConversationStore((state) => state.exportConversation);

    return useMutation<string, ExportConversationVariables, Error>({
        mutationFn: async (variables) => {
            const json = exportConversation(variables.id);
            if (!json) {
                throw new Error("Conversation not found");
            }
            return json;
        },
        onSuccess: () => {
            console.log("[useExportConversation] Exported successfully");
        },
        onError: (error) => {
            console.error("[useExportConversation] Export failed:", error);
        },
    });
}

// ============================================================================
// useUpdateConversationTitle
// ============================================================================

interface UpdateTitleVariables {
    id: string;
    title: string;
}

/**
 * Mutation hook for updating conversation title
 *
 * @example
 * ```tsx
 * const { mutate: updateTitle } = useUpdateConversationTitle();
 *
 * updateTitle({ id: "conv-123", title: "New Title" });
 * ```
 */
export function useUpdateConversationTitle(): MutationResult<void, UpdateTitleVariables, Error> {
    const updateTitle = useConversationStore((state) => state.updateTitle);
    const conversations = useConversationStore((state) => state.conversations);

    return useOptimisticMutation<void, UpdateTitleVariables, ConversationSummary[]>({
        mutationFn: async () => {},
        getSnapshot: () => [...conversations],
        optimisticUpdate: (variables) => {
            updateTitle(variables.id, variables.title);
        },
        rollback: (previousConversations) => {
            useConversationStore.setState({ conversations: previousConversations });
        },
    });
}

// ============================================================================
// useAddConversationTag
// ============================================================================

interface AddTagVariables {
    id: string;
    tag: string;
}

/**
 * Mutation hook for adding a tag to a conversation
 *
 * @example
 * ```tsx
 * const { mutate: addTag } = useAddConversationTag();
 *
 * addTag({ id: "conv-123", tag: "important" });
 * ```
 */
export function useAddConversationTag(): MutationResult<void, AddTagVariables, Error> {
    const addTag = useConversationStore((state) => state.addTag);
    const conversations = useConversationStore((state) => state.conversations);

    return useOptimisticMutation<void, AddTagVariables, ConversationSummary[]>({
        mutationFn: async () => {},
        getSnapshot: () => [...conversations],
        optimisticUpdate: (variables) => {
            addTag(variables.id, variables.tag);
        },
        rollback: (previousConversations) => {
            useConversationStore.setState({ conversations: previousConversations });
        },
    });
}

// ============================================================================
// useRemoveConversationTag
// ============================================================================

interface RemoveTagVariables {
    id: string;
    tag: string;
}

/**
 * Mutation hook for removing a tag from a conversation
 *
 * @example
 * ```tsx
 * const { mutate: removeTag } = useRemoveConversationTag();
 *
 * removeTag({ id: "conv-123", tag: "important" });
 * ```
 */
export function useRemoveConversationTag(): MutationResult<void, RemoveTagVariables, Error> {
    const removeTag = useConversationStore((state) => state.removeTag);
    const conversations = useConversationStore((state) => state.conversations);

    return useOptimisticMutation<void, RemoveTagVariables, ConversationSummary[]>({
        mutationFn: async () => {},
        getSnapshot: () => [...conversations],
        optimisticUpdate: (variables) => {
            removeTag(variables.id, variables.tag);
        },
        rollback: (previousConversations) => {
            useConversationStore.setState({ conversations: previousConversations });
        },
    });
}
