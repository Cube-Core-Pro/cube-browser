// CUBE Nexum - Smart Clipboard Commands
// Tauri commands for intelligent clipboard management

use tauri::State;
use std::collections::HashMap;
use crate::services::browser_smart_clipboard::{
    BrowserSmartClipboardService, ClipboardSettings, ClipboardEntry,
    ClipboardContent, ClipboardCategory, ClipboardSearchResult,
    SmartPaste, TransformType, PasteTemplate, TemplateVariable,
    ClipboardStats, EntryUpdate,
};

// ==================== Settings Commands ====================

#[tauri::command]
pub fn smart_clipboard_get_settings(
    service: State<'_, BrowserSmartClipboardService>
) -> ClipboardSettings {
    service.get_settings()
}

#[tauri::command]
pub fn smart_clipboard_update_settings(
    service: State<'_, BrowserSmartClipboardService>,
    settings: ClipboardSettings
) {
    service.update_settings(settings);
}

// ==================== Entry Management Commands ====================

#[tauri::command]
pub fn smart_clipboard_add_entry(
    service: State<'_, BrowserSmartClipboardService>,
    content: ClipboardContent,
    source_url: Option<String>,
    source_app: Option<String>
) -> Result<ClipboardEntry, String> {
    service.add_entry(content, source_url, source_app)
}

#[tauri::command]
pub fn smart_clipboard_get_entry(
    service: State<'_, BrowserSmartClipboardService>,
    entry_id: String
) -> Option<ClipboardEntry> {
    service.get_entry(&entry_id)
}

#[tauri::command]
pub fn smart_clipboard_get_all_entries(
    service: State<'_, BrowserSmartClipboardService>
) -> Vec<ClipboardEntry> {
    service.get_all_entries()
}

#[tauri::command]
pub fn smart_clipboard_get_recent(
    service: State<'_, BrowserSmartClipboardService>,
    limit: usize
) -> Vec<ClipboardEntry> {
    service.get_recent_entries(limit)
}

#[tauri::command]
pub fn smart_clipboard_get_by_category(
    service: State<'_, BrowserSmartClipboardService>,
    category: ClipboardCategory
) -> Vec<ClipboardEntry> {
    service.get_entries_by_category(category)
}

#[tauri::command]
pub fn smart_clipboard_get_pinned(
    service: State<'_, BrowserSmartClipboardService>
) -> Vec<ClipboardEntry> {
    service.get_pinned_entries()
}

#[tauri::command]
pub fn smart_clipboard_get_favorites(
    service: State<'_, BrowserSmartClipboardService>
) -> Vec<ClipboardEntry> {
    service.get_favorite_entries()
}

#[tauri::command]
pub fn smart_clipboard_update_entry(
    service: State<'_, BrowserSmartClipboardService>,
    entry_id: String,
    updates: EntryUpdate
) -> Result<ClipboardEntry, String> {
    service.update_entry(&entry_id, updates)
}

#[tauri::command]
pub fn smart_clipboard_delete_entry(
    service: State<'_, BrowserSmartClipboardService>,
    entry_id: String
) -> Result<(), String> {
    service.delete_entry(&entry_id)
}

#[tauri::command]
pub fn smart_clipboard_use_entry(
    service: State<'_, BrowserSmartClipboardService>,
    entry_id: String
) -> Result<ClipboardContent, String> {
    service.use_entry(&entry_id)
}

#[tauri::command]
pub fn smart_clipboard_clear_history(
    service: State<'_, BrowserSmartClipboardService>,
    keep_pinned: bool
) {
    service.clear_history(keep_pinned);
}

#[tauri::command]
pub fn smart_clipboard_delete_expired(
    service: State<'_, BrowserSmartClipboardService>
) -> u32 {
    service.delete_expired()
}

// ==================== Search Commands ====================

#[tauri::command]
pub fn smart_clipboard_search(
    service: State<'_, BrowserSmartClipboardService>,
    query: String
) -> Vec<ClipboardSearchResult> {
    service.search(&query)
}

// ==================== Transform Commands ====================

#[tauri::command]
pub fn smart_clipboard_transform(
    service: State<'_, BrowserSmartClipboardService>,
    entry_id: String,
    transform_type: TransformType
) -> Result<SmartPaste, String> {
    service.transform(&entry_id, transform_type)
}

// ==================== Template Commands ====================

#[tauri::command]
pub fn smart_clipboard_create_template(
    service: State<'_, BrowserSmartClipboardService>,
    name: String,
    content: String,
    variables: Vec<TemplateVariable>
) -> PasteTemplate {
    service.create_template(name, content, variables)
}

#[tauri::command]
pub fn smart_clipboard_get_template(
    service: State<'_, BrowserSmartClipboardService>,
    template_id: String
) -> Option<PasteTemplate> {
    service.get_template(&template_id)
}

#[tauri::command]
pub fn smart_clipboard_get_all_templates(
    service: State<'_, BrowserSmartClipboardService>
) -> Vec<PasteTemplate> {
    service.get_all_templates()
}

#[tauri::command]
pub fn smart_clipboard_delete_template(
    service: State<'_, BrowserSmartClipboardService>,
    template_id: String
) -> Result<(), String> {
    service.delete_template(&template_id)
}

#[tauri::command]
pub fn smart_clipboard_apply_template(
    service: State<'_, BrowserSmartClipboardService>,
    template_id: String,
    values: HashMap<String, String>
) -> Result<String, String> {
    service.apply_template(&template_id, values)
}

// ==================== Stats Commands ====================

#[tauri::command]
pub fn smart_clipboard_get_stats(
    service: State<'_, BrowserSmartClipboardService>
) -> ClipboardStats {
    service.get_stats()
}
