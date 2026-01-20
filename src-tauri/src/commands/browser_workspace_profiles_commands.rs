// CUBE Nexum - Workspace Profiles Commands
// Tauri commands for browser profiles management

use tauri::State;
use crate::services::browser_workspace_profiles::{
    BrowserWorkspaceProfilesService, ProfileSettings, WorkspaceProfile,
    ProfileUpdate, ProfileExport, ProfileTemplate, ProfileStats,
    ProfileIcon, ProfilePrivacy, DataIsolation, ProxyConfig,
};

// ==================== Settings Commands ====================

#[tauri::command]
pub fn workspace_profiles_get_settings(
    service: State<'_, BrowserWorkspaceProfilesService>
) -> ProfileSettings {
    service.get_settings()
}

#[tauri::command]
pub fn workspace_profiles_update_settings(
    service: State<'_, BrowserWorkspaceProfilesService>,
    settings: ProfileSettings
) {
    service.update_settings(settings);
}

// ==================== Profile Management Commands ====================

#[tauri::command]
pub fn workspace_profiles_create(
    service: State<'_, BrowserWorkspaceProfilesService>,
    name: String,
    template_id: Option<String>
) -> Result<WorkspaceProfile, String> {
    service.create_profile(name, template_id)
}

#[tauri::command]
pub fn workspace_profiles_get(
    service: State<'_, BrowserWorkspaceProfilesService>,
    profile_id: String
) -> Option<WorkspaceProfile> {
    service.get_profile(&profile_id)
}

#[tauri::command]
pub fn workspace_profiles_get_all(
    service: State<'_, BrowserWorkspaceProfilesService>
) -> Vec<WorkspaceProfile> {
    service.get_all_profiles()
}

#[tauri::command]
pub fn workspace_profiles_get_active(
    service: State<'_, BrowserWorkspaceProfilesService>
) -> Option<WorkspaceProfile> {
    service.get_active_profile()
}

#[tauri::command]
pub fn workspace_profiles_update(
    service: State<'_, BrowserWorkspaceProfilesService>,
    profile_id: String,
    updates: ProfileUpdate
) -> Result<WorkspaceProfile, String> {
    service.update_profile(&profile_id, updates)
}

#[tauri::command]
pub fn workspace_profiles_delete(
    service: State<'_, BrowserWorkspaceProfilesService>,
    profile_id: String
) -> Result<(), String> {
    service.delete_profile(&profile_id)
}

#[tauri::command]
pub fn workspace_profiles_switch(
    service: State<'_, BrowserWorkspaceProfilesService>,
    profile_id: String
) -> Result<WorkspaceProfile, String> {
    service.switch_profile(&profile_id)
}

#[tauri::command]
pub fn workspace_profiles_lock(
    service: State<'_, BrowserWorkspaceProfilesService>,
    profile_id: String,
    password: String
) -> Result<(), String> {
    service.lock_profile(&profile_id, &password)
}

#[tauri::command]
pub fn workspace_profiles_unlock(
    service: State<'_, BrowserWorkspaceProfilesService>,
    profile_id: String,
    password: String
) -> Result<(), String> {
    service.unlock_profile(&profile_id, &password)
}

// ==================== Template Commands ====================

#[tauri::command]
pub fn workspace_profiles_get_template(
    service: State<'_, BrowserWorkspaceProfilesService>,
    template_id: String
) -> Option<ProfileTemplate> {
    service.get_template(&template_id)
}

#[tauri::command]
pub fn workspace_profiles_get_all_templates(
    service: State<'_, BrowserWorkspaceProfilesService>
) -> Vec<ProfileTemplate> {
    service.get_all_templates()
}

#[tauri::command]
pub fn workspace_profiles_create_template(
    service: State<'_, BrowserWorkspaceProfilesService>,
    name: String,
    from_profile_id: String
) -> Result<ProfileTemplate, String> {
    service.create_custom_template(name, &from_profile_id)
}

// ==================== Export/Import Commands ====================

#[tauri::command]
pub fn workspace_profiles_export(
    service: State<'_, BrowserWorkspaceProfilesService>,
    profile_id: String
) -> Result<ProfileExport, String> {
    service.export_profile(&profile_id)
}

#[tauri::command]
pub fn workspace_profiles_import(
    service: State<'_, BrowserWorkspaceProfilesService>,
    export: ProfileExport
) -> Result<WorkspaceProfile, String> {
    service.import_profile(export)
}

// ==================== Stats Commands ====================

#[tauri::command]
pub fn workspace_profiles_update_stats(
    service: State<'_, BrowserWorkspaceProfilesService>,
    profile_id: String,
    sites_visited: u64,
    searches: u64,
    downloads: u64,
    time_minutes: u64
) {
    service.update_profile_stats(&profile_id, sites_visited, searches, downloads, time_minutes);
}

#[tauri::command]
pub fn workspace_profiles_get_stats(
    service: State<'_, BrowserWorkspaceProfilesService>,
    profile_id: String
) -> Option<ProfileStats> {
    service.get_profile_stats(&profile_id)
}
