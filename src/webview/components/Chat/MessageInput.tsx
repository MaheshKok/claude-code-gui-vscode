import React, { useState, useRef, useCallback, useEffect } from "react";
import {
    Send,
    Paperclip,
    Image,
    Command,
    Box,
    BrainCircuit,
    ChevronDown,
    FileCode,
    Sparkles,
    AlertTriangle,
} from "lucide-react";
import { ThinkingIntensity } from "../../../shared/constants";

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
const THINKING_MODES: Array<{
    id: ThinkingIntensity;
    label: string;
    tokens: string;
    description: string;
}> = [
    {
        id: ThinkingIntensity.Think,
        label: "Think",
        tokens: "4K tokens",
        description: "Basic reasoning",
    },
    {
        id: ThinkingIntensity.ThinkHard,
        label: "Think Hard",
        tokens: "10K tokens",
        description: "Deeper analysis",
    },
    {
        id: ThinkingIntensity.ThinkHarder,
        label: "Think Harder",
        tokens: "20K tokens",
        description: "Comprehensive reasoning",
    },
    {
        id: ThinkingIntensity.Ultrathink,
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
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [content]);

    // Close dropdowns
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
            if (!thinkingMode) onThinkingModeToggle();
            setShowThinkingSelector(false);
        },
        [onThinkingIntensityChange, thinkingMode, onThinkingModeToggle],
    );

    const currentModelName = MODELS.find((m) => m.id === currentModel)?.shortName || "Model";
    const currentThinkingMode =
        THINKING_MODES.find((m) => m.id === thinkingIntensity) || THINKING_MODES[0];

    return (
        <div className="glass rounded-2xl shadow-2xl !border-orange-500/60 overflow-visible transition-all duration-300 focus-within:!border-orange-500 focus-within:shadow-[0_0_20px_rgba(237,110,29,0.25)]">
            {/* Input Area */}
            <div className="p-3">
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    placeholder={disabled ? "Claude is thinking..." : "How can I help you?"}
                    className="w-full bg-transparent border-none !outline-none !focus:ring-0 !focus:outline-none resize-none text-white text-base placeholder-white/30 min-h-[50px] max-h-[200px] leading-relaxed selection:bg-orange-500/30 selection:text-white"
                    rows={1}
                />
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 py-2 bg-black/10 border-t border-white/5 rounded-b-2xl backdrop-blur-sm">
                <div className="flex items-center gap-1.5">
                    {/* Model Selector */}
                    <div className="relative" ref={modelSelectorRef}>
                        <button
                            onClick={() => setShowModelSelector(!showModelSelector)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-all duration-200 border border-transparent hover:border-white/5"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                            <span>{currentModelName}</span>
                            <ChevronDown className="w-3 h-3 opacity-50" />
                        </button>

                        {showModelSelector && (
                            <div className="absolute bottom-full left-0 mb-2 py-1 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 min-w-[200px] overflow-hidden animate-slide-up backdrop-blur-xl">
                                {MODELS.map((model) => (
                                    <button
                                        key={model.id}
                                        onClick={() => handleModelSelect(model.id)}
                                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 transition-colors flex items-center justify-between group ${
                                            currentModel === model.id
                                                ? "bg-orange-500/10 text-orange-400 font-medium"
                                                : "text-white/80"
                                        }`}
                                    >
                                        {model.name}
                                        {currentModel === model.id && (
                                            <Sparkles className="w-3 h-3" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="w-px h-4 bg-white/10 mx-1" />

                    {/* Thinking Mode */}
                    <div className="relative" ref={thinkingSelectorRef}>
                        <button
                            onClick={() => setShowThinkingSelector(!showThinkingSelector)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 border border-transparent ${
                                thinkingMode
                                    ? "text-orange-400 bg-orange-500/10 border-orange-500/20"
                                    : "text-white/70 hover:bg-white/10 hover:text-white hover:border-white/5"
                            }`}
                        >
                            <BrainCircuit className="w-3.5 h-3.5" />
                            <span>{thinkingMode ? currentThinkingMode.label : "Think"}</span>
                        </button>
                        {showThinkingSelector && (
                            <div className="absolute bottom-full left-0 mb-2 p-1 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 min-w-[240px] animate-slide-up backdrop-blur-xl">
                                <div className="p-2 border-b border-white/5 mb-1">
                                    <button
                                        onClick={() => {
                                            onThinkingModeToggle();
                                            setShowThinkingSelector(false);
                                        }}
                                        className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-white/5 transition-colors"
                                    >
                                        <span className="text-sm font-medium text-white">
                                            Enable Thinking
                                        </span>
                                        <div
                                            className={`w-9 h-5 rounded-full relative transition-colors ${thinkingMode ? "bg-orange-500" : "bg-white/20"}`}
                                        >
                                            <div
                                                className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${thinkingMode ? "left-5" : "left-1"}`}
                                            />
                                        </div>
                                    </button>
                                </div>
                                {THINKING_MODES.map((mode) => (
                                    <button
                                        key={mode.id}
                                        onClick={() => handleThinkingSelect(mode.id)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors mb-0.5 ${
                                            thinkingIntensity === mode.id && thinkingMode
                                                ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                                                : "text-white/70"
                                        }`}
                                    >
                                        <div className="flex justify-between items-center mb-0.5">
                                            <span className="font-medium">{mode.label}</span>
                                            <span className="text-[10px] opacity-60 bg-white/5 px-1.5 py-0.5 rounded">
                                                {mode.tokens}
                                            </span>
                                        </div>
                                        <div className="text-[10px] opacity-50">
                                            {mode.description}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={onPlanModeToggle}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 border border-transparent ${
                            planMode
                                ? "text-blue-400 bg-blue-500/10 border-blue-500/20"
                                : "text-white/70 hover:bg-white/10 hover:text-white hover:border-white/5"
                        }`}
                    >
                        <FileCode className="w-3.5 h-3.5" />
                        <span>Plan</span>
                    </button>

                    <button
                        onClick={onYoloModeToggle}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 border border-transparent ${
                            yoloMode
                                ? "text-red-400 bg-red-700/20 border-red-500/30"
                                : "text-white/70 hover:bg-white/10 hover:text-white hover:border-white/5"
                        }`}
                    >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>YOLO</span>
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button className="btn-icon" onClick={onFileSelect} title="Add File (@)">
                        <Paperclip className="w-4 h-4" />
                    </button>
                    <button className="btn-icon" onClick={onMcpAction} title="MCP Tools">
                        <Box className="w-4 h-4" />
                    </button>
                    <button className="btn-icon" onClick={onImageSelect} title="Add Image">
                        <Image className="w-4 h-4" />
                    </button>
                    <button className="btn-icon" onClick={onSlashCommand} title="Commands (/)">
                        <Command className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={disabled || !content.trim()}
                        className={`flex items-center justify-center p-2 rounded-lg transition-all duration-300
                    ${
                        disabled || !content.trim()
                            ? "opacity-50 cursor-not-allowed bg-white/5 text-white/30"
                            : "bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/30 hover:scale-110 active:scale-95 hover:shadow-orange-500/50"
                    }
                `}
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MessageInput;
