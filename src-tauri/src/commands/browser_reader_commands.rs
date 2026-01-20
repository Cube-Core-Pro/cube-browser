// CUBE Nexum - Reader Mode Commands
// Tauri commands for clean reading view with TTS and annotations

use tauri::State;
use std::sync::Mutex;
use crate::services::browser_reader::{
    BrowserReaderService, ReaderSettings, TTSSettings, CustomTheme,
    ReaderTheme, ReaderFont, TextAlignment, TTSSpeed,
    ParsedArticle, ReadingSession, Annotation, AnnotationType, HighlightColor,
    TTSPlaybackState, ReaderStats,
};

pub struct ReaderState(pub Mutex<BrowserReaderService>);

// ==================== Settings Commands ====================

#[tauri::command]
pub fn reader_get_settings(state: State<ReaderState>) -> Result<ReaderSettings, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(service.get_settings())
}

#[tauri::command]
pub fn reader_update_settings(
    state: State<ReaderState>,
    settings: ReaderSettings,
) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.update_settings(settings);
    Ok(())
}

#[tauri::command]
pub fn reader_set_theme(
    state: State<ReaderState>,
    theme: ReaderTheme,
) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.set_theme(theme);
    Ok(())
}

#[tauri::command]
pub fn reader_set_font(
    state: State<ReaderState>,
    font: ReaderFont,
) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.set_font(font);
    Ok(())
}

#[tauri::command]
pub fn reader_set_font_size(
    state: State<ReaderState>,
    size: u32,
) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.set_font_size(size);
    Ok(())
}

#[tauri::command]
pub fn reader_increase_font_size(state: State<ReaderState>) -> Result<u32, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.increase_font_size();
    Ok(service.get_settings().font_size)
}

#[tauri::command]
pub fn reader_decrease_font_size(state: State<ReaderState>) -> Result<u32, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.decrease_font_size();
    Ok(service.get_settings().font_size)
}

#[tauri::command]
pub fn reader_set_line_height(
    state: State<ReaderState>,
    height: f32,
) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.set_line_height(height);
    Ok(())
}

#[tauri::command]
pub fn reader_set_content_width(
    state: State<ReaderState>,
    width: u32,
) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.set_content_width(width);
    Ok(())
}

#[tauri::command]
pub fn reader_set_text_alignment(
    state: State<ReaderState>,
    alignment: TextAlignment,
) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.set_text_alignment(alignment);
    Ok(())
}

#[tauri::command]
pub fn reader_toggle_images(state: State<ReaderState>) -> Result<bool, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.toggle_images();
    Ok(service.get_settings().show_images)
}

#[tauri::command]
pub fn reader_toggle_links(state: State<ReaderState>) -> Result<bool, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.toggle_links();
    Ok(service.get_settings().show_links)
}

// ==================== TTS Settings Commands ====================

#[tauri::command]
pub fn reader_get_tts_settings(state: State<ReaderState>) -> Result<TTSSettings, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(service.get_tts_settings())
}

#[tauri::command]
pub fn reader_update_tts_settings(
    state: State<ReaderState>,
    settings: TTSSettings,
) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.update_tts_settings(settings);
    Ok(())
}

#[tauri::command]
pub fn reader_set_tts_speed(
    state: State<ReaderState>,
    speed: TTSSpeed,
) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.set_tts_speed(speed);
    Ok(())
}

#[tauri::command]
pub fn reader_set_tts_voice(
    state: State<ReaderState>,
    voice: String,
) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.set_tts_voice(voice);
    Ok(())
}

#[tauri::command]
pub fn reader_set_tts_volume(
    state: State<ReaderState>,
    volume: f32,
) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.set_tts_volume(volume);
    Ok(())
}

// ==================== Custom Themes Commands ====================

#[tauri::command]
pub fn reader_get_themes(state: State<ReaderState>) -> Result<Vec<CustomTheme>, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(service.get_custom_themes())
}

#[tauri::command]
pub fn reader_get_theme(
    state: State<ReaderState>,
    id: String,
) -> Result<Option<CustomTheme>, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(service.get_theme(&id))
}

#[tauri::command]
pub fn reader_add_theme(
    state: State<ReaderState>,
    theme: CustomTheme,
) -> Result<String, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(service.add_custom_theme(theme))
}

#[tauri::command]
pub fn reader_remove_theme(
    state: State<ReaderState>,
    id: String,
) -> Result<bool, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(service.remove_custom_theme(&id))
}

// ==================== Article Commands ====================

#[tauri::command]
pub fn reader_parse_article(
    state: State<ReaderState>,
    url: String,
    html: String,
) -> Result<ParsedArticle, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.parse_article(&url, &html)
}

#[tauri::command]
pub fn reader_get_article(
    state: State<ReaderState>,
    id: String,
) -> Result<Option<ParsedArticle>, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(service.get_article(&id))
}

#[tauri::command]
pub fn reader_get_recent_articles(
    state: State<ReaderState>,
    limit: usize,
) -> Result<Vec<ParsedArticle>, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(service.get_recent_articles(limit))
}

// ==================== Session Commands ====================

#[tauri::command]
pub fn reader_get_session(
    state: State<ReaderState>,
    article_id: String,
) -> Result<Option<ReadingSession>, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(service.get_session(&article_id))
}

#[tauri::command]
pub fn reader_update_progress(
    state: State<ReaderState>,
    article_id: String,
    scroll_position: f32,
    time_spent: u64,
) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.update_progress(&article_id, scroll_position, time_spent);
    Ok(())
}

#[tauri::command]
pub fn reader_get_history(
    state: State<ReaderState>,
    limit: usize,
) -> Result<Vec<ReadingSession>, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(service.get_reading_history(limit))
}

#[tauri::command]
pub fn reader_get_in_progress(state: State<ReaderState>) -> Result<Vec<ReadingSession>, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(service.get_in_progress())
}

// ==================== Annotation Commands ====================

#[tauri::command]
pub fn reader_create_annotation(
    state: State<ReaderState>,
    article_id: String,
    annotation_type: AnnotationType,
    color: HighlightColor,
    selected_text: String,
    note: Option<String>,
    start_offset: u32,
    end_offset: u32,
    paragraph_index: u32,
) -> Result<Annotation, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(service.create_annotation(
        &article_id,
        annotation_type,
        color,
        &selected_text,
        note,
        start_offset,
        end_offset,
        paragraph_index,
    ))
}

#[tauri::command]
pub fn reader_update_annotation(
    state: State<ReaderState>,
    article_id: String,
    annotation_id: String,
    note: Option<String>,
    color: Option<HighlightColor>,
) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.update_annotation(&article_id, &annotation_id, note, color);
    Ok(())
}

#[tauri::command]
pub fn reader_delete_annotation(
    state: State<ReaderState>,
    article_id: String,
    annotation_id: String,
) -> Result<bool, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(service.delete_annotation(&article_id, &annotation_id))
}

#[tauri::command]
pub fn reader_get_annotations(
    state: State<ReaderState>,
    article_id: String,
) -> Result<Vec<Annotation>, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(service.get_annotations(&article_id))
}

#[tauri::command]
pub fn reader_get_all_annotations(state: State<ReaderState>) -> Result<Vec<Annotation>, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(service.get_all_annotations())
}

#[tauri::command]
pub fn reader_export_annotations(
    state: State<ReaderState>,
    article_id: String,
) -> Result<String, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(service.export_annotations(&article_id))
}

// ==================== TTS Control Commands ====================

#[tauri::command]
pub fn reader_start_tts(
    state: State<ReaderState>,
    article_id: String,
) -> Result<TTSPlaybackState, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.start_tts(&article_id)
}

#[tauri::command]
pub fn reader_pause_tts(state: State<ReaderState>) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.pause_tts();
    Ok(())
}

#[tauri::command]
pub fn reader_resume_tts(state: State<ReaderState>) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.resume_tts();
    Ok(())
}

#[tauri::command]
pub fn reader_stop_tts(state: State<ReaderState>) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.stop_tts();
    Ok(())
}

#[tauri::command]
pub fn reader_get_tts_state(state: State<ReaderState>) -> Result<Option<TTSPlaybackState>, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(service.get_tts_state())
}

#[tauri::command]
pub fn reader_skip_to_paragraph(
    state: State<ReaderState>,
    paragraph: u32,
) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.skip_to_paragraph(paragraph);
    Ok(())
}

// ==================== Statistics Commands ====================

#[tauri::command]
pub fn reader_get_stats(state: State<ReaderState>) -> Result<ReaderStats, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(service.get_stats())
}

#[tauri::command]
pub fn reader_reset_stats(state: State<ReaderState>) -> Result<(), String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    service.reset_stats();
    Ok(())
}

// ==================== Utility Commands ====================

#[tauri::command]
pub fn reader_generate_css(state: State<ReaderState>) -> Result<String, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(service.generate_css())
}

#[tauri::command]
pub fn reader_estimate_reading_time(
    state: State<ReaderState>,
    word_count: u32,
) -> Result<u32, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(service.estimate_reading_time(word_count))
}

#[tauri::command]
pub fn reader_format_reading_time(
    state: State<ReaderState>,
    minutes: u32,
) -> Result<String, String> {
    let service = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(service.format_reading_time(minutes))
}

// ==================== Available Options ====================

#[tauri::command]
pub fn reader_get_available_themes() -> Vec<(String, String)> {
    vec![
        ("Light".to_string(), "Clean white background".to_string()),
        ("Sepia".to_string(), "Warm paper-like tone".to_string()),
        ("Dark".to_string(), "Dark mode for low light".to_string()),
        ("Night".to_string(), "Pure black for OLED displays".to_string()),
    ]
}

#[tauri::command]
pub fn reader_get_available_fonts() -> Vec<(String, String)> {
    vec![
        ("System".to_string(), "System default font".to_string()),
        ("Serif".to_string(), "Classic serif (Georgia)".to_string()),
        ("SansSerif".to_string(), "Modern sans-serif (Helvetica)".to_string()),
        ("Monospace".to_string(), "Fixed-width (SF Mono)".to_string()),
        ("OpenDyslexic".to_string(), "Accessibility-focused font".to_string()),
    ]
}

#[tauri::command]
pub fn reader_get_highlight_colors() -> Vec<(String, String)> {
    vec![
        ("Yellow".to_string(), "#fef08a".to_string()),
        ("Green".to_string(), "#bbf7d0".to_string()),
        ("Blue".to_string(), "#bfdbfe".to_string()),
        ("Pink".to_string(), "#fbcfe8".to_string()),
        ("Purple".to_string(), "#ddd6fe".to_string()),
        ("Orange".to_string(), "#fed7aa".to_string()),
    ]
}

#[tauri::command]
pub fn reader_get_tts_speeds() -> Vec<(String, f32)> {
    vec![
        ("Very Slow (0.5x)".to_string(), 0.5),
        ("Slow (0.75x)".to_string(), 0.75),
        ("Normal (1.0x)".to_string(), 1.0),
        ("Fast (1.25x)".to_string(), 1.25),
        ("Very Fast (1.5x)".to_string(), 1.5),
    ]
}
