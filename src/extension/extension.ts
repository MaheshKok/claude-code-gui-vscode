import * as vscode from "vscode";
import { WebviewProvider } from "./webview/WebviewProvider";
import { PanelProvider } from "./webview/PanelProvider";
import { ClaudeService } from "./services/ClaudeService";
import { ConversationService } from "./services/ConversationService";
import { PermissionService } from "./services/PermissionService";
import { MCPService } from "./services/MCPService";
import { COMMAND_IDS, VIEW_IDS, CONFIG_KEYS } from "../shared/constants";

// Storage for diff content (used by DiffContentProvider)
const diffContentStore = new Map<string, string>();

/**
 * Custom TextDocumentContentProvider for read-only diff views
 */
class DiffContentProvider implements vscode.TextDocumentContentProvider {
  provideTextDocumentContent(uri: vscode.Uri): string {
    const content = diffContentStore.get(uri.path);
    return content || "";
  }
}

/**
 * Get diff content for a given path
 */
export function getDiffContent(path: string): string | undefined {
  return diffContentStore.get(path);
}

/**
 * Store diff content for a given path
 */
export function storeDiffContent(path: string, content: string): void {
  diffContentStore.set(path, content);
}

/**
 * Main extension activation point
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log("Claude Code GUI extension is being activated!");

  // Initialize services
  const claudeService = new ClaudeService(context);
  const conversationService = new ConversationService(context);
  const permissionService = new PermissionService(context);
  const mcpService = new MCPService(context);

  // Create the main panel provider (for editor area)
  const panelProvider = new PanelProvider(
    context.extensionUri,
    context,
    claudeService,
    conversationService,
    permissionService,
    mcpService,
  );

  // Create sidebar webview provider (shares state with panel provider)
  const webviewProvider = new WebviewProvider(
    context.extensionUri,
    context,
    panelProvider,
  );

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
  const newSessionCommand = vscode.commands.registerCommand(
    COMMAND_IDS.NEW_SESSION,
    () => {
      panelProvider.newSession();
    },
  );

  // Register command to stop current request
  const stopRequestCommand = vscode.commands.registerCommand(
    COMMAND_IDS.STOP_REQUEST,
    () => {
      claudeService.stopProcess();
    },
  );

  // Register webview view provider for sidebar chat
  const webviewProviderRegistration = vscode.window.registerWebviewViewProvider(
    VIEW_IDS.CHAT_VIEW,
    webviewProvider,
  );

  // Register custom content provider for read-only diff views
  const diffProvider = new DiffContentProvider();
  const diffProviderRegistration =
    vscode.workspace.registerTextDocumentContentProvider(
      "claude-diff",
      diffProvider,
    );

  // Listen for configuration changes
  const configChangeDisposable = vscode.workspace.onDidChangeConfiguration(
    (event) => {
      // Check for WSL configuration changes using CONFIG_KEYS prefix
      const wslConfigPrefix = CONFIG_KEYS.WSL_ENABLED.replace(".enabled", "");
      if (event.affectsConfiguration(wslConfigPrefix)) {
        console.log("WSL configuration changed, starting new session");
        panelProvider.newSessionOnConfigChange();
      }
    },
  );

  // Create status bar item
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );
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
  );

  console.log("Claude Code GUI extension activation completed successfully!");
}

/**
 * Extension deactivation
 */
export function deactivate(): void {
  console.log("Claude Code GUI extension is being deactivated");
}
