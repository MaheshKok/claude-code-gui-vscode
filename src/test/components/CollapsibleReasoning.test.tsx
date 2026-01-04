import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CollapsibleReasoning } from "../../webview/components/Chat/JourneyTimeline/CollapsibleReasoning";

describe("CollapsibleReasoning", () => {
    describe("rendering", () => {
        it("should render content", () => {
            render(<CollapsibleReasoning content="Test reasoning content" />);

            expect(screen.getByText("Test reasoning content")).toBeInTheDocument();
        });

        it("should render with line-clamp when collapsed", () => {
            const { container } = render(<CollapsibleReasoning content="Test content" />);

            const paragraph = container.querySelector("p");
            expect(paragraph?.classList.contains("line-clamp-3")).toBe(true);
        });

        it("should not show toggle button for short content", () => {
            render(<CollapsibleReasoning content="Short content" />);

            expect(screen.queryByText("Show full reasoning")).not.toBeInTheDocument();
            expect(screen.queryByText("Show less")).not.toBeInTheDocument();
        });
    });

    describe("expand/collapse behavior", () => {
        const longContent = "A".repeat(200); // Over 150 character threshold

        it("should show expand button for long content", () => {
            render(<CollapsibleReasoning content={longContent} />);

            expect(screen.getByText("Show full reasoning")).toBeInTheDocument();
        });

        it("should expand when button clicked", () => {
            const { container } = render(<CollapsibleReasoning content={longContent} />);

            fireEvent.click(screen.getByText("Show full reasoning"));

            const paragraph = container.querySelector("p");
            expect(paragraph?.classList.contains("line-clamp-3")).toBe(false);
            expect(screen.getByText("Show less")).toBeInTheDocument();
        });

        it("should collapse when button clicked again", () => {
            const { container } = render(<CollapsibleReasoning content={longContent} />);

            // Expand
            fireEvent.click(screen.getByText("Show full reasoning"));
            // Collapse
            fireEvent.click(screen.getByText("Show less"));

            const paragraph = container.querySelector("p");
            expect(paragraph?.classList.contains("line-clamp-3")).toBe(true);
            expect(screen.getByText("Show full reasoning")).toBeInTheDocument();
        });

        it("should stop event propagation on toggle", () => {
            const parentClick = vi.fn();
            render(
                <div onClick={parentClick}>
                    <CollapsibleReasoning content={longContent} />
                </div>,
            );

            fireEvent.click(screen.getByText("Show full reasoning"));

            expect(parentClick).not.toHaveBeenCalled();
        });
    });

    describe("content styling", () => {
        it("should preserve whitespace in content", () => {
            const { container } = render(<CollapsibleReasoning content="Line 1\nLine 2\nLine 3" />);

            const paragraph = container.querySelector("p");
            expect(paragraph?.classList.contains("whitespace-pre-wrap")).toBe(true);
        });

        it("should have proper text styling", () => {
            const { container } = render(<CollapsibleReasoning content="Test" />);

            const paragraph = container.querySelector("p");
            expect(paragraph?.classList.contains("text-sm")).toBe(true);
            expect(paragraph?.classList.contains("text-white/80")).toBe(true);
        });
    });
});

// Need to import vi for event tests
import { vi } from "vitest";
