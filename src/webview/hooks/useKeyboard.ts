/**
 * Keyboard Shortcuts Hook
 *
 * Provides keyboard shortcut handling for the chat interface,
 * including message submission, special characters, and navigation.
 *
 * @module hooks/useKeyboard
 */

import { useEffect, useCallback, useRef, useMemo } from "react";

// ============================================================================
// Types
// ============================================================================

/**
 * Keyboard shortcut modifier keys
 */
export interface KeyModifiers {
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
}

/**
 * Keyboard shortcut definition
 */
export interface KeyboardShortcut {
    /** The key to listen for (e.g., 'Enter', 'Escape', '@') */
    key: string;
    /** Required modifier keys */
    modifiers?: KeyModifiers;
    /** Handler function */
    handler: (event: KeyboardEvent) => void;
    /** Whether to prevent default behavior */
    preventDefault?: boolean;
    /** Whether to stop propagation */
    stopPropagation?: boolean;
    /** Description for accessibility/documentation */
    description?: string;
    /** Whether the shortcut is enabled */
    enabled?: boolean;
}

/**
 * Options for useKeyboard hook
 */
export interface UseKeyboardOptions {
    /** List of shortcuts to register */
    shortcuts?: KeyboardShortcut[];
    /** Whether keyboard handling is enabled */
    enabled?: boolean;
    /** Target element (default: document) */
    target?: HTMLElement | null;
    /** Event type to listen for (default: 'keydown') */
    eventType?: "keydown" | "keyup" | "keypress";
}

/**
 * Return type for useKeyboard hook
 */
export interface UseKeyboardReturn {
    /** Add a new shortcut */
    addShortcut: (shortcut: KeyboardShortcut) => () => void;
    /** Remove a shortcut by key */
    removeShortcut: (key: string, modifiers?: KeyModifiers) => void;
    /** Enable a specific shortcut */
    enableShortcut: (key: string, modifiers?: KeyModifiers) => void;
    /** Disable a specific shortcut */
    disableShortcut: (key: string, modifiers?: KeyModifiers) => void;
    /** Get all registered shortcuts */
    getShortcuts: () => KeyboardShortcut[];
}

/**
 * Chat input keyboard options
 */
export interface UseChatKeyboardOptions {
    /** Handler for sending message (Enter) */
    onSend?: () => void;
    /** Handler for inserting newline (Ctrl+Enter or Shift+Enter) */
    onNewLine?: () => void;
    /** Handler for escape key */
    onEscape?: () => void;
    /** Handler for file picker trigger (@) */
    onFilePicker?: () => void;
    /** Handler for slash command trigger (/) */
    onSlashCommand?: () => void;
    /** Handler for up arrow (history navigation) */
    onHistoryPrev?: () => void;
    /** Handler for down arrow (history navigation) */
    onHistoryNext?: () => void;
    /** Handler for tab (autocomplete) */
    onTab?: () => void;
    /** Whether the input is empty (affects some shortcuts) */
    isInputEmpty?: boolean;
    /** Whether suggestions are visible */
    suggestionsVisible?: boolean;
    /** Whether to use Ctrl+Enter for send (instead of Enter) */
    ctrlEnterToSend?: boolean;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if modifiers match the event
 */
function modifiersMatch(event: KeyboardEvent, modifiers?: KeyModifiers): boolean {
    const { ctrl = false, alt = false, shift = false, meta = false } = modifiers ?? {};

    return (
        event.ctrlKey === ctrl &&
        event.altKey === alt &&
        event.shiftKey === shift &&
        event.metaKey === meta
    );
}

/**
 * Generate a unique key for a shortcut
 */
function getShortcutKey(key: string, modifiers?: KeyModifiers): string {
    const parts: string[] = [];
    if (modifiers?.ctrl) parts.push("Ctrl");
    if (modifiers?.alt) parts.push("Alt");
    if (modifiers?.shift) parts.push("Shift");
    if (modifiers?.meta) parts.push("Meta");
    parts.push(key);
    return parts.join("+");
}

// ============================================================================
// Main Hook Implementation
// ============================================================================

/**
 * Hook for handling keyboard shortcuts
 *
 * @example
 * ```tsx
 * function App() {
 *   useKeyboard({
 *     shortcuts: [
 *       {
 *         key: 'Escape',
 *         handler: () => closeModal(),
 *         description: 'Close modal',
 *       },
 *       {
 *         key: 's',
 *         modifiers: { ctrl: true },
 *         handler: () => saveDocument(),
 *         preventDefault: true,
 *         description: 'Save document',
 *       },
 *     ],
 *   });
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useKeyboard(options: UseKeyboardOptions = {}): UseKeyboardReturn {
    const { shortcuts = [], enabled = true, target, eventType = "keydown" } = options;

    // Store shortcuts in a ref to avoid recreating the handler
    const shortcutsRef = useRef<Map<string, KeyboardShortcut>>(new Map());

    // Initialize shortcuts map
    useMemo(() => {
        shortcutsRef.current.clear();
        shortcuts.forEach((shortcut) => {
            const key = getShortcutKey(shortcut.key, shortcut.modifiers);
            shortcutsRef.current.set(key, shortcut);
        });
    }, [shortcuts]);

    /**
     * Handle keyboard event
     */
    const handleKeyEvent = useCallback((event: KeyboardEvent) => {
        for (const [, shortcut] of shortcutsRef.current) {
            // Skip disabled shortcuts
            if (shortcut.enabled === false) {
                continue;
            }

            // Check if key and modifiers match
            if (event.key === shortcut.key && modifiersMatch(event, shortcut.modifiers)) {
                if (shortcut.preventDefault) {
                    event.preventDefault();
                }
                if (shortcut.stopPropagation) {
                    event.stopPropagation();
                }
                shortcut.handler(event);
                break;
            }
        }
    }, []);

    /**
     * Add a new shortcut
     */
    const addShortcut = useCallback((shortcut: KeyboardShortcut): (() => void) => {
        const key = getShortcutKey(shortcut.key, shortcut.modifiers);
        shortcutsRef.current.set(key, shortcut);
        return () => {
            shortcutsRef.current.delete(key);
        };
    }, []);

    /**
     * Remove a shortcut
     */
    const removeShortcut = useCallback((key: string, modifiers?: KeyModifiers): void => {
        const shortcutKey = getShortcutKey(key, modifiers);
        shortcutsRef.current.delete(shortcutKey);
    }, []);

    /**
     * Enable a shortcut
     */
    const enableShortcut = useCallback((key: string, modifiers?: KeyModifiers): void => {
        const shortcutKey = getShortcutKey(key, modifiers);
        const shortcut = shortcutsRef.current.get(shortcutKey);
        if (shortcut) {
            shortcut.enabled = true;
        }
    }, []);

    /**
     * Disable a shortcut
     */
    const disableShortcut = useCallback((key: string, modifiers?: KeyModifiers): void => {
        const shortcutKey = getShortcutKey(key, modifiers);
        const shortcut = shortcutsRef.current.get(shortcutKey);
        if (shortcut) {
            shortcut.enabled = false;
        }
    }, []);

    /**
     * Get all registered shortcuts
     */
    const getShortcuts = useCallback((): KeyboardShortcut[] => {
        return Array.from(shortcutsRef.current.values());
    }, []);

    /**
     * Set up event listener
     */
    useEffect(() => {
        if (!enabled) {
            return;
        }

        const targetElement = target ?? document;
        targetElement.addEventListener(eventType, handleKeyEvent as EventListener);

        return () => {
            targetElement.removeEventListener(eventType, handleKeyEvent as EventListener);
        };
    }, [enabled, target, eventType, handleKeyEvent]);

    return {
        addShortcut,
        removeShortcut,
        enableShortcut,
        disableShortcut,
        getShortcuts,
    };
}

// ============================================================================
// Chat-Specific Hook
// ============================================================================

/**
 * Hook for chat input keyboard handling
 *
 * @example
 * ```tsx
 * function MessageInput() {
 *   const [value, setValue] = useState('');
 *
 *   const handleKeyDown = useChatKeyboard({
 *     onSend: () => {
 *       sendMessage(value);
 *       setValue('');
 *     },
 *     onEscape: () => clearInput(),
 *     onFilePicker: () => showFilePicker(),
 *     onSlashCommand: () => showCommandPalette(),
 *     isInputEmpty: value === '',
 *   });
 *
 *   return (
 *     <textarea
 *       value={value}
 *       onChange={(e) => setValue(e.target.value)}
 *       onKeyDown={handleKeyDown}
 *     />
 *   );
 * }
 * ```
 */
export function useChatKeyboard(
    options: UseChatKeyboardOptions = {},
): (event: React.KeyboardEvent) => void {
    const {
        onSend,
        onNewLine,
        onEscape,
        onFilePicker,
        onSlashCommand,
        onHistoryPrev,
        onHistoryNext,
        onTab,
        isInputEmpty = false,
        suggestionsVisible = false,
        ctrlEnterToSend = false,
    } = options;

    const handlersRef = useRef(options);
    handlersRef.current = options;

    return useCallback(
        (event: React.KeyboardEvent): void => {
            const {
                onSend,
                onNewLine,
                onEscape,
                onFilePicker,
                onSlashCommand,
                onHistoryPrev,
                onHistoryNext,
                onTab,
            } = handlersRef.current;

            switch (event.key) {
                case "Enter":
                    if (ctrlEnterToSend) {
                        // Ctrl+Enter to send, Enter for newline
                        if (event.ctrlKey || event.metaKey) {
                            event.preventDefault();
                            onSend?.();
                        }
                        // Allow default Enter behavior (newline)
                    } else {
                        // Enter to send, Shift+Enter or Ctrl+Enter for newline
                        if (event.shiftKey || event.ctrlKey || event.metaKey) {
                            // Allow newline
                            onNewLine?.();
                        } else {
                            event.preventDefault();
                            onSend?.();
                        }
                    }
                    break;

                case "Escape":
                    event.preventDefault();
                    onEscape?.();
                    break;

                case "@":
                    // Only trigger file picker at start of input or after whitespace
                    if (!event.ctrlKey && !event.altKey && !event.metaKey) {
                        // Let the character be typed, then trigger picker
                        // (handler should check cursor position)
                        setTimeout(() => onFilePicker?.(), 0);
                    }
                    break;

                case "/":
                    // Only trigger slash commands when input is empty
                    if (isInputEmpty && !event.ctrlKey && !event.altKey && !event.metaKey) {
                        setTimeout(() => onSlashCommand?.(), 0);
                    }
                    break;

                case "ArrowUp":
                    // History navigation when input is empty or at start
                    if (isInputEmpty || suggestionsVisible) {
                        event.preventDefault();
                        onHistoryPrev?.();
                    }
                    break;

                case "ArrowDown":
                    if (suggestionsVisible) {
                        event.preventDefault();
                        onHistoryNext?.();
                    }
                    break;

                case "Tab":
                    if (suggestionsVisible) {
                        event.preventDefault();
                        onTab?.();
                    }
                    break;
            }
        },
        [ctrlEnterToSend, isInputEmpty, suggestionsVisible],
    );
}

// ============================================================================
// Shortcut Display Utilities
// ============================================================================

/**
 * Format a shortcut for display
 */
export function formatShortcut(key: string, modifiers?: KeyModifiers): string {
    const isMac =
        typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

    const parts: string[] = [];

    if (modifiers?.ctrl) {
        parts.push(isMac ? "\u2318" : "Ctrl");
    }
    if (modifiers?.alt) {
        parts.push(isMac ? "\u2325" : "Alt");
    }
    if (modifiers?.shift) {
        parts.push(isMac ? "\u21E7" : "Shift");
    }
    if (modifiers?.meta) {
        parts.push(isMac ? "\u2318" : "Win");
    }

    // Format special keys
    const keyDisplay =
        {
            Enter: isMac ? "\u21A9" : "Enter",
            Escape: isMac ? "\u238B" : "Esc",
            ArrowUp: "\u2191",
            ArrowDown: "\u2193",
            ArrowLeft: "\u2190",
            ArrowRight: "\u2192",
            Tab: "\u21E5",
            Backspace: isMac ? "\u232B" : "Backspace",
            Delete: isMac ? "\u2326" : "Del",
            " ": "Space",
        }[key] ?? key.toUpperCase();

    parts.push(keyDisplay);

    return parts.join(isMac ? "" : "+");
}
