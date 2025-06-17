import type { Balance, InsertBalance, Category, InsertCategory, Expense, InsertExpense, Template, InsertTemplate, TemplateItem, InsertTemplateItem } from "@shared/schema";

export interface IStorage {
  // Balance operations
  getCurrentBalance(period?: string): Promise<Balance | null>;
  updateBalance(balance: InsertBalance): Promise<Balance>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Expense operations
  getExpenses(period?: string): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<boolean>;
  toggleExpenseCleared(id: number): Promise<Expense | undefined>;
  
  // Template operations
  getTemplates(period?: string): Promise<(Template & { items: TemplateItem[] })[]>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  updateTemplate(id: number, template: Partial<InsertTemplate>): Promise<Template | undefined>;
  deleteTemplate(id: number): Promise<boolean>;
  addTemplateItem(templateId: number, item: InsertTemplateItem): Promise<TemplateItem>;
  updateTemplateItem(id: number, item: Partial<InsertTemplateItem>): Promise<TemplateItem | undefined>;
  deleteTemplateItem(id: number): Promise<boolean>;
  loadTemplate(templateId: number, targetPeriod?: string): Promise<Expense[]>;
}

export class MemStorage implements IStorage {
  private balances: Map<string, Balance> = new Map();
  private categories: Map<number, Category> = new Map();
  private expenses: Map<number, Expense> = new Map();
  private templates: Map<number, Template> = new Map();
  private templateItems: Map<number, TemplateItem> = new Map();
  private currentBalanceId: number = 1;
  private currentCategoryId: number = 1;
  private currentExpenseId: number = 1;
  private currentTemplateId: number = 1;
  private currentTemplateItemId: number = 1;

  constructor() {
    // Initialize with default balance
    const balance: Balance = {
      id: this.currentBalanceId++,
      amount: "1700.00",
      period: "first-half",
      updatedAt: new Date()
    };
    this.balances.set("first-half", balance);

    // Initialize with default categories
    const defaultCategories = [
      { name: "Food", icon: "🍽️", color: "bg-orange-100" },
      { name: "Transport", icon: "🚗", color: "bg-blue-100" },
      { name: "Shopping", icon: "🛒", color: "bg-green-100" },
      { name: "Bills", icon: "💳", color: "bg-purple-100" },
      { name: "Entertainment", icon: "🎬", color: "bg-red-100" },
      { name: "Health", icon: "🏥", color: "bg-pink-100" },
      { name: "Other", icon: "📋", color: "bg-gray-100" },
    ];

    defaultCategories.forEach((cat) => {
      const category: Category = {
        id: this.currentCategoryId++,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        createdAt: new Date()
      };
      this.categories.set(category.id, category);
    });
  }

  async getCurrentBalance(period = "first-half"): Promise<Balance | null> {
    return this.balances.get(period) || null;
  }

  async updateBalance(insertBalance: InsertBalance): Promise<Balance> {
    const period = insertBalance.period || "first-half";
    const existingBalance = this.balances.get(period);
    
    const updatedBalance: Balance = {
      id: existingBalance?.id || this.currentBalanceId++,
      amount: insertBalance.amount,
      period,
      updatedAt: new Date()
    };
    
    this.balances.set(period, updatedBalance);
    return updatedBalance;
  }

  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const category: Category = {
      id: this.currentCategoryId++,
      name: insertCategory.name,
      icon: insertCategory.icon,
      color: insertCategory.color,
      createdAt: new Date()
    };
    
    this.categories.set(category.id, category);
    return category;
  }

  async updateCategory(id: number, updates: Partial<InsertCategory>): Promise<Category | undefined> {
    const existing = this.categories.get(id);
    if (!existing) return undefined;

    const updated: Category = {
      ...existing,
      ...updates
    };
    this.categories.set(id, updated);
    return updated;
  }

  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }

  async getExpenses(period?: string): Promise<Expense[]> {
    const allExpenses = Array.from(this.expenses.values());
    if (!period) return allExpenses.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return allExpenses
      .filter(expense => expense.period === period)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const expense: Expense = {
      id: this.currentExpenseId++,
      description: insertExpense.description,
      amount: insertExpense.amount,
      category: insertExpense.category,
      period: insertExpense.period || "first-half",
      cleared: insertExpense.cleared || false,
      notes: insertExpense.notes || null,
      createdAt: new Date()
    };
    
    this.expenses.set(expense.id, expense);
    return expense;
  }

  async updateExpense(id: number, updates: Partial<InsertExpense>): Promise<Expense | undefined> {
    const existing = this.expenses.get(id);
    if (!existing) return undefined;

    const updated: Expense = {
      ...existing,
      ...updates
    };
    this.expenses.set(id, updated);
    return updated;
  }

  async deleteExpense(id: number): Promise<boolean> {
    return this.expenses.delete(id);
  }

  async toggleExpenseCleared(id: number): Promise<Expense | undefined> {
    const existing = this.expenses.get(id);
    if (!existing) return undefined;

    const updated: Expense = {
      ...existing,
      cleared: !existing.cleared
    };
    this.expenses.set(id, updated);
    return updated;
  }

  async getTemplates(period?: string): Promise<(Template & { items: TemplateItem[] })[]> {
    const allTemplates = Array.from(this.templates.values());
    const filteredTemplates = period 
      ? allTemplates.filter(template => template.period === period)
      : allTemplates;

    return filteredTemplates.map(template => ({
      ...template,
      items: Array.from(this.templateItems.values())
        .filter(item => item.templateId === template.id)
        .sort((a, b) => a.id - b.id)
    }));
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const template: Template = {
      id: this.currentTemplateId++,
      name: insertTemplate.name,
      period: insertTemplate.period || "first-half",
      createdAt: new Date()
    };
    
    this.templates.set(template.id, template);
    return template;
  }

  async updateTemplate(id: number, updates: Partial<InsertTemplate>): Promise<Template | undefined> {
    const existing = this.templates.get(id);
    if (!existing) return undefined;

    const updated: Template = {
      ...existing,
      ...updates
    };
    this.templates.set(id, updated);
    return updated;
  }

  async deleteTemplate(id: number): Promise<boolean> {
    // Also delete associated template items
    const itemsToDelete = Array.from(this.templateItems.values())
      .filter(item => item.templateId === id);
    
    itemsToDelete.forEach(item => {
      this.templateItems.delete(item.id);
    });
    
    return this.templates.delete(id);
  }

  async addTemplateItem(templateId: number, item: InsertTemplateItem): Promise<TemplateItem> {
    const templateItem: TemplateItem = {
      id: this.currentTemplateItemId++,
      templateId,
      description: item.description,
      amount: item.amount,
      category: item.category,
      notes: item.notes || null
    };
    this.templateItems.set(id, templateItem);
    return templateItem;
  }

  async updateTemplateItem(id: number, updates: Partial<InsertTemplateItem>): Promise<TemplateItem | undefined> {
    const existing = this.templateItems.get(id);
    if (!existing) return undefined;

    const updated: TemplateItem = {
      ...existing,
      ...updates
    };
    this.templateItems.set(id, updated);
    return updated;
  }

  async deleteTemplateItem(id: number): Promise<boolean> {
    return this.templateItems.delete(id);
  }

  async loadTemplate(templateId: number, targetPeriod?: string): Promise<Expense[]> {
    const templateItems = Array.from(this.templateItems.values())
      .filter(item => item.templateId === templateId);
    
    const newExpenses: Expense[] = [];
    
    for (const item of templateItems) {
      const id = this.currentExpenseId++;
      const expense: Expense = {
        id,
        description: item.description,
        amount: item.amount,
        category: item.category,
        period: targetPeriod || "first-half",
        cleared: false,
        notes: item.notes,
        createdAt: new Date()
      };
      this.expenses.set(id, expense);
      newExpenses.push(expense);
    }
    
    return newExpenses;
  }
}

export const storage = new MemStorage();