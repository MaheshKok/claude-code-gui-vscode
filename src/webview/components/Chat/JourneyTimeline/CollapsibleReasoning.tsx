/**
 * CollapsibleReasoning Component
 *
 * Displays assistant reasoning with expand/collapse functionality.
 *
 * @module components/Chat/JourneyTimeline/CollapsibleReasoning
 */

import React, { useState } from "react";
import type { CollapsibleReasoningProps } from "./types";

/**
 * Character threshold for showing expand/collapse button
 */
const COLLAPSE_THRESHOLD = 150;

/**
 * Displays reasoning content with optional expand/collapse
 */
export const CollapsibleReasoning: React.FC<CollapsibleReasoningProps> = ({ content }) => {
    const [expanded, setExpanded] = useState(false);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setExpanded(!expanded);
    };

    return (
        <div className="relative">
            <p
                className={`text-sm text-white/80 leading-relaxed whitespace-pre-wrap ${expanded ? "" : "line-clamp-3"}`}
            >
                {content}
            </p>
            {content.length > COLLAPSE_THRESHOLD && (
                <button
                    onClick={handleToggle}
                    className="text-xs text-orange-400 hover:text-orange-300 mt-2 font-medium"
                >
                    {expanded ? "Show less" : "Show full reasoning"}
                </button>
            )}
        </div>
    );
};

export default CollapsibleReasoning;
