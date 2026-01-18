/* eslint-disable @typescript-eslint/no-explicit-any */
// Note: Using 'any' for message handling where types are dynamic from webview/CLI

import * as vscode from "vscode";
import { ClaudeService } from "../services/ClaudeService";
import { ConversationService, ConversationMessage } from "../services/ConversationService";
import { PermissionService } from "../services/PermissionService";
import { MCPService } from "../services/MCPService";
import { UsageService } from "../services/UsageService";
import { getHtml } from "./html";
import {
    handleWebviewMessage,
    type MessageHandlerContext,
    type PanelState,
    type WebviewMessage,
} from "./handlers";
import { SessionStateManager } from "./SessionStateManager";
import { SettingsManager } from "./SettingsManager";
import { ClaudeMessageProcessor, type MessagePoster } from "./ClaudeMessageProcessor";
import type { ClaudeMessage } from "../../shared/types";

/**
 * Provides the main chat panel functionality
 * Can be shown either in a webview panel (editor area) or in a sidebar webview view
 */
export class PanelProvider {
    private _panel: vscode.WebviewPanel | undefined;
    private _webview: vscode.Webview | undefined;
    private _webviewView: vscode.WebviewView | undefined;
    private _disposables: vscode.Disposable[] = []; // Panel-specific disposables
    private _globalDisposables: vscode.Disposable[] = []; // Service subscriptions that persist
    private _messageHandlerDisposable: vscode.Disposable | undefined;

    // Extracted managers
    private readonly _stateManager: SessionStateManager;
    private readonly _settingsManager: SettingsManager;
    private readonly _messageProcessor: ClaudeMessageProcessor;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _context: vscode.ExtensionContext,
        private readonly _claudeService: ClaudeService,
        private readonly _conversationService: ConversationService,
        private readonly _permissionService: PermissionService,
        private readonly _mcpService: MCPService,
        private readonly _usageService: UsageService,
    ) {
        // Initialize managers
        this._stateManager = new SessionStateManager();
        this._settingsManager = new SettingsManager();

        // Load saved model preference
        const defaultModel = this._settingsManager.getDefaultModel();
        const savedModel = this._context.workspaceState.get<string>(
            "claude.selectedModel",
            defaultModel,
        );
        this._stateManager.selectedModel = savedModel === "default" ? defaultModel : savedModel;
        if (savedModel === "default") {
            this._context.workspaceState.update(
                "claude.selectedModel",
                this._stateManager.selectedModel,
            );
        }

        // Load cached subscription type
        this._stateManager.subscriptionType =
            this._context.globalState.get("claude.subscriptionType");

        // Initialize message processor
        const messagePoster: MessagePoster = {
            postMessage: (msg) => this._postMessage(msg),
            sendAndSaveMessage: (msg) => this._sendAndSaveMessage(msg),
        };

        this._messageProcessor = new ClaudeMessageProcessor(this._stateManager, messagePoster, {
            onSessionIdReceived: (sessionId) => {
                this._claudeService.setSessionId(sessionId);
            },
            onSubscriptionTypeReceived: (subscriptionType) => {
                this._stateManager.subscriptionType = subscriptionType;
                this._context.globalState.update("claude.subscriptionType", subscriptionType);
            },
            onProcessingComplete: (result) => {
                const sessionId = result.sessionId || this._claudeService.sessionId;
                if (sessionId) {
                    this._conversationService.saveCurrentConversation({
                        sessionId,
                        totalCost: this._stateManager.totalCost,
                        totalTokens: {
                            input: this._stateManager.totalTokensInput,
                            output: this._stateManager.totalTokensOutput,
                        },
                    });
                    console.log("[PanelProvider] Saved conversation with sessionId:", sessionId);
                } else {
                    console.warn(
                        "[PanelProvider] Could not save conversation: no sessionId available",
                    );
                }
            },
        });

        // Set up Claude service event handlers
        this._setupClaudeServiceHandlers();

        // Set up Usage service event handlers
        this._setupUsageServiceHandlers();
    }

    /**
     * Set up event handlers for Claude service
     */
    private _setupClaudeServiceHandlers(): void {
        this._claudeService.onMessage((message: ClaudeMessage) => {
            console.log("[PanelProvider] Received Claude message:", message.type);
            void this._messageProcessor.processMessage(message);
        });

        this._claudeService.onProcessEnd(() => {
            this._stateManager.isProcessing = false;
            this._messageProcessor.finalizeAndClear();
            this._postMessage({ type: "clearLoading" });
            this._postMessage({ type: "setProcessing", isProcessing: false });

            // Show completion notification if enabled
            this._showCompletionNotification();

            // Refresh usage data since API was called (rate limits may have changed)
            this._usageService.onClaudeSessionEnd();
        });

        this._claudeService.onError((error) => {
            this._stateManager.isProcessing = false;
            this._messageProcessor.finalizeAndClear();
            this._postMessage({ type: "clearLoading" });
            this._postMessage({ type: "setProcessing", isProcessing: false });

            if (error.includes("ENOENT") || error.includes("command not found")) {
                this._postMessage({ type: "showInstallModal" });
            } else {
                this._postMessage({ type: "error", message: error });
            }
        });

        this._claudeService.onPermissionRequest((request) => {
            // Show permission notification
            this._showPermissionNotification(request.toolName);

            const toolUseId = request.toolUseId || request.requestId;
            this._sendAndSaveMessage({
                type: "permissionRequest",
                data: request,
                requestId: request.requestId,
                toolUseId,
                toolName: request.toolName,
                input: request.input,
                description: request.description,
                suggestions: request.suggestions,
                decisionReason: request.decisionReason,
                blockedPath: request.blockedPath,
            });
        });
    }

    /**
     * Set up event handlers for Usage service
     * NOTE: These are global subscriptions that persist even when panel is closed
     */
    private _setupUsageServiceHandlers(): void {
        console.log("[PanelProvider] Setting up usage service handlers...");

        // Subscribe to usage updates (global - persists across panel open/close)
        const updateSubscription = this._usageService.onUsageUpdate((data) => {
            console.log("[PanelProvider] ✅ Received usage update from UsageService!");
            console.log("[PanelProvider] Usage data:", JSON.stringify(data, null, 2));
            console.log("[PanelProvider] Has panel:", !!this._panel);
            console.log("[PanelProvider] Has webview:", !!this._webview);
            this._postMessage({
                type: "usageData",
                data,
            });
        });
        this._globalDisposables.push(updateSubscription);

        // Subscribe to usage errors (global - persists across panel open/close)
        const errorSubscription = this._usageService.onError((errorMessage) => {
            console.log("[PanelProvider] ⚠️ Received usage error:", errorMessage);
            this._postMessage({
                type: "usageError",
                error: errorMessage,
            });
        });
        this._globalDisposables.push(errorSubscription);

        console.log("[PanelProvider] Usage service handlers set up successfully");
    }

    private _sendUsageData(): void {
        const usageData = this._usageService.currentUsage;
        if (usageData) {
            this._postMessage({
                type: "usageData",
                data: usageData,
            });
        }
    }

    private async _refreshUsage(): Promise<void> {
        console.log("[PanelProvider] Refreshing usage data...");
        try {
            await this._usageService.fetchUsageData();
            this._sendUsageData();
        } catch (error) {
            console.error("[PanelProvider] Failed to refresh usage:", error);
        }
    }
    /**
     * Show the panel in the editor area
     */
    public show(column: vscode.ViewColumn | vscode.Uri = vscode.ViewColumn.Two): void {
        const actualColumn = column instanceof vscode.Uri ? vscode.ViewColumn.Two : column;

        // Close sidebar if it's open
        this._closeSidebar();

        if (this._panel) {
            this._panel.reveal(actualColumn);
            return;
        }

        this._panel = vscode.window.createWebviewPanel(
            "claudeCodeGui",
            "Claude Code GUI",
            actualColumn,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [this._extensionUri],
            },
        );

        // Set icon for the webview tab
        const iconPath = vscode.Uri.joinPath(this._extensionUri, "icon-bubble.png");
        this._panel.iconPath = iconPath;

        this._panel.webview.html = this._getHtmlForWebview();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Send latest usage data when panel becomes visible
        this._panel.onDidChangeViewState(
            (e) => {
                if (e.webviewPanel.visible) {
                    console.log("[PanelProvider] Panel became visible, sending latest usage data");
                    this._sendUsageData();
                }
            },
            null,
            this._disposables,
        );

        this._setupWebviewMessageHandler(this._panel.webview);

        // Resume session from latest conversation
        this._initializeWebview();
    }

    /**
     * Show the chat in a sidebar webview
     */
    public showInWebview(webview: vscode.Webview, webviewView?: vscode.WebviewView): void {
        // Close main panel if it's open
        if (this._panel) {
            console.log("Closing main panel because sidebar is opening");
            this._panel.dispose();
            this._panel = undefined;
        }

        this._webview = webview;
        this._webviewView = webviewView;
        this._webview.html = this._getHtmlForWebview();

        this._setupWebviewMessageHandler(this._webview);

        // Initialize the webview
        this._initializeWebview();
    }

    /**
     * Close the main panel
     */
    public closeMainPanel(): void {
        if (this._panel) {
            this._panel.dispose();
            this._panel = undefined;
        }
    }

    /**
     * Reinitialize the webview (e.g., when sidebar becomes visible again)
     */
    public reinitializeWebview(): void {
        if (this._webview) {
            this._setupWebviewMessageHandler(this._webview);
            this._initializeWebview();
        }
    }

    /**
     * Load a specific conversation
     */
    public loadConversation(filename: string): void {
        const conversation = this._conversationService.loadConversation(filename);
        if (conversation) {
            this._claudeService.setSessionId(conversation.sessionId);

            this._postMessage({
                type: "restoreState",
                state: {
                    messages: conversation.messages,
                    sessionId: conversation.sessionId,
                    totalCost: conversation.totalCost,
                    totalTokens: conversation.totalTokens,
                    conversationId: conversation.filename,
                },
            });

            // Update local state
            this._stateManager.restoreFromConversation({
                totalCost: conversation.totalCost,
                totalTokens: conversation.totalTokens,
            });

            this._sendReadyMessage();
        }
    }

    /**
     * Start a new session
     */
    public async newSession(): Promise<void> {
        this._stateManager.isProcessing = false;
        this._stateManager.hasOpenOutput = false;
        this._postMessage({ type: "setProcessing", isProcessing: false });
        this._postMessage({ type: "clearLoading" });

        await this._claudeService.stopProcess();

        // Clear session state
        this._claudeService.setSessionId(undefined);
        this._conversationService.clearCurrentConversation();

        // Reset counters
        this._stateManager.resetSession();
    }

    /**
     * Handle configuration change that requires a new session
     */
    public newSessionOnConfigChange(): void {
        this._mcpService.initializeConfig();
        this.newSession();

        vscode.window.showInformationMessage(
            "WSL configuration changed. Started a new Claude session.",
            "OK",
        );
    }

    /**
     * Get the main panel
     */
    public get panel(): vscode.WebviewPanel | undefined {
        return this._panel;
    }

    /**
     * Dispose of the panel (called when panel is closed)
     * NOTE: Does NOT dispose global service subscriptions - those persist
     */
    public dispose(): void {
        console.log("[PanelProvider] Disposing panel (keeping global subscriptions)");
        this._panel = undefined;

        if (this._messageHandlerDisposable) {
            this._messageHandlerDisposable.dispose();
            this._messageHandlerDisposable = undefined;
        }

        // Only dispose panel-specific disposables, not global subscriptions
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    /**
     * Dispose of all resources including global subscriptions
     * (called when extension is deactivated)
     */
    public disposeAll(): void {
        console.log("[PanelProvider] Disposing all resources including global subscriptions");
        this.dispose();

        // Dispose global subscriptions (service handlers)
        while (this._globalDisposables.length) {
            const disposable = this._globalDisposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }

        // Clear webview references
        this._webview = undefined;
        this._webviewView = undefined;
    }

    // ==================== Private Methods ====================

    private _closeSidebar(): void {
        if (this._webviewView) {
            vscode.commands.executeCommand("workbench.view.explorer");
        }
    }

    private _initializeWebview(): void {
        const restoreState = this._getRestoreState();
        if (restoreState && typeof restoreState === "object") {
            this._postMessage({
                type: "restoreState",
                state: restoreState,
            });
            this._sendReadyMessage();
            return;
        }

        // Resume session from latest conversation
        const latestConversation = this._conversationService.getLatestConversation();
        if (latestConversation) {
            this._claudeService.setSessionId(latestConversation.sessionId);
            this.loadConversation(latestConversation.filename);
        } else {
            setTimeout(() => {
                this._sendReadyMessage();
            }, 100);
        }
    }

    private _getRestoreState(): Record<string, unknown> | undefined {
        const storedState = this._context.workspaceState.get("claude.webviewState");
        const currentMessages = this._conversationService.getCurrentConversation();

        if (currentMessages.length > 0) {
            const storedSessionId =
                storedState && typeof storedState === "object"
                    ? (storedState as { sessionId?: string }).sessionId
                    : undefined;
            return {
                messages: currentMessages,
                sessionId: this._claudeService.sessionId ?? storedSessionId ?? null,
                totalCost: this._stateManager.totalCost,
                totalTokens: {
                    input: this._stateManager.totalTokensInput,
                    output: this._stateManager.totalTokensOutput,
                },
                isProcessing: this._stateManager.isProcessing,
            };
        }

        if (storedState && typeof storedState === "object") {
            return storedState as Record<string, unknown>;
        }

        return undefined;
    }

    private _setupWebviewMessageHandler(webview: vscode.Webview): void {
        if (this._messageHandlerDisposable) {
            this._messageHandlerDisposable.dispose();
        }

        this._messageHandlerDisposable = webview.onDidReceiveMessage(
            (message) => this._handleWebviewMessage(message),
            null,
            this._disposables,
        );
    }

    private _postMessage(message: Record<string, unknown>): void {
        console.log("[PanelProvider] Posting message to webview:", message.type);
        if (this._panel && this._panel.webview) {
            this._panel.webview.postMessage(message);
        } else if (this._webview) {
            this._webview.postMessage(message);
        } else {
            console.warn("[PanelProvider] No webview available to post message!");
        }
    }

    private _sendAndSaveMessage(message: ConversationMessage): void {
        this._postMessage(message);
        this._conversationService.addMessage(message);
    }

    private _sendReadyMessage(): void {
        this._postMessage({
            type: "setProcessing",
            isProcessing: this._stateManager.isProcessing,
        });

        if (this._stateManager.subscriptionType) {
            this._postMessage({
                type: "accountInfo",
                account: { subscriptionType: this._stateManager.subscriptionType },
            });
        }

        this._sendCurrentSettings();
        this._sendUsageData();
    }

    private _sendCurrentSettings(): void {
        const settings = this._settingsManager.getCurrentSettings(this._stateManager.selectedModel);
        this._postMessage({
            type: "settingsUpdate",
            settings,
        });
    }

    private _getHtmlForWebview(): string {
        const webview = this._panel?.webview || this._webview;
        if (!webview) {
            return "<html><body>Loading...</body></html>";
        }
        return getHtml(webview, this._extensionUri);
    }

    private async _handleWebviewMessage(message: WebviewMessage): Promise<void> {
        console.log("[PanelProvider] Received message from webview:", message.type);

        // Create handler context
        const context = this._createHandlerContext();

        // Use the handler map to process the message
        const handled = await handleWebviewMessage(message, context);

        if (!handled) {
            console.log("[PanelProvider] Message not handled:", message.type);
        }
    }

    /**
     * Create handler context for message processing
     */
    private _createHandlerContext(): MessageHandlerContext {
        return {
            // Services
            claudeService: this._claudeService,
            conversationService: this._conversationService,
            permissionService: this._permissionService,
            mcpService: this._mcpService,
            usageService: this._usageService,

            // Extension context
            extensionContext: this._context,

            // Methods for posting messages
            postMessage: (msg: unknown) => this._postMessage(msg as Record<string, unknown>),
            sendAndSaveMessage: (msg: unknown) =>
                this._sendAndSaveMessage(msg as ConversationMessage),

            // State accessors
            getState: () => this._getState(),
            setState: (updates: Partial<PanelState>) => this._setState(updates),

            // Settings
            sendCurrentSettings: () => this._sendCurrentSettings(),
            updateSettings: (settings: Record<string, unknown>) => this._updateSettings(settings),

            // Session management
            newSession: () => this.newSession(),
            loadConversation: (filename: string) => this.loadConversation(filename),

            // Utilities
            openFileInEditor: (
                filePath: string,
                line?: number,
                column?: number,
                preview?: boolean,
            ) => this._openFileInEditor(filePath, line, column, preview),
            openDiffEditor: (oldContent: string, newContent: string, filePath: string) =>
                this._openDiffEditor(oldContent, newContent, filePath),
            openMarkdownPreview: (content: string, title?: string) =>
                this._openMarkdownPreview(content, title),
            sendConversationList: () => this._sendConversationList(),
            sendPermissions: () => this._sendPermissions(),
            loadMCPServers: () => this._loadMCPServers(),
            enableYoloMode: () => this._enableYoloMode(),
            getClipboardText: () => this._getClipboardText(),
            setSelectedModel: (model: string) => this._setSelectedModel(model),

            // Usage tracking
            refreshUsage: () => this._refreshUsage(),

            // Conversation saving (for interrupted conversations)
            saveConversation: () => this._saveConversation(),
        };
    }

    /**
     * Get current panel state
     */
    private _getState(): PanelState {
        return this._stateManager.getState();
    }

    /**
     * Update panel state
     */
    private _setState(updates: Partial<PanelState>): void {
        this._stateManager.setState(updates);
    }

    private _sendConversationList(): void {
        const indexEntries = this._conversationService.getConversationIndex();
        // Map to format expected by HistoryView
        const conversations = indexEntries.map((entry) => ({
            filename: entry.filename,
            timestamp: entry.startTime || entry.endTime,
            preview: entry.firstUserMessage || entry.lastUserMessage || "No preview",
            messageCount: entry.messageCount,
            sessionId: entry.sessionId,
            totalCost: entry.totalCost,
        }));
        this._postMessage({
            type: "conversationList",
            data: conversations,
            conversations,
        });
    }

    private async _sendPermissions(): Promise<void> {
        const permissions = await this._permissionService.getPermissions();
        this._postMessage({
            type: "permissionsData",
            data: permissions,
        });
    }

    private async _loadMCPServers(): Promise<void> {
        const servers = await this._mcpService.loadServers();
        this._postMessage({
            type: "mcpServers",
            data: servers,
        });
    }

    /**
     * Save the current conversation (used for interrupted/stopped conversations)
     */
    private async _saveConversation(): Promise<void> {
        const sessionId = this._claudeService.sessionId;
        if (sessionId) {
            await this._conversationService.saveCurrentConversation({
                sessionId,
                totalCost: this._stateManager.totalCost,
                totalTokens: {
                    input: this._stateManager.totalTokensInput,
                    output: this._stateManager.totalTokensOutput,
                },
            });
            console.log(
                "[PanelProvider] Saved interrupted conversation with sessionId:",
                sessionId,
            );
        } else {
            console.warn("[PanelProvider] Could not save conversation: no sessionId available");
        }
    }

    private async _updateSettings(settings: Record<string, unknown>): Promise<void> {
        // Handle model selection separately (needs state update)
        if (typeof settings.selectedModel === "string") {
            this._setSelectedModel(settings.selectedModel);
        }

        // Check if YOLO mode is being enabled
        const wasYoloEnabled = this._settingsManager.isYoloModeEnabled();
        const willBeYoloEnabled = settings.yoloMode === true;

        await this._settingsManager.updateSettings(settings);
        this._sendCurrentSettings();

        // If YOLO mode was just enabled, auto-approve pending permission requests
        if (!wasYoloEnabled && willBeYoloEnabled) {
            console.log(
                "[PanelProvider] YOLO mode enabled via settings, auto-approving pending requests",
            );
            this._claudeService.autoApproveAllPendingRequests();
        }
    }

    private _setSelectedModel(model: string): void {
        this._stateManager.selectedModel = model;
        this._context.workspaceState.update("claude.selectedModel", model);
        this._postMessage({
            type: "settingsUpdate",
            settings: { selectedModel: model },
        });
    }

    private async _openFileInEditor(
        filePath: string,
        line?: number,
        column?: number,
        preview?: boolean,
    ): Promise<void> {
        try {
            const document = await vscode.workspace.openTextDocument(filePath);
            const editor = await vscode.window.showTextDocument(document, {
                viewColumn: vscode.ViewColumn.One,
                preview: preview ?? true,
            });

            if (typeof line === "number" && line > 0) {
                const col = typeof column === "number" && column > 0 ? column : 1;
                const position = new vscode.Position(line - 1, col - 1);
                editor.selection = new vscode.Selection(position, position);
                editor.revealRange(new vscode.Range(position, position));
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open file: ${filePath}`);
        }
    }

    private async _openDiffEditor(
        oldContent: string,
        newContent: string,
        filePath: string,
    ): Promise<void> {
        try {
            const { storeDiffContent } = await import("../extension");

            const timestamp = Date.now();
            const oldUri = vscode.Uri.parse(`claude-diff:${filePath}.old.${timestamp}`);
            const newUri = vscode.Uri.parse(`claude-diff:${filePath}.new.${timestamp}`);

            storeDiffContent(oldUri.path, oldContent);
            storeDiffContent(newUri.path, newContent);

            await vscode.commands.executeCommand(
                "vscode.diff",
                oldUri,
                newUri,
                `Changes: ${filePath}`,
            );
        } catch (error) {
            console.error("Error opening diff editor:", error);
        }
    }

    private async _openMarkdownPreview(content: string, title?: string): Promise<void> {
        try {
            if (!content) {
                return;
            }

            const doc = await vscode.workspace.openTextDocument({
                content,
                language: "markdown",
            });

            await vscode.window.showTextDocument(doc, {
                viewColumn: vscode.ViewColumn.Beside,
                preview: true,
                preserveFocus: true,
            });

            await vscode.commands.executeCommand("markdown.showPreviewToSide", doc.uri);

            if (title) {
                console.log("[PanelProvider] Opened markdown preview:", title);
            }
        } catch (error) {
            console.error("Error opening markdown preview:", error);
        }
    }

    private async _enableYoloMode(): Promise<void> {
        await this._settingsManager.enableYoloMode();
        this._sendCurrentSettings();

        // Auto-approve any pending permission requests
        this._claudeService.autoApproveAllPendingRequests();

        vscode.window.showInformationMessage(
            "YOLO mode enabled! All permissions will be automatically approved.",
            "OK",
        );
    }

    private async _getClipboardText(): Promise<void> {
        try {
            const text = await vscode.env.clipboard.readText();
            this._postMessage({
                type: "clipboardText",
                data: text,
            });
        } catch (error) {
            console.error("Failed to read clipboard:", error);
            this._postMessage({
                type: "clipboardText",
                data: "",
            });
        }
    }

    /**
     * Show notification when Claude finishes processing
     */
    private _showCompletionNotification(): void {
        const config = vscode.workspace.getConfiguration("claudeCodeGui");
        if (!config.get<boolean>("notifications.onComplete", true)) {
            return;
        }

        // Only notify if webview is not visible/focused
        const isPanelVisible = this._panel?.visible ?? false;
        const isWebviewVisible = this._webviewView?.visible ?? false;

        if (!isPanelVisible && !isWebviewVisible) {
            vscode.window
                .showInformationMessage("Claude has finished processing your request", "Show")
                .then((selection) => {
                    if (selection === "Show") {
                        this.show();
                    }
                });
        }
    }

    /**
     * Show notification when Claude requires permission
     */
    private _showPermissionNotification(toolName: string): void {
        const config = vscode.workspace.getConfiguration("claudeCodeGui");
        if (!config.get<boolean>("notifications.onPermission", true)) {
            return;
        }

        vscode.window
            .showWarningMessage(`Claude needs permission to use: ${toolName}`, "Review")
            .then((selection) => {
                if (selection === "Review") {
                    this.show();
                }
            });
    }
}
