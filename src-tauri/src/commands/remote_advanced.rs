// ============================================================================
// REMOTE MODULE - Advanced Features Backend
// ============================================================================
// Privacy Mode, Whiteboard, Session Recording, Multi-Monitor

use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

// ============================================================================
// PRIVACY MODE TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrivacyRule {
    pub id: String,
    pub name: String,
    pub rule_type: String,
    pub pattern: String,
    pub action: String,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrivacyModeConfig {
    pub is_enabled: bool,
    pub rules: Vec<PrivacyRule>,
    pub blur_sensitive: bool,
    pub hide_notifications: bool,
    pub block_screenshots: bool,
}

pub struct PrivacyModeState {
    config: Mutex<PrivacyModeConfig>,
}

impl Default for PrivacyModeState {
    fn default() -> Self {
        Self {
            config: Mutex::new(PrivacyModeConfig {
                is_enabled: false,
                blur_sensitive: true,
                hide_notifications: true,
                block_screenshots: false,
                rules: vec![
                    PrivacyRule { id: String::from("pr-1"), name: String::from("Blur Passwords"), rule_type: String::from("blur"), pattern: String::from("password|pin|ssn"), action: String::from("blur"), is_active: true },
                    PrivacyRule { id: String::from("pr-2"), name: String::from("Hide Banking"), rule_type: String::from("hide"), pattern: String::from("bank|account|balance"), action: String::from("hide"), is_active: true },
                    PrivacyRule { id: String::from("pr-3"), name: String::from("Blur Emails"), rule_type: String::from("blur"), pattern: String::from("email|@"), action: String::from("blur"), is_active: false },
                ],
            }),
        }
    }
}

#[tauri::command]
pub async fn get_privacy_mode_config(state: State<'_, PrivacyModeState>) -> Result<PrivacyModeConfig, String> {
    state.config.lock().map(|c| c.clone()).map_err(|e| format!("Lock error: {}", e))
}

#[tauri::command]
pub async fn toggle_privacy_mode(enabled: bool, state: State<'_, PrivacyModeState>) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    config.is_enabled = enabled;
    Ok(())
}

#[tauri::command]
pub async fn toggle_privacy_rule(rule_id: String, active: bool, state: State<'_, PrivacyModeState>) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    if let Some(rule) = config.rules.iter_mut().find(|r| r.id == rule_id) {
        rule.is_active = active;
    }
    Ok(())
}

// ============================================================================
// WHITEBOARD TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WhiteboardElement {
    pub id: String,
    pub element_type: String,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub content: String,
    pub color: String,
    pub stroke_width: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WhiteboardSession {
    pub id: String,
    pub name: String,
    pub participants: Vec<String>,
    pub created_at: u64,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WhiteboardConfig {
    pub elements: Vec<WhiteboardElement>,
    pub sessions: Vec<WhiteboardSession>,
    pub current_tool: String,
    pub current_color: String,
}

pub struct WhiteboardState {
    config: Mutex<WhiteboardConfig>,
}

impl Default for WhiteboardState {
    fn default() -> Self {
        let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
        Self {
            config: Mutex::new(WhiteboardConfig {
                current_tool: String::from("pen"),
                current_color: String::from("#000000"),
                elements: vec![
                    WhiteboardElement { id: String::from("wb-1"), element_type: String::from("rectangle"), x: 100.0, y: 100.0, width: 200.0, height: 100.0, content: String::new(), color: String::from("#3B82F6"), stroke_width: 2.0 },
                    WhiteboardElement { id: String::from("wb-2"), element_type: String::from("text"), x: 350.0, y: 120.0, width: 150.0, height: 30.0, content: String::from("Ideas"), color: String::from("#000000"), stroke_width: 1.0 },
                ],
                sessions: vec![
                    WhiteboardSession { id: String::from("wbs-1"), name: String::from("Team Brainstorm"), participants: vec![String::from("Alice"), String::from("Bob"), String::from("Charlie")], created_at: now - 3600, is_active: true },
                    WhiteboardSession { id: String::from("wbs-2"), name: String::from("Design Review"), participants: vec![String::from("Alice"), String::from("David")], created_at: now - 86400, is_active: false },
                ],
            }),
        }
    }
}

#[tauri::command]
pub async fn get_whiteboard_config(state: State<'_, WhiteboardState>) -> Result<WhiteboardConfig, String> {
    state.config.lock().map(|c| c.clone()).map_err(|e| format!("Lock error: {}", e))
}

#[tauri::command]
pub async fn clear_whiteboard(state: State<'_, WhiteboardState>) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    config.elements.clear();
    Ok(())
}

// ============================================================================
// SESSION RECORDING TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Recording {
    pub id: String,
    pub name: String,
    pub duration: u64,
    pub size_bytes: u64,
    pub created_at: u64,
    pub thumbnail: Option<String>,
    pub is_shared: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionRecordingConfig {
    pub recordings: Vec<Recording>,
    pub is_recording: bool,
    pub auto_record: bool,
    pub quality: String,
    pub storage_used_bytes: u64,
    pub storage_limit_bytes: u64,
}

pub struct SessionRecordingState {
    config: Mutex<SessionRecordingConfig>,
}

impl Default for SessionRecordingState {
    fn default() -> Self {
        let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
        Self {
            config: Mutex::new(SessionRecordingConfig {
                is_recording: false,
                auto_record: true,
                quality: String::from("1080p"),
                storage_used_bytes: 2_500_000_000,
                storage_limit_bytes: 10_000_000_000,
                recordings: vec![
                    Recording { id: String::from("rec-1"), name: String::from("Client Demo - March 15"), duration: 2700, size_bytes: 450_000_000, created_at: now - 24 * 60 * 60, thumbnail: None, is_shared: true },
                    Recording { id: String::from("rec-2"), name: String::from("Team Standup"), duration: 900, size_bytes: 150_000_000, created_at: now - 48 * 60 * 60, thumbnail: None, is_shared: false },
                    Recording { id: String::from("rec-3"), name: String::from("Product Review"), duration: 3600, size_bytes: 600_000_000, created_at: now - 72 * 60 * 60, thumbnail: None, is_shared: true },
                ],
            }),
        }
    }
}

#[tauri::command]
pub async fn get_session_recording_config(state: State<'_, SessionRecordingState>) -> Result<SessionRecordingConfig, String> {
    state.config.lock().map(|c| c.clone()).map_err(|e| format!("Lock error: {}", e))
}

#[tauri::command]
pub async fn toggle_recording(enabled: bool, state: State<'_, SessionRecordingState>) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    config.is_recording = enabled;
    Ok(())
}

#[tauri::command]
pub async fn delete_session_recording(recording_id: String, state: State<'_, SessionRecordingState>) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    if let Some(recording) = config.recordings.iter().find(|r| r.id == recording_id) {
        config.storage_used_bytes = config.storage_used_bytes.saturating_sub(recording.size_bytes);
    }
    config.recordings.retain(|r| r.id != recording_id);
    Ok(())
}

// ============================================================================
// MULTI-MONITOR TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Monitor {
    pub id: String,
    pub name: String,
    pub resolution: String,
    pub is_primary: bool,
    pub is_shared: bool,
    pub position_x: i32,
    pub position_y: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MultiMonitorConfig {
    pub monitors: Vec<Monitor>,
    pub share_all: bool,
    pub follow_mouse: bool,
}

pub struct MultiMonitorState {
    config: Mutex<MultiMonitorConfig>,
}

impl Default for MultiMonitorState {
    fn default() -> Self {
        Self {
            config: Mutex::new(MultiMonitorConfig {
                share_all: false,
                follow_mouse: true,
                monitors: vec![
                    Monitor { id: String::from("mon-1"), name: String::from("Primary Display"), resolution: String::from("2560x1440"), is_primary: true, is_shared: true, position_x: 0, position_y: 0 },
                    Monitor { id: String::from("mon-2"), name: String::from("Secondary Display"), resolution: String::from("1920x1080"), is_primary: false, is_shared: false, position_x: 2560, position_y: 0 },
                    Monitor { id: String::from("mon-3"), name: String::from("Vertical Monitor"), resolution: String::from("1080x1920"), is_primary: false, is_shared: false, position_x: 4480, position_y: 0 },
                ],
            }),
        }
    }
}

#[tauri::command]
pub async fn get_multi_monitor_config(state: State<'_, MultiMonitorState>) -> Result<MultiMonitorConfig, String> {
    state.config.lock().map(|c| c.clone()).map_err(|e| format!("Lock error: {}", e))
}

#[tauri::command]
pub async fn toggle_monitor_sharing(monitor_id: String, shared: bool, state: State<'_, MultiMonitorState>) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    if let Some(monitor) = config.monitors.iter_mut().find(|m| m.id == monitor_id) {
        monitor.is_shared = shared;
    }
    Ok(())
}
