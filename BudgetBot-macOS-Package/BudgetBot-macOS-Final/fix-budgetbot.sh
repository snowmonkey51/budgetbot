#!/bin/bash

# BudgetBot Quick Fix Script
# Run this in your /Applications/BudgetBot-macOS folder

echo "Fixing BudgetBot configuration for local use..."

# Replace the storage configuration to use in-memory storage
sed -i '' 's/export const storage = new DatabaseStorage();/export const storage = new MemStorage();/' server/storage.ts

# Create a proper .env file for local use
cat > .env << 'EOL'
NODE_ENV=development
PORT=5000
EOL

# Make sure all scripts are executable
chmod +x *.sh *.command

echo "✅ BudgetBot is now configured for local use without database"
echo "Starting BudgetBot..."

# Start the application
npm run dev