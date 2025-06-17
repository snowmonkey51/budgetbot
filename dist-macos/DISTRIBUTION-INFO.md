# BudgetBot macOS Distribution Package

## Package Details
- **File**: BudgetBot-macOS-v1.0.tar.gz
- **Size**: ~137 KB compressed
- **Contents**: Complete BudgetBot application for macOS

## What's Included

### Core Application
- Complete React frontend with robot-themed UI
- Express.js backend with API endpoints
- In-memory storage (no database required)
- All necessary dependencies and configuration

### macOS-Specific Files
- `setup-macos.sh` - Automated dependency installation
- `launch-budgetbot-macos.command` - One-click launcher
- `install-budgetbot-macos.sh` - System-wide installer
- `start-simple.sh` - Simple startup script
- `.env.macos.example` - Configuration template

### Documentation
- `README-macOS.md` - Complete setup guide
- `QUICK-START.md` - Fast installation steps
- Configuration examples and troubleshooting

## User Instructions

1. **Download** the BudgetBot-macOS-v1.0.tar.gz file
2. **Extract** to Applications folder or desired location
3. **Open Terminal** and navigate to the extracted folder
4. **Run setup**: `./setup-macos.sh`
5. **Launch**: `./launch-budgetbot-macos.command`

## Features
- Budget tracking across three periods (First Half, Second Half, Planning)
- Expense categorization with visual indicators
- Template system for recurring expenses
- Spending charts and breakdowns
- Calculator integration
- Robot mascot theme with engaging UI

## Technical Requirements
- macOS 10.15 or later
- Node.js 18+ (auto-detected by setup script)
- 50MB disk space
- Web browser (Safari, Chrome, Firefox)

## Storage Options
- **Default**: In-memory (data resets on restart)
- **Optional**: PostgreSQL for persistent storage

## Support
All documentation and troubleshooting information included in the package.