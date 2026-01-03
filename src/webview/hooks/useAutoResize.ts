/**
 * Auto-Resize Textarea Hook
 *
 * Provides automatic height adjustment for textarea elements
 * based on their content, with support for min/max constraints.
 *
 * @module hooks/useAutoResize
 */

import { useRef, useCallback, useEffect, useState, type RefObject, type ChangeEvent } from "react";

// ============================================================================
// Types
// ============================================================================

/**
 * Options for useAutoResize hook
 */
export interface UseAutoResizeOptions {
    /** Minimum height in pixels (default: auto-calculated from line height) */
    minHeight?: number;
    /** Maximum height in pixels (default: 300) */
    maxHeight?: number;
    /** Initial value */
    initialValue?: string;
    /** Number of visible rows at minimum height (default: 1) */
    minRows?: number;
    /** Callback when value changes */
    onChange?: (value: string) => void;
    /** Whether to reset height when value is cleared */
    resetOnEmpty?: boolean;
}

/**
 * Return type for useAutoResize hook
 */
export interface UseAutoResizeReturn {
    /** Ref to attach to the textarea element */
    textareaRef: RefObject<HTMLTextAreaElement>;
    /** Current value of the textarea */
    value: string;
    /** Set the value programmatically */
    setValue: (value: string) => void;
    /** Handle change event from textarea */
    handleChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
    /** Reset to initial state (empty value, minimum height) */
    reset: () => void;
    /** Manually trigger resize calculation */
    resize: () => void;
    /** Current calculated height */
    height: number;
    /** Whether the textarea is at max height (scrollable) */
    isAtMaxHeight: boolean;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for auto-resizing textarea elements
 *
 * @example
 * ```tsx
 * function MessageInput({ onSend }: { onSend: (message: string) => void }) {
 *   const {
 *     textareaRef,
 *     value,
 *     handleChange,
 *     reset,
 *   } = useAutoResize({
 *     maxHeight: 200,
 *     minRows: 2,
 *     onChange: (val) => console.log('Input:', val),
 *   });
 *
 *   const handleSubmit = () => {
 *     if (value.trim()) {
 *       onSend(value);
 *       reset();
 *     }
 *   };
 *
 *   return (
 *     <textarea
 *       ref={textareaRef}
 *       value={value}
 *       onChange={handleChange}
 *       onKeyDown={(e) => {
 *         if (e.key === 'Enter' && !e.shiftKey) {
 *           e.preventDefault();
 *           handleSubmit();
 *         }
 *       }}
 *     />
 *   );
 * }
 * ```
 */
export function useAutoResize(options: UseAutoResizeOptions = {}): UseAutoResizeReturn {
    const {
        minHeight: minHeightOption,
        maxHeight = 300,
        initialValue = "",
        minRows = 1,
        onChange,
        resetOnEmpty = true,
    } = options;

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [value, setValueState] = useState(initialValue);
    const [height, setHeight] = useState(0);
    const [isAtMaxHeight, setIsAtMaxHeight] = useState(false);
    const calculatedMinHeightRef = useRef<number | null>(null);

    /**
     * Calculate the minimum height based on line height and minRows
     */
    const getMinHeight = useCallback((): number => {
        if (minHeightOption !== undefined) {
            return minHeightOption;
        }

        const textarea = textareaRef.current;
        if (!textarea) {
            return 0;
        }

        // Calculate from line height if not already done
        if (calculatedMinHeightRef.current === null) {
            const computedStyle = window.getComputedStyle(textarea);
            const lineHeight = parseFloat(computedStyle.lineHeight) || 20;
            const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
            const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
            const borderTop = parseFloat(computedStyle.borderTopWidth) || 0;
            const borderBottom = parseFloat(computedStyle.borderBottomWidth) || 0;

            calculatedMinHeightRef.current =
                lineHeight * minRows + paddingTop + paddingBottom + borderTop + borderBottom;
        }

        return calculatedMinHeightRef.current;
    }, [minHeightOption, minRows]);

    /**
     * Calculate and apply the new height
     */
    const resize = useCallback((): void => {
        const textarea = textareaRef.current;
        if (!textarea) {
            return;
        }

        // Reset height to auto to get accurate scrollHeight
        textarea.style.height = "auto";

        // Get the scroll height (actual content height)
        const scrollHeight = textarea.scrollHeight;
        const minHeight = getMinHeight();

        // Calculate new height within constraints
        let newHeight = Math.max(scrollHeight, minHeight);
        const clamped = Math.min(newHeight, maxHeight);
        const atMax = newHeight > maxHeight;

        newHeight = clamped;

        // Apply the new height
        textarea.style.height = `${newHeight}px`;
        textarea.style.overflowY = atMax ? "auto" : "hidden";

        setHeight(newHeight);
        setIsAtMaxHeight(atMax);
    }, [getMinHeight, maxHeight]);

    /**
     * Set value and trigger resize
     */
    const setValue = useCallback(
        (newValue: string): void => {
            setValueState(newValue);
            onChange?.(newValue);

            // Schedule resize after state update
            requestAnimationFrame(() => {
                resize();
            });
        },
        [onChange, resize],
    );

    /**
     * Handle change event from textarea
     */
    const handleChange = useCallback(
        (event: ChangeEvent<HTMLTextAreaElement>): void => {
            const newValue = event.target.value;
            setValue(newValue);
        },
        [setValue],
    );

    /**
     * Reset to initial state
     */
    const reset = useCallback((): void => {
        setValueState(initialValue);
        onChange?.(initialValue);

        const textarea = textareaRef.current;
        if (textarea) {
            const minHeight = getMinHeight();
            textarea.style.height = minHeight ? `${minHeight}px` : "auto";
            textarea.style.overflowY = "hidden";
            setHeight(minHeight);
            setIsAtMaxHeight(false);
        }
    }, [initialValue, onChange, getMinHeight]);

    /**
     * Handle value clearing (reset height if enabled)
     */
    useEffect(() => {
        if (resetOnEmpty && value === "") {
            const textarea = textareaRef.current;
            if (textarea) {
                const minHeight = getMinHeight();
                textarea.style.height = minHeight ? `${minHeight}px` : "auto";
                textarea.style.overflowY = "hidden";
                setHeight(minHeight);
                setIsAtMaxHeight(false);
            }
        }
    }, [value, resetOnEmpty, getMinHeight]);

    /**
     * Initial resize on mount
     */
    useEffect(() => {
        resize();
    }, [resize]);

    /**
     * Resize on window resize
     */
    useEffect(() => {
        const handleWindowResize = () => {
            // Recalculate min height on resize
            calculatedMinHeightRef.current = null;
            resize();
        };

        window.addEventListener("resize", handleWindowResize);
        return () => {
            window.removeEventListener("resize", handleWindowResize);
        };
    }, [resize]);

    return {
        textareaRef,
        value,
        setValue,
        handleChange,
        reset,
        resize,
        height,
        isAtMaxHeight,
    };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate the height needed for given text content
 * Non-hook utility function
 */
export function calculateTextareaHeight(
    text: string,
    options: {
        element?: HTMLTextAreaElement;
        lineHeight?: number;
        padding?: number;
        maxHeight?: number;
    } = {},
): number {
    const { element, lineHeight = 20, padding = 16, maxHeight = Infinity } = options;

    if (element) {
        // Use actual element for measurement
        const originalHeight = element.style.height;
        element.style.height = "auto";
        const height = Math.min(element.scrollHeight, maxHeight);
        element.style.height = originalHeight;
        return height;
    }

    // Estimate from line count
    const lines = text.split("\n").length;
    const estimatedHeight = lines * lineHeight + padding;
    return Math.min(estimatedHeight, maxHeight);
}

/**
 * Create a hidden textarea for measuring text dimensions
 */
export function createMeasureElement(sourceElement: HTMLTextAreaElement): HTMLTextAreaElement {
    const measure = document.createElement("textarea");
    const computedStyle = window.getComputedStyle(sourceElement);

    // Copy relevant styles
    const stylesToCopy = [
        "font-family",
        "font-size",
        "font-weight",
        "line-height",
        "letter-spacing",
        "padding",
        "border",
        "box-sizing",
        "width",
    ];

    stylesToCopy.forEach((style) => {
        measure.style.setProperty(style, computedStyle.getPropertyValue(style));
    });

    measure.style.position = "absolute";
    measure.style.visibility = "hidden";
    measure.style.height = "auto";
    measure.style.overflow = "hidden";
    measure.style.whiteSpace = "pre-wrap";
    measure.style.wordWrap = "break-word";

    return measure;
}
