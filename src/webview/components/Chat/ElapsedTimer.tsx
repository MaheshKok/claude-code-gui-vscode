import { memo, useState, useEffect } from "react";
import { formatDuration } from "../../utils";

interface ElapsedTimerProps {
    startTime: number;
}

export const ElapsedTimer = memo<ElapsedTimerProps>(({ startTime }) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(Date.now() - startTime);
        }, 200); // 5x per second

        return () => clearInterval(interval);
    }, [startTime]);

    return <span>{formatDuration(elapsed, { abbreviated: true })}</span>;
});

ElapsedTimer.displayName = "ElapsedTimer";
