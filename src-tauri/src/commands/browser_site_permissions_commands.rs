// CUBE Nexum - Site Permissions Commands
// Tauri commands for site permissions service

use tauri::State;
use crate::services::browser_site_permissions::{
    BrowserSitePermissionsService, PermissionsSettings, SitePermissions, PermissionType,
    PermissionValue, ContentType, ContentValue, StorageAccess, PermissionRequest,
    PermissionGroup, PermissionAuditLog, PermissionStats,
};

// ==================== Settings Commands ====================

#[tauri::command]
pub fn get_permissions_settings(
    service: State<'_, BrowserSitePermissionsService>
) -> PermissionsSettings {
    service.get_settings()
}

#[tauri::command]
pub fn update_permissions_settings(
    service: State<'_, BrowserSitePermissionsService>,
    settings: PermissionsSettings
) {
    service.update_settings(settings);
}

// ==================== Site Permission Commands ====================

#[tauri::command]
pub fn get_site_permissions(
    service: State<'_, BrowserSitePermissionsService>,
    origin: String
) -> Option<SitePermissions> {
    service.get_site_permissions(&origin)
}

#[tauri::command]
pub fn get_all_site_permissions(
    service: State<'_, BrowserSitePermissionsService>
) -> Vec<SitePermissions> {
    service.get_all_site_permissions()
}

#[tauri::command]
pub fn set_site_permission(
    service: State<'_, BrowserSitePermissionsService>,
    origin: String,
    permission_type: PermissionType,
    value: PermissionValue
) -> SitePermissions {
    service.set_permission(&origin, permission_type, value)
}

#[tauri::command]
pub fn revoke_site_permission(
    service: State<'_, BrowserSitePermissionsService>,
    origin: String,
    permission_type: PermissionType
) -> Result<(), String> {
    service.revoke_permission(&origin, permission_type)
}

#[tauri::command]
pub fn reset_site_permissions(
    service: State<'_, BrowserSitePermissionsService>,
    origin: String
) -> Result<(), String> {
    service.reset_site_permissions(&origin)
}

#[tauri::command]
pub fn set_site_content_setting(
    service: State<'_, BrowserSitePermissionsService>,
    origin: String,
    content_type: ContentType,
    value: ContentValue
) -> SitePermissions {
    service.set_content_setting(&origin, content_type, value)
}

#[tauri::command]
pub fn set_site_storage_access(
    service: State<'_, BrowserSitePermissionsService>,
    origin: String,
    storage_access: StorageAccess
) -> Result<SitePermissions, String> {
    service.set_storage_access(&origin, storage_access)
}

// ==================== Permission Request Commands ====================

#[tauri::command]
pub fn create_permission_request(
    service: State<'_, BrowserSitePermissionsService>,
    origin: String,
    permission_type: PermissionType,
    frame_url: Option<String>,
    user_gesture: bool
) -> PermissionRequest {
    service.create_permission_request(&origin, permission_type, frame_url, user_gesture)
}

#[tauri::command]
pub fn get_pending_permission_requests(
    service: State<'_, BrowserSitePermissionsService>
) -> Vec<PermissionRequest> {
    service.get_pending_requests()
}

#[tauri::command]
pub fn respond_to_permission_request(
    service: State<'_, BrowserSitePermissionsService>,
    request_id: String,
    grant: bool
) -> Result<PermissionRequest, String> {
    service.respond_to_request(&request_id, grant)
}

#[tauri::command]
pub fn dismiss_permission_request(
    service: State<'_, BrowserSitePermissionsService>,
    request_id: String
) -> Result<(), String> {
    service.dismiss_request(&request_id)
}

// ==================== Permission Group Commands ====================

#[tauri::command]
pub fn create_permission_group(
    service: State<'_, BrowserSitePermissionsService>,
    name: String,
    description: String
) -> PermissionGroup {
    service.create_permission_group(name, description)
}

#[tauri::command]
pub fn get_permission_group(
    service: State<'_, BrowserSitePermissionsService>,
    group_id: String
) -> Option<PermissionGroup> {
    service.get_permission_group(&group_id)
}

#[tauri::command]
pub fn get_all_permission_groups(
    service: State<'_, BrowserSitePermissionsService>
) -> Vec<PermissionGroup> {
    service.get_all_permission_groups()
}

#[tauri::command]
pub fn add_site_to_permission_group(
    service: State<'_, BrowserSitePermissionsService>,
    group_id: String,
    origin: String
) -> Result<PermissionGroup, String> {
    service.add_site_to_group(&group_id, &origin)
}

#[tauri::command]
pub fn remove_site_from_permission_group(
    service: State<'_, BrowserSitePermissionsService>,
    group_id: String,
    origin: String
) -> Result<PermissionGroup, String> {
    service.remove_site_from_group(&group_id, &origin)
}

#[tauri::command]
pub fn set_group_permission(
    service: State<'_, BrowserSitePermissionsService>,
    group_id: String,
    permission_type: PermissionType,
    value: PermissionValue
) -> Result<PermissionGroup, String> {
    service.set_group_permission(&group_id, permission_type, value)
}

#[tauri::command]
pub fn delete_permission_group(
    service: State<'_, BrowserSitePermissionsService>,
    group_id: String
) -> Result<(), String> {
    service.delete_permission_group(&group_id)
}

// ==================== Audit Log Commands ====================

#[tauri::command]
pub fn get_permission_audit_log(
    service: State<'_, BrowserSitePermissionsService>,
    limit: Option<u32>,
    origin_filter: Option<String>
) -> Vec<PermissionAuditLog> {
    service.get_audit_log(limit, origin_filter.as_deref())
}

// ==================== Auto-Revoke Commands ====================

#[tauri::command]
pub fn auto_revoke_unused_permissions(
    service: State<'_, BrowserSitePermissionsService>
) -> u32 {
    service.auto_revoke_unused()
}

// ==================== Stats Commands ====================

#[tauri::command]
pub fn get_permissions_stats(
    service: State<'_, BrowserSitePermissionsService>
) -> PermissionStats {
    service.get_stats()
}
