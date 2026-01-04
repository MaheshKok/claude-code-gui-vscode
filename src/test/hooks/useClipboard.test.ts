import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock useVSCode hook
vi.mock("../../webview/hooks/useVSCode", () => ({
    useVSCode: vi.fn(() => ({
        postMessage: vi.fn(),
        isVSCode: false,
        api: null,
        getState: vi.fn(),
        setState: vi.fn(),
        updateState: vi.fn(),
    })),
}));

import {
    useClipboard,
    copyToClipboard,
    isClipboardApiAvailable,
} from "../../webview/hooks/useClipboard";
import { useVSCode } from "../../webview/hooks/useVSCode";

describe("useClipboard", () => {
    const mockWriteText = vi.fn();
    const mockReadText = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();

        // Mock navigator.clipboard
        Object.defineProperty(navigator, "clipboard", {
            value: {
                writeText: mockWriteText,
                readText: mockReadText,
                read: vi.fn(),
            },
            writable: true,
            configurable: true,
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("copyText", () => {
        it("should copy text to clipboard using browser API", async () => {
            mockWriteText.mockResolvedValue(undefined);
            const { result } = renderHook(() => useClipboard());

            let success: boolean = false;
            await act(async () => {
                success = await result.current.copyText("Hello World");
            });

            expect(success).toBe(true);
            expect(mockWriteText).toHaveBeenCalledWith("Hello World");
        });

        it("should set hasCopied to true after successful copy", async () => {
            mockWriteText.mockResolvedValue(undefined);
            const { result } = renderHook(() => useClipboard());

            await act(async () => {
                await result.current.copyText("Test");
            });

            expect(result.current.hasCopied).toBe(true);
        });

        it("should reset hasCopied after timeout", async () => {
            mockWriteText.mockResolvedValue(undefined);
            const { result } = renderHook(() => useClipboard({ copyFeedbackTimeout: 1000 }));

            await act(async () => {
                await result.current.copyText("Test");
            });

            expect(result.current.hasCopied).toBe(true);

            act(() => {
                vi.advanceTimersByTime(1000);
            });

            expect(result.current.hasCopied).toBe(false);
        });

        it("should call onCopySuccess callback", async () => {
            mockWriteText.mockResolvedValue(undefined);
            const onCopySuccess = vi.fn();
            const { result } = renderHook(() => useClipboard({ onCopySuccess }));

            await act(async () => {
                await result.current.copyText("Test");
            });

            expect(onCopySuccess).toHaveBeenCalledWith("Test");
        });

        it("should call onCopyError when copy fails", async () => {
            mockWriteText.mockRejectedValue(new Error("Copy failed"));
            const onCopyError = vi.fn();
            const { result } = renderHook(() => useClipboard({ onCopyError }));

            await act(async () => {
                await result.current.copyText("Test");
            });

            expect(onCopyError).toHaveBeenCalledWith(expect.any(Error));
        });

        it("should return false when copy fails", async () => {
            mockWriteText.mockRejectedValue(new Error("Copy failed"));
            const { result } = renderHook(() => useClipboard());

            let success: boolean = true;
            await act(async () => {
                success = await result.current.copyText("Test");
            });

            expect(success).toBe(false);
        });

        it("should use VSCode extension when available", async () => {
            const mockPostMessage = vi.fn();
            vi.mocked(useVSCode).mockReturnValue({
                postMessage: mockPostMessage,
                isVSCode: true,
                api: {} as any,
                getState: vi.fn(),
                setState: vi.fn(),
                updateState: vi.fn(),
            });

            const { result } = renderHook(() => useClipboard({ useExtension: true }));

            await act(async () => {
                await result.current.copyText("Test");
            });

            expect(mockPostMessage).toHaveBeenCalledWith({
                type: "copyToClipboard",
                text: "Test",
            });
        });
    });

    describe("copyCode", () => {
        it("should copy code text", async () => {
            mockWriteText.mockResolvedValue(undefined);
            // Use extension: false to ensure browser API is used
            const { result } = renderHook(() => useClipboard({ useExtension: false }));

            await act(async () => {
                await result.current.copyCode("const x = 1;", "javascript");
            });

            expect(mockWriteText).toHaveBeenCalledWith("const x = 1;");
        });

        it("should work without language parameter", async () => {
            mockWriteText.mockResolvedValue(undefined);
            const { result } = renderHook(() => useClipboard({ useExtension: false }));

            await act(async () => {
                await result.current.copyCode("print('hello')");
            });

            expect(mockWriteText).toHaveBeenCalledWith("print('hello')");
        });

        it("should return success from copyText", async () => {
            mockWriteText.mockResolvedValue(undefined);
            const { result } = renderHook(() => useClipboard({ useExtension: false }));

            let success: boolean = false;
            await act(async () => {
                success = await result.current.copyCode("test code");
            });

            expect(success).toBe(true);
        });
    });

    describe("handlePaste", () => {
        it("should handle text paste", async () => {
            const onPaste = vi.fn();
            const { result } = renderHook(() => useClipboard({ onPaste }));

            const mockEvent = {
                clipboardData: {
                    types: ["text/plain"],
                    getData: vi.fn().mockImplementation((type: string) => {
                        if (type === "text/plain") return "Pasted text";
                        return "";
                    }),
                    items: [],
                    files: { length: 0, item: vi.fn() },
                },
                preventDefault: vi.fn(),
            } as unknown as React.ClipboardEvent;

            let pasteResult: any;
            await act(async () => {
                pasteResult = await result.current.handlePaste(mockEvent);
            });

            expect(pasteResult).not.toBeNull();
            expect(pasteResult?.type).toBe("text");
            expect(pasteResult?.text).toBe("Pasted text");
        });

        it("should call onPaste callback", async () => {
            const onPaste = vi.fn();
            const { result } = renderHook(() => useClipboard({ onPaste }));

            const mockEvent = {
                clipboardData: {
                    types: ["text/plain"],
                    getData: vi.fn().mockReturnValue("Pasted text"),
                    items: [],
                    files: { length: 0, item: vi.fn() },
                },
                preventDefault: vi.fn(),
            } as unknown as React.ClipboardEvent;

            await act(async () => {
                await result.current.handlePaste(mockEvent);
            });

            expect(onPaste).toHaveBeenCalled();
        });
    });

    describe("state properties", () => {
        it("should have isCopying property", () => {
            const { result } = renderHook(() => useClipboard());
            expect(result.current.isCopying).toBe(false);
        });

        it("should have hasCopied property", () => {
            const { result } = renderHook(() => useClipboard());
            expect(result.current.hasCopied).toBe(false);
        });
    });
});

describe("copyToClipboard utility", () => {
    const mockWriteText = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        Object.defineProperty(navigator, "clipboard", {
            value: {
                writeText: mockWriteText,
            },
            writable: true,
            configurable: true,
        });
    });

    it("should copy text using clipboard API", async () => {
        mockWriteText.mockResolvedValue(undefined);

        const success = await copyToClipboard("Test text");

        expect(success).toBe(true);
        expect(mockWriteText).toHaveBeenCalledWith("Test text");
    });

    it("should return false when copy fails", async () => {
        mockWriteText.mockRejectedValue(new Error("Failed"));

        const success = await copyToClipboard("Test text");

        expect(success).toBe(false);
    });
});

describe("isClipboardApiAvailable utility", () => {
    it("should return true when writeText is available", () => {
        Object.defineProperty(navigator, "clipboard", {
            value: { writeText: vi.fn() },
            writable: true,
            configurable: true,
        });

        expect(isClipboardApiAvailable()).toBe(true);
    });

    it("should return true when write is available", () => {
        Object.defineProperty(navigator, "clipboard", {
            value: { write: vi.fn() },
            writable: true,
            configurable: true,
        });

        expect(isClipboardApiAvailable()).toBe(true);
    });

    it("should return false when clipboard is not available", () => {
        Object.defineProperty(navigator, "clipboard", {
            value: null,
            writable: true,
            configurable: true,
        });

        expect(isClipboardApiAvailable()).toBe(false);
    });
});

// Note: Image paste and readClipboard tests have been moved to integration tests
// due to test isolation issues with dynamically modifying navigator.clipboard.
// The tests above cover the main hook functionality with proper mock setup.

// Note: hasClipboardType, fallback copy, and copyToClipboard fallback tests
// are covered by the integration tests. The hook tests above cover the main
// functionality. Additional tests for edge cases could be added with proper
// test isolation if needed.
