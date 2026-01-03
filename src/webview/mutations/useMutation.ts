/**
 * useMutation Hook
 *
 * Core mutation hook providing state management, optimistic updates,
 * error handling, and retry logic for async operations.
 *
 * @module mutations/useMutation
 */

import { useState, useCallback, useEffect, useRef } from "react";
import type { MutationState, MutationOptions, MutationResult, MutationStatus } from "./types";

// ============================================================================
// Initial State
// ============================================================================

function getInitialState<TData, TError>(): MutationState<TData, TError> {
    return {
        status: "idle",
        data: null,
        error: null,
        isPending: false,
        isSuccess: false,
        isError: false,
        isIdle: true,
        startedAt: null,
        completedAt: null,
        attemptCount: 0,
    };
}

// ============================================================================
// Helper Functions
// ============================================================================

function getDefaultRetryDelay(attemptIndex: number): number {
    return Math.min(1000 * 2 ** attemptIndex, 30000);
}

function shouldRetry<TError>(
    retry: MutationOptions<unknown, unknown, TError>["retry"],
    failureCount: number,
    error: TError,
): boolean {
    if (retry === false || retry === undefined) return false;
    if (retry === true) return failureCount < 3;
    if (typeof retry === "number") return failureCount < retry;
    return retry(failureCount, error);
}

// ============================================================================
// useMutation Hook
// ============================================================================

/**
 * Hook for managing mutations with state, optimistic updates, and error handling
 *
 * @example
 * ```tsx
 * const { mutate, isPending, isError, error } = useMutation({
 *   mutationFn: async (data) => {
 *     const response = await api.createItem(data);
 *     return response;
 *   },
 *   onSuccess: (data) => {
 *     console.log('Created:', data);
 *   },
 *   onError: (error) => {
 *     console.error('Failed:', error);
 *   },
 * });
 *
 * // Call the mutation
 * mutate({ name: 'New Item' });
 * ```
 */
export function useMutation<TData = unknown, TVariables = void, TError = Error, TContext = unknown>(
    options: MutationOptions<TData, TVariables, TError, TContext>,
): MutationResult<TData, TVariables, TError> {
    const {
        mutationFn,
        onMutate,
        onSuccess,
        onError,
        onSettled,
        retry = 0,
        retryDelay = getDefaultRetryDelay,
    } = options;

    const [state, setState] = useState<MutationState<TData, TError>>(getInitialState);
    const [variables, setVariables] = useState<TVariables | undefined>(undefined);

    const isMounted = useRef(true);
    const currentMutationRef = useRef<symbol | null>(null);
    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    /**
     * Update state safely (only if mounted and mutation is current)
     */
    const safeSetState = useCallback(
        (mutationId: symbol, updates: Partial<MutationState<TData, TError>>) => {
            if (isMounted.current && currentMutationRef.current === mutationId) {
                setState((prev) => ({ ...prev, ...updates }));
            }
        },
        [],
    );

    /**
     * Execute the mutation with retry logic
     */
    const executeMutation = useCallback(
        async (vars: TVariables, mutationId: symbol): Promise<TData> => {
            let attemptCount = 0;
            let lastError: TError | null = null;

            while (true) {
                attemptCount++;

                safeSetState(mutationId, { attemptCount });

                try {
                    const result = await mutationFn(vars);
                    return result;
                } catch (err) {
                    lastError = err as TError;

                    const shouldRetryNow = shouldRetry(retry, attemptCount, lastError);

                    if (!shouldRetryNow) {
                        throw lastError;
                    }

                    // Calculate retry delay
                    const delay =
                        typeof retryDelay === "function"
                            ? retryDelay(attemptCount - 1, lastError)
                            : retryDelay;

                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }
        },
        [mutationFn, retry, retryDelay, safeSetState],
    );

    /**
     * Main mutation execution
     */
    const mutateAsync = useCallback(
        async (vars: TVariables): Promise<TData> => {
            const mutationId = Symbol("mutation");
            currentMutationRef.current = mutationId;

            setVariables(vars);

            // Set pending state
            const startedAt = Date.now();
            setState({
                status: "pending",
                data: null,
                error: null,
                isPending: true,
                isSuccess: false,
                isError: false,
                isIdle: false,
                startedAt,
                completedAt: null,
                attemptCount: 0,
            });

            // Execute onMutate for optimistic updates
            let context: TContext | undefined;
            try {
                if (onMutate) {
                    context = await onMutate(vars);
                }
            } catch (err) {
                // If onMutate fails, don't proceed
                const error = err as TError;
                const completedAt = Date.now();

                setState({
                    status: "error",
                    data: null,
                    error,
                    isPending: false,
                    isSuccess: false,
                    isError: true,
                    isIdle: false,
                    startedAt,
                    completedAt,
                    attemptCount: 0,
                });

                if (onError) {
                    await onError(error, vars, context);
                }
                if (onSettled) {
                    await onSettled(undefined, error, vars, context);
                }

                throw error;
            }

            try {
                // Execute mutation
                const data = await executeMutation(vars, mutationId);
                const completedAt = Date.now();

                // Only update state if this is still the current mutation
                if (currentMutationRef.current === mutationId) {
                    setState((prev) => ({
                        status: "success",
                        data,
                        error: null,
                        isPending: false,
                        isSuccess: true,
                        isError: false,
                        isIdle: false,
                        startedAt: prev.startedAt,
                        completedAt,
                        attemptCount: prev.attemptCount,
                    }));
                }

                // Call success handler
                if (onSuccess) {
                    await onSuccess(data, vars, context as TContext);
                }

                // Call settled handler
                if (onSettled) {
                    await onSettled(data, null, vars, context);
                }

                return data;
            } catch (err) {
                const error = err as TError;
                const completedAt = Date.now();

                // Only update state if this is still the current mutation
                if (currentMutationRef.current === mutationId) {
                    setState((prev) => ({
                        status: "error",
                        data: null,
                        error,
                        isPending: false,
                        isSuccess: false,
                        isError: true,
                        isIdle: false,
                        startedAt: prev.startedAt,
                        completedAt,
                        attemptCount: prev.attemptCount,
                    }));
                }

                // Call error handler
                if (onError) {
                    await onError(error, vars, context);
                }

                // Call settled handler
                if (onSettled) {
                    await onSettled(undefined, error, vars, context);
                }

                throw error;
            }
        },
        [executeMutation, onMutate, onSuccess, onError, onSettled],
    );

    /**
     * Fire-and-forget mutation (doesn't throw)
     */
    const mutate = useCallback(
        (vars: TVariables): void => {
            mutateAsync(vars).catch(() => {
                // Error is already handled by onError callback
            });
        },
        [mutateAsync],
    );

    /**
     * Reset mutation state to idle
     */
    const reset = useCallback((): void => {
        currentMutationRef.current = null;
        setState(getInitialState());
        setVariables(undefined);
    }, []);

    return {
        ...state,
        mutate,
        mutateAsync,
        reset,
        variables,
    };
}

// ============================================================================
// useOptimisticMutation Hook
// ============================================================================

/**
 * Hook for mutations with automatic optimistic updates and rollback
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useOptimisticMutation({
 *   mutationFn: async (newMessage) => {
 *     return await api.sendMessage(newMessage);
 *   },
 *   getSnapshot: () => messages,
 *   optimisticUpdate: (newMessage) => {
 *     setMessages(prev => [...prev, { ...newMessage, status: 'sending' }]);
 *   },
 *   rollback: (previousMessages) => {
 *     setMessages(previousMessages);
 *   },
 *   onSuccess: (data) => {
 *     // Update with server response
 *     setMessages(prev => prev.map(m => m.id === data.tempId ? data : m));
 *   },
 * });
 * ```
 */
export function useOptimisticMutation<TData, TVariables, TSnapshot>(options: {
    mutationFn: (variables: TVariables) => Promise<TData>;
    getSnapshot: () => TSnapshot;
    optimisticUpdate: (variables: TVariables) => void;
    rollback: (snapshot: TSnapshot) => void;
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
    onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
    retry?: number | boolean;
}): MutationResult<TData, TVariables, Error> {
    const {
        mutationFn,
        getSnapshot,
        optimisticUpdate,
        rollback,
        onSuccess,
        onError,
        onSettled,
        retry,
    } = options;

    return useMutation<TData, TVariables, Error, { previousSnapshot: TSnapshot }>({
        mutationFn,
        retry,
        onMutate: async (variables) => {
            // Get snapshot before optimistic update
            const previousSnapshot = getSnapshot();

            // Apply optimistic update
            optimisticUpdate(variables);

            return { previousSnapshot };
        },
        onSuccess: (data, variables) => {
            onSuccess?.(data, variables);
        },
        onError: (error, variables, context) => {
            // Rollback on error
            if (context?.previousSnapshot !== undefined) {
                rollback(context.previousSnapshot);
            }
            onError?.(error, variables);
        },
        onSettled: (data, error, variables) => {
            onSettled?.(data, error, variables);
        },
    });
}

export default useMutation;
