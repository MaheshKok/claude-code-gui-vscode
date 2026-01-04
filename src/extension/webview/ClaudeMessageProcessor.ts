/**
 * Claude Message Processor
 *
 * Processes incoming messages from the Claude CLI service.
 * Extracted from PanelProvider for single responsibility.
 *
 * @module webview/ClaudeMessageProcessor
 */

import * as vscode from "vscode";
import type {
    ClaudeMessage,
    SystemMessage,
    ClaudeAssistantMessage,
    ClaudeUserMessage,
    ResultMessage,
    ToolResultContent,
} from "../../shared/types";
import type { SessionStateManager, ToolUseMetric } from "./SessionStateManager";
import type { ConversationMessage } from "../services/ConversationService";

/**
 * Message poster interface for sending messages to webview
 */
export interface MessagePoster {
    postMessage: (message: Record<string, unknown>) => void;
    sendAndSaveMessage: (message: ConversationMessage) => void;
}

/**
 * Callback handlers for various processing events
 */
export interface ProcessorCallbacks {
    onSessionIdReceived: (sessionId: string) => void;
    onSubscriptionTypeReceived: (subscriptionType: string | undefined) => void;
    onProcessingComplete: (result: {
        totalCostUsd?: number;
        durationMs?: number;
        numTurns?: number;
        sessionId?: string;
    }) => void;
}

/**
 * Processes Claude messages and updates state accordingly
 */
export class ClaudeMessageProcessor {
    constructor(
        private readonly _stateManager: SessionStateManager,
        private readonly _messagePoster: MessagePoster,
        private readonly _callbacks: ProcessorCallbacks,
    ) {}

    /**
     * Process an incoming Claude message
     */
    async processMessage(message: ClaudeMessage): Promise<void> {
        switch (message.type) {
            case "system":
                this._handleSystemMessage(message as SystemMessage);
                break;
            case "assistant":
                await this._handleAssistantMessage(message as ClaudeAssistantMessage);
                break;
            case "user":
                await this._handleUserMessage(message as ClaudeUserMessage);
                break;
            case "result":
                this._handleResultMessage(message as ResultMessage);
                break;
            case "accountInfo":
                this._handleAccountInfoMessage(message);
                break;
        }
    }

    /**
     * Handle system messages (init, status, compact_boundary)
     */
    private _handleSystemMessage(message: SystemMessage): void {
        if (message.subtype === "init") {
            this._callbacks.onSessionIdReceived(message.session_id!);
            this._messagePoster.sendAndSaveMessage({
                type: "sessionInfo",
                data: {
                    sessionId: message.session_id,
                    tools: message.tools || [],
                    mcpServers: message.mcp_servers || [],
                },
                sessionId: message.session_id,
                tools: message.tools || [],
                mcpServers: message.mcp_servers || [],
            });
        } else if (message.subtype === "status") {
            if (message.status === "compacting") {
                this._messagePoster.sendAndSaveMessage({
                    type: "compacting",
                    data: { isCompacting: true },
                    isCompacting: true,
                });
            } else if (message.status === null) {
                this._messagePoster.sendAndSaveMessage({
                    type: "compacting",
                    data: { isCompacting: false },
                    isCompacting: false,
                });
            }
        } else if (message.subtype === "compact_boundary") {
            this._stateManager.resetTokenCounts();

            this._messagePoster.sendAndSaveMessage({
                type: "compactBoundary",
                data: {
                    trigger: message.compact_metadata?.trigger,
                    preTokens: message.compact_metadata?.pre_tokens,
                },
                trigger: message.compact_metadata?.trigger,
                preTokens: message.compact_metadata?.pre_tokens,
            });
        }
    }

    /**
     * Handle assistant messages (text, thinking, tool_use)
     */
    private async _handleAssistantMessage(message: ClaudeAssistantMessage): Promise<void> {
        if (!message.message?.content) {
            return;
        }

        // Track token usage
        const usage = message.message.usage;
        let tokenCount: number | undefined;
        let cacheReadTokens = 0;
        let cacheCreationTokens = 0;

        if (usage) {
            const current = {
                input_tokens: usage.input_tokens || 0,
                output_tokens: usage.output_tokens || 0,
                cache_read_input_tokens: usage.cache_read_input_tokens || 0,
                cache_creation_input_tokens: usage.cache_creation_input_tokens || 0,
            };

            cacheReadTokens = current.cache_read_input_tokens || 0;
            cacheCreationTokens = current.cache_creation_input_tokens || 0;
            tokenCount = current.input_tokens + current.output_tokens;

            this._stateManager.addTokenUsage({
                inputTokens: current.input_tokens,
                outputTokens: current.output_tokens,
                cacheReadTokens,
                cacheCreationTokens,
            });

            const total = this._stateManager.getTokenTotals();

            this._messagePoster.sendAndSaveMessage({
                type: "updateTokens",
                data: { current, total },
                current,
                total,
            });
        }

        // Process content
        for (const content of message.message.content) {
            await this._processContentItem(
                content,
                tokenCount,
                cacheReadTokens,
                cacheCreationTokens,
            );
        }
    }

    /**
     * Process a single content item from an assistant message
     */
    private async _processContentItem(
        content: {
            type: string;
            text?: string;
            thinking?: string;
            id?: string;
            tool_use_id?: string;
            name?: string;
            input?: Record<string, unknown>;
        },
        tokenCount: number | undefined,
        cacheReadTokens: number,
        cacheCreationTokens: number,
    ): Promise<void> {
        if (content.type === "text" && content.text?.trim()) {
            this._stateManager.hasOpenOutput = true;
            const text = content.text.trim();
            this._messagePoster.sendAndSaveMessage({
                type: "output",
                data: text,
                text,
                isFinal: false,
            });
        } else if (content.type === "thinking" && content.thinking?.trim()) {
            const thinking = content.thinking.trim();
            this._messagePoster.sendAndSaveMessage({
                type: "thinking",
                data: thinking,
                thinking,
            });
        } else if (content.type === "tool_use") {
            await this._processToolUse(
                content as {
                    id?: string;
                    tool_use_id?: string;
                    name: string;
                    input?: Record<string, unknown>;
                },
                tokenCount,
                cacheReadTokens,
                cacheCreationTokens,
            );
        }
    }

    /**
     * Process a tool use content item
     */
    private async _processToolUse(
        content: {
            id?: string;
            tool_use_id?: string;
            name: string;
            input?: Record<string, unknown>;
        },
        tokenCount: number | undefined,
        cacheReadTokens: number,
        cacheCreationTokens: number,
    ): Promise<void> {
        const toolUseId = content.id || content.tool_use_id || `tool-${Date.now()}`;
        const toolInfo = `Executing: ${content.name}`;
        const rawInput = content.input;

        let fileContentBefore: string | undefined;
        const isFileEditTool =
            content.name === "Edit" || content.name === "MultiEdit" || content.name === "Write";

        if (isFileEditTool && rawInput && typeof rawInput.file_path === "string") {
            try {
                const fileUri = vscode.Uri.file(rawInput.file_path);
                const fileData = await vscode.workspace.fs.readFile(fileUri);
                fileContentBefore = Buffer.from(fileData).toString("utf8");
            } catch {
                fileContentBefore = "";
            }
        }

        let startLine: number | undefined;
        let startLines: number[] | undefined;

        if (fileContentBefore !== undefined && rawInput) {
            if (content.name === "Edit" && typeof rawInput.old_string === "string") {
                startLine = this._findLineNumber(fileContentBefore, rawInput.old_string);
            } else if (content.name === "MultiEdit" && Array.isArray(rawInput.edits)) {
                startLines = rawInput.edits.map((edit: { old_string?: string }) => {
                    if (edit && typeof edit.old_string === "string") {
                        return this._findLineNumber(fileContentBefore!, edit.old_string);
                    }
                    return 1;
                });
            }
        }

        const metric: ToolUseMetric = {
            startTime: Date.now(),
            tokens: tokenCount,
            cacheReadTokens,
            cacheCreationTokens,
            toolName: content.name,
            rawInput,
            fileContentBefore,
            startLine,
            startLines,
        };

        this._stateManager.setToolMetric(toolUseId, metric);

        this._messagePoster.sendAndSaveMessage({
            type: "toolUse",
            data: {
                toolInfo,
                rawInput,
                toolName: content.name,
                toolUseId,
                tokens: tokenCount,
                cacheReadTokens,
                cacheCreationTokens,
                fileContentBefore,
                startLine,
                startLines,
            },
            toolUseId,
            toolName: content.name,
            rawInput,
            toolInfo,
            tokens: tokenCount,
            cacheReadTokens,
            cacheCreationTokens,
            fileContentBefore,
            startLine,
            startLines,
        });
    }

    /**
     * Find the line number where a string starts in file content
     */
    private _findLineNumber(fileContent: string, searchString: string): number {
        const position = fileContent.indexOf(searchString);
        if (position !== -1) {
            const textBefore = fileContent.substring(0, position);
            return (textBefore.match(/\n/g) || []).length + 1;
        }
        return 1;
    }

    /**
     * Handle user messages (tool results)
     */
    private async _handleUserMessage(message: ClaudeUserMessage): Promise<void> {
        if (!message.message?.content) {
            return;
        }

        for (const content of message.message.content) {
            if (content.type === "tool_result") {
                await this._processToolResult(content);
            }
        }
    }

    /**
     * Process a tool result content item
     */
    private async _processToolResult(content: {
        tool_use_id?: string;
        content?: unknown;
        is_error?: boolean;
    }): Promise<void> {
        let resultContent: string = content.content
            ? typeof content.content === "object"
                ? JSON.stringify(content.content, null, 2)
                : String(content.content)
            : "Tool executed successfully";

        const toolUseId = content.tool_use_id;
        const toolMetrics = toolUseId ? this._stateManager.getToolMetric(toolUseId) : undefined;

        const duration = toolMetrics ? Date.now() - toolMetrics.startTime : undefined;
        const tokens = toolMetrics?.tokens;
        const cacheReadTokens = toolMetrics?.cacheReadTokens;
        const cacheCreationTokens = toolMetrics?.cacheCreationTokens;
        const toolName = toolMetrics?.toolName;
        const rawInput = toolMetrics?.rawInput;

        let fileContentAfter: string | undefined;
        const isFileEditTool =
            toolName === "Edit" || toolName === "MultiEdit" || toolName === "Write";

        if (
            isFileEditTool &&
            rawInput &&
            typeof rawInput.file_path === "string" &&
            !content.is_error
        ) {
            try {
                const fileUri = vscode.Uri.file(rawInput.file_path);
                const fileData = await vscode.workspace.fs.readFile(fileUri);
                fileContentAfter = Buffer.from(fileData).toString("utf8");
            } catch {
                fileContentAfter = undefined;
            }
        }

        this._messagePoster.sendAndSaveMessage({
            type: "toolResult",
            data: {
                content: resultContent,
                isError: content.is_error || false,
                toolUseId,
                hidden: false,
                duration,
                tokens,
                cacheReadTokens,
                cacheCreationTokens,
                toolName,
                fileContentAfter,
            },
            toolUseId,
            toolName,
            content: resultContent,
            isError: content.is_error || false,
            hidden: false,
            duration,
            tokens,
            cacheReadTokens,
            cacheCreationTokens,
            fileContentAfter,
        });

        if (toolUseId) {
            this._stateManager.deleteToolMetric(toolUseId);
        }
    }

    /**
     * Handle result messages (success/failure)
     */
    private _handleResultMessage(message: ResultMessage): void {
        if (message.subtype === "success") {
            this._stateManager.isProcessing = false;

            if (message.session_id) {
                this._callbacks.onSessionIdReceived(message.session_id);
                this._messagePoster.sendAndSaveMessage({
                    type: "sessionInfo",
                    data: { sessionId: message.session_id },
                    sessionId: message.session_id,
                    tools: [],
                    mcpServers: [],
                });
            }

            this._finalizeOutputStream();

            this._messagePoster.postMessage({
                type: "setProcessing",
                isProcessing: false,
            });

            this._stateManager.incrementRequestCount();

            if (message.total_cost_usd) {
                this._stateManager.addCost(message.total_cost_usd);
            }

            this._messagePoster.postMessage({
                type: "updateTotals",
                totalCostUsd: message.total_cost_usd || 0,
                durationMs: message.duration_ms || 0,
                numTurns: message.num_turns || 0,
                totalCost: this._stateManager.totalCost,
                totalTokensInput: this._stateManager.totalTokensInput,
                totalTokensOutput: this._stateManager.totalTokensOutput,
                requestCount: this._stateManager.requestCount,
            });

            this._callbacks.onProcessingComplete({
                totalCostUsd: message.total_cost_usd,
                durationMs: message.duration_ms,
                numTurns: message.num_turns,
                sessionId: message.session_id,
            });
        }
    }

    /**
     * Handle account info messages
     */
    private _handleAccountInfoMessage(message: ClaudeMessage): void {
        const accountMessage = message as { account?: { subscriptionType?: string } };
        this._callbacks.onSubscriptionTypeReceived(accountMessage.account?.subscriptionType);
        this._messagePoster.postMessage({
            type: "accountInfo",
            account: accountMessage.account,
        });
    }

    /**
     * Finalize the output stream
     */
    private _finalizeOutputStream(): void {
        if (!this._stateManager.hasOpenOutput) {
            return;
        }

        this._messagePoster.postMessage({ type: "output", text: "", isFinal: true });
        this._stateManager.hasOpenOutput = false;
    }

    /**
     * Finalize output and clear state (called on process end/error)
     */
    finalizeAndClear(): void {
        this._finalizeOutputStream();
        this._stateManager.clearToolMetrics();
    }
}
