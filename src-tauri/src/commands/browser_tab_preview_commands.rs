// CUBE Nexum - Tab Preview Commands
// Tauri command interfaces for rich tab previews

use tauri::State;
use crate::services::browser_tab_preview::{
    BrowserTabPreviewService, TabPreview, TabPreviewSettings, PreviewTrigger,
    CaptureQuality, PreviewAnimation, PreviewPosition, PreviewSize,
    VisualTabSearch, VisualSearchMode, TabCarousel, PreviewCard,
    CarouselFilter, PreviewGrid, GridDirection, PreviewStats, PreviewUpdate,
};

// ==================== Settings Commands ====================

#[tauri::command]
pub fn tab_preview_get_settings(
    service: State<'_, BrowserTabPreviewService>
) -> TabPreviewSettings {
    service.get_settings()
}

#[tauri::command]
pub fn tab_preview_update_settings(
    service: State<'_, BrowserTabPreviewService>,
    settings: TabPreviewSettings
) {
    service.update_settings(settings);
}

#[tauri::command]
pub fn tab_preview_set_trigger(
    service: State<'_, BrowserTabPreviewService>,
    trigger: PreviewTrigger
) {
    service.set_trigger(trigger);
}

#[tauri::command]
pub fn tab_preview_set_quality(
    service: State<'_, BrowserTabPreviewService>,
    quality: CaptureQuality
) {
    service.set_quality(quality);
}

#[tauri::command]
pub fn tab_preview_set_size(
    service: State<'_, BrowserTabPreviewService>,
    size: PreviewSize
) {
    service.set_size(size);
}

#[tauri::command]
pub fn tab_preview_set_animation(
    service: State<'_, BrowserTabPreviewService>,
    animation: PreviewAnimation
) {
    service.set_animation(animation);
}

// ==================== Preview CRUD Commands ====================

#[tauri::command]
pub fn tab_preview_capture(
    service: State<'_, BrowserTabPreviewService>,
    tab_id: String,
    title: String,
    url: String
) -> Result<TabPreview, String> {
    service.capture_preview(&tab_id, title, &url)
}

#[tauri::command]
pub fn tab_preview_get(
    service: State<'_, BrowserTabPreviewService>,
    tab_id: String
) -> Option<TabPreview> {
    service.get_preview(&tab_id)
}

#[tauri::command]
pub fn tab_preview_get_all(
    service: State<'_, BrowserTabPreviewService>
) -> Vec<TabPreview> {
    service.get_all_previews()
}

#[tauri::command]
pub fn tab_preview_update(
    service: State<'_, BrowserTabPreviewService>,
    tab_id: String,
    updates: PreviewUpdate
) -> Result<TabPreview, String> {
    service.update_preview(&tab_id, updates)
}

#[tauri::command]
pub fn tab_preview_delete(
    service: State<'_, BrowserTabPreviewService>,
    tab_id: String
) {
    service.delete_preview(&tab_id);
}

#[tauri::command]
pub fn tab_preview_mark_stale(
    service: State<'_, BrowserTabPreviewService>,
    tab_id: String
) {
    service.mark_stale(&tab_id);
}

#[tauri::command]
pub fn tab_preview_mark_all_stale(
    service: State<'_, BrowserTabPreviewService>
) {
    service.mark_all_stale();
}

#[tauri::command]
pub fn tab_preview_get_stale(
    service: State<'_, BrowserTabPreviewService>
) -> Vec<String> {
    service.get_stale_previews()
}

// ==================== Cache Commands ====================

#[tauri::command]
pub fn tab_preview_cache_thumbnail(
    service: State<'_, BrowserTabPreviewService>,
    tab_id: String,
    data: String
) -> Result<(), String> {
    service.cache_thumbnail(&tab_id, data)
}

#[tauri::command]
pub fn tab_preview_get_cached_thumbnail(
    service: State<'_, BrowserTabPreviewService>,
    tab_id: String
) -> Option<String> {
    service.get_cached_thumbnail(&tab_id)
}

#[tauri::command]
pub fn tab_preview_clear_cache(
    service: State<'_, BrowserTabPreviewService>
) {
    service.clear_cache();
}

#[tauri::command]
pub fn tab_preview_get_cache_size(
    service: State<'_, BrowserTabPreviewService>
) -> f32 {
    service.get_cache_size()
}

// ==================== Visual Search Commands ====================

#[tauri::command]
pub fn tab_preview_visual_search(
    service: State<'_, BrowserTabPreviewService>,
    query: String,
    mode: VisualSearchMode
) -> VisualTabSearch {
    service.visual_search(&query, mode)
}

// ==================== Carousel Commands ====================

#[tauri::command]
pub fn tab_preview_show_carousel(
    service: State<'_, BrowserTabPreviewService>,
    tabs: Vec<PreviewCard>
) {
    service.show_carousel(tabs);
}

#[tauri::command]
pub fn tab_preview_hide_carousel(
    service: State<'_, BrowserTabPreviewService>
) {
    service.hide_carousel();
}

#[tauri::command]
pub fn tab_preview_carousel_next(
    service: State<'_, BrowserTabPreviewService>
) -> Option<PreviewCard> {
    service.carousel_next()
}

#[tauri::command]
pub fn tab_preview_carousel_prev(
    service: State<'_, BrowserTabPreviewService>
) -> Option<PreviewCard> {
    service.carousel_prev()
}

#[tauri::command]
pub fn tab_preview_carousel_select(
    service: State<'_, BrowserTabPreviewService>,
    index: usize
) -> Option<PreviewCard> {
    service.carousel_select(index)
}

#[tauri::command]
pub fn tab_preview_get_carousel(
    service: State<'_, BrowserTabPreviewService>
) -> TabCarousel {
    service.get_carousel()
}

#[tauri::command]
pub fn tab_preview_set_carousel_filter(
    service: State<'_, BrowserTabPreviewService>,
    filter: CarouselFilter
) {
    service.set_carousel_filter(filter);
}

#[tauri::command]
pub fn tab_preview_clear_carousel_filter(
    service: State<'_, BrowserTabPreviewService>
) {
    service.clear_carousel_filter();
}

// ==================== Grid Commands ====================

#[tauri::command]
pub fn tab_preview_create_grid(
    service: State<'_, BrowserTabPreviewService>,
    tab_ids: Vec<String>,
    columns: u32
) -> PreviewGrid {
    service.create_preview_grid(tab_ids, columns)
}

#[tauri::command]
pub fn tab_preview_grid_navigate(
    service: State<'_, BrowserTabPreviewService>,
    current: usize,
    direction: GridDirection,
    columns: u32,
    total: usize
) -> usize {
    service.grid_navigate(current, direction, columns, total)
}

// ==================== Statistics Commands ====================

#[tauri::command]
pub fn tab_preview_get_stats(
    service: State<'_, BrowserTabPreviewService>
) -> PreviewStats {
    service.get_stats()
}

// ==================== Batch Operation Commands ====================

#[tauri::command]
pub fn tab_preview_refresh_all(
    service: State<'_, BrowserTabPreviewService>
) -> Vec<String> {
    service.refresh_all_previews()
}

#[tauri::command]
pub fn tab_preview_delete_old(
    service: State<'_, BrowserTabPreviewService>,
    max_age_hours: u32
) -> u32 {
    service.delete_old_previews(max_age_hours)
}
