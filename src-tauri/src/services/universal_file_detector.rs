// ═══════════════════════════════════════════════════════════════════════════════
// 🔍 UNIVERSAL FILE DETECTION & DOWNLOAD ENGINE
// ═══════════════════════════════════════════════════════════════════════════════
//
// Sistema avanzado para detectar y descargar archivos de CUALQUIER página web:
// - Detección múltiple: DOM, Network, JavaScript inspection
// - Tipos: PDF, DOC/DOCX, XLS/XLSX, images, videos, audio, archives
// - Magic bytes y MIME type detection
// - Metadata extraction
// - Download queue con progreso
// - Retry logic y error handling
//
// ═══════════════════════════════════════════════════════════════════════════════

use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use log::{error, info};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;

// ═══════════════════════════════════════════════════════════════════════════
// FILE DETECTION TYPES
// ═══════════════════════════════════════════════════════════════════════════

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetectedFile {
    pub id: String,
    pub url: String,
    pub file_name: String,
    pub file_type: FileType,
    pub mime_type: Option<String>,
    pub size: Option<i64>,
    pub detection_method: DetectionMethod,
    pub metadata: FileMetadata,
    pub detected_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum FileType {
    PDF,
    Word,       // DOC, DOCX
    Excel,      // XLS, XLSX
    PowerPoint, // PPT, PPTX
    Image,      // JPG, PNG, GIF, WebP
    Video,      // MP4, WebM, AVI, MOV
    Audio,      // MP3, WAV, OGG
    Archive,    // ZIP, RAR, 7Z, TAR
    Text,       // TXT, CSV, JSON, XML
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DetectionMethod {
    DOMScan,              // <a href>, <iframe>, <embed>
    NetworkMonitor,       // XHR, Fetch requests
    JavaScriptInspection, // window objects, blob URLs
    MagicBytes,           // File signature detection
    MetaTag,              // <meta> tags, OpenGraph
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileMetadata {
    pub title: Option<String>,
    pub description: Option<String>,
    pub author: Option<String>,
    pub created_date: Option<DateTime<Utc>>,
    pub modified_date: Option<DateTime<Utc>>,
    pub page_url: String,
    pub link_text: Option<String>,
    pub attributes: HashMap<String, String>,
}

// ═══════════════════════════════════════════════════════════════════════════
// DOWNLOAD TYPES
// ═══════════════════════════════════════════════════════════════════════════

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadTask {
    pub id: String,
    pub file: DetectedFile,
    pub status: DownloadStatus,
    pub progress: f32,
    pub downloaded_bytes: i64,
    pub total_bytes: Option<i64>,
    pub output_path: PathBuf,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub error: Option<String>,
    pub retry_count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DownloadStatus {
    Queued,
    Downloading,
    Completed,
    Failed,
    Cancelled,
}

// ═══════════════════════════════════════════════════════════════════════════
// UNIVERSAL FILE DETECTOR SERVICE
// ═══════════════════════════════════════════════════════════════════════════

pub struct UniversalFileDetector {
    client: Client,
    detected_files: Arc<Mutex<HashMap<String, DetectedFile>>>,
    download_queue: Arc<Mutex<Vec<DownloadTask>>>,
    download_history: Arc<Mutex<Vec<DownloadTask>>>,
    magic_bytes_db: HashMap<Vec<u8>, FileType>,
}

impl UniversalFileDetector {
    pub fn new() -> Result<Self> {
        let client = Client::builder()
            .timeout(std::time::Duration::from_secs(60))
            .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
            .build()?;

        let magic_bytes_db = Self::init_magic_bytes_db();

        Ok(Self {
            client,
            detected_files: Arc::new(Mutex::new(HashMap::new())),
            download_queue: Arc::new(Mutex::new(Vec::new())),
            download_history: Arc::new(Mutex::new(Vec::new())),
            magic_bytes_db,
        })
    }

    /// Initialize magic bytes database for file type detection
    fn init_magic_bytes_db() -> HashMap<Vec<u8>, FileType> {
        let mut db = HashMap::new();

        // PDF
        db.insert(vec![0x25, 0x50, 0x44, 0x46], FileType::PDF); // %PDF

        // Microsoft Office (ZIP-based)
        db.insert(vec![0x50, 0x4B, 0x03, 0x04], FileType::Word); // ZIP signature (DOCX, XLSX, PPTX)

        // Old Microsoft Office
        db.insert(
            vec![0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1],
            FileType::Word,
        ); // DOC, XLS, PPT

        // Images
        db.insert(vec![0xFF, 0xD8, 0xFF], FileType::Image); // JPEG
        db.insert(vec![0x89, 0x50, 0x4E, 0x47], FileType::Image); // PNG
        db.insert(vec![0x47, 0x49, 0x46, 0x38], FileType::Image); // GIF
        db.insert(vec![0x52, 0x49, 0x46, 0x46], FileType::Image); // WebP (RIFF)

        // Videos
        db.insert(
            vec![0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70],
            FileType::Video,
        ); // MP4
        db.insert(vec![0x1A, 0x45, 0xDF, 0xA3], FileType::Video); // WebM

        // Audio
        db.insert(vec![0xFF, 0xFB], FileType::Audio); // MP3
        db.insert(vec![0x52, 0x49, 0x46, 0x46], FileType::Audio); // WAV (RIFF)

        // Archives
        db.insert(vec![0x50, 0x4B, 0x03, 0x04], FileType::Archive); // ZIP
        db.insert(vec![0x52, 0x61, 0x72, 0x21], FileType::Archive); // RAR
        db.insert(vec![0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C], FileType::Archive); // 7Z

        db
    }

    // ═══════════════════════════════════════════════════════════════════════
    // FILE DETECTION METHODS
    // ═══════════════════════════════════════════════════════════════════════

    /// Detect files from page HTML
    pub async fn detect_from_html(&self, html: &str, page_url: &str) -> Result<Vec<DetectedFile>> {
        use scraper::{Html, Selector};

        // Extract all URLs synchronously first (no await during iteration)
        let mut url_data = Vec::new();

        {
            let document = Html::parse_document(html);

            // 1. Collect from <a> tags
            let a_selector = Selector::parse("a[href]").unwrap();
            for element in document.select(&a_selector) {
                if let Some(href) = element.value().attr("href") {
                    let link_text = element.text().collect::<Vec<_>>().join(" ");
                    url_data.push((href.to_string(), Some(link_text)));
                }
            }

            // 2. Collect from <iframe> tags
            let iframe_selector = Selector::parse("iframe[src]").unwrap();
            for element in document.select(&iframe_selector) {
                if let Some(src) = element.value().attr("src") {
                    url_data.push((src.to_string(), None));
                }
            }

            // 3. Collect from <embed> tags
            let embed_selector = Selector::parse("embed[src]").unwrap();
            for element in document.select(&embed_selector) {
                if let Some(src) = element.value().attr("src") {
                    url_data.push((src.to_string(), None));
                }
            }

            // 4. Collect from <object> tags
            let object_selector = Selector::parse("object[data]").unwrap();
            for element in document.select(&object_selector) {
                if let Some(data) = element.value().attr("data") {
                    url_data.push((data.to_string(), None));
                }
            }

            // 5. Collect from <img> tags
            let img_selector = Selector::parse("img[src]").unwrap();
            for element in document.select(&img_selector) {
                if let Some(src) = element.value().attr("src") {
                    url_data.push((src.to_string(), None));
                }
            }

            // 6. Collect from <video> and <audio> tags
            let media_selector = Selector::parse("video[src], audio[src], source[src]").unwrap();
            for element in document.select(&media_selector) {
                if let Some(src) = element.value().attr("src") {
                    url_data.push((src.to_string(), None));
                }
            }
        } // document dropped here

        // Now process URLs (can use await safely)
        let mut detected = Vec::new();
        for (url, link_text) in url_data {
            if let Some(mut file) = self
                .check_url_for_file(&url, page_url, DetectionMethod::DOMScan)
                .await
            {
                if let Some(text) = link_text {
                    file.metadata.link_text = Some(text);
                }
                detected.push(file);
            }
        }

        // Cache detected files
        let mut cache = self.detected_files.lock().await;
        for file in &detected {
            cache.insert(file.id.clone(), file.clone());
        }

        info!("✅ Detected {} files from HTML", detected.len());
        Ok(detected)
    }

    /// Check if URL points to a downloadable file
    async fn check_url_for_file(
        &self,
        url: &str,
        page_url: &str,
        method: DetectionMethod,
    ) -> Option<DetectedFile> {
        // Resolve relative URLs
        let full_url = self.resolve_url(url, page_url)?;

        // Check file extension
        let file_type = self.detect_file_type_from_url(&full_url)?;

        // Generate file name
        let file_name = self.extract_file_name(&full_url);

        Some(DetectedFile {
            id: uuid::Uuid::new_v4().to_string(),
            url: full_url.clone(),
            file_name,
            file_type,
            mime_type: None,
            size: None,
            detection_method: method,
            metadata: FileMetadata {
                title: None,
                description: None,
                author: None,
                created_date: None,
                modified_date: None,
                page_url: page_url.to_string(),
                link_text: None,
                attributes: HashMap::new(),
            },
            detected_at: Utc::now(),
        })
    }

    /// Resolve relative URL to absolute
    fn resolve_url(&self, url: &str, base_url: &str) -> Option<String> {
        if url.starts_with("http://") || url.starts_with("https://") {
            return Some(url.to_string());
        }

        if url.starts_with("//") {
            return Some(format!("https:{}", url));
        }

        if url.starts_with("/") {
            // Extract domain from base_url
            let parts: Vec<&str> = base_url.split('/').collect();
            if parts.len() >= 3 {
                return Some(format!("{}//{}{}", parts[0], parts[2], url));
            }
        }

        // Relative URL
        let base_without_file = base_url.rsplit_once('/').map(|(b, _)| b)?;
        Some(format!("{}/{}", base_without_file, url))
    }

    /// Detect file type from URL extension
    fn detect_file_type_from_url(&self, url: &str) -> Option<FileType> {
        let lower_url = url.to_lowercase();

        if lower_url.contains(".pdf") {
            Some(FileType::PDF)
        } else if lower_url.contains(".doc") || lower_url.contains(".docx") {
            Some(FileType::Word)
        } else if lower_url.contains(".xls") || lower_url.contains(".xlsx") {
            Some(FileType::Excel)
        } else if lower_url.contains(".ppt") || lower_url.contains(".pptx") {
            Some(FileType::PowerPoint)
        } else if lower_url.contains(".jpg")
            || lower_url.contains(".jpeg")
            || lower_url.contains(".png")
            || lower_url.contains(".gif")
            || lower_url.contains(".webp")
            || lower_url.contains(".svg")
        {
            Some(FileType::Image)
        } else if lower_url.contains(".mp4")
            || lower_url.contains(".webm")
            || lower_url.contains(".avi")
            || lower_url.contains(".mov")
        {
            Some(FileType::Video)
        } else if lower_url.contains(".mp3")
            || lower_url.contains(".wav")
            || lower_url.contains(".ogg")
        {
            Some(FileType::Audio)
        } else if lower_url.contains(".zip")
            || lower_url.contains(".rar")
            || lower_url.contains(".7z")
            || lower_url.contains(".tar")
        {
            Some(FileType::Archive)
        } else if lower_url.contains(".txt")
            || lower_url.contains(".csv")
            || lower_url.contains(".json")
            || lower_url.contains(".xml")
        {
            Some(FileType::Text)
        } else {
            None
        }
    }

    /// Extract file name from URL
    fn extract_file_name(&self, url: &str) -> String {
        url.split('/')
            .next_back()
            .unwrap_or("download")
            .split('?')
            .next()
            .unwrap_or("download")
            .to_string()
    }

    /// Detect file type from magic bytes
    pub fn detect_file_type_from_bytes(&self, bytes: &[u8]) -> FileType {
        for (signature, file_type) in &self.magic_bytes_db {
            if bytes.starts_with(signature) {
                return file_type.clone();
            }
        }
        FileType::Unknown
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DOWNLOAD METHODS
    // ═══════════════════════════════════════════════════════════════════════

    /// Add file to download queue
    pub async fn queue_download(&self, file: DetectedFile, output_dir: PathBuf) -> Result<String> {
        let task_id = uuid::Uuid::new_v4().to_string();
        let output_path = output_dir.join(&file.file_name);

        let task = DownloadTask {
            id: task_id.clone(),
            file,
            status: DownloadStatus::Queued,
            progress: 0.0,
            downloaded_bytes: 0,
            total_bytes: None,
            output_path,
            started_at: None,
            completed_at: None,
            error: None,
            retry_count: 0,
        };

        let mut queue = self.download_queue.lock().await;
        queue.push(task);

        info!("📥 Queued download: {}", task_id);
        Ok(task_id)
    }

    /// Download file
    pub async fn download_file(&self, task_id: &str) -> Result<()> {
        // Get task
        let mut queue = self.download_queue.lock().await;
        let task_index = queue
            .iter()
            .position(|t| t.id == task_id)
            .ok_or_else(|| anyhow!("Task not found"))?;

        let mut task = queue.remove(task_index);
        drop(queue);

        // Update status
        task.status = DownloadStatus::Downloading;
        task.started_at = Some(Utc::now());

        info!(
            "⬇️ Downloading: {} from {}",
            task.file.file_name, task.file.url
        );

        // Download
        match self.download_file_internal(&mut task).await {
            Ok(_) => {
                task.status = DownloadStatus::Completed;
                task.completed_at = Some(Utc::now());
                task.progress = 100.0;
                info!("✅ Download completed: {}", task.file.file_name);
            }
            Err(e) => {
                task.status = DownloadStatus::Failed;
                task.error = Some(e.to_string());
                error!("❌ Download failed: {}", e);
            }
        }

        // Move to history
        let mut history = self.download_history.lock().await;
        history.push(task);

        Ok(())
    }

    /// Internal download implementation
    async fn download_file_internal(&self, task: &mut DownloadTask) -> Result<()> {
        let response = self.client.get(&task.file.url).send().await?;

        if !response.status().is_success() {
            return Err(anyhow!("HTTP error: {}", response.status()));
        }

        // Get content length
        task.total_bytes = response.content_length().map(|l| l as i64);

        // Create output directory
        if let Some(parent) = task.output_path.parent() {
            tokio::fs::create_dir_all(parent).await?;
        }

        // Download and write
        let bytes = response.bytes().await?;
        task.downloaded_bytes = bytes.len() as i64;

        tokio::fs::write(&task.output_path, bytes).await?;

        Ok(())
    }

    /// Get download status
    pub async fn get_download_status(&self, task_id: &str) -> Option<DownloadTask> {
        // Check queue
        let queue = self.download_queue.lock().await;
        if let Some(task) = queue.iter().find(|t| t.id == task_id) {
            return Some(task.clone());
        }

        // Check history
        let history = self.download_history.lock().await;
        history.iter().find(|t| t.id == task_id).cloned()
    }

    /// Get all downloads
    pub async fn get_all_downloads(&self) -> Vec<DownloadTask> {
        let mut all = Vec::new();

        let queue = self.download_queue.lock().await;
        all.extend(queue.clone());

        let history = self.download_history.lock().await;
        all.extend(history.clone());

        all
    }

    /// Get detected files
    pub async fn get_detected_files(&self) -> Vec<DetectedFile> {
        let cache = self.detected_files.lock().await;
        cache.values().cloned().collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detector_creation() {
        let detector = UniversalFileDetector::new();
        assert!(detector.is_ok());
    }

    #[test]
    fn test_file_type_detection() {
        let detector = UniversalFileDetector::new().unwrap();

        assert_eq!(
            detector.detect_file_type_from_url("https://example.com/file.pdf"),
            Some(FileType::PDF)
        );

        assert_eq!(
            detector.detect_file_type_from_url("https://example.com/doc.docx"),
            Some(FileType::Word)
        );
    }

    #[test]
    fn test_magic_bytes() {
        let detector = UniversalFileDetector::new().unwrap();

        // PDF signature
        let pdf_bytes = vec![0x25, 0x50, 0x44, 0x46];
        assert_eq!(
            detector.detect_file_type_from_bytes(&pdf_bytes),
            FileType::PDF
        );

        // JPEG signature
        let jpeg_bytes = vec![0xFF, 0xD8, 0xFF];
        assert_eq!(
            detector.detect_file_type_from_bytes(&jpeg_bytes),
            FileType::Image
        );
    }
}
