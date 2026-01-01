/* eslint-disable @typescript-eslint/no-explicit-any */
// Note: Using 'any' for message handling where types are dynamic from webview/CLI

import * as vscode from 'vscode';
import { ClaudeService } from '../services/ClaudeService';
import { ConversationService, ConversationMessage } from '../services/ConversationService';
import { PermissionService } from '../services/PermissionService';
import { MCPService } from '../services/MCPService';
import { getHtml } from './html';

/**
 * Provides the main chat panel functionality
 * Can be shown either in a webview panel (editor area) or in a sidebar webview view
 */
export class PanelProvider {
    private _panel: vscode.WebviewPanel | undefined;
    private _webview: vscode.Webview | undefined;
    private _webviewView: vscode.WebviewView | undefined;
    private _disposables: vscode.Disposable[] = [];
    private _messageHandlerDisposable: vscode.Disposable | undefined;

    // Session state
    private _totalCost: number = 0;
    private _totalTokensInput: number = 0;
    private _totalTokensOutput: number = 0;
    private _totalCacheReadTokens: number = 0;
    private _totalCacheCreationTokens: number = 0;
    private _requestCount: number = 0;
    private _isProcessing: boolean = false;
    private _hasOpenOutput: boolean = false;
    private _draftMessage: string = '';
    private _selectedModel: string = 'default';
    private _subscriptionType: string | undefined;
    private _accountInfoFetchedThisSession: boolean = false;
    private _toolUseMetrics: Map<string, {
        startTime: number;
        tokens?: number;
        toolName?: string;
        rawInput?: Record<string, unknown>;
        fileContentBefore?: string;
        startLine?: number;
        startLines?: number[];
    }> = new Map();

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _context: vscode.ExtensionContext,
        private readonly _claudeService: ClaudeService,
        private readonly _conversationService: ConversationService,
        private readonly _permissionService: PermissionService,
        private readonly _mcpService: MCPService
    ) {
        // Load saved model preference
        const config = vscode.workspace.getConfiguration('claudeCodeGui');
        const defaultModel = config.get<string>('claude.model', 'claude-sonnet-4-5-20250929');
        this._selectedModel = this._context.workspaceState.get('claude.selectedModel', defaultModel);
        if (this._selectedModel === 'default') {
            this._selectedModel = defaultModel;
            this._context.workspaceState.update('claude.selectedModel', this._selectedModel);
        }

        // Load cached subscription type
        this._subscriptionType = this._context.globalState.get('claude.subscriptionType');

        // Set up Claude service event handlers
        this._setupClaudeServiceHandlers();
    }

    /**
     * Set up event handlers for Claude service
     */
    private _setupClaudeServiceHandlers(): void {
        this._claudeService.onMessage((message) => {
            console.log('[PanelProvider] Received Claude message:', message.type);
            this._handleClaudeMessage(message);
        });

        this._claudeService.onProcessEnd(() => {
            this._isProcessing = false;
            this._finalizeOutputStream();
            this._postMessage({ type: 'clearLoading' });
            this._postMessage({ type: 'setProcessing', isProcessing: false });
            this._toolUseMetrics.clear();
        });

        this._claudeService.onError((error) => {
            this._isProcessing = false;
            this._finalizeOutputStream();
            this._postMessage({ type: 'clearLoading' });
            this._postMessage({ type: 'setProcessing', isProcessing: false });
            this._toolUseMetrics.clear();

            if (error.includes('ENOENT') || error.includes('command not found')) {
                this._postMessage({ type: 'showInstallModal' });
            } else {
                this._postMessage({ type: 'error', message: error });
            }
        });

        this._claudeService.onPermissionRequest((request) => {
            const toolUseId = request.toolUseId || request.requestId;
            this._sendAndSaveMessage({
                type: 'permissionRequest',
                data: request,
                requestId: request.requestId,
                toolUseId,
                toolName: request.toolName,
                input: request.input,
                description: request.description,
                suggestions: request.suggestions,
                decisionReason: request.decisionReason,
                blockedPath: request.blockedPath
            });
        });
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
            'claudeCodeGui',
            'Claude Code GUI',
            actualColumn,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [this._extensionUri]
            }
        );

        // Set icon for the webview tab
        const iconPath = vscode.Uri.joinPath(this._extensionUri, 'icon-bubble.png');
        this._panel.iconPath = iconPath;

        this._panel.webview.html = this._getHtmlForWebview();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

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
            console.log('Closing main panel because sidebar is opening');
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
                type: 'restoreState',
                state: {
                    messages: conversation.messages,
                    sessionId: conversation.sessionId,
                    totalCost: conversation.totalCost,
                    totalTokens: conversation.totalTokens,
                    conversationId: conversation.filename
                }
            });

            // Update local state
            this._totalCost = conversation.totalCost;
            this._totalTokensInput = conversation.totalTokens.input;
            this._totalTokensOutput = conversation.totalTokens.output;
            this._totalCacheReadTokens = 0;
            this._totalCacheCreationTokens = 0;

            this._sendReadyMessage();
        }
    }

    /**
     * Start a new session
     */
    public async newSession(): Promise<void> {
        this._isProcessing = false;
        this._hasOpenOutput = false;
        this._postMessage({ type: 'setProcessing', isProcessing: false });
        this._postMessage({ type: 'clearLoading' });

        await this._claudeService.stopProcess();

        // Clear session state
        this._claudeService.setSessionId(undefined);
        this._conversationService.clearCurrentConversation();

        // Reset counters
        this._totalCost = 0;
        this._totalTokensInput = 0;
        this._totalTokensOutput = 0;
        this._totalCacheReadTokens = 0;
        this._totalCacheCreationTokens = 0;
        this._requestCount = 0;
    }

    /**
     * Handle configuration change that requires a new session
     */
    public newSessionOnConfigChange(): void {
        this._mcpService.initializeConfig();
        this.newSession();

        vscode.window.showInformationMessage(
            'WSL configuration changed. Started a new Claude session.',
            'OK'
        );
    }

    /**
     * Get the main panel
     */
    public get panel(): vscode.WebviewPanel | undefined {
        return this._panel;
    }

    /**
     * Dispose of the panel and resources
     */
    public dispose(): void {
        this._panel = undefined;

        if (this._messageHandlerDisposable) {
            this._messageHandlerDisposable.dispose();
        }

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    // ==================== Private Methods ====================

    private _closeSidebar(): void {
        if (this._webviewView) {
            vscode.commands.executeCommand('workbench.view.explorer');
        }
    }

    private _initializeWebview(): void {
        const restoreState = this._getRestoreState();
        if (restoreState && typeof restoreState === 'object') {
            this._postMessage({
                type: 'restoreState',
                state: restoreState
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
        const storedState = this._context.workspaceState.get('claude.webviewState');
        const currentMessages = this._conversationService.getCurrentConversation();

        if (currentMessages.length > 0) {
            const storedSessionId = storedState && typeof storedState === 'object'
                ? (storedState as { sessionId?: string }).sessionId
                : undefined;
            return {
                messages: currentMessages,
                sessionId: this._claudeService.sessionId ?? storedSessionId ?? null,
                totalCost: this._totalCost,
                totalTokens: {
                    input: this._totalTokensInput,
                    output: this._totalTokensOutput
                },
                isProcessing: this._isProcessing
            };
        }

        if (storedState && typeof storedState === 'object') {
            return storedState as Record<string, unknown>;
        }

        return undefined;
    }

    private _setupWebviewMessageHandler(webview: vscode.Webview): void {
        if (this._messageHandlerDisposable) {
            this._messageHandlerDisposable.dispose();
        }

        this._messageHandlerDisposable = webview.onDidReceiveMessage(
            message => this._handleWebviewMessage(message),
            null,
            this._disposables
        );
    }

    private _postMessage(message: any): void {
        console.log('[PanelProvider] Posting message to webview:', message.type);
        if (this._panel && this._panel.webview) {
            this._panel.webview.postMessage(message);
        } else if (this._webview) {
            this._webview.postMessage(message);
        } else {
            console.warn('[PanelProvider] No webview available to post message!');
        }
    }

    private _sendAndSaveMessage(message: ConversationMessage): void {
        this._postMessage(message);
        this._conversationService.addMessage(message);
    }

    private _finalizeOutputStream(): void {
        if (!this._hasOpenOutput) {
            return;
        }

        this._postMessage({ type: 'output', text: '', isFinal: true });
        this._hasOpenOutput = false;
    }

    private _sendReadyMessage(): void {
        this._postMessage({ type: 'setProcessing', isProcessing: this._isProcessing });

        if (this._subscriptionType) {
            this._postMessage({
                type: 'accountInfo',
                account: { subscriptionType: this._subscriptionType }
            });
        }

        this._sendCurrentSettings();
    }

    private _sendCurrentSettings(): void {
        const config = vscode.workspace.getConfiguration('claudeCodeGui');
        this._postMessage({
            type: 'settingsUpdate',
            settings: {
                wsl: {
                    enabled: config.get<boolean>('wsl.enabled', false),
                    distro: config.get<string>('wsl.distro', 'Ubuntu'),
                    nodePath: config.get<string>('wsl.nodePath', '/usr/bin/node'),
                    claudePath: config.get<string>('wsl.claudePath', '/usr/local/bin/claude')
                },
                selectedModel: this._selectedModel,
                thinkingMode: config.get<boolean>('thinking.enabled', true),
                thinkingIntensity: config.get<string>('thinking.intensity', 'think'),
                showThinkingProcess: config.get<boolean>('thinking.showProcess', true),
                yoloMode: config.get<boolean>('permissions.yoloMode', false),
                autoApprovePatterns: config.get<string[]>('permissions.autoApprove', []),
                claudeExecutable: config.get<string>('claude.executable', 'claude'),
                maxHistorySize: config.get<number>('chat.maxHistorySize', 100),
                streamResponses: config.get<boolean>('chat.streamResponses', true),
                showTimestamps: config.get<boolean>('chat.showTimestamps', true),
                codeBlockTheme: config.get<string>('chat.codeBlockTheme', 'auto'),
                fontSize: config.get<number>('ui.fontSize', 14),
                compactMode: config.get<boolean>('ui.compactMode', false),
                showAvatars: config.get<boolean>('ui.showAvatars', true),
                includeFileContext: config.get<boolean>('context.includeFileContext', true),
                includeWorkspaceInfo: config.get<boolean>('context.includeWorkspaceInfo', true),
                maxContextLines: config.get<number>('context.maxContextLines', 500)
            }
        });
    }

    private _getHtmlForWebview(): string {
        const webview = this._panel?.webview || this._webview;
        if (!webview) {
            return '<html><body>Loading...</body></html>';
        }
        return getHtml(webview, this._extensionUri);
    }

    private async _handleWebviewMessage(message: any): Promise<void> {
        console.log('[PanelProvider] Received message from webview:', message.type);
        console.log('[PanelProvider] Full message object:', JSON.stringify(message, null, 2));
        switch (message.type) {
            case 'sendMessage':
                console.log('[PanelProvider] Handling sendMessage case');
                console.log('[PanelProvider] message.message:', message.message);
                console.log('[PanelProvider] message.text:', message.text);
                try {
                    await this._sendMessageToClaude(
                        message.message ?? message.text,
                        message.planMode,
                        message.thinkingMode
                    );
                } catch (error) {
                    console.error('[PanelProvider] Error in _sendMessageToClaude:', error);
                }
                break;
            case 'startSession':
            case 'newSession':
                await this.newSession();
                break;
            case 'endSession':
            case 'stopGeneration':
            case 'stopRequest':
                await this._claudeService.stopProcess();
                break;
            case 'clearConversation':
                await this.newSession();
                break;
            case 'getConversationList':
                this._sendConversationList();
                break;
            case 'loadConversation':
                this.loadConversation(message.filename);
                break;
            case 'deleteConversation':
                if (message.filename) {
                    const deleted = await this._conversationService.deleteConversation(message.filename);
                    if (deleted) {
                        this._postMessage({ type: 'conversationDeleted', filename: message.filename });
                        this._sendConversationList();
                    }
                }
                break;
            case 'getSettings':
                this._sendCurrentSettings();
                break;
            case 'requestState':
                this._postMessage({
                    type: 'restoreState',
                    state: this._getRestoreState()
                });
                break;
            case 'saveState':
                await this._context.workspaceState.update('claude.webviewState', message.state);
                break;
            case 'saveSettings':
            case 'updateSettings':
                await this._updateSettings(message.settings);
                break;
            case 'selectModel':
                this._setSelectedModel(message.model);
                break;
            case 'openFile':
                await this._openFileInEditor(message.filePath, message.line, message.column, message.preview);
                break;
            case 'openDiff':
                await this._openDiffEditor(message.oldContent, message.newContent, message.filePath);
                break;
            case 'permissionResponse':
                {
                    const requestId = message.requestId ?? message.id;
                    const decision = message.decision
                        ?? (message.approved ? (message.alwaysAllow ? 'allow_always' : 'allow') : 'deny');
                    const approved = decision !== 'deny';
                    const alwaysAllow = decision === 'allow_always';
                    const pendingRequest = requestId
                        ? this._claudeService.getPendingPermissionRequest(requestId)
                        : undefined;

                    if (requestId) {
                        this._claudeService.sendPermissionResponse(requestId, approved, alwaysAllow);
                    }

                    if (alwaysAllow && pendingRequest) {
                        await this._permissionService.savePermission(
                            pendingRequest.toolName,
                            pendingRequest.input
                        );
                    }
                }
                break;
            case 'copyToClipboard':
                await vscode.env.clipboard.writeText(message.text ?? '');
                break;
            case 'openExternal':
                if (message.url) {
                    await vscode.env.openExternal(vscode.Uri.parse(message.url));
                }
                break;
            case 'openFolder':
                if (message.folderPath) {
                    await vscode.commands.executeCommand(
                        'revealFileInOS',
                        vscode.Uri.file(message.folderPath)
                    );
                }
                break;
            case 'showInfo':
                if (message.message) {
                    vscode.window.showInformationMessage(message.message);
                }
                break;
            case 'showError':
                if (message.message) {
                    vscode.window.showErrorMessage(message.message);
                }
                break;
            case 'installClaude':
                this._postMessage({ type: 'showInstallModal' });
                break;
            case 'login':
                this._postMessage({ type: 'showLoginModal' });
                break;
            case 'getPermissions':
                await this._sendPermissions();
                break;
            case 'removePermission':
                await this._permissionService.removePermission(message.toolName, message.command);
                await this._sendPermissions();
                break;
            case 'addPermission':
                await this._permissionService.addPermission(message.toolName, message.command);
                await this._sendPermissions();
                break;
            case 'loadMCPServers':
                await this._loadMCPServers();
                break;
            case 'saveMCPServer':
                await this._mcpService.saveServer(message.name, message.config);
                await this._loadMCPServers();
                break;
            case 'deleteMCPServer':
                await this._mcpService.deleteServer(message.name);
                await this._loadMCPServers();
                break;
            case 'saveInputText':
                this._draftMessage = message.text;
                break;
            case 'enableYoloMode':
                await this._enableYoloMode();
                break;
            case 'getClipboardText':
                await this._getClipboardText();
                break;
            default:
                console.log('Unknown message type:', message.type);
        }
    }

    private async _sendMessageToClaude(
        message: string,
        planMode?: boolean,
        thinkingMode?: boolean
    ): Promise<void> {
        console.log('[PanelProvider] _sendMessageToClaude called');
        console.log('[PanelProvider] Message type:', typeof message);
        console.log('[PanelProvider] Message value:', message ? message.substring(0, 50) : '(empty/undefined)');
        if (!message) {
            console.log('[PanelProvider] Empty message, returning');
            return;
        }
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        const cwd = workspaceFolder ? workspaceFolder.uri.fsPath : process.cwd();
        console.log('[PanelProvider] Working directory:', cwd);

        // Build the actual message with thinking mode prefix if enabled
        let actualMessage = message;
        if (thinkingMode) {
            const config = vscode.workspace.getConfiguration('claudeCodeGui');
            const intensity = config.get<string>('thinking.intensity', 'think');
            const thinkingPrefix = this._getThinkingPrefix(intensity);
            actualMessage = thinkingPrefix + ' THROUGH THIS STEP BY STEP: \n' + actualMessage;
        }

        this._isProcessing = true;
        this._draftMessage = '';
        this._hasOpenOutput = false;

        // Save user input in conversation history
        this._conversationService.addMessage({ type: 'userInput', data: message });

        // Set processing state
        this._postMessage({ type: 'setProcessing', isProcessing: true });

        // Show loading indicator
        this._postMessage({ type: 'loading', message: 'Claude is working...' });

        // Get configuration
        const config = vscode.workspace.getConfiguration('claudeCodeGui');
        const yoloMode = config.get<boolean>('permissions.yoloMode', false);

        // Send message to Claude
        await this._claudeService.sendMessage(actualMessage, {
            cwd,
            planMode,
            yoloMode,
            model: this._selectedModel || undefined,
            mcpConfigPath: this._mcpService.getConfigPath()
        });
    }

    private _getThinkingPrefix(intensity: string): string {
        switch (intensity) {
            case 'think-hard':
                return 'THINK HARD';
            case 'think-harder':
                return 'THINK HARDER';
            case 'ultrathink':
                return 'ULTRATHINK';
            default:
                return 'THINK';
        }
    }

    private _handleClaudeMessage(message: any): void {
        switch (message.type) {
            case 'system':
                this._handleSystemMessage(message);
                break;
            case 'assistant':
                void this._handleAssistantMessage(message);
                break;
            case 'user':
                void this._handleUserMessage(message);
                break;
            case 'result':
                this._handleResultMessage(message);
                break;
            case 'accountInfo':
                this._subscriptionType = message.account?.subscriptionType;
                this._context.globalState.update('claude.subscriptionType', this._subscriptionType);
                this._postMessage({
                    type: 'accountInfo',
                    account: message.account
                });
                break;
        }
    }

    private _handleSystemMessage(message: any): void {
        if (message.subtype === 'init') {
            this._claudeService.setSessionId(message.session_id);
            this._sendAndSaveMessage({
                type: 'sessionInfo',
                data: {
                    sessionId: message.session_id,
                    tools: message.tools || [],
                    mcpServers: message.mcp_servers || []
                },
                sessionId: message.session_id,
                tools: message.tools || [],
                mcpServers: message.mcp_servers || []
            });
        } else if (message.subtype === 'status') {
            if (message.status === 'compacting') {
                this._sendAndSaveMessage({
                    type: 'compacting',
                    data: { isCompacting: true },
                    isCompacting: true
                });
            } else if (message.status === null) {
                this._sendAndSaveMessage({
                    type: 'compacting',
                    data: { isCompacting: false },
                    isCompacting: false
                });
            }
        } else if (message.subtype === 'compact_boundary') {
            this._totalTokensInput = 0;
            this._totalTokensOutput = 0;
            this._totalCacheReadTokens = 0;
            this._totalCacheCreationTokens = 0;

            this._sendAndSaveMessage({
                type: 'compactBoundary',
                data: {
                    trigger: message.compact_metadata?.trigger,
                    preTokens: message.compact_metadata?.pre_tokens
                },
                trigger: message.compact_metadata?.trigger,
                preTokens: message.compact_metadata?.pre_tokens
            });
        }
    }

    private async _handleAssistantMessage(message: any): Promise<void> {
        if (message.message && message.message.content) {
            // Track token usage
            const usage = message.message.usage;
            let tokenCount: number | undefined;
            if (usage) {
                const current = {
                    input_tokens: usage.input_tokens || 0,
                    output_tokens: usage.output_tokens || 0,
                    cache_read_input_tokens: usage.cache_read_input_tokens || 0,
                    cache_creation_input_tokens: usage.cache_creation_input_tokens || 0
                };

                tokenCount = current.input_tokens + current.output_tokens;

                this._totalTokensInput += current.input_tokens;
                this._totalTokensOutput += current.output_tokens;
                this._totalCacheReadTokens += current.cache_read_input_tokens || 0;
                this._totalCacheCreationTokens += current.cache_creation_input_tokens || 0;

                const total = {
                    inputTokens: this._totalTokensInput,
                    outputTokens: this._totalTokensOutput,
                    cacheReadTokens: this._totalCacheReadTokens,
                    cacheCreationTokens: this._totalCacheCreationTokens
                };

                this._sendAndSaveMessage({
                    type: 'updateTokens',
                    data: {
                        current,
                        total
                    },
                    current,
                    total
                });
            }

            // Process content
            for (const content of message.message.content) {
                if (content.type === 'text' && content.text.trim()) {
                    this._hasOpenOutput = true;
                    const text = content.text.trim();
                    this._sendAndSaveMessage({
                        type: 'output',
                        data: text,
                        text,
                        isFinal: false
                    });
                } else if (content.type === 'thinking' && content.thinking.trim()) {
                    const thinking = content.thinking.trim();
                    this._sendAndSaveMessage({
                        type: 'thinking',
                        data: thinking,
                        thinking
                    });
                } else if (content.type === 'tool_use') {
                    const toolUseId = content.id || content.tool_use_id || `tool-${Date.now()}`;
                    const toolInfo = `Executing: ${content.name}`;
                    const rawInput = content.input as Record<string, unknown> | undefined;

                    let fileContentBefore: string | undefined;
                    if ((content.name === 'Edit' || content.name === 'MultiEdit' || content.name === 'Write')
                        && rawInput
                        && typeof rawInput.file_path === 'string') {
                        try {
                            const fileUri = vscode.Uri.file(rawInput.file_path);
                            const fileData = await vscode.workspace.fs.readFile(fileUri);
                            fileContentBefore = Buffer.from(fileData).toString('utf8');
                        } catch {
                            fileContentBefore = '';
                        }
                    }

                    let startLine: number | undefined;
                    let startLines: number[] | undefined;
                    if (fileContentBefore !== undefined && rawInput) {
                        if (content.name === 'Edit' && typeof rawInput.old_string === 'string') {
                            const position = fileContentBefore.indexOf(rawInput.old_string);
                            if (position !== -1) {
                                const textBefore = fileContentBefore.substring(0, position);
                                startLine = (textBefore.match(/\n/g) || []).length + 1;
                            } else {
                                startLine = 1;
                            }
                        } else if (content.name === 'MultiEdit' && Array.isArray(rawInput.edits)) {
                            startLines = rawInput.edits.map((edit: { old_string?: string }) => {
                                if (edit && typeof edit.old_string === 'string') {
                                    const position = fileContentBefore!.indexOf(edit.old_string);
                                    if (position !== -1) {
                                        const textBefore = fileContentBefore!.substring(0, position);
                                        return (textBefore.match(/\n/g) || []).length + 1;
                                    }
                                }
                                return 1;
                            });
                        }
                    }

                    this._toolUseMetrics.set(toolUseId, {
                        startTime: Date.now(),
                        tokens: tokenCount,
                        toolName: content.name,
                        rawInput,
                        fileContentBefore,
                        startLine,
                        startLines
                    });
                    this._sendAndSaveMessage({
                        type: 'toolUse',
                        data: {
                            toolInfo,
                            rawInput,
                            toolName: content.name,
                            toolUseId,
                            tokens: tokenCount,
                            fileContentBefore,
                            startLine,
                            startLines
                        },
                        toolUseId,
                        toolName: content.name,
                        rawInput,
                        toolInfo,
                        tokens: tokenCount,
                        fileContentBefore,
                        startLine,
                        startLines
                    });
                }
            }
        }
    }

    private async _handleUserMessage(message: any): Promise<void> {
        if (message.message && message.message.content) {
            for (const content of message.message.content) {
                if (content.type === 'tool_result') {
                    let resultContent = content.content || 'Tool executed successfully';
                    if (typeof resultContent === 'object') {
                        resultContent = JSON.stringify(resultContent, null, 2);
                    }
                    const toolUseId = content.tool_use_id;
                    const toolMetrics = toolUseId
                        ? this._toolUseMetrics.get(toolUseId)
                        : undefined;
                    const duration = toolMetrics ? Date.now() - toolMetrics.startTime : undefined;
                    const tokens = toolMetrics?.tokens;
                    const toolName = toolMetrics?.toolName;
                    const rawInput = toolMetrics?.rawInput;
                    let fileContentAfter: string | undefined;
                    if ((toolName === 'Edit' || toolName === 'MultiEdit' || toolName === 'Write')
                        && rawInput
                        && typeof rawInput.file_path === 'string'
                        && !content.is_error) {
                        try {
                            const fileUri = vscode.Uri.file(rawInput.file_path);
                            const fileData = await vscode.workspace.fs.readFile(fileUri);
                            fileContentAfter = Buffer.from(fileData).toString('utf8');
                        } catch {
                            fileContentAfter = undefined;
                        }
                    }

                    this._sendAndSaveMessage({
                        type: 'toolResult',
                        data: {
                            content: resultContent,
                            isError: content.is_error || false,
                            toolUseId: toolUseId,
                            hidden: false,
                            duration,
                            tokens,
                            toolName,
                            fileContentAfter
                        },
                        toolUseId: toolUseId,
                        toolName,
                        content: resultContent,
                        isError: content.is_error || false,
                        hidden: false,
                        duration,
                        tokens,
                        fileContentAfter
                    });

                    if (toolUseId) {
                        this._toolUseMetrics.delete(toolUseId);
                    }
                }
            }
        }
    }

    private _handleResultMessage(message: any): void {
        if (message.subtype === 'success') {
            this._isProcessing = false;

            // Use session_id from message if available, otherwise use the one from ClaudeService
            const sessionId = message.session_id || this._claudeService.sessionId;

            if (message.session_id) {
                this._claudeService.setSessionId(message.session_id);
                this._sendAndSaveMessage({
                    type: 'sessionInfo',
                    data: { sessionId: message.session_id },
                    sessionId: message.session_id,
                    tools: [],
                    mcpServers: []
                });
            }

            this._finalizeOutputStream();

            this._postMessage({
                type: 'setProcessing',
                isProcessing: false
            });

            this._requestCount++;
            if (message.total_cost_usd) {
                this._totalCost += message.total_cost_usd;
            }

            this._postMessage({
                type: 'updateTotals',
                totalCostUsd: message.total_cost_usd || 0,
                durationMs: message.duration_ms || 0,
                numTurns: message.num_turns || 0,
                totalCost: this._totalCost,
                totalTokensInput: this._totalTokensInput,
                totalTokensOutput: this._totalTokensOutput,
                requestCount: this._requestCount
            });

            // Save conversation - use sessionId from ClaudeService if not in message
            if (sessionId) {
                this._conversationService.saveCurrentConversation({
                    sessionId: sessionId,
                    totalCost: this._totalCost,
                    totalTokens: {
                        input: this._totalTokensInput,
                        output: this._totalTokensOutput
                    }
                });
                console.log('[PanelProvider] Saved conversation with sessionId:', sessionId);
            } else {
                console.warn('[PanelProvider] Could not save conversation: no sessionId available');
            }
        }
    }

    private _sendConversationList(): void {
        const indexEntries = this._conversationService.getConversationIndex();
        // Map to format expected by HistoryView
        const conversations = indexEntries.map(entry => ({
            filename: entry.filename,
            timestamp: entry.startTime || entry.endTime,
            preview: entry.firstUserMessage || entry.lastUserMessage || 'No preview',
            messageCount: entry.messageCount,
            sessionId: entry.sessionId,
            totalCost: entry.totalCost
        }));
        this._postMessage({
            type: 'conversationList',
            data: conversations,
            conversations
        });
    }

    private async _sendPermissions(): Promise<void> {
        const permissions = await this._permissionService.getPermissions();
        this._postMessage({
            type: 'permissionsData',
            data: permissions
        });
    }

    private async _loadMCPServers(): Promise<void> {
        const servers = await this._mcpService.loadServers();
        this._postMessage({
            type: 'mcpServers',
            data: servers
        });
    }

    private async _updateSettings(settings: any): Promise<void> {
        const config = vscode.workspace.getConfiguration('claudeCodeGui');

        if (!settings || typeof settings !== 'object') {
            return;
        }

        if (settings.wsl) {
            if (typeof settings.wsl.enabled === 'boolean') {
                await config.update('wsl.enabled', settings.wsl.enabled, vscode.ConfigurationTarget.Global);
            }
            if (typeof settings.wsl.distro === 'string') {
                await config.update('wsl.distro', settings.wsl.distro, vscode.ConfigurationTarget.Global);
            }
            if (typeof settings.wsl.nodePath === 'string') {
                await config.update('wsl.nodePath', settings.wsl.nodePath, vscode.ConfigurationTarget.Global);
            }
            if (typeof settings.wsl.claudePath === 'string') {
                await config.update('wsl.claudePath', settings.wsl.claudePath, vscode.ConfigurationTarget.Global);
            }
        }

        if (typeof settings.selectedModel === 'string') {
            this._setSelectedModel(settings.selectedModel);
            await config.update('claude.model', settings.selectedModel, vscode.ConfigurationTarget.Global);
        }

        if (typeof settings.thinkingMode === 'boolean') {
            await config.update('thinking.enabled', settings.thinkingMode, vscode.ConfigurationTarget.Global);
        }
        if (typeof settings.thinkingIntensity === 'string') {
            await config.update('thinking.intensity', settings.thinkingIntensity, vscode.ConfigurationTarget.Global);
        }
        if (typeof settings.showThinkingProcess === 'boolean') {
            await config.update('thinking.showProcess', settings.showThinkingProcess, vscode.ConfigurationTarget.Global);
        }

        if (typeof settings.yoloMode === 'boolean') {
            await config.update('permissions.yoloMode', settings.yoloMode, vscode.ConfigurationTarget.Global);
        }
        if (Array.isArray(settings.autoApprovePatterns)) {
            await config.update('permissions.autoApprove', settings.autoApprovePatterns, vscode.ConfigurationTarget.Global);
        }

        if (typeof settings.claudeExecutable === 'string') {
            await config.update('claude.executable', settings.claudeExecutable, vscode.ConfigurationTarget.Global);
        }

        if (typeof settings.maxHistorySize === 'number') {
            await config.update('chat.maxHistorySize', settings.maxHistorySize, vscode.ConfigurationTarget.Global);
        }
        if (typeof settings.streamResponses === 'boolean') {
            await config.update('chat.streamResponses', settings.streamResponses, vscode.ConfigurationTarget.Global);
        }
        if (typeof settings.showTimestamps === 'boolean') {
            await config.update('chat.showTimestamps', settings.showTimestamps, vscode.ConfigurationTarget.Global);
        }
        if (typeof settings.codeBlockTheme === 'string') {
            await config.update('chat.codeBlockTheme', settings.codeBlockTheme, vscode.ConfigurationTarget.Global);
        }

        if (typeof settings.fontSize === 'number') {
            await config.update('ui.fontSize', settings.fontSize, vscode.ConfigurationTarget.Global);
        }
        if (typeof settings.compactMode === 'boolean') {
            await config.update('ui.compactMode', settings.compactMode, vscode.ConfigurationTarget.Global);
        }
        if (typeof settings.showAvatars === 'boolean') {
            await config.update('ui.showAvatars', settings.showAvatars, vscode.ConfigurationTarget.Global);
        }

        if (typeof settings.includeFileContext === 'boolean') {
            await config.update('context.includeFileContext', settings.includeFileContext, vscode.ConfigurationTarget.Global);
        }
        if (typeof settings.includeWorkspaceInfo === 'boolean') {
            await config.update('context.includeWorkspaceInfo', settings.includeWorkspaceInfo, vscode.ConfigurationTarget.Global);
        }
        if (typeof settings.maxContextLines === 'number') {
            await config.update('context.maxContextLines', settings.maxContextLines, vscode.ConfigurationTarget.Global);
        }

        this._sendCurrentSettings();
    }

    private _setSelectedModel(model: string): void {
        this._selectedModel = model;
        this._context.workspaceState.update('claude.selectedModel', model);
        this._postMessage({
            type: 'settingsUpdate',
            settings: { selectedModel: model }
        });
    }

    private async _openFileInEditor(
        filePath: string,
        line?: number,
        column?: number,
        preview?: boolean
    ): Promise<void> {
        try {
            const document = await vscode.workspace.openTextDocument(filePath);
            const editor = await vscode.window.showTextDocument(document, {
                viewColumn: vscode.ViewColumn.One,
                preview: preview ?? true
            });

            if (typeof line === 'number' && line > 0) {
                const col = typeof column === 'number' && column > 0 ? column : 1;
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
        filePath: string
    ): Promise<void> {
        try {
            const { storeDiffContent } = await import('../extension');

            const timestamp = Date.now();
            const oldUri = vscode.Uri.parse(`claude-diff:${filePath}.old.${timestamp}`);
            const newUri = vscode.Uri.parse(`claude-diff:${filePath}.new.${timestamp}`);

            storeDiffContent(oldUri.path, oldContent);
            storeDiffContent(newUri.path, newContent);

            await vscode.commands.executeCommand(
                'vscode.diff',
                oldUri,
                newUri,
                `Changes: ${filePath}`
            );
        } catch (error) {
            console.error('Error opening diff editor:', error);
        }
    }

    private async _enableYoloMode(): Promise<void> {
        const config = vscode.workspace.getConfiguration('claudeCodeGui');
        await config.update('permissions.yoloMode', true, vscode.ConfigurationTarget.Global);
        this._sendCurrentSettings();

        vscode.window.showInformationMessage(
            'YOLO mode enabled! All permissions will be automatically approved.',
            'OK'
        );
    }

    private async _getClipboardText(): Promise<void> {
        try {
            const text = await vscode.env.clipboard.readText();
            this._postMessage({
                type: 'clipboardText',
                data: text
            });
        } catch (error) {
            console.error('Failed to read clipboard:', error);
            this._postMessage({
                type: 'clipboardText',
                data: ''
            });
        }
    }
}
