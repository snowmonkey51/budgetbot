import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBalanceSchema, insertExpenseSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get current balance
  app.get("/api/balance", async (req, res) => {
    try {
      const balance = await storage.getCurrentBalance();
      res.json(balance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch balance" });
    }
  });

  // Update balance
  app.put("/api/balance", async (req, res) => {
    try {
      const balanceData = insertBalanceSchema.parse(req.body);
      const balance = await storage.updateBalance(balanceData);
      res.json(balance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid balance data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update balance" });
      }
    }
  });

  // Get all expenses
  app.get("/api/expenses", async (req, res) => {
    try {
      const expenses = await storage.getExpenses();
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  // Create expense
  app.post("/api/expenses", async (req, res) => {
    try {
      const expenseData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(expenseData);
      res.status(201).json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid expense data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create expense" });
      }
    }
  });

  // Update expense
  app.put("/api/expenses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid expense ID" });
      }

      const updates = insertExpenseSchema.partial().parse(req.body);
      const expense = await storage.updateExpense(id, updates);
      
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }

      res.json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid expense data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update expense" });
      }
    }
  });

  // Delete expense
  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid expense ID" });
      }

      const deleted = await storage.deleteExpense(id);
      if (!deleted) {
        return res.status(404).json({ message: "Expense not found" });
      }

      res.json({ message: "Expense deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
