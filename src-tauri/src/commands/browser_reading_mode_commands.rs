// CUBE Nexum - Reading Mode Commands
// Tauri commands for distraction-free reading

use tauri::State;
use crate::services::browser_reading_mode::{
    BrowserReadingModeService, ReadingSettings, ReadingModeContent,
    ReadingTheme, LayoutWidth, Highlight, HighlightColor, Annotation,
    SavedArticle, ReadingProgress, ReadingStats, TableOfContents,
    CustomTheme,
};

// ==================== Settings Commands ====================

#[tauri::command]
pub fn reading_mode_get_settings(
    service: State<'_, BrowserReadingModeService>
) -> ReadingSettings {
    service.get_settings()
}

#[tauri::command]
pub fn reading_mode_update_settings(
    service: State<'_, BrowserReadingModeService>,
    settings: ReadingSettings
) {
    service.update_settings(settings);
}

#[tauri::command]
pub fn reading_mode_set_theme(
    service: State<'_, BrowserReadingModeService>,
    theme: ReadingTheme
) {
    service.set_theme(theme);
}

#[tauri::command]
pub fn reading_mode_set_font_size(
    service: State<'_, BrowserReadingModeService>,
    size: u32
) {
    service.set_font_size(size);
}

#[tauri::command]
pub fn reading_mode_set_font_family(
    service: State<'_, BrowserReadingModeService>,
    family: String
) {
    service.set_font_family(family);
}

#[tauri::command]
pub fn reading_mode_set_layout_width(
    service: State<'_, BrowserReadingModeService>,
    width: LayoutWidth
) {
    service.set_layout_width(width);
}

// ==================== Content Commands ====================

#[tauri::command]
pub fn reading_mode_parse_article(
    service: State<'_, BrowserReadingModeService>,
    url: String,
    html: String,
    title: String
) -> ReadingModeContent {
    service.parse_article(&url, &html, &title)
}

#[tauri::command]
pub fn reading_mode_generate_toc(
    service: State<'_, BrowserReadingModeService>,
    content: ReadingModeContent
) -> TableOfContents {
    service.generate_toc(&content)
}

#[tauri::command]
pub fn reading_mode_apply_bionic(
    service: State<'_, BrowserReadingModeService>,
    text: String
) -> String {
    service.apply_bionic_reading(&text)
}

// ==================== Saved Articles Commands ====================

#[tauri::command]
pub fn reading_mode_save_article(
    service: State<'_, BrowserReadingModeService>,
    content: ReadingModeContent
) -> SavedArticle {
    service.save_article(content)
}

#[tauri::command]
pub fn reading_mode_get_saved_article(
    service: State<'_, BrowserReadingModeService>,
    article_id: String
) -> Option<SavedArticle> {
    service.get_saved_article(&article_id)
}

#[tauri::command]
pub fn reading_mode_get_all_saved(
    service: State<'_, BrowserReadingModeService>
) -> Vec<SavedArticle> {
    service.get_all_saved_articles()
}

#[tauri::command]
pub fn reading_mode_delete_saved(
    service: State<'_, BrowserReadingModeService>,
    article_id: String
) -> Result<(), String> {
    service.delete_saved_article(&article_id)
}

#[tauri::command]
pub fn reading_mode_toggle_favorite(
    service: State<'_, BrowserReadingModeService>,
    article_id: String
) -> Result<bool, String> {
    service.toggle_favorite(&article_id)
}

#[tauri::command]
pub fn reading_mode_toggle_archived(
    service: State<'_, BrowserReadingModeService>,
    article_id: String
) -> Result<bool, String> {
    service.toggle_archived(&article_id)
}

#[tauri::command]
pub fn reading_mode_add_tag(
    service: State<'_, BrowserReadingModeService>,
    article_id: String,
    tag: String
) -> Result<(), String> {
    service.add_tag(&article_id, &tag)
}

#[tauri::command]
pub fn reading_mode_remove_tag(
    service: State<'_, BrowserReadingModeService>,
    article_id: String,
    tag: String
) -> Result<(), String> {
    service.remove_tag(&article_id, &tag)
}

#[tauri::command]
pub fn reading_mode_search_saved(
    service: State<'_, BrowserReadingModeService>,
    query: String
) -> Vec<SavedArticle> {
    service.search_saved_articles(&query)
}

// ==================== Progress Commands ====================

#[tauri::command]
pub fn reading_mode_update_progress(
    service: State<'_, BrowserReadingModeService>,
    url: String,
    scroll_position: f32,
    percentage: f32
) {
    service.update_progress(&url, scroll_position, percentage);
}

#[tauri::command]
pub fn reading_mode_add_reading_time(
    service: State<'_, BrowserReadingModeService>,
    url: String,
    seconds: u64
) {
    service.add_reading_time(&url, seconds);
}

#[tauri::command]
pub fn reading_mode_get_progress(
    service: State<'_, BrowserReadingModeService>,
    url: String
) -> Option<ReadingProgress> {
    service.get_progress(&url)
}

#[tauri::command]
pub fn reading_mode_mark_completed(
    service: State<'_, BrowserReadingModeService>,
    url: String,
    word_count: u32
) {
    service.mark_completed(&url, word_count);
}

// ==================== Highlight Commands ====================

#[tauri::command]
pub fn reading_mode_add_highlight(
    service: State<'_, BrowserReadingModeService>,
    url: String,
    text: String,
    start_offset: u32,
    end_offset: u32,
    color: HighlightColor,
    note: Option<String>
) -> Highlight {
    service.add_highlight(&url, &text, start_offset, end_offset, color, note)
}

#[tauri::command]
pub fn reading_mode_get_highlights(
    service: State<'_, BrowserReadingModeService>,
    url: String
) -> Vec<Highlight> {
    service.get_highlights(&url)
}

#[tauri::command]
pub fn reading_mode_delete_highlight(
    service: State<'_, BrowserReadingModeService>,
    url: String,
    highlight_id: String
) -> Result<(), String> {
    service.delete_highlight(&url, &highlight_id)
}

#[tauri::command]
pub fn reading_mode_update_highlight_note(
    service: State<'_, BrowserReadingModeService>,
    url: String,
    highlight_id: String,
    note: Option<String>
) -> Result<Highlight, String> {
    service.update_highlight_note(&url, &highlight_id, note)
}

// ==================== Annotation Commands ====================

#[tauri::command]
pub fn reading_mode_add_annotation(
    service: State<'_, BrowserReadingModeService>,
    url: String,
    text: String,
    note: String,
    position: u32
) -> Annotation {
    service.add_annotation(&url, &text, &note, position)
}

#[tauri::command]
pub fn reading_mode_get_annotations(
    service: State<'_, BrowserReadingModeService>,
    url: String
) -> Vec<Annotation> {
    service.get_annotations(&url)
}

#[tauri::command]
pub fn reading_mode_update_annotation(
    service: State<'_, BrowserReadingModeService>,
    url: String,
    annotation_id: String,
    note: String
) -> Result<Annotation, String> {
    service.update_annotation(&url, &annotation_id, &note)
}

#[tauri::command]
pub fn reading_mode_delete_annotation(
    service: State<'_, BrowserReadingModeService>,
    url: String,
    annotation_id: String
) -> Result<(), String> {
    service.delete_annotation(&url, &annotation_id)
}

// ==================== Theme Commands ====================

#[tauri::command]
pub fn reading_mode_get_custom_theme(
    service: State<'_, BrowserReadingModeService>,
    theme_id: String
) -> Option<CustomTheme> {
    service.get_custom_theme(&theme_id)
}

#[tauri::command]
pub fn reading_mode_get_all_custom_themes(
    service: State<'_, BrowserReadingModeService>
) -> Vec<CustomTheme> {
    service.get_all_custom_themes()
}

#[tauri::command]
pub fn reading_mode_create_custom_theme(
    service: State<'_, BrowserReadingModeService>,
    theme: CustomTheme
) -> String {
    service.create_custom_theme(theme)
}

#[tauri::command]
pub fn reading_mode_delete_custom_theme(
    service: State<'_, BrowserReadingModeService>,
    theme_id: String
) -> Result<(), String> {
    service.delete_custom_theme(&theme_id)
}

// ==================== Stats Commands ====================

#[tauri::command]
pub fn reading_mode_get_stats(
    service: State<'_, BrowserReadingModeService>
) -> ReadingStats {
    service.get_stats()
}
