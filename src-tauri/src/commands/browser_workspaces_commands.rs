// CUBE Nexum - Workspaces Commands
// Tauri commands for workspace management

use crate::services::browser_workspaces::{
    BrowserWorkspacesService, Workspace, WorkspaceSettings, WorkspaceTab,
    WorkspaceTemplate, WorkspaceSnapshot, WorkspaceStats, QuickSwitchItem,
    WorkspaceIcon, WorkspaceColor, WorkspaceLayout, SwitchAnimation, ProxyConfig,
};
use tauri::State;
use std::sync::Mutex;

pub struct WorkspacesState(pub Mutex<BrowserWorkspacesService>);

// ==================== Settings Commands ====================

#[tauri::command]
pub async fn workspaces_get_settings(
    state: State<'_, WorkspacesState>,
) -> Result<WorkspaceSettings, String> {
    let service = state.0.lock().map_err(|e| e.to_string())?;
    Ok(service.get_settings())
}

#[tauri::command]
pub async fn workspaces_update_settings(
    state: State<'_, WorkspacesState>,
    settings: WorkspaceSettings,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.update_settings(settings);
    Ok(())
}

#[tauri::command]
pub async fn workspaces_set_enabled(
    state: State<'_, WorkspacesState>,
    enabled: bool,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.set_enabled(enabled);
    Ok(())
}

#[tauri::command]
pub async fn workspaces_set_bar_position(
    state: State<'_, WorkspacesState>,
    position: String,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.set_workspace_bar_position(position);
    Ok(())
}

#[tauri::command]
pub async fn workspaces_set_default_layout(
    state: State<'_, WorkspacesState>,
    layout: WorkspaceLayout,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.set_default_layout(layout);
    Ok(())
}

#[tauri::command]
pub async fn workspaces_set_switch_animation(
    state: State<'_, WorkspacesState>,
    animation: SwitchAnimation,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.set_switch_animation(animation);
    Ok(())
}

#[tauri::command]
pub async fn workspaces_set_auto_sleep(
    state: State<'_, WorkspacesState>,
    minutes: u32,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.set_auto_sleep_minutes(minutes);
    Ok(())
}

#[tauri::command]
pub async fn workspaces_set_isolation(
    state: State<'_, WorkspacesState>,
    cookies: bool,
    storage: bool,
    cache: bool,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.set_isolation_settings(cookies, storage, cache);
    Ok(())
}

// ==================== Workspace Management Commands ====================

#[tauri::command]
pub async fn workspaces_create(
    state: State<'_, WorkspacesState>,
    name: String,
    template_id: Option<String>,
) -> Result<Workspace, String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.create_workspace(name, template_id)
}

#[tauri::command]
pub async fn workspaces_create_from_template(
    state: State<'_, WorkspacesState>,
    template_id: String,
) -> Result<Workspace, String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.create_workspace_from_template(template_id)
}

#[tauri::command]
pub async fn workspaces_get(
    state: State<'_, WorkspacesState>,
    workspace_id: String,
) -> Result<Option<Workspace>, String> {
    let service = state.0.lock().map_err(|e| e.to_string())?;
    Ok(service.get_workspace(&workspace_id))
}

#[tauri::command]
pub async fn workspaces_get_all(
    state: State<'_, WorkspacesState>,
) -> Result<Vec<Workspace>, String> {
    let service = state.0.lock().map_err(|e| e.to_string())?;
    Ok(service.get_all_workspaces())
}

#[tauri::command]
pub async fn workspaces_get_active(
    state: State<'_, WorkspacesState>,
) -> Result<Option<Workspace>, String> {
    let service = state.0.lock().map_err(|e| e.to_string())?;
    Ok(service.get_active_workspace())
}

#[tauri::command]
pub async fn workspaces_get_active_id(
    state: State<'_, WorkspacesState>,
) -> Result<Option<String>, String> {
    let service = state.0.lock().map_err(|e| e.to_string())?;
    Ok(service.get_active_workspace_id())
}

#[tauri::command]
pub async fn workspaces_switch(
    state: State<'_, WorkspacesState>,
    workspace_id: String,
) -> Result<Workspace, String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.switch_workspace(&workspace_id)
}

#[tauri::command]
pub async fn workspaces_update(
    state: State<'_, WorkspacesState>,
    workspace_id: String,
    name: Option<String>,
    description: Option<String>,
    icon: Option<WorkspaceIcon>,
    color: Option<WorkspaceColor>,
) -> Result<Workspace, String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.update_workspace(&workspace_id, name, description, icon, color)
}

#[tauri::command]
pub async fn workspaces_delete(
    state: State<'_, WorkspacesState>,
    workspace_id: String,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.delete_workspace(&workspace_id)
}

#[tauri::command]
pub async fn workspaces_archive(
    state: State<'_, WorkspacesState>,
    workspace_id: String,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.archive_workspace(&workspace_id)
}

#[tauri::command]
pub async fn workspaces_unarchive(
    state: State<'_, WorkspacesState>,
    workspace_id: String,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.unarchive_workspace(&workspace_id)
}

#[tauri::command]
pub async fn workspaces_pin(
    state: State<'_, WorkspacesState>,
    workspace_id: String,
    pinned: bool,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.pin_workspace(&workspace_id, pinned)
}

#[tauri::command]
pub async fn workspaces_lock(
    state: State<'_, WorkspacesState>,
    workspace_id: String,
    locked: bool,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.lock_workspace(&workspace_id, locked)
}

#[tauri::command]
pub async fn workspaces_set_layout(
    state: State<'_, WorkspacesState>,
    workspace_id: String,
    layout: WorkspaceLayout,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.set_workspace_layout(&workspace_id, layout)
}

#[tauri::command]
pub async fn workspaces_set_shortcut(
    state: State<'_, WorkspacesState>,
    workspace_id: String,
    shortcut: Option<String>,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.set_workspace_shortcut(&workspace_id, shortcut)
}

#[tauri::command]
pub async fn workspaces_reorder(
    state: State<'_, WorkspacesState>,
    workspace_ids: Vec<String>,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.reorder_workspaces(workspace_ids)
}

// ==================== Tab Management Commands ====================

#[tauri::command]
pub async fn workspaces_add_tab(
    state: State<'_, WorkspacesState>,
    workspace_id: String,
    url: String,
    title: Option<String>,
) -> Result<WorkspaceTab, String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.add_tab_to_workspace(&workspace_id, url, title)
}

#[tauri::command]
pub async fn workspaces_remove_tab(
    state: State<'_, WorkspacesState>,
    workspace_id: String,
    tab_id: String,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.remove_tab_from_workspace(&workspace_id, &tab_id)
}

#[tauri::command]
pub async fn workspaces_update_tab(
    state: State<'_, WorkspacesState>,
    workspace_id: String,
    tab_id: String,
    url: Option<String>,
    title: Option<String>,
    favicon: Option<String>,
) -> Result<WorkspaceTab, String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.update_tab(&workspace_id, &tab_id, url, title, favicon)
}

#[tauri::command]
pub async fn workspaces_move_tab(
    state: State<'_, WorkspacesState>,
    from_workspace_id: String,
    to_workspace_id: String,
    tab_id: String,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.move_tab_to_workspace(&from_workspace_id, &to_workspace_id, &tab_id)
}

#[tauri::command]
pub async fn workspaces_set_active_tab(
    state: State<'_, WorkspacesState>,
    workspace_id: String,
    tab_id: String,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.set_active_tab(&workspace_id, &tab_id)
}

#[tauri::command]
pub async fn workspaces_pin_tab(
    state: State<'_, WorkspacesState>,
    workspace_id: String,
    tab_id: String,
    pinned: bool,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.pin_tab(&workspace_id, &tab_id, pinned)
}

#[tauri::command]
pub async fn workspaces_mute_tab(
    state: State<'_, WorkspacesState>,
    workspace_id: String,
    tab_id: String,
    muted: bool,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.mute_tab(&workspace_id, &tab_id, muted)
}

// ==================== Domain Rules Commands ====================

#[tauri::command]
pub async fn workspaces_add_allowed_domain(
    state: State<'_, WorkspacesState>,
    workspace_id: String,
    domain: String,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.add_allowed_domain(&workspace_id, domain)
}

#[tauri::command]
pub async fn workspaces_remove_allowed_domain(
    state: State<'_, WorkspacesState>,
    workspace_id: String,
    domain: String,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.remove_allowed_domain(&workspace_id, &domain)
}

#[tauri::command]
pub async fn workspaces_add_blocked_domain(
    state: State<'_, WorkspacesState>,
    workspace_id: String,
    domain: String,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.add_blocked_domain(&workspace_id, domain)
}

#[tauri::command]
pub async fn workspaces_remove_blocked_domain(
    state: State<'_, WorkspacesState>,
    workspace_id: String,
    domain: String,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.remove_blocked_domain(&workspace_id, &domain)
}

#[tauri::command]
pub async fn workspaces_is_domain_allowed(
    state: State<'_, WorkspacesState>,
    workspace_id: String,
    domain: String,
) -> Result<bool, String> {
    let service = state.0.lock().map_err(|e| e.to_string())?;
    Ok(service.is_domain_allowed(&workspace_id, &domain))
}

// ==================== Snapshot Commands ====================

#[tauri::command]
pub async fn workspaces_create_snapshot(
    state: State<'_, WorkspacesState>,
    workspace_id: String,
    name: String,
) -> Result<WorkspaceSnapshot, String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.create_snapshot(&workspace_id, name, false)
}

#[tauri::command]
pub async fn workspaces_get_snapshots(
    state: State<'_, WorkspacesState>,
    workspace_id: String,
) -> Result<Vec<WorkspaceSnapshot>, String> {
    let service = state.0.lock().map_err(|e| e.to_string())?;
    Ok(service.get_snapshots(&workspace_id))
}

#[tauri::command]
pub async fn workspaces_restore_snapshot(
    state: State<'_, WorkspacesState>,
    workspace_id: String,
    snapshot_id: String,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.restore_snapshot(&workspace_id, &snapshot_id)
}

#[tauri::command]
pub async fn workspaces_delete_snapshot(
    state: State<'_, WorkspacesState>,
    workspace_id: String,
    snapshot_id: String,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.delete_snapshot(&workspace_id, &snapshot_id)
}

// ==================== Template Commands ====================

#[tauri::command]
pub async fn workspaces_get_templates(
    state: State<'_, WorkspacesState>,
) -> Result<Vec<WorkspaceTemplate>, String> {
    let service = state.0.lock().map_err(|e| e.to_string())?;
    Ok(service.get_templates())
}

#[tauri::command]
pub async fn workspaces_create_template(
    state: State<'_, WorkspacesState>,
    name: String,
    description: String,
    icon: WorkspaceIcon,
    color: WorkspaceColor,
    default_tabs: Vec<String>,
) -> Result<WorkspaceTemplate, String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    Ok(service.create_template(name, description, icon, color, default_tabs))
}

#[tauri::command]
pub async fn workspaces_delete_template(
    state: State<'_, WorkspacesState>,
    template_id: String,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.delete_template(&template_id)
}

// ==================== Quick Switch Commands ====================

#[tauri::command]
pub async fn workspaces_get_quick_switch_items(
    state: State<'_, WorkspacesState>,
) -> Result<Vec<QuickSwitchItem>, String> {
    let service = state.0.lock().map_err(|e| e.to_string())?;
    Ok(service.get_quick_switch_items())
}

#[tauri::command]
pub async fn workspaces_quick_switch_next(
    state: State<'_, WorkspacesState>,
) -> Result<Option<Workspace>, String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    Ok(service.quick_switch_next())
}

#[tauri::command]
pub async fn workspaces_quick_switch_previous(
    state: State<'_, WorkspacesState>,
) -> Result<Option<Workspace>, String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    Ok(service.quick_switch_previous())
}

// ==================== Statistics Commands ====================

#[tauri::command]
pub async fn workspaces_get_stats(
    state: State<'_, WorkspacesState>,
) -> Result<WorkspaceStats, String> {
    let service = state.0.lock().map_err(|e| e.to_string())?;
    Ok(service.get_stats())
}

#[tauri::command]
pub async fn workspaces_reset_daily_stats(
    state: State<'_, WorkspacesState>,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.reset_daily_stats();
    Ok(())
}

#[tauri::command]
pub async fn workspaces_add_time(
    state: State<'_, WorkspacesState>,
    workspace_id: String,
    seconds: u64,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.add_time_to_workspace(&workspace_id, seconds);
    Ok(())
}

// ==================== Export/Import Commands ====================

#[tauri::command]
pub async fn workspaces_export(
    state: State<'_, WorkspacesState>,
    workspace_id: String,
) -> Result<String, String> {
    let service = state.0.lock().map_err(|e| e.to_string())?;
    service.export_workspace(&workspace_id)
}

#[tauri::command]
pub async fn workspaces_import(
    state: State<'_, WorkspacesState>,
    json: String,
) -> Result<Workspace, String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.import_workspace(&json)
}

// ==================== Utility Commands ====================

#[tauri::command]
pub async fn workspaces_get_icons() -> Result<Vec<&'static str>, String> {
    Ok(vec![
        "💼", "🏠", "🛒", "🔬", "💻", "🎨", "💰", "👥", "🎬", "📚",
        "✈️", "❤️", "📰", "🎮", "📁", "⭐", "🔧", "📊", "🎯", "🚀",
    ])
}

#[tauri::command]
pub async fn workspaces_get_colors() -> Result<Vec<String>, String> {
    use WorkspaceColor::*;
    Ok(vec![
        Blue, Green, Red, Purple, Orange, Pink, Teal, Yellow, Gray
    ].iter().map(|c| c.hex_value().to_string()).collect())
}

#[tauri::command]
pub async fn workspaces_get_layouts() -> Result<Vec<&'static str>, String> {
    Ok(vec!["Tabs", "Grid", "List", "Tree"])
}

#[tauri::command]
pub async fn workspaces_get_animations() -> Result<Vec<&'static str>, String> {
    Ok(vec!["None", "Fade", "Slide", "Scale"])
}
