/**
 * Rate Limit Cache
 *
 * Caches rate limit data to a local file for persistence across extension restarts.
 * Provides instant display on startup while fresh data is fetched.
 */
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface CachedRateLimits {
    session5h: number; // 0-1 ratio
    weekly7d: number; // 0-1 ratio
    reset5h?: number; // Unix timestamp
    reset7d?: number; // Unix timestamp
    timestamp: number; // When this was cached (Unix ms)
}

const CACHE_FILE_PATH = path.join(os.homedir(), ".claude", "rate-limit-cache.json");

/**
 * Read cached rate limits from file
 */
export function readRateLimitCache(): CachedRateLimits | null {
    try {
        if (!fs.existsSync(CACHE_FILE_PATH)) {
            return null;
        }

        const content = fs.readFileSync(CACHE_FILE_PATH, "utf-8");
        const data = JSON.parse(content) as CachedRateLimits;

        // Validate structure
        if (
            typeof data.session5h !== "number" ||
            typeof data.weekly7d !== "number" ||
            typeof data.timestamp !== "number"
        ) {
            console.warn("[RateLimitCache] Invalid cache structure");
            return null;
        }

        return data;
    } catch (error) {
        console.warn("[RateLimitCache] Failed to read cache:", error);
        return null;
    }
}

/**
 * Write rate limits to cache file
 */
export function writeRateLimitCache(data: Omit<CachedRateLimits, "timestamp">): void {
    try {
        // Ensure .claude directory exists
        const claudeDir = path.dirname(CACHE_FILE_PATH);
        if (!fs.existsSync(claudeDir)) {
            fs.mkdirSync(claudeDir, { recursive: true });
        }

        const cacheData: CachedRateLimits = {
            ...data,
            timestamp: Date.now(),
        };

        fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(cacheData, null, 2), "utf-8");
        console.log("[RateLimitCache] Cache updated:", cacheData);
    } catch (error) {
        console.warn("[RateLimitCache] Failed to write cache:", error);
    }
}

/**
 * Get cache age in minutes
 */
export function getCacheAgeMinutes(cache: CachedRateLimits): number {
    return Math.round((Date.now() - cache.timestamp) / (60 * 1000));
}
