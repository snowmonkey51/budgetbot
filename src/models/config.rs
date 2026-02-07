use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Application configuration including profile management
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    /// ID of the currently active profile
    pub active_profile_id: String,
    /// List of all profile metadata
    pub profiles: Vec<ProfileMeta>,
}

/// Metadata for a budget profile
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileMeta {
    /// Unique identifier (used as filename)
    pub id: String,
    /// Display name shown in UI
    pub name: String,
    /// When the profile was created
    pub created_at: DateTime<Utc>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            active_profile_id: "main".to_string(),
            profiles: vec![ProfileMeta {
                id: "main".to_string(),
                name: "Main Budget".to_string(),
                created_at: Utc::now(),
            }],
        }
    }
}

impl ProfileMeta {
    pub fn new(id: String, name: String) -> Self {
        Self {
            id,
            name,
            created_at: Utc::now(),
        }
    }
}

impl AppConfig {
    /// Get metadata for the active profile
    pub fn active_profile(&self) -> Option<&ProfileMeta> {
        self.profiles.iter().find(|p| p.id == self.active_profile_id)
    }

    /// Add a new profile
    pub fn add_profile(&mut self, meta: ProfileMeta) {
        self.profiles.push(meta);
    }

    /// Remove a profile by ID (cannot remove the active profile)
    pub fn remove_profile(&mut self, id: &str) -> bool {
        if id == self.active_profile_id {
            return false;
        }
        let initial_len = self.profiles.len();
        self.profiles.retain(|p| p.id != id);
        self.profiles.len() < initial_len
    }

    /// Rename a profile
    pub fn rename_profile(&mut self, id: &str, new_name: String) {
        if let Some(profile) = self.profiles.iter_mut().find(|p| p.id == id) {
            profile.name = new_name;
        }
    }

    /// Generate a unique profile ID from a name
    pub fn generate_profile_id(&self, name: &str) -> String {
        let base_id = name
            .to_lowercase()
            .chars()
            .map(|c| if c.is_alphanumeric() { c } else { '-' })
            .collect::<String>()
            .trim_matches('-')
            .to_string();

        let base_id = if base_id.is_empty() {
            "profile".to_string()
        } else {
            base_id
        };

        // Check if ID already exists, append number if needed
        let mut id = base_id.clone();
        let mut counter = 1;
        while self.profiles.iter().any(|p| p.id == id) {
            id = format!("{}-{}", base_id, counter);
            counter += 1;
        }

        id
    }
}
