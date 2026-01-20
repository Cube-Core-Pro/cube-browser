use std::sync::Arc;
use tauri::State;

use crate::services::batch_queue_service::{
    BatchQueueService, BatchQueueStatus, BatchResult, QueueItem,
};

#[tauri::command]
pub async fn batch_add_to_queue(
    video_path: String,
    session_name: String,
    batch_service: State<'_, Arc<BatchQueueService>>,
) -> Result<String, String> {
    batch_service
        .add_to_queue(video_path, session_name)
        .map_err(|e| format!("Failed to add to queue: {}", e))
}

#[tauri::command]
pub async fn batch_remove_from_queue(
    item_id: String,
    batch_service: State<'_, Arc<BatchQueueService>>,
) -> Result<(), String> {
    batch_service
        .remove_from_queue(&item_id)
        .map_err(|e| format!("Failed to remove from queue: {}", e))
}

#[tauri::command]
pub async fn batch_clear_queue(
    batch_service: State<'_, Arc<BatchQueueService>>,
) -> Result<usize, String> {
    batch_service
        .clear_queue()
        .map_err(|e| format!("Failed to clear queue: {}", e))
}

#[tauri::command]
pub async fn batch_start_processing(
    batch_service: State<'_, Arc<BatchQueueService>>,
) -> Result<(), String> {
    batch_service
        .start_processing()
        .map_err(|e| format!("Failed to start processing: {}", e))
}

#[tauri::command]
pub async fn batch_pause_processing(
    batch_service: State<'_, Arc<BatchQueueService>>,
) -> Result<(), String> {
    batch_service
        .pause_processing()
        .map_err(|e| format!("Failed to pause processing: {}", e))
}

#[tauri::command]
pub async fn batch_resume_processing(
    batch_service: State<'_, Arc<BatchQueueService>>,
) -> Result<(), String> {
    batch_service
        .resume_processing()
        .map_err(|e| format!("Failed to resume processing: {}", e))
}

#[tauri::command]
pub async fn batch_stop_processing(
    batch_service: State<'_, Arc<BatchQueueService>>,
) -> Result<(), String> {
    batch_service
        .stop_processing()
        .map_err(|e| format!("Failed to stop processing: {}", e))
}

#[tauri::command]
pub async fn batch_get_status(
    batch_service: State<'_, Arc<BatchQueueService>>,
) -> Result<BatchQueueStatus, String> {
    Ok(batch_service.get_status())
}

#[tauri::command]
pub async fn batch_get_all_items(
    batch_service: State<'_, Arc<BatchQueueService>>,
) -> Result<Vec<QueueItem>, String> {
    Ok(batch_service.get_all_items())
}

#[tauri::command]
pub async fn batch_get_item(
    item_id: String,
    batch_service: State<'_, Arc<BatchQueueService>>,
) -> Result<Option<QueueItem>, String> {
    Ok(batch_service.get_item(&item_id))
}

#[tauri::command]
pub async fn batch_get_results(
    batch_service: State<'_, Arc<BatchQueueService>>,
) -> Result<BatchResult, String> {
    Ok(batch_service.get_results())
}
