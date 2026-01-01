import React, { useState, useCallback } from "react";
import { ToolUseCard, ToolResultCard, TodoDisplay } from "../Tools";
import { extractTodosFromInput } from "../../utils";
import type { Message as MessageType } from "../App";

interface MessageProps {
  message: MessageType;
}

/** Format duration in human readable format */
const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1).replace(/\.0$/, "")}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
};

/** Format tokens in human readable format */
const formatTokens = (tokens: number): string => {
  if (tokens < 1000) return `${tokens}`;
  return `${(tokens / 1000).toFixed(1).replace(/\.0$/, "")}K`;
};

export const Message: React.FC<MessageProps> = ({ message }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const isUser = message.role === "user";
  const isError = message.role === "error";
  const isTool = message.role === "tool";
  const isToolUse = isTool && message.messageType === "tool_use";
  const isToolResult = isTool && message.messageType === "tool_result";

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const getRoleLabel = () => {
    switch (message.role) {
      case "user":
        return "You";
      case "assistant":
        return "Claude";
      case "tool":
        return message.toolName || "Tool";
      case "error":
        return "Error";
      default:
        return "Unknown";
    }
  };

  const getRoleIcon = () => {
    switch (message.role) {
      case "user":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        );
      case "assistant":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 8V4H8" />
            <rect width="16" height="12" x="4" y="8" rx="2" />
            <path d="M2 14h2" />
            <path d="M20 14h2" />
            <path d="M15 13v2" />
            <path d="M9 13v2" />
          </svg>
        );
      case "tool":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        );
      case "error":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getContainerClasses = () => {
    const baseClasses = "rounded-lg p-4";

    if (isUser) {
      return `${baseClasses} bg-[var(--vscode-input-background)] border border-[var(--vscode-input-border)]`;
    }
    if (isError) {
      return `${baseClasses} bg-[var(--vscode-inputValidation-errorBackground)] border border-[var(--vscode-inputValidation-errorBorder)]`;
    }
    if (isTool) {
      return `${baseClasses} bg-[var(--vscode-editor-inactiveSelectionBackground)] border border-[var(--vscode-panel-border)]`;
    }
    return `${baseClasses} bg-[var(--vscode-editor-background)]`;
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  if (isToolUse) {
    const input = message.rawInput || {};
    const todos =
      message.toolName === "TodoWrite" ? extractTodosFromInput(input) : [];
    const isExecuting = message.status
      ? !["completed", "failed", "denied"].includes(message.status)
      : Boolean(message.isStreaming);

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-[var(--vscode-descriptionForeground)]">
          <span>{getRoleLabel()}</span>
          <span>{formatTimestamp(message.timestamp)}</span>
          {message.status && <span>{message.status}</span>}
          {message.duration !== undefined && (
            <span>{formatDuration(message.duration)}</span>
          )}
          {message.tokens !== undefined && (
            <span>{formatTokens(message.tokens)}</span>
          )}
        </div>
        {todos.length > 0 ? (
          <TodoDisplay todos={todos} title="Todo Update" />
        ) : (
          <ToolUseCard
            toolName={message.toolName || "Tool"}
            input={input}
            isExecuting={isExecuting}
            duration={message.duration}
            tokens={message.tokens}
            fileContentBefore={message.fileContentBefore}
            fileContentAfter={message.fileContentAfter}
            startLine={message.startLine}
            startLines={message.startLines}
          />
        )}
      </div>
    );
  }

  if (isToolResult) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-[var(--vscode-descriptionForeground)]">
          <span>{getRoleLabel()}</span>
          <span>{formatTimestamp(message.timestamp)}</span>
          {message.duration !== undefined && (
            <span>{formatDuration(message.duration)}</span>
          )}
          {message.tokens !== undefined && (
            <span>{formatTokens(message.tokens)}</span>
          )}
        </div>
        <ToolResultCard
          content={message.content}
          isError={message.isError}
          toolName={message.toolName}
          duration={message.duration}
          tokens={message.tokens}
        />
      </div>
    );
  }

  // For tool messages, use collapsible layout
  if (isTool) {
    // Extract metadata from message
    const duration = message.duration;
    const tokens = message.tokens;

    return (
      <div className={getContainerClasses()}>
        {/* Clickable header for tool messages */}
        <div
          className="flex items-center gap-2 cursor-pointer hover:bg-[var(--vscode-list-hoverBackground)] -m-4 p-4 rounded-lg transition-colors"
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
            className={`text-[var(--vscode-descriptionForeground)] transition-transform flex-shrink-0 ${isCollapsed ? "" : "rotate-90"}`}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span
            className={`flex items-center justify-center w-6 h-6 rounded-full bg-[var(--vscode-badge-background)] text-[var(--vscode-badge-foreground)]`}
          >
            {getRoleIcon()}
          </span>
          <span className="font-medium text-sm text-[var(--vscode-foreground)]">
            {getRoleLabel()}
          </span>
          <span className="text-xs text-[var(--vscode-descriptionForeground)]">
            {formatTimestamp(message.timestamp)}
          </span>

          {/* Metadata badges */}
          <div className="ml-auto flex items-center gap-2">
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
            {message.isStreaming && (
              <span className="text-xs text-[var(--vscode-descriptionForeground)] animate-pulse">
                streaming...
              </span>
            )}
          </div>
        </div>

        {/* Content - only show when not collapsed */}
        {!isCollapsed && (
          <div className="pl-8 mt-3 text-sm text-[var(--vscode-foreground)] whitespace-pre-wrap break-words">
            <div className="font-mono text-xs bg-[var(--vscode-textCodeBlock-background)] p-2 rounded overflow-x-auto">
              {message.content}
            </div>
          </div>
        )}
      </div>
    );
  }

  // For non-tool messages, use regular layout
  return (
    <div className={getContainerClasses()}>
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`flex items-center justify-center w-6 h-6 rounded-full ${
            isError
              ? "bg-[var(--vscode-errorForeground)] text-white"
              : isUser
                ? "bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)]"
                : "bg-[var(--vscode-badge-background)] text-[var(--vscode-badge-foreground)]"
          }`}
        >
          {getRoleIcon()}
        </span>
        <span className="font-medium text-sm text-[var(--vscode-foreground)]">
          {getRoleLabel()}
        </span>
        <span className="text-xs text-[var(--vscode-descriptionForeground)]">
          {formatTimestamp(message.timestamp)}
        </span>
        {message.isStreaming && (
          <span className="text-xs text-[var(--vscode-descriptionForeground)] animate-pulse">
            streaming...
          </span>
        )}
      </div>

      <div className="pl-8 text-sm text-[var(--vscode-foreground)] whitespace-pre-wrap break-words">
        <MessageContent content={message.content} />
      </div>
    </div>
  );
};

interface MessageContentProps {
  content: string;
}

const MessageContent: React.FC<MessageContentProps> = ({ content }) => {
  // Simple markdown-like rendering for code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const codeContent = part.slice(3, -3);
          const firstNewline = codeContent.indexOf("\n");
          const language =
            firstNewline > 0 ? codeContent.slice(0, firstNewline).trim() : "";
          const code =
            firstNewline > 0
              ? codeContent.slice(firstNewline + 1)
              : codeContent;

          return (
            <div key={index} className="my-2">
              {language && (
                <div className="text-xs text-[var(--vscode-descriptionForeground)] bg-[var(--vscode-textCodeBlock-background)] px-3 py-1 rounded-t border-b border-[var(--vscode-panel-border)]">
                  {language}
                </div>
              )}
              <pre
                className={`font-mono text-xs bg-[var(--vscode-textCodeBlock-background)] p-3 overflow-x-auto ${language ? "rounded-b" : "rounded"}`}
              >
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        // Handle inline code
        return (
          <span key={index}>
            {part.split(/(`[^`]+`)/g).map((segment, i) => {
              if (segment.startsWith("`") && segment.endsWith("`")) {
                return (
                  <code
                    key={i}
                    className="px-1 py-0.5 rounded bg-[var(--vscode-textCodeBlock-background)] font-mono text-xs"
                  >
                    {segment.slice(1, -1)}
                  </code>
                );
              }
              return segment;
            })}
          </span>
        );
      })}
    </>
  );
};

export default Message;
