import React from "react";
import type { SessionInfo } from "../App";
import { MessageSquarePlus, Settings, History, X, Cpu } from "lucide-react";

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
    <header className="relative z-50 flex flex-col glass border-b border-white/5 backdrop-blur-xl">
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white/90">
                Claude Code
              </h1>
              {session && (
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                  <span>{session.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleHistory}
            className={`btn-icon ${isHistoryOpen ? "bg-white/10 text-white" : ""}`}
            title={isHistoryOpen ? "Close History" : "Chat History"}
          >
            {isHistoryOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <History className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={onOpenSettings}
            className="btn-icon"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          <div className="h-6 w-px bg-white/10 mx-1" />

          <button
            onClick={onNewChat}
            className="btn btn-primary text-xs py-1.5 px-3 shadow-lg shadow-orange-500/20"
            title="New Chat"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
