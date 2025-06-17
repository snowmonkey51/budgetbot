#!/bin/bash

# BudgetBot Electron Build Script for macOS
# This script builds the complete native macOS application

set -e

echo "🤖 Building BudgetBot Native macOS Application"
echo "============================================"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build the web application first
echo "📦 Building web application..."
npm run build

# Verify build output exists
if [ ! -d "dist" ]; then
    echo "❌ Web application build failed"
    exit 1
fi

echo "✅ Web application built successfully"

# Create icon from SVG (requires rsvg-convert or similar)
echo "🎨 Creating application icons..."

# Create different icon sizes for macOS
mkdir -p assets/icon.iconset

# If ImageMagick is available, convert SVG to different sizes
if command -v convert &> /dev/null; then
    convert assets/budgetbot-icon.svg -resize 16x16 assets/icon.iconset/icon_16x16.png
    convert assets/budgetbot-icon.svg -resize 32x32 assets/icon.iconset/icon_16x16@2x.png
    convert assets/budgetbot-icon.svg -resize 32x32 assets/icon.iconset/icon_32x32.png
    convert assets/budgetbot-icon.svg -resize 64x64 assets/icon.iconset/icon_32x32@2x.png
    convert assets/budgetbot-icon.svg -resize 128x128 assets/icon.iconset/icon_128x128.png
    convert assets/budgetbot-icon.svg -resize 256x256 assets/icon.iconset/icon_128x128@2x.png
    convert assets/budgetbot-icon.svg -resize 256x256 assets/icon.iconset/icon_256x256.png
    convert assets/budgetbot-icon.svg -resize 512x512 assets/icon.iconset/icon_256x256@2x.png
    convert assets/budgetbot-icon.svg -resize 512x512 assets/icon.iconset/icon_512x512.png
    convert assets/budgetbot-icon.svg -resize 1024x1024 assets/icon.iconset/icon_512x512@2x.png
    
    # Create .icns file for macOS
    if command -v iconutil &> /dev/null; then
        iconutil -c icns assets/icon.iconset -o assets/budgetbot-icon.icns
        echo "✅ macOS icon created"
    else
        echo "⚠️  iconutil not found - using PNG icon as fallback"
        cp assets/budgetbot-icon.svg assets/budgetbot-icon.png
    fi
else
    echo "⚠️  ImageMagick not found - using SVG icon as fallback"
    cp assets/budgetbot-icon.svg assets/budgetbot-icon.png
fi

# Clean previous electron build
if [ -d "dist-electron" ]; then
    rm -rf dist-electron
fi

# Update main entry point in package.json for Electron
echo "⚙️  Configuring Electron entry point..."

# Build the Electron application
echo "🔨 Building Electron application..."
npx electron-builder --config electron/electron-builder.json --mac --publish=never

if [ -d "dist-electron" ]; then
    echo ""
    echo "🎉 Build Complete!"
    echo ""
    echo "📱 macOS Application created in: dist-electron/"
    echo ""
    ls -la dist-electron/
    echo ""
    echo "🚀 To install:"
    echo "   - Open dist-electron/ folder"
    echo "   - Double-click the .dmg file to mount"
    echo "   - Drag BudgetBot to Applications folder"
    echo ""
    echo "💡 To run directly:"
    echo "   - Right-click BudgetBot.app and select 'Open'"
    echo "   - Or use: open dist-electron/mac/BudgetBot.app"
else
    echo "❌ Electron build failed"
    exit 1
fi