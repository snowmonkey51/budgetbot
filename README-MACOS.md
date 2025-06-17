# BudgetBot - Native macOS App

Your budgeting web application has been configured to run as a native macOS app using Electron.

## Setup Instructions

### 1. Update package.json
Add these fields to your `package.json`:

```json
{
  "main": "electron/main.js",
  "homepage": "./",
  "scripts": {
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:5000 && NODE_ENV=development electron .\"",
    "electron:build": "npm run build && electron-builder",
    "electron:pack": "npm run build && electron-builder --dir",
    "electron:dist": "npm run build && electron-builder --publish=never"
  }
}
```

### 2. Development Mode
To run the app in development mode:

```bash
npm run electron:dev
```

Or use the provided script:
```bash
./start-electron.sh
```

### 3. Build for Distribution
To create a distributable macOS app:

```bash
# Build app bundle (for testing)
npm run electron:pack

# Create DMG installer
npm run electron:build
```

## What's Included

- **Electron Configuration**: `electron/main.js` - Main process configuration
- **macOS Entitlements**: `electron/entitlements.mac.plist` - Security permissions
- **Build Configuration**: `electron-builder.json` - Distribution settings
- **App Icon**: `electron/assets/icon.png` - App icon (customize as needed)
- **Launch Script**: `start-electron.sh` - Development launcher

## Features

- Native macOS window with proper title bar
- Automatic external link handling
- Security hardening with context isolation
- Development tools integration
- Universal binary support (Intel + Apple Silicon)
- Code signing ready (add your developer certificate)

## Building for Distribution

The app will be built as:
- **DMG**: Installer disk image
- **ZIP**: Compressed app bundle
- **Universal Binary**: Runs on both Intel and Apple Silicon Macs

## Customization

- **App Icon**: Replace `electron/assets/icon.png` with your custom 512x512 icon
- **App Name**: Update `productName` in `electron-builder.json`
- **Bundle ID**: Update `appId` in `electron-builder.json`
- **Window Size**: Modify dimensions in `electron/main.js`

## Distribution Notes

For App Store distribution, you'll need:
1. Apple Developer Account
2. Code signing certificates
3. App Store provisioning profile
4. Compliance with App Store guidelines

The app is currently configured for direct distribution outside the App Store.