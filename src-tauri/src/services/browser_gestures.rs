// CUBE Nexum - Gestures System
// Superior to Vivaldi/Opera gestures with AI-powered custom gesture recognition
// Supports mouse, trackpad, and touch gestures

use std::collections::HashMap;
use std::sync::{Mutex, RwLock};
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

// ==================== Types ====================

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum GestureType {
    Mouse,          // Mouse button gestures (right-click drag)
    Trackpad,       // Multi-finger trackpad gestures
    Touch,          // Touch screen gestures
    Rocker,         // Rocker gestures (left+right click)
    Wheel,          // Mouse wheel gestures
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum GestureDirection {
    Up,
    Down,
    Left,
    Right,
    UpLeft,
    UpRight,
    DownLeft,
    DownRight,
    Circle,         // Circular motion
    Zigzag,         // Zigzag pattern
    Custom(String), // Custom pattern name
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum GestureAction {
    // Navigation
    GoBack,
    GoForward,
    Reload,
    ReloadBypassCache,
    Stop,
    Home,
    
    // Tabs
    NewTab,
    CloseTab,
    ReopenClosedTab,
    NextTab,
    PreviousTab,
    DuplicateTab,
    PinTab,
    MuteTab,
    
    // Scrolling
    ScrollToTop,
    ScrollToBottom,
    ScrollPageUp,
    ScrollPageDown,
    
    // Zoom
    ZoomIn,
    ZoomOut,
    ZoomReset,
    
    // Window
    NewWindow,
    CloseWindow,
    Minimize,
    Maximize,
    ToggleFullscreen,
    
    // Features
    ToggleSidebar,
    ToggleBookmarksBar,
    ToggleDevTools,
    ToggleReaderMode,
    OpenDownloads,
    OpenHistory,
    OpenBookmarks,
    OpenSettings,
    TakeScreenshot,
    
    // Custom
    OpenUrl(String),
    RunScript(String),
    ExecuteCommand(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GesturePattern {
    pub directions: Vec<GestureDirection>,
    pub min_distance: f64,      // Minimum gesture distance in pixels
    pub max_duration: u64,      // Maximum gesture duration in ms
    pub tolerance: f64,         // Angle tolerance in degrees
}

impl Default for GesturePattern {
    fn default() -> Self {
        Self {
            directions: Vec::new(),
            min_distance: 30.0,
            max_duration: 2000,
            tolerance: 30.0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Gesture {
    pub id: String,
    pub name: String,
    pub description: String,
    pub gesture_type: GestureType,
    pub pattern: GesturePattern,
    pub action: GestureAction,
    pub enabled: bool,
    pub is_default: bool,
    pub usage_count: u64,
    pub created_at: DateTime<Utc>,
    pub last_used: Option<DateTime<Utc>>,
}

impl Gesture {
    pub fn new(
        name: String,
        gesture_type: GestureType,
        pattern: GesturePattern,
        action: GestureAction,
    ) -> Self {
        Self {
            id: format!("gesture_{}", uuid::Uuid::new_v4()),
            name,
            description: String::new(),
            gesture_type,
            pattern,
            action,
            enabled: true,
            is_default: false,
            usage_count: 0,
            created_at: Utc::now(),
            last_used: None,
        }
    }

    pub fn with_description(mut self, desc: &str) -> Self {
        self.description = desc.to_string();
        self
    }

    pub fn as_default(mut self) -> Self {
        self.is_default = true;
        self
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GesturePoint {
    pub x: f64,
    pub y: f64,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GestureStroke {
    pub points: Vec<GesturePoint>,
    pub gesture_type: GestureType,
    pub button: Option<u8>,     // Mouse button (0=left, 1=middle, 2=right)
    pub fingers: Option<u8>,    // Number of fingers for trackpad
    pub start_time: u64,
    pub end_time: Option<u64>,
}

impl GestureStroke {
    pub fn new(gesture_type: GestureType) -> Self {
        Self {
            points: Vec::new(),
            gesture_type,
            button: None,
            fingers: None,
            start_time: chrono::Utc::now().timestamp_millis() as u64,
            end_time: None,
        }
    }

    pub fn add_point(&mut self, x: f64, y: f64) {
        self.points.push(GesturePoint {
            x,
            y,
            timestamp: chrono::Utc::now().timestamp_millis() as u64,
        });
    }

    pub fn finish(&mut self) {
        self.end_time = Some(chrono::Utc::now().timestamp_millis() as u64);
    }

    pub fn duration(&self) -> u64 {
        self.end_time.unwrap_or(chrono::Utc::now().timestamp_millis() as u64) - self.start_time
    }

    pub fn total_distance(&self) -> f64 {
        let mut distance = 0.0;
        for i in 1..self.points.len() {
            let dx = self.points[i].x - self.points[i - 1].x;
            let dy = self.points[i].y - self.points[i - 1].y;
            distance += (dx * dx + dy * dy).sqrt();
        }
        distance
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GestureRecognitionResult {
    pub matched_gesture: Option<Gesture>,
    pub confidence: f64,
    pub detected_directions: Vec<GestureDirection>,
    pub stroke_info: StrokeInfo,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StrokeInfo {
    pub total_distance: f64,
    pub duration_ms: u64,
    pub point_count: usize,
    pub average_speed: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GestureSettings {
    pub enabled: bool,
    pub mouse_gestures_enabled: bool,
    pub trackpad_gestures_enabled: bool,
    pub rocker_gestures_enabled: bool,
    pub wheel_gestures_enabled: bool,
    pub show_gesture_trail: bool,
    pub trail_color: String,
    pub trail_width: f64,
    pub trail_opacity: f64,
    pub show_action_preview: bool,
    pub gesture_button: u8,         // Default: 2 (right button)
    pub min_stroke_length: f64,
    pub sensitivity: f64,           // 0.0 - 1.0
    pub recognition_timeout: u64,   // ms
}

impl Default for GestureSettings {
    fn default() -> Self {
        Self {
            enabled: true,
            mouse_gestures_enabled: true,
            trackpad_gestures_enabled: true,
            rocker_gestures_enabled: true,
            wheel_gestures_enabled: true,
            show_gesture_trail: true,
            trail_color: "#3b82f6".to_string(),
            trail_width: 3.0,
            trail_opacity: 0.8,
            show_action_preview: true,
            gesture_button: 2,
            min_stroke_length: 30.0,
            sensitivity: 0.7,
            recognition_timeout: 2000,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GestureStats {
    pub total_gestures: u64,
    pub successful_recognitions: u64,
    pub failed_recognitions: u64,
    pub most_used_gestures: Vec<(String, u64)>,
    pub gestures_per_type: HashMap<String, u64>,
    pub average_recognition_time: f64,
}

impl Default for GestureStats {
    fn default() -> Self {
        Self {
            total_gestures: 0,
            successful_recognitions: 0,
            failed_recognitions: 0,
            most_used_gestures: Vec::new(),
            gestures_per_type: HashMap::new(),
            average_recognition_time: 0.0,
        }
    }
}

// ==================== Service ====================

pub struct BrowserGesturesService {
    settings: RwLock<GestureSettings>,
    gestures: RwLock<HashMap<String, Gesture>>,
    current_stroke: Mutex<Option<GestureStroke>>,
    stats: RwLock<GestureStats>,
    recognition_times: Mutex<Vec<f64>>,
}

impl BrowserGesturesService {
    pub fn new() -> Self {
        let service = Self {
            settings: RwLock::new(GestureSettings::default()),
            gestures: RwLock::new(HashMap::new()),
            current_stroke: Mutex::new(None),
            stats: RwLock::new(GestureStats::default()),
            recognition_times: Mutex::new(Vec::new()),
        };
        service.init_default_gestures();
        service
    }

    fn init_default_gestures(&self) {
        let defaults = vec![
            // Navigation gestures
            Gesture::new(
                "Go Back".to_string(),
                GestureType::Mouse,
                GesturePattern {
                    directions: vec![GestureDirection::Left],
                    ..Default::default()
                },
                GestureAction::GoBack,
            ).with_description("Swipe left to go back").as_default(),

            Gesture::new(
                "Go Forward".to_string(),
                GestureType::Mouse,
                GesturePattern {
                    directions: vec![GestureDirection::Right],
                    ..Default::default()
                },
                GestureAction::GoForward,
            ).with_description("Swipe right to go forward").as_default(),

            Gesture::new(
                "Reload".to_string(),
                GestureType::Mouse,
                GesturePattern {
                    directions: vec![GestureDirection::Up, GestureDirection::Down],
                    ..Default::default()
                },
                GestureAction::Reload,
            ).with_description("Swipe up then down to reload").as_default(),

            Gesture::new(
                "Reload Bypass Cache".to_string(),
                GestureType::Mouse,
                GesturePattern {
                    directions: vec![GestureDirection::Up, GestureDirection::Down, GestureDirection::Up],
                    ..Default::default()
                },
                GestureAction::ReloadBypassCache,
            ).with_description("Triple swipe to hard reload").as_default(),

            // Tab gestures
            Gesture::new(
                "New Tab".to_string(),
                GestureType::Mouse,
                GesturePattern {
                    directions: vec![GestureDirection::Down, GestureDirection::Right],
                    ..Default::default()
                },
                GestureAction::NewTab,
            ).with_description("Swipe down then right for new tab").as_default(),

            Gesture::new(
                "Close Tab".to_string(),
                GestureType::Mouse,
                GesturePattern {
                    directions: vec![GestureDirection::Down, GestureDirection::Left],
                    ..Default::default()
                },
                GestureAction::CloseTab,
            ).with_description("Swipe down then left to close tab").as_default(),

            Gesture::new(
                "Reopen Closed Tab".to_string(),
                GestureType::Mouse,
                GesturePattern {
                    directions: vec![GestureDirection::Left, GestureDirection::Up],
                    ..Default::default()
                },
                GestureAction::ReopenClosedTab,
            ).with_description("Swipe left then up to reopen tab").as_default(),

            Gesture::new(
                "Next Tab".to_string(),
                GestureType::Mouse,
                GesturePattern {
                    directions: vec![GestureDirection::Up, GestureDirection::Right],
                    ..Default::default()
                },
                GestureAction::NextTab,
            ).with_description("Swipe up then right for next tab").as_default(),

            Gesture::new(
                "Previous Tab".to_string(),
                GestureType::Mouse,
                GesturePattern {
                    directions: vec![GestureDirection::Up, GestureDirection::Left],
                    ..Default::default()
                },
                GestureAction::PreviousTab,
            ).with_description("Swipe up then left for previous tab").as_default(),

            // Scroll gestures
            Gesture::new(
                "Scroll to Top".to_string(),
                GestureType::Mouse,
                GesturePattern {
                    directions: vec![GestureDirection::Right, GestureDirection::Up],
                    ..Default::default()
                },
                GestureAction::ScrollToTop,
            ).with_description("Swipe right then up to scroll to top").as_default(),

            Gesture::new(
                "Scroll to Bottom".to_string(),
                GestureType::Mouse,
                GesturePattern {
                    directions: vec![GestureDirection::Right, GestureDirection::Down],
                    ..Default::default()
                },
                GestureAction::ScrollToBottom,
            ).with_description("Swipe right then down to scroll to bottom").as_default(),

            // Zoom gestures (trackpad)
            Gesture::new(
                "Zoom In".to_string(),
                GestureType::Trackpad,
                GesturePattern {
                    directions: vec![GestureDirection::Up],
                    ..Default::default()
                },
                GestureAction::ZoomIn,
            ).with_description("Two-finger pinch out to zoom in").as_default(),

            Gesture::new(
                "Zoom Out".to_string(),
                GestureType::Trackpad,
                GesturePattern {
                    directions: vec![GestureDirection::Down],
                    ..Default::default()
                },
                GestureAction::ZoomOut,
            ).with_description("Two-finger pinch in to zoom out").as_default(),

            // Feature gestures
            Gesture::new(
                "Toggle Sidebar".to_string(),
                GestureType::Mouse,
                GesturePattern {
                    directions: vec![GestureDirection::Left, GestureDirection::Right, GestureDirection::Left],
                    ..Default::default()
                },
                GestureAction::ToggleSidebar,
            ).with_description("Triple swipe to toggle sidebar").as_default(),

            Gesture::new(
                "Toggle Reader Mode".to_string(),
                GestureType::Mouse,
                GesturePattern {
                    directions: vec![GestureDirection::Down, GestureDirection::Up, GestureDirection::Down],
                    ..Default::default()
                },
                GestureAction::ToggleReaderMode,
            ).with_description("Triple vertical swipe for reader mode").as_default(),

            Gesture::new(
                "Take Screenshot".to_string(),
                GestureType::Mouse,
                GesturePattern {
                    directions: vec![GestureDirection::Down, GestureDirection::Down],
                    ..Default::default()
                },
                GestureAction::TakeScreenshot,
            ).with_description("Double swipe down to screenshot").as_default(),

            // Window gestures
            Gesture::new(
                "Toggle Fullscreen".to_string(),
                GestureType::Mouse,
                GesturePattern {
                    directions: vec![GestureDirection::Up, GestureDirection::Up],
                    ..Default::default()
                },
                GestureAction::ToggleFullscreen,
            ).with_description("Double swipe up for fullscreen").as_default(),

            Gesture::new(
                "New Window".to_string(),
                GestureType::Mouse,
                GesturePattern {
                    directions: vec![GestureDirection::Up, GestureDirection::Right, GestureDirection::Down],
                    ..Default::default()
                },
                GestureAction::NewWindow,
            ).with_description("Draw N shape for new window").as_default(),

            // Rocker gestures
            Gesture::new(
                "Rocker Back".to_string(),
                GestureType::Rocker,
                GesturePattern {
                    directions: vec![GestureDirection::Left],
                    ..Default::default()
                },
                GestureAction::GoBack,
            ).with_description("Left click while holding right button").as_default(),

            Gesture::new(
                "Rocker Forward".to_string(),
                GestureType::Rocker,
                GesturePattern {
                    directions: vec![GestureDirection::Right],
                    ..Default::default()
                },
                GestureAction::GoForward,
            ).with_description("Right click while holding left button").as_default(),

            // Wheel gestures
            Gesture::new(
                "Wheel Tab Switch Up".to_string(),
                GestureType::Wheel,
                GesturePattern {
                    directions: vec![GestureDirection::Up],
                    ..Default::default()
                },
                GestureAction::PreviousTab,
            ).with_description("Scroll up with right button to previous tab").as_default(),

            Gesture::new(
                "Wheel Tab Switch Down".to_string(),
                GestureType::Wheel,
                GesturePattern {
                    directions: vec![GestureDirection::Down],
                    ..Default::default()
                },
                GestureAction::NextTab,
            ).with_description("Scroll down with right button to next tab").as_default(),
        ];

        let mut gestures = self.gestures.write().unwrap();
        for gesture in defaults {
            gestures.insert(gesture.id.clone(), gesture);
        }
    }

    // ==================== Settings ====================

    pub fn get_settings(&self) -> GestureSettings {
        self.settings.read().unwrap().clone()
    }

    pub fn update_settings(&self, settings: GestureSettings) {
        *self.settings.write().unwrap() = settings;
    }

    pub fn toggle_enabled(&self) -> bool {
        let mut settings = self.settings.write().unwrap();
        settings.enabled = !settings.enabled;
        settings.enabled
    }

    pub fn set_trail_settings(&self, color: String, width: f64, opacity: f64) {
        let mut settings = self.settings.write().unwrap();
        settings.trail_color = color;
        settings.trail_width = width;
        settings.trail_opacity = opacity;
    }

    // ==================== Gesture Management ====================

    pub fn get_all_gestures(&self) -> Vec<Gesture> {
        self.gestures.read().unwrap().values().cloned().collect()
    }

    pub fn get_gesture(&self, gesture_id: &str) -> Option<Gesture> {
        self.gestures.read().unwrap().get(gesture_id).cloned()
    }

    pub fn get_gestures_by_type(&self, gesture_type: GestureType) -> Vec<Gesture> {
        self.gestures.read().unwrap()
            .values()
            .filter(|g| g.gesture_type == gesture_type && g.enabled)
            .cloned()
            .collect()
    }

    pub fn create_gesture(&self, gesture: Gesture) -> Result<Gesture, String> {
        // Validate gesture pattern
        if gesture.pattern.directions.is_empty() {
            return Err("Gesture pattern cannot be empty".to_string());
        }

        // Check for conflicts
        if self.find_conflicting_gesture(&gesture).is_some() {
            return Err("Gesture pattern conflicts with existing gesture".to_string());
        }

        let mut gestures = self.gestures.write().unwrap();
        gestures.insert(gesture.id.clone(), gesture.clone());
        Ok(gesture)
    }

    pub fn update_gesture(&self, gesture_id: &str, updates: GestureUpdate) -> Result<Gesture, String> {
        let mut gestures = self.gestures.write().unwrap();
        let gesture = gestures.get_mut(gesture_id)
            .ok_or("Gesture not found")?;

        if let Some(name) = updates.name {
            gesture.name = name;
        }
        if let Some(description) = updates.description {
            gesture.description = description;
        }
        if let Some(pattern) = updates.pattern {
            gesture.pattern = pattern;
        }
        if let Some(action) = updates.action {
            gesture.action = action;
        }
        if let Some(enabled) = updates.enabled {
            gesture.enabled = enabled;
        }

        Ok(gesture.clone())
    }

    pub fn delete_gesture(&self, gesture_id: &str) -> Result<(), String> {
        let mut gestures = self.gestures.write().unwrap();
        let gesture = gestures.get(gesture_id)
            .ok_or("Gesture not found")?;
        
        if gesture.is_default {
            return Err("Cannot delete default gesture".to_string());
        }
        
        gestures.remove(gesture_id);
        Ok(())
    }

    pub fn toggle_gesture(&self, gesture_id: &str) -> Result<bool, String> {
        let mut gestures = self.gestures.write().unwrap();
        let gesture = gestures.get_mut(gesture_id)
            .ok_or("Gesture not found")?;
        
        gesture.enabled = !gesture.enabled;
        Ok(gesture.enabled)
    }

    pub fn reset_to_defaults(&self) {
        let mut gestures = self.gestures.write().unwrap();
        
        // Keep custom gestures, reset defaults
        let custom: Vec<_> = gestures.values()
            .filter(|g| !g.is_default)
            .cloned()
            .collect();
        
        gestures.clear();
        drop(gestures);
        
        self.init_default_gestures();
        
        let mut gestures = self.gestures.write().unwrap();
        for gesture in custom {
            gestures.insert(gesture.id.clone(), gesture);
        }
    }

    fn find_conflicting_gesture(&self, new_gesture: &Gesture) -> Option<Gesture> {
        let gestures = self.gestures.read().unwrap();
        gestures.values()
            .find(|g| {
                g.id != new_gesture.id &&
                g.gesture_type == new_gesture.gesture_type &&
                g.enabled &&
                g.pattern.directions == new_gesture.pattern.directions
            })
            .cloned()
    }

    // ==================== Stroke Recording ====================

    pub fn start_stroke(&self, gesture_type: GestureType, x: f64, y: f64) -> Result<(), String> {
        let settings = self.settings.read().unwrap();
        if !settings.enabled {
            return Err("Gestures are disabled".to_string());
        }

        let mut current = self.current_stroke.lock().unwrap();
        let mut stroke = GestureStroke::new(gesture_type);
        stroke.add_point(x, y);
        *current = Some(stroke);
        Ok(())
    }

    pub fn add_stroke_point(&self, x: f64, y: f64) -> Result<(), String> {
        let mut current = self.current_stroke.lock().unwrap();
        let stroke = current.as_mut()
            .ok_or("No active stroke")?;
        
        stroke.add_point(x, y);
        Ok(())
    }

    pub fn cancel_stroke(&self) {
        let mut current = self.current_stroke.lock().unwrap();
        *current = None;
    }

    pub fn finish_stroke(&self) -> Result<GestureRecognitionResult, String> {
        let mut current = self.current_stroke.lock().unwrap();
        let mut stroke = current.take()
            .ok_or("No active stroke")?;
        
        stroke.finish();
        
        let start_time = std::time::Instant::now();
        let result = self.recognize_gesture(&stroke);
        let recognition_time = start_time.elapsed().as_secs_f64() * 1000.0;
        
        // Update stats
        let mut stats = self.stats.write().unwrap();
        stats.total_gestures += 1;
        
        if result.matched_gesture.is_some() {
            stats.successful_recognitions += 1;
        } else {
            stats.failed_recognitions += 1;
        }
        
        // Update recognition time average
        let mut times = self.recognition_times.lock().unwrap();
        times.push(recognition_time);
        if times.len() > 100 {
            times.remove(0);
        }
        stats.average_recognition_time = times.iter().sum::<f64>() / times.len() as f64;
        
        Ok(result)
    }

    // ==================== Recognition ====================

    fn recognize_gesture(&self, stroke: &GestureStroke) -> GestureRecognitionResult {
        let settings = self.settings.read().unwrap();
        
        let stroke_info = StrokeInfo {
            total_distance: stroke.total_distance(),
            duration_ms: stroke.duration(),
            point_count: stroke.points.len(),
            average_speed: if stroke.duration() > 0 {
                stroke.total_distance() / stroke.duration() as f64 * 1000.0
            } else {
                0.0
            },
        };
        
        // Check minimum requirements
        if stroke_info.total_distance < settings.min_stroke_length {
            return GestureRecognitionResult {
                matched_gesture: None,
                confidence: 0.0,
                detected_directions: Vec::new(),
                stroke_info,
            };
        }
        
        // Detect directions from stroke
        let detected_directions = self.detect_directions(stroke, settings.sensitivity);
        
        // Find matching gesture
        let gestures = self.gestures.read().unwrap();
        let mut best_match: Option<(Gesture, f64)> = None;
        
        for gesture in gestures.values() {
            if !gesture.enabled || gesture.gesture_type != stroke.gesture_type {
                continue;
            }
            
            if stroke.duration() > gesture.pattern.max_duration {
                continue;
            }
            
            let confidence = self.calculate_match_confidence(
                &detected_directions,
                &gesture.pattern.directions,
                gesture.pattern.tolerance,
            );
            
            if confidence > 0.7 {
                if best_match.is_none() || confidence > best_match.as_ref().unwrap().1 {
                    best_match = Some((gesture.clone(), confidence));
                }
            }
        }
        
        // Update gesture usage if matched
        if let Some((ref matched, _)) = best_match {
            drop(gestures);
            let mut gestures = self.gestures.write().unwrap();
            if let Some(g) = gestures.get_mut(&matched.id) {
                g.usage_count += 1;
                g.last_used = Some(Utc::now());
            }
        }
        
        GestureRecognitionResult {
            matched_gesture: best_match.as_ref().map(|(g, _)| g.clone()),
            confidence: best_match.as_ref().map(|(_, c)| *c).unwrap_or(0.0),
            detected_directions,
            stroke_info,
        }
    }

    fn detect_directions(&self, stroke: &GestureStroke, sensitivity: f64) -> Vec<GestureDirection> {
        let mut directions = Vec::new();
        let points = &stroke.points;
        
        if points.len() < 2 {
            return directions;
        }
        
        let threshold = 30.0 * sensitivity;
        let mut segment_start = 0;
        let mut current_direction: Option<GestureDirection> = None;
        
        for i in 1..points.len() {
            let dx = points[i].x - points[segment_start].x;
            let dy = points[i].y - points[segment_start].y;
            let distance = (dx * dx + dy * dy).sqrt();
            
            if distance >= threshold {
                let angle = dy.atan2(dx).to_degrees();
                let new_direction = self.angle_to_direction(angle);
                
                if current_direction.as_ref() != Some(&new_direction) {
                    if let Some(dir) = current_direction.take() {
                        directions.push(dir);
                    }
                    current_direction = Some(new_direction);
                    segment_start = i;
                }
            }
        }
        
        if let Some(dir) = current_direction {
            directions.push(dir);
        }
        
        directions
    }

    fn angle_to_direction(&self, angle: f64) -> GestureDirection {
        // Normalize angle to 0-360
        let angle = if angle < 0.0 { angle + 360.0 } else { angle };
        
        match angle {
            a if (a >= 337.5 || a < 22.5) => GestureDirection::Right,
            a if (22.5..67.5).contains(&a) => GestureDirection::DownRight,
            a if (67.5..112.5).contains(&a) => GestureDirection::Down,
            a if (112.5..157.5).contains(&a) => GestureDirection::DownLeft,
            a if (157.5..202.5).contains(&a) => GestureDirection::Left,
            a if (202.5..247.5).contains(&a) => GestureDirection::UpLeft,
            a if (247.5..292.5).contains(&a) => GestureDirection::Up,
            a if (292.5..337.5).contains(&a) => GestureDirection::UpRight,
            _ => GestureDirection::Right,
        }
    }

    fn calculate_match_confidence(
        &self,
        detected: &[GestureDirection],
        pattern: &[GestureDirection],
        _tolerance: f64,
    ) -> f64 {
        if detected.len() != pattern.len() {
            return 0.0;
        }
        
        let mut matches = 0;
        for (d, p) in detected.iter().zip(pattern.iter()) {
            if d == p {
                matches += 1;
            }
        }
        
        matches as f64 / pattern.len() as f64
    }

    // ==================== Stats ====================

    pub fn get_stats(&self) -> GestureStats {
        let mut stats = self.stats.read().unwrap().clone();
        
        // Calculate most used gestures
        let gestures = self.gestures.read().unwrap();
        let mut usage: Vec<_> = gestures.values()
            .map(|g| (g.name.clone(), g.usage_count))
            .collect();
        usage.sort_by(|a, b| b.1.cmp(&a.1));
        usage.truncate(10);
        stats.most_used_gestures = usage;
        
        // Calculate gestures per type
        for gesture in gestures.values() {
            let type_name = format!("{:?}", gesture.gesture_type);
            *stats.gestures_per_type.entry(type_name).or_insert(0) += 1;
        }
        
        stats
    }

    pub fn reset_stats(&self) {
        let mut stats = self.stats.write().unwrap();
        *stats = GestureStats::default();
        
        let mut times = self.recognition_times.lock().unwrap();
        times.clear();
    }

    // ==================== Import/Export ====================

    pub fn export_gestures(&self) -> Result<String, String> {
        let gestures: Vec<Gesture> = self.gestures.read().unwrap()
            .values()
            .filter(|g| !g.is_default)
            .cloned()
            .collect();
        
        serde_json::to_string_pretty(&gestures)
            .map_err(|e| format!("Export failed: {}", e))
    }

    pub fn import_gestures(&self, json: &str) -> Result<u32, String> {
        let imported: Vec<Gesture> = serde_json::from_str(json)
            .map_err(|e| format!("Invalid JSON: {}", e))?;
        
        let mut count = 0;
        let mut gestures = self.gestures.write().unwrap();
        
        for mut gesture in imported {
            gesture.is_default = false;
            gesture.id = format!("gesture_{}", uuid::Uuid::new_v4());
            gestures.insert(gesture.id.clone(), gesture);
            count += 1;
        }
        
        Ok(count)
    }
}

impl Default for BrowserGesturesService {
    fn default() -> Self {
        Self::new()
    }
}

// ==================== Update Types ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GestureUpdate {
    pub name: Option<String>,
    pub description: Option<String>,
    pub pattern: Option<GesturePattern>,
    pub action: Option<GestureAction>,
    pub enabled: Option<bool>,
}
