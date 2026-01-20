// OCR Commands - Tauri commands for OCR operations

use crate::ocr::*;
use base64::{engine::general_purpose, Engine as _};
use tauri::command;

// ============================================================================
// OCR EXTRACTION COMMANDS
// ============================================================================

/// Extract text from image file
#[command]
pub async fn ocr_extract_from_file(
    path: String,
    config: Option<OCRConfig>,
) -> Result<OCRResult, String> {
    let engine = OCREngine::new().map_err(|e| e.to_string())?;

    if let Some(cfg) = config {
        let mut eng = engine;
        eng.set_config(cfg);
        eng.extract_from_file(path).await.map_err(|e| e.to_string())
    } else {
        engine
            .extract_from_file(path)
            .await
            .map_err(|e| e.to_string())
    }
}

/// Extract text from base64 encoded image
#[command]
pub async fn ocr_extract_from_base64(
    base64_image: String,
    config: Option<OCRConfig>,
) -> Result<OCRResult, String> {
    let engine = OCREngine::new().map_err(|e| e.to_string())?;

    if let Some(cfg) = config {
        let mut eng = engine;
        eng.set_config(cfg);
        eng.extract_from_base64(&base64_image)
            .await
            .map_err(|e| e.to_string())
    } else {
        engine
            .extract_from_base64(&base64_image)
            .await
            .map_err(|e| e.to_string())
    }
}

/// Extract text from image region
#[command]
pub async fn ocr_extract_from_region(
    path: String,
    region: ExtractionRegion,
    config: Option<OCRConfig>,
) -> Result<OCRResult, String> {
    let engine = OCREngine::new().map_err(|e| e.to_string())?;

    if let Some(cfg) = config {
        let mut eng = engine;
        eng.set_config(cfg);
        eng.extract_from_region(path, region)
            .await
            .map_err(|e| e.to_string())
    } else {
        engine
            .extract_from_region(path, region)
            .await
            .map_err(|e| e.to_string())
    }
}

// ============================================================================
// LANGUAGE MANAGEMENT COMMANDS
// ============================================================================

/// Get all available languages
#[command]
pub async fn ocr_get_available_languages() -> Result<Vec<Language>, String> {
    let manager = LanguageManager::new();
    Ok(manager.available_languages())
}

/// Get installed languages
#[command]
pub async fn ocr_get_installed_languages() -> Result<Vec<Language>, String> {
    let manager = LanguageManager::new();
    Ok(manager.installed_languages())
}

/// Check if language is available
#[command]
pub async fn ocr_is_language_available(code: String) -> Result<bool, String> {
    let manager = LanguageManager::new();
    Ok(manager.is_available(&code))
}

/// Detect language from text
#[command]
pub async fn ocr_detect_language(text: String) -> Result<Vec<String>, String> {
    let manager = LanguageManager::new();
    Ok(manager.detect_language_hints(&text))
}

// ============================================================================
// CONFIGURATION COMMANDS
// ============================================================================

/// Get default OCR configuration
#[command]
pub async fn ocr_get_default_config() -> Result<OCRConfig, String> {
    Ok(OCRConfig::default())
}

/// Validate OCR configuration
#[command]
pub async fn ocr_validate_config(config: OCRConfig) -> Result<bool, String> {
    let mut engine = OCREngine::new().map_err(|e| e.to_string())?;
    engine.set_config(config);
    engine.validate_config().map_err(|e| e.to_string())?;
    Ok(true)
}

// ============================================================================
// UTILITY COMMANDS
// ============================================================================

/// Get OCR engine version
#[command]
pub async fn ocr_get_version() -> Result<String, String> {
    let engine = OCREngine::new().map_err(|e| e.to_string())?;
    Ok(engine.version())
}

/// Preprocess image and return base64
#[command]
pub async fn ocr_preprocess_image(
    base64_image: String,
    config: PreprocessConfig,
) -> Result<String, String> {
    let preprocessor = ImagePreprocessor::new();

    // Decode base64
    let image_bytes = general_purpose::STANDARD
        .decode(&base64_image)
        .map_err(|e| format!("Base64 decode failed: {}", e))?;

    // Load image
    let image =
        image::load_from_memory(&image_bytes).map_err(|e| format!("Image load failed: {}", e))?;

    // Process
    let processed = preprocessor
        .process(image, &config)
        .map_err(|e| e.to_string())?;

    // Convert back to base64
    let mut buffer = Vec::new();
    processed
        .write_to(
            &mut std::io::Cursor::new(&mut buffer),
            image::ImageFormat::Png,
        )
        .map_err(|e| format!("Image encode failed: {}", e))?;

    Ok(general_purpose::STANDARD.encode(buffer))
}
