use crate::services::session_manager::{BrowserSession, SessionManager};
use crate::AppState;
use tauri::State;

#[tauri::command]
pub async fn save_browser_session(
    app_state: State<'_, AppState>,
    session_manager: State<'_, SessionManager>,
) -> Result<(), String> {
    // Get all data from TabManager via AppState
    let tab_groups = app_state.tab_manager.get_all_tab_groups().await?;
    let reading_list = app_state.tab_manager.get_reading_list_items().await?;
    // Collections and passwords are managed by their own services

    // Create session
    let session = BrowserSession {
        version: "1.0.0".to_string(),
        last_saved: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        tab_groups,
        reading_list,
        collections: Vec::new(), // Managed by CollectionsService
        passwords: Vec::new(),   // Managed by PasswordService
    };

    // Save to disk
    session_manager.save_session(&session)?;

    Ok(())
}

#[tauri::command]
pub async fn load_browser_session(
    app_state: State<'_, AppState>,
    session_manager: State<'_, SessionManager>,
) -> Result<BrowserSession, String> {
    // Load from disk
    let session = session_manager.load_session()?;

    // Restore to TabManager via AppState
    for group in &session.tab_groups {
        app_state.tab_manager.add_tab_group(group.clone()).await?;
    }

    for item in &session.reading_list {
        app_state
            .tab_manager
            .add_reading_list_item_async(item.clone())
            .await?;
    }

    // Collections and passwords are loaded by their own services on startup
    // No need to restore them here

    Ok(session)
}

#[tauri::command]
pub async fn get_session_info(
    session_manager: State<'_, SessionManager>,
) -> Result<BrowserSession, String> {
    Ok(session_manager.get_session())
}

#[tauri::command]
pub async fn clear_browser_session(
    session_manager: State<'_, SessionManager>,
) -> Result<(), String> {
    session_manager.clear_session()
}

#[tauri::command]
pub async fn auto_save_session(
    app_state: State<'_, AppState>,
    session_manager: State<'_, SessionManager>,
) -> Result<(), String> {
    // This will be called periodically from frontend
    save_browser_session(app_state, session_manager).await
}

/**
 * Save recovery state to disk for crash recovery
 *
 * Saves the current app state (workspaces, tabs, focus, etc.) to a recovery file
 * (workspaces, tabs, scroll positions, etc.) for crash recovery.
 */
#[tauri::command]
pub async fn save_recovery_state(app: tauri::AppHandle, state: String) -> Result<(), String> {
    use std::fs;
    use tauri::Manager;

    // Get app data directory (Tauri 2.0 API)
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    // Ensure directory exists
    fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Failed to create app data directory: {}", e))?;

    // Write recovery state file
    let recovery_file = app_data_dir.join("recovery-state.json");
    fs::write(&recovery_file, state)
        .map_err(|e| format!("Failed to write recovery state: {}", e))?;

    Ok(())
}

/**
 * Load recovery state from disk (crash recovery system)
 *
 * Returns the JSON string containing the saved app state,
 * or an error if no recovery state exists.
 */
#[tauri::command]
pub async fn load_recovery_state(app: tauri::AppHandle) -> Result<String, String> {
    use std::fs;
    use tauri::Manager;

    // Get app data directory (Tauri 2.0 API)
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    // Read recovery state file
    let recovery_file = app_data_dir.join("recovery-state.json");

    if !recovery_file.exists() {
        return Err("No recovery state found".to_string());
    }

    fs::read_to_string(&recovery_file).map_err(|e| format!("Failed to read recovery state: {}", e))
}
