/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/webview/**/*.{ts,tsx,html}", "./src/webview/**/*.css"],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                // VSCode theme variables mapped to Tailwind
                vscode: {
                    // Editor colors
                    "editor-bg": "var(--vscode-editor-background)",
                    "editor-fg": "var(--vscode-editor-foreground)",
                    "editor-selection": "var(--vscode-editor-selectionBackground)",
                    "editor-line": "var(--vscode-editor-lineHighlightBackground)",

                    // Sidebar colors
                    "sidebar-bg": "var(--vscode-sideBar-background)",
                    "sidebar-fg": "var(--vscode-sideBar-foreground)",
                    "sidebar-border": "var(--vscode-sideBar-border)",

                    // Input colors
                    "input-bg": "var(--vscode-input-background)",
                    "input-fg": "var(--vscode-input-foreground)",
                    "input-border": "var(--vscode-input-border)",
                    "input-placeholder": "var(--vscode-input-placeholderForeground)",

                    // Button colors
                    "button-bg": "var(--vscode-button-background)",
                    "button-fg": "var(--vscode-button-foreground)",
                    "button-hover": "var(--vscode-button-hoverBackground)",
                    "button-secondary-bg": "var(--vscode-button-secondaryBackground)",
                    "button-secondary-fg": "var(--vscode-button-secondaryForeground)",
                    "button-secondary-hover": "var(--vscode-button-secondaryHoverBackground)",

                    // List colors
                    "list-hover": "var(--vscode-list-hoverBackground)",
                    "list-active": "var(--vscode-list-activeSelectionBackground)",
                    "list-active-fg": "var(--vscode-list-activeSelectionForeground)",
                    "list-inactive": "var(--vscode-list-inactiveSelectionBackground)",

                    // Badge colors
                    "badge-bg": "var(--vscode-badge-background)",
                    "badge-fg": "var(--vscode-badge-foreground)",

                    // Focus colors
                    "focus-border": "var(--vscode-focusBorder)",

                    // Panel colors
                    "panel-bg": "var(--vscode-panel-background)",
                    "panel-border": "var(--vscode-panel-border)",

                    // Widget colors
                    "widget-bg": "var(--vscode-editorWidget-background)",
                    "widget-border": "var(--vscode-editorWidget-border)",

                    // Scrollbar colors
                    scrollbar: "var(--vscode-scrollbarSlider-background)",
                    "scrollbar-hover": "var(--vscode-scrollbarSlider-hoverBackground)",
                    "scrollbar-active": "var(--vscode-scrollbarSlider-activeBackground)",

                    // Link colors
                    link: "var(--vscode-textLink-foreground)",
                    "link-active": "var(--vscode-textLink-activeForeground)",

                    // Text colors
                    "text-muted": "var(--vscode-descriptionForeground)",
                    "text-error": "var(--vscode-errorForeground)",
                    "text-warning": "var(--vscode-editorWarning-foreground)",
                    "text-info": "var(--vscode-editorInfo-foreground)",

                    // Diff colors
                    "diff-added": "var(--vscode-diffEditor-insertedLineBackground)",
                    "diff-removed": "var(--vscode-diffEditor-removedLineBackground)",

                    // Terminal colors
                    "terminal-bg": "var(--vscode-terminal-background)",
                    "terminal-fg": "var(--vscode-terminal-foreground)",
                },

                // Claude-specific colors
                claude: {
                    50: "#fef7ee",
                    100: "#fdecd6",
                    200: "#fad5ac",
                    300: "#f6b778",
                    400: "#f18d42",
                    500: "#ed6e1d",
                    600: "#de5513",
                    700: "#b84012",
                    800: "#933316",
                    900: "#772d15",
                    950: "#401408",
                },

                // User message colors
                user: {
                    bg: "var(--vscode-editor-selectionBackground)",
                    fg: "var(--vscode-editor-foreground)",
                },

                // Assistant message colors
                assistant: {
                    bg: "var(--vscode-editorWidget-background)",
                    fg: "var(--vscode-editor-foreground)",
                },
            },

            fontFamily: {
                sans: ["var(--vscode-font-family)", "system-ui", "sans-serif"],
                mono: [
                    "var(--vscode-editor-font-family)",
                    "Menlo",
                    "Monaco",
                    "Consolas",
                    "monospace",
                ],
            },

            fontSize: {
                vscode: "var(--vscode-font-size)",
                "vscode-editor": "var(--vscode-editor-font-size)",
            },

            fontWeight: {
                vscode: "var(--vscode-font-weight)",
            },

            lineHeight: {
                vscode: "var(--vscode-editor-line-height)",
            },

            spacing: {
                0.5: "2px",
                1.5: "6px",
                2.5: "10px",
                3.5: "14px",
                4.5: "18px",
            },

            borderRadius: {
                vscode: "4px",
            },

            boxShadow: {
                vscode: "0 2px 8px var(--vscode-widget-shadow)",
                "vscode-lg": "0 4px 16px var(--vscode-widget-shadow)",
            },

            animation: {
                "fade-in": "fadeIn 0.2s ease-in-out",
                "slide-up": "slideUp 0.3s ease-out",
                "slide-down": "slideDown 0.3s ease-out",
                "pulse-subtle": "pulseSubtle 2s infinite",
                typing: "typing 1s steps(3) infinite",
            },

            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                slideUp: {
                    "0%": { transform: "translateY(10px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
                slideDown: {
                    "0%": { transform: "translateY(-10px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
                pulseSubtle: {
                    "0%, 100%": { opacity: "1" },
                    "50%": { opacity: "0.7" },
                },
                typing: {
                    "0%, 100%": { content: '""' },
                    "25%": { content: '"."' },
                    "50%": { content: '".."' },
                    "75%": { content: '"..."' },
                },
            },

            typography: {
                DEFAULT: {
                    css: {
                        "--tw-prose-body": "var(--vscode-editor-foreground)",
                        "--tw-prose-headings": "var(--vscode-editor-foreground)",
                        "--tw-prose-links": "var(--vscode-textLink-foreground)",
                        "--tw-prose-code": "var(--vscode-editor-foreground)",
                        "--tw-prose-pre-bg": "var(--vscode-textCodeBlock-background)",
                        maxWidth: "none",
                        code: {
                            backgroundColor: "var(--vscode-textCodeBlock-background)",
                            borderRadius: "4px",
                            padding: "2px 4px",
                        },
                        "code::before": { content: '""' },
                        "code::after": { content: '""' },
                        pre: {
                            backgroundColor: "var(--vscode-textCodeBlock-background)",
                            borderRadius: "4px",
                        },
                    },
                },
            },
        },
    },
    plugins: [],
};
