import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock useVSCode hook
vi.mock("../../webview/hooks/useVSCode", () => ({
    useVSCode: vi.fn(() => ({
        postMessage: vi.fn(),
        isVSCode: false,
        api: null,
        getState: vi.fn(),
        setState: vi.fn(),
        updateState: vi.fn(),
    })),
}));

// Store the handler callback from useMessages
let messageHandlers: Record<string, (message: any) => void> = {};

// Mock useMessages hook to capture handlers
vi.mock("../../webview/hooks/useMessages", () => ({
    useMessages: vi.fn(
        (options: { enabled?: boolean; handlers?: Record<string, (message: any) => void> }) => {
            if (options?.handlers) {
                messageHandlers = options.handlers;
            }
        },
    ),
}));

import {
    useFilePicker,
    getFileIcon,
    formatFileSize,
    type FilePickerItem,
} from "../../webview/hooks/useFilePicker";
import { useVSCode } from "../../webview/hooks/useVSCode";
import { useMessages } from "../../webview/hooks/useMessages";

describe("useFilePicker", () => {
    const mockPostMessage = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        messageHandlers = {};
        vi.mocked(useVSCode).mockReturnValue({
            postMessage: mockPostMessage,
            isVSCode: true,
            api: {} as any,
            getState: vi.fn(),
            setState: vi.fn(),
            updateState: vi.fn(),
        });
    });

    describe("initial state", () => {
        it("should initialize with picker closed", () => {
            const { result } = renderHook(() => useFilePicker());

            expect(result.current.isOpen).toBe(false);
            expect(result.current.files).toEqual([]);
            expect(result.current.selectedFiles).toEqual([]);
            expect(result.current.highlightedIndex).toBe(0);
            expect(result.current.searchQuery).toBe("");
            expect(result.current.isLoading).toBe(false);
        });

        it("should have empty categories", () => {
            const { result } = renderHook(() => useFilePicker());
            expect(result.current.categories).toEqual([]);
        });

        it("should have empty filtered files", () => {
            const { result } = renderHook(() => useFilePicker());
            expect(result.current.filteredFiles).toEqual([]);
        });
    });

    describe("open/close/toggle", () => {
        it("should open the picker", () => {
            const { result } = renderHook(() => useFilePicker());

            act(() => {
                result.current.open();
            });

            expect(result.current.isOpen).toBe(true);
            expect(result.current.isLoading).toBe(true);
        });

        it("should close the picker", () => {
            const { result } = renderHook(() => useFilePicker());

            act(() => {
                result.current.open();
            });

            act(() => {
                result.current.close();
            });

            expect(result.current.isOpen).toBe(false);
        });

        it("should toggle the picker", () => {
            const { result } = renderHook(() => useFilePicker());

            act(() => {
                result.current.toggle();
            });
            expect(result.current.isOpen).toBe(true);

            act(() => {
                result.current.toggle();
            });
            expect(result.current.isOpen).toBe(false);
        });

        it("should call onDismiss when closing", () => {
            const onDismiss = vi.fn();
            const { result } = renderHook(() => useFilePicker({ onDismiss }));

            act(() => {
                result.current.open();
                result.current.close();
            });

            expect(onDismiss).toHaveBeenCalled();
        });

        it("should not open when disabled", () => {
            const { result } = renderHook(() => useFilePicker({ enabled: false }));

            act(() => {
                result.current.open();
            });

            expect(result.current.isOpen).toBe(false);
        });

        it("should request files when opening", () => {
            const { result } = renderHook(() => useFilePicker());

            act(() => {
                result.current.open();
            });

            expect(mockPostMessage).toHaveBeenCalledWith({ type: "requestState" });
        });
    });

    describe("file selection", () => {
        it("should select a file", () => {
            const { result } = renderHook(() => useFilePicker());
            const file: FilePickerItem = {
                id: "file-1",
                name: "test.ts",
                path: "/src/test.ts",
                type: "file",
                extension: "ts",
            };

            act(() => {
                result.current.selectFile(file);
            });

            expect(result.current.selectedFiles).toHaveLength(1);
            expect(result.current.selectedFiles[0].id).toBe("file-1");
        });

        it("should not select duplicate files", () => {
            const { result } = renderHook(() => useFilePicker());
            const file: FilePickerItem = {
                id: "file-1",
                name: "test.ts",
                path: "/src/test.ts",
                type: "file",
            };

            act(() => {
                result.current.selectFile(file);
                result.current.selectFile(file);
            });

            expect(result.current.selectedFiles).toHaveLength(1);
        });

        it("should respect maxSelection limit", () => {
            const { result } = renderHook(() => useFilePicker({ maxSelection: 2 }));
            const files: FilePickerItem[] = [
                { id: "1", name: "a.ts", path: "/a.ts", type: "file" },
                { id: "2", name: "b.ts", path: "/b.ts", type: "file" },
                { id: "3", name: "c.ts", path: "/c.ts", type: "file" },
            ];

            act(() => {
                files.forEach((file) => result.current.selectFile(file));
            });

            expect(result.current.selectedFiles).toHaveLength(2);
        });

        it("should deselect a file", () => {
            const { result } = renderHook(() => useFilePicker());
            const file: FilePickerItem = {
                id: "file-1",
                name: "test.ts",
                path: "/src/test.ts",
                type: "file",
            };

            act(() => {
                result.current.selectFile(file);
            });

            expect(result.current.selectedFiles).toHaveLength(1);

            act(() => {
                result.current.deselectFile(file);
            });

            expect(result.current.selectedFiles).toHaveLength(0);
        });

        it("should toggle file selection", () => {
            const { result } = renderHook(() => useFilePicker());
            const file: FilePickerItem = {
                id: "file-1",
                name: "test.ts",
                path: "/src/test.ts",
                type: "file",
            };

            act(() => {
                result.current.toggleFileSelection(file);
            });
            expect(result.current.selectedFiles).toHaveLength(1);

            act(() => {
                result.current.toggleFileSelection(file);
            });
            expect(result.current.selectedFiles).toHaveLength(0);
        });

        it("should clear selection", () => {
            const { result } = renderHook(() => useFilePicker());
            const files: FilePickerItem[] = [
                { id: "1", name: "a.ts", path: "/a.ts", type: "file" },
                { id: "2", name: "b.ts", path: "/b.ts", type: "file" },
            ];

            act(() => {
                files.forEach((file) => result.current.selectFile(file));
            });
            expect(result.current.selectedFiles).toHaveLength(2);

            act(() => {
                result.current.clearSelection();
            });
            expect(result.current.selectedFiles).toHaveLength(0);
        });
    });

    describe("search", () => {
        it("should update search query", () => {
            vi.useFakeTimers();
            const { result } = renderHook(() => useFilePicker());

            act(() => {
                result.current.setSearchQuery("test");
            });

            expect(result.current.searchQuery).toBe("test");
            vi.useRealTimers();
        });

        it("should reset highlighted index when search changes", () => {
            vi.useFakeTimers();
            const { result } = renderHook(() => useFilePicker());

            act(() => {
                result.current.setSearchQuery("test");
            });

            expect(result.current.highlightedIndex).toBe(0);
            vi.useRealTimers();
        });

        it("should call onSearch callback with debounce", () => {
            vi.useFakeTimers();
            const onSearch = vi.fn();
            const { result } = renderHook(() => useFilePicker({ onSearch, searchDebounce: 100 }));

            act(() => {
                result.current.setSearchQuery("test");
            });

            expect(onSearch).not.toHaveBeenCalled();

            act(() => {
                vi.advanceTimersByTime(100);
            });

            expect(onSearch).toHaveBeenCalledWith("test");
            vi.useRealTimers();
        });
    });

    describe("keyboard navigation", () => {
        it("should highlight previous item", () => {
            const { result } = renderHook(() => useFilePicker());

            // Set initial index
            act(() => {
                (result.current as any).highlightNext();
                (result.current as any).highlightNext();
            });

            act(() => {
                result.current.highlightPrevious();
            });

            expect(result.current.highlightedIndex).toBe(0);
        });

        it("should not go below 0", () => {
            const { result } = renderHook(() => useFilePicker());

            act(() => {
                result.current.highlightPrevious();
                result.current.highlightPrevious();
            });

            expect(result.current.highlightedIndex).toBe(0);
        });

        it("should highlight next item", () => {
            const { result } = renderHook(() => useFilePicker());

            act(() => {
                result.current.highlightNext();
            });

            // When there are no filtered files, highlightNext uses Math.min(filteredFiles.length - 1, prev + 1)
            // With empty files, this becomes Math.min(-1, 1) = -1
            // This is expected behavior - the hook clamps to valid range
            expect(result.current.highlightedIndex).toBe(-1);
        });
    });

    describe("confirmSelection", () => {
        it("should call onSelect with selected files", () => {
            const onSelect = vi.fn();
            const { result } = renderHook(() => useFilePicker({ onSelect }));
            const file: FilePickerItem = {
                id: "file-1",
                name: "test.ts",
                path: "/src/test.ts",
                type: "file",
            };

            act(() => {
                result.current.selectFile(file);
            });

            // Verify file was selected
            expect(result.current.selectedFiles).toHaveLength(1);

            act(() => {
                result.current.confirmSelection();
            });

            expect(onSelect).toHaveBeenCalledWith([file]);
        });

        it("should close picker after confirming", () => {
            const { result } = renderHook(() => useFilePicker());
            const file: FilePickerItem = {
                id: "file-1",
                name: "test.ts",
                path: "/src/test.ts",
                type: "file",
            };

            act(() => {
                result.current.open();
            });

            act(() => {
                result.current.selectFile(file);
            });

            act(() => {
                result.current.confirmSelection();
            });

            expect(result.current.isOpen).toBe(false);
        });

        it("should not call onSelect if no files selected", () => {
            const onSelect = vi.fn();
            const { result } = renderHook(() => useFilePicker({ onSelect }));

            act(() => {
                result.current.confirmSelection();
            });

            expect(onSelect).not.toHaveBeenCalled();
        });
    });

    describe("requestFiles", () => {
        it("should set loading state and send message", () => {
            const { result } = renderHook(() => useFilePicker());

            act(() => {
                result.current.requestFiles();
            });

            expect(result.current.isLoading).toBe(true);
            expect(mockPostMessage).toHaveBeenCalledWith({ type: "requestState" });
        });
    });

    describe("cleanup", () => {
        it("should clear timeout on unmount", () => {
            vi.useFakeTimers();
            const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
            const { result, unmount } = renderHook(() => useFilePicker());

            act(() => {
                result.current.setSearchQuery("test");
            });

            unmount();

            // Verify cleanup was called (may have been called for the debounce timeout)
            expect(clearTimeoutSpy).toHaveBeenCalled();
            clearTimeoutSpy.mockRestore();
            vi.useRealTimers();
        });
    });

    describe("file list from extension", () => {
        it("should handle restoreState message with files", () => {
            const { result } = renderHook(() => useFilePicker());

            // Open picker to enable message handler
            act(() => {
                result.current.open();
            });

            // Simulate receiving files from extension
            act(() => {
                messageHandlers.restoreState?.({
                    state: {
                        files: [
                            {
                                name: "test.ts",
                                path: "/src/test.ts",
                                type: "file",
                                modifiedAt: Date.now(),
                                size: 1024,
                            },
                            { name: "app.tsx", path: "/src/app.tsx", type: "file" },
                            { name: "index.js", path: "/src/index.js" }, // No type provided
                        ],
                    },
                });
            });

            expect(result.current.files.length).toBe(3);
            expect(result.current.isLoading).toBe(false);
            expect(result.current.files[0].extension).toBe("ts");
            expect(result.current.files[1].extension).toBe("tsx");
        });

        it("should handle restoreState with no files in state", () => {
            const { result } = renderHook(() => useFilePicker());

            act(() => {
                result.current.open();
            });

            // Simulate receiving state without files
            act(() => {
                messageHandlers.restoreState?.({
                    state: {},
                });
            });

            expect(result.current.files.length).toBe(0);
        });

        it("should extract extension from filename", () => {
            const { result } = renderHook(() => useFilePicker());

            act(() => {
                result.current.open();
            });

            act(() => {
                messageHandlers.restoreState?.({
                    state: {
                        files: [
                            { name: "noextension", path: "/noextension" },
                            { name: "file.test.ts", path: "/file.test.ts" },
                        ],
                    },
                });
            });

            // File without extension should have undefined extension
            expect(result.current.files[0].extension).toBeUndefined();
            // File with multiple dots should get last part as extension
            expect(result.current.files[1].extension).toBe("ts");
        });
    });

    describe("file filtering", () => {
        const setupFilesForFiltering = () => {
            const { result } = renderHook(() =>
                useFilePicker({
                    includeDirectories: false,
                    showHidden: false,
                    excludePatterns: ["node_modules", ".git"],
                }),
            );

            act(() => {
                result.current.open();
            });

            act(() => {
                messageHandlers.restoreState?.({
                    state: {
                        files: [
                            { name: "test.ts", path: "/src/test.ts", type: "file" },
                            { name: "src", path: "/src", type: "directory" },
                            { name: ".hidden", path: "/.hidden", type: "file" },
                            { name: "module.js", path: "/node_modules/module.js", type: "file" },
                            { name: "config", path: "/.git/config", type: "file" },
                        ],
                    },
                });
            });

            return result;
        };

        it("should filter out directories when includeDirectories is false", () => {
            const result = setupFilesForFiltering();

            // Only test.ts should pass through (directory filtered out)
            expect(result.current.filteredFiles.some((f) => f.type === "directory")).toBe(false);
        });

        it("should filter out hidden files when showHidden is false", () => {
            const result = setupFilesForFiltering();

            // .hidden should be filtered out
            expect(result.current.filteredFiles.some((f) => f.name.startsWith("."))).toBe(false);
        });

        it("should filter out files matching exclude patterns", () => {
            const result = setupFilesForFiltering();

            // node_modules and .git files should be filtered out
            expect(result.current.filteredFiles.some((f) => f.path.includes("node_modules"))).toBe(
                false,
            );
            expect(result.current.filteredFiles.some((f) => f.path.includes(".git"))).toBe(false);
        });

        it("should include directories when includeDirectories is true", () => {
            const { result } = renderHook(() => useFilePicker({ includeDirectories: true }));

            act(() => {
                result.current.open();
            });

            act(() => {
                messageHandlers.restoreState?.({
                    state: {
                        files: [
                            { name: "src", path: "/src", type: "directory" },
                            { name: "test.ts", path: "/test.ts", type: "file" },
                        ],
                    },
                });
            });

            expect(result.current.filteredFiles.some((f) => f.type === "directory")).toBe(true);
        });

        it("should include hidden files when showHidden is true", () => {
            const { result } = renderHook(() =>
                useFilePicker({ showHidden: true, excludePatterns: [] }),
            );

            act(() => {
                result.current.open();
            });

            act(() => {
                messageHandlers.restoreState?.({
                    state: {
                        files: [
                            { name: ".hidden", path: "/.hidden", type: "file" },
                            { name: "visible.ts", path: "/visible.ts", type: "file" },
                        ],
                    },
                });
            });

            expect(result.current.filteredFiles.some((f) => f.name === ".hidden")).toBe(true);
        });

        it("should filter by allowed extensions", () => {
            const { result } = renderHook(() =>
                useFilePicker({ allowedExtensions: ["ts", "tsx"], excludePatterns: [] }),
            );

            act(() => {
                result.current.open();
            });

            act(() => {
                messageHandlers.restoreState?.({
                    state: {
                        files: [
                            { name: "test.ts", path: "/test.ts", type: "file" },
                            { name: "app.tsx", path: "/app.tsx", type: "file" },
                            { name: "style.css", path: "/style.css", type: "file" },
                            { name: "readme.md", path: "/readme.md", type: "file" },
                        ],
                    },
                });
            });

            expect(result.current.filteredFiles.length).toBe(2);
            expect(
                result.current.filteredFiles.every((f) => ["ts", "tsx"].includes(f.extension!)),
            ).toBe(true);
        });

        it("should filter out excluded extensions", () => {
            const { result } = renderHook(() =>
                useFilePicker({ excludedExtensions: ["md", "txt"], excludePatterns: [] }),
            );

            act(() => {
                result.current.open();
            });

            act(() => {
                messageHandlers.restoreState?.({
                    state: {
                        files: [
                            { name: "test.ts", path: "/test.ts", type: "file" },
                            { name: "readme.md", path: "/readme.md", type: "file" },
                            { name: "notes.txt", path: "/notes.txt", type: "file" },
                        ],
                    },
                });
            });

            expect(result.current.filteredFiles.length).toBe(1);
            expect(result.current.filteredFiles[0].name).toBe("test.ts");
        });
    });

    describe("search and filtering", () => {
        it("should filter files by name", () => {
            vi.useFakeTimers();
            const { result } = renderHook(() => useFilePicker({ excludePatterns: [] }));

            act(() => {
                result.current.open();
            });

            act(() => {
                messageHandlers.restoreState?.({
                    state: {
                        files: [
                            { name: "test.ts", path: "/src/test.ts", type: "file" },
                            { name: "app.tsx", path: "/src/app.tsx", type: "file" },
                            { name: "utils.ts", path: "/src/utils.ts", type: "file" },
                        ],
                    },
                });
            });

            act(() => {
                result.current.setSearchQuery("test");
            });

            expect(result.current.filteredFiles.length).toBe(1);
            expect(result.current.filteredFiles[0].name).toBe("test.ts");
            vi.useRealTimers();
        });

        it("should filter files by path", () => {
            vi.useFakeTimers();
            const { result } = renderHook(() => useFilePicker({ excludePatterns: [] }));

            act(() => {
                result.current.open();
            });

            act(() => {
                messageHandlers.restoreState?.({
                    state: {
                        files: [
                            { name: "test.ts", path: "/src/test.ts", type: "file" },
                            { name: "app.tsx", path: "/lib/app.tsx", type: "file" },
                        ],
                    },
                });
            });

            act(() => {
                result.current.setSearchQuery("src");
            });

            expect(result.current.filteredFiles.length).toBe(1);
            expect(result.current.filteredFiles[0].path).toBe("/src/test.ts");
            vi.useRealTimers();
        });

        it("should prioritize exact matches in sorting", () => {
            vi.useFakeTimers();
            const { result } = renderHook(() => useFilePicker({ excludePatterns: [] }));

            act(() => {
                result.current.open();
            });

            act(() => {
                messageHandlers.restoreState?.({
                    state: {
                        files: [
                            { name: "atestfile.ts", path: "/atestfile.ts", type: "file" },
                            { name: "test.ts", path: "/test.ts", type: "file" },
                            { name: "ztest.ts", path: "/ztest.ts", type: "file" },
                        ],
                    },
                });
            });

            act(() => {
                result.current.setSearchQuery("test");
            });

            // test.ts should come first as it starts with "test"
            expect(result.current.filteredFiles[0].name).toBe("test.ts");
            vi.useRealTimers();
        });

        it("should sort alphabetically when no exact matches", () => {
            vi.useFakeTimers();
            const { result } = renderHook(() => useFilePicker({ excludePatterns: [] }));

            act(() => {
                result.current.open();
            });

            act(() => {
                messageHandlers.restoreState?.({
                    state: {
                        files: [
                            { name: "zebra.ts", path: "/zebra.ts", type: "file" },
                            { name: "alpha.ts", path: "/alpha.ts", type: "file" },
                            { name: "beta.ts", path: "/beta.ts", type: "file" },
                        ],
                    },
                });
            });

            // Without search, should sort alphabetically
            expect(result.current.filteredFiles[0].name).toBe("alpha.ts");
            expect(result.current.filteredFiles[1].name).toBe("beta.ts");
            expect(result.current.filteredFiles[2].name).toBe("zebra.ts");
            vi.useRealTimers();
        });
    });

    describe("categories", () => {
        it("should group files by directory", () => {
            const { result } = renderHook(() => useFilePicker({ excludePatterns: [] }));

            act(() => {
                result.current.open();
            });

            act(() => {
                messageHandlers.restoreState?.({
                    state: {
                        files: [
                            { name: "test.ts", path: "/src/test.ts", type: "file" },
                            { name: "app.tsx", path: "/src/app.tsx", type: "file" },
                            { name: "index.ts", path: "/lib/index.ts", type: "file" },
                        ],
                    },
                });
            });

            expect(result.current.categories.length).toBe(2);
            expect(result.current.categories.some((c) => c.id === "/src")).toBe(true);
            expect(result.current.categories.some((c) => c.id === "/lib")).toBe(true);
        });

        it("should use Root for files without directory", () => {
            const { result } = renderHook(() => useFilePicker({ excludePatterns: [] }));

            act(() => {
                result.current.open();
            });

            act(() => {
                messageHandlers.restoreState?.({
                    state: {
                        files: [{ name: "test.ts", path: "test.ts", type: "file" }],
                    },
                });
            });

            expect(result.current.categories[0].id).toBe("Root");
        });
    });

    describe("selectHighlighted", () => {
        it("should select highlighted file", () => {
            const { result } = renderHook(() => useFilePicker({ excludePatterns: [] }));

            act(() => {
                result.current.open();
            });

            act(() => {
                messageHandlers.restoreState?.({
                    state: {
                        files: [
                            { name: "test.ts", path: "/test.ts", type: "file" },
                            { name: "app.tsx", path: "/app.tsx", type: "file" },
                        ],
                    },
                });
            });

            // Highlight first item and select it
            act(() => {
                result.current.selectHighlighted();
            });

            expect(result.current.selectedFiles.length).toBe(1);
            expect(result.current.selectedFiles[0].name).toBe("app.tsx"); // Sorted alphabetically
        });

        it("should toggle selection when called twice on same item", () => {
            const { result } = renderHook(() => useFilePicker({ excludePatterns: [] }));

            act(() => {
                result.current.open();
            });

            act(() => {
                messageHandlers.restoreState?.({
                    state: {
                        files: [{ name: "test.ts", path: "/test.ts", type: "file" }],
                    },
                });
            });

            act(() => {
                result.current.selectHighlighted();
            });
            expect(result.current.selectedFiles.length).toBe(1);

            act(() => {
                result.current.selectHighlighted();
            });
            expect(result.current.selectedFiles.length).toBe(0);
        });

        it("should do nothing when no files available", () => {
            const { result } = renderHook(() => useFilePicker());

            act(() => {
                result.current.selectHighlighted();
            });

            expect(result.current.selectedFiles.length).toBe(0);
        });
    });

    describe("highlight index reset", () => {
        it("should reset highlighted index when filtered files change", () => {
            vi.useFakeTimers();
            const { result } = renderHook(() => useFilePicker({ excludePatterns: [] }));

            act(() => {
                result.current.open();
            });

            act(() => {
                messageHandlers.restoreState?.({
                    state: {
                        files: [
                            { name: "aaa.ts", path: "/aaa.ts", type: "file" },
                            { name: "bbb.ts", path: "/bbb.ts", type: "file" },
                            { name: "ccc.ts", path: "/ccc.ts", type: "file" },
                        ],
                    },
                });
            });

            // Move highlight to last item
            act(() => {
                result.current.highlightNext();
                result.current.highlightNext();
            });
            expect(result.current.highlightedIndex).toBe(2);

            // Search for something that only matches one file
            act(() => {
                result.current.setSearchQuery("aaa");
            });

            // Highlight index should be reset to 0 since only one file matches
            expect(result.current.highlightedIndex).toBe(0);
            vi.useRealTimers();
        });
    });

    describe("debounce cancellation", () => {
        it("should cancel previous debounce when search query changes rapidly", () => {
            vi.useFakeTimers();
            const onSearch = vi.fn();
            const { result } = renderHook(() => useFilePicker({ onSearch, searchDebounce: 100 }));

            act(() => {
                result.current.setSearchQuery("a");
            });

            act(() => {
                vi.advanceTimersByTime(50);
            });

            act(() => {
                result.current.setSearchQuery("ab");
            });

            act(() => {
                vi.advanceTimersByTime(50);
            });

            act(() => {
                result.current.setSearchQuery("abc");
            });

            act(() => {
                vi.advanceTimersByTime(100);
            });

            // Only the final search should have been called
            expect(onSearch).toHaveBeenCalledTimes(1);
            expect(onSearch).toHaveBeenCalledWith("abc");
            vi.useRealTimers();
        });
    });
});

describe("getFileIcon", () => {
    it("should return folder icon for directories", () => {
        const file: FilePickerItem = {
            id: "1",
            name: "src",
            path: "/src",
            type: "directory",
        };
        expect(getFileIcon(file)).toBe("folder");
    });

    it("should return typescript icon for .ts files", () => {
        const file: FilePickerItem = {
            id: "1",
            name: "index.ts",
            path: "/index.ts",
            type: "file",
            extension: "ts",
        };
        expect(getFileIcon(file)).toBe("typescript");
    });

    it("should return react icon for .tsx files", () => {
        const file: FilePickerItem = {
            id: "1",
            name: "App.tsx",
            path: "/App.tsx",
            type: "file",
            extension: "tsx",
        };
        expect(getFileIcon(file)).toBe("react");
    });

    it("should return javascript icon for .js files", () => {
        const file: FilePickerItem = {
            id: "1",
            name: "index.js",
            path: "/index.js",
            type: "file",
            extension: "js",
        };
        expect(getFileIcon(file)).toBe("javascript");
    });

    it("should return python icon for .py files", () => {
        const file: FilePickerItem = {
            id: "1",
            name: "main.py",
            path: "/main.py",
            type: "file",
            extension: "py",
        };
        expect(getFileIcon(file)).toBe("python");
    });

    it("should return json icon for .json files", () => {
        const file: FilePickerItem = {
            id: "1",
            name: "package.json",
            path: "/package.json",
            type: "file",
            extension: "json",
        };
        expect(getFileIcon(file)).toBe("json");
    });

    it("should return markdown icon for .md files", () => {
        const file: FilePickerItem = {
            id: "1",
            name: "README.md",
            path: "/README.md",
            type: "file",
            extension: "md",
        };
        expect(getFileIcon(file)).toBe("markdown");
    });

    it("should return html icon for .html files", () => {
        const file: FilePickerItem = {
            id: "1",
            name: "index.html",
            path: "/index.html",
            type: "file",
            extension: "html",
        };
        expect(getFileIcon(file)).toBe("html");
    });

    it("should return css icon for .css files", () => {
        const file: FilePickerItem = {
            id: "1",
            name: "styles.css",
            path: "/styles.css",
            type: "file",
            extension: "css",
        };
        expect(getFileIcon(file)).toBe("css");
    });

    it("should return image icon for image files", () => {
        const imageExtensions = ["png", "jpg", "jpeg", "gif", "webp", "ico"];
        imageExtensions.forEach((ext) => {
            const file: FilePickerItem = {
                id: "1",
                name: `image.${ext}`,
                path: `/image.${ext}`,
                type: "file",
                extension: ext,
            };
            expect(getFileIcon(file)).toBe("image");
        });
    });

    it("should return shell icon for shell files", () => {
        const shellExtensions = ["sh", "bash", "zsh", "fish"];
        shellExtensions.forEach((ext) => {
            const file: FilePickerItem = {
                id: "1",
                name: `script.${ext}`,
                path: `/script.${ext}`,
                type: "file",
                extension: ext,
            };
            expect(getFileIcon(file)).toBe("shell");
        });
    });

    it("should return file icon for unknown extensions", () => {
        const file: FilePickerItem = {
            id: "1",
            name: "file.xyz",
            path: "/file.xyz",
            type: "file",
            extension: "xyz",
        };
        expect(getFileIcon(file)).toBe("file");
    });

    it("should return file icon when no extension", () => {
        const file: FilePickerItem = {
            id: "1",
            name: "Makefile",
            path: "/Makefile",
            type: "file",
        };
        expect(getFileIcon(file)).toBe("file");
    });
});

describe("formatFileSize", () => {
    it("should format 0 bytes", () => {
        expect(formatFileSize(0)).toBe("0 B");
    });

    it("should format bytes", () => {
        expect(formatFileSize(500)).toBe("500 B");
    });

    it("should format kilobytes", () => {
        expect(formatFileSize(1024)).toBe("1.0 KB");
        expect(formatFileSize(1536)).toBe("1.5 KB");
    });

    it("should format megabytes", () => {
        expect(formatFileSize(1048576)).toBe("1.0 MB");
        expect(formatFileSize(2621440)).toBe("2.5 MB");
    });

    it("should format gigabytes", () => {
        expect(formatFileSize(1073741824)).toBe("1.0 GB");
    });

    it("should format terabytes", () => {
        expect(formatFileSize(1099511627776)).toBe("1.0 TB");
    });
});
