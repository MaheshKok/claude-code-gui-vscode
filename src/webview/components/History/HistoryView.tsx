/**
 * History View Component
 * Displays chat history and allows loading previous conversations
 */
import React, { useState, useEffect, useCallback } from "react";
import { Clock, MessageSquare, Trash2, Search, FolderOpen } from "lucide-react";

interface ConversationSummary {
    filename: string;
    timestamp: Date;
    preview: string;
    messageCount: number;
}

export const HistoryView: React.FC = () => {
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Request conversation list from extension
        window.vscode?.postMessage({ type: "getConversationList" });

        // Listen for messages from extension
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            switch (message.type) {
                case "conversationList":
                    setConversations(message.conversations || []);
                    setIsLoading(false);
                    break;
                case "conversationDeleted":
                    setConversations((prev) => prev.filter((c) => c.filename !== message.filename));
                    break;
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, []);

    const handleLoadConversation = useCallback((filename: string) => {
        window.vscode?.postMessage({
            type: "loadConversation",
            filename,
        });
    }, []);

    const handleDeleteConversation = useCallback((filename: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this conversation?")) {
            window.vscode?.postMessage({
                type: "deleteConversation",
                filename,
            });
        }
    }, []);

    const filteredConversations = conversations.filter((conv) =>
        conv.preview.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const formatDate = (date: Date) => {
        const d = new Date(date);
        return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--vscode-focusBorder)]"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-[var(--vscode-editor-background)] text-[var(--vscode-editor-foreground)]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--vscode-panel-border)]">
                <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <h1 className="text-lg font-semibold">Chat History</h1>
                </div>
                <span className="text-sm text-[var(--vscode-descriptionForeground)]">
                    {conversations.length} conversation
                    {conversations.length !== 1 ? "s" : ""}
                </span>
            </div>

            {/* Search */}
            <div className="p-3 border-b border-[var(--vscode-panel-border)]">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--vscode-input-placeholderForeground)]" />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-[var(--vscode-input-background)] border border-[var(--vscode-input-border)] rounded text-[var(--vscode-input-foreground)] placeholder-[var(--vscode-input-placeholderForeground)] focus:outline-none focus:border-[var(--vscode-focusBorder)]"
                    />
                </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-[var(--vscode-descriptionForeground)]">
                        <FolderOpen className="w-12 h-12 mb-4 opacity-50" />
                        <p className="text-lg">No conversations found</p>
                        <p className="text-sm mt-1">
                            {searchQuery
                                ? "Try a different search term"
                                : "Start chatting to see history here"}
                        </p>
                    </div>
                ) : (
                    <ul className="divide-y divide-[var(--vscode-panel-border)]">
                        {filteredConversations.map((conv) => (
                            <li
                                key={conv.filename}
                                onClick={() => handleLoadConversation(conv.filename)}
                                className="p-4 hover:bg-[var(--vscode-list-hoverBackground)] cursor-pointer transition-colors group"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {conv.preview}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-[var(--vscode-descriptionForeground)]">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDate(conv.timestamp)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MessageSquare className="w-3 h-3" />
                                                {conv.messageCount} messages
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteConversation(conv.filename, e)}
                                        className="p-2 opacity-0 group-hover:opacity-100 hover:bg-[var(--vscode-toolbar-hoverBackground)] rounded transition-all"
                                        title="Delete conversation"
                                    >
                                        <Trash2 className="w-4 h-4 text-[var(--vscode-errorForeground)]" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default HistoryView;
