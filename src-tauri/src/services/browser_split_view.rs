// CUBE Nexum - Split View Service
// Superior to Vivaldi's split view with sync scrolling, link click sync, and advanced layouts

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use uuid::Uuid;

/// Split view layout types
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum SplitLayout {
    Horizontal,     // Side by side
    Vertical,       // Top and bottom
    Grid2x2,        // 2x2 grid
    LeftFocus,      // Large left, small right
    RightFocus,     // Small left, large right
    TopFocus,       // Large top, small bottom
    BottomFocus,    // Small top, large bottom
    ThreeColumns,   // Three equal columns
    ThreeRows,      // Three equal rows
    Custom,
}

impl Default for SplitLayout {
    fn default() -> Self {
        SplitLayout::Horizontal
    }
}

/// Split panel position within the layout
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum PanelPosition {
    Left,
    Right,
    Top,
    Bottom,
    TopLeft,
    TopRight,
    BottomLeft,
    BottomRight,
    Center,
}

/// Sync mode for split view panels
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum SyncMode {
    None,           // No synchronization
    Scroll,         // Sync scroll position
    Navigation,     // Sync URL changes
    Both,           // Sync both scroll and navigation
}

impl Default for SyncMode {
    fn default() -> Self {
        SyncMode::None
    }
}

/// Individual panel configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SplitPanel {
    pub id: String,
    pub tab_id: String,
    pub position: PanelPosition,
    pub width_percent: f32,
    pub height_percent: f32,
    pub x_offset: f32,
    pub y_offset: f32,
    pub scroll_x: f64,
    pub scroll_y: f64,
    pub zoom_level: f32,
    pub is_active: bool,
    pub is_muted: bool,
    pub title: String,
    pub url: String,
    pub favicon: Option<String>,
}

impl Default for SplitPanel {
    fn default() -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            tab_id: String::new(),
            position: PanelPosition::Left,
            width_percent: 50.0,
            height_percent: 100.0,
            x_offset: 0.0,
            y_offset: 0.0,
            scroll_x: 0.0,
            scroll_y: 0.0,
            zoom_level: 1.0,
            is_active: false,
            is_muted: false,
            title: String::new(),
            url: String::new(),
            favicon: None,
        }
    }
}

/// Split view session configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SplitViewSession {
    pub id: String,
    pub name: String,
    pub layout: SplitLayout,
    pub panels: Vec<SplitPanel>,
    pub sync_mode: SyncMode,
    pub sync_group: Option<String>,
    pub divider_position: f32,
    pub divider_locked: bool,
    pub created_at: u64,
    pub last_active: u64,
}

impl Default for SplitViewSession {
    fn default() -> Self {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        
        Self {
            id: Uuid::new_v4().to_string(),
            name: String::from("New Split View"),
            layout: SplitLayout::Horizontal,
            panels: Vec::new(),
            sync_mode: SyncMode::None,
            sync_group: None,
            divider_position: 50.0,
            divider_locked: false,
            created_at: now,
            last_active: now,
        }
    }
}

/// Split view global settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SplitViewSettings {
    pub enabled: bool,
    pub max_panels: usize,
    pub default_layout: SplitLayout,
    pub default_sync_mode: SyncMode,
    pub show_dividers: bool,
    pub divider_width: u32,
    pub snap_to_edges: bool,
    pub snap_threshold: f32,
    pub remember_layouts: bool,
    pub sync_scroll_debounce_ms: u32,
    pub link_click_behavior: LinkClickBehavior,
    pub new_tab_behavior: NewTabBehavior,
    pub keyboard_shortcuts_enabled: bool,
    pub show_panel_headers: bool,
    pub auto_collapse_single: bool,
}

impl Default for SplitViewSettings {
    fn default() -> Self {
        Self {
            enabled: true,
            max_panels: 4,
            default_layout: SplitLayout::Horizontal,
            default_sync_mode: SyncMode::None,
            show_dividers: true,
            divider_width: 4,
            snap_to_edges: true,
            snap_threshold: 10.0,
            remember_layouts: true,
            sync_scroll_debounce_ms: 50,
            link_click_behavior: LinkClickBehavior::SamePanel,
            new_tab_behavior: NewTabBehavior::OpenInSplit,
            keyboard_shortcuts_enabled: true,
            show_panel_headers: true,
            auto_collapse_single: true,
        }
    }
}

/// How to handle link clicks in split view
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum LinkClickBehavior {
    SamePanel,          // Open in the same panel
    OtherPanel,         // Open in the other panel
    NewPanel,           // Open in a new panel
    AskUser,            // Ask the user
}

impl Default for LinkClickBehavior {
    fn default() -> Self {
        LinkClickBehavior::SamePanel
    }
}

/// How to handle new tabs in split view
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum NewTabBehavior {
    OpenInSplit,        // Open in current split view
    OpenNormal,         // Open as regular tab
    ReplaceInactive,    // Replace inactive panel
}

impl Default for NewTabBehavior {
    fn default() -> Self {
        NewTabBehavior::OpenInSplit
    }
}

/// Preset layout configurations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LayoutPreset {
    pub id: String,
    pub name: String,
    pub layout: SplitLayout,
    pub panel_configs: Vec<PanelPresetConfig>,
    pub icon: String,
    pub is_custom: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PanelPresetConfig {
    pub position: PanelPosition,
    pub width_percent: f32,
    pub height_percent: f32,
    pub x_offset: f32,
    pub y_offset: f32,
}

/// Split view statistics
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct SplitViewStats {
    pub total_sessions_created: u64,
    pub current_active_sessions: usize,
    pub total_sync_scroll_events: u64,
    pub total_sync_navigation_events: u64,
    pub most_used_layout: Option<SplitLayout>,
    pub layout_usage: HashMap<String, u64>,
}

/// Main Split View Service
pub struct BrowserSplitViewService {
    settings: Arc<Mutex<SplitViewSettings>>,
    sessions: Arc<Mutex<HashMap<String, SplitViewSession>>>,
    active_session_id: Arc<Mutex<Option<String>>>,
    layout_presets: Arc<Mutex<Vec<LayoutPreset>>>,
    saved_layouts: Arc<Mutex<HashMap<String, SplitViewSession>>>,
    stats: Arc<Mutex<SplitViewStats>>,
}

impl BrowserSplitViewService {
    pub fn new() -> Self {
        let service = Self {
            settings: Arc::new(Mutex::new(SplitViewSettings::default())),
            sessions: Arc::new(Mutex::new(HashMap::new())),
            active_session_id: Arc::new(Mutex::new(None)),
            layout_presets: Arc::new(Mutex::new(Vec::new())),
            saved_layouts: Arc::new(Mutex::new(HashMap::new())),
            stats: Arc::new(Mutex::new(SplitViewStats::default())),
        };
        
        service.initialize_presets();
        service
    }
    
    fn initialize_presets(&self) {
        let mut presets = self.layout_presets.lock().unwrap();
        
        *presets = vec![
            LayoutPreset {
                id: "horizontal".to_string(),
                name: "Side by Side".to_string(),
                layout: SplitLayout::Horizontal,
                panel_configs: vec![
                    PanelPresetConfig {
                        position: PanelPosition::Left,
                        width_percent: 50.0,
                        height_percent: 100.0,
                        x_offset: 0.0,
                        y_offset: 0.0,
                    },
                    PanelPresetConfig {
                        position: PanelPosition::Right,
                        width_percent: 50.0,
                        height_percent: 100.0,
                        x_offset: 50.0,
                        y_offset: 0.0,
                    },
                ],
                icon: "⬜⬜".to_string(),
                is_custom: false,
            },
            LayoutPreset {
                id: "vertical".to_string(),
                name: "Top and Bottom".to_string(),
                layout: SplitLayout::Vertical,
                panel_configs: vec![
                    PanelPresetConfig {
                        position: PanelPosition::Top,
                        width_percent: 100.0,
                        height_percent: 50.0,
                        x_offset: 0.0,
                        y_offset: 0.0,
                    },
                    PanelPresetConfig {
                        position: PanelPosition::Bottom,
                        width_percent: 100.0,
                        height_percent: 50.0,
                        x_offset: 0.0,
                        y_offset: 50.0,
                    },
                ],
                icon: "⬜\n⬜".to_string(),
                is_custom: false,
            },
            LayoutPreset {
                id: "grid2x2".to_string(),
                name: "2x2 Grid".to_string(),
                layout: SplitLayout::Grid2x2,
                panel_configs: vec![
                    PanelPresetConfig {
                        position: PanelPosition::TopLeft,
                        width_percent: 50.0,
                        height_percent: 50.0,
                        x_offset: 0.0,
                        y_offset: 0.0,
                    },
                    PanelPresetConfig {
                        position: PanelPosition::TopRight,
                        width_percent: 50.0,
                        height_percent: 50.0,
                        x_offset: 50.0,
                        y_offset: 0.0,
                    },
                    PanelPresetConfig {
                        position: PanelPosition::BottomLeft,
                        width_percent: 50.0,
                        height_percent: 50.0,
                        x_offset: 0.0,
                        y_offset: 50.0,
                    },
                    PanelPresetConfig {
                        position: PanelPosition::BottomRight,
                        width_percent: 50.0,
                        height_percent: 50.0,
                        x_offset: 50.0,
                        y_offset: 50.0,
                    },
                ],
                icon: "⬜⬜\n⬜⬜".to_string(),
                is_custom: false,
            },
            LayoutPreset {
                id: "left-focus".to_string(),
                name: "Left Focus".to_string(),
                layout: SplitLayout::LeftFocus,
                panel_configs: vec![
                    PanelPresetConfig {
                        position: PanelPosition::Left,
                        width_percent: 70.0,
                        height_percent: 100.0,
                        x_offset: 0.0,
                        y_offset: 0.0,
                    },
                    PanelPresetConfig {
                        position: PanelPosition::Right,
                        width_percent: 30.0,
                        height_percent: 100.0,
                        x_offset: 70.0,
                        y_offset: 0.0,
                    },
                ],
                icon: "⬛⬜".to_string(),
                is_custom: false,
            },
            LayoutPreset {
                id: "right-focus".to_string(),
                name: "Right Focus".to_string(),
                layout: SplitLayout::RightFocus,
                panel_configs: vec![
                    PanelPresetConfig {
                        position: PanelPosition::Left,
                        width_percent: 30.0,
                        height_percent: 100.0,
                        x_offset: 0.0,
                        y_offset: 0.0,
                    },
                    PanelPresetConfig {
                        position: PanelPosition::Right,
                        width_percent: 70.0,
                        height_percent: 100.0,
                        x_offset: 30.0,
                        y_offset: 0.0,
                    },
                ],
                icon: "⬜⬛".to_string(),
                is_custom: false,
            },
            LayoutPreset {
                id: "three-columns".to_string(),
                name: "Three Columns".to_string(),
                layout: SplitLayout::ThreeColumns,
                panel_configs: vec![
                    PanelPresetConfig {
                        position: PanelPosition::Left,
                        width_percent: 33.33,
                        height_percent: 100.0,
                        x_offset: 0.0,
                        y_offset: 0.0,
                    },
                    PanelPresetConfig {
                        position: PanelPosition::Center,
                        width_percent: 33.33,
                        height_percent: 100.0,
                        x_offset: 33.33,
                        y_offset: 0.0,
                    },
                    PanelPresetConfig {
                        position: PanelPosition::Right,
                        width_percent: 33.34,
                        height_percent: 100.0,
                        x_offset: 66.66,
                        y_offset: 0.0,
                    },
                ],
                icon: "⬜⬜⬜".to_string(),
                is_custom: false,
            },
        ];
    }
    
    // ==================== Settings Management ====================
    
    pub fn get_settings(&self) -> SplitViewSettings {
        self.settings.lock().unwrap().clone()
    }
    
    pub fn update_settings(&self, settings: SplitViewSettings) {
        *self.settings.lock().unwrap() = settings;
    }
    
    pub fn set_enabled(&self, enabled: bool) {
        self.settings.lock().unwrap().enabled = enabled;
    }
    
    pub fn set_default_layout(&self, layout: SplitLayout) {
        self.settings.lock().unwrap().default_layout = layout;
    }
    
    pub fn set_default_sync_mode(&self, mode: SyncMode) {
        self.settings.lock().unwrap().default_sync_mode = mode;
    }
    
    pub fn set_show_panel_headers(&self, show: bool) {
        self.settings.lock().unwrap().show_panel_headers = show;
    }
    
    // ==================== Session Management ====================
    
    pub fn create_session(&self, name: Option<String>, layout: Option<SplitLayout>) -> Result<SplitViewSession, String> {
        let settings = self.settings.lock().unwrap();
        
        if !settings.enabled {
            return Err("Split view is disabled".to_string());
        }
        
        let layout = layout.unwrap_or(settings.default_layout);
        let sync_mode = settings.default_sync_mode;
        
        drop(settings);
        
        let mut session = SplitViewSession::default();
        session.name = name.unwrap_or_else(|| "Split View".to_string());
        session.layout = layout;
        session.sync_mode = sync_mode;
        
        // Apply preset layout
        self.apply_preset_to_session(&mut session);
        
        // Store session
        let id = session.id.clone();
        self.sessions.lock().unwrap().insert(id.clone(), session.clone());
        
        // Set as active
        *self.active_session_id.lock().unwrap() = Some(id);
        
        // Update stats
        {
            let mut stats = self.stats.lock().unwrap();
            stats.total_sessions_created += 1;
            
            let layout_key = format!("{:?}", session.layout);
            *stats.layout_usage.entry(layout_key).or_insert(0) += 1;
        }
        
        self.update_active_count();
        
        Ok(session)
    }
    
    fn apply_preset_to_session(&self, session: &mut SplitViewSession) {
        let presets = self.layout_presets.lock().unwrap();
        
        if let Some(preset) = presets.iter().find(|p| p.layout == session.layout) {
            session.panels = preset.panel_configs.iter().map(|config| {
                let mut panel = SplitPanel::default();
                panel.position = config.position;
                panel.width_percent = config.width_percent;
                panel.height_percent = config.height_percent;
                panel.x_offset = config.x_offset;
                panel.y_offset = config.y_offset;
                panel
            }).collect();
        }
    }
    
    pub fn close_session(&self, session_id: &str) -> Result<(), String> {
        let mut sessions = self.sessions.lock().unwrap();
        
        if sessions.remove(session_id).is_some() {
            // Clear active if it was this session
            let mut active = self.active_session_id.lock().unwrap();
            if active.as_ref() == Some(&session_id.to_string()) {
                *active = sessions.keys().next().cloned();
            }
            
            drop(sessions);
            self.update_active_count();
            Ok(())
        } else {
            Err(format!("Session '{}' not found", session_id))
        }
    }
    
    pub fn close_all_sessions(&self) -> usize {
        let mut sessions = self.sessions.lock().unwrap();
        let count = sessions.len();
        sessions.clear();
        
        *self.active_session_id.lock().unwrap() = None;
        
        drop(sessions);
        self.update_active_count();
        
        count
    }
    
    pub fn get_session(&self, session_id: &str) -> Option<SplitViewSession> {
        self.sessions.lock().unwrap().get(session_id).cloned()
    }
    
    pub fn get_all_sessions(&self) -> Vec<SplitViewSession> {
        self.sessions.lock().unwrap().values().cloned().collect()
    }
    
    pub fn get_active_session(&self) -> Option<SplitViewSession> {
        let active_id = self.active_session_id.lock().unwrap().clone();
        active_id.and_then(|id| self.sessions.lock().unwrap().get(&id).cloned())
    }
    
    pub fn set_active_session(&self, session_id: &str) -> Result<(), String> {
        if self.sessions.lock().unwrap().contains_key(session_id) {
            *self.active_session_id.lock().unwrap() = Some(session_id.to_string());
            
            // Update last_active timestamp
            if let Some(session) = self.sessions.lock().unwrap().get_mut(session_id) {
                session.last_active = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs();
            }
            
            Ok(())
        } else {
            Err(format!("Session '{}' not found", session_id))
        }
    }
    
    // ==================== Layout Management ====================
    
    pub fn set_layout(&self, session_id: &str, layout: SplitLayout) -> Result<(), String> {
        let mut sessions = self.sessions.lock().unwrap();
        
        if let Some(session) = sessions.get_mut(session_id) {
            session.layout = layout;
            
            // Reapply preset for new layout
            drop(sessions);
            
            if let Some(mut session) = self.sessions.lock().unwrap().get(session_id).cloned() {
                self.apply_preset_to_session(&mut session);
                self.sessions.lock().unwrap().insert(session_id.to_string(), session);
            }
            
            Ok(())
        } else {
            Err(format!("Session '{}' not found", session_id))
        }
    }
    
    pub fn set_divider_position(&self, session_id: &str, position: f32) -> Result<(), String> {
        let mut sessions = self.sessions.lock().unwrap();
        
        if let Some(session) = sessions.get_mut(session_id) {
            if session.divider_locked {
                return Err("Divider is locked".to_string());
            }
            
            // Clamp position between 10% and 90%
            session.divider_position = position.clamp(10.0, 90.0);
            
            // Update panel sizes based on new divider position
            self.update_panels_for_divider(session);
            
            Ok(())
        } else {
            Err(format!("Session '{}' not found", session_id))
        }
    }
    
    fn update_panels_for_divider(&self, session: &mut SplitViewSession) {
        let pos = session.divider_position;
        
        match session.layout {
            SplitLayout::Horizontal => {
                if session.panels.len() >= 2 {
                    session.panels[0].width_percent = pos;
                    session.panels[1].width_percent = 100.0 - pos;
                    session.panels[1].x_offset = pos;
                }
            }
            SplitLayout::Vertical => {
                if session.panels.len() >= 2 {
                    session.panels[0].height_percent = pos;
                    session.panels[1].height_percent = 100.0 - pos;
                    session.panels[1].y_offset = pos;
                }
            }
            SplitLayout::LeftFocus | SplitLayout::RightFocus => {
                if session.panels.len() >= 2 {
                    session.panels[0].width_percent = pos;
                    session.panels[1].width_percent = 100.0 - pos;
                    session.panels[1].x_offset = pos;
                }
            }
            _ => {}
        }
    }
    
    pub fn toggle_divider_lock(&self, session_id: &str) -> Result<bool, String> {
        let mut sessions = self.sessions.lock().unwrap();
        
        if let Some(session) = sessions.get_mut(session_id) {
            session.divider_locked = !session.divider_locked;
            Ok(session.divider_locked)
        } else {
            Err(format!("Session '{}' not found", session_id))
        }
    }
    
    pub fn get_layout_presets(&self) -> Vec<LayoutPreset> {
        self.layout_presets.lock().unwrap().clone()
    }
    
    // ==================== Panel Management ====================
    
    pub fn add_panel(&self, session_id: &str, tab_id: &str, position: Option<PanelPosition>) -> Result<SplitPanel, String> {
        let settings = self.settings.lock().unwrap();
        let max_panels = settings.max_panels;
        drop(settings);
        
        let mut sessions = self.sessions.lock().unwrap();
        
        if let Some(session) = sessions.get_mut(session_id) {
            if session.panels.len() >= max_panels {
                return Err(format!("Maximum panels ({}) reached", max_panels));
            }
            
            let mut panel = SplitPanel::default();
            panel.tab_id = tab_id.to_string();
            panel.position = position.unwrap_or(PanelPosition::Right);
            
            // Set default size based on existing panels
            self.calculate_panel_size(session, &mut panel);
            
            session.panels.push(panel.clone());
            
            Ok(panel)
        } else {
            Err(format!("Session '{}' not found", session_id))
        }
    }
    
    fn calculate_panel_size(&self, session: &SplitViewSession, panel: &mut SplitPanel) {
        let panel_count = session.panels.len() + 1;
        
        match session.layout {
            SplitLayout::Horizontal => {
                panel.width_percent = 100.0 / panel_count as f32;
                panel.height_percent = 100.0;
                panel.x_offset = (panel_count - 1) as f32 * panel.width_percent;
            }
            SplitLayout::Vertical => {
                panel.width_percent = 100.0;
                panel.height_percent = 100.0 / panel_count as f32;
                panel.y_offset = (panel_count - 1) as f32 * panel.height_percent;
            }
            _ => {
                panel.width_percent = 50.0;
                panel.height_percent = 50.0;
            }
        }
    }
    
    pub fn remove_panel(&self, session_id: &str, panel_id: &str) -> Result<(), String> {
        let mut sessions = self.sessions.lock().unwrap();
        
        if let Some(session) = sessions.get_mut(session_id) {
            let initial_len = session.panels.len();
            session.panels.retain(|p| p.id != panel_id);
            
            if session.panels.len() < initial_len {
                // Recalculate panel sizes
                self.redistribute_panels(session);
                Ok(())
            } else {
                Err(format!("Panel '{}' not found", panel_id))
            }
        } else {
            Err(format!("Session '{}' not found", session_id))
        }
    }
    
    fn redistribute_panels(&self, session: &mut SplitViewSession) {
        let panel_count = session.panels.len();
        if panel_count == 0 {
            return;
        }
        
        let size_each = 100.0 / panel_count as f32;
        
        match session.layout {
            SplitLayout::Horizontal => {
                for (i, panel) in session.panels.iter_mut().enumerate() {
                    panel.width_percent = size_each;
                    panel.height_percent = 100.0;
                    panel.x_offset = i as f32 * size_each;
                    panel.y_offset = 0.0;
                }
            }
            SplitLayout::Vertical => {
                for (i, panel) in session.panels.iter_mut().enumerate() {
                    panel.width_percent = 100.0;
                    panel.height_percent = size_each;
                    panel.x_offset = 0.0;
                    panel.y_offset = i as f32 * size_each;
                }
            }
            _ => {}
        }
    }
    
    pub fn set_active_panel(&self, session_id: &str, panel_id: &str) -> Result<(), String> {
        let mut sessions = self.sessions.lock().unwrap();
        
        if let Some(session) = sessions.get_mut(session_id) {
            for panel in &mut session.panels {
                panel.is_active = panel.id == panel_id;
            }
            Ok(())
        } else {
            Err(format!("Session '{}' not found", session_id))
        }
    }
    
    pub fn update_panel(&self, session_id: &str, panel_id: &str, updates: PanelUpdate) -> Result<(), String> {
        let mut sessions = self.sessions.lock().unwrap();
        
        if let Some(session) = sessions.get_mut(session_id) {
            if let Some(panel) = session.panels.iter_mut().find(|p| p.id == panel_id) {
                if let Some(title) = updates.title {
                    panel.title = title;
                }
                if let Some(url) = updates.url {
                    panel.url = url;
                }
                if let Some(favicon) = updates.favicon {
                    panel.favicon = favicon;
                }
                if let Some(scroll_x) = updates.scroll_x {
                    panel.scroll_x = scroll_x;
                }
                if let Some(scroll_y) = updates.scroll_y {
                    panel.scroll_y = scroll_y;
                }
                if let Some(zoom) = updates.zoom_level {
                    panel.zoom_level = zoom;
                }
                if let Some(muted) = updates.is_muted {
                    panel.is_muted = muted;
                }
                Ok(())
            } else {
                Err(format!("Panel '{}' not found", panel_id))
            }
        } else {
            Err(format!("Session '{}' not found", session_id))
        }
    }
    
    pub fn swap_panels(&self, session_id: &str, panel1_id: &str, panel2_id: &str) -> Result<(), String> {
        let mut sessions = self.sessions.lock().unwrap();
        
        if let Some(session) = sessions.get_mut(session_id) {
            let idx1 = session.panels.iter().position(|p| p.id == panel1_id);
            let idx2 = session.panels.iter().position(|p| p.id == panel2_id);
            
            match (idx1, idx2) {
                (Some(i1), Some(i2)) => {
                    // Swap positions
                    let pos1 = session.panels[i1].position;
                    let pos2 = session.panels[i2].position;
                    session.panels[i1].position = pos2;
                    session.panels[i2].position = pos1;
                    
                    // Swap layout properties
                    let (w1, h1, x1, y1) = (
                        session.panels[i1].width_percent,
                        session.panels[i1].height_percent,
                        session.panels[i1].x_offset,
                        session.panels[i1].y_offset,
                    );
                    
                    session.panels[i1].width_percent = session.panels[i2].width_percent;
                    session.panels[i1].height_percent = session.panels[i2].height_percent;
                    session.panels[i1].x_offset = session.panels[i2].x_offset;
                    session.panels[i1].y_offset = session.panels[i2].y_offset;
                    
                    session.panels[i2].width_percent = w1;
                    session.panels[i2].height_percent = h1;
                    session.panels[i2].x_offset = x1;
                    session.panels[i2].y_offset = y1;
                    
                    Ok(())
                }
                _ => Err("One or both panels not found".to_string()),
            }
        } else {
            Err(format!("Session '{}' not found", session_id))
        }
    }
    
    // ==================== Synchronization ====================
    
    pub fn set_sync_mode(&self, session_id: &str, mode: SyncMode) -> Result<(), String> {
        let mut sessions = self.sessions.lock().unwrap();
        
        if let Some(session) = sessions.get_mut(session_id) {
            session.sync_mode = mode;
            Ok(())
        } else {
            Err(format!("Session '{}' not found", session_id))
        }
    }
    
    pub fn sync_scroll(&self, session_id: &str, source_panel_id: &str, scroll_x: f64, scroll_y: f64) -> Result<Vec<String>, String> {
        let mut sessions = self.sessions.lock().unwrap();
        
        if let Some(session) = sessions.get_mut(session_id) {
            if session.sync_mode != SyncMode::Scroll && session.sync_mode != SyncMode::Both {
                return Ok(vec![]);
            }
            
            let mut synced_panels = Vec::new();
            
            for panel in &mut session.panels {
                if panel.id != source_panel_id {
                    panel.scroll_x = scroll_x;
                    panel.scroll_y = scroll_y;
                    synced_panels.push(panel.id.clone());
                }
            }
            
            // Update stats
            self.stats.lock().unwrap().total_sync_scroll_events += 1;
            
            Ok(synced_panels)
        } else {
            Err(format!("Session '{}' not found", session_id))
        }
    }
    
    pub fn sync_navigation(&self, session_id: &str, source_panel_id: &str, url: &str) -> Result<Vec<String>, String> {
        let mut sessions = self.sessions.lock().unwrap();
        
        if let Some(session) = sessions.get_mut(session_id) {
            if session.sync_mode != SyncMode::Navigation && session.sync_mode != SyncMode::Both {
                return Ok(vec![]);
            }
            
            let mut synced_panels = Vec::new();
            
            for panel in &mut session.panels {
                if panel.id != source_panel_id {
                    panel.url = url.to_string();
                    synced_panels.push(panel.id.clone());
                }
            }
            
            // Update stats
            self.stats.lock().unwrap().total_sync_navigation_events += 1;
            
            Ok(synced_panels)
        } else {
            Err(format!("Session '{}' not found", session_id))
        }
    }
    
    // ==================== Saved Layouts ====================
    
    pub fn save_layout(&self, session_id: &str, name: &str) -> Result<String, String> {
        let sessions = self.sessions.lock().unwrap();
        
        if let Some(session) = sessions.get(session_id) {
            let mut saved = session.clone();
            saved.id = Uuid::new_v4().to_string();
            saved.name = name.to_string();
            
            let id = saved.id.clone();
            self.saved_layouts.lock().unwrap().insert(id.clone(), saved);
            
            Ok(id)
        } else {
            Err(format!("Session '{}' not found", session_id))
        }
    }
    
    pub fn load_saved_layout(&self, saved_id: &str) -> Result<SplitViewSession, String> {
        let saved = self.saved_layouts.lock().unwrap();
        
        if let Some(layout) = saved.get(saved_id) {
            let mut session = layout.clone();
            session.id = Uuid::new_v4().to_string();
            session.created_at = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs();
            session.last_active = session.created_at;
            
            // Store new session
            let id = session.id.clone();
            self.sessions.lock().unwrap().insert(id.clone(), session.clone());
            *self.active_session_id.lock().unwrap() = Some(id);
            
            self.update_active_count();
            
            Ok(session)
        } else {
            Err(format!("Saved layout '{}' not found", saved_id))
        }
    }
    
    pub fn get_saved_layouts(&self) -> Vec<SplitViewSession> {
        self.saved_layouts.lock().unwrap().values().cloned().collect()
    }
    
    pub fn delete_saved_layout(&self, saved_id: &str) -> Result<(), String> {
        if self.saved_layouts.lock().unwrap().remove(saved_id).is_some() {
            Ok(())
        } else {
            Err(format!("Saved layout '{}' not found", saved_id))
        }
    }
    
    // ==================== Statistics ====================
    
    pub fn get_stats(&self) -> SplitViewStats {
        self.stats.lock().unwrap().clone()
    }
    
    pub fn reset_stats(&self) {
        *self.stats.lock().unwrap() = SplitViewStats::default();
        self.update_active_count();
    }
    
    fn update_active_count(&self) {
        let count = self.sessions.lock().unwrap().len();
        self.stats.lock().unwrap().current_active_sessions = count;
    }
}

impl Default for BrowserSplitViewService {
    fn default() -> Self {
        Self::new()
    }
}

/// Panel update payload
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct PanelUpdate {
    pub title: Option<String>,
    pub url: Option<String>,
    pub favicon: Option<Option<String>>,
    pub scroll_x: Option<f64>,
    pub scroll_y: Option<f64>,
    pub zoom_level: Option<f32>,
    pub is_muted: Option<bool>,
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_create_session() {
        let service = BrowserSplitViewService::new();
        
        let session = service.create_session(Some("Test".to_string()), Some(SplitLayout::Horizontal));
        assert!(session.is_ok());
        
        let session = session.unwrap();
        assert_eq!(session.name, "Test");
        assert_eq!(session.layout, SplitLayout::Horizontal);
        assert_eq!(session.panels.len(), 2);
    }
    
    #[test]
    fn test_sync_scroll() {
        let service = BrowserSplitViewService::new();
        
        let session = service.create_session(None, None).unwrap();
        service.set_sync_mode(&session.id, SyncMode::Scroll).unwrap();
        
        let panel_id = session.panels[0].id.clone();
        let result = service.sync_scroll(&session.id, &panel_id, 100.0, 200.0);
        
        assert!(result.is_ok());
        assert_eq!(result.unwrap().len(), 1);
    }
    
    #[test]
    fn test_layout_presets() {
        let service = BrowserSplitViewService::new();
        let presets = service.get_layout_presets();
        
        assert!(!presets.is_empty());
        assert!(presets.iter().any(|p| p.layout == SplitLayout::Horizontal));
        assert!(presets.iter().any(|p| p.layout == SplitLayout::Grid2x2));
    }
}
