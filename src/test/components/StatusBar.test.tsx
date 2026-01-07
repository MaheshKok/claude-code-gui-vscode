import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { StatusBar } from "../../webview/components/Status/StatusBar";

describe("StatusBar", () => {
    const defaultProps = {
        isConnected: true,
        isProcessing: false,
        onStop: vi.fn(),
        totalTokens: 1000,
        requestCount: 5,
        sessionCostUsd: 0.05,
        lastDurationMs: 2500,
        requestStartTime: null as number | null,
        subscriptionType: null as string | null,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("connection status", () => {
        it("should show connected status", () => {
            render(<StatusBar {...defaultProps} isConnected={true} />);

            expect(screen.getByText("Connected")).toBeInTheDocument();
        });

        it("should show disconnected status", () => {
            render(<StatusBar {...defaultProps} isConnected={false} />);

            expect(screen.getByText("Disconnected")).toBeInTheDocument();
        });
    });

    describe("simplified footer - stats removed", () => {
        // The StatusBar was simplified to only show connection status
        // Token, request count, cost, duration, and subscription type displays were moved elsewhere

        it("should NOT display token stats in footer (moved to ChatContainer)", () => {
            render(<StatusBar {...defaultProps} totalTokens={1500} />);

            // Token stats were removed from StatusBar
            expect(screen.queryByTitle("Total Tokens")).not.toBeInTheDocument();
        });

        it("should NOT display request count in footer (removed)", () => {
            render(<StatusBar {...defaultProps} requestCount={10} />);

            expect(screen.queryByText("10 reqs")).not.toBeInTheDocument();
        });

        it("should NOT display session cost in footer (moved to ChatContainer)", () => {
            render(<StatusBar {...defaultProps} sessionCostUsd={0.25} />);

            expect(screen.queryByTitle("Session Cost")).not.toBeInTheDocument();
        });

        it("should NOT display duration in footer (moved to ChatContainer)", () => {
            render(<StatusBar {...defaultProps} lastDurationMs={2500} />);

            expect(screen.queryByTitle("Last Request Duration")).not.toBeInTheDocument();
        });

        it("should NOT display subscription type in footer (removed)", () => {
            render(<StatusBar {...defaultProps} subscriptionType="pro" />);

            expect(screen.queryByText("pro")).not.toBeInTheDocument();
        });
    });

    describe("processing state", () => {
        it("should show processing indicator when processing", () => {
            render(<StatusBar {...defaultProps} isProcessing={true} />);

            expect(screen.getByText("Processing...")).toBeInTheDocument();
        });

        it("should show stop button when processing", () => {
            render(<StatusBar {...defaultProps} isProcessing={true} />);

            expect(screen.getByText("Stop")).toBeInTheDocument();
        });

        it("should call onStop when stop button is clicked", () => {
            const onStop = vi.fn();
            render(<StatusBar {...defaultProps} isProcessing={true} onStop={onStop} />);

            fireEvent.click(screen.getByText("Stop"));

            expect(onStop).toHaveBeenCalledTimes(1);
        });

        it("should show keyboard shortcut when not processing", () => {
            render(<StatusBar {...defaultProps} isProcessing={false} />);

            expect(screen.getByText("to send")).toBeInTheDocument();
        });
    });

    describe("elapsed time display", () => {
        it("should display elapsed time when processing", () => {
            const startTime = Date.now();
            render(
                <StatusBar {...defaultProps} isProcessing={true} requestStartTime={startTime} />,
            );

            // Advance time
            act(() => {
                vi.advanceTimersByTime(3000);
            });

            const elapsedElement = screen.getByTitle("Elapsed Time");
            expect(elapsedElement).toBeInTheDocument();
        });

        it("should update elapsed time periodically when processing", () => {
            // Set start time to 1 second in the past so elapsedMs > 0 initially
            const startTime = Date.now() - 1000;
            render(
                <StatusBar {...defaultProps} isProcessing={true} requestStartTime={startTime} />,
            );

            // Initial render should show 1s (since start was 1 second ago)
            expect(screen.getByTitle("Elapsed Time")).toBeInTheDocument();
            expect(screen.getByText("1s")).toBeInTheDocument();

            // Advance time by 4 more seconds (total 5s from start)
            act(() => {
                vi.advanceTimersByTime(4000);
            });

            expect(screen.getByText("5s")).toBeInTheDocument();
        });

        it("should reset elapsed time when processing stops", () => {
            // Start 1 second in the past so elapsedMs > 0
            const startTime = Date.now() - 1000;
            const { rerender } = render(
                <StatusBar {...defaultProps} isProcessing={true} requestStartTime={startTime} />,
            );

            // Advance by 2 more seconds (total 3s from start)
            act(() => {
                vi.advanceTimersByTime(2000);
            });

            // Stop processing
            rerender(<StatusBar {...defaultProps} isProcessing={false} requestStartTime={null} />);

            // Elapsed time should be reset - no longer shown
            expect(screen.queryByTitle("Elapsed Time")).not.toBeInTheDocument();
        });
    });
});
