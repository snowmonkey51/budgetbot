#!/bin/bash

# BudgetBot macOS Installer Script
# This script installs both the app bundle and the backend files

echo "🤖 BudgetBot macOS Installer"
echo "=============================="

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This installer is for macOS only"
    exit 1
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    echo "Please install Node.js 18+ from: https://nodejs.org/"
    open "https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required (found v$NODE_VERSION)"
    echo "Please update Node.js from: https://nodejs.org/"
    open "https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node -v) found"

# Install backend files
echo "📦 Installing BudgetBot backend..."
if [ -d "/Applications/BudgetBot-macOS-Final" ]; then
    echo "🔄 Removing existing installation..."
    rm -rf "/Applications/BudgetBot-macOS-Final"
fi

cp -r "BudgetBot-macOS-Final" "/Applications/"
cd "/Applications/BudgetBot-macOS-Final"

echo "📥 Installing dependencies..."
npm install --silent

# Install app bundle
echo "🖥️ Installing BudgetBot.app..."
if [ -d "/Applications/BudgetBot.app" ]; then
    rm -rf "/Applications/BudgetBot.app"
fi

cp -r "../BudgetBot.app" "/Applications/"

echo ""
echo "🎉 BudgetBot installed successfully!"
echo ""
echo "To launch BudgetBot:"
echo "1. Double-click BudgetBot.app in your Applications folder"
echo "2. Or use Spotlight: Press Cmd+Space and type 'BudgetBot'"
echo ""
echo "The app will automatically:"
echo "- Start the BudgetBot server"
echo "- Open your browser to http://localhost:5000"
echo "- Show your personal budgeting dashboard"
echo ""

# Create desktop shortcut
read -p "Create desktop shortcut? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ln -sf "/Applications/BudgetBot.app" "$HOME/Desktop/BudgetBot.app"
    echo "✅ Desktop shortcut created"
fi

echo ""
echo "Installation complete! 🤖💰"