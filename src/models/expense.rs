use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Expense {
    pub id: Uuid,
    pub amount: f64,
    pub category: String,
    pub description: String,
    pub date: NaiveDate,
}

impl Expense {
    pub fn new(amount: f64, category: String, description: String, date: NaiveDate) -> Self {
        Self {
            id: Uuid::new_v4(),
            amount,
            category,
            description,
            date,
        }
    }
}
