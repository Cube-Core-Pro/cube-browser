// CUBE Nexum - Speed Dial Commands
// Tauri commands for the speed dial system

use tauri::State;
use super::super::services::browser_speed_dial::{
    BrowserSpeedDialService, SpeedDialEntry, SpeedDialFolder,
    SpeedDialSettings, SpeedDialStats, SpeedDialSuggestion,
    SpeedDialUpdate, FolderUpdate, SpeedDialSize, ThumbnailType,
    BackgroundType,
};

// ==================== Settings Commands ====================

#[tauri::command]
pub fn speed_dial_get_settings(
    service: State<'_, BrowserSpeedDialService>
) -> SpeedDialSettings {
    service.get_settings()
}

#[tauri::command]
pub fn speed_dial_update_settings(
    settings: SpeedDialSettings,
    service: State<'_, BrowserSpeedDialService>
) -> Result<(), String> {
    service.update_settings(settings);
    Ok(())
}

#[tauri::command]
pub fn speed_dial_set_grid_size(
    columns: u32,
    rows: u32,
    service: State<'_, BrowserSpeedDialService>
) -> Result<(), String> {
    service.set_grid_size(columns, rows);
    Ok(())
}

#[tauri::command]
pub fn speed_dial_set_background(
    bg_type: BackgroundType,
    value: String,
    service: State<'_, BrowserSpeedDialService>
) -> Result<(), String> {
    service.set_background(bg_type, value);
    Ok(())
}

// ==================== Entry Commands ====================

#[tauri::command]
pub fn speed_dial_get_all_entries(
    service: State<'_, BrowserSpeedDialService>
) -> Vec<SpeedDialEntry> {
    service.get_all_entries()
}

#[tauri::command]
pub fn speed_dial_get_entry(
    entry_id: String,
    service: State<'_, BrowserSpeedDialService>
) -> Option<SpeedDialEntry> {
    service.get_entry(&entry_id)
}

#[tauri::command]
pub fn speed_dial_get_entries_in_folder(
    folder_id: Option<String>,
    service: State<'_, BrowserSpeedDialService>
) -> Vec<SpeedDialEntry> {
    service.get_entries_in_folder(folder_id.as_deref())
}

#[tauri::command]
pub fn speed_dial_create_entry(
    title: String,
    url: String,
    service: State<'_, BrowserSpeedDialService>
) -> Result<SpeedDialEntry, String> {
    service.create_entry(title, url)
}

#[tauri::command]
pub fn speed_dial_update_entry(
    entry_id: String,
    updates: SpeedDialUpdate,
    service: State<'_, BrowserSpeedDialService>
) -> Result<SpeedDialEntry, String> {
    service.update_entry(&entry_id, updates)
}

#[tauri::command]
pub fn speed_dial_delete_entry(
    entry_id: String,
    service: State<'_, BrowserSpeedDialService>
) -> Result<(), String> {
    service.delete_entry(&entry_id)
}

#[tauri::command]
pub fn speed_dial_reorder_entries(
    entry_ids: Vec<String>,
    service: State<'_, BrowserSpeedDialService>
) -> Result<(), String> {
    service.reorder_entries(entry_ids)
}

#[tauri::command]
pub fn speed_dial_move_to_folder(
    entry_id: String,
    folder_id: Option<String>,
    service: State<'_, BrowserSpeedDialService>
) -> Result<(), String> {
    service.move_to_folder(&entry_id, folder_id)
}

#[tauri::command]
pub fn speed_dial_toggle_pin(
    entry_id: String,
    service: State<'_, BrowserSpeedDialService>
) -> Result<bool, String> {
    service.toggle_pin(&entry_id)
}

#[tauri::command]
pub fn speed_dial_record_visit(
    entry_id: String,
    service: State<'_, BrowserSpeedDialService>
) -> Result<(), String> {
    service.record_visit(&entry_id)
}

// ==================== Folder Commands ====================

#[tauri::command]
pub fn speed_dial_get_all_folders(
    service: State<'_, BrowserSpeedDialService>
) -> Vec<SpeedDialFolder> {
    service.get_all_folders()
}

#[tauri::command]
pub fn speed_dial_get_folder(
    folder_id: String,
    service: State<'_, BrowserSpeedDialService>
) -> Option<SpeedDialFolder> {
    service.get_folder(&folder_id)
}

#[tauri::command]
pub fn speed_dial_create_folder(
    name: String,
    service: State<'_, BrowserSpeedDialService>
) -> Result<SpeedDialFolder, String> {
    service.create_folder(name)
}

#[tauri::command]
pub fn speed_dial_update_folder(
    folder_id: String,
    updates: FolderUpdate,
    service: State<'_, BrowserSpeedDialService>
) -> Result<SpeedDialFolder, String> {
    service.update_folder(&folder_id, updates)
}

#[tauri::command]
pub fn speed_dial_delete_folder(
    folder_id: String,
    move_entries: bool,
    service: State<'_, BrowserSpeedDialService>
) -> Result<(), String> {
    service.delete_folder(&folder_id, move_entries)
}

#[tauri::command]
pub fn speed_dial_reorder_folders(
    folder_ids: Vec<String>,
    service: State<'_, BrowserSpeedDialService>
) -> Result<(), String> {
    service.reorder_folders(folder_ids)
}

#[tauri::command]
pub fn speed_dial_toggle_folder_expanded(
    folder_id: String,
    service: State<'_, BrowserSpeedDialService>
) -> Result<bool, String> {
    service.toggle_folder_expanded(&folder_id)
}

// ==================== Thumbnail Commands ====================

#[tauri::command]
pub fn speed_dial_update_thumbnail(
    entry_id: String,
    thumbnail_data: String,
    service: State<'_, BrowserSpeedDialService>
) -> Result<(), String> {
    service.update_thumbnail(&entry_id, thumbnail_data)
}

#[tauri::command]
pub fn speed_dial_get_cached_thumbnail(
    url: String,
    service: State<'_, BrowserSpeedDialService>
) -> Option<String> {
    service.get_cached_thumbnail(&url)
}

#[tauri::command]
pub fn speed_dial_clear_thumbnail_cache(
    service: State<'_, BrowserSpeedDialService>
) -> Result<(), String> {
    service.clear_thumbnail_cache();
    Ok(())
}

#[tauri::command]
pub fn speed_dial_get_entries_needing_refresh(
    service: State<'_, BrowserSpeedDialService>
) -> Vec<SpeedDialEntry> {
    service.get_entries_needing_refresh()
}

// ==================== Suggestions Commands ====================

#[tauri::command]
pub fn speed_dial_get_suggestions(
    history: Vec<(String, String, u64)>,
    bookmarks: Vec<(String, String)>,
    service: State<'_, BrowserSpeedDialService>
) -> Vec<SpeedDialSuggestion> {
    service.get_suggestions(history, bookmarks)
}

// ==================== Search Commands ====================

#[tauri::command]
pub fn speed_dial_search(
    query: String,
    service: State<'_, BrowserSpeedDialService>
) -> Vec<SpeedDialEntry> {
    service.search(&query)
}

// ==================== Stats Commands ====================

#[tauri::command]
pub fn speed_dial_get_stats(
    service: State<'_, BrowserSpeedDialService>
) -> SpeedDialStats {
    service.get_stats()
}

// ==================== Import/Export Commands ====================

#[tauri::command]
pub fn speed_dial_export(
    service: State<'_, BrowserSpeedDialService>
) -> Result<String, String> {
    service.export_data()
}

#[tauri::command]
pub fn speed_dial_import(
    json: String,
    service: State<'_, BrowserSpeedDialService>
) -> Result<(u32, u32), String> {
    service.import_data(&json)
}

#[tauri::command]
pub fn speed_dial_import_from_bookmarks(
    bookmarks: Vec<(String, String)>,
    service: State<'_, BrowserSpeedDialService>
) -> Result<u32, String> {
    service.import_from_bookmarks(bookmarks)
}

// ==================== Quick Settings Commands ====================

#[tauri::command]
pub fn speed_dial_toggle_live_preview(
    service: State<'_, BrowserSpeedDialService>
) -> bool {
    let mut settings = service.get_settings();
    settings.live_preview_enabled = !settings.live_preview_enabled;
    let enabled = settings.live_preview_enabled;
    service.update_settings(settings);
    enabled
}

#[tauri::command]
pub fn speed_dial_toggle_suggestions(
    service: State<'_, BrowserSpeedDialService>
) -> bool {
    let mut settings = service.get_settings();
    settings.suggestions_enabled = !settings.suggestions_enabled;
    let enabled = settings.suggestions_enabled;
    service.update_settings(settings);
    enabled
}

#[tauri::command]
pub fn speed_dial_toggle_titles(
    service: State<'_, BrowserSpeedDialService>
) -> bool {
    let mut settings = service.get_settings();
    settings.show_titles = !settings.show_titles;
    let show = settings.show_titles;
    service.update_settings(settings);
    show
}

#[tauri::command]
pub fn speed_dial_set_default_size(
    size: SpeedDialSize,
    service: State<'_, BrowserSpeedDialService>
) -> Result<(), String> {
    let mut settings = service.get_settings();
    settings.default_size = size;
    service.update_settings(settings);
    Ok(())
}

#[tauri::command]
pub fn speed_dial_set_entry_size(
    entry_id: String,
    size: SpeedDialSize,
    service: State<'_, BrowserSpeedDialService>
) -> Result<SpeedDialEntry, String> {
    service.update_entry(&entry_id, SpeedDialUpdate {
        title: None,
        url: None,
        thumbnail_type: None,
        thumbnail_url: None,
        thumbnail_color: None,
        size: Some(size),
        folder_id: None,
        is_pinned: None,
        tags: None,
        notes: None,
        auto_refresh: None,
        refresh_interval: None,
    })
}

#[tauri::command]
pub fn speed_dial_set_entry_thumbnail_type(
    entry_id: String,
    thumbnail_type: ThumbnailType,
    service: State<'_, BrowserSpeedDialService>
) -> Result<SpeedDialEntry, String> {
    service.update_entry(&entry_id, SpeedDialUpdate {
        title: None,
        url: None,
        thumbnail_type: Some(thumbnail_type),
        thumbnail_url: None,
        thumbnail_color: None,
        size: None,
        folder_id: None,
        is_pinned: None,
        tags: None,
        notes: None,
        auto_refresh: None,
        refresh_interval: None,
    })
}
