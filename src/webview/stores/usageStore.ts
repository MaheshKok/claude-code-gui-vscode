/**
 * Usage Store
 *
 * Manages the state of Claude usage data in the webview.
 */
import { create } from "zustand";
import { UsageData } from "../../shared/types/usage";

// Default mock data (until real data arrives)
const defaultUsageData: UsageData = {
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
};

interface UsageState {
    data: UsageData | null;
    isVisible: boolean;
}

interface UsageActions {
    setUsageData: (data: UsageData) => void;
    toggleVisibility: () => void;
}

export const useUsageStore = create<UsageState & UsageActions>((set) => ({
    data: defaultUsageData,
    isVisible: false,
    setUsageData: (data) => set({ data }),
    toggleVisibility: () => set((state) => ({ isVisible: !state.isVisible })),
}));
