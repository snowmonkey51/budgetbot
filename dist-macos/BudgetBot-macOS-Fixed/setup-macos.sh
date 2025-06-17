#!/bin/bash

# BudgetBot macOS Setup Script
# This script helps set up BudgetBot on macOS with all necessary dependencies

set -e

echo "🤖 Welcome to BudgetBot macOS Setup!"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    echo "Please install Node.js 18 or later from https://nodejs.org/"
    echo "Then run this script again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old."
    echo "Please install Node.js 18 or later from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node --version) detected"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not available"
    exit 1
fi

echo "✅ npm $(npm --version) detected"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "⚙️  Creating environment configuration..."
    cat > .env << EOL
# BudgetBot Configuration
NODE_ENV=development
PORT=5000

# Optional: PostgreSQL Database
# Uncomment and configure if you want to use PostgreSQL instead of in-memory storage
# DATABASE_URL=postgresql://username:password@localhost:5432/budgetbot
EOL
    echo "✅ Created .env file with default configuration"
else
    echo "✅ .env file already exists"
fi

# Check if PostgreSQL is available (optional)
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL detected (optional database support available)"
else
    echo "ℹ️  PostgreSQL not detected (will use in-memory storage)"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start BudgetBot:"
echo "  npm run dev"
echo ""
echo "Then open your browser to: http://localhost:5000"
echo ""
echo "For more information, see README-macOS.md"