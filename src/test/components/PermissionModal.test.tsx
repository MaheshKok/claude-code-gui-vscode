import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PermissionModal } from "../../webview/components/Modals/PermissionModal";
import type { PermissionRequest } from "../../webview/components/Modals/PermissionModal";

describe("PermissionModal", () => {
    const mockRequest: PermissionRequest = {
        id: "req-1",
        toolName: "Bash",
        input: { command: "npm install" },
        description: "Run npm install command",
    };

    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        request: mockRequest,
        onAllow: vi.fn(),
        onDeny: vi.fn(),
        onAlwaysAllow: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("rendering", () => {
        it("should render modal when open with request", () => {
            render(<PermissionModal {...defaultProps} />);

            expect(screen.getByRole("dialog")).toBeInTheDocument();
        });

        it("should not render when closed", () => {
            render(<PermissionModal {...defaultProps} isOpen={false} />);

            expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        });

        it("should not render when request is null", () => {
            render(<PermissionModal {...defaultProps} request={null} />);

            expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        });

        it("should display tool name", () => {
            render(<PermissionModal {...defaultProps} />);

            expect(screen.getByText(/Bash/)).toBeInTheDocument();
        });

        it("should display description if provided", () => {
            render(<PermissionModal {...defaultProps} />);

            expect(screen.getByText("Run npm install command")).toBeInTheDocument();
        });

        it("should display input as JSON", () => {
            render(<PermissionModal {...defaultProps} />);

            expect(screen.getByText(/"command": "npm install"/)).toBeInTheDocument();
        });

        it("should render Allow button", () => {
            render(<PermissionModal {...defaultProps} />);

            expect(screen.getByText("Allow")).toBeInTheDocument();
        });

        it("should render Deny button", () => {
            render(<PermissionModal {...defaultProps} />);

            expect(screen.getByText("Deny")).toBeInTheDocument();
        });
    });

    describe("allow action", () => {
        it("should call onAllow with request id when Allow clicked", () => {
            const onAllow = vi.fn();
            render(<PermissionModal {...defaultProps} onAllow={onAllow} />);

            fireEvent.click(screen.getByText("Allow"));

            expect(onAllow).toHaveBeenCalledWith("req-1");
        });

        it("should call onClose after allowing", () => {
            const onClose = vi.fn();
            render(<PermissionModal {...defaultProps} onClose={onClose} />);

            fireEvent.click(screen.getByText("Allow"));

            expect(onClose).toHaveBeenCalled();
        });
    });

    describe("deny action", () => {
        it("should show deny reason input when Deny clicked first", () => {
            render(<PermissionModal {...defaultProps} />);

            fireEvent.click(screen.getByText("Deny"));

            // Should show the deny reason input
            expect(screen.getByText("Confirm Deny")).toBeInTheDocument();
            expect(screen.getByPlaceholderText(/explain why/i)).toBeInTheDocument();
        });

        it("should call onDeny with request id when Confirm Deny clicked", () => {
            const onDeny = vi.fn();
            render(<PermissionModal {...defaultProps} onDeny={onDeny} />);

            // First click shows the confirm dialog
            fireEvent.click(screen.getByText("Deny"));
            // Second click confirms
            fireEvent.click(screen.getByText("Confirm Deny"));

            expect(onDeny).toHaveBeenCalledWith("req-1", undefined);
        });

        it("should call onClose after confirming deny", () => {
            const onClose = vi.fn();
            render(<PermissionModal {...defaultProps} onClose={onClose} />);

            fireEvent.click(screen.getByText("Deny"));
            fireEvent.click(screen.getByText("Confirm Deny"));

            expect(onClose).toHaveBeenCalled();
        });

        it("should include deny reason when provided", () => {
            const onDeny = vi.fn();
            render(<PermissionModal {...defaultProps} onDeny={onDeny} />);

            fireEvent.click(screen.getByText("Deny"));
            const reasonInput = screen.getByPlaceholderText(/explain why/i);
            fireEvent.change(reasonInput, { target: { value: "Security concern" } });
            fireEvent.click(screen.getByText("Confirm Deny"));

            expect(onDeny).toHaveBeenCalledWith("req-1", "Security concern");
        });
    });

    describe("always allow action", () => {
        it("should show always allow link", () => {
            render(<PermissionModal {...defaultProps} />);

            expect(screen.getByText("Always allow this pattern...")).toBeInTheDocument();
        });

        it("should show pattern input when link clicked", () => {
            render(<PermissionModal {...defaultProps} />);

            fireEvent.click(screen.getByText("Always allow this pattern..."));

            expect(screen.getByLabelText(/Pattern to always allow/)).toBeInTheDocument();
        });

        it("should pre-fill pattern with default for Bash", () => {
            render(<PermissionModal {...defaultProps} />);

            fireEvent.click(screen.getByText("Always allow this pattern..."));

            const input = screen.getByLabelText(/Pattern to always allow/) as HTMLInputElement;
            expect(input.value).toBe("npm *");
        });

        it("should show Always Allow Pattern button", () => {
            render(<PermissionModal {...defaultProps} />);

            fireEvent.click(screen.getByText("Always allow this pattern..."));

            expect(screen.getByText("Always Allow Pattern")).toBeInTheDocument();
        });

        it("should disable Always Allow Pattern button when pattern is empty", () => {
            render(<PermissionModal {...defaultProps} />);

            fireEvent.click(screen.getByText("Always allow this pattern..."));

            const input = screen.getByLabelText(/Pattern to always allow/);
            fireEvent.change(input, { target: { value: "" } });

            const button = screen.getByText("Always Allow Pattern");
            expect(button).toBeDisabled();
        });

        it("should call onAlwaysAllow when button clicked with pattern", () => {
            const onAlwaysAllow = vi.fn();
            const onClose = vi.fn();
            render(
                <PermissionModal
                    {...defaultProps}
                    onAlwaysAllow={onAlwaysAllow}
                    onClose={onClose}
                />,
            );

            fireEvent.click(screen.getByText("Always allow this pattern..."));

            const input = screen.getByLabelText(/Pattern to always allow/);
            fireEvent.change(input, { target: { value: "npm install *" } });

            fireEvent.click(screen.getByText("Always Allow Pattern"));

            expect(onAlwaysAllow).toHaveBeenCalledWith("req-1", "npm install *");
            expect(onClose).toHaveBeenCalled();
        });

        it("should show Cancel button in always allow mode", () => {
            render(<PermissionModal {...defaultProps} />);

            fireEvent.click(screen.getByText("Always allow this pattern..."));

            expect(screen.getByText("Cancel")).toBeInTheDocument();
        });

        it("should hide always allow mode when Cancel clicked", () => {
            render(<PermissionModal {...defaultProps} />);

            fireEvent.click(screen.getByText("Always allow this pattern..."));
            fireEvent.click(screen.getByText("Cancel"));

            expect(screen.queryByLabelText(/Pattern to always allow/)).not.toBeInTheDocument();
            expect(screen.getByText("Always allow this pattern...")).toBeInTheDocument();
        });
    });

    describe("default pattern generation", () => {
        it("should generate pattern for non-Bash tools", () => {
            const request: PermissionRequest = {
                id: "req-2",
                toolName: "Read",
                input: { file_path: "/test/file.ts" },
            };

            render(<PermissionModal {...defaultProps} request={request} />);

            fireEvent.click(screen.getByText("Always allow this pattern..."));

            const input = screen.getByLabelText(/Pattern to always allow/) as HTMLInputElement;
            expect(input.value).toBe("Read");
        });

        it("should generate wildcard pattern for Bash commands", () => {
            const request: PermissionRequest = {
                id: "req-3",
                toolName: "Bash",
                input: { command: "git status --porcelain" },
            };

            render(<PermissionModal {...defaultProps} request={request} />);

            fireEvent.click(screen.getByText("Always allow this pattern..."));

            const input = screen.getByLabelText(/Pattern to always allow/) as HTMLInputElement;
            expect(input.value).toBe("git *");
        });
    });

    describe("keyboard shortcuts", () => {
        it("should close on Escape key", () => {
            const onClose = vi.fn();
            render(<PermissionModal {...defaultProps} onClose={onClose} />);

            fireEvent.keyDown(document, { key: "Escape" });

            expect(onClose).toHaveBeenCalled();
        });
    });

    describe("request types", () => {
        it("should handle Bash command requests", () => {
            render(<PermissionModal {...defaultProps} />);

            // Check that the command is displayed somewhere in the modal
            const codeElements = document.querySelectorAll("code, pre");
            const hasCommand = Array.from(codeElements).some((el) =>
                el.textContent?.includes("npm install"),
            );
            expect(hasCommand || screen.getAllByText(/npm install/).length > 0).toBe(true);
        });

        it("should handle requests without description", () => {
            const requestNoDesc: PermissionRequest = {
                id: "req-2",
                toolName: "Read",
                input: { file_path: "/src/index.ts" },
            };

            render(<PermissionModal {...defaultProps} request={requestNoDesc} />);

            expect(screen.getByText(/Read/)).toBeInTheDocument();
        });

        it("should handle complex input objects", () => {
            const complexRequest: PermissionRequest = {
                id: "req-3",
                toolName: "Edit",
                input: {
                    file_path: "/src/file.ts",
                    old_string: "const a = 1",
                    new_string: "const b = 2",
                },
            };

            render(<PermissionModal {...defaultProps} request={complexRequest} />);

            expect(screen.getByText(/file_path/)).toBeInTheDocument();
        });
    });
});
