import React, { useState, useCallback } from "react";
import { Modal } from "./Modal";

export interface PermissionRequest {
    id: string;
    toolName: string;
    input: Record<string, unknown>;
    description?: string;
}

export interface PermissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: PermissionRequest | null;
    onAllow: (requestId: string) => void;
    onDeny: (requestId: string, reason?: string) => void;
    onAlwaysAllow: (requestId: string, pattern: string) => void;
}

export const PermissionModal: React.FC<PermissionModalProps> = ({
    isOpen,
    onClose,
    request,
    onAllow,
    onDeny,
    onAlwaysAllow,
}) => {
    const [denyReason, setDenyReason] = useState("");
    const [showDenyReason, setShowDenyReason] = useState(false);
    const [alwaysAllowPattern, setAlwaysAllowPattern] = useState("");
    const [showAlwaysAllow, setShowAlwaysAllow] = useState(false);

    const handleAllow = useCallback(() => {
        if (request) {
            onAllow(request.id);
            onClose();
        }
    }, [request, onAllow, onClose]);

    const handleDeny = useCallback(() => {
        if (request) {
            onDeny(request.id, denyReason || undefined);
            setDenyReason("");
            setShowDenyReason(false);
            onClose();
        }
    }, [request, onDeny, denyReason, onClose]);

    const handleAlwaysAllow = useCallback(() => {
        if (request && alwaysAllowPattern) {
            onAlwaysAllow(request.id, alwaysAllowPattern);
            setAlwaysAllowPattern("");
            setShowAlwaysAllow(false);
            onClose();
        }
    }, [request, alwaysAllowPattern, onAlwaysAllow, onClose]);

    const formatInput = (input: Record<string, unknown>): string => {
        try {
            return JSON.stringify(input, null, 2);
        } catch {
            return String(input);
        }
    };

    const getDefaultPattern = (): string => {
        if (!request) return "";

        // Generate a reasonable default pattern based on the tool
        if (request.toolName === "Bash" && request.input.command) {
            const command = String(request.input.command);
            const firstWord = command.split(" ")[0];
            return `${firstWord} *`;
        }

        return request.toolName;
    };

    if (!request) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Permission Request"
            width="md"
            closeOnBackdrop={false}
            className="border-l-4 border-l-[var(--vscode-editorWarning-foreground)]"
        >
            <div className="space-y-4">
                {/* Warning Banner */}
                <div className="flex items-start gap-3 p-3 rounded-md bg-[var(--vscode-inputValidation-warningBackground)] border border-[var(--vscode-inputValidation-warningBorder)]">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--vscode-editorWarning-foreground)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="flex-shrink-0 mt-0.5"
                    >
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <div className="text-sm">
                        <p className="font-medium text-[var(--vscode-editorWarning-foreground)]">
                            Claude wants to use: {request.toolName}
                        </p>
                        {request.description && (
                            <p className="mt-1 text-[var(--vscode-descriptionForeground)]">
                                {request.description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Input Preview */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-[var(--vscode-descriptionForeground)] uppercase tracking-wide">
                        Tool Input
                    </label>
                    <div className="code-block">
                        <pre className="code-block-content text-xs overflow-x-auto max-h-40">
                            {formatInput(request.input)}
                        </pre>
                    </div>
                </div>

                {/* Deny Reason (collapsible) */}
                {showDenyReason && (
                    <div className="space-y-2">
                        <label
                            htmlFor="deny-reason"
                            className="text-xs font-medium text-[var(--vscode-descriptionForeground)]"
                        >
                            Reason for denial (optional)
                        </label>
                        <textarea
                            id="deny-reason"
                            value={denyReason}
                            onChange={(e) => setDenyReason(e.target.value)}
                            placeholder="Explain why you're denying this request..."
                            className="textarea h-20"
                        />
                    </div>
                )}

                {/* Always Allow Pattern (collapsible) */}
                {showAlwaysAllow && (
                    <div className="space-y-2">
                        <label
                            htmlFor="always-allow-pattern"
                            className="text-xs font-medium text-[var(--vscode-descriptionForeground)]"
                        >
                            Pattern to always allow
                        </label>
                        <input
                            id="always-allow-pattern"
                            type="text"
                            value={alwaysAllowPattern}
                            onChange={(e) => setAlwaysAllowPattern(e.target.value)}
                            placeholder="e.g., npm i * or git status"
                            className="input"
                        />
                        <p className="text-xs text-[var(--vscode-descriptionForeground)]">
                            Use * as wildcard. This pattern will be allowed automatically in the
                            future.
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                    <button onClick={handleAllow} className="btn flex-1">
                        Allow
                    </button>

                    {showDenyReason ? (
                        <button
                            onClick={handleDeny}
                            className="btn-secondary flex-1 px-3 py-1.5 text-sm rounded"
                            style={{
                                backgroundColor: "var(--vscode-button-secondaryBackground)",
                                color: "var(--vscode-button-secondaryForeground)",
                            }}
                        >
                            Confirm Deny
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowDenyReason(true)}
                            className="btn-secondary flex-1 px-3 py-1.5 text-sm rounded"
                            style={{
                                backgroundColor: "var(--vscode-button-secondaryBackground)",
                                color: "var(--vscode-button-secondaryForeground)",
                            }}
                        >
                            Deny
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {showAlwaysAllow ? (
                        <>
                            <button
                                onClick={handleAlwaysAllow}
                                disabled={!alwaysAllowPattern}
                                className="btn flex-1 text-xs"
                            >
                                Always Allow Pattern
                            </button>
                            <button
                                onClick={() => {
                                    setShowAlwaysAllow(false);
                                    setAlwaysAllowPattern("");
                                }}
                                className="btn-secondary px-3 py-1.5 text-xs rounded"
                                style={{
                                    backgroundColor: "var(--vscode-button-secondaryBackground)",
                                    color: "var(--vscode-button-secondaryForeground)",
                                }}
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => {
                                setShowAlwaysAllow(true);
                                setAlwaysAllowPattern(getDefaultPattern());
                            }}
                            className="text-xs text-[var(--vscode-textLink-foreground)] hover:underline"
                        >
                            Always allow this pattern...
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default PermissionModal;
