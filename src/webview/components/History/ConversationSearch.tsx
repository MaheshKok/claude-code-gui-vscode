/**
 * ConversationSearch Component
 *
 * Search input for filtering conversations with debounced input,
 * search icon, and clear button.
 *
 * @module components/History/ConversationSearch
 */

import React, { useState, useEffect, useCallback, useRef } from "react";

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
        <div className="relative">
            {/* Search Icon */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--vscode-input-placeholderForeground)]">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
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
          bg-[var(--vscode-input-background)]
          text-[var(--vscode-input-foreground)]
          placeholder-[var(--vscode-input-placeholderForeground)]
          border border-[var(--vscode-input-border)]
          rounded
          focus:outline-none
          focus:border-[var(--vscode-focusBorder)]
          transition-colors
        `}
                aria-label="Search conversations"
            />

            {/* Clear Button */}
            {value && (
                <button
                    onClick={handleClear}
                    className={`
            absolute right-2 top-1/2 -translate-y-1/2
            p-1
            rounded
            text-[var(--vscode-input-placeholderForeground)]
            hover:text-[var(--vscode-input-foreground)]
            hover:bg-[var(--vscode-toolbar-hoverBackground)]
            transition-colors
          `}
                    aria-label="Clear search"
                    title="Clear search (Esc)"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            )}
        </div>
    );
};

export default ConversationSearch;
