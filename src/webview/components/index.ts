/**
 * Components Module
 *
 * Central export barrel for all UI components in the Claude Code GUI.
 * This module provides organized access to all component categories.
 *
 * @module components
 */

// ============================================================================
// Root Application Component
// ============================================================================

export { App } from "./App";
export { default as AppDefault } from "./App";
export type { Message as MessageType, SessionInfo, AppState } from "./App";

// ============================================================================
// Header Components
// ============================================================================

export { Header } from "./Header";
export type { HeaderProps } from "./Header";

// ============================================================================
// Chat Components
// ============================================================================

export { ChatContainer, MessageList, Message, MessageInput, JourneyTimeline } from "./Chat";

// ============================================================================
// Activity Components
// ============================================================================

export { ActivityTimeline } from "./Activity";
export type { ActivityTimelineProps } from "./Activity";

// ============================================================================
// Status Components
// ============================================================================

export { StatusBar } from "./Status";
export type { StatusBarProps } from "./Status";

// ============================================================================
// Common/Shared Components
// ============================================================================

export {
    ErrorBoundary,
    withErrorBoundary,
    WSLAlert,
    CodeBlock,
    StatusBadge,
    CollapsibleSection,
} from "./Common";

export type {
    CodeBlockProps,
    StatusBadgeProps,
    StatusVariant,
    CollapsibleSectionProps,
} from "./Common";

// ============================================================================
// Tool Components
// ============================================================================

export { ToolUseCard, ToolResultCard, DiffViewer, TodoDisplay } from "./Tools";

export type {
    ToolUseCardProps,
    ToolInput,
    ToolResultCardProps,
    DiffViewerProps,
    DiffLine,
    TodoDisplayProps,
    TodoItem,
    TodoStatus,
} from "./Tools";

// ============================================================================
// Modal Components
// ============================================================================

export {
    Modal,
    PermissionModal,
    MCPModal,
    ModelSelectorModal,
    FilePickerModal,
    ThinkingIntensityModal,
    InstallModal,
} from "./Modals";

export type {
    ModalProps,
    PermissionModalProps,
    PermissionRequest,
    MCPModalProps,
    MCPServer,
    MCPServerType,
    PopularServer,
    ModelSelectorModalProps,
    ModelOption,
    ModelInfo,
    FilePickerModalProps,
    FileItem,
    ThinkingIntensityModalProps,
    ThinkingLevel,
    ThinkingLevelInfo,
    InstallModalProps,
    InstallState,
} from "./Modals";

// ============================================================================
// History Components
// ============================================================================

export { ConversationHistory, ConversationItem, ConversationSearch, HistoryView } from "./History";

export type {
    ConversationHistoryProps,
    ConversationItemProps,
    ConversationSearchProps,
} from "./History";
