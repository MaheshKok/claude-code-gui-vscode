/**
 * Chat Message Types
 *
 * These types define the structure of messages displayed in the chat UI,
 * including regular messages, tool interactions, thinking blocks,
 * and permission requests.
 *
 * @module messages
 */

import type {
    ToolInput,
    TokenUsage,
    PermissionSuggestion,
    PermissionDecision,
} from "./claude-events";

import {
    MessageType,
    MessageRole,
    ToolExecutionStatus,
    PermissionStatus,
    SystemMessageSeverity,
    ErrorAction,
} from "../../shared/constants";

// Re-export enums for backward compatibility
export {
    MessageType,
    MessageRole,
    ToolExecutionStatus,
    PermissionStatus,
    SystemMessageSeverity,
    ErrorAction,
};

// ============================================================================
// Base Message Types
// ============================================================================

/**
 * All possible message types in the chat (backward compatible type alias)
 * @deprecated Use MessageType enum instead
 */
export type MessageTypeValue = `${MessageType}`;

/**
 * Message sender role (backward compatible type alias)
 * @deprecated Use MessageRole enum instead
 */
export type MessageRoleValue = `${MessageRole}`;

/**
 * Base interface for all chat messages
 */
export interface BaseMessage {
    /** Unique message identifier */
    id: string;
    /** Message type discriminator */
    type: MessageType | MessageTypeValue;
    /** Timestamp when the message was created */
    timestamp: number;
    /** Whether the message is still being streamed */
    isStreaming?: boolean;
}

/**
 * Union type of all message types
 */
export type ChatMessage =
    | UserMessage
    | AssistantMessage
    | ToolUseMessage
    | ToolResultMessage
    | ThinkingMessage
    | ErrorMessage
    | SystemMessage;

// ============================================================================
// User Message
// ============================================================================

/**
 * A message sent by the user
 */
export interface UserMessage extends BaseMessage {
    type: MessageType.User | "user";
    /** The message content */
    content: string;
    /** Optional file attachments */
    attachments?: MessageAttachment[];
}

/**
 * File attachment for a message
 */
export interface MessageAttachment {
    /** Attachment type */
    type: "file" | "image";
    /** File name */
    name: string;
    /** File path (for files) */
    path?: string;
    /** MIME type */
    mimeType?: string;
    /** File size in bytes */
    size?: number;
    /** Base64 encoded content (for inline display) */
    content?: string;
}

// ============================================================================
// Assistant Message
// ============================================================================

/**
 * A message from the assistant (Claude)
 */
export interface AssistantMessage extends BaseMessage {
    type: MessageType.Assistant | "assistant";
    /** The text content of the message */
    content: string;
    /** Token usage for this message */
    usage?: TokenUsage;
    /** Model that generated the response */
    model?: string;
    /** Whether this message is complete */
    isComplete?: boolean;
}

// ============================================================================
// Tool Use Message
// ============================================================================

/**
 * A message representing a tool invocation
 */
export interface ToolUseMessage extends BaseMessage {
    type: MessageType.ToolUse | "tool_use";
    /** Unique ID for this tool use (from Claude) */
    toolUseId: string;
    /** Name of the tool being used */
    toolName: string;
    /** Raw input passed to the tool */
    rawInput: ToolInput;
    /** Formatted human-readable tool info */
    toolInfo: string;
    /** Tool execution status */
    status: ToolExecutionStatus | ToolExecutionStatusValue;
    /** File content before the tool execution (for diff preview) */
    fileContentBefore?: string;
    /** File content after the tool execution (for diff preview) */
    fileContentAfter?: string;
    /** Starting line number for diff context */
    startLine?: number;
    /** Array of starting line numbers (for MultiEdit) */
    startLines?: number[];
    /** Duration of tool execution in ms */
    duration?: number;
    /** Token count for this tool use */
    tokens?: number;
    /** Cache read tokens for this tool use */
    cacheReadTokens?: number;
    /** Cache creation tokens for this tool use */
    cacheCreationTokens?: number;
}

/**
 * Tool execution status (backward compatible type alias)
 * @deprecated Use ToolExecutionStatus enum instead
 */
export type ToolExecutionStatusValue = `${ToolExecutionStatus}`;

// ============================================================================
// Tool Result Message
// ============================================================================

/**
 * A message representing the result of a tool execution
 */
export interface ToolResultMessage extends BaseMessage {
    type: MessageType.ToolResult | "tool_result";
    /** ID of the tool_use this is a result for */
    toolUseId: string;
    /** Tool name (for display purposes) */
    toolName?: string;
    /** The result content */
    content: string;
    /** Whether the tool execution resulted in an error */
    isError: boolean;
    /** Whether this result should be hidden in the UI */
    hidden: boolean;
    /** File content after the tool execution (for diff preview) */
    fileContentAfter?: string;
    /** Starting line number for diff context */
    startLine?: number;
    /** Array of starting line numbers (for MultiEdit) */
    startLines?: number[];
    /** Duration of tool execution in ms */
    duration?: number;
    /** Token count for this tool result */
    tokens?: number;
    /** Cache read tokens for this tool result */
    cacheReadTokens?: number;
    /** Cache creation tokens for this tool result */
    cacheCreationTokens?: number;
}

// ============================================================================
// Thinking Message
// ============================================================================

/**
 * A message representing Claude's thinking/reasoning process
 */
export interface ThinkingMessage extends BaseMessage {
    type: MessageType.Thinking | "thinking";
    /** The thinking content */
    content: string;
    /** Whether this thinking block is expanded in the UI */
    isExpanded?: boolean;
    /** Whether this thinking is still being streamed */
    isStreaming?: boolean;
}

// ============================================================================
// Error Message
// ============================================================================

/**
 * An error message
 */
export interface ErrorMessage extends BaseMessage {
    type: MessageType.Error | "error";
    /** Error message content */
    content: string;
    /** Error code (if available) */
    code?: string;
    /** Whether this is a recoverable error */
    recoverable?: boolean;
    /** Suggested action for recovery */
    suggestedAction?: ErrorAction | ErrorActionValue;
}

/**
 * Suggested error recovery action (backward compatible type alias)
 * @deprecated Use ErrorAction enum instead
 */
export type ErrorActionValue = `${ErrorAction}`;

// ============================================================================
// System Message
// ============================================================================

/**
 * A system message (non-interactive informational message)
 */
export interface SystemMessage extends BaseMessage {
    type: MessageType.System | "system";
    /** System message content */
    content: string;
    /** System message severity */
    severity: SystemMessageSeverity | SystemMessageSeverityValue;
}

/**
 * System message severity level (backward compatible type alias)
 * @deprecated Use SystemMessageSeverity enum instead
 */
export type SystemMessageSeverityValue = `${SystemMessageSeverity}`;

// ============================================================================
// Permission Request
// ============================================================================

/**
 * A permission request for tool usage
 */
export interface PermissionRequest {
    /** Unique request ID */
    requestId: string;
    /** ID of the tool_use content block */
    toolUseId: string;
    /** Name of the tool requesting permission */
    toolName: string;
    /** Input that would be passed to the tool */
    input: ToolInput;
    /** Formatted human-readable description */
    description: string;
    /** Suggested permission actions */
    suggestions: PermissionSuggestion[];
    /** Reason for the permission decision (if auto-decided) */
    decisionReason?: string;
    /** Path that was blocked (for file operations) */
    blockedPath?: string;
    /** Timestamp when the request was created */
    timestamp: number;
    /** Current status of the request */
    status: PermissionStatus | PermissionRequestStatus;
    /** The decision made (once resolved) */
    decision?: PermissionDecision;
}

/**
 * Permission request status (backward compatible type alias)
 * @deprecated Use PermissionStatus enum instead
 */
export type PermissionRequestStatus = `${PermissionStatus}`;

// ============================================================================
// Message Groups
// ============================================================================

/**
 * A group of related messages (e.g., a tool use and its result)
 */
export interface MessageGroup {
    /** Unique group identifier */
    id: string;
    /** Type of message group */
    type: MessageGroupType;
    /** Messages in this group */
    messages: ChatMessage[];
    /** Whether the group is collapsed in the UI */
    isCollapsed?: boolean;
}

/**
 * Types of message groups
 */
export type MessageGroupType =
    | "tool_interaction" // A tool_use + tool_result pair
    | "thinking_block" // A thinking block
    | "conversation"; // A user message + assistant response

// ============================================================================
// Conversation Thread
// ============================================================================

/**
 * A conversation thread containing multiple messages
 */
export interface ConversationThread {
    /** Thread identifier */
    id: string;
    /** All messages in the thread */
    messages: ChatMessage[];
    /** Grouped messages for display */
    messageGroups: MessageGroup[];
    /** Thread creation timestamp */
    createdAt: number;
    /** Last update timestamp */
    updatedAt: number;
    /** Thread title (auto-generated or user-set) */
    title?: string;
    /** Whether the thread is active */
    isActive: boolean;
}

// ============================================================================
// Message Rendering
// ============================================================================

/**
 * Options for rendering a message
 */
export interface MessageRenderOptions {
    /** Whether to show timestamps */
    showTimestamps: boolean;
    /** Whether to show tool details */
    showToolDetails: boolean;
    /** Whether to show thinking blocks */
    showThinking: boolean;
    /** Whether to enable syntax highlighting */
    enableSyntaxHighlighting: boolean;
    /** Maximum content length before truncation */
    maxContentLength?: number;
    /** Code theme for syntax highlighting */
    codeTheme?: "light" | "dark" | "auto";
}

/**
 * Diff information for file changes
 */
export interface DiffInfo {
    /** File path */
    filePath: string;
    /** Content before the change */
    before: string;
    /** Content after the change */
    after: string;
    /** Starting line number */
    startLine: number;
    /** Language for syntax highlighting */
    language?: string;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for UserMessage
 */
export function isUserMessage(message: ChatMessage): message is UserMessage {
    return message.type === MessageType.User;
}

/**
 * Type guard for AssistantMessage
 */
export function isAssistantMessage(message: ChatMessage): message is AssistantMessage {
    return message.type === MessageType.Assistant;
}

/**
 * Type guard for ToolUseMessage
 */
export function isToolUseMessage(message: ChatMessage): message is ToolUseMessage {
    return message.type === MessageType.ToolUse;
}

/**
 * Type guard for ToolResultMessage
 */
export function isToolResultMessage(message: ChatMessage): message is ToolResultMessage {
    return message.type === MessageType.ToolResult;
}

/**
 * Type guard for ThinkingMessage
 */
export function isThinkingMessage(message: ChatMessage): message is ThinkingMessage {
    return message.type === MessageType.Thinking;
}

/**
 * Type guard for ErrorMessage
 */
export function isErrorMessage(message: ChatMessage): message is ErrorMessage {
    return message.type === MessageType.Error;
}

/**
 * Type guard for SystemMessage
 */
export function isSystemMessage(message: ChatMessage): message is SystemMessage {
    return message.type === MessageType.System;
}
