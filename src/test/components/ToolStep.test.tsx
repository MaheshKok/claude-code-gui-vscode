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
        // Note: Status badges are only shown in the header for TodoWrite tools
        it("should show completed status for TodoWrite with result", () => {
            const step = createMockStep({
                toolUse: {
                    uuid: "use-1",
                    type: "tool_use",
                    timestamp: new Date(),
                    toolName: "TodoWrite",
                    rawInput: { todos: [] },
                },
                toolResult: {
                    uuid: "result-1",
                    type: "tool_result",
                    timestamp: new Date(),
                    toolName: "TodoWrite",
                    content: "Success",
                    isError: false,
                },
            });

            // Completed status shows a checkmark icon for TodoWrite
            const { container } = render(<ToolStep {...defaultProps} step={step} />);
            // Check for check circle icon (lucide-react renders with class lucide and lucide-check-circle-2)
            const checkIcon = container.querySelector("svg.text-green-400");
            expect(checkIcon).toBeInTheDocument();
        });

        it("should show pending status when no result for TodoWrite", () => {
            const step = createMockStep({
                toolUse: {
                    uuid: "use-1",
                    type: "tool_use",
                    timestamp: new Date(),
                    toolName: "TodoWrite",
                    rawInput: { todos: [] },
                },
                toolResult: undefined,
            });

            render(<ToolStep {...defaultProps} step={step} />);

            // Without a toolResult and without a status, it shows "Pending"
            expect(screen.getByText("Pending")).toBeInTheDocument();
        });

        it("should show running indicator when status is executing for TodoWrite", () => {
            const step = createMockStep({
                toolUse: {
                    uuid: "use-1",
                    type: "tool_use",
                    timestamp: new Date(),
                    toolName: "TodoWrite",
                    rawInput: { todos: [] },
                    status: "executing",
                },
                toolResult: undefined,
            });

            render(<ToolStep {...defaultProps} step={step} />);

            expect(screen.getByText("Running")).toBeInTheDocument();
        });

        it("should show failed status when result has error for TodoWrite", () => {
            const step = createMockStep({
                toolUse: {
                    uuid: "use-1",
                    type: "tool_use",
                    timestamp: new Date(),
                    toolName: "TodoWrite",
                    rawInput: { todos: [] },
                },
                toolResult: {
                    uuid: "result-1",
                    type: "tool_result",
                    timestamp: new Date(),
                    toolName: "TodoWrite",
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
        // Note: Duration badges are only shown for TodoWrite tools in the header stats section
        it("should show duration from toolUse for TodoWrite", () => {
            const step = createMockStep({
                toolUse: {
                    uuid: "use-1",
                    type: "tool_use",
                    timestamp: new Date(),
                    toolName: "TodoWrite",
                    rawInput: { todos: [] },
                    duration: 1500,
                },
                toolResult: undefined,
            });

            const { container } = render(<ToolStep {...defaultProps} step={step} />);

            // Check for clock icon which indicates duration is shown
            const clockIcon = container.querySelector(".lucide-clock");
            expect(clockIcon).toBeInTheDocument();
        });

        it("should show duration from toolResult if toolUse has none for TodoWrite", () => {
            const step = createMockStep({
                toolUse: {
                    uuid: "use-1",
                    type: "tool_use",
                    timestamp: new Date(),
                    toolName: "TodoWrite",
                    rawInput: { todos: [] },
                },
                toolResult: {
                    uuid: "result-1",
                    type: "tool_result",
                    timestamp: new Date(),
                    toolName: "TodoWrite",
                    content: "Success",
                    duration: 500,
                },
            });

            const { container } = render(<ToolStep {...defaultProps} step={step} />);

            const clockIcon = container.querySelector(".lucide-clock");
            expect(clockIcon).toBeInTheDocument();
        });
    });

    describe("tokens display", () => {
        // Note: Token badges are only shown for TodoWrite tools in the header stats section
        it("should show tokens from toolUse for TodoWrite", () => {
            const step = createMockStep({
                toolUse: {
                    uuid: "use-1",
                    type: "tool_use",
                    timestamp: new Date(),
                    toolName: "TodoWrite",
                    rawInput: { todos: [] },
                    tokens: 150,
                },
                toolResult: undefined,
            });

            const { container } = render(<ToolStep {...defaultProps} step={step} />);

            // Check for Zap icon which indicates tokens are shown
            const zapIcon = container.querySelector(".lucide-zap");
            expect(zapIcon).toBeInTheDocument();
        });

        it("should show tokens from toolResult for TodoWrite", () => {
            const step = createMockStep({
                toolUse: {
                    uuid: "use-1",
                    type: "tool_use",
                    timestamp: new Date(),
                    toolName: "TodoWrite",
                    rawInput: { todos: [] },
                },
                toolResult: {
                    uuid: "result-1",
                    type: "tool_result",
                    timestamp: new Date(),
                    toolName: "TodoWrite",
                    content: "Success",
                    tokens: 200,
                },
            });

            const { container } = render(<ToolStep {...defaultProps} step={step} />);

            const zapIcon = container.querySelector(".lucide-zap");
            expect(zapIcon).toBeInTheDocument();
        });
    });

    describe("cache tokens display", () => {
        // Note: Cache token labels (C/R) have been removed from the UI
        // These tests verify that cache tokens are not displayed
        it("should NOT show cache creation tokens badge (C removed from UI)", () => {
            const step = createMockStep({
                toolUse: {
                    uuid: "use-1",
                    type: "tool_use",
                    timestamp: new Date(),
                    toolName: "TodoWrite",
                    rawInput: { todos: [] },
                    cacheCreationTokens: 500,
                },
                toolResult: undefined,
            });

            render(<ToolStep {...defaultProps} step={step} />);

            // Cache creation badge "C" was removed from UI
            expect(screen.queryByText("C")).not.toBeInTheDocument();
        });

        it("should NOT show cache read tokens badge (R removed from UI)", () => {
            const step = createMockStep({
                toolUse: {
                    uuid: "use-1",
                    type: "tool_use",
                    timestamp: new Date(),
                    toolName: "TodoWrite",
                    rawInput: { todos: [] },
                    cacheReadTokens: 300,
                },
                toolResult: undefined,
            });

            render(<ToolStep {...defaultProps} step={step} />);

            // Cache read badge "R" was removed from UI
            expect(screen.queryByText("R")).not.toBeInTheDocument();
        });

        it("should not show cache creation tokens when 0", () => {
            const step = createMockStep({
                toolUse: {
                    uuid: "use-1",
                    type: "tool_use",
                    timestamp: new Date(),
                    toolName: "TodoWrite",
                    rawInput: { todos: [] },
                    cacheCreationTokens: 0,
                },
                toolResult: undefined,
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
                    toolName: "TodoWrite",
                    rawInput: { todos: [] },
                    cacheReadTokens: 0,
                },
                toolResult: undefined,
            });

            render(<ToolStep {...defaultProps} step={step} />);

            expect(screen.queryByText("R")).not.toBeInTheDocument();
        });

        it("should NOT show cache tokens from toolResult (badges removed from UI)", () => {
            const step = createMockStep({
                toolUse: {
                    uuid: "use-1",
                    type: "tool_use",
                    timestamp: new Date(),
                    toolName: "TodoWrite",
                    rawInput: { todos: [] },
                },
                toolResult: {
                    uuid: "result-1",
                    type: "tool_result",
                    timestamp: new Date(),
                    toolName: "TodoWrite",
                    content: "Success",
                    cacheCreationTokens: 100,
                    cacheReadTokens: 50,
                },
            });

            render(<ToolStep {...defaultProps} step={step} />);

            // Cache token badges were removed from UI
            expect(screen.queryByText("C")).not.toBeInTheDocument();
            expect(screen.queryByText("R")).not.toBeInTheDocument();
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
