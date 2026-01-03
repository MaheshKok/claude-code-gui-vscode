/// <reference types="vite/client" />

/**
 * Vite Environment Type Declarations
 *
 * Provides TypeScript support for Vite-specific features like
 * import.meta.env and import.meta.hot
 *
 * @module webview/vite-env
 */

interface ImportMetaEnv {
    /** Base URL for the application */
    readonly BASE_URL: string;
    /** Development mode flag */
    readonly DEV: boolean;
    /** Production mode flag */
    readonly PROD: boolean;
    /** Server-side rendering mode flag */
    readonly SSR: boolean;
    /** Current mode (development, production, etc.) */
    readonly MODE: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
    readonly hot?: {
        readonly data: Record<string, unknown>;
        accept(): void;
        accept(cb: (mod: unknown) => void): void;
        accept(dep: string, cb: (mod: unknown) => void): void;
        accept(deps: readonly string[], cb: (mods: unknown[]) => void): void;
        dispose(cb: (data: Record<string, unknown>) => void): void;
        decline(): void;
        invalidate(): void;
        on(event: string, cb: (...args: unknown[]) => void): void;
    };
}

// VSCode webview API type declarations
declare function acquireVsCodeApi(): {
    postMessage(message: unknown): void;
    getState(): unknown;
    setState(state: unknown): void;
};

// Module declarations for asset imports
declare module "*.svg" {
    const content: string;
    export default content;
}

declare module "*.png" {
    const content: string;
    export default content;
}

declare module "*.jpg" {
    const content: string;
    export default content;
}

declare module "*.jpeg" {
    const content: string;
    export default content;
}

declare module "*.gif" {
    const content: string;
    export default content;
}

declare module "*.webp" {
    const content: string;
    export default content;
}

declare module "*.ico" {
    const content: string;
    export default content;
}

declare module "*.css" {
    const content: Record<string, string>;
    export default content;
}
