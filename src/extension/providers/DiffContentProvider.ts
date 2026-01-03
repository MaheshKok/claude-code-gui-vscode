/**
 * Diff Content Provider
 *
 * Provides content for read-only diff views in VS Code.
 * Used to display file differences in the diff editor.
 *
 * @module extension/providers/DiffContentProvider
 */

import * as vscode from "vscode";

/**
 * Storage for diff content indexed by path
 */
const diffContentStore = new Map<string, string>();

/**
 * Custom TextDocumentContentProvider for read-only diff views
 *
 * This provider serves content for the "claude-diff" URI scheme,
 * allowing the extension to display file diffs without modifying
 * actual files on disk.
 *
 * @example
 * ```typescript
 * // Store content for diff
 * storeDiffContent('/path/to/file.ts.old.123', oldContent);
 * storeDiffContent('/path/to/file.ts.new.123', newContent);
 *
 * // Create URIs for diff view
 * const oldUri = vscode.Uri.parse('claude-diff:/path/to/file.ts.old.123');
 * const newUri = vscode.Uri.parse('claude-diff:/path/to/file.ts.new.123');
 *
 * // Open diff editor
 * await vscode.commands.executeCommand('vscode.diff', oldUri, newUri, 'Changes: file.ts');
 * ```
 */
export class DiffContentProvider implements vscode.TextDocumentContentProvider {
    /**
     * Provides the text content for a given URI
     *
     * @param uri - The URI of the document to provide content for
     * @returns The stored content or empty string if not found
     */
    provideTextDocumentContent(uri: vscode.Uri): string {
        const content = diffContentStore.get(uri.path);
        return content || "";
    }
}

/**
 * Get diff content for a given path
 *
 * @param path - The path key to look up
 * @returns The stored content or undefined if not found
 */
export function getDiffContent(path: string): string | undefined {
    return diffContentStore.get(path);
}

/**
 * Store diff content for a given path
 *
 * @param path - The path key to store under
 * @param content - The content to store
 */
export function storeDiffContent(path: string, content: string): void {
    diffContentStore.set(path, content);
}

/**
 * Clear diff content for a given path
 *
 * @param path - The path key to clear
 * @returns True if the content was found and deleted
 */
export function clearDiffContent(path: string): boolean {
    return diffContentStore.delete(path);
}

/**
 * Clear all stored diff content
 */
export function clearAllDiffContent(): void {
    diffContentStore.clear();
}

/**
 * Check if diff content exists for a given path
 *
 * @param path - The path key to check
 * @returns True if content exists for the path
 */
export function hasDiffContent(path: string): boolean {
    return diffContentStore.has(path);
}

/**
 * Get the number of stored diff contents
 *
 * @returns The number of stored diff contents
 */
export function getDiffContentCount(): number {
    return diffContentStore.size;
}

/**
 * The URI scheme used for diff content
 */
export const DIFF_URI_SCHEME = "claude-diff";

/**
 * Register the diff content provider with VS Code
 *
 * @param context - The extension context for registration
 * @returns The provider instance and registration disposable
 */
export function registerDiffContentProvider(context: vscode.ExtensionContext): {
    provider: DiffContentProvider;
    registration: vscode.Disposable;
} {
    const provider = new DiffContentProvider();
    const registration = vscode.workspace.registerTextDocumentContentProvider(
        DIFF_URI_SCHEME,
        provider,
    );
    context.subscriptions.push(registration);
    return { provider, registration };
}
