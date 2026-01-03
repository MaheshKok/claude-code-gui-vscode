import { describe, it, expect } from "vitest";
import { extractTodosFromInput, getTodoStats } from "../../webview/utils/todos";

describe("todos utils", () => {
    it("extracts valid todos from tool input", () => {
        const todos = extractTodosFromInput({
            todos: [
                {
                    id: "1",
                    content: "  Ship feature  ",
                    status: "completed",
                    priority: "high",
                },
                { content: "Invalid", status: "unknown" },
                { content: "" },
            ],
        });

        expect(todos).toHaveLength(2);
        expect(todos[0]).toMatchObject({
            id: "1",
            content: "Ship feature",
            status: "completed",
            priority: "high",
        });
        expect(todos[1]).toMatchObject({
            content: "Invalid",
            status: "pending",
        });
    });

    it("returns empty list for invalid input", () => {
        expect(extractTodosFromInput(null)).toEqual([]);
        expect(extractTodosFromInput({ todos: "nope" })).toEqual([]);
    });

    it("computes todo stats", () => {
        const stats = getTodoStats([
            { content: "One", status: "completed" },
            { content: "Two", status: "pending" },
            { content: "Three", status: "in_progress" },
        ]);

        expect(stats).toEqual({
            total: 3,
            completed: 1,
            inProgress: 1,
            pending: 1,
        });
    });
});
