import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { StatusBar } from "../../webview/components/Status/StatusBar";

describe("StatusBar", () => {
    const defaultProps = {
        isProcessing: false,
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

    describe("visibility", () => {
        it("should not render when not processing", () => {
            const { container } = render(<StatusBar {...defaultProps} isProcessing={false} />);

            // Component returns null when not processing
            expect(container.querySelector("footer")).not.toBeInTheDocument();
        });

        it("should render when processing", () => {
            render(<StatusBar {...defaultProps} isProcessing={true} />);

            expect(screen.getByText("Processing...")).toBeInTheDocument();
        });
    });

    describe("simplified footer - stats removed", () => {
        // The StatusBar was simplified to only show processing state
        // Connection status, token, request count, cost, duration, and subscription type displays were removed/moved elsewhere

        it("should NOT display token stats in footer when not processing (hidden)", () => {
            render(<StatusBar {...defaultProps} totalTokens={1500} isProcessing={false} />);

            // Footer is hidden when not processing
            expect(screen.queryByTitle("Tokens")).not.toBeInTheDocument();
        });

        it("should NOT display request count in footer (removed)", () => {
            render(<StatusBar {...defaultProps} requestCount={10} isProcessing={true} />);

            expect(screen.queryByText("10 reqs")).not.toBeInTheDocument();
        });

        it("should NOT display session cost in footer (moved to ChatContainer)", () => {
            render(<StatusBar {...defaultProps} sessionCostUsd={0.25} isProcessing={true} />);

            expect(screen.queryByTitle("Session Cost")).not.toBeInTheDocument();
        });

        it("should NOT display duration in footer (moved to ChatContainer)", () => {
            render(<StatusBar {...defaultProps} lastDurationMs={2500} isProcessing={true} />);

            expect(screen.queryByTitle("Last Request Duration")).not.toBeInTheDocument();
        });

        it("should NOT display subscription type in footer (removed)", () => {
            render(<StatusBar {...defaultProps} subscriptionType="pro" isProcessing={true} />);

            expect(screen.queryByText("pro")).not.toBeInTheDocument();
        });
    });

    describe("processing state", () => {
        it("should show processing indicator when processing", () => {
            render(<StatusBar {...defaultProps} isProcessing={true} />);

            expect(screen.getByText("Processing...")).toBeInTheDocument();
        });

        it("should not show stop button (moved to MessageInput)", () => {
            // Stop button was moved to MessageInput component
            render(<StatusBar {...defaultProps} isProcessing={true} />);

            expect(screen.queryByText("Stop")).not.toBeInTheDocument();
        });

        it("should not show keyboard shortcut (removed)", () => {
            // Keyboard shortcut hint was removed
            render(<StatusBar {...defaultProps} isProcessing={false} />);

            expect(screen.queryByText("to send")).not.toBeInTheDocument();
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

        it("should not show elapsed time when processing stops (component hidden)", () => {
            // Start 1 second in the past so elapsedMs > 0
            const startTime = Date.now() - 1000;
            const { rerender } = render(
                <StatusBar {...defaultProps} isProcessing={true} requestStartTime={startTime} />,
            );

            // Advance by 2 more seconds (total 3s from start)
            act(() => {
                vi.advanceTimersByTime(2000);
            });

            // Stop processing - component should be hidden
            rerender(<StatusBar {...defaultProps} isProcessing={false} requestStartTime={null} />);

            // Elapsed time should not be shown (component is hidden)
            expect(screen.queryByTitle("Elapsed Time")).not.toBeInTheDocument();
        });
    });

    describe("tokens display while processing", () => {
        it("should display tokens when processing and tokens > 0", () => {
            render(<StatusBar {...defaultProps} isProcessing={true} totalTokens={500} />);

            expect(screen.getByTitle("Tokens")).toBeInTheDocument();
        });

        it("should not display tokens when processing but tokens = 0", () => {
            render(<StatusBar {...defaultProps} isProcessing={true} totalTokens={0} />);

            expect(screen.queryByTitle("Tokens")).not.toBeInTheDocument();
        });
    });
});
