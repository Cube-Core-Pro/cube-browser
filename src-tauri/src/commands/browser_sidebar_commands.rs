// CUBE Nexum - Sidebar Commands
// Tauri commands for sidebar with messaging, music, and web panels

use tauri::State;
use std::sync::Arc;
use crate::services::browser_sidebar::{
    BrowserSidebarService, SidebarSettings, SidebarState, SidebarPanel,
    SidebarNote, SidebarTask, SidebarStats, SidebarPosition, PanelType,
    PanelStatus, AutoHideBehavior, PanelUpdate, TaskUpdate, TaskPriority,
};

pub struct SidebarServiceState(pub Arc<BrowserSidebarService>);

// ==================== Settings Commands ====================

#[tauri::command]
pub fn sidebar_get_settings(state: State<SidebarServiceState>) -> SidebarSettings {
    state.0.get_settings()
}

#[tauri::command]
pub fn sidebar_update_settings(
    state: State<SidebarServiceState>,
    settings: SidebarSettings,
) {
    state.0.update_settings(settings);
}

#[tauri::command]
pub fn sidebar_set_position(
    state: State<SidebarServiceState>,
    position: SidebarPosition,
) {
    state.0.set_position(position);
}

#[tauri::command]
pub fn sidebar_set_width(
    state: State<SidebarServiceState>,
    width: u32,
) {
    state.0.set_width(width);
}

#[tauri::command]
pub fn sidebar_set_auto_hide(
    state: State<SidebarServiceState>,
    behavior: AutoHideBehavior,
) {
    state.0.set_auto_hide(behavior);
}

#[tauri::command]
pub fn sidebar_toggle_compact_mode(state: State<SidebarServiceState>) -> bool {
    state.0.toggle_compact_mode()
}

// ==================== State Commands ====================

#[tauri::command]
pub fn sidebar_get_state(state: State<SidebarServiceState>) -> SidebarState {
    state.0.get_state()
}

#[tauri::command]
pub fn sidebar_toggle(state: State<SidebarServiceState>) -> bool {
    state.0.toggle_sidebar()
}

#[tauri::command]
pub fn sidebar_expand(state: State<SidebarServiceState>) {
    state.0.expand();
}

#[tauri::command]
pub fn sidebar_collapse(state: State<SidebarServiceState>) {
    state.0.collapse();
}

#[tauri::command]
pub fn sidebar_set_visible(
    state: State<SidebarServiceState>,
    visible: bool,
) {
    state.0.set_visible(visible);
}

// ==================== Panel Commands ====================

#[tauri::command]
pub fn sidebar_get_all_panels(state: State<SidebarServiceState>) -> Vec<SidebarPanel> {
    state.0.get_all_panels()
}

#[tauri::command]
pub fn sidebar_get_panel(
    state: State<SidebarServiceState>,
    panel_id: String,
) -> Option<SidebarPanel> {
    state.0.get_panel(&panel_id)
}

#[tauri::command]
pub fn sidebar_get_active_panel(state: State<SidebarServiceState>) -> Option<SidebarPanel> {
    state.0.get_active_panel()
}

#[tauri::command]
pub fn sidebar_set_active_panel(
    state: State<SidebarServiceState>,
    panel_id: String,
) -> Result<(), String> {
    state.0.set_active_panel(&panel_id)
}

#[tauri::command]
pub fn sidebar_add_panel(
    state: State<SidebarServiceState>,
    panel_type: PanelType,
) -> SidebarPanel {
    state.0.add_panel(panel_type)
}

#[tauri::command]
pub fn sidebar_add_custom_panel(
    state: State<SidebarServiceState>,
    name: String,
    url: String,
    icon: Option<String>,
) -> SidebarPanel {
    state.0.add_custom_panel(name, url, icon)
}

#[tauri::command]
pub fn sidebar_remove_panel(
    state: State<SidebarServiceState>,
    panel_id: String,
) -> Result<(), String> {
    state.0.remove_panel(&panel_id)
}

#[tauri::command]
pub fn sidebar_update_panel(
    state: State<SidebarServiceState>,
    panel_id: String,
    updates: PanelUpdate,
) -> Result<(), String> {
    state.0.update_panel(&panel_id, updates)
}

#[tauri::command]
pub fn sidebar_toggle_panel_pin(
    state: State<SidebarServiceState>,
    panel_id: String,
) -> Result<bool, String> {
    state.0.toggle_panel_pin(&panel_id)
}

#[tauri::command]
pub fn sidebar_set_panel_status(
    state: State<SidebarServiceState>,
    panel_id: String,
    status: PanelStatus,
) -> Result<(), String> {
    state.0.set_panel_status(&panel_id, status)
}

#[tauri::command]
pub fn sidebar_update_badge_count(
    state: State<SidebarServiceState>,
    panel_id: String,
    count: u32,
) -> Result<(), String> {
    state.0.update_badge_count(&panel_id, count)
}

#[tauri::command]
pub fn sidebar_reorder_panels(
    state: State<SidebarServiceState>,
    panel_order: Vec<String>,
) -> Result<(), String> {
    state.0.reorder_panels(panel_order)
}

// ==================== Panel Categories ====================

#[tauri::command]
pub fn sidebar_get_messaging_panels(state: State<SidebarServiceState>) -> Vec<SidebarPanel> {
    state.0.get_messaging_panels()
}

#[tauri::command]
pub fn sidebar_get_music_panels(state: State<SidebarServiceState>) -> Vec<SidebarPanel> {
    state.0.get_music_panels()
}

#[tauri::command]
pub fn sidebar_get_productivity_panels(state: State<SidebarServiceState>) -> Vec<SidebarPanel> {
    state.0.get_productivity_panels()
}

#[tauri::command]
pub fn sidebar_get_web_panels(state: State<SidebarServiceState>) -> Vec<SidebarPanel> {
    state.0.get_web_panels()
}

#[tauri::command]
pub fn sidebar_get_total_badge_count(state: State<SidebarServiceState>) -> u32 {
    state.0.get_total_badge_count()
}

// ==================== Notes Commands ====================

#[tauri::command]
pub fn sidebar_get_all_notes(state: State<SidebarServiceState>) -> Vec<SidebarNote> {
    state.0.get_all_notes()
}

#[tauri::command]
pub fn sidebar_get_note(
    state: State<SidebarServiceState>,
    note_id: String,
) -> Option<SidebarNote> {
    state.0.get_note(&note_id)
}

#[tauri::command]
pub fn sidebar_create_note(
    state: State<SidebarServiceState>,
    title: String,
    content: String,
) -> SidebarNote {
    state.0.create_note(title, content)
}

#[tauri::command]
pub fn sidebar_update_note(
    state: State<SidebarServiceState>,
    note_id: String,
    title: Option<String>,
    content: Option<String>,
) -> Result<(), String> {
    state.0.update_note(&note_id, title, content)
}

#[tauri::command]
pub fn sidebar_delete_note(
    state: State<SidebarServiceState>,
    note_id: String,
) -> Result<(), String> {
    state.0.delete_note(&note_id)
}

#[tauri::command]
pub fn sidebar_toggle_note_pin(
    state: State<SidebarServiceState>,
    note_id: String,
) -> Result<bool, String> {
    state.0.toggle_note_pin(&note_id)
}

#[tauri::command]
pub fn sidebar_set_note_color(
    state: State<SidebarServiceState>,
    note_id: String,
    color: String,
) -> Result<(), String> {
    state.0.set_note_color(&note_id, color)
}

#[tauri::command]
pub fn sidebar_link_note_to_url(
    state: State<SidebarServiceState>,
    note_id: String,
    url: Option<String>,
) -> Result<(), String> {
    state.0.link_note_to_url(&note_id, url)
}

// ==================== Tasks Commands ====================

#[tauri::command]
pub fn sidebar_get_all_tasks(state: State<SidebarServiceState>) -> Vec<SidebarTask> {
    state.0.get_all_tasks()
}

#[tauri::command]
pub fn sidebar_get_task(
    state: State<SidebarServiceState>,
    task_id: String,
) -> Option<SidebarTask> {
    state.0.get_task(&task_id)
}

#[tauri::command]
pub fn sidebar_create_task(
    state: State<SidebarServiceState>,
    title: String,
) -> SidebarTask {
    state.0.create_task(title)
}

#[tauri::command]
pub fn sidebar_update_task(
    state: State<SidebarServiceState>,
    task_id: String,
    updates: TaskUpdate,
) -> Result<(), String> {
    state.0.update_task(&task_id, updates)
}

#[tauri::command]
pub fn sidebar_toggle_task_complete(
    state: State<SidebarServiceState>,
    task_id: String,
) -> Result<bool, String> {
    state.0.toggle_task_complete(&task_id)
}

#[tauri::command]
pub fn sidebar_delete_task(
    state: State<SidebarServiceState>,
    task_id: String,
) -> Result<(), String> {
    state.0.delete_task(&task_id)
}

#[tauri::command]
pub fn sidebar_clear_completed_tasks(state: State<SidebarServiceState>) -> u32 {
    state.0.clear_completed_tasks()
}

// ==================== Statistics Commands ====================

#[tauri::command]
pub fn sidebar_get_stats(state: State<SidebarServiceState>) -> SidebarStats {
    state.0.get_stats()
}

#[tauri::command]
pub fn sidebar_reset_stats(state: State<SidebarServiceState>) {
    state.0.reset_stats();
}
