// Download Service - File Download Manager
use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::fs::File;
use tokio::io::AsyncWriteExt;
use tokio::sync::Mutex; // Use tokio::sync::Mutex instead of std::sync::Mutex

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Download {
    pub id: String,
    pub url: String,
    pub filename: String,
    pub path: String,
    pub size: i64,
    pub downloaded: i64,
    pub status: DownloadStatus,
    pub speed: i64,
    #[serde(rename = "startTime")]
    pub start_time: i64,
    #[serde(rename = "endTime", skip_serializing_if = "Option::is_none")]
    pub end_time: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum DownloadStatus {
    Downloading,
    Completed,
    Failed,
    Paused,
    Cancelled,
}

pub struct DownloadService {
    downloads: Arc<Mutex<HashMap<String, Download>>>,
    app_handle: AppHandle,
}

impl DownloadService {
    pub fn new(app_handle: AppHandle) -> Self {
        Self {
            downloads: Arc::new(Mutex::new(HashMap::new())),
            app_handle,
        }
    }

    pub async fn get_all_downloads(&self) -> Result<Vec<Download>> {
        let downloads = self.downloads.lock().await;
        Ok(downloads.values().cloned().collect())
    }

    pub async fn get_download(&self, id: &str) -> Result<Download> {
        let downloads = self.downloads.lock().await;
        downloads
            .get(id)
            .cloned()
            .ok_or_else(|| anyhow!("Download not found"))
    }

    pub async fn start_download(&self, url: String, filename: Option<String>) -> Result<String> {
        let id = uuid::Uuid::new_v4().to_string();

        // Determine filename
        let final_filename =
            filename.unwrap_or_else(|| url.split('/').next_back().unwrap_or("download").to_string());

        // Get downloads directory
        let downloads_dir =
            dirs::download_dir().ok_or_else(|| anyhow!("Could not find downloads directory"))?;

        let file_path = downloads_dir.join(&final_filename);

        // Create download entry
        let download = Download {
            id: id.clone(),
            url: url.clone(),
            filename: final_filename,
            path: file_path.to_string_lossy().to_string(),
            size: 0,
            downloaded: 0,
            status: DownloadStatus::Downloading,
            speed: 0,
            start_time: chrono::Utc::now().timestamp_millis(),
            end_time: None,
            error: None,
        };

        // Store download
        {
            let mut downloads = self.downloads.lock().await;
            downloads.insert(id.clone(), download);
        }

        // Start download task
        let service = self.clone_for_task();
        let download_id = id.clone();

        tokio::spawn(async move {
            if let Err(e) = service.perform_download(download_id, url, file_path).await {
                eprintln!("Download failed: {}", e);
            }
        });

        Ok(id)
    }

    async fn perform_download(&self, id: String, url: String, path: PathBuf) -> Result<()> {
        // Create HTTP client
        let client = reqwest::Client::builder()
            .user_agent("CUBE Elite Browser v6.0")
            .build()?;

        // Send request
        let response = client.get(&url).send().await?;

        if !response.status().is_success() {
            self.mark_failed(&id, &format!("HTTP {}", response.status()))?;
            return Err(anyhow!("HTTP {}", response.status()));
        }

        // Get content length
        let total_size = response.content_length().unwrap_or(0) as i64;

        // Update download size
        {
            let mut downloads = self.downloads.lock().await;
            if let Some(download) = downloads.get_mut(&id) {
                download.size = total_size;
            }
        }

        // Create file
        let mut file = File::create(&path).await?;
        let mut downloaded: i64 = 0;
        let mut last_update = std::time::Instant::now();
        let mut last_downloaded = 0i64;

        // Download chunks
        let mut stream = response.bytes_stream();
        use futures_util::StreamExt;

        while let Some(chunk_result) = stream.next().await {
            // Check if download was paused or cancelled
            {
                let downloads = self.downloads.lock().await;
                if let Some(download) = downloads.get(&id) {
                    match download.status {
                        DownloadStatus::Paused => {
                            // Wait until resumed or cancelled
                            drop(downloads);
                            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
                            continue;
                        }
                        DownloadStatus::Cancelled => {
                            // Clean up and exit
                            let _ = tokio::fs::remove_file(&path).await;
                            return Ok(());
                        }
                        _ => {}
                    }
                }
            }

            let chunk = chunk_result?;
            file.write_all(&chunk).await?;
            downloaded += chunk.len() as i64;

            // Update progress every 100ms
            let now = std::time::Instant::now();
            if now.duration_since(last_update).as_millis() > 100 {
                let speed = ((downloaded - last_downloaded) as f64
                    / now.duration_since(last_update).as_secs_f64())
                    as i64;

                // Update download status
                {
                    let mut downloads = self.downloads.lock().await;
                    if let Some(download) = downloads.get_mut(&id) {
                        download.downloaded = downloaded;
                        download.speed = speed;
                    }
                }

                // Emit progress event
                let _ = self.app_handle.emit(
                    "download-progress",
                    serde_json::json!({
                        "id": id,
                        "downloaded": downloaded,
                        "speed": speed
                    }),
                );

                last_update = now;
                last_downloaded = downloaded;
            }
        }

        // Mark as completed
        {
            let mut downloads = self.downloads.lock().await;
            if let Some(download) = downloads.get_mut(&id) {
                download.status = DownloadStatus::Completed;
                download.downloaded = downloaded;
                download.end_time = Some(chrono::Utc::now().timestamp_millis());
            }
        }

        // Emit completion event
        let _ = self.app_handle.emit(
            "download-complete",
            serde_json::json!({
                "id": id,
                "path": path.to_string_lossy()
            }),
        );

        Ok(())
    }

    pub async fn pause_download(&self, id: &str) -> Result<()> {
        let mut downloads = self.downloads.lock().await;
        let download = downloads
            .get_mut(id)
            .ok_or_else(|| anyhow!("Download not found"))?;

        if download.status == DownloadStatus::Downloading {
            download.status = DownloadStatus::Paused;
        }

        Ok(())
    }

    pub async fn resume_download(&self, id: &str) -> Result<()> {
        let mut downloads = self.downloads.lock().await;
        let download = downloads
            .get_mut(id)
            .ok_or_else(|| anyhow!("Download not found"))?;

        if download.status == DownloadStatus::Paused {
            download.status = DownloadStatus::Downloading;
        }

        Ok(())
    }

    pub async fn cancel_download(&self, id: &str) -> Result<()> {
        let mut downloads = self.downloads.lock().await;
        let download = downloads
            .get_mut(id)
            .ok_or_else(|| anyhow!("Download not found"))?;

        download.status = DownloadStatus::Cancelled;
        download.end_time = Some(chrono::Utc::now().timestamp_millis());

        Ok(())
    }

    pub async fn remove_download(&self, id: &str) -> Result<()> {
        let mut downloads = self.downloads.lock().await;
        downloads.remove(id);
        Ok(())
    }

    pub async fn open_file(&self, path: &str) -> Result<()> {
        #[cfg(target_os = "macos")]
        {
            tokio::process::Command::new("open").arg(path).spawn()?;
        }

        #[cfg(target_os = "windows")]
        {
            tokio::process::Command::new("cmd")
                .args(&["/C", "start", "", path])
                .spawn()?;
        }

        #[cfg(target_os = "linux")]
        {
            tokio::process::Command::new("xdg-open").arg(path).spawn()?;
        }

        Ok(())
    }

    pub async fn show_in_folder(&self, path: &str) -> Result<()> {
        let folder = PathBuf::from(path)
            .parent()
            .ok_or_else(|| anyhow!("Invalid path"))?
            .to_string_lossy()
            .to_string();

        #[cfg(target_os = "macos")]
        {
            tokio::process::Command::new("open").arg(&folder).spawn()?;
        }

        #[cfg(target_os = "windows")]
        {
            tokio::process::Command::new("explorer")
                .arg(&folder)
                .spawn()?;
        }

        #[cfg(target_os = "linux")]
        {
            tokio::process::Command::new("xdg-open")
                .arg(&folder)
                .spawn()?;
        }

        Ok(())
    }

    async fn mark_failed_async(&self, id: String, error: String) -> Result<()> {
        let mut downloads = self.downloads.lock().await;
        if let Some(download) = downloads.get_mut(&id) {
            download.status = DownloadStatus::Failed;
            download.error = Some(error.clone());
            download.end_time = Some(chrono::Utc::now().timestamp_millis());
        }

        // Emit failure event
        let _ = self.app_handle.emit(
            "download-failed",
            serde_json::json!({
                "id": id,
                "error": error
            }),
        );

        Ok(())
    }

    fn mark_failed(&self, id: &str, error: &str) -> Result<()> {
        // Simplified sync version - just emit event
        let _ = self.app_handle.emit(
            "download-failed",
            serde_json::json!({
                "id": id,
                "error": error
            }),
        );
        Ok(())
    }

    fn clone_for_task(&self) -> Self {
        Self {
            downloads: Arc::clone(&self.downloads),
            app_handle: self.app_handle.clone(),
        }
    }
}
