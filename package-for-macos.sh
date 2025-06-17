#!/bin/bash
# Package BudgetBot for macOS distribution

echo "Creating BudgetBot macOS native app package..."

# Create package directory
mkdir -p BudgetBot-macOS-Package
cd BudgetBot-macOS-Package

# Copy essential files
cp ../electron/main.cjs main.cjs
cp ../electron/preload.cjs preload.cjs

# Create a standalone package.json for the app
cat > package.json << 'EOF'
{
  "name": "budgetbot-macos",
  "version": "1.0.0",
  "description": "BudgetBot - Personal budgeting application for macOS",
  "main": "main.cjs",
  "author": "BudgetBot Team",
  "license": "MIT",
  "dependencies": {
    "electron": "^36.4.0"
  }
}
EOF

# Create installation script
cat > install.sh << 'EOF'
#!/bin/bash
echo "Installing BudgetBot for macOS..."

# Install dependencies
npm install

echo "✅ Installation complete!"
echo ""
echo "To run BudgetBot:"
echo "  npm start"
echo ""
echo "To create a proper macOS app bundle:"
echo "  npm run build"
EOF

# Create run script
cat > run.sh << 'EOF'
#!/bin/bash
npx electron main.cjs
EOF

# Add package.json scripts
cat > package.json << 'EOF'
{
  "name": "budgetbot-macos",
  "version": "1.0.0",
  "description": "BudgetBot - Personal budgeting application for macOS",
  "main": "main.cjs",
  "author": "BudgetBot Team",
  "license": "MIT",
  "scripts": {
    "start": "electron main.cjs",
    "build": "electron-builder",
    "install-deps": "npm install"
  },
  "dependencies": {
    "electron": "^36.4.0"
  },
  "devDependencies": {
    "electron-builder": "^26.0.12"
  },
  "build": {
    "appId": "com.budgetbot.app",
    "productName": "BudgetBot",
    "directories": {
      "output": "dist"
    },
    "mac": {
      "category": "public.app-category.finance",
      "target": [
        {
          "target": "dmg",
          "arch": ["x64", "arm64"]
        }
      ]
    }
  }
}
EOF

# Create README
cat > README.md << 'EOF'
# BudgetBot for macOS

A native macOS desktop application for personal budgeting and expense tracking.

## Installation

1. Install Node.js from https://nodejs.org (if not already installed)
2. Open Terminal and navigate to this folder
3. Run: `npm install`

## Running the App

```bash
npm start
```

## Building a Native App

To create a proper macOS .app bundle and DMG installer:

```bash
npm run build
```

This will create:
- `dist/BudgetBot.app` - The application bundle
- `dist/BudgetBot-1.0.0.dmg` - DMG installer

## Features

- Native macOS window and menu integration
- Keyboard shortcuts (Cmd+1/2/3 for budget periods)
- Full BudgetBot functionality in a desktop app
- Fast performance with local caching

## Requirements

- macOS 10.15 or later
- Node.js 18 or later
EOF

# Make scripts executable
chmod +x install.sh run.sh

cd ..

# Create tar archive
tar -czf BudgetBot-macOS-Complete.tar.gz BudgetBot-macOS-Package/

echo "✅ Package created: BudgetBot-macOS-Complete.tar.gz"
echo ""
echo "📦 Contents:"
echo "  • Native Electron app files"
echo "  • Installation scripts"
echo "  • Build configuration"
echo "  • Complete documentation"
echo ""
echo "🚀 To use:"
echo "  1. Extract the tar.gz file"
echo "  2. cd BudgetBot-macOS-Package"
echo "  3. Run: npm install"
echo "  4. Run: npm start"