#!/bin/bash

# Dev script for running extension and webview watchers in parallel
# This avoids issues with concurrently, pyenv, and old Node versions

set -e

# Override PATH to use correct Node.js version (bypasses pyenv)
NODE_VERSION="$(cat .nvmrc)"
export NODE_VERSION
export PATH="$HOME/.nvm/versions/node/v${NODE_VERSION}/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

echo "🚀 Starting Claude Code GUI development servers..."
echo ""
echo "Using Node.js: $(node --version)"
echo "Using npm: $(npm --version)"
echo ""

# Kill any existing processes on ctrl+c
trap 'kill 0' EXIT

# Start extension watcher in background
echo "📦 Starting extension watcher (esbuild)..."
npm run watch:extension &
EXTENSION_PID=$!

# Start webview watcher in background
echo "⚛️  Starting webview watcher (vite)..."
npm run watch:webview &
WEBVIEW_PID=$!

echo ""
echo "✅ Both watchers started!"
echo "   - Extension PID: $EXTENSION_PID"
echo "   - Webview PID: $WEBVIEW_PID"
echo ""
echo "Press Ctrl+C to stop both watchers"
echo "Now press F5 in VSCode to start debugging!"
echo ""

# Wait for both processes
wait
