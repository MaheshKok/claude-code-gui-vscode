import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToolStep } from "../../webview/components/Chat/JourneyTimeline/ToolStep";
import type { TimelineItemTool } from "../../webview/components/Chat/JourneyTimeline/types";

// Mock child components
vi.mock("../../webview/components/Tools", () => ({
    TodoDisplay: ({ title }: { title: string }) => <div data-testid="todo-display">{title}</div>,
    ToolUseCard: ({ toolName }: { toolName: string }) => (
        <div data-testid="tool-use-card">{toolName}</div>
    ),
    ToolResultCard: ({ content }: { content: string }) => (
        <div data-testid="tool-result-card">{content}</div>
    ),
}));

vi.mock("../../webview/components/Common", () => ({
    getToolIcon: (name: string) => <span data-testid="tool-icon">{name}-icon</span>,
}));

describe("ToolStep", () => {
    const createMockStep = (overrides: Partial<TimelineItemTool> = {}): TimelineItemTool => ({
        kind: "tool",
        id: "step-1",
        timestamp: new Date(),
        toolUse: {
            uuid: "use-1",
            type: "tool_use",
            timestamp: new Date(),
            toolName: "Read",
            rawInput: { file_path: "/test/file.ts" },
        },
        toolResult: {
            uuid: "result-1",
            type: "tool_result",
            timestamp: new Date(),
            toolName: "Read",
            content: "File content here",
            isError: false,
        },
        ...overrides,
    });

    const defaultProps = {
        step: createMockStep(),
        collapsedSteps: {},
        onToggleStep: vi.fn(),
    };

    describe("rendering", () => {
        it("should render tool name in header", () => {
            render(<ToolStep {...defaultProps} />);

            // The tool name appears as a span with class "font-medium"
            const toolNames = screen.getAllByText("Read");
            expect(toolNames.length).toBeGreaterThan(0);
        });

        it("should render tool icon", () => {
            render(<ToolStep {...defaultProps} />);

            expect(screen.getByTestId("tool-icon")).toBeInTheDocument();
        });

        it("should show tool summary with file path", () => {
            render(<ToolStep {...defaultProps} />);

            // The tool summary includes file path
            expect(screen.getByText(/file\.ts/)).toBeInTheDocument();
        });

        it("should be collapsed by default", () => {
            render(<ToolStep {...defaultProps} />);

            expect(screen.queryByTestId("tool-use-card")).not.toBeInTheDocument();
        });
    });

    describe("status display", () => {
        it("should show completed status", () => {
            const step = createMockStep();
            render(<ToolStep {...defaultProps} step={step} />);

            expect(screen.getByText("Completed")).toBeInTheDocument();
        });

        it("should show pending status when no result", () => {
            const step = createMockStep({
                toolUse: {
                    uuid: "use-1",
                    type: "tool_use",
                    timestamp: new Date(),
                    toolName: "Read",
                },
                toolResult: undefined,
            });

            render(<ToolStep {...defaultProps} step={step} />);

            // Without a toolResult and without a status, it shows "Pending"
            expect(screen.getByText("Pending")).toBeInTheDocument();
        });

        it("should show running indicator when status is executing", () => {
            const step = createMockStep({
                toolUse: {
                    uuid: "use-1",
                    type: "tool_use",
                    timestamp: new Date(),
                    toolName: "Read",
                    status: "executing",
                },
                toolResult: undefined,
            });

            render(<ToolStep {...defaultProps} step={step} />);

            expect(screen.getByText("Running")).toBeInTheDocument();
        });

        it("should show failed status when result has error", () => {
            const step = createMockStep({
                toolResult: {
                    uuid: "result-1",
                    type: "tool_result",
                    timestamp: new Date(),
                    toolName: "Read",
                    content: "Error message",
                    isError: true,
                },
            });

            render(<ToolStep {...defaultProps} step={step} />);

            expect(screen.getByText("Failed")).toBeInTheDocument();
        });
    });

    describe("expand/collapse", () => {
        it("should call onToggleStep when header clicked", () => {
            const onToggleStep = vi.fn();
            render(<ToolStep {...defaultProps} onToggleStep={onToggleStep} />);

            // Click on the header area
            const header = screen.getByText("Read", { selector: "span.font-medium" });
            fireEvent.click(header.closest("[class*='cursor-pointer']")!);

            expect(onToggleStep).toHaveBeenCalledWith("step-1", false);
        });

        it("should expand when collapsedSteps is false for step id", () => {
            render(<ToolStep {...defaultProps} collapsedSteps={{ "step-1": false }} />);

            expect(screen.getByTestId("tool-use-card")).toBeInTheDocument();
        });

        it("should stay expanded when forceExpanded is true", () => {
            render(<ToolStep {...defaultProps} forceExpanded={true} />);

            expect(screen.getByTestId("tool-use-card")).toBeInTheDocument();
        });

        it("should auto-expand when status is executing", () => {
            const step = createMockStep({
                toolUse: {
                    uuid: "use-1",
                    type: "tool_use",
                    timestamp: new Date(),
                    toolName: "Read",
                    status: "executing",
                },
                toolResult: undefined,
            });

            render(<ToolStep {...defaultProps} step={step} />);

            // When executing, it should auto-expand
            expect(screen.getByTestId("tool-use-card")).toBeInTheDocument();
        });
    });

    describe("content display", () => {
        it("should show ToolUseCard when expanded", () => {
            render(<ToolStep {...defaultProps} collapsedSteps={{ "step-1": false }} />);

            expect(screen.getByTestId("tool-use-card")).toBeInTheDocument();
        });

        it("should show ToolResultCard when result exists and expanded", () => {
            render(<ToolStep {...defaultProps} collapsedSteps={{ "step-1": false }} />);

            expect(screen.getByTestId("tool-result-card")).toBeInTheDocument();
        });

        it("should show TodoDisplay for TodoWrite tool", () => {
            const step = createMockStep({
                toolUse: {
                    uuid: "use-1",
                    type: "tool_use",
                    timestamp: new Date(),
                    toolName: "TodoWrite",
                    rawInput: { todos: [] },
                },
            });

            render(
                <ToolStep
                    step={step}
                    collapsedSteps={{ "step-1": false }}
                    onToggleStep={vi.fn()}
                />,
            );

            expect(screen.getByTestId("todo-display")).toBeInTheDocument();
        });
    });

    describe("chevron rotation", () => {
        it("should not rotate chevron when collapsed", () => {
            const { container } = render(<ToolStep {...defaultProps} />);

            const chevrons = container.querySelectorAll("svg.lucide-chevron-right");
            expect(chevrons[0]?.classList.contains("rotate-90")).toBe(false);
        });

        it("should rotate chevron when expanded", () => {
            const { container } = render(
                <ToolStep {...defaultProps} collapsedSteps={{ "step-1": false }} />,
            );

            const chevrons = container.querySelectorAll("svg.lucide-chevron-right");
            expect(chevrons[0]?.classList.contains("rotate-90")).toBe(true);
        });
    });

    describe("duration display", () => {
        it("should show duration from toolUse", () => {
            const step = createMockStep({
                toolUse: {
                    uuid: "use-1",
                    type: "tool_use",
                    timestamp: new Date(),
                    toolName: "Read",
                    duration: 1500,
                },
            });

            const { container } = render(<ToolStep {...defaultProps} step={step} />);

            // Check for clock icon which indicates duration is shown
            const clockIcon = container.querySelector(".lucide-clock");
            expect(clockIcon).toBeInTheDocument();
        });

        it("should show duration from toolResult if toolUse has none", () => {
            const step = createMockStep({
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
                    content: "Content",
                    duration: 500,
                },
            });

            const { container } = render(<ToolStep {...defaultProps} step={step} />);

            const clockIcon = container.querySelector(".lucide-clock");
            expect(clockIcon).toBeInTheDocument();
        });
    });

    describe("tokens display", () => {
        it("should show tokens from toolUse", () => {
            const step = createMockStep({
                toolUse: {
                    uuid: "use-1",
                    type: "tool_use",
                    timestamp: new Date(),
                    toolName: "Read",
                    tokens: 150,
                },
            });

            const { container } = render(<ToolStep {...defaultProps} step={step} />);

            // Check for Zap icon which indicates tokens are shown
            const zapIcon = container.querySelector(".lucide-zap");
            expect(zapIcon).toBeInTheDocument();
        });

        it("should show tokens from toolResult", () => {
            const step = createMockStep({
                toolResult: {
                    uuid: "result-1",
                    type: "tool_result",
                    timestamp: new Date(),
                    toolName: "Read",
                    content: "Content",
                    tokens: 200,
                },
            });

            const { container } = render(<ToolStep {...defaultProps} step={step} />);

            const zapIcon = container.querySelector(".lucide-zap");
            expect(zapIcon).toBeInTheDocument();
        });
    });

    describe("cache tokens display", () => {
        it("should show cache creation tokens when present", () => {
            const step = createMockStep({
                toolUse: {
                    uuid: "use-1",
                    type: "tool_use",
                    timestamp: new Date(),
                    toolName: "Read",
                    cacheCreationTokens: 500,
                },
            });

            render(<ToolStep {...defaultProps} step={step} />);

            // Cache creation is indicated by "C" label
            expect(screen.getByText("C")).toBeInTheDocument();
        });

        it("should show cache read tokens when present", () => {
            const step = createMockStep({
                toolUse: {
                    uuid: "use-1",
                    type: "tool_use",
                    timestamp: new Date(),
                    toolName: "Read",
                    cacheReadTokens: 300,
                },
            });

            render(<ToolStep {...defaultProps} step={step} />);

            // Cache read is indicated by "R" label
            expect(screen.getByText("R")).toBeInTheDocument();
        });

        it("should not show cache creation tokens when 0", () => {
            const step = createMockStep({
                toolUse: {
                    uuid: "use-1",
                    type: "tool_use",
                    timestamp: new Date(),
                    toolName: "Read",
                    cacheCreationTokens: 0,
                },
            });

            render(<ToolStep {...defaultProps} step={step} />);

            expect(screen.queryByText("C")).not.toBeInTheDocument();
        });

        it("should not show cache read tokens when 0", () => {
            const step = createMockStep({
                toolUse: {
                    uuid: "use-1",
                    type: "tool_use",
                    timestamp: new Date(),
                    toolName: "Read",
                    cacheReadTokens: 0,
                },
            });

            render(<ToolStep {...defaultProps} step={step} />);

            expect(screen.queryByText("R")).not.toBeInTheDocument();
        });

        it("should get cache tokens from toolResult", () => {
            const step = createMockStep({
                toolUse: undefined,
                toolResult: {
                    uuid: "result-1",
                    type: "tool_result",
                    timestamp: new Date(),
                    toolName: "Read",
                    content: "Content",
                    cacheCreationTokens: 100,
                    cacheReadTokens: 50,
                },
            });

            render(<ToolStep {...defaultProps} step={step} />);

            expect(screen.getByText("C")).toBeInTheDocument();
            expect(screen.getByText("R")).toBeInTheDocument();
        });
    });

    describe("fallback values", () => {
        it("should fallback to Tool when no toolName", () => {
            const step: TimelineItemTool = {
                kind: "tool",
                id: "step-1",
                timestamp: new Date(),
            };

            render(<ToolStep step={step} collapsedSteps={{}} onToggleStep={vi.fn()} />);

            expect(screen.getByText("Tool")).toBeInTheDocument();
        });
    });
});
