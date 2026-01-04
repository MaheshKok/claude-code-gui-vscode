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
                relative rounded-lg border transition-all duration-300 overflow-hidden
                ${server.enabled ? "border-blue-500/40" : "border-white/10"}
                hover:border-blue-400/60
            `}
        >
            <div className="p-2.5 space-y-1.5">
                {/* Header Row */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <h3 className="text-sm font-semibold text-white truncate">{server.name}</h3>
                        <span
                            className={`
                                px-1.5 py-0.5 text-[9px] font-bold uppercase rounded tracking-wider
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

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        <label className="relative inline-flex items-center cursor-pointer scale-[0.85]">
                            <input
                                type="checkbox"
                                checked={server.enabled}
                                onChange={(e) => onToggle(server.id, e.target.checked)}
                                className="sr-only peer"
                            />
                            <div
                                className={`
                                w-8 h-4.5 rounded-full transition-all duration-300
                                peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-blue-600
                                bg-white/10
                                after:content-[''] after:absolute after:top-0.5 after:left-0.5
                                after:bg-white after:rounded-full after:h-3.5 after:w-3.5
                                after:transition-all after:duration-300 after:shadow-lg
                                peer-checked:after:translate-x-3.5
                            `}
                            />
                        </label>
                        <button
                            onClick={() => onDelete(server.id)}
                            className="p-1 rounded text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete Server"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Details Body */}
                <div className="space-y-1 text-[11px]">
                    {isStdio ? (
                        <>
                            <div className="flex gap-2 items-baseline">
                                <span className="text-white/30 w-14 flex-shrink-0">Command:</span>
                                <code className="text-emerald-400/90 font-mono py-0.5 rounded">
                                    {server.command}
                                </code>
                            </div>
                            {server.args && server.args.length > 0 && (
                                <div className="flex gap-2 items-baseline">
                                    <span className="text-white/30 w-14 flex-shrink-0">Args:</span>
                                    <code className="text-orange-400/90 font-mono break-all py-0.5 rounded leading-tight">
                                        {server.args.join(" ")}
                                    </code>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex gap-2 items-baseline">
                            <span className="text-white/30 w-14 flex-shrink-0">URL:</span>
                            <code className="text-blue-400/90 font-mono break-all py-0.5 rounded leading-tight">
                                {server.url}
                            </code>
                        </div>
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
            <div className="space-y-4">
                {/* Server List */}
                <div className="space-y-2">
                    {servers.length === 0 ? (
                        <div className="p-6 text-center rounded-xl border border-dashed border-white/20">
                            <Terminal className="w-6 h-6 mx-auto mb-2 text-white/30" />
                            <p className="text-xs text-white/50">No MCP servers configured</p>
                        </div>
                    ) : (
                        <div className="grid gap-2">
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
                    <div className="p-3 rounded-lg border border-blue-500/30 space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-semibold text-white">Add New Server</h4>
                            <button
                                onClick={resetForm}
                                className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white/60"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <div className="grid gap-3">
                            <div>
                                <label className="block text-[10px] text-white/50 mb-1">
                                    Server Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                                    }
                                    placeholder="my-server"
                                    className="w-full px-2.5 py-1.5 text-xs rounded bg-black/30 border border-white/10
                                        focus:border-blue-500/50 focus:outline-none placeholder:text-white/20"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] text-white/50 mb-1">
                                    Server Type
                                </label>
                                <div className="flex gap-1.5">
                                    {(["stdio", "http", "sse"] as const).map((type) => (
                                        <button
                                            key={type}
                                            onClick={() =>
                                                setFormData((prev) => ({ ...prev, type }))
                                            }
                                            className={`
                                                px-3 py-1 text-[10px] font-medium uppercase rounded transition-all
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
                                        <label className="block text-[10px] text-white/50 mb-1">
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
                                            placeholder="npx"
                                            className="w-full px-2.5 py-1.5 text-xs rounded bg-black/30 border border-white/10
                                        focus:border-blue-500/50 focus:outline-none font-mono placeholder:text-white/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-white/50 mb-1">
                                            Arguments
                                        </label>
                                        <textarea
                                            value={formData.args}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    args: e.target.value,
                                                }))
                                            }
                                            placeholder="-y @package/name"
                                            rows={2}
                                            className="w-full px-2.5 py-1.5 text-xs rounded bg-black/30 border border-white/10
                                        focus:border-blue-500/50 focus:outline-none font-mono resize-none placeholder:text-white/20"
                                        />
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <label className="block text-[10px] text-white/50 mb-1">
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
                                        className="w-full px-2.5 py-1.5 text-xs rounded bg-black/30 border border-white/10
                                            focus:border-blue-500/50 focus:outline-none placeholder:text-white/20"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 pt-1">
                            <button
                                onClick={handleSubmit}
                                disabled={!canSubmit}
                                className={`
                                    flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-all
                                    ${
                                        canSubmit
                                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                                            : "bg-white/10 text-white/30 cursor-not-allowed"
                                    }
                                `}
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add Server
                            </button>
                            <button
                                onClick={resetForm}
                                className="px-3 py-1.5 text-xs font-medium rounded bg-white/5 text-white/60
                                    hover:bg-white/10 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="w-full py-2 text-xs font-medium rounded-lg border-2 border-dashed
                            border-white/10 hover:border-blue-500/30 text-white/40 hover:text-blue-400/80
                            transition-all hover:bg-blue-500/5 flex items-center justify-center gap-1.5"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add Custom MCP Server
                    </button>
                )}

                {/* Popular Servers */}
                {availablePopularServers.length > 0 && (
                    <div>
                        <h4 className="text-[11px] font-semibold text-white/70 mb-2 flex items-center gap-1.5">
                            <span className="text-xs">⚡</span>
                            Quick Add
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                            {availablePopularServers.map((server) => (
                                <button
                                    key={server.name}
                                    onClick={() => handleAddPopular(server)}
                                    className="flex items-center gap-2.5 p-2 text-left rounded-lg border transition-all
                                        border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5"
                                >
                                    <span className="text-base flex-shrink-0">{server.icon}</span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[11px] font-medium text-white/90 truncate">
                                                {server.name}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-white/30 line-clamp-1">
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
