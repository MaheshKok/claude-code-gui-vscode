import React, { useState, useCallback } from "react";
import { CheckCircle2, Circle, Clock, ChevronRight, ListTodo } from "lucide-react";

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
    defaultCollapsed?: boolean;
    hideHeader?: boolean;
}

const getStatusIcon = (status: TodoStatus) => {
    switch (status) {
        case "completed":
            return <CheckCircle2 className="w-4 h-4 text-green-400" />;
        case "in_progress":
            return <Clock className="w-4 h-4 text-blue-400 animate-spin-slow" />;
        default:
            return <Circle className="w-4 h-4 text-white/20" />;
    }
};

const getPriorityBadge = (priority?: string) => {
    if (!priority) return null;
    const colors: Record<string, string> = {
        critical: "bg-red-500/20 text-red-200 border-red-500/30",
        high: "bg-orange-500/20 text-orange-200 border-orange-500/30",
        medium: "bg-yellow-500/20 text-yellow-200 border-yellow-500/30",
        low: "bg-blue-500/20 text-blue-200 border-blue-500/30",
    };
    return (
        <span
            className={`px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${colors[priority] || colors.medium}`}
        >
            {priority}
        </span>
    );
};

export const TodoDisplay: React.FC<TodoDisplayProps> = ({
    todos,
    title = "Tasks",
    defaultCollapsed = false,
    hideHeader = false,
}) => {
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
    const toggleCollapsed = useCallback(() => setIsCollapsed((prev) => !prev), []);

    if (!todos || todos.length === 0) return null;

    const stats = {
        total: todos.length,
        completed: todos.filter((t) => t.status === "completed").length,
        inProgress: todos.filter((t) => t.status === "in_progress").length,
        pending: todos.filter((t) => t.status === "pending").length,
    };

    const progressPercent = Math.round((stats.completed / stats.total) * 100);

    // If hideHeader is true, we skip the header and always show the list (assuming parent handles collapse)
    // Note: 'isCollapsed' variable seems to actually mean 'isExpanded' in this component based on usage (showing list when true)
    const showList = hideHeader || isCollapsed;

    return (
        <div
            className={`glass-panel rounded-xl overflow-hidden ${hideHeader ? "" : "border border-white/10 bg-black/20"}`}
        >
            {/* Header */}
            {!hideHeader && (
                <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors border-b border-white/5"
                    onClick={toggleCollapsed}
                >
                    <div className="flex items-center gap-2">
                        <ChevronRight
                            className={`w-4 h-4 text-white/40 transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                        />
                        <ListTodo className="w-4 h-4 text-blue-400" />
                        <span className="font-semibold text-sm text-white/90">{title}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center justify-between px-4 py-2 bg-white/5 text-[10px] text-white/40 font-medium uppercase tracking-wider">
                            <div className="flex gap-4">
                                <span className={stats.completed > 0 ? "text-green-400" : ""}>
                                    {stats.completed} Done
                                </span>
                                <span className={stats.inProgress > 0 ? "text-blue-400" : ""}>
                                    {stats.inProgress} Active
                                </span>
                                <span className={stats.pending > 0 ? "text-orange-400" : ""}>
                                    {stats.pending} Pending
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                            <span className="text-white/60">
                                {stats.completed}/{stats.total}
                            </span>
                        </div>

                        <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                                className="h-full bg-blue-500 transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {!!showList && (
                <div className="max-h-[30vh] overflow-y-auto custom-scrollbar divide-y divide-white/5">
                    {todos.map((todo, index) => {
                        const isCompleted = todo.status === "completed";
                        const isInProgress = todo.status === "in_progress";

                        return (
                            <div
                                key={todo.id || index}
                                className={`flex items-start gap-3 px-4 py-1.5 transition-colors ${
                                    isInProgress ? "bg-blue-500/5" : "hover:bg-white/5"
                                }`}
                            >
                                <div className="pt-0.5 shrink-0">{getStatusIcon(todo.status)}</div>
                                <div className="flex-1 min-w-0 space-y-1">
                                    <p className="text-sm leading-relaxed text-white/85">
                                        {todo.content}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        {getPriorityBadge(todo.priority)}
                                        {isInProgress && (
                                            <span className="text-[10px] text-blue-400 font-medium animate-pulse">
                                                In Progress
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TodoDisplay;
