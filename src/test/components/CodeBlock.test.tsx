import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CodeBlock } from "../../webview/components/Common/CodeBlock";

describe("CodeBlock", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock clipboard API
        Object.assign(navigator, {
            clipboard: {
                writeText: vi.fn().mockResolvedValue(undefined),
            },
        });
    });

    describe("rendering", () => {
        it("should render code content", () => {
            render(<CodeBlock code="console.log('hello')" />);

            expect(screen.getByText("console.log('hello')")).toBeInTheDocument();
        });

        it("should display language label", () => {
            render(<CodeBlock code="const x = 1" language="typescript" />);

            expect(screen.getByText("typescript")).toBeInTheDocument();
        });

        it("should display filename instead of language when provided", () => {
            render(<CodeBlock code="const x = 1" language="typescript" filename="index.ts" />);

            expect(screen.getByText("index.ts")).toBeInTheDocument();
            expect(screen.queryByText("typescript")).not.toBeInTheDocument();
        });

        it("should display 'text' as default label", () => {
            render(<CodeBlock code="plain text" />);

            expect(screen.getByText("text")).toBeInTheDocument();
        });

        it("should show copy button by default", () => {
            render(<CodeBlock code="code" />);

            expect(screen.getByTitle("Copy code")).toBeInTheDocument();
        });

        it("should hide copy button when showCopyButton is false", () => {
            render(<CodeBlock code="code" showCopyButton={false} />);

            expect(screen.queryByTitle("Copy code")).not.toBeInTheDocument();
        });
    });

    describe("copy functionality", () => {
        it("should copy code to clipboard when copy button clicked", async () => {
            render(<CodeBlock code="const x = 1" />);

            fireEvent.click(screen.getByTitle("Copy code"));

            expect(navigator.clipboard.writeText).toHaveBeenCalledWith("const x = 1");
        });

        it("should show copied state after clicking", async () => {
            render(<CodeBlock code="code" />);

            fireEvent.click(screen.getByTitle("Copy code"));

            // Wait for the async clipboard operation to complete
            await waitFor(() => {
                expect(screen.getByText("Copied!")).toBeInTheDocument();
            });
        });

        it("should handle clipboard error gracefully", async () => {
            const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
            Object.assign(navigator, {
                clipboard: {
                    writeText: vi.fn().mockRejectedValue(new Error("Clipboard error")),
                },
            });

            render(<CodeBlock code="code" />);
            fireEvent.click(screen.getByTitle("Copy code"));

            // Wait for error to be logged
            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalled();
            });

            consoleSpy.mockRestore();
        });
    });

    describe("line numbers", () => {
        it("should not show line numbers by default", () => {
            render(<CodeBlock code="line1\nline2" />);

            // Without line numbers, code is rendered directly
            expect(screen.getByText(/line1/)).toBeInTheDocument();
        });

        it("should show line numbers when enabled", () => {
            render(<CodeBlock code="line1\nline2" showLineNumbers={true} />);

            // With line numbers, should render the lines
            expect(screen.getByText(/line1/)).toBeInTheDocument();
            expect(screen.getByText(/line2/)).toBeInTheDocument();
        });
    });

    describe("styling", () => {
        it("should apply custom className", () => {
            const { container } = render(<CodeBlock code="code" className="custom-class" />);

            expect(container.querySelector(".custom-class")).toBeInTheDocument();
        });

        it("should apply maxHeight as number", () => {
            const { container } = render(<CodeBlock code="code" maxHeight={200} />);

            const codeArea = container.querySelector("pre");
            expect(codeArea).toHaveStyle({ maxHeight: "200px" });
        });

        it("should apply maxHeight as string", () => {
            const { container } = render(<CodeBlock code="code" maxHeight="50vh" />);

            const codeArea = container.querySelector("pre");
            expect(codeArea).toHaveStyle({ maxHeight: "50vh" });
        });
    });
});
