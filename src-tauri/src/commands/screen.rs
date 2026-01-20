use base64::{engine::general_purpose, Engine as _};
use screenshots::Screen;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use tauri::{command, State};

/// State for managing active recordings
pub struct RecordingState {
    pub recordings: Arc<Mutex<HashMap<String, ActiveRecording>>>,
}

impl RecordingState {
    pub fn new() -> Self {
        RecordingState {
            recordings: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

impl Default for RecordingState {
    fn default() -> Self {
        Self::new()
    }
}

/// Active recording information
pub struct ActiveRecording {
    pub id: String,
    pub output_path: PathBuf,
    pub start_time: std::time::Instant,
    pub ffmpeg_process: Option<Child>,
    pub fps: u32,
    pub screen_index: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScreenInfo {
    pub id: usize,
    pub name: String,
    pub width: u32,
    pub height: u32,
    pub is_primary: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Screenshot {
    pub data: String, // Base64 encoded PNG
    pub width: u32,
    pub height: u32,
    pub timestamp: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RecordingResult {
    pub file_path: String,
    pub duration_ms: u64,
    pub file_size_bytes: u64,
}

/// Get list of available screens/monitors
#[command]
pub async fn get_available_screens() -> Result<Vec<ScreenInfo>, String> {
    let screens = Screen::all().map_err(|e| format!("Failed to get screens: {}", e))?;

    let screen_list: Vec<ScreenInfo> = screens
        .iter()
        .enumerate()
        .map(|(index, screen)| {
            let display = screen.display_info;
            ScreenInfo {
                id: index,
                name: format!("Screen {}", index + 1),
                width: display.width,
                height: display.height,
                is_primary: index == 0,
            }
        })
        .collect();

    Ok(screen_list)
}

/// Capture a screenshot of the entire screen
#[command]
pub async fn capture_screenshot() -> Result<Screenshot, String> {
    let screens = Screen::all().map_err(|e| format!("Failed to get screens: {}", e))?;

    if screens.is_empty() {
        return Err("No screens found".to_string());
    }

    let screen = &screens[0];
    let image = screen
        .capture()
        .map_err(|e| format!("Failed to capture: {}", e))?;

    // Convert to PNG bytes using image crate
    use image::ImageEncoder;
    let mut png_bytes = Vec::new();
    let png_encoder = image::codecs::png::PngEncoder::new(&mut png_bytes);
    png_encoder
        .write_image(
            image.as_raw(),
            image.width(),
            image.height(),
            image::ExtendedColorType::Rgba8,
        )
        .map_err(|e| format!("Failed to encode: {}", e))?;

    // Encode to base64
    let base64_data = general_purpose::STANDARD.encode(&png_bytes);

    Ok(Screenshot {
        data: base64_data,
        width: image.width(),
        height: image.height(),
        timestamp: chrono::Utc::now().timestamp_millis(),
    })
}

/// Capture a specific region of the screen
#[command]
pub async fn capture_region(
    x: i32,
    y: i32,
    width: u32,
    height: u32,
) -> Result<Screenshot, String> {
    let screens = Screen::all().map_err(|e| format!("Failed to get screens: {}", e))?;

    if screens.is_empty() {
        return Err("No screens found".to_string());
    }

    let screen = &screens[0];
    let image = screen
        .capture_area(x, y, width, height)
        .map_err(|e| format!("Failed to capture region: {}", e))?;

    use image::ImageEncoder;
    let mut png_bytes = Vec::new();
    let png_encoder = image::codecs::png::PngEncoder::new(&mut png_bytes);
    png_encoder
        .write_image(
            image.as_raw(),
            image.width(),
            image.height(),
            image::ExtendedColorType::Rgba8,
        )
        .map_err(|e| format!("Failed to encode: {}", e))?;

    let base64_data = general_purpose::STANDARD.encode(&png_bytes);

    Ok(Screenshot {
        data: base64_data,
        width: image.width(),
        height: image.height(),
        timestamp: chrono::Utc::now().timestamp_millis(),
    })
}

/// Check if ffmpeg is available on the system
fn check_ffmpeg_available() -> Result<String, String> {
    // Try common locations for ffmpeg
    let ffmpeg_paths = vec![
        "ffmpeg",
        "/usr/local/bin/ffmpeg",
        "/usr/bin/ffmpeg",
        "/opt/homebrew/bin/ffmpeg",
    ];

    for path in ffmpeg_paths {
        if let Ok(output) = Command::new(path).arg("-version").output() {
            if output.status.success() {
                return Ok(path.to_string());
            }
        }
    }

    Err("FFmpeg not found. Please install FFmpeg for screen recording.".to_string())
}

/// Start screen recording using FFmpeg
#[command]
pub async fn start_screen_recording(
    state: State<'_, RecordingState>,
    fps: Option<u32>,
    quality: Option<String>,
    screen_index: Option<usize>,
) -> Result<String, String> {
    // Check if FFmpeg is available
    let ffmpeg_path = check_ffmpeg_available()?;

    let recording_id = uuid::Uuid::new_v4().to_string();
    let fps = fps.unwrap_or(30);
    let screen_idx = screen_index.unwrap_or(0);

    // Determine quality settings
    let crf = match quality.as_deref() {
        Some("high") => "18",
        Some("medium") => "23",
        Some("low") => "28",
        _ => "23", // Default to medium
    };

    // Get screen dimensions
    let screens = Screen::all().map_err(|e| format!("Failed to get screens: {}", e))?;
    if screen_idx >= screens.len() {
        return Err(format!(
            "Screen index {} not found. Available screens: {}",
            screen_idx,
            screens.len()
        ));
    }

    let screen = &screens[screen_idx];
    let display_info = screen.display_info;
    let width = display_info.width;
    let height = display_info.height;

    // Ensure dimensions are even (FFmpeg requirement)
    let width = if width % 2 != 0 { width - 1 } else { width };
    let height = if height % 2 != 0 { height - 1 } else { height };

    // Create output path
    let recordings_dir = dirs::video_dir()
        .or_else(|| dirs::download_dir())
        .unwrap_or_else(|| std::env::temp_dir())
        .join("CUBE_Recordings");

    std::fs::create_dir_all(&recordings_dir)
        .map_err(|e| format!("Failed to create recordings directory: {}", e))?;

    let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S").to_string();
    let output_path = recordings_dir.join(format!("recording_{}_{}.mp4", timestamp, &recording_id[..8]));

    // Build FFmpeg command based on platform
    #[cfg(target_os = "macos")]
    let ffmpeg_child = {
        Command::new(&ffmpeg_path)
            .args([
                "-f", "avfoundation",
                "-capture_cursor", "1",
                "-framerate", &fps.to_string(),
                "-i", &format!("{}:", screen_idx),
                "-vf", &format!("scale={}:{}", width, height),
                "-c:v", "libx264",
                "-preset", "ultrafast",
                "-crf", crf,
                "-pix_fmt", "yuv420p",
                "-y",
                output_path.to_str().unwrap(),
            ])
            .stdin(Stdio::piped())
            .stdout(Stdio::null())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to start FFmpeg: {}", e))?
    };

    #[cfg(target_os = "windows")]
    let ffmpeg_child = {
        Command::new(&ffmpeg_path)
            .args([
                "-f", "gdigrab",
                "-framerate", &fps.to_string(),
                "-i", "desktop",
                "-vf", &format!("scale={}:{}", width, height),
                "-c:v", "libx264",
                "-preset", "ultrafast",
                "-crf", crf,
                "-pix_fmt", "yuv420p",
                "-y",
                output_path.to_str().unwrap(),
            ])
            .stdin(Stdio::piped())
            .stdout(Stdio::null())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to start FFmpeg: {}", e))?
    };

    #[cfg(target_os = "linux")]
    let ffmpeg_child = {
        // Get display from environment
        let display = std::env::var("DISPLAY").unwrap_or_else(|_| ":0".to_string());

        Command::new(&ffmpeg_path)
            .args([
                "-f", "x11grab",
                "-framerate", &fps.to_string(),
                "-video_size", &format!("{}x{}", width, height),
                "-i", &format!("{}+0,0", display),
                "-c:v", "libx264",
                "-preset", "ultrafast",
                "-crf", crf,
                "-pix_fmt", "yuv420p",
                "-y",
                output_path.to_str().unwrap(),
            ])
            .stdin(Stdio::piped())
            .stdout(Stdio::null())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to start FFmpeg: {}", e))?
    };

    // Store recording state
    let active_recording = ActiveRecording {
        id: recording_id.clone(),
        output_path: output_path.clone(),
        start_time: std::time::Instant::now(),
        ffmpeg_process: Some(ffmpeg_child),
        fps,
        screen_index: screen_idx,
    };

    {
        let mut recordings = state.recordings.lock().unwrap();
        recordings.insert(recording_id.clone(), active_recording);
    }

    println!("🎬 Screen recording started: {}", output_path.display());
    println!("   Recording ID: {}", recording_id);
    println!("   FPS: {}, Quality: CRF {}", fps, crf);

    Ok(recording_id)
}

/// Stop screen recording and return the video file path
#[command]
pub async fn stop_screen_recording(
    state: State<'_, RecordingState>,
    recording_id: String,
) -> Result<RecordingResult, String> {
    // Get and remove the recording from state
    let mut active_recording = {
        let mut recordings = state.recordings.lock().unwrap();
        recordings
            .remove(&recording_id)
            .ok_or_else(|| format!("Recording {} not found", recording_id))?
    };

    let duration_ms = active_recording.start_time.elapsed().as_millis() as u64;

    // Stop FFmpeg process gracefully
    if let Some(mut process) = active_recording.ffmpeg_process.take() {
        // Send 'q' to FFmpeg's stdin to stop recording gracefully
        if let Some(ref mut stdin) = process.stdin {
            use std::io::Write;
            let _ = stdin.write_all(b"q");
            let _ = stdin.flush();
        }

        // Wait for process to finish with timeout
        match process.wait() {
            Ok(status) => {
                if !status.success() {
                    // Try to get stderr for debugging
                    println!("⚠️  FFmpeg exited with non-zero status: {:?}", status);
                }
            }
            Err(e) => {
                println!("⚠️  Error waiting for FFmpeg: {}", e);
                // Force kill if wait fails
                let _ = process.kill();
            }
        }
    }

    // Wait a moment for file to be finalized
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

    // Get file size
    let file_size_bytes = std::fs::metadata(&active_recording.output_path)
        .map(|m| m.len())
        .unwrap_or(0);

    let result = RecordingResult {
        file_path: active_recording.output_path.to_string_lossy().to_string(),
        duration_ms,
        file_size_bytes,
    };

    println!("🎬 Screen recording stopped: {}", result.file_path);
    println!("   Duration: {}ms, Size: {} bytes", duration_ms, file_size_bytes);

    Ok(result)
}

/// Get list of active recordings
#[command]
pub async fn get_active_recordings(
    state: State<'_, RecordingState>,
) -> Result<Vec<String>, String> {
    let recordings = state.recordings.lock().unwrap();
    Ok(recordings.keys().cloned().collect())
}

/// Cancel a recording without saving
#[command]
pub async fn cancel_recording(
    state: State<'_, RecordingState>,
    recording_id: String,
) -> Result<(), String> {
    let mut active_recording = {
        let mut recordings = state.recordings.lock().unwrap();
        recordings
            .remove(&recording_id)
            .ok_or_else(|| format!("Recording {} not found", recording_id))?
    };

    // Kill FFmpeg process
    if let Some(mut process) = active_recording.ffmpeg_process.take() {
        let _ = process.kill();
        let _ = process.wait();
    }

    // Delete partial file
    let _ = std::fs::remove_file(&active_recording.output_path);

    println!("🗑️  Recording {} cancelled", recording_id);

    Ok(())
}

/// Save screenshot to file
#[command]
pub async fn save_screenshot(
    base64_data: String,
    filename: Option<String>,
) -> Result<String, String> {
    // Decode base64
    let image_data = general_purpose::STANDARD
        .decode(&base64_data)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;

    // Create screenshots directory
    let screenshots_dir = dirs::picture_dir()
        .or_else(|| dirs::download_dir())
        .unwrap_or_else(|| std::env::temp_dir())
        .join("CUBE_Screenshots");

    std::fs::create_dir_all(&screenshots_dir)
        .map_err(|e| format!("Failed to create screenshots directory: {}", e))?;

    // Generate filename
    let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S").to_string();
    let final_filename = filename.unwrap_or_else(|| format!("screenshot_{}.png", timestamp));
    let file_path = screenshots_dir.join(&final_filename);

    // Write file
    std::fs::write(&file_path, &image_data)
        .map_err(|e| format!("Failed to write screenshot: {}", e))?;

    println!("📸 Screenshot saved: {}", file_path.display());

    Ok(file_path.to_string_lossy().to_string())
}
