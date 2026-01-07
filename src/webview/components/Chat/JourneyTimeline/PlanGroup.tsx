/**
 * PlanGroup Component
 *
 * Renders a plan group with assistant message and tool steps.
 *
 * @module components/Chat/JourneyTimeline/PlanGroup
 */

import React, { useCallback } from "react";
import { ChevronRight, Copy, Check, Eye, Clock } from "lucide-react";
import { StatusIcon } from "./StatusIcon";
import { CollapsibleReasoning } from "./CollapsibleReasoning";
import { ToolStep } from "./ToolStep";
import {
    getGroupStatus,
    getStepStatus,
    calculateStepTotals,
    formatStepTotalsSummary,
    formatUsageSummary,
} from "./utils";
import type { PlanGroupProps } from "./types";
import { looksLikeMarkdown, formatDuration } from "../../../utils";
import { useVSCode } from "../../../hooks/useVSCode";

/**
 * Renders a plan group with collapsible content
 */
export const PlanGroup: React.FC<PlanGroupProps> = ({
    item,
    isProcessing,
    isPlanOpen,
    showActions,
    copiedPlanId,
    collapsedSteps,
    onTogglePlan,
    onToggleStep,
    onCopyPlan,
}) => {
    const { postMessage } = useVSCode();
    const groupStatus = getGroupStatus(item, isProcessing);
    const isActive = groupStatus === "executing";
    const showPreview =
        showActions && Boolean(item.assistant.content) && looksLikeMarkdown(item.assistant.content);
    const completedCount = item.steps.filter((step) => getStepStatus(step) === "completed").length;
    const stepTotals = calculateStepTotals(item.steps);
    const stepTotalsSummary = formatStepTotalsSummary(stepTotals);
    const usageSummary = stepTotalsSummary ?? formatUsageSummary(item.assistant.usage);
    const showStepsSection = item.steps.length > 0 || isActive;

    const handlePreview = useCallback(
        (event: React.MouseEvent) => {
            event.stopPropagation();
            if (!item.assistant.content || !showPreview) return;
            postMessage({
                type: "openMarkdownPreview",
                content: item.assistant.content,
                title: "Assistant Response",
            });
        },
        [item.assistant.content, postMessage, showPreview],
    );

    return (
        <div className="glass rounded-xl border border-white/10 overflow-hidden shadow-sm transition-all hover:border-white/20">
            <div
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isActive ? "bg-orange-500/5" : "hover:bg-white/5"}`}
                onClick={() => onTogglePlan(item.id, isPlanOpen)}
            >
                <ChevronRight
                    className={`w-4 h-4 text-white/40 transition-transform duration-200 ${isPlanOpen ? "rotate-90" : ""}`}
                />

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/90 truncate">
                        {item.assistant.content || "Claude plan"}
                    </p>
                </div>

                <div className="flex items-center gap-3 text-xs">
                    {stepTotals.duration > 0 && (
                        <div className="flex items-center gap-1 text-white/40 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                            <Clock className="w-3 h-3" />
                            <span>
                                {formatDuration(stepTotals.duration, { abbreviated: true })}
                            </span>
                        </div>
                    )}
                    <div className="text-white/40 font-medium px-1">
                        {completedCount}/{item.steps.length}
                    </div>
                    {showPreview && (
                        <button
                            className="flex items-center gap-1 px-2 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] text-white/50 hover:text-white transition-colors"
                            onClick={handlePreview}
                            title="Open markdown preview"
                        >
                            <Eye className="w-3 h-3" />
                            <span>Preview</span>
                        </button>
                    )}
                    {showActions && item.assistant.content && (
                        <button
                            className="flex items-center gap-1 px-2 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] text-white/50 hover:text-white transition-colors"
                            onClick={(event) => onCopyPlan(event, item.id, item.assistant.content)}
                            title="Copy response"
                        >
                            {copiedPlanId === item.id ? (
                                <>
                                    <Check className="w-3 h-3 text-green-400" />
                                    <span className="text-green-400">Copied</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                </>
                            )}
                        </button>
                    )}
                    <StatusIcon status={groupStatus} className="w-4 h-4" />
                </div>
            </div>

            {isPlanOpen && (
                <div className="bg-black/10 border-t border-white/5 p-4 space-y-3 max-h-[500px] overflow-y-auto">
                    {item.assistant.content && (
                        <div
                            className={
                                showStepsSection ? "mb-4 pb-4 border-b border-white/5" : "mb-2"
                            }
                        >
                            <CollapsibleReasoning content={item.assistant.content} />
                        </div>
                    )}
                    {item.steps.length > 0 ? (
                        item.steps.map((step) => (
                            <ToolStep
                                key={step.id}
                                step={step}
                                collapsedSteps={collapsedSteps}
                                onToggleStep={onToggleStep}
                            />
                        ))
                    ) : isActive ? (
                        <div className="text-center py-4 text-white/30 text-sm italic">
                            Reasoning about the next step...
                        </div>
                    ) : null}
                    {usageSummary && (
                        <div className="pt-2 mt-2 border-t border-white/5 text-[11px] text-white/50 text-right">
                            {usageSummary}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PlanGroup;
