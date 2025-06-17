#!/bin/bash

# Simple BudgetBot starter for macOS distribution
cd "$(dirname "$0")"

echo "🤖 BudgetBot Starting..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --production
fi

# Start the application
echo "Opening BudgetBot at http://localhost:5000"
echo "Press Ctrl+C to stop"
echo ""

# Try to open browser
sleep 2 && open http://localhost:5000 2>/dev/null &

# Start server
NODE_ENV=development tsx server/index.ts