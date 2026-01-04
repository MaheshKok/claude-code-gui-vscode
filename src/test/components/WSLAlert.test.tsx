import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WSLAlert } from "../../webview/components/Common/WSLAlert";

describe("WSLAlert", () => {
    const defaultProps = {
        onDismiss: vi.fn(),
        onConfigure: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("rendering", () => {
        it("should render alert message", () => {
            render(<WSLAlert {...defaultProps} />);

            expect(
                screen.getByText(
                    "Running on Windows without WSL configured. Some features may not work correctly.",
                ),
            ).toBeInTheDocument();
        });

        it("should render Configure WSL button", () => {
            render(<WSLAlert {...defaultProps} />);

            expect(screen.getByText("Configure WSL")).toBeInTheDocument();
        });

        it("should render dismiss button", () => {
            render(<WSLAlert {...defaultProps} />);

            expect(screen.getByLabelText("Dismiss")).toBeInTheDocument();
        });

        it("should have role alert", () => {
            render(<WSLAlert {...defaultProps} />);

            expect(screen.getByRole("alert")).toBeInTheDocument();
        });
    });

    describe("interactions", () => {
        it("should call onConfigure when Configure WSL is clicked", () => {
            const onConfigure = vi.fn();
            render(<WSLAlert {...defaultProps} onConfigure={onConfigure} />);

            fireEvent.click(screen.getByText("Configure WSL"));

            expect(onConfigure).toHaveBeenCalledTimes(1);
        });

        it("should call onDismiss when dismiss button is clicked", () => {
            const onDismiss = vi.fn();
            render(<WSLAlert {...defaultProps} onDismiss={onDismiss} />);

            fireEvent.click(screen.getByLabelText("Dismiss"));

            expect(onDismiss).toHaveBeenCalledTimes(1);
        });
    });

    describe("accessibility", () => {
        it("should have button type for Configure WSL", () => {
            render(<WSLAlert {...defaultProps} />);

            expect(screen.getByText("Configure WSL")).toHaveAttribute("type", "button");
        });

        it("should have button type for dismiss", () => {
            render(<WSLAlert {...defaultProps} />);

            expect(screen.getByLabelText("Dismiss")).toHaveAttribute("type", "button");
        });
    });
});
