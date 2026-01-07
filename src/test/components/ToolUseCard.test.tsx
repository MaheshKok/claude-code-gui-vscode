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

    describe("revert file functionality", () => {
        it("should show revert button when diff data is available", () => {
            render(
                <ToolUseCard
                    toolName="Edit"
                    input={{
                        file_path: "/test.ts",
                        old_string: "foo",
                        new_string: "bar",
                    }}
                    fileContentBefore="foo"
                    defaultCollapsed={false}
                />,
            );

            expect(screen.getByRole("button", { name: /Revert/ })).toBeInTheDocument();
        });

        it("should send revertFile message when revert button is clicked", () => {
            render(
                <ToolUseCard
                    toolName="Edit"
                    input={{
                        file_path: "/test.ts",
                        old_string: "foo",
                        new_string: "bar",
                    }}
                    fileContentBefore="foo original content"
                    defaultCollapsed={false}
                />,
            );

            const revertButton = screen.getByRole("button", { name: /Revert/ });
            fireEvent.click(revertButton);

            expect(mockPostMessage).toHaveBeenCalledWith({
                type: "revertFile",
                filePath: "/test.ts",
                oldContent: "foo original content",
            });
        });
    });

    describe("embedded variant", () => {
        it("should render embedded variant with label", () => {
            render(
                <ToolUseCard
                    toolName="Read"
                    input={{ file_path: "/test.ts" }}
                    variant="embedded"
                    label="Input"
                />,
            );

            expect(screen.getByText("Input")).toBeInTheDocument();
            expect(screen.getByText("file_path:")).toBeInTheDocument();
        });

        it("should show diff button in embedded variant when diff data exists", () => {
            render(
                <ToolUseCard
                    toolName="Edit"
                    input={{
                        file_path: "/test.ts",
                        old_string: "foo",
                        new_string: "bar",
                    }}
                    fileContentBefore="foo"
                    variant="embedded"
                />,
            );

            expect(screen.getByRole("button", { name: "Diff" })).toBeInTheDocument();
        });

        it("should handle openDiff in embedded variant", () => {
            render(
                <ToolUseCard
                    toolName="Edit"
                    input={{
                        file_path: "/test.ts",
                        old_string: "foo",
                        new_string: "bar",
                    }}
                    fileContentBefore="foo"
                    variant="embedded"
                />,
            );

            fireEvent.click(screen.getByRole("button", { name: "Diff" }));

            expect(mockPostMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: "openDiff",
                    filePath: "/test.ts",
                }),
            );
        });

        it("should show diff preview in embedded variant", () => {
            render(
                <ToolUseCard
                    toolName="Edit"
                    input={{
                        file_path: "/test.ts",
                        old_string: "foo",
                        new_string: "bar",
                    }}
                    fileContentBefore="foo"
                    variant="embedded"
                />,
            );

            expect(screen.getByText("Diff Preview")).toBeInTheDocument();
        });

        it("should render empty embedded variant when no content", () => {
            render(<ToolUseCard toolName="Read" input={{}} variant="embedded" />);

            // Should still render without crashing
            expect(screen.queryByText("file_path:")).not.toBeInTheDocument();
        });

        it("should handle file click in embedded variant diff preview", () => {
            const onFilePathClick = vi.fn();
            render(
                <ToolUseCard
                    toolName="Edit"
                    input={{
                        file_path: "/path/to/test.ts",
                        old_string: "foo",
                        new_string: "bar",
                    }}
                    fileContentBefore="foo"
                    variant="embedded"
                    onFilePathClick={onFilePathClick}
                />,
            );

            // Multiple "test.ts" links exist - use getAllByText and click the first one
            const fileLinks = screen.getAllByText("test.ts");
            fireEvent.click(fileLinks[0]);

            expect(onFilePathClick).toHaveBeenCalledWith("/path/to/test.ts");
        });
    });

    describe("line stats badges", () => {
        it("should show added lines count", () => {
            render(
                <ToolUseCard
                    toolName="Edit"
                    input={{
                        file_path: "/test.ts",
                        old_string: "foo",
                        new_string: "bar\nbaz",
                    }}
                    fileContentBefore="foo"
                    defaultCollapsed={false}
                />,
            );

            // Should show +2 for two added lines
            expect(screen.getByText(/\+\d+/)).toBeInTheDocument();
        });

        it("should show removed lines count", () => {
            render(
                <ToolUseCard
                    toolName="Edit"
                    input={{
                        file_path: "/test.ts",
                        old_string: "foo\nbar",
                        new_string: "baz",
                    }}
                    fileContentBefore="foo\nbar"
                    defaultCollapsed={false}
                />,
            );

            // Should show -2 for two removed lines
            expect(screen.getByText(/-\d+/)).toBeInTheDocument();
        });

        it("should show both added and removed when both exist", () => {
            render(
                <ToolUseCard
                    toolName="Edit"
                    input={{
                        file_path: "/test.ts",
                        old_string: "line1\nline2",
                        new_string: "changed1\nchanged2\nchanged3",
                    }}
                    fileContentBefore="line1\nline2"
                    defaultCollapsed={false}
                />,
            );

            // Should show both + and - stats
            expect(screen.getByText(/\+\d+/)).toBeInTheDocument();
            expect(screen.getByText(/-\d+/)).toBeInTheDocument();
        });
    });

    describe("file path key detection", () => {
        it("should recognize filePath key as file path", () => {
            const onFilePathClick = vi.fn();
            render(
                <ToolUseCard
                    toolName="Custom"
                    input={{ filePath: "/path/to/file.ts" }}
                    onFilePathClick={onFilePathClick}
                    defaultCollapsed={false}
                />,
            );

            fireEvent.click(screen.getByText("file.ts"));

            expect(onFilePathClick).toHaveBeenCalledWith("/path/to/file.ts");
        });

        it("should recognize path key as file path", () => {
            const onFilePathClick = vi.fn();
            render(
                <ToolUseCard
                    toolName="Custom"
                    input={{ path: "/path/to/file.ts" }}
                    onFilePathClick={onFilePathClick}
                    defaultCollapsed={false}
                />,
            );

            fireEvent.click(screen.getByText("file.ts"));

            expect(onFilePathClick).toHaveBeenCalledWith("/path/to/file.ts");
        });

        it("should recognize file key as file path", () => {
            const onFilePathClick = vi.fn();
            render(
                <ToolUseCard
                    toolName="Custom"
                    input={{ file: "/path/to/file.ts" }}
                    onFilePathClick={onFilePathClick}
                    defaultCollapsed={false}
                />,
            );

            fireEvent.click(screen.getByText("file.ts"));

            expect(onFilePathClick).toHaveBeenCalledWith("/path/to/file.ts");
        });

        it("should recognize absolute paths starting with /", () => {
            const onFilePathClick = vi.fn();
            render(
                <ToolUseCard
                    toolName="Custom"
                    input={{ someKey: "/absolute/path/file.ts" }}
                    onFilePathClick={onFilePathClick}
                    defaultCollapsed={false}
                />,
            );

            fireEvent.click(screen.getByText("file.ts"));

            expect(onFilePathClick).toHaveBeenCalledWith("/absolute/path/file.ts");
        });

        it("should not treat path with newlines as file path", () => {
            render(
                <ToolUseCard
                    toolName="Custom"
                    input={{ content: "/path\nwith\nnewlines" }}
                    defaultCollapsed={false}
                />,
            );

            // Should not have a clickable file path
            expect(screen.queryByTitle("/path\nwith\nnewlines")).not.toBeInTheDocument();
        });
    });

    describe("diff without file path", () => {
        it("should handle diffData without file path", () => {
            render(
                <ToolUseCard
                    toolName="Edit"
                    input={{
                        old_string: "foo",
                        new_string: "bar",
                    }}
                    fileContentBefore="foo"
                    defaultCollapsed={false}
                />,
            );

            // Should still show diff preview
            expect(screen.getByText("Diff Preview")).toBeInTheDocument();
            // But should not show Diff button in header
            expect(screen.queryByRole("button", { name: "Diff" })).not.toBeInTheDocument();
        });
    });

    describe("MultiEdit with invalid edits", () => {
        it("should skip invalid edits in MultiEdit", () => {
            render(
                <ToolUseCard
                    toolName="MultiEdit"
                    input={{
                        file_path: "/test.ts",
                        edits: [
                            { old_string: "valid1", new_string: "valid2" },
                            { old_string: 123, new_string: "invalid old" }, // invalid - will be skipped
                            { old_string: "valid3", new_string: "valid4" },
                        ],
                    }}
                    fileContentBefore="valid1\nvalid3"
                    defaultCollapsed={false}
                />,
            );

            // Diff Preview should be shown
            expect(screen.getByText("Diff Preview")).toBeInTheDocument();
            // Should show at least one edit section (Edit 1)
            expect(screen.getByText(/Edit 1/)).toBeInTheDocument();
            // Edit 3 is rendered at index 2 in the loop, so it shows "Edit 3" in the title
            expect(screen.getByText(/Edit 3/)).toBeInTheDocument();
        });
    });

    describe("format value edge cases", () => {
        it("should handle undefined values", () => {
            render(
                <ToolUseCard
                    toolName="Task"
                    input={{ undefinedValue: undefined }}
                    defaultCollapsed={false}
                />,
            );

            expect(screen.getByText("null")).toBeInTheDocument();
        });

        it("should handle number values", () => {
            render(
                <ToolUseCard
                    toolName="Task"
                    input={{ numberValue: 42 }}
                    defaultCollapsed={false}
                />,
            );

            expect(screen.getByText("42")).toBeInTheDocument();
        });

        it("should truncate long object values", () => {
            const longObject = { key: "a".repeat(250) };
            render(
                <ToolUseCard
                    toolName="Task"
                    input={{ config: longObject }}
                    defaultCollapsed={false}
                />,
            );

            expect(screen.getByText(/\.\.\./)).toBeInTheDocument();
        });
    });

    describe("getStartLine calculation", () => {
        it("should use provided startLine prop", () => {
            render(
                <ToolUseCard
                    toolName="Edit"
                    input={{
                        file_path: "/test.ts",
                        old_string: "target",
                        new_string: "replacement",
                    }}
                    fileContentBefore="target somewhere in file"
                    startLine={42}
                    defaultCollapsed={false}
                />,
            );

            // When startLine prop is provided, it should use that
            expect(screen.getByText(/Line 42/)).toBeInTheDocument();
        });

        it("should use fallback when needle not found", () => {
            render(
                <ToolUseCard
                    toolName="Edit"
                    input={{
                        file_path: "/test.ts",
                        old_string: "notfound",
                        new_string: "replacement",
                    }}
                    fileContentBefore="line1\nline2\nline3"
                    defaultCollapsed={false}
                />,
            );

            // When needle not found, falls back to line 1
            expect(screen.getByText(/Line 1/)).toBeInTheDocument();
        });
    });

    describe("empty file path formatting", () => {
        it("should handle empty file path", () => {
            render(
                <ToolUseCard toolName="Read" input={{ file_path: "" }} defaultCollapsed={false} />,
            );

            // Should render without crash
            expect(screen.getByText("Read")).toBeInTheDocument();
        });
    });
});
