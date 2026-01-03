// VSCode webview API type declarations

interface VsCodeApi {
    postMessage(message: unknown): void;
    getState(): unknown;
    setState(state: unknown): void;
}

declare global {
    interface Window {
        vscode?: VsCodeApi;
        acquireVsCodeApi?: () => VsCodeApi;
    }
}

export {};
