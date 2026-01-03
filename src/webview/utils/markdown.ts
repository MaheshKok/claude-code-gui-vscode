/**
 * Markdown Rendering Utilities
 *
 * Provides functions for parsing and rendering markdown content,
 * including code blocks, inline code, links, and basic formatting.
 *
 * @module utils/markdown
 */

import { PATTERNS, getLanguageFromPath } from "./constants";

// ============================================================================
// Types
// ============================================================================

/**
 * Extracted code block information
 */
export interface CodeBlock {
    /** The full match including delimiters */
    fullMatch: string;
    /** The language identifier (if specified) */
    language: string;
    /** The code content */
    code: string;
    /** Start index in original string */
    startIndex: number;
    /** End index in original string */
    endIndex: number;
}

/**
 * Options for markdown rendering
 */
export interface MarkdownRenderOptions {
    /** Whether to escape HTML entities */
    escapeHtml?: boolean;
    /** Whether to render code blocks */
    renderCodeBlocks?: boolean;
    /** Whether to render inline code */
    renderInlineCode?: boolean;
    /** Whether to render links */
    renderLinks?: boolean;
    /** Whether to render basic formatting (bold, italic) */
    renderFormatting?: boolean;
    /** Custom code block renderer */
    codeBlockRenderer?: (block: CodeBlock) => string;
    /** Link target for rendered links */
    linkTarget?: "_blank" | "_self";
}

const defaultOptions: MarkdownRenderOptions = {
    escapeHtml: true,
    renderCodeBlocks: true,
    renderInlineCode: true,
    renderLinks: true,
    renderFormatting: true,
    linkTarget: "_blank",
};

// ============================================================================
// HTML Escaping
// ============================================================================

/**
 * Map of HTML entities for escaping
 */
const HTML_ENTITIES: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#x2F;",
    "`": "&#x60;",
    "=": "&#x3D;",
};

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(text: string): string {
    return text.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Unescape HTML entities back to characters
 */
export function unescapeHtml(text: string): string {
    const entities: Record<string, string> = {
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": '"',
        "&#39;": "'",
        "&#x2F;": "/",
        "&#x60;": "`",
        "&#x3D;": "=",
    };

    return text.replace(
        /&(?:amp|lt|gt|quot|#39|#x2F|#x60|#x3D);/g,
        (entity) => entities[entity] || entity,
    );
}

// ============================================================================
// Code Block Extraction
// ============================================================================

/**
 * Extract all code blocks from markdown content
 */
export function extractCodeBlocks(markdown: string): CodeBlock[] {
    const blocks: CodeBlock[] = [];
    const regex = /```(\w+)?\n?([\s\S]*?)```/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(markdown)) !== null) {
        blocks.push({
            fullMatch: match[0],
            language: match[1] || "plaintext",
            code: match[2].trim(),
            startIndex: match.index,
            endIndex: match.index + match[0].length,
        });
    }

    return blocks;
}

/**
 * Detect language from code content heuristics
 */
export function detectLanguage(code: string): string {
    const lines = code.trim().split("\n");
    const firstLine = lines[0].trim();

    // Shebang detection
    if (firstLine.startsWith("#!")) {
        if (firstLine.includes("python")) return "python";
        if (firstLine.includes("node")) return "javascript";
        if (firstLine.includes("bash") || firstLine.includes("sh")) return "shellscript";
        if (firstLine.includes("ruby")) return "ruby";
        if (firstLine.includes("perl")) return "perl";
    }

    // Pattern-based detection
    if (/^(import|from)\s+\w+/.test(firstLine)) {
        if (code.includes("def ") || (code.includes("class ") && code.includes(":"))) {
            return "python";
        }
        return "typescript";
    }

    if (/^const\s+\w+\s*=|^let\s+\w+\s*=|^function\s+\w+/.test(firstLine)) {
        return "javascript";
    }

    if (/^package\s+\w+/.test(firstLine)) {
        if (code.includes("func ")) return "go";
        return "java";
    }

    if (/^use\s+\w+::/.test(firstLine) || /^fn\s+\w+/.test(firstLine)) {
        return "rust";
    }

    if (/^<\?php/.test(firstLine)) return "php";
    if (/^<!DOCTYPE|^<html/i.test(firstLine)) return "html";
    if (/^{/.test(firstLine) && code.includes('"')) return "json";
    if (/^\s*\$\s*\w+/.test(firstLine)) return "shellscript";

    return "plaintext";
}

// ============================================================================
// Inline Code Handling
// ============================================================================

/**
 * Extract inline code segments
 */
export function extractInlineCode(
    markdown: string,
): Array<{ match: string; code: string; index: number }> {
    const segments: Array<{ match: string; code: string; index: number }> = [];
    const regex = /`([^`\n]+)`/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(markdown)) !== null) {
        // Skip if this is part of a code block (preceded by ```)
        const before = markdown.slice(Math.max(0, match.index - 3), match.index);
        if (before.endsWith("``")) continue;

        segments.push({
            match: match[0],
            code: match[1],
            index: match.index,
        });
    }

    return segments;
}

/**
 * Render inline code with HTML
 */
export function renderInlineCode(code: string): string {
    return `<code class="inline-code">${escapeHtml(code)}</code>`;
}

// ============================================================================
// Link Handling
// ============================================================================

/**
 * Parse markdown links
 */
export function parseLinks(
    markdown: string,
): Array<{ match: string; text: string; url: string; index: number }> {
    const links: Array<{
        match: string;
        text: string;
        url: string;
        index: number;
    }> = [];
    const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(markdown)) !== null) {
        links.push({
            match: match[0],
            text: match[1],
            url: match[2],
            index: match.index,
        });
    }

    return links;
}

/**
 * Render a markdown link as HTML
 */
export function renderLink(
    text: string,
    url: string,
    target: "_blank" | "_self" = "_blank",
): string {
    const safeUrl = escapeHtml(url);
    const safeText = escapeHtml(text);
    const rel = target === "_blank" ? ' rel="noopener noreferrer"' : "";

    return `<a href="${safeUrl}" target="${target}"${rel} class="markdown-link">${safeText}</a>`;
}

/**
 * Detect and auto-link URLs in text
 */
export function autoLinkUrls(text: string, target: "_blank" | "_self" = "_blank"): string {
    const urlRegex = /https?:\/\/[^\s<>\[\]()]+/g;

    return text.replace(urlRegex, (url) => {
        // Don't link if already in a markdown link
        const beforeIndex = text.lastIndexOf("[", text.indexOf(url));
        const parenIndex = text.indexOf("](", text.indexOf(url));
        if (beforeIndex !== -1 && parenIndex > beforeIndex) {
            return url;
        }

        return renderLink(url, url, target);
    });
}

// ============================================================================
// Basic Formatting
// ============================================================================

/**
 * Render bold text
 */
function renderBold(text: string): string {
    return text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

/**
 * Render italic text
 */
function renderItalic(text: string): string {
    // Single asterisks or underscores for italic, avoiding bold markers
    return text
        .replace(/(?<!\*)\*(?!\*)([^*]+)(?<!\*)\*(?!\*)/g, "<em>$1</em>")
        .replace(/(?<!_)_(?!_)([^_]+)(?<!_)_(?!_)/g, "<em>$1</em>");
}

/**
 * Render strikethrough text
 */
function renderStrikethrough(text: string): string {
    return text.replace(/~~([^~]+)~~/g, "<del>$1</del>");
}

/**
 * Render headers
 */
function renderHeaders(text: string): string {
    return text.replace(/^(#{1,6})\s+(.+)$/gm, (_, hashes, content) => {
        const level = hashes.length;
        return `<h${level} class="markdown-header">${content}</h${level}>`;
    });
}

/**
 * Render horizontal rules
 */
function renderHorizontalRules(text: string): string {
    return text.replace(/^(-{3,}|\*{3,}|_{3,})$/gm, '<hr class="markdown-hr" />');
}

/**
 * Render blockquotes
 */
function renderBlockquotes(text: string): string {
    // Handle multi-line blockquotes
    const lines = text.split("\n");
    const result: string[] = [];
    let inBlockquote = false;
    let blockquoteContent: string[] = [];

    for (const line of lines) {
        if (line.startsWith("> ") || line === ">") {
            if (!inBlockquote) {
                inBlockquote = true;
                blockquoteContent = [];
            }
            blockquoteContent.push(line.slice(2));
        } else {
            if (inBlockquote) {
                result.push(
                    `<blockquote class="markdown-blockquote">${blockquoteContent.join("\n")}</blockquote>`,
                );
                inBlockquote = false;
                blockquoteContent = [];
            }
            result.push(line);
        }
    }

    if (inBlockquote) {
        result.push(
            `<blockquote class="markdown-blockquote">${blockquoteContent.join("\n")}</blockquote>`,
        );
    }

    return result.join("\n");
}

/**
 * Render unordered lists
 */
function renderUnorderedLists(text: string): string {
    const lines = text.split("\n");
    const result: string[] = [];
    let inList = false;
    let listItems: string[] = [];

    for (const line of lines) {
        const match = line.match(/^(\s*)[-*+]\s+(.+)$/);
        if (match) {
            if (!inList) {
                inList = true;
                listItems = [];
            }
            listItems.push(`<li>${match[2]}</li>`);
        } else {
            if (inList) {
                result.push(`<ul class="markdown-list">${listItems.join("")}</ul>`);
                inList = false;
                listItems = [];
            }
            result.push(line);
        }
    }

    if (inList) {
        result.push(`<ul class="markdown-list">${listItems.join("")}</ul>`);
    }

    return result.join("\n");
}

/**
 * Render ordered lists
 */
function renderOrderedLists(text: string): string {
    const lines = text.split("\n");
    const result: string[] = [];
    let inList = false;
    let listItems: string[] = [];

    for (const line of lines) {
        const match = line.match(/^(\s*)\d+\.\s+(.+)$/);
        if (match) {
            if (!inList) {
                inList = true;
                listItems = [];
            }
            listItems.push(`<li>${match[2]}</li>`);
        } else {
            if (inList) {
                result.push(`<ol class="markdown-list">${listItems.join("")}</ol>`);
                inList = false;
                listItems = [];
            }
            result.push(line);
        }
    }

    if (inList) {
        result.push(`<ol class="markdown-list">${listItems.join("")}</ol>`);
    }

    return result.join("\n");
}

// ============================================================================
// Main Render Function
// ============================================================================

/**
 * Default code block renderer
 */
function defaultCodeBlockRenderer(block: CodeBlock): string {
    const escapedCode = escapeHtml(block.code);
    return `<pre class="code-block" data-language="${escapeHtml(block.language)}"><code class="language-${escapeHtml(block.language)}">${escapedCode}</code></pre>`;
}

/**
 * Parse and render markdown to HTML
 */
export function parseMarkdown(markdown: string, options: MarkdownRenderOptions = {}): string {
    const opts = { ...defaultOptions, ...options };
    let result = markdown;

    // Store code blocks to prevent processing their content
    const codeBlockPlaceholders: Map<string, string> = new Map();

    if (opts.renderCodeBlocks) {
        const blocks = extractCodeBlocks(result);
        const renderer = opts.codeBlockRenderer || defaultCodeBlockRenderer;

        // Replace code blocks with placeholders (in reverse order to preserve indices)
        for (let i = blocks.length - 1; i >= 0; i--) {
            const block = blocks[i];
            const placeholder = `__CODE_BLOCK_${i}__`;
            const rendered = renderer(block);
            codeBlockPlaceholders.set(placeholder, rendered);
            result = result.slice(0, block.startIndex) + placeholder + result.slice(block.endIndex);
        }
    }

    // Escape HTML in non-code content if requested
    if (opts.escapeHtml) {
        // Don't escape placeholders
        const parts = result.split(/(__CODE_BLOCK_\d+__)/);
        result = parts
            .map((part) => {
                if (part.match(/^__CODE_BLOCK_\d+__$/)) {
                    return part;
                }
                return escapeHtml(part);
            })
            .join("");
    }

    // Render inline code
    if (opts.renderInlineCode) {
        result = result.replace(/`([^`\n]+)`/g, (_, code) => renderInlineCode(code));
    }

    // Render links
    if (opts.renderLinks) {
        result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) =>
            renderLink(text, url, opts.linkTarget),
        );
    }

    // Render formatting
    if (opts.renderFormatting) {
        result = renderBold(result);
        result = renderItalic(result);
        result = renderStrikethrough(result);
        result = renderHeaders(result);
        result = renderHorizontalRules(result);
        result = renderBlockquotes(result);
        result = renderUnorderedLists(result);
        result = renderOrderedLists(result);
    }

    // Convert line breaks to <br> tags (preserving code blocks)
    result = result
        .split("\n")
        .map((line) => {
            if (
                line.match(/^__CODE_BLOCK_\d+__$/) ||
                line.match(/^<[/]?(ul|ol|li|blockquote|h[1-6]|hr|pre)/)
            ) {
                return line;
            }
            return line + (line.trim() ? "" : "<br>");
        })
        .join("\n");

    // Restore code blocks
    for (const [placeholder, rendered] of codeBlockPlaceholders) {
        result = result.replace(placeholder, rendered);
    }

    return result;
}

/**
 * Heuristic check for markdown-like content
 */
export function looksLikeMarkdown(value: string): boolean {
    const text = value.trim();
    if (!text) return false;

    const patterns = [
        /^#{1,6}\s/m,
        /```/,
        /`[^`\n]+`/,
        /\*\*[^*]+\*\*/,
        /(^|\n)\s*[-*+]\s+\S+/,
        /(^|\n)\s*\d+\.\s+\S+/,
        /\[[^\]]+\]\([^)]+\)/,
        /(^|\n)\s*>/,
    ];

    return patterns.some((pattern) => pattern.test(text));
}

/**
 * Strip markdown formatting from text
 */
export function stripMarkdown(markdown: string): string {
    let result = markdown;

    // Remove code blocks
    result = result.replace(/```[\s\S]*?```/g, "");

    // Remove inline code
    result = result.replace(/`[^`]+`/g, "");

    // Remove links but keep text
    result = result.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

    // Remove formatting
    result = result.replace(/\*\*([^*]+)\*\*/g, "$1");
    result = result.replace(/\*([^*]+)\*/g, "$1");
    result = result.replace(/_([^_]+)_/g, "$1");
    result = result.replace(/~~([^~]+)~~/g, "$1");
    result = result.replace(/^#+\s*/gm, "");
    result = result.replace(/^>\s*/gm, "");
    result = result.replace(/^[-*+]\s+/gm, "");
    result = result.replace(/^\d+\.\s+/gm, "");

    return result.trim();
}

/**
 * Get plain text length from markdown (for token estimation)
 */
export function getMarkdownTextLength(markdown: string): number {
    return stripMarkdown(markdown).length;
}
