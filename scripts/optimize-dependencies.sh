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

# Function to check if command succeeded
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
    else
        echo -e "${RED}✗ $1 failed${NC}"
        exit 1
    fi
}

# Backup package.json
echo "📦 Creating backup..."
cp package.json package.json.backup
cp package-lock.json package-lock.json.backup 2>/dev/null || true
check_status "Backup created"

echo ""
echo "Phase 1: Remove unused production dependencies"
echo "-----------------------------------------------"

# Check current sizes
echo "📊 Current bundle sizes:"
npm run build 2>&1 | grep -E "(extension.js|main.js|main.css)"

echo ""
echo "Removing unused packages..."

# Remove unused production dependencies
npm uninstall react-markdown
check_status "Removed react-markdown"

npm uninstall react-syntax-highlighter
check_status "Removed react-syntax-highlighter"

npm uninstall remark-gfm
check_status "Removed remark-gfm"

echo ""
echo "Phase 2: Fix security vulnerabilities"
echo "--------------------------------------"

# Upgrade esbuild
npm install -D esbuild@latest
check_status "Upgraded esbuild"

# Run audit fix
npm audit fix --force || echo -e "${YELLOW}⚠ Some vulnerabilities could not be auto-fixed${NC}"

echo ""
echo "Phase 3: Verification"
echo "---------------------"

# TypeScript check
echo "Checking TypeScript..."
npm run typecheck
check_status "TypeScript compilation"

# Build
echo "Building project..."
npm run build
check_status "Build successful"

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
