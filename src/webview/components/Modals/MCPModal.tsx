import React, { useState, useCallback } from "react";
import { Modal } from "./Modal";
import { Trash2, Terminal, Plus, X } from "lucide-react";

export type MCPServerType = "http" | "sse" | "stdio";

export interface MCPServer {
    id: string;
    name: string;
    type: MCPServerType;
    enabled: boolean;
    url?: string;
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    headers?: Record<string, string>;
}

export interface PopularServer {
    name: string;
    icon: string;
    description: string;
    config: Partial<MCPServer>;
}

const POPULAR_SERVERS: PopularServer[] = [
    {
        name: "Context7",
        icon: "📚",
        description: "Up-to-date Code Docs For Any Prompt",
        config: { type: "http", url: "https://context7.liam.sh/mcp" },
    },
    {
        name: "Sequential Thinking",
        icon: "🔗",
        description: "Step-by-step reasoning capabilities",
        config: {
            type: "stdio",
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-sequential-thinking"],
        },
    },
    {
        name: "Memory",
        icon: "🧠",
        description: "Knowledge graph storage",
        config: {
            type: "stdio",
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-memory"],
        },
    },
    {
        name: "Puppeteer",
        icon: "🎭",
        description: "Browser automation",
        config: {
            type: "stdio",
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-puppeteer"],
        },
    },
    {
        name: "Fetch",
        icon: "🌐",
        description: "HTTP requests & web scraping",
        config: {
            type: "stdio",
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-fetch"],
        },
    },
    {
        name: "Filesystem",
        icon: "📁",
        description: "File operations & management",
        config: {
            type: "stdio",
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-filesystem"],
        },
    },
];

export interface MCPModalProps {
    isOpen: boolean;
    onClose: () => void;
    servers?: MCPServer[];
    onToggleServer?: (id: string, enabled: boolean) => void;
    onDeleteServer?: (id: string) => void;
    onAddServer?: (server: Omit<MCPServer, "id">) => void;
}

// Server Card Component
const ServerCard: React.FC<{
    server: MCPServer;
    onToggle: (id: string, enabled: boolean) => void;
    onDelete: (id: string) => void;
}> = ({ server, onToggle, onDelete }) => {
    const isStdio = server.type === "stdio";

    return (
        <div
            className={`
                relative rounded-xl border transition-all duration-300 overflow-hidden
                ${
                    server.enabled
                        ? "border-blue-500/50 bg-gradient-to-br from-blue-500/10 to-blue-600/5"
                        : "border-white/10 bg-white/5"
                }
                hover:border-blue-400/60 hover:shadow-lg hover:shadow-blue-500/10
            `}
        >
            <div className="p-4 space-y-3">
                {/* Header Row */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                        <h3 className="text-base font-semibold text-white truncate">
                            {server.name}
                        </h3>
                        <span
                            className={`
                                px-2 py-0.5 text-[10px] font-bold uppercase rounded-md tracking-wider
                                ${
                                    isStdio
                                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                        : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                }
                            `}
                        >
                            {server.type}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={server.enabled}
                                onChange={(e) => onToggle(server.id, e.target.checked)}
                                className="sr-only peer"
                            />
                            <div
                                className={`
                                w-9 h-5 rounded-full transition-all duration-300
                                peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-blue-600
                                bg-white/10
                                after:content-[''] after:absolute after:top-0.5 after:left-0.5
                                after:bg-white after:rounded-full after:h-4 after:w-4
                                after:transition-all after:duration-300 after:shadow-lg
                                peer-checked:after:translate-x-4
                            `}
                            />
                        </label>
                        <button
                            onClick={() => onDelete(server.id)}
                            className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                            title="Delete Server"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Details Body */}
                <div className="space-y-2 text-xs">
                    {isStdio ? (
                        <>
                            <div className="flex gap-2 items-baseline">
                                <span className="text-white/40 w-16 flex-shrink-0">Command:</span>
                                <code className="text-emerald-400 font-mono bg-white/5 px-1.5 py-0.5 rounded">
                                    {server.command}
                                </code>
                            </div>
                            {server.args && server.args.length > 0 && (
                                <div className="flex gap-2 items-baseline">
                                    <span className="text-white/40 w-16 flex-shrink-0">Args:</span>
                                    <code className="text-orange-400 font-mono break-all bg-white/5 px-1.5 py-0.5 rounded">
                                        {server.args.join(" ")}
                                    </code>
                                </div>
                            )}
                            {server.env && Object.keys(server.env).length > 0 && (
                                <div className="flex gap-2 items-baseline">
                                    <span className="text-white/40 w-16 flex-shrink-0">Env:</span>
                                    <code className="text-purple-400 font-mono bg-white/5 px-1.5 py-0.5 rounded">
                                        {Object.keys(server.env).join(", ")}
                                    </code>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="flex gap-2 items-baseline">
                                <span className="text-white/40 w-16 flex-shrink-0">URL:</span>
                                <code className="text-blue-400 font-mono break-all bg-white/5 px-1.5 py-0.5 rounded">
                                    {server.url}
                                </code>
                            </div>
                            {server.headers && Object.keys(server.headers).length > 0 && (
                                <div className="flex gap-2 items-baseline">
                                    <span className="text-white/40 w-16 flex-shrink-0">
                                        Headers:
                                    </span>
                                    <code className="text-purple-400 font-mono bg-white/5 px-1.5 py-0.5 rounded">
                                        {Object.keys(server.headers).join(", ")}
                                    </code>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export const MCPModal: React.FC<MCPModalProps> = ({
    isOpen,
    onClose,
    servers = [],
    onToggleServer = () => {},
    onDeleteServer = () => {},
    onAddServer = () => {},
}) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState<{
        name: string;
        type: MCPServerType;
        url: string;
        command: string;
        args: string;
        env: string;
        headers: string;
    }>({
        name: "",
        type: "stdio",
        url: "",
        command: "",
        args: "",
        env: "",
        headers: "",
    });

    const resetForm = useCallback(() => {
        setFormData({
            name: "",
            type: "stdio",
            url: "",
            command: "",
            args: "",
            env: "",
            headers: "",
        });
        setShowAddForm(false);
    }, []);

    const handleSubmit = useCallback(() => {
        const parseKeyValue = (text: string): Record<string, string> => {
            const result: Record<string, string> = {};
            text.split("\n").forEach((line) => {
                const [key, ...valueParts] = line.split("=");
                if (key && valueParts.length > 0) {
                    result[key.trim()] = valueParts.join("=").trim();
                }
            });
            return result;
        };

        const server: Omit<MCPServer, "id"> = {
            name: formData.name,
            type: formData.type,
            enabled: true,
        };

        if (formData.type === "stdio") {
            server.command = formData.command;
            server.args = formData.args
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean);
            if (formData.env) {
                server.env = parseKeyValue(formData.env);
            }
        } else {
            server.url = formData.url;
            if (formData.headers) {
                server.headers = parseKeyValue(formData.headers);
            }
        }

        onAddServer(server);
        resetForm();
    }, [formData, onAddServer, resetForm]);

    const handleAddPopular = useCallback(
        (popular: PopularServer) => {
            onAddServer({
                name: popular.name.toLowerCase().replace(/\s+/g, "-"),
                enabled: true,
                ...popular.config,
            } as Omit<MCPServer, "id">);
        },
        [onAddServer],
    );

    const isStdio = formData.type === "stdio";
    const canSubmit = formData.name && (isStdio ? formData.command : formData.url);

    // Filter available popular servers (exclude ones that are already added)
    const availablePopularServers = POPULAR_SERVERS.filter((server) => {
        return !servers.some((s) => s.name === server.name.toLowerCase().replace(/\s+/g, "-"));
    });

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="MCP Servers" width="lg">
            <div className="space-y-6">
                {/* Server List */}
                <div className="space-y-3">
                    {servers.length === 0 ? (
                        <div className="p-8 text-center rounded-xl border border-dashed border-white/20 bg-white/5">
                            <Terminal className="w-8 h-8 mx-auto mb-3 text-white/30" />
                            <p className="text-sm text-white/50">No MCP servers configured</p>
                            <p className="text-xs text-white/30 mt-1">
                                Add a server below to get started
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {servers.map((server) => (
                                <ServerCard
                                    key={server.id}
                                    server={server}
                                    onToggle={onToggleServer}
                                    onDelete={onDeleteServer}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Add Server Form */}
                {showAddForm ? (
                    <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-white">Add New Server</h4>
                            <button
                                onClick={resetForm}
                                className="p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/60"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="grid gap-4">
                            <div>
                                <label className="block text-xs text-white/50 mb-1.5">
                                    Server Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                                    }
                                    placeholder="my-server"
                                    className="w-full px-3 py-2 text-sm rounded-lg bg-black/30 border border-white/10
                                        focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20
                                        placeholder:text-white/20"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-white/50 mb-1.5">
                                    Server Type
                                </label>
                                <div className="flex gap-2">
                                    {(["stdio", "http", "sse"] as const).map((type) => (
                                        <button
                                            key={type}
                                            onClick={() =>
                                                setFormData((prev) => ({ ...prev, type }))
                                            }
                                            className={`
                                                px-4 py-2 text-xs font-medium uppercase rounded-lg transition-all
                                                ${
                                                    formData.type === type
                                                        ? "bg-blue-500 text-white"
                                                        : "bg-white/5 text-white/50 hover:bg-white/10"
                                                }
                                            `}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {isStdio ? (
                                <>
                                    <div>
                                        <label className="block text-xs text-white/50 mb-1.5">
                                            Command
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.command}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    command: e.target.value,
                                                }))
                                            }
                                            placeholder="/path/to/server or npx"
                                            className="w-full px-3 py-2 text-sm rounded-lg bg-black/30 border border-white/10
                                                focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20
                                                placeholder:text-white/20 font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-white/50 mb-1.5">
                                            Arguments (one per line)
                                        </label>
                                        <textarea
                                            value={formData.args}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    args: e.target.value,
                                                }))
                                            }
                                            placeholder="-y&#10;@package/name"
                                            rows={2}
                                            className="w-full px-3 py-2 text-sm rounded-lg bg-black/30 border border-white/10
                                                focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20
                                                placeholder:text-white/20 font-mono resize-none"
                                        />
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <label className="block text-xs text-white/50 mb-1.5">
                                        Server URL
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.url}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                url: e.target.value,
                                            }))
                                        }
                                        placeholder="https://example.com/mcp"
                                        className="w-full px-3 py-2 text-sm rounded-lg bg-black/30 border border-white/10
                                            focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20
                                            placeholder:text-white/20"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={handleSubmit}
                                disabled={!canSubmit}
                                className={`
                                    flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all
                                    ${
                                        canSubmit
                                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/25"
                                            : "bg-white/10 text-white/30 cursor-not-allowed"
                                    }
                                `}
                            >
                                <Plus className="w-4 h-4" />
                                Add Server
                            </button>
                            <button
                                onClick={resetForm}
                                className="px-4 py-2 text-sm font-medium rounded-lg bg-white/5 text-white/60
                                    hover:bg-white/10 hover:text-white/80 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="w-full py-3 text-sm font-medium rounded-xl border-2 border-dashed
                            border-white/20 hover:border-blue-500/50 text-white/50 hover:text-blue-400
                            transition-all hover:bg-blue-500/5 flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Custom MCP Server
                    </button>
                )}

                {/* Popular Servers */}
                {availablePopularServers.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                            <span className="text-base">⚡</span>
                            Quick Add Popular Servers
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                            {availablePopularServers.map((server) => (
                                <button
                                    key={server.name}
                                    onClick={() => handleAddPopular(server)}
                                    className="flex items-start gap-3 p-3 text-left rounded-xl border transition-all
                                        border-white/10 bg-white/5 hover:border-blue-500/50 hover:bg-blue-500/10"
                                >
                                    <span className="text-xl flex-shrink-0">{server.icon}</span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-white truncate">
                                                {server.name}
                                            </span>
                                        </div>
                                        <p className="text-xs text-white/40 line-clamp-1 mt-0.5">
                                            {server.description}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};
