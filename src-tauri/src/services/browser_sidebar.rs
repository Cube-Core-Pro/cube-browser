// CUBE Nexum - Sidebar Service
// Superior to Opera/Vivaldi sidebars with messaging, music, and web panels
// Real-time integration, persistent state, and customizable panels

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use chrono::{DateTime, Utc};
use uuid::Uuid;

// ==================== Enums ====================

/// Sidebar position on screen
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum SidebarPosition {
    Left,
    Right,
}

/// Panel types available in the sidebar
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum PanelType {
    // Messaging Panels
    Messenger,      // Facebook Messenger
    WhatsApp,       // WhatsApp Web
    Telegram,       // Telegram Web
    Discord,        // Discord Web
    Slack,          // Slack Web
    // Music Panels
    Spotify,        // Spotify Web Player
    AppleMusic,     // Apple Music Web
    YouTubeMusic,   // YouTube Music
    SoundCloud,     // SoundCloud
    Deezer,         // Deezer Web
    // Productivity Panels
    Notes,          // Built-in notes
    Tasks,          // Task manager
    Calendar,       // Calendar view
    Bookmarks,      // Bookmarks panel
    History,        // History panel
    Downloads,      // Downloads panel
    // Web Panels
    CustomWebPanel, // Custom URL
    Twitter,        // Twitter/X
    LinkedIn,       // LinkedIn
    Reddit,         // Reddit
    GitHub,         // GitHub
}

/// Panel content loading status
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum PanelStatus {
    Loading,
    Ready,
    Error,
    Unloaded,
    Suspended,  // Memory-saving mode
}

/// Animation style for sidebar
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum AnimationStyle {
    Slide,
    Fade,
    Push,
    Overlay,
    None,
}

/// Auto-hide behavior
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum AutoHideBehavior {
    Never,
    Always,
    OnFullscreen,
    OnNarrowWindow,
}

// ==================== Structures ====================

/// Configuration for a sidebar panel
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SidebarPanel {
    pub id: String,
    pub panel_type: PanelType,
    pub name: String,
    pub icon: String,
    pub url: Option<String>,
    pub custom_css: Option<String>,
    pub custom_js: Option<String>,
    pub status: PanelStatus,
    pub is_pinned: bool,
    pub is_visible: bool,
    pub width: u32,
    pub badge_count: u32,
    pub last_accessed: i64,
    pub notifications_enabled: bool,
    pub auto_reload_interval: Option<u32>,  // Seconds
    pub scroll_position: f64,
    pub zoom_level: f64,
    pub user_agent_override: Option<String>,
}

impl SidebarPanel {
    pub fn new(panel_type: PanelType) -> Self {
        let (name, icon, url) = Self::get_panel_defaults(&panel_type);
        
        Self {
            id: Uuid::new_v4().to_string(),
            panel_type,
            name,
            icon,
            url,
            custom_css: None,
            custom_js: None,
            status: PanelStatus::Unloaded,
            is_pinned: false,
            is_visible: true,
            width: 400,
            badge_count: 0,
            last_accessed: Utc::now().timestamp(),
            notifications_enabled: true,
            auto_reload_interval: None,
            scroll_position: 0.0,
            zoom_level: 1.0,
            user_agent_override: None,
        }
    }
    
    fn get_panel_defaults(panel_type: &PanelType) -> (String, String, Option<String>) {
        match panel_type {
            // Messaging
            PanelType::Messenger => ("Messenger".to_string(), "💬".to_string(), Some("https://www.messenger.com".to_string())),
            PanelType::WhatsApp => ("WhatsApp".to_string(), "📱".to_string(), Some("https://web.whatsapp.com".to_string())),
            PanelType::Telegram => ("Telegram".to_string(), "✈️".to_string(), Some("https://web.telegram.org".to_string())),
            PanelType::Discord => ("Discord".to_string(), "🎮".to_string(), Some("https://discord.com/app".to_string())),
            PanelType::Slack => ("Slack".to_string(), "💼".to_string(), Some("https://app.slack.com".to_string())),
            // Music
            PanelType::Spotify => ("Spotify".to_string(), "🎵".to_string(), Some("https://open.spotify.com".to_string())),
            PanelType::AppleMusic => ("Apple Music".to_string(), "🎧".to_string(), Some("https://music.apple.com".to_string())),
            PanelType::YouTubeMusic => ("YouTube Music".to_string(), "▶️".to_string(), Some("https://music.youtube.com".to_string())),
            PanelType::SoundCloud => ("SoundCloud".to_string(), "☁️".to_string(), Some("https://soundcloud.com".to_string())),
            PanelType::Deezer => ("Deezer".to_string(), "🎶".to_string(), Some("https://www.deezer.com".to_string())),
            // Productivity
            PanelType::Notes => ("Notes".to_string(), "📝".to_string(), None),
            PanelType::Tasks => ("Tasks".to_string(), "✅".to_string(), None),
            PanelType::Calendar => ("Calendar".to_string(), "📅".to_string(), None),
            PanelType::Bookmarks => ("Bookmarks".to_string(), "⭐".to_string(), None),
            PanelType::History => ("History".to_string(), "🕐".to_string(), None),
            PanelType::Downloads => ("Downloads".to_string(), "📥".to_string(), None),
            // Web Panels
            PanelType::CustomWebPanel => ("Web Panel".to_string(), "🌐".to_string(), None),
            PanelType::Twitter => ("Twitter/X".to_string(), "🐦".to_string(), Some("https://twitter.com".to_string())),
            PanelType::LinkedIn => ("LinkedIn".to_string(), "💼".to_string(), Some("https://www.linkedin.com".to_string())),
            PanelType::Reddit => ("Reddit".to_string(), "🔴".to_string(), Some("https://www.reddit.com".to_string())),
            PanelType::GitHub => ("GitHub".to_string(), "🐙".to_string(), Some("https://github.com".to_string())),
        }
    }
}

/// Settings for the sidebar
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SidebarSettings {
    pub enabled: bool,
    pub position: SidebarPosition,
    pub width: u32,
    pub min_width: u32,
    pub max_width: u32,
    pub collapsed_width: u32,
    pub animation_style: AnimationStyle,
    pub animation_duration_ms: u32,
    pub auto_hide: AutoHideBehavior,
    pub auto_hide_delay_ms: u32,
    pub show_panel_names: bool,
    pub show_badge_counts: bool,
    pub compact_mode: bool,
    pub hover_expand: bool,
    pub hover_expand_delay_ms: u32,
    pub keyboard_shortcut: String,
    pub panel_keyboard_shortcuts: bool,
    pub remember_last_panel: bool,
    pub suspend_inactive_panels: bool,
    pub suspend_after_minutes: u32,
    pub global_notifications: bool,
    pub notification_sound: bool,
    pub background_color: Option<String>,
    pub accent_color: Option<String>,
    pub panel_order: Vec<String>,
}

impl Default for SidebarSettings {
    fn default() -> Self {
        Self {
            enabled: true,
            position: SidebarPosition::Left,
            width: 400,
            min_width: 280,
            max_width: 800,
            collapsed_width: 48,
            animation_style: AnimationStyle::Slide,
            animation_duration_ms: 200,
            auto_hide: AutoHideBehavior::Never,
            auto_hide_delay_ms: 500,
            show_panel_names: true,
            show_badge_counts: true,
            compact_mode: false,
            hover_expand: false,
            hover_expand_delay_ms: 300,
            keyboard_shortcut: "Ctrl+Shift+S".to_string(),
            panel_keyboard_shortcuts: true,
            remember_last_panel: true,
            suspend_inactive_panels: true,
            suspend_after_minutes: 30,
            global_notifications: true,
            notification_sound: true,
            background_color: None,
            accent_color: None,
            panel_order: Vec::new(),
        }
    }
}

/// Sidebar state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SidebarState {
    pub is_expanded: bool,
    pub is_visible: bool,
    pub active_panel_id: Option<String>,
    pub width: u32,
    pub last_active_panel_id: Option<String>,
    pub pinned_panels: Vec<String>,
}

impl Default for SidebarState {
    fn default() -> Self {
        Self {
            is_expanded: false,
            is_visible: true,
            active_panel_id: None,
            width: 400,
            last_active_panel_id: None,
            pinned_panels: Vec::new(),
        }
    }
}

/// Note for the built-in Notes panel
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SidebarNote {
    pub id: String,
    pub title: String,
    pub content: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub color: String,
    pub is_pinned: bool,
    pub tags: Vec<String>,
    pub linked_url: Option<String>,
}

impl SidebarNote {
    pub fn new(title: String, content: String) -> Self {
        let now = Utc::now().timestamp();
        Self {
            id: Uuid::new_v4().to_string(),
            title,
            content,
            created_at: now,
            updated_at: now,
            color: "#fef08a".to_string(),  // Default yellow
            is_pinned: false,
            tags: Vec::new(),
            linked_url: None,
        }
    }
}

/// Task for the built-in Tasks panel
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SidebarTask {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub completed: bool,
    pub priority: TaskPriority,
    pub due_date: Option<i64>,
    pub created_at: i64,
    pub completed_at: Option<i64>,
    pub tags: Vec<String>,
    pub linked_url: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum TaskPriority {
    Low,
    Medium,
    High,
    Urgent,
}

impl SidebarTask {
    pub fn new(title: String) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            title,
            description: None,
            completed: false,
            priority: TaskPriority::Medium,
            due_date: None,
            created_at: Utc::now().timestamp(),
            completed_at: None,
            tags: Vec::new(),
            linked_url: None,
        }
    }
}

/// Sidebar statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SidebarStats {
    pub total_panels_opened: u64,
    pub total_time_expanded_seconds: u64,
    pub most_used_panel: Option<String>,
    pub panel_usage: HashMap<String, u64>,
    pub messages_received: u64,
    pub notes_created: u64,
    pub tasks_completed: u64,
}

impl Default for SidebarStats {
    fn default() -> Self {
        Self {
            total_panels_opened: 0,
            total_time_expanded_seconds: 0,
            most_used_panel: None,
            panel_usage: HashMap::new(),
            messages_received: 0,
            notes_created: 0,
            tasks_completed: 0,
        }
    }
}

// ==================== Service ====================

pub struct BrowserSidebarService {
    settings: RwLock<SidebarSettings>,
    state: RwLock<SidebarState>,
    panels: RwLock<Vec<SidebarPanel>>,
    notes: RwLock<Vec<SidebarNote>>,
    tasks: RwLock<Vec<SidebarTask>>,
    stats: RwLock<SidebarStats>,
    expand_start_time: RwLock<Option<i64>>,
}

impl BrowserSidebarService {
    pub fn new() -> Self {
        Self {
            settings: RwLock::new(SidebarSettings::default()),
            state: RwLock::new(SidebarState::default()),
            panels: RwLock::new(Self::create_default_panels()),
            notes: RwLock::new(Vec::new()),
            tasks: RwLock::new(Vec::new()),
            stats: RwLock::new(SidebarStats::default()),
            expand_start_time: RwLock::new(None),
        }
    }
    
    fn create_default_panels() -> Vec<SidebarPanel> {
        vec![
            SidebarPanel::new(PanelType::Messenger),
            SidebarPanel::new(PanelType::WhatsApp),
            SidebarPanel::new(PanelType::Telegram),
            SidebarPanel::new(PanelType::Spotify),
            SidebarPanel::new(PanelType::Notes),
            SidebarPanel::new(PanelType::Tasks),
            SidebarPanel::new(PanelType::Bookmarks),
            SidebarPanel::new(PanelType::History),
            SidebarPanel::new(PanelType::Downloads),
        ]
    }
    
    // ==================== Settings ====================
    
    pub fn get_settings(&self) -> SidebarSettings {
        self.settings.read().unwrap().clone()
    }
    
    pub fn update_settings(&self, new_settings: SidebarSettings) {
        let mut settings = self.settings.write().unwrap();
        *settings = new_settings;
    }
    
    pub fn set_position(&self, position: SidebarPosition) {
        let mut settings = self.settings.write().unwrap();
        settings.position = position;
    }
    
    pub fn set_width(&self, width: u32) {
        let mut settings = self.settings.write().unwrap();
        settings.width = width.clamp(settings.min_width, settings.max_width);
        
        let mut state = self.state.write().unwrap();
        state.width = settings.width;
    }
    
    pub fn set_auto_hide(&self, behavior: AutoHideBehavior) {
        let mut settings = self.settings.write().unwrap();
        settings.auto_hide = behavior;
    }
    
    pub fn toggle_compact_mode(&self) -> bool {
        let mut settings = self.settings.write().unwrap();
        settings.compact_mode = !settings.compact_mode;
        settings.compact_mode
    }
    
    // ==================== State ====================
    
    pub fn get_state(&self) -> SidebarState {
        self.state.read().unwrap().clone()
    }
    
    pub fn toggle_sidebar(&self) -> bool {
        let mut state = self.state.write().unwrap();
        state.is_expanded = !state.is_expanded;
        
        // Track time spent expanded
        let mut expand_time = self.expand_start_time.write().unwrap();
        if state.is_expanded {
            *expand_time = Some(Utc::now().timestamp());
        } else if let Some(start) = *expand_time {
            let duration = Utc::now().timestamp() - start;
            let mut stats = self.stats.write().unwrap();
            stats.total_time_expanded_seconds += duration as u64;
            *expand_time = None;
        }
        
        state.is_expanded
    }
    
    pub fn expand(&self) {
        let mut state = self.state.write().unwrap();
        if !state.is_expanded {
            state.is_expanded = true;
            let mut expand_time = self.expand_start_time.write().unwrap();
            *expand_time = Some(Utc::now().timestamp());
        }
    }
    
    pub fn collapse(&self) {
        let mut state = self.state.write().unwrap();
        if state.is_expanded {
            state.is_expanded = false;
            let mut expand_time = self.expand_start_time.write().unwrap();
            if let Some(start) = *expand_time {
                let duration = Utc::now().timestamp() - start;
                let mut stats = self.stats.write().unwrap();
                stats.total_time_expanded_seconds += duration as u64;
            }
            *expand_time = None;
        }
    }
    
    pub fn set_visible(&self, visible: bool) {
        let mut state = self.state.write().unwrap();
        state.is_visible = visible;
    }
    
    // ==================== Panel Management ====================
    
    pub fn get_all_panels(&self) -> Vec<SidebarPanel> {
        self.panels.read().unwrap().clone()
    }
    
    pub fn get_panel(&self, panel_id: &str) -> Option<SidebarPanel> {
        let panels = self.panels.read().unwrap();
        panels.iter().find(|p| p.id == panel_id).cloned()
    }
    
    pub fn get_active_panel(&self) -> Option<SidebarPanel> {
        let state = self.state.read().unwrap();
        if let Some(ref panel_id) = state.active_panel_id {
            self.get_panel(panel_id)
        } else {
            None
        }
    }
    
    pub fn set_active_panel(&self, panel_id: &str) -> Result<(), String> {
        let panels = self.panels.read().unwrap();
        let panel_exists = panels.iter().any(|p| p.id == panel_id);
        
        if !panel_exists {
            return Err("Panel not found".to_string());
        }
        
        drop(panels);
        
        let mut state = self.state.write().unwrap();
        state.last_active_panel_id = state.active_panel_id.clone();
        state.active_panel_id = Some(panel_id.to_string());
        
        // Update stats
        let mut stats = self.stats.write().unwrap();
        stats.total_panels_opened += 1;
        *stats.panel_usage.entry(panel_id.to_string()).or_insert(0) += 1;
        
        // Update most used panel
        let max_usage = stats.panel_usage.iter().max_by_key(|(_, v)| *v);
        if let Some((id, _)) = max_usage {
            stats.most_used_panel = Some(id.clone());
        }
        
        // Update last accessed time
        drop(state);
        drop(stats);
        
        let mut panels = self.panels.write().unwrap();
        if let Some(panel) = panels.iter_mut().find(|p| p.id == panel_id) {
            panel.last_accessed = Utc::now().timestamp();
            panel.status = PanelStatus::Loading;
        }
        
        Ok(())
    }
    
    pub fn add_panel(&self, panel_type: PanelType) -> SidebarPanel {
        let panel = SidebarPanel::new(panel_type);
        let mut panels = self.panels.write().unwrap();
        panels.push(panel.clone());
        panel
    }
    
    pub fn add_custom_panel(&self, name: String, url: String, icon: Option<String>) -> SidebarPanel {
        let mut panel = SidebarPanel::new(PanelType::CustomWebPanel);
        panel.name = name;
        panel.url = Some(url);
        if let Some(ico) = icon {
            panel.icon = ico;
        }
        
        let mut panels = self.panels.write().unwrap();
        panels.push(panel.clone());
        panel
    }
    
    pub fn remove_panel(&self, panel_id: &str) -> Result<(), String> {
        let mut panels = self.panels.write().unwrap();
        let initial_len = panels.len();
        panels.retain(|p| p.id != panel_id);
        
        if panels.len() == initial_len {
            return Err("Panel not found".to_string());
        }
        
        // Clear active panel if it was removed
        let mut state = self.state.write().unwrap();
        if state.active_panel_id.as_ref() == Some(&panel_id.to_string()) {
            state.active_panel_id = None;
        }
        
        Ok(())
    }
    
    pub fn update_panel(&self, panel_id: &str, updates: PanelUpdate) -> Result<(), String> {
        let mut panels = self.panels.write().unwrap();
        let panel = panels.iter_mut().find(|p| p.id == panel_id)
            .ok_or_else(|| "Panel not found".to_string())?;
        
        if let Some(name) = updates.name {
            panel.name = name;
        }
        if let Some(url) = updates.url {
            panel.url = Some(url);
        }
        if let Some(icon) = updates.icon {
            panel.icon = icon;
        }
        if let Some(width) = updates.width {
            panel.width = width;
        }
        if let Some(pinned) = updates.is_pinned {
            panel.is_pinned = pinned;
        }
        if let Some(visible) = updates.is_visible {
            panel.is_visible = visible;
        }
        if let Some(notifications) = updates.notifications_enabled {
            panel.notifications_enabled = notifications;
        }
        if let Some(css) = updates.custom_css {
            panel.custom_css = Some(css);
        }
        if let Some(js) = updates.custom_js {
            panel.custom_js = Some(js);
        }
        if let Some(zoom) = updates.zoom_level {
            panel.zoom_level = zoom;
        }
        
        Ok(())
    }
    
    pub fn toggle_panel_pin(&self, panel_id: &str) -> Result<bool, String> {
        let mut panels = self.panels.write().unwrap();
        let panel = panels.iter_mut().find(|p| p.id == panel_id)
            .ok_or_else(|| "Panel not found".to_string())?;
        
        panel.is_pinned = !panel.is_pinned;
        let is_pinned = panel.is_pinned;
        
        // Update state
        let mut state = self.state.write().unwrap();
        if is_pinned {
            if !state.pinned_panels.contains(&panel_id.to_string()) {
                state.pinned_panels.push(panel_id.to_string());
            }
        } else {
            state.pinned_panels.retain(|id| id != panel_id);
        }
        
        Ok(is_pinned)
    }
    
    pub fn set_panel_status(&self, panel_id: &str, status: PanelStatus) -> Result<(), String> {
        let mut panels = self.panels.write().unwrap();
        let panel = panels.iter_mut().find(|p| p.id == panel_id)
            .ok_or_else(|| "Panel not found".to_string())?;
        
        panel.status = status;
        Ok(())
    }
    
    pub fn update_badge_count(&self, panel_id: &str, count: u32) -> Result<(), String> {
        let mut panels = self.panels.write().unwrap();
        let panel = panels.iter_mut().find(|p| p.id == panel_id)
            .ok_or_else(|| "Panel not found".to_string())?;
        
        panel.badge_count = count;
        
        // Update stats for messages
        if count > 0 {
            let mut stats = self.stats.write().unwrap();
            stats.messages_received += count as u64;
        }
        
        Ok(())
    }
    
    pub fn reorder_panels(&self, panel_order: Vec<String>) -> Result<(), String> {
        let mut panels = self.panels.write().unwrap();
        let mut ordered: Vec<SidebarPanel> = Vec::new();
        
        for panel_id in &panel_order {
            if let Some(panel) = panels.iter().find(|p| &p.id == panel_id) {
                ordered.push(panel.clone());
            }
        }
        
        // Add any panels not in the order list
        for panel in panels.iter() {
            if !panel_order.contains(&panel.id) {
                ordered.push(panel.clone());
            }
        }
        
        *panels = ordered;
        
        let mut settings = self.settings.write().unwrap();
        settings.panel_order = panel_order;
        
        Ok(())
    }
    
    // ==================== Notes ====================
    
    pub fn get_all_notes(&self) -> Vec<SidebarNote> {
        self.notes.read().unwrap().clone()
    }
    
    pub fn get_note(&self, note_id: &str) -> Option<SidebarNote> {
        let notes = self.notes.read().unwrap();
        notes.iter().find(|n| n.id == note_id).cloned()
    }
    
    pub fn create_note(&self, title: String, content: String) -> SidebarNote {
        let note = SidebarNote::new(title, content);
        let mut notes = self.notes.write().unwrap();
        notes.push(note.clone());
        
        let mut stats = self.stats.write().unwrap();
        stats.notes_created += 1;
        
        note
    }
    
    pub fn update_note(&self, note_id: &str, title: Option<String>, content: Option<String>) -> Result<(), String> {
        let mut notes = self.notes.write().unwrap();
        let note = notes.iter_mut().find(|n| n.id == note_id)
            .ok_or_else(|| "Note not found".to_string())?;
        
        if let Some(t) = title {
            note.title = t;
        }
        if let Some(c) = content {
            note.content = c;
        }
        note.updated_at = Utc::now().timestamp();
        
        Ok(())
    }
    
    pub fn delete_note(&self, note_id: &str) -> Result<(), String> {
        let mut notes = self.notes.write().unwrap();
        let initial_len = notes.len();
        notes.retain(|n| n.id != note_id);
        
        if notes.len() == initial_len {
            return Err("Note not found".to_string());
        }
        
        Ok(())
    }
    
    pub fn toggle_note_pin(&self, note_id: &str) -> Result<bool, String> {
        let mut notes = self.notes.write().unwrap();
        let note = notes.iter_mut().find(|n| n.id == note_id)
            .ok_or_else(|| "Note not found".to_string())?;
        
        note.is_pinned = !note.is_pinned;
        Ok(note.is_pinned)
    }
    
    pub fn set_note_color(&self, note_id: &str, color: String) -> Result<(), String> {
        let mut notes = self.notes.write().unwrap();
        let note = notes.iter_mut().find(|n| n.id == note_id)
            .ok_or_else(|| "Note not found".to_string())?;
        
        note.color = color;
        Ok(())
    }
    
    pub fn link_note_to_url(&self, note_id: &str, url: Option<String>) -> Result<(), String> {
        let mut notes = self.notes.write().unwrap();
        let note = notes.iter_mut().find(|n| n.id == note_id)
            .ok_or_else(|| "Note not found".to_string())?;
        
        note.linked_url = url;
        Ok(())
    }
    
    // ==================== Tasks ====================
    
    pub fn get_all_tasks(&self) -> Vec<SidebarTask> {
        self.tasks.read().unwrap().clone()
    }
    
    pub fn get_task(&self, task_id: &str) -> Option<SidebarTask> {
        let tasks = self.tasks.read().unwrap();
        tasks.iter().find(|t| t.id == task_id).cloned()
    }
    
    pub fn create_task(&self, title: String) -> SidebarTask {
        let task = SidebarTask::new(title);
        let mut tasks = self.tasks.write().unwrap();
        tasks.push(task.clone());
        task
    }
    
    pub fn update_task(&self, task_id: &str, updates: TaskUpdate) -> Result<(), String> {
        let mut tasks = self.tasks.write().unwrap();
        let task = tasks.iter_mut().find(|t| t.id == task_id)
            .ok_or_else(|| "Task not found".to_string())?;
        
        if let Some(title) = updates.title {
            task.title = title;
        }
        if let Some(description) = updates.description {
            task.description = Some(description);
        }
        if let Some(priority) = updates.priority {
            task.priority = priority;
        }
        if let Some(due_date) = updates.due_date {
            task.due_date = Some(due_date);
        }
        if let Some(tags) = updates.tags {
            task.tags = tags;
        }
        if let Some(url) = updates.linked_url {
            task.linked_url = Some(url);
        }
        
        Ok(())
    }
    
    pub fn toggle_task_complete(&self, task_id: &str) -> Result<bool, String> {
        let mut tasks = self.tasks.write().unwrap();
        let task = tasks.iter_mut().find(|t| t.id == task_id)
            .ok_or_else(|| "Task not found".to_string())?;
        
        task.completed = !task.completed;
        let completed = task.completed;
        
        if completed {
            task.completed_at = Some(Utc::now().timestamp());
            
            let mut stats = self.stats.write().unwrap();
            stats.tasks_completed += 1;
        } else {
            task.completed_at = None;
        }
        
        Ok(completed)
    }
    
    pub fn delete_task(&self, task_id: &str) -> Result<(), String> {
        let mut tasks = self.tasks.write().unwrap();
        let initial_len = tasks.len();
        tasks.retain(|t| t.id != task_id);
        
        if tasks.len() == initial_len {
            return Err("Task not found".to_string());
        }
        
        Ok(())
    }
    
    pub fn clear_completed_tasks(&self) -> u32 {
        let mut tasks = self.tasks.write().unwrap();
        let initial_len = tasks.len();
        tasks.retain(|t| !t.completed);
        (initial_len - tasks.len()) as u32
    }
    
    // ==================== Statistics ====================
    
    pub fn get_stats(&self) -> SidebarStats {
        self.stats.read().unwrap().clone()
    }
    
    pub fn reset_stats(&self) {
        let mut stats = self.stats.write().unwrap();
        *stats = SidebarStats::default();
    }
    
    // ==================== Panel Categories ====================
    
    pub fn get_messaging_panels(&self) -> Vec<SidebarPanel> {
        let panels = self.panels.read().unwrap();
        panels.iter()
            .filter(|p| matches!(p.panel_type, 
                PanelType::Messenger | 
                PanelType::WhatsApp | 
                PanelType::Telegram | 
                PanelType::Discord | 
                PanelType::Slack
            ))
            .cloned()
            .collect()
    }
    
    pub fn get_music_panels(&self) -> Vec<SidebarPanel> {
        let panels = self.panels.read().unwrap();
        panels.iter()
            .filter(|p| matches!(p.panel_type, 
                PanelType::Spotify | 
                PanelType::AppleMusic | 
                PanelType::YouTubeMusic | 
                PanelType::SoundCloud | 
                PanelType::Deezer
            ))
            .cloned()
            .collect()
    }
    
    pub fn get_productivity_panels(&self) -> Vec<SidebarPanel> {
        let panels = self.panels.read().unwrap();
        panels.iter()
            .filter(|p| matches!(p.panel_type, 
                PanelType::Notes | 
                PanelType::Tasks | 
                PanelType::Calendar | 
                PanelType::Bookmarks | 
                PanelType::History | 
                PanelType::Downloads
            ))
            .cloned()
            .collect()
    }
    
    pub fn get_web_panels(&self) -> Vec<SidebarPanel> {
        let panels = self.panels.read().unwrap();
        panels.iter()
            .filter(|p| matches!(p.panel_type, 
                PanelType::CustomWebPanel | 
                PanelType::Twitter | 
                PanelType::LinkedIn | 
                PanelType::Reddit | 
                PanelType::GitHub
            ))
            .cloned()
            .collect()
    }
    
    pub fn get_total_badge_count(&self) -> u32 {
        let panels = self.panels.read().unwrap();
        panels.iter().map(|p| p.badge_count).sum()
    }
}

// ==================== Update Structures ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PanelUpdate {
    pub name: Option<String>,
    pub url: Option<String>,
    pub icon: Option<String>,
    pub width: Option<u32>,
    pub is_pinned: Option<bool>,
    pub is_visible: Option<bool>,
    pub notifications_enabled: Option<bool>,
    pub custom_css: Option<String>,
    pub custom_js: Option<String>,
    pub zoom_level: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskUpdate {
    pub title: Option<String>,
    pub description: Option<String>,
    pub priority: Option<TaskPriority>,
    pub due_date: Option<i64>,
    pub tags: Option<Vec<String>>,
    pub linked_url: Option<String>,
}

impl Default for BrowserSidebarService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_sidebar_creation() {
        let sidebar = BrowserSidebarService::new();
        let panels = sidebar.get_all_panels();
        assert!(!panels.is_empty(), "Should have default panels");
    }
    
    #[test]
    fn test_toggle_sidebar() {
        let sidebar = BrowserSidebarService::new();
        let state = sidebar.get_state();
        assert!(!state.is_expanded, "Should start collapsed");
        
        sidebar.toggle_sidebar();
        let state = sidebar.get_state();
        assert!(state.is_expanded, "Should be expanded after toggle");
    }
    
    #[test]
    fn test_create_note() {
        let sidebar = BrowserSidebarService::new();
        let note = sidebar.create_note("Test".to_string(), "Content".to_string());
        assert_eq!(note.title, "Test");
        
        let notes = sidebar.get_all_notes();
        assert_eq!(notes.len(), 1);
    }
    
    #[test]
    fn test_create_task() {
        let sidebar = BrowserSidebarService::new();
        let task = sidebar.create_task("Test Task".to_string());
        assert!(!task.completed);
        
        sidebar.toggle_task_complete(&task.id).unwrap();
        let updated = sidebar.get_task(&task.id).unwrap();
        assert!(updated.completed);
    }
}
