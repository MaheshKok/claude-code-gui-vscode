/**
 * Usage Service
 *
 * Handles fetching and polling for Claude usage data.
 */
import * as vscode from "vscode";
import { EventEmitter } from "events";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import * as cp from "child_process";
import { promisify } from "util";
import { UsageData } from "../../shared/types/usage";
import { ClaudeService } from "./ClaudeService";
import { getWSLConfig } from "../utils/wsl";

const execFileAsync = promisify(cp.execFile);

interface RateLimitClaim {
    utilization?: number;
    reset?: number;
}

export class UsageService implements vscode.Disposable {
    private _usageData: UsageData | undefined;
    private _pollInterval: NodeJS.Timeout | undefined;
    private _dataEmitter = new EventEmitter();
    private _fetchInFlight = false;

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
        if (this._fetchInFlight) {
            return;
        }

        this._fetchInFlight = true;

        try {
            const rateLimitUsage = await this._fetchUsageFromRateLimits();
            if (rateLimitUsage) {
                this._usageData = rateLimitUsage;
                this._dataEmitter.emit("update", this._usageData);
                return;
            }

            const statsUsage = await this._fetchUsageFromStatsCache();
            if (statsUsage) {
                this._usageData = statsUsage;
                this._dataEmitter.emit("update", this._usageData);
            }
        } catch (error) {
            console.error("Failed to fetch usage data:", error);
        } finally {
            this._fetchInFlight = false;
        }
    }

    private async _fetchUsageFromRateLimits(): Promise<UsageData | null> {
        try {
            const output = await this._runQuotaCommand();
            if (!output) {
                return null;
            }

            const headers = this._parseRateLimitHeaders(output);
            return this._buildUsageDataFromRateLimits(headers);
        } catch (error) {
            console.warn(
                "[UsageService] Rate-limit usage fetch failed:",
                error instanceof Error ? error.message : error,
            );
            return null;
        }
    }

    private async _fetchUsageFromStatsCache(): Promise<UsageData | null> {
        const homeDir = os.homedir();
        const paths = [
            path.join(homeDir, ".claude"),
            path.join(homeDir, ".config", "claude"),
            path.join(homeDir, "Library", "Application Support", "Claude"),
        ];

        let statsPath = "";
        for (const p of paths) {
            const checkPath = path.join(p, "stats-cache.json");
            if (fs.existsSync(checkPath)) {
                statsPath = checkPath;
                break;
            }
        }

        if (!statsPath) {
            console.warn("[UsageService] Could not find stats-cache.json");
            return null;
        }

        const content = await fs.promises.readFile(statsPath, "utf-8");
        const stats = JSON.parse(content) as {
            dailyModelTokens: Array<{ date: string; tokensByModel: Record<string, number> }>;
        };

        const today = new Date().toISOString().split("T")[0];
        let dailyModelTokens =
            stats.dailyModelTokens?.find((d) => d.date === today)?.tokensByModel || {};

        if (Object.keys(dailyModelTokens).length === 0 && stats.dailyModelTokens?.length > 0) {
            const latest = stats.dailyModelTokens[stats.dailyModelTokens.length - 1];
            console.log(
                `[UsageService] No data for ${today}, utilizing latest available data from ${latest.date}`,
            );
            dailyModelTokens = latest.tokensByModel || {};
        }

        const PRICING = {
            opus: { input: 15.0, output: 75.0 },
            sonnet: { input: 3.0, output: 15.0 },
            haiku: { input: 0.25, output: 1.25 },
        };

        let dailyCost = 0;
        let dailySonnetTokens = 0;

        for (const model in dailyModelTokens) {
            const tokens = dailyModelTokens[model];
            const modelLower = model.toLowerCase();
            let price = PRICING.sonnet.input;

            if (modelLower.includes("opus")) {
                price = PRICING.opus.input * 0.8 + PRICING.opus.output * 0.2;
            } else if (modelLower.includes("sonnet")) {
                price = PRICING.sonnet.input * 0.8 + PRICING.sonnet.output * 0.2;
                dailySonnetTokens += tokens;
            } else if (modelLower.includes("haiku")) {
                price = PRICING.haiku.input * 0.8 + PRICING.haiku.output * 0.2;
            }

            dailyCost += (tokens / 1_000_000) * price;
        }

        let weeklyCost = 0;
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const oneWeekAgoStr = oneWeekAgo.toISOString().split("T")[0];

        if (Array.isArray(stats.dailyModelTokens)) {
            stats.dailyModelTokens.forEach((dayEntry) => {
                if (dayEntry.date >= oneWeekAgoStr) {
                    const dayTokens = dayEntry.tokensByModel || {};
                    for (const model in dayTokens) {
                        const tokens = dayTokens[model];
                        const modelLower = model.toLowerCase();
                        let price = 5.0;
                        if (modelLower.includes("opus")) price = 27.0;
                        if (modelLower.includes("sonnet")) price = 5.4;
                        weeklyCost += (tokens / 1_000_000) * price;
                    }
                }
            });
        }

        const SESSION_COST_LIMIT = 5.0;
        const PLAN_COST_LIMIT = 50.0;

        return {
            currentSession: {
                usageCost: dailyCost,
                costLimit: SESSION_COST_LIMIT,
                resetsIn: "24h",
            },
            weekly: {
                costLikely: weeklyCost,
                costLimit: PLAN_COST_LIMIT,
                resetsAt: "Daily",
            },
            sonnet: {
                usage: dailySonnetTokens,
                limit: 2_000_000,
                resetsAt: "Daily",
            },
        };
    }

    private async _runQuotaCommand(): Promise<string> {
        const timeoutMs = 120_000;
        const maxBuffer = 10 * 1024 * 1024;
        const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd();
        const args = ["-p", "--output-format", "json", "--no-session-persistence", "quota"];
        const wslConfig = getWSLConfig();

        if (process.platform === "win32" && wslConfig.enabled) {
            const wslArgs = [
                "-d",
                wslConfig.distro,
                "--",
                "env",
                "ANTHROPIC_LOG=debug",
                wslConfig.nodePath,
                "--no-warnings",
                "--enable-source-maps",
                wslConfig.claudePath,
                ...args,
            ];

            return this._execCommand("wsl", wslArgs, { cwd, timeout: timeoutMs, maxBuffer });
        }

        return this._execCommand("claude", args, {
            cwd,
            timeout: timeoutMs,
            maxBuffer,
            env: {
                ...process.env,
                ANTHROPIC_LOG: "debug",
            },
        });
    }

    private async _execCommand(
        command: string,
        args: string[],
        options: cp.ExecFileOptions,
    ): Promise<string> {
        try {
            const { stdout, stderr } = await execFileAsync(command, args, options);
            return `${stdout}\n${stderr}`;
        } catch (error) {
            const execError = error as cp.ExecException & {
                stdout?: string;
                stderr?: string;
            };
            const stdout = typeof execError.stdout === "string" ? execError.stdout : "";
            const stderr = typeof execError.stderr === "string" ? execError.stderr : "";

            if (stdout || stderr) {
                return `${stdout}\n${stderr}`;
            }

            throw error;
        }
    }

    private _parseRateLimitHeaders(output: string): Record<string, string> {
        const headers: Record<string, string> = {};
        const headerRegex =
            /(anthropic-ratelimit-unified-[a-z0-9_.-]+-(?:utilization|reset))[^0-9]*([0-9.]+(?:e[+-]?\d+)?)/gi;
        let match: RegExpExecArray | null = null;

        while ((match = headerRegex.exec(output)) !== null) {
            const key = match[1];
            const value = match[2];
            if (key && value) {
                headers[key] = value;
            }
        }

        return headers;
    }

    private _extractRateLimitClaims(headers: Record<string, string>): Map<string, RateLimitClaim> {
        const claims = new Map<string, RateLimitClaim>();

        for (const [key, rawValue] of Object.entries(headers)) {
            const match = key.match(/^anthropic-ratelimit-unified-(.+?)-(utilization|reset)$/);
            if (!match) {
                continue;
            }

            const claim = match[1];
            const kind = match[2];
            const value = Number(rawValue);

            if (Number.isNaN(value)) {
                continue;
            }

            const existing = claims.get(claim) ?? {};
            if (kind === "utilization") {
                existing.utilization = value;
            } else {
                existing.reset = value;
            }
            claims.set(claim, existing);
        }

        return claims;
    }

    private _buildUsageDataFromRateLimits(headers: Record<string, string>): UsageData | null {
        const claims = this._extractRateLimitClaims(headers);
        const sessionClaim =
            this._selectClaim(claims, ["5h", "five_hour"]) ?? this._selectClaim(claims, ["5hr"]);
        const weeklyClaim =
            this._selectClaim(claims, ["7d", "seven_day"]) ?? this._selectClaim(claims, ["7day"]);

        if (!sessionClaim && !weeklyClaim) {
            return null;
        }

        const usageData: UsageData = {
            currentSession: {
                usageCost: this._clampUsage(sessionClaim?.utilization),
                costLimit: 1,
                resetsIn: sessionClaim?.reset
                    ? this._formatResetCountdown(sessionClaim.reset)
                    : "",
            },
            weekly: {
                costLikely: this._clampUsage(weeklyClaim?.utilization),
                costLimit: 1,
                resetsAt: weeklyClaim?.reset ? this._formatResetAt(weeklyClaim.reset) : "",
            },
        };

        const sonnetClaim = this._findModelClaim(claims, "sonnet");
        if (sonnetClaim?.data.utilization !== undefined) {
            usageData.sonnet = {
                usage: this._clampUsage(sonnetClaim.data.utilization),
                limit: 1,
                resetsAt: sonnetClaim.data.reset
                    ? this._formatResetAt(sonnetClaim.data.reset)
                    : usageData.weekly.resetsAt,
            };
        }

        return usageData;
    }

    private _selectClaim(
        claims: Map<string, RateLimitClaim>,
        candidates: string[],
    ): RateLimitClaim | undefined {
        for (const candidate of candidates) {
            const claim = claims.get(candidate);
            if (claim) {
                return claim;
            }
        }
        return undefined;
    }

    private _findModelClaim(
        claims: Map<string, RateLimitClaim>,
        token: string,
    ): { claim: string; data: RateLimitClaim } | null {
        const needle = token.toLowerCase();
        for (const [claim, data] of claims.entries()) {
            if (claim.toLowerCase().includes(needle)) {
                return { claim, data };
            }
        }
        return null;
    }

    private _formatResetCountdown(resetEpochSeconds: number): string {
        const msRemaining = resetEpochSeconds * 1000 - Date.now();
        const totalMinutes = Math.max(0, Math.floor(msRemaining / 60000));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const parts: string[] = [];

        if (hours > 0) {
            parts.push(`${hours} hr`);
        }

        if (minutes > 0 || parts.length === 0) {
            parts.push(`${minutes} min`);
        }

        return parts.join(" ");
    }

    private _formatResetAt(resetEpochSeconds: number): string {
        const date = new Date(resetEpochSeconds * 1000);
        const day = date.toLocaleDateString("en-US", { weekday: "short" });
        const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
        return `${day} ${time}`;
    }

    private _clampUsage(value?: number): number {
        if (value === undefined || Number.isNaN(value)) {
            return 0;
        }
        return Math.max(0, Math.min(1, value));
    }

    public get currentUsage(): UsageData | undefined {
        return this._usageData;
    }

    public dispose(): void {
        this.stopPolling();
        this._dataEmitter.removeAllListeners();
    }
}
