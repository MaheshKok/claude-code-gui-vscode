/**
 * Root App Component
 *
 * Main application component that orchestrates all stores, handles
 * message routing from the extension, and renders the UI.
 *
 * @module webview/App
 */

import React, { useEffect, useCallback, useMemo } from "react";

// Components
import { Header } from "./components/Header";
import { ChatContainer } from "./components/Chat/ChatContainer";
import { StatusBar } from "./components/Status/StatusBar";
import { ConversationHistory } from "./components/History";
import {
  SettingsModal,
  MCPModal,
  ModelSelectorModal,
  PermissionModal,
  InstallModal,
  SlashCommandsModal,
} from "./components/Modals";

// Stores
import {
  useChatStore,
  useSettingsStore,
  useUIStore,
  usePermissionStore,
  useConversationStore,
  useMCPStore,
  selectActiveModal,
  selectIsConnected,
  selectFirstPending,
  selectWSL,
} from "./stores";

// Hooks
import { useMessages } from "./hooks/useMessages";
import { useVSCode } from "./hooks/useVSCode";

// Types
import type {
  ChatMessage,
  PermissionRequest,
  PermissionDecision,
} from "./types";
import type { ConversationListItem } from "./types/history";
import type { TodoItem } from "./components/Tools";
import { extractTodosFromInput, getTodoStats } from "./utils";

// ============================================================================
// WSL Alert Component
// ============================================================================

interface WSLAlertProps {
  onDismiss: () => void;
  onConfigure: () => void;
}

const WSLAlert: React.FC<WSLAlertProps> = ({ onDismiss, onConfigure }) => (
  <div
    className="flex items-center justify-between px-4 py-2 text-sm"
    style={{
      backgroundColor: "var(--vscode-inputValidation-warningBackground)",
      borderBottom: "1px solid var(--vscode-inputValidation-warningBorder)",
    }}
  >
    <span>
      Running on Windows without WSL configured. Some features may not work
      correctly.
    </span>
    <div className="flex gap-2">
      <button onClick={onConfigure} className="btn btn-secondary text-xs">
        Configure WSL
      </button>
      <button onClick={onDismiss} className="btn-icon" aria-label="Dismiss">
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  </div>
);

// ============================================================================
// Conversation Restore Helpers
// ============================================================================

interface StoredConversationMessage {
  type: string;
  data?: unknown;
  timestamp?: string;
  [key: string]: unknown;
}

interface RestoreStatePayload {
  messages?: StoredConversationMessage[];
  sessionId?: string;
  totalCost?: number;
  totalTokens?: {
    input: number;
    output: number;
  };
  conversationId?: string;
  isProcessing?: boolean;
}

const toTimestamp = (value: unknown): number => {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? Date.now() : parsed;
  }
  return Date.now();
};

const toStringContent = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }
  if (value === undefined || value === null) {
    return "";
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const buildChatMessages = (
  messages: StoredConversationMessage[],
): ChatMessage[] => {
  const chatMessages: ChatMessage[] = [];
  const toolUseIndex = new Map<string, number>();
  let activeAssistantIndex: number | null = null;

  const finalizeAssistant = (forceClose: boolean = true) => {
    if (activeAssistantIndex === null) {
      return;
    }
    const current = chatMessages[activeAssistantIndex];
    if (forceClose && current && current.type === "assistant") {
      current.isStreaming = false;
    }
    activeAssistantIndex = null;
  };

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const timestamp = toTimestamp(message.timestamp);
    const data =
      typeof message.data === "object" && message.data !== null
        ? (message.data as Record<string, unknown>)
        : null;

    switch (message.type) {
      case "userInput": {
        finalizeAssistant();
        const content = toStringContent(message.data);
        chatMessages.push({
          id: `user-${timestamp}-${i}`,
          type: "user",
          content,
          timestamp,
        });
        break;
      }
      case "output": {
        const text =
          typeof message.text === "string"
            ? message.text
            : typeof message.data === "string"
              ? message.data
              : "";
        const isFinal =
          typeof message.isFinal === "boolean" ? message.isFinal : false;

        if (activeAssistantIndex === null) {
          if (!text && isFinal) {
            break;
          }
          const id = `assistant-${timestamp}-${i}`;
          chatMessages.push({
            id,
            type: "assistant",
            content: text,
            timestamp,
            isStreaming: !isFinal,
          });
          activeAssistantIndex = chatMessages.length - 1;
        } else {
          const current = chatMessages[activeAssistantIndex];
          if (current && current.type === "assistant") {
            current.content += text;
          }
        }

        if (isFinal) {
          finalizeAssistant();
        }
        break;
      }
      case "thinking": {
        finalizeAssistant();
        const content =
          typeof message.thinking === "string"
            ? message.thinking
            : toStringContent(message.data);
        chatMessages.push({
          id: `thinking-${timestamp}-${i}`,
          type: "thinking",
          content,
          timestamp,
        });
        break;
      }
      case "toolUse": {
        finalizeAssistant();
        const toolUseId =
          typeof message.toolUseId === "string"
            ? message.toolUseId
            : data && "toolUseId" in data
              ? String(data.toolUseId)
              : `tool-${timestamp}-${i}`;
        const toolName =
          typeof message.toolName === "string"
            ? message.toolName
            : data && "toolName" in data
              ? String(data.toolName)
              : "Tool";
        const rawInput =
          typeof message.rawInput === "object" && message.rawInput !== null
            ? (message.rawInput as Record<string, unknown>)
            : data && "rawInput" in data
              ? (data.rawInput as Record<string, unknown>)
              : ({} as Record<string, unknown>);
        const toolInfo =
          typeof message.toolInfo === "string"
            ? message.toolInfo
            : data && "toolInfo" in data
              ? String(data.toolInfo)
              : "";
        const fileContentBefore =
          typeof message.fileContentBefore === "string"
            ? message.fileContentBefore
            : data && typeof data.fileContentBefore === "string"
              ? data.fileContentBefore
              : undefined;
        const startLine =
          typeof message.startLine === "number"
            ? message.startLine
            : data && typeof data.startLine === "number"
              ? data.startLine
              : undefined;
        const startLines = Array.isArray(message.startLines)
          ? (message.startLines as number[])
          : data && Array.isArray(data.startLines)
            ? (data.startLines as number[])
            : undefined;
        const duration =
          typeof message.duration === "number"
            ? message.duration
            : data && typeof data.duration === "number"
              ? data.duration
              : undefined;
        const tokens =
          typeof message.tokens === "number"
            ? message.tokens
            : data && typeof data.tokens === "number"
              ? data.tokens
              : undefined;

        chatMessages.push({
          id: toolUseId,
          type: "tool_use",
          toolUseId,
          toolName,
          rawInput,
          toolInfo,
          status: "executing",
          timestamp,
          duration,
          tokens,
          fileContentBefore,
          startLine,
          startLines,
        });
        toolUseIndex.set(toolUseId, chatMessages.length - 1);
        break;
      }
      case "toolResult": {
        finalizeAssistant();
        const toolUseId =
          typeof message.toolUseId === "string"
            ? message.toolUseId
            : data && "toolUseId" in data
              ? String(data.toolUseId)
              : "";
        const isError =
          typeof message.isError === "boolean"
            ? message.isError
            : data && "isError" in data
              ? Boolean(data.isError)
              : false;
        const hidden =
          typeof message.hidden === "boolean"
            ? message.hidden
            : data && "hidden" in data
              ? Boolean(data.hidden)
              : false;
        const duration =
          typeof message.duration === "number"
            ? message.duration
            : data && typeof data.duration === "number"
              ? data.duration
              : undefined;
        const tokens =
          typeof message.tokens === "number"
            ? message.tokens
            : data && typeof data.tokens === "number"
              ? data.tokens
              : undefined;
        const toolName =
          typeof message.toolName === "string"
            ? message.toolName
            : data && typeof data.toolName === "string"
              ? data.toolName
              : undefined;
        const fileContentAfter =
          typeof message.fileContentAfter === "string"
            ? message.fileContentAfter
            : data && typeof data.fileContentAfter === "string"
              ? data.fileContentAfter
              : undefined;

        if (toolUseId && toolUseIndex.has(toolUseId)) {
          const index = toolUseIndex.get(toolUseId);
          if (index !== undefined) {
            const existing = chatMessages[index];
            if (existing && existing.type === "tool_use") {
              existing.status = isError ? "failed" : "completed";
              existing.duration = duration ?? existing.duration;
              existing.tokens = tokens ?? existing.tokens;
              if (fileContentAfter !== undefined) {
                existing.fileContentAfter = fileContentAfter;
              }
            }
          }
        }

        if (!hidden) {
          const content =
            typeof message.content === "string"
              ? message.content
              : data && "content" in data
                ? toStringContent(data.content)
                : "";
          chatMessages.push({
            id: `tool-result-${toolUseId || timestamp}-${i}`,
            type: "tool_result",
            toolUseId,
            content,
            timestamp,
            isError,
            hidden: false,
            toolName,
            duration,
            tokens,
            fileContentAfter,
          });
        }
        break;
      }
      case "error": {
        finalizeAssistant();
        const content =
          typeof message.message === "string"
            ? message.message
            : toStringContent(message.data);
        chatMessages.push({
          id: `error-${timestamp}-${i}`,
          type: "error",
          content,
          timestamp,
        });
        break;
      }
      default:
        break;
    }
  }

  if (activeAssistantIndex !== null) {
    activeAssistantIndex = null;
  }
  return chatMessages;
};

const findLatestTodos = (messages: ChatMessage[]): TodoItem[] => {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message.type === "tool_use" && message.toolName === "TodoWrite") {
      const todos = extractTodosFromInput(message.rawInput);
      if (todos.length > 0) {
        return todos;
      }
    }
  }

  return [];
};

const mapConversationList = (items: unknown[]): ConversationListItem[] =>
  items.map((item, index) => {
    const entry = item as Record<string, unknown>;
    const preview =
      typeof entry.preview === "string" ? entry.preview : "Conversation";
    const timestamp = toTimestamp(
      entry.timestamp ?? entry.startTime ?? entry.endTime,
    );
    const messageCount =
      typeof entry.messageCount === "number" ? entry.messageCount : 0;
    const totalCost =
      typeof entry.totalCost === "number" ? entry.totalCost : undefined;
    const sessionId =
      typeof entry.sessionId === "string" ? entry.sessionId : undefined;
    const tags = Array.isArray(entry.tags)
      ? entry.tags.filter((tag) => typeof tag === "string")
      : undefined;
    const id =
      typeof entry.filename === "string"
        ? entry.filename
        : typeof entry.id === "string"
          ? entry.id
          : sessionId || `conversation-${index}`;

    return {
      id,
      title: preview,
      preview,
      updatedAt: timestamp,
      messageCount,
      sessionId,
      totalCost,
      tags,
    };
  });

// ============================================================================
// App Component
// ============================================================================

export const App: React.FC = () => {
  const { postMessage, isVSCode } = useVSCode();

  // -------------------------------------------------------------------------
  // Store State
  // -------------------------------------------------------------------------

  // Chat store
  const messages = useChatStore((s) => s.messages);
  const isProcessing = useChatStore((s) => s.isProcessing);
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
  const resetChat = useChatStore((s) => s.resetChat);
  const tokens = useChatStore((s) => s.tokens);
  const costs = useChatStore((s) => s.costs);
  const requestStartTime = useChatStore((s) => s.requestStartTime);
  const todos = useChatStore((s) => s.todos);

  // Settings store
  const selectedModel = useSettingsStore((s) => s.selectedModel);
  const thinkingMode = useSettingsStore((s) => s.thinkingMode);
  const thinkingIntensity = useSettingsStore((s) => s.thinkingIntensity);
  const planMode = useSettingsStore((s) => s.planMode);
  const yoloMode = useSettingsStore((s) => s.yoloMode);
  const wsl = useSettingsStore(selectWSL);
  const setSelectedModel = useSettingsStore((s) => s.setSelectedModel);
  const toggleThinkingMode = useSettingsStore((s) => s.toggleThinkingMode);
  const setThinkingIntensity = useSettingsStore((s) => s.setThinkingIntensity);
  const togglePlanMode = useSettingsStore((s) => s.togglePlanMode);
  const toggleYoloMode = useSettingsStore((s) => s.toggleYoloMode);
  const loadFromVSCode = useSettingsStore((s) => s.loadFromVSCode);

  // UI store
  const activeModal = useUIStore(selectActiveModal);
  const isConnected = useUIStore(selectIsConnected);
  const openModal = useUIStore((s) => s.openModal);
  const closeModal = useUIStore((s) => s.closeModal);
  const setConnectionStatus = useUIStore((s) => s.setConnectionStatus);
  const showError = useUIStore((s) => s.showError);
  const showSuccess = useUIStore((s) => s.showSuccess);

  // Permission store
  const pendingPermission = usePermissionStore(selectFirstPending);
  const addPending = usePermissionStore((s) => s.addPending);
  const resolvePending = usePermissionStore((s) => s.resolvePending);

  // MCP store (unused but available)
  const _mcpStore = useMCPStore((s) => s.setServerStatus);

  // Conversation store (unused but available)
  useConversationStore((s) => s.setCurrentConversation);

  // -------------------------------------------------------------------------
  // Local State
  // -------------------------------------------------------------------------

  const [showWSLAlert, setShowWSLAlert] = React.useState(false);
  const [streamingMessageId, setStreamingMessageId] = React.useState<
    string | null
  >(null);
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
  const [conversationList, setConversationList] = React.useState<
    ConversationListItem[]
  >([]);
  const [isHistoryLoading, setIsHistoryLoading] = React.useState(false);
  const [activeConversationId, setActiveConversationId] = React.useState<
    string | null
  >(null);
  const [subscriptionType, setSubscriptionType] = React.useState<string | null>(
    null,
  );
  const [requestCount, setRequestCount] = React.useState(0);
  const [lastDurationMs, setLastDurationMs] = React.useState<number | null>(
    null,
  );

  const finalizeStreamingMessage = useCallback(() => {
    if (!streamingMessageId) {
      return;
    }

    useChatStore.getState().updateMessage(streamingMessageId, {
      isStreaming: false,
    });
    setStreamingMessageId(null);
  }, [streamingMessageId]);

  // -------------------------------------------------------------------------
  // Message Handlers
  // -------------------------------------------------------------------------

  const messageHandlers = useMemo(
    () => ({
      sessionInfo: (msg: {
        sessionId: string;
        tools: unknown[];
        mcpServers: unknown[];
      }) => {
        setSessionId(msg.sessionId);
        setConnectionStatus("connected");
      },

      accountInfo: (msg: { account: { subscriptionType?: string } }) => {
        const type =
          typeof msg.account?.subscriptionType === "string"
            ? msg.account.subscriptionType
            : null;
        setSubscriptionType(type);
      },

      output: (msg: { text: string; isFinal?: boolean }) => {
        if (streamingMessageId) {
          // Update existing streaming message
          const currentMsg = useChatStore
            .getState()
            .messages.find((m) => m.id === streamingMessageId);
          // Get content from message - all message types have content property
          const currentContent =
            currentMsg && "content" in currentMsg
              ? (currentMsg as { content: string }).content
              : "";
          useChatStore.getState().updateMessage(streamingMessageId, {
            content: currentContent + msg.text,
          });

          if (msg.isFinal) {
            useChatStore.getState().updateMessage(streamingMessageId, {
              isStreaming: false,
            });
            setStreamingMessageId(null);
          }
        } else {
          // Create new assistant message
          const newId = `msg-${Date.now()}`;
          const newMessage = {
            id: newId,
            type: "assistant" as const,
            content: msg.text,
            timestamp: Date.now(),
            isStreaming: !msg.isFinal,
          };
          addMessage(newMessage as ChatMessage);
          if (!msg.isFinal) {
            setStreamingMessageId(newId);
          }
        }
      },

      thinking: (msg: { thinking: string }) => {
        finalizeStreamingMessage();
        const thinkingMessage = {
          id: `thinking-${Date.now()}`,
          type: "thinking" as const,
          content: msg.thinking,
          timestamp: Date.now(),
        };
        addMessage(thinkingMessage as ChatMessage);
      },

      toolUse: (msg: {
        toolUseId: string;
        toolName: string;
        rawInput: unknown;
        toolInfo: string;
        duration?: number;
        tokens?: number;
        fileContentBefore?: string;
        startLine?: number;
        startLines?: number[];
      }) => {
        finalizeStreamingMessage();
        if (msg.toolName === "TodoWrite") {
          const nextTodos = extractTodosFromInput(msg.rawInput);
          if (nextTodos.length > 0) {
            setTodos(nextTodos);
          }
        }

        const toolMessage = {
          id: msg.toolUseId,
          type: "tool_use" as const,
          toolUseId: msg.toolUseId,
          timestamp: Date.now(),
          toolName: msg.toolName,
          rawInput: msg.rawInput as Record<string, unknown>,
          toolInfo: msg.toolInfo,
          duration: msg.duration,
          tokens: msg.tokens,
          fileContentBefore: msg.fileContentBefore,
          startLine: msg.startLine,
          startLines: msg.startLines,
          status: "executing" as const,
        };
        addMessage(toolMessage as ChatMessage);
      },

      toolResult: (msg: {
        toolUseId: string;
        content: string;
        isError: boolean;
        hidden: boolean;
        toolName?: string;
        duration?: number;
        tokens?: number;
        fileContentAfter?: string;
      }) => {
        finalizeStreamingMessage();
        // Update tool use message with result
        updateMessage(msg.toolUseId, {
          status: msg.isError ? "failed" : "completed",
          duration: msg.duration,
          tokens: msg.tokens,
          fileContentAfter: msg.fileContentAfter,
        } as Partial<ChatMessage>);

        // Add result message if not hidden
        if (!msg.hidden) {
          const resultMessage = {
            id: `result-${msg.toolUseId}`,
            type: "tool_result" as const,
            content: msg.content,
            timestamp: Date.now(),
            toolUseId: msg.toolUseId,
            toolName: msg.toolName,
            isError: msg.isError,
            hidden: false,
            duration: msg.duration,
            tokens: msg.tokens,
            fileContentAfter: msg.fileContentAfter,
          };
          addMessage(resultMessage as ChatMessage);
        }
      },

      updateTokens: (msg: {
        current: {
          input_tokens: number;
          output_tokens: number;
          cache_read_input_tokens?: number;
          cache_creation_input_tokens?: number;
        };
        total: unknown;
      }) => {
        updateTokens(msg.current);
      },

      updateTotals: (msg: {
        totalCostUsd: number;
        durationMs: number;
        numTurns: number;
        requestCount?: number;
        totalCost?: number;
      }) => {
        const sessionCost =
          typeof msg.totalCost === "number"
            ? msg.totalCost
            : costs.sessionCostUsd + msg.totalCostUsd;
        updateSessionCost(sessionCost);
        if (typeof msg.durationMs === "number") {
          setLastDurationMs(msg.durationMs);
        }
        if (typeof msg.requestCount === "number") {
          setRequestCount(msg.requestCount);
        } else {
          setRequestCount((prev) => prev + 1);
        }
        stopRequestTiming();
      },

      permissionRequest: (msg: {
        requestId: string;
        toolUseId: string;
        toolName: string;
        input: unknown;
        description: string;
        suggestions: unknown[];
      }) => {
        finalizeStreamingMessage();
        const request: PermissionRequest = {
          requestId: msg.requestId,
          toolUseId: msg.toolUseId,
          toolName: msg.toolName,
          input: msg.input as Record<string, unknown>,
          description: msg.description,
          suggestions: msg.suggestions as PermissionRequest["suggestions"],
          status: "pending",
          timestamp: Date.now(),
        };
        addPending(request);
        openModal("permission", { request });
      },

      setProcessing: (msg: { isProcessing: boolean }) => {
        setProcessing(msg.isProcessing);
        if (msg.isProcessing) {
          startRequestTiming();
        } else {
          stopRequestTiming();
        }
        if (!msg.isProcessing) {
          setStreamingMessageId(null);
        }
      },

      loading: (msg: { message?: string }) => {
        // Could show loading indicator
        console.log("Loading:", msg.message);
      },

      clearLoading: () => {
        // Hide loading indicator
      },

      error: (msg: {
        message: string;
        code?: string;
        recoverable?: boolean;
      }) => {
        finalizeStreamingMessage();
        showError("Error", msg.message);

        const errorMessage = {
          id: `error-${Date.now()}`,
          type: "error" as const,
          content: msg.message,
          timestamp: Date.now(),
          code: msg.code,
          recoverable: msg.recoverable,
        };
        addMessage(errorMessage as ChatMessage);
        setProcessing(false);
      },

      showInstallModal: (_msg: { instructions?: string }) => {
        openModal("install");
      },

      showLoginModal: (_msg: { loginUrl?: string }) => {
        openModal("login");
      },

      settingsUpdate: (msg: { settings: Record<string, unknown> }) => {
        loadFromVSCode(msg.settings);
      },

      conversationList: (msg: {
        conversations?: unknown[];
        data?: unknown[];
      }) => {
        const items = Array.isArray(msg.conversations)
          ? msg.conversations
          : Array.isArray(msg.data)
            ? msg.data
            : [];
        setConversationList(mapConversationList(items));
        setIsHistoryLoading(false);
      },

      conversationDeleted: (msg: { filename: string }) => {
        setConversationList((prev) =>
          prev.filter((item) => item.id !== msg.filename),
        );
        if (activeConversationId === msg.filename) {
          setActiveConversationId(null);
        }
      },

      themeUpdate: (_msg: { theme: "light" | "dark" }) => {
        // Theme is handled by VSCode CSS variables
      },

      restoreState: (msg: { state: unknown }) => {
        if (!msg.state || typeof msg.state !== "object") {
          return;
        }
        const state = msg.state as RestoreStatePayload;
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
            lastMessage &&
            lastMessage.type === "assistant" &&
            lastMessage.isStreaming
              ? lastMessage.id
              : null;
          setStreamingMessageId(
            state.isProcessing === false ? null : streamingId,
          );
          const restoredTodos = findLatestTodos(restoredMessages);
          if (restoredTodos.length > 0) {
            setTodos(restoredTodos);
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
            restoredMessages.filter((message) => message.type === "user")
              .length,
          );
          if (typeof state.isProcessing === "boolean") {
            setProcessing(state.isProcessing);
          }
        }
      },

      compacting: (_msg: { isCompacting: boolean }) => {
        // Handle compaction state
      },

      compactBoundary: (_msg: { trigger: string; preTokens: number }) => {
        resetTokenTracking();
      },
    }),
    [
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
    ],
  );

  // Set up message listener
  useMessages({
    enabled: true,
    handlers: messageHandlers,
    onUnhandledMessage: (msg) => {
      console.warn("Unhandled message:", msg);
    },
  });

  // -------------------------------------------------------------------------
  // Effects
  // -------------------------------------------------------------------------

  // Check for WSL on Windows
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      const isWindows =
        navigator.userAgent.includes("Windows") ||
        navigator.platform?.toLowerCase().includes("win");

      if (isWindows && !wsl.enabled) {
        setShowWSLAlert(true);
      }
    }
  }, [wsl.enabled]);

  // Request initial state from extension
  useEffect(() => {
    if (isVSCode) {
      postMessage({ type: "requestState" });
      postMessage({ type: "getSettings" });
    }
  }, [isVSCode, postMessage]);

  useEffect(() => {
    if (isVSCode && isHistoryOpen) {
      setIsHistoryLoading(true);
      postMessage({ type: "getConversationList" });
    }
  }, [isVSCode, isHistoryOpen, postMessage]);

  // -------------------------------------------------------------------------
  // Event Handlers
  // -------------------------------------------------------------------------

  const handleSendMessage = useCallback(
    (content: string, attachments?: unknown[]) => {
      // Add user message to chat
      const userMessage = {
        id: `user-${Date.now()}`,
        type: "user" as const,
        content,
        timestamp: Date.now(),
        attachments: attachments as Array<{
          type: "file" | "image";
          name: string;
          path?: string;
        }>,
      };
      addMessage(userMessage as ChatMessage);
      setProcessing(true);
      startRequestTiming();

      // Send to extension
      postMessage({
        type: "sendMessage",
        message: content,
        planMode,
        thinkingMode,
        attachments: attachments as
          | Array<{ type: "file" | "image"; path: string; name: string }>
          | undefined,
      });
    },
    [
      addMessage,
      setProcessing,
      startRequestTiming,
      postMessage,
      planMode,
      thinkingMode,
    ],
  );

  const handleStopProcessing = useCallback(() => {
    postMessage({ type: "stopGeneration" });
    setProcessing(false);
    setStreamingMessageId(null);
    stopRequestTiming();
  }, [postMessage, setProcessing, stopRequestTiming]);

  const handleNewChat = useCallback(() => {
    resetChat();
    setActiveConversationId(null);
    setRequestCount(0);
    setLastDurationMs(null);
    clearTodos();
    postMessage({ type: "clearConversation" });
    showSuccess("New Chat", "Started a new conversation");
  }, [
    resetChat,
    setActiveConversationId,
    clearTodos,
    postMessage,
    showSuccess,
  ]);

  const handleOpenSettings = useCallback(() => {
    openModal("settings");
  }, [openModal]);

  const handleToggleHistory = useCallback(() => {
    setIsHistoryOpen((prev) => !prev);
  }, []);

  const handleCloseHistory = useCallback(() => {
    setIsHistoryOpen(false);
  }, []);

  const handleConversationLoad = useCallback(
    (id: string) => {
      postMessage({ type: "loadConversation", filename: id });
      setActiveConversationId(id);
      showSuccess("Conversation Loaded", "Previous conversation restored");
    },
    [postMessage, showSuccess, setActiveConversationId],
  );

  const handleConversationDelete = useCallback(
    (id: string) => {
      postMessage({ type: "deleteConversation", filename: id });
    },
    [postMessage],
  );

  const handleModelChange = useCallback(
    (model: string) => {
      const typedModel = model as Parameters<typeof setSelectedModel>[0];
      setSelectedModel(typedModel);
      // Send model change - use claude.defaultModel to match SettingsState structure
      postMessage({
        type: "saveSettings",
        settings: {
          claude: { defaultModel: typedModel },
        } as Partial<import("./types/state").SettingsState>,
      });
    },
    [setSelectedModel, postMessage],
  );

  const handlePlanModeToggle = useCallback(() => {
    togglePlanMode();
  }, [togglePlanMode]);

  const handleThinkingModeToggle = useCallback(() => {
    toggleThinkingMode();
  }, [toggleThinkingMode]);

  const handleThinkingIntensityChange = useCallback(
    (intensity: "think" | "think-hard" | "think-harder" | "ultrathink") => {
      setThinkingIntensity(intensity);
    },
    [setThinkingIntensity],
  );

  const handleYoloModeToggle = useCallback(() => {
    const newYoloMode = !yoloMode;
    toggleYoloMode();
    // Sync with VSCode settings so extension uses updated value
    postMessage({
      type: "saveSettings",
      settings: { yoloMode: newYoloMode } as Record<string, unknown>,
    });
  }, [toggleYoloMode, yoloMode, postMessage]);

  const handleFileSelect = useCallback(() => {
    openModal("model"); // Placeholder - would open file picker
  }, [openModal]);

  const handleImageSelect = useCallback(() => {
    postMessage({ type: "openFile", filePath: "", preview: true });
  }, [postMessage]);

  const handleSlashCommand = useCallback(() => {
    openModal("keyboard-shortcuts");
  }, [openModal]);

  const handleMcpAction = useCallback(() => {
    openModal("mcp");
  }, [openModal]);

  const handlePermissionResponse = useCallback(
    (requestId: string, decision: PermissionDecision) => {
      resolvePending(requestId, decision);
      postMessage({
        type: "permissionResponse",
        requestId,
        decision,
      });
      closeModal();
    },
    [resolvePending, postMessage, closeModal],
  );

  const handleWSLConfigure = useCallback(() => {
    openModal("settings");
    setShowWSLAlert(false);
  }, [openModal]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  // Build session info from current state
  const session = useChatStore.getState().currentSessionId
    ? {
        id: useChatStore.getState().currentSessionId || "",
        name: "Current Session",
        startedAt: new Date(),
        messageCount: messages.length,
      }
    : null;
  const totalTokens =
    tokens.cumulative.totalInputTokens + tokens.cumulative.totalOutputTokens;
  const todoStats = todos.length > 0 ? getTodoStats(todos) : null;

  return (
    <div className="flex flex-col h-screen bg-[var(--vscode-editor-background)] text-[var(--vscode-editor-foreground)]">
      {/* WSL Alert for Windows users */}
      {showWSLAlert && (
        <WSLAlert
          onDismiss={() => setShowWSLAlert(false)}
          onConfigure={handleWSLConfigure}
        />
      )}

      {/* Header */}
      <Header
        session={session}
        onNewChat={handleNewChat}
        onOpenSettings={handleOpenSettings}
        onToggleHistory={handleToggleHistory}
        isHistoryOpen={isHistoryOpen}
        summary={{
          totalTokens,
          sessionCostUsd: costs.sessionCostUsd,
          subscriptionType,
          todoStats,
        }}
      />

      {/* Conversation History Panel */}
      <ConversationHistory
        isOpen={isHistoryOpen}
        onClose={handleCloseHistory}
        onConversationLoad={handleConversationLoad}
        onConversationDelete={handleConversationDelete}
        conversations={conversationList}
        isLoading={isHistoryLoading}
        activeConversationId={activeConversationId}
      />

      {/* Chat Container */}
      <ChatContainer
        messages={messages.map((m) => ({
          id: m.id,
          role:
            m.type === "user"
              ? "user"
              : m.type === "assistant"
                ? "assistant"
                : m.type === "error"
                  ? "error"
                  : "tool",
          messageType:
            m.type === "tool_use" || m.type === "tool_result"
              ? m.type
              : undefined,
          content: "content" in m ? (m as { content: string }).content : "",
          timestamp: new Date(m.timestamp),
          toolName:
            "toolName" in m ? (m as { toolName?: string }).toolName : undefined,
          toolUseId:
            "toolUseId" in m
              ? (m as { toolUseId?: string }).toolUseId
              : undefined,
          rawInput:
            "rawInput" in m
              ? (m as { rawInput?: Record<string, unknown> }).rawInput
              : undefined,
          status: "status" in m ? (m as { status?: string }).status : undefined,
          isError:
            "isError" in m ? (m as { isError?: boolean }).isError : undefined,
          hidden:
            "hidden" in m ? (m as { hidden?: boolean }).hidden : undefined,
          fileContentBefore:
            "fileContentBefore" in m
              ? (m as { fileContentBefore?: string }).fileContentBefore
              : undefined,
          fileContentAfter:
            "fileContentAfter" in m
              ? (m as { fileContentAfter?: string }).fileContentAfter
              : undefined,
          startLine:
            "startLine" in m
              ? (m as { startLine?: number }).startLine
              : undefined,
          startLines:
            "startLines" in m
              ? (m as { startLines?: number[] }).startLines
              : undefined,
          isStreaming: m.isStreaming,
          duration:
            "duration" in m ? (m as { duration?: number }).duration : undefined,
          tokens: "tokens" in m ? (m as { tokens?: number }).tokens : undefined,
        }))}
        isProcessing={isProcessing}
        todos={todos}
        currentModel={selectedModel}
        planMode={planMode}
        thinkingMode={thinkingMode}
        thinkingIntensity={thinkingIntensity}
        yoloMode={yoloMode}
        onSendMessage={handleSendMessage}
        onModelChange={handleModelChange}
        onPlanModeToggle={handlePlanModeToggle}
        onThinkingModeToggle={handleThinkingModeToggle}
        onThinkingIntensityChange={handleThinkingIntensityChange}
        onYoloModeToggle={handleYoloModeToggle}
        onFileSelect={handleFileSelect}
        onImageSelect={handleImageSelect}
        onSlashCommand={handleSlashCommand}
        onMcpAction={handleMcpAction}
      />

      {/* Status Bar */}
      <StatusBar
        isConnected={isConnected}
        isProcessing={isProcessing}
        onStop={handleStopProcessing}
        totalTokens={totalTokens}
        requestCount={requestCount}
        sessionCostUsd={costs.sessionCostUsd}
        lastDurationMs={lastDurationMs}
        requestStartTime={requestStartTime}
        subscriptionType={subscriptionType}
      />

      {/* Modals */}
      {activeModal === "settings" && (
        <SettingsModal isOpen={true} onClose={closeModal} />
      )}

      {activeModal === "mcp" && <MCPModal isOpen={true} onClose={closeModal} />}

      {activeModal === "model" && (
        <ModelSelectorModal
          isOpen={true}
          onClose={closeModal}
          selectedModel={
            selectedModel === "claude-opus-4-5-20251101"
              ? "opus"
              : selectedModel === "claude-haiku-4-5-20251001"
                ? "haiku"
                : "sonnet"
          }
          onSelectModel={(model) => {
            const modelMap: Record<string, string> = {
              opus: "claude-opus-4-5-20251101",
              sonnet: "claude-sonnet-4-5-20250929",
              haiku: "claude-haiku-4-5-20251001",
            };
            handleModelChange(modelMap[model] || "claude-sonnet-4-5-20250929");
          }}
          onConfigure={() => openModal("settings")}
        />
      )}

      {activeModal === "permission" && pendingPermission && (
        <PermissionModal
          isOpen={true}
          onClose={closeModal}
          request={{
            id: pendingPermission.requestId,
            toolName: pendingPermission.toolName,
            description: pendingPermission.description,
            input:
              typeof pendingPermission.input === "object" &&
              pendingPermission.input !== null
                ? (pendingPermission.input as Record<string, unknown>)
                : {},
          }}
          onAllow={() =>
            handlePermissionResponse(pendingPermission.requestId, "allow")
          }
          onDeny={() =>
            handlePermissionResponse(pendingPermission.requestId, "deny")
          }
          onAlwaysAllow={() =>
            handlePermissionResponse(pendingPermission.requestId, "allow")
          }
        />
      )}

      {activeModal === "install" && (
        <InstallModal isOpen={true} onClose={closeModal} />
      )}

      {activeModal === "keyboard-shortcuts" && (
        <SlashCommandsModal
          isOpen={true}
          onClose={closeModal}
          customCommands={[]}
          onExecuteCommand={(cmd) => {
            closeModal();
            if (cmd.prompt) {
              handleSendMessage(cmd.prompt);
            } else {
              handleSendMessage(cmd.name);
            }
          }}
          onAddCustomCommand={() => {}}
          onDeleteCustomCommand={() => {}}
          onQuickCommand={(cmd: string) => {
            closeModal();
            handleSendMessage(cmd);
          }}
        />
      )}
    </div>
  );
};

export default App;
