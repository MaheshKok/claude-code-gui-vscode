import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
    useAutoResize,
    calculateTextareaHeight,
    createMeasureElement,
} from "../../webview/hooks/useAutoResize";

// Mock requestAnimationFrame
const mockRequestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
    callback(0);
    return 0;
});

describe("useAutoResize", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal("requestAnimationFrame", mockRequestAnimationFrame);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe("basic functionality", () => {
        it("should initialize with empty value by default", () => {
            const { result } = renderHook(() => useAutoResize());

            expect(result.current.value).toBe("");
        });

        it("should initialize with initial value", () => {
            const { result } = renderHook(() => useAutoResize({ initialValue: "Hello" }));

            expect(result.current.value).toBe("Hello");
        });

        it("should provide a textarea ref", () => {
            const { result } = renderHook(() => useAutoResize());

            expect(result.current.textareaRef).toBeDefined();
            expect(result.current.textareaRef.current).toBeNull(); // Not attached yet
        });

        it("should track height state", () => {
            const { result } = renderHook(() => useAutoResize());

            expect(typeof result.current.height).toBe("number");
        });

        it("should track isAtMaxHeight state", () => {
            const { result } = renderHook(() => useAutoResize());

            expect(result.current.isAtMaxHeight).toBe(false);
        });
    });

    describe("setValue", () => {
        it("should update value", () => {
            const { result } = renderHook(() => useAutoResize());

            act(() => {
                result.current.setValue("New value");
            });

            expect(result.current.value).toBe("New value");
        });

        it("should call onChange callback", () => {
            const onChange = vi.fn();
            const { result } = renderHook(() => useAutoResize({ onChange }));

            act(() => {
                result.current.setValue("Test");
            });

            expect(onChange).toHaveBeenCalledWith("Test");
        });

        it("should trigger resize via requestAnimationFrame", () => {
            const { result } = renderHook(() => useAutoResize());

            act(() => {
                result.current.setValue("Test");
            });

            expect(mockRequestAnimationFrame).toHaveBeenCalled();
        });
    });

    describe("handleChange", () => {
        it("should update value from event", () => {
            const { result } = renderHook(() => useAutoResize());

            act(() => {
                result.current.handleChange({
                    target: { value: "Event value" },
                } as React.ChangeEvent<HTMLTextAreaElement>);
            });

            expect(result.current.value).toBe("Event value");
        });

        it("should call onChange callback", () => {
            const onChange = vi.fn();
            const { result } = renderHook(() => useAutoResize({ onChange }));

            act(() => {
                result.current.handleChange({
                    target: { value: "Test" },
                } as React.ChangeEvent<HTMLTextAreaElement>);
            });

            expect(onChange).toHaveBeenCalledWith("Test");
        });
    });

    describe("reset", () => {
        it("should reset value to initial value", () => {
            const { result } = renderHook(() => useAutoResize({ initialValue: "Initial" }));

            act(() => {
                result.current.setValue("Changed");
            });

            expect(result.current.value).toBe("Changed");

            act(() => {
                result.current.reset();
            });

            expect(result.current.value).toBe("Initial");
        });

        it("should reset to empty string by default", () => {
            const { result } = renderHook(() => useAutoResize());

            act(() => {
                result.current.setValue("Something");
                result.current.reset();
            });

            expect(result.current.value).toBe("");
        });

        it("should call onChange with initial value", () => {
            const onChange = vi.fn();
            const { result } = renderHook(() => useAutoResize({ initialValue: "", onChange }));

            act(() => {
                result.current.setValue("Test");
            });

            onChange.mockClear();

            act(() => {
                result.current.reset();
            });

            expect(onChange).toHaveBeenCalledWith("");
        });
    });

    describe("resize", () => {
        it("should not throw when textarea ref is null", () => {
            const { result } = renderHook(() => useAutoResize());

            expect(() => {
                act(() => {
                    result.current.resize();
                });
            }).not.toThrow();
        });
    });

    describe("options", () => {
        it("should respect maxHeight option", () => {
            const { result } = renderHook(() => useAutoResize({ maxHeight: 500 }));

            // Hook initializes properly with the option
            expect(result.current.isAtMaxHeight).toBe(false);
        });

        it("should respect minHeight option", () => {
            const { result } = renderHook(() => useAutoResize({ minHeight: 100 }));

            // Hook initializes properly with the option
            expect(typeof result.current.height).toBe("number");
        });

        it("should respect minRows option", () => {
            const { result } = renderHook(() => useAutoResize({ minRows: 3 }));

            // Hook initializes properly with the option
            expect(typeof result.current.height).toBe("number");
        });

        it("should handle resetOnEmpty option", () => {
            const { result } = renderHook(() => useAutoResize({ resetOnEmpty: true }));

            act(() => {
                result.current.setValue("Hello");
                result.current.setValue("");
            });

            expect(result.current.value).toBe("");
        });
    });

    describe("window resize handling", () => {
        it("should add resize event listener", () => {
            const addEventListenerSpy = vi.spyOn(window, "addEventListener");
            renderHook(() => useAutoResize());

            expect(addEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function));
            addEventListenerSpy.mockRestore();
        });

        it("should remove resize event listener on unmount", () => {
            const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
            const { unmount } = renderHook(() => useAutoResize());

            unmount();

            expect(removeEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function));
            removeEventListenerSpy.mockRestore();
        });
    });
});

describe("calculateTextareaHeight", () => {
    it("should estimate height from line count", () => {
        const height = calculateTextareaHeight("Line 1\nLine 2\nLine 3", {
            lineHeight: 20,
            padding: 16,
        });

        // 3 lines * 20px + 16px padding = 76px
        expect(height).toBe(76);
    });

    it("should respect maxHeight", () => {
        const height = calculateTextareaHeight("Line 1\nLine 2\nLine 3\nLine 4\nLine 5", {
            lineHeight: 20,
            padding: 16,
            maxHeight: 80,
        });

        expect(height).toBe(80);
    });

    it("should use default values", () => {
        const height = calculateTextareaHeight("Test");

        // 1 line * 20px + 16px = 36px
        expect(height).toBe(36);
    });

    it("should handle empty text", () => {
        const height = calculateTextareaHeight("");

        // 1 line (empty counts as 1) * 20px + 16px = 36px
        expect(height).toBe(36);
    });
});

describe("createMeasureElement", () => {
    it("should create a textarea element", () => {
        const sourceTextarea = document.createElement("textarea");
        document.body.appendChild(sourceTextarea);

        const measureElement = createMeasureElement(sourceTextarea);

        expect(measureElement.tagName).toBe("TEXTAREA");

        document.body.removeChild(sourceTextarea);
    });

    it("should set visibility to hidden", () => {
        const sourceTextarea = document.createElement("textarea");
        document.body.appendChild(sourceTextarea);

        const measureElement = createMeasureElement(sourceTextarea);

        expect(measureElement.style.visibility).toBe("hidden");
        expect(measureElement.style.position).toBe("absolute");

        document.body.removeChild(sourceTextarea);
    });

    it("should set height to auto", () => {
        const sourceTextarea = document.createElement("textarea");
        document.body.appendChild(sourceTextarea);

        const measureElement = createMeasureElement(sourceTextarea);

        expect(measureElement.style.height).toBe("auto");

        document.body.removeChild(sourceTextarea);
    });

    it("should set overflow to hidden", () => {
        const sourceTextarea = document.createElement("textarea");
        document.body.appendChild(sourceTextarea);

        const measureElement = createMeasureElement(sourceTextarea);

        expect(measureElement.style.overflow).toBe("hidden");

        document.body.removeChild(sourceTextarea);
    });
});
