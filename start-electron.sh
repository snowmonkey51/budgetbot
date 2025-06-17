#!/bin/bash

# Start the Express server in the background
echo "Starting Express server..."
NODE_ENV=development npm run dev &
SERVER_PID=$!

# Wait for the server to be ready
echo "Waiting for server to start..."
npx wait-on http://localhost:5000

# Start Electron
echo "Starting Electron app..."
NODE_ENV=development npx electron .

# Clean up: kill the server when Electron closes
kill $SERVER_PID 2>/dev/null