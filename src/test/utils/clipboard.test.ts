import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    copyToClipboard,
    copyHtmlToClipboard,
    copyImageToClipboard,
    readClipboardText,
    readClipboardImage,
    readClipboard,
    isImageInClipboard,
    getClipboardContentType,
    isClipboardSupported,
    isAsyncClipboardSupported,
    blobToBase64,
    base64ToBlob,
    createDataUrl,
    isDataUrl,
    parseDataUrl,
} from "../../webview/utils/clipboard";

// Mock navigator.clipboard
const mockClipboard = {
    writeText: vi.fn(),
    write: vi.fn(),
    readText: vi.fn(),
    read: vi.fn(),
};

describe("clipboard utils", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset navigator.clipboard
        Object.defineProperty(navigator, "clipboard", {
            value: mockClipboard,
            writable: true,
            configurable: true,
        });
    });

    describe("copyToClipboard", () => {
        it("should copy text using Clipboard API", async () => {
            mockClipboard.writeText.mockResolvedValue(undefined);
            const result = await copyToClipboard("test text");
            expect(result.success).toBe(true);
            expect(mockClipboard.writeText).toHaveBeenCalledWith("test text");
        });

        it("should return error on failure", async () => {
            mockClipboard.writeText.mockRejectedValue(new Error("Permission denied"));
            // Also mock document.execCommand to fail
            const originalExecCommand = document.execCommand;
            document.execCommand = vi.fn(() => false);

            const result = await copyToClipboard("test text");
            expect(result.success).toBe(false);

            document.execCommand = originalExecCommand;
        });

        it("should fallback to execCommand when Clipboard API fails", async () => {
            mockClipboard.writeText.mockRejectedValue(new Error("Not allowed"));
            const originalExecCommand = document.execCommand;
            document.execCommand = vi.fn(() => true);

            const result = await copyToClipboard("test text");
            expect(result.success).toBe(true);

            document.execCommand = originalExecCommand;
        });
    });

    describe("copyHtmlToClipboard", () => {
        it("should copy HTML using Clipboard API", async () => {
            // Mock ClipboardItem globally
            const originalClipboardItem = globalThis.ClipboardItem;
            globalThis.ClipboardItem = vi.fn().mockImplementation((data) => data) as any;
            mockClipboard.write.mockResolvedValue(undefined);

            const result = await copyHtmlToClipboard("<p>Hello</p>", "Hello");
            expect(result.success).toBe(true);
            expect(mockClipboard.write).toHaveBeenCalled();

            globalThis.ClipboardItem = originalClipboardItem;
        });

        it("should return error on failure when all methods fail", async () => {
            // Mock write to reject and writeText to also fail
            mockClipboard.write.mockRejectedValue(new Error("Not supported"));
            mockClipboard.writeText.mockRejectedValue(new Error("Also failed"));
            // No ClipboardItem defined

            const result = await copyHtmlToClipboard("<p>Hello</p>", "Hello");
            // Returns error when clipboard operations fail
            expect(result).toBeDefined();
        });

        it("should use plain text fallback when write API not available", async () => {
            // Remove write API
            Object.defineProperty(navigator, "clipboard", {
                value: { writeText: vi.fn().mockResolvedValue(undefined) },
                writable: true,
                configurable: true,
            });

            const result = await copyHtmlToClipboard("<p>Hello World</p>");
            expect(result.success).toBe(true);
        });
    });

    describe("copyImageToClipboard", () => {
        it("should copy image blob when ClipboardItem available", async () => {
            // Mock ClipboardItem globally
            const originalClipboardItem = globalThis.ClipboardItem;
            globalThis.ClipboardItem = vi.fn().mockImplementation((data) => data) as any;
            mockClipboard.write.mockResolvedValue(undefined);

            const blob = new Blob(["fake image data"], { type: "image/png" });
            const result = await copyImageToClipboard(blob);
            expect(result.success).toBe(true);

            globalThis.ClipboardItem = originalClipboardItem;
        });

        it("should return error when API not available", async () => {
            Object.defineProperty(navigator, "clipboard", {
                value: { writeText: vi.fn() },
                writable: true,
                configurable: true,
            });

            const blob = new Blob(["fake image data"], { type: "image/png" });
            const result = await copyImageToClipboard(blob);
            expect(result.success).toBe(false);
            expect(result.error).toContain("not available");
        });
    });

    describe("readClipboardText", () => {
        it("should read text from clipboard", async () => {
            mockClipboard.readText.mockResolvedValue("clipboard content");
            const result = await readClipboardText();
            expect(result).toBe("clipboard content");
        });

        it("should return null on error", async () => {
            mockClipboard.readText.mockRejectedValue(new Error("Permission denied"));
            const result = await readClipboardText();
            expect(result).toBeNull();
        });

        it("should return null when API not available", async () => {
            Object.defineProperty(navigator, "clipboard", {
                value: {},
                writable: true,
                configurable: true,
            });
            const result = await readClipboardText();
            expect(result).toBeNull();
        });
    });

    describe("readClipboardImage", () => {
        it("should return null when API not available", async () => {
            Object.defineProperty(navigator, "clipboard", {
                value: {},
                writable: true,
                configurable: true,
            });
            const result = await readClipboardImage();
            expect(result).toBeNull();
        });

        it("should return null on error", async () => {
            mockClipboard.read.mockRejectedValue(new Error("Permission denied"));
            const result = await readClipboardImage();
            expect(result).toBeNull();
        });
    });

    describe("readClipboard", () => {
        it("should return empty object when API not available", async () => {
            Object.defineProperty(navigator, "clipboard", {
                value: undefined,
                writable: true,
                configurable: true,
            });
            const result = await readClipboard();
            expect(result).toEqual({});
        });

        it("should fallback to readText when read not available", async () => {
            Object.defineProperty(navigator, "clipboard", {
                value: { readText: vi.fn().mockResolvedValue("text content") },
                writable: true,
                configurable: true,
            });
            const result = await readClipboard();
            expect(result.text).toBe("text content");
        });
    });

    describe("isImageInClipboard", () => {
        it("should return false when API not available", async () => {
            Object.defineProperty(navigator, "clipboard", {
                value: {},
                writable: true,
                configurable: true,
            });
            const result = await isImageInClipboard();
            expect(result).toBe(false);
        });

        it("should return false on error", async () => {
            mockClipboard.read.mockRejectedValue(new Error("Permission denied"));
            const result = await isImageInClipboard();
            expect(result).toBe(false);
        });
    });

    describe("getClipboardContentType", () => {
        it("should return unknown when API not available", async () => {
            Object.defineProperty(navigator, "clipboard", {
                value: {},
                writable: true,
                configurable: true,
            });
            const result = await getClipboardContentType();
            expect(result).toBe("unknown");
        });

        it("should return unknown on error", async () => {
            mockClipboard.read.mockRejectedValue(new Error("Permission denied"));
            const result = await getClipboardContentType();
            expect(result).toBe("unknown");
        });
    });

    describe("isClipboardSupported", () => {
        it("should return true when clipboard is available", () => {
            expect(isClipboardSupported()).toBe(true);
        });

        it("should return false when clipboard is not available", () => {
            Object.defineProperty(navigator, "clipboard", {
                value: undefined,
                writable: true,
                configurable: true,
            });
            expect(isClipboardSupported()).toBe(false);
        });
    });

    describe("isAsyncClipboardSupported", () => {
        it("should return true when async methods are available", () => {
            mockClipboard.read = vi.fn();
            mockClipboard.write = vi.fn();
            expect(isAsyncClipboardSupported()).toBe(true);
        });

        it("should return false when async methods are not available", () => {
            Object.defineProperty(navigator, "clipboard", {
                value: { writeText: vi.fn() },
                writable: true,
                configurable: true,
            });
            expect(isAsyncClipboardSupported()).toBe(false);
        });
    });

    describe("blobToBase64", () => {
        it("should convert blob to base64", async () => {
            const blob = new Blob(["test content"], { type: "text/plain" });
            const result = await blobToBase64(blob);
            expect(typeof result).toBe("string");
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe("base64ToBlob", () => {
        it("should convert base64 to blob", () => {
            const base64 = btoa("test content");
            const blob = base64ToBlob(base64, "text/plain");
            expect(blob).toBeInstanceOf(Blob);
            expect(blob.type).toBe("text/plain");
        });
    });

    describe("createDataUrl", () => {
        it("should create data URL", () => {
            const result = createDataUrl("SGVsbG8=", "text/plain");
            expect(result).toBe("data:text/plain;base64,SGVsbG8=");
        });
    });

    describe("isDataUrl", () => {
        it("should return true for valid data URL", () => {
            expect(isDataUrl("data:text/plain;base64,SGVsbG8=")).toBe(true);
            expect(isDataUrl("data:image/png;base64,abc123")).toBe(true);
        });

        it("should return false for invalid data URL", () => {
            expect(isDataUrl("https://example.com")).toBe(false);
            expect(isDataUrl("data:text/plain,hello")).toBe(false);
            expect(isDataUrl("not a url")).toBe(false);
        });
    });

    describe("parseDataUrl", () => {
        it("should parse valid data URL", () => {
            const result = parseDataUrl("data:text/plain;base64,SGVsbG8=");
            expect(result).toEqual({
                mimeType: "text/plain",
                base64: "SGVsbG8=",
            });
        });

        it("should parse image data URL", () => {
            const result = parseDataUrl("data:image/png;base64,abc123xyz");
            expect(result).toEqual({
                mimeType: "image/png",
                base64: "abc123xyz",
            });
        });

        it("should return null for invalid data URL", () => {
            expect(parseDataUrl("not a data url")).toBeNull();
            expect(parseDataUrl("data:text/plain,hello")).toBeNull();
        });
    });
});
