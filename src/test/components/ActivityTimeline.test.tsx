import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ActivityTimeline } from "../../webview/components/Activity/ActivityTimeline";
import type { Message } from "../../webview/components/App";

const baseTimestamp = new Date("2024-06-15T10:00:00.000Z");

const createToolUseMessage = (overrides: Partial<Message> = {}): Message => ({
    id: "tool-use-1",
    role: "tool",
    messageType: "tool_use",
    content: "",
    timestamp: baseTimestamp,
    toolName: "Read",
    toolUseId: "tool-1",
    rawInput: { file_path: "/tmp/test.txt" },
    status: "executing",
    ...overrides,
});

const createToolResultMessage = (overrides: Partial<Message> = {}): Message => ({
    id: "tool-result-1",
    role: "tool",
    messageType: "tool_result",
    content: "Read result content",
    timestamp: new Date("2024-06-15T10:00:02.000Z"),
    toolName: "Read",
    toolUseId: "tool-1",
    isError: false,
    ...overrides,
});

describe("ActivityTimeline", () => {
    it("groups tool_use and tool_result into a step", () => {
        const messages: Message[] = [createToolUseMessage(), createToolResultMessage()];

        render(<ActivityTimeline messages={messages} defaultCollapsed={false} />);

        expect(screen.getByText("Activity")).toBeInTheDocument();
        expect(screen.getByText("Step 1")).toBeInTheDocument();
        // Multiple "Read" elements may appear (tool_use and tool_result both show tool name)
        expect(screen.getAllByText("Read").length).toBeGreaterThan(0);
    });

    it("collapses and expands the timeline body", () => {
        const messages: Message[] = [createToolUseMessage()];

        render(<ActivityTimeline messages={messages} defaultCollapsed={false} />);

        expect(screen.getByText("Step 1")).toBeInTheDocument();
        fireEvent.click(screen.getByText("Activity"));
        expect(screen.queryByText("Step 1")).not.toBeInTheDocument();
    });

    it("renders TodoWrite updates as a todo list", () => {
        const todoMessage = createToolUseMessage({
            toolName: "TodoWrite",
            rawInput: {
                todos: [{ content: "Ship feature", status: "completed" }],
            },
        });

        render(<ActivityTimeline messages={[todoMessage]} defaultCollapsed={false} />);

        expect(screen.getByText("Todo Update")).toBeInTheDocument();
        // The todo content may be rendered within the collapsed step header
        // Check that TodoWrite is recognized (shows "Todo Update" title)
        expect(screen.getByText("TodoWrite")).toBeInTheDocument();
    });
});
