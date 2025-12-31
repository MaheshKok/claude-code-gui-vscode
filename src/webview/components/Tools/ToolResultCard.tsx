import React, { useState, useCallback } from 'react';

export interface ToolResultCardProps {
  content: string;
  isError?: boolean;
  toolName?: string;
  maxLines?: number;
  onCopy?: (content: string) => void;
}

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
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');

  const { truncated, isTruncated, hiddenCount } = truncateContent(content, maxLines);

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
      {/* Header */}
      <div
        className={`flex items-center justify-between px-3 py-1.5 text-xs ${
          isError
            ? 'bg-[var(--vscode-inputValidation-errorBackground)]'
            : 'bg-[var(--vscode-editorGroupHeader-tabsBackground)]'
        } border-b border-[var(--vscode-panel-border)]`}
      >
        <div className="flex items-center gap-2">
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

        <button
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[var(--vscode-descriptionForeground)] hover:bg-[var(--vscode-toolbar-hoverBackground)] transition-colors"
          onClick={handleCopy}
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

      {/* Content */}
      <div className="px-3 py-2">
        <pre
          className={`text-xs font-mono whitespace-pre-wrap break-words ${
            isError ? 'text-[var(--vscode-errorForeground)]' : 'text-[var(--vscode-foreground)]'
          }`}
        >
          {displayContent}
        </pre>

        {/* Expand/Collapse Button */}
        {isTruncated && (
          <div className="mt-2 pt-2 border-t border-[var(--vscode-panel-border)]">
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
    </div>
  );
};

export default ToolResultCard;
