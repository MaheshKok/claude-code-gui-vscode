import React, { useState, useCallback, useMemo } from 'react';

export interface DiffLine {
  type: 'context' | 'added' | 'removed';
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
}

/**
 * Compute line-by-line diff using LCS algorithm
 * Based on the original script.ts computeLineDiff function
 */
const computeLineDiff = (oldLines: string[], newLines: string[]): DiffLine[] => {
  const m = oldLines.length;
  const n = newLines.length;

  // Compute longest common subsequence
  const lcs: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0) as number[]);

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const oldLine = oldLines[i - 1];
      const newLine = newLines[j - 1];
      const lcsRow = lcs[i];
      const lcsPrevRow = lcs[i - 1];
      if (lcsRow && lcsPrevRow) {
        if (oldLine === newLine) {
          lcsRow[j] = (lcsPrevRow[j - 1] ?? 0) + 1;
        } else {
          lcsRow[j] = Math.max(lcsPrevRow[j] ?? 0, lcsRow[j - 1] ?? 0);
        }
      }
    }
  }

  // Backtrack to build diff
  const diff: DiffLine[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    const lcsRow = lcs[i];
    const lcsPrevRow = lcs[i - 1];
    const oldLine = i > 0 ? oldLines[i - 1] : undefined;
    const newLine = j > 0 ? newLines[j - 1] : undefined;

    if (i > 0 && j > 0 && oldLine === newLine) {
      diff.unshift({
        type: 'context',
        oldLine: i - 1,
        newLine: j - 1,
        content: oldLine ?? '',
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || (lcsRow && lcsPrevRow && (lcsRow[j - 1] ?? 0) >= (lcsPrevRow[j] ?? 0)))) {
      diff.unshift({
        type: 'added',
        newLine: j - 1,
        content: newLine ?? '',
      });
      j--;
    } else if (i > 0) {
      diff.unshift({
        type: 'removed',
        oldLine: i - 1,
        content: oldLine ?? '',
      });
      i--;
    }
  }

  return diff;
};

const formatFilePath = (filePath: string): string => {
  if (!filePath) return '';
  const parts = filePath.split('/');
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
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const diff = useMemo(() => {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    return computeLineDiff(oldLines, newLines);
  }, [oldContent, newContent]);

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    diff.forEach((line) => {
      if (line.type === 'added') added++;
      if (line.type === 'removed') removed++;
    });
    return { added, removed };
  }, [diff]);

  const visibleLines = isExpanded ? diff : diff.slice(0, maxVisibleLines);
  const hiddenCount = diff.length - maxVisibleLines;
  const shouldTruncate = diff.length > maxVisibleLines;

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleOpenDiff = useCallback(() => {
    if (onOpenDiff) {
      onOpenDiff(filePath, oldContent, newContent);
    }
  }, [onOpenDiff, filePath, oldContent, newContent]);

  const handleFilePathClick = useCallback(() => {
    if (onFilePathClick) {
      onFilePathClick(filePath);
    }
  }, [onFilePathClick, filePath]);

  const getLineNumber = (line: DiffLine): string => {
    if (line.type === 'removed') {
      return ((line.oldLine ?? 0) + startLine).toString().padStart(4, ' ');
    }
    return ((line.newLine ?? 0) + startLine).toString().padStart(4, ' ');
  };

  const getPrefix = (type: 'context' | 'added' | 'removed'): string => {
    switch (type) {
      case 'added':
        return '+';
      case 'removed':
        return '-';
      default:
        return ' ';
    }
  };

  const getLineClasses = (type: 'context' | 'added' | 'removed'): string => {
    switch (type) {
      case 'added':
        return 'bg-[var(--vscode-diffEditor-insertedLineBackground)] text-[var(--vscode-gitDecoration-addedResourceForeground)]';
      case 'removed':
        return 'bg-[var(--vscode-diffEditor-removedLineBackground)] text-[var(--vscode-gitDecoration-deletedResourceForeground)]';
      default:
        return 'text-[var(--vscode-foreground)]';
    }
  };

  const getSummary = (): string => {
    const parts: string[] = [];
    if (stats.added > 0) {
      parts.push(`+${stats.added} line${stats.added > 1 ? 's' : ''} added`);
    }
    if (stats.removed > 0) {
      parts.push(`-${stats.removed} line${stats.removed > 1 ? 's' : ''} removed`);
    }
    return parts.length > 0 ? parts.join(', ') : 'No changes';
  };

  return (
    <div className="rounded-md overflow-hidden border border-[var(--vscode-panel-border)] bg-[var(--vscode-textCodeBlock-background)]">
      {/* File Header */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 bg-[var(--vscode-sideBarSectionHeader-background)] border-b border-[var(--vscode-panel-border)] cursor-pointer hover:bg-[var(--vscode-list-hoverBackground)]"
        onClick={handleFilePathClick}
        title={filePath}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[var(--vscode-symbolIcon-fileForeground)]"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14,2 14,8 20,8" />
        </svg>
        <span className="text-sm text-[var(--vscode-textLink-foreground)] hover:underline">
          {formatFilePath(filePath)}
        </span>
      </div>

      {/* Line Range Header */}
      <div className="px-3 py-1 text-xs text-[var(--vscode-descriptionForeground)] bg-[var(--vscode-editorGroupHeader-tabsBackground)] border-b border-[var(--vscode-panel-border)]">
        Lines {startLine}-{startLine + Math.max(oldContent.split('\n').length, newContent.split('\n').length) - 1}
      </div>

      {/* Diff Content */}
      <div className="overflow-x-auto">
        <div className="font-mono text-xs leading-5">
          {visibleLines.map((line, index) => (
            <div
              key={index}
              className={`flex whitespace-pre ${getLineClasses(line.type)}`}
            >
              <span className="w-4 shrink-0 text-center select-none text-[var(--vscode-editorLineNumber-foreground)]">
                {getPrefix(line.type)}
              </span>
              <span className="w-12 shrink-0 text-right pr-2 select-none text-[var(--vscode-editorLineNumber-foreground)]">
                {getLineNumber(line)}
              </span>
              <span className="px-2 flex-1">{line.content || ' '}</span>
            </div>
          ))}
        </div>

        {/* Expand/Collapse */}
        {shouldTruncate && (
          <div className="px-3 py-1.5 border-t border-[var(--vscode-panel-border)] bg-[var(--vscode-editorGroupHeader-tabsBackground)]">
            <button
              className="flex items-center gap-1 text-xs text-[var(--vscode-textLink-foreground)] hover:underline"
              onClick={toggleExpanded}
            >
              {isExpanded ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                  <span>Show less</span>
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                  <span>Show {hiddenCount} more lines</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Summary Row */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-[var(--vscode-panel-border)] bg-[var(--vscode-sideBarSectionHeader-background)]">
        <span className="text-xs text-[var(--vscode-descriptionForeground)]">
          Summary: {getSummary()}
        </span>

        {onOpenDiff && (
          <button
            className="flex items-center gap-1.5 px-2 py-1 text-xs rounded bg-[var(--vscode-button-secondaryBackground)] text-[var(--vscode-button-secondaryForeground)] hover:bg-[var(--vscode-button-secondaryHoverBackground)] transition-colors"
            onClick={handleOpenDiff}
            title="Open side-by-side diff in VS Code"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="18" rx="1" />
              <rect x="14" y="3" width="7" height="18" rx="1" />
            </svg>
            <span>Open Diff</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default DiffViewer;
