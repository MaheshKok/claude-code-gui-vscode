import { describe, it, expect, beforeEach, vi } from "vitest";
import { usePermissionStore, type AllowedPermission } from "../../webview/stores/permissionStore";
import type { PermissionRequest } from "../../webview/types";
import { PermissionStatus } from "../../shared/constants";

describe("permissionStore", () => {
    const mockPermissionRequest: PermissionRequest = {
        requestId: "req-1",
        toolName: "Read",
        input: { file_path: "/path/to/file.txt" },
        status: PermissionStatus.Pending,
        timestamp: Date.now(),
    };

    beforeEach(() => {
        // Reset the store before each test
        usePermissionStore.setState({
            pendingPermissions: [],
            allowedPermissions: [],
            deniedPatterns: [],
        });
    });

    describe("initial state", () => {
        it("should have empty pending permissions", () => {
            expect(usePermissionStore.getState().pendingPermissions).toEqual([]);
        });

        it("should have empty allowed permissions", () => {
            expect(usePermissionStore.getState().allowedPermissions).toEqual([]);
        });

        it("should have empty denied patterns", () => {
            expect(usePermissionStore.getState().deniedPatterns).toEqual([]);
        });
    });

    describe("pending permissions", () => {
        it("should add pending permission", () => {
            usePermissionStore.getState().addPending(mockPermissionRequest);
            expect(usePermissionStore.getState().pendingPermissions.length).toBe(1);
        });

        it("should remove pending permission", () => {
            usePermissionStore.getState().addPending(mockPermissionRequest);
            usePermissionStore.getState().removePending("req-1");
            expect(usePermissionStore.getState().pendingPermissions.length).toBe(0);
        });

        it("should clear all pending permissions", () => {
            usePermissionStore.getState().addPending(mockPermissionRequest);
            usePermissionStore
                .getState()
                .addPending({ ...mockPermissionRequest, requestId: "req-2" });
            usePermissionStore.getState().clearPending();
            expect(usePermissionStore.getState().pendingPermissions.length).toBe(0);
        });

        it("should resolve pending permission with approve", () => {
            usePermissionStore.getState().addPending(mockPermissionRequest);
            usePermissionStore.getState().resolvePending("req-1", "approve");
            const pending = usePermissionStore.getState().pendingPermissions[0];
            expect(pending.status).toBe(PermissionStatus.Approved);
        });

        it("should resolve pending permission with deny", () => {
            usePermissionStore.getState().addPending(mockPermissionRequest);
            usePermissionStore.getState().resolvePending("req-1", "deny");
            const pending = usePermissionStore.getState().pendingPermissions[0];
            expect(pending.status).toBe(PermissionStatus.Denied);
        });

        it("should update pending status", () => {
            usePermissionStore.getState().addPending(mockPermissionRequest);
            usePermissionStore.getState().updatePendingStatus("req-1", PermissionStatus.Approved);
            expect(usePermissionStore.getState().pendingPermissions[0].status).toBe(
                PermissionStatus.Approved,
            );
        });

        it("should get pending by id", () => {
            usePermissionStore.getState().addPending(mockPermissionRequest);
            const pending = usePermissionStore.getState().getPendingById("req-1");
            expect(pending?.requestId).toBe("req-1");
        });

        it("should return undefined for non-existent pending", () => {
            const pending = usePermissionStore.getState().getPendingById("non-existent");
            expect(pending).toBeUndefined();
        });
    });

    describe("allowed permissions", () => {
        it("should add allowed permission", () => {
            usePermissionStore.getState().addAllowed({
                toolName: "Read",
                scope: "always",
            });
            expect(usePermissionStore.getState().allowedPermissions.length).toBe(1);
        });

        it("should add grantedAt timestamp", () => {
            const before = Date.now();
            usePermissionStore.getState().addAllowed({
                toolName: "Read",
                scope: "always",
            });
            const after = Date.now();
            const permission = usePermissionStore.getState().allowedPermissions[0];
            expect(permission.grantedAt).toBeGreaterThanOrEqual(before);
            expect(permission.grantedAt).toBeLessThanOrEqual(after);
        });

        it("should add expiresAt for session scope", () => {
            usePermissionStore.getState().addAllowed({
                toolName: "Read",
                scope: "session",
            });
            const permission = usePermissionStore.getState().allowedPermissions[0];
            expect(permission.expiresAt).toBeDefined();
        });

        it("should not add expiresAt for always scope", () => {
            usePermissionStore.getState().addAllowed({
                toolName: "Read",
                scope: "always",
            });
            const permission = usePermissionStore.getState().allowedPermissions[0];
            expect(permission.expiresAt).toBeUndefined();
        });

        it("should replace existing permission with same tool and pattern", () => {
            usePermissionStore
                .getState()
                .addAllowed({ toolName: "Read", pattern: "/path/*", scope: "once" });
            usePermissionStore
                .getState()
                .addAllowed({ toolName: "Read", pattern: "/path/*", scope: "always" });
            expect(usePermissionStore.getState().allowedPermissions.length).toBe(1);
            expect(usePermissionStore.getState().allowedPermissions[0].scope).toBe("always");
        });

        it("should remove allowed permission", () => {
            usePermissionStore
                .getState()
                .addAllowed({ toolName: "Read", pattern: "/path/*", scope: "always" });
            usePermissionStore.getState().removeAllowed("Read", "/path/*");
            expect(usePermissionStore.getState().allowedPermissions.length).toBe(0);
        });

        it("should clear all allowed permissions", () => {
            usePermissionStore.getState().addAllowed({ toolName: "Read", scope: "always" });
            usePermissionStore.getState().addAllowed({ toolName: "Write", scope: "always" });
            usePermissionStore.getState().clearAllowed();
            expect(usePermissionStore.getState().allowedPermissions.length).toBe(0);
        });

        it("should clear session permissions only", () => {
            usePermissionStore.getState().addAllowed({ toolName: "Read", scope: "always" });
            usePermissionStore.getState().addAllowed({ toolName: "Write", scope: "session" });
            // Make the session permission expired
            const permissions = usePermissionStore.getState().allowedPermissions;
            usePermissionStore.setState({
                allowedPermissions: permissions.map((p) =>
                    p.scope === "session" ? { ...p, expiresAt: Date.now() - 1000 } : p,
                ),
            });
            usePermissionStore.getState().clearSessionPermissions();
            const remaining = usePermissionStore.getState().allowedPermissions;
            expect(remaining.length).toBe(1);
            expect(remaining[0].toolName).toBe("Read");
        });
    });

    describe("denied patterns", () => {
        it("should add denied pattern", () => {
            usePermissionStore.getState().addDeniedPattern("/secret/*");
            expect(usePermissionStore.getState().deniedPatterns).toContain("/secret/*");
        });

        it("should not add duplicate denied pattern", () => {
            usePermissionStore.getState().addDeniedPattern("/secret/*");
            usePermissionStore.getState().addDeniedPattern("/secret/*");
            expect(usePermissionStore.getState().deniedPatterns.length).toBe(1);
        });

        it("should remove denied pattern", () => {
            usePermissionStore.getState().addDeniedPattern("/secret/*");
            usePermissionStore.getState().removeDeniedPattern("/secret/*");
            expect(usePermissionStore.getState().deniedPatterns.length).toBe(0);
        });

        it("should check if pattern is denied", () => {
            usePermissionStore.getState().addDeniedPattern("/secret/**");
            expect(usePermissionStore.getState().isDenied("/secret/file.txt")).toBe(true);
            expect(usePermissionStore.getState().isDenied("/public/file.txt")).toBe(false);
        });
    });

    describe("isAutoAllowed", () => {
        it("should return true for matching tool and no pattern", () => {
            usePermissionStore.getState().addAllowed({ toolName: "Read", scope: "always" });
            expect(usePermissionStore.getState().isAutoAllowed("Read", {})).toBe(true);
        });

        it("should return true for wildcard tool", () => {
            usePermissionStore.getState().addAllowed({ toolName: "*", scope: "always" });
            expect(usePermissionStore.getState().isAutoAllowed("AnyTool", {})).toBe(true);
        });

        it("should return false for non-matching tool", () => {
            usePermissionStore.getState().addAllowed({ toolName: "Read", scope: "always" });
            expect(usePermissionStore.getState().isAutoAllowed("Write", {})).toBe(false);
        });

        it("should check file path pattern", () => {
            usePermissionStore.getState().addAllowed({
                toolName: "Read",
                pattern: "/allowed/**",
                scope: "always",
            });
            expect(
                usePermissionStore
                    .getState()
                    .isAutoAllowed("Read", { file_path: "/allowed/file.txt" }),
            ).toBe(true);
            expect(
                usePermissionStore
                    .getState()
                    .isAutoAllowed("Read", { file_path: "/other/file.txt" }),
            ).toBe(false);
        });

        it("should return false for expired permission", () => {
            usePermissionStore.getState().addAllowed({ toolName: "Read", scope: "session" });
            // Make it expired
            usePermissionStore.setState({
                allowedPermissions: usePermissionStore.getState().allowedPermissions.map((p) => ({
                    ...p,
                    expiresAt: Date.now() - 1000,
                })),
            });
            expect(usePermissionStore.getState().isAutoAllowed("Read", {})).toBe(false);
        });
    });
});
