import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MessageInput } from "../../webview/components/Chat/MessageInput";
import { ThinkingIntensity } from "../../shared/constants";

describe("MessageInput", () => {
    const defaultProps = {
        disabled: false,
        currentModel: "claude-sonnet-4-5-20250929",
        planMode: false,
        thinkingMode: false,
        thinkingIntensity: ThinkingIntensity.Think,
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
        it("should render the textarea", () => {
            render(<MessageInput {...defaultProps} />);

            expect(screen.getByPlaceholderText("How can I help you?")).toBeInTheDocument();
        });

        it("should show disabled placeholder when disabled", () => {
            render(<MessageInput {...defaultProps} disabled={true} />);

            expect(screen.getByPlaceholderText("Claude is thinking...")).toBeInTheDocument();
        });

        it("should render model selector", () => {
            render(<MessageInput {...defaultProps} />);

            expect(screen.getByText("Sonnet 4.5")).toBeInTheDocument();
        });

        it("should render thinking mode button", () => {
            render(<MessageInput {...defaultProps} />);

            expect(screen.getByText("Think")).toBeInTheDocument();
        });

        it("should render plan mode button", () => {
            render(<MessageInput {...defaultProps} />);

            expect(screen.getByText("Plan")).toBeInTheDocument();
        });

        it("should render YOLO mode button", () => {
            render(<MessageInput {...defaultProps} />);

            expect(screen.getByText("YOLO")).toBeInTheDocument();
        });

        it("should render send button", () => {
            render(<MessageInput {...defaultProps} />);

            // Send button has an SVG icon
            const buttons = screen.getAllByRole("button");
            expect(buttons.length).toBeGreaterThan(0);
        });

        it("should render MCP and command buttons", () => {
            render(<MessageInput {...defaultProps} />);

            expect(screen.getByTitle("MCP Tools")).toBeInTheDocument();
            expect(screen.getByTitle("Commands (/)")).toBeInTheDocument();
        });
    });

    describe("textarea input", () => {
        it("should update content when typing", () => {
            render(<MessageInput {...defaultProps} />);

            const textarea = screen.getByPlaceholderText("How can I help you?");
            fireEvent.change(textarea, { target: { value: "Hello world" } });

            expect(textarea).toHaveValue("Hello world");
        });

        it("should be disabled when disabled prop is true", () => {
            render(<MessageInput {...defaultProps} disabled={true} />);

            const textarea = screen.getByPlaceholderText("Claude is thinking...");
            expect(textarea).toBeDisabled();
        });
    });

    describe("message submission", () => {
        it("should call onSendMessage with trimmed content on Enter", () => {
            const onSendMessage = vi.fn();
            render(<MessageInput {...defaultProps} onSendMessage={onSendMessage} />);

            const textarea = screen.getByPlaceholderText("How can I help you?");
            fireEvent.change(textarea, { target: { value: "  Hello world  " } });
            fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

            expect(onSendMessage).toHaveBeenCalledWith("Hello world");
        });

        it("should not submit on Shift+Enter", () => {
            const onSendMessage = vi.fn();
            render(<MessageInput {...defaultProps} onSendMessage={onSendMessage} />);

            const textarea = screen.getByPlaceholderText("How can I help you?");
            fireEvent.change(textarea, { target: { value: "Hello world" } });
            fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });

            expect(onSendMessage).not.toHaveBeenCalled();
        });

        it("should not submit empty content", () => {
            const onSendMessage = vi.fn();
            render(<MessageInput {...defaultProps} onSendMessage={onSendMessage} />);

            const textarea = screen.getByPlaceholderText("How can I help you?");
            fireEvent.change(textarea, { target: { value: "   " } });
            fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

            expect(onSendMessage).not.toHaveBeenCalled();
        });

        it("should not submit when disabled", () => {
            const onSendMessage = vi.fn();
            render(
                <MessageInput {...defaultProps} disabled={true} onSendMessage={onSendMessage} />,
            );

            // Textarea is disabled, so we can't type in it
            expect(onSendMessage).not.toHaveBeenCalled();
        });

        it("should clear content after submission", () => {
            render(<MessageInput {...defaultProps} />);

            const textarea = screen.getByPlaceholderText("How can I help you?");
            fireEvent.change(textarea, { target: { value: "Hello world" } });
            fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

            expect(textarea).toHaveValue("");
        });
    });

    describe("model selector", () => {
        it("should show model dropdown when clicked", () => {
            render(<MessageInput {...defaultProps} />);

            fireEvent.click(screen.getByText("Sonnet 4.5"));

            expect(screen.getByText("Claude Sonnet 4.5")).toBeInTheDocument();
            expect(screen.getByText("Claude Opus 4.5")).toBeInTheDocument();
            expect(screen.getByText("Claude Haiku 4.5")).toBeInTheDocument();
        });

        it("should call onModelChange when model is selected", () => {
            const onModelChange = vi.fn();
            render(<MessageInput {...defaultProps} onModelChange={onModelChange} />);

            fireEvent.click(screen.getByText("Sonnet 4.5"));
            fireEvent.click(screen.getByText("Claude Opus 4.5"));

            expect(onModelChange).toHaveBeenCalledWith("claude-opus-4-5-20251101");
        });

        it("should close dropdown after selection", () => {
            render(<MessageInput {...defaultProps} />);

            fireEvent.click(screen.getByText("Sonnet 4.5"));
            expect(screen.getByText("Claude Opus 4.5")).toBeInTheDocument();

            fireEvent.click(screen.getByText("Claude Opus 4.5"));
            expect(screen.queryByText("Claude Opus 4.5")).not.toBeInTheDocument();
        });

        it("should display correct model name for Opus", () => {
            render(<MessageInput {...defaultProps} currentModel="claude-opus-4-5-20251101" />);

            expect(screen.getByText("Opus 4.5")).toBeInTheDocument();
        });

        it("should display correct model name for Haiku", () => {
            render(<MessageInput {...defaultProps} currentModel="claude-haiku-4-5-20251001" />);

            expect(screen.getByText("Haiku 4.5")).toBeInTheDocument();
        });
    });

    describe("thinking mode", () => {
        it("should show thinking selector when clicked", () => {
            render(<MessageInput {...defaultProps} />);

            fireEvent.click(screen.getByText("Think"));

            expect(screen.getByText("Think Hard")).toBeInTheDocument();
            expect(screen.getByText("Think Harder")).toBeInTheDocument();
            expect(screen.getByText("Ultrathink")).toBeInTheDocument();
        });

        it("should show current thinking intensity when mode is on", () => {
            render(
                <MessageInput
                    {...defaultProps}
                    thinkingMode={true}
                    thinkingIntensity={ThinkingIntensity.ThinkHard}
                />,
            );

            expect(screen.getByText("Think Hard")).toBeInTheDocument();
        });

        it("should call onThinkingIntensityChange when intensity selected", () => {
            const onThinkingIntensityChange = vi.fn();
            const onThinkingModeToggle = vi.fn();
            render(
                <MessageInput
                    {...defaultProps}
                    onThinkingIntensityChange={onThinkingIntensityChange}
                    onThinkingModeToggle={onThinkingModeToggle}
                />,
            );

            fireEvent.click(screen.getByText("Think"));
            fireEvent.click(screen.getByText("Ultrathink"));

            expect(onThinkingIntensityChange).toHaveBeenCalledWith(ThinkingIntensity.Ultrathink);
        });

        it("should toggle thinking mode when selecting intensity with mode off", () => {
            const onThinkingModeToggle = vi.fn();
            render(
                <MessageInput
                    {...defaultProps}
                    thinkingMode={false}
                    onThinkingModeToggle={onThinkingModeToggle}
                />,
            );

            fireEvent.click(screen.getByText("Think"));
            fireEvent.click(screen.getByText("Think Harder"));

            expect(onThinkingModeToggle).toHaveBeenCalled();
        });

        it("should show enable thinking toggle", () => {
            render(<MessageInput {...defaultProps} />);

            fireEvent.click(screen.getByText("Think"));

            expect(screen.getByText("Enable Thinking")).toBeInTheDocument();
        });
    });

    describe("plan mode", () => {
        it("should call onPlanModeToggle when Plan button clicked", () => {
            const onPlanModeToggle = vi.fn();
            render(<MessageInput {...defaultProps} onPlanModeToggle={onPlanModeToggle} />);

            fireEvent.click(screen.getByText("Plan"));

            expect(onPlanModeToggle).toHaveBeenCalledTimes(1);
        });

        it("should show active style when plan mode is on", () => {
            render(<MessageInput {...defaultProps} planMode={true} />);

            const planButton = screen.getByText("Plan").closest("button");
            expect(planButton).toHaveClass("text-blue-400");
        });
    });

    describe("YOLO mode", () => {
        it("should call onYoloModeToggle when YOLO button clicked", () => {
            const onYoloModeToggle = vi.fn();
            render(<MessageInput {...defaultProps} onYoloModeToggle={onYoloModeToggle} />);

            fireEvent.click(screen.getByText("YOLO"));

            expect(onYoloModeToggle).toHaveBeenCalledTimes(1);
        });

        it("should show active style when yolo mode is on", () => {
            render(<MessageInput {...defaultProps} yoloMode={true} />);

            const yoloButton = screen.getByText("YOLO").closest("button");
            expect(yoloButton).toHaveClass("text-red-400");
        });
    });

    describe("toolbar buttons", () => {
        it("should call onMcpAction when MCP button clicked", () => {
            const onMcpAction = vi.fn();
            render(<MessageInput {...defaultProps} onMcpAction={onMcpAction} />);

            fireEvent.click(screen.getByTitle("MCP Tools"));

            expect(onMcpAction).toHaveBeenCalledTimes(1);
        });

        it("should call onSlashCommand when command button clicked", () => {
            const onSlashCommand = vi.fn();
            render(<MessageInput {...defaultProps} onSlashCommand={onSlashCommand} />);

            fireEvent.click(screen.getByTitle("Commands (/)"));

            expect(onSlashCommand).toHaveBeenCalledTimes(1);
        });
    });

    describe("send button state", () => {
        it("should be disabled when content is empty", () => {
            const onSendMessage = vi.fn();
            render(<MessageInput {...defaultProps} onSendMessage={onSendMessage} />);

            // Find send button (last button)
            const buttons = screen.getAllByRole("button");
            const sendButton = buttons[buttons.length - 1];

            fireEvent.click(sendButton);
            expect(onSendMessage).not.toHaveBeenCalled();
        });

        it("should be disabled when disabled prop is true", () => {
            render(<MessageInput {...defaultProps} disabled={true} />);

            const buttons = screen.getAllByRole("button");
            const sendButton = buttons[buttons.length - 1];

            expect(sendButton).toHaveClass("cursor-not-allowed");
        });

        it("should call onSendMessage when clicked with content", () => {
            const onSendMessage = vi.fn();
            render(<MessageInput {...defaultProps} onSendMessage={onSendMessage} />);

            const textarea = screen.getByPlaceholderText("How can I help you?");
            fireEvent.change(textarea, { target: { value: "Hello" } });

            const buttons = screen.getAllByRole("button");
            const sendButton = buttons[buttons.length - 1];
            fireEvent.click(sendButton);

            expect(onSendMessage).toHaveBeenCalledWith("Hello");
        });
    });

    describe("dropdown closing", () => {
        it("should close model selector when clicking outside", () => {
            render(<MessageInput {...defaultProps} />);

            // Open dropdown
            fireEvent.click(screen.getByText("Sonnet 4.5"));
            expect(screen.getByText("Claude Opus 4.5")).toBeInTheDocument();

            // Click outside
            fireEvent.mouseDown(document.body);

            expect(screen.queryByText("Claude Opus 4.5")).not.toBeInTheDocument();
        });

        it("should close thinking selector when clicking outside", () => {
            render(<MessageInput {...defaultProps} />);

            // Open dropdown
            fireEvent.click(screen.getByText("Think"));
            expect(screen.getByText("Ultrathink")).toBeInTheDocument();

            // Click outside
            fireEvent.mouseDown(document.body);

            expect(screen.queryByText("Ultrathink")).not.toBeInTheDocument();
        });
    });

    describe("draft persistence", () => {
        beforeEach(() => {
            // Clear localStorage before each test
            localStorage.clear();
        });

        it("should save draft to localStorage when typing", () => {
            render(<MessageInput {...defaultProps} sessionId="session-123" />);

            const textarea = screen.getByPlaceholderText("How can I help you?");
            fireEvent.change(textarea, { target: { value: "My draft message" } });

            expect(localStorage.getItem("claude-code-gui-draft-session-123")).toBe(
                "My draft message",
            );
        });

        it("should use global key when no sessionId provided", () => {
            render(<MessageInput {...defaultProps} sessionId={null} />);

            const textarea = screen.getByPlaceholderText("How can I help you?");
            fireEvent.change(textarea, { target: { value: "Global draft" } });

            expect(localStorage.getItem("claude-code-gui-draft-global")).toBe("Global draft");
        });

        it("should restore draft from localStorage on mount", () => {
            localStorage.setItem("claude-code-gui-draft-session-456", "Saved draft text");

            render(<MessageInput {...defaultProps} sessionId="session-456" />);

            const textarea = screen.getByPlaceholderText("How can I help you?");
            expect(textarea).toHaveValue("Saved draft text");
        });

        it("should keep separate drafts for different sessions", () => {
            // Save two different drafts
            localStorage.setItem("claude-code-gui-draft-session-A", "Draft for session A");
            localStorage.setItem("claude-code-gui-draft-session-B", "Draft for session B");

            // Render with session A
            const { rerender } = render(<MessageInput {...defaultProps} sessionId="session-A" />);
            expect(screen.getByPlaceholderText("How can I help you?")).toHaveValue(
                "Draft for session A",
            );

            // Switch to session B
            rerender(<MessageInput {...defaultProps} sessionId="session-B" />);
            expect(screen.getByPlaceholderText("How can I help you?")).toHaveValue(
                "Draft for session B",
            );

            // Switch back to session A
            rerender(<MessageInput {...defaultProps} sessionId="session-A" />);
            expect(screen.getByPlaceholderText("How can I help you?")).toHaveValue(
                "Draft for session A",
            );
        });

        it("should clear draft from localStorage when message is sent", () => {
            localStorage.setItem("claude-code-gui-draft-session-789", "Draft to send");

            render(<MessageInput {...defaultProps} sessionId="session-789" />);

            const textarea = screen.getByPlaceholderText("How can I help you?");
            expect(textarea).toHaveValue("Draft to send");

            // Send the message
            fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

            // Draft should be cleared
            expect(localStorage.getItem("claude-code-gui-draft-session-789")).toBeNull();
        });

        it("should remove localStorage entry when content is cleared", () => {
            render(<MessageInput {...defaultProps} sessionId="session-clear" />);

            const textarea = screen.getByPlaceholderText("How can I help you?");

            // Type something
            fireEvent.change(textarea, { target: { value: "Some text" } });
            expect(localStorage.getItem("claude-code-gui-draft-session-clear")).toBe("Some text");

            // Clear the text
            fireEvent.change(textarea, { target: { value: "" } });
            expect(localStorage.getItem("claude-code-gui-draft-session-clear")).toBeNull();
        });

        it("should load correct draft when switching from null session to specific session", () => {
            localStorage.setItem("claude-code-gui-draft-global", "Global draft");
            localStorage.setItem("claude-code-gui-draft-session-new", "Session draft");

            const { rerender } = render(<MessageInput {...defaultProps} sessionId={null} />);
            expect(screen.getByPlaceholderText("How can I help you?")).toHaveValue("Global draft");

            rerender(<MessageInput {...defaultProps} sessionId="session-new" />);
            expect(screen.getByPlaceholderText("How can I help you?")).toHaveValue("Session draft");
        });
    });
});
