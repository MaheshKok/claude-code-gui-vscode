import * as vscode from "vscode";
import { WebviewProvider } from "./webview/WebviewProvider";
import { PanelProvider } from "./webview/PanelProvider";
import { ClaudeService } from "./services/ClaudeService";
import { ConversationService } from "./services/ConversationService";
import { PermissionService } from "./services/PermissionService";
import { MCPService } from "./services/MCPService";
import { UsageService } from "./services/UsageService";
import { COMMAND_IDS, VIEW_IDS, CONFIG_KEYS } from "../shared/constants";
import {
    DiffContentProvider,
    storeDiffContent,
    getDiffContent,
    DIFF_URI_SCHEME,
} from "./providers/DiffContentProvider";

// Re-export for external use (maintains backward compatibility)
export { storeDiffContent, getDiffContent };

/**
 * Main extension activation point
 */
export function activate(context: vscode.ExtensionContext): void {
    // Create output channel FIRST and show it immediately
    const outputChannel = vscode.window.createOutputChannel("Claude Code GUI");
    outputChannel.show(true); // Show the output channel immediately
    outputChannel.appendLine("╔════════════════════════════════════════════╗");
    outputChannel.appendLine("║   CLAUDE CODE GUI EXTENSION ACTIVATED      ║");
    outputChannel.appendLine("╚════════════════════════════════════════════╝");
    outputChannel.appendLine(`Timestamp: ${new Date().toISOString()}`);
    outputChannel.appendLine("");

    console.log("=== CLAUDE CODE GUI EXTENSION ACTIVATING ===");
    console.log("[Extension] Timestamp:", new Date().toISOString());

    // Initialize services
    outputChannel.appendLine("[Extension] Initializing ClaudeService...");
    const claudeService = new ClaudeService(context);

    outputChannel.appendLine("[Extension] Initializing ConversationService...");
    const conversationService = new ConversationService(context);

    outputChannel.appendLine("[Extension] Initializing PermissionService...");
    const permissionService = new PermissionService(context);

    outputChannel.appendLine("[Extension] Initializing MCPService...");
    const mcpService = new MCPService(context);

    outputChannel.appendLine("[Extension] Initializing UsageService...");
    const usageService = new UsageService(outputChannel);

    // Create the main panel provider (for editor area)
    const panelProvider = new PanelProvider(
        context.extensionUri,
        context,
        claudeService,
        conversationService,
        permissionService,
        mcpService,
        usageService,
    );

    // Create sidebar webview provider (shares state with panel provider)
    const webviewProvider = new WebviewProvider(context.extensionUri, context, panelProvider);

    // Register command to open chat in main editor area
    const openChatCommand = vscode.commands.registerCommand(
        COMMAND_IDS.OPEN_CHAT,
        (column?: vscode.ViewColumn) => {
            console.log("Claude Code GUI command executed!");
            panelProvider.show(column);
        },
    );

    // Register command to load a specific conversation
    const loadConversationCommand = vscode.commands.registerCommand(
        COMMAND_IDS.LOAD_CONVERSATION,
        (filename: string) => {
            panelProvider.loadConversation(filename);
        },
    );

    // Register command to start a new session
    const newSessionCommand = vscode.commands.registerCommand(COMMAND_IDS.NEW_SESSION, () => {
        panelProvider.newSession();
    });

    // Register command to stop current request
    const stopRequestCommand = vscode.commands.registerCommand(COMMAND_IDS.STOP_REQUEST, () => {
        claudeService.stopProcess();
    });

    // Register webview view provider for sidebar chat
    const webviewProviderRegistration = vscode.window.registerWebviewViewProvider(
        VIEW_IDS.CHAT_VIEW,
        webviewProvider,
    );

    // Register custom content provider for read-only diff views
    const diffProvider = new DiffContentProvider();
    const diffProviderRegistration = vscode.workspace.registerTextDocumentContentProvider(
        DIFF_URI_SCHEME,
        diffProvider,
    );

    // Listen for configuration changes
    const configChangeDisposable = vscode.workspace.onDidChangeConfiguration((event) => {
        // Check for WSL configuration changes using CONFIG_KEYS prefix
        const wslConfigPrefix = CONFIG_KEYS.WSL_ENABLED.replace(".enabled", "");
        if (event.affectsConfiguration(wslConfigPrefix)) {
            console.log("WSL configuration changed, starting new session");
            panelProvider.newSessionOnConfigChange();
        }
    });

    // Create status bar item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(comment-discussion) Claude";
    statusBarItem.tooltip = "Open Claude Code GUI (Ctrl+Shift+C)";
    statusBarItem.command = COMMAND_IDS.OPEN_CHAT;
    statusBarItem.show();

    // Register all disposables
    context.subscriptions.push(
        openChatCommand,
        loadConversationCommand,
        newSessionCommand,
        stopRequestCommand,
        webviewProviderRegistration,
        diffProviderRegistration,
        configChangeDisposable,
        statusBarItem,
        claudeService,
        conversationService,
        permissionService,
        mcpService,
        usageService,
        // PanelProvider wrapper to dispose all resources including global subscriptions
        { dispose: () => panelProvider.disposeAll() },
    );

    outputChannel.appendLine("");
    outputChannel.appendLine("[Extension] ✅ All services initialized");
    outputChannel.appendLine("[Extension] ✅ Commands registered");
    outputChannel.appendLine("[Extension] ✅ Extension ready!");
    outputChannel.appendLine("");

    console.log("Claude Code GUI extension activation completed successfully!");

    // Show a notification so user knows extension is active
    vscode.window.showInformationMessage(
        "Claude Code GUI extension activated. Check 'Claude Code GUI' output channel for logs.",
    );
}

/**
 * Extension deactivation
 */
export function deactivate(): void {
    console.log("Claude Code GUI extension is being deactivated");
}
