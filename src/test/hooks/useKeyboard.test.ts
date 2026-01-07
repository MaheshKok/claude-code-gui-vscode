import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useKeyboard, useChatKeyboard, formatShortcut } from "../../webview/hooks/useKeyboard";

describe("useKeyboard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("basic functionality", () => {
        it("should initialize with provided shortcuts", () => {
            const handler = vi.fn();
            const { result } = renderHook(() =>
                useKeyboard({
                    shortcuts: [{ key: "Escape", handler, description: "Close" }],
                }),
            );

            const shortcuts = result.current.getShortcuts();
            expect(shortcuts).toHaveLength(1);
            expect(shortcuts[0].key).toBe("Escape");
        });

        it("should call handler when key is pressed", () => {
            const handler = vi.fn();
            renderHook(() =>
                useKeyboard({
                    shortcuts: [{ key: "Escape", handler }],
                }),
            );

            const event = new KeyboardEvent("keydown", { key: "Escape" });
            document.dispatchEvent(event);

            expect(handler).toHaveBeenCalled();
        });

        it("should not call handler for non-matching key", () => {
            const handler = vi.fn();
            renderHook(() =>
                useKeyboard({
                    shortcuts: [{ key: "Escape", handler }],
                }),
            );

            const event = new KeyboardEvent("keydown", { key: "Enter" });
            document.dispatchEvent(event);

            expect(handler).not.toHaveBeenCalled();
        });

        it("should not respond when disabled", () => {
            const handler = vi.fn();
            renderHook(() =>
                useKeyboard({
                    enabled: false,
                    shortcuts: [{ key: "Escape", handler }],
                }),
            );

            const event = new KeyboardEvent("keydown", { key: "Escape" });
            document.dispatchEvent(event);

            expect(handler).not.toHaveBeenCalled();
        });
    });

    describe("modifier keys", () => {
        it("should match shortcut with ctrl modifier", () => {
            const handler = vi.fn();
            renderHook(() =>
                useKeyboard({
                    shortcuts: [{ key: "s", modifiers: { ctrl: true }, handler }],
                }),
            );

            // Without ctrl
            const eventNoCtrl = new KeyboardEvent("keydown", { key: "s" });
            document.dispatchEvent(eventNoCtrl);
            expect(handler).not.toHaveBeenCalled();

            // With ctrl
            const eventWithCtrl = new KeyboardEvent("keydown", { key: "s", ctrlKey: true });
            document.dispatchEvent(eventWithCtrl);
            expect(handler).toHaveBeenCalled();
        });

        it("should match shortcut with shift modifier", () => {
            const handler = vi.fn();
            renderHook(() =>
                useKeyboard({
                    shortcuts: [{ key: "Enter", modifiers: { shift: true }, handler }],
                }),
            );

            const event = new KeyboardEvent("keydown", { key: "Enter", shiftKey: true });
            document.dispatchEvent(event);

            expect(handler).toHaveBeenCalled();
        });

        it("should match shortcut with alt modifier", () => {
            const handler = vi.fn();
            renderHook(() =>
                useKeyboard({
                    shortcuts: [{ key: "a", modifiers: { alt: true }, handler }],
                }),
            );

            const event = new KeyboardEvent("keydown", { key: "a", altKey: true });
            document.dispatchEvent(event);

            expect(handler).toHaveBeenCalled();
        });

        it("should match shortcut with meta modifier", () => {
            const handler = vi.fn();
            renderHook(() =>
                useKeyboard({
                    shortcuts: [{ key: "k", modifiers: { meta: true }, handler }],
                }),
            );

            const event = new KeyboardEvent("keydown", { key: "k", metaKey: true });
            document.dispatchEvent(event);

            expect(handler).toHaveBeenCalled();
        });

        it("should match shortcut with multiple modifiers", () => {
            const handler = vi.fn();
            renderHook(() =>
                useKeyboard({
                    shortcuts: [{ key: "z", modifiers: { ctrl: true, shift: true }, handler }],
                }),
            );

            // Only ctrl
            const eventCtrl = new KeyboardEvent("keydown", { key: "z", ctrlKey: true });
            document.dispatchEvent(eventCtrl);
            expect(handler).not.toHaveBeenCalled();

            // Both ctrl and shift
            const eventBoth = new KeyboardEvent("keydown", {
                key: "z",
                ctrlKey: true,
                shiftKey: true,
            });
            document.dispatchEvent(eventBoth);
            expect(handler).toHaveBeenCalled();
        });
    });

    describe("preventDefault and stopPropagation", () => {
        it("should call preventDefault when specified", () => {
            const handler = vi.fn();
            renderHook(() =>
                useKeyboard({
                    shortcuts: [
                        { key: "s", modifiers: { ctrl: true }, handler, preventDefault: true },
                    ],
                }),
            );

            const event = new KeyboardEvent("keydown", { key: "s", ctrlKey: true });
            const preventDefaultSpy = vi.spyOn(event, "preventDefault");
            document.dispatchEvent(event);

            expect(preventDefaultSpy).toHaveBeenCalled();
        });

        it("should call stopPropagation when specified", () => {
            const handler = vi.fn();
            renderHook(() =>
                useKeyboard({
                    shortcuts: [{ key: "Escape", handler, stopPropagation: true }],
                }),
            );

            const event = new KeyboardEvent("keydown", { key: "Escape" });
            const stopPropagationSpy = vi.spyOn(event, "stopPropagation");
            document.dispatchEvent(event);

            expect(stopPropagationSpy).toHaveBeenCalled();
        });
    });

    describe("addShortcut", () => {
        it("should add a new shortcut", () => {
            const { result } = renderHook(() => useKeyboard());
            const handler = vi.fn();

            act(() => {
                result.current.addShortcut({ key: "Enter", handler });
            });

            const event = new KeyboardEvent("keydown", { key: "Enter" });
            document.dispatchEvent(event);

            expect(handler).toHaveBeenCalled();
        });

        it("should return a cleanup function", () => {
            const { result } = renderHook(() => useKeyboard());
            const handler = vi.fn();
            let cleanup: () => void;

            act(() => {
                cleanup = result.current.addShortcut({ key: "Enter", handler });
            });

            // Trigger the shortcut
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
            expect(handler).toHaveBeenCalledTimes(1);

            // Remove the shortcut
            act(() => {
                cleanup();
            });

            // Should not trigger after removal
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
            expect(handler).toHaveBeenCalledTimes(1);
        });
    });

    describe("removeShortcut", () => {
        it("should remove a shortcut", () => {
            const handler = vi.fn();
            const { result } = renderHook(() =>
                useKeyboard({
                    shortcuts: [{ key: "Escape", handler }],
                }),
            );

            act(() => {
                result.current.removeShortcut("Escape");
            });

            const event = new KeyboardEvent("keydown", { key: "Escape" });
            document.dispatchEvent(event);

            expect(handler).not.toHaveBeenCalled();
        });

        it("should remove shortcut with modifiers", () => {
            const handler = vi.fn();
            const { result } = renderHook(() =>
                useKeyboard({
                    shortcuts: [{ key: "s", modifiers: { ctrl: true }, handler }],
                }),
            );

            act(() => {
                result.current.removeShortcut("s", { ctrl: true });
            });

            const event = new KeyboardEvent("keydown", { key: "s", ctrlKey: true });
            document.dispatchEvent(event);

            expect(handler).not.toHaveBeenCalled();
        });
    });

    describe("enableShortcut and disableShortcut", () => {
        it("should disable a shortcut", () => {
            const handler = vi.fn();
            const { result } = renderHook(() =>
                useKeyboard({
                    shortcuts: [{ key: "Escape", handler }],
                }),
            );

            act(() => {
                result.current.disableShortcut("Escape");
            });

            const event = new KeyboardEvent("keydown", { key: "Escape" });
            document.dispatchEvent(event);

            expect(handler).not.toHaveBeenCalled();
        });

        it("should re-enable a disabled shortcut", () => {
            const handler = vi.fn();
            const { result } = renderHook(() =>
                useKeyboard({
                    shortcuts: [{ key: "Escape", handler, enabled: false }],
                }),
            );

            // Should not work initially
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
            expect(handler).not.toHaveBeenCalled();

            // Enable the shortcut
            act(() => {
                result.current.enableShortcut("Escape");
            });

            // Should work now
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
            expect(handler).toHaveBeenCalled();
        });
    });

    describe("getShortcuts", () => {
        it("should return all registered shortcuts", () => {
            const handler1 = vi.fn();
            const handler2 = vi.fn();
            const { result } = renderHook(() =>
                useKeyboard({
                    shortcuts: [
                        { key: "Escape", handler: handler1 },
                        { key: "Enter", handler: handler2 },
                    ],
                }),
            );

            const shortcuts = result.current.getShortcuts();
            expect(shortcuts).toHaveLength(2);
        });

        it("should return empty array when no shortcuts", () => {
            const { result } = renderHook(() => useKeyboard());

            const shortcuts = result.current.getShortcuts();
            expect(shortcuts).toEqual([]);
        });
    });

    describe("event cleanup", () => {
        it("should remove event listener on unmount", () => {
            const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");
            const { unmount } = renderHook(() =>
                useKeyboard({
                    shortcuts: [{ key: "Escape", handler: vi.fn() }],
                }),
            );

            unmount();

            expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
            removeEventListenerSpy.mockRestore();
        });
    });
});

describe("useChatKeyboard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // Helper to create React keyboard event
    const createKeyboardEvent = (
        key: string,
        options: Partial<KeyboardEvent> = {},
    ): React.KeyboardEvent =>
        ({
            key,
            ctrlKey: options.ctrlKey || false,
            altKey: options.altKey || false,
            shiftKey: options.shiftKey || false,
            metaKey: options.metaKey || false,
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
            nativeEvent: new KeyboardEvent("keydown", { key, ...options }),
        }) as unknown as React.KeyboardEvent;

    it("should call onSend when Enter is pressed", () => {
        const onSend = vi.fn();
        const { result } = renderHook(() => useChatKeyboard({ onSend }));

        act(() => {
            result.current(createKeyboardEvent("Enter"));
        });

        expect(onSend).toHaveBeenCalled();
    });

    it("should call onEscape when Escape is pressed", () => {
        const onEscape = vi.fn();
        const { result } = renderHook(() => useChatKeyboard({ onEscape }));

        act(() => {
            result.current(createKeyboardEvent("Escape"));
        });

        expect(onEscape).toHaveBeenCalled();
    });

    it("should call onNewLine when Shift+Enter is pressed", () => {
        const onNewLine = vi.fn();
        const { result } = renderHook(() => useChatKeyboard({ onNewLine }));

        act(() => {
            result.current(createKeyboardEvent("Enter", { shiftKey: true }));
        });

        expect(onNewLine).toHaveBeenCalled();
    });

    it("should use Ctrl+Enter to send when ctrlEnterToSend is true", () => {
        const onSend = vi.fn();
        const { result } = renderHook(() => useChatKeyboard({ onSend, ctrlEnterToSend: true }));

        // Regular Enter should not send
        act(() => {
            result.current(createKeyboardEvent("Enter"));
        });
        expect(onSend).not.toHaveBeenCalled();

        // Ctrl+Enter should send
        act(() => {
            result.current(createKeyboardEvent("Enter", { ctrlKey: true }));
        });
        expect(onSend).toHaveBeenCalled();
    });

    it("should call onHistoryPrev on ArrowUp when input is empty", () => {
        const onHistoryPrev = vi.fn();
        const { result } = renderHook(() => useChatKeyboard({ onHistoryPrev, isInputEmpty: true }));

        act(() => {
            result.current(createKeyboardEvent("ArrowUp"));
        });

        expect(onHistoryPrev).toHaveBeenCalled();
    });

    it("should not call onHistoryPrev on ArrowUp when input has content", () => {
        const onHistoryPrev = vi.fn();
        const { result } = renderHook(() =>
            useChatKeyboard({ onHistoryPrev, isInputEmpty: false }),
        );

        act(() => {
            result.current(createKeyboardEvent("ArrowUp"));
        });

        expect(onHistoryPrev).not.toHaveBeenCalled();
    });

    it("should call onHistoryNext on ArrowDown when suggestions are visible", () => {
        const onHistoryNext = vi.fn();
        const { result } = renderHook(() =>
            useChatKeyboard({ onHistoryNext, suggestionsVisible: true }),
        );

        act(() => {
            result.current(createKeyboardEvent("ArrowDown"));
        });

        expect(onHistoryNext).toHaveBeenCalled();
    });

    it("should call onTab when Tab is pressed and suggestions are visible", () => {
        const onTab = vi.fn();
        const { result } = renderHook(() => useChatKeyboard({ onTab, suggestionsVisible: true }));

        act(() => {
            result.current(createKeyboardEvent("Tab"));
        });

        expect(onTab).toHaveBeenCalled();
    });

    it("should trigger onFilePicker when @ is typed", () => {
        vi.useFakeTimers();
        const onFilePicker = vi.fn();
        const { result } = renderHook(() => useChatKeyboard({ onFilePicker }));

        act(() => {
            result.current(createKeyboardEvent("@"));
        });

        act(() => {
            vi.advanceTimersByTime(10);
        });

        expect(onFilePicker).toHaveBeenCalled();
        vi.useRealTimers();
    });

    it("should trigger onSlashCommand when / is typed on empty input", () => {
        vi.useFakeTimers();
        const onSlashCommand = vi.fn();
        const { result } = renderHook(() =>
            useChatKeyboard({ onSlashCommand, isInputEmpty: true }),
        );

        act(() => {
            result.current(createKeyboardEvent("/"));
        });

        act(() => {
            vi.advanceTimersByTime(10);
        });

        expect(onSlashCommand).toHaveBeenCalled();
        vi.useRealTimers();
    });
});

describe("formatShortcut", () => {
    const originalNavigator = global.navigator;

    afterEach(() => {
        // Restore original navigator
        Object.defineProperty(global, "navigator", {
            value: originalNavigator,
            writable: true,
            configurable: true,
        });
    });

    describe("on non-Mac platforms", () => {
        beforeEach(() => {
            Object.defineProperty(global, "navigator", {
                value: { platform: "Win32" },
                writable: true,
                configurable: true,
            });
        });

        it("should format simple key", () => {
            expect(formatShortcut("a")).toBe("A");
        });

        it("should format key with Ctrl modifier", () => {
            expect(formatShortcut("a", { ctrl: true })).toBe("Ctrl+A");
        });

        it("should format key with Alt modifier", () => {
            expect(formatShortcut("a", { alt: true })).toBe("Alt+A");
        });

        it("should format key with Shift modifier", () => {
            expect(formatShortcut("a", { shift: true })).toBe("Shift+A");
        });

        it("should format key with Meta modifier", () => {
            expect(formatShortcut("a", { meta: true })).toBe("Win+A");
        });

        it("should format key with multiple modifiers", () => {
            expect(formatShortcut("a", { ctrl: true, shift: true })).toBe("Ctrl+Shift+A");
        });

        it("should format Enter key", () => {
            expect(formatShortcut("Enter")).toBe("Enter");
        });

        it("should format Escape key", () => {
            expect(formatShortcut("Escape")).toBe("Esc");
        });

        it("should format arrow keys", () => {
            expect(formatShortcut("ArrowUp")).toBe("\u2191");
            expect(formatShortcut("ArrowDown")).toBe("\u2193");
            expect(formatShortcut("ArrowLeft")).toBe("\u2190");
            expect(formatShortcut("ArrowRight")).toBe("\u2192");
        });

        it("should format Tab key", () => {
            expect(formatShortcut("Tab")).toBe("\u21E5");
        });

        it("should format Backspace key", () => {
            expect(formatShortcut("Backspace")).toBe("Backspace");
        });

        it("should format Delete key", () => {
            expect(formatShortcut("Delete")).toBe("Del");
        });

        it("should format Space key", () => {
            expect(formatShortcut(" ")).toBe("Space");
        });
    });

    describe("on Mac platforms", () => {
        beforeEach(() => {
            Object.defineProperty(global, "navigator", {
                value: { platform: "MacIntel" },
                writable: true,
                configurable: true,
            });
        });

        it("should use Mac-style Ctrl symbol (Command)", () => {
            expect(formatShortcut("a", { ctrl: true })).toBe("\u2318A");
        });

        it("should use Mac-style Alt symbol (Option)", () => {
            expect(formatShortcut("a", { alt: true })).toBe("\u2325A");
        });

        it("should use Mac-style Shift symbol", () => {
            expect(formatShortcut("a", { shift: true })).toBe("\u21E7A");
        });

        it("should use Mac-style Meta symbol (Command)", () => {
            expect(formatShortcut("a", { meta: true })).toBe("\u2318A");
        });

        it("should format Enter with Mac symbol", () => {
            expect(formatShortcut("Enter")).toBe("\u21A9");
        });

        it("should format Escape with Mac symbol", () => {
            expect(formatShortcut("Escape")).toBe("\u238B");
        });

        it("should format Backspace with Mac symbol", () => {
            expect(formatShortcut("Backspace")).toBe("\u232B");
        });

        it("should format Delete with Mac symbol", () => {
            expect(formatShortcut("Delete")).toBe("\u2326");
        });

        it("should format multiple modifiers without plus sign", () => {
            expect(formatShortcut("a", { ctrl: true, shift: true })).toBe("\u2318\u21E7A");
        });
    });

    describe("edge cases", () => {
        it("should handle undefined modifiers", () => {
            expect(formatShortcut("a", undefined)).toBe("A");
        });

        it("should handle empty modifiers object", () => {
            expect(formatShortcut("a", {})).toBe("A");
        });

        it("should handle modifiers set to false", () => {
            expect(
                formatShortcut("a", { ctrl: false, alt: false, shift: false, meta: false }),
            ).toBe("A");
        });
    });
});
