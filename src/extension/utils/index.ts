/**
 * Extension Utilities
 *
 * This module exports all utility functions used by the VS Code extension.
 *
 * @module extension/utils
 */

// ============================================================================
// WSL Path Conversion
// ============================================================================

export {
    convertToWSLPath,
    convertFromWSLPath,
    isWSLPath,
    getWSLConfig,
    isWSLConversionNeeded,
    type WSLConversionOptions,
} from "./wsl";
