import React from "react";
import type { SessionInfo } from "../App";
import { MessageSquarePlus, History, X, Cpu } from "lucide-react";
import { useUsageStore } from "../../stores/usageStore";

// ============================================================================
// Constants
// ============================================================================

const HEADER_CONSTANTS = {
    APP_NAME: "Claude Code",
    ICON_SIZE: "w-4 h-4",
    LOGO_ICON_SIZE: "w-5 h-5",
    TOOLTIPS: {
        OPEN_HISTORY: "Chat History",
        CLOSE_HISTORY: "Close History",
        SETTINGS: "Settings",
        NEW_CHAT: "New Chat",
        USAGE: "View Usage Details",
    },
} as const;

// ============================================================================
// Types
// ============================================================================

type ButtonClickHandler = (event: React.MouseEvent<HTMLButtonElement>) => void;

export interface HeaderProps {
    session: SessionInfo | null;
    onNewChat: ButtonClickHandler;
    onToggleHistory: ButtonClickHandler;
    isHistoryOpen?: boolean;
    onOpenUsage?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
    session: _session,
    onNewChat,
    onToggleHistory,
    isHistoryOpen = false,
    onOpenUsage,
}): React.JSX.Element => {
    const { APP_NAME, ICON_SIZE, LOGO_ICON_SIZE, TOOLTIPS } = HEADER_CONSTANTS;
    const usageData = useUsageStore((state) => state.data);

    // Calculate usage percentage
    const usagePercentage = usageData
        ? Math.round(
              (usageData.currentSession.usageCost / usageData.currentSession.costLimit) * 100,
          )
        : 0;

    return (
        <header className="relative z-50 flex flex-col glass border-b border-white/5 backdrop-blur-xl">
            <div className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                            <Cpu className={LOGO_ICON_SIZE} />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-sm font-bold tracking-tight text-white/90">
                                {APP_NAME}
                            </h1>
                            {/* Always show Current Session with green dot */}
                            <div className="flex items-center gap-1.5 text-xs text-white/50">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
                                <span>Current Session</span>
                            </div>
                        </div>
                    </div>

                    {/* Usage Progress Bar - clickable with hover effects */}
                    {usageData && (
                        <div
                            className="flex flex-col gap-0.5 cursor-pointer group"
                            onClick={onOpenUsage}
                            title={TOOLTIPS.USAGE}
                        >
                            {/* Progress bar with percentage - w-44 = 176px */}
                            <div className="relative w-44 h-4 bg-white/10 rounded-full overflow-hidden transition-all duration-200 group-hover:bg-white/15 group-hover:shadow-[0_0_12px_rgba(249,115,22,0.3)]">
                                <div
                                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-300"
                                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                                />
                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white drop-shadow-sm">
                                    {usagePercentage}%
                                </span>
                            </div>
                            {/* Reset time - becomes brighter on hover */}
                            <span className="text-[9px] text-white/40 group-hover:text-white/60 transition-colors">
                                Resets in {usageData.currentSession.resetsIn}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={onToggleHistory}
                        className={`btn-icon ${isHistoryOpen ? "bg-white/10 text-white" : ""}`}
                        title={isHistoryOpen ? TOOLTIPS.CLOSE_HISTORY : TOOLTIPS.OPEN_HISTORY}
                    >
                        {isHistoryOpen ? (
                            <X className={ICON_SIZE} />
                        ) : (
                            <History className={ICON_SIZE} />
                        )}
                    </button>

                    <div className="h-6 w-px bg-white/10 mx-1" />

                    <button
                        onClick={onNewChat}
                        className="btn btn-primary text-xs py-1.5 px-3 shadow-lg shadow-orange-500/20"
                        title={TOOLTIPS.NEW_CHAT}
                    >
                        <MessageSquarePlus className={ICON_SIZE} />
                        <span className="hidden sm:inline">{TOOLTIPS.NEW_CHAT}</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
