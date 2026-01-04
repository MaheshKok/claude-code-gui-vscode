/**
 * Custom React Hooks for Claude Code GUI
 *
 * This module exports all custom hooks used by the webview UI
 * for VSCode integration, message handling, and UI interactions.
 *
 * @module hooks
 */

// ============================================================================
// VSCode Integration
// ============================================================================

export {
    useVSCode,
    isInVSCode,
    getVSCode,
    postMessageToExtension,
    type UseVSCodeReturn,
} from "./useVSCode";

// ============================================================================
// Message Handling
// ============================================================================

export {
    useMessages,
    createMessageHandlers,
    createStreamingHandler,
    createBatchedHandler,
    type UseMessagesOptions,
    type UseMessagesReturn,
} from "./useMessages";

// ============================================================================
// Auto-Scroll
// ============================================================================

export {
    useAutoScroll,
    scrollElementToBottom,
    isElementAtBottom,
    type UseAutoScrollOptions,
    type UseAutoScrollReturn,
} from "./useAutoScroll";

// ============================================================================
// Auto-Resize Textarea
// ============================================================================

export {
    useAutoResize,
    calculateTextareaHeight,
    createMeasureElement,
    type UseAutoResizeOptions,
    type UseAutoResizeReturn,
} from "./useAutoResize";

// ============================================================================
// Keyboard Shortcuts
// ============================================================================

export {
    useKeyboard,
    useChatKeyboard,
    formatShortcut,
    type KeyModifiers,
    type KeyboardShortcut,
    type UseKeyboardOptions,
    type UseKeyboardReturn,
    type UseChatKeyboardOptions,
} from "./useKeyboard";

// ============================================================================
// Clipboard Operations
// ============================================================================

export {
    useClipboard,
    copyToClipboard,
    isClipboardApiAvailable,
    type ClipboardItemType,
    type ClipboardContent,
    type PasteEventData,
    type UseClipboardOptions,
    type UseClipboardReturn,
} from "./useClipboard";

// ============================================================================
// File Picker
// ============================================================================

export {
    useFilePicker,
    getFileIcon,
    formatFileSize,
    type FilePickerItem,
    type FilePickerCategory,
    type UseFilePickerOptions,
    type UseFilePickerReturn,
} from "./useFilePicker";

// ============================================================================
// Permission Handling
// ============================================================================

export {
    usePermissions,
    getDecisionDisplayName,
    getDecisionStyleClass,
    formatPermissionRequest,
    matchesPattern,
    type ToolPermissionConfig,
    type UsePermissionsOptions,
    type UsePermissionsReturn,
} from "./usePermissions";

// ============================================================================
// Theme Detection
// ============================================================================

export {
    useTheme,
    getAllVSCodeCssVariables,
    createCssVariables,
    type ThemeMode,
    type ThemeKind,
    type ThemeColors,
    type UseThemeOptions,
    type UseThemeReturn,
} from "./useTheme";

export {
    useAppState,
    type ChatStoreState,
    type ChatStoreActions,
    type SettingsStoreState,
    type SettingsStoreActions,
    type UIStoreState,
    type UIStoreActions,
    type PermissionStoreSlice,
    type LocalState,
    type UseAppStateReturn,
} from "./useAppState";

export {
    useAppCallbacks,
    type AppCallbackDeps,
    type UseAppCallbacksReturn,
} from "./useAppCallbacks";

export {
    useMessageHandlers,
    type MessageHandlerDeps,
    type UseMessageHandlersReturn,
} from "./useMessageHandlers";
