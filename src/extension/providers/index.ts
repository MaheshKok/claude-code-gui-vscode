/**
 * Extension Providers
 *
 * Exports all VS Code providers used by the extension.
 *
 * @module extension/providers
 */

export {
    DiffContentProvider,
    getDiffContent,
    storeDiffContent,
    clearDiffContent,
    clearAllDiffContent,
    hasDiffContent,
    getDiffContentCount,
    registerDiffContentProvider,
    DIFF_URI_SCHEME,
} from "./DiffContentProvider";
