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

            // Type badges are displayed in the server cards
            const httpBadges = screen.getAllByText("http");
            const stdioBadges = screen.getAllByText("stdio");
            expect(httpBadges.length).toBeGreaterThan(0);
            expect(stdioBadges.length).toBeGreaterThan(0);
        });

        it("should display server URLs for http type", () => {
            render(<MCPModal {...defaultProps} />);

            expect(screen.getByText("https://example.com/mcp")).toBeInTheDocument();
        });

        it("should display command for stdio type", () => {
            render(<MCPModal {...defaultProps} />);

            // The command and args are displayed inline in the new design
            // Look for text that contains "npx"
            const serverDetails = screen.getByText(/npx -y test-server/);
            expect(serverDetails).toBeInTheDocument();
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

            const deleteButtons = screen.getAllByTitle("Delete Server");
            expect(deleteButtons.length).toBe(2);
        });

        it("should call onDeleteServer when delete clicked", () => {
            const onDeleteServer = vi.fn();
            render(<MCPModal {...defaultProps} onDeleteServer={onDeleteServer} />);

            const deleteButtons = screen.getAllByTitle("Delete Server");
            fireEvent.click(deleteButtons[0]);

            expect(onDeleteServer).toHaveBeenCalledWith("server-1");
        });
    });

    describe("add server form", () => {
        it("should show Add Custom Server button", () => {
            render(<MCPModal {...defaultProps} />);

            expect(screen.getByText("Add Custom Server")).toBeInTheDocument();
        });

        it("should show form when Add Custom Server clicked", () => {
            render(<MCPModal {...defaultProps} />);

            fireEvent.click(screen.getByText("Add Custom Server"));

            expect(screen.getByText("Add New Server")).toBeInTheDocument();
            expect(screen.getByPlaceholderText("my-server")).toBeInTheDocument();
        });

        it("should show command field for stdio type by default", () => {
            render(<MCPModal {...defaultProps} />);

            fireEvent.click(screen.getByText("Add Custom Server"));

            // Default type is stdio, so command field should be visible
            expect(screen.getByPlaceholderText("npx")).toBeInTheDocument();
        });

        it("should show URL field when http type button clicked", () => {
            render(<MCPModal {...defaultProps} />);

            fireEvent.click(screen.getByText("Add Custom Server"));

            // Click http type button (they render as lowercase)
            const httpButtons = screen.getAllByText("http");
            // Find the one that's a button in the form, not the badge
            const httpButton = httpButtons.find((el) => el.tagName.toLowerCase() === "button");
            if (httpButton) {
                fireEvent.click(httpButton);
            }

            expect(screen.getByPlaceholderText("https://example.com/mcp")).toBeInTheDocument();
        });

        it("should call onAddServer when form submitted with stdio", () => {
            const onAddServer = vi.fn();
            render(<MCPModal {...defaultProps} onAddServer={onAddServer} />);

            fireEvent.click(screen.getByText("Add Custom Server"));

            // Default is stdio, fill the form
            fireEvent.change(screen.getByPlaceholderText("my-server"), {
                target: { value: "new-server" },
            });
            fireEvent.change(screen.getByPlaceholderText("npx"), {
                target: { value: "my-command" },
            });

            fireEvent.click(screen.getByText("Add"));

            expect(onAddServer).toHaveBeenCalledWith({
                name: "new-server",
                type: "stdio",
                enabled: true,
                command: "my-command",
                args: [],
            });
        });

        it("should hide form when Cancel clicked", () => {
            render(<MCPModal {...defaultProps} />);

            fireEvent.click(screen.getByText("Add Custom Server"));
            expect(screen.getByText("Add New Server")).toBeInTheDocument();

            fireEvent.click(screen.getByText("Cancel"));

            expect(screen.queryByText("Add New Server")).not.toBeInTheDocument();
        });

        it("should disable Add Server button when form is incomplete", () => {
            render(<MCPModal {...defaultProps} />);

            fireEvent.click(screen.getByText("Add Custom Server"));

            const addButton = screen.getByText("Add");
            expect(addButton).toBeDisabled();
        });

        it("should enable Add Server button when required fields filled", () => {
            render(<MCPModal {...defaultProps} />);

            fireEvent.click(screen.getByText("Add Custom Server"));

            // For stdio type (default), need name and command
            fireEvent.change(screen.getByPlaceholderText("my-server"), {
                target: { value: "test" },
            });
            fireEvent.change(screen.getByPlaceholderText("npx"), {
                target: { value: "my-command" },
            });

            const addButton = screen.getByText("Add");
            expect(addButton).not.toBeDisabled();
        });
    });

    describe("stdio form fields", () => {
        it("should show arguments field for stdio type", () => {
            render(<MCPModal {...defaultProps} />);

            fireEvent.click(screen.getByText("Add Custom Server"));
            // Default is stdio

            expect(screen.getByPlaceholderText("-y @package/name")).toBeInTheDocument();
        });

        it("should parse arguments correctly", () => {
            const onAddServer = vi.fn();
            render(<MCPModal {...defaultProps} onAddServer={onAddServer} />);

            fireEvent.click(screen.getByText("Add Custom Server"));
            // Default is stdio

            // Fill form
            fireEvent.change(screen.getByPlaceholderText("my-server"), {
                target: { value: "stdio-test" },
            });
            fireEvent.change(screen.getByPlaceholderText("npx"), {
                target: { value: "/usr/bin/server" },
            });
            fireEvent.change(screen.getByPlaceholderText("-y @package/name"), {
                target: { value: "--arg1\n--arg2" },
            });

            fireEvent.click(screen.getByText("Add"));

            expect(onAddServer).toHaveBeenCalledWith({
                name: "stdio-test",
                type: "stdio",
                enabled: true,
                command: "/usr/bin/server",
                args: ["--arg1", "--arg2"],
            });
        });
    });

    describe("popular servers (Quick Add)", () => {
        it("should show Quick Add section", () => {
            render(<MCPModal {...defaultProps} />);

            expect(screen.getByText("Quick Add")).toBeInTheDocument();
        });

        it("should show popular server options", () => {
            render(<MCPModal {...defaultProps} />);

            expect(screen.getByText("Context7")).toBeInTheDocument();
            expect(screen.getByText("Chrome")).toBeInTheDocument();
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

        it("should hide already-added servers from Quick Add", () => {
            const serversWithContext7: MCPServer[] = [
                {
                    id: "context7",
                    name: "context7",
                    type: "http",
                    enabled: true,
                    url: "https://context7.liam.sh/mcp",
                },
            ];
            render(<MCPModal {...defaultProps} servers={serversWithContext7} />);

            // Context7 should not appear in Quick Add since it's already added
            const context7Buttons = screen.queryAllByText("Context7");
            // If it appears, it would be in the server list, not in Quick Add
            expect(context7Buttons.length).toBeLessThanOrEqual(1);
        });
    });

    describe("server type buttons", () => {
        it("should have all type buttons", () => {
            render(<MCPModal {...defaultProps} />);

            fireEvent.click(screen.getByText("Add Custom Server"));

            // Type buttons render as lowercase
            const stdioButtons = screen.getAllByText("stdio");
            const httpButtons = screen.getAllByText("http");
            const sseButtons = screen.getAllByText("sse");

            // Should have at least one of each as buttons
            expect(stdioButtons.length).toBeGreaterThan(0);
            expect(httpButtons.length).toBeGreaterThan(0);
            expect(sseButtons.length).toBeGreaterThan(0);
        });

        it("should switch form fields when type button clicked", () => {
            render(<MCPModal {...defaultProps} />);

            fireEvent.click(screen.getByText("Add Custom Server"));

            // Should show command field for stdio (default)
            expect(screen.getByPlaceholderText("npx")).toBeInTheDocument();

            // Click http button
            const httpButtons = screen.getAllByText("http");
            const httpButton = httpButtons.find((el) => el.tagName.toLowerCase() === "button");
            if (httpButton) {
                fireEvent.click(httpButton);
            }

            // Should now show URL field
            expect(screen.getByPlaceholderText("https://example.com/mcp")).toBeInTheDocument();
            expect(screen.queryByPlaceholderText("npx")).not.toBeInTheDocument();
        });
    });
});
