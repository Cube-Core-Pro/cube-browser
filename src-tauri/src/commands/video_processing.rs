use crate::services::ai_service::AIService;
use crate::services::video_processing::{
    ExtractionResult, FrameAnalysis, FrameExtractionConfig, VideoInfo, VideoProcessingService,
};
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;

pub struct VideoServiceState(pub Arc<Mutex<VideoProcessingService>>);

#[tauri::command]
pub async fn get_video_info(
    video_path: String,
    state: State<'_, VideoServiceState>,
) -> Result<VideoInfo, String> {
    let service = state.0.lock().await;
    service.get_video_info(&video_path)
}

#[tauri::command]
pub async fn extract_video_frames(
    video_path: String,
    fps: Option<f64>,
    quality: Option<u8>,
    output_format: Option<String>,
    start_time: Option<f64>,
    duration: Option<f64>,
    state: State<'_, VideoServiceState>,
) -> Result<ExtractionResult, String> {
    let config = FrameExtractionConfig {
        fps: fps.unwrap_or(2.0),
        quality: quality.unwrap_or(3),
        output_format: output_format.unwrap_or_else(|| "jpg".to_string()),
        start_time,
        duration,
    };

    let service = state.0.lock().await;
    service.extract_frames(&video_path, config)
}

#[tauri::command]
pub async fn cleanup_video_frames(
    output_directory: String,
    state: State<'_, VideoServiceState>,
) -> Result<(), String> {
    let service = state.0.lock().await;
    service.cleanup_frames(&output_directory)
}

#[tauri::command]
pub async fn get_video_temp_dir(state: State<'_, VideoServiceState>) -> Result<String, String> {
    let service = state.0.lock().await;
    Ok(service.get_temp_dir())
}

#[tauri::command]
pub async fn analyze_video_frames(
    frames: Vec<String>,
    analysis_prompt: Option<String>,
    ai: State<'_, Arc<AIService>>,
) -> Result<Vec<FrameAnalysis>, String> {
    // Clone the AI service Arc to avoid holding references across await
    let ai_clone = Arc::clone(&ai);
    
    // Analyze frames with AI Vision API
    let results = ai_clone.analyze_frames_batch(frames, analysis_prompt).await?;

    // Convert FrameAnalysisResult to FrameAnalysis
    let frame_analyses: Vec<FrameAnalysis> = results
        .into_iter()
        .map(|result| FrameAnalysis {
            frame_path: result.frame_path,
            features: result.features,
            ai_description: result.ai_description,
            confidence: result.confidence as f32, // Convert f64 to f32
        })
        .collect();

    Ok(frame_analyses)
}
