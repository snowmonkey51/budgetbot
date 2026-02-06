use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// A preset expense that can be quickly added with a single click or drag
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExpensePreset {
    pub id: Uuid,
    pub name: String,        // Display name (e.g., "Netflix", "Gym")
    pub amount: f64,         // Preset amount
    pub category: String,    // Category to use
    pub description: String, // Default description
    #[serde(default)]
    pub default_day: Option<u32>, // Optional default day of month (1-31)
}

impl ExpensePreset {
    pub fn new(name: String, amount: f64, category: String, description: String) -> Self {
        Self {
            id: Uuid::new_v4(),
            name,
            amount,
            category,
            description,
            default_day: None,
        }
    }

    pub fn with_day(mut self, day: u32) -> Self {
        self.default_day = Some(day.clamp(1, 31));
        self
    }
}
