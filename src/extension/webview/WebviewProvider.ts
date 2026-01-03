import * as vscode from "vscode";
import { PanelProvider } from "./PanelProvider";

/**
 * WebviewViewProvider for the sidebar chat view
 * This provider manages the sidebar chat panel and delegates to the main PanelProvider
 */
export class WebviewProvider implements vscode.WebviewViewProvider {
    private _webviewView: vscode.WebviewView | undefined;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _context: vscode.ExtensionContext,
        private readonly _panelProvider: PanelProvider,
    ) {}

    /**
     * Called when the webview view is created
     */
    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ): void {
        this._webviewView = webviewView;

        // Configure webview options
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        // Use the shared panel provider instance for the sidebar
        this._panelProvider.showInWebview(webviewView.webview, webviewView);

        // Handle visibility changes to reinitialize when sidebar reopens
        webviewView.onDidChangeVisibility(() => {
            if (webviewView.visible) {
                // Close main panel when sidebar becomes visible
                this._panelProvider.closeMainPanel();
                this._panelProvider.reinitializeWebview();
            }
        });
    }

    /**
     * Get the current webview view
     */
    public get webviewView(): vscode.WebviewView | undefined {
        return this._webviewView;
    }
}
