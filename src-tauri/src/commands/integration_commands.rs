// ═══════════════════════════════════════════════════════════════════════════════
// 🔌 INTEGRATION COMMANDS - WHATSAPP, MONDAY.COM, PLANIUS, FILES, PROFILES
// ═══════════════════════════════════════════════════════════════════════════════

use log::info;
use serde_json::Value;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::State;
use tokio::sync::RwLock;

use crate::services::document_extractor::DocumentExtractor;
use crate::services::profile_auto_creator::{AutofillProfile, DocumentType, ProfileAutoCreator};
use crate::services::project_management_service::{
    AIProjectAnalysis, Board, ColumnValue, Item, MondayConfig, PlaniusConfig,
    ProjectManagementService,
};
use crate::services::universal_file_detector::{DetectedFile, DownloadTask, UniversalFileDetector};
use crate::services::whatsapp_service::{
    BotCommand, IncomingMessage, WhatsAppConfig, WhatsAppService,
};

// ═══════════════════════════════════════════════════════════════════════════
// STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

pub struct IntegrationState {
    pub whatsapp: Arc<RwLock<Option<WhatsAppService>>>,
    pub project_mgmt: Arc<RwLock<Option<ProjectManagementService>>>,
    pub file_detector: Arc<RwLock<UniversalFileDetector>>,
    pub profile_creator: Arc<RwLock<ProfileAutoCreator>>,
    pub document_extractor: Arc<RwLock<DocumentExtractor>>,
}

impl IntegrationState {
    pub fn new() -> anyhow::Result<Self> {
        Ok(Self {
            whatsapp: Arc::new(RwLock::new(None)),
            project_mgmt: Arc::new(RwLock::new(None)),
            file_detector: Arc::new(RwLock::new(UniversalFileDetector::new()?)),
            profile_creator: Arc::new(RwLock::new(ProfileAutoCreator::new())),
            document_extractor: Arc::new(RwLock::new(DocumentExtractor::new())),
        })
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// WHATSAPP COMMANDS
// ═══════════════════════════════════════════════════════════════════════════

#[tauri::command]
pub async fn whatsapp_connect(
    config: WhatsAppConfig,
    state: State<'_, IntegrationState>,
) -> Result<String, String> {
    let service = WhatsAppService::new(config)
        .map_err(|e| format!("Failed to create WhatsApp service: {}", e))?;

    *state.whatsapp.write().await = Some(service);

    Ok("WhatsApp connected successfully".to_string())
}

#[tauri::command]
pub async fn whatsapp_send_text(
    to: String,
    message: String,
    state: State<'_, IntegrationState>,
) -> Result<String, String> {
    let service_lock = state.whatsapp.read().await;
    let service = service_lock.as_ref().ok_or("WhatsApp not connected")?;

    service
        .send_text_message(&to, &message)
        .await
        .map_err(|e| format!("Failed to send message: {}", e))?;

    Ok("Message sent".to_string())
}

#[tauri::command]
pub async fn whatsapp_send_media(
    to: String,
    media_type: String,
    media_link: String,
    caption: Option<String>,
    state: State<'_, IntegrationState>,
) -> Result<String, String> {
    let service_lock = state.whatsapp.read().await;
    let service = service_lock.as_ref().ok_or("WhatsApp not connected")?;

    service
        .send_media_message(&to, &media_type, &media_link, caption.as_deref())
        .await
        .map_err(|e| format!("Failed to send media: {}", e))?;

    Ok("Media sent".to_string())
}

#[tauri::command]
pub async fn whatsapp_process_webhook(
    webhook_data: Value,
    state: State<'_, IntegrationState>,
) -> Result<(), String> {
    let service_lock = state.whatsapp.read().await;
    let service = service_lock.as_ref().ok_or("WhatsApp not connected")?;

    service
        .process_incoming_message(webhook_data)
        .await
        .map_err(|e| format!("Failed to process webhook: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn whatsapp_get_message_history(
    state: State<'_, IntegrationState>,
) -> Result<Vec<IncomingMessage>, String> {
    let service_lock = state.whatsapp.read().await;
    let service = service_lock.as_ref().ok_or("WhatsApp not connected")?;

    Ok(service.get_message_history().await)
}

#[tauri::command]
pub async fn whatsapp_get_pending_commands(
    state: State<'_, IntegrationState>,
) -> Result<Vec<BotCommand>, String> {
    let service_lock = state.whatsapp.read().await;
    let service = service_lock.as_ref().ok_or("WhatsApp not connected")?;

    Ok(service.get_pending_commands().await)
}

// ═══════════════════════════════════════════════════════════════════════════
// MONDAY.COM / PLANIUS COMMANDS
// ═══════════════════════════════════════════════════════════════════════════

#[tauri::command]
pub async fn monday_connect(
    api_token: String,
    api_version: String,
    planius_api_key: Option<String>,
    planius_endpoint: Option<String>,
    state: State<'_, IntegrationState>,
) -> Result<String, String> {
    let monday_config = MondayConfig {
        api_token,
        api_version,
    };

    let planius_config = if let (Some(key), Some(endpoint)) = (planius_api_key, planius_endpoint) {
        Some(PlaniusConfig {
            api_key: key,
            endpoint,
        })
    } else {
        None
    };

    let service = ProjectManagementService::new(monday_config, planius_config)
        .map_err(|e| format!("Failed to create Monday.com service: {}", e))?;

    *state.project_mgmt.write().await = Some(service);

    Ok("Monday.com connected successfully".to_string())
}

#[tauri::command]
pub async fn monday_get_boards(state: State<'_, IntegrationState>) -> Result<Vec<Board>, String> {
    let service_lock = state.project_mgmt.read().await;
    let service = service_lock.as_ref().ok_or("Monday.com not connected")?;

    service
        .get_boards()
        .await
        .map_err(|e| format!("Failed to get boards: {}", e))
}

#[tauri::command]
pub async fn monday_create_item(
    board_id: String,
    group_id: String,
    item_name: String,
    column_values: Option<HashMap<String, ColumnValue>>,
    state: State<'_, IntegrationState>,
) -> Result<Item, String> {
    let service_lock = state.project_mgmt.read().await;
    let service = service_lock.as_ref().ok_or("Monday.com not connected")?;

    service
        .create_item(&board_id, &group_id, &item_name, column_values)
        .await
        .map_err(|e| format!("Failed to create item: {}", e))
}

#[tauri::command]
pub async fn monday_update_item(
    item_id: String,
    column_values: HashMap<String, ColumnValue>,
    state: State<'_, IntegrationState>,
) -> Result<(), String> {
    let service_lock = state.project_mgmt.read().await;
    let service = service_lock.as_ref().ok_or("Monday.com not connected")?;

    service
        .update_item(&item_id, column_values)
        .await
        .map_err(|e| format!("Failed to update item: {}", e))
}

#[tauri::command]
pub async fn planius_analyze_project(
    board_id: String,
    state: State<'_, IntegrationState>,
) -> Result<AIProjectAnalysis, String> {
    let service_lock = state.project_mgmt.read().await;
    let service = service_lock.as_ref().ok_or("Monday.com not connected")?;

    service
        .analyze_project_with_ai(&board_id)
        .await
        .map_err(|e| format!("Failed to analyze project: {}", e))
}

// ═══════════════════════════════════════════════════════════════════════════
// FILE DETECTION COMMANDS
// ═══════════════════════════════════════════════════════════════════════════

#[tauri::command]
pub async fn detect_files_from_html(
    html: String,
    page_url: String,
    state: State<'_, IntegrationState>,
) -> Result<Vec<DetectedFile>, String> {
    let detector = state.file_detector.read().await;

    detector
        .detect_from_html(&html, &page_url)
        .await
        .map_err(|e| format!("Failed to detect files: {}", e))
}

#[tauri::command]
pub async fn queue_file_download(
    file: DetectedFile,
    output_dir: String,
    state: State<'_, IntegrationState>,
) -> Result<String, String> {
    let detector = state.file_detector.read().await;

    let output_path = PathBuf::from(output_dir);
    detector
        .queue_download(file, output_path)
        .await
        .map_err(|e| format!("Failed to queue download: {}", e))
}

#[tauri::command]
pub async fn download_file(
    task_id: String,
    state: State<'_, IntegrationState>,
) -> Result<(), String> {
    let detector = state.file_detector.read().await;

    detector
        .download_file(&task_id)
        .await
        .map_err(|e| format!("Failed to download file: {}", e))
}

#[tauri::command]
pub async fn get_download_status(
    task_id: String,
    state: State<'_, IntegrationState>,
) -> Result<Option<DownloadTask>, String> {
    let detector = state.file_detector.read().await;

    Ok(detector.get_download_status(&task_id).await)
}

#[tauri::command]
pub async fn get_all_downloads(
    state: State<'_, IntegrationState>,
) -> Result<Vec<DownloadTask>, String> {
    let detector = state.file_detector.read().await;

    Ok(detector.get_all_downloads().await)
}

#[tauri::command]
pub async fn get_detected_files(
    state: State<'_, IntegrationState>,
) -> Result<Vec<DetectedFile>, String> {
    let detector = state.file_detector.read().await;

    Ok(detector.get_detected_files().await)
}

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE AUTO-CREATION COMMANDS
// ═══════════════════════════════════════════════════════════════════════════

#[tauri::command]
pub async fn create_profile_from_data(
    extracted_data: HashMap<String, String>,
    document_path: Option<String>,
    document_type: DocumentType,
    state: State<'_, IntegrationState>,
) -> Result<AutofillProfile, String> {
    let creator = state.profile_creator.read().await;

    let doc_path = document_path.map(PathBuf::from);

    creator
        .create_profile_from_data(extracted_data, doc_path, document_type)
        .map_err(|e| format!("Failed to create profile: {}", e))
}

// ═══════════════════════════════════════════════════════════════════════════
// INTEGRATED PIPELINE COMMANDS
// ═══════════════════════════════════════════════════════════════════════════

/// Complete pipeline: Detect → Download → Extract → Create Profile
#[tauri::command]
pub async fn auto_process_document(
    page_url: String,
    html: String,
    output_dir: String,
    document_type: DocumentType,
    state: State<'_, IntegrationState>,
) -> Result<AutofillProfile, String> {
    // 1. Detect files
    let files = {
        let detector = state.file_detector.read().await;
        detector
            .detect_from_html(&html, &page_url)
            .await
            .map_err(|e| format!("File detection failed: {}", e))?
    };

    if files.is_empty() {
        return Err("No files detected".to_string());
    }

    // 2. Download first file (PDF priority)
    let file_to_download = files
        .iter()
        .find(|f| {
            matches!(
                f.file_type,
                crate::services::universal_file_detector::FileType::PDF
            )
        })
        .or_else(|| files.first())
        .ok_or("No suitable file found")?
        .clone();

    let task_id = {
        let detector = state.file_detector.read().await;
        let output_path = PathBuf::from(&output_dir);
        detector
            .queue_download(file_to_download.clone(), output_path)
            .await
            .map_err(|e| format!("Queue download failed: {}", e))?
    };

    // 3. Execute download
    {
        let detector = state.file_detector.read().await;
        detector
            .download_file(&task_id)
            .await
            .map_err(|e| format!("Download failed: {}", e))?;
    }

    // 4. Get download result
    let downloaded_file = {
        let detector = state.file_detector.read().await;
        detector
            .get_download_status(&task_id)
            .await
            .ok_or("Download task not found")?
    };

    // 5. Extract data from downloaded file
    let extracted_data = {
        let extractor = state.document_extractor.read().await;
        let extraction = extractor
            .extract_from_file(&downloaded_file.output_path)
            .await
            .map_err(|e| format!("Data extraction failed: {}", e))?;

        extraction.fields
    };

    info!("✅ Extracted {} fields from document", extracted_data.len());

    // 6. Create profile
    let creator = state.profile_creator.read().await;
    let doc_path = Some(downloaded_file.output_path);

    creator
        .create_profile_from_data(extracted_data, doc_path, document_type)
        .map_err(|e| format!("Profile creation failed: {}", e))
}
