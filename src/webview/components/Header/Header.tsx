import React from 'react';
import type { SessionInfo } from '../App';

interface HeaderProps {
  session: SessionInfo | null;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onToggleHistory: () => void;
  isHistoryOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  onNewChat,
  onOpenSettings,
  onToggleHistory,
  isHistoryOpen = false,
}) => {
  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-[var(--vscode-panel-border)] bg-[var(--vscode-sideBar-background)]">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-[var(--vscode-foreground)]">
          Claude Code GUI
        </h1>

        {session && (
          <div className="flex items-center gap-2 text-sm text-[var(--vscode-descriptionForeground)]">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span>{session.name}</span>
            <span className="text-xs">
              ({session.messageCount} messages)
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onToggleHistory}
          className={`
            p-2 rounded transition-colors
            ${isHistoryOpen
              ? 'bg-[var(--vscode-toolbar-activeBackground)] text-[var(--vscode-foreground)]'
              : 'hover:bg-[var(--vscode-toolbar-hoverBackground)]'
            }
          `}
          title={isHistoryOpen ? 'Close History' : 'Chat History'}
          aria-label={isHistoryOpen ? 'Close chat history' : 'Open chat history'}
          aria-pressed={isHistoryOpen}
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
            <path d="M12 8v4l3 3" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        </button>

        <button
          onClick={onOpenSettings}
          className="p-2 rounded hover:bg-[var(--vscode-toolbar-hoverBackground)] transition-colors"
          title="Settings"
          aria-label="Open settings"
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
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        <button
          onClick={onNewChat}
          className="flex items-center gap-1 px-3 py-1.5 ml-2 text-sm font-medium rounded bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)] hover:bg-[var(--vscode-button-hoverBackground)] transition-colors"
          title="New Chat"
          aria-label="Start new chat"
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
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Chat
        </button>
      </div>
    </header>
  );
};

export default Header;
