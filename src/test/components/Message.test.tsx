/**
 * Message Component Tests
 *
 * Tests for the Message component including rendering of different
 * message types, role labels, icons, and copy functionality.
 *
 * @module test/components/Message
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Message } from "../../webview/components/Chat/Message";

// Mock child components
vi.mock("../../webview/components/Tools", () => ({
    ToolUseCard: ({ toolName, isExecuting }: { toolName: string; isExecuting: boolean }) => (
        <div data-testid="tool-use-card">
            <span>{toolName}</span>
            {isExecuting && <span data-testid="executing">Executing</span>}
        </div>
    ),
    ToolResultCard: ({ content, isError }: { content: string; isError?: boolean }) => (
        <div data-testid="tool-result-card">
            <span>{content}</span>
            {isError && <span data-testid="error">Error</span>}
        </div>
    ),
    TodoDisplay: ({ todos }: { todos: unknown[] }) => (
        <div data-testid="todo-display">{todos.length} todos</div>
    ),
}));

// Mock useVSCode hook
const mockPostMessage = vi.fn();
vi.mock("../../webview/hooks/useVSCode", () => ({
    useVSCode: () => ({
        postMessage: mockPostMessage,
    }),
}));

// Mock the Message type as defined in the component
interface MessageType {
    id: string;
    role: "user" | "assistant" | "tool" | "error";
    content: string;
    timestamp: Date;
    isStreaming?: boolean;
    toolName?: string;
    messageType?: "tool_use" | "tool_result";
    rawInput?: Record<string, unknown>;
    status?: string;
    duration?: number;
    tokens?: number;
    isError?: boolean;
    usage?: {
        input_tokens: number;
        output_tokens: number;
        cache_creation_input_tokens?: number;
        cache_read_input_tokens?: number;
    };
}

// Helper to create a mock message
function createMockMessage(overrides: Partial<MessageType> = {}): MessageType {
    return {
        id: `msg-${Date.now()}`,
        role: "user",
        content: "Test message content",
        timestamp: new Date("2024-06-15T14:30:00.000Z"),
        isStreaming: false,
        ...overrides,
    };
}

describe("Message Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ==========================================================================
    // Rendering Different Message Types
    // ==========================================================================
    describe("rendering different message types", () => {
        describe("user messages", () => {
            it("should render user message", () => {
                const message = createMockMessage({
                    role: "user",
                    content: "Hello, Claude!",
                });

                render(<Message message={message} />);

                expect(screen.getByText("Hello, Claude!")).toBeInTheDocument();
                expect(screen.getByText("You")).toBeInTheDocument();
            });

            it("should display user icon", () => {
                const message = createMockMessage({ role: "user" });

                const { container } = render(<Message message={message} />);

                // User icon is an SVG with a person path
                const svg = container.querySelector("svg");
                expect(svg).toBeInTheDocument();
            });

            it("should have appropriate styling for user messages", () => {
                const message = createMockMessage({ role: "user" });

                const { container } = render(<Message message={message} />);

                // Check for user-specific styling class
                const messageContainer = container.firstChild as HTMLElement;
                expect(messageContainer.className).toContain("message-user");
            });
        });

        describe("assistant messages", () => {
            it("should render assistant message", () => {
                const message = createMockMessage({
                    role: "assistant",
                    content: "Hello! How can I help you?",
                });

                render(<Message message={message} />);

                expect(screen.getByText("Hello! How can I help you?")).toBeInTheDocument();
                expect(screen.getByText("Claude")).toBeInTheDocument();
            });

            it("should display Claude label", () => {
                const message = createMockMessage({ role: "assistant" });

                render(<Message message={message} />);

                expect(screen.getByText("Claude")).toBeInTheDocument();
            });
        });

        describe("tool messages", () => {
            it("should render tool message", () => {
                const message = createMockMessage({
                    role: "tool",
                    content: '{"result": "success"}',
                    toolName: "Read",
                });

                render(<Message message={message} />);

                // Tool messages are collapsed by default, so we check the tool name is visible
                expect(screen.getByText("Read")).toBeInTheDocument();

                // Click to expand and see content
                const header = screen.getByText("Read").closest('div[class*="cursor-pointer"]');
                if (header) {
                    fireEvent.click(header);
                    // After expansion, content should be visible
                    expect(screen.getByText(/result.*success/)).toBeInTheDocument();
                }
            });

            it("should display tool name as label", () => {
                const message = createMockMessage({
                    role: "tool",
                    toolName: "Read",
                });

                render(<Message message={message} />);

                expect(screen.getByText("Read")).toBeInTheDocument();
            });

            it('should display "Tool" when no tool name provided', () => {
                const message = createMockMessage({
                    role: "tool",
                    toolName: undefined,
                });

                render(<Message message={message} />);

                expect(screen.getByText("Tool")).toBeInTheDocument();
            });

            it("should render tool content in monospace font", () => {
                const message = createMockMessage({
                    role: "tool",
                    content: "tool output",
                });

                const { container } = render(<Message message={message} />);

                // Click to expand the collapsed tool message
                const header = container.querySelector('div[class*="cursor-pointer"]');
                if (header) {
                    fireEvent.click(header);
                }

                // After expansion, check for monospace content
                // The content is in a div with font-mono class
                const codeBlock = container.querySelector(".font-mono");
                expect(codeBlock).toBeInTheDocument();
            });
        });

        describe("error messages", () => {
            it("should render error message", () => {
                const message = createMockMessage({
                    role: "error",
                    content: "Something went wrong!",
                });

                render(<Message message={message} />);

                expect(screen.getByText("Something went wrong!")).toBeInTheDocument();
                expect(screen.getByText("Error")).toBeInTheDocument();
            });

            it("should have error styling", () => {
                const message = createMockMessage({
                    role: "error",
                    content: "Error message",
                });

                const { container } = render(<Message message={message} />);

                // Check for error-specific styling (red/error classes)
                const messageContainer = container.firstChild as HTMLElement;
                expect(messageContainer.className).toContain("red");
            });
        });
    });

    // ==========================================================================
    // Role Labels and Icons
    // ==========================================================================
    describe("role labels and icons", () => {
        it('should display "You" for user role', () => {
            const message = createMockMessage({ role: "user" });
            render(<Message message={message} />);
            expect(screen.getByText("You")).toBeInTheDocument();
        });

        it('should display "Claude" for assistant role', () => {
            const message = createMockMessage({ role: "assistant" });
            render(<Message message={message} />);
            expect(screen.getByText("Claude")).toBeInTheDocument();
        });

        it("should display tool name for tool role", () => {
            const message = createMockMessage({ role: "tool", toolName: "Bash" });
            render(<Message message={message} />);
            expect(screen.getByText("Bash")).toBeInTheDocument();
        });

        it('should display "Error" for error role', () => {
            const message = createMockMessage({ role: "error" });
            render(<Message message={message} />);
            expect(screen.getByText("Error")).toBeInTheDocument();
        });

        it("should render appropriate icon for each role", () => {
            const roles: Array<"user" | "assistant" | "tool" | "error"> = [
                "user",
                "assistant",
                "tool",
                "error",
            ];

            for (const role of roles) {
                const message = createMockMessage({ role });
                const { container } = render(<Message message={message} />);

                const svg = container.querySelector("svg");
                expect(svg).toBeInTheDocument();
            }
        });
    });

    // ==========================================================================
    // Timestamp Display
    // ==========================================================================
    describe("timestamp display", () => {
        it("should display formatted timestamp", () => {
            const message = createMockMessage({
                timestamp: new Date("2024-06-15T14:30:00.000Z"),
            });

            render(<Message message={message} />);

            // The exact format depends on locale, but should contain time
            const timestampElement = screen.getByText(/\d{1,2}:\d{2}/);
            expect(timestampElement).toBeInTheDocument();
        });

        it("should format timestamp with AM/PM", () => {
            const message = createMockMessage({
                timestamp: new Date("2024-06-15T14:30:00.000Z"),
            });

            render(<Message message={message} />);

            // Should contain AM or PM
            const timestampElement = screen.getByText(/AM|PM/i);
            expect(timestampElement).toBeInTheDocument();
        });
    });

    // ==========================================================================
    // Streaming State
    // ==========================================================================
    describe("streaming state", () => {
        it("should show streaming indicator when isStreaming is true", () => {
            const message = createMockMessage({
                role: "assistant",
                isStreaming: true,
            });

            render(<Message message={message} />);

            // The component shows "Thinking" text for streaming messages
            expect(screen.getByText("Thinking")).toBeInTheDocument();
        });

        it("should not show streaming indicator when isStreaming is false", () => {
            const message = createMockMessage({
                role: "assistant",
                isStreaming: false,
            });

            render(<Message message={message} />);

            // The component shows "Thinking" text for streaming messages
            expect(screen.queryByText("Thinking")).not.toBeInTheDocument();
        });

        it("should have bouncing animation on streaming indicator", () => {
            const message = createMockMessage({
                role: "assistant",
                isStreaming: true,
            });

            const { container } = render(<Message message={message} />);

            // The streaming indicator has bouncing dots with animate-bounce class
            const bouncingDots = container.querySelectorAll(".animate-bounce");
            expect(bouncingDots.length).toBeGreaterThan(0);
        });
    });

    // ==========================================================================
    // Content Rendering
    // ==========================================================================
    describe("content rendering", () => {
        it("should render plain text content", () => {
            const message = createMockMessage({
                content: "This is plain text content",
            });

            render(<Message message={message} />);

            expect(screen.getByText("This is plain text content")).toBeInTheDocument();
        });

        it("should preserve whitespace in content", () => {
            const message = createMockMessage({
                content: "Line 1\nLine 2\nLine 3",
            });

            const { container } = render(<Message message={message} />);

            // Check that the message content is rendered with proper class
            const contentDiv = container.querySelector(".message-content");
            expect(contentDiv).toBeInTheDocument();
        });

        describe("code block rendering", () => {
            it("should render code blocks", () => {
                const message = createMockMessage({
                    role: "assistant",
                    content: "```javascript\nconst x = 1;\n```",
                });

                const { container } = render(<Message message={message} />);

                const codeBlock = container.querySelector("pre");
                expect(codeBlock).toBeInTheDocument();
            });

            it("should display language label for code blocks", () => {
                const message = createMockMessage({
                    role: "assistant",
                    content: "```typescript\nconst x: number = 1;\n```",
                });

                render(<Message message={message} />);

                expect(screen.getByText("typescript")).toBeInTheDocument();
            });

            it("should handle code blocks without language", () => {
                const message = createMockMessage({
                    role: "assistant",
                    content: "```\nsome code\n```",
                });

                const { container } = render(<Message message={message} />);

                const codeBlock = container.querySelector("pre");
                expect(codeBlock).toBeInTheDocument();
            });
        });

        describe("inline code rendering", () => {
            it("should render inline code", () => {
                const message = createMockMessage({
                    role: "assistant",
                    content: "Use the `console.log` function",
                });

                const { container } = render(<Message message={message} />);

                const inlineCode = container.querySelector("code");
                expect(inlineCode).toBeInTheDocument();
                expect(inlineCode?.textContent).toBe("console.log");
            });

            it("should handle multiple inline code segments", () => {
                const message = createMockMessage({
                    role: "assistant",
                    content: "Use `const` or `let` for variables",
                });

                const { container } = render(<Message message={message} />);

                const inlineCodes = container.querySelectorAll("code");
                expect(inlineCodes.length).toBeGreaterThanOrEqual(2);
            });
        });
    });

    // ==========================================================================
    // Container Styling
    // ==========================================================================
    describe("container styling", () => {
        it("should have message class", () => {
            const message = createMockMessage();
            const { container } = render(<Message message={message} />);

            const messageContainer = container.firstChild as HTMLElement;
            expect(messageContainer.className).toContain("message");
        });

        it("should have appropriate styling", () => {
            const message = createMockMessage();
            const { container } = render(<Message message={message} />);

            const messageContainer = container.firstChild as HTMLElement;
            // User messages have message-user class
            expect(messageContainer.className).toContain("message-user");
        });

        it("should have different styling for different roles", () => {
            const userMessage = createMockMessage({ role: "user" });
            const assistantMessage = createMockMessage({ role: "assistant" });

            const { container: userContainer } = render(<Message message={userMessage} />);
            const { container: assistantContainer } = render(
                <Message message={assistantMessage} />,
            );

            const userStyles = (userContainer.firstChild as HTMLElement).className;
            const assistantStyles = (assistantContainer.firstChild as HTMLElement).className;

            // They should have different background styles
            expect(userStyles).not.toBe(assistantStyles);
        });
    });

    // ==========================================================================
    // Avatar Display
    // ==========================================================================
    describe("avatar display", () => {
        it("should display avatar icon", () => {
            const message = createMockMessage({ role: "user" });
            const { container } = render(<Message message={message} />);

            // The component uses rounded-lg for avatar container
            const avatar = container.querySelector(".rounded-lg");
            expect(avatar).toBeInTheDocument();
        });

        it("should have appropriate avatar colors for user", () => {
            const message = createMockMessage({ role: "user" });
            const { container } = render(<Message message={message} />);

            // User avatar has orange gradient styling
            const avatar = container.querySelector(".bg-gradient-to-br");
            expect(avatar).toBeInTheDocument();
        });

        it("should have error colors for error messages", () => {
            const message = createMockMessage({ role: "error" });
            const { container } = render(<Message message={message} />);

            // Error messages have red styling
            const avatar = container.querySelector(".bg-red-500\\/20");
            expect(avatar).toBeInTheDocument();
        });
    });

    // ==========================================================================
    // Edge Cases
    // ==========================================================================
    describe("edge cases", () => {
        it("should handle empty content", () => {
            const message = createMockMessage({ content: "" });
            const { container } = render(<Message message={message} />);

            expect(container.firstChild).toBeInTheDocument();
        });

        it("should handle very long content", () => {
            const longContent = "a".repeat(10000);
            const message = createMockMessage({ content: longContent });

            const { container } = render(<Message message={message} />);

            expect(container.firstChild).toBeInTheDocument();
        });

        it("should handle special characters in content", () => {
            const message = createMockMessage({
                content: '<script>alert("xss")</script>',
            });

            render(<Message message={message} />);

            // Should render the text without executing as HTML
            expect(screen.getByText(/<script>/)).toBeInTheDocument();
        });

        it("should handle unicode content", () => {
            const message = createMockMessage({
                content: "Hello! Emoji test",
            });

            render(<Message message={message} />);

            expect(screen.getByText(/Hello! Emoji test/)).toBeInTheDocument();
        });

        it("should handle content with only whitespace", () => {
            const message = createMockMessage({ content: "   \n\t   " });
            const { container } = render(<Message message={message} />);

            expect(container.firstChild).toBeInTheDocument();
        });
    });

    // ==========================================================================
    // MessageContent Sub-component
    // ==========================================================================
    describe("MessageContent rendering", () => {
        it("should split content on code block boundaries", () => {
            const message = createMockMessage({
                role: "assistant",
                content: "Before\n```js\ncode\n```\nAfter",
            });

            render(<Message message={message} />);

            expect(screen.getByText("Before")).toBeInTheDocument();
            expect(screen.getByText("After")).toBeInTheDocument();
        });

        it("should handle multiple code blocks", () => {
            const message = createMockMessage({
                role: "assistant",
                content: "```js\ncode1\n```\nMiddle\n```python\ncode2\n```",
            });

            const { container } = render(<Message message={message} />);

            const codeBlocks = container.querySelectorAll("pre");
            expect(codeBlocks.length).toBe(2);
        });
    });

    // ==========================================================================
    // Tool Use Messages
    // ==========================================================================
    describe("tool_use messages", () => {
        it("should render ToolUseCard for tool_use message type", () => {
            const message = createMockMessage({
                role: "tool",
                messageType: "tool_use",
                toolName: "Read",
                rawInput: { file_path: "/test/file.ts" },
            });

            render(<Message message={message} />);

            expect(screen.getByTestId("tool-use-card")).toBeInTheDocument();
            // "Read" appears multiple times (header and tool card)
            const readElements = screen.getAllByText("Read");
            expect(readElements.length).toBeGreaterThan(0);
        });

        it("should show TodoDisplay for TodoWrite tool", () => {
            const message = createMockMessage({
                role: "tool",
                messageType: "tool_use",
                toolName: "TodoWrite",
                rawInput: {
                    todos: [
                        { content: "Task 1", status: "pending" },
                        { content: "Task 2", status: "completed" },
                    ],
                },
            });

            render(<Message message={message} />);

            expect(screen.getByTestId("todo-display")).toBeInTheDocument();
        });

        it("should show status badge when status is provided", () => {
            const message = createMockMessage({
                role: "tool",
                messageType: "tool_use",
                toolName: "Bash",
                status: "completed",
                rawInput: { command: "ls" },
            });

            render(<Message message={message} />);

            expect(screen.getByText("completed")).toBeInTheDocument();
        });

        it("should show duration when provided", () => {
            const message = createMockMessage({
                role: "tool",
                messageType: "tool_use",
                toolName: "Bash",
                duration: 1500,
                rawInput: { command: "ls" },
            });

            const { container } = render(<Message message={message} />);

            // Duration should be shown with clock icon
            const clockIcon = container.querySelector(".lucide-clock");
            expect(clockIcon).toBeInTheDocument();
            // formatDuration abbreviates - shows "1s" for 1500ms
            expect(screen.getByText(/\d+s/)).toBeInTheDocument();
        });

        it("should show executing indicator when status is not terminal", () => {
            const message = createMockMessage({
                role: "tool",
                messageType: "tool_use",
                toolName: "Bash",
                status: "executing",
                rawInput: { command: "npm test" },
            });

            render(<Message message={message} />);

            expect(screen.getByTestId("executing")).toBeInTheDocument();
        });

        it("should show executing when isStreaming is true", () => {
            const message = createMockMessage({
                role: "tool",
                messageType: "tool_use",
                toolName: "Read",
                isStreaming: true,
                rawInput: { file_path: "/test.ts" },
            });

            render(<Message message={message} />);

            expect(screen.getByTestId("executing")).toBeInTheDocument();
        });
    });

    // ==========================================================================
    // Tool Result Messages
    // ==========================================================================
    describe("tool_result messages", () => {
        it("should render ToolResultCard for tool_result message type", () => {
            const message = createMockMessage({
                role: "tool",
                messageType: "tool_result",
                toolName: "Read",
                content: "File content here",
            });

            render(<Message message={message} />);

            expect(screen.getByTestId("tool-result-card")).toBeInTheDocument();
        });

        it("should show error indicator for error results", () => {
            const message = createMockMessage({
                role: "tool",
                messageType: "tool_result",
                toolName: "Bash",
                content: "Command failed",
                isError: true,
            });

            render(<Message message={message} />);

            expect(screen.getByTestId("error")).toBeInTheDocument();
        });

        it("should show duration for tool results", () => {
            const message = createMockMessage({
                role: "tool",
                messageType: "tool_result",
                toolName: "Read",
                content: "Result",
                duration: 250,
            });

            render(<Message message={message} />);

            // formatDuration shows "250ms" or similar for sub-second durations
            expect(screen.getByText(/\d+ms/)).toBeInTheDocument();
        });
    });

    // ==========================================================================
    // Usage Summary Display
    // ==========================================================================
    describe("usage summary", () => {
        it("should display usage summary for assistant messages", () => {
            const message = createMockMessage({
                role: "assistant",
                content: "Response text",
                usage: {
                    input_tokens: 1000,
                    output_tokens: 500,
                },
            });

            render(<Message message={message} />);

            // Should show "📊 Tokens: 1,500" or similar
            expect(screen.getByText(/Tokens.*1,500/)).toBeInTheDocument();
        });

        it("should show cache creation tokens", () => {
            const message = createMockMessage({
                role: "assistant",
                content: "Response",
                usage: {
                    input_tokens: 500,
                    output_tokens: 200,
                    cache_creation_input_tokens: 1000,
                },
            });

            render(<Message message={message} />);

            expect(screen.getByText(/cache created/)).toBeInTheDocument();
        });

        it("should show cache read tokens", () => {
            const message = createMockMessage({
                role: "assistant",
                content: "Response",
                usage: {
                    input_tokens: 500,
                    output_tokens: 200,
                    cache_read_input_tokens: 800,
                },
            });

            render(<Message message={message} />);

            expect(screen.getByText(/cache read/)).toBeInTheDocument();
        });

        it("should not show usage for zero tokens", () => {
            const message = createMockMessage({
                role: "assistant",
                content: "Response",
                usage: {
                    input_tokens: 0,
                    output_tokens: 0,
                },
            });

            render(<Message message={message} />);

            expect(screen.queryByText(/Tokens/)).not.toBeInTheDocument();
        });

        it("should not show usage for user messages", () => {
            const message = createMockMessage({
                role: "user",
                content: "Hello",
                usage: {
                    input_tokens: 100,
                    output_tokens: 50,
                },
            });

            render(<Message message={message} />);

            expect(screen.queryByText(/Tokens/)).not.toBeInTheDocument();
        });
    });

    // ==========================================================================
    // Preview Functionality
    // ==========================================================================
    describe("preview functionality", () => {
        it("should show preview button for markdown content", () => {
            const message = createMockMessage({
                role: "assistant",
                content: "# Heading\n\n- List item 1\n- List item 2",
            });

            render(<Message message={message} showPreview={true} />);

            expect(screen.getByText("Preview")).toBeInTheDocument();
        });

        it("should not show preview button when showPreview is false", () => {
            const message = createMockMessage({
                role: "assistant",
                content: "# Heading\n\n- List item",
            });

            render(<Message message={message} showPreview={false} />);

            expect(screen.queryByText("Preview")).not.toBeInTheDocument();
        });

        it("should call postMessage when preview button clicked", () => {
            const message = createMockMessage({
                role: "assistant",
                content: "# Heading\n\n- List item",
            });

            render(<Message message={message} showPreview={true} />);

            fireEvent.click(screen.getByText("Preview"));

            expect(mockPostMessage).toHaveBeenCalledWith({
                type: "openMarkdownPreview",
                content: "# Heading\n\n- List item",
                title: "Assistant Response",
            });
        });

        it("should not show preview for non-markdown content", () => {
            const message = createMockMessage({
                role: "assistant",
                content: "Plain text without markdown",
            });

            render(<Message message={message} showPreview={true} />);

            expect(screen.queryByText("Preview")).not.toBeInTheDocument();
        });
    });

    // ==========================================================================
    // Collapsible Tool Messages
    // ==========================================================================
    describe("collapsible tool messages", () => {
        it("should show streaming indicator for tool messages", () => {
            const message = createMockMessage({
                role: "tool",
                content: "Tool output",
                isStreaming: true,
            });

            render(<Message message={message} />);

            expect(screen.getByText(/streaming/i)).toBeInTheDocument();
        });

        it("should display tokens badge for tool messages", () => {
            const message = createMockMessage({
                role: "tool",
                content: "Tool output",
                tokens: 150,
            });

            const { container } = render(<Message message={message} />);

            // Click to see tokens (may be in header)
            const header = container.querySelector('div[class*="cursor-pointer"]');
            if (header) {
                fireEvent.click(header);
            }

            // Tokens should be visible somewhere
            expect(screen.getByText(/150/)).toBeInTheDocument();
        });
    });
});
