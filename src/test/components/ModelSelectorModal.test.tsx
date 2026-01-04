import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ModelSelectorModal } from "../../webview/components/Modals/ModelSelectorModal";
import type { ModelOption } from "../../webview/components/Modals/ModelSelectorModal";

describe("ModelSelectorModal", () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        selectedModel: "sonnet" as ModelOption,
        onSelectModel: vi.fn(),
        onConfigure: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("rendering", () => {
        it("should render modal when open", () => {
            render(<ModelSelectorModal {...defaultProps} />);

            expect(screen.getByText("Enforce Model")).toBeInTheDocument();
        });

        it("should not render when closed", () => {
            render(<ModelSelectorModal {...defaultProps} isOpen={false} />);

            expect(screen.queryByText("Enforce Model")).not.toBeInTheDocument();
        });

        it("should show description", () => {
            render(<ModelSelectorModal {...defaultProps} />);

            expect(
                screen.getByText(/This overrides your default model setting/),
            ).toBeInTheDocument();
        });
    });

    describe("model options", () => {
        it("should show Sonnet option", () => {
            render(<ModelSelectorModal {...defaultProps} />);

            expect(screen.getByText("Sonnet 4.5 - Balanced model")).toBeInTheDocument();
            expect(screen.getByText(/Good balance of speed/)).toBeInTheDocument();
        });

        it("should show Opus option", () => {
            render(<ModelSelectorModal {...defaultProps} />);

            expect(screen.getByText("Opus 4.5 - Most capable model")).toBeInTheDocument();
            expect(screen.getByText(/Best for complex tasks/)).toBeInTheDocument();
        });

        it("should show Haiku option", () => {
            render(<ModelSelectorModal {...defaultProps} />);

            expect(screen.getByText("Haiku 4.5 - Fast model")).toBeInTheDocument();
            expect(screen.getByText(/Fastest responses/)).toBeInTheDocument();
        });

        it("should render radio buttons for each model", () => {
            render(<ModelSelectorModal {...defaultProps} />);

            const radios = screen.getAllByRole("radio");
            expect(radios.length).toBe(3);
        });
    });

    describe("selection", () => {
        it("should show sonnet as selected", () => {
            render(<ModelSelectorModal {...defaultProps} selectedModel="sonnet" />);

            const radios = screen.getAllByRole("radio");
            expect(radios[0]).toBeChecked(); // Sonnet is first
        });

        it("should show opus as selected", () => {
            render(<ModelSelectorModal {...defaultProps} selectedModel="opus" />);

            const radios = screen.getAllByRole("radio");
            expect(radios[1]).toBeChecked(); // Opus is second
        });

        it("should show haiku as selected", () => {
            render(<ModelSelectorModal {...defaultProps} selectedModel="haiku" />);

            const radios = screen.getAllByRole("radio");
            expect(radios[2]).toBeChecked(); // Haiku is third
        });

        it("should call onSelectModel when model clicked", () => {
            const onSelectModel = vi.fn();
            render(<ModelSelectorModal {...defaultProps} onSelectModel={onSelectModel} />);

            fireEvent.click(screen.getByText("Opus 4.5 - Most capable model"));

            expect(onSelectModel).toHaveBeenCalledWith("opus");
        });

        it("should call onSelectModel when haiku option clicked", () => {
            const onSelectModel = vi.fn();
            render(<ModelSelectorModal {...defaultProps} onSelectModel={onSelectModel} />);

            // Component uses onClick on label, not onChange on radio
            fireEvent.click(screen.getByText("Haiku 4.5 - Fast model"));

            expect(onSelectModel).toHaveBeenCalledWith("haiku");
        });

        it("should close modal after selection", () => {
            const onClose = vi.fn();
            render(<ModelSelectorModal {...defaultProps} onClose={onClose} />);

            fireEvent.click(screen.getByText("Opus 4.5 - Most capable model"));

            expect(onClose).toHaveBeenCalled();
        });
    });

    describe("selected styling", () => {
        it("should apply active styling to selected model", () => {
            const { container } = render(
                <ModelSelectorModal {...defaultProps} selectedModel="opus" />,
            );

            const labels = container.querySelectorAll("label");
            // The opus label (second one) should have active styling
            expect(labels[1].className).toContain(
                "bg-[var(--vscode-list-activeSelectionBackground)]",
            );
        });
    });
});
