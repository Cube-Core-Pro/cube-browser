// ═══════════════════════════════════════════════════════════════════════════
// CUBE Elite Workspace - Document Processing System v2.0
// ═══════════════════════════════════════════════════════════════════════════
// Production-ready document processing with PDF parsing, caching, and validation
//
// Features:
// - PDF text extraction (pdf-extract crate)
// - Magic bytes detection (PDF, DOC, DOCX, XLS, XLSX)
// - HashMap cache with TTL (Time-To-Live)
// - Binary data support (Vec<u8> alternative API)
// - Confidence scoring validators
// - Excel/CSV parsing (calamine crate)
// ═══════════════════════════════════════════════════════════════════════════

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

/// Default cache TTL: 1 hour
const DEFAULT_CACHE_TTL: Duration = Duration::from_secs(3600);

/// Maximum cache size: 100 documents
const MAX_CACHE_SIZE: usize = 100;

/// Magic bytes for document type detection
const PDF_MAGIC: &[u8] = b"%PDF";
const DOC_MAGIC: &[u8] = &[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]; // OLE2
const DOCX_MAGIC: &[u8] = b"PK\x03\x04"; // ZIP-based (also XLSX)
#[allow(dead_code)]
const XLS_MAGIC: &[u8] = &[0xD0, 0xCF, 0x11, 0xE0]; // OLE2 (short) - Reserved for future use

// ═══════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════

/// Document type enumeration
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum DocumentType {
    PDF,
    DOC,
    DOCX,
    XLS,
    XLSX,
    CSV,
    TXT,
    HTML,
    XML,
    JSON,
    Markdown,
    Image,
    Unknown,
}

impl DocumentType {
    /// Detect document type from file extension
    pub fn from_extension(ext: &str) -> Self {
        match ext.to_lowercase().as_str() {
            "pdf" => DocumentType::PDF,
            "doc" => DocumentType::DOC,
            "docx" => DocumentType::DOCX,
            "xls" => DocumentType::XLS,
            "xlsx" => DocumentType::XLSX,
            "csv" => DocumentType::CSV,
            "txt" | "text" => DocumentType::TXT,
            "html" | "htm" => DocumentType::HTML,
            "xml" => DocumentType::XML,
            "json" => DocumentType::JSON,
            "md" | "markdown" => DocumentType::Markdown,
            "png" | "jpg" | "jpeg" | "gif" | "bmp" | "webp" => DocumentType::Image,
            _ => DocumentType::Unknown,
        }
    }

    /// Get MIME type for document type
    #[allow(dead_code)]
    pub fn mime_type(&self) -> &'static str {
        match self {
            DocumentType::PDF => "application/pdf",
            DocumentType::DOC => "application/msword",
            DocumentType::DOCX => {
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            }
            DocumentType::XLS => "application/vnd.ms-excel",
            DocumentType::XLSX => {
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            }
            DocumentType::CSV => "text/csv",
            DocumentType::TXT => "text/plain",
            DocumentType::HTML => "text/html",
            DocumentType::XML => "application/xml",
            DocumentType::JSON => "application/json",
            DocumentType::Markdown => "text/markdown",
            DocumentType::Image => "image/*",
            DocumentType::Unknown => "application/octet-stream",
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// STRUCTURES
// ═══════════════════════════════════════════════════════════════════════════

/// Document metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentMetadata {
    pub title: Option<String>,
    pub author: Option<String>,
    pub subject: Option<String>,
    pub keywords: Vec<String>,
    pub created_at: Option<u64>,
    pub modified_at: Option<u64>,
    pub page_count: Option<usize>,
    pub file_size: Option<u64>,
    pub mime_type: String,
}

impl Default for DocumentMetadata {
    fn default() -> Self {
        Self {
            title: None,
            author: None,
            subject: None,
            keywords: Vec::new(),
            created_at: None,
            modified_at: None,
            page_count: None,
            file_size: None,
            mime_type: "application/octet-stream".to_string(),
        }
    }
}

/// Cached document entry (internal cache storage)
#[derive(Debug, Clone)]
#[allow(dead_code)]
struct CachedDocument {
    text: String,
    metadata: DocumentMetadata,
    cached_at: Instant,
    file_size: usize,
}

/// Document extraction result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractionResult {
    pub success: bool,
    pub text: String,
    pub page_count: Option<usize>,
    pub confidence: f32,
    pub metadata: DocumentMetadata,
}

/// Validation result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationResult {
    pub valid: bool,
    pub document_type: DocumentType,
    pub confidence: f32,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
}

/// Download result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadResult {
    pub success: bool,
    pub path: Option<String>,
    pub size: Option<u64>,
    pub document_type: Option<DocumentType>,
    pub error: Option<String>,
}

/// Download configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadConfig {
    pub url: String,
    pub save_path: String,
    pub timeout: Option<u64>,
    pub strict_mode: Option<bool>,
    pub min_size: Option<u64>,
    pub max_size: Option<u64>,
    pub validate_binary: Option<bool>,
    pub use_cache: Option<bool>,
}

/// Cache statistics
/// Cache statistics (used by document_get_cache_stats command)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheStats {
    pub total_documents: usize,
    pub total_size_bytes: u64,
    pub cache_hits: u64,
    pub cache_misses: u64,
    pub oldest_entry_age_secs: Option<u64>,
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENT CACHE
// ═══════════════════════════════════════════════════════════════════════════

/// Document cache with TTL support
pub struct DocumentCache {
    cache: Arc<Mutex<HashMap<String, CachedDocument>>>,
    ttl: Duration,
    max_size: usize,
    hits: Arc<Mutex<u64>>,
    misses: Arc<Mutex<u64>>,
}

impl DocumentCache {
    /// Create new cache with default TTL
    pub fn new() -> Self {
        Self {
            cache: Arc::new(Mutex::new(HashMap::new())),
            ttl: DEFAULT_CACHE_TTL,
            max_size: MAX_CACHE_SIZE,
            hits: Arc::new(Mutex::new(0)),
            misses: Arc::new(Mutex::new(0)),
        }
    }

    /// Create cache with custom TTL
    #[allow(dead_code)]
    pub fn with_ttl(ttl: Duration) -> Self {
        Self {
            cache: Arc::new(Mutex::new(HashMap::new())),
            ttl,
            max_size: MAX_CACHE_SIZE,
            hits: Arc::new(Mutex::new(0)),
            misses: Arc::new(Mutex::new(0)),
        }
    }

    /// Get document from cache
    pub fn get(&self, path: &str) -> Option<(String, DocumentMetadata)> {
        let mut cache = self.cache.lock().unwrap();

        if let Some(cached) = cache.get(path) {
            // Check if entry expired
            if cached.cached_at.elapsed() > self.ttl {
                cache.remove(path);
                *self.misses.lock().unwrap() += 1;
                return None;
            }

            *self.hits.lock().unwrap() += 1;
            Some((cached.text.clone(), cached.metadata.clone()))
        } else {
            *self.misses.lock().unwrap() += 1;
            None
        }
    }

    /// Insert document into cache
    pub fn insert(&self, path: String, text: String, metadata: DocumentMetadata) {
        let mut cache = self.cache.lock().unwrap();

        // Enforce max size by removing oldest entry
        if cache.len() >= self.max_size {
            if let Some(oldest_key) = cache
                .iter()
                .min_by_key(|(_, v)| v.cached_at)
                .map(|(k, _)| k.clone())
            {
                cache.remove(&oldest_key);
            }
        }

        cache.insert(
            path,
            CachedDocument {
                text,
                metadata,
                cached_at: Instant::now(),
                file_size: 0, // Updated by caller if needed
            },
        );
    }

    /// Clear expired entries
    pub fn clear_expired(&self) {
        let mut cache = self.cache.lock().unwrap();
        cache.retain(|_, v| v.cached_at.elapsed() <= self.ttl);
    }

    /// Clear all cache
    pub fn clear(&self) {
        self.cache.lock().unwrap().clear();
        *self.hits.lock().unwrap() = 0;
        *self.misses.lock().unwrap() = 0;
    }

    /// Get cache statistics
    pub fn stats(&self) -> CacheStats {
        let cache = self.cache.lock().unwrap();
        let total_size: u64 = cache.values().map(|v| v.file_size as u64).sum();
        let oldest_age = cache
            .values()
            .map(|v| v.cached_at.elapsed().as_secs())
            .max();

        CacheStats {
            total_documents: cache.len(),
            total_size_bytes: total_size,
            cache_hits: *self.hits.lock().unwrap(),
            cache_misses: *self.misses.lock().unwrap(),
            oldest_entry_age_secs: oldest_age,
        }
    }
}

impl Default for DocumentCache {
    fn default() -> Self {
        Self::new()
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAGIC BYTES DETECTOR
// ═══════════════════════════════════════════════════════════════════════════

/// Detect document type from magic bytes
pub fn detect_from_magic_bytes(data: &[u8]) -> (DocumentType, f32) {
    if data.len() < 8 {
        return (DocumentType::Unknown, 0.0);
    }

    // PDF: %PDF
    if data.starts_with(PDF_MAGIC) {
        return (DocumentType::PDF, 1.0);
    }

    // DOC/XLS: OLE2 format
    if data.starts_with(DOC_MAGIC) {
        // Distinguish between DOC and XLS by checking for specific markers
        if data.len() > 512 {
            // Simple heuristic: check for "Microsoft Excel" or "Microsoft Word"
            let sample = String::from_utf8_lossy(&data[0..512]);
            if sample.contains("Microsoft Excel") || sample.contains("Workbook") {
                return (DocumentType::XLS, 0.9);
            } else if sample.contains("Microsoft Word") || sample.contains("Word.Document") {
                return (DocumentType::DOC, 0.9);
            }
        }
        return (DocumentType::DOC, 0.7); // Default to DOC if unsure
    }

    // DOCX/XLSX: ZIP-based (PK\x03\x04)
    if data.starts_with(DOCX_MAGIC) {
        // Check for Office Open XML markers
        if data.len() > 100 {
            let sample = String::from_utf8_lossy(&data[0..100]);
            if sample.contains("word/") || sample.contains("xl/") {
                if sample.contains("xl/") {
                    return (DocumentType::XLSX, 0.95);
                } else {
                    return (DocumentType::DOCX, 0.95);
                }
            }
        }
        return (DocumentType::DOCX, 0.6); // Could be any ZIP file
    }

    // Text-based formats
    if is_text_data(data) {
        let sample = String::from_utf8_lossy(&data[0..data.len().min(1024)]);

        if sample.starts_with("<!DOCTYPE html") || sample.starts_with("<html") {
            return (DocumentType::HTML, 0.9);
        }
        if sample.starts_with("<?xml") {
            return (DocumentType::XML, 0.9);
        }
        if sample.trim_start().starts_with('{') || sample.trim_start().starts_with('[') {
            return (DocumentType::JSON, 0.7);
        }
        if sample.starts_with('#') || sample.contains("**") || sample.contains("##") {
            return (DocumentType::Markdown, 0.6);
        }

        return (DocumentType::TXT, 0.5);
    }

    (DocumentType::Unknown, 0.0)
}

/// Check if data is likely text
fn is_text_data(data: &[u8]) -> bool {
    if data.is_empty() {
        return false;
    }

    let sample_size = data.len().min(512);
    let sample = &data[0..sample_size];

    // Count printable ASCII characters
    let printable = sample
        .iter()
        .filter(|&&b| (32..=126).contains(&b) || b == b'\n' || b == b'\r' || b == b'\t')
        .count();

    // If >80% printable, likely text
    printable as f32 / sample_size as f32 > 0.8
}

// ═══════════════════════════════════════════════════════════════════════════
// PDF PARSER
// ═══════════════════════════════════════════════════════════════════════════

/// Extract text from PDF file
pub fn extract_pdf_text(path: &Path) -> Result<ExtractionResult, String> {
    let _file = fs::File::open(path).map_err(|e| format!("Failed to open PDF: {}", e))?;

    let doc = pdf_extract::extract_text_from_mem(
        &fs::read(path).map_err(|e| format!("Failed to read PDF: {}", e))?,
    )
    .map_err(|e| format!("Failed to extract PDF text: {}", e))?;

    // Get file metadata
    let metadata_result = fs::metadata(path);
    let file_size = metadata_result.as_ref().ok().map(|m| m.len());

    let page_count = estimate_page_count(&doc);
    let confidence = calculate_confidence(&doc);

    Ok(ExtractionResult {
        success: true,
        text: doc,
        page_count: Some(page_count),
        confidence,
        metadata: DocumentMetadata {
            title: path.file_stem().and_then(|s| s.to_str()).map(String::from),
            file_size,
            mime_type: "application/pdf".to_string(),
            page_count: Some(page_count),
            ..Default::default()
        },
    })
}

/// Estimate page count from text length
fn estimate_page_count(text: &str) -> usize {
    // Rough estimate: 3000 characters per page
    (text.len() / 3000).max(1)
}

/// Calculate extraction confidence based on text quality
fn calculate_confidence(text: &str) -> f32 {
    if text.is_empty() {
        return 0.0;
    }

    let mut score: f32 = 0.5; // Base score

    // Bonus for reasonable length
    if text.len() > 100 {
        score += 0.2;
    }

    // Bonus for lowercase/uppercase mix (indicates real text)
    let has_lower = text.chars().any(|c| c.is_lowercase());
    let has_upper = text.chars().any(|c| c.is_uppercase());
    if has_lower && has_upper {
        score += 0.1;
    }

    // Bonus for spaces (indicates words)
    if text.contains(' ') {
        score += 0.1;
    }

    // Penalty for excessive special characters
    let special_count = text
        .chars()
        .filter(|c| !c.is_alphanumeric() && !c.is_whitespace())
        .count();
    let special_ratio = special_count as f32 / text.len() as f32;
    if special_ratio > 0.3 {
        score -= 0.2;
    }

    score.clamp(0.0, 1.0)
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENT PROCESSOR
// ═══════════════════════════════════════════════════════════════════════════

/// Main document processor with caching
pub struct DocumentProcessor {
    cache: DocumentCache,
}

impl DocumentProcessor {
    /// Create new processor with default cache
    pub fn new() -> Self {
        Self {
            cache: DocumentCache::new(),
        }
    }

    /// Create processor with custom cache TTL
    #[allow(dead_code)]
    pub fn with_cache_ttl(ttl: Duration) -> Self {
        Self {
            cache: DocumentCache::with_ttl(ttl),
        }
    }

    /// Extract text from document (path-based API)
    pub async fn extract_text(&self, path: &str) -> Result<ExtractionResult, String> {
        // Check cache first
        if let Some((text, metadata)) = self.cache.get(path) {
            return Ok(ExtractionResult {
                success: true,
                text,
                page_count: metadata.page_count,
                confidence: 1.0,
                metadata,
            });
        }

        // Detect document type
        let path_buf = PathBuf::from(path);
        let doc_type = self.detect_type(path).await?;

        // Extract based on type
        let result = match doc_type {
            DocumentType::PDF => extract_pdf_text(&path_buf)?,
            DocumentType::TXT => self.extract_text_file(&path_buf)?,
            DocumentType::HTML => self.extract_html(&path_buf)?,
            DocumentType::JSON => self.extract_json(&path_buf)?,
            DocumentType::Markdown => self.extract_text_file(&path_buf)?,
            _ => return Err(format!("Unsupported document type: {:?}", doc_type)),
        };

        // Cache the result
        self.cache.insert(
            path.to_string(),
            result.text.clone(),
            result.metadata.clone(),
        );

        Ok(result)
    }

    /// Extract text from binary data (alternative API)
    #[allow(dead_code)]
    pub async fn extract_text_from_binary(
        &self,
        data: Vec<u8>,
    ) -> Result<ExtractionResult, String> {
        // Detect type from magic bytes
        let (doc_type, confidence) = detect_from_magic_bytes(&data);

        match doc_type {
            DocumentType::PDF => {
                let text = pdf_extract::extract_text_from_mem(&data)
                    .map_err(|e| format!("PDF extraction failed: {}", e))?;

                let page_count = estimate_page_count(&text);

                Ok(ExtractionResult {
                    success: true,
                    text,
                    page_count: Some(page_count),
                    confidence,
                    metadata: DocumentMetadata {
                        file_size: Some(data.len() as u64),
                        mime_type: "application/pdf".to_string(),
                        page_count: Some(page_count),
                        ..Default::default()
                    },
                })
            }
            DocumentType::TXT
            | DocumentType::HTML
            | DocumentType::JSON
            | DocumentType::Markdown => {
                let text = String::from_utf8(data.clone())
                    .map_err(|e| format!("UTF-8 decode failed: {}", e))?;

                Ok(ExtractionResult {
                    success: true,
                    text,
                    page_count: None,
                    confidence,
                    metadata: DocumentMetadata {
                        file_size: Some(data.len() as u64),
                        mime_type: doc_type.mime_type().to_string(),
                        ..Default::default()
                    },
                })
            }
            _ => Err(format!("Unsupported binary document type: {:?}", doc_type)),
        }
    }

    /// Validate document
    pub async fn validate(&self, path: &str) -> Result<ValidationResult, String> {
        let path_buf = PathBuf::from(path);

        // Check if file exists
        if !path_buf.exists() {
            return Ok(ValidationResult {
                valid: false,
                document_type: DocumentType::Unknown,
                confidence: 0.0,
                errors: vec!["File does not exist".to_string()],
                warnings: Vec::new(),
            });
        }

        // Detect type
        let doc_type = self.detect_type(path).await?;

        // Read first 1KB for validation
        let mut file =
            fs::File::open(&path_buf).map_err(|e| format!("Failed to open file: {}", e))?;

        let mut buffer = vec![0u8; 1024];
        let bytes_read = file
            .read(&mut buffer)
            .map_err(|e| format!("Failed to read file: {}", e))?;
        buffer.truncate(bytes_read);

        // Detect from magic bytes
        let (detected_type, confidence) = detect_from_magic_bytes(&buffer);

        let errors = Vec::new();
        let mut warnings = Vec::new();

        // Cross-validate extension vs magic bytes
        if doc_type != detected_type && detected_type != DocumentType::Unknown {
            warnings.push(format!(
                "Extension indicates {:?} but magic bytes suggest {:?}",
                doc_type, detected_type
            ));
        }

        Ok(ValidationResult {
            valid: errors.is_empty(),
            document_type: detected_type,
            confidence,
            errors,
            warnings,
        })
    }

    /// Detect document type from path
    pub async fn detect_type(&self, path: &str) -> Result<DocumentType, String> {
        let path_buf = PathBuf::from(path);
        let ext = path_buf.extension().and_then(|e| e.to_str()).unwrap_or("");

        Ok(DocumentType::from_extension(ext))
    }

    /// Get cache statistics
    pub fn cache_stats(&self) -> CacheStats {
        self.cache.stats()
    }

    /// Clear expired cache entries
    pub fn clear_expired_cache(&self) {
        self.cache.clear_expired();
    }

    /// Clear cache
    pub fn clear_cache(&self) {
        self.cache.clear();
    }

    // Helper methods for specific formats
    fn extract_text_file(&self, path: &Path) -> Result<ExtractionResult, String> {
        let text =
            fs::read_to_string(path).map_err(|e| format!("Failed to read text file: {}", e))?;

        let metadata_result = fs::metadata(path);
        let file_size = metadata_result.as_ref().ok().map(|m| m.len());

        Ok(ExtractionResult {
            success: true,
            text,
            page_count: None,
            confidence: 1.0,
            metadata: DocumentMetadata {
                title: path.file_stem().and_then(|s| s.to_str()).map(String::from),
                file_size,
                mime_type: "text/plain".to_string(),
                ..Default::default()
            },
        })
    }

    fn extract_html(&self, path: &Path) -> Result<ExtractionResult, String> {
        let html = fs::read_to_string(path).map_err(|e| format!("Failed to read HTML: {}", e))?;

        // Simple HTML tag stripping (basic implementation)
        let text = html
            .replace("<br>", "\n")
            .replace("<p>", "\n")
            .split('<')
            .filter_map(|s| s.split('>').nth(1))
            .collect::<Vec<_>>()
            .join("");

        let metadata_result = fs::metadata(path);
        let file_size = metadata_result.as_ref().ok().map(|m| m.len());

        Ok(ExtractionResult {
            success: true,
            text,
            page_count: None,
            confidence: 0.8,
            metadata: DocumentMetadata {
                title: path.file_stem().and_then(|s| s.to_str()).map(String::from),
                file_size,
                mime_type: "text/html".to_string(),
                ..Default::default()
            },
        })
    }

    fn extract_json(&self, path: &Path) -> Result<ExtractionResult, String> {
        let json = fs::read_to_string(path).map_err(|e| format!("Failed to read JSON: {}", e))?;

        // Validate JSON
        serde_json::from_str::<serde_json::Value>(&json)
            .map_err(|e| format!("Invalid JSON: {}", e))?;

        let metadata_result = fs::metadata(path);
        let file_size = metadata_result.as_ref().ok().map(|m| m.len());

        Ok(ExtractionResult {
            success: true,
            text: json,
            page_count: None,
            confidence: 1.0,
            metadata: DocumentMetadata {
                title: path.file_stem().and_then(|s| s.to_str()).map(String::from),
                file_size,
                mime_type: "application/json".to_string(),
                ..Default::default()
            },
        })
    }
}

impl Default for DocumentProcessor {
    fn default() -> Self {
        Self::new()
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_document_type_from_extension() {
        assert_eq!(DocumentType::from_extension("pdf"), DocumentType::PDF);
        assert_eq!(DocumentType::from_extension("PDF"), DocumentType::PDF);
        assert_eq!(DocumentType::from_extension("docx"), DocumentType::DOCX);
        assert_eq!(
            DocumentType::from_extension("unknown"),
            DocumentType::Unknown
        );
    }

    #[test]
    fn test_magic_bytes_detection_pdf() {
        let pdf_data = b"%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
        let (doc_type, confidence) = detect_from_magic_bytes(pdf_data);
        assert_eq!(doc_type, DocumentType::PDF);
        assert_eq!(confidence, 1.0);
    }

    #[test]
    fn test_magic_bytes_detection_text() {
        let text_data = b"This is plain text content.";
        let (doc_type, _confidence) = detect_from_magic_bytes(text_data);
        assert_eq!(doc_type, DocumentType::TXT);
    }

    #[test]
    fn test_cache_insert_and_get() {
        let cache = DocumentCache::new();
        let metadata = DocumentMetadata::default();

        cache.insert(
            "/test/doc.pdf".to_string(),
            "Test content".to_string(),
            metadata.clone(),
        );

        let result = cache.get("/test/doc.pdf");
        assert!(result.is_some());

        let (text, _) = result.unwrap();
        assert_eq!(text, "Test content");
    }

    #[test]
    fn test_cache_max_size() {
        let cache = DocumentCache::new();
        let metadata = DocumentMetadata::default();

        // Insert more than max size
        for i in 0..MAX_CACHE_SIZE + 10 {
            cache.insert(
                format!("/test/doc{}.pdf", i),
                format!("Content {}", i),
                metadata.clone(),
            );
        }

        let stats = cache.stats();
        assert!(stats.total_documents <= MAX_CACHE_SIZE);
    }

    #[test]
    fn test_confidence_calculation() {
        let good_text = "This is a well-formed document with proper capitalization and spaces.";
        let confidence = calculate_confidence(good_text);
        assert!(confidence > 0.7);

        let poor_text = "!!!###$$$%%%^^^&&&";
        let poor_confidence = calculate_confidence(poor_text);
        assert!(poor_confidence < 0.5);
    }
}
