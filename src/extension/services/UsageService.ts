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

interface RateLimitClaimSelection {
    claim: string;
    data: RateLimitClaim;
}

export class UsageService implements vscode.Disposable {
    private _usageData: UsageData | undefined;
    private _pollInterval: NodeJS.Timeout | undefined;
    private _dataEmitter = new EventEmitter();
    private _fetchInFlight = false;
    // Cache for successfully fetched rate limit data (30 days validity)
    private _cachedRateLimitData: UsageData | undefined;
    private _cachedRateLimitTimestamp: number | undefined;
    private static readonly CACHE_VALIDITY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

    constructor(
        private readonly _claudeService: ClaudeService,
        private readonly _outputChannel?: vscode.OutputChannel,
    ) {
        this._log("╔════════════════════════════════════════════╗");
        this._log("║   USAGE SERVICE INITIALIZING               ║");
        this._log("╚════════════════════════════════════════════╝");
        // Start polling
        this.startPolling();
        this._log("✅ Polling started (5-minute intervals)");
    }

    private _log(message: string, data?: unknown): void {
        const formatted = `[UsageService] ${message}`;
        if (data !== undefined) {
            console.log(formatted, data);
        } else {
            console.log(formatted);
        }
        if (this._outputChannel) {
            const logLine = data !== undefined ? `${formatted} ${JSON.stringify(data)}` : formatted;
            this._outputChannel.appendLine(logLine);
        }
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
            this._log("⏭️  Fetch already in flight, skipping");
            return;
        }

        this._fetchInFlight = true;
        this._log("");
        this._log("🔄 ═══════════════════════════════════════════");
        this._log("🔄 FETCHING USAGE DATA...");
        this._log("🔄 ═══════════════════════════════════════════");

        try {
            const rateLimitUsage = await this._fetchUsageFromRateLimits();
            if (rateLimitUsage) {
                this._log("");
                this._log("✅ ═══════════════════════════════════════════");
                this._log("✅ GOT USAGE DATA FROM RATE LIMITS:");
                this._log(
                    `   📊 Session: ${(rateLimitUsage.currentSession.usageCost * 100).toFixed(1)}% used`,
                );
                this._log(
                    `   📊 Weekly:  ${(rateLimitUsage.weekly.costLikely * 100).toFixed(1)}% used`,
                );
                this._log(`   ⏱️  Session resets in: ${rateLimitUsage.currentSession.resetsIn}`);
                this._log(`   ⏱️  Weekly resets at: ${rateLimitUsage.weekly.resetsAt}`);
                this._log("✅ ═══════════════════════════════════════════");
                this._log("");

                // Cache the successful rate limit data for future fallback
                this._cachedRateLimitData = rateLimitUsage;
                this._cachedRateLimitTimestamp = Date.now();
                this._log("💾 Cached rate limit data for fallback use");

                this._usageData = rateLimitUsage;
                this._dataEmitter.emit("update", this._usageData);
                return;
            }

            // Rate limit fetch failed - try to use cached rate limit data first
            this._log("⚠️  Rate limit fetch returned null");

            // Check if we have valid cached rate limit data (within 30 days)
            if (this._cachedRateLimitData && this._cachedRateLimitTimestamp) {
                const cacheAge = Date.now() - this._cachedRateLimitTimestamp;
                if (cacheAge < UsageService.CACHE_VALIDITY_MS) {
                    const cacheAgeHours = Math.round(cacheAge / (1000 * 60 * 60));
                    this._log(`📦 Using cached rate limit data (${cacheAgeHours}h old)`);
                    this._usageData = this._cachedRateLimitData;
                    this._dataEmitter.emit("update", this._usageData);
                    return;
                } else {
                    this._log("⚠️  Cached rate limit data expired (>30 days)");
                }
            }

            // Last resort: try stats cache (note: this has inaccurate reset times)
            this._log("⚠️  No valid cached rate limit data, trying stats cache as last resort...");
            const statsUsage = await this._fetchUsageFromStatsCache();
            if (statsUsage) {
                this._log("⚠️  Got usage data from stats cache (reset times may be inaccurate)");
                this._usageData = statsUsage;
                this._dataEmitter.emit("update", this._usageData);
            } else {
                this._log("❌ All data sources failed");
            }
        } catch (error) {
            this._log("❌ Failed to fetch usage data:", error);

            // Even on error, try to use cached data
            if (this._cachedRateLimitData && this._cachedRateLimitTimestamp) {
                const cacheAge = Date.now() - this._cachedRateLimitTimestamp;
                if (cacheAge < UsageService.CACHE_VALIDITY_MS) {
                    const cacheAgeHours = Math.round(cacheAge / (1000 * 60 * 60));
                    this._log(`📦 Using cached rate limit data on error (${cacheAgeHours}h old)`);
                    this._usageData = this._cachedRateLimitData;
                    this._dataEmitter.emit("update", this._usageData);
                }
            }
        } finally {
            this._fetchInFlight = false;
        }
    }

    private async _fetchUsageFromRateLimits(): Promise<UsageData | null> {
        try {
            this._log("📡 Running quota command...");
            const output = await this._runQuotaCommand();
            if (!output) {
                this._log("❌ Quota command returned no output");
                return null;
            }
            this._log(`📄 Quota command output: ${output.length} chars`);

            const headers = this._parseRateLimitHeaders(output);
            const usageData = this._buildUsageDataFromRateLimits(headers);

            if (usageData) {
                this._log("Successfully built usage data from rate limits");
            } else {
                this._log("Could not build usage data from rate limits");
            }

            return usageData;
        } catch (error) {
            this._log(
                "Rate-limit usage fetch failed:",
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
            this._log("Could not find stats-cache.json");
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
            this._log(`No data for ${today}, utilizing latest available data from ${latest.date}`);
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
        const timeoutMs = 15_000; // 15 seconds should be plenty for a quota check
        const maxBuffer = 10 * 1024 * 1024;
        const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd();
        // Non-interactive mode - stdin is already closed via spawn
        const args = ["-p", "--output-format", "json", "--no-session-persistence", "quota"];

        this._log(`⏱️  Command timeout: ${timeoutMs / 1000}s`);
        this._log(`📂 Working directory: ${cwd}`);
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

        // Find claude binary - try direct path first
        const homeDir = os.homedir();
        const localBin = path.join(homeDir, ".local", "bin");
        const claudeLocalPath = path.join(localBin, "claude");

        this._log(`🏠 Home directory: ${homeDir}`);
        this._log(`📁 Local bin path: ${localBin}`);
        this._log(`   Local bin exists: ${fs.existsSync(localBin) ? "✅ YES" : "❌ NO"}`);
        this._log(`📍 Claude path: ${claudeLocalPath}`);
        this._log(`   Claude exists: ${fs.existsSync(claudeLocalPath) ? "✅ YES" : "❌ NO"}`);

        // Use the full path to claude if it exists, otherwise fall back to PATH lookup
        const claudeCommand = fs.existsSync(claudeLocalPath) ? claudeLocalPath : "claude";
        this._log(`🚀 Using claude command: ${claudeCommand}`);

        // Enhance PATH for any child processes that claude might spawn
        const enhancedPath = this._getEnhancedPath();
        this._log(`🔧 Enhanced PATH (first 200 chars): ${enhancedPath.substring(0, 200)}...`);

        // Use spawn for better control over stdin
        return this._execCommandWithSpawn(claudeCommand, args, {
            cwd,
            timeout: timeoutMs,
            maxBuffer,
            env: {
                ...process.env,
                PATH: enhancedPath,
                ANTHROPIC_LOG: "debug",
                // Ensure fully non-interactive mode
                CI: "true",
                NO_COLOR: "1",
            },
        });
    }

    private _getEnhancedPath(): string {
        const homeDir = os.homedir();
        const currentPath = process.env.PATH || "";

        // Common paths where claude might be installed
        const additionalPaths = [
            // Local bin (where pipx/claude-code installs)
            path.join(homeDir, ".local", "bin"),
            // NVM paths
            path.join(homeDir, ".nvm", "versions", "node"),
            // Global npm
            "/usr/local/bin",
            path.join(homeDir, ".npm-global", "bin"),
            path.join(homeDir, ".npm", "bin"),
            // Volta
            path.join(homeDir, ".volta", "bin"),
            // pnpm
            path.join(homeDir, ".local", "share", "pnpm"),
            // Brew
            "/opt/homebrew/bin",
            "/usr/local/Homebrew/bin",
        ];

        // Find NVM current node version if NVM_DIR is set
        const nvmDir = process.env.NVM_DIR || path.join(homeDir, ".nvm");
        const nvmBin = this._findNvmCurrentBin(nvmDir);
        if (nvmBin) {
            additionalPaths.unshift(nvmBin);
        }

        // Combine paths, removing duplicates
        const allPaths = [...additionalPaths, ...currentPath.split(path.delimiter)];
        const uniquePaths = [...new Set(allPaths)].filter(Boolean);

        return uniquePaths.join(path.delimiter);
    }

    private _findNvmCurrentBin(nvmDir: string): string | null {
        try {
            // Check for NVM default alias
            const aliasPath = path.join(nvmDir, "alias", "default");
            if (fs.existsSync(aliasPath)) {
                const version = fs.readFileSync(aliasPath, "utf-8").trim();
                // Handle aliases like "lts/*" or "node" or direct version
                const nodePath = version.startsWith("v")
                    ? path.join(nvmDir, "versions", "node", version, "bin")
                    : null;
                if (nodePath && fs.existsSync(nodePath)) {
                    return nodePath;
                }
            }

            // Fall back to checking versions directory
            const versionsDir = path.join(nvmDir, "versions", "node");
            if (fs.existsSync(versionsDir)) {
                const versions = fs.readdirSync(versionsDir).filter((v) => v.startsWith("v"));
                if (versions.length > 0) {
                    // Use the latest version
                    versions.sort().reverse();
                    const binPath = path.join(versionsDir, versions[0], "bin");
                    if (fs.existsSync(binPath)) {
                        return binPath;
                    }
                }
            }
        } catch {
            // Ignore errors, fall back to current PATH
        }
        return null;
    }

    private async _execCommandWithSpawn(
        command: string,
        args: string[],
        options: { cwd: string; timeout: number; maxBuffer: number; env: NodeJS.ProcessEnv },
    ): Promise<string> {
        this._log(`⚡ Executing (spawn): ${command} ${args.join(" ")}`);
        const startTime = Date.now();

        return new Promise((resolve, reject) => {
            const child = cp.spawn(command, args, {
                cwd: options.cwd,
                env: options.env,
                stdio: ["ignore", "pipe", "pipe"], // Close stdin immediately
            });

            let stdout = "";
            let stderr = "";

            child.stdout?.on("data", (data: Buffer) => {
                stdout += data.toString("utf8");
            });

            child.stderr?.on("data", (data: Buffer) => {
                stderr += data.toString("utf8");
            });

            const timeoutId = setTimeout(() => {
                child.kill("SIGTERM");
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                this._log(`⏰ Command timed out after ${elapsed}s`);
                // Return whatever output we have so far
                const output = `${stdout}\n${stderr}`;
                if (output.trim()) {
                    this._log(`ℹ️  Partial output (${output.length} chars)`);
                    resolve(output);
                } else {
                    reject(new Error(`Command timed out after ${options.timeout}ms`));
                }
            }, options.timeout);

            child.on("close", (code) => {
                clearTimeout(timeoutId);
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                const output = `${stdout}\n${stderr}`;

                if (code === 0) {
                    this._log(`✅ Command succeeded in ${elapsed}s (${output.length} chars)`);
                } else {
                    this._log(`⚠️  Command exited with code ${code} after ${elapsed}s`);
                }

                if (output.length > 0) {
                    this._log(
                        `📝 Output preview: ${output.substring(0, 200).replace(/\n/g, "\\n")}...`,
                    );
                }

                resolve(output);
            });

            child.on("error", (error) => {
                clearTimeout(timeoutId);
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                this._log(`❌ Command error after ${elapsed}s: ${error.message}`);
                reject(error);
            });
        });
    }

    private async _execCommand(
        command: string,
        args: string[],
        options: cp.ExecFileOptions,
    ): Promise<string> {
        this._log(`⚡ Executing: ${command} ${args.join(" ")}`);
        const startTime = Date.now();

        // Ensure we get strings, not Buffers
        const execOptions: cp.ExecFileOptions = {
            ...options,
            encoding: "utf8" as BufferEncoding,
        };

        try {
            const { stdout, stderr } = await execFileAsync(command, args, execOptions);
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            const output = `${stdout || ""}\n${stderr || ""}`;
            this._log(`✅ Command succeeded in ${elapsed}s (${output.length} chars)`);
            // Log first 200 chars to see if we got anything useful
            if (output.length > 0) {
                this._log(
                    `📝 Output preview: ${output.substring(0, 200).replace(/\n/g, "\\n")}...`,
                );
            }
            return output;
        } catch (error) {
            const execError = error as cp.ExecException & {
                stdout?: string | Buffer;
                stderr?: string | Buffer;
            };

            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            this._log(`⚠️  Command error after ${elapsed}s: ${execError.message}`);

            // Handle both string and Buffer outputs
            const stdout = execError.stdout
                ? Buffer.isBuffer(execError.stdout)
                    ? execError.stdout.toString("utf8")
                    : String(execError.stdout)
                : "";
            const stderr = execError.stderr
                ? Buffer.isBuffer(execError.stderr)
                    ? execError.stderr.toString("utf8")
                    : String(execError.stderr)
                : "";

            const output = `${stdout}\n${stderr}`;

            if (stdout || stderr) {
                this._log(`ℹ️  Command failed but has output (${output.length} chars)`);
                this._log(
                    `📝 Output preview: ${output.substring(0, 200).replace(/\n/g, "\\n")}...`,
                );
                return output;
            }

            this._log("❌ Command failed with no output");
            throw error;
        }
    }

    private _parseRateLimitHeaders(output: string): Record<string, string> {
        const headers: Record<string, string> = {};

        this._log("🔍 Parsing rate limit headers from output...");

        // Match both quoted (JSON) and unquoted formats:
        // Quoted:   "anthropic-ratelimit-unified-5h-utilization": "0.714"
        // Unquoted: anthropic-ratelimit-unified-5h-utilization: 0.714
        const headerRegex =
            /"?(anthropic-ratelimit-unified-[a-z0-9_.-]+-(?:utilization|reset))"?\s*:\s*"?([0-9.]+(?:e[+-]?\d+)?)"?/gi;
        let match: RegExpExecArray | null = null;

        while ((match = headerRegex.exec(output)) !== null) {
            const key = match[1];
            const value = match[2];
            if (key && value) {
                headers[key] = value;
                this._log(`   Found: ${key} = ${value}`);
            }
        }

        if (Object.keys(headers).length > 0) {
            this._log(`✅ Found ${Object.keys(headers).length} rate limit headers`);
        } else {
            this._log("⚠️  No rate limit headers found in output");
            // Check if output contains any anthropic references at all
            if (output.includes("anthropic")) {
                this._log("   Output contains 'anthropic' string but no matching headers");
                // Log sample around 'anthropic' to help debug
                const idx = output.indexOf("anthropic");
                this._log(
                    `   Sample around 'anthropic': ${output.substring(Math.max(0, idx - 20), idx + 80)}`,
                );
            } else {
                this._log("   Output does not contain 'anthropic' string");
            }
            // Log a sample of the output
            this._log(
                `   Output sample (first 300 chars): ${output.substring(0, 300).replace(/\n/g, "\\n")}`,
            );
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
        this._log("Extracted claims:", Array.from(claims.keys()));

        const sessionClaim =
            this._selectClaim(claims, ["5h", "five_hour"]) ?? this._selectClaim(claims, ["5hr"]);
        const weeklyClaim =
            this._selectClaim(claims, ["7d", "seven_day"]) ?? this._selectClaim(claims, ["7day"]);

        this._log("Session claim:", sessionClaim);
        this._log("Weekly claim:", weeklyClaim);

        if (!sessionClaim && !weeklyClaim) {
            this._log("No valid claims found, returning null");
            return null;
        }

        const sessionResetEpoch = this._normalizeResetEpoch(
            sessionClaim?.data.reset,
            sessionClaim?.claim,
        );
        const weeklyResetEpoch = this._normalizeResetEpoch(
            weeklyClaim?.data.reset,
            weeklyClaim?.claim,
        );

        const usageData: UsageData = {
            currentSession: {
                usageCost: this._clampUsage(sessionClaim?.data.utilization),
                costLimit: 1,
                resetsIn: sessionResetEpoch ? this._formatResetCountdown(sessionResetEpoch) : "",
            },
            weekly: {
                costLikely: this._clampUsage(weeklyClaim?.data.utilization),
                costLimit: 1,
                resetsAt: weeklyResetEpoch ? this._formatResetAt(weeklyResetEpoch) : "",
            },
        };

        const sonnetClaim = this._findModelClaim(claims, "sonnet");
        if (sonnetClaim?.data.utilization !== undefined) {
            const sonnetResetEpoch = this._normalizeResetEpoch(
                sonnetClaim.data.reset,
                sonnetClaim.claim,
            );
            usageData.sonnet = {
                usage: this._clampUsage(sonnetClaim.data.utilization),
                limit: 1,
                resetsAt: sonnetResetEpoch
                    ? this._formatResetAt(sonnetResetEpoch)
                    : usageData.weekly.resetsAt,
            };
        }

        return usageData;
    }

    private _selectClaim(
        claims: Map<string, RateLimitClaim>,
        candidates: string[],
    ): RateLimitClaimSelection | undefined {
        for (const candidate of candidates) {
            const data = claims.get(candidate);
            if (data) {
                return { claim: candidate, data };
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

    private _normalizeResetEpoch(
        resetEpochSeconds: number | undefined,
        claim?: string,
    ): number | undefined {
        if (!resetEpochSeconds || Number.isNaN(resetEpochSeconds)) {
            return undefined;
        }

        const windowMs = claim ? this._parseClaimWindowMs(claim) : null;
        if (!windowMs) {
            return resetEpochSeconds;
        }

        const nowMs = Date.now();
        let resetMs = resetEpochSeconds * 1000;

        if (resetMs <= nowMs) {
            const elapsedMs = nowMs - resetMs;
            const windowsAhead = Math.floor(elapsedMs / windowMs) + 1;
            resetMs += windowsAhead * windowMs;
        }

        return Math.floor(resetMs / 1000);
    }

    private _parseClaimWindowMs(claim: string): number | null {
        const normalized = claim.toLowerCase();
        const numericMatch = normalized.match(
            /(\d+)(h|hr|hrs|hour|hours|d|day|days|m|min|mins|minute|minutes)/,
        );

        if (numericMatch) {
            const value = Number(numericMatch[1]);
            const unit = numericMatch[2];

            if (Number.isNaN(value)) {
                return null;
            }

            if (unit.startsWith("m")) {
                return value * 60 * 1000;
            }
            if (unit.startsWith("h")) {
                return value * 60 * 60 * 1000;
            }
            if (unit.startsWith("d")) {
                return value * 24 * 60 * 60 * 1000;
            }

            return null;
        }

        if (normalized === "five_hour") {
            return 5 * 60 * 60 * 1000;
        }
        if (normalized === "seven_day") {
            return 7 * 24 * 60 * 60 * 1000;
        }

        return null;
    }

    private _formatResetCountdown(resetEpochSeconds: number): string {
        const resetDate = new Date(resetEpochSeconds * 1000);
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

        // Format the actual reset time
        const resetTime = resetDate.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
        });

        return `${parts.join(" ")} @ ${resetTime}`;
    }

    private _formatResetAt(resetEpochSeconds: number): string {
        const date = new Date(resetEpochSeconds * 1000);
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // Format: "Jan 8 at 4:59 PM"
        const month = date.toLocaleDateString("en-US", { month: "short" });
        const day = date.getDate();
        const time = date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
        });

        return `${month} ${day} at ${time} (${timezone})`;
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
