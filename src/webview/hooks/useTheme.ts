/**
 * Theme Detection Hook
 *
 * Provides VSCode theme detection and theme-aware styling
 * for the chat interface.
 *
 * @module hooks/useTheme
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { useMessages } from "./useMessages";

// ============================================================================
// Types
// ============================================================================

/**
 * Theme mode
 */
export type ThemeMode = "light" | "dark";

/**
 * Extended theme kind (matches VSCode)
 */
export type ThemeKind = "light" | "dark" | "high-contrast" | "high-contrast-light";

/**
 * Theme color variables from VSCode
 */
export interface ThemeColors {
    /** Background color */
    background: string;
    /** Foreground/text color */
    foreground: string;
    /** Primary accent color */
    accent: string;
    /** Border color */
    border: string;
    /** Input background */
    inputBackground: string;
    /** Input foreground */
    inputForeground: string;
    /** Input border */
    inputBorder: string;
    /** Button background */
    buttonBackground: string;
    /** Button foreground */
    buttonForeground: string;
    /** Button hover background */
    buttonHoverBackground: string;
    /** Error color */
    error: string;
    /** Warning color */
    warning: string;
    /** Success color */
    success: string;
    /** Info color */
    info: string;
    /** Link color */
    link: string;
    /** Code background */
    codeBackground: string;
    /** Selection background */
    selectionBackground: string;
}

/**
 * Options for useTheme hook
 */
export interface UseThemeOptions {
    /** Default theme if detection fails */
    defaultTheme?: ThemeMode;
    /** Callback when theme changes */
    onThemeChange?: (theme: ThemeMode) => void;
    /** Whether to listen for theme changes */
    listenForChanges?: boolean;
}

/**
 * Return type for useTheme hook
 */
export interface UseThemeReturn {
    /** Current theme mode (light/dark) */
    theme: ThemeMode;
    /** Extended theme kind */
    themeKind: ThemeKind;
    /** Whether the current theme is dark */
    isDark: boolean;
    /** Whether the current theme is high contrast */
    isHighContrast: boolean;
    /** Theme colors extracted from CSS variables */
    colors: ThemeColors;
    /** Get a CSS variable value */
    getCssVariable: (name: string, fallback?: string) => string;
    /** Generate theme-aware class name */
    themeClass: (lightClass: string, darkClass: string) => string;
    /** Toggle between light and dark (for testing) */
    toggleTheme: () => void;
}

// ============================================================================
// CSS Variable Names
// ============================================================================

const CSS_VARIABLES = {
    background: "--vscode-editor-background",
    foreground: "--vscode-editor-foreground",
    accent: "--vscode-focusBorder",
    border: "--vscode-widget-border",
    inputBackground: "--vscode-input-background",
    inputForeground: "--vscode-input-foreground",
    inputBorder: "--vscode-input-border",
    buttonBackground: "--vscode-button-background",
    buttonForeground: "--vscode-button-foreground",
    buttonHoverBackground: "--vscode-button-hoverBackground",
    error: "--vscode-errorForeground",
    warning: "--vscode-editorWarning-foreground",
    success: "--vscode-terminal-ansiGreen",
    info: "--vscode-terminal-ansiBlue",
    link: "--vscode-textLink-foreground",
    codeBackground: "--vscode-textCodeBlock-background",
    selectionBackground: "--vscode-editor-selectionBackground",
} as const;

// ============================================================================
// Theme Detection Utilities
// ============================================================================

/**
 * Detect theme from document body class
 */
function detectThemeFromBody(): ThemeMode {
    if (typeof document === "undefined") {
        return "dark";
    }

    const body = document.body;

    // Check for VSCode theme classes
    if (body.classList.contains("vscode-light")) {
        return "light";
    }
    if (body.classList.contains("vscode-dark")) {
        return "dark";
    }
    if (body.classList.contains("vscode-high-contrast")) {
        return "dark"; // High contrast is typically dark-based
    }
    if (body.classList.contains("vscode-high-contrast-light")) {
        return "light";
    }

    // Fallback: check background color luminance
    const bgColor = getComputedStyle(body).backgroundColor;
    if (bgColor) {
        return isColorDark(bgColor) ? "dark" : "light";
    }

    return "dark";
}

/**
 * Detect extended theme kind from body class
 */
function detectThemeKind(): ThemeKind {
    if (typeof document === "undefined") {
        return "dark";
    }

    const body = document.body;

    if (body.classList.contains("vscode-high-contrast")) {
        return "high-contrast";
    }
    if (body.classList.contains("vscode-high-contrast-light")) {
        return "high-contrast-light";
    }
    if (body.classList.contains("vscode-light")) {
        return "light";
    }

    return "dark";
}

/**
 * Check if a color is dark based on luminance
 */
function isColorDark(color: string): boolean {
    // Parse RGB values from color string
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) {
        return true;
    }

    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);

    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance < 0.5;
}

/**
 * Get CSS variable value from document
 */
function getCssVariableValue(name: string, fallback: string = ""): string {
    if (typeof document === "undefined") {
        return fallback;
    }

    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for VSCode theme detection and theme-aware styling
 *
 * @example
 * ```tsx
 * function ThemedComponent() {
 *   const { theme, isDark, colors, themeClass } = useTheme({
 *     defaultTheme: 'dark',
 *     onThemeChange: (newTheme) => console.log('Theme changed:', newTheme),
 *   });
 *
 *   return (
 *     <div
 *       className={themeClass('light-mode', 'dark-mode')}
 *       style={{ backgroundColor: colors.background }}
 *     >
 *       <h1 style={{ color: colors.foreground }}>
 *         Current theme: {theme}
 *       </h1>
 *       {isDark ? (
 *         <DarkModeIcon />
 *       ) : (
 *         <LightModeIcon />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useTheme(options: UseThemeOptions = {}): UseThemeReturn {
    const { defaultTheme = "dark", onThemeChange, listenForChanges = true } = options;

    const [theme, setTheme] = useState<ThemeMode>(() => {
        if (typeof document !== "undefined") {
            return detectThemeFromBody();
        }
        return defaultTheme;
    });

    const [themeKind, setThemeKind] = useState<ThemeKind>(() => {
        if (typeof document !== "undefined") {
            return detectThemeKind();
        }
        return defaultTheme;
    });

    /**
     * Handle theme updates from extension
     */
    useMessages({
        enabled: listenForChanges,
        handlers: {
            themeUpdate: (message) => {
                const newTheme = message.theme;
                setTheme(newTheme);
                setThemeKind(newTheme);
                onThemeChange?.(newTheme);
            },
        },
    });

    /**
     * Observe body class changes for theme detection
     */
    useEffect(() => {
        if (!listenForChanges || typeof document === "undefined") {
            return;
        }

        const observer = new MutationObserver(() => {
            const newTheme = detectThemeFromBody();
            const newKind = detectThemeKind();

            if (newTheme !== theme) {
                setTheme(newTheme);
                onThemeChange?.(newTheme);
            }
            if (newKind !== themeKind) {
                setThemeKind(newKind);
            }
        });

        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ["class"],
        });

        return () => {
            observer.disconnect();
        };
    }, [listenForChanges, theme, themeKind, onThemeChange]);

    /**
     * Whether current theme is dark
     */
    const isDark = theme === "dark";

    /**
     * Whether current theme is high contrast
     */
    const isHighContrast = themeKind === "high-contrast" || themeKind === "high-contrast-light";

    /**
     * Get a CSS variable value
     */
    const getCssVariable = useCallback((name: string, fallback: string = ""): string => {
        return getCssVariableValue(name, fallback);
    }, []);

    /**
     * Theme colors extracted from CSS variables
     */
    const colors = useMemo((): ThemeColors => {
        // Default colors based on theme
        const defaults: Record<ThemeMode, ThemeColors> = {
            light: {
                background: "#ffffff",
                foreground: "#333333",
                accent: "#0066cc",
                border: "#e1e1e1",
                inputBackground: "#ffffff",
                inputForeground: "#333333",
                inputBorder: "#cecece",
                buttonBackground: "#0066cc",
                buttonForeground: "#ffffff",
                buttonHoverBackground: "#0055aa",
                error: "#d32f2f",
                warning: "#f57c00",
                success: "#388e3c",
                info: "#1976d2",
                link: "#0066cc",
                codeBackground: "#f5f5f5",
                selectionBackground: "#add6ff",
            },
            dark: {
                background: "#1e1e1e",
                foreground: "#cccccc",
                accent: "#007acc",
                border: "#454545",
                inputBackground: "#3c3c3c",
                inputForeground: "#cccccc",
                inputBorder: "#3c3c3c",
                buttonBackground: "#0e639c",
                buttonForeground: "#ffffff",
                buttonHoverBackground: "#1177bb",
                error: "#f48771",
                warning: "#cca700",
                success: "#89d185",
                info: "#75beff",
                link: "#3794ff",
                codeBackground: "#2d2d2d",
                selectionBackground: "#264f78",
            },
        };

        const currentDefaults = defaults[theme];

        return {
            background: getCssVariableValue(CSS_VARIABLES.background, currentDefaults.background),
            foreground: getCssVariableValue(CSS_VARIABLES.foreground, currentDefaults.foreground),
            accent: getCssVariableValue(CSS_VARIABLES.accent, currentDefaults.accent),
            border: getCssVariableValue(CSS_VARIABLES.border, currentDefaults.border),
            inputBackground: getCssVariableValue(
                CSS_VARIABLES.inputBackground,
                currentDefaults.inputBackground,
            ),
            inputForeground: getCssVariableValue(
                CSS_VARIABLES.inputForeground,
                currentDefaults.inputForeground,
            ),
            inputBorder: getCssVariableValue(
                CSS_VARIABLES.inputBorder,
                currentDefaults.inputBorder,
            ),
            buttonBackground: getCssVariableValue(
                CSS_VARIABLES.buttonBackground,
                currentDefaults.buttonBackground,
            ),
            buttonForeground: getCssVariableValue(
                CSS_VARIABLES.buttonForeground,
                currentDefaults.buttonForeground,
            ),
            buttonHoverBackground: getCssVariableValue(
                CSS_VARIABLES.buttonHoverBackground,
                currentDefaults.buttonHoverBackground,
            ),
            error: getCssVariableValue(CSS_VARIABLES.error, currentDefaults.error),
            warning: getCssVariableValue(CSS_VARIABLES.warning, currentDefaults.warning),
            success: getCssVariableValue(CSS_VARIABLES.success, currentDefaults.success),
            info: getCssVariableValue(CSS_VARIABLES.info, currentDefaults.info),
            link: getCssVariableValue(CSS_VARIABLES.link, currentDefaults.link),
            codeBackground: getCssVariableValue(
                CSS_VARIABLES.codeBackground,
                currentDefaults.codeBackground,
            ),
            selectionBackground: getCssVariableValue(
                CSS_VARIABLES.selectionBackground,
                currentDefaults.selectionBackground,
            ),
        };
    }, [theme]);

    /**
     * Generate theme-aware class name
     */
    const themeClass = useCallback(
        (lightClass: string, darkClass: string): string => {
            return isDark ? darkClass : lightClass;
        },
        [isDark],
    );

    /**
     * Toggle theme (for testing/development)
     */
    const toggleTheme = useCallback((): void => {
        const newTheme: ThemeMode = theme === "dark" ? "light" : "dark";
        setTheme(newTheme);
        setThemeKind(newTheme);
        onThemeChange?.(newTheme);
    }, [theme, onThemeChange]);

    return {
        theme,
        themeKind,
        isDark,
        isHighContrast,
        colors,
        getCssVariable,
        themeClass,
        toggleTheme,
    };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get all VSCode CSS variables as an object
 */
export function getAllVSCodeCssVariables(): Record<string, string> {
    if (typeof document === "undefined") {
        return {};
    }

    const styles = getComputedStyle(document.documentElement);
    const variables: Record<string, string> = {};

    // Get all custom properties that start with --vscode-
    for (let i = 0; i < styles.length; i++) {
        const name = styles[i];
        if (name.startsWith("--vscode-")) {
            variables[name] = styles.getPropertyValue(name).trim();
        }
    }

    return variables;
}

/**
 * Create CSS custom properties string from colors
 */
export function createCssVariables(colors: Partial<ThemeColors>): string {
    const lines: string[] = [];

    for (const [key, value] of Object.entries(colors)) {
        if (value) {
            lines.push(`--chat-${key}: ${value};`);
        }
    }

    return lines.join("\n");
}
