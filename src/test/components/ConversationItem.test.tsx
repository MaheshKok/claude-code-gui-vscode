import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConversationItem } from "../../webview/components/History/ConversationItem";
import type { ConversationListItem } from "../../webview/types/history";

describe("ConversationItem", () => {
    const mockConversation: ConversationListItem = {
        id: "conv-1",
        title: "Test Conversation",
        preview: "This is a preview of the conversation",
        messageCount: 10,
        createdAt: Date.now() - 86400000, // 1 day ago
        updatedAt: Date.now() - 3600000, // 1 hour ago
    };

    const defaultProps = {
        conversation: mockConversation,
        onClick: vi.fn(),
        onDelete: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("rendering", () => {
        it("should render conversation title", () => {
            render(<ConversationItem {...defaultProps} />);

            expect(screen.getByText("Test Conversation")).toBeInTheDocument();
        });

        it("should render conversation preview", () => {
            render(<ConversationItem {...defaultProps} />);

            expect(screen.getByText("This is a preview of the conversation")).toBeInTheDocument();
        });

        it("should render message count", () => {
            render(<ConversationItem {...defaultProps} />);

            expect(screen.getByText("10 msgs")).toBeInTheDocument();
        });

        it("should show 'No preview available' when preview is empty", () => {
            render(
                <ConversationItem
                    {...defaultProps}
                    conversation={{ ...mockConversation, preview: "" }}
                />,
            );

            expect(screen.getByText("No preview available")).toBeInTheDocument();
        });
    });

    describe("relative time formatting", () => {
        it("should show 'Just now' for recent updates", () => {
            render(
                <ConversationItem
                    {...defaultProps}
                    conversation={{ ...mockConversation, updatedAt: Date.now() }}
                />,
            );

            expect(screen.getByText("Just now")).toBeInTheDocument();
        });

        it("should show minutes for recent updates", () => {
            render(
                <ConversationItem
                    {...defaultProps}
                    conversation={{ ...mockConversation, updatedAt: Date.now() - 60000 }}
                />,
            );

            expect(screen.getByText("1 min ago")).toBeInTheDocument();
        });

        it("should show hours for older updates", () => {
            render(
                <ConversationItem
                    {...defaultProps}
                    conversation={{ ...mockConversation, updatedAt: Date.now() - 3600000 }}
                />,
            );

            expect(screen.getByText("1 hour ago")).toBeInTheDocument();
        });

        it("should show 'Yesterday' for yesterday's updates", () => {
            render(
                <ConversationItem
                    {...defaultProps}
                    conversation={{ ...mockConversation, updatedAt: Date.now() - 86400000 }}
                />,
            );

            expect(screen.getByText("Yesterday")).toBeInTheDocument();
        });

        it("should show days for older updates", () => {
            render(
                <ConversationItem
                    {...defaultProps}
                    conversation={{ ...mockConversation, updatedAt: Date.now() - 172800000 }}
                />,
            );

            expect(screen.getByText("2 days ago")).toBeInTheDocument();
        });
    });

    describe("active state", () => {
        it("should not have active styling by default", () => {
            const { container } = render(<ConversationItem {...defaultProps} />);

            const item = container.firstChild as Element;
            expect(item.className).toContain("hover:bg-white/5");
        });

        it("should have active styling when isActive is true", () => {
            const { container } = render(<ConversationItem {...defaultProps} isActive={true} />);

            const item = container.firstChild as Element;
            expect(item.className).toContain("bg-white/10");
        });
    });

    describe("cost display", () => {
        it("should show cost bar when cost is provided", () => {
            const { container } = render(<ConversationItem {...defaultProps} cost={5} />);

            const costBar = container.querySelector(".bg-green-500");
            expect(costBar).toBeInTheDocument();
        });

        it("should not show cost bar when cost is undefined", () => {
            const { container } = render(<ConversationItem {...defaultProps} />);

            const costBar = container.querySelector(".bg-green-500");
            expect(costBar).not.toBeInTheDocument();
        });

        it("should not show cost bar when cost is 0", () => {
            const { container } = render(<ConversationItem {...defaultProps} cost={0} />);

            const costBar = container.querySelector(".bg-green-500");
            expect(costBar).not.toBeInTheDocument();
        });
    });

    describe("click handling", () => {
        it("should call onClick when clicked", () => {
            const onClick = vi.fn();
            render(<ConversationItem {...defaultProps} onClick={onClick} />);

            fireEvent.click(screen.getByText("Test Conversation").parentElement!.parentElement!);

            expect(onClick).toHaveBeenCalledWith("conv-1");
        });
    });

    describe("delete functionality", () => {
        it("should show delete button", () => {
            render(<ConversationItem {...defaultProps} />);

            expect(screen.getByTitle("Delete conversation")).toBeInTheDocument();
        });

        it("should show confirm dialog when delete clicked", () => {
            render(<ConversationItem {...defaultProps} />);

            fireEvent.click(screen.getByTitle("Delete conversation"));

            expect(screen.getByText("Cancel")).toBeInTheDocument();
        });

        it("should not trigger onClick when delete clicked", () => {
            const onClick = vi.fn();
            render(<ConversationItem {...defaultProps} onClick={onClick} />);

            fireEvent.click(screen.getByTitle("Delete conversation"));

            expect(onClick).not.toHaveBeenCalled();
        });

        it("should call onDelete when confirm clicked", () => {
            const onDelete = vi.fn();
            render(<ConversationItem {...defaultProps} onDelete={onDelete} />);

            // Click delete to show confirm
            fireEvent.click(screen.getByTitle("Delete conversation"));

            // Click the confirm delete (Trash2 icon in confirm dialog)
            const confirmButton = screen.getByRole("button", { name: "" }); // Trash icon button
            const buttons = screen.getAllByRole("button");
            // Find the confirm delete button (first button in the confirm dialog)
            const confirmDeleteBtn = buttons.find((btn) => btn.classList.contains("text-red-400"));
            if (confirmDeleteBtn) {
                fireEvent.click(confirmDeleteBtn);
            }

            expect(onDelete).toHaveBeenCalledWith("conv-1");
        });

        it("should hide confirm dialog when cancel clicked", () => {
            render(<ConversationItem {...defaultProps} />);

            // Show confirm
            fireEvent.click(screen.getByTitle("Delete conversation"));
            expect(screen.getByText("Cancel")).toBeInTheDocument();

            // Cancel
            fireEvent.click(screen.getByText("Cancel"));

            expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
        });
    });

    describe("multiple minutes formatting", () => {
        it("should show plural minutes", () => {
            render(
                <ConversationItem
                    {...defaultProps}
                    conversation={{ ...mockConversation, updatedAt: Date.now() - 120000 }}
                />,
            );

            expect(screen.getByText("2 mins ago")).toBeInTheDocument();
        });

        it("should show plural hours", () => {
            render(
                <ConversationItem
                    {...defaultProps}
                    conversation={{ ...mockConversation, updatedAt: Date.now() - 7200000 }}
                />,
            );

            expect(screen.getByText("2 hours ago")).toBeInTheDocument();
        });
    });
});
