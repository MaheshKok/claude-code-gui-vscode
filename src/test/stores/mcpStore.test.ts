import { describe, it, expect, beforeEach } from "vitest";
import { useMCPStore, type MCPServerConfig } from "../../webview/stores/mcpStore";

describe("mcpStore", () => {
    const mockServerConfig: MCPServerConfig = {
        id: "test-server-1",
        name: "Test Server",
        command: "npx",
        args: ["test-server"],
        enabled: true,
        description: "A test server",
        type: "stdio",
    };

    beforeEach(() => {
        // Reset the store before each test
        useMCPStore.setState({
            servers: [],
            selectedServerId: null,
        });
    });

    describe("initial state", () => {
        it("should have empty servers array", () => {
            expect(useMCPStore.getState().servers).toEqual([]);
        });

        it("should have null selectedServerId", () => {
            expect(useMCPStore.getState().selectedServerId).toBeNull();
        });
    });

    describe("addServer", () => {
        it("should add a server", () => {
            useMCPStore.getState().addServer(mockServerConfig);
            const servers = useMCPStore.getState().servers;
            expect(servers.length).toBe(1);
            expect(servers[0].config.id).toBe("test-server-1");
            expect(servers[0].status).toBe("disconnected");
        });

        it("should add a disabled server with disabled status", () => {
            const disabledConfig = { ...mockServerConfig, enabled: false };
            useMCPStore.getState().addServer(disabledConfig);
            expect(useMCPStore.getState().servers[0].status).toBe("disabled");
        });
    });

    describe("updateServer", () => {
        beforeEach(() => {
            useMCPStore.getState().addServer(mockServerConfig);
        });

        it("should update server configuration", () => {
            useMCPStore.getState().updateServer("test-server-1", { name: "Updated Name" });
            expect(useMCPStore.getState().servers[0].config.name).toBe("Updated Name");
        });

        it("should not modify other servers", () => {
            const secondConfig = { ...mockServerConfig, id: "test-server-2", name: "Second" };
            useMCPStore.getState().addServer(secondConfig);
            useMCPStore.getState().updateServer("test-server-1", { name: "Updated" });
            expect(useMCPStore.getState().servers[1].config.name).toBe("Second");
        });
    });

    describe("deleteServer", () => {
        beforeEach(() => {
            useMCPStore.getState().addServer(mockServerConfig);
        });

        it("should delete a server", () => {
            useMCPStore.getState().deleteServer("test-server-1");
            expect(useMCPStore.getState().servers.length).toBe(0);
        });

        it("should clear selectedServerId if deleted server was selected", () => {
            useMCPStore.getState().setSelectedServer("test-server-1");
            useMCPStore.getState().deleteServer("test-server-1");
            expect(useMCPStore.getState().selectedServerId).toBeNull();
        });

        it("should not clear selectedServerId if different server was deleted", () => {
            const secondConfig = { ...mockServerConfig, id: "test-server-2" };
            useMCPStore.getState().addServer(secondConfig);
            useMCPStore.getState().setSelectedServer("test-server-2");
            useMCPStore.getState().deleteServer("test-server-1");
            expect(useMCPStore.getState().selectedServerId).toBe("test-server-2");
        });
    });

    describe("toggleServer", () => {
        beforeEach(() => {
            useMCPStore.getState().addServer(mockServerConfig);
        });

        it("should toggle server from enabled to disabled", () => {
            useMCPStore.getState().toggleServer("test-server-1");
            const server = useMCPStore.getState().servers[0];
            expect(server.config.enabled).toBe(false);
            expect(server.status).toBe("disabled");
        });

        it("should toggle server from disabled to enabled", () => {
            useMCPStore.getState().toggleServer("test-server-1");
            useMCPStore.getState().toggleServer("test-server-1");
            const server = useMCPStore.getState().servers[0];
            expect(server.config.enabled).toBe(true);
            expect(server.status).toBe("disconnected");
        });
    });

    describe("setServerStatus", () => {
        beforeEach(() => {
            useMCPStore.getState().addServer(mockServerConfig);
        });

        it("should set server status", () => {
            useMCPStore.getState().setServerStatus("test-server-1", "connected");
            expect(useMCPStore.getState().servers[0].status).toBe("connected");
        });

        it("should set server status with error", () => {
            useMCPStore.getState().setServerStatus("test-server-1", "error", "Connection failed");
            const server = useMCPStore.getState().servers[0];
            expect(server.status).toBe("error");
            expect(server.error).toBe("Connection failed");
        });
    });

    describe("setServerTools", () => {
        beforeEach(() => {
            useMCPStore.getState().addServer(mockServerConfig);
        });

        it("should set server tools", () => {
            const tools = [{ name: "tool1", description: "A tool", inputSchema: {} }];
            useMCPStore.getState().setServerTools("test-server-1", tools);
            expect(useMCPStore.getState().servers[0].tools).toEqual(tools);
        });
    });

    describe("getServerById", () => {
        beforeEach(() => {
            useMCPStore.getState().addServer(mockServerConfig);
        });

        it("should return server by id", () => {
            const server = useMCPStore.getState().getServerById("test-server-1");
            expect(server?.config.id).toBe("test-server-1");
        });

        it("should return undefined for non-existent server", () => {
            const server = useMCPStore.getState().getServerById("non-existent");
            expect(server).toBeUndefined();
        });
    });

    describe("getEnabledServers", () => {
        it("should return only enabled servers", () => {
            useMCPStore.getState().addServer(mockServerConfig);
            useMCPStore
                .getState()
                .addServer({ ...mockServerConfig, id: "disabled", enabled: false });
            const enabled = useMCPStore.getState().getEnabledServers();
            expect(enabled.length).toBe(1);
            expect(enabled[0].config.id).toBe("test-server-1");
        });
    });

    describe("getConnectedServers", () => {
        beforeEach(() => {
            useMCPStore.getState().addServer(mockServerConfig);
        });

        it("should return only connected servers", () => {
            useMCPStore.getState().setServerStatus("test-server-1", "connected");
            const connected = useMCPStore.getState().getConnectedServers();
            expect(connected.length).toBe(1);
        });

        it("should return empty array when no servers connected", () => {
            const connected = useMCPStore.getState().getConnectedServers();
            expect(connected.length).toBe(0);
        });
    });

    describe("retry count management", () => {
        beforeEach(() => {
            useMCPStore.getState().addServer(mockServerConfig);
        });

        it("should increment retry count", () => {
            useMCPStore.getState().incrementRetryCount("test-server-1");
            expect(useMCPStore.getState().servers[0].retryCount).toBe(1);
            useMCPStore.getState().incrementRetryCount("test-server-1");
            expect(useMCPStore.getState().servers[0].retryCount).toBe(2);
        });

        it("should reset retry count", () => {
            useMCPStore.getState().incrementRetryCount("test-server-1");
            useMCPStore.getState().incrementRetryCount("test-server-1");
            useMCPStore.getState().resetRetryCount("test-server-1");
            expect(useMCPStore.getState().servers[0].retryCount).toBe(0);
        });
    });

    describe("updateLastConnected", () => {
        beforeEach(() => {
            useMCPStore.getState().addServer(mockServerConfig);
        });

        it("should update last connected timestamp", () => {
            const before = Date.now();
            useMCPStore.getState().updateLastConnected("test-server-1");
            const after = Date.now();
            const lastConnected = useMCPStore.getState().servers[0].lastConnected;
            expect(lastConnected).toBeGreaterThanOrEqual(before);
            expect(lastConnected).toBeLessThanOrEqual(after);
        });
    });

    describe("resetAllServers", () => {
        it("should reset all servers to disconnected", () => {
            useMCPStore.getState().addServer(mockServerConfig);
            useMCPStore.getState().setServerStatus("test-server-1", "connected");
            useMCPStore
                .getState()
                .setServerTools("test-server-1", [
                    { name: "tool", description: "", inputSchema: {} },
                ]);
            useMCPStore.getState().incrementRetryCount("test-server-1");

            useMCPStore.getState().resetAllServers();

            const server = useMCPStore.getState().servers[0];
            expect(server.status).toBe("disconnected");
            expect(server.tools).toEqual([]);
            expect(server.retryCount).toBe(0);
        });

        it("should keep disabled servers as disabled", () => {
            useMCPStore.getState().addServer({ ...mockServerConfig, enabled: false });
            useMCPStore.getState().resetAllServers();
            expect(useMCPStore.getState().servers[0].status).toBe("disabled");
        });
    });

    describe("importServers", () => {
        it("should import new servers", () => {
            const configs = [
                mockServerConfig,
                { ...mockServerConfig, id: "new-server", name: "New" },
            ];
            useMCPStore.getState().importServers(configs);
            expect(useMCPStore.getState().servers.length).toBe(2);
        });

        it("should not import duplicate servers", () => {
            useMCPStore.getState().addServer(mockServerConfig);
            useMCPStore.getState().importServers([mockServerConfig]);
            expect(useMCPStore.getState().servers.length).toBe(1);
        });
    });

    describe("exportServers", () => {
        it("should export server configurations", () => {
            useMCPStore.getState().addServer(mockServerConfig);
            const exported = useMCPStore.getState().exportServers();
            expect(exported.length).toBe(1);
            expect(exported[0]).toEqual(mockServerConfig);
        });
    });

    describe("selectedServer", () => {
        it("should set selected server", () => {
            useMCPStore.getState().setSelectedServer("test-id");
            expect(useMCPStore.getState().selectedServerId).toBe("test-id");
        });

        it("should clear selected server", () => {
            useMCPStore.getState().setSelectedServer("test-id");
            useMCPStore.getState().setSelectedServer(null);
            expect(useMCPStore.getState().selectedServerId).toBeNull();
        });
    });
});
