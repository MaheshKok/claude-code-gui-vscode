import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToolUseCard } from "../../webview/components/Tools/ToolUseCard";
import { mockVscodeApi } from "../../tests/setup";

// Mock useVSCode hook
const mockPostMessage = vi.fn();
vi.mock("../../webview/hooks/useVSCode", () => ({
    useVSCode: () => ({
        postMessage: mockPostMessage,
    }),
}));

describe("ToolUseCard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("rendering", () => {
        it("should render tool name", () => {
            render(
                <ToolUseCard
                    toolName="Read"
                    input={{ file_path: "/test.ts" }}
                    defaultCollapsed={false}
                />,
            );

            expect(screen.getByText("Read")).toBeInTheDocument();
        });

        it("should be collapsed by default", () => {
            render(
                <ToolUseCard
                    toolName="Read"
                    input={{ file_path: "/test.ts" }}
                    defaultCollapsed={true}
                />,
            );

            // file_path should not be visible when collapsed
            expect(screen.queryByText("file_path:")).not.toBeInTheDocument();
        });

        it("should show input parameters when expanded", () => {
            render(
                <ToolUseCard
                    toolName="Read"
                    input={{ file_path: "/test.ts" }}
                    defaultCollapsed={false}
                />,
            );

            expect(screen.getByText("file_path:")).toBeInTheDocument();
        });
    });

    describe("expand/collapse", () => {
        it("should expand when header clicked", () => {
            render(
                <ToolUseCard
                    toolName="Read"
                    input={{ file_path: "/test.ts" }}
                    defaultCollapsed={true}
                />,
            );

            fireEvent.click(screen.getByText("Read"));

            expect(screen.getByText("file_path:")).toBeInTheDocument();
        });

        it("should collapse when header clicked again", () => {
            render(
                <ToolUseCard
                    toolName="Read"
                    input={{ file_path: "/test.ts" }}
                    defaultCollapsed={false}
                />,
            );

            fireEvent.click(screen.getByText("Read"));

            expect(screen.queryByText("file_path:")).not.toBeInTheDocument();
        });
    });

    describe("diff preview for Edit tool", () => {
        it("renders diff preview for Edit tool", () => {
            render(
                <ToolUseCard
                    toolName="Edit"
                    input={{
                        file_path: "/tmp/test.txt",
                        old_string: "foo",
                        new_string: "bar",
                    }}
                    fileContentBefore={"foo\nbaz"}
                    defaultCollapsed={false}
                />,
            );

            expect(screen.getByText("Diff Preview")).toBeInTheDocument();
            expect(screen.getByText("+")).toBeInTheDocument();
            expect(screen.getByText("-")).toBeInTheDocument();
            expect(screen.getAllByText("foo").length).toBeGreaterThan(0);
            expect(screen.getAllByText("bar").length).toBeGreaterThan(0);
        });

        it("sends openDiff message when Diff button is clicked", () => {
            render(
                <ToolUseCard
                    toolName="Edit"
                    input={{
                        file_path: "/tmp/test.txt",
                        old_string: "foo",
                        new_string: "bar",
                    }}
                    fileContentBefore={"foo\nbaz"}
                    defaultCollapsed={true}
                />,
            );

            const diffButton = screen.getByRole("button", { name: "Diff" });
            fireEvent.click(diffButton);

            expect(mockPostMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: "openDiff",
                    filePath: "/tmp/test.txt",
                }),
            );
        });
    });

    describe("MultiEdit tool", () => {
        it("should render diff preview for MultiEdit tool", () => {
            render(
                <ToolUseCard
                    toolName="MultiEdit"
                    input={{
                        file_path: "/test.ts",
                        edits: [
                            { old_string: "const a = 1", new_string: "const a = 2" },
                            { old_string: "const b = 3", new_string: "const b = 4" },
                        ],
                    }}
                    fileContentBefore="const a = 1\nconst b = 3"
                    defaultCollapsed={false}
                />,
            );

            expect(screen.getByText("Diff Preview")).toBeInTheDocument();
            expect(screen.getByText(/Edit 1/)).toBeInTheDocument();
            expect(screen.getByText(/Edit 2/)).toBeInTheDocument();
        });
    });

    describe("Write tool", () => {
        it("should render diff preview for Write tool", () => {
            render(
                <ToolUseCard
                    toolName="Write"
                    input={{
                        file_path: "/new-file.ts",
                        content: "const newContent = true;",
                    }}
                    fileContentBefore=""
                    defaultCollapsed={false}
                />,
            );

            expect(screen.getByText("Diff Preview")).toBeInTheDocument();
        });
    });

    describe("executing indicator", () => {
        it("should show executing indicator when isExecuting is true", () => {
            render(
                <ToolUseCard
                    toolName="Bash"
                    input={{ command: "npm test" }}
                    isExecuting={true}
                    defaultCollapsed={false}
                />,
            );

            expect(screen.getByText("Executing...")).toBeInTheDocument();
        });

        it("should not show executing indicator when isExecuting is false", () => {
            render(
                <ToolUseCard
                    toolName="Bash"
                    input={{ command: "npm test" }}
                    isExecuting={false}
                    defaultCollapsed={false}
                />,
            );

            expect(screen.queryByText("Executing...")).not.toBeInTheDocument();
        });
    });

    describe("duration and tokens badges", () => {
        it("should display duration when provided", () => {
            const { container } = render(
                <ToolUseCard
                    toolName="Read"
                    input={{ file_path: "/test.ts" }}
                    duration={1500}
                    defaultCollapsed={false}
                />,
            );

            // Check for clock icon which indicates duration is shown
            const clockIcon = container.querySelector(".lucide-clock");
            expect(clockIcon).toBeInTheDocument();
            // formatDuration shows "1s" for 1500ms (abbreviated)
            expect(screen.getByText(/\d+s/)).toBeInTheDocument();
        });

        it("should display tokens when provided", () => {
            render(
                <ToolUseCard
                    toolName="Read"
                    input={{ file_path: "/test.ts" }}
                    tokens={150}
                    defaultCollapsed={false}
                />,
            );

            expect(screen.getByText(/150/)).toBeInTheDocument();
        });
    });

    describe("MCP tool origin", () => {
        it("should show MCP label for MCP tools", () => {
            render(
                <ToolUseCard
                    toolName="mcp__server__tool"
                    input={{ param: "value" }}
                    defaultCollapsed={false}
                />,
            );

            expect(screen.getByText("MCP")).toBeInTheDocument();
        });

        it("should show server name for MCP tools", () => {
            render(
                <ToolUseCard
                    toolName="mcp__myserver__mytool"
                    input={{ param: "value" }}
                    defaultCollapsed={false}
                />,
            );

            // Server and tool names are shown combined as "myserver / mytool"
            const matches = screen.getAllByText(/myserver/);
            expect(matches.length).toBeGreaterThan(0);
        });
    });

    describe("file path handling", () => {
        it("should show formatted file path", () => {
            render(
                <ToolUseCard
                    toolName="Read"
                    input={{ file_path: "/path/to/myfile.ts" }}
                    defaultCollapsed={false}
                />,
            );

            expect(screen.getByText("myfile.ts")).toBeInTheDocument();
        });

        it("should call onFilePathClick when file path is clicked", () => {
            const onFilePathClick = vi.fn();
            render(
                <ToolUseCard
                    toolName="Read"
                    input={{ file_path: "/path/to/myfile.ts" }}
                    onFilePathClick={onFilePathClick}
                    defaultCollapsed={false}
                />,
            );

            fireEvent.click(screen.getByText("myfile.ts"));

            expect(onFilePathClick).toHaveBeenCalledWith("/path/to/myfile.ts");
        });
    });

    describe("long content handling", () => {
        it("should truncate long values", () => {
            const longValue = "a".repeat(300);
            render(
                <ToolUseCard
                    toolName="Write"
                    input={{ content: longValue }}
                    defaultCollapsed={false}
                />,
            );

            expect(screen.getByText(/\.\.\./)).toBeInTheDocument();
        });

        it("should show 'show more' button for long values", () => {
            const longValue = "a".repeat(300);
            render(
                <ToolUseCard
                    toolName="Write"
                    input={{ content: longValue }}
                    defaultCollapsed={false}
                />,
            );

            expect(screen.getByText("(show more)")).toBeInTheDocument();
        });

        it("should expand long value when show more is clicked", () => {
            const longValue = "a".repeat(300);
            render(
                <ToolUseCard
                    toolName="Write"
                    input={{ content: longValue }}
                    defaultCollapsed={false}
                />,
            );

            fireEvent.click(screen.getByText("(show more)"));

            // After clicking, "Raw JSON" section should appear
            expect(screen.getByText("Raw JSON")).toBeInTheDocument();
        });
    });

    describe("input with no content", () => {
        it("should handle empty input", () => {
            render(<ToolUseCard toolName="Read" input={{}} defaultCollapsed={false} />);

            expect(screen.getByText("Read")).toBeInTheDocument();
        });
    });

    describe("object value formatting", () => {
        it("should format object values as JSON", () => {
            render(
                <ToolUseCard
                    toolName="Task"
                    input={{ config: { key: "value" } }}
                    defaultCollapsed={false}
                />,
            );

            expect(screen.getByText(/key/)).toBeInTheDocument();
            expect(screen.getByText(/value/)).toBeInTheDocument();
        });

        it("should handle null values", () => {
            render(
                <ToolUseCard
                    toolName="Task"
                    input={{ nullValue: null }}
                    defaultCollapsed={false}
                />,
            );

            expect(screen.getByText("null")).toBeInTheDocument();
        });
    });

    describe("startLine for diff preview", () => {
        it("should use startLine prop for Edit tool", () => {
            render(
                <ToolUseCard
                    toolName="Edit"
                    input={{
                        file_path: "/test.ts",
                        old_string: "foo",
                        new_string: "bar",
                    }}
                    fileContentBefore="line1\nline2\nfoo\nline4"
                    startLine={10}
                    defaultCollapsed={false}
                />,
            );

            expect(screen.getByText(/Line 10/)).toBeInTheDocument();
        });

        it("should use startLines prop for MultiEdit tool", () => {
            render(
                <ToolUseCard
                    toolName="MultiEdit"
                    input={{
                        file_path: "/test.ts",
                        edits: [
                            { old_string: "a", new_string: "b" },
                            { old_string: "c", new_string: "d" },
                        ],
                    }}
                    fileContentBefore="a\nc"
                    startLines={[5, 15]}
                    defaultCollapsed={false}
                />,
            );

            expect(screen.getByText(/Line 5/)).toBeInTheDocument();
            expect(screen.getByText(/Line 15/)).toBeInTheDocument();
        });
    });

    describe("fileContentAfter", () => {
        it("should use fileContentAfter when provided", () => {
            render(
                <ToolUseCard
                    toolName="Edit"
                    input={{
                        file_path: "/test.ts",
                        old_string: "foo",
                        new_string: "bar",
                    }}
                    fileContentBefore="foo"
                    fileContentAfter="bar"
                    defaultCollapsed={false}
                />,
            );

            expect(screen.getByText("Diff Preview")).toBeInTheDocument();
        });
    });
});
