/**
 * Clipboard Operations Hook
 *
 * Provides clipboard operations including copy, paste detection,
 * and image paste handling for the chat interface.
 *
 * @module hooks/useClipboard
 */

import { useCallback, useRef, useState, useEffect } from "react";
import { useVSCode } from "./useVSCode";

// ============================================================================
// Types
// ============================================================================

/**
 * Clipboard item types
 */
export type ClipboardItemType = "text" | "image" | "file" | "html";

/**
 * Clipboard content
 */
export interface ClipboardContent {
    type: ClipboardItemType;
    /** Text content (for text/html) */
    text?: string;
    /** HTML content */
    html?: string;
    /** Image data (base64 or blob) */
    imageData?: string | Blob;
    /** Image MIME type */
    imageMimeType?: string;
    /** File information */
    file?: {
        name: string;
        size: number;
        type: string;
    };
}

/**
 * Paste event data
 */
export interface PasteEventData {
    /** Type of pasted content */
    type: ClipboardItemType;
    /** Text content */
    text?: string;
    /** Image as base64 data URL */
    imageDataUrl?: string;
    /** Image MIME type */
    imageMimeType?: string;
    /** File name (for file pastes) */
    fileName?: string;
}

/**
 * Options for useClipboard hook
 */
export interface UseClipboardOptions {
    /** Callback when text is copied successfully */
    onCopySuccess?: (text: string) => void;
    /** Callback when copy fails */
    onCopyError?: (error: Error) => void;
    /** Callback when content is pasted */
    onPaste?: (data: PasteEventData) => void;
    /** Whether to detect image pastes */
    detectImages?: boolean;
    /** Whether to use extension for clipboard operations */
    useExtension?: boolean;
    /** Timeout for copy feedback (ms) */
    copyFeedbackTimeout?: number;
}

/**
 * Return type for useClipboard hook
 */
export interface UseClipboardReturn {
    /** Copy text to clipboard */
    copyText: (text: string) => Promise<boolean>;
    /** Copy code with formatting */
    copyCode: (code: string, language?: string) => Promise<boolean>;
    /** Whether copy operation is in progress */
    isCopying: boolean;
    /** Whether last copy was successful */
    hasCopied: boolean;
    /** Handle paste event */
    handlePaste: (event: React.ClipboardEvent) => Promise<PasteEventData | null>;
    /** Read clipboard contents */
    readClipboard: () => Promise<ClipboardContent | null>;
    /** Check if clipboard has specific type */
    hasClipboardType: (type: ClipboardItemType) => Promise<boolean>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for clipboard operations
 *
 * @example
 * ```tsx
 * function CodeBlock({ code, language }: { code: string; language: string }) {
 *   const { copyCode, hasCopied, isCopying } = useClipboard({
 *     onCopySuccess: () => console.log('Copied!'),
 *   });
 *
 *   return (
 *     <div>
 *       <pre><code>{code}</code></pre>
 *       <button
 *         onClick={() => copyCode(code, language)}
 *         disabled={isCopying}
 *       >
 *         {hasCopied ? 'Copied!' : 'Copy'}
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useClipboard(options: UseClipboardOptions = {}): UseClipboardReturn {
    const {
        onCopySuccess,
        onCopyError,
        onPaste,
        detectImages = true,
        useExtension = true,
        copyFeedbackTimeout = 2000,
    } = options;

    const { postMessage, isVSCode } = useVSCode();
    const [isCopying, setIsCopying] = useState(false);
    const [hasCopied, setHasCopied] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /**
     * Reset copy feedback after timeout
     */
    const resetCopyFeedback = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            setHasCopied(false);
        }, copyFeedbackTimeout);
    }, [copyFeedbackTimeout]);

    /**
     * Clean up timeout on unmount
     */
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    /**
     * Copy text to clipboard
     */
    const copyText = useCallback(
        async (text: string): Promise<boolean> => {
            setIsCopying(true);

            try {
                // Use VSCode extension for clipboard operations if available
                if (useExtension && isVSCode) {
                    postMessage({ type: "copyToClipboard", text });
                    setHasCopied(true);
                    resetCopyFeedback();
                    onCopySuccess?.(text);
                    return true;
                }

                // Use browser Clipboard API
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(text);
                    setHasCopied(true);
                    resetCopyFeedback();
                    onCopySuccess?.(text);
                    return true;
                }

                // Fallback: use document.execCommand
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                textArea.style.top = "-9999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();

                const success = document.execCommand("copy");
                document.body.removeChild(textArea);

                if (success) {
                    setHasCopied(true);
                    resetCopyFeedback();
                    onCopySuccess?.(text);
                    return true;
                }

                throw new Error("Copy command failed");
            } catch (error) {
                const err = error instanceof Error ? error : new Error("Copy failed");
                onCopyError?.(err);
                return false;
            } finally {
                setIsCopying(false);
            }
        },
        [useExtension, isVSCode, postMessage, resetCopyFeedback, onCopySuccess, onCopyError],
    );

    /**
     * Copy code with optional language prefix
     */
    const copyCode = useCallback(
        async (code: string, language?: string): Promise<boolean> => {
            // For code, just copy the raw text without formatting
            return copyText(code);
        },
        [copyText],
    );

    /**
     * Convert image blob to data URL
     */
    const blobToDataUrl = useCallback((blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }, []);

    /**
     * Handle paste event
     */
    const handlePaste = useCallback(
        async (event: React.ClipboardEvent): Promise<PasteEventData | null> => {
            const clipboardData = event.clipboardData;
            if (!clipboardData) {
                return null;
            }

            let result: PasteEventData | null = null;

            // Check for image paste
            if (detectImages && clipboardData.files.length > 0) {
                const file = clipboardData.files[0];

                if (file.type.startsWith("image/")) {
                    event.preventDefault();

                    const dataUrl = await blobToDataUrl(file);
                    result = {
                        type: "image",
                        imageDataUrl: dataUrl,
                        imageMimeType: file.type,
                        fileName: file.name || "pasted-image",
                    };

                    onPaste?.(result);
                    return result;
                }
            }

            // Check for image in clipboard items
            if (detectImages && clipboardData.items) {
                for (const item of clipboardData.items) {
                    if (item.type.startsWith("image/")) {
                        event.preventDefault();

                        const blob = item.getAsFile();
                        if (blob) {
                            const dataUrl = await blobToDataUrl(blob);
                            result = {
                                type: "image",
                                imageDataUrl: dataUrl,
                                imageMimeType: item.type,
                                fileName: "pasted-image",
                            };

                            onPaste?.(result);
                            return result;
                        }
                    }
                }
            }

            // Handle text paste
            const text = clipboardData.getData("text/plain");
            if (text) {
                result = {
                    type: "text",
                    text,
                };

                onPaste?.(result);
                return result;
            }

            return null;
        },
        [detectImages, blobToDataUrl, onPaste],
    );

    /**
     * Read clipboard contents
     */
    const readClipboard = useCallback(async (): Promise<ClipboardContent | null> => {
        try {
            if (navigator.clipboard && navigator.clipboard.read) {
                const items = await navigator.clipboard.read();

                for (const item of items) {
                    // Check for image
                    for (const type of item.types) {
                        if (type.startsWith("image/")) {
                            const blob = await item.getType(type);
                            const dataUrl = await blobToDataUrl(blob);
                            return {
                                type: "image",
                                imageData: dataUrl,
                                imageMimeType: type,
                            };
                        }
                    }

                    // Check for text
                    if (item.types.includes("text/plain")) {
                        const blob = await item.getType("text/plain");
                        const text = await blob.text();
                        return {
                            type: "text",
                            text,
                        };
                    }

                    // Check for HTML
                    if (item.types.includes("text/html")) {
                        const blob = await item.getType("text/html");
                        const html = await blob.text();
                        return {
                            type: "html",
                            html,
                        };
                    }
                }
            }

            // Fallback: try reading text
            if (navigator.clipboard && navigator.clipboard.readText) {
                const text = await navigator.clipboard.readText();
                if (text) {
                    return { type: "text", text };
                }
            }

            return null;
        } catch {
            // Clipboard access may be denied
            return null;
        }
    }, [blobToDataUrl]);

    /**
     * Check if clipboard has specific content type
     */
    const hasClipboardType = useCallback(
        async (type: ClipboardItemType): Promise<boolean> => {
            const content = await readClipboard();
            return content?.type === type;
        },
        [readClipboard],
    );

    return {
        copyText,
        copyCode,
        isCopying,
        hasCopied,
        handlePaste,
        readClipboard,
        hasClipboardType,
    };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Copy text to clipboard (non-hook version)
 * Useful for utilities or event handlers
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }

        // Fallback
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const success = document.execCommand("copy");
        document.body.removeChild(textArea);
        return success;
    } catch {
        return false;
    }
}

/**
 * Check if clipboard API is available
 */
export function isClipboardApiAvailable(): boolean {
    return !!(navigator.clipboard && (navigator.clipboard.writeText || navigator.clipboard.write));
}
