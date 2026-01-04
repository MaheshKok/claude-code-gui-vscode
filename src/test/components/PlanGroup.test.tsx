import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PlanGroup } from "../../webview/components/Chat/JourneyTimeline/PlanGroup";
import type { TimelinePlanGroup } from "../../webview/components/Chat/JourneyTimeline/types";

// Mock child components
vi.mock("../../webview/components/Chat/JourneyTimeline/StatusIcon", () => ({
    StatusIcon: ({ status }: { status: string }) => <span data-testid="status-icon">{status}</span>,
}));

vi.mock("../../webview/components/Chat/JourneyTimeline/CollapsibleReasoning", () => ({
    CollapsibleReasoning: ({ content }: { content: string }) => (
        <div data-testid="collapsible-reasoning">{content}</div>
    ),
}));

vi.mock("../../webview/components/Chat/JourneyTimeline/ToolStep", () => ({
    ToolStep: ({ step }: { step: { id: string } }) => (
        <div data-testid={`tool-step-${step.id}`}>Tool Step</div>
    ),
}));

// Mock useVSCode hook
const mockPostMessage = vi.fn();
vi.mock("../../webview/hooks/useVSCode", () => ({
    useVSCode: () => ({
        postMessage: mockPostMessage,
    }),
}));

// Mock clipboard
const mockClipboard = {
    writeText: vi.fn().mockResolvedValue(undefined),
};
Object.assign(navigator, { clipboard: mockClipboard });

describe("PlanGroup", () => {
    const createMockPlanGroup = (
        overrides: Partial<TimelinePlanGroup> = {},
    ): TimelinePlanGroup => ({
        kind: "plan",
        id: "plan-1",
        timestamp: new Date(),
        assistant: {
            uuid: "assistant-1",
            type: "assistant",
            timestamp: new Date(),
            content: "Planning to read the file and analyze its contents",
            usage: {
                input_tokens: 100,
                output_tokens: 50,
            },
        },
        steps: [
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
                    content: "File content",
                },
            },
        ],
        ...overrides,
    });

    const defaultProps = {
        item: createMockPlanGroup(),
        isProcessing: false,
        isPlanOpen: false,
        showActions: true,
        copiedPlanId: null,
        collapsedSteps: {},
        onTogglePlan: vi.fn(),
        onToggleStep: vi.fn(),
        onCopyPlan: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("rendering", () => {
        it("should render plan header with content", () => {
            render(<PlanGroup {...defaultProps} />);

            expect(
                screen.getByText("Planning to read the file and analyze its contents"),
            ).toBeInTheDocument();
        });

        it("should show step count", () => {
            render(<PlanGroup {...defaultProps} />);

            // Shows completed/total format
            expect(screen.getByText("1/1")).toBeInTheDocument();
        });

        it("should render status icon", () => {
            render(<PlanGroup {...defaultProps} />);

            expect(screen.getByTestId("status-icon")).toBeInTheDocument();
        });

        it("should show default text when no content", () => {
            const item = createMockPlanGroup({
                assistant: {
                    uuid: "assistant-1",
                    type: "assistant",
                    timestamp: new Date(),
                    content: "",
                },
            });

            render(<PlanGroup {...defaultProps} item={item} />);

            expect(screen.getByText("Claude plan")).toBeInTheDocument();
        });
    });

    describe("toggle behavior", () => {
        it("should call onTogglePlan when header clicked", () => {
            const onTogglePlan = vi.fn();
            render(<PlanGroup {...defaultProps} onTogglePlan={onTogglePlan} />);

            fireEvent.click(screen.getByText("Planning to read the file and analyze its contents"));

            expect(onTogglePlan).toHaveBeenCalledWith("plan-1", false);
        });

        it("should rotate chevron when open", () => {
            const { container } = render(<PlanGroup {...defaultProps} isPlanOpen={true} />);

            const chevron = container.querySelector("svg.lucide-chevron-right");
            expect(chevron?.classList.contains("rotate-90")).toBe(true);
        });
    });

    describe("expanded content", () => {
        it("should show collapsible reasoning when open", () => {
            render(<PlanGroup {...defaultProps} isPlanOpen={true} />);

            expect(screen.getByTestId("collapsible-reasoning")).toBeInTheDocument();
        });

        it("should show tool steps when open", () => {
            render(<PlanGroup {...defaultProps} isPlanOpen={true} />);

            expect(screen.getByTestId("tool-step-step-1")).toBeInTheDocument();
        });

        it("should show reasoning message when processing with no steps", () => {
            const item = createMockPlanGroup({
                steps: [],
                assistant: {
                    uuid: "assistant-1",
                    type: "assistant",
                    timestamp: new Date(),
                    content: "Planning",
                    isStreaming: true,
                },
            });

            render(
                <PlanGroup {...defaultProps} item={item} isProcessing={true} isPlanOpen={true} />,
            );

            expect(screen.getByText(/Reasoning about the next step/)).toBeInTheDocument();
        });
    });

    describe("copy functionality", () => {
        it("should show copy button when showActions is true", () => {
            render(<PlanGroup {...defaultProps} showActions={true} />);

            expect(screen.getByTitle("Copy response")).toBeInTheDocument();
        });

        it("should not show copy button when showActions is false", () => {
            render(<PlanGroup {...defaultProps} showActions={false} />);

            expect(screen.queryByTitle("Copy response")).not.toBeInTheDocument();
        });

        it("should call onCopyPlan when copy button clicked", () => {
            const onCopyPlan = vi.fn();
            render(<PlanGroup {...defaultProps} onCopyPlan={onCopyPlan} />);

            fireEvent.click(screen.getByTitle("Copy response"));

            expect(onCopyPlan).toHaveBeenCalled();
        });

        it("should show Copied when copiedPlanId matches", () => {
            render(<PlanGroup {...defaultProps} copiedPlanId="plan-1" />);

            expect(screen.getByText("Copied")).toBeInTheDocument();
        });
    });

    describe("preview functionality", () => {
        it("should show preview button for markdown content", () => {
            const item = createMockPlanGroup({
                assistant: {
                    uuid: "assistant-1",
                    type: "assistant",
                    timestamp: new Date(),
                    content: "# Heading\n\n- List item",
                },
            });

            render(<PlanGroup {...defaultProps} item={item} showActions={true} />);

            expect(screen.getByText("Preview")).toBeInTheDocument();
        });

        it("should call postMessage when preview clicked", () => {
            const item = createMockPlanGroup({
                assistant: {
                    uuid: "assistant-1",
                    type: "assistant",
                    timestamp: new Date(),
                    content: "# Heading\n\n- List item",
                },
            });

            render(<PlanGroup {...defaultProps} item={item} showActions={true} />);

            fireEvent.click(screen.getByText("Preview"));

            expect(mockPostMessage).toHaveBeenCalledWith({
                type: "openMarkdownPreview",
                content: "# Heading\n\n- List item",
                title: "Assistant Response",
            });
        });
    });

    describe("status calculation", () => {
        it("should show executing status when streaming and processing", () => {
            const item = createMockPlanGroup({
                assistant: {
                    uuid: "assistant-1",
                    type: "assistant",
                    timestamp: new Date(),
                    content: "Planning",
                    isStreaming: true,
                },
                steps: [],
            });

            render(<PlanGroup {...defaultProps} item={item} isProcessing={true} />);

            expect(screen.getByTestId("status-icon")).toHaveTextContent("executing");
        });

        it("should show completed status when all steps done", () => {
            render(<PlanGroup {...defaultProps} isProcessing={false} />);

            expect(screen.getByTestId("status-icon")).toHaveTextContent("completed");
        });
    });
});
