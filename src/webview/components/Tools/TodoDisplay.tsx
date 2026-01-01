import React, { useState, useCallback } from "react";

export type TodoStatus = "pending" | "in_progress" | "completed";

export interface TodoItem {
  id?: string;
  content: string;
  status: TodoStatus;
  priority?: "low" | "medium" | "high" | "critical";
}

export interface TodoDisplayProps {
  todos: TodoItem[];
  title?: string;
  /** Whether to start collapsed (default: false) */
  defaultCollapsed?: boolean;
}

const getStatusIcon = (status: TodoStatus): React.ReactNode => {
  switch (status) {
    case "completed":
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
          className="text-[var(--vscode-terminal-ansiGreen)]"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    case "in_progress":
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
          className="text-[var(--vscode-terminal-ansiYellow)] animate-spin"
          style={{ animationDuration: "2s" }}
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      );
    case "pending":
    default:
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
          className="text-[var(--vscode-descriptionForeground)]"
        >
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
};

const getStatusLabel = (status: TodoStatus): string => {
  switch (status) {
    case "completed":
      return "Completed";
    case "in_progress":
      return "In Progress";
    case "pending":
    default:
      return "Pending";
  }
};

const getStatusClasses = (status: TodoStatus): string => {
  switch (status) {
    case "completed":
      return "bg-[var(--vscode-terminal-ansiGreen)]/10 border-[var(--vscode-terminal-ansiGreen)]/30";
    case "in_progress":
      return "bg-[var(--vscode-terminal-ansiYellow)]/10 border-[var(--vscode-terminal-ansiYellow)]/30";
    case "pending":
    default:
      return "bg-[var(--vscode-editor-inactiveSelectionBackground)] border-[var(--vscode-panel-border)]";
  }
};

const getPriorityBadge = (priority?: string): React.ReactNode => {
  if (!priority) return null;

  const colors: Record<string, string> = {
    critical:
      "bg-[var(--vscode-errorForeground)]/20 text-[var(--vscode-errorForeground)] border-[var(--vscode-errorForeground)]/30",
    high: "bg-[var(--vscode-terminal-ansiRed)]/20 text-[var(--vscode-terminal-ansiRed)] border-[var(--vscode-terminal-ansiRed)]/30",
    medium:
      "bg-[var(--vscode-terminal-ansiYellow)]/20 text-[var(--vscode-terminal-ansiYellow)] border-[var(--vscode-terminal-ansiYellow)]/30",
    low: "bg-[var(--vscode-terminal-ansiBlue)]/20 text-[var(--vscode-terminal-ansiBlue)] border-[var(--vscode-terminal-ansiBlue)]/30",
  };

  const colorClass = colors[priority] || colors.medium;

  return (
    <span
      className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${colorClass}`}
    >
      {priority.toUpperCase()}
    </span>
  );
};

const getTextClasses = (status: TodoStatus): string => {
  switch (status) {
    case "completed":
      return "text-[var(--vscode-descriptionForeground)]";
    case "in_progress":
      return "text-[var(--vscode-foreground)] font-medium";
    case "pending":
    default:
      return "text-[var(--vscode-foreground)]";
  }
};

export const TodoDisplay: React.FC<TodoDisplayProps> = ({
  todos,
  title = "Tasks",
  defaultCollapsed = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  if (!todos || todos.length === 0) {
    return null;
  }

  const stats = {
    total: todos.length,
    completed: todos.filter((t) => t.status === "completed").length,
    inProgress: todos.filter((t) => t.status === "in_progress").length,
    pending: todos.filter((t) => t.status === "pending").length,
  };

  const progressPercent = Math.round((stats.completed / stats.total) * 100);

  return (
    <div className="rounded-md overflow-hidden border border-[var(--vscode-panel-border)] bg-[var(--vscode-editor-background)]">
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-[var(--vscode-sideBarSectionHeader-background)] border-b border-[var(--vscode-panel-border)] cursor-pointer hover:bg-[var(--vscode-list-hoverBackground)] transition-colors"
        onClick={toggleCollapsed}
      >
        <div className="flex items-center gap-2">
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
            className={`text-[var(--vscode-descriptionForeground)] transition-transform ${isCollapsed ? "" : "rotate-90"}`}
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
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          <span className="font-medium text-sm text-[var(--vscode-foreground)]">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-[var(--vscode-descriptionForeground)]">
          <span>
            {stats.completed}/{stats.total}
          </span>
          <span className="text-[var(--vscode-terminal-ansiGreen)]">
            {progressPercent}%
          </span>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Progress Bar */}
          <div className="h-1 bg-[var(--vscode-progressBar-background)]/20">
            <div
              className="h-full bg-[var(--vscode-terminal-ansiGreen)] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Todo List */}
          <div className="divide-y divide-[var(--vscode-panel-border)]">
            {todos.map((todo, index) => (
              <div
                key={todo.id || index}
                className={`flex items-start gap-3 px-3 py-2 ${getStatusClasses(todo.status)} border-l-2`}
              >
                <div className="pt-0.5 shrink-0">
                  {getStatusIcon(todo.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm ${getTextClasses(todo.status)}`}>
                      {todo.content}
                    </span>
                    {getPriorityBadge(todo.priority)}
                  </div>
                  <span className="text-[10px] text-[var(--vscode-descriptionForeground)]">
                    {getStatusLabel(todo.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Stats */}
          <div className="flex items-center gap-4 px-3 py-2 bg-[var(--vscode-sideBarSectionHeader-background)] border-t border-[var(--vscode-panel-border)] text-xs text-[var(--vscode-descriptionForeground)]">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[var(--vscode-terminal-ansiGreen)]" />
              <span>{stats.completed} completed</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[var(--vscode-terminal-ansiYellow)]" />
              <span>{stats.inProgress} in progress</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[var(--vscode-descriptionForeground)]" />
              <span>{stats.pending} pending</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TodoDisplay;
