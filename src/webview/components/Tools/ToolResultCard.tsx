import React, { useState, useCallback, useMemo, memo } from "react";
import {
    ChevronRight,
    Copy,
    Check,
    ChevronUp,
    ChevronDown,
    AlertCircle,
    CheckCircle2,
    Clock,
    Zap,
    Eye,
} from "lucide-react";
import {
    formatDuration,
    formatTokensCompact,
    getToolOriginInfo,
    looksLikeMarkdown,
} from "../../utils";
import { useVSCode } from "../../hooks/useVSCode";

export interface ToolResultCardProps {
    content: string;
    isError?: boolean;
    toolName?: string;
    maxLines?: number;
    onCopy?: (content: string) => void;
    duration?: number;
    tokens?: number;
    defaultCollapsed?: boolean;
    variant?: "card" | "embedded";
    label?: string;
}

/** Format tokens for display - uses formatTokensCompact utility */
const formatTokens = formatTokensCompact;

const truncateContent = (
    content: string,
    maxLines: number,
): { truncated: string; isTruncated: boolean; hiddenCount: number } => {
    const lines = content.split("\n");
    if (lines.length <= maxLines) {
        return { truncated: content, isTruncated: false, hiddenCount: 0 };
    }
    const truncated = lines.slice(0, maxLines).join("\n");
    return {
        truncated,
        isTruncated: true,
        hiddenCount: lines.length - maxLines,
    };
};

const extractTextFields = (value: unknown, seen: Set<object>): string[] => {
    if (!value || typeof value !== "object") return [];
    if (seen.has(value as object)) return [];
    seen.add(value as object);

    if (Array.isArray(value)) {
        return value.flatMap((item) => extractTextFields(item, seen));
    }

    const record = value as Record<string, unknown>;
    const texts: string[] = [];

    for (const [key, val] of Object.entries(record)) {
        if (key === "text" && typeof val === "string") {
            texts.push(val);
            continue;
        }
        texts.push(...extractTextFields(val, seen));
    }

    return texts;
};

const getTextFromJsonContent = (content: string): string | null => {
    const trimmed = content.trim();
    if (!trimmed) return null;
    if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) return null;

    try {
        const parsed = JSON.parse(trimmed);
        const texts = extractTextFields(parsed, new Set<object>())
            .map((text) => text.trim())
            .filter(Boolean);
        if (texts.length === 0) return null;
        return texts.join("\n\n");
    } catch {
        return null;
    }
};

const normalizeEscapedNewlines = (value: string): string => {
    if (!value) return value;
    if (!value.includes("\\n") && !value.includes("\\t") && !value.includes("\\r")) {
        return value;
    }
    return value
        .replace(/\\r\\n/g, "\n")
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\r/g, "\r");
};

interface ResultContentProps {
    content: string;
}

const ResultContent: React.FC<ResultContentProps> = ({ content }) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return (
        <>
            {parts.map((part, index) => {
                if (part.startsWith("```") && part.endsWith("```")) {
                    const codeContent = part.slice(3, -3);
                    const firstNewline = codeContent.indexOf("\n");
                    const code =
                        firstNewline > 0 ? codeContent.slice(firstNewline + 1) : codeContent;

                    return (
                        <pre
                            key={index}
                            className="my-4 font-mono text-xs bg-black/30 p-3 rounded-lg border border-white/5 text-white/80 whitespace-pre-wrap break-words overflow-x-auto"
                        >
                            {code}
                        </pre>
                    );
                }

                return (
                    <span key={index}>
                        {part.split(/(`[^`]+`)/g).map((segment, i) => {
                            if (segment.startsWith("`") && segment.endsWith("`")) {
                                return (
                                    <code
                                        key={i}
                                        className="px-1.5 py-0.5 mx-0.5 rounded-md bg-white/10 text-orange-200 font-mono text-xs border border-white/5"
                                    >
                                        {segment.slice(1, -1)}
                                    </code>
                                );
                            }
                            return segment;
                        })}
                    </span>
                );
            })}
        </>
    );
};

export const ToolResultCard: React.FC<ToolResultCardProps> = memo(
    ({
        content,
        isError = false,
        toolName,
        maxLines = 10,
        onCopy,
        duration,
        tokens,
        defaultCollapsed = true,
        variant = "card",
        label,
    }) => {
        const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
        const [isExpanded, setIsExpanded] = useState(false);
        const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
        const { postMessage } = useVSCode();
        const toolOrigin = toolName ? getToolOriginInfo(toolName) : { origin: "core" as const };
        const originLabel = toolOrigin.origin !== "core" ? toolOrigin.label : undefined;
        const originDetail = toolOrigin.detail;

        const extractedText = useMemo(() => getTextFromJsonContent(content), [content]);
        const renderSource = useMemo(
            () => normalizeEscapedNewlines(extractedText ?? content),
            [content, extractedText],
        );
        const showPreview = useMemo(() => looksLikeMarkdown(renderSource), [renderSource]);
        const { truncated, isTruncated, hiddenCount } = truncateContent(renderSource, maxLines);

        const toggleCollapsed = useCallback(() => {
            setIsCollapsed((prev) => !prev);
        }, []);

        const toggleExpanded = useCallback(() => {
            setIsExpanded((prev) => !prev);
        }, []);

        const handleCopy = useCallback(async () => {
            try {
                await navigator.clipboard.writeText(renderSource);
                setCopyState("copied");
                if (onCopy) onCopy(renderSource);
                setTimeout(() => setCopyState("idle"), 2000);
            } catch (err) {
                console.error("Failed to copy:", err);
            }
        }, [onCopy, renderSource]);

        const handlePreview = useCallback(() => {
            if (!showPreview) return;
            postMessage({
                type: "openMarkdownPreview",
                content: renderSource,
                title: toolName ? `${toolName} Result` : "Tool Result",
            });
        }, [postMessage, renderSource, showPreview, toolName]);

        const displayContent = isExpanded ? renderSource : truncated;

        if (variant === "embedded") {
            return (
                <div className="w-full">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            {label && (
                                <span className="text-[10px] uppercase tracking-wider text-white/30 font-semibold select-none">
                                    {label}
                                </span>
                            )}
                            {isError && (
                                <span className="text-xs font-semibold text-red-400 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Error
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                            {showPreview && (
                                <button
                                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors text-[10px]"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePreview();
                                    }}
                                    title="Open markdown preview"
                                >
                                    <Eye className="w-3 h-3" />
                                    <span>Preview</span>
                                </button>
                            )}
                            <button
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors text-[10px]"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopy();
                                }}
                                title="Copy to clipboard"
                            >
                                {copyState === "copied" ? (
                                    <>
                                        <Check className="w-3 h-3 text-green-400" />
                                        <span className="text-green-400">Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3 h-3" />
                                        <span>Copy</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="bg-black/20 rounded border border-white/5 p-3">
                        <div
                            className={`text-sm leading-relaxed message-content whitespace-pre-wrap break-words ${isError ? "text-red-200" : "text-white/80"}`}
                        >
                            <ResultContent content={displayContent} />
                        </div>

                        {isTruncated && (
                            <button
                                className="mt-2 flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-orange-400 hover:text-orange-300 hover:underline pt-2 border-t border-white/5 w-full"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpanded();
                                }}
                            >
                                {isExpanded ? (
                                    <>
                                        <ChevronUp className="w-3 h-3" />
                                        Show less
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="w-3 h-3" />
                                        Show {hiddenCount} more lines
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div
                className={`glass-panel rounded-lg overflow-hidden border ${isError ? "border-red-500/20" : "border-white/5"}`}
            >
                {/* Header */}
                <div
                    className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors ${
                        isError
                            ? "bg-red-500/10 hover:bg-red-500/20"
                            : "bg-white/5 hover:bg-white/10"
                    }`}
                    onClick={toggleCollapsed}
                >
                    <div className="flex items-center gap-2">
                        <ChevronRight
                            className={`w-4 h-4 text-white/40 transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                        />

                        <div className={isError ? "text-red-400" : "text-green-400"}>
                            {isError ? (
                                <AlertCircle className="w-4 h-4" />
                            ) : (
                                <CheckCircle2 className="w-4 h-4" />
                            )}
                        </div>

                        <span
                            className={`font-medium text-sm ${isError ? "text-red-200" : "text-white/80"}`}
                        >
                            {isError ? "Error" : "Result"}
                            {toolName && ` - ${toolName}`}
                        </span>
                        {originLabel && (
                            <span className="text-[10px] uppercase tracking-wide text-orange-300 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded">
                                {originLabel}
                            </span>
                        )}
                        {originDetail && (
                            <span
                                className="text-xs text-white/40 font-mono truncate max-w-[200px]"
                                title={originDetail}
                            >
                                {originDetail}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {duration !== undefined && (
                            <span className="flex items-center gap-1 text-xs text-white/40 bg-white/5 px-1.5 py-0.5 rounded">
                                <Clock className="w-3 h-3" />
                                {formatDuration(duration, { abbreviated: true })}
                            </span>
                        )}
                        {tokens !== undefined && (
                            <span className="hidden sm:flex items-center gap-1 text-xs text-white/40 bg-white/5 px-1.5 py-0.5 rounded">
                                <Zap className="w-3 h-3" />
                                {formatTokens(tokens)}
                            </span>
                        )}
                        {showPreview && (
                            <button
                                className="flex items-center gap-1.5 px-2 py-1 rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors text-xs"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePreview();
                                }}
                                title="Open markdown preview"
                            >
                                <Eye className="w-3 h-3" />
                                <span>Preview</span>
                            </button>
                        )}

                        <button
                            className="flex items-center gap-1.5 px-2 py-1 rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors text-xs"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleCopy();
                            }}
                            title="Copy to clipboard"
                        >
                            {copyState === "copied" ? (
                                <>
                                    <Check className="w-3 h-3 text-green-400" />
                                    <span className="text-green-400">Copied</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Content */}
                {!isCollapsed && (
                    <div className="px-3 py-2 bg-black/20">
                        <div
                            className={`text-sm leading-relaxed message-content whitespace-pre-wrap break-words ${isError ? "text-red-200" : "text-white/80"}`}
                        >
                            <ResultContent content={displayContent} />
                        </div>

                        {isTruncated && (
                            <button
                                className="mt-2 flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-orange-400 hover:text-orange-300 hover:underline pt-2 border-t border-white/5 w-full"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpanded();
                                }}
                            >
                                {isExpanded ? (
                                    <>
                                        <ChevronUp className="w-3 h-3" />
                                        Show less
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="w-3 h-3" />
                                        Show {hiddenCount} more lines
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    },
);

ToolResultCard.displayName = "ToolResultCard";

export default ToolResultCard;
