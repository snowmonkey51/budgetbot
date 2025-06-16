import { Balance, Expense, type InsertBalance, type InsertExpense } from "@shared/schema";

export interface IStorage {
  // Balance operations
  getCurrentBalance(): Promise<Balance | null>;
  updateBalance(balance: InsertBalance): Promise<Balance>;
  
  // Expense operations
  getExpenses(): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private balance: Balance | null = null;
  private expenses: Map<number, Expense> = new Map();
  private currentExpenseId: number = 1;

  constructor() {
    // Initialize with default balance
    this.balance = {
      id: 1,
      amount: "0.00",
      updatedAt: new Date()
    };
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

export const storage = new MemStorage();
