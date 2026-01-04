import { vi, beforeAll, afterEach } from "vitest";
import "@testing-library/jest-dom";

// Mock VSCode API for extension tests
const mockVscode = {
    window: {
        showInformationMessage: vi.fn(),
        showErrorMessage: vi.fn(),
        showWarningMessage: vi.fn(),
        createWebviewPanel: vi.fn(),
        registerWebviewViewProvider: vi.fn(),
        createOutputChannel: vi.fn(() => ({
            appendLine: vi.fn(),
            append: vi.fn(),
            clear: vi.fn(),
            show: vi.fn(),
            hide: vi.fn(),
            dispose: vi.fn(),
        })),
    },
    commands: {
        registerCommand: vi.fn(),
        executeCommand: vi.fn(),
    },
    workspace: {
        getConfiguration: vi.fn(() => ({
            get: vi.fn(),
            update: vi.fn(),
            has: vi.fn(),
            inspect: vi.fn(),
        })),
        workspaceFolders: [],
        onDidChangeConfiguration: vi.fn(),
    },
    Uri: {
        file: vi.fn((path: string) => ({ fsPath: path, path })),
        parse: vi.fn((uri: string) => ({ fsPath: uri, path: uri })),
        joinPath: vi.fn((...args: unknown[]) => ({
            fsPath: args.join("/"),
            path: args.join("/"),
        })),
    },
    ExtensionContext: vi.fn(),
    ViewColumn: {
        One: 1,
        Two: 2,
        Three: 3,
    },
    StatusBarAlignment: {
        Left: 1,
        Right: 2,
    },
    EventEmitter: vi.fn(() => ({
        event: vi.fn(),
        fire: vi.fn(),
        dispose: vi.fn(),
    })),
    Disposable: {
        from: vi.fn(),
    },
};

// Make vscode available globally for extension tests
vi.mock("vscode", () => mockVscode);

// Mock acquireVsCodeApi for webview tests
const mockVscodeApi = {
    postMessage: vi.fn(),
    getState: vi.fn(() => ({})),
    setState: vi.fn(),
};

// Adding to global for webview tests
(globalThis as Record<string, unknown>).acquireVsCodeApi = vi.fn(() => mockVscodeApi);

// Mock scrollIntoView for tests
Element.prototype.scrollIntoView = vi.fn();

// Setup DOM for React tests
beforeAll(() => {
    // Ensure we have a proper DOM environment
    if (typeof document !== "undefined") {
        const root = document.createElement("div");
        root.id = "root";
        document.body.appendChild(root);
    }
});

// Cleanup after each test
afterEach(() => {
    vi.clearAllMocks();
});

export { mockVscode, mockVscodeApi };
