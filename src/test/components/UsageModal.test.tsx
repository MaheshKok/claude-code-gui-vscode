import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UsageModal } from "../../webview/components/Modals/UsageModal";

// Mock UsageData component
vi.mock("../../webview/components/UsageData", () => ({
    UsageData: () => <div data-testid="usage-data">Usage Data Content</div>,
}));

describe("UsageModal", () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("rendering", () => {
        it("should render modal with title when open", () => {
            render(<UsageModal {...defaultProps} />);

            expect(screen.getByText("Usage Data")).toBeInTheDocument();
        });

        it("should not render when closed", () => {
            render(<UsageModal {...defaultProps} isOpen={false} />);

            expect(screen.queryByText("Usage Data")).not.toBeInTheDocument();
        });

        it("should render UsageData component", () => {
            render(<UsageModal {...defaultProps} />);

            expect(screen.getByTestId("usage-data")).toBeInTheDocument();
        });
    });

    describe("close behavior", () => {
        it("should call onClose when backdrop clicked", () => {
            const onClose = vi.fn();
            render(<UsageModal {...defaultProps} onClose={onClose} />);

            const backdrop = document.querySelector('[aria-hidden="true"]');
            if (backdrop) {
                fireEvent.click(backdrop);
            }

            expect(onClose).toHaveBeenCalled();
        });

        it("should call onClose when close button clicked", () => {
            const onClose = vi.fn();
            render(<UsageModal {...defaultProps} onClose={onClose} />);

            // Modal component typically has a close button
            const closeButton = screen.getByRole("button");
            if (closeButton) {
                fireEvent.click(closeButton);
            }

            expect(onClose).toHaveBeenCalled();
        });
    });
});
