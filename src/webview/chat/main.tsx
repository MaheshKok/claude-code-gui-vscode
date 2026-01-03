/**
 * Chat webview entry point
 */
import React from "react";
import { createRoot } from "react-dom/client";
import App from "../components/App";
import "../styles/globals.css";

// Initialize the React app
const container = document.getElementById("root");
if (container) {
    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
    );
} else {
    console.error("Root element not found");
}
