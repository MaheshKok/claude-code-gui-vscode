/**
 * JourneyTimeline Utilities
 *
 * Helper functions for status calculation and formatting.
 *
 * @module components/Chat/JourneyTimeline/utils
 */

import type { TimelineItemTool, TimelinePlanGroup } from "./types";

/**
 * Format a timestamp for display (e.g., "2:30 PM")
 */
export const formatTimestamp = (date: Date): string => {
    return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    }).format(date);
};

/**
 * Usage data structure for formatting
 */
interface UsageData {
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
}

/**
 * Format usage summary for display
 */
export const formatUsageSummary = (usage?: UsageData): string | null => {
    if (!usage) {
        return null;
    }
    const totalTokens = usage.input_tokens + usage.output_tokens;
    const cacheCreated = usage.cache_creation_input_tokens || 0;
    const cacheRead = usage.cache_read_input_tokens || 0;

    if (totalTokens <= 0 && cacheCreated <= 0 && cacheRead <= 0) {
        return null;
    }

    const formatCount = (value: number) => value.toLocaleString();
    const parts = [`Tokens: ${formatCount(totalTokens)}`];
    if (cacheCreated > 0) {
        parts.push(`${formatCount(cacheCreated)} cache created`);
    }
    if (cacheRead > 0) {
        parts.push(`${formatCount(cacheRead)} cache read`);
    }
    return parts.join(" | ");
};

/**
 * Step totals structure for formatting
 */
interface StepTotals {
    tokens: number;
    cacheCreated: number;
    cacheRead: number;
    duration: number;
}

/**
 * Format step totals summary for display
 */
export const formatStepTotalsSummary = (totals: StepTotals): string | null => {
    if (totals.tokens <= 0 && totals.cacheCreated <= 0 && totals.cacheRead <= 0) {
        return null;
    }
    const formatCount = (value: number) => value.toLocaleString();
    const parts = [`Tokens: ${formatCount(totals.tokens)}`];
    if (totals.cacheCreated > 0) {
        parts.push(`${formatCount(totals.cacheCreated)} cache created`);
    }
    if (totals.cacheRead > 0) {
        parts.push(`${formatCount(totals.cacheRead)} cache read`);
    }
    return parts.join(" | ");
};

/**
 * Calculate step totals from an array of steps
 */
export const calculateStepTotals = (steps: TimelineItemTool[]): StepTotals => {
    return steps.reduce(
        (acc, step) => {
            const stepTokens = step.toolUse?.tokens ?? step.toolResult?.tokens ?? 0;
            const stepCacheCreated =
                step.toolUse?.cacheCreationTokens ?? step.toolResult?.cacheCreationTokens ?? 0;
            const stepCacheRead =
                step.toolUse?.cacheReadTokens ?? step.toolResult?.cacheReadTokens ?? 0;
            const stepDuration = step.toolUse?.duration ?? step.toolResult?.duration ?? 0;
            return {
                tokens: acc.tokens + stepTokens,
                cacheCreated: acc.cacheCreated + stepCacheCreated,
                cacheRead: acc.cacheRead + stepCacheRead,
                duration: acc.duration + stepDuration,
            };
        },
        { tokens: 0, cacheCreated: 0, cacheRead: 0, duration: 0 },
    );
};

/**
 * Get the status of a tool step
 */
export const getStepStatus = (step: TimelineItemTool): string => {
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

/**
 * Get the status of a plan group
 */
export const getGroupStatus = (group: TimelinePlanGroup, isProcessing: boolean): string => {
    if (group.assistant.isStreaming && isProcessing) {
        return "executing";
    }
    if (group.steps.length === 0) {
        return "completed";
    }
    const hasRunning = group.steps.some((step) => {
        const status = getStepStatus(step);
        return status === "executing" || status === "pending";
    });
    if (hasRunning) {
        return "executing";
    }
    const hasFailure = group.steps.some((step) => getStepStatus(step) === "failed");
    if (hasFailure) {
        return "failed";
    }
    return "completed";
};
