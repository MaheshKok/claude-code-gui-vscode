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
                entryFileNames: "main.js",
                chunkFileNames: "[name].js",
                assetFileNames: "[name][extname]",
                // Disable code splitting for VS Code webview
                // VS Code webviews have CSP restrictions that make dynamic imports difficult
                manualChunks: undefined,
            },
            treeshake: {
                moduleSideEffects: false,
                propertyReadSideEffects: false,
            },
        },
        sourcemap: process.env.NODE_ENV !== "production",
        minify: process.env.NODE_ENV === "production" ? "terser" : false,
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
            },
        },
        target: "es2020",
        cssCodeSplit: true,
        assetsInlineLimit: 4096, // 4KB limit (was 1MB!)
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
