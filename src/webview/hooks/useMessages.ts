/**
 * Message Handling Hook
 *
 * Provides message routing between the VSCode extension and webview,
 * including streaming updates and message dispatching to appropriate handlers.
 *
 * @module hooks/useMessages
 */

import { useEffect, useCallback, useRef } from "react";
import type {
    ExtensionToWebviewMessage,
    ExtensionToWebviewMessageType,
    ExtensionMessageHandlerMap,
} from "../types/webview-api";

// ============================================================================
// Types
// ============================================================================

/**
 * Message event from VSCode
 */
interface VSCodeMessageEvent {
    data: ExtensionToWebviewMessage;
}

/**
 * Options for useMessages hook
 */
export interface UseMessagesOptions {
    /** Whether to enable message listening */
    enabled?: boolean;
    /** Handler map for different message types */
    handlers?: ExtensionMessageHandlerMap;
    /** Callback for any message received */
    onMessage?: (message: ExtensionToWebviewMessage) => void;
    /** Callback for unhandled messages */
    onUnhandledMessage?: (message: ExtensionToWebviewMessage) => void;
}

/**
 * Return type for useMessages hook
 */
export interface UseMessagesReturn {
    /** Add a handler for a specific message type */
    addHandler: <T extends ExtensionToWebviewMessageType>(
        type: T,
        handler: (message: Extract<ExtensionToWebviewMessage, { type: T }>) => void,
    ) => () => void;
    /** Remove a handler for a specific message type */
    removeHandler: (type: ExtensionToWebviewMessageType) => void;
    /** Clear all handlers */
    clearHandlers: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for handling messages from the VSCode extension
 *
 * @example
 * ```tsx
 * function ChatComponent() {
 *   const [messages, setMessages] = useState<ChatMessage[]>([]);
 *
 *   useMessages({
 *     handlers: {
 *       output: (msg) => {
 *         // Handle streaming output
 *         setMessages(prev => [...prev, { type: 'assistant', content: msg.text }]);
 *       },
 *       toolUse: (msg) => {
 *         // Handle tool use
 *         console.log('Tool used:', msg.toolName);
 *       },
 *       error: (msg) => {
 *         // Handle errors
 *         console.error('Error:', msg.message);
 *       },
 *     },
 *     onMessage: (msg) => {
 *       console.log('Received message:', msg.type);
 *     },
 *   });
 *
 *   return <MessageList messages={messages} />;
 * }
 * ```
 */
export function useMessages(options: UseMessagesOptions = {}): UseMessagesReturn {
    const { enabled = true, handlers = {}, onMessage, onUnhandledMessage } = options;

    // Store handlers in a ref to avoid re-subscribing on every render
    const handlersRef = useRef<ExtensionMessageHandlerMap>(handlers);
    handlersRef.current = handlers;

    const onMessageRef = useRef(onMessage);
    onMessageRef.current = onMessage;

    const onUnhandledMessageRef = useRef(onUnhandledMessage);
    onUnhandledMessageRef.current = onUnhandledMessage;

    // Dynamic handlers that can be added/removed at runtime
    const dynamicHandlersRef = useRef<ExtensionMessageHandlerMap>({});

    /**
     * Handle incoming message from extension
     */
    const handleMessage = useCallback((event: MessageEvent<ExtensionToWebviewMessage>) => {
        const message = event.data;
        console.log("[useMessages] Received message event:", message?.type);

        // Validate message structure
        if (!message || typeof message !== "object" || !("type" in message)) {
            console.log("[useMessages] Invalid message structure, ignoring");
            return;
        }

        // Call global onMessage callback
        if (onMessageRef.current) {
            onMessageRef.current(message);
        }

        // Try to find a handler for this message type
        const messageType = message.type as ExtensionToWebviewMessageType;
        const staticHandler = handlersRef.current[messageType];
        const dynamicHandler = dynamicHandlersRef.current[messageType];

        if (staticHandler) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (staticHandler as (msg: any) => void)(message);
        }

        if (dynamicHandler) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (dynamicHandler as (msg: any) => void)(message);
        }

        // If no handler was found, call unhandled callback
        if (!staticHandler && !dynamicHandler && onUnhandledMessageRef.current) {
            onUnhandledMessageRef.current(message);
        }
    }, []);

    /**
     * Add a handler for a specific message type
     * Returns a cleanup function to remove the handler
     */
    const addHandler = useCallback(
        <T extends ExtensionToWebviewMessageType>(
            type: T,
            handler: (message: Extract<ExtensionToWebviewMessage, { type: T }>) => void,
        ): (() => void) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            dynamicHandlersRef.current[type] = handler as any;
            return () => {
                delete dynamicHandlersRef.current[type];
            };
        },
        [],
    );

    /**
     * Remove a handler for a specific message type
     */
    const removeHandler = useCallback((type: ExtensionToWebviewMessageType): void => {
        delete dynamicHandlersRef.current[type];
    }, []);

    /**
     * Clear all dynamic handlers
     */
    const clearHandlers = useCallback((): void => {
        dynamicHandlersRef.current = {};
    }, []);

    /**
     * Set up message listener
     */
    useEffect(() => {
        if (!enabled) {
            return;
        }

        // Add message listener
        window.addEventListener("message", handleMessage);

        // Cleanup on unmount
        return () => {
            window.removeEventListener("message", handleMessage);
        };
    }, [enabled, handleMessage]);

    return {
        addHandler,
        removeHandler,
        clearHandlers,
    };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a type-safe message handler map
 * Useful for defining handlers outside of components
 */
export function createMessageHandlers(
    handlers: ExtensionMessageHandlerMap,
): ExtensionMessageHandlerMap {
    return handlers;
}

/**
 * Create a handler for streaming output messages
 * Accumulates text content across multiple output messages
 */
export function createStreamingHandler(
    onChunk: (text: string, accumulated: string) => void,
    onComplete?: (finalText: string) => void,
): {
    handler: (message: Extract<ExtensionToWebviewMessage, { type: "output" }>) => void;
    reset: () => void;
    getText: () => string;
} {
    let accumulated = "";

    return {
        handler: (message) => {
            accumulated += message.text;
            onChunk(message.text, accumulated);

            if (message.isFinal && onComplete) {
                onComplete(accumulated);
            }
        },
        reset: () => {
            accumulated = "";
        },
        getText: () => accumulated,
    };
}

/**
 * Create a handler that batches rapid updates
 * Useful for high-frequency streaming updates
 */
export function createBatchedHandler<T>(
    handler: (messages: T[]) => void,
    options: { delay?: number; maxBatchSize?: number } = {},
): (message: T) => void {
    const { delay = 16, maxBatchSize = 50 } = options;
    let batch: T[] = [];
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const flush = () => {
        if (batch.length > 0) {
            handler([...batch]);
            batch = [];
        }
        timeoutId = null;
    };

    return (message: T) => {
        batch.push(message);

        if (batch.length >= maxBatchSize) {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            flush();
        } else if (!timeoutId) {
            timeoutId = setTimeout(flush, delay);
        }
    };
}
