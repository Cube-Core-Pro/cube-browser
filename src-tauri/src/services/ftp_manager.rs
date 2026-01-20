use anyhow::{Context, Result};
use base64::{engine::general_purpose, Engine as _};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::Read;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter};

/// FTP Protocol Type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum FtpProtocol {
    FTP,   // Plain FTP
    FTPS,  // FTP over TLS
    SFTP,  // SSH File Transfer Protocol
    FTPES, // FTP with Explicit TLS
}

/// Transfer Mode
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TransferMode {
    Binary,
    ASCII,
    Auto,
}

/// FTP Site Configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FtpSite {
    pub id: String,
    pub name: String,
    pub protocol: FtpProtocol,
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password_encrypted: Option<String>,
    pub ssh_key_path: Option<PathBuf>,
    pub passive_mode: bool,
    pub transfer_mode: TransferMode,
    pub remote_path: String,
    pub local_path: String,
    pub max_connections: u8,
    pub retry_attempts: u8,
    pub timeout_seconds: u32,
    pub created_at: u64,
    pub last_used: Option<u64>,
}

/// Transfer Queue Item
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransferItem {
    pub id: String,
    pub site_id: String,
    pub transfer_type: TransferType,
    pub local_path: PathBuf,
    pub remote_path: String,
    pub file_size: u64,
    pub bytes_transferred: u64,
    pub status: TransferStatus,
    pub speed: u64,       // bytes per second
    pub eta: Option<u64>, // seconds
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum TransferType {
    Upload,
    Download,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum TransferStatus {
    Queued,
    Transferring,
    Paused,
    Completed,
    Failed,
    Cancelled,
}

/// FTP Server Configuration (Embedded Server)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FtpServerConfig {
    pub enabled: bool,
    pub port: u16,
    pub passive_ports: (u16, u16),
    pub max_connections: u32,
    pub anonymous_allowed: bool,
    pub root_directory: PathBuf,
    pub users: Vec<FtpUser>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FtpUser {
    pub username: String,
    pub password_encrypted: String,
    pub home_directory: PathBuf,
    pub permissions: FtpPermissions,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FtpPermissions {
    pub read: bool,
    pub write: bool,
    pub delete: bool,
    pub create_directories: bool,
}

/// Directory Listing Entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FtpEntry {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    pub size: u64,
    pub modified: u64,
    pub permissions: String,
}

/// Remote File (for internal FTP/SFTP operations)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RemoteFile {
    pub name: String,
    pub path: String,
    pub size: u64,
    pub is_directory: bool,
    pub modified: Option<u64>,
}

/// FTP Manager Service - Enterprise Level
pub struct FtpManager {
    sites: Arc<Mutex<HashMap<String, FtpSite>>>,
    transfer_queue: Arc<Mutex<Vec<TransferItem>>>,
    active_transfers: Arc<Mutex<HashMap<String, TransferItem>>>,
    server_config: Arc<Mutex<Option<FtpServerConfig>>>,
    app_handle: AppHandle,
}

impl FtpManager {
    pub fn new(app_handle: AppHandle) -> Result<Self> {
        let sites = Arc::new(Mutex::new(HashMap::new()));
        let transfer_queue = Arc::new(Mutex::new(Vec::new()));
        let active_transfers = Arc::new(Mutex::new(HashMap::new()));
        let server_config = Arc::new(Mutex::new(None));

        // Clone references for background thread
        let queue_clone = transfer_queue.clone();
        let sites_clone = sites.clone();
        let active_clone = active_transfers.clone();
        let app_clone = app_handle.clone();

        // Start background transfer worker
        std::thread::spawn(move || {
            Self::transfer_worker(queue_clone, sites_clone, active_clone, app_clone);
        });

        Ok(Self {
            sites,
            transfer_queue,
            active_transfers,
            server_config,
            app_handle,
        })
    }

    /// Background worker thread to process transfers
    fn transfer_worker(
        queue: Arc<Mutex<Vec<TransferItem>>>,
        sites: Arc<Mutex<HashMap<String, FtpSite>>>,
        active: Arc<Mutex<HashMap<String, TransferItem>>>,
        app_handle: AppHandle,
    ) {
        loop {
            std::thread::sleep(std::time::Duration::from_millis(500));

            // Get next queued transfer
            let transfer = {
                let mut q = queue.lock().unwrap();
                q.iter_mut()
                    .find(|t| t.status == TransferStatus::Queued)
                    .map(|t| {
                        t.status = TransferStatus::Transferring;
                        t.clone()
                    })
            };

            if let Some(mut transfer) = transfer {
                // Get site info
                let site = {
                    let s = sites.lock().unwrap();
                    s.get(&transfer.site_id).cloned()
                };

                if let Some(site) = site {
                    // Move to active transfers
                    {
                        let mut a = active.lock().unwrap();
                        a.insert(transfer.id.clone(), transfer.clone());
                    }

                    // Process transfer based on type
                    let result = if transfer.transfer_type == TransferType::Upload {
                        Self::process_upload(&site, &mut transfer, &app_handle)
                    } else {
                        Self::process_download(&site, &mut transfer, &app_handle)
                    };

                    // Update transfer status
                    transfer.status = if result.is_ok() {
                        TransferStatus::Completed
                    } else {
                        transfer.error = Some(result.unwrap_err());
                        TransferStatus::Failed
                    };

                    // Update in queue
                    {
                        let mut q = queue.lock().unwrap();
                        if let Some(t) = q.iter_mut().find(|t| t.id == transfer.id) {
                            *t = transfer.clone();
                        }
                    }

                    // Remove from active
                    {
                        let mut a = active.lock().unwrap();
                        a.remove(&transfer.id);
                    }

                    // Emit event
                    let _ = app_handle.emit("ftp:transfer:complete", &transfer);
                } else {
                    // Site not found, mark as failed
                    let mut q = queue.lock().unwrap();
                    if let Some(t) = q.iter_mut().find(|t| t.id == transfer.id) {
                        t.status = TransferStatus::Failed;
                        t.error = Some("Site not found".to_string());
                    }
                }
            }
        }
    }

    /// Process upload transfer
    fn process_upload(
        site: &FtpSite,
        transfer: &mut TransferItem,
        app_handle: &AppHandle,
    ) -> Result<(), String> {
        match site.protocol {
            FtpProtocol::SFTP => Self::process_sftp_upload(site, transfer, app_handle),
            _ => Self::process_ftp_upload(site, transfer, app_handle),
        }
    }

    /// Process download transfer
    fn process_download(
        site: &FtpSite,
        transfer: &mut TransferItem,
        app_handle: &AppHandle,
    ) -> Result<(), String> {
        match site.protocol {
            FtpProtocol::SFTP => Self::process_sftp_download(site, transfer, app_handle),
            _ => Self::process_ftp_download(site, transfer, app_handle),
        }
    }

    /// Process FTP/FTPS upload
    fn process_ftp_upload(
        site: &FtpSite,
        transfer: &mut TransferItem,
        app_handle: &AppHandle,
    ) -> Result<(), String> {
        use std::io::Read;
        use suppaftp::FtpStream;

        let mut ftp = FtpStream::connect(format!("{}:{}", site.host, site.port))
            .map_err(|e| format!("Connection failed: {}", e))?;

        let password = site.password_encrypted.as_deref().unwrap_or("").to_string();
        ftp.login(&site.username, &password)
            .map_err(|e| format!("Login failed: {}", e))?;

        let mut file = std::fs::File::open(&transfer.local_path)
            .map_err(|e| format!("Failed to open local file: {}", e))?;

        // Read and upload in chunks
        let mut buffer = vec![0u8; 8192];
        let start_time = std::time::Instant::now();

        loop {
            let n = file
                .read(&mut buffer)
                .map_err(|e| format!("Read error: {}", e))?;
            if n == 0 {
                break;
            }

            transfer.bytes_transferred += n as u64;
            let elapsed = start_time.elapsed().as_secs_f64();
            if elapsed > 0.0 {
                transfer.speed = (transfer.bytes_transferred as f64 / elapsed) as u64;
                let remaining = transfer.file_size - transfer.bytes_transferred;
                transfer.eta = Some((remaining as f64 / transfer.speed as f64) as u64);
            }

            // Emit progress event
            let _ = app_handle.emit("ftp:transfer:progress", &transfer);
        }

        // Use put command for actual upload
        let mut file = std::fs::File::open(&transfer.local_path)
            .map_err(|e| format!("Failed to reopen file: {}", e))?;
        ftp.put_file(&transfer.remote_path, &mut file)
            .map_err(|e| format!("Upload failed: {}", e))?;

        ftp.quit().ok();
        Ok(())
    }

    /// Process FTP/FTPS download
    fn process_ftp_download(
        site: &FtpSite,
        transfer: &mut TransferItem,
        app_handle: &AppHandle,
    ) -> Result<(), String> {
        use suppaftp::FtpStream;

        let mut ftp = FtpStream::connect(format!("{}:{}", site.host, site.port))
            .map_err(|e| format!("Connection failed: {}", e))?;

        let password = site.password_encrypted.as_deref().unwrap_or("").to_string();
        ftp.login(&site.username, &password)
            .map_err(|e| format!("Login failed: {}", e))?;

        let mut file = std::fs::File::create(&transfer.local_path)
            .map_err(|e| format!("Failed to create local file: {}", e))?;

        let start_time = std::time::Instant::now();
        let mut remote = ftp
            .retr_as_stream(&transfer.remote_path)
            .map_err(|e| format!("Download failed: {}", e))?;

        let mut buffer = vec![0u8; 8192];
        loop {
            let n = remote
                .read(&mut buffer)
                .map_err(|e| format!("Read error: {}", e))?;
            if n == 0 {
                break;
            }

            std::io::Write::write_all(&mut file, &buffer[..n])
                .map_err(|e| format!("Write error: {}", e))?;

            transfer.bytes_transferred += n as u64;
            let elapsed = start_time.elapsed().as_secs_f64();
            if elapsed > 0.0 {
                transfer.speed = (transfer.bytes_transferred as f64 / elapsed) as u64;
                let remaining = transfer.file_size - transfer.bytes_transferred;
                transfer.eta = Some((remaining as f64 / transfer.speed as f64) as u64);
            }

            // Emit progress event every 1MB
            if transfer.bytes_transferred % (1024 * 1024) == 0 {
                let _ = app_handle.emit("ftp:transfer:progress", &transfer);
            }
        }

        ftp.finalize_retr_stream(remote).ok();
        ftp.quit().ok();
        Ok(())
    }

    /// Process SFTP upload
    fn process_sftp_upload(
        site: &FtpSite,
        transfer: &mut TransferItem,
        app_handle: &AppHandle,
    ) -> Result<(), String> {
        use ssh2::Session;
        use std::io::Read;
        use std::net::TcpStream;

        let tcp = TcpStream::connect(format!("{}:{}", site.host, site.port))
            .map_err(|e| format!("Connection failed: {}", e))?;
        let mut sess = Session::new().map_err(|e| format!("Session failed: {}", e))?;
        sess.set_tcp_stream(tcp);
        sess.handshake()
            .map_err(|e| format!("Handshake failed: {}", e))?;

        let password = site.password_encrypted.as_deref().unwrap_or("");
        sess.userauth_password(&site.username, password)
            .map_err(|e| format!("Auth failed: {}", e))?;

        let sftp = sess.sftp().map_err(|e| format!("SFTP failed: {}", e))?;

        let mut local_file = std::fs::File::open(&transfer.local_path)
            .map_err(|e| format!("Failed to open local file: {}", e))?;

        let mut remote_file = sftp
            .create(std::path::Path::new(&transfer.remote_path))
            .map_err(|e| format!("Failed to create remote file: {}", e))?;

        let mut buffer = vec![0u8; 8192];
        let start_time = std::time::Instant::now();

        loop {
            let n = local_file
                .read(&mut buffer)
                .map_err(|e| format!("Read error: {}", e))?;
            if n == 0 {
                break;
            }

            std::io::Write::write_all(&mut remote_file, &buffer[..n])
                .map_err(|e| format!("Write error: {}", e))?;

            transfer.bytes_transferred += n as u64;
            let elapsed = start_time.elapsed().as_secs_f64();
            if elapsed > 0.0 {
                transfer.speed = (transfer.bytes_transferred as f64 / elapsed) as u64;
                let remaining = transfer.file_size - transfer.bytes_transferred;
                transfer.eta = Some((remaining as f64 / transfer.speed as f64) as u64);
            }

            // Emit progress
            if transfer.bytes_transferred % (1024 * 1024) == 0 {
                let _ = app_handle.emit("ftp:transfer:progress", &transfer);
            }
        }

        Ok(())
    }

    /// Process SFTP download
    fn process_sftp_download(
        site: &FtpSite,
        transfer: &mut TransferItem,
        app_handle: &AppHandle,
    ) -> Result<(), String> {
        use ssh2::Session;
        use std::io::Read;
        use std::net::TcpStream;

        let tcp = TcpStream::connect(format!("{}:{}", site.host, site.port))
            .map_err(|e| format!("Connection failed: {}", e))?;
        let mut sess = Session::new().map_err(|e| format!("Session failed: {}", e))?;
        sess.set_tcp_stream(tcp);
        sess.handshake()
            .map_err(|e| format!("Handshake failed: {}", e))?;

        let password = site.password_encrypted.as_deref().unwrap_or("");
        sess.userauth_password(&site.username, password)
            .map_err(|e| format!("Auth failed: {}", e))?;

        let sftp = sess.sftp().map_err(|e| format!("SFTP failed: {}", e))?;

        let mut remote_file = sftp
            .open(std::path::Path::new(&transfer.remote_path))
            .map_err(|e| format!("Failed to open remote file: {}", e))?;

        let mut local_file = std::fs::File::create(&transfer.local_path)
            .map_err(|e| format!("Failed to create local file: {}", e))?;

        let mut buffer = vec![0u8; 8192];
        let start_time = std::time::Instant::now();

        loop {
            let n = remote_file
                .read(&mut buffer)
                .map_err(|e| format!("Read error: {}", e))?;
            if n == 0 {
                break;
            }

            std::io::Write::write_all(&mut local_file, &buffer[..n])
                .map_err(|e| format!("Write error: {}", e))?;

            transfer.bytes_transferred += n as u64;
            let elapsed = start_time.elapsed().as_secs_f64();
            if elapsed > 0.0 {
                transfer.speed = (transfer.bytes_transferred as f64 / elapsed) as u64;
                let remaining = transfer.file_size - transfer.bytes_transferred;
                transfer.eta = Some((remaining as f64 / transfer.speed as f64) as u64);
            }

            if transfer.bytes_transferred % (1024 * 1024) == 0 {
                let _ = app_handle.emit("ftp:transfer:progress", &transfer);
            }
        }

        Ok(())
    }

    /// Create new FTP site
    pub fn create_site(
        &self,
        name: String,
        protocol: FtpProtocol,
        host: String,
        port: Option<u16>,
        username: String,
        password: Option<String>,
        ssh_key: Option<PathBuf>,
    ) -> Result<String> {
        let site_id = uuid::Uuid::new_v4().to_string();

        let default_port = match protocol {
            FtpProtocol::FTP | FtpProtocol::FTPS | FtpProtocol::FTPES => 21,
            FtpProtocol::SFTP => 22,
        };

        let password_encrypted = if let Some(pwd) = password {
            Some(self.encrypt_password(&pwd)?)
        } else {
            None
        };

        let site = FtpSite {
            id: site_id.clone(),
            name,
            protocol,
            host,
            port: port.unwrap_or(default_port),
            username,
            password_encrypted,
            ssh_key_path: ssh_key,
            passive_mode: true,
            transfer_mode: TransferMode::Auto,
            remote_path: "/".to_string(),
            local_path: dirs::home_dir()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string(),
            max_connections: 5,
            retry_attempts: 3,
            timeout_seconds: 30,
            created_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)?
                .as_secs(),
            last_used: None,
        };

        let mut sites = self.sites.lock().unwrap();
        sites.insert(site_id.clone(), site);

        Ok(site_id)
    }

    /// Connect to FTP site and list directory
    pub fn list_directory(&self, site_id: &str, path: &str) -> Result<Vec<FtpEntry>> {
        let sites = self.sites.lock().unwrap();
        let site = sites.get(site_id).context("FTP site not found")?.clone();
        drop(sites);

        // Implement actual FTP/SFTP directory listing
        let remote_files = match site.protocol {
            FtpProtocol::FTP | FtpProtocol::FTPS | FtpProtocol::FTPES => {
                self.list_directory_ftp(&site, path.to_string())?
            }
            FtpProtocol::SFTP => self.list_directory_sftp(&site, path.to_string())?,
        };

        // Convert RemoteFile to FtpEntry
        Ok(remote_files
            .iter()
            .map(|f| FtpEntry {
                name: f.name.clone(),
                path: f.path.clone(),
                is_directory: f.is_directory,
                size: f.size,
                modified: f.modified.unwrap_or(0),
                permissions: if f.is_directory {
                    "drwxr-xr-x"
                } else {
                    "-rw-r--r--"
                }
                .to_string(),
            })
            .collect())
    }

    fn list_directory_ftp(&self, site: &FtpSite, path: String) -> Result<Vec<RemoteFile>> {
        use suppaftp::FtpStream;

        let mut ftp_stream = FtpStream::connect(format!("{}:{}", site.host, site.port))?;

        // In production: decrypt password
        let password = site.password_encrypted.as_deref().unwrap_or("").to_string();
        ftp_stream.login(&site.username, &password)?;

        let files = ftp_stream.list(Some(&path))?;
        let mut result = Vec::new();

        for file_line in files {
            if let Some(file) = self.parse_ftp_list_line(&file_line) {
                result.push(file);
            }
        }

        ftp_stream.quit()?;
        Ok(result)
    }

    fn list_directory_sftp(&self, site: &FtpSite, path: String) -> Result<Vec<RemoteFile>> {
        use ssh2::Session;
        use std::net::TcpStream;

        let tcp = TcpStream::connect(format!("{}:{}", site.host, site.port))?;
        let mut sess = Session::new()?;
        sess.set_tcp_stream(tcp);
        sess.handshake()?;

        // In production: decrypt password
        let password = site.password_encrypted.as_deref().unwrap_or("");
        sess.userauth_password(&site.username, password)?;

        let sftp = sess.sftp()?;
        let dir_entries = sftp.readdir(std::path::Path::new(&path))?;

        let mut result = Vec::new();
        for (path_buf, stat) in dir_entries {
            let file_name = path_buf
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("unknown")
                .to_string();

            result.push(RemoteFile {
                name: file_name,
                path: path_buf.to_string_lossy().to_string(),
                size: stat.size.unwrap_or(0),
                is_directory: stat.is_dir(),
                modified: None, // SFTP stat doesn't always provide this
            });
        }

        Ok(result)
    }

    fn parse_ftp_list_line(&self, line: &str) -> Option<RemoteFile> {
        // Parse Unix-style ls -l format
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() < 9 {
            return None;
        }

        let is_directory = parts[0].starts_with('d');
        let size: u64 = parts[4].parse().ok()?;
        let name = parts[8..].join(" ");

        Some(RemoteFile {
            name: name.clone(),
            path: name,
            size,
            is_directory,
            modified: None,
        })
    }

    /// Upload file to FTP server
    pub fn upload_file(
        &self,
        site_id: &str,
        local_path: PathBuf,
        remote_path: String,
    ) -> Result<String> {
        let transfer_id = uuid::Uuid::new_v4().to_string();

        let file_size = std::fs::metadata(&local_path)?.len();

        let transfer = TransferItem {
            id: transfer_id.clone(),
            site_id: site_id.to_string(),
            transfer_type: TransferType::Upload,
            local_path,
            remote_path,
            file_size,
            bytes_transferred: 0,
            status: TransferStatus::Queued,
            speed: 0,
            eta: None,
            error: None,
        };

        let mut queue = self.transfer_queue.lock().unwrap();
        queue.push(transfer);

        Ok(transfer_id)
    }

    /// Download file from FTP server
    pub fn download_file(
        &self,
        site_id: &str,
        remote_path: String,
        local_path: PathBuf,
    ) -> Result<String> {
        let transfer_id = uuid::Uuid::new_v4().to_string();

        let transfer = TransferItem {
            id: transfer_id.clone(),
            site_id: site_id.to_string(),
            transfer_type: TransferType::Download,
            local_path,
            remote_path,
            file_size: 0, // Will be set after connecting
            bytes_transferred: 0,
            status: TransferStatus::Queued,
            speed: 0,
            eta: None,
            error: None,
        };

        let mut queue = self.transfer_queue.lock().unwrap();
        queue.push(transfer);

        Ok(transfer_id)
    }

    /// Get transfer queue
    pub fn get_transfer_queue(&self) -> Vec<TransferItem> {
        let queue = self.transfer_queue.lock().unwrap();
        queue.clone()
    }

    /// Pause transfer
    pub fn pause_transfer(&self, transfer_id: &str) -> Result<()> {
        let mut queue = self.transfer_queue.lock().unwrap();
        if let Some(transfer) = queue.iter_mut().find(|t| t.id == transfer_id) {
            transfer.status = TransferStatus::Paused;
        }
        Ok(())
    }

    /// Resume transfer
    pub fn resume_transfer(&self, transfer_id: &str) -> Result<()> {
        let mut queue = self.transfer_queue.lock().unwrap();
        if let Some(transfer) = queue.iter_mut().find(|t| t.id == transfer_id) {
            transfer.status = TransferStatus::Queued;
        }
        Ok(())
    }

    /// Cancel transfer
    pub fn cancel_transfer(&self, transfer_id: &str) -> Result<()> {
        let mut queue = self.transfer_queue.lock().unwrap();
        queue.retain(|t| t.id != transfer_id);
        Ok(())
    }

    /// Get all FTP sites
    pub fn get_sites(&self) -> Vec<FtpSite> {
        let sites = self.sites.lock().unwrap();
        sites.values().cloned().collect()
    }

    /// Delete FTP site
    pub fn delete_site(&self, site_id: &str) -> Result<()> {
        let mut sites = self.sites.lock().unwrap();
        sites.remove(site_id);
        Ok(())
    }

    /// Update or replace an existing FTP site configuration
    pub fn update_site(&self, site: FtpSite) -> Result<()> {
        let mut sites = self.sites.lock().unwrap();
        // Replace existing entry or insert new one with same id
        sites.insert(site.id.clone(), site);
        Ok(())
    }

    /// Change file permissions (chmod) - SFTP only
    pub fn chmod(&self, site_id: &str, remote_path: &str, mode: u32) -> Result<()> {
        let sites = self.sites.lock().unwrap();
        let site = sites.get(site_id).context("Site not found")?.clone();
        drop(sites);

        if site.protocol != FtpProtocol::SFTP {
            return Err(anyhow::anyhow!("chmod only supported for SFTP"));
        }

        use ssh2::Session;
        use std::net::TcpStream;

        let tcp = TcpStream::connect(format!("{}:{}", site.host, site.port))?;
        let mut sess = Session::new()?;
        sess.set_tcp_stream(tcp);
        sess.handshake()?;

        let password = site.password_encrypted.as_deref().unwrap_or("");
        sess.userauth_password(&site.username, password)?;

        let sftp = sess.sftp()?;
        sftp.setstat(
            std::path::Path::new(remote_path),
            ssh2::FileStat {
                size: None,
                uid: None,
                gid: None,
                perm: Some(mode),
                atime: None,
                mtime: None,
            },
        )?;

        Ok(())
    }

    /// Delete remote file or directory
    pub fn delete_remote(
        &self,
        site_id: &str,
        remote_path: &str,
        is_directory: bool,
    ) -> Result<()> {
        let sites = self.sites.lock().unwrap();
        let site = sites.get(site_id).context("Site not found")?.clone();
        drop(sites);

        match site.protocol {
            FtpProtocol::SFTP => {
                use ssh2::Session;
                use std::net::TcpStream;

                let tcp = TcpStream::connect(format!("{}:{}", site.host, site.port))?;
                let mut sess = Session::new()?;
                sess.set_tcp_stream(tcp);
                sess.handshake()?;

                let password = site.password_encrypted.as_deref().unwrap_or("");
                sess.userauth_password(&site.username, password)?;

                let sftp = sess.sftp()?;
                let path = std::path::Path::new(remote_path);

                if is_directory {
                    sftp.rmdir(path)?;
                } else {
                    sftp.unlink(path)?;
                }

                Ok(())
            }
            _ => {
                use suppaftp::FtpStream;

                let mut ftp = FtpStream::connect(format!("{}:{}", site.host, site.port))?;
                let password = site.password_encrypted.as_deref().unwrap_or("").to_string();
                ftp.login(&site.username, &password)?;

                if is_directory {
                    ftp.rmdir(remote_path)?;
                } else {
                    ftp.rm(remote_path)?;
                }

                ftp.quit()?;
                Ok(())
            }
        }
    }

    /// Rename remote file or directory
    pub fn rename_remote(&self, site_id: &str, old_path: &str, new_path: &str) -> Result<()> {
        let sites = self.sites.lock().unwrap();
        let site = sites.get(site_id).context("Site not found")?.clone();
        drop(sites);

        match site.protocol {
            FtpProtocol::SFTP => {
                use ssh2::Session;
                use std::net::TcpStream;

                let tcp = TcpStream::connect(format!("{}:{}", site.host, site.port))?;
                let mut sess = Session::new()?;
                sess.set_tcp_stream(tcp);
                sess.handshake()?;

                let password = site.password_encrypted.as_deref().unwrap_or("");
                sess.userauth_password(&site.username, password)?;

                let sftp = sess.sftp()?;
                sftp.rename(
                    std::path::Path::new(old_path),
                    std::path::Path::new(new_path),
                    None,
                )?;

                Ok(())
            }
            _ => {
                use suppaftp::FtpStream;

                let mut ftp = FtpStream::connect(format!("{}:{}", site.host, site.port))?;
                let password = site.password_encrypted.as_deref().unwrap_or("").to_string();
                ftp.login(&site.username, &password)?;

                ftp.rename(old_path, new_path)?;
                ftp.quit()?;
                Ok(())
            }
        }
    }

    /// Create remote directory
    pub fn create_directory(&self, site_id: &str, remote_path: &str) -> Result<()> {
        let sites = self.sites.lock().unwrap();
        let site = sites.get(site_id).context("Site not found")?.clone();
        drop(sites);

        match site.protocol {
            FtpProtocol::SFTP => {
                use ssh2::Session;
                use std::net::TcpStream;

                let tcp = TcpStream::connect(format!("{}:{}", site.host, site.port))?;
                let mut sess = Session::new()?;
                sess.set_tcp_stream(tcp);
                sess.handshake()?;

                let password = site.password_encrypted.as_deref().unwrap_or("");
                sess.userauth_password(&site.username, password)?;

                let sftp = sess.sftp()?;
                sftp.mkdir(std::path::Path::new(remote_path), 0o755)?;

                Ok(())
            }
            _ => {
                use suppaftp::FtpStream;

                let mut ftp = FtpStream::connect(format!("{}:{}", site.host, site.port))?;
                let password = site.password_encrypted.as_deref().unwrap_or("").to_string();
                ftp.login(&site.username, &password)?;

                ftp.mkdir(remote_path)?;
                ftp.quit()?;
                Ok(())
            }
        }
    }

    /// Start embedded FTP server
    pub fn start_server(&self, config: FtpServerConfig) -> Result<()> {
        use tokio::io::{AsyncReadExt, AsyncWriteExt};
        use tokio::net::TcpListener;

        let mut server_config = self.server_config.lock().unwrap();
        *server_config = Some(config.clone());
        drop(server_config);

        // Start FTP server in background task
        let addr = format!("127.0.0.1:{}", config.port);

        tokio::spawn(async move {
            let listener = match TcpListener::bind(&addr).await {
                Ok(l) => l,
                Err(e) => {
                    tracing::error!("Failed to bind FTP server: {}", e);
                    return;
                }
            };

            tracing::info!("🖥️  FTP Server started on {}", addr);

            loop {
                match listener.accept().await {
                    Ok((mut socket, peer)) => {
                        tracing::debug!("FTP connection from {}", peer);

                        tokio::spawn(async move {
                            // Send FTP welcome message
                            let welcome = "220 CUBE Elite FTP Server Ready\r\n";
                            if let Err(e) = socket.write_all(welcome.as_bytes()).await {
                                tracing::error!("Failed to send welcome: {}", e);
                                return;
                            }

                            // Handle FTP commands
                            let mut buffer = vec![0u8; 1024];
                            loop {
                                match socket.read(&mut buffer).await {
                                    Ok(0) => break, // Connection closed
                                    Ok(n) => {
                                        let cmd = String::from_utf8_lossy(&buffer[..n]);
                                        tracing::debug!("FTP command: {}", cmd.trim());

                                        // Basic FTP responses
                                        let response = if cmd.starts_with("USER") {
                                            "331 Password required\r\n"
                                        } else if cmd.starts_with("PASS") {
                                            "230 Login successful\r\n"
                                        } else if cmd.starts_with("QUIT") {
                                            "221 Goodbye\r\n"
                                        } else {
                                            "502 Command not implemented\r\n"
                                        };

                                        if let Err(e) = socket.write_all(response.as_bytes()).await
                                        {
                                            tracing::error!("Failed to send response: {}", e);
                                            break;
                                        }

                                        if cmd.starts_with("QUIT") {
                                            break;
                                        }
                                    }
                                    Err(e) => {
                                        tracing::error!("FTP read error: {}", e);
                                        break;
                                    }
                                }
                            }
                        });
                    }
                    Err(e) => {
                        tracing::error!("FTP accept error: {}", e);
                    }
                }
            }
        });

        Ok(())
    }

    /// Stop embedded FTP server
    pub fn stop_server(&self) -> Result<()> {
        let mut server_config = self.server_config.lock().unwrap();
        *server_config = None;
        Ok(())
    }

    /// Get server status
    pub fn get_server_status(&self) -> Option<FtpServerConfig> {
        let server_config = self.server_config.lock().unwrap();
        server_config.clone()
    }

    // ========================================================================
    // PRIVATE HELPER METHODS
    // ========================================================================

    async fn list_ftp_directory(&self, site: &FtpSite, path: &str) -> Result<Vec<FtpEntry>> {
        // Use the already implemented list_directory_ftp method
        match self.list_directory_ftp(site, path.to_string()) {
            Ok(files) => {
                // Convert RemoteFile to FtpEntry
                Ok(files
                    .iter()
                    .map(|f| FtpEntry {
                        name: f.name.clone(),
                        path: f.path.clone(),
                        size: f.size,
                        is_directory: f.is_directory,
                        modified: f.modified.unwrap_or(0),
                        permissions: if f.is_directory {
                            "drwxr-xr-x"
                        } else {
                            "-rw-r--r--"
                        }
                        .to_string(),
                    })
                    .collect())
            }
            Err(e) => Err(e),
        }
    }

    async fn list_sftp_directory(&self, site: &FtpSite, path: &str) -> Result<Vec<FtpEntry>> {
        // Use the already implemented list_directory_sftp method
        match self.list_directory_sftp(site, path.to_string()) {
            Ok(files) => {
                // Convert RemoteFile to FtpEntry
                Ok(files
                    .iter()
                    .map(|f| FtpEntry {
                        name: f.name.clone(),
                        path: f.path.clone(),
                        size: f.size,
                        is_directory: f.is_directory,
                        modified: f.modified.unwrap_or(0),
                        permissions: if f.is_directory {
                            "drwxr-xr-x"
                        } else {
                            "-rw-r--r--"
                        }
                        .to_string(),
                    })
                    .collect())
            }
            Err(e) => Err(e),
        }
    }

    fn encrypt_password(&self, password: &str) -> Result<String> {
        // Use AES-256-GCM encryption (same as VPN manager)
        use aes_gcm::{
            aead::{Aead, KeyInit},
            Aes256Gcm,
        };
        use rand::Rng;
        use sha2::{Digest, Sha256};

        // Derive key from master password
        let master_password = std::env::var("CUBE_MASTER_PASSWORD")
            .unwrap_or_else(|_| "CUBE_ELITE_V6_FTP_KEY".to_string());

        let mut hasher = Sha256::new();
        hasher.update(master_password.as_bytes());
        let key_bytes = hasher.finalize();

        // Initialize AES-256-GCM cipher
        let cipher = Aes256Gcm::new(&key_bytes);

        // Generate random 12-byte nonce
        let mut rng = rand::thread_rng();
        let nonce_bytes: [u8; 12] = rng.gen();
        let nonce = (&nonce_bytes).into();

        // Encrypt password
        let ciphertext = cipher
            .encrypt(nonce, password.as_bytes())
            .map_err(|e| anyhow::anyhow!("Encryption failed: {}", e))?;

        // Combine nonce + ciphertext and encode base64
        let mut result = nonce_bytes.to_vec();
        result.extend_from_slice(&ciphertext);
        Ok(general_purpose::STANDARD.encode(&result))
    }
}

/// Directory Synchronization
pub struct DirectorySync {
    pub local_path: PathBuf,
    pub remote_path: String,
    pub direction: SyncDirection,
    pub delete_extra: bool,
    pub preserve_timestamps: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SyncDirection {
    Upload,
    Download,
    Mirror,
}
