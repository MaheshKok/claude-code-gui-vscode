/**
 * Usage Data Types
 */

export interface UsageData {
    currentSession: {
        usageCost: number;
        costLimit: number;
        resetsIn: string; // e.g. "3 hr 24 min"
    };
    weekly: {
        costLikely: number;
        costLimit: number;
        resetsAt: string; // e.g. "Thu 4:59 PM"
    };
    sonnet?: {
        usage: number;
        limit: number;
        resetsAt: string;
    };
}
