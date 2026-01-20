// CUBE Nexum - Collections Commands
// Tauri command interfaces for Edge-style collections

use tauri::State;
use crate::services::browser_collections::{
    BrowserCollectionsService, Collection, CollectionSettings, CollectionItem,
    CollectionItemType, CollectionFolder, CollectionIcon, CollectionSearchResult,
    CollectionExport, ExportFormat, CollectionImport, ImportSource,
    CollectionStats, QuickSaveResult, CollectionUpdate, CollectionItemUpdate,
};

// ==================== Settings Commands ====================

#[tauri::command]
pub fn collections_get_settings(
    service: State<'_, BrowserCollectionsService>
) -> CollectionSettings {
    service.get_settings()
}

#[tauri::command]
pub fn collections_update_settings(
    service: State<'_, BrowserCollectionsService>,
    settings: CollectionSettings
) {
    service.update_settings(settings);
}

// ==================== Collection CRUD Commands ====================

#[tauri::command]
pub fn collections_create(
    service: State<'_, BrowserCollectionsService>,
    name: String,
    description: Option<String>
) -> Collection {
    service.create_collection(name, description)
}

#[tauri::command]
pub fn collections_get(
    service: State<'_, BrowserCollectionsService>,
    collection_id: String
) -> Option<Collection> {
    service.get_collection(&collection_id)
}

#[tauri::command]
pub fn collections_get_all(
    service: State<'_, BrowserCollectionsService>
) -> Vec<Collection> {
    service.get_all_collections()
}

#[tauri::command]
pub fn collections_get_recent(
    service: State<'_, BrowserCollectionsService>
) -> Option<Collection> {
    service.get_recent_collection()
}

#[tauri::command]
pub fn collections_update(
    service: State<'_, BrowserCollectionsService>,
    collection_id: String,
    updates: CollectionUpdate
) -> Result<Collection, String> {
    service.update_collection(&collection_id, updates)
}

#[tauri::command]
pub fn collections_delete(
    service: State<'_, BrowserCollectionsService>,
    collection_id: String
) -> Result<(), String> {
    service.delete_collection(&collection_id)
}

#[tauri::command]
pub fn collections_duplicate(
    service: State<'_, BrowserCollectionsService>,
    collection_id: String
) -> Result<Collection, String> {
    service.duplicate_collection(&collection_id)
}

// ==================== Item Commands ====================

#[tauri::command]
pub fn collections_add_item(
    service: State<'_, BrowserCollectionsService>,
    collection_id: String,
    item_type: CollectionItemType,
    title: String,
    url: Option<String>
) -> Result<CollectionItem, String> {
    service.add_item(&collection_id, item_type, title, url)
}

#[tauri::command]
pub fn collections_add_multiple_items(
    service: State<'_, BrowserCollectionsService>,
    collection_id: String,
    items: Vec<(CollectionItemType, String, Option<String>)>
) -> Result<Vec<CollectionItem>, String> {
    service.add_multiple_items(&collection_id, items)
}

#[tauri::command]
pub fn collections_update_item(
    service: State<'_, BrowserCollectionsService>,
    collection_id: String,
    item_id: String,
    updates: CollectionItemUpdate
) -> Result<CollectionItem, String> {
    service.update_item(&collection_id, &item_id, updates)
}

#[tauri::command]
pub fn collections_delete_item(
    service: State<'_, BrowserCollectionsService>,
    collection_id: String,
    item_id: String
) -> Result<(), String> {
    service.delete_item(&collection_id, &item_id)
}

#[tauri::command]
pub fn collections_move_item(
    service: State<'_, BrowserCollectionsService>,
    collection_id: String,
    item_id: String,
    new_position: u32
) -> Result<(), String> {
    service.move_item(&collection_id, &item_id, new_position)
}

#[tauri::command]
pub fn collections_move_item_to_collection(
    service: State<'_, BrowserCollectionsService>,
    source_id: String,
    item_id: String,
    target_id: String
) -> Result<CollectionItem, String> {
    service.move_item_to_collection(&source_id, &item_id, &target_id)
}

// ==================== Quick Save Commands ====================

#[tauri::command]
pub fn collections_quick_save_tab(
    service: State<'_, BrowserCollectionsService>,
    title: String,
    url: String
) -> Result<QuickSaveResult, String> {
    service.quick_save_tab(title, url)
}

#[tauri::command]
pub fn collections_quick_save_all_tabs(
    service: State<'_, BrowserCollectionsService>,
    tabs: Vec<(String, String)>
) -> Result<QuickSaveResult, String> {
    service.quick_save_all_tabs(tabs)
}

// ==================== Folder Commands ====================

#[tauri::command]
pub fn collections_create_folder(
    service: State<'_, BrowserCollectionsService>,
    name: String,
    parent_id: Option<String>
) -> CollectionFolder {
    service.create_folder(name, parent_id)
}

#[tauri::command]
pub fn collections_get_all_folders(
    service: State<'_, BrowserCollectionsService>
) -> Vec<CollectionFolder> {
    service.get_all_folders()
}

#[tauri::command]
pub fn collections_update_folder(
    service: State<'_, BrowserCollectionsService>,
    folder_id: String,
    name: Option<String>,
    icon: Option<CollectionIcon>,
    color: Option<String>
) -> Result<CollectionFolder, String> {
    service.update_folder(&folder_id, name, icon, color)
}

#[tauri::command]
pub fn collections_delete_folder(
    service: State<'_, BrowserCollectionsService>,
    folder_id: String,
    move_collections_to_root: bool
) -> Result<(), String> {
    service.delete_folder(&folder_id, move_collections_to_root)
}

#[tauri::command]
pub fn collections_add_to_folder(
    service: State<'_, BrowserCollectionsService>,
    collection_id: String,
    folder_id: String
) -> Result<(), String> {
    service.add_collection_to_folder(&collection_id, &folder_id)
}

// ==================== Search Commands ====================

#[tauri::command]
pub fn collections_search(
    service: State<'_, BrowserCollectionsService>,
    query: String
) -> Vec<CollectionSearchResult> {
    service.search(&query)
}

#[tauri::command]
pub fn collections_search_by_tag(
    service: State<'_, BrowserCollectionsService>,
    tag: String
) -> Vec<CollectionSearchResult> {
    service.search_by_tag(&tag)
}

// ==================== Export/Import Commands ====================

#[tauri::command]
pub fn collections_export(
    service: State<'_, BrowserCollectionsService>,
    collection_id: String,
    format: ExportFormat
) -> Result<CollectionExport, String> {
    service.export_collection(&collection_id, format)
}

#[tauri::command]
pub fn collections_import(
    service: State<'_, BrowserCollectionsService>,
    source: ImportSource,
    data: String
) -> Result<CollectionImport, String> {
    service.import_collection(source, &data)
}

// ==================== Sharing Commands ====================

#[tauri::command]
pub fn collections_share(
    service: State<'_, BrowserCollectionsService>,
    collection_id: String,
    password: Option<String>
) -> Result<String, String> {
    service.share_collection(&collection_id, password)
}

#[tauri::command]
pub fn collections_unshare(
    service: State<'_, BrowserCollectionsService>,
    collection_id: String
) -> Result<(), String> {
    service.unshare_collection(&collection_id)
}

// ==================== Statistics Commands ====================

#[tauri::command]
pub fn collections_get_stats(
    service: State<'_, BrowserCollectionsService>
) -> CollectionStats {
    service.get_stats()
}
