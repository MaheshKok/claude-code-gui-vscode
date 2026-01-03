/**
 * Status Components Module
 *
 * This module provides status display components including the main
 * status bar that shows token counts, costs, and processing state.
 *
 * @module components/Status
 */

// Main export - StatusBar is the primary component of this module
export { StatusBar } from "./StatusBar";

// Default export for convenient importing
export { default } from "./StatusBar";

// Re-export types if needed by consumers
export type { StatusBarProps } from "./StatusBar";
