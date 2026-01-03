import React, { useState, useCallback, useEffect, useRef } from "react";
import { Modal } from "./Modal";

export interface FileItem {
    path: string;
    name: string;
    type: "file" | "directory";
    extension?: string;
}

const FILE_ICONS: Record<string, string> = {
    ts: "\uD83D\uDCDC",
    tsx: "\u269B\uFE0F",
    js: "\uD83D\uDFE8",
    jsx: "\u269B\uFE0F",
    json: "\uD83D\uDCC4",
    md: "\uD83D\uDCDD",
    css: "\uD83C\uDFA8",
    scss: "\uD83C\uDFA8",
    html: "\uD83C\uDF10",
    py: "\uD83D\uDC0D",
    rs: "\uD83E\uDD80",
    go: "\uD83D\uDC39",
    java: "\u2615",
    rb: "\uD83D\uDC8E",
    php: "\uD83D\uDC18",
    c: "\u2699\uFE0F",
    cpp: "\u2699\uFE0F",
    h: "\u2699\uFE0F",
    sh: "\uD83D\uDCBB",
    yaml: "\u2699\uFE0F",
    yml: "\u2699\uFE0F",
    toml: "\u2699\uFE0F",
    xml: "\uD83D\uDCCB",
    svg: "\uD83D\uDDBC\uFE0F",
    png: "\uD83D\uDDBC\uFE0F",
    jpg: "\uD83D\uDDBC\uFE0F",
    jpeg: "\uD83D\uDDBC\uFE0F",
    gif: "\uD83D\uDDBC\uFE0F",
    sql: "\uD83D\uDDC4\uFE0F",
    directory: "\uD83D\uDCC1",
    default: "\uD83D\uDCC4",
};

const getFileIcon = (file: FileItem): string => {
    if (file.type === "directory") return FILE_ICONS.directory;
    const ext = file.extension?.toLowerCase() || "";
    return FILE_ICONS[ext] || FILE_ICONS.default;
};

export interface FilePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    files: FileItem[];
    onSelectFile: (file: FileItem) => void;
    isLoading?: boolean;
    onSearch?: (query: string) => void;
}

export const FilePickerModal: React.FC<FilePickerModalProps> = ({
    isOpen,
    onClose,
    files,
    onSelectFile,
    isLoading = false,
    onSearch,
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const listRef = useRef<HTMLUListElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredFiles = files.filter(
        (file) =>
            file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            file.path.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const handleSearch = useCallback(
        (query: string) => {
            setSearchQuery(query);
            setSelectedIndex(0);
            onSearch?.(query);
        },
        [onSearch],
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    setSelectedIndex((prev) => (prev < filteredFiles.length - 1 ? prev + 1 : prev));
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
                    break;
                case "Enter":
                    e.preventDefault();
                    if (filteredFiles[selectedIndex]) {
                        onSelectFile(filteredFiles[selectedIndex]);
                        onClose();
                    }
                    break;
                case "Escape":
                    e.preventDefault();
                    onClose();
                    break;
            }
        },
        [filteredFiles, selectedIndex, onSelectFile, onClose],
    );

    const handleSelectFile = useCallback(
        (file: FileItem) => {
            onSelectFile(file);
            onClose();
        },
        [onSelectFile, onClose],
    );

    // Scroll selected item into view
    useEffect(() => {
        if (listRef.current && filteredFiles.length > 0) {
            const selectedItem = listRef.current.children[selectedIndex] as HTMLElement;
            selectedItem?.scrollIntoView({ block: "nearest" });
        }
    }, [selectedIndex, filteredFiles.length]);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            setSearchQuery("");
            setSelectedIndex(0);
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Select File" width="md">
            <div className="space-y-3" onKeyDown={handleKeyDown}>
                {/* Search Input */}
                <div className="relative">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--vscode-descriptionForeground)]"
                    >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search files..."
                        className="input pl-10"
                        autoFocus
                    />
                </div>

                {/* File List */}
                <div className="border border-[var(--vscode-editorWidget-border)] rounded-md overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-8">
                            <div className="spinner" />
                            <span className="ml-2 text-sm text-[var(--vscode-descriptionForeground)]">
                                Loading files...
                            </span>
                        </div>
                    ) : filteredFiles.length === 0 ? (
                        <div className="p-8 text-center text-sm text-[var(--vscode-descriptionForeground)]">
                            {searchQuery ? "No files match your search" : "No files available"}
                        </div>
                    ) : (
                        <ul
                            ref={listRef}
                            className="max-h-72 overflow-y-auto divide-y divide-[var(--vscode-editorWidget-border)]"
                            role="listbox"
                            aria-activedescendant={`file-${selectedIndex}`}
                        >
                            {filteredFiles.map((file, index) => (
                                <li
                                    key={file.path}
                                    id={`file-${index}`}
                                    role="option"
                                    aria-selected={index === selectedIndex}
                                    onClick={() => handleSelectFile(file)}
                                    className={`
                    flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors
                    ${
                        index === selectedIndex
                            ? "bg-[var(--vscode-list-activeSelectionBackground)] text-[var(--vscode-list-activeSelectionForeground)]"
                            : "hover:bg-[var(--vscode-list-hoverBackground)]"
                    }
                  `}
                                >
                                    <span className="text-base flex-shrink-0">
                                        {getFileIcon(file)}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-medium truncate">
                                            {file.name}
                                        </div>
                                        <div className="text-xs text-[var(--vscode-descriptionForeground)] truncate">
                                            {file.path}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Keyboard hints */}
                <div className="flex items-center gap-4 text-xs text-[var(--vscode-descriptionForeground)]">
                    <span>
                        <kbd className="px-1 py-0.5 rounded bg-[var(--vscode-textCodeBlock-background)]">
                            \u2191
                        </kbd>{" "}
                        <kbd className="px-1 py-0.5 rounded bg-[var(--vscode-textCodeBlock-background)]">
                            \u2193
                        </kbd>{" "}
                        Navigate
                    </span>
                    <span>
                        <kbd className="px-1 py-0.5 rounded bg-[var(--vscode-textCodeBlock-background)]">
                            Enter
                        </kbd>{" "}
                        Select
                    </span>
                    <span>
                        <kbd className="px-1 py-0.5 rounded bg-[var(--vscode-textCodeBlock-background)]">
                            Esc
                        </kbd>{" "}
                        Close
                    </span>
                </div>
            </div>
        </Modal>
    );
};

export default FilePickerModal;
