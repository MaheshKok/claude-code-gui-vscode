/**
 * Application Constants
 *
 * Central location for all constant values, mappings, and default settings
 * used throughout the webview application.
 *
 * @module utils/constants
 */

// ============================================================================
// Tool Icons Mapping
// ============================================================================

/**
 * SVG icon paths for each tool type
 * Using Codicons (VS Code icon set) naming convention where applicable
 */
export const TOOL_ICONS: Record<string, string> = {
  // File Operations
  Read: "file",
  Write: "file-add",
  Edit: "edit",
  MultiEdit: "files",

  // Search and Navigation
  Glob: "search",
  Grep: "search",

  // Terminal
  Bash: "terminal",

  // Task Management
  Task: "checklist",
  TodoRead: "checklist",
  TodoWrite: "tasklist",

  // Web Operations
  WebFetch: "globe",
  WebSearch: "globe",

  // Notebook
  NotebookRead: "notebook",
  NotebookEdit: "notebook",

  // LSP
  LSP: "symbol-method",

  // MCP Tools (prefix matching)
  mcp__: "extensions",

  // Default
  default: "tools",
};

/**
 * Get icon name for a tool
 */
export function getToolIcon(toolName: string): string {
  // Direct match
  if (TOOL_ICONS[toolName]) {
    return TOOL_ICONS[toolName];
  }

  // MCP tool prefix match
  if (toolName.startsWith("mcp__")) {
    return TOOL_ICONS["mcp__"];
  }

  return TOOL_ICONS.default;
}

// ============================================================================
// Message Type Icons
// ============================================================================

/**
 * Icons for different message types
 */
export const MESSAGE_TYPE_ICONS: Record<string, string> = {
  user: "account",
  assistant: "sparkle",
  tool_use: "tools",
  tool_result: "check",
  thinking: "lightbulb",
  error: "error",
  system: "info",
};

// ============================================================================
// Default Settings
// ============================================================================

/**
 * Default theme settings
 */
export const DEFAULT_THEME_SETTINGS = {
  mode: "auto" as const,
  fontSize: 14,
  fontFamily: "var(--vscode-font-family)",
};

/**
 * Default editor settings
 */
export const DEFAULT_EDITOR_SETTINGS = {
  tabSize: 2,
  useTabs: false,
  wordWrap: true,
  showLineNumbers: true,
  showMinimap: false,
  bracketMatching: true,
};

/**
 * Default Claude settings
 */
export const DEFAULT_CLAUDE_SETTINGS = {
  cliPath: null,
  defaultModel: "claude-sonnet-4-5-20250929",
  useWsl: false,
  defaultWorkingDirectory: null,
  maxTokensPerRequest: null,
  customEnv: {},
};

/**
 * Default permission settings
 */
export const DEFAULT_PERMISSION_SETTINGS = {
  autoApprove: {
    enabled: false,
    tools: ["Read", "Glob", "Grep", "LSP", "TodoRead"],
    patterns: [],
    readOperations: true,
    projectDirectory: true,
  },
  denyList: [],
  timeoutMs: 60000,
  showPrompts: true,
};

/**
 * Default display settings
 */
export const DEFAULT_DISPLAY_SETTINGS = {
  messageRendering: {
    showTimestamps: true,
    showToolDetails: true,
    showThinking: true,
    enableSyntaxHighlighting: true,
    maxContentLength: 50000,
    codeTheme: "auto" as const,
  },
  showTokenCounts: true,
  showCostEstimates: true,
  showTiming: true,
  showToolDetails: true,
  showThinking: true,
  enableAnimations: true,
};

/**
 * Default keyboard shortcuts
 */
export const DEFAULT_SHORTCUTS = {
  submit: "Enter",
  newLine: "Shift+Enter",
  stop: "Escape",
  clear: "Ctrl+L",
  toggleSidebar: "Ctrl+B",
  focusInput: "Ctrl+/",
};

// ============================================================================
// Token and Cost Constants
// ============================================================================

/**
 * Token pricing per million tokens (in USD)
 * Updated for current Anthropic pricing
 */
export const TOKEN_PRICING = {
  "claude-sonnet-4-5-20250929": {
    input: 3.0,
    output: 15.0,
    cacheRead: 0.3,
    cacheWrite: 3.75,
  },
  "claude-opus-4-5-20251101": {
    input: 15.0,
    output: 75.0,
    cacheRead: 1.5,
    cacheWrite: 18.75,
  },
  "claude-haiku-4-5-20251001": {
    input: 1.0,
    output: 5.0,
    cacheRead: 0.1,
    cacheWrite: 1.25,
  },
  default: {
    input: 3.0,
    output: 15.0,
    cacheRead: 0.3,
    cacheWrite: 3.75,
  },
};

/**
 * Context window sizes by model
 */
export const CONTEXT_WINDOW_SIZES: Record<string, number> = {
  "claude-sonnet-4-5-20250929": 200000,
  "claude-opus-4-5-20251101": 200000,
  "claude-haiku-4-5-20251001": 200000,
  default: 200000,
};

// ============================================================================
// Popular MCP Servers
// ============================================================================

/**
 * List of popular/recommended MCP servers
 */
export interface MCPServerConfig {
  name: string;
  displayName: string;
  description: string;
  command: string;
  args?: string[];
  category: "filesystem" | "git" | "database" | "web" | "tools" | "other";
  recommended?: boolean;
  docsUrl?: string;
}

export const POPULAR_MCP_SERVERS: MCPServerConfig[] = [
  {
    name: "filesystem",
    displayName: "Filesystem",
    description: "Access to local filesystem with configurable allowed paths",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed"],
    category: "filesystem",
    recommended: true,
    docsUrl:
      "https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem",
  },
  {
    name: "github",
    displayName: "GitHub",
    description: "GitHub API integration for repositories, issues, and PRs",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
    category: "git",
    recommended: true,
    docsUrl:
      "https://github.com/modelcontextprotocol/servers/tree/main/src/github",
  },
  {
    name: "postgres",
    displayName: "PostgreSQL",
    description: "Connect to PostgreSQL databases with read/write access",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-postgres", "postgresql://..."],
    category: "database",
    docsUrl:
      "https://github.com/modelcontextprotocol/servers/tree/main/src/postgres",
  },
  {
    name: "sqlite",
    displayName: "SQLite",
    description: "SQLite database access for local data storage",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-sqlite", "/path/to/database.db"],
    category: "database",
    docsUrl:
      "https://github.com/modelcontextprotocol/servers/tree/main/src/sqlite",
  },
  {
    name: "puppeteer",
    displayName: "Puppeteer",
    description: "Browser automation for web scraping and testing",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-puppeteer"],
    category: "web",
    docsUrl:
      "https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer",
  },
  {
    name: "fetch",
    displayName: "Fetch",
    description: "HTTP fetch capabilities for web requests",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-fetch"],
    category: "web",
    docsUrl:
      "https://github.com/modelcontextprotocol/servers/tree/main/src/fetch",
  },
  {
    name: "memory",
    displayName: "Memory",
    description: "Persistent memory storage across sessions",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-memory"],
    category: "tools",
    docsUrl:
      "https://github.com/modelcontextprotocol/servers/tree/main/src/memory",
  },
  {
    name: "slack",
    displayName: "Slack",
    description: "Slack workspace integration for messaging",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-slack"],
    category: "tools",
    docsUrl:
      "https://github.com/modelcontextprotocol/servers/tree/main/src/slack",
  },
  {
    name: "claude-flow",
    displayName: "Claude Flow",
    description: "Multi-agent swarm orchestration and coordination",
    command: "npx",
    args: ["claude-flow@alpha", "mcp", "start"],
    category: "tools",
    recommended: true,
    docsUrl: "https://github.com/ruvnet/claude-flow",
  },
];

// ============================================================================
// UI Constants
// ============================================================================

/**
 * Layout breakpoints in pixels
 */
export const BREAKPOINTS = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
};

/**
 * Sidebar configuration
 */
export const SIDEBAR_CONFIG = {
  minWidth: 200,
  maxWidth: 600,
  defaultWidth: 280,
  collapsedWidth: 48,
};

/**
 * Input area configuration
 */
export const INPUT_CONFIG = {
  minHeight: 44,
  maxHeight: 300,
  defaultHeight: 44,
};

/**
 * Animation durations in milliseconds
 */
export const ANIMATION_DURATIONS = {
  fast: 100,
  normal: 200,
  slow: 300,
};

/**
 * Debounce delays in milliseconds
 */
export const DEBOUNCE_DELAYS = {
  input: 100,
  search: 300,
  resize: 50,
  autosave: 1000,
};

// ============================================================================
// Status Colors
// ============================================================================

/**
 * Status indicator colors (using CSS variable names)
 */
export const STATUS_COLORS = {
  success: "var(--vscode-testing-iconPassed)",
  error: "var(--vscode-testing-iconFailed)",
  warning: "var(--vscode-editorWarning-foreground)",
  info: "var(--vscode-editorInfo-foreground)",
  pending: "var(--vscode-editorLightBulb-foreground)",
  active: "var(--vscode-progressBar-background)",
};

/**
 * Tool status colors
 */
export const TOOL_STATUS_COLORS = {
  pending: STATUS_COLORS.pending,
  approved: STATUS_COLORS.info,
  executing: STATUS_COLORS.active,
  completed: STATUS_COLORS.success,
  failed: STATUS_COLORS.error,
  denied: STATUS_COLORS.warning,
};

// ============================================================================
// Regex Patterns
// ============================================================================

/**
 * Common regex patterns used in the application
 */
export const PATTERNS = {
  /** Matches file paths */
  filePath: /^[a-zA-Z]?:?[\\/]?(?:[^<>:"|?*\n\r]+[\\/])*[^<>:"|?*\n\r]*$/,

  /** Matches glob patterns */
  glob: /^[^<>:"|?\n\r]+$/,

  /** Matches URL */
  url: /^https?:\/\/[^\s]+$/,

  /** Matches code blocks in markdown */
  codeBlock: /```(\w+)?\n([\s\S]*?)```/g,

  /** Matches inline code */
  inlineCode: /`([^`]+)`/g,

  /** Matches markdown links */
  markdownLink: /\[([^\]]+)\]\(([^)]+)\)/g,

  /** Matches @-mentions */
  mention: /@(\w+)/g,

  /** Matches file extensions */
  fileExtension: /\.([a-zA-Z0-9]+)$/,
};

// ============================================================================
// Language Mappings
// ============================================================================

/**
 * File extension to language ID mapping for syntax highlighting
 */
export const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  ts: "typescript",
  tsx: "typescriptreact",
  js: "javascript",
  jsx: "javascriptreact",
  py: "python",
  rb: "ruby",
  rs: "rust",
  go: "go",
  java: "java",
  kt: "kotlin",
  swift: "swift",
  cs: "csharp",
  cpp: "cpp",
  c: "c",
  h: "c",
  hpp: "cpp",
  php: "php",
  sh: "shellscript",
  bash: "shellscript",
  zsh: "shellscript",
  ps1: "powershell",
  sql: "sql",
  json: "json",
  jsonc: "jsonc",
  yaml: "yaml",
  yml: "yaml",
  toml: "toml",
  xml: "xml",
  html: "html",
  css: "css",
  scss: "scss",
  less: "less",
  md: "markdown",
  mdx: "mdx",
  vue: "vue",
  svelte: "svelte",
  dockerfile: "dockerfile",
  makefile: "makefile",
  cmake: "cmake",
  r: "r",
  scala: "scala",
  clj: "clojure",
  ex: "elixir",
  exs: "elixir",
  erl: "erlang",
  hs: "haskell",
  lua: "lua",
  perl: "perl",
  graphql: "graphql",
  proto: "protobuf",
  tf: "terraform",
  hcl: "hcl",
};

/**
 * Get language ID from file path
 */
export function getLanguageFromPath(filePath: string): string {
  const match = filePath.match(PATTERNS.fileExtension);
  if (match) {
    const ext = match[1].toLowerCase();
    return EXTENSION_TO_LANGUAGE[ext] || ext;
  }

  // Check for special filenames
  const filename = filePath.split(/[\\/]/).pop()?.toLowerCase() || "";
  if (filename === "dockerfile") return "dockerfile";
  if (filename === "makefile") return "makefile";
  if (filename === ".gitignore") return "ignore";
  if (filename === ".env") return "dotenv";

  return "plaintext";
}
