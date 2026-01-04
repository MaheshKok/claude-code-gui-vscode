import React from "react";
import type { SessionInfo } from "../App";
import { MessageSquarePlus, History, X, Cpu, PieChart } from "lucide-react";
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
        USAGE: "Usage Data",
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
    session,
    onNewChat,
    onToggleHistory,
    isHistoryOpen = false,
    onOpenUsage,
}): React.JSX.Element => {
    const { APP_NAME, ICON_SIZE, LOGO_ICON_SIZE, TOOLTIPS } = HEADER_CONSTANTS;
    const usageData = useUsageStore((state) => state.data);

    return (
        <header className="relative z-50 flex flex-col glass border-b border-white/5 backdrop-blur-xl">
            <div className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                            <Cpu className={LOGO_ICON_SIZE} />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold tracking-tight text-white/90">
                                {APP_NAME}
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
                    {usageData && (
                        <div className="hidden md:flex items-center gap-3 mr-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                            <div className="flex flex-col items-end leading-none">
                                <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">
                                    Session
                                </span>
                                <span className="text-xs font-semibold text-white/90">
                                    {Math.round(
                                        (usageData.currentSession.usageCost /
                                            usageData.currentSession.costLimit) *
                                            100,
                                    )}
                                    %
                                </span>
                            </div>
                            <div className="w-px h-6 bg-white/10" />
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">
                                    Resets
                                </span>
                                <span className="text-xs text-white/70">
                                    {usageData.currentSession.resetsIn}
                                </span>
                            </div>
                        </div>
                    )}

                    {onOpenUsage && (
                        <button
                            onClick={onOpenUsage}
                            className="btn-icon text-white/50 hover:text-white"
                            title={TOOLTIPS.USAGE}
                        >
                            <PieChart className={ICON_SIZE} />
                        </button>
                    )}

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
