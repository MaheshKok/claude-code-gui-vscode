import { describe, it, expect } from "vitest";
import {
    toTimestamp,
    toStringContent,
    buildChatMessages,
    findLatestTodos,
    findTodosInLastTurn,
    mapConversationList,
    type StoredConversationMessage,
} from "../../webview/utils/conversationRestore";
import { MessageType, ToolExecutionStatus } from "../../shared/constants";
import type { ChatMessage } from "../../webview/types";

describe("conversationRestore utils", () => {
    describe("toTimestamp", () => {
        it("should return number as-is", () => {
            expect(toTimestamp(1234567890)).toBe(1234567890);
        });

        it("should parse valid date string", () => {
            const dateStr = "2024-01-15T10:30:00Z";
            const result = toTimestamp(dateStr);
            expect(result).toBe(Date.parse(dateStr));
        });

        it("should return Date.now() for invalid date string", () => {
            const before = Date.now();
            const result = toTimestamp("invalid-date");
            const after = Date.now();
            expect(result).toBeGreaterThanOrEqual(before);
            expect(result).toBeLessThanOrEqual(after);
        });

        it("should return Date.now() for non-string/non-number values", () => {
            const before = Date.now();
            const result = toTimestamp({ foo: "bar" });
            const after = Date.now();
            expect(result).toBeGreaterThanOrEqual(before);
            expect(result).toBeLessThanOrEqual(after);
        });

        it("should return Date.now() for undefined", () => {
            const before = Date.now();
            const result = toTimestamp(undefined);
            const after = Date.now();
            expect(result).toBeGreaterThanOrEqual(before);
            expect(result).toBeLessThanOrEqual(after);
        });
    });

    describe("toStringContent", () => {
        it("should return string as-is", () => {
            expect(toStringContent("hello")).toBe("hello");
        });

        it("should return empty string for undefined", () => {
            expect(toStringContent(undefined)).toBe("");
        });

        it("should return empty string for null", () => {
            expect(toStringContent(null)).toBe("");
        });

        it("should JSON stringify objects", () => {
            const obj = { foo: "bar" };
            expect(toStringContent(obj)).toBe('{"foo":"bar"}');
        });

        it("should JSON stringify arrays", () => {
            expect(toStringContent([1, 2, 3])).toBe("[1,2,3]");
        });

        it("should convert numbers to string", () => {
            expect(toStringContent(42)).toBe("42");
        });

        it("should handle circular references gracefully", () => {
            const obj: Record<string, unknown> = { foo: "bar" };
            obj.self = obj;
            const result = toStringContent(obj);
            expect(result).toBe("[object Object]");
        });
    });

    describe("buildChatMessages", () => {
        it("should build user message from userInput", () => {
            const messages: StoredConversationMessage[] = [
                { type: "userInput", data: "Hello world", timestamp: "2024-01-15T10:00:00Z" },
            ];
            const result = buildChatMessages(messages);
            expect(result.length).toBe(1);
            expect(result[0].type).toBe(MessageType.User);
            expect(result[0].content).toBe("Hello world");
        });

        it("should build assistant message from output", () => {
            const messages: StoredConversationMessage[] = [
                {
                    type: "output",
                    text: "Hello!",
                    isFinal: true,
                    timestamp: "2024-01-15T10:00:00Z",
                },
            ];
            const result = buildChatMessages(messages);
            expect(result.length).toBe(1);
            expect(result[0].type).toBe(MessageType.Assistant);
            expect(result[0].content).toBe("Hello!");
            expect(result[0].isStreaming).toBe(false);
        });

        it("should merge streaming assistant messages", () => {
            const messages: StoredConversationMessage[] = [
                {
                    type: "output",
                    text: "Hello",
                    isFinal: false,
                    timestamp: "2024-01-15T10:00:00Z",
                },
                {
                    type: "output",
                    text: " world",
                    isFinal: false,
                    timestamp: "2024-01-15T10:00:01Z",
                },
                { type: "output", text: "!", isFinal: true, timestamp: "2024-01-15T10:00:02Z" },
            ];
            const result = buildChatMessages(messages);
            expect(result.length).toBe(1);
            expect(result[0].content).toBe("Hello world!");
            expect(result[0].isStreaming).toBe(false);
        });

        it("should skip empty final output when no active assistant", () => {
            const messages: StoredConversationMessage[] = [
                { type: "output", text: "", isFinal: true, timestamp: "2024-01-15T10:00:00Z" },
            ];
            const result = buildChatMessages(messages);
            expect(result.length).toBe(0);
        });

        it("should use data field as fallback for output text", () => {
            const messages: StoredConversationMessage[] = [
                {
                    type: "output",
                    data: "Fallback text",
                    isFinal: true,
                    timestamp: "2024-01-15T10:00:00Z",
                },
            ];
            const result = buildChatMessages(messages);
            expect(result[0].content).toBe("Fallback text");
        });

        it("should build thinking message", () => {
            const messages: StoredConversationMessage[] = [
                {
                    type: "thinking",
                    thinking: "Let me think...",
                    timestamp: "2024-01-15T10:00:00Z",
                },
            ];
            const result = buildChatMessages(messages);
            expect(result.length).toBe(1);
            expect(result[0].type).toBe(MessageType.Thinking);
            expect(result[0].content).toBe("Let me think...");
        });

        it("should use data for thinking when thinking field is missing", () => {
            const messages: StoredConversationMessage[] = [
                { type: "thinking", data: "Thinking data...", timestamp: "2024-01-15T10:00:00Z" },
            ];
            const result = buildChatMessages(messages);
            expect(result[0].content).toBe("Thinking data...");
        });

        it("should build tool use message", () => {
            const messages: StoredConversationMessage[] = [
                {
                    type: "toolUse",
                    toolUseId: "tool-123",
                    toolName: "Read",
                    rawInput: { file_path: "/test.txt" },
                    toolInfo: "Reading file",
                    timestamp: "2024-01-15T10:00:00Z",
                },
            ];
            const result = buildChatMessages(messages);
            expect(result.length).toBe(1);
            expect(result[0].type).toBe(MessageType.ToolUse);
            expect(result[0].toolName).toBe("Read");
            expect(result[0].rawInput).toEqual({ file_path: "/test.txt" });
            expect(result[0].status).toBe(ToolExecutionStatus.Executing);
        });

        it("should extract toolUse fields from data object", () => {
            const messages: StoredConversationMessage[] = [
                {
                    type: "toolUse",
                    data: {
                        toolUseId: "tool-456",
                        toolName: "Write",
                        rawInput: { content: "test" },
                    },
                    timestamp: "2024-01-15T10:00:00Z",
                },
            ];
            const result = buildChatMessages(messages);
            expect(result[0].toolUseId).toBe("tool-456");
            expect(result[0].toolName).toBe("Write");
        });

        it("should build tool result and update tool use status", () => {
            const messages: StoredConversationMessage[] = [
                {
                    type: "toolUse",
                    toolUseId: "tool-123",
                    toolName: "Read",
                    rawInput: {},
                    timestamp: "2024-01-15T10:00:00Z",
                },
                {
                    type: "toolResult",
                    toolUseId: "tool-123",
                    content: "File contents here",
                    isError: false,
                    hidden: false,
                    timestamp: "2024-01-15T10:00:01Z",
                },
            ];
            const result = buildChatMessages(messages);
            expect(result.length).toBe(2);
            expect(result[0].status).toBe(ToolExecutionStatus.Completed);
            expect(result[1].type).toBe(MessageType.ToolResult);
            expect(result[1].content).toBe("File contents here");
        });

        it("should mark tool as failed on error", () => {
            const messages: StoredConversationMessage[] = [
                {
                    type: "toolUse",
                    toolUseId: "tool-123",
                    toolName: "Read",
                    rawInput: {},
                    timestamp: "2024-01-15T10:00:00Z",
                },
                {
                    type: "toolResult",
                    toolUseId: "tool-123",
                    content: "File not found",
                    isError: true,
                    hidden: false,
                    timestamp: "2024-01-15T10:00:01Z",
                },
            ];
            const result = buildChatMessages(messages);
            expect(result[0].status).toBe(ToolExecutionStatus.Failed);
            expect(result[1].isError).toBe(true);
        });

        it("should hide tool result when hidden is true", () => {
            const messages: StoredConversationMessage[] = [
                {
                    type: "toolUse",
                    toolUseId: "tool-123",
                    toolName: "Read",
                    rawInput: {},
                    timestamp: "2024-01-15T10:00:00Z",
                },
                {
                    type: "toolResult",
                    toolUseId: "tool-123",
                    content: "Hidden content",
                    hidden: true,
                    timestamp: "2024-01-15T10:00:01Z",
                },
            ];
            const result = buildChatMessages(messages);
            expect(result.length).toBe(1); // Only tool use, no result
        });

        it("should build error message", () => {
            const messages: StoredConversationMessage[] = [
                {
                    type: "error",
                    message: "Something went wrong",
                    timestamp: "2024-01-15T10:00:00Z",
                },
            ];
            const result = buildChatMessages(messages);
            expect(result.length).toBe(1);
            expect(result[0].type).toBe(MessageType.Error);
            expect(result[0].content).toBe("Something went wrong");
        });

        it("should use data for error when message field is missing", () => {
            const messages: StoredConversationMessage[] = [
                { type: "error", data: "Error data", timestamp: "2024-01-15T10:00:00Z" },
            ];
            const result = buildChatMessages(messages);
            expect(result[0].content).toBe("Error data");
        });

        it("should handle updateTokens message", () => {
            const messages: StoredConversationMessage[] = [
                {
                    type: "output",
                    text: "Hello",
                    isFinal: false,
                    timestamp: "2024-01-15T10:00:00Z",
                },
                {
                    type: "updateTokens",
                    current: {
                        input_tokens: 100,
                        output_tokens: 50,
                        cache_read_input_tokens: 10,
                        cache_creation_input_tokens: 5,
                    },
                    timestamp: "2024-01-15T10:00:01Z",
                },
                { type: "output", text: "!", isFinal: true, timestamp: "2024-01-15T10:00:02Z" },
            ];
            const result = buildChatMessages(messages);
            expect(result[0].usage).toBeDefined();
            expect(result[0].usage?.input_tokens).toBe(100);
            expect(result[0].usage?.output_tokens).toBe(50);
        });

        it("should attach tokens to last assistant when no active assistant", () => {
            const messages: StoredConversationMessage[] = [
                { type: "output", text: "Hello", isFinal: true, timestamp: "2024-01-15T10:00:00Z" },
                {
                    type: "updateTokens",
                    current: {
                        input_tokens: 100,
                        output_tokens: 50,
                    },
                    timestamp: "2024-01-15T10:00:01Z",
                },
            ];
            const result = buildChatMessages(messages);
            expect(result[0].usage?.input_tokens).toBe(100);
        });

        it("should extract updateTokens from data.current", () => {
            const messages: StoredConversationMessage[] = [
                {
                    type: "output",
                    text: "Hello",
                    isFinal: false,
                    timestamp: "2024-01-15T10:00:00Z",
                },
                {
                    type: "updateTokens",
                    data: {
                        current: {
                            input_tokens: 200,
                            output_tokens: 100,
                        },
                    },
                    timestamp: "2024-01-15T10:00:01Z",
                },
            ];
            const result = buildChatMessages(messages);
            expect(result[0].usage?.input_tokens).toBe(200);
        });

        it("should preserve fileContentBefore and startLine for toolUse", () => {
            const messages: StoredConversationMessage[] = [
                {
                    type: "toolUse",
                    toolUseId: "tool-123",
                    toolName: "Edit",
                    rawInput: {},
                    fileContentBefore: "original content",
                    startLine: 10,
                    startLines: [10, 20],
                    timestamp: "2024-01-15T10:00:00Z",
                },
            ];
            const result = buildChatMessages(messages);
            expect(result[0].fileContentBefore).toBe("original content");
            expect(result[0].startLine).toBe(10);
            expect(result[0].startLines).toEqual([10, 20]);
        });

        it("should update fileContentAfter from toolResult", () => {
            const messages: StoredConversationMessage[] = [
                {
                    type: "toolUse",
                    toolUseId: "tool-123",
                    toolName: "Edit",
                    rawInput: {},
                    fileContentBefore: "original",
                    timestamp: "2024-01-15T10:00:00Z",
                },
                {
                    type: "toolResult",
                    toolUseId: "tool-123",
                    content: "Success",
                    fileContentAfter: "modified content",
                    hidden: true,
                    timestamp: "2024-01-15T10:00:01Z",
                },
            ];
            const result = buildChatMessages(messages);
            expect(result[0].fileContentAfter).toBe("modified content");
        });

        it("should preserve duration and tokens in toolUse", () => {
            const messages: StoredConversationMessage[] = [
                {
                    type: "toolUse",
                    toolUseId: "tool-123",
                    toolName: "Read",
                    rawInput: {},
                    duration: 150,
                    tokens: 500,
                    cacheReadTokens: 50,
                    cacheCreationTokens: 25,
                    timestamp: "2024-01-15T10:00:00Z",
                },
            ];
            const result = buildChatMessages(messages);
            expect(result[0].duration).toBe(150);
            expect(result[0].tokens).toBe(500);
            expect(result[0].cacheReadTokens).toBe(50);
            expect(result[0].cacheCreationTokens).toBe(25);
        });

        it("should update duration and tokens from toolResult", () => {
            const messages: StoredConversationMessage[] = [
                {
                    type: "toolUse",
                    toolUseId: "tool-123",
                    toolName: "Read",
                    rawInput: {},
                    timestamp: "2024-01-15T10:00:00Z",
                },
                {
                    type: "toolResult",
                    toolUseId: "tool-123",
                    content: "Done",
                    duration: 250,
                    tokens: 1000,
                    hidden: true,
                    timestamp: "2024-01-15T10:00:01Z",
                },
            ];
            const result = buildChatMessages(messages);
            expect(result[0].duration).toBe(250);
            expect(result[0].tokens).toBe(1000);
        });

        it("should ignore unknown message types", () => {
            const messages: StoredConversationMessage[] = [
                { type: "unknownType", data: "something", timestamp: "2024-01-15T10:00:00Z" },
            ];
            const result = buildChatMessages(messages);
            expect(result.length).toBe(0);
        });

        it("should finalize assistant when new user input arrives", () => {
            const messages: StoredConversationMessage[] = [
                {
                    type: "output",
                    text: "Hello",
                    isFinal: false,
                    timestamp: "2024-01-15T10:00:00Z",
                },
                { type: "userInput", data: "Hi there", timestamp: "2024-01-15T10:00:01Z" },
            ];
            const result = buildChatMessages(messages);
            expect(result.length).toBe(2);
            expect(result[0].isStreaming).toBe(false);
        });

        it("should handle complex conversation with multiple message types", () => {
            const messages: StoredConversationMessage[] = [
                { type: "userInput", data: "Read the file", timestamp: "2024-01-15T10:00:00Z" },
                {
                    type: "thinking",
                    thinking: "I will read the file",
                    timestamp: "2024-01-15T10:00:01Z",
                },
                {
                    type: "toolUse",
                    toolUseId: "tool-1",
                    toolName: "Read",
                    rawInput: { file_path: "/test.txt" },
                    timestamp: "2024-01-15T10:00:02Z",
                },
                {
                    type: "toolResult",
                    toolUseId: "tool-1",
                    content: "File contents",
                    hidden: false,
                    timestamp: "2024-01-15T10:00:03Z",
                },
                {
                    type: "output",
                    text: "Here is the file contents",
                    isFinal: true,
                    timestamp: "2024-01-15T10:00:04Z",
                },
            ];
            const result = buildChatMessages(messages);
            expect(result.length).toBe(5);
            expect(result[0].type).toBe(MessageType.User);
            expect(result[1].type).toBe(MessageType.Thinking);
            expect(result[2].type).toBe(MessageType.ToolUse);
            expect(result[3].type).toBe(MessageType.ToolResult);
            expect(result[4].type).toBe(MessageType.Assistant);
        });
    });

    describe("findLatestTodos", () => {
        it("should return empty array when no todos", () => {
            const messages: ChatMessage[] = [
                { id: "1", type: MessageType.User, content: "Hello", timestamp: Date.now() },
            ];
            expect(findLatestTodos(messages)).toEqual([]);
        });

        it("should find todos from TodoWrite tool", () => {
            const messages: ChatMessage[] = [
                { id: "1", type: MessageType.User, content: "Create tasks", timestamp: Date.now() },
                {
                    id: "2",
                    type: MessageType.ToolUse,
                    toolUseId: "tool-1",
                    toolName: "TodoWrite",
                    rawInput: {
                        todos: [
                            { content: "Task 1", status: "pending" },
                            { content: "Task 2", status: "completed" },
                        ],
                    },
                    timestamp: Date.now(),
                },
            ];
            const todos = findLatestTodos(messages);
            expect(todos.length).toBe(2);
            expect(todos[0].content).toBe("Task 1");
        });

        it("should return the latest TodoWrite", () => {
            const messages: ChatMessage[] = [
                {
                    id: "1",
                    type: MessageType.ToolUse,
                    toolUseId: "tool-1",
                    toolName: "TodoWrite",
                    rawInput: { todos: [{ content: "Old task", status: "pending" }] },
                    timestamp: Date.now() - 1000,
                },
                {
                    id: "2",
                    type: MessageType.ToolUse,
                    toolUseId: "tool-2",
                    toolName: "TodoWrite",
                    rawInput: { todos: [{ content: "New task", status: "pending" }] },
                    timestamp: Date.now(),
                },
            ];
            const todos = findLatestTodos(messages);
            expect(todos.length).toBe(1);
            expect(todos[0].content).toBe("New task");
        });

        it("should skip empty todo lists", () => {
            const messages: ChatMessage[] = [
                {
                    id: "1",
                    type: MessageType.ToolUse,
                    toolUseId: "tool-1",
                    toolName: "TodoWrite",
                    rawInput: { todos: [{ content: "Task", status: "pending" }] },
                    timestamp: Date.now() - 1000,
                },
                {
                    id: "2",
                    type: MessageType.ToolUse,
                    toolUseId: "tool-2",
                    toolName: "TodoWrite",
                    rawInput: { todos: [] },
                    timestamp: Date.now(),
                },
            ];
            const todos = findLatestTodos(messages);
            expect(todos.length).toBe(1);
            expect(todos[0].content).toBe("Task");
        });
    });

    describe("findTodosInLastTurn", () => {
        it("should return empty array when no messages", () => {
            const messages: ChatMessage[] = [];
            expect(findTodosInLastTurn(messages)).toEqual([]);
        });

        it("should return empty array when no user messages", () => {
            const messages: ChatMessage[] = [
                {
                    id: "1",
                    type: MessageType.ToolUse,
                    toolUseId: "tool-1",
                    toolName: "TodoWrite",
                    rawInput: { todos: [{ content: "Task 1", status: "pending" }] },
                    timestamp: Date.now(),
                },
            ];
            expect(findTodosInLastTurn(messages)).toEqual([]);
        });

        it("should find todos in the last user turn", () => {
            const messages: ChatMessage[] = [
                { id: "1", type: MessageType.User, content: "Create tasks", timestamp: Date.now() },
                {
                    id: "2",
                    type: MessageType.ToolUse,
                    toolUseId: "tool-1",
                    toolName: "TodoWrite",
                    rawInput: {
                        todos: [
                            { content: "Task 1", status: "pending" },
                            { content: "Task 2", status: "completed" },
                        ],
                    },
                    timestamp: Date.now(),
                },
            ];
            const todos = findTodosInLastTurn(messages);
            expect(todos.length).toBe(2);
            expect(todos[0].content).toBe("Task 1");
        });

        it("should NOT find todos from previous user turns", () => {
            const messages: ChatMessage[] = [
                // First user turn - has todos
                {
                    id: "1",
                    type: MessageType.User,
                    content: "Create tasks",
                    timestamp: Date.now() - 2000,
                },
                {
                    id: "2",
                    type: MessageType.ToolUse,
                    toolUseId: "tool-1",
                    toolName: "TodoWrite",
                    rawInput: { todos: [{ content: "Old Task", status: "pending" }] },
                    timestamp: Date.now() - 1900,
                },
                {
                    id: "3",
                    type: MessageType.Assistant,
                    content: "Created tasks",
                    timestamp: Date.now() - 1800,
                    isStreaming: false,
                },
                // Second user turn - no todos
                {
                    id: "4",
                    type: MessageType.User,
                    content: "What time is it?",
                    timestamp: Date.now() - 1000,
                },
                {
                    id: "5",
                    type: MessageType.Assistant,
                    content: "It is 10:00 AM",
                    timestamp: Date.now() - 900,
                    isStreaming: false,
                },
            ];
            const todos = findTodosInLastTurn(messages);
            // Should return empty because the last user turn (message 4) has no TodoWrite
            expect(todos).toEqual([]);
        });

        it("should find todos when they are in the most recent user turn", () => {
            const messages: ChatMessage[] = [
                // First user turn - no todos
                { id: "1", type: MessageType.User, content: "Hello", timestamp: Date.now() - 2000 },
                {
                    id: "2",
                    type: MessageType.Assistant,
                    content: "Hi there!",
                    timestamp: Date.now() - 1900,
                    isStreaming: false,
                },
                // Second user turn - has todos
                {
                    id: "3",
                    type: MessageType.User,
                    content: "Create tasks",
                    timestamp: Date.now() - 1000,
                },
                {
                    id: "4",
                    type: MessageType.ToolUse,
                    toolUseId: "tool-1",
                    toolName: "TodoWrite",
                    rawInput: { todos: [{ content: "New Task", status: "pending" }] },
                    timestamp: Date.now() - 900,
                },
            ];
            const todos = findTodosInLastTurn(messages);
            expect(todos.length).toBe(1);
            expect(todos[0].content).toBe("New Task");
        });

        it("should return the latest TodoWrite in the current turn", () => {
            const messages: ChatMessage[] = [
                {
                    id: "1",
                    type: MessageType.User,
                    content: "Create tasks",
                    timestamp: Date.now() - 1000,
                },
                {
                    id: "2",
                    type: MessageType.ToolUse,
                    toolUseId: "tool-1",
                    toolName: "TodoWrite",
                    rawInput: { todos: [{ content: "First", status: "pending" }] },
                    timestamp: Date.now() - 900,
                },
                {
                    id: "3",
                    type: MessageType.ToolUse,
                    toolUseId: "tool-2",
                    toolName: "TodoWrite",
                    rawInput: { todos: [{ content: "Second", status: "pending" }] },
                    timestamp: Date.now() - 800,
                },
            ];
            const todos = findTodosInLastTurn(messages);
            expect(todos.length).toBe(1);
            expect(todos[0].content).toBe("Second");
        });

        it("should skip empty todo lists and find non-empty ones", () => {
            const messages: ChatMessage[] = [
                {
                    id: "1",
                    type: MessageType.User,
                    content: "Clear tasks",
                    timestamp: Date.now() - 1000,
                },
                {
                    id: "2",
                    type: MessageType.ToolUse,
                    toolUseId: "tool-1",
                    toolName: "TodoWrite",
                    rawInput: { todos: [{ content: "Task", status: "pending" }] },
                    timestamp: Date.now() - 900,
                },
                {
                    id: "3",
                    type: MessageType.ToolUse,
                    toolUseId: "tool-2",
                    toolName: "TodoWrite",
                    rawInput: { todos: [] },
                    timestamp: Date.now() - 800,
                },
            ];
            const todos = findTodosInLastTurn(messages);
            // Should return the non-empty one since we skip empty todo lists
            expect(todos.length).toBe(1);
            expect(todos[0].content).toBe("Task");
        });
    });

    describe("mapConversationList", () => {
        it("should map conversation items", () => {
            const items = [
                {
                    filename: "conv-1",
                    preview: "Hello world",
                    timestamp: "2024-01-15T10:00:00Z",
                    messageCount: 5,
                },
            ];
            const result = mapConversationList(items);
            expect(result.length).toBe(1);
            expect(result[0].id).toBe("conv-1");
            expect(result[0].title).toBe("Hello world");
            expect(result[0].messageCount).toBe(5);
        });

        it("should use id when filename is missing", () => {
            const items = [{ id: "my-id", preview: "Test" }];
            const result = mapConversationList(items);
            expect(result[0].id).toBe("my-id");
        });

        it("should use sessionId when filename and id are missing", () => {
            const items = [{ sessionId: "session-123", preview: "Test" }];
            const result = mapConversationList(items);
            expect(result[0].id).toBe("session-123");
        });

        it("should generate id from index when all identifiers are missing", () => {
            const items = [{ preview: "Test" }];
            const result = mapConversationList(items);
            expect(result[0].id).toBe("conversation-0");
        });

        it("should default preview to Conversation", () => {
            const items = [{ filename: "conv-1" }];
            const result = mapConversationList(items);
            expect(result[0].title).toBe("Conversation");
            expect(result[0].preview).toBe("Conversation");
        });

        it("should handle startTime for timestamp", () => {
            const items = [{ filename: "conv-1", startTime: "2024-01-15T10:00:00Z" }];
            const result = mapConversationList(items);
            expect(result[0].updatedAt).toBe(Date.parse("2024-01-15T10:00:00Z"));
        });

        it("should handle endTime for timestamp", () => {
            const items = [{ filename: "conv-1", endTime: "2024-01-15T12:00:00Z" }];
            const result = mapConversationList(items);
            expect(result[0].updatedAt).toBe(Date.parse("2024-01-15T12:00:00Z"));
        });

        it("should include optional fields", () => {
            const items = [
                {
                    filename: "conv-1",
                    preview: "Test",
                    totalCost: 0.05,
                    sessionId: "session-abc",
                    tags: ["important", "work"],
                },
            ];
            const result = mapConversationList(items);
            expect(result[0].totalCost).toBe(0.05);
            expect(result[0].sessionId).toBe("session-abc");
            expect(result[0].tags).toEqual(["important", "work"]);
        });

        it("should filter non-string tags", () => {
            const items = [
                {
                    filename: "conv-1",
                    preview: "Test",
                    tags: ["valid", 123, null, "also-valid"],
                },
            ];
            const result = mapConversationList(items);
            expect(result[0].tags).toEqual(["valid", "also-valid"]);
        });

        it("should handle multiple items", () => {
            const items = [
                { filename: "conv-1", preview: "First", messageCount: 3 },
                { filename: "conv-2", preview: "Second", messageCount: 7 },
                { filename: "conv-3", preview: "Third", messageCount: 1 },
            ];
            const result = mapConversationList(items);
            expect(result.length).toBe(3);
            expect(result[1].id).toBe("conv-2");
            expect(result[2].messageCount).toBe(1);
        });
    });
});
