/**
 * JourneyTimeline Constants
 *
 * Status labels, CSS classes, and other constants for the timeline.
 *
 * @module components/Chat/JourneyTimeline/constants
 */

/**
 * Human-readable labels for step statuses
 */
export const STATUS_LABELS: Record<string, string> = {
    executing: "Running",
    pending: "Pending",
    completed: "Completed",
    failed: "Failed",
    denied: "Denied",
};

/**
 * CSS classes for different step statuses
 */
export const STATUS_CLASSES: Record<string, string> = {
    running: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    executing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    pending: "bg-white/5 text-white/40 border-white/5",
    completed: "bg-green-500/10 text-green-400 border-green-500/20",
    failed: "bg-red-500/10 text-red-400 border-red-500/20",
    denied: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};
