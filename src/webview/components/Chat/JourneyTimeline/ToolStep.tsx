/**
 * ToolStep Component
 *
 * Renders a single tool step in the timeline with collapsible details.
 *
 * @module components/Chat/JourneyTimeline/ToolStep
 */

import React from "react";
import { Clock, ChevronRight, Zap, CheckCircle2 } from "lucide-react";
import { TodoDisplay, ToolUseCard, ToolResultCard } from "../../Tools";
import { getToolIcon } from "../../Common";
import {
    extractTodosFromInput,
    formatDuration,
    formatTokensCompact,
    getToolSummary,
} from "../../../utils";
import { STATUS_LABELS, STATUS_CLASSES } from "./constants";
import { getStepStatus } from "./utils";
import type { ToolStepProps } from "./types";

/**
 * Renders a tool step with header and collapsible content
 */
export const ToolStep: React.FC<ToolStepProps> = ({
    step,
    forceExpanded,
    collapsedSteps,
    onToggleStep,
}) => {
    const status = getStepStatus(step);
    const statusLabel = STATUS_LABELS[status] || status;
    const statusClass = STATUS_CLASSES[status] || STATUS_CLASSES.pending;
    const toolName = step.toolUse?.toolName || step.toolResult?.toolName || "Tool";
    const rawInput = step.toolUse?.rawInput || step.toolResult?.rawInput || {};
    const toolSummary = getToolSummary(toolName, rawInput, 35);
    const duration = step.toolUse?.duration ?? step.toolResult?.duration;
    const tokens = step.toolUse?.tokens ?? step.toolResult?.tokens;
    const isCollapsed = forceExpanded
        ? false
        : (collapsedSteps[step.id] ?? (status === "executing" ? false : true));

    // TodoWrite specific logic
    const isTodoWrite = toolName === "TodoWrite";
    const todos = isTodoWrite ? extractTodosFromInput(rawInput) : [];

    // Define minimal interface to avoid any
    interface TodoItem {
        status: "completed" | "in_progress" | "pending";
    }

    const todoStats = isTodoWrite
        ? {
              total: todos.length,
              completed: todos.filter((t: TodoItem) => t.status === "completed").length,
              inProgress: todos.filter((t: TodoItem) => t.status === "in_progress").length,
              pending: todos.filter((t: TodoItem) => t.status === "pending").length,
          }
        : null;

    const progressPercent =
        todoStats && todoStats.total > 0
            ? Math.round((todoStats.completed / todoStats.total) * 100)
            : 0;

    return (
        <div
            key={step.id}
            className="glass-panel rounded-lg overflow-hidden transition-all duration-300 hover:border-white/20 hover:shadow-lg"
        >
            {/* Header */}
            <div
                className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-white/5 transition-colors group"
                onClick={() => onToggleStep(step.id, status === "executing")}
            >
                <ChevronRight
                    className={`w-4 h-4 text-white/40 transition-transform duration-200 flex-shrink-0 group-hover:text-white/60 ${isCollapsed ? "" : "rotate-90"}`}
                />

                <div className="text-orange-400 opacity-80 flex-shrink-0 group-hover:opacity-100 transition-opacity">
                    {getToolIcon(toolName)}
                </div>

                <span className="font-medium text-sm text-white/90">{toolName}</span>

                {/* Tool Summary - shown for all tools except TodoWrite which has special stats */}
                {!isTodoWrite && toolSummary && (
                    <span
                        className="text-xs text-white/50 truncate max-w-[180px] font-mono opacity-60 group-hover:opacity-100 transition-opacity"
                        title={toolSummary}
                    >
                        {toolSummary}
                    </span>
                )}

                {/* Common Stats Area - shown for all tools */}
                <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                    {/* TodoWrite specific stats */}
                    {isTodoWrite && todoStats && (
                        <div className="flex items-center gap-3 text-xs">
                            <div className="flex items-center justify-between px-4 py-2 bg-white/5 text-[10px] text-white/40 font-medium uppercase tracking-wider">
                                <div className="flex gap-4">
                                    <span
                                        className={todoStats.completed > 0 ? "text-green-400" : ""}
                                    >
                                        {todoStats.completed} Done
                                    </span>
                                    <span
                                        className={todoStats.inProgress > 0 ? "text-blue-400" : ""}
                                    >
                                        {todoStats.inProgress} Active
                                    </span>
                                    <span
                                        className={todoStats.pending > 0 ? "text-orange-400" : ""}
                                    >
                                        {todoStats.pending} Pending
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                                <span className="text-white/60">
                                    {todoStats.completed}/{todoStats.total}
                                </span>
                            </div>

                            <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 transition-all duration-500"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Duration badge - shown for all tools */}
                    {duration !== undefined && (
                        <span className="flex items-center gap-1 text-xs text-white/40 bg-white/5 px-1.5 py-0.5 rounded font-mono">
                            <Clock className="w-3 h-3" />
                            {formatDuration(duration, { abbreviated: true })}
                        </span>
                    )}

                    {/* Tokens badge - shown for all tools */}
                    {tokens !== undefined && (
                        <span className="hidden sm:flex items-center gap-1 text-xs text-white/40 bg-white/5 px-1.5 py-0.5 rounded font-mono">
                            <Zap className="w-3 h-3" />
                            {formatTokensCompact(tokens)}
                        </span>
                    )}

                    {/* Status indicator - shown for all tools */}
                    {status === "executing" ? (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-orange-500/10 rounded-full">
                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" />
                            <span className="text-xs text-orange-400 font-medium">Running</span>
                        </div>
                    ) : status === "completed" ? (
                        <div className={`w-5 h-5 flex items-center justify-center`}>
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                        </div>
                    ) : (
                        <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusClass}`}
                        >
                            {statusLabel}
                        </span>
                    )}
                </div>
            </div>

            {/* Expanded Content */}
            {!isCollapsed && (
                <div className="border-t border-white/5 bg-black/20 animate-slide-up p-3 space-y-3">
                    {/* TodoWrite special handling */}
                    {step.toolUse && toolName === "TodoWrite" ? (
                        <TodoDisplay
                            todos={extractTodosFromInput(step.toolUse.rawInput || {})}
                            title="Todo Update"
                            defaultCollapsed={false}
                            hideHeader={true}
                        />
                    ) : (
                        <div className="space-y-4">
                            {/* Tool Use Section */}
                            {step.toolUse && (
                                <ToolUseCard
                                    toolName={toolName}
                                    input={rawInput}
                                    isExecuting={status === "executing"}
                                    duration={step.toolUse.duration}
                                    tokens={step.toolUse.tokens}
                                    defaultCollapsed={false}
                                    fileContentBefore={step.toolUse.fileContentBefore}
                                    fileContentAfter={step.toolUse.fileContentAfter}
                                    startLine={step.toolUse.startLine}
                                    startLines={step.toolUse.startLines}
                                    variant="embedded"
                                    label="Input"
                                />
                            )}

                            {/* Divider if both exist */}
                            {step.toolUse && step.toolResult && (
                                <div className="h-px bg-white/5 w-full" />
                            )}

                            {/* Tool Result Section */}
                            {step.toolResult && step.toolResult.content && (
                                <ToolResultCard
                                    content={step.toolResult.content}
                                    isError={step.toolResult.isError}
                                    toolName={toolName}
                                    duration={step.toolResult.duration}
                                    tokens={step.toolResult.tokens}
                                    defaultCollapsed={false}
                                    variant="embedded"
                                    label="Output"
                                />
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ToolStep;
