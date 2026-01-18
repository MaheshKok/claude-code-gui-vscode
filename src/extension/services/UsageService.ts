/**
 * Usage Service
 *
 * Fetches Claude usage data by running a minimal claude command with ANTHROPIC_LOG=debug
 * to capture the actual rate limit headers from Anthropic's API response.
 *
 * How Claude CLI's /usage works:
 * - Every API call returns rate limit headers in the response
 * - Headers include: anthropic-ratelimit-unified-5h-utilization, anthropic-ratelimit-unified-7d-utilization
 * - The CLI caches/displays these headers from API responses
 * - We make a minimal API call to get fresh headers
 */
import * as vscode from "vscode";
import { EventEmitter } from "events";
import { spawn, ChildProcess } from "child_process";
import { UsageData } from "../../shared/types/usage";

// ============================================================================
// Constants
// ============================================================================

const POLLING_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const COMMAND_TIMEOUT_MS = 60_000; // 60 seconds

// ============================================================================
// Types
// ============================================================================

interface RateLimitData {
    session5h: number; // 0-1 ratio from anthropic-ratelimit-unified-5h-utilization
    weekly7d: number; // 0-1 ratio from anthropic-ratelimit-unified-7d-utilization
    reset5h?: number; // Unix timestamp for 5h reset
    reset7d?: number; // Unix timestamp for 7d reset
}

// ============================================================================
// UsageService
// ============================================================================

export class UsageService implements vscode.Disposable {
    private _usageData: UsageData | undefined;
    private _errorMessage: string | undefined;
    private _pollInterval: NodeJS.Timeout | undefined;
    private _dataEmitter = new EventEmitter();
    private _fetchInFlight: Promise<void> | null = null;
    private _currentProcess: ChildProcess | null = null;
    private _isDisposed = false;

    constructor(private readonly _outputChannel?: vscode.OutputChannel) {
        this._log("╔════════════════════════════════════════════╗");
        this._log("║   USAGE SERVICE INITIALIZING               ║");
        this._log("╚════════════════════════════════════════════╝");

        // Start polling
        this.startPolling();
        this._log("✅ Polling started (5-minute intervals)");
    }

    // ========================================================================
    // Logging
    // ========================================================================

    private _log(message: string, data?: unknown): void {
        const formatted = `[UsageService] ${message}`;
        if (this._outputChannel) {
            const logLine =
                data !== undefined ? `${formatted} ${JSON.stringify(data)}` : formatted;
            this._outputChannel.appendLine(logLine);
        }
    }

    // ========================================================================
    // Event Handling (Returns disposable to prevent memory leaks)
    // ========================================================================

    /**
     * Subscribe to usage data updates.
     * Returns a disposable that removes the listener when disposed.
     */
    public onUsageUpdate(callback: (data: UsageData) => void): vscode.Disposable {
        this._dataEmitter.on("update", callback);
        return {
            dispose: () => {
                this._dataEmitter.off("update", callback);
            },
        };
    }

    /**
     * Subscribe to error events.
     * Returns a disposable that removes the listener when disposed.
     */
    public onError(callback: (error: string) => void): vscode.Disposable {
        this._dataEmitter.on("error", callback);
        return {
            dispose: () => {
                this._dataEmitter.off("error", callback);
            },
        };
    }

    // ========================================================================
    // Polling (Prevents duplicate intervals)
    // ========================================================================

    public startPolling(): void {
        if (this._isDisposed) return;

        // Clear any existing interval first to prevent duplicates
        this.stopPolling();

        this._pollInterval = setInterval(() => {
            if (!this._isDisposed) {
                this.fetchUsageData();
            }
        }, POLLING_INTERVAL_MS);

        // Initial fetch
        this.fetchUsageData();
    }

    public stopPolling(): void {
        if (this._pollInterval) {
            clearInterval(this._pollInterval);
            this._pollInterval = undefined;
        }
    }

    // ========================================================================
    // Data Fetching (Mutex pattern to prevent race conditions)
    // ========================================================================

    /**
     * Fetch usage data from API rate limit headers.
     * Uses mutex pattern to prevent duplicate concurrent fetches.
     */
    public async fetchUsageData(): Promise<void> {
        if (this._isDisposed) return;

        // Mutex pattern to prevent race conditions
        if (this._fetchInFlight) {
            this._log("⏭️  Fetch already in flight, waiting...");
            await this._fetchInFlight;
            return;
        }

        this._fetchInFlight = this._doFetchUsageData();
        try {
            await this._fetchInFlight;
        } finally {
            this._fetchInFlight = null;
        }
    }

    private async _doFetchUsageData(): Promise<void> {
        if (this._isDisposed) return;

        this._log("");
        this._log("🔄 ═══════════════════════════════════════════");
        this._log("🔄 FETCHING USAGE DATA...");
        this._log("🔄 ═══════════════════════════════════════════");

        try {
            const usageData = await this._fetchFromClaudeCommand();

            if (usageData) {
                this._log("");
                this._log("✅ ═══════════════════════════════════════════");
                this._log("✅ GOT USAGE DATA:");
                this._log(
                    `   📊 Session (5h): ${((usageData.currentSession.usageCost / usageData.currentSession.costLimit) * 100).toFixed(1)}% used`,
                );
                this._log(
                    `   📊 Weekly (7d):  ${((usageData.weekly.costLikely / usageData.weekly.costLimit) * 100).toFixed(1)}% used`,
                );
                this._log(`   ⏱️  Session resets: ${usageData.currentSession.resetsIn}`);
                this._log(`   ⏱️  Weekly resets: ${usageData.weekly.resetsAt}`);
                this._log("✅ ═══════════════════════════════════════════");
                this._log("");

                this._usageData = usageData;
                this._errorMessage = undefined;
                this._dataEmitter.emit("update", this._usageData);
            } else {
                // No fallback - emit error
                this._log("❌ Error getting usage data");
                this._errorMessage = "Error getting usage";
                this._dataEmitter.emit("error", this._errorMessage);
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            this._log("❌ Failed to fetch usage data:", errorMsg);
            this._errorMessage = "Error getting usage";
            this._dataEmitter.emit("error", this._errorMessage);
        }
    }

    // ========================================================================
    // Fetch from Claude Command with proper cleanup
    // ========================================================================

    /**
     * Run `claude -p "." --output-format json` with ANTHROPIC_LOG=debug
     * to capture rate limit headers from the API response.
     *
     * Memory leak prevention:
     * - Timeout clears and kills process
     * - Event listeners are removed on close/error
     * - Process reference is cleared
     */
    private async _fetchFromClaudeCommand(): Promise<UsageData | null> {
        if (this._isDisposed) return null;

        this._log("🔍 Running minimal claude command to get rate limit headers...");

        return new Promise((resolve) => {
            let stdout = "";
            let stderr = "";
            let resolved = false;
            let timeoutId: NodeJS.Timeout | null = null;

            // Cleanup function to prevent memory leaks
            const cleanup = () => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
                if (this._currentProcess) {
                    // Remove all listeners to prevent memory leaks
                    this._currentProcess.stdout?.removeAllListeners();
                    this._currentProcess.stderr?.removeAllListeners();
                    this._currentProcess.removeAllListeners();
                    this._currentProcess = null;
                }
            };

            const safeResolve = (value: UsageData | null) => {
                if (!resolved) {
                    resolved = true;
                    cleanup();
                    resolve(value);
                }
            };

            // Set timeout to prevent hanging
            timeoutId = setTimeout(() => {
                this._log("⏱️  Command timed out after 60s");
                if (this._currentProcess && !this._currentProcess.killed) {
                    this._currentProcess.kill("SIGTERM");
                    // Force kill after 5 seconds if SIGTERM doesn't work
                    setTimeout(() => {
                        if (this._currentProcess && !this._currentProcess.killed) {
                            this._currentProcess.kill("SIGKILL");
                        }
                    }, 5000);
                }
                safeResolve(null);
            }, COMMAND_TIMEOUT_MS);

            try {
                // Run minimal claude command with debug logging enabled
                // Use shell with 2>&1 to redirect stderr to stdout so we capture everything
                const command = "ANTHROPIC_LOG=debug claude -p '.' --output-format json 2>&1";
                this._log(`🔍 Running command: ${command}`);

                this._currentProcess = spawn(command, [], {
                    shell: true,
                    stdio: ["ignore", "pipe", "pipe"],
                    env: {
                        ...process.env,
                        ANTHROPIC_LOG: "debug",
                    },
                });

                // Capture stdout (all output goes here due to 2>&1)
                const onStdoutData = (data: Buffer) => {
                    stdout += data.toString();
                };
                this._currentProcess.stdout?.on("data", onStdoutData);

                // Capture stderr (backup)
                const onStderrData = (data: Buffer) => {
                    stderr += data.toString();
                };
                this._currentProcess.stderr?.on("data", onStderrData);

                const onClose = (code: number | null) => {
                    if (code !== 0 && code !== null) {
                        this._log(`⚠️  claude command exited with code ${code}`);
                    }

                    this._log(`🔍 stdout length: ${stdout.length}, stderr length: ${stderr.length}`);

                    // Parse rate limit headers
                    const combinedOutput = stdout + "\n" + stderr;
                    const rateLimits = this._parseRateLimitHeaders(combinedOutput);

                    if (rateLimits) {
                        this._log("✅ Got rate limits from API headers");
                        safeResolve(this._buildUsageDataFromRateLimits(rateLimits));
                    } else {
                        this._log("⚠️  Could not parse rate limits from output");
                        safeResolve(null);
                    }
                };
                this._currentProcess.on("close", onClose);

                const onError = (err: Error) => {
                    this._log("⚠️  Failed to spawn claude command:", err.message);
                    safeResolve(null);
                };
                this._currentProcess.on("error", onError);
            } catch (error) {
                this._log(
                    "⚠️  Error running claude command:",
                    error instanceof Error ? error.message : error,
                );
                safeResolve(null);
            }
        });
    }

    /**
     * Parse rate limit headers from debug output.
     */
    private _parseRateLimitHeaders(output: string): RateLimitData | null {
        let session5h: number | undefined;
        let weekly7d: number | undefined;
        let reset5h: number | undefined;
        let reset7d: number | undefined;

        // Check if output contains rate limit data
        if (!output.includes("ratelimit") && !output.includes("utilization")) {
            this._log("⚠️  No rate limit data in output");
            return null;
        }

        // Pattern for 5h utilization
        const match5h = output.match(
            /["']?anthropic-ratelimit-unified-5h-utilization["']?\s*[":]\s*["']?([0-9.]+)/i,
        );
        if (match5h) {
            const value = parseFloat(match5h[1]);
            if (!isNaN(value) && value >= 0 && value <= 2) {
                session5h = Math.min(1, value);
                this._log(`   ✅ Found 5h utilization: ${(value * 100).toFixed(1)}%`);
            }
        }

        // Pattern for 7d utilization
        const match7d = output.match(
            /["']?anthropic-ratelimit-unified-7d-utilization["']?\s*[":]\s*["']?([0-9.]+)/i,
        );
        if (match7d) {
            const value = parseFloat(match7d[1]);
            if (!isNaN(value) && value >= 0 && value <= 2) {
                weekly7d = Math.min(1, value);
                this._log(`   ✅ Found 7d utilization: ${(value * 100).toFixed(1)}%`);
            }
        }

        // Pattern for 5h reset timestamp
        const matchReset5h = output.match(
            /["']?anthropic-ratelimit-unified-5h-reset["']?\s*[":]\s*["']?([0-9]+)/i,
        );
        if (matchReset5h) {
            reset5h = parseInt(matchReset5h[1], 10);
        }

        // Pattern for 7d reset timestamp
        const matchReset7d = output.match(
            /["']?anthropic-ratelimit-unified-7d-reset["']?\s*[":]\s*["']?([0-9]+)/i,
        );
        if (matchReset7d) {
            reset7d = parseInt(matchReset7d[1], 10);
        }

        // Need at least one valid rate limit
        if (session5h === undefined && weekly7d === undefined) {
            return null;
        }

        return {
            session5h: session5h ?? 0,
            weekly7d: weekly7d ?? 0,
            reset5h,
            reset7d,
        };
    }

    /**
     * Build UsageData from rate limit headers.
     */
    private _buildUsageDataFromRateLimits(rateLimits: RateLimitData): UsageData {
        const sessionResetTime = rateLimits.reset5h
            ? this._formatResetTime(rateLimits.reset5h)
            : "~5 hr";
        const weeklyResetTime = rateLimits.reset7d
            ? this._formatResetTime(rateLimits.reset7d)
            : "~7 days";

        return {
            currentSession: {
                usageCost: rateLimits.session5h,
                costLimit: 1,
                resetsIn: sessionResetTime,
            },
            weekly: {
                costLikely: rateLimits.weekly7d,
                costLimit: 1,
                resetsAt: weeklyResetTime,
            },
        };
    }

    /**
     * Format reset time from Unix timestamp.
     */
    private _formatResetTime(timestamp: number): string {
        const resetDate = new Date(timestamp * 1000);
        const now = new Date();
        const diffMs = resetDate.getTime() - now.getTime();

        if (diffMs <= 0) {
            return "Now";
        }

        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        const parts: string[] = [];
        if (diffHours > 0) {
            parts.push(`${diffHours} hr`);
        }
        if (diffMinutes > 0 || parts.length === 0) {
            parts.push(`${diffMinutes} min`);
        }

        const timeStr = resetDate.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
        });

        // If more than 24 hours away, include the date
        if (diffHours >= 24) {
            const dateStr = resetDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            });
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            return `${dateStr} at ${timeStr} (${timezone})`;
        }

        return `${parts.join(" ")} @ ${timeStr}`;
    }

    // ========================================================================
    // Public API
    // ========================================================================

    public get currentUsage(): UsageData | undefined {
        return this._usageData;
    }

    public get lastError(): string | undefined {
        return this._errorMessage;
    }

    public dispose(): void {
        this._isDisposed = true;
        this.stopPolling();
        this._dataEmitter.removeAllListeners();

        // Kill any running process
        if (this._currentProcess) {
            if (!this._currentProcess.killed) {
                this._currentProcess.kill("SIGTERM");
            }
            this._currentProcess.stdout?.removeAllListeners();
            this._currentProcess.stderr?.removeAllListeners();
            this._currentProcess.removeAllListeners();
            this._currentProcess = null;
        }

        this._log("🧹 UsageService disposed - all resources cleaned up");
    }
}
