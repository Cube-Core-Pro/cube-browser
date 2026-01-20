// DevTools Commands - Browser Developer Tools
use crate::services::devtools_service::{
    ConsoleMessage, DevToolsService, DomElement, NetworkRequest,
};
use std::collections::HashMap;
use tauri::State;

#[tauri::command]
pub async fn devtools_get_console(
    tab_id: String,
    devtools: State<'_, DevToolsService>,
) -> Result<Vec<ConsoleMessage>, String> {
    devtools
        .get_console_messages(&tab_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn devtools_get_network(
    tab_id: String,
    devtools: State<'_, DevToolsService>,
) -> Result<Vec<NetworkRequest>, String> {
    devtools
        .get_network_requests(&tab_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn devtools_get_dom(
    tab_id: String,
    devtools: State<'_, DevToolsService>,
) -> Result<DomElement, String> {
    devtools.get_dom_tree(&tab_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn devtools_get_localstorage(
    tab_id: String,
    devtools: State<'_, DevToolsService>,
) -> Result<HashMap<String, String>, String> {
    devtools
        .get_local_storage(&tab_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn devtools_get_sessionstorage(
    tab_id: String,
    devtools: State<'_, DevToolsService>,
) -> Result<HashMap<String, String>, String> {
    devtools
        .get_session_storage(&tab_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn devtools_execute_script(
    tab_id: String,
    script: String,
    devtools: State<'_, DevToolsService>,
) -> Result<serde_json::Value, String> {
    devtools
        .execute_script(&tab_id, &script)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn devtools_clear_console(
    tab_id: String,
    devtools: State<'_, DevToolsService>,
) -> Result<(), String> {
    devtools.clear_console(&tab_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn devtools_clear_network(
    tab_id: String,
    devtools: State<'_, DevToolsService>,
) -> Result<(), String> {
    devtools.clear_network(&tab_id).map_err(|e| e.to_string())
}
