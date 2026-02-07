use serde::{Deserialize, Serialize};
use crate::models::Expense;

/// Profile-specific budget data (income and expenses only)
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ProfileData {
    #[serde(default)]
    pub income: f64,
    #[serde(default)]
    pub expenses: Vec<Expense>,
}

impl ProfileData {
    pub fn new() -> Self {
        Self::default()
    }

    /// Calculate total of active expenses
    pub fn total_expenses(&self) -> f64 {
        self.expenses
            .iter()
            .filter(|e| e.active)
            .map(|e| e.amount)
            .sum()
    }

    /// Calculate remaining balance
    pub fn remaining_balance(&self) -> f64 {
        self.income - self.total_expenses()
    }
}
