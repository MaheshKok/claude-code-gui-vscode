import React, { useState, useCallback } from 'react';

export interface ToolResultCardProps {
  content: string;
  isError?: boolean;
  toolName?: string;
  maxLines?: number;
  onCopy?: (content: string) => void;
  /** Duration in milliseconds */
  duration?: number;
  /** Token count for this tool result */
  tokens?: number;
  /** Whether to start collapsed (default: true) */
  defaultCollapsed?: boolean;
}

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

const truncateContent = (content: string, maxLines: number): { truncated: string; isTruncated: boolean; hiddenCount: number } => {
  const lines = content.split('\n');
  if (lines.length <= maxLines) {
    return { truncated: content, isTruncated: false, hiddenCount: 0 };
  }
  const truncated = lines.slice(0, maxLines).join('\n');
  return {
    truncated,
    isTruncated: true,
    hiddenCount: lines.length - maxLines,
  };
};

export const ToolResultCard: React.FC<ToolResultCardProps> = ({
  content,
  isError = false,
  toolName,
  maxLines = 10,
  onCopy,
  duration,
  tokens,
  defaultCollapsed = true,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');

  const { truncated, isTruncated, hiddenCount } = truncateContent(content, maxLines);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopyState('copied');
      if (onCopy) {
        onCopy(content);
      }
      setTimeout(() => setCopyState('idle'), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [content, onCopy]);

  const displayContent = isExpanded ? content : truncated;

  return (
    <div
      className={`rounded-md overflow-hidden border ${
        isError
          ? 'border-[var(--vscode-inputValidation-errorBorder)] bg-[var(--vscode-inputValidation-errorBackground)]'
          : 'border-[var(--vscode-panel-border)] bg-[var(--vscode-textCodeBlock-background)]'
      }`}
    >
      {/* Header - Clickable for collapse toggle */}
      <div
        className={`flex items-center justify-between px-3 py-1.5 text-xs cursor-pointer hover:bg-[var(--vscode-list-hoverBackground)] transition-colors ${
          isError
            ? 'bg-[var(--vscode-inputValidation-errorBackground)]'
            : 'bg-[var(--vscode-editorGroupHeader-tabsBackground)]'
        } border-b border-[var(--vscode-panel-border)]`}
        onClick={toggleCollapsed}
      >
        <div className="flex items-center gap-2">
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
          {isError ? (
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
              className="text-[var(--vscode-errorForeground)]"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          ) : (
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
              className="text-[var(--vscode-terminal-ansiGreen)]"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          <span
            className={`font-medium ${
              isError ? 'text-[var(--vscode-errorForeground)]' : 'text-[var(--vscode-descriptionForeground)]'
            }`}
          >
            {isError ? 'Error' : 'Result'}
            {toolName && ` - ${toolName}`}
          </span>
        </div>

        {/* Metadata badges and actions */}
        <div className="flex items-center gap-2">
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
          <button
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[var(--vscode-descriptionForeground)] hover:bg-[var(--vscode-toolbar-hoverBackground)] transition-colors"
            onClick={(e) => { e.stopPropagation(); handleCopy(); }}
            title="Copy to clipboard"
          >
            {copyState === 'copied' ? (
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
                  className="text-[var(--vscode-terminal-ansiGreen)]"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-[var(--vscode-terminal-ansiGreen)]">Copied</span>
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
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content - Only show when not collapsed */}
      {!isCollapsed && (
        <div className="px-3 py-2">
          <pre
            className={`text-xs font-mono whitespace-pre-wrap break-words ${
              isError ? 'text-[var(--vscode-errorForeground)]' : 'text-[var(--vscode-foreground)]'
            }`}
          >
            {displayContent}
          </pre>

          {/* Expand/Collapse Button for long content */}
          {isTruncated && (
            <div className="mt-2 pt-2 border-t border-[var(--vscode-panel-border)]">
              <button
                className="flex items-center gap-1 text-xs text-[var(--vscode-textLink-foreground)] hover:underline"
                onClick={(e) => { e.stopPropagation(); toggleExpanded(); }}
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
      )}
    </div>
  );
};

export default ToolResultCard;
