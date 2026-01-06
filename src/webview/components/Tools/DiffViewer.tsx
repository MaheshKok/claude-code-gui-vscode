import React, { useState, useCallback, useMemo } from "react";
import { ChevronDown, FileDiff, SplitSquareHorizontal, Undo2 } from "lucide-react";

export interface DiffLine {
    type: "context" | "added" | "removed";
    content: string;
    oldLine?: number;
    newLine?: number;
}

export interface DiffViewerProps {
    oldContent: string;
    newContent: string;
    filePath: string;
    startLine?: number;
    maxVisibleLines?: number;
    onOpenDiff?: (filePath: string, oldContent: string, newContent: string) => void;
    onFilePathClick?: (filePath: string) => void;
    onRevert?: (filePath: string, oldContent: string) => void;
    canRevert?: boolean;
}

const computeLineDiff = (oldLines: string[], newLines: string[]): DiffLine[] => {
    const m = oldLines.length;
    const n = newLines.length;

    const lcs = Array(m + 1)
        .fill(null)
        .map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (oldLines[i - 1] === newLines[j - 1]) {
                lcs[i][j] = lcs[i - 1][j - 1] + 1;
            } else {
                lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1]);
            }
        }
    }

    const diff: DiffLine[] = [];
    let i = m;
    let j = n;
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
            diff.unshift({
                type: "context",
                oldLine: i - 1,
                newLine: j - 1,
                content: oldLines[i - 1],
            });
            i--;
            j--;
        } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
            diff.unshift({ type: "added", newLine: j - 1, content: newLines[j - 1] });
            j--;
        } else {
            diff.unshift({
                type: "removed",
                oldLine: i - 1,
                content: oldLines[i - 1],
            });
            i--;
        }
    }
    return diff;
};

const formatFilePath = (filePath: string): string => {
    if (!filePath) return "";
    const parts = filePath.split("/");
    return parts[parts.length - 1] ?? filePath;
};

export const DiffViewer: React.FC<DiffViewerProps> = ({
    oldContent,
    newContent,
    filePath,
    startLine = 1,
    maxVisibleLines = 6,
    onOpenDiff,
    onFilePathClick,
    onRevert,
    canRevert = false,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const diff = useMemo(() => {
        const oldLines = oldContent.split("\n");
        const newLines = newContent.split("\n");
        return computeLineDiff(oldLines, newLines);
    }, [oldContent, newContent]);

    const stats = useMemo(() => {
        let added = 0;
        let removed = 0;
        diff.forEach((line) => {
            if (line.type === "added") added++;
            if (line.type === "removed") removed++;
        });
        return { added, removed };
    }, [diff]);

    const visibleLines = isExpanded
        ? diff
        : diff
              .filter(
                  (l) => l.type !== "context" || Math.abs((l.newLine || 0) - (l.oldLine || 0)) < 2,
              )
              .slice(0, maxVisibleLines);
    const hiddenCount = diff.length - visibleLines.length;

    const toggleExpanded = useCallback(() => setIsExpanded((prev) => !prev), []);
    const handleOpenDiff = useCallback(() => {
        if (onOpenDiff) onOpenDiff(filePath, oldContent, newContent);
    }, [onOpenDiff, filePath, oldContent, newContent]);

    const handleFilePathClick = useCallback(() => {
        if (onFilePathClick) onFilePathClick(filePath);
    }, [onFilePathClick, filePath]);

    const handleRevert = useCallback(() => {
        if (onRevert) onRevert(filePath, oldContent);
    }, [onRevert, filePath, oldContent]);

    return (
        <div className="glass-panel rounded-xl overflow-hidden border border-white/10 bg-black/20 group">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
                <div
                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={handleFilePathClick}
                >
                    <FileDiff className="w-4 h-4 text-orange-400" />
                    <span className="font-mono text-xs text-white/90 hover:underline hover:text-orange-400 transition-colors">
                        {formatFilePath(filePath)}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Enhanced line stats - more visible */}
                    <div className="flex items-center gap-2 text-xs font-semibold">
                        {stats.added > 0 && (
                            <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-md border border-green-500/30">
                                +{stats.added} {stats.added === 1 ? "line" : "lines"}
                            </span>
                        )}
                        {stats.removed > 0 && (
                            <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-md border border-red-500/30">
                                -{stats.removed} {stats.removed === 1 ? "line" : "lines"}
                            </span>
                        )}
                    </div>

                    {/* Revert button */}
                    {canRevert && onRevert && (
                        <button
                            onClick={handleRevert}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-colors flex items-center gap-1"
                            title="Revert changes"
                        >
                            <Undo2 className="w-4 h-4" />
                            <span className="text-xs">Revert</span>
                        </button>
                    )}

                    {onOpenDiff && (
                        <button
                            onClick={handleOpenDiff}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                            title="Open Diff View"
                        >
                            <SplitSquareHorizontal className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="overflow-x-auto custom-scrollbar">
                <div className="font-mono text-xs">
                    {visibleLines.map((line, index) => {
                        const isAdded = line.type === "added";
                        const isRemoved = line.type === "removed";

                        return (
                            <div
                                key={index}
                                className={`grid grid-cols-[40px_40px_20px_1fr] hover:bg-white/5 ${
                                    isAdded
                                        ? "bg-green-500/10 text-green-200"
                                        : isRemoved
                                          ? "bg-red-500/10 text-red-200"
                                          : "text-white/40"
                                }`}
                            >
                                <div className="px-2 py-0.5 text-right select-none opacity-40 border-r border-white/5">
                                    {line.oldLine ? line.oldLine + startLine - 1 : ""}
                                </div>
                                <div className="px-2 py-0.5 text-right select-none opacity-40 border-r border-white/5">
                                    {line.newLine ? line.newLine + startLine - 1 : ""}
                                </div>
                                <div className="text-center select-none opacity-60">
                                    {isAdded ? "+" : isRemoved ? "-" : ""}
                                </div>
                                <div className="px-2 py-0.5 whitespace-pre-wrap break-all">
                                    {line.content || " "}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {hiddenCount > 0 && (
                <button
                    onClick={toggleExpanded}
                    className="w-full flex items-center justify-center gap-2 py-2 text-xs text-white/50 hover:text-white hover:bg-white/5 transition-colors border-t border-white/5"
                >
                    {isExpanded ? (
                        <>
                            <ChevronDown className="w-3 h-3 rotate-180" />
                            Show Less
                        </>
                    ) : (
                        <>
                            <ChevronDown className="w-3 h-3" />
                            Show {hiddenCount} more lines
                        </>
                    )}
                </button>
            )}
        </div>
    );
};

export default DiffViewer;
