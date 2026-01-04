import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
    plugins: [react()],

    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: ["./src/tests/setup.ts"],
        include: ["src/**/*.{test,spec}.{ts,tsx}", "tests/**/*.{test,spec}.{ts,tsx}"],
        exclude: ["node_modules", "dist", "out", "src/tests/e2e/**"],
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            include: ["src/webview/**/*.{ts,tsx}", "src/shared/**/*.ts"],
            exclude: [
                "node_modules/",
                "dist/",
                "out/",
                "src/tests/",
                "src/test/",
                ".vscode-test/",
                "**/*.d.ts",
                "**/*.config.*",
                "**/types/*",
                "**/index.ts",
                "src/webview/main.tsx",
                "src/webview/chat/main.tsx",
                "src/webview/history/main.tsx",
            ],
            thresholds: {
                lines: 95,
                functions: 95,
                branches: 85,
                statements: 95,
            },
        },
        testTimeout: 10000,
        hookTimeout: 10000,
    },

    resolve: {
        alias: {
            "@": resolve(__dirname, "src"),
            "@extension": resolve(__dirname, "src/extension"),
            "@webview": resolve(__dirname, "src/webview"),
            "@shared": resolve(__dirname, "src/shared"),
            "@components": resolve(__dirname, "src/webview/components"),
            "@hooks": resolve(__dirname, "src/webview/hooks"),
            "@utils": resolve(__dirname, "src/shared/utils"),
            "@types": resolve(__dirname, "src/shared/types"),
        },
    },
});
