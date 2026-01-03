/**
 * Mutation Status Component
 *
 * Displays the status of mutations with loading, success, and error states.
 * Provides visual feedback for optimistic updates and error handling.
 *
 * @module components/Common/MutationStatus
 */

import React from "react";
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import type { MutationStatus as MutationStatusType } from "../../mutations/types";

// ============================================================================
// Types
// ============================================================================

interface MutationStatusProps {
    /** Current status of the mutation */
    status: MutationStatusType;
    /** Error message to display */
    error?: Error | null;
    /** Custom loading message */
    loadingMessage?: string;
    /** Custom success message */
    successMessage?: string;
    /** Custom error message */
    errorMessage?: string;
    /** Whether to show the status inline */
    inline?: boolean;
    /** Whether to auto-hide success state after delay */
    autoHideSuccess?: boolean;
    /** Delay in ms before hiding success state */
    autoHideDelay?: number;
    /** Callback when error is dismissed */
    onDismissError?: () => void;
    /** Show retry button on error */
    showRetry?: boolean;
    /** Retry callback */
    onRetry?: () => void;
    /** Additional CSS classes */
    className?: string;
}

interface MutationStatusBadgeProps {
    /** Current status */
    status: MutationStatusType;
    /** Size variant */
    size?: "sm" | "md" | "lg";
    /** Additional CSS classes */
    className?: string;
}

interface MutationErrorProps {
    /** Error object */
    error: Error;
    /** Custom error message */
    message?: string;
    /** Dismiss callback */
    onDismiss?: () => void;
    /** Retry callback */
    onRetry?: () => void;
    /** Additional CSS classes */
    className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getStatusConfig(status: MutationStatusType) {
    switch (status) {
        case "pending":
            return {
                icon: Loader2,
                color: "text-blue-500",
                bgColor: "bg-blue-50",
                borderColor: "border-blue-200",
                label: "Loading",
                animate: true,
            };
        case "success":
            return {
                icon: CheckCircle,
                color: "text-green-500",
                bgColor: "bg-green-50",
                borderColor: "border-green-200",
                label: "Success",
                animate: false,
            };
        case "error":
            return {
                icon: XCircle,
                color: "text-red-500",
                bgColor: "bg-red-50",
                borderColor: "border-red-200",
                label: "Error",
                animate: false,
            };
        default:
            return {
                icon: null,
                color: "text-gray-500",
                bgColor: "bg-gray-50",
                borderColor: "border-gray-200",
                label: "Idle",
                animate: false,
            };
    }
}

// ============================================================================
// MutationStatus Component
// ============================================================================

/**
 * Main mutation status display component
 *
 * @example
 * ```tsx
 * const { status, error } = useSendMessage();
 *
 * <MutationStatus
 *   status={status}
 *   error={error}
 *   loadingMessage="Sending message..."
 *   successMessage="Message sent!"
 * />
 * ```
 */
export function MutationStatus({
    status,
    error,
    loadingMessage = "Processing...",
    successMessage = "Done!",
    errorMessage,
    inline = false,
    autoHideSuccess = true,
    autoHideDelay = 2000,
    onDismissError,
    showRetry = false,
    onRetry,
    className = "",
}: MutationStatusProps) {
    const [visible, setVisible] = React.useState(true);
    const config = getStatusConfig(status);

    // Auto-hide success state
    React.useEffect(() => {
        if (status === "success" && autoHideSuccess) {
            const timer = setTimeout(() => {
                setVisible(false);
            }, autoHideDelay);
            return () => clearTimeout(timer);
        }
        setVisible(true);
    }, [status, autoHideSuccess, autoHideDelay]);

    // Don't render if idle or hidden
    if (status === "idle" || !visible) {
        return null;
    }

    const Icon = config.icon;
    const message =
        status === "pending"
            ? loadingMessage
            : status === "success"
              ? successMessage
              : errorMessage || error?.message || "An error occurred";

    if (inline) {
        return (
            <span className={`inline-flex items-center gap-1 text-sm ${config.color} ${className}`}>
                {Icon && <Icon size={14} className={config.animate ? "animate-spin" : ""} />}
                <span>{message}</span>
            </span>
        );
    }

    return (
        <div
            className={`flex items-center gap-2 px-3 py-2 rounded-md border ${config.bgColor} ${config.borderColor} ${className}`}
        >
            {Icon && (
                <Icon
                    size={16}
                    className={`${config.color} ${config.animate ? "animate-spin" : ""}`}
                />
            )}
            <span className={`text-sm ${config.color}`}>{message}</span>
            {status === "error" && (
                <div className="ml-auto flex items-center gap-2">
                    {showRetry && onRetry && (
                        <button
                            onClick={onRetry}
                            className="text-xs text-red-600 hover:text-red-800 underline"
                        >
                            Retry
                        </button>
                    )}
                    {onDismissError && (
                        <button
                            onClick={onDismissError}
                            className="text-red-400 hover:text-red-600"
                        >
                            <XCircle size={14} />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// ============================================================================
// MutationStatusBadge Component
// ============================================================================

/**
 * Compact badge showing mutation status
 *
 * @example
 * ```tsx
 * <MutationStatusBadge status={status} size="sm" />
 * ```
 */
export function MutationStatusBadge({
    status,
    size = "md",
    className = "",
}: MutationStatusBadgeProps) {
    const config = getStatusConfig(status);
    const Icon = config.icon;

    if (!Icon || status === "idle") {
        return null;
    }

    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-5 h-5",
        lg: "w-6 h-6",
    };

    const iconSize = {
        sm: 12,
        md: 16,
        lg: 20,
    };

    return (
        <div
            className={`inline-flex items-center justify-center rounded-full ${config.bgColor} ${sizeClasses[size]} ${className}`}
        >
            <Icon
                size={iconSize[size]}
                className={`${config.color} ${config.animate ? "animate-spin" : ""}`}
            />
        </div>
    );
}

// ============================================================================
// MutationError Component
// ============================================================================

/**
 * Error display component for mutations
 *
 * @example
 * ```tsx
 * {error && (
 *   <MutationError
 *     error={error}
 *     onDismiss={() => reset()}
 *     onRetry={() => mutate(lastVariables)}
 *   />
 * )}
 * ```
 */
export function MutationError({
    error,
    message,
    onDismiss,
    onRetry,
    className = "",
}: MutationErrorProps) {
    return (
        <div
            className={`flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200 ${className}`}
        >
            <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
            <div className="flex-1">
                <p className="text-sm font-medium text-red-800">{message || "An error occurred"}</p>
                <p className="text-xs text-red-600 mt-1">{error.message}</p>
                <div className="flex items-center gap-2 mt-3">
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="px-3 py-1 text-xs font-medium text-white bg-red-500 rounded hover:bg-red-600 transition-colors"
                        >
                            Try Again
                        </button>
                    )}
                    {onDismiss && (
                        <button
                            onClick={onDismiss}
                            className="px-3 py-1 text-xs font-medium text-red-600 hover:text-red-800 transition-colors"
                        >
                            Dismiss
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// MutationLoader Component
// ============================================================================

/**
 * Simple loading indicator for mutations
 */
export function MutationLoader({
    message = "Loading...",
    className = "",
}: {
    message?: string;
    className?: string;
}) {
    return (
        <div className={`flex items-center gap-2 text-sm text-gray-500 ${className}`}>
            <Loader2 size={14} className="animate-spin" />
            <span>{message}</span>
        </div>
    );
}

// ============================================================================
// withMutationStatus HOC
// ============================================================================

/**
 * Higher-order component to wrap content with mutation status
 */
export function withMutationStatus<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    statusProps: Omit<MutationStatusProps, "status" | "error">,
) {
    return function WithMutationStatus(
        props: P & { mutationStatus: MutationStatusType; mutationError?: Error | null },
    ) {
        const { mutationStatus, mutationError, ...restProps } = props;

        return (
            <>
                <WrappedComponent {...(restProps as P)} />
                <MutationStatus status={mutationStatus} error={mutationError} {...statusProps} />
            </>
        );
    };
}

export default MutationStatus;
