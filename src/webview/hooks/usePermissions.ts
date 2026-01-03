/**
 * Permission Handling Hook
 *
 * Provides permission request management for tool operations,
 * including response handling and tool access control.
 *
 * @module hooks/usePermissions
 */

import { useState, useCallback, useMemo } from "react";
import { useVSCode } from "./useVSCode";
import { useMessages } from "./useMessages";
import type { PermissionRequest, PermissionRequestStatus } from "../types/messages";
import type { PermissionDecision, PermissionSuggestion } from "../types/claude-events";

// ============================================================================
// Types
// ============================================================================

/**
 * Tool permission configuration
 */
export interface ToolPermissionConfig {
    /** Tool name */
    toolName: string;
    /** Whether the tool is auto-approved */
    autoApprove: boolean;
    /** Whether the tool is always denied */
    alwaysDeny: boolean;
    /** Patterns for auto-approve (e.g., file paths) */
    autoApprovePatterns?: string[];
}

/**
 * Options for usePermissions hook
 */
export interface UsePermissionsOptions {
    /** Whether permission handling is enabled */
    enabled?: boolean;
    /** Tool configurations */
    toolConfigs?: ToolPermissionConfig[];
    /** Default timeout for permission requests (ms) */
    defaultTimeout?: number;
    /** Callback when permission is requested */
    onPermissionRequest?: (request: PermissionRequest) => void;
    /** Callback when permission is resolved */
    onPermissionResolved?: (request: PermissionRequest, decision: PermissionDecision) => void;
    /** Callback when permission expires */
    onPermissionExpired?: (request: PermissionRequest) => void;
}

/**
 * Return type for usePermissions hook
 */
export interface UsePermissionsReturn {
    /** Current pending permission request */
    currentRequest: PermissionRequest | null;
    /** All pending permission requests */
    pendingRequests: PermissionRequest[];
    /** Respond to a permission request */
    respondToPermission: (requestId: string, decision: PermissionDecision) => void;
    /** Approve current request */
    approveCurrentRequest: () => void;
    /** Deny current request */
    denyCurrentRequest: () => void;
    /** Approve with specific suggestion */
    approveWithSuggestion: (suggestion: PermissionSuggestion) => void;
    /** Check if a tool is allowed */
    isToolAllowed: (toolName: string) => boolean;
    /** Check if a tool is auto-approved */
    isToolAutoApproved: (toolName: string) => boolean;
    /** Check if a tool is always denied */
    isToolDenied: (toolName: string) => boolean;
    /** Get permission history */
    getPermissionHistory: () => PermissionRequest[];
    /** Clear permission history */
    clearPermissionHistory: () => void;
    /** Whether there are pending permissions */
    hasPendingPermissions: boolean;
    /** Number of pending permissions */
    pendingCount: number;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for handling permission requests
 *
 * @example
 * ```tsx
 * function PermissionDialog() {
 *   const {
 *     currentRequest,
 *     approveCurrentRequest,
 *     denyCurrentRequest,
 *     approveWithSuggestion,
 *     hasPendingPermissions,
 *   } = usePermissions({
 *     onPermissionRequest: (req) => console.log('Permission requested:', req.toolName),
 *     onPermissionResolved: (req, decision) => {
 *       console.log(`Permission ${decision} for ${req.toolName}`);
 *     },
 *   });
 *
 *   if (!hasPendingPermissions || !currentRequest) {
 *     return null;
 *   }
 *
 *   return (
 *     <div className="permission-dialog">
 *       <h3>{currentRequest.toolName}</h3>
 *       <p>{currentRequest.description}</p>
 *       <div className="suggestions">
 *         {currentRequest.suggestions.map((suggestion) => (
 *           <button
 *             key={suggestion.type}
 *             onClick={() => approveWithSuggestion(suggestion)}
 *           >
 *             {suggestion.description}
 *           </button>
 *         ))}
 *       </div>
 *       <div className="actions">
 *         <button onClick={approveCurrentRequest}>Approve</button>
 *         <button onClick={denyCurrentRequest}>Deny</button>
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePermissions(options: UsePermissionsOptions = {}): UsePermissionsReturn {
    const {
        enabled = true,
        toolConfigs = [],
        defaultTimeout = 60000,
        onPermissionRequest,
        onPermissionResolved,
        onPermissionExpired,
    } = options;

    const { postMessage } = useVSCode();

    const [pendingRequests, setPendingRequests] = useState<PermissionRequest[]>([]);
    const [permissionHistory, setPermissionHistory] = useState<PermissionRequest[]>([]);

    /**
     * Tool configuration lookup
     */
    const toolConfigMap = useMemo(() => {
        const map = new Map<string, ToolPermissionConfig>();
        for (const config of toolConfigs) {
            map.set(config.toolName, config);
        }
        return map;
    }, [toolConfigs]);

    /**
     * Handle incoming permission requests from extension
     */
    useMessages({
        enabled,
        handlers: {
            permissionRequest: (message) => {
                const request: PermissionRequest = {
                    requestId: message.requestId,
                    toolUseId: message.toolUseId,
                    toolName: message.toolName,
                    input: message.input,
                    description: message.description,
                    suggestions: message.suggestions,
                    decisionReason: message.decisionReason,
                    blockedPath: message.blockedPath,
                    timestamp: Date.now(),
                    status: "pending" as PermissionRequestStatus,
                };

                // Check for auto-approve/deny
                const config = toolConfigMap.get(request.toolName);
                if (config?.alwaysDeny) {
                    respondToPermission(request.requestId, "deny");
                    return;
                }
                if (config?.autoApprove) {
                    respondToPermission(request.requestId, "allow");
                    return;
                }

                setPendingRequests((prev) => [...prev, request]);
                onPermissionRequest?.(request);

                // Set up timeout
                if (defaultTimeout > 0) {
                    setTimeout(() => {
                        setPendingRequests((prev) => {
                            const request = prev.find((r) => r.requestId === message.requestId);
                            if (request && request.status === "pending") {
                                const expiredRequest = {
                                    ...request,
                                    status: "expired" as PermissionRequestStatus,
                                };
                                onPermissionExpired?.(expiredRequest);
                                return prev.filter((r) => r.requestId !== message.requestId);
                            }
                            return prev;
                        });
                    }, defaultTimeout);
                }
            },
        },
    });

    /**
     * Get current (first) pending request
     */
    const currentRequest = useMemo((): PermissionRequest | null => {
        return pendingRequests[0] ?? null;
    }, [pendingRequests]);

    /**
     * Respond to a permission request
     */
    const respondToPermission = useCallback(
        (requestId: string, decision: PermissionDecision): void => {
            // Find and update the request
            const request = pendingRequests.find((r) => r.requestId === requestId);
            if (!request) {
                return;
            }

            const updatedRequest: PermissionRequest = {
                ...request,
                status: decision === "deny" ? "denied" : "approved",
                decision,
            };

            // Send response to extension
            postMessage({
                type: "permissionResponse",
                requestId,
                decision,
                toolName: request.toolName,
                input: request.input,
            });

            // Remove from pending and add to history
            setPendingRequests((prev) => prev.filter((r) => r.requestId !== requestId));
            setPermissionHistory((prev) => [...prev, updatedRequest]);

            onPermissionResolved?.(updatedRequest, decision);
        },
        [pendingRequests, postMessage, onPermissionResolved],
    );

    /**
     * Approve current request
     */
    const approveCurrentRequest = useCallback((): void => {
        if (currentRequest) {
            respondToPermission(currentRequest.requestId, "allow");
        }
    }, [currentRequest, respondToPermission]);

    /**
     * Deny current request
     */
    const denyCurrentRequest = useCallback((): void => {
        if (currentRequest) {
            respondToPermission(currentRequest.requestId, "deny");
        }
    }, [currentRequest, respondToPermission]);

    /**
     * Approve with a specific suggestion
     */
    const approveWithSuggestion = useCallback(
        (suggestion: PermissionSuggestion): void => {
            if (currentRequest) {
                // Map suggestion type to permission decision
                const decisionMap: Record<string, PermissionDecision> = {
                    allow: "allow",
                    allow_always: "allow_always",
                    allow_all: "allow",
                    deny: "deny",
                    explain: "deny",
                };

                const decision = decisionMap[suggestion.type] || "allow";
                respondToPermission(currentRequest.requestId, decision);
            }
        },
        [currentRequest, respondToPermission],
    );

    /**
     * Check if a tool is allowed (not always denied)
     */
    const isToolAllowed = useCallback(
        (toolName: string): boolean => {
            const config = toolConfigMap.get(toolName);
            return !config?.alwaysDeny;
        },
        [toolConfigMap],
    );

    /**
     * Check if a tool is auto-approved
     */
    const isToolAutoApproved = useCallback(
        (toolName: string): boolean => {
            const config = toolConfigMap.get(toolName);
            return config?.autoApprove ?? false;
        },
        [toolConfigMap],
    );

    /**
     * Check if a tool is always denied
     */
    const isToolDenied = useCallback(
        (toolName: string): boolean => {
            const config = toolConfigMap.get(toolName);
            return config?.alwaysDeny ?? false;
        },
        [toolConfigMap],
    );

    /**
     * Get permission history
     */
    const getPermissionHistory = useCallback((): PermissionRequest[] => {
        return [...permissionHistory];
    }, [permissionHistory]);

    /**
     * Clear permission history
     */
    const clearPermissionHistory = useCallback((): void => {
        setPermissionHistory([]);
    }, []);

    return {
        currentRequest,
        pendingRequests,
        respondToPermission,
        approveCurrentRequest,
        denyCurrentRequest,
        approveWithSuggestion,
        isToolAllowed,
        isToolAutoApproved,
        isToolDenied,
        getPermissionHistory,
        clearPermissionHistory,
        hasPendingPermissions: pendingRequests.length > 0,
        pendingCount: pendingRequests.length,
    };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get display name for a permission decision
 */
export function getDecisionDisplayName(decision: PermissionDecision): string {
    const displayNames: Record<string, string> = {
        allow: "Allow once",
        allow_always: "Always allow",
        allow_session: "Allow this session",
        deny: "Deny",
    };
    return displayNames[decision] || decision;
}

/**
 * Get color/style class for a permission decision
 */
export function getDecisionStyleClass(decision: PermissionDecision): string {
    switch (decision) {
        case "allow":
        case "allow_always":
            return "permission-approved";
        case "deny":
            return "permission-denied";
        default:
            return "permission-pending";
    }
}

/**
 * Format permission request for display
 */
export function formatPermissionRequest(request: PermissionRequest): string {
    const toolName = request.toolName;
    const description = request.description || "No description provided";
    return `${toolName}: ${description}`;
}

/**
 * Check if a path matches any of the given patterns
 */
export function matchesPattern(path: string, patterns: string[]): boolean {
    for (const pattern of patterns) {
        // Simple glob matching (supports * and **)
        const regex = new RegExp(
            "^" + pattern.replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*").replace(/\?/g, ".") + "$",
        );
        if (regex.test(path)) {
            return true;
        }
    }
    return false;
}
