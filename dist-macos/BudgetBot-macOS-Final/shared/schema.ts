import { pgTable, text, serial, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const balance = pgTable("balance", {
  id: serial("id").primaryKey(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  period: text("period").notNull().default("first-half"), // "first-half", "second-half", "planning"
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  notes: text("notes"),
  cleared: boolean("cleared").default(false),
  period: text("period").notNull().default("first-half"), // "first-half", "second-half", or "planning"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  period: text("period").notNull(), // "first-half" or "second-half"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const templateItems = pgTable("template_items", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => templates.id, { onDelete: "cascade" }).notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  notes: text("notes"),
});

export const insertBalanceSchema = createInsertSchema(balance).omit({
  id: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
});

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
});

export const insertTemplateItemSchema = createInsertSchema(templateItems).omit({
  id: true,
  templateId: true,
});

export type Balance = typeof balance.$inferSelect;
export type InsertBalance = z.infer<typeof insertBalanceSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Template = typeof templates.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type TemplateItem = typeof templateItems.$inferSelect;
export type InsertTemplateItem = z.infer<typeof insertTemplateItemSchema>;
