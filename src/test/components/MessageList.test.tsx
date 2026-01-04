import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MessageList } from "../../webview/components/Chat/MessageList";
import type { Message } from "../../webview/components/App";

// Mock the Message component
vi.mock("../../webview/components/Chat/Message", () => ({
    Message: ({ message }: { message: Message }) => (
        <div data-testid={`message-${message.id}`}>{message.content}</div>
    ),
}));

describe("MessageList", () => {
    const mockMessages: Message[] = [
        { id: "1", role: "user", content: "Hello" },
        { id: "2", role: "assistant", content: "Hi there!" },
        { id: "3", role: "user", content: "How are you?" },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("rendering", () => {
        it("should render messages", () => {
            render(<MessageList messages={mockMessages} isProcessing={false} />);

            expect(screen.getByTestId("message-1")).toBeInTheDocument();
            expect(screen.getByTestId("message-2")).toBeInTheDocument();
            expect(screen.getByTestId("message-3")).toBeInTheDocument();
        });

        it("should render message content", () => {
            render(<MessageList messages={mockMessages} isProcessing={false} />);

            expect(screen.getByText("Hello")).toBeInTheDocument();
            expect(screen.getByText("Hi there!")).toBeInTheDocument();
            expect(screen.getByText("How are you?")).toBeInTheDocument();
        });
    });

    describe("empty state", () => {
        it("should show empty state when no messages", () => {
            render(<MessageList messages={[]} isProcessing={false} />);

            expect(screen.getByText("Start a conversation")).toBeInTheDocument();
        });

        it("should show description in empty state", () => {
            render(<MessageList messages={[]} isProcessing={false} />);

            expect(screen.getByText(/Ask Claude anything about your code/)).toBeInTheDocument();
        });

        it("should show quick action buttons in empty state", () => {
            render(<MessageList messages={[]} isProcessing={false} />);

            expect(screen.getByText("Explain code")).toBeInTheDocument();
            expect(screen.getByText("Fix bug")).toBeInTheDocument();
            expect(screen.getByText("Write tests")).toBeInTheDocument();
            expect(screen.getByText("Refactor")).toBeInTheDocument();
        });

        it("should hide empty state when showEmptyState is false", () => {
            render(<MessageList messages={[]} isProcessing={false} showEmptyState={false} />);

            expect(screen.queryByText("Start a conversation")).not.toBeInTheDocument();
        });
    });

    describe("processing state", () => {
        it("should show loading indicator when processing", () => {
            render(<MessageList messages={mockMessages} isProcessing={true} />);

            expect(screen.getByText("Claude is thinking...")).toBeInTheDocument();
        });

        it("should not show loading indicator when not processing", () => {
            render(<MessageList messages={mockMessages} isProcessing={false} />);

            expect(screen.queryByText("Claude is thinking...")).not.toBeInTheDocument();
        });

        it("should show animated dots when processing", () => {
            const { container } = render(
                <MessageList messages={mockMessages} isProcessing={true} />,
            );

            const dots = container.querySelectorAll(".animate-bounce");
            expect(dots.length).toBe(3);
        });
    });

    describe("scrollable prop", () => {
        it("should apply overflow class when scrollable", () => {
            const { container } = render(
                <MessageList messages={mockMessages} isProcessing={false} isScrollable={true} />,
            );

            const messageContainer = container.querySelector(".overflow-y-auto");
            expect(messageContainer).toBeInTheDocument();
        });

        it("should not apply overflow class when not scrollable", () => {
            const { container } = render(
                <MessageList messages={mockMessages} isProcessing={false} isScrollable={false} />,
            );

            const messageContainer = container.querySelector(".overflow-y-auto");
            expect(messageContainer).not.toBeInTheDocument();
        });
    });

    describe("single message", () => {
        it("should render single message correctly", () => {
            const singleMessage: Message[] = [{ id: "1", role: "user", content: "Hello world" }];

            render(<MessageList messages={singleMessage} isProcessing={false} />);

            expect(screen.getByText("Hello world")).toBeInTheDocument();
        });
    });

    describe("assistant message", () => {
        it("should render assistant messages", () => {
            const messages: Message[] = [
                { id: "1", role: "assistant", content: "I can help with that" },
            ];

            render(<MessageList messages={messages} isProcessing={false} />);

            expect(screen.getByText("I can help with that")).toBeInTheDocument();
        });
    });

    describe("message order", () => {
        it("should render messages in order", () => {
            const { container } = render(
                <MessageList messages={mockMessages} isProcessing={false} />,
            );

            const messageElements = container.querySelectorAll('[data-testid^="message-"]');
            expect(messageElements[0]).toHaveAttribute("data-testid", "message-1");
            expect(messageElements[1]).toHaveAttribute("data-testid", "message-2");
            expect(messageElements[2]).toHaveAttribute("data-testid", "message-3");
        });
    });

    describe("bottom reference", () => {
        it("should render bottom div for scroll anchor", () => {
            const { container } = render(
                <MessageList messages={mockMessages} isProcessing={false} />,
            );

            // The component renders an empty div at the bottom for scroll anchoring
            const lastChild = container.querySelector(".space-y-4")?.lastElementChild;
            expect(lastChild?.tagName).toBe("DIV");
        });
    });

    describe("quick actions", () => {
        it("should render quick action icons", () => {
            render(<MessageList messages={[]} isProcessing={false} />);

            // Quick action icons
            expect(screen.getByText("?")).toBeInTheDocument();
            expect(screen.getByText("!")).toBeInTheDocument();
            expect(screen.getByText("T")).toBeInTheDocument();
            expect(screen.getByText("R")).toBeInTheDocument();
        });
    });
});
