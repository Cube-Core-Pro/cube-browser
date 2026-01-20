// CUBE Nexum - Focus Mode Commands
// Tauri command interfaces for distraction-free browsing

use tauri::State;
use crate::services::browser_focus_mode::{
    BrowserFocusModeService, FocusSession, FocusProfile, FocusSettings,
    BlockCheckResult, FocusStats, MotivationalQuote, ProductivityTip,
    ProfileUpdate, BlockedSite,
};

// ==================== Settings Commands ====================

#[tauri::command]
pub fn focus_mode_get_settings(
    service: State<'_, BrowserFocusModeService>
) -> FocusSettings {
    service.get_settings()
}

#[tauri::command]
pub fn focus_mode_update_settings(
    service: State<'_, BrowserFocusModeService>,
    settings: FocusSettings
) {
    service.update_settings(settings);
}

// ==================== Profile Commands ====================

#[tauri::command]
pub fn focus_mode_get_profile(
    service: State<'_, BrowserFocusModeService>,
    profile_id: String
) -> Option<FocusProfile> {
    service.get_profile(&profile_id)
}

#[tauri::command]
pub fn focus_mode_get_all_profiles(
    service: State<'_, BrowserFocusModeService>
) -> Vec<FocusProfile> {
    service.get_all_profiles()
}

#[tauri::command]
pub fn focus_mode_create_profile(
    service: State<'_, BrowserFocusModeService>,
    name: String,
    description: Option<String>
) -> FocusProfile {
    service.create_profile(name, description)
}

#[tauri::command]
pub fn focus_mode_update_profile(
    service: State<'_, BrowserFocusModeService>,
    profile_id: String,
    updates: ProfileUpdate
) -> Result<FocusProfile, String> {
    service.update_profile(&profile_id, updates)
}

#[tauri::command]
pub fn focus_mode_delete_profile(
    service: State<'_, BrowserFocusModeService>,
    profile_id: String
) -> Result<(), String> {
    service.delete_profile(&profile_id)
}

// ==================== Session Commands ====================

#[tauri::command]
pub fn focus_mode_start_session(
    service: State<'_, BrowserFocusModeService>,
    profile_id: String,
    name: Option<String>
) -> Result<FocusSession, String> {
    service.start_session(&profile_id, name)
}

#[tauri::command]
pub fn focus_mode_end_session(
    service: State<'_, BrowserFocusModeService>
) -> Result<FocusSession, String> {
    service.end_session()
}

#[tauri::command]
pub fn focus_mode_pause_session(
    service: State<'_, BrowserFocusModeService>,
    reason: Option<String>
) -> Result<(), String> {
    service.pause_session(reason)
}

#[tauri::command]
pub fn focus_mode_resume_session(
    service: State<'_, BrowserFocusModeService>
) -> Result<(), String> {
    service.resume_session()
}

#[tauri::command]
pub fn focus_mode_get_active_session(
    service: State<'_, BrowserFocusModeService>
) -> Option<FocusSession> {
    service.get_active_session()
}

#[tauri::command]
pub fn focus_mode_get_session_history(
    service: State<'_, BrowserFocusModeService>,
    limit: usize
) -> Vec<FocusSession> {
    service.get_session_history(limit)
}

// ==================== Blocking Commands ====================

#[tauri::command]
pub fn focus_mode_check_site(
    service: State<'_, BrowserFocusModeService>,
    url: String
) -> BlockCheckResult {
    service.check_site(&url)
}

#[tauri::command]
pub fn focus_mode_record_blocked_attempt(
    service: State<'_, BrowserFocusModeService>
) {
    service.record_blocked_attempt();
}

// ==================== Statistics Commands ====================

#[tauri::command]
pub fn focus_mode_get_stats(
    service: State<'_, BrowserFocusModeService>
) -> FocusStats {
    service.get_stats()
}

// ==================== Motivation Commands ====================

#[tauri::command]
pub fn focus_mode_get_random_quote(
    service: State<'_, BrowserFocusModeService>
) -> MotivationalQuote {
    service.get_random_quote()
}

#[tauri::command]
pub fn focus_mode_get_random_tip(
    service: State<'_, BrowserFocusModeService>
) -> ProductivityTip {
    service.get_random_tip()
}
