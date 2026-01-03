import type { TodoItem } from "../components/Tools";

export interface TodoStats {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
}

export function extractTodosFromInput(input: unknown): TodoItem[] {
    if (!input || typeof input !== "object") {
        return [];
    }

    const todosValue = (input as { todos?: unknown }).todos;
    if (!Array.isArray(todosValue)) {
        return [];
    }

    const todos: TodoItem[] = [];

    for (const item of todosValue) {
        if (!item || typeof item !== "object") {
            continue;
        }

        const todo = item as Record<string, unknown>;
        const content = typeof todo.content === "string" ? todo.content.trim() : "";
        if (!content) {
            continue;
        }

        const statusValue = typeof todo.status === "string" ? todo.status : "pending";
        const status =
            statusValue === "completed" || statusValue === "in_progress" ? statusValue : "pending";

        const priority = typeof todo.priority === "string" ? todo.priority : undefined;
        const todoItem: TodoItem = {
            content,
            status,
            ...(priority ? { priority: priority as TodoItem["priority"] } : {}),
            ...(typeof todo.id === "string" ? { id: todo.id } : {}),
        };

        todos.push(todoItem);
    }

    return todos;
}

export function getTodoStats(todos: TodoItem[]): TodoStats {
    return {
        total: todos.length,
        completed: todos.filter((todo) => todo.status === "completed").length,
        inProgress: todos.filter((todo) => todo.status === "in_progress").length,
        pending: todos.filter((todo) => todo.status === "pending").length,
    };
}
