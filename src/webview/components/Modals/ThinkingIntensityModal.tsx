import React, { useState, useCallback, useEffect } from "react";
import { Modal } from "./Modal";

export type ThinkingLevel = 0 | 1 | 2 | 3;

export interface ThinkingLevelInfo {
    level: ThinkingLevel;
    label: string;
    description: string;
}

const THINKING_LEVELS: ThinkingLevelInfo[] = [
    {
        level: 0,
        label: "Think",
        description: "Basic reasoning - fastest response times",
    },
    {
        level: 1,
        label: "Think Hard",
        description: "More detailed reasoning for complex problems",
    },
    {
        level: 2,
        label: "Think Harder",
        description: "Extended reasoning for challenging tasks",
    },
    {
        level: 3,
        label: "Ultrathink",
        description: "Maximum reasoning depth - highest token usage",
    },
];

export interface ThinkingIntensityModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentLevel: ThinkingLevel;
    onConfirm: (level: ThinkingLevel) => void;
}

export const ThinkingIntensityModal: React.FC<ThinkingIntensityModalProps> = ({
    isOpen,
    onClose,
    currentLevel,
    onConfirm,
}) => {
    const [selectedLevel, setSelectedLevel] = useState<ThinkingLevel>(currentLevel);

    // Reset to current level when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedLevel(currentLevel);
        }
    }, [isOpen, currentLevel]);

    const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedLevel(parseInt(e.target.value, 10) as ThinkingLevel);
    }, []);

    const handleLabelClick = useCallback((level: ThinkingLevel) => {
        setSelectedLevel(level);
    }, []);

    const handleConfirm = useCallback(() => {
        onConfirm(selectedLevel);
        onClose();
    }, [selectedLevel, onConfirm, onClose]);

    const currentInfo = THINKING_LEVELS.find((l) => l.level === selectedLevel);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Thinking Mode Intensity" width="md">
            <div className="space-y-6">
                <p className="text-sm text-[var(--vscode-descriptionForeground)]">
                    Configure the intensity of thinking mode. Higher levels provide more detailed
                    reasoning but consume more tokens.
                </p>

                {/* Slider */}
                <div className="space-y-4">
                    <input
                        type="range"
                        min="0"
                        max="3"
                        step="1"
                        value={selectedLevel}
                        onChange={handleSliderChange}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer"
                        style={{
                            background: `linear-gradient(to right, var(--vscode-progressBar-background) ${
                                (selectedLevel / 3) * 100
                            }%, var(--vscode-input-background) ${(selectedLevel / 3) * 100}%)`,
                        }}
                        aria-label="Thinking intensity level"
                    />

                    {/* Labels */}
                    <div className="flex justify-between">
                        {THINKING_LEVELS.map((level) => (
                            <button
                                key={level.level}
                                onClick={() => handleLabelClick(level.level)}
                                className={`
                  text-xs px-2 py-1 rounded transition-colors
                  ${
                      selectedLevel === level.level
                          ? "text-[var(--vscode-foreground)] font-medium"
                          : "text-[var(--vscode-descriptionForeground)] hover:text-[var(--vscode-foreground)]"
                  }
                `}
                            >
                                {level.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Description */}
                {currentInfo && (
                    <div className="p-3 rounded-md bg-[var(--vscode-textBlockQuote-background)] border-l-3 border-[var(--vscode-textBlockQuote-border)]">
                        <div className="text-sm font-medium mb-1">{currentInfo.label}</div>
                        <p className="text-xs text-[var(--vscode-descriptionForeground)]">
                            {currentInfo.description}
                        </p>
                    </div>
                )}

                {/* Token Usage Indicator */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--vscode-descriptionForeground)]">
                            Token Usage
                        </span>
                        <span className="font-medium">
                            {selectedLevel === 0
                                ? "Low"
                                : selectedLevel === 1
                                  ? "Medium"
                                  : selectedLevel === 2
                                    ? "High"
                                    : "Very High"}
                        </span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--vscode-input-background)] overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                                width: `${((selectedLevel + 1) / 4) * 100}%`,
                                backgroundColor:
                                    selectedLevel < 2
                                        ? "var(--vscode-progressBar-background)"
                                        : selectedLevel === 2
                                          ? "var(--vscode-editorWarning-foreground)"
                                          : "var(--vscode-editorError-foreground)",
                            }}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-2">
                    <button
                        onClick={onClose}
                        className="btn-secondary px-4 py-1.5 text-sm rounded"
                        style={{
                            backgroundColor: "var(--vscode-button-secondaryBackground)",
                            color: "var(--vscode-button-secondaryForeground)",
                        }}
                    >
                        Cancel
                    </button>
                    <button onClick={handleConfirm} className="btn">
                        Confirm
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ThinkingIntensityModal;
