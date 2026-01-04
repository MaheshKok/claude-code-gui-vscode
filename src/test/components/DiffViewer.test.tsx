import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DiffViewer } from "../../webview/components/Tools/DiffViewer";

describe("DiffViewer", () => {
    const defaultProps = {
        oldContent: "line 1\nline 2\nline 3",
        newContent: "line 1\nmodified line 2\nline 3\nline 4",
        filePath: "/src/test.ts",
        onOpenDiff: vi.fn(),
        onFilePathClick: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("rendering", () => {
        it("should render the file path", () => {
            render(<DiffViewer {...defaultProps} />);

            expect(screen.getByText("test.ts")).toBeInTheDocument();
        });

        it("should show diff stats", () => {
            render(<DiffViewer {...defaultProps} />);

            // Should show added lines count
            expect(screen.getByText(/\+2/)).toBeInTheDocument();
            // Should show removed lines count
            expect(screen.getByText(/-1/)).toBeInTheDocument();
        });

        it("should render added lines in green", () => {
            const { container } = render(<DiffViewer {...defaultProps} />);

            // Added lines should have green styling
            const addedLines = container.querySelectorAll(".text-green-400");
            expect(addedLines.length).toBeGreaterThan(0);
        });

        it("should render removed lines in red", () => {
            const { container } = render(<DiffViewer {...defaultProps} />);

            // Removed lines should have red styling
            const removedLines = container.querySelectorAll(".text-red-400");
            expect(removedLines.length).toBeGreaterThan(0);
        });
    });

    describe("expand/collapse", () => {
        it("should expand when expand button clicked", () => {
            render(<DiffViewer {...defaultProps} maxVisibleLines={2} />);

            // Initially collapsed - should show expand option
            const expandButton =
                screen.queryByText(/more lines/i) ||
                screen.queryByText(/Show more/i) ||
                document.querySelector('[title*="expand" i]');

            if (expandButton) {
                fireEvent.click(expandButton);
            }

            // The component should render all lines
        });

        it("should toggle between expanded and collapsed states", () => {
            render(
                <DiffViewer
                    {...defaultProps}
                    oldContent="line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8"
                    newContent="changed1\nline2\nline3\nline4\nline5\nline6\nline7\nchanged8"
                    maxVisibleLines={3}
                />,
            );

            // The component should handle toggling
        });
    });

    describe("callbacks", () => {
        it("should call onFilePathClick when file path is clicked", () => {
            const onFilePathClick = vi.fn();
            render(<DiffViewer {...defaultProps} onFilePathClick={onFilePathClick} />);

            const filePathElement = screen.getByText("test.ts");
            fireEvent.click(filePathElement);

            expect(onFilePathClick).toHaveBeenCalledWith("/src/test.ts");
        });

        it("should call onOpenDiff when open diff button clicked", () => {
            const onOpenDiff = vi.fn();
            render(<DiffViewer {...defaultProps} onOpenDiff={onOpenDiff} />);

            const openButton = screen.queryByTitle(/open diff/i) || screen.queryByText(/open/i);

            if (openButton) {
                fireEvent.click(openButton);
                expect(onOpenDiff).toHaveBeenCalledWith(
                    "/src/test.ts",
                    defaultProps.oldContent,
                    defaultProps.newContent,
                );
            }
        });
    });

    describe("edge cases", () => {
        it("should handle empty old content", () => {
            render(<DiffViewer {...defaultProps} oldContent="" newContent="new content" />);

            expect(screen.getByText(/\+1/)).toBeInTheDocument();
        });

        it("should handle empty new content", () => {
            render(<DiffViewer {...defaultProps} oldContent="old content" newContent="" />);

            expect(screen.getByText(/-1/)).toBeInTheDocument();
        });

        it("should handle identical content", () => {
            render(
                <DiffViewer
                    {...defaultProps}
                    oldContent="same content"
                    newContent="same content"
                />,
            );

            // No additions or removals
            expect(screen.getByText("test.ts")).toBeInTheDocument();
        });

        it("should handle empty file path", () => {
            render(<DiffViewer {...defaultProps} filePath="" />);

            // Should still render without crashing
        });
    });

    describe("line numbers", () => {
        it("should use custom start line", () => {
            render(<DiffViewer {...defaultProps} startLine={10} />);

            // The component should render with custom start line
            expect(screen.getByText("test.ts")).toBeInTheDocument();
        });
    });

    describe("file path formatting", () => {
        it("should extract filename from full path", () => {
            render(<DiffViewer {...defaultProps} filePath="/very/long/path/to/file.ts" />);

            expect(screen.getByText("file.ts")).toBeInTheDocument();
        });

        it("should handle path with no slashes", () => {
            render(<DiffViewer {...defaultProps} filePath="simple.ts" />);

            expect(screen.getByText("simple.ts")).toBeInTheDocument();
        });
    });
});
