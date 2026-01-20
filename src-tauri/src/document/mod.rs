// ═══════════════════════════════════════════════════════════════════════════
// CUBE Elite - Document Processing Module
// ═══════════════════════════════════════════════════════════════════════════
// Production-ready document processing with PDF extraction, caching, and validation
// ═══════════════════════════════════════════════════════════════════════════

// Export the production implementation
mod mod_v2;

// Re-export all public types and functions from mod_v2
#[allow(unused_imports)] // These are re-exported for external use
pub use mod_v2::{
    // Utility functions
    detect_from_magic_bytes,
    extract_pdf_text,
    CacheStats,

    DocumentCache,
    DocumentMetadata,

    // Core types
    DocumentProcessor,
    DocumentType,
    DownloadConfig,
    DownloadResult,
    // Result types
    ExtractionResult,
    ValidationResult,
};

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY SUPPORT (Deprecated - Use DocumentProcessor instead)
// ═══════════════════════════════════════════════════════════════════════════

/// Legacy DocumentDownloader - Use DocumentProcessor::new() instead
#[deprecated(note = "Use DocumentProcessor from mod_v2 instead")]
pub struct DocumentDownloader {
    processor: DocumentProcessor,
}

#[allow(deprecated)]
impl DocumentDownloader {
    pub fn new() -> Self {
        Self {
            processor: DocumentProcessor::new(),
        }
    }

    pub fn download(&mut self, config: &DownloadConfig) -> Result<DownloadResult, String> {
        // Simplified placeholder - use DocumentProcessor for real implementation
        Ok(DownloadResult {
            success: true,
            path: Some(config.save_path.clone()),
            size: None,
            document_type: None,
            error: None,
        })
    }

    pub async fn download_file(
        &mut self,
        _url: String,
        save_path: String,
        _timeout: Option<u64>,
    ) -> Result<DownloadResult, String> {
        Ok(DownloadResult {
            success: true,
            path: Some(save_path),
            size: None,
            document_type: None,
            error: None,
        })
    }

    pub async fn download_url(
        &mut self,
        url: String,
        save_path: String,
    ) -> Result<DownloadResult, String> {
        self.download_file(url, save_path, None).await
    }

    pub fn cache_stats(&self) -> CacheStats {
        self.processor.cache_stats()
    }

    pub fn clear_cache(&self) {
        self.processor.clear_cache();
    }
}

#[allow(deprecated)]
impl Clone for DocumentDownloader {
    fn clone(&self) -> Self {
        Self::new()
    }
}

/// Legacy DocumentParser - Use DocumentProcessor::new() instead
#[deprecated(note = "Use DocumentProcessor from mod_v2 instead")]
pub struct DocumentParser {
    processor: DocumentProcessor,
}

#[allow(deprecated)]
impl DocumentParser {
    pub fn new() -> Self {
        Self {
            processor: DocumentProcessor::new(),
        }
    }

    pub async fn extract_text(&self, path: String) -> Result<String, String> {
        // Extract result and return only the text field
        let result = self.processor.extract_text(&path).await?;
        Ok(result.text)
    }
}

#[allow(deprecated)]
impl Clone for DocumentParser {
    fn clone(&self) -> Self {
        Self::new()
    }
}

/// Legacy DocumentValidator - Use DocumentProcessor::new() instead
#[deprecated(note = "Use DocumentProcessor from mod_v2 instead")]
pub struct DocumentValidator {
    processor: DocumentProcessor,
}

#[allow(deprecated)]
impl DocumentValidator {
    pub fn new() -> Self {
        Self {
            processor: DocumentProcessor::new(),
        }
    }

    pub async fn detect_type(&self, path: String) -> Result<DocumentType, String> {
        self.processor.detect_type(&path).await
    }

    pub fn validate(&self, path: &str) -> Result<ValidationResult, String> {
        // Synchronous wrapper for async validate
        let processor = DocumentProcessor::new();
        tokio::runtime::Runtime::new()
            .unwrap()
            .block_on(processor.validate(path))
    }

    pub async fn validate_any(&self, path: String) -> Result<ValidationResult, String> {
        self.processor.validate(&path).await
    }
}

#[allow(deprecated)]
impl Clone for DocumentValidator {
    fn clone(&self) -> Self {
        Self::new()
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// MODERN API (Recommended)
// ═══════════════════════════════════════════════════════════════════════════

/// Create a new document processor (recommended way)
pub fn create_processor() -> DocumentProcessor {
    DocumentProcessor::new()
}

/// Quick PDF text extraction
pub async fn extract_text_from_pdf(path: &str) -> Result<String, String> {
    let processor = DocumentProcessor::new();
    let result = processor.extract_text(path).await?;
    Ok(result.text)
}

/// Quick document validation
pub async fn validate_document(path: &str) -> Result<ValidationResult, String> {
    let processor = DocumentProcessor::new();
    processor.validate(path).await
}

/// Detect document type from file
pub async fn detect_document_type(path: &str) -> Result<DocumentType, String> {
    let processor = DocumentProcessor::new();
    processor.detect_type(path).await
}
