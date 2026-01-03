/**
 * Additional Enums for Type Safety
 *
 * This module contains enums that were previously hardcoded strings
 * throughout the codebase. Moving them here provides type safety
 * and better maintainability.
 *
 * @module shared/constants/enums
 */

// ============================================================================
// File System Enums
// ============================================================================

/**
 * File system item types for file picker and attachments
 */
export enum FileSystemItemType {
    File = "file",
    Directory = "directory",
    Symlink = "symlink",
    Image = "image",
}

/**
 * Attachment status states
 */
export enum AttachmentStatus {
    Pending = "pending",
    Uploading = "uploading",
    Ready = "ready",
    Error = "error",
}

/**
 * Attachment types
 */
export enum AttachmentType {
    File = "file",
    Image = "image",
    Directory = "directory",
}

// ============================================================================
// MCP Server Enums
// ============================================================================

/**
 * MCP server connection types
 */
export enum MCPConnectionType {
    HTTP = "http",
    SSE = "sse",
    STDIO = "stdio",
}

/**
 * MCP server categories for organization
 */
export enum MCPServerCategory {
    Filesystem = "filesystem",
    Git = "git",
    Database = "database",
    Web = "web",
    Tools = "tools",
    Other = "other",
}

// ============================================================================
// UI State Enums
// ============================================================================

/**
 * Copy operation states
 */
export enum CopyState {
    Idle = "idle",
    Copied = "copied",
    Error = "error",
}

/**
 * Install process states
 */
export enum InstallState {
    Initial = "initial",
    Installing = "installing",
    Success = "success",
    Error = "error",
}

/**
 * Loading states for async operations
 */
export enum LoadingState {
    Idle = "idle",
    Loading = "loading",
    Success = "success",
    Error = "error",
}

// ============================================================================
// Content Type Enums
// ============================================================================

/**
 * Clipboard content types
 */
export enum ClipboardContentType {
    Text = "text",
    Image = "image",
    HTML = "html",
    File = "file",
    Unknown = "unknown",
}

/**
 * Export format types
 */
export enum ExportFormat {
    JSON = "json",
    Markdown = "markdown",
}

/**
 * Code insert position
 */
export enum InsertPosition {
    Cursor = "cursor",
    NewFile = "newFile",
}

// ============================================================================
// Diff Enums
// ============================================================================

/**
 * Diff line types for diff viewer
 */
export enum DiffLineType {
    Context = "context",
    Added = "added",
    Removed = "removed",
    Equal = "equal",
    Insert = "insert",
    Delete = "delete",
}

// ============================================================================
// Command Enums
// ============================================================================

/**
 * Slash command types
 */
export enum SlashCommandType {
    Builtin = "builtin",
    Custom = "custom",
    Snippet = "snippet",
}

/**
 * Mention suggestion types
 */
export enum MentionSuggestionType {
    File = "file",
    Tool = "tool",
    Command = "command",
}

// ============================================================================
// Message Group Enums
// ============================================================================

/**
 * Message group types for grouping related messages
 */
export enum MessageGroupType {
    ToolInteraction = "tool_interaction",
    ThinkingBlock = "thinking_block",
    Conversation = "conversation",
}

// ============================================================================
// Display Name Mappings
// ============================================================================

/**
 * Display names for MCP connection types
 */
export const MCP_CONNECTION_TYPE_LABELS: Record<MCPConnectionType, string> = {
    [MCPConnectionType.HTTP]: "HTTP",
    [MCPConnectionType.SSE]: "SSE",
    [MCPConnectionType.STDIO]: "STDIO",
};

/**
 * Display names for file system item types
 */
export const FILE_SYSTEM_ITEM_TYPE_LABELS: Record<FileSystemItemType, string> = {
    [FileSystemItemType.File]: "File",
    [FileSystemItemType.Directory]: "Directory",
    [FileSystemItemType.Symlink]: "Symlink",
    [FileSystemItemType.Image]: "Image",
};

/**
 * Display names for install states
 */
export const INSTALL_STATE_LABELS: Record<InstallState, string> = {
    [InstallState.Initial]: "Ready to Install",
    [InstallState.Installing]: "Installing...",
    [InstallState.Success]: "Installed Successfully",
    [InstallState.Error]: "Installation Failed",
};

/**
 * Display names for slash command types
 */
export const SLASH_COMMAND_TYPE_LABELS: Record<SlashCommandType, string> = {
    [SlashCommandType.Builtin]: "Built-in",
    [SlashCommandType.Custom]: "Custom",
    [SlashCommandType.Snippet]: "Snippet",
};
