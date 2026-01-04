import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ToolIcon, getToolIcon } from "../../webview/components/Common/ToolIcon";
import { ToolName } from "../../shared/constants";

describe("ToolIcon", () => {
    describe("rendering standard tools", () => {
        it("should render Read tool icon", () => {
            const { container } = render(<ToolIcon toolName={ToolName.Read} />);
            const svg = container.querySelector("svg");
            expect(svg).toBeInTheDocument();
        });

        it("should render Write tool icon", () => {
            const { container } = render(<ToolIcon toolName={ToolName.Write} />);
            const svg = container.querySelector("svg");
            expect(svg).toBeInTheDocument();
        });

        it("should render Edit tool icon", () => {
            const { container } = render(<ToolIcon toolName={ToolName.Edit} />);
            const svg = container.querySelector("svg");
            expect(svg).toBeInTheDocument();
        });

        it("should render MultiEdit tool icon", () => {
            const { container } = render(<ToolIcon toolName={ToolName.MultiEdit} />);
            const svg = container.querySelector("svg");
            expect(svg).toBeInTheDocument();
        });

        it("should render Bash tool icon", () => {
            const { container } = render(<ToolIcon toolName={ToolName.Bash} />);
            const svg = container.querySelector("svg");
            expect(svg).toBeInTheDocument();
        });

        it("should render Glob tool icon", () => {
            const { container } = render(<ToolIcon toolName={ToolName.Glob} />);
            const svg = container.querySelector("svg");
            expect(svg).toBeInTheDocument();
        });

        it("should render Grep tool icon", () => {
            const { container } = render(<ToolIcon toolName={ToolName.Grep} />);
            const svg = container.querySelector("svg");
            expect(svg).toBeInTheDocument();
        });

        it("should render Task tool icon", () => {
            const { container } = render(<ToolIcon toolName={ToolName.Task} />);
            const svg = container.querySelector("svg");
            expect(svg).toBeInTheDocument();
        });

        it("should render TodoRead tool icon", () => {
            const { container } = render(<ToolIcon toolName={ToolName.TodoRead} />);
            const svg = container.querySelector("svg");
            expect(svg).toBeInTheDocument();
        });

        it("should render TodoWrite tool icon", () => {
            const { container } = render(<ToolIcon toolName={ToolName.TodoWrite} />);
            const svg = container.querySelector("svg");
            expect(svg).toBeInTheDocument();
        });

        it("should render WebFetch tool icon", () => {
            const { container } = render(<ToolIcon toolName={ToolName.WebFetch} />);
            const svg = container.querySelector("svg");
            expect(svg).toBeInTheDocument();
        });

        it("should render WebSearch tool icon", () => {
            const { container } = render(<ToolIcon toolName={ToolName.WebSearch} />);
            const svg = container.querySelector("svg");
            expect(svg).toBeInTheDocument();
        });

        it("should render NotebookRead tool icon", () => {
            const { container } = render(<ToolIcon toolName={ToolName.NotebookRead} />);
            const svg = container.querySelector("svg");
            expect(svg).toBeInTheDocument();
        });

        it("should render NotebookEdit tool icon", () => {
            const { container } = render(<ToolIcon toolName={ToolName.NotebookEdit} />);
            const svg = container.querySelector("svg");
            expect(svg).toBeInTheDocument();
        });
    });

    describe("MCP tools", () => {
        it("should render Zap icon for MCP tools", () => {
            const { container } = render(<ToolIcon toolName="mcp__server__tool" />);
            const svg = container.querySelector("svg");
            expect(svg).toBeInTheDocument();
        });

        it("should render Zap icon for different MCP servers", () => {
            const { container } = render(<ToolIcon toolName="mcp__my-server__my-tool" />);
            const svg = container.querySelector("svg");
            expect(svg).toBeInTheDocument();
        });
    });

    describe("unknown tools", () => {
        it("should render Code icon for unknown tools", () => {
            const { container } = render(<ToolIcon toolName="UnknownTool" />);
            const svg = container.querySelector("svg");
            expect(svg).toBeInTheDocument();
        });

        it("should render Code icon for empty tool name", () => {
            const { container } = render(<ToolIcon toolName="" />);
            const svg = container.querySelector("svg");
            expect(svg).toBeInTheDocument();
        });
    });

    describe("className prop", () => {
        it("should apply default className", () => {
            const { container } = render(<ToolIcon toolName={ToolName.Read} />);
            const svg = container.querySelector("svg");
            expect(svg).toHaveClass("w-4", "h-4");
        });

        it("should apply custom className", () => {
            const { container } = render(
                <ToolIcon toolName={ToolName.Read} className="w-6 h-6 text-blue-500" />,
            );
            const svg = container.querySelector("svg");
            expect(svg).toHaveClass("w-6", "h-6", "text-blue-500");
        });
    });

    describe("size prop", () => {
        it("should apply size as width and height class", () => {
            const { container } = render(<ToolIcon toolName={ToolName.Read} size={8} />);
            const svg = container.querySelector("svg");
            expect(svg).toHaveClass("w-8", "h-8");
        });
    });

    describe("getToolIcon function", () => {
        it("should return icon element for Read tool", () => {
            const { container } = render(<>{getToolIcon(ToolName.Read)}</>);
            const svg = container.querySelector("svg");
            expect(svg).toBeInTheDocument();
        });

        it("should apply custom className", () => {
            const { container } = render(<>{getToolIcon(ToolName.Read, "w-8 h-8")}</>);
            const svg = container.querySelector("svg");
            expect(svg).toHaveClass("w-8", "h-8");
        });

        it("should return MCP icon for MCP tools", () => {
            const { container } = render(<>{getToolIcon("mcp__test__tool")}</>);
            const svg = container.querySelector("svg");
            expect(svg).toBeInTheDocument();
        });
    });
});
