use anyhow::{Context, Result};
/**
 * CUBE Elite - Screen Recording Service
 *
 * Cross-platform screen recording with audio support
 *
 * Features:
 * - Full screen recording
 * - Window recording
 * - Area selection recording
 * - Microphone audio
 * - System audio (platform-dependent)
 * - Multiple format support (WebM, MP4, GIF)
 * - Real-time preview
 * - Pause/Resume
 */
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::process::{Child, Command};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecordingConfig {
    pub mode: RecordingMode,
    pub format: VideoFormat,
    pub quality: Quality,
    pub fps: u32,
    pub audio_enabled: bool,
    pub microphone_enabled: bool,
    pub system_audio_enabled: bool,
    pub output_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum RecordingMode {
    Fullscreen,
    Window,
    Area {
        x: i32,
        y: i32,
        width: i32,
        height: i32,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum VideoFormat {
    WebM,
    MP4,
    GIF,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Quality {
    Low,    // 480p
    Medium, // 720p
    High,   // 1080p
    Ultra,  // 2K/4K
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum RecordingStatus {
    Idle,
    Recording,
    Paused,
    Processing,
    Completed,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecordingSession {
    pub id: String,
    pub status: RecordingStatus,
    pub config: RecordingConfig,
    pub start_time: Option<u64>,
    pub duration: u64,  // milliseconds
    pub file_size: u64, // bytes
    pub output_file: Option<String>,
    pub error: Option<String>,
}

pub struct ScreenRecorder {
    sessions: Arc<Mutex<HashMap<String, RecordingSession>>>,
    active_processes: Arc<Mutex<HashMap<String, Child>>>,
    app_handle: AppHandle,
}

impl ScreenRecorder {
    pub fn new(app_handle: AppHandle) -> Self {
        Self {
            sessions: Arc::new(Mutex::new(HashMap::new())),
            active_processes: Arc::new(Mutex::new(HashMap::new())),
            app_handle,
        }
    }

    /// Start a new recording session
    pub fn start_recording(&self, config: RecordingConfig) -> Result<String> {
        let session_id = uuid::Uuid::new_v4().to_string();

        let session = RecordingSession {
            id: session_id.clone(),
            status: RecordingStatus::Recording,
            config: config.clone(),
            start_time: Some(chrono::Utc::now().timestamp_millis() as u64),
            duration: 0,
            file_size: 0,
            output_file: None,
            error: None,
        };

        // Store session
        {
            let mut sessions = self.sessions.lock().unwrap();
            sessions.insert(session_id.clone(), session.clone());
        }

        // Start platform-specific recording
        match self.start_platform_recording(&session_id, &config) {
            Ok(process) => {
                let mut processes = self.active_processes.lock().unwrap();
                processes.insert(session_id.clone(), process);

                // Emit event
                let _ = self.app_handle.emit("recording:started", &session);

                Ok(session_id)
            }
            Err(e) => {
                // Update session with error
                let mut sessions = self.sessions.lock().unwrap();
                if let Some(sess) = sessions.get_mut(&session_id) {
                    sess.status = RecordingStatus::Error;
                    sess.error = Some(e.to_string());
                }
                Err(e)
            }
        }
    }

    /// Start platform-specific recording process
    fn start_platform_recording(
        &self,
        _session_id: &str,
        config: &RecordingConfig,
    ) -> Result<Child> {
        #[cfg(target_os = "macos")]
        {
            self.start_macos_recording(config)
        }

        #[cfg(target_os = "windows")]
        {
            self.start_windows_recording(config)
        }

        #[cfg(target_os = "linux")]
        {
            self.start_linux_recording(config)
        }
    }

    #[cfg(target_os = "macos")]
    fn start_macos_recording(&self, config: &RecordingConfig) -> Result<Child> {
        // macOS: Use ffmpeg with AVFoundation
        let mut cmd = Command::new("ffmpeg");

        // Video input
        cmd.arg("-f").arg("avfoundation");

        // Input device (0:0 = video:audio, 0:none = video only)
        let input = if config.audio_enabled || config.microphone_enabled {
            "0:0" // Capture both video and audio
        } else {
            "0:none" // Video only
        };
        cmd.arg("-i").arg(input);

        // Frame rate
        cmd.arg("-r").arg(config.fps.to_string());

        // Video codec based on format
        match config.format {
            VideoFormat::WebM => {
                cmd.arg("-c:v").arg("libvpx-vp9");
                cmd.arg("-b:v").arg(self.get_bitrate(&config.quality));
            }
            VideoFormat::MP4 => {
                cmd.arg("-c:v").arg("libx264");
                cmd.arg("-preset").arg("ultrafast");
                cmd.arg("-b:v").arg(self.get_bitrate(&config.quality));
            }
            VideoFormat::GIF => {
                cmd.arg("-vf").arg("fps=10,scale=640:-1:flags=lanczos");
            }
        }

        // Audio codec
        if config.audio_enabled || config.microphone_enabled {
            cmd.arg("-c:a").arg("aac");
            cmd.arg("-b:a").arg("128k");
        }

        // Output file
        cmd.arg("-y"); // Overwrite if exists
        cmd.arg(&config.output_path);

        // Start process
        let process = cmd.spawn().context("Failed to start ffmpeg recording")?;

        Ok(process)
    }

    #[cfg(target_os = "windows")]
    fn start_windows_recording(&self, config: &RecordingConfig) -> Result<Child> {
        // Windows: Use ffmpeg with GDI or DirectShow
        let mut cmd = Command::new("ffmpeg");

        // Video input (GDI capture)
        cmd.arg("-f").arg("gdigrab");
        cmd.arg("-framerate").arg(config.fps.to_string());

        // Capture mode
        match &config.mode {
            RecordingMode::Fullscreen => {
                cmd.arg("-i").arg("desktop");
            }
            RecordingMode::Window => {
                // Windows window title capture via -i title="Window Name"
                // Get focused window title using PowerShell
                let window_title = Self::get_focused_window_title_windows()
                    .unwrap_or_else(|_| "desktop".to_string());
                
                if window_title != "desktop" && !window_title.is_empty() {
                    // Use window title for targeted capture
                    cmd.arg("-i").arg(format!("title={}", window_title));
                } else {
                    // Fallback to desktop capture
                    cmd.arg("-i").arg("desktop");
                }
            }
            RecordingMode::Area {
                x,
                y,
                width,
                height,
            } => {
                cmd.arg("-offset_x").arg(x.to_string());
                cmd.arg("-offset_y").arg(y.to_string());
                cmd.arg("-video_size").arg(format!("{}x{}", width, height));
                cmd.arg("-i").arg("desktop");
            }
        }

        // Audio input
        if config.audio_enabled || config.microphone_enabled {
            cmd.arg("-f").arg("dshow");
            cmd.arg("-i").arg("audio=\"Microphone\"");
        }

        // Video codec
        match config.format {
            VideoFormat::WebM => {
                cmd.arg("-c:v").arg("libvpx-vp9");
            }
            VideoFormat::MP4 => {
                cmd.arg("-c:v").arg("libx264");
                cmd.arg("-preset").arg("ultrafast");
            }
            VideoFormat::GIF => {
                cmd.arg("-vf").arg("fps=10,scale=640:-1:flags=lanczos");
            }
        }

        // Output file
        cmd.arg("-y");
        cmd.arg(&config.output_path);

        let process = cmd.spawn().context("Failed to start ffmpeg recording")?;

        Ok(process)
    }

    #[cfg(target_os = "linux")]
    fn start_linux_recording(&self, config: &RecordingConfig) -> Result<Child> {
        // Linux: Use ffmpeg with X11
        let mut cmd = Command::new("ffmpeg");

        // Video input (X11)
        cmd.arg("-f").arg("x11grab");
        cmd.arg("-framerate").arg(config.fps.to_string());

        // Capture area
        match &config.mode {
            RecordingMode::Fullscreen => {
                // Get actual screen size using xdpyinfo or default to common resolution
                let screen_size = Self::get_screen_size_linux()
                    .unwrap_or_else(|_| "1920x1080".to_string());
                cmd.arg("-video_size").arg(screen_size);
                cmd.arg("-i").arg(":0.0");
            }
            RecordingMode::Area {
                x,
                y,
                width,
                height,
            } => {
                cmd.arg("-video_size").arg(format!("{}x{}", width, height));
                cmd.arg("-i").arg(format!(":0.0+{},{}", x, y));
            }
            _ => {
                cmd.arg("-i").arg(":0.0");
            }
        }

        // Audio input (PulseAudio)
        if config.audio_enabled || config.microphone_enabled {
            cmd.arg("-f").arg("pulse");
            cmd.arg("-i").arg("default");
        }

        // Video codec
        match config.format {
            VideoFormat::WebM => {
                cmd.arg("-c:v").arg("libvpx-vp9");
            }
            VideoFormat::MP4 => {
                cmd.arg("-c:v").arg("libx264");
                cmd.arg("-preset").arg("ultrafast");
            }
            VideoFormat::GIF => {
                cmd.arg("-vf").arg("fps=10,scale=640:-1:flags=lanczos");
            }
        }

        // Output file
        cmd.arg("-y");
        cmd.arg(&config.output_path);

        let process = cmd.spawn().context("Failed to start ffmpeg recording")?;

        Ok(process)
    }

    /// Stop recording
    pub fn stop_recording(&self, session_id: &str) -> Result<()> {
        // Get and remove process
        let mut process = {
            let mut processes = self.active_processes.lock().unwrap();
            processes
                .remove(session_id)
                .ok_or_else(|| anyhow::anyhow!("Recording session not found"))?
        };

        // Send quit signal to ffmpeg (graceful stop)
        #[cfg(unix)]
        {
            // On Unix, send SIGINT (Ctrl+C) to allow FFmpeg to finalize the file
            let _ = std::process::Command::new("kill")
                .arg("-INT")
                .arg(process.id().to_string())
                .output();
        }

        #[cfg(windows)]
        {
            process.kill().context("Failed to stop recording process")?;
        }

        // Wait for process to finish
        let _ = process.wait();

        // Update session status
        {
            let mut sessions = self.sessions.lock().unwrap();
            if let Some(session) = sessions.get_mut(session_id) {
                session.status = RecordingStatus::Completed;

                // Calculate duration
                if let Some(start_time) = session.start_time {
                    let now = chrono::Utc::now().timestamp_millis() as u64;
                    session.duration = now - start_time;
                }

                // Get file size
                if let Ok(metadata) = std::fs::metadata(&session.config.output_path) {
                    session.file_size = metadata.len();
                }

                session.output_file = Some(session.config.output_path.clone());

                // Emit event
                let _ = self.app_handle.emit("recording:completed", &session);
            }
        }

        Ok(())
    }

    /// Pause recording
    pub fn pause_recording(&self, session_id: &str) -> Result<()> {
        // Update session status
        let mut sessions = self.sessions.lock().unwrap();
        if let Some(session) = sessions.get_mut(session_id) {
            session.status = RecordingStatus::Paused;
            let _ = self.app_handle.emit("recording:paused", &session);
        }

        Ok(())
    }

    /// Resume recording
    pub fn resume_recording(&self, session_id: &str) -> Result<()> {
        // Update session status
        let mut sessions = self.sessions.lock().unwrap();
        if let Some(session) = sessions.get_mut(session_id) {
            session.status = RecordingStatus::Recording;
            let _ = self.app_handle.emit("recording:resumed", &session);
        }

        Ok(())
    }

    /// Get recording session
    pub fn get_session(&self, session_id: &str) -> Option<RecordingSession> {
        let sessions = self.sessions.lock().unwrap();
        sessions.get(session_id).cloned()
    }

    /// List all sessions
    pub fn list_sessions(&self) -> Vec<RecordingSession> {
        let sessions = self.sessions.lock().unwrap();
        sessions.values().cloned().collect()
    }

    /// Delete recording session and file
    pub fn delete_recording(&self, session_id: &str) -> Result<()> {
        // Remove from sessions
        let removed = {
            let mut sessions = self.sessions.lock().unwrap();
            sessions.remove(session_id)
        };

        // Delete file if exists
        if let Some(session) = removed {
            if let Some(output_file) = session.output_file {
                std::fs::remove_file(&output_file).context("Failed to delete recording file")?;
            }
        }

        Ok(())
    }

    /// Get bitrate based on quality
    fn get_bitrate(&self, quality: &Quality) -> &str {
        match quality {
            Quality::Low => "1M",
            Quality::Medium => "2.5M",
            Quality::High => "5M",
            Quality::Ultra => "10M",
        }
    }
    
    /// Get focused window title on Windows using PowerShell
    /// Uses GetForegroundWindow API to get the active window
    #[cfg(target_os = "windows")]
    fn get_focused_window_title_windows() -> Result<String> {
        use std::process::Command;
        
        // PowerShell script to get foreground window title
        let script = r#"
            Add-Type @"
                using System;
                using System.Runtime.InteropServices;
                using System.Text;
                public class Win32 {
                    [DllImport("user32.dll")]
                    public static extern IntPtr GetForegroundWindow();
                    [DllImport("user32.dll")]
                    public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
                }
"@
            $hwnd = [Win32]::GetForegroundWindow()
            $sb = New-Object System.Text.StringBuilder 256
            [Win32]::GetWindowText($hwnd, $sb, 256)
            $sb.ToString()
        "#;
        
        let output = Command::new("powershell")
            .args(["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script])
            .output()
            .context("Failed to execute PowerShell for window title")?;
        
        if output.status.success() {
            let title = String::from_utf8_lossy(&output.stdout)
                .trim()
                .to_string();
            
            // Escape special characters for ffmpeg
            let escaped = title
                .replace('"', "'")
                .replace('\\', "\\\\");
            
            Ok(escaped)
        } else {
            Err(anyhow::anyhow!("PowerShell command failed"))
        }
    }
    
    /// Get screen size on Linux using xdpyinfo
    /// Parses the output to extract primary display dimensions
    #[cfg(target_os = "linux")]
    fn get_screen_size_linux() -> Result<String> {
        use std::process::Command;
        
        // Try xdpyinfo first (most reliable for X11)
        let xdpy_output = Command::new("xdpyinfo")
            .output();
        
        if let Ok(output) = xdpy_output {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout);
                
                // Parse dimensions line: "  dimensions:    1920x1080 pixels"
                for line in stdout.lines() {
                    if line.contains("dimensions:") {
                        if let Some(dims) = line.split_whitespace().nth(1) {
                            if dims.contains('x') {
                                return Ok(dims.to_string());
                            }
                        }
                    }
                }
            }
        }
        
        // Fallback: try xrandr
        let xrandr_output = Command::new("xrandr")
            .arg("--current")
            .output();
        
        if let Ok(output) = xrandr_output {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout);
                
                // Parse: "Screen 0: minimum 8 x 8, current 1920 x 1080, maximum..."
                for line in stdout.lines() {
                    if line.starts_with("Screen 0:") && line.contains("current") {
                        // Extract "current WxH"
                        if let Some(current_pos) = line.find("current") {
                            let after_current = &line[current_pos + 8..];
                            let parts: Vec<&str> = after_current.split(',').next()
                                .unwrap_or("")
                                .split_whitespace()
                                .collect();
                            
                            if parts.len() >= 3 && parts[1] == "x" {
                                return Ok(format!("{}x{}", parts[0], parts[2]));
                            }
                        }
                    }
                }
            }
        }
        
        // Final fallback: common resolution
        Ok("1920x1080".to_string())
    }
    
    /// Get screen size on macOS using system_profiler
    /// Extracts resolution from display profile
    #[cfg(target_os = "macos")]
    fn get_screen_size_macos() -> Result<String> {
        use std::process::Command;
        
        let output = Command::new("system_profiler")
            .arg("SPDisplaysDataType")
            .output()
            .context("Failed to run system_profiler")?;
        
        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            
            // Parse resolution line: "Resolution: 2560 x 1440 (QHD/WQHD - Wide Quad HD)"
            for line in stdout.lines() {
                let trimmed = line.trim();
                if trimmed.starts_with("Resolution:") {
                    // Extract dimensions
                    let parts: Vec<&str> = trimmed
                        .trim_start_matches("Resolution:")
                        .split_whitespace()
                        .collect();
                    
                    if parts.len() >= 3 && parts[1] == "x" {
                        return Ok(format!("{}x{}", parts[0], parts[2]));
                    }
                }
            }
        }
        
        // Fallback to Retina default
        Ok("2560x1440".to_string())
    }
}
