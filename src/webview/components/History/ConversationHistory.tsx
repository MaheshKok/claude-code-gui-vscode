/**
 * ConversationHistory Component
 *
 * Main history panel containing header with title and close button,
 * search input, conversation list, and empty state.
 *
 * @module components/History/ConversationHistory
 */

import React, { useState, useCallback, useMemo } from 'react';
import { ConversationSearch } from './ConversationSearch';
import { ConversationItem } from './ConversationItem';
import type { ConversationListItem } from '../../types/history';

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
  const [searchQuery, setSearchQuery] = useState('');

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      // Sort by updated date descending
      return [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
    }
    const query = searchQuery.toLowerCase();
    return conversations
      .filter((conversation) => (
        conversation.title.toLowerCase().includes(query)
        || conversation.preview.toLowerCase().includes(query)
      ))
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
    [onConversationLoad, onClose]
  );

  // Handle conversation delete
  const handleConversationDelete = useCallback(
    (id: string) => {
      onConversationDelete?.(id);
    },
    [onConversationDelete]
  );

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className={`
        fixed inset-y-0 left-0 z-40
        w-80 max-w-full
        flex flex-col
        bg-[var(--vscode-sideBar-background)]
        border-r border-[var(--vscode-panel-border)]
        shadow-xl
        animate-slide-in-left
      `}
      role="complementary"
      aria-label="Conversation history"
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--vscode-panel-border)]">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--vscode-foreground)]"
          >
            <path d="M12 8v4l3 3" />
            <circle cx="12" cy="12" r="10" />
          </svg>
          <h2 className="text-sm font-semibold text-[var(--vscode-foreground)]">
            Chat History
          </h2>
          <span className="text-xs text-[var(--vscode-descriptionForeground)]">
            ({conversations.length})
          </span>
        </div>

        <button
          onClick={onClose}
          className={`
            p-1.5 rounded
            text-[var(--vscode-foreground)]
            hover:bg-[var(--vscode-toolbar-hoverBackground)]
            transition-colors
          `}
          title="Close history (Esc)"
          aria-label="Close conversation history"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
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

      {/* Search */}
      <div className="px-3 py-2 border-b border-[var(--vscode-panel-border)]">
        <ConversationSearch
          onSearch={handleSearch}
          autoFocus
        />
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          // Loading state
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center gap-2 text-[var(--vscode-descriptionForeground)]">
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="text-sm">Loading...</span>
            </div>
          </div>
        ) : filteredConversations.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-64 px-4 text-center">
            {searchQuery ? (
              // No search results
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[var(--vscode-descriptionForeground)] opacity-50 mb-4"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
                <p className="text-sm text-[var(--vscode-foreground)]">
                  No conversations found
                </p>
                <p className="mt-1 text-xs text-[var(--vscode-descriptionForeground)]">
                  Try a different search term
                </p>
              </>
            ) : (
              // No conversations yet
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[var(--vscode-descriptionForeground)] opacity-50 mb-4"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <p className="text-sm text-[var(--vscode-foreground)]">
                  No conversations yet
                </p>
                <p className="mt-1 text-xs text-[var(--vscode-descriptionForeground)]">
                  Start a new chat to begin
                </p>
              </>
            )}
          </div>
        ) : (
          // Conversation list
          <div role="list" aria-label="Conversations">
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

      {/* Footer with count */}
      {filteredConversations.length > 0 && (
        <div className="px-4 py-2 border-t border-[var(--vscode-panel-border)]">
          <p className="text-xs text-[var(--vscode-descriptionForeground)]">
            {filteredConversations.length} of {conversations.length} conversation
            {conversations.length !== 1 ? 's' : ''}
            {searchQuery && ' (filtered)'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ConversationHistory;
