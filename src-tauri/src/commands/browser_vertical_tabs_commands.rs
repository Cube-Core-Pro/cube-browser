// CUBE Nexum - Vertical Tabs Commands
// Tauri command interfaces for Edge/Arc style vertical tabs

use tauri::State;
use crate::services::browser_vertical_tabs::{
    BrowserVerticalTabsService, VerticalTab, VerticalTabSettings, TabBarPosition,
    TabTreeNode, VerticalTabStats, TabSearchResult, TabUpdate,
};

// ==================== Settings Commands ====================

#[tauri::command]
pub fn vertical_tabs_get_settings(
    service: State<'_, BrowserVerticalTabsService>
) -> VerticalTabSettings {
    service.get_settings()
}

#[tauri::command]
pub fn vertical_tabs_update_settings(
    service: State<'_, BrowserVerticalTabsService>,
    settings: VerticalTabSettings
) {
    service.update_settings(settings);
}

#[tauri::command]
pub fn vertical_tabs_toggle_sidebar(
    service: State<'_, BrowserVerticalTabsService>
) -> bool {
    service.toggle_sidebar()
}

#[tauri::command]
pub fn vertical_tabs_set_width(
    service: State<'_, BrowserVerticalTabsService>,
    width: u32
) {
    service.set_width(width);
}

#[tauri::command]
pub fn vertical_tabs_set_position(
    service: State<'_, BrowserVerticalTabsService>,
    position: TabBarPosition
) {
    service.set_position(position);
}

// ==================== Tab CRUD Commands ====================

#[tauri::command]
pub fn vertical_tabs_create(
    service: State<'_, BrowserVerticalTabsService>,
    url: String,
    title: String,
    parent_id: Option<String>
) -> Result<VerticalTab, String> {
    service.create_tab(url, title, parent_id)
}

#[tauri::command]
pub fn vertical_tabs_get(
    service: State<'_, BrowserVerticalTabsService>,
    tab_id: String
) -> Option<VerticalTab> {
    service.get_tab(&tab_id)
}

#[tauri::command]
pub fn vertical_tabs_get_all(
    service: State<'_, BrowserVerticalTabsService>
) -> Vec<VerticalTab> {
    service.get_all_tabs()
}

#[tauri::command]
pub fn vertical_tabs_get_visible(
    service: State<'_, BrowserVerticalTabsService>
) -> Vec<VerticalTab> {
    service.get_visible_tabs()
}

#[tauri::command]
pub fn vertical_tabs_update(
    service: State<'_, BrowserVerticalTabsService>,
    tab_id: String,
    updates: TabUpdate
) -> Result<VerticalTab, String> {
    service.update_tab(&tab_id, updates)
}

#[tauri::command]
pub fn vertical_tabs_delete(
    service: State<'_, BrowserVerticalTabsService>,
    tab_id: String,
    close_children: bool
) -> Result<Vec<String>, String> {
    service.delete_tab(&tab_id, close_children)
}

// ==================== Tab Action Commands ====================

#[tauri::command]
pub fn vertical_tabs_set_active(
    service: State<'_, BrowserVerticalTabsService>,
    tab_id: String
) -> Result<(), String> {
    service.set_active_tab(&tab_id)
}

#[tauri::command]
pub fn vertical_tabs_get_active(
    service: State<'_, BrowserVerticalTabsService>
) -> Option<VerticalTab> {
    service.get_active_tab()
}

#[tauri::command]
pub fn vertical_tabs_toggle_pin(
    service: State<'_, BrowserVerticalTabsService>,
    tab_id: String
) -> Result<bool, String> {
    service.toggle_pin(&tab_id)
}

#[tauri::command]
pub fn vertical_tabs_toggle_mute(
    service: State<'_, BrowserVerticalTabsService>,
    tab_id: String
) -> Result<bool, String> {
    service.toggle_mute(&tab_id)
}

#[tauri::command]
pub fn vertical_tabs_hibernate(
    service: State<'_, BrowserVerticalTabsService>,
    tab_id: String
) -> Result<(), String> {
    service.hibernate_tab(&tab_id)
}

#[tauri::command]
pub fn vertical_tabs_wake(
    service: State<'_, BrowserVerticalTabsService>,
    tab_id: String
) -> Result<(), String> {
    service.wake_tab(&tab_id)
}

#[tauri::command]
pub fn vertical_tabs_duplicate(
    service: State<'_, BrowserVerticalTabsService>,
    tab_id: String
) -> Result<VerticalTab, String> {
    service.duplicate_tab(&tab_id)
}

// ==================== Tree Operation Commands ====================

#[tauri::command]
pub fn vertical_tabs_toggle_expand(
    service: State<'_, BrowserVerticalTabsService>,
    tab_id: String
) -> Result<bool, String> {
    service.toggle_expand(&tab_id)
}

#[tauri::command]
pub fn vertical_tabs_expand_all(
    service: State<'_, BrowserVerticalTabsService>
) {
    service.expand_all();
}

#[tauri::command]
pub fn vertical_tabs_collapse_all(
    service: State<'_, BrowserVerticalTabsService>
) {
    service.collapse_all();
}

#[tauri::command]
pub fn vertical_tabs_make_child_of(
    service: State<'_, BrowserVerticalTabsService>,
    tab_id: String,
    parent_id: String
) -> Result<(), String> {
    service.make_child_of(&tab_id, &parent_id)
}

#[tauri::command]
pub fn vertical_tabs_detach_from_parent(
    service: State<'_, BrowserVerticalTabsService>,
    tab_id: String
) -> Result<(), String> {
    service.detach_from_parent(&tab_id)
}

#[tauri::command]
pub fn vertical_tabs_get_tree(
    service: State<'_, BrowserVerticalTabsService>
) -> Vec<TabTreeNode> {
    service.get_tree()
}

// ==================== Reordering Commands ====================

#[tauri::command]
pub fn vertical_tabs_move(
    service: State<'_, BrowserVerticalTabsService>,
    tab_id: String,
    new_index: usize
) -> Result<(), String> {
    service.move_tab(&tab_id, new_index)
}

#[tauri::command]
pub fn vertical_tabs_move_up(
    service: State<'_, BrowserVerticalTabsService>,
    tab_id: String
) -> Result<(), String> {
    service.move_up(&tab_id)
}

#[tauri::command]
pub fn vertical_tabs_move_down(
    service: State<'_, BrowserVerticalTabsService>,
    tab_id: String
) -> Result<(), String> {
    service.move_down(&tab_id)
}

// ==================== Search & Filter Commands ====================

#[tauri::command]
pub fn vertical_tabs_search(
    service: State<'_, BrowserVerticalTabsService>,
    query: String
) -> Vec<TabSearchResult> {
    service.search(&query)
}

#[tauri::command]
pub fn vertical_tabs_filter_by_workspace(
    service: State<'_, BrowserVerticalTabsService>,
    workspace_id: String
) -> Vec<VerticalTab> {
    service.filter_by_workspace(&workspace_id)
}

#[tauri::command]
pub fn vertical_tabs_filter_by_domain(
    service: State<'_, BrowserVerticalTabsService>,
    domain: String
) -> Vec<VerticalTab> {
    service.filter_by_domain(&domain)
}

#[tauri::command]
pub fn vertical_tabs_get_pinned(
    service: State<'_, BrowserVerticalTabsService>
) -> Vec<VerticalTab> {
    service.get_pinned_tabs()
}

#[tauri::command]
pub fn vertical_tabs_get_hibernated(
    service: State<'_, BrowserVerticalTabsService>
) -> Vec<VerticalTab> {
    service.get_hibernated_tabs()
}

#[tauri::command]
pub fn vertical_tabs_get_audio_playing(
    service: State<'_, BrowserVerticalTabsService>
) -> Vec<VerticalTab> {
    service.get_audio_playing_tabs()
}

// ==================== Statistics Commands ====================

#[tauri::command]
pub fn vertical_tabs_get_stats(
    service: State<'_, BrowserVerticalTabsService>
) -> VerticalTabStats {
    service.get_stats()
}

// ==================== Bulk Operation Commands ====================

#[tauri::command]
pub fn vertical_tabs_close_all_but_pinned(
    service: State<'_, BrowserVerticalTabsService>
) -> Vec<String> {
    service.close_all_but_pinned()
}

#[tauri::command]
pub fn vertical_tabs_hibernate_all_but_active(
    service: State<'_, BrowserVerticalTabsService>
) -> u32 {
    service.hibernate_all_but_active()
}

#[tauri::command]
pub fn vertical_tabs_close_duplicates(
    service: State<'_, BrowserVerticalTabsService>
) -> Vec<String> {
    service.close_duplicates()
}
