#!/bin/bash

# BudgetBot macOS Launcher
# Double-click this file to start BudgetBot

cd "$(dirname "$0")"

echo "🤖 Starting BudgetBot..."
echo "======================="

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the application
echo "Launching BudgetBot on http://localhost:5000"
echo "Press Ctrl+C to stop the application"
echo ""

npm run dev