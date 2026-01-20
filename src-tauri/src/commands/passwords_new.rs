// Password Manager Commands - Tauri Interface
use crate::models::passwords::*;
use crate::services::password_service::PasswordService;
use data_encoding::HEXLOWER;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

pub struct PasswordState {
    pub service: Mutex<PasswordService>,
}

// ============================================================================
// MASTER PASSWORD COMMANDS
// ============================================================================

#[tauri::command]
pub async fn setup_master_password(
    master_password: String,
    state: State<'_, PasswordState>,
) -> Result<(), String> {
    state
        .service
        .lock()
        .map_err(|e| e.to_string())?
        .setup_master_password(&master_password)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn verify_master_password(
    master_password: String,
    state: State<'_, PasswordState>,
) -> Result<bool, String> {
    let service = state.service.lock().map_err(|e| e.to_string())?;
    
    let config = service
        .get_master_password_config()
        .map_err(|e| e.to_string())?;

    if !config.is_set {
        return Ok(false);
    }

    // Try to decrypt first password entry to verify
    let entries = service.get_all_passwords().map_err(|e| e.to_string())?;
    
    if let Some(entry) = entries.first() {
        let salt = HEXLOWER
            .decode(config.salt.as_bytes())
            .map_err(|e| format!("Invalid salt: {}", e))?;

        match service.decrypt_password_internal(&entry.encrypted_password, &master_password, &salt) {
            Ok(_) => Ok(true),
            Err(_) => Ok(false),
        }
    } else {
        // No entries yet, consider password valid
        Ok(true)
    }
}

#[tauri::command]
pub async fn get_master_password_config(
    state: State<'_, PasswordState>,
) -> Result<MasterPasswordConfig, String> {
    state
        .service
        .lock()
        .map_err(|e| e.to_string())?
        .get_master_password_config()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn change_master_password(
    old_password: String,
    new_password: String,
    state: State<'_, PasswordState>,
) -> Result<(), String> {
    state
        .service
        .lock()
        .map_err(|e| e.to_string())?
        .change_master_password(&old_password, &new_password)
        .map_err(|e| e.to_string())
}

// ============================================================================
// PASSWORD ENTRY COMMANDS
// ============================================================================

#[tauri::command]
pub async fn get_all_passwords(
    state: State<'_, PasswordState>,
) -> Result<Vec<PasswordEntry>, String> {
    state
        .service
        .lock()
        .map_err(|e| e.to_string())?
        .get_all_passwords()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn save_password(
    password: String,
    master_password: String,
    entry: PasswordEntry,
    state: State<'_, PasswordState>,
) -> Result<(), String> {
    let service = state.service.lock().map_err(|e| e.to_string())?;
    
    // Get master password config for salt
    let config = service.get_master_password_config().map_err(|e| e.to_string())?;
    let salt = HEXLOWER
        .decode(config.salt.as_bytes())
        .map_err(|e| format!("Invalid salt: {}", e))?;

    // Encrypt the password
    let encrypted = service
        .encrypt_password_internal(&password, &master_password, &salt)
        .map_err(|e| e.to_string())?;

    // Analyze strength
    let strength = service.analyze_strength(&password);

    // Create entry with encrypted password
    let mut final_entry = entry;
    final_entry.encrypted_password = encrypted;
    final_entry.strength_score = strength.score;

    service.save_password(&final_entry).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_password_entry(
    password: Option<String>,
    master_password: String,
    entry: PasswordEntry,
    state: State<'_, PasswordState>,
) -> Result<(), String> {
    let service = state.service.lock().map_err(|e| e.to_string())?;
    
    let mut final_entry = entry;

    // If password is being updated, encrypt it
    if let Some(pwd) = password {
        let config = service.get_master_password_config().map_err(|e| e.to_string())?;
        let salt = HEXLOWER
            .decode(config.salt.as_bytes())
            .map_err(|e| format!("Invalid salt: {}", e))?;

        let encrypted = service
            .encrypt_password_internal(&pwd, &master_password, &salt)
            .map_err(|e| e.to_string())?;

        let strength = service.analyze_strength(&pwd);
        
        final_entry.encrypted_password = encrypted;
        final_entry.strength_score = strength.score;
    }

    final_entry.date_modified = chrono::Utc::now().timestamp();
    
    service.update_password(&final_entry).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_password(
    id: String,
    state: State<'_, PasswordState>,
) -> Result<(), String> {
    state
        .service
        .lock()
        .map_err(|e| e.to_string())?
        .delete_password(&id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn decrypt_password(
    entry_id: String,
    master_password: String,
    state: State<'_, PasswordState>,
) -> Result<String, String> {
    let service = state.service.lock().map_err(|e| e.to_string())?;
    
    // Get the entry
    let entries = service.get_all_passwords().map_err(|e| e.to_string())?;
    let entry = entries
        .iter()
        .find(|e| e.id == entry_id)
        .ok_or_else(|| "Password entry not found".to_string())?;

    // Get salt
    let config = service.get_master_password_config().map_err(|e| e.to_string())?;
    let salt = HEXLOWER
        .decode(config.salt.as_bytes())
        .map_err(|e| format!("Invalid salt: {}", e))?;

    // Update last used
    service.update_last_used(&entry_id).map_err(|e| e.to_string())?;

    // Decrypt
    service
        .decrypt_password_internal(&entry.encrypted_password, &master_password, &salt)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_password_last_used(
    id: String,
    state: State<'_, PasswordState>,
) -> Result<(), String> {
    state
        .service
        .lock()
        .map_err(|e| e.to_string())?
        .update_last_used(&id)
        .map_err(|e| e.to_string())
}

// ============================================================================
// CATEGORY COMMANDS
// ============================================================================

#[tauri::command]
pub async fn get_password_categories(
    state: State<'_, PasswordState>,
) -> Result<Vec<PasswordCategory>, String> {
    state
        .service
        .lock()
        .map_err(|e| e.to_string())?
        .get_all_categories()
        .map_err(|e| e.to_string())
}

// ============================================================================
// STATISTICS COMMANDS
// ============================================================================

#[tauri::command]
pub async fn get_password_stats(
    state: State<'_, PasswordState>,
) -> Result<PasswordStats, String> {
    state
        .service
        .lock()
        .map_err(|e| e.to_string())?
        .get_stats()
        .map_err(|e| e.to_string())
}

// ============================================================================
// PASSWORD GENERATION COMMANDS
// ============================================================================

#[tauri::command]
pub async fn generate_password(
    config: PasswordGeneratorConfig,
    state: State<'_, PasswordState>,
) -> Result<String, String> {
    state
        .service
        .lock()
        .map_err(|e| e.to_string())?
        .generate_password(&config)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn analyze_password_strength(
    password: String,
    state: State<'_, PasswordState>,
) -> Result<PasswordStrength, String> {
    Ok(state
        .service
        .lock()
        .map_err(|e| e.to_string())?
        .analyze_strength(&password))
}

// ============================================================================
// SEARCH & FILTER COMMANDS
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordFilter {
    pub category: Option<String>,
    pub search: Option<String>,
    pub weak_only: bool,
    pub favorites_only: bool,
}

#[tauri::command]
pub async fn search_passwords(
    filter: PasswordFilter,
    state: State<'_, PasswordState>,
) -> Result<Vec<PasswordEntry>, String> {
    let service = state.service.lock().map_err(|e| e.to_string())?;
    let mut entries = service.get_all_passwords().map_err(|e| e.to_string())?;

    // Apply filters
    if let Some(category) = filter.category {
        entries.retain(|e| e.category == category);
    }

    if let Some(search) = filter.search {
        let search_lower = search.to_lowercase();
        entries.retain(|e| {
            e.name.to_lowercase().contains(&search_lower)
                || e.username.to_lowercase().contains(&search_lower)
                || e.url.as_ref().is_some_and(|u| u.to_lowercase().contains(&search_lower))
        });
    }

    if filter.weak_only {
        entries.retain(|e| e.strength_score <= 2);
    }

    if filter.favorites_only {
        entries.retain(|e| e.favorite);
    }

    Ok(entries)
}

// ============================================================================
// EXPORT/IMPORT COMMANDS
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordExport {
    pub entries: Vec<PasswordEntry>,
    pub categories: Vec<PasswordCategory>,
    pub export_date: i64,
    pub version: String,
}

#[tauri::command]
pub async fn export_passwords(
    state: State<'_, PasswordState>,
) -> Result<PasswordExport, String> {
    let service = state.service.lock().map_err(|e| e.to_string())?;
    
    Ok(PasswordExport {
        entries: service.get_all_passwords().map_err(|e| e.to_string())?,
        categories: service.get_all_categories().map_err(|e| e.to_string())?,
        export_date: chrono::Utc::now().timestamp(),
        version: "1.0.0".to_string(),
    })
}

#[tauri::command]
pub async fn import_passwords(
    data: PasswordExport,
    _master_password: String,
    state: State<'_, PasswordState>,
) -> Result<ImportResult, String> {
    let service = state.service.lock().map_err(|e| e.to_string())?;
    
    let mut imported = 0;
    let mut failed = 0;
    let mut errors = Vec::new();

    for entry in data.entries {
        match service.save_password(&entry) {
            Ok(_) => imported += 1,
            Err(e) => {
                failed += 1;
                errors.push(format!("Failed to import {}: {}", entry.name, e));
            }
        }
    }

    Ok(ImportResult {
        imported,
        failed,
        errors,
    })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportResult {
    pub imported: i32,
    pub failed: i32,
    pub errors: Vec<String>,
}
