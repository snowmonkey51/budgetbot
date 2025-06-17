import { 
  Balance, 
  Expense, 
  Category, 
  Template,
  TemplateItem,
  type InsertBalance, 
  type InsertExpense, 
  type InsertCategory,
  type InsertTemplate,
  type InsertTemplateItem,
  balance, 
  expenses, 
  categories,
  templates,
  templateItems
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

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

export class DatabaseStorage implements IStorage {
  async getCurrentBalance(period = "first-half"): Promise<Balance | null> {
    const [balanceRecord] = await db.select().from(balance).where(eq(balance.period, period)).limit(1);
    return balanceRecord || null;
  }

  async updateBalance(insertBalance: InsertBalance): Promise<Balance> {
    // Check if balance record exists for this period
    const existing = await this.getCurrentBalance(insertBalance.period);
    
    if (existing) {
      const [updated] = await db
        .update(balance)
        .set({ amount: insertBalance.amount, updatedAt: new Date() })
        .where(eq(balance.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(balance)
        .values(insertBalance)
        .returning();
      return created;
    }
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(insertCategory)
      .returning();
    return category;
  }

  async updateCategory(id: number, updates: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updated] = await db
      .update(categories)
      .set(updates)
      .where(eq(categories.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning();
    return result.length > 0;
  }

  async getExpenses(period?: string): Promise<Expense[]> {
    const query = db.select().from(expenses);
    
    if (period) {
      return await query
        .where(eq(expenses.period, period))
        .orderBy(expenses.createdAt);
    }
    
    return await query.orderBy(expenses.createdAt);
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const [expense] = await db
      .insert(expenses)
      .values(insertExpense)
      .returning();
    return expense;
  }

  async updateExpense(id: number, updates: Partial<InsertExpense>): Promise<Expense | undefined> {
    const [updated] = await db
      .update(expenses)
      .set(updates)
      .where(eq(expenses.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteExpense(id: number): Promise<boolean> {
    const result = await db
      .delete(expenses)
      .where(eq(expenses.id, id))
      .returning();
    return result.length > 0;
  }

  async toggleExpenseCleared(id: number): Promise<Expense | undefined> {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    if (!expense) return undefined;

    const [updated] = await db
      .update(expenses)
      .set({ cleared: !expense.cleared })
      .where(eq(expenses.id, id))
      .returning();
    
    return updated || undefined;
  }

  async getTemplates(period?: string): Promise<(Template & { items: TemplateItem[] })[]> {
    const templatesQuery = db.select().from(templates);
    const templateList = period 
      ? await templatesQuery.where(eq(templates.period, period))
      : await templatesQuery;

    const result = [];
    for (const template of templateList) {
      const items = await db.select().from(templateItems).where(eq(templateItems.templateId, template.id));
      result.push({ ...template, items });
    }
    
    return result;
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const [template] = await db
      .insert(templates)
      .values(insertTemplate)
      .returning();
    return template;
  }

  async updateTemplate(id: number, updates: Partial<InsertTemplate>): Promise<Template | undefined> {
    const [updated] = await db
      .update(templates)
      .set(updates)
      .where(eq(templates.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteTemplate(id: number): Promise<boolean> {
    const result = await db
      .delete(templates)
      .where(eq(templates.id, id))
      .returning();
    return result.length > 0;
  }

  async addTemplateItem(templateId: number, item: InsertTemplateItem): Promise<TemplateItem> {
    const [templateItem] = await db
      .insert(templateItems)
      .values({ ...item, templateId })
      .returning();
    return templateItem;
  }

  async updateTemplateItem(id: number, updates: Partial<InsertTemplateItem>): Promise<TemplateItem | undefined> {
    const [updated] = await db
      .update(templateItems)
      .set(updates)
      .where(eq(templateItems.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteTemplateItem(id: number): Promise<boolean> {
    const result = await db
      .delete(templateItems)
      .where(eq(templateItems.id, id))
      .returning();
    return result.length > 0;
  }

  async loadTemplate(templateId: number, targetPeriod?: string): Promise<Expense[]> {
    const template = await db.select().from(templates).where(eq(templates.id, templateId)).limit(1);
    if (!template.length) return [];

    const items = await db.select().from(templateItems).where(eq(templateItems.templateId, templateId));
    
    const newExpenses: Expense[] = [];
    for (const item of items) {
      const [expense] = await db
        .insert(expenses)
        .values({
          description: item.description,
          amount: item.amount,
          category: item.category,
          notes: item.notes,
          period: targetPeriod || template[0].period,
          cleared: false
        })
        .returning();
      newExpenses.push(expense);
    }
    
    return newExpenses;
  }
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
    // Initialize with default balances for each period
    const periods = ["first-half", "second-half", "planning"];
    periods.forEach((period) => {
      const balance: Balance = {
        id: this.currentBalanceId++,
        amount: "0.00",
        period,
        updatedAt: new Date()
      };
      this.balances.set(period, balance);
    });

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
    const id = this.currentCategoryId++;
    const category: Category = {
      ...insertCategory,
      id,
      createdAt: new Date()
    };
    this.categories.set(id, category);
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
    
    if (period) {
      return allExpenses
        .filter(expense => expense.period === period)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    
    return allExpenses.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = this.currentExpenseId++;
    const expense: Expense = {
      id,
      description: insertExpense.description,
      amount: insertExpense.amount,
      category: insertExpense.category,
      notes: insertExpense.notes ?? null,
      cleared: false,
      period: insertExpense.period || "first-half",
      createdAt: new Date()
    };
    this.expenses.set(id, expense);
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
    const filteredTemplates = period ? allTemplates.filter(t => t.period === period) : allTemplates;
    
    return filteredTemplates.map(template => ({
      ...template,
      items: Array.from(this.templateItems.values()).filter(item => item.templateId === template.id)
    }));
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const id = this.currentTemplateId++;
    const template: Template = {
      ...insertTemplate,
      id,
      createdAt: new Date()
    };
    this.templates.set(id, template);
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
    // Delete all template items first
    const items = Array.from(this.templateItems.values()).filter(item => item.templateId === id);
    items.forEach(item => this.templateItems.delete(item.id));
    
    return this.templates.delete(id);
  }

  async addTemplateItem(templateId: number, item: InsertTemplateItem): Promise<TemplateItem> {
    const id = this.currentTemplateItemId++;
    const templateItem: TemplateItem = {
      id,
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
    const template = this.templates.get(templateId);
    if (!template) return [];

    const items = Array.from(this.templateItems.values()).filter(item => item.templateId === templateId);
    
    const newExpenses: Expense[] = [];
    for (const item of items) {
      const id = this.currentExpenseId++;
      const expense: Expense = {
        id,
        description: item.description,
        amount: item.amount,
        category: item.category,
        notes: item.notes || null,
        period: targetPeriod || template.period,
        cleared: false,
        createdAt: new Date()
      };
      this.expenses.set(id, expense);
      newExpenses.push(expense);
    }
    
    return newExpenses;
  }
}

export const storage = new MemStorage();
