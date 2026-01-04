import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SlashCommandsModal } from "../../webview/components/Modals/SlashCommandsModal";
import type { SlashCommand } from "../../webview/components/Modals/SlashCommandsModal";

describe("SlashCommandsModal", () => {
    const mockCustomCommands: SlashCommand[] = [
        {
            id: "custom-1",
            name: "/my-command",
            icon: "⚡",
            description: "My custom command",
            type: "custom",
            prompt: "Do something custom",
        },
    ];

    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        customCommands: mockCustomCommands,
        onExecuteCommand: vi.fn(),
        onAddCustomCommand: vi.fn(),
        onDeleteCustomCommand: vi.fn(),
        onQuickCommand: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("rendering", () => {
        it("should render modal when open", () => {
            render(<SlashCommandsModal {...defaultProps} />);

            expect(screen.getByText("Commands & Prompt Snippets")).toBeInTheDocument();
        });

        it("should not render when closed", () => {
            render(<SlashCommandsModal {...defaultProps} isOpen={false} />);

            expect(screen.queryByText("Commands & Prompt Snippets")).not.toBeInTheDocument();
        });

        it("should show search input", () => {
            render(<SlashCommandsModal {...defaultProps} />);

            expect(
                screen.getByPlaceholderText("Search commands and snippets...")
            ).toBeInTheDocument();
        });

        it("should show Custom Commands section", () => {
            render(<SlashCommandsModal {...defaultProps} />);

            expect(screen.getByText("Custom Commands")).toBeInTheDocument();
        });

        it("should show Built-in Commands section", () => {
            render(<SlashCommandsModal {...defaultProps} />);

            expect(screen.getByText("Built-in Commands")).toBeInTheDocument();
        });

        it("should display custom commands", () => {
            render(<SlashCommandsModal {...defaultProps} />);

            expect(screen.getByText("/my-command")).toBeInTheDocument();
            expect(screen.getByText("My custom command")).toBeInTheDocument();
        });
    });

    describe("built-in commands", () => {
        it("should show help command", () => {
            render(<SlashCommandsModal {...defaultProps} />);

            expect(screen.getByText("/help")).toBeInTheDocument();
        });

        it("should show clear command", () => {
            render(<SlashCommandsModal {...defaultProps} />);

            expect(screen.getByText("/clear")).toBeInTheDocument();
        });

        it("should show init command", () => {
            render(<SlashCommandsModal {...defaultProps} />);

            expect(screen.getByText("/init")).toBeInTheDocument();
        });

        it("should execute command on click", () => {
            const onExecuteCommand = vi.fn();
            render(<SlashCommandsModal {...defaultProps} onExecuteCommand={onExecuteCommand} />);

            fireEvent.click(screen.getByText("/help"));

            expect(onExecuteCommand).toHaveBeenCalled();
            expect(onExecuteCommand.mock.calls[0][0].name).toBe("/help");
        });
    });

    describe("search functionality", () => {
        it("should filter commands based on search", () => {
            render(<SlashCommandsModal {...defaultProps} />);

            const searchInput = screen.getByPlaceholderText("Search commands and snippets...");
            fireEvent.change(searchInput, { target: { value: "help" } });

            expect(screen.getByText("/help")).toBeInTheDocument();
            expect(screen.queryByText("/init")).not.toBeInTheDocument();
        });

        it("should filter by description", () => {
            render(<SlashCommandsModal {...defaultProps} />);

            const searchInput = screen.getByPlaceholderText("Search commands and snippets...");
            fireEvent.change(searchInput, { target: { value: "usage" } });

            // The /usage command should be visible
            expect(screen.getByText("/usage")).toBeInTheDocument();
        });

        it("should show all commands when search is empty", () => {
            render(<SlashCommandsModal {...defaultProps} />);

            const searchInput = screen.getByPlaceholderText("Search commands and snippets...");
            fireEvent.change(searchInput, { target: { value: "" } });

            expect(screen.getByText("/help")).toBeInTheDocument();
            expect(screen.getByText("/clear")).toBeInTheDocument();
        });
    });

    describe("custom commands", () => {
        it("should show Add Custom Command button", () => {
            render(<SlashCommandsModal {...defaultProps} />);

            expect(screen.getByText("Add Custom Command")).toBeInTheDocument();
        });

        it("should show form when Add Custom Command clicked", () => {
            render(<SlashCommandsModal {...defaultProps} />);

            fireEvent.click(screen.getByText("Add Custom Command"));

            expect(screen.getByLabelText("Command name:")).toBeInTheDocument();
            expect(screen.getByLabelText("Prompt Text:")).toBeInTheDocument();
        });

        it("should call onAddCustomCommand when form submitted", () => {
            const onAddCustomCommand = vi.fn();
            render(
                <SlashCommandsModal {...defaultProps} onAddCustomCommand={onAddCustomCommand} />
            );

            fireEvent.click(screen.getByText("Add Custom Command"));

            fireEvent.change(screen.getByLabelText("Command name:"), {
                target: { value: "test-cmd" },
            });
            fireEvent.change(screen.getByLabelText("Prompt Text:"), {
                target: { value: "Test prompt" },
            });

            fireEvent.click(screen.getByText("Save Command"));

            expect(onAddCustomCommand).toHaveBeenCalledWith("test-cmd", "Test prompt");
        });

        it("should hide form when Cancel clicked", () => {
            render(<SlashCommandsModal {...defaultProps} />);

            fireEvent.click(screen.getByText("Add Custom Command"));
            expect(screen.getByLabelText("Command name:")).toBeInTheDocument();

            fireEvent.click(screen.getByText("Cancel"));

            expect(screen.queryByLabelText("Command name:")).not.toBeInTheDocument();
        });

        it("should disable Save button when form incomplete", () => {
            render(<SlashCommandsModal {...defaultProps} />);

            fireEvent.click(screen.getByText("Add Custom Command"));

            const saveButton = screen.getByText("Save Command");
            expect(saveButton).toBeDisabled();
        });

        it("should call onDeleteCustomCommand when delete clicked", () => {
            const onDeleteCustomCommand = vi.fn();
            render(
                <SlashCommandsModal
                    {...defaultProps}
                    onDeleteCustomCommand={onDeleteCustomCommand}
                />
            );

            const deleteButton = screen.getByLabelText("Delete command");
            fireEvent.click(deleteButton);

            expect(onDeleteCustomCommand).toHaveBeenCalledWith("custom-1");
        });
    });

    describe("snippets", () => {
        it("should show performance-analysis snippet", () => {
            render(<SlashCommandsModal {...defaultProps} />);

            expect(screen.getByText("/performance-analysis")).toBeInTheDocument();
        });

        it("should show security-review snippet", () => {
            render(<SlashCommandsModal {...defaultProps} />);

            expect(screen.getByText("/security-review")).toBeInTheDocument();
        });

        it("should show test-generation snippet", () => {
            render(<SlashCommandsModal {...defaultProps} />);

            expect(screen.getByText("/test-generation")).toBeInTheDocument();
        });

        it("should execute snippet on click", () => {
            const onExecuteCommand = vi.fn();
            render(<SlashCommandsModal {...defaultProps} onExecuteCommand={onExecuteCommand} />);

            fireEvent.click(screen.getByText("/security-review"));

            expect(onExecuteCommand).toHaveBeenCalled();
            const executedCommand = onExecuteCommand.mock.calls[0][0];
            expect(executedCommand.name).toBe("/security-review");
            expect(executedCommand.type).toBe("snippet");
        });
    });

    describe("quick command", () => {
        it("should show Quick Command input", () => {
            render(<SlashCommandsModal {...defaultProps} />);

            expect(screen.getByText("Quick Command")).toBeInTheDocument();
            expect(screen.getByPlaceholderText("enter-command")).toBeInTheDocument();
        });

        it("should call onQuickCommand on Enter", () => {
            const onQuickCommand = vi.fn();
            const onClose = vi.fn();
            render(
                <SlashCommandsModal
                    {...defaultProps}
                    onQuickCommand={onQuickCommand}
                    onClose={onClose}
                />
            );

            const quickInput = screen.getByPlaceholderText("enter-command");
            fireEvent.change(quickInput, { target: { value: "custom-cmd" } });
            fireEvent.keyDown(quickInput, { key: "Enter" });

            expect(onQuickCommand).toHaveBeenCalledWith("custom-cmd");
            expect(onClose).toHaveBeenCalled();
        });

        it("should not call onQuickCommand if input is empty", () => {
            const onQuickCommand = vi.fn();
            render(<SlashCommandsModal {...defaultProps} onQuickCommand={onQuickCommand} />);

            const quickInput = screen.getByPlaceholderText("enter-command");
            fireEvent.keyDown(quickInput, { key: "Enter" });

            expect(onQuickCommand).not.toHaveBeenCalled();
        });
    });

    describe("command execution", () => {
        it("should close modal when command executed", () => {
            const onClose = vi.fn();
            render(<SlashCommandsModal {...defaultProps} onClose={onClose} />);

            fireEvent.click(screen.getByText("/help"));

            expect(onClose).toHaveBeenCalled();
        });

        it("should close modal when custom command executed", () => {
            const onClose = vi.fn();
            render(<SlashCommandsModal {...defaultProps} onClose={onClose} />);

            fireEvent.click(screen.getByText("/my-command"));

            expect(onClose).toHaveBeenCalled();
        });
    });

    describe("empty custom commands", () => {
        it("should still show Add Custom Command when no custom commands", () => {
            render(<SlashCommandsModal {...defaultProps} customCommands={[]} />);

            expect(screen.getByText("Add Custom Command")).toBeInTheDocument();
        });
    });
});
