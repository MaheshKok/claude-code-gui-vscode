/**
 * ESLint flat config for claude-flow-chat
 */
const tseslint = require("@typescript-eslint/eslint-plugin");
const tsparser = require("@typescript-eslint/parser");
const reactPlugin = require("eslint-plugin-react");
const reactHooksPlugin = require("eslint-plugin-react-hooks");

module.exports = [
    {
        ignores: [
            "dist/**",
            "out/**",
            "node_modules/**",
            ".vscode/**",
            "*.config.js",
            "scripts/**",
        ],
    },
    {
        files: ["src/**/*.ts", "src/**/*.tsx"],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                console: "readonly",
                process: "readonly",
                Buffer: "readonly",
                __dirname: "readonly",
                __filename: "readonly",
                module: "readonly",
                require: "readonly",
                exports: "writable",
                setTimeout: "readonly",
                clearTimeout: "readonly",
                setInterval: "readonly",
                clearInterval: "readonly",
                window: "readonly",
                document: "readonly",
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
                "warn",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                },
            ],
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-non-null-assertion": "warn",

            // React rules
            "react/react-in-jsx-scope": "off",
            "react/prop-types": "off",
            "react/jsx-uses-react": "off",
            "react/jsx-uses-vars": "error",

            // React Hooks rules
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "warn",

            // General rules
            "no-console": "off",
            "no-debugger": "warn",
            "prefer-const": "warn",
            "no-unused-expressions": "warn",
        },
    },
    {
        files: ["src/extension/**/*.ts"],
        rules: {
            // Stricter rules for extension code
            "@typescript-eslint/no-explicit-any": "error",
        },
    },
];
