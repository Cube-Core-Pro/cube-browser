// CUBE Nexum - Extensions Manager Commands
// 40 Tauri commands for extension management

use tauri::State;
use crate::services::browser_extensions::{
    ExtensionsManagerService, Extension, ExtensionSettings, ExtensionStats,
    ExtensionPermission, ExtensionSource, ExtensionStatus, InstallResult,
    ExtensionUpdateInfo
};

// ==================== Settings Commands ====================

#[tauri::command]
pub fn extensions_get_settings(
    service: State<'_, ExtensionsManagerService>
) -> Result<ExtensionSettings, String> {
    Ok(service.get_settings())
}

#[tauri::command]
pub fn extensions_update_settings(
    settings: ExtensionSettings,
    service: State<'_, ExtensionsManagerService>
) -> Result<(), String> {
    service.update_settings(settings)
}

#[tauri::command]
pub fn extensions_toggle_developer_mode(
    service: State<'_, ExtensionsManagerService>
) -> Result<bool, String> {
    service.toggle_developer_mode()
}

// ==================== Installation Commands ====================

#[tauri::command]
pub fn extensions_install(
    id: String,
    name: String,
    source: ExtensionSource,
    service: State<'_, ExtensionsManagerService>
) -> Result<InstallResult, String> {
    service.install_extension(id, name, source)
}

#[tauri::command]
pub fn extensions_install_from_store(
    store_url: String,
    service: State<'_, ExtensionsManagerService>
) -> Result<InstallResult, String> {
    // Extract extension ID from Chrome Web Store URL
    // Format: https://chrome.google.com/webstore/detail/extension-name/extension_id
    let id = store_url.split('/').last()
        .map(|s| s.split('?').next().unwrap_or(s))
        .unwrap_or("")
        .to_string();
    
    if id.is_empty() || id.len() != 32 {
        return Ok(InstallResult {
            success: false,
            extension_id: None,
            error_message: Some("Invalid Chrome Web Store URL".to_string()),
            new_permissions: Vec::new(),
        });
    }
    
    // Extract name from URL (simplified)
    let name = store_url.split('/').nth_back(1)
        .map(|s| s.replace("-", " "))
        .unwrap_or_else(|| "Extension".to_string());
    
    service.install_extension(id, name, ExtensionSource::ChromeWebStore)
}

#[tauri::command]
pub fn extensions_uninstall(
    id: String,
    service: State<'_, ExtensionsManagerService>
) -> Result<(), String> {
    service.uninstall_extension(&id)
}

// ==================== Enable/Disable Commands ====================

#[tauri::command]
pub fn extensions_enable(
    id: String,
    service: State<'_, ExtensionsManagerService>
) -> Result<(), String> {
    service.enable_extension(&id)
}

#[tauri::command]
pub fn extensions_disable(
    id: String,
    service: State<'_, ExtensionsManagerService>
) -> Result<(), String> {
    service.disable_extension(&id)
}

#[tauri::command]
pub fn extensions_toggle(
    id: String,
    service: State<'_, ExtensionsManagerService>
) -> Result<ExtensionStatus, String> {
    service.toggle_extension(&id)
}

// ==================== Query Commands ====================

#[tauri::command]
pub fn extensions_get(
    id: String,
    service: State<'_, ExtensionsManagerService>
) -> Result<Option<Extension>, String> {
    Ok(service.get_extension(&id))
}

#[tauri::command]
pub fn extensions_get_all(
    service: State<'_, ExtensionsManagerService>
) -> Result<Vec<Extension>, String> {
    Ok(service.get_all_extensions())
}

#[tauri::command]
pub fn extensions_get_enabled(
    service: State<'_, ExtensionsManagerService>
) -> Result<Vec<Extension>, String> {
    Ok(service.get_enabled_extensions())
}

#[tauri::command]
pub fn extensions_get_disabled(
    service: State<'_, ExtensionsManagerService>
) -> Result<Vec<Extension>, String> {
    Ok(service.get_disabled_extensions())
}

#[tauri::command]
pub fn extensions_get_recommended(
    service: State<'_, ExtensionsManagerService>
) -> Result<Vec<Extension>, String> {
    Ok(service.get_recommended_extensions())
}

#[tauri::command]
pub fn extensions_search(
    query: String,
    service: State<'_, ExtensionsManagerService>
) -> Result<Vec<Extension>, String> {
    Ok(service.search_extensions(&query))
}

// ==================== Permissions Commands ====================

#[tauri::command]
pub fn extensions_get_permissions(
    id: String,
    service: State<'_, ExtensionsManagerService>
) -> Result<Vec<ExtensionPermission>, String> {
    service.get_extension_permissions(&id)
}

#[tauri::command]
pub fn extensions_grant_permission(
    id: String,
    permission: ExtensionPermission,
    service: State<'_, ExtensionsManagerService>
) -> Result<(), String> {
    service.grant_optional_permission(&id, permission)
}

#[tauri::command]
pub fn extensions_revoke_permission(
    id: String,
    permission: ExtensionPermission,
    service: State<'_, ExtensionsManagerService>
) -> Result<(), String> {
    service.revoke_optional_permission(&id, &permission)
}

#[tauri::command]
pub fn extensions_set_incognito_access(
    id: String,
    allow: bool,
    service: State<'_, ExtensionsManagerService>
) -> Result<(), String> {
    service.set_incognito_access(&id, allow)
}

#[tauri::command]
pub fn extensions_set_file_access(
    id: String,
    allow: bool,
    service: State<'_, ExtensionsManagerService>
) -> Result<(), String> {
    service.set_file_access(&id, allow)
}

// ==================== Pin Commands ====================

#[tauri::command]
pub fn extensions_toggle_pin(
    id: String,
    service: State<'_, ExtensionsManagerService>
) -> Result<bool, String> {
    service.toggle_pin(&id)
}

#[tauri::command]
pub fn extensions_get_pinned(
    service: State<'_, ExtensionsManagerService>
) -> Result<Vec<Extension>, String> {
    Ok(service.get_pinned_extensions())
}

// ==================== Update Commands ====================

#[tauri::command]
pub fn extensions_check_updates(
    service: State<'_, ExtensionsManagerService>
) -> Result<Vec<ExtensionUpdateInfo>, String> {
    Ok(service.check_for_updates())
}

#[tauri::command]
pub fn extensions_update(
    id: String,
    service: State<'_, ExtensionsManagerService>
) -> Result<(), String> {
    service.update_extension(&id)
}

#[tauri::command]
pub fn extensions_update_all(
    service: State<'_, ExtensionsManagerService>
) -> Result<u32, String> {
    Ok(service.update_all_extensions())
}

// ==================== Stats Commands ====================

#[tauri::command]
pub fn extensions_get_stats(
    service: State<'_, ExtensionsManagerService>
) -> Result<ExtensionStats, String> {
    Ok(service.get_stats())
}

#[tauri::command]
pub fn extensions_get_count(
    service: State<'_, ExtensionsManagerService>
) -> Result<u32, String> {
    Ok(service.get_stats().total_extensions)
}

#[tauri::command]
pub fn extensions_get_enabled_count(
    service: State<'_, ExtensionsManagerService>
) -> Result<u32, String> {
    Ok(service.get_stats().enabled_count)
}

// ==================== Import/Export Commands ====================

#[tauri::command]
pub fn extensions_export(
    service: State<'_, ExtensionsManagerService>
) -> Result<String, String> {
    service.export_extensions()
}

#[tauri::command]
pub fn extensions_import(
    json: String,
    service: State<'_, ExtensionsManagerService>
) -> Result<u32, String> {
    service.import_extensions(&json)
}

// ==================== Utility Commands ====================

#[tauri::command]
pub fn extensions_get_list(
    service: State<'_, ExtensionsManagerService>
) -> Result<Vec<String>, String> {
    Ok(service.get_extension_list())
}

// ==================== Batch Commands ====================

#[tauri::command]
pub fn extensions_batch_enable(
    ids: Vec<String>,
    service: State<'_, ExtensionsManagerService>
) -> Result<u32, String> {
    let mut enabled = 0;
    for id in ids {
        if service.enable_extension(&id).is_ok() {
            enabled += 1;
        }
    }
    Ok(enabled)
}

#[tauri::command]
pub fn extensions_batch_disable(
    ids: Vec<String>,
    service: State<'_, ExtensionsManagerService>
) -> Result<u32, String> {
    let mut disabled = 0;
    for id in ids {
        if service.disable_extension(&id).is_ok() {
            disabled += 1;
        }
    }
    Ok(disabled)
}

#[tauri::command]
pub fn extensions_batch_uninstall(
    ids: Vec<String>,
    service: State<'_, ExtensionsManagerService>
) -> Result<u32, String> {
    let mut uninstalled = 0;
    for id in ids {
        if service.uninstall_extension(&id).is_ok() {
            uninstalled += 1;
        }
    }
    Ok(uninstalled)
}

// ==================== Chrome Web Store Integration ====================

#[tauri::command]
pub async fn extensions_search_store(
    _query: String
) -> Result<Vec<Extension>, String> {
    // In production, this would query the Chrome Web Store API
    // For now, return empty results
    Ok(Vec::new())
}

#[tauri::command]
pub async fn extensions_get_store_details(
    _extension_id: String
) -> Result<Option<Extension>, String> {
    // In production, this would fetch details from Chrome Web Store
    Ok(None)
}
