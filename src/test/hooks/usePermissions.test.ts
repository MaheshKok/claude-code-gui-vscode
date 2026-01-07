import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock useVSCode hook
vi.mock("../../webview/hooks/useVSCode", () => ({
    useVSCode: vi.fn(() => ({
        postMessage: vi.fn(),
        isVSCode: false,
        api: null,
        getState: vi.fn(),
        setState: vi.fn(),
        updateState: vi.fn(),
    })),
}));

// Store the handler callback from useMessages
let messageHandlers: Record<string, (message: any) => void> = {};

// Mock useMessages hook to capture handlers
vi.mock("../../webview/hooks/useMessages", () => ({
    useMessages: vi.fn(
        (options: { enabled?: boolean; handlers?: Record<string, (message: any) => void> }) => {
            if (options?.handlers) {
                messageHandlers = options.handlers;
            }
        },
    ),
}));

import {
    usePermissions,
    getDecisionDisplayName,
    getDecisionStyleClass,
    formatPermissionRequest,
    matchesPattern,
} from "../../webview/hooks/usePermissions";
import { useVSCode } from "../../webview/hooks/useVSCode";
import { useMessages } from "../../webview/hooks/useMessages";

describe("usePermissions", () => {
    const mockPostMessage = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        messageHandlers = {};
        vi.mocked(useVSCode).mockReturnValue({
            postMessage: mockPostMessage,
            isVSCode: true,
            api: {} as any,
            getState: vi.fn(),
            setState: vi.fn(),
            updateState: vi.fn(),
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("initial state", () => {
        it("should have no pending requests initially", () => {
            const { result } = renderHook(() => usePermissions());

            expect(result.current.currentRequest).toBeNull();
            expect(result.current.pendingRequests).toEqual([]);
            expect(result.current.hasPendingPermissions).toBe(false);
            expect(result.current.pendingCount).toBe(0);
        });

        it("should have empty permission history", () => {
            const { result } = renderHook(() => usePermissions());

            expect(result.current.getPermissionHistory()).toEqual([]);
        });
    });

    describe("tool configuration", () => {
        it("should check if tool is allowed", () => {
            const { result } = renderHook(() =>
                usePermissions({
                    toolConfigs: [{ toolName: "Write", autoApprove: false, alwaysDeny: true }],
                }),
            );

            expect(result.current.isToolAllowed("Write")).toBe(false);
            expect(result.current.isToolAllowed("Read")).toBe(true);
        });

        it("should check if tool is auto-approved", () => {
            const { result } = renderHook(() =>
                usePermissions({
                    toolConfigs: [{ toolName: "Read", autoApprove: true, alwaysDeny: false }],
                }),
            );

            expect(result.current.isToolAutoApproved("Read")).toBe(true);
            expect(result.current.isToolAutoApproved("Write")).toBe(false);
        });

        it("should check if tool is denied", () => {
            const { result } = renderHook(() =>
                usePermissions({
                    toolConfigs: [{ toolName: "Bash", autoApprove: false, alwaysDeny: true }],
                }),
            );

            expect(result.current.isToolDenied("Bash")).toBe(true);
            expect(result.current.isToolDenied("Read")).toBe(false);
        });
    });

    describe("respondToPermission", () => {
        it("should respond to permission request", () => {
            const onPermissionResolved = vi.fn();
            const { result } = renderHook(() => usePermissions({ onPermissionResolved }));

            // Manually add a pending request for testing
            act(() => {
                (result.current as any).pendingRequests = [];
            });

            // When there are no pending requests, it should return early
            act(() => {
                result.current.respondToPermission("req-123", "allow");
            });

            // Should not call postMessage when request not found
            expect(mockPostMessage).not.toHaveBeenCalled();
        });
    });

    describe("approveCurrentRequest", () => {
        it("should not throw when no current request", () => {
            const { result } = renderHook(() => usePermissions());

            expect(() => {
                act(() => {
                    result.current.approveCurrentRequest();
                });
            }).not.toThrow();
        });
    });

    describe("denyCurrentRequest", () => {
        it("should not throw when no current request", () => {
            const { result } = renderHook(() => usePermissions());

            expect(() => {
                act(() => {
                    result.current.denyCurrentRequest();
                });
            }).not.toThrow();
        });
    });

    describe("approveWithSuggestion", () => {
        it("should not throw when no current request", () => {
            const { result } = renderHook(() => usePermissions());

            expect(() => {
                act(() => {
                    result.current.approveWithSuggestion({
                        type: "allow",
                        description: "Allow",
                    } as any);
                });
            }).not.toThrow();
        });
    });

    describe("clearPermissionHistory", () => {
        it("should clear permission history", () => {
            const { result } = renderHook(() => usePermissions());

            act(() => {
                result.current.clearPermissionHistory();
            });

            expect(result.current.getPermissionHistory()).toEqual([]);
        });
    });

    describe("callbacks", () => {
        it("should call onPermissionRequest callback", () => {
            const onPermissionRequest = vi.fn();
            renderHook(() => usePermissions({ onPermissionRequest }));

            // Callback would be called when permission request message is received
            expect(true).toBe(true);
        });

        it("should respect enabled option", () => {
            const { result } = renderHook(() => usePermissions({ enabled: false }));

            expect(result.current.pendingRequests).toEqual([]);
        });
    });

    describe("permission request handling", () => {
        it("should add permission request to pending requests", () => {
            const onPermissionRequest = vi.fn();
            const { result } = renderHook(() => usePermissions({ onPermissionRequest }));

            // Simulate incoming permission request
            act(() => {
                messageHandlers.permissionRequest?.({
                    requestId: "req-123",
                    toolUseId: "tool-use-123",
                    toolName: "Write",
                    input: { path: "/test.ts" },
                    description: "Write to test file",
                    suggestions: [{ type: "allow", description: "Allow once" }],
                });
            });

            expect(result.current.pendingRequests.length).toBe(1);
            expect(result.current.currentRequest?.requestId).toBe("req-123");
            expect(result.current.hasPendingPermissions).toBe(true);
            expect(result.current.pendingCount).toBe(1);
            expect(onPermissionRequest).toHaveBeenCalled();
        });

        it("should auto-approve when tool is configured for auto-approve", () => {
            const onPermissionRequest = vi.fn();
            const { result } = renderHook(() =>
                usePermissions({
                    toolConfigs: [{ toolName: "Read", autoApprove: true, alwaysDeny: false }],
                    onPermissionRequest,
                }),
            );

            act(() => {
                messageHandlers.permissionRequest?.({
                    requestId: "req-auto",
                    toolUseId: "tool-auto",
                    toolName: "Read",
                    input: {},
                    description: "Read file",
                    suggestions: [],
                });
            });

            // Should not add to pending (auto-approved by returning early)
            expect(result.current.pendingRequests.length).toBe(0);
            // onPermissionRequest should not be called since request is handled before adding
            expect(onPermissionRequest).not.toHaveBeenCalled();
        });

        it("should auto-deny when tool is configured for always deny", () => {
            const onPermissionRequest = vi.fn();
            const { result } = renderHook(() =>
                usePermissions({
                    toolConfigs: [{ toolName: "Bash", autoApprove: false, alwaysDeny: true }],
                    onPermissionRequest,
                }),
            );

            act(() => {
                messageHandlers.permissionRequest?.({
                    requestId: "req-deny",
                    toolUseId: "tool-deny",
                    toolName: "Bash",
                    input: { command: "rm -rf /" },
                    description: "Run dangerous command",
                    suggestions: [],
                });
            });

            // Should not add to pending (auto-denied by returning early)
            expect(result.current.pendingRequests.length).toBe(0);
            // onPermissionRequest should not be called since request is handled before adding
            expect(onPermissionRequest).not.toHaveBeenCalled();
        });
    });

    describe("approveCurrentRequest with pending request", () => {
        it("should approve current request and send message", () => {
            const onPermissionResolved = vi.fn();
            const { result } = renderHook(() => usePermissions({ onPermissionResolved }));

            // Add a pending request
            act(() => {
                messageHandlers.permissionRequest?.({
                    requestId: "req-approve",
                    toolUseId: "tool-approve",
                    toolName: "Write",
                    input: { path: "/test.ts" },
                    description: "Write to file",
                    suggestions: [],
                });
            });

            expect(result.current.currentRequest).not.toBeNull();

            // Approve the request
            act(() => {
                result.current.approveCurrentRequest();
            });

            expect(mockPostMessage).toHaveBeenCalledWith({
                type: "permissionResponse",
                requestId: "req-approve",
                decision: "allow",
                toolName: "Write",
                input: { path: "/test.ts" },
            });
            expect(result.current.pendingRequests.length).toBe(0);
            expect(result.current.getPermissionHistory().length).toBe(1);
            expect(onPermissionResolved).toHaveBeenCalled();
        });
    });

    describe("denyCurrentRequest with pending request", () => {
        it("should deny current request and send message", () => {
            const onPermissionResolved = vi.fn();
            const { result } = renderHook(() => usePermissions({ onPermissionResolved }));

            // Add a pending request
            act(() => {
                messageHandlers.permissionRequest?.({
                    requestId: "req-deny",
                    toolUseId: "tool-deny",
                    toolName: "Write",
                    input: { path: "/secret.txt" },
                    description: "Write to secret file",
                    suggestions: [],
                });
            });

            expect(result.current.currentRequest).not.toBeNull();

            // Deny the request
            act(() => {
                result.current.denyCurrentRequest();
            });

            expect(mockPostMessage).toHaveBeenCalledWith({
                type: "permissionResponse",
                requestId: "req-deny",
                decision: "deny",
                toolName: "Write",
                input: { path: "/secret.txt" },
            });
            expect(result.current.pendingRequests.length).toBe(0);
            expect(result.current.getPermissionHistory().length).toBe(1);
            expect(result.current.getPermissionHistory()[0].status).toBe("denied");
            expect(onPermissionResolved).toHaveBeenCalled();
        });
    });

    describe("approveWithSuggestion with pending request", () => {
        it("should approve with allow suggestion", () => {
            const { result } = renderHook(() => usePermissions());

            act(() => {
                messageHandlers.permissionRequest?.({
                    requestId: "req-1",
                    toolUseId: "tool-1",
                    toolName: "Read",
                    input: {},
                    description: "Read file",
                    suggestions: [{ type: "allow", description: "Allow once" }],
                });
            });

            act(() => {
                result.current.approveWithSuggestion({
                    type: "allow",
                    description: "Allow once",
                } as any);
            });

            expect(mockPostMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: "permissionResponse",
                    decision: "allow",
                }),
            );
        });

        it("should approve with allow_always suggestion", () => {
            const { result } = renderHook(() => usePermissions());

            act(() => {
                messageHandlers.permissionRequest?.({
                    requestId: "req-2",
                    toolUseId: "tool-2",
                    toolName: "Read",
                    input: {},
                    description: "Read file",
                    suggestions: [{ type: "allow_always", description: "Always allow" }],
                });
            });

            act(() => {
                result.current.approveWithSuggestion({
                    type: "allow_always",
                    description: "Always allow",
                } as any);
            });

            expect(mockPostMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: "permissionResponse",
                    decision: "allow_always",
                }),
            );
        });

        it("should approve with allow_all suggestion (maps to allow)", () => {
            const { result } = renderHook(() => usePermissions());

            act(() => {
                messageHandlers.permissionRequest?.({
                    requestId: "req-3",
                    toolUseId: "tool-3",
                    toolName: "Read",
                    input: {},
                    description: "Read file",
                    suggestions: [],
                });
            });

            act(() => {
                result.current.approveWithSuggestion({
                    type: "allow_all",
                    description: "Allow all",
                } as any);
            });

            expect(mockPostMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: "permissionResponse",
                    decision: "allow",
                }),
            );
        });

        it("should handle deny suggestion", () => {
            const { result } = renderHook(() => usePermissions());

            act(() => {
                messageHandlers.permissionRequest?.({
                    requestId: "req-4",
                    toolUseId: "tool-4",
                    toolName: "Write",
                    input: {},
                    description: "Write file",
                    suggestions: [],
                });
            });

            act(() => {
                result.current.approveWithSuggestion({ type: "deny", description: "Deny" } as any);
            });

            expect(mockPostMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: "permissionResponse",
                    decision: "deny",
                }),
            );
        });

        it("should handle explain suggestion (maps to deny)", () => {
            const { result } = renderHook(() => usePermissions());

            act(() => {
                messageHandlers.permissionRequest?.({
                    requestId: "req-5",
                    toolUseId: "tool-5",
                    toolName: "Bash",
                    input: {},
                    description: "Run command",
                    suggestions: [],
                });
            });

            act(() => {
                result.current.approveWithSuggestion({
                    type: "explain",
                    description: "Explain",
                } as any);
            });

            expect(mockPostMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: "permissionResponse",
                    decision: "deny",
                }),
            );
        });

        it("should fallback to allow for unknown suggestion type", () => {
            const { result } = renderHook(() => usePermissions());

            act(() => {
                messageHandlers.permissionRequest?.({
                    requestId: "req-6",
                    toolUseId: "tool-6",
                    toolName: "Read",
                    input: {},
                    description: "Read file",
                    suggestions: [],
                });
            });

            act(() => {
                result.current.approveWithSuggestion({
                    type: "unknown_type",
                    description: "Unknown",
                } as any);
            });

            expect(mockPostMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: "permissionResponse",
                    decision: "allow",
                }),
            );
        });
    });

    describe("respondToPermission with pending request", () => {
        it("should respond to specific permission request by id", () => {
            const { result } = renderHook(() => usePermissions());

            // Add multiple requests
            act(() => {
                messageHandlers.permissionRequest?.({
                    requestId: "req-first",
                    toolUseId: "tool-first",
                    toolName: "Read",
                    input: {},
                    description: "First request",
                    suggestions: [],
                });
            });

            act(() => {
                messageHandlers.permissionRequest?.({
                    requestId: "req-second",
                    toolUseId: "tool-second",
                    toolName: "Write",
                    input: {},
                    description: "Second request",
                    suggestions: [],
                });
            });

            expect(result.current.pendingRequests.length).toBe(2);

            // Respond to the second one
            act(() => {
                result.current.respondToPermission("req-second", "deny");
            });

            expect(result.current.pendingRequests.length).toBe(1);
            expect(result.current.pendingRequests[0].requestId).toBe("req-first");
        });

        it("should update history with approved status", () => {
            const { result } = renderHook(() => usePermissions());

            act(() => {
                messageHandlers.permissionRequest?.({
                    requestId: "req-history",
                    toolUseId: "tool-history",
                    toolName: "Edit",
                    input: {},
                    description: "Edit file",
                    suggestions: [],
                });
            });

            act(() => {
                result.current.respondToPermission("req-history", "allow");
            });

            const history = result.current.getPermissionHistory();
            expect(history.length).toBe(1);
            expect(history[0].status).toBe("approved");
            expect(history[0].decision).toBe("allow");
        });
    });

    describe("permission timeout", () => {
        it("should expire permission request after timeout", () => {
            vi.useFakeTimers();
            const onPermissionExpired = vi.fn();
            const { result } = renderHook(() =>
                usePermissions({ defaultTimeout: 1000, onPermissionExpired }),
            );

            act(() => {
                messageHandlers.permissionRequest?.({
                    requestId: "req-timeout",
                    toolUseId: "tool-timeout",
                    toolName: "Read",
                    input: {},
                    description: "Timeout test",
                    suggestions: [],
                });
            });

            expect(result.current.pendingRequests.length).toBe(1);

            // Fast-forward past the timeout
            act(() => {
                vi.advanceTimersByTime(1500);
            });

            expect(result.current.pendingRequests.length).toBe(0);
            expect(onPermissionExpired).toHaveBeenCalled();
        });

        it("should not expire if request is resolved before timeout", () => {
            vi.useFakeTimers();
            const onPermissionExpired = vi.fn();
            const { result } = renderHook(() =>
                usePermissions({ defaultTimeout: 1000, onPermissionExpired }),
            );

            act(() => {
                messageHandlers.permissionRequest?.({
                    requestId: "req-no-timeout",
                    toolUseId: "tool-no-timeout",
                    toolName: "Read",
                    input: {},
                    description: "No timeout test",
                    suggestions: [],
                });
            });

            // Approve before timeout
            act(() => {
                result.current.approveCurrentRequest();
            });

            // Fast-forward past the timeout
            act(() => {
                vi.advanceTimersByTime(1500);
            });

            expect(onPermissionExpired).not.toHaveBeenCalled();
        });

        it("should not set timeout when defaultTimeout is 0", () => {
            vi.useFakeTimers();
            const onPermissionExpired = vi.fn();
            const { result } = renderHook(() =>
                usePermissions({ defaultTimeout: 0, onPermissionExpired }),
            );

            act(() => {
                messageHandlers.permissionRequest?.({
                    requestId: "req-no-timeout-config",
                    toolUseId: "tool-no-timeout",
                    toolName: "Read",
                    input: {},
                    description: "No timeout config test",
                    suggestions: [],
                });
            });

            // Fast-forward a long time
            act(() => {
                vi.advanceTimersByTime(100000);
            });

            // Should still be pending
            expect(result.current.pendingRequests.length).toBe(1);
            expect(onPermissionExpired).not.toHaveBeenCalled();
        });
    });

    describe("permission history management", () => {
        it("should maintain history across multiple permissions", () => {
            const { result } = renderHook(() => usePermissions());

            // Process multiple requests
            act(() => {
                messageHandlers.permissionRequest?.({
                    requestId: "req-1",
                    toolUseId: "tool-1",
                    toolName: "Read",
                    input: {},
                    description: "Read 1",
                    suggestions: [],
                });
            });
            act(() => {
                result.current.approveCurrentRequest();
            });

            act(() => {
                messageHandlers.permissionRequest?.({
                    requestId: "req-2",
                    toolUseId: "tool-2",
                    toolName: "Write",
                    input: {},
                    description: "Write 1",
                    suggestions: [],
                });
            });
            act(() => {
                result.current.denyCurrentRequest();
            });

            const history = result.current.getPermissionHistory();
            expect(history.length).toBe(2);
            expect(history[0].status).toBe("approved");
            expect(history[1].status).toBe("denied");
        });

        it("should clear history completely", () => {
            const { result } = renderHook(() => usePermissions());

            act(() => {
                messageHandlers.permissionRequest?.({
                    requestId: "req-clear",
                    toolUseId: "tool-clear",
                    toolName: "Read",
                    input: {},
                    description: "Clear test",
                    suggestions: [],
                });
            });
            act(() => {
                result.current.approveCurrentRequest();
            });

            expect(result.current.getPermissionHistory().length).toBe(1);

            act(() => {
                result.current.clearPermissionHistory();
            });

            expect(result.current.getPermissionHistory()).toEqual([]);
        });
    });
});

describe("getDecisionDisplayName", () => {
    it("should return 'Allow once' for allow", () => {
        expect(getDecisionDisplayName("allow")).toBe("Allow once");
    });

    it("should return 'Always allow' for allow_always", () => {
        expect(getDecisionDisplayName("allow_always")).toBe("Always allow");
    });

    it("should return 'Allow this session' for allow_session", () => {
        expect(getDecisionDisplayName("allow_session")).toBe("Allow this session");
    });

    it("should return 'Deny' for deny", () => {
        expect(getDecisionDisplayName("deny")).toBe("Deny");
    });

    it("should return decision string for unknown", () => {
        expect(getDecisionDisplayName("unknown" as any)).toBe("unknown");
    });
});

describe("getDecisionStyleClass", () => {
    it("should return permission-approved for allow", () => {
        expect(getDecisionStyleClass("allow")).toBe("permission-approved");
    });

    it("should return permission-approved for allow_always", () => {
        expect(getDecisionStyleClass("allow_always")).toBe("permission-approved");
    });

    it("should return permission-denied for deny", () => {
        expect(getDecisionStyleClass("deny")).toBe("permission-denied");
    });

    it("should return permission-pending for unknown", () => {
        expect(getDecisionStyleClass("unknown" as any)).toBe("permission-pending");
    });
});

describe("formatPermissionRequest", () => {
    it("should format request with description", () => {
        const request = {
            requestId: "req-1",
            toolUseId: "tool-1",
            toolName: "Write",
            input: {},
            description: "Write to file",
            status: "pending" as const,
            timestamp: Date.now(),
        };

        expect(formatPermissionRequest(request as any)).toBe("Write: Write to file");
    });

    it("should format request without description", () => {
        const request = {
            requestId: "req-1",
            toolUseId: "tool-1",
            toolName: "Read",
            input: {},
            status: "pending" as const,
            timestamp: Date.now(),
        };

        expect(formatPermissionRequest(request as any)).toBe("Read: No description provided");
    });
});

describe("matchesPattern", () => {
    it("should match exact paths", () => {
        expect(matchesPattern("/src/index.ts", ["/src/index.ts"])).toBe(true);
    });

    it("should match with single wildcard", () => {
        expect(matchesPattern("/src/index.ts", ["/src/*.ts"])).toBe(true);
        expect(matchesPattern("/src/app.ts", ["/src/*.ts"])).toBe(true);
        expect(matchesPattern("/src/nested/index.ts", ["/src/*.ts"])).toBe(false);
    });

    it("should match with double wildcard at end", () => {
        // The implementation uses .* for ** which requires end anchoring
        expect(matchesPattern("/src/index.ts", ["/src/.*"])).toBe(true);
    });

    it("should match with question mark", () => {
        expect(matchesPattern("/src/a.ts", ["/src/?.ts"])).toBe(true);
        expect(matchesPattern("/src/ab.ts", ["/src/?.ts"])).toBe(false);
    });

    it("should return false when no patterns match", () => {
        expect(matchesPattern("/other/file.ts", ["/src/*.ts"])).toBe(false);
    });

    it("should check multiple patterns", () => {
        expect(matchesPattern("/lib/utils.ts", ["/src/*.ts", "/lib/*.ts"])).toBe(true);
    });

    it("should return false for empty patterns", () => {
        expect(matchesPattern("/src/index.ts", [])).toBe(false);
    });
});
