import React, { useState, useRef, useCallback, useEffect } from "react";

/** Thinking intensity levels matching Claude Code CLI */
type ThinkingIntensity = "think" | "think-hard" | "think-harder" | "ultrathink";

interface MessageInputProps {
  disabled: boolean;
  currentModel: string;
  planMode: boolean;
  thinkingMode: boolean;
  thinkingIntensity: ThinkingIntensity;
  yoloMode: boolean;
  onSendMessage: (content: string) => void;
  onModelChange: (model: string) => void;
  onPlanModeToggle: () => void;
  onThinkingModeToggle: () => void;
  onThinkingIntensityChange: (intensity: ThinkingIntensity) => void;
  onYoloModeToggle: () => void;
  onFileSelect: () => void;
  onImageSelect: () => void;
  onSlashCommand: () => void;
  onMcpAction: () => void;
}

/** Thinking mode options with token budgets */
const THINKING_MODES = [
  {
    id: "think" as const,
    label: "Think",
    tokens: "4K tokens",
    description: "Basic reasoning",
  },
  {
    id: "think-hard" as const,
    label: "Think Hard",
    tokens: "10K tokens",
    description: "Deeper analysis",
  },
  {
    id: "think-harder" as const,
    label: "Think Harder",
    tokens: "20K tokens",
    description: "Comprehensive reasoning",
  },
  {
    id: "ultrathink" as const,
    label: "Ultrathink",
    tokens: "32K tokens",
    description: "Maximum depth",
  },
];

const MODELS = [
  {
    id: "claude-sonnet-4-5-20250929",
    name: "Claude Sonnet 4.5",
    shortName: "Sonnet 4.5",
  },
  {
    id: "claude-opus-4-5-20251101",
    name: "Claude Opus 4.5",
    shortName: "Opus 4.5",
  },
  {
    id: "claude-haiku-4-5-20251001",
    name: "Claude Haiku 4.5",
    shortName: "Haiku 4.5",
  },
];

export const MessageInput: React.FC<MessageInputProps> = ({
  disabled,
  currentModel,
  planMode,
  thinkingMode,
  thinkingIntensity,
  yoloMode,
  onSendMessage,
  onModelChange,
  onPlanModeToggle,
  onThinkingModeToggle,
  onThinkingIntensityChange,
  onYoloModeToggle,
  onFileSelect,
  onImageSelect,
  onSlashCommand,
  onMcpAction,
}) => {
  const [content, setContent] = useState("");
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showThinkingSelector, setShowThinkingSelector] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelSelectorRef = useRef<HTMLDivElement>(null);
  const thinkingSelectorRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200,
      )}px`;
    }
  }, [content]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modelSelectorRef.current &&
        !modelSelectorRef.current.contains(event.target as Node)
      ) {
        setShowModelSelector(false);
      }
      if (
        thinkingSelectorRef.current &&
        !thinkingSelectorRef.current.contains(event.target as Node)
      ) {
        setShowThinkingSelector(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmedContent = content.trim();
    if (trimmedContent && !disabled) {
      onSendMessage(trimmedContent);
      setContent("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  }, [content, disabled, onSendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleModelSelect = useCallback(
    (modelId: string) => {
      onModelChange(modelId);
      setShowModelSelector(false);
    },
    [onModelChange],
  );

  const handleThinkingSelect = useCallback(
    (intensity: ThinkingIntensity) => {
      onThinkingIntensityChange(intensity);
      if (!thinkingMode) {
        onThinkingModeToggle();
      }
      setShowThinkingSelector(false);
    },
    [onThinkingIntensityChange, thinkingMode, onThinkingModeToggle],
  );

  const currentModelName =
    MODELS.find((m) => m.id === currentModel)?.shortName || "Model";
  const currentThinkingMode =
    THINKING_MODES.find((m) => m.id === thinkingIntensity) || THINKING_MODES[0];

  return (
    <div className="border-t border-[var(--vscode-panel-border)] bg-[var(--vscode-sideBar-background)]">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-[var(--vscode-panel-border)]">
        {/* Model Selector */}
        <div className="relative" ref={modelSelectorRef}>
          <button
            onClick={() => setShowModelSelector(!showModelSelector)}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-[var(--vscode-toolbar-hoverBackground)] transition-colors"
            title="Select model"
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
              <path d="M12 8V4H8" />
              <rect width="16" height="12" x="4" y="8" rx="2" />
              <path d="M2 14h2" />
              <path d="M20 14h2" />
              <path d="M15 13v2" />
              <path d="M9 13v2" />
            </svg>
            <span>{currentModelName}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showModelSelector && (
            <div className="absolute bottom-full left-0 mb-1 py-1 bg-[var(--vscode-dropdown-background)] border border-[var(--vscode-dropdown-border)] rounded shadow-lg z-10 min-w-[160px]">
              {MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleModelSelect(model.id)}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-[var(--vscode-list-hoverBackground)] ${
                    currentModel === model.id
                      ? "bg-[var(--vscode-list-activeSelectionBackground)]"
                      : ""
                  }`}
                >
                  {model.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-[var(--vscode-panel-border)] mx-1" />

        {/* Plan Mode Toggle */}
        <button
          onClick={onPlanModeToggle}
          className="flex items-center gap-2 px-2 py-1 text-xs rounded transition-colors hover:bg-[var(--vscode-toolbar-hoverBackground)]"
          title="Plan mode - Claude will plan before executing"
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
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <span>Plan</span>
          {/* Modern Toggle Switch */}
          <div
            className={`relative w-8 h-4 rounded-full transition-colors duration-200 ${
              planMode
                ? "bg-[var(--vscode-button-background)]"
                : "bg-[var(--vscode-input-background)]"
            }`}
          >
            <div
              className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform duration-200 ${
                planMode ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </div>
        </button>

        <div className="w-px h-4 bg-[var(--vscode-panel-border)] mx-1" />

        {/* Thinking Mode Dropdown */}
        <div className="relative" ref={thinkingSelectorRef}>
          <button
            onClick={() => setShowThinkingSelector(!showThinkingSelector)}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
              thinkingMode
                ? "bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)]"
                : "hover:bg-[var(--vscode-toolbar-hoverBackground)]"
            }`}
            title="Extended thinking - Claude will think more deeply"
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
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            <span>{thinkingMode ? currentThinkingMode.label : "Think"}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showThinkingSelector && (
            <div className="absolute bottom-full left-0 mb-1 py-1 bg-[var(--vscode-dropdown-background)] border border-[var(--vscode-dropdown-border)] rounded-lg shadow-lg z-10 min-w-[200px]">
              {/* Toggle thinking on/off */}
              <button
                onClick={() => {
                  onThinkingModeToggle();
                  setShowThinkingSelector(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-[var(--vscode-list-hoverBackground)] border-b border-[var(--vscode-dropdown-border)]"
              >
                <span className="font-medium">Extended Thinking</span>
                <div
                  className={`relative w-8 h-4 rounded-full transition-colors duration-200 ${
                    thinkingMode
                      ? "bg-[var(--vscode-button-background)]"
                      : "bg-[var(--vscode-input-background)]"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform duration-200 ${
                      thinkingMode ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </div>
              </button>

              {/* Thinking levels */}
              <div className="py-1">
                {THINKING_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => handleThinkingSelect(mode.id)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--vscode-list-hoverBackground)] ${
                      thinkingIntensity === mode.id && thinkingMode
                        ? "bg-[var(--vscode-list-activeSelectionBackground)]"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{mode.label}</span>
                      <span className="text-xs text-[var(--vscode-descriptionForeground)]">
                        {mode.tokens}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--vscode-descriptionForeground)] mt-0.5">
                      {mode.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-[var(--vscode-panel-border)] mx-1" />

        {/* Yolo Mode Toggle */}
        <button
          onClick={onYoloModeToggle}
          className={`flex items-center gap-2 px-2 py-1 text-xs rounded transition-colors ${
            yoloMode
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              : "hover:bg-[var(--vscode-toolbar-hoverBackground)]"
          }`}
          title="YOLO mode - Auto-approve all permissions (use with caution)"
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
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <span>YOLO</span>
          {/* Modern Toggle Switch */}
          <div
            className={`relative w-8 h-4 rounded-full transition-colors duration-200 ${
              yoloMode ? "bg-amber-500" : "bg-[var(--vscode-input-background)]"
            }`}
          >
            <div
              className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform duration-200 ${
                yoloMode ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </div>
        </button>

        <div className="flex-1" />

        {/* Action Buttons */}
        <button
          onClick={onMcpAction}
          className="p-1.5 rounded hover:bg-[var(--vscode-toolbar-hoverBackground)] transition-colors"
          title="MCP Tools"
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
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </button>

        <button
          onClick={onSlashCommand}
          className="p-1.5 rounded hover:bg-[var(--vscode-toolbar-hoverBackground)] transition-colors"
          title="Slash commands"
        >
          <span className="text-sm font-mono">/</span>
        </button>

        <button
          onClick={onFileSelect}
          className="p-1.5 rounded hover:bg-[var(--vscode-toolbar-hoverBackground)] transition-colors"
          title="Add file reference (@)"
        >
          <span className="text-sm font-mono">@</span>
        </button>

        <button
          onClick={onImageSelect}
          className="p-1.5 rounded hover:bg-[var(--vscode-toolbar-hoverBackground)] transition-colors"
          title="Attach image"
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
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </button>
      </div>

      {/* Input Area */}
      <div className="flex items-end gap-2 p-3">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={
            disabled
              ? "Claude is thinking..."
              : "Type your message... (Shift+Enter for new line)"
          }
          className="flex-1 resize-none px-3 py-2 text-sm bg-[var(--vscode-input-background)] border border-[var(--vscode-input-border)] rounded-lg focus:outline-none focus:border-[var(--vscode-focusBorder)] text-[var(--vscode-input-foreground)] placeholder-[var(--vscode-input-placeholderForeground)] disabled:opacity-50 min-h-[40px] max-h-[200px]"
          rows={1}
        />

        <button
          onClick={handleSubmit}
          disabled={disabled || !content.trim()}
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)] hover:bg-[var(--vscode-button-hoverBackground)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Send message (Enter)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
