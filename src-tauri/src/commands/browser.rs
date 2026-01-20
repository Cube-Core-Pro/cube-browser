use crate::AppState;
use tauri::State;

fn is_valid_http_url(url: &str) -> bool {
    if url.trim().is_empty() {
        return false;
    }

    if let Ok(parsed) = url::Url::parse(url) {
        matches!(parsed.scheme(), "http" | "https")
    } else {
        false
    }
}

fn user_friendly_error(message: &str) -> String {
    message.to_string()
}

#[tauri::command]
pub fn create_browser_tab(url: String, state: State<'_, AppState>) -> Result<String, String> {
    if !is_valid_http_url(&url) {
        return Err(user_friendly_error("La dirección que intentas abrir no es válida. Revisa que empiece por https:// o http://"));
    }

    state
        .tab_manager
        .create_tab(url)
        .map_err(|e| user_friendly_error(&format!("No se pudo crear la pestaña: {}", e)))
}

#[tauri::command]
pub fn close_browser_tab(tab_id: String, state: State<'_, AppState>) -> Result<(), String> {
    state
        .tab_manager
        .close_tab(&tab_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn navigate_tab(tab_id: String, url: String, state: State<'_, AppState>) -> Result<(), String> {
    if !is_valid_http_url(&url) {
        return Err(user_friendly_error("La dirección que intentas abrir no es válida. Revisa que empiece por https:// o http://"));
    }

    state.tab_manager.navigate(&tab_id, url).map_err(|e| {
        user_friendly_error(&format!("No se pudo navegar a la nueva dirección: {}", e))
    })
}

#[tauri::command]
pub fn reload_tab(tab_id: String, state: State<'_, AppState>) -> Result<(), String> {
    state.tab_manager.reload(&tab_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn tab_go_back(tab_id: String, state: State<'_, AppState>) -> Result<(), String> {
    state
        .tab_manager
        .go_back(&tab_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn tab_go_forward(tab_id: String, state: State<'_, AppState>) -> Result<(), String> {
    state
        .tab_manager
        .go_forward(&tab_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn tab_stop(tab_id: String, state: State<'_, AppState>) -> Result<(), String> {
    state.tab_manager.stop(&tab_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn activate_tab(tab_id: String, state: State<'_, AppState>) -> Result<(), String> {
    state
        .tab_manager
        .activate_tab(&tab_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn execute_js_in_tab(
    tab_id: String,
    code: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let trimmed = code.trim();
    if trimmed.is_empty() {
        return Err(user_friendly_error(
            "El código que intentas ejecutar está vacío.",
        ));
    }

    if trimmed.len() > 10_000 {
        return Err(user_friendly_error(
            "El código a ejecutar es demasiado largo. Divide la operación en pasos más pequeños.",
        ));
    }

    state.tab_manager.execute_js(&tab_id, trimmed).map_err(|e| {
        user_friendly_error(&format!(
            "No se pudo ejecutar el código en la pestaña: {}",
            e
        ))
    })
}

#[tauri::command]
pub fn get_tab_info(
    tab_id: String,
    state: State<'_, AppState>,
) -> Result<crate::services::browser_tab_manager::BrowserTab, String> {
    state
        .tab_manager
        .get_tab(&tab_id)
        .ok_or_else(|| "Tab not found".to_string())
}

#[tauri::command]
pub fn get_all_tabs(
    state: State<'_, AppState>,
) -> Result<Vec<crate::services::browser_tab_manager::BrowserTab>, String> {
    Ok(state.tab_manager.get_all_tabs())
}

#[tauri::command]
pub fn get_active_tab(state: State<'_, AppState>) -> Result<Option<String>, String> {
    Ok(state.tab_manager.get_active_tab_id())
}

#[tauri::command]
pub fn set_tab_pinned(
    tab_id: String,
    pinned: bool,
    state: State<'_, AppState>,
) -> Result<(), String> {
    state
        .tab_manager
        .set_pinned(&tab_id, pinned)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_tab_muted(
    tab_id: String,
    muted: bool,
    state: State<'_, AppState>,
) -> Result<(), String> {
    state
        .tab_manager
        .set_muted(&tab_id, muted)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_tab_title(
    tab_id: String,
    title: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    state
        .tab_manager
        .update_title(&tab_id, title)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_tab_url(
    tab_id: String,
    url: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    state
        .tab_manager
        .update_url(&tab_id, url)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_tab_loading(
    tab_id: String,
    loading: bool,
    state: State<'_, AppState>,
) -> Result<(), String> {
    state
        .tab_manager
        .set_loading(&tab_id, loading)
        .map_err(|e| e.to_string())
}

// ============================================================================
// TAB GROUPS - Chrome Feature
// ============================================================================

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TabGroup {
    pub id: String,
    pub title: String,
    pub color: String,
    pub collapsed: bool,
    pub tab_ids: Vec<String>,
    pub created_at: u64,
}

#[tauri::command]
pub fn create_tab_group(
    title: String,
    color: String,
    state: State<'_, AppState>,
) -> Result<TabGroup, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let group = TabGroup {
        id: id.clone(),
        title,
        color,
        collapsed: false,
        tab_ids: vec![],
        created_at: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
    };

    // Store in tab_manager's groups (we'll need to add this to TabManager)
    state
        .tab_manager
        .add_group(group.clone())
        .map_err(|e| e.to_string())?;

    Ok(group)
}

#[tauri::command]
pub fn add_tab_to_group(
    tab_id: String,
    group_id: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    state
        .tab_manager
        .add_tab_to_group(&tab_id, &group_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn remove_tab_from_group(tab_id: String, state: State<'_, AppState>) -> Result<(), String> {
    state
        .tab_manager
        .remove_tab_from_group(&tab_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn rename_tab_group(
    group_id: String,
    new_title: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    state
        .tab_manager
        .rename_group(&group_id, new_title)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn change_tab_group_color(
    group_id: String,
    new_color: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    state
        .tab_manager
        .change_group_color(&group_id, new_color)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn toggle_tab_group_collapsed(
    group_id: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    state
        .tab_manager
        .toggle_group_collapsed(&group_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_tab_group(group_id: String, state: State<'_, AppState>) -> Result<(), String> {
    state
        .tab_manager
        .delete_group(&group_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_all_tab_groups(state: State<'_, AppState>) -> Result<Vec<TabGroup>, String> {
    state
        .tab_manager
        .get_all_groups()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_tab_group(group_id: String, state: State<'_, AppState>) -> Result<TabGroup, String> {
    state
        .tab_manager
        .get_group(&group_id)
        .ok_or_else(|| "Group not found".to_string())
}
