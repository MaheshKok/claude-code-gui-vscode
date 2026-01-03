/**
 * Webview Handlers Module
 *
 * Exports message handler functions and types for webview communication.
 *
 * @module webview/handlers
 */

export type {
    WebviewMessage,
    MessageHandlerContext,
    MessageHandler,
    MessageHandlerMap,
    PanelState,
} from "./types";

export { messageHandlers, handleWebviewMessage } from "./messageHandlers";
