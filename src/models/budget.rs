use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

use super::expense::Expense;

/// RGB color stored as [r, g, b]
pub type CategoryColor = [u8; 3];

pub const DEFAULT_CATEGORIES: &[(&str, [u8; 3])] = &[
    ("Food & Groceries", [34, 197, 94]),    // Green
    ("Transportation", [59, 130, 246]),     // Blue
    ("Housing & Utilities", [168, 85, 247]), // Purple
    ("Entertainment", [249, 115, 22]),      // Orange
    ("Healthcare", [236, 72, 153]),         // Pink
    ("Shopping", [20, 184, 166]),           // Teal
    ("Other", [156, 163, 175]),             // Gray
];

fn default_categories() -> Vec<String> {
    DEFAULT_CATEGORIES.iter().map(|(s, _)| s.to_string()).collect()
}

fn default_category_colors() -> HashMap<String, CategoryColor> {
    DEFAULT_CATEGORIES
        .iter()
        .map(|(name, color)| (name.to_string(), *color))
        .collect()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Budget {
    /// Single income value (monthly/budget period income)
    #[serde(default)]
    pub income: f64,
    pub expenses: Vec<Expense>,
    #[serde(default = "default_categories")]
    pub categories: Vec<String>,
    #[serde(default = "default_category_colors")]
    pub category_colors: HashMap<String, CategoryColor>,
}

impl Default for Budget {
    fn default() -> Self {
        Self {
            income: 0.0,
            expenses: Vec::new(),
            categories: default_categories(),
            category_colors: default_category_colors(),
        }
    }
}

impl Budget {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn total_income(&self) -> f64 {
        self.income
    }

    pub fn total_expenses(&self) -> f64 {
        self.expenses.iter().filter(|e| e.active).map(|e| e.amount).sum()
    }

    pub fn remaining_balance(&self) -> f64 {
        self.income - self.total_expenses()
    }

    pub fn set_income(&mut self, amount: f64) {
        self.income = amount;
    }

    pub fn add_expense(&mut self, expense: Expense) {
        self.expenses.push(expense);
    }

    pub fn remove_expense(&mut self, id: Uuid) {
        self.expenses.retain(|e| e.id != id);
    }

    pub fn toggle_expense_active(&mut self, id: Uuid) {
        if let Some(expense) = self.expenses.iter_mut().find(|e| e.id == id) {
            expense.active = !expense.active;
        }
    }

    pub fn add_category_with_color(&mut self, category: String, color: CategoryColor) {
        let trimmed = category.trim().to_string();
        if !trimmed.is_empty() && !self.categories.contains(&trimmed) {
            self.categories.push(trimmed.clone());
            self.category_colors.insert(trimmed, color);
        }
    }

    pub fn remove_category(&mut self, category: &str) {
        self.categories.retain(|c| c != category);
        self.category_colors.remove(category);
    }

    pub fn get_category_color(&self, category: &str) -> CategoryColor {
        self.category_colors
            .get(category)
            .copied()
            .unwrap_or([156, 163, 175]) // Default gray
    }

    pub fn set_category_color(&mut self, category: &str, color: CategoryColor) {
        if self.categories.contains(&category.to_string()) {
            self.category_colors.insert(category.to_string(), color);
        }
    }
}
