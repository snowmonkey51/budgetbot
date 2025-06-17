#!/bin/bash

# BudgetBot Simple macOS Installer
echo "🤖 Installing BudgetBot for macOS..."

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This installer is for macOS only"
    exit 1
fi

# Add Node.js paths and check
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not found"
    echo "Please install Node.js from: https://nodejs.org/"
    open "https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required (found v$NODE_VERSION)"
    exit 1
fi

echo "✅ Node.js $(node -v) found"

# Remove old installations
echo "📦 Preparing installation..."
rm -rf "/Applications/BudgetBot-macOS-Final"
rm -rf "/Applications/BudgetBot.app"

# Create backend files directly
echo "📁 Creating BudgetBot backend..."
mkdir -p "/Applications/BudgetBot-macOS-Final"

# Copy the fixed backend files from this distribution
cp -r "dist-macos/BudgetBot-macOS-Final/"* "/Applications/BudgetBot-macOS-Final/"

# Install dependencies
echo "📥 Installing dependencies..."
cd "/Applications/BudgetBot-macOS-Final"
npm install --silent

# Create the app bundle
echo "🖥️ Creating BudgetBot.app..."
mkdir -p "/Applications/BudgetBot.app/Contents/MacOS"
mkdir -p "/Applications/BudgetBot.app/Contents/Resources"

# Create Info.plist
cat > "/Applications/BudgetBot.app/Contents/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>BudgetBot</string>
    <key>CFBundleIdentifier</key>
    <string>com.budgetbot.app</string>
    <key>CFBundleName</key>
    <string>BudgetBot</string>
    <key>CFBundleDisplayName</key>
    <string>BudgetBot</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
</dict>
</plist>
EOF

# Create executable
cat > "/Applications/BudgetBot.app/Contents/MacOS/BudgetBot" << 'EOF'
#!/bin/bash
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
cd "/Applications/BudgetBot-macOS-Final"
npm run dev &
NODE_PID=$!
sleep 3
open "http://localhost:5000"
osascript -e 'display dialog "BudgetBot is running at http://localhost:5000\n\nClose this dialog to stop BudgetBot." with title "BudgetBot" buttons {"Stop"} default button "Stop"'
kill $NODE_PID
EOF

chmod +x "/Applications/BudgetBot.app/Contents/MacOS/BudgetBot"

echo ""
echo "🎉 BudgetBot installed successfully!"
echo ""
echo "Launch BudgetBot by:"
echo "1. Double-clicking BudgetBot.app in Applications"
echo "2. Using Spotlight: Cmd+Space, type 'BudgetBot'"
echo ""

# Offer desktop shortcut
read -p "Create desktop shortcut? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ln -sf "/Applications/BudgetBot.app" "$HOME/Desktop/BudgetBot.app"
    echo "✅ Desktop shortcut created"
fi

echo "Installation complete! 🤖"