// CUBE Nexum - Page Translator Service
// Real-time page translation with multiple engines

use std::collections::HashMap;
use std::sync::RwLock;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// ==================== Types ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranslatorSettings {
    pub enabled: bool,
    pub default_target_language: String,
    pub auto_detect_language: bool,
    pub auto_translate_pages: bool,
    pub auto_translate_languages: Vec<String>,
    pub never_translate_languages: Vec<String>,
    pub never_translate_sites: Vec<String>,
    pub preferred_engine: TranslationEngine,
    pub show_original_on_hover: bool,
    pub show_translate_button: bool,
    pub translate_selected_text: bool,
    pub inline_translation: bool,
    pub preserve_formatting: bool,
    pub translate_images: bool,
    pub api_keys: HashMap<String, String>,
    pub keyboard_shortcuts: TranslatorShortcuts,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TranslationEngine {
    GoogleTranslate,
    DeepL,
    Microsoft,
    LibreTranslate,
    OpenAI,
    Local,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranslatorShortcuts {
    pub translate_page: String,
    pub translate_selection: String,
    pub show_original: String,
    pub toggle_auto_translate: String,
    pub change_target_language: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Language {
    pub code: String,
    pub name: String,
    pub native_name: String,
    pub rtl: bool,
    pub supported_engines: Vec<TranslationEngine>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranslationRequest {
    pub id: String,
    pub source_text: String,
    pub source_language: Option<String>,
    pub target_language: String,
    pub engine: TranslationEngine,
    pub context: Option<TranslationContext>,
    pub options: TranslationOptions,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranslationContext {
    pub url: Option<String>,
    pub page_title: Option<String>,
    pub domain: Option<String>,
    pub content_type: ContentType,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ContentType {
    Webpage,
    TextSelection,
    Image,
    Document,
    Form,
    Chat,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranslationOptions {
    pub preserve_html: bool,
    pub formality: Formality,
    pub glossary_id: Option<String>,
    pub split_sentences: bool,
    pub preserve_formatting: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Formality {
    Default,
    Formal,
    Informal,
    PreferFormal,
    PreferInformal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranslationResult {
    pub id: String,
    pub request_id: String,
    pub translated_text: String,
    pub detected_language: Option<String>,
    pub confidence: f32,
    pub engine_used: TranslationEngine,
    pub word_count: u32,
    pub character_count: u32,
    pub cached: bool,
    pub processing_time_ms: u64,
    pub alternatives: Vec<AlternativeTranslation>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlternativeTranslation {
    pub text: String,
    pub confidence: f32,
    pub engine: TranslationEngine,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranslatedPage {
    pub id: String,
    pub url: String,
    pub original_language: String,
    pub target_language: String,
    pub translated_elements: Vec<TranslatedElement>,
    pub engine: TranslationEngine,
    pub translation_time_ms: u64,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranslatedElement {
    pub selector: String,
    pub original_text: String,
    pub translated_text: String,
    pub element_type: ElementType,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ElementType {
    Text,
    Heading,
    Paragraph,
    Link,
    Button,
    Label,
    Placeholder,
    Alt,
    Title,
    Meta,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Glossary {
    pub id: String,
    pub name: String,
    pub source_language: String,
    pub target_language: String,
    pub entries: Vec<GlossaryEntry>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlossaryEntry {
    pub source_term: String,
    pub target_term: String,
    pub context: Option<String>,
    pub case_sensitive: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranslationHistory {
    pub id: String,
    pub source_text: String,
    pub translated_text: String,
    pub source_language: String,
    pub target_language: String,
    pub engine: TranslationEngine,
    pub url: Option<String>,
    pub is_favorite: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranslatorStats {
    pub total_translations: u64,
    pub total_characters: u64,
    pub total_words: u64,
    pub translations_by_language: HashMap<String, u32>,
    pub translations_by_engine: HashMap<String, u32>,
    pub average_processing_time_ms: u64,
    pub cache_hit_rate: f32,
    pub most_translated_pairs: Vec<(String, String, u32)>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SiteLanguagePreference {
    pub domain: String,
    pub preferred_language: String,
    pub auto_translate: bool,
    pub created_at: DateTime<Utc>,
}

// ==================== Service Implementation ====================

pub struct BrowserPageTranslatorService {
    settings: RwLock<AnnotatorSettings>,
    languages: RwLock<Vec<Language>>,
    glossaries: RwLock<HashMap<String, Glossary>>,
    history: RwLock<Vec<TranslationHistory>>,
    cache: RwLock<HashMap<String, TranslationResult>>,
    site_preferences: RwLock<HashMap<String, SiteLanguagePreference>>,
    stats: RwLock<TranslatorStatsInternal>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct AnnotatorSettings {
    pub enabled: bool,
    pub default_target_language: String,
    pub auto_detect_language: bool,
    pub auto_translate_pages: bool,
    pub auto_translate_languages: Vec<String>,
    pub never_translate_languages: Vec<String>,
    pub never_translate_sites: Vec<String>,
    pub preferred_engine: TranslationEngine,
    pub show_original_on_hover: bool,
    pub show_translate_button: bool,
    pub translate_selected_text: bool,
    pub inline_translation: bool,
    pub preserve_formatting: bool,
    pub translate_images: bool,
    pub api_keys: HashMap<String, String>,
    pub keyboard_shortcuts: TranslatorShortcuts,
}

#[derive(Debug, Default)]
struct TranslatorStatsInternal {
    total_translations: u64,
    total_characters: u64,
    total_words: u64,
    total_processing_time_ms: u64,
    cache_hits: u64,
    cache_misses: u64,
    by_language: HashMap<String, u32>,
    by_engine: HashMap<String, u32>,
    by_pair: HashMap<(String, String), u32>,
}

impl BrowserPageTranslatorService {
    pub fn new() -> Self {
        Self {
            settings: RwLock::new(Self::default_settings()),
            languages: RwLock::new(Self::default_languages()),
            glossaries: RwLock::new(HashMap::new()),
            history: RwLock::new(Vec::new()),
            cache: RwLock::new(HashMap::new()),
            site_preferences: RwLock::new(HashMap::new()),
            stats: RwLock::new(TranslatorStatsInternal::default()),
        }
    }

    fn default_settings() -> AnnotatorSettings {
        AnnotatorSettings {
            enabled: true,
            default_target_language: "en".to_string(),
            auto_detect_language: true,
            auto_translate_pages: false,
            auto_translate_languages: vec![],
            never_translate_languages: vec![],
            never_translate_sites: vec![],
            preferred_engine: TranslationEngine::GoogleTranslate,
            show_original_on_hover: true,
            show_translate_button: true,
            translate_selected_text: true,
            inline_translation: true,
            preserve_formatting: true,
            translate_images: false,
            api_keys: HashMap::new(),
            keyboard_shortcuts: TranslatorShortcuts {
                translate_page: "Ctrl+Shift+T".to_string(),
                translate_selection: "Ctrl+Shift+S".to_string(),
                show_original: "Ctrl+Shift+O".to_string(),
                toggle_auto_translate: "Ctrl+Shift+A".to_string(),
                change_target_language: "Ctrl+Shift+L".to_string(),
            },
        }
    }

    fn default_languages() -> Vec<Language> {
        vec![
            Language {
                code: "en".to_string(),
                name: "English".to_string(),
                native_name: "English".to_string(),
                rtl: false,
                supported_engines: vec![TranslationEngine::GoogleTranslate, TranslationEngine::DeepL, TranslationEngine::Microsoft, TranslationEngine::OpenAI],
            },
            Language {
                code: "es".to_string(),
                name: "Spanish".to_string(),
                native_name: "Español".to_string(),
                rtl: false,
                supported_engines: vec![TranslationEngine::GoogleTranslate, TranslationEngine::DeepL, TranslationEngine::Microsoft, TranslationEngine::OpenAI],
            },
            Language {
                code: "fr".to_string(),
                name: "French".to_string(),
                native_name: "Français".to_string(),
                rtl: false,
                supported_engines: vec![TranslationEngine::GoogleTranslate, TranslationEngine::DeepL, TranslationEngine::Microsoft, TranslationEngine::OpenAI],
            },
            Language {
                code: "de".to_string(),
                name: "German".to_string(),
                native_name: "Deutsch".to_string(),
                rtl: false,
                supported_engines: vec![TranslationEngine::GoogleTranslate, TranslationEngine::DeepL, TranslationEngine::Microsoft, TranslationEngine::OpenAI],
            },
            Language {
                code: "it".to_string(),
                name: "Italian".to_string(),
                native_name: "Italiano".to_string(),
                rtl: false,
                supported_engines: vec![TranslationEngine::GoogleTranslate, TranslationEngine::DeepL, TranslationEngine::Microsoft, TranslationEngine::OpenAI],
            },
            Language {
                code: "pt".to_string(),
                name: "Portuguese".to_string(),
                native_name: "Português".to_string(),
                rtl: false,
                supported_engines: vec![TranslationEngine::GoogleTranslate, TranslationEngine::DeepL, TranslationEngine::Microsoft, TranslationEngine::OpenAI],
            },
            Language {
                code: "zh".to_string(),
                name: "Chinese".to_string(),
                native_name: "中文".to_string(),
                rtl: false,
                supported_engines: vec![TranslationEngine::GoogleTranslate, TranslationEngine::DeepL, TranslationEngine::Microsoft, TranslationEngine::OpenAI],
            },
            Language {
                code: "ja".to_string(),
                name: "Japanese".to_string(),
                native_name: "日本語".to_string(),
                rtl: false,
                supported_engines: vec![TranslationEngine::GoogleTranslate, TranslationEngine::DeepL, TranslationEngine::Microsoft, TranslationEngine::OpenAI],
            },
            Language {
                code: "ko".to_string(),
                name: "Korean".to_string(),
                native_name: "한국어".to_string(),
                rtl: false,
                supported_engines: vec![TranslationEngine::GoogleTranslate, TranslationEngine::DeepL, TranslationEngine::Microsoft, TranslationEngine::OpenAI],
            },
            Language {
                code: "ru".to_string(),
                name: "Russian".to_string(),
                native_name: "Русский".to_string(),
                rtl: false,
                supported_engines: vec![TranslationEngine::GoogleTranslate, TranslationEngine::DeepL, TranslationEngine::Microsoft, TranslationEngine::OpenAI],
            },
            Language {
                code: "ar".to_string(),
                name: "Arabic".to_string(),
                native_name: "العربية".to_string(),
                rtl: true,
                supported_engines: vec![TranslationEngine::GoogleTranslate, TranslationEngine::Microsoft, TranslationEngine::OpenAI],
            },
            Language {
                code: "hi".to_string(),
                name: "Hindi".to_string(),
                native_name: "हिन्दी".to_string(),
                rtl: false,
                supported_engines: vec![TranslationEngine::GoogleTranslate, TranslationEngine::Microsoft, TranslationEngine::OpenAI],
            },
            Language {
                code: "nl".to_string(),
                name: "Dutch".to_string(),
                native_name: "Nederlands".to_string(),
                rtl: false,
                supported_engines: vec![TranslationEngine::GoogleTranslate, TranslationEngine::DeepL, TranslationEngine::Microsoft, TranslationEngine::OpenAI],
            },
            Language {
                code: "pl".to_string(),
                name: "Polish".to_string(),
                native_name: "Polski".to_string(),
                rtl: false,
                supported_engines: vec![TranslationEngine::GoogleTranslate, TranslationEngine::DeepL, TranslationEngine::Microsoft, TranslationEngine::OpenAI],
            },
            Language {
                code: "tr".to_string(),
                name: "Turkish".to_string(),
                native_name: "Türkçe".to_string(),
                rtl: false,
                supported_engines: vec![TranslationEngine::GoogleTranslate, TranslationEngine::Microsoft, TranslationEngine::OpenAI],
            },
        ]
    }

    // ==================== Settings ====================

    pub fn get_settings(&self) -> TranslatorSettings {
        let s = self.settings.read().unwrap();
        TranslatorSettings {
            enabled: s.enabled,
            default_target_language: s.default_target_language.clone(),
            auto_detect_language: s.auto_detect_language,
            auto_translate_pages: s.auto_translate_pages,
            auto_translate_languages: s.auto_translate_languages.clone(),
            never_translate_languages: s.never_translate_languages.clone(),
            never_translate_sites: s.never_translate_sites.clone(),
            preferred_engine: s.preferred_engine.clone(),
            show_original_on_hover: s.show_original_on_hover,
            show_translate_button: s.show_translate_button,
            translate_selected_text: s.translate_selected_text,
            inline_translation: s.inline_translation,
            preserve_formatting: s.preserve_formatting,
            translate_images: s.translate_images,
            api_keys: s.api_keys.clone(),
            keyboard_shortcuts: s.keyboard_shortcuts.clone(),
        }
    }

    pub fn update_settings(&self, new_settings: TranslatorSettings) {
        let mut settings = self.settings.write().unwrap();
        settings.enabled = new_settings.enabled;
        settings.default_target_language = new_settings.default_target_language;
        settings.auto_detect_language = new_settings.auto_detect_language;
        settings.auto_translate_pages = new_settings.auto_translate_pages;
        settings.auto_translate_languages = new_settings.auto_translate_languages;
        settings.never_translate_languages = new_settings.never_translate_languages;
        settings.never_translate_sites = new_settings.never_translate_sites;
        settings.preferred_engine = new_settings.preferred_engine;
        settings.show_original_on_hover = new_settings.show_original_on_hover;
        settings.show_translate_button = new_settings.show_translate_button;
        settings.translate_selected_text = new_settings.translate_selected_text;
        settings.inline_translation = new_settings.inline_translation;
        settings.preserve_formatting = new_settings.preserve_formatting;
        settings.translate_images = new_settings.translate_images;
        settings.api_keys = new_settings.api_keys;
        settings.keyboard_shortcuts = new_settings.keyboard_shortcuts;
    }

    pub fn set_api_key(&self, engine: TranslationEngine, api_key: String) {
        let mut settings = self.settings.write().unwrap();
        settings.api_keys.insert(format!("{:?}", engine), api_key);
    }

    // ==================== Languages ====================

    pub fn get_supported_languages(&self) -> Vec<Language> {
        self.languages.read().unwrap().clone()
    }

    pub fn get_language(&self, code: &str) -> Option<Language> {
        self.languages.read().unwrap()
            .iter()
            .find(|l| l.code == code)
            .cloned()
    }

    pub fn detect_language(&self, text: &str) -> Option<String> {
        // Simple language detection heuristics
        let text_lower = text.to_lowercase();
        
        // Check for CJK characters
        if text.chars().any(|c| c >= '\u{4E00}' && c <= '\u{9FFF}') {
            return Some("zh".to_string());
        }
        if text.chars().any(|c| c >= '\u{3040}' && c <= '\u{309F}') {
            return Some("ja".to_string());
        }
        if text.chars().any(|c| c >= '\u{AC00}' && c <= '\u{D7AF}') {
            return Some("ko".to_string());
        }
        if text.chars().any(|c| c >= '\u{0600}' && c <= '\u{06FF}') {
            return Some("ar".to_string());
        }
        if text.chars().any(|c| c >= '\u{0400}' && c <= '\u{04FF}') {
            return Some("ru".to_string());
        }
        if text.chars().any(|c| c >= '\u{0900}' && c <= '\u{097F}') {
            return Some("hi".to_string());
        }
        
        // Check for common words in different languages
        let spanish_words = ["que", "de", "en", "el", "la", "los", "las", "por", "con", "para"];
        let french_words = ["que", "de", "le", "la", "les", "une", "des", "est", "dans", "pour"];
        let german_words = ["und", "der", "die", "das", "ist", "nicht", "ein", "eine", "zu", "mit"];
        let italian_words = ["che", "di", "il", "la", "non", "per", "una", "sono", "con", "come"];
        let portuguese_words = ["que", "de", "não", "para", "com", "uma", "por", "seu", "ela", "você"];

        let words: Vec<&str> = text_lower.split_whitespace().collect();
        
        let spanish_count = words.iter().filter(|w| spanish_words.contains(w)).count();
        let french_count = words.iter().filter(|w| french_words.contains(w)).count();
        let german_count = words.iter().filter(|w| german_words.contains(w)).count();
        let italian_count = words.iter().filter(|w| italian_words.contains(w)).count();
        let portuguese_count = words.iter().filter(|w| portuguese_words.contains(w)).count();

        let max_count = [spanish_count, french_count, german_count, italian_count, portuguese_count]
            .into_iter().max().unwrap_or(0);

        if max_count >= 2 {
            if spanish_count == max_count { return Some("es".to_string()); }
            if french_count == max_count { return Some("fr".to_string()); }
            if german_count == max_count { return Some("de".to_string()); }
            if italian_count == max_count { return Some("it".to_string()); }
            if portuguese_count == max_count { return Some("pt".to_string()); }
        }

        // Default to English
        Some("en".to_string())
    }

    // ==================== Translation ====================

    pub fn translate(&self, 
        source_text: String,
        source_language: Option<String>,
        target_language: String,
        options: Option<TranslationOptions>
    ) -> TranslationResult {
        let settings = self.settings.read().unwrap();
        let engine = settings.preferred_engine.clone();
        let _opts = options.unwrap_or(TranslationOptions {
            preserve_html: false,
            formality: Formality::Default,
            glossary_id: None,
            split_sentences: true,
            preserve_formatting: settings.preserve_formatting,
        });
        drop(settings);

        let cache_key = format!("{}:{}:{}:{:?}", source_text, source_language.clone().unwrap_or_default(), target_language, engine);

        // Check cache
        if let Some(cached) = self.cache.read().unwrap().get(&cache_key) {
            let mut stats = self.stats.write().unwrap();
            stats.cache_hits += 1;
            let mut result = cached.clone();
            result.cached = true;
            return result;
        }

        let mut stats = self.stats.write().unwrap();
        stats.cache_misses += 1;
        drop(stats);

        let start_time = std::time::Instant::now();

        // Detect source language if not provided
        let detected = source_language.clone().or_else(|| self.detect_language(&source_text));

        // Simulate translation (in real implementation, call translation API)
        let translated_text = self.simulate_translation(&source_text, detected.as_deref(), &target_language);

        let processing_time = start_time.elapsed().as_millis() as u64;

        let word_count = source_text.split_whitespace().count() as u32;
        let char_count = source_text.chars().count() as u32;

        let result = TranslationResult {
            id: Uuid::new_v4().to_string(),
            request_id: Uuid::new_v4().to_string(),
            translated_text,
            detected_language: detected.clone(),
            confidence: 0.95,
            engine_used: engine.clone(),
            word_count,
            character_count: char_count,
            cached: false,
            processing_time_ms: processing_time,
            alternatives: Vec::new(),
            created_at: Utc::now(),
        };

        // Update cache
        self.cache.write().unwrap().insert(cache_key, result.clone());

        // Update stats
        let mut stats = self.stats.write().unwrap();
        stats.total_translations += 1;
        stats.total_characters += char_count as u64;
        stats.total_words += word_count as u64;
        stats.total_processing_time_ms += processing_time;
        *stats.by_language.entry(target_language.clone()).or_insert(0) += 1;
        *stats.by_engine.entry(format!("{:?}", engine)).or_insert(0) += 1;
        let pair = (detected.unwrap_or_default(), target_language);
        *stats.by_pair.entry(pair).or_insert(0) += 1;

        result
    }

    fn simulate_translation(&self, text: &str, _source: Option<&str>, _target: &str) -> String {
        // In real implementation, this would call the translation API
        // For now, return a placeholder
        format!("[Translated] {}", text)
    }

    // ==================== Glossary ====================

    pub fn create_glossary(&self, name: String, source_language: String, target_language: String) -> Glossary {
        let glossary = Glossary {
            id: Uuid::new_v4().to_string(),
            name,
            source_language,
            target_language,
            entries: Vec::new(),
            is_active: true,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let id = glossary.id.clone();
        self.glossaries.write().unwrap().insert(id, glossary.clone());

        glossary
    }

    pub fn get_glossary(&self, glossary_id: &str) -> Option<Glossary> {
        self.glossaries.read().unwrap().get(glossary_id).cloned()
    }

    pub fn get_all_glossaries(&self) -> Vec<Glossary> {
        self.glossaries.read().unwrap().values().cloned().collect()
    }

    pub fn add_glossary_entry(&self, glossary_id: &str, entry: GlossaryEntry) -> Result<Glossary, String> {
        let mut glossaries = self.glossaries.write().unwrap();
        let glossary = glossaries.get_mut(glossary_id)
            .ok_or_else(|| "Glossary not found".to_string())?;

        glossary.entries.push(entry);
        glossary.updated_at = Utc::now();

        Ok(glossary.clone())
    }

    pub fn remove_glossary_entry(&self, glossary_id: &str, source_term: &str) -> Result<Glossary, String> {
        let mut glossaries = self.glossaries.write().unwrap();
        let glossary = glossaries.get_mut(glossary_id)
            .ok_or_else(|| "Glossary not found".to_string())?;

        glossary.entries.retain(|e| e.source_term != source_term);
        glossary.updated_at = Utc::now();

        Ok(glossary.clone())
    }

    pub fn delete_glossary(&self, glossary_id: &str) -> Result<(), String> {
        self.glossaries.write().unwrap()
            .remove(glossary_id)
            .ok_or_else(|| "Glossary not found".to_string())?;
        Ok(())
    }

    // ==================== History ====================

    pub fn add_to_history(&self, 
        source_text: String, 
        translated_text: String,
        source_language: String,
        target_language: String,
        engine: TranslationEngine,
        url: Option<String>
    ) {
        let entry = TranslationHistory {
            id: Uuid::new_v4().to_string(),
            source_text,
            translated_text,
            source_language,
            target_language,
            engine,
            url,
            is_favorite: false,
            created_at: Utc::now(),
        };

        let mut history = self.history.write().unwrap();
        history.insert(0, entry);

        // Keep only last 1000 entries
        if history.len() > 1000 {
            history.truncate(1000);
        }
    }

    pub fn get_history(&self, limit: Option<u32>) -> Vec<TranslationHistory> {
        let history = self.history.read().unwrap();
        let limit = limit.unwrap_or(100) as usize;
        history.iter().take(limit).cloned().collect()
    }

    pub fn toggle_favorite(&self, history_id: &str) -> Result<TranslationHistory, String> {
        let mut history = self.history.write().unwrap();
        let entry = history.iter_mut()
            .find(|e| e.id == history_id)
            .ok_or_else(|| "History entry not found".to_string())?;

        entry.is_favorite = !entry.is_favorite;
        Ok(entry.clone())
    }

    pub fn clear_history(&self) {
        self.history.write().unwrap().clear();
    }

    // ==================== Site Preferences ====================

    pub fn set_site_preference(&self, domain: String, preferred_language: String, auto_translate: bool) {
        let pref = SiteLanguagePreference {
            domain: domain.clone(),
            preferred_language,
            auto_translate,
            created_at: Utc::now(),
        };

        self.site_preferences.write().unwrap().insert(domain, pref);
    }

    pub fn get_site_preference(&self, domain: &str) -> Option<SiteLanguagePreference> {
        self.site_preferences.read().unwrap().get(domain).cloned()
    }

    pub fn get_all_site_preferences(&self) -> Vec<SiteLanguagePreference> {
        self.site_preferences.read().unwrap().values().cloned().collect()
    }

    pub fn remove_site_preference(&self, domain: &str) -> Result<(), String> {
        self.site_preferences.write().unwrap()
            .remove(domain)
            .ok_or_else(|| "Preference not found".to_string())?;
        Ok(())
    }

    // ==================== Stats ====================

    pub fn get_stats(&self) -> TranslatorStats {
        let stats = self.stats.read().unwrap();

        let avg_time = if stats.total_translations > 0 {
            stats.total_processing_time_ms / stats.total_translations
        } else {
            0
        };

        let cache_rate = if stats.cache_hits + stats.cache_misses > 0 {
            stats.cache_hits as f32 / (stats.cache_hits + stats.cache_misses) as f32
        } else {
            0.0
        };

        let mut most_translated: Vec<(String, String, u32)> = stats.by_pair
            .iter()
            .map(|((s, t), c)| (s.clone(), t.clone(), *c))
            .collect();
        most_translated.sort_by(|a, b| b.2.cmp(&a.2));
        most_translated.truncate(10);

        TranslatorStats {
            total_translations: stats.total_translations,
            total_characters: stats.total_characters,
            total_words: stats.total_words,
            translations_by_language: stats.by_language.clone(),
            translations_by_engine: stats.by_engine.clone(),
            average_processing_time_ms: avg_time,
            cache_hit_rate: cache_rate,
            most_translated_pairs: most_translated,
        }
    }

    pub fn clear_cache(&self) {
        self.cache.write().unwrap().clear();
    }
}

impl Default for BrowserPageTranslatorService {
    fn default() -> Self {
        Self::new()
    }
}
