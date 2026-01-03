/**
 * JourneyTimeline Component Re-export
 *
 * This file re-exports the JourneyTimeline component from its new modular location
 * for backward compatibility with existing imports.
 *
 * The component has been refactored into smaller, focused sub-components:
 * - JourneyTimeline/JourneyTimeline.tsx - Main component
 * - JourneyTimeline/ToolStep.tsx - Tool step rendering
 * - JourneyTimeline/PlanGroup.tsx - Plan group with steps
 * - JourneyTimeline/StatusIcon.tsx - Status icon component
 * - JourneyTimeline/CollapsibleReasoning.tsx - Expandable reasoning text
 * - JourneyTimeline/QuickAction.tsx - Quick action buttons
 * - JourneyTimeline/EmptyState.tsx - Empty state display
 * - JourneyTimeline/types.ts - Type definitions
 * - JourneyTimeline/constants.ts - Status labels and CSS classes
 * - JourneyTimeline/utils.ts - Utility functions
 *
 * @module components/Chat/JourneyTimeline
 */

export { JourneyTimeline, default } from "./JourneyTimeline/JourneyTimeline";
export type { JourneyTimelineProps } from "./JourneyTimeline/types";
