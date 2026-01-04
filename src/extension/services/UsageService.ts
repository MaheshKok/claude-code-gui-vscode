/**
 * Usage Service
 *
 * Handles fetching and polling for Claude usage data.
 */
import * as vscode from "vscode";
import { EventEmitter } from "events";
import { UsageData } from "../../shared/types/usage";
import { ClaudeService } from "./ClaudeService";

export class UsageService implements vscode.Disposable {
    private _usageData: UsageData | undefined;
    private _pollInterval: NodeJS.Timeout | undefined;
    private _dataEmitter = new EventEmitter();

    constructor(private readonly _claudeService: ClaudeService) {
        // Start polling
        this.startPolling();
    }

    public onUsageUpdate(callback: (data: UsageData) => void): void {
        this._dataEmitter.on("update", callback);
    }

    public startPolling(): void {
        // Poll every 5 minutes
        this._pollInterval = setInterval(
            () => {
                this.fetchUsageData();
            },
            5 * 60 * 1000,
        );

        // Initial fetch
        this.fetchUsageData();
    }

    public stopPolling(): void {
        if (this._pollInterval) {
            clearInterval(this._pollInterval);
            this._pollInterval = undefined;
        }
    }

    public async fetchUsageData(): Promise<void> {
        try {
            // TODO: Replace with actual CLI command execution when available
            // For now, we simulate fetching data
            // We might need to run `claude doctor` or parse `ClaudeService` outputs

            // Mock data matching the screenshot structure
            const mockData: UsageData = {
                currentSession: {
                    usageCost: 0.32, // 32%
                    costLimit: 1.0,
                    resetsIn: "3 hr 24 min",
                },
                weekly: {
                    costLikely: 0.2, // 20%
                    costLimit: 1.0,
                    resetsAt: "Thu 4:59 PM",
                },
                sonnet: {
                    usage: 0.01,
                    limit: 1.0,
                    resetsAt: "Thu 4:59 PM",
                },
            };

            this._usageData = mockData;
            this._dataEmitter.emit("update", this._usageData);

            // Also notify webview via ClaudeService or direct message if possible
            // But usually the extension glue code handles this
        } catch (error) {
            console.error("Failed to fetch usage data:", error);
        }
    }

    public get currentUsage(): UsageData | undefined {
        return this._usageData;
    }

    public dispose(): void {
        this.stopPolling();
        this._dataEmitter.removeAllListeners();
    }
}
