#!/bin/bash

# BudgetBot Electron Development Script
# Runs the Electron app in development mode

set -e

echo "🤖 Starting BudgetBot Electron Development Mode"
echo "============================================="

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the web server and Electron app concurrently
echo "Starting development servers..."

# Kill any existing processes on the port
lsof -ti:5000 | xargs kill -9 2>/dev/null || true

# Start both the web server and Electron app
NODE_ENV=development npx concurrently \
  "npm run dev" \
  "wait-on http://localhost:5000 && npx electron electron/main.js" \
  --names "server,electron" \
  --prefix-colors "blue,yellow" \
  --kill-others