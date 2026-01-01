import React from "react";
import type { TodoStats } from "../../utils";
import { formatCost, formatTokenCount } from "../../utils";
import type { SessionInfo } from "../App";
import {
  MessageSquarePlus,
  Settings,
  History,
  X,
  Zap,
  DollarSign,
  CheckCircle2,
  Cpu,
} from "lucide-react";

interface ProgressSummary {
  totalTokens: number;
  sessionCostUsd: number;
  subscriptionType?: string | null;
  todoStats?: TodoStats | null;
}

interface HeaderProps {
  session: SessionInfo | null;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onToggleHistory: () => void;
  isHistoryOpen?: boolean;
  summary?: ProgressSummary;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  onNewChat,
  onOpenSettings,
  onToggleHistory,
  isHistoryOpen = false,
  summary,
}) => {
  const tokensLabel = summary
    ? formatTokenCount(summary.totalTokens, { includeSuffix: false })
    : "";
  const costLabel = summary
    ? formatCost(summary.sessionCostUsd, { showFreeForZero: true })
    : "";
  const todoStats = summary?.todoStats ?? null;
  const todoSummary =
    todoStats && todoStats.total > 0
      ? `${todoStats.completed}/${todoStats.total}`
      : "0";
  const todoPercent =
    todoStats && todoStats.total > 0
      ? Math.round((todoStats.completed / todoStats.total) * 100)
      : 0;

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

      {summary && (
        <div className="px-5 py-2 bg-black/20 border-t border-white/5 backdrop-blur-sm">
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5 text-white/60 bg-white/5 px-2 py-1 rounded-md border border-white/5">
              <Zap className="w-3 h-3 text-yellow-500" />
              <span>{tokensLabel} tokens</span>
            </div>

            <div className="flex items-center gap-1.5 text-white/60 bg-white/5 px-2 py-1 rounded-md border border-white/5">
              <DollarSign className="w-3 h-3 text-green-500" />
              <span>{costLabel}</span>
            </div>

            <div className="flex items-center gap-1.5 text-white/60 bg-white/5 px-2 py-1 rounded-md border border-white/5">
              <CheckCircle2 className="w-3 h-3 text-blue-500" />
              <span>{todoSummary} tasks</span>
            </div>
          </div>

          {todoStats && todoStats.total > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-orange-400 shadow-[0_0_10px_rgba(237,110,29,0.5)] transition-all duration-500 ease-out"
                style={{ width: `${todoPercent}%` }}
              />
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
