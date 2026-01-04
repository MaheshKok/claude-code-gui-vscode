/**
 * ConversationHistory Component
 *
 * Main history panel containing search input and conversation list.
 * Styled to match the Claude Code dark theme.
 *
 * @module components/History/ConversationHistory
 */

import React, { useState, useCallback, useMemo } from "react";
import { X } from "lucide-react";
import { ConversationSearch } from "./ConversationSearch";
import { ConversationItem } from "./ConversationItem";
import type { ConversationListItem } from "../../types/history";

export interface ConversationHistoryProps {
    /** Whether the panel is visible */
    isOpen: boolean;
    /** Callback to close the panel */
    onClose: () => void;
    /** Callback when a conversation is loaded */
    onConversationLoad?: (id: string) => void;
    /** Conversations to display */
    conversations: ConversationListItem[];
    /** Whether conversations are loading */
    isLoading?: boolean;
    /** Active conversation id */
    activeConversationId?: string | null;
    /** Callback to delete a conversation */
    onConversationDelete?: (id: string) => void;
}

export const ConversationHistory: React.FC<ConversationHistoryProps> = ({
    isOpen,
    onClose,
    onConversationLoad,
    conversations,
    isLoading = false,
    activeConversationId,
    onConversationDelete,
}) => {
    const [searchQuery, setSearchQuery] = useState("");

    // Filter conversations based on search query
    const filteredConversations = useMemo(() => {
        if (!searchQuery.trim()) {
            return [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
        }
        const query = searchQuery.toLowerCase();
        return conversations
            .filter(
                (conversation) =>
                    conversation.title.toLowerCase().includes(query) ||
                    conversation.preview.toLowerCase().includes(query),
            )
            .sort((a, b) => b.updatedAt - a.updatedAt);
    }, [conversations, searchQuery]);

    // Handle search
    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
    }, []);

    // Handle conversation click
    const handleConversationClick = useCallback(
        (id: string) => {
            onConversationLoad?.(id);
            onClose();
        },
        [onConversationLoad, onClose],
    );

    // Handle conversation delete
    const handleConversationDelete = useCallback(
        (id: string) => {
            onConversationDelete?.(id);
        },
        [onConversationDelete],
    );

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop with blur - covers everything behind the sidebar */}
            <div
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
                aria-hidden="true"
            />

            <div
                className={`
                    fixed top-0 bottom-0 left-0 z-50
                    w-full max-w-full
                    flex flex-col
                    bg-[#18181b] border-r border-white/10
                    shadow-2xl
                    transform transition-transform duration-200 ease-in-out
                `}
                role="complementary"
                aria-label="Conversation history"
            >
                {/* Search Header */}
                <div className="p-3 border-b border-white/5 bg-[#18181b] flex items-center gap-3">
                    <div className="flex-1">
                        <ConversationSearch onSearch={handleSearch} autoFocus />
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Close History"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-32 text-white/40">
                            <span className="text-sm">Loading conversations...</span>
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 px-4 text-center text-white/30">
                            <p className="text-sm">No conversations found</p>
                        </div>
                    ) : (
                        <div role="list" className="py-2">
                            {filteredConversations.map((conversation) => (
                                <ConversationItem
                                    key={conversation.id}
                                    conversation={conversation}
                                    isActive={activeConversationId === conversation.id}
                                    onClick={handleConversationClick}
                                    onDelete={handleConversationDelete}
                                    cost={conversation.totalCost}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Count */}
                <div className="px-4 py-2 border-t border-white/5 bg-[#18181b] text-[10px] text-white/30 flex justify-between">
                    <span>
                        {filteredConversations.length} of {conversations.length} conversations
                    </span>
                </div>
            </div>
        </>
    );
};

export default ConversationHistory;
