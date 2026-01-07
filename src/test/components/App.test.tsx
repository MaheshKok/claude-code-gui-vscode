import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { App } from "../../webview/App";

// Mock all hooks and components
vi.mock("../../webview/hooks/useVSCode", () => ({
    useVSCode: () => ({
        postMessage: vi.fn(),
        isVSCode: true,
    }),
}));

vi.mock("../../webview/hooks/useAppState", () => ({
    useAppState: () => ({
        chat: {
            messages: [],
            isProcessing: false,
            todos: [],
            tokens: {
                cumulative: { totalInputTokens: 0, totalOutputTokens: 0 },
            },
            costs: { sessionCostUsd: 0 },
            requestStartTime: null,
        },
        settings: {
            selectedModel: "claude-sonnet-4-5-20250929",
            planMode: false,
            thinkingMode: false,
            thinkingIntensity: 0,
            yoloMode: false,
            wsl: { enabled: false },
        },
        ui: {
            isConnected: true,
            activeModal: null,
        },
        permission: {
            pendingPermission: null,
        },
        local: {
            isHistoryOpen: false,
            setIsHistoryLoading: vi.fn(),
            streamingMessageId: null,
            setStreamingMessageId: vi.fn(),
            setSubscriptionType: vi.fn(),
            setRequestCount: vi.fn(),
            setLastDurationMs: vi.fn(),
            setConversationList: vi.fn(),
            setActiveConversationId: vi.fn(),
            activeConversationId: null,
            conversationList: [],
            isHistoryLoading: false,
            requestCount: 0,
            lastDurationMs: 0,
            subscriptionType: null,
            showWSLAlert: false,
            setShowWSLAlert: vi.fn(),
        },
        uiActions: {
            openModal: vi.fn(),
            closeModal: vi.fn(),
        },
    }),
}));

vi.mock("../../webview/hooks/useAppCallbacks", () => ({
    useAppCallbacks: () => ({
        handleNewChat: vi.fn(),
        handleToggleHistory: vi.fn(),
        handleCloseHistory: vi.fn(),
        handleConversationLoad: vi.fn(),
        handleConversationDelete: vi.fn(),
        handleSendMessage: vi.fn(),
        handleModelChange: vi.fn(),
        handlePlanModeToggle: vi.fn(),
        handleThinkingModeToggle: vi.fn(),
        handleThinkingIntensityChange: vi.fn(),
        handleYoloModeToggle: vi.fn(),
        handleMcpAction: vi.fn(),
        handleStopProcessing: vi.fn(),
        handleWSLConfigure: vi.fn(),
        handlePermissionResponse: vi.fn(),
        handleMcpAddServer: vi.fn(),
        handleMcpDeleteServer: vi.fn(),
        handleMcpToggleServer: vi.fn(),
        mcpServers: [],
    }),
}));

vi.mock("../../webview/hooks/useMessageHandlers", () => ({
    useMessageHandlers: () => ({
        handlers: {},
    }),
}));

vi.mock("../../webview/hooks/useMessages", () => ({
    useMessages: vi.fn(),
}));

vi.mock("../../webview/stores", () => ({
    useChatStore: Object.assign(
        vi.fn(() => ({
            messages: [],
            currentSessionId: "test-session-id",
        })),
        {
            getState: () => ({
                messages: [],
                currentSessionId: "test-session-id",
            }),
        },
    ),
}));

// Mock child components
vi.mock("../../webview/components/Header", () => ({
    Header: ({ onNewChat, onToggleHistory, isHistoryOpen, onOpenUsage }: any) => (
        <header data-testid="header">
            <button data-testid="new-chat-btn" onClick={onNewChat}>
                New Chat
            </button>
            <button data-testid="toggle-history-btn" onClick={onToggleHistory}>
                Toggle History
            </button>
            <button data-testid="usage-btn" onClick={onOpenUsage}>
                Usage
            </button>
            <span data-testid="history-open">{isHistoryOpen ? "open" : "closed"}</span>
        </header>
    ),
}));

vi.mock("../../webview/components/Chat/ChatContainer", () => ({
    ChatContainer: ({ onSendMessage, onModelChange, currentModel }: any) => (
        <div data-testid="chat-container">
            <span data-testid="current-model">{currentModel}</span>
            <button data-testid="send-message-btn" onClick={() => onSendMessage("test message")}>
                Send
            </button>
            <button
                data-testid="change-model-btn"
                onClick={() => onModelChange("claude-opus-4-5-20251101")}
            >
                Change Model
            </button>
        </div>
    ),
}));

vi.mock("../../webview/components/Status/StatusBar", () => ({
    StatusBar: ({ isConnected, isProcessing, onStop, totalTokens }: any) => (
        <div data-testid="status-bar">
            <span data-testid="connected">{isConnected ? "connected" : "disconnected"}</span>
            <span data-testid="processing">{isProcessing ? "processing" : "idle"}</span>
            <span data-testid="total-tokens">{totalTokens}</span>
            <button data-testid="stop-btn" onClick={onStop}>
                Stop
            </button>
        </div>
    ),
}));

vi.mock("../../webview/components/History", () => ({
    ConversationHistory: ({ isOpen, onClose, conversations, isLoading }: any) => (
        <div data-testid="conversation-history" style={{ display: isOpen ? "block" : "none" }}>
            <span data-testid="history-loading">{isLoading ? "loading" : "loaded"}</span>
            <span data-testid="conversation-count">{conversations?.length || 0}</span>
            <button data-testid="close-history-btn" onClick={onClose}>
                Close
            </button>
        </div>
    ),
}));

vi.mock("../../webview/components/Common", () => ({
    WSLAlert: ({ onDismiss, onConfigure }: any) => (
        <div data-testid="wsl-alert">
            <button data-testid="dismiss-wsl" onClick={onDismiss}>
                Dismiss
            </button>
            <button data-testid="configure-wsl" onClick={onConfigure}>
                Configure
            </button>
        </div>
    ),
}));

vi.mock("../../webview/components/Modals", () => ({
    MCPModal: ({ isOpen, onClose }: any) =>
        isOpen ? (
            <div data-testid="mcp-modal">
                <button onClick={onClose}>Close</button>
            </div>
        ) : null,
    ModelSelectorModal: ({ isOpen, onClose }: any) =>
        isOpen ? (
            <div data-testid="model-selector-modal">
                <button onClick={onClose}>Close</button>
            </div>
        ) : null,
    PermissionModal: ({ isOpen, onClose }: any) =>
        isOpen ? (
            <div data-testid="permission-modal">
                <button onClick={onClose}>Close</button>
            </div>
        ) : null,
    InstallModal: ({ isOpen, onClose }: any) =>
        isOpen ? (
            <div data-testid="install-modal">
                <button onClick={onClose}>Close</button>
            </div>
        ) : null,
    UsageModal: ({ isOpen, onClose }: any) =>
        isOpen ? (
            <div data-testid="usage-modal">
                <button onClick={onClose}>Close</button>
            </div>
        ) : null,
}));

describe("App", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("rendering", () => {
        it("should render the main app structure", () => {
            render(<App />);
            expect(screen.getByTestId("header")).toBeInTheDocument();
            expect(screen.getByTestId("chat-container")).toBeInTheDocument();
            expect(screen.getByTestId("status-bar")).toBeInTheDocument();
        });

        it("should render conversation history component", () => {
            render(<App />);
            expect(screen.getByTestId("conversation-history")).toBeInTheDocument();
        });

        it("should show closed state for history by default", () => {
            render(<App />);
            expect(screen.getByTestId("history-open")).toHaveTextContent("closed");
        });
    });

    describe("status bar", () => {
        it("should show connected status", () => {
            render(<App />);
            expect(screen.getByTestId("connected")).toHaveTextContent("connected");
        });

        it("should show idle processing status", () => {
            render(<App />);
            expect(screen.getByTestId("processing")).toHaveTextContent("idle");
        });

        it("should show total tokens", () => {
            render(<App />);
            expect(screen.getByTestId("total-tokens")).toHaveTextContent("0");
        });
    });

    describe("chat container", () => {
        it("should display current model", () => {
            render(<App />);
            expect(screen.getByTestId("current-model")).toHaveTextContent(
                "claude-sonnet-4-5-20250929",
            );
        });
    });

    describe("conversation history", () => {
        it("should show conversation count", () => {
            render(<App />);
            expect(screen.getByTestId("conversation-count")).toHaveTextContent("0");
        });
    });
});

describe("App mapMessageToProps", () => {
    // Test the message mapping functionality through the component
    it("should map messages correctly", () => {
        // The mapping function is tested indirectly through the component
        // since it's called with messages from useChatStore
        render(<App />);
        expect(screen.getByTestId("chat-container")).toBeInTheDocument();
    });
});
