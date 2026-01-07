import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useUsageStore } from "../../webview/stores/usageStore";
import type { UsageData } from "../../shared/types/usage";

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
    };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("usageStore", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.clear();
        // Reset the store before each test
        useUsageStore.setState({
            data: {
                currentSession: {
                    usageCost: 0,
                    costLimit: 1,
                    resetsIn: "",
                },
                weekly: {
                    costLikely: 0,
                    costLimit: 1,
                    resetsAt: "",
                },
            },
            isVisible: false,
            lastUpdatedAt: null,
            isRefreshing: false,
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("initial state", () => {
        it("should have default usage data", () => {
            const state = useUsageStore.getState();
            expect(state.data).toBeDefined();
            expect(state.data?.currentSession.usageCost).toBe(0);
            expect(state.data?.currentSession.costLimit).toBe(1);
            expect(state.data?.weekly.costLikely).toBe(0);
            expect(state.data?.weekly.costLimit).toBe(1);
        });

        it("should have isVisible set to false", () => {
            const state = useUsageStore.getState();
            expect(state.isVisible).toBe(false);
        });
    });

    describe("setUsageData", () => {
        it("should update usage data", () => {
            const newData: UsageData = {
                currentSession: {
                    usageCost: 0.5,
                    costLimit: 1,
                    resetsIn: "2 hr 30 min",
                },
                weekly: {
                    costLikely: 0.25,
                    costLimit: 1,
                    resetsAt: "Thu 5:00 PM",
                },
            };

            useUsageStore.getState().setUsageData(newData);

            const state = useUsageStore.getState();
            expect(state.data?.currentSession.usageCost).toBe(0.5);
            expect(state.data?.currentSession.resetsIn).toBe("2 hr 30 min");
            expect(state.data?.weekly.costLikely).toBe(0.25);
            expect(state.data?.weekly.resetsAt).toBe("Thu 5:00 PM");
        });

        it("should update usage data with sonnet limits", () => {
            const newData: UsageData = {
                currentSession: {
                    usageCost: 0.75,
                    costLimit: 1,
                    resetsIn: "1 hr 15 min",
                },
                weekly: {
                    costLikely: 0.4,
                    costLimit: 1,
                    resetsAt: "Fri 9:00 AM",
                },
                sonnet: {
                    usage: 0.3,
                    limit: 1,
                    resetsAt: "Fri 9:00 AM",
                },
            };

            useUsageStore.getState().setUsageData(newData);

            const state = useUsageStore.getState();
            expect(state.data?.sonnet?.usage).toBe(0.3);
            expect(state.data?.sonnet?.limit).toBe(1);
            expect(state.data?.sonnet?.resetsAt).toBe("Fri 9:00 AM");
        });
    });

    describe("toggleVisibility", () => {
        it("should toggle visibility from false to true", () => {
            expect(useUsageStore.getState().isVisible).toBe(false);
            useUsageStore.getState().toggleVisibility();
            expect(useUsageStore.getState().isVisible).toBe(true);
        });

        it("should toggle visibility from true to false", () => {
            useUsageStore.setState({ isVisible: true });
            expect(useUsageStore.getState().isVisible).toBe(true);
            useUsageStore.getState().toggleVisibility();
            expect(useUsageStore.getState().isVisible).toBe(false);
        });

        it("should toggle visibility multiple times", () => {
            expect(useUsageStore.getState().isVisible).toBe(false);
            useUsageStore.getState().toggleVisibility();
            expect(useUsageStore.getState().isVisible).toBe(true);
            useUsageStore.getState().toggleVisibility();
            expect(useUsageStore.getState().isVisible).toBe(false);
            useUsageStore.getState().toggleVisibility();
            expect(useUsageStore.getState().isVisible).toBe(true);
        });
    });

    describe("edge cases", () => {
        it("should handle zero values", () => {
            const newData: UsageData = {
                currentSession: {
                    usageCost: 0,
                    costLimit: 1,
                    resetsIn: "5 hr 0 min",
                },
                weekly: {
                    costLikely: 0,
                    costLimit: 1,
                    resetsAt: "Mon 12:00 AM",
                },
            };

            useUsageStore.getState().setUsageData(newData);

            const state = useUsageStore.getState();
            expect(state.data?.currentSession.usageCost).toBe(0);
            expect(state.data?.weekly.costLikely).toBe(0);
        });

        it("should handle max values", () => {
            const newData: UsageData = {
                currentSession: {
                    usageCost: 1,
                    costLimit: 1,
                    resetsIn: "0 min",
                },
                weekly: {
                    costLikely: 1,
                    costLimit: 1,
                    resetsAt: "Now",
                },
            };

            useUsageStore.getState().setUsageData(newData);

            const state = useUsageStore.getState();
            expect(state.data?.currentSession.usageCost).toBe(1);
            expect(state.data?.weekly.costLikely).toBe(1);
        });

        it("should handle empty reset strings", () => {
            const newData: UsageData = {
                currentSession: {
                    usageCost: 0.5,
                    costLimit: 1,
                    resetsIn: "",
                },
                weekly: {
                    costLikely: 0.25,
                    costLimit: 1,
                    resetsAt: "",
                },
            };

            useUsageStore.getState().setUsageData(newData);

            const state = useUsageStore.getState();
            expect(state.data?.currentSession.resetsIn).toBe("");
            expect(state.data?.weekly.resetsAt).toBe("");
        });
    });

    describe("lastUpdatedAt", () => {
        it("should be null initially", () => {
            const state = useUsageStore.getState();
            expect(state.lastUpdatedAt).toBeNull();
        });

        it("should update lastUpdatedAt when setUsageData is called", () => {
            const before = Date.now();

            const newData: UsageData = {
                currentSession: {
                    usageCost: 0.5,
                    costLimit: 1,
                    resetsIn: "1 hr",
                },
                weekly: {
                    costLikely: 0.25,
                    costLimit: 1,
                    resetsAt: "Mon",
                },
            };

            useUsageStore.getState().setUsageData(newData);

            const state = useUsageStore.getState();
            expect(state.lastUpdatedAt).not.toBeNull();
            expect(state.lastUpdatedAt!.getTime()).toBeGreaterThanOrEqual(before);
        });
    });

    describe("isRefreshing", () => {
        it("should be false initially", () => {
            const state = useUsageStore.getState();
            expect(state.isRefreshing).toBe(false);
        });

        it("should set isRefreshing to true", () => {
            useUsageStore.getState().setRefreshing(true);
            expect(useUsageStore.getState().isRefreshing).toBe(true);
        });

        it("should set isRefreshing to false", () => {
            useUsageStore.setState({ isRefreshing: true });
            useUsageStore.getState().setRefreshing(false);
            expect(useUsageStore.getState().isRefreshing).toBe(false);
        });

        it("should reset isRefreshing when setUsageData is called", () => {
            useUsageStore.setState({ isRefreshing: true });

            const newData: UsageData = {
                currentSession: {
                    usageCost: 0.5,
                    costLimit: 1,
                    resetsIn: "1 hr",
                },
                weekly: {
                    costLikely: 0.25,
                    costLimit: 1,
                    resetsAt: "Mon",
                },
            };

            useUsageStore.getState().setUsageData(newData);

            expect(useUsageStore.getState().isRefreshing).toBe(false);
        });
    });

    describe("localStorage caching", () => {
        it("should save data to localStorage when setUsageData is called", () => {
            const newData: UsageData = {
                currentSession: {
                    usageCost: 0.5,
                    costLimit: 1,
                    resetsIn: "1 hr",
                },
                weekly: {
                    costLikely: 0.25,
                    costLimit: 1,
                    resetsAt: "Mon",
                },
            };

            useUsageStore.getState().setUsageData(newData);

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                "claude-usage-cache",
                expect.any(String),
            );
        });

        it("should store data with timestamp in cache", () => {
            const newData: UsageData = {
                currentSession: {
                    usageCost: 0.5,
                    costLimit: 1,
                    resetsIn: "1 hr",
                },
                weekly: {
                    costLikely: 0.25,
                    costLimit: 1,
                    resetsAt: "Mon",
                },
            };

            useUsageStore.getState().setUsageData(newData);

            // Get the stored value
            const storedValue = localStorageMock.setItem.mock.calls[0][1];
            const parsed = JSON.parse(storedValue);

            expect(parsed.data).toEqual(newData);
            expect(parsed.timestamp).toBeDefined();
            expect(typeof parsed.timestamp).toBe("number");
        });
    });

    describe("state updates", () => {
        it("should update all state properties correctly", () => {
            const newData: UsageData = {
                currentSession: {
                    usageCost: 0.75,
                    costLimit: 1,
                    resetsIn: "2 hr",
                },
                weekly: {
                    costLikely: 0.5,
                    costLimit: 1,
                    resetsAt: "Tue",
                },
            };

            useUsageStore.setState({ isRefreshing: true, isVisible: true });
            useUsageStore.getState().setUsageData(newData);

            const state = useUsageStore.getState();
            expect(state.data).toEqual(newData);
            expect(state.isVisible).toBe(true); // Should remain true
            expect(state.isRefreshing).toBe(false); // Should be reset
            expect(state.lastUpdatedAt).not.toBeNull();
        });
    });

    describe("localStorage error handling", () => {
        it("should handle localStorage.setItem throwing error", () => {
            // Mock setItem to throw
            localStorageMock.setItem.mockImplementationOnce(() => {
                throw new Error("QuotaExceededError");
            });

            const newData: UsageData = {
                currentSession: {
                    usageCost: 0.5,
                    costLimit: 1,
                    resetsIn: "1 hr",
                },
                weekly: {
                    costLikely: 0.25,
                    costLimit: 1,
                    resetsAt: "Mon",
                },
            };

            // Should not throw even when localStorage fails
            expect(() => {
                useUsageStore.getState().setUsageData(newData);
            }).not.toThrow();

            // Data should still be updated in store
            expect(useUsageStore.getState().data).toEqual(newData);
        });

        it("should continue working when localStorage is not available", () => {
            // Simulate localStorage not being available by making it throw
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error("localStorage not available");
            });
            localStorageMock.getItem.mockImplementation(() => {
                throw new Error("localStorage not available");
            });

            const newData: UsageData = {
                currentSession: {
                    usageCost: 0.75,
                    costLimit: 1,
                    resetsIn: "30 min",
                },
                weekly: {
                    costLikely: 0.5,
                    costLimit: 1,
                    resetsAt: "Wed",
                },
            };

            // Should not throw
            expect(() => {
                useUsageStore.getState().setUsageData(newData);
            }).not.toThrow();

            // Store should still update
            expect(useUsageStore.getState().data).toEqual(newData);
        });
    });

    describe("cache data validation", () => {
        it("should properly format cache timestamp", () => {
            const newData: UsageData = {
                currentSession: {
                    usageCost: 0.5,
                    costLimit: 1,
                    resetsIn: "1 hr",
                },
                weekly: {
                    costLikely: 0.25,
                    costLimit: 1,
                    resetsAt: "Mon",
                },
            };

            const beforeTime = Date.now();
            useUsageStore.getState().setUsageData(newData);
            const afterTime = Date.now();

            const storedValue = localStorageMock.setItem.mock.calls[0][1];
            const parsed = JSON.parse(storedValue);

            expect(parsed.timestamp).toBeGreaterThanOrEqual(beforeTime);
            expect(parsed.timestamp).toBeLessThanOrEqual(afterTime);
        });
    });
});

// Tests for loadCachedData function at module initialization
describe("usageStore cache loading", () => {
    beforeEach(() => {
        vi.resetModules();
        localStorageMock.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should load valid cached data on initialization", async () => {
        // Set up valid cached data (less than 1 hour old)
        const cachedData = {
            data: {
                currentSession: {
                    usageCost: 0.8,
                    costLimit: 1,
                    resetsIn: "45 min",
                },
                weekly: {
                    costLikely: 0.6,
                    costLimit: 1,
                    resetsAt: "Thu",
                },
            },
            timestamp: Date.now() - 30 * 60 * 1000, // 30 minutes ago
        };

        localStorageMock.getItem.mockReturnValue(JSON.stringify(cachedData));

        // Re-import the module to trigger loadCachedData
        const { useUsageStore: freshStore } = await import("../../webview/stores/usageStore");

        const state = freshStore.getState();
        expect(state.data?.currentSession.usageCost).toBe(0.8);
        expect(state.data?.weekly.costLikely).toBe(0.6);
        expect(state.lastUpdatedAt).not.toBeNull();
    });

    it("should ignore expired cached data (older than 30 days)", async () => {
        // Set up expired cached data (more than 30 days old)
        const cachedData = {
            data: {
                currentSession: {
                    usageCost: 0.9,
                    costLimit: 1,
                    resetsIn: "10 min",
                },
                weekly: {
                    costLikely: 0.7,
                    costLimit: 1,
                    resetsAt: "Fri",
                },
            },
            timestamp: Date.now() - 31 * 24 * 60 * 60 * 1000, // 31 days ago
        };

        localStorageMock.getItem.mockReturnValue(JSON.stringify(cachedData));

        // Re-import the module
        const { useUsageStore: freshStore } = await import("../../webview/stores/usageStore");

        const state = freshStore.getState();
        // Should have null data since cache is expired
        expect(state.data).toBeNull();
        expect(state.lastUpdatedAt).toBeNull();
    });

    it("should handle invalid JSON in cache gracefully", async () => {
        // Set up invalid JSON in localStorage
        localStorageMock.getItem.mockReturnValue("invalid json {{{");

        // Re-import the module - should not throw
        const { useUsageStore: freshStore } = await import("../../webview/stores/usageStore");

        const state = freshStore.getState();
        // Should have null data since parsing failed
        expect(state.data).toBeNull();
        expect(state.lastUpdatedAt).toBeNull();
    });

    it("should handle localStorage.getItem throwing error", async () => {
        // Make localStorage throw
        localStorageMock.getItem.mockImplementation(() => {
            throw new Error("localStorage not available");
        });

        // Re-import the module - should not throw
        const { useUsageStore: freshStore } = await import("../../webview/stores/usageStore");

        const state = freshStore.getState();
        expect(state.data).toBeNull();
        expect(state.lastUpdatedAt).toBeNull();
    });

    it("should handle empty localStorage", async () => {
        localStorageMock.getItem.mockReturnValue(null);

        const { useUsageStore: freshStore } = await import("../../webview/stores/usageStore");

        const state = freshStore.getState();
        expect(state.data).toBeNull();
        expect(state.lastUpdatedAt).toBeNull();
    });
});
