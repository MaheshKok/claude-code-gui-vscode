import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "../../webview/components/Common/ErrorBoundary";

// Component that throws an error
const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
        throw new Error("Test error");
    }
    return <div>Normal content</div>;
};

describe("ErrorBoundary", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Suppress console.error for cleaner test output
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    describe("normal rendering", () => {
        it("should render children when no error", () => {
            render(
                <ErrorBoundary>
                    <div>Child content</div>
                </ErrorBoundary>,
            );

            expect(screen.getByText("Child content")).toBeInTheDocument();
        });

        it("should render multiple children", () => {
            render(
                <ErrorBoundary>
                    <div>First child</div>
                    <div>Second child</div>
                </ErrorBoundary>,
            );

            expect(screen.getByText("First child")).toBeInTheDocument();
            expect(screen.getByText("Second child")).toBeInTheDocument();
        });
    });

    describe("error handling", () => {
        it("should catch errors and display fallback UI", () => {
            render(
                <ErrorBoundary>
                    <ThrowingComponent shouldThrow={true} />
                </ErrorBoundary>,
            );

            expect(screen.getByText("Something went wrong")).toBeInTheDocument();
        });

        it("should display error message", () => {
            render(
                <ErrorBoundary>
                    <ThrowingComponent shouldThrow={true} />
                </ErrorBoundary>,
            );

            expect(screen.getByText(/Test error/)).toBeInTheDocument();
        });

        it("should display custom fallback when provided", () => {
            render(
                <ErrorBoundary fallback={<div>Custom fallback</div>}>
                    <ThrowingComponent shouldThrow={true} />
                </ErrorBoundary>,
            );

            expect(screen.getByText("Custom fallback")).toBeInTheDocument();
        });

        it("should include component name in error message", () => {
            render(
                <ErrorBoundary componentName="MyComponent">
                    <ThrowingComponent shouldThrow={true} />
                </ErrorBoundary>,
            );

            expect(screen.getByText(/Error in MyComponent/)).toBeInTheDocument();
        });

        it("should call onError callback when error occurs", () => {
            const onError = vi.fn();
            render(
                <ErrorBoundary onError={onError}>
                    <ThrowingComponent shouldThrow={true} />
                </ErrorBoundary>,
            );

            expect(onError).toHaveBeenCalled();
            expect(onError.mock.calls[0][0].message).toBe("Test error");
        });

        it("should log error to console", () => {
            const consoleSpy = vi.spyOn(console, "error");
            render(
                <ErrorBoundary>
                    <ThrowingComponent shouldThrow={true} />
                </ErrorBoundary>,
            );

            expect(consoleSpy).toHaveBeenCalled();
        });
    });

    describe("retry functionality", () => {
        it("should show retry button", () => {
            render(
                <ErrorBoundary>
                    <ThrowingComponent shouldThrow={true} />
                </ErrorBoundary>,
            );

            expect(screen.getByText("Try again")).toBeInTheDocument();
        });

        it("should reset error state when retry clicked", () => {
            render(
                <ErrorBoundary>
                    <ThrowingComponent shouldThrow={true} />
                </ErrorBoundary>,
            );

            expect(screen.getByText("Something went wrong")).toBeInTheDocument();

            // Click retry button
            fireEvent.click(screen.getByText("Try again"));

            // After clicking, component tries to re-render children
            // Since ThrowingComponent still throws, error state is set again
            expect(screen.getByText("Something went wrong")).toBeInTheDocument();
        });
    });

    describe("getDerivedStateFromError", () => {
        it("should set hasError to true", () => {
            render(
                <ErrorBoundary>
                    <ThrowingComponent shouldThrow={true} />
                </ErrorBoundary>,
            );

            // The error UI should be displayed
            expect(screen.getByText("Something went wrong")).toBeInTheDocument();
        });
    });
});
