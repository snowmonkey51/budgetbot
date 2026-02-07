use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::models::{CategoryColor, ExpensePreset, Template, DEFAULT_CATEGORIES};

fn default_categories() -> Vec<String> {
    DEFAULT_CATEGORIES.iter().map(|(s, _)| s.to_string()).collect()
}

fn default_category_colors() -> HashMap<String, CategoryColor> {
    DEFAULT_CATEGORIES
        .iter()
        .map(|(name, color)| (name.to_string(), *color))
        .collect()
}

/// Universal shared data accessible from all profiles
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SharedData {
    #[serde(default = "default_categories")]
    pub categories: Vec<String>,
    #[serde(default = "default_category_colors")]
    pub category_colors: HashMap<String, CategoryColor>,
    #[serde(default)]
    pub templates: Vec<Template>,
    #[serde(default)]
    pub presets: Vec<ExpensePreset>,
}

impl Default for SharedData {
    fn default() -> Self {
        Self {
            categories: default_categories(),
            category_colors: default_category_colors(),
            templates: Vec::new(),
            presets: Vec::new(),
        }
    }
}

impl SharedData {
    pub fn new() -> Self {
        Self::default()
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

    pub fn add_preset(&mut self, preset: ExpensePreset) {
        self.presets.push(preset);
    }

    pub fn remove_preset(&mut self, id: uuid::Uuid) {
        self.presets.retain(|p| p.id != id);
    }

    pub fn get_preset(&self, id: uuid::Uuid) -> Option<&ExpensePreset> {
        self.presets.iter().find(|p| p.id == id)
    }

    pub fn add_template(&mut self, template: Template) {
        self.templates.push(template);
    }

    pub fn delete_template(&mut self, id: uuid::Uuid) {
        self.templates.retain(|t| t.id != id);
    }

    pub fn rename_template(&mut self, id: uuid::Uuid, new_name: String) {
        if let Some(template) = self.templates.iter_mut().find(|t| t.id == id) {
            template.name = new_name;
        }
    }

    pub fn update_template_expenses(&mut self, id: uuid::Uuid, expenses: Vec<crate::models::Expense>) {
        if let Some(template) = self.templates.iter_mut().find(|t| t.id == id) {
            template.expenses = expenses;
        }
    }
}
