import React, { useCallback, useMemo, useEffect } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { useUsageStore } from "../stores/usageStore";
import { useVSCode } from "../hooks/useVSCode";

interface ProgressBarProps {
    value: number; // 0 to 1
    label: string;
    subLabel?: string;
    rightLabel?: string;
    colorClass?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
    value,
    label,
    subLabel,
    rightLabel,
    colorClass = "bg-orange-500",
}) => {
    return (
        <div className="mb-4">
            <div className="flex justify-between text-xs mb-1.5">
                <span className="text-white/90 font-medium">{label}</span>
                {rightLabel && <span className="text-white/60">{rightLabel}</span>}
            </div>

            <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-1.5">
                <div
                    className={`h-full rounded-full ${colorClass}`}
                    style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
                />
            </div>

            {subLabel && <div className="text-xs text-white/40">{subLabel}</div>}
        </div>
    );
};

const LoadingState: React.FC = () => (
    <div className="w-full text-sm flex flex-col items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-white/40 animate-spin mb-3" />
        <p className="text-white/40 text-xs">Loading usage data...</p>
    </div>
);

const getUsageRatio = (used: number, limit: number): number | null => {
    if (!Number.isFinite(used) || !Number.isFinite(limit) || limit <= 0) {
        return null;
    }
    return used / limit;
};

const formatUsageLabel = (ratio: number | null): string => {
    if (ratio === null) {
        return "N/A";
    }
    return `${Math.round(ratio * 100)}% used`;
};

const formatResetLabel = (prefix: string, value?: string): string => {
    const trimmed = value?.trim();
    return `${prefix} ${trimmed || "N/A"}`;
};

const formatTimeAgo = (date: Date | null): string => {
    if (!date) return "never";
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
};

export const UsageData: React.FC = () => {
    const { data, lastUpdatedAt, isRefreshing, setRefreshing } = useUsageStore();
    const { postMessage } = useVSCode();

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        postMessage({ type: "refreshUsage" });
    }, [setRefreshing, postMessage]);

    // Auto-refresh on mount if no cached data
    useEffect(() => {
        if (!data && !isRefreshing) {
            console.log("[UsageData] No cached data, triggering refresh");
            handleRefresh();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const timeAgo = useMemo(() => formatTimeAgo(lastUpdatedAt), [lastUpdatedAt]);

    // Show loading state if no data
    if (!data) {
        return <LoadingState />;
    }

    const sessionRatio = getUsageRatio(
        data.currentSession.usageCost,
        data.currentSession.costLimit,
    );
    const weeklyRatio = getUsageRatio(data.weekly.costLikely, data.weekly.costLimit);
    const sonnetRatio = data.sonnet ? getUsageRatio(data.sonnet.usage, data.sonnet.limit) : null;

    return (
        <div className="w-full text-sm">
            <h2 className="text-white font-semibold mb-6">Plan usage limits</h2>

            <div className="mb-8 border-b border-white/5 pb-6">
                <ProgressBar
                    label="Current session"
                    value={sessionRatio ?? 0}
                    rightLabel={formatUsageLabel(sessionRatio)}
                    subLabel={formatResetLabel("Resets in", data.currentSession.resetsIn)}
                />
            </div>

            <div>
                <h3 className="text-white font-semibold mb-1">Weekly limits</h3>
                <a
                    href="#"
                    className="text-xs text-white/40 underline mb-4 block hover:text-white/60"
                >
                    Learn more about usage limits
                </a>

                <ProgressBar
                    label="All models"
                    value={weeklyRatio ?? 0}
                    rightLabel={formatUsageLabel(weeklyRatio)}
                    subLabel={formatResetLabel("Resets", data.weekly.resetsAt)}
                />

                {data.sonnet && (
                    <ProgressBar
                        label="Sonnet only"
                        value={sonnetRatio ?? 0}
                        rightLabel={formatUsageLabel(sonnetRatio)}
                        subLabel={formatResetLabel("Resets", data.sonnet.resetsAt)}
                    />
                )}
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs text-white/30">
                <span>Last updated: {timeAgo}</span>
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="p-1 rounded hover:bg-white/10 transition-colors disabled:opacity-50"
                    title="Refresh usage data"
                >
                    <RefreshCw
                        className={`w-3 h-3 cursor-pointer hover:text-white/50 ${isRefreshing ? "animate-spin" : ""}`}
                    />
                </button>
            </div>
        </div>
    );
};
