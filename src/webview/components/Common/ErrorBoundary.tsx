import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
    children: ReactNode;
    /** Fallback UI to render when an error occurs */
    fallback?: ReactNode;
    /** Optional callback when error occurs */
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    /** Component name for logging */
    componentName?: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Error boundary component to catch and handle React rendering errors gracefully.
 * Prevents the entire UI from crashing when a child component fails.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        const { onError, componentName } = this.props;

        console.error(
            `[ErrorBoundary${componentName ? `:${componentName}` : ""}] Caught error:`,
            error,
            errorInfo,
        );

        this.setState({ errorInfo });

        if (onError) {
            onError(error, errorInfo);
        }
    }

    handleRetry = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render(): ReactNode {
        const { hasError, error } = this.state;
        const { children, fallback, componentName } = this.props;

        if (hasError) {
            if (fallback) {
                return fallback;
            }

            return (
                <div className="glass-panel rounded-lg p-4 border border-red-500/20 bg-red-500/5">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 p-2 rounded-lg bg-red-500/10">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-red-200 mb-1">
                                {componentName
                                    ? `Error in ${componentName}`
                                    : "Something went wrong"}
                            </h3>
                            <p className="text-xs text-white/50 mb-3">
                                {error?.message ||
                                    "An unexpected error occurred while rendering this component."}
                            </p>
                            <button
                                onClick={this.handleRetry}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border border-white/10"
                            >
                                <RefreshCw className="w-3 h-3" />
                                Try again
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return children;
    }
}

/**
 * Higher-order component to wrap a component with an error boundary
 */
export function withErrorBoundary<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    componentName?: string,
): React.FC<P> {
    const WithErrorBoundary: React.FC<P> = (props) => (
        <ErrorBoundary componentName={componentName}>
            <WrappedComponent {...props} />
        </ErrorBoundary>
    );

    WithErrorBoundary.displayName = `withErrorBoundary(${componentName || WrappedComponent.displayName || WrappedComponent.name || "Component"})`;

    return WithErrorBoundary;
}

export default ErrorBoundary;
