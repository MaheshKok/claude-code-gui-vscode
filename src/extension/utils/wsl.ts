/**
 * WSL Path Conversion Utilities
 *
 * Provides functions for converting Windows paths to WSL paths
 * when running in Windows Subsystem for Linux environment.
 *
 * @module extension/utils/wsl
 */

import * as vscode from "vscode";
import { DEFAULT_WSL_CONFIG } from "../../shared/constants";

/**
 * Options for WSL path conversion
 */
export interface WSLConversionOptions {
    /** Whether WSL is enabled (defaults to config value) */
    enabled?: boolean;
    /** WSL distribution name */
    distro?: string;
}

/**
 * Convert a Windows path to WSL path format
 *
 * Converts paths like:
 * - `C:\Users\name\project` → `/mnt/c/Users/name/project`
 * - `D:\work\file.txt` → `/mnt/d/work/file.txt`
 *
 * @param windowsPath - The Windows-style path to convert
 * @param options - Optional conversion options
 * @returns The converted WSL path, or original path if conversion not needed
 *
 * @example
 * ```typescript
 * // With config check
 * const wslPath = convertToWSLPath("C:\\Users\\me\\project");
 *
 * // Force conversion (bypass config check)
 * const wslPath = convertToWSLPath("C:\\Users\\me\\project", { enabled: true });
 * ```
 */
export function convertToWSLPath(windowsPath: string, options?: WSLConversionOptions): string {
    // Check if WSL is enabled
    const config = vscode.workspace.getConfiguration("claudeCodeGui");
    const wslEnabled =
        options?.enabled ?? config.get<boolean>("wsl.enabled", DEFAULT_WSL_CONFIG.ENABLED);

    // Only convert if WSL is enabled and we're on Windows
    if (!wslEnabled || process.platform !== "win32") {
        return windowsPath;
    }

    // Check if path has Windows drive letter format (e.g., C:\ or D:/)
    if (/^[a-zA-Z]:/.test(windowsPath)) {
        const driveLetter = windowsPath.charAt(0).toLowerCase();
        const pathWithoutDrive = windowsPath.slice(2).replace(/\\/g, "/");
        return `/mnt/${driveLetter}${pathWithoutDrive}`;
    }

    return windowsPath;
}

/**
 * Check if a path is in WSL format
 *
 * @param path - The path to check
 * @returns True if path is in WSL mount format (/mnt/x/...)
 */
export function isWSLPath(path: string): boolean {
    return /^\/mnt\/[a-z]\//.test(path);
}

/**
 * Convert a WSL path back to Windows path format
 *
 * Converts paths like:
 * - `/mnt/c/Users/name/project` → `C:\Users\name\project`
 * - `/mnt/d/work/file.txt` → `D:\work\file.txt`
 *
 * @param wslPath - The WSL-style path to convert
 * @returns The converted Windows path, or original path if not a WSL path
 */
export function convertFromWSLPath(wslPath: string): string {
    const match = wslPath.match(/^\/mnt\/([a-z])\/(.*)$/);
    if (match) {
        const driveLetter = match[1].toUpperCase();
        const pathPart = match[2].replace(/\//g, "\\");
        return `${driveLetter}:\\${pathPart}`;
    }
    return wslPath;
}

/**
 * Get WSL configuration from settings
 *
 * @returns Current WSL configuration
 */
export function getWSLConfig(): {
    enabled: boolean;
    distro: string;
    nodePath: string;
    claudePath: string;
} {
    const config = vscode.workspace.getConfiguration("claudeCodeGui");
    return {
        enabled: config.get<boolean>("wsl.enabled", DEFAULT_WSL_CONFIG.ENABLED),
        distro: config.get<string>("wsl.distro", DEFAULT_WSL_CONFIG.DISTRO),
        nodePath: config.get<string>("wsl.nodePath", DEFAULT_WSL_CONFIG.NODE_PATH),
        claudePath: config.get<string>("wsl.claudePath", DEFAULT_WSL_CONFIG.CLAUDE_PATH),
    };
}

/**
 * Check if WSL conversion is needed for the current environment
 *
 * @returns True if running on Windows with WSL enabled
 */
export function isWSLConversionNeeded(): boolean {
    if (process.platform !== "win32") {
        return false;
    }
    const config = vscode.workspace.getConfiguration("claudeCodeGui");
    return config.get<boolean>("wsl.enabled", DEFAULT_WSL_CONFIG.ENABLED);
}
