/**
 * Mutations Module
 *
 * Exports all mutation hooks and types for data operations
 * with optimistic updates, error handling, and state management.
 *
 * @module mutations
 */

// Core mutation hook
export { useMutation, useOptimisticMutation } from "./useMutation";

// Chat mutations
export {
    useSendMessage,
    useUpdateMessage,
    useDeleteMessage,
    useClearChat,
    useResetChat,
} from "./useChatMutations";

// Conversation mutations
export {
    useSaveConversation,
    useUpdateConversation,
    useDeleteConversation,
    useLoadConversation,
    useImportConversation,
    useExportConversation,
    useUpdateConversationTitle,
    useAddConversationTag,
    useRemoveConversationTag,
} from "./useConversationMutations";

// Settings mutations
export {
    useUpdateModel,
    useUpdateThinking,
    useUpdateWSL,
    useUpdateUISettings,
    useUpdateContextSettings,
    useResetSettings,
    useTogglePlanMode,
    useToggleYoloMode,
} from "./useSettingsMutations";

// Permission mutations
export {
    useGrantPermission,
    useDenyPermission,
    useBatchApprovePermissions,
    useClearPermissions,
} from "./usePermissionMutations";

// MCP mutations
export {
    useConnectMCPServer,
    useDisconnectMCPServer,
    useRefreshMCPServer,
    useUpdateMCPConfig,
} from "./useMCPMutations";

// Types
export type {
    MutationStatus,
    MutationState,
    MutationOptions,
    MutationResult,
    OptimisticContext,
    OptimisticMutationOptions,
    MutationResponse,
    BatchMutationResponse,
    // Specific mutation variables
    SendMessageVariables,
    UpdateMessageVariables,
    DeleteMessageVariables,
    SaveConversationVariables,
    UpdateConversationVariables,
    DeleteConversationVariables,
    ImportConversationVariables,
    UpdateModelVariables,
    UpdateThinkingVariables,
    UpdateWSLVariables,
    GrantPermissionVariables,
    DenyPermissionVariables,
    BatchApproveVariables,
} from "./types";
