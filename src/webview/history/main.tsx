/**
 * History webview entry point
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { HistoryView } from "../components/History/HistoryView";
import "../styles/globals.css";

// Initialize the React app for history view
const container = document.getElementById("root");
if (container) {
    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <HistoryView />
        </React.StrictMode>,
    );
} else {
    console.error("Root element not found");
}
