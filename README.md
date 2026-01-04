<p align="center">
  <img src="assets/icon.png" alt="Claude Code GUI" width="128" height="128">
</p>

<h1 align="center">Claude Code GUI</h1>

<p align="center">
  <strong>🚀 A stunning, modern AI-powered chat interface for Claude Code CLI</strong>
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=MaheshKok.claude-code-gui">
    <img src="https://img.shields.io/visual-studio-marketplace/v/MaheshKok.claude-code-gui?style=for-the-badge&logo=visual-studio-code&logoColor=white&label=VS%20Code&color=007ACC" alt="VS Code Marketplace">
  </a>
  <a href="https://marketplace.visualstudio.com/items?itemName=MaheshKok.claude-code-gui">
    <img src="https://img.shields.io/visual-studio-marketplace/d/MaheshKok.claude-code-gui?style=for-the-badge&logo=visual-studio-code&logoColor=white&color=007ACC" alt="Downloads">
  </a>
  <a href="https://github.com/MaheshKok/claude-code-gui-vscode/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/MaheshKok/claude-code-gui-vscode?style=for-the-badge&color=orange" alt="License">
  </a>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#%EF%B8%8F-configuration">Configuration</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/TailwindCSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="TailwindCSS">
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Zustand-5-orange?style=flat-square" alt="Zustand">
</p>

---

## ✨ Why Claude Code GUI?

Transform your VS Code into a powerful AI coding companion. Claude Code GUI brings the intelligence of Anthropic's Claude directly into your editor with a **beautiful, modern interface** designed for developers who demand excellence.

> 💡 **Built for productivity** — Real-time streaming, keyboard shortcuts, and seamless VS Code integration make coding with AI feel natural.

---

## 🎯 Features

### 🗨️ **Intelligent Chat Experience**

- **Real-time Streaming** — Watch responses appear as Claude thinks
- **Rich Markdown** — Full GitHub-flavored markdown with syntax highlighting
- **Code Blocks** — Beautiful syntax highlighting with one-click copy
- **Session Persistence** — Your conversations survive restarts

### 🛠️ **Powerful Tool Visualization**

- **Tool Use Cards** — See exactly what Claude is doing
- **Diff Viewer** — Side-by-side and unified views for file changes
- **Todo Tracking** — Visual progress for multi-step tasks
- **File Attachments** — Upload files and images directly

### 🧠 **Advanced AI Modes**

| Mode                | Description             | Token Budget |
| ------------------- | ----------------------- | ------------ |
| 🧠 **Think**        | Basic reasoning         | 4K tokens    |
| 🔥 **Think Hard**   | Deeper analysis         | 10K tokens   |
| 💪 **Think Harder** | Comprehensive reasoning | 20K tokens   |
| ⚡ **Ultrathink**   | Maximum depth           | 32K tokens   |

### 🔐 **Smart Permission System**

- **Permission Modal** — Review and approve operations
- **YOLO Mode** — Speed through trusted operations
- **Auto-approve Patterns** — Configure what gets approved automatically

### 🌐 **Model Context Protocol (MCP)**

- Connect to MCP servers for extended capabilities
- Real-time server status monitoring
- Automatic tool discovery

---

## 📥 Installation

### From VS Code Marketplace

1. Open **VS Code**
2. Press `Ctrl+Shift+X` (or `Cmd+Shift+X` on macOS)
3. Search for **"Claude Code GUI"**
4. Click **Install**

### Prerequisites

Before using Claude Code GUI, ensure you have:

```bash
# Install Claude Code CLI
npm install -g @anthropic-ai/claude-code

# Authenticate with Anthropic
claude auth login
```

> ⚠️ **Requires**: VS Code 1.94+ and Node.js 22+

---

## 🚀 Quick Start

### Open the Chat

| Method                 | Action                                                  |
| ---------------------- | ------------------------------------------------------- |
| ⌨️ **Keyboard**        | `Ctrl+Shift+C` (Windows/Linux) or `Cmd+Shift+C` (macOS) |
| 🔍 **Command Palette** | `Ctrl+Shift+P` → "Open Claude Code GUI"                 |
| 🎯 **Activity Bar**    | Click the Claude icon in the sidebar                    |

### Your First Message

1. Type your question or paste code
2. Press **Enter** to send
3. Watch Claude respond in real-time! ✨

### Right-Click Magic

Select any code in your editor and right-click to:

- 📝 **Explain Code** — Get a detailed explanation
- 🔧 **Refactor** — Improve code quality
- 🧪 **Generate Tests** — Create unit tests
- 🐛 **Fix Error** — Debug issues fast

---

## ⚙️ Configuration

Access settings via **Gear icon** in chat header or `Ctrl+,` → search "Claude Code GUI"

### Essential Settings

| Setting                | Default           | Description             |
| ---------------------- | ----------------- | ----------------------- |
| `claude.executable`    | `claude`          | Path to Claude CLI      |
| `claude.model`         | `claude-sonnet-4` | Default AI model        |
| `thinking.enabled`     | `true`            | Extended thinking mode  |
| `permissions.yoloMode` | `false`           | Skip permission prompts |

### WSL Users (Windows)

```json
{
    "claudeCodeGui.wsl.enabled": true,
    "claudeCodeGui.wsl.distro": "Ubuntu"
}
```

---

## 🎨 User Interface

<table>
<tr>
<td width="50%">

### 💬 Chat Panel

- Beautiful glassmorphism design
- Dark mode optimized
- Smooth animations
- Responsive layout

</td>
<td width="50%">

### 🎛️ Toolbar

- Model selector (Sonnet, Opus, Haiku)
- Thinking mode intensity
- Plan mode toggle
- File attachments

</td>
</tr>
</table>

---

## 🛠️ Development

### Setup

```bash
# Clone the repository
git clone https://github.com/MaheshKok/claude-code-gui-vscode.git
cd claude-code-gui-vscode

# Install dependencies
npm install

# Start development
npm run dev
```

### Available Commands

| Command             | Description          |
| ------------------- | -------------------- |
| `npm run build`     | Build for production |
| `npm run dev`       | Watch mode           |
| `npm run lint`      | Run ESLint           |
| `npm run typecheck` | TypeScript check     |
| `npm run test`      | Run tests            |
| `npm run package`   | Create .vsix file    |

### Project Architecture

```
📦 claude-code-gui/
├── 📂 src/
│   ├── 📂 extension/      # VS Code extension core
│   │   ├── services/      # Claude, MCP, Permissions
│   │   └── webview/       # Panel providers
│   ├── 📂 webview/        # React application
│   │   ├── components/    # UI components
│   │   ├── hooks/         # Custom hooks
│   │   ├── stores/        # Zustand stores
│   │   └── types/         # TypeScript types
│   └── 📂 shared/         # Shared utilities
├── 📂 assets/             # Icons & images
└── 📂 dist/               # Build output
```

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing`)
5. **Open** a Pull Request

### Code Standards

- ✅ TypeScript for all code
- ✅ ESLint + Prettier formatting
- ✅ Tests for new features
- ✅ Descriptive commit messages

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

<table>
<tr>
<td align="center">
  <a href="https://www.anthropic.com/">
    <strong>Anthropic</strong><br>
    <sub>For creating Claude AI</sub>
  </a>
</td>
<td align="center">
  <a href="https://code.visualstudio.com/">
    <strong>VS Code</strong><br>
    <sub>The best code editor</sub>
  </a>
</td>
<td align="center">
  <a href="https://github.com/MaheshKok/claude-code-gui-vscode/graphs/contributors">
    <strong>Contributors</strong><br>
    <sub>Making this better</sub>
  </a>
</td>
</tr>
</table>

---

<p align="center">
  <strong>Made with ❤️ by <a href="https://github.com/MaheshKok">Mahesh Kokare</a></strong>
</p>

<p align="center">
  <a href="https://github.com/MaheshKok/claude-code-gui-vscode/issues">Report Bug</a> •
  <a href="https://github.com/MaheshKok/claude-code-gui-vscode/issues">Request Feature</a> •
  <a href="https://github.com/MaheshKok/claude-code-gui-vscode/discussions">Discussions</a>
</p>

<p align="center">
  ⭐ Star this repo if you find it useful!
</p>
