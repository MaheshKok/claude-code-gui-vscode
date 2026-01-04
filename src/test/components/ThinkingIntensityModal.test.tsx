import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThinkingIntensityModal } from "../../webview/components/Modals/ThinkingIntensityModal";
import type { ThinkingLevel } from "../../webview/components/Modals/ThinkingIntensityModal";

describe("ThinkingIntensityModal", () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        currentLevel: 0 as ThinkingLevel,
        onConfirm: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("rendering", () => {
        it("should render modal when open", () => {
            render(<ThinkingIntensityModal {...defaultProps} />);

            expect(screen.getByText("Thinking Mode Intensity")).toBeInTheDocument();
        });

        it("should not render when closed", () => {
            render(<ThinkingIntensityModal {...defaultProps} isOpen={false} />);

            expect(screen.queryByText("Thinking Mode Intensity")).not.toBeInTheDocument();
        });

        it("should show description", () => {
            render(<ThinkingIntensityModal {...defaultProps} />);

            expect(
                screen.getByText(/Configure the intensity of thinking mode/),
            ).toBeInTheDocument();
        });

        it("should show slider", () => {
            render(<ThinkingIntensityModal {...defaultProps} />);

            expect(screen.getByRole("slider")).toBeInTheDocument();
        });

        it("should show all level labels", () => {
            render(<ThinkingIntensityModal {...defaultProps} />);

            // "Think" appears multiple times (in labels and descriptions), use getAllByText
            const thinkElements = screen.getAllByText("Think");
            expect(thinkElements.length).toBeGreaterThan(0);
            expect(screen.getByText("Think Hard")).toBeInTheDocument();
            expect(screen.getByText("Think Harder")).toBeInTheDocument();
            expect(screen.getByText("Ultrathink")).toBeInTheDocument();
        });
    });

    describe("level selection", () => {
        it("should show Think level description by default", () => {
            render(<ThinkingIntensityModal {...defaultProps} />);

            expect(
                screen.getByText("Basic reasoning - fastest response times"),
            ).toBeInTheDocument();
        });

        it("should update level when slider changed", () => {
            render(<ThinkingIntensityModal {...defaultProps} />);

            const slider = screen.getByRole("slider");
            fireEvent.change(slider, { target: { value: "2" } });

            expect(
                screen.getByText("Extended reasoning for challenging tasks"),
            ).toBeInTheDocument();
        });

        it("should update level when label clicked", () => {
            render(<ThinkingIntensityModal {...defaultProps} />);

            fireEvent.click(screen.getByText("Ultrathink"));

            expect(
                screen.getByText("Maximum reasoning depth - highest token usage"),
            ).toBeInTheDocument();
        });
    });

    describe("token usage indicator", () => {
        it("should show Low for level 0", () => {
            render(<ThinkingIntensityModal {...defaultProps} currentLevel={0} />);

            expect(screen.getByText("Low")).toBeInTheDocument();
        });

        it("should show Medium for level 1", () => {
            render(<ThinkingIntensityModal {...defaultProps} />);

            const slider = screen.getByRole("slider");
            fireEvent.change(slider, { target: { value: "1" } });

            expect(screen.getByText("Medium")).toBeInTheDocument();
        });

        it("should show High for level 2", () => {
            render(<ThinkingIntensityModal {...defaultProps} />);

            const slider = screen.getByRole("slider");
            fireEvent.change(slider, { target: { value: "2" } });

            expect(screen.getByText("High")).toBeInTheDocument();
        });

        it("should show Very High for level 3", () => {
            render(<ThinkingIntensityModal {...defaultProps} />);

            const slider = screen.getByRole("slider");
            fireEvent.change(slider, { target: { value: "3" } });

            expect(screen.getByText("Very High")).toBeInTheDocument();
        });
    });

    describe("actions", () => {
        it("should call onClose when Cancel clicked", () => {
            const onClose = vi.fn();
            render(<ThinkingIntensityModal {...defaultProps} onClose={onClose} />);

            fireEvent.click(screen.getByText("Cancel"));

            expect(onClose).toHaveBeenCalled();
        });

        it("should call onConfirm with selected level when Confirm clicked", () => {
            const onConfirm = vi.fn();
            render(<ThinkingIntensityModal {...defaultProps} onConfirm={onConfirm} />);

            // Change level
            const slider = screen.getByRole("slider");
            fireEvent.change(slider, { target: { value: "2" } });

            fireEvent.click(screen.getByText("Confirm"));

            expect(onConfirm).toHaveBeenCalledWith(2);
        });

        it("should call onClose after Confirm", () => {
            const onClose = vi.fn();
            render(<ThinkingIntensityModal {...defaultProps} onClose={onClose} />);

            fireEvent.click(screen.getByText("Confirm"));

            expect(onClose).toHaveBeenCalled();
        });
    });

    describe("current level", () => {
        it("should reset to current level when modal opens", () => {
            const { rerender } = render(
                <ThinkingIntensityModal {...defaultProps} isOpen={false} currentLevel={2} />,
            );

            // Open modal
            rerender(<ThinkingIntensityModal {...defaultProps} isOpen={true} currentLevel={2} />);

            expect(
                screen.getByText("Extended reasoning for challenging tasks"),
            ).toBeInTheDocument();
        });

        it("should start with current level as selected", () => {
            render(<ThinkingIntensityModal {...defaultProps} currentLevel={1} />);

            expect(
                screen.getByText("More detailed reasoning for complex problems"),
            ).toBeInTheDocument();
        });
    });

    describe("slider properties", () => {
        it("should have correct min/max values", () => {
            render(<ThinkingIntensityModal {...defaultProps} />);

            const slider = screen.getByRole("slider");
            expect(slider).toHaveAttribute("min", "0");
            expect(slider).toHaveAttribute("max", "3");
        });

        it("should have aria-label", () => {
            render(<ThinkingIntensityModal {...defaultProps} />);

            expect(screen.getByLabelText("Thinking intensity level")).toBeInTheDocument();
        });
    });
});
