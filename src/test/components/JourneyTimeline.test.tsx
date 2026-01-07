import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { JourneyTimeline } from "../../webview/components/Chat/JourneyTimeline/JourneyTimeline";
import type { Message } from "../../webview/components/App";

// Mock the child components
vi.mock("../../webview/components/Chat/Message", () => ({
    Message: ({ message }: { message: Message }) => (
        <div data-testid={`message-${message.id}`} data-role={message.role}>
            {message.content}
        </div>
    ),
}));

vi.mock("../../webview/components/Chat/JourneyTimeline/EmptyState", () => ({
    EmptyState: () => <div data-testid="empty-state">No messages yet</div>,
    default: () => <div data-testid="empty-state">No messages yet</div>,
}));

vi.mock("../../webview/components/Chat/JourneyTimeline/ToolStep", () => ({
    ToolStep: ({ step }: any) => (
        <div data-testid={`tool-step-${step.id}`}>
            Tool: {step.toolUse?.toolName || step.toolResult?.toolName || "unknown"}
        </div>
    ),
}));

vi.mock("../../webview/components/Chat/JourneyTimeline/PlanGroup", () => ({
    PlanGroup: ({ item, isPlanOpen }: any) => (
        <div data-testid={`plan-group-${item.id}`} data-open={isPlanOpen}>
            {item.assistant.content}
            <span data-testid="step-count">{item.steps.length} steps</span>
        </div>
    ),
}));

describe("JourneyTimeline", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("empty state", () => {
        it("should show empty state when no messages", () => {
            render(<JourneyTimeline messages={[]} isProcessing={false} />);

            expect(screen.getByTestId("empty-state")).toBeInTheDocument();
        });

        it("should not show empty state when showEmptyState is false", () => {
            const { container } = render(
                <JourneyTimeline messages={[]} isProcessing={false} showEmptyState={false} />,
            );

            expect(screen.queryByTestId("empty-state")).not.toBeInTheDocument();
            // Container should have the timeline div with space-y-2 class
            expect(container.querySelector(".space-y-2")).toBeInTheDocument();
        });
    });

    describe("message rendering", () => {
        it("should render user messages", () => {
            const messages: Message[] = [
                {
                    id: "1",
                    type: "user",
                    role: "user",
                    content: "Hello",
                    timestamp: Date.now(),
                },
            ];

            render(<JourneyTimeline messages={messages} isProcessing={false} />);

            expect(screen.getByTestId("message-1")).toBeInTheDocument();
            expect(screen.getByText("Hello")).toBeInTheDocument();
        });

        it("should render assistant messages as plan groups", () => {
            const messages: Message[] = [
                {
                    id: "1",
                    type: "assistant",
                    role: "assistant",
                    content: "Let me help you",
                    timestamp: Date.now(),
                },
            ];

            render(<JourneyTimeline messages={messages} isProcessing={false} />);

            expect(screen.getByTestId("plan-group-1")).toBeInTheDocument();
            expect(screen.getByText("Let me help you")).toBeInTheDocument();
        });

        it("should render multiple messages in order", () => {
            const messages: Message[] = [
                {
                    id: "1",
                    type: "user",
                    role: "user",
                    content: "First",
                    timestamp: Date.now(),
                },
                {
                    id: "2",
                    type: "assistant",
                    role: "assistant",
                    content: "Second",
                    timestamp: Date.now() + 1000,
                },
            ];

            render(<JourneyTimeline messages={messages} isProcessing={false} />);

            expect(screen.getByText("First")).toBeInTheDocument();
            expect(screen.getByText("Second")).toBeInTheDocument();
        });
    });

    describe("tool messages", () => {
        it("should group tool_use with assistant messages", () => {
            const messages: Message[] = [
                {
                    id: "1",
                    type: "assistant",
                    role: "assistant",
                    content: "I will read the file",
                    timestamp: Date.now(),
                },
                {
                    id: "2",
                    type: "tool",
                    role: "tool",
                    messageType: "tool_use",
                    content: "Reading file.txt",
                    toolName: "Read",
                    timestamp: Date.now() + 100,
                },
            ];

            render(<JourneyTimeline messages={messages} isProcessing={false} />);

            expect(screen.getByTestId("plan-group-1")).toBeInTheDocument();
            expect(screen.getByTestId("step-count")).toHaveTextContent("1 steps");
        });

        it("should render orphan tool_use when no assistant message", () => {
            const messages: Message[] = [
                {
                    id: "1",
                    type: "tool",
                    role: "tool",
                    messageType: "tool_use",
                    content: "Reading file",
                    toolName: "Read",
                    timestamp: Date.now(),
                },
            ];

            render(<JourneyTimeline messages={messages} isProcessing={false} />);

            expect(screen.getByTestId("tool-step-1")).toBeInTheDocument();
        });
    });

    describe("scroll behavior", () => {
        it("should have bottom ref element for auto-scroll", () => {
            const messages: Message[] = [
                {
                    id: "1",
                    type: "user",
                    role: "user",
                    content: "Hello",
                    timestamp: Date.now(),
                },
            ];

            const { container } = render(
                <JourneyTimeline messages={messages} isProcessing={false} />,
            );

            // The bottom ref element should exist (it's a div with h-4 class)
            expect(container.querySelector(".h-4")).toBeInTheDocument();
        });
    });
});
