// Creates a local server bundle for the native app
const fs = require('fs');
const path = require('path');

// Create a minimal local server that includes the BudgetBot functionality
const serverCode = `
const express = require('express');
const path = require('path');
const app = express();

// In-memory storage for the native app
let balance = { id: 1, amount: "1700.00", period: "first-half" };
let categories = [
  { id: 1, name: "Food", icon: "🍽️", color: "bg-orange-100" },
  { id: 2, name: "Transport", icon: "🚗", color: "bg-blue-100" },
  { id: 3, name: "Shopping", icon: "🛒", color: "bg-green-100" },
  { id: 4, name: "Bills", icon: "💳", color: "bg-purple-100" },
  { id: 5, name: "Entertainment", icon: "🎬", color: "bg-red-100" },
  { id: 6, name: "Health", icon: "🏥", color: "bg-pink-100" },
  { id: 7, name: "Other", icon: "📋", color: "bg-gray-100" }
];
let expenses = [];
let templates = [];
let nextId = 1;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'client')));

// API Routes
app.get('/api/balance', (req, res) => res.json(balance));
app.put('/api/balance', (req, res) => {
  balance = { ...balance, ...req.body };
  res.json(balance);
});

app.get('/api/categories', (req, res) => res.json(categories));
app.post('/api/categories', (req, res) => {
  const category = { id: nextId++, ...req.body, createdAt: new Date() };
  categories.push(category);
  res.json(category);
});

app.get('/api/expenses', (req, res) => {
  const { period } = req.query;
  const filtered = period ? expenses.filter(e => e.period === period) : expenses;
  res.json(filtered);
});

app.post('/api/expenses', (req, res) => {
  const expense = { 
    id: nextId++, 
    ...req.body, 
    cleared: false,
    createdAt: new Date() 
  };
  expenses.push(expense);
  res.json(expense);
});

app.patch('/api/expenses/:id/toggle-cleared', (req, res) => {
  const expense = expenses.find(e => e.id === parseInt(req.params.id));
  if (expense) {
    expense.cleared = !expense.cleared;
    res.json(expense);
  } else {
    res.status(404).json({ error: 'Expense not found' });
  }
});

app.get('/api/templates', (req, res) => res.json(templates));
app.post('/api/templates', (req, res) => {
  const template = { id: nextId++, ...req.body, items: [] };
  templates.push(template);
  res.json(template);
});

// Serve the web app
app.get('*', (req, res) => {
  res.send(\`
    <!DOCTYPE html>
    <html>
    <head>
      <title>BudgetBot Native</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
      <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-50">
      <div id="root">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div class="text-center mb-8">
            <h1 class="text-4xl font-bold text-slate-700 mb-4">🤖 BudgetBot Native</h1>
            <p class="text-slate-600">Your personal budgeting assistant running locally on macOS</p>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="bg-white rounded-lg shadow p-6">
              <h2 class="text-xl font-semibold mb-4">💰 Current Balance</h2>
              <div class="text-3xl font-bold text-green-600">$1,700.00</div>
              <p class="text-sm text-slate-500 mt-2">First Half Period</p>
            </div>
            
            <div class="bg-white rounded-lg shadow p-6">
              <h2 class="text-xl font-semibold mb-4">📊 Quick Stats</h2>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span>Total Expenses</span>
                  <span class="font-medium">$0.00</span>
                </div>
                <div class="flex justify-between">
                  <span>Remaining</span>
                  <span class="font-medium text-green-600">$1,700.00</span>
                </div>
              </div>
            </div>
            
            <div class="bg-white rounded-lg shadow p-6">
              <h2 class="text-xl font-semibold mb-4">🎯 Categories</h2>
              <div class="grid grid-cols-2 gap-2">
                <div class="text-center p-2 bg-orange-50 rounded">🍽️ Food</div>
                <div class="text-center p-2 bg-blue-50 rounded">🚗 Transport</div>
                <div class="text-center p-2 bg-green-50 rounded">🛒 Shopping</div>
                <div class="text-center p-2 bg-purple-50 rounded">💳 Bills</div>
              </div>
            </div>
          </div>
          
          <div class="mt-8 text-center">
            <p class="text-slate-500">Native macOS application running at maximum speed</p>
            <p class="text-xs text-slate-400 mt-2">Use keyboard shortcuts: Cmd+1/2/3 for different budget periods</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  \`);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(\`BudgetBot server running on port \${PORT}\`);
});
`;

// Write the server file
fs.writeFileSync('local-server.js', serverCode);
console.log('✅ Created local server for native app');