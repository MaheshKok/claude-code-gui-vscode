import React, { useState, useCallback } from "react";
import {
  ChevronRight,
  Copy,
  Check,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react";

export interface ToolResultCardProps {
  content: string;
  isError?: boolean;
  toolName?: string;
  maxLines?: number;
  onCopy?: (content: string) => void;
  duration?: number;
  tokens?: number;
  defaultCollapsed?: boolean;
}

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1).replace(/\.0$/, "")}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
};

const formatTokens = (tokens: number): string => {
  if (tokens < 1000) return `${tokens}`;
  return `${(tokens / 1000).toFixed(1).replace(/\.0$/, "")}K`;
};

const truncateContent = (
  content: string,
  maxLines: number,
): { truncated: string; isTruncated: boolean; hiddenCount: number } => {
  const lines = content.split("\n");
  if (lines.length <= maxLines) {
    return { truncated: content, isTruncated: false, hiddenCount: 0 };
  }
  const truncated = lines.slice(0, maxLines).join("\n");
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
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  const { truncated, isTruncated, hiddenCount } = truncateContent(
    content,
    maxLines,
  );

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopyState("copied");
      if (onCopy) onCopy(content);
      setTimeout(() => setCopyState("idle"), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [content, onCopy]);

  const displayContent = isExpanded ? content : truncated;

  return (
    <div
      className={`glass-panel rounded-lg overflow-hidden border ${isError ? "border-red-500/20" : "border-white/5"}`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors ${
          isError
            ? "bg-red-500/10 hover:bg-red-500/20"
            : "bg-white/5 hover:bg-white/10"
        }`}
        onClick={toggleCollapsed}
      >
        <div className="flex items-center gap-2">
          <ChevronRight
            className={`w-4 h-4 text-white/40 transition-transform ${isCollapsed ? "" : "rotate-90"}`}
          />

          <div className={isError ? "text-red-400" : "text-green-400"}>
            {isError ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
          </div>

          <span
            className={`font-medium text-sm ${isError ? "text-red-200" : "text-white/80"}`}
          >
            {isError ? "Error" : "Result"}
            {toolName && ` - ${toolName}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {duration !== undefined && (
            <span className="flex items-center gap-1 text-xs text-white/40 bg-white/5 px-1.5 py-0.5 rounded">
              <Clock className="w-3 h-3" />
              {formatDuration(duration)}
            </span>
          )}
          {tokens !== undefined && (
            <span className="hidden sm:flex items-center gap-1 text-xs text-white/40 bg-white/5 px-1.5 py-0.5 rounded">
              <Zap className="w-3 h-3" />
              {formatTokens(tokens)}
            </span>
          )}

          <button
            className="flex items-center gap-1.5 px-2 py-1 rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors text-xs"
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            title="Copy to clipboard"
          >
            {copyState === "copied" ? (
              <>
                <Check className="w-3 h-3 text-green-400" />
                <span className="text-green-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="px-3 py-2 bg-black/20 text-xs font-mono">
          <pre
            className={`whitespace-pre-wrap break-words ${isError ? "text-red-200" : "text-white/70"}`}
          >
            {displayContent}
          </pre>

          {isTruncated && (
            <button
              className="mt-2 flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-orange-400 hover:text-orange-300 hover:underline pt-2 border-t border-white/5 w-full"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded();
              }}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Show less
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
      )}
    </div>
  );
};

export default ToolResultCard;
