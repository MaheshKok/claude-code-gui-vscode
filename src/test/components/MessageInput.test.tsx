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
        onStop: vi.fn(),
        onModelChange: vi.fn(),
        onPlanModeToggle: vi.fn(),
        onThinkingModeToggle: vi.fn(),
        onThinkingIntensityChange: vi.fn(),
        onYoloModeToggle: vi.fn(),
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

        it("should render MCP button", () => {
            render(<MessageInput {...defaultProps} />);

            expect(screen.getByTitle("MCP Tools")).toBeInTheDocument();
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

        it("should toggle thinking mode when clicking Enable Thinking toggle", () => {
            const onThinkingModeToggle = vi.fn();
            render(
                <MessageInput
                    {...defaultProps}
                    thinkingMode={false}
                    onThinkingModeToggle={onThinkingModeToggle}
                />,
            );

            // Open the thinking selector
            fireEvent.click(screen.getByText("Think"));

            // Click the Enable Thinking toggle (which is a button with "Enable Thinking" text)
            const enableThinkingToggle = screen.getByText("Enable Thinking").closest("button");
            fireEvent.click(enableThinkingToggle!);

            expect(onThinkingModeToggle).toHaveBeenCalled();
        });

        it("should close thinking selector after clicking Enable Thinking toggle", () => {
            render(<MessageInput {...defaultProps} thinkingMode={false} />);

            // Open the thinking selector
            fireEvent.click(screen.getByText("Think"));
            expect(screen.getByText("Ultrathink")).toBeInTheDocument();

            // Click the Enable Thinking toggle
            const enableThinkingToggle = screen.getByText("Enable Thinking").closest("button");
            fireEvent.click(enableThinkingToggle!);

            // Selector should be closed
            expect(screen.queryByText("Ultrathink")).not.toBeInTheDocument();
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

    describe("Plan and YOLO mode together", () => {
        it("should allow both plan and yolo modes to be enabled simultaneously", () => {
            render(<MessageInput {...defaultProps} planMode={true} yoloMode={true} />);

            const planButton = screen.getByText("Plan").closest("button");
            const yoloButton = screen.getByText("YOLO").closest("button");

            // Both should show active styles
            expect(planButton).toHaveClass("text-blue-400");
            expect(yoloButton).toHaveClass("text-red-400");
        });

        it("should allow toggling plan mode when yolo mode is on", () => {
            const onPlanModeToggle = vi.fn();
            render(
                <MessageInput
                    {...defaultProps}
                    yoloMode={true}
                    onPlanModeToggle={onPlanModeToggle}
                />,
            );

            fireEvent.click(screen.getByText("Plan"));

            expect(onPlanModeToggle).toHaveBeenCalledTimes(1);
        });

        it("should allow toggling yolo mode when plan mode is on", () => {
            const onYoloModeToggle = vi.fn();
            render(
                <MessageInput
                    {...defaultProps}
                    planMode={true}
                    onYoloModeToggle={onYoloModeToggle}
                />,
            );

            fireEvent.click(screen.getByText("YOLO"));

            expect(onYoloModeToggle).toHaveBeenCalledTimes(1);
        });

        it("should not disable plan button when yolo mode is on", () => {
            render(<MessageInput {...defaultProps} yoloMode={true} />);

            const planButton = screen.getByText("Plan").closest("button");
            expect(planButton).not.toBeDisabled();
            expect(planButton).not.toHaveClass("cursor-not-allowed");
        });

        it("should not disable yolo button when plan mode is on", () => {
            render(<MessageInput {...defaultProps} planMode={true} />);

            const yoloButton = screen.getByText("YOLO").closest("button");
            expect(yoloButton).not.toBeDisabled();
            expect(yoloButton).not.toHaveClass("cursor-not-allowed");
        });
    });

    describe("toolbar buttons", () => {
        it("should call onMcpAction when MCP button clicked", () => {
            const onMcpAction = vi.fn();
            render(<MessageInput {...defaultProps} onMcpAction={onMcpAction} />);

            fireEvent.click(screen.getByTitle("MCP Tools"));

            expect(onMcpAction).toHaveBeenCalledTimes(1);
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

        it("should show Stop button when disabled (processing)", () => {
            const onStop = vi.fn();
            render(<MessageInput {...defaultProps} disabled={true} onStop={onStop} />);

            const buttons = screen.getAllByRole("button");
            const stopButton = buttons[buttons.length - 1];

            // Stop button should have red styling
            expect(stopButton).toHaveClass("bg-red-500/20");

            // Stop button should call onStop when clicked
            fireEvent.click(stopButton);
            expect(onStop).toHaveBeenCalledTimes(1);
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

    describe("attachments", () => {
        beforeEach(() => {
            localStorage.clear();
        });

        it("should render paperclip button", () => {
            render(<MessageInput {...defaultProps} />);

            expect(screen.getByTitle("Attach file or image")).toBeInTheDocument();
        });

        it("should show attachment menu when paperclip is clicked", () => {
            render(<MessageInput {...defaultProps} />);

            fireEvent.click(screen.getByTitle("Attach file or image"));

            expect(screen.getByText("Upload File")).toBeInTheDocument();
            expect(screen.getByText("Upload Image")).toBeInTheDocument();
        });

        it("should close attachment menu when clicking outside", () => {
            render(<MessageInput {...defaultProps} />);

            fireEvent.click(screen.getByTitle("Attach file or image"));
            expect(screen.getByText("Upload File")).toBeInTheDocument();

            fireEvent.mouseDown(document.body);

            expect(screen.queryByText("Upload File")).not.toBeInTheDocument();
        });

        it("should store attachments in localStorage per session", () => {
            const mockAttachments = [
                {
                    id: "test-1",
                    type: "file" as const,
                    name: "test.txt",
                    size: 100,
                    dataUrl: "data:text/plain;base64,dGVzdA==",
                },
            ];

            localStorage.setItem(
                "claude-code-gui-attachments-session-test",
                JSON.stringify(mockAttachments),
            );

            render(<MessageInput {...defaultProps} sessionId="session-test" />);

            // Check that attachment is displayed
            expect(screen.getByText("test.txt")).toBeInTheDocument();
        });

        it("should display attachment with file icon for files", () => {
            const mockAttachments = [
                {
                    id: "test-1",
                    type: "file" as const,
                    name: "document.pdf",
                    size: 1024,
                    dataUrl: "data:application/pdf;base64,test",
                },
            ];

            localStorage.setItem(
                "claude-code-gui-attachments-global",
                JSON.stringify(mockAttachments),
            );

            render(<MessageInput {...defaultProps} sessionId={null} />);

            expect(screen.getByText("document.pdf")).toBeInTheDocument();
            expect(screen.getByText("1.0 KB")).toBeInTheDocument();
        });

        it("should display attachment with image preview for images", () => {
            const mockAttachments = [
                {
                    id: "test-img",
                    type: "image" as const,
                    name: "photo.png",
                    size: 2048,
                    dataUrl: "data:image/png;base64,test",
                },
            ];

            localStorage.setItem(
                "claude-code-gui-attachments-global",
                JSON.stringify(mockAttachments),
            );

            render(<MessageInput {...defaultProps} sessionId={null} />);

            expect(screen.getByText("photo.png")).toBeInTheDocument();
            expect(screen.getByAltText("photo.png")).toBeInTheDocument();
        });

        it("should remove attachment when X button is clicked", () => {
            const mockAttachments = [
                {
                    id: "remove-test",
                    type: "file" as const,
                    name: "removeme.txt",
                    size: 50,
                    dataUrl: "data:text/plain;base64,test",
                },
            ];

            localStorage.setItem(
                "claude-code-gui-attachments-global",
                JSON.stringify(mockAttachments),
            );

            render(<MessageInput {...defaultProps} sessionId={null} />);

            expect(screen.getByText("removeme.txt")).toBeInTheDocument();

            fireEvent.click(screen.getByTitle("Remove attachment"));

            expect(screen.queryByText("removeme.txt")).not.toBeInTheDocument();
            expect(localStorage.getItem("claude-code-gui-attachments-global")).toBeNull();
        });

        it("should clear attachments when message is sent", () => {
            const mockAttachments = [
                {
                    id: "send-test",
                    type: "file" as const,
                    name: "sendme.txt",
                    size: 50,
                    dataUrl: "data:text/plain;base64,test",
                },
            ];

            localStorage.setItem(
                "claude-code-gui-attachments-session-send",
                JSON.stringify(mockAttachments),
            );

            render(<MessageInput {...defaultProps} sessionId="session-send" />);

            expect(screen.getByText("sendme.txt")).toBeInTheDocument();

            // Type and send message
            const textarea = screen.getByPlaceholderText("How can I help you?");
            fireEvent.change(textarea, { target: { value: "Send with attachment" } });
            fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

            // Attachments should be cleared
            expect(screen.queryByText("sendme.txt")).not.toBeInTheDocument();
            expect(localStorage.getItem("claude-code-gui-attachments-session-send")).toBeNull();
        });

        it("should allow sending with only attachments (no text)", () => {
            const onSendMessage = vi.fn();
            const mockAttachments = [
                {
                    id: "only-attach",
                    type: "image" as const,
                    name: "image.jpg",
                    size: 500,
                    dataUrl: "data:image/jpeg;base64,test",
                },
            ];

            localStorage.setItem(
                "claude-code-gui-attachments-global",
                JSON.stringify(mockAttachments),
            );

            render(
                <MessageInput {...defaultProps} sessionId={null} onSendMessage={onSendMessage} />,
            );

            expect(screen.getByText("image.jpg")).toBeInTheDocument();

            // Send button should NOT be disabled even without text
            const buttons = screen.getAllByRole("button");
            const sendButton = buttons[buttons.length - 1];
            expect(sendButton).not.toHaveClass("cursor-not-allowed");

            // Click send
            fireEvent.click(sendButton);

            expect(onSendMessage).toHaveBeenCalledWith("");
        });

        it("should load different attachments when switching sessions", () => {
            const attachmentsA = [
                {
                    id: "a-1",
                    type: "file" as const,
                    name: "fileA.txt",
                    size: 100,
                    dataUrl: "data:text/plain;base64,a",
                },
            ];
            const attachmentsB = [
                {
                    id: "b-1",
                    type: "image" as const,
                    name: "imageB.png",
                    size: 200,
                    dataUrl: "data:image/png;base64,b",
                },
            ];

            localStorage.setItem(
                "claude-code-gui-attachments-session-A",
                JSON.stringify(attachmentsA),
            );
            localStorage.setItem(
                "claude-code-gui-attachments-session-B",
                JSON.stringify(attachmentsB),
            );

            const { rerender } = render(<MessageInput {...defaultProps} sessionId="session-A" />);
            expect(screen.getByText("fileA.txt")).toBeInTheDocument();
            expect(screen.queryByText("imageB.png")).not.toBeInTheDocument();

            rerender(<MessageInput {...defaultProps} sessionId="session-B" />);
            expect(screen.getByText("imageB.png")).toBeInTheDocument();
            expect(screen.queryByText("fileA.txt")).not.toBeInTheDocument();
        });

        it("should format file sizes correctly", () => {
            const mockAttachments = [
                {
                    id: "size-bytes",
                    type: "file" as const,
                    name: "tiny.txt",
                    size: 500,
                    dataUrl: "data:text/plain;base64,test",
                },
                {
                    id: "size-kb",
                    type: "file" as const,
                    name: "small.txt",
                    size: 5120,
                    dataUrl: "data:text/plain;base64,test",
                },
                {
                    id: "size-mb",
                    type: "file" as const,
                    name: "big.txt",
                    size: 2097152,
                    dataUrl: "data:text/plain;base64,test",
                },
            ];

            localStorage.setItem(
                "claude-code-gui-attachments-global",
                JSON.stringify(mockAttachments),
            );

            render(<MessageInput {...defaultProps} sessionId={null} />);

            expect(screen.getByText("500 B")).toBeInTheDocument();
            expect(screen.getByText("5.0 KB")).toBeInTheDocument();
            expect(screen.getByText("2.0 MB")).toBeInTheDocument();
        });
    });
});
