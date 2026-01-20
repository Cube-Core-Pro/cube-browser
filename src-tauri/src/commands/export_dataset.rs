use crate::services::export_service::ExportService;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub async fn export_dataset_coco(
    dataset_id: i64,
    output_dir: String,
    copy_images: bool,
    export_service: State<'_, Arc<ExportService>>,
) -> Result<String, String> {
    let output_path = PathBuf::from(output_dir);
    export_service
        .export_coco(dataset_id, &output_path, copy_images)
        .map_err(|e| format!("Failed to export COCO dataset: {}", e))
}

#[tauri::command]
pub async fn export_dataset_yolo(
    dataset_id: i64,
    output_dir: String,
    copy_images: bool,
    export_service: State<'_, Arc<ExportService>>,
) -> Result<String, String> {
    let output_path = PathBuf::from(output_dir);
    export_service
        .export_yolo(dataset_id, &output_path, copy_images)
        .map_err(|e| format!("Failed to export YOLO dataset: {}", e))
}

#[tauri::command]
pub async fn export_dataset_tensorflow(
    dataset_id: i64,
    output_dir: String,
    export_service: State<'_, Arc<ExportService>>,
) -> Result<String, String> {
    let output_path = PathBuf::from(output_dir);
    export_service
        .export_tensorflow(dataset_id, &output_path)
        .map_err(|e| format!("Failed to export TensorFlow dataset: {}", e))
}

#[tauri::command]
pub async fn export_dataset_pytorch(
    dataset_id: i64,
    output_dir: String,
    export_service: State<'_, Arc<ExportService>>,
) -> Result<String, String> {
    let output_path = PathBuf::from(output_dir);
    export_service
        .export_pytorch(dataset_id, &output_path)
        .map_err(|e| format!("Failed to export PyTorch dataset: {}", e))
}
