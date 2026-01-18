/**
 * @module hooks/useMessageHandlers
 */

import { useMemo, useCallback, useRef } from "react";
import {
    useChatStore,
    useSettingsStore,
    useUIStore,
    usePermissionStore,
    useUsageStore,
    useMCPStore,
} from "../stores";
import { MessageType, ToolExecutionStatus } from "../../shared/constants";
import type { ChatMessage, PermissionRequest, TokenUsage } from "../types";
import type { UsageData } from "../../shared/types/usage";
import type { ConversationListItem } from "../types/history";
import {
    extractTodosFromInput,
    buildChatMessages,
    findTodosInLastTurn,
    mapConversationList,
} from "../utils";
import type { RestoreStatePayload } from "../utils";

export interface MessageHandlerDeps {
    streamingMessageId: string | null;
    setStreamingMessageId: (id: string | null) => void;
    setSubscriptionType: (type: string | null) => void;
    setRequestCount: React.Dispatch<React.SetStateAction<number>>;
    setLastDurationMs: (duration: number | null) => void;
    setConversationList: React.Dispatch<React.SetStateAction<ConversationListItem[]>>;
    setIsHistoryLoading: (loading: boolean) => void;
    setActiveConversationId: (id: string | null) => void;
    activeConversationId: string | null;
}

export interface UseMessageHandlersReturn {
    handlers: Record<string, (msg: unknown) => void>;
    pendingUsageRef: React.MutableRefObject<TokenUsage | null>;
    finalizeStreamingMessage: () => void;
}

export function useMessageHandlers(deps: MessageHandlerDeps): UseMessageHandlersReturn {
    const {
        streamingMessageId,
        setStreamingMessageId,
        setSubscriptionType,
        setRequestCount,
        setLastDurationMs,
        setConversationList,
        setIsHistoryLoading,
        setActiveConversationId,
        activeConversationId,
    } = deps;

    const pendingUsageRef = useRef<TokenUsage | null>(null);
    const didUpdateTodosRef = useRef(false);

    const addMessage = useChatStore((s) => s.addMessage);
    const updateMessage = useChatStore((s) => s.updateMessage);
    const setProcessing = useChatStore((s) => s.setProcessing);
    const setSessionId = useChatStore((s) => s.setSessionId);
    const setTodos = useChatStore((s) => s.setTodos);
    const clearTodos = useChatStore((s) => s.clearTodos);
    const updateTokens = useChatStore((s) => s.updateTokens);
    const updateSessionCost = useChatStore((s) => s.updateSessionCost);
    const resetTokenTracking = useChatStore((s) => s.resetTokenTracking);
    const startRequestTiming = useChatStore((s) => s.startRequestTiming);
    const stopRequestTiming = useChatStore((s) => s.stopRequestTiming);
    const hydrateConversation = useChatStore((s) => s.hydrateConversation);
    const costs = useChatStore((s) => s.costs);
    const sessionId = useChatStore((s) => s.setSessionId);

    const loadFromVSCode = useSettingsStore((s) => s.loadFromVSCode);

    const openModal = useUIStore((s) => s.openModal);
    const setConnectionStatus = useUIStore((s) => s.setConnectionStatus);
    const showError = useUIStore((s) => s.showError);

    const addPending = usePermissionStore((s) => s.addPending);

    const finalizeStreamingMessage = useCallback(() => {
        if (!streamingMessageId) {
            return;
        }

        useChatStore.getState().updateMessage(streamingMessageId, {
            isStreaming: false,
        });
        setStreamingMessageId(null);
    }, [streamingMessageId, setStreamingMessageId]);

    const handlers = useMemo(() => {
        const handlerMap = {
            sessionInfo: (msg: unknown) => {
                const data = msg as { sessionId: string; tools: unknown[]; mcpServers: unknown[] };
                setSessionId(data.sessionId);
                setConnectionStatus("connected");
            },

            accountInfo: (msg: unknown) => {
                const data = msg as { account: { subscriptionType?: string } };
                const type =
                    typeof data.account?.subscriptionType === "string"
                        ? data.account.subscriptionType
                        : null;
                setSubscriptionType(type);
            },

            output: (msg: unknown) => {
                const data = msg as { text: string; isFinal?: boolean };
                if (streamingMessageId) {
                    const currentMsg = useChatStore
                        .getState()
                        .messages.find((m) => m.id === streamingMessageId);
                    const currentContent =
                        currentMsg && "content" in currentMsg
                            ? (currentMsg as { content: string }).content
                            : "";
                    useChatStore.getState().updateMessage(streamingMessageId, {
                        content: currentContent + data.text,
                    });

                    if (data.isFinal) {
                        useChatStore.getState().updateMessage(streamingMessageId, {
                            isStreaming: false,
                        });
                        setStreamingMessageId(null);
                    }
                } else {
                    const newId = `msg-${Date.now()}`;
                    const pendingUsage = pendingUsageRef.current;
                    const newMessage = {
                        id: newId,
                        type: MessageType.Assistant,
                        content: data.text,
                        timestamp: Date.now(),
                        isStreaming: !data.isFinal,
                        usage: pendingUsage ?? undefined,
                    };
                    addMessage(newMessage as ChatMessage);
                    if (pendingUsage) {
                        pendingUsageRef.current = null;
                    }
                    if (!data.isFinal) {
                        setStreamingMessageId(newId);
                    }
                }
            },

            thinking: (msg: unknown) => {
                const data = msg as { thinking: string };
                finalizeStreamingMessage();
                const thinkingMessage = {
                    id: `thinking-${Date.now()}`,
                    type: MessageType.Thinking,
                    content: data.thinking,
                    timestamp: Date.now(),
                };
                addMessage(thinkingMessage as ChatMessage);
            },

            toolUse: (msg: unknown) => {
                const data = msg as {
                    toolUseId: string;
                    toolName: string;
                    rawInput: unknown;
                    toolInfo: string;
                    duration?: number;
                    tokens?: number;
                    cacheReadTokens?: number;
                    cacheCreationTokens?: number;
                    fileContentBefore?: string;
                    startLine?: number;
                    startLines?: number[];
                };
                finalizeStreamingMessage();
                if (data.toolName === "TodoWrite") {
                    const nextTodos = extractTodosFromInput(data.rawInput);
                    didUpdateTodosRef.current = true;
                    if (nextTodos.length > 0) {
                        setTodos(nextTodos);
                    } else {
                        clearTodos();
                    }
                }

                const toolMessage = {
                    id: data.toolUseId,
                    type: MessageType.ToolUse,
                    toolUseId: data.toolUseId,
                    timestamp: Date.now(),
                    toolName: data.toolName,
                    rawInput: data.rawInput as Record<string, unknown>,
                    toolInfo: data.toolInfo,
                    duration: data.duration,
                    tokens: data.tokens,
                    cacheReadTokens: data.cacheReadTokens,
                    cacheCreationTokens: data.cacheCreationTokens,
                    fileContentBefore: data.fileContentBefore,
                    startLine: data.startLine,
                    startLines: data.startLines,
                    status: ToolExecutionStatus.Executing,
                };
                addMessage(toolMessage as ChatMessage);
            },

            toolResult: (msg: unknown) => {
                const data = msg as {
                    toolUseId: string;
                    content: string;
                    isError: boolean;
                    hidden: boolean;
                    toolName?: string;
                    duration?: number;
                    tokens?: number;
                    cacheReadTokens?: number;
                    cacheCreationTokens?: number;
                    fileContentAfter?: string;
                };
                finalizeStreamingMessage();
                updateMessage(data.toolUseId, {
                    status: data.isError
                        ? ToolExecutionStatus.Failed
                        : ToolExecutionStatus.Completed,
                    duration: data.duration,
                    tokens: data.tokens,
                    cacheReadTokens: data.cacheReadTokens,
                    cacheCreationTokens: data.cacheCreationTokens,
                    fileContentAfter: data.fileContentAfter,
                } as Partial<ChatMessage>);

                if (!data.hidden) {
                    const resultMessage = {
                        id: `result-${data.toolUseId}`,
                        type: MessageType.ToolResult,
                        content: data.content,
                        timestamp: Date.now(),
                        toolUseId: data.toolUseId,
                        toolName: data.toolName,
                        isError: data.isError,
                        hidden: false,
                        duration: data.duration,
                        tokens: data.tokens,
                        cacheReadTokens: data.cacheReadTokens,
                        cacheCreationTokens: data.cacheCreationTokens,
                        fileContentAfter: data.fileContentAfter,
                    };
                    addMessage(resultMessage as ChatMessage);
                }
            },

            updateTokens: (msg: unknown) => {
                const data = msg as {
                    current: {
                        input_tokens: number;
                        output_tokens: number;
                        cache_read_input_tokens?: number;
                        cache_creation_input_tokens?: number;
                    };
                    total: unknown;
                };
                updateTokens(data.current);
                pendingUsageRef.current = data.current;

                if (streamingMessageId) {
                    useChatStore.getState().updateMessage(streamingMessageId, {
                        usage: data.current,
                    });
                    pendingUsageRef.current = null;
                } else {
                    const lastAssistant = [...useChatStore.getState().messages]
                        .reverse()
                        .find((message) => message.type === MessageType.Assistant);
                    if (
                        lastAssistant &&
                        (lastAssistant as { usage?: TokenUsage }).usage === undefined
                    ) {
                        useChatStore.getState().updateMessage(lastAssistant.id, {
                            usage: data.current,
                        });
                        pendingUsageRef.current = null;
                    }
                }
            },

            updateTotals: (msg: unknown) => {
                const data = msg as {
                    totalCostUsd: number;
                    durationMs: number;
                    numTurns: number;
                    requestCount?: number;
                    totalCost?: number;
                };
                const sessionCost =
                    typeof data.totalCost === "number"
                        ? data.totalCost
                        : costs.sessionCostUsd + data.totalCostUsd;
                updateSessionCost(sessionCost);
                if (typeof data.durationMs === "number" && data.durationMs > 0) {
                    setLastDurationMs(data.durationMs);
                    // Persist duration to localStorage for retrieval after navigation
                    try {
                        const storageKey = sessionId
                            ? `claude-code-gui-duration-${sessionId}`
                            : "claude-code-gui-duration-global";
                        localStorage.setItem(storageKey, data.durationMs.toString());
                    } catch {
                        // Ignore localStorage errors
                    }
                }
                if (typeof data.requestCount === "number") {
                    setRequestCount(data.requestCount);
                } else {
                    setRequestCount((prev) => prev + 1);
                }
                stopRequestTiming();
            },

            permissionRequest: (msg: unknown) => {
                const data = msg as {
                    requestId: string;
                    toolUseId: string;
                    toolName: string;
                    input: unknown;
                    description: string;
                    suggestions: unknown[];
                };
                finalizeStreamingMessage();
                const request: PermissionRequest = {
                    requestId: data.requestId,
                    toolUseId: data.toolUseId,
                    toolName: data.toolName,
                    input: data.input as Record<string, unknown>,
                    description: data.description,
                    suggestions: data.suggestions as PermissionRequest["suggestions"],
                    status: "pending",
                    timestamp: Date.now(),
                };
                addPending(request);
                openModal("permission", { request });
            },

            setProcessing: (msg: unknown) => {
                const data = msg as { isProcessing: boolean };
                setProcessing(data.isProcessing);
                if (data.isProcessing) {
                    startRequestTiming();
                    didUpdateTodosRef.current = false;
                    // Clear todos from previous prompt when starting a new one
                    clearTodos();
                } else {
                    stopRequestTiming();
                }
                if (!data.isProcessing) {
                    setStreamingMessageId(null);
                    if (!didUpdateTodosRef.current) {
                        clearTodos();
                    }
                }
            },

            loading: (msg: unknown) => {
                const data = msg as { message?: string };
                console.log("Loading:", data.message);
            },

            clearLoading: () => {},

            error: (msg: unknown) => {
                const data = msg as { message: string; code?: string; recoverable?: boolean };
                finalizeStreamingMessage();
                showError("Error", data.message);

                const errorMessage = {
                    id: `error-${Date.now()}`,
                    type: MessageType.Error,
                    content: data.message,
                    timestamp: Date.now(),
                    code: data.code,
                    recoverable: data.recoverable,
                };
                addMessage(errorMessage as ChatMessage);
                setProcessing(false);
            },

            showInstallModal: () => {
                openModal("install");
            },

            showLoginModal: () => {
                openModal("login");
            },

            settingsUpdate: (msg: unknown) => {
                const data = msg as { settings: Record<string, unknown> };
                loadFromVSCode(data.settings);
            },

            conversationList: (msg: unknown) => {
                const data = msg as { conversations?: unknown[]; data?: unknown[] };
                const items = Array.isArray(data.conversations)
                    ? data.conversations
                    : Array.isArray(data.data)
                      ? data.data
                      : [];
                setConversationList(mapConversationList(items));
                setIsHistoryLoading(false);
            },

            conversationDeleted: (msg: unknown) => {
                const data = msg as { filename: string };
                setConversationList((prev) => prev.filter((item) => item.id !== data.filename));
                if (activeConversationId === data.filename) {
                    setActiveConversationId(null);
                }
            },

            themeUpdate: () => {},

            restoreState: (msg: unknown) => {
                const data = msg as { state: unknown };
                if (!data.state || typeof data.state !== "object") {
                    return;
                }
                const state = data.state as RestoreStatePayload;
                if (state.conversationId) {
                    setActiveConversationId(state.conversationId);
                }
                if (Array.isArray(state.messages)) {
                    const restoredMessages = buildChatMessages(state.messages);
                    const totalCost =
                        typeof state.totalCost === "number" ? state.totalCost : undefined;
                    const totalTokens =
                        state.totalTokens &&
                        typeof state.totalTokens.input === "number" &&
                        typeof state.totalTokens.output === "number"
                            ? state.totalTokens
                            : undefined;
                    const lastMessage = restoredMessages[restoredMessages.length - 1];
                    const streamingId =
                        lastMessage && lastMessage.type === "assistant" && lastMessage.isStreaming
                            ? lastMessage.id
                            : null;
                    setStreamingMessageId(state.isProcessing === false ? null : streamingId);
                    const restoredTodos = findTodosInLastTurn(restoredMessages);
                    if (restoredTodos.length > 0) {
                        setTodos(restoredTodos);
                        // Mark that we've set todos during restore to prevent
                        // setProcessing(false) from clearing them
                        didUpdateTodosRef.current = true;
                    } else {
                        clearTodos();
                    }
                    hydrateConversation({
                        messages: restoredMessages,
                        sessionId: state.sessionId ?? null,
                        totalCost,
                        totalTokens,
                    });
                    setRequestCount(
                        restoredMessages.filter((message) => message.type === "user").length,
                    );
                    if (typeof state.isProcessing === "boolean") {
                        setProcessing(state.isProcessing);
                    }
                }
            },

            compacting: () => {},

            compactBoundary: () => {
                resetTokenTracking();
            },

            usageData: (msg: unknown) => {
                console.log("[useMessageHandlers] ✅ Received usageData message!");
                const data = msg as { data: UsageData };
                console.log("[useMessageHandlers] Usage data:", JSON.stringify(data.data, null, 2));
                useUsageStore.getState().setUsageData(data.data);
                console.log("[useMessageHandlers] Updated usage store");
            },

            usageError: (msg: unknown) => {
                console.log("[useMessageHandlers] ⚠️ Received usageError message!");
                const data = msg as { error: string };
                console.log("[useMessageHandlers] Error:", data.error);
                // Clear refresh state so UI is not stuck with spinner
                useUsageStore.getState().setRefreshing(false);
            },

            mcpServers: (msg: unknown) => {
                const message = msg as {
                    data: Record<
                        string,
                        {
                            type?: "http" | "sse" | "stdio";
                            command?: string;
                            args?: string[];
                            env?: Record<string, string>;
                            cwd?: string;
                            url?: string;
                            headers?: Record<string, string>;
                        }
                    >;
                };
                // Import servers into the MCP store
                const mcpStore = useMCPStore.getState();
                const servers = message.data || {};

                // Convert extension server format to MCP store format and import
                const serverConfigs = Object.entries(servers).map(([name, config]) => ({
                    id: name,
                    name,
                    type: config.type ?? (config.url ? "http" : "stdio"),
                    command: config.command,
                    args: config.args,
                    env: config.env,
                    cwd: config.cwd,
                    url: config.url,
                    headers: config.headers,
                    enabled: true,
                }));

                // Import servers (only adds new ones, doesn't duplicate)
                mcpStore.importServers(serverConfigs);
            },
        };

        return handlerMap as Record<string, (msg: unknown) => void>;
    }, [
        addMessage,
        updateMessage,
        setSessionId,
        setConnectionStatus,
        setProcessing,
        setTodos,
        clearTodos,
        updateTokens,
        updateSessionCost,
        resetTokenTracking,
        startRequestTiming,
        stopRequestTiming,
        setSubscriptionType,
        setRequestCount,
        setLastDurationMs,
        addPending,
        openModal,
        showError,
        loadFromVSCode,
        streamingMessageId,
        setStreamingMessageId,
        finalizeStreamingMessage,
        hydrateConversation,
        setConversationList,
        setIsHistoryLoading,
        setActiveConversationId,
        activeConversationId,
        costs.sessionCostUsd,
        sessionId,
    ]);

    return {
        handlers,
        pendingUsageRef,
        finalizeStreamingMessage,
    };
}
