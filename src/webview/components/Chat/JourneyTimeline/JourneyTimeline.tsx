/**
 * JourneyTimeline Component
 *
 * Main timeline component that displays messages and tool executions.
 * Refactored to use extracted sub-components for better maintainability.
 *
 * @module components/Chat/JourneyTimeline
 */

import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import type { Message } from "../../App";
import { Message as MessageComponent } from "../Message";
import { EmptyState } from "./EmptyState";
import { ToolStep } from "./ToolStep";
import { PlanGroup } from "./PlanGroup";
import { getGroupStatus } from "./utils";
import type {
    TimelineItem,
    TimelineItemTool,
    TimelinePlanGroup,
    JourneyTimelineProps,
} from "./types";

/**
 * Build timeline items from messages
 */
function buildTimelineItems(messages: Message[]): TimelineItem[] {
    const timeline: TimelineItem[] = [];
    const orphanToolIndex = new Map<string, number>();
    let currentPlan: TimelinePlanGroup | null = null;
    let currentPlanSteps = new Map<string, TimelineItemTool>();

    const flushPlan = () => {
        if (currentPlan) {
            timeline.push(currentPlan);
            currentPlan = null;
            currentPlanSteps = new Map();
        }
    };

    const addToolToPlan = (message: Message): boolean => {
        if (!currentPlan) return false;
        const stepId = message.toolUseId || message.id;
        const existing = currentPlanSteps.get(stepId);

        if (message.messageType === "tool_use") {
            if (!existing) {
                const step: TimelineItemTool = {
                    kind: "tool",
                    id: stepId,
                    toolUse: message,
                    timestamp: message.timestamp,
                };
                currentPlanSteps.set(stepId, step);
                currentPlan.steps.push(step);
            } else {
                existing.toolUse = message;
            }
            return true;
        }

        if (message.hidden) return true;

        if (!existing) {
            const step: TimelineItemTool = {
                kind: "tool",
                id: stepId,
                toolResult: message,
                timestamp: message.timestamp,
            };
            currentPlanSteps.set(stepId, step);
            currentPlan.steps.push(step);
        } else {
            existing.toolResult = message;
        }
        return true;
    };

    const addOrphanTool = (message: Message) => {
        const stepId = message.toolUseId || message.id;
        const existingIndex = orphanToolIndex.get(stepId);

        if (message.messageType === "tool_use") {
            if (existingIndex === undefined) {
                const step: TimelineItemTool = {
                    kind: "tool",
                    id: stepId,
                    toolUse: message,
                    timestamp: message.timestamp,
                };
                orphanToolIndex.set(stepId, timeline.length);
                timeline.push(step);
            } else {
                const item = timeline[existingIndex];
                if (item && item.kind === "tool") item.toolUse = message;
            }
            return;
        }

        if (message.hidden) return;

        if (existingIndex === undefined) {
            const step: TimelineItemTool = {
                kind: "tool",
                id: stepId,
                toolResult: message,
                timestamp: message.timestamp,
            };
            orphanToolIndex.set(stepId, timeline.length);
            timeline.push(step);
        } else {
            const item = timeline[existingIndex];
            if (item && item.kind === "tool") item.toolResult = message;
        }
    };

    messages.forEach((message) => {
        if (message.role === "assistant") {
            flushPlan();
            currentPlan = {
                kind: "plan",
                id: message.id,
                assistant: message,
                steps: [],
                timestamp: message.timestamp,
            };
            return;
        }
        if (
            message.role === "tool" &&
            (message.messageType === "tool_use" || message.messageType === "tool_result")
        ) {
            if (!addToolToPlan(message)) addOrphanTool(message);
            return;
        }
        flushPlan();
        timeline.push({ kind: "message", message });
    });
    flushPlan();

    return timeline;
}

/**
 * Main JourneyTimeline component
 */
export const JourneyTimeline: React.FC<JourneyTimelineProps> = ({
    messages,
    isProcessing,
    showEmptyState = true,
    onAction,
}) => {
    const [collapsedPlans, setCollapsedPlans] = useState<Record<string, boolean>>({});
    const [collapsedSteps, setCollapsedSteps] = useState<Record<string, boolean>>({});
    const [copiedPlanId, setCopiedPlanId] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    const items = useMemo<TimelineItem[]>(() => buildTimelineItems(messages), [messages]);
    const lastAssistantId = useMemo(() => {
        for (let i = messages.length - 1; i >= 0; i -= 1) {
            if (messages[i].role === "assistant") {
                return messages[i].id;
            }
        }
        return null;
    }, [messages]);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [items, isProcessing]);

    const togglePlan = useCallback((id: string, isOpen: boolean) => {
        setCollapsedPlans((prev) => ({ ...prev, [id]: isOpen }));
    }, []);

    const toggleStep = useCallback((id: string, isExecuting: boolean) => {
        setCollapsedSteps((prev) => ({
            ...prev,
            [id]: !(prev[id] ?? !isExecuting),
        }));
    }, []);

    const handleCopyPlan = useCallback(
        async (event: React.MouseEvent, id: string, content: string) => {
            event.stopPropagation();
            try {
                await navigator.clipboard.writeText(content);
                setCopiedPlanId(id);
                setTimeout(() => setCopiedPlanId(null), 2000);
            } catch (error) {
                console.error("Failed to copy response:", error);
            }
        },
        [],
    );

    if (items.length === 0 && showEmptyState) {
        return <EmptyState onAction={onAction} />;
    }

    return (
        <div className="px-4 py-1 space-y-2 max-w-4xl mx-auto pb-4">
            {items.map((item) => {
                if (item.kind === "message") {
                    return (
                        <MessageComponent
                            key={item.message.id}
                            message={item.message}
                            showPreview={item.message.id === lastAssistantId}
                        />
                    );
                }

                if (item.kind === "tool") {
                    return (
                        <ToolStep
                            key={item.id}
                            step={item}
                            collapsedSteps={collapsedSteps}
                            onToggleStep={toggleStep}
                        />
                    );
                }

                const groupStatus = getGroupStatus(item, isProcessing);
                const isActive = groupStatus === "executing";
                const isPlanOpen =
                    collapsedPlans[item.id] === undefined ? isActive : !collapsedPlans[item.id];

                return (
                    <PlanGroup
                        key={item.id}
                        item={item}
                        isProcessing={isProcessing}
                        isPlanOpen={isPlanOpen}
                        showActions={item.assistant.id === lastAssistantId}
                        copiedPlanId={copiedPlanId}
                        collapsedSteps={collapsedSteps}
                        onTogglePlan={togglePlan}
                        onToggleStep={toggleStep}
                        onCopyPlan={handleCopyPlan}
                    />
                );
            })}

            <div ref={bottomRef} className="h-4" />
        </div>
    );
};

export default JourneyTimeline;
