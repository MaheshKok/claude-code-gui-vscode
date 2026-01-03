/**
 * Shared type definitions for Claude Code GUI extension
 */

import { MessageStatus, ThinkingIntensity } from "../constants";

// Re-export enums for convenience
export { MessageStatus, ThinkingIntensity };

// Message Types
export interface Message {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: number;
    thinking?: ThinkingBlock;
    codeBlocks?: CodeBlock[];
    files?: FileReference[];
    error?: ErrorInfo;
    status?: MessageStatus;
}

/**
 * MessageStatus type - uses the MessageStatus enum values
 * @deprecated Import MessageStatus enum from '../constants' instead
 */
export type MessageStatusType = `${MessageStatus}`;

export interface ThinkingBlock {
    content: string;
    expanded: boolean;
    duration?: number;
}

export interface CodeBlock {
    id: string;
    language: string;
    code: string;
    filename?: string;
    highlighted?: boolean;
}

export interface FileReference {
    path: string;
    name: string;
    language?: string;
    lines?: { start: number; end: number };
}

export interface ErrorInfo {
    message: string;
    code?: string;
    stack?: string;
}

// Conversation Types
export interface Conversation {
    id: string;
    title: string;
    messages: Message[];
    createdAt: number;
    updatedAt: number;
    model?: string;
    tokenCount?: number;
    tags?: string[];
}

// Settings Types
export interface ExtensionSettings {
    claude: ClaudeSettings;
    thinking: ThinkingSettings;
    permissions: PermissionSettings;
    chat: ChatSettings;
    wsl: WslSettings;
    ui: UiSettings;
    context: ContextSettings;
}

export interface ClaudeSettings {
    executable: string;
    model: string;
}

export interface ThinkingSettings {
    enabled: boolean;
    intensity: ThinkingIntensity;
    showProcess: boolean;
}

export interface PermissionSettings {
    yoloMode: boolean;
    autoApprove: string[];
}

export interface ChatSettings {
    maxHistorySize: number;
    streamResponses: boolean;
    showTimestamps: boolean;
    codeBlockTheme: string;
}

export interface WslSettings {
    enabled: boolean;
    distro: string;
    nodePath: string;
    claudePath: string;
}

export interface UiSettings {
    fontSize: number;
    compactMode: boolean;
    showAvatars: boolean;
}

export interface ContextSettings {
    includeFileContext: boolean;
    includeWorkspaceInfo: boolean;
    maxContextLines: number;
}

// WebView Message Types
export type WebviewMessage =
    | {
          type: "sendMessage";
          payload: { content: string; context?: MessageContext };
      }
    | { type: "newConversation" }
    | { type: "loadConversation"; payload: { id: string } }
    | { type: "deleteConversation"; payload: { id: string } }
    | {
          type: "exportConversation";
          payload: { id: string; format: "json" | "markdown" };
      }
    | { type: "clearHistory" }
    | { type: "updateSettings"; payload: Partial<ExtensionSettings> }
    | { type: "cancelRequest" }
    | { type: "retryMessage"; payload: { messageId: string } }
    | { type: "copyCode"; payload: { code: string } }
    | {
          type: "insertCode";
          payload: { code: string; position?: "cursor" | "newFile" };
      }
    | { type: "openFile"; payload: { path: string; line?: number } }
    | { type: "ready" };

export type ExtensionMessage =
    | { type: "message"; payload: Message }
    | {
          type: "messageUpdate";
          payload: { id: string; content: string; status: MessageStatus };
      }
    | { type: "messageComplete"; payload: { id: string } }
    | { type: "error"; payload: ErrorInfo }
    | { type: "conversationLoaded"; payload: Conversation }
    | { type: "historyUpdated"; payload: ConversationSummary[] }
    | { type: "settingsUpdated"; payload: ExtensionSettings }
    | { type: "thinkingUpdate"; payload: { messageId: string; thinking: string } }
    | { type: "contextUpdate"; payload: MessageContext };

export interface MessageContext {
    file?: {
        path: string;
        language: string;
        content: string;
        selection?: { start: number; end: number };
    };
    workspace?: {
        name: string;
        folders: string[];
    };
}

export interface ConversationSummary {
    id: string;
    title: string;
    preview: string;
    messageCount: number;
    createdAt: number;
    updatedAt: number;
}

// Claude Process Types
export interface ClaudeProcessConfig {
    executable: string;
    workingDirectory: string;
    model?: string;
    thinkingMode?: string;
    yoloMode?: boolean;
    wsl?: WslSettings;
}

export interface ClaudeProcessEvent {
    type: "output" | "thinking" | "error" | "complete";
    data: string;
    timestamp: number;
}

// State Types
export interface ChatState {
    messages: Message[];
    isLoading: boolean;
    error: ErrorInfo | null;
    currentConversationId: string | null;
}

export interface HistoryState {
    conversations: ConversationSummary[];
    isLoading: boolean;
    selectedId: string | null;
}

// Utility Types
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Re-export Claude CLI types
export type {
    ClaudeCliMessage,
    ClaudeMessage,
    SystemMessage,
    AssistantMessage as ClaudeAssistantMessage,
    UserMessage as ClaudeUserMessage,
    ResultMessage,
    AccountInfoMessage as ClaudeAccountInfoMessage,
    PermissionRequest,
    PermissionSuggestion,
    TokenUsage as ClaudeTokenUsage,
    ContentBlock,
    TextContent,
    ThinkingContent,
    ToolUseContent,
    ToolResultContent,
} from "./claude-cli";

export {
    isSystemMessage,
    isAssistantMessage,
    isUserMessage,
    isResultMessage,
    isAccountInfoMessage,
} from "./claude-cli";
