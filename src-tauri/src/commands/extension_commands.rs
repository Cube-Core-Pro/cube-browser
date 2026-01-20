// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 CHROME EXTENSION COMMANDS - Tauri Command Interface
// ═══════════════════════════════════════════════════════════════════════════════

use crate::services::chrome_extension_manager::{
    ChromeExtensionManager, ExtensionInfo, InstallOptions,
};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::State;

pub struct ExtensionManagerState {
    manager: Arc<Mutex<ChromeExtensionManager>>,
}

impl ExtensionManagerState {
    pub fn new(extensions_dir: PathBuf) -> Result<Self, String> {
        let manager = ChromeExtensionManager::new(extensions_dir).map_err(|e| e.to_string())?;

        Ok(Self {
            manager: Arc::new(Mutex::new(manager)),
        })
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSTALLATION COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

/// Install extension from unpacked directory
#[tauri::command]
pub async fn install_extension_unpacked(
    path: String,
    auto_enable: bool,
    state: State<'_, ExtensionManagerState>,
) -> Result<String, String> {
    let manager = state.manager.lock().map_err(|e| e.to_string())?;

    let options = InstallOptions {
        auto_enable,
        allow_incognito: false,
        allow_file_access: false,
    };

    manager
        .install_unpacked(&PathBuf::from(path), options)
        .map_err(|e| e.to_string())
}

/// Install extension from Chrome Web Store
#[tauri::command]
pub async fn install_extension_from_web_store(
    web_store_id: String,
    auto_enable: bool,
    state: State<'_, ExtensionManagerState>,
) -> Result<String, String> {
    let manager = state.manager.lock().map_err(|e| e.to_string())?;

    let options = InstallOptions {
        auto_enable,
        allow_incognito: false,
        allow_file_access: false,
    };

    manager
        .install_from_web_store(&web_store_id, options)
        .map_err(|e| e.to_string())
}

/// Install extension from CRX file
#[tauri::command]
pub async fn install_extension_from_crx(
    crx_path: String,
    auto_enable: bool,
    state: State<'_, ExtensionManagerState>,
) -> Result<String, String> {
    let manager = state.manager.lock().map_err(|e| e.to_string())?;

    let options = InstallOptions {
        auto_enable,
        allow_incognito: false,
        allow_file_access: false,
    };

    manager
        .install_from_crx(&PathBuf::from(crx_path), options)
        .map_err(|e| e.to_string())
}

// ═══════════════════════════════════════════════════════════════════════════════
// MANAGEMENT COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

/// Enable extension
#[tauri::command]
pub async fn enable_extension(
    extension_id: String,
    state: State<'_, ExtensionManagerState>,
) -> Result<(), String> {
    let manager = state.manager.lock().map_err(|e| e.to_string())?;
    manager
        .enable_extension(&extension_id)
        .map_err(|e| e.to_string())
}

/// Disable extension
#[tauri::command]
pub async fn disable_extension(
    extension_id: String,
    state: State<'_, ExtensionManagerState>,
) -> Result<(), String> {
    let manager = state.manager.lock().map_err(|e| e.to_string())?;
    manager
        .disable_extension(&extension_id)
        .map_err(|e| e.to_string())
}

/// Uninstall extension
#[tauri::command]
pub async fn uninstall_extension(
    extension_id: String,
    state: State<'_, ExtensionManagerState>,
) -> Result<(), String> {
    let manager = state.manager.lock().map_err(|e| e.to_string())?;
    manager
        .uninstall_extension(&extension_id)
        .map_err(|e| e.to_string())
}

/// Update extension
#[tauri::command]
pub async fn update_extension(
    extension_id: String,
    state: State<'_, ExtensionManagerState>,
) -> Result<(), String> {
    let manager = state.manager.lock().map_err(|e| e.to_string())?;
    manager
        .update_extension(&extension_id)
        .map_err(|e| e.to_string())
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUERY COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

/// Get extension info
#[tauri::command]
pub async fn get_extension_info(
    extension_id: String,
    state: State<'_, ExtensionManagerState>,
) -> Result<Option<ExtensionInfo>, String> {
    let manager = state.manager.lock().map_err(|e| e.to_string())?;
    Ok(manager.get_extension(&extension_id))
}

/// Get all installed extensions
#[tauri::command]
pub async fn get_all_extensions(
    state: State<'_, ExtensionManagerState>,
) -> Result<Vec<ExtensionInfo>, String> {
    let manager = state.manager.lock().map_err(|e| e.to_string())?;
    Ok(manager.get_all_extensions())
}

/// Get enabled extensions
#[tauri::command]
pub async fn get_enabled_extensions(
    state: State<'_, ExtensionManagerState>,
) -> Result<Vec<ExtensionInfo>, String> {
    let manager = state.manager.lock().map_err(|e| e.to_string())?;
    Ok(manager.get_enabled_extensions())
}
