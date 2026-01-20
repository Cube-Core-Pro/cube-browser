// CUBE Nexum - Smart Sessions Commands
// Tauri commands for intelligent session management

use tauri::State;
use chrono::{DateTime, Utc};
use super::super::services::browser_smart_sessions::{
    BrowserSmartSessionsService, SmartSession, SmartSessionSettings,
    SessionType, SessionTab, SessionWindow, SessionStats,
    SessionSearchResult, SessionComparison, SessionSchedule,
    ScrollPosition, FormSnapshot, MediaState, WorkspaceSnapshot,
    SessionUpdate, SessionContext,
};

// ==================== Settings Commands ====================

#[tauri::command]
pub fn smart_sessions_get_settings(
    service: State<'_, BrowserSmartSessionsService>
) -> SmartSessionSettings {
    service.get_settings()
}

#[tauri::command]
pub fn smart_sessions_update_settings(
    settings: SmartSessionSettings,
    service: State<'_, BrowserSmartSessionsService>
) -> Result<(), String> {
    service.update_settings(settings);
    Ok(())
}

// ==================== Session CRUD Commands ====================

#[tauri::command]
pub fn smart_sessions_create(
    name: String,
    session_type: SessionType,
    tabs: Vec<SessionTab>,
    windows: Vec<SessionWindow>,
    service: State<'_, BrowserSmartSessionsService>
) -> Result<SmartSession, String> {
    service.create_session(name, session_type, tabs, windows)
}

#[tauri::command]
pub fn smart_sessions_get(
    session_id: String,
    service: State<'_, BrowserSmartSessionsService>
) -> Option<SmartSession> {
    service.get_session(&session_id)
}

#[tauri::command]
pub fn smart_sessions_get_all(
    service: State<'_, BrowserSmartSessionsService>
) -> Vec<SmartSession> {
    service.get_all_sessions()
}

#[tauri::command]
pub fn smart_sessions_get_by_type(
    session_type: SessionType,
    service: State<'_, BrowserSmartSessionsService>
) -> Vec<SmartSession> {
    service.get_sessions_by_type(session_type)
}

#[tauri::command]
pub fn smart_sessions_get_pinned(
    service: State<'_, BrowserSmartSessionsService>
) -> Vec<SmartSession> {
    service.get_pinned_sessions()
}

#[tauri::command]
pub fn smart_sessions_update(
    session_id: String,
    updates: SessionUpdate,
    service: State<'_, BrowserSmartSessionsService>
) -> Result<SmartSession, String> {
    service.update_session(&session_id, updates)
}

#[tauri::command]
pub fn smart_sessions_delete(
    session_id: String,
    service: State<'_, BrowserSmartSessionsService>
) -> Result<(), String> {
    service.delete_session(&session_id)
}

#[tauri::command]
pub fn smart_sessions_toggle_pin(
    session_id: String,
    service: State<'_, BrowserSmartSessionsService>
) -> Result<bool, String> {
    service.toggle_pin(&session_id)
}

#[tauri::command]
pub fn smart_sessions_rename(
    session_id: String,
    name: String,
    service: State<'_, BrowserSmartSessionsService>
) -> Result<SmartSession, String> {
    service.update_session(&session_id, SessionUpdate {
        name: Some(name),
        description: None,
        tags: None,
        is_pinned: None,
        context: None,
    })
}

#[tauri::command]
pub fn smart_sessions_set_tags(
    session_id: String,
    tags: Vec<String>,
    service: State<'_, BrowserSmartSessionsService>
) -> Result<SmartSession, String> {
    service.update_session(&session_id, SessionUpdate {
        name: None,
        description: None,
        tags: Some(tags),
        is_pinned: None,
        context: None,
    })
}

#[tauri::command]
pub fn smart_sessions_set_context(
    session_id: String,
    context: SessionContext,
    service: State<'_, BrowserSmartSessionsService>
) -> Result<SmartSession, String> {
    service.update_session(&session_id, SessionUpdate {
        name: None,
        description: None,
        tags: None,
        is_pinned: None,
        context: Some(context),
    })
}

// ==================== Auto Save Commands ====================

#[tauri::command]
pub fn smart_sessions_auto_save(
    tabs: Vec<SessionTab>,
    windows: Vec<SessionWindow>,
    service: State<'_, BrowserSmartSessionsService>
) -> Result<SmartSession, String> {
    service.auto_save(tabs, windows)
}

#[tauri::command]
pub fn smart_sessions_get_latest_auto_save(
    service: State<'_, BrowserSmartSessionsService>
) -> Option<SmartSession> {
    service.get_latest_auto_save()
}

// ==================== Crash Recovery Commands ====================

#[tauri::command]
pub fn smart_sessions_create_crash_recovery(
    tabs: Vec<SessionTab>,
    windows: Vec<SessionWindow>,
    error_message: Option<String>,
    service: State<'_, BrowserSmartSessionsService>
) -> Result<SmartSession, String> {
    service.create_crash_recovery(tabs, windows, error_message)
}

#[tauri::command]
pub fn smart_sessions_get_crash_recovery(
    service: State<'_, BrowserSmartSessionsService>
) -> Vec<SmartSession> {
    service.get_crash_recovery_sessions()
}

#[tauri::command]
pub fn smart_sessions_mark_recovery_attempted(
    session_id: String,
    service: State<'_, BrowserSmartSessionsService>
) -> Result<(), String> {
    service.mark_recovery_attempted(&session_id)
}

// ==================== Quick Save Commands ====================

#[tauri::command]
pub fn smart_sessions_quick_save(
    tabs: Vec<SessionTab>,
    windows: Vec<SessionWindow>,
    service: State<'_, BrowserSmartSessionsService>
) -> Result<SmartSession, String> {
    service.quick_save(tabs, windows)
}

#[tauri::command]
pub fn smart_sessions_get_quick_save(
    service: State<'_, BrowserSmartSessionsService>
) -> Option<SmartSession> {
    service.get_quick_save()
}

// ==================== Context Preservation Commands ====================

#[tauri::command]
pub fn smart_sessions_save_scroll_position(
    session_id: String,
    position: ScrollPosition,
    service: State<'_, BrowserSmartSessionsService>
) -> Result<(), String> {
    service.save_scroll_position(&session_id, position)
}

#[tauri::command]
pub fn smart_sessions_save_form_data(
    session_id: String,
    form: FormSnapshot,
    service: State<'_, BrowserSmartSessionsService>
) -> Result<(), String> {
    service.save_form_data(&session_id, form)
}

#[tauri::command]
pub fn smart_sessions_save_media_state(
    session_id: String,
    state: MediaState,
    service: State<'_, BrowserSmartSessionsService>
) -> Result<(), String> {
    service.save_media_state(&session_id, state)
}

#[tauri::command]
pub fn smart_sessions_save_workspace_snapshot(
    session_id: String,
    workspaces: Vec<WorkspaceSnapshot>,
    service: State<'_, BrowserSmartSessionsService>
) -> Result<(), String> {
    service.save_workspace_snapshot(&session_id, workspaces)
}

// ==================== Search Commands ====================

#[tauri::command]
pub fn smart_sessions_search(
    query: String,
    service: State<'_, BrowserSmartSessionsService>
) -> Vec<SessionSearchResult> {
    service.search_sessions(&query)
}

#[tauri::command]
pub fn smart_sessions_search_by_domain(
    domain: String,
    service: State<'_, BrowserSmartSessionsService>
) -> Vec<SmartSession> {
    service.search_by_domain(&domain)
}

#[tauri::command]
pub fn smart_sessions_search_by_date(
    start: DateTime<Utc>,
    end: DateTime<Utc>,
    service: State<'_, BrowserSmartSessionsService>
) -> Vec<SmartSession> {
    service.search_by_date_range(start, end)
}

// ==================== Comparison Commands ====================

#[tauri::command]
pub fn smart_sessions_compare(
    session_a_id: String,
    session_b_id: String,
    service: State<'_, BrowserSmartSessionsService>
) -> Result<SessionComparison, String> {
    service.compare_sessions(&session_a_id, &session_b_id)
}

// ==================== Merge & Split Commands ====================

#[tauri::command]
pub fn smart_sessions_merge(
    session_ids: Vec<String>,
    new_name: String,
    service: State<'_, BrowserSmartSessionsService>
) -> Result<SmartSession, String> {
    service.merge_sessions(session_ids, new_name)
}

#[tauri::command]
pub fn smart_sessions_split(
    session_id: String,
    tab_groups: Vec<Vec<String>>,
    service: State<'_, BrowserSmartSessionsService>
) -> Result<Vec<SmartSession>, String> {
    service.split_session(&session_id, tab_groups)
}

// ==================== Scheduling Commands ====================

#[tauri::command]
pub fn smart_sessions_get_schedules(
    service: State<'_, BrowserSmartSessionsService>
) -> Vec<SessionSchedule> {
    service.get_schedules()
}

#[tauri::command]
pub fn smart_sessions_add_schedule(
    schedule: SessionSchedule,
    service: State<'_, BrowserSmartSessionsService>
) -> Result<(), String> {
    service.add_schedule(schedule)
}

#[tauri::command]
pub fn smart_sessions_delete_schedule(
    schedule_id: String,
    service: State<'_, BrowserSmartSessionsService>
) -> Result<(), String> {
    service.delete_schedule(&schedule_id)
}

#[tauri::command]
pub fn smart_sessions_toggle_schedule(
    schedule_id: String,
    service: State<'_, BrowserSmartSessionsService>
) -> Result<bool, String> {
    service.toggle_schedule(&schedule_id)
}

// ==================== Stats Commands ====================

#[tauri::command]
pub fn smart_sessions_get_stats(
    service: State<'_, BrowserSmartSessionsService>
) -> SessionStats {
    service.get_stats()
}

// ==================== Cleanup Commands ====================

#[tauri::command]
pub fn smart_sessions_cleanup_old(
    keep_days: i64,
    service: State<'_, BrowserSmartSessionsService>
) -> Result<(), String> {
    service.cleanup_old_auto_saves(keep_days);
    Ok(())
}

// ==================== Export/Import Commands ====================

#[tauri::command]
pub fn smart_sessions_export(
    session_id: String,
    service: State<'_, BrowserSmartSessionsService>
) -> Result<String, String> {
    service.export_session(&session_id)
}

#[tauri::command]
pub fn smart_sessions_import(
    json: String,
    service: State<'_, BrowserSmartSessionsService>
) -> Result<SmartSession, String> {
    service.import_session(&json)
}

#[tauri::command]
pub fn smart_sessions_export_all(
    service: State<'_, BrowserSmartSessionsService>
) -> Result<String, String> {
    service.export_all_sessions()
}

// ==================== Quick Toggle Commands ====================

#[tauri::command]
pub fn smart_sessions_toggle_auto_save(
    service: State<'_, BrowserSmartSessionsService>
) -> bool {
    let mut settings = service.get_settings();
    settings.auto_save_enabled = !settings.auto_save_enabled;
    let enabled = settings.auto_save_enabled;
    service.update_settings(settings);
    enabled
}

#[tauri::command]
pub fn smart_sessions_toggle_crash_recovery(
    service: State<'_, BrowserSmartSessionsService>
) -> bool {
    let mut settings = service.get_settings();
    settings.crash_recovery_enabled = !settings.crash_recovery_enabled;
    let enabled = settings.crash_recovery_enabled;
    service.update_settings(settings);
    enabled
}

#[tauri::command]
pub fn smart_sessions_toggle_scroll_restore(
    service: State<'_, BrowserSmartSessionsService>
) -> bool {
    let mut settings = service.get_settings();
    settings.restore_scroll_positions = !settings.restore_scroll_positions;
    let enabled = settings.restore_scroll_positions;
    service.update_settings(settings);
    enabled
}

#[tauri::command]
pub fn smart_sessions_toggle_media_restore(
    service: State<'_, BrowserSmartSessionsService>
) -> bool {
    let mut settings = service.get_settings();
    settings.restore_media_states = !settings.restore_media_states;
    let enabled = settings.restore_media_states;
    service.update_settings(settings);
    enabled
}

#[tauri::command]
pub fn smart_sessions_set_auto_save_interval(
    seconds: u32,
    service: State<'_, BrowserSmartSessionsService>
) -> Result<(), String> {
    let mut settings = service.get_settings();
    settings.auto_save_interval_seconds = seconds;
    service.update_settings(settings);
    Ok(())
}
