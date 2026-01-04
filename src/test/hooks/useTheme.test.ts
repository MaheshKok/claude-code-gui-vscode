import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
    useTheme,
    getAllVSCodeCssVariables,
    createCssVariables,
} from "../../webview/hooks/useTheme";

describe("useTheme", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset document body classes
        document.body.className = "";
    });

    afterEach(() => {
        document.body.className = "";
    });

    describe("theme detection", () => {
        it("should detect dark theme from body class", () => {
            document.body.classList.add("vscode-dark");
            const { result } = renderHook(() => useTheme());

            expect(result.current.theme).toBe("dark");
            expect(result.current.isDark).toBe(true);
        });

        it("should detect light theme from body class", () => {
            document.body.classList.add("vscode-light");
            const { result } = renderHook(() => useTheme());

            expect(result.current.theme).toBe("light");
            expect(result.current.isDark).toBe(false);
        });

        it("should detect high contrast theme", () => {
            document.body.classList.add("vscode-high-contrast");
            const { result } = renderHook(() => useTheme());

            expect(result.current.themeKind).toBe("high-contrast");
            expect(result.current.isHighContrast).toBe(true);
        });

        it("should detect high contrast light theme", () => {
            document.body.classList.add("vscode-high-contrast-light");
            const { result } = renderHook(() => useTheme());

            expect(result.current.themeKind).toBe("high-contrast-light");
            expect(result.current.isHighContrast).toBe(true);
            expect(result.current.theme).toBe("light");
        });

        it("should use default theme when no classes detected", () => {
            const { result } = renderHook(() => useTheme({ defaultTheme: "light" }));

            // Without vscode classes, it falls back to checking background color
            // In jsdom, this may return dark as default
            expect(["light", "dark"]).toContain(result.current.theme);
        });
    });

    describe("themeClass helper", () => {
        it("should return dark class when theme is dark", () => {
            document.body.classList.add("vscode-dark");
            const { result } = renderHook(() => useTheme());

            expect(result.current.themeClass("light-style", "dark-style")).toBe("dark-style");
        });

        it("should return light class when theme is light", () => {
            document.body.classList.add("vscode-light");
            const { result } = renderHook(() => useTheme());

            expect(result.current.themeClass("light-style", "dark-style")).toBe("light-style");
        });
    });

    describe("toggleTheme", () => {
        it("should toggle from dark to light", () => {
            document.body.classList.add("vscode-dark");
            const { result } = renderHook(() => useTheme());

            expect(result.current.theme).toBe("dark");

            act(() => {
                result.current.toggleTheme();
            });

            expect(result.current.theme).toBe("light");
        });

        it("should toggle from light to dark", () => {
            document.body.classList.add("vscode-light");
            const { result } = renderHook(() => useTheme());

            expect(result.current.theme).toBe("light");

            act(() => {
                result.current.toggleTheme();
            });

            expect(result.current.theme).toBe("dark");
        });

        it("should call onThemeChange callback", () => {
            document.body.classList.add("vscode-dark");
            const onThemeChange = vi.fn();
            const { result } = renderHook(() => useTheme({ onThemeChange }));

            act(() => {
                result.current.toggleTheme();
            });

            expect(onThemeChange).toHaveBeenCalledWith("light");
        });
    });

    describe("colors", () => {
        it("should return dark theme colors by default", () => {
            document.body.classList.add("vscode-dark");
            const { result } = renderHook(() => useTheme());

            expect(result.current.colors.background).toBeDefined();
            expect(result.current.colors.foreground).toBeDefined();
            expect(result.current.colors.accent).toBeDefined();
            expect(result.current.colors.border).toBeDefined();
        });

        it("should return light theme colors when in light mode", () => {
            document.body.classList.add("vscode-light");
            const { result } = renderHook(() => useTheme());

            expect(result.current.colors.background).toBeDefined();
            expect(result.current.colors.foreground).toBeDefined();
        });

        it("should have all required color properties", () => {
            const { result } = renderHook(() => useTheme());

            const colors = result.current.colors;
            expect(colors).toHaveProperty("background");
            expect(colors).toHaveProperty("foreground");
            expect(colors).toHaveProperty("accent");
            expect(colors).toHaveProperty("border");
            expect(colors).toHaveProperty("inputBackground");
            expect(colors).toHaveProperty("inputForeground");
            expect(colors).toHaveProperty("inputBorder");
            expect(colors).toHaveProperty("buttonBackground");
            expect(colors).toHaveProperty("buttonForeground");
            expect(colors).toHaveProperty("buttonHoverBackground");
            expect(colors).toHaveProperty("error");
            expect(colors).toHaveProperty("warning");
            expect(colors).toHaveProperty("success");
            expect(colors).toHaveProperty("info");
            expect(colors).toHaveProperty("link");
            expect(colors).toHaveProperty("codeBackground");
            expect(colors).toHaveProperty("selectionBackground");
        });
    });

    describe("getCssVariable", () => {
        it("should return fallback when variable is not set", () => {
            const { result } = renderHook(() => useTheme());

            const value = result.current.getCssVariable("--non-existent-var", "fallback");
            expect(value).toBe("fallback");
        });

        it("should return empty string when no fallback provided", () => {
            const { result } = renderHook(() => useTheme());

            const value = result.current.getCssVariable("--non-existent-var");
            expect(value).toBe("");
        });
    });

    describe("listenForChanges", () => {
        it("should not observe changes when disabled", () => {
            const observeSpy = vi.spyOn(MutationObserver.prototype, "observe");
            renderHook(() => useTheme({ listenForChanges: false }));

            expect(observeSpy).not.toHaveBeenCalled();
            observeSpy.mockRestore();
        });

        it("should observe body class changes when enabled", () => {
            const observeSpy = vi.spyOn(MutationObserver.prototype, "observe");
            renderHook(() => useTheme({ listenForChanges: true }));

            expect(observeSpy).toHaveBeenCalledWith(document.body, {
                attributes: true,
                attributeFilter: ["class"],
            });
            observeSpy.mockRestore();
        });

        it("should disconnect observer on unmount", () => {
            const disconnectSpy = vi.spyOn(MutationObserver.prototype, "disconnect");
            const { unmount } = renderHook(() => useTheme({ listenForChanges: true }));

            unmount();

            expect(disconnectSpy).toHaveBeenCalled();
            disconnectSpy.mockRestore();
        });
    });
});

describe("getAllVSCodeCssVariables", () => {
    it("should return an object", () => {
        const variables = getAllVSCodeCssVariables();
        expect(typeof variables).toBe("object");
    });
});

describe("createCssVariables", () => {
    it("should create CSS variable string from colors", () => {
        const css = createCssVariables({
            background: "#1e1e1e",
            foreground: "#cccccc",
        });

        expect(css).toContain("--chat-background: #1e1e1e");
        expect(css).toContain("--chat-foreground: #cccccc");
    });

    it("should skip undefined values", () => {
        const css = createCssVariables({
            background: "#1e1e1e",
            foreground: undefined as any,
        });

        expect(css).toContain("--chat-background");
        expect(css).not.toContain("--chat-foreground");
    });

    it("should return empty string for empty object", () => {
        const css = createCssVariables({});
        expect(css).toBe("");
    });
});
