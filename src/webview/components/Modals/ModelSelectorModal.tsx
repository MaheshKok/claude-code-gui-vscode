import React, { useCallback } from "react";
import { Modal } from "./Modal";

export type ModelOption = "opus" | "sonnet" | "haiku" | "default";

export interface ModelInfo {
    id: ModelOption;
    name: string;
    description: string;
    modelId?: string;
}

const MODELS: ModelInfo[] = [
    {
        id: "sonnet",
        name: "Sonnet 4.5 - Balanced model",
        description: "Good balance of speed and capability (recommended)",
        modelId: "claude-sonnet-4-5-20250929",
    },
    {
        id: "opus",
        name: "Opus 4.5 - Most capable model",
        description: "Best for complex tasks and highest quality output",
        modelId: "claude-opus-4-5-20251101",
    },
    {
        id: "haiku",
        name: "Haiku 4.5 - Fast model",
        description: "Fastest responses for simpler tasks",
        modelId: "claude-haiku-4-5-20251001",
    },
];

export interface ModelSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedModel: ModelOption;
    onSelectModel: (model: ModelOption) => void;
    onConfigure: () => void;
}

export const ModelSelectorModal: React.FC<ModelSelectorModalProps> = ({
    isOpen,
    onClose,
    selectedModel,
    onSelectModel,
    onConfigure,
}) => {
    const handleSelect = useCallback(
        (model: ModelOption) => {
            onSelectModel(model);
            onClose();
        },
        [onSelectModel, onClose],
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Enforce Model" width="sm">
            <div className="space-y-4">
                <p className="text-xs text-[var(--vscode-descriptionForeground)]">
                    This overrides your default model setting for this conversation only.
                </p>

                <div className="space-y-2">
                    {MODELS.map((model) => (
                        <label
                            key={model.id}
                            className={`
                flex items-start gap-3 p-3 rounded-md cursor-pointer transition-colors
                border border-[var(--vscode-editorWidget-border)]
                ${
                    selectedModel === model.id
                        ? "bg-[var(--vscode-list-activeSelectionBackground)] border-[var(--vscode-focusBorder)]"
                        : "hover:bg-[var(--vscode-list-hoverBackground)]"
                }
              `}
                            onClick={() => handleSelect(model.id)}
                        >
                            <input
                                type="radio"
                                name="model"
                                value={model.id}
                                checked={selectedModel === model.id}
                                onChange={() => handleSelect(model.id)}
                                className="mt-1 w-4 h-4"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-medium">{model.name}</span>
                                    {model.id === "default" && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onConfigure();
                                            }}
                                            className="px-2 py-1 text-xs rounded hover:bg-[var(--vscode-toolbar-hoverBackground)] text-[var(--vscode-textLink-foreground)]"
                                        >
                                            Configure
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-[var(--vscode-descriptionForeground)] mt-0.5">
                                    {model.description}
                                </p>
                            </div>
                        </label>
                    ))}
                </div>
            </div>
        </Modal>
    );
};

export default ModelSelectorModal;
