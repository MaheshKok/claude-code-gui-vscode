import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

describe("useVSCode", () => {
    const mockPostMessage = vi.fn();
    const mockGetState = vi.fn();
    const mockSetState = vi.fn();

    const mockVSCodeApi = {
        postMessage: mockPostMessage,
        getState: mockGetState,
        setState: mockSetState,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset module cache to clear the cached vscodeApi
        vi.resetModules();
        // Reset window properties
        delete (window as any).vscode;
        delete (window as any).acquireVsCodeApi;
    });

    afterEach(() => {
        vi.resetModules();
    });

    describe("with VSCode API available via window.vscode", () => {
        it("should detect VSCode environment", async () => {
            (window as any).vscode = mockVSCodeApi;
            const { useVSCode } = await import("../../webview/hooks/useVSCode");
            const { result } = renderHook(() => useVSCode());
            expect(result.current.isVSCode).toBe(true);
            expect(result.current.api).toBe(mockVSCodeApi);
        });

        it("should post message to extension", async () => {
            (window as any).vscode = mockVSCodeApi;
            const { useVSCode } = await import("../../webview/hooks/useVSCode");
            const { result } = renderHook(() => useVSCode());

            act(() => {
                result.current.postMessage({ type: "sendMessage", message: "Hello" });
            });

            expect(mockPostMessage).toHaveBeenCalledWith({ type: "sendMessage", message: "Hello" });
        });

        it("should get state from API", async () => {
            (window as any).vscode = mockVSCodeApi;
            mockGetState.mockReturnValue({ count: 5 });
            const { useVSCode } = await import("../../webview/hooks/useVSCode");
            const { result } = renderHook(() => useVSCode());

            const state = result.current.getState<{ count: number }>();
            expect(state).toEqual({ count: 5 });
        });

        it("should set state via API", async () => {
            (window as any).vscode = mockVSCodeApi;
            const { useVSCode } = await import("../../webview/hooks/useVSCode");
            const { result } = renderHook(() => useVSCode());

            act(() => {
                result.current.setState({ count: 10 });
            });

            expect(mockSetState).toHaveBeenCalledWith({ count: 10 });
        });

        it("should update state by merging", async () => {
            (window as any).vscode = mockVSCodeApi;
            mockGetState.mockReturnValue({ a: 1, b: 2 });
            const { useVSCode } = await import("../../webview/hooks/useVSCode");
            const { result } = renderHook(() => useVSCode());

            act(() => {
                result.current.updateState({ b: 3, c: 4 });
            });

            expect(mockSetState).toHaveBeenCalledWith({ a: 1, b: 3, c: 4 });
        });
    });

    describe("with VSCode API available via acquireVsCodeApi", () => {
        it("should acquire and use the API", async () => {
            (window as any).acquireVsCodeApi = vi.fn(() => mockVSCodeApi);
            const { useVSCode } = await import("../../webview/hooks/useVSCode");
            const { result } = renderHook(() => useVSCode());
            expect(result.current.isVSCode).toBe(true);
        });
    });

    describe("without VSCode API", () => {
        let originalLocalStorage: Storage;

        beforeEach(() => {
            originalLocalStorage = window.localStorage;
        });

        afterEach(() => {
            Object.defineProperty(window, "localStorage", {
                value: originalLocalStorage,
                writable: true,
            });
        });

        it("should detect non-VSCode environment", async () => {
            const { useVSCode } = await import("../../webview/hooks/useVSCode");
            const { result } = renderHook(() => useVSCode());
            expect(result.current.isVSCode).toBe(false);
            expect(result.current.api).toBe(null);
        });

        it("should not throw when posting message outside VSCode", async () => {
            const { useVSCode } = await import("../../webview/hooks/useVSCode");
            const { result } = renderHook(() => useVSCode());

            expect(() => {
                act(() => {
                    result.current.postMessage({ type: "sendMessage", message: "test" });
                });
            }).not.toThrow();
        });

        it("should fallback to localStorage for getState", async () => {
            const localStorageMock = {
                getItem: vi.fn().mockReturnValue('{"test": "value"}'),
                setItem: vi.fn(),
                removeItem: vi.fn(),
                clear: vi.fn(),
                length: 0,
                key: vi.fn(),
            };
            Object.defineProperty(window, "localStorage", {
                value: localStorageMock,
                writable: true,
            });

            const { useVSCode } = await import("../../webview/hooks/useVSCode");
            const { result } = renderHook(() => useVSCode());
            const state = result.current.getState<{ test: string }>();

            expect(state).toEqual({ test: "value" });
            expect(localStorageMock.getItem).toHaveBeenCalledWith("vscode-webview-state");
        });

        it("should fallback to localStorage for setState", async () => {
            const localStorageMock = {
                getItem: vi.fn(),
                setItem: vi.fn(),
                removeItem: vi.fn(),
                clear: vi.fn(),
                length: 0,
                key: vi.fn(),
            };
            Object.defineProperty(window, "localStorage", {
                value: localStorageMock,
                writable: true,
            });

            const { useVSCode } = await import("../../webview/hooks/useVSCode");
            const { result } = renderHook(() => useVSCode());

            act(() => {
                result.current.setState({ foo: "bar" });
            });

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                "vscode-webview-state",
                '{"foo":"bar"}',
            );
        });

        it("should return undefined when localStorage parsing fails", async () => {
            const localStorageMock = {
                getItem: vi.fn().mockReturnValue("invalid json"),
                setItem: vi.fn(),
                removeItem: vi.fn(),
                clear: vi.fn(),
                length: 0,
                key: vi.fn(),
            };
            Object.defineProperty(window, "localStorage", {
                value: localStorageMock,
                writable: true,
            });

            const { useVSCode } = await import("../../webview/hooks/useVSCode");
            const { result } = renderHook(() => useVSCode());
            const state = result.current.getState();

            expect(state).toBeUndefined();
        });
    });

    describe("utility functions", () => {
        it("isInVSCode should return true when API is available", async () => {
            (window as any).vscode = mockVSCodeApi;
            const { isInVSCode } = await import("../../webview/hooks/useVSCode");
            expect(isInVSCode()).toBe(true);
        });

        it("isInVSCode should return false when API is not available", async () => {
            const { isInVSCode } = await import("../../webview/hooks/useVSCode");
            expect(isInVSCode()).toBe(false);
        });

        it("getVSCode should return API when available", async () => {
            (window as any).vscode = mockVSCodeApi;
            const { getVSCode } = await import("../../webview/hooks/useVSCode");
            expect(getVSCode()).toBe(mockVSCodeApi);
        });

        it("getVSCode should return null when not available", async () => {
            const { getVSCode } = await import("../../webview/hooks/useVSCode");
            expect(getVSCode()).toBe(null);
        });

        it("postMessageToExtension should post message when API available", async () => {
            (window as any).vscode = mockVSCodeApi;
            const { postMessageToExtension } = await import("../../webview/hooks/useVSCode");
            postMessageToExtension({ type: "clearConversation" });
            expect(mockPostMessage).toHaveBeenCalledWith({ type: "clearConversation" });
        });

        it("postMessageToExtension should not throw when API not available", async () => {
            const { postMessageToExtension } = await import("../../webview/hooks/useVSCode");
            expect(() => {
                postMessageToExtension({ type: "clearConversation" });
            }).not.toThrow();
        });
    });
});
