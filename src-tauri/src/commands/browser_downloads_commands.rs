// CUBE Nexum - Downloads Manager Commands
// Tauri commands for the downloads manager service

use tauri::State;
use crate::services::browser_downloads::{
    BrowserDownloadsService, DownloadSettings, Download, DownloadQueue,
    DownloadStats, DownloadFilter, DownloadStatus, DownloadPriority,
    FileCategory, ScheduleType, BandwidthSchedule
};
use std::collections::HashMap;

// ==================== Settings Commands ====================

#[tauri::command]
pub fn download_get_settings(
    service: State<'_, BrowserDownloadsService>
) -> DownloadSettings {
    service.get_settings()
}

#[tauri::command]
pub fn download_update_settings(
    settings: DownloadSettings,
    service: State<'_, BrowserDownloadsService>
) -> Result<(), String> {
    service.update_settings(settings)
}

#[tauri::command]
pub fn download_set_default_directory(
    directory: String,
    service: State<'_, BrowserDownloadsService>
) -> Result<(), String> {
    service.set_default_directory(directory)
}

#[tauri::command]
pub fn download_set_max_concurrent(
    max: u32,
    service: State<'_, BrowserDownloadsService>
) -> Result<(), String> {
    service.set_max_concurrent(max)
}

#[tauri::command]
pub fn download_set_bandwidth_limit(
    enabled: bool,
    limit_kbps: u64,
    service: State<'_, BrowserDownloadsService>
) -> Result<(), String> {
    service.set_bandwidth_limit(enabled, limit_kbps)
}

#[tauri::command]
pub fn download_set_category_folder(
    category: String,
    folder: String,
    service: State<'_, BrowserDownloadsService>
) -> Result<(), String> {
    service.set_category_folder(category, folder)
}

#[tauri::command]
pub fn download_add_blocked_extension(
    ext: String,
    service: State<'_, BrowserDownloadsService>
) -> Result<(), String> {
    service.add_blocked_extension(ext)
}

#[tauri::command]
pub fn download_remove_blocked_extension(
    ext: String,
    service: State<'_, BrowserDownloadsService>
) -> Result<(), String> {
    service.remove_blocked_extension(ext)
}

// ==================== Download Operations Commands ====================

#[tauri::command]
pub fn download_create(
    url: String,
    filename: Option<String>,
    directory: Option<String>,
    service: State<'_, BrowserDownloadsService>
) -> Result<Download, String> {
    service.create_download(url, filename, directory)
}

#[tauri::command]
pub fn download_start(
    download_id: String,
    service: State<'_, BrowserDownloadsService>
) -> Result<Download, String> {
    service.start_download(&download_id)
}

#[tauri::command]
pub fn download_pause(
    download_id: String,
    service: State<'_, BrowserDownloadsService>
) -> Result<Download, String> {
    service.pause_download(&download_id)
}

#[tauri::command]
pub fn download_resume(
    download_id: String,
    service: State<'_, BrowserDownloadsService>
) -> Result<Download, String> {
    service.resume_download(&download_id)
}

#[tauri::command]
pub fn download_cancel(
    download_id: String,
    service: State<'_, BrowserDownloadsService>
) -> Result<(), String> {
    service.cancel_download(&download_id)
}

#[tauri::command]
pub fn download_retry(
    download_id: String,
    service: State<'_, BrowserDownloadsService>
) -> Result<Download, String> {
    service.retry_download(&download_id)
}

#[tauri::command]
pub fn download_delete(
    download_id: String,
    delete_file: bool,
    service: State<'_, BrowserDownloadsService>
) -> Result<(), String> {
    service.delete_download(&download_id, delete_file)
}

#[tauri::command]
pub fn download_update_progress(
    download_id: String,
    downloaded: u64,
    total: u64,
    speed: u64,
    service: State<'_, BrowserDownloadsService>
) -> Result<(), String> {
    service.update_progress(&download_id, downloaded, total, speed)
}

#[tauri::command]
pub fn download_set_failed(
    download_id: String,
    error: String,
    service: State<'_, BrowserDownloadsService>
) -> Result<(), String> {
    service.set_download_failed(&download_id, error)
}

// ==================== Download Management Commands ====================

#[tauri::command]
pub fn download_get(
    download_id: String,
    service: State<'_, BrowserDownloadsService>
) -> Option<Download> {
    service.get_download(&download_id)
}

#[tauri::command]
pub fn download_get_all(
    service: State<'_, BrowserDownloadsService>
) -> Vec<Download> {
    service.get_all_downloads()
}

#[tauri::command]
pub fn download_get_active(
    service: State<'_, BrowserDownloadsService>
) -> Vec<Download> {
    service.get_active_downloads()
}

#[tauri::command]
pub fn download_get_by_status(
    status: DownloadStatus,
    service: State<'_, BrowserDownloadsService>
) -> Vec<Download> {
    service.get_downloads_by_status(status)
}

#[tauri::command]
pub fn download_get_by_category(
    category: FileCategory,
    service: State<'_, BrowserDownloadsService>
) -> Vec<Download> {
    service.get_downloads_by_category(category)
}

#[tauri::command]
pub fn download_filter(
    filter: DownloadFilter,
    service: State<'_, BrowserDownloadsService>
) -> Vec<Download> {
    service.filter_downloads(filter)
}

#[tauri::command]
pub fn download_search(
    query: String,
    service: State<'_, BrowserDownloadsService>
) -> Vec<Download> {
    service.search_downloads(&query)
}

// ==================== Priority & Scheduling Commands ====================

#[tauri::command]
pub fn download_set_priority(
    download_id: String,
    priority: DownloadPriority,
    service: State<'_, BrowserDownloadsService>
) -> Result<(), String> {
    service.set_priority(&download_id, priority)
}

#[tauri::command]
pub fn download_schedule(
    download_id: String,
    schedule_type: ScheduleType,
    time: Option<u64>,
    service: State<'_, BrowserDownloadsService>
) -> Result<(), String> {
    service.schedule_download(&download_id, schedule_type, time)
}

// ==================== Tags Commands ====================

#[tauri::command]
pub fn download_add_tag(
    download_id: String,
    tag: String,
    service: State<'_, BrowserDownloadsService>
) -> Result<(), String> {
    service.add_tag(&download_id, tag)
}

#[tauri::command]
pub fn download_remove_tag(
    download_id: String,
    tag: String,
    service: State<'_, BrowserDownloadsService>
) -> Result<(), String> {
    service.remove_tag(&download_id, &tag)
}

// ==================== Queue Commands ====================

#[tauri::command]
pub fn download_create_queue(
    name: String,
    service: State<'_, BrowserDownloadsService>
) -> Result<DownloadQueue, String> {
    service.create_queue(name)
}

#[tauri::command]
pub fn download_add_to_queue(
    queue_id: String,
    download_id: String,
    service: State<'_, BrowserDownloadsService>
) -> Result<(), String> {
    service.add_to_queue(&queue_id, &download_id)
}

#[tauri::command]
pub fn download_remove_from_queue(
    queue_id: String,
    download_id: String,
    service: State<'_, BrowserDownloadsService>
) -> Result<(), String> {
    service.remove_from_queue(&queue_id, &download_id)
}

#[tauri::command]
pub fn download_get_queue(
    queue_id: String,
    service: State<'_, BrowserDownloadsService>
) -> Option<DownloadQueue> {
    service.get_queue(&queue_id)
}

#[tauri::command]
pub fn download_get_all_queues(
    service: State<'_, BrowserDownloadsService>
) -> Vec<DownloadQueue> {
    service.get_all_queues()
}

#[tauri::command]
pub fn download_delete_queue(
    queue_id: String,
    service: State<'_, BrowserDownloadsService>
) -> Result<(), String> {
    service.delete_queue(&queue_id)
}

#[tauri::command]
pub fn download_pause_queue(
    queue_id: String,
    service: State<'_, BrowserDownloadsService>
) -> Result<(), String> {
    service.pause_queue(&queue_id)
}

#[tauri::command]
pub fn download_resume_queue(
    queue_id: String,
    service: State<'_, BrowserDownloadsService>
) -> Result<(), String> {
    service.resume_queue(&queue_id)
}

// ==================== Bandwidth Schedule Commands ====================

#[tauri::command]
pub fn download_set_bandwidth_schedule(
    schedule: Vec<BandwidthSchedule>,
    service: State<'_, BrowserDownloadsService>
) -> Result<(), String> {
    service.set_bandwidth_schedule(schedule)
}

#[tauri::command]
pub fn download_get_bandwidth_schedule(
    service: State<'_, BrowserDownloadsService>
) -> Vec<BandwidthSchedule> {
    service.get_bandwidth_schedule()
}

#[tauri::command]
pub fn download_get_current_bandwidth_limit(
    service: State<'_, BrowserDownloadsService>
) -> Option<u64> {
    service.get_current_bandwidth_limit()
}

// ==================== Statistics Commands ====================

#[tauri::command]
pub fn download_get_stats(
    service: State<'_, BrowserDownloadsService>
) -> DownloadStats {
    service.get_stats()
}

#[tauri::command]
pub fn download_get_total_speed(
    service: State<'_, BrowserDownloadsService>
) -> u64 {
    service.get_total_speed()
}

#[tauri::command]
pub fn download_get_category_stats(
    service: State<'_, BrowserDownloadsService>
) -> HashMap<String, u64> {
    service.get_category_stats()
}

// ==================== Bulk Operations Commands ====================

#[tauri::command]
pub fn download_pause_all(
    service: State<'_, BrowserDownloadsService>
) -> Result<u32, String> {
    service.pause_all()
}

#[tauri::command]
pub fn download_resume_all(
    service: State<'_, BrowserDownloadsService>
) -> Result<u32, String> {
    service.resume_all()
}

#[tauri::command]
pub fn download_cancel_all(
    service: State<'_, BrowserDownloadsService>
) -> Result<u32, String> {
    service.cancel_all()
}

#[tauri::command]
pub fn download_clear_completed(
    service: State<'_, BrowserDownloadsService>
) -> Result<u32, String> {
    service.clear_completed()
}

#[tauri::command]
pub fn download_clear_failed(
    service: State<'_, BrowserDownloadsService>
) -> Result<u32, String> {
    service.clear_failed()
}

// ==================== File Operations Commands ====================

#[tauri::command]
pub fn download_open_file(
    download_id: String,
    service: State<'_, BrowserDownloadsService>
) -> Result<(), String> {
    service.open_file(&download_id)
}

#[tauri::command]
pub fn download_open_folder(
    download_id: String,
    service: State<'_, BrowserDownloadsService>
) -> Result<(), String> {
    service.open_folder(&download_id)
}

#[tauri::command]
pub fn download_rename_file(
    download_id: String,
    new_name: String,
    service: State<'_, BrowserDownloadsService>
) -> Result<(), String> {
    service.rename_file(&download_id, new_name)
}

#[tauri::command]
pub fn download_move_to_category(
    download_id: String,
    category: FileCategory,
    service: State<'_, BrowserDownloadsService>
) -> Result<(), String> {
    service.move_to_category(&download_id, category)
}

// ==================== Virus Scan Commands ====================

#[tauri::command]
pub fn download_scan(
    download_id: String,
    service: State<'_, BrowserDownloadsService>
) -> Result<bool, String> {
    service.scan_download(&download_id)
}

// ==================== Export/Import Commands ====================

#[tauri::command]
pub fn download_export_list(
    service: State<'_, BrowserDownloadsService>
) -> Result<String, String> {
    service.export_downloads_list()
}

#[tauri::command]
pub fn download_import_list(
    json: String,
    service: State<'_, BrowserDownloadsService>
) -> Result<u32, String> {
    service.import_downloads_list(&json)
}
