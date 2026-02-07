use directories::ProjectDirs;
use serde::{de::DeserializeOwned, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

use crate::models::{
    AppConfig, Budget, CategoryColor, ExpensePreset, ProfileData, SharedData, Template,
};

const APP_NAME: &str = "budget-app";

// =============================================================================
// Path Helpers
// =============================================================================

/// Get the base data directory for the app
pub fn get_data_dir() -> Option<PathBuf> {
    ProjectDirs::from("com", "budget", APP_NAME).map(|dirs| dirs.data_dir().to_path_buf())
}

/// Get path to the legacy budget.json file (for migration)
pub fn get_legacy_data_path() -> Option<PathBuf> {
    get_data_dir().map(|d| d.join("budget.json"))
}

/// Get path to config.json
pub fn get_config_path() -> Option<PathBuf> {
    get_data_dir().map(|d| d.join("config.json"))
}

/// Get path to the shared data directory
pub fn get_shared_dir() -> Option<PathBuf> {
    get_data_dir().map(|d| d.join("shared"))
}

/// Get path to the profiles directory
pub fn get_profiles_dir() -> Option<PathBuf> {
    get_data_dir().map(|d| d.join("profiles"))
}

/// Get path to a specific profile's data file
pub fn get_profile_path(profile_id: &str) -> Option<PathBuf> {
    get_profiles_dir().map(|d| d.join(format!("{}.json", profile_id)))
}

// =============================================================================
// Generic JSON Helpers
// =============================================================================

fn load_json<T: DeserializeOwned>(path: &PathBuf) -> Option<T> {
    fs::read_to_string(path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
}

fn save_json<T: Serialize>(path: &PathBuf, data: &T) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory: {}", e))?;
    }
    let json =
        serde_json::to_string_pretty(data).map_err(|e| format!("Failed to serialize: {}", e))?;
    fs::write(path, json).map_err(|e| format!("Failed to write: {}", e))
}

// =============================================================================
// Config Operations
// =============================================================================

pub fn load_config() -> AppConfig {
    let Some(path) = get_config_path() else {
        return AppConfig::default();
    };
    load_json(&path).unwrap_or_default()
}

pub fn save_config(config: &AppConfig) -> Result<(), String> {
    let path = get_config_path().ok_or("Could not get config path")?;
    save_json(&path, config)
}

// =============================================================================
// Shared Data Operations
// =============================================================================

/// Internal struct for categories file
#[derive(Serialize, serde::Deserialize)]
struct CategoriesFile {
    names: Vec<String>,
    colors: HashMap<String, CategoryColor>,
}

pub fn load_shared_data() -> SharedData {
    let Some(shared_dir) = get_shared_dir() else {
        return SharedData::default();
    };

    // Load categories
    let (categories, category_colors) = load_json::<CategoriesFile>(&shared_dir.join("categories.json"))
        .map(|c| (c.names, c.colors))
        .unwrap_or_else(|| {
            let default = SharedData::default();
            (default.categories, default.category_colors)
        });

    // Load presets
    let presets: Vec<ExpensePreset> =
        load_json(&shared_dir.join("presets.json")).unwrap_or_default();

    // Load templates
    let templates: Vec<Template> =
        load_json(&shared_dir.join("templates.json")).unwrap_or_default();

    SharedData {
        categories,
        category_colors,
        presets,
        templates,
    }
}

pub fn save_shared_data(data: &SharedData) -> Result<(), String> {
    let shared_dir = get_shared_dir().ok_or("Could not get shared dir")?;
    fs::create_dir_all(&shared_dir).map_err(|e| format!("Failed to create shared dir: {}", e))?;

    // Save categories (names + colors together)
    save_json(
        &shared_dir.join("categories.json"),
        &CategoriesFile {
            names: data.categories.clone(),
            colors: data.category_colors.clone(),
        },
    )?;

    // Save presets
    save_json(&shared_dir.join("presets.json"), &data.presets)?;

    // Save templates
    save_json(&shared_dir.join("templates.json"), &data.templates)?;

    Ok(())
}

// =============================================================================
// Profile Operations
// =============================================================================

pub fn load_profile(profile_id: &str) -> ProfileData {
    let Some(path) = get_profile_path(profile_id) else {
        return ProfileData::default();
    };
    load_json(&path).unwrap_or_default()
}

pub fn save_profile(profile_id: &str, data: &ProfileData) -> Result<(), String> {
    let path = get_profile_path(profile_id).ok_or("Could not get profile path")?;
    save_json(&path, data)
}

pub fn delete_profile_file(profile_id: &str) -> Result<(), String> {
    let path = get_profile_path(profile_id).ok_or("Could not get profile path")?;
    if path.exists() {
        fs::remove_file(&path).map_err(|e| format!("Failed to delete profile: {}", e))?;
    }
    Ok(())
}

pub fn duplicate_profile(source_id: &str, new_id: &str) -> Result<(), String> {
    let source = load_profile(source_id);
    save_profile(new_id, &source)
}

// =============================================================================
// Migration (Legacy budget.json -> New Structure)
// =============================================================================

/// Check if migration is needed (legacy file exists, new structure doesn't)
pub fn needs_migration() -> bool {
    let legacy_exists = get_legacy_data_path()
        .map(|p| p.exists())
        .unwrap_or(false);
    let config_exists = get_config_path()
        .map(|p| p.exists())
        .unwrap_or(false);

    legacy_exists && !config_exists
}

/// Migrate from legacy budget.json to new profile-based structure
pub fn migrate_legacy_budget() -> Result<bool, String> {
    if !needs_migration() {
        return Ok(false);
    }

    let legacy_path = get_legacy_data_path().ok_or("Could not get legacy path")?;

    // Load old budget
    let old_budget = load_budget();

    // Create shared data from old budget
    let shared = SharedData {
        categories: old_budget.categories,
        category_colors: old_budget.category_colors,
        templates: old_budget.templates,
        presets: old_budget.presets,
    };
    save_shared_data(&shared)?;

    // Create main profile from old budget
    let profile = ProfileData {
        income: old_budget.income,
        expenses: old_budget.expenses,
    };
    save_profile("main", &profile)?;

    // Create default config
    save_config(&AppConfig::default())?;

    // Rename old file as backup
    let backup = legacy_path.with_extension("json.backup");
    fs::rename(&legacy_path, &backup).ok(); // Ignore errors on rename

    Ok(true)
}

// =============================================================================
// Legacy Functions (kept for migration compatibility)
// =============================================================================

/// Legacy: Get path to budget.json
pub fn get_data_path() -> Option<PathBuf> {
    get_legacy_data_path()
}

/// Legacy: Load budget from budget.json
pub fn load_budget() -> Budget {
    let Some(path) = get_legacy_data_path() else {
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

/// Legacy: Save budget to budget.json
pub fn save_budget(budget: &Budget) -> Result<(), String> {
    let Some(path) = get_legacy_data_path() else {
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
