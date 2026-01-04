import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TodoDisplay } from "../../webview/components/Tools/TodoDisplay";
import type { TodoItem } from "../../webview/components/Tools/TodoDisplay";

describe("TodoDisplay", () => {
    const mockTodos: TodoItem[] = [
        { id: "1", content: "First task", status: "completed" },
        { id: "2", content: "Second task", status: "in_progress" },
        { id: "3", content: "Third task", status: "pending" },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("rendering", () => {
        it("should render the title", () => {
            render(<TodoDisplay todos={mockTodos} title="My Tasks" />);

            expect(screen.getByText("My Tasks")).toBeInTheDocument();
        });

        it("should use default title when not provided", () => {
            render(<TodoDisplay todos={mockTodos} />);

            expect(screen.getByText("Tasks")).toBeInTheDocument();
        });

        it("should not render when todos is empty", () => {
            const { container } = render(<TodoDisplay todos={[]} />);

            expect(container.firstChild).toBeNull();
        });

        it("should render todo items when expanded", () => {
            // Note: defaultCollapsed=true actually shows items (inverted logic)
            render(<TodoDisplay todos={mockTodos} defaultCollapsed={true} />);

            expect(screen.getByText("First task")).toBeInTheDocument();
            expect(screen.getByText("Second task")).toBeInTheDocument();
            expect(screen.getByText("Third task")).toBeInTheDocument();
        });
    });

    describe("status display", () => {
        it("should show completed tasks with check icon", () => {
            render(
                <TodoDisplay
                    todos={[{ content: "Done", status: "completed" }]}
                    defaultCollapsed={true}
                />,
            );

            // Should have green check icon
            const { container } = render(
                <TodoDisplay
                    todos={[{ content: "Done", status: "completed" }]}
                    defaultCollapsed={true}
                />,
            );
            expect(container.querySelector(".text-green-400")).toBeInTheDocument();
        });

        it("should show in-progress tasks with clock icon", () => {
            const { container } = render(
                <TodoDisplay
                    todos={[{ content: "Working", status: "in_progress" }]}
                    defaultCollapsed={true}
                />,
            );

            // Should have blue clock icon
            expect(container.querySelector(".text-blue-400")).toBeInTheDocument();
        });

        it("should show pending tasks with circle icon", () => {
            const { container } = render(
                <TodoDisplay
                    todos={[{ content: "Waiting", status: "pending" }]}
                    defaultCollapsed={true}
                />,
            );

            // Should have white/muted circle icon (text-white/20 class)
            const circleIcon = container.querySelector("svg.lucide-circle");
            expect(circleIcon).toBeInTheDocument();
        });
    });

    describe("priority badges", () => {
        it("should show critical priority badge", () => {
            render(
                <TodoDisplay
                    todos={[{ content: "Urgent", status: "pending", priority: "critical" }]}
                    defaultCollapsed={true}
                />,
            );

            expect(screen.getByText("critical")).toBeInTheDocument();
        });

        it("should show high priority badge", () => {
            render(
                <TodoDisplay
                    todos={[{ content: "Important", status: "pending", priority: "high" }]}
                    defaultCollapsed={true}
                />,
            );

            expect(screen.getByText("high")).toBeInTheDocument();
        });

        it("should show medium priority badge", () => {
            render(
                <TodoDisplay
                    todos={[{ content: "Normal", status: "pending", priority: "medium" }]}
                    defaultCollapsed={true}
                />,
            );

            expect(screen.getByText("medium")).toBeInTheDocument();
        });

        it("should show low priority badge", () => {
            render(
                <TodoDisplay
                    todos={[{ content: "Later", status: "pending", priority: "low" }]}
                    defaultCollapsed={true}
                />,
            );

            expect(screen.getByText("low")).toBeInTheDocument();
        });

        it("should not show badge when no priority", () => {
            render(
                <TodoDisplay
                    todos={[{ content: "No priority", status: "pending" }]}
                    defaultCollapsed={true}
                />,
            );

            expect(screen.queryByText("critical")).not.toBeInTheDocument();
            expect(screen.queryByText("high")).not.toBeInTheDocument();
        });
    });

    describe("stats display", () => {
        it("should show progress stats", () => {
            render(<TodoDisplay todos={mockTodos} />);

            // 1 out of 3 completed - shows as fraction
            expect(screen.getByText(/1\/3/)).toBeInTheDocument();
        });

        it("should show completed count", () => {
            render(<TodoDisplay todos={mockTodos} />);

            // Should show "1 Done" for 1 completed
            expect(screen.getByText(/1.*Done/)).toBeInTheDocument();
        });

        it("should show active count", () => {
            render(<TodoDisplay todos={mockTodos} />);

            // Should show "1 Active" for 1 in_progress
            expect(screen.getByText(/1.*Active/)).toBeInTheDocument();
        });

        it("should show pending count", () => {
            render(<TodoDisplay todos={mockTodos} />);

            // Should show "1 Pending" for 1 pending
            expect(screen.getByText(/1.*Pending/)).toBeInTheDocument();
        });

        it("should show all completed when all done", () => {
            const allCompleted: TodoItem[] = [
                { content: "Done 1", status: "completed" },
                { content: "Done 2", status: "completed" },
            ];
            render(<TodoDisplay todos={allCompleted} />);

            // 2 out of 2 completed
            expect(screen.getByText(/2\/2/)).toBeInTheDocument();
        });

        it("should show zero completed when none done", () => {
            const noneCompleted: TodoItem[] = [
                { content: "Pending 1", status: "pending" },
                { content: "Pending 2", status: "pending" },
            ];
            render(<TodoDisplay todos={noneCompleted} />);

            // 0 out of 2 completed
            expect(screen.getByText(/0\/2/)).toBeInTheDocument();
        });
    });

    describe("collapse/expand", () => {
        it("should start collapsed by default (items hidden)", () => {
            render(<TodoDisplay todos={mockTodos} />);

            // With defaultCollapsed=false (default), items are NOT visible
            // Only header should be visible
            expect(screen.getByText("Tasks")).toBeInTheDocument();
            expect(screen.queryByText("First task")).not.toBeInTheDocument();
        });

        it("should show items when defaultCollapsed is true", () => {
            render(<TodoDisplay todos={mockTodos} defaultCollapsed={true} />);

            // With defaultCollapsed=true, items ARE visible (inverted logic)
            expect(screen.getByText("First task")).toBeInTheDocument();
        });

        it("should toggle visibility on header click", () => {
            render(<TodoDisplay todos={mockTodos} />);

            // Initially items are hidden
            expect(screen.queryByText("First task")).not.toBeInTheDocument();

            // Click to expand
            fireEvent.click(screen.getByText("Tasks"));

            // Now items should be visible
            expect(screen.getByText("First task")).toBeInTheDocument();

            // Click again to collapse
            fireEvent.click(screen.getByText("Tasks"));

            // Items hidden again
            expect(screen.queryByText("First task")).not.toBeInTheDocument();
        });
    });

    describe("edge cases", () => {
        it("should handle undefined todos", () => {
            // @ts-expect-error Testing undefined handling
            const { container } = render(<TodoDisplay todos={undefined} />);

            expect(container.firstChild).toBeNull();
        });

        it("should handle single todo", () => {
            render(
                <TodoDisplay
                    todos={[{ content: "Single", status: "pending" }]}
                    defaultCollapsed={true}
                />,
            );

            expect(screen.getByText("Single")).toBeInTheDocument();
        });

        it("should handle many todos", () => {
            const manyTodos = Array.from({ length: 20 }, (_, i) => ({
                id: String(i),
                content: `Task ${i + 1}`,
                status: "pending" as const,
            }));

            render(<TodoDisplay todos={manyTodos} />);

            // Should render the component with all todos
            expect(screen.getByText("Tasks")).toBeInTheDocument();
            // 0 out of 20 completed - shows as fraction
            expect(screen.getByText(/0\/20/)).toBeInTheDocument();
        });
    });

    describe("in-progress indicator", () => {
        it("should show In Progress label for in_progress tasks", () => {
            render(
                <TodoDisplay
                    todos={[{ content: "Working", status: "in_progress" }]}
                    defaultCollapsed={true}
                />,
            );

            expect(screen.getByText("In Progress")).toBeInTheDocument();
        });
    });

    describe("progress bar", () => {
        it("should render progress bar", () => {
            const { container } = render(<TodoDisplay todos={mockTodos} />);

            // Progress bar container
            const progressBar = container.querySelector(".bg-white\\/10.overflow-hidden");
            expect(progressBar).toBeInTheDocument();
        });
    });
});
