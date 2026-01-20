use serde::{Deserialize, Serialize};
use tauri::State;
use crate::services::browser_tab_manager::BrowserTabManager;

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
pub async fn create_tab_group(
    title: String,
    color: String,
    tab_manager: State<'_, BrowserTabManager>,
) -> Result<TabGroup, String> {
    let group = TabGroup {
        id: uuid::Uuid::new_v4().to_string(),
        title,
        color,
        collapsed: false,
        tab_ids: Vec::new(),
        created_at: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
    };

    tab_manager.add_tab_group(group.clone()).await?;
    Ok(group)
}

#[tauri::command]
pub async fn get_all_tab_groups(
    tab_manager: State<'_, BrowserTabManager>,
) -> Result<Vec<TabGroup>, String> {
    tab_manager.get_all_tab_groups().await
}

#[tauri::command]
pub async fn add_tab_to_group(
    group_id: String,
    tab_id: String,
    tab_manager: State<'_, BrowserTabManager>,
) -> Result<(), String> {
    tab_manager.add_tab_to_group(group_id, tab_id).await
}

#[tauri::command]
pub async fn remove_tab_from_group(
    group_id: String,
    tab_id: String,
    tab_manager: State<'_, BrowserTabManager>,
) -> Result<(), String> {
    tab_manager.remove_tab_from_group(group_id, tab_id).await
}

#[tauri::command]
pub async fn toggle_group_collapsed(
    group_id: String,
    tab_manager: State<'_, BrowserTabManager>,
) -> Result<(), String> {
    tab_manager.toggle_group_collapsed(group_id).await
}

#[tauri::command]
pub async fn rename_tab_group(
    group_id: String,
    new_title: String,
    tab_manager: State<'_, BrowserTabManager>,
) -> Result<(), String> {
    tab_manager.rename_tab_group(group_id, new_title).await
}

#[tauri::command]
pub async fn change_group_color(
    group_id: String,
    new_color: String,
    tab_manager: State<'_, BrowserTabManager>,
) -> Result<(), String> {
    tab_manager.change_group_color(group_id, new_color).await
}

#[tauri::command]
pub async fn delete_tab_group(
    group_id: String,
    tab_manager: State<'_, BrowserTabManager>,
) -> Result<(), String> {
    tab_manager.delete_tab_group(group_id).await
}

#[tauri::command]
pub async fn get_group_tabs(
    group_id: String,
    tab_manager: State<'_, BrowserTabManager>,
) -> Result<Vec<String>, String> {
    tab_manager.get_group_tabs(group_id).await
}
