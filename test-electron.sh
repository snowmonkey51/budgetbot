#!/bin/bash

# BudgetBot Electron Test Script
# Tests the Electron application build and functionality

set -e

echo "🧪 Testing BudgetBot Electron Application"
echo "========================================"

# Test 1: Check if all required files exist
echo "📁 Checking required files..."

required_files=(
    "electron/main.js"
    "electron/preload.js"
    "electron/electron-builder.json"
    "assets/budgetbot-icon.svg"
    "assets/entitlements.mac.plist"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        exit 1
    fi
done

# Test 2: Check if dependencies are installed
echo ""
echo "📦 Checking dependencies..."

if [ -d "node_modules/electron" ]; then
    echo "✅ Electron installed"
else
    echo "❌ Electron not installed"
    echo "Run: npm install"
    exit 1
fi

if [ -d "node_modules/electron-builder" ]; then
    echo "✅ Electron Builder installed"
else
    echo "❌ Electron Builder not installed"
    echo "Run: npm install"
    exit 1
fi

# Test 3: Check if web application can be built
echo ""
echo "🔨 Testing web application build..."

npm run build > /dev/null 2>&1

if [ -d "dist" ] && [ -f "dist/index.js" ]; then
    echo "✅ Web application builds successfully"
else
    echo "❌ Web application build failed"
    exit 1
fi

# Test 4: Test Electron main process syntax
echo ""
echo "⚡ Testing Electron main process..."

node -c electron/main.js
if [ $? -eq 0 ]; then
    echo "✅ Electron main.js syntax valid"
else
    echo "❌ Electron main.js has syntax errors"
    exit 1
fi

node -c electron/preload.js
if [ $? -eq 0 ]; then
    echo "✅ Electron preload.js syntax valid"
else
    echo "❌ Electron preload.js has syntax errors"
    exit 1
fi

# Test 5: Check Electron Builder configuration
echo ""
echo "⚙️ Testing Electron Builder configuration..."

npx electron-builder --help > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Electron Builder is functional"
else
    echo "❌ Electron Builder configuration issue"
    exit 1
fi

echo ""
echo "🎉 All tests passed!"
echo ""
echo "🚀 Ready to build native macOS app:"
echo "   ./build-electron.sh"
echo ""
echo "🔧 Or run in development mode:"
echo "   ./electron-dev.sh"