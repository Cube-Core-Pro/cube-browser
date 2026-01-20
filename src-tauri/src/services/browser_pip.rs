// CUBE Nexum - Picture-in-Picture Service
// Superior to Opera's PiP with multi-PiP, any element support, and advanced controls

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use uuid::Uuid;

/// PiP window position presets
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum PipPosition {
    TopLeft,
    TopRight,
    BottomLeft,
    BottomRight,
    TopCenter,
    BottomCenter,
    LeftCenter,
    RightCenter,
    Center,
    Custom,
}

impl Default for PipPosition {
    fn default() -> Self {
        PipPosition::BottomRight
    }
}

/// PiP window size presets
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum PipSize {
    Small,      // 320x180
    Medium,     // 480x270
    Large,      // 640x360
    ExtraLarge, // 800x450
    Custom,
}

impl Default for PipSize {
    fn default() -> Self {
        PipSize::Medium
    }
}

/// Type of content in PiP
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PipContentType {
    Video,
    Canvas,
    Iframe,
    Element,
    Stream,
    Screen,
    Camera,
}

impl Default for PipContentType {
    fn default() -> Self {
        PipContentType::Video
    }
}

/// PiP window configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PipWindowConfig {
    pub id: String,
    pub tab_id: String,
    pub source_selector: String,
    pub content_type: PipContentType,
    pub title: String,
    pub position: PipPosition,
    pub size: PipSize,
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub opacity: f32,
    pub always_on_top: bool,
    pub muted: bool,
    pub volume: f32,
    pub playback_rate: f32,
    pub paused: bool,
    pub loop_enabled: bool,
    pub current_time: f64,
    pub duration: f64,
    pub is_fullscreen: bool,
    pub is_minimized: bool,
    pub snap_to_edges: bool,
    pub snap_threshold: i32,
    pub created_at: u64,
    pub last_active: u64,
}

impl Default for PipWindowConfig {
    fn default() -> Self {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        
        Self {
            id: Uuid::new_v4().to_string(),
            tab_id: String::new(),
            source_selector: String::new(),
            content_type: PipContentType::Video,
            title: String::from("Picture in Picture"),
            position: PipPosition::BottomRight,
            size: PipSize::Medium,
            x: -1,
            y: -1,
            width: 480,
            height: 270,
            opacity: 1.0,
            always_on_top: true,
            muted: false,
            volume: 1.0,
            playback_rate: 1.0,
            paused: false,
            loop_enabled: false,
            current_time: 0.0,
            duration: 0.0,
            is_fullscreen: false,
            is_minimized: false,
            snap_to_edges: true,
            snap_threshold: 20,
            created_at: now,
            last_active: now,
        }
    }
}

/// PiP global settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PipSettings {
    pub enabled: bool,
    pub max_windows: usize,
    pub default_position: PipPosition,
    pub default_size: PipSize,
    pub default_opacity: f32,
    pub auto_pip_on_tab_switch: bool,
    pub auto_close_on_tab_close: bool,
    pub remember_positions: bool,
    pub keyboard_shortcuts_enabled: bool,
    pub hover_controls: bool,
    pub pip_for_any_video: bool,
    pub pip_for_canvas: bool,
    pub pip_for_iframes: bool,
    pub show_pip_button: bool,
    pub snap_zones_enabled: bool,
    pub snap_threshold: i32,
    pub cascade_new_windows: bool,
    pub auto_mute_others: bool,
    pub sync_playback: bool,
}

impl Default for PipSettings {
    fn default() -> Self {
        Self {
            enabled: true,
            max_windows: 8,
            default_position: PipPosition::BottomRight,
            default_size: PipSize::Medium,
            default_opacity: 1.0,
            auto_pip_on_tab_switch: false,
            auto_close_on_tab_close: true,
            remember_positions: true,
            keyboard_shortcuts_enabled: true,
            hover_controls: true,
            pip_for_any_video: true,
            pip_for_canvas: true,
            pip_for_iframes: true,
            show_pip_button: true,
            snap_zones_enabled: true,
            snap_threshold: 20,
            cascade_new_windows: true,
            auto_mute_others: false,
            sync_playback: false,
        }
    }
}

/// Snap zone definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SnapZone {
    pub id: String,
    pub name: String,
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub position: PipPosition,
    pub active: bool,
}

/// PiP statistics
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct PipStats {
    pub total_windows_created: u64,
    pub current_active_windows: usize,
    pub total_watch_time_seconds: u64,
    pub most_used_position: Option<PipPosition>,
    pub videos_pip_count: u64,
    pub canvas_pip_count: u64,
    pub iframe_pip_count: u64,
    pub screen_pip_count: u64,
    pub camera_pip_count: u64,
}

/// Main PiP Service
pub struct BrowserPipService {
    settings: Arc<Mutex<PipSettings>>,
    windows: Arc<Mutex<HashMap<String, PipWindowConfig>>>,
    snap_zones: Arc<Mutex<Vec<SnapZone>>>,
    stats: Arc<Mutex<PipStats>>,
    position_memory: Arc<Mutex<HashMap<String, (i32, i32)>>>,
}

impl BrowserPipService {
    pub fn new() -> Self {
        let service = Self {
            settings: Arc::new(Mutex::new(PipSettings::default())),
            windows: Arc::new(Mutex::new(HashMap::new())),
            snap_zones: Arc::new(Mutex::new(Vec::new())),
            stats: Arc::new(Mutex::new(PipStats::default())),
            position_memory: Arc::new(Mutex::new(HashMap::new())),
        };
        
        // Initialize default snap zones
        service.initialize_snap_zones();
        
        service
    }
    
    fn initialize_snap_zones(&self) {
        let mut zones = self.snap_zones.lock().unwrap();
        
        // Assuming 1920x1080 screen for default zones
        // These will be recalculated based on actual screen size
        let default_zones = vec![
            SnapZone {
                id: "top-left".to_string(),
                name: "Top Left".to_string(),
                x: 0,
                y: 0,
                width: 480,
                height: 270,
                position: PipPosition::TopLeft,
                active: true,
            },
            SnapZone {
                id: "top-right".to_string(),
                name: "Top Right".to_string(),
                x: 1440,
                y: 0,
                width: 480,
                height: 270,
                position: PipPosition::TopRight,
                active: true,
            },
            SnapZone {
                id: "bottom-left".to_string(),
                name: "Bottom Left".to_string(),
                x: 0,
                y: 810,
                width: 480,
                height: 270,
                position: PipPosition::BottomLeft,
                active: true,
            },
            SnapZone {
                id: "bottom-right".to_string(),
                name: "Bottom Right".to_string(),
                x: 1440,
                y: 810,
                width: 480,
                height: 270,
                position: PipPosition::BottomRight,
                active: true,
            },
            SnapZone {
                id: "center".to_string(),
                name: "Center".to_string(),
                x: 720,
                y: 405,
                width: 480,
                height: 270,
                position: PipPosition::Center,
                active: true,
            },
        ];
        
        *zones = default_zones;
    }
    
    // ==================== Settings Management ====================
    
    pub fn get_settings(&self) -> PipSettings {
        self.settings.lock().unwrap().clone()
    }
    
    pub fn update_settings(&self, settings: PipSettings) {
        *self.settings.lock().unwrap() = settings;
    }
    
    pub fn set_enabled(&self, enabled: bool) {
        self.settings.lock().unwrap().enabled = enabled;
    }
    
    pub fn set_max_windows(&self, max: usize) {
        self.settings.lock().unwrap().max_windows = max;
    }
    
    pub fn set_default_position(&self, position: PipPosition) {
        self.settings.lock().unwrap().default_position = position;
    }
    
    pub fn set_default_size(&self, size: PipSize) {
        self.settings.lock().unwrap().default_size = size;
    }
    
    pub fn set_auto_pip(&self, enabled: bool) {
        self.settings.lock().unwrap().auto_pip_on_tab_switch = enabled;
    }
    
    pub fn set_snap_zones_enabled(&self, enabled: bool) {
        self.settings.lock().unwrap().snap_zones_enabled = enabled;
    }
    
    // ==================== Window Management ====================
    
    pub fn create_pip_window(&self, tab_id: &str, selector: &str, content_type: PipContentType, title: Option<String>) -> Result<PipWindowConfig, String> {
        let settings = self.settings.lock().unwrap();
        
        if !settings.enabled {
            return Err("PiP is disabled".to_string());
        }
        
        let windows = self.windows.lock().unwrap();
        if windows.len() >= settings.max_windows {
            return Err(format!("Maximum number of PiP windows ({}) reached", settings.max_windows));
        }
        drop(windows);
        drop(settings);
        
        let mut config = PipWindowConfig::default();
        config.tab_id = tab_id.to_string();
        config.source_selector = selector.to_string();
        config.content_type = content_type.clone();
        config.title = title.unwrap_or_else(|| "Picture in Picture".to_string());
        
        // Apply default settings
        let settings = self.settings.lock().unwrap();
        config.position = settings.default_position;
        config.size = settings.default_size;
        config.opacity = settings.default_opacity;
        
        // Calculate position
        let (width, height) = self.get_size_dimensions(config.size);
        config.width = width;
        config.height = height;
        
        // Check position memory
        let position_key = format!("{}:{}", tab_id, selector);
        if settings.remember_positions {
            if let Some(&(x, y)) = self.position_memory.lock().unwrap().get(&position_key) {
                config.x = x;
                config.y = y;
                config.position = PipPosition::Custom;
            }
        }
        
        // If no remembered position, calculate based on default position and cascading
        if config.x == -1 {
            let (x, y) = self.calculate_position(config.position, config.width, config.height);
            
            // Apply cascading if enabled
            if settings.cascade_new_windows {
                let windows = self.windows.lock().unwrap();
                let offset = (windows.len() * 30) as i32;
                config.x = x + offset;
                config.y = y + offset;
            } else {
                config.x = x;
                config.y = y;
            }
        }
        
        // Auto-mute other windows if enabled
        if settings.auto_mute_others {
            drop(settings);
            self.mute_all_except(&config.id);
        }
        
        // Update stats
        {
            let mut stats = self.stats.lock().unwrap();
            stats.total_windows_created += 1;
            match content_type {
                PipContentType::Video => stats.videos_pip_count += 1,
                PipContentType::Canvas => stats.canvas_pip_count += 1,
                PipContentType::Iframe => stats.iframe_pip_count += 1,
                PipContentType::Screen => stats.screen_pip_count += 1,
                PipContentType::Camera => stats.camera_pip_count += 1,
                _ => {}
            }
        }
        
        // Store the window
        let id = config.id.clone();
        self.windows.lock().unwrap().insert(id, config.clone());
        
        // Update active count
        self.update_active_count();
        
        Ok(config)
    }
    
    fn get_size_dimensions(&self, size: PipSize) -> (u32, u32) {
        match size {
            PipSize::Small => (320, 180),
            PipSize::Medium => (480, 270),
            PipSize::Large => (640, 360),
            PipSize::ExtraLarge => (800, 450),
            PipSize::Custom => (480, 270), // Default for custom
        }
    }
    
    fn calculate_position(&self, position: PipPosition, width: u32, height: u32) -> (i32, i32) {
        // Assuming 1920x1080 screen, will be adjusted by frontend
        let screen_width = 1920;
        let screen_height = 1080;
        let padding = 20;
        
        match position {
            PipPosition::TopLeft => (padding, padding),
            PipPosition::TopRight => (screen_width - width as i32 - padding, padding),
            PipPosition::BottomLeft => (padding, screen_height - height as i32 - padding),
            PipPosition::BottomRight => (screen_width - width as i32 - padding, screen_height - height as i32 - padding),
            PipPosition::TopCenter => ((screen_width - width as i32) / 2, padding),
            PipPosition::BottomCenter => ((screen_width - width as i32) / 2, screen_height - height as i32 - padding),
            PipPosition::LeftCenter => (padding, (screen_height - height as i32) / 2),
            PipPosition::RightCenter => (screen_width - width as i32 - padding, (screen_height - height as i32) / 2),
            PipPosition::Center => ((screen_width - width as i32) / 2, (screen_height - height as i32) / 2),
            PipPosition::Custom => (screen_width - width as i32 - padding, screen_height - height as i32 - padding),
        }
    }
    
    pub fn close_pip_window(&self, window_id: &str) -> Result<(), String> {
        let mut windows = self.windows.lock().unwrap();
        
        if let Some(window) = windows.remove(window_id) {
            // Save position to memory if enabled
            let settings = self.settings.lock().unwrap();
            if settings.remember_positions {
                let position_key = format!("{}:{}", window.tab_id, window.source_selector);
                self.position_memory.lock().unwrap().insert(position_key, (window.x, window.y));
            }
            drop(settings);
            drop(windows);
            
            self.update_active_count();
            Ok(())
        } else {
            Err(format!("PiP window '{}' not found", window_id))
        }
    }
    
    pub fn close_all_windows(&self) -> usize {
        let mut windows = self.windows.lock().unwrap();
        let count = windows.len();
        
        // Save positions before closing
        let settings = self.settings.lock().unwrap();
        if settings.remember_positions {
            for window in windows.values() {
                let position_key = format!("{}:{}", window.tab_id, window.source_selector);
                self.position_memory.lock().unwrap().insert(position_key, (window.x, window.y));
            }
        }
        drop(settings);
        
        windows.clear();
        drop(windows);
        
        self.update_active_count();
        count
    }
    
    pub fn close_windows_for_tab(&self, tab_id: &str) -> usize {
        let mut windows = self.windows.lock().unwrap();
        let initial_count = windows.len();
        
        // Save positions before closing
        let settings = self.settings.lock().unwrap();
        let remember = settings.remember_positions;
        drop(settings);
        
        let to_remove: Vec<String> = windows
            .iter()
            .filter(|(_, w)| w.tab_id == tab_id)
            .map(|(id, w)| {
                if remember {
                    let position_key = format!("{}:{}", w.tab_id, w.source_selector);
                    self.position_memory.lock().unwrap().insert(position_key, (w.x, w.y));
                }
                id.clone()
            })
            .collect();
        
        for id in to_remove {
            windows.remove(&id);
        }
        
        drop(windows);
        self.update_active_count();
        
        initial_count - self.windows.lock().unwrap().len()
    }
    
    pub fn get_window(&self, window_id: &str) -> Option<PipWindowConfig> {
        self.windows.lock().unwrap().get(window_id).cloned()
    }
    
    pub fn get_all_windows(&self) -> Vec<PipWindowConfig> {
        self.windows.lock().unwrap().values().cloned().collect()
    }
    
    pub fn get_windows_for_tab(&self, tab_id: &str) -> Vec<PipWindowConfig> {
        self.windows
            .lock()
            .unwrap()
            .values()
            .filter(|w| w.tab_id == tab_id)
            .cloned()
            .collect()
    }
    
    // ==================== Window Control ====================
    
    pub fn update_window_position(&self, window_id: &str, x: i32, y: i32) -> Result<(), String> {
        let mut windows = self.windows.lock().unwrap();
        
        if let Some(window) = windows.get_mut(window_id) {
            // Apply snap zones if enabled
            let settings = self.settings.lock().unwrap();
            if settings.snap_zones_enabled {
                let (snapped_x, snapped_y, snapped_position) = self.snap_to_zone(x, y, window.width, window.height);
                window.x = snapped_x;
                window.y = snapped_y;
                window.position = snapped_position;
            } else {
                window.x = x;
                window.y = y;
                window.position = PipPosition::Custom;
            }
            
            window.last_active = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs();
            
            Ok(())
        } else {
            Err(format!("PiP window '{}' not found", window_id))
        }
    }
    
    pub fn update_window_size(&self, window_id: &str, width: u32, height: u32) -> Result<(), String> {
        let mut windows = self.windows.lock().unwrap();
        
        if let Some(window) = windows.get_mut(window_id) {
            window.width = width;
            window.height = height;
            window.size = PipSize::Custom;
            
            window.last_active = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs();
            
            Ok(())
        } else {
            Err(format!("PiP window '{}' not found", window_id))
        }
    }
    
    pub fn set_window_opacity(&self, window_id: &str, opacity: f32) -> Result<(), String> {
        let mut windows = self.windows.lock().unwrap();
        
        if let Some(window) = windows.get_mut(window_id) {
            window.opacity = opacity.clamp(0.1, 1.0);
            Ok(())
        } else {
            Err(format!("PiP window '{}' not found", window_id))
        }
    }
    
    pub fn set_window_always_on_top(&self, window_id: &str, always_on_top: bool) -> Result<(), String> {
        let mut windows = self.windows.lock().unwrap();
        
        if let Some(window) = windows.get_mut(window_id) {
            window.always_on_top = always_on_top;
            Ok(())
        } else {
            Err(format!("PiP window '{}' not found", window_id))
        }
    }
    
    pub fn minimize_window(&self, window_id: &str) -> Result<(), String> {
        let mut windows = self.windows.lock().unwrap();
        
        if let Some(window) = windows.get_mut(window_id) {
            window.is_minimized = true;
            Ok(())
        } else {
            Err(format!("PiP window '{}' not found", window_id))
        }
    }
    
    pub fn restore_window(&self, window_id: &str) -> Result<(), String> {
        let mut windows = self.windows.lock().unwrap();
        
        if let Some(window) = windows.get_mut(window_id) {
            window.is_minimized = false;
            Ok(())
        } else {
            Err(format!("PiP window '{}' not found", window_id))
        }
    }
    
    pub fn toggle_fullscreen(&self, window_id: &str) -> Result<bool, String> {
        let mut windows = self.windows.lock().unwrap();
        
        if let Some(window) = windows.get_mut(window_id) {
            window.is_fullscreen = !window.is_fullscreen;
            Ok(window.is_fullscreen)
        } else {
            Err(format!("PiP window '{}' not found", window_id))
        }
    }
    
    // ==================== Playback Control ====================
    
    pub fn play(&self, window_id: &str) -> Result<(), String> {
        let mut windows = self.windows.lock().unwrap();
        
        if let Some(window) = windows.get_mut(window_id) {
            window.paused = false;
            Ok(())
        } else {
            Err(format!("PiP window '{}' not found", window_id))
        }
    }
    
    pub fn pause(&self, window_id: &str) -> Result<(), String> {
        let mut windows = self.windows.lock().unwrap();
        
        if let Some(window) = windows.get_mut(window_id) {
            window.paused = true;
            Ok(())
        } else {
            Err(format!("PiP window '{}' not found", window_id))
        }
    }
    
    pub fn toggle_playback(&self, window_id: &str) -> Result<bool, String> {
        let mut windows = self.windows.lock().unwrap();
        
        if let Some(window) = windows.get_mut(window_id) {
            window.paused = !window.paused;
            Ok(!window.paused) // Return true if now playing
        } else {
            Err(format!("PiP window '{}' not found", window_id))
        }
    }
    
    pub fn mute(&self, window_id: &str) -> Result<(), String> {
        let mut windows = self.windows.lock().unwrap();
        
        if let Some(window) = windows.get_mut(window_id) {
            window.muted = true;
            Ok(())
        } else {
            Err(format!("PiP window '{}' not found", window_id))
        }
    }
    
    pub fn unmute(&self, window_id: &str) -> Result<(), String> {
        let mut windows = self.windows.lock().unwrap();
        
        if let Some(window) = windows.get_mut(window_id) {
            window.muted = false;
            Ok(())
        } else {
            Err(format!("PiP window '{}' not found", window_id))
        }
    }
    
    pub fn toggle_mute(&self, window_id: &str) -> Result<bool, String> {
        let mut windows = self.windows.lock().unwrap();
        
        if let Some(window) = windows.get_mut(window_id) {
            window.muted = !window.muted;
            Ok(window.muted)
        } else {
            Err(format!("PiP window '{}' not found", window_id))
        }
    }
    
    pub fn set_volume(&self, window_id: &str, volume: f32) -> Result<(), String> {
        let mut windows = self.windows.lock().unwrap();
        
        if let Some(window) = windows.get_mut(window_id) {
            window.volume = volume.clamp(0.0, 1.0);
            if window.volume > 0.0 {
                window.muted = false;
            }
            Ok(())
        } else {
            Err(format!("PiP window '{}' not found", window_id))
        }
    }
    
    pub fn set_playback_rate(&self, window_id: &str, rate: f32) -> Result<(), String> {
        let mut windows = self.windows.lock().unwrap();
        
        if let Some(window) = windows.get_mut(window_id) {
            window.playback_rate = rate.clamp(0.25, 4.0);
            Ok(())
        } else {
            Err(format!("PiP window '{}' not found", window_id))
        }
    }
    
    pub fn seek(&self, window_id: &str, time: f64) -> Result<(), String> {
        let mut windows = self.windows.lock().unwrap();
        
        if let Some(window) = windows.get_mut(window_id) {
            window.current_time = time.max(0.0);
            if window.duration > 0.0 {
                window.current_time = window.current_time.min(window.duration);
            }
            Ok(())
        } else {
            Err(format!("PiP window '{}' not found", window_id))
        }
    }
    
    pub fn seek_relative(&self, window_id: &str, delta: f64) -> Result<f64, String> {
        let mut windows = self.windows.lock().unwrap();
        
        if let Some(window) = windows.get_mut(window_id) {
            let new_time = (window.current_time + delta).max(0.0);
            window.current_time = if window.duration > 0.0 {
                new_time.min(window.duration)
            } else {
                new_time
            };
            Ok(window.current_time)
        } else {
            Err(format!("PiP window '{}' not found", window_id))
        }
    }
    
    pub fn toggle_loop(&self, window_id: &str) -> Result<bool, String> {
        let mut windows = self.windows.lock().unwrap();
        
        if let Some(window) = windows.get_mut(window_id) {
            window.loop_enabled = !window.loop_enabled;
            Ok(window.loop_enabled)
        } else {
            Err(format!("PiP window '{}' not found", window_id))
        }
    }
    
    pub fn update_playback_state(&self, window_id: &str, current_time: f64, duration: f64, paused: bool) -> Result<(), String> {
        let mut windows = self.windows.lock().unwrap();
        
        if let Some(window) = windows.get_mut(window_id) {
            window.current_time = current_time;
            window.duration = duration;
            window.paused = paused;
            Ok(())
        } else {
            Err(format!("PiP window '{}' not found", window_id))
        }
    }
    
    // ==================== Multi-PiP Control ====================
    
    pub fn mute_all(&self) {
        let mut windows = self.windows.lock().unwrap();
        for window in windows.values_mut() {
            window.muted = true;
        }
    }
    
    pub fn mute_all_except(&self, except_id: &str) {
        let mut windows = self.windows.lock().unwrap();
        for (id, window) in windows.iter_mut() {
            if id != except_id {
                window.muted = true;
            }
        }
    }
    
    pub fn pause_all(&self) {
        let mut windows = self.windows.lock().unwrap();
        for window in windows.values_mut() {
            window.paused = true;
        }
    }
    
    pub fn play_all(&self) {
        let mut windows = self.windows.lock().unwrap();
        for window in windows.values_mut() {
            window.paused = false;
        }
    }
    
    pub fn sync_playback_to(&self, source_window_id: &str) -> Result<(), String> {
        let windows = self.windows.lock().unwrap();
        
        let source = windows.get(source_window_id)
            .ok_or_else(|| format!("Source window '{}' not found", source_window_id))?;
        
        let current_time = source.current_time;
        let paused = source.paused;
        let playback_rate = source.playback_rate;
        
        drop(windows);
        
        let mut windows = self.windows.lock().unwrap();
        for (id, window) in windows.iter_mut() {
            if id != source_window_id {
                window.current_time = current_time;
                window.paused = paused;
                window.playback_rate = playback_rate;
            }
        }
        
        Ok(())
    }
    
    // ==================== Snap Zones ====================
    
    fn snap_to_zone(&self, x: i32, y: i32, width: u32, height: u32) -> (i32, i32, PipPosition) {
        let zones = self.snap_zones.lock().unwrap();
        let settings = self.settings.lock().unwrap();
        let threshold = settings.snap_threshold;
        
        for zone in zones.iter() {
            if !zone.active {
                continue;
            }
            
            let center_x = zone.x + (zone.width / 2) as i32;
            let center_y = zone.y + (zone.height / 2) as i32;
            let pip_center_x = x + (width / 2) as i32;
            let pip_center_y = y + (height / 2) as i32;
            
            let distance = ((center_x - pip_center_x).pow(2) + (center_y - pip_center_y).pow(2)) as f64;
            let distance = distance.sqrt();
            
            if distance < (threshold as f64 * 5.0) {
                // Snap to zone center
                let snapped_x = zone.x + ((zone.width - width) / 2) as i32;
                let snapped_y = zone.y + ((zone.height - height) / 2) as i32;
                return (snapped_x, snapped_y, zone.position);
            }
        }
        
        // No snap, return original position
        (x, y, PipPosition::Custom)
    }
    
    pub fn get_snap_zones(&self) -> Vec<SnapZone> {
        self.snap_zones.lock().unwrap().clone()
    }
    
    pub fn update_snap_zones(&self, screen_width: i32, screen_height: i32) {
        let mut zones = self.snap_zones.lock().unwrap();
        let pip_width = 480;
        let pip_height = 270;
        let padding = 20;
        
        *zones = vec![
            SnapZone {
                id: "top-left".to_string(),
                name: "Top Left".to_string(),
                x: padding,
                y: padding,
                width: pip_width,
                height: pip_height,
                position: PipPosition::TopLeft,
                active: true,
            },
            SnapZone {
                id: "top-right".to_string(),
                name: "Top Right".to_string(),
                x: screen_width - pip_width as i32 - padding,
                y: padding,
                width: pip_width,
                height: pip_height,
                position: PipPosition::TopRight,
                active: true,
            },
            SnapZone {
                id: "bottom-left".to_string(),
                name: "Bottom Left".to_string(),
                x: padding,
                y: screen_height - pip_height as i32 - padding,
                width: pip_width,
                height: pip_height,
                position: PipPosition::BottomLeft,
                active: true,
            },
            SnapZone {
                id: "bottom-right".to_string(),
                name: "Bottom Right".to_string(),
                x: screen_width - pip_width as i32 - padding,
                y: screen_height - pip_height as i32 - padding,
                width: pip_width,
                height: pip_height,
                position: PipPosition::BottomRight,
                active: true,
            },
            SnapZone {
                id: "center".to_string(),
                name: "Center".to_string(),
                x: (screen_width - pip_width as i32) / 2,
                y: (screen_height - pip_height as i32) / 2,
                width: pip_width,
                height: pip_height,
                position: PipPosition::Center,
                active: true,
            },
        ];
    }
    
    pub fn set_snap_zone_active(&self, zone_id: &str, active: bool) -> Result<(), String> {
        let mut zones = self.snap_zones.lock().unwrap();
        
        if let Some(zone) = zones.iter_mut().find(|z| z.id == zone_id) {
            zone.active = active;
            Ok(())
        } else {
            Err(format!("Snap zone '{}' not found", zone_id))
        }
    }
    
    // ==================== Statistics ====================
    
    pub fn get_stats(&self) -> PipStats {
        self.stats.lock().unwrap().clone()
    }
    
    pub fn reset_stats(&self) {
        *self.stats.lock().unwrap() = PipStats::default();
        self.update_active_count();
    }
    
    pub fn add_watch_time(&self, seconds: u64) {
        self.stats.lock().unwrap().total_watch_time_seconds += seconds;
    }
    
    fn update_active_count(&self) {
        let count = self.windows.lock().unwrap().len();
        self.stats.lock().unwrap().current_active_windows = count;
    }
    
    // ==================== Position Memory ====================
    
    pub fn clear_position_memory(&self) {
        self.position_memory.lock().unwrap().clear();
    }
    
    pub fn get_remembered_position(&self, tab_id: &str, selector: &str) -> Option<(i32, i32)> {
        let position_key = format!("{}:{}", tab_id, selector);
        self.position_memory.lock().unwrap().get(&position_key).copied()
    }
}

impl Default for BrowserPipService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_create_pip_window() {
        let service = BrowserPipService::new();
        
        let result = service.create_pip_window("tab1", "video", PipContentType::Video, Some("Test Video".to_string()));
        assert!(result.is_ok());
        
        let window = result.unwrap();
        assert_eq!(window.tab_id, "tab1");
        assert_eq!(window.source_selector, "video");
        assert_eq!(window.title, "Test Video");
    }
    
    #[test]
    fn test_max_windows_limit() {
        let service = BrowserPipService::new();
        service.set_max_windows(2);
        
        let _ = service.create_pip_window("tab1", "video1", PipContentType::Video, None);
        let _ = service.create_pip_window("tab1", "video2", PipContentType::Video, None);
        let result = service.create_pip_window("tab1", "video3", PipContentType::Video, None);
        
        assert!(result.is_err());
    }
    
    #[test]
    fn test_playback_controls() {
        let service = BrowserPipService::new();
        
        let window = service.create_pip_window("tab1", "video", PipContentType::Video, None).unwrap();
        let window_id = window.id;
        
        assert!(!window.paused);
        
        service.pause(&window_id).unwrap();
        let window = service.get_window(&window_id).unwrap();
        assert!(window.paused);
        
        service.toggle_playback(&window_id).unwrap();
        let window = service.get_window(&window_id).unwrap();
        assert!(!window.paused);
    }
    
    #[test]
    fn test_volume_controls() {
        let service = BrowserPipService::new();
        
        let window = service.create_pip_window("tab1", "video", PipContentType::Video, None).unwrap();
        let window_id = window.id;
        
        service.set_volume(&window_id, 0.5).unwrap();
        let window = service.get_window(&window_id).unwrap();
        assert!((window.volume - 0.5).abs() < 0.001);
        
        service.toggle_mute(&window_id).unwrap();
        let window = service.get_window(&window_id).unwrap();
        assert!(window.muted);
    }
}
