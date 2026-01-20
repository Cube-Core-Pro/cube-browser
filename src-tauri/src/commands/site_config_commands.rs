// CUBE Nexum - Site Configuration Commands
// 
// Tauri commands for managing site configuration

use tauri::State;
use crate::services::site_config::{SiteConfigState, SiteConfiguration, ConfigUpdateResult, ConfigVersion};

/// Load current site configuration
#[tauri::command]
pub fn site_config_load(state: State<'_, SiteConfigState>) -> Result<SiteConfiguration, String> {
    state.get_current()
        .ok_or_else(|| {
            // Return default if no config exists
            let default = SiteConfiguration::default();
            state.set_current(default.clone());
            default
        })
        .or_else(|default| Ok(default))
}

/// Save site configuration
#[tauri::command]
pub fn site_config_save(
    state: State<'_, SiteConfigState>,
    config: SiteConfiguration,
) -> Result<ConfigUpdateResult, String> {
    Ok(state.set_current(config))
}

/// Get current configuration version
#[tauri::command]
pub fn site_config_get_version(state: State<'_, SiteConfigState>) -> Result<String, String> {
    state.get_current()
        .map(|c| c.version)
        .ok_or_else(|| "No configuration loaded".to_string())
}

/// Get configuration history
#[tauri::command]
pub fn site_config_get_history(
    state: State<'_, SiteConfigState>,
) -> Result<Vec<HistoryEntry>, String> {
    let history = state.get_history();
    Ok(history.into_iter().map(|v| HistoryEntry {
        version: v.version,
        timestamp: v.timestamp,
        updated_by: v.updated_by,
    }).collect())
}

/// Rollback to a previous version
#[tauri::command]
pub fn site_config_rollback(
    state: State<'_, SiteConfigState>,
    version: String,
) -> Result<ConfigUpdateResult, String> {
    match state.rollback(&version) {
        Some(config) => {
            let mut updated_config = config;
            updated_config.last_updated = chrono::Utc::now().to_rfc3339();
            updated_config.updated_by = "rollback".to_string();
            // Increment patch version
            let parts: Vec<&str> = updated_config.version.split('.').collect();
            if parts.len() == 3 {
                if let Ok(patch) = parts[2].parse::<u32>() {
                    updated_config.version = format!("{}.{}.{}", parts[0], parts[1], patch + 1);
                }
            }
            Ok(state.set_current(updated_config))
        }
        None => Ok(ConfigUpdateResult {
            success: false,
            version,
            timestamp: chrono::Utc::now().to_rfc3339(),
            error: Some("Version not found in history".to_string()),
        }),
    }
}

/// Export configuration as JSON string
#[tauri::command]
pub fn site_config_export(state: State<'_, SiteConfigState>) -> Result<String, String> {
    state.get_current()
        .map(|c| serde_json::to_string_pretty(&c).unwrap_or_default())
        .ok_or_else(|| "No configuration loaded".to_string())
}

/// Import configuration from JSON string
#[tauri::command]
pub fn site_config_import(
    state: State<'_, SiteConfigState>,
    json: String,
    updated_by: Option<String>,
) -> Result<ConfigUpdateResult, String> {
    match serde_json::from_str::<SiteConfiguration>(&json) {
        Ok(mut config) => {
            config.last_updated = chrono::Utc::now().to_rfc3339();
            config.updated_by = updated_by.unwrap_or_else(|| "import".to_string());
            Ok(state.set_current(config))
        }
        Err(e) => Ok(ConfigUpdateResult {
            success: false,
            version: "unknown".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
            error: Some(format!("Invalid JSON: {}", e)),
        }),
    }
}

// Helper struct for history response
#[derive(serde::Serialize)]
pub struct HistoryEntry {
    pub version: String,
    pub timestamp: String,
    pub updated_by: String,
}
