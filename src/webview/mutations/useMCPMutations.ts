/**
 * MCP Mutations
 *
 * Mutation hooks for MCP (Model Context Protocol) server management
 * including connection, disconnection, and configuration.
 *
 * Note: MCP operations are primarily local state management. The extension
 * handles actual MCP server connections through its own mechanisms.
 *
 * @module mutations/useMCPMutations
 */

import { useOptimisticMutation } from "./useMutation";
import { useMCPStore, type MCPServerState, type MCPServerConfig } from "../stores/mcpStore";
import type { MutationResult } from "./types";

// Alias types
type MCPServer = MCPServerState;

// ============================================================================
// Type Definitions
// ============================================================================

interface ConnectServerVariables {
    serverId: string;
}

interface DisconnectServerVariables {
    serverId: string;
}

interface RefreshServerVariables {
    serverId: string;
}

interface UpdateConfigVariables {
    serverId: string;
    config: Partial<MCPServerConfig>;
}

// ============================================================================
// useConnectMCPServer
// ============================================================================

/**
 * Mutation hook for connecting to an MCP server
 *
 * @example
 * ```tsx
 * const { mutate: connectServer, isPending } = useConnectMCPServer();
 *
 * const handleConnect = (serverId: string) => {
 *   connectServer({ serverId });
 * };
 * ```
 */
export function useConnectMCPServer(): MutationResult<void, ConnectServerVariables, Error> {
    const setServerStatus = useMCPStore((state) => state.setServerStatus);
    const servers = useMCPStore((state) => state.servers);

    return useOptimisticMutation<void, ConnectServerVariables, MCPServer[]>({
        mutationFn: async () => {},
        getSnapshot: () => [...servers],
        optimisticUpdate: (variables) => {
            setServerStatus(variables.serverId, "connecting");
        },
        rollback: (previousServers) => {
            useMCPStore.setState({ servers: previousServers });
        },
        onSuccess: (_data, variables) => {
            console.log("[useConnectMCPServer] Connecting to:", variables.serverId);
        },
        onError: (error, variables) => {
            console.error("[useConnectMCPServer] Failed:", variables.serverId, error);
            setServerStatus(variables.serverId, "error");
        },
    });
}

// ============================================================================
// useDisconnectMCPServer
// ============================================================================

/**
 * Mutation hook for disconnecting from an MCP server
 *
 * @example
 * ```tsx
 * const { mutate: disconnectServer } = useDisconnectMCPServer();
 *
 * const handleDisconnect = (serverId: string) => {
 *   disconnectServer({ serverId });
 * };
 * ```
 */
export function useDisconnectMCPServer(): MutationResult<void, DisconnectServerVariables, Error> {
    const setServerStatus = useMCPStore((state) => state.setServerStatus);
    const servers = useMCPStore((state) => state.servers);

    return useOptimisticMutation<void, DisconnectServerVariables, MCPServer[]>({
        mutationFn: async () => {},
        getSnapshot: () => [...servers],
        optimisticUpdate: (variables) => {
            setServerStatus(variables.serverId, "disconnected");
        },
        rollback: (previousServers) => {
            useMCPStore.setState({ servers: previousServers });
        },
        onSuccess: (_data, variables) => {
            console.log("[useDisconnectMCPServer] Disconnected:", variables.serverId);
        },
    });
}

// ============================================================================
// useRefreshMCPServer
// ============================================================================

/**
 * Mutation hook for refreshing an MCP server's tools and resources
 *
 * @example
 * ```tsx
 * const { mutate: refreshServer, isPending } = useRefreshMCPServer();
 *
 * const handleRefresh = (serverId: string) => {
 *   refreshServer({ serverId });
 * };
 * ```
 */
export function useRefreshMCPServer(): MutationResult<void, RefreshServerVariables, Error> {
    const setServerStatus = useMCPStore((state) => state.setServerStatus);
    const servers = useMCPStore((state) => state.servers);

    return useOptimisticMutation<void, RefreshServerVariables, MCPServer[]>({
        mutationFn: async () => {},
        getSnapshot: () => [...servers],
        optimisticUpdate: (variables) => {
            setServerStatus(variables.serverId, "connecting");
        },
        rollback: (previousServers) => {
            useMCPStore.setState({ servers: previousServers });
        },
        onSuccess: (_data, variables) => {
            console.log("[useRefreshMCPServer] Refreshing:", variables.serverId);
        },
        onError: (error, variables) => {
            console.error("[useRefreshMCPServer] Refresh failed:", variables.serverId, error);
        },
    });
}

// ============================================================================
// useUpdateMCPConfig
// ============================================================================

/**
 * Mutation hook for updating MCP server configuration
 *
 * @example
 * ```tsx
 * const { mutate: updateConfig } = useUpdateMCPConfig();
 *
 * updateConfig({
 *   serverId: "server-1",
 *   config: { autoConnect: true, timeout: 30000 },
 * });
 * ```
 */
export function useUpdateMCPConfig(): MutationResult<void, UpdateConfigVariables, Error> {
    const updateServer = useMCPStore((state) => state.updateServer);
    const servers = useMCPStore((state) => state.servers);

    return useOptimisticMutation<void, UpdateConfigVariables, MCPServer[]>({
        mutationFn: async () => {},
        getSnapshot: () => [...servers],
        optimisticUpdate: (variables) => {
            updateServer(variables.serverId, variables.config);
        },
        rollback: (previousServers) => {
            useMCPStore.setState({ servers: previousServers });
        },
        onSuccess: (_data, variables) => {
            console.log("[useUpdateMCPConfig] Config updated:", variables.serverId);
        },
    });
}
