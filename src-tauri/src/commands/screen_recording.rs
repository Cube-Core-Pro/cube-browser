/**
 * CUBE Elite - Screen Recording Tauri Commands
 *
 * Commands for screen recording functionality
 */
use crate::services::screen_recorder::{
    Quality, RecordingConfig, RecordingMode, RecordingSession, ScreenRecorder, VideoFormat,
};
use anyhow::Result;
use std::sync::Arc;
use tauri::State;

/// Start a new screen recording session
#[tauri::command]
pub async fn screen_recording_start(
    mode: String,
    format: String,
    quality: String,
    fps: u32,
    audio_enabled: bool,
    microphone_enabled: bool,
    system_audio_enabled: bool,
    output_path: String,
    recorder: State<'_, Arc<ScreenRecorder>>,
) -> Result<String, String> {
    // Parse mode
    let recording_mode = match mode.as_str() {
        "fullscreen" => RecordingMode::Fullscreen,
        "window" => RecordingMode::Window,
        mode_str if mode_str.starts_with("area:") => {
            // Format: "area:x,y,width,height"
            let parts: Vec<&str> = mode_str.strip_prefix("area:").unwrap().split(',').collect();
            if parts.len() != 4 {
                return Err("Invalid area format".to_string());
            }

            let x = parts[0]
                .parse::<i32>()
                .map_err(|_| "Invalid x coordinate")?;
            let y = parts[1]
                .parse::<i32>()
                .map_err(|_| "Invalid y coordinate")?;
            let width = parts[2].parse::<i32>().map_err(|_| "Invalid width")?;
            let height = parts[3].parse::<i32>().map_err(|_| "Invalid height")?;

            RecordingMode::Area {
                x,
                y,
                width,
                height,
            }
        }
        _ => return Err(format!("Unknown recording mode: {}", mode)),
    };

    // Parse format
    let video_format = match format.as_str() {
        "webm" => VideoFormat::WebM,
        "mp4" => VideoFormat::MP4,
        "gif" => VideoFormat::GIF,
        _ => return Err(format!("Unknown video format: {}", format)),
    };

    // Parse quality
    let video_quality = match quality.as_str() {
        "low" => Quality::Low,
        "medium" => Quality::Medium,
        "high" => Quality::High,
        "ultra" => Quality::Ultra,
        _ => return Err(format!("Unknown quality: {}", quality)),
    };

    let config = RecordingConfig {
        mode: recording_mode,
        format: video_format,
        quality: video_quality,
        fps,
        audio_enabled,
        microphone_enabled,
        system_audio_enabled,
        output_path,
    };

    recorder
        .start_recording(config)
        .map_err(|e| format!("Failed to start recording: {}", e))
}

/// Stop screen recording
#[tauri::command]
pub async fn screen_recording_stop(
    session_id: String,
    recorder: State<'_, Arc<ScreenRecorder>>,
) -> Result<(), String> {
    recorder
        .stop_recording(&session_id)
        .map_err(|e| format!("Failed to stop recording: {}", e))
}

/// Pause screen recording
#[tauri::command]
pub async fn screen_recording_pause(
    session_id: String,
    recorder: State<'_, Arc<ScreenRecorder>>,
) -> Result<(), String> {
    recorder
        .pause_recording(&session_id)
        .map_err(|e| format!("Failed to pause recording: {}", e))
}

/// Resume screen recording
#[tauri::command]
pub async fn screen_recording_resume(
    session_id: String,
    recorder: State<'_, Arc<ScreenRecorder>>,
) -> Result<(), String> {
    recorder
        .resume_recording(&session_id)
        .map_err(|e| format!("Failed to resume recording: {}", e))
}

/// Get recording session
#[tauri::command]
pub async fn get_recording_session(
    session_id: String,
    recorder: State<'_, Arc<ScreenRecorder>>,
) -> Result<RecordingSession, String> {
    recorder
        .get_session(&session_id)
        .ok_or_else(|| "Recording session not found".to_string())
}

/// List all recording sessions
#[tauri::command]
pub async fn list_recording_sessions(
    recorder: State<'_, Arc<ScreenRecorder>>,
) -> Result<Vec<RecordingSession>, String> {
    Ok(recorder.list_sessions())
}

/// Delete recording session and file
#[tauri::command]
pub async fn delete_recording(
    session_id: String,
    recorder: State<'_, Arc<ScreenRecorder>>,
) -> Result<(), String> {
    recorder
        .delete_recording(&session_id)
        .map_err(|e| format!("Failed to delete recording: {}", e))
}

/// Check if ffmpeg is available
#[tauri::command]
pub async fn check_ffmpeg_available() -> Result<bool, String> {
    use std::process::Command;

    let result = Command::new("ffmpeg").arg("-version").output();

    match result {
        Ok(output) => Ok(output.status.success()),
        Err(_) => Ok(false),
    }
}

/// Get default output directory
#[tauri::command]
pub async fn get_default_recording_dir() -> Result<String, String> {
    let videos_dir = dirs::video_dir()
        .or_else(|| dirs::home_dir().map(|h| h.join("Videos")))
        .ok_or_else(|| "Could not determine videos directory".to_string())?;

    let cube_recordings = videos_dir.join("CUBE Recordings");

    // Create directory if it doesn't exist
    if !cube_recordings.exists() {
        std::fs::create_dir_all(&cube_recordings)
            .map_err(|e| format!("Failed to create recordings directory: {}", e))?;
    }

    cube_recordings
        .to_str()
        .ok_or_else(|| "Invalid path".to_string())
        .map(|s| s.to_string())
}
