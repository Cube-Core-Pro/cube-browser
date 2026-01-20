// CUBE Nexum - Smart Sessions Service
// Intelligent session management with AI-powered recovery and context preservation

use std::collections::HashMap;
use std::sync::RwLock;
use chrono::{DateTime, Utc, Duration};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// ==================== Types ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmartSession {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub session_type: SessionType,
    pub tabs: Vec<SessionTab>,
    pub windows: Vec<SessionWindow>,
    pub workspaces_snapshot: Vec<WorkspaceSnapshot>,
    pub scroll_positions: HashMap<String, ScrollPosition>,
    pub form_data: HashMap<String, FormSnapshot>,
    pub media_states: HashMap<String, MediaState>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub last_accessed: DateTime<Utc>,
    pub access_count: u32,
    pub is_pinned: bool,
    pub is_auto_saved: bool,
    pub tags: Vec<String>,
    pub context: SessionContext,
    pub recovery_data: RecoveryData,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SessionType {
    /// Manually saved session
    Manual,
    /// Auto-saved periodic snapshot
    AutoSave,
    /// Crash recovery session
    CrashRecovery,
    /// Scheduled snapshot
    Scheduled,
    /// Quick save (temporary)
    QuickSave,
    /// Project/workspace session
    Project,
    /// Shared session
    Shared,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionTab {
    pub id: String,
    pub url: String,
    pub title: String,
    pub favicon_url: Option<String>,
    pub is_pinned: bool,
    pub is_muted: bool,
    pub is_audible: bool,
    pub stack_id: Option<String>,
    pub group_id: Option<String>,
    pub workspace_id: Option<String>,
    pub position: i32,
    pub window_id: String,
    pub last_access: DateTime<Utc>,
    pub navigation_history: Vec<NavigationEntry>,
    pub reader_mode_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NavigationEntry {
    pub url: String,
    pub title: String,
    pub visited_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionWindow {
    pub id: String,
    pub name: Option<String>,
    pub bounds: WindowBounds,
    pub state: WindowState,
    pub is_focused: bool,
    pub active_tab_id: Option<String>,
    pub tab_ids: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowBounds {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum WindowState {
    Normal,
    Maximized,
    Minimized,
    Fullscreen,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceSnapshot {
    pub id: String,
    pub name: String,
    pub color: String,
    pub icon: Option<String>,
    pub tab_ids: Vec<String>,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScrollPosition {
    pub tab_id: String,
    pub url: String,
    pub scroll_x: f64,
    pub scroll_y: f64,
    pub scroll_percentage: f32,
    pub captured_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FormSnapshot {
    pub tab_id: String,
    pub url: String,
    pub form_id: Option<String>,
    pub fields: HashMap<String, String>,
    pub captured_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaState {
    pub tab_id: String,
    pub url: String,
    pub media_type: MediaType,
    pub current_time: f64,
    pub duration: f64,
    pub is_playing: bool,
    pub volume: f32,
    pub playback_rate: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum MediaType {
    Video,
    Audio,
    Stream,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionContext {
    pub project_name: Option<String>,
    pub task_description: Option<String>,
    pub related_sessions: Vec<String>,
    pub ai_summary: Option<String>,
    pub keywords: Vec<String>,
    pub category: Option<String>,
    pub mood: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecoveryData {
    pub is_recoverable: bool,
    pub recovery_attempts: u32,
    pub last_recovery_attempt: Option<DateTime<Utc>>,
    pub crash_data: Option<CrashData>,
    pub backup_location: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CrashData {
    pub crash_timestamp: DateTime<Utc>,
    pub error_message: Option<String>,
    pub crash_type: String,
    pub affected_tabs: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmartSessionSettings {
    pub auto_save_enabled: bool,
    pub auto_save_interval_seconds: u32,
    pub max_auto_saves: u32,
    pub crash_recovery_enabled: bool,
    pub restore_on_startup: RestoreOption,
    pub restore_scroll_positions: bool,
    pub restore_form_data: bool,
    pub restore_media_states: bool,
    pub preserve_tab_stacks: bool,
    pub preserve_workspaces: bool,
    pub quick_save_shortcut: String,
    pub session_encryption: bool,
    pub cloud_sync_sessions: bool,
    pub ai_categorization: bool,
    pub max_sessions: u32,
    pub max_tabs_per_session: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum RestoreOption {
    /// Don't restore anything
    None,
    /// Restore last session
    LastSession,
    /// Restore all windows and tabs
    AllWindows,
    /// Ask user what to restore
    Ask,
    /// Restore specific session
    SpecificSession(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionStats {
    pub total_sessions: u32,
    pub manual_sessions: u32,
    pub auto_saved_sessions: u32,
    pub crash_recovery_sessions: u32,
    pub total_tabs_across_sessions: u32,
    pub avg_tabs_per_session: f32,
    pub most_visited_domains: Vec<(String, u32)>,
    pub sessions_by_tag: HashMap<String, u32>,
    pub storage_used_mb: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionSearchResult {
    pub session: SmartSession,
    pub match_score: f32,
    pub matched_fields: Vec<String>,
    pub highlight_snippets: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionComparison {
    pub session_a_id: String,
    pub session_b_id: String,
    pub common_tabs: Vec<String>,
    pub unique_to_a: Vec<String>,
    pub unique_to_b: Vec<String>,
    pub similarity_score: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionSchedule {
    pub id: String,
    pub name: String,
    pub cron_expression: String,
    pub is_enabled: bool,
    pub last_run: Option<DateTime<Utc>>,
    pub next_run: Option<DateTime<Utc>>,
    pub retention_days: u32,
}

// ==================== Service Implementation ====================

pub struct BrowserSmartSessionsService {
    sessions: RwLock<HashMap<String, SmartSession>>,
    settings: RwLock<SmartSessionSettings>,
    schedules: RwLock<Vec<SessionSchedule>>,
    current_auto_save_id: RwLock<Option<String>>,
}

impl BrowserSmartSessionsService {
    pub fn new() -> Self {
        Self {
            sessions: RwLock::new(HashMap::new()),
            settings: RwLock::new(Self::default_settings()),
            schedules: RwLock::new(Vec::new()),
            current_auto_save_id: RwLock::new(None),
        }
    }

    fn default_settings() -> SmartSessionSettings {
        SmartSessionSettings {
            auto_save_enabled: true,
            auto_save_interval_seconds: 60,
            max_auto_saves: 10,
            crash_recovery_enabled: true,
            restore_on_startup: RestoreOption::Ask,
            restore_scroll_positions: true,
            restore_form_data: false,
            restore_media_states: true,
            preserve_tab_stacks: true,
            preserve_workspaces: true,
            quick_save_shortcut: "Ctrl+Shift+S".to_string(),
            session_encryption: false,
            cloud_sync_sessions: false,
            ai_categorization: true,
            max_sessions: 100,
            max_tabs_per_session: 500,
        }
    }

    // ==================== Settings ====================

    pub fn get_settings(&self) -> SmartSessionSettings {
        self.settings.read().unwrap().clone()
    }

    pub fn update_settings(&self, new_settings: SmartSessionSettings) {
        let mut settings = self.settings.write().unwrap();
        *settings = new_settings;
    }

    // ==================== Session CRUD ====================

    pub fn create_session(
        &self,
        name: String,
        session_type: SessionType,
        tabs: Vec<SessionTab>,
        windows: Vec<SessionWindow>,
    ) -> Result<SmartSession, String> {
        let settings = self.settings.read().unwrap();
        
        if tabs.len() > settings.max_tabs_per_session as usize {
            return Err(format!(
                "Session exceeds maximum tabs limit ({})",
                settings.max_tabs_per_session
            ));
        }

        let now = Utc::now();
        let session = SmartSession {
            id: Uuid::new_v4().to_string(),
            name: if name.is_empty() {
                format!("Session {}", now.format("%Y-%m-%d %H:%M"))
            } else {
                name
            },
            description: None,
            session_type,
            tabs,
            windows,
            workspaces_snapshot: Vec::new(),
            scroll_positions: HashMap::new(),
            form_data: HashMap::new(),
            media_states: HashMap::new(),
            created_at: now,
            updated_at: now,
            last_accessed: now,
            access_count: 0,
            is_pinned: false,
            is_auto_saved: false,
            tags: Vec::new(),
            context: SessionContext {
                project_name: None,
                task_description: None,
                related_sessions: Vec::new(),
                ai_summary: None,
                keywords: Vec::new(),
                category: None,
                mood: None,
            },
            recovery_data: RecoveryData {
                is_recoverable: true,
                recovery_attempts: 0,
                last_recovery_attempt: None,
                crash_data: None,
                backup_location: None,
            },
        };

        let session_clone = session.clone();
        self.sessions.write().unwrap().insert(session.id.clone(), session);

        // Cleanup old sessions if needed
        self.cleanup_old_sessions();

        Ok(session_clone)
    }

    pub fn get_session(&self, session_id: &str) -> Option<SmartSession> {
        let mut sessions = self.sessions.write().unwrap();
        if let Some(session) = sessions.get_mut(session_id) {
            session.access_count += 1;
            session.last_accessed = Utc::now();
            Some(session.clone())
        } else {
            None
        }
    }

    pub fn get_all_sessions(&self) -> Vec<SmartSession> {
        let sessions = self.sessions.read().unwrap();
        let mut result: Vec<_> = sessions.values().cloned().collect();
        result.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
        result
    }

    pub fn get_sessions_by_type(&self, session_type: SessionType) -> Vec<SmartSession> {
        self.sessions.read().unwrap()
            .values()
            .filter(|s| s.session_type == session_type)
            .cloned()
            .collect()
    }

    pub fn get_pinned_sessions(&self) -> Vec<SmartSession> {
        self.sessions.read().unwrap()
            .values()
            .filter(|s| s.is_pinned)
            .cloned()
            .collect()
    }

    pub fn update_session(&self, session_id: &str, updates: SessionUpdate) -> Result<SmartSession, String> {
        let mut sessions = self.sessions.write().unwrap();
        let session = sessions.get_mut(session_id)
            .ok_or_else(|| "Session not found".to_string())?;

        if let Some(name) = updates.name {
            session.name = name;
        }
        if let Some(desc) = updates.description {
            session.description = Some(desc);
        }
        if let Some(tags) = updates.tags {
            session.tags = tags;
        }
        if let Some(pinned) = updates.is_pinned {
            session.is_pinned = pinned;
        }
        if let Some(context) = updates.context {
            session.context = context;
        }

        session.updated_at = Utc::now();
        Ok(session.clone())
    }

    pub fn delete_session(&self, session_id: &str) -> Result<(), String> {
        self.sessions.write().unwrap()
            .remove(session_id)
            .ok_or_else(|| "Session not found".to_string())?;
        Ok(())
    }

    pub fn toggle_pin(&self, session_id: &str) -> Result<bool, String> {
        let mut sessions = self.sessions.write().unwrap();
        let session = sessions.get_mut(session_id)
            .ok_or_else(|| "Session not found".to_string())?;
        
        session.is_pinned = !session.is_pinned;
        session.updated_at = Utc::now();
        Ok(session.is_pinned)
    }

    // ==================== Auto Save ====================

    pub fn auto_save(&self, tabs: Vec<SessionTab>, windows: Vec<SessionWindow>) -> Result<SmartSession, String> {
        let settings = self.settings.read().unwrap();
        if !settings.auto_save_enabled {
            return Err("Auto-save is disabled".to_string());
        }

        // Delete oldest auto-save if at limit
        let auto_saves: Vec<_> = self.sessions.read().unwrap()
            .values()
            .filter(|s| s.session_type == SessionType::AutoSave && !s.is_pinned)
            .cloned()
            .collect();

        if auto_saves.len() >= settings.max_auto_saves as usize {
            if let Some(oldest) = auto_saves.iter().min_by_key(|s| s.created_at) {
                self.sessions.write().unwrap().remove(&oldest.id);
            }
        }

        let session = self.create_session(
            format!("Auto-save {}", Utc::now().format("%Y-%m-%d %H:%M:%S")),
            SessionType::AutoSave,
            tabs,
            windows,
        )?;

        // Track current auto-save
        let mut current = self.current_auto_save_id.write().unwrap();
        *current = Some(session.id.clone());

        Ok(session)
    }

    pub fn get_latest_auto_save(&self) -> Option<SmartSession> {
        self.sessions.read().unwrap()
            .values()
            .filter(|s| s.session_type == SessionType::AutoSave)
            .max_by_key(|s| s.created_at)
            .cloned()
    }

    // ==================== Crash Recovery ====================

    pub fn create_crash_recovery(
        &self,
        tabs: Vec<SessionTab>,
        windows: Vec<SessionWindow>,
        error_message: Option<String>,
    ) -> Result<SmartSession, String> {
        let now = Utc::now();
        let mut session = self.create_session(
            format!("Crash Recovery {}", now.format("%Y-%m-%d %H:%M:%S")),
            SessionType::CrashRecovery,
            tabs,
            windows,
        )?;

        session.recovery_data = RecoveryData {
            is_recoverable: true,
            recovery_attempts: 0,
            last_recovery_attempt: None,
            crash_data: Some(CrashData {
                crash_timestamp: now,
                error_message,
                crash_type: "unexpected".to_string(),
                affected_tabs: Vec::new(),
            }),
            backup_location: None,
        };

        let session_clone = session.clone();
        self.sessions.write().unwrap().insert(session.id.clone(), session);
        Ok(session_clone)
    }

    pub fn get_crash_recovery_sessions(&self) -> Vec<SmartSession> {
        self.sessions.read().unwrap()
            .values()
            .filter(|s| {
                s.session_type == SessionType::CrashRecovery &&
                s.recovery_data.is_recoverable
            })
            .cloned()
            .collect()
    }

    pub fn mark_recovery_attempted(&self, session_id: &str) -> Result<(), String> {
        let mut sessions = self.sessions.write().unwrap();
        let session = sessions.get_mut(session_id)
            .ok_or_else(|| "Session not found".to_string())?;

        session.recovery_data.recovery_attempts += 1;
        session.recovery_data.last_recovery_attempt = Some(Utc::now());

        // Mark as non-recoverable after 3 failed attempts
        if session.recovery_data.recovery_attempts >= 3 {
            session.recovery_data.is_recoverable = false;
        }

        Ok(())
    }

    // ==================== Quick Save ====================

    pub fn quick_save(&self, tabs: Vec<SessionTab>, windows: Vec<SessionWindow>) -> Result<SmartSession, String> {
        // Remove existing quick save
        let existing: Vec<_> = self.sessions.read().unwrap()
            .values()
            .filter(|s| s.session_type == SessionType::QuickSave)
            .map(|s| s.id.clone())
            .collect();

        for id in existing {
            self.sessions.write().unwrap().remove(&id);
        }

        self.create_session(
            "Quick Save".to_string(),
            SessionType::QuickSave,
            tabs,
            windows,
        )
    }

    pub fn get_quick_save(&self) -> Option<SmartSession> {
        self.sessions.read().unwrap()
            .values()
            .find(|s| s.session_type == SessionType::QuickSave)
            .cloned()
    }

    // ==================== Context Preservation ====================

    pub fn save_scroll_position(&self, session_id: &str, position: ScrollPosition) -> Result<(), String> {
        let mut sessions = self.sessions.write().unwrap();
        let session = sessions.get_mut(session_id)
            .ok_or_else(|| "Session not found".to_string())?;

        session.scroll_positions.insert(position.tab_id.clone(), position);
        session.updated_at = Utc::now();
        Ok(())
    }

    pub fn save_form_data(&self, session_id: &str, form: FormSnapshot) -> Result<(), String> {
        let mut sessions = self.sessions.write().unwrap();
        let session = sessions.get_mut(session_id)
            .ok_or_else(|| "Session not found".to_string())?;

        let key = format!("{}:{}", form.tab_id, form.form_id.clone().unwrap_or_default());
        session.form_data.insert(key, form);
        session.updated_at = Utc::now();
        Ok(())
    }

    pub fn save_media_state(&self, session_id: &str, state: MediaState) -> Result<(), String> {
        let mut sessions = self.sessions.write().unwrap();
        let session = sessions.get_mut(session_id)
            .ok_or_else(|| "Session not found".to_string())?;

        session.media_states.insert(state.tab_id.clone(), state);
        session.updated_at = Utc::now();
        Ok(())
    }

    pub fn save_workspace_snapshot(&self, session_id: &str, workspaces: Vec<WorkspaceSnapshot>) -> Result<(), String> {
        let mut sessions = self.sessions.write().unwrap();
        let session = sessions.get_mut(session_id)
            .ok_or_else(|| "Session not found".to_string())?;

        session.workspaces_snapshot = workspaces;
        session.updated_at = Utc::now();
        Ok(())
    }

    // ==================== Search ====================

    pub fn search_sessions(&self, query: &str) -> Vec<SessionSearchResult> {
        let query_lower = query.to_lowercase();
        let sessions = self.sessions.read().unwrap();

        sessions.values()
            .filter_map(|session| {
                let mut score = 0.0f32;
                let mut matched_fields = Vec::new();
                let mut snippets = Vec::new();

                // Match name
                if session.name.to_lowercase().contains(&query_lower) {
                    score += 3.0;
                    matched_fields.push("name".to_string());
                    snippets.push(session.name.clone());
                }

                // Match description
                if let Some(desc) = &session.description {
                    if desc.to_lowercase().contains(&query_lower) {
                        score += 2.0;
                        matched_fields.push("description".to_string());
                        snippets.push(desc.clone());
                    }
                }

                // Match tags
                for tag in &session.tags {
                    if tag.to_lowercase().contains(&query_lower) {
                        score += 2.0;
                        matched_fields.push("tag".to_string());
                        snippets.push(tag.clone());
                    }
                }

                // Match tab titles and URLs
                for tab in &session.tabs {
                    if tab.title.to_lowercase().contains(&query_lower) {
                        score += 1.0;
                        matched_fields.push("tab_title".to_string());
                        snippets.push(tab.title.clone());
                    }
                    if tab.url.to_lowercase().contains(&query_lower) {
                        score += 0.5;
                        matched_fields.push("tab_url".to_string());
                    }
                }

                // Match context keywords
                for keyword in &session.context.keywords {
                    if keyword.to_lowercase().contains(&query_lower) {
                        score += 1.5;
                        matched_fields.push("keyword".to_string());
                    }
                }

                if score > 0.0 {
                    Some(SessionSearchResult {
                        session: session.clone(),
                        match_score: score,
                        matched_fields,
                        highlight_snippets: snippets.into_iter().take(3).collect(),
                    })
                } else {
                    None
                }
            })
            .collect()
    }

    pub fn search_by_domain(&self, domain: &str) -> Vec<SmartSession> {
        let domain_lower = domain.to_lowercase();
        self.sessions.read().unwrap()
            .values()
            .filter(|s| {
                s.tabs.iter().any(|t| t.url.to_lowercase().contains(&domain_lower))
            })
            .cloned()
            .collect()
    }

    pub fn search_by_date_range(&self, start: DateTime<Utc>, end: DateTime<Utc>) -> Vec<SmartSession> {
        self.sessions.read().unwrap()
            .values()
            .filter(|s| s.created_at >= start && s.created_at <= end)
            .cloned()
            .collect()
    }

    // ==================== Session Comparison ====================

    pub fn compare_sessions(&self, session_a_id: &str, session_b_id: &str) -> Result<SessionComparison, String> {
        let sessions = self.sessions.read().unwrap();
        
        let session_a = sessions.get(session_a_id)
            .ok_or_else(|| "Session A not found".to_string())?;
        let session_b = sessions.get(session_b_id)
            .ok_or_else(|| "Session B not found".to_string())?;

        let urls_a: std::collections::HashSet<_> = session_a.tabs.iter().map(|t| &t.url).collect();
        let urls_b: std::collections::HashSet<_> = session_b.tabs.iter().map(|t| &t.url).collect();

        let common: Vec<_> = urls_a.intersection(&urls_b).map(|s| s.to_string()).collect();
        let unique_a: Vec<_> = urls_a.difference(&urls_b).map(|s| s.to_string()).collect();
        let unique_b: Vec<_> = urls_b.difference(&urls_a).map(|s| s.to_string()).collect();

        let total = (urls_a.len() + urls_b.len()) as f32;
        let similarity = if total > 0.0 {
            (2.0 * common.len() as f32) / total
        } else {
            0.0
        };

        Ok(SessionComparison {
            session_a_id: session_a_id.to_string(),
            session_b_id: session_b_id.to_string(),
            common_tabs: common,
            unique_to_a: unique_a,
            unique_to_b: unique_b,
            similarity_score: similarity,
        })
    }

    // ==================== Merge & Split ====================

    pub fn merge_sessions(&self, session_ids: Vec<String>, new_name: String) -> Result<SmartSession, String> {
        let sessions = self.sessions.read().unwrap();
        
        let mut all_tabs = Vec::new();
        let mut all_windows = Vec::new();
        let mut all_tags = Vec::new();

        for id in &session_ids {
            let session = sessions.get(id)
                .ok_or_else(|| format!("Session {} not found", id))?;
            all_tabs.extend(session.tabs.clone());
            all_windows.extend(session.windows.clone());
            all_tags.extend(session.tags.clone());
        }

        // Deduplicate tabs by URL
        let mut seen_urls = std::collections::HashSet::new();
        all_tabs.retain(|t| seen_urls.insert(t.url.clone()));

        // Deduplicate tags
        all_tags.sort();
        all_tags.dedup();

        drop(sessions);

        let mut merged = self.create_session(new_name, SessionType::Manual, all_tabs, all_windows)?;
        merged.tags = all_tags;

        let merged_clone = merged.clone();
        self.sessions.write().unwrap().insert(merged.id.clone(), merged);

        Ok(merged_clone)
    }

    pub fn split_session(&self, session_id: &str, tab_groups: Vec<Vec<String>>) -> Result<Vec<SmartSession>, String> {
        // First, extract the data we need from the source session
        let (source_name, source_tabs) = {
            let sessions = self.sessions.read().unwrap();
            let source = sessions.get(session_id)
                .ok_or_else(|| "Session not found".to_string())?;
            (source.name.clone(), source.tabs.clone())
        };

        let mut new_sessions = Vec::new();

        for (i, tab_ids) in tab_groups.iter().enumerate() {
            let tabs: Vec<_> = source_tabs.iter()
                .filter(|t| tab_ids.contains(&t.id))
                .cloned()
                .collect();

            if tabs.is_empty() {
                continue;
            }

            let new_session = self.create_session(
                format!("{} (Part {})", source_name, i + 1),
                SessionType::Manual,
                tabs,
                Vec::new(),
            )?;
            new_sessions.push(new_session);
        }

        Ok(new_sessions)
    }

    // ==================== Scheduling ====================

    pub fn get_schedules(&self) -> Vec<SessionSchedule> {
        self.schedules.read().unwrap().clone()
    }

    pub fn add_schedule(&self, schedule: SessionSchedule) -> Result<(), String> {
        self.schedules.write().unwrap().push(schedule);
        Ok(())
    }

    pub fn delete_schedule(&self, schedule_id: &str) -> Result<(), String> {
        self.schedules.write().unwrap().retain(|s| s.id != schedule_id);
        Ok(())
    }

    pub fn toggle_schedule(&self, schedule_id: &str) -> Result<bool, String> {
        let mut schedules = self.schedules.write().unwrap();
        let schedule = schedules.iter_mut()
            .find(|s| s.id == schedule_id)
            .ok_or_else(|| "Schedule not found".to_string())?;
        
        schedule.is_enabled = !schedule.is_enabled;
        Ok(schedule.is_enabled)
    }

    // ==================== Statistics ====================

    pub fn get_stats(&self) -> SessionStats {
        let sessions = self.sessions.read().unwrap();

        let total = sessions.len() as u32;
        let manual = sessions.values().filter(|s| s.session_type == SessionType::Manual).count() as u32;
        let auto_saved = sessions.values().filter(|s| s.session_type == SessionType::AutoSave).count() as u32;
        let crash_recovery = sessions.values().filter(|s| s.session_type == SessionType::CrashRecovery).count() as u32;

        let total_tabs: usize = sessions.values().map(|s| s.tabs.len()).sum();
        let avg_tabs = if total > 0 {
            total_tabs as f32 / total as f32
        } else {
            0.0
        };

        // Domain analysis
        let mut domain_counts: HashMap<String, u32> = HashMap::new();
        for session in sessions.values() {
            for tab in &session.tabs {
                let domain = tab.url.split("://")
                    .nth(1)
                    .and_then(|s| s.split('/').next())
                    .unwrap_or("unknown")
                    .to_string();
                *domain_counts.entry(domain).or_insert(0) += 1;
            }
        }

        let mut top_domains: Vec<_> = domain_counts.into_iter().collect();
        top_domains.sort_by(|a, b| b.1.cmp(&a.1));
        top_domains.truncate(10);

        // Tag analysis
        let mut tag_counts: HashMap<String, u32> = HashMap::new();
        for session in sessions.values() {
            for tag in &session.tags {
                *tag_counts.entry(tag.clone()).or_insert(0) += 1;
            }
        }

        SessionStats {
            total_sessions: total,
            manual_sessions: manual,
            auto_saved_sessions: auto_saved,
            crash_recovery_sessions: crash_recovery,
            total_tabs_across_sessions: total_tabs as u32,
            avg_tabs_per_session: avg_tabs,
            most_visited_domains: top_domains,
            sessions_by_tag: tag_counts,
            storage_used_mb: 0.0, // Would need actual file size calculation
        }
    }

    // ==================== Cleanup ====================

    fn cleanup_old_sessions(&self) {
        let settings = self.settings.read().unwrap();
        let mut sessions = self.sessions.write().unwrap();

        // Remove excess sessions (keeping pinned)
        let non_pinned: Vec<_> = sessions.values()
            .filter(|s| !s.is_pinned)
            .cloned()
            .collect();

        if non_pinned.len() > settings.max_sessions as usize {
            let mut sorted: Vec<_> = non_pinned;
            sorted.sort_by(|a, b| a.updated_at.cmp(&b.updated_at));

            let to_remove = sorted.len() - settings.max_sessions as usize;
            for session in sorted.into_iter().take(to_remove) {
                sessions.remove(&session.id);
            }
        }
    }

    pub fn cleanup_old_auto_saves(&self, keep_days: i64) {
        let cutoff = Utc::now() - Duration::days(keep_days);
        self.sessions.write().unwrap().retain(|_, s| {
            s.session_type != SessionType::AutoSave || s.created_at > cutoff || s.is_pinned
        });
    }

    // ==================== Export/Import ====================

    pub fn export_session(&self, session_id: &str) -> Result<String, String> {
        let sessions = self.sessions.read().unwrap();
        let session = sessions.get(session_id)
            .ok_or_else(|| "Session not found".to_string())?;

        serde_json::to_string_pretty(session)
            .map_err(|e| format!("Export failed: {}", e))
    }

    pub fn import_session(&self, json: &str) -> Result<SmartSession, String> {
        let mut session: SmartSession = serde_json::from_str(json)
            .map_err(|e| format!("Import failed: {}", e))?;

        // Generate new ID to avoid conflicts
        session.id = Uuid::new_v4().to_string();
        session.created_at = Utc::now();
        session.updated_at = Utc::now();

        let session_clone = session.clone();
        self.sessions.write().unwrap().insert(session.id.clone(), session);

        Ok(session_clone)
    }

    pub fn export_all_sessions(&self) -> Result<String, String> {
        let sessions: Vec<_> = self.sessions.read().unwrap().values().cloned().collect();
        let export = serde_json::json!({
            "version": "1.0",
            "exported_at": Utc::now(),
            "sessions": sessions,
        });

        serde_json::to_string_pretty(&export)
            .map_err(|e| format!("Export failed: {}", e))
    }
}

impl Default for BrowserSmartSessionsService {
    fn default() -> Self {
        Self::new()
    }
}

// ==================== Update Types ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionUpdate {
    pub name: Option<String>,
    pub description: Option<String>,
    pub tags: Option<Vec<String>>,
    pub is_pinned: Option<bool>,
    pub context: Option<SessionContext>,
}
