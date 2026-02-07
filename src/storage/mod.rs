pub mod json_store;

pub use json_store::{
    // Legacy functions
    load_budget, save_budget,
    // Config functions
    load_config, save_config,
    // Shared data functions
    load_shared_data, save_shared_data,
    // Profile functions
    load_profile, save_profile, delete_profile_file, duplicate_profile,
    // Migration
    migrate_legacy_budget,
};
