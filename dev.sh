#!/bin/bash

# Dev script for running extension and webview watchers in parallel
# This avoids issues with concurrently, pyenv, and old Node versions

set -e

# Override PATH to use correct Node.js version (bypasses pyenv)
export PATH="/Users/maheshkokare/.nvm/versions/node/v22.21.1/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export NODE_VERSION="22.21.1"

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
