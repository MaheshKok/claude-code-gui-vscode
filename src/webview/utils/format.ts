/**
 * Formatting Utilities
 *
 * Provides functions for formatting various data types for display,
 * including timestamps, durations, token counts, costs, file paths,
 * and byte sizes.
 *
 * @module utils/format
 */

import { TOKEN_PRICING, CONTEXT_WINDOW_SIZES } from "./constants";

// ============================================================================
// Timestamp Formatting
// ============================================================================

/**
 * Options for timestamp formatting
 */
export interface TimestampOptions {
    /** Whether to include the date */
    includeDate?: boolean;
    /** Whether to include seconds */
    includeSeconds?: boolean;
    /** Whether to use 24-hour format */
    use24Hour?: boolean;
    /** Whether to show relative time (e.g., "2 minutes ago") */
    relative?: boolean;
    /** Locale for formatting */
    locale?: string;
}

const defaultTimestampOptions: TimestampOptions = {
    includeDate: false,
    includeSeconds: false,
    use24Hour: false,
    relative: false,
    locale: "en-US",
};

/**
 * Format a timestamp for display
 */
export function formatTimestamp(timestamp: number | Date, options: TimestampOptions = {}): string {
    const opts = { ...defaultTimestampOptions, ...options };
    const date = typeof timestamp === "number" ? new Date(timestamp) : timestamp;

    if (opts.relative) {
        return formatRelativeTime(date);
    }

    const timeOptions: Intl.DateTimeFormatOptions = {
        hour: "numeric",
        minute: "2-digit",
        hour12: !opts.use24Hour,
    };

    if (opts.includeSeconds) {
        timeOptions.second = "2-digit";
    }

    if (opts.includeDate) {
        timeOptions.month = "short";
        timeOptions.day = "numeric";

        // Include year if not current year
        if (date.getFullYear() !== new Date().getFullYear()) {
            timeOptions.year = "numeric";
        }
    }

    return date.toLocaleString(opts.locale, timeOptions);
}

/**
 * Format a date as relative time (e.g., "2 minutes ago")
 */
export function formatRelativeTime(date: Date | number): string {
    const now = Date.now();
    const timestamp = typeof date === "number" ? date : date.getTime();
    const diff = now - timestamp;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 5) return "just now";
    if (seconds < 60) return `${seconds} seconds ago`;
    if (minutes === 1) return "1 minute ago";
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours === 1) return "1 hour ago";
    if (hours < 24) return `${hours} hours ago`;
    if (days === 1) return "yesterday";
    if (days < 7) return `${days} days ago`;
    if (weeks === 1) return "1 week ago";
    if (weeks < 4) return `${weeks} weeks ago`;
    if (months === 1) return "1 month ago";
    if (months < 12) return `${months} months ago`;
    if (years === 1) return "1 year ago";
    return `${years} years ago`;
}

/**
 * Format a date for file names or IDs (no special characters)
 */
export function formatDateForId(date: Date = new Date()): string {
    return date.toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

// ============================================================================
// Duration Formatting
// ============================================================================

/**
 * Options for duration formatting
 */
export interface DurationOptions {
    /** Precision for the output */
    precision?: "seconds" | "milliseconds" | "auto";
    /** Whether to use abbreviated units (s, ms, m, h) */
    abbreviated?: boolean;
    /** Whether to show leading zeros */
    leadingZeros?: boolean;
}

/**
 * Format a duration in milliseconds for display
 */
export function formatDuration(durationMs: number, options: DurationOptions = {}): string {
    const { precision = "auto", abbreviated = true, leadingZeros = false } = options;

    if (durationMs < 0) {
        return abbreviated ? "0ms" : "0 milliseconds";
    }

    const milliseconds = durationMs % 1000;
    const totalSeconds = Math.floor(durationMs / 1000);
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const hours = Math.floor(totalMinutes / 60);

    const parts: string[] = [];

    // Determine whether to show milliseconds
    const showMs = precision === "milliseconds" || (precision === "auto" && durationMs < 1000);

    if (hours > 0) {
        const h = leadingZeros && hours < 10 ? `0${hours}` : `${hours}`;
        parts.push(abbreviated ? `${h}h` : `${hours} hour${hours !== 1 ? "s" : ""}`);
    }

    if (minutes > 0 || hours > 0) {
        const m = leadingZeros && minutes < 10 ? `0${minutes}` : `${minutes}`;
        parts.push(abbreviated ? `${m}m` : `${minutes} minute${minutes !== 1 ? "s" : ""}`);
    }

    if (seconds > 0 || (!showMs && parts.length === 0)) {
        const s = leadingZeros && seconds < 10 ? `0${seconds}` : `${seconds}`;
        parts.push(abbreviated ? `${s}s` : `${seconds} second${seconds !== 1 ? "s" : ""}`);
    }

    if (showMs && milliseconds > 0) {
        parts.push(abbreviated ? `${milliseconds}ms` : `${milliseconds} milliseconds`);
    }

    if (parts.length === 0) {
        return abbreviated ? "0ms" : "0 milliseconds";
    }

    return parts.join(" ");
}

/**
 * Format duration as a timer string (HH:MM:SS or MM:SS)
 */
export function formatTimer(durationMs: number): string {
    const totalSeconds = Math.floor(durationMs / 1000);
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const hours = Math.floor(totalMinutes / 60);

    const pad = (n: number): string => n.toString().padStart(2, "0");

    if (hours > 0) {
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }

    return `${pad(minutes)}:${pad(seconds)}`;
}

// ============================================================================
// Token Formatting
// ============================================================================

/**
 * Options for token formatting
 */
export interface TokenOptions {
    /** Whether to include the "tokens" suffix */
    includeSuffix?: boolean;
    /** Whether to use abbreviated format (K, M) */
    abbreviated?: boolean;
    /** Number of decimal places for abbreviated format */
    decimals?: number;
}

/**
 * Format a token count for display
 */
export function formatTokenCount(count: number, options: TokenOptions = {}): string {
    const { includeSuffix = true, abbreviated = true, decimals = 1 } = options;

    let formatted: string;

    if (abbreviated) {
        if (count >= 1000000) {
            formatted = `${(count / 1000000).toFixed(decimals)}M`;
        } else if (count >= 1000) {
            formatted = `${(count / 1000).toFixed(decimals)}K`;
        } else {
            formatted = count.toString();
        }
    } else {
        formatted = count.toLocaleString();
    }

    if (includeSuffix) {
        formatted += count === 1 ? " token" : " tokens";
    }

    return formatted;
}

/**
 * Format tokens in compact form for UI display (no suffix, abbreviated)
 *
 * This is a convenience function that provides the common pattern:
 * `formatTokenCount(tokens, { includeSuffix: false, abbreviated: true })`
 *
 * @param tokens - Number of tokens to format
 * @returns Formatted string (e.g., "1.5K", "2.3M", "500")
 */
export function formatTokensCompact(tokens: number): string {
    return formatTokenCount(tokens, { includeSuffix: false, abbreviated: true });
}

/**
 * Format token usage breakdown
 */
export interface TokenUsageInfo {
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
}

export function formatTokenUsage(usage: TokenUsageInfo): string {
    const parts: string[] = [];

    parts.push(`In: ${formatTokenCount(usage.input_tokens, { includeSuffix: false })}`);
    parts.push(`Out: ${formatTokenCount(usage.output_tokens, { includeSuffix: false })}`);

    if (usage.cache_read_input_tokens && usage.cache_read_input_tokens > 0) {
        parts.push(
            `Cache: ${formatTokenCount(usage.cache_read_input_tokens, { includeSuffix: false })}`,
        );
    }

    return parts.join(" | ");
}

/**
 * Calculate and format context usage percentage
 */
export function formatContextUsage(usedTokens: number, model: string = "default"): string {
    const maxTokens = CONTEXT_WINDOW_SIZES[model] || CONTEXT_WINDOW_SIZES.default;
    const percentage = (usedTokens / maxTokens) * 100;

    return `${formatTokenCount(usedTokens, { includeSuffix: false })} / ${formatTokenCount(maxTokens, { includeSuffix: false })} (${percentage.toFixed(1)}%)`;
}

// ============================================================================
// Cost Formatting
// ============================================================================

/**
 * Options for cost formatting
 */
export interface CostOptions {
    /** Currency code */
    currency?: string;
    /** Minimum fraction digits */
    minDecimals?: number;
    /** Maximum fraction digits */
    maxDecimals?: number;
    /** Whether to show free for zero cost */
    showFreeForZero?: boolean;
}

/**
 * Format a cost in USD for display
 */
export function formatCost(costUsd: number, options: CostOptions = {}): string {
    const { currency = "USD", minDecimals = 2, maxDecimals = 6, showFreeForZero = true } = options;

    if (costUsd === 0 && showFreeForZero) {
        return "Free";
    }

    // Determine appropriate decimal places based on value
    let decimals = minDecimals;
    if (costUsd > 0 && costUsd < 0.01) {
        decimals = Math.max(
            minDecimals,
            Math.min(maxDecimals, -Math.floor(Math.log10(costUsd)) + 1),
        );
    }

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(costUsd);
}

/**
 * Calculate cost from token usage
 */
export function calculateCost(usage: TokenUsageInfo, model: string = "default"): number {
    const pricing = TOKEN_PRICING[model as keyof typeof TOKEN_PRICING] || TOKEN_PRICING.default;

    const inputCost = (usage.input_tokens / 1_000_000) * pricing.input;
    const outputCost = (usage.output_tokens / 1_000_000) * pricing.output;
    const cacheReadCost = ((usage.cache_read_input_tokens || 0) / 1_000_000) * pricing.cacheRead;
    const cacheWriteCost =
        ((usage.cache_creation_input_tokens || 0) / 1_000_000) * pricing.cacheWrite;

    return inputCost + outputCost + cacheReadCost + cacheWriteCost;
}

/**
 * Format cost with breakdown
 */
export function formatCostBreakdown(usage: TokenUsageInfo, model: string = "default"): string {
    const pricing = TOKEN_PRICING[model as keyof typeof TOKEN_PRICING] || TOKEN_PRICING.default;

    const inputCost = (usage.input_tokens / 1_000_000) * pricing.input;
    const outputCost = (usage.output_tokens / 1_000_000) * pricing.output;

    const parts: string[] = [
        `Input: ${formatCost(inputCost)}`,
        `Output: ${formatCost(outputCost)}`,
    ];

    if (usage.cache_read_input_tokens && usage.cache_read_input_tokens > 0) {
        const cacheReadCost = (usage.cache_read_input_tokens / 1_000_000) * pricing.cacheRead;
        parts.push(`Cache read: ${formatCost(cacheReadCost)}`);
    }

    const total = calculateCost(usage, model);
    parts.push(`Total: ${formatCost(total)}`);

    return parts.join(" | ");
}

// ============================================================================
// File Path Formatting
// ============================================================================

/**
 * Options for file path formatting
 */
export interface FilePathOptions {
    /** Maximum length before truncation */
    maxLength?: number;
    /** Whether to show home directory as ~ */
    homeAsTilde?: boolean;
    /** Whether to show only the filename */
    filenameOnly?: boolean;
    /** Number of parent directories to show */
    parentDirs?: number;
}

/**
 * Format a file path for display (with truncation)
 */
export function formatFilePath(path: string, options: FilePathOptions = {}): string {
    const { maxLength = 50, homeAsTilde = true, filenameOnly = false, parentDirs = 2 } = options;

    if (!path) return "";

    // Normalize path separators
    let formatted = path.replace(/\\/g, "/");

    // Replace home directory with ~
    if (homeAsTilde) {
        // Common home directory patterns
        formatted = formatted.replace(/^\/Users\/[^/]+/, "~");
        formatted = formatted.replace(/^\/home\/[^/]+/, "~");
        formatted = formatted.replace(/^C:\/Users\/[^/]+/i, "~");
    }

    // Return only filename if requested
    if (filenameOnly) {
        const parts = formatted.split("/");
        return parts[parts.length - 1];
    }

    // If already short enough, return as-is
    if (formatted.length <= maxLength) {
        return formatted;
    }

    // Truncate path keeping filename and some parent directories
    const parts = formatted.split("/");
    const filename = parts.pop() || "";

    if (filename.length >= maxLength) {
        // Truncate filename itself
        return truncateMiddle(filename, maxLength);
    }

    // Keep last N parent directories
    const parentsToShow = parts.slice(-parentDirs);
    let result = parentsToShow.join("/");

    if (parentsToShow.length < parts.length) {
        result = ".../" + result;
    }

    result = result + "/" + filename;

    if (result.length > maxLength) {
        return truncateMiddle(result, maxLength);
    }

    return result;
}

/**
 * Truncate a string in the middle
 */
export function truncateMiddle(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;

    const ellipsis = "...";
    const charsToShow = maxLength - ellipsis.length;
    const frontChars = Math.ceil(charsToShow / 2);
    const backChars = Math.floor(charsToShow / 2);

    return str.slice(0, frontChars) + ellipsis + str.slice(-backChars);
}

/**
 * Get file extension from path
 */
export function getFileExtension(path: string): string {
    const match = path.match(/\.([^./\\]+)$/);
    return match ? match[1].toLowerCase() : "";
}

/**
 * Get filename from path
 */
export function getFilename(path: string): string {
    const normalized = path.replace(/\\/g, "/");
    const parts = normalized.split("/");
    return parts[parts.length - 1];
}

/**
 * Get directory from path
 */
export function getDirectory(path: string): string {
    const normalized = path.replace(/\\/g, "/");
    const parts = normalized.split("/");
    parts.pop();
    return parts.join("/") || "/";
}

// ============================================================================
// Byte Size Formatting
// ============================================================================

/**
 * Options for byte size formatting
 */
export interface ByteOptions {
    /** Whether to use binary (1024) or decimal (1000) units */
    binary?: boolean;
    /** Number of decimal places */
    decimals?: number;
    /** Whether to include the unit suffix */
    includeSuffix?: boolean;
}

const BYTE_UNITS_BINARY = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"];
const BYTE_UNITS_DECIMAL = ["B", "KB", "MB", "GB", "TB", "PB"];

/**
 * Format a byte count for display
 */
export function formatBytes(bytes: number, options: ByteOptions = {}): string {
    const { binary = true, decimals = 2, includeSuffix = true } = options;

    if (bytes === 0) {
        return includeSuffix ? "0 B" : "0";
    }

    const base = binary ? 1024 : 1000;
    const units = binary ? BYTE_UNITS_BINARY : BYTE_UNITS_DECIMAL;

    const exponent = Math.min(
        Math.floor(Math.log(Math.abs(bytes)) / Math.log(base)),
        units.length - 1,
    );

    const value = bytes / Math.pow(base, exponent);
    const formatted = value.toFixed(decimals);

    // Remove trailing zeros
    const trimmed = parseFloat(formatted).toString();

    if (includeSuffix) {
        return `${trimmed} ${units[exponent]}`;
    }

    return trimmed;
}

/**
 * Parse a byte size string back to number
 */
export function parseBytes(sizeStr: string): number {
    const match = sizeStr.trim().match(/^([\d.]+)\s*([a-z]*)/i);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();

    const unitMap: Record<string, number> = {
        "": 1,
        B: 1,
        KB: 1000,
        KIB: 1024,
        K: 1024,
        MB: 1000000,
        MIB: 1048576,
        M: 1048576,
        GB: 1000000000,
        GIB: 1073741824,
        G: 1073741824,
        TB: 1000000000000,
        TIB: 1099511627776,
        T: 1099511627776,
    };

    return Math.round(value * (unitMap[unit] || 1));
}

// ============================================================================
// Number Formatting
// ============================================================================

/**
 * Format a number with thousand separators
 */
export function formatNumber(
    num: number,
    options: { decimals?: number; locale?: string } = {},
): string {
    const { decimals, locale = "en-US" } = options;

    if (decimals !== undefined) {
        return num.toLocaleString(locale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
    }

    return num.toLocaleString(locale);
}

/**
 * Format a number as a percentage
 */
export function formatPercentage(
    value: number,
    options: { decimals?: number; includeSign?: boolean } = {},
): string {
    const { decimals = 1, includeSign = true } = options;
    const formatted = value.toFixed(decimals);
    return includeSign ? `${formatted}%` : formatted;
}

/**
 * Format a number in compact notation (K, M, B)
 */
export function formatCompact(num: number): string {
    if (Math.abs(num) >= 1e9) {
        return (num / 1e9).toFixed(1) + "B";
    }
    if (Math.abs(num) >= 1e6) {
        return (num / 1e6).toFixed(1) + "M";
    }
    if (Math.abs(num) >= 1e3) {
        return (num / 1e3).toFixed(1) + "K";
    }
    return num.toString();
}
