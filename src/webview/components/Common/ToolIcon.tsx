/**
 * Tool Icon Component
 *
 * Displays an appropriate icon for a given tool name.
 * Centralizes tool icon logic to avoid duplication across components.
 *
 * @module components/Common/ToolIcon
 */

import React, { memo } from "react";
import {
    FileText,
    Edit3,
    Files,
    Terminal,
    Search,
    ListChecks,
    CheckSquare,
    Globe,
    BookOpen,
    Code,
    Zap,
} from "lucide-react";
import { ToolName } from "../../../shared/constants";

export interface ToolIconProps {
    /** The name of the tool */
    toolName: string;
    /** CSS class name for the icon */
    className?: string;
    /** Icon size (applied via className if not specified) */
    size?: number;
}

/**
 * Get the appropriate Lucide icon element for a tool
 *
 * @param toolName - The name of the tool
 * @param className - CSS class to apply to the icon
 * @returns React element with the appropriate icon
 */
function getToolIconElement(toolName: string, className: string = "w-4 h-4") {
    switch (toolName) {
        case ToolName.Read:
            return <FileText className={className} />;
        case ToolName.Write:
        case ToolName.Edit:
            return <Edit3 className={className} />;
        case ToolName.MultiEdit:
            return <Files className={className} />;
        case ToolName.Bash:
            return <Terminal className={className} />;
        case ToolName.Glob:
        case ToolName.Grep:
            return <Search className={className} />;
        case ToolName.Task:
            return <ListChecks className={className} />;
        case ToolName.TodoRead:
        case ToolName.TodoWrite:
            return <CheckSquare className={className} />;
        case ToolName.WebFetch:
            return <Globe className={className} />;
        case ToolName.WebSearch:
            return <Search className={className} />;
        case ToolName.NotebookRead:
        case ToolName.NotebookEdit:
            return <BookOpen className={className} />;
        default:
            // MCP tools get a special icon
            if (toolName.startsWith("mcp__")) {
                return <Zap className={className} />;
            }
            // Default code icon for unknown tools
            return <Code className={className} />;
    }
}

/**
 * ToolIcon Component
 *
 * Displays the appropriate icon for a given tool name.
 *
 * @example
 * ```tsx
 * <ToolIcon toolName="Read" className="w-4 h-4 text-blue-500" />
 * <ToolIcon toolName="mcp__my-server__tool" />
 * ```
 */
export const ToolIcon: React.FC<ToolIconProps> = memo(
    ({ toolName, className = "w-4 h-4", size }) => {
        const sizeClass = size ? `w-${size} h-${size}` : className;
        return getToolIconElement(toolName, sizeClass);
    },
);

ToolIcon.displayName = "ToolIcon";

/**
 * Get tool icon element without component wrapper
 *
 * Use this for inline icon rendering where a component wrapper is not needed.
 *
 * @example
 * ```tsx
 * const icon = getToolIcon("Read", "w-5 h-5");
 * ```
 */
export { getToolIconElement as getToolIcon };
