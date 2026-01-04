import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConversationHistory } from "../../webview/components/History/ConversationHistory";
import type { ConversationListItem } from "../../webview/types/history";

// Mock child components
vi.mock("../../webview/components/History/ConversationSearch", () => ({
    ConversationSearch: ({ onSearch }: { onSearch: (query: string) => void }) => (
        <input
            data-testid="search-input"
            placeholder="Search..."
            onChange={(e) => onSearch(e.target.value)}
        />
    ),
}));

vi.mock("../../webview/components/History/ConversationItem", () => ({
    ConversationItem: ({
        conversation,
        isActive,
        onClick,
        onDelete,
    }: {
        conversation: ConversationListItem;
        isActive: boolean;
        onClick: (id: string) => void;
        onDelete: (id: string) => void;
    }) => (
        <div data-testid={`conversation-${conversation.id}`} data-active={isActive} role="listitem">
            <button onClick={() => onClick(conversation.id)}>{conversation.title}</button>
            <button
                data-testid={`delete-${conversation.id}`}
                onClick={() => onDelete(conversation.id)}
            >
                Delete
            </button>
        </div>
    ),
}));

describe("ConversationHistory", () => {
    const mockConversations: ConversationListItem[] = [
        {
            id: "conv-1",
            title: "First Conversation",
            preview: "This is the first conversation",
            messageCount: 5,
            createdAt: Date.now() - 86400000, // 1 day ago
            updatedAt: Date.now() - 3600000, // 1 hour ago
        },
        {
            id: "conv-2",
            title: "Second Conversation",
            preview: "This is the second conversation",
            messageCount: 10,
            createdAt: Date.now() - 172800000, // 2 days ago
            updatedAt: Date.now(), // Now
        },
    ];

    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        onConversationLoad: vi.fn(),
        conversations: mockConversations,
        isLoading: false,
        activeConversationId: null,
        onConversationDelete: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("rendering", () => {
        it("should render when open", () => {
            render(<ConversationHistory {...defaultProps} />);

            expect(screen.getByRole("complementary")).toBeInTheDocument();
        });

        it("should not render when closed", () => {
            render(<ConversationHistory {...defaultProps} isOpen={false} />);

            expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
        });

        it("should render search input", () => {
            render(<ConversationHistory {...defaultProps} />);

            expect(screen.getByTestId("search-input")).toBeInTheDocument();
        });

        it("should render conversations", () => {
            render(<ConversationHistory {...defaultProps} />);

            expect(screen.getByText("First Conversation")).toBeInTheDocument();
            expect(screen.getByText("Second Conversation")).toBeInTheDocument();
        });

        it("should show conversation count", () => {
            render(<ConversationHistory {...defaultProps} />);

            expect(screen.getByText(/2 of 2 conversations/)).toBeInTheDocument();
        });
    });

    describe("loading state", () => {
        it("should show loading message when loading", () => {
            render(<ConversationHistory {...defaultProps} isLoading={true} />);

            expect(screen.getByText("Loading conversations...")).toBeInTheDocument();
        });

        it("should not show conversations when loading", () => {
            render(<ConversationHistory {...defaultProps} isLoading={true} />);

            expect(screen.queryByText("First Conversation")).not.toBeInTheDocument();
        });
    });

    describe("empty state", () => {
        it("should show empty message when no conversations", () => {
            render(<ConversationHistory {...defaultProps} conversations={[]} />);

            expect(screen.getByText("No conversations found")).toBeInTheDocument();
        });
    });

    describe("search", () => {
        it("should filter conversations based on search", () => {
            render(<ConversationHistory {...defaultProps} />);

            const searchInput = screen.getByTestId("search-input");
            fireEvent.change(searchInput, { target: { value: "First" } });

            expect(screen.getByText("First Conversation")).toBeInTheDocument();
            expect(screen.queryByText("Second Conversation")).not.toBeInTheDocument();
        });

        it("should show filtered count", () => {
            render(<ConversationHistory {...defaultProps} />);

            const searchInput = screen.getByTestId("search-input");
            fireEvent.change(searchInput, { target: { value: "First" } });

            expect(screen.getByText(/1 of 2 conversations/)).toBeInTheDocument();
        });

        it("should search by preview", () => {
            render(<ConversationHistory {...defaultProps} />);

            const searchInput = screen.getByTestId("search-input");
            fireEvent.change(searchInput, { target: { value: "second conversation" } });

            expect(screen.getByText("Second Conversation")).toBeInTheDocument();
            expect(screen.queryByText("First Conversation")).not.toBeInTheDocument();
        });
    });

    describe("close functionality", () => {
        it("should call onClose when close button clicked", () => {
            const onClose = vi.fn();
            render(<ConversationHistory {...defaultProps} onClose={onClose} />);

            fireEvent.click(screen.getByTitle("Close History"));

            expect(onClose).toHaveBeenCalled();
        });

        it("should call onClose when backdrop clicked", () => {
            const onClose = vi.fn();
            render(<ConversationHistory {...defaultProps} onClose={onClose} />);

            const backdrop = document.querySelector('[aria-hidden="true"]');
            if (backdrop) {
                fireEvent.click(backdrop);
            }

            expect(onClose).toHaveBeenCalled();
        });
    });

    describe("conversation interaction", () => {
        it("should call onConversationLoad when conversation clicked", () => {
            const onConversationLoad = vi.fn();
            render(
                <ConversationHistory {...defaultProps} onConversationLoad={onConversationLoad} />,
            );

            fireEvent.click(screen.getByText("First Conversation"));

            expect(onConversationLoad).toHaveBeenCalledWith("conv-1");
        });

        it("should close panel when conversation loaded", () => {
            const onClose = vi.fn();
            render(<ConversationHistory {...defaultProps} onClose={onClose} />);

            fireEvent.click(screen.getByText("First Conversation"));

            expect(onClose).toHaveBeenCalled();
        });

        it("should call onConversationDelete when delete clicked", () => {
            const onConversationDelete = vi.fn();
            render(
                <ConversationHistory
                    {...defaultProps}
                    onConversationDelete={onConversationDelete}
                />,
            );

            fireEvent.click(screen.getByTestId("delete-conv-1"));

            expect(onConversationDelete).toHaveBeenCalledWith("conv-1");
        });
    });

    describe("active conversation", () => {
        it("should mark active conversation", () => {
            render(<ConversationHistory {...defaultProps} activeConversationId="conv-1" />);

            const activeItem = screen.getByTestId("conversation-conv-1");
            expect(activeItem).toHaveAttribute("data-active", "true");
        });

        it("should not mark inactive conversation", () => {
            render(<ConversationHistory {...defaultProps} activeConversationId="conv-1" />);

            const inactiveItem = screen.getByTestId("conversation-conv-2");
            expect(inactiveItem).toHaveAttribute("data-active", "false");
        });
    });

    describe("sorting", () => {
        it("should sort conversations by updatedAt descending", () => {
            render(<ConversationHistory {...defaultProps} />);

            const items = screen.getAllByRole("listitem");
            // Second conversation was updated more recently
            expect(items[0]).toHaveTextContent("Second Conversation");
            expect(items[1]).toHaveTextContent("First Conversation");
        });
    });

    describe("accessibility", () => {
        it("should have proper aria label", () => {
            render(<ConversationHistory {...defaultProps} />);

            expect(
                screen.getByRole("complementary", { name: "Conversation history" }),
            ).toBeInTheDocument();
        });

        it("should have list role for conversations", () => {
            render(<ConversationHistory {...defaultProps} />);

            expect(screen.getByRole("list")).toBeInTheDocument();
        });
    });
});
