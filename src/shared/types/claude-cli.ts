/**
 * Claude CLI Message Types
 *
 * Type definitions for messages received from the Claude CLI process.
 * These types represent the JSON messages output by the Claude CLI.
 *
 * @module shared/types/claude-cli
 */

// ============================================================================
// Base Types
// ============================================================================

/**
 * Base message from Claude CLI
 */
export interface ClaudeCliMessage {
    type: "system" | "assistant" | "user" | "result" | "accountInfo";
}

// ============================================================================
// System Messages
// ============================================================================

export interface SystemInitMessage extends ClaudeCliMessage {
    type: "system";
    subtype: "init";
    session_id: string;
    tools?: unknown[];
    mcp_servers?: unknown[];
}

export interface SystemStatusMessage extends ClaudeCliMessage {
    type: "system";
    subtype: "status";
    status: "compacting" | null;
}

export interface SystemCompactBoundaryMessage extends ClaudeCliMessage {
    type: "system";
    subtype: "compact_boundary";
    compact_metadata?: {
        trigger?: string;
        pre_tokens?: number;
    };
}

export type SystemMessage = SystemInitMessage | SystemStatusMessage | SystemCompactBoundaryMessage;

// ============================================================================
// Content Types
// ============================================================================

export interface TextContent {
    type: "text";
    text: string;
}

export interface ThinkingContent {
    type: "thinking";
    thinking: string;
}

export interface ToolUseContent {
    type: "tool_use";
    id?: string;
    tool_use_id?: string;
    name: string;
    input?: Record<string, unknown>;
}

export interface ToolResultContent {
    type: "tool_result";
    tool_use_id?: string;
    content?: string | unknown;
    is_error?: boolean;
}

export type ContentBlock = TextContent | ThinkingContent | ToolUseContent | ToolResultContent;

// ============================================================================
// Usage Types
// ============================================================================

export interface TokenUsage {
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
}

// ============================================================================
// Assistant Message
// ============================================================================

export interface AssistantMessage extends ClaudeCliMessage {
    type: "assistant";
    message?: {
        content: ContentBlock[];
        usage?: TokenUsage;
    };
}

// ============================================================================
// User Message
// ============================================================================

export interface UserMessage extends ClaudeCliMessage {
    type: "user";
    message?: {
        content: (TextContent | ToolResultContent)[];
    };
}

// ============================================================================
// Result Message
// ============================================================================

export interface ResultSuccessMessage extends ClaudeCliMessage {
    type: "result";
    subtype: "success";
    session_id?: string;
    total_cost_usd?: number;
    duration_ms?: number;
    num_turns?: number;
}

export interface ResultErrorMessage extends ClaudeCliMessage {
    type: "result";
    subtype: "error";
    error?: string;
    message?: string;
}

export type ResultMessage = ResultSuccessMessage | ResultErrorMessage;

// ============================================================================
// Account Info Message
// ============================================================================

export interface AccountInfoMessage extends ClaudeCliMessage {
    type: "accountInfo";
    account?: {
        subscriptionType?: string;
        email?: string;
    };
}

// ============================================================================
// Permission Request
// ============================================================================

export interface PermissionRequest {
    requestId: string;
    toolUseId?: string;
    toolName: string;
    input?: Record<string, unknown>;
    description?: string;
    suggestions?: PermissionSuggestion[];
    decisionReason?: string;
    blockedPath?: string;
}

export interface PermissionSuggestion {
    type: "allow" | "deny" | "allow_always";
    description?: string;
}

// ============================================================================
// Union Type
// ============================================================================

export type ClaudeMessage =
    | SystemMessage
    | AssistantMessage
    | UserMessage
    | ResultMessage
    | AccountInfoMessage;

// ============================================================================
// Type Guards
// ============================================================================

export function isSystemMessage(message: ClaudeCliMessage): message is SystemMessage {
    return message.type === "system";
}

export function isAssistantMessage(message: ClaudeCliMessage): message is AssistantMessage {
    return message.type === "assistant";
}

export function isUserMessage(message: ClaudeCliMessage): message is UserMessage {
    return message.type === "user";
}

export function isResultMessage(message: ClaudeCliMessage): message is ResultMessage {
    return message.type === "result";
}

export function isAccountInfoMessage(message: ClaudeCliMessage): message is AccountInfoMessage {
    return message.type === "accountInfo";
}
