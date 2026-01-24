/**
 * Security Utilities - Input sanitization and validation
 *
 * Provides functions to prevent command injection and path traversal attacks
 */

/**
 * Sanitizes shell paths to prevent command injection attacks
 *
 * @param path - The path to sanitize
 * @returns The sanitized path if valid
 * @throws Error if the path contains dangerous shell metacharacters
 *
 * @example
 * sanitizeShellPath('/usr/bin/node') // OK
 * sanitizeShellPath('/usr/bin/node; rm -rf /') // Throws error
 */
export function sanitizeShellPath(path: string): string {
    // Reject paths containing shell metacharacters that could enable command injection
    // This includes: semicolon, ampersand, pipe, backtick, dollar sign, parentheses
    const dangerousChars = /[;&|`$()]/;

    if (dangerousChars.test(path)) {
        throw new Error("Invalid characters in path");
    }

    return path;
}

/**
 * Validates a process ID to ensure it's a valid positive integer
 *
 * @param pid - The process ID to validate
 * @returns The validated process ID
 * @throws Error if the PID is invalid (negative, zero, or non-integer)
 *
 * @example
 * validateProcessId(1234) // Returns 1234
 * validateProcessId(-1) // Throws error
 * validateProcessId(12.34) // Throws error
 */
export function validateProcessId(pid: number): number {
    if (!Number.isInteger(pid) || pid <= 0) {
        throw new Error("Invalid process ID");
    }

    return pid;
}

/**
 * Checks if a file path is within allowed workspace paths
 * Prevents path traversal attacks
 *
 * @param filePath - The file path to check
 * @param workspacePaths - Array of allowed workspace root paths
 * @returns true if the path is within a workspace, false otherwise
 *
 * @example
 * isPathInWorkspace('/workspace/file.txt', ['/workspace']) // true
 * isPathInWorkspace('/workspace/../etc/passwd', ['/workspace']) // false
 */
export function isPathInWorkspace(filePath: string, workspacePaths: string[]): boolean {
    // Normalize path separators to forward slashes
    const normalizedPath = filePath.replace(/\\/g, "/");

    // Reject paths with parent directory traversal attempts
    if (normalizedPath.includes("../") || normalizedPath.includes("..\\")) {
        return false;
    }

    // Check if path starts with any allowed workspace path
    return workspacePaths.some((wsPath) => {
        const normalizedWsPath = wsPath.replace(/\\/g, "/");
        return normalizedPath.startsWith(normalizedWsPath);
    });
}
