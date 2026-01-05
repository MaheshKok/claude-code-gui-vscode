import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuickAction } from "../../webview/components/Chat/JourneyTimeline/QuickAction";

describe("QuickAction", () => {
    describe("rendering", () => {
        it("should render the label", () => {
            render(<QuickAction label="Test Action" icon={<span>🔍</span>} />);

            expect(screen.getByText("Test Action")).toBeInTheDocument();
        });

        it("should render the icon", () => {
            render(<QuickAction label="Test Action" icon={<span data-testid="icon">🔍</span>} />);

            expect(screen.getByTestId("icon")).toBeInTheDocument();
        });

        it("should be a button element", () => {
            render(<QuickAction label="Click Me" icon={<span>✨</span>} />);

            expect(screen.getByRole("button")).toBeInTheDocument();
        });
        it("should call onClick when clicked", () => {
            const handleClick = vi.fn();
            render(<QuickAction label="Click Me" icon={<span>✨</span>} onClick={handleClick} />);

            screen.getByRole("button").click();
            expect(handleClick).toHaveBeenCalledTimes(1);
        });
    });
});
