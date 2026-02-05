use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::expense::Expense;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Template {
    pub id: Uuid,
    pub name: String,
    pub expenses: Vec<Expense>,
}

impl Template {
    pub fn new(name: String, expenses: Vec<Expense>) -> Self {
        Self {
            id: Uuid::new_v4(),
            name,
            expenses,
        }
    }

    pub fn total(&self) -> f64 {
        self.expenses.iter().filter(|e| e.active).map(|e| e.amount).sum()
    }
}
