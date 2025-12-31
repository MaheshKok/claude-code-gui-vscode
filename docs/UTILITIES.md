# Utilities Documentation

## Overview

The utility modules provide reusable functions for common operations.

## Utility Modules

| Module | Purpose | Location |
|--------|---------|----------|
| `markdown.ts` | Markdown parsing/rendering | `src/webview/utils/` |
| `diff.ts` | Diff computation and display | `src/webview/utils/` |
| `format.ts` | Data formatting | `src/webview/utils/` |
| `toolInput.ts` | Tool input formatting | `src/webview/utils/` |
| `clipboard.ts` | Clipboard operations | `src/webview/utils/` |
| `validation.ts` | Input validation | `src/webview/utils/` |
| `constants.ts` | App constants | `src/webview/utils/` |

---

## Markdown Utilities

**File:** `src/webview/utils/markdown.ts`

### Functions

```typescript
// HTML Escaping
escapeHtml(text: string): string
unescapeHtml(text: string): string

// Code Block Handling
extractCodeBlocks(markdown: string): CodeBlock[]
detectLanguage(code: string): string
renderInlineCode(code: string): string

// Links
parseLinks(markdown: string): Array<{ text: string; url: string; title?: string }>
renderLink(text: string, url: string, target?: '_blank' | '_self'): string
autoLinkUrls(text: string, target?: '_blank' | '_self'): string

// Main Parser
parseMarkdown(markdown: string, options?: MarkdownRenderOptions): string

// Utilities
stripMarkdown(markdown: string): string
getMarkdownTextLength(markdown: string): number
```

### Usage

```typescript
const html = parseMarkdown('# Title\nSome **bold** text with `code`', {
  escapeHtml: true,
  renderCodeBlocks: true,
  renderLinks: true,
  linkTarget: '_blank'
});
```

---

## Diff Utilities

**File:** `src/webview/utils/diff.ts`

### Functions

```typescript
// Main Diff Functions
computeLineDiff(oldContent: string, newContent: string, options?: DiffOptions): DiffResult
computeContextualDiff(oldContent: string, newContent: string, options?: DiffOptions): DiffResult

// HTML Formatting
formatDiffHtml(diff: DiffResult, options?: DiffHtmlOptions): string

// Utilities
calculateLineMapping(diff: DiffResult): Map<number, number>
formatDiffStats(diff: DiffResult): string
formatUnifiedDiff(diff: DiffResult, oldPath: string, newPath: string): string
applyDiff(oldContent: string, diff: DiffResult): string
```

### Types

```typescript
interface DiffResult {
  lines: DiffLine[];
  additions: number;
  deletions: number;
  unchanged: number;
  isIdentical: boolean;
}

interface DiffLine {
  type: 'equal' | 'insert' | 'delete';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

interface DiffOptions {
  ignoreWhitespace?: boolean;
  contextLines?: number;
}

interface DiffHtmlOptions {
  showLineNumbers?: boolean;
  sideBySide?: boolean;
  highlightSyntax?: boolean;
}
```

### Usage

```typescript
const diff = computeLineDiff(oldCode, newCode, { ignoreWhitespace: true });
const html = formatDiffHtml(diff, { showLineNumbers: true, sideBySide: false });

console.log(`+${diff.additions} -${diff.deletions}`);
```

---

## Format Utilities

**File:** `src/webview/utils/format.ts`

### Timestamp Formatting

```typescript
formatTimestamp(timestamp: number | Date, options?: TimestampOptions): string
formatRelativeTime(date: Date | number): string  // "2 hours ago"
formatDateForId(date?: Date): string  // ISO format safe for IDs
```

### Duration Formatting

```typescript
formatDuration(durationMs: number, options?: DurationOptions): string
// "1h 30m 45s" or "1:30:45"

formatTimer(durationMs: number): string
// "01:30:45"
```

### Token Formatting

```typescript
formatTokenCount(count: number, options?: TokenOptions): string
// "1,234 tokens" or "1.2K tokens"

formatTokenUsage(usage: TokenUsageInfo): string
// "Input: 1,234 | Output: 567"

formatContextUsage(usedTokens: number, model?: string): string
// "1,234 / 200,000 (0.6%)"
```

### Cost Formatting

```typescript
formatCost(costUsd: number, options?: CostOptions): string
// "$0.00123" or "$1.23"

calculateCost(usage: TokenUsageInfo, model?: string): number
// Returns cost in USD

formatCostBreakdown(usage: TokenUsageInfo, model?: string): string
// "Input: $0.001 | Output: $0.002 | Cache: $0.0001"
```

### File Path Formatting

```typescript
formatFilePath(path: string, options?: FilePathOptions): string
// Truncates long paths: "...components/Button.tsx"

truncateMiddle(str: string, maxLength: number): string
// "Hello...World"

getFileExtension(path: string): string  // "tsx"
getFilename(path: string): string       // "Button.tsx"
getDirectory(path: string): string      // "/src/components"
```

### Byte Size Formatting

```typescript
formatBytes(bytes: number, options?: ByteOptions): string
// "1.00 MiB" or "1,048,576 bytes"

parseBytes(sizeStr: string): number
// "1 MiB" → 1048576
```

### Number Formatting

```typescript
formatNumber(num: number, options?: { decimals?: number; locale?: string }): string
// "1,234.56"

formatPercentage(value: number, options?: { decimals?: number; includeSign?: boolean }): string
// "12.34%" or "+12.34%"

formatCompact(num: number): string
// "1.2K", "3.4M"
```

---

## Tool Input Formatting

**File:** `src/webview/utils/toolInput.ts`

### Main Function

```typescript
formatToolInput(
  toolName: string,
  input: ToolInput,
  options?: ToolInputFormatOptions
): FormattedToolInput

interface FormattedToolInput {
  summary: string;      // Brief text for collapsed view
  fullContent: string;  // Full HTML content
  isExpandable: boolean;
  metadata?: Record<string, unknown>;
}
```

### Supported Tools

| Tool | Summary Format |
|------|---------------|
| Read | "Read /path/to/file.ts (lines 1-50)" |
| Write | "Write /path/to/file.ts (42 lines)" |
| Edit | "Edit /path/to/file.ts (replace 5 chars)" |
| MultiEdit | "MultiEdit /path/to/file.ts (3 edits)" |
| Bash | "Bash: npm install express" |
| Glob | "Glob: **/*.ts" |
| Grep | "Grep: 'TODO' in src/" |
| TodoWrite | "TodoWrite: 5 items" |
| WebFetch | "WebFetch: https://example.com" |
| Task | "Task: Research API options" |

### Helper Functions

```typescript
getToolFilePath(toolName: string, input: ToolInput): string | undefined
getToolDescription(toolName: string): string
isDestructiveOperation(toolName: string, input: ToolInput): boolean
```

---

## Clipboard Utilities

**File:** `src/webview/utils/clipboard.ts`

### Copy Operations

```typescript
copyToClipboard(text: string): Promise<ClipboardResult>
copyHtmlToClipboard(html: string, plainText?: string): Promise<ClipboardResult>
copyImageToClipboard(imageBlob: Blob): Promise<ClipboardResult>

interface ClipboardResult {
  success: boolean;
  error?: string;
  method?: 'extension' | 'clipboard-api' | 'execCommand';
}
```

### Read Operations

```typescript
readClipboardText(): Promise<string | null>
readClipboardImage(): Promise<ClipboardImage | null>
readClipboard(): Promise<{ text?: string; html?: string; image?: ClipboardImage }>
```

### Check Operations

```typescript
isImageInClipboard(): Promise<boolean>
getClipboardContentType(): Promise<ClipboardContentType>
isClipboardSupported(): boolean
isAsyncClipboardSupported(): boolean
```

### Image Utilities

```typescript
blobToBase64(blob: Blob): Promise<string>
base64ToBlob(base64: string, mimeType: string): Blob
createDataUrl(base64: string, mimeType: string): string
isDataUrl(str: string): boolean
parseDataUrl(dataUrl: string): { base64: string; mimeType: string } | null
```

---

## Validation Utilities

**File:** `src/webview/utils/validation.ts`

### Message Validation

```typescript
validateMessage(message: string, options?: MessageValidationOptions): ValidationResult

interface MessageValidationOptions {
  maxLength?: number;      // Default: 100000
  minLength?: number;      // Default: 1
  allowWhitespaceOnly?: boolean;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}
```

### Server Configuration

```typescript
validateServerConfig(config: ServerConfig): ValidationResult

// Validates:
// - name (required, non-empty)
// - command (required, non-empty)
// - args (optional, array of strings)
// - env (optional, object with string values)
```

### Permission Patterns

```typescript
validatePermissionPattern(pattern: PermissionPattern): ValidationResult
validateGlobPattern(pattern: string): ValidationResult

// Validates glob syntax: *, **, ?, [...]
```

### File & URL Validation

```typescript
validateFilePath(path: string): ValidationResult
validateUrl(url: string): ValidationResult
```

### JSON Validation

```typescript
validateJson(jsonString: string): ValidationResult
validateJsonSchema(data: unknown, schema: JsonSchema): ValidationResult
```

### Utility Functions

```typescript
combineValidationResults(...results: ValidationResult[]): ValidationResult
createMessageValidator(options: MessageValidationOptions): (message: string) => ValidationResult
isNonEmptyString(value: unknown): value is string
isPositiveInteger(value: unknown): value is number
isValidPort(value: unknown): value is number
```

---

## Constants

**File:** `src/webview/utils/constants.ts`

### Tool Icons

```typescript
TOOL_ICONS: Record<string, string>
getToolIcon(toolName: string): string

// Icons for: Read, Write, Edit, Bash, Glob, Grep, Task, etc.
```

### Token Pricing

```typescript
TOKEN_PRICING = {
  'claude-sonnet-4-5-20250929': {
    input: 3.00,      // per million tokens
    output: 15.00,
    cacheRead: 0.30,
    cacheWrite: 3.75,
  },
  'claude-opus-4-5-20251101': {
    input: 15.00,
    output: 75.00,
    cacheRead: 1.50,
    cacheWrite: 18.75,
  },
  'claude-haiku-4-5-20251001': {
    input: 1.00,
    output: 5.00,
    cacheRead: 0.10,
    cacheWrite: 1.25,
  },
}

CONTEXT_WINDOW_SIZES: Record<string, number>
// Model → max tokens
```

### Default Settings

```typescript
DEFAULT_THEME_SETTINGS
DEFAULT_EDITOR_SETTINGS
DEFAULT_CLAUDE_SETTINGS
DEFAULT_PERMISSION_SETTINGS
DEFAULT_DISPLAY_SETTINGS
DEFAULT_SHORTCUTS
```

### UI Configuration

```typescript
BREAKPOINTS = { xs: 480, sm: 640, md: 768, lg: 1024, xl: 1280 }

SIDEBAR_CONFIG = {
  minWidth: 200,
  maxWidth: 500,
  defaultWidth: 280,
  collapsedWidth: 48,
}

INPUT_CONFIG = {
  minHeight: 40,
  maxHeight: 300,
  defaultHeight: 80,
}

ANIMATION_DURATIONS = { fast: 150, normal: 300, slow: 500 }
DEBOUNCE_DELAYS = { input: 150, search: 300, resize: 100, autosave: 1000 }
```

### Status Colors

```typescript
STATUS_COLORS = {
  connected: '#22c55e',
  disconnected: '#ef4444',
  connecting: '#eab308',
  error: '#ef4444',
}

TOOL_STATUS_COLORS = {
  pending: '#eab308',
  executing: '#3b82f6',
  completed: '#22c55e',
  failed: '#ef4444',
  denied: '#ef4444',
}
```

### Patterns

```typescript
PATTERNS = {
  filePath: /^[\/\\]?(?:[^\/\\:*?"<>|\n]+[\/\\])*[^\/\\:*?"<>|\n]*$/,
  glob: /^[\w\-.*?\/\[\]{}]+$/,
  url: /^https?:\/\/.+/,
  codeBlock: /```(\w+)?\n([\s\S]*?)```/g,
}
```

### Language Mappings

```typescript
EXTENSION_TO_LANGUAGE: Record<string, string>
// .ts → typescript, .py → python, etc.

getLanguageFromPath(filePath: string): string
```
