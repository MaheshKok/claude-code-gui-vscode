import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatContainer } from "../../webview/components/Chat/ChatContainer";
import { ThinkingIntensity } from "../../shared/constants";
import type { Message } from "../../webview/components/App";

// Mock child components
vi.mock("../../webview/components/Chat/MessageInput", () => ({
    MessageInput: ({ onSendMessage, disabled }: any) => (
        <div data-testid="message-input" data-disabled={disabled}>
            <button onClick={() => onSendMessage("test message")}>Send</button>
        </div>
    ),
}));

vi.mock("../../webview/components/Chat/JourneyTimeline", () => ({
    JourneyTimeline: ({ messages, showEmptyState }: any) => (
        <div data-testid="journey-timeline" data-empty={showEmptyState}>
            {messages.map((m: Message) => (
                <div key={m.id}>{m.content}</div>
            ))}
        </div>
    ),
}));

vi.mock("../../webview/components/Tools", () => ({
    TodoDisplay: ({ todos, title }: any) => (
        <div data-testid="todo-display" data-title={title}>
            {todos.length} todos
        </div>
    ),
}));

describe("ChatContainer", () => {
    const defaultProps = {
        messages: [] as Message[],
        isProcessing: false,
        todos: [],
        currentModel: "claude-3-sonnet",
        planMode: false,
        thinkingMode: false,
        thinkingIntensity: "think-naturally" as ThinkingIntensity,
        yoloMode: false,
        onSendMessage: vi.fn(),
        onModelChange: vi.fn(),
        onPlanModeToggle: vi.fn(),
        onThinkingModeToggle: vi.fn(),
        onThinkingIntensityChange: vi.fn(),
        onYoloModeToggle: vi.fn(),
        onSlashCommand: vi.fn(),
        onMcpAction: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("rendering", () => {
        it("should render the container", () => {
            render(<ChatContainer {...defaultProps} />);

            expect(screen.getByTestId("message-input")).toBeInTheDocument();
            expect(screen.getByTestId("journey-timeline")).toBeInTheDocument();
        });

        it("should show empty state when no messages", () => {
            render(<ChatContainer {...defaultProps} messages={[]} />);

            const timeline = screen.getByTestId("journey-timeline");
            expect(timeline).toHaveAttribute("data-empty", "true");
        });

        it("should not show empty state when messages exist", () => {
            const messages: Message[] = [
                {
                    id: "1",
                    type: "user",
                    content: "Hello",
                    timestamp: Date.now(),
                },
            ];

            render(<ChatContainer {...defaultProps} messages={messages} />);

            const timeline = screen.getByTestId("journey-timeline");
            expect(timeline).toHaveAttribute("data-empty", "false");
        });
    });

    describe("message display", () => {
        it("should render messages in timeline", () => {
            const messages: Message[] = [
                {
                    id: "1",
                    type: "user",
                    content: "Hello world",
                    timestamp: Date.now(),
                },
                {
                    id: "2",
                    type: "assistant",
                    content: "Hi there!",
                    timestamp: Date.now(),
                },
            ];

            render(<ChatContainer {...defaultProps} messages={messages} />);

            expect(screen.getByText("Hello world")).toBeInTheDocument();
            expect(screen.getByText("Hi there!")).toBeInTheDocument();
        });
    });

    describe("todos display", () => {
        it("should not show todos when empty", () => {
            render(<ChatContainer {...defaultProps} todos={[]} />);

            expect(screen.queryByTestId("todo-display")).not.toBeInTheDocument();
        });

        it("should show todos when present", () => {
            const todos = [
                { content: "Task 1", status: "pending" as const },
                { content: "Task 2", status: "in_progress" as const },
            ];

            render(<ChatContainer {...defaultProps} todos={todos} />);

            expect(screen.getByTestId("todo-display")).toBeInTheDocument();
            expect(screen.getByText("2 todos")).toBeInTheDocument();
        });
    });

    describe("input disabled state", () => {
        it("should disable input when processing", () => {
            render(<ChatContainer {...defaultProps} isProcessing={true} />);

            const input = screen.getByTestId("message-input");
            expect(input).toHaveAttribute("data-disabled", "true");
        });

        it("should enable input when not processing", () => {
            render(<ChatContainer {...defaultProps} isProcessing={false} />);

            const input = screen.getByTestId("message-input");
            expect(input).toHaveAttribute("data-disabled", "false");
        });
    });

    describe("callback props", () => {
        it("should pass onSendMessage to MessageInput", () => {
            const onSendMessage = vi.fn();
            render(<ChatContainer {...defaultProps} onSendMessage={onSendMessage} />);

            screen.getByText("Send").click();

            expect(onSendMessage).toHaveBeenCalledWith("test message");
        });
    });
});
