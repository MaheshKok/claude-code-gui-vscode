/**
 * Permission Store
 *
 * Manages permission requests and allowed permissions for tool usage.
 * Handles pending permission requests and auto-approved permissions.
 *
 * @module stores/permissionStore
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { PermissionRequest, ToolInput } from "../types";
import type { PermissionDecision as PermissionDecisionType } from "../types";
import { PermissionStatus, PermissionDecision, STORAGE_KEYS } from "../../shared/constants";

// ============================================================================
// Types
// ============================================================================

/**
 * Allowed permission record
 */
export interface AllowedPermission {
    /** Tool name */
    toolName: string;
    /** Pattern for matching (e.g., file path glob) */
    pattern?: string;
    /** Permission scope */
    scope: "once" | "session" | "always";
    /** When the permission was granted */
    grantedAt: number;
    /** Expiration timestamp (for session scope) */
    expiresAt?: number;
}

/**
 * Permission store state
 */
export interface PermissionState {
    /** Pending permission requests awaiting user decision */
    pendingPermissions: PermissionRequest[];
    /** Allowed permissions (auto-approved) */
    allowedPermissions: AllowedPermission[];
    /** Denied tool patterns */
    deniedPatterns: string[];
}

/**
 * Permission store actions
 */
export interface PermissionActions {
    /** Add a pending permission request */
    addPending: (request: PermissionRequest) => void;
    /** Resolve a pending permission request */
    resolvePending: (requestId: string, decision: PermissionDecisionType) => void;
    /** Remove a pending permission request without resolving */
    removePending: (requestId: string) => void;
    /** Clear all pending permissions */
    clearPending: () => void;
    /** Add an allowed permission */
    addAllowed: (permission: Omit<AllowedPermission, "grantedAt">) => void;
    /** Remove an allowed permission */
    removeAllowed: (toolName: string, pattern?: string) => void;
    /** Clear all allowed permissions */
    clearAllowed: () => void;
    /** Clear session-scoped allowed permissions */
    clearSessionPermissions: () => void;
    /** Add a denied pattern */
    addDeniedPattern: (pattern: string) => void;
    /** Remove a denied pattern */
    removeDeniedPattern: (pattern: string) => void;
    /** Check if a tool/path combination is auto-allowed */
    isAutoAllowed: (toolName: string, input: ToolInput) => boolean;
    /** Check if a pattern is denied */
    isDenied: (pattern: string) => boolean;
    /** Get pending request by ID */
    getPendingById: (requestId: string) => PermissionRequest | undefined;
    /** Update pending request status */
    updatePendingStatus: (requestId: string, status: PermissionRequest["status"]) => void;
}

export type PermissionStore = PermissionState & PermissionActions;

// ============================================================================
// Initial State
// ============================================================================

const initialState: PermissionState = {
    pendingPermissions: [],
    allowedPermissions: [],
    deniedPatterns: [],
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * Check if a path matches a glob pattern (simplified matching)
 */
const matchesPattern = (path: string, pattern: string): boolean => {
    // Convert glob pattern to regex
    const regexPattern = pattern
        .replace(/\./g, "\\.")
        .replace(/\*\*/g, "{{DOUBLE_STAR}}")
        .replace(/\*/g, "[^/]*")
        .replace(/{{DOUBLE_STAR}}/g, ".*")
        .replace(/\?/g, ".");

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
};

/**
 * Extract file path from tool input
 */
const getFilePath = (input: ToolInput): string | undefined => {
    if (typeof input === "object" && input !== null) {
        return (input as Record<string, unknown>).file_path as string | undefined;
    }
    return undefined;
};

// ============================================================================
// Store
// ============================================================================

/**
 * Permission store for managing tool permissions
 */
export const usePermissionStore = create<PermissionStore>()(
    persist(
        (set, get) => ({
            ...initialState,

            addPending: (request) =>
                set((state) => ({
                    pendingPermissions: [...state.pendingPermissions, request],
                })),

            resolvePending: (requestId, decision) =>
                set((state) => ({
                    pendingPermissions: state.pendingPermissions.map((p) =>
                        p.requestId === requestId
                            ? ({
                                  ...p,
                                  status:
                                      decision === "deny"
                                          ? PermissionStatus.Denied
                                          : PermissionStatus.Approved,
                                  decision,
                              } as PermissionRequest)
                            : p,
                    ),
                })),

            removePending: (requestId) =>
                set((state) => ({
                    pendingPermissions: state.pendingPermissions.filter(
                        (p) => p.requestId !== requestId,
                    ),
                })),

            clearPending: () => set({ pendingPermissions: [] }),

            addAllowed: (permission) => {
                const now = Date.now();
                const newPermission: AllowedPermission = {
                    ...permission,
                    grantedAt: now,
                    expiresAt:
                        permission.scope === "session"
                            ? now + 24 * 60 * 60 * 1000 // 24 hours
                            : undefined,
                };

                set((state) => ({
                    allowedPermissions: [
                        ...state.allowedPermissions.filter(
                            (p) =>
                                !(
                                    p.toolName === permission.toolName &&
                                    p.pattern === permission.pattern
                                ),
                        ),
                        newPermission,
                    ],
                }));
            },

            removeAllowed: (toolName, pattern) =>
                set((state) => ({
                    allowedPermissions: state.allowedPermissions.filter(
                        (p) => !(p.toolName === toolName && p.pattern === pattern),
                    ),
                })),

            clearAllowed: () => set({ allowedPermissions: [] }),

            clearSessionPermissions: () => {
                const now = Date.now();
                set((state) => ({
                    allowedPermissions: state.allowedPermissions.filter(
                        (p) =>
                            p.scope === "always" ||
                            (p.expiresAt !== undefined && p.expiresAt > now),
                    ),
                }));
            },

            addDeniedPattern: (pattern) =>
                set((state) => ({
                    deniedPatterns: state.deniedPatterns.includes(pattern)
                        ? state.deniedPatterns
                        : [...state.deniedPatterns, pattern],
                })),

            removeDeniedPattern: (pattern) =>
                set((state) => ({
                    deniedPatterns: state.deniedPatterns.filter((p) => p !== pattern),
                })),

            isAutoAllowed: (toolName, input) => {
                const state = get();
                const now = Date.now();
                const filePath = getFilePath(input);

                return state.allowedPermissions.some((p) => {
                    // Check if permission is expired
                    if (p.expiresAt !== undefined && p.expiresAt < now) {
                        return false;
                    }

                    // Check tool name match
                    if (p.toolName !== toolName && p.toolName !== "*") {
                        return false;
                    }

                    // If no pattern specified, allow all
                    if (!p.pattern) {
                        return true;
                    }

                    // Check path pattern match
                    if (filePath) {
                        return matchesPattern(filePath, p.pattern);
                    }

                    return false;
                });
            },

            isDenied: (pattern) => {
                const state = get();
                return state.deniedPatterns.some((p) => matchesPattern(pattern, p));
            },

            getPendingById: (requestId) => {
                const state = get();
                return state.pendingPermissions.find((p) => p.requestId === requestId);
            },

            updatePendingStatus: (requestId, status) =>
                set((state) => ({
                    pendingPermissions: state.pendingPermissions.map((p) =>
                        p.requestId === requestId ? { ...p, status } : p,
                    ),
                })),
        }),
        {
            name: STORAGE_KEYS.PERMISSION_STORE,
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                // Only persist 'always' scoped permissions
                allowedPermissions: state.allowedPermissions.filter((p) => p.scope === "always"),
                deniedPatterns: state.deniedPatterns,
            }),
        },
    ),
);

// ============================================================================
// Selectors
// ============================================================================

/**
 * Select pending permissions
 */
export const selectPendingPermissions = (state: PermissionStore) => state.pendingPermissions;

/**
 * Select allowed permissions
 */
export const selectAllowedPermissions = (state: PermissionStore) => state.allowedPermissions;

/**
 * Select denied patterns
 */
export const selectDeniedPatterns = (state: PermissionStore) => state.deniedPatterns;

/**
 * Select pending count
 */
export const selectPendingCount = (state: PermissionStore) =>
    state.pendingPermissions.filter((p) => p.status === PermissionStatus.Pending).length;

/**
 * Select first pending permission
 */
export const selectFirstPending = (state: PermissionStore) =>
    state.pendingPermissions.find((p) => p.status === PermissionStatus.Pending);

/**
 * Select permissions for a specific tool
 */
export const selectPermissionsForTool = (toolName: string) => (state: PermissionStore) =>
    state.allowedPermissions.filter((p) => p.toolName === toolName);
