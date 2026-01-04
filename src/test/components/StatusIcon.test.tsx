import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusIcon } from "../../webview/components/Chat/JourneyTimeline/StatusIcon";

describe("StatusIcon", () => {
    describe("rendering status icons", () => {
        it("should render executing status with PlayCircle icon", () => {
            const { container } = render(<StatusIcon status="executing" className="test-class" />);

            const svg = container.querySelector("svg");
            expect(svg).toBeInTheDocument();
            expect(svg?.classList.contains("test-class")).toBe(true);
            expect(svg?.classList.contains("text-blue-400")).toBe(true);
            expect(svg?.classList.contains("animate-pulse")).toBe(true);
        });

        it("should render completed status with CheckCircle2 icon", () => {
            const { container } = render(<StatusIcon status="completed" className="test-class" />);

            const svg = container.querySelector("svg");
            expect(svg).toBeInTheDocument();
            expect(svg?.classList.contains("text-green-400")).toBe(true);
        });

        it("should render failed status with XCircle icon", () => {
            const { container } = render(<StatusIcon status="failed" className="test-class" />);

            const svg = container.querySelector("svg");
            expect(svg).toBeInTheDocument();
            expect(svg?.classList.contains("text-red-400")).toBe(true);
        });

        it("should render pending status with Clock icon", () => {
            const { container } = render(<StatusIcon status="pending" className="test-class" />);

            const svg = container.querySelector("svg");
            expect(svg).toBeInTheDocument();
            expect(svg?.classList.contains("text-white/40")).toBe(true);
        });

        it("should render default status with AlertCircle icon", () => {
            const { container } = render(<StatusIcon status="unknown" className="test-class" />);

            const svg = container.querySelector("svg");
            expect(svg).toBeInTheDocument();
            expect(svg?.classList.contains("text-yellow-400")).toBe(true);
        });

        it("should apply custom className", () => {
            const { container } = render(
                <StatusIcon status="completed" className="w-6 h-6 custom" />,
            );

            const svg = container.querySelector("svg");
            expect(svg?.classList.contains("w-6")).toBe(true);
            expect(svg?.classList.contains("h-6")).toBe(true);
            expect(svg?.classList.contains("custom")).toBe(true);
        });
    });
});
