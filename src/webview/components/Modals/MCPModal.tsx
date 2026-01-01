import React, { useState, useCallback } from "react";
import { Modal } from "./Modal";

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
    icon: "\uD83D\uDCDA",
    description: "Up-to-date Code Docs For Any Prompt",
    config: { type: "http", url: "https://context7.liam.sh/mcp" },
  },
  {
    name: "Sequential Thinking",
    icon: "\uD83D\uDD17",
    description: "Step-by-step reasoning capabilities",
    config: {
      type: "stdio",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-sequential-thinking"],
    },
  },
  {
    name: "Memory",
    icon: "\uD83E\uDDE0",
    description: "Knowledge graph storage",
    config: {
      type: "stdio",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-memory"],
    },
  },
  {
    name: "Puppeteer",
    icon: "\uD83C\uDFAD",
    description: "Browser automation",
    config: {
      type: "stdio",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-puppeteer"],
    },
  },
  {
    name: "Fetch",
    icon: "\uD83C\uDF10",
    description: "HTTP requests & web scraping",
    config: {
      type: "stdio",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-fetch"],
    },
  },
  {
    name: "Filesystem",
    icon: "\uD83D\uDCC1",
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
    type: "http",
    url: "",
    command: "",
    args: "",
    env: "",
    headers: "",
  });

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      type: "http",
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
  const canSubmit =
    formData.name && (isStdio ? formData.command : formData.url);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="MCP Servers" width="lg">
      <div className="space-y-4">
        {/* Server List */}
        <div className="border border-[var(--vscode-editorWidget-border)] rounded-md overflow-hidden">
          {servers.length === 0 ? (
            <div className="p-6 text-center text-sm text-[var(--vscode-descriptionForeground)]">
              No MCP servers configured
            </div>
          ) : (
            <ul className="divide-y divide-[var(--vscode-editorWidget-border)]">
              {servers.map((server) => (
                <li
                  key={server.id}
                  className="flex items-center justify-between px-3 py-2 hover:bg-[var(--vscode-list-hoverBackground)]"
                >
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={server.enabled}
                        onChange={(e) =>
                          onToggleServer(server.id, e.target.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-[var(--vscode-input-background)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--vscode-progressBar-background)]"></div>
                    </label>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {server.name}
                        </span>
                        <span className="badge text-xs">{server.type}</span>
                      </div>
                      <span className="text-xs text-[var(--vscode-descriptionForeground)]">
                        {server.type === "stdio" ? server.command : server.url}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteServer(server.id)}
                    className="p-1 rounded hover:bg-[var(--vscode-toolbar-hoverBackground)] text-[var(--vscode-errorForeground)]"
                    aria-label="Delete server"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Add Server Form */}
        {showAddForm ? (
          <div className="space-y-3 p-4 border border-[var(--vscode-editorWidget-border)] rounded-md">
            <div>
              <label
                htmlFor="server-name"
                className="block text-xs text-[var(--vscode-descriptionForeground)] mb-1"
              >
                Server Name
              </label>
              <input
                id="server-name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="my-server"
                className="input"
              />
            </div>

            <div>
              <label
                htmlFor="server-type"
                className="block text-xs text-[var(--vscode-descriptionForeground)] mb-1"
              >
                Server Type
              </label>
              <select
                id="server-type"
                value={formData.type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: e.target.value as MCPServerType,
                  }))
                }
                className="input"
              >
                <option value="http">HTTP</option>
                <option value="sse">SSE</option>
                <option value="stdio">stdio</option>
              </select>
            </div>

            {isStdio ? (
              <>
                <div>
                  <label
                    htmlFor="server-command"
                    className="block text-xs text-[var(--vscode-descriptionForeground)] mb-1"
                  >
                    Command
                  </label>
                  <input
                    id="server-command"
                    type="text"
                    value={formData.command}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        command: e.target.value,
                      }))
                    }
                    placeholder="/path/to/server"
                    className="input"
                  />
                </div>

                <div>
                  <label
                    htmlFor="server-args"
                    className="block text-xs text-[var(--vscode-descriptionForeground)] mb-1"
                  >
                    Arguments (one per line)
                  </label>
                  <textarea
                    id="server-args"
                    value={formData.args}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, args: e.target.value }))
                    }
                    placeholder="--api-key&#10;abc123"
                    rows={3}
                    className="textarea"
                  />
                </div>

                <div>
                  <label
                    htmlFor="server-env"
                    className="block text-xs text-[var(--vscode-descriptionForeground)] mb-1"
                  >
                    Environment Variables (KEY=value, one per line)
                  </label>
                  <textarea
                    id="server-env"
                    value={formData.env}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, env: e.target.value }))
                    }
                    placeholder="API_KEY=123&#10;CACHE_DIR=/tmp"
                    rows={3}
                    className="textarea"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label
                    htmlFor="server-url"
                    className="block text-xs text-[var(--vscode-descriptionForeground)] mb-1"
                  >
                    URL
                  </label>
                  <input
                    id="server-url"
                    type="text"
                    value={formData.url}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, url: e.target.value }))
                    }
                    placeholder="https://example.com/mcp"
                    className="input"
                  />
                </div>

                <div>
                  <label
                    htmlFor="server-headers"
                    className="block text-xs text-[var(--vscode-descriptionForeground)] mb-1"
                  >
                    Headers (KEY=value, one per line)
                  </label>
                  <textarea
                    id="server-headers"
                    value={formData.headers}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        headers: e.target.value,
                      }))
                    }
                    placeholder="Authorization=Bearer token&#10;X-API-Key=key"
                    rows={3}
                    className="textarea"
                  />
                </div>
              </>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="btn text-sm"
              >
                Add Server
              </button>
              <button
                onClick={resetForm}
                className="btn-secondary px-3 py-1.5 text-sm rounded"
                style={{
                  backgroundColor: "var(--vscode-button-secondaryBackground)",
                  color: "var(--vscode-button-secondaryForeground)",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-secondary w-full py-2 text-sm rounded border border-dashed border-[var(--vscode-editorWidget-border)] hover:border-[var(--vscode-focusBorder)]"
            style={{
              backgroundColor: "transparent",
              color: "var(--vscode-foreground)",
            }}
          >
            + Add MCP Server
          </button>
        )}

        {/* Popular Servers */}
        <div>
          <h4 className="text-sm font-semibold mb-3 text-[var(--vscode-foreground)]">
            Popular MCP Servers
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {POPULAR_SERVERS.map((server) => (
              <button
                key={server.name}
                onClick={() => handleAddPopular(server)}
                className="flex items-start gap-3 p-3 text-left rounded-md border border-[var(--vscode-editorWidget-border)] hover:bg-[var(--vscode-list-hoverBackground)] transition-colors"
              >
                <span className="text-xl flex-shrink-0">{server.icon}</span>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {server.name}
                  </div>
                  <div className="text-xs text-[var(--vscode-descriptionForeground)] line-clamp-2">
                    {server.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default MCPModal;
