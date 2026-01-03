/**
 * Diff Computation Utilities
 *
 * Provides functions for computing line-level diffs using the
 * Longest Common Subsequence (LCS) algorithm and formatting
 * diff output for display.
 *
 * @module utils/diff
 */

import { escapeHtml } from "./markdown";

// ============================================================================
// Types
// ============================================================================

/**
 * Types of diff operations
 */
export type DiffOperation = "equal" | "insert" | "delete";

/**
 * A single line in a diff
 */
export interface DiffLine {
    /** The type of change */
    type: DiffOperation;
    /** The line content */
    content: string;
    /** Original line number (for equal/delete) */
    oldLineNumber?: number;
    /** New line number (for equal/insert) */
    newLineNumber?: number;
}

/**
 * Result of a diff computation
 */
export interface DiffResult {
    /** Array of diff lines */
    lines: DiffLine[];
    /** Number of additions */
    additions: number;
    /** Number of deletions */
    deletions: number;
    /** Number of unchanged lines */
    unchanged: number;
    /** Whether the content is identical */
    isIdentical: boolean;
}

/**
 * Options for diff computation
 */
export interface DiffOptions {
    /** Ignore whitespace differences */
    ignoreWhitespace?: boolean;
    /** Context lines to show around changes */
    contextLines?: number;
    /** Starting line number for the old content */
    startLine?: number;
}

/**
 * Options for HTML formatting
 */
export interface DiffHtmlOptions {
    /** Whether to show line numbers */
    showLineNumbers?: boolean;
    /** Whether to use side-by-side layout */
    sideBySide?: boolean;
    /** Custom CSS class prefix */
    classPrefix?: string;
    /** Whether to wrap long lines */
    wrapLines?: boolean;
    /** Maximum line width before wrapping */
    maxLineWidth?: number;
    /** Language for syntax highlighting */
    language?: string;
}

// ============================================================================
// LCS Algorithm
// ============================================================================

/**
 * Compute the Longest Common Subsequence of two arrays
 * Returns the length matrix for backtracking
 */
function computeLcsMatrix<T>(a: T[], b: T[], compare: (x: T, y: T) => boolean): number[][] {
    const m = a.length;
    const n = b.length;

    // Create (m+1) x (n+1) matrix initialized to 0
    const matrix: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    // Fill the matrix
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (compare(a[i - 1], b[j - 1])) {
                matrix[i][j] = matrix[i - 1][j - 1] + 1;
            } else {
                matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
            }
        }
    }

    return matrix;
}

/**
 * Backtrack through the LCS matrix to generate diff
 */
function backtrackDiff<T>(
    matrix: number[][],
    a: T[],
    b: T[],
    compare: (x: T, y: T) => boolean,
): Array<{ type: DiffOperation; oldIndex?: number; newIndex?: number }> {
    const diff: Array<{
        type: DiffOperation;
        oldIndex?: number;
        newIndex?: number;
    }> = [];
    let i = a.length;
    let j = b.length;

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && compare(a[i - 1], b[j - 1])) {
            // Equal
            diff.unshift({ type: "equal", oldIndex: i - 1, newIndex: j - 1 });
            i--;
            j--;
        } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
            // Insertion in new
            diff.unshift({ type: "insert", newIndex: j - 1 });
            j--;
        } else if (i > 0) {
            // Deletion from old
            diff.unshift({ type: "delete", oldIndex: i - 1 });
            i--;
        }
    }

    return diff;
}

// ============================================================================
// Main Diff Function
// ============================================================================

/**
 * Compute a line-level diff between two strings
 */
export function computeLineDiff(
    oldContent: string,
    newContent: string,
    options: DiffOptions = {},
): DiffResult {
    const { ignoreWhitespace = false, startLine = 1 } = options;

    // Split into lines
    const oldLines = oldContent.split("\n");
    const newLines = newContent.split("\n");

    // Comparison function
    const compare = (a: string, b: string): boolean => {
        if (ignoreWhitespace) {
            return a.trim() === b.trim();
        }
        return a === b;
    };

    // Compute LCS matrix and backtrack
    const matrix = computeLcsMatrix(oldLines, newLines, compare);
    const rawDiff = backtrackDiff(matrix, oldLines, newLines, compare);

    // Build diff lines with line numbers
    const diffLines: DiffLine[] = [];
    let oldLineNum = startLine;
    let newLineNum = startLine;
    let additions = 0;
    let deletions = 0;
    let unchanged = 0;

    for (const item of rawDiff) {
        switch (item.type) {
            case "equal":
                diffLines.push({
                    type: "equal",
                    content: oldLines[item.oldIndex!],
                    oldLineNumber: oldLineNum,
                    newLineNumber: newLineNum,
                });
                oldLineNum++;
                newLineNum++;
                unchanged++;
                break;

            case "delete":
                diffLines.push({
                    type: "delete",
                    content: oldLines[item.oldIndex!],
                    oldLineNumber: oldLineNum,
                });
                oldLineNum++;
                deletions++;
                break;

            case "insert":
                diffLines.push({
                    type: "insert",
                    content: newLines[item.newIndex!],
                    newLineNumber: newLineNum,
                });
                newLineNum++;
                additions++;
                break;
        }
    }

    return {
        lines: diffLines,
        additions,
        deletions,
        unchanged,
        isIdentical: additions === 0 && deletions === 0,
    };
}

/**
 * Compute diff with context (only show changes and surrounding lines)
 */
export function computeContextualDiff(
    oldContent: string,
    newContent: string,
    options: DiffOptions = {},
): DiffResult {
    const { contextLines = 3 } = options;

    const fullDiff = computeLineDiff(oldContent, newContent, options);

    if (fullDiff.isIdentical || contextLines < 0) {
        return fullDiff;
    }

    // Find indices of changed lines
    const changedIndices = new Set<number>();
    fullDiff.lines.forEach((line, index) => {
        if (line.type !== "equal") {
            // Add this line and surrounding context
            for (
                let i = Math.max(0, index - contextLines);
                i <= Math.min(fullDiff.lines.length - 1, index + contextLines);
                i++
            ) {
                changedIndices.add(i);
            }
        }
    });

    // Build contextual diff with separators
    const contextualLines: DiffLine[] = [];
    let lastIndex = -1;

    for (const index of Array.from(changedIndices).sort((a, b) => a - b)) {
        // Add separator if there's a gap
        if (lastIndex !== -1 && index > lastIndex + 1) {
            contextualLines.push({
                type: "equal",
                content: "...",
                oldLineNumber: undefined,
                newLineNumber: undefined,
            });
        }

        contextualLines.push(fullDiff.lines[index]);
        lastIndex = index;
    }

    return {
        lines: contextualLines,
        additions: fullDiff.additions,
        deletions: fullDiff.deletions,
        unchanged: fullDiff.unchanged,
        isIdentical: fullDiff.isIdentical,
    };
}

// ============================================================================
// HTML Formatting
// ============================================================================

/**
 * Format a diff result as HTML for display
 */
export function formatDiffHtml(diff: DiffResult, options: DiffHtmlOptions = {}): string {
    const {
        showLineNumbers = true,
        sideBySide = false,
        classPrefix = "diff",
        wrapLines = true,
        maxLineWidth = 80,
    } = options;

    if (sideBySide) {
        return formatSideBySideDiff(diff, options);
    }

    const lines: string[] = [];

    lines.push(`<div class="${classPrefix}-container">`);
    lines.push(`<table class="${classPrefix}-table">`);

    for (const line of diff.lines) {
        const lineClass = `${classPrefix}-line ${classPrefix}-${line.type}`;
        const content =
            wrapLines && line.content.length > maxLineWidth
                ? wordWrap(line.content, maxLineWidth)
                : escapeHtml(line.content);

        const prefix = getLinePrefix(line.type);
        const oldNum = line.oldLineNumber !== undefined ? line.oldLineNumber : "";
        const newNum = line.newLineNumber !== undefined ? line.newLineNumber : "";

        lines.push(`<tr class="${lineClass}">`);

        if (showLineNumbers) {
            lines.push(`<td class="${classPrefix}-line-num ${classPrefix}-old-num">${oldNum}</td>`);
            lines.push(`<td class="${classPrefix}-line-num ${classPrefix}-new-num">${newNum}</td>`);
        }

        lines.push(`<td class="${classPrefix}-prefix">${prefix}</td>`);
        lines.push(`<td class="${classPrefix}-content"><pre>${content}</pre></td>`);
        lines.push("</tr>");
    }

    lines.push("</table>");
    lines.push("</div>");

    return lines.join("\n");
}

/**
 * Format diff as side-by-side HTML
 */
function formatSideBySideDiff(diff: DiffResult, options: DiffHtmlOptions): string {
    const {
        showLineNumbers = true,
        classPrefix = "diff",
        wrapLines = true,
        maxLineWidth = 40,
    } = options;

    const lines: string[] = [];

    // Group consecutive deletions and insertions for alignment
    const groups: Array<{ old: DiffLine[]; new: DiffLine[] }> = [];
    let currentGroup: { old: DiffLine[]; new: DiffLine[] } = { old: [], new: [] };

    for (const line of diff.lines) {
        if (line.type === "equal") {
            if (currentGroup.old.length > 0 || currentGroup.new.length > 0) {
                groups.push(currentGroup);
                currentGroup = { old: [], new: [] };
            }
            groups.push({ old: [line], new: [line] });
        } else if (line.type === "delete") {
            currentGroup.old.push(line);
        } else {
            currentGroup.new.push(line);
        }
    }

    if (currentGroup.old.length > 0 || currentGroup.new.length > 0) {
        groups.push(currentGroup);
    }

    lines.push(`<div class="${classPrefix}-container ${classPrefix}-side-by-side">`);
    lines.push(`<table class="${classPrefix}-table">`);
    lines.push("<thead><tr>");
    lines.push(`<th class="${classPrefix}-header" colspan="${showLineNumbers ? 2 : 1}">Old</th>`);
    lines.push(`<th class="${classPrefix}-header" colspan="${showLineNumbers ? 2 : 1}">New</th>`);
    lines.push("</tr></thead>");
    lines.push("<tbody>");

    for (const group of groups) {
        const maxRows = Math.max(group.old.length, group.new.length);

        for (let i = 0; i < maxRows; i++) {
            const oldLine = group.old[i];
            const newLine = group.new[i];

            lines.push("<tr>");

            // Old side
            if (oldLine) {
                const lineClass = `${classPrefix}-${oldLine.type}`;
                const content =
                    wrapLines && oldLine.content.length > maxLineWidth
                        ? wordWrap(oldLine.content, maxLineWidth)
                        : escapeHtml(oldLine.content);

                if (showLineNumbers) {
                    lines.push(
                        `<td class="${classPrefix}-line-num">${oldLine.oldLineNumber || ""}</td>`,
                    );
                }
                lines.push(
                    `<td class="${classPrefix}-content ${lineClass}"><pre>${content}</pre></td>`,
                );
            } else {
                if (showLineNumbers) {
                    lines.push(`<td class="${classPrefix}-line-num"></td>`);
                }
                lines.push(`<td class="${classPrefix}-content ${classPrefix}-empty"></td>`);
            }

            // New side
            if (newLine) {
                const lineClass = `${classPrefix}-${newLine.type}`;
                const content =
                    wrapLines && newLine.content.length > maxLineWidth
                        ? wordWrap(newLine.content, maxLineWidth)
                        : escapeHtml(newLine.content);

                if (showLineNumbers) {
                    lines.push(
                        `<td class="${classPrefix}-line-num">${newLine.newLineNumber || ""}</td>`,
                    );
                }
                lines.push(
                    `<td class="${classPrefix}-content ${lineClass}"><pre>${content}</pre></td>`,
                );
            } else {
                if (showLineNumbers) {
                    lines.push(`<td class="${classPrefix}-line-num"></td>`);
                }
                lines.push(`<td class="${classPrefix}-content ${classPrefix}-empty"></td>`);
            }

            lines.push("</tr>");
        }
    }

    lines.push("</tbody>");
    lines.push("</table>");
    lines.push("</div>");

    return lines.join("\n");
}

/**
 * Get the prefix character for a diff line type
 */
function getLinePrefix(type: DiffOperation): string {
    switch (type) {
        case "insert":
            return "+";
        case "delete":
            return "-";
        case "equal":
        default:
            return " ";
    }
}

/**
 * Word wrap text at a maximum width
 */
function wordWrap(text: string, maxWidth: number): string {
    const escaped = escapeHtml(text);
    const words = escaped.split(/(\s+)/);
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
        if (currentLine.length + word.length > maxWidth) {
            if (currentLine) {
                lines.push(currentLine);
                currentLine = "";
            }

            // Handle very long words
            if (word.length > maxWidth) {
                for (let i = 0; i < word.length; i += maxWidth) {
                    lines.push(word.slice(i, i + maxWidth));
                }
                continue;
            }
        }
        currentLine += word;
    }

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines.join("\n");
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate line number mapping between old and new content
 */
export function calculateLineMapping(diff: DiffResult): Map<number, number> {
    const mapping = new Map<number, number>();

    for (const line of diff.lines) {
        if (
            line.type === "equal" &&
            line.oldLineNumber !== undefined &&
            line.newLineNumber !== undefined
        ) {
            mapping.set(line.oldLineNumber, line.newLineNumber);
        }
    }

    return mapping;
}

/**
 * Format diff statistics as a string
 */
export function formatDiffStats(diff: DiffResult): string {
    if (diff.isIdentical) {
        return "No changes";
    }

    const parts: string[] = [];

    if (diff.additions > 0) {
        parts.push(`+${diff.additions}`);
    }
    if (diff.deletions > 0) {
        parts.push(`-${diff.deletions}`);
    }

    return parts.join(" / ");
}

/**
 * Generate unified diff format string
 */
export function formatUnifiedDiff(diff: DiffResult, oldPath: string, newPath: string): string {
    const lines: string[] = [];

    // Header
    lines.push(`--- ${oldPath}`);
    lines.push(`+++ ${newPath}`);

    // Find hunks (groups of changes with context)
    let hunkStart = 0;
    let inHunk = false;

    for (let i = 0; i < diff.lines.length; i++) {
        const line = diff.lines[i];
        const prefix = getLinePrefix(line.type);

        if (line.type !== "equal" && !inHunk) {
            // Start new hunk
            inHunk = true;
            hunkStart = Math.max(0, i - 3);

            // Find hunk boundaries
            let hunkEnd = i;
            let equalCount = 0;
            for (let j = i + 1; j < diff.lines.length; j++) {
                if (diff.lines[j].type === "equal") {
                    equalCount++;
                    if (equalCount > 3) break;
                } else {
                    equalCount = 0;
                    hunkEnd = j;
                }
            }
            hunkEnd = Math.min(diff.lines.length - 1, hunkEnd + 3);

            // Calculate hunk header
            const oldStart = diff.lines[hunkStart].oldLineNumber || 1;
            const newStart = diff.lines[hunkStart].newLineNumber || 1;
            let oldCount = 0;
            let newCount = 0;

            for (let j = hunkStart; j <= hunkEnd; j++) {
                const l = diff.lines[j];
                if (l.type !== "insert") oldCount++;
                if (l.type !== "delete") newCount++;
            }

            lines.push(`@@ -${oldStart},${oldCount} +${newStart},${newCount} @@`);

            // Output hunk content
            for (let j = hunkStart; j <= hunkEnd; j++) {
                const l = diff.lines[j];
                lines.push(`${getLinePrefix(l.type)}${l.content}`);
            }

            i = hunkEnd;
            inHunk = false;
        }
    }

    return lines.join("\n");
}

/**
 * Apply a diff to original content
 */
export function applyDiff(oldContent: string, diff: DiffResult): string {
    const newLines: string[] = [];

    for (const line of diff.lines) {
        if (line.type === "equal" || line.type === "insert") {
            newLines.push(line.content);
        }
        // Skip deleted lines
    }

    return newLines.join("\n");
}
