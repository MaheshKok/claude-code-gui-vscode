import { describe, it, expect } from "vitest";
import {
    STATUS_LABELS,
    STATUS_CLASSES,
} from "../../webview/components/Chat/JourneyTimeline/constants";

describe("JourneyTimeline Constants", () => {
    describe("STATUS_LABELS", () => {
        it("should have label for executing", () => {
            expect(STATUS_LABELS.executing).toBe("Running");
        });

        it("should have label for pending", () => {
            expect(STATUS_LABELS.pending).toBe("Pending");
        });

        it("should have label for completed", () => {
            expect(STATUS_LABELS.completed).toBe("Completed");
        });

        it("should have label for failed", () => {
            expect(STATUS_LABELS.failed).toBe("Failed");
        });

        it("should have label for denied", () => {
            expect(STATUS_LABELS.denied).toBe("Denied");
        });
    });

    describe("STATUS_CLASSES", () => {
        it("should have classes for running", () => {
            expect(STATUS_CLASSES.running).toContain("bg-blue-500/10");
            expect(STATUS_CLASSES.running).toContain("text-blue-400");
        });

        it("should have classes for executing", () => {
            expect(STATUS_CLASSES.executing).toContain("bg-blue-500/10");
            expect(STATUS_CLASSES.executing).toContain("text-blue-400");
        });

        it("should have classes for pending", () => {
            expect(STATUS_CLASSES.pending).toContain("bg-white/5");
            expect(STATUS_CLASSES.pending).toContain("text-white/40");
        });

        it("should have classes for completed", () => {
            expect(STATUS_CLASSES.completed).toContain("bg-green-500/10");
            expect(STATUS_CLASSES.completed).toContain("text-green-400");
        });

        it("should have classes for failed", () => {
            expect(STATUS_CLASSES.failed).toContain("bg-red-500/10");
            expect(STATUS_CLASSES.failed).toContain("text-red-400");
        });

        it("should have classes for denied", () => {
            expect(STATUS_CLASSES.denied).toContain("bg-yellow-500/10");
            expect(STATUS_CLASSES.denied).toContain("text-yellow-400");
        });
    });
});
