#!/usr/bin/env node
/**
 * Build orchestration script for claude-flow-chat
 * Coordinates building extension and webview code
 */
const { execSync, spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const ROOT_DIR = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const ASSETS_DIR = path.join(ROOT_DIR, "assets");

// Colors for console output
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function logStep(step) {
    log(`\n[BUILD] ${step}`, colors.cyan);
}

function logSuccess(message) {
    log(`[OK] ${message}`, colors.green);
}

function logError(message) {
    log(`[ERROR] ${message}`, colors.red);
}

function logWarning(message) {
    log(`[WARN] ${message}`, colors.yellow);
}

/**
 * Execute a command synchronously
 */
function exec(command, options = {}) {
    try {
        execSync(command, {
            cwd: ROOT_DIR,
            stdio: "inherit",
            ...options,
        });
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Ensure dist directory exists
 */
function ensureDistDir() {
    logStep("Preparing dist directory...");

    if (!fs.existsSync(DIST_DIR)) {
        fs.mkdirSync(DIST_DIR, { recursive: true });
    }

    logSuccess("Dist directory ready");
}

/**
 * Copy assets to dist
 */
function copyAssets() {
    logStep("Copying assets...");

    const destAssetsDir = path.join(DIST_DIR, "assets");

    if (!fs.existsSync(destAssetsDir)) {
        fs.mkdirSync(destAssetsDir, { recursive: true });
    }

    // Copy icon if exists
    const iconSrc = path.join(ASSETS_DIR, "icon.png");
    const iconDest = path.join(destAssetsDir, "icon.png");

    if (fs.existsSync(iconSrc)) {
        fs.copyFileSync(iconSrc, iconDest);
        logSuccess("Copied icon.png");
    } else {
        logWarning("icon.png not found - extension may not display correctly in marketplace");
    }

    // Copy icons directory if exists
    const iconsSrc = path.join(ASSETS_DIR, "icons");
    const iconsDest = path.join(destAssetsDir, "icons");

    if (fs.existsSync(iconsSrc)) {
        copyDirRecursive(iconsSrc, iconsDest);
        logSuccess("Copied icons directory");
    }

    logSuccess("Assets copied");
}

/**
 * Recursively copy directory
 */
function copyDirRecursive(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

/**
 * Build extension code with esbuild
 */
function buildExtension() {
    logStep("Building extension...");

    const success = exec("npm run build:extension");

    if (success) {
        logSuccess("Extension built successfully");
        return true;
    } else {
        logError("Extension build failed");
        return false;
    }
}

/**
 * Build webview with Vite
 */
function buildWebview() {
    logStep("Building webview...");

    const success = exec("npm run build:webview");

    if (success) {
        logSuccess("Webview built successfully");
        return true;
    } else {
        logError("Webview build failed");
        return false;
    }
}

/**
 * Run TypeScript type checking
 */
function typecheck() {
    logStep("Running type check...");

    const success = exec("npm run typecheck");

    if (success) {
        logSuccess("Type check passed");
        return true;
    } else {
        logError("Type check failed");
        return false;
    }
}

/**
 * Run linting
 */
function lint() {
    logStep("Running linter...");

    const success = exec("npm run lint");

    if (success) {
        logSuccess("Linting passed");
        return true;
    } else {
        logWarning("Linting found issues");
        return true; // Don't fail build on lint warnings
    }
}

/**
 * Main build function
 */
async function main() {
    const args = process.argv.slice(2);
    const skipTypecheck = args.includes("--skip-typecheck");
    const skipLint = args.includes("--skip-lint");
    const isProduction = args.includes("--production") || process.env.NODE_ENV === "production";

    log("\n========================================", colors.blue);
    log("  Claude Flow Chat - Build Script", colors.blue);
    log("========================================\n", colors.blue);

    log(`Mode: ${isProduction ? "Production" : "Development"}`);

    const startTime = Date.now();

    // Step 1: Ensure dist directory
    ensureDistDir();

    // Step 2: Type checking (optional)
    if (!skipTypecheck) {
        if (!typecheck()) {
            process.exit(1);
        }
    } else {
        logWarning("Skipping type check");
    }

    // Step 3: Linting (optional)
    if (!skipLint) {
        lint();
    } else {
        logWarning("Skipping lint");
    }

    // Step 4: Build extension
    if (!buildExtension()) {
        process.exit(1);
    }

    // Step 5: Build webview
    if (!buildWebview()) {
        process.exit(1);
    }

    // Step 6: Copy assets
    copyAssets();

    // Done
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    log("\n========================================", colors.green);
    log(`  Build completed in ${duration}s`, colors.green);
    log("========================================\n", colors.green);
}

// Run main function
main().catch((error) => {
    logError(`Build failed: ${error.message}`);
    process.exit(1);
});
