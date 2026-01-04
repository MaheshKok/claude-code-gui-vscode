import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { InstallModal } from "../../webview/components/Modals/InstallModal";

describe("InstallModal", () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        onInstall: vi.fn().mockResolvedValue(undefined),
        installState: "initial" as const,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("rendering", () => {
        it("should render modal when open", () => {
            render(<InstallModal {...defaultProps} />);

            expect(screen.getByRole("dialog")).toBeInTheDocument();
        });

        it("should not render when closed", () => {
            render(<InstallModal {...defaultProps} isOpen={false} />);

            expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        });

        it("should display title in initial state", () => {
            render(<InstallModal {...defaultProps} />);

            expect(screen.getByText("Install Claude Code")).toBeInTheDocument();
        });

        it("should display description in initial state", () => {
            render(<InstallModal {...defaultProps} />);

            expect(
                screen.getByText("The CLI is required to use this extension"),
            ).toBeInTheDocument();
        });

        it("should show Install Now button in initial state", () => {
            render(<InstallModal {...defaultProps} />);

            expect(screen.getByText("Install Now")).toBeInTheDocument();
        });

        it("should show documentation link in initial state", () => {
            render(<InstallModal {...defaultProps} />);

            expect(screen.getByText("View documentation")).toBeInTheDocument();
        });
    });

    describe("initial state", () => {
        it("should call onInstall when Install Now clicked", async () => {
            const onInstall = vi.fn().mockResolvedValue(undefined);
            render(<InstallModal {...defaultProps} onInstall={onInstall} />);

            fireEvent.click(screen.getByText("Install Now"));

            await waitFor(() => {
                expect(onInstall).toHaveBeenCalled();
            });
        });

        it("should show close button", () => {
            render(<InstallModal {...defaultProps} />);

            expect(screen.getByLabelText("Close modal")).toBeInTheDocument();
        });

        it("should call onClose when close button clicked", () => {
            const onClose = vi.fn();
            render(<InstallModal {...defaultProps} onClose={onClose} />);

            fireEvent.click(screen.getByLabelText("Close modal"));

            expect(onClose).toHaveBeenCalled();
        });
    });

    describe("installing state", () => {
        it("should show loading message", () => {
            render(<InstallModal {...defaultProps} installState="installing" />);

            expect(screen.getByText("Installing Claude Code...")).toBeInTheDocument();
        });

        it("should show time message", () => {
            render(<InstallModal {...defaultProps} installState="installing" />);

            expect(screen.getByText("This may take a minute")).toBeInTheDocument();
        });

        it("should not show close button when installing", () => {
            render(<InstallModal {...defaultProps} installState="installing" />);

            expect(screen.queryByLabelText("Close modal")).not.toBeInTheDocument();
        });

        it("should not close on backdrop click when installing", () => {
            const onClose = vi.fn();
            render(<InstallModal {...defaultProps} installState="installing" onClose={onClose} />);

            // Click the backdrop
            const backdrop = document.querySelector('[aria-hidden="true"]');
            if (backdrop) {
                fireEvent.click(backdrop);
            }

            expect(onClose).not.toHaveBeenCalled();
        });
    });

    describe("success state", () => {
        it("should show success message", () => {
            render(<InstallModal {...defaultProps} installState="success" />);

            expect(screen.getByText("Installation Complete")).toBeInTheDocument();
        });

        it("should show get started message", () => {
            render(<InstallModal {...defaultProps} installState="success" />);

            expect(screen.getByText("Send a message to get started")).toBeInTheDocument();
        });

        it("should show Get Started button", () => {
            render(<InstallModal {...defaultProps} installState="success" />);

            expect(screen.getByText("Get Started")).toBeInTheDocument();
        });

        it("should call onClose when Get Started clicked", () => {
            const onClose = vi.fn();
            render(<InstallModal {...defaultProps} installState="success" onClose={onClose} />);

            fireEvent.click(screen.getByText("Get Started"));

            expect(onClose).toHaveBeenCalled();
        });
    });

    describe("error state", () => {
        it("should show error message", () => {
            render(<InstallModal {...defaultProps} installState="error" />);

            expect(screen.getByText("Installation Failed")).toBeInTheDocument();
        });

        it("should show custom error message when provided", () => {
            render(
                <InstallModal
                    {...defaultProps}
                    installState="error"
                    errorMessage="Connection failed"
                />,
            );

            expect(screen.getByText("Connection failed")).toBeInTheDocument();
        });

        it("should show Retry button", () => {
            render(<InstallModal {...defaultProps} installState="error" />);

            expect(screen.getByText("Retry")).toBeInTheDocument();
        });

        it("should show Close button", () => {
            render(<InstallModal {...defaultProps} installState="error" />);

            expect(screen.getByText("Close")).toBeInTheDocument();
        });

        it("should call onInstall when Retry clicked", async () => {
            const onInstall = vi.fn().mockResolvedValue(undefined);
            render(<InstallModal {...defaultProps} installState="error" onInstall={onInstall} />);

            fireEvent.click(screen.getByText("Retry"));

            await waitFor(() => {
                expect(onInstall).toHaveBeenCalled();
            });
        });

        it("should call onClose when Close clicked", () => {
            const onClose = vi.fn();
            render(<InstallModal {...defaultProps} installState="error" onClose={onClose} />);

            fireEvent.click(screen.getByText("Close"));

            expect(onClose).toHaveBeenCalled();
        });

        it("should show manual installation link", () => {
            render(<InstallModal {...defaultProps} installState="error" />);

            expect(screen.getByText("Manual installation instructions")).toBeInTheDocument();
        });
    });

    describe("backdrop interaction", () => {
        it("should close on backdrop click in initial state", () => {
            const onClose = vi.fn();
            render(<InstallModal {...defaultProps} onClose={onClose} />);

            // Find and click the backdrop
            const backdrop = document.querySelector('[aria-hidden="true"]');
            if (backdrop) {
                fireEvent.click(backdrop);
            }

            expect(onClose).toHaveBeenCalled();
        });

        it("should close on backdrop click in success state", () => {
            const onClose = vi.fn();
            render(<InstallModal {...defaultProps} installState="success" onClose={onClose} />);

            const backdrop = document.querySelector('[aria-hidden="true"]');
            if (backdrop) {
                fireEvent.click(backdrop);
            }

            expect(onClose).toHaveBeenCalled();
        });

        it("should close on backdrop click in error state", () => {
            const onClose = vi.fn();
            render(<InstallModal {...defaultProps} installState="error" onClose={onClose} />);

            const backdrop = document.querySelector('[aria-hidden="true"]');
            if (backdrop) {
                fireEvent.click(backdrop);
            }

            expect(onClose).toHaveBeenCalled();
        });
    });

    describe("error handling", () => {
        it("should handle onInstall rejection gracefully", async () => {
            const onInstall = vi.fn().mockRejectedValue(new Error("Install failed"));
            render(<InstallModal {...defaultProps} onInstall={onInstall} />);

            fireEvent.click(screen.getByText("Install Now"));

            await waitFor(() => {
                expect(onInstall).toHaveBeenCalled();
            });

            // Should not throw
        });
    });

    describe("accessibility", () => {
        it("should have proper aria attributes", () => {
            render(<InstallModal {...defaultProps} />);

            const dialog = screen.getByRole("dialog");
            expect(dialog).toHaveAttribute("aria-modal", "true");
            expect(dialog).toHaveAttribute("aria-labelledby", "install-modal-title");
        });

        it("should have proper title id", () => {
            render(<InstallModal {...defaultProps} />);

            const title = document.getElementById("install-modal-title");
            expect(title).toBeInTheDocument();
            expect(title?.textContent).toBe("Install Claude Code");
        });
    });
});
