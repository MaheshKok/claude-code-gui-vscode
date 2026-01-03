/**
 * Formatting Utilities Tests
 *
 * Tests for formatting functions including timestamps, durations,
 * token counts, costs, file paths, and byte sizes.
 *
 * @module test/utils/format
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
    formatTimestamp,
    formatRelativeTime,
    formatDateForId,
    formatDuration,
    formatTimer,
    formatTokenCount,
    formatTokenUsage,
    formatContextUsage,
    formatCost,
    calculateCost,
    formatCostBreakdown,
    formatFilePath,
    truncateMiddle,
    getFileExtension,
    getFilename,
    getDirectory,
    formatBytes,
    parseBytes,
    formatNumber,
    formatPercentage,
    formatCompact,
} from "../../webview/utils/format";

describe("format utilities", () => {
    // ==========================================================================
    // formatTimestamp Tests
    // ==========================================================================
    describe("formatTimestamp", () => {
        const testDate = new Date("2024-06-15T14:30:45.000Z");

        it("should format timestamp with default options", () => {
            const result = formatTimestamp(testDate);
            // Default is 12-hour format without date
            expect(result).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/i);
        });

        it("should format timestamp from number", () => {
            const result = formatTimestamp(testDate.getTime());
            expect(result).toMatch(/\d{1,2}:\d{2}/);
        });

        it("should include date when requested", () => {
            const result = formatTimestamp(testDate, { includeDate: true });
            expect(result).toMatch(/\w+\s+\d+/); // Month Day pattern
        });

        it("should include seconds when requested", () => {
            const result = formatTimestamp(testDate, { includeSeconds: true });
            expect(result).toMatch(/\d{1,2}:\d{2}:\d{2}/);
        });

        it("should use 24-hour format when requested", () => {
            const result = formatTimestamp(testDate, { use24Hour: true });
            // Should not contain AM/PM
            expect(result).not.toMatch(/AM|PM/i);
        });

        it("should include year for dates not in current year", () => {
            const oldDate = new Date("2020-01-01T12:00:00.000Z");
            const result = formatTimestamp(oldDate, { includeDate: true });
            expect(result).toContain("2020");
        });
    });

    // ==========================================================================
    // formatRelativeTime Tests
    // ==========================================================================
    describe("formatRelativeTime", () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should return "just now" for recent times', () => {
            const now = Date.now();
            vi.setSystemTime(now);
            const result = formatRelativeTime(now - 2000);
            expect(result).toBe("just now");
        });

        it("should format seconds ago", () => {
            const now = Date.now();
            vi.setSystemTime(now);
            const result = formatRelativeTime(now - 30000);
            expect(result).toBe("30 seconds ago");
        });

        it("should format 1 minute ago", () => {
            const now = Date.now();
            vi.setSystemTime(now);
            const result = formatRelativeTime(now - 60000);
            expect(result).toBe("1 minute ago");
        });

        it("should format multiple minutes ago", () => {
            const now = Date.now();
            vi.setSystemTime(now);
            const result = formatRelativeTime(now - 300000);
            expect(result).toBe("5 minutes ago");
        });

        it("should format 1 hour ago", () => {
            const now = Date.now();
            vi.setSystemTime(now);
            const result = formatRelativeTime(now - 3600000);
            expect(result).toBe("1 hour ago");
        });

        it("should format multiple hours ago", () => {
            const now = Date.now();
            vi.setSystemTime(now);
            const result = formatRelativeTime(now - 7200000);
            expect(result).toBe("2 hours ago");
        });

        it('should return "yesterday" for 1 day ago', () => {
            const now = Date.now();
            vi.setSystemTime(now);
            const result = formatRelativeTime(now - 86400000);
            expect(result).toBe("yesterday");
        });

        it("should format days ago", () => {
            const now = Date.now();
            vi.setSystemTime(now);
            const result = formatRelativeTime(now - 3 * 86400000);
            expect(result).toBe("3 days ago");
        });

        it("should format weeks ago", () => {
            const now = Date.now();
            vi.setSystemTime(now);
            const result = formatRelativeTime(now - 14 * 86400000);
            expect(result).toBe("2 weeks ago");
        });

        it("should format months ago", () => {
            const now = Date.now();
            vi.setSystemTime(now);
            const result = formatRelativeTime(now - 60 * 86400000);
            expect(result).toBe("2 months ago");
        });

        it("should format years ago", () => {
            const now = Date.now();
            vi.setSystemTime(now);
            const result = formatRelativeTime(now - 400 * 86400000);
            expect(result).toBe("1 year ago");
        });

        it("should accept Date object", () => {
            const now = Date.now();
            vi.setSystemTime(now);
            const date = new Date(now - 60000);
            const result = formatRelativeTime(date);
            expect(result).toBe("1 minute ago");
        });
    });

    // ==========================================================================
    // formatDateForId Tests
    // ==========================================================================
    describe("formatDateForId", () => {
        it("should format date without special characters", () => {
            const date = new Date("2024-06-15T14:30:45.000Z");
            const result = formatDateForId(date);

            expect(result).not.toContain(":");
            expect(result).not.toContain(".");
            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/);
        });

        it("should use current date when no date provided", () => {
            const result = formatDateForId();
            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/);
        });
    });

    // ==========================================================================
    // formatDuration Tests
    // ==========================================================================
    describe("formatDuration", () => {
        it("should format milliseconds", () => {
            const result = formatDuration(500);
            expect(result).toBe("500ms");
        });

        it("should format seconds", () => {
            const result = formatDuration(5000);
            expect(result).toBe("5s");
        });

        it("should format minutes and seconds", () => {
            const result = formatDuration(65000);
            expect(result).toBe("1m 5s");
        });

        it("should format hours, minutes, and seconds", () => {
            const result = formatDuration(3665000);
            expect(result).toBe("1h 1m 5s");
        });

        it("should handle negative duration", () => {
            const result = formatDuration(-1000);
            expect(result).toBe("0ms");
        });

        it("should use non-abbreviated format", () => {
            const result = formatDuration(65000, { abbreviated: false });
            expect(result).toBe("1 minute 5 seconds");
        });

        it("should handle plural correctly", () => {
            const result = formatDuration(2 * 60 * 60 * 1000, { abbreviated: false });
            expect(result).toContain("hours");
        });

        it("should show milliseconds when precision is milliseconds", () => {
            const result = formatDuration(1500, { precision: "milliseconds" });
            expect(result).toContain("ms");
        });

        it("should use leading zeros when requested", () => {
            const result = formatDuration(65000, { leadingZeros: true });
            expect(result).toBe("01m 05s");
        });
    });

    // ==========================================================================
    // formatTimer Tests
    // ==========================================================================
    describe("formatTimer", () => {
        it("should format as MM:SS for under an hour", () => {
            const result = formatTimer(65000);
            expect(result).toBe("01:05");
        });

        it("should format as HH:MM:SS for over an hour", () => {
            const result = formatTimer(3665000);
            expect(result).toBe("01:01:05");
        });

        it("should pad single digits", () => {
            const result = formatTimer(5000);
            expect(result).toBe("00:05");
        });
    });

    // ==========================================================================
    // formatTokenCount Tests
    // ==========================================================================
    describe("formatTokenCount", () => {
        it("should format small numbers directly", () => {
            const result = formatTokenCount(500);
            expect(result).toBe("500 tokens");
        });

        it("should use singular for 1 token", () => {
            const result = formatTokenCount(1);
            expect(result).toBe("1 token");
        });

        it("should abbreviate thousands as K", () => {
            const result = formatTokenCount(5000);
            expect(result).toBe("5.0K tokens");
        });

        it("should abbreviate millions as M", () => {
            const result = formatTokenCount(1500000);
            expect(result).toBe("1.5M tokens");
        });

        it("should omit suffix when requested", () => {
            const result = formatTokenCount(1000, { includeSuffix: false });
            expect(result).toBe("1.0K");
        });

        it("should not abbreviate when disabled", () => {
            const result = formatTokenCount(1000, { abbreviated: false });
            expect(result).toBe("1,000 tokens");
        });

        it("should respect decimal places", () => {
            const result = formatTokenCount(1500, { decimals: 2 });
            expect(result).toBe("1.50K tokens");
        });
    });

    // ==========================================================================
    // formatTokenUsage Tests
    // ==========================================================================
    describe("formatTokenUsage", () => {
        it("should format input and output tokens", () => {
            const result = formatTokenUsage({
                input_tokens: 1000,
                output_tokens: 500,
            });

            expect(result).toContain("In: 1.0K");
            expect(result).toContain("Out: 500");
        });

        it("should include cache tokens when present", () => {
            const result = formatTokenUsage({
                input_tokens: 1000,
                output_tokens: 500,
                cache_read_input_tokens: 200,
            });

            expect(result).toContain("Cache: 200");
        });

        it("should not include cache when zero", () => {
            const result = formatTokenUsage({
                input_tokens: 1000,
                output_tokens: 500,
                cache_read_input_tokens: 0,
            });

            expect(result).not.toContain("Cache:");
        });
    });

    // ==========================================================================
    // formatContextUsage Tests
    // ==========================================================================
    describe("formatContextUsage", () => {
        it("should format context usage with percentage", () => {
            const result = formatContextUsage(100000);
            expect(result).toMatch(/100\.0K \/ \d+(\.\d+)?K \(\d+\.\d+%\)/);
        });

        it("should use model-specific context window", () => {
            const result = formatContextUsage(50000, "claude-sonnet-4-20250514");
            expect(result).toContain("(25.0%)");
        });
    });

    // ==========================================================================
    // formatCost Tests
    // ==========================================================================
    describe("formatCost", () => {
        it('should return "Free" for zero cost', () => {
            const result = formatCost(0);
            expect(result).toBe("Free");
        });

        it("should format cost in USD", () => {
            const result = formatCost(1.5);
            expect(result).toBe("$1.50");
        });

        it("should use more decimals for small values", () => {
            const result = formatCost(0.001);
            expect(result).toMatch(/\$0\.00\d+/);
        });

        it('should not show "Free" when disabled', () => {
            const result = formatCost(0, { showFreeForZero: false });
            expect(result).toBe("$0.00");
        });
    });

    // ==========================================================================
    // calculateCost Tests
    // ==========================================================================
    describe("calculateCost", () => {
        it("should calculate cost from token usage", () => {
            const usage = {
                input_tokens: 1000000,
                output_tokens: 500000,
            };
            const cost = calculateCost(usage);

            // Default pricing: input $3/M, output $15/M
            // 1M input = $3, 0.5M output = $7.5
            expect(cost).toBeCloseTo(10.5, 1);
        });

        it("should include cache costs", () => {
            const usage = {
                input_tokens: 0,
                output_tokens: 0,
                cache_read_input_tokens: 1000000,
                cache_creation_input_tokens: 1000000,
            };
            const cost = calculateCost(usage);

            expect(cost).toBeGreaterThan(0);
        });

        it("should use model-specific pricing", () => {
            const usage = {
                input_tokens: 1000000,
                output_tokens: 1000000,
            };

            // Use model names that exist in TOKEN_PRICING
            const opusCost = calculateCost(usage, "claude-opus-4-5-20251101");
            const haikuCost = calculateCost(usage, "claude-haiku-4-5-20251001");

            expect(opusCost).toBeGreaterThan(haikuCost);
        });
    });

    // ==========================================================================
    // formatCostBreakdown Tests
    // ==========================================================================
    describe("formatCostBreakdown", () => {
        it("should include input and output costs", () => {
            const result = formatCostBreakdown({
                input_tokens: 1000000,
                output_tokens: 500000,
            });

            expect(result).toContain("Input:");
            expect(result).toContain("Output:");
            expect(result).toContain("Total:");
        });

        it("should include cache read cost when present", () => {
            const result = formatCostBreakdown({
                input_tokens: 0,
                output_tokens: 0,
                cache_read_input_tokens: 1000000,
            });

            expect(result).toContain("Cache read:");
        });
    });

    // ==========================================================================
    // formatFilePath Tests
    // ==========================================================================
    describe("formatFilePath", () => {
        it("should return empty string for empty path", () => {
            expect(formatFilePath("")).toBe("");
        });

        it("should replace home directory with tilde", () => {
            const result = formatFilePath("/Users/john/documents/file.txt");
            expect(result).toContain("~");
            expect(result).not.toContain("/Users/john");
        });

        it("should handle Windows home directory", () => {
            const result = formatFilePath("C:/Users/john/documents/file.txt");
            expect(result).toContain("~");
        });

        it("should return only filename when requested", () => {
            const result = formatFilePath("/path/to/file.txt", {
                filenameOnly: true,
            });
            expect(result).toBe("file.txt");
        });

        it("should truncate long paths", () => {
            const longPath = "/Users/john/very/long/nested/directory/structure/file.txt";
            const result = formatFilePath(longPath, { maxLength: 30 });

            expect(result.length).toBeLessThanOrEqual(30);
            expect(result).toContain("...");
        });

        it("should keep specified parent directories", () => {
            // Use a path long enough to trigger truncation (32 chars > maxLength 25)
            // Path: /some/deep/nested/path/to/file.txt = 34 chars
            const result = formatFilePath("/some/deep/nested/path/to/file.txt", {
                maxLength: 25,
                parentDirs: 2,
            });
            expect(result).toContain(".../");
            expect(result).toContain("file.txt");
        });

        it("should normalize path separators", () => {
            const result = formatFilePath("path\\to\\file.txt");
            expect(result).not.toContain("\\");
            expect(result).toContain("/");
        });
    });

    // ==========================================================================
    // truncateMiddle Tests
    // ==========================================================================
    describe("truncateMiddle", () => {
        it("should return original string if short enough", () => {
            const result = truncateMiddle("short", 10);
            expect(result).toBe("short");
        });

        it("should truncate in the middle", () => {
            const result = truncateMiddle("this is a long string", 15);
            expect(result.length).toBe(15);
            expect(result).toContain("...");
        });

        it("should keep beginning and end", () => {
            const result = truncateMiddle("abcdefghij", 7);
            expect(result.startsWith("ab")).toBe(true);
            expect(result.endsWith("ij")).toBe(true);
        });
    });

    // ==========================================================================
    // getFileExtension Tests
    // ==========================================================================
    describe("getFileExtension", () => {
        it("should extract extension", () => {
            expect(getFileExtension("file.txt")).toBe("txt");
            expect(getFileExtension("file.test.ts")).toBe("ts");
        });

        it("should return lowercase extension", () => {
            expect(getFileExtension("file.TXT")).toBe("txt");
        });

        it("should return empty for no extension", () => {
            expect(getFileExtension("file")).toBe("");
            expect(getFileExtension(".gitignore")).toBe("gitignore");
        });

        it("should handle paths", () => {
            expect(getFileExtension("/path/to/file.js")).toBe("js");
        });
    });

    // ==========================================================================
    // getFilename Tests
    // ==========================================================================
    describe("getFilename", () => {
        it("should extract filename from path", () => {
            expect(getFilename("/path/to/file.txt")).toBe("file.txt");
        });

        it("should handle Windows paths", () => {
            expect(getFilename("C:\\path\\to\\file.txt")).toBe("file.txt");
        });

        it("should return filename if no path", () => {
            expect(getFilename("file.txt")).toBe("file.txt");
        });
    });

    // ==========================================================================
    // getDirectory Tests
    // ==========================================================================
    describe("getDirectory", () => {
        it("should extract directory from path", () => {
            expect(getDirectory("/path/to/file.txt")).toBe("/path/to");
        });

        it("should return root for root-level file", () => {
            expect(getDirectory("/file.txt")).toBe("/");
        });

        it("should handle Windows paths", () => {
            expect(getDirectory("C:\\path\\to\\file.txt")).toBe("C:/path/to");
        });
    });

    // ==========================================================================
    // formatBytes Tests
    // ==========================================================================
    describe("formatBytes", () => {
        it("should format bytes", () => {
            expect(formatBytes(500)).toBe("500 B");
        });

        it("should format kilobytes (binary)", () => {
            expect(formatBytes(1024)).toBe("1 KiB");
        });

        it("should format megabytes", () => {
            expect(formatBytes(1024 * 1024)).toBe("1 MiB");
        });

        it("should format gigabytes", () => {
            expect(formatBytes(1024 * 1024 * 1024)).toBe("1 GiB");
        });

        it("should use decimal units when requested", () => {
            const result = formatBytes(1000, { binary: false });
            expect(result).toBe("1 KB");
        });

        it("should handle zero", () => {
            expect(formatBytes(0)).toBe("0 B");
        });

        it("should omit suffix when requested", () => {
            expect(formatBytes(1024, { includeSuffix: false })).toBe("1");
        });

        it("should respect decimal places", () => {
            expect(formatBytes(1536, { decimals: 1 })).toBe("1.5 KiB");
        });
    });

    // ==========================================================================
    // parseBytes Tests
    // ==========================================================================
    describe("parseBytes", () => {
        it("should parse bytes", () => {
            expect(parseBytes("500")).toBe(500);
            expect(parseBytes("500B")).toBe(500);
        });

        it("should parse kilobytes", () => {
            expect(parseBytes("1KB")).toBe(1000);
            expect(parseBytes("1KiB")).toBe(1024);
            expect(parseBytes("1K")).toBe(1024);
        });

        it("should parse megabytes", () => {
            expect(parseBytes("1MB")).toBe(1000000);
            expect(parseBytes("1MiB")).toBe(1048576);
        });

        it("should parse gigabytes", () => {
            expect(parseBytes("1GB")).toBe(1000000000);
            expect(parseBytes("1GiB")).toBe(1073741824);
        });

        it("should handle spaces", () => {
            expect(parseBytes("1 KB")).toBe(1000);
            expect(parseBytes("  1  MB  ")).toBe(1000000);
        });

        it("should return 0 for invalid input", () => {
            expect(parseBytes("")).toBe(0);
            expect(parseBytes("abc")).toBe(0);
        });
    });

    // ==========================================================================
    // formatNumber Tests
    // ==========================================================================
    describe("formatNumber", () => {
        it("should format with thousand separators", () => {
            const result = formatNumber(1000000);
            expect(result).toBe("1,000,000");
        });

        it("should respect decimal places", () => {
            const result = formatNumber(1234.5678, { decimals: 2 });
            expect(result).toBe("1,234.57");
        });
    });

    // ==========================================================================
    // formatPercentage Tests
    // ==========================================================================
    describe("formatPercentage", () => {
        it("should format as percentage", () => {
            expect(formatPercentage(75.5)).toBe("75.5%");
        });

        it("should respect decimal places", () => {
            expect(formatPercentage(75.555, { decimals: 2 })).toBe("75.56%");
        });

        it("should omit sign when requested", () => {
            expect(formatPercentage(75.5, { includeSign: false })).toBe("75.5");
        });
    });

    // ==========================================================================
    // formatCompact Tests
    // ==========================================================================
    describe("formatCompact", () => {
        it("should format thousands as K", () => {
            expect(formatCompact(1500)).toBe("1.5K");
        });

        it("should format millions as M", () => {
            expect(formatCompact(1500000)).toBe("1.5M");
        });

        it("should format billions as B", () => {
            expect(formatCompact(1500000000)).toBe("1.5B");
        });

        it("should not abbreviate small numbers", () => {
            expect(formatCompact(999)).toBe("999");
        });

        it("should handle negative numbers", () => {
            expect(formatCompact(-1500)).toBe("-1.5K");
        });
    });
});
