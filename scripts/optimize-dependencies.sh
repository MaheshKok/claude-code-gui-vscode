#!/bin/bash
# Dependency Optimization Script
# Auto-generated from dependency-optimization.md report

set -e  # Exit on error

echo "🔍 Dependency Optimization Script"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to run a command and check status
run_step() {
    local message="$1"
    shift
    if "$@"; then
        echo -e "${GREEN}✓ ${message}${NC}"
    else
        echo -e "${RED}✗ ${message} failed${NC}"
        exit 1
    fi
}

# Backup package.json
echo "📦 Creating backup..."
run_step "Backup created" cp package.json package.json.backup
cp package-lock.json package-lock.json.backup 2>/dev/null || true

echo ""
echo "Phase 1: Remove unused production dependencies"
echo "-----------------------------------------------"

# Check current sizes
echo "📊 Current bundle sizes:"
npm run build 2>&1 | grep -E "(extension.js|main.js|main.css)"

echo ""
echo "Removing unused packages..."

# Remove unused production dependencies
run_step "Removed react-markdown" npm uninstall react-markdown
run_step "Removed react-syntax-highlighter" npm uninstall react-syntax-highlighter
run_step "Removed remark-gfm" npm uninstall remark-gfm

echo ""
echo "Phase 2: Fix security vulnerabilities"
echo "--------------------------------------"

# Upgrade esbuild
run_step "Upgraded esbuild" npm install -D esbuild@latest

# Run audit fix
npm audit fix --force || echo -e "${YELLOW}⚠ Some vulnerabilities could not be auto-fixed${NC}"

echo ""
echo "Phase 3: Verification"
echo "---------------------"

# TypeScript check
echo "Checking TypeScript..."
run_step "TypeScript compilation" npm run typecheck

# Build
echo "Building project..."
run_step "Build successful" npm run build

# Show new sizes
echo ""
echo "📊 New bundle sizes:"
npm run build 2>&1 | grep -E "(extension.js|main.js|main.css)"

# Calculate savings
echo ""
echo "💾 Disk space saved:"
du -sh node_modules/ 2>/dev/null || echo "N/A"

# Run tests
echo ""
echo "Running tests..."
npm test || echo -e "${YELLOW}⚠ Some tests failed - review required${NC}"

echo ""
echo "✅ Optimization Complete!"
echo "========================="
echo ""
echo "Next steps:"
echo "1. Review the changes with 'git diff package.json'"
echo "2. Test the extension in VSCode"
echo "3. Verify all features working"
echo "4. If issues found, restore with: mv package.json.backup package.json"
echo "5. Commit changes if everything works"
echo ""
echo "📄 Full report: docs/dependency-optimization.md"
