import type { TodoItem } from '../components/Tools';

export interface TodoStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
}

export function extractTodosFromInput(input: unknown): TodoItem[] {
  if (!input || typeof input !== 'object') {
    return [];
  }

  const todosValue = (input as { todos?: unknown }).todos;
  if (!Array.isArray(todosValue)) {
    return [];
  }

  return todosValue
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const todo = item as Record<string, unknown>;
      const content = typeof todo.content === 'string' ? todo.content.trim() : '';
      if (!content) {
        return null;
      }

      const statusValue = typeof todo.status === 'string' ? todo.status : 'pending';
      const status = statusValue === 'completed' || statusValue === 'in_progress'
        ? statusValue
        : 'pending';

      const priority = typeof todo.priority === 'string' ? todo.priority : undefined;

      return {
        id: typeof todo.id === 'string' ? todo.id : undefined,
        content,
        status,
        priority: priority as TodoItem['priority'],
      };
    })
    .filter((todo): todo is TodoItem => Boolean(todo));
}

export function getTodoStats(todos: TodoItem[]): TodoStats {
  return {
    total: todos.length,
    completed: todos.filter((todo) => todo.status === 'completed').length,
    inProgress: todos.filter((todo) => todo.status === 'in_progress').length,
    pending: todos.filter((todo) => todo.status === 'pending').length,
  };
}
