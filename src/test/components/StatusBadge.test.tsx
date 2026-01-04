import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "../../webview/components/Common/StatusBadge";
import { ToolExecutionStatus } from "../../shared/constants";

describe("StatusBadge", () => {
    describe("rendering", () => {
        it("should render with status label", () => {
            render(<StatusBadge status="success" />);
            expect(screen.getByText("success")).toBeInTheDocument();
        });

        it("should render with custom label", () => {
            render(<StatusBadge status="success" label="Done" />);
            expect(screen.getByText("Done")).toBeInTheDocument();
        });
    });

    describe("status variants", () => {
        it("should render success status", () => {
            const { container } = render(<StatusBadge status="success" />);
            const badge = container.firstChild;
            expect(badge).toHaveClass("bg-green-500/10", "text-green-400");
        });

        it("should render completed status", () => {
            const { container } = render(<StatusBadge status="completed" />);
            const badge = container.firstChild;
            expect(badge).toHaveClass("bg-green-500/10", "text-green-400");
        });

        it("should render approved status", () => {
            const { container } = render(<StatusBadge status="approved" />);
            const badge = container.firstChild;
            expect(badge).toHaveClass("bg-green-500/10", "text-green-400");
        });

        it("should render error status", () => {
            const { container } = render(<StatusBadge status="error" />);
            const badge = container.firstChild;
            expect(badge).toHaveClass("bg-red-500/10", "text-red-400");
        });

        it("should render failed status", () => {
            const { container } = render(<StatusBadge status="failed" />);
            const badge = container.firstChild;
            expect(badge).toHaveClass("bg-red-500/10", "text-red-400");
        });

        it("should render warning status", () => {
            const { container } = render(<StatusBadge status="warning" />);
            const badge = container.firstChild;
            expect(badge).toHaveClass("bg-yellow-500/10", "text-yellow-400");
        });

        it("should render denied status", () => {
            const { container } = render(<StatusBadge status="denied" />);
            const badge = container.firstChild;
            expect(badge).toHaveClass("bg-yellow-500/10", "text-yellow-400");
        });

        it("should render cancelled status", () => {
            const { container } = render(<StatusBadge status="cancelled" />);
            const badge = container.firstChild;
            expect(badge).toHaveClass("bg-yellow-500/10", "text-yellow-400");
        });

        it("should render info status", () => {
            const { container } = render(<StatusBadge status="info" />);
            const badge = container.firstChild;
            expect(badge).toHaveClass("bg-blue-500/10", "text-blue-400");
        });

        it("should render executing status", () => {
            const { container } = render(<StatusBadge status="executing" />);
            const badge = container.firstChild;
            expect(badge).toHaveClass("bg-blue-500/10", "text-blue-400");
        });

        it("should render pending status", () => {
            const { container } = render(<StatusBadge status="pending" />);
            const badge = container.firstChild;
            expect(badge).toHaveClass("bg-orange-500/10", "text-orange-400");
        });

        it("should render unknown status with default style", () => {
            const { container } = render(<StatusBadge status="unknown-status" />);
            const badge = container.firstChild;
            expect(badge).toHaveClass("bg-white/10", "text-white/60");
        });
    });

    describe("size variants", () => {
        it("should render small size by default", () => {
            const { container } = render(<StatusBadge status="success" />);
            const badge = container.firstChild;
            expect(badge).toHaveClass("px-1.5", "py-0.5", "text-[10px]");
        });

        it("should render small size when specified", () => {
            const { container } = render(<StatusBadge status="success" size="sm" />);
            const badge = container.firstChild;
            expect(badge).toHaveClass("px-1.5", "py-0.5", "text-[10px]");
        });

        it("should render medium size when specified", () => {
            const { container } = render(<StatusBadge status="success" size="md" />);
            const badge = container.firstChild;
            expect(badge).toHaveClass("px-2", "py-1", "text-xs");
        });
    });

    describe("ToolExecutionStatus enum", () => {
        it("should handle ToolExecutionStatus.Completed", () => {
            const { container } = render(<StatusBadge status={ToolExecutionStatus.Completed} />);
            const badge = container.firstChild;
            expect(badge).toHaveClass("bg-green-500/10", "text-green-400");
        });

        it("should handle ToolExecutionStatus.Failed", () => {
            const { container } = render(<StatusBadge status={ToolExecutionStatus.Failed} />);
            const badge = container.firstChild;
            expect(badge).toHaveClass("bg-red-500/10", "text-red-400");
        });

        it("should handle ToolExecutionStatus.Executing", () => {
            const { container } = render(<StatusBadge status={ToolExecutionStatus.Executing} />);
            const badge = container.firstChild;
            expect(badge).toHaveClass("bg-blue-500/10", "text-blue-400");
        });

        it("should handle ToolExecutionStatus.Pending", () => {
            const { container } = render(<StatusBadge status={ToolExecutionStatus.Pending} />);
            const badge = container.firstChild;
            expect(badge).toHaveClass("bg-orange-500/10", "text-orange-400");
        });
    });

    describe("className prop", () => {
        it("should apply additional class names", () => {
            const { container } = render(<StatusBadge status="success" className="custom-class" />);
            const badge = container.firstChild;
            expect(badge).toHaveClass("custom-class");
        });

        it("should preserve default classes when adding custom ones", () => {
            const { container } = render(<StatusBadge status="success" className="custom-class" />);
            const badge = container.firstChild;
            expect(badge).toHaveClass("inline-flex", "items-center", "rounded", "font-bold");
        });
    });

    describe("status normalization", () => {
        it("should handle uppercase status", () => {
            const { container } = render(<StatusBadge status="SUCCESS" />);
            const badge = container.firstChild;
            expect(badge).toHaveClass("bg-green-500/10");
        });

        it("should handle mixed case status", () => {
            const { container } = render(<StatusBadge status="CoMpLeTeD" />);
            const badge = container.firstChild;
            expect(badge).toHaveClass("bg-green-500/10");
        });

        it("should handle status with dashes", () => {
            const { container } = render(<StatusBadge status="in-progress" />);
            // This would fall back to default since "inprogress" isn't a known variant
            const badge = container.firstChild;
            expect(badge).toBeInTheDocument();
        });

        it("should handle status with underscores", () => {
            const { container } = render(<StatusBadge status="in_progress" />);
            // This would fall back to default since "inprogress" isn't a known variant
            const badge = container.firstChild;
            expect(badge).toBeInTheDocument();
        });
    });

    describe("base styling", () => {
        it("should have uppercase tracking", () => {
            const { container } = render(<StatusBadge status="success" />);
            const badge = container.firstChild;
            expect(badge).toHaveClass("uppercase", "tracking-wide");
        });
    });
});
