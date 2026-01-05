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
        name: "Chrome",
        icon: "🌐",
        description: "Browser debugging & automation",
        config: {
            type: "stdio",
            command: "npx",
            args: ["-y", "@anthropics/mcp-server-chrome"],
        },
    },
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
        icon: "📡",
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
                relative rounded-lg transition-all duration-200 overflow-hidden
                ${server.enabled ? "bg-white/[0.03]" : "bg-white/[0.02] opacity-60"}
                hover:bg-white/[0.05]
            `}
        >
            <div className="px-3 py-2.5">
                {/* Header Row */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <h3 className="text-[13px] font-medium text-white/90 truncate">
                            {server.name}
                        </h3>
                        <span
                            className={`
                                px-1.5 py-0.5 text-[9px] font-medium uppercase rounded
                                ${
                                    isStdio
                                        ? "bg-white/[0.06] text-white/50"
                                        : "bg-white/[0.06] text-white/50"
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
                                    w-7 h-4 rounded-full transition-all duration-200
                                    peer-checked:bg-blue-500/80
                                bg-white/10
                                after:content-[''] after:absolute after:top-0.5 after:left-0.5
                                    after:bg-white after:rounded-full after:h-3 after:w-3
                                    after:transition-all after:duration-200
                                    peer-checked:after:translate-x-3
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

                {/* Details */}
                <div className="mt-2 text-[11px] text-white/40 font-mono truncate">
                    {isStdio ? (
                        <span>
                            {server.command} {server.args?.join(" ")}
                        </span>
                    ) : (
                        <span>{server.url}</span>
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
                    <div className="p-3 rounded-lg bg-white/[0.02] space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-medium text-white/70">Add New Server</h4>
                            <button
                                onClick={resetForm}
                                className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white/50"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <div className="grid gap-3">
                            <div>
                                <label className="block text-[10px] text-white/40 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                                    }
                                    placeholder="my-server"
                                    className="w-full px-2.5 py-1.5 text-xs rounded bg-white/[0.03] border border-white/5
                                        focus:border-white/20 focus:outline-none placeholder:text-white/20 text-white/80"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] text-white/40 mb-1">Type</label>
                                <div className="flex gap-1">
                                    {(["stdio", "http", "sse"] as const).map((type) => (
                                        <button
                                            key={type}
                                            onClick={() =>
                                                setFormData((prev) => ({ ...prev, type }))
                                            }
                                            className={`
                                                px-2.5 py-1 text-[10px] font-medium uppercase rounded transition-all
                                                ${
                                                    formData.type === type
                                                        ? "bg-white/10 text-white/80"
                                                        : "bg-white/[0.03] text-white/40 hover:bg-white/[0.06]"
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
                                        <label className="block text-[10px] text-white/40 mb-1">
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
                                            className="w-full px-2.5 py-1.5 text-xs rounded bg-white/[0.03] border border-white/5
                                                focus:border-white/20 focus:outline-none font-mono placeholder:text-white/20 text-white/80"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-white/40 mb-1">
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
                                            className="w-full px-2.5 py-1.5 text-xs rounded bg-white/[0.03] border border-white/5
                                                focus:border-white/20 focus:outline-none font-mono resize-none placeholder:text-white/20 text-white/80"
                                        />
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <label className="block text-[10px] text-white/40 mb-1">
                                        URL
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
                                        className="w-full px-2.5 py-1.5 text-xs rounded bg-white/[0.03] border border-white/5
                                            focus:border-white/20 focus:outline-none placeholder:text-white/20 text-white/80"
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
                                            ? "bg-blue-500/80 hover:bg-blue-500 text-white"
                                            : "bg-white/5 text-white/20 cursor-not-allowed"
                                    }
                                `}
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add
                            </button>
                            <button
                                onClick={resetForm}
                                className="px-3 py-1.5 text-xs font-medium rounded bg-white/[0.03] text-white/50
                                    hover:bg-white/[0.06] transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="w-full py-2 text-xs font-medium rounded-lg
                            bg-white/[0.03] hover:bg-white/[0.06] text-white/50 hover:text-white/70
                            transition-all flex items-center justify-center gap-1.5"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add Custom Server
                    </button>
                )}

                {/* Popular Servers */}
                {availablePopularServers.length > 0 && (
                    <div>
                        <h4 className="text-[10px] font-medium text-white/40 mb-2 uppercase tracking-wider">
                            Quick Add
                        </h4>
                        <div className="grid grid-cols-2 gap-1.5">
                            {availablePopularServers.map((server) => (
                                <button
                                    key={server.name}
                                    onClick={() => handleAddPopular(server)}
                                    className="flex items-center gap-2 px-2.5 py-2 text-left rounded-lg transition-all
                                        bg-white/[0.02] hover:bg-white/[0.05]"
                                >
                                    <span className="text-sm flex-shrink-0 opacity-70">
                                        {server.icon}
                                    </span>
                                    <span className="text-[11px] font-medium text-white/60 truncate">
                                        {server.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};
