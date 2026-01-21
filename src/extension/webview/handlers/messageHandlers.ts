/**
 * Webview Message Handlers
 *
 * Message handler implementations for webview communication.
 * Each handler function handles a specific message type from the webview.
 *
 * @module webview/handlers/messageHandlers
 */

import * as vscode from "vscode";
import * as path from "path";
import type { WebviewMessage, MessageHandlerContext, MessageHandlerMap } from "./types";

// ============================================================================
// Session Handlers
// ============================================================================

const handleSendMessage = async (
    message: WebviewMessage,
    context: MessageHandlerContext,
): Promise<void> => {
    const text = (message.message ?? message.text) as string | undefined;
    if (!text) {
        console.log("[MessageHandler] Empty message, returning");
        return;
    }

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const cwd = workspaceFolder ? workspaceFolder.uri.fsPath : process.cwd();

    // Build message with thinking mode prefix if enabled
    let actualMessage = text;
    const thinkingMode = message.thinkingMode as boolean | undefined;
    if (thinkingMode) {
        const config = vscode.workspace.getConfiguration("claudeCodeGui");
        const intensity = config.get<string>("thinking.intensity", "think");
        const thinkingPrefix = getThinkingPrefix(intensity);
        actualMessage = thinkingPrefix + " THROUGH THIS STEP BY STEP: \n" + text;
    }

    const state = context.getState();
    context.setState({
        isProcessing: true,
        draftMessage: "",
        hasOpenOutput: false,
    });

    // Save user input in conversation history
    context.sendAndSaveMessage({ type: "userInput", data: text });

    // Set processing state
    context.postMessage({ type: "setProcessing", isProcessing: true });
    context.postMessage({ type: "loading", message: "Claude is working..." });

    // Get configuration
    const config = vscode.workspace.getConfiguration("claudeCodeGui");
    const yoloMode = config.get<boolean>("permissions.yoloMode", false);
    const planMode = message.planMode as boolean | undefined;

    console.log("[MessageHandler] Sending message with options:", {
        planMode,
        yoloMode,
        model: state.selectedModel || undefined,
    });

    // Send message to Claude
    await context.claudeService.sendMessage(actualMessage, {
        cwd,
        planMode,
        yoloMode,
        model: state.selectedModel || undefined,
        mcpConfigPath: context.mcpService.getConfigPath(),
    });
};

const handleNewSession = async (
    _message: WebviewMessage,
    context: MessageHandlerContext,
): Promise<void> => {
    await context.newSession();
};

const handleStopGeneration = async (
    _message: WebviewMessage,
    context: MessageHandlerContext,
): Promise<void> => {
    // Save the conversation before stopping (so interrupted conversations are preserved)
    await context.saveConversation();
    await context.claudeService.stopProcess();
};

const handleClearConversation = async (
    _message: WebviewMessage,
    context: MessageHandlerContext,
): Promise<void> => {
    await context.newSession();
};

// ============================================================================
// Conversation Handlers
// ============================================================================

const handleGetConversationList = (
    _message: WebviewMessage,
    context: MessageHandlerContext,
): void => {
    context.sendConversationList();
};

const handleLoadConversation = (message: WebviewMessage, context: MessageHandlerContext): void => {
    const filename = message.filename as string | undefined;
    if (filename) {
        context.loadConversation(filename);
    }
};

const handleDeleteConversation = async (
    message: WebviewMessage,
    context: MessageHandlerContext,
): Promise<void> => {
    const filename = message.filename as string | undefined;
    if (filename) {
        const deleted = await context.conversationService.deleteConversation(filename);
        if (deleted) {
            context.postMessage({
                type: "conversationDeleted",
                filename,
            });
            context.sendConversationList();
        }
    }
};

// ============================================================================
// Settings Handlers
// ============================================================================

const handleGetSettings = (_message: WebviewMessage, context: MessageHandlerContext): void => {
    context.sendCurrentSettings();
};

const handleRequestState = (_message: WebviewMessage, context: MessageHandlerContext): void => {
    const state = context.getState();
    const currentMessages = context.conversationService.getCurrentConversation();

    let restoreState: Record<string, unknown> | undefined;
    if (currentMessages.length > 0) {
        restoreState = {
            messages: currentMessages,
            sessionId: context.claudeService.sessionId ?? null,
            totalCost: state.totalCost,
            totalTokens: {
                input: state.totalTokensInput,
                output: state.totalTokensOutput,
            },
            isProcessing: state.isProcessing,
        };
    }

    context.postMessage({
        type: "restoreState",
        state: restoreState,
    });

    const usageData = context.usageService.currentUsage;
    if (usageData) {
        context.postMessage({
            type: "usageData",
            data: usageData,
        });
    } else {
        const usageError = context.usageService.lastError;
        if (usageError) {
            context.postMessage({
                type: "usageError",
                error: usageError,
            });
        }
    }
};

const handleSaveState = async (
    message: WebviewMessage,
    context: MessageHandlerContext,
): Promise<void> => {
    await context.extensionContext.workspaceState.update("claude.webviewState", message.state);
};

const handleSaveSettings = async (
    message: WebviewMessage,
    context: MessageHandlerContext,
): Promise<void> => {
    const settings = message.settings as Record<string, unknown> | undefined;
    if (settings) {
        await context.updateSettings(settings);
    }
};

const handleSelectModel = (message: WebviewMessage, context: MessageHandlerContext): void => {
    const model = message.model as string | undefined;
    if (model) {
        context.setSelectedModel(model);
    }
};

// ============================================================================
// File Handlers
// ============================================================================

const handleOpenFile = async (
    message: WebviewMessage,
    context: MessageHandlerContext,
): Promise<void> => {
    await context.openFileInEditor(
        message.filePath as string,
        message.line as number | undefined,
        message.column as number | undefined,
        message.preview as boolean | undefined,
    );
};

const handleOpenDiff = async (
    message: WebviewMessage,
    context: MessageHandlerContext,
): Promise<void> => {
    await context.openDiffEditor(
        message.oldContent as string,
        message.newContent as string,
        message.filePath as string,
    );
};

const handleOpenMarkdownPreview = async (
    message: WebviewMessage,
    context: MessageHandlerContext,
): Promise<void> => {
    const content = message.content as string | undefined;
    if (!content) {
        return;
    }
    const title = typeof message.title === "string" ? message.title : undefined;
    await context.openMarkdownPreview(content, title);
};

// ============================================================================
// Permission Handlers
// ============================================================================

const handlePermissionResponse = async (
    message: WebviewMessage,
    context: MessageHandlerContext,
): Promise<void> => {
    const requestId = (message.requestId ?? message.id) as string | undefined;
    const decision =
        (message.decision as string) ??
        (message.approved ? (message.alwaysAllow ? "allow_always" : "allow") : "deny");
    const approved = decision !== "deny";
    const alwaysAllow = decision === "allow_always";

    const pendingRequest = requestId
        ? context.claudeService.getPendingPermissionRequest(requestId)
        : undefined;

    if (requestId) {
        context.claudeService.sendPermissionResponse(requestId, approved, alwaysAllow);
    }

    if (alwaysAllow && pendingRequest) {
        await context.permissionService.savePermission(
            pendingRequest.toolName,
            pendingRequest.input,
        );
    }
};

const handleGetPermissions = async (
    _message: WebviewMessage,
    context: MessageHandlerContext,
): Promise<void> => {
    await context.sendPermissions();
};

const handleRemovePermission = async (
    message: WebviewMessage,
    context: MessageHandlerContext,
): Promise<void> => {
    await context.permissionService.removePermission(
        message.toolName as string,
        message.command as string,
    );
    await context.sendPermissions();
};

const handleAddPermission = async (
    message: WebviewMessage,
    context: MessageHandlerContext,
): Promise<void> => {
    await context.permissionService.addPermission(
        message.toolName as string,
        message.command as string,
    );
    await context.sendPermissions();
};

// ============================================================================
// MCP Handlers
// ============================================================================

const handleLoadMCPServers = async (
    _message: WebviewMessage,
    context: MessageHandlerContext,
): Promise<void> => {
    await context.loadMCPServers();
};

const handleSaveMCPServer = async (
    message: WebviewMessage,
    context: MessageHandlerContext,
): Promise<void> => {
    const config = message.config as
        | {
              type?: "http" | "sse" | "stdio";
              command?: string;
              args?: string[];
              env?: Record<string, string>;
              cwd?: string;
              url?: string;
              headers?: Record<string, string>;
          }
        | undefined;
    if (!config) {
        return;
    }

    const hasCommand = typeof config.command === "string" && config.command.length > 0;
    const hasUrl = typeof config.url === "string" && config.url.length > 0;
    if (!hasCommand && !hasUrl) {
        return;
    }

    await context.mcpService.saveServer(message.name as string, config);
    await context.loadMCPServers();
};

const handleDeleteMCPServer = async (
    message: WebviewMessage,
    context: MessageHandlerContext,
): Promise<void> => {
    await context.mcpService.deleteServer(message.name as string);
    await context.loadMCPServers();
};

// ============================================================================
// Utility Handlers
// ============================================================================

const handleCopyToClipboard = async (
    message: WebviewMessage,
    _context: MessageHandlerContext,
): Promise<void> => {
    await vscode.env.clipboard.writeText((message.text as string) ?? "");
};

const handleOpenExternal = async (
    message: WebviewMessage,
    _context: MessageHandlerContext,
): Promise<void> => {
    const url = message.url as string | undefined;
    if (url) {
        await vscode.env.openExternal(vscode.Uri.parse(url));
    }
};

const handleOpenFolder = async (
    message: WebviewMessage,
    _context: MessageHandlerContext,
): Promise<void> => {
    const folderPath = message.folderPath as string | undefined;
    if (folderPath) {
        await vscode.commands.executeCommand("revealFileInOS", vscode.Uri.file(folderPath));
    }
};

const handleShowInfo = (message: WebviewMessage, _context: MessageHandlerContext): void => {
    const msg = message.message as string | undefined;
    if (msg) {
        vscode.window.showInformationMessage(msg);
    }
};

const handleShowError = (message: WebviewMessage, _context: MessageHandlerContext): void => {
    const msg = message.message as string | undefined;
    if (msg) {
        vscode.window.showErrorMessage(msg);
    }
};

const handleInstallClaude = (_message: WebviewMessage, context: MessageHandlerContext): void => {
    context.postMessage({ type: "showInstallModal" });
};

const handleLogin = (_message: WebviewMessage, context: MessageHandlerContext): void => {
    context.postMessage({ type: "showLoginModal" });
};

const handleSaveInputText = (message: WebviewMessage, context: MessageHandlerContext): void => {
    context.setState({ draftMessage: (message.text as string) ?? "" });
};

const handleEnableYoloMode = async (
    _message: WebviewMessage,
    context: MessageHandlerContext,
): Promise<void> => {
    await context.enableYoloMode();
};

const handleGetClipboardText = async (
    _message: WebviewMessage,
    context: MessageHandlerContext,
): Promise<void> => {
    await context.getClipboardText();
};

const handleRefreshUsage = async (
    _message: WebviewMessage,
    context: MessageHandlerContext,
): Promise<void> => {
    await context.refreshUsage();
};

const handleRevertFile = async (
    message: WebviewMessage,
    context: MessageHandlerContext,
): Promise<void> => {
    const filePath = message.filePath as string | undefined;
    const oldContent = message.oldContent as string | undefined;

    if (!filePath || oldContent === undefined) {
        return;
    }

    try {
        const uri = vscode.Uri.file(filePath);
        const encoder = new TextEncoder();
        await vscode.workspace.fs.writeFile(uri, encoder.encode(oldContent));

        vscode.window.showInformationMessage(`Reverted changes to ${path.basename(filePath)}`);

        context.postMessage({
            type: "fileReverted",
            filePath,
            success: true,
        });
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to revert: ${path.basename(filePath)}`);
        context.postMessage({
            type: "fileReverted",
            filePath,
            success: false,
            error: String(error),
        });
    }
};

// ============================================================================
// Helper Functions
// ============================================================================

function getThinkingPrefix(intensity: string): string {
    switch (intensity) {
        case "think-hard":
            return "THINK HARD";
        case "think-harder":
            return "THINK HARDER";
        case "ultrathink":
            return "ULTRATHINK";
        default:
            return "THINK";
    }
}

// ============================================================================
// Handler Map
// ============================================================================

/**
 * Map of message types to their handler functions.
 * This replaces the large switch statement in PanelProvider.
 */
export const messageHandlers: MessageHandlerMap = {
    // Session handlers
    sendMessage: handleSendMessage,
    startSession: handleNewSession,
    newSession: handleNewSession,
    endSession: handleStopGeneration,
    stopGeneration: handleStopGeneration,
    stopRequest: handleStopGeneration,
    clearConversation: handleClearConversation,

    // Conversation handlers
    getConversationList: handleGetConversationList,
    loadConversation: handleLoadConversation,
    deleteConversation: handleDeleteConversation,

    // Settings handlers
    getSettings: handleGetSettings,
    requestState: handleRequestState,
    saveState: handleSaveState,
    saveSettings: handleSaveSettings,
    updateSettings: handleSaveSettings,
    selectModel: handleSelectModel,

    // File handlers
    openFile: handleOpenFile,
    openDiff: handleOpenDiff,
    openMarkdownPreview: handleOpenMarkdownPreview,

    // Permission handlers
    permissionResponse: handlePermissionResponse,
    getPermissions: handleGetPermissions,
    removePermission: handleRemovePermission,
    addPermission: handleAddPermission,

    // MCP handlers
    loadMCPServers: handleLoadMCPServers,
    saveMCPServer: handleSaveMCPServer,
    deleteMCPServer: handleDeleteMCPServer,

    // Utility handlers
    copyToClipboard: handleCopyToClipboard,
    openExternal: handleOpenExternal,
    openFolder: handleOpenFolder,
    showInfo: handleShowInfo,
    showError: handleShowError,
    installClaude: handleInstallClaude,
    login: handleLogin,
    saveInputText: handleSaveInputText,
    enableYoloMode: handleEnableYoloMode,
    getClipboardText: handleGetClipboardText,
    refreshUsage: handleRefreshUsage,
    revertFile: handleRevertFile,
};

/**
 * Handle a webview message using the handler map.
 * Returns true if the message was handled, false otherwise.
 */
export function handleWebviewMessage(
    message: WebviewMessage,
    context: MessageHandlerContext,
): Promise<boolean> {
    const handler = messageHandlers[message.type];
    if (handler) {
        const result = handler(message, context);
        if (result instanceof Promise) {
            return result.then(() => true);
        }
        return Promise.resolve(true);
    }
    console.log("Unknown message type:", message.type);
    return Promise.resolve(false);
}
