/**
 * UI Store
 *
 * Manages UI state including modals, sidebar, connection status,
 * draft messages, and notifications.
 *
 * @module stores/uiStore
 */

import { create } from "zustand";
import { idGenerators } from "../../shared/utils";
import { NOTIFICATION_CONFIG } from "../../shared/constants";

// ============================================================================
// Types
// ============================================================================

/**
 * Modal types that can be displayed
 */
export type ModalType =
    | "settings"
    | "mcp"
    | "model"
    | "permission"
    | "install"
    | "login"
    | "confirm"
    | "error"
    | "about"
    | "export"
    | "keyboard-shortcuts"
    | "usage"
    | null;

/**
 * Connection status to the Claude CLI
 */
export type ConnectionStatus =
    | "disconnected"
    | "connecting"
    | "connected"
    | "error"
    | "reconnecting";

/**
 * Notification item
 */
export interface Notification {
    /** Unique notification ID */
    id: string;
    /** Notification type */
    type: "info" | "success" | "warning" | "error";
    /** Notification title */
    title: string;
    /** Optional notification message */
    message?: string;
    /** Auto-dismiss timeout in ms (0 = no auto-dismiss) */
    timeout: number;
    /** Timestamp when created */
    createdAt: number;
    /** Optional action buttons */
    actions?: NotificationAction[];
}

/**
 * Notification action button
 */
export interface NotificationAction {
    /** Action label */
    label: string;
    /** Action identifier */
    action: string;
    /** Whether this is the primary action */
    primary?: boolean;
}

/**
 * UI store state
 */
export interface UIState {
    /** Currently active modal */
    activeModal: ModalType;
    /** Modal props (varies by modal type) */
    modalProps: Record<string, unknown>;
    /** Whether sidebar is open */
    sidebarOpen: boolean;
    /** Sidebar width in pixels */
    sidebarWidth: number;
    /** Connection status to Claude CLI */
    connectionStatus: ConnectionStatus;
    /** Connection error message if any */
    connectionError: string | null;
    /** Draft message being composed */
    draftMessage: string;
    /** Active notifications */
    notifications: Notification[];
    /** Maximum visible notifications */
    maxVisibleNotifications: number;
    /** Whether the input is focused */
    inputFocused: boolean;
    /** Whether in fullscreen mode */
    isFullscreen: boolean;
    /** Current layout breakpoint */
    breakpoint: "xs" | "sm" | "md" | "lg" | "xl";
}

/**
 * UI store actions
 */
export interface UIActions {
    /** Open a modal */
    openModal: (type: Exclude<ModalType, null>, props?: Record<string, unknown>) => void;
    /** Close the current modal */
    closeModal: () => void;
    /** Toggle sidebar visibility */
    toggleSidebar: () => void;
    /** Set sidebar open state */
    setSidebarOpen: (open: boolean) => void;
    /** Set sidebar width */
    setSidebarWidth: (width: number) => void;
    /** Set connection status */
    setConnectionStatus: (status: ConnectionStatus, error?: string) => void;
    /** Set draft message */
    setDraftMessage: (message: string) => void;
    /** Clear draft message */
    clearDraftMessage: () => void;
    /** Add a notification */
    addNotification: (notification: Omit<Notification, "id" | "createdAt">) => string;
    /** Remove a notification by ID */
    removeNotification: (id: string) => void;
    /** Clear all notifications */
    clearNotifications: () => void;
    /** Set input focused state */
    setInputFocused: (focused: boolean) => void;
    /** Toggle fullscreen mode */
    toggleFullscreen: () => void;
    /** Set breakpoint */
    setBreakpoint: (breakpoint: UIState["breakpoint"]) => void;
    /** Show info notification */
    showInfo: (title: string, message?: string) => void;
    /** Show success notification */
    showSuccess: (title: string, message?: string) => void;
    /** Show warning notification */
    showWarning: (title: string, message?: string) => void;
    /** Show error notification */
    showError: (title: string, message?: string) => void;
}

export type UIStore = UIState & UIActions;

// ============================================================================
// Initial State
// ============================================================================

const initialState: UIState = {
    activeModal: null,
    modalProps: {},
    sidebarOpen: true,
    sidebarWidth: 280,
    connectionStatus: "disconnected",
    connectionError: null,
    draftMessage: "",
    notifications: [],
    maxVisibleNotifications: 5,
    inputFocused: false,
    isFullscreen: false,
    breakpoint: "lg",
};

// ============================================================================
// Helpers
// ============================================================================

/** Generate a unique ID for notifications - uses shared ID generator */
const generateNotificationId = idGenerators.notification;

// ============================================================================
// Store
// ============================================================================

/**
 * UI store for managing interface state
 */
export const useUIStore = create<UIStore>((set, get) => ({
    ...initialState,

    openModal: (type, props = {}) =>
        set({
            activeModal: type,
            modalProps: props,
        }),

    closeModal: () =>
        set({
            activeModal: null,
            modalProps: {},
        }),

    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

    setSidebarOpen: (open) => set({ sidebarOpen: open }),

    setSidebarWidth: (width) => set({ sidebarWidth: Math.max(200, Math.min(500, width)) }),

    setConnectionStatus: (status, error) =>
        set({
            connectionStatus: status,
            connectionError: error || null,
        }),

    setDraftMessage: (message) => set({ draftMessage: message }),

    clearDraftMessage: () => set({ draftMessage: "" }),

    addNotification: (notification) => {
        const id = generateNotificationId();
        const newNotification: Notification = {
            ...notification,
            id,
            createdAt: Date.now(),
        };

        set((state) => {
            const notifications = [...state.notifications, newNotification];
            // Keep only the most recent notifications
            if (notifications.length > state.maxVisibleNotifications) {
                return {
                    notifications: notifications.slice(-state.maxVisibleNotifications),
                };
            }
            return { notifications };
        });

        // Auto-dismiss if timeout is set
        if (notification.timeout > 0) {
            setTimeout(() => {
                get().removeNotification(id);
            }, notification.timeout);
        }

        return id;
    },

    removeNotification: (id) =>
        set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
        })),

    clearNotifications: () => set({ notifications: [] }),

    setInputFocused: (focused) => set({ inputFocused: focused }),

    toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),

    setBreakpoint: (breakpoint) => set({ breakpoint }),

    showInfo: (title, message) => {
        get().addNotification({
            type: "info",
            title,
            message,
            timeout: NOTIFICATION_CONFIG.INFO_TIMEOUT,
        });
    },

    showSuccess: (title, message) => {
        get().addNotification({
            type: "success",
            title,
            message,
            timeout: NOTIFICATION_CONFIG.SUCCESS_TIMEOUT,
        });
    },

    showWarning: (title, message) => {
        get().addNotification({
            type: "warning",
            title,
            message,
            timeout: NOTIFICATION_CONFIG.WARNING_TIMEOUT,
        });
    },

    showError: (title, message) => {
        get().addNotification({
            type: "error",
            title,
            message,
            timeout: NOTIFICATION_CONFIG.ERROR_TIMEOUT,
        });
    },
}));

// ============================================================================
// Selectors
// ============================================================================

/**
 * Select active modal
 */
export const selectActiveModal = (state: UIStore) => state.activeModal;

/**
 * Select modal props
 */
export const selectModalProps = (state: UIStore) => state.modalProps;

/**
 * Select sidebar state
 */
export const selectSidebarState = (state: UIStore) => ({
    open: state.sidebarOpen,
    width: state.sidebarWidth,
});

/**
 * Select connection status
 */
export const selectConnectionStatus = (state: UIStore) => ({
    status: state.connectionStatus,
    error: state.connectionError,
});

/**
 * Select draft message
 */
export const selectDraftMessage = (state: UIStore) => state.draftMessage;

/**
 * Select notifications
 */
export const selectNotifications = (state: UIStore) => state.notifications;

/**
 * Select whether a modal is open
 */
export const selectIsModalOpen = (state: UIStore) => state.activeModal !== null;

/**
 * Select whether connected
 */
export const selectIsConnected = (state: UIStore) => state.connectionStatus === "connected";
