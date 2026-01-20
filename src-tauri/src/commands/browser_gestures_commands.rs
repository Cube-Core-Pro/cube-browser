// CUBE Nexum - Gestures Commands
// Tauri commands for the gesture recognition system

use tauri::State;
use super::super::services::browser_gestures::{
    BrowserGesturesService, Gesture, GestureSettings, GestureStats,
    GestureType, GesturePattern, GestureAction, GestureUpdate,
    GestureRecognitionResult,
};

// ==================== Settings Commands ====================

#[tauri::command]
pub fn gestures_get_settings(
    service: State<'_, BrowserGesturesService>
) -> GestureSettings {
    service.get_settings()
}

#[tauri::command]
pub fn gestures_update_settings(
    settings: GestureSettings,
    service: State<'_, BrowserGesturesService>
) -> Result<(), String> {
    service.update_settings(settings);
    Ok(())
}

#[tauri::command]
pub fn gestures_toggle_enabled(
    service: State<'_, BrowserGesturesService>
) -> bool {
    service.toggle_enabled()
}

#[tauri::command]
pub fn gestures_set_trail_settings(
    color: String,
    width: f64,
    opacity: f64,
    service: State<'_, BrowserGesturesService>
) -> Result<(), String> {
    service.set_trail_settings(color, width, opacity);
    Ok(())
}

// ==================== Gesture CRUD Commands ====================

#[tauri::command]
pub fn gestures_get_all(
    service: State<'_, BrowserGesturesService>
) -> Vec<Gesture> {
    service.get_all_gestures()
}

#[tauri::command]
pub fn gestures_get_by_id(
    gesture_id: String,
    service: State<'_, BrowserGesturesService>
) -> Option<Gesture> {
    service.get_gesture(&gesture_id)
}

#[tauri::command]
pub fn gestures_get_by_type(
    gesture_type: GestureType,
    service: State<'_, BrowserGesturesService>
) -> Vec<Gesture> {
    service.get_gestures_by_type(gesture_type)
}

#[tauri::command]
pub fn gestures_create(
    name: String,
    gesture_type: GestureType,
    pattern: GesturePattern,
    action: GestureAction,
    description: Option<String>,
    service: State<'_, BrowserGesturesService>
) -> Result<Gesture, String> {
    let mut gesture = Gesture::new(name, gesture_type, pattern, action);
    if let Some(desc) = description {
        gesture = gesture.with_description(&desc);
    }
    service.create_gesture(gesture)
}

#[tauri::command]
pub fn gestures_update(
    gesture_id: String,
    updates: GestureUpdate,
    service: State<'_, BrowserGesturesService>
) -> Result<Gesture, String> {
    service.update_gesture(&gesture_id, updates)
}

#[tauri::command]
pub fn gestures_delete(
    gesture_id: String,
    service: State<'_, BrowserGesturesService>
) -> Result<(), String> {
    service.delete_gesture(&gesture_id)
}

#[tauri::command]
pub fn gestures_toggle(
    gesture_id: String,
    service: State<'_, BrowserGesturesService>
) -> Result<bool, String> {
    service.toggle_gesture(&gesture_id)
}

#[tauri::command]
pub fn gestures_reset_to_defaults(
    service: State<'_, BrowserGesturesService>
) -> Result<(), String> {
    service.reset_to_defaults();
    Ok(())
}

// ==================== Stroke Recording Commands ====================

#[tauri::command]
pub fn gestures_start_stroke(
    gesture_type: GestureType,
    x: f64,
    y: f64,
    service: State<'_, BrowserGesturesService>
) -> Result<(), String> {
    service.start_stroke(gesture_type, x, y)
}

#[tauri::command]
pub fn gestures_add_point(
    x: f64,
    y: f64,
    service: State<'_, BrowserGesturesService>
) -> Result<(), String> {
    service.add_stroke_point(x, y)
}

#[tauri::command]
pub fn gestures_cancel_stroke(
    service: State<'_, BrowserGesturesService>
) -> Result<(), String> {
    service.cancel_stroke();
    Ok(())
}

#[tauri::command]
pub fn gestures_finish_stroke(
    service: State<'_, BrowserGesturesService>
) -> Result<GestureRecognitionResult, String> {
    service.finish_stroke()
}

// ==================== Stats Commands ====================

#[tauri::command]
pub fn gestures_get_stats(
    service: State<'_, BrowserGesturesService>
) -> GestureStats {
    service.get_stats()
}

#[tauri::command]
pub fn gestures_reset_stats(
    service: State<'_, BrowserGesturesService>
) -> Result<(), String> {
    service.reset_stats();
    Ok(())
}

// ==================== Import/Export Commands ====================

#[tauri::command]
pub fn gestures_export(
    service: State<'_, BrowserGesturesService>
) -> Result<String, String> {
    service.export_gestures()
}

#[tauri::command]
pub fn gestures_import(
    json: String,
    service: State<'_, BrowserGesturesService>
) -> Result<u32, String> {
    service.import_gestures(&json)
}

// ==================== Quick Access Commands ====================

#[tauri::command]
pub fn gestures_enable_mouse_gestures(
    enabled: bool,
    service: State<'_, BrowserGesturesService>
) -> Result<(), String> {
    let mut settings = service.get_settings();
    settings.mouse_gestures_enabled = enabled;
    service.update_settings(settings);
    Ok(())
}

#[tauri::command]
pub fn gestures_enable_trackpad_gestures(
    enabled: bool,
    service: State<'_, BrowserGesturesService>
) -> Result<(), String> {
    let mut settings = service.get_settings();
    settings.trackpad_gestures_enabled = enabled;
    service.update_settings(settings);
    Ok(())
}

#[tauri::command]
pub fn gestures_enable_rocker_gestures(
    enabled: bool,
    service: State<'_, BrowserGesturesService>
) -> Result<(), String> {
    let mut settings = service.get_settings();
    settings.rocker_gestures_enabled = enabled;
    service.update_settings(settings);
    Ok(())
}

#[tauri::command]
pub fn gestures_enable_wheel_gestures(
    enabled: bool,
    service: State<'_, BrowserGesturesService>
) -> Result<(), String> {
    let mut settings = service.get_settings();
    settings.wheel_gestures_enabled = enabled;
    service.update_settings(settings);
    Ok(())
}

#[tauri::command]
pub fn gestures_set_sensitivity(
    sensitivity: f64,
    service: State<'_, BrowserGesturesService>
) -> Result<(), String> {
    if !(0.0..=1.0).contains(&sensitivity) {
        return Err("Sensitivity must be between 0.0 and 1.0".to_string());
    }
    let mut settings = service.get_settings();
    settings.sensitivity = sensitivity;
    service.update_settings(settings);
    Ok(())
}

#[tauri::command]
pub fn gestures_set_gesture_button(
    button: u8,
    service: State<'_, BrowserGesturesService>
) -> Result<(), String> {
    if button > 2 {
        return Err("Button must be 0 (left), 1 (middle), or 2 (right)".to_string());
    }
    let mut settings = service.get_settings();
    settings.gesture_button = button;
    service.update_settings(settings);
    Ok(())
}

#[tauri::command]
pub fn gestures_show_trail(
    show: bool,
    service: State<'_, BrowserGesturesService>
) -> Result<(), String> {
    let mut settings = service.get_settings();
    settings.show_gesture_trail = show;
    service.update_settings(settings);
    Ok(())
}

#[tauri::command]
pub fn gestures_show_action_preview(
    show: bool,
    service: State<'_, BrowserGesturesService>
) -> Result<(), String> {
    let mut settings = service.get_settings();
    settings.show_action_preview = show;
    service.update_settings(settings);
    Ok(())
}

// ==================== Preset Gesture Packs ====================

#[tauri::command]
pub fn gestures_load_vivaldi_preset(
    service: State<'_, BrowserGesturesService>
) -> Result<u32, String> {
    // Vivaldi-style gesture preset
    let preset = r#"[
        {
            "name": "Close Tab (Vivaldi)",
            "gesture_type": "Mouse",
            "pattern": { "directions": ["Down", "Right"], "min_distance": 30.0, "max_duration": 2000, "tolerance": 30.0 },
            "action": "CloseTab",
            "enabled": true
        },
        {
            "name": "New Tab (Vivaldi)",
            "gesture_type": "Mouse",
            "pattern": { "directions": ["Up"], "min_distance": 50.0, "max_duration": 2000, "tolerance": 30.0 },
            "action": "NewTab",
            "enabled": true
        }
    ]"#;
    service.import_gestures(preset)
}

#[tauri::command]
pub fn gestures_load_opera_preset(
    service: State<'_, BrowserGesturesService>
) -> Result<u32, String> {
    // Opera-style gesture preset
    let preset = r#"[
        {
            "name": "Home (Opera)",
            "gesture_type": "Mouse",
            "pattern": { "directions": ["Left", "Up"], "min_distance": 30.0, "max_duration": 2000, "tolerance": 30.0 },
            "action": "Home",
            "enabled": true
        },
        {
            "name": "Minimize (Opera)",
            "gesture_type": "Mouse",
            "pattern": { "directions": ["Down", "Left"], "min_distance": 30.0, "max_duration": 2000, "tolerance": 30.0 },
            "action": "Minimize",
            "enabled": true
        }
    ]"#;
    service.import_gestures(preset)
}
