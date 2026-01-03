import * as vscode from "vscode";

/**
 * Generates the HTML content for the webview
 * This loads the React application bundle
 */
export function getHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
    // Get URIs for the bundled React app assets
    const scriptUri = webview.asWebviewUri(
        vscode.Uri.joinPath(extensionUri, "dist", "webview", "main.js"),
    );

    const styleUri = webview.asWebviewUri(
        vscode.Uri.joinPath(extensionUri, "dist", "webview", "main.css"),
    );

    // Generate a nonce for Content Security Policy
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} https: data:; font-src ${webview.cspSource};">
    <link href="${styleUri}" rel="stylesheet">
    <title>Claude Code GUI</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
        }

        #root {
            width: 100vw;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }

        /* Loading state */
        .loading-container {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            flex-direction: column;
            gap: 16px;
        }

        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid var(--vscode-input-border);
            border-top: 3px solid var(--vscode-focusBorder);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* Scrollbar styling */
        ::-webkit-scrollbar {
            width: 10px;
            height: 10px;
        }

        ::-webkit-scrollbar-track {
            background: var(--vscode-scrollbarSlider-background);
        }

        ::-webkit-scrollbar-thumb {
            background: var(--vscode-scrollbarSlider-hoverBackground);
            border-radius: 5px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: var(--vscode-scrollbarSlider-activeBackground);
        }
    </style>
</head>
<body>
    <div id="root">
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <div>Loading Claude Code GUI...</div>
        </div>
    </div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}

/**
 * Generate a random nonce string for CSP
 */
function getNonce(): string {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
