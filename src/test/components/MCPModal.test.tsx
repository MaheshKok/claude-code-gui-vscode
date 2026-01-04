import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MCPModal } from "../../webview/components/Modals/MCPModal";
import type { MCPServer } from "../../webview/components/Modals/MCPModal";

describe("MCPModal", () => {
    const mockServers: MCPServer[] = [
        {
            id: "server-1",
            name: "test-server",
            type: "http",
            enabled: true,
            url: "https://example.com/mcp",
        },
        {
            id: "server-2",
            name: "stdio-server",
            type: "stdio",
            enabled: false,
            command: "npx",
            args: ["-y", "test-server"],
        },
    ];

    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        servers: mockServers,
        onToggleServer: vi.fn(),
        onDeleteServer: vi.fn(),
        onAddServer: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("rendering", () => {
        it("should render modal when open", () => {
            render(<MCPModal {...defaultProps} />);

            expect(screen.getByText("MCP Servers")).toBeInTheDocument();
        });

        it("should not render when closed", () => {
            render(<MCPModal {...defaultProps} isOpen={false} />);

            expect(screen.queryByText("MCP Servers")).not.toBeInTheDocument();
        });

        it("should display empty message when no servers", () => {
            render(<MCPModal {...defaultProps} servers={[]} />);

            expect(screen.getByText("No MCP servers configured")).toBeInTheDocument();
        });

        it("should display server names", () => {
            render(<MCPModal {...defaultProps} />);

            expect(screen.getByText("test-server")).toBeInTheDocument();
            expect(screen.getByText("stdio-server")).toBeInTheDocument();
        });

        it("should display server types", () => {
            render(<MCPModal {...defaultProps} />);

            expect(screen.getByText("http")).toBeInTheDocument();
            expect(screen.getByText("stdio")).toBeInTheDocument();
        });

        it("should display server URLs for http type", () => {
            render(<MCPModal {...defaultProps} />);

            expect(screen.getByText("https://example.com/mcp")).toBeInTheDocument();
        });

        it("should display command for stdio type", () => {
            render(<MCPModal {...defaultProps} />);

            expect(screen.getByText("npx")).toBeInTheDocument();
        });
    });

    describe("server toggle", () => {
        it("should show toggle for each server", () => {
            render(<MCPModal {...defaultProps} />);

            const checkboxes = screen.getAllByRole("checkbox");
            expect(checkboxes.length).toBe(2);
        });

        it("should show enabled state correctly", () => {
            render(<MCPModal {...defaultProps} />);

            const checkboxes = screen.getAllByRole("checkbox");
            expect(checkboxes[0]).toBeChecked(); // test-server is enabled
            expect(checkboxes[1]).not.toBeChecked(); // stdio-server is disabled
        });

        it("should call onToggleServer when toggle clicked", () => {
            const onToggleServer = vi.fn();
            render(<MCPModal {...defaultProps} onToggleServer={onToggleServer} />);

            const checkboxes = screen.getAllByRole("checkbox");
            fireEvent.click(checkboxes[0]);

            expect(onToggleServer).toHaveBeenCalledWith("server-1", false);
        });
    });

    describe("server deletion", () => {
        it("should show delete button for each server", () => {
            render(<MCPModal {...defaultProps} />);

            const deleteButtons = screen.getAllByLabelText("Delete server");
            expect(deleteButtons.length).toBe(2);
        });

        it("should call onDeleteServer when delete clicked", () => {
            const onDeleteServer = vi.fn();
            render(<MCPModal {...defaultProps} onDeleteServer={onDeleteServer} />);

            const deleteButtons = screen.getAllByLabelText("Delete server");
            fireEvent.click(deleteButtons[0]);

            expect(onDeleteServer).toHaveBeenCalledWith("server-1");
        });
    });

    describe("add server form", () => {
        it("should show Add MCP Server button", () => {
            render(<MCPModal {...defaultProps} />);

            expect(screen.getByText("+ Add MCP Server")).toBeInTheDocument();
        });

        it("should show form when Add MCP Server clicked", () => {
            render(<MCPModal {...defaultProps} />);

            fireEvent.click(screen.getByText("+ Add MCP Server"));

            expect(screen.getByLabelText("Server Name")).toBeInTheDocument();
            expect(screen.getByLabelText("Server Type")).toBeInTheDocument();
        });

        it("should show URL field for http type", () => {
            render(<MCPModal {...defaultProps} />);

            fireEvent.click(screen.getByText("+ Add MCP Server"));

            expect(screen.getByLabelText("URL")).toBeInTheDocument();
        });

        it("should show command field for stdio type", () => {
            render(<MCPModal {...defaultProps} />);

            fireEvent.click(screen.getByText("+ Add MCP Server"));

            // Change type to stdio
            const typeSelect = screen.getByLabelText("Server Type");
            fireEvent.change(typeSelect, { target: { value: "stdio" } });

            expect(screen.getByLabelText("Command")).toBeInTheDocument();
            expect(screen.getByLabelText("Arguments (one per line)")).toBeInTheDocument();
        });

        it("should call onAddServer when form submitted", () => {
            const onAddServer = vi.fn();
            render(<MCPModal {...defaultProps} onAddServer={onAddServer} />);

            fireEvent.click(screen.getByText("+ Add MCP Server"));

            // Fill form
            fireEvent.change(screen.getByLabelText("Server Name"), {
                target: { value: "new-server" },
            });
            fireEvent.change(screen.getByLabelText("URL"), {
                target: { value: "https://new.com/mcp" },
            });

            fireEvent.click(screen.getByText("Add Server"));

            expect(onAddServer).toHaveBeenCalledWith({
                name: "new-server",
                type: "http",
                enabled: true,
                url: "https://new.com/mcp",
            });
        });

        it("should hide form when Cancel clicked", () => {
            render(<MCPModal {...defaultProps} />);

            fireEvent.click(screen.getByText("+ Add MCP Server"));
            expect(screen.getByLabelText("Server Name")).toBeInTheDocument();

            fireEvent.click(screen.getByText("Cancel"));

            expect(screen.queryByLabelText("Server Name")).not.toBeInTheDocument();
        });

        it("should disable Add Server button when form is incomplete", () => {
            render(<MCPModal {...defaultProps} />);

            fireEvent.click(screen.getByText("+ Add MCP Server"));

            const addButton = screen.getByText("Add Server");
            expect(addButton).toBeDisabled();
        });

        it("should enable Add Server button when required fields filled", () => {
            render(<MCPModal {...defaultProps} />);

            fireEvent.click(screen.getByText("+ Add MCP Server"));

            fireEvent.change(screen.getByLabelText("Server Name"), {
                target: { value: "test" },
            });
            fireEvent.change(screen.getByLabelText("URL"), {
                target: { value: "https://test.com" },
            });

            const addButton = screen.getByText("Add Server");
            expect(addButton).not.toBeDisabled();
        });
    });

    describe("stdio form fields", () => {
        it("should show environment variables field for stdio type", () => {
            render(<MCPModal {...defaultProps} />);

            fireEvent.click(screen.getByText("+ Add MCP Server"));

            const typeSelect = screen.getByLabelText("Server Type");
            fireEvent.change(typeSelect, { target: { value: "stdio" } });

            expect(
                screen.getByLabelText("Environment Variables (KEY=value, one per line)"),
            ).toBeInTheDocument();
        });

        it("should parse environment variables correctly", () => {
            const onAddServer = vi.fn();
            render(<MCPModal {...defaultProps} onAddServer={onAddServer} />);

            fireEvent.click(screen.getByText("+ Add MCP Server"));

            // Switch to stdio type
            fireEvent.change(screen.getByLabelText("Server Type"), {
                target: { value: "stdio" },
            });

            // Fill form
            fireEvent.change(screen.getByLabelText("Server Name"), {
                target: { value: "stdio-test" },
            });
            fireEvent.change(screen.getByLabelText("Command"), {
                target: { value: "/usr/bin/server" },
            });
            fireEvent.change(screen.getByLabelText("Arguments (one per line)"), {
                target: { value: "--arg1\n--arg2" },
            });
            fireEvent.change(
                screen.getByLabelText("Environment Variables (KEY=value, one per line)"),
                {
                    target: { value: "API_KEY=secret\nPORT=3000" },
                },
            );

            fireEvent.click(screen.getByText("Add Server"));

            expect(onAddServer).toHaveBeenCalledWith({
                name: "stdio-test",
                type: "stdio",
                enabled: true,
                command: "/usr/bin/server",
                args: ["--arg1", "--arg2"],
                env: { API_KEY: "secret", PORT: "3000" },
            });
        });
    });

    describe("http form fields", () => {
        it("should show headers field for http type", () => {
            render(<MCPModal {...defaultProps} />);

            fireEvent.click(screen.getByText("+ Add MCP Server"));

            expect(screen.getByLabelText("Headers (KEY=value, one per line)")).toBeInTheDocument();
        });

        it("should parse headers correctly", () => {
            const onAddServer = vi.fn();
            render(<MCPModal {...defaultProps} onAddServer={onAddServer} />);

            fireEvent.click(screen.getByText("+ Add MCP Server"));

            // Fill form with headers
            fireEvent.change(screen.getByLabelText("Server Name"), {
                target: { value: "http-test" },
            });
            fireEvent.change(screen.getByLabelText("URL"), {
                target: { value: "https://api.example.com" },
            });
            fireEvent.change(screen.getByLabelText("Headers (KEY=value, one per line)"), {
                target: { value: "Authorization=Bearer token123" },
            });

            fireEvent.click(screen.getByText("Add Server"));

            expect(onAddServer).toHaveBeenCalledWith({
                name: "http-test",
                type: "http",
                enabled: true,
                url: "https://api.example.com",
                headers: { Authorization: "Bearer token123" },
            });
        });
    });

    describe("popular servers", () => {
        it("should show Popular MCP Servers section", () => {
            render(<MCPModal {...defaultProps} />);

            expect(screen.getByText("Popular MCP Servers")).toBeInTheDocument();
        });

        it("should show popular server options", () => {
            render(<MCPModal {...defaultProps} />);

            expect(screen.getByText("Context7")).toBeInTheDocument();
            expect(screen.getByText("Sequential Thinking")).toBeInTheDocument();
            expect(screen.getByText("Memory")).toBeInTheDocument();
            expect(screen.getByText("Puppeteer")).toBeInTheDocument();
            expect(screen.getByText("Fetch")).toBeInTheDocument();
            expect(screen.getByText("Filesystem")).toBeInTheDocument();
        });

        it("should call onAddServer when popular server clicked", () => {
            const onAddServer = vi.fn();
            render(<MCPModal {...defaultProps} onAddServer={onAddServer} />);

            fireEvent.click(screen.getByText("Context7"));

            expect(onAddServer).toHaveBeenCalledWith({
                name: "context7",
                enabled: true,
                type: "http",
                url: "https://context7.liam.sh/mcp",
            });
        });

        it("should add stdio server correctly", () => {
            const onAddServer = vi.fn();
            render(<MCPModal {...defaultProps} onAddServer={onAddServer} />);

            fireEvent.click(screen.getByText("Memory"));

            expect(onAddServer).toHaveBeenCalledWith({
                name: "memory",
                enabled: true,
                type: "stdio",
                command: "npx",
                args: ["-y", "@modelcontextprotocol/server-memory"],
            });
        });
    });

    describe("server type select", () => {
        it("should have all type options", () => {
            render(<MCPModal {...defaultProps} />);

            fireEvent.click(screen.getByText("+ Add MCP Server"));

            const typeSelect = screen.getByLabelText("Server Type");
            expect(typeSelect).toBeInTheDocument();

            // Check options
            const options = typeSelect.querySelectorAll("option");
            const optionValues = Array.from(options).map((opt) => opt.value);
            expect(optionValues).toContain("http");
            expect(optionValues).toContain("sse");
            expect(optionValues).toContain("stdio");
        });
    });
});
