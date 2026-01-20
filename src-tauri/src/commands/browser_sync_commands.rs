// CUBE Nexum - Sync Service Commands
// 50 Tauri commands for cross-device synchronization

use tauri::State;
use crate::services::browser_sync::{
    SyncService, SyncSettings, SyncStatus, SyncDataType, SyncDevice,
    SyncAccount, SyncItem, SyncConflict, SyncHistory, SyncStats,
    EncryptionKey, ConflictResolution, SyncExportData,
};
use std::collections::HashMap;

// ==================== Settings Commands ====================

#[tauri::command]
pub fn sync_get_settings(service: State<SyncService>) -> SyncSettings {
    service.get_settings()
}

#[tauri::command]
pub fn sync_update_settings(
    service: State<SyncService>,
    settings: SyncSettings,
) -> Result<(), String> {
    service.update_settings(settings)
}

#[tauri::command]
pub fn sync_toggle(
    service: State<SyncService>,
    enabled: bool,
) -> Result<(), String> {
    service.toggle_sync(enabled)
}

#[tauri::command]
pub fn sync_set_data_type(
    service: State<SyncService>,
    data_type: SyncDataType,
    enabled: bool,
) -> Result<(), String> {
    service.set_sync_data_type(data_type, enabled)
}

// ==================== Status Commands ====================

#[tauri::command]
pub fn sync_get_status(service: State<SyncService>) -> SyncStatus {
    service.get_status()
}

#[tauri::command]
pub fn sync_is_syncing(service: State<SyncService>) -> bool {
    service.is_syncing()
}

// ==================== Account Commands ====================

#[tauri::command]
pub fn sync_login(
    service: State<SyncService>,
    email: String,
    user_id: String,
) -> Result<SyncAccount, String> {
    service.login(email, user_id)
}

#[tauri::command]
pub fn sync_logout(service: State<SyncService>) -> Result<(), String> {
    service.logout()
}

#[tauri::command]
pub fn sync_get_account(service: State<SyncService>) -> Option<SyncAccount> {
    service.get_account()
}

#[tauri::command]
pub fn sync_is_logged_in(service: State<SyncService>) -> bool {
    service.is_logged_in()
}

// ==================== Device Commands ====================

#[tauri::command]
pub fn sync_get_devices(service: State<SyncService>) -> Vec<SyncDevice> {
    service.get_devices()
}

#[tauri::command]
pub fn sync_get_current_device(service: State<SyncService>) -> Option<SyncDevice> {
    service.get_current_device()
}

#[tauri::command]
pub fn sync_get_device(
    service: State<SyncService>,
    device_id: String,
) -> Option<SyncDevice> {
    service.get_device(&device_id)
}

#[tauri::command]
pub fn sync_rename_device(
    service: State<SyncService>,
    device_id: String,
    new_name: String,
) -> Result<(), String> {
    service.rename_device(&device_id, new_name)
}

#[tauri::command]
pub fn sync_remove_device(
    service: State<SyncService>,
    device_id: String,
) -> Result<(), String> {
    service.remove_device(&device_id)
}

#[tauri::command]
pub fn sync_toggle_device(
    service: State<SyncService>,
    device_id: String,
    enabled: bool,
) -> Result<(), String> {
    service.toggle_device_sync(&device_id, enabled)
}

// ==================== Sync Operations Commands ====================

#[tauri::command]
pub fn sync_queue_item(
    service: State<SyncService>,
    data_type: SyncDataType,
    data: serde_json::Value,
) -> Result<String, String> {
    service.queue_sync_item(data_type, data)
}

#[tauri::command]
pub fn sync_get_queue(service: State<SyncService>) -> Vec<SyncItem> {
    service.get_sync_queue()
}

#[tauri::command]
pub fn sync_clear_queue(service: State<SyncService>) {
    service.clear_sync_queue();
}

#[tauri::command]
pub fn sync_start(service: State<SyncService>) -> Result<String, String> {
    service.start_sync()
}

#[tauri::command]
pub fn sync_complete(
    service: State<SyncService>,
    history_id: String,
    success: bool,
    items_up: u32,
    items_down: u32,
    bytes_up: u64,
    bytes_down: u64,
) -> Result<(), String> {
    service.complete_sync(&history_id, success, items_up, items_down, bytes_up, bytes_down)
}

#[tauri::command]
pub fn sync_cancel(
    service: State<SyncService>,
    history_id: String,
) -> Result<(), String> {
    service.cancel_sync(&history_id)
}

#[tauri::command]
pub fn sync_data_type(
    service: State<SyncService>,
    data_type: SyncDataType,
) -> Result<String, String> {
    service.sync_data_type(data_type)
}

// ==================== Conflict Commands ====================

#[tauri::command]
pub fn sync_get_conflicts(service: State<SyncService>) -> Vec<SyncConflict> {
    service.get_conflicts()
}

#[tauri::command]
pub fn sync_get_unresolved_conflicts(service: State<SyncService>) -> Vec<SyncConflict> {
    service.get_unresolved_conflicts()
}

#[tauri::command]
pub fn sync_resolve_conflict(
    service: State<SyncService>,
    conflict_id: String,
    resolution: ConflictResolution,
) -> Result<(), String> {
    service.resolve_conflict(&conflict_id, resolution)
}

#[tauri::command]
pub fn sync_resolve_with_local(
    service: State<SyncService>,
    conflict_id: String,
) -> Result<(), String> {
    service.resolve_conflict_with_local(&conflict_id)
}

#[tauri::command]
pub fn sync_resolve_with_server(
    service: State<SyncService>,
    conflict_id: String,
) -> Result<(), String> {
    service.resolve_conflict_with_server(&conflict_id)
}

// ==================== History Commands ====================

#[tauri::command]
pub fn sync_get_history(
    service: State<SyncService>,
    limit: Option<usize>,
) -> Vec<SyncHistory> {
    service.get_sync_history(limit)
}

#[tauri::command]
pub fn sync_get_last(service: State<SyncService>) -> Option<SyncHistory> {
    service.get_last_sync()
}

#[tauri::command]
pub fn sync_clear_history(service: State<SyncService>) {
    service.clear_sync_history();
}

// ==================== Encryption Commands ====================

#[tauri::command]
pub fn sync_generate_key(service: State<SyncService>) -> Result<EncryptionKey, String> {
    service.generate_encryption_key()
}

#[tauri::command]
pub fn sync_get_keys(service: State<SyncService>) -> Vec<EncryptionKey> {
    service.get_encryption_keys()
}

#[tauri::command]
pub fn sync_get_active_key(service: State<SyncService>) -> Option<EncryptionKey> {
    service.get_active_key()
}

#[tauri::command]
pub fn sync_rotate_key(service: State<SyncService>) -> Result<EncryptionKey, String> {
    service.rotate_encryption_key()
}

#[tauri::command]
pub fn sync_create_recovery_key(service: State<SyncService>) -> Result<EncryptionKey, String> {
    service.create_recovery_key()
}

// ==================== Statistics Commands ====================

#[tauri::command]
pub fn sync_get_stats(service: State<SyncService>) -> SyncStats {
    service.get_stats()
}

#[tauri::command]
pub fn sync_get_storage_usage(service: State<SyncService>) -> (u64, u64) {
    service.get_storage_usage()
}

#[tauri::command]
pub fn sync_reset_stats(service: State<SyncService>) {
    service.reset_stats();
}

// ==================== Export/Import Commands ====================

#[tauri::command]
pub fn sync_export(service: State<SyncService>) -> Result<SyncExportData, String> {
    service.export_sync_data()
}

#[tauri::command]
pub fn sync_import(
    service: State<SyncService>,
    data: SyncExportData,
) -> Result<(), String> {
    service.import_sync_data(data)
}
