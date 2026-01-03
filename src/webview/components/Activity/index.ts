/**
 * Activity Components Module
 *
 * This module provides components for displaying activity and timeline
 * information in the Claude Code GUI.
 *
 * @module components/Activity
 */

// Main export - ActivityTimeline is the primary component of this module
export { ActivityTimeline } from "./ActivityTimeline";

// Default export for convenient importing
export { default } from "./ActivityTimeline";

// Re-export types if needed by consumers
export type { ActivityTimelineProps } from "./ActivityTimeline";
