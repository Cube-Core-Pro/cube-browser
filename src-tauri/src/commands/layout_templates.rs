/**
 * Layout Template Commands
 *
 * Tauri commands for managing layout templates.
 */
use crate::services::layout_template_service::{LayoutTemplate, LayoutTemplateService};
use std::sync::Mutex;
use tauri::{AppHandle, State};

pub struct LayoutTemplateServiceState(pub Mutex<Option<LayoutTemplateService>>);

#[tauri::command]
pub async fn list_layout_templates(
    app: AppHandle,
    state: State<'_, LayoutTemplateServiceState>,
) -> Result<Vec<LayoutTemplate>, String> {
    // Get or create service
    let mut service_guard = state.0.lock().map_err(|e| e.to_string())?;

    if service_guard.is_none() {
        *service_guard = Some(LayoutTemplateService::new(app.clone()));
    }

    let service = service_guard.as_ref().unwrap();
    service.list_templates()
}

#[tauri::command]
pub async fn save_layout_template(
    app: AppHandle,
    state: State<'_, LayoutTemplateServiceState>,
    template: LayoutTemplate,
) -> Result<LayoutTemplate, String> {
    // Get or create service
    let mut service_guard = state.0.lock().map_err(|e| e.to_string())?;

    if service_guard.is_none() {
        *service_guard = Some(LayoutTemplateService::new(app.clone()));
    }

    let service = service_guard.as_ref().unwrap();
    service.save_template(template)
}

#[tauri::command]
pub async fn update_layout_template(
    app: AppHandle,
    state: State<'_, LayoutTemplateServiceState>,
    template_id: String,
    updates: serde_json::Value,
) -> Result<LayoutTemplate, String> {
    // Get or create service
    let mut service_guard = state.0.lock().map_err(|e| e.to_string())?;

    if service_guard.is_none() {
        *service_guard = Some(LayoutTemplateService::new(app.clone()));
    }

    let service = service_guard.as_ref().unwrap();
    service.update_template(&template_id, updates)
}

#[tauri::command]
pub async fn update_template_usage(
    app: AppHandle,
    state: State<'_, LayoutTemplateServiceState>,
    template_id: String,
) -> Result<LayoutTemplate, String> {
    // Get or create service
    let mut service_guard = state.0.lock().map_err(|e| e.to_string())?;

    if service_guard.is_none() {
        *service_guard = Some(LayoutTemplateService::new(app.clone()));
    }

    let service = service_guard.as_ref().unwrap();
    service.update_template_usage(&template_id)
}

#[tauri::command]
pub async fn delete_layout_template(
    app: AppHandle,
    state: State<'_, LayoutTemplateServiceState>,
    template_id: String,
) -> Result<(), String> {
    // Get or create service
    let mut service_guard = state.0.lock().map_err(|e| e.to_string())?;

    if service_guard.is_none() {
        *service_guard = Some(LayoutTemplateService::new(app.clone()));
    }

    let service = service_guard.as_ref().unwrap();
    service.delete_template(&template_id)
}

#[tauri::command]
pub async fn get_current_layout_mode(
    workspace_state: State<'_, crate::commands::workspace::WorkspaceState>,
) -> Result<String, String> {
    let service_guard = workspace_state.0.lock().map_err(|e| e.to_string())?;

    let workspaces = service_guard.list()?;
    if let Some(active_workspace) = workspaces
        .workspaces
        .iter()
        .find(|w| Some(w.id.clone()) == workspaces.active_id)
    {
        // Convert LayoutMode enum to string
        let mode_str = match active_workspace.layout.mode {
            crate::services::workspace_service::LayoutMode::Single => "single",
            crate::services::workspace_service::LayoutMode::OneOne => "1:1",
            crate::services::workspace_service::LayoutMode::TwoOne => "2:1",
            crate::services::workspace_service::LayoutMode::OneTwo => "1:2",
            crate::services::workspace_service::LayoutMode::TwoByTwo => "2x2",
        };
        return Ok(mode_str.to_string());
    }

    // Default to single if no active workspace
    Ok("single".to_string())
}

#[tauri::command]
pub async fn set_workspace_layout(
    workspace_state: State<'_, crate::commands::workspace::WorkspaceState>,
    mode: String,
) -> Result<(), String> {
    let service_guard = workspace_state.0.lock().map_err(|e| e.to_string())?;

    // Get active workspace ID
    let workspaces = service_guard.list()?;
    if let Some(active_id) = &workspaces.active_id {
        // Set layout (convert string to LayoutMode)
        let layout_mode: crate::services::workspace_service::LayoutMode = match mode.as_str() {
            "single" => crate::services::workspace_service::LayoutMode::Single,
            "1:1" => crate::services::workspace_service::LayoutMode::OneOne,
            "2:1" => crate::services::workspace_service::LayoutMode::TwoOne,
            "1:2" => crate::services::workspace_service::LayoutMode::OneTwo,
            "2x2" => crate::services::workspace_service::LayoutMode::TwoByTwo,
            _ => return Err(format!("Invalid layout mode: {}", mode)),
        };
        service_guard.set_layout(active_id.clone(), layout_mode)?;
        return Ok(());
    }

    Err("No active workspace".to_string())
}
