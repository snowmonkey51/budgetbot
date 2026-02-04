use directories::ProjectDirs;
use std::fs;
use std::path::PathBuf;

use crate::models::Budget;

const APP_NAME: &str = "budget-app";

pub fn get_data_path() -> Option<PathBuf> {
    ProjectDirs::from("com", "budget", APP_NAME).map(|dirs| {
        let data_dir = dirs.data_dir();
        data_dir.join("budget.json")
    })
}

pub fn load_budget() -> Budget {
    let Some(path) = get_data_path() else {
        return Budget::new();
    };

    if !path.exists() {
        return Budget::new();
    }

    match fs::read_to_string(&path) {
        Ok(contents) => serde_json::from_str(&contents).unwrap_or_else(|_| Budget::new()),
        Err(_) => Budget::new(),
    }
}

pub fn save_budget(budget: &Budget) -> Result<(), String> {
    let Some(path) = get_data_path() else {
        return Err("Could not determine data directory".to_string());
    };

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    let json = serde_json::to_string_pretty(budget)
        .map_err(|e| format!("Failed to serialize budget: {}", e))?;

    fs::write(&path, json).map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(())
}
