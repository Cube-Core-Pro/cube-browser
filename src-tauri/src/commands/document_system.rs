// ═══════════════════════════════════════════════════════════════════════════
// CUBE Elite Workspace - Document System Commands
// ═══════════════════════════════════════════════════════════════════════════

use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

#[allow(deprecated)]
use crate::document::{
    CacheStats, DocumentDownloader, DocumentParser, DocumentProcessor, DocumentType,
    DocumentValidator, DownloadConfig, DownloadResult, ValidationResult,
};

// ═══════════════════════════════════════════════════════════════════════════
// STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

/// Global document system state
#[allow(deprecated)]
pub struct DocumentState {
    pub downloader: Mutex<DocumentDownloader>,
    pub parser: Mutex<DocumentParser>,
    pub validator: Mutex<DocumentValidator>,
    pub processor: Mutex<DocumentProcessor>,
}

impl DocumentState {
    #[allow(deprecated)]
    pub fn new() -> Self {
        Self {
            downloader: Mutex::new(DocumentDownloader::new()),
            parser: Mutex::new(DocumentParser::new()),
            validator: Mutex::new(DocumentValidator::new()),
            processor: Mutex::new(DocumentProcessor::new()),
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// COMMANDS
// ═══════════════════════════════════════════════════════════════════════════

/// Download document from URL or file path
///
/// # Example
/// ```typescript
/// const result = await invoke('document_download', {
///   config: {
///     url: 'https://example.com/document.pdf',
///     strict_mode: true,
///     min_size: 2048,
///     max_size: 104857600,
///     validate_binary: true,
///     use_cache: true,
///   }
/// });
/// ```
#[tauri::command]
pub async fn document_download(
    config: DownloadConfig,
    state: State<'_, DocumentState>,
) -> Result<DownloadResult, String> {
    // Clone downloader to avoid holding lock across await
    let mut downloader = {
        let guard = state
            .downloader
            .lock()
            .map_err(|e| format!("Failed to lock downloader: {}", e))?;
        guard.clone()
    };

    downloader
        .download(&config)
        .map_err(|e| format!("Download failed: {}", e))
}

/// Download document from file path (convenience method)
///
/// # Example
/// ```typescript
/// const result = await invoke('document_download_file', {
///   url: 'https://example.com/document.pdf',
///   savePath: '/path/to/save.pdf'
/// });
/// ```
#[tauri::command]
pub async fn document_download_file(
    url: String,
    save_path: String,
    state: State<'_, DocumentState>,
) -> Result<DownloadResult, String> {
    // Clone downloader to avoid holding lock across await
    let mut downloader = {
        let guard = state
            .downloader
            .lock()
            .map_err(|e| format!("Failed to lock downloader: {}", e))?;
        guard.clone()
    };

    downloader
        .download_file(url, save_path, None)
        .await
        .map_err(|e| format!("Download failed: {}", e))
}

/// Download document from URL (convenience method)
///
/// # Example
/// ```typescript
/// const result = await invoke('document_download_url', {
///   url: 'https://example.com/document.pdf',
///   savePath: '/path/to/save.pdf'
/// });
/// ```
#[tauri::command]
pub async fn document_download_url(
    url: String,
    save_path: String,
    state: State<'_, DocumentState>,
) -> Result<DownloadResult, String> {
    // Clone downloader to avoid holding lock across await
    let mut downloader = {
        let guard = state
            .downloader
            .lock()
            .map_err(|e| format!("Failed to lock downloader: {}", e))?;
        guard.clone()
    };

    downloader
        .download_url(url, save_path)
        .await
        .map_err(|e| format!("Download failed: {}", e))
}

/// Validate document file path
///
/// # Example
/// ```typescript
/// const result = await invoke('document_validate', {
///   path: '/path/to/document.pdf'
/// });
/// ```
#[tauri::command]
pub async fn document_validate(
    path: String,
    state: State<'_, DocumentState>,
) -> Result<ValidationResult, String> {
    let validator = state
        .validator
        .lock()
        .map_err(|e| format!("Failed to lock validator: {}", e))?
        .clone();

    validator.validate(&path)
}

/// Validate document with automatic type detection
///
/// # Example
/// ```typescript
/// const result = await invoke('document_validate_any', {
///   path: '/path/to/document.pdf'
/// });
/// ```
#[tauri::command]
pub async fn document_validate_any(
    path: String,
    state: State<'_, DocumentState>,
) -> Result<ValidationResult, String> {
    let validator = state
        .validator
        .lock()
        .map_err(|e| format!("Failed to lock validator: {}", e))?
        .clone();

    validator.validate_any(path).await
}

/// Detect document type from file path
///
/// # Example
/// ```typescript
/// const docType = await invoke('document_detect_type', {
///   path: '/path/to/document.pdf'
/// });
/// ```
#[tauri::command]
pub async fn document_detect_type(
    path: String,
    state: State<'_, DocumentState>,
) -> Result<DocumentType, String> {
    let validator = state
        .validator
        .lock()
        .map_err(|e| format!("Failed to lock validator: {}", e))?
        .clone();

    validator.detect_type(path).await
}

/// Parse document and extract text
///
/// # Example
/// ```typescript
/// const text = await invoke('document_parse', {
///   path: '/path/to/document.pdf'
/// });
/// ```
#[tauri::command]
pub async fn document_parse(
    path: String,
    state: State<'_, DocumentState>,
) -> Result<String, String> {
    let parser = state
        .parser
        .lock()
        .map_err(|e| format!("Failed to lock parser: {}", e))?
        .clone();

    parser
        .extract_text(path)
        .await
        .map_err(|e| format!("Parse failed: {}", e))
}

/// Extract text from document
///
/// # Example
/// ```typescript
/// const text = await invoke('document_extract_text', {
///   path: '/path/to/document.pdf'
/// });
/// ```
#[tauri::command]
pub async fn document_extract_text(
    path: String,
    state: State<'_, DocumentState>,
) -> Result<String, String> {
    let parser = state
        .parser
        .lock()
        .map_err(|e| format!("Failed to lock parser: {}", e))?
        .clone();

    parser
        .extract_text(path)
        .await
        .map_err(|e| format!("Text extraction failed: {}", e))
}

/// Get cache statistics
///
/// # Example
/// ```typescript
/// const stats = await invoke('document_cache_stats');
/// ```
#[tauri::command]
pub fn document_cache_stats(state: State<'_, DocumentState>) -> Result<CacheStats, String> {
    let downloader = state
        .downloader
        .lock()
        .map_err(|e| format!("Failed to lock downloader: {}", e))?;

    Ok(downloader.cache_stats())
}

/// Clear document cache
///
/// # Example
/// ```typescript
/// await invoke('document_cache_clear');
/// ```
#[tauri::command]
pub fn document_cache_clear(state: State<'_, DocumentState>) -> Result<(), String> {
    let downloader = state
        .downloader
        .lock()
        .map_err(|e| format!("Failed to lock downloader: {}", e))?;

    downloader.clear_cache();
    Ok(())
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER TYPES
// ═══════════════════════════════════════════════════════════════════════════

/// Document info response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentInfo {
    pub detected_type: DocumentType,
    pub path: String,
    pub valid: bool,
}

/// Get document info (type, format, validation)
///
/// # Example
/// ```typescript
/// const info = await invoke('document_get_info', {
///   path: '/path/to/document.pdf'
/// });
/// ```
#[tauri::command]
pub async fn document_get_info(
    path: String,
    state: State<'_, DocumentState>,
) -> Result<DocumentInfo, String> {
    let validator = state
        .validator
        .lock()
        .map_err(|e| format!("Failed to lock validator: {}", e))?
        .clone();

    let detected_type = validator.detect_type(path.clone()).await?;
    let validation = validator.validate_any(path.clone()).await?;

    Ok(DocumentInfo {
        detected_type,
        path,
        valid: validation.valid,
    })
}

// ═══════════════════════════════════════════════════════════════════════════
// CACHE MANAGEMENT COMMANDS
// ═══════════════════════════════════════════════════════════════════════════

/// Clear expired cache entries
#[tauri::command]
pub async fn document_clear_expired_cache(state: State<'_, DocumentState>) -> Result<(), String> {
    let processor = state
        .processor
        .lock()
        .map_err(|e| format!("Failed to lock processor: {}", e))?;

    processor.clear_expired_cache();
    Ok(())
}

/// Clear all cache
#[tauri::command]
pub async fn document_clear_cache(state: State<'_, DocumentState>) -> Result<(), String> {
    let processor = state
        .processor
        .lock()
        .map_err(|e| format!("Failed to lock processor: {}", e))?;

    processor.clear_cache();
    Ok(())
}

/// Get cache statistics
#[tauri::command]
pub async fn document_get_cache_stats(
    state: State<'_, DocumentState>,
) -> Result<serde_json::Value, String> {
    let processor = state
        .processor
        .lock()
        .map_err(|e| format!("Failed to lock processor: {}", e))?;

    let stats = processor.cache_stats();

    Ok(serde_json::json!({
        "total_documents": stats.total_documents,
        "total_size_bytes": stats.total_size_bytes,
        "cache_hits": stats.cache_hits,
        "cache_misses": stats.cache_misses,
        "oldest_entry_age_secs": stats.oldest_entry_age_secs,
        "hit_rate": if stats.cache_hits + stats.cache_misses > 0 {
            (stats.cache_hits as f64) / ((stats.cache_hits + stats.cache_misses) as f64)
        } else {
            0.0
        }
    }))
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_document_state_creation() {
        let state = DocumentState::new();

        // Should be able to lock all components
        assert!(state.downloader.lock().is_ok());
        assert!(state.parser.lock().is_ok());
        assert!(state.validator.lock().is_ok());
    }

    // NOTE: This test is disabled because Tauri's State<'_, T> cannot be
    // constructed directly with State::from(&state). The State type is designed
    // to work only within Tauri's dependency injection system.
    // #[tokio::test]
    // async fn test_validate_pdf_magic_bytes() {
    //     let state = DocumentState::new();
    //     let pdf_data = b"%PDF-1.4\n".to_vec();
    //
    //     let result = document_validate_any(pdf_data, State::from(&state));
    //     assert!(result.is_ok());
    //
    //     let validation = result.unwrap();
    //     assert!(validation.detected_type.is_some());
    //     assert!(validation.confidence > 0.0);
    // }
}
