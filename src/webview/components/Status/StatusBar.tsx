import React, { useEffect, useMemo, useState } from 'react';
import { formatCost, formatDuration, formatTokenCount } from '../../utils';

interface StatusBarProps {
  isConnected: boolean;
  isProcessing: boolean;
  onStop: () => void;
  totalTokens: number;
  requestCount: number;
  sessionCostUsd: number;
  lastDurationMs: number | null;
  requestStartTime: number | null;
  subscriptionType: string | null;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  isConnected,
  isProcessing,
  onStop,
  totalTokens,
  requestCount,
  sessionCostUsd,
  lastDurationMs,
  requestStartTime,
  subscriptionType,
}) => {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!isProcessing || !requestStartTime) {
      setElapsedMs(0);
      return;
    }

    const tick = () => {
      setElapsedMs(Date.now() - requestStartTime);
    };

    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [isProcessing, requestStartTime]);

  const statusText = useMemo(() => {
    const segments: string[] = [];
    const tokenLabel = formatTokenCount(totalTokens, {
      includeSuffix: true,
      abbreviated: false,
    });

    segments.push(isProcessing ? 'Processing' : 'Ready');
    segments.push(tokenLabel);

    if (isProcessing && requestStartTime) {
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      segments.push(`${elapsedSeconds}s`);
    } else if (lastDurationMs !== null && lastDurationMs > 0) {
      segments.push(`Last: ${formatDuration(lastDurationMs)}`);
    }

    if (!isProcessing && requestCount > 0) {
      segments.push(`${requestCount} requests`);
    }

    if (!isProcessing) {
      if (subscriptionType) {
        const planName = subscriptionType.charAt(0).toUpperCase() + subscriptionType.slice(1);
        segments.push(`${planName} Plan`);
      } else {
        segments.push(formatCost(sessionCostUsd, { showFreeForZero: false }));
      }
    }

    return segments.join(' | ');
  }, [
    elapsedMs,
    isProcessing,
    lastDurationMs,
    requestCount,
    requestStartTime,
    sessionCostUsd,
    subscriptionType,
    totalTokens,
  ]);

  return (
    <footer className="flex items-center justify-between px-4 py-2 border-t border-[var(--vscode-panel-border)] bg-[var(--vscode-statusBar-background)] text-[var(--vscode-statusBar-foreground)] text-xs">
      <div className="flex items-center gap-3">
        {/* Connection Status */}
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected
                ? 'bg-green-500'
                : 'bg-[var(--vscode-statusBarItem-errorBackground)]'
            }`}
          />
          <span>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        <div className="w-px h-3 bg-[var(--vscode-statusBar-foreground)] opacity-30" />
        <div className="text-[var(--vscode-descriptionForeground)]">
          {statusText}
        </div>

        {/* Processing Status */}
        {isProcessing && (
          <>
            <div className="w-px h-3 bg-[var(--vscode-statusBar-foreground)] opacity-30" />
            <div className="flex items-center gap-1.5">
              <svg
                className="animate-spin"
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
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isProcessing && (
          <button
            onClick={onStop}
            className="flex items-center gap-1 px-2 py-1 rounded text-[var(--vscode-statusBarItem-errorForeground)] bg-[var(--vscode-statusBarItem-errorBackground)] hover:opacity-80 transition-opacity"
            title="Stop processing (Escape)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="none"
            >
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
            <span>Stop</span>
          </button>
        )}

        {/* Keyboard shortcut hint */}
        <div className="flex items-center gap-1 opacity-60">
          <kbd className="px-1.5 py-0.5 rounded bg-[var(--vscode-keybindingLabel-background)] border border-[var(--vscode-keybindingLabel-border)] text-[10px]">
            Ctrl
          </kbd>
          <span>+</span>
          <kbd className="px-1.5 py-0.5 rounded bg-[var(--vscode-keybindingLabel-background)] border border-[var(--vscode-keybindingLabel-border)] text-[10px]">
            Enter
          </kbd>
          <span className="ml-1">Send</span>
        </div>
      </div>
    </footer>
  );
};

export default StatusBar;
