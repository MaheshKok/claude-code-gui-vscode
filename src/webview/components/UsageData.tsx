import React from "react";
import { useUsageStore } from "../stores/usageStore";

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

export const UsageData: React.FC = () => {
    const { data } = useUsageStore();

    if (!data) return null;

    return (
        <div className="w-full text-sm">
            <h2 className="text-white font-semibold mb-6">Plan usage limits</h2>

            <div className="mb-8 border-b border-white/5 pb-6">
                <ProgressBar
                    label="Current session"
                    value={data.currentSession.usageCost / data.currentSession.costLimit}
                    rightLabel={`${Math.round((data.currentSession.usageCost / data.currentSession.costLimit) * 100)}% used`}
                    subLabel={`Resets in ${data.currentSession.resetsIn}`}
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
                    value={data.weekly.costLikely / data.weekly.costLimit}
                    rightLabel={`${Math.round((data.weekly.costLikely / data.weekly.costLimit) * 100)}% used`}
                    subLabel={`Resets ${data.weekly.resetsAt}`}
                />

                {data.sonnet && (
                    <ProgressBar
                        label="Sonnet only"
                        value={data.sonnet.usage / data.sonnet.limit}
                        rightLabel={`${Math.round((data.sonnet.usage / data.sonnet.limit) * 100)}% used`}
                        subLabel={`Resets ${data.sonnet.resetsAt}`}
                    />
                )}
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs text-white/30">
                <span>Last updated: 4 minutes ago</span>
                {/* <RefreshCw className="w-3 h-3 cursor-pointer hover:text-white/50" /> */}
            </div>
        </div>
    );
};
