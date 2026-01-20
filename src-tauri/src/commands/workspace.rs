use crate::services::workspace_service::{
    LayoutMode, TabUpdates, Workspace, WorkspaceListResponse, WorkspaceService,
    WorkspaceSplitPanel, WorkspaceTab, WorkspaceUpdates,
};
use std::sync::{Arc, Mutex};
use tauri::State;

// ============================================================================
// State
// ============================================================================

pub struct WorkspaceState(pub Arc<Mutex<WorkspaceService>>);

impl WorkspaceState {
    pub fn new() -> Self {
        let service = WorkspaceService::new();
        if let Err(e) = service.initialize_with_default() {
            eprintln!("Failed to initialize workspace service: {}", e);
        }
        Self(Arc::new(Mutex::new(service)))
    }
}

// ============================================================================
// Commands - Workspace CRUD
// ============================================================================

#[tauri::command]
pub async fn workspace_list(
    state: State<'_, WorkspaceState>,
) -> Result<WorkspaceListResponse, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;

    service.list()
}

#[tauri::command]
pub async fn workspace_create(
    name: String,
    icon: String,
    color: String,
    state: State<'_, WorkspaceState>,
) -> Result<Workspace, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;

    service.create(name, icon, color)
}

#[tauri::command]
pub async fn workspace_update(
    id: String,
    updates: WorkspaceUpdates,
    state: State<'_, WorkspaceState>,
) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;

    service.update(id, updates)
}

#[tauri::command]
pub async fn workspace_delete(id: String, state: State<'_, WorkspaceState>) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;

    service.delete(id)
}

#[tauri::command]
pub async fn workspace_switch(id: String, state: State<'_, WorkspaceState>) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;

    service.switch(id)
}

#[tauri::command]
pub async fn workspace_duplicate(
    id: String,
    state: State<'_, WorkspaceState>,
) -> Result<Workspace, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;

    service.duplicate(id)
}

// ============================================================================
// Commands - Tab Management
// ============================================================================

#[tauri::command]
pub async fn workspace_tab_add(
    workspace_id: String,
    panel_id: String,
    url: String,
    title: String,
    state: State<'_, WorkspaceState>,
) -> Result<WorkspaceTab, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;

    service.add_tab(workspace_id, panel_id, url, title)
}

#[tauri::command]
pub async fn workspace_tab_remove(
    workspace_id: String,
    panel_id: String,
    tab_id: String,
    state: State<'_, WorkspaceState>,
) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;

    service.remove_tab(workspace_id, panel_id, tab_id)
}

#[tauri::command]
pub async fn workspace_tab_update(
    workspace_id: String,
    panel_id: String,
    tab_id: String,
    updates: TabUpdates,
    state: State<'_, WorkspaceState>,
) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;

    service.update_tab(workspace_id, panel_id, tab_id, updates)
}

#[tauri::command]
pub async fn workspace_tab_move(
    from_workspace_id: String,
    from_panel_id: String,
    tab_id: String,
    to_workspace_id: String,
    to_panel_id: String,
    state: State<'_, WorkspaceState>,
) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;

    // Get tab data
    let list = service.list()?;
    let from_workspace = list
        .workspaces
        .iter()
        .find(|w| w.id == from_workspace_id)
        .ok_or_else(|| format!("Source workspace not found: {}", from_workspace_id))?;

    let from_panel = from_workspace
        .layout
        .panels
        .iter()
        .find(|p| p.id == from_panel_id)
        .ok_or_else(|| format!("Source panel not found: {}", from_panel_id))?;

    let tab = from_panel
        .tabs
        .iter()
        .find(|t| t.id == tab_id)
        .ok_or_else(|| format!("Tab not found: {}", tab_id))?
        .clone();

    // Add to destination
    service.add_tab(
        to_workspace_id.clone(),
        to_panel_id.clone(),
        tab.url.clone(),
        tab.title.clone(),
    )?;

    // Remove from source
    service.remove_tab(from_workspace_id, from_panel_id, tab_id)?;

    Ok(())
}

#[tauri::command]
pub async fn workspace_tab_pin(
    workspace_id: String,
    panel_id: String,
    tab_id: String,
    state: State<'_, WorkspaceState>,
) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;

    service.pin_tab(workspace_id, panel_id, tab_id)
}

#[tauri::command]
pub async fn workspace_tab_switch(
    workspace_id: String,
    panel_id: String,
    tab_id: String,
    state: State<'_, WorkspaceState>,
) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;

    service.switch_tab(workspace_id, panel_id, tab_id)
}

// ============================================================================
// Commands - Layout Management
// ============================================================================

#[tauri::command]
pub async fn workspace_layout_set(
    workspace_id: String,
    mode: String,
    state: State<'_, WorkspaceState>,
) -> Result<(), String> {
    let layout_mode = match mode.as_str() {
        "1:1" => LayoutMode::OneOne,
        "2:1" => LayoutMode::TwoOne,
        "1:2" => LayoutMode::OneTwo,
        "2x2" => LayoutMode::TwoByTwo,
        "single" => LayoutMode::Single,
        _ => return Err(format!("Invalid layout mode: {}", mode)),
    };

    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;

    service.set_layout(workspace_id, layout_mode)
}

#[tauri::command]
pub async fn workspace_panel_add(
    workspace_id: String,
    state: State<'_, WorkspaceState>,
) -> Result<WorkspaceSplitPanel, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;

    service.add_panel(workspace_id)
}

#[tauri::command]
pub async fn workspace_panel_remove(
    workspace_id: String,
    panel_id: String,
    state: State<'_, WorkspaceState>,
) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;

    service.remove_panel(workspace_id, panel_id)
}

// ============================================================================
// Commands - Focus Mode
// ============================================================================

#[tauri::command]
pub async fn workspace_focus_mode_toggle(
    workspace_id: String,
    state: State<'_, WorkspaceState>,
) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;

    service.toggle_focus_mode(workspace_id)
}

// ============================================================================
// Commands - Auto-Archive
// ============================================================================

#[tauri::command]
pub async fn workspace_auto_archive_set(
    workspace_id: String,
    hours: Option<i64>,
    state: State<'_, WorkspaceState>,
) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;

    service.set_auto_archive(workspace_id, hours)
}

#[tauri::command]
pub async fn workspace_auto_archive_check(state: State<'_, WorkspaceState>) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;

    service.check_auto_archive()
}
