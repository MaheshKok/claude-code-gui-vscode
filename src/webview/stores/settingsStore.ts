/**
 * Settings Store
 *
 * Manages application settings with persistence to VSCode settings.
 * Includes WSL configuration, model selection, thinking modes, and plan mode.
 *
 * @module stores/settingsStore
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
    ClaudeModel,
    ThinkingIntensity,
    CodeBlockTheme,
    DEFAULT_WSL_CONFIG,
    DEFAULT_UI_SETTINGS,
    DEFAULT_CHAT_SETTINGS,
    DEFAULT_THINKING_SETTINGS,
    DEFAULT_MODEL,
} from "../../shared/constants";

// Re-export enums for backward compatibility
export { ClaudeModel, ThinkingIntensity, CodeBlockTheme };

// ============================================================================
// Types
// ============================================================================

/**
 * WSL Configuration
 */
export interface WSLConfig {
    /** Whether WSL integration is enabled */
    enabled: boolean;
    /** WSL distribution name */
    distro: string;
    /** Path to Node.js in WSL */
    nodePath: string;
    /** Path to Claude executable in WSL */
    claudePath: string;
}

/**
 * Settings store state
 */
export interface SettingsState {
    /** WSL configuration */
    wsl: WSLConfig;
    /** Selected Claude model */
    selectedModel: ClaudeModel;
    /** Whether thinking mode is enabled */
    thinkingMode: boolean;
    /** Thinking intensity level */
    thinkingIntensity: ThinkingIntensity;
    /** Whether to show thinking process */
    showThinkingProcess: boolean;
    /** Whether plan mode is enabled */
    planMode: boolean;
    /** Whether yolo mode is enabled (skip permission checks) */
    yoloMode: boolean;
    /** Auto-approve patterns for permissions */
    autoApprovePatterns: string[];
    /** Path to Claude CLI executable */
    claudeExecutable: string;
    /** Maximum history size */
    maxHistorySize: number;
    /** Whether to stream responses */
    streamResponses: boolean;
    /** Whether to show timestamps */
    showTimestamps: boolean;
    /** Code block theme */
    codeBlockTheme: CodeBlockTheme;
    /** UI font size */
    fontSize: number;
    /** Compact mode */
    compactMode: boolean;
    /** Show avatars */
    showAvatars: boolean;
    /** Include file context */
    includeFileContext: boolean;
    /** Include workspace info */
    includeWorkspaceInfo: boolean;
    /** Maximum context lines */
    maxContextLines: number;
}

/**
 * Settings store actions
 */
export interface SettingsActions {
    /** Update WSL configuration */
    updateWSL: (config: Partial<WSLConfig>) => void;
    /** Set selected model */
    setSelectedModel: (model: ClaudeModel) => void;
    /** Toggle thinking mode */
    toggleThinkingMode: () => void;
    /** Set thinking mode enabled state */
    setThinkingMode: (enabled: boolean) => void;
    /** Set thinking intensity */
    setThinkingIntensity: (intensity: ThinkingIntensity) => void;
    /** Toggle show thinking process */
    toggleShowThinkingProcess: () => void;
    /** Toggle plan mode */
    togglePlanMode: () => void;
    /** Set plan mode */
    setPlanMode: (enabled: boolean) => void;
    /** Toggle yolo mode */
    toggleYoloMode: () => void;
    /** Set yolo mode */
    setYoloMode: (enabled: boolean) => void;
    /** Add auto-approve pattern */
    addAutoApprovePattern: (pattern: string) => void;
    /** Remove auto-approve pattern */
    removeAutoApprovePattern: (pattern: string) => void;
    /** Set Claude executable path */
    setClaudeExecutable: (path: string) => void;
    /** Update UI settings */
    updateUISettings: (
        settings: Partial<
            Pick<
                SettingsState,
                "fontSize" | "compactMode" | "showAvatars" | "showTimestamps" | "codeBlockTheme"
            >
        >,
    ) => void;
    /** Update context settings */
    updateContextSettings: (
        settings: Partial<
            Pick<SettingsState, "includeFileContext" | "includeWorkspaceInfo" | "maxContextLines">
        >,
    ) => void;
    /** Reset to defaults */
    resetToDefaults: () => void;
    /** Load settings from VSCode */
    loadFromVSCode: (settings: Partial<SettingsState>) => void;
}

export type SettingsStore = SettingsState & SettingsActions;

// ============================================================================
// Initial State
// ============================================================================

const initialState: SettingsState = {
    wsl: {
        enabled: DEFAULT_WSL_CONFIG.ENABLED,
        distro: DEFAULT_WSL_CONFIG.DISTRO,
        nodePath: DEFAULT_WSL_CONFIG.NODE_PATH,
        claudePath: DEFAULT_WSL_CONFIG.CLAUDE_PATH,
    },
    selectedModel: DEFAULT_MODEL,
    thinkingMode: DEFAULT_THINKING_SETTINGS.ENABLED,
    thinkingIntensity: DEFAULT_THINKING_SETTINGS.INTENSITY,
    showThinkingProcess: DEFAULT_THINKING_SETTINGS.SHOW_PROCESS,
    planMode: false,
    yoloMode: false,
    autoApprovePatterns: [],
    claudeExecutable: "claude",
    maxHistorySize: DEFAULT_CHAT_SETTINGS.MAX_HISTORY_SIZE,
    streamResponses: DEFAULT_CHAT_SETTINGS.STREAM_RESPONSES,
    showTimestamps: DEFAULT_UI_SETTINGS.SHOW_TIMESTAMPS,
    codeBlockTheme: DEFAULT_UI_SETTINGS.CODE_BLOCK_THEME,
    fontSize: DEFAULT_UI_SETTINGS.FONT_SIZE,
    compactMode: DEFAULT_UI_SETTINGS.COMPACT_MODE,
    showAvatars: DEFAULT_UI_SETTINGS.SHOW_AVATARS,
    includeFileContext: true,
    includeWorkspaceInfo: true,
    maxContextLines: DEFAULT_CHAT_SETTINGS.MAX_CONTEXT_LINES,
};

// ============================================================================
// Store
// ============================================================================

/**
 * Settings store for managing application configuration
 */
export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set, get) => ({
            ...initialState,

            updateWSL: (config) =>
                set((state) => ({
                    wsl: { ...state.wsl, ...config },
                })),

            setSelectedModel: (model) => set({ selectedModel: model }),

            toggleThinkingMode: () => set((state) => ({ thinkingMode: !state.thinkingMode })),

            setThinkingMode: (enabled) => set({ thinkingMode: enabled }),

            setThinkingIntensity: (intensity) => set({ thinkingIntensity: intensity }),

            toggleShowThinkingProcess: () =>
                set((state) => ({ showThinkingProcess: !state.showThinkingProcess })),

            togglePlanMode: () => set((state) => ({ planMode: !state.planMode })),

            setPlanMode: (enabled) => set({ planMode: enabled }),

            toggleYoloMode: () => set((state) => ({ yoloMode: !state.yoloMode })),

            setYoloMode: (enabled) => set({ yoloMode: enabled }),

            addAutoApprovePattern: (pattern) =>
                set((state) => ({
                    autoApprovePatterns: state.autoApprovePatterns.includes(pattern)
                        ? state.autoApprovePatterns
                        : [...state.autoApprovePatterns, pattern],
                })),

            removeAutoApprovePattern: (pattern) =>
                set((state) => ({
                    autoApprovePatterns: state.autoApprovePatterns.filter((p) => p !== pattern),
                })),

            setClaudeExecutable: (path) => set({ claudeExecutable: path }),

            updateUISettings: (settings) => set((state) => ({ ...state, ...settings })),

            updateContextSettings: (settings) => set((state) => ({ ...state, ...settings })),

            resetToDefaults: () => set(initialState),

            loadFromVSCode: (settings) => set((state) => ({ ...state, ...settings })),
        }),
        {
            name: "claude-flow-settings-store",
            storage: createJSONStorage(() => localStorage),
            // Persist all settings
        },
    ),
);

// ============================================================================
// Selectors
// ============================================================================

/**
 * Select WSL configuration
 */
export const selectWSL = (state: SettingsStore) => state.wsl;

/**
 * Select selected model
 */
export const selectSelectedModel = (state: SettingsStore) => state.selectedModel;

/**
 * Select thinking settings
 */
export const selectThinkingSettings = (state: SettingsStore) => ({
    enabled: state.thinkingMode,
    intensity: state.thinkingIntensity,
    showProcess: state.showThinkingProcess,
});

/**
 * Select plan mode
 */
export const selectPlanMode = (state: SettingsStore) => state.planMode;

/**
 * Select yolo mode
 */
export const selectYoloMode = (state: SettingsStore) => state.yoloMode;

/**
 * Select UI settings
 */
export const selectUISettings = (state: SettingsStore) => ({
    fontSize: state.fontSize,
    compactMode: state.compactMode,
    showAvatars: state.showAvatars,
    showTimestamps: state.showTimestamps,
    codeBlockTheme: state.codeBlockTheme,
});

/**
 * Select context settings
 */
export const selectContextSettings = (state: SettingsStore) => ({
    includeFileContext: state.includeFileContext,
    includeWorkspaceInfo: state.includeWorkspaceInfo,
    maxContextLines: state.maxContextLines,
});
