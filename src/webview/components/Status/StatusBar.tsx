import React, { useEffect, useState } from "react";
import { formatCost, formatDuration, formatTokenCount } from "../../utils";
import { Activity, Wifi, WifiOff, Loader2, Square, Zap, Clock, DollarSign } from "lucide-react";

interface StatusBarProps {
    isConnected: boolean;
    isProcessing: boolean;
    onStop: () => void;
    totalTokens: number;
    requestCount: number;
    sessionCostUsd: number;
    lastDurationMs: number | null;
    requestStartTime: number | null;
    subscriptionType: string | null;
}

export const StatusBar: React.FC<StatusBarProps> = ({
    isConnected,
    isProcessing,
    onStop,
    totalTokens,
    requestCount,
    sessionCostUsd,
    lastDurationMs,
    requestStartTime,
    subscriptionType,
}) => {
    const [elapsedMs, setElapsedMs] = useState(0);

    useEffect(() => {
        if (!isProcessing || !requestStartTime) {
            setElapsedMs(0);
            return;
        }

        const tick = () => {
            setElapsedMs(Date.now() - requestStartTime);
        };

        tick();
        const interval = setInterval(tick, 200);
        return () => clearInterval(interval);
    }, [isProcessing, requestStartTime]);

    return (
        <footer className="flex items-center justify-between px-4 py-2 border-t border-white/5 bg-black/40 backdrop-blur-md text-xs select-none">
            <div className="flex items-center gap-4">
                {/* Connection Status */}
                <div
                    className={`flex items-center gap-1.5 transition-colors ${isConnected ? "text-green-400" : "text-red-400"}`}
                >
                    {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                    <span className="font-medium">
                        {isConnected ? "Connected" : "Disconnected"}
                    </span>
                </div>

                <div className="w-px h-3 bg-white/10" />

                {/* Stats */}
                <div className="flex items-center gap-3 text-white/50">
                    <div className="flex items-center gap-1.5" title="Total Tokens">
                        <Zap className="w-3 h-3" />
                        <span>
                            {formatTokenCount(totalTokens, {
                                includeSuffix: true,
                                abbreviated: true,
                            })}
                        </span>
                    </div>

                    {(isProcessing
                        ? elapsedMs > 0
                        : lastDurationMs !== null && lastDurationMs > 0) && (
                        <div
                            className="flex items-center gap-1.5"
                            title={isProcessing ? "Elapsed Time" : "Last Request Duration"}
                        >
                            <Clock className="w-3 h-3" />
                            <span>
                                {isProcessing
                                    ? `${Math.floor(elapsedMs / 1000)}s`
                                    : formatDuration(lastDurationMs || 0)}
                            </span>
                        </div>
                    )}

                    {requestCount > 0 && (
                        <div className="flex items-center gap-1.5" title="Total Requests">
                            <Activity className="w-3 h-3" />
                            <span>{requestCount} reqs</span>
                        </div>
                    )}

                    {!isProcessing && sessionCostUsd > 0 && (
                        <div className="flex items-center gap-1.5" title="Session Cost">
                            <DollarSign className="w-3 h-3" />
                            <span>{formatCost(sessionCostUsd, { showFreeForZero: false })}</span>
                        </div>
                    )}

                    {subscriptionType && (
                        <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
                            <span className="uppercase text-[10px] tracking-wider font-bold">
                                {subscriptionType}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3">
                {isProcessing ? (
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-orange-400">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span className="font-medium">Processing...</span>
                        </span>
                        <button
                            onClick={onStop}
                            className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors border border-red-500/20"
                            title="Stop processing (Escape)"
                        >
                            <Square className="w-3 h-3 fill-current" />
                            <span className="font-medium">Stop</span>
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/10 border border-white/10 font-mono text-[10px]">
                            <span>⌘</span>
                            <span>↵</span>
                        </div>
                        <span>to send</span>
                    </div>
                )}
            </div>
        </footer>
    );
};

export default StatusBar;
