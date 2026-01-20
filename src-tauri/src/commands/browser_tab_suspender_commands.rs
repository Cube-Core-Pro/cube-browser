// CUBE Nexum - Tab Suspender Commands
// Tauri commands for automatic tab hibernation

use tauri::State;
use crate::services::browser_tab_suspender::{
    BrowserTabSuspenderService, SuspenderSettings, SuspendedTab,
    SuspendReason, WhitelistEntry, TabMemoryInfo, MemoryReport,
    SuspendSession, SuspenderStats,
};

// ==================== Settings Commands ====================

#[tauri::command]
pub fn tab_suspender_get_settings(
    service: State<'_, BrowserTabSuspenderService>
) -> SuspenderSettings {
    service.get_settings()
}

#[tauri::command]
pub fn tab_suspender_update_settings(
    service: State<'_, BrowserTabSuspenderService>,
    settings: SuspenderSettings
) {
    service.update_settings(settings);
}

// ==================== Suspend Commands ====================

#[tauri::command]
pub fn tab_suspender_suspend_tab(
    service: State<'_, BrowserTabSuspenderService>,
    tab_id: String,
    url: String,
    title: String,
    reason: SuspendReason
) -> Result<SuspendedTab, String> {
    service.suspend_tab(&tab_id, &url, &title, reason)
}

#[tauri::command]
pub fn tab_suspender_unsuspend(
    service: State<'_, BrowserTabSuspenderService>,
    suspended_id: String
) -> Result<SuspendedTab, String> {
    service.unsuspend_tab(&suspended_id)
}

#[tauri::command]
pub fn tab_suspender_unsuspend_by_tab_id(
    service: State<'_, BrowserTabSuspenderService>,
    tab_id: String
) -> Result<SuspendedTab, String> {
    service.unsuspend_by_tab_id(&tab_id)
}

#[tauri::command]
pub fn tab_suspender_suspend_others(
    service: State<'_, BrowserTabSuspenderService>,
    active_tab_id: String,
    tabs: Vec<(String, String, String)>
) -> Vec<SuspendedTab> {
    service.suspend_other_tabs(&active_tab_id, tabs)
}

#[tauri::command]
pub fn tab_suspender_suspend_all(
    service: State<'_, BrowserTabSuspenderService>,
    tabs: Vec<(String, String, String)>,
    except: Option<String>
) -> Vec<SuspendedTab> {
    service.suspend_all_tabs(tabs, except.as_deref())
}

#[tauri::command]
pub fn tab_suspender_unsuspend_all(
    service: State<'_, BrowserTabSuspenderService>
) -> Vec<SuspendedTab> {
    service.unsuspend_all()
}

#[tauri::command]
pub fn tab_suspender_get_suspended(
    service: State<'_, BrowserTabSuspenderService>,
    suspended_id: String
) -> Option<SuspendedTab> {
    service.get_suspended_tab(&suspended_id)
}

#[tauri::command]
pub fn tab_suspender_get_all_suspended(
    service: State<'_, BrowserTabSuspenderService>
) -> Vec<SuspendedTab> {
    service.get_all_suspended()
}

#[tauri::command]
pub fn tab_suspender_is_suspended(
    service: State<'_, BrowserTabSuspenderService>,
    tab_id: String
) -> bool {
    service.is_tab_suspended(&tab_id)
}

// ==================== Whitelist Commands ====================

#[tauri::command]
pub fn tab_suspender_is_whitelisted(
    service: State<'_, BrowserTabSuspenderService>,
    url: String
) -> bool {
    service.is_whitelisted(&url)
}

#[tauri::command]
pub fn tab_suspender_add_whitelist(
    service: State<'_, BrowserTabSuspenderService>,
    entry: WhitelistEntry
) {
    service.add_to_whitelist(entry);
}

#[tauri::command]
pub fn tab_suspender_remove_whitelist(
    service: State<'_, BrowserTabSuspenderService>,
    pattern: String
) {
    service.remove_from_whitelist(&pattern);
}

#[tauri::command]
pub fn tab_suspender_add_temp_whitelist(
    service: State<'_, BrowserTabSuspenderService>,
    tab_id: String
) {
    service.add_temporary_whitelist(&tab_id);
}

#[tauri::command]
pub fn tab_suspender_remove_temp_whitelist(
    service: State<'_, BrowserTabSuspenderService>,
    tab_id: String
) {
    service.remove_temporary_whitelist(&tab_id);
}

// ==================== Memory Commands ====================

#[tauri::command]
pub fn tab_suspender_update_memory(
    service: State<'_, BrowserTabSuspenderService>,
    tab_id: String,
    info: TabMemoryInfo
) {
    service.update_tab_memory(&tab_id, info);
}

#[tauri::command]
pub fn tab_suspender_get_memory(
    service: State<'_, BrowserTabSuspenderService>,
    tab_id: String
) -> Option<TabMemoryInfo> {
    service.get_tab_memory(&tab_id)
}

#[tauri::command]
pub fn tab_suspender_get_memory_report(
    service: State<'_, BrowserTabSuspenderService>
) -> MemoryReport {
    service.get_memory_report()
}

#[tauri::command]
pub fn tab_suspender_should_suspend(
    service: State<'_, BrowserTabSuspenderService>,
    tab: TabMemoryInfo
) -> bool {
    service.should_suspend(&tab)
}

#[tauri::command]
pub fn tab_suspender_auto_check(
    service: State<'_, BrowserTabSuspenderService>
) -> Vec<String> {
    service.auto_suspend_check()
}

// ==================== Session Commands ====================

#[tauri::command]
pub fn tab_suspender_save_session(
    service: State<'_, BrowserTabSuspenderService>,
    name: String
) -> SuspendSession {
    service.save_session(&name)
}

#[tauri::command]
pub fn tab_suspender_get_session(
    service: State<'_, BrowserTabSuspenderService>,
    session_id: String
) -> Option<SuspendSession> {
    service.get_session(&session_id)
}

#[tauri::command]
pub fn tab_suspender_get_all_sessions(
    service: State<'_, BrowserTabSuspenderService>
) -> Vec<SuspendSession> {
    service.get_all_sessions()
}

#[tauri::command]
pub fn tab_suspender_delete_session(
    service: State<'_, BrowserTabSuspenderService>,
    session_id: String
) -> Result<(), String> {
    service.delete_session(&session_id)
}

#[tauri::command]
pub fn tab_suspender_restore_session(
    service: State<'_, BrowserTabSuspenderService>,
    session_id: String
) -> Result<Vec<SuspendedTab>, String> {
    service.restore_session(&session_id)
}

// ==================== Stats Commands ====================

#[tauri::command]
pub fn tab_suspender_get_stats(
    service: State<'_, BrowserTabSuspenderService>
) -> SuspenderStats {
    service.get_stats()
}

#[tauri::command]
pub fn tab_suspender_reset_daily_stats(
    service: State<'_, BrowserTabSuspenderService>
) {
    service.reset_daily_stats();
}
