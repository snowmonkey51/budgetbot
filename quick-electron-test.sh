#!/bin/bash

# Quick Electron Test - Start Electron with existing built files
set -e

echo "Starting BudgetBot Electron Application..."

# Check if dist exists, if not create minimal version
if [ ! -d "dist" ]; then
    echo "Creating minimal build for testing..."
    mkdir -p dist
    # Copy the server build that already exists
    cp server/index.ts dist/index.js 2>/dev/null || echo "// Minimal server" > dist/index.js
fi

# Start Electron directly with the current web server
echo "Launching Electron app..."
NODE_ENV=development npx electron electron/main.js