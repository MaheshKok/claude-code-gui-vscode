import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import {
    useConnectMCPServer,
    useDisconnectMCPServer,
    useRefreshMCPServer,
    useUpdateMCPConfig,
} from "../../webview/mutations/useMCPMutations";
import { useMCPStore } from "../../webview/stores/mcpStore";

describe("useMCPMutations", () => {
    const createMockServerConfig = (id: string, name: string) => ({
        id,
        name,
        command: "node",
        args: ["server.js"],
        enabled: true,
    });

    beforeEach(() => {
        vi.clearAllMocks();
        useMCPStore.setState({
            servers: [],
            loading: false,
            error: null,
        });
    });

    describe("useConnectMCPServer", () => {
        it("should set server status to connecting", async () => {
            useMCPStore.getState().addServer(createMockServerConfig("server-1", "Test Server"));
            expect(useMCPStore.getState().servers[0].status).toBe("disconnected");

            const { result } = renderHook(() => useConnectMCPServer());

            await act(async () => {
                result.current.mutate({ serverId: "server-1" });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(useMCPStore.getState().servers[0].status).toBe("connecting");
        });

        it("should set isPending during mutation", async () => {
            useMCPStore.getState().addServer(createMockServerConfig("server-1", "Test Server"));
            const { result } = renderHook(() => useConnectMCPServer());

            act(() => {
                result.current.mutate({ serverId: "server-1" });
            });

            await waitFor(() => {
                expect(result.current.isPending).toBe(false);
            });
        });
    });

    describe("useDisconnectMCPServer", () => {
        it("should set server status to disconnected", async () => {
            useMCPStore.getState().addServer(createMockServerConfig("server-1", "Test Server"));
            useMCPStore.getState().setServerStatus("server-1", "connected");
            expect(useMCPStore.getState().servers[0].status).toBe("connected");

            const { result } = renderHook(() => useDisconnectMCPServer());

            await act(async () => {
                result.current.mutate({ serverId: "server-1" });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(useMCPStore.getState().servers[0].status).toBe("disconnected");
        });
    });

    describe("useRefreshMCPServer", () => {
        it("should set server status to connecting for refresh", async () => {
            useMCPStore.getState().addServer(createMockServerConfig("server-1", "Test Server"));
            useMCPStore.getState().setServerStatus("server-1", "connected");

            const { result } = renderHook(() => useRefreshMCPServer());

            await act(async () => {
                result.current.mutate({ serverId: "server-1" });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(useMCPStore.getState().servers[0].status).toBe("connecting");
        });
    });

    describe("useUpdateMCPConfig", () => {
        it("should update server configuration", async () => {
            useMCPStore.getState().addServer(createMockServerConfig("server-1", "Test Server"));

            const { result } = renderHook(() => useUpdateMCPConfig());

            await act(async () => {
                result.current.mutate({
                    serverId: "server-1",
                    config: { description: "Updated description" },
                });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(useMCPStore.getState().servers[0].config.description).toBe(
                "Updated description",
            );
        });

        it("should preserve existing configuration when updating", async () => {
            const serverConfig = createMockServerConfig("server-1", "Test Server");
            serverConfig.description = "Original desc";
            useMCPStore.getState().addServer(serverConfig);

            const { result } = renderHook(() => useUpdateMCPConfig());

            await act(async () => {
                result.current.mutate({
                    serverId: "server-1",
                    config: { icon: "🔌" },
                });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(useMCPStore.getState().servers[0].config.description).toBe("Original desc");
            expect(useMCPStore.getState().servers[0].config.icon).toBe("🔌");
        });
    });
});
