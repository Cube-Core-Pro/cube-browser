use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FtpConnection {
    pub id: String,
    pub name: String,
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: String, // Encrypted in storage
    pub protocol: String, // "ftp", "sftp", "ftps"
    pub remote_directory: String,
    pub is_connected: bool,
    pub last_connected_at: Option<i64>,
    pub created_at: i64,
    pub is_favorite: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FtpFile {
    pub name: String,
    pub path: String,
    pub size: i64,
    pub is_directory: bool,
    pub modified_at: i64,
    pub permissions: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FtpTransfer {
    pub id: String,
    pub connection_id: String,
    pub local_path: String,
    pub remote_path: String,
    pub direction: String, // "upload" or "download"
    pub file_size: i64,
    pub transferred_bytes: i64,
    pub status: String, // "pending", "transferring", "completed", "failed"
    pub speed_bytes_per_sec: i64,
    pub started_at: Option<i64>,
    pub completed_at: Option<i64>,
    pub error_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FtpStats {
    pub total_connections: i32,
    pub active_connections: i32,
    pub total_transfers: i32,
    pub active_transfers: i32,
    pub total_uploaded_bytes: i64,
    pub total_downloaded_bytes: i64,
}
