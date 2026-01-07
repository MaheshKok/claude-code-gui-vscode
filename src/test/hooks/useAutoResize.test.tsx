import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import {
    useAutoResize,
    calculateTextareaHeight,
    createMeasureElement,
} from "../../webview/hooks/useAutoResize";

describe("useAutoResize", () => {
    let mockTextarea: HTMLTextAreaElement;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();

        // Create a mock textarea element
        mockTextarea = document.createElement("textarea");
        // Define scrollHeight with getter only
        Object.defineProperty(mockTextarea, "scrollHeight", {
            get: () => 100,
            configurable: true,
        });

        // Mock getComputedStyle
        vi.spyOn(window, "getComputedStyle").mockReturnValue({
            lineHeight: "20px",
            paddingTop: "8px",
            paddingBottom: "8px",
            borderTopWidth: "1px",
            borderBottomWidth: "1px",
            getPropertyValue: vi.fn((prop) => {
                const styles: Record<string, string> = {
                    "font-family": "Arial",
                    "font-size": "14px",
                    "font-weight": "400",
                    "line-height": "20px",
                    "letter-spacing": "normal",
                    padding: "8px",
                    border: "1px solid",
                    "box-sizing": "border-box",
                    width: "300px",
                };
                return styles[prop] || "";
            }),
        } as unknown as CSSStyleDeclaration);

        // Mock requestAnimationFrame
        vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
            cb(0);
            return 0;
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    describe("initialization", () => {
        it("should return default values", () => {
            const { result } = renderHook(() => useAutoResize());

            expect(result.current.value).toBe("");
            expect(result.current.textareaRef).toBeDefined();
            expect(typeof result.current.handleChange).toBe("function");
            expect(typeof result.current.reset).toBe("function");
            expect(typeof result.current.resize).toBe("function");
            expect(typeof result.current.setValue).toBe("function");
        });

        it("should initialize with initialValue", () => {
            const { result } = renderHook(() => useAutoResize({ initialValue: "test content" }));

            expect(result.current.value).toBe("test content");
        });
    });

    describe("setValue", () => {
        it("should update value", () => {
            const { result } = renderHook(() => useAutoResize());

            act(() => {
                result.current.setValue("new value");
            });

            expect(result.current.value).toBe("new value");
        });

        it("should call onChange callback", () => {
            const onChange = vi.fn();
            const { result } = renderHook(() => useAutoResize({ onChange }));

            act(() => {
                result.current.setValue("new value");
            });

            expect(onChange).toHaveBeenCalledWith("new value");
        });
    });

    describe("handleChange", () => {
        it("should update value from event", () => {
            const { result } = renderHook(() => useAutoResize());

            act(() => {
                result.current.handleChange({
                    target: { value: "event value" },
                } as React.ChangeEvent<HTMLTextAreaElement>);
            });

            expect(result.current.value).toBe("event value");
        });
    });

    describe("reset", () => {
        it("should reset to initial value", () => {
            const { result } = renderHook(() => useAutoResize({ initialValue: "initial" }));

            act(() => {
                result.current.setValue("changed");
            });

            expect(result.current.value).toBe("changed");

            act(() => {
                result.current.reset();
            });

            expect(result.current.value).toBe("initial");
        });

        it("should call onChange with initial value", () => {
            const onChange = vi.fn();
            const { result } = renderHook(() =>
                useAutoResize({ initialValue: "initial", onChange }),
            );

            act(() => {
                result.current.setValue("changed");
            });

            onChange.mockClear();

            act(() => {
                result.current.reset();
            });

            expect(onChange).toHaveBeenCalledWith("initial");
        });

        it("should reset height when textarea ref exists", () => {
            const { result } = renderHook(() => useAutoResize({ minHeight: 50 }));

            // Simulate attaching the ref to a textarea
            Object.defineProperty(result.current.textareaRef, "current", {
                value: mockTextarea,
                writable: true,
            });

            act(() => {
                result.current.reset();
            });

            expect(mockTextarea.style.height).toBe("50px");
            expect(mockTextarea.style.overflowY).toBe("hidden");
        });
    });

    describe("resize", () => {
        it("should resize when textarea ref exists", () => {
            const { result } = renderHook(() => useAutoResize({ maxHeight: 200, minHeight: 50 }));

            Object.defineProperty(result.current.textareaRef, "current", {
                value: mockTextarea,
                writable: true,
            });

            act(() => {
                result.current.resize();
            });

            // Should set height based on scrollHeight (100) clamped to min/max
            expect(mockTextarea.style.height).toBe("100px");
        });

        it("should set overflow to auto when at max height", () => {
            const { result } = renderHook(() => useAutoResize({ maxHeight: 50, minHeight: 30 }));

            Object.defineProperty(result.current.textareaRef, "current", {
                value: mockTextarea,
                writable: true,
            });

            act(() => {
                result.current.resize();
            });

            // scrollHeight is 100, max is 50, so should be clamped
            expect(mockTextarea.style.height).toBe("50px");
            expect(mockTextarea.style.overflowY).toBe("auto");
            expect(result.current.isAtMaxHeight).toBe(true);
        });

        it("should do nothing when ref is null", () => {
            const { result } = renderHook(() => useAutoResize());

            // textareaRef.current is null by default
            act(() => {
                result.current.resize();
            });

            // Should not throw
            expect(result.current.height).toBe(0);
        });
    });

    describe("getMinHeight calculation", () => {
        it("should use provided minHeight option", () => {
            const { result } = renderHook(() => useAutoResize({ minHeight: 100 }));

            Object.defineProperty(result.current.textareaRef, "current", {
                value: mockTextarea,
                writable: true,
            });

            // Set scrollHeight to less than minHeight
            Object.defineProperty(mockTextarea, "scrollHeight", {
                get: () => 50,
                configurable: true,
            });

            act(() => {
                result.current.resize();
            });

            // Should use minHeight (100) instead of scrollHeight (50)
            expect(mockTextarea.style.height).toBe("100px");
        });

        it("should calculate from line height and minRows", () => {
            const { result } = renderHook(() => useAutoResize({ minRows: 3 }));

            Object.defineProperty(result.current.textareaRef, "current", {
                value: mockTextarea,
                writable: true,
            });

            Object.defineProperty(mockTextarea, "scrollHeight", {
                get: () => 10,
                configurable: true,
            });

            act(() => {
                result.current.resize();
            });

            // lineHeight(20) * minRows(3) + paddingTop(8) + paddingBottom(8) + borderTop(1) + borderBottom(1) = 78
            expect(mockTextarea.style.height).toBe("78px");
        });
    });

    describe("resetOnEmpty effect", () => {
        it("should reset height when value becomes empty", () => {
            const { result } = renderHook(() =>
                useAutoResize({ resetOnEmpty: true, minHeight: 40 }),
            );

            Object.defineProperty(result.current.textareaRef, "current", {
                value: mockTextarea,
                writable: true,
            });

            act(() => {
                result.current.setValue("some content");
            });

            act(() => {
                result.current.setValue("");
            });

            expect(mockTextarea.style.height).toBe("40px");
            expect(mockTextarea.style.overflowY).toBe("hidden");
        });

        it("should not reset height when resetOnEmpty is false", () => {
            const { result } = renderHook(() => useAutoResize({ resetOnEmpty: false }));

            Object.defineProperty(result.current.textareaRef, "current", {
                value: mockTextarea,
                writable: true,
            });

            act(() => {
                result.current.setValue("some content");
            });

            const heightBefore = mockTextarea.style.height;

            act(() => {
                result.current.setValue("");
            });

            // Height should not change when resetOnEmpty is false
            // (actual resize will happen from setValue, but the effect won't reset it)
        });
    });

    describe("window resize listener", () => {
        it("should recalculate on window resize", () => {
            const { result } = renderHook(() => useAutoResize());

            Object.defineProperty(result.current.textareaRef, "current", {
                value: mockTextarea,
                writable: true,
            });

            act(() => {
                result.current.resize();
            });

            const heightBefore = result.current.height;

            // Change scrollHeight to simulate resize
            Object.defineProperty(mockTextarea, "scrollHeight", {
                get: () => 150,
                configurable: true,
            });

            // Trigger window resize
            act(() => {
                window.dispatchEvent(new Event("resize"));
            });

            // Height should have been recalculated
            expect(result.current.height).toBe(150);
        });

        it("should clean up resize listener on unmount", () => {
            const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
            const { unmount } = renderHook(() => useAutoResize());

            unmount();

            expect(removeEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function));
        });
    });
});

describe("calculateTextareaHeight", () => {
    it("should calculate height from line count when no element provided", () => {
        const text = "line1\nline2\nline3";
        const height = calculateTextareaHeight(text, {
            lineHeight: 20,
            padding: 16,
        });

        // 3 lines * 20 + 16 padding = 76
        expect(height).toBe(76);
    });

    it("should respect maxHeight", () => {
        const text = "line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8\nline9\nline10";
        const height = calculateTextareaHeight(text, {
            lineHeight: 20,
            padding: 16,
            maxHeight: 100,
        });

        expect(height).toBe(100);
    });

    it("should use element scrollHeight when element provided", () => {
        const mockElement = document.createElement("textarea");
        Object.defineProperty(mockElement, "scrollHeight", {
            get: () => 150,
            configurable: true,
        });

        const height = calculateTextareaHeight("text", {
            element: mockElement,
            maxHeight: 200,
        });

        expect(height).toBe(150);
    });

    it("should clamp element scrollHeight to maxHeight", () => {
        const mockElement = document.createElement("textarea");
        Object.defineProperty(mockElement, "scrollHeight", {
            get: () => 250,
            configurable: true,
        });

        const height = calculateTextareaHeight("text", {
            element: mockElement,
            maxHeight: 100,
        });

        expect(height).toBe(100);
    });

    it("should use default values when options not provided", () => {
        const text = "single line";
        const height = calculateTextareaHeight(text);

        // 1 line * 20 (default) + 16 (default padding) = 36
        expect(height).toBe(36);
    });
});

describe("createMeasureElement", () => {
    beforeEach(() => {
        vi.spyOn(window, "getComputedStyle").mockReturnValue({
            getPropertyValue: vi.fn((prop) => {
                const styles: Record<string, string> = {
                    "font-family": "Arial, sans-serif",
                    "font-size": "14px",
                    "font-weight": "400",
                    "line-height": "20px",
                    "letter-spacing": "0px",
                    padding: "10px",
                    border: "1px solid black",
                    "box-sizing": "border-box",
                    width: "400px",
                };
                return styles[prop] || "";
            }),
        } as unknown as CSSStyleDeclaration);
    });

    it("should create a textarea element", () => {
        const sourceElement = document.createElement("textarea");
        const measureElement = createMeasureElement(sourceElement);

        expect(measureElement).toBeInstanceOf(HTMLTextAreaElement);
    });

    it("should copy styles from source element", () => {
        const sourceElement = document.createElement("textarea");
        const measureElement = createMeasureElement(sourceElement);

        expect(measureElement.style.fontFamily).toBe("Arial, sans-serif");
        expect(measureElement.style.fontSize).toBe("14px");
        expect(measureElement.style.lineHeight).toBe("20px");
        expect(measureElement.style.width).toBe("400px");
    });

    it("should set positioning for hidden measurement", () => {
        const sourceElement = document.createElement("textarea");
        const measureElement = createMeasureElement(sourceElement);

        expect(measureElement.style.position).toBe("absolute");
        expect(measureElement.style.visibility).toBe("hidden");
        expect(measureElement.style.height).toBe("auto");
        expect(measureElement.style.overflow).toBe("hidden");
        expect(measureElement.style.whiteSpace).toBe("pre-wrap");
        expect(measureElement.style.wordWrap).toBe("break-word");
    });
});
