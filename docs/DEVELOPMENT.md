# Development Guide

This document provides detailed information for developers who want to contribute to or extend the Claude Code GUI extension.

## Table of Contents

- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Development Environment](#development-environment)
- [Building the Extension](#building-the-extension)
- [Adding New Features](#adding-new-features)
- [Testing](#testing)
- [Debugging](#debugging)
- [Code Style](#code-style)

## Project Structure

```
claude-flow-chat/
├── src/
│   ├── extension/                 # VS Code extension (Node.js)
│   │   ├── extension.ts           # Main entry point, activation
│   │   ├── index.ts               # Re-exports
│   │   ├── services/              # Core services
│   │   │   ├── ClaudeService.ts   # Claude CLI process management
│   │   │   ├── ConversationService.ts  # Conversation persistence
│   │   │   ├── MCPService.ts      # MCP server integration
│   │   │   └── PermissionService.ts    # Permission management
│   │   └── webview/               # Webview providers
│   │       ├── WebviewProvider.ts # Sidebar webview
│   │       ├── PanelProvider.ts   # Main panel webview
│   │       └── html.ts            # HTML template generation
│   │
│   ├── webview/                   # React webview application
│   │   ├── App.tsx                # Root React component
│   │   ├── main.tsx               # React entry point
│   │   ├── components/            # UI components
│   │   │   ├── Chat/              # Chat-related components
│   │   │   ├── Header/            # Header component
│   │   │   ├── History/           # Conversation history
│   │   │   ├── Modals/            # Modal dialogs
│   │   │   ├── Status/            # Status bar
│   │   │   └── Tools/             # Tool visualization
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── stores/                # Zustand state stores
│   │   ├── types/                 # TypeScript definitions
│   │   ├── utils/                 # Utility functions
│   │   ├── styles/                # CSS styles
│   │   ├── chat/                  # Chat webview entry
│   │   └── history/               # History webview entry
│   │
│   ├── shared/                    # Shared code
│   │   └── types/                 # Shared type definitions
│   │
│   └── test/                      # Test files
│       ├── components/            # Component tests
│       ├── hooks/                 # Hook tests
│       ├── stores/                # Store tests
│       └── utils/                 # Utility tests
│
├── docs/                          # Documentation
├── assets/                        # Extension assets
├── dist/                          # Build output
│   ├── extension.js               # Bundled extension
│   └── webview/                   # Bundled webview
├── package.json                   # Extension manifest
├── tsconfig.extension.json        # Extension TypeScript config
├── tsconfig.webview.json          # Webview TypeScript config
├── vite.config.ts                 # Vite configuration
└── vitest.config.ts               # Test configuration
```

## Architecture Overview

The extension follows a dual-process architecture:

### Extension Host (Node.js)

The extension runs in the VS Code extension host process:

- **extension.ts**: Entry point, handles activation and command registration
- **ClaudeService**: Manages the Claude CLI subprocess, handles stdin/stdout communication
- **ConversationService**: Persists conversation history to workspace storage
- **PermissionService**: Manages tool permission requests and approvals
- **MCPService**: Handles MCP server connections and tool discovery
- **WebviewProvider/PanelProvider**: Creates and manages webview panels

### Webview (Browser/React)

The UI runs in a sandboxed webview:

- **React Components**: Handle all UI rendering
- **Zustand Stores**: Manage application state
- **VS Code API Bridge**: Communicates with extension via postMessage

### Communication Flow

```
User Input --> React Component --> postMessage --> Extension Host
    --> ClaudeService --> Claude CLI (subprocess)
    --> stdout JSON stream --> Extension Host
    --> postMessage --> React Component --> UI Update
```

## Development Environment

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- VS Code 1.94 or higher
- Claude Code CLI installed and authenticated

### Initial Setup

```bash
# Clone and install
git clone https://github.com/claude-flow/claude-flow-chat.git
cd claude-flow-chat
npm install

# Start development mode
npm run dev
```

### Development Workflow

1. Make changes to the code
2. The watch mode will automatically rebuild
3. Press F5 in VS Code to launch Extension Development Host
4. Test changes in the new VS Code window
5. Reload the window (Ctrl+R) to pick up extension changes

## Building the Extension

### Development Build

```bash
# Build both extension and webview
npm run build

# Build extension only
npm run build:extension

# Build webview only
npm run build:webview
```

### Watch Mode

```bash
# Watch both extension and webview
npm run watch

# Watch extension only
npm run watch:extension

# Watch webview only
npm run watch:webview
```

### Production Build

```bash
# Create production build
npm run build

# Create VSIX package
npm run package
```

## Adding New Features

### Adding a New Component

1. Create the component file in the appropriate directory:

```typescript
// src/webview/components/MyComponent/MyComponent.tsx
import React from 'react';

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  onAction
}) => {
  return (
    <div className="my-component">
      <h2>{title}</h2>
      <button onClick={onAction}>Do Action</button>
    </div>
  );
};
```

2. Create an index file for clean exports:

```typescript
// src/webview/components/MyComponent/index.ts
export { MyComponent } from "./MyComponent";
```

3. Add to the main components index:

```typescript
// src/webview/components/index.ts
export * from "./MyComponent";
```

### Adding a New Store

1. Create the store file:

```typescript
// src/webview/stores/myStore.ts
import { create } from "zustand";

interface MyState {
  value: string;
  setValue: (value: string) => void;
}

export const useMyStore = create<MyState>((set) => ({
  value: "",
  setValue: (value) => set({ value }),
}));
```

2. Export from stores index:

```typescript
// src/webview/stores/index.ts
export { useMyStore } from "./myStore";
```

### Adding a New Hook

1. Create the hook file:

```typescript
// src/webview/hooks/useMyHook.ts
import { useState, useEffect } from "react";

export function useMyHook(initialValue: string) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    // Setup logic
    return () => {
      // Cleanup logic
    };
  }, [initialValue]);

  return { value, setValue };
}
```

2. Export from hooks index:

```typescript
// src/webview/hooks/index.ts
export { useMyHook } from "./useMyHook";
```

### Adding a New Extension Command

1. Add command to package.json:

```json
{
  "contributes": {
    "commands": [
      {
        "command": "claude-flow-chat.myCommand",
        "title": "My Command",
        "category": "Claude Flow"
      }
    ]
  }
}
```

2. Register the command in extension.ts:

```typescript
const myCommand = vscode.commands.registerCommand(
  "claude-flow-chat.myCommand",
  () => {
    // Command implementation
  },
);
context.subscriptions.push(myCommand);
```

### Adding a New Service

1. Create the service class:

```typescript
// src/extension/services/MyService.ts
import * as vscode from "vscode";

export class MyService implements vscode.Disposable {
  constructor(private readonly context: vscode.ExtensionContext) {}

  public doSomething(): void {
    // Service logic
  }

  public dispose(): void {
    // Cleanup
  }
}
```

2. Initialize in extension.ts:

```typescript
const myService = new MyService(context);
context.subscriptions.push(myService);
```

## Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

#### Component Tests

```typescript
// src/test/components/MyComponent.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from '@/webview/components/MyComponent';

describe('MyComponent', () => {
  it('renders title', () => {
    render(<MyComponent title="Test" onAction={() => {}} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('calls onAction when button clicked', () => {
    const onAction = vi.fn();
    render(<MyComponent title="Test" onAction={onAction} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onAction).toHaveBeenCalled();
  });
});
```

#### Store Tests

```typescript
// src/test/stores/myStore.test.ts
import { useMyStore } from "@/webview/stores/myStore";

describe("myStore", () => {
  beforeEach(() => {
    useMyStore.getState().setValue("");
  });

  it("updates value", () => {
    useMyStore.getState().setValue("test");
    expect(useMyStore.getState().value).toBe("test");
  });
});
```

#### Utility Tests

```typescript
// src/test/utils/myUtil.test.ts
import { myUtilFunction } from "@/webview/utils/myUtil";

describe("myUtilFunction", () => {
  it("returns expected result", () => {
    expect(myUtilFunction("input")).toBe("expectedOutput");
  });
});
```

## Debugging

### Extension Debugging

1. Set breakpoints in extension code
2. Press F5 to launch Extension Development Host
3. Trigger the code path you want to debug
4. Breakpoints will be hit in the main VS Code window

### Webview Debugging

1. Open the Extension Development Host
2. Open Developer Tools (Help > Toggle Developer Tools)
3. Go to the Sources tab
4. Find webview sources and set breakpoints
5. Or use console.log statements

### Common Debug Scenarios

#### Claude CLI Communication

Add logging in ClaudeService.ts:

```typescript
console.log("Sending to Claude:", JSON.stringify(message));
console.log("Received from Claude:", line);
```

#### Message Passing

Add logging in both extension and webview:

```typescript
// Extension
console.log("Posting to webview:", message);

// Webview
console.log("Received from extension:", event.data);
```

### Debug Configuration

The project includes debug configurations in .vscode/launch.json:

- **Run Extension**: Launch Extension Development Host
- **Extension Tests**: Run extension tests with debugger

## Code Style

### TypeScript Guidelines

- Use strict TypeScript settings
- Define explicit types for function parameters and return values
- Use interfaces for object shapes
- Prefer const assertions for literal types

### React Guidelines

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use TypeScript for prop definitions

### Naming Conventions

- **Files**: PascalCase for components, camelCase for utilities
- **Components**: PascalCase
- **Hooks**: camelCase, prefixed with "use"
- **Stores**: camelCase, prefixed with "use"
- **Constants**: UPPER_SNAKE_CASE

### Import Order

1. React/external libraries
2. VS Code API (extension only)
3. Internal modules (absolute paths)
4. Relative imports
5. Types

### Linting

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix

# Type checking
npm run typecheck
```

## Performance Considerations

### Extension Performance

- Lazy-load services when possible
- Clean up resources in dispose methods
- Use debouncing for frequent operations

### Webview Performance

- Memoize expensive computations
- Use React.memo for pure components
- Virtualize long lists
- Minimize re-renders with proper dependencies

### Build Performance

- The build uses esbuild for fast bundling
- Vite provides fast HMR during development
- Source maps are disabled in production builds
