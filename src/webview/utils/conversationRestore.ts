/**
 * Conversation Restore Utilities
 *
 * Utilities for restoring conversation state from stored messages.
 * Handles the complex task of rebuilding chat messages from
 * various message types stored in conversation history.
 *
 * @module utils/conversationRestore
 */

import type { ChatMessage, TokenUsage } from "../types";
import type { ConversationListItem } from "../types/history";
import type { TodoItem } from "../components/Tools";
import { extractTodosFromInput } from "./todos";
import { MessageType, ToolExecutionStatus } from "../../shared/constants";

// ============================================================================
// Types
// ============================================================================

export interface StoredConversationMessage {
    type: string;
    data?: unknown;
    timestamp?: string;
    [key: string]: unknown;
}

export interface RestoreStatePayload {
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

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert a value to a timestamp (number of milliseconds since epoch)
 */
export const toTimestamp = (value: unknown): number => {
    if (typeof value === "number") {
        return value;
    }
    if (typeof value === "string") {
        const parsed = Date.parse(value);
        return Number.isNaN(parsed) ? Date.now() : parsed;
    }
    return Date.now();
};

/**
 * Convert a value to a string, handling various input types
 */
export const toStringContent = (value: unknown): string => {
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

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Build ChatMessage array from stored conversation messages.
 * Handles merging of streaming assistant messages, tool use/result pairing,
 * and token usage attribution.
 */
export const buildChatMessages = (messages: StoredConversationMessage[]): ChatMessage[] => {
    const chatMessages: ChatMessage[] = [];
    const toolUseIndex = new Map<string, number>();
    let activeAssistantIndex: number | null = null;
    let pendingUsage: TokenUsage | null = null;

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
                    type: MessageType.User,
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
                const isFinal = typeof message.isFinal === "boolean" ? message.isFinal : false;

                if (activeAssistantIndex === null) {
                    if (!text && isFinal) {
                        break;
                    }
                    const id = `assistant-${timestamp}-${i}`;
                    chatMessages.push({
                        id,
                        type: MessageType.Assistant,
                        content: text,
                        timestamp,
                        isStreaming: !isFinal,
                        usage: pendingUsage ?? undefined,
                    });
                    if (pendingUsage) {
                        pendingUsage = null;
                    }
                    activeAssistantIndex = chatMessages.length - 1;
                } else {
                    const current = chatMessages[activeAssistantIndex];
                    if (current && current.type === MessageType.Assistant) {
                        current.content += text;
                        if (!current.usage && pendingUsage) {
                            current.usage = pendingUsage;
                            pendingUsage = null;
                        }
                    }
                }

                if (isFinal) {
                    finalizeAssistant();
                }
                break;
            }
            case "updateTokens": {
                const current =
                    typeof message.current === "object" && message.current !== null
                        ? (message.current as Record<string, unknown>)
                        : data && typeof data.current === "object" && data.current !== null
                          ? (data.current as Record<string, unknown>)
                          : null;
                if (
                    current &&
                    typeof current.input_tokens === "number" &&
                    typeof current.output_tokens === "number"
                ) {
                    const usage: TokenUsage = {
                        input_tokens: current.input_tokens,
                        output_tokens: current.output_tokens,
                        cache_read_input_tokens:
                            typeof current.cache_read_input_tokens === "number"
                                ? current.cache_read_input_tokens
                                : 0,
                        cache_creation_input_tokens:
                            typeof current.cache_creation_input_tokens === "number"
                                ? current.cache_creation_input_tokens
                                : 0,
                    };
                    pendingUsage = usage;
                    if (activeAssistantIndex !== null) {
                        const currentMessage = chatMessages[activeAssistantIndex];
                        if (currentMessage && currentMessage.type === MessageType.Assistant) {
                            currentMessage.usage = currentMessage.usage ?? usage;
                            pendingUsage = null;
                        }
                    } else {
                        const lastAssistant = [...chatMessages]
                            .reverse()
                            .find((msg) => msg.type === MessageType.Assistant);
                        if (lastAssistant && !lastAssistant.usage) {
                            lastAssistant.usage = usage;
                            pendingUsage = null;
                        }
                    }
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
                    type: MessageType.Thinking,
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
                const cacheReadTokens =
                    typeof message.cacheReadTokens === "number"
                        ? message.cacheReadTokens
                        : data && typeof data.cacheReadTokens === "number"
                          ? data.cacheReadTokens
                          : undefined;
                const cacheCreationTokens =
                    typeof message.cacheCreationTokens === "number"
                        ? message.cacheCreationTokens
                        : data && typeof data.cacheCreationTokens === "number"
                          ? data.cacheCreationTokens
                          : undefined;

                chatMessages.push({
                    id: toolUseId,
                    type: MessageType.ToolUse,
                    toolUseId,
                    toolName,
                    rawInput,
                    toolInfo,
                    status: ToolExecutionStatus.Executing,
                    timestamp,
                    duration,
                    tokens,
                    cacheReadTokens,
                    cacheCreationTokens,
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
                const cacheReadTokens =
                    typeof message.cacheReadTokens === "number"
                        ? message.cacheReadTokens
                        : data && typeof data.cacheReadTokens === "number"
                          ? data.cacheReadTokens
                          : undefined;
                const cacheCreationTokens =
                    typeof message.cacheCreationTokens === "number"
                        ? message.cacheCreationTokens
                        : data && typeof data.cacheCreationTokens === "number"
                          ? data.cacheCreationTokens
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
                        if (existing && existing.type === MessageType.ToolUse) {
                            existing.status = isError
                                ? ToolExecutionStatus.Failed
                                : ToolExecutionStatus.Completed;
                            existing.duration = duration ?? existing.duration;
                            existing.tokens = tokens ?? existing.tokens;
                            existing.cacheReadTokens = cacheReadTokens ?? existing.cacheReadTokens;
                            existing.cacheCreationTokens =
                                cacheCreationTokens ?? existing.cacheCreationTokens;
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
                        type: MessageType.ToolResult,
                        toolUseId,
                        content,
                        timestamp,
                        isError,
                        hidden: false,
                        toolName,
                        duration,
                        tokens,
                        cacheReadTokens,
                        cacheCreationTokens,
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
                    type: MessageType.Error,
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

/**
 * Find the latest TodoWrite message and extract todos from it
 */
export const findLatestTodos = (messages: ChatMessage[]): TodoItem[] => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
        const message = messages[i];
        if (message.type === MessageType.ToolUse && message.toolName === "TodoWrite") {
            const todos = extractTodosFromInput(message.rawInput);
            if (todos.length > 0) {
                return todos;
            }
        }
    }

    return [];
};

/**
 * Find TodoWrite message only in the last user turn (from last user message to end).
 * This matches the live behavior where todos are cleared if no TodoWrite is used
 * in the current turn.
 */
export const findTodosInLastTurn = (messages: ChatMessage[]): TodoItem[] => {
    // Find the index of the last user message
    let lastUserMessageIndex = -1;
    for (let i = messages.length - 1; i >= 0; i -= 1) {
        if (messages[i].type === MessageType.User) {
            lastUserMessageIndex = i;
            break;
        }
    }

    // If no user message found, return empty
    if (lastUserMessageIndex === -1) {
        return [];
    }

    // Only search for TodoWrite from the last user message to the end
    for (let i = messages.length - 1; i >= lastUserMessageIndex; i -= 1) {
        const message = messages[i];
        if (message.type === MessageType.ToolUse && message.toolName === "TodoWrite") {
            const todos = extractTodosFromInput(message.rawInput);
            if (todos.length > 0) {
                return todos;
            }
        }
    }

    return [];
};

/**
 * Map raw conversation list items to typed ConversationListItem objects
 */
export const mapConversationList = (items: unknown[]): ConversationListItem[] =>
    items.map((item, index) => {
        const entry = item as Record<string, unknown>;
        const preview = typeof entry.preview === "string" ? entry.preview : "Conversation";
        const timestamp = toTimestamp(entry.timestamp ?? entry.startTime ?? entry.endTime);
        const messageCount = typeof entry.messageCount === "number" ? entry.messageCount : 0;
        const totalCost = typeof entry.totalCost === "number" ? entry.totalCost : undefined;
        const sessionId = typeof entry.sessionId === "string" ? entry.sessionId : undefined;
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
