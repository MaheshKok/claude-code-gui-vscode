/**
 * ConversationItem Component
 *
 * Individual conversation card displaying title, preview,
 * timestamp, message count, and optional cost badge.
 * Styled to match Claude Code dark theme.
 *
 * @module components/History/ConversationItem
 */

import React, { useState, useCallback } from "react";
import { Trash2 } from "lucide-react";
import type { ConversationListItem } from "../../types/history";

export interface ConversationItemProps {
    /** Conversation summary data */
    conversation: ConversationListItem;
    /** Whether this conversation is currently active */
    isActive?: boolean;
    /** Callback when conversation is clicked */
    onClick: (id: string) => void;
    /** Callback when delete is confirmed */
    onDelete: (id: string) => void;
    /** Optional cost information */
    cost?: number;
}

/**
 * Format timestamp as relative time
 */
const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return days === 1 ? "Yesterday" : `${days} days ago`;
    if (hours > 0) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
    if (minutes > 0) return minutes === 1 ? "1 min ago" : `${minutes} mins ago`;
    return "Just now";
};

export const ConversationItem: React.FC<ConversationItemProps> = ({
    conversation,
    isActive = false,
    onClick,
    onDelete,
    cost,
}) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleClick = useCallback(() => {
        onClick(conversation.id);
    }, [onClick, conversation.id]);

    const handleDeleteClick = useCallback((event: React.MouseEvent) => {
        event.stopPropagation();
        setShowDeleteConfirm(true);
    }, []);

    const handleConfirmDelete = useCallback(
        (event: React.MouseEvent) => {
            event.stopPropagation();
            onDelete(conversation.id);
            setShowDeleteConfirm(false);
        },
        [onDelete, conversation.id],
    );

    const handleCancelDelete = useCallback((event: React.MouseEvent) => {
        event.stopPropagation();
        setShowDeleteConfirm(false);
    }, []);

    return (
        <div
            onClick={handleClick}
            className={`
                group relative px-4 py-3
                border-b border-white/5
                cursor-pointer
                transition-colors duration-200
                ${isActive ? "bg-white/10" : "hover:bg-white/5"}
            `}
        >
            {/* Title & Preview */}
            <div className="flex flex-col gap-1 pr-6">
                <h3
                    className={`text-sm font-medium truncate ${isActive ? "text-white" : "text-white/90"}`}
                >
                    {conversation.title}
                </h3>
                <p className="text-xs text-white/50 truncate">
                    {conversation.preview || "No preview available"}
                </p>
            </div>

            {/* Metadata Row */}
            <div className="flex items-center gap-3 mt-2 text-[11px]">
                {/* Time */}
                <span className="text-white/40">{formatRelativeTime(conversation.updatedAt)}</span>

                {/* Message Count Badge */}
                <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium">
                    {conversation.messageCount} msgs
                </span>

                {/* Usage/Cost Bar (Green Block) */}
                {cost !== undefined && cost > 0 && (
                    <div className="h-1.5 w-8 bg-green-900/30 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${Math.min(100, cost * 10)}%` }} // Rough viz
                        />
                    </div>
                )}
            </div>

            {/* Status Icon (Right side) */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {showDeleteConfirm ? (
                    <div
                        className="flex items-center gap-1 bg-zinc-800 rounded p-1 shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={handleConfirmDelete}
                            className="p-1 text-red-400 hover:text-red-300"
                        >
                            <Trash2 size={14} />
                        </button>
                        <button
                            onClick={handleCancelDelete}
                            className="p-1 text-zinc-400 hover:text-zinc-300"
                        >
                            <div className="text-[10px]">Cancel</div>
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-end gap-2">
                        {/* Delete button (always visible, prominent red) */}
                        <button
                            onClick={handleDeleteClick}
                            className="text-[#ef4444] hover:text-red-400 transition-colors"
                            title="Delete conversation"
                        >
                            <Trash2 size={15} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConversationItem;
