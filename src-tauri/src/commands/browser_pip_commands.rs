// CUBE Nexum - Picture-in-Picture Commands
// Tauri commands for multi-PiP system

use crate::services::browser_pip::{
    BrowserPipService, PipContentType, PipPosition, PipSettings, PipSize, 
    PipStats, PipWindowConfig, SnapZone
};
use std::sync::Mutex;
use tauri::State;

pub struct PipServiceState(pub Mutex<BrowserPipService>);

impl Default for PipServiceState {
    fn default() -> Self {
        Self(Mutex::new(BrowserPipService::new()))
    }
}

// ==================== Settings Commands ====================

#[tauri::command]
pub fn pip_get_settings(state: State<PipServiceState>) -> Result<PipSettings, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(service.get_settings())
}

#[tauri::command]
pub fn pip_update_settings(state: State<PipServiceState>, settings: PipSettings) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.update_settings(settings);
    Ok(())
}

#[tauri::command]
pub fn pip_set_enabled(state: State<PipServiceState>, enabled: bool) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.set_enabled(enabled);
    Ok(())
}

#[tauri::command]
pub fn pip_set_max_windows(state: State<PipServiceState>, max: usize) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.set_max_windows(max);
    Ok(())
}

#[tauri::command]
pub fn pip_set_default_position(state: State<PipServiceState>, position: PipPosition) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.set_default_position(position);
    Ok(())
}

#[tauri::command]
pub fn pip_set_default_size(state: State<PipServiceState>, size: PipSize) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.set_default_size(size);
    Ok(())
}

#[tauri::command]
pub fn pip_set_auto_pip(state: State<PipServiceState>, enabled: bool) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.set_auto_pip(enabled);
    Ok(())
}

#[tauri::command]
pub fn pip_set_snap_zones_enabled(state: State<PipServiceState>, enabled: bool) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.set_snap_zones_enabled(enabled);
    Ok(())
}

// ==================== Window Management Commands ====================

#[tauri::command]
pub fn pip_create_window(
    state: State<PipServiceState>,
    tab_id: String,
    selector: String,
    content_type: PipContentType,
    title: Option<String>,
) -> Result<PipWindowConfig, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.create_pip_window(&tab_id, &selector, content_type, title)
}

#[tauri::command]
pub fn pip_close_window(state: State<PipServiceState>, window_id: String) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.close_pip_window(&window_id)
}

#[tauri::command]
pub fn pip_close_all_windows(state: State<PipServiceState>) -> Result<usize, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(service.close_all_windows())
}

#[tauri::command]
pub fn pip_close_windows_for_tab(state: State<PipServiceState>, tab_id: String) -> Result<usize, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(service.close_windows_for_tab(&tab_id))
}

#[tauri::command]
pub fn pip_get_window(state: State<PipServiceState>, window_id: String) -> Result<Option<PipWindowConfig>, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(service.get_window(&window_id))
}

#[tauri::command]
pub fn pip_get_all_windows(state: State<PipServiceState>) -> Result<Vec<PipWindowConfig>, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(service.get_all_windows())
}

#[tauri::command]
pub fn pip_get_windows_for_tab(state: State<PipServiceState>, tab_id: String) -> Result<Vec<PipWindowConfig>, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(service.get_windows_for_tab(&tab_id))
}

// ==================== Window Control Commands ====================

#[tauri::command]
pub fn pip_update_position(state: State<PipServiceState>, window_id: String, x: i32, y: i32) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.update_window_position(&window_id, x, y)
}

#[tauri::command]
pub fn pip_update_size(state: State<PipServiceState>, window_id: String, width: u32, height: u32) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.update_window_size(&window_id, width, height)
}

#[tauri::command]
pub fn pip_set_opacity(state: State<PipServiceState>, window_id: String, opacity: f32) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.set_window_opacity(&window_id, opacity)
}

#[tauri::command]
pub fn pip_set_always_on_top(state: State<PipServiceState>, window_id: String, always_on_top: bool) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.set_window_always_on_top(&window_id, always_on_top)
}

#[tauri::command]
pub fn pip_minimize_window(state: State<PipServiceState>, window_id: String) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.minimize_window(&window_id)
}

#[tauri::command]
pub fn pip_restore_window(state: State<PipServiceState>, window_id: String) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.restore_window(&window_id)
}

#[tauri::command]
pub fn pip_toggle_fullscreen(state: State<PipServiceState>, window_id: String) -> Result<bool, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.toggle_fullscreen(&window_id)
}

// ==================== Playback Control Commands ====================

#[tauri::command]
pub fn pip_play(state: State<PipServiceState>, window_id: String) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.play(&window_id)
}

#[tauri::command]
pub fn pip_pause(state: State<PipServiceState>, window_id: String) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.pause(&window_id)
}

#[tauri::command]
pub fn pip_toggle_playback(state: State<PipServiceState>, window_id: String) -> Result<bool, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.toggle_playback(&window_id)
}

#[tauri::command]
pub fn pip_mute(state: State<PipServiceState>, window_id: String) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.mute(&window_id)
}

#[tauri::command]
pub fn pip_unmute(state: State<PipServiceState>, window_id: String) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.unmute(&window_id)
}

#[tauri::command]
pub fn pip_toggle_mute(state: State<PipServiceState>, window_id: String) -> Result<bool, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.toggle_mute(&window_id)
}

#[tauri::command]
pub fn pip_set_volume(state: State<PipServiceState>, window_id: String, volume: f32) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.set_volume(&window_id, volume)
}

#[tauri::command]
pub fn pip_set_playback_rate(state: State<PipServiceState>, window_id: String, rate: f32) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.set_playback_rate(&window_id, rate)
}

#[tauri::command]
pub fn pip_seek(state: State<PipServiceState>, window_id: String, time: f64) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.seek(&window_id, time)
}

#[tauri::command]
pub fn pip_seek_relative(state: State<PipServiceState>, window_id: String, delta: f64) -> Result<f64, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.seek_relative(&window_id, delta)
}

#[tauri::command]
pub fn pip_toggle_loop(state: State<PipServiceState>, window_id: String) -> Result<bool, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.toggle_loop(&window_id)
}

#[tauri::command]
pub fn pip_update_playback_state(
    state: State<PipServiceState>,
    window_id: String,
    current_time: f64,
    duration: f64,
    paused: bool,
) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.update_playback_state(&window_id, current_time, duration, paused)
}

// ==================== Multi-PiP Control Commands ====================

#[tauri::command]
pub fn pip_mute_all(state: State<PipServiceState>) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.mute_all();
    Ok(())
}

#[tauri::command]
pub fn pip_mute_all_except(state: State<PipServiceState>, except_id: String) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.mute_all_except(&except_id);
    Ok(())
}

#[tauri::command]
pub fn pip_pause_all(state: State<PipServiceState>) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.pause_all();
    Ok(())
}

#[tauri::command]
pub fn pip_play_all(state: State<PipServiceState>) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.play_all();
    Ok(())
}

#[tauri::command]
pub fn pip_sync_playback_to(state: State<PipServiceState>, source_window_id: String) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.sync_playback_to(&source_window_id)
}

// ==================== Snap Zone Commands ====================

#[tauri::command]
pub fn pip_get_snap_zones(state: State<PipServiceState>) -> Result<Vec<SnapZone>, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(service.get_snap_zones())
}

#[tauri::command]
pub fn pip_update_snap_zones(state: State<PipServiceState>, screen_width: i32, screen_height: i32) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.update_snap_zones(screen_width, screen_height);
    Ok(())
}

#[tauri::command]
pub fn pip_set_snap_zone_active(state: State<PipServiceState>, zone_id: String, active: bool) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.set_snap_zone_active(&zone_id, active)
}

// ==================== Statistics Commands ====================

#[tauri::command]
pub fn pip_get_stats(state: State<PipServiceState>) -> Result<PipStats, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(service.get_stats())
}

#[tauri::command]
pub fn pip_reset_stats(state: State<PipServiceState>) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.reset_stats();
    Ok(())
}

#[tauri::command]
pub fn pip_add_watch_time(state: State<PipServiceState>, seconds: u64) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.add_watch_time(seconds);
    Ok(())
}

// ==================== Position Memory Commands ====================

#[tauri::command]
pub fn pip_clear_position_memory(state: State<PipServiceState>) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.clear_position_memory();
    Ok(())
}

#[tauri::command]
pub fn pip_get_remembered_position(
    state: State<PipServiceState>,
    tab_id: String,
    selector: String,
) -> Result<Option<(i32, i32)>, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(service.get_remembered_position(&tab_id, &selector))
}
