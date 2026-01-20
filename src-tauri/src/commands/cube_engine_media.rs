// CUBE Engine Media & Download
// Media playback, download manager, PDF viewer, print support

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::RwLock;
use tauri::{AppHandle, Emitter, State};

// ============================================
// Media & Download State
// ============================================

pub struct CubeMediaState {
    pub media_sessions: RwLock<HashMap<String, MediaSession>>,
    pub downloads: RwLock<HashMap<String, DownloadItem>>,
    pub pdf_documents: RwLock<HashMap<String, PDFDocument>>,
    pub print_jobs: RwLock<HashMap<String, PrintJob>>,
    pub media_config: RwLock<MediaConfig>,
    pub download_config: RwLock<DownloadConfig>,
}

impl Default for CubeMediaState {
    fn default() -> Self {
        Self {
            media_sessions: RwLock::new(HashMap::new()),
            downloads: RwLock::new(HashMap::new()),
            pdf_documents: RwLock::new(HashMap::new()),
            print_jobs: RwLock::new(HashMap::new()),
            media_config: RwLock::new(MediaConfig::default()),
            download_config: RwLock::new(DownloadConfig::default()),
        }
    }
}

// ============================================
// Media Playback
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaSession {
    pub id: String,
    pub tab_id: String,
    pub media_type: MediaType,
    pub source: MediaSource,
    pub state: PlaybackState,
    pub duration: f64,
    pub current_time: f64,
    pub volume: f64,
    pub muted: bool,
    pub playback_rate: f64,
    pub buffered_ranges: Vec<TimeRange>,
    pub metadata: MediaMetadata,
    pub video_info: Option<VideoInfo>,
    pub audio_info: Option<AudioInfo>,
    pub subtitles: Vec<SubtitleTrack>,
    pub active_subtitle: Option<String>,
    pub pip_active: bool,
    pub fullscreen: bool,
    pub created_at: i64,
    pub last_updated: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum MediaType {
    #[default]
    Video,
    Audio,
    Stream,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaSource {
    pub url: String,
    pub source_type: SourceType,
    pub quality: Option<String>,
    pub bitrate: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum SourceType {
    #[default]
    Direct,
    HLS,
    DASH,
    MSE,
    WebRTC,
    Blob,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum PlaybackState {
    #[default]
    Idle,
    Loading,
    Playing,
    Paused,
    Buffering,
    Ended,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeRange {
    pub start: f64,
    pub end: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct MediaMetadata {
    pub title: Option<String>,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub artwork: Vec<MediaImage>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaImage {
    pub src: String,
    pub sizes: Option<String>,
    pub image_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoInfo {
    pub width: u32,
    pub height: u32,
    pub codec: String,
    pub frame_rate: f64,
    pub aspect_ratio: String,
    pub hdr: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioInfo {
    pub codec: String,
    pub sample_rate: u32,
    pub channels: u8,
    pub bits_per_sample: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubtitleTrack {
    pub id: String,
    pub label: String,
    pub language: String,
    pub src: Option<String>,
    pub is_default: bool,
}

// ============================================
// Download Manager
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadItem {
    pub id: String,
    pub url: String,
    pub filename: String,
    pub save_path: String,
    pub mime_type: Option<String>,
    pub total_bytes: Option<u64>,
    pub received_bytes: u64,
    pub state: DownloadState,
    pub error: Option<DownloadError>,
    pub speed_bytes_per_sec: u64,
    pub time_remaining_secs: Option<u64>,
    pub can_resume: bool,
    pub is_paused: bool,
    pub referrer: Option<String>,
    pub started_at: i64,
    pub completed_at: Option<i64>,
    pub opener_tab_id: Option<String>,
    pub danger_type: DangerType,
    pub exists: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum DownloadState {
    #[default]
    Pending,
    InProgress,
    Paused,
    Interrupted,
    Complete,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadError {
    pub code: DownloadErrorCode,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum DownloadErrorCode {
    #[default]
    Unknown,
    NetworkError,
    ServerError,
    UserCancelled,
    FileTooLarge,
    DiskFull,
    FileAccessDenied,
    FileExists,
    VirusDetected,
    Timeout,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum DangerType {
    #[default]
    Safe,
    File,
    Url,
    Content,
    Uncommon,
    AcceptedByUser,
    DangerousHost,
    PotentiallyUnwanted,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadQuery {
    pub id: Option<String>,
    pub url: Option<String>,
    pub filename: Option<String>,
    pub state: Option<DownloadState>,
    pub danger_type: Option<DangerType>,
    pub started_after: Option<i64>,
    pub started_before: Option<i64>,
    pub limit: Option<u32>,
    pub order_by: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadConfig {
    pub default_download_path: String,
    pub ask_where_to_save: bool,
    pub show_download_shelf: bool,
    pub auto_open_downloads: bool,
    pub max_concurrent_downloads: u32,
    pub max_download_speed: Option<u64>,
    pub dangerous_file_extensions: Vec<String>,
    pub scan_for_malware: bool,
}

impl Default for DownloadConfig {
    fn default() -> Self {
        Self {
            default_download_path: "~/Downloads".to_string(),
            ask_where_to_save: false,
            show_download_shelf: true,
            auto_open_downloads: false,
            max_concurrent_downloads: 5,
            max_download_speed: None,
            dangerous_file_extensions: vec![
                "exe".to_string(), "msi".to_string(), "dmg".to_string(),
                "pkg".to_string(), "deb".to_string(), "rpm".to_string(),
                "bat".to_string(), "cmd".to_string(), "ps1".to_string(),
                "sh".to_string(), "app".to_string(),
            ],
            scan_for_malware: true,
        }
    }
}

// ============================================
// PDF Viewer
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PDFDocument {
    pub id: String,
    pub tab_id: String,
    pub url: String,
    pub filename: Option<String>,
    pub page_count: u32,
    pub current_page: u32,
    pub zoom_level: f64,
    pub fit_mode: PDFFitMode,
    pub rotation: u16,
    pub metadata: PDFMetadata,
    pub outline: Vec<PDFOutlineEntry>,
    pub annotations: Vec<PDFAnnotation>,
    pub is_encrypted: bool,
    pub is_linearized: bool,
    pub loaded_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum PDFFitMode {
    #[default]
    Page,
    Width,
    Actual,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PDFMetadata {
    pub title: Option<String>,
    pub author: Option<String>,
    pub subject: Option<String>,
    pub keywords: Option<String>,
    pub creator: Option<String>,
    pub producer: Option<String>,
    pub creation_date: Option<String>,
    pub mod_date: Option<String>,
    pub pdf_version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PDFOutlineEntry {
    pub title: String,
    pub page: u32,
    pub level: u8,
    pub children: Vec<PDFOutlineEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PDFAnnotation {
    pub id: String,
    pub annotation_type: PDFAnnotationType,
    pub page: u32,
    pub rect: PDFRect,
    pub contents: Option<String>,
    pub color: Option<String>,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum PDFAnnotationType {
    #[default]
    Highlight,
    Underline,
    Strikeout,
    Text,
    FreeText,
    Link,
    Stamp,
    Ink,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PDFRect {
    pub x1: f64,
    pub y1: f64,
    pub x2: f64,
    pub y2: f64,
}

// ============================================
// Print Support
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrintJob {
    pub id: String,
    pub tab_id: String,
    pub url: String,
    pub title: String,
    pub state: PrintState,
    pub settings: PrintSettings,
    pub page_count: u32,
    pub pages_printed: u32,
    pub error: Option<String>,
    pub created_at: i64,
    pub completed_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum PrintState {
    #[default]
    Pending,
    Printing,
    Complete,
    Cancelled,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrintSettings {
    pub printer_name: Option<String>,
    pub copies: u32,
    pub collate: bool,
    pub duplex: DuplexMode,
    pub color_mode: ColorMode,
    pub orientation: Orientation,
    pub paper_size: PaperSize,
    pub margins: PrintMargins,
    pub scale: f64,
    pub pages: Option<String>,
    pub headers_footers: bool,
    pub background_graphics: bool,
    pub selection_only: bool,
}

impl Default for PrintSettings {
    fn default() -> Self {
        Self {
            printer_name: None,
            copies: 1,
            collate: true,
            duplex: DuplexMode::None,
            color_mode: ColorMode::Color,
            orientation: Orientation::Portrait,
            paper_size: PaperSize::Letter,
            margins: PrintMargins::default(),
            scale: 1.0,
            pages: None,
            headers_footers: true,
            background_graphics: false,
            selection_only: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum DuplexMode {
    #[default]
    None,
    LongEdge,
    ShortEdge,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum ColorMode {
    #[default]
    Color,
    Grayscale,
    Monochrome,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum Orientation {
    #[default]
    Portrait,
    Landscape,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PaperSize {
    Letter,
    Legal,
    Tabloid,
    A3,
    A4,
    A5,
    Custom { width_mm: f64, height_mm: f64 },
}

impl Default for PaperSize {
    fn default() -> Self {
        PaperSize::Letter
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrintMargins {
    pub top_mm: f64,
    pub bottom_mm: f64,
    pub left_mm: f64,
    pub right_mm: f64,
}

impl Default for PrintMargins {
    fn default() -> Self {
        Self {
            top_mm: 10.0,
            bottom_mm: 10.0,
            left_mm: 10.0,
            right_mm: 10.0,
        }
    }
}

// ============================================
// Media Config
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaConfig {
    pub autoplay_policy: AutoplayPolicy,
    pub default_volume: f64,
    pub hardware_acceleration: bool,
    pub pip_enabled: bool,
    pub media_session_enabled: bool,
    pub preload_strategy: PreloadStrategy,
}

impl Default for MediaConfig {
    fn default() -> Self {
        Self {
            autoplay_policy: AutoplayPolicy::default(),
            default_volume: 1.0,
            hardware_acceleration: true,
            pip_enabled: true,
            media_session_enabled: true,
            preload_strategy: PreloadStrategy::default(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum AutoplayPolicy {
    #[default]
    Allowed,
    Muted,
    UserGestureRequired,
    Blocked,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum PreloadStrategy {
    #[default]
    Auto,
    Metadata,
    None,
}

// ============================================
// Tauri Commands - Media Playback
// ============================================

#[tauri::command]
pub async fn media_create_session(
    state: State<'_, CubeMediaState>,
    app: AppHandle,
    tab_id: String,
    media_type: MediaType,
    source: MediaSource,
) -> Result<String, String> {
    let session_id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp_millis();
    
    let session = MediaSession {
        id: session_id.clone(),
        tab_id,
        media_type,
        source,
        state: PlaybackState::Idle,
        duration: 0.0,
        current_time: 0.0,
        volume: 1.0,
        muted: false,
        playback_rate: 1.0,
        buffered_ranges: Vec::new(),
        metadata: MediaMetadata::default(),
        video_info: None,
        audio_info: None,
        subtitles: Vec::new(),
        active_subtitle: None,
        pip_active: false,
        fullscreen: false,
        created_at: now,
        last_updated: now,
    };
    
    let mut sessions = state.media_sessions.write().map_err(|e| format!("Lock error: {}", e))?;
    sessions.insert(session_id.clone(), session.clone());
    
    let _ = app.emit("media-session-created", &session);
    
    Ok(session_id)
}

#[tauri::command]
pub async fn media_play(
    state: State<'_, CubeMediaState>,
    app: AppHandle,
    session_id: String,
) -> Result<(), String> {
    let mut sessions = state.media_sessions.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(session) = sessions.get_mut(&session_id) {
        session.state = PlaybackState::Playing;
        session.last_updated = chrono::Utc::now().timestamp_millis();
        
        let _ = app.emit("media-play", serde_json::json!({ "sessionId": session_id }));
    }
    
    Ok(())
}

#[tauri::command]
pub async fn media_pause(
    state: State<'_, CubeMediaState>,
    app: AppHandle,
    session_id: String,
) -> Result<(), String> {
    let mut sessions = state.media_sessions.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(session) = sessions.get_mut(&session_id) {
        session.state = PlaybackState::Paused;
        session.last_updated = chrono::Utc::now().timestamp_millis();
        
        let _ = app.emit("media-pause", serde_json::json!({ "sessionId": session_id }));
    }
    
    Ok(())
}

#[tauri::command]
pub async fn media_seek(
    state: State<'_, CubeMediaState>,
    app: AppHandle,
    session_id: String,
    time: f64,
) -> Result<(), String> {
    let mut sessions = state.media_sessions.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(session) = sessions.get_mut(&session_id) {
        session.current_time = time.max(0.0).min(session.duration);
        session.last_updated = chrono::Utc::now().timestamp_millis();
        
        let _ = app.emit("media-seek", serde_json::json!({ 
            "sessionId": session_id,
            "time": time
        }));
    }
    
    Ok(())
}

#[tauri::command]
pub async fn media_set_volume(
    state: State<'_, CubeMediaState>,
    app: AppHandle,
    session_id: String,
    volume: f64,
    muted: Option<bool>,
) -> Result<(), String> {
    let mut sessions = state.media_sessions.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(session) = sessions.get_mut(&session_id) {
        session.volume = volume.max(0.0).min(1.0);
        if let Some(m) = muted {
            session.muted = m;
        }
        session.last_updated = chrono::Utc::now().timestamp_millis();
        
        let _ = app.emit("media-volume-changed", serde_json::json!({
            "sessionId": session_id,
            "volume": session.volume,
            "muted": session.muted
        }));
    }
    
    Ok(())
}

#[tauri::command]
pub async fn media_set_playback_rate(
    state: State<'_, CubeMediaState>,
    session_id: String,
    rate: f64,
) -> Result<(), String> {
    let mut sessions = state.media_sessions.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(session) = sessions.get_mut(&session_id) {
        session.playback_rate = rate.max(0.25).min(4.0);
        session.last_updated = chrono::Utc::now().timestamp_millis();
    }
    
    Ok(())
}

#[tauri::command]
pub async fn media_toggle_pip(
    state: State<'_, CubeMediaState>,
    app: AppHandle,
    session_id: String,
) -> Result<bool, String> {
    let mut sessions = state.media_sessions.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(session) = sessions.get_mut(&session_id) {
        session.pip_active = !session.pip_active;
        session.last_updated = chrono::Utc::now().timestamp_millis();
        
        let _ = app.emit("media-pip-changed", serde_json::json!({
            "sessionId": session_id,
            "active": session.pip_active
        }));
        
        return Ok(session.pip_active);
    }
    
    Ok(false)
}

#[tauri::command]
pub async fn media_get_session(
    state: State<'_, CubeMediaState>,
    session_id: String,
) -> Result<Option<MediaSession>, String> {
    let sessions = state.media_sessions.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(sessions.get(&session_id).cloned())
}

#[tauri::command]
pub async fn media_destroy_session(
    state: State<'_, CubeMediaState>,
    session_id: String,
) -> Result<(), String> {
    let mut sessions = state.media_sessions.write().map_err(|e| format!("Lock error: {}", e))?;
    sessions.remove(&session_id);
    Ok(())
}

// ============================================
// Tauri Commands - Download Manager
// ============================================

#[tauri::command]
pub async fn media_download_start(
    state: State<'_, CubeMediaState>,
    app: AppHandle,
    url: String,
    filename: Option<String>,
    save_path: Option<String>,
    opener_tab_id: Option<String>,
) -> Result<String, String> {
    let download_id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp_millis();
    
    let config = state.download_config.read().map_err(|e| format!("Lock error: {}", e))?;
    
    let final_filename = filename.unwrap_or_else(|| {
        url.split('/').last().unwrap_or("download").to_string()
    });
    
    let final_path = save_path.unwrap_or_else(|| {
        format!("{}/{}", config.default_download_path, final_filename)
    });
    
    let download = DownloadItem {
        id: download_id.clone(),
        url: url.clone(),
        filename: final_filename,
        save_path: final_path,
        mime_type: None,
        total_bytes: None,
        received_bytes: 0,
        state: DownloadState::Pending,
        error: None,
        speed_bytes_per_sec: 0,
        time_remaining_secs: None,
        can_resume: false,
        is_paused: false,
        referrer: None,
        started_at: now,
        completed_at: None,
        opener_tab_id,
        danger_type: DangerType::Safe,
        exists: false,
    };
    
    let mut downloads = state.downloads.write().map_err(|e| format!("Lock error: {}", e))?;
    downloads.insert(download_id.clone(), download.clone());
    
    let _ = app.emit("download-started", &download);
    
    Ok(download_id)
}

#[tauri::command]
pub async fn media_download_pause(
    state: State<'_, CubeMediaState>,
    app: AppHandle,
    download_id: String,
) -> Result<(), String> {
    let mut downloads = state.downloads.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(download) = downloads.get_mut(&download_id) {
        if download.can_resume {
            download.is_paused = true;
            download.state = DownloadState::Paused;
            
            let _ = app.emit("download-paused", serde_json::json!({ "downloadId": download_id }));
        }
    }
    
    Ok(())
}

#[tauri::command]
pub async fn media_download_resume(
    state: State<'_, CubeMediaState>,
    app: AppHandle,
    download_id: String,
) -> Result<(), String> {
    let mut downloads = state.downloads.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(download) = downloads.get_mut(&download_id) {
        if download.can_resume && download.is_paused {
            download.is_paused = false;
            download.state = DownloadState::InProgress;
            
            let _ = app.emit("download-resumed", serde_json::json!({ "downloadId": download_id }));
        }
    }
    
    Ok(())
}

#[tauri::command]
pub async fn media_download_cancel(
    state: State<'_, CubeMediaState>,
    app: AppHandle,
    download_id: String,
) -> Result<(), String> {
    let mut downloads = state.downloads.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(download) = downloads.get_mut(&download_id) {
        download.state = DownloadState::Cancelled;
        
        let _ = app.emit("download-cancelled", serde_json::json!({ "downloadId": download_id }));
    }
    
    Ok(())
}

#[tauri::command]
pub async fn media_download_update_progress(
    state: State<'_, CubeMediaState>,
    app: AppHandle,
    download_id: String,
    received_bytes: u64,
    total_bytes: Option<u64>,
    speed_bytes_per_sec: u64,
) -> Result<(), String> {
    let mut downloads = state.downloads.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(download) = downloads.get_mut(&download_id) {
        download.received_bytes = received_bytes;
        download.total_bytes = total_bytes;
        download.speed_bytes_per_sec = speed_bytes_per_sec;
        download.state = DownloadState::InProgress;
        
        if let Some(total) = total_bytes {
            if speed_bytes_per_sec > 0 {
                let remaining = total.saturating_sub(received_bytes);
                download.time_remaining_secs = Some(remaining / speed_bytes_per_sec);
            }
        }
        
        let _ = app.emit("download-progress", &download);
    }
    
    Ok(())
}

#[tauri::command]
pub async fn media_download_complete(
    state: State<'_, CubeMediaState>,
    app: AppHandle,
    download_id: String,
) -> Result<(), String> {
    let mut downloads = state.downloads.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(download) = downloads.get_mut(&download_id) {
        download.state = DownloadState::Complete;
        download.completed_at = Some(chrono::Utc::now().timestamp_millis());
        download.exists = true;
        
        let _ = app.emit("download-complete", &download);
    }
    
    Ok(())
}

#[tauri::command]
pub async fn media_download_get(
    state: State<'_, CubeMediaState>,
    download_id: String,
) -> Result<Option<DownloadItem>, String> {
    let downloads = state.downloads.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(downloads.get(&download_id).cloned())
}

#[tauri::command]
pub async fn media_download_list(
    state: State<'_, CubeMediaState>,
    query: Option<DownloadQuery>,
) -> Result<Vec<DownloadItem>, String> {
    let downloads = state.downloads.read().map_err(|e| format!("Lock error: {}", e))?;
    
    let mut result: Vec<DownloadItem> = downloads.values().cloned().collect();
    
    if let Some(q) = query {
        result = result.into_iter().filter(|d| {
            let mut matches = true;
            if let Some(ref id) = q.id {
                matches = matches && d.id == *id;
            }
            if let Some(ref url) = q.url {
                matches = matches && d.url.contains(url);
            }
            if let Some(ref filename) = q.filename {
                matches = matches && d.filename.contains(filename);
            }
            matches
        }).collect();
        
        if let Some(limit) = q.limit {
            result.truncate(limit as usize);
        }
    }
    
    Ok(result)
}

#[tauri::command]
pub async fn media_download_remove(
    state: State<'_, CubeMediaState>,
    download_id: String,
) -> Result<(), String> {
    let mut downloads = state.downloads.write().map_err(|e| format!("Lock error: {}", e))?;
    downloads.remove(&download_id);
    Ok(())
}

// ============================================
// Tauri Commands - PDF Viewer
// ============================================

#[tauri::command]
pub async fn pdf_open(
    state: State<'_, CubeMediaState>,
    app: AppHandle,
    tab_id: String,
    url: String,
    filename: Option<String>,
) -> Result<String, String> {
    let pdf_id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp_millis();
    
    let document = PDFDocument {
        id: pdf_id.clone(),
        tab_id,
        url,
        filename,
        page_count: 0,
        current_page: 1,
        zoom_level: 1.0,
        fit_mode: PDFFitMode::default(),
        rotation: 0,
        metadata: PDFMetadata::default(),
        outline: Vec::new(),
        annotations: Vec::new(),
        is_encrypted: false,
        is_linearized: false,
        loaded_at: now,
    };
    
    let mut documents = state.pdf_documents.write().map_err(|e| format!("Lock error: {}", e))?;
    documents.insert(pdf_id.clone(), document.clone());
    
    let _ = app.emit("pdf-opened", &document);
    
    Ok(pdf_id)
}

#[tauri::command]
pub async fn pdf_go_to_page(
    state: State<'_, CubeMediaState>,
    pdf_id: String,
    page: u32,
) -> Result<(), String> {
    let mut documents = state.pdf_documents.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(doc) = documents.get_mut(&pdf_id) {
        doc.current_page = page.max(1).min(doc.page_count);
    }
    
    Ok(())
}

#[tauri::command]
pub async fn pdf_set_zoom(
    state: State<'_, CubeMediaState>,
    pdf_id: String,
    zoom: f64,
) -> Result<(), String> {
    let mut documents = state.pdf_documents.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(doc) = documents.get_mut(&pdf_id) {
        doc.zoom_level = zoom.max(0.25).min(5.0);
        doc.fit_mode = PDFFitMode::Custom;
    }
    
    Ok(())
}

#[tauri::command]
pub async fn pdf_set_fit_mode(
    state: State<'_, CubeMediaState>,
    pdf_id: String,
    fit_mode: PDFFitMode,
) -> Result<(), String> {
    let mut documents = state.pdf_documents.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(doc) = documents.get_mut(&pdf_id) {
        doc.fit_mode = fit_mode;
    }
    
    Ok(())
}

#[tauri::command]
pub async fn pdf_rotate(
    state: State<'_, CubeMediaState>,
    pdf_id: String,
    clockwise: bool,
) -> Result<(), String> {
    let mut documents = state.pdf_documents.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(doc) = documents.get_mut(&pdf_id) {
        if clockwise {
            doc.rotation = (doc.rotation + 90) % 360;
        } else {
            doc.rotation = (doc.rotation + 270) % 360;
        }
    }
    
    Ok(())
}

#[tauri::command]
pub async fn pdf_add_annotation(
    state: State<'_, CubeMediaState>,
    pdf_id: String,
    annotation: PDFAnnotation,
) -> Result<String, String> {
    let mut documents = state.pdf_documents.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(doc) = documents.get_mut(&pdf_id) {
        let ann_id = annotation.id.clone();
        doc.annotations.push(annotation);
        return Ok(ann_id);
    }
    
    Err("PDF not found".to_string())
}

#[tauri::command]
pub async fn pdf_get(
    state: State<'_, CubeMediaState>,
    pdf_id: String,
) -> Result<Option<PDFDocument>, String> {
    let documents = state.pdf_documents.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(documents.get(&pdf_id).cloned())
}

#[tauri::command]
pub async fn pdf_close(
    state: State<'_, CubeMediaState>,
    pdf_id: String,
) -> Result<(), String> {
    let mut documents = state.pdf_documents.write().map_err(|e| format!("Lock error: {}", e))?;
    documents.remove(&pdf_id);
    Ok(())
}

// ============================================
// Tauri Commands - Print Support
// ============================================

#[tauri::command]
pub async fn print_start(
    state: State<'_, CubeMediaState>,
    app: AppHandle,
    tab_id: String,
    url: String,
    title: String,
    settings: Option<PrintSettings>,
) -> Result<String, String> {
    let job_id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp_millis();
    
    let job = PrintJob {
        id: job_id.clone(),
        tab_id,
        url,
        title,
        state: PrintState::Pending,
        settings: settings.unwrap_or_default(),
        page_count: 0,
        pages_printed: 0,
        error: None,
        created_at: now,
        completed_at: None,
    };
    
    let mut jobs = state.print_jobs.write().map_err(|e| format!("Lock error: {}", e))?;
    jobs.insert(job_id.clone(), job.clone());
    
    let _ = app.emit("print-started", &job);
    
    Ok(job_id)
}

#[tauri::command]
pub async fn print_cancel(
    state: State<'_, CubeMediaState>,
    job_id: String,
) -> Result<(), String> {
    let mut jobs = state.print_jobs.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(job) = jobs.get_mut(&job_id) {
        job.state = PrintState::Cancelled;
    }
    
    Ok(())
}

#[tauri::command]
pub async fn print_get_job(
    state: State<'_, CubeMediaState>,
    job_id: String,
) -> Result<Option<PrintJob>, String> {
    let jobs = state.print_jobs.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(jobs.get(&job_id).cloned())
}

// ============================================
// Tauri Commands - Config
// ============================================

#[tauri::command]
pub async fn media_get_config(
    state: State<'_, CubeMediaState>,
) -> Result<MediaConfig, String> {
    let config = state.media_config.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(config.clone())
}

#[tauri::command]
pub async fn media_set_config(
    state: State<'_, CubeMediaState>,
    config: MediaConfig,
) -> Result<(), String> {
    let mut current = state.media_config.write().map_err(|e| format!("Lock error: {}", e))?;
    *current = config;
    Ok(())
}

#[tauri::command]
pub async fn download_get_config(
    state: State<'_, CubeMediaState>,
) -> Result<DownloadConfig, String> {
    let config = state.download_config.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(config.clone())
}

#[tauri::command]
pub async fn download_set_config(
    state: State<'_, CubeMediaState>,
    config: DownloadConfig,
) -> Result<(), String> {
    let mut current = state.download_config.write().map_err(|e| format!("Lock error: {}", e))?;
    *current = config;
    Ok(())
}
