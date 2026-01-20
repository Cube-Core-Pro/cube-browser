use crate::AppState;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiKeyConfig {
    pub service: String,
    pub key: String,
}

/// Get setting value
#[tauri::command]
pub async fn db_get_setting(
    state: State<'_, AppState>,
    key: String,
) -> Result<Option<String>, String> {
    state
        .database
        .get_setting(&key)
        .map_err(|e| format!("Failed to get setting: {}", e))
}

/// Set setting value
#[tauri::command]
pub async fn db_set_setting(
    state: State<'_, AppState>,
    key: String,
    value: String,
) -> Result<(), String> {
    state
        .database
        .set_setting(&key, &value)
        .map_err(|e| format!("Failed to set setting: {}", e))
}

/// Save API key (NOTE: Frontend should encrypt before sending)
#[tauri::command]
pub async fn db_save_api_key(
    state: State<'_, AppState>,
    service: String,
    encrypted_key: String,
) -> Result<(), String> {
    let id = uuid::Uuid::new_v4().to_string();
    state
        .database
        .save_api_key(&id, &service, &encrypted_key)
        .map_err(|e| format!("Failed to save API key: {}", e))
}

/// Get API key by service (returns encrypted value)
#[tauri::command]
pub async fn db_get_api_key(
    state: State<'_, AppState>,
    service: String,
) -> Result<Option<String>, String> {
    state
        .database
        .get_api_key(&service)
        .map_err(|e| format!("Failed to get API key: {}", e))
}

/// Save workflow
#[tauri::command]
pub async fn db_save_workflow(
    state: State<'_, AppState>,
    id: String,
    name: String,
    description: Option<String>,
    data: String,
) -> Result<(), String> {
    state
        .database
        .save_workflow(&id, &name, description.as_deref(), &data)
        .map_err(|e| format!("Failed to save workflow: {}", e))
}

/// Get all workflows
#[tauri::command]
pub async fn db_get_workflows(
    state: State<'_, AppState>,
) -> Result<Vec<crate::database::WorkflowRecord>, String> {
    state
        .database
        .get_workflows()
        .map_err(|e| format!("Failed to get workflows: {}", e))
}

/// Add URL to history
#[tauri::command]
pub async fn db_add_history(
    state: State<'_, AppState>,
    url: String,
    title: Option<String>,
    workspace_id: Option<String>,
) -> Result<(), String> {
    state
        .database
        .add_history(&url, title.as_deref(), workspace_id.as_deref())
        .map_err(|e| format!("Failed to add history: {}", e))
}

/// Get recent history
#[tauri::command]
pub async fn db_get_history(
    state: State<'_, AppState>,
    limit: usize,
) -> Result<Vec<crate::database::HistoryRecord>, String> {
    state
        .database
        .get_history(limit)
        .map_err(|e| format!("Failed to get history: {}", e))
}

/// Clear old history
#[tauri::command]
pub async fn db_clear_old_history(state: State<'_, AppState>, days: i64) -> Result<usize, String> {
    state
        .database
        .clear_old_history(days)
        .map_err(|e| format!("Failed to clear history: {}", e))
}
