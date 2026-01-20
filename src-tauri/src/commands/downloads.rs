use serde::{Deserialize, Serialize};
use std::collections::HashMap;
#[cfg(target_os = "linux")]
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, Manager};
use tokio::io::AsyncWriteExt;
use futures_util::StreamExt;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Download {
    pub id: String,
    pub url: String,
    pub filename: String,
    pub path: String,
    pub total_bytes: u64,
    pub downloaded_bytes: u64,
    pub status: DownloadStatus,
    pub start_time: i64,
    pub end_time: Option<i64>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum DownloadStatus {
    Pending,
    Downloading,
    Paused,
    Completed,
    Failed,
    Cancelled,
}

type DownloadsMap = Arc<Mutex<HashMap<String, Download>>>;

/// Initialize downloads manager in app state
pub fn init_downloads(app: &AppHandle) {
    let downloads: DownloadsMap = Arc::new(Mutex::new(HashMap::new()));
    app.manage(downloads);
}

/// Start a new download
#[tauri::command]
pub async fn start_download(
    url: String,
    filename: Option<String>,
    downloads: tauri::State<'_, DownloadsMap>,
) -> Result<Download, String> {
    let download_id = uuid::Uuid::new_v4().to_string();

    // Determine filename
    let final_filename =
        filename.unwrap_or_else(|| url.split('/').next_back().unwrap_or("download").to_string());

    // Get downloads directory
    let downloads_dir =
        dirs::download_dir().ok_or_else(|| "Could not find downloads directory".to_string())?;

    let file_path = downloads_dir.join(&final_filename);

    let download = Download {
        id: download_id.clone(),
        url: url.clone(),
        filename: final_filename,
        path: file_path.to_string_lossy().to_string(),
        total_bytes: 0,
        downloaded_bytes: 0,
        status: DownloadStatus::Pending,
        start_time: chrono::Utc::now().timestamp(),
        end_time: None,
        error: None,
    };

    // Store download
    let mut map = downloads.lock().map_err(|e| e.to_string())?;
    map.insert(download_id.clone(), download.clone());
    drop(map);

    // Clone values for async task
    let url_clone = url.clone();
    let download_id_clone = download_id.clone();
    let file_path_clone = file_path.clone();
    let downloads_clone = downloads.inner().clone();

    // Start actual download in background
    tokio::spawn(async move {
        match perform_download(
            url_clone,
            download_id_clone.clone(),
            file_path_clone,
            downloads_clone,
        ).await {
            Ok(_) => {
                tracing::info!("Download {} completed successfully", download_id_clone);
            }
            Err(e) => {
                tracing::error!("Download {} failed: {}", download_id_clone, e);
            }
        }
    });

    Ok(download)
}

/// Perform the actual download with progress tracking
async fn perform_download(
    url: String,
    download_id: String,
    file_path: std::path::PathBuf,
    downloads: DownloadsMap,
) -> Result<(), String> {
    // Create HTTP client
    let client = reqwest::Client::builder()
        .user_agent("CUBE-Elite/7.0")
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    // Start the request
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    // Check status
    if !response.status().is_success() {
        let status = response.status();
        update_download_error(&downloads, &download_id, format!("HTTP error: {}", status))?;
        return Err(format!("HTTP error: {}", status));
    }

    // Get content length
    let total_bytes = response.content_length().unwrap_or(0);

    // Update total bytes and status
    {
        let mut map = downloads.lock().map_err(|e| e.to_string())?;
        if let Some(download) = map.get_mut(&download_id) {
            download.total_bytes = total_bytes;
            download.status = DownloadStatus::Downloading;
        }
    }

    // Create file
    let mut file = tokio::fs::File::create(&file_path)
        .await
        .map_err(|e| format!("Failed to create file: {}", e))?;

    // Stream download with progress
    let mut stream = response.bytes_stream();
    let mut downloaded: u64 = 0;
    let mut last_update = std::time::Instant::now();

    while let Some(chunk_result) = stream.next().await {
        // Check if download was cancelled or paused
        // Extract status first, then release lock before any await
        let current_status = {
            let map = downloads.lock().map_err(|e| e.to_string())?;
            map.get(&download_id).map(|d| d.status.clone())
        };

        if let Some(status) = current_status {
            match status {
                DownloadStatus::Cancelled => {
                    // Clean up partial file (lock already released)
                    let _ = tokio::fs::remove_file(&file_path).await;
                    return Ok(());
                }
                DownloadStatus::Paused => {
                    // Wait for resume (simple polling, lock already released)
                    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
                    continue;
                }
                _ => {}
            }
        }

        let chunk = chunk_result.map_err(|e| format!("Download error: {}", e))?;
        file.write_all(&chunk)
            .await
            .map_err(|e| format!("Write error: {}", e))?;

        downloaded += chunk.len() as u64;

        // Update progress every 100ms
        if last_update.elapsed() > std::time::Duration::from_millis(100) {
            let mut map = downloads.lock().map_err(|e| e.to_string())?;
            if let Some(download) = map.get_mut(&download_id) {
                download.downloaded_bytes = downloaded;
            }
            last_update = std::time::Instant::now();
        }
    }

    // Flush and close file
    file.flush().await.map_err(|e| format!("Flush error: {}", e))?;

    // Mark as completed
    {
        let mut map = downloads.lock().map_err(|e| e.to_string())?;
        if let Some(download) = map.get_mut(&download_id) {
            download.downloaded_bytes = downloaded;
            download.status = DownloadStatus::Completed;
            download.end_time = Some(chrono::Utc::now().timestamp());
        }
    }

    Ok(())
}

/// Update download with error status
fn update_download_error(
    downloads: &DownloadsMap,
    download_id: &str,
    error: String,
) -> Result<(), String> {
    let mut map = downloads.lock().map_err(|e| e.to_string())?;
    if let Some(download) = map.get_mut(download_id) {
        download.status = DownloadStatus::Failed;
        download.error = Some(error);
        download.end_time = Some(chrono::Utc::now().timestamp());
    }
    Ok(())
}

/// Get all downloads
#[tauri::command]
pub fn get_downloads(downloads: tauri::State<'_, DownloadsMap>) -> Result<Vec<Download>, String> {
    let map = downloads.lock().map_err(|e| e.to_string())?;
    let downloads_vec: Vec<Download> = map.values().cloned().collect();
    Ok(downloads_vec)
}

/// Get specific download
#[tauri::command]
pub fn get_download(
    download_id: String,
    downloads: tauri::State<'_, DownloadsMap>,
) -> Result<Option<Download>, String> {
    let map = downloads.lock().map_err(|e| e.to_string())?;
    Ok(map.get(&download_id).cloned())
}

/// Pause download
#[tauri::command]
pub fn pause_download(
    download_id: String,
    downloads: tauri::State<'_, DownloadsMap>,
) -> Result<(), String> {
    let mut map = downloads.lock().map_err(|e| e.to_string())?;

    if let Some(download) = map.get_mut(&download_id) {
        if download.status == DownloadStatus::Downloading {
            download.status = DownloadStatus::Paused;
            Ok(())
        } else {
            Err("Download is not in downloading state".to_string())
        }
    } else {
        Err("Download not found".to_string())
    }
}

/// Resume download
#[tauri::command]
pub fn resume_download(
    download_id: String,
    downloads: tauri::State<'_, DownloadsMap>,
) -> Result<(), String> {
    let mut map = downloads.lock().map_err(|e| e.to_string())?;

    if let Some(download) = map.get_mut(&download_id) {
        if download.status == DownloadStatus::Paused {
            download.status = DownloadStatus::Downloading;
            Ok(())
        } else {
            Err("Download is not paused".to_string())
        }
    } else {
        Err("Download not found".to_string())
    }
}

/// Cancel download
#[tauri::command]
pub fn cancel_download(
    download_id: String,
    downloads: tauri::State<'_, DownloadsMap>,
) -> Result<(), String> {
    let mut map = downloads.lock().map_err(|e| e.to_string())?;

    if let Some(download) = map.get_mut(&download_id) {
        download.status = DownloadStatus::Cancelled;
        download.end_time = Some(chrono::Utc::now().timestamp());
        Ok(())
    } else {
        Err("Download not found".to_string())
    }
}

/// Remove download from history
#[tauri::command]
pub fn remove_download(
    download_id: String,
    downloads: tauri::State<'_, DownloadsMap>,
) -> Result<(), String> {
    let mut map = downloads.lock().map_err(|e| e.to_string())?;
    map.remove(&download_id);
    Ok(())
}

/// Clear all completed downloads
#[tauri::command]
pub fn clear_completed_downloads(
    downloads: tauri::State<'_, DownloadsMap>,
) -> Result<usize, String> {
    let mut map = downloads.lock().map_err(|e| e.to_string())?;

    let before_count = map.len();
    map.retain(|_, download| download.status != DownloadStatus::Completed);
    let removed_count = before_count - map.len();

    Ok(removed_count)
}

/// Open download location in file explorer
#[tauri::command]
pub fn open_download_location(path: String) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    let path_buf = PathBuf::from(&path);

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg("-R")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open location: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg("/select,")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open location: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        // Try to open the parent directory
        if let Some(parent) = path_buf.parent() {
            std::process::Command::new("xdg-open")
                .arg(parent)
                .spawn()
                .map_err(|e| format!("Failed to open location: {}", e))?;
        }
    }

    Ok(())
}

/// Open downloaded file
#[tauri::command]
pub fn open_downloaded_file(path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open file: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(&["/C", "start", "", &path])
            .spawn()
            .map_err(|e| format!("Failed to open file: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open file: {}", e))?;
    }

    Ok(())
}
