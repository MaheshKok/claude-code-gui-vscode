import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
    useMessages,
    createMessageHandlers,
    createStreamingHandler,
    createBatchedHandler,
} from "../../webview/hooks/useMessages";

describe("useMessages", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("message listening", () => {
        it("should add message listener when enabled", () => {
            const addEventListenerSpy = vi.spyOn(window, "addEventListener");

            renderHook(() => useMessages({ enabled: true }));

            expect(addEventListenerSpy).toHaveBeenCalledWith("message", expect.any(Function));
            addEventListenerSpy.mockRestore();
        });

        it("should not add listener when disabled", () => {
            const addEventListenerSpy = vi.spyOn(window, "addEventListener");

            renderHook(() => useMessages({ enabled: false }));

            expect(addEventListenerSpy).not.toHaveBeenCalled();
            addEventListenerSpy.mockRestore();
        });

        it("should remove listener on unmount", () => {
            const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

            const { unmount } = renderHook(() => useMessages({ enabled: true }));
            unmount();

            expect(removeEventListenerSpy).toHaveBeenCalledWith("message", expect.any(Function));
            removeEventListenerSpy.mockRestore();
        });
    });

    describe("message handling", () => {
        it("should call handler for matching message type", () => {
            const outputHandler = vi.fn();
            const { result } = renderHook(() =>
                useMessages({
                    handlers: {
                        output: outputHandler,
                    },
                }),
            );

            // Simulate message event
            const messageEvent = new MessageEvent("message", {
                data: { type: "output", text: "Hello", isFinal: false },
            });
            window.dispatchEvent(messageEvent);

            expect(outputHandler).toHaveBeenCalledWith({
                type: "output",
                text: "Hello",
                isFinal: false,
            });
        });

        it("should call onMessage callback for all messages", () => {
            const onMessage = vi.fn();
            renderHook(() => useMessages({ onMessage }));

            const messageEvent = new MessageEvent("message", {
                data: { type: "error", message: "Something failed" },
            });
            window.dispatchEvent(messageEvent);

            expect(onMessage).toHaveBeenCalledWith({
                type: "error",
                message: "Something failed",
            });
        });

        it("should call onUnhandledMessage for messages without handlers", () => {
            const onUnhandledMessage = vi.fn();
            renderHook(() =>
                useMessages({
                    handlers: {},
                    onUnhandledMessage,
                }),
            );

            const messageEvent = new MessageEvent("message", {
                data: { type: "unknownType", data: "test" },
            });
            window.dispatchEvent(messageEvent);

            expect(onUnhandledMessage).toHaveBeenCalled();
        });

        it("should ignore invalid message structures", () => {
            const onMessage = vi.fn();
            renderHook(() => useMessages({ onMessage }));

            // Message without type
            const invalidEvent = new MessageEvent("message", {
                data: { foo: "bar" },
            });
            window.dispatchEvent(invalidEvent);

            expect(onMessage).not.toHaveBeenCalled();
        });

        it("should ignore null messages", () => {
            const onMessage = vi.fn();
            renderHook(() => useMessages({ onMessage }));

            const nullEvent = new MessageEvent("message", {
                data: null,
            });
            window.dispatchEvent(nullEvent);

            expect(onMessage).not.toHaveBeenCalled();
        });
    });

    describe("dynamic handlers", () => {
        it("should add dynamic handler", () => {
            const { result } = renderHook(() => useMessages());
            const dynamicHandler = vi.fn();

            act(() => {
                result.current.addHandler("toolUse", dynamicHandler);
            });

            const messageEvent = new MessageEvent("message", {
                data: { type: "toolUse", toolName: "Read", toolUseId: "123" },
            });
            window.dispatchEvent(messageEvent);

            expect(dynamicHandler).toHaveBeenCalled();
        });

        it("should remove handler with cleanup function", () => {
            const { result } = renderHook(() => useMessages());
            const dynamicHandler = vi.fn();
            let cleanup: () => void;

            act(() => {
                cleanup = result.current.addHandler("error", dynamicHandler);
            });

            // Remove the handler
            act(() => {
                cleanup();
            });

            const messageEvent = new MessageEvent("message", {
                data: { type: "error", message: "test" },
            });
            window.dispatchEvent(messageEvent);

            expect(dynamicHandler).not.toHaveBeenCalled();
        });

        it("should remove handler with removeHandler", () => {
            const { result } = renderHook(() => useMessages());
            const dynamicHandler = vi.fn();

            act(() => {
                result.current.addHandler("output", dynamicHandler);
                result.current.removeHandler("output");
            });

            const messageEvent = new MessageEvent("message", {
                data: { type: "output", text: "test" },
            });
            window.dispatchEvent(messageEvent);

            expect(dynamicHandler).not.toHaveBeenCalled();
        });

        it("should clear all handlers", () => {
            const { result } = renderHook(() => useMessages());
            const handler1 = vi.fn();
            const handler2 = vi.fn();

            act(() => {
                result.current.addHandler("output", handler1);
                result.current.addHandler("error", handler2);
                result.current.clearHandlers();
            });

            window.dispatchEvent(new MessageEvent("message", { data: { type: "output" } }));
            window.dispatchEvent(new MessageEvent("message", { data: { type: "error" } }));

            expect(handler1).not.toHaveBeenCalled();
            expect(handler2).not.toHaveBeenCalled();
        });
    });

    describe("createMessageHandlers", () => {
        it("should return the handlers as-is", () => {
            const handlers = {
                output: vi.fn(),
                error: vi.fn(),
            };
            expect(createMessageHandlers(handlers)).toBe(handlers);
        });
    });

    describe("createStreamingHandler", () => {
        it("should accumulate text across chunks", () => {
            const onChunk = vi.fn();
            const { handler, getText } = createStreamingHandler(onChunk);

            handler({ type: "output", text: "Hello ", isFinal: false });
            handler({ type: "output", text: "World", isFinal: false });

            expect(getText()).toBe("Hello World");
            expect(onChunk).toHaveBeenCalledTimes(2);
            expect(onChunk).toHaveBeenLastCalledWith("World", "Hello World");
        });

        it("should call onComplete when isFinal is true", () => {
            const onChunk = vi.fn();
            const onComplete = vi.fn();
            const { handler } = createStreamingHandler(onChunk, onComplete);

            handler({ type: "output", text: "Done", isFinal: true });

            expect(onComplete).toHaveBeenCalledWith("Done");
        });

        it("should reset accumulated text", () => {
            const onChunk = vi.fn();
            const { handler, reset, getText } = createStreamingHandler(onChunk);

            handler({ type: "output", text: "Hello", isFinal: false });
            reset();

            expect(getText()).toBe("");
        });
    });

    describe("createBatchedHandler", () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it("should batch messages and flush after delay", () => {
            const handler = vi.fn();
            const batchedHandler = createBatchedHandler<string>(handler, { delay: 16 });

            batchedHandler("a");
            batchedHandler("b");
            batchedHandler("c");

            expect(handler).not.toHaveBeenCalled();

            vi.advanceTimersByTime(16);

            expect(handler).toHaveBeenCalledWith(["a", "b", "c"]);
        });

        it("should flush immediately when batch size is reached", () => {
            const handler = vi.fn();
            const batchedHandler = createBatchedHandler<string>(handler, { maxBatchSize: 2 });

            batchedHandler("a");
            batchedHandler("b"); // Should trigger flush

            expect(handler).toHaveBeenCalledWith(["a", "b"]);
        });

        it("should handle empty batches", () => {
            const handler = vi.fn();
            createBatchedHandler<string>(handler);

            vi.advanceTimersByTime(100);

            expect(handler).not.toHaveBeenCalled();
        });
    });
});
