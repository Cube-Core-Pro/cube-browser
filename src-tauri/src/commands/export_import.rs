use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
/**
 * Export/Import Commands
 *
 * Tauri commands for workspace export/import functionality
 * Handles file dialogs, JSON serialization, and backup management
 */
use tauri::{command, AppHandle};

#[derive(Debug, Serialize, Deserialize)]
pub struct BackupEntry {
    pub id: String,
    pub timestamp: String,
    pub reason: String,
    pub workspace_count: u32,
    pub tab_count: u32,
    pub file_path: String,
    pub size: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BackupHistory {
    pub backups: Vec<BackupEntry>,
    pub max_backups: u32,
    pub auto_backup_enabled: bool,
    pub last_auto_backup: Option<String>,
}

/**
 * Export workspaces to JSON file
 * Writes JSON content to the specified file path
 */
#[command]
pub async fn export_workspaces(
    _app: AppHandle,
    file_path: String,
    content: String,
) -> Result<bool, String> {
    use std::path::Path;

    // Write file to the specified path
    let path = Path::new(&file_path);

    // Create parent directories if they don't exist
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    // Write content
    fs::write(path, content).map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(true)
}

/**
 * Import workspaces from JSON file
 * Reads JSON content from the specified file path
 */
#[command]
pub async fn import_workspaces_file(
    _app: AppHandle,
    file_path: String,
) -> Result<Option<String>, String> {
    use std::path::Path;

    let path = Path::new(&file_path);

    // Check if file exists
    if !path.exists() {
        return Ok(None);
    }

    // Read file content
    let content = fs::read_to_string(path).map_err(|e| format!("Failed to read file: {}", e))?;

    Ok(Some(content))
}

/**
 * Create backup file
 * Saves backup to app data directory
 */
#[command]
pub async fn create_backup(
    app: AppHandle,
    filename: String,
    content: String,
    reason: String,
) -> Result<(), String> {
    use tauri::Manager;

    // Get app data directory (Tauri 2.0 API)
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data directory: {}", e))?;

    // Create backups directory
    let backups_dir = app_data_dir.join("backups");
    fs::create_dir_all(&backups_dir)
        .map_err(|e| format!("Failed to create backups directory: {}", e))?;

    // Write backup file
    let backup_path = backups_dir.join(&filename);
    fs::write(&backup_path, content).map_err(|e| format!("Failed to write backup: {}", e))?;

    // Update backup history
    update_backup_history(&app, &filename, &reason, &backup_path).await?;

    // Clean old backups (keep only last 5)
    cleanup_old_backups(&backups_dir, 5)?;

    Ok(())
}

/**
 * Read backup file
 */
#[command]
pub async fn read_backup_file(app: AppHandle, backup_id: String) -> Result<String, String> {
    use tauri::Manager;

    // Get app data directory (Tauri 2.0 API)
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data directory: {}", e))?;

    // Read backup file
    let backup_path = app_data_dir.join("backups").join(&backup_id);
    let content =
        fs::read_to_string(&backup_path).map_err(|e| format!("Failed to read backup: {}", e))?;

    Ok(content)
}

/**
 * Get backup history
 */
#[command]
pub async fn get_backup_history(app: AppHandle) -> Result<BackupHistory, String> {
    use tauri::Manager;

    // Get app data directory (Tauri 2.0 API)
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data directory: {}", e))?;

    let history_path = app_data_dir.join("backup_history.json");

    // If history file doesn't exist, return empty history
    if !history_path.exists() {
        return Ok(BackupHistory {
            backups: Vec::new(),
            max_backups: 5,
            auto_backup_enabled: true,
            last_auto_backup: None,
        });
    }

    // Read and parse history
    let content = fs::read_to_string(&history_path)
        .map_err(|e| format!("Failed to read backup history: {}", e))?;

    let history: BackupHistory = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse backup history: {}", e))?;

    Ok(history)
}

/**
 * Delete backup
 */
#[command]
pub async fn delete_backup(app: AppHandle, backup_id: String) -> Result<(), String> {
    use tauri::Manager;

    // Get app data directory (Tauri 2.0 API)
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data directory: {}", e))?;

    // Delete backup file
    let backup_path = app_data_dir.join("backups").join(&backup_id);
    fs::remove_file(&backup_path).map_err(|e| format!("Failed to delete backup: {}", e))?;

    // Update history
    let history_path = app_data_dir.join("backup_history.json");
    if history_path.exists() {
        let content = fs::read_to_string(&history_path)
            .map_err(|e| format!("Failed to read history: {}", e))?;
        let mut history: BackupHistory = serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse history: {}", e))?;

        // Remove backup entry
        history.backups.retain(|b| b.file_path != backup_id);

        // Save updated history
        let updated_content = serde_json::to_string_pretty(&history)
            .map_err(|e| format!("Failed to serialize history: {}", e))?;

        fs::write(&history_path, updated_content)
            .map_err(|e| format!("Failed to write history: {}", e))?;
    }

    Ok(())
}

/**
 * Update backup history
 */
async fn update_backup_history(
    app: &AppHandle,
    filename: &str,
    reason: &str,
    backup_path: &PathBuf,
) -> Result<(), String> {
    use tauri::Manager;

    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data directory: {}", e))?;

    let history_path = app_data_dir.join("backup_history.json");

    // Load existing history or create new
    let mut history = if history_path.exists() {
        let content = fs::read_to_string(&history_path)
            .map_err(|e| format!("Failed to read history: {}", e))?;
        serde_json::from_str::<BackupHistory>(&content)
            .map_err(|e| format!("Failed to parse history: {}", e))?
    } else {
        BackupHistory {
            backups: Vec::new(),
            max_backups: 5,
            auto_backup_enabled: true,
            last_auto_backup: None,
        }
    };

    // Get file size
    let file_size = fs::metadata(backup_path).map(|m| m.len()).unwrap_or(0);

    // Parse workspace and tab counts from JSON content
    let (workspace_count, tab_count) = if let Ok(content) = fs::read_to_string(backup_path) {
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
            let workspaces = json["workspaces"].as_array().map(|w| w.len()).unwrap_or(0);

            let tabs = json["workspaces"]
                .as_array()
                .map(|ws| {
                    ws.iter()
                        .filter_map(|w| w["tabs"].as_array())
                        .map(|t| t.len())
                        .sum::<usize>()
                })
                .unwrap_or(0);

            (workspaces as u32, tabs as u32)
        } else {
            (0, 0)
        }
    } else {
        (0, 0)
    };

    // Create new backup entry
    let new_entry = BackupEntry {
        id: filename.to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
        reason: reason.to_string(),
        workspace_count,
        tab_count,
        file_path: filename.to_string(),
        size: file_size,
    };

    // Add to history (newest first)
    history.backups.insert(0, new_entry);

    // Keep only max_backups entries
    history.backups.truncate(history.max_backups as usize);

    // Save history
    let content = serde_json::to_string_pretty(&history)
        .map_err(|e| format!("Failed to serialize history: {}", e))?;

    fs::write(&history_path, content).map_err(|e| format!("Failed to write history: {}", e))?;

    Ok(())
}

/**
 * Clean up old backups (keep only N most recent)
 */
fn cleanup_old_backups(backups_dir: &PathBuf, keep_count: usize) -> Result<(), String> {
    // Get all backup files
    let mut backup_files: Vec<_> = fs::read_dir(backups_dir)
        .map_err(|e| format!("Failed to read backups directory: {}", e))?
        .filter_map(|entry| entry.ok())
        .filter(|entry| {
            entry
                .path()
                .extension()
                .and_then(|ext| ext.to_str())
                .map(|ext| ext == "json")
                .unwrap_or(false)
        })
        .collect();

    // Sort by modification time (newest first)
    backup_files.sort_by_key(|entry| entry.metadata().and_then(|m| m.modified()).ok());
    backup_files.reverse();

    // Delete old backups
    for entry in backup_files.iter().skip(keep_count) {
        let _ = fs::remove_file(entry.path());
    }

    Ok(())
}
