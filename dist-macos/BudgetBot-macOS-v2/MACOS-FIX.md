# macOS Compatibility Fix

## Quick Setup Instructions

1. **Extract** this folder to `/Applications/BudgetBot-macOS-v2`

2. **Open Terminal** and run:
   ```bash
   cd /Applications/BudgetBot-macOS-v2
   npm install
   npm run dev
   ```

3. **Access** the app at http://localhost:5000

## What's Fixed in v2

- **Host binding**: Changed from `0.0.0.0` to `localhost` for macOS compatibility
- **Storage**: Pre-configured for in-memory storage (no database required)
- **Environment**: Includes proper .env configuration

## Features

- Budget tracking across three periods
- Expense categorization with visual charts
- Template system for recurring expenses
- Robot-themed interface
- Local data storage during session

## Troubleshooting

**Port 5000 busy**: Change PORT=3000 in .env file
**Permission errors**: Run `chmod +x *.sh *.command`
**Node.js issues**: Requires Node.js 18+

All data is stored in memory and resets when you restart the application.