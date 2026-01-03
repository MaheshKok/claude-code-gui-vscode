/**
 * Tool Input Formatting Utilities
 *
 * Provides functions for formatting tool inputs for display,
 * with special handling for different tool types and expandable
 * content for large inputs.
 *
 * @module utils/toolInput
 */

import { formatFilePath, formatBytes, truncateMiddle } from "./format";
import { escapeHtml, extractCodeBlocks } from "./markdown";
import type { ToolInput } from "../types/claude-events";

// ============================================================================
// Types
// ============================================================================

/**
 * Formatted tool input for display
 */
export interface FormattedToolInput {
    /** Brief summary for collapsed view */
    summary: string;
    /** Full formatted HTML content */
    fullContent: string;
    /** Whether the content should be expandable */
    isExpandable: boolean;
    /** Tool-specific metadata */
    metadata?: Record<string, unknown>;
}

/**
 * Options for tool input formatting
 */
export interface ToolInputFormatOptions {
    /** Maximum summary length */
    maxSummaryLength?: number;
    /** Maximum content length before marking as expandable */
    expandableThreshold?: number;
    /** Whether to include syntax highlighting hints */
    includeSyntaxHints?: boolean;
    /** Whether to escape HTML */
    escapeHtmlContent?: boolean;
}

const defaultOptions: ToolInputFormatOptions = {
    maxSummaryLength: 60,
    expandableThreshold: 500,
    includeSyntaxHints: true,
    escapeHtmlContent: true,
};

// ============================================================================
// Tool-Specific Formatters
// ============================================================================

/**
 * Format Read tool input
 */
function formatReadInput(input: ToolInput, options: ToolInputFormatOptions): FormattedToolInput {
    const filePath = (input.file_path as string) || "";
    const startLine = input.start_line as number | undefined;
    const endLine = input.end_line as number | undefined;
    const offset = input.offset as number | undefined;
    const limit = input.limit as number | undefined;

    let summary = `Read ${formatFilePath(filePath, { maxLength: options.maxSummaryLength! - 5 })}`;

    if (startLine !== undefined && endLine !== undefined) {
        summary += ` (lines ${startLine}-${endLine})`;
    } else if (offset !== undefined || limit !== undefined) {
        const parts: string[] = [];
        if (offset !== undefined) parts.push(`offset: ${offset}`);
        if (limit !== undefined) parts.push(`limit: ${limit}`);
        summary += ` (${parts.join(", ")})`;
    }

    const fullContent = `
    <div class="tool-input-read">
      <div class="tool-input-field">
        <span class="field-label">File:</span>
        <span class="field-value file-path">${escapeHtml(filePath)}</span>
      </div>
      ${
          startLine !== undefined
              ? `
        <div class="tool-input-field">
          <span class="field-label">Lines:</span>
          <span class="field-value">${startLine}${endLine !== undefined ? ` - ${endLine}` : ""}</span>
        </div>
      `
              : ""
      }
      ${
          offset !== undefined
              ? `
        <div class="tool-input-field">
          <span class="field-label">Offset:</span>
          <span class="field-value">${offset}</span>
        </div>
      `
              : ""
      }
      ${
          limit !== undefined
              ? `
        <div class="tool-input-field">
          <span class="field-label">Limit:</span>
          <span class="field-value">${limit} lines</span>
        </div>
      `
              : ""
      }
    </div>
  `.trim();

    return {
        summary,
        fullContent,
        isExpandable: false,
        metadata: { filePath, startLine, endLine },
    };
}

/**
 * Format Write tool input
 */
function formatWriteInput(input: ToolInput, options: ToolInputFormatOptions): FormattedToolInput {
    const filePath = (input.file_path as string) || "";
    const content = (input.content as string) || "";

    const lineCount = content.split("\n").length;
    const summary = `Write ${formatFilePath(filePath, { maxLength: options.maxSummaryLength! - 20 })} (${lineCount} lines)`;

    const isExpandable = content.length > options.expandableThreshold!;
    const displayContent = isExpandable
        ? truncateMiddle(content, options.expandableThreshold!)
        : content;

    const fullContent = `
    <div class="tool-input-write">
      <div class="tool-input-field">
        <span class="field-label">File:</span>
        <span class="field-value file-path">${escapeHtml(filePath)}</span>
      </div>
      <div class="tool-input-field">
        <span class="field-label">Content:</span>
        <span class="field-value">${lineCount} lines, ${formatBytes(content.length)}</span>
      </div>
      <div class="tool-input-content">
        <pre class="content-preview">${escapeHtml(displayContent)}</pre>
      </div>
    </div>
  `.trim();

    return {
        summary,
        fullContent,
        isExpandable,
        metadata: { filePath, contentLength: content.length, lineCount },
    };
}

/**
 * Format Edit tool input
 */
function formatEditInput(input: ToolInput, options: ToolInputFormatOptions): FormattedToolInput {
    const filePath = (input.file_path as string) || "";
    const oldString = (input.old_string as string) || "";
    const newString = (input.new_string as string) || "";

    const summary = `Edit ${formatFilePath(filePath, { maxLength: options.maxSummaryLength! - 5 })}`;

    const isExpandable = oldString.length + newString.length > options.expandableThreshold!;

    const displayOld =
        isExpandable && oldString.length > options.expandableThreshold! / 2
            ? truncateMiddle(oldString, options.expandableThreshold! / 2)
            : oldString;

    const displayNew =
        isExpandable && newString.length > options.expandableThreshold! / 2
            ? truncateMiddle(newString, options.expandableThreshold! / 2)
            : newString;

    const fullContent = `
    <div class="tool-input-edit">
      <div class="tool-input-field">
        <span class="field-label">File:</span>
        <span class="field-value file-path">${escapeHtml(filePath)}</span>
      </div>
      <div class="tool-input-diff">
        <div class="diff-section diff-old">
          <span class="diff-label">Remove:</span>
          <pre class="diff-content">${escapeHtml(displayOld)}</pre>
        </div>
        <div class="diff-section diff-new">
          <span class="diff-label">Add:</span>
          <pre class="diff-content">${escapeHtml(displayNew)}</pre>
        </div>
      </div>
    </div>
  `.trim();

    return {
        summary,
        fullContent,
        isExpandable,
        metadata: {
            filePath,
            oldLength: oldString.length,
            newLength: newString.length,
        },
    };
}

/**
 * Format MultiEdit tool input
 */
function formatMultiEditInput(
    input: ToolInput,
    options: ToolInputFormatOptions,
): FormattedToolInput {
    const filePath = (input.file_path as string) || "";
    const edits = (input.edits as Array<{ old_string: string; new_string: string }>) || [];

    const summary = `MultiEdit ${formatFilePath(filePath, { maxLength: options.maxSummaryLength! - 20 })} (${edits.length} edits)`;

    const totalLength = edits.reduce(
        (sum, e) => sum + e.old_string.length + e.new_string.length,
        0,
    );
    const isExpandable = totalLength > options.expandableThreshold!;

    const editsHtml = edits
        .map((edit, index) => {
            const displayOld =
                edit.old_string.length > 100
                    ? truncateMiddle(edit.old_string, 100)
                    : edit.old_string;
            const displayNew =
                edit.new_string.length > 100
                    ? truncateMiddle(edit.new_string, 100)
                    : edit.new_string;

            return `
      <div class="multi-edit-item">
        <span class="edit-index">Edit ${index + 1}</span>
        <div class="diff-section diff-old">
          <pre class="diff-content">${escapeHtml(displayOld)}</pre>
        </div>
        <div class="diff-section diff-new">
          <pre class="diff-content">${escapeHtml(displayNew)}</pre>
        </div>
      </div>
    `;
        })
        .join("");

    const fullContent = `
    <div class="tool-input-multiedit">
      <div class="tool-input-field">
        <span class="field-label">File:</span>
        <span class="field-value file-path">${escapeHtml(filePath)}</span>
      </div>
      <div class="tool-input-field">
        <span class="field-label">Edits:</span>
        <span class="field-value">${edits.length} edit${edits.length !== 1 ? "s" : ""}</span>
      </div>
      <div class="multi-edit-list">
        ${editsHtml}
      </div>
    </div>
  `.trim();

    return {
        summary,
        fullContent,
        isExpandable,
        metadata: { filePath, editCount: edits.length },
    };
}

/**
 * Format Bash tool input
 */
function formatBashInput(input: ToolInput, options: ToolInputFormatOptions): FormattedToolInput {
    const command = (input.command as string) || "";
    const cwd = input.cwd as string | undefined;
    const timeout = input.timeout as number | undefined;
    const description = input.description as string | undefined;

    const displayCommand =
        command.length > options.maxSummaryLength!
            ? truncateMiddle(command, options.maxSummaryLength!)
            : command;

    const summary = description || `Run: ${displayCommand}`;
    const isExpandable = command.length > options.expandableThreshold!;

    const fullContent = `
    <div class="tool-input-bash">
      ${
          description
              ? `
        <div class="tool-input-field">
          <span class="field-label">Description:</span>
          <span class="field-value">${escapeHtml(description)}</span>
        </div>
      `
              : ""
      }
      <div class="tool-input-field">
        <span class="field-label">Command:</span>
      </div>
      <div class="command-block">
        <pre class="command-content">${escapeHtml(command)}</pre>
      </div>
      ${
          cwd
              ? `
        <div class="tool-input-field">
          <span class="field-label">Working Dir:</span>
          <span class="field-value file-path">${escapeHtml(cwd)}</span>
        </div>
      `
              : ""
      }
      ${
          timeout
              ? `
        <div class="tool-input-field">
          <span class="field-label">Timeout:</span>
          <span class="field-value">${timeout}ms</span>
        </div>
      `
              : ""
      }
    </div>
  `.trim();

    return {
        summary: truncateMiddle(summary, options.maxSummaryLength!),
        fullContent,
        isExpandable,
        metadata: { command, cwd, timeout },
    };
}

/**
 * Format Glob tool input
 */
function formatGlobInput(input: ToolInput, options: ToolInputFormatOptions): FormattedToolInput {
    const pattern = (input.pattern as string) || "";
    const path = input.path as string | undefined;

    const summary = `Search: ${pattern}${path ? ` in ${formatFilePath(path, { maxLength: 20 })}` : ""}`;

    const fullContent = `
    <div class="tool-input-glob">
      <div class="tool-input-field">
        <span class="field-label">Pattern:</span>
        <span class="field-value code">${escapeHtml(pattern)}</span>
      </div>
      ${
          path
              ? `
        <div class="tool-input-field">
          <span class="field-label">Path:</span>
          <span class="field-value file-path">${escapeHtml(path)}</span>
        </div>
      `
              : ""
      }
    </div>
  `.trim();

    return {
        summary: truncateMiddle(summary, options.maxSummaryLength!),
        fullContent,
        isExpandable: false,
        metadata: { pattern, path },
    };
}

/**
 * Format Grep tool input
 */
function formatGrepInput(input: ToolInput, options: ToolInputFormatOptions): FormattedToolInput {
    const pattern = (input.pattern as string) || "";
    const path = input.path as string | undefined;
    const glob = input.glob as string | undefined;

    let summary = `Grep: ${pattern}`;
    if (path) {
        summary += ` in ${formatFilePath(path, { maxLength: 20 })}`;
    }

    const fullContent = `
    <div class="tool-input-grep">
      <div class="tool-input-field">
        <span class="field-label">Pattern:</span>
        <span class="field-value code">${escapeHtml(pattern)}</span>
      </div>
      ${
          path
              ? `
        <div class="tool-input-field">
          <span class="field-label">Path:</span>
          <span class="field-value file-path">${escapeHtml(path)}</span>
        </div>
      `
              : ""
      }
      ${
          glob
              ? `
        <div class="tool-input-field">
          <span class="field-label">File Pattern:</span>
          <span class="field-value code">${escapeHtml(glob)}</span>
        </div>
      `
              : ""
      }
    </div>
  `.trim();

    return {
        summary: truncateMiddle(summary, options.maxSummaryLength!),
        fullContent,
        isExpandable: false,
        metadata: { pattern, path, glob },
    };
}

/**
 * Format TodoWrite tool input
 */
function formatTodoWriteInput(
    input: ToolInput,
    options: ToolInputFormatOptions,
): FormattedToolInput {
    const todos =
        (input.todos as Array<{
            id?: string;
            content: string;
            status: string;
            priority?: string;
        }>) || [];

    const summary = `Update todos (${todos.length} item${todos.length !== 1 ? "s" : ""})`;

    const todosHtml = todos
        .map((todo) => {
            const statusIcon =
                todo.status === "completed" ? "[ ]" : todo.status === "in_progress" ? "[-]" : "[ ]";
            const priorityClass = todo.priority || "medium";

            return `
      <div class="todo-item todo-${todo.status} priority-${priorityClass}">
        <span class="todo-status">${statusIcon}</span>
        <span class="todo-content">${escapeHtml(todo.content)}</span>
      </div>
    `;
        })
        .join("");

    const fullContent = `
    <div class="tool-input-todowrite">
      <div class="tool-input-field">
        <span class="field-label">Todos:</span>
        <span class="field-value">${todos.length} item${todos.length !== 1 ? "s" : ""}</span>
      </div>
      <div class="todo-list">
        ${todosHtml}
      </div>
    </div>
  `.trim();

    return {
        summary,
        fullContent,
        isExpandable: todos.length > 5,
        metadata: { todoCount: todos.length },
    };
}

/**
 * Format WebFetch tool input
 */
function formatWebFetchInput(
    input: ToolInput,
    options: ToolInputFormatOptions,
): FormattedToolInput {
    const url = (input.url as string) || "";
    const prompt = (input.prompt as string) || "";

    const displayUrl =
        url.length > options.maxSummaryLength! - 10
            ? truncateMiddle(url, options.maxSummaryLength! - 10)
            : url;

    const summary = `Fetch: ${displayUrl}`;

    const fullContent = `
    <div class="tool-input-webfetch">
      <div class="tool-input-field">
        <span class="field-label">URL:</span>
        <span class="field-value url">${escapeHtml(url)}</span>
      </div>
      ${
          prompt
              ? `
        <div class="tool-input-field">
          <span class="field-label">Prompt:</span>
          <span class="field-value">${escapeHtml(prompt)}</span>
        </div>
      `
              : ""
      }
    </div>
  `.trim();

    return {
        summary,
        fullContent,
        isExpandable: prompt.length > options.expandableThreshold!,
        metadata: { url, prompt },
    };
}

/**
 * Format Task tool input
 */
function formatTaskInput(input: ToolInput, options: ToolInputFormatOptions): FormattedToolInput {
    const description = (input.description as string) || (input.prompt as string) || "";

    const summary = `Task: ${truncateMiddle(description, options.maxSummaryLength! - 6)}`;

    const fullContent = `
    <div class="tool-input-task">
      <div class="tool-input-field">
        <span class="field-label">Description:</span>
      </div>
      <div class="task-content">
        <pre>${escapeHtml(description)}</pre>
      </div>
    </div>
  `.trim();

    return {
        summary,
        fullContent,
        isExpandable: description.length > options.expandableThreshold!,
        metadata: { description },
    };
}

/**
 * Format generic/unknown tool input
 */
function formatGenericInput(
    toolName: string,
    input: ToolInput,
    options: ToolInputFormatOptions,
): FormattedToolInput {
    const jsonStr = JSON.stringify(input, null, 2);
    const summary = `${toolName}: ${truncateMiddle(Object.keys(input).join(", "), options.maxSummaryLength! - toolName.length - 2)}`;

    const isExpandable = jsonStr.length > options.expandableThreshold!;
    const displayJson = isExpandable
        ? truncateMiddle(jsonStr, options.expandableThreshold!)
        : jsonStr;

    const fullContent = `
    <div class="tool-input-generic">
      <div class="tool-input-field">
        <span class="field-label">Tool:</span>
        <span class="field-value">${escapeHtml(toolName)}</span>
      </div>
      <div class="tool-input-json">
        <pre class="json-content">${escapeHtml(displayJson)}</pre>
      </div>
    </div>
  `.trim();

    return {
        summary,
        fullContent,
        isExpandable,
        metadata: input as Record<string, unknown>,
    };
}

// ============================================================================
// Main Formatter
// ============================================================================

/**
 * Format tool input for display
 */
export function formatToolInput(
    toolName: string,
    input: ToolInput,
    options: ToolInputFormatOptions = {},
): FormattedToolInput {
    const opts = { ...defaultOptions, ...options };

    // Select appropriate formatter based on tool name
    switch (toolName) {
        case "Read":
            return formatReadInput(input, opts);
        case "Write":
            return formatWriteInput(input, opts);
        case "Edit":
            return formatEditInput(input, opts);
        case "MultiEdit":
            return formatMultiEditInput(input, opts);
        case "Bash":
            return formatBashInput(input, opts);
        case "Glob":
            return formatGlobInput(input, opts);
        case "Grep":
            return formatGrepInput(input, opts);
        case "TodoWrite":
            return formatTodoWriteInput(input, opts);
        case "WebFetch":
            return formatWebFetchInput(input, opts);
        case "Task":
            return formatTaskInput(input, opts);
        default:
            return formatGenericInput(toolName, input, opts);
    }
}

/**
 * Get the primary file path from tool input (if applicable)
 */
export function getToolFilePath(toolName: string, input: ToolInput): string | undefined {
    const fileTools = ["Read", "Write", "Edit", "MultiEdit", "NotebookEdit", "NotebookRead"];

    if (fileTools.includes(toolName)) {
        return (input.file_path as string) || (input.notebook_path as string);
    }

    return undefined;
}

/**
 * Get a brief description of what a tool does
 */
export function getToolDescription(toolName: string): string {
    const descriptions: Record<string, string> = {
        Read: "Read file contents",
        Write: "Create or overwrite file",
        Edit: "Edit file with search/replace",
        MultiEdit: "Apply multiple edits to a file",
        Bash: "Execute shell command",
        Glob: "Search for files by pattern",
        Grep: "Search file contents",
        Task: "Run a subtask",
        TodoRead: "Read current todo list",
        TodoWrite: "Update todo list",
        WebFetch: "Fetch and analyze web content",
        WebSearch: "Search the web",
        NotebookRead: "Read Jupyter notebook",
        NotebookEdit: "Edit Jupyter notebook cell",
        LSP: "Language server operation",
    };

    return descriptions[toolName] || `Use ${toolName} tool`;
}

/**
 * Get a concise summary for display in collapsed tool step headers.
 * Extracts the most important parameter for each tool type.
 *
 * @param toolName - The name of the tool
 * @param input - The tool input parameters
 * @param maxLength - Maximum length of the summary (default: 40)
 * @returns A concise summary string
 */
export function getToolSummary(toolName: string, input: ToolInput, maxLength: number = 40): string {
    if (!input || typeof input !== "object") {
        return "";
    }

    const truncate = (str: string, len: number): string => {
        if (str.length <= len) return str;
        return str.slice(0, len - 1) + "…";
    };

    const getFilename = (filePath: string): string => {
        const parts = filePath.split("/");
        return parts[parts.length - 1] || filePath;
    };

    switch (toolName) {
        case "Read":
        case "Write":
        case "Edit":
        case "NotebookRead":
        case "NotebookEdit": {
            const filePath = (input.file_path as string) || (input.notebook_path as string) || "";
            return truncate(getFilename(filePath), maxLength);
        }

        case "MultiEdit": {
            const filePath = (input.file_path as string) || "";
            const edits = (input.edits as Array<{ old_string: string; new_string: string }>) || [];
            const filename = getFilename(filePath);
            return truncate(`${filename} (${edits.length} edits)`, maxLength);
        }

        case "Glob": {
            const pattern = (input.pattern as string) || "";
            return truncate(pattern, maxLength);
        }

        case "Grep": {
            const pattern = (input.pattern as string) || "";
            const glob = input.glob as string | undefined;
            if (glob) {
                return truncate(`"${pattern}" in ${glob}`, maxLength);
            }
            return truncate(`"${pattern}"`, maxLength);
        }

        case "Bash": {
            const command = (input.command as string) || "";
            const description = input.description as string | undefined;
            if (description) {
                return truncate(description, maxLength);
            }
            // Get first meaningful part of command
            const cleanCmd = command.trim().split("\n")[0] || "";
            return truncate(cleanCmd, maxLength);
        }

        case "Task": {
            const description = (input.description as string) || (input.prompt as string) || "";
            return truncate(description, maxLength);
        }

        case "TodoWrite": {
            const todos = (input.todos as Array<unknown>) || [];
            const inProgress = todos.filter(
                (t) => (t as { status: string }).status === "in_progress",
            ).length;
            const completed = todos.filter(
                (t) => (t as { status: string }).status === "completed",
            ).length;
            return `${todos.length} tasks (${completed} done, ${inProgress} active)`;
        }

        case "WebFetch": {
            const url = (input.url as string) || "";
            try {
                const hostname = new URL(url).hostname;
                return truncate(hostname, maxLength);
            } catch {
                return truncate(url, maxLength);
            }
        }

        case "WebSearch": {
            const query = (input.query as string) || "";
            return truncate(`"${query}"`, maxLength);
        }

        case "LSP": {
            const operation = (input.operation as string) || "";
            const filePath = (input.filePath as string) || "";
            const filename = getFilename(filePath);
            return truncate(`${operation} in ${filename}`, maxLength);
        }

        default: {
            // For unknown tools, try common parameter names
            const description =
                (input.description as string) ||
                (input.name as string) ||
                (input.path as string) ||
                (input.query as string) ||
                "";
            return truncate(description, maxLength);
        }
    }
}

/**
 * Check if a tool input represents a destructive operation
 */
export function isDestructiveOperation(toolName: string, input: ToolInput): boolean {
    const destructiveTools = ["Write", "Edit", "MultiEdit", "Bash", "NotebookEdit"];

    if (!destructiveTools.includes(toolName)) {
        return false;
    }

    // Bash commands that are potentially destructive
    if (toolName === "Bash") {
        const command = ((input.command as string) || "").toLowerCase();
        const destructivePatterns = [
            /\brm\b/,
            /\brmdir\b/,
            /\bdel\b/,
            /\berase\b/,
            /\bmv\b.*\s+\//,
            /\bcp\b.*-r?f/,
            /\bchmod\b/,
            /\bchown\b/,
            /\bkill\b/,
            /\bpkill\b/,
            />\s*\//, // redirect to root paths
            /\bsudo\b/,
            /\bdoas\b/,
        ];

        return destructivePatterns.some((pattern) => pattern.test(command));
    }

    return true;
}

export interface ToolOriginInfo {
    origin: "mcp" | "agent" | "core";
    label?: string;
    detail?: string;
    mcpServer?: string;
    mcpTool?: string;
    agentName?: string;
}

export function getToolOriginInfo(toolName: string, input?: ToolInput): ToolOriginInfo {
    if (toolName.startsWith("mcp__")) {
        const parts = toolName.split("__");
        const mcpServer = parts[1] || undefined;
        const mcpTool = parts.length > 2 ? parts.slice(2).join("__") : undefined;
        const detailParts = [mcpServer, mcpTool].filter((part) => Boolean(part)) as string[];
        return {
            origin: "mcp",
            label: "MCP",
            detail: detailParts.length > 0 ? detailParts.join(" / ") : undefined,
            mcpServer,
            mcpTool,
        };
    }

    if (toolName === "Task") {
        const agentKeys = [
            "agent",
            "agent_name",
            "agentName",
            "subagent",
            "subagent_name",
            "subagent_type",
            "role",
        ];
        let agentName: string | undefined;
        if (input) {
            for (const key of agentKeys) {
                const value = input[key];
                if (typeof value === "string" && value.trim()) {
                    agentName = value.trim();
                    break;
                }
            }
        }
        return {
            origin: "agent",
            label: "Agent",
            detail: agentName,
            agentName,
        };
    }

    return { origin: "core" };
}
