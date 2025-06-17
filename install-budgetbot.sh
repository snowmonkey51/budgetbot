#!/bin/bash

echo "🤖 BudgetBot macOS Installer"
echo "============================"

# Check macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ macOS required"
    exit 1
fi

# Check Node.js with proper PATH
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:$PATH"
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from nodejs.org"
    open "https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Clean previous installations
rm -rf "/Applications/BudgetBot-macOS-Final" "/Applications/BudgetBot.app"

# Create app directory
mkdir -p "/Applications/BudgetBot-macOS-Final"
cd "/Applications/BudgetBot-macOS-Final"

# Create package.json
cat > package.json << 'EOF'
{
  "name": "budgetbot",
  "type": "module",
  "scripts": {
    "dev": "tsx server/index.ts"
  }
}
EOF

# Install core dependencies
echo "📦 Installing dependencies..."
npm install --silent tsx express cors @neondatabase/serverless drizzle-orm zod date-fns

# Create server structure
mkdir -p server client/src client/dist shared

# Create schema
cat > shared/schema.ts << 'EOF'
export interface Balance {
  id: number;
  period: string;
  income: number;
  totalBudget: number;
}

export interface Category {
  id: number;
  name: string;
  color: string;
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  period: string;
  cleared: boolean;
  date: string;
}

export interface Template {
  id: number;
  name: string;
  period: string;
}

export interface TemplateItem {
  id: number;
  templateId: number;
  description: string;
  amount: number;
  category: string;
}

export type InsertBalance = Omit<Balance, 'id'>;
export type InsertCategory = Omit<Category, 'id'>;
export type InsertExpense = Omit<Expense, 'id'>;
export type InsertTemplate = Omit<Template, 'id'>;
export type InsertTemplateItem = Omit<TemplateItem, 'id'>;
EOF

# Create storage with working memory implementation
cat > server/storage.ts << 'EOF'
import type { Balance, Category, Expense, Template, TemplateItem, InsertBalance, InsertCategory, InsertExpense, InsertTemplate, InsertTemplateItem } from '../shared/schema.js';

export interface IStorage {
  getCurrentBalance(period?: string): Promise<Balance | null>;
  updateBalance(balance: InsertBalance): Promise<Balance>;
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  getExpenses(period?: string): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<boolean>;
  toggleExpenseCleared(id: number): Promise<Expense | undefined>;
  getTemplates(period?: string): Promise<(Template & { items: TemplateItem[] })[]>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  deleteTemplate(id: number): Promise<boolean>;
  addTemplateItem(templateId: number, item: InsertTemplateItem): Promise<TemplateItem>;
  loadTemplate(templateId: number, targetPeriod?: string): Promise<Expense[]>;
}

class MemStorage implements IStorage {
  private balances = new Map<string, Balance>();
  private categories = new Map<number, Category>();
  private expenses = new Map<number, Expense>();
  private templates = new Map<number, Template>();
  private templateItems = new Map<number, TemplateItem>();
  private nextId = { balance: 1, category: 1, expense: 1, template: 1, templateItem: 1 };

  constructor() {
    // Initialize with default data
    const balance: Balance = {
      id: this.nextId.balance++,
      period: "first-half",
      income: 5000,
      totalBudget: 4500
    };
    this.balances.set("first-half", balance);

    const categories = [
      { id: this.nextId.category++, name: "Food", color: "#ef4444" },
      { id: this.nextId.category++, name: "Transportation", color: "#3b82f6" },
      { id: this.nextId.category++, name: "Entertainment", color: "#8b5cf6" },
      { id: this.nextId.category++, name: "Shopping", color: "#f59e0b" },
      { id: this.nextId.category++, name: "Bills", color: "#10b981" }
    ];
    categories.forEach(cat => this.categories.set(cat.id, cat));
  }

  async getCurrentBalance(period = "first-half"): Promise<Balance | null> {
    return this.balances.get(period) || null;
  }

  async updateBalance(insertBalance: InsertBalance): Promise<Balance> {
    const existing = this.balances.get(insertBalance.period);
    const balance: Balance = {
      id: existing?.id || this.nextId.balance++,
      ...insertBalance
    };
    this.balances.set(insertBalance.period, balance);
    return balance;
  }

  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const category: Category = {
      id: this.nextId.category++,
      ...insertCategory
    };
    this.categories.set(category.id, category);
    return category;
  }

  async updateCategory(id: number, updates: Partial<InsertCategory>): Promise<Category | undefined> {
    const existing = this.categories.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.categories.set(id, updated);
    return updated;
  }

  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }

  async getExpenses(period?: string): Promise<Expense[]> {
    const expenses = Array.from(this.expenses.values());
    return period ? expenses.filter(e => e.period === period) : expenses;
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const expense: Expense = {
      id: this.nextId.expense++,
      ...insertExpense
    };
    this.expenses.set(expense.id, expense);
    return expense;
  }

  async updateExpense(id: number, updates: Partial<InsertExpense>): Promise<Expense | undefined> {
    const existing = this.expenses.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.expenses.set(id, updated);
    return updated;
  }

  async deleteExpense(id: number): Promise<boolean> {
    return this.expenses.delete(id);
  }

  async toggleExpenseCleared(id: number): Promise<Expense | undefined> {
    const expense = this.expenses.get(id);
    if (!expense) return undefined;
    const updated = { ...expense, cleared: !expense.cleared };
    this.expenses.set(id, updated);
    return updated;
  }

  async getTemplates(): Promise<(Template & { items: TemplateItem[] })[]> {
    const templates = Array.from(this.templates.values());
    return templates.map(template => ({
      ...template,
      items: Array.from(this.templateItems.values()).filter(item => item.templateId === template.id)
    }));
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const template: Template = {
      id: this.nextId.template++,
      ...insertTemplate
    };
    this.templates.set(template.id, template);
    return template;
  }

  async deleteTemplate(id: number): Promise<boolean> {
    // Delete template items first
    Array.from(this.templateItems.entries())
      .filter(([_, item]) => item.templateId === id)
      .forEach(([itemId]) => this.templateItems.delete(itemId));
    return this.templates.delete(id);
  }

  async addTemplateItem(templateId: number, item: InsertTemplateItem): Promise<TemplateItem> {
    const templateItem: TemplateItem = {
      id: this.nextId.templateItem++,
      templateId,
      ...item
    };
    this.templateItems.set(templateItem.id, templateItem);
    return templateItem;
  }

  async loadTemplate(templateId: number, targetPeriod = "first-half"): Promise<Expense[]> {
    const items = Array.from(this.templateItems.values()).filter(item => item.templateId === templateId);
    const expenses: Expense[] = [];
    
    for (const item of items) {
      const expense: Expense = {
        id: this.nextId.expense++,
        description: item.description,
        amount: item.amount,
        category: item.category,
        period: targetPeriod,
        cleared: false,
        date: new Date().toISOString().split('T')[0]
      };
      this.expenses.set(expense.id, expense);
      expenses.push(expense);
    }
    
    return expenses;
  }
}

export const storage = new MemStorage();
EOF

# Create server routes
cat > server/routes.ts << 'EOF'
import express from 'express';
import { storage } from './storage.js';

const router = express.Router();

// Balance routes
router.get('/api/balance', async (req, res) => {
  try {
    const balance = await storage.getCurrentBalance(req.query.period as string);
    res.json(balance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get balance' });
  }
});

router.post('/api/balance', async (req, res) => {
  try {
    const balance = await storage.updateBalance(req.body);
    res.json(balance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update balance' });
  }
});

// Category routes
router.get('/api/categories', async (req, res) => {
  try {
    const categories = await storage.getCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

router.post('/api/categories', async (req, res) => {
  try {
    const category = await storage.createCategory(req.body);
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Expense routes
router.get('/api/expenses', async (req, res) => {
  try {
    const expenses = await storage.getExpenses(req.query.period as string);
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get expenses' });
  }
});

router.post('/api/expenses', async (req, res) => {
  try {
    const expense = await storage.createExpense(req.body);
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

router.delete('/api/expenses/:id', async (req, res) => {
  try {
    const deleted = await storage.deleteExpense(parseInt(req.params.id));
    res.json({ success: deleted });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

router.patch('/api/expenses/:id/toggle', async (req, res) => {
  try {
    const expense = await storage.toggleExpenseCleared(parseInt(req.params.id));
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle expense' });
  }
});

export default router;
EOF

# Create main server
cat > server/index.ts << 'EOF'
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(routes);
app.use(express.static(path.join(__dirname, '../client/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`🤖 BudgetBot running at http://localhost:${PORT}`);
});
EOF

# Create basic HTML client
mkdir -p client/dist
cat > client/dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BudgetBot - Personal Finance Tracker</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #1a1a2e; color: white; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 40px; }
    .robot { font-size: 3rem; margin-bottom: 10px; }
    .title { font-size: 2.5rem; font-weight: bold; background: linear-gradient(45deg, #00d4ff, #00ff88); background-clip: text; -webkit-background-clip: text; color: transparent; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 40px; }
    .card { background: #16213e; border-radius: 12px; padding: 20px; border: 1px solid #0f3460; }
    .card h3 { color: #00d4ff; margin-bottom: 15px; }
    .balance { font-size: 2rem; font-weight: bold; color: #00ff88; }
    .expense-list { max-height: 300px; overflow-y: auto; }
    .expense-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #0f3460; }
    .form { display: flex; flex-direction: column; gap: 10px; }
    .input { padding: 10px; border-radius: 6px; border: 1px solid #0f3460; background: #0e1929; color: white; }
    .button { padding: 10px 20px; border-radius: 6px; border: none; background: #00d4ff; color: #1a1a2e; font-weight: bold; cursor: pointer; }
    .button:hover { background: #00b8e6; }
    .category { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; margin-left: 10px; }
  </style>
</head>
<body>
  <div id="root"></div>
  
  <script type="text/babel">
    const { useState, useEffect } = React;
    
    function BudgetBot() {
      const [balance, setBalance] = useState(null);
      const [expenses, setExpenses] = useState([]);
      const [categories, setCategories] = useState([]);
      const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: 'Food' });
      
      useEffect(() => {
        fetchData();
      }, []);
      
      const fetchData = async () => {
        try {
          const [balanceRes, expensesRes, categoriesRes] = await Promise.all([
            fetch('/api/balance?period=first-half'),
            fetch('/api/expenses?period=first-half'),
            fetch('/api/categories')
          ]);
          
          setBalance(await balanceRes.json());
          setExpenses(await expensesRes.json());
          setCategories(await categoriesRes.json());
        } catch (error) {
          console.error('Failed to fetch data:', error);
        }
      };
      
      const addExpense = async (e) => {
        e.preventDefault();
        if (!newExpense.description || !newExpense.amount) return;
        
        try {
          await fetch('/api/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...newExpense,
              amount: parseFloat(newExpense.amount),
              period: 'first-half',
              cleared: false,
              date: new Date().toISOString().split('T')[0]
            })
          });
          
          setNewExpense({ description: '', amount: '', category: 'Food' });
          fetchData();
        } catch (error) {
          console.error('Failed to add expense:', error);
        }
      };
      
      const deleteExpense = async (id) => {
        try {
          await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
          fetchData();
        } catch (error) {
          console.error('Failed to delete expense:', error);
        }
      };
      
      const getCategoryColor = (categoryName) => {
        const category = categories.find(c => c.name === categoryName);
        return category?.color || '#666';
      };
      
      const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const remaining = balance ? balance.totalBudget - totalSpent : 0;
      
      return (
        <div className="container">
          <div className="header">
            <div className="robot">🤖</div>
            <h1 className="title">BudgetBot</h1>
            <p>Your Personal Finance Assistant</p>
          </div>
          
          <div className="grid">
            <div className="card">
              <h3>💰 Budget Overview</h3>
              {balance && (
                <>
                  <div>Income: <span className="balance">${balance.income}</span></div>
                  <div>Budget: <span className="balance">${balance.totalBudget}</span></div>
                  <div>Spent: <span style={{color: '#ff6b6b'}}>${totalSpent}</span></div>
                  <div>Remaining: <span className={remaining >= 0 ? 'balance' : ''}>${remaining}</span></div>
                </>
              )}
            </div>
            
            <div className="card">
              <h3>➕ Add Expense</h3>
              <form className="form" onSubmit={addExpense}>
                <input
                  className="input"
                  type="text"
                  placeholder="Description"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                />
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                />
                <select
                  className="input"
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
                <button className="button" type="submit">Add Expense</button>
              </form>
            </div>
            
            <div className="card">
              <h3>📝 Recent Expenses</h3>
              <div className="expense-list">
                {expenses.map(expense => (
                  <div key={expense.id} className="expense-item">
                    <div>
                      <strong>{expense.description}</strong>
                      <span 
                        className="category"
                        style={{ backgroundColor: getCategoryColor(expense.category) }}
                      >
                        {expense.category}
                      </span>
                    </div>
                    <div>
                      <span>${expense.amount}</span>
                      <button 
                        onClick={() => deleteExpense(expense.id)}
                        style={{ marginLeft: '10px', background: '#ff6b6b', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    ReactDOM.render(<BudgetBot />, document.getElementById('root'));
  </script>
</body>
</html>
EOF

echo "✅ BudgetBot files created"

# Create app bundle
mkdir -p "/Applications/BudgetBot.app/Contents/MacOS"
mkdir -p "/Applications/BudgetBot.app/Contents/Resources"

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

cat > "/Applications/BudgetBot.app/Contents/MacOS/BudgetBot" << 'EOF'
#!/bin/bash
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
cd "/Applications/BudgetBot-macOS-Final"

# Start server in background
npm run dev &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Open browser
open "http://localhost:5000"

# Show running dialog
osascript -e 'display dialog "🤖 BudgetBot is running!\n\nAccess at: http://localhost:5000\n\nClick OK to stop BudgetBot." with title "BudgetBot" buttons {"Stop BudgetBot"} default button "Stop BudgetBot"'

# Kill server when dialog closes
kill $SERVER_PID 2>/dev/null
exit 0
EOF

chmod +x "/Applications/BudgetBot.app/Contents/MacOS/BudgetBot"

echo ""
echo "🎉 BudgetBot installed successfully!"
echo ""
echo "Launch options:"
echo "1. Double-click BudgetBot.app in Applications"
echo "2. Spotlight: Cmd+Space → 'BudgetBot'"
echo ""

read -p "Create desktop shortcut? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ln -sf "/Applications/BudgetBot.app" "$HOME/Desktop/BudgetBot.app"
    echo "✅ Desktop shortcut created"
fi

echo ""
echo "🤖 Installation complete!"
echo "BudgetBot will open your browser automatically when launched."
EOF

chmod +x install-budgetbot.sh