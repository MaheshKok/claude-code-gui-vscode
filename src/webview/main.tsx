/**
 * Webview Entry Point
 *
 * React application entry point for the Claude Code GUI VSCode extension.
 * Sets up the VSCode API and mounts the root App component.
 *
 * @module webview/main
 */

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/globals.css";

// ============================================================================
// Global Error Handler - Must be first!
// ============================================================================

window.onerror = function (message, source, lineno, colno, error) {
    console.error("[Webview] Global error:", {
        message,
        source,
        lineno,
        colno,
        error,
    });
    const rootEl = document.getElementById("root");
    if (rootEl) {
        rootEl.innerHTML = `
      <div style="padding: 20px; color: red;">
        <h3>JavaScript Error</h3>
        <pre>${message}\nSource: ${source}\nLine: ${lineno}</pre>
      </div>
    `;
    }
    return false;
};

window.onunhandledrejection = function (event) {
    console.error("[Webview] Unhandled promise rejection:", event.reason);
};

// ============================================================================
// VSCode API Setup
// ============================================================================

console.log("[Webview] ========================================");
console.log("[Webview] Initializing webview...");
console.log("[Webview] Location:", window.location.href);
console.log("[Webview] Document readyState:", document.readyState);

/**
 * Acquire and cache the VSCode API
 * This can only be called once per webview session
 */
declare global {
    interface Window {
        vscode?: ReturnType<typeof acquireVsCodeApi>;
        acquireVsCodeApi?: () => {
            postMessage: (message: unknown) => void;
            getState: () => unknown;
            setState: (state: unknown) => void;
        };
    }
}

// Acquire the VSCode API if available and not already acquired
console.log("[Webview] acquireVsCodeApi available:", typeof window.acquireVsCodeApi === "function");
console.log("[Webview] window.vscode already set:", !!window.vscode);

if (typeof window.acquireVsCodeApi === "function" && !window.vscode) {
    try {
        window.vscode = window.acquireVsCodeApi();
        console.log("[Webview] VSCode API acquired successfully");
        console.log(
            "[Webview] postMessage available:",
            typeof window.vscode?.postMessage === "function",
        );
    } catch (error) {
        console.error("[Webview] Failed to acquire VSCode API:", error);
    }
} else if (window.vscode) {
    console.log("[Webview] VSCode API was already acquired");
} else {
    console.warn("[Webview] Not running in VSCode webview context");
}

// ============================================================================
// App Mount
// ============================================================================

console.log("[Webview] Looking for root element...");
const container = document.getElementById("root");

if (!container) {
    console.error("[Webview] Root element not found!");
    throw new Error(
        'Root element not found. Make sure there is a <div id="root"></div> in your HTML.',
    );
}

console.log("[Webview] Root element found, creating React root...");

try {
    const root = createRoot(container);
    console.log("[Webview] React root created, rendering App...");

    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
    );

    console.log("[Webview] App render initiated");
} catch (error) {
    console.error("[Webview] Failed to render React app:", error);
    container.innerHTML = `
    <div style="padding: 20px; color: red;">
      <h3>Failed to render application</h3>
      <pre>${error}</pre>
    </div>
  `;
}

// ============================================================================
// Hot Module Replacement (Development)
// ============================================================================

if (import.meta.hot) {
    import.meta.hot.accept();
}

console.log("[Webview] main.tsx initialization complete");
