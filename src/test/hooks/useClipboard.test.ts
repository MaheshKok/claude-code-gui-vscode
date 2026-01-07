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

describe("handlePaste with images", () => {
    it("should handle image paste from files", async () => {
        const onPaste = vi.fn();
        const { result } = renderHook(() => useClipboard({ onPaste, detectImages: true }));

        // Create a mock image file
        const mockImageBlob = new Blob(["fake-image"], { type: "image/png" });
        const mockFile = Object.assign(mockImageBlob, { name: "test.png" });

        const mockEvent = {
            clipboardData: {
                types: ["Files"],
                getData: vi.fn().mockReturnValue(""),
                items: [],
                files: {
                    length: 1,
                    0: mockFile,
                    item: () => mockFile,
                },
            },
            preventDefault: vi.fn(),
        } as unknown as React.ClipboardEvent;

        await act(async () => {
            await result.current.handlePaste(mockEvent);
        });

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(onPaste).toHaveBeenCalled();
    });

    it("should handle image paste from clipboard items", async () => {
        const onPaste = vi.fn();
        const { result } = renderHook(() => useClipboard({ onPaste, detectImages: true }));

        const mockImageBlob = new Blob(["fake-image"], { type: "image/png" });
        const mockItem = {
            type: "image/png",
            getAsFile: () => mockImageBlob,
        };

        const mockEvent = {
            clipboardData: {
                types: ["image/png"],
                getData: vi.fn().mockReturnValue(""),
                items: [mockItem],
                files: { length: 0 },
            },
            preventDefault: vi.fn(),
        } as unknown as React.ClipboardEvent;

        await act(async () => {
            await result.current.handlePaste(mockEvent);
        });

        expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it("should return null when clipboardData is null", async () => {
        const { result } = renderHook(() => useClipboard());

        const mockEvent = {
            clipboardData: null,
            preventDefault: vi.fn(),
        } as unknown as React.ClipboardEvent;

        let pasteResult: any;
        await act(async () => {
            pasteResult = await result.current.handlePaste(mockEvent);
        });

        expect(pasteResult).toBeNull();
    });

    it("should skip image detection when detectImages is false", async () => {
        const onPaste = vi.fn();
        const { result } = renderHook(() => useClipboard({ onPaste, detectImages: false }));

        const mockImageBlob = new Blob(["fake-image"], { type: "image/png" });
        const mockFile = Object.assign(mockImageBlob, { name: "test.png" });

        const mockEvent = {
            clipboardData: {
                types: ["Files", "text/plain"],
                getData: vi.fn().mockReturnValue("some text"),
                items: [],
                files: {
                    length: 1,
                    0: mockFile,
                },
            },
            preventDefault: vi.fn(),
        } as unknown as React.ClipboardEvent;

        await act(async () => {
            await result.current.handlePaste(mockEvent);
        });

        // Should fall through to text handling, not prevent default
        expect(mockEvent.preventDefault).not.toHaveBeenCalled();
        expect(onPaste).toHaveBeenCalledWith(expect.objectContaining({ type: "text" }));
    });

    it("should return null when no content is found", async () => {
        const { result } = renderHook(() => useClipboard());

        const mockEvent = {
            clipboardData: {
                types: [],
                getData: vi.fn().mockReturnValue(""),
                items: [],
                files: { length: 0 },
            },
            preventDefault: vi.fn(),
        } as unknown as React.ClipboardEvent;

        let pasteResult: any;
        await act(async () => {
            pasteResult = await result.current.handlePaste(mockEvent);
        });

        expect(pasteResult).toBeNull();
    });
});

describe("readClipboard", () => {
    it("should read text from clipboard", async () => {
        // Use readText fallback which is simpler to test
        Object.defineProperty(navigator, "clipboard", {
            value: {
                readText: vi.fn().mockResolvedValue("test text"),
            },
            writable: true,
            configurable: true,
        });

        const { result } = renderHook(() => useClipboard());

        let content: any;
        await act(async () => {
            content = await result.current.readClipboard();
        });

        expect(content).toEqual({
            type: "text",
            text: "test text",
        });
    });

    it("should read HTML from clipboard", async () => {
        // Test the read API path with proper blob mocking
        const mockHtmlBlob = new Blob(["<p>test</p>"], { type: "text/html" });
        // Mock the blob's text() method explicitly
        const mockText = vi.fn().mockResolvedValue("<p>test</p>");
        Object.defineProperty(mockHtmlBlob, "text", {
            value: mockText,
            writable: true,
        });

        const mockItem = {
            types: ["text/html"],
            getType: vi.fn().mockResolvedValue(mockHtmlBlob),
        };

        Object.defineProperty(navigator, "clipboard", {
            value: {
                read: vi.fn().mockResolvedValue([mockItem]),
            },
            writable: true,
            configurable: true,
        });

        const { result } = renderHook(() => useClipboard());

        let content: any;
        await act(async () => {
            content = await result.current.readClipboard();
        });

        expect(content).toEqual({
            type: "html",
            html: "<p>test</p>",
        });
    });

    it("should fall back to readText when read is not available", async () => {
        Object.defineProperty(navigator, "clipboard", {
            value: {
                readText: vi.fn().mockResolvedValue("fallback text"),
            },
            writable: true,
            configurable: true,
        });

        const { result } = renderHook(() => useClipboard());

        let content: any;
        await act(async () => {
            content = await result.current.readClipboard();
        });

        expect(content).toEqual({
            type: "text",
            text: "fallback text",
        });
    });

    it("should return null when clipboard access fails", async () => {
        Object.defineProperty(navigator, "clipboard", {
            value: {
                read: vi.fn().mockRejectedValue(new Error("Access denied")),
            },
            writable: true,
            configurable: true,
        });

        const { result } = renderHook(() => useClipboard());

        let content: any;
        await act(async () => {
            content = await result.current.readClipboard();
        });

        expect(content).toBeNull();
    });

    it("should return null when readText returns empty", async () => {
        Object.defineProperty(navigator, "clipboard", {
            value: {
                readText: vi.fn().mockResolvedValue(""),
            },
            writable: true,
            configurable: true,
        });

        const { result } = renderHook(() => useClipboard());

        let content: any;
        await act(async () => {
            content = await result.current.readClipboard();
        });

        expect(content).toBeNull();
    });
});

describe("hasClipboardType", () => {
    it("should return true when clipboard has text using readText", async () => {
        Object.defineProperty(navigator, "clipboard", {
            value: {
                readText: vi.fn().mockResolvedValue("test text"),
            },
            writable: true,
            configurable: true,
        });

        const { result } = renderHook(() => useClipboard());

        let hasText: boolean = false;
        await act(async () => {
            hasText = await result.current.hasClipboardType("text");
        });

        expect(hasText).toBe(true);
    });

    it("should return false when clipboard is empty", async () => {
        Object.defineProperty(navigator, "clipboard", {
            value: {
                readText: vi.fn().mockResolvedValue(""),
            },
            writable: true,
            configurable: true,
        });

        const { result } = renderHook(() => useClipboard());

        let hasText: boolean = true;
        await act(async () => {
            hasText = await result.current.hasClipboardType("text");
        });

        expect(hasText).toBe(false);
    });
});

describe("copyText fallback", () => {
    it("should use execCommand fallback when clipboard API is not available", async () => {
        const mockExecCommand = vi.fn().mockReturnValue(true);
        const appendChildSpy = vi.spyOn(document.body, "appendChild");
        const removeChildSpy = vi.spyOn(document.body, "removeChild");

        Object.defineProperty(navigator, "clipboard", {
            value: null,
            writable: true,
            configurable: true,
        });
        Object.defineProperty(document, "execCommand", {
            value: mockExecCommand,
            writable: true,
            configurable: true,
        });

        const { result } = renderHook(() => useClipboard({ useExtension: false }));

        let success: boolean = false;
        await act(async () => {
            success = await result.current.copyText("test");
        });

        expect(success).toBe(true);
        expect(appendChildSpy).toHaveBeenCalled();
        expect(removeChildSpy).toHaveBeenCalled();

        appendChildSpy.mockRestore();
        removeChildSpy.mockRestore();
    });

    it("should return false when execCommand fails", async () => {
        const mockExecCommand = vi.fn().mockReturnValue(false);

        Object.defineProperty(navigator, "clipboard", {
            value: null,
            writable: true,
            configurable: true,
        });
        Object.defineProperty(document, "execCommand", {
            value: mockExecCommand,
            writable: true,
            configurable: true,
        });

        const { result } = renderHook(() => useClipboard({ useExtension: false }));

        let success: boolean = true;
        await act(async () => {
            success = await result.current.copyText("test");
        });

        expect(success).toBe(false);
    });
});

describe("copyToClipboard fallback", () => {
    it("should use execCommand fallback when clipboard API is not available", async () => {
        const mockExecCommand = vi.fn().mockReturnValue(true);

        Object.defineProperty(navigator, "clipboard", {
            value: null,
            writable: true,
            configurable: true,
        });
        Object.defineProperty(document, "execCommand", {
            value: mockExecCommand,
            writable: true,
            configurable: true,
        });

        const success = await copyToClipboard("test");

        expect(success).toBe(true);
        expect(mockExecCommand).toHaveBeenCalledWith("copy");
    });
});

describe("cleanup", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("should clear timeout on unmount", async () => {
        const mockWriteText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, "clipboard", {
            value: { writeText: mockWriteText },
            writable: true,
            configurable: true,
        });

        const { result, unmount } = renderHook(() =>
            useClipboard({ useExtension: false, copyFeedbackTimeout: 5000 }),
        );

        await act(async () => {
            await result.current.copyText("test");
        });

        expect(result.current.hasCopied).toBe(true);

        // Unmount should clear the timeout
        unmount();

        // Advance timers - hasCopied should not change as component is unmounted
        act(() => {
            vi.advanceTimersByTime(5000);
        });

        // No error should occur
    });
});
