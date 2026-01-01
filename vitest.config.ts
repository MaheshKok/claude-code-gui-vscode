import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],

  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/tests/setup.ts"],
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "tests/**/*.{test,spec}.{ts,tsx}",
    ],
    exclude: ["node_modules", "dist", "out"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "out/",
        "src/tests/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/types/*",
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
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
