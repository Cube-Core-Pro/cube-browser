// CUBE Nexum - Focus Mode Service
// Distraction-free browsing with site blocking, timers, and productivity tools

use std::collections::HashMap;
use std::sync::RwLock;
use chrono::{DateTime, Utc, Duration, Weekday};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// ==================== Types ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FocusSession {
    pub id: String,
    pub name: String,
    pub profile_id: String,
    pub started_at: DateTime<Utc>,
    pub scheduled_end: Option<DateTime<Utc>>,
    pub actual_end: Option<DateTime<Utc>>,
    pub duration_minutes: u32,
    pub break_count: u32,
    pub total_break_minutes: u32,
    pub blocked_attempts: u32,
    pub tabs_closed: u32,
    pub is_active: bool,
    pub is_paused: bool,
    pub pause_reason: Option<String>,
    pub notes: Option<String>,
    pub tags: Vec<String>,
    pub productivity_score: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FocusProfile {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub icon: String,
    pub color: String,
    pub blocked_sites: Vec<BlockedSite>,
    pub allowed_sites: Vec<String>,
    pub block_mode: BlockMode,
    pub session_duration_minutes: u32,
    pub break_duration_minutes: u32,
    pub breaks_per_session: u32,
    pub auto_start: bool,
    pub strict_mode: bool,
    pub show_blocked_page: bool,
    pub blocked_page_message: String,
    pub play_sounds: bool,
    pub show_notifications: bool,
    pub close_distracting_tabs: bool,
    pub hide_ui_elements: HideUIElements,
    pub timer_position: TimerPosition,
    pub keyboard_shortcuts: FocusShortcuts,
    pub schedule: Option<FocusSchedule>,
    pub is_default: bool,
    pub created_at: DateTime<Utc>,
    pub sessions_count: u32,
    pub total_focus_minutes: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockedSite {
    pub pattern: String,
    pub block_type: BlockType,
    pub is_regex: bool,
    pub block_subdomains: bool,
    pub schedule: Option<BlockSchedule>,
    pub cooldown_minutes: Option<u32>,
    pub daily_limit_minutes: Option<u32>,
    pub used_minutes_today: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum BlockType {
    Full,           // Completely blocked
    Timed,          // Allowed for limited time
    Scheduled,      // Blocked during certain hours
    Distraction,    // Soft block with warning
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum BlockMode {
    Blocklist,      // Block only listed sites
    Allowlist,      // Allow only listed sites
    Hybrid,         // Allow some, block others
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockSchedule {
    pub days: Vec<Weekday>,
    pub start_time: String,  // "HH:MM"
    pub end_time: String,    // "HH:MM"
    pub timezone: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FocusSchedule {
    pub enabled: bool,
    pub sessions: Vec<ScheduledSession>,
    pub auto_start: bool,
    pub notify_before_minutes: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScheduledSession {
    pub id: String,
    pub days: Vec<Weekday>,
    pub start_time: String,
    pub duration_minutes: u32,
    pub profile_id: String,
    pub is_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HideUIElements {
    pub hide_bookmarks: bool,
    pub hide_extensions: bool,
    pub hide_address_bar: bool,
    pub hide_tabs: bool,
    pub grayscale_mode: bool,
    pub minimal_theme: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TimerPosition {
    TopLeft,
    TopCenter,
    TopRight,
    BottomLeft,
    BottomCenter,
    BottomRight,
    Floating,
    Hidden,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FocusShortcuts {
    pub start_session: String,
    pub end_session: String,
    pub pause_session: String,
    pub start_break: String,
    pub toggle_timer: String,
    pub quick_block: String,
    pub quick_allow: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FocusSettings {
    pub enabled: bool,
    pub default_profile_id: Option<String>,
    pub pomodoro_mode: bool,
    pub pomodoro_work_minutes: u32,
    pub pomodoro_short_break: u32,
    pub pomodoro_long_break: u32,
    pub pomodoros_until_long_break: u32,
    pub auto_start_breaks: bool,
    pub auto_start_work: bool,
    pub strict_mode_password: Option<String>,
    pub require_password_to_disable: bool,
    pub sync_across_devices: bool,
    pub gamification_enabled: bool,
    pub daily_goal_minutes: u32,
    pub weekly_goal_minutes: u32,
    pub streak_enabled: bool,
    pub notification_sounds: NotificationSounds,
    pub blocked_page_style: BlockedPageStyle,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationSounds {
    pub session_start: Option<String>,
    pub session_end: Option<String>,
    pub break_start: Option<String>,
    pub break_end: Option<String>,
    pub site_blocked: Option<String>,
    pub goal_reached: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockedPageStyle {
    pub background_color: String,
    pub text_color: String,
    pub show_timer: bool,
    pub show_motivational_quote: bool,
    pub show_productivity_tips: bool,
    pub custom_html: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FocusStats {
    pub total_sessions: u32,
    pub total_focus_minutes: u32,
    pub total_break_minutes: u32,
    pub total_blocked_attempts: u32,
    pub avg_session_length_minutes: f32,
    pub avg_productivity_score: f32,
    pub current_streak_days: u32,
    pub longest_streak_days: u32,
    pub focus_by_day: HashMap<String, u32>,
    pub focus_by_profile: HashMap<String, u32>,
    pub most_blocked_sites: Vec<(String, u32)>,
    pub daily_goal_progress: f32,
    pub weekly_goal_progress: f32,
    pub achievements: Vec<Achievement>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Achievement {
    pub id: String,
    pub name: String,
    pub description: String,
    pub icon: String,
    pub unlocked_at: Option<DateTime<Utc>>,
    pub progress: f32,
    pub max_progress: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockCheckResult {
    pub is_blocked: bool,
    pub reason: Option<BlockReason>,
    pub site_name: String,
    pub cooldown_remaining_minutes: Option<u32>,
    pub daily_limit_remaining_minutes: Option<u32>,
    pub blocked_until: Option<DateTime<Utc>>,
    pub can_override: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum BlockReason {
    Blocklist,
    FocusSession,
    DailyLimit,
    Schedule,
    StrictMode,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MotivationalQuote {
    pub text: String,
    pub author: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductivityTip {
    pub title: String,
    pub content: String,
    pub category: String,
}

// ==================== Service Implementation ====================

pub struct BrowserFocusModeService {
    sessions: RwLock<HashMap<String, FocusSession>>,
    profiles: RwLock<HashMap<String, FocusProfile>>,
    settings: RwLock<FocusSettings>,
    active_session_id: RwLock<Option<String>>,
    daily_stats: RwLock<HashMap<String, u32>>,  // date -> minutes
    quotes: Vec<MotivationalQuote>,
    tips: Vec<ProductivityTip>,
}

impl BrowserFocusModeService {
    pub fn new() -> Self {
        let mut service = Self {
            sessions: RwLock::new(HashMap::new()),
            profiles: RwLock::new(HashMap::new()),
            settings: RwLock::new(Self::default_settings()),
            active_session_id: RwLock::new(None),
            daily_stats: RwLock::new(HashMap::new()),
            quotes: Self::default_quotes(),
            tips: Self::default_tips(),
        };

        // Create default profiles
        service.create_default_profiles();
        service
    }

    fn default_settings() -> FocusSettings {
        FocusSettings {
            enabled: true,
            default_profile_id: None,
            pomodoro_mode: true,
            pomodoro_work_minutes: 25,
            pomodoro_short_break: 5,
            pomodoro_long_break: 15,
            pomodoros_until_long_break: 4,
            auto_start_breaks: false,
            auto_start_work: false,
            strict_mode_password: None,
            require_password_to_disable: false,
            sync_across_devices: true,
            gamification_enabled: true,
            daily_goal_minutes: 240,
            weekly_goal_minutes: 1200,
            streak_enabled: true,
            notification_sounds: NotificationSounds {
                session_start: Some("focus_start.wav".to_string()),
                session_end: Some("focus_end.wav".to_string()),
                break_start: Some("break_start.wav".to_string()),
                break_end: Some("break_end.wav".to_string()),
                site_blocked: Some("blocked.wav".to_string()),
                goal_reached: Some("achievement.wav".to_string()),
            },
            blocked_page_style: BlockedPageStyle {
                background_color: "#1a1a2e".to_string(),
                text_color: "#e2e8f0".to_string(),
                show_timer: true,
                show_motivational_quote: true,
                show_productivity_tips: true,
                custom_html: None,
            },
        }
    }

    fn default_quotes() -> Vec<MotivationalQuote> {
        vec![
            MotivationalQuote {
                text: "The secret of getting ahead is getting started.".to_string(),
                author: "Mark Twain".to_string(),
            },
            MotivationalQuote {
                text: "Focus on being productive instead of busy.".to_string(),
                author: "Tim Ferriss".to_string(),
            },
            MotivationalQuote {
                text: "The way to get started is to quit talking and begin doing.".to_string(),
                author: "Walt Disney".to_string(),
            },
            MotivationalQuote {
                text: "Your focus determines your reality.".to_string(),
                author: "Qui-Gon Jinn".to_string(),
            },
            MotivationalQuote {
                text: "Concentrate all your thoughts upon the work in hand.".to_string(),
                author: "Alexander Graham Bell".to_string(),
            },
        ]
    }

    fn default_tips() -> Vec<ProductivityTip> {
        vec![
            ProductivityTip {
                title: "Two-Minute Rule".to_string(),
                content: "If a task takes less than two minutes, do it immediately.".to_string(),
                category: "time_management".to_string(),
            },
            ProductivityTip {
                title: "Deep Work".to_string(),
                content: "Schedule blocks of uninterrupted time for complex tasks.".to_string(),
                category: "focus".to_string(),
            },
            ProductivityTip {
                title: "Batch Similar Tasks".to_string(),
                content: "Group similar tasks together to maintain mental context.".to_string(),
                category: "efficiency".to_string(),
            },
        ]
    }

    fn create_default_profiles(&mut self) {
        let profiles = vec![
            FocusProfile {
                id: "work".to_string(),
                name: "Work".to_string(),
                description: Some("Block social media and entertainment during work hours".to_string()),
                icon: "💼".to_string(),
                color: "#3b82f6".to_string(),
                blocked_sites: vec![
                    BlockedSite {
                        pattern: "facebook.com".to_string(),
                        block_type: BlockType::Full,
                        is_regex: false,
                        block_subdomains: true,
                        schedule: None,
                        cooldown_minutes: None,
                        daily_limit_minutes: None,
                        used_minutes_today: 0,
                    },
                    BlockedSite {
                        pattern: "twitter.com".to_string(),
                        block_type: BlockType::Full,
                        is_regex: false,
                        block_subdomains: true,
                        schedule: None,
                        cooldown_minutes: None,
                        daily_limit_minutes: None,
                        used_minutes_today: 0,
                    },
                    BlockedSite {
                        pattern: "youtube.com".to_string(),
                        block_type: BlockType::Timed,
                        is_regex: false,
                        block_subdomains: true,
                        schedule: None,
                        cooldown_minutes: Some(30),
                        daily_limit_minutes: Some(30),
                        used_minutes_today: 0,
                    },
                    BlockedSite {
                        pattern: "reddit.com".to_string(),
                        block_type: BlockType::Full,
                        is_regex: false,
                        block_subdomains: true,
                        schedule: None,
                        cooldown_minutes: None,
                        daily_limit_minutes: None,
                        used_minutes_today: 0,
                    },
                    BlockedSite {
                        pattern: "instagram.com".to_string(),
                        block_type: BlockType::Full,
                        is_regex: false,
                        block_subdomains: true,
                        schedule: None,
                        cooldown_minutes: None,
                        daily_limit_minutes: None,
                        used_minutes_today: 0,
                    },
                    BlockedSite {
                        pattern: "tiktok.com".to_string(),
                        block_type: BlockType::Full,
                        is_regex: false,
                        block_subdomains: true,
                        schedule: None,
                        cooldown_minutes: None,
                        daily_limit_minutes: None,
                        used_minutes_today: 0,
                    },
                ],
                allowed_sites: Vec::new(),
                block_mode: BlockMode::Blocklist,
                session_duration_minutes: 50,
                break_duration_minutes: 10,
                breaks_per_session: 1,
                auto_start: false,
                strict_mode: false,
                show_blocked_page: true,
                blocked_page_message: "Stay focused! This site is blocked during work.".to_string(),
                play_sounds: true,
                show_notifications: true,
                close_distracting_tabs: true,
                hide_ui_elements: HideUIElements {
                    hide_bookmarks: false,
                    hide_extensions: false,
                    hide_address_bar: false,
                    hide_tabs: false,
                    grayscale_mode: false,
                    minimal_theme: false,
                },
                timer_position: TimerPosition::TopRight,
                keyboard_shortcuts: FocusShortcuts {
                    start_session: "Ctrl+Shift+F".to_string(),
                    end_session: "Ctrl+Shift+E".to_string(),
                    pause_session: "Ctrl+Shift+P".to_string(),
                    start_break: "Ctrl+Shift+B".to_string(),
                    toggle_timer: "Ctrl+Shift+T".to_string(),
                    quick_block: "Ctrl+Shift+X".to_string(),
                    quick_allow: "Ctrl+Shift+A".to_string(),
                },
                schedule: None,
                is_default: true,
                created_at: Utc::now(),
                sessions_count: 0,
                total_focus_minutes: 0,
            },
            FocusProfile {
                id: "study".to_string(),
                name: "Study".to_string(),
                description: Some("Maximum focus for studying".to_string()),
                icon: "📚".to_string(),
                color: "#8b5cf6".to_string(),
                blocked_sites: vec![
                    BlockedSite {
                        pattern: ".*social.*".to_string(),
                        block_type: BlockType::Full,
                        is_regex: true,
                        block_subdomains: true,
                        schedule: None,
                        cooldown_minutes: None,
                        daily_limit_minutes: None,
                        used_minutes_today: 0,
                    },
                    BlockedSite {
                        pattern: ".*games.*".to_string(),
                        block_type: BlockType::Full,
                        is_regex: true,
                        block_subdomains: true,
                        schedule: None,
                        cooldown_minutes: None,
                        daily_limit_minutes: None,
                        used_minutes_today: 0,
                    },
                ],
                allowed_sites: vec![
                    "wikipedia.org".to_string(),
                    "scholar.google.com".to_string(),
                    "*.edu".to_string(),
                ],
                block_mode: BlockMode::Hybrid,
                session_duration_minutes: 45,
                break_duration_minutes: 15,
                breaks_per_session: 2,
                auto_start: false,
                strict_mode: true,
                show_blocked_page: true,
                blocked_page_message: "Focus on your studies! You can do this!".to_string(),
                play_sounds: true,
                show_notifications: true,
                close_distracting_tabs: true,
                hide_ui_elements: HideUIElements {
                    hide_bookmarks: true,
                    hide_extensions: true,
                    hide_address_bar: false,
                    hide_tabs: false,
                    grayscale_mode: false,
                    minimal_theme: true,
                },
                timer_position: TimerPosition::Floating,
                keyboard_shortcuts: FocusShortcuts {
                    start_session: "Ctrl+Shift+F".to_string(),
                    end_session: "Ctrl+Shift+E".to_string(),
                    pause_session: "Ctrl+Shift+P".to_string(),
                    start_break: "Ctrl+Shift+B".to_string(),
                    toggle_timer: "Ctrl+Shift+T".to_string(),
                    quick_block: "Ctrl+Shift+X".to_string(),
                    quick_allow: "Ctrl+Shift+A".to_string(),
                },
                schedule: None,
                is_default: false,
                created_at: Utc::now(),
                sessions_count: 0,
                total_focus_minutes: 0,
            },
            FocusProfile {
                id: "zen".to_string(),
                name: "Zen Mode".to_string(),
                description: Some("Minimal distractions, maximum calm".to_string()),
                icon: "🧘".to_string(),
                color: "#10b981".to_string(),
                blocked_sites: Vec::new(),
                allowed_sites: Vec::new(),
                block_mode: BlockMode::Blocklist,
                session_duration_minutes: 60,
                break_duration_minutes: 10,
                breaks_per_session: 0,
                auto_start: false,
                strict_mode: false,
                show_blocked_page: false,
                blocked_page_message: String::new(),
                play_sounds: false,
                show_notifications: false,
                close_distracting_tabs: false,
                hide_ui_elements: HideUIElements {
                    hide_bookmarks: true,
                    hide_extensions: true,
                    hide_address_bar: true,
                    hide_tabs: true,
                    grayscale_mode: true,
                    minimal_theme: true,
                },
                timer_position: TimerPosition::Hidden,
                keyboard_shortcuts: FocusShortcuts {
                    start_session: "Ctrl+Shift+F".to_string(),
                    end_session: "Ctrl+Shift+E".to_string(),
                    pause_session: "Ctrl+Shift+P".to_string(),
                    start_break: "Ctrl+Shift+B".to_string(),
                    toggle_timer: "Ctrl+Shift+T".to_string(),
                    quick_block: "Ctrl+Shift+X".to_string(),
                    quick_allow: "Ctrl+Shift+A".to_string(),
                },
                schedule: None,
                is_default: false,
                created_at: Utc::now(),
                sessions_count: 0,
                total_focus_minutes: 0,
            },
        ];

        let mut profiles_map = self.profiles.write().unwrap();
        for profile in profiles {
            profiles_map.insert(profile.id.clone(), profile);
        }
    }

    // ==================== Settings ====================

    pub fn get_settings(&self) -> FocusSettings {
        self.settings.read().unwrap().clone()
    }

    pub fn update_settings(&self, new_settings: FocusSettings) {
        let mut settings = self.settings.write().unwrap();
        *settings = new_settings;
    }

    // ==================== Profiles ====================

    pub fn get_profile(&self, profile_id: &str) -> Option<FocusProfile> {
        self.profiles.read().unwrap().get(profile_id).cloned()
    }

    pub fn get_all_profiles(&self) -> Vec<FocusProfile> {
        self.profiles.read().unwrap().values().cloned().collect()
    }

    pub fn create_profile(&self, name: String, description: Option<String>) -> FocusProfile {
        let profile = FocusProfile {
            id: Uuid::new_v4().to_string(),
            name,
            description,
            icon: "🎯".to_string(),
            color: "#6366f1".to_string(),
            blocked_sites: Vec::new(),
            allowed_sites: Vec::new(),
            block_mode: BlockMode::Blocklist,
            session_duration_minutes: 25,
            break_duration_minutes: 5,
            breaks_per_session: 1,
            auto_start: false,
            strict_mode: false,
            show_blocked_page: true,
            blocked_page_message: "Stay focused!".to_string(),
            play_sounds: true,
            show_notifications: true,
            close_distracting_tabs: false,
            hide_ui_elements: HideUIElements {
                hide_bookmarks: false,
                hide_extensions: false,
                hide_address_bar: false,
                hide_tabs: false,
                grayscale_mode: false,
                minimal_theme: false,
            },
            timer_position: TimerPosition::TopRight,
            keyboard_shortcuts: FocusShortcuts {
                start_session: "Ctrl+Shift+F".to_string(),
                end_session: "Ctrl+Shift+E".to_string(),
                pause_session: "Ctrl+Shift+P".to_string(),
                start_break: "Ctrl+Shift+B".to_string(),
                toggle_timer: "Ctrl+Shift+T".to_string(),
                quick_block: "Ctrl+Shift+X".to_string(),
                quick_allow: "Ctrl+Shift+A".to_string(),
            },
            schedule: None,
            is_default: false,
            created_at: Utc::now(),
            sessions_count: 0,
            total_focus_minutes: 0,
        };

        let id = profile.id.clone();
        self.profiles.write().unwrap().insert(id, profile.clone());
        profile
    }

    pub fn update_profile(&self, profile_id: &str, updates: ProfileUpdate) -> Result<FocusProfile, String> {
        let mut profiles = self.profiles.write().unwrap();
        let profile = profiles.get_mut(profile_id)
            .ok_or_else(|| "Profile not found".to_string())?;

        if let Some(name) = updates.name {
            profile.name = name;
        }
        if let Some(description) = updates.description {
            profile.description = Some(description);
        }
        if let Some(icon) = updates.icon {
            profile.icon = icon;
        }
        if let Some(color) = updates.color {
            profile.color = color;
        }
        if let Some(duration) = updates.session_duration_minutes {
            profile.session_duration_minutes = duration;
        }
        if let Some(break_duration) = updates.break_duration_minutes {
            profile.break_duration_minutes = break_duration;
        }
        if let Some(strict) = updates.strict_mode {
            profile.strict_mode = strict;
        }
        if let Some(blocked) = updates.blocked_sites {
            profile.blocked_sites = blocked;
        }
        if let Some(allowed) = updates.allowed_sites {
            profile.allowed_sites = allowed;
        }

        Ok(profile.clone())
    }

    pub fn delete_profile(&self, profile_id: &str) -> Result<(), String> {
        let profiles = self.profiles.read().unwrap();
        if profiles.get(profile_id).map(|p| p.is_default).unwrap_or(false) {
            return Err("Cannot delete default profile".to_string());
        }
        drop(profiles);

        self.profiles.write().unwrap()
            .remove(profile_id)
            .ok_or_else(|| "Profile not found".to_string())?;
        Ok(())
    }

    // ==================== Sessions ====================

    pub fn start_session(&self, profile_id: &str, name: Option<String>) -> Result<FocusSession, String> {
        // Check if already in session
        if self.active_session_id.read().unwrap().is_some() {
            return Err("A focus session is already active".to_string());
        }

        let profile = self.get_profile(profile_id)
            .ok_or_else(|| "Profile not found".to_string())?;

        let now = Utc::now();
        let duration = Duration::minutes(profile.session_duration_minutes as i64);

        let session = FocusSession {
            id: Uuid::new_v4().to_string(),
            name: name.unwrap_or_else(|| format!("{} Session", profile.name)),
            profile_id: profile_id.to_string(),
            started_at: now,
            scheduled_end: Some(now + duration),
            actual_end: None,
            duration_minutes: 0,
            break_count: 0,
            total_break_minutes: 0,
            blocked_attempts: 0,
            tabs_closed: 0,
            is_active: true,
            is_paused: false,
            pause_reason: None,
            notes: None,
            tags: Vec::new(),
            productivity_score: 0.0,
        };

        let id = session.id.clone();
        self.sessions.write().unwrap().insert(id.clone(), session.clone());
        *self.active_session_id.write().unwrap() = Some(id);

        // Update profile stats
        let mut profiles = self.profiles.write().unwrap();
        if let Some(p) = profiles.get_mut(profile_id) {
            p.sessions_count += 1;
        }

        Ok(session)
    }

    pub fn end_session(&self) -> Result<FocusSession, String> {
        let session_id = self.active_session_id.read().unwrap().clone()
            .ok_or_else(|| "No active session".to_string())?;

        let mut sessions = self.sessions.write().unwrap();
        let session = sessions.get_mut(&session_id)
            .ok_or_else(|| "Session not found".to_string())?;

        let now = Utc::now();
        session.actual_end = Some(now);
        session.is_active = false;
        session.duration_minutes = (now - session.started_at).num_minutes() as u32;

        // Calculate productivity score
        session.productivity_score = self.calculate_productivity_score(session);

        let session_clone = session.clone();
        drop(sessions);

        // Update profile total minutes
        let mut profiles = self.profiles.write().unwrap();
        if let Some(p) = profiles.get_mut(&session_clone.profile_id) {
            p.total_focus_minutes += session_clone.duration_minutes;
        }
        drop(profiles);

        // Update daily stats
        let date_key = now.format("%Y-%m-%d").to_string();
        let mut daily = self.daily_stats.write().unwrap();
        *daily.entry(date_key).or_insert(0) += session_clone.duration_minutes;

        *self.active_session_id.write().unwrap() = None;

        Ok(session_clone)
    }

    fn calculate_productivity_score(&self, session: &FocusSession) -> f32 {
        let base_score = 100.0;
        let blocked_penalty = (session.blocked_attempts as f32) * 2.0;
        let pause_penalty = if session.is_paused { 10.0 } else { 0.0 };
        
        (base_score - blocked_penalty - pause_penalty).max(0.0)
    }

    pub fn pause_session(&self, reason: Option<String>) -> Result<(), String> {
        let session_id = self.active_session_id.read().unwrap().clone()
            .ok_or_else(|| "No active session".to_string())?;

        let mut sessions = self.sessions.write().unwrap();
        let session = sessions.get_mut(&session_id)
            .ok_or_else(|| "Session not found".to_string())?;

        session.is_paused = true;
        session.pause_reason = reason;

        Ok(())
    }

    pub fn resume_session(&self) -> Result<(), String> {
        let session_id = self.active_session_id.read().unwrap().clone()
            .ok_or_else(|| "No active session".to_string())?;

        let mut sessions = self.sessions.write().unwrap();
        let session = sessions.get_mut(&session_id)
            .ok_or_else(|| "Session not found".to_string())?;

        session.is_paused = false;
        session.pause_reason = None;

        Ok(())
    }

    pub fn get_active_session(&self) -> Option<FocusSession> {
        let session_id = self.active_session_id.read().unwrap();
        session_id.as_ref().and_then(|id| {
            self.sessions.read().unwrap().get(id).cloned()
        })
    }

    pub fn get_session_history(&self, limit: usize) -> Vec<FocusSession> {
        let mut sessions: Vec<_> = self.sessions.read().unwrap()
            .values()
            .filter(|s| !s.is_active)
            .cloned()
            .collect();
        
        sessions.sort_by(|a, b| b.started_at.cmp(&a.started_at));
        sessions.truncate(limit);
        sessions
    }

    // ==================== Blocking ====================

    pub fn check_site(&self, url: &str) -> BlockCheckResult {
        let active_session = self.get_active_session();
        
        if active_session.is_none() {
            return BlockCheckResult {
                is_blocked: false,
                reason: None,
                site_name: self.extract_site_name(url),
                cooldown_remaining_minutes: None,
                daily_limit_remaining_minutes: None,
                blocked_until: None,
                can_override: true,
            };
        }

        let session = active_session.unwrap();
        let profile = match self.get_profile(&session.profile_id) {
            Some(p) => p,
            None => return BlockCheckResult {
                is_blocked: false,
                reason: None,
                site_name: self.extract_site_name(url),
                cooldown_remaining_minutes: None,
                daily_limit_remaining_minutes: None,
                blocked_until: None,
                can_override: true,
            },
        };

        let site_name = self.extract_site_name(url);

        // Check allowlist first
        if profile.block_mode == BlockMode::Allowlist || profile.block_mode == BlockMode::Hybrid {
            for allowed in &profile.allowed_sites {
                if self.matches_pattern(url, allowed, false) {
                    return BlockCheckResult {
                        is_blocked: false,
                        reason: None,
                        site_name,
                        cooldown_remaining_minutes: None,
                        daily_limit_remaining_minutes: None,
                        blocked_until: None,
                        can_override: true,
                    };
                }
            }
        }

        // Check blocklist
        for blocked in &profile.blocked_sites {
            if self.matches_pattern(url, &blocked.pattern, blocked.is_regex) {
                match blocked.block_type {
                    BlockType::Full => {
                        return BlockCheckResult {
                            is_blocked: true,
                            reason: Some(BlockReason::Blocklist),
                            site_name,
                            cooldown_remaining_minutes: None,
                            daily_limit_remaining_minutes: None,
                            blocked_until: session.scheduled_end,
                            can_override: !profile.strict_mode,
                        };
                    }
                    BlockType::Timed => {
                        if let Some(limit) = blocked.daily_limit_minutes {
                            let remaining = limit.saturating_sub(blocked.used_minutes_today);
                            if remaining == 0 {
                                return BlockCheckResult {
                                    is_blocked: true,
                                    reason: Some(BlockReason::DailyLimit),
                                    site_name,
                                    cooldown_remaining_minutes: None,
                                    daily_limit_remaining_minutes: Some(0),
                                    blocked_until: None,
                                    can_override: !profile.strict_mode,
                                };
                            }
                        }
                    }
                    BlockType::Scheduled => {
                        // Check schedule
                        if blocked.schedule.is_some() {
                            return BlockCheckResult {
                                is_blocked: true,
                                reason: Some(BlockReason::Schedule),
                                site_name,
                                cooldown_remaining_minutes: None,
                                daily_limit_remaining_minutes: None,
                                blocked_until: None,
                                can_override: !profile.strict_mode,
                            };
                        }
                    }
                    BlockType::Distraction => {
                        // Soft block - just warn
                    }
                }
            }
        }

        // Allowlist mode: block everything not allowed
        if profile.block_mode == BlockMode::Allowlist {
            return BlockCheckResult {
                is_blocked: true,
                reason: Some(BlockReason::Blocklist),
                site_name,
                cooldown_remaining_minutes: None,
                daily_limit_remaining_minutes: None,
                blocked_until: session.scheduled_end,
                can_override: !profile.strict_mode,
            };
        }

        BlockCheckResult {
            is_blocked: false,
            reason: None,
            site_name,
            cooldown_remaining_minutes: None,
            daily_limit_remaining_minutes: None,
            blocked_until: None,
            can_override: true,
        }
    }

    fn extract_site_name(&self, url: &str) -> String {
        url::Url::parse(url)
            .ok()
            .and_then(|u| u.host_str().map(|h| h.to_string()))
            .unwrap_or_else(|| url.to_string())
    }

    fn matches_pattern(&self, url: &str, pattern: &str, is_regex: bool) -> bool {
        if is_regex {
            regex::Regex::new(pattern)
                .map(|re| re.is_match(url))
                .unwrap_or(false)
        } else {
            url.contains(pattern)
        }
    }

    pub fn record_blocked_attempt(&self) {
        if let Some(session_id) = self.active_session_id.read().unwrap().clone() {
            let mut sessions = self.sessions.write().unwrap();
            if let Some(session) = sessions.get_mut(&session_id) {
                session.blocked_attempts += 1;
            }
        }
    }

    // ==================== Statistics ====================

    pub fn get_stats(&self) -> FocusStats {
        let sessions = self.sessions.read().unwrap();
        let profiles = self.profiles.read().unwrap();
        let daily = self.daily_stats.read().unwrap();
        let settings = self.settings.read().unwrap();

        let completed_sessions: Vec<_> = sessions.values()
            .filter(|s| !s.is_active)
            .collect();

        let total_sessions = completed_sessions.len() as u32;
        let total_focus: u32 = completed_sessions.iter().map(|s| s.duration_minutes).sum();
        let total_breaks: u32 = completed_sessions.iter().map(|s| s.total_break_minutes).sum();
        let total_blocked: u32 = completed_sessions.iter().map(|s| s.blocked_attempts).sum();

        let avg_length = if total_sessions > 0 {
            total_focus as f32 / total_sessions as f32
        } else {
            0.0
        };

        let avg_score = if total_sessions > 0 {
            completed_sessions.iter().map(|s| s.productivity_score).sum::<f32>() / total_sessions as f32
        } else {
            0.0
        };

        let focus_by_day: HashMap<String, u32> = daily.clone();

        let mut focus_by_profile: HashMap<String, u32> = HashMap::new();
        for profile in profiles.values() {
            focus_by_profile.insert(profile.name.clone(), profile.total_focus_minutes);
        }

        let today = Utc::now().format("%Y-%m-%d").to_string();
        let today_minutes = daily.get(&today).copied().unwrap_or(0);
        let daily_progress = (today_minutes as f32 / settings.daily_goal_minutes as f32).min(1.0);

        FocusStats {
            total_sessions,
            total_focus_minutes: total_focus,
            total_break_minutes: total_breaks,
            total_blocked_attempts: total_blocked,
            avg_session_length_minutes: avg_length,
            avg_productivity_score: avg_score,
            current_streak_days: self.calculate_streak(),
            longest_streak_days: 0, // Would need historical tracking
            focus_by_day,
            focus_by_profile,
            most_blocked_sites: Vec::new(), // Would need site tracking
            daily_goal_progress: daily_progress,
            weekly_goal_progress: 0.0, // Would need weekly calculation
            achievements: self.get_achievements(),
        }
    }

    fn calculate_streak(&self) -> u32 {
        let daily = self.daily_stats.read().unwrap();
        let settings = self.settings.read().unwrap();
        let mut streak = 0u32;
        let mut date = Utc::now();

        loop {
            let key = date.format("%Y-%m-%d").to_string();
            if let Some(&minutes) = daily.get(&key) {
                if minutes >= settings.daily_goal_minutes / 2 {
                    streak += 1;
                    date = date - Duration::days(1);
                } else {
                    break;
                }
            } else {
                break;
            }

            if streak > 365 {
                break; // Safety limit
            }
        }

        streak
    }

    fn get_achievements(&self) -> Vec<Achievement> {
        vec![
            Achievement {
                id: "first_session".to_string(),
                name: "First Focus".to_string(),
                description: "Complete your first focus session".to_string(),
                icon: "🎯".to_string(),
                unlocked_at: None,
                progress: 0.0,
                max_progress: 1.0,
            },
            Achievement {
                id: "streak_7".to_string(),
                name: "Week Warrior".to_string(),
                description: "Maintain a 7-day streak".to_string(),
                icon: "🔥".to_string(),
                unlocked_at: None,
                progress: 0.0,
                max_progress: 7.0,
            },
            Achievement {
                id: "focus_100".to_string(),
                name: "Century".to_string(),
                description: "Focus for 100 hours total".to_string(),
                icon: "💯".to_string(),
                unlocked_at: None,
                progress: 0.0,
                max_progress: 6000.0,
            },
        ]
    }

    pub fn get_random_quote(&self) -> MotivationalQuote {
        let index = (Utc::now().timestamp() as usize) % self.quotes.len();
        self.quotes.get(index).cloned().unwrap_or_else(|| MotivationalQuote {
            text: "Stay focused!".to_string(),
            author: "CUBE Nexum".to_string(),
        })
    }

    pub fn get_random_tip(&self) -> ProductivityTip {
        let index = (Utc::now().timestamp() as usize) % self.tips.len();
        self.tips.get(index).cloned().unwrap_or_else(|| ProductivityTip {
            title: "Focus".to_string(),
            content: "Stay on task!".to_string(),
            category: "general".to_string(),
        })
    }
}

// ==================== Update Types ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileUpdate {
    pub name: Option<String>,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub session_duration_minutes: Option<u32>,
    pub break_duration_minutes: Option<u32>,
    pub strict_mode: Option<bool>,
    pub blocked_sites: Option<Vec<BlockedSite>>,
    pub allowed_sites: Option<Vec<String>>,
}

impl Default for BrowserFocusModeService {
    fn default() -> Self {
        Self::new()
    }
}
