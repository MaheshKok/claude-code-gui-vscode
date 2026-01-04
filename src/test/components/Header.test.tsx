import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Header } from "../../webview/components/Header/Header";
import { useUsageStore } from "../../webview/stores/usageStore";

// Mock the usage store
vi.mock("../../webview/stores/usageStore", () => ({
    useUsageStore: vi.fn(),
}));

describe("Header", () => {
    const defaultProps = {
        session: null,
        onNewChat: vi.fn(),
        onToggleHistory: vi.fn(),
        isHistoryOpen: false,
        onOpenUsage: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useUsageStore).mockReturnValue(null);
    });

    it("renders the header with app name", () => {
        render(<Header {...defaultProps} />);
        expect(screen.getByText("Claude Code")).toBeInTheDocument();
    });

    it("renders the New Chat button", () => {
        render(<Header {...defaultProps} />);
        expect(screen.getByTitle("New Chat")).toBeInTheDocument();
    });

    it("renders the History button with correct title when closed", () => {
        render(<Header {...defaultProps} isHistoryOpen={false} />);
        expect(screen.getByTitle("Chat History")).toBeInTheDocument();
    });

    it("renders the History button with correct title when open", () => {
        render(<Header {...defaultProps} isHistoryOpen={true} />);
        expect(screen.getByTitle("Close History")).toBeInTheDocument();
    });

    it("displays session name when session is provided", () => {
        render(<Header {...defaultProps} session={{ id: "test-id", name: "Test Session" }} />);
        expect(screen.getByText("Test Session")).toBeInTheDocument();
    });

    it("calls onNewChat when New Chat button is clicked", () => {
        const onNewChat = vi.fn();
        render(<Header {...defaultProps} onNewChat={onNewChat} />);
        fireEvent.click(screen.getByTitle("New Chat"));
        expect(onNewChat).toHaveBeenCalledTimes(1);
    });

    it("calls onOpenUsage when Usage button is clicked", () => {
        const onOpenUsage = vi.fn();
        render(<Header {...defaultProps} onOpenUsage={onOpenUsage} />);
        fireEvent.click(screen.getByTitle("Usage Data"));
        expect(onOpenUsage).toHaveBeenCalledTimes(1);
    });

    it("calls onToggleHistory when History button is clicked", () => {
        const onToggleHistory = vi.fn();
        render(<Header {...defaultProps} onToggleHistory={onToggleHistory} />);
        fireEvent.click(screen.getByTitle("Chat History"));
        expect(onToggleHistory).toHaveBeenCalledTimes(1);
    });

    describe("usage data display", () => {
        it("should not show usage stats when no usage data", () => {
            vi.mocked(useUsageStore).mockReturnValue(null);
            render(<Header {...defaultProps} />);
            expect(screen.queryByText("Session")).not.toBeInTheDocument();
        });

        it("should show usage stats when usage data is available", () => {
            vi.mocked(useUsageStore).mockReturnValue({
                currentSession: {
                    usageCost: 0.5,
                    costLimit: 1,
                    resetsIn: "2h 30m",
                },
                weekly: {
                    costLikely: 0.25,
                    costLimit: 1,
                    resetsAt: "Thu",
                },
            });

            render(<Header {...defaultProps} />);
            expect(screen.getByText("Session")).toBeInTheDocument();
            expect(screen.getByText("50%")).toBeInTheDocument();
            expect(screen.getByText("Resets")).toBeInTheDocument();
            expect(screen.getByText("2h 30m")).toBeInTheDocument();
        });

        it("should calculate correct percentage for 75% usage", () => {
            vi.mocked(useUsageStore).mockReturnValue({
                currentSession: {
                    usageCost: 0.75,
                    costLimit: 1,
                    resetsIn: "1h",
                },
                weekly: {
                    costLikely: 0.5,
                    costLimit: 1,
                    resetsAt: "Fri",
                },
            });

            render(<Header {...defaultProps} />);
            expect(screen.getByText("75%")).toBeInTheDocument();
        });

        it("should show reset time from usage data", () => {
            vi.mocked(useUsageStore).mockReturnValue({
                currentSession: {
                    usageCost: 0.25,
                    costLimit: 1,
                    resetsIn: "4h 15m",
                },
                weekly: {
                    costLikely: 0.1,
                    costLimit: 1,
                    resetsAt: "Mon",
                },
            });

            render(<Header {...defaultProps} />);
            expect(screen.getByText("4h 15m")).toBeInTheDocument();
        });
    });

    describe("usage button visibility", () => {
        it("should not render usage button when onOpenUsage is not provided", () => {
            render(<Header {...defaultProps} onOpenUsage={undefined} />);
            expect(screen.queryByTitle("Usage Data")).not.toBeInTheDocument();
        });

        it("should render usage button when onOpenUsage is provided", () => {
            render(<Header {...defaultProps} onOpenUsage={vi.fn()} />);
            expect(screen.getByTitle("Usage Data")).toBeInTheDocument();
        });
    });

    describe("history button styling", () => {
        it("should have active styling when history is open", () => {
            const { container } = render(<Header {...defaultProps} isHistoryOpen={true} />);
            const activeButton = container.querySelector(".bg-white\\/10");
            expect(activeButton).toBeInTheDocument();
        });

        it("should not have active styling when history is closed", () => {
            const { container } = render(<Header {...defaultProps} isHistoryOpen={false} />);
            const historyButton = screen.getByTitle("Chat History");
            expect(historyButton).not.toHaveClass("bg-white/10");
        });
    });
});
