/**
 * EmptyState Component
 *
 * Displays the empty state when no messages are present.
 *
 * @module components/Chat/JourneyTimeline/EmptyState
 */

import React from "react";
import { Search, Bug, Type, RefreshCw, Zap, Shield } from "lucide-react";
import { QuickAction } from "./QuickAction";
import logoImage from "../../../assets/logo.png";

interface EmptyStateProps {
    onAction?: (prompt: string) => void;
}

/**
 * Empty state component shown when no messages exist
 */
export const EmptyState: React.FC<EmptyStateProps> = ({ onAction }) => {
    const handleAction = (prompt: string) => {
        if (onAction) {
            onAction(prompt);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in relative z-10">
            <div className="mb-8 relative group cursor-default">
                <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full opacity-50 group-hover:opacity-70 transition-opacity duration-1000" />
                <div className="relative w-24 h-24 flex items-center justify-center rounded-3xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 backdrop-blur-xl shadow-2xl transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3 overflow-hidden">
                    <img
                        src={logoImage}
                        alt="Claude Code GUI"
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">How can I help?</h2>
            <p className="text-white/50 max-w-lg mb-10 text-lg leading-relaxed">
                I can help you analyze code, fix bugs, write tests, or implement new features. Just
                ask or use a template below.
            </p>
            <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
                <QuickAction
                    label="Explain Code"
                    icon={<Search className="w-4 h-4" />}
                    onClick={() => handleAction("Explain how this code works in detail")}
                />
                <QuickAction
                    label="Fix Bugs"
                    icon={<Bug className="w-4 h-4" />}
                    onClick={() => handleAction("Help me fix this bug in my code")}
                />
                <QuickAction
                    label="Write Tests"
                    icon={<Type className="w-4 h-4" />}
                    onClick={() => handleAction("Generate comprehensive tests for this code")}
                />
                <QuickAction
                    label="Refactor"
                    icon={<RefreshCw className="w-4 h-4" />}
                    onClick={() =>
                        handleAction(
                            "Refactor this code to improve readability and maintainability",
                        )
                    }
                />
                <QuickAction
                    label="Performance"
                    icon={<Zap className="w-4 h-4" />}
                    onClick={() =>
                        handleAction(
                            "Analyze this code for performance issues and suggest optimizations",
                        )
                    }
                />
                <QuickAction
                    label="Security"
                    icon={<Shield className="w-4 h-4" />}
                    onClick={() => handleAction("Review this code for security vulnerabilities")}
                />
            </div>
        </div>
    );
};

export default EmptyState;
