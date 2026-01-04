import { describe, it, expect } from "vitest";
import {
    formatToolInput,
    getToolFilePath,
    getToolDescription,
    getToolSummary,
    isDestructiveOperation,
    getToolOriginInfo,
} from "../../webview/utils/toolInput";

describe("toolInput utils", () => {
    describe("formatToolInput", () => {
        describe("Read tool", () => {
            it("should format basic read input", () => {
                const result = formatToolInput("Read", { file_path: "/path/to/file.ts" });
                expect(result.summary).toContain("Read");
                expect(result.summary).toContain("file.ts");
                expect(result.isExpandable).toBe(false);
            });

            it("should include line range in summary", () => {
                const result = formatToolInput("Read", {
                    file_path: "/path/to/file.ts",
                    start_line: 10,
                    end_line: 20,
                });
                expect(result.summary).toContain("lines 10-20");
            });

            it("should include offset and limit", () => {
                const result = formatToolInput("Read", {
                    file_path: "/path/to/file.ts",
                    offset: 100,
                    limit: 50,
                });
                expect(result.summary).toContain("offset");
                expect(result.summary).toContain("limit");
            });
        });

        describe("Write tool", () => {
            it("should format write input with line count", () => {
                const result = formatToolInput("Write", {
                    file_path: "/path/to/file.ts",
                    content: "line1\nline2\nline3",
                });
                expect(result.summary).toContain("Write");
                expect(result.summary).toContain("3 lines");
            });

            it("should be expandable for large content", () => {
                const longContent = "x".repeat(600);
                const result = formatToolInput("Write", {
                    file_path: "/path/to/file.ts",
                    content: longContent,
                });
                expect(result.isExpandable).toBe(true);
            });
        });

        describe("Edit tool", () => {
            it("should format edit input", () => {
                const result = formatToolInput("Edit", {
                    file_path: "/path/to/file.ts",
                    old_string: "old",
                    new_string: "new",
                });
                expect(result.summary).toContain("Edit");
                expect(result.fullContent).toContain("Remove:");
                expect(result.fullContent).toContain("Add:");
            });

            it("should be expandable for large edits", () => {
                const result = formatToolInput("Edit", {
                    file_path: "/path/to/file.ts",
                    old_string: "x".repeat(300),
                    new_string: "y".repeat(300),
                });
                expect(result.isExpandable).toBe(true);
            });
        });

        describe("MultiEdit tool", () => {
            it("should format multiedit input", () => {
                const result = formatToolInput("MultiEdit", {
                    file_path: "/path/to/file.ts",
                    edits: [
                        { old_string: "a", new_string: "b" },
                        { old_string: "c", new_string: "d" },
                    ],
                });
                expect(result.summary).toContain("2 edits");
            });
        });

        describe("Bash tool", () => {
            it("should format bash input", () => {
                const result = formatToolInput("Bash", {
                    command: "npm install",
                });
                expect(result.summary).toContain("npm install");
            });

            it("should use description if provided", () => {
                const result = formatToolInput("Bash", {
                    command: "npm install",
                    description: "Install dependencies",
                });
                expect(result.summary).toBe("Install dependencies");
            });

            it("should include cwd and timeout", () => {
                const result = formatToolInput("Bash", {
                    command: "npm test",
                    cwd: "/project",
                    timeout: 5000,
                });
                expect(result.fullContent).toContain("Working Dir:");
                expect(result.fullContent).toContain("Timeout:");
            });
        });

        describe("Glob tool", () => {
            it("should format glob input", () => {
                const result = formatToolInput("Glob", {
                    pattern: "**/*.ts",
                });
                expect(result.summary).toContain("**/*.ts");
            });

            it("should include path if provided", () => {
                const result = formatToolInput("Glob", {
                    pattern: "*.ts",
                    path: "/src",
                });
                // Path gets HTML escaped, so check for the escaped version
                expect(result.fullContent).toContain("&#x2F;src");
            });
        });

        describe("Grep tool", () => {
            it("should format grep input", () => {
                const result = formatToolInput("Grep", {
                    pattern: "TODO",
                });
                expect(result.summary).toContain("TODO");
            });

            it("should include path and glob", () => {
                const result = formatToolInput("Grep", {
                    pattern: "TODO",
                    path: "/src",
                    glob: "*.ts",
                });
                expect(result.fullContent).toContain("Path:");
                expect(result.fullContent).toContain("File Pattern:");
            });
        });

        describe("TodoWrite tool", () => {
            it("should format todo write input", () => {
                const result = formatToolInput("TodoWrite", {
                    todos: [
                        { content: "Task 1", status: "pending" },
                        { content: "Task 2", status: "completed" },
                    ],
                });
                expect(result.summary).toContain("2 items");
            });

            it("should be expandable for many todos", () => {
                const todos = Array.from({ length: 10 }, (_, i) => ({
                    content: `Task ${i}`,
                    status: "pending",
                }));
                const result = formatToolInput("TodoWrite", { todos });
                expect(result.isExpandable).toBe(true);
            });
        });

        describe("WebFetch tool", () => {
            it("should format webfetch input", () => {
                const result = formatToolInput("WebFetch", {
                    url: "https://example.com",
                    prompt: "Extract the title",
                });
                expect(result.summary).toContain("example.com");
                expect(result.fullContent).toContain("Prompt:");
            });
        });

        describe("Task tool", () => {
            it("should format task input", () => {
                const result = formatToolInput("Task", {
                    description: "Research the codebase",
                });
                expect(result.summary).toContain("Research");
            });

            it("should use prompt as fallback", () => {
                const result = formatToolInput("Task", {
                    prompt: "Analyze the code",
                });
                expect(result.summary).toContain("Analyze");
            });
        });

        describe("Generic tool", () => {
            it("should format unknown tool", () => {
                const result = formatToolInput("UnknownTool", {
                    foo: "bar",
                    baz: 123,
                });
                expect(result.summary).toContain("UnknownTool");
                expect(result.fullContent).toContain("foo");
            });
        });
    });

    describe("getToolFilePath", () => {
        it("should return file path for file tools", () => {
            expect(getToolFilePath("Read", { file_path: "/path/to/file.ts" })).toBe(
                "/path/to/file.ts",
            );
            expect(getToolFilePath("Write", { file_path: "/path/to/file.ts" })).toBe(
                "/path/to/file.ts",
            );
            expect(getToolFilePath("Edit", { file_path: "/path/to/file.ts" })).toBe(
                "/path/to/file.ts",
            );
        });

        it("should return notebook path", () => {
            expect(
                getToolFilePath("NotebookRead", { notebook_path: "/path/to/notebook.ipynb" }),
            ).toBe("/path/to/notebook.ipynb");
        });

        it("should return undefined for non-file tools", () => {
            expect(getToolFilePath("Bash", { command: "ls" })).toBeUndefined();
            expect(getToolFilePath("Grep", { pattern: "TODO" })).toBeUndefined();
        });
    });

    describe("getToolDescription", () => {
        it("should return description for known tools", () => {
            expect(getToolDescription("Read")).toBe("Read file contents");
            expect(getToolDescription("Write")).toBe("Create or overwrite file");
            expect(getToolDescription("Edit")).toBe("Edit file with search/replace");
            expect(getToolDescription("Bash")).toBe("Execute shell command");
            expect(getToolDescription("Glob")).toBe("Search for files by pattern");
            expect(getToolDescription("Grep")).toBe("Search file contents");
        });

        it("should return default for unknown tools", () => {
            expect(getToolDescription("UnknownTool")).toBe("Use UnknownTool tool");
        });
    });

    describe("getToolSummary", () => {
        it("should return empty string for null input", () => {
            expect(getToolSummary("Read", null as any)).toBe("");
            expect(getToolSummary("Read", undefined as any)).toBe("");
        });

        it("should get filename for file tools", () => {
            expect(getToolSummary("Read", { file_path: "/path/to/file.ts" })).toBe("file.ts");
            expect(getToolSummary("Write", { file_path: "/path/to/file.ts" })).toBe("file.ts");
            expect(getToolSummary("Edit", { file_path: "/path/to/file.ts" })).toBe("file.ts");
        });

        it("should include edit count for MultiEdit", () => {
            expect(
                getToolSummary("MultiEdit", {
                    file_path: "/path/to/file.ts",
                    edits: [{ old_string: "a", new_string: "b" }],
                }),
            ).toContain("1 edits");
        });

        it("should return pattern for Glob", () => {
            expect(getToolSummary("Glob", { pattern: "**/*.ts" })).toBe("**/*.ts");
        });

        it("should return pattern for Grep", () => {
            expect(getToolSummary("Grep", { pattern: "TODO" })).toBe('"TODO"');
        });

        it("should include glob in Grep summary", () => {
            expect(getToolSummary("Grep", { pattern: "TODO", glob: "*.ts" })).toContain("*.ts");
        });

        it("should use description for Bash if available", () => {
            expect(
                getToolSummary("Bash", { command: "npm install", description: "Install deps" }),
            ).toBe("Install deps");
        });

        it("should use command for Bash without description", () => {
            expect(getToolSummary("Bash", { command: "npm install" })).toBe("npm install");
        });

        it("should get description for Task", () => {
            expect(getToolSummary("Task", { description: "Research" })).toBe("Research");
            expect(getToolSummary("Task", { prompt: "Research" })).toBe("Research");
        });

        it("should show stats for TodoWrite", () => {
            const result = getToolSummary("TodoWrite", {
                todos: [{ status: "completed" }, { status: "in_progress" }, { status: "pending" }],
            });
            expect(result).toContain("3 tasks");
            expect(result).toContain("1 done");
            expect(result).toContain("1 active");
        });

        it("should get hostname for WebFetch", () => {
            expect(getToolSummary("WebFetch", { url: "https://example.com/page" })).toBe(
                "example.com",
            );
        });

        it("should handle invalid URL for WebFetch", () => {
            expect(getToolSummary("WebFetch", { url: "not-a-url" })).toBe("not-a-url");
        });

        it("should get query for WebSearch", () => {
            expect(getToolSummary("WebSearch", { query: "test query" })).toBe('"test query"');
        });

        it("should format LSP summary", () => {
            expect(
                getToolSummary("LSP", { operation: "goto", filePath: "/path/to/file.ts" }),
            ).toContain("goto");
        });

        it("should truncate long summaries", () => {
            const longPath = "/very/long/path/" + "a".repeat(100) + ".ts";
            const result = getToolSummary("Read", { file_path: longPath }, 20);
            expect(result.length).toBeLessThanOrEqual(20);
        });

        it("should handle unknown tools with common params", () => {
            expect(getToolSummary("CustomTool", { description: "Custom desc" })).toBe(
                "Custom desc",
            );
            expect(getToolSummary("CustomTool", { name: "Custom name" })).toBe("Custom name");
        });
    });

    describe("isDestructiveOperation", () => {
        it("should return true for Write", () => {
            expect(isDestructiveOperation("Write", { file_path: "test.txt" })).toBe(true);
        });

        it("should return true for Edit", () => {
            expect(isDestructiveOperation("Edit", { file_path: "test.txt" })).toBe(true);
        });

        it("should return true for MultiEdit", () => {
            expect(isDestructiveOperation("MultiEdit", { file_path: "test.txt" })).toBe(true);
        });

        it("should return false for Read", () => {
            expect(isDestructiveOperation("Read", { file_path: "test.txt" })).toBe(false);
        });

        it("should return false for Glob", () => {
            expect(isDestructiveOperation("Glob", { pattern: "*.ts" })).toBe(false);
        });

        it("should detect destructive bash commands", () => {
            expect(isDestructiveOperation("Bash", { command: "rm -rf /tmp" })).toBe(true);
            expect(isDestructiveOperation("Bash", { command: "rmdir test" })).toBe(true);
            expect(isDestructiveOperation("Bash", { command: "sudo apt install" })).toBe(true);
            expect(isDestructiveOperation("Bash", { command: "chmod 777 file" })).toBe(true);
            expect(isDestructiveOperation("Bash", { command: "chown root file" })).toBe(true);
            expect(isDestructiveOperation("Bash", { command: "kill -9 1234" })).toBe(true);
            expect(isDestructiveOperation("Bash", { command: "pkill process" })).toBe(true);
            expect(isDestructiveOperation("Bash", { command: "echo test > /file" })).toBe(true);
        });

        it("should return false for safe bash commands", () => {
            expect(isDestructiveOperation("Bash", { command: "ls -la" })).toBe(false);
            expect(isDestructiveOperation("Bash", { command: "cat file.txt" })).toBe(false);
            expect(isDestructiveOperation("Bash", { command: "npm install" })).toBe(false);
        });
    });

    describe("getToolOriginInfo", () => {
        it("should detect MCP tools", () => {
            const result = getToolOriginInfo("mcp__server__tool");
            expect(result.origin).toBe("mcp");
            expect(result.label).toBe("MCP");
            expect(result.mcpServer).toBe("server");
            expect(result.mcpTool).toBe("tool");
        });

        it("should detect Task as agent", () => {
            const result = getToolOriginInfo("Task", { subagent_type: "researcher" });
            expect(result.origin).toBe("agent");
            expect(result.label).toBe("Agent");
            expect(result.agentName).toBe("researcher");
        });

        it("should detect agent from various keys", () => {
            expect(getToolOriginInfo("Task", { agent: "coder" }).agentName).toBe("coder");
            expect(getToolOriginInfo("Task", { agent_name: "tester" }).agentName).toBe("tester");
            expect(getToolOriginInfo("Task", { role: "reviewer" }).agentName).toBe("reviewer");
        });

        it("should return core for regular tools", () => {
            const result = getToolOriginInfo("Read");
            expect(result.origin).toBe("core");
        });

        it("should handle MCP tools with multiple underscores", () => {
            const result = getToolOriginInfo("mcp__my_server__my_tool_name");
            expect(result.mcpServer).toBe("my_server");
            expect(result.mcpTool).toBe("my_tool_name");
        });
    });
});
