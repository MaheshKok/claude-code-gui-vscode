/**
 * StatusBadge Component
 *
 * Reusable status indicator badge with consistent styling across the application.
 * Supports various status types with appropriate colors.
 *
 * @module components/Common/StatusBadge
 */

import React, { memo } from "react";
import { ToolExecutionStatus } from "../../../shared/constants";

export type StatusVariant =
    | "success"
    | "error"
    | "warning"
    | "info"
    | "pending"
    | "executing"
    | "completed"
    | "failed"
    | "denied"
    | "approved"
    | "cancelled";

export interface StatusBadgeProps {
    /** The status to display */
    status: StatusVariant | ToolExecutionStatus | string;
    /** Optional custom label (defaults to status name) */
    label?: string;
    /** Size variant */
    size?: "sm" | "md";
    /** Additional class names */
    className?: string;
}

const STATUS_STYLES: Record<string, string> = {
    // General statuses
    success: "bg-green-500/10 text-green-400",
    completed: "bg-green-500/10 text-green-400",
    approved: "bg-green-500/10 text-green-400",

    error: "bg-red-500/10 text-red-400",
    failed: "bg-red-500/10 text-red-400",

    warning: "bg-yellow-500/10 text-yellow-400",
    denied: "bg-yellow-500/10 text-yellow-400",
    cancelled: "bg-yellow-500/10 text-yellow-400",

    info: "bg-blue-500/10 text-blue-400",
    executing: "bg-blue-500/10 text-blue-400",

    pending: "bg-orange-500/10 text-orange-400",

    // Default fallback
    default: "bg-white/10 text-white/60",
};

const SIZE_STYLES = {
    sm: "px-1.5 py-0.5 text-[10px]",
    md: "px-2 py-1 text-xs",
};

/**
 * Normalizes status string to a known variant
 */
function normalizeStatus(status: string): string {
    const normalized = status.toLowerCase().replace(/[-_]/g, "");

    // Map ToolExecutionStatus enum values
    if (normalized === "completed") return "completed";
    if (normalized === "failed") return "failed";
    if (normalized === "executing") return "executing";
    if (normalized === "pending") return "pending";
    if (normalized === "approved") return "approved";
    if (normalized === "denied") return "denied";
    if (normalized === "cancelled") return "cancelled";

    // Check if it's a known variant
    if (STATUS_STYLES[normalized]) return normalized;

    return "default";
}

/**
 * StatusBadge displays a colored badge indicating status.
 * Automatically styles based on the status type.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = memo(
    ({ status, label, size = "sm", className = "" }) => {
        const statusKey = normalizeStatus(String(status));
        const styleClass = STATUS_STYLES[statusKey] || STATUS_STYLES.default;
        const sizeClass = SIZE_STYLES[size];
        const displayLabel = label ?? String(status);

        return (
            <span
                className={`inline-flex items-center rounded font-bold uppercase tracking-wide ${styleClass} ${sizeClass} ${className}`}
            >
                {displayLabel}
            </span>
        );
    },
);

StatusBadge.displayName = "StatusBadge";

export default StatusBadge;
