/**
 * esbuild configuration for VS Code extension bundling
 */
const esbuild = require("esbuild");
const path = require("path");

const isProduction = process.env.NODE_ENV === "production";
const isWatch = process.argv.includes("--watch");

/** @type {import('esbuild').BuildOptions} */
const buildOptions = {
    entryPoints: ["./src/extension/index.ts"],
    bundle: true,
    outfile: "./dist/extension.js",
    external: ["vscode"],
    format: "cjs",
    platform: "node",
    target: "node18",
    sourcemap: !isProduction,
    minify: isProduction,
    treeShaking: true,
    metafile: true,
    logLevel: "info",

    // Node.js specific settings
    mainFields: ["module", "main"],

    // Define environment variables
    define: {
        "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
    },

    // Resolve aliases matching tsconfig paths
    alias: {
        "@": path.resolve(__dirname, "src"),
        "@extension": path.resolve(__dirname, "src/extension"),
        "@shared": path.resolve(__dirname, "src/shared"),
        "@utils": path.resolve(__dirname, "src/shared/utils"),
        "@types": path.resolve(__dirname, "src/shared/types"),
    },
};

async function build() {
    try {
        if (isWatch) {
            const ctx = await esbuild.context(buildOptions);
            await ctx.watch();
            console.log("Watching for changes...");
        } else {
            const result = await esbuild.build(buildOptions);

            if (result.metafile) {
                const analysis = await esbuild.analyzeMetafile(result.metafile);
                console.log("\nBundle analysis:");
                console.log(analysis);
            }

            console.log("Extension build completed successfully!");
        }
    } catch (error) {
        console.error("Build failed:", error);
        process.exit(1);
    }
}

build();
