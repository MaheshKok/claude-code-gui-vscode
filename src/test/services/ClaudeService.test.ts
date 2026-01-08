/**
 * ClaudeService Permission Auto-Approval Tests
 *
 * Tests for YOLO mode auto-approval functionality when enabled mid-session.
 * These tests validate the core logic of permission handling and auto-approval
 * using a mock implementation that mirrors ClaudeService behavior.
 *
 * @module test/services/ClaudeService
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { EventEmitter } from "events";
import { PermissionDecision } from "../../shared/constants";

/**
 * Pending permission request interface (mirrors ClaudeService)
 */
interface PendingPermissionRequest {
    requestId: string;
    toolName: string;
    input: Record<string, unknown>;
    suggestions?: unknown[];
    toolUseId: string;
}

/**
 * Mock ClaudeService implementation for testing permission handling
 * This mirrors the actual ClaudeService behavior without vscode dependencies
 */
class MockClaudeService {
    private _pendingPermissionRequests: Map<string, PendingPermissionRequest> = new Map();
    private _messageEmitter = new EventEmitter();
    private _permissionRequestEmitter = new EventEmitter();
    private _stdinWrite: ((data: string) => void) | null = null;

    /**
     * Set mock stdin write function
     */
    setStdinWrite(fn: (data: string) => void): void {
        this._stdinWrite = fn;
    }

    /**
     * Register a callback for messages
     */
    onMessage(callback: (message: unknown) => void): void {
        this._messageEmitter.on("message", callback);
    }

    /**
     * Register a callback for permission requests
     */
    onPermissionRequest(callback: (request: unknown) => void): void {
        this._permissionRequestEmitter.on("request", callback);
    }

    /**
     * Simulate receiving a permission request from Claude
     */
    simulatePermissionRequest(request: PendingPermissionRequest): void {
        this._pendingPermissionRequests.set(request.requestId, request);
        this._permissionRequestEmitter.emit("request", request);
    }

    /**
     * Get all pending permission request IDs
     */
    getPendingPermissionRequestIds(): string[] {
        return Array.from(this._pendingPermissionRequests.keys());
    }

    /**
     * Get a pending permission request by ID
     */
    getPendingPermissionRequest(
        requestId: string,
    ): { toolName: string; input: Record<string, unknown>; toolUseId: string } | undefined {
        return this._pendingPermissionRequests.get(requestId);
    }

    /**
     * Send a permission response
     */
    sendPermissionResponse(requestId: string, approved: boolean, alwaysAllow?: boolean): void {
        const pendingRequest = this._pendingPermissionRequests.get(requestId);
        if (!pendingRequest) {
            console.error("No pending permission request found for id:", requestId);
            return;
        }

        this._pendingPermissionRequests.delete(requestId);

        if (!this._stdinWrite) {
            console.error("Cannot send permission response: stdin not available");
            return;
        }

        let response: unknown;
        if (approved) {
            response = {
                type: "control_response",
                response: {
                    subtype: "success",
                    request_id: requestId,
                    response: {
                        behavior: PermissionDecision.Allow,
                        updatedInput: pendingRequest.input,
                        updatedPermissions: alwaysAllow ? pendingRequest.suggestions : undefined,
                        toolUseID: pendingRequest.toolUseId,
                    },
                },
            };
        } else {
            response = {
                type: "control_response",
                response: {
                    subtype: "success",
                    request_id: requestId,
                    response: {
                        behavior: PermissionDecision.Deny,
                        message: "User denied permission",
                        interrupt: true,
                        toolUseID: pendingRequest.toolUseId,
                    },
                },
            };
        }

        const responseJson = JSON.stringify(response) + "\n";
        this._stdinWrite(responseJson);
    }

    /**
     * Auto-approve all pending permission requests (YOLO mode mid-session)
     */
    autoApproveAllPendingRequests(): void {
        const pendingIds = this.getPendingPermissionRequestIds();
        console.log(
            `[MockClaudeService] Auto-approving ${pendingIds.length} pending permission requests (YOLO mode enabled)`,
        );

        for (const requestId of pendingIds) {
            this.sendPermissionResponse(requestId, true, false);
        }
    }

    /**
     * Clear all pending requests
     */
    clearPendingRequests(): void {
        this._pendingPermissionRequests.clear();
    }
}

describe("ClaudeService Permission Handling", () => {
    let mockService: MockClaudeService;
    let stdinWriteMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        mockService = new MockClaudeService();
        stdinWriteMock = vi.fn();
        mockService.setStdinWrite(stdinWriteMock);
    });

    // ==========================================================================
    // Permission Request Tests
    // ==========================================================================
    describe("getPendingPermissionRequestIds", () => {
        it("should return empty array when no pending requests", () => {
            const ids = mockService.getPendingPermissionRequestIds();
            expect(ids).toEqual([]);
        });

        it("should return all pending request IDs", () => {
            mockService.simulatePermissionRequest({
                requestId: "request-1",
                toolName: "Bash",
                input: { command: "ls" },
                toolUseId: "tool-1",
            });
            mockService.simulatePermissionRequest({
                requestId: "request-2",
                toolName: "Write",
                input: { path: "/test/file.txt" },
                toolUseId: "tool-2",
            });

            const ids = mockService.getPendingPermissionRequestIds();
            expect(ids).toHaveLength(2);
            expect(ids).toContain("request-1");
            expect(ids).toContain("request-2");
        });
    });

    describe("getPendingPermissionRequest", () => {
        it("should return undefined for non-existent request", () => {
            const request = mockService.getPendingPermissionRequest("non-existent");
            expect(request).toBeUndefined();
        });

        it("should return request data for existing request", () => {
            mockService.simulatePermissionRequest({
                requestId: "test-request",
                toolName: "Bash",
                input: { command: "npm install" },
                toolUseId: "tool-123",
            });

            const request = mockService.getPendingPermissionRequest("test-request");
            expect(request).toBeDefined();
            expect(request?.toolName).toBe("Bash");
            expect(request?.input).toEqual({ command: "npm install" });
        });
    });

    // ==========================================================================
    // Auto-Approve Tests (YOLO Mode Mid-Session)
    // ==========================================================================
    describe("autoApproveAllPendingRequests", () => {
        it("should do nothing when no pending requests exist", () => {
            const consoleSpy = vi.spyOn(console, "log");

            mockService.autoApproveAllPendingRequests();

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining("Auto-approving 0 pending permission requests"),
            );
            expect(stdinWriteMock).not.toHaveBeenCalled();
        });

        it("should approve all pending permission requests", () => {
            // Add multiple pending requests
            mockService.simulatePermissionRequest({
                requestId: "request-1",
                toolName: "Bash",
                input: { command: "ls -la" },
                toolUseId: "tool-1",
            });
            mockService.simulatePermissionRequest({
                requestId: "request-2",
                toolName: "Write",
                input: { path: "/test/file.txt", content: "test" },
                toolUseId: "tool-2",
            });
            mockService.simulatePermissionRequest({
                requestId: "request-3",
                toolName: "Edit",
                input: { file_path: "/test/edit.txt" },
                toolUseId: "tool-3",
            });

            expect(mockService.getPendingPermissionRequestIds()).toHaveLength(3);

            // Act: Auto-approve all
            mockService.autoApproveAllPendingRequests();

            // Assert: All requests should be approved (removed from pending)
            expect(mockService.getPendingPermissionRequestIds()).toHaveLength(0);

            // Assert: stdin.write should be called for each approval
            expect(stdinWriteMock).toHaveBeenCalledTimes(3);
        });

        it("should send correct approval response format", () => {
            mockService.simulatePermissionRequest({
                requestId: "test-request",
                toolName: "Bash",
                input: { command: "echo hello" },
                toolUseId: "tool-abc",
            });

            mockService.autoApproveAllPendingRequests();

            // Check that write was called with proper JSON structure
            expect(stdinWriteMock).toHaveBeenCalledTimes(1);
            const writtenData = stdinWriteMock.mock.calls[0][0] as string;
            const parsedResponse = JSON.parse(writtenData.trim());

            expect(parsedResponse.type).toBe("control_response");
            expect(parsedResponse.response.subtype).toBe("success");
            expect(parsedResponse.response.request_id).toBe("test-request");
            expect(parsedResponse.response.response.behavior).toBe(PermissionDecision.Allow);
        });

        it("should handle case when stdin is not available", () => {
            // Remove stdin write function
            mockService.setStdinWrite(null as unknown as (data: string) => void);

            mockService.simulatePermissionRequest({
                requestId: "orphan-request",
                toolName: "Bash",
                input: { command: "test" },
                toolUseId: "tool-orphan",
            });

            const consoleSpy = vi.spyOn(console, "error");

            // Should not throw, just log error
            expect(() => mockService.autoApproveAllPendingRequests()).not.toThrow();
            expect(consoleSpy).toHaveBeenCalledWith(
                "Cannot send permission response: stdin not available",
            );
        });

        it("should clear pending requests after auto-approval", () => {
            // Add requests
            mockService.simulatePermissionRequest({
                requestId: "req-1",
                toolName: "Bash",
                input: { command: "npm test" },
                toolUseId: "tool-1",
            });
            mockService.simulatePermissionRequest({
                requestId: "req-2",
                toolName: "Read",
                input: { file_path: "/test" },
                toolUseId: "tool-2",
            });

            // Verify requests exist
            expect(mockService.getPendingPermissionRequestIds()).toHaveLength(2);

            // Auto-approve
            mockService.autoApproveAllPendingRequests();

            // Verify all cleared
            expect(mockService.getPendingPermissionRequestIds()).toHaveLength(0);
        });

        it("should preserve input data in approval response", () => {
            const originalInput = { command: "npm install --save-dev typescript" };

            mockService.simulatePermissionRequest({
                requestId: "input-test",
                toolName: "Bash",
                input: originalInput,
                toolUseId: "tool-input",
            });

            mockService.autoApproveAllPendingRequests();

            const writtenData = stdinWriteMock.mock.calls[0][0] as string;
            const parsedResponse = JSON.parse(writtenData.trim());

            expect(parsedResponse.response.response.updatedInput).toEqual(originalInput);
        });
    });

    // ==========================================================================
    // sendPermissionResponse Tests
    // ==========================================================================
    describe("sendPermissionResponse", () => {
        it("should send approval response for valid request", () => {
            mockService.simulatePermissionRequest({
                requestId: "approve-test",
                toolName: "Bash",
                input: { command: "ls" },
                toolUseId: "tool-approve",
            });

            mockService.sendPermissionResponse("approve-test", true, false);

            expect(stdinWriteMock).toHaveBeenCalledTimes(1);
            const response = JSON.parse((stdinWriteMock.mock.calls[0][0] as string).trim());
            expect(response.response.response.behavior).toBe(PermissionDecision.Allow);
        });

        it("should send denial response when approved is false", () => {
            mockService.simulatePermissionRequest({
                requestId: "deny-test",
                toolName: "Bash",
                input: { command: "rm -rf /" },
                toolUseId: "tool-deny",
            });

            mockService.sendPermissionResponse("deny-test", false, false);

            expect(stdinWriteMock).toHaveBeenCalledTimes(1);
            const response = JSON.parse((stdinWriteMock.mock.calls[0][0] as string).trim());
            expect(response.response.response.behavior).toBe(PermissionDecision.Deny);
        });

        it("should not send response for non-existent request", () => {
            const consoleSpy = vi.spyOn(console, "error");

            mockService.sendPermissionResponse("non-existent-id", true, false);

            expect(consoleSpy).toHaveBeenCalledWith(
                "No pending permission request found for id:",
                "non-existent-id",
            );
            expect(stdinWriteMock).not.toHaveBeenCalled();
        });

        it("should remove request from pending after sending response", () => {
            mockService.simulatePermissionRequest({
                requestId: "remove-test",
                toolName: "Write",
                input: { path: "/test" },
                toolUseId: "tool-remove",
            });

            expect(mockService.getPendingPermissionRequest("remove-test")).toBeDefined();

            mockService.sendPermissionResponse("remove-test", true, false);

            expect(mockService.getPendingPermissionRequest("remove-test")).toBeUndefined();
        });

        it("should include toolUseId in response", () => {
            mockService.simulatePermissionRequest({
                requestId: "tooluse-test",
                toolName: "Edit",
                input: { file: "/test.txt" },
                toolUseId: "specific-tool-use-id-123",
            });

            mockService.sendPermissionResponse("tooluse-test", true, false);

            const response = JSON.parse((stdinWriteMock.mock.calls[0][0] as string).trim());
            expect(response.response.response.toolUseID).toBe("specific-tool-use-id-123");
        });
    });

    // ==========================================================================
    // Integration Scenarios
    // ==========================================================================
    describe("YOLO mode mid-session scenarios", () => {
        it("should handle enabling YOLO mode with single pending request", () => {
            // Scenario: User is working, Claude requests permission for a bash command
            mockService.simulatePermissionRequest({
                requestId: "mid-session-1",
                toolName: "Bash",
                input: { command: "npm run build" },
                toolUseId: "build-tool",
            });

            expect(mockService.getPendingPermissionRequestIds()).toHaveLength(1);

            // User enables YOLO mode
            mockService.autoApproveAllPendingRequests();

            // Request should be approved and cleared
            expect(mockService.getPendingPermissionRequestIds()).toHaveLength(0);
            expect(stdinWriteMock).toHaveBeenCalledTimes(1);

            // Verify approval was sent
            const response = JSON.parse((stdinWriteMock.mock.calls[0][0] as string).trim());
            expect(response.response.response.behavior).toBe(PermissionDecision.Allow);
        });

        it("should handle enabling YOLO mode with multiple pending requests from different tools", () => {
            // Scenario: Claude has queued multiple operations requiring permission
            mockService.simulatePermissionRequest({
                requestId: "file-read",
                toolName: "Read",
                input: { file_path: "/src/index.ts" },
                toolUseId: "read-1",
            });
            mockService.simulatePermissionRequest({
                requestId: "file-write",
                toolName: "Write",
                input: { file_path: "/src/output.ts", content: "// generated" },
                toolUseId: "write-1",
            });
            mockService.simulatePermissionRequest({
                requestId: "bash-exec",
                toolName: "Bash",
                input: { command: "npm test" },
                toolUseId: "bash-1",
            });

            expect(mockService.getPendingPermissionRequestIds()).toHaveLength(3);

            // User enables YOLO mode - all should be approved
            mockService.autoApproveAllPendingRequests();

            expect(mockService.getPendingPermissionRequestIds()).toHaveLength(0);
            expect(stdinWriteMock).toHaveBeenCalledTimes(3);

            // All responses should be approvals
            for (let i = 0; i < 3; i++) {
                const response = JSON.parse((stdinWriteMock.mock.calls[i][0] as string).trim());
                expect(response.response.response.behavior).toBe(PermissionDecision.Allow);
            }
        });

        it("should handle rapid successive permission requests being auto-approved", () => {
            // Simulate rapid requests (like during a complex operation)
            for (let i = 0; i < 10; i++) {
                mockService.simulatePermissionRequest({
                    requestId: `rapid-${i}`,
                    toolName: i % 2 === 0 ? "Bash" : "Write",
                    input: { id: i },
                    toolUseId: `tool-${i}`,
                });
            }

            expect(mockService.getPendingPermissionRequestIds()).toHaveLength(10);

            mockService.autoApproveAllPendingRequests();

            expect(mockService.getPendingPermissionRequestIds()).toHaveLength(0);
            expect(stdinWriteMock).toHaveBeenCalledTimes(10);
        });

        it("should correctly handle YOLO mode when no requests are pending", () => {
            // Scenario: User enables YOLO mode preemptively
            expect(mockService.getPendingPermissionRequestIds()).toHaveLength(0);

            // Should not throw or cause issues
            mockService.autoApproveAllPendingRequests();

            expect(stdinWriteMock).not.toHaveBeenCalled();
            expect(mockService.getPendingPermissionRequestIds()).toHaveLength(0);
        });
    });

    // ==========================================================================
    // Permission Request Event Handling Tests
    // ==========================================================================
    describe("permission request events", () => {
        it("should emit permission request events", () => {
            const requestHandler = vi.fn();
            mockService.onPermissionRequest(requestHandler);

            mockService.simulatePermissionRequest({
                requestId: "event-test",
                toolName: "Bash",
                input: { command: "ls" },
                toolUseId: "tool-event",
            });

            expect(requestHandler).toHaveBeenCalledWith(
                expect.objectContaining({
                    requestId: "event-test",
                    toolName: "Bash",
                }),
            );
        });

        it("should track requests even when event handler processes them", () => {
            const requestHandler = vi.fn();
            mockService.onPermissionRequest(requestHandler);

            mockService.simulatePermissionRequest({
                requestId: "tracked-request",
                toolName: "Write",
                input: { path: "/test" },
                toolUseId: "tool-track",
            });

            // Event was emitted
            expect(requestHandler).toHaveBeenCalled();

            // Request is still pending (awaiting user decision)
            expect(mockService.getPendingPermissionRequest("tracked-request")).toBeDefined();

            // Auto-approve should still work
            mockService.autoApproveAllPendingRequests();
            expect(mockService.getPendingPermissionRequest("tracked-request")).toBeUndefined();
        });
    });
});
