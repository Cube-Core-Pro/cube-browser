// CUBE Nexum - Search Engine Commands
// 40 Tauri commands for search engine management

use tauri::State;
use crate::services::browser_search::{
    SearchEngineService, SearchSettings, SearchEngine, SearchCategory,
    SearchSuggestion, SearchHistoryItem, QuickAction, QuickActionType,
    OmniboxResult, SearchStats, SafeSearchLevel,
};

// ==================== Settings Commands ====================

#[tauri::command]
pub fn search_get_settings(service: State<SearchEngineService>) -> SearchSettings {
    service.get_settings()
}

#[tauri::command]
pub fn search_update_settings(
    service: State<SearchEngineService>,
    settings: SearchSettings,
) -> Result<(), String> {
    service.update_settings(settings)
}

// ==================== Engine CRUD Commands ====================

#[tauri::command]
pub fn search_add_engine(
    service: State<SearchEngineService>,
    engine: SearchEngine,
) -> Result<String, String> {
    service.add_engine(engine)
}

#[tauri::command]
pub fn search_update_engine(
    service: State<SearchEngineService>,
    id: String,
    engine: SearchEngine,
) -> Result<(), String> {
    service.update_engine(&id, engine)
}

#[tauri::command]
pub fn search_delete_engine(
    service: State<SearchEngineService>,
    id: String,
) -> Result<(), String> {
    service.delete_engine(&id)
}

#[tauri::command]
pub fn search_get_engine(
    service: State<SearchEngineService>,
    id: String,
) -> Option<SearchEngine> {
    service.get_engine(&id)
}

#[tauri::command]
pub fn search_get_all_engines(service: State<SearchEngineService>) -> Vec<SearchEngine> {
    service.get_all_engines()
}

#[tauri::command]
pub fn search_get_enabled_engines(service: State<SearchEngineService>) -> Vec<SearchEngine> {
    service.get_enabled_engines()
}

#[tauri::command]
pub fn search_get_default_engine(service: State<SearchEngineService>) -> Option<SearchEngine> {
    service.get_default_engine()
}

#[tauri::command]
pub fn search_set_default_engine(
    service: State<SearchEngineService>,
    id: String,
) -> Result<(), String> {
    service.set_default_engine(&id)
}

#[tauri::command]
pub fn search_toggle_engine(
    service: State<SearchEngineService>,
    id: String,
    enabled: bool,
) -> Result<(), String> {
    service.toggle_engine(&id, enabled)
}

#[tauri::command]
pub fn search_get_engine_by_keyword(
    service: State<SearchEngineService>,
    keyword: String,
) -> Option<SearchEngine> {
    service.get_engine_by_keyword(&keyword)
}

#[tauri::command]
pub fn search_get_engines_by_category(
    service: State<SearchEngineService>,
    category: SearchCategory,
) -> Vec<SearchEngine> {
    service.get_engines_by_category(category)
}

// ==================== Search Commands ====================

#[tauri::command]
pub fn search_build_url(
    service: State<SearchEngineService>,
    query: String,
    engine_id: Option<String>,
) -> Result<String, String> {
    service.build_search_url(&query, engine_id.as_deref())
}

#[tauri::command]
pub fn search_record(
    service: State<SearchEngineService>,
    query: String,
    engine_id: String,
) {
    service.record_search(query, engine_id);
}

// ==================== Omnibox Commands ====================

#[tauri::command]
pub fn search_process_omnibox(
    service: State<SearchEngineService>,
    input: String,
) -> OmniboxResult {
    service.process_omnibox_input(&input)
}

// ==================== Quick Actions Commands ====================

#[tauri::command]
pub fn search_add_quick_action(
    service: State<SearchEngineService>,
    action: QuickAction,
) -> Result<String, String> {
    service.add_quick_action(action)
}

#[tauri::command]
pub fn search_get_quick_actions(service: State<SearchEngineService>) -> Vec<QuickAction> {
    service.get_quick_actions()
}

#[tauri::command]
pub fn search_delete_quick_action(
    service: State<SearchEngineService>,
    id: String,
) -> Result<(), String> {
    service.delete_quick_action(&id)
}

// ==================== History Commands ====================

#[tauri::command]
pub fn search_engine_get_history(
    service: State<SearchEngineService>,
    limit: Option<usize>,
) -> Vec<SearchHistoryItem> {
    service.get_search_history(limit)
}

#[tauri::command]
pub fn search_engine_clear_history(service: State<SearchEngineService>) {
    service.clear_search_history();
}

#[tauri::command]
pub fn search_engine_delete_history_item(
    service: State<SearchEngineService>,
    id: String,
) -> Result<(), String> {
    service.delete_search_history_item(&id)
}

// ==================== Statistics Commands ====================

#[tauri::command]
pub fn search_engine_get_stats(service: State<SearchEngineService>) -> SearchStats {
    service.get_stats()
}

#[tauri::command]
pub fn search_engine_reset_stats(service: State<SearchEngineService>) {
    service.reset_stats();
}

// ==================== Import/Export Commands ====================

#[tauri::command]
pub fn search_export_engines(service: State<SearchEngineService>) -> Vec<SearchEngine> {
    service.export_engines()
}

#[tauri::command]
pub fn search_import_engines(
    service: State<SearchEngineService>,
    engines: Vec<SearchEngine>,
) -> Result<u32, String> {
    service.import_engines(engines)
}
