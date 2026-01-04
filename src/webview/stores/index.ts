/**
 * Store Exports
 *
 * Central barrel file for all Zustand stores.
 * Provides a unified API for accessing state management.
 *
 * @module stores
 */

// Import stores for internal use in utility functions
import { useChatStore as _useChatStore } from "./chatStore";
import { useSettingsStore as _useSettingsStore } from "./settingsStore";
import { useUIStore as _useUIStore } from "./uiStore";
import { usePermissionStore as _usePermissionStore } from "./permissionStore";
import { useConversationStore as _useConversationStore } from "./conversationStore";
import { useMCPStore as _useMCPStore } from "./mcpStore";
import { useUsageStore as _useUsageStore } from "./usageStore";

// ============================================================================
// Chat Store
// ============================================================================
export {
    useChatStore,
    selectMessages,
    selectIsProcessing,
    selectSessionId,
    selectTodos,
    selectTokens,
    selectCosts,
    selectMessageById,
    selectLastMessage,
    selectMessagesByType,
} from "./chatStore";
export type { ChatState, ChatActions, ChatStore, TokenTracking, CostTracking } from "./chatStore";

// ============================================================================
// Settings Store
// ============================================================================
export {
    useSettingsStore,
    selectWSL,
    selectSelectedModel,
    selectThinkingSettings,
    selectPlanMode,
    selectYoloMode,
    selectUISettings,
    selectContextSettings,
} from "./settingsStore";
export type {
    SettingsState,
    SettingsActions,
    SettingsStore,
    WSLConfig,
    ThinkingIntensity,
    ClaudeModel,
} from "./settingsStore";

// ============================================================================
// UI Store
// ============================================================================
export {
    useUIStore,
    selectActiveModal,
    selectModalProps,
    selectSidebarState,
    selectConnectionStatus,
    selectDraftMessage,
    selectNotifications,
    selectIsModalOpen,
    selectIsConnected,
} from "./uiStore";
export type {
    UIState,
    UIActions,
    UIStore,
    ModalType,
    ConnectionStatus,
    Notification,
    NotificationAction,
} from "./uiStore";

// ============================================================================
// Permission Store
// ============================================================================
export {
    usePermissionStore,
    selectPendingPermissions,
    selectAllowedPermissions,
    selectDeniedPatterns,
    selectPendingCount,
    selectFirstPending,
    selectPermissionsForTool,
} from "./permissionStore";
export type {
    PermissionState,
    PermissionActions,
    PermissionStore,
    AllowedPermission,
} from "./permissionStore";

// ============================================================================
// Conversation Store
// ============================================================================
export {
    useConversationStore,
    selectConversations,
    selectCurrentConversation,
    selectIsLoading,
    selectConversationCount,
    selectConversationById,
    selectConversationsByTag,
} from "./conversationStore";
export type {
    ConversationState,
    ConversationActions,
    ConversationStore,
    ConversationSummary,
    Conversation,
} from "./conversationStore";

// ============================================================================
// MCP Store
// ============================================================================
export {
    useMCPStore,
    selectServers,
    selectEnabledServers,
    selectConnectedServers,
    selectSelectedServer,
    selectServerById,
    selectAllTools,
    selectServerCount,
    selectServersWithErrors,
} from "./mcpStore";
export type {
    MCPState,
    MCPActions,
    MCPStore,
    MCPServerConfig,
    MCPServerState,
    MCPServerStatus,
} from "./mcpStore";

// ============================================================================
// Usage Store
// ============================================================================
export { useUsageStore } from "./usageStore";

// ============================================================================
// Combined Store Hook
// ============================================================================

/**
 * Combined store hook for accessing all stores at once
 * Useful for components that need data from multiple stores
 */
export const useStores = () => {
    const chat = _useChatStore();
    const settings = _useSettingsStore();
    const ui = _useUIStore();
    const permission = _usePermissionStore();
    const conversation = _useConversationStore();
    const mcp = _useMCPStore();
    const usage = _useUsageStore();

    return {
        chat,
        settings,
        ui,
        permission,
        conversation,
        mcp,
        usage,
    };
};

/**
 * Get all stores in a non-reactive way (for use outside React components)
 */
export const getStores = () => ({
    chat: _useChatStore.getState(),
    settings: _useSettingsStore.getState(),
    ui: _useUIStore.getState(),
    permission: _usePermissionStore.getState(),
    conversation: _useConversationStore.getState(),
    mcp: _useMCPStore.getState(),
    usage: _useUsageStore.getState(),
});

/**
 * Subscribe to all store changes
 */
export const subscribeToStores = (listener: () => void) => {
    const unsubscribes = [
        _useChatStore.subscribe(listener),
        _useSettingsStore.subscribe(listener),
        _useUIStore.subscribe(listener),
        _usePermissionStore.subscribe(listener),
        _useConversationStore.subscribe(listener),
        _useMCPStore.subscribe(listener),
    ];

    return () => {
        unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
};

// ============================================================================
// Store Reset Utilities
// ============================================================================

/**
 * Reset all stores to their initial state
 * Useful for testing or clearing all data
 */
export const resetAllStores = () => {
    _useChatStore.getState().resetChat();
    _useSettingsStore.getState().resetToDefaults();
    _useUIStore.getState().closeModal();
    _useUIStore.getState().clearNotifications();
    _usePermissionStore.getState().clearPending();
    _usePermissionStore.getState().clearAllowed();
    _useConversationStore.getState().clearCurrentConversation();
    _useMCPStore.getState().resetAllServers();
};

/**
 * Reset session-specific state (keeps persistent settings)
 * Useful when starting a new session
 */
export const resetSessionState = () => {
    _useChatStore.getState().resetChat();
    _useChatStore.getState().resetTokenTracking();
    _usePermissionStore.getState().clearPending();
    _usePermissionStore.getState().clearSessionPermissions();
    _useUIStore.getState().setConnectionStatus("disconnected");
    _useUIStore.getState().clearDraftMessage();
};
