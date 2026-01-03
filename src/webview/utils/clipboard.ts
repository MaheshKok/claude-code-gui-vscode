/**
 * Clipboard Utilities
 *
 * Provides functions for clipboard operations including copying text,
 * reading images, and checking clipboard contents.
 *
 * @module utils/clipboard
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Result of a clipboard operation
 */
export interface ClipboardResult {
    /** Whether the operation succeeded */
    success: boolean;
    /** Error message if the operation failed */
    error?: string;
}

/**
 * Image data from clipboard
 */
export interface ClipboardImage {
    /** Base64 encoded image data */
    data: string;
    /** MIME type of the image */
    mimeType: string;
    /** Image width in pixels */
    width?: number;
    /** Image height in pixels */
    height?: number;
    /** Original file name (if available) */
    fileName?: string;
}

/**
 * Supported clipboard content types
 */
export type ClipboardContentType = "text" | "image" | "html" | "unknown";

// ============================================================================
// Copy Operations
// ============================================================================

/**
 * Copy text to the clipboard
 */
export async function copyToClipboard(text: string): Promise<ClipboardResult> {
    try {
        // Try the modern Clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            return { success: true };
        }

        // Fall back to execCommand for older browsers
        return copyUsingExecCommand(text);
    } catch (error) {
        // Some browsers block clipboard access without user interaction
        // Try the fallback method
        try {
            return copyUsingExecCommand(text);
        } catch (fallbackError) {
            return {
                success: false,
                error: `Failed to copy to clipboard: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }
}

/**
 * Copy text using the legacy execCommand method
 */
function copyUsingExecCommand(text: string): ClipboardResult {
    const textArea = document.createElement("textarea");
    textArea.value = text;

    // Make the textarea out of viewport
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    textArea.style.opacity = "0";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (successful) {
            return { success: true };
        } else {
            return {
                success: false,
                error: "execCommand copy returned false",
            };
        }
    } catch (error) {
        document.body.removeChild(textArea);
        return {
            success: false,
            error: `execCommand failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
    }
}

/**
 * Copy HTML content to the clipboard
 */
export async function copyHtmlToClipboard(
    html: string,
    plainText?: string,
): Promise<ClipboardResult> {
    try {
        if (navigator.clipboard && navigator.clipboard.write) {
            const blob = new Blob([html], { type: "text/html" });
            const textBlob = new Blob([plainText || html.replace(/<[^>]*>/g, "")], {
                type: "text/plain",
            });

            const clipboardItem = new ClipboardItem({
                "text/html": blob,
                "text/plain": textBlob,
            });

            await navigator.clipboard.write([clipboardItem]);
            return { success: true };
        }

        // Fallback to plain text
        return copyToClipboard(plainText || html.replace(/<[^>]*>/g, ""));
    } catch (error) {
        return {
            success: false,
            error: `Failed to copy HTML: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
    }
}

/**
 * Copy an image to the clipboard
 */
export async function copyImageToClipboard(imageBlob: Blob): Promise<ClipboardResult> {
    try {
        if (navigator.clipboard && navigator.clipboard.write) {
            const clipboardItem = new ClipboardItem({
                [imageBlob.type]: imageBlob,
            });

            await navigator.clipboard.write([clipboardItem]);
            return { success: true };
        }

        return {
            success: false,
            error: "Clipboard API not available for image copying",
        };
    } catch (error) {
        return {
            success: false,
            error: `Failed to copy image: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
    }
}

// ============================================================================
// Read Operations
// ============================================================================

/**
 * Read text from the clipboard
 */
export async function readClipboardText(): Promise<string | null> {
    try {
        if (navigator.clipboard && navigator.clipboard.readText) {
            return await navigator.clipboard.readText();
        }

        return null;
    } catch (error) {
        console.warn("Failed to read clipboard text:", error);
        return null;
    }
}

/**
 * Read image from the clipboard
 */
export async function readClipboardImage(): Promise<ClipboardImage | null> {
    try {
        if (!navigator.clipboard || !navigator.clipboard.read) {
            return null;
        }

        const items = await navigator.clipboard.read();

        for (const item of items) {
            // Look for image types
            const imageTypes = item.types.filter((type) => type.startsWith("image/"));

            for (const imageType of imageTypes) {
                const blob = await item.getType(imageType);
                const base64 = await blobToBase64(blob);

                // Try to get image dimensions
                const dimensions = await getImageDimensions(blob);

                return {
                    data: base64,
                    mimeType: imageType,
                    width: dimensions?.width,
                    height: dimensions?.height,
                };
            }
        }

        return null;
    } catch (error) {
        console.warn("Failed to read clipboard image:", error);
        return null;
    }
}

/**
 * Read all clipboard items
 */
export async function readClipboard(): Promise<{
    text?: string;
    html?: string;
    image?: ClipboardImage;
}> {
    const result: {
        text?: string;
        html?: string;
        image?: ClipboardImage;
    } = {};

    try {
        if (!navigator.clipboard) {
            return result;
        }

        // Try to read all content types
        if (navigator.clipboard.read) {
            const items = await navigator.clipboard.read();

            for (const item of items) {
                // Text
                if (item.types.includes("text/plain")) {
                    const blob = await item.getType("text/plain");
                    result.text = await blob.text();
                }

                // HTML
                if (item.types.includes("text/html")) {
                    const blob = await item.getType("text/html");
                    result.html = await blob.text();
                }

                // Image
                const imageType = item.types.find((type) => type.startsWith("image/"));
                if (imageType) {
                    const blob = await item.getType(imageType);
                    const base64 = await blobToBase64(blob);
                    const dimensions = await getImageDimensions(blob);

                    result.image = {
                        data: base64,
                        mimeType: imageType,
                        width: dimensions?.width,
                        height: dimensions?.height,
                    };
                }
            }
        } else if (navigator.clipboard.readText) {
            // Fallback to just text
            result.text = await navigator.clipboard.readText();
        }
    } catch (error) {
        console.warn("Failed to read clipboard:", error);
    }

    return result;
}

// ============================================================================
// Check Operations
// ============================================================================

/**
 * Check if there's an image in the clipboard
 */
export async function isImageInClipboard(): Promise<boolean> {
    try {
        if (!navigator.clipboard || !navigator.clipboard.read) {
            return false;
        }

        const items = await navigator.clipboard.read();

        for (const item of items) {
            if (item.types.some((type) => type.startsWith("image/"))) {
                return true;
            }
        }

        return false;
    } catch (error) {
        // Permission denied or clipboard empty
        return false;
    }
}

/**
 * Get the primary content type in the clipboard
 */
export async function getClipboardContentType(): Promise<ClipboardContentType> {
    try {
        if (!navigator.clipboard || !navigator.clipboard.read) {
            return "unknown";
        }

        const items = await navigator.clipboard.read();

        for (const item of items) {
            // Check for image first (more specific)
            if (item.types.some((type) => type.startsWith("image/"))) {
                return "image";
            }

            // Check for HTML
            if (item.types.includes("text/html")) {
                return "html";
            }

            // Check for plain text
            if (item.types.includes("text/plain")) {
                return "text";
            }
        }

        return "unknown";
    } catch (error) {
        return "unknown";
    }
}

/**
 * Check if clipboard access is available
 */
export function isClipboardSupported(): boolean {
    return !!navigator.clipboard;
}

/**
 * Check if async clipboard API is available
 */
export function isAsyncClipboardSupported(): boolean {
    return !!(
        navigator.clipboard &&
        typeof navigator.clipboard.read === "function" &&
        typeof navigator.clipboard.write === "function"
    );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert a Blob to base64 string
 */
export function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onloadend = () => {
            if (typeof reader.result === "string") {
                // Remove the data URL prefix (e.g., "data:image/png;base64,")
                const base64 = reader.result.split(",")[1] || reader.result;
                resolve(base64);
            } else {
                reject(new Error("Failed to convert blob to base64"));
            }
        };

        reader.onerror = () => {
            reject(new Error("FileReader error"));
        };

        reader.readAsDataURL(blob);
    });
}

/**
 * Convert base64 to Blob
 */
export function base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
}

/**
 * Get image dimensions from a blob
 */
async function getImageDimensions(blob: Blob): Promise<{ width: number; height: number } | null> {
    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(blob);

        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve({ width: img.width, height: img.height });
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(null);
        };

        img.src = url;
    });
}

/**
 * Create a data URL from base64 and mime type
 */
export function createDataUrl(base64: string, mimeType: string): string {
    return `data:${mimeType};base64,${base64}`;
}

/**
 * Check if a string is a valid data URL
 */
export function isDataUrl(str: string): boolean {
    return /^data:[^;]+;base64,/.test(str);
}

/**
 * Extract base64 and mime type from a data URL
 */
export function parseDataUrl(dataUrl: string): { base64: string; mimeType: string } | null {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;

    return {
        mimeType: match[1],
        base64: match[2],
    };
}
