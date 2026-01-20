// CUBE Nexum - Privacy Dashboard Commands
// 45 Tauri commands for comprehensive privacy control

use tauri::State;
use crate::services::browser_privacy::{
    PrivacyDashboardService, PrivacySettings, PrivacyLevel, TrackerType,
    Cookie, SameSite, FingerprintProtection, SitePermissions, PrivacyStats,
    PrivacyReport, DoHProvider, ClearDataOptions, ClearDataResult, BlockedTracker,
    CookiePolicy, PermissionDefault, TimeRange,
};
use std::collections::HashMap;

// ==================== Settings Commands ====================

#[tauri::command]
pub fn privacy_get_settings(service: State<PrivacyDashboardService>) -> PrivacySettings {
    service.get_settings()
}

#[tauri::command]
pub fn privacy_update_settings(
    service: State<PrivacyDashboardService>,
    settings: PrivacySettings,
) -> Result<(), String> {
    service.update_settings(settings)
}

#[tauri::command]
pub fn privacy_set_level(
    service: State<PrivacyDashboardService>,
    level: PrivacyLevel,
) -> Result<(), String> {
    service.set_privacy_level(level)
}

#[tauri::command]
pub fn privacy_get_protection_score(service: State<PrivacyDashboardService>) -> u8 {
    service.get_protection_score()
}

// ==================== Tracker Blocking Commands ====================

#[tauri::command]
pub fn privacy_record_blocked_tracker(
    service: State<PrivacyDashboardService>,
    domain: String,
    tracker_type: TrackerType,
    source_url: String,
) {
    service.record_blocked_tracker(domain, tracker_type, source_url);
}

#[tauri::command]
pub fn privacy_get_blocked_trackers(
    service: State<PrivacyDashboardService>,
) -> Vec<BlockedTracker> {
    service.get_blocked_trackers()
}

#[tauri::command]
pub fn privacy_get_blocked_trackers_by_type(
    service: State<PrivacyDashboardService>,
    tracker_type: TrackerType,
) -> Vec<BlockedTracker> {
    service.get_blocked_trackers_by_type(tracker_type)
}

#[tauri::command]
pub fn privacy_clear_blocked_trackers(service: State<PrivacyDashboardService>) {
    service.clear_blocked_trackers();
}

// ==================== Cookie Commands ====================

#[tauri::command]
pub fn privacy_add_cookie(
    service: State<PrivacyDashboardService>,
    cookie: Cookie,
) -> Result<(), String> {
    service.add_cookie(cookie)
}

#[tauri::command]
pub fn privacy_get_cookies(service: State<PrivacyDashboardService>) -> Vec<Cookie> {
    service.get_cookies()
}

#[tauri::command]
pub fn privacy_get_cookies_for_domain(
    service: State<PrivacyDashboardService>,
    domain: String,
) -> Vec<Cookie> {
    service.get_cookies_for_domain(&domain)
}

#[tauri::command]
pub fn privacy_get_third_party_cookies(
    service: State<PrivacyDashboardService>,
) -> Vec<Cookie> {
    service.get_third_party_cookies()
}

#[tauri::command]
pub fn privacy_delete_cookie(
    service: State<PrivacyDashboardService>,
    domain: String,
    name: String,
) -> Result<(), String> {
    service.delete_cookie(&domain, &name)
}

#[tauri::command]
pub fn privacy_delete_cookies_for_domain(
    service: State<PrivacyDashboardService>,
    domain: String,
) -> u32 {
    service.delete_cookies_for_domain(&domain)
}

#[tauri::command]
pub fn privacy_clear_all_cookies(service: State<PrivacyDashboardService>) -> u32 {
    service.clear_all_cookies()
}

#[tauri::command]
pub fn privacy_clear_third_party_cookies(service: State<PrivacyDashboardService>) -> u32 {
    service.clear_third_party_cookies()
}

#[tauri::command]
pub fn privacy_get_cookie_stats(
    service: State<PrivacyDashboardService>,
) -> HashMap<String, u64> {
    service.get_cookie_stats()
}

// ==================== Fingerprint Commands ====================

#[tauri::command]
pub fn privacy_get_fingerprint_protection(
    service: State<PrivacyDashboardService>,
) -> FingerprintProtection {
    service.get_fingerprint_protection()
}

#[tauri::command]
pub fn privacy_rotate_fingerprint(
    service: State<PrivacyDashboardService>,
) -> Result<FingerprintProtection, String> {
    service.rotate_fingerprint()
}

#[tauri::command]
pub fn privacy_set_spoofed_user_agent(
    service: State<PrivacyDashboardService>,
    user_agent: Option<String>,
) -> Result<(), String> {
    service.set_spoofed_user_agent(user_agent)
}

#[tauri::command]
pub fn privacy_set_spoofed_timezone(
    service: State<PrivacyDashboardService>,
    timezone: Option<String>,
) -> Result<(), String> {
    service.set_spoofed_timezone(timezone)
}

#[tauri::command]
pub fn privacy_set_spoofed_resolution(
    service: State<PrivacyDashboardService>,
    width: Option<u32>,
    height: Option<u32>,
) -> Result<(), String> {
    let resolution = match (width, height) {
        (Some(w), Some(h)) => Some((w, h)),
        _ => None,
    };
    service.set_spoofed_resolution(resolution)
}

// ==================== Site Permissions Commands ====================

#[tauri::command]
pub fn privacy_get_site_permissions(
    service: State<PrivacyDashboardService>,
    domain: String,
) -> Option<SitePermissions> {
    service.get_site_permissions(&domain)
}

#[tauri::command]
pub fn privacy_set_site_permission(
    service: State<PrivacyDashboardService>,
    domain: String,
    permission_type: String,
    value: Option<bool>,
) -> Result<(), String> {
    service.set_site_permission(domain, &permission_type, value)
}

#[tauri::command]
pub fn privacy_get_all_site_permissions(
    service: State<PrivacyDashboardService>,
) -> Vec<SitePermissions> {
    service.get_all_site_permissions()
}

#[tauri::command]
pub fn privacy_clear_site_permissions(
    service: State<PrivacyDashboardService>,
    domain: String,
) -> Result<(), String> {
    service.clear_site_permissions(&domain)
}

#[tauri::command]
pub fn privacy_clear_all_site_permissions(service: State<PrivacyDashboardService>) {
    service.clear_all_site_permissions();
}

// ==================== Whitelist/Blacklist Commands ====================

#[tauri::command]
pub fn privacy_add_to_whitelist(
    service: State<PrivacyDashboardService>,
    domain: String,
) -> Result<(), String> {
    service.add_to_whitelist(domain)
}

#[tauri::command]
pub fn privacy_remove_from_whitelist(
    service: State<PrivacyDashboardService>,
    domain: String,
) -> Result<(), String> {
    service.remove_from_whitelist(&domain)
}

#[tauri::command]
pub fn privacy_add_to_blacklist(
    service: State<PrivacyDashboardService>,
    domain: String,
) -> Result<(), String> {
    service.add_to_blacklist(domain)
}

#[tauri::command]
pub fn privacy_remove_from_blacklist(
    service: State<PrivacyDashboardService>,
    domain: String,
) -> Result<(), String> {
    service.remove_from_blacklist(&domain)
}

#[tauri::command]
pub fn privacy_is_whitelisted(
    service: State<PrivacyDashboardService>,
    domain: String,
) -> bool {
    service.is_whitelisted(&domain)
}

#[tauri::command]
pub fn privacy_is_blacklisted(
    service: State<PrivacyDashboardService>,
    domain: String,
) -> bool {
    service.is_blacklisted(&domain)
}

// ==================== Statistics Commands ====================

#[tauri::command]
pub fn privacy_get_stats(service: State<PrivacyDashboardService>) -> PrivacyStats {
    service.get_stats()
}

#[tauri::command]
pub fn privacy_reset_daily_stats(service: State<PrivacyDashboardService>) {
    service.reset_daily_stats();
}

#[tauri::command]
pub fn privacy_reset_weekly_stats(service: State<PrivacyDashboardService>) {
    service.reset_weekly_stats();
}

#[tauri::command]
pub fn privacy_reset_monthly_stats(service: State<PrivacyDashboardService>) {
    service.reset_monthly_stats();
}

// ==================== Report Commands ====================

#[tauri::command]
pub fn privacy_generate_report(
    service: State<PrivacyDashboardService>,
    days: u32,
) -> PrivacyReport {
    service.generate_report(days)
}

// ==================== DoH Commands ====================

#[tauri::command]
pub fn privacy_get_doh_providers() -> Vec<DoHProvider> {
    PrivacyDashboardService::get_doh_providers()
}

#[tauri::command]
pub fn privacy_set_doh_provider(
    service: State<PrivacyDashboardService>,
    url: String,
) -> Result<(), String> {
    service.set_doh_provider(url)
}

// ==================== Data Clearing Commands ====================

#[tauri::command]
pub fn privacy_clear_browsing_data(
    service: State<PrivacyDashboardService>,
    options: ClearDataOptions,
) -> ClearDataResult {
    service.clear_browsing_data(options)
}
