// CUBE Nexum - Reading Mode Service
// Distraction-free article reading with customization

use std::collections::HashMap;
use std::sync::RwLock;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// ==================== Types ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReadingModeContent {
    pub id: String,
    pub url: String,
    pub title: String,
    pub author: Option<String>,
    pub published_date: Option<String>,
    pub site_name: Option<String>,
    pub content_html: String,
    pub content_text: String,
    pub lead_image: Option<String>,
    pub images: Vec<ArticleImage>,
    pub word_count: u32,
    pub reading_time_minutes: u32,
    pub language: Option<String>,
    pub excerpt: Option<String>,
    pub metadata: ArticleMetadata,
    pub extracted_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArticleImage {
    pub url: String,
    pub alt: Option<String>,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub caption: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArticleMetadata {
    pub keywords: Vec<String>,
    pub description: Option<String>,
    pub canonical_url: Option<String>,
    pub open_graph: Option<OpenGraphData>,
    pub twitter_card: Option<TwitterCardData>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenGraphData {
    pub title: Option<String>,
    pub description: Option<String>,
    pub image: Option<String>,
    pub og_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TwitterCardData {
    pub card_type: Option<String>,
    pub title: Option<String>,
    pub description: Option<String>,
    pub image: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReadingSettings {
    pub enabled: bool,
    pub auto_detect: bool,
    pub theme: ReadingTheme,
    pub custom_theme: Option<CustomTheme>,
    pub font: FontSettings,
    pub layout: LayoutSettings,
    pub features: FeatureSettings,
    pub shortcuts: ReadingShortcuts,
    pub auto_scroll: AutoScrollSettings,
    pub tts: TextToSpeechSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ReadingTheme {
    Light,
    Dark,
    Sepia,
    Paper,
    Night,
    HighContrast,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomTheme {
    pub name: String,
    pub background_color: String,
    pub text_color: String,
    pub link_color: String,
    pub heading_color: String,
    pub quote_background: String,
    pub quote_border: String,
    pub code_background: String,
    pub selection_color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FontSettings {
    pub family: String,
    pub size: u32,
    pub line_height: f32,
    pub letter_spacing: f32,
    pub weight: u32,
    pub serif_fonts: Vec<String>,
    pub sans_serif_fonts: Vec<String>,
    pub monospace_fonts: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LayoutSettings {
    pub width: LayoutWidth,
    pub custom_width_px: Option<u32>,
    pub text_align: TextAlign,
    pub paragraph_spacing: f32,
    pub image_display: ImageDisplay,
    pub show_images: bool,
    pub show_tables: bool,
    pub show_code_blocks: bool,
    pub show_blockquotes: bool,
    pub show_lists: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum LayoutWidth {
    Narrow,  // ~500px
    Medium,  // ~700px
    Wide,    // ~900px
    Full,    // 100%
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TextAlign {
    Left,
    Justify,
    Center,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ImageDisplay {
    Inline,
    FullWidth,
    Hidden,
    Thumbnail,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeatureSettings {
    pub show_reading_time: bool,
    pub show_word_count: bool,
    pub show_progress_bar: bool,
    pub show_toc: bool,
    pub show_article_info: bool,
    pub highlight_enabled: bool,
    pub annotations_enabled: bool,
    pub dictionary_enabled: bool,
    pub translations_enabled: bool,
    pub bionic_reading: bool,
    pub focus_mode: bool,
    pub remember_position: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReadingShortcuts {
    pub toggle_reading_mode: String,
    pub toggle_theme: String,
    pub increase_font: String,
    pub decrease_font: String,
    pub toggle_toc: String,
    pub toggle_focus: String,
    pub start_tts: String,
    pub stop_tts: String,
    pub add_highlight: String,
    pub add_annotation: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutoScrollSettings {
    pub enabled: bool,
    pub speed: u32, // words per minute
    pub pause_at_images: bool,
    pub pause_at_headings: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TextToSpeechSettings {
    pub enabled: bool,
    pub voice: String,
    pub rate: f32,
    pub pitch: f32,
    pub volume: f32,
    pub highlight_spoken: bool,
    pub auto_pause_at_punctuation: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReadingProgress {
    pub url: String,
    pub scroll_position: f32,
    pub percentage: f32,
    pub time_spent_seconds: u64,
    pub last_read: DateTime<Utc>,
    pub completed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Highlight {
    pub id: String,
    pub url: String,
    pub text: String,
    pub start_offset: u32,
    pub end_offset: u32,
    pub color: HighlightColor,
    pub note: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum HighlightColor {
    Yellow,
    Green,
    Blue,
    Pink,
    Orange,
    Purple,
    Custom(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Annotation {
    pub id: String,
    pub url: String,
    pub text: String,
    pub note: String,
    pub position: u32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SavedArticle {
    pub id: String,
    pub content: ReadingModeContent,
    pub highlights: Vec<Highlight>,
    pub annotations: Vec<Annotation>,
    pub progress: ReadingProgress,
    pub tags: Vec<String>,
    pub saved_at: DateTime<Utc>,
    pub is_archived: bool,
    pub is_favorite: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReadingStats {
    pub total_articles_read: u64,
    pub total_words_read: u64,
    pub total_time_reading_minutes: u64,
    pub articles_completed: u64,
    pub highlights_created: u64,
    pub annotations_created: u64,
    pub average_reading_speed_wpm: u32,
    pub favorite_topics: Vec<String>,
    pub reading_streak_days: u32,
    pub last_read_date: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableOfContents {
    pub entries: Vec<TocEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TocEntry {
    pub id: String,
    pub text: String,
    pub level: u8,
    pub position: u32,
}

// ==================== Service Implementation ====================

pub struct BrowserReadingModeService {
    settings: RwLock<ReadingSettings>,
    saved_articles: RwLock<HashMap<String, SavedArticle>>,
    reading_progress: RwLock<HashMap<String, ReadingProgress>>,
    highlights: RwLock<HashMap<String, Vec<Highlight>>>,
    annotations: RwLock<HashMap<String, Vec<Annotation>>>,
    stats: RwLock<ReadingStats>,
    custom_themes: RwLock<HashMap<String, CustomTheme>>,
}

impl BrowserReadingModeService {
    pub fn new() -> Self {
        Self {
            settings: RwLock::new(Self::default_settings()),
            saved_articles: RwLock::new(HashMap::new()),
            reading_progress: RwLock::new(HashMap::new()),
            highlights: RwLock::new(HashMap::new()),
            annotations: RwLock::new(HashMap::new()),
            stats: RwLock::new(Self::default_stats()),
            custom_themes: RwLock::new(Self::default_themes()),
        }
    }

    fn default_settings() -> ReadingSettings {
        ReadingSettings {
            enabled: true,
            auto_detect: true,
            theme: ReadingTheme::Light,
            custom_theme: None,
            font: FontSettings {
                family: "Georgia".to_string(),
                size: 18,
                line_height: 1.8,
                letter_spacing: 0.0,
                weight: 400,
                serif_fonts: vec![
                    "Georgia".to_string(),
                    "Times New Roman".to_string(),
                    "Palatino".to_string(),
                    "Merriweather".to_string(),
                    "Lora".to_string(),
                ],
                sans_serif_fonts: vec![
                    "Arial".to_string(),
                    "Helvetica".to_string(),
                    "Inter".to_string(),
                    "Roboto".to_string(),
                    "Open Sans".to_string(),
                ],
                monospace_fonts: vec![
                    "Consolas".to_string(),
                    "Monaco".to_string(),
                    "Fira Code".to_string(),
                    "JetBrains Mono".to_string(),
                ],
            },
            layout: LayoutSettings {
                width: LayoutWidth::Medium,
                custom_width_px: None,
                text_align: TextAlign::Left,
                paragraph_spacing: 1.5,
                image_display: ImageDisplay::Inline,
                show_images: true,
                show_tables: true,
                show_code_blocks: true,
                show_blockquotes: true,
                show_lists: true,
            },
            features: FeatureSettings {
                show_reading_time: true,
                show_word_count: true,
                show_progress_bar: true,
                show_toc: true,
                show_article_info: true,
                highlight_enabled: true,
                annotations_enabled: true,
                dictionary_enabled: true,
                translations_enabled: false,
                bionic_reading: false,
                focus_mode: false,
                remember_position: true,
            },
            shortcuts: ReadingShortcuts {
                toggle_reading_mode: "Alt+R".to_string(),
                toggle_theme: "Alt+T".to_string(),
                increase_font: "Ctrl+Plus".to_string(),
                decrease_font: "Ctrl+Minus".to_string(),
                toggle_toc: "Alt+O".to_string(),
                toggle_focus: "Alt+F".to_string(),
                start_tts: "Alt+S".to_string(),
                stop_tts: "Escape".to_string(),
                add_highlight: "Alt+H".to_string(),
                add_annotation: "Alt+N".to_string(),
            },
            auto_scroll: AutoScrollSettings {
                enabled: false,
                speed: 200,
                pause_at_images: true,
                pause_at_headings: true,
            },
            tts: TextToSpeechSettings {
                enabled: true,
                voice: "default".to_string(),
                rate: 1.0,
                pitch: 1.0,
                volume: 1.0,
                highlight_spoken: true,
                auto_pause_at_punctuation: true,
            },
        }
    }

    fn default_stats() -> ReadingStats {
        ReadingStats {
            total_articles_read: 0,
            total_words_read: 0,
            total_time_reading_minutes: 0,
            articles_completed: 0,
            highlights_created: 0,
            annotations_created: 0,
            average_reading_speed_wpm: 200,
            favorite_topics: Vec::new(),
            reading_streak_days: 0,
            last_read_date: None,
        }
    }

    fn default_themes() -> HashMap<String, CustomTheme> {
        let mut themes = HashMap::new();

        themes.insert("warm".to_string(), CustomTheme {
            name: "Warm".to_string(),
            background_color: "#FFF8E7".to_string(),
            text_color: "#5C4B37".to_string(),
            link_color: "#8B4513".to_string(),
            heading_color: "#3C2A1E".to_string(),
            quote_background: "#F5ECD7".to_string(),
            quote_border: "#D4B896".to_string(),
            code_background: "#F0E6D3".to_string(),
            selection_color: "#FFD700".to_string(),
        });

        themes.insert("ocean".to_string(), CustomTheme {
            name: "Ocean".to_string(),
            background_color: "#0A192F".to_string(),
            text_color: "#8892B0".to_string(),
            link_color: "#64FFDA".to_string(),
            heading_color: "#CCD6F6".to_string(),
            quote_background: "#112240".to_string(),
            quote_border: "#233554".to_string(),
            code_background: "#0D2137".to_string(),
            selection_color: "#64FFDA33".to_string(),
        });

        themes.insert("forest".to_string(), CustomTheme {
            name: "Forest".to_string(),
            background_color: "#1A2F1A".to_string(),
            text_color: "#A8C9A8".to_string(),
            link_color: "#7CB97C".to_string(),
            heading_color: "#D4E6D4".to_string(),
            quote_background: "#243624".to_string(),
            quote_border: "#3D5C3D".to_string(),
            code_background: "#1F331F".to_string(),
            selection_color: "#4CAF5033".to_string(),
        });

        themes
    }

    // ==================== Settings ====================

    pub fn get_settings(&self) -> ReadingSettings {
        self.settings.read().unwrap().clone()
    }

    pub fn update_settings(&self, new_settings: ReadingSettings) {
        let mut settings = self.settings.write().unwrap();
        *settings = new_settings;
    }

    pub fn set_theme(&self, theme: ReadingTheme) {
        let mut settings = self.settings.write().unwrap();
        settings.theme = theme;
    }

    pub fn set_font_size(&self, size: u32) {
        let mut settings = self.settings.write().unwrap();
        settings.font.size = size.max(12).min(32);
    }

    pub fn set_font_family(&self, family: String) {
        let mut settings = self.settings.write().unwrap();
        settings.font.family = family;
    }

    pub fn set_layout_width(&self, width: LayoutWidth) {
        let mut settings = self.settings.write().unwrap();
        settings.layout.width = width;
    }

    // ==================== Content Extraction ====================

    pub fn parse_article(&self, url: &str, html: &str, title: &str) -> ReadingModeContent {
        // Simplified extraction - in real implementation would use readability algorithm
        let text = self.strip_html(html);
        let word_count = text.split_whitespace().count() as u32;
        let reading_time = (word_count / 200).max(1); // 200 WPM average

        ReadingModeContent {
            id: Uuid::new_v4().to_string(),
            url: url.to_string(),
            title: title.to_string(),
            author: None,
            published_date: None,
            site_name: self.extract_domain(url),
            content_html: html.to_string(),
            content_text: text,
            lead_image: None,
            images: Vec::new(),
            word_count,
            reading_time_minutes: reading_time,
            language: Some("en".to_string()),
            excerpt: None,
            metadata: ArticleMetadata {
                keywords: Vec::new(),
                description: None,
                canonical_url: Some(url.to_string()),
                open_graph: None,
                twitter_card: None,
            },
            extracted_at: Utc::now(),
        }
    }

    fn strip_html(&self, html: &str) -> String {
        // Simple HTML stripping - in real implementation would be more robust
        let mut result = String::new();
        let mut in_tag = false;
        
        for c in html.chars() {
            match c {
                '<' => in_tag = true,
                '>' => in_tag = false,
                _ if !in_tag => result.push(c),
                _ => {}
            }
        }
        
        result
    }

    fn extract_domain(&self, url: &str) -> Option<String> {
        url.split("://")
            .nth(1)
            .and_then(|s| s.split('/').next())
            .map(|s| s.to_string())
    }

    pub fn generate_toc(&self, content: &ReadingModeContent) -> TableOfContents {
        // Parse headings from content
        let entries = self.extract_headings(&content.content_html);
        TableOfContents { entries }
    }

    fn extract_headings(&self, html: &str) -> Vec<TocEntry> {
        let mut entries = Vec::new();
        let mut position = 0u32;

        // Simple regex-like heading extraction
        for line in html.lines() {
            let line_lower = line.to_lowercase();
            
            for level in 1..=6 {
                let open_tag = format!("<h{}", level);
                let close_tag = format!("</h{}>", level);
                
                if line_lower.contains(&open_tag) && line_lower.contains(&close_tag) {
                    // Extract text between tags
                    if let Some(start) = line_lower.find('>') {
                        if let Some(end) = line_lower.rfind("</h") {
                            let text = &line[start + 1..end];
                            entries.push(TocEntry {
                                id: format!("heading-{}", entries.len()),
                                text: self.strip_html(text),
                                level: level as u8,
                                position,
                            });
                        }
                    }
                }
            }
            position += 1;
        }

        entries
    }

    pub fn apply_bionic_reading(&self, text: &str) -> String {
        // Bionic reading bolds the first part of each word
        text.split_whitespace()
            .map(|word| {
                let len = word.len();
                let bold_len = match len {
                    1..=3 => 1,
                    4..=6 => 2,
                    7..=9 => 3,
                    _ => len / 3,
                };
                format!("<b>{}</b>{}", &word[..bold_len], &word[bold_len..])
            })
            .collect::<Vec<_>>()
            .join(" ")
    }

    // ==================== Saved Articles ====================

    pub fn save_article(&self, content: ReadingModeContent) -> SavedArticle {
        let url = content.url.clone();
        
        let article = SavedArticle {
            id: content.id.clone(),
            content,
            highlights: self.highlights.read().unwrap()
                .get(&url)
                .cloned()
                .unwrap_or_default(),
            annotations: self.annotations.read().unwrap()
                .get(&url)
                .cloned()
                .unwrap_or_default(),
            progress: self.reading_progress.read().unwrap()
                .get(&url)
                .cloned()
                .unwrap_or_else(|| ReadingProgress {
                    url: url.clone(),
                    scroll_position: 0.0,
                    percentage: 0.0,
                    time_spent_seconds: 0,
                    last_read: Utc::now(),
                    completed: false,
                }),
            tags: Vec::new(),
            saved_at: Utc::now(),
            is_archived: false,
            is_favorite: false,
        };

        let id = article.id.clone();
        self.saved_articles.write().unwrap().insert(id, article.clone());

        article
    }

    pub fn get_saved_article(&self, article_id: &str) -> Option<SavedArticle> {
        self.saved_articles.read().unwrap().get(article_id).cloned()
    }

    pub fn get_all_saved_articles(&self) -> Vec<SavedArticle> {
        self.saved_articles.read().unwrap().values().cloned().collect()
    }

    pub fn delete_saved_article(&self, article_id: &str) -> Result<(), String> {
        self.saved_articles.write().unwrap()
            .remove(article_id)
            .ok_or_else(|| "Article not found".to_string())?;
        Ok(())
    }

    pub fn toggle_favorite(&self, article_id: &str) -> Result<bool, String> {
        let mut articles = self.saved_articles.write().unwrap();
        let article = articles.get_mut(article_id)
            .ok_or_else(|| "Article not found".to_string())?;
        
        article.is_favorite = !article.is_favorite;
        Ok(article.is_favorite)
    }

    pub fn toggle_archived(&self, article_id: &str) -> Result<bool, String> {
        let mut articles = self.saved_articles.write().unwrap();
        let article = articles.get_mut(article_id)
            .ok_or_else(|| "Article not found".to_string())?;
        
        article.is_archived = !article.is_archived;
        Ok(article.is_archived)
    }

    pub fn add_tag(&self, article_id: &str, tag: &str) -> Result<(), String> {
        let mut articles = self.saved_articles.write().unwrap();
        let article = articles.get_mut(article_id)
            .ok_or_else(|| "Article not found".to_string())?;
        
        if !article.tags.contains(&tag.to_string()) {
            article.tags.push(tag.to_string());
        }
        Ok(())
    }

    pub fn remove_tag(&self, article_id: &str, tag: &str) -> Result<(), String> {
        let mut articles = self.saved_articles.write().unwrap();
        let article = articles.get_mut(article_id)
            .ok_or_else(|| "Article not found".to_string())?;
        
        article.tags.retain(|t| t != tag);
        Ok(())
    }

    // ==================== Reading Progress ====================

    pub fn update_progress(&self, url: &str, scroll_position: f32, percentage: f32) {
        let mut progress_map = self.reading_progress.write().unwrap();
        
        let progress = progress_map.entry(url.to_string()).or_insert(ReadingProgress {
            url: url.to_string(),
            scroll_position: 0.0,
            percentage: 0.0,
            time_spent_seconds: 0,
            last_read: Utc::now(),
            completed: false,
        });

        progress.scroll_position = scroll_position;
        progress.percentage = percentage;
        progress.last_read = Utc::now();
        
        if percentage >= 95.0 {
            progress.completed = true;
        }
    }

    pub fn add_reading_time(&self, url: &str, seconds: u64) {
        let mut progress_map = self.reading_progress.write().unwrap();
        
        if let Some(progress) = progress_map.get_mut(url) {
            progress.time_spent_seconds += seconds;
        }

        // Update stats
        let mut stats = self.stats.write().unwrap();
        stats.total_time_reading_minutes += seconds / 60;
    }

    pub fn get_progress(&self, url: &str) -> Option<ReadingProgress> {
        self.reading_progress.read().unwrap().get(url).cloned()
    }

    pub fn mark_completed(&self, url: &str, word_count: u32) {
        let mut progress_map = self.reading_progress.write().unwrap();
        
        if let Some(progress) = progress_map.get_mut(url) {
            progress.completed = true;
            progress.percentage = 100.0;
        }

        // Update stats
        let mut stats = self.stats.write().unwrap();
        stats.total_articles_read += 1;
        stats.articles_completed += 1;
        stats.total_words_read += word_count as u64;
        stats.last_read_date = Some(Utc::now());
    }

    // ==================== Highlights ====================

    pub fn add_highlight(&self, url: &str, text: &str, start: u32, end: u32, color: HighlightColor, note: Option<String>) -> Highlight {
        let highlight = Highlight {
            id: Uuid::new_v4().to_string(),
            url: url.to_string(),
            text: text.to_string(),
            start_offset: start,
            end_offset: end,
            color,
            note,
            created_at: Utc::now(),
        };

        self.highlights.write().unwrap()
            .entry(url.to_string())
            .or_insert_with(Vec::new)
            .push(highlight.clone());

        // Update stats
        self.stats.write().unwrap().highlights_created += 1;

        highlight
    }

    pub fn get_highlights(&self, url: &str) -> Vec<Highlight> {
        self.highlights.read().unwrap()
            .get(url)
            .cloned()
            .unwrap_or_default()
    }

    pub fn delete_highlight(&self, url: &str, highlight_id: &str) -> Result<(), String> {
        let mut highlights = self.highlights.write().unwrap();
        
        if let Some(list) = highlights.get_mut(url) {
            let initial_len = list.len();
            list.retain(|h| h.id != highlight_id);
            
            if list.len() == initial_len {
                return Err("Highlight not found".to_string());
            }
        } else {
            return Err("No highlights for URL".to_string());
        }

        Ok(())
    }

    pub fn update_highlight_note(&self, url: &str, highlight_id: &str, note: Option<String>) -> Result<Highlight, String> {
        let mut highlights = self.highlights.write().unwrap();
        
        let list = highlights.get_mut(url)
            .ok_or_else(|| "No highlights for URL".to_string())?;
        
        let highlight = list.iter_mut()
            .find(|h| h.id == highlight_id)
            .ok_or_else(|| "Highlight not found".to_string())?;

        highlight.note = note;
        Ok(highlight.clone())
    }

    // ==================== Annotations ====================

    pub fn add_annotation(&self, url: &str, text: &str, note: &str, position: u32) -> Annotation {
        let now = Utc::now();
        let annotation = Annotation {
            id: Uuid::new_v4().to_string(),
            url: url.to_string(),
            text: text.to_string(),
            note: note.to_string(),
            position,
            created_at: now,
            updated_at: now,
        };

        self.annotations.write().unwrap()
            .entry(url.to_string())
            .or_insert_with(Vec::new)
            .push(annotation.clone());

        // Update stats
        self.stats.write().unwrap().annotations_created += 1;

        annotation
    }

    pub fn get_annotations(&self, url: &str) -> Vec<Annotation> {
        self.annotations.read().unwrap()
            .get(url)
            .cloned()
            .unwrap_or_default()
    }

    pub fn update_annotation(&self, url: &str, annotation_id: &str, note: &str) -> Result<Annotation, String> {
        let mut annotations = self.annotations.write().unwrap();
        
        let list = annotations.get_mut(url)
            .ok_or_else(|| "No annotations for URL".to_string())?;
        
        let annotation = list.iter_mut()
            .find(|a| a.id == annotation_id)
            .ok_or_else(|| "Annotation not found".to_string())?;

        annotation.note = note.to_string();
        annotation.updated_at = Utc::now();
        
        Ok(annotation.clone())
    }

    pub fn delete_annotation(&self, url: &str, annotation_id: &str) -> Result<(), String> {
        let mut annotations = self.annotations.write().unwrap();
        
        if let Some(list) = annotations.get_mut(url) {
            let initial_len = list.len();
            list.retain(|a| a.id != annotation_id);
            
            if list.len() == initial_len {
                return Err("Annotation not found".to_string());
            }
        } else {
            return Err("No annotations for URL".to_string());
        }

        Ok(())
    }

    // ==================== Custom Themes ====================

    pub fn get_custom_theme(&self, theme_id: &str) -> Option<CustomTheme> {
        self.custom_themes.read().unwrap().get(theme_id).cloned()
    }

    pub fn get_all_custom_themes(&self) -> Vec<CustomTheme> {
        self.custom_themes.read().unwrap().values().cloned().collect()
    }

    pub fn create_custom_theme(&self, theme: CustomTheme) -> String {
        let id = theme.name.to_lowercase().replace(' ', "-");
        self.custom_themes.write().unwrap().insert(id.clone(), theme);
        id
    }

    pub fn delete_custom_theme(&self, theme_id: &str) -> Result<(), String> {
        self.custom_themes.write().unwrap()
            .remove(theme_id)
            .ok_or_else(|| "Theme not found".to_string())?;
        Ok(())
    }

    // ==================== Stats ====================

    pub fn get_stats(&self) -> ReadingStats {
        self.stats.read().unwrap().clone()
    }

    pub fn search_saved_articles(&self, query: &str) -> Vec<SavedArticle> {
        let query_lower = query.to_lowercase();
        
        self.saved_articles.read().unwrap()
            .values()
            .filter(|article| {
                article.content.title.to_lowercase().contains(&query_lower) ||
                article.content.content_text.to_lowercase().contains(&query_lower) ||
                article.tags.iter().any(|t| t.to_lowercase().contains(&query_lower))
            })
            .cloned()
            .collect()
    }
}

impl Default for BrowserReadingModeService {
    fn default() -> Self {
        Self::new()
    }
}
