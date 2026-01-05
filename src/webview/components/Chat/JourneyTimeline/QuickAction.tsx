/**
 * QuickAction Component
 *
 * A quick action button for the empty state.
 *
 * @module components/Chat/JourneyTimeline/QuickAction
 */

import React from "react";
import type { QuickActionProps } from "./types";

/**
 * Quick action button component for empty state suggestions
 */
export const QuickAction: React.FC<QuickActionProps> = ({ label, icon, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="flex items-center justify-center gap-3 px-4 py-5 rounded-xl glass hover:bg-white/10 transition-all duration-300 border border-white/10 group hover:shadow-lg hover:border-white/20 hover:-translate-y-1"
        >
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-white/10 to-transparent text-orange-400 group-hover:text-orange-300 group-hover:scale-110 transition-all duration-300 shadow-inner">
                {icon}
            </div>
            <span className="font-medium text-white/80 group-hover:text-white transition-colors">
                {label}
            </span>
        </button>
    );
};

export default QuickAction;
