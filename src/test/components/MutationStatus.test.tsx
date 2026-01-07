import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import React from "react";
import {
    MutationStatus,
    MutationStatusBadge,
    MutationError,
    MutationLoader,
    withMutationStatus,
} from "../../webview/components/Common/MutationStatus";
import type { MutationStatus as MutationStatusType } from "../../webview/mutations/types";

describe("MutationStatus", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("idle state", () => {
        it("should not render anything when idle", () => {
            const { container } = render(<MutationStatus status="idle" />);
            expect(container.firstChild).toBeNull();
        });
    });

    describe("pending state", () => {
        it("should render loading message", () => {
            render(<MutationStatus status="pending" />);
            expect(screen.getByText("Processing...")).toBeInTheDocument();
        });

        it("should render custom loading message", () => {
            render(<MutationStatus status="pending" loadingMessage="Sending message..." />);
            expect(screen.getByText("Sending message...")).toBeInTheDocument();
        });

        it("should show spinning loader icon", () => {
            const { container } = render(<MutationStatus status="pending" />);
            const spinner = container.querySelector(".animate-spin");
            expect(spinner).toBeInTheDocument();
        });
    });

    describe("success state", () => {
        it("should render success message", () => {
            render(<MutationStatus status="success" />);
            expect(screen.getByText("Done!")).toBeInTheDocument();
        });

        it("should render custom success message", () => {
            render(<MutationStatus status="success" successMessage="Message sent!" />);
            expect(screen.getByText("Message sent!")).toBeInTheDocument();
        });

        it("should auto-hide after delay when autoHideSuccess is true", () => {
            const { rerender } = render(
                <MutationStatus status="success" autoHideSuccess={true} autoHideDelay={1000} />,
            );
            expect(screen.getByText("Done!")).toBeInTheDocument();

            act(() => {
                vi.advanceTimersByTime(1000);
            });

            // Re-render to trigger React update
            rerender(
                <MutationStatus status="success" autoHideSuccess={true} autoHideDelay={1000} />,
            );
            expect(screen.queryByText("Done!")).not.toBeInTheDocument();
        });

        it("should not auto-hide when autoHideSuccess is false", async () => {
            render(<MutationStatus status="success" autoHideSuccess={false} />);
            expect(screen.getByText("Done!")).toBeInTheDocument();

            act(() => {
                vi.advanceTimersByTime(3000);
            });

            expect(screen.getByText("Done!")).toBeInTheDocument();
        });
    });

    describe("error state", () => {
        it("should render error message", () => {
            render(<MutationStatus status="error" error={new Error("Something went wrong")} />);
            expect(screen.getByText("Something went wrong")).toBeInTheDocument();
        });

        it("should render custom error message", () => {
            render(
                <MutationStatus
                    status="error"
                    error={new Error("Test error")}
                    errorMessage="Custom error message"
                />,
            );
            expect(screen.getByText("Custom error message")).toBeInTheDocument();
        });

        it("should render default error message when no error provided", () => {
            render(<MutationStatus status="error" />);
            expect(screen.getByText("An error occurred")).toBeInTheDocument();
        });

        it("should show retry button when showRetry is true", () => {
            const onRetry = vi.fn();
            render(<MutationStatus status="error" showRetry={true} onRetry={onRetry} />);
            expect(screen.getByText("Retry")).toBeInTheDocument();
        });

        it("should call onRetry when retry button clicked", () => {
            const onRetry = vi.fn();
            render(<MutationStatus status="error" showRetry={true} onRetry={onRetry} />);
            fireEvent.click(screen.getByText("Retry"));
            expect(onRetry).toHaveBeenCalled();
        });

        it("should show dismiss button when onDismissError provided", () => {
            const onDismiss = vi.fn();
            render(<MutationStatus status="error" onDismissError={onDismiss} />);
            const dismissButton = screen.getByRole("button");
            expect(dismissButton).toBeInTheDocument();
        });

        it("should call onDismissError when dismiss clicked", () => {
            const onDismiss = vi.fn();
            render(<MutationStatus status="error" onDismissError={onDismiss} />);
            const buttons = screen.getAllByRole("button");
            fireEvent.click(buttons[0]);
            expect(onDismiss).toHaveBeenCalled();
        });
    });

    describe("inline mode", () => {
        it("should render inline when inline prop is true", () => {
            const { container } = render(<MutationStatus status="pending" inline={true} />);
            const inlineElement = container.querySelector(".inline-flex");
            expect(inlineElement).toBeInTheDocument();
        });
    });

    describe("custom className", () => {
        it("should apply custom className", () => {
            const { container } = render(
                <MutationStatus status="pending" className="custom-class" />,
            );
            expect(container.querySelector(".custom-class")).toBeInTheDocument();
        });
    });

    describe("visibility reset on status change", () => {
        it("should become visible again when status changes", () => {
            const { rerender } = render(
                <MutationStatus status="success" autoHideSuccess={true} autoHideDelay={1000} />,
            );

            act(() => {
                vi.advanceTimersByTime(1000);
            });

            // Re-render to apply state change
            rerender(
                <MutationStatus status="success" autoHideSuccess={true} autoHideDelay={1000} />,
            );
            expect(screen.queryByText("Done!")).not.toBeInTheDocument();

            // Change status to pending, should become visible again
            rerender(
                <MutationStatus status="pending" autoHideSuccess={true} autoHideDelay={1000} />,
            );
            expect(screen.getByText("Processing...")).toBeInTheDocument();
        });
    });
});

describe("MutationStatusBadge", () => {
    it("should not render for idle status", () => {
        const { container } = render(<MutationStatusBadge status="idle" />);
        expect(container.firstChild).toBeNull();
    });

    it("should render for pending status", () => {
        const { container } = render(<MutationStatusBadge status="pending" />);
        expect(container.firstChild).not.toBeNull();
    });

    it("should render for success status", () => {
        const { container } = render(<MutationStatusBadge status="success" />);
        expect(container.firstChild).not.toBeNull();
    });

    it("should render for error status", () => {
        const { container } = render(<MutationStatusBadge status="error" />);
        expect(container.firstChild).not.toBeNull();
    });

    describe("sizes", () => {
        it("should apply sm size classes", () => {
            const { container } = render(<MutationStatusBadge status="pending" size="sm" />);
            expect(container.querySelector(".w-4.h-4")).toBeInTheDocument();
        });

        it("should apply md size classes by default", () => {
            const { container } = render(<MutationStatusBadge status="pending" />);
            expect(container.querySelector(".w-5.h-5")).toBeInTheDocument();
        });

        it("should apply lg size classes", () => {
            const { container } = render(<MutationStatusBadge status="pending" size="lg" />);
            expect(container.querySelector(".w-6.h-6")).toBeInTheDocument();
        });
    });

    it("should apply custom className", () => {
        const { container } = render(
            <MutationStatusBadge status="pending" className="custom-badge" />,
        );
        expect(container.querySelector(".custom-badge")).toBeInTheDocument();
    });

    it("should animate spinner for pending status", () => {
        const { container } = render(<MutationStatusBadge status="pending" />);
        expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    });

    it("should not animate for success status", () => {
        const { container } = render(<MutationStatusBadge status="success" />);
        expect(container.querySelector(".animate-spin")).not.toBeInTheDocument();
    });
});

describe("MutationError", () => {
    const defaultError = new Error("Test error message");

    it("should render error message", () => {
        render(<MutationError error={defaultError} />);
        expect(screen.getByText("Test error message")).toBeInTheDocument();
    });

    it("should render custom message", () => {
        render(<MutationError error={defaultError} message="Custom error title" />);
        expect(screen.getByText("Custom error title")).toBeInTheDocument();
    });

    it("should render default message when no custom message", () => {
        render(<MutationError error={defaultError} />);
        expect(screen.getByText("An error occurred")).toBeInTheDocument();
    });

    it("should show retry button when onRetry provided", () => {
        const onRetry = vi.fn();
        render(<MutationError error={defaultError} onRetry={onRetry} />);
        expect(screen.getByText("Try Again")).toBeInTheDocument();
    });

    it("should call onRetry when retry clicked", () => {
        const onRetry = vi.fn();
        render(<MutationError error={defaultError} onRetry={onRetry} />);
        fireEvent.click(screen.getByText("Try Again"));
        expect(onRetry).toHaveBeenCalled();
    });

    it("should show dismiss button when onDismiss provided", () => {
        const onDismiss = vi.fn();
        render(<MutationError error={defaultError} onDismiss={onDismiss} />);
        expect(screen.getByText("Dismiss")).toBeInTheDocument();
    });

    it("should call onDismiss when dismiss clicked", () => {
        const onDismiss = vi.fn();
        render(<MutationError error={defaultError} onDismiss={onDismiss} />);
        fireEvent.click(screen.getByText("Dismiss"));
        expect(onDismiss).toHaveBeenCalled();
    });

    it("should apply custom className", () => {
        const { container } = render(
            <MutationError error={defaultError} className="custom-error" />,
        );
        expect(container.querySelector(".custom-error")).toBeInTheDocument();
    });
});

describe("MutationLoader", () => {
    it("should render default loading message", () => {
        render(<MutationLoader />);
        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should render custom loading message", () => {
        render(<MutationLoader message="Please wait..." />);
        expect(screen.getByText("Please wait...")).toBeInTheDocument();
    });

    it("should show spinning loader", () => {
        const { container } = render(<MutationLoader />);
        expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
        const { container } = render(<MutationLoader className="custom-loader" />);
        expect(container.querySelector(".custom-loader")).toBeInTheDocument();
    });
});

describe("withMutationStatus HOC", () => {
    const TestComponent: React.FC<{ text: string }> = ({ text }) => <div>{text}</div>;

    it("should render wrapped component", () => {
        const WrappedComponent = withMutationStatus(TestComponent, {
            loadingMessage: "Loading...",
        });

        render(<WrappedComponent text="Test content" mutationStatus="idle" mutationError={null} />);
        expect(screen.getByText("Test content")).toBeInTheDocument();
    });

    it("should render mutation status when pending", () => {
        const WrappedComponent = withMutationStatus(TestComponent, {
            loadingMessage: "Processing data...",
        });

        render(
            <WrappedComponent text="Test content" mutationStatus="pending" mutationError={null} />,
        );
        expect(screen.getByText("Test content")).toBeInTheDocument();
        expect(screen.getByText("Processing data...")).toBeInTheDocument();
    });

    it("should render error status with error", () => {
        const WrappedComponent = withMutationStatus(TestComponent, {});

        render(
            <WrappedComponent
                text="Test content"
                mutationStatus="error"
                mutationError={new Error("Test error")}
            />,
        );
        expect(screen.getByText("Test content")).toBeInTheDocument();
        expect(screen.getByText("Test error")).toBeInTheDocument();
    });
});

describe("getStatusConfig", () => {
    // Test via component behavior since getStatusConfig is internal
    it("should apply blue colors for pending", () => {
        const { container } = render(<MutationStatus status="pending" />);
        expect(container.querySelector(".bg-blue-50")).toBeInTheDocument();
    });

    it("should apply green colors for success", () => {
        const { container } = render(<MutationStatus status="success" autoHideSuccess={false} />);
        expect(container.querySelector(".bg-green-50")).toBeInTheDocument();
    });

    it("should apply red colors for error", () => {
        const { container } = render(<MutationStatus status="error" />);
        expect(container.querySelector(".bg-red-50")).toBeInTheDocument();
    });
});
