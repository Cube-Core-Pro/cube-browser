// src-tauri/src/commands/updates.rs
// CUBE Elite v6 - Application Update System
// Handles automatic and manual updates from centralized admin server

use serde::{Deserialize, Serialize};
use tauri::{State, Manager, Emitter, AppHandle};
use tokio::sync::Mutex;
use sha2::{Sha256, Digest};

// ============================================================================
// TYPES & STRUCTURES
// ============================================================================

/// Release note entry for a specific version
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReleaseNote {
    pub version: String,
    pub date: String,
    pub title: String,
    pub description: String,
    pub changes: Vec<String>,
    pub breaking_changes: Vec<String>,
    pub is_critical: bool,
}

/// Information about an available update
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateInfo {
    pub available: bool,
    pub current_version: String,
    pub latest_version: String,
    pub download_url: String,
    pub release_notes: Vec<ReleaseNote>,
    pub file_size: u64,
    pub checksum: String,
    pub is_critical: bool,
    pub min_supported_version: String,
    pub published_at: String,
}

/// Download progress information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadProgress {
    pub downloaded_bytes: u64,
    pub total_bytes: u64,
    pub percentage: f64,
    pub speed_bytes_per_sec: u64,
    pub eta_seconds: u64,
    pub status: String,
}

/// Update settings configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateSettings {
    pub auto_update_enabled: bool,
    pub channel: String,
    pub check_frequency: String,
    pub notify_only: bool,
    pub include_prereleases: bool,
    pub download_path: String,
    pub last_check: Option<String>,
    pub last_update: Option<String>,
}

impl Default for UpdateSettings {
    fn default() -> Self {
        Self {
            auto_update_enabled: true,
            channel: "stable".to_string(),
            check_frequency: "daily".to_string(),
            notify_only: false,
            include_prereleases: false,
            download_path: String::new(),
            last_check: None,
            last_update: None,
        }
    }
}

/// State for managing updates
pub struct UpdateState {
    pub settings: Mutex<UpdateSettings>,
    pub current_download: Mutex<Option<DownloadProgress>>,
    pub available_update: Mutex<Option<UpdateInfo>>,
}

impl Default for UpdateState {
    fn default() -> Self {
        Self {
            settings: Mutex::new(UpdateSettings::default()),
            current_download: Mutex::new(None),
            available_update: Mutex::new(None),
        }
    }
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CURRENT_VERSION: &str = env!("CARGO_PKG_VERSION");
const UPDATE_SERVER_URL: &str = "https://admin.cube-elite.com/api/v1/updates";
const EXTENSION_UPDATE_URL: &str = "https://admin.cube-elite.com/api/v1/extension/updates";

// ============================================================================
// COMMANDS - CHECK FOR UPDATES
// ============================================================================

#[tauri::command]
pub async fn check_for_updates(
    state: State<'_, UpdateState>,
    channel: Option<String>,
) -> Result<UpdateInfo, String> {
    let update_channel = {
        let settings = state.settings.lock().await;
        channel.unwrap_or_else(|| settings.channel.clone())
    };
    
    let url = format!(
        "{}/check?current_version={}&channel={}&platform={}&arch={}",
        UPDATE_SERVER_URL,
        CURRENT_VERSION,
        update_channel,
        std::env::consts::OS,
        std::env::consts::ARCH
    );
    
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("User-Agent", format!("CUBE-Elite/{}", CURRENT_VERSION))
        .header("X-App-ID", "cube-elite-tauri")
        .send()
        .await
        .map_err(|e| format!("Failed to connect to update server: {}", e))?;
    
    if !response.status().is_success() {
        return Err(format!("Update server returned error: {}", response.status()));
    }
    
    let update_info: UpdateInfo = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse update response: {}", e))?;
    
    {
        let mut available = state.available_update.lock().await;
        *available = Some(update_info.clone());
    }
    
    {
        let mut settings = state.settings.lock().await;
        settings.last_check = Some(chrono::Utc::now().to_rfc3339());
    }
    
    Ok(update_info)
}

#[tauri::command]
pub fn get_current_version() -> Result<String, String> {
    Ok(CURRENT_VERSION.to_string())
}

#[tauri::command]
pub async fn get_cached_update_info(
    state: State<'_, UpdateState>,
) -> Result<Option<UpdateInfo>, String> {
    let available = state.available_update.lock().await;
    Ok(available.clone())
}

// ============================================================================
// COMMANDS - DOWNLOAD & INSTALL
// ============================================================================

#[tauri::command]
pub async fn download_update(
    state: State<'_, UpdateState>,
    app_handle: AppHandle,
) -> Result<String, String> {
    let update_info = {
        let available = state.available_update.lock().await;
        available
            .as_ref()
            .ok_or("No update available. Check for updates first.")?
            .clone()
    };
    
    if !update_info.available {
        return Err("No update available".to_string());
    }
    
    let download_dir = app_handle
        .path()
        .app_cache_dir()
        .map_err(|e| format!("Failed to get cache directory: {}", e))?
        .join("updates");
    
    std::fs::create_dir_all(&download_dir)
        .map_err(|e| format!("Failed to create download directory: {}", e))?;
    
    let file_name = format!("cube-elite-{}.dmg", update_info.latest_version);
    let file_path = download_dir.join(&file_name);
    
    {
        let mut progress = state.current_download.lock().await;
        *progress = Some(DownloadProgress {
            downloaded_bytes: 0,
            total_bytes: update_info.file_size,
            percentage: 0.0,
            speed_bytes_per_sec: 0,
            eta_seconds: 0,
            status: "starting".to_string(),
        });
    }
    
    let client = reqwest::Client::new();
    let response = client
        .get(&update_info.download_url)
        .header("User-Agent", format!("CUBE-Elite/{}", CURRENT_VERSION))
        .send()
        .await
        .map_err(|e| format!("Failed to start download: {}", e))?;
    
    let total_size = response.content_length().unwrap_or(update_info.file_size);
    
    let mut file = std::fs::File::create(&file_path)
        .map_err(|e| format!("Failed to create file: {}", e))?;
    
    let mut downloaded: u64 = 0;
    let mut stream = response.bytes_stream();
    let start_time = std::time::Instant::now();
    
    use futures_util::StreamExt;
    use std::io::Write;
    
    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("Download error: {}", e))?;
        file.write_all(&chunk)
            .map_err(|e| format!("Write error: {}", e))?;
        
        downloaded += chunk.len() as u64;
        let elapsed = start_time.elapsed().as_secs_f64();
        let speed = if elapsed > 0.0 { (downloaded as f64 / elapsed) as u64 } else { 0 };
        let eta = if speed > 0 { (total_size - downloaded) / speed } else { 0 };
        
        let progress_update = DownloadProgress {
            downloaded_bytes: downloaded,
            total_bytes: total_size,
            percentage: (downloaded as f64 / total_size as f64) * 100.0,
            speed_bytes_per_sec: speed,
            eta_seconds: eta,
            status: "downloading".to_string(),
        };
        
        {
            let mut progress = state.current_download.lock().await;
            *progress = Some(progress_update.clone());
        }
        
        let _ = app_handle.emit("update-download-progress", progress_update);
    }
    
    {
        let mut progress = state.current_download.lock().await;
        if let Some(ref mut p) = *progress {
            p.status = "verifying".to_string();
        }
    }
    
    let file_content = std::fs::read(&file_path)
        .map_err(|e| format!("Failed to read downloaded file: {}", e))?;
    
    let mut hasher = Sha256::new();
    hasher.update(&file_content);
    let computed_checksum = format!("{:x}", hasher.finalize());
    
    if computed_checksum != update_info.checksum && !update_info.checksum.is_empty() {
        std::fs::remove_file(&file_path).ok();
        return Err("Checksum verification failed. Download may be corrupted.".to_string());
    }
    
    {
        let mut progress = state.current_download.lock().await;
        if let Some(ref mut p) = *progress {
            p.status = "complete".to_string();
            p.percentage = 100.0;
        }
    }
    
    Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn get_download_progress(
    state: State<'_, UpdateState>,
) -> Result<Option<DownloadProgress>, String> {
    let progress = state.current_download.lock().await;
    Ok(progress.clone())
}

#[tauri::command]
pub async fn install_update(
    file_path: String,
    app_handle: AppHandle,
) -> Result<(), String> {
    if !std::path::Path::new(&file_path).exists() {
        return Err("Update file not found".to_string());
    }
    
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&file_path)
            .spawn()
            .map_err(|e| format!("Failed to open installer: {}", e))?;
    }
    
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new(&file_path)
            .spawn()
            .map_err(|e| format!("Failed to run installer: {}", e))?;
    }
    
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("chmod")
            .arg("+x")
            .arg(&file_path)
            .output()
            .map_err(|e| format!("Failed to set permissions: {}", e))?;
        
        std::process::Command::new(&file_path)
            .spawn()
            .map_err(|e| format!("Failed to run installer: {}", e))?;
    }
    
    tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
    app_handle.restart();
}

// ============================================================================
// COMMANDS - SETTINGS MANAGEMENT
// ============================================================================

#[tauri::command]
pub async fn get_update_settings(
    state: State<'_, UpdateState>,
) -> Result<UpdateSettings, String> {
    let settings = state.settings.lock().await;
    Ok(settings.clone())
}

#[tauri::command]
pub async fn set_update_settings(
    state: State<'_, UpdateState>,
    settings: UpdateSettings,
) -> Result<(), String> {
    let mut current = state.settings.lock().await;
    *current = settings;
    Ok(())
}

#[tauri::command]
pub async fn set_auto_update(
    state: State<'_, UpdateState>,
    enabled: bool,
) -> Result<(), String> {
    let mut settings = state.settings.lock().await;
    settings.auto_update_enabled = enabled;
    Ok(())
}

#[tauri::command]
pub async fn set_update_channel(
    state: State<'_, UpdateState>,
    channel: String,
) -> Result<(), String> {
    let valid_channels = ["stable", "beta", "nightly"];
    if !valid_channels.contains(&channel.as_str()) {
        return Err(format!("Invalid channel. Must be one of: {:?}", valid_channels));
    }
    
    let mut settings = state.settings.lock().await;
    settings.channel = channel;
    Ok(())
}

// ============================================================================
// COMMANDS - RELEASE NOTES
// ============================================================================

#[tauri::command]
pub async fn get_release_notes(
    limit: Option<u32>,
) -> Result<Vec<ReleaseNote>, String> {
    let limit_count = limit.unwrap_or(10);
    
    let url = format!(
        "{}/release-notes?limit={}",
        UPDATE_SERVER_URL,
        limit_count
    );
    
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("User-Agent", format!("CUBE-Elite/{}", CURRENT_VERSION))
        .send()
        .await
        .map_err(|e| format!("Failed to fetch release notes: {}", e))?;
    
    if !response.status().is_success() {
        return Err(format!("Server returned error: {}", response.status()));
    }
    
    let notes: Vec<ReleaseNote> = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse release notes: {}", e))?;
    
    Ok(notes)
}

#[tauri::command]
pub async fn get_version_release_notes(
    version: String,
) -> Result<ReleaseNote, String> {
    let url = format!(
        "{}/release-notes/{}",
        UPDATE_SERVER_URL,
        version
    );
    
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("User-Agent", format!("CUBE-Elite/{}", CURRENT_VERSION))
        .send()
        .await
        .map_err(|e| format!("Failed to fetch release notes: {}", e))?;
    
    if !response.status().is_success() {
        return Err(format!("Version not found: {}", version));
    }
    
    let note: ReleaseNote = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse release note: {}", e))?;
    
    Ok(note)
}

// ============================================================================
// COMMANDS - EXTENSION UPDATES
// ============================================================================

#[tauri::command]
pub async fn check_extension_updates(
    current_extension_version: String,
) -> Result<UpdateInfo, String> {
    let url = format!(
        "{}/check?current_version={}&platform=chrome",
        EXTENSION_UPDATE_URL,
        current_extension_version
    );
    
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("User-Agent", format!("CUBE-Elite-Extension/{}", current_extension_version))
        .send()
        .await
        .map_err(|e| format!("Failed to check extension updates: {}", e))?;
    
    if !response.status().is_success() {
        return Err(format!("Server returned error: {}", response.status()));
    }
    
    let update_info: UpdateInfo = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse extension update info: {}", e))?;
    
    Ok(update_info)
}

#[tauri::command]
pub async fn download_extension_update(
    download_url: String,
    app_handle: AppHandle,
) -> Result<String, String> {
    let download_dir = app_handle
        .path()
        .app_cache_dir()
        .map_err(|e| format!("Failed to get cache directory: {}", e))?
        .join("extension-updates");
    
    std::fs::create_dir_all(&download_dir)
        .map_err(|e| format!("Failed to create directory: {}", e))?;
    
    let file_path = download_dir.join("cube-elite-extension.crx");
    
    let client = reqwest::Client::new();
    let response = client
        .get(&download_url)
        .send()
        .await
        .map_err(|e| format!("Failed to download extension: {}", e))?;
    
    let content = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read extension content: {}", e))?;
    
    std::fs::write(&file_path, content)
        .map_err(|e| format!("Failed to save extension: {}", e))?;
    
    Ok(file_path.to_string_lossy().to_string())
}

// ============================================================================
// COMMANDS - ROLLBACK
// ============================================================================

#[tauri::command]
pub async fn get_rollback_versions() -> Result<Vec<String>, String> {
    let url = format!("{}/rollback-versions", UPDATE_SERVER_URL);
    
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("User-Agent", format!("CUBE-Elite/{}", CURRENT_VERSION))
        .send()
        .await
        .map_err(|e| format!("Failed to fetch rollback versions: {}", e))?;
    
    if !response.status().is_success() {
        return Err(format!("Server returned error: {}", response.status()));
    }
    
    let versions: Vec<String> = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse versions: {}", e))?;
    
    Ok(versions)
}

#[tauri::command]
pub async fn rollback_to_version(
    version: String,
    app_handle: AppHandle,
) -> Result<String, String> {
    let url = format!("{}/download/{}", UPDATE_SERVER_URL, version);
    
    let client = reqwest::Client::new();
    let response = client
        .head(&url)
        .send()
        .await
        .map_err(|e| format!("Version not available: {}", e))?;
    
    if !response.status().is_success() {
        return Err(format!("Version {} not available for rollback", version));
    }
    
    let download_dir = app_handle
        .path()
        .app_cache_dir()
        .map_err(|e| format!("Failed to get cache directory: {}", e))?
        .join("rollback");
    
    std::fs::create_dir_all(&download_dir)
        .map_err(|e| format!("Failed to create directory: {}", e))?;
    
    let file_name = format!("cube-elite-{}.dmg", version);
    let file_path = download_dir.join(&file_name);
    
    let download_response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to download version: {}", e))?;
    
    let content = download_response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read content: {}", e))?;
    
    std::fs::write(&file_path, content)
        .map_err(|e| format!("Failed to save installer: {}", e))?;
    
    Ok(file_path.to_string_lossy().to_string())
}
