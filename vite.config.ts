import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
    plugins: [react()],

    root: resolve(__dirname, "src/webview"),

    build: {
        outDir: resolve(__dirname, "dist/webview"),
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, "src/webview/main.tsx"),
            },
            output: {
                // Single bundle output - no code splitting for webview compatibility
                entryFileNames: "main.js",
                chunkFileNames: "main.js",
                assetFileNames: "main[extname]",
                // Disable code splitting
                manualChunks: undefined,
            },
        },
        sourcemap: process.env.NODE_ENV !== "production",
        minify: process.env.NODE_ENV === "production",
        target: "es2020",
        // Inline all CSS into JS to avoid separate file loading issues
        cssCodeSplit: false,
        // Inline assets smaller than 1MB (fixes image loading in webview)
        assetsInlineLimit: 1000000,
    },

    resolve: {
        alias: {
            "@": resolve(__dirname, "src"),
            "@extension": resolve(__dirname, "src/extension"),
            "@webview": resolve(__dirname, "src/webview"),
            "@shared": resolve(__dirname, "src/shared"),
            "@components": resolve(__dirname, "src/webview/components"),
            "@hooks": resolve(__dirname, "src/webview/hooks"),
            "@stores": resolve(__dirname, "src/webview/stores"),
            "@utils": resolve(__dirname, "src/webview/utils"),
            "@types": resolve(__dirname, "src/webview/types"),
        },
    },

    css: {
        postcss: {
            plugins: [require("tailwindcss"), require("autoprefixer")],
        },
    },

    define: {
        "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
    },

    esbuild: {
        target: "es2020",
    },
});
