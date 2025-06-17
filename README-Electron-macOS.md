# BudgetBot - Native macOS Application

BudgetBot is now available as a native macOS application built with Electron, packaging the React web interface into a standalone desktop app.

## Features

### Native macOS Integration
- **Menu Bar Integration** - Full macOS menu bar with keyboard shortcuts
- **Dock Icon** - Custom BudgetBot robot icon
- **Window Management** - Standard macOS window controls and behaviors
- **Keyboard Shortcuts** - Native macOS shortcuts (Cmd+Q, Cmd+W, etc.)
- **System Notifications** - Native macOS notification support

### Budget Management
- **First Half Budget** (Cmd+1) - Track expenses for the first half of your period
- **Second Half Budget** (Cmd+2) - Manage the second half expenses
- **Planning Mode** (Cmd+3) - Plan future budgets and expenses

### Application Features
- **Offline Operation** - Works completely offline with local data storage
- **Auto-Start Server** - Built-in Express server starts automatically
- **Persistent Data** - In-memory storage that persists during app session
- **Security** - Sandboxed environment with proper security controls

## Installation Options

### Option 1: Download Pre-built App (Recommended)
1. Download the latest `.dmg` file from releases
2. Double-click to mount the disk image
3. Drag BudgetBot to Applications folder
4. Right-click BudgetBot in Applications and select "Open"
5. Click "Open" when macOS asks about opening an unsigned app

### Option 2: Build from Source
```bash
# Clone the repository
git clone <repository-url>
cd budgetbot

# Install dependencies
npm install

# Build the native macOS app
./build-electron.sh
```

## Development

### Running in Development Mode
```bash
# Start Electron in development mode
./electron-dev.sh

# Or manually:
npm run dev &
npx electron electron/main.js
```

### Building for Distribution
```bash
# Build production app
./build-electron.sh

# The app will be created in dist-electron/
```

## System Requirements

- **macOS**: 10.14 (Mojave) or later
- **Architecture**: Intel x64 or Apple Silicon (arm64)
- **Memory**: 4GB RAM minimum
- **Storage**: 500MB available space

## Keyboard Shortcuts

### Application
- `Cmd+Q` - Quit BudgetBot
- `Cmd+H` - Hide BudgetBot
- `Cmd+M` - Minimize window
- `Cmd+W` - Close window

### Navigation
- `Cmd+1` - Switch to First Half budget
- `Cmd+2` - Switch to Second Half budget
- `Cmd+3` - Switch to Planning mode
- `Cmd+,` - Open Preferences/Settings

### View
- `Cmd+R` - Reload current view
- `Cmd+Shift+R` - Force reload
- `Cmd+0` - Reset zoom
- `Cmd++` - Zoom in
- `Cmd+-` - Zoom out
- `Ctrl+Cmd+F` - Toggle fullscreen

### Edit
- `Cmd+Z` - Undo
- `Cmd+Shift+Z` - Redo
- `Cmd+X` - Cut
- `Cmd+C` - Copy
- `Cmd+V` - Paste
- `Cmd+A` - Select All

## Data Storage

### Default: In-Memory Storage
- Data persists during app session
- Resets when app is restarted
- No external database required
- Includes sample data for testing

### Optional: PostgreSQL Database
1. Install PostgreSQL on your Mac
2. Create a database for BudgetBot
3. Set DATABASE_URL environment variable
4. Restart the application

## File Locations

### macOS App Bundle
```
BudgetBot.app/
├── Contents/
│   ├── Info.plist
│   ├── MacOS/BudgetBot
│   ├── Resources/
│   │   ├── app.asar
│   │   └── budgetbot-icon.icns
│   └── Frameworks/
```

### User Data
- Application data stored in memory during session
- No persistent files created by default
- Optional PostgreSQL database for persistence

## Troubleshooting

### App Won't Open
- Right-click the app and select "Open"
- Check System Preferences > Security & Privacy
- Ensure you have permission to run apps from identified developers

### Port Conflicts
The app uses port 5000 internally. If you have conflicts:
1. Quit other applications using port 5000
2. Restart BudgetBot

### Performance Issues
- Close other resource-intensive applications
- Ensure you have sufficient RAM available
- Check Activity Monitor for high CPU usage

### Database Connection Issues
If using PostgreSQL:
1. Verify PostgreSQL is running
2. Check DATABASE_URL environment variable
3. Ensure database exists and is accessible

## Architecture

### Electron Structure
```
Main Process (Node.js)
├── Express Server (Backend)
│   ├── API Routes
│   ├── Data Storage
│   └── Business Logic
└── Browser Window (Frontend)
    ├── React Application
    ├── UI Components
    └── Chart Visualizations
```

### Security Features
- Context isolation enabled
- Node integration disabled in renderer
- Remote module disabled
- Sandboxed execution environment
- CSP headers for web content

## Building Custom Versions

### Custom Icons
Replace `assets/budgetbot-icon.svg` with your custom icon and rebuild:
```bash
./build-electron.sh
```

### Custom Branding
1. Update app name in `electron/electron-builder.json`
2. Modify menu labels in `electron/main.js`
3. Update package.json metadata
4. Rebuild the application

## Distribution

### Creating a DMG
The build script automatically creates a DMG file with:
- Custom background image
- Drag-to-Applications layout
- Proper icon positioning

### Code Signing (For Distribution)
To distribute outside of personal use:
1. Obtain Apple Developer certificate
2. Configure code signing in electron-builder.json
3. Enable notarization for Gatekeeper approval

## Support

### Common Issues
- **Blank window**: Server failed to start - check console output
- **Slow performance**: Insufficient system resources
- **Data loss**: Using in-memory storage - switch to PostgreSQL for persistence

### Getting Help
1. Check the troubleshooting section above
2. Review console output for error messages
3. Ensure system requirements are met
4. Verify all dependencies are installed

---

**BudgetBot Native macOS App** - Making personal budgeting engaging with a native desktop experience.