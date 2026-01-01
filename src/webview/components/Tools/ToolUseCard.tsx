import React, { useState, useCallback, useMemo } from 'react';
import { computeLineDiff, computeContextualDiff, formatDiffStats } from '../../utils';
import { useVSCode } from '../../hooks/useVSCode';

export interface ToolInput {
  [key: string]: unknown;
}

export interface ToolUseCardProps {
  toolName: string;
  input: ToolInput;
  isExecuting?: boolean;
  onFilePathClick?: (filePath: string) => void;
  /** Duration in milliseconds */
  duration?: number;
  /** Token count for this tool use */
  tokens?: number;
  /** Whether to start collapsed (default: true) */
  defaultCollapsed?: boolean;
  /** File content before operation (for diff preview) */
  fileContentBefore?: string;
  /** File content after operation (for diff preview) */
  fileContentAfter?: string;
  /** Starting line number for diff context */
  startLine?: number;
  /** Array of starting lines (for MultiEdit) */
  startLines?: number[];
}

const TOOL_ICONS: Record<string, string> = {
  Read: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  Write: 'M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z',
  Edit: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
  MultiEdit: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
  Bash: 'M4 17l6-6-6-6 M12 19h8',
  Glob: 'M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z',
  Grep: 'M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z',
  TodoWrite: 'M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  WebFetch: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z M2 12h20',
  WebSearch: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z M21 21l-6-6',
  Task: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2 M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2 M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2',
  LSP: 'M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5',
  NotebookEdit: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',
};

const DEFAULT_TOOL_ICON = 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z';

const getToolIcon = (toolName: string): string => {
  return TOOL_ICONS[toolName] ?? DEFAULT_TOOL_ICON;
};

const formatFilePath = (filePath: string): string => {
  if (!filePath) return '';
  const parts = filePath.split('/');
  return parts[parts.length - 1] ?? filePath;
};

const isFilePath = (key: string, value: unknown): boolean => {
  if (typeof value !== 'string') return false;
  const filePathKeys = ['file_path', 'filePath', 'path', 'file'];
  return filePathKeys.includes(key) || (value.startsWith('/') && !value.includes('\n'));
};

const formatValue = (value: unknown, maxLength = 200): string => {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') {
    if (value.length > maxLength) {
      return value.substring(0, maxLength) + '...';
    }
    return value;
  }
  if (typeof value === 'object') {
    const str = JSON.stringify(value, null, 2);
    if (str.length > maxLength) {
      return str.substring(0, maxLength) + '...';
    }
    return str;
  }
  return String(value);
};

/** Format duration in human readable format */
const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1).replace(/\.0$/, '')}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
};

/** Format tokens in human readable format */
const formatTokens = (tokens: number): string => {
  if (tokens < 1000) return `${tokens}`;
  return `${(tokens / 1000).toFixed(1).replace(/\.0$/, '')}K`;
};

export const ToolUseCard: React.FC<ToolUseCardProps> = ({
  toolName,
  input,
  isExecuting = false,
  onFilePathClick,
  duration,
  tokens,
  defaultCollapsed = true,
  fileContentBefore,
  fileContentAfter,
  startLine,
  startLines,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isExpanded, setIsExpanded] = useState(false);
  const { postMessage } = useVSCode();

  const handleFileClick = useCallback(
    (filePath: string) => {
      if (onFilePathClick) {
        onFilePathClick(filePath);
      }
    },
    [onFilePathClick]
  );

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const diffData = useMemo(() => {
    if (!fileContentBefore) {
      return null;
    }

    const filePath = typeof input.file_path === 'string' ? input.file_path : '';
    let newContent: string | undefined;

    if (toolName === 'Edit' && typeof input.old_string === 'string' && typeof input.new_string === 'string') {
      newContent = fileContentBefore.replace(input.old_string, input.new_string);
    } else if (toolName === 'MultiEdit' && Array.isArray(input.edits)) {
      newContent = fileContentBefore;
      for (const edit of input.edits as Array<Record<string, unknown>>) {
        if (typeof edit.old_string === 'string' && typeof edit.new_string === 'string') {
          newContent = newContent.replace(edit.old_string, edit.new_string);
        }
      }
    } else if (toolName === 'Write' && typeof input.content === 'string') {
      newContent = input.content;
    }

    const finalContent = fileContentAfter ?? newContent;
    if (!finalContent) {
      return null;
    }

    return {
      filePath,
      oldContent: fileContentBefore,
      newContent: finalContent,
    };
  }, [fileContentBefore, fileContentAfter, input, toolName]);

  const diffSections = useMemo(() => {
    const sections: Array<{ id: string; title?: string; diff: ReturnType<typeof computeLineDiff> }> = [];
    const filePath = typeof input.file_path === 'string' ? input.file_path : '';

    const getStartLine = (needle: string, fallback = 1): number => {
      if (!fileContentBefore || !needle) {
        return fallback;
      }
      const position = fileContentBefore.indexOf(needle);
      if (position === -1) {
        return fallback;
      }
      const textBefore = fileContentBefore.slice(0, position);
      return (textBefore.match(/\n/g) || []).length + 1;
    };

    if (toolName === 'Edit' && typeof input.old_string === 'string' && typeof input.new_string === 'string') {
      const startLineValue = startLine ?? getStartLine(input.old_string, 1);
      const diff = computeLineDiff(input.old_string, input.new_string, { startLine: startLineValue });
      sections.push({
        id: `${filePath || toolName}-edit`,
        title: `Line ${startLineValue}`,
        diff,
      });
    } else if (toolName === 'MultiEdit' && Array.isArray(input.edits)) {
      const edits = input.edits as Array<Record<string, unknown>>;
      edits.forEach((edit, index) => {
        if (typeof edit.old_string !== 'string' || typeof edit.new_string !== 'string') {
          return;
        }
        const fallbackStart = startLines?.[index] ?? getStartLine(edit.old_string, 1);
        const diff = computeLineDiff(edit.old_string, edit.new_string, { startLine: fallbackStart });
        sections.push({
          id: `${filePath || toolName}-edit-${index}`,
          title: `Edit ${index + 1} (Line ${fallbackStart})`,
          diff,
        });
      });
    } else if (toolName === 'Write' && typeof input.content === 'string') {
      const oldContent = fileContentBefore ?? '';
      const diff = computeContextualDiff(oldContent, input.content, { contextLines: 3, startLine: 1 });
      sections.push({
        id: `${filePath || toolName}-write`,
        diff,
      });
    }

    return sections;
  }, [fileContentBefore, input, startLine, startLines, toolName]);

  const handleOpenDiff = useCallback(() => {
    if (!diffData || !diffData.filePath) {
      return;
    }
    postMessage({
      type: 'openDiff',
      oldContent: diffData.oldContent,
      newContent: diffData.newContent,
      filePath: diffData.filePath,
    });
  }, [diffData, postMessage]);

  const renderInputValue = (key: string, value: unknown) => {
    if (isFilePath(key, value)) {
      const filePath = value as string;
      return (
        <span
          className="text-[var(--vscode-textLink-foreground)] hover:underline cursor-pointer inline-flex items-center gap-1"
          onClick={() => handleFileClick(filePath)}
          title={filePath}
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
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
          </svg>
          {formatFilePath(filePath)}
        </span>
      );
    }

    const formattedValue = formatValue(value);
    const isLong = typeof value === 'string' && value.length > 200;

    return (
      <span className="text-[var(--vscode-debugTokenExpression-string)]">
        {formattedValue}
        {isLong && !isExpanded && (
          <button
            className="ml-1 text-xs text-[var(--vscode-textLink-foreground)] hover:underline"
            onClick={toggleExpanded}
          >
            (show more)
          </button>
        )}
      </span>
    );
  };

  const inputEntries = Object.entries(input);
  const hasContent = inputEntries.length > 0;
  const filePath = typeof input.file_path === 'string' ? input.file_path : '';

  return (
    <div className="rounded-md overflow-hidden border border-[var(--vscode-panel-border)] bg-[var(--vscode-editor-inactiveSelectionBackground)]">
      {/* Header - Clickable for collapse toggle */}
      <div
        className="flex items-center gap-2 px-3 py-2 bg-[var(--vscode-sideBarSectionHeader-background)] border-b border-[var(--vscode-panel-border)] cursor-pointer hover:bg-[var(--vscode-list-hoverBackground)] transition-colors"
        onClick={toggleCollapsed}
      >
        {/* Collapse/Expand chevron */}
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
          className={`text-[var(--vscode-descriptionForeground)] transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
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
          className="text-[var(--vscode-symbolIcon-methodForeground)]"
        >
          <path d={getToolIcon(toolName)} />
        </svg>
        <span className="font-medium text-sm text-[var(--vscode-symbolIcon-methodForeground)]">
          {toolName}
        </span>

        {/* Metadata badges */}
        <div className="ml-auto flex items-center gap-2">
          {diffData && diffData.filePath && (
            <button
              className="text-xs px-2 py-0.5 rounded border border-[var(--vscode-panel-border)] text-[var(--vscode-textLink-foreground)] hover:bg-[var(--vscode-toolbar-hoverBackground)]"
              onClick={(event) => {
                event.stopPropagation();
                handleOpenDiff();
              }}
              title="Open diff"
            >
              Diff
            </button>
          )}
          {duration !== undefined && (
            <span className="flex items-center gap-1 text-xs text-[var(--vscode-descriptionForeground)] bg-[var(--vscode-badge-background)] px-1.5 py-0.5 rounded">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {formatDuration(duration)}
            </span>
          )}
          {tokens !== undefined && (
            <span className="flex items-center gap-1 text-xs text-[var(--vscode-descriptionForeground)] bg-[var(--vscode-badge-background)] px-1.5 py-0.5 rounded">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              {formatTokens(tokens)}
            </span>
          )}
          {isExecuting && (
            <div className="flex items-center gap-1.5">
              <div className="spinner" />
              <span className="text-xs text-[var(--vscode-descriptionForeground)]">
                Executing...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Input Parameters - Only show when not collapsed */}
      {!isCollapsed && hasContent && (
        <div className="px-3 py-2 font-mono text-xs space-y-1">
          {inputEntries.map(([key, value]) => (
            <div key={key} className="flex gap-2">
              <span className="text-[var(--vscode-debugTokenExpression-name)] shrink-0">
                {key}:
              </span>
              <div className="flex-1 break-all">
                {renderInputValue(key, value)}
              </div>
            </div>
          ))}
          {diffSections.length > 0 && (
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[10px] text-[var(--vscode-descriptionForeground)] uppercase tracking-wide">
                  Diff Preview
                </div>
                {filePath && (
                  <span
                    className="text-[10px] text-[var(--vscode-textLink-foreground)] hover:underline cursor-pointer"
                    onClick={() => handleFileClick(filePath)}
                    title={filePath}
                  >
                    {formatFilePath(filePath)}
                  </span>
                )}
              </div>
              {diffSections.map((section) => {
                const summary = formatDiffStats(section.diff);
                return (
                  <div key={section.id} className="rounded border border-[var(--vscode-panel-border)] overflow-hidden">
                    {section.title && (
                      <div className="px-2 py-1 text-[10px] uppercase tracking-wide text-[var(--vscode-descriptionForeground)] bg-[var(--vscode-editorGroupHeader-tabsBackground)] border-b border-[var(--vscode-panel-border)]">
                        {section.title}
                      </div>
                    )}
                    <div className="grid grid-cols-[auto_auto_auto_1fr] gap-x-2 px-2 py-1 text-[10px] uppercase text-[var(--vscode-descriptionForeground)] bg-[var(--vscode-editorGroupHeader-tabsBackground)]">
                      <span>Old</span>
                      <span>New</span>
                      <span />
                      <span>Content</span>
                    </div>
                    <div className="font-mono text-xs">
                      {section.diff.lines.map((line, index) => {
                        const lineClass = line.type === 'insert'
                          ? 'bg-[var(--vscode-diffEditor-insertedLineBackground)]'
                          : line.type === 'delete'
                            ? 'bg-[var(--vscode-diffEditor-removedLineBackground)]'
                            : '';
                        const prefix = line.type === 'insert' ? '+' : line.type === 'delete' ? '-' : ' ';
                        const oldNumber = line.oldLineNumber ?? '';
                        const newNumber = line.newLineNumber ?? '';
                        return (
                          <div key={index} className={`grid grid-cols-[auto_auto_auto_1fr] gap-x-2 px-2 py-0.5 ${lineClass}`}>
                            <span className="text-[10px] text-[var(--vscode-descriptionForeground)] text-right">
                              {oldNumber}
                            </span>
                            <span className="text-[10px] text-[var(--vscode-descriptionForeground)] text-right">
                              {newNumber}
                            </span>
                            <span className="text-[10px] text-[var(--vscode-descriptionForeground)] text-center">
                              {prefix}
                            </span>
                            <span className="whitespace-pre-wrap break-words">{line.content}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between px-2 py-1 text-[10px] text-[var(--vscode-descriptionForeground)] bg-[var(--vscode-editorGroupHeader-tabsBackground)] border-t border-[var(--vscode-panel-border)]">
                      <span>{summary ? `Summary: ${summary}` : 'Summary: No changes'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Expanded Raw Content - Only show when not collapsed and expanded */}
      {!isCollapsed && isExpanded && hasContent && (
        <div className="border-t border-[var(--vscode-panel-border)]">
          <div className="px-3 py-1 bg-[var(--vscode-sideBarSectionHeader-background)] flex items-center justify-between">
            <span className="text-xs text-[var(--vscode-descriptionForeground)]">
              Raw Input
            </span>
            <button
              className="text-xs text-[var(--vscode-textLink-foreground)] hover:underline"
              onClick={(e) => { e.stopPropagation(); toggleExpanded(); }}
            >
              Collapse
            </button>
          </div>
          <pre className="px-3 py-2 text-xs overflow-x-auto bg-[var(--vscode-textCodeBlock-background)]">
            {JSON.stringify(input, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ToolUseCard;
