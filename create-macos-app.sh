#!/bin/bash

# Create BudgetBot.app - Native macOS Application Bundle

APP_NAME="BudgetBot"
APP_DIR="$APP_NAME.app"
CONTENTS_DIR="$APP_DIR/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"
RESOURCES_DIR="$CONTENTS_DIR/Resources"

echo "Creating BudgetBot.app bundle..."

# Create app bundle structure
mkdir -p "$MACOS_DIR"
mkdir -p "$RESOURCES_DIR"

# Create Info.plist
cat > "$CONTENTS_DIR/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>BudgetBot</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>CFBundleIdentifier</key>
    <string>com.budgetbot.app</string>
    <key>CFBundleName</key>
    <string>BudgetBot</string>
    <key>CFBundleDisplayName</key>
    <string>BudgetBot</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>LSUIElement</key>
    <false/>
</dict>
</plist>
EOF

# Create the executable script
cat > "$MACOS_DIR/BudgetBot" << 'EOF'
#!/bin/bash

# BudgetBot Native macOS App Launcher
cd "/Applications/BudgetBot-macOS-Final"

# Check if BudgetBot is installed
if [ ! -d "/Applications/BudgetBot-macOS-Final" ]; then
    osascript -e 'display dialog "BudgetBot not found in /Applications/BudgetBot-macOS-Final\n\nPlease install BudgetBot first." with title "BudgetBot" buttons {"OK"} default button "OK"'
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    osascript -e 'display dialog "Node.js is required but not found.\n\nPlease install Node.js 18+ from nodejs.org" with title "BudgetBot" buttons {"OK"} default button "OK"'
    open "https://nodejs.org/"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    # Show installation dialog
    osascript -e 'display dialog "Installing BudgetBot dependencies...\n\nThis may take a few minutes." with title "BudgetBot Setup" buttons {"OK"} default button "OK"'
    
    # Install dependencies
    npm install
fi

# Start BudgetBot in background
npm run dev &
NODE_PID=$!

# Wait a moment for server to start
sleep 3

# Open browser
open "http://localhost:5000"

# Show success dialog
osascript -e 'display dialog "BudgetBot is now running!\n\nAccess it at: http://localhost:5000\n\nTo stop BudgetBot, close this dialog and quit the Terminal app." with title "BudgetBot Running" buttons {"OK"} default button "OK"'

# Keep the process running
wait $NODE_PID
EOF

# Make executable
chmod +x "$MACOS_DIR/BudgetBot"

# Create a simple icon (using SF Symbols approach)
cat > "$RESOURCES_DIR/AppIcon.icns" << 'EOF'
# This would be a proper .icns file in a real implementation
# For now, macOS will use a default icon
EOF

echo "✅ BudgetBot.app created successfully!"
echo ""
echo "To install:"
echo "1. Copy BudgetBot.app to your Applications folder"
echo "2. Double-click BudgetBot.app to launch"
echo ""
echo "The app will:"
echo "- Check for Node.js installation"
echo "- Install dependencies if needed"
echo "- Start the server automatically"
echo "- Open your browser to BudgetBot"