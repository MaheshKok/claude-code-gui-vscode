/**
 * JourneyTimeline Types
 *
 * Type definitions for the journey timeline component and its children.
 *
 * @module components/Chat/JourneyTimeline/types
 */

import type { Message } from "../../App";

/**
 * Timeline item representing a standalone message
 */
export interface TimelineItemMessage {
    kind: "message";
    message: Message;
}

/**
 * Timeline item representing a tool use/result pair
 */
export interface TimelineItemTool {
    kind: "tool";
    id: string;
    toolUse?: Message;
    toolResult?: Message;
    timestamp: Date;
}

/**
 * Timeline group representing an assistant plan with steps
 */
export interface TimelinePlanGroup {
    kind: "plan";
    id: string;
    assistant: Message;
    steps: TimelineItemTool[];
    timestamp: Date;
}

/**
 * Union type for all timeline items
 */
export type TimelineItem = TimelineItemMessage | TimelineItemTool | TimelinePlanGroup;

/**
 * Props for the JourneyTimeline component
 */
export interface JourneyTimelineProps {
    messages: Message[];
    isProcessing: boolean;
    showEmptyState?: boolean;
    onAction?: (prompt: string) => void;
}

/**
 * Props for the ToolStep component
 */
export interface ToolStepProps {
    step: TimelineItemTool;
    forceExpanded?: boolean;
    collapsedSteps: Record<string, boolean>;
    onToggleStep: (id: string, isExecuting: boolean) => void;
}

/**
 * Props for the StatusIcon component
 */
export interface StatusIconProps {
    status: string;
    className?: string;
}

export interface CollapsibleReasoningProps {
    content: string;
}

/**
 * Props for the QuickAction component
 */
export interface QuickActionProps {
    label: string;
    icon: React.ReactNode;
    onClick?: () => void;
}

/**
 * Props for the PlanGroup component
 */
export interface PlanGroupProps {
    item: TimelinePlanGroup;
    isProcessing: boolean;
    isPlanOpen: boolean;
    showActions: boolean;
    copiedPlanId: string | null;
    collapsedSteps: Record<string, boolean>;
    onTogglePlan: (id: string, isOpen: boolean) => void;
    onToggleStep: (id: string, isExecuting: boolean) => void;
    onCopyPlan: (event: React.MouseEvent, id: string, content: string) => void;
}
