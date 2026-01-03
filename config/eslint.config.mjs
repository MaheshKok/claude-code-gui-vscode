import eslint from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default [
    eslint.configs.recommended,
    {
        files: ["src/**/*.{ts,tsx}"],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                ecmaFeatures: {
                    jsx: true,
                },
                project: ["./tsconfig.json"],
            },
            globals: {
                console: "readonly",
                process: "readonly",
                Buffer: "readonly",
                __dirname: "readonly",
                __filename: "readonly",
                module: "readonly",
                require: "readonly",
                setTimeout: "readonly",
                clearTimeout: "readonly",
                setInterval: "readonly",
                clearInterval: "readonly",
                Promise: "readonly",
                Map: "readonly",
                Set: "readonly",
                WeakMap: "readonly",
                WeakSet: "readonly",
                Symbol: "readonly",
                Proxy: "readonly",
                Reflect: "readonly",
                document: "readonly",
                window: "readonly",
                HTMLElement: "readonly",
                Event: "readonly",
                CustomEvent: "readonly",
                MessageEvent: "readonly",
                acquireVsCodeApi: "readonly",
            },
        },
        plugins: {
            "@typescript-eslint": tseslint,
            react: reactPlugin,
            "react-hooks": reactHooksPlugin,
        },
        settings: {
            react: {
                version: "detect",
            },
        },
        rules: {
            // TypeScript rules
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                },
            ],
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-non-null-assertion": "warn",
            "@typescript-eslint/prefer-nullish-coalescing": "off",
            "@typescript-eslint/prefer-optional-chain": "error",
            "@typescript-eslint/strict-boolean-expressions": "off",
            "@typescript-eslint/no-floating-promises": "error",
            "@typescript-eslint/await-thenable": "error",
            "@typescript-eslint/no-misused-promises": "error",

            // React rules
            "react/react-in-jsx-scope": "off",
            "react/prop-types": "off",
            "react/jsx-uses-react": "off",
            "react/jsx-uses-vars": "error",
            "react/jsx-no-target-blank": "error",
            "react/jsx-key": "error",
            "react/no-unescaped-entities": "warn",
            "react/self-closing-comp": "error",
            "react/jsx-curly-brace-presence": [
                "error",
                {
                    props: "never",
                    children: "never",
                },
            ],

            // React Hooks rules
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "warn",

            // General rules
            "no-console": ["warn", { allow: ["warn", "error"] }],
            "no-debugger": "warn",
            "no-duplicate-imports": "error",
            "no-unused-vars": "off", // Use TypeScript version
            "prefer-const": "error",
            eqeqeq: ["error", "always", { null: "ignore" }],
            curly: ["error", "all"],
            "no-throw-literal": "error",
            "no-var": "error",
            "object-shorthand": "error",
            "prefer-arrow-callback": "error",
            "prefer-template": "error",
            quotes: ["error", "single", { avoidEscape: true }],
            semi: ["error", "always"],
        },
    },
    {
        files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            "no-console": "off",
        },
    },
    {
        ignores: [
            "dist/**",
            "out/**",
            "node_modules/**",
            "*.js",
            "*.mjs",
            "vite.config.ts",
            "tailwind.config.js",
        ],
    },
];
