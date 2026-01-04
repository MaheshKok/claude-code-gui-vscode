import { describe, it, expect } from "vitest";
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

            expect(
                screen.getByText(/I can help you analyze code, fix bugs/)
            ).toBeInTheDocument();
        });

        it("should render quick action buttons", () => {
            render(<EmptyState />);

            expect(screen.getByText("Explain Code")).toBeInTheDocument();
            expect(screen.getByText("Fix Bugs")).toBeInTheDocument();
            expect(screen.getByText("Write Tests")).toBeInTheDocument();
            expect(screen.getByText("Refactor")).toBeInTheDocument();
        });

        it("should render decorative icon", () => {
            render(<EmptyState />);

            // The component renders an SVG with a specific path
            const svg = document.querySelector("svg");
            expect(svg).toBeInTheDocument();
        });
    });
});
