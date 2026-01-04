/**
 * MCP Store
 *
 * Manages MCP (Model Context Protocol) servers and their state.
 * Handles server configuration, status, and tools.
 *
 * @module stores/mcpStore
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ToolDefinition } from "../types";

// ============================================================================
// Types
// ============================================================================

/**
 * MCP server status
 */
export type MCPServerStatus = "disconnected" | "connecting" | "connected" | "error" | "disabled";

/**
 * MCP server configuration
 */
export type MCPServerType = "http" | "sse" | "stdio";

export interface MCPServerConfig {
    /** Unique server identifier */
    id: string;
    /** Display name */
    name: string;
    /** Server type */
    type?: MCPServerType;
    /** Server command to execute */
    command?: string;
    /** Command arguments */
    args?: string[];
    /** Environment variables */
    env?: Record<string, string>;
    /** Working directory */
    cwd?: string;
    /** HTTP/SSE server URL */
    url?: string;
    /** HTTP/SSE headers */
    headers?: Record<string, string>;
    /** Whether the server is enabled */
    enabled: boolean;
    /** Server description */
    description?: string;
    /** Server icon (URL or emoji) */
    icon?: string;
}

/**
 * MCP server runtime state
 */
export interface MCPServerState {
    /** Server configuration */
    config: MCPServerConfig;
    /** Current status */
    status: MCPServerStatus;
    /** Error message if in error state */
    error?: string;
    /** Available tools from this server */
    tools: ToolDefinition[];
    /** Last connection timestamp */
    lastConnected?: number;
    /** Connection retry count */
    retryCount: number;
}

/**
 * MCP store state
 */
export interface MCPState {
    /** All configured MCP servers */
    servers: MCPServerState[];
    /** Currently selected server ID (for UI) */
    selectedServerId: string | null;
}

/**
 * MCP store actions
 */
export interface MCPActions {
    /** Add a new MCP server */
    addServer: (config: MCPServerConfig) => void;
    /** Update an existing server configuration */
    updateServer: (id: string, updates: Partial<MCPServerConfig>) => void;
    /** Delete a server by ID */
    deleteServer: (id: string) => void;
    /** Toggle server enabled state */
    toggleServer: (id: string) => void;
    /** Set server status */
    setServerStatus: (id: string, status: MCPServerStatus, error?: string) => void;
    /** Set server tools */
    setServerTools: (id: string, tools: ToolDefinition[]) => void;
    /** Set selected server */
    setSelectedServer: (id: string | null) => void;
    /** Get server by ID */
    getServerById: (id: string) => MCPServerState | undefined;
    /** Get all enabled servers */
    getEnabledServers: () => MCPServerState[];
    /** Get all connected servers */
    getConnectedServers: () => MCPServerState[];
    /** Increment retry count for a server */
    incrementRetryCount: (id: string) => void;
    /** Reset retry count for a server */
    resetRetryCount: (id: string) => void;
    /** Update server connection timestamp */
    updateLastConnected: (id: string) => void;
    /** Reset all servers to disconnected */
    resetAllServers: () => void;
    /** Import server configurations */
    importServers: (configs: MCPServerConfig[]) => void;
    /** Export server configurations */
    exportServers: () => MCPServerConfig[];
}

export type MCPStore = MCPState & MCPActions;

// ============================================================================
// Initial State
// ============================================================================

const initialState: MCPState = {
    servers: [],
    selectedServerId: null,
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * Create initial server state from config
 */
const createServerState = (config: MCPServerConfig): MCPServerState => {
    const normalizedConfig = {
        ...config,
        type: config.type ?? "stdio",
    };

    return {
        config: normalizedConfig,
        status: normalizedConfig.enabled ? "disconnected" : "disabled",
        tools: [],
        retryCount: 0,
    };
};

// ============================================================================
// Store
// ============================================================================

/**
 * MCP store for managing Model Context Protocol servers
 */
export const useMCPStore = create<MCPStore>()(
    persist(
        (set, get) => ({
            ...initialState,

            addServer: (config) =>
                set((state) => ({
                    servers: [...state.servers, createServerState(config)],
                })),

            updateServer: (id, updates) =>
                set((state) => ({
                    servers: state.servers.map((server) =>
                        server.config.id === id
                            ? {
                                  ...server,
                                  config: { ...server.config, ...updates },
                              }
                            : server,
                    ),
                })),

            deleteServer: (id) =>
                set((state) => ({
                    servers: state.servers.filter((server) => server.config.id !== id),
                    selectedServerId: state.selectedServerId === id ? null : state.selectedServerId,
                })),

            toggleServer: (id) =>
                set((state) => ({
                    servers: state.servers.map((server) =>
                        server.config.id === id
                            ? {
                                  ...server,
                                  config: { ...server.config, enabled: !server.config.enabled },
                                  status: server.config.enabled ? "disabled" : "disconnected",
                              }
                            : server,
                    ),
                })),

            setServerStatus: (id, status, error) =>
                set((state) => ({
                    servers: state.servers.map((server) =>
                        server.config.id === id ? { ...server, status, error } : server,
                    ),
                })),

            setServerTools: (id, tools) =>
                set((state) => ({
                    servers: state.servers.map((server) =>
                        server.config.id === id ? { ...server, tools } : server,
                    ),
                })),

            setSelectedServer: (id) => set({ selectedServerId: id }),

            getServerById: (id) => {
                const state = get();
                return state.servers.find((server) => server.config.id === id);
            },

            getEnabledServers: () => {
                const state = get();
                return state.servers.filter((server) => server.config.enabled);
            },

            getConnectedServers: () => {
                const state = get();
                return state.servers.filter((server) => server.status === "connected");
            },

            incrementRetryCount: (id) =>
                set((state) => ({
                    servers: state.servers.map((server) =>
                        server.config.id === id
                            ? { ...server, retryCount: server.retryCount + 1 }
                            : server,
                    ),
                })),

            resetRetryCount: (id) =>
                set((state) => ({
                    servers: state.servers.map((server) =>
                        server.config.id === id ? { ...server, retryCount: 0 } : server,
                    ),
                })),

            updateLastConnected: (id) =>
                set((state) => ({
                    servers: state.servers.map((server) =>
                        server.config.id === id ? { ...server, lastConnected: Date.now() } : server,
                    ),
                })),

            resetAllServers: () =>
                set((state) => ({
                    servers: state.servers.map((server) => ({
                        ...server,
                        status: server.config.enabled ? "disconnected" : "disabled",
                        error: undefined,
                        tools: [],
                        retryCount: 0,
                    })),
                })),

            importServers: (configs) =>
                set((state) => {
                    const existingIds = new Set(state.servers.map((s) => s.config.id));
                    const newServers = configs
                        .filter((config) => !existingIds.has(config.id))
                        .map(createServerState);
                    return {
                        servers: [...state.servers, ...newServers],
                    };
                }),

            exportServers: () => {
                const state = get();
                return state.servers.map((server) => server.config);
            },
        }),
        {
            name: "claude-flow-mcp-store",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                // Only persist server configurations
                servers: state.servers.map((server) => ({
                    config: server.config,
                    status: "disconnected" as MCPServerStatus,
                    tools: [],
                    retryCount: 0,
                })),
            }),
        },
    ),
);

// ============================================================================
// Selectors
// ============================================================================

/**
 * Select all servers
 */
export const selectServers = (state: MCPStore) => state.servers;

/**
 * Select enabled servers
 */
export const selectEnabledServers = (state: MCPStore) =>
    state.servers.filter((s) => s.config.enabled);

/**
 * Select connected servers
 */
export const selectConnectedServers = (state: MCPStore) =>
    state.servers.filter((s) => s.status === "connected");

/**
 * Select selected server
 */
export const selectSelectedServer = (state: MCPStore) =>
    state.servers.find((s) => s.config.id === state.selectedServerId);

/**
 * Select server by ID
 */
export const selectServerById = (id: string) => (state: MCPStore) =>
    state.servers.find((s) => s.config.id === id);

/**
 * Select all available tools across all servers
 */
export const selectAllTools = (state: MCPStore) =>
    state.servers.filter((s) => s.status === "connected").flatMap((s) => s.tools);

/**
 * Select server count
 */
export const selectServerCount = (state: MCPStore) => ({
    total: state.servers.length,
    enabled: state.servers.filter((s) => s.config.enabled).length,
    connected: state.servers.filter((s) => s.status === "connected").length,
});

/**
 * Select servers with errors
 */
export const selectServersWithErrors = (state: MCPStore) =>
    state.servers.filter((s) => s.status === "error");
