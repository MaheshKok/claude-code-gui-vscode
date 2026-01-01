import React, { useState, useCallback, useMemo } from "react";
import { Modal } from "./Modal";

export interface SlashCommand {
  id: string;
  name: string;
  icon: string;
  description: string;
  type: "builtin" | "custom" | "snippet";
  prompt?: string;
}

const BUILTIN_COMMANDS: SlashCommand[] = [
  {
    id: "add-dir",
    name: "/add-dir",
    icon: "\uD83D\uDCC1",
    description: "Add additional working directories",
    type: "builtin",
  },
  {
    id: "agents",
    name: "/agents",
    icon: "\uD83E\uDD16",
    description: "Manage custom AI subagents for specialized tasks",
    type: "builtin",
  },
  {
    id: "bug",
    name: "/bug",
    icon: "\uD83D\uDC1B",
    description: "Report bugs (sends conversation to Anthropic)",
    type: "builtin",
  },
  {
    id: "clear",
    name: "/clear",
    icon: "\uD83D\uDDD1\uFE0F",
    description: "Clear conversation history",
    type: "builtin",
  },
  {
    id: "compact",
    name: "/compact",
    icon: "\uD83D\uDCE6",
    description: "Compact conversation with optional focus instructions",
    type: "builtin",
  },
  {
    id: "config",
    name: "/config",
    icon: "\u2699\uFE0F",
    description: "Open the Settings interface (Config tab)",
    type: "builtin",
  },
  {
    id: "cost",
    name: "/cost",
    icon: "\uD83D\uDCB0",
    description: "Show token usage statistics",
    type: "builtin",
  },
  {
    id: "doctor",
    name: "/doctor",
    icon: "\uD83E\uDE7A",
    description: "Checks the health of your Claude Code installation",
    type: "builtin",
  },
  {
    id: "help",
    name: "/help",
    icon: "\u2753",
    description: "Get usage help",
    type: "builtin",
  },
  {
    id: "init",
    name: "/init",
    icon: "\uD83D\uDE80",
    description: "Initialize project with CLAUDE.md guide",
    type: "builtin",
  },
  {
    id: "login",
    name: "/login",
    icon: "\uD83D\uDD11",
    description: "Switch Anthropic accounts",
    type: "builtin",
  },
  {
    id: "logout",
    name: "/logout",
    icon: "\uD83D\uDEAA",
    description: "Sign out from your Anthropic account",
    type: "builtin",
  },
  {
    id: "mcp",
    name: "/mcp",
    icon: "\uD83D\uDD0C",
    description: "Manage MCP server connections and OAuth authentication",
    type: "builtin",
  },
  {
    id: "memory",
    name: "/memory",
    icon: "\uD83E\uDDE0",
    description: "Edit CLAUDE.md memory files",
    type: "builtin",
  },
  {
    id: "model",
    name: "/model",
    icon: "\uD83E\uDD16",
    description: "Select or change the AI model",
    type: "builtin",
  },
  {
    id: "permissions",
    name: "/permissions",
    icon: "\uD83D\uDD12",
    description: "View or update permissions",
    type: "builtin",
  },
  {
    id: "pr_comments",
    name: "/pr_comments",
    icon: "\uD83D\uDCAC",
    description: "View pull request comments",
    type: "builtin",
  },
  {
    id: "review",
    name: "/review",
    icon: "\uD83D\uDC40",
    description: "Request code review",
    type: "builtin",
  },
  {
    id: "rewind",
    name: "/rewind",
    icon: "\u23EA",
    description: "Rewind the conversation and/or code",
    type: "builtin",
  },
  {
    id: "status",
    name: "/status",
    icon: "\uD83D\uDCCA",
    description: "Open the Settings interface (Status tab)",
    type: "builtin",
  },
  {
    id: "terminal-setup",
    name: "/terminal-setup",
    icon: "\u2328\uFE0F",
    description: "Install Shift+Enter key binding for newlines",
    type: "builtin",
  },
  {
    id: "usage",
    name: "/usage",
    icon: "\uD83D\uDCC8",
    description: "Show plan usage limits and rate limit status",
    type: "builtin",
  },
  {
    id: "vim",
    name: "/vim",
    icon: "\uD83D\uDCDD",
    description: "Enter vim mode for alternating insert and command modes",
    type: "builtin",
  },
];

const BUILTIN_SNIPPETS: SlashCommand[] = [
  {
    id: "performance-analysis",
    name: "/performance-analysis",
    icon: "\u26A1",
    description:
      "Analyze this code for performance issues and suggest optimizations",
    type: "snippet",
    prompt:
      "Analyze this code for performance issues and suggest optimizations",
  },
  {
    id: "security-review",
    name: "/security-review",
    icon: "\uD83D\uDD12",
    description: "Review this code for security vulnerabilities",
    type: "snippet",
    prompt: "Review this code for security vulnerabilities",
  },
  {
    id: "implementation-review",
    name: "/implementation-review",
    icon: "\uD83D\uDD0D",
    description: "Review the implementation in this code",
    type: "snippet",
    prompt: "Review the implementation in this code",
  },
  {
    id: "code-explanation",
    name: "/code-explanation",
    icon: "\uD83D\uDCD6",
    description: "Explain how this code works in detail",
    type: "snippet",
    prompt: "Explain how this code works in detail",
  },
  {
    id: "bug-fix",
    name: "/bug-fix",
    icon: "\uD83D\uDC1B",
    description: "Help me fix this bug in my code",
    type: "snippet",
    prompt: "Help me fix this bug in my code",
  },
  {
    id: "refactor",
    name: "/refactor",
    icon: "\uD83D\uDD04",
    description:
      "Refactor this code to improve readability and maintainability",
    type: "snippet",
    prompt: "Refactor this code to improve readability and maintainability",
  },
  {
    id: "test-generation",
    name: "/test-generation",
    icon: "\uD83E\uDDEA",
    description: "Generate comprehensive tests for this code",
    type: "snippet",
    prompt: "Generate comprehensive tests for this code",
  },
  {
    id: "documentation",
    name: "/documentation",
    icon: "\uD83D\uDCDD",
    description: "Generate documentation for this code",
    type: "snippet",
    prompt: "Generate documentation for this code",
  },
];

export interface SlashCommandsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customCommands: SlashCommand[];
  onExecuteCommand: (command: SlashCommand) => void;
  onAddCustomCommand: (name: string, prompt: string) => void;
  onDeleteCustomCommand: (id: string) => void;
  onQuickCommand: (command: string) => void;
}

export const SlashCommandsModal: React.FC<SlashCommandsModalProps> = ({
  isOpen,
  onClose,
  customCommands,
  onExecuteCommand,
  onAddCustomCommand,
  onDeleteCustomCommand,
  onQuickCommand,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCommandName, setNewCommandName] = useState("");
  const [newCommandPrompt, setNewCommandPrompt] = useState("");
  const [quickCommand, setQuickCommand] = useState("");

  const allCommands = useMemo(() => {
    return [...customCommands, ...BUILTIN_SNIPPETS, ...BUILTIN_COMMANDS];
  }, [customCommands]);

  const filteredCommands = useMemo(() => {
    if (!searchQuery) return allCommands;
    const query = searchQuery.toLowerCase();
    return allCommands.filter(
      (cmd) =>
        cmd.name.toLowerCase().includes(query) ||
        cmd.description.toLowerCase().includes(query),
    );
  }, [allCommands, searchQuery]);

  const handleAddCommand = useCallback(() => {
    if (newCommandName && newCommandPrompt) {
      onAddCustomCommand(newCommandName, newCommandPrompt);
      setNewCommandName("");
      setNewCommandPrompt("");
      setShowAddForm(false);
    }
  }, [newCommandName, newCommandPrompt, onAddCustomCommand]);

  const handleQuickCommand = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && quickCommand) {
        onQuickCommand(quickCommand);
        setQuickCommand("");
        onClose();
      }
    },
    [quickCommand, onQuickCommand, onClose],
  );

  const handleCommandClick = useCallback(
    (command: SlashCommand) => {
      onExecuteCommand(command);
      onClose();
    },
    [onExecuteCommand, onClose],
  );

  const customCommandsList = filteredCommands.filter(
    (c) => c.type === "custom",
  );
  const snippetsList = filteredCommands.filter((c) => c.type === "snippet");
  const builtinList = filteredCommands.filter((c) => c.type === "builtin");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Commands & Prompt Snippets"
      width="lg"
    >
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--vscode-descriptionForeground)]">
            /
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search commands and snippets..."
            className="input pl-7"
            autoFocus
          />
        </div>

        {/* Custom Commands Section */}
        <section>
          <h3 className="text-sm font-semibold mb-2 text-[var(--vscode-foreground)]">
            Custom Commands
          </h3>
          <p className="text-xs text-[var(--vscode-descriptionForeground)] mb-3">
            Custom slash commands for quick prompt access. Click to use directly
            in chat.
          </p>

          <div className="space-y-1">
            {/* Add Custom Command Button */}
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-[var(--vscode-list-hoverBackground)] transition-colors"
              >
                <span className="text-lg w-6 text-center">+</span>
                <div className="text-left">
                  <div className="text-sm font-medium">Add Custom Command</div>
                  <div className="text-xs text-[var(--vscode-descriptionForeground)]">
                    Create your own slash command
                  </div>
                </div>
              </button>
            )}

            {/* Add Form */}
            {showAddForm && (
              <div className="p-3 border border-[var(--vscode-editorWidget-border)] rounded-md space-y-3">
                <div>
                  <label
                    htmlFor="command-name"
                    className="block text-xs text-[var(--vscode-descriptionForeground)] mb-1"
                  >
                    Command name:
                  </label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--vscode-descriptionForeground)]">
                      /
                    </span>
                    <input
                      id="command-name"
                      type="text"
                      value={newCommandName}
                      onChange={(e) => setNewCommandName(e.target.value)}
                      placeholder="e.g., fix-bug"
                      maxLength={50}
                      className="input pl-6"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="command-prompt"
                    className="block text-xs text-[var(--vscode-descriptionForeground)] mb-1"
                  >
                    Prompt Text:
                  </label>
                  <textarea
                    id="command-prompt"
                    value={newCommandPrompt}
                    onChange={(e) => setNewCommandPrompt(e.target.value)}
                    placeholder="e.g., Help me fix this bug in my code..."
                    rows={3}
                    className="textarea"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddCommand}
                    disabled={!newCommandName || !newCommandPrompt}
                    className="btn text-xs"
                  >
                    Save Command
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewCommandName("");
                      setNewCommandPrompt("");
                    }}
                    className="btn-secondary px-3 py-1.5 text-xs rounded"
                    style={{
                      backgroundColor:
                        "var(--vscode-button-secondaryBackground)",
                      color: "var(--vscode-button-secondaryForeground)",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Custom Commands List */}
            {customCommandsList.map((cmd) => (
              <div
                key={cmd.id}
                className="flex items-center justify-between p-2 rounded-md hover:bg-[var(--vscode-list-hoverBackground)] group"
              >
                <button
                  onClick={() => handleCommandClick(cmd)}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  <span className="text-lg w-6 text-center">{cmd.icon}</span>
                  <div>
                    <div className="text-sm font-medium">{cmd.name}</div>
                    <div className="text-xs text-[var(--vscode-descriptionForeground)]">
                      {cmd.description}
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => onDeleteCustomCommand(cmd.id)}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--vscode-toolbar-hoverBackground)] text-[var(--vscode-errorForeground)] transition-opacity"
                  aria-label="Delete command"
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
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}

            {/* Snippets */}
            {snippetsList.map((cmd) => (
              <button
                key={cmd.id}
                onClick={() => handleCommandClick(cmd)}
                className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-[var(--vscode-list-hoverBackground)] text-left transition-colors"
              >
                <span className="text-lg w-6 text-center">{cmd.icon}</span>
                <div>
                  <div className="text-sm font-medium">{cmd.name}</div>
                  <div className="text-xs text-[var(--vscode-descriptionForeground)]">
                    {cmd.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Built-in Commands Section */}
        <section>
          <h3 className="text-sm font-semibold mb-2 text-[var(--vscode-foreground)]">
            Built-in Commands
          </h3>
          <p className="text-xs text-[var(--vscode-descriptionForeground)] mb-3">
            These commands require the Claude CLI and will open in VS Code
            terminal.
          </p>

          <div className="space-y-1 max-h-60 overflow-y-auto">
            {builtinList.map((cmd) => (
              <button
                key={cmd.id}
                onClick={() => handleCommandClick(cmd)}
                className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-[var(--vscode-list-hoverBackground)] text-left transition-colors"
              >
                <span className="text-lg w-6 text-center">{cmd.icon}</span>
                <div>
                  <div className="text-sm font-medium">{cmd.name}</div>
                  <div className="text-xs text-[var(--vscode-descriptionForeground)]">
                    {cmd.description}
                  </div>
                </div>
              </button>
            ))}

            {/* Quick Command Input */}
            <div className="flex items-center gap-3 p-2 rounded-md border border-[var(--vscode-editorWidget-border)]">
              <span className="text-lg w-6 text-center">\u26A1</span>
              <div className="flex-1">
                <div className="text-sm font-medium mb-1">Quick Command</div>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--vscode-descriptionForeground)]">
                    /
                  </span>
                  <input
                    type="text"
                    value={quickCommand}
                    onChange={(e) => setQuickCommand(e.target.value)}
                    onKeyDown={handleQuickCommand}
                    placeholder="enter-command"
                    className="input pl-6 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Modal>
  );
};

export default SlashCommandsModal;
