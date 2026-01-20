use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Download {
    pub id: String,
    pub url: String,
    pub filename: String,
    pub file_path: String,
    pub file_size: i64,
    pub downloaded_bytes: i64,
    pub status: String, // "pending", "downloading", "paused", "completed", "failed", "canceled"
    pub category: String,
    pub mime_type: Option<String>,
    pub speed_bytes_per_sec: i64,
    pub eta_seconds: Option<i64>,
    pub error_message: Option<String>,
    pub created_at: i64,
    pub started_at: Option<i64>,
    pub completed_at: Option<i64>,
    pub paused_at: Option<i64>,
    pub is_resumable: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadStats {
    pub total_downloads: i32,
    pub active_downloads: i32,
    pub completed_downloads: i32,
    pub failed_downloads: i32,
    pub paused_downloads: i32,
    pub total_downloaded_bytes: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadFilter {
    pub status: Option<String>,
    pub category: Option<String>,
    pub query: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadCategory {
    pub id: String,
    pub name: String,
    pub icon: String,
    pub count: i32,
}
