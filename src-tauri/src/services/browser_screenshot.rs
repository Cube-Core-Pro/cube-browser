// CUBE Nexum - Screenshot & Capture System
// Superior to Chrome, Firefox, Edge screenshot tools
// Full-page, region, element capture with annotations

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};

// ==================== Enums ====================

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CaptureMode {
    VisibleArea,
    FullPage,
    SelectedRegion,
    Element,
    Window,
    AllTabs,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ImageFormat {
    PNG,
    JPEG,
    WEBP,
    PDF,
}

impl ImageFormat {
    pub fn extension(&self) -> &str {
        match self {
            ImageFormat::PNG => "png",
            ImageFormat::JPEG => "jpg",
            ImageFormat::WEBP => "webp",
            ImageFormat::PDF => "pdf",
        }
    }

    pub fn mime_type(&self) -> &str {
        match self {
            ImageFormat::PNG => "image/png",
            ImageFormat::JPEG => "image/jpeg",
            ImageFormat::WEBP => "image/webp",
            ImageFormat::PDF => "application/pdf",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AnnotationType {
    Arrow,
    Rectangle,
    Circle,
    Line,
    FreeHand,
    Text,
    Highlight,
    Blur,
    Pixelate,
    Emoji,
    Number,
    Crop,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ScreenshotAction {
    SaveToFile,
    CopyToClipboard,
    Edit,
    Share,
    Upload,
    Print,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum UploadDestination {
    Imgur,
    CloudFlare,
    Custom(String),
}

// ==================== Structs ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScreenshotSettings {
    pub enabled: bool,
    pub default_format: ImageFormat,
    pub jpeg_quality: u8,
    pub webp_quality: u8,
    pub default_action: ScreenshotAction,
    pub save_directory: String,
    pub filename_pattern: String,
    pub include_timestamp: bool,
    pub include_url: bool,
    pub show_cursor: bool,
    pub play_sound: bool,
    pub show_notification: bool,
    pub auto_copy_to_clipboard: bool,
    pub open_editor_after_capture: bool,
    pub capture_delay_ms: u32,
    pub scroll_delay_ms: u32,
    pub keyboard_shortcuts: KeyboardShortcuts,
}

impl Default for ScreenshotSettings {
    fn default() -> Self {
        Self {
            enabled: true,
            default_format: ImageFormat::PNG,
            jpeg_quality: 92,
            webp_quality: 90,
            default_action: ScreenshotAction::Edit,
            save_directory: "~/Pictures/CUBE Screenshots".to_string(),
            filename_pattern: "CUBE_Screenshot_{timestamp}".to_string(),
            include_timestamp: true,
            include_url: true,
            show_cursor: false,
            play_sound: true,
            show_notification: true,
            auto_copy_to_clipboard: true,
            open_editor_after_capture: true,
            capture_delay_ms: 0,
            scroll_delay_ms: 100,
            keyboard_shortcuts: KeyboardShortcuts::default(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyboardShortcuts {
    pub capture_visible: String,
    pub capture_full_page: String,
    pub capture_region: String,
    pub capture_element: String,
    pub open_editor: String,
    pub quick_save: String,
}

impl Default for KeyboardShortcuts {
    fn default() -> Self {
        Self {
            capture_visible: "Ctrl+Shift+S".to_string(),
            capture_full_page: "Ctrl+Shift+F".to_string(),
            capture_region: "Ctrl+Shift+R".to_string(),
            capture_element: "Ctrl+Shift+E".to_string(),
            open_editor: "Ctrl+Shift+A".to_string(),
            quick_save: "Ctrl+Shift+Q".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptureRegion {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptureOptions {
    pub mode: CaptureMode,
    pub format: ImageFormat,
    pub quality: u8,
    pub region: Option<CaptureRegion>,
    pub element_selector: Option<String>,
    pub include_scrollbar: bool,
    pub capture_shadow_dom: bool,
    pub device_scale_factor: f64,
    pub delay_ms: u32,
}

impl Default for CaptureOptions {
    fn default() -> Self {
        Self {
            mode: CaptureMode::VisibleArea,
            format: ImageFormat::PNG,
            quality: 100,
            region: None,
            element_selector: None,
            include_scrollbar: false,
            capture_shadow_dom: true,
            device_scale_factor: 1.0,
            delay_ms: 0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Screenshot {
    pub id: String,
    pub url: String,
    pub title: String,
    pub mode: CaptureMode,
    pub format: ImageFormat,
    pub width: u32,
    pub height: u32,
    pub file_size: u64,
    pub file_path: Option<String>,
    pub data_url: Option<String>,
    pub thumbnail: Option<String>,
    pub annotations: Vec<Annotation>,
    pub created_at: u64,
    pub tags: Vec<String>,
    pub favorite: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Annotation {
    pub id: String,
    pub annotation_type: AnnotationType,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub rotation: f64,
    pub color: String,
    pub stroke_width: f64,
    pub fill: Option<String>,
    pub text: Option<String>,
    pub font_size: Option<f64>,
    pub font_family: Option<String>,
    pub points: Vec<Point>,
    pub blur_radius: Option<f64>,
    pub emoji: Option<String>,
    pub number: Option<u32>,
    pub arrow_head: Option<bool>,
    pub opacity: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EditorState {
    pub active: bool,
    pub screenshot_id: Option<String>,
    pub canvas_width: u32,
    pub canvas_height: u32,
    pub zoom: f64,
    pub pan_x: f64,
    pub pan_y: f64,
    pub selected_tool: AnnotationType,
    pub selected_color: String,
    pub stroke_width: f64,
    pub font_size: f64,
    pub history: Vec<String>,
    pub history_index: usize,
    pub can_undo: bool,
    pub can_redo: bool,
}

impl Default for EditorState {
    fn default() -> Self {
        Self {
            active: false,
            screenshot_id: None,
            canvas_width: 0,
            canvas_height: 0,
            zoom: 1.0,
            pan_x: 0.0,
            pan_y: 0.0,
            selected_tool: AnnotationType::Arrow,
            selected_color: "#ff0000".to_string(),
            stroke_width: 3.0,
            font_size: 16.0,
            history: vec![],
            history_index: 0,
            can_undo: false,
            can_redo: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScreenshotStats {
    pub total_screenshots: usize,
    pub total_size_mb: f64,
    pub screenshots_today: usize,
    pub screenshots_this_week: usize,
    pub most_used_mode: CaptureMode,
    pub most_used_format: ImageFormat,
    pub favorite_count: usize,
    pub annotated_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UploadResult {
    pub success: bool,
    pub url: Option<String>,
    pub delete_url: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecordingSettings {
    pub enabled: bool,
    pub fps: u32,
    pub include_audio: bool,
    pub include_cursor: bool,
    pub highlight_clicks: bool,
    pub max_duration_seconds: u32,
    pub output_format: String,
}

impl Default for RecordingSettings {
    fn default() -> Self {
        Self {
            enabled: true,
            fps: 30,
            include_audio: false,
            include_cursor: true,
            highlight_clicks: true,
            max_duration_seconds: 300,
            output_format: "webm".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Recording {
    pub id: String,
    pub url: String,
    pub title: String,
    pub duration_seconds: u32,
    pub file_path: String,
    pub file_size: u64,
    pub width: u32,
    pub height: u32,
    pub fps: u32,
    pub has_audio: bool,
    pub created_at: u64,
}

// ==================== Service ====================

pub struct BrowserScreenshotService {
    settings: ScreenshotSettings,
    recording_settings: RecordingSettings,
    screenshots: HashMap<String, Screenshot>,
    recordings: HashMap<String, Recording>,
    editor_state: EditorState,
    is_capturing: bool,
    is_recording: bool,
    current_recording_id: Option<String>,
    annotation_counter: u32,
}

impl BrowserScreenshotService {
    pub fn new() -> Self {
        Self {
            settings: ScreenshotSettings::default(),
            recording_settings: RecordingSettings::default(),
            screenshots: HashMap::new(),
            recordings: HashMap::new(),
            editor_state: EditorState::default(),
            is_capturing: false,
            is_recording: false,
            current_recording_id: None,
            annotation_counter: 0,
        }
    }

    fn current_timestamp() -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs()
    }

    fn generate_id(&self, prefix: &str) -> String {
        format!("{}_{}", prefix, Self::current_timestamp())
    }

    fn generate_filename(&self, format: &ImageFormat) -> String {
        let timestamp = Self::current_timestamp();
        format!(
            "{}_{}.{}",
            self.settings.filename_pattern.replace("{timestamp}", &timestamp.to_string()),
            timestamp,
            format.extension()
        )
    }

    // ==================== Settings ====================

    pub fn get_settings(&self) -> ScreenshotSettings {
        self.settings.clone()
    }

    pub fn update_settings(&mut self, settings: ScreenshotSettings) {
        self.settings = settings;
    }

    pub fn set_default_format(&mut self, format: ImageFormat) {
        self.settings.default_format = format;
    }

    pub fn set_default_action(&mut self, action: ScreenshotAction) {
        self.settings.default_action = action;
    }

    pub fn set_save_directory(&mut self, directory: String) {
        self.settings.save_directory = directory;
    }

    pub fn set_quality(&mut self, jpeg_quality: u8, webp_quality: u8) {
        self.settings.jpeg_quality = jpeg_quality;
        self.settings.webp_quality = webp_quality;
    }

    pub fn set_keyboard_shortcuts(&mut self, shortcuts: KeyboardShortcuts) {
        self.settings.keyboard_shortcuts = shortcuts;
    }

    pub fn get_keyboard_shortcuts(&self) -> KeyboardShortcuts {
        self.settings.keyboard_shortcuts.clone()
    }

    // ==================== Recording Settings ====================

    pub fn get_recording_settings(&self) -> RecordingSettings {
        self.recording_settings.clone()
    }

    pub fn update_recording_settings(&mut self, settings: RecordingSettings) {
        self.recording_settings = settings;
    }

    // ==================== Capture Operations ====================

    pub fn start_capture(&mut self, _options: CaptureOptions) -> Result<String, String> {
        if self.is_capturing {
            return Err("Capture already in progress".to_string());
        }

        self.is_capturing = true;
        let capture_id = self.generate_id("cap");
        Ok(capture_id)
    }

    pub fn capture_visible_area(&mut self, url: &str, title: &str) -> Result<Screenshot, String> {
        let options = CaptureOptions {
            mode: CaptureMode::VisibleArea,
            format: self.settings.default_format.clone(),
            quality: match self.settings.default_format {
                ImageFormat::JPEG => self.settings.jpeg_quality,
                ImageFormat::WEBP => self.settings.webp_quality,
                _ => 100,
            },
            ..Default::default()
        };

        self.execute_capture(url, title, options)
    }

    pub fn capture_full_page(&mut self, url: &str, title: &str) -> Result<Screenshot, String> {
        let options = CaptureOptions {
            mode: CaptureMode::FullPage,
            format: self.settings.default_format.clone(),
            quality: match self.settings.default_format {
                ImageFormat::JPEG => self.settings.jpeg_quality,
                ImageFormat::WEBP => self.settings.webp_quality,
                _ => 100,
            },
            ..Default::default()
        };

        self.execute_capture(url, title, options)
    }

    pub fn capture_region(&mut self, url: &str, title: &str, region: CaptureRegion) -> Result<Screenshot, String> {
        let options = CaptureOptions {
            mode: CaptureMode::SelectedRegion,
            format: self.settings.default_format.clone(),
            quality: match self.settings.default_format {
                ImageFormat::JPEG => self.settings.jpeg_quality,
                ImageFormat::WEBP => self.settings.webp_quality,
                _ => 100,
            },
            region: Some(region),
            ..Default::default()
        };

        self.execute_capture(url, title, options)
    }

    pub fn capture_element(&mut self, url: &str, title: &str, selector: String) -> Result<Screenshot, String> {
        let options = CaptureOptions {
            mode: CaptureMode::Element,
            format: self.settings.default_format.clone(),
            quality: match self.settings.default_format {
                ImageFormat::JPEG => self.settings.jpeg_quality,
                ImageFormat::WEBP => self.settings.webp_quality,
                _ => 100,
            },
            element_selector: Some(selector),
            ..Default::default()
        };

        self.execute_capture(url, title, options)
    }

    fn execute_capture(&mut self, url: &str, title: &str, options: CaptureOptions) -> Result<Screenshot, String> {
        self.is_capturing = true;

        // In a real implementation, this would use headless_chrome to capture
        // For now, we create a placeholder screenshot record
        let screenshot = Screenshot {
            id: self.generate_id("ss"),
            url: url.to_string(),
            title: title.to_string(),
            mode: options.mode,
            format: options.format,
            width: 1920,
            height: 1080,
            file_size: 0,
            file_path: Some(format!("{}/{}", self.settings.save_directory, self.generate_filename(&ImageFormat::PNG))),
            data_url: None,
            thumbnail: None,
            annotations: vec![],
            created_at: Self::current_timestamp(),
            tags: vec![],
            favorite: false,
        };

        self.screenshots.insert(screenshot.id.clone(), screenshot.clone());
        self.is_capturing = false;

        Ok(screenshot)
    }

    pub fn cancel_capture(&mut self) {
        self.is_capturing = false;
    }

    pub fn is_capturing(&self) -> bool {
        self.is_capturing
    }

    // ==================== Screenshot Management ====================

    pub fn get_screenshot(&self, screenshot_id: &str) -> Option<Screenshot> {
        self.screenshots.get(screenshot_id).cloned()
    }

    pub fn get_all_screenshots(&self) -> Vec<Screenshot> {
        let mut screenshots: Vec<_> = self.screenshots.values().cloned().collect();
        screenshots.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        screenshots
    }

    pub fn get_recent_screenshots(&self, limit: usize) -> Vec<Screenshot> {
        let mut screenshots = self.get_all_screenshots();
        screenshots.truncate(limit);
        screenshots
    }

    pub fn delete_screenshot(&mut self, screenshot_id: &str) -> Result<(), String> {
        self.screenshots.remove(screenshot_id)
            .map(|_| ())
            .ok_or_else(|| "Screenshot not found".to_string())
    }

    pub fn delete_all_screenshots(&mut self) {
        self.screenshots.clear();
    }

    pub fn toggle_favorite(&mut self, screenshot_id: &str) -> Result<bool, String> {
        let screenshot = self.screenshots.get_mut(screenshot_id)
            .ok_or_else(|| "Screenshot not found".to_string())?;

        screenshot.favorite = !screenshot.favorite;
        Ok(screenshot.favorite)
    }

    pub fn add_tag(&mut self, screenshot_id: &str, tag: String) -> Result<(), String> {
        let screenshot = self.screenshots.get_mut(screenshot_id)
            .ok_or_else(|| "Screenshot not found".to_string())?;

        if !screenshot.tags.contains(&tag) {
            screenshot.tags.push(tag);
        }
        Ok(())
    }

    pub fn remove_tag(&mut self, screenshot_id: &str, tag: &str) -> Result<(), String> {
        let screenshot = self.screenshots.get_mut(screenshot_id)
            .ok_or_else(|| "Screenshot not found".to_string())?;

        screenshot.tags.retain(|t| t != tag);
        Ok(())
    }

    pub fn search_screenshots(&self, query: &str) -> Vec<Screenshot> {
        let query_lower = query.to_lowercase();
        self.screenshots.values()
            .filter(|s| {
                s.title.to_lowercase().contains(&query_lower) ||
                s.url.to_lowercase().contains(&query_lower) ||
                s.tags.iter().any(|t| t.to_lowercase().contains(&query_lower))
            })
            .cloned()
            .collect()
    }

    pub fn get_favorites(&self) -> Vec<Screenshot> {
        self.screenshots.values()
            .filter(|s| s.favorite)
            .cloned()
            .collect()
    }

    // ==================== Editor Operations ====================

    pub fn open_editor(&mut self, screenshot_id: &str) -> Result<EditorState, String> {
        let screenshot = self.screenshots.get(screenshot_id)
            .ok_or_else(|| "Screenshot not found".to_string())?;

        self.editor_state = EditorState {
            active: true,
            screenshot_id: Some(screenshot_id.to_string()),
            canvas_width: screenshot.width,
            canvas_height: screenshot.height,
            zoom: 1.0,
            pan_x: 0.0,
            pan_y: 0.0,
            selected_tool: AnnotationType::Arrow,
            selected_color: "#ff0000".to_string(),
            stroke_width: 3.0,
            font_size: 16.0,
            history: vec![],
            history_index: 0,
            can_undo: false,
            can_redo: false,
        };

        Ok(self.editor_state.clone())
    }

    pub fn close_editor(&mut self) {
        self.editor_state = EditorState::default();
    }

    pub fn get_editor_state(&self) -> EditorState {
        self.editor_state.clone()
    }

    pub fn set_editor_tool(&mut self, tool: AnnotationType) {
        self.editor_state.selected_tool = tool;
    }

    pub fn set_editor_color(&mut self, color: String) {
        self.editor_state.selected_color = color;
    }

    pub fn set_editor_stroke_width(&mut self, width: f64) {
        self.editor_state.stroke_width = width;
    }

    pub fn set_editor_font_size(&mut self, size: f64) {
        self.editor_state.font_size = size;
    }

    pub fn set_editor_zoom(&mut self, zoom: f64) {
        self.editor_state.zoom = zoom.max(0.1).min(5.0);
    }

    pub fn set_editor_pan(&mut self, x: f64, y: f64) {
        self.editor_state.pan_x = x;
        self.editor_state.pan_y = y;
    }

    // ==================== Annotation Operations ====================

    pub fn add_annotation(&mut self, screenshot_id: &str, annotation: Annotation) -> Result<String, String> {
        // Generate ID first to avoid borrow conflicts
        let new_id = self.generate_id("ann");
        
        let screenshot = self.screenshots.get_mut(screenshot_id)
            .ok_or_else(|| "Screenshot not found".to_string())?;

        let mut new_annotation = annotation;
        new_annotation.id = new_id.clone();
        
        screenshot.annotations.push(new_annotation);

        Ok(new_id)
    }

    pub fn update_annotation(&mut self, screenshot_id: &str, annotation_id: &str, updates: Annotation) -> Result<(), String> {
        let screenshot = self.screenshots.get_mut(screenshot_id)
            .ok_or_else(|| "Screenshot not found".to_string())?;

        let annotation = screenshot.annotations.iter_mut()
            .find(|a| a.id == annotation_id)
            .ok_or_else(|| "Annotation not found".to_string())?;

        // Update fields
        annotation.x = updates.x;
        annotation.y = updates.y;
        annotation.width = updates.width;
        annotation.height = updates.height;
        annotation.rotation = updates.rotation;
        annotation.color = updates.color;
        annotation.stroke_width = updates.stroke_width;
        annotation.fill = updates.fill;
        annotation.text = updates.text;
        annotation.font_size = updates.font_size;
        annotation.opacity = updates.opacity;

        Ok(())
    }

    pub fn delete_annotation(&mut self, screenshot_id: &str, annotation_id: &str) -> Result<(), String> {
        let screenshot = self.screenshots.get_mut(screenshot_id)
            .ok_or_else(|| "Screenshot not found".to_string())?;

        screenshot.annotations.retain(|a| a.id != annotation_id);
        Ok(())
    }

    pub fn clear_annotations(&mut self, screenshot_id: &str) -> Result<(), String> {
        let screenshot = self.screenshots.get_mut(screenshot_id)
            .ok_or_else(|| "Screenshot not found".to_string())?;

        screenshot.annotations.clear();
        Ok(())
    }

    pub fn get_annotations(&self, screenshot_id: &str) -> Result<Vec<Annotation>, String> {
        let screenshot = self.screenshots.get(screenshot_id)
            .ok_or_else(|| "Screenshot not found".to_string())?;

        Ok(screenshot.annotations.clone())
    }

    // ==================== History (Undo/Redo) ====================

    pub fn undo(&mut self) -> bool {
        if self.editor_state.history_index > 0 {
            self.editor_state.history_index -= 1;
            self.editor_state.can_undo = self.editor_state.history_index > 0;
            self.editor_state.can_redo = true;
            true
        } else {
            false
        }
    }

    pub fn redo(&mut self) -> bool {
        if self.editor_state.history_index < self.editor_state.history.len() - 1 {
            self.editor_state.history_index += 1;
            self.editor_state.can_redo = self.editor_state.history_index < self.editor_state.history.len() - 1;
            self.editor_state.can_undo = true;
            true
        } else {
            false
        }
    }

    pub fn add_to_history(&mut self, state_json: String) {
        // Remove any future states if we're not at the end
        self.editor_state.history.truncate(self.editor_state.history_index + 1);
        self.editor_state.history.push(state_json);
        self.editor_state.history_index = self.editor_state.history.len() - 1;
        self.editor_state.can_undo = self.editor_state.history.len() > 1;
        self.editor_state.can_redo = false;
    }

    // ==================== Export Operations ====================

    pub fn save_to_file(&self, screenshot_id: &str, path: Option<String>) -> Result<String, String> {
        let screenshot = self.screenshots.get(screenshot_id)
            .ok_or_else(|| "Screenshot not found".to_string())?;

        let file_path = path.unwrap_or_else(|| {
            format!("{}/{}", self.settings.save_directory, self.generate_filename(&screenshot.format))
        });

        // In real implementation, would save the actual image data
        Ok(file_path)
    }

    pub fn copy_to_clipboard(&self, screenshot_id: &str) -> Result<(), String> {
        let _screenshot = self.screenshots.get(screenshot_id)
            .ok_or_else(|| "Screenshot not found".to_string())?;

        // In real implementation, would copy to system clipboard
        Ok(())
    }

    pub fn export_as_format(&self, screenshot_id: &str, _format: ImageFormat, _quality: u8) -> Result<Vec<u8>, String> {
        let _screenshot = self.screenshots.get(screenshot_id)
            .ok_or_else(|| "Screenshot not found".to_string())?;

        // In real implementation, would convert and return image data
        Ok(vec![])
    }

    pub fn upload(&self, screenshot_id: &str, _destination: UploadDestination) -> Result<UploadResult, String> {
        let _screenshot = self.screenshots.get(screenshot_id)
            .ok_or_else(|| "Screenshot not found".to_string())?;

        // In real implementation, would upload to service
        Ok(UploadResult {
            success: true,
            url: Some("https://example.com/screenshot.png".to_string()),
            delete_url: Some("https://example.com/delete/screenshot".to_string()),
            error: None,
        })
    }

    pub fn print(&self, screenshot_id: &str) -> Result<(), String> {
        let _screenshot = self.screenshots.get(screenshot_id)
            .ok_or_else(|| "Screenshot not found".to_string())?;

        // In real implementation, would send to printer
        Ok(())
    }

    // ==================== Recording Operations ====================

    pub fn start_recording(&mut self, url: &str, title: &str) -> Result<String, String> {
        if self.is_recording {
            return Err("Recording already in progress".to_string());
        }

        self.is_recording = true;
        let recording_id = self.generate_id("rec");
        self.current_recording_id = Some(recording_id.clone());

        let recording = Recording {
            id: recording_id.clone(),
            url: url.to_string(),
            title: title.to_string(),
            duration_seconds: 0,
            file_path: format!("{}/recording_{}.{}", self.settings.save_directory, Self::current_timestamp(), self.recording_settings.output_format),
            file_size: 0,
            width: 1920,
            height: 1080,
            fps: self.recording_settings.fps,
            has_audio: self.recording_settings.include_audio,
            created_at: Self::current_timestamp(),
        };

        self.recordings.insert(recording_id.clone(), recording);
        Ok(recording_id)
    }

    pub fn stop_recording(&mut self) -> Result<Recording, String> {
        if !self.is_recording {
            return Err("No recording in progress".to_string());
        }

        let recording_id = self.current_recording_id.take()
            .ok_or_else(|| "No active recording".to_string())?;

        self.is_recording = false;

        let recording = self.recordings.get(&recording_id)
            .ok_or_else(|| "Recording not found".to_string())?
            .clone();

        Ok(recording)
    }

    pub fn pause_recording(&mut self) -> Result<(), String> {
        if !self.is_recording {
            return Err("No recording in progress".to_string());
        }
        // Implementation would pause the recording
        Ok(())
    }

    pub fn resume_recording(&mut self) -> Result<(), String> {
        if !self.is_recording {
            return Err("No recording in progress".to_string());
        }
        // Implementation would resume the recording
        Ok(())
    }

    pub fn is_recording(&self) -> bool {
        self.is_recording
    }

    pub fn get_recording(&self, recording_id: &str) -> Option<Recording> {
        self.recordings.get(recording_id).cloned()
    }

    pub fn get_all_recordings(&self) -> Vec<Recording> {
        let mut recordings: Vec<_> = self.recordings.values().cloned().collect();
        recordings.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        recordings
    }

    pub fn delete_recording(&mut self, recording_id: &str) -> Result<(), String> {
        self.recordings.remove(recording_id)
            .map(|_| ())
            .ok_or_else(|| "Recording not found".to_string())
    }

    // ==================== Statistics ====================

    pub fn get_stats(&self) -> ScreenshotStats {
        let screenshots: Vec<_> = self.screenshots.values().collect();
        let now = Self::current_timestamp();
        let day_ago = now - 86400;
        let week_ago = now - 604800;

        let _mode_counts: HashMap<String, usize> = screenshots.iter()
            .fold(HashMap::new(), |mut acc, s| {
                let key = format!("{:?}", s.mode);
                *acc.entry(key).or_insert(0) += 1;
                acc
            });

        let _format_counts: HashMap<String, usize> = screenshots.iter()
            .fold(HashMap::new(), |mut acc, s| {
                let key = format!("{:?}", s.format);
                *acc.entry(key).or_insert(0) += 1;
                acc
            });

        ScreenshotStats {
            total_screenshots: screenshots.len(),
            total_size_mb: screenshots.iter().map(|s| s.file_size).sum::<u64>() as f64 / 1_048_576.0,
            screenshots_today: screenshots.iter().filter(|s| s.created_at > day_ago).count(),
            screenshots_this_week: screenshots.iter().filter(|s| s.created_at > week_ago).count(),
            most_used_mode: CaptureMode::VisibleArea, // Would derive from mode_counts
            most_used_format: ImageFormat::PNG, // Would derive from format_counts
            favorite_count: screenshots.iter().filter(|s| s.favorite).count(),
            annotated_count: screenshots.iter().filter(|s| !s.annotations.is_empty()).count(),
        }
    }

    // ==================== Utility ====================

    pub fn get_capture_modes() -> Vec<CaptureMode> {
        vec![
            CaptureMode::VisibleArea,
            CaptureMode::FullPage,
            CaptureMode::SelectedRegion,
            CaptureMode::Element,
            CaptureMode::Window,
            CaptureMode::AllTabs,
        ]
    }

    pub fn get_image_formats() -> Vec<ImageFormat> {
        vec![
            ImageFormat::PNG,
            ImageFormat::JPEG,
            ImageFormat::WEBP,
            ImageFormat::PDF,
        ]
    }

    pub fn get_annotation_types() -> Vec<AnnotationType> {
        vec![
            AnnotationType::Arrow,
            AnnotationType::Rectangle,
            AnnotationType::Circle,
            AnnotationType::Line,
            AnnotationType::FreeHand,
            AnnotationType::Text,
            AnnotationType::Highlight,
            AnnotationType::Blur,
            AnnotationType::Pixelate,
            AnnotationType::Emoji,
            AnnotationType::Number,
            AnnotationType::Crop,
        ]
    }

    pub fn get_preset_colors() -> Vec<&'static str> {
        vec![
            "#ff0000", "#ff6b00", "#ffd500", "#00ff00", "#00d4ff",
            "#0066ff", "#9900ff", "#ff00ff", "#ffffff", "#000000",
        ]
    }
}

impl Default for BrowserScreenshotService {
    fn default() -> Self {
        Self::new()
    }
}
