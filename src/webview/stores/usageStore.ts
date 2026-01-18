/**
 * Usage Store
 *
 * Manages the state of Claude usage data in the webview.
 * Persists data to localStorage for immediate display on load.
 */
import { create } from "zustand";
import { UsageData } from "../../shared/types/usage";

const STORAGE_KEY = "claude-usage-cache";

interface CachedUsageData {
    data: UsageData;
    timestamp: number; // Unix timestamp when cached
}

// Cache validity duration: 30 days in milliseconds
const CACHE_VALIDITY_MS = 30 * 24 * 60 * 60 * 1000;

// Try to load cached data from localStorage
const loadCachedData = (): { data: UsageData | null; lastUpdatedAt: Date | null } => {
    try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
            const parsed: CachedUsageData = JSON.parse(cached);
            // Only use cache if less than 30 days old
            const cacheExpiry = Date.now() - CACHE_VALIDITY_MS;
            if (parsed.timestamp > cacheExpiry) {
                console.log(
                    "[UsageStore] Loaded cached usage data from",
                    new Date(parsed.timestamp).toLocaleTimeString(),
                );
                return {
                    data: parsed.data,
                    lastUpdatedAt: new Date(parsed.timestamp),
                };
            }
            console.log("[UsageStore] Cached data too old (>30 days), ignoring");
        }
    } catch (e) {
        console.warn("[UsageStore] Failed to load cached data:", e);
    }
    return { data: null, lastUpdatedAt: null };
};

// Save data to localStorage
const saveToCache = (data: UsageData): void => {
    try {
        const cacheEntry: CachedUsageData = {
            data,
            timestamp: Date.now(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheEntry));
        console.log("[UsageStore] Saved usage data to cache");
    } catch (e) {
        console.warn("[UsageStore] Failed to save to cache:", e);
    }
};

// Load initial state from cache
const initialCache = loadCachedData();

interface UsageState {
    data: UsageData | null;
    isVisible: boolean;
    lastUpdatedAt: Date | null;
    isRefreshing: boolean;
}

interface UsageActions {
    setUsageData: (data: UsageData) => void;
    toggleVisibility: () => void;
    setRefreshing: (refreshing: boolean) => void;
}

export const useUsageStore = create<UsageState & UsageActions>((set) => ({
    data: initialCache.data,
    isVisible: false,
    lastUpdatedAt: initialCache.lastUpdatedAt,
    isRefreshing: false,
    setUsageData: (data) => {
        console.log("[UsageStore] ✅ setUsageData called with:", JSON.stringify(data, null, 2));
        saveToCache(data);
        set({ data, lastUpdatedAt: new Date(), isRefreshing: false });
        console.log("[UsageStore] State updated, isRefreshing set to false");
    },
    toggleVisibility: () => set((state) => ({ isVisible: !state.isVisible })),
    setRefreshing: (refreshing) => set({ isRefreshing: refreshing }),
}));
