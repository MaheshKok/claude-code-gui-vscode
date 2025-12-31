/**
 * ConversationItem Component
 *
 * Individual conversation card displaying title, preview,
 * timestamp, message count, and optional cost badge.
 *
 * @module components/History/ConversationItem
 */

import React, { useState, useCallback } from 'react';
import type { ConversationSummary } from '../../stores/conversationStore';

export interface ConversationItemProps {
  /** Conversation summary data */
  conversation: ConversationSummary;
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
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (months > 0) {
    return months === 1 ? '1 month ago' : `${months} months ago`;
  }
  if (weeks > 0) {
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  }
  if (days > 0) {
    return days === 1 ? 'Yesterday' : `${days} days ago`;
  }
  if (hours > 0) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }
  if (minutes > 0) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  }
  return 'Just now';
};

/**
 * Format cost as currency
 */
const formatCost = (cost: number): string => {
  if (cost < 0.01) {
    return '<$0.01';
  }
  return `$${cost.toFixed(2)}`;
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

  const handleDeleteClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      setShowDeleteConfirm(true);
    },
    []
  );

  const handleConfirmDelete = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onDelete(conversation.id);
      setShowDeleteConfirm(false);
    },
    [onDelete, conversation.id]
  );

  const handleCancelDelete = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      setShowDeleteConfirm(false);
    },
    []
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onClick(conversation.id);
      }
    },
    [onClick, conversation.id]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        group relative p-3
        border-b border-[var(--vscode-panel-border)]
        cursor-pointer
        transition-colors
        ${
          isActive
            ? 'bg-[var(--vscode-list-activeSelectionBackground)]'
            : 'hover:bg-[var(--vscode-list-hoverBackground)]'
        }
      `}
      aria-selected={isActive}
      aria-label={`Conversation: ${conversation.title}`}
    >
      {/* Main Content */}
      <div className="pr-8">
        {/* Title */}
        <h3
          className={`
            text-sm font-medium truncate
            ${
              isActive
                ? 'text-[var(--vscode-list-activeSelectionForeground)]'
                : 'text-[var(--vscode-foreground)]'
            }
          `}
        >
          {conversation.title}
        </h3>

        {/* Preview */}
        {conversation.preview && (
          <p
            className={`
              mt-1 text-xs truncate
              ${
                isActive
                  ? 'text-[var(--vscode-list-activeSelectionForeground)] opacity-80'
                  : 'text-[var(--vscode-descriptionForeground)]'
              }
            `}
          >
            {conversation.preview}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex items-center gap-2 mt-2">
          {/* Timestamp */}
          <span
            className={`
              text-xs
              ${
                isActive
                  ? 'text-[var(--vscode-list-activeSelectionForeground)] opacity-70'
                  : 'text-[var(--vscode-descriptionForeground)]'
              }
            `}
          >
            {formatRelativeTime(conversation.updatedAt)}
          </span>

          {/* Message Count Badge */}
          <span
            className={`
              inline-flex items-center px-1.5 py-0.5
              text-xs rounded
              ${
                isActive
                  ? 'bg-[var(--vscode-badge-background)] text-[var(--vscode-badge-foreground)]'
                  : 'bg-[var(--vscode-badge-background)] text-[var(--vscode-badge-foreground)]'
              }
            `}
          >
            {conversation.messageCount} {conversation.messageCount === 1 ? 'msg' : 'msgs'}
          </span>

          {/* Cost Badge */}
          {cost !== undefined && cost > 0 && (
            <span
              className={`
                inline-flex items-center px-1.5 py-0.5
                text-xs rounded
                bg-[var(--vscode-charts-green)] bg-opacity-20
                text-[var(--vscode-charts-green)]
              `}
            >
              {formatCost(cost)}
            </span>
          )}

          {/* Tags */}
          {conversation.tags && conversation.tags.length > 0 && (
            <div className="flex items-center gap-1">
              {conversation.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className={`
                    inline-flex items-center px-1.5 py-0.5
                    text-xs rounded
                    bg-[var(--vscode-badge-background)]
                    text-[var(--vscode-badge-foreground)]
                    opacity-80
                  `}
                >
                  {tag}
                </span>
              ))}
              {conversation.tags.length > 2 && (
                <span className="text-xs text-[var(--vscode-descriptionForeground)]">
                  +{conversation.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Button / Confirmation */}
      <div className="absolute top-3 right-2">
        {showDeleteConfirm ? (
          <div className="flex items-center gap-1 bg-[var(--vscode-editorWidget-background)] rounded p-1">
            <button
              onClick={handleConfirmDelete}
              className={`
                p-1 rounded
                text-[var(--vscode-errorForeground)]
                hover:bg-[var(--vscode-toolbar-hoverBackground)]
                transition-colors
              `}
              title="Confirm delete"
              aria-label="Confirm delete"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
            <button
              onClick={handleCancelDelete}
              className={`
                p-1 rounded
                text-[var(--vscode-descriptionForeground)]
                hover:bg-[var(--vscode-toolbar-hoverBackground)]
                transition-colors
              `}
              title="Cancel"
              aria-label="Cancel delete"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
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
          </div>
        ) : (
          <button
            onClick={handleDeleteClick}
            className={`
              p-1 rounded
              opacity-0 group-hover:opacity-100
              text-[var(--vscode-descriptionForeground)]
              hover:text-[var(--vscode-errorForeground)]
              hover:bg-[var(--vscode-toolbar-hoverBackground)]
              transition-all
            `}
            title="Delete conversation"
            aria-label="Delete conversation"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default ConversationItem;
