// CUBE Nexum - Tab Suspender Service
// Automatic tab hibernation and memory management

use std::collections::{HashMap, HashSet};
use std::sync::RwLock;
use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// ==================== Types ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SuspendedTab {
    pub id: String,
    pub tab_id: String,
    pub url: String,
    pub title: String,
    pub favicon: Option<String>,
    pub scroll_position: ScrollPosition,
    pub form_data: Option<HashMap<String, String>>,
    pub suspended_at: DateTime<Utc>,
    pub last_active: DateTime<Utc>,
    pub memory_freed_kb: u64,
    pub reason: SuspendReason,
    pub state: TabState,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScrollPosition {
    pub x: i32,
    pub y: i32,
    pub percentage: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SuspendReason {
    Manual,
    Timeout,
    MemoryPressure,
    SystemSleep,
    BatteryLow,
    Background,
    Scheduled,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TabState {
    Active,
    Suspended,
    Discarded,
    Frozen,
    Loading,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SuspenderSettings {
    pub enabled: bool,
    pub suspend_after_minutes: u32,
    pub never_suspend_pinned: bool,
    pub never_suspend_playing_audio: bool,
    pub never_suspend_downloading: bool,
    pub never_suspend_forms: bool,
    pub never_suspend_notifications: bool,
    pub never_suspend_active: bool,
    pub whitelist: Vec<WhitelistEntry>,
    pub blacklist: Vec<String>,
    pub suspend_on_battery: bool,
    pub suspend_threshold_tabs: u32,
    pub memory_threshold_mb: u32,
    pub memory_per_tab_limit_mb: u32,
    pub aggressive_mode: bool,
    pub show_suspended_indicator: bool,
    pub fade_suspended_favicons: bool,
    pub auto_unsuspend_on_focus: bool,
    pub unsuspend_adjacent_tabs: bool,
    pub preserve_form_data: bool,
    pub preserve_scroll_position: bool,
    pub keyboard_shortcuts: SuspenderShortcuts,
    pub exclude_during_hours: Option<(u8, u8)>,
    pub schedule: Option<SuspendSchedule>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WhitelistEntry {
    pub pattern: String,
    pub match_type: MatchType,
    pub reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum MatchType {
    Exact,
    Contains,
    StartsWith,
    EndsWith,
    Regex,
    Domain,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SuspenderShortcuts {
    pub suspend_current: String,
    pub suspend_others: String,
    pub suspend_all: String,
    pub unsuspend_all: String,
    pub toggle_whitelist: String,
    pub open_manager: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SuspendSchedule {
    pub enabled: bool,
    pub suspend_time: String,   // HH:MM format
    pub unsuspend_time: String, // HH:MM format
    pub days: Vec<u8>,          // 0-6 (Sun-Sat)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TabMemoryInfo {
    pub tab_id: String,
    pub memory_usage_kb: u64,
    pub cpu_usage_percent: f32,
    pub last_active: DateTime<Utc>,
    pub is_playing_audio: bool,
    pub is_downloading: bool,
    pub has_unsaved_forms: bool,
    pub has_notifications: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SuspenderStats {
    pub total_tabs_suspended: u64,
    pub total_memory_freed_mb: u64,
    pub current_suspended_count: u32,
    pub average_suspend_duration_minutes: u32,
    pub most_suspended_domains: Vec<(String, u32)>,
    pub memory_saved_today_mb: u64,
    pub suspend_events_today: u32,
    pub auto_unsuspend_count: u32,
    pub whitelist_hits: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SuspendSession {
    pub id: String,
    pub name: String,
    pub tabs: Vec<SuspendedTab>,
    pub created_at: DateTime<Utc>,
    pub total_memory_freed_kb: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryReport {
    pub total_memory_usage_mb: u64,
    pub browser_memory_mb: u64,
    pub tabs_memory_mb: u64,
    pub suspended_count: u32,
    pub active_count: u32,
    pub memory_pressure_level: MemoryPressure,
    pub recommendations: Vec<String>,
    pub top_memory_tabs: Vec<TabMemoryInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum MemoryPressure {
    Low,
    Normal,
    High,
    Critical,
}

// ==================== Service Implementation ====================

pub struct BrowserTabSuspenderService {
    suspended_tabs: RwLock<HashMap<String, SuspendedTab>>,
    tab_memory: RwLock<HashMap<String, TabMemoryInfo>>,
    sessions: RwLock<HashMap<String, SuspendSession>>,
    settings: RwLock<SuspenderSettings>,
    stats: RwLock<SuspenderStats>,
    temporary_whitelist: RwLock<HashSet<String>>,
}

impl BrowserTabSuspenderService {
    pub fn new() -> Self {
        Self {
            suspended_tabs: RwLock::new(HashMap::new()),
            tab_memory: RwLock::new(HashMap::new()),
            sessions: RwLock::new(HashMap::new()),
            settings: RwLock::new(Self::default_settings()),
            stats: RwLock::new(Self::default_stats()),
            temporary_whitelist: RwLock::new(HashSet::new()),
        }
    }

    fn default_settings() -> SuspenderSettings {
        SuspenderSettings {
            enabled: true,
            suspend_after_minutes: 30,
            never_suspend_pinned: true,
            never_suspend_playing_audio: true,
            never_suspend_downloading: true,
            never_suspend_forms: true,
            never_suspend_notifications: true,
            never_suspend_active: true,
            whitelist: vec![
                WhitelistEntry {
                    pattern: "mail.google.com".to_string(),
                    match_type: MatchType::Domain,
                    reason: Some("Email notifications".to_string()),
                },
                WhitelistEntry {
                    pattern: "calendar.google.com".to_string(),
                    match_type: MatchType::Domain,
                    reason: Some("Calendar reminders".to_string()),
                },
                WhitelistEntry {
                    pattern: "meet.google.com".to_string(),
                    match_type: MatchType::Domain,
                    reason: Some("Video calls".to_string()),
                },
                WhitelistEntry {
                    pattern: "zoom.us".to_string(),
                    match_type: MatchType::Domain,
                    reason: Some("Video calls".to_string()),
                },
                WhitelistEntry {
                    pattern: "slack.com".to_string(),
                    match_type: MatchType::Domain,
                    reason: Some("Team messaging".to_string()),
                },
                WhitelistEntry {
                    pattern: "teams.microsoft.com".to_string(),
                    match_type: MatchType::Domain,
                    reason: Some("Team messaging".to_string()),
                },
            ],
            blacklist: Vec::new(),
            suspend_on_battery: true,
            suspend_threshold_tabs: 10,
            memory_threshold_mb: 2048,
            memory_per_tab_limit_mb: 500,
            aggressive_mode: false,
            show_suspended_indicator: true,
            fade_suspended_favicons: true,
            auto_unsuspend_on_focus: true,
            unsuspend_adjacent_tabs: false,
            preserve_form_data: true,
            preserve_scroll_position: true,
            keyboard_shortcuts: SuspenderShortcuts {
                suspend_current: "Alt+S".to_string(),
                suspend_others: "Alt+Shift+S".to_string(),
                suspend_all: "Alt+Ctrl+S".to_string(),
                unsuspend_all: "Alt+Ctrl+U".to_string(),
                toggle_whitelist: "Alt+W".to_string(),
                open_manager: "Alt+M".to_string(),
            },
            exclude_during_hours: None,
            schedule: None,
        }
    }

    fn default_stats() -> SuspenderStats {
        SuspenderStats {
            total_tabs_suspended: 0,
            total_memory_freed_mb: 0,
            current_suspended_count: 0,
            average_suspend_duration_minutes: 0,
            most_suspended_domains: Vec::new(),
            memory_saved_today_mb: 0,
            suspend_events_today: 0,
            auto_unsuspend_count: 0,
            whitelist_hits: 0,
        }
    }

    // ==================== Settings ====================

    pub fn get_settings(&self) -> SuspenderSettings {
        self.settings.read().unwrap().clone()
    }

    pub fn update_settings(&self, new_settings: SuspenderSettings) {
        let mut settings = self.settings.write().unwrap();
        *settings = new_settings;
    }

    // ==================== Suspend Operations ====================

    pub fn suspend_tab(&self, tab_id: &str, url: &str, title: &str, reason: SuspendReason) -> Result<SuspendedTab, String> {
        let settings = self.settings.read().unwrap();
        
        if !settings.enabled && reason != SuspendReason::Manual {
            return Err("Tab suspension is disabled".to_string());
        }

        // Check if already suspended
        if self.suspended_tabs.read().unwrap().values().any(|t| t.tab_id == tab_id) {
            return Err("Tab is already suspended".to_string());
        }

        // Check whitelist
        if self.is_whitelisted(url) {
            let mut stats = self.stats.write().unwrap();
            stats.whitelist_hits += 1;
            return Err("URL is whitelisted".to_string());
        }

        // Check temporary whitelist
        if self.temporary_whitelist.read().unwrap().contains(tab_id) {
            return Err("Tab is temporarily whitelisted".to_string());
        }

        // Get memory info if available
        let memory_freed = self.tab_memory.read().unwrap()
            .get(tab_id)
            .map(|info| info.memory_usage_kb)
            .unwrap_or(50000); // Estimate 50MB if unknown

        let now = Utc::now();
        let suspended_tab = SuspendedTab {
            id: Uuid::new_v4().to_string(),
            tab_id: tab_id.to_string(),
            url: url.to_string(),
            title: title.to_string(),
            favicon: None,
            scroll_position: ScrollPosition { x: 0, y: 0, percentage: 0.0 },
            form_data: None,
            suspended_at: now,
            last_active: now,
            memory_freed_kb: memory_freed,
            reason: reason.clone(),
            state: TabState::Suspended,
        };

        let id = suspended_tab.id.clone();
        self.suspended_tabs.write().unwrap().insert(id.clone(), suspended_tab.clone());

        // Update stats
        let mut stats = self.stats.write().unwrap();
        stats.total_tabs_suspended += 1;
        stats.current_suspended_count += 1;
        stats.total_memory_freed_mb += memory_freed / 1024;
        stats.memory_saved_today_mb += memory_freed / 1024;
        stats.suspend_events_today += 1;

        // Track domain
        if let Some(domain) = self.extract_domain(url) {
            let entry = stats.most_suspended_domains.iter_mut()
                .find(|(d, _)| d == &domain);
            if let Some((_, count)) = entry {
                *count += 1;
            } else {
                stats.most_suspended_domains.push((domain, 1));
            }
            stats.most_suspended_domains.sort_by(|a, b| b.1.cmp(&a.1));
            stats.most_suspended_domains.truncate(10);
        }

        Ok(suspended_tab)
    }

    fn extract_domain(&self, url: &str) -> Option<String> {
        url.split("://")
            .nth(1)
            .and_then(|s| s.split('/').next())
            .map(|s| s.to_string())
    }

    pub fn unsuspend_tab(&self, suspended_id: &str) -> Result<SuspendedTab, String> {
        let mut suspended = self.suspended_tabs.write().unwrap();
        let tab = suspended.remove(suspended_id)
            .ok_or_else(|| "Suspended tab not found".to_string())?;

        // Update stats
        let mut stats = self.stats.write().unwrap();
        stats.current_suspended_count = stats.current_suspended_count.saturating_sub(1);
        stats.auto_unsuspend_count += 1;

        Ok(tab)
    }

    pub fn unsuspend_by_tab_id(&self, tab_id: &str) -> Result<SuspendedTab, String> {
        let mut suspended = self.suspended_tabs.write().unwrap();
        
        let id = suspended.iter()
            .find(|(_, t)| t.tab_id == tab_id)
            .map(|(id, _)| id.clone())
            .ok_or_else(|| "Tab not found in suspended list".to_string())?;

        let tab = suspended.remove(&id).unwrap();

        // Update stats
        let mut stats = self.stats.write().unwrap();
        stats.current_suspended_count = stats.current_suspended_count.saturating_sub(1);

        Ok(tab)
    }

    pub fn suspend_other_tabs(&self, active_tab_id: &str, tabs: Vec<(String, String, String)>) -> Vec<SuspendedTab> {
        let mut suspended = Vec::new();

        for (tab_id, url, title) in tabs {
            if tab_id != active_tab_id {
                if let Ok(tab) = self.suspend_tab(&tab_id, &url, &title, SuspendReason::Manual) {
                    suspended.push(tab);
                }
            }
        }

        suspended
    }

    pub fn suspend_all_tabs(&self, tabs: Vec<(String, String, String)>, except: Option<&str>) -> Vec<SuspendedTab> {
        let mut suspended = Vec::new();

        for (tab_id, url, title) in tabs {
            if except.map(|e| e != tab_id).unwrap_or(true) {
                if let Ok(tab) = self.suspend_tab(&tab_id, &url, &title, SuspendReason::Manual) {
                    suspended.push(tab);
                }
            }
        }

        suspended
    }

    pub fn unsuspend_all(&self) -> Vec<SuspendedTab> {
        let mut suspended = self.suspended_tabs.write().unwrap();
        let tabs: Vec<SuspendedTab> = suspended.values().cloned().collect();
        
        let count = tabs.len() as u32;
        suspended.clear();

        // Update stats
        let mut stats = self.stats.write().unwrap();
        stats.current_suspended_count = 0;
        stats.auto_unsuspend_count += count;

        tabs
    }

    pub fn get_suspended_tab(&self, suspended_id: &str) -> Option<SuspendedTab> {
        self.suspended_tabs.read().unwrap().get(suspended_id).cloned()
    }

    pub fn get_all_suspended(&self) -> Vec<SuspendedTab> {
        self.suspended_tabs.read().unwrap().values().cloned().collect()
    }

    pub fn is_tab_suspended(&self, tab_id: &str) -> bool {
        self.suspended_tabs.read().unwrap()
            .values()
            .any(|t| t.tab_id == tab_id)
    }

    // ==================== Whitelist Management ====================

    pub fn is_whitelisted(&self, url: &str) -> bool {
        let settings = self.settings.read().unwrap();
        
        for entry in &settings.whitelist {
            let matches = match entry.match_type {
                MatchType::Exact => url == entry.pattern,
                MatchType::Contains => url.contains(&entry.pattern),
                MatchType::StartsWith => url.starts_with(&entry.pattern),
                MatchType::EndsWith => url.ends_with(&entry.pattern),
                MatchType::Domain => {
                    self.extract_domain(url)
                        .map(|d| d.contains(&entry.pattern))
                        .unwrap_or(false)
                }
                MatchType::Regex => {
                    regex::Regex::new(&entry.pattern)
                        .map(|r| r.is_match(url))
                        .unwrap_or(false)
                }
            };
            
            if matches {
                return true;
            }
        }

        false
    }

    pub fn add_to_whitelist(&self, entry: WhitelistEntry) {
        let mut settings = self.settings.write().unwrap();
        settings.whitelist.push(entry);
    }

    pub fn remove_from_whitelist(&self, pattern: &str) {
        let mut settings = self.settings.write().unwrap();
        settings.whitelist.retain(|e| e.pattern != pattern);
    }

    pub fn add_temporary_whitelist(&self, tab_id: &str) {
        self.temporary_whitelist.write().unwrap().insert(tab_id.to_string());
    }

    pub fn remove_temporary_whitelist(&self, tab_id: &str) {
        self.temporary_whitelist.write().unwrap().remove(tab_id);
    }

    // ==================== Memory Management ====================

    pub fn update_tab_memory(&self, tab_id: &str, info: TabMemoryInfo) {
        self.tab_memory.write().unwrap().insert(tab_id.to_string(), info);
    }

    pub fn get_tab_memory(&self, tab_id: &str) -> Option<TabMemoryInfo> {
        self.tab_memory.read().unwrap().get(tab_id).cloned()
    }

    pub fn get_memory_report(&self) -> MemoryReport {
        let tab_memory = self.tab_memory.read().unwrap();
        let suspended = self.suspended_tabs.read().unwrap();
        let settings = self.settings.read().unwrap();

        let tabs_memory: u64 = tab_memory.values().map(|t| t.memory_usage_kb).sum();
        let tabs_memory_mb = tabs_memory / 1024;

        let mut top_tabs: Vec<TabMemoryInfo> = tab_memory.values().cloned().collect();
        top_tabs.sort_by(|a, b| b.memory_usage_kb.cmp(&a.memory_usage_kb));
        top_tabs.truncate(10);

        let pressure_level = if tabs_memory_mb > settings.memory_threshold_mb as u64 * 2 {
            MemoryPressure::Critical
        } else if tabs_memory_mb > settings.memory_threshold_mb as u64 {
            MemoryPressure::High
        } else if tabs_memory_mb > settings.memory_threshold_mb as u64 / 2 {
            MemoryPressure::Normal
        } else {
            MemoryPressure::Low
        };

        let mut recommendations = Vec::new();
        if pressure_level == MemoryPressure::Critical || pressure_level == MemoryPressure::High {
            recommendations.push("Consider suspending inactive tabs".to_string());
            if !settings.aggressive_mode {
                recommendations.push("Enable aggressive mode for better memory management".to_string());
            }
        }
        if top_tabs.first().map(|t| t.memory_usage_kb > settings.memory_per_tab_limit_mb as u64 * 1024).unwrap_or(false) {
            recommendations.push("Some tabs are using excessive memory".to_string());
        }

        MemoryReport {
            total_memory_usage_mb: tabs_memory_mb + 500, // Browser overhead estimate
            browser_memory_mb: 500,
            tabs_memory_mb,
            suspended_count: suspended.len() as u32,
            active_count: tab_memory.len() as u32,
            memory_pressure_level: pressure_level,
            recommendations,
            top_memory_tabs: top_tabs,
        }
    }

    pub fn should_suspend(&self, tab: &TabMemoryInfo) -> bool {
        let settings = self.settings.read().unwrap();

        if !settings.enabled {
            return false;
        }

        // Check exclusions
        if settings.never_suspend_playing_audio && tab.is_playing_audio {
            return false;
        }
        if settings.never_suspend_downloading && tab.is_downloading {
            return false;
        }
        if settings.never_suspend_forms && tab.has_unsaved_forms {
            return false;
        }
        if settings.never_suspend_notifications && tab.has_notifications {
            return false;
        }

        // Check timeout
        let minutes_inactive = (Utc::now() - tab.last_active).num_minutes() as u32;
        if minutes_inactive >= settings.suspend_after_minutes {
            return true;
        }

        // Check memory pressure
        if settings.aggressive_mode && tab.memory_usage_kb > settings.memory_per_tab_limit_mb as u64 * 1024 {
            return true;
        }

        false
    }

    pub fn auto_suspend_check(&self) -> Vec<String> {
        let tab_memory = self.tab_memory.read().unwrap();
        let to_suspend: Vec<String> = tab_memory.iter()
            .filter(|(tab_id, info)| {
                !self.is_tab_suspended(tab_id) && self.should_suspend(info)
            })
            .map(|(tab_id, _)| tab_id.clone())
            .collect();

        to_suspend
    }

    // ==================== Sessions ====================

    pub fn save_session(&self, name: &str) -> SuspendSession {
        let suspended = self.suspended_tabs.read().unwrap();
        let tabs: Vec<SuspendedTab> = suspended.values().cloned().collect();
        let total_memory: u64 = tabs.iter().map(|t| t.memory_freed_kb).sum();

        let session = SuspendSession {
            id: Uuid::new_v4().to_string(),
            name: name.to_string(),
            tabs,
            created_at: Utc::now(),
            total_memory_freed_kb: total_memory,
        };

        let id = session.id.clone();
        self.sessions.write().unwrap().insert(id, session.clone());

        session
    }

    pub fn get_session(&self, session_id: &str) -> Option<SuspendSession> {
        self.sessions.read().unwrap().get(session_id).cloned()
    }

    pub fn get_all_sessions(&self) -> Vec<SuspendSession> {
        self.sessions.read().unwrap().values().cloned().collect()
    }

    pub fn delete_session(&self, session_id: &str) -> Result<(), String> {
        self.sessions.write().unwrap()
            .remove(session_id)
            .ok_or_else(|| "Session not found".to_string())?;
        Ok(())
    }

    pub fn restore_session(&self, session_id: &str) -> Result<Vec<SuspendedTab>, String> {
        let sessions = self.sessions.read().unwrap();
        let session = sessions.get(session_id)
            .ok_or_else(|| "Session not found".to_string())?;

        Ok(session.tabs.clone())
    }

    // ==================== Stats ====================

    pub fn get_stats(&self) -> SuspenderStats {
        let mut stats = self.stats.read().unwrap().clone();
        stats.current_suspended_count = self.suspended_tabs.read().unwrap().len() as u32;
        stats
    }

    pub fn reset_daily_stats(&self) {
        let mut stats = self.stats.write().unwrap();
        stats.memory_saved_today_mb = 0;
        stats.suspend_events_today = 0;
    }
}

impl Default for BrowserTabSuspenderService {
    fn default() -> Self {
        Self::new()
    }
}
