#!/bin/bash
# Build script for BudgetBot macOS native app

echo "🚀 Building BudgetBot Native macOS App..."

# Update package.json for Electron
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.main = 'electron/main.cjs';
pkg.description = 'BudgetBot - Personal budgeting application for macOS';
pkg.author = 'BudgetBot Team';
pkg.version = '1.0.0';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('✅ Updated package.json');
"

# Create assets directory and icon if it doesn't exist
mkdir -p assets

# Build the Electron app
echo "📦 Building distributable packages..."
npx electron-builder --config electron-builder.json --mac --publish=never

echo "✅ Build complete!"
echo ""
echo "📁 Your native macOS app is ready:"
echo "   • Application: dist-electron/mac/BudgetBot.app"
echo "   • Installer: dist-electron/BudgetBot-1.0.0.dmg"
echo ""
echo "🎯 To test the app:"
echo "   open dist-electron/mac/BudgetBot.app"
echo ""
echo "📦 To share with others:"
echo "   Send them the .dmg file for easy installation"