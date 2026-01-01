# Build System Documentation

## Overview

Claude Code GUI uses a **dual-bundle architecture** with separate build pipelines for the VS Code extension and React webview.

## Build Tools

| Tool             | Purpose            | Target               |
| ---------------- | ------------------ | -------------------- |
| **esbuild**      | Extension bundling | Node.js (CommonJS)   |
| **Vite**         | Webview bundling   | Browser (ES Modules) |
| **TypeScript**   | Type checking      | Both                 |
| **Tailwind CSS** | Styling            | Webview              |
| **PostCSS**      | CSS processing     | Webview              |
| **Vitest**       | Testing            | Both                 |

---

## Build Scripts

### Primary Scripts

```bash
# Full build (production)
npm run build

# Development with watch
npm run dev
npm run watch

# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix

# Testing
npm run test
npm run test:watch
npm run test:coverage

# Packaging
npm run package    # Create .vsix
npm run publish    # Publish to marketplace

# Cleanup
npm run clean
```

### Script Details

| Script            | Command                                      | Description           |
| ----------------- | -------------------------------------------- | --------------------- |
| `build`           | `build:extension && build:webview`           | Full production build |
| `build:extension` | `esbuild ... --minify`                       | Bundle extension      |
| `build:webview`   | `vite build`                                 | Bundle webview        |
| `watch`           | `concurrently watch:extension watch:webview` | Development mode      |
| `watch:extension` | `esbuild ... --watch --sourcemap`            | Watch extension       |
| `watch:webview`   | `vite build --watch`                         | Watch webview         |

---

## Extension Build (esbuild)

**Config:** `esbuild.config.js`

### Configuration

```javascript
{
  entryPoints: ['./src/extension/index.ts'],
  bundle: true,
  outfile: './dist/extension.js',
  external: ['vscode'],  // Provided by VS Code
  format: 'cjs',         // Required for VS Code
  platform: 'node',
  target: 'node18',
  minify: isProduction,
  sourcemap: !isProduction,
  treeShaking: true,
  metafile: true,        // Bundle analysis
}
```

### Path Aliases

```javascript
alias: {
  '@': path.resolve(__dirname, 'src'),
  '@extension': path.resolve(__dirname, 'src/extension'),
  '@shared': path.resolve(__dirname, 'src/shared'),
  '@utils': path.resolve(__dirname, 'src/shared/utils'),
  '@types': path.resolve(__dirname, 'src/shared/types'),
}
```

### Output

- `dist/extension.js` - Bundled extension (~43KB minified)
- `dist/extension.js.map` - Source map (dev only)

---

## Webview Build (Vite)

**Config:** `vite.config.ts`

### Configuration

```typescript
export default defineConfig({
  root: "src/webview",
  plugins: [react()],
  build: {
    outDir: "../../dist/webview",
    emptyOutDir: false,
    rollupOptions: {
      output: {
        entryFileNames: "main.js",
        assetFileNames: "main[extname]",
        // Single bundle - no code splitting
        manualChunks: undefined,
      },
    },
    cssCodeSplit: false, // Inline CSS
    minify: isProduction ? "terser" : false,
    sourcemap: !isProduction,
    target: "es2020",
  },
});
```

### Key Decisions

| Decision          | Rationale                                  |
| ----------------- | ------------------------------------------ |
| Single bundle     | VS Code webview requires monolithic bundle |
| Inline CSS        | Avoids separate file loading issues        |
| No code splitting | Webview loads everything at once           |
| ES2020 target     | Modern browser features                    |

### Path Aliases

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, 'src'),
    '@webview': path.resolve(__dirname, 'src/webview'),
    '@components': path.resolve(__dirname, 'src/webview/components'),
    '@hooks': path.resolve(__dirname, 'src/webview/hooks'),
    '@stores': path.resolve(__dirname, 'src/webview/stores'),
    '@utils': path.resolve(__dirname, 'src/webview/utils'),
    '@types': path.resolve(__dirname, 'src/webview/types'),
  },
}
```

### Output

- `dist/webview/main.js` - Bundled React app
- `dist/webview/main.css` - Styles (if not inlined)
- `dist/webview/main.js.map` - Source map (dev only)

---

## TypeScript Configuration

### Base Config (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```

### Extension Config (`tsconfig.extension.json`)

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "node",
    "outDir": "./dist",
    "noEmit": false,
    "types": ["node", "vscode"]
  },
  "include": ["src/extension/**/*", "src/shared/**/*"]
}
```

### Webview Config (`tsconfig.webview.json`)

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "./dist/webview",
    "noEmit": false
  },
  "include": ["src/webview/**/*", "src/shared/**/*"]
}
```

---

## CSS Processing

### Tailwind CSS (`tailwind.config.js`)

```javascript
module.exports = {
  content: ["./src/webview/**/*.{ts,tsx,html}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // VS Code theme variables
        "vscode-editor-bg": "var(--vscode-editor-background)",
        "vscode-editor-fg": "var(--vscode-editor-foreground)",
        // ... more
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
```

### PostCSS (`postcss.config.js`)

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

---

## Linting (ESLint)

**Config:** `eslint.config.js` (flat config format)

### Rules

```javascript
{
  // TypeScript
  '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/no-non-null-assertion': 'warn',

  // React
  'react/react-in-jsx-scope': 'off',
  'react/prop-types': 'off',
  'react-hooks/rules-of-hooks': 'error',
  'react-hooks/exhaustive-deps': 'warn',

  // General
  'no-console': 'off',
  'no-debugger': 'warn',
  'prefer-const': 'warn',
}
```

---

## Testing (Vitest)

**Config:** `vitest.config.ts`

```typescript
export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/tests/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
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
});
```

---

## VS Code Integration

### Launch Configurations (`.vscode/launch.json`)

| Configuration               | Purpose                     |
| --------------------------- | --------------------------- |
| Run Extension               | Debug extension with watch  |
| Run Extension (No Watch)    | Single build debug          |
| Extension Tests             | Run test suite              |
| Debug Webview               | Chrome DevTools for webview |
| Run Extension + Webview Dev | Combined debugging          |

### Tasks (`.vscode/tasks.json`)

| Task         | Type       | Purpose           |
| ------------ | ---------- | ----------------- |
| npm: watch   | background | Development watch |
| npm: compile | shell      | Single build      |
| npm: lint    | shell      | Linting           |
| npm: test    | shell      | Testing           |

---

## Packaging

### .vscodeignore

Excludes from .vsix package:

- Source files (`src/**`)
- Test files (`*.test.ts`, `*.spec.ts`)
- Config files (`*.config.*`)
- Development tools
- Documentation (except README)
- VCS files (`.git/`)

### Package Command

```bash
npm run package
# Creates: claude-code-gui-1.0.0.vsix (~111KB)
```

---

## Build Flow Diagram

```
Source Files
    │
    ├── src/extension/
    │   │
    │   └── esbuild ──────────────────► dist/extension.js
    │       • Bundle TypeScript
    │       • CommonJS format
    │       • Minify (prod)
    │       • External: vscode
    │
    └── src/webview/
        │
        └── Vite ─────────────────────► dist/webview/
            │                           ├── main.js
            │                           └── main.css
            ├── React plugin
            ├── Tailwind CSS
            ├── PostCSS
            └── Terser (prod)

dist/
├── extension.js      # VS Code extension
└── webview/
    └── main.js       # React app (CSS inlined)
```

---

## Development Workflow

### Quick Start

```bash
# Install dependencies
npm install

# Start development
npm run dev

# In VS Code: F5 to launch extension
```

### Build for Release

```bash
# Clean previous build
npm run clean

# Type check
npm run typecheck

# Lint
npm run lint

# Test
npm run test

# Build
npm run build

# Package
npm run package
```

### Debugging

1. **Extension Debugging**
   - Set breakpoints in `src/extension/`
   - Press F5 → Select "Run Extension"
   - Debug in VS Code

2. **Webview Debugging**
   - Open DevTools in webview: `Ctrl+Shift+I`
   - Or use "Debug Webview" launch config

---

## Performance Optimization

### Bundle Size

| Bundle    | Size (minified) | Gzipped |
| --------- | --------------- | ------- |
| Extension | ~43 KB          | ~12 KB  |
| Webview   | ~250 KB         | ~70 KB  |

### Optimization Techniques

- **Tree shaking** enabled in both bundlers
- **Code splitting** disabled (webview requirement)
- **CSS purging** via Tailwind
- **Minification** in production
- **Source maps** only in development
