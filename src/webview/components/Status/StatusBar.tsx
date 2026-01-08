import React, { useEffect, useState } from "react";
import { formatDuration, formatTokenCount } from "../../utils";
import { Loader2, Zap, Clock } from "lucide-react";

export interface StatusBarProps {
    isProcessing: boolean;
    totalTokens: number;
    requestCount: number;
    sessionCostUsd: number;
    lastDurationMs: number | null;
    requestStartTime: number | null;
    subscriptionType: string | null;
}

export const StatusBar: React.FC<StatusBarProps> = ({
    isProcessing,
    totalTokens,
    requestStartTime,
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

    // Only show footer when processing
    if (!isProcessing) {
        return null;
    }

    return (
        <footer className="flex items-center justify-end px-4 py-2 border-t border-white/5 bg-black/40 backdrop-blur-md text-xs select-none">
            <div className="flex items-center gap-3">
                {/* Show time elapsed while processing */}
                <div className="flex items-center gap-1.5 text-white/50" title="Elapsed Time">
                    <Clock className="w-3 h-3" />
                    <span>{formatDuration(elapsedMs, { abbreviated: true })}</span>
                </div>

                {/* Show current tokens while processing */}
                {totalTokens > 0 && (
                    <div className="flex items-center gap-1.5 text-white/50" title="Tokens">
                        <Zap className="w-3 h-3" />
                        <span>
                            {formatTokenCount(totalTokens, {
                                includeSuffix: true,
                                abbreviated: true,
                            })}
                        </span>
                    </div>
                )}

                <span className="flex items-center gap-1.5 text-orange-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="font-medium">Processing...</span>
                </span>
            </div>
        </footer>
    );
};

export default StatusBar;
