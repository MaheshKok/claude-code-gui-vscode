import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Modal } from "../../webview/components/Modals/Modal";

describe("Modal", () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        title: "Test Modal",
        children: <div>Modal Content</div>,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("rendering", () => {
        it("should render when isOpen is true", () => {
            render(<Modal {...defaultProps} />);

            expect(screen.getByRole("dialog")).toBeInTheDocument();
            expect(screen.getByText("Test Modal")).toBeInTheDocument();
            expect(screen.getByText("Modal Content")).toBeInTheDocument();
        });

        it("should not render when isOpen is false", () => {
            render(<Modal {...defaultProps} isOpen={false} />);

            expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        });

        it("should render title in header", () => {
            render(<Modal {...defaultProps} title="Custom Title" />);

            expect(screen.getByText("Custom Title")).toBeInTheDocument();
        });

        it("should render children content", () => {
            render(
                <Modal {...defaultProps}>
                    <p>Custom Content</p>
                    <button>Action</button>
                </Modal>,
            );

            expect(screen.getByText("Custom Content")).toBeInTheDocument();
            expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
        });
    });

    describe("close button", () => {
        it("should show close button by default", () => {
            render(<Modal {...defaultProps} />);

            expect(screen.getByLabelText("Close modal")).toBeInTheDocument();
        });

        it("should hide close button when showCloseButton is false", () => {
            render(<Modal {...defaultProps} showCloseButton={false} />);

            expect(screen.queryByLabelText("Close modal")).not.toBeInTheDocument();
        });

        it("should call onClose when close button is clicked", () => {
            const onClose = vi.fn();
            render(<Modal {...defaultProps} onClose={onClose} />);

            fireEvent.click(screen.getByLabelText("Close modal"));

            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });

    describe("backdrop click", () => {
        it("should call onClose when backdrop is clicked", () => {
            const onClose = vi.fn();
            render(<Modal {...defaultProps} onClose={onClose} />);

            // Find the backdrop by its class
            const backdrop = document.querySelector(".backdrop-blur-sm");
            if (backdrop) {
                fireEvent.click(backdrop);
            }

            expect(onClose).toHaveBeenCalledTimes(1);
        });

        it("should not call onClose when closeOnBackdrop is false", () => {
            const onClose = vi.fn();
            render(<Modal {...defaultProps} onClose={onClose} closeOnBackdrop={false} />);

            const backdrop = document.querySelector(".backdrop-blur-sm");
            if (backdrop) {
                fireEvent.click(backdrop);
            }

            expect(onClose).not.toHaveBeenCalled();
        });
    });

    describe("keyboard navigation", () => {
        it("should call onClose when Escape key is pressed", () => {
            const onClose = vi.fn();
            render(<Modal {...defaultProps} onClose={onClose} />);

            fireEvent.keyDown(document, { key: "Escape" });

            expect(onClose).toHaveBeenCalledTimes(1);
        });

        it("should not call onClose for other keys", () => {
            const onClose = vi.fn();
            render(<Modal {...defaultProps} onClose={onClose} />);

            fireEvent.keyDown(document, { key: "Enter" });
            fireEvent.keyDown(document, { key: "Tab" });

            expect(onClose).not.toHaveBeenCalled();
        });
    });

    describe("width variants", () => {
        it("should apply sm width class", () => {
            render(<Modal {...defaultProps} width="sm" />);

            const modalContent = document.querySelector(".max-w-sm");
            expect(modalContent).toBeInTheDocument();
        });

        it("should apply md width class by default", () => {
            render(<Modal {...defaultProps} />);

            const modalContent = document.querySelector(".max-w-md");
            expect(modalContent).toBeInTheDocument();
        });

        it("should apply lg width class", () => {
            render(<Modal {...defaultProps} width="lg" />);

            const modalContent = document.querySelector(".max-w-lg");
            expect(modalContent).toBeInTheDocument();
        });

        it("should apply xl width class", () => {
            render(<Modal {...defaultProps} width="xl" />);

            const modalContent = document.querySelector(".max-w-xl");
            expect(modalContent).toBeInTheDocument();
        });
    });

    describe("custom className", () => {
        it("should apply custom className", () => {
            render(<Modal {...defaultProps} className="custom-class" />);

            const modalContent = document.querySelector(".custom-class");
            expect(modalContent).toBeInTheDocument();
        });
    });

    describe("accessibility", () => {
        it("should have role dialog", () => {
            render(<Modal {...defaultProps} />);

            expect(screen.getByRole("dialog")).toBeInTheDocument();
        });

        it("should have aria-modal attribute", () => {
            render(<Modal {...defaultProps} />);

            expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
        });

        it("should have aria-labelledby pointing to title", () => {
            render(<Modal {...defaultProps} />);

            const dialog = screen.getByRole("dialog");
            expect(dialog).toHaveAttribute("aria-labelledby", "modal-title");
        });
    });

    describe("body overflow", () => {
        it("should set body overflow to hidden when open", () => {
            render(<Modal {...defaultProps} />);

            expect(document.body.style.overflow).toBe("hidden");
        });

        it("should restore body overflow when closed", () => {
            const { unmount } = render(<Modal {...defaultProps} />);

            unmount();

            expect(document.body.style.overflow).toBe("");
        });
    });

    describe("cleanup", () => {
        it("should remove keydown listener on unmount", () => {
            const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");
            const { unmount } = render(<Modal {...defaultProps} />);

            unmount();

            expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
            removeEventListenerSpy.mockRestore();
        });
    });
});
