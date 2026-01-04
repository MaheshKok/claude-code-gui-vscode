/**
 * ConversationSearch Component
 *
 * Search input for filtering conversations with debounced input,
 * search icon, and clear button.
 * Styled to match Claude Code dark theme.
 *
 * @module components/History/ConversationSearch
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Search, X } from "lucide-react";

export interface ConversationSearchProps {
    /** Callback when search query changes (debounced) */
    onSearch: (query: string) => void;
    /** Placeholder text */
    placeholder?: string;
    /** Debounce delay in milliseconds */
    debounceMs?: number;
    /** Auto-focus on mount */
    autoFocus?: boolean;
}

export const ConversationSearch: React.FC<ConversationSearchProps> = ({
    onSearch,
    placeholder = "Search conversations...",
    debounceMs = 300,
    autoFocus = false,
}) => {
    const [value, setValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Debounced search callback
    const debouncedSearch = useCallback(
        (query: string) => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }

            debounceRef.current = setTimeout(() => {
                onSearch(query);
            }, debounceMs);
        },
        [onSearch, debounceMs],
    );

    // Update search on value change
    useEffect(() => {
        debouncedSearch(value);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [value, debouncedSearch]);

    // Handle input change
    const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setValue(event.target.value);
    }, []);

    // Clear search
    const handleClear = useCallback(() => {
        setValue("");
        onSearch("");
        inputRef.current?.focus();
    }, [onSearch]);

    // Handle keyboard shortcuts
    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Escape") {
                if (value) {
                    handleClear();
                }
            }
        },
        [value, handleClear],
    );

    return (
        <div className="relative group">
            {/* Search Icon */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 group-focus-within:text-white/70 transition-colors">
                <Search size={14} />
            </div>

            {/* Input */}
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                autoFocus={autoFocus}
                className={`
                    w-full pl-9 pr-8 py-2
                    text-sm
                    bg-black/20
                    text-white
                    placeholder-white/30
                    border border-white/10
                    rounded-lg
                    focus:outline-none focus:border-white/20 focus:bg-black/40
                    transition-all duration-200
                `}
                aria-label="Search conversations"
            />

            {/* Clear Button */}
            {value && (
                <button
                    onClick={handleClear}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Clear search"
                    title="Clear search (Esc)"
                >
                    <X size={12} />
                </button>
            )}
        </div>
    );
};

export default ConversationSearch;
