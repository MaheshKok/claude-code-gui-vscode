/**
 * Settings Manager
 *
 * Handles reading and updating VS Code configuration settings.
 * Extracted from PanelProvider for single responsibility.
 *
 * @module webview/SettingsManager
 */

import * as vscode from "vscode";

/**
 * Settings structure sent to webview
 */
export interface WebviewSettings {
    wsl: {
        enabled: boolean;
        distro: string;
        nodePath: string;
        claudePath: string;
    };
    selectedModel: string;
    thinkingMode: boolean;
    thinkingIntensity: string;
    showThinkingProcess: boolean;
    yoloMode: boolean;
    autoApprovePatterns: string[];
    claudeExecutable: string;
    maxHistorySize: number;
    streamResponses: boolean;
    showTimestamps: boolean;
    codeBlockTheme: string;
    fontSize: number;
    compactMode: boolean;
    showAvatars: boolean;
    includeFileContext: boolean;
    includeWorkspaceInfo: boolean;
    maxContextLines: number;
}

/**
 * Configuration keys used in this extension
 */
const CONFIG_KEYS = {
    WSL_ENABLED: "wsl.enabled",
    WSL_DISTRO: "wsl.distro",
    WSL_NODE_PATH: "wsl.nodePath",
    WSL_CLAUDE_PATH: "wsl.claudePath",
    CLAUDE_MODEL: "claude.model",
    CLAUDE_EXECUTABLE: "claude.executable",
    THINKING_ENABLED: "thinking.enabled",
    THINKING_INTENSITY: "thinking.intensity",
    THINKING_SHOW_PROCESS: "thinking.showProcess",
    PERMISSIONS_YOLO_MODE: "permissions.yoloMode",
    PERMISSIONS_AUTO_APPROVE: "permissions.autoApprove",
    CHAT_MAX_HISTORY_SIZE: "chat.maxHistorySize",
    CHAT_STREAM_RESPONSES: "chat.streamResponses",
    CHAT_SHOW_TIMESTAMPS: "chat.showTimestamps",
    CHAT_CODE_BLOCK_THEME: "chat.codeBlockTheme",
    UI_FONT_SIZE: "ui.fontSize",
    UI_COMPACT_MODE: "ui.compactMode",
    UI_SHOW_AVATARS: "ui.showAvatars",
    CONTEXT_INCLUDE_FILE: "context.includeFileContext",
    CONTEXT_INCLUDE_WORKSPACE: "context.includeWorkspaceInfo",
    CONTEXT_MAX_LINES: "context.maxContextLines",
} as const;

/**
 * Default configuration values
 */
const DEFAULTS = {
    WSL_ENABLED: false,
    WSL_DISTRO: "Ubuntu",
    WSL_NODE_PATH: "/usr/bin/node",
    WSL_CLAUDE_PATH: "/usr/local/bin/claude",
    CLAUDE_MODEL: "claude-sonnet-4-5-20250929",
    CLAUDE_EXECUTABLE: "claude",
    THINKING_ENABLED: true,
    THINKING_INTENSITY: "think",
    THINKING_SHOW_PROCESS: true,
    YOLO_MODE: false,
    AUTO_APPROVE_PATTERNS: [] as string[],
    MAX_HISTORY_SIZE: 100,
    STREAM_RESPONSES: true,
    SHOW_TIMESTAMPS: true,
    CODE_BLOCK_THEME: "auto",
    FONT_SIZE: 14,
    COMPACT_MODE: false,
    SHOW_AVATARS: true,
    INCLUDE_FILE_CONTEXT: true,
    INCLUDE_WORKSPACE_INFO: true,
    MAX_CONTEXT_LINES: 500,
} as const;

/**
 * Manages VS Code configuration settings for the extension
 */
export class SettingsManager {
    private readonly _configSection = "claudeCodeGui";

    /**
     * Get the configuration object
     */
    private _getConfig(): vscode.WorkspaceConfiguration {
        return vscode.workspace.getConfiguration(this._configSection);
    }

    /**
     * Get all current settings for the webview
     */
    getCurrentSettings(selectedModel: string): WebviewSettings {
        const config = this._getConfig();

        return {
            wsl: {
                enabled: config.get<boolean>(CONFIG_KEYS.WSL_ENABLED, DEFAULTS.WSL_ENABLED),
                distro: config.get<string>(CONFIG_KEYS.WSL_DISTRO, DEFAULTS.WSL_DISTRO),
                nodePath: config.get<string>(CONFIG_KEYS.WSL_NODE_PATH, DEFAULTS.WSL_NODE_PATH),
                claudePath: config.get<string>(
                    CONFIG_KEYS.WSL_CLAUDE_PATH,
                    DEFAULTS.WSL_CLAUDE_PATH,
                ),
            },
            selectedModel,
            thinkingMode: config.get<boolean>(
                CONFIG_KEYS.THINKING_ENABLED,
                DEFAULTS.THINKING_ENABLED,
            ),
            thinkingIntensity: config.get<string>(
                CONFIG_KEYS.THINKING_INTENSITY,
                DEFAULTS.THINKING_INTENSITY,
            ),
            showThinkingProcess: config.get<boolean>(
                CONFIG_KEYS.THINKING_SHOW_PROCESS,
                DEFAULTS.THINKING_SHOW_PROCESS,
            ),
            yoloMode: config.get<boolean>(CONFIG_KEYS.PERMISSIONS_YOLO_MODE, DEFAULTS.YOLO_MODE),
            autoApprovePatterns: config.get<string[]>(
                CONFIG_KEYS.PERMISSIONS_AUTO_APPROVE,
                DEFAULTS.AUTO_APPROVE_PATTERNS,
            ),
            claudeExecutable: config.get<string>(
                CONFIG_KEYS.CLAUDE_EXECUTABLE,
                DEFAULTS.CLAUDE_EXECUTABLE,
            ),
            maxHistorySize: config.get<number>(
                CONFIG_KEYS.CHAT_MAX_HISTORY_SIZE,
                DEFAULTS.MAX_HISTORY_SIZE,
            ),
            streamResponses: config.get<boolean>(
                CONFIG_KEYS.CHAT_STREAM_RESPONSES,
                DEFAULTS.STREAM_RESPONSES,
            ),
            showTimestamps: config.get<boolean>(
                CONFIG_KEYS.CHAT_SHOW_TIMESTAMPS,
                DEFAULTS.SHOW_TIMESTAMPS,
            ),
            codeBlockTheme: config.get<string>(
                CONFIG_KEYS.CHAT_CODE_BLOCK_THEME,
                DEFAULTS.CODE_BLOCK_THEME,
            ),
            fontSize: config.get<number>(CONFIG_KEYS.UI_FONT_SIZE, DEFAULTS.FONT_SIZE),
            compactMode: config.get<boolean>(CONFIG_KEYS.UI_COMPACT_MODE, DEFAULTS.COMPACT_MODE),
            showAvatars: config.get<boolean>(CONFIG_KEYS.UI_SHOW_AVATARS, DEFAULTS.SHOW_AVATARS),
            includeFileContext: config.get<boolean>(
                CONFIG_KEYS.CONTEXT_INCLUDE_FILE,
                DEFAULTS.INCLUDE_FILE_CONTEXT,
            ),
            includeWorkspaceInfo: config.get<boolean>(
                CONFIG_KEYS.CONTEXT_INCLUDE_WORKSPACE,
                DEFAULTS.INCLUDE_WORKSPACE_INFO,
            ),
            maxContextLines: config.get<number>(
                CONFIG_KEYS.CONTEXT_MAX_LINES,
                DEFAULTS.MAX_CONTEXT_LINES,
            ),
        };
    }

    /**
     * Get the default model from configuration
     */
    getDefaultModel(): string {
        return this._getConfig().get<string>(CONFIG_KEYS.CLAUDE_MODEL, DEFAULTS.CLAUDE_MODEL);
    }

    /**
     * Update settings from webview
     */
    async updateSettings(settings: Record<string, unknown>): Promise<void> {
        const config = this._getConfig();

        if (!settings || typeof settings !== "object") {
            return;
        }

        // WSL settings
        if (settings.wsl && typeof settings.wsl === "object") {
            const wsl = settings.wsl as Record<string, unknown>;
            await this._updateWslSettings(config, wsl);
        }

        // Model settings
        if (typeof settings.selectedModel === "string") {
            await config.update(
                CONFIG_KEYS.CLAUDE_MODEL,
                settings.selectedModel,
                vscode.ConfigurationTarget.Global,
            );
        }

        // Thinking settings
        await this._updateThinkingSettings(config, settings);

        // Permission settings
        await this._updatePermissionSettings(config, settings);

        // Claude executable
        if (typeof settings.claudeExecutable === "string") {
            await config.update(
                CONFIG_KEYS.CLAUDE_EXECUTABLE,
                settings.claudeExecutable,
                vscode.ConfigurationTarget.Global,
            );
        }

        // Chat settings
        await this._updateChatSettings(config, settings);

        // UI settings
        await this._updateUiSettings(config, settings);

        // Context settings
        await this._updateContextSettings(config, settings);
    }

    /**
     * Enable YOLO mode
     */
    async enableYoloMode(): Promise<void> {
        const config = this._getConfig();
        await config.update(
            CONFIG_KEYS.PERMISSIONS_YOLO_MODE,
            true,
            vscode.ConfigurationTarget.Global,
        );
    }

    /**
     * Check if YOLO mode is enabled
     */
    isYoloModeEnabled(): boolean {
        return this._getConfig().get<boolean>(CONFIG_KEYS.PERMISSIONS_YOLO_MODE, false);
    }

    // ==================== Private Update Methods ====================

    private async _updateWslSettings(
        config: vscode.WorkspaceConfiguration,
        wsl: Record<string, unknown>,
    ): Promise<void> {
        if (typeof wsl.enabled === "boolean") {
            await config.update(
                CONFIG_KEYS.WSL_ENABLED,
                wsl.enabled,
                vscode.ConfigurationTarget.Global,
            );
        }
        if (typeof wsl.distro === "string") {
            await config.update(
                CONFIG_KEYS.WSL_DISTRO,
                wsl.distro,
                vscode.ConfigurationTarget.Global,
            );
        }
        if (typeof wsl.nodePath === "string") {
            await config.update(
                CONFIG_KEYS.WSL_NODE_PATH,
                wsl.nodePath,
                vscode.ConfigurationTarget.Global,
            );
        }
        if (typeof wsl.claudePath === "string") {
            await config.update(
                CONFIG_KEYS.WSL_CLAUDE_PATH,
                wsl.claudePath,
                vscode.ConfigurationTarget.Global,
            );
        }
    }

    private async _updateThinkingSettings(
        config: vscode.WorkspaceConfiguration,
        settings: Record<string, unknown>,
    ): Promise<void> {
        if (typeof settings.thinkingMode === "boolean") {
            await config.update(
                CONFIG_KEYS.THINKING_ENABLED,
                settings.thinkingMode,
                vscode.ConfigurationTarget.Global,
            );
        }
        if (typeof settings.thinkingIntensity === "string") {
            await config.update(
                CONFIG_KEYS.THINKING_INTENSITY,
                settings.thinkingIntensity,
                vscode.ConfigurationTarget.Global,
            );
        }
        if (typeof settings.showThinkingProcess === "boolean") {
            await config.update(
                CONFIG_KEYS.THINKING_SHOW_PROCESS,
                settings.showThinkingProcess,
                vscode.ConfigurationTarget.Global,
            );
        }
    }

    private async _updatePermissionSettings(
        config: vscode.WorkspaceConfiguration,
        settings: Record<string, unknown>,
    ): Promise<void> {
        if (typeof settings.yoloMode === "boolean") {
            await config.update(
                CONFIG_KEYS.PERMISSIONS_YOLO_MODE,
                settings.yoloMode,
                vscode.ConfigurationTarget.Global,
            );
        }
        if (Array.isArray(settings.autoApprovePatterns)) {
            await config.update(
                CONFIG_KEYS.PERMISSIONS_AUTO_APPROVE,
                settings.autoApprovePatterns,
                vscode.ConfigurationTarget.Global,
            );
        }
    }

    private async _updateChatSettings(
        config: vscode.WorkspaceConfiguration,
        settings: Record<string, unknown>,
    ): Promise<void> {
        if (typeof settings.maxHistorySize === "number") {
            await config.update(
                CONFIG_KEYS.CHAT_MAX_HISTORY_SIZE,
                settings.maxHistorySize,
                vscode.ConfigurationTarget.Global,
            );
        }
        if (typeof settings.streamResponses === "boolean") {
            await config.update(
                CONFIG_KEYS.CHAT_STREAM_RESPONSES,
                settings.streamResponses,
                vscode.ConfigurationTarget.Global,
            );
        }
        if (typeof settings.showTimestamps === "boolean") {
            await config.update(
                CONFIG_KEYS.CHAT_SHOW_TIMESTAMPS,
                settings.showTimestamps,
                vscode.ConfigurationTarget.Global,
            );
        }
        if (typeof settings.codeBlockTheme === "string") {
            await config.update(
                CONFIG_KEYS.CHAT_CODE_BLOCK_THEME,
                settings.codeBlockTheme,
                vscode.ConfigurationTarget.Global,
            );
        }
    }

    private async _updateUiSettings(
        config: vscode.WorkspaceConfiguration,
        settings: Record<string, unknown>,
    ): Promise<void> {
        if (typeof settings.fontSize === "number") {
            await config.update(
                CONFIG_KEYS.UI_FONT_SIZE,
                settings.fontSize,
                vscode.ConfigurationTarget.Global,
            );
        }
        if (typeof settings.compactMode === "boolean") {
            await config.update(
                CONFIG_KEYS.UI_COMPACT_MODE,
                settings.compactMode,
                vscode.ConfigurationTarget.Global,
            );
        }
        if (typeof settings.showAvatars === "boolean") {
            await config.update(
                CONFIG_KEYS.UI_SHOW_AVATARS,
                settings.showAvatars,
                vscode.ConfigurationTarget.Global,
            );
        }
    }

    private async _updateContextSettings(
        config: vscode.WorkspaceConfiguration,
        settings: Record<string, unknown>,
    ): Promise<void> {
        if (typeof settings.includeFileContext === "boolean") {
            await config.update(
                CONFIG_KEYS.CONTEXT_INCLUDE_FILE,
                settings.includeFileContext,
                vscode.ConfigurationTarget.Global,
            );
        }
        if (typeof settings.includeWorkspaceInfo === "boolean") {
            await config.update(
                CONFIG_KEYS.CONTEXT_INCLUDE_WORKSPACE,
                settings.includeWorkspaceInfo,
                vscode.ConfigurationTarget.Global,
            );
        }
        if (typeof settings.maxContextLines === "number") {
            await config.update(
                CONFIG_KEYS.CONTEXT_MAX_LINES,
                settings.maxContextLines,
                vscode.ConfigurationTarget.Global,
            );
        }
    }
}

/**
 * Singleton instance for global access
 */
let settingsManagerInstance: SettingsManager | null = null;

/**
 * Get the settings manager singleton
 */
export function getSettingsManager(): SettingsManager {
    if (!settingsManagerInstance) {
        settingsManagerInstance = new SettingsManager();
    }
    return settingsManagerInstance;
}
