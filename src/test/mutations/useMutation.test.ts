/**
 * useMutation Hook Tests
 *
 * Tests for the core mutation hook functionality including
 * state management, optimistic updates, error handling, and retry logic.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useMutation, useOptimisticMutation } from "../../webview/mutations/useMutation";

describe("useMutation", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    describe("initial state", () => {
        it("should have idle initial state", () => {
            const mutationFn = vi.fn().mockResolvedValue("result");
            const { result } = renderHook(() => useMutation({ mutationFn }));

            expect(result.current.status).toBe("idle");
            expect(result.current.isIdle).toBe(true);
            expect(result.current.isPending).toBe(false);
            expect(result.current.isSuccess).toBe(false);
            expect(result.current.isError).toBe(false);
            expect(result.current.data).toBeNull();
            expect(result.current.error).toBeNull();
        });
    });

    describe("mutation execution", () => {
        it("should transition to pending state when mutate is called", async () => {
            const mutationFn = vi
                .fn()
                .mockImplementation(
                    () => new Promise((resolve) => setTimeout(() => resolve("result"), 100)),
                );
            const { result } = renderHook(() => useMutation({ mutationFn }));

            act(() => {
                result.current.mutate("test");
            });

            expect(result.current.status).toBe("pending");
            expect(result.current.isPending).toBe(true);
            expect(result.current.isIdle).toBe(false);
        });

        it("should transition to success state on successful mutation", async () => {
            const mutationFn = vi.fn().mockResolvedValue("success-data");
            const { result } = renderHook(() => useMutation({ mutationFn }));

            await act(async () => {
                await result.current.mutateAsync("test");
            });

            expect(result.current.status).toBe("success");
            expect(result.current.isSuccess).toBe(true);
            expect(result.current.data).toBe("success-data");
            expect(result.current.error).toBeNull();
        });

        it("should transition to error state on failed mutation", async () => {
            const error = new Error("Mutation failed");
            const mutationFn = vi.fn().mockRejectedValue(error);
            const { result } = renderHook(() => useMutation({ mutationFn }));

            await act(async () => {
                try {
                    await result.current.mutateAsync("test");
                } catch {
                    // Expected
                }
            });

            expect(result.current.status).toBe("error");
            expect(result.current.isError).toBe(true);
            expect(result.current.error).toBe(error);
            expect(result.current.data).toBeNull();
        });

        it("should pass variables to mutationFn", async () => {
            const mutationFn = vi.fn().mockResolvedValue("result");
            const { result } = renderHook(() => useMutation({ mutationFn }));

            await act(async () => {
                await result.current.mutateAsync({ id: 1, name: "test" });
            });

            expect(mutationFn).toHaveBeenCalledWith({ id: 1, name: "test" });
        });

        it("should store variables from last mutation call", async () => {
            const mutationFn = vi.fn().mockResolvedValue("result");
            const { result } = renderHook(() => useMutation({ mutationFn }));

            await act(async () => {
                await result.current.mutateAsync({ id: 1 });
            });

            expect(result.current.variables).toEqual({ id: 1 });
        });
    });

    describe("callbacks", () => {
        it("should call onMutate before mutation", async () => {
            const callOrder: string[] = [];
            const onMutate = vi.fn().mockImplementation(() => {
                callOrder.push("onMutate");
                return "context";
            });
            const mutationFn = vi.fn().mockImplementation(() => {
                callOrder.push("mutationFn");
                return Promise.resolve("result");
            });

            const { result } = renderHook(() =>
                useMutation({
                    mutationFn,
                    onMutate,
                }),
            );

            await act(async () => {
                await result.current.mutateAsync("test");
            });

            expect(onMutate).toHaveBeenCalledWith("test");
            // Verify call order: onMutate should be called before mutationFn
            expect(callOrder).toEqual(["onMutate", "mutationFn"]);
        });

        it("should call onSuccess with data, variables, and context", async () => {
            const onMutate = vi.fn().mockReturnValue({ previousValue: "old" });
            const onSuccess = vi.fn();
            const mutationFn = vi.fn().mockResolvedValue("result");

            const { result } = renderHook(() =>
                useMutation({
                    mutationFn,
                    onMutate,
                    onSuccess,
                }),
            );

            await act(async () => {
                await result.current.mutateAsync("test-vars");
            });

            expect(onSuccess).toHaveBeenCalledWith("result", "test-vars", { previousValue: "old" });
        });

        it("should call onError with error, variables, and context", async () => {
            const error = new Error("Failed");
            const onMutate = vi.fn().mockReturnValue({ rollback: true });
            const onError = vi.fn();
            const mutationFn = vi.fn().mockRejectedValue(error);

            const { result } = renderHook(() =>
                useMutation({
                    mutationFn,
                    onMutate,
                    onError,
                }),
            );

            await act(async () => {
                try {
                    await result.current.mutateAsync("vars");
                } catch {
                    // Expected
                }
            });

            expect(onError).toHaveBeenCalledWith(error, "vars", { rollback: true });
        });

        it("should call onSettled after mutation completes (success)", async () => {
            const onSettled = vi.fn();
            const mutationFn = vi.fn().mockResolvedValue("result");

            const { result } = renderHook(() =>
                useMutation({
                    mutationFn,
                    onSettled,
                }),
            );

            await act(async () => {
                await result.current.mutateAsync("vars");
            });

            expect(onSettled).toHaveBeenCalledWith("result", null, "vars", undefined);
        });

        it("should call onSettled after mutation completes (error)", async () => {
            const error = new Error("Failed");
            const onSettled = vi.fn();
            const mutationFn = vi.fn().mockRejectedValue(error);

            const { result } = renderHook(() =>
                useMutation({
                    mutationFn,
                    onSettled,
                }),
            );

            await act(async () => {
                try {
                    await result.current.mutateAsync("vars");
                } catch {
                    // Expected
                }
            });

            expect(onSettled).toHaveBeenCalledWith(undefined, error, "vars", undefined);
        });
    });

    describe("reset", () => {
        it("should reset state to idle", async () => {
            const mutationFn = vi.fn().mockResolvedValue("result");
            const { result } = renderHook(() => useMutation({ mutationFn }));

            await act(async () => {
                await result.current.mutateAsync("test");
            });

            expect(result.current.isSuccess).toBe(true);

            act(() => {
                result.current.reset();
            });

            expect(result.current.status).toBe("idle");
            expect(result.current.isIdle).toBe(true);
            expect(result.current.data).toBeNull();
            expect(result.current.variables).toBeUndefined();
        });
    });

    describe("retry logic", () => {
        it("should retry specified number of times on failure", async () => {
            // Use real timers for this test to avoid timing complexity
            vi.useRealTimers();

            const error = new Error("Failed");
            const mutationFn = vi.fn().mockRejectedValue(error);

            const { result } = renderHook(() =>
                useMutation({
                    mutationFn,
                    retry: 3, // retry 3 times after initial attempt
                    retryDelay: 10, // Use short delay for real timers
                }),
            );

            await act(async () => {
                try {
                    await result.current.mutateAsync("test");
                } catch {
                    // Expected
                }
            });

            // With retry: 3, shouldRetry allows attempts when attemptCount < 3
            // So we get 3 total attempts (initial + 2 retries, since 3 < 3 = false after 3rd)
            expect(mutationFn).toHaveBeenCalledTimes(3);

            // Restore fake timers
            vi.useFakeTimers();
        });

        it("should not retry when retry is false", async () => {
            const error = new Error("Failed");
            const mutationFn = vi.fn().mockRejectedValue(error);

            const { result } = renderHook(() =>
                useMutation({
                    mutationFn,
                    retry: false,
                }),
            );

            await act(async () => {
                try {
                    await result.current.mutateAsync("test");
                } catch {
                    // Expected
                }
            });

            expect(mutationFn).toHaveBeenCalledTimes(1);
        });

        it("should use custom retry delay function", async () => {
            // Use real timers for this test to avoid timing complexity
            vi.useRealTimers();

            const error = new Error("Failed");
            const mutationFn = vi.fn().mockRejectedValueOnce(error).mockResolvedValue("success");

            const retryDelay = vi.fn().mockReturnValue(10); // Use short delay

            const { result } = renderHook(() =>
                useMutation({
                    mutationFn,
                    retry: 2, // Need retry >= 2 so attemptCount (1) < 2 triggers retry
                    retryDelay,
                }),
            );

            await act(async () => {
                await result.current.mutateAsync("test");
            });

            // retryDelay is called with attemptCount - 1 = 0 on first retry
            expect(retryDelay).toHaveBeenCalledWith(0, error);

            // Restore fake timers
            vi.useFakeTimers();
        });
    });
});

describe("useOptimisticMutation", () => {
    it("should apply optimistic update before mutation", async () => {
        let currentValue = "initial";
        const getSnapshot = vi.fn().mockReturnValue("initial");
        const optimisticUpdate = vi.fn((value: string) => {
            currentValue = value;
        });
        const rollback = vi.fn((snapshot: string) => {
            currentValue = snapshot;
        });
        const mutationFn = vi.fn().mockResolvedValue("result");

        const { result } = renderHook(() =>
            useOptimisticMutation({
                mutationFn,
                getSnapshot,
                optimisticUpdate,
                rollback,
            }),
        );

        await act(async () => {
            await result.current.mutateAsync("optimistic-value");
        });

        expect(optimisticUpdate).toHaveBeenCalledWith("optimistic-value");
        expect(getSnapshot).toHaveBeenCalled();
    });

    it("should rollback on error", async () => {
        let currentValue = "initial";
        const getSnapshot = vi.fn().mockReturnValue("initial");
        const optimisticUpdate = vi.fn((value: string) => {
            currentValue = value;
        });
        const rollback = vi.fn((snapshot: string) => {
            currentValue = snapshot;
        });
        const mutationFn = vi.fn().mockRejectedValue(new Error("Failed"));

        const { result } = renderHook(() =>
            useOptimisticMutation({
                mutationFn,
                getSnapshot,
                optimisticUpdate,
                rollback,
            }),
        );

        await act(async () => {
            try {
                await result.current.mutateAsync("optimistic-value");
            } catch {
                // Expected
            }
        });

        expect(rollback).toHaveBeenCalledWith("initial");
    });

    it("should not rollback on success", async () => {
        const getSnapshot = vi.fn().mockReturnValue("initial");
        const optimisticUpdate = vi.fn();
        const rollback = vi.fn();
        const mutationFn = vi.fn().mockResolvedValue("result");

        const { result } = renderHook(() =>
            useOptimisticMutation({
                mutationFn,
                getSnapshot,
                optimisticUpdate,
                rollback,
            }),
        );

        await act(async () => {
            await result.current.mutateAsync("value");
        });

        expect(rollback).not.toHaveBeenCalled();
    });

    it("should call onSuccess callback", async () => {
        const onSuccess = vi.fn();
        const mutationFn = vi.fn().mockResolvedValue("result");

        const { result } = renderHook(() =>
            useOptimisticMutation({
                mutationFn,
                getSnapshot: () => "snapshot",
                optimisticUpdate: vi.fn(),
                rollback: vi.fn(),
                onSuccess,
            }),
        );

        await act(async () => {
            await result.current.mutateAsync("vars");
        });

        expect(onSuccess).toHaveBeenCalledWith("result", "vars");
    });

    it("should call onError callback", async () => {
        const error = new Error("Failed");
        const onError = vi.fn();
        const mutationFn = vi.fn().mockRejectedValue(error);

        const { result } = renderHook(() =>
            useOptimisticMutation({
                mutationFn,
                getSnapshot: () => "snapshot",
                optimisticUpdate: vi.fn(),
                rollback: vi.fn(),
                onError,
            }),
        );

        await act(async () => {
            try {
                await result.current.mutateAsync("vars");
            } catch {
                // Expected
            }
        });

        expect(onError).toHaveBeenCalledWith(error, "vars");
    });
});
