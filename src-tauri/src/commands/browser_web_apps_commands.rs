// CUBE Nexum - Web Apps Commands
// Tauri command interfaces for PWA management

use tauri::State;
use crate::services::browser_web_apps::{
    BrowserWebAppsService, WebApp, WebAppSettings, WebAppManifest,
    InstallableApp, WebAppUpdate, WebAppCategory, WebAppStats,
    WebAppUpdate_, DisplayMode, UpdateType,
};

// ==================== Settings Commands ====================

#[tauri::command]
pub fn web_apps_get_settings(
    service: State<'_, BrowserWebAppsService>
) -> WebAppSettings {
    service.get_settings()
}

#[tauri::command]
pub fn web_apps_update_settings(
    service: State<'_, BrowserWebAppsService>,
    settings: WebAppSettings
) {
    service.update_settings(settings);
}

// ==================== Installation Commands ====================

#[tauri::command]
pub fn web_apps_install(
    service: State<'_, BrowserWebAppsService>,
    manifest: WebAppManifest,
    url: String
) -> Result<WebApp, String> {
    service.install_app(manifest, &url)
}

#[tauri::command]
pub fn web_apps_check_installable(
    service: State<'_, BrowserWebAppsService>,
    url: String,
    has_manifest: bool,
    has_service_worker: bool,
    manifest: Option<WebAppManifest>
) -> InstallableApp {
    service.check_installable(&url, has_manifest, has_service_worker, manifest)
}

#[tauri::command]
pub fn web_apps_uninstall(
    service: State<'_, BrowserWebAppsService>,
    app_id: String
) -> Result<(), String> {
    service.uninstall_app(&app_id)
}

// ==================== App CRUD Commands ====================

#[tauri::command]
pub fn web_apps_get(
    service: State<'_, BrowserWebAppsService>,
    app_id: String
) -> Option<WebApp> {
    service.get_app(&app_id)
}

#[tauri::command]
pub fn web_apps_get_all(
    service: State<'_, BrowserWebAppsService>
) -> Vec<WebApp> {
    service.get_all_apps()
}

#[tauri::command]
pub fn web_apps_get_pinned(
    service: State<'_, BrowserWebAppsService>
) -> Vec<WebApp> {
    service.get_pinned_apps()
}

#[tauri::command]
pub fn web_apps_get_favorites(
    service: State<'_, BrowserWebAppsService>
) -> Vec<WebApp> {
    service.get_favorite_apps()
}

#[tauri::command]
pub fn web_apps_update(
    service: State<'_, BrowserWebAppsService>,
    app_id: String,
    updates: WebAppUpdate_
) -> Result<WebApp, String> {
    service.update_app(&app_id, updates)
}

// ==================== Launch Commands ====================

#[tauri::command]
pub fn web_apps_launch(
    service: State<'_, BrowserWebAppsService>,
    app_id: String
) -> Result<WebApp, String> {
    service.launch_app(&app_id)
}

#[tauri::command]
pub fn web_apps_launch_shortcut(
    service: State<'_, BrowserWebAppsService>,
    app_id: String,
    shortcut_index: usize
) -> Result<String, String> {
    service.launch_shortcut(&app_id, shortcut_index)
}

// ==================== Category Commands ====================

#[tauri::command]
pub fn web_apps_get_categories(
    service: State<'_, BrowserWebAppsService>
) -> Vec<WebAppCategory> {
    service.get_categories()
}

#[tauri::command]
pub fn web_apps_get_by_category(
    service: State<'_, BrowserWebAppsService>,
    category_id: String
) -> Vec<WebApp> {
    service.get_apps_by_category(&category_id)
}

#[tauri::command]
pub fn web_apps_add_to_category(
    service: State<'_, BrowserWebAppsService>,
    app_id: String,
    category_id: String
) {
    service.add_to_category(&app_id, &category_id);
}

#[tauri::command]
pub fn web_apps_remove_from_category(
    service: State<'_, BrowserWebAppsService>,
    app_id: String,
    category_id: String
) {
    service.remove_from_category(&app_id, &category_id);
}

#[tauri::command]
pub fn web_apps_create_category(
    service: State<'_, BrowserWebAppsService>,
    name: String,
    icon: String
) -> WebAppCategory {
    service.create_category(name, icon)
}

// ==================== Update Commands ====================

#[tauri::command]
pub fn web_apps_check_for_updates(
    service: State<'_, BrowserWebAppsService>
) -> Vec<WebAppUpdate> {
    service.check_for_updates()
}

#[tauri::command]
pub fn web_apps_register_update(
    service: State<'_, BrowserWebAppsService>,
    app_id: String,
    new_version: Option<String>,
    changes: Vec<String>,
    update_type: UpdateType
) {
    service.register_update(&app_id, new_version, changes, update_type);
}

#[tauri::command]
pub fn web_apps_apply_update(
    service: State<'_, BrowserWebAppsService>,
    app_id: String,
    new_manifest: WebAppManifest
) -> Result<WebApp, String> {
    service.apply_update(&app_id, new_manifest)
}

#[tauri::command]
pub fn web_apps_dismiss_update(
    service: State<'_, BrowserWebAppsService>,
    app_id: String
) {
    service.dismiss_update(&app_id);
}

// ==================== Badge & Notification Commands ====================

#[tauri::command]
pub fn web_apps_set_badge(
    service: State<'_, BrowserWebAppsService>,
    app_id: String,
    count: u32
) -> Result<(), String> {
    service.set_badge(&app_id, count)
}

#[tauri::command]
pub fn web_apps_clear_badge(
    service: State<'_, BrowserWebAppsService>,
    app_id: String
) -> Result<(), String> {
    service.clear_badge(&app_id)
}

#[tauri::command]
pub fn web_apps_toggle_notifications(
    service: State<'_, BrowserWebAppsService>,
    app_id: String
) -> Result<bool, String> {
    service.toggle_notifications(&app_id)
}

// ==================== Search Commands ====================

#[tauri::command]
pub fn web_apps_search(
    service: State<'_, BrowserWebAppsService>,
    query: String
) -> Vec<WebApp> {
    service.search(&query)
}

// ==================== Statistics Commands ====================

#[tauri::command]
pub fn web_apps_get_stats(
    service: State<'_, BrowserWebAppsService>
) -> WebAppStats {
    service.get_stats()
}
