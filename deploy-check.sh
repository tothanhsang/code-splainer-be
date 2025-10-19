#!/bin/bash

# 🚀 Pre-Deployment Check Script
# Run this before deploying to catch common issues

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Pre-Deployment Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check counter
CHECKS_PASSED=0
CHECKS_FAILED=0

# Function to print success
success() {
    echo -e "${GREEN}✓${NC} $1"
    ((CHECKS_PASSED++))
}

# Function to print error
error() {
    echo -e "${RED}✗${NC} $1"
    ((CHECKS_FAILED++))
}

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo "📦 Checking dependencies..."
if [ -f "package.json" ]; then
    success "package.json exists"
else
    error "package.json not found"
fi

if [ -d "node_modules" ]; then
    success "node_modules exists"
else
    warning "node_modules not found - run 'npm install'"
fi

echo ""
echo "🔧 Checking configuration files..."
if [ -f ".env.example" ]; then
    success ".env.example exists"
else
    error ".env.example not found"
fi

if [ -f "tsconfig.json" ]; then
    success "tsconfig.json exists"
else
    error "tsconfig.json not found"
fi

if [ -f "prisma/schema.prisma" ]; then
    success "Prisma schema exists"
else
    error "Prisma schema not found"
fi

echo ""
echo "🚀 Checking deployment files..."
if [ -f "render.yaml" ]; then
    success "render.yaml exists"
else
    error "render.yaml not found"
fi

if [ -f "Dockerfile" ]; then
    success "Dockerfile exists"
else
    warning "Dockerfile not found (optional)"
fi

if [ -f ".dockerignore" ]; then
    success ".dockerignore exists"
else
    warning ".dockerignore not found (optional)"
fi

echo ""
echo "📚 Checking documentation..."
if [ -f "DEPLOY_QUICK_START.md" ]; then
    success "DEPLOY_QUICK_START.md exists"
else
    error "DEPLOY_QUICK_START.md not found"
fi

if [ -f "docs/DEPLOYMENT.md" ]; then
    success "docs/DEPLOYMENT.md exists"
else
    error "docs/DEPLOYMENT.md not found"
fi

echo ""
echo "🔨 Testing build..."
if npm run build > /dev/null 2>&1; then
    success "Build successful"
else
    error "Build failed - run 'npm run build' to see errors"
fi

echo ""
echo "🧪 Checking build output..."
if [ -d "dist" ]; then
    success "dist/ directory created"
    if [ -f "dist/server.js" ]; then
        success "dist/server.js exists"
    else
        error "dist/server.js not found"
    fi
else
    error "dist/ directory not found"
fi

echo ""
echo "🔐 Checking for sensitive files..."
if [ -f ".env" ]; then
    warning ".env file exists - make sure it's in .gitignore"
fi

if [ -f ".gitignore" ]; then
    if grep -q ".env" .gitignore; then
        success ".env is in .gitignore"
    else
        error ".env is NOT in .gitignore"
    fi
else
    error ".gitignore not found"
fi

echo ""
echo "📝 Checking package.json scripts..."
if grep -q "start:prod" package.json; then
    success "start:prod script exists"
else
    error "start:prod script not found"
fi

if grep -q "prisma:generate" package.json; then
    success "prisma:generate script exists"
else
    error "prisma:generate script not found"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Results"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}Passed: $CHECKS_PASSED${NC}"
echo -e "${RED}Failed: $CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Ready to deploy.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Push to GitHub: git push origin main"
    echo "2. Follow DEPLOY_QUICK_START.md"
    echo "3. Deploy on Render.com"
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Please fix the issues above.${NC}"
    echo ""
    echo "Common fixes:"
    echo "- Run 'npm install' to install dependencies"
    echo "- Run 'npm run build' to check for build errors"
    echo "- Ensure all required files exist"
    exit 1
fi
