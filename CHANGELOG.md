# Changelog

All notable changes to the Claude Code GUI extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-01-01

### Added

#### Core Features

- Initial release of Claude Code GUI VS Code extension
- Beautiful React-based chat interface for Claude Code CLI
- Real-time streaming responses from Claude AI
- Full conversation history with session persistence
- Markdown rendering with GitHub-flavored Markdown support
- Syntax-highlighted code blocks with copy functionality

#### Tool Visualization

- Tool use cards with expandable input/output details
- Diff viewer for file changes (side-by-side and unified views)
- Todo display for tracking multi-step task progress
- Tool result cards with status indicators

#### Permission System

- Permission modal for approving/denying tool operations
- Yolo mode for skipping permission checks
- Auto-approve patterns configuration
- Session-based permission grants

#### Model Context Protocol (MCP)

- MCP server connection support
- Server status monitoring panel
- Automatic tool discovery from MCP servers

#### User Interface

- VS Code native theme integration
- Activity bar icon for quick access
- Status bar with connection status
- Keyboard shortcut support (Ctrl/Cmd+Shift+C)
- Settings modal with all configuration options

#### Model Support

- Claude Sonnet 4 (claude-sonnet-4-20250514)
- Claude Opus 4.5 (claude-opus-4-5-20251101)
- Claude 3.5 Sonnet (claude-3-5-sonnet-20241022)
- Claude 3.5 Haiku (claude-3-5-haiku-20241022)

#### Thinking Mode

- Extended thinking mode support
- Configurable thinking intensity levels
- Think, think-hard, think-harder, ultrathink options
- Thinking process visualization in chat

#### Context Features

- Current file context inclusion
- Workspace information context
- Configurable context line limits
- File and image attachment support

#### Windows Support

- WSL (Windows Subsystem for Linux) integration
- Configurable WSL distribution
- Path conversion for WSL

#### Editor Integration

- Context menu commands for selected code
- Send selection to Claude
- Explain code with Claude
- Refactor code with Claude
- Generate tests with Claude
- Fix error with Claude

#### Slash Commands

- `/help` - Show available commands
- `/clear` - Clear conversation
- `/settings` - Open settings
- `/model` - Change model

#### State Management

- Zustand-based state management
- Separate stores for chat, settings, UI, permissions, MCP
- Cross-component state synchronization
- Webview state persistence

### Technical Details

- React 18 with TypeScript
- Vite 6 for webview bundling
- esbuild for extension bundling
- TailwindCSS for styling
- Vitest for testing
- ESLint for code quality

### Known Issues

- WSL path conversion may not work for all drive letters
- Some MCP servers may require manual configuration

### Notes

- Requires Claude Code CLI to be installed and authenticated
- Requires VS Code 1.94.0 or higher
- Requires Node.js 22.21.1 for development
