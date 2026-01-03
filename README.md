# Claude Code GUI

A modern, feature-rich VS Code extension that provides a beautiful React-based chat interface for Claude Code CLI. Seamlessly integrate AI-powered code assistance directly into your development workflow with real-time streaming, tool visualization, and comprehensive MCP (Model Context Protocol) support.

## Features

### Core Chat Experience

- **Real-time Streaming**: Watch responses as they are generated with live streaming support
- **Markdown Rendering**: Full GitHub-flavored Markdown with syntax highlighting
- **Code Block Support**: Syntax-highlighted code blocks with one-click copy functionality
- **Message History**: Browse and search through conversation history with session persistence

### Tool Visualization

- **Tool Use Cards**: Visual representation of tool calls with expandable details
- **Diff Viewer**: Side-by-side and unified diff views for file changes
- **Todo Display**: Interactive todo list tracking for multi-step tasks
- **Tool Result Cards**: Clear visualization of tool execution results

### Permission Management

- **Permission Modal**: Approve or deny tool operations with context
- **Yolo Mode**: Skip permission checks for trusted operations (use with caution)
- **Auto-approve Patterns**: Configure command patterns for automatic approval
- **Session-based Permissions**: Grant permissions for the current session

### Model Context Protocol (MCP)

- **MCP Server Support**: Connect to and manage MCP servers
- **Server Status Monitoring**: Real-time status of connected MCP servers
- **Tool Discovery**: Automatic discovery of available MCP tools

### User Interface

- **VS Code Native Theming**: Seamlessly integrates with your VS Code theme
- **Activity Bar Integration**: Quick access from the VS Code activity bar
- **Status Bar**: Real-time connection and processing status
- **Keyboard Shortcuts**: Efficient workflow with customizable shortcuts
- **Thinking Mode**: Extended thinking with configurable intensity levels

### Advanced Features

- **WSL Support**: Full Windows Subsystem for Linux integration
- **Multiple Models**: Support for Claude Sonnet 4, Opus 4.5, and more
- **Plan Mode**: Review changes before execution
- **Context Awareness**: Automatic file and workspace context inclusion
- **Slash Commands**: Quick actions via slash command interface

## Prerequisites

Before installing Claude Code GUI, ensure you have:

- **VS Code**: Version 1.94.0 or higher
- **Claude Code CLI**: Installed and authenticated
  ```bash
  npm install -g @anthropic-ai/claude-code
  claude auth login
  ```
- **Node.js**: Version 22.21.1

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Claude Code GUI"
4. Click Install

### Manual Installation

1. Download the latest `.vsix` file from the releases page
2. Open VS Code
3. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
4. Click the "..." menu and select "Install from VSIX..."
5. Select the downloaded `.vsix` file

### From Source

```bash
# Clone the repository
git clone https://github.com/claude-flow/claude-code-gui.git
cd claude-code-gui

# Install dependencies
npm install

# Build the extension
npm run build

# Package the extension
npm run package
```

## Usage

### Opening the Chat

- **Keyboard Shortcut**: Press `Ctrl+Shift+C` (Windows/Linux) or `Cmd+Shift+C` (macOS)
- **Command Palette**: Open with `Ctrl+Shift+P` and run "Open Claude Code GUI"
- **Activity Bar**: Click the Claude Code GUI icon in the activity bar
- **Status Bar**: Click the Claude status bar item

### Sending Messages

1. Type your message in the input area at the bottom
2. Press Enter or click the send button
3. Optionally attach files or images using the toolbar buttons

### Context Menu Actions

Right-click on selected code in the editor to access:

- **Send Selection to Claude**: Send the selected code for analysis
- **Explain Code with Claude**: Get an explanation of the selected code
- **Refactor Code with Claude**: Request code refactoring suggestions
- **Generate Tests with Claude**: Generate unit tests for the selected code
- **Fix Error with Claude**: Get help fixing errors

### Slash Commands

Type `/` in the input to see available commands:

- `/help` - Show available commands
- `/clear` - Clear the current conversation
- `/settings` - Open extension settings
- `/model` - Change the Claude model

## Configuration

Access settings via the gear icon in the chat header or through VS Code settings (Ctrl+,).

### Claude Settings

| Setting                           | Default                    | Description                       |
| --------------------------------- | -------------------------- | --------------------------------- |
| `claudeCodeGui.claude.executable` | `claude`                   | Path to the Claude CLI executable |
| `claudeCodeGui.claude.model`      | `claude-sonnet-4-20250514` | Default Claude model              |

### Thinking Mode

| Setting                              | Default | Description                                                      |
| ------------------------------------ | ------- | ---------------------------------------------------------------- |
| `claudeCodeGui.thinking.enabled`     | `true`  | Enable extended thinking mode                                    |
| `claudeCodeGui.thinking.intensity`   | `think` | Thinking intensity (think, think-hard, think-harder, ultrathink) |
| `claudeCodeGui.thinking.showProcess` | `true`  | Show the thinking process in chat                                |

### Permissions

| Setting                                 | Default | Description                      |
| --------------------------------------- | ------- | -------------------------------- |
| `claudeCodeGui.permissions.yoloMode`    | `false` | Skip permission checks           |
| `claudeCodeGui.permissions.autoApprove` | `[]`    | Command patterns to auto-approve |

### Chat Settings

| Setting                              | Default | Description                   |
| ------------------------------------ | ------- | ----------------------------- |
| `claudeCodeGui.chat.maxHistorySize`  | `100`   | Maximum conversations to keep |
| `claudeCodeGui.chat.streamResponses` | `true`  | Enable response streaming     |
| `claudeCodeGui.chat.showTimestamps`  | `true`  | Show message timestamps       |
| `claudeCodeGui.chat.codeBlockTheme`  | `auto`  | Code block syntax theme       |

### WSL Settings (Windows)

| Setting                        | Default                 | Description            |
| ------------------------------ | ----------------------- | ---------------------- |
| `claudeCodeGui.wsl.enabled`    | `false`                 | Enable WSL integration |
| `claudeCodeGui.wsl.distro`     | `Ubuntu`                | WSL distribution name  |
| `claudeCodeGui.wsl.nodePath`   | `/usr/bin/node`         | Node.js path in WSL    |
| `claudeCodeGui.wsl.claudePath` | `/usr/local/bin/claude` | Claude path in WSL     |

### UI Settings

| Setting                        | Default | Description                |
| ------------------------------ | ------- | -------------------------- |
| `claudeCodeGui.ui.fontSize`    | `14`    | Chat message font size     |
| `claudeCodeGui.ui.compactMode` | `false` | Use compact message layout |
| `claudeCodeGui.ui.showAvatars` | `true`  | Show message avatars       |

### Context Settings

| Setting                                      | Default | Description                   |
| -------------------------------------------- | ------- | ----------------------------- |
| `claudeCodeGui.context.includeFileContext`   | `true`  | Include current file context  |
| `claudeCodeGui.context.includeWorkspaceInfo` | `true`  | Include workspace information |
| `claudeCodeGui.context.maxContextLines`      | `500`   | Maximum context lines         |

## Development Setup

### Prerequisites

- Node.js 22.21.1
- npm or yarn
- VS Code

### Getting Started

```bash
# Clone the repository
git clone https://github.com/claude-flow/claude-code-gui.git
cd claude-code-gui

# Install dependencies
npm install

# Start development mode
npm run dev
```

### Debugging

1. Open the project in VS Code
2. Press F5 to launch the Extension Development Host
3. The extension will be available in the new VS Code window

### Available Scripts

| Command                 | Description                 |
| ----------------------- | --------------------------- |
| `npm run build`         | Build extension and webview |
| `npm run watch`         | Watch mode for development  |
| `npm run dev`           | Alias for watch             |
| `npm run lint`          | Run ESLint                  |
| `npm run lint:fix`      | Fix linting issues          |
| `npm run typecheck`     | TypeScript type checking    |
| `npm run test`          | Run tests                   |
| `npm run test:watch`    | Run tests in watch mode     |
| `npm run test:coverage` | Run tests with coverage     |
| `npm run package`       | Create VSIX package         |
| `npm run clean`         | Clean build artifacts       |

## Building and Packaging

### Development Build

```bash
npm run build
```

### Production Package

```bash
npm run package
```

This creates a `.vsix` file that can be distributed and installed in VS Code.

### Publishing

```bash
npm run publish
```

Note: Publishing requires proper Azure DevOps credentials configured.

## Tech Stack

- **Frontend Framework**: React 18
- **Language**: TypeScript 5.x
- **Build Tool**: Vite 6
- **Bundler (Extension)**: esbuild
- **Styling**: TailwindCSS 3
- **State Management**: Zustand 5
- **Markdown**: react-markdown with remark-gfm
- **Syntax Highlighting**: react-syntax-highlighter
- **Icons**: Lucide React
- **Testing**: Vitest with Testing Library

## Project Structure

```
claude-code-gui/
├── src/
│   ├── extension/           # VS Code extension code
│   │   ├── services/        # Claude, MCP, Permission services
│   │   └── webview/         # Webview providers
│   ├── webview/             # React webview application
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── stores/          # Zustand state stores
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Utility functions
│   ├── shared/              # Shared code between extension and webview
│   └── test/                # Test files
├── docs/                    # Documentation
├── assets/                  # Extension assets (icons, etc.)
├── dist/                    # Build output
└── package.json            # Project configuration
```

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm run test`)
5. Run linting (`npm run lint`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Style

- Follow the existing code style
- Use TypeScript for all new code
- Write tests for new features
- Update documentation as needed

### Commit Messages

- Use clear, descriptive commit messages
- Reference issues when applicable

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Anthropic](https://www.anthropic.com/) for the Claude AI
- [VS Code](https://code.visualstudio.com/) for the extensibility platform
- All contributors who help improve this extension

## Support

- **Issues**: [GitHub Issues](https://github.com/claude-flow/claude-code-gui/issues)
- **Discussions**: [GitHub Discussions](https://github.com/claude-flow/claude-code-gui/discussions)
