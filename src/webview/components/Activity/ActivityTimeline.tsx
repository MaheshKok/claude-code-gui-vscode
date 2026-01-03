import React, { useMemo, useState, useCallback } from "react";
import type { Message } from "../App";
import { ToolUseCard, ToolResultCard, TodoDisplay } from "../Tools";
import { extractTodosFromInput, formatDuration, formatTokenCount } from "../../utils";

interface ActivityStep {
    id: string;
    toolUse?: Message;
    toolResult?: Message;
    timestamp: Date;
}

export interface ActivityTimelineProps {
    messages: Message[];
    defaultCollapsed?: boolean;
}

const statusLabels: Record<string, string> = {
    executing: "Running",
    pending: "Pending",
    completed: "Completed",
    failed: "Failed",
    denied: "Denied",
};

const statusClasses: Record<string, string> = {
    running:
        "bg-[var(--vscode-terminal-ansiBlue)]/15 text-[var(--vscode-terminal-ansiBlue)] border-[var(--vscode-terminal-ansiBlue)]/40",
    executing:
        "bg-[var(--vscode-terminal-ansiBlue)]/15 text-[var(--vscode-terminal-ansiBlue)] border-[var(--vscode-terminal-ansiBlue)]/40",
    pending:
        "bg-[var(--vscode-editor-inactiveSelectionBackground)] text-[var(--vscode-descriptionForeground)] border-[var(--vscode-panel-border)]",
    completed:
        "bg-[var(--vscode-terminal-ansiGreen)]/15 text-[var(--vscode-terminal-ansiGreen)] border-[var(--vscode-terminal-ansiGreen)]/40",
    failed: "bg-[var(--vscode-errorForeground)]/15 text-[var(--vscode-errorForeground)] border-[var(--vscode-errorForeground)]/40",
    denied: "bg-[var(--vscode-terminal-ansiYellow)]/15 text-[var(--vscode-terminal-ansiYellow)] border-[var(--vscode-terminal-ansiYellow)]/40",
};

const getStepStatus = (step: ActivityStep): string => {
    if (step.toolUse?.status) {
        return step.toolUse.status;
    }
    if (step.toolResult?.isError) {
        return "failed";
    }
    if (step.toolResult) {
        return "completed";
    }
    return "pending";
};

const formatTimestamp = (date: Date): string => {
    return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    }).format(date);
};

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
    messages,
    defaultCollapsed = true,
}) => {
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
    const [collapsedSteps, setCollapsedSteps] = useState<Record<string, boolean>>({});

    const steps = useMemo<ActivityStep[]>(() => {
        const ordered: ActivityStep[] = [];
        const stepMap = new Map<string, ActivityStep>();

        messages.forEach((message) => {
            if (message.role !== "tool") {
                return;
            }
            if (message.messageType !== "tool_use" && message.messageType !== "tool_result") {
                return;
            }

            const id = message.toolUseId || message.id;
            let step = stepMap.get(id);
            if (!step) {
                step = {
                    id,
                    timestamp: message.timestamp,
                };
                stepMap.set(id, step);
                ordered.push(step);
            }

            if (message.messageType === "tool_use") {
                step.toolUse = message;
                step.timestamp = message.timestamp;
            } else if (message.messageType === "tool_result") {
                step.toolResult = message;
            }
        });

        return ordered;
    }, [messages]);

    const toggleCollapsed = useCallback(() => {
        setIsCollapsed((prev) => !prev);
    }, []);

    const toggleStep = useCallback((id: string) => {
        setCollapsedSteps((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    }, []);

    if (steps.length === 0) {
        return null;
    }

    const statusCounts = steps.reduce(
        (acc, step) => {
            const status = getStepStatus(step);
            if (status === "failed") {
                acc.failed += 1;
            } else if (status === "completed") {
                acc.completed += 1;
            } else if (status === "executing") {
                acc.running += 1;
            } else {
                acc.pending += 1;
            }
            return acc;
        },
        { completed: 0, failed: 0, running: 0, pending: 0 },
    );

    return (
        <div className="px-4 pt-4">
            <div className="rounded-md border border-[var(--vscode-panel-border)] bg-[var(--vscode-editor-background)] overflow-hidden">
                <div
                    className="flex items-center gap-2 px-3 py-2 bg-[var(--vscode-sideBarSectionHeader-background)] border-b border-[var(--vscode-panel-border)] cursor-pointer hover:bg-[var(--vscode-list-hoverBackground)] transition-colors"
                    onClick={toggleCollapsed}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`text-[var(--vscode-descriptionForeground)] transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                    >
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                    <span className="font-medium text-sm text-[var(--vscode-foreground)]">
                        Activity
                    </span>
                    <span className="text-xs text-[var(--vscode-descriptionForeground)]">
                        {steps.length} step{steps.length === 1 ? "" : "s"}
                    </span>
                    <div className="ml-auto flex items-center gap-2 text-xs text-[var(--vscode-descriptionForeground)]">
                        {statusCounts.running > 0 && <span>{statusCounts.running} running</span>}
                        {statusCounts.pending > 0 && <span>{statusCounts.pending} pending</span>}
                        {statusCounts.completed > 0 && (
                            <span>{statusCounts.completed} completed</span>
                        )}
                        {statusCounts.failed > 0 && <span>{statusCounts.failed} failed</span>}
                    </div>
                </div>

                {!isCollapsed && (
                    <div className="divide-y divide-[var(--vscode-panel-border)]">
                        {steps.map((step, index) => {
                            const status = getStepStatus(step);
                            const statusLabel = statusLabels[status] || status;
                            const statusClass = statusClasses[status] || statusClasses.pending;
                            const stepCollapsed = collapsedSteps[step.id] ?? defaultCollapsed;
                            const toolName =
                                step.toolUse?.toolName || step.toolResult?.toolName || "Tool";
                            const duration = step.toolUse?.duration ?? step.toolResult?.duration;
                            const tokens = step.toolUse?.tokens ?? step.toolResult?.tokens;
                            const cacheReadTokens =
                                step.toolUse?.cacheReadTokens ?? step.toolResult?.cacheReadTokens;
                            const cacheCreationTokens =
                                step.toolUse?.cacheCreationTokens ??
                                step.toolResult?.cacheCreationTokens;

                            return (
                                <div key={step.id} className="relative pl-6">
                                    <div className="absolute left-3 top-4 w-2 h-2 rounded-full bg-[var(--vscode-progressBar-background)]" />
                                    <div className="py-3 pr-3">
                                        <div
                                            className="flex items-center gap-2 px-3 py-2 rounded border border-[var(--vscode-panel-border)] bg-[var(--vscode-editorGroupHeader-tabsBackground)] cursor-pointer hover:bg-[var(--vscode-list-hoverBackground)] transition-colors"
                                            onClick={() => toggleStep(step.id)}
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="12"
                                                height="12"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className={`text-[var(--vscode-descriptionForeground)] transition-transform ${stepCollapsed ? "" : "rotate-90"}`}
                                            >
                                                <polyline points="9 18 15 12 9 6" />
                                            </svg>
                                            <span className="text-[10px] uppercase tracking-wide text-[var(--vscode-descriptionForeground)]">
                                                Step {index + 1}
                                            </span>
                                            <span className="font-medium text-sm text-[var(--vscode-foreground)]">
                                                {toolName}
                                            </span>
                                            <span className="text-xs text-[var(--vscode-descriptionForeground)]">
                                                {formatTimestamp(step.timestamp)}
                                            </span>
                                            <div className="ml-auto flex items-center gap-2">
                                                {duration !== undefined && (
                                                    <span className="text-[10px] text-[var(--vscode-descriptionForeground)]">
                                                        {formatDuration(duration, {
                                                            abbreviated: true,
                                                        })}
                                                    </span>
                                                )}
                                                {tokens !== undefined && (
                                                    <span className="text-[10px] text-[var(--vscode-descriptionForeground)]">
                                                        {formatTokenCount(tokens, {
                                                            includeSuffix: false,
                                                        })}
                                                    </span>
                                                )}
                                                {cacheCreationTokens !== undefined &&
                                                    cacheCreationTokens > 0 && (
                                                        <span
                                                            className="text-[10px] text-[var(--vscode-descriptionForeground)]"
                                                            title="Cache created"
                                                        >
                                                            C{" "}
                                                            {formatTokenCount(cacheCreationTokens, {
                                                                includeSuffix: false,
                                                            })}
                                                        </span>
                                                    )}
                                                {cacheReadTokens !== undefined &&
                                                    cacheReadTokens > 0 && (
                                                        <span
                                                            className="text-[10px] text-[var(--vscode-descriptionForeground)]"
                                                            title="Cache read"
                                                        >
                                                            R{" "}
                                                            {formatTokenCount(cacheReadTokens, {
                                                                includeSuffix: false,
                                                            })}
                                                        </span>
                                                    )}
                                                <span
                                                    className={`px-2 py-0.5 rounded-full border text-[10px] ${statusClass}`}
                                                >
                                                    {statusLabel}
                                                </span>
                                            </div>
                                        </div>

                                        {!stepCollapsed && (
                                            <div className="mt-3 space-y-3 pl-3">
                                                {step.toolUse &&
                                                step.toolUse.toolName === "TodoWrite" ? (
                                                    <TodoDisplay
                                                        todos={extractTodosFromInput(
                                                            step.toolUse.rawInput || {},
                                                        )}
                                                        title="Todo Update"
                                                    />
                                                ) : (
                                                    step.toolUse && (
                                                        <ToolUseCard
                                                            toolName={
                                                                step.toolUse.toolName || "Tool"
                                                            }
                                                            input={step.toolUse.rawInput || {}}
                                                            isExecuting={status === "executing"}
                                                            duration={step.toolUse.duration}
                                                            tokens={step.toolUse.tokens}
                                                            fileContentBefore={
                                                                step.toolUse.fileContentBefore
                                                            }
                                                            fileContentAfter={
                                                                step.toolUse.fileContentAfter
                                                            }
                                                            startLine={step.toolUse.startLine}
                                                            startLines={step.toolUse.startLines}
                                                            defaultCollapsed={true}
                                                        />
                                                    )
                                                )}

                                                {step.toolResult && !step.toolResult.hidden && (
                                                    <ToolResultCard
                                                        content={step.toolResult.content}
                                                        isError={step.toolResult.isError}
                                                        toolName={step.toolResult.toolName}
                                                        duration={step.toolResult.duration}
                                                        tokens={step.toolResult.tokens}
                                                        defaultCollapsed={true}
                                                    />
                                                )}

                                                {!step.toolResult && status === "executing" && (
                                                    <div className="text-xs text-[var(--vscode-descriptionForeground)]">
                                                        Awaiting result...
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityTimeline;
