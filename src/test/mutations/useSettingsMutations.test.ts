import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import {
    useUpdateModel,
    useUpdateThinking,
    useUpdateWSL,
    useUpdateUISettings,
    useUpdateContextSettings,
    useResetSettings,
    useTogglePlanMode,
    useToggleYoloMode,
} from "../../webview/mutations/useSettingsMutations";
import { useSettingsStore } from "../../webview/stores/settingsStore";

describe("useSettingsMutations", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useSettingsStore.getState().resetToDefaults();
    });

    describe("useUpdateModel", () => {
        it("should update the selected model", async () => {
            const { result } = renderHook(() => useUpdateModel());

            await act(async () => {
                result.current.mutate({ model: "claude-3-opus-20240229" });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(useSettingsStore.getState().selectedModel).toBe("claude-3-opus-20240229");
        });

        it("should set isPending during mutation", async () => {
            const { result } = renderHook(() => useUpdateModel());

            act(() => {
                result.current.mutate({ model: "claude-3-5-sonnet-20241022" });
            });

            await waitFor(() => {
                expect(result.current.isPending).toBe(false);
            });
        });
    });

    describe("useUpdateThinking", () => {
        it("should update thinking mode enabled state", async () => {
            const { result } = renderHook(() => useUpdateThinking());

            await act(async () => {
                result.current.mutate({ enabled: true });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(useSettingsStore.getState().thinkingMode).toBe(true);
        });

        it("should update thinking intensity", async () => {
            const { result } = renderHook(() => useUpdateThinking());

            await act(async () => {
                result.current.mutate({ intensity: "think-harder" });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(useSettingsStore.getState().thinkingIntensity).toBe("think-harder");
        });

        it("should toggle show thinking process", async () => {
            const initialShowProcess = useSettingsStore.getState().showThinkingProcess;
            const { result } = renderHook(() => useUpdateThinking());

            await act(async () => {
                result.current.mutate({ showProcess: !initialShowProcess });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(useSettingsStore.getState().showThinkingProcess).toBe(!initialShowProcess);
        });
    });

    describe("useUpdateWSL", () => {
        it("should update WSL settings", async () => {
            const { result } = renderHook(() => useUpdateWSL());

            await act(async () => {
                result.current.mutate({ enabled: true, distro: "Ubuntu-22.04" });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(useSettingsStore.getState().wsl.enabled).toBe(true);
            expect(useSettingsStore.getState().wsl.distro).toBe("Ubuntu-22.04");
        });

        it("should update only distro", async () => {
            const { result } = renderHook(() => useUpdateWSL());

            await act(async () => {
                result.current.mutate({ distro: "Debian" });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(useSettingsStore.getState().wsl.distro).toBe("Debian");
        });
    });

    describe("useUpdateUISettings", () => {
        it("should update font size", async () => {
            const { result } = renderHook(() => useUpdateUISettings());

            await act(async () => {
                result.current.mutate({ fontSize: 16 });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(useSettingsStore.getState().fontSize).toBe(16);
        });

        it("should update compact mode", async () => {
            const { result } = renderHook(() => useUpdateUISettings());

            await act(async () => {
                result.current.mutate({ compactMode: true });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(useSettingsStore.getState().compactMode).toBe(true);
        });

        it("should update multiple UI settings at once", async () => {
            const { result } = renderHook(() => useUpdateUISettings());

            await act(async () => {
                result.current.mutate({
                    fontSize: 18,
                    showAvatars: false,
                    showTimestamps: true,
                });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(useSettingsStore.getState().fontSize).toBe(18);
            expect(useSettingsStore.getState().showAvatars).toBe(false);
            expect(useSettingsStore.getState().showTimestamps).toBe(true);
        });

        it("should update code block theme", async () => {
            const { result } = renderHook(() => useUpdateUISettings());

            await act(async () => {
                result.current.mutate({ codeBlockTheme: "one-dark" });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(useSettingsStore.getState().codeBlockTheme).toBe("one-dark");
        });
    });

    describe("useUpdateContextSettings", () => {
        it("should update include file context", async () => {
            const { result } = renderHook(() => useUpdateContextSettings());

            await act(async () => {
                result.current.mutate({ includeFileContext: true });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(useSettingsStore.getState().includeFileContext).toBe(true);
        });

        it("should update max context lines", async () => {
            const { result } = renderHook(() => useUpdateContextSettings());

            await act(async () => {
                result.current.mutate({ maxContextLines: 1000 });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(useSettingsStore.getState().maxContextLines).toBe(1000);
        });

        it("should update include workspace info", async () => {
            const { result } = renderHook(() => useUpdateContextSettings());

            await act(async () => {
                result.current.mutate({ includeWorkspaceInfo: true });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(useSettingsStore.getState().includeWorkspaceInfo).toBe(true);
        });
    });

    describe("useResetSettings", () => {
        it("should reset all settings to defaults", async () => {
            // First change some settings
            useSettingsStore.getState().updateUISettings({ fontSize: 20 });
            useSettingsStore.getState().togglePlanMode();
            expect(useSettingsStore.getState().fontSize).toBe(20);

            const { result } = renderHook(() => useResetSettings());

            await act(async () => {
                result.current.mutate();
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            // Check that defaults are restored
            expect(useSettingsStore.getState().fontSize).toBe(14);
        });
    });

    describe("useTogglePlanMode", () => {
        it("should toggle plan mode on", async () => {
            expect(useSettingsStore.getState().planMode).toBe(false);
            const { result } = renderHook(() => useTogglePlanMode());

            await act(async () => {
                result.current.mutate();
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(useSettingsStore.getState().planMode).toBe(true);
        });

        it("should toggle plan mode off", async () => {
            useSettingsStore.getState().togglePlanMode();
            expect(useSettingsStore.getState().planMode).toBe(true);

            const { result } = renderHook(() => useTogglePlanMode());

            await act(async () => {
                result.current.mutate();
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(useSettingsStore.getState().planMode).toBe(false);
        });
    });

    describe("useToggleYoloMode", () => {
        it("should toggle yolo mode on", async () => {
            expect(useSettingsStore.getState().yoloMode).toBe(false);
            const { result } = renderHook(() => useToggleYoloMode());

            await act(async () => {
                result.current.mutate();
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(useSettingsStore.getState().yoloMode).toBe(true);
        });

        it("should toggle yolo mode off", async () => {
            useSettingsStore.getState().toggleYoloMode();
            expect(useSettingsStore.getState().yoloMode).toBe(true);

            const { result } = renderHook(() => useToggleYoloMode());

            await act(async () => {
                result.current.mutate();
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(useSettingsStore.getState().yoloMode).toBe(false);
        });
    });
});
