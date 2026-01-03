/**
 * File Picker Hook
 *
 * Provides file selection functionality with search, filter,
 * and keyboard navigation for the chat interface.
 *
 * @module hooks/useFilePicker
 */

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useVSCode } from "./useVSCode";
import { useMessages } from "./useMessages";

// ============================================================================
// Types
// ============================================================================

/**
 * File item in the picker
 */
export interface FilePickerItem {
    /** Unique identifier */
    id: string;
    /** File name */
    name: string;
    /** Full file path */
    path: string;
    /** File type */
    type: "file" | "directory" | "symlink";
    /** File extension (without dot) */
    extension?: string;
    /** Icon identifier */
    icon?: string;
    /** Whether the item is selected */
    isSelected?: boolean;
    /** Last modified timestamp */
    modifiedAt?: number;
    /** File size in bytes */
    size?: number;
}

/**
 * File picker category/group
 */
export interface FilePickerCategory {
    /** Category identifier */
    id: string;
    /** Category display name */
    label: string;
    /** Files in this category */
    items: FilePickerItem[];
}

/**
 * Options for useFilePicker hook
 */
export interface UseFilePickerOptions {
    /** Whether the picker is enabled */
    enabled?: boolean;
    /** Maximum number of files that can be selected */
    maxSelection?: number;
    /** File extensions to include (empty = all) */
    allowedExtensions?: string[];
    /** File extensions to exclude */
    excludedExtensions?: string[];
    /** Patterns to exclude (glob-like) */
    excludePatterns?: string[];
    /** Whether to include directories */
    includeDirectories?: boolean;
    /** Whether to show hidden files */
    showHidden?: boolean;
    /** Debounce delay for search (ms) */
    searchDebounce?: number;
    /** Callback when files are selected */
    onSelect?: (files: FilePickerItem[]) => void;
    /** Callback when picker is dismissed */
    onDismiss?: () => void;
    /** Callback when search query changes */
    onSearch?: (query: string) => void;
}

/**
 * Return type for useFilePicker hook
 */
export interface UseFilePickerReturn {
    /** Whether the picker is open */
    isOpen: boolean;
    /** Open the picker */
    open: () => void;
    /** Close the picker */
    close: () => void;
    /** Toggle the picker */
    toggle: () => void;
    /** Currently available files */
    files: FilePickerItem[];
    /** Files grouped by category */
    categories: FilePickerCategory[];
    /** Currently selected files */
    selectedFiles: FilePickerItem[];
    /** Currently highlighted index (keyboard navigation) */
    highlightedIndex: number;
    /** Search query */
    searchQuery: string;
    /** Set search query */
    setSearchQuery: (query: string) => void;
    /** Filtered files based on search */
    filteredFiles: FilePickerItem[];
    /** Whether files are loading */
    isLoading: boolean;
    /** Select a file */
    selectFile: (file: FilePickerItem) => void;
    /** Deselect a file */
    deselectFile: (file: FilePickerItem) => void;
    /** Toggle file selection */
    toggleFileSelection: (file: FilePickerItem) => void;
    /** Clear all selections */
    clearSelection: () => void;
    /** Move highlight up */
    highlightPrevious: () => void;
    /** Move highlight down */
    highlightNext: () => void;
    /** Select highlighted item */
    selectHighlighted: () => void;
    /** Confirm selection and close */
    confirmSelection: () => void;
    /** Request files from extension */
    requestFiles: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for file picker functionality
 *
 * @example
 * ```tsx
 * function FilePickerInput() {
 *   const {
 *     isOpen,
 *     open,
 *     close,
 *     filteredFiles,
 *     searchQuery,
 *     setSearchQuery,
 *     highlightedIndex,
 *     selectHighlighted,
 *     highlightPrevious,
 *     highlightNext,
 *     selectedFiles,
 *   } = useFilePicker({
 *     onSelect: (files) => console.log('Selected:', files),
 *     maxSelection: 5,
 *   });
 *
 *   return (
 *     <div>
 *       <button onClick={toggle}>@ Files</button>
 *       {isOpen && (
 *         <div className="file-picker">
 *           <input
 *             value={searchQuery}
 *             onChange={(e) => setSearchQuery(e.target.value)}
 *             onKeyDown={(e) => {
 *               if (e.key === 'ArrowUp') highlightPrevious();
 *               if (e.key === 'ArrowDown') highlightNext();
 *               if (e.key === 'Enter') selectHighlighted();
 *               if (e.key === 'Escape') close();
 *             }}
 *           />
 *           <ul>
 *             {filteredFiles.map((file, i) => (
 *               <li
 *                 key={file.id}
 *                 className={i === highlightedIndex ? 'highlighted' : ''}
 *               >
 *                 {file.name}
 *               </li>
 *             ))}
 *           </ul>
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFilePicker(options: UseFilePickerOptions = {}): UseFilePickerReturn {
    const {
        enabled = true,
        maxSelection = Infinity,
        allowedExtensions = [],
        excludedExtensions = [],
        excludePatterns = ["node_modules", ".git", "dist", "build"],
        includeDirectories = false,
        showHidden = false,
        searchDebounce = 150,
        onSelect,
        onDismiss,
        onSearch,
    } = options;

    const { postMessage } = useVSCode();

    const [isOpen, setIsOpen] = useState(false);
    const [files, setFiles] = useState<FilePickerItem[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<FilePickerItem[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [searchQuery, setSearchQueryState] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /**
     * Handle incoming files from extension
     */
    useMessages({
        enabled: enabled && isOpen,
        handlers: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            restoreState: (message: any) => {
                // Handle file list response from extension
                if (message.state?.files) {
                    const fileItems: FilePickerItem[] = message.state.files.map(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (f: any, index: number) => ({
                            id: f.path || `file-${index}`,
                            name: f.name,
                            path: f.path,
                            type: f.type || "file",
                            extension: f.name.includes(".") ? f.name.split(".").pop() : undefined,
                            modifiedAt: f.modifiedAt,
                            size: f.size,
                        }),
                    );
                    setFiles(fileItems);
                    setIsLoading(false);
                }
            },
        },
    });

    /**
     * Filter files based on options
     */
    const filterFile = useCallback(
        (file: FilePickerItem): boolean => {
            // Filter by type
            if (!includeDirectories && file.type === "directory") {
                return false;
            }

            // Filter hidden files
            if (!showHidden && file.name.startsWith(".")) {
                return false;
            }

            // Filter by excluded patterns
            for (const pattern of excludePatterns) {
                if (file.path.includes(pattern)) {
                    return false;
                }
            }

            // Filter by extension
            if (allowedExtensions.length > 0 && file.extension) {
                if (!allowedExtensions.includes(file.extension)) {
                    return false;
                }
            }

            if (excludedExtensions.length > 0 && file.extension) {
                if (excludedExtensions.includes(file.extension)) {
                    return false;
                }
            }

            return true;
        },
        [allowedExtensions, excludedExtensions, excludePatterns, includeDirectories, showHidden],
    );

    /**
     * Filter files based on search query
     */
    const filteredFiles = useMemo((): FilePickerItem[] => {
        const query = searchQuery.toLowerCase().trim();

        return files
            .filter(filterFile)
            .filter((file) => {
                if (!query) {
                    return true;
                }

                // Match by name
                if (file.name.toLowerCase().includes(query)) {
                    return true;
                }

                // Match by path
                if (file.path.toLowerCase().includes(query)) {
                    return true;
                }

                return false;
            })
            .sort((a, b) => {
                // Prioritize exact matches
                if (query) {
                    const aExact = a.name.toLowerCase().startsWith(query);
                    const bExact = b.name.toLowerCase().startsWith(query);
                    if (aExact && !bExact) return -1;
                    if (!aExact && bExact) return 1;
                }

                // Then sort alphabetically
                return a.name.localeCompare(b.name);
            });
    }, [files, searchQuery, filterFile]);

    /**
     * Group files by category
     */
    const categories = useMemo((): FilePickerCategory[] => {
        const categoryMap = new Map<string, FilePickerItem[]>();

        for (const file of filteredFiles) {
            // Group by directory
            const dir = file.path.substring(0, file.path.lastIndexOf("/")) || "Root";
            const existing = categoryMap.get(dir) || [];
            existing.push(file);
            categoryMap.set(dir, existing);
        }

        return Array.from(categoryMap.entries()).map(([id, items]) => ({
            id,
            label: id,
            items,
        }));
    }, [filteredFiles]);

    /**
     * Request files from extension
     */
    const requestFiles = useCallback(() => {
        setIsLoading(true);
        postMessage({ type: "requestState" });
    }, [postMessage]);

    /**
     * Open the picker
     */
    const open = useCallback(() => {
        if (!enabled) return;
        setIsOpen(true);
        setHighlightedIndex(0);
        setSearchQueryState("");
        requestFiles();
    }, [enabled, requestFiles]);

    /**
     * Close the picker
     */
    const close = useCallback(() => {
        setIsOpen(false);
        setSearchQueryState("");
        setHighlightedIndex(0);
        onDismiss?.();
    }, [onDismiss]);

    /**
     * Toggle the picker
     */
    const toggle = useCallback(() => {
        if (isOpen) {
            close();
        } else {
            open();
        }
    }, [isOpen, open, close]);

    /**
     * Set search query with debounce
     */
    const setSearchQuery = useCallback(
        (query: string) => {
            setSearchQueryState(query);
            setHighlightedIndex(0);

            // Debounce the search callback
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
            searchTimeoutRef.current = setTimeout(() => {
                onSearch?.(query);
            }, searchDebounce);
        },
        [searchDebounce, onSearch],
    );

    /**
     * Select a file
     */
    const selectFile = useCallback(
        (file: FilePickerItem) => {
            setSelectedFiles((prev) => {
                if (prev.length >= maxSelection) {
                    return prev;
                }
                if (prev.some((f) => f.id === file.id)) {
                    return prev;
                }
                return [...prev, file];
            });
        },
        [maxSelection],
    );

    /**
     * Deselect a file
     */
    const deselectFile = useCallback((file: FilePickerItem) => {
        setSelectedFiles((prev) => prev.filter((f) => f.id !== file.id));
    }, []);

    /**
     * Toggle file selection
     */
    const toggleFileSelection = useCallback(
        (file: FilePickerItem) => {
            const isSelected = selectedFiles.some((f) => f.id === file.id);
            if (isSelected) {
                deselectFile(file);
            } else {
                selectFile(file);
            }
        },
        [selectedFiles, selectFile, deselectFile],
    );

    /**
     * Clear all selections
     */
    const clearSelection = useCallback(() => {
        setSelectedFiles([]);
    }, []);

    /**
     * Move highlight to previous item
     */
    const highlightPrevious = useCallback(() => {
        setHighlightedIndex((prev) => Math.max(0, prev - 1));
    }, []);

    /**
     * Move highlight to next item
     */
    const highlightNext = useCallback(() => {
        setHighlightedIndex((prev) => Math.min(filteredFiles.length - 1, prev + 1));
    }, [filteredFiles.length]);

    /**
     * Select the currently highlighted item
     */
    const selectHighlighted = useCallback(() => {
        const file = filteredFiles[highlightedIndex];
        if (file) {
            toggleFileSelection(file);
        }
    }, [filteredFiles, highlightedIndex, toggleFileSelection]);

    /**
     * Confirm selection and close
     */
    const confirmSelection = useCallback(() => {
        if (selectedFiles.length > 0) {
            onSelect?.(selectedFiles);
        }
        close();
    }, [selectedFiles, onSelect, close]);

    /**
     * Reset highlighted index when filtered files change
     */
    useEffect(() => {
        if (highlightedIndex >= filteredFiles.length) {
            setHighlightedIndex(Math.max(0, filteredFiles.length - 1));
        }
    }, [filteredFiles.length, highlightedIndex]);

    /**
     * Cleanup on unmount
     */
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    return {
        isOpen,
        open,
        close,
        toggle,
        files,
        categories,
        selectedFiles,
        highlightedIndex,
        searchQuery,
        setSearchQuery,
        filteredFiles,
        isLoading,
        selectFile,
        deselectFile,
        toggleFileSelection,
        clearSelection,
        highlightPrevious,
        highlightNext,
        selectHighlighted,
        confirmSelection,
        requestFiles,
    };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get icon for file type
 */
export function getFileIcon(file: FilePickerItem): string {
    if (file.type === "directory") {
        return "folder";
    }

    const iconMap: Record<string, string> = {
        // Code files
        ts: "typescript",
        tsx: "react",
        js: "javascript",
        jsx: "react",
        py: "python",
        rs: "rust",
        go: "go",
        java: "java",
        rb: "ruby",
        php: "php",
        cs: "csharp",
        cpp: "cpp",
        c: "c",
        h: "c",
        hpp: "cpp",
        swift: "swift",
        kt: "kotlin",
        scala: "scala",
        // Config files
        json: "json",
        yaml: "yaml",
        yml: "yaml",
        toml: "toml",
        xml: "xml",
        // Web files
        html: "html",
        css: "css",
        scss: "sass",
        less: "less",
        svg: "svg",
        // Documentation
        md: "markdown",
        txt: "text",
        pdf: "pdf",
        doc: "word",
        docx: "word",
        // Images
        png: "image",
        jpg: "image",
        jpeg: "image",
        gif: "image",
        webp: "image",
        ico: "image",
        // Data
        csv: "csv",
        sql: "database",
        // Shell
        sh: "shell",
        bash: "shell",
        zsh: "shell",
        fish: "shell",
    };

    return file.extension ? iconMap[file.extension] || "file" : "file";
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";

    const units = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, i);

    return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}
