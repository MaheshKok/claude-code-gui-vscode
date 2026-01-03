/**
 * Mutation Types
 *
 * Core type definitions for the mutation system.
 * Provides type-safe mutations with optimistic updates, error handling, and rollback.
 *
 * @module mutations/types
 */

// ============================================================================
// Mutation Status
// ============================================================================

/**
 * Possible states of a mutation
 */
export type MutationStatus = "idle" | "pending" | "success" | "error";

/**
 * Mutation state containing status and metadata
 */
export interface MutationState<TData = unknown, TError = Error> {
    /** Current status of the mutation */
    status: MutationStatus;
    /** Data returned from a successful mutation */
    data: TData | null;
    /** Error from a failed mutation */
    error: TError | null;
    /** Whether the mutation is currently pending */
    isPending: boolean;
    /** Whether the mutation completed successfully */
    isSuccess: boolean;
    /** Whether the mutation failed */
    isError: boolean;
    /** Whether the mutation is in idle state */
    isIdle: boolean;
    /** Timestamp of when the mutation started */
    startedAt: number | null;
    /** Timestamp of when the mutation completed */
    completedAt: number | null;
    /** Number of times the mutation has been attempted */
    attemptCount: number;
}

// ============================================================================
// Mutation Options
// ============================================================================

/**
 * Options for configuring a mutation
 */
export interface MutationOptions<TData, TVariables, TError = Error, TContext = unknown> {
    /** Function to execute the mutation */
    mutationFn: (variables: TVariables) => Promise<TData>;

    /** Called before the mutation executes - return context for rollback */
    onMutate?: (variables: TVariables) => Promise<TContext> | TContext;

    /** Called when mutation succeeds */
    onSuccess?: (data: TData, variables: TVariables, context: TContext) => void | Promise<void>;

    /** Called when mutation fails */
    onError?: (
        error: TError,
        variables: TVariables,
        context: TContext | undefined,
    ) => void | Promise<void>;

    /** Called when mutation settles (success or error) */
    onSettled?: (
        data: TData | undefined,
        error: TError | null,
        variables: TVariables,
        context: TContext | undefined,
    ) => void | Promise<void>;

    /** Number of retry attempts on failure */
    retry?: number | boolean | ((failureCount: number, error: TError) => boolean);

    /** Delay between retries in ms */
    retryDelay?: number | ((attemptIndex: number, error: TError) => number);

    /** Whether to enable optimistic updates */
    optimistic?: boolean;

    /** Unique key to identify this mutation for deduplication */
    mutationKey?: string[];
}

// ============================================================================
// Mutation Result
// ============================================================================

/**
 * Result returned from useMutation hook
 */
export interface MutationResult<TData, TVariables, TError = Error> extends MutationState<
    TData,
    TError
> {
    /** Execute the mutation with variables */
    mutate: (variables: TVariables) => void;

    /** Execute the mutation and return a promise */
    mutateAsync: (variables: TVariables) => Promise<TData>;

    /** Reset the mutation state to idle */
    reset: () => void;

    /** Variables from the last mutation call */
    variables: TVariables | undefined;
}

// ============================================================================
// Optimistic Update Types
// ============================================================================

/**
 * Context for optimistic updates with rollback support
 */
export interface OptimisticContext<TSnapshot = unknown> {
    /** Previous state snapshot for rollback */
    previousState: TSnapshot;
    /** Timestamp of optimistic update */
    timestamp: number;
    /** Unique ID for this optimistic update */
    id: string;
}

/**
 * Options for optimistic mutations
 */
export interface OptimisticMutationOptions<TData, TVariables, TSnapshot = unknown> extends Omit<
    MutationOptions<TData, TVariables, Error, OptimisticContext<TSnapshot>>,
    "onMutate"
> {
    /** Get current state snapshot for rollback */
    getSnapshot: () => TSnapshot;

    /** Apply optimistic update before mutation */
    optimisticUpdate: (variables: TVariables) => void;

    /** Rollback to previous state on error */
    rollback: (snapshot: TSnapshot) => void;
}

// ============================================================================
// Mutation Store Types
// ============================================================================

/**
 * Entry in the mutation cache
 */
export interface MutationCacheEntry<TData = unknown, TVariables = unknown> {
    /** Mutation key */
    key: string[];
    /** Current state */
    state: MutationState<TData>;
    /** Variables used */
    variables?: TVariables;
    /** Metadata */
    meta?: Record<string, unknown>;
}

/**
 * Mutation cache for tracking all mutations
 */
export interface MutationCache {
    /** Get all mutations */
    getAll: () => MutationCacheEntry[];

    /** Get mutations by key */
    find: (key: string[]) => MutationCacheEntry | undefined;

    /** Add a mutation entry */
    add: (entry: MutationCacheEntry) => void;

    /** Remove a mutation entry */
    remove: (key: string[]) => void;

    /** Clear all mutations */
    clear: () => void;

    /** Subscribe to cache changes */
    subscribe: (callback: () => void) => () => void;
}

// ============================================================================
// Specific Mutation Types
// ============================================================================

/**
 * Chat mutation variables
 */
export interface SendMessageVariables {
    content: string;
    attachments?: string[];
    contextFiles?: string[];
    messageId?: string;
}

export interface UpdateMessageVariables {
    id: string;
    updates: {
        content?: string;
        status?: string;
    };
}

export interface DeleteMessageVariables {
    id: string;
}

/**
 * Conversation mutation variables
 */
export interface SaveConversationVariables {
    title?: string;
    messages: unknown[];
}

export interface UpdateConversationVariables {
    id: string;
    title?: string;
    messages?: unknown[];
    tags?: string[];
}

export interface DeleteConversationVariables {
    id: string;
}

export interface ImportConversationVariables {
    json: string;
}

/**
 * Settings mutation variables
 */
export interface UpdateModelVariables {
    model: string;
}

export interface UpdateThinkingVariables {
    enabled?: boolean;
    intensity?: string;
    showProcess?: boolean;
}

export interface UpdateWSLVariables {
    enabled?: boolean;
    distro?: string;
    nodePath?: string;
    claudePath?: string;
}

/**
 * Permission mutation variables
 */
export interface GrantPermissionVariables {
    toolId: string;
    toolName: string;
    scope?: "once" | "session" | "always";
}

export interface DenyPermissionVariables {
    toolId: string;
    reason?: string;
}

export interface BatchApproveVariables {
    toolIds: string[];
    scope: "once" | "session" | "always";
}

// ============================================================================
// Mutation Response Types
// ============================================================================

/**
 * Standard mutation response
 */
export interface MutationResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: number;
}

/**
 * Batch mutation response
 */
export interface BatchMutationResponse<T = unknown> {
    success: boolean;
    results: Array<{
        id: string;
        success: boolean;
        data?: T;
        error?: string;
    }>;
    totalSucceeded: number;
    totalFailed: number;
    timestamp: number;
}
