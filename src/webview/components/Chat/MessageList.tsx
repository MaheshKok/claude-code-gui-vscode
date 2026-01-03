import React, { useRef, useEffect } from "react";
import { Message as MessageComponent } from "./Message";
import type { Message } from "../App";

interface MessageListProps {
    messages: Message[];
    isProcessing: boolean;
    showEmptyState?: boolean;
    isScrollable?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
    messages,
    isProcessing,
    showEmptyState = true,
    isScrollable = true,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isProcessing]);

    if (messages.length === 0 && showEmptyState) {
        return (
            <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
                <div className="mb-4 text-6xl opacity-20">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="64"
                        height="64"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                </div>
                <h2 className="text-xl font-medium text-[var(--vscode-foreground)] mb-2">
                    Start a conversation
                </h2>
                <p className="text-sm text-[var(--vscode-descriptionForeground)] max-w-md">
                    Ask Claude anything about your code, get help with debugging, or request code
                    generation. Use slash commands for quick actions.
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-6">
                    <QuickAction label="Explain code" icon="?" />
                    <QuickAction label="Fix bug" icon="!" />
                    <QuickAction label="Write tests" icon="T" />
                    <QuickAction label="Refactor" icon="R" />
                </div>
            </div>
        );
    }

    const containerClasses = isScrollable
        ? "flex-1 overflow-y-auto px-4 py-4 space-y-4"
        : "px-4 py-4 space-y-4";

    const lastAssistantId = (() => {
        for (let i = messages.length - 1; i >= 0; i -= 1) {
            if (messages[i].role === "assistant") {
                return messages[i].id;
            }
        }
        return null;
    })();

    return (
        <div ref={containerRef} className={containerClasses}>
            {messages.map((message) => (
                <MessageComponent
                    key={message.id}
                    message={message}
                    showPreview={message.id === lastAssistantId}
                />
            ))}

            {isProcessing && (
                <div className="flex items-center gap-2 p-4 rounded-lg bg-[var(--vscode-editor-inactiveSelectionBackground)]">
                    <div className="flex gap-1">
                        <span
                            className="w-2 h-2 bg-[var(--vscode-progressBar-background)] rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                        />
                        <span
                            className="w-2 h-2 bg-[var(--vscode-progressBar-background)] rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                        />
                        <span
                            className="w-2 h-2 bg-[var(--vscode-progressBar-background)] rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                        />
                    </div>
                    <span className="text-sm text-[var(--vscode-descriptionForeground)]">
                        Claude is thinking...
                    </span>
                </div>
            )}

            <div ref={bottomRef} />
        </div>
    );
};

interface QuickActionProps {
    label: string;
    icon: string;
}

const QuickAction: React.FC<QuickActionProps> = ({ label, icon }) => {
    return (
        <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-[var(--vscode-input-border)] hover:bg-[var(--vscode-list-hoverBackground)] transition-colors">
            <span className="w-6 h-6 flex items-center justify-center rounded bg-[var(--vscode-badge-background)] text-[var(--vscode-badge-foreground)] text-xs font-bold">
                {icon}
            </span>
            {label}
        </button>
    );
};

export default MessageList;
