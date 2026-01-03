/**
 * Permission Mutations
 *
 * Mutation hooks for permission management including granting,
 * denying, and batch approval of tool permissions.
 *
 * @module mutations/usePermissionMutations
 */

import { useMutation, useOptimisticMutation } from "./useMutation";
import { usePermissionStore } from "../stores/permissionStore";
import { useVSCode } from "../hooks/useVSCode";
import type { PermissionRequest, PermissionDecision } from "../types";
import type {
    GrantPermissionVariables,
    DenyPermissionVariables,
    BatchApproveVariables,
    MutationResult,
} from "./types";

// Alias for permission type
type PendingPermission = PermissionRequest;

// Helper to convert scope to permission decision
function scopeToDecision(scope: "once" | "session" | "always" | undefined): PermissionDecision {
    switch (scope) {
        case "always":
            return "allow_always";
        case "session":
            return "allow_session";
        default:
            return "allow";
    }
}

// ============================================================================
// useGrantPermission
// ============================================================================

/**
 * Mutation hook for granting a permission request
 *
 * @example
 * ```tsx
 * const { mutate: grantPermission, isPending } = useGrantPermission();
 *
 * const handleApprove = (permission: PendingPermission) => {
 *   grantPermission({
 *     toolId: permission.id,
 *     toolName: permission.toolName,
 *     scope: "session",
 *   });
 * };
 * ```
 */
export function useGrantPermission(): MutationResult<void, GrantPermissionVariables, Error> {
    const resolvePending = usePermissionStore((state) => state.resolvePending);
    const addAllowed = usePermissionStore((state) => state.addAllowed);
    const pendingPermissions = usePermissionStore((state) => state.pendingPermissions);
    const { postMessage } = useVSCode();

    return useOptimisticMutation<void, GrantPermissionVariables, PendingPermission[]>({
        mutationFn: async (variables) => {
            const decision = scopeToDecision(variables.scope);

            // Add to allowed permissions if scope permits
            if (variables.scope === "session" || variables.scope === "always") {
                addAllowed({
                    toolName: variables.toolName,
                    scope: variables.scope,
                });
            }

            // Notify extension
            postMessage({
                type: "permissionResponse",
                requestId: variables.toolId,
                decision,
                toolName: variables.toolName,
            });
        },
        getSnapshot: () => [...pendingPermissions],
        optimisticUpdate: (variables) => {
            const decision = scopeToDecision(variables.scope);
            resolvePending(variables.toolId, decision);
        },
        rollback: (previousPermissions) => {
            usePermissionStore.setState({ pendingPermissions: previousPermissions });
        },
        onSuccess: (_data, variables) => {
            console.log("[useGrantPermission] Granted:", variables.toolName);
        },
        onError: (error, variables) => {
            console.error("[useGrantPermission] Failed to grant:", variables.toolName, error);
        },
    });
}

// ============================================================================
// useDenyPermission
// ============================================================================

/**
 * Mutation hook for denying a permission request
 *
 * @example
 * ```tsx
 * const { mutate: denyPermission } = useDenyPermission();
 *
 * const handleDeny = (permission: PendingPermission) => {
 *   denyPermission({
 *     toolId: permission.id,
 *     reason: "Not required for this task",
 *   });
 * };
 * ```
 */
export function useDenyPermission(): MutationResult<void, DenyPermissionVariables, Error> {
    const resolvePending = usePermissionStore((state) => state.resolvePending);
    const pendingPermissions = usePermissionStore((state) => state.pendingPermissions);
    const { postMessage } = useVSCode();

    return useOptimisticMutation<void, DenyPermissionVariables, PendingPermission[]>({
        mutationFn: async (variables) => {
            // Notify extension
            postMessage({
                type: "permissionResponse",
                requestId: variables.toolId,
                decision: "deny",
            });
        },
        getSnapshot: () => [...pendingPermissions],
        optimisticUpdate: (variables) => {
            resolvePending(variables.toolId, "deny");
        },
        rollback: (previousPermissions) => {
            usePermissionStore.setState({ pendingPermissions: previousPermissions });
        },
        onSuccess: (_data, variables) => {
            console.log("[useDenyPermission] Denied:", variables.toolId);
        },
    });
}

// ============================================================================
// useBatchApprovePermissions
// ============================================================================

/**
 * Mutation hook for batch approving multiple permissions
 *
 * @example
 * ```tsx
 * const { mutate: batchApprove, isPending } = useBatchApprovePermissions();
 *
 * const handleApproveAll = () => {
 *   const toolIds = pendingPermissions.map(p => p.id);
 *   batchApprove({ toolIds, scope: "session" });
 * };
 * ```
 */
export function useBatchApprovePermissions(): MutationResult<void, BatchApproveVariables, Error> {
    const resolvePending = usePermissionStore((state) => state.resolvePending);
    const addAllowed = usePermissionStore((state) => state.addAllowed);
    const pendingPermissions = usePermissionStore((state) => state.pendingPermissions);
    const { postMessage } = useVSCode();

    return useOptimisticMutation<void, BatchApproveVariables, PendingPermission[]>({
        mutationFn: async (variables) => {
            const decision = scopeToDecision(variables.scope);

            // Approve all in sequence
            for (const toolId of variables.toolIds) {
                const permission = pendingPermissions.find((p) => p.requestId === toolId);
                if (permission) {
                    // Add to allowed if scope permits
                    if (variables.scope === "session" || variables.scope === "always") {
                        addAllowed({
                            toolName: permission.toolName,
                            scope: variables.scope,
                        });
                    }

                    postMessage({
                        type: "permissionResponse",
                        requestId: toolId,
                        decision,
                        toolName: permission.toolName,
                    });
                }
            }
        },
        getSnapshot: () => [...pendingPermissions],
        optimisticUpdate: (variables) => {
            const decision = scopeToDecision(variables.scope);
            for (const toolId of variables.toolIds) {
                resolvePending(toolId, decision);
            }
        },
        rollback: (previousPermissions) => {
            usePermissionStore.setState({ pendingPermissions: previousPermissions });
        },
        onSuccess: (_data, variables) => {
            console.log(
                "[useBatchApprovePermissions] Approved:",
                variables.toolIds.length,
                "permissions",
            );
        },
    });
}

// ============================================================================
// useClearPermissions
// ============================================================================

/**
 * Mutation hook for clearing all pending permissions
 *
 * @example
 * ```tsx
 * const { mutate: clearPermissions } = useClearPermissions();
 *
 * const handleClearAll = () => {
 *   clearPermissions();
 * };
 * ```
 */
export function useClearPermissions(): MutationResult<void, void, Error> {
    const clearPending = usePermissionStore((state) => state.clearPending);
    const pendingPermissions = usePermissionStore((state) => state.pendingPermissions);

    return useOptimisticMutation<void, void, PendingPermission[]>({
        mutationFn: async () => {},
        getSnapshot: () => [...pendingPermissions],
        optimisticUpdate: () => {
            clearPending();
        },
        rollback: (previousPermissions) => {
            usePermissionStore.setState({ pendingPermissions: previousPermissions });
        },
        onSuccess: () => {
            console.log("[useClearPermissions] Cleared all pending permissions");
        },
    });
}
