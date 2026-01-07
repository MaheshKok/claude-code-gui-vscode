/**
 * Webview Message Handler Types
 *
 * Type definitions for webview message handling system.
 * Provides strongly-typed message handlers to replace the large switch statement.
 *
 * @module webview/handlers/types
 */

import * as vscode from "vscode";
import { ClaudeService } from "../../services/ClaudeService";
import { ConversationService } from "../../services/ConversationService";
import { PermissionService } from "../../services/PermissionService";
import { MCPService } from "../../services/MCPService";
import { UsageService } from "../../services/UsageService";

// ============================================================================
// Message Types
// ============================================================================

/**
 * Base webview message interface
 */
export interface WebviewMessage {
    type: string;
    [key: string]: unknown;
}

/**
 * Context provided to message handlers
 */
export interface MessageHandlerContext {
    // Services
    claudeService: ClaudeService;
    conversationService: ConversationService;
    permissionService: PermissionService;
    mcpService: MCPService;
    usageService: UsageService;

    // Extension context
    extensionContext: vscode.ExtensionContext;

    // Methods for posting messages to webview
    postMessage: (message: unknown) => void;
    sendAndSaveMessage: (message: unknown) => void;

    // State accessors
    getState: () => PanelState;
    setState: (updates: Partial<PanelState>) => void;

    // Settings
    sendCurrentSettings: () => void;
    updateSettings: (settings: Record<string, unknown>) => Promise<void>;

    // Session management
    newSession: () => Promise<void>;
    loadConversation: (filename: string) => void;

    // Other utilities
    openFileInEditor: (
        filePath: string,
        line?: number,
        column?: number,
        preview?: boolean,
    ) => Promise<void>;
    openDiffEditor: (oldContent: string, newContent: string, filePath: string) => Promise<void>;
    openMarkdownPreview: (content: string, title?: string) => Promise<void>;
    sendConversationList: () => void;
    sendPermissions: () => Promise<void>;
    loadMCPServers: () => Promise<void>;
    enableYoloMode: () => Promise<void>;
    getClipboardText: () => Promise<void>;
    setSelectedModel: (model: string) => void;

    // Usage tracking
    refreshUsage: () => Promise<void>;

    // Conversation saving (for saving interrupted conversations)
    saveConversation: () => Promise<void>;
}

/**
 * Panel state that can be accessed/modified by handlers
 */
export interface PanelState {
    totalCost: number;
    totalTokensInput: number;
    totalTokensOutput: number;
    totalCacheReadTokens: number;
    totalCacheCreationTokens: number;
    requestCount: number;
    isProcessing: boolean;
    hasOpenOutput: boolean;
    draftMessage: string;
    selectedModel: string;
    subscriptionType: string | undefined;
    accountInfoFetchedThisSession: boolean;
}

/**
 * Message handler function type
 */
export type MessageHandler = (
    message: WebviewMessage,
    context: MessageHandlerContext,
) => Promise<void> | void;

/**
 * Map of message types to their handlers
 */
export type MessageHandlerMap = Record<string, MessageHandler>;
