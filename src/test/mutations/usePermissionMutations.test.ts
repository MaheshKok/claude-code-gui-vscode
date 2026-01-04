import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import {
    useGrantPermission,
    useDenyPermission,
    useBatchApprovePermissions,
    useClearPermissions,
} from "../../webview/mutations/usePermissionMutations";
import { usePermissionStore } from "../../webview/stores/permissionStore";
import { PermissionStatus } from "../../shared/constants";
import type { PermissionRequest } from "../../webview/types";

// Mock useVSCode hook
vi.mock("../../webview/hooks/useVSCode", () => ({
    useVSCode: () => ({
        postMessage: vi.fn(),
    }),
}));

describe("usePermissionMutations", () => {
    const createMockPermission = (id: string, toolName: string): PermissionRequest => ({
        requestId: id,
        toolName,
        input: { file_path: "/test.txt" },
        status: PermissionStatus.Pending,
        timestamp: Date.now(),
    });

    beforeEach(() => {
        vi.clearAllMocks();
        usePermissionStore.setState({
            pendingPermissions: [],
            allowedPermissions: [],
            deniedPatterns: [],
        });
    });

    describe("useGrantPermission", () => {
        it("should grant permission with once scope", async () => {
            const permission = createMockPermission("req-1", "Read");
            usePermissionStore.getState().addPending(permission);

            const { result } = renderHook(() => useGrantPermission());

            await act(async () => {
                result.current.mutate({ toolId: "req-1", toolName: "Read", scope: "once" });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            // With 'once' scope, permission should be resolved but not added to allowed
            expect(usePermissionStore.getState().pendingPermissions[0].status).toBe(
                PermissionStatus.Approved,
            );
            expect(usePermissionStore.getState().allowedPermissions.length).toBe(0);
        });

        it("should grant permission with session scope", async () => {
            const permission = createMockPermission("req-1", "Read");
            usePermissionStore.getState().addPending(permission);

            const { result } = renderHook(() => useGrantPermission());

            await act(async () => {
                result.current.mutate({ toolId: "req-1", toolName: "Read", scope: "session" });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            // With 'session' scope, permission should be added to allowed
            expect(usePermissionStore.getState().allowedPermissions.length).toBe(1);
            expect(usePermissionStore.getState().allowedPermissions[0].scope).toBe("session");
        });

        it("should grant permission with always scope", async () => {
            const permission = createMockPermission("req-1", "Read");
            usePermissionStore.getState().addPending(permission);

            const { result } = renderHook(() => useGrantPermission());

            await act(async () => {
                result.current.mutate({ toolId: "req-1", toolName: "Read", scope: "always" });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(usePermissionStore.getState().allowedPermissions.length).toBe(1);
            expect(usePermissionStore.getState().allowedPermissions[0].scope).toBe("always");
        });
    });

    describe("useDenyPermission", () => {
        it("should deny permission", async () => {
            const permission = createMockPermission("req-1", "Write");
            usePermissionStore.getState().addPending(permission);

            const { result } = renderHook(() => useDenyPermission());

            await act(async () => {
                result.current.mutate({ toolId: "req-1", reason: "Not needed" });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(usePermissionStore.getState().pendingPermissions[0].status).toBe(
                PermissionStatus.Denied,
            );
        });

        it("should deny permission without reason", async () => {
            const permission = createMockPermission("req-1", "Write");
            usePermissionStore.getState().addPending(permission);

            const { result } = renderHook(() => useDenyPermission());

            await act(async () => {
                result.current.mutate({ toolId: "req-1" });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(usePermissionStore.getState().pendingPermissions[0].status).toBe(
                PermissionStatus.Denied,
            );
        });
    });

    describe("useBatchApprovePermissions", () => {
        it("should approve multiple permissions", async () => {
            const permission1 = createMockPermission("req-1", "Read");
            const permission2 = createMockPermission("req-2", "Write");
            const permission3 = createMockPermission("req-3", "Bash");
            usePermissionStore.getState().addPending(permission1);
            usePermissionStore.getState().addPending(permission2);
            usePermissionStore.getState().addPending(permission3);

            const { result } = renderHook(() => useBatchApprovePermissions());

            await act(async () => {
                result.current.mutate({
                    toolIds: ["req-1", "req-2", "req-3"],
                    scope: "session",
                });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            const pending = usePermissionStore.getState().pendingPermissions;
            expect(pending.every((p) => p.status === PermissionStatus.Approved)).toBe(true);
        });

        it("should add all to allowed with session scope", async () => {
            const permission1 = createMockPermission("req-1", "Read");
            const permission2 = createMockPermission("req-2", "Write");
            usePermissionStore.getState().addPending(permission1);
            usePermissionStore.getState().addPending(permission2);

            const { result } = renderHook(() => useBatchApprovePermissions());

            await act(async () => {
                result.current.mutate({
                    toolIds: ["req-1", "req-2"],
                    scope: "always",
                });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(usePermissionStore.getState().allowedPermissions.length).toBe(2);
        });

        it("should handle empty toolIds array", async () => {
            const { result } = renderHook(() => useBatchApprovePermissions());

            await act(async () => {
                result.current.mutate({ toolIds: [], scope: "once" });
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });
        });
    });

    describe("useClearPermissions", () => {
        it("should clear all pending permissions", async () => {
            const permission1 = createMockPermission("req-1", "Read");
            const permission2 = createMockPermission("req-2", "Write");
            usePermissionStore.getState().addPending(permission1);
            usePermissionStore.getState().addPending(permission2);
            expect(usePermissionStore.getState().pendingPermissions.length).toBe(2);

            const { result } = renderHook(() => useClearPermissions());

            await act(async () => {
                result.current.mutate();
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(usePermissionStore.getState().pendingPermissions.length).toBe(0);
        });

        it("should work when no pending permissions", async () => {
            const { result } = renderHook(() => useClearPermissions());

            await act(async () => {
                result.current.mutate();
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(usePermissionStore.getState().pendingPermissions.length).toBe(0);
        });
    });
});
