use crate::services::chrome_extension_bridge::ChromeExtensionBridgeState;
use serde_json::Value;
use tauri::State;

/// Relay chrome.runtime.sendMessage style payloads from injected scripts into the Rust backend.
#[tauri::command]
pub fn chrome_extension_runtime_send_message(
    state: State<'_, ChromeExtensionBridgeState>,
    message: Value,
) -> Result<Value, String> {
    state.runtime_send_message(message)
}

/// Mirror chrome.storage.local.get API signature.
#[tauri::command]
pub fn chrome_extension_storage_get(
    state: State<'_, ChromeExtensionBridgeState>,
    query: Option<Value>,
) -> Result<Value, String> {
    state.storage_get(query)
}

/// Mirror chrome.storage.local.set API signature.
#[tauri::command]
pub fn chrome_extension_storage_set(
    state: State<'_, ChromeExtensionBridgeState>,
    items: Value,
) -> Result<Value, String> {
    state.storage_set(items)
}

/// Mirror chrome.storage.local.clear API signature.
#[tauri::command]
pub fn chrome_extension_storage_clear(
    state: State<'_, ChromeExtensionBridgeState>,
) -> Result<Value, String> {
    state.storage_clear()
}
