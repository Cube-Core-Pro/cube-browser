use chrono::Utc;
use log::{error, info, warn};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, VecDeque};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

use crate::services::training_data_manager::TrainingDataManager;
use crate::services::video_processing::VideoProcessingService;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum QueueItemStatus {
    Pending,
    Processing,
    Completed,
    Failed,
    Paused,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueueItem {
    pub id: String,
    pub video_path: String,
    pub session_name: String,
    pub status: QueueItemStatus,
    pub progress: f32,
    pub total_frames: i32,
    pub processed_frames: i32,
    pub error_message: Option<String>,
    pub started_at: Option<String>,
    pub completed_at: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchQueueStatus {
    pub is_running: bool,
    pub is_paused: bool,
    pub total_items: usize,
    pub pending_items: usize,
    pub processing_items: usize,
    pub completed_items: usize,
    pub failed_items: usize,
    pub overall_progress: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchResult {
    pub total_processed: usize,
    pub successful: usize,
    pub failed: usize,
    pub total_frames_extracted: i32,
    pub total_duration_ms: i64,
    pub items: Vec<QueueItem>,
}

pub struct BatchQueueService {
    queue: Arc<Mutex<VecDeque<QueueItem>>>,
    items: Arc<Mutex<HashMap<String, QueueItem>>>,
    is_running: Arc<Mutex<bool>>,
    is_paused: Arc<Mutex<bool>>,
    max_concurrent: usize,
    video_service: Arc<VideoProcessingService>,
    training_manager: Arc<TrainingDataManager>,
}

impl BatchQueueService {
    pub fn new(db_path: PathBuf, max_concurrent: usize) -> Result<Self, String> {
        let video_service = Arc::new(VideoProcessingService::new()?);
        let training_manager = Arc::new(
            TrainingDataManager::new(db_path)
                .map_err(|e| format!("Failed to initialize TrainingDataManager: {}", e))?,
        );

        Ok(Self {
            queue: Arc::new(Mutex::new(VecDeque::new())),
            items: Arc::new(Mutex::new(HashMap::new())),
            is_running: Arc::new(Mutex::new(false)),
            is_paused: Arc::new(Mutex::new(false)),
            max_concurrent,
            video_service,
            training_manager,
        })
    }

    /// Add a video to the processing queue
    pub fn add_to_queue(&self, video_path: String, session_name: String) -> Result<String, String> {
        let item_id = format!("batch_{}", Utc::now().timestamp_millis());

        let item = QueueItem {
            id: item_id.clone(),
            video_path,
            session_name,
            status: QueueItemStatus::Pending,
            progress: 0.0,
            total_frames: 0,
            processed_frames: 0,
            error_message: None,
            started_at: None,
            completed_at: None,
            created_at: Utc::now().to_rfc3339(),
        };

        let mut queue = self.queue.lock().unwrap();
        let mut items = self.items.lock().unwrap();

        queue.push_back(item.clone());
        items.insert(item_id.clone(), item);

        info!("Added item {} to batch queue", item_id);
        Ok(item_id)
    }

    /// Remove an item from the queue (only if pending)
    pub fn remove_from_queue(&self, item_id: &str) -> Result<(), String> {
        let mut queue = self.queue.lock().unwrap();
        let mut items = self.items.lock().unwrap();

        if let Some(item) = items.get(item_id) {
            match item.status {
                QueueItemStatus::Pending => {
                    queue.retain(|i| i.id != item_id);
                    items.remove(item_id);
                    info!("Removed item {} from queue", item_id);
                    Ok(())
                }
                _ => Err("Can only remove pending items".to_string()),
            }
        } else {
            Err("Item not found".to_string())
        }
    }

    /// Clear all pending items from the queue
    pub fn clear_queue(&self) -> Result<usize, String> {
        let mut queue = self.queue.lock().unwrap();
        let mut items = self.items.lock().unwrap();

        let pending_ids: Vec<String> = items
            .values()
            .filter(|item| matches!(item.status, QueueItemStatus::Pending))
            .map(|item| item.id.clone())
            .collect();

        let count = pending_ids.len();

        for id in pending_ids {
            queue.retain(|i| i.id != id);
            items.remove(&id);
        }

        info!("Cleared {} pending items from queue", count);
        Ok(count)
    }

    /// Start processing the queue
    pub fn start_processing(&self) -> Result<(), String> {
        let mut is_running = self.is_running.lock().unwrap();
        let mut is_paused = self.is_paused.lock().unwrap();

        if *is_running {
            return Err("Batch processing already running".to_string());
        }

        *is_running = true;
        *is_paused = false;
        drop(is_running);
        drop(is_paused);

        info!("Started batch processing");

        // Clone Arc references for the worker thread
        let queue = Arc::clone(&self.queue);
        let items = Arc::clone(&self.items);
        let is_running = Arc::clone(&self.is_running);
        let is_paused = Arc::clone(&self.is_paused);
        let video_service = Arc::clone(&self.video_service);
        let training_manager = Arc::clone(&self.training_manager);
        let max_concurrent = self.max_concurrent;

        // Spawn worker thread
        thread::spawn(move || {
            Self::worker_thread(
                queue,
                items,
                is_running,
                is_paused,
                video_service,
                training_manager,
                max_concurrent,
            );
        });

        Ok(())
    }

    /// Pause processing (current items will finish)
    pub fn pause_processing(&self) -> Result<(), String> {
        let is_running = self.is_running.lock().unwrap();
        let mut is_paused = self.is_paused.lock().unwrap();

        if !*is_running {
            return Err("Batch processing not running".to_string());
        }

        *is_paused = true;
        info!("Paused batch processing");
        Ok(())
    }

    /// Resume processing
    pub fn resume_processing(&self) -> Result<(), String> {
        let is_running = self.is_running.lock().unwrap();
        let mut is_paused = self.is_paused.lock().unwrap();

        if !*is_running {
            return Err("Batch processing not running".to_string());
        }

        if !*is_paused {
            return Err("Batch processing not paused".to_string());
        }

        *is_paused = false;
        info!("Resumed batch processing");
        Ok(())
    }

    /// Stop processing (graceful shutdown)
    pub fn stop_processing(&self) -> Result<(), String> {
        let mut is_running = self.is_running.lock().unwrap();
        *is_running = false;
        info!("Stopped batch processing");
        Ok(())
    }

    /// Get current queue status
    pub fn get_status(&self) -> BatchQueueStatus {
        let is_running = *self.is_running.lock().unwrap();
        let is_paused = *self.is_paused.lock().unwrap();
        let items = self.items.lock().unwrap();

        let total_items = items.len();
        let pending_items = items
            .values()
            .filter(|i| matches!(i.status, QueueItemStatus::Pending))
            .count();
        let processing_items = items
            .values()
            .filter(|i| matches!(i.status, QueueItemStatus::Processing))
            .count();
        let completed_items = items
            .values()
            .filter(|i| matches!(i.status, QueueItemStatus::Completed))
            .count();
        let failed_items = items
            .values()
            .filter(|i| matches!(i.status, QueueItemStatus::Failed))
            .count();

        let overall_progress = if total_items > 0 {
            items.values().map(|i| i.progress).sum::<f32>() / total_items as f32
        } else {
            0.0
        };

        BatchQueueStatus {
            is_running,
            is_paused,
            total_items,
            pending_items,
            processing_items,
            completed_items,
            failed_items,
            overall_progress,
        }
    }

    /// Get all queue items
    pub fn get_all_items(&self) -> Vec<QueueItem> {
        let items = self.items.lock().unwrap();
        items.values().cloned().collect()
    }

    /// Get a specific item by ID
    pub fn get_item(&self, item_id: &str) -> Option<QueueItem> {
        let items = self.items.lock().unwrap();
        items.get(item_id).cloned()
    }

    /// Get batch results summary
    pub fn get_results(&self) -> BatchResult {
        let items = self.items.lock().unwrap();

        let all_items: Vec<QueueItem> = items.values().cloned().collect();
        let successful = all_items
            .iter()
            .filter(|i| matches!(i.status, QueueItemStatus::Completed))
            .count();
        let failed = all_items
            .iter()
            .filter(|i| matches!(i.status, QueueItemStatus::Failed))
            .count();
        let total_frames_extracted: i32 = all_items
            .iter()
            .filter(|i| matches!(i.status, QueueItemStatus::Completed))
            .map(|i| i.processed_frames)
            .sum();

        // Calculate total duration (from first start to last completion)
        let start_times: Vec<_> = all_items
            .iter()
            .filter_map(|i| i.started_at.as_ref())
            .collect();

        let end_times: Vec<_> = all_items
            .iter()
            .filter_map(|i| i.completed_at.as_ref())
            .collect();

        let total_duration_ms = if !start_times.is_empty() && !end_times.is_empty() {
            // Calculate real duration from timestamps
            use chrono::{DateTime, Utc};

            let parse_time = |s: &str| -> Option<DateTime<Utc>> {
                DateTime::parse_from_rfc3339(s)
                    .ok()
                    .map(|dt| dt.with_timezone(&Utc))
            };

            if let (Some(start), Some(end)) = (
                start_times.first().and_then(|s| parse_time(s)),
                end_times.last().and_then(|s| parse_time(s)),
            ) {
                (end - start).num_milliseconds().max(0) as u64
            } else {
                0
            }
        } else {
            0
        };

        BatchResult {
            total_processed: successful + failed,
            successful,
            failed,
            total_frames_extracted,
            total_duration_ms: total_duration_ms as i64,
            items: all_items,
        }
    }

    /// Worker thread that processes the queue
    fn worker_thread(
        queue: Arc<Mutex<VecDeque<QueueItem>>>,
        items: Arc<Mutex<HashMap<String, QueueItem>>>,
        is_running: Arc<Mutex<bool>>,
        is_paused: Arc<Mutex<bool>>,
        video_service: Arc<VideoProcessingService>,
        training_manager: Arc<TrainingDataManager>,
        max_concurrent: usize,
    ) {
        info!("Batch worker thread started");

        let mut processing_count = 0;

        loop {
            // Check if we should stop
            {
                let running = is_running.lock().unwrap();
                if !*running {
                    info!("Worker thread stopping");
                    break;
                }
            }

            // Check if paused
            {
                let paused = is_paused.lock().unwrap();
                if *paused {
                    thread::sleep(Duration::from_millis(500));
                    continue;
                }
            }

            // Check if we can process more items
            if processing_count >= max_concurrent {
                thread::sleep(Duration::from_millis(200));
                continue;
            }

            // Get next pending item
            let next_item = {
                let mut queue = queue.lock().unwrap();
                queue.pop_front()
            };

            if let Some(mut item) = next_item {
                info!("Processing batch item: {}", item.id);

                // Update status to processing
                item.status = QueueItemStatus::Processing;
                item.started_at = Some(Utc::now().to_rfc3339());
                {
                    let mut items = items.lock().unwrap();
                    items.insert(item.id.clone(), item.clone());
                }

                processing_count += 1;

                // Clone references for async processing
                let item_id = item.id.clone();
                let items_clone = Arc::clone(&items);
                let video_service_clone = Arc::clone(&video_service);
                let training_manager_clone = Arc::clone(&training_manager);

                // Spawn thread to process this item
                thread::spawn(move || {
                    Self::process_item(
                        item_id,
                        item,
                        items_clone,
                        video_service_clone,
                        training_manager_clone,
                    );
                });
            } else {
                // No more items in queue
                if processing_count == 0 {
                    // All done, stop processing
                    let mut running = is_running.lock().unwrap();
                    *running = false;
                    info!("Batch processing completed - no more items");
                    break;
                }

                // Wait for current items to finish
                thread::sleep(Duration::from_millis(500));
            }
        }

        info!("Batch worker thread finished");
    }

    /// Process a single queue item
    fn process_item(
        item_id: String,
        mut item: QueueItem,
        items: Arc<Mutex<HashMap<String, QueueItem>>>,
        video_service: Arc<VideoProcessingService>,
        training_manager: Arc<TrainingDataManager>,
    ) {
        info!("Processing video: {}", item.video_path);

        // Create training session
        let session_result = training_manager.create_session(
            item.session_name.clone(),
            Some(format!("Batch processed from {}", item.video_path)),
            item.video_path.clone(),
        );

        let session_id = match session_result {
            Ok(id) => id,
            Err(e) => {
                error!("Failed to create training session: {}", e);
                item.status = QueueItemStatus::Failed;
                item.error_message = Some(format!("Failed to create session: {}", e));
                item.completed_at = Some(Utc::now().to_rfc3339());

                let mut items = items.lock().unwrap();
                items.insert(item_id, item);
                return;
            }
        };

        // Extract frames from video
        let config = crate::services::video_processing::FrameExtractionConfig {
            fps: 1.0, // 1 frame per second
            quality: 3,
            output_format: "jpg".to_string(),
            start_time: None,
            duration: None,
        };

        let extract_result = video_service.extract_frames(&item.video_path, config);

        match extract_result {
            Ok(result) => {
                info!(
                    "Extracted {} frames from {}",
                    result.frames.len(),
                    item.video_path
                );

                // Save frames to training session
                for (idx, frame) in result.frames.iter().enumerate() {
                    if let Err(e) = training_manager.add_frame(
                        session_id,
                        frame.file_path.clone(),
                        frame.frame_number as i32,
                        frame.timestamp_seconds,
                        frame.file_size_bytes as i64,
                    ) {
                        warn!(
                            "Failed to add frame {} to session: {}",
                            frame.frame_number, e
                        );
                    }

                    // Update progress
                    item.progress = ((idx + 1) as f32 / result.frames.len() as f32) * 100.0;
                    item.processed_frames = (idx + 1) as i32;
                    item.total_frames = result.frames.len() as i32;

                    let mut items = items.lock().unwrap();
                    items.insert(item_id.clone(), item.clone());
                }

                // Mark as completed
                item.status = QueueItemStatus::Completed;
                item.progress = 100.0;
                item.completed_at = Some(Utc::now().to_rfc3339());

                // Update session status
                if let Err(e) =
                    training_manager.update_session_status(session_id, "completed".to_string())
                {
                    warn!("Failed to update session status: {}", e);
                }

                info!("Completed processing item: {}", item_id);
            }
            Err(e) => {
                error!("Failed to extract frames: {}", e);
                item.status = QueueItemStatus::Failed;
                item.error_message = Some(format!("Failed to extract frames: {}", e));
                item.completed_at = Some(Utc::now().to_rfc3339());

                // Update session status to failed
                if let Err(e) =
                    training_manager.update_session_status(session_id, "failed".to_string())
                {
                    warn!("Failed to update session status: {}", e);
                }
            }
        }

        let mut items = items.lock().unwrap();
        items.insert(item_id, item);
    }
}
