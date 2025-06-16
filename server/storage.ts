import { Balance, Expense, Category, type InsertBalance, type InsertExpense, type InsertCategory, balance, expenses, categories } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Balance operations
  getCurrentBalance(): Promise<Balance | null>;
  updateBalance(balance: InsertBalance): Promise<Balance>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Expense operations
  getExpenses(): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getCurrentBalance(): Promise<Balance | null> {
    const [balanceRecord] = await db.select().from(balance).limit(1);
    return balanceRecord || null;
  }

  async updateBalance(insertBalance: InsertBalance): Promise<Balance> {
    // Check if balance record exists
    const existing = await this.getCurrentBalance();
    
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

  async getExpenses(): Promise<Expense[]> {
    return await db
      .select()
      .from(expenses)
      .orderBy(expenses.createdAt);
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
}

export class MemStorage implements IStorage {
  private balance: Balance | null = null;
  private categories: Map<number, Category> = new Map();
  private expenses: Map<number, Expense> = new Map();
  private currentCategoryId: number = 1;
  private currentExpenseId: number = 1;

  constructor() {
    // Initialize with default balance
    this.balance = {
      id: 1,
      amount: "0.00",
      updatedAt: new Date()
    };

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

  async getCurrentBalance(): Promise<Balance | null> {
    return this.balance;
  }

  async updateBalance(insertBalance: InsertBalance): Promise<Balance> {
    this.balance = {
      id: 1,
      amount: insertBalance.amount,
      updatedAt: new Date()
    };
    return this.balance;
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

  async getExpenses(): Promise<Expense[]> {
    return Array.from(this.expenses.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = this.currentExpenseId++;
    const expense: Expense = {
      ...insertExpense,
      id,
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
}

export const storage = new DatabaseStorage();
