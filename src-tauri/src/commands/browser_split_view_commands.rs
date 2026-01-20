// CUBE Nexum - Split View Commands
// Tauri commands for split view system

use crate::services::browser_split_view::{
    BrowserSplitViewService, SplitLayout, SplitPanel, SplitViewSession, 
    SplitViewSettings, SplitViewStats, SyncMode, LayoutPreset, PanelUpdate,
    PanelPosition,
};
use std::sync::Mutex;
use tauri::State;

pub struct SplitViewServiceState(pub Mutex<BrowserSplitViewService>);

impl Default for SplitViewServiceState {
    fn default() -> Self {
        Self(Mutex::new(BrowserSplitViewService::new()))
    }
}

// ==================== Settings Commands ====================

#[tauri::command]
pub fn split_view_get_settings(state: State<SplitViewServiceState>) -> Result<SplitViewSettings, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(service.get_settings())
}

#[tauri::command]
pub fn split_view_update_settings(state: State<SplitViewServiceState>, settings: SplitViewSettings) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.update_settings(settings);
    Ok(())
}

#[tauri::command]
pub fn split_view_set_enabled(state: State<SplitViewServiceState>, enabled: bool) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.set_enabled(enabled);
    Ok(())
}

#[tauri::command]
pub fn split_view_set_default_layout(state: State<SplitViewServiceState>, layout: SplitLayout) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.set_default_layout(layout);
    Ok(())
}

#[tauri::command]
pub fn split_view_set_default_sync_mode(state: State<SplitViewServiceState>, mode: SyncMode) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.set_default_sync_mode(mode);
    Ok(())
}

#[tauri::command]
pub fn split_view_set_show_panel_headers(state: State<SplitViewServiceState>, show: bool) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.set_show_panel_headers(show);
    Ok(())
}

// ==================== Session Management Commands ====================

#[tauri::command]
pub fn split_view_create_session(
    state: State<SplitViewServiceState>,
    name: Option<String>,
    layout: Option<SplitLayout>,
) -> Result<SplitViewSession, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.create_session(name, layout)
}

#[tauri::command]
pub fn split_view_close_session(state: State<SplitViewServiceState>, session_id: String) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.close_session(&session_id)
}

#[tauri::command]
pub fn split_view_close_all_sessions(state: State<SplitViewServiceState>) -> Result<usize, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(service.close_all_sessions())
}

#[tauri::command]
pub fn split_view_get_session(state: State<SplitViewServiceState>, session_id: String) -> Result<Option<SplitViewSession>, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(service.get_session(&session_id))
}

#[tauri::command]
pub fn split_view_get_all_sessions(state: State<SplitViewServiceState>) -> Result<Vec<SplitViewSession>, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(service.get_all_sessions())
}

#[tauri::command]
pub fn split_view_get_active_session(state: State<SplitViewServiceState>) -> Result<Option<SplitViewSession>, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(service.get_active_session())
}

#[tauri::command]
pub fn split_view_set_active_session(state: State<SplitViewServiceState>, session_id: String) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.set_active_session(&session_id)
}

// ==================== Layout Commands ====================

#[tauri::command]
pub fn split_view_set_layout(state: State<SplitViewServiceState>, session_id: String, layout: SplitLayout) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.set_layout(&session_id, layout)
}

#[tauri::command]
pub fn split_view_set_divider_position(state: State<SplitViewServiceState>, session_id: String, position: f32) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.set_divider_position(&session_id, position)
}

#[tauri::command]
pub fn split_view_toggle_divider_lock(state: State<SplitViewServiceState>, session_id: String) -> Result<bool, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.toggle_divider_lock(&session_id)
}

#[tauri::command]
pub fn split_view_get_layout_presets(state: State<SplitViewServiceState>) -> Result<Vec<LayoutPreset>, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(service.get_layout_presets())
}

// ==================== Panel Management Commands ====================

#[tauri::command]
pub fn split_view_add_panel(
    state: State<SplitViewServiceState>,
    session_id: String,
    tab_id: String,
    position: Option<PanelPosition>,
) -> Result<SplitPanel, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.add_panel(&session_id, &tab_id, position)
}

#[tauri::command]
pub fn split_view_remove_panel(state: State<SplitViewServiceState>, session_id: String, panel_id: String) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.remove_panel(&session_id, &panel_id)
}

#[tauri::command]
pub fn split_view_set_active_panel(state: State<SplitViewServiceState>, session_id: String, panel_id: String) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.set_active_panel(&session_id, &panel_id)
}

#[tauri::command]
pub fn split_view_update_panel(
    state: State<SplitViewServiceState>,
    session_id: String,
    panel_id: String,
    updates: PanelUpdate,
) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.update_panel(&session_id, &panel_id, updates)
}

#[tauri::command]
pub fn split_view_swap_panels(
    state: State<SplitViewServiceState>,
    session_id: String,
    panel1_id: String,
    panel2_id: String,
) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.swap_panels(&session_id, &panel1_id, &panel2_id)
}

// ==================== Synchronization Commands ====================

#[tauri::command]
pub fn split_view_set_sync_mode(state: State<SplitViewServiceState>, session_id: String, mode: SyncMode) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.set_sync_mode(&session_id, mode)
}

#[tauri::command]
pub fn split_view_sync_scroll(
    state: State<SplitViewServiceState>,
    session_id: String,
    source_panel_id: String,
    scroll_x: f64,
    scroll_y: f64,
) -> Result<Vec<String>, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.sync_scroll(&session_id, &source_panel_id, scroll_x, scroll_y)
}

#[tauri::command]
pub fn split_view_sync_navigation(
    state: State<SplitViewServiceState>,
    session_id: String,
    source_panel_id: String,
    url: String,
) -> Result<Vec<String>, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.sync_navigation(&session_id, &source_panel_id, &url)
}

// ==================== Saved Layouts Commands ====================

#[tauri::command]
pub fn split_view_save_layout(state: State<SplitViewServiceState>, session_id: String, name: String) -> Result<String, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.save_layout(&session_id, &name)
}

#[tauri::command]
pub fn split_view_load_saved_layout(state: State<SplitViewServiceState>, saved_id: String) -> Result<SplitViewSession, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.load_saved_layout(&saved_id)
}

#[tauri::command]
pub fn split_view_get_saved_layouts(state: State<SplitViewServiceState>) -> Result<Vec<SplitViewSession>, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(service.get_saved_layouts())
}

#[tauri::command]
pub fn split_view_delete_saved_layout(state: State<SplitViewServiceState>, saved_id: String) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.delete_saved_layout(&saved_id)
}

// ==================== Statistics Commands ====================

#[tauri::command]
pub fn split_view_get_stats(state: State<SplitViewServiceState>) -> Result<SplitViewStats, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(service.get_stats())
}

#[tauri::command]
pub fn split_view_reset_stats(state: State<SplitViewServiceState>) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.reset_stats();
    Ok(())
}
