/**
 * VSCode API Wrapper Hook
 *
 * Provides type-safe access to the VSCode webview API,
 * including messaging, state persistence, and utility functions.
 *
 * @module hooks/useVSCode
 */

import { useCallback, useMemo } from "react";
import type { VSCodeApi, WebviewToExtensionMessage } from "../types/webview-api";

// ============================================================================
// VSCode API Singleton
// ============================================================================

/**
 * Cached VSCode API instance
 * The API can only be acquired once per webview session
 */
let vscodeApi: VSCodeApi | null = null;

/**
 * Get or acquire the VSCode API
 * @returns The VSCode API instance or null if not in VSCode context
 */
function getVSCodeApi(): VSCodeApi | null {
    if (vscodeApi) {
        return vscodeApi;
    }

    // First check if vscode was already acquired and attached to window (by main.tsx)
    if (typeof window !== "undefined" && window.vscode) {
        console.log("[useVSCode] Using existing window.vscode");
        vscodeApi = window.vscode as VSCodeApi;
        return vscodeApi;
    }

    // Try to acquire if not already done
    if (typeof window !== "undefined" && typeof window.acquireVsCodeApi === "function") {
        try {
            vscodeApi = window.acquireVsCodeApi();
            console.log("[useVSCode] Acquired VSCode API");
            return vscodeApi;
        } catch {
            // API already acquired but not attached to window - this shouldn't happen
            console.warn("[useVSCode] Failed to acquire VSCode API");
        }
    }

    console.warn("[useVSCode] No VSCode API available");
    return null;
}

// ============================================================================
// Hook Return Type
// ============================================================================

/**
 * Return type for useVSCode hook
 */
export interface UseVSCodeReturn {
    /** Whether we're in a VSCode webview context */
    isVSCode: boolean;
    /** The VSCode API instance (null if not in VSCode) */
    api: VSCodeApi | null;
    /** Post a message to the extension */
    postMessage: (message: WebviewToExtensionMessage) => void;
    /** Get persisted state */
    getState: <T = unknown>() => T | undefined;
    /** Set persisted state */
    setState: <T = unknown>(state: T) => void;
    /** Update persisted state (merge with existing) */
    updateState: <T extends Record<string, unknown>>(updates: Partial<T>) => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for accessing the VSCode webview API
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isVSCode, postMessage, getState, setState } = useVSCode();
 *
 *   const handleClick = () => {
 *     if (isVSCode) {
 *       postMessage({ type: 'sendMessage', message: 'Hello!' });
 *     }
 *   };
 *
 *   // Persist state across webview reloads
 *   const savedData = getState<{ count: number }>();
 *   setState({ count: (savedData?.count ?? 0) + 1 });
 *
 *   return <button onClick={handleClick}>Send</button>;
 * }
 * ```
 */
export function useVSCode(): UseVSCodeReturn {
    // Get or initialize the VSCode API
    const api = useMemo(() => getVSCodeApi(), []);
    const isVSCode = api !== null;

    /**
     * Post a message to the extension
     * Safely handles non-VSCode environments
     */
    const postMessage = useCallback(
        (message: WebviewToExtensionMessage): void => {
            console.log("[useVSCode] postMessage called:", message.type, "api available:", !!api);
            if (api) {
                console.log("[useVSCode] Sending message to extension:", message.type);
                api.postMessage(message);
                console.log("[useVSCode] Message sent successfully");
            } else {
                console.warn("[useVSCode] postMessage called outside VSCode context:", message);
            }
        },
        [api],
    );

    /**
     * Get persisted state
     * Returns undefined if not in VSCode or no state exists
     */
    const getState = useCallback(<T = unknown>(): T | undefined => {
        if (api) {
            return api.getState() as T | undefined;
        }
        // Fallback to localStorage in development
        if (typeof window !== "undefined" && window.localStorage) {
            try {
                const stored = window.localStorage.getItem("vscode-webview-state");
                return stored ? JSON.parse(stored) : undefined;
            } catch {
                return undefined;
            }
        }
        return undefined;
    }, [api]);

    /**
     * Set persisted state
     * State persists across webview reloads (but not window reloads)
     */
    const setState = useCallback(
        <T = unknown>(state: T): void => {
            if (api) {
                api.setState(state);
            } else if (typeof window !== "undefined" && window.localStorage) {
                // Fallback to localStorage in development
                try {
                    window.localStorage.setItem("vscode-webview-state", JSON.stringify(state));
                } catch {
                    console.warn("Failed to persist state to localStorage");
                }
            }
        },
        [api],
    );

    /**
     * Update persisted state by merging with existing
     * Useful for partial state updates
     */
    const updateState = useCallback(
        <T extends Record<string, unknown>>(updates: Partial<T>): void => {
            const currentState = getState<T>() ?? ({} as T);
            setState({ ...currentState, ...updates });
        },
        [getState, setState],
    );

    return {
        isVSCode,
        api,
        postMessage,
        getState,
        setState,
        updateState,
    };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if running in VSCode webview context
 * Can be used outside of React components
 */
export function isInVSCode(): boolean {
    return getVSCodeApi() !== null;
}

/**
 * Get the VSCode API directly (non-hook version)
 * Useful for utilities or stores
 */
export function getVSCode(): VSCodeApi | null {
    return getVSCodeApi();
}

/**
 * Post a message to the extension (non-hook version)
 * Useful for utilities or stores
 */
export function postMessageToExtension(message: WebviewToExtensionMessage): void {
    const api = getVSCodeApi();
    if (api) {
        api.postMessage(message);
    } else {
        console.warn("postMessageToExtension called outside VSCode context:", message);
    }
}
