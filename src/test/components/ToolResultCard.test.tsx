import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { ToolResultCard } from "../../webview/components/Tools/ToolResultCard";

// Mock useVSCode hook
const mockPostMessage = vi.fn();
vi.mock("../../webview/hooks/useVSCode", () => ({
    useVSCode: () => ({
        postMessage: mockPostMessage,
    }),
}));

describe("ToolResultCard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock clipboard
        Object.assign(navigator, {
            clipboard: {
                writeText: vi.fn().mockResolvedValue(undefined),
            },
        });
    });

    describe("rendering", () => {
        it("should render result header", () => {
            render(<ToolResultCard content="Test content" />);

            expect(screen.getByText("Result")).toBeInTheDocument();
        });

        it("should show tool name in header", () => {
            render(<ToolResultCard content="Test content" toolName="Read" />);

            expect(screen.getByText("Result - Read")).toBeInTheDocument();
        });

        it("should show error header when isError is true", () => {
            render(<ToolResultCard content="Error message" isError={true} />);

            expect(screen.getByText("Error")).toBeInTheDocument();
        });

        it("should be collapsed by default", () => {
            render(<ToolResultCard content="Test content" defaultCollapsed={true} />);

            // Content should not be visible (collapsed)
            expect(screen.queryByText("Test content")).not.toBeInTheDocument();
        });

        it("should show content when defaultCollapsed is false", () => {
            render(<ToolResultCard content="Test content" defaultCollapsed={false} />);

            expect(screen.getByText("Test content")).toBeInTheDocument();
        });
    });

    describe("toggle behavior", () => {
        it("should expand when header clicked", () => {
            render(<ToolResultCard content="Test content" defaultCollapsed={true} />);

            fireEvent.click(screen.getByText("Result"));

            expect(screen.getByText("Test content")).toBeInTheDocument();
        });

        it("should collapse when header clicked again", () => {
            render(<ToolResultCard content="Test content" defaultCollapsed={false} />);

            fireEvent.click(screen.getByText("Result"));

            expect(screen.queryByText("Test content")).not.toBeInTheDocument();
        });
    });

    describe("copy functionality", () => {
        it("should render copy button", () => {
            render(<ToolResultCard content="Test content" defaultCollapsed={false} />);

            expect(screen.getByTitle("Copy to clipboard")).toBeInTheDocument();
        });

        it("should have Copy text on button", () => {
            render(<ToolResultCard content="Test content" defaultCollapsed={false} />);

            expect(screen.getByText("Copy")).toBeInTheDocument();
        });
    });

    describe("content truncation", () => {
        const longContent = Array(20).fill("Line").join("\n");

        it("should show expand button for long content", () => {
            render(<ToolResultCard content={longContent} defaultCollapsed={false} maxLines={10} />);

            expect(screen.getByText(/Show \d+ more lines/)).toBeInTheDocument();
        });

        it("should toggle content when expand button clicked", () => {
            render(<ToolResultCard content={longContent} defaultCollapsed={false} maxLines={10} />);

            fireEvent.click(screen.getByText(/Show \d+ more lines/));

            expect(screen.getByText("Show less")).toBeInTheDocument();
        });
    });

    describe("JSON content extraction", () => {
        it("should extract text from JSON content", () => {
            const jsonContent = JSON.stringify({
                text: "Extracted text content",
            });

            render(<ToolResultCard content={jsonContent} defaultCollapsed={false} />);

            expect(screen.getByText("Extracted text content")).toBeInTheDocument();
        });

        it("should extract nested text fields", () => {
            const jsonContent = JSON.stringify({
                nested: {
                    text: "Nested text",
                },
            });

            render(<ToolResultCard content={jsonContent} defaultCollapsed={false} />);

            expect(screen.getByText("Nested text")).toBeInTheDocument();
        });

        it("should handle invalid JSON gracefully", () => {
            render(<ToolResultCard content="not valid json" defaultCollapsed={false} />);

            expect(screen.getByText("not valid json")).toBeInTheDocument();
        });
    });

    describe("markdown preview", () => {
        it("should show preview button for markdown content", () => {
            const markdownContent = "# Heading\n\n- List item 1\n- List item 2";
            render(<ToolResultCard content={markdownContent} defaultCollapsed={false} />);

            expect(screen.getByTitle("Open markdown preview")).toBeInTheDocument();
        });

        it("should call postMessage when preview clicked", () => {
            const markdownContent = "# Heading\n\n- List item";
            render(
                <ToolResultCard
                    content={markdownContent}
                    defaultCollapsed={false}
                    toolName="Read"
                />,
            );

            fireEvent.click(screen.getByTitle("Open markdown preview"));

            expect(mockPostMessage).toHaveBeenCalledWith({
                type: "openMarkdownPreview",
                content: markdownContent,
                title: "Read Result",
            });
        });
    });

    describe("error styling", () => {
        it("should have error border when isError is true", () => {
            const { container } = render(
                <ToolResultCard content="Error" isError={true} defaultCollapsed={false} />,
            );

            const card = container.firstChild;
            expect(card).toHaveClass("border-red-500/20");
        });

        it("should show Error label for error results", () => {
            render(
                <ToolResultCard content="Error message" isError={true} defaultCollapsed={false} />,
            );

            // Multiple "Error" texts exist - header and content, so check for all
            const errorTexts = screen.getAllByText("Error");
            expect(errorTexts.length).toBeGreaterThan(0);
        });
    });

    describe("code block rendering", () => {
        it("should render code blocks in content", () => {
            const contentWithCode = "Before\n```javascript\nconst x = 1;\n```\nAfter";
            const { container } = render(
                <ToolResultCard content={contentWithCode} defaultCollapsed={false} />,
            );

            const pre = container.querySelector("pre");
            expect(pre).toBeInTheDocument();
        });

        it("should render inline code with proper styling", () => {
            const { container } = render(
                <ToolResultCard content="Use the `test` function" defaultCollapsed={false} />,
            );

            const code = container.querySelector("code");
            expect(code).toBeInTheDocument();
            expect(code?.textContent).toBe("test");
        });
    });

    describe("origin info display", () => {
        it("should show MCP origin label for MCP tools", () => {
            render(
                <ToolResultCard
                    content="Test"
                    toolName="mcp__server__tool"
                    defaultCollapsed={false}
                />,
            );

            expect(screen.getByText("MCP")).toBeInTheDocument();
        });
    });

    describe("header icons", () => {
        it("should show success icon for non-error results", () => {
            const { container } = render(
                <ToolResultCard content="Test" isError={false} defaultCollapsed={false} />,
            );

            // Check for green color on the icon container
            const iconContainer = container.querySelector(".text-green-400");
            expect(iconContainer).toBeInTheDocument();
        });

        it("should show error icon for error results", () => {
            const { container } = render(
                <ToolResultCard content="Error" isError={true} defaultCollapsed={false} />,
            );

            // Check for red color on the icon container
            const iconContainer = container.querySelector(".text-red-400");
            expect(iconContainer).toBeInTheDocument();
        });
    });
});
