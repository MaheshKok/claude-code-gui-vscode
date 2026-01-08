/* eslint-disable @typescript-eslint/no-explicit-any */
// Note: Using 'any' for Claude CLI responses where types are dynamic

import * as vscode from "vscode";
import * as cp from "child_process";
import { EventEmitter } from "events";
import {
    PermissionStatus,
    PermissionDecision,
    DEFAULT_WSL_CONFIG,
    getCommandPattern,
    ToolName,
} from "../../shared/constants";
import { convertToWSLPath } from "../utils";

/**
 * Options for sending a message to Claude
 */
export interface SendMessageOptions {
    cwd: string;
    planMode?: boolean;
    yoloMode?: boolean;
    model?: string;
    mcpConfigPath?: string;
}

/**
 * Pending permission request data
 */
interface PendingPermissionRequest {
    requestId: string;
    toolName: string;
    input: Record<string, unknown>;
    suggestions?: any[];
    toolUseId: string;
}

/**
 * Service for interacting with the Claude CLI
 * Handles process spawning, stdin/stdout communication, and permission requests
 */
export class ClaudeService implements vscode.Disposable {
    private _process: cp.ChildProcess | undefined;
    private _abortController: AbortController | undefined;
    private _sessionId: string | undefined;
    private _isWslProcess: boolean = false;
    private _wslDistro: string = DEFAULT_WSL_CONFIG.DISTRO;
    private _pendingPermissionRequests: Map<string, PendingPermissionRequest> = new Map();

    private _messageEmitter = new EventEmitter();
    private _processEndEmitter = new EventEmitter();
    private _errorEmitter = new EventEmitter();
    private _permissionRequestEmitter = new EventEmitter();

    constructor(private readonly _context: vscode.ExtensionContext) {}

    /**
     * Register a callback for Claude messages
     */
    public onMessage(callback: (message: any) => void): void {
        this._messageEmitter.on("message", callback);
    }

    /**
     * Register a callback for process end
     */
    public onProcessEnd(callback: () => void): void {
        this._processEndEmitter.on("end", callback);
    }

    /**
     * Register a callback for errors
     */
    public onError(callback: (error: string) => void): void {
        this._errorEmitter.on("error", callback);
    }

    /**
     * Register a callback for permission requests
     */
    public onPermissionRequest(callback: (request: any) => void): void {
        this._permissionRequestEmitter.on("request", callback);
    }

    /**
     * Get the current session ID
     */
    public get sessionId(): string | undefined {
        return this._sessionId;
    }

    /**
     * Set the session ID
     */
    public setSessionId(id: string | undefined): void {
        this._sessionId = id;
    }

    /**
     * Send a message to Claude
     */
    public async sendMessage(message: string, options: SendMessageOptions): Promise<void> {
        const config = vscode.workspace.getConfiguration("claudeCodeGui");

        // Build command arguments
        const args = [
            "--output-format",
            "stream-json",
            "--input-format",
            "stream-json",
            "--verbose",
        ];

        // YOLO mode and Plan mode are mutually exclusive
        // YOLO: skip all permission checks (auto-approve everything)
        // Plan: only allow read operations (blocks writes)
        if (options.yoloMode) {
            args.push("--dangerously-skip-permissions");
            console.log("[ClaudeService] YOLO mode enabled, skipping all permissions");
        } else {
            args.push("--permission-prompt-tool", "stdio");

            // Only apply plan mode when NOT in yolo mode
            if (options.planMode) {
                args.push("--permission-mode", "plan");
                console.log("[ClaudeService] Plan mode enabled, added --permission-mode plan");
            }
        }

        if (options.mcpConfigPath) {
            args.push("--mcp-config", convertToWSLPath(options.mcpConfigPath));
        }

        if (options.model) {
            args.push("--model", options.model);
        }

        if (this._sessionId) {
            args.push("--resume", this._sessionId);
            console.log("Resuming session:", this._sessionId);
        } else {
            console.log("Starting new session");
        }

        console.log("Claude command args:", args);

        const wslEnabled = config.get<boolean>("wsl.enabled", DEFAULT_WSL_CONFIG.ENABLED);
        const wslDistro = config.get<string>("wsl.distro", DEFAULT_WSL_CONFIG.DISTRO);
        const nodePath = config.get<string>("wsl.nodePath", DEFAULT_WSL_CONFIG.NODE_PATH);
        const claudePath = config.get<string>("wsl.claudePath", DEFAULT_WSL_CONFIG.CLAUDE_PATH);

        // Create new AbortController for this request
        this._abortController = new AbortController();

        let claudeProcess: cp.ChildProcess;

        if (wslEnabled) {
            console.log("Using WSL configuration:", {
                wslDistro,
                nodePath,
                claudePath,
            });
            const wslCommand = `"${nodePath}" --no-warnings --enable-source-maps "${claudePath}" ${args.join(" ")}`;

            this._isWslProcess = true;
            this._wslDistro = wslDistro;

            claudeProcess = cp.spawn("wsl", ["-d", wslDistro, "bash", "-ic", wslCommand], {
                signal: this._abortController.signal,
                detached: process.platform !== "win32",
                cwd: options.cwd,
                stdio: ["pipe", "pipe", "pipe"],
                env: {
                    ...process.env,
                    FORCE_COLOR: "0",
                    NO_COLOR: "1",
                },
            });
        } else {
            this._isWslProcess = false;

            claudeProcess = cp.spawn("claude", args, {
                signal: this._abortController.signal,
                shell: process.platform === "win32",
                detached: process.platform !== "win32",
                cwd: options.cwd,
                stdio: ["pipe", "pipe", "pipe"],
                env: {
                    ...process.env,
                    FORCE_COLOR: "0",
                    NO_COLOR: "1",
                },
            });
        }

        this._process = claudeProcess;

        // Send the message to Claude's stdin
        if (claudeProcess.stdin) {
            const userMessage = {
                type: "user",
                session_id: this._sessionId || "",
                message: {
                    role: "user",
                    content: [{ type: "text", text: message }],
                },
                parent_tool_use_id: null,
            };
            claudeProcess.stdin.write(JSON.stringify(userMessage) + "\n");
        }

        let rawOutput = "";
        let errorOutput = "";

        if (claudeProcess.stdout) {
            claudeProcess.stdout.on("data", (data) => {
                const chunk = data.toString();
                console.log("[ClaudeService] Received stdout chunk:", chunk.substring(0, 200));
                rawOutput += chunk;

                // Process JSON stream line by line
                const lines = rawOutput.split("\n");
                rawOutput = lines.pop() || "";

                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const jsonData = JSON.parse(line.trim());
                            console.log("[ClaudeService] Parsed JSON message type:", jsonData.type);
                            this._processJsonData(jsonData, claudeProcess);
                        } catch (error) {
                            console.log(
                                "[ClaudeService] Failed to parse JSON line:",
                                line.substring(0, 100),
                                error,
                            );
                        }
                    }
                }
            });
        }

        if (claudeProcess.stderr) {
            claudeProcess.stderr.on("data", (data) => {
                errorOutput += data.toString();
            });
        }

        claudeProcess.on("close", (code) => {
            console.log("Claude process closed with code:", code);
            console.log("Claude stderr output:", errorOutput);

            if (!this._process) {
                return;
            }

            this._process = undefined;
            this._cancelPendingPermissionRequests();
            this._processEndEmitter.emit("end");

            if (code !== 0 && errorOutput.trim()) {
                this._errorEmitter.emit("error", errorOutput.trim());
            }
        });

        claudeProcess.on("error", (error) => {
            console.log("Claude process error:", error.message);

            if (!this._process) {
                return;
            }

            this._process = undefined;
            this._cancelPendingPermissionRequests();
            this._processEndEmitter.emit("end");
            this._errorEmitter.emit("error", `Error running Claude: ${error.message}`);
        });
    }

    /**
     * Stop the current Claude process
     */
    public async stopProcess(): Promise<void> {
        if (!this._process) {
            return;
        }

        try {
            if (this._abortController) {
                this._abortController.abort();
            }

            // End stdin first
            if (this._process.stdin && !this._process.stdin.destroyed) {
                this._process.stdin.end();
            }

            // Try to kill the process gracefully
            if (this._isWslProcess && process.platform === "win32") {
                // For WSL on Windows, use taskkill
                try {
                    cp.execSync(`taskkill /pid ${this._process.pid} /T /F`, {
                        stdio: "ignore",
                    });
                } catch (taskKillError) {
                    console.warn(
                        "[ClaudeService] Failed to terminate WSL process via taskkill:",
                        taskKillError instanceof Error ? taskKillError.message : taskKillError,
                    );
                }
            } else if (this._process.pid) {
                // For non-WSL, kill the process group
                try {
                    process.kill(-this._process.pid, "SIGTERM");
                } catch (groupKillError) {
                    console.warn(
                        "[ClaudeService] Failed to kill process group, trying direct kill:",
                        groupKillError instanceof Error ? groupKillError.message : groupKillError,
                    );
                    try {
                        this._process.kill("SIGTERM");
                    } catch (directKillError) {
                        console.warn(
                            "[ClaudeService] Failed to kill process directly (may already be terminated):",
                            directKillError instanceof Error
                                ? directKillError.message
                                : directKillError,
                        );
                    }
                }
            }

            this._process = undefined;
            this._cancelPendingPermissionRequests();
        } catch (error) {
            console.error("Error stopping Claude process:", error);
        }
    }

    /**
     * Send a permission response back to Claude
     */
    public sendPermissionResponse(
        requestId: string,
        approved: boolean,
        alwaysAllow?: boolean,
    ): void {
        const pendingRequest = this._pendingPermissionRequests.get(requestId);
        if (!pendingRequest) {
            console.error("No pending permission request found for id:", requestId);
            return;
        }

        this._pendingPermissionRequests.delete(requestId);

        if (!this._process?.stdin || this._process.stdin.destroyed) {
            console.error("Cannot send permission response: stdin not available");
            return;
        }

        let response: any;
        if (approved) {
            response = {
                type: "control_response",
                response: {
                    subtype: "success",
                    request_id: requestId,
                    response: {
                        behavior: PermissionDecision.Allow,
                        updatedInput: pendingRequest.input,
                        updatedPermissions: alwaysAllow ? pendingRequest.suggestions : undefined,
                        toolUseID: pendingRequest.toolUseId,
                    },
                },
            };
        } else {
            response = {
                type: "control_response",
                response: {
                    subtype: "success",
                    request_id: requestId,
                    response: {
                        behavior: PermissionDecision.Deny,
                        message: "User denied permission",
                        interrupt: true,
                        toolUseID: pendingRequest.toolUseId,
                    },
                },
            };
        }

        const responseJson = JSON.stringify(response) + "\n";
        console.log("Sending permission response:", responseJson);
        this._process.stdin.write(responseJson);
    }

    /**
     * Dispose of resources
     */
    public dispose(): void {
        this.stopProcess();
        this._messageEmitter.removeAllListeners();
        this._processEndEmitter.removeAllListeners();
        this._errorEmitter.removeAllListeners();
        this._permissionRequestEmitter.removeAllListeners();
    }

    /**
     * Peek at a pending permission request by ID
     */
    public getPendingPermissionRequest(requestId: string):
        | {
              toolName: string;
              input: Record<string, unknown>;
              toolUseId: string;
          }
        | undefined {
        return this._pendingPermissionRequests.get(requestId);
    }

    /**
     * Get all pending permission request IDs
     */
    public getPendingPermissionRequestIds(): string[] {
        return Array.from(this._pendingPermissionRequests.keys());
    }

    /**
     * Auto-approve all pending permission requests (used when YOLO mode is enabled mid-session)
     */
    public autoApproveAllPendingRequests(): void {
        const pendingIds = this.getPendingPermissionRequestIds();
        console.log(
            `[ClaudeService] Auto-approving ${pendingIds.length} pending permission requests (YOLO mode enabled)`,
        );

        for (const requestId of pendingIds) {
            this.sendPermissionResponse(requestId, true, false);
        }
    }

    // ==================== Private Methods ====================

    private _processJsonData(jsonData: any, claudeProcess: cp.ChildProcess): void {
        console.log(
            "[ClaudeService] Processing message type:",
            jsonData.type,
            "subtype:",
            jsonData.subtype,
        );

        // Handle control_request messages (permission requests)
        if (jsonData.type === "control_request") {
            console.log("[ClaudeService] Handling control_request");
            this._handleControlRequest(jsonData);
            return;
        }

        // Handle control_response messages (responses to initialize request)
        if (jsonData.type === "control_response") {
            console.log("[ClaudeService] Handling control_response");
            this._handleControlResponse(jsonData);
            return;
        }

        // Handle result message - end stdin when done
        if (jsonData.type === "result") {
            console.log("[ClaudeService] Handling result, ending stdin");
            if (claudeProcess.stdin && !claudeProcess.stdin.destroyed) {
                claudeProcess.stdin.end();
            }
        }

        // Emit the message for processing
        console.log("[ClaudeService] Emitting message to listeners");
        this._messageEmitter.emit("message", jsonData);
    }

    private _handleControlRequest(controlRequest: any): void {
        const request = controlRequest.request;
        const requestId = controlRequest.request_id;

        if (request?.subtype !== "can_use_tool") {
            console.log("Ignoring non-permission control request:", request?.subtype);
            return;
        }

        const toolName = request.tool_name || "Unknown Tool";
        const input = request.input || {};
        const suggestions = request.permission_suggestions;
        const toolUseId = request.tool_use_id;

        console.log(`Permission request for tool: ${toolName}, requestId: ${requestId}`);

        // Store the request for later response
        this._pendingPermissionRequests.set(requestId, {
            requestId,
            toolName,
            input,
            suggestions,
            toolUseId,
        });

        // Generate pattern for Bash commands
        let pattern: string | undefined;
        if (toolName === ToolName.Bash && input.command) {
            pattern = getCommandPattern(input.command as string);
        }

        // Emit permission request event
        let description: string | undefined;
        if (request.description) {
            description = request.description;
        } else if (toolName === ToolName.Bash && typeof input.command === "string") {
            description = input.command;
        } else if (pattern) {
            description = pattern;
        }

        this._permissionRequestEmitter.emit("request", {
            requestId,
            toolUseId,
            toolName,
            input,
            description,
            suggestions,
            decisionReason: request.decision_reason,
            blockedPath: request.blocked_path,
            status: PermissionStatus.Pending,
        });
    }

    private _handleControlResponse(controlResponse: any): void {
        const innerResponse = controlResponse.response?.response;

        if (innerResponse?.account) {
            const account = innerResponse.account;
            console.log("Account info received:", {
                subscriptionType: account.subscriptionType,
                email: account.email,
            });

            this._messageEmitter.emit("message", {
                type: "accountInfo",
                account: {
                    subscriptionType: account.subscriptionType,
                    email: account.email,
                },
            });
        }
    }

    private _cancelPendingPermissionRequests(): void {
        for (const [id, _request] of this._pendingPermissionRequests) {
            this._messageEmitter.emit("message", {
                type: "updatePermissionStatus",
                data: { id, status: PermissionStatus.Cancelled },
            });
        }
        this._pendingPermissionRequests.clear();
    }
}
