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
