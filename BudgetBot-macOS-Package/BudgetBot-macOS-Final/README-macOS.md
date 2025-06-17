# BudgetBot - Local macOS Setup

BudgetBot is a playful personal budgeting application that helps you track expenses across different budget periods with an engaging robot-themed interface.

## Prerequisites

- **macOS 10.15 or later**
- **Node.js 18 or later** - [Download from nodejs.org](https://nodejs.org/)
- **PostgreSQL** (optional) - [Download from postgresql.org](https://www.postgresql.org/download/macosx/) or use Homebrew

## Quick Start

### 1. Clone or Download the Project

```bash
# If you have git installed
git clone <your-repo-url> budgetbot-macos
cd budgetbot-macos

# Or download and extract the ZIP file to a folder named 'budgetbot-macos'
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```bash
# For in-memory storage (no database required)
NODE_ENV=development
PORT=5000

# Optional: For PostgreSQL database
# DATABASE_URL=postgresql://username:password@localhost:5432/budgetbot
```

### 4. Start the Application

```bash
npm run dev
```

The application will be available at: **http://localhost:5000**

## Features

### Budget Management
- **First Half Budget** - Track expenses for the first half of your budget period
- **Second Half Budget** - Manage expenses for the second half
- **Planning Mode** - Plan future expenses and budgets

### Expense Tracking
- Add expenses with categories, amounts, and descriptions
- Mark expenses as cleared/uncleared
- Visual spending breakdowns and charts
- Category-based expense organization

### Templates
- Create expense templates for recurring budgets
- Load templates into different budget periods
- Quick template access for common expense patterns

### Categories
- Pre-defined categories: Food, Transport, Shopping, Bills, Entertainment, Health, Other
- Custom category management with icons and colors
- Visual category indicators throughout the app

## Storage Options

### In-Memory Storage (Default)
- No database setup required
- Data persists during the session
- Perfect for testing and quick setup
- Automatically includes sample data

### PostgreSQL Database (Optional)
1. Install PostgreSQL on macOS:
   ```bash
   # Using Homebrew
   brew install postgresql
   brew services start postgresql
   
   # Or download from postgresql.org
   ```

2. Create a database:
   ```bash
   createdb budgetbot
   ```

3. Update `.env` file:
   ```bash
   DATABASE_URL=postgresql://your_username:your_password@localhost:5432/budgetbot
   ```

4. Push the database schema:
   ```bash
   npm run db:push
   ```

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database operations (PostgreSQL only)
npm run db:push        # Push schema changes to database
npm run db:studio      # Open Drizzle Studio for database management
```

## Project Structure

```
budgetbot-macos/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/         # Application pages
│   │   ├── lib/           # Utilities and helpers
│   │   └── hooks/         # Custom React hooks
├── server/                # Express backend
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Data storage layer
│   └── index.ts           # Server entry point
├── shared/                # Shared types and schemas
│   └── schema.ts          # Database schema and types
└── README-macOS.md        # This file
```

## API Endpoints

- `GET /api/balance` - Get current balance
- `PUT /api/balance` - Update balance
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create new category
- `GET /api/expenses` - Get expenses (with optional period filter)
- `POST /api/expenses` - Create new expense
- `GET /api/templates` - Get templates (with optional period filter)
- `POST /api/templates` - Create new template

## Troubleshooting

### Port Already in Use
If port 5000 is busy, update the PORT in `.env` file:
```bash
PORT=3000
```

### Node.js Version Issues
Ensure you're using Node.js 18 or later:
```bash
node --version
```

### PostgreSQL Connection Issues
1. Verify PostgreSQL is running:
   ```bash
   brew services list | grep postgresql
   ```
2. Check your DATABASE_URL format
3. Ensure the database exists and credentials are correct

### Permission Issues
If you encounter permission errors:
```bash
sudo chown -R $(whoami) ~/.npm
```

## Building for Distribution

To create a distributable version:

```bash
# Build the application
npm run build

# The built files will be in the 'dist' directory
# You can then share this folder with others
```

## Data Backup

### In-Memory Storage
Data is reset when the application restarts. For persistent data, switch to PostgreSQL.

### PostgreSQL Storage
Use standard PostgreSQL backup tools:
```bash
pg_dump budgetbot > backup.sql
```

## Support

For issues specific to the macOS setup:
1. Check the troubleshooting section above
2. Ensure all prerequisites are installed
3. Verify your Node.js and npm versions
4. Check the terminal output for specific error messages

---

**Note**: This application is designed for personal use and includes a fun robot mascot theme to make budgeting more engaging!