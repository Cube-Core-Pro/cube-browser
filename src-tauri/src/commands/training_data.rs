use crate::services::training_data_manager::{
    FrameAnalysisRecord, FrameLabel, FrameMetadata, TrainingDataManager, TrainingDataset,
    TrainingSession, TrainingStatistics,
};
use std::sync::Arc;
use tauri::State;

// ============================================================================
// SESSION COMMANDS
// ============================================================================

#[tauri::command]
pub async fn create_training_session(
    name: String,
    description: Option<String>,
    video_path: String,
    manager: State<'_, Arc<TrainingDataManager>>,
) -> Result<i64, String> {
    manager
        .create_session(name, description, video_path)
        .map_err(|e| format!("Failed to create training session: {}", e))
}

#[tauri::command]
pub async fn get_training_session(
    session_id: i64,
    manager: State<'_, Arc<TrainingDataManager>>,
) -> Result<TrainingSession, String> {
    manager
        .get_session(session_id)
        .map_err(|e| format!("Failed to get training session: {}", e))
}

#[tauri::command]
pub async fn list_training_sessions(
    status: Option<String>,
    manager: State<'_, Arc<TrainingDataManager>>,
) -> Result<Vec<TrainingSession>, String> {
    manager
        .list_sessions(status)
        .map_err(|e| format!("Failed to list training sessions: {}", e))
}

#[tauri::command]
pub async fn update_session_status(
    session_id: i64,
    status: String,
    manager: State<'_, Arc<TrainingDataManager>>,
) -> Result<(), String> {
    manager
        .update_session_status(session_id, status)
        .map_err(|e| format!("Failed to update session status: {}", e))
}

#[tauri::command]
pub async fn delete_training_session(
    session_id: i64,
    manager: State<'_, Arc<TrainingDataManager>>,
) -> Result<(), String> {
    manager
        .delete_session(session_id)
        .map_err(|e| format!("Failed to delete training session: {}", e))
}

// ============================================================================
// FRAME COMMANDS
// ============================================================================

#[tauri::command]
pub async fn add_training_frame(
    session_id: i64,
    frame_path: String,
    frame_number: i32,
    timestamp_seconds: f64,
    file_size_bytes: i64,
    manager: State<'_, Arc<TrainingDataManager>>,
) -> Result<i64, String> {
    manager
        .add_frame(
            session_id,
            frame_path,
            frame_number,
            timestamp_seconds,
            file_size_bytes,
        )
        .map_err(|e| format!("Failed to add training frame: {}", e))
}

#[tauri::command]
pub async fn get_session_frames(
    session_id: i64,
    manager: State<'_, Arc<TrainingDataManager>>,
) -> Result<Vec<FrameMetadata>, String> {
    manager
        .get_session_frames(session_id)
        .map_err(|e| format!("Failed to get session frames: {}", e))
}

#[tauri::command]
pub async fn search_frames_by_features(
    features: Vec<String>,
    manager: State<'_, Arc<TrainingDataManager>>,
) -> Result<Vec<FrameMetadata>, String> {
    manager
        .search_frames_by_features(features)
        .map_err(|e| format!("Failed to search frames: {}", e))
}

// ============================================================================
// ANALYSIS COMMANDS
// ============================================================================

#[tauri::command]
pub async fn save_frame_analysis(
    frame_id: i64,
    features: Vec<String>,
    ai_description: Option<String>,
    confidence: f32,
    manager: State<'_, Arc<TrainingDataManager>>,
) -> Result<i64, String> {
    manager
        .save_analysis(frame_id, features, ai_description, confidence)
        .map_err(|e| format!("Failed to save frame analysis: {}", e))
}

#[tauri::command]
pub async fn get_frame_analysis(
    frame_id: i64,
    manager: State<'_, Arc<TrainingDataManager>>,
) -> Result<Option<FrameAnalysisRecord>, String> {
    manager
        .get_frame_analysis(frame_id)
        .map_err(|e| format!("Failed to get frame analysis: {}", e))
}

// ============================================================================
// LABELING COMMANDS
// ============================================================================

#[tauri::command]
pub async fn add_frame_label(
    frame_id: i64,
    label_type: String,
    label_value: String,
    created_by: Option<String>,
    manager: State<'_, Arc<TrainingDataManager>>,
) -> Result<i64, String> {
    manager
        .add_label(frame_id, label_type, label_value, created_by)
        .map_err(|e| format!("Failed to add frame label: {}", e))
}

#[tauri::command]
pub async fn get_frame_labels(
    frame_id: i64,
    manager: State<'_, Arc<TrainingDataManager>>,
) -> Result<Vec<FrameLabel>, String> {
    manager
        .get_frame_labels(frame_id)
        .map_err(|e| format!("Failed to get frame labels: {}", e))
}

// ============================================================================
// DATASET COMMANDS
// ============================================================================

#[tauri::command]
pub async fn create_training_dataset(
    name: String,
    description: Option<String>,
    session_ids: Vec<i64>,
    export_format: String,
    manager: State<'_, Arc<TrainingDataManager>>,
) -> Result<i64, String> {
    manager
        .create_dataset(name, description, session_ids, export_format)
        .map_err(|e| format!("Failed to create training dataset: {}", e))
}

#[tauri::command]
pub async fn list_training_datasets(
    manager: State<'_, Arc<TrainingDataManager>>,
) -> Result<Vec<TrainingDataset>, String> {
    manager
        .list_datasets()
        .map_err(|e| format!("Failed to list training datasets: {}", e))
}

#[tauri::command]
pub async fn mark_dataset_exported(
    dataset_id: i64,
    manager: State<'_, Arc<TrainingDataManager>>,
) -> Result<(), String> {
    manager
        .mark_dataset_exported(dataset_id)
        .map_err(|e| format!("Failed to mark dataset as exported: {}", e))
}

// ============================================================================
// STATISTICS COMMANDS
// ============================================================================

#[tauri::command]
pub async fn get_training_statistics(
    manager: State<'_, Arc<TrainingDataManager>>,
) -> Result<TrainingStatistics, String> {
    manager
        .get_statistics()
        .map_err(|e| format!("Failed to get training statistics: {}", e))
}
