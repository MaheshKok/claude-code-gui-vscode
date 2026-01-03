/**
 * CollapsibleSection Component
 *
 * Reusable collapsible container with consistent expand/collapse behavior.
 * Features a clickable header and animated content reveal.
 *
 * @module components/Common/CollapsibleSection
 */

import React, { useState, useCallback, memo, ReactNode } from "react";
import { ChevronRight } from "lucide-react";

export interface CollapsibleSectionProps {
    /** The header content (can be text or JSX) */
    header: ReactNode;
    /** The collapsible content */
    children: ReactNode;
    /** Initial collapsed state */
    defaultCollapsed?: boolean;
    /** Controlled collapsed state (overrides internal state) */
    isCollapsed?: boolean;
    /** Callback when collapsed state changes */
    onToggle?: (isCollapsed: boolean) => void;
    /** Additional class name for the container */
    className?: string;
    /** Additional class name for the header */
    headerClassName?: string;
    /** Additional class name for the content wrapper */
    contentClassName?: string;
    /** Whether to show the chevron icon */
    showChevron?: boolean;
    /** Position of the chevron */
    chevronPosition?: "left" | "right";
    /** Custom chevron size */
    chevronSize?: number;
}

/**
 * CollapsibleSection provides a reusable pattern for expandable content.
 * Supports both controlled and uncontrolled modes.
 */
export const CollapsibleSection: React.FC<CollapsibleSectionProps> = memo(
    ({
        header,
        children,
        defaultCollapsed = true,
        isCollapsed: controlledIsCollapsed,
        onToggle,
        className = "",
        headerClassName = "",
        contentClassName = "",
        showChevron = true,
        chevronPosition = "left",
        chevronSize = 16,
    }) => {
        const [internalIsCollapsed, setInternalIsCollapsed] = useState(defaultCollapsed);

        // Use controlled state if provided, otherwise use internal state
        const isCollapsed = controlledIsCollapsed ?? internalIsCollapsed;

        const handleToggle = useCallback(() => {
            const newState = !isCollapsed;
            setInternalIsCollapsed(newState);
            onToggle?.(newState);
        }, [isCollapsed, onToggle]);

        const chevron = showChevron && (
            <ChevronRight
                className={`text-white/40 transition-transform duration-200 flex-shrink-0 ${
                    isCollapsed ? "" : "rotate-90"
                }`}
                style={{ width: chevronSize, height: chevronSize }}
            />
        );

        return (
            <div className={`overflow-hidden ${className}`}>
                {/* Clickable Header */}
                <div
                    className={`flex items-center gap-2 cursor-pointer select-none hover:bg-white/5 transition-colors ${headerClassName}`}
                    onClick={handleToggle}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleToggle();
                        }
                    }}
                    aria-expanded={!isCollapsed}
                >
                    {chevronPosition === "left" && chevron}
                    <div className="flex-1 min-w-0">{header}</div>
                    {chevronPosition === "right" && chevron}
                </div>

                {/* Collapsible Content */}
                {!isCollapsed && <div className={contentClassName}>{children}</div>}
            </div>
        );
    },
);

CollapsibleSection.displayName = "CollapsibleSection";

export default CollapsibleSection;
