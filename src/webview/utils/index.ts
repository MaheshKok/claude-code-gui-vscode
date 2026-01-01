/**
 * Webview Utilities
 *
 * This module exports all utility functions and constants used throughout
 * the webview application. It serves as the main entry point for importing
 * utility functionality.
 *
 * @module utils
 */

// ============================================================================
// Constants
// ============================================================================

export {
  // Tool icons
  TOOL_ICONS,
  getToolIcon,

  // Message type icons
  MESSAGE_TYPE_ICONS,

  // Default settings
  DEFAULT_THEME_SETTINGS,
  DEFAULT_EDITOR_SETTINGS,
  DEFAULT_CLAUDE_SETTINGS,
  DEFAULT_PERMISSION_SETTINGS,
  DEFAULT_DISPLAY_SETTINGS,
  DEFAULT_SHORTCUTS,

  // Token and cost constants
  TOKEN_PRICING,
  CONTEXT_WINDOW_SIZES,

  // Popular MCP servers
  POPULAR_MCP_SERVERS,

  // UI constants
  BREAKPOINTS,
  SIDEBAR_CONFIG,
  INPUT_CONFIG,
  ANIMATION_DURATIONS,
  DEBOUNCE_DELAYS,

  // Status colors
  STATUS_COLORS,
  TOOL_STATUS_COLORS,

  // Regex patterns
  PATTERNS,

  // Language mappings
  EXTENSION_TO_LANGUAGE,
  getLanguageFromPath,
} from "./constants";

export type { MCPServerConfig } from "./constants";

// ============================================================================
// Markdown
// ============================================================================

export {
  // HTML escaping
  escapeHtml,
  unescapeHtml,

  // Code block handling
  extractCodeBlocks,
  detectLanguage,

  // Inline code
  extractInlineCode,
  renderInlineCode,

  // Link handling
  parseLinks,
  renderLink,
  autoLinkUrls,

  // Main render function
  parseMarkdown,

  // Utilities
  stripMarkdown,
  getMarkdownTextLength,
} from "./markdown";

export type { CodeBlock, MarkdownRenderOptions } from "./markdown";

// ============================================================================
// Diff
// ============================================================================

export {
  // Main diff function
  computeLineDiff,
  computeContextualDiff,

  // HTML formatting
  formatDiffHtml,

  // Utilities
  calculateLineMapping,
  formatDiffStats,
  formatUnifiedDiff,
  applyDiff,
} from "./diff";

export type {
  DiffOperation,
  DiffLine,
  DiffResult,
  DiffOptions,
  DiffHtmlOptions,
} from "./diff";

// ============================================================================
// Format
// ============================================================================

export {
  // Timestamp formatting
  formatTimestamp,
  formatRelativeTime,
  formatDateForId,

  // Duration formatting
  formatDuration,
  formatTimer,

  // Token formatting
  formatTokenCount,
  formatTokenUsage,
  formatContextUsage,

  // Cost formatting
  formatCost,
  calculateCost,
  formatCostBreakdown,

  // File path formatting
  formatFilePath,
  truncateMiddle,
  getFileExtension,
  getFilename,
  getDirectory,

  // Byte size formatting
  formatBytes,
  parseBytes,

  // Number formatting
  formatNumber,
  formatPercentage,
  formatCompact,
} from "./format";

export type {
  TimestampOptions,
  DurationOptions,
  TokenOptions,
  TokenUsageInfo,
  CostOptions,
  FilePathOptions,
  ByteOptions,
} from "./format";

// ============================================================================
// Todos
// ============================================================================

export { extractTodosFromInput, getTodoStats } from "./todos";

export type { TodoStats } from "./todos";

// ============================================================================
// Tool Input
// ============================================================================

export {
  // Main formatter
  formatToolInput,

  // Utilities
  getToolFilePath,
  getToolDescription,
  getToolSummary,
  isDestructiveOperation,
} from "./toolInput";

export type { FormattedToolInput, ToolInputFormatOptions } from "./toolInput";

// ============================================================================
// Clipboard
// ============================================================================

export {
  // Copy operations
  copyToClipboard,
  copyHtmlToClipboard,
  copyImageToClipboard,

  // Read operations
  readClipboardText,
  readClipboardImage,
  readClipboard,

  // Check operations
  isImageInClipboard,
  getClipboardContentType,
  isClipboardSupported,
  isAsyncClipboardSupported,

  // Utility functions
  blobToBase64,
  base64ToBlob,
  createDataUrl,
  isDataUrl,
  parseDataUrl,
} from "./clipboard";

export type {
  ClipboardResult,
  ClipboardImage,
  ClipboardContentType,
} from "./clipboard";

// ============================================================================
// Validation
// ============================================================================

export {
  // Message validation
  validateMessage,

  // Server configuration validation
  validateServerConfig,

  // Permission pattern validation
  validatePermissionPattern,
  validateGlobPattern,

  // File path validation
  validateFilePath,

  // URL validation
  validateUrl,

  // JSON validation
  validateJson,
  validateJsonSchema,

  // Utilities
  combineValidationResults,
  createMessageValidator,
  isNonEmptyString,
  isPositiveInteger,
  isValidPort,
} from "./validation";

export type {
  ValidationResult,
  ServerConfig,
  PermissionPattern,
  MessageValidationOptions,
} from "./validation";
