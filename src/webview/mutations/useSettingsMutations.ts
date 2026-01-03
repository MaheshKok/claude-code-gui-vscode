/**
 * Settings Mutations
 *
 * Mutation hooks for settings management including model selection,
 * thinking mode, WSL configuration, and UI preferences.
 *
 * @module mutations/useSettingsMutations
 */

import { useMutation, useOptimisticMutation } from "./useMutation";
import {
    useSettingsStore,
    type SettingsState,
    ClaudeModel,
    ThinkingIntensity,
    CodeBlockTheme,
} from "../stores/settingsStore";
import type {
    UpdateModelVariables,
    UpdateThinkingVariables,
    UpdateWSLVariables,
    MutationResult,
} from "./types";

// ============================================================================
// Type Definitions
// ============================================================================

type UISettingsUpdate = Partial<
    Pick<
        SettingsState,
        "fontSize" | "compactMode" | "showAvatars" | "showTimestamps" | "codeBlockTheme"
    >
>;

type ContextSettingsUpdate = Partial<
    Pick<SettingsState, "includeFileContext" | "includeWorkspaceInfo" | "maxContextLines">
>;

// ============================================================================
// useUpdateModel
// ============================================================================

/**
 * Mutation hook for updating the selected Claude model
 *
 * @example
 * ```tsx
 * const { mutate: updateModel, isPending } = useUpdateModel();
 *
 * const handleModelChange = (model: string) => {
 *   updateModel({ model });
 * };
 * ```
 */
export function useUpdateModel(): MutationResult<void, UpdateModelVariables, Error> {
    const setSelectedModel = useSettingsStore((state) => state.setSelectedModel);
    const selectedModel = useSettingsStore((state) => state.selectedModel);

    return useOptimisticMutation<void, UpdateModelVariables, ClaudeModel>({
        mutationFn: async () => {},
        getSnapshot: () => selectedModel,
        optimisticUpdate: (variables) => {
            setSelectedModel(variables.model as ClaudeModel);
        },
        rollback: (previousModel) => {
            setSelectedModel(previousModel);
        },
        onSuccess: (_data, variables) => {
            console.log("[useUpdateModel] Model updated to:", variables.model);
        },
    });
}

// ============================================================================
// useUpdateThinking
// ============================================================================

/**
 * Mutation hook for updating thinking mode settings
 *
 * @example
 * ```tsx
 * const { mutate: updateThinking } = useUpdateThinking();
 *
 * updateThinking({ enabled: true, intensity: "think-hard" });
 * ```
 */
export function useUpdateThinking(): MutationResult<void, UpdateThinkingVariables, Error> {
    const setThinkingMode = useSettingsStore((state) => state.setThinkingMode);
    const setThinkingIntensity = useSettingsStore((state) => state.setThinkingIntensity);
    const toggleShowThinkingProcess = useSettingsStore((state) => state.toggleShowThinkingProcess);
    const thinkingMode = useSettingsStore((state) => state.thinkingMode);
    const thinkingIntensity = useSettingsStore((state) => state.thinkingIntensity);
    const showThinkingProcess = useSettingsStore((state) => state.showThinkingProcess);

    type ThinkingSnapshot = {
        enabled: boolean;
        intensity: ThinkingIntensity;
        showProcess: boolean;
    };

    return useOptimisticMutation<void, UpdateThinkingVariables, ThinkingSnapshot>({
        mutationFn: async () => {},
        getSnapshot: () => ({
            enabled: thinkingMode,
            intensity: thinkingIntensity,
            showProcess: showThinkingProcess,
        }),
        optimisticUpdate: (variables) => {
            if (variables.enabled !== undefined) {
                setThinkingMode(variables.enabled);
            }
            if (variables.intensity) {
                setThinkingIntensity(variables.intensity as ThinkingIntensity);
            }
            if (
                variables.showProcess !== undefined &&
                variables.showProcess !== showThinkingProcess
            ) {
                toggleShowThinkingProcess();
            }
        },
        rollback: (snapshot) => {
            setThinkingMode(snapshot.enabled);
            setThinkingIntensity(snapshot.intensity);
            if (showThinkingProcess !== snapshot.showProcess) {
                toggleShowThinkingProcess();
            }
        },
    });
}

// ============================================================================
// useUpdateWSL
// ============================================================================

/**
 * Mutation hook for updating WSL configuration
 *
 * @example
 * ```tsx
 * const { mutate: updateWSL } = useUpdateWSL();
 *
 * updateWSL({ enabled: true, distro: "Ubuntu-22.04" });
 * ```
 */
export function useUpdateWSL(): MutationResult<void, UpdateWSLVariables, Error> {
    const updateWSL = useSettingsStore((state) => state.updateWSL);
    const wsl = useSettingsStore((state) => state.wsl);

    return useOptimisticMutation<void, UpdateWSLVariables, typeof wsl>({
        mutationFn: async () => {},
        getSnapshot: () => ({ ...wsl }),
        optimisticUpdate: (variables) => {
            updateWSL(variables);
        },
        rollback: (previousWSL) => {
            useSettingsStore.setState({ wsl: previousWSL });
        },
        onSuccess: () => {
            console.log("[useUpdateWSL] WSL settings updated");
        },
    });
}

// ============================================================================
// useUpdateUISettings
// ============================================================================

/**
 * Mutation hook for updating UI settings
 *
 * @example
 * ```tsx
 * const { mutate: updateUI } = useUpdateUISettings();
 *
 * updateUI({ fontSize: 16, compactMode: true });
 * ```
 */
export function useUpdateUISettings(): MutationResult<void, UISettingsUpdate, Error> {
    const updateUISettings = useSettingsStore((state) => state.updateUISettings);
    const fontSize = useSettingsStore((state) => state.fontSize);
    const compactMode = useSettingsStore((state) => state.compactMode);
    const showAvatars = useSettingsStore((state) => state.showAvatars);
    const showTimestamps = useSettingsStore((state) => state.showTimestamps);
    const codeBlockTheme = useSettingsStore((state) => state.codeBlockTheme);

    type UISnapshot = {
        fontSize: number;
        compactMode: boolean;
        showAvatars: boolean;
        showTimestamps: boolean;
        codeBlockTheme: CodeBlockTheme;
    };

    return useOptimisticMutation<void, UISettingsUpdate, UISnapshot>({
        mutationFn: async () => {},
        getSnapshot: () => ({
            fontSize,
            compactMode,
            showAvatars,
            showTimestamps,
            codeBlockTheme,
        }),
        optimisticUpdate: (variables) => {
            updateUISettings(variables);
        },
        rollback: (snapshot) => {
            useSettingsStore.setState(snapshot);
        },
    });
}

// ============================================================================
// useUpdateContextSettings
// ============================================================================

/**
 * Mutation hook for updating context settings
 *
 * @example
 * ```tsx
 * const { mutate: updateContext } = useUpdateContextSettings();
 *
 * updateContext({ includeFileContext: true, maxContextLines: 1000 });
 * ```
 */
export function useUpdateContextSettings(): MutationResult<void, ContextSettingsUpdate, Error> {
    const updateContextSettings = useSettingsStore((state) => state.updateContextSettings);
    const includeFileContext = useSettingsStore((state) => state.includeFileContext);
    const includeWorkspaceInfo = useSettingsStore((state) => state.includeWorkspaceInfo);
    const maxContextLines = useSettingsStore((state) => state.maxContextLines);

    type ContextSnapshot = {
        includeFileContext: boolean;
        includeWorkspaceInfo: boolean;
        maxContextLines: number;
    };

    return useOptimisticMutation<void, ContextSettingsUpdate, ContextSnapshot>({
        mutationFn: async () => {},
        getSnapshot: () => ({
            includeFileContext,
            includeWorkspaceInfo,
            maxContextLines,
        }),
        optimisticUpdate: (variables) => {
            updateContextSettings(variables);
        },
        rollback: (snapshot) => {
            useSettingsStore.setState(snapshot);
        },
    });
}

// ============================================================================
// useResetSettings
// ============================================================================

/**
 * Mutation hook for resetting all settings to defaults
 *
 * @example
 * ```tsx
 * const { mutate: resetSettings } = useResetSettings();
 *
 * const handleReset = () => {
 *   if (confirm("Reset all settings?")) {
 *     resetSettings();
 *   }
 * };
 * ```
 */
export function useResetSettings(): MutationResult<void, void, Error> {
    const resetToDefaults = useSettingsStore((state) => state.resetToDefaults);

    return useMutation<void, void, Error>({
        mutationFn: async () => {
            resetToDefaults();
        },
        onSuccess: () => {
            console.log("[useResetSettings] Settings reset to defaults");
        },
    });
}

// ============================================================================
// useTogglePlanMode
// ============================================================================

/**
 * Mutation hook for toggling plan mode
 *
 * @example
 * ```tsx
 * const { mutate: togglePlan, isPending } = useTogglePlanMode();
 *
 * <Button onClick={() => togglePlan()}>Toggle Plan Mode</Button>
 * ```
 */
export function useTogglePlanMode(): MutationResult<void, void, Error> {
    const togglePlanMode = useSettingsStore((state) => state.togglePlanMode);
    const planMode = useSettingsStore((state) => state.planMode);

    return useOptimisticMutation<void, void, boolean>({
        mutationFn: async () => {},
        getSnapshot: () => planMode,
        optimisticUpdate: () => {
            togglePlanMode();
        },
        rollback: (previousValue) => {
            useSettingsStore.setState({ planMode: previousValue });
        },
    });
}

// ============================================================================
// useToggleYoloMode
// ============================================================================

/**
 * Mutation hook for toggling yolo mode (skip permission checks)
 *
 * @example
 * ```tsx
 * const { mutate: toggleYolo } = useToggleYoloMode();
 *
 * <Switch checked={yoloMode} onChange={() => toggleYolo()} />
 * ```
 */
export function useToggleYoloMode(): MutationResult<void, void, Error> {
    const toggleYoloMode = useSettingsStore((state) => state.toggleYoloMode);
    const yoloMode = useSettingsStore((state) => state.yoloMode);

    return useOptimisticMutation<void, void, boolean>({
        mutationFn: async () => {},
        getSnapshot: () => yoloMode,
        optimisticUpdate: () => {
            toggleYoloMode();
        },
        rollback: (previousValue) => {
            useSettingsStore.setState({ yoloMode: previousValue });
        },
    });
}
