/**
 * CodeBlock Component
 *
 * Reusable code block with syntax highlighting header and copy functionality.
 * Used for displaying code snippets in messages and tool outputs.
 *
 * @module components/Common/CodeBlock
 */

import React, { useState, useCallback, memo } from "react";
import { Check, Copy } from "lucide-react";

export interface CodeBlockProps {
    /** The code content to display */
    code: string;
    /** Programming language for syntax highlighting label */
    language?: string;
    /** Optional filename to display instead of language */
    filename?: string;
    /** Custom class name for the container */
    className?: string;
    /** Whether to show the copy button */
    showCopyButton?: boolean;
    /** Whether to show line numbers */
    showLineNumbers?: boolean;
    /** Custom max height for the code area */
    maxHeight?: number | string;
}

/**
 * CodeBlock displays formatted code with a header showing the language/filename
 * and a copy button for easy clipboard copying.
 */
export const CodeBlock: React.FC<CodeBlockProps> = memo(
    ({
        code,
        language = "",
        filename,
        className = "",
        showCopyButton = true,
        showLineNumbers = false,
        maxHeight,
    }) => {
        const [copied, setCopied] = useState(false);

        const handleCopy = useCallback(async () => {
            try {
                await navigator.clipboard.writeText(code);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error("Failed to copy code:", err);
            }
        }, [code]);

        const displayLabel = filename || language || "text";
        const lines = showLineNumbers ? code.split("\n") : null;

        const maxHeightStyle = maxHeight
            ? {
                  maxHeight: typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
              }
            : undefined;

        return (
            <div
                className={`rounded-xl overflow-hidden border border-white/10 shadow-lg group relative ${className}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                    <span className="text-xs font-medium text-white/60 uppercase tracking-wider font-mono">
                        {displayLabel}
                    </span>
                    {showCopyButton && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/10 text-xs text-white/50 hover:text-white transition-colors"
                                title="Copy code"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-3 h-3 text-green-400" />
                                        <span className="text-green-400">Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3 h-3" />
                                        <span>Copy</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Code Content */}
                <div className="relative">
                    <pre
                        className="font-mono text-xs bg-black/40 p-4 overflow-x-auto text-white/80 leading-relaxed custom-scrollbar"
                        style={maxHeightStyle}
                    >
                        {showLineNumbers && lines ? (
                            <code className="flex">
                                <span className="select-none pr-4 text-white/30 text-right min-w-[2.5rem]">
                                    {lines.map((_, i) => (
                                        <span key={i} className="block">
                                            {i + 1}
                                        </span>
                                    ))}
                                </span>
                                <span className="flex-1">
                                    {lines.map((line, i) => (
                                        <span key={i} className="block">
                                            {line || " "}
                                        </span>
                                    ))}
                                </span>
                            </code>
                        ) : (
                            <code>{code}</code>
                        )}
                    </pre>
                </div>
            </div>
        );
    },
);

CodeBlock.displayName = "CodeBlock";

export default CodeBlock;
