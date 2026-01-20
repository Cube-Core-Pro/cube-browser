// CUBE Nexum - Downloads Manager Service
// Superior to Chrome, Firefox, Safari, Brave download managers
// Advanced download management with categories, scheduling, and bandwidth control

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

// ==================== Enums ====================

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DownloadStatus {
    Pending,
    Downloading,
    Paused,
    Completed,
    Failed,
    Cancelled,
    Queued,
    Verifying,
    Extracting,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DownloadPriority {
    Low,
    Normal,
    High,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum FileCategory {
    Document,
    Image,
    Video,
    Audio,
    Archive,
    Executable,
    Code,
    Font,
    Ebook,
    Other,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DownloadAction {
    Open,
    OpenFolder,
    Delete,
    Retry,
    CopyLink,
    Rename,
    MoveToCategory,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SpeedUnit {
    BPS,
    KBPS,
    MBPS,
    Auto,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ScheduleType {
    Immediate,
    Scheduled,
    WhenIdle,
    OnWifi,
    OffPeakHours,
}

// ==================== Structs ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadSettings {
    pub enabled: bool,
    pub default_directory: String,
    pub ask_where_to_save: bool,
    pub show_download_panel: bool,
    pub auto_open_when_done: bool,
    pub notify_on_complete: bool,
    pub sound_on_complete: bool,
    pub max_concurrent_downloads: u32,
    pub max_connections_per_download: u32,
    pub bandwidth_limit_enabled: bool,
    pub bandwidth_limit_kbps: u64,
    pub auto_resume_on_startup: bool,
    pub virus_scan_enabled: bool,
    pub auto_extract_archives: bool,
    pub organize_by_type: bool,
    pub schedule_enabled: bool,
    pub off_peak_start_hour: u8,
    pub off_peak_end_hour: u8,
    pub category_folders: HashMap<String, String>,
    pub blocked_extensions: Vec<String>,
    pub blocked_domains: Vec<String>,
    pub download_history_days: u32,
}

impl Default for DownloadSettings {
    fn default() -> Self {
        let mut category_folders = HashMap::new();
        category_folders.insert("Document".to_string(), "Documents".to_string());
        category_folders.insert("Image".to_string(), "Images".to_string());
        category_folders.insert("Video".to_string(), "Videos".to_string());
        category_folders.insert("Audio".to_string(), "Music".to_string());
        category_folders.insert("Archive".to_string(), "Archives".to_string());
        category_folders.insert("Executable".to_string(), "Applications".to_string());
        category_folders.insert("Code".to_string(), "Code".to_string());

        Self {
            enabled: true,
            default_directory: "~/Downloads".to_string(),
            ask_where_to_save: false,
            show_download_panel: true,
            auto_open_when_done: false,
            notify_on_complete: true,
            sound_on_complete: true,
            max_concurrent_downloads: 5,
            max_connections_per_download: 8,
            bandwidth_limit_enabled: false,
            bandwidth_limit_kbps: 0,
            auto_resume_on_startup: true,
            virus_scan_enabled: true,
            auto_extract_archives: false,
            organize_by_type: true,
            schedule_enabled: false,
            off_peak_start_hour: 23,
            off_peak_end_hour: 7,
            category_folders,
            blocked_extensions: vec!["exe".to_string(), "bat".to_string(), "cmd".to_string()],
            blocked_domains: Vec::new(),
            download_history_days: 30,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadProgress {
    pub downloaded_bytes: u64,
    pub total_bytes: u64,
    pub speed_bps: u64,
    pub eta_seconds: u64,
    pub percentage: f64,
    pub connections_active: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Download {
    pub id: String,
    pub url: String,
    pub filename: String,
    pub file_path: String,
    pub mime_type: String,
    pub category: FileCategory,
    pub status: DownloadStatus,
    pub priority: DownloadPriority,
    pub total_bytes: u64,
    pub downloaded_bytes: u64,
    pub speed_bps: u64,
    pub eta_seconds: u64,
    pub connections: u32,
    pub resumable: bool,
    pub created_at: u64,
    pub started_at: Option<u64>,
    pub completed_at: Option<u64>,
    pub error_message: Option<String>,
    pub retry_count: u32,
    pub max_retries: u32,
    pub referrer: Option<String>,
    pub source_tab_id: Option<String>,
    pub tags: Vec<String>,
    pub checksum: Option<String>,
    pub checksum_type: Option<String>,
    pub schedule_type: ScheduleType,
    pub scheduled_time: Option<u64>,
    pub auto_extract: bool,
    pub virus_scanned: bool,
    pub virus_clean: Option<bool>,
}

impl Download {
    pub fn new(url: String, filename: String, file_path: String) -> Self {
        let id = format!("dl_{}", SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis());
        
        let category = Self::detect_category(&filename);
        let mime_type = Self::detect_mime_type(&filename);
        
        Self {
            id,
            url,
            filename,
            file_path,
            mime_type,
            category,
            status: DownloadStatus::Pending,
            priority: DownloadPriority::Normal,
            total_bytes: 0,
            downloaded_bytes: 0,
            speed_bps: 0,
            eta_seconds: 0,
            connections: 1,
            resumable: false,
            created_at: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            started_at: None,
            completed_at: None,
            error_message: None,
            retry_count: 0,
            max_retries: 3,
            referrer: None,
            source_tab_id: None,
            tags: Vec::new(),
            checksum: None,
            checksum_type: None,
            schedule_type: ScheduleType::Immediate,
            scheduled_time: None,
            auto_extract: false,
            virus_scanned: false,
            virus_clean: None,
        }
    }

    fn detect_category(filename: &str) -> FileCategory {
        let ext = filename.rsplit('.').next().unwrap_or("").to_lowercase();
        match ext.as_str() {
            "pdf" | "doc" | "docx" | "xls" | "xlsx" | "ppt" | "pptx" | "txt" | "rtf" | "odt" | "ods" => FileCategory::Document,
            "jpg" | "jpeg" | "png" | "gif" | "webp" | "svg" | "bmp" | "ico" | "tiff" | "raw" => FileCategory::Image,
            "mp4" | "mkv" | "avi" | "mov" | "wmv" | "flv" | "webm" | "m4v" | "3gp" => FileCategory::Video,
            "mp3" | "wav" | "flac" | "aac" | "ogg" | "wma" | "m4a" | "opus" => FileCategory::Audio,
            "zip" | "rar" | "7z" | "tar" | "gz" | "bz2" | "xz" | "iso" | "dmg" => FileCategory::Archive,
            "exe" | "msi" | "app" | "deb" | "rpm" | "apk" | "appimage" => FileCategory::Executable,
            "js" | "ts" | "py" | "rs" | "go" | "java" | "cpp" | "c" | "h" | "css" | "html" | "json" | "xml" | "yaml" | "toml" => FileCategory::Code,
            "ttf" | "otf" | "woff" | "woff2" | "eot" => FileCategory::Font,
            "epub" | "mobi" | "azw" | "azw3" | "fb2" => FileCategory::Ebook,
            _ => FileCategory::Other,
        }
    }

    fn detect_mime_type(filename: &str) -> String {
        let ext = filename.rsplit('.').next().unwrap_or("").to_lowercase();
        match ext.as_str() {
            "pdf" => "application/pdf",
            "zip" => "application/zip",
            "json" => "application/json",
            "xml" => "application/xml",
            "jpg" | "jpeg" => "image/jpeg",
            "png" => "image/png",
            "gif" => "image/gif",
            "webp" => "image/webp",
            "svg" => "image/svg+xml",
            "mp4" => "video/mp4",
            "webm" => "video/webm",
            "mp3" => "audio/mpeg",
            "wav" => "audio/wav",
            "html" | "htm" => "text/html",
            "css" => "text/css",
            "js" => "application/javascript",
            "txt" => "text/plain",
            _ => "application/octet-stream",
        }.to_string()
    }

    pub fn percentage(&self) -> f64 {
        if self.total_bytes == 0 {
            0.0
        } else {
            (self.downloaded_bytes as f64 / self.total_bytes as f64) * 100.0
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadQueue {
    pub id: String,
    pub name: String,
    pub download_ids: Vec<String>,
    pub max_concurrent: u32,
    pub bandwidth_limit_kbps: Option<u64>,
    pub schedule_type: ScheduleType,
    pub created_at: u64,
    pub paused: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadStats {
    pub total_downloads: u64,
    pub completed_downloads: u64,
    pub failed_downloads: u64,
    pub total_bytes_downloaded: u64,
    pub average_speed_bps: u64,
    pub downloads_today: u64,
    pub bytes_today: u64,
    pub downloads_this_week: u64,
    pub bytes_this_week: u64,
    pub category_stats: HashMap<String, u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BandwidthSchedule {
    pub hour: u8,
    pub limit_kbps: u64,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadFilter {
    pub status: Option<DownloadStatus>,
    pub category: Option<FileCategory>,
    pub priority: Option<DownloadPriority>,
    pub search_query: Option<String>,
    pub date_from: Option<u64>,
    pub date_to: Option<u64>,
    pub min_size: Option<u64>,
    pub max_size: Option<u64>,
    pub tags: Vec<String>,
}

// ==================== Service ====================

pub struct BrowserDownloadsService {
    settings: Mutex<DownloadSettings>,
    downloads: Mutex<HashMap<String, Download>>,
    queues: Mutex<HashMap<String, DownloadQueue>>,
    bandwidth_schedule: Mutex<Vec<BandwidthSchedule>>,
    stats: Mutex<DownloadStats>,
    active_downloads: Mutex<Vec<String>>,
}

impl BrowserDownloadsService {
    pub fn new() -> Self {
        Self {
            settings: Mutex::new(DownloadSettings::default()),
            downloads: Mutex::new(HashMap::new()),
            queues: Mutex::new(HashMap::new()),
            bandwidth_schedule: Mutex::new(Vec::new()),
            stats: Mutex::new(DownloadStats {
                total_downloads: 0,
                completed_downloads: 0,
                failed_downloads: 0,
                total_bytes_downloaded: 0,
                average_speed_bps: 0,
                downloads_today: 0,
                bytes_today: 0,
                downloads_this_week: 0,
                bytes_this_week: 0,
                category_stats: HashMap::new(),
            }),
            active_downloads: Mutex::new(Vec::new()),
        }
    }

    fn generate_id(&self, prefix: &str) -> String {
        format!("{}_{}", prefix, SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis())
    }

    // ==================== Settings ====================

    pub fn get_settings(&self) -> DownloadSettings {
        self.settings.lock().unwrap().clone()
    }

    pub fn update_settings(&self, settings: DownloadSettings) -> Result<(), String> {
        *self.settings.lock().unwrap() = settings;
        Ok(())
    }

    pub fn set_default_directory(&self, directory: String) -> Result<(), String> {
        self.settings.lock().unwrap().default_directory = directory;
        Ok(())
    }

    pub fn set_max_concurrent(&self, max: u32) -> Result<(), String> {
        if max == 0 || max > 20 {
            return Err("Max concurrent must be between 1 and 20".to_string());
        }
        self.settings.lock().unwrap().max_concurrent_downloads = max;
        Ok(())
    }

    pub fn set_bandwidth_limit(&self, enabled: bool, limit_kbps: u64) -> Result<(), String> {
        let mut settings = self.settings.lock().unwrap();
        settings.bandwidth_limit_enabled = enabled;
        settings.bandwidth_limit_kbps = limit_kbps;
        Ok(())
    }

    pub fn set_category_folder(&self, category: String, folder: String) -> Result<(), String> {
        self.settings.lock().unwrap().category_folders.insert(category, folder);
        Ok(())
    }

    pub fn add_blocked_extension(&self, ext: String) -> Result<(), String> {
        let mut settings = self.settings.lock().unwrap();
        if !settings.blocked_extensions.contains(&ext) {
            settings.blocked_extensions.push(ext);
        }
        Ok(())
    }

    pub fn remove_blocked_extension(&self, ext: String) -> Result<(), String> {
        self.settings.lock().unwrap().blocked_extensions.retain(|e| e != &ext);
        Ok(())
    }

    // ==================== Download Operations ====================

    pub fn create_download(&self, url: String, filename: Option<String>, directory: Option<String>) -> Result<Download, String> {
        let settings = self.settings.lock().unwrap();
        
        // Determine filename
        let final_filename = filename.unwrap_or_else(|| {
            url.rsplit('/').next().unwrap_or("download").to_string()
        });

        // Check blocked extensions
        let ext = final_filename.rsplit('.').next().unwrap_or("").to_lowercase();
        if settings.blocked_extensions.contains(&ext) {
            return Err(format!("Extension '{}' is blocked", ext));
        }

        // Determine directory
        let base_dir = directory.unwrap_or_else(|| settings.default_directory.clone());
        let category = Download::detect_category(&final_filename);
        
        let final_dir = if settings.organize_by_type {
            if let Some(cat_folder) = settings.category_folders.get(&format!("{:?}", category)) {
                format!("{}/{}", base_dir, cat_folder)
            } else {
                base_dir
            }
        } else {
            base_dir
        };

        let file_path = format!("{}/{}", final_dir, final_filename);
        let download = Download::new(url, final_filename, file_path);
        
        drop(settings);
        
        let download_id = download.id.clone();
        self.downloads.lock().unwrap().insert(download_id.clone(), download.clone());
        
        // Update stats
        self.stats.lock().unwrap().total_downloads += 1;
        
        Ok(download)
    }

    pub fn start_download(&self, download_id: &str) -> Result<Download, String> {
        let mut downloads = self.downloads.lock().unwrap();
        let download = downloads.get_mut(download_id)
            .ok_or("Download not found")?;

        if download.status == DownloadStatus::Downloading {
            return Err("Download already in progress".to_string());
        }

        // Check concurrent limit
        let settings = self.settings.lock().unwrap();
        let active = self.active_downloads.lock().unwrap();
        if active.len() >= settings.max_concurrent_downloads as usize {
            download.status = DownloadStatus::Queued;
            return Ok(download.clone());
        }
        drop(settings);
        drop(active);

        download.status = DownloadStatus::Downloading;
        download.started_at = Some(SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs());

        self.active_downloads.lock().unwrap().push(download_id.to_string());

        Ok(download.clone())
    }

    pub fn pause_download(&self, download_id: &str) -> Result<Download, String> {
        let mut downloads = self.downloads.lock().unwrap();
        let download = downloads.get_mut(download_id)
            .ok_or("Download not found")?;

        if download.status != DownloadStatus::Downloading {
            return Err("Download is not in progress".to_string());
        }

        download.status = DownloadStatus::Paused;
        self.active_downloads.lock().unwrap().retain(|id| id != download_id);

        Ok(download.clone())
    }

    pub fn resume_download(&self, download_id: &str) -> Result<Download, String> {
        let mut downloads = self.downloads.lock().unwrap();
        let download = downloads.get_mut(download_id)
            .ok_or("Download not found")?;

        if download.status != DownloadStatus::Paused {
            return Err("Download is not paused".to_string());
        }

        if !download.resumable {
            // Restart from beginning
            download.downloaded_bytes = 0;
        }

        download.status = DownloadStatus::Downloading;
        self.active_downloads.lock().unwrap().push(download_id.to_string());

        Ok(download.clone())
    }

    pub fn cancel_download(&self, download_id: &str) -> Result<(), String> {
        let mut downloads = self.downloads.lock().unwrap();
        let download = downloads.get_mut(download_id)
            .ok_or("Download not found")?;

        download.status = DownloadStatus::Cancelled;
        self.active_downloads.lock().unwrap().retain(|id| id != download_id);

        Ok(())
    }

    pub fn retry_download(&self, download_id: &str) -> Result<Download, String> {
        let mut downloads = self.downloads.lock().unwrap();
        let download = downloads.get_mut(download_id)
            .ok_or("Download not found")?;

        if download.retry_count >= download.max_retries {
            return Err("Max retries exceeded".to_string());
        }

        download.status = DownloadStatus::Pending;
        download.retry_count += 1;
        download.error_message = None;
        download.downloaded_bytes = 0;

        Ok(download.clone())
    }

    pub fn delete_download(&self, download_id: &str, delete_file: bool) -> Result<(), String> {
        let download = self.downloads.lock().unwrap().remove(download_id)
            .ok_or("Download not found")?;

        self.active_downloads.lock().unwrap().retain(|id| id != download_id);

        if delete_file && download.status == DownloadStatus::Completed {
            // In a real implementation, delete the file from disk
            // std::fs::remove_file(&download.file_path).ok();
        }

        Ok(())
    }

    pub fn update_progress(&self, download_id: &str, downloaded: u64, total: u64, speed: u64) -> Result<(), String> {
        let mut downloads = self.downloads.lock().unwrap();
        let download = downloads.get_mut(download_id)
            .ok_or("Download not found")?;

        download.downloaded_bytes = downloaded;
        download.total_bytes = total;
        download.speed_bps = speed;
        
        if speed > 0 {
            download.eta_seconds = (total - downloaded) / speed;
        }

        if downloaded >= total && total > 0 {
            download.status = DownloadStatus::Completed;
            download.completed_at = Some(SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs());
            
            drop(downloads);
            self.active_downloads.lock().unwrap().retain(|id| id != download_id);
            
            // Update stats
            let mut stats = self.stats.lock().unwrap();
            stats.completed_downloads += 1;
            stats.total_bytes_downloaded += total;
            stats.bytes_today += total;
        }

        Ok(())
    }

    pub fn set_download_failed(&self, download_id: &str, error: String) -> Result<(), String> {
        let mut downloads = self.downloads.lock().unwrap();
        let download = downloads.get_mut(download_id)
            .ok_or("Download not found")?;

        download.status = DownloadStatus::Failed;
        download.error_message = Some(error);
        
        drop(downloads);
        self.active_downloads.lock().unwrap().retain(|id| id != download_id);
        self.stats.lock().unwrap().failed_downloads += 1;

        Ok(())
    }

    // ==================== Download Management ====================

    pub fn get_download(&self, download_id: &str) -> Option<Download> {
        self.downloads.lock().unwrap().get(download_id).cloned()
    }

    pub fn get_all_downloads(&self) -> Vec<Download> {
        self.downloads.lock().unwrap().values().cloned().collect()
    }

    pub fn get_active_downloads(&self) -> Vec<Download> {
        let downloads = self.downloads.lock().unwrap();
        let active_ids = self.active_downloads.lock().unwrap();
        
        active_ids.iter()
            .filter_map(|id| downloads.get(id).cloned())
            .collect()
    }

    pub fn get_downloads_by_status(&self, status: DownloadStatus) -> Vec<Download> {
        self.downloads.lock().unwrap()
            .values()
            .filter(|d| d.status == status)
            .cloned()
            .collect()
    }

    pub fn get_downloads_by_category(&self, category: FileCategory) -> Vec<Download> {
        self.downloads.lock().unwrap()
            .values()
            .filter(|d| d.category == category)
            .cloned()
            .collect()
    }

    pub fn filter_downloads(&self, filter: DownloadFilter) -> Vec<Download> {
        self.downloads.lock().unwrap()
            .values()
            .filter(|d| {
                if let Some(ref status) = filter.status {
                    if &d.status != status { return false; }
                }
                if let Some(ref category) = filter.category {
                    if &d.category != category { return false; }
                }
                if let Some(ref priority) = filter.priority {
                    if &d.priority != priority { return false; }
                }
                if let Some(ref query) = filter.search_query {
                    let q = query.to_lowercase();
                    if !d.filename.to_lowercase().contains(&q) && !d.url.to_lowercase().contains(&q) {
                        return false;
                    }
                }
                if let Some(from) = filter.date_from {
                    if d.created_at < from { return false; }
                }
                if let Some(to) = filter.date_to {
                    if d.created_at > to { return false; }
                }
                if let Some(min) = filter.min_size {
                    if d.total_bytes < min { return false; }
                }
                if let Some(max) = filter.max_size {
                    if d.total_bytes > max { return false; }
                }
                true
            })
            .cloned()
            .collect()
    }

    pub fn search_downloads(&self, query: &str) -> Vec<Download> {
        let q = query.to_lowercase();
        self.downloads.lock().unwrap()
            .values()
            .filter(|d| {
                d.filename.to_lowercase().contains(&q) ||
                d.url.to_lowercase().contains(&q) ||
                d.tags.iter().any(|t| t.to_lowercase().contains(&q))
            })
            .cloned()
            .collect()
    }

    // ==================== Priority & Scheduling ====================

    pub fn set_priority(&self, download_id: &str, priority: DownloadPriority) -> Result<(), String> {
        let mut downloads = self.downloads.lock().unwrap();
        let download = downloads.get_mut(download_id)
            .ok_or("Download not found")?;
        download.priority = priority;
        Ok(())
    }

    pub fn schedule_download(&self, download_id: &str, schedule_type: ScheduleType, time: Option<u64>) -> Result<(), String> {
        let mut downloads = self.downloads.lock().unwrap();
        let download = downloads.get_mut(download_id)
            .ok_or("Download not found")?;
        download.schedule_type = schedule_type;
        download.scheduled_time = time;
        Ok(())
    }

    // ==================== Tags ====================

    pub fn add_tag(&self, download_id: &str, tag: String) -> Result<(), String> {
        let mut downloads = self.downloads.lock().unwrap();
        let download = downloads.get_mut(download_id)
            .ok_or("Download not found")?;
        if !download.tags.contains(&tag) {
            download.tags.push(tag);
        }
        Ok(())
    }

    pub fn remove_tag(&self, download_id: &str, tag: &str) -> Result<(), String> {
        let mut downloads = self.downloads.lock().unwrap();
        let download = downloads.get_mut(download_id)
            .ok_or("Download not found")?;
        download.tags.retain(|t| t != tag);
        Ok(())
    }

    // ==================== Queues ====================

    pub fn create_queue(&self, name: String) -> Result<DownloadQueue, String> {
        let queue = DownloadQueue {
            id: self.generate_id("queue"),
            name,
            download_ids: Vec::new(),
            max_concurrent: 3,
            bandwidth_limit_kbps: None,
            schedule_type: ScheduleType::Immediate,
            created_at: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            paused: false,
        };
        
        let queue_id = queue.id.clone();
        self.queues.lock().unwrap().insert(queue_id, queue.clone());
        Ok(queue)
    }

    pub fn add_to_queue(&self, queue_id: &str, download_id: &str) -> Result<(), String> {
        let mut queues = self.queues.lock().unwrap();
        let queue = queues.get_mut(queue_id)
            .ok_or("Queue not found")?;
        
        if !queue.download_ids.contains(&download_id.to_string()) {
            queue.download_ids.push(download_id.to_string());
        }
        Ok(())
    }

    pub fn remove_from_queue(&self, queue_id: &str, download_id: &str) -> Result<(), String> {
        let mut queues = self.queues.lock().unwrap();
        let queue = queues.get_mut(queue_id)
            .ok_or("Queue not found")?;
        queue.download_ids.retain(|id| id != download_id);
        Ok(())
    }

    pub fn get_queue(&self, queue_id: &str) -> Option<DownloadQueue> {
        self.queues.lock().unwrap().get(queue_id).cloned()
    }

    pub fn get_all_queues(&self) -> Vec<DownloadQueue> {
        self.queues.lock().unwrap().values().cloned().collect()
    }

    pub fn delete_queue(&self, queue_id: &str) -> Result<(), String> {
        self.queues.lock().unwrap().remove(queue_id)
            .ok_or("Queue not found")?;
        Ok(())
    }

    pub fn pause_queue(&self, queue_id: &str) -> Result<(), String> {
        let mut queues = self.queues.lock().unwrap();
        let queue = queues.get_mut(queue_id)
            .ok_or("Queue not found")?;
        queue.paused = true;
        Ok(())
    }

    pub fn resume_queue(&self, queue_id: &str) -> Result<(), String> {
        let mut queues = self.queues.lock().unwrap();
        let queue = queues.get_mut(queue_id)
            .ok_or("Queue not found")?;
        queue.paused = false;
        Ok(())
    }

    // ==================== Bandwidth Schedule ====================

    pub fn set_bandwidth_schedule(&self, schedule: Vec<BandwidthSchedule>) -> Result<(), String> {
        *self.bandwidth_schedule.lock().unwrap() = schedule;
        Ok(())
    }

    pub fn get_bandwidth_schedule(&self) -> Vec<BandwidthSchedule> {
        self.bandwidth_schedule.lock().unwrap().clone()
    }

    pub fn get_current_bandwidth_limit(&self) -> Option<u64> {
        let settings = self.settings.lock().unwrap();
        if !settings.bandwidth_limit_enabled {
            return None;
        }

        let schedule = self.bandwidth_schedule.lock().unwrap();
        if schedule.is_empty() {
            return Some(settings.bandwidth_limit_kbps);
        }

        // Get current hour
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        let current_hour = ((now % 86400) / 3600) as u8;

        for entry in schedule.iter() {
            if entry.hour == current_hour && entry.enabled {
                return Some(entry.limit_kbps);
            }
        }

        Some(settings.bandwidth_limit_kbps)
    }

    // ==================== Statistics ====================

    pub fn get_stats(&self) -> DownloadStats {
        self.stats.lock().unwrap().clone()
    }

    pub fn get_total_speed(&self) -> u64 {
        let downloads = self.downloads.lock().unwrap();
        let active_ids = self.active_downloads.lock().unwrap();
        
        active_ids.iter()
            .filter_map(|id| downloads.get(id))
            .map(|d| d.speed_bps)
            .sum()
    }

    pub fn get_category_stats(&self) -> HashMap<String, u64> {
        let downloads = self.downloads.lock().unwrap();
        let mut stats: HashMap<String, u64> = HashMap::new();
        
        for download in downloads.values() {
            let cat = format!("{:?}", download.category);
            *stats.entry(cat).or_insert(0) += 1;
        }
        
        stats
    }

    // ==================== Bulk Operations ====================

    pub fn pause_all(&self) -> Result<u32, String> {
        let active_ids: Vec<String> = self.active_downloads.lock().unwrap().clone();
        let mut count = 0;
        
        for id in active_ids {
            if self.pause_download(&id).is_ok() {
                count += 1;
            }
        }
        
        Ok(count)
    }

    pub fn resume_all(&self) -> Result<u32, String> {
        let downloads = self.downloads.lock().unwrap();
        let paused_ids: Vec<String> = downloads.values()
            .filter(|d| d.status == DownloadStatus::Paused)
            .map(|d| d.id.clone())
            .collect();
        drop(downloads);
        
        let mut count = 0;
        for id in paused_ids {
            if self.resume_download(&id).is_ok() {
                count += 1;
            }
        }
        
        Ok(count)
    }

    pub fn cancel_all(&self) -> Result<u32, String> {
        let active_ids: Vec<String> = self.active_downloads.lock().unwrap().clone();
        let mut count = 0;
        
        for id in active_ids {
            if self.cancel_download(&id).is_ok() {
                count += 1;
            }
        }
        
        Ok(count)
    }

    pub fn clear_completed(&self) -> Result<u32, String> {
        let mut downloads = self.downloads.lock().unwrap();
        let completed_ids: Vec<String> = downloads.values()
            .filter(|d| d.status == DownloadStatus::Completed)
            .map(|d| d.id.clone())
            .collect();
        
        let count = completed_ids.len() as u32;
        for id in completed_ids {
            downloads.remove(&id);
        }
        
        Ok(count)
    }

    pub fn clear_failed(&self) -> Result<u32, String> {
        let mut downloads = self.downloads.lock().unwrap();
        let failed_ids: Vec<String> = downloads.values()
            .filter(|d| d.status == DownloadStatus::Failed)
            .map(|d| d.id.clone())
            .collect();
        
        let count = failed_ids.len() as u32;
        for id in failed_ids {
            downloads.remove(&id);
        }
        
        Ok(count)
    }

    // ==================== File Operations ====================

    pub fn open_file(&self, download_id: &str) -> Result<(), String> {
        let download = self.get_download(download_id)
            .ok_or("Download not found")?;
        
        if download.status != DownloadStatus::Completed {
            return Err("Download not completed".to_string());
        }
        
        // In real implementation: open::that(&download.file_path)
        Ok(())
    }

    pub fn open_folder(&self, download_id: &str) -> Result<(), String> {
        let _download = self.get_download(download_id)
            .ok_or("Download not found")?;
        
        // In real implementation: open containing folder
        // let folder = std::path::Path::new(&download.file_path).parent();
        Ok(())
    }

    pub fn rename_file(&self, download_id: &str, new_name: String) -> Result<(), String> {
        let mut downloads = self.downloads.lock().unwrap();
        let download = downloads.get_mut(download_id)
            .ok_or("Download not found")?;
        
        // Update filename and path
        let old_path = download.file_path.clone();
        let dir = std::path::Path::new(&old_path)
            .parent()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default();
        
        download.filename = new_name.clone();
        download.file_path = format!("{}/{}", dir, new_name);
        
        // In real implementation: rename the file on disk
        Ok(())
    }

    pub fn move_to_category(&self, download_id: &str, category: FileCategory) -> Result<(), String> {
        let settings = self.settings.lock().unwrap();
        let mut downloads = self.downloads.lock().unwrap();
        let download = downloads.get_mut(download_id)
            .ok_or("Download not found")?;
        
        download.category = category.clone();
        
        // Update path if organizing by type
        if settings.organize_by_type {
            if let Some(cat_folder) = settings.category_folders.get(&format!("{:?}", category)) {
                let new_dir = format!("{}/{}", settings.default_directory, cat_folder);
                download.file_path = format!("{}/{}", new_dir, download.filename);
            }
        }
        
        Ok(())
    }

    // ==================== Virus Scan ====================

    pub fn scan_download(&self, download_id: &str) -> Result<bool, String> {
        let mut downloads = self.downloads.lock().unwrap();
        let download = downloads.get_mut(download_id)
            .ok_or("Download not found")?;
        
        download.virus_scanned = true;
        download.virus_clean = Some(true); // In real impl, would call virus scanner
        
        Ok(download.virus_clean.unwrap_or(false))
    }

    // ==================== Export/Import ====================

    pub fn export_downloads_list(&self) -> Result<String, String> {
        let downloads: Vec<Download> = self.downloads.lock().unwrap()
            .values()
            .cloned()
            .collect();
        
        serde_json::to_string_pretty(&downloads)
            .map_err(|e| format!("Failed to export: {}", e))
    }

    pub fn import_downloads_list(&self, json: &str) -> Result<u32, String> {
        let imports: Vec<Download> = serde_json::from_str(json)
            .map_err(|e| format!("Failed to parse: {}", e))?;
        
        let count = imports.len() as u32;
        let mut downloads = self.downloads.lock().unwrap();
        
        for download in imports {
            downloads.insert(download.id.clone(), download);
        }
        
        Ok(count)
    }
}

impl Default for BrowserDownloadsService {
    fn default() -> Self {
        Self::new()
    }
}
