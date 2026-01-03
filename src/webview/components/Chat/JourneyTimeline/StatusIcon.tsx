/**
 * StatusIcon Component
 *
 * Renders an icon based on the execution status.
 *
 * @module components/Chat/JourneyTimeline/StatusIcon
 */

import React from "react";
import { Clock, CheckCircle2, XCircle, AlertCircle, PlayCircle } from "lucide-react";
import type { StatusIconProps } from "./types";

/**
 * Renders an appropriate icon based on execution status
 */
export const StatusIcon: React.FC<StatusIconProps> = ({ status, className }) => {
    switch (status) {
        case "executing":
            return <PlayCircle className={`${className} text-blue-400 animate-pulse`} />;
        case "completed":
            return <CheckCircle2 className={`${className} text-green-400`} />;
        case "failed":
            return <XCircle className={`${className} text-red-400`} />;
        case "pending":
            return <Clock className={`${className} text-white/40`} />;
        default:
            return <AlertCircle className={`${className} text-yellow-400`} />;
    }
};

export default StatusIcon;
