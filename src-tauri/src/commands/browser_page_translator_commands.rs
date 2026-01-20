// CUBE Nexum - Page Translator Commands
// Tauri commands for page translation service

use tauri::State;
use crate::services::browser_page_translator::{
    BrowserPageTranslatorService, TranslatorSettings, Language, TranslationResult,
    TranslationOptions, Glossary, GlossaryEntry, TranslationHistory,
    SiteLanguagePreference, TranslatorStats, TranslationEngine,
};

// ==================== Settings Commands ====================

#[tauri::command]
pub fn get_translator_settings(
    service: State<'_, BrowserPageTranslatorService>
) -> TranslatorSettings {
    service.get_settings()
}

#[tauri::command]
pub fn update_translator_settings(
    service: State<'_, BrowserPageTranslatorService>,
    settings: TranslatorSettings
) {
    service.update_settings(settings);
}

#[tauri::command]
pub fn set_translator_api_key(
    service: State<'_, BrowserPageTranslatorService>,
    engine: TranslationEngine,
    api_key: String
) {
    service.set_api_key(engine, api_key);
}

// ==================== Language Commands ====================

#[tauri::command]
pub fn get_supported_languages(
    service: State<'_, BrowserPageTranslatorService>
) -> Vec<Language> {
    service.get_supported_languages()
}

#[tauri::command]
pub fn get_language(
    service: State<'_, BrowserPageTranslatorService>,
    code: String
) -> Option<Language> {
    service.get_language(&code)
}

#[tauri::command]
pub fn detect_language(
    service: State<'_, BrowserPageTranslatorService>,
    text: String
) -> Option<String> {
    service.detect_language(&text)
}

// ==================== Translation Commands ====================

#[tauri::command]
pub fn translate_text(
    service: State<'_, BrowserPageTranslatorService>,
    source_text: String,
    source_language: Option<String>,
    target_language: String,
    options: Option<TranslationOptions>
) -> TranslationResult {
    service.translate(source_text, source_language, target_language, options)
}

// ==================== Glossary Commands ====================

#[tauri::command]
pub fn create_translation_glossary(
    service: State<'_, BrowserPageTranslatorService>,
    name: String,
    source_language: String,
    target_language: String
) -> Glossary {
    service.create_glossary(name, source_language, target_language)
}

#[tauri::command]
pub fn get_translation_glossary(
    service: State<'_, BrowserPageTranslatorService>,
    glossary_id: String
) -> Option<Glossary> {
    service.get_glossary(&glossary_id)
}

#[tauri::command]
pub fn get_all_translation_glossaries(
    service: State<'_, BrowserPageTranslatorService>
) -> Vec<Glossary> {
    service.get_all_glossaries()
}

#[tauri::command]
pub fn add_glossary_entry(
    service: State<'_, BrowserPageTranslatorService>,
    glossary_id: String,
    entry: GlossaryEntry
) -> Result<Glossary, String> {
    service.add_glossary_entry(&glossary_id, entry)
}

#[tauri::command]
pub fn remove_glossary_entry(
    service: State<'_, BrowserPageTranslatorService>,
    glossary_id: String,
    source_term: String
) -> Result<Glossary, String> {
    service.remove_glossary_entry(&glossary_id, &source_term)
}

#[tauri::command]
pub fn delete_translation_glossary(
    service: State<'_, BrowserPageTranslatorService>,
    glossary_id: String
) -> Result<(), String> {
    service.delete_glossary(&glossary_id)
}

// ==================== History Commands ====================

#[tauri::command]
pub fn add_translation_to_history(
    service: State<'_, BrowserPageTranslatorService>,
    source_text: String,
    translated_text: String,
    source_language: String,
    target_language: String,
    engine: TranslationEngine,
    url: Option<String>
) {
    service.add_to_history(source_text, translated_text, source_language, target_language, engine, url);
}

#[tauri::command]
pub fn get_translation_history(
    service: State<'_, BrowserPageTranslatorService>,
    limit: Option<u32>
) -> Vec<TranslationHistory> {
    service.get_history(limit)
}

#[tauri::command]
pub fn toggle_translation_favorite(
    service: State<'_, BrowserPageTranslatorService>,
    history_id: String
) -> Result<TranslationHistory, String> {
    service.toggle_favorite(&history_id)
}

#[tauri::command]
pub fn clear_translation_history(
    service: State<'_, BrowserPageTranslatorService>
) {
    service.clear_history();
}

// ==================== Site Preference Commands ====================

#[tauri::command]
pub fn set_site_language_preference(
    service: State<'_, BrowserPageTranslatorService>,
    domain: String,
    preferred_language: String,
    auto_translate: bool
) {
    service.set_site_preference(domain, preferred_language, auto_translate);
}

#[tauri::command]
pub fn get_site_language_preference(
    service: State<'_, BrowserPageTranslatorService>,
    domain: String
) -> Option<SiteLanguagePreference> {
    service.get_site_preference(&domain)
}

#[tauri::command]
pub fn get_all_site_language_preferences(
    service: State<'_, BrowserPageTranslatorService>
) -> Vec<SiteLanguagePreference> {
    service.get_all_site_preferences()
}

#[tauri::command]
pub fn remove_site_language_preference(
    service: State<'_, BrowserPageTranslatorService>,
    domain: String
) -> Result<(), String> {
    service.remove_site_preference(&domain)
}

// ==================== Stats Commands ====================

#[tauri::command]
pub fn get_translator_stats(
    service: State<'_, BrowserPageTranslatorService>
) -> TranslatorStats {
    service.get_stats()
}

#[tauri::command]
pub fn clear_translation_cache(
    service: State<'_, BrowserPageTranslatorService>
) {
    service.clear_cache();
}
