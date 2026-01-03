/**
 * Claude CLI Stream-JSON Event Types
 *
 * These types define the structure of events emitted by the Claude CLI
 * when running with `--output-format stream-json`. The CLI outputs
 * newline-delimited JSON objects, one per line.
 *
 * @module claude-events
 */

// ============================================================================
// Base Event Types
// ============================================================================

/**
 * Base interface for all Claude CLI events
 */
export interface BaseClaudeEvent {
    /** The type discriminator for the event */
    type: ClaudeEventType;
}

/**
 * All possible event types from the Claude CLI stream
 */
export type ClaudeEventType =
    | "system"
    | "assistant"
    | "user"
    | "result"
    | "control_request"
    | "control_response";

/**
 * Union type of all Claude CLI events
 */
export type ClaudeEvent =
    | SystemEvent
    | AssistantEvent
    | UserEvent
    | ResultEvent
    | ControlRequest
    | ControlResponse;

// ============================================================================
// System Events
// ============================================================================

/**
 * Subtypes for system events
 */
export type SystemEventSubtype = "init" | "status" | "compact_boundary";

/**
 * System event - used for session initialization, status changes,
 * and compaction metadata
 */
export interface SystemEvent extends BaseClaudeEvent {
    type: "system";
    subtype: SystemEventSubtype;
}

/**
 * System init event - session initialization with tools and MCP servers
 */
export interface SystemInitEvent extends SystemEvent {
    subtype: "init";
    /** Unique session identifier */
    session_id: string;
    /** List of available tools */
    tools: ToolDefinition[];
    /** List of connected MCP servers */
    mcp_servers: MCPServerInfo[];
}

/**
 * Tool definition as provided in system init
 */
export interface ToolDefinition {
    /** Tool name (e.g., 'Read', 'Write', 'Edit') */
    name: string;
    /** Tool description */
    description?: string;
    /** Input schema for the tool */
    input_schema?: Record<string, unknown>;
}

/**
 * MCP server information
 */
export interface MCPServerInfo {
    /** Server name */
    name: string;
    /** Server status */
    status?: "connected" | "disconnected" | "error";
    /** Available tools from this server */
    tools?: string[];
}

/**
 * System status event - indicates status changes like compacting
 */
export interface SystemStatusEvent extends SystemEvent {
    subtype: "status";
    /** Current status, null when returning to normal */
    status: "compacting" | null;
}

/**
 * System compact boundary event - marks context window compaction
 */
export interface SystemCompactBoundaryEvent extends SystemEvent {
    subtype: "compact_boundary";
    /** Metadata about the compaction */
    compact_metadata: CompactMetadata;
}

/**
 * Metadata about context compaction
 */
export interface CompactMetadata {
    /** What triggered the compaction */
    trigger: "auto" | "manual" | "limit";
    /** Number of tokens before compaction */
    pre_tokens: number;
    /** Number of tokens after compaction */
    post_tokens?: number;
}

// ============================================================================
// Assistant Events
// ============================================================================

/**
 * Assistant event - contains assistant messages and usage metadata
 */
export interface AssistantEvent extends BaseClaudeEvent {
    type: "assistant";
    /** The assistant message */
    message: AssistantMessage;
}

/**
 * Assistant message structure
 */
export interface AssistantMessage {
    /** Message ID */
    id?: string;
    /** Message role (always 'assistant' for this event type) */
    role: "assistant";
    /** Content blocks in the message */
    content: AssistantContentBlock[];
    /** Token usage information */
    usage?: TokenUsage;
    /** Model that generated the response */
    model?: string;
    /** Stop reason */
    stop_reason?: "end_turn" | "tool_use" | "max_tokens" | "stop_sequence";
}

/**
 * Token usage information
 */
export interface TokenUsage {
    /** Number of input tokens */
    input_tokens: number;
    /** Number of output tokens */
    output_tokens: number;
    /** Number of tokens read from cache */
    cache_read_input_tokens?: number;
    /** Number of tokens written to cache */
    cache_creation_input_tokens?: number;
}

/**
 * Union type of all assistant content block types
 */
export type AssistantContentBlock = TextContentBlock | ThinkingContentBlock | ToolUseContentBlock;

/**
 * Base interface for content blocks
 */
export interface BaseContentBlock {
    type: "text" | "thinking" | "tool_use";
}

/**
 * Text content block - regular assistant text output
 */
export interface TextContentBlock extends BaseContentBlock {
    type: "text";
    /** The text content */
    text: string;
}

/**
 * Thinking content block - Claude's reasoning/thinking process
 */
export interface ThinkingContentBlock extends BaseContentBlock {
    type: "thinking";
    /** The thinking content */
    thinking: string;
}

/**
 * Tool use content block - a tool invocation by the assistant
 */
export interface ToolUseContentBlock extends BaseContentBlock {
    type: "tool_use";
    /** Unique identifier for this tool use */
    id: string;
    /** Name of the tool being used */
    name: string;
    /** Input parameters for the tool */
    input: ToolInput;
}

/**
 * Tool input - varies by tool type
 */
export type ToolInput = Record<string, unknown>;

// ============================================================================
// Specific Tool Inputs
// ============================================================================

/**
 * Read tool input
 */
export interface ReadToolInput {
    /** File path to read */
    file_path: string;
    /** Starting line number (optional) */
    start_line?: number;
    /** Ending line number (optional) */
    end_line?: number;
}

/**
 * Write tool input
 */
export interface WriteToolInput {
    /** File path to write */
    file_path: string;
    /** Content to write */
    content: string;
}

/**
 * Edit tool input
 */
export interface EditToolInput {
    /** File path to edit */
    file_path: string;
    /** String to find and replace */
    old_string: string;
    /** Replacement string */
    new_string: string;
}

/**
 * MultiEdit tool input
 */
export interface MultiEditToolInput {
    /** File path to edit */
    file_path: string;
    /** Array of edits to apply */
    edits: Array<{
        old_string: string;
        new_string: string;
    }>;
}

/**
 * TodoWrite tool input
 */
export interface TodoWriteToolInput {
    /** List of todo items */
    todos: TodoItem[];
}

/**
 * Todo item structure
 */
export interface TodoItem {
    /** Todo ID */
    id?: string;
    /** Todo content/description */
    content: string;
    /** Todo status */
    status: "pending" | "in_progress" | "completed";
    /** Priority level */
    priority?: "low" | "medium" | "high";
}

/**
 * Bash tool input
 */
export interface BashToolInput {
    /** Command to execute */
    command: string;
    /** Working directory (optional) */
    cwd?: string;
    /** Timeout in milliseconds (optional) */
    timeout?: number;
}

// ============================================================================
// User Events
// ============================================================================

/**
 * User event - contains tool results written as user-role content
 */
export interface UserEvent extends BaseClaudeEvent {
    type: "user";
    /** The user message containing tool results */
    message: UserMessage;
}

/**
 * User message structure
 */
export interface UserMessage {
    /** Message ID */
    id?: string;
    /** Message role (always 'user' for this event type) */
    role: "user";
    /** Content blocks in the message */
    content: UserContentBlock[];
}

/**
 * Union type of all user content block types
 */
export type UserContentBlock = ToolResultContentBlock;

/**
 * Tool result content block
 */
export interface ToolResultContentBlock {
    type: "tool_result";
    /** ID of the tool_use this is a result for */
    tool_use_id: string;
    /** Result content (string or array of content items) */
    content: string | ToolResultContent[];
    /** Whether the tool execution resulted in an error */
    is_error?: boolean;
}

/**
 * Tool result content item
 */
export interface ToolResultContent {
    type: "text" | "image";
    /** Text content (for type 'text') */
    text?: string;
    /** Image source (for type 'image') */
    source?: {
        type: "base64";
        media_type: string;
        data: string;
    };
}

// ============================================================================
// Result Events
// ============================================================================

/**
 * Result event subtype
 */
export type ResultSubtype = "success" | "error";

/**
 * Result event - final result for the request
 */
export interface ResultEvent extends BaseClaudeEvent {
    type: "result";
    /** Result subtype */
    subtype: ResultSubtype;
    /** Session ID */
    session_id: string;
    /** Total cost in USD */
    total_cost_usd: number;
    /** Duration in milliseconds */
    duration_ms: number;
    /** Number of conversation turns */
    num_turns: number;
    /** Available tools at end of session */
    tools?: ToolDefinition[];
    /** Connected MCP servers at end of session */
    mcp_servers?: MCPServerInfo[];
    /** Whether the result is an error */
    is_error: boolean;
    /** Result content or error message */
    result: string;
}

// ============================================================================
// Control Request Events
// ============================================================================

/**
 * Control request subtype
 */
export type ControlRequestSubtype = "can_use_tool";

/**
 * Control request - permission requests delivered via stdio
 */
export interface ControlRequest extends BaseClaudeEvent {
    type: "control_request";
    /** Request subtype */
    subtype: ControlRequestSubtype;
    /** Unique ID for this request */
    request_id: string;
}

/**
 * Can use tool control request - asks permission to use a tool
 */
export interface CanUseToolRequest extends ControlRequest {
    subtype: "can_use_tool";
    /** Name of the tool requesting permission */
    tool_name: string;
    /** Input that would be passed to the tool */
    input: ToolInput;
    /** ID of the tool_use content block */
    tool_use_id: string;
    /** Suggested permission actions */
    permission_suggestions?: PermissionSuggestion[];
    /** Reason for the permission decision (if auto-decided) */
    decision_reason?: string;
    /** Path that was blocked (for file operations) */
    blocked_path?: string;
}

/**
 * Permission suggestion
 */
export interface PermissionSuggestion {
    /** Type of permission */
    type: "allow_once" | "allow_session" | "allow_always" | "deny";
    /** Human-readable description */
    description?: string;
}

// ============================================================================
// Control Response Events
// ============================================================================

/**
 * Control response - responses to the extension's control requests
 */
export interface ControlResponse extends BaseClaudeEvent {
    type: "control_response";
    /** ID of the request this responds to */
    request_id: string;
    /** The response data */
    response: ControlResponseData;
}

/**
 * Control response data
 */
export interface ControlResponseData {
    /** Response details */
    response: {
        /** Account information (from initialize response) */
        account?: AccountInfo;
    };
}

/**
 * Account information
 */
export interface AccountInfo {
    /** Subscription type */
    subscriptionType: "free" | "pro" | "team" | "enterprise";
    /** Account email */
    email?: string;
    /** Account ID */
    id?: string;
    /** Organization name (for team/enterprise) */
    organization?: string;
}

// ============================================================================
// Permission Response (Extension to CLI)
// ============================================================================

/**
 * Permission response sent from extension to CLI via stdin
 */
export interface PermissionResponse {
    type: "permission_response";
    /** ID of the request being responded to */
    request_id: string;
    /** The permission decision */
    decision: PermissionDecision;
}

/**
 * Permission decision type
 */
export type PermissionDecision = "allow" | "deny" | "allow_session" | "allow_always";

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for SystemEvent
 */
export function isSystemEvent(event: ClaudeEvent): event is SystemEvent {
    return event.type === "system";
}

/**
 * Type guard for SystemInitEvent
 */
export function isSystemInitEvent(event: ClaudeEvent): event is SystemInitEvent {
    return event.type === "system" && (event as SystemEvent).subtype === "init";
}

/**
 * Type guard for SystemStatusEvent
 */
export function isSystemStatusEvent(event: ClaudeEvent): event is SystemStatusEvent {
    return event.type === "system" && (event as SystemEvent).subtype === "status";
}

/**
 * Type guard for SystemCompactBoundaryEvent
 */
export function isSystemCompactBoundaryEvent(
    event: ClaudeEvent,
): event is SystemCompactBoundaryEvent {
    return event.type === "system" && (event as SystemEvent).subtype === "compact_boundary";
}

/**
 * Type guard for AssistantEvent
 */
export function isAssistantEvent(event: ClaudeEvent): event is AssistantEvent {
    return event.type === "assistant";
}

/**
 * Type guard for UserEvent
 */
export function isUserEvent(event: ClaudeEvent): event is UserEvent {
    return event.type === "user";
}

/**
 * Type guard for ResultEvent
 */
export function isResultEvent(event: ClaudeEvent): event is ResultEvent {
    return event.type === "result";
}

/**
 * Type guard for ControlRequest
 */
export function isControlRequest(event: ClaudeEvent): event is ControlRequest {
    return event.type === "control_request";
}

/**
 * Type guard for CanUseToolRequest
 */
export function isCanUseToolRequest(event: ClaudeEvent): event is CanUseToolRequest {
    return event.type === "control_request" && (event as ControlRequest).subtype === "can_use_tool";
}

/**
 * Type guard for ControlResponse
 */
export function isControlResponse(event: ClaudeEvent): event is ControlResponse {
    return event.type === "control_response";
}

/**
 * Type guard for TextContentBlock
 */
export function isTextContentBlock(block: AssistantContentBlock): block is TextContentBlock {
    return block.type === "text";
}

/**
 * Type guard for ThinkingContentBlock
 */
export function isThinkingContentBlock(
    block: AssistantContentBlock,
): block is ThinkingContentBlock {
    return block.type === "thinking";
}

/**
 * Type guard for ToolUseContentBlock
 */
export function isToolUseContentBlock(block: AssistantContentBlock): block is ToolUseContentBlock {
    return block.type === "tool_use";
}

/**
 * Type guard for ToolResultContentBlock
 */
export function isToolResultContentBlock(block: UserContentBlock): block is ToolResultContentBlock {
    return block.type === "tool_result";
}
