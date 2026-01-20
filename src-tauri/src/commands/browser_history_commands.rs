// CUBE Nexum - History Commands
// Tauri commands for the history service

use tauri::State;
use crate::services::browser_history::{
    BrowserHistoryService, HistorySettings, HistoryEntry, Visit,
    BrowsingSession, HistoryStats, HistoryFilter, SearchResult,
    FrequentSite, RecentlyClosed, DomainStats, VisitType,
    PageType, TimeRange, SortOrder
};

// ==================== Settings Commands ====================

#[tauri::command]
pub fn history_get_settings(
    service: State<'_, BrowserHistoryService>
) -> HistorySettings {
    service.get_settings()
}

#[tauri::command]
pub fn history_update_settings(
    settings: HistorySettings,
    service: State<'_, BrowserHistoryService>
) -> Result<(), String> {
    service.update_settings(settings)
}

#[tauri::command]
pub fn history_add_excluded_domain(
    domain: String,
    service: State<'_, BrowserHistoryService>
) -> Result<(), String> {
    service.add_excluded_domain(domain)
}

#[tauri::command]
pub fn history_remove_excluded_domain(
    domain: String,
    service: State<'_, BrowserHistoryService>
) -> Result<(), String> {
    service.remove_excluded_domain(&domain)
}

#[tauri::command]
pub fn history_set_retention_days(
    days: u32,
    service: State<'_, BrowserHistoryService>
) -> Result<(), String> {
    service.set_retention_days(days)
}

// ==================== Entry Operations Commands ====================

#[tauri::command]
pub fn history_add_entry(
    url: String,
    title: String,
    visit_type: VisitType,
    service: State<'_, BrowserHistoryService>
) -> Result<HistoryEntry, String> {
    service.add_entry(url, title, visit_type)
}

#[tauri::command]
pub fn history_update_entry(
    entry_id: String,
    updates: HistoryEntry,
    service: State<'_, BrowserHistoryService>
) -> Result<HistoryEntry, String> {
    service.update_entry(&entry_id, updates)
}

#[tauri::command]
pub fn history_update_duration(
    entry_id: String,
    duration_ms: u64,
    service: State<'_, BrowserHistoryService>
) -> Result<(), String> {
    service.update_duration(&entry_id, duration_ms)
}

#[tauri::command]
pub fn history_update_scroll_position(
    entry_id: String,
    position: f64,
    service: State<'_, BrowserHistoryService>
) -> Result<(), String> {
    service.update_scroll_position(&entry_id, position)
}

#[tauri::command]
pub fn history_delete_entry(
    entry_id: String,
    service: State<'_, BrowserHistoryService>
) -> Result<(), String> {
    service.delete_entry(&entry_id)
}

#[tauri::command]
pub fn history_delete_entries(
    entry_ids: Vec<String>,
    service: State<'_, BrowserHistoryService>
) -> Result<u32, String> {
    service.delete_entries(entry_ids)
}

// ==================== Retrieval Commands ====================

#[tauri::command]
pub fn history_get_entry(
    entry_id: String,
    service: State<'_, BrowserHistoryService>
) -> Option<HistoryEntry> {
    service.get_entry(&entry_id)
}

#[tauri::command]
pub fn history_get_entry_by_url(
    url: String,
    service: State<'_, BrowserHistoryService>
) -> Option<HistoryEntry> {
    service.get_entry_by_url(&url)
}

#[tauri::command]
pub fn history_get_all_entries(
    service: State<'_, BrowserHistoryService>
) -> Vec<HistoryEntry> {
    service.get_all_entries()
}

#[tauri::command]
pub fn history_get_recent_entries(
    limit: u32,
    service: State<'_, BrowserHistoryService>
) -> Vec<HistoryEntry> {
    service.get_recent_entries(limit)
}

#[tauri::command]
pub fn history_get_entries_by_domain(
    domain: String,
    service: State<'_, BrowserHistoryService>
) -> Vec<HistoryEntry> {
    service.get_entries_by_domain(&domain)
}

#[tauri::command]
pub fn history_get_entries_by_page_type(
    page_type: PageType,
    service: State<'_, BrowserHistoryService>
) -> Vec<HistoryEntry> {
    service.get_entries_by_page_type(page_type)
}

#[tauri::command]
pub fn history_get_starred_entries(
    service: State<'_, BrowserHistoryService>
) -> Vec<HistoryEntry> {
    service.get_starred_entries()
}

#[tauri::command]
pub fn history_filter_entries(
    filter: HistoryFilter,
    service: State<'_, BrowserHistoryService>
) -> Vec<HistoryEntry> {
    service.filter_entries(filter)
}

// ==================== Search Commands ====================

#[tauri::command]
pub fn history_search(
    query: String,
    service: State<'_, BrowserHistoryService>
) -> Vec<SearchResult> {
    service.search(&query)
}

#[tauri::command]
pub fn history_suggest(
    query: String,
    limit: u32,
    service: State<'_, BrowserHistoryService>
) -> Vec<String> {
    service.suggest(&query, limit)
}

// ==================== Tags Commands ====================

#[tauri::command]
pub fn history_add_tag(
    entry_id: String,
    tag: String,
    service: State<'_, BrowserHistoryService>
) -> Result<(), String> {
    service.add_tag(&entry_id, tag)
}

#[tauri::command]
pub fn history_remove_tag(
    entry_id: String,
    tag: String,
    service: State<'_, BrowserHistoryService>
) -> Result<(), String> {
    service.remove_tag(&entry_id, &tag)
}

#[tauri::command]
pub fn history_toggle_starred(
    entry_id: String,
    service: State<'_, BrowserHistoryService>
) -> Result<bool, String> {
    service.toggle_starred(&entry_id)
}

#[tauri::command]
pub fn history_get_all_tags(
    service: State<'_, BrowserHistoryService>
) -> Vec<String> {
    service.get_all_tags()
}

// ==================== Session Commands ====================

#[tauri::command]
pub fn history_start_session(
    device_name: String,
    service: State<'_, BrowserHistoryService>
) -> Result<BrowsingSession, String> {
    service.start_session(device_name)
}

#[tauri::command]
pub fn history_end_session(
    service: State<'_, BrowserHistoryService>
) -> Result<BrowsingSession, String> {
    service.end_session()
}

#[tauri::command]
pub fn history_get_current_session(
    service: State<'_, BrowserHistoryService>
) -> Option<BrowsingSession> {
    service.get_current_session()
}

#[tauri::command]
pub fn history_get_session(
    session_id: String,
    service: State<'_, BrowserHistoryService>
) -> Option<BrowsingSession> {
    service.get_session(&session_id)
}

#[tauri::command]
pub fn history_get_all_sessions(
    service: State<'_, BrowserHistoryService>
) -> Vec<BrowsingSession> {
    service.get_all_sessions()
}

#[tauri::command]
pub fn history_get_recent_sessions(
    limit: u32,
    service: State<'_, BrowserHistoryService>
) -> Vec<BrowsingSession> {
    service.get_recent_sessions(limit)
}

#[tauri::command]
pub fn history_restore_session(
    session_id: String,
    service: State<'_, BrowserHistoryService>
) -> Result<Vec<String>, String> {
    service.restore_session(&session_id)
}

#[tauri::command]
pub fn history_rename_session(
    session_id: String,
    name: String,
    service: State<'_, BrowserHistoryService>
) -> Result<(), String> {
    service.rename_session(&session_id, name)
}

#[tauri::command]
pub fn history_delete_session(
    session_id: String,
    service: State<'_, BrowserHistoryService>
) -> Result<(), String> {
    service.delete_session(&session_id)
}

// ==================== Recently Closed Commands ====================

#[tauri::command]
pub fn history_add_recently_closed(
    url: String,
    title: String,
    tab_id: Option<String>,
    service: State<'_, BrowserHistoryService>
) -> Result<(), String> {
    service.add_recently_closed(url, title, tab_id)
}

#[tauri::command]
pub fn history_get_recently_closed(
    limit: u32,
    service: State<'_, BrowserHistoryService>
) -> Vec<RecentlyClosed> {
    service.get_recently_closed(limit)
}

#[tauri::command]
pub fn history_restore_recently_closed(
    id: String,
    service: State<'_, BrowserHistoryService>
) -> Result<RecentlyClosed, String> {
    service.restore_recently_closed(&id)
}

#[tauri::command]
pub fn history_clear_recently_closed(
    service: State<'_, BrowserHistoryService>
) -> Result<(), String> {
    service.clear_recently_closed()
}

// ==================== Frequent Sites Commands ====================

#[tauri::command]
pub fn history_get_frequent_sites(
    limit: u32,
    service: State<'_, BrowserHistoryService>
) -> Vec<FrequentSite> {
    service.get_frequent_sites(limit)
}

// ==================== Statistics Commands ====================

#[tauri::command]
pub fn history_get_stats(
    service: State<'_, BrowserHistoryService>
) -> HistoryStats {
    service.get_stats()
}

#[tauri::command]
pub fn history_get_domain_stats(
    domain: String,
    service: State<'_, BrowserHistoryService>
) -> Option<DomainStats> {
    service.get_domain_stats(&domain)
}

#[tauri::command]
pub fn history_get_all_domains(
    service: State<'_, BrowserHistoryService>
) -> Vec<String> {
    service.get_all_domains()
}

// ==================== Cleanup Commands ====================

#[tauri::command]
pub fn history_clear(
    time_range: TimeRange,
    service: State<'_, BrowserHistoryService>
) -> Result<u32, String> {
    service.clear_history(time_range)
}

#[tauri::command]
pub fn history_clear_domain(
    domain: String,
    service: State<'_, BrowserHistoryService>
) -> Result<u32, String> {
    service.clear_domain(&domain)
}

#[tauri::command]
pub fn history_cleanup_old_entries(
    service: State<'_, BrowserHistoryService>
) -> Result<u32, String> {
    service.cleanup_old_entries()
}

// ==================== Export/Import Commands ====================

#[tauri::command]
pub fn history_export(
    service: State<'_, BrowserHistoryService>
) -> Result<String, String> {
    service.export_history()
}

#[tauri::command]
pub fn history_import(
    json: String,
    service: State<'_, BrowserHistoryService>
) -> Result<u32, String> {
    service.import_history(&json)
}
