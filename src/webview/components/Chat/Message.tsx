import React, { useState, useCallback } from "react";
import { ToolUseCard, ToolResultCard, TodoDisplay } from "../Tools";
import { extractTodosFromInput } from "../../utils";
import type { Message as MessageType } from "../App";
import {
  MessageRole,
  ToolExecutionStatus,
  ToolName,
} from "../../../shared/constants";
import {
  User,
  Bot,
  Terminal,
  AlertCircle,
  Clock,
  ChevronRight,
  Zap,
  Cpu,
} from "lucide-react";

/** Terminal statuses that indicate tool execution is no longer in progress */
const TERMINAL_STATUSES: ToolExecutionStatus[] = [
  ToolExecutionStatus.Completed,
  ToolExecutionStatus.Failed,
  ToolExecutionStatus.Denied,
];

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

  const isUser = message.role === MessageRole.User;
  const isError = message.role === MessageRole.Error;
  const isTool = message.role === MessageRole.Tool;
  const isToolUse = isTool && message.messageType === "tool_use";
  const isToolResult = isTool && message.messageType === "tool_result";

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const getRoleLabel = () => {
    switch (message.role) {
      case MessageRole.User:
        return "You";
      case MessageRole.Assistant:
        return "Claude";
      case MessageRole.Tool:
        return message.toolName || "Tool";
      case MessageRole.Error:
        return "Error";
      default:
        return "Unknown";
    }
  };

  const getRoleIcon = () => {
    switch (message.role) {
      case MessageRole.User:
        return <User className="w-4 h-4" />;
      case MessageRole.Assistant:
        return <Bot className="w-4 h-4" />;
      case MessageRole.Tool:
        return <Terminal className="w-4 h-4" />;
      case MessageRole.Error:
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getContainerClasses = () => {
    if (isUser) return "message message-user text-white";
    if (isError)
      return "message glass border-red-500/30 bg-red-500/10 text-red-200";
    if (isTool) return "message glass-panel border-white/5";
    return "message message-assistant text-white/90";
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
      message.toolName === ToolName.TodoWrite
        ? extractTodosFromInput(input)
        : [];
    const isExecuting = message.status
      ? !TERMINAL_STATUSES.includes(message.status as ToolExecutionStatus)
      : Boolean(message.isStreaming);

    return (
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-xs text-white/40 px-1">
          <span>{getRoleLabel()}</span>
          <span>{formatTimestamp(message.timestamp)}</span>
          {message.status && (
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold
                ${
                  message.status === ToolExecutionStatus.Completed
                    ? "bg-green-500/10 text-green-400"
                    : message.status === ToolExecutionStatus.Failed
                      ? "bg-red-500/10 text-red-400"
                      : "bg-blue-500/10 text-blue-400"
                }`}
            >
              {message.status}
            </span>
          )}
          {message.duration !== undefined && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {formatDuration(message.duration)}
            </span>
          )}
        </div>
        {todos.length > 0 ? (
          <div className="glass-panel rounded-xl overflow-hidden">
            <TodoDisplay todos={todos} title="Todo Update" />
          </div>
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
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-xs text-white/40 px-1">
          <span>{getRoleLabel()}</span>
          <span>{formatTimestamp(message.timestamp)}</span>
          {message.duration !== undefined && (
            <span>{formatDuration(message.duration)}</span>
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

  // Tool Message (Collapsible)
  if (isTool) {
    const duration = message.duration;
    const tokens = message.tokens;

    return (
      <div className={`${getContainerClasses()} !p-0 overflow-hidden group`}>
        <div
          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
          onClick={toggleCollapsed}
        >
          <ChevronRight
            className={`w-4 h-4 text-white/40 transition-transform ${isCollapsed ? "" : "rotate-90"}`}
          />

          <span
            className={`flex items-center justify-center w-6 h-6 rounded-lg bg-white/5 text-white/70`}
          >
            {getRoleIcon()}
          </span>
          <span className="font-medium text-sm text-white/80">
            {getRoleLabel()}
          </span>
          <span className="text-xs text-white/30 hidden sm:inline">
            {formatTimestamp(message.timestamp)}
          </span>

          <div className="ml-auto flex items-center gap-2">
            {duration !== undefined && (
              <span className="hidden sm:flex items-center gap-1 text-xs text-white/40 bg-white/5 px-2 py-1 rounded-full">
                <Clock className="w-3 h-3" />
                {formatDuration(duration)}
              </span>
            )}
            {tokens !== undefined && (
              <span className="hidden sm:flex items-center gap-1 text-xs text-white/40 bg-white/5 px-2 py-1 rounded-full">
                <Zap className="w-3 h-3" />
                {formatTokens(tokens)}
              </span>
            )}
            {message.isStreaming && (
              <span className="text-xs text-orange-400 animate-pulse font-medium">
                streaming...
              </span>
            )}
          </div>
        </div>

        {!isCollapsed && (
          <div className="px-4 pb-4 pt-2 border-t border-white/5 bg-black/10">
            <div className="font-mono text-xs text-white/70 whitespace-pre-wrap break-words bg-black/30 p-3 rounded-lg border border-white/5">
              {message.content}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Regular Message (User/Assistant)
  return (
    <div className={`${getContainerClasses()} ${isUser ? "ml-auto" : ""}`}>
      <div className="flex items-center gap-3 mb-3 border-b border-white/5 pb-2">
        <span
          className={`flex items-center justify-center w-8 h-8 rounded-lg shadow-inner ${
            isError
              ? "bg-red-500/20 text-red-200"
              : isUser
                ? "bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-orange-500/20"
                : "bg-zinc-700 text-zinc-100"
          }`}
        >
          {getRoleIcon()}
        </span>

        <div className="flex flex-col">
          <span className="font-bold text-sm tracking-wide">
            {getRoleLabel()}
          </span>
          <span className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>

        {message.isStreaming && (
          <div className="ml-auto flex items-center gap-2 px-2 py-1 bg-orange-500/10 rounded-full border border-orange-500/20">
            <div className="flex gap-1">
              <span
                className="w-1 h-1 bg-orange-500 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-1 h-1 bg-orange-500 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-1 h-1 bg-orange-500 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
            <span className="text-[10px] text-orange-400 font-medium uppercase">
              Thinking
            </span>
          </div>
        )}
      </div>

      <div className="text-sm leading-relaxed message-content">
        <MessageContent content={message.content} />
      </div>
    </div>
  );
};

interface MessageContentProps {
  content: string;
}

const MessageContent: React.FC<MessageContentProps> = ({ content }) => {
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
            <div
              key={index}
              className="my-4 rounded-xl overflow-hidden border border-white/10 shadow-lg group"
            >
              {language && (
                <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                  <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
                    {language}
                  </span>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
                  </div>
                </div>
              )}
              <div className="relative">
                <pre className="font-mono text-xs bg-black/40 p-4 overflow-x-auto text-white/80 leading-relaxed custom-scrollbar">
                  <code>{code}</code>
                </pre>
                {/* Copy button could go here */}
              </div>
            </div>
          );
        }

        return (
          <span key={index}>
            {part.split(/(`[^`]+`)/g).map((segment, i) => {
              if (segment.startsWith("`") && segment.endsWith("`")) {
                return (
                  <code
                    key={i}
                    className="px-1.5 py-0.5 mx-0.5 rounded-md bg-white/10 text-orange-200 font-mono text-xs border border-white/5"
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
