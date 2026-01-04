import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CollapsibleSection } from "../../webview/components/Common/CollapsibleSection";

describe("CollapsibleSection", () => {
    describe("rendering", () => {
        it("should render header content", () => {
            render(
                <CollapsibleSection header="Test Header">
                    <div>Content</div>
                </CollapsibleSection>,
            );

            expect(screen.getByText("Test Header")).toBeInTheDocument();
        });

        it("should render JSX header", () => {
            render(
                <CollapsibleSection header={<span data-testid="custom-header">Custom Header</span>}>
                    <div>Content</div>
                </CollapsibleSection>,
            );

            expect(screen.getByTestId("custom-header")).toBeInTheDocument();
        });

        it("should be collapsed by default", () => {
            render(
                <CollapsibleSection header="Header">
                    <div data-testid="content">Content</div>
                </CollapsibleSection>,
            );

            expect(screen.queryByTestId("content")).not.toBeInTheDocument();
        });

        it("should show content when defaultCollapsed is false", () => {
            render(
                <CollapsibleSection header="Header" defaultCollapsed={false}>
                    <div data-testid="content">Content</div>
                </CollapsibleSection>,
            );

            expect(screen.getByTestId("content")).toBeInTheDocument();
        });
    });

    describe("toggle behavior", () => {
        it("should expand when header clicked", () => {
            render(
                <CollapsibleSection header="Header">
                    <div data-testid="content">Content</div>
                </CollapsibleSection>,
            );

            fireEvent.click(screen.getByText("Header"));

            expect(screen.getByTestId("content")).toBeInTheDocument();
        });

        it("should collapse when header clicked again", () => {
            render(
                <CollapsibleSection header="Header" defaultCollapsed={false}>
                    <div data-testid="content">Content</div>
                </CollapsibleSection>,
            );

            fireEvent.click(screen.getByText("Header"));

            expect(screen.queryByTestId("content")).not.toBeInTheDocument();
        });

        it("should call onToggle callback", () => {
            const onToggle = vi.fn();
            render(
                <CollapsibleSection header="Header" onToggle={onToggle}>
                    <div>Content</div>
                </CollapsibleSection>,
            );

            fireEvent.click(screen.getByText("Header"));

            expect(onToggle).toHaveBeenCalledWith(false); // Now expanded (not collapsed)
        });

        it("should toggle on Enter key", () => {
            render(
                <CollapsibleSection header="Header">
                    <div data-testid="content">Content</div>
                </CollapsibleSection>,
            );

            const headerButton = screen.getByRole("button");
            fireEvent.keyDown(headerButton, { key: "Enter" });

            expect(screen.getByTestId("content")).toBeInTheDocument();
        });

        it("should toggle on Space key", () => {
            render(
                <CollapsibleSection header="Header">
                    <div data-testid="content">Content</div>
                </CollapsibleSection>,
            );

            const headerButton = screen.getByRole("button");
            fireEvent.keyDown(headerButton, { key: " " });

            expect(screen.getByTestId("content")).toBeInTheDocument();
        });
    });

    describe("controlled mode", () => {
        it("should respect isCollapsed prop", () => {
            render(
                <CollapsibleSection header="Header" isCollapsed={false}>
                    <div data-testid="content">Content</div>
                </CollapsibleSection>,
            );

            expect(screen.getByTestId("content")).toBeInTheDocument();
        });

        it("should update when isCollapsed prop changes", () => {
            const { rerender } = render(
                <CollapsibleSection header="Header" isCollapsed={true}>
                    <div data-testid="content">Content</div>
                </CollapsibleSection>,
            );

            expect(screen.queryByTestId("content")).not.toBeInTheDocument();

            rerender(
                <CollapsibleSection header="Header" isCollapsed={false}>
                    <div data-testid="content">Content</div>
                </CollapsibleSection>,
            );

            expect(screen.getByTestId("content")).toBeInTheDocument();
        });
    });

    describe("chevron", () => {
        it("should show chevron by default", () => {
            const { container } = render(
                <CollapsibleSection header="Header">
                    <div>Content</div>
                </CollapsibleSection>,
            );

            const svg = container.querySelector("svg");
            expect(svg).toBeInTheDocument();
        });

        it("should hide chevron when showChevron is false", () => {
            const { container } = render(
                <CollapsibleSection header="Header" showChevron={false}>
                    <div>Content</div>
                </CollapsibleSection>,
            );

            const svg = container.querySelector("svg");
            expect(svg).not.toBeInTheDocument();
        });

        it("should rotate chevron when expanded", () => {
            const { container } = render(
                <CollapsibleSection header="Header" defaultCollapsed={false}>
                    <div>Content</div>
                </CollapsibleSection>,
            );

            const svg = container.querySelector("svg");
            expect(svg?.classList.contains("rotate-90")).toBe(true);
        });

        it("should not rotate chevron when collapsed", () => {
            const { container } = render(
                <CollapsibleSection header="Header" defaultCollapsed={true}>
                    <div>Content</div>
                </CollapsibleSection>,
            );

            const svg = container.querySelector("svg");
            expect(svg?.classList.contains("rotate-90")).toBe(false);
        });

        it("should position chevron on right when chevronPosition is right", () => {
            const { container } = render(
                <CollapsibleSection header="Header" chevronPosition="right">
                    <div>Content</div>
                </CollapsibleSection>,
            );

            const header = container.querySelector('[role="button"]');
            const svg = header?.querySelector("svg");
            const headerContent = header?.querySelector(".flex-1");

            // Check that svg comes after the content div
            expect(headerContent?.nextElementSibling?.tagName).toBe("svg");
        });

        it("should apply custom chevron size", () => {
            const { container } = render(
                <CollapsibleSection header="Header" chevronSize={24}>
                    <div>Content</div>
                </CollapsibleSection>,
            );

            const svg = container.querySelector("svg");
            expect(svg?.style.width).toBe("24px");
            expect(svg?.style.height).toBe("24px");
        });
    });

    describe("classNames", () => {
        it("should apply custom className to container", () => {
            const { container } = render(
                <CollapsibleSection header="Header" className="custom-container">
                    <div>Content</div>
                </CollapsibleSection>,
            );

            expect(container.firstChild).toHaveClass("custom-container");
        });

        it("should apply headerClassName to header", () => {
            render(
                <CollapsibleSection header="Header" headerClassName="custom-header">
                    <div>Content</div>
                </CollapsibleSection>,
            );

            const header = screen.getByRole("button");
            expect(header).toHaveClass("custom-header");
        });

        it("should apply contentClassName to content wrapper", () => {
            const { container } = render(
                <CollapsibleSection
                    header="Header"
                    contentClassName="custom-content"
                    defaultCollapsed={false}
                >
                    <div data-testid="content">Content</div>
                </CollapsibleSection>,
            );

            const contentWrapper = screen.getByTestId("content").parentElement;
            expect(contentWrapper).toHaveClass("custom-content");
        });
    });

    describe("accessibility", () => {
        it("should have role button on header", () => {
            render(
                <CollapsibleSection header="Header">
                    <div>Content</div>
                </CollapsibleSection>,
            );

            expect(screen.getByRole("button")).toBeInTheDocument();
        });

        it("should have tabIndex 0", () => {
            render(
                <CollapsibleSection header="Header">
                    <div>Content</div>
                </CollapsibleSection>,
            );

            expect(screen.getByRole("button")).toHaveAttribute("tabIndex", "0");
        });

        it("should have aria-expanded false when collapsed", () => {
            render(
                <CollapsibleSection header="Header">
                    <div>Content</div>
                </CollapsibleSection>,
            );

            expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
        });

        it("should have aria-expanded true when expanded", () => {
            render(
                <CollapsibleSection header="Header" defaultCollapsed={false}>
                    <div>Content</div>
                </CollapsibleSection>,
            );

            expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
        });
    });
});
