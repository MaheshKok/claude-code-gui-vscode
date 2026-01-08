import React, { useState, useRef, useCallback, useEffect } from "react";
import {
    Send,
    Square,
    Brain,
    ChevronDown,
    FileCode,
    Sparkles,
    AlertTriangle,
    Box,
    Paperclip,
    File,
    Image,
    X,
} from "lucide-react";
import { ThinkingIntensity } from "../../../shared/constants";

/** Attachment interface for files and images */
export interface Attachment {
    id: string;
    type: "file" | "image";
    name: string;
    size: number;
    /** Base64 data URL for preview (images) or just stored reference */
    dataUrl?: string;
}

interface MessageInputProps {
    disabled: boolean;
    currentModel: string;
    planMode: boolean;
    thinkingMode: boolean;
    thinkingIntensity: ThinkingIntensity;
    yoloMode: boolean;
    sessionId?: string | null;
    onSendMessage: (content: string) => void;
    onStop: () => void;
    onModelChange: (model: string) => void;
    onPlanModeToggle: () => void;
    onThinkingModeToggle: () => void;
    onThinkingIntensityChange: (intensity: ThinkingIntensity) => void;
    onYoloModeToggle: () => void;
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
    onStop,
    onModelChange,
    onPlanModeToggle,
    onThinkingModeToggle,
    onThinkingIntensityChange,
    onYoloModeToggle,
    onMcpAction,
    sessionId,
}) => {
    // Build session-specific storage key
    const DRAFT_STORAGE_KEY = sessionId
        ? `claude-code-gui-draft-${sessionId}`
        : "claude-code-gui-draft-global";

    // Initialize content from localStorage
    const [content, setContent] = useState(() => {
        try {
            return localStorage.getItem(DRAFT_STORAGE_KEY) || "";
        } catch {
            return "";
        }
    });
    const [showModelSelector, setShowModelSelector] = useState(false);
    const [showThinkingSelector, setShowThinkingSelector] = useState(false);
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const modelSelectorRef = useRef<HTMLDivElement>(null);
    const thinkingSelectorRef = useRef<HTMLDivElement>(null);
    const attachmentMenuRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    // Attachment storage key
    const ATTACHMENT_STORAGE_KEY = sessionId
        ? `claude-code-gui-attachments-${sessionId}`
        : "claude-code-gui-attachments-global";

    // Initialize attachments from localStorage
    const [attachments, setAttachments] = useState<Attachment[]>(() => {
        try {
            const saved = localStorage.getItem(ATTACHMENT_STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // Track previous storage key to detect session changes
    const prevStorageKeyRef = useRef<string>(DRAFT_STORAGE_KEY);

    // Reload content when sessionId/storage key changes
    useEffect(() => {
        if (prevStorageKeyRef.current !== DRAFT_STORAGE_KEY) {
            // Session changed - load content for the new session
            try {
                const savedContent = localStorage.getItem(DRAFT_STORAGE_KEY) || "";
                setContent(savedContent);
                // Also load attachments for the new session
                const savedAttachments = localStorage.getItem(ATTACHMENT_STORAGE_KEY);
                setAttachments(savedAttachments ? JSON.parse(savedAttachments) : []);
            } catch {
                setContent("");
                setAttachments([]);
            }
            prevStorageKeyRef.current = DRAFT_STORAGE_KEY;
        }
    }, [DRAFT_STORAGE_KEY, ATTACHMENT_STORAGE_KEY]);

    // Save attachments to localStorage whenever they change
    useEffect(() => {
        try {
            if (attachments.length > 0) {
                localStorage.setItem(ATTACHMENT_STORAGE_KEY, JSON.stringify(attachments));
            } else {
                localStorage.removeItem(ATTACHMENT_STORAGE_KEY);
            }
        } catch {
            // Ignore localStorage errors
        }
    }, [attachments, ATTACHMENT_STORAGE_KEY]);

    // Save content to localStorage whenever it changes
    useEffect(() => {
        try {
            if (content) {
                localStorage.setItem(DRAFT_STORAGE_KEY, content);
            } else {
                localStorage.removeItem(DRAFT_STORAGE_KEY);
            }
        } catch {
            // Ignore localStorage errors
        }
    }, [content, DRAFT_STORAGE_KEY]);

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
            if (
                attachmentMenuRef.current &&
                !attachmentMenuRef.current.contains(event.target as Node)
            ) {
                setShowAttachmentMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSubmit = useCallback(() => {
        const trimmedContent = content.trim();
        if ((trimmedContent || attachments.length > 0) && !disabled) {
            onSendMessage(trimmedContent);
            setContent("");
            setAttachments([]);
            // Clear the draft and attachments from localStorage
            try {
                localStorage.removeItem(DRAFT_STORAGE_KEY);
                localStorage.removeItem(ATTACHMENT_STORAGE_KEY);
            } catch {
                // Ignore localStorage errors
            }
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
            }
        }
    }, [content, attachments, disabled, onSendMessage, DRAFT_STORAGE_KEY, ATTACHMENT_STORAGE_KEY]);

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

    // File/Image attachment handlers
    const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        Array.from(files).forEach((file) => {
            const reader = new FileReader();
            reader.onload = () => {
                const newAttachment: Attachment = {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    type: "file",
                    name: file.name,
                    size: file.size,
                    dataUrl: reader.result as string,
                };
                setAttachments((prev) => [...prev, newAttachment]);
            };
            reader.readAsDataURL(file);
        });

        // Reset file input
        event.target.value = "";
        setShowAttachmentMenu(false);
    }, []);

    const handleImageSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        Array.from(files).forEach((file) => {
            const reader = new FileReader();
            reader.onload = () => {
                const newAttachment: Attachment = {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    type: "image",
                    name: file.name,
                    size: file.size,
                    dataUrl: reader.result as string,
                };
                setAttachments((prev) => [...prev, newAttachment]);
            };
            reader.readAsDataURL(file);
        });

        // Reset file input
        event.target.value = "";
        setShowAttachmentMenu(false);
    }, []);

    const handleRemoveAttachment = useCallback((id: string) => {
        setAttachments((prev) => prev.filter((a) => a.id !== id));
    }, []);

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // Drag and drop state
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Process files from drag/drop or paste
    const processFiles = useCallback((files: FileList | File[]) => {
        Array.from(files).forEach((file) => {
            const isImage = file.type.startsWith("image/");
            const reader = new FileReader();
            reader.onload = () => {
                const newAttachment: Attachment = {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    type: isImage ? "image" : "file",
                    name: file.name,
                    size: file.size,
                    dataUrl: reader.result as string,
                };
                setAttachments((prev) => [...prev, newAttachment]);
            };
            reader.readAsDataURL(file);
        });
    }, []);

    // Handle drag events
    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Only set dragging to false if leaving the container entirely
        if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
            setIsDragging(false);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                processFiles(files);
            }
        },
        [processFiles],
    );

    // Handle paste events
    const handlePaste = useCallback(
        (e: React.ClipboardEvent) => {
            const items = e.clipboardData.items;
            const files: File[] = [];

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.kind === "file") {
                    const file = item.getAsFile();
                    if (file) {
                        files.push(file);
                    }
                }
            }

            if (files.length > 0) {
                e.preventDefault();
                processFiles(files);
            }
        },
        [processFiles],
    );

    const currentModelName = MODELS.find((m) => m.id === currentModel)?.shortName || "Model";
    const currentThinkingMode =
        THINKING_MODES.find((m) => m.id === thinkingIntensity) || THINKING_MODES[0];

    return (
        <div
            ref={containerRef}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`relative glass rounded-2xl shadow-2xl overflow-visible transition-all duration-300 focus-within:shadow-[0_0_20px_rgba(237,110,29,0.25)] ${
                isDragging
                    ? "!border-orange-500 ring-2 ring-orange-500/30 bg-orange-500/5"
                    : "!border-orange-500/60 focus-within:!border-orange-500"
            }`}
        >
            {/* Drag overlay */}
            {isDragging && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-2xl pointer-events-none">
                    <div className="flex flex-col items-center gap-2 text-orange-400">
                        <Paperclip className="w-8 h-8" />
                        <span className="text-sm font-medium">Drop files here</span>
                    </div>
                </div>
            )}
            {/* Hidden file inputs */}
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                multiple
                accept=".txt,.md,.json,.js,.ts,.tsx,.jsx,.py,.css,.html,.xml,.yaml,.yml,.csv,.log"
            />
            <input
                ref={imageInputRef}
                type="file"
                className="hidden"
                onChange={handleImageSelect}
                multiple
                accept="image/*"
            />

            {/* Attachments Preview */}
            {attachments.length > 0 && (
                <div className="px-3 pt-3 pb-1 flex flex-wrap gap-2">
                    {attachments.map((attachment) => (
                        <div
                            key={attachment.id}
                            className="flex items-center gap-2 px-2 py-1 bg-white/10 rounded-lg border border-white/10 group"
                        >
                            {attachment.type === "image" && attachment.dataUrl ? (
                                <img
                                    src={attachment.dataUrl}
                                    alt={attachment.name}
                                    className="w-6 h-6 rounded object-cover"
                                />
                            ) : (
                                <File className="w-4 h-4 text-blue-400" />
                            )}
                            <span className="text-xs text-white/70 max-w-[100px] truncate">
                                {attachment.name}
                            </span>
                            <span className="text-[10px] text-white/40">
                                {formatFileSize(attachment.size)}
                            </span>
                            <button
                                onClick={() => handleRemoveAttachment(attachment.id)}
                                className="p-0.5 rounded hover:bg-white/20 text-white/40 hover:text-white transition-colors"
                                title="Remove attachment"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Input Area */}
            <div className="p-3">
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    disabled={disabled}
                    placeholder={disabled ? "Claude is thinking..." : "How can I help you?"}
                    className="w-full bg-transparent border-none !outline-none !focus:ring-0 !focus:outline-none resize-none text-white text-base placeholder-white/30 min-h-[50px] max-h-[200px] leading-relaxed selection:bg-orange-500/30 selection:text-white"
                    rows={1}
                />
            </div>

            {/* Toolbar */}
            <div className="flex items-start justify-between gap-1 px-2 py-1.5 bg-black/10 border-t border-white/5 rounded-b-2xl backdrop-blur-sm">
                <div className="flex flex-1 min-w-0 flex-wrap items-center gap-0.5">
                    {/* Model Selector */}
                    <div className="relative" ref={modelSelectorRef}>
                        <button
                            onClick={() => setShowModelSelector(!showModelSelector)}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-all duration-200 border border-transparent hover:border-white/5"
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
                    {/* Attachment Button */}
                    <div className="relative" ref={attachmentMenuRef}>
                        <button
                            className="btn-icon"
                            onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                            title="Attach file or image"
                        >
                            <Paperclip className="w-4 h-4" />
                        </button>

                        {showAttachmentMenu && (
                            <div className="absolute bottom-full left-0 mb-2 py-1 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 min-w-[160px] overflow-hidden animate-slide-up backdrop-blur-xl">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 transition-colors flex items-center gap-3"
                                >
                                    <File className="w-4 h-4 text-blue-400" />
                                    <span>Upload File</span>
                                </button>
                                <button
                                    onClick={() => imageInputRef.current?.click()}
                                    className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 transition-colors flex items-center gap-3"
                                >
                                    <Image className="w-4 h-4 text-green-400" />
                                    <span>Upload Image</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="w-px h-4 bg-white/10 mx-0.5" />

                    {/* Thinking Mode */}
                    <div className="relative" ref={thinkingSelectorRef}>
                        <button
                            onClick={() => setShowThinkingSelector(!showThinkingSelector)}
                            className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg transition-all duration-200 border border-transparent ${
                                thinkingMode
                                    ? "text-orange-400 bg-orange-500/10 border-orange-500/20"
                                    : "text-white/70 hover:bg-white/10 hover:text-white hover:border-white/5"
                            }`}
                        >
                            <Brain className="w-3.5 h-3.5" />
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

                    {/* Plan Mode */}
                    <div className="relative group/plan">
                        <button
                            onClick={onPlanModeToggle}
                            className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-lg transition-all duration-200 border border-transparent ${
                                planMode
                                    ? "text-blue-400 bg-blue-500/10 border-blue-500/20"
                                    : "text-white/70 hover:bg-white/10 hover:text-white hover:border-white/5"
                            }`}
                        >
                            <div className="flex items-center gap-1.5">
                                <FileCode className="w-3.5 h-3.5" />
                                <span>Plan</span>
                            </div>
                            <div
                                className={`w-7 h-4 rounded-full relative transition-colors duration-200 ${
                                    planMode ? "bg-blue-500" : "bg-white/20"
                                }`}
                            >
                                <div
                                    className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-200 shadow-sm ${
                                        planMode ? "left-3.5" : "left-0.5"
                                    }`}
                                />
                            </div>
                        </button>
                        {/* Custom Tooltip for Plan */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#1a1a1a] border border-white/20 rounded-lg shadow-xl opacity-0 invisible group-hover/plan:opacity-100 group-hover/plan:visible transition-all duration-200 z-50 whitespace-nowrap text-xs">
                            <div className="text-white/90">
                                {planMode ? (
                                    <span className="text-blue-400">
                                        ✓ Plan mode: Claude will only read and analyze
                                    </span>
                                ) : (
                                    <span>Enable Plan mode: Read-only analysis</span>
                                )}
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1a1a1a]" />
                        </div>
                    </div>

                    {/* YOLO Mode */}
                    <div className="relative group/yolo">
                        <button
                            onClick={onYoloModeToggle}
                            className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-lg transition-all duration-200 border border-transparent ${
                                yoloMode
                                    ? "text-red-400 bg-red-700/20 border-red-500/30"
                                    : "text-white/70 hover:bg-white/10 hover:text-white hover:border-white/5"
                            }`}
                        >
                            <div className="flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>YOLO</span>
                            </div>
                            <div
                                className={`w-7 h-4 rounded-full relative transition-colors duration-200 ${
                                    yoloMode ? "bg-red-500" : "bg-white/20"
                                }`}
                            >
                                <div
                                    className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-200 shadow-sm ${
                                        yoloMode ? "left-3.5" : "left-0.5"
                                    }`}
                                />
                            </div>
                        </button>
                        {/* Custom Tooltip for YOLO */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#1a1a1a] border border-white/20 rounded-lg shadow-xl opacity-0 invisible group-hover/yolo:opacity-100 group-hover/yolo:visible transition-all duration-200 z-50 whitespace-nowrap text-xs">
                            <div className="text-white/90">
                                {yoloMode ? (
                                    <span className="text-red-400">
                                        ⚡ YOLO mode: Auto-approving all operations
                                    </span>
                                ) : (
                                    <span>Enable YOLO mode: Auto-approve (use caution!)</span>
                                )}
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1a1a1a]" />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                    <button className="btn-icon" onClick={onMcpAction} title="MCP Tools">
                        <Box className="w-4 h-4" />
                    </button>
                    {disabled ? (
                        <button
                            onClick={onStop}
                            className="flex items-center justify-center p-2 rounded-lg transition-all duration-300 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 hover:scale-105 active:scale-95"
                            title="Stop processing (Escape)"
                        >
                            <Square className="w-4 h-4 fill-current" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={!content.trim() && attachments.length === 0}
                            className={`flex items-center justify-center p-2 rounded-lg transition-all duration-300
                        ${
                            !content.trim() && attachments.length === 0
                                ? "opacity-50 cursor-not-allowed bg-white/5 text-white/30"
                                : "bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/30 hover:scale-110 active:scale-95 hover:shadow-orange-500/50"
                        }
                    `}
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageInput;
