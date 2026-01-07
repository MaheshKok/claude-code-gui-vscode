import { describe, it, expect } from "vitest";
import {
    formatTimestamp,
    formatUsageSummary,
    formatStepTotalsSummary,
    calculateStepTotals,
    getStepStatus,
    getGroupStatus,
} from "../../webview/components/Chat/JourneyTimeline/utils";
import type {
    TimelineItemTool,
    TimelinePlanGroup,
} from "../../webview/components/Chat/JourneyTimeline/types";

describe("JourneyTimeline Utils", () => {
    describe("formatTimestamp", () => {
        it("should format timestamp in 12-hour format", () => {
            const date = new Date("2024-01-15T14:30:00");
            const result = formatTimestamp(date);

            expect(result).toContain(":");
            expect(result).toMatch(/\d+:\d{2}\s*(AM|PM)/i);
        });

        it("should format morning times correctly", () => {
            const date = new Date("2024-01-15T09:15:00");
            const result = formatTimestamp(date);

            expect(result).toContain("9:15");
            expect(result).toContain("AM");
        });

        it("should format evening times correctly", () => {
            const date = new Date("2024-01-15T21:45:00");
            const result = formatTimestamp(date);

            expect(result).toContain("9:45");
            expect(result).toContain("PM");
        });
    });

    describe("formatUsageSummary", () => {
        it("should return null when usage is undefined", () => {
            const result = formatUsageSummary(undefined);

            expect(result).toBeNull();
        });

        it("should return null when all values are zero", () => {
            const result = formatUsageSummary({
                input_tokens: 0,
                output_tokens: 0,
            });

            expect(result).toBeNull();
        });

        it("should format basic token usage", () => {
            const result = formatUsageSummary({
                input_tokens: 1000,
                output_tokens: 500,
            });

            expect(result).toBe("Tokens: 1,500");
        });

        it("should include cache creation tokens", () => {
            const result = formatUsageSummary({
                input_tokens: 1000,
                output_tokens: 500,
                cache_creation_input_tokens: 200,
            });

            expect(result).toContain("Tokens: 1,500");
            expect(result).toContain("200 cache created");
        });

        it("should include cache read tokens", () => {
            const result = formatUsageSummary({
                input_tokens: 1000,
                output_tokens: 500,
                cache_read_input_tokens: 300,
            });

            expect(result).toContain("Tokens: 1,500");
            expect(result).toContain("300 cache read");
        });

        it("should include both cache creation and read tokens", () => {
            const result = formatUsageSummary({
                input_tokens: 1000,
                output_tokens: 500,
                cache_creation_input_tokens: 200,
                cache_read_input_tokens: 300,
            });

            expect(result).toContain("Tokens: 1,500");
            expect(result).toContain("200 cache created");
            expect(result).toContain("300 cache read");
        });
    });

    describe("formatStepTotalsSummary", () => {
        it("should return null when all values are zero", () => {
            const result = formatStepTotalsSummary({
                tokens: 0,
                cacheCreated: 0,
                cacheRead: 0,
            });

            expect(result).toBeNull();
        });

        it("should format tokens only", () => {
            const result = formatStepTotalsSummary({
                tokens: 2500,
                cacheCreated: 0,
                cacheRead: 0,
            });

            expect(result).toBe("Tokens: 2,500");
        });

        it("should format with cache created", () => {
            const result = formatStepTotalsSummary({
                tokens: 1000,
                cacheCreated: 500,
                cacheRead: 0,
            });

            expect(result).toContain("Tokens: 1,000");
            expect(result).toContain("500 cache created");
        });

        it("should format with cache read", () => {
            const result = formatStepTotalsSummary({
                tokens: 1000,
                cacheCreated: 0,
                cacheRead: 250,
            });

            expect(result).toContain("Tokens: 1,000");
            expect(result).toContain("250 cache read");
        });

        it("should format with all values", () => {
            const result = formatStepTotalsSummary({
                tokens: 1000,
                cacheCreated: 500,
                cacheRead: 250,
            });

            expect(result).toContain("Tokens: 1,000");
            expect(result).toContain("500 cache created");
            expect(result).toContain("250 cache read");
        });
    });

    describe("calculateStepTotals", () => {
        it("should return zeros for empty array", () => {
            const result = calculateStepTotals([]);

            expect(result).toEqual({
                tokens: 0,
                cacheCreated: 0,
                cacheRead: 0,
                duration: 0,
            });
        });

        it("should sum tokens from toolUse", () => {
            const steps: TimelineItemTool[] = [
                {
                    kind: "tool",
                    id: "step-1",
                    timestamp: new Date(),
                    toolUse: {
                        uuid: "use-1",
                        type: "tool_use",
                        timestamp: new Date(),
                        toolName: "Read",
                        tokens: 500,
                    },
                },
                {
                    kind: "tool",
                    id: "step-2",
                    timestamp: new Date(),
                    toolUse: {
                        uuid: "use-2",
                        type: "tool_use",
                        timestamp: new Date(),
                        toolName: "Write",
                        tokens: 300,
                    },
                },
            ];

            const result = calculateStepTotals(steps);

            expect(result.tokens).toBe(800);
        });

        it("should sum cache tokens", () => {
            const steps: TimelineItemTool[] = [
                {
                    kind: "tool",
                    id: "step-1",
                    timestamp: new Date(),
                    toolUse: {
                        uuid: "use-1",
                        type: "tool_use",
                        timestamp: new Date(),
                        toolName: "Read",
                        cacheCreationTokens: 100,
                        cacheReadTokens: 50,
                    },
                },
                {
                    kind: "tool",
                    id: "step-2",
                    timestamp: new Date(),
                    toolResult: {
                        uuid: "result-2",
                        type: "tool_result",
                        timestamp: new Date(),
                        toolName: "Write",
                        content: "Done",
                        cacheCreationTokens: 200,
                        cacheReadTokens: 75,
                    },
                },
            ];

            const result = calculateStepTotals(steps);

            expect(result.cacheCreated).toBe(300);
            expect(result.cacheRead).toBe(125);
        });

        it("should prefer toolUse values over toolResult", () => {
            const steps: TimelineItemTool[] = [
                {
                    kind: "tool",
                    id: "step-1",
                    timestamp: new Date(),
                    toolUse: {
                        uuid: "use-1",
                        type: "tool_use",
                        timestamp: new Date(),
                        toolName: "Read",
                        tokens: 500,
                    },
                    toolResult: {
                        uuid: "result-1",
                        type: "tool_result",
                        timestamp: new Date(),
                        toolName: "Read",
                        content: "Done",
                        tokens: 300,
                    },
                },
            ];

            const result = calculateStepTotals(steps);

            expect(result.tokens).toBe(500); // Should use toolUse value
        });
    });

    describe("getStepStatus", () => {
        it("should return toolUse status if present", () => {
            const step: TimelineItemTool = {
                kind: "tool",
                id: "step-1",
                timestamp: new Date(),
                toolUse: {
                    uuid: "use-1",
                    type: "tool_use",
                    timestamp: new Date(),
                    toolName: "Read",
                    status: "executing",
                },
            };

            expect(getStepStatus(step)).toBe("executing");
        });

        it("should return failed if toolResult has error", () => {
            const step: TimelineItemTool = {
                kind: "tool",
                id: "step-1",
                timestamp: new Date(),
                toolUse: {
                    uuid: "use-1",
                    type: "tool_use",
                    timestamp: new Date(),
                    toolName: "Read",
                },
                toolResult: {
                    uuid: "result-1",
                    type: "tool_result",
                    timestamp: new Date(),
                    toolName: "Read",
                    content: "Error",
                    isError: true,
                },
            };

            expect(getStepStatus(step)).toBe("failed");
        });

        it("should return completed if toolResult exists without error", () => {
            const step: TimelineItemTool = {
                kind: "tool",
                id: "step-1",
                timestamp: new Date(),
                toolUse: {
                    uuid: "use-1",
                    type: "tool_use",
                    timestamp: new Date(),
                    toolName: "Read",
                },
                toolResult: {
                    uuid: "result-1",
                    type: "tool_result",
                    timestamp: new Date(),
                    toolName: "Read",
                    content: "Success",
                    isError: false,
                },
            };

            expect(getStepStatus(step)).toBe("completed");
        });

        it("should return pending if no result", () => {
            const step: TimelineItemTool = {
                kind: "tool",
                id: "step-1",
                timestamp: new Date(),
                toolUse: {
                    uuid: "use-1",
                    type: "tool_use",
                    timestamp: new Date(),
                    toolName: "Read",
                },
            };

            expect(getStepStatus(step)).toBe("pending");
        });
    });

    describe("getGroupStatus", () => {
        const createGroup = (
            steps: TimelineItemTool[],
            isStreaming = false,
        ): TimelinePlanGroup => ({
            kind: "plan",
            id: "plan-1",
            timestamp: new Date(),
            assistant: {
                uuid: "assistant-1",
                type: "assistant",
                timestamp: new Date(),
                content: "Planning",
                isStreaming,
            },
            steps,
        });

        it("should return executing if streaming and processing", () => {
            const group = createGroup([], true);

            expect(getGroupStatus(group, true)).toBe("executing");
        });

        it("should return completed if no steps", () => {
            const group = createGroup([]);

            expect(getGroupStatus(group, false)).toBe("completed");
        });

        it("should return executing if any step is pending", () => {
            const steps: TimelineItemTool[] = [
                {
                    kind: "tool",
                    id: "step-1",
                    timestamp: new Date(),
                    toolUse: {
                        uuid: "use-1",
                        type: "tool_use",
                        timestamp: new Date(),
                        toolName: "Read",
                    },
                },
            ];
            const group = createGroup(steps);

            expect(getGroupStatus(group, false)).toBe("executing");
        });

        it("should return failed if any step failed", () => {
            const steps: TimelineItemTool[] = [
                {
                    kind: "tool",
                    id: "step-1",
                    timestamp: new Date(),
                    toolUse: {
                        uuid: "use-1",
                        type: "tool_use",
                        timestamp: new Date(),
                        toolName: "Read",
                    },
                    toolResult: {
                        uuid: "result-1",
                        type: "tool_result",
                        timestamp: new Date(),
                        toolName: "Read",
                        content: "Error",
                        isError: true,
                    },
                },
            ];
            const group = createGroup(steps);

            expect(getGroupStatus(group, false)).toBe("failed");
        });

        it("should return completed if all steps completed", () => {
            const steps: TimelineItemTool[] = [
                {
                    kind: "tool",
                    id: "step-1",
                    timestamp: new Date(),
                    toolUse: {
                        uuid: "use-1",
                        type: "tool_use",
                        timestamp: new Date(),
                        toolName: "Read",
                    },
                    toolResult: {
                        uuid: "result-1",
                        type: "tool_result",
                        timestamp: new Date(),
                        toolName: "Read",
                        content: "Done",
                        isError: false,
                    },
                },
            ];
            const group = createGroup(steps);

            expect(getGroupStatus(group, false)).toBe("completed");
        });
    });
});
