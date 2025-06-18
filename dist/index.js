var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  balance: () => balance,
  categories: () => categories,
  expenses: () => expenses,
  insertBalanceSchema: () => insertBalanceSchema,
  insertCategorySchema: () => insertCategorySchema,
  insertExpenseSchema: () => insertExpenseSchema,
  insertTemplateItemSchema: () => insertTemplateItemSchema,
  insertTemplateSchema: () => insertTemplateSchema,
  templateItems: () => templateItems,
  templates: () => templates
});
import { pgTable, text, serial, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var balance = pgTable("balance", {
  id: serial("id").primaryKey(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  period: text("period").notNull().default("first-half"),
  // "first-half", "second-half", "planning"
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  notes: text("notes"),
  cleared: boolean("cleared").default(false),
  period: text("period").notNull().default("first-half"),
  // "first-half", "second-half", or "planning"
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  period: text("period").notNull(),
  // "first-half" or "second-half"
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var templateItems = pgTable("template_items", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => templates.id, { onDelete: "cascade" }).notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  notes: text("notes")
});
var insertBalanceSchema = createInsertSchema(balance).omit({
  id: true,
  updatedAt: true
});
var insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true
});
var insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true
});
var insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true
});
var insertTemplateItemSchema = createInsertSchema(templateItems).omit({
  id: true,
  templateId: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq } from "drizzle-orm";
var DatabaseStorage = class {
  async getCurrentBalance(period = "first-half") {
    const [balanceRecord] = await db.select().from(balance).where(eq(balance.period, period)).limit(1);
    return balanceRecord || null;
  }
  async updateBalance(insertBalance) {
    const existing = await this.getCurrentBalance(insertBalance.period);
    if (existing) {
      const [updated] = await db.update(balance).set({ amount: insertBalance.amount, updatedAt: /* @__PURE__ */ new Date() }).where(eq(balance.id, existing.id)).returning();
      return updated;
    } else {
      const [created] = await db.insert(balance).values(insertBalance).returning();
      return created;
    }
  }
  async getCategories() {
    return await db.select().from(categories).orderBy(categories.name);
  }
  async createCategory(insertCategory) {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }
  async updateCategory(id, updates) {
    const [updated] = await db.update(categories).set(updates).where(eq(categories.id, id)).returning();
    return updated || void 0;
  }
  async deleteCategory(id) {
    const result = await db.delete(categories).where(eq(categories.id, id)).returning();
    return result.length > 0;
  }
  async getExpenses(period) {
    const query = db.select().from(expenses);
    if (period) {
      return await query.where(eq(expenses.period, period)).orderBy(expenses.createdAt);
    }
    return await query.orderBy(expenses.createdAt);
  }
  async createExpense(insertExpense) {
    const [expense] = await db.insert(expenses).values(insertExpense).returning();
    return expense;
  }
  async updateExpense(id, updates) {
    const [updated] = await db.update(expenses).set(updates).where(eq(expenses.id, id)).returning();
    return updated || void 0;
  }
  async deleteExpense(id) {
    const result = await db.delete(expenses).where(eq(expenses.id, id)).returning();
    return result.length > 0;
  }
  async toggleExpenseCleared(id) {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    if (!expense) return void 0;
    const [updated] = await db.update(expenses).set({ cleared: !expense.cleared }).where(eq(expenses.id, id)).returning();
    return updated || void 0;
  }
  async getTemplates(period) {
    const templatesQuery = db.select().from(templates);
    const templateList = period ? await templatesQuery.where(eq(templates.period, period)) : await templatesQuery;
    const result = [];
    for (const template of templateList) {
      const items = await db.select().from(templateItems).where(eq(templateItems.templateId, template.id));
      result.push({ ...template, items });
    }
    return result;
  }
  async createTemplate(insertTemplate) {
    const [template] = await db.insert(templates).values(insertTemplate).returning();
    return template;
  }
  async updateTemplate(id, updates) {
    const [updated] = await db.update(templates).set(updates).where(eq(templates.id, id)).returning();
    return updated || void 0;
  }
  async deleteTemplate(id) {
    const result = await db.delete(templates).where(eq(templates.id, id)).returning();
    return result.length > 0;
  }
  async addTemplateItem(templateId, item) {
    const [templateItem] = await db.insert(templateItems).values({ ...item, templateId }).returning();
    return templateItem;
  }
  async updateTemplateItem(id, updates) {
    const [updated] = await db.update(templateItems).set(updates).where(eq(templateItems.id, id)).returning();
    return updated || void 0;
  }
  async deleteTemplateItem(id) {
    const result = await db.delete(templateItems).where(eq(templateItems.id, id)).returning();
    return result.length > 0;
  }
  async loadTemplate(templateId, targetPeriod) {
    const template = await db.select().from(templates).where(eq(templates.id, templateId)).limit(1);
    if (!template.length) return [];
    const items = await db.select().from(templateItems).where(eq(templateItems.templateId, templateId));
    const newExpenses = [];
    for (const item of items) {
      const [expense] = await db.insert(expenses).values({
        description: item.description,
        amount: item.amount,
        category: item.category,
        notes: item.notes,
        period: targetPeriod || template[0].period,
        cleared: false
      }).returning();
      newExpenses.push(expense);
    }
    return newExpenses;
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import { z } from "zod";
async function registerRoutes(app2) {
  app2.get("/api/balance", async (req, res) => {
    try {
      const period = req.query.period || "first-half";
      const balance2 = await storage.getCurrentBalance(period);
      res.json(balance2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch balance" });
    }
  });
  app2.put("/api/balance", async (req, res) => {
    try {
      const balanceData = insertBalanceSchema.parse(req.body);
      const balance2 = await storage.updateBalance(balanceData);
      res.json(balance2);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid balance data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update balance" });
      }
    }
  });
  app2.get("/api/categories", async (req, res) => {
    try {
      const categories2 = await storage.getCategories();
      res.json(categories2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });
  app2.post("/api/categories", async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid category data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create category" });
      }
    }
  });
  app2.put("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      const updates = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, updates);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid category data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update category" });
      }
    }
  });
  app2.delete("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      const deleted = await storage.deleteCategory(id);
      if (!deleted) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });
  app2.get("/api/expenses", async (req, res) => {
    try {
      const period = req.query.period;
      const expenses2 = await storage.getExpenses(period);
      res.json(expenses2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });
  app2.post("/api/expenses", async (req, res) => {
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
  app2.put("/api/expenses/:id", async (req, res) => {
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
  app2.patch("/api/expenses/:id/toggle-cleared", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid expense ID" });
      }
      const expense = await storage.toggleExpenseCleared(id);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      res.json(expense);
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle expense cleared status" });
    }
  });
  app2.delete("/api/expenses/:id", async (req, res) => {
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
  app2.get("/api/templates", async (req, res) => {
    try {
      const period = req.query.period;
      const templates2 = await storage.getTemplates(period);
      res.json(templates2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });
  app2.post("/api/templates", async (req, res) => {
    try {
      const templateData = insertTemplateSchema.parse(req.body);
      const template = await storage.createTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid template data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create template" });
      }
    }
  });
  app2.put("/api/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      const templateData = insertTemplateSchema.partial().parse(req.body);
      const template = await storage.updateTemplate(id, templateData);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid template data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update template" });
      }
    }
  });
  app2.delete("/api/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      const deleted = await storage.deleteTemplate(id);
      if (!deleted) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json({ message: "Template deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete template" });
    }
  });
  app2.post("/api/templates/:id/items", async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      const itemData = insertTemplateItemSchema.parse(req.body);
      const item = await storage.addTemplateItem(templateId, itemData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid template item data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to add template item" });
      }
    }
  });
  app2.put("/api/template-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template item ID" });
      }
      const itemData = insertTemplateItemSchema.partial().parse(req.body);
      const item = await storage.updateTemplateItem(id, itemData);
      if (!item) {
        return res.status(404).json({ message: "Template item not found" });
      }
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid template item data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update template item" });
      }
    }
  });
  app2.delete("/api/template-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template item ID" });
      }
      const deleted = await storage.deleteTemplateItem(id);
      if (!deleted) {
        return res.status(404).json({ message: "Template item not found" });
      }
      res.json({ message: "Template item deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete template item" });
    }
  });
  app2.post("/api/templates/:id/load", async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      const { targetPeriod } = req.body;
      const expenses2 = await storage.loadTemplate(templateId, targetPeriod);
      res.json(expenses2);
    } catch (error) {
      res.status(500).json({ message: "Failed to load template" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
