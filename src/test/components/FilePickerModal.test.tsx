import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FilePickerModal } from "../../webview/components/Modals/FilePickerModal";
import type { FileItem } from "../../webview/components/Modals/FilePickerModal";

describe("FilePickerModal", () => {
    const mockFiles: FileItem[] = [
        { path: "/src/index.ts", name: "index.ts", type: "file", extension: "ts" },
        { path: "/src/app.tsx", name: "app.tsx", type: "file", extension: "tsx" },
        { path: "/src/components", name: "components", type: "directory" },
        { path: "/package.json", name: "package.json", type: "file", extension: "json" },
    ];

    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        files: mockFiles,
        onSelectFile: vi.fn(),
        isLoading: false,
        onSearch: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("rendering", () => {
        it("should render modal when open", () => {
            render(<FilePickerModal {...defaultProps} />);

            expect(screen.getByRole("dialog")).toBeInTheDocument();
            expect(screen.getByText("Select File")).toBeInTheDocument();
        });

        it("should not render when closed", () => {
            render(<FilePickerModal {...defaultProps} isOpen={false} />);

            expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        });

        it("should render file list", () => {
            render(<FilePickerModal {...defaultProps} />);

            expect(screen.getByText("index.ts")).toBeInTheDocument();
            expect(screen.getByText("app.tsx")).toBeInTheDocument();
            expect(screen.getByText("components")).toBeInTheDocument();
            expect(screen.getByText("package.json")).toBeInTheDocument();
        });

        it("should render search input", () => {
            render(<FilePickerModal {...defaultProps} />);

            expect(screen.getByPlaceholderText("Search files...")).toBeInTheDocument();
        });

        it("should show loading state", () => {
            render(<FilePickerModal {...defaultProps} isLoading={true} />);

            expect(screen.getByText("Loading files...")).toBeInTheDocument();
        });

        it("should render keyboard hints", () => {
            render(<FilePickerModal {...defaultProps} />);

            expect(screen.getByText("Navigate")).toBeInTheDocument();
            expect(screen.getByText("Select")).toBeInTheDocument();
            expect(screen.getByText("Close")).toBeInTheDocument();
        });
    });

    describe("search functionality", () => {
        it("should filter files by name", () => {
            render(<FilePickerModal {...defaultProps} />);

            const searchInput = screen.getByPlaceholderText("Search files...");
            fireEvent.change(searchInput, { target: { value: "index" } });

            expect(screen.getByText("index.ts")).toBeInTheDocument();
            expect(screen.queryByText("app.tsx")).not.toBeInTheDocument();
        });

        it("should filter files by path", () => {
            render(<FilePickerModal {...defaultProps} />);

            const searchInput = screen.getByPlaceholderText("Search files...");
            fireEvent.change(searchInput, { target: { value: "/src" } });

            expect(screen.getByText("index.ts")).toBeInTheDocument();
            expect(screen.getByText("app.tsx")).toBeInTheDocument();
            expect(screen.queryByText("package.json")).not.toBeInTheDocument();
        });

        it("should be case insensitive", () => {
            render(<FilePickerModal {...defaultProps} />);

            const searchInput = screen.getByPlaceholderText("Search files...");
            fireEvent.change(searchInput, { target: { value: "INDEX" } });

            expect(screen.getByText("index.ts")).toBeInTheDocument();
        });

        it("should call onSearch when provided", () => {
            const onSearch = vi.fn();
            render(<FilePickerModal {...defaultProps} onSearch={onSearch} />);

            const searchInput = screen.getByPlaceholderText("Search files...");
            fireEvent.change(searchInput, { target: { value: "test" } });

            expect(onSearch).toHaveBeenCalledWith("test");
        });
    });

    describe("file selection", () => {
        it("should call onSelectFile and onClose when file is clicked", () => {
            const onSelectFile = vi.fn();
            const onClose = vi.fn();
            render(
                <FilePickerModal {...defaultProps} onSelectFile={onSelectFile} onClose={onClose} />,
            );

            fireEvent.click(screen.getByText("index.ts"));

            expect(onSelectFile).toHaveBeenCalledWith(mockFiles[0]);
            expect(onClose).toHaveBeenCalled();
        });

        it("should call onSelectFile for directory", () => {
            const onSelectFile = vi.fn();
            render(<FilePickerModal {...defaultProps} onSelectFile={onSelectFile} />);

            fireEvent.click(screen.getByText("components"));

            expect(onSelectFile).toHaveBeenCalledWith(mockFiles[2]);
        });
    });

    describe("keyboard navigation", () => {
        it("should navigate down with ArrowDown", () => {
            render(<FilePickerModal {...defaultProps} />);

            const searchInput = screen.getByPlaceholderText("Search files...");

            // First item is selected by default
            expect(screen.getByRole("option", { selected: true })).toHaveTextContent("index.ts");

            // Navigate down
            fireEvent.keyDown(searchInput, { key: "ArrowDown" });

            // Second item should now be selected
            const options = screen.getAllByRole("option");
            expect(options[1]).toHaveAttribute("aria-selected", "true");
        });

        it("should navigate up with ArrowUp", () => {
            render(<FilePickerModal {...defaultProps} />);

            const searchInput = screen.getByPlaceholderText("Search files...");

            // Navigate down first
            fireEvent.keyDown(searchInput, { key: "ArrowDown" });

            // Then navigate up
            fireEvent.keyDown(searchInput, { key: "ArrowUp" });

            // First item should be selected again
            const options = screen.getAllByRole("option");
            expect(options[0]).toHaveAttribute("aria-selected", "true");
        });

        it("should select file with Enter key", () => {
            const onSelectFile = vi.fn();
            const onClose = vi.fn();
            render(
                <FilePickerModal {...defaultProps} onSelectFile={onSelectFile} onClose={onClose} />,
            );

            const searchInput = screen.getByPlaceholderText("Search files...");
            fireEvent.keyDown(searchInput, { key: "Enter" });

            expect(onSelectFile).toHaveBeenCalledWith(mockFiles[0]);
            expect(onClose).toHaveBeenCalled();
        });

        it("should close with Escape key", () => {
            const onClose = vi.fn();
            render(<FilePickerModal {...defaultProps} onClose={onClose} />);

            const searchInput = screen.getByPlaceholderText("Search files...");
            fireEvent.keyDown(searchInput, { key: "Escape" });

            expect(onClose).toHaveBeenCalled();
        });
    });

    describe("empty state", () => {
        it("should show message when no files match search", () => {
            render(<FilePickerModal {...defaultProps} />);

            const searchInput = screen.getByPlaceholderText("Search files...");
            fireEvent.change(searchInput, { target: { value: "nonexistent" } });

            expect(screen.getByText("No files match your search")).toBeInTheDocument();
        });

        it("should show message when files array is empty", () => {
            render(<FilePickerModal {...defaultProps} files={[]} />);

            expect(screen.getByText("No files available")).toBeInTheDocument();
        });
    });

    describe("file paths display", () => {
        it("should show file paths", () => {
            render(<FilePickerModal {...defaultProps} />);

            expect(screen.getByText("/src/index.ts")).toBeInTheDocument();
            expect(screen.getByText("/src/app.tsx")).toBeInTheDocument();
        });
    });

    describe("modal behavior", () => {
        it("should call onClose when close button clicked", () => {
            const onClose = vi.fn();
            render(<FilePickerModal {...defaultProps} onClose={onClose} />);

            const closeButton = screen.getByLabelText("Close modal");
            fireEvent.click(closeButton);

            expect(onClose).toHaveBeenCalled();
        });

        it("should focus search input on open", () => {
            render(<FilePickerModal {...defaultProps} />);

            const searchInput = screen.getByPlaceholderText("Search files...");
            expect(document.activeElement).toBe(searchInput);
        });
    });

    describe("listbox accessibility", () => {
        it("should have listbox role", () => {
            render(<FilePickerModal {...defaultProps} />);

            expect(screen.getByRole("listbox")).toBeInTheDocument();
        });

        it("should have option roles for files", () => {
            render(<FilePickerModal {...defaultProps} />);

            const options = screen.getAllByRole("option");
            expect(options).toHaveLength(4);
        });
    });
});
