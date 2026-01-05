import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "../../webview/components/Chat/JourneyTimeline/EmptyState";

describe("EmptyState", () => {
    describe("rendering", () => {
        it("should render the title", () => {
            render(<EmptyState />);

            expect(screen.getByText("How can I help?")).toBeInTheDocument();
        });

        it("should render the description", () => {
            render(<EmptyState />);

            expect(screen.getByText(/I can help you analyze code, fix bugs/)).toBeInTheDocument();
        });

        it("should render quick action buttons", () => {
            render(<EmptyState />);

            expect(screen.getByText("Explain Code")).toBeInTheDocument();
            expect(screen.getByText("Fix Bugs")).toBeInTheDocument();
            expect(screen.getByText("Write Tests")).toBeInTheDocument();
            expect(screen.getByText("Refactor")).toBeInTheDocument();
            expect(screen.getByText("Performance")).toBeInTheDocument();
            expect(screen.getByText("Security")).toBeInTheDocument();
        });

        it("should call onAction with correct prompt when clicked", () => {
            const handleAction = vi.fn();
            render(<EmptyState onAction={handleAction} />);

            screen.getByText("Explain Code").click();
            expect(handleAction).toHaveBeenCalledWith("Explain how this code works in detail");

            screen.getByText("Fix Bugs").click();
            expect(handleAction).toHaveBeenCalledWith("Help me fix this bug in my code");

            screen.getByText("Write Tests").click();
            expect(handleAction).toHaveBeenCalledWith("Generate comprehensive tests for this code");

            screen.getByText("Refactor").click();
            expect(handleAction).toHaveBeenCalledWith(
                "Refactor this code to improve readability and maintainability",
            );

            screen.getByText("Performance").click();
            expect(handleAction).toHaveBeenCalledWith(
                "Analyze this code for performance issues and suggest optimizations",
            );

            screen.getByText("Security").click();
            expect(handleAction).toHaveBeenCalledWith(
                "Review this code for security vulnerabilities",
            );
        });

        it("should render decorative icon", () => {
            render(<EmptyState />);

            // The component renders an SVG with a specific path
            const svg = document.querySelector("svg");
            expect(svg).toBeInTheDocument();
        });
    });
});
