/**
 * Settings Store Tests
 *
 * Tests for the Zustand settings store including WSL configuration,
 * model selection, thinking modes, and UI settings.
 *
 * @module test/stores/settingsStore
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
    useSettingsStore,
    selectWSL,
    selectSelectedModel,
    selectThinkingSettings,
    selectPlanMode,
    selectYoloMode,
    selectUISettings,
    selectContextSettings,
    type WSLConfig,
    type ThinkingIntensity,
    type ClaudeModel,
} from "../../webview/stores/settingsStore";

// Mock localStorage for persistence tests
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
    };
})();

Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
});

describe("settingsStore", () => {
    beforeEach(() => {
        // Reset store state before each test
        const { result } = renderHook(() => useSettingsStore());
        act(() => {
            result.current.resetToDefaults();
        });
        localStorageMock.clear();
    });

    // ==========================================================================
    // WSL Configuration Tests
    // ==========================================================================
    describe("WSL configuration", () => {
        describe("updateWSL", () => {
            it("should update WSL enabled state", () => {
                const { result } = renderHook(() => useSettingsStore());

                act(() => {
                    result.current.updateWSL({ enabled: true });
                });

                expect(result.current.wsl.enabled).toBe(true);
            });

            it("should update WSL distro", () => {
                const { result } = renderHook(() => useSettingsStore());

                act(() => {
                    result.current.updateWSL({ distro: "Debian" });
                });

                expect(result.current.wsl.distro).toBe("Debian");
            });

            it("should update WSL node path", () => {
                const { result } = renderHook(() => useSettingsStore());

                act(() => {
                    result.current.updateWSL({ nodePath: "/usr/local/bin/node" });
                });

                expect(result.current.wsl.nodePath).toBe("/usr/local/bin/node");
            });

            it("should update WSL claude path", () => {
                const { result } = renderHook(() => useSettingsStore());

                act(() => {
                    result.current.updateWSL({
                        claudePath: "/home/user/.local/bin/claude",
                    });
                });

                expect(result.current.wsl.claudePath).toBe("/home/user/.local/bin/claude");
            });

            it("should update multiple WSL properties at once", () => {
                const { result } = renderHook(() => useSettingsStore());

                act(() => {
                    result.current.updateWSL({
                        enabled: true,
                        distro: "Alpine",
                        nodePath: "/custom/node",
                    });
                });

                expect(result.current.wsl.enabled).toBe(true);
                expect(result.current.wsl.distro).toBe("Alpine");
                expect(result.current.wsl.nodePath).toBe("/custom/node");
            });

            it("should preserve unmodified WSL properties", () => {
                const { result } = renderHook(() => useSettingsStore());
                const originalClaudePath = result.current.wsl.claudePath;

                act(() => {
                    result.current.updateWSL({ enabled: true });
                });

                expect(result.current.wsl.claudePath).toBe(originalClaudePath);
            });
        });

        describe("default values", () => {
            it("should have WSL disabled by default", () => {
                const { result } = renderHook(() => useSettingsStore());
                expect(result.current.wsl.enabled).toBe(false);
            });

            it("should have Ubuntu as default distro", () => {
                const { result } = renderHook(() => useSettingsStore());
                expect(result.current.wsl.distro).toBe("Ubuntu");
            });

            it("should have default node path", () => {
                const { result } = renderHook(() => useSettingsStore());
                expect(result.current.wsl.nodePath).toBe("/usr/bin/node");
            });

            it("should have default claude path", () => {
                const { result } = renderHook(() => useSettingsStore());
                expect(result.current.wsl.claudePath).toBe("/usr/local/bin/claude");
            });
        });
    });

    // ==========================================================================
    // Model Selection Tests
    // ==========================================================================
    describe("model selection", () => {
        describe("setSelectedModel", () => {
            it("should set the selected model", () => {
                const { result } = renderHook(() => useSettingsStore());

                act(() => {
                    result.current.setSelectedModel("claude-opus-4-5-20251101");
                });

                expect(result.current.selectedModel).toBe("claude-opus-4-5-20251101");
            });

            it("should accept all valid model options", () => {
                const { result } = renderHook(() => useSettingsStore());
                const models: ClaudeModel[] = [
                    "claude-sonnet-4-5-20250929",
                    "claude-opus-4-5-20251101",
                    "claude-3-5-sonnet-20241022",
                    "claude-3-5-haiku-20241022",
                ];

                for (const model of models) {
                    act(() => {
                        result.current.setSelectedModel(model);
                    });
                    expect(result.current.selectedModel).toBe(model);
                }
            });
        });

        describe("default value", () => {
            it("should have claude-sonnet-4-5-20250929 as default", () => {
                const { result } = renderHook(() => useSettingsStore());
                expect(result.current.selectedModel).toBe("claude-sonnet-4-5-20250929");
            });
        });
    });

    // ==========================================================================
    // Thinking Mode Tests
    // ==========================================================================
    describe("thinking mode", () => {
        describe("toggleThinkingMode", () => {
            it("should toggle thinking mode on", () => {
                const { result } = renderHook(() => useSettingsStore());

                // First disable it
                act(() => {
                    result.current.setThinkingMode(false);
                });

                act(() => {
                    result.current.toggleThinkingMode();
                });

                expect(result.current.thinkingMode).toBe(true);
            });

            it("should toggle thinking mode off", () => {
                const { result } = renderHook(() => useSettingsStore());

                // Ensure it's on first
                act(() => {
                    result.current.setThinkingMode(true);
                });

                act(() => {
                    result.current.toggleThinkingMode();
                });

                expect(result.current.thinkingMode).toBe(false);
            });
        });

        describe("setThinkingMode", () => {
            it("should set thinking mode explicitly", () => {
                const { result } = renderHook(() => useSettingsStore());

                act(() => {
                    result.current.setThinkingMode(false);
                });

                expect(result.current.thinkingMode).toBe(false);

                act(() => {
                    result.current.setThinkingMode(true);
                });

                expect(result.current.thinkingMode).toBe(true);
            });
        });

        describe("setThinkingIntensity", () => {
            it("should set thinking intensity", () => {
                const { result } = renderHook(() => useSettingsStore());
                const intensities: ThinkingIntensity[] = [
                    "think",
                    "think-hard",
                    "think-harder",
                    "ultrathink",
                ];

                for (const intensity of intensities) {
                    act(() => {
                        result.current.setThinkingIntensity(intensity);
                    });
                    expect(result.current.thinkingIntensity).toBe(intensity);
                }
            });
        });

        describe("toggleShowThinkingProcess", () => {
            it("should toggle show thinking process", () => {
                const { result } = renderHook(() => useSettingsStore());
                const initial = result.current.showThinkingProcess;

                act(() => {
                    result.current.toggleShowThinkingProcess();
                });

                expect(result.current.showThinkingProcess).toBe(!initial);
            });
        });

        describe("default values", () => {
            it("should have thinking mode enabled by default", () => {
                const { result } = renderHook(() => useSettingsStore());
                expect(result.current.thinkingMode).toBe(true);
            });

            it('should have "think" as default intensity', () => {
                const { result } = renderHook(() => useSettingsStore());
                expect(result.current.thinkingIntensity).toBe("think");
            });

            it("should show thinking process by default", () => {
                const { result } = renderHook(() => useSettingsStore());
                expect(result.current.showThinkingProcess).toBe(true);
            });
        });
    });

    // ==========================================================================
    // Plan Mode Tests
    // ==========================================================================
    describe("plan mode", () => {
        describe("togglePlanMode", () => {
            it("should toggle plan mode on", () => {
                const { result } = renderHook(() => useSettingsStore());

                expect(result.current.planMode).toBe(false);

                act(() => {
                    result.current.togglePlanMode();
                });

                expect(result.current.planMode).toBe(true);
            });

            it("should toggle plan mode off", () => {
                const { result } = renderHook(() => useSettingsStore());

                act(() => {
                    result.current.setPlanMode(true);
                });

                act(() => {
                    result.current.togglePlanMode();
                });

                expect(result.current.planMode).toBe(false);
            });
        });

        describe("setPlanMode", () => {
            it("should set plan mode explicitly", () => {
                const { result } = renderHook(() => useSettingsStore());

                act(() => {
                    result.current.setPlanMode(true);
                });

                expect(result.current.planMode).toBe(true);

                act(() => {
                    result.current.setPlanMode(false);
                });

                expect(result.current.planMode).toBe(false);
            });
        });

        describe("default value", () => {
            it("should have plan mode disabled by default", () => {
                const { result } = renderHook(() => useSettingsStore());
                expect(result.current.planMode).toBe(false);
            });
        });
    });

    // ==========================================================================
    // Yolo Mode Tests
    // ==========================================================================
    describe("yolo mode", () => {
        describe("toggleYoloMode", () => {
            it("should toggle yolo mode", () => {
                const { result } = renderHook(() => useSettingsStore());
                const initial = result.current.yoloMode;

                act(() => {
                    result.current.toggleYoloMode();
                });

                expect(result.current.yoloMode).toBe(!initial);
            });
        });

        describe("setYoloMode", () => {
            it("should set yolo mode explicitly", () => {
                const { result } = renderHook(() => useSettingsStore());

                act(() => {
                    result.current.setYoloMode(true);
                });

                expect(result.current.yoloMode).toBe(true);
            });
        });

        describe("default value", () => {
            it("should have yolo mode disabled by default", () => {
                const { result } = renderHook(() => useSettingsStore());
                expect(result.current.yoloMode).toBe(false);
            });
        });
    });

    // ==========================================================================
    // Auto-Approve Patterns Tests
    // ==========================================================================
    describe("auto-approve patterns", () => {
        describe("addAutoApprovePattern", () => {
            it("should add a new pattern", () => {
                const { result } = renderHook(() => useSettingsStore());

                act(() => {
                    result.current.addAutoApprovePattern("/src/**");
                });

                expect(result.current.autoApprovePatterns).toContain("/src/**");
            });

            it("should not add duplicate patterns", () => {
                const { result } = renderHook(() => useSettingsStore());

                act(() => {
                    result.current.addAutoApprovePattern("/src/**");
                    result.current.addAutoApprovePattern("/src/**");
                });

                const count = result.current.autoApprovePatterns.filter(
                    (p) => p === "/src/**",
                ).length;
                expect(count).toBe(1);
            });
        });

        describe("removeAutoApprovePattern", () => {
            it("should remove an existing pattern", () => {
                const { result } = renderHook(() => useSettingsStore());

                act(() => {
                    result.current.addAutoApprovePattern("/src/**");
                });

                act(() => {
                    result.current.removeAutoApprovePattern("/src/**");
                });

                expect(result.current.autoApprovePatterns).not.toContain("/src/**");
            });

            it("should not fail when removing non-existent pattern", () => {
                const { result } = renderHook(() => useSettingsStore());

                act(() => {
                    result.current.removeAutoApprovePattern("/non-existent/**");
                });

                expect(result.current.autoApprovePatterns).toEqual([]);
            });
        });

        describe("default value", () => {
            it("should have empty patterns by default", () => {
                const { result } = renderHook(() => useSettingsStore());
                expect(result.current.autoApprovePatterns).toEqual([]);
            });
        });
    });

    // ==========================================================================
    // Claude Executable Tests
    // ==========================================================================
    describe("claude executable", () => {
        describe("setClaudeExecutable", () => {
            it("should set claude executable path", () => {
                const { result } = renderHook(() => useSettingsStore());

                act(() => {
                    result.current.setClaudeExecutable("/custom/path/claude");
                });

                expect(result.current.claudeExecutable).toBe("/custom/path/claude");
            });
        });

        describe("default value", () => {
            it('should have "claude" as default', () => {
                const { result } = renderHook(() => useSettingsStore());
                expect(result.current.claudeExecutable).toBe("claude");
            });
        });
    });

    // ==========================================================================
    // UI Settings Tests
    // ==========================================================================
    describe("UI settings", () => {
        describe("updateUISettings", () => {
            it("should update font size", () => {
                const { result } = renderHook(() => useSettingsStore());

                act(() => {
                    result.current.updateUISettings({ fontSize: 16 });
                });

                expect(result.current.fontSize).toBe(16);
            });

            it("should update compact mode", () => {
                const { result } = renderHook(() => useSettingsStore());

                act(() => {
                    result.current.updateUISettings({ compactMode: true });
                });

                expect(result.current.compactMode).toBe(true);
            });

            it("should update show avatars", () => {
                const { result } = renderHook(() => useSettingsStore());

                act(() => {
                    result.current.updateUISettings({ showAvatars: false });
                });

                expect(result.current.showAvatars).toBe(false);
            });

            it("should update show timestamps", () => {
                const { result } = renderHook(() => useSettingsStore());

                act(() => {
                    result.current.updateUISettings({ showTimestamps: false });
                });

                expect(result.current.showTimestamps).toBe(false);
            });

            it("should update code block theme", () => {
                const { result } = renderHook(() => useSettingsStore());

                act(() => {
                    result.current.updateUISettings({ codeBlockTheme: "monokai" });
                });

                expect(result.current.codeBlockTheme).toBe("monokai");
            });

            it("should update multiple settings at once", () => {
                const { result } = renderHook(() => useSettingsStore());

                act(() => {
                    result.current.updateUISettings({
                        fontSize: 18,
                        compactMode: true,
                        showAvatars: false,
                    });
                });

                expect(result.current.fontSize).toBe(18);
                expect(result.current.compactMode).toBe(true);
                expect(result.current.showAvatars).toBe(false);
            });
        });

        describe("default values", () => {
            it("should have default font size of 14", () => {
                const { result } = renderHook(() => useSettingsStore());
                expect(result.current.fontSize).toBe(14);
            });

            it("should have compact mode disabled by default", () => {
                const { result } = renderHook(() => useSettingsStore());
                expect(result.current.compactMode).toBe(false);
            });

            it("should show avatars by default", () => {
                const { result } = renderHook(() => useSettingsStore());
                expect(result.current.showAvatars).toBe(true);
            });

            it("should show timestamps by default", () => {
                const { result } = renderHook(() => useSettingsStore());
                expect(result.current.showTimestamps).toBe(true);
            });

            it("should have auto code block theme by default", () => {
                const { result } = renderHook(() => useSettingsStore());
                expect(result.current.codeBlockTheme).toBe("auto");
            });
        });
    });

    // ==========================================================================
    // Context Settings Tests
    // ==========================================================================
    describe("context settings", () => {
        describe("updateContextSettings", () => {
            it("should update include file context", () => {
                const { result } = renderHook(() => useSettingsStore());

                act(() => {
                    result.current.updateContextSettings({ includeFileContext: false });
                });

                expect(result.current.includeFileContext).toBe(false);
            });

            it("should update include workspace info", () => {
                const { result } = renderHook(() => useSettingsStore());

                act(() => {
                    result.current.updateContextSettings({ includeWorkspaceInfo: false });
                });

                expect(result.current.includeWorkspaceInfo).toBe(false);
            });

            it("should update max context lines", () => {
                const { result } = renderHook(() => useSettingsStore());

                act(() => {
                    result.current.updateContextSettings({ maxContextLines: 1000 });
                });

                expect(result.current.maxContextLines).toBe(1000);
            });
        });

        describe("default values", () => {
            it("should include file context by default", () => {
                const { result } = renderHook(() => useSettingsStore());
                expect(result.current.includeFileContext).toBe(true);
            });

            it("should include workspace info by default", () => {
                const { result } = renderHook(() => useSettingsStore());
                expect(result.current.includeWorkspaceInfo).toBe(true);
            });

            it("should have 500 max context lines by default", () => {
                const { result } = renderHook(() => useSettingsStore());
                expect(result.current.maxContextLines).toBe(500);
            });
        });
    });

    // ==========================================================================
    // Reset and Load Tests
    // ==========================================================================
    describe("reset and load", () => {
        describe("resetToDefaults", () => {
            it("should reset all settings to defaults", () => {
                const { result } = renderHook(() => useSettingsStore());

                // Modify various settings
                act(() => {
                    result.current.updateWSL({ enabled: true });
                    result.current.setSelectedModel("claude-opus-4-5-20251101");
                    result.current.setPlanMode(true);
                    result.current.setYoloMode(true);
                    result.current.updateUISettings({ fontSize: 20 });
                });

                // Reset
                act(() => {
                    result.current.resetToDefaults();
                });

                expect(result.current.wsl.enabled).toBe(false);
                expect(result.current.selectedModel).toBe("claude-sonnet-4-5-20250929");
                expect(result.current.planMode).toBe(false);
                expect(result.current.yoloMode).toBe(false);
                expect(result.current.fontSize).toBe(14);
            });
        });

        describe("loadFromVSCode", () => {
            it("should load settings from VSCode", () => {
                const { result } = renderHook(() => useSettingsStore());

                act(() => {
                    result.current.loadFromVSCode({
                        selectedModel: "claude-3-5-haiku-20241022",
                        planMode: true,
                        fontSize: 16,
                    });
                });

                expect(result.current.selectedModel).toBe("claude-3-5-haiku-20241022");
                expect(result.current.planMode).toBe(true);
                expect(result.current.fontSize).toBe(16);
            });

            it("should preserve existing settings not in loaded data", () => {
                const { result } = renderHook(() => useSettingsStore());

                act(() => {
                    result.current.setYoloMode(true);
                });

                act(() => {
                    result.current.loadFromVSCode({
                        selectedModel: "claude-3-5-haiku-20241022",
                    });
                });

                expect(result.current.yoloMode).toBe(true);
            });
        });
    });

    // ==========================================================================
    // Selector Tests
    // ==========================================================================
    describe("selectors", () => {
        it("selectWSL should return WSL config", () => {
            const { result } = renderHook(() => useSettingsStore());
            const wsl = selectWSL(result.current);

            expect(wsl).toHaveProperty("enabled");
            expect(wsl).toHaveProperty("distro");
            expect(wsl).toHaveProperty("nodePath");
            expect(wsl).toHaveProperty("claudePath");
        });

        it("selectSelectedModel should return selected model", () => {
            const { result } = renderHook(() => useSettingsStore());

            act(() => {
                result.current.setSelectedModel("claude-opus-4-5-20251101");
            });

            expect(selectSelectedModel(result.current)).toBe("claude-opus-4-5-20251101");
        });

        it("selectThinkingSettings should return thinking settings", () => {
            const { result } = renderHook(() => useSettingsStore());
            const thinking = selectThinkingSettings(result.current);

            expect(thinking).toHaveProperty("enabled");
            expect(thinking).toHaveProperty("intensity");
            expect(thinking).toHaveProperty("showProcess");
        });

        it("selectPlanMode should return plan mode state", () => {
            const { result } = renderHook(() => useSettingsStore());

            act(() => {
                result.current.setPlanMode(true);
            });

            expect(selectPlanMode(result.current)).toBe(true);
        });

        it("selectYoloMode should return yolo mode state", () => {
            const { result } = renderHook(() => useSettingsStore());

            act(() => {
                result.current.setYoloMode(true);
            });

            expect(selectYoloMode(result.current)).toBe(true);
        });

        it("selectUISettings should return UI settings", () => {
            const { result } = renderHook(() => useSettingsStore());
            const ui = selectUISettings(result.current);

            expect(ui).toHaveProperty("fontSize");
            expect(ui).toHaveProperty("compactMode");
            expect(ui).toHaveProperty("showAvatars");
            expect(ui).toHaveProperty("showTimestamps");
            expect(ui).toHaveProperty("codeBlockTheme");
        });

        it("selectContextSettings should return context settings", () => {
            const { result } = renderHook(() => useSettingsStore());
            const context = selectContextSettings(result.current);

            expect(context).toHaveProperty("includeFileContext");
            expect(context).toHaveProperty("includeWorkspaceInfo");
            expect(context).toHaveProperty("maxContextLines");
        });
    });

    // ==========================================================================
    // Other Settings Tests
    // ==========================================================================
    describe("other settings", () => {
        it("should have max history size of 100 by default", () => {
            const { result } = renderHook(() => useSettingsStore());
            expect(result.current.maxHistorySize).toBe(100);
        });

        it("should have stream responses enabled by default", () => {
            const { result } = renderHook(() => useSettingsStore());
            expect(result.current.streamResponses).toBe(true);
        });
    });
});
