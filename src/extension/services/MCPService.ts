import * as vscode from "vscode";
import * as path from "path";
import { convertToWSLPath as convertToWSLPathUtil } from "../utils";

/**
 * MCP server configuration
 */
export type MCPServerType = "http" | "sse" | "stdio";

export interface MCPServerConfig {
    type?: MCPServerType;
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    cwd?: string;
    url?: string;
    headers?: Record<string, string>;
    enabled?: boolean;
}

/**
 * MCP configuration structure
 */
export interface MCPConfig {
    mcpServers: Record<string, MCPServerConfig>;
}

/**
 * Service for managing MCP (Model Context Protocol) server configurations
 * Handles reading, writing, and updating MCP server settings
 */
export class MCPService implements vscode.Disposable {
    private _mcpConfigPath: string | undefined;

    constructor(private readonly _context: vscode.ExtensionContext) {
        this.initializeConfig();
    }

    /**
     * Get the MCP config file path
     */
    public getConfigPath(): string | undefined {
        return this._mcpConfigPath;
    }

    /**
     * Initialize MCP configuration
     */
    public async initializeConfig(): Promise<void> {
        try {
            const storagePath = this._context.storageUri?.fsPath;
            if (!storagePath) {
                return;
            }

            // Create MCP config directory
            const mcpConfigDir = path.join(storagePath, "mcp");
            try {
                await vscode.workspace.fs.stat(vscode.Uri.file(mcpConfigDir));
            } catch {
                await vscode.workspace.fs.createDirectory(vscode.Uri.file(mcpConfigDir));
                console.log(`Created MCP config directory at: ${mcpConfigDir}`);
            }

            this._mcpConfigPath = path.join(mcpConfigDir, "mcp-servers.json");

            // Load existing config or create new one
            let mcpConfig: MCPConfig = { mcpServers: {} };
            const mcpConfigUri = vscode.Uri.file(this._mcpConfigPath);

            try {
                const existingContent = await vscode.workspace.fs.readFile(mcpConfigUri);
                mcpConfig = JSON.parse(new TextDecoder().decode(existingContent));
                console.log("Loaded existing MCP config");
            } catch {
                console.log("No existing MCP config found, creating new one with default servers");
                // Seed with popular servers by default
                mcpConfig = {
                    mcpServers: {
                        chrome: {
                            type: "stdio",
                            command: "npx",
                            args: ["-y", "@anthropics/mcp-server-chrome"],
                            enabled: true,
                        },
                        context7: {
                            type: "http",
                            url: "https://context7.liam.sh/mcp",
                            enabled: true,
                        },
                        "sequential-thinking": {
                            type: "stdio",
                            command: "npx",
                            args: ["-y", "@modelcontextprotocol/server-sequential-thinking"],
                            enabled: true,
                        },
                        memory: {
                            type: "stdio",
                            command: "npx",
                            args: ["-y", "@modelcontextprotocol/server-memory"],
                            enabled: true,
                        },
                        puppeteer: {
                            type: "stdio",
                            command: "npx",
                            args: ["-y", "@modelcontextprotocol/server-puppeteer"],
                            enabled: true,
                        },
                        fetch: {
                            type: "stdio",
                            command: "npx",
                            args: ["-y", "@modelcontextprotocol/server-fetch"],
                            enabled: true,
                        },
                        filesystem: {
                            type: "stdio",
                            command: "npx",
                            args: ["-y", "@modelcontextprotocol/server-filesystem"],
                            enabled: true,
                        },
                    },
                };
            }

            // Ensure mcpServers exists
            if (!mcpConfig.mcpServers) {
                mcpConfig.mcpServers = {};
            }

            // Remove legacy permissions server if it exists
            if (mcpConfig.mcpServers["claude-code-chat-permissions"]) {
                delete mcpConfig.mcpServers["claude-code-chat-permissions"];
                console.log("Removed legacy permissions MCP server (now using stdio)");
            }

            await this._saveConfig(mcpConfig);
            console.log(`Updated MCP config at: ${this._mcpConfigPath}`);
        } catch (error) {
            console.error("Failed to initialize MCP config:", error);
        }
    }

    /**
     * Load all MCP servers
     */
    public async loadServers(): Promise<Record<string, MCPServerConfig>> {
        try {
            if (!this._mcpConfigPath) {
                return {};
            }

            const mcpConfigUri = vscode.Uri.file(this._mcpConfigPath);

            try {
                const content = await vscode.workspace.fs.readFile(mcpConfigUri);
                const mcpConfig: MCPConfig = JSON.parse(new TextDecoder().decode(content));

                // Filter out internal servers
                const filteredServers = Object.fromEntries(
                    Object.entries(mcpConfig.mcpServers || {}).filter(
                        ([name]) => name !== "claude-code-chat-permissions",
                    ),
                );

                return filteredServers;
            } catch (error) {
                console.log("MCP config file not found or error reading:", error);
                return {};
            }
        } catch (error) {
            console.error("Error loading MCP servers:", error);
            return {};
        }
    }

    /**
     * Save an MCP server configuration
     */
    public async saveServer(name: string, config: MCPServerConfig): Promise<void> {
        try {
            if (!this._mcpConfigPath) {
                throw new Error("Storage path not available");
            }

            const mcpConfig = await this._loadConfig();
            mcpConfig.mcpServers[name] = config;

            await this._saveConfig(mcpConfig);
            console.log(`Saved MCP server: ${name}`);
        } catch (error) {
            console.error("Error saving MCP server:", error);
            throw error;
        }
    }

    /**
     * Delete an MCP server configuration
     */
    public async deleteServer(name: string): Promise<void> {
        try {
            if (!this._mcpConfigPath) {
                return;
            }

            const mcpConfig = await this._loadConfig();
            delete mcpConfig.mcpServers[name];

            await this._saveConfig(mcpConfig);
            console.log(`Deleted MCP server: ${name}`);
        } catch (error) {
            console.error("Error deleting MCP server:", error);
            throw error;
        }
    }

    /**
     * Update an MCP server configuration
     */
    public async updateServer(name: string, config: Partial<MCPServerConfig>): Promise<void> {
        try {
            if (!this._mcpConfigPath) {
                return;
            }

            const mcpConfig = await this._loadConfig();

            if (mcpConfig.mcpServers[name]) {
                mcpConfig.mcpServers[name] = {
                    ...mcpConfig.mcpServers[name],
                    ...config,
                };

                await this._saveConfig(mcpConfig);
                console.log(`Updated MCP server: ${name}`);
            }
        } catch (error) {
            console.error("Error updating MCP server:", error);
            throw error;
        }
    }

    /**
     * Check if an MCP server exists
     */
    public async hasServer(name: string): Promise<boolean> {
        try {
            const servers = await this.loadServers();
            return name in servers;
        } catch {
            return false;
        }
    }

    /**
     * Convert a Windows path to WSL path if needed
     * @deprecated Use convertToWSLPath from ../utils instead
     */
    public convertToWSLPath(windowsPath: string): string {
        return convertToWSLPathUtil(windowsPath);
    }

    /**
     * Dispose of resources
     */
    public dispose(): void {
        // Nothing to dispose
    }

    // ==================== Private Methods ====================

    private async _loadConfig(): Promise<MCPConfig> {
        if (!this._mcpConfigPath) {
            return { mcpServers: {} };
        }

        try {
            const mcpConfigUri = vscode.Uri.file(this._mcpConfigPath);
            const content = await vscode.workspace.fs.readFile(mcpConfigUri);
            return JSON.parse(new TextDecoder().decode(content));
        } catch {
            return { mcpServers: {} };
        }
    }

    private async _saveConfig(config: MCPConfig): Promise<void> {
        if (!this._mcpConfigPath) {
            return;
        }

        const mcpConfigUri = vscode.Uri.file(this._mcpConfigPath);
        const content = new TextEncoder().encode(JSON.stringify(config, null, 2));
        await vscode.workspace.fs.writeFile(mcpConfigUri, content);
    }
}
