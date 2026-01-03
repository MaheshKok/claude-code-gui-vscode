/**
 * Webview Module Exports
 *
 * Exports all webview-related classes and utilities.
 *
 * @module webview
 */

// Main panel provider
export { PanelProvider } from "./PanelProvider";

// Session state management
export {
    SessionStateManager,
    type SessionState,
    type ToolUseMetric,
    type TokenUsageUpdate,
} from "./SessionStateManager";

// Settings management
export { SettingsManager, getSettingsManager, type WebviewSettings } from "./SettingsManager";

// Claude message processing
export {
    ClaudeMessageProcessor,
    type MessagePoster,
    type ProcessorCallbacks,
} from "./ClaudeMessageProcessor";

// HTML generation
export { getHtml } from "./html";

// Message handlers
export {
    handleWebviewMessage,
    type MessageHandlerContext,
    type PanelState,
    type WebviewMessage,
} from "./handlers";
