import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { ConversationSearch } from "../../webview/components/History/ConversationSearch";

describe("ConversationSearch", () => {
    const defaultProps = {
        onSearch: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("rendering", () => {
        it("should render search input", () => {
            render(<ConversationSearch {...defaultProps} />);

            expect(screen.getByRole("textbox")).toBeInTheDocument();
        });

        it("should render with default placeholder", () => {
            render(<ConversationSearch {...defaultProps} />);

            expect(screen.getByPlaceholderText("Search conversations...")).toBeInTheDocument();
        });

        it("should render with custom placeholder", () => {
            render(<ConversationSearch {...defaultProps} placeholder="Find something..." />);

            expect(screen.getByPlaceholderText("Find something...")).toBeInTheDocument();
        });

        it("should have aria-label", () => {
            render(<ConversationSearch {...defaultProps} />);

            expect(screen.getByLabelText("Search conversations")).toBeInTheDocument();
        });

        it("should auto-focus when autoFocus is true", () => {
            render(<ConversationSearch {...defaultProps} autoFocus={true} />);

            expect(screen.getByRole("textbox")).toHaveFocus();
        });
    });

    describe("clear button", () => {
        it("should not show clear button when empty", () => {
            render(<ConversationSearch {...defaultProps} />);

            expect(screen.queryByLabelText("Clear search")).not.toBeInTheDocument();
        });

        it("should show clear button when input has value", () => {
            render(<ConversationSearch {...defaultProps} />);

            const input = screen.getByRole("textbox");
            fireEvent.change(input, { target: { value: "test" } });

            expect(screen.getByLabelText("Clear search")).toBeInTheDocument();
        });

        it("should clear input when clear button clicked", () => {
            render(<ConversationSearch {...defaultProps} />);

            const input = screen.getByRole("textbox");
            fireEvent.change(input, { target: { value: "test" } });

            fireEvent.click(screen.getByLabelText("Clear search"));

            expect(input).toHaveValue("");
        });

        it("should call onSearch with empty string when cleared", () => {
            const onSearch = vi.fn();
            render(<ConversationSearch {...defaultProps} onSearch={onSearch} />);

            const input = screen.getByRole("textbox");
            fireEvent.change(input, { target: { value: "test" } });

            fireEvent.click(screen.getByLabelText("Clear search"));

            expect(onSearch).toHaveBeenCalledWith("");
        });
    });

    describe("debounced search", () => {
        it("should call onSearch after debounce delay", async () => {
            const onSearch = vi.fn();
            render(<ConversationSearch {...defaultProps} onSearch={onSearch} debounceMs={300} />);

            const input = screen.getByRole("textbox");
            fireEvent.change(input, { target: { value: "test" } });

            // Should not be called immediately
            expect(onSearch).not.toHaveBeenCalled();

            // Advance time past debounce
            act(() => {
                vi.advanceTimersByTime(300);
            });

            expect(onSearch).toHaveBeenCalledWith("test");
        });

        it("should debounce multiple rapid changes", () => {
            const onSearch = vi.fn();
            render(<ConversationSearch {...defaultProps} onSearch={onSearch} debounceMs={300} />);

            const input = screen.getByRole("textbox");

            // Rapid changes
            fireEvent.change(input, { target: { value: "t" } });
            act(() => {
                vi.advanceTimersByTime(100);
            });

            fireEvent.change(input, { target: { value: "te" } });
            act(() => {
                vi.advanceTimersByTime(100);
            });

            fireEvent.change(input, { target: { value: "test" } });
            act(() => {
                vi.advanceTimersByTime(300);
            });

            // Should only be called once with final value
            expect(onSearch).toHaveBeenCalledTimes(1);
            expect(onSearch).toHaveBeenCalledWith("test");
        });

        it("should use custom debounce delay", () => {
            const onSearch = vi.fn();
            render(<ConversationSearch {...defaultProps} onSearch={onSearch} debounceMs={500} />);

            const input = screen.getByRole("textbox");
            fireEvent.change(input, { target: { value: "test" } });

            // Not called at 300ms
            act(() => {
                vi.advanceTimersByTime(300);
            });
            expect(onSearch).not.toHaveBeenCalled();

            // Called at 500ms
            act(() => {
                vi.advanceTimersByTime(200);
            });
            expect(onSearch).toHaveBeenCalledWith("test");
        });
    });

    describe("keyboard handling", () => {
        it("should clear input on Escape key when input has value", () => {
            const onSearch = vi.fn();
            render(<ConversationSearch {...defaultProps} onSearch={onSearch} />);

            const input = screen.getByRole("textbox");
            fireEvent.change(input, { target: { value: "test" } });

            fireEvent.keyDown(input, { key: "Escape" });

            expect(input).toHaveValue("");
            expect(onSearch).toHaveBeenCalledWith("");
        });

        it("should not clear on Escape when input is empty", () => {
            const onSearch = vi.fn();
            render(<ConversationSearch {...defaultProps} onSearch={onSearch} />);

            const input = screen.getByRole("textbox");
            fireEvent.keyDown(input, { key: "Escape" });

            // onSearch should not be called directly (only through debounce)
            // The clear handler is not invoked for empty input
        });
    });

    describe("focus management", () => {
        it("should focus input after clearing", () => {
            render(<ConversationSearch {...defaultProps} />);

            const input = screen.getByRole("textbox");
            fireEvent.change(input, { target: { value: "test" } });

            fireEvent.click(screen.getByLabelText("Clear search"));

            expect(input).toHaveFocus();
        });
    });
});
