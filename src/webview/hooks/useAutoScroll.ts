/**
 * Auto-Scroll Hook
 *
 * Provides smart auto-scrolling behavior that scrolls to new content
 * only when the user is near the bottom of the container.
 *
 * @module hooks/useAutoScroll
 */

import { useRef, useCallback, useEffect, useState, type RefObject } from "react";

// ============================================================================
// Types
// ============================================================================

/**
 * Options for useAutoScroll hook
 */
export interface UseAutoScrollOptions {
    /** Threshold in pixels from bottom to consider "near bottom" (default: 100) */
    threshold?: number;
    /** Whether auto-scroll is enabled (default: true) */
    enabled?: boolean;
    /** Scroll behavior (default: 'smooth') */
    behavior?: ScrollBehavior;
    /** Dependencies that trigger scroll check */
    dependencies?: unknown[];
    /** Callback when user scrolls away from bottom */
    onScrollAway?: () => void;
    /** Callback when user scrolls to bottom */
    onScrollToBottom?: () => void;
}

/**
 * Return type for useAutoScroll hook
 */
export interface UseAutoScrollReturn<T extends HTMLElement> {
    /** Ref to attach to the scrollable container */
    containerRef: RefObject<T>;
    /** Whether the user is currently near the bottom */
    isNearBottom: boolean;
    /** Whether auto-scroll is currently active */
    isAutoScrollEnabled: boolean;
    /** Scroll to the bottom of the container */
    scrollToBottom: (options?: { behavior?: ScrollBehavior }) => void;
    /** Enable auto-scroll */
    enableAutoScroll: () => void;
    /** Disable auto-scroll */
    disableAutoScroll: () => void;
    /** Toggle auto-scroll */
    toggleAutoScroll: () => void;
    /** Check if currently at bottom */
    checkIsAtBottom: () => boolean;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for smart auto-scrolling behavior
 *
 * @example
 * ```tsx
 * function MessageList({ messages }: { messages: Message[] }) {
 *   const {
 *     containerRef,
 *     isNearBottom,
 *     scrollToBottom,
 *   } = useAutoScroll<HTMLDivElement>({
 *     dependencies: [messages],
 *     threshold: 150,
 *   });
 *
 *   return (
 *     <div ref={containerRef} className="message-list">
 *       {messages.map(msg => <Message key={msg.id} {...msg} />)}
 *       {!isNearBottom && (
 *         <button onClick={() => scrollToBottom()}>
 *           Scroll to bottom
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAutoScroll<T extends HTMLElement = HTMLDivElement>(
    options: UseAutoScrollOptions = {},
): UseAutoScrollReturn<T> {
    const {
        threshold = 100,
        enabled = true,
        behavior = "smooth",
        dependencies = [],
        onScrollAway,
        onScrollToBottom,
    } = options;

    const containerRef = useRef<T>(null);
    const [isNearBottom, setIsNearBottom] = useState(true);
    const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(enabled);
    const isScrollingRef = useRef(false);
    const lastScrollTopRef = useRef(0);

    /**
     * Check if the container is scrolled to the bottom
     */
    const checkIsAtBottom = useCallback((): boolean => {
        const container = containerRef.current;
        if (!container) {
            return true;
        }

        const { scrollTop, scrollHeight, clientHeight } = container;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        return distanceFromBottom <= threshold;
    }, [threshold]);

    /**
     * Scroll to the bottom of the container
     */
    const scrollToBottom = useCallback(
        (scrollOptions?: { behavior?: ScrollBehavior }): void => {
            const container = containerRef.current;
            if (!container) {
                return;
            }

            isScrollingRef.current = true;

            container.scrollTo({
                top: container.scrollHeight,
                behavior: scrollOptions?.behavior ?? behavior,
            });

            // Reset scrolling flag after animation
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    isScrollingRef.current = false;
                    setIsNearBottom(true);
                });
            });
        },
        [behavior],
    );

    /**
     * Enable auto-scroll
     */
    const enableAutoScroll = useCallback((): void => {
        setIsAutoScrollEnabled(true);
    }, []);

    /**
     * Disable auto-scroll
     */
    const disableAutoScroll = useCallback((): void => {
        setIsAutoScrollEnabled(false);
    }, []);

    /**
     * Toggle auto-scroll
     */
    const toggleAutoScroll = useCallback((): void => {
        setIsAutoScrollEnabled((prev) => !prev);
    }, []);

    /**
     * Handle scroll events
     */
    const handleScroll = useCallback((): void => {
        if (isScrollingRef.current) {
            return;
        }

        const container = containerRef.current;
        if (!container) {
            return;
        }

        const { scrollTop } = container;
        const wasNearBottom = isNearBottom;
        const nowNearBottom = checkIsAtBottom();

        // Detect scroll direction
        const isScrollingUp = scrollTop < lastScrollTopRef.current;
        lastScrollTopRef.current = scrollTop;

        setIsNearBottom(nowNearBottom);

        // Trigger callbacks based on scroll state changes
        if (wasNearBottom && !nowNearBottom && isScrollingUp) {
            onScrollAway?.();
        } else if (!wasNearBottom && nowNearBottom) {
            onScrollToBottom?.();
        }
    }, [isNearBottom, checkIsAtBottom, onScrollAway, onScrollToBottom]);

    /**
     * Set up scroll event listener
     */
    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }

        container.addEventListener("scroll", handleScroll, { passive: true });

        return () => {
            container.removeEventListener("scroll", handleScroll);
        };
    }, [handleScroll]);

    /**
     * Auto-scroll when dependencies change
     */
    useEffect(() => {
        if (isAutoScrollEnabled && isNearBottom) {
            // Use requestAnimationFrame to ensure DOM has updated
            requestAnimationFrame(() => {
                scrollToBottom({ behavior });
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...dependencies, isAutoScrollEnabled, isNearBottom]);

    /**
     * Initial scroll to bottom
     */
    useEffect(() => {
        if (isAutoScrollEnabled) {
            // Immediate scroll on mount
            scrollToBottom({ behavior: "instant" });
        }
        // Only run on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        containerRef,
        isNearBottom,
        isAutoScrollEnabled,
        scrollToBottom,
        enableAutoScroll,
        disableAutoScroll,
        toggleAutoScroll,
        checkIsAtBottom,
    };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Scroll an element to the bottom
 * Non-hook utility function
 */
export function scrollElementToBottom(
    element: HTMLElement,
    options?: { behavior?: ScrollBehavior },
): void {
    element.scrollTo({
        top: element.scrollHeight,
        behavior: options?.behavior ?? "smooth",
    });
}

/**
 * Check if an element is scrolled to the bottom
 * Non-hook utility function
 */
export function isElementAtBottom(element: HTMLElement, threshold: number = 100): boolean {
    const { scrollTop, scrollHeight, clientHeight } = element;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    return distanceFromBottom <= threshold;
}
