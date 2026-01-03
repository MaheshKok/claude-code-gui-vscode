import React, { useCallback } from "react";

export type InstallState = "initial" | "installing" | "success" | "error";

export interface InstallModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInstall?: () => Promise<void>;
    installState?: InstallState;
    errorMessage?: string;
}

export const InstallModal: React.FC<InstallModalProps> = ({
    isOpen,
    onClose,
    onInstall = async () => {},
    installState = "initial",
    errorMessage,
}) => {
    const handleInstall = useCallback(async () => {
        try {
            await onInstall();
        } catch (_error) {
            // Error handling is done via installState prop
        }
    }, [onInstall]);

    const handleBackdropClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (e.target === e.currentTarget && installState !== "installing") {
                onClose();
            }
        },
        [installState, onClose],
    );

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-modal-title"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleBackdropClick}
                aria-hidden="true"
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-sm bg-[var(--vscode-editorWidget-background)] border border-[var(--vscode-editorWidget-border)] rounded-lg shadow-xl p-6">
                {/* Close Button (only show when not installing) */}
                {installState !== "installing" && (
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-1 rounded hover:bg-[var(--vscode-toolbar-hoverBackground)] transition-colors"
                        aria-label="Close modal"
                    >
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
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                )}

                {/* Initial State */}
                {installState === "initial" && (
                    <div className="text-center space-y-4">
                        <div className="flex justify-center">
                            <div className="p-3 rounded-full bg-[var(--vscode-button-background)]/10">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="40"
                                    height="40"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="var(--vscode-button-background)"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <path d="M12 3v12M12 15l-4-4M12 15l4-4" />
                                </svg>
                            </div>
                        </div>

                        <div>
                            <h2
                                id="install-modal-title"
                                className="text-lg font-semibold text-[var(--vscode-foreground)]"
                            >
                                Install Claude Code
                            </h2>
                            <p className="text-sm text-[var(--vscode-descriptionForeground)] mt-1">
                                The CLI is required to use this extension
                            </p>
                        </div>

                        <button onClick={handleInstall} className="btn w-full">
                            Install Now
                        </button>

                        <a
                            href="https://docs.anthropic.com/en/docs/claude-code"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block text-sm text-[var(--vscode-textLink-foreground)] hover:underline"
                        >
                            View documentation
                        </a>
                    </div>
                )}

                {/* Installing State */}
                {installState === "installing" && (
                    <div className="text-center space-y-4 py-4">
                        <div className="flex justify-center">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-full border-2 border-[var(--vscode-progressBar-background)] border-t-transparent animate-spin" />
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-[var(--vscode-foreground)]">
                                Installing Claude Code...
                            </p>
                            <p className="text-xs text-[var(--vscode-descriptionForeground)] mt-1">
                                This may take a minute
                            </p>
                        </div>
                    </div>
                )}

                {/* Success State */}
                {installState === "success" && (
                    <div className="text-center space-y-4 py-4">
                        <div className="flex justify-center">
                            <div className="p-3 rounded-full bg-green-500/10">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="40"
                                    height="40"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#22c55e"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-[var(--vscode-foreground)]">
                                Installation Complete
                            </p>
                            <p className="text-xs text-[var(--vscode-descriptionForeground)] mt-1">
                                Send a message to get started
                            </p>
                        </div>

                        <button onClick={onClose} className="btn w-full">
                            Get Started
                        </button>
                    </div>
                )}

                {/* Error State */}
                {installState === "error" && (
                    <div className="text-center space-y-4 py-4">
                        <div className="flex justify-center">
                            <div className="p-3 rounded-full bg-[var(--vscode-errorForeground)]/10">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="40"
                                    height="40"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="var(--vscode-errorForeground)"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="15" y1="9" x2="9" y2="15" />
                                    <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-[var(--vscode-foreground)]">
                                Installation Failed
                            </p>
                            {errorMessage && (
                                <p className="text-xs text-[var(--vscode-errorForeground)] mt-1">
                                    {errorMessage}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <button onClick={handleInstall} className="btn flex-1">
                                Retry
                            </button>
                            <button
                                onClick={onClose}
                                className="btn-secondary flex-1 px-3 py-1.5 text-sm rounded"
                                style={{
                                    backgroundColor: "var(--vscode-button-secondaryBackground)",
                                    color: "var(--vscode-button-secondaryForeground)",
                                }}
                            >
                                Close
                            </button>
                        </div>

                        <a
                            href="https://docs.anthropic.com/en/docs/claude-code"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block text-sm text-[var(--vscode-textLink-foreground)] hover:underline"
                        >
                            Manual installation instructions
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InstallModal;
