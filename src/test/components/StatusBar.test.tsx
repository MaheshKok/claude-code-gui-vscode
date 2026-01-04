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

    describe("token display", () => {
        it("should display total tokens", () => {
            render(<StatusBar {...defaultProps} totalTokens={1500} />);

            // The formatTokenCount function will format this
            expect(screen.getByTitle("Total Tokens")).toBeInTheDocument();
        });

        it("should display large token counts abbreviated", () => {
            render(<StatusBar {...defaultProps} totalTokens={150000} />);

            const tokenElement = screen.getByTitle("Total Tokens");
            expect(tokenElement).toBeInTheDocument();
        });
    });

    describe("request count", () => {
        it("should display request count when > 0", () => {
            render(<StatusBar {...defaultProps} requestCount={10} />);

            expect(screen.getByText("10 reqs")).toBeInTheDocument();
        });

        it("should not display request count when 0", () => {
            render(<StatusBar {...defaultProps} requestCount={0} />);

            expect(screen.queryByText("0 reqs")).not.toBeInTheDocument();
        });
    });

    describe("session cost", () => {
        it("should display session cost when not processing", () => {
            render(<StatusBar {...defaultProps} sessionCostUsd={0.25} />);

            const costElement = screen.getByTitle("Session Cost");
            expect(costElement).toBeInTheDocument();
        });

        it("should not display session cost when processing", () => {
            render(<StatusBar {...defaultProps} isProcessing={true} sessionCostUsd={0.25} />);

            expect(screen.queryByTitle("Session Cost")).not.toBeInTheDocument();
        });

        it("should not display session cost when 0", () => {
            render(<StatusBar {...defaultProps} sessionCostUsd={0} />);

            expect(screen.queryByTitle("Session Cost")).not.toBeInTheDocument();
        });
    });

    describe("duration display", () => {
        it("should display last duration when not processing", () => {
            render(<StatusBar {...defaultProps} lastDurationMs={2500} />);

            const durationElement = screen.getByTitle("Last Request Duration");
            expect(durationElement).toBeInTheDocument();
        });

        it("should not display duration when null", () => {
            render(<StatusBar {...defaultProps} lastDurationMs={null} />);

            expect(screen.queryByTitle("Last Request Duration")).not.toBeInTheDocument();
        });

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
    });

    describe("subscription type", () => {
        it("should display subscription type when provided", () => {
            render(<StatusBar {...defaultProps} subscriptionType="pro" />);

            expect(screen.getByText("pro")).toBeInTheDocument();
        });

        it("should not display subscription type when null", () => {
            render(<StatusBar {...defaultProps} subscriptionType={null} />);

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

    describe("elapsed time calculation", () => {
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

            // Elapsed time should be reset - now shows last duration instead
            expect(screen.queryByTitle("Elapsed Time")).not.toBeInTheDocument();
        });
    });
});
