#!/bin/bash
# Quick Fixes Script - Claude Code GUI
# Applies all quick-win optimizations automatically
# Run from project root: ./scripts/quick-fixes.sh

set -e  # Exit on error

echo "🚀 Claude Code GUI - Quick Fixes Automation"
echo "==========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backup flag
BACKUP=true

# Function to print colored output
print_step() {
    echo -e "${GREEN}▶ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠  $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Backup current state
if [ "$BACKUP" = true ]; then
    print_step "Creating backup..."
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_DIR="backups/pre-optimization-$TIMESTAMP"
    mkdir -p "$BACKUP_DIR"

    # Backup key files
    cp package.json "$BACKUP_DIR/"
    cp package-lock.json "$BACKUP_DIR/"
    cp tsconfig.json "$BACKUP_DIR/"
    cp src/webview/utils/toolInput.ts "$BACKUP_DIR/"

    print_success "Backup created at $BACKUP_DIR"
    echo ""
fi

# 1. Remove unused dependencies
print_step "Step 1/7: Removing unused dependencies..."
npm uninstall react-markdown react-syntax-highlighter remark-gfm --silent
print_success "Removed 3 unused dependencies"
echo "  - react-markdown"
echo "  - react-syntax-highlighter"
echo "  - remark-gfm"
echo "  Expected savings: ~187KB bundle, ~9MB disk space"
echo ""

# 2. Update vulnerable dependencies
print_step "Step 2/7: Updating vulnerable dependencies..."
npm install esbuild@latest --save-dev --silent
npm audit fix --silent
print_success "Updated dependencies and applied security fixes"
echo ""

# 3. Fix tsconfig.json deprecation
print_step "Step 3/7: Fixing tsconfig.json deprecation..."
if grep -q '"baseUrl"' tsconfig.json; then
    # Create temporary file
    sed '/"baseUrl"/d' tsconfig.json > tsconfig.json.tmp

    # Also update paths to be relative
    sed 's/"@\/\*": \["src\/\*"\]/"@\/*": [".\/src\/*"]/' tsconfig.json.tmp > tsconfig.json.tmp2
    sed 's/"@extension\/\*": \["src\/extension\/\*"\]/"@extension\/*": [".\/src\/extension\/*"]/' tsconfig.json.tmp2 > tsconfig.json.tmp3
    sed 's/"@webview\/\*": \["src\/webview\/\*"\]/"@webview\/*": [".\/src\/webview\/*"]/' tsconfig.json.tmp3 > tsconfig.json.tmp4
    sed 's/"@shared\/\*": \["src\/shared\/\*"\]/"@shared\/*": [".\/src\/shared\/*"]/' tsconfig.json.tmp4 > tsconfig.json.tmp5
    sed 's/"@components\/\*": \["src\/webview\/components\/\*"\]/"@components\/*": [".\/src\/webview\/components\/*"]/' tsconfig.json.tmp5 > tsconfig.json.tmp6
    sed 's/"@hooks\/\*": \["src\/webview\/hooks\/\*"\]/"@hooks\/*": [".\/src\/webview\/hooks\/*"]/' tsconfig.json.tmp6 > tsconfig.json.tmp7
    sed 's/"@utils\/\*": \["src\/shared\/utils\/\*"\]/"@utils\/*": [".\/src\/shared\/utils\/*"]/' tsconfig.json.tmp7 > tsconfig.json.tmp8
    sed 's/"@types\/\*": \["src\/shared\/types\/\*"\]/"@types\/*": [".\/src\/shared\/types\/*"]/' tsconfig.json.tmp8 > tsconfig.json.new

    mv tsconfig.json.new tsconfig.json
    rm -f tsconfig.json.tmp*

    print_success "Removed deprecated baseUrl and updated paths"
else
    print_warning "baseUrl not found in tsconfig.json (may already be fixed)"
fi
echo ""

# 4. Fix unused import in toolInput.ts
print_step "Step 4/7: Fixing unused import in toolInput.ts..."
if grep -q "extractCodeBlocks" src/webview/utils/toolInput.ts; then
    sed -i '' 's/{ escapeHtml, extractCodeBlocks }/{ escapeHtml }/' src/webview/utils/toolInput.ts
    print_success "Removed unused extractCodeBlocks import"
else
    print_warning "extractCodeBlocks import not found (may already be fixed)"
fi
echo ""

# 5. Fix non-null assertions in toolInput.ts (replace ! with ?? defaults)
print_step "Step 5/7: Fixing non-null assertions in toolInput.ts..."
# This is a simplified fix - for production, manual review recommended
sed -i '' 's/options\.maxSummaryLength!/options.maxSummaryLength ?? defaultOptions.maxSummaryLength/g' src/webview/utils/toolInput.ts
sed -i '' 's/options\.expandableThreshold!/options.expandableThreshold ?? defaultOptions.expandableThreshold/g' src/webview/utils/toolInput.ts
sed -i '' 's/options\.includeSyntaxHints!/options.includeSyntaxHints ?? defaultOptions.includeSyntaxHints/g' src/webview/utils/toolInput.ts
sed -i '' 's/options\.escapeHtmlContent!/options.escapeHtmlContent ?? defaultOptions.escapeHtmlContent/g' src/webview/utils/toolInput.ts
print_success "Replaced non-null assertions with nullish coalescing"
print_warning "Note: This is an automated fix. Manual review recommended for complex cases."
echo ""

# 6. Rebuild project
print_step "Step 6/7: Rebuilding project..."
npm run build
BUILD_EXIT_CODE=$?
if [ $BUILD_EXIT_CODE -eq 0 ]; then
    print_success "Build completed successfully"
else
    print_error "Build failed with exit code $BUILD_EXIT_CODE"
    echo "Please review the errors above and fix manually"
    exit 1
fi
echo ""

# 7. Run tests
print_step "Step 7/7: Running tests..."
npm test
TEST_EXIT_CODE=$?
if [ $TEST_EXIT_CODE -eq 0 ]; then
    print_success "All tests passed"
else
    print_error "Tests failed with exit code $TEST_EXIT_CODE"
    echo "Please review test failures and fix manually"
    exit 1
fi
echo ""

# Summary
echo "========================================="
echo -e "${GREEN}✅ Quick Fixes Complete!${NC}"
echo "========================================="
echo ""
echo "Applied fixes:"
echo "  ✓ Removed 3 unused dependencies"
echo "  ✓ Updated vulnerable packages"
echo "  ✓ Fixed tsconfig.json deprecation"
echo "  ✓ Removed unused imports"
echo "  ✓ Fixed non-null assertions"
echo "  ✓ Rebuilt project successfully"
echo "  ✓ All tests passing"
echo ""
echo "Expected improvements:"
echo "  • Bundle size: -187KB (~35%)"
echo "  • Security: -3 vulnerabilities"
echo "  • TypeScript: -30 LSP warnings"
echo ""
echo "Next steps:"
echo "  1. Review changes: git diff"
echo "  2. Test manually in VS Code"
echo "  3. Commit if everything works: git add . && git commit -m 'Apply quick fixes'"
echo "  4. Review detailed reports in /docs for additional optimizations"
echo ""
echo "Backup location: $BACKUP_DIR"
echo "To rollback: cp $BACKUP_DIR/* ."
echo ""
