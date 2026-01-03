import React, { useState, useCallback, useMemo } from "react";
import { computeLineDiff, computeContextualDiff } from "../../utils";
import { useVSCode } from "../../hooks/useVSCode";
import {
  ChevronRight,
  Code,
  Terminal,
  FileText,
  Globe,
  Search,
  CheckSquare,
  Edit3,
  Clock,
  Zap,
  FileDiff,
  Files,
  ListChecks,
  BookOpen,
} from "lucide-react";
import { ToolName } from "../../../shared/constants";

export interface ToolInput {
  [key: string]: unknown;
}

export interface ToolUseCardProps {
  toolName: string;
  input: ToolInput;
  isExecuting?: boolean;
  onFilePathClick?: (filePath: string) => void;
  duration?: number;
  tokens?: number;
  defaultCollapsed?: boolean;
  fileContentBefore?: string;
  fileContentAfter?: string;
  startLine?: number;
  startLines?: number[];
}

const getToolIconElement = (toolName: string) => {
  switch (toolName) {
    case ToolName.Read:
      return <FileText className="w-4 h-4" />;
    case ToolName.Write:
      return <Edit3 className="w-4 h-4" />;
    case ToolName.Edit:
      return <Edit3 className="w-4 h-4" />;
    case ToolName.MultiEdit:
      return <Files className="w-4 h-4" />;
    case ToolName.Bash:
      return <Terminal className="w-4 h-4" />;
    case ToolName.Glob:
      return <Search className="w-4 h-4" />;
    case ToolName.Grep:
      return <Search className="w-4 h-4" />;
    case ToolName.Task:
      return <ListChecks className="w-4 h-4" />;
    case ToolName.TodoRead:
      return <CheckSquare className="w-4 h-4" />;
    case ToolName.TodoWrite:
      return <CheckSquare className="w-4 h-4" />;
    case ToolName.WebFetch:
      return <Globe className="w-4 h-4" />;
    case ToolName.WebSearch:
      return <Search className="w-4 h-4" />;
    case ToolName.NotebookRead:
    case ToolName.NotebookEdit:
      return <BookOpen className="w-4 h-4" />;
    default:
      if (toolName.startsWith("mcp__")) {
        return <Zap className="w-4 h-4" />;
      }
      return <Code className="w-4 h-4" />;
  }
};

const formatFilePath = (filePath: string): string => {
  if (!filePath) return "";
  const parts = filePath.split("/");
  return parts[parts.length - 1] ?? filePath;
};

const isFilePath = (key: string, value: unknown): boolean => {
  if (typeof value !== "string") return false;
  const filePathKeys = ["file_path", "filePath", "path", "file"];
  return (
    filePathKeys.includes(key) ||
    (value.startsWith("/") && !value.includes("\n"))
  );
};

const formatValue = (value: unknown, maxLength = 200): string => {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") {
    if (value.length > maxLength) {
      return value.substring(0, maxLength) + "...";
    }
    return value;
  }
  if (typeof value === "object") {
    const str = JSON.stringify(value, null, 2);
    if (str.length > maxLength) {
      return str.substring(0, maxLength) + "...";
    }
    return str;
  }
  return String(value);
};

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
    [onFilePathClick],
  );

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const diffData = useMemo(() => {
    if (!fileContentBefore) return null;

    const filePath = typeof input.file_path === "string" ? input.file_path : "";
    let newContent: string | undefined;

    if (
      toolName === ToolName.Edit &&
      typeof input.old_string === "string" &&
      typeof input.new_string === "string"
    ) {
      newContent = fileContentBefore.replace(
        input.old_string,
        input.new_string,
      );
    } else if (toolName === ToolName.MultiEdit && Array.isArray(input.edits)) {
      newContent = fileContentBefore;
      for (const edit of input.edits as Array<Record<string, unknown>>) {
        if (
          typeof edit.old_string === "string" &&
          typeof edit.new_string === "string"
        ) {
          newContent = newContent.replace(edit.old_string, edit.new_string);
        }
      }
    } else if (
      toolName === ToolName.Write &&
      typeof input.content === "string"
    ) {
      newContent = input.content;
    }

    const finalContent = fileContentAfter ?? newContent;
    if (!finalContent) return null;

    return {
      filePath,
      oldContent: fileContentBefore,
      newContent: finalContent,
    };
  }, [fileContentBefore, fileContentAfter, input, toolName]);

  const diffSections = useMemo(() => {
    const sections: Array<{
      id: string;
      title?: string;
      diff: ReturnType<typeof computeLineDiff>;
    }> = [];
    const filePath = typeof input.file_path === "string" ? input.file_path : "";

    const getStartLine = (needle: string, fallback = 1): number => {
      if (!fileContentBefore || !needle) return fallback;
      const position = fileContentBefore.indexOf(needle);
      if (position === -1) return fallback;
      const textBefore = fileContentBefore.slice(0, position);
      return (textBefore.match(/\n/g) || []).length + 1;
    };

    if (
      toolName === ToolName.Edit &&
      typeof input.old_string === "string" &&
      typeof input.new_string === "string"
    ) {
      const startLineValue = startLine ?? getStartLine(input.old_string, 1);
      const diff = computeLineDiff(input.old_string, input.new_string, {
        startLine: startLineValue,
      });
      sections.push({
        id: `${filePath || toolName}-edit`,
        title: `Line ${startLineValue}`,
        diff,
      });
    } else if (toolName === ToolName.MultiEdit && Array.isArray(input.edits)) {
      const edits = input.edits as Array<Record<string, unknown>>;
      edits.forEach((edit, index) => {
        if (
          typeof edit.old_string !== "string" ||
          typeof edit.new_string !== "string"
        )
          return;
        const fallbackStart =
          startLines?.[index] ?? getStartLine(edit.old_string, 1);
        const diff = computeLineDiff(edit.old_string, edit.new_string, {
          startLine: fallbackStart,
        });
        sections.push({
          id: `${filePath || toolName}-edit-${index}`,
          title: `Edit ${index + 1} (Line ${fallbackStart})`,
          diff,
        });
      });
    } else if (
      toolName === ToolName.Write &&
      typeof input.content === "string"
    ) {
      const oldContent = fileContentBefore ?? "";
      const diff = computeContextualDiff(oldContent, input.content, {
        contextLines: 3,
        startLine: 1,
      });
      sections.push({ id: `${filePath || toolName}-write`, diff });
    }

    return sections;
  }, [fileContentBefore, input, startLine, startLines, toolName]);

  const handleOpenDiff = useCallback(() => {
    if (!diffData || !diffData.filePath) return;
    postMessage({
      type: "openDiff",
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
          className="text-orange-400 hover:text-orange-300 hover:underline cursor-pointer inline-flex items-center gap-1 font-mono break-all"
          onClick={() => handleFileClick(filePath)}
          title={filePath}
        >
          <FileText className="w-3 h-3" />
          {formatFilePath(filePath)}
        </span>
      );
    }

    const formattedValue = formatValue(value);
    const isLong = typeof value === "string" && value.length > 200;

    return (
      <span className="text-white/80 font-mono">
        {formattedValue}
        {isLong && !isExpanded && (
          <button
            className="ml-1 text-xs text-orange-400 hover:underline"
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
  const filePath = typeof input.file_path === "string" ? input.file_path : "";

  return (
    <div className="glass-panel rounded-lg overflow-hidden border border-white/5 bg-black/10">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors group"
        onClick={toggleCollapsed}
      >
        <ChevronRight
          className={`w-4 h-4 text-white/40 transition-transform ${isCollapsed ? "" : "rotate-90"}`}
        />

        <div className="text-orange-400 opacity-80 group-hover:opacity-100 transition-opacity">
          {getToolIconElement(toolName)}
        </div>
        <span className="font-medium text-sm text-white/90">{toolName}</span>

        {/* Metadata badges */}
        <div className="ml-auto flex items-center gap-2">
          {diffData && diffData.filePath && (
            <button
              className="text-xs px-2 py-0.5 rounded border border-white/10 text-orange-400 hover:bg-white/5 flex items-center gap-1 transition-colors"
              onClick={(event) => {
                event.stopPropagation();
                handleOpenDiff();
              }}
              title="Open diff"
            >
              <FileDiff className="w-3 h-3" />
              Diff
            </button>
          )}
          {duration !== undefined && (
            <span className="flex items-center gap-1 text-xs text-white/40 bg-white/5 px-1.5 py-0.5 rounded font-mono">
              <Clock className="w-3 h-3" />
              {formatDuration(duration)}
            </span>
          )}
          {tokens !== undefined && (
            <span className="flex items-center gap-1 text-xs text-white/40 bg-white/5 px-1.5 py-0.5 rounded font-mono">
              <Zap className="w-3 h-3" />
              {formatTokens(tokens)}
            </span>
          )}
          {isExecuting && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-orange-500/10 rounded-full">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" />
              <span className="text-xs text-orange-400 font-medium">
                Executing...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Input Parameters */}
      {!isCollapsed && hasContent && (
        <div className="px-4 py-3 border-t border-white/5 bg-black/20">
          <div className="space-y-1 mb-3 text-xs">
            {inputEntries.map(([key, value]) => (
              <div
                key={key}
                className="flex gap-2 p-1 rounded hover:bg-white/5"
              >
                <span className="text-white/40 font-mono shrink-0 select-none">
                  {key}:
                </span>
                <div className="flex-1 break-all">
                  {renderInputValue(key, value)}
                </div>
              </div>
            ))}
          </div>

          {diffSections.length > 0 && (
            <div className="rounded-lg border border-white/10 overflow-hidden bg-black/40 shadow-inner">
              <div className="flex items-center justify-between px-3 py-2 bg-white/5 border-b border-white/5">
                <div className="text-[10px] text-white/50 uppercase tracking-widest font-semibold flex items-center gap-2">
                  <FileDiff className="w-3 h-3" />
                  Diff Preview
                </div>
                {filePath && (
                  <span
                    className="text-[10px] text-orange-400 hover:underline cursor-pointer font-mono"
                    onClick={() => handleFileClick(filePath)}
                    title={filePath}
                  >
                    {formatFilePath(filePath)}
                  </span>
                )}
              </div>

              <div className="divide-y divide-white/5">
                {diffSections.map((section) => {
                  return (
                    <div key={section.id}>
                      {section.title && (
                        <div className="px-2 py-1 text-[10px] uppercase tracking-wide text-white/30 bg-white/5">
                          {section.title}
                        </div>
                      )}

                      <div className="font-mono text-xs overflow-x-auto">
                        <div className="grid grid-cols-[auto_auto_auto_1fr] min-w-full">
                          {section.diff.lines.map((line, index) => {
                            const isInsert = line.type === "insert";
                            const isDelete = line.type === "delete";
                            const lineClass = isInsert
                              ? "bg-green-500/10 text-green-200"
                              : isDelete
                                ? "bg-red-500/10 text-red-200"
                                : "text-white/50";
                            const prefix = isInsert
                              ? "+"
                              : isDelete
                                ? "-"
                                : " ";

                            return (
                              <div
                                key={index}
                                className={`contents hover:bg-white/5 group`}
                              >
                                <div
                                  className={`px-2 py-0.5 text-right select-none opacity-50 border-r border-white/5 ${lineClass}`}
                                >
                                  {line.oldLineNumber || ""}
                                </div>
                                <div
                                  className={`px-2 py-0.5 text-right select-none opacity-50 border-r border-white/5 ${lineClass}`}
                                >
                                  {line.newLineNumber || ""}
                                </div>
                                <div
                                  className={`px-2 py-0.5 text-center select-none opacity-50 border-r border-white/5 ${lineClass}`}
                                >
                                  {prefix}
                                </div>
                                <div
                                  className={`px-2 py-0.5 whitespace-pre-wrap break-all ${lineClass}`}
                                >
                                  {line.content}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expanded Raw Content */}
      {!isCollapsed && isExpanded && hasContent && (
        <div className="border-t border-white/5 bg-black/40">
          <div className="px-3 py-1 flex items-center justify-between border-b border-white/5">
            <span className="text-[10px] uppercase tracking-wider text-white/30 font-semibold">
              Raw JSON
            </span>
          </div>
          <pre className="p-3 text-xs overflow-x-auto text-white/60 font-mono">
            {JSON.stringify(input, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ToolUseCard;
