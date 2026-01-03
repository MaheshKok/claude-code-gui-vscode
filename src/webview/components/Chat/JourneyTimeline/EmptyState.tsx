/**
 * EmptyState Component
 *
 * Displays the empty state when no messages are present.
 *
 * @module components/Chat/JourneyTimeline/EmptyState
 */

import React from "react";
import { Search, Bug, Type, RefreshCw } from "lucide-react";
import { QuickAction } from "./QuickAction";

/**
 * Empty state component shown when no messages exist
 */
export const EmptyState: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in relative z-10">
            <div className="mb-8 relative group cursor-default">
                <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full opacity-50 group-hover:opacity-70 transition-opacity duration-1000" />
                <div className="relative w-24 h-24 flex items-center justify-center rounded-3xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 backdrop-blur-xl shadow-2xl transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3">
                    <div className="text-orange-500">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="48"
                            height="48"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
                            <path d="M12 6v6l4 2" />
                        </svg>
                    </div>
                </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">How can I help?</h2>
            <p className="text-white/50 max-w-lg mb-10 text-lg leading-relaxed">
                I can help you analyze code, fix bugs, write tests, or implement new features. Just
                ask or use a template below.
            </p>
            <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
                <QuickAction label="Explain Code" icon={<Search className="w-4 h-4" />} />
                <QuickAction label="Fix Bugs" icon={<Bug className="w-4 h-4" />} />
                <QuickAction label="Write Tests" icon={<Type className="w-4 h-4" />} />
                <QuickAction label="Refactor" icon={<RefreshCw className="w-4 h-4" />} />
            </div>
        </div>
    );
};

export default EmptyState;
