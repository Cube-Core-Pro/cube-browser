// CUBE Nexum - Screenshot Commands
// Tauri commands for screenshot and screen recording

use crate::services::browser_screenshot::{
    BrowserScreenshotService, Screenshot, ScreenshotSettings, Recording, RecordingSettings,
    EditorState, ScreenshotStats, CaptureOptions, CaptureRegion, CaptureMode,
    ImageFormat, AnnotationType, Annotation, KeyboardShortcuts, UploadDestination, UploadResult,
};
use tauri::State;
use std::sync::Mutex;

pub struct ScreenshotState(pub Mutex<BrowserScreenshotService>);

// ==================== Settings Commands ====================

#[tauri::command]
pub async fn browser_screenshot_get_settings(
    state: State<'_, ScreenshotState>,
) -> Result<ScreenshotSettings, String> {
    let service = state.0.lock().map_err(|e| e.to_string())?;
    Ok(service.get_settings())
}

#[tauri::command]
pub async fn browser_screenshot_update_settings(
    state: State<'_, ScreenshotState>,
    settings: ScreenshotSettings,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.update_settings(settings);
    Ok(())
}

#[tauri::command]
pub async fn browser_screenshot_set_default_format(
    state: State<'_, ScreenshotState>,
    format: ImageFormat,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.set_default_format(format);
    Ok(())
}

#[tauri::command]
pub async fn browser_screenshot_set_save_directory(
    state: State<'_, ScreenshotState>,
    directory: String,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.set_save_directory(directory);
    Ok(())
}

#[tauri::command]
pub async fn browser_screenshot_set_quality(
    state: State<'_, ScreenshotState>,
    jpeg_quality: u8,
    webp_quality: u8,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.set_quality(jpeg_quality, webp_quality);
    Ok(())
}

#[tauri::command]
pub async fn browser_screenshot_set_keyboard_shortcuts(
    state: State<'_, ScreenshotState>,
    shortcuts: KeyboardShortcuts,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.set_keyboard_shortcuts(shortcuts);
    Ok(())
}

#[tauri::command]
pub async fn browser_screenshot_get_keyboard_shortcuts(
    state: State<'_, ScreenshotState>,
) -> Result<KeyboardShortcuts, String> {
    let service = state.0.lock().map_err(|e| e.to_string())?;
    Ok(service.get_keyboard_shortcuts())
}

// ==================== Recording Settings ====================

#[tauri::command]
pub async fn browser_screenshot_get_recording_settings(
    state: State<'_, ScreenshotState>,
) -> Result<RecordingSettings, String> {
    let service = state.0.lock().map_err(|e| e.to_string())?;
    Ok(service.get_recording_settings())
}

#[tauri::command]
pub async fn browser_screenshot_update_recording_settings(
    state: State<'_, ScreenshotState>,
    settings: RecordingSettings,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.update_recording_settings(settings);
    Ok(())
}

// ==================== Capture Commands ====================

#[tauri::command]
pub async fn browser_screenshot_capture_visible(
    state: State<'_, ScreenshotState>,
    url: String,
    title: String,
) -> Result<Screenshot, String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.capture_visible_area(&url, &title)
}

#[tauri::command]
pub async fn browser_screenshot_capture_full_page(
    state: State<'_, ScreenshotState>,
    url: String,
    title: String,
) -> Result<Screenshot, String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.capture_full_page(&url, &title)
}

#[tauri::command]
pub async fn browser_screenshot_capture_region(
    state: State<'_, ScreenshotState>,
    url: String,
    title: String,
    x: i32,
    y: i32,
    width: u32,
    height: u32,
) -> Result<Screenshot, String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    let region = CaptureRegion { x, y, width, height };
    service.capture_region(&url, &title, region)
}

#[tauri::command]
pub async fn browser_screenshot_capture_element(
    state: State<'_, ScreenshotState>,
    url: String,
    title: String,
    selector: String,
) -> Result<Screenshot, String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.capture_element(&url, &title, selector)
}

#[tauri::command]
pub async fn browser_screenshot_start_capture(
    state: State<'_, ScreenshotState>,
    options: CaptureOptions,
) -> Result<String, String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.start_capture(options)
}

#[tauri::command]
pub async fn browser_screenshot_cancel_capture(
    state: State<'_, ScreenshotState>,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.cancel_capture();
    Ok(())
}

#[tauri::command]
pub async fn browser_screenshot_is_capturing(
    state: State<'_, ScreenshotState>,
) -> Result<bool, String> {
    let service = state.0.lock().map_err(|e| e.to_string())?;
    Ok(service.is_capturing())
}

// ==================== Screenshot Management ====================

#[tauri::command]
pub async fn browser_screenshot_get(
    state: State<'_, ScreenshotState>,
    screenshot_id: String,
) -> Result<Option<Screenshot>, String> {
    let service = state.0.lock().map_err(|e| e.to_string())?;
    Ok(service.get_screenshot(&screenshot_id))
}

#[tauri::command]
pub async fn browser_screenshot_get_all(
    state: State<'_, ScreenshotState>,
) -> Result<Vec<Screenshot>, String> {
    let service = state.0.lock().map_err(|e| e.to_string())?;
    Ok(service.get_all_screenshots())
}

#[tauri::command]
pub async fn browser_screenshot_get_recent(
    state: State<'_, ScreenshotState>,
    limit: usize,
) -> Result<Vec<Screenshot>, String> {
    let service = state.0.lock().map_err(|e| e.to_string())?;
    Ok(service.get_recent_screenshots(limit))
}

#[tauri::command]
pub async fn browser_screenshot_delete(
    state: State<'_, ScreenshotState>,
    screenshot_id: String,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.delete_screenshot(&screenshot_id)
}

#[tauri::command]
pub async fn browser_screenshot_delete_all(
    state: State<'_, ScreenshotState>,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.delete_all_screenshots();
    Ok(())
}

#[tauri::command]
pub async fn browser_screenshot_toggle_favorite(
    state: State<'_, ScreenshotState>,
    screenshot_id: String,
) -> Result<bool, String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.toggle_favorite(&screenshot_id)
}

#[tauri::command]
pub async fn browser_screenshot_add_tag(
    state: State<'_, ScreenshotState>,
    screenshot_id: String,
    tag: String,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.add_tag(&screenshot_id, tag)
}

#[tauri::command]
pub async fn browser_screenshot_remove_tag(
    state: State<'_, ScreenshotState>,
    screenshot_id: String,
    tag: String,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.remove_tag(&screenshot_id, &tag)
}

#[tauri::command]
pub async fn browser_screenshot_search(
    state: State<'_, ScreenshotState>,
    query: String,
) -> Result<Vec<Screenshot>, String> {
    let service = state.0.lock().map_err(|e| e.to_string())?;
    Ok(service.search_screenshots(&query))
}

#[tauri::command]
pub async fn browser_screenshot_get_favorites(
    state: State<'_, ScreenshotState>,
) -> Result<Vec<Screenshot>, String> {
    let service = state.0.lock().map_err(|e| e.to_string())?;
    Ok(service.get_favorites())
}

// ==================== Editor Commands ====================

#[tauri::command]
pub async fn browser_screenshot_open_editor(
    state: State<'_, ScreenshotState>,
    screenshot_id: String,
) -> Result<EditorState, String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.open_editor(&screenshot_id)
}

#[tauri::command]
pub async fn browser_screenshot_close_editor(
    state: State<'_, ScreenshotState>,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.close_editor();
    Ok(())
}

#[tauri::command]
pub async fn browser_screenshot_get_editor_state(
    state: State<'_, ScreenshotState>,
) -> Result<EditorState, String> {
    let service = state.0.lock().map_err(|e| e.to_string())?;
    Ok(service.get_editor_state())
}

#[tauri::command]
pub async fn browser_screenshot_set_editor_tool(
    state: State<'_, ScreenshotState>,
    tool: AnnotationType,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.set_editor_tool(tool);
    Ok(())
}

#[tauri::command]
pub async fn browser_screenshot_set_editor_color(
    state: State<'_, ScreenshotState>,
    color: String,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.set_editor_color(color);
    Ok(())
}

#[tauri::command]
pub async fn browser_screenshot_set_editor_stroke_width(
    state: State<'_, ScreenshotState>,
    width: f64,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.set_editor_stroke_width(width);
    Ok(())
}

#[tauri::command]
pub async fn browser_screenshot_set_editor_font_size(
    state: State<'_, ScreenshotState>,
    size: f64,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.set_editor_font_size(size);
    Ok(())
}

#[tauri::command]
pub async fn browser_screenshot_set_editor_zoom(
    state: State<'_, ScreenshotState>,
    zoom: f64,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.set_editor_zoom(zoom);
    Ok(())
}

#[tauri::command]
pub async fn browser_screenshot_set_editor_pan(
    state: State<'_, ScreenshotState>,
    x: f64,
    y: f64,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.set_editor_pan(x, y);
    Ok(())
}

// ==================== Annotation Commands ====================

#[tauri::command]
pub async fn browser_screenshot_add_annotation(
    state: State<'_, ScreenshotState>,
    screenshot_id: String,
    annotation: Annotation,
) -> Result<String, String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.add_annotation(&screenshot_id, annotation)
}

#[tauri::command]
pub async fn browser_screenshot_update_annotation(
    state: State<'_, ScreenshotState>,
    screenshot_id: String,
    annotation_id: String,
    annotation: Annotation,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.update_annotation(&screenshot_id, &annotation_id, annotation)
}

#[tauri::command]
pub async fn browser_screenshot_delete_annotation(
    state: State<'_, ScreenshotState>,
    screenshot_id: String,
    annotation_id: String,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.delete_annotation(&screenshot_id, &annotation_id)
}

#[tauri::command]
pub async fn browser_screenshot_clear_annotations(
    state: State<'_, ScreenshotState>,
    screenshot_id: String,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.clear_annotations(&screenshot_id)
}

#[tauri::command]
pub async fn browser_screenshot_get_annotations(
    state: State<'_, ScreenshotState>,
    screenshot_id: String,
) -> Result<Vec<Annotation>, String> {
    let service = state.0.lock().map_err(|e| e.to_string())?;
    service.get_annotations(&screenshot_id)
}

// ==================== History Commands ====================

#[tauri::command]
pub async fn browser_screenshot_undo(
    state: State<'_, ScreenshotState>,
) -> Result<bool, String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    Ok(service.undo())
}

#[tauri::command]
pub async fn browser_screenshot_redo(
    state: State<'_, ScreenshotState>,
) -> Result<bool, String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    Ok(service.redo())
}

#[tauri::command]
pub async fn browser_screenshot_add_to_history(
    state: State<'_, ScreenshotState>,
    state_json: String,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.add_to_history(state_json);
    Ok(())
}

// ==================== Export Commands ====================

#[tauri::command]
pub async fn browser_screenshot_save_to_file(
    state: State<'_, ScreenshotState>,
    screenshot_id: String,
    path: Option<String>,
) -> Result<String, String> {
    let service = state.0.lock().map_err(|e| e.to_string())?;
    service.save_to_file(&screenshot_id, path)
}

#[tauri::command]
pub async fn browser_screenshot_copy_to_clipboard(
    state: State<'_, ScreenshotState>,
    screenshot_id: String,
) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| e.to_string())?;
    service.copy_to_clipboard(&screenshot_id)
}

#[tauri::command]
pub async fn browser_screenshot_export_as_format(
    state: State<'_, ScreenshotState>,
    screenshot_id: String,
    format: ImageFormat,
    quality: u8,
) -> Result<Vec<u8>, String> {
    let service = state.0.lock().map_err(|e| e.to_string())?;
    service.export_as_format(&screenshot_id, format, quality)
}

#[tauri::command]
pub async fn browser_screenshot_upload(
    state: State<'_, ScreenshotState>,
    screenshot_id: String,
    destination: UploadDestination,
) -> Result<UploadResult, String> {
    let service = state.0.lock().map_err(|e| e.to_string())?;
    service.upload(&screenshot_id, destination)
}

#[tauri::command]
pub async fn browser_screenshot_print(
    state: State<'_, ScreenshotState>,
    screenshot_id: String,
) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| e.to_string())?;
    service.print(&screenshot_id)
}

// ==================== Recording Commands ====================

#[tauri::command]
pub async fn browser_screenshot_start_recording(
    state: State<'_, ScreenshotState>,
    url: String,
    title: String,
) -> Result<String, String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.start_recording(&url, &title)
}

#[tauri::command]
pub async fn browser_screenshot_stop_recording(
    state: State<'_, ScreenshotState>,
) -> Result<Recording, String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.stop_recording()
}

#[tauri::command]
pub async fn browser_screenshot_pause_recording(
    state: State<'_, ScreenshotState>,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.pause_recording()
}

#[tauri::command]
pub async fn browser_screenshot_resume_recording(
    state: State<'_, ScreenshotState>,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.resume_recording()
}

#[tauri::command]
pub async fn browser_screenshot_is_recording(
    state: State<'_, ScreenshotState>,
) -> Result<bool, String> {
    let service = state.0.lock().map_err(|e| e.to_string())?;
    Ok(service.is_recording())
}

#[tauri::command]
pub async fn browser_screenshot_get_recording(
    state: State<'_, ScreenshotState>,
    recording_id: String,
) -> Result<Option<Recording>, String> {
    let service = state.0.lock().map_err(|e| e.to_string())?;
    Ok(service.get_recording(&recording_id))
}

#[tauri::command]
pub async fn browser_screenshot_get_all_recordings(
    state: State<'_, ScreenshotState>,
) -> Result<Vec<Recording>, String> {
    let service = state.0.lock().map_err(|e| e.to_string())?;
    Ok(service.get_all_recordings())
}

#[tauri::command]
pub async fn browser_screenshot_delete_recording(
    state: State<'_, ScreenshotState>,
    recording_id: String,
) -> Result<(), String> {
    let mut service = state.0.lock().map_err(|e| e.to_string())?;
    service.delete_recording(&recording_id)
}

// ==================== Statistics Commands ====================

#[tauri::command]
pub async fn browser_screenshot_get_stats(
    state: State<'_, ScreenshotState>,
) -> Result<ScreenshotStats, String> {
    let service = state.0.lock().map_err(|e| e.to_string())?;
    Ok(service.get_stats())
}

// ==================== Utility Commands ====================

#[tauri::command]
pub async fn browser_screenshot_get_capture_modes() -> Result<Vec<CaptureMode>, String> {
    Ok(BrowserScreenshotService::get_capture_modes())
}

#[tauri::command]
pub async fn browser_screenshot_get_image_formats() -> Result<Vec<ImageFormat>, String> {
    Ok(BrowserScreenshotService::get_image_formats())
}

#[tauri::command]
pub async fn browser_screenshot_get_annotation_types() -> Result<Vec<AnnotationType>, String> {
    Ok(BrowserScreenshotService::get_annotation_types())
}

#[tauri::command]
pub async fn browser_screenshot_get_preset_colors() -> Result<Vec<&'static str>, String> {
    Ok(BrowserScreenshotService::get_preset_colors())
}
