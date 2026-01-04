import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { HistoryView } from "../../webview/components/History/HistoryView";

describe("HistoryView", () => {
    const mockPostMessage = vi.fn();
    const mockConversations = [
        {
            filename: "conv-1.json",
            timestamp: new Date("2024-01-15T10:30:00"),
            preview: "How do I use React hooks?",
            messageCount: 10,
        },
        {
            filename: "conv-2.json",
            timestamp: new Date("2024-01-14T14:00:00"),
            preview: "TypeScript generics explained",
            messageCount: 5,
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock window.vscode
        (window as any).vscode = {
            postMessage: mockPostMessage,
        };
    });

    afterEach(() => {
        delete (window as any).vscode;
    });

    describe("initial loading", () => {
        it("should show loading spinner initially", () => {
            render(<HistoryView />);

            const spinner = document.querySelector(".animate-spin");
            expect(spinner).toBeInTheDocument();
        });

        it("should request conversation list on mount", () => {
            render(<HistoryView />);

            expect(mockPostMessage).toHaveBeenCalledWith({
                type: "getConversationList",
            });
        });
    });

    describe("with conversations", () => {
        it("should display conversations after loading", async () => {
            render(<HistoryView />);

            // Simulate receiving conversation list
            act(() => {
                window.dispatchEvent(
                    new MessageEvent("message", {
                        data: {
                            type: "conversationList",
                            conversations: mockConversations,
                        },
                    }),
                );
            });

            await waitFor(() => {
                expect(screen.getByText("How do I use React hooks?")).toBeInTheDocument();
                expect(screen.getByText("TypeScript generics explained")).toBeInTheDocument();
            });
        });

        it("should show conversation count", async () => {
            render(<HistoryView />);

            act(() => {
                window.dispatchEvent(
                    new MessageEvent("message", {
                        data: {
                            type: "conversationList",
                            conversations: mockConversations,
                        },
                    }),
                );
            });

            await waitFor(() => {
                expect(screen.getByText("2 conversations")).toBeInTheDocument();
            });
        });

        it("should show singular form for 1 conversation", async () => {
            render(<HistoryView />);

            act(() => {
                window.dispatchEvent(
                    new MessageEvent("message", {
                        data: {
                            type: "conversationList",
                            conversations: [mockConversations[0]],
                        },
                    }),
                );
            });

            await waitFor(() => {
                expect(screen.getByText("1 conversation")).toBeInTheDocument();
            });
        });

        it("should show message count for each conversation", async () => {
            render(<HistoryView />);

            act(() => {
                window.dispatchEvent(
                    new MessageEvent("message", {
                        data: {
                            type: "conversationList",
                            conversations: mockConversations,
                        },
                    }),
                );
            });

            await waitFor(() => {
                expect(screen.getByText("10 messages")).toBeInTheDocument();
                expect(screen.getByText("5 messages")).toBeInTheDocument();
            });
        });
    });

    describe("empty state", () => {
        it("should show empty state when no conversations", async () => {
            render(<HistoryView />);

            act(() => {
                window.dispatchEvent(
                    new MessageEvent("message", {
                        data: {
                            type: "conversationList",
                            conversations: [],
                        },
                    }),
                );
            });

            await waitFor(() => {
                expect(screen.getByText("No conversations found")).toBeInTheDocument();
                expect(screen.getByText("Start chatting to see history here")).toBeInTheDocument();
            });
        });
    });

    describe("search", () => {
        it("should filter conversations by search query", async () => {
            render(<HistoryView />);

            act(() => {
                window.dispatchEvent(
                    new MessageEvent("message", {
                        data: {
                            type: "conversationList",
                            conversations: mockConversations,
                        },
                    }),
                );
            });

            await waitFor(() => {
                expect(screen.getByText("How do I use React hooks?")).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText("Search conversations...");
            fireEvent.change(searchInput, { target: { value: "TypeScript" } });

            expect(screen.queryByText("How do I use React hooks?")).not.toBeInTheDocument();
            expect(screen.getByText("TypeScript generics explained")).toBeInTheDocument();
        });

        it("should show message when no search results", async () => {
            render(<HistoryView />);

            act(() => {
                window.dispatchEvent(
                    new MessageEvent("message", {
                        data: {
                            type: "conversationList",
                            conversations: mockConversations,
                        },
                    }),
                );
            });

            await waitFor(() => {
                expect(screen.getByText("How do I use React hooks?")).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText("Search conversations...");
            fireEvent.change(searchInput, { target: { value: "nonexistent" } });

            expect(screen.getByText("No conversations found")).toBeInTheDocument();
            expect(screen.getByText("Try a different search term")).toBeInTheDocument();
        });

        it("should be case insensitive", async () => {
            render(<HistoryView />);

            act(() => {
                window.dispatchEvent(
                    new MessageEvent("message", {
                        data: {
                            type: "conversationList",
                            conversations: mockConversations,
                        },
                    }),
                );
            });

            await waitFor(() => {
                expect(screen.getByText("How do I use React hooks?")).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText("Search conversations...");
            fireEvent.change(searchInput, { target: { value: "REACT" } });

            expect(screen.getByText("How do I use React hooks?")).toBeInTheDocument();
        });
    });

    describe("conversation actions", () => {
        it("should load conversation when clicked", async () => {
            render(<HistoryView />);

            act(() => {
                window.dispatchEvent(
                    new MessageEvent("message", {
                        data: {
                            type: "conversationList",
                            conversations: mockConversations,
                        },
                    }),
                );
            });

            await waitFor(() => {
                expect(screen.getByText("How do I use React hooks?")).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText("How do I use React hooks?"));

            expect(mockPostMessage).toHaveBeenCalledWith({
                type: "loadConversation",
                filename: "conv-1.json",
            });
        });

        it("should delete conversation when delete button clicked", async () => {
            const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

            render(<HistoryView />);

            act(() => {
                window.dispatchEvent(
                    new MessageEvent("message", {
                        data: {
                            type: "conversationList",
                            conversations: mockConversations,
                        },
                    }),
                );
            });

            await waitFor(() => {
                expect(screen.getByText("How do I use React hooks?")).toBeInTheDocument();
            });

            const deleteButtons = screen.getAllByTitle("Delete conversation");
            fireEvent.click(deleteButtons[0]);

            expect(confirmSpy).toHaveBeenCalled();
            expect(mockPostMessage).toHaveBeenCalledWith({
                type: "deleteConversation",
                filename: "conv-1.json",
            });

            confirmSpy.mockRestore();
        });

        it("should not delete when user cancels", async () => {
            const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

            render(<HistoryView />);

            act(() => {
                window.dispatchEvent(
                    new MessageEvent("message", {
                        data: {
                            type: "conversationList",
                            conversations: mockConversations,
                        },
                    }),
                );
            });

            await waitFor(() => {
                expect(screen.getByText("How do I use React hooks?")).toBeInTheDocument();
            });

            const deleteButtons = screen.getAllByTitle("Delete conversation");
            fireEvent.click(deleteButtons[0]);

            expect(mockPostMessage).not.toHaveBeenCalledWith({
                type: "deleteConversation",
                filename: expect.any(String),
            });

            confirmSpy.mockRestore();
        });

        it("should remove conversation when deletion confirmed", async () => {
            render(<HistoryView />);

            act(() => {
                window.dispatchEvent(
                    new MessageEvent("message", {
                        data: {
                            type: "conversationList",
                            conversations: mockConversations,
                        },
                    }),
                );
            });

            await waitFor(() => {
                expect(screen.getByText("How do I use React hooks?")).toBeInTheDocument();
            });

            // Simulate conversation deleted message
            act(() => {
                window.dispatchEvent(
                    new MessageEvent("message", {
                        data: {
                            type: "conversationDeleted",
                            filename: "conv-1.json",
                        },
                    }),
                );
            });

            expect(screen.queryByText("How do I use React hooks?")).not.toBeInTheDocument();
            expect(screen.getByText("TypeScript generics explained")).toBeInTheDocument();
        });
    });

    describe("header", () => {
        it("should show Chat History title", async () => {
            render(<HistoryView />);

            act(() => {
                window.dispatchEvent(
                    new MessageEvent("message", {
                        data: {
                            type: "conversationList",
                            conversations: [],
                        },
                    }),
                );
            });

            await waitFor(() => {
                expect(screen.getByText("Chat History")).toBeInTheDocument();
            });
        });
    });

    describe("cleanup", () => {
        it("should remove event listener on unmount", () => {
            const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
            const { unmount } = render(<HistoryView />);

            unmount();

            expect(removeEventListenerSpy).toHaveBeenCalledWith("message", expect.any(Function));
            removeEventListenerSpy.mockRestore();
        });
    });
});
