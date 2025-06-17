#!/bin/bash

# BudgetBot macOS Automated Installer
# This script downloads and sets up BudgetBot for local use on macOS

set -e

INSTALL_DIR="$HOME/Applications/BudgetBot"
TEMP_DIR="/tmp/budgetbot-install"

echo "🤖 BudgetBot macOS Installer"
echo "==========================="
echo ""

# Check system requirements
echo "Checking system requirements..."

# Check macOS version
SW_VERS=$(sw_vers -productVersion)
echo "✅ macOS $SW_VERS detected"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    echo ""
    echo "Please install Node.js first:"
    echo "1. Visit https://nodejs.org/"
    echo "2. Download and install Node.js 18 or later"
    echo "3. Run this installer again"
    echo ""
    open "https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old (requires 18+)"
    echo "Please update Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node --version) is compatible"

# Create installation directory
echo ""
echo "Setting up installation directory..."
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Copy application files if running from source
if [ -f "$(dirname "$0")/package.json" ]; then
    echo "Installing from local source..."
    cp -r "$(dirname "$0")"/* .
else
    echo "❌ Source files not found"
    echo "Please run this script from the BudgetBot directory"
    exit 1
fi

# Install dependencies
echo ""
echo "Installing application dependencies..."
npm install --production

# Create .env file
if [ ! -f .env ]; then
    cat > .env << 'EOL'
# BudgetBot Configuration for macOS
NODE_ENV=production
PORT=5000

# Storage: Uses in-memory storage by default
# For PostgreSQL: uncomment and configure the line below
# DATABASE_URL=postgresql://username:password@localhost:5432/budgetbot
EOL
    echo "✅ Created configuration file"
fi

# Create desktop shortcut
echo ""
echo "Creating desktop shortcut..."
DESKTOP_FILE="$HOME/Desktop/BudgetBot.command"
cat > "$DESKTOP_FILE" << EOL
#!/bin/bash
cd "$INSTALL_DIR"
echo "🤖 Starting BudgetBot..."
echo "Open your browser to: http://localhost:5000"
echo "Press Ctrl+C to stop"
echo ""
npm start
EOL
chmod +x "$DESKTOP_FILE"

# Create Applications folder alias
echo "Creating Applications folder shortcut..."
APP_ALIAS="$HOME/Applications/BudgetBot.command"
ln -sf "$DESKTOP_FILE" "$APP_ALIAS"

# Create uninstaller
echo "Creating uninstaller..."
cat > "$INSTALL_DIR/uninstall.sh" << EOL
#!/bin/bash
echo "Removing BudgetBot..."
rm -rf "$INSTALL_DIR"
rm -f "$HOME/Desktop/BudgetBot.command"
rm -f "$HOME/Applications/BudgetBot.command"
echo "BudgetBot has been removed from your system."
EOL
chmod +x "$INSTALL_DIR/uninstall.sh"

echo ""
echo "🎉 Installation Complete!"
echo ""
echo "BudgetBot has been installed to: $INSTALL_DIR"
echo ""
echo "To start BudgetBot:"
echo "• Double-click 'BudgetBot.command' on your Desktop"
echo "• Or run: $INSTALL_DIR/launch-budgetbot-macos.command"
echo ""
echo "The app will be available at: http://localhost:5000"
echo ""
echo "To uninstall: run $INSTALL_DIR/uninstall.sh"
echo ""
echo "Enjoy budgeting with BudgetBot! 🤖"