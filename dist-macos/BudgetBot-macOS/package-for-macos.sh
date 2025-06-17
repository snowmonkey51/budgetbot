#!/bin/bash

# BudgetBot macOS Distribution Packager
# Creates a distributable package for macOS users

set -e

PACKAGE_NAME="BudgetBot-macOS"
PACKAGE_DIR="./dist-macos"
ARCHIVE_NAME="budgetbot-macos-v1.0.tar.gz"

echo "📦 Creating BudgetBot macOS Distribution Package"
echo "=============================================="

# Clean previous builds
if [ -d "$PACKAGE_DIR" ]; then
    rm -rf "$PACKAGE_DIR"
fi

# Create package directory
mkdir -p "$PACKAGE_DIR/$PACKAGE_NAME"

# Build the application first
echo "Building application..."
npm run build

# Copy necessary files
echo "Copying application files..."
cp -r client "$PACKAGE_DIR/$PACKAGE_NAME/"
cp -r server "$PACKAGE_DIR/$PACKAGE_NAME/"
cp -r shared "$PACKAGE_DIR/$PACKAGE_NAME/"
cp -r dist "$PACKAGE_DIR/$PACKAGE_NAME/"

# Copy configuration and documentation
cp package.json "$PACKAGE_DIR/$PACKAGE_NAME/"
cp package-lock.json "$PACKAGE_DIR/$PACKAGE_NAME/" 2>/dev/null || true
cp drizzle.config.ts "$PACKAGE_DIR/$PACKAGE_NAME/"
cp postcss.config.js "$PACKAGE_DIR/$PACKAGE_NAME/"
cp tailwind.config.ts "$PACKAGE_DIR/$PACKAGE_NAME/"
cp vite.config.ts "$PACKAGE_DIR/$PACKAGE_NAME/"
cp tsconfig.json "$PACKAGE_DIR/$PACKAGE_NAME/" 2>/dev/null || true

# Copy macOS-specific files
cp README-macOS.md "$PACKAGE_DIR/$PACKAGE_NAME/"
cp setup-macos.sh "$PACKAGE_DIR/$PACKAGE_NAME/"
cp launch-budgetbot-macos.command "$PACKAGE_DIR/$PACKAGE_NAME/"
cp install-budgetbot-macos.sh "$PACKAGE_DIR/$PACKAGE_NAME/"

# Create a simplified package.json for distribution
cat > "$PACKAGE_DIR/$PACKAGE_NAME/package-simple.json" << 'EOL'
{
  "name": "budgetbot-macos",
  "version": "1.0.0",
  "type": "module",
  "license": "MIT",
  "description": "BudgetBot - Personal budgeting application for macOS",
  "scripts": {
    "start": "NODE_ENV=production node dist/index.js",
    "dev": "NODE_ENV=development tsx server/index.ts",
    "setup": "./setup-macos.sh",
    "launch": "./launch-budgetbot-macos.command"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOL

# Create installation instructions
cat > "$PACKAGE_DIR/$PACKAGE_NAME/INSTALL.md" << 'EOL'
# BudgetBot macOS Installation

## Quick Start

1. **Extract this package** to your desired location (e.g., Applications folder)
2. **Run the setup script**:
   ```bash
   ./setup-macos.sh
   ```
3. **Launch BudgetBot**:
   ```bash
   ./launch-budgetbot-macos.command
   ```

## What You Need

- macOS 10.15 or later
- Node.js 18 or later (download from https://nodejs.org/)

## Files Included

- `README-macOS.md` - Detailed documentation
- `setup-macos.sh` - Automated setup script
- `launch-budgetbot-macos.command` - Application launcher
- `install-budgetbot-macos.sh` - System-wide installer

## Getting Help

See `README-macOS.md` for troubleshooting and detailed instructions.
EOL

# Create a startup script that works without build dependencies
cat > "$PACKAGE_DIR/$PACKAGE_NAME/start-budgetbot.sh" << 'EOL'
#!/bin/bash

# Simple BudgetBot starter for macOS
cd "$(dirname "$0")"

# Check if built files exist
if [ ! -d "dist" ]; then
    echo "❌ Application not built. Please run ./setup-macos.sh first"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --production
fi

echo "🤖 Starting BudgetBot..."
echo "Open your browser to: http://localhost:5000"
echo "Press Ctrl+C to stop"
echo ""

NODE_ENV=production node dist/index.js
EOL

chmod +x "$PACKAGE_DIR/$PACKAGE_NAME/start-budgetbot.sh"

# Create archive
echo "Creating distribution archive..."
cd "$PACKAGE_DIR"
tar -czf "../$ARCHIVE_NAME" "$PACKAGE_NAME"
cd ..

# Cleanup
rm -rf "$PACKAGE_DIR"

echo ""
echo "✅ Distribution package created: $ARCHIVE_NAME"
echo ""
echo "📋 Package Contents:"
echo "   - Complete BudgetBot application"
echo "   - macOS setup scripts"
echo "   - Installation documentation"
echo "   - Launcher scripts"
echo ""
echo "📤 To distribute:"
echo "   1. Share the $ARCHIVE_NAME file"
echo "   2. Recipients extract and run ./setup-macos.sh"
echo "   3. Launch with ./launch-budgetbot-macos.command"