// CUBE Nexum - Reader Mode
// Clean reading view with TTS, annotations, and customization
// Superior to Safari/Firefox reader modes with AI-powered features

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::RwLock;
use chrono::Utc;
use uuid::Uuid;

// ==================== Enums ====================

/// Reader theme options
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum ReaderTheme {
    Light,
    Sepia,
    Dark,
    Night,      // Pure black for OLED
    Custom,
}

/// Font family for reader
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum ReaderFont {
    System,
    Serif,
    SansSerif,
    Monospace,
    OpenDyslexic,   // Accessibility font
    Custom(String),
}

impl ReaderFont {
    pub fn css_value(&self) -> String {
        match self {
            ReaderFont::System => "system-ui, -apple-system, BlinkMacSystemFont, sans-serif".to_string(),
            ReaderFont::Serif => "Georgia, 'Times New Roman', serif".to_string(),
            ReaderFont::SansSerif => "'Helvetica Neue', Arial, sans-serif".to_string(),
            ReaderFont::Monospace => "'SF Mono', Consolas, monospace".to_string(),
            ReaderFont::OpenDyslexic => "'OpenDyslexic', sans-serif".to_string(),
            ReaderFont::Custom(font) => font.clone(),
        }
    }
}

/// Text alignment options
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum TextAlignment {
    Left,
    Center,
    Justify,
}

/// Annotation type
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum AnnotationType {
    Highlight,
    Underline,
    Note,
    Bookmark,
}

/// Highlight color
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum HighlightColor {
    Yellow,
    Green,
    Blue,
    Pink,
    Purple,
    Orange,
}

impl HighlightColor {
    pub fn hex_value(&self) -> &str {
        match self {
            HighlightColor::Yellow => "#fef08a",
            HighlightColor::Green => "#bbf7d0",
            HighlightColor::Blue => "#bfdbfe",
            HighlightColor::Pink => "#fbcfe8",
            HighlightColor::Purple => "#ddd6fe",
            HighlightColor::Orange => "#fed7aa",
        }
    }
}

/// TTS voice speed
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum TTSSpeed {
    VerySlow,   // 0.5x
    Slow,       // 0.75x
    Normal,     // 1.0x
    Fast,       // 1.25x
    VeryFast,   // 1.5x
}

impl TTSSpeed {
    pub fn rate(&self) -> f32 {
        match self {
            TTSSpeed::VerySlow => 0.5,
            TTSSpeed::Slow => 0.75,
            TTSSpeed::Normal => 1.0,
            TTSSpeed::Fast => 1.25,
            TTSSpeed::VeryFast => 1.5,
        }
    }
}

/// Reading progress tracking
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum ReadingStatus {
    NotStarted,
    InProgress,
    Completed,
}

// ==================== Structures ====================

/// Reader mode settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReaderSettings {
    pub theme: ReaderTheme,
    pub font: ReaderFont,
    pub font_size: u32,           // 12-32
    pub line_height: f32,         // 1.0-2.5
    pub content_width: u32,       // 400-1200 px
    pub text_alignment: TextAlignment,
    pub show_images: bool,
    pub show_links: bool,
    pub auto_dark_mode: bool,
    pub keyboard_shortcuts: bool,
    pub scroll_progress: bool,
    pub estimated_reading_time: bool,
    pub custom_css: Option<String>,
}

impl Default for ReaderSettings {
    fn default() -> Self {
        Self {
            theme: ReaderTheme::Light,
            font: ReaderFont::Serif,
            font_size: 18,
            line_height: 1.6,
            content_width: 680,
            text_alignment: TextAlignment::Left,
            show_images: true,
            show_links: true,
            auto_dark_mode: true,
            keyboard_shortcuts: true,
            scroll_progress: true,
            estimated_reading_time: true,
            custom_css: None,
        }
    }
}

/// Custom theme colors
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomTheme {
    pub id: String,
    pub name: String,
    pub background_color: String,
    pub text_color: String,
    pub link_color: String,
    pub selection_color: String,
    pub accent_color: String,
}

/// Text-to-Speech settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TTSSettings {
    pub enabled: bool,
    pub voice: String,
    pub speed: TTSSpeed,
    pub pitch: f32,             // 0.5-2.0
    pub volume: f32,            // 0.0-1.0
    pub highlight_spoken: bool,
    pub auto_scroll: bool,
    pub pause_on_focus_loss: bool,
}

impl Default for TTSSettings {
    fn default() -> Self {
        Self {
            enabled: true,
            voice: "default".to_string(),
            speed: TTSSpeed::Normal,
            pitch: 1.0,
            volume: 1.0,
            highlight_spoken: true,
            auto_scroll: true,
            pause_on_focus_loss: true,
        }
    }
}

/// Annotation on content
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Annotation {
    pub id: String,
    pub article_id: String,
    pub annotation_type: AnnotationType,
    pub color: HighlightColor,
    pub selected_text: String,
    pub note: Option<String>,
    pub start_offset: u32,
    pub end_offset: u32,
    pub paragraph_index: u32,
    pub created_at: i64,
    pub updated_at: i64,
}

/// Parsed article content
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedArticle {
    pub id: String,
    pub url: String,
    pub title: String,
    pub author: Option<String>,
    pub published_date: Option<String>,
    pub site_name: Option<String>,
    pub content: String,
    pub text_content: String,
    pub excerpt: Option<String>,
    pub lead_image_url: Option<String>,
    pub word_count: u32,
    pub reading_time_minutes: u32,
    pub language: Option<String>,
    pub parsed_at: i64,
}

/// Reading session for tracking progress
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReadingSession {
    pub id: String,
    pub article_id: String,
    pub url: String,
    pub title: String,
    pub status: ReadingStatus,
    pub scroll_position: f32,    // 0.0-1.0
    pub time_spent_seconds: u64,
    pub annotations_count: u32,
    pub started_at: i64,
    pub last_read_at: i64,
    pub completed_at: Option<i64>,
}

/// TTS playback state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TTSPlaybackState {
    pub is_playing: bool,
    pub is_paused: bool,
    pub current_paragraph: u32,
    pub current_word: u32,
    pub total_paragraphs: u32,
    pub elapsed_seconds: u64,
    pub remaining_seconds: u64,
}

/// Reader mode statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReaderStats {
    pub articles_read: u64,
    pub total_reading_time_minutes: u64,
    pub words_read: u64,
    pub annotations_created: u64,
    pub tts_time_minutes: u64,
    pub favorite_theme: String,
    pub average_session_minutes: u64,
    pub streak_days: u32,
    pub last_read_date: Option<i64>,
}

impl Default for ReaderStats {
    fn default() -> Self {
        Self {
            articles_read: 0,
            total_reading_time_minutes: 0,
            words_read: 0,
            annotations_created: 0,
            tts_time_minutes: 0,
            favorite_theme: "Light".to_string(),
            average_session_minutes: 0,
            streak_days: 0,
            last_read_date: None,
        }
    }
}

// ==================== Service ====================

pub struct BrowserReaderService {
    settings: RwLock<ReaderSettings>,
    tts_settings: RwLock<TTSSettings>,
    custom_themes: RwLock<HashMap<String, CustomTheme>>,
    articles: RwLock<HashMap<String, ParsedArticle>>,
    annotations: RwLock<HashMap<String, Vec<Annotation>>>,
    sessions: RwLock<HashMap<String, ReadingSession>>,
    tts_state: RwLock<Option<TTSPlaybackState>>,
    stats: RwLock<ReaderStats>,
}

impl BrowserReaderService {
    pub fn new() -> Self {
        let mut custom_themes = HashMap::new();
        
        // Add preset themes
        custom_themes.insert("light".to_string(), CustomTheme {
            id: "light".to_string(),
            name: "Light".to_string(),
            background_color: "#ffffff".to_string(),
            text_color: "#1f2937".to_string(),
            link_color: "#2563eb".to_string(),
            selection_color: "#bfdbfe".to_string(),
            accent_color: "#8b5cf6".to_string(),
        });
        
        custom_themes.insert("sepia".to_string(), CustomTheme {
            id: "sepia".to_string(),
            name: "Sepia".to_string(),
            background_color: "#f5f0e6".to_string(),
            text_color: "#5c4b37".to_string(),
            link_color: "#8b6914".to_string(),
            selection_color: "#e8dcc8".to_string(),
            accent_color: "#a67c52".to_string(),
        });
        
        custom_themes.insert("dark".to_string(), CustomTheme {
            id: "dark".to_string(),
            name: "Dark".to_string(),
            background_color: "#1a1a2e".to_string(),
            text_color: "#e2e8f0".to_string(),
            link_color: "#60a5fa".to_string(),
            selection_color: "#3b4261".to_string(),
            accent_color: "#a78bfa".to_string(),
        });
        
        custom_themes.insert("night".to_string(), CustomTheme {
            id: "night".to_string(),
            name: "Night (OLED)".to_string(),
            background_color: "#000000".to_string(),
            text_color: "#d1d5db".to_string(),
            link_color: "#93c5fd".to_string(),
            selection_color: "#1f2937".to_string(),
            accent_color: "#c4b5fd".to_string(),
        });
        
        Self {
            settings: RwLock::new(ReaderSettings::default()),
            tts_settings: RwLock::new(TTSSettings::default()),
            custom_themes: RwLock::new(custom_themes),
            articles: RwLock::new(HashMap::new()),
            annotations: RwLock::new(HashMap::new()),
            sessions: RwLock::new(HashMap::new()),
            tts_state: RwLock::new(None),
            stats: RwLock::new(ReaderStats::default()),
        }
    }
    
    // ==================== Settings ====================
    
    pub fn get_settings(&self) -> ReaderSettings {
        self.settings.read().unwrap().clone()
    }
    
    pub fn update_settings(&self, new_settings: ReaderSettings) {
        let mut settings = self.settings.write().unwrap();
        *settings = new_settings;
    }
    
    pub fn set_theme(&self, theme: ReaderTheme) {
        let mut settings = self.settings.write().unwrap();
        settings.theme = theme;
    }
    
    pub fn set_font(&self, font: ReaderFont) {
        let mut settings = self.settings.write().unwrap();
        settings.font = font;
    }
    
    pub fn set_font_size(&self, size: u32) {
        let mut settings = self.settings.write().unwrap();
        settings.font_size = size.clamp(12, 32);
    }
    
    pub fn increase_font_size(&self) {
        let mut settings = self.settings.write().unwrap();
        settings.font_size = (settings.font_size + 2).min(32);
    }
    
    pub fn decrease_font_size(&self) {
        let mut settings = self.settings.write().unwrap();
        settings.font_size = settings.font_size.saturating_sub(2).max(12);
    }
    
    pub fn set_line_height(&self, height: f32) {
        let mut settings = self.settings.write().unwrap();
        settings.line_height = height.clamp(1.0, 2.5);
    }
    
    pub fn set_content_width(&self, width: u32) {
        let mut settings = self.settings.write().unwrap();
        settings.content_width = width.clamp(400, 1200);
    }
    
    pub fn set_text_alignment(&self, alignment: TextAlignment) {
        let mut settings = self.settings.write().unwrap();
        settings.text_alignment = alignment;
    }
    
    pub fn toggle_images(&self) {
        let mut settings = self.settings.write().unwrap();
        settings.show_images = !settings.show_images;
    }
    
    pub fn toggle_links(&self) {
        let mut settings = self.settings.write().unwrap();
        settings.show_links = !settings.show_links;
    }
    
    // ==================== TTS Settings ====================
    
    pub fn get_tts_settings(&self) -> TTSSettings {
        self.tts_settings.read().unwrap().clone()
    }
    
    pub fn update_tts_settings(&self, new_settings: TTSSettings) {
        let mut settings = self.tts_settings.write().unwrap();
        *settings = new_settings;
    }
    
    pub fn set_tts_speed(&self, speed: TTSSpeed) {
        let mut settings = self.tts_settings.write().unwrap();
        settings.speed = speed;
    }
    
    pub fn set_tts_voice(&self, voice: String) {
        let mut settings = self.tts_settings.write().unwrap();
        settings.voice = voice;
    }
    
    pub fn set_tts_volume(&self, volume: f32) {
        let mut settings = self.tts_settings.write().unwrap();
        settings.volume = volume.clamp(0.0, 1.0);
    }
    
    // ==================== Custom Themes ====================
    
    pub fn get_custom_themes(&self) -> Vec<CustomTheme> {
        self.custom_themes.read().unwrap().values().cloned().collect()
    }
    
    pub fn get_theme(&self, id: &str) -> Option<CustomTheme> {
        self.custom_themes.read().unwrap().get(id).cloned()
    }
    
    pub fn add_custom_theme(&self, theme: CustomTheme) -> String {
        let id = theme.id.clone();
        let mut themes = self.custom_themes.write().unwrap();
        themes.insert(id.clone(), theme);
        id
    }
    
    pub fn remove_custom_theme(&self, id: &str) -> bool {
        // Don't allow removing preset themes
        if ["light", "sepia", "dark", "night"].contains(&id) {
            return false;
        }
        let mut themes = self.custom_themes.write().unwrap();
        themes.remove(id).is_some()
    }
    
    // ==================== Article Parsing ====================
    
    pub fn parse_article(&self, url: &str, html: &str) -> Result<ParsedArticle, String> {
        // Extract content using readability-like algorithm
        let title = self.extract_title(html);
        let content = self.extract_content(html);
        let text_content = self.strip_html(&content);
        let word_count = text_content.split_whitespace().count() as u32;
        let reading_time = (word_count / 200).max(1);
        
        let article = ParsedArticle {
            id: Uuid::new_v4().to_string(),
            url: url.to_string(),
            title,
            author: self.extract_author(html),
            published_date: self.extract_date(html),
            site_name: self.extract_site_name(html),
            content,
            text_content,
            excerpt: self.extract_excerpt(html),
            lead_image_url: self.extract_lead_image(html),
            word_count,
            reading_time_minutes: reading_time,
            language: self.detect_language(html),
            parsed_at: Utc::now().timestamp(),
        };
        
        // Store the article
        let mut articles = self.articles.write().unwrap();
        articles.insert(article.id.clone(), article.clone());
        
        // Create reading session
        self.create_session(&article);
        
        Ok(article)
    }
    
    fn extract_title(&self, html: &str) -> String {
        // Simple title extraction - in production would use proper HTML parsing
        if let Some(start) = html.find("<title>") {
            if let Some(end) = html[start..].find("</title>") {
                return html[start + 7..start + end].trim().to_string();
            }
        }
        "Untitled Article".to_string()
    }
    
    fn extract_content(&self, html: &str) -> String {
        // Simplified content extraction
        // In production, would use readability algorithm
        let content = html
            .replace("<script", "<!-- script")
            .replace("</script>", "script -->")
            .replace("<style", "<!-- style")
            .replace("</style>", "style -->");
        
        // Extract body or article content
        if let Some(start) = content.find("<article") {
            if let Some(end) = content[start..].find("</article>") {
                return content[start..start + end + 10].to_string();
            }
        }
        
        if let Some(start) = content.find("<body") {
            if let Some(end) = content[start..].find("</body>") {
                return content[start..start + end + 7].to_string();
            }
        }
        
        content
    }
    
    fn strip_html(&self, html: &str) -> String {
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
        
        // Clean up whitespace
        result.split_whitespace().collect::<Vec<_>>().join(" ")
    }
    
    fn extract_author(&self, html: &str) -> Option<String> {
        // Look for meta author tag
        if let Some(start) = html.find("name=\"author\"") {
            if let Some(content_start) = html[start..].find("content=\"") {
                let offset = start + content_start + 9;
                if let Some(end) = html[offset..].find('"') {
                    return Some(html[offset..offset + end].to_string());
                }
            }
        }
        None
    }
    
    fn extract_date(&self, html: &str) -> Option<String> {
        // Look for published date meta tag
        if let Some(start) = html.find("property=\"article:published_time\"") {
            if let Some(content_start) = html[start..].find("content=\"") {
                let offset = start + content_start + 9;
                if let Some(end) = html[offset..].find('"') {
                    return Some(html[offset..offset + end].to_string());
                }
            }
        }
        None
    }
    
    fn extract_site_name(&self, html: &str) -> Option<String> {
        if let Some(start) = html.find("property=\"og:site_name\"") {
            if let Some(content_start) = html[start..].find("content=\"") {
                let offset = start + content_start + 9;
                if let Some(end) = html[offset..].find('"') {
                    return Some(html[offset..offset + end].to_string());
                }
            }
        }
        None
    }
    
    fn extract_excerpt(&self, html: &str) -> Option<String> {
        if let Some(start) = html.find("name=\"description\"") {
            if let Some(content_start) = html[start..].find("content=\"") {
                let offset = start + content_start + 9;
                if let Some(end) = html[offset..].find('"') {
                    return Some(html[offset..offset + end].to_string());
                }
            }
        }
        None
    }
    
    fn extract_lead_image(&self, html: &str) -> Option<String> {
        if let Some(start) = html.find("property=\"og:image\"") {
            if let Some(content_start) = html[start..].find("content=\"") {
                let offset = start + content_start + 9;
                if let Some(end) = html[offset..].find('"') {
                    return Some(html[offset..offset + end].to_string());
                }
            }
        }
        None
    }
    
    fn detect_language(&self, html: &str) -> Option<String> {
        if let Some(start) = html.find("lang=\"") {
            let offset = start + 6;
            if let Some(end) = html[offset..].find('"') {
                return Some(html[offset..offset + end].to_string());
            }
        }
        None
    }
    
    pub fn get_article(&self, id: &str) -> Option<ParsedArticle> {
        self.articles.read().unwrap().get(id).cloned()
    }
    
    pub fn get_recent_articles(&self, limit: usize) -> Vec<ParsedArticle> {
        let articles = self.articles.read().unwrap();
        let mut list: Vec<_> = articles.values().cloned().collect();
        list.sort_by(|a, b| b.parsed_at.cmp(&a.parsed_at));
        list.truncate(limit);
        list
    }
    
    // ==================== Reading Sessions ====================
    
    fn create_session(&self, article: &ParsedArticle) {
        let session = ReadingSession {
            id: Uuid::new_v4().to_string(),
            article_id: article.id.clone(),
            url: article.url.clone(),
            title: article.title.clone(),
            status: ReadingStatus::NotStarted,
            scroll_position: 0.0,
            time_spent_seconds: 0,
            annotations_count: 0,
            started_at: Utc::now().timestamp(),
            last_read_at: Utc::now().timestamp(),
            completed_at: None,
        };
        
        let mut sessions = self.sessions.write().unwrap();
        sessions.insert(article.id.clone(), session);
    }
    
    pub fn get_session(&self, article_id: &str) -> Option<ReadingSession> {
        self.sessions.read().unwrap().get(article_id).cloned()
    }
    
    pub fn update_progress(&self, article_id: &str, scroll_position: f32, time_spent: u64) {
        let mut sessions = self.sessions.write().unwrap();
        if let Some(session) = sessions.get_mut(article_id) {
            session.scroll_position = scroll_position.clamp(0.0, 1.0);
            session.time_spent_seconds = time_spent;
            session.last_read_at = Utc::now().timestamp();
            
            if session.status == ReadingStatus::NotStarted {
                session.status = ReadingStatus::InProgress;
            }
            
            if scroll_position >= 0.95 {
                session.status = ReadingStatus::Completed;
                session.completed_at = Some(Utc::now().timestamp());
                
                // Update stats
                self.record_completion(session);
            }
        }
    }
    
    fn record_completion(&self, session: &ReadingSession) {
        let mut stats = self.stats.write().unwrap();
        stats.articles_read += 1;
        stats.total_reading_time_minutes += session.time_spent_seconds / 60;
        stats.last_read_date = Some(Utc::now().timestamp());
    }
    
    pub fn get_reading_history(&self, limit: usize) -> Vec<ReadingSession> {
        let sessions = self.sessions.read().unwrap();
        let mut list: Vec<_> = sessions.values().cloned().collect();
        list.sort_by(|a, b| b.last_read_at.cmp(&a.last_read_at));
        list.truncate(limit);
        list
    }
    
    pub fn get_in_progress(&self) -> Vec<ReadingSession> {
        let sessions = self.sessions.read().unwrap();
        sessions.values()
            .filter(|s| s.status == ReadingStatus::InProgress)
            .cloned()
            .collect()
    }
    
    // ==================== Annotations ====================
    
    pub fn create_annotation(
        &self,
        article_id: &str,
        annotation_type: AnnotationType,
        color: HighlightColor,
        selected_text: &str,
        note: Option<String>,
        start_offset: u32,
        end_offset: u32,
        paragraph_index: u32,
    ) -> Annotation {
        let annotation = Annotation {
            id: Uuid::new_v4().to_string(),
            article_id: article_id.to_string(),
            annotation_type,
            color,
            selected_text: selected_text.to_string(),
            note,
            start_offset,
            end_offset,
            paragraph_index,
            created_at: Utc::now().timestamp(),
            updated_at: Utc::now().timestamp(),
        };
        
        let mut annotations = self.annotations.write().unwrap();
        annotations
            .entry(article_id.to_string())
            .or_insert_with(Vec::new)
            .push(annotation.clone());
        
        // Update session annotation count
        let mut sessions = self.sessions.write().unwrap();
        if let Some(session) = sessions.get_mut(article_id) {
            session.annotations_count += 1;
        }
        
        // Update stats
        let mut stats = self.stats.write().unwrap();
        stats.annotations_created += 1;
        
        annotation
    }
    
    pub fn update_annotation(&self, article_id: &str, annotation_id: &str, note: Option<String>, color: Option<HighlightColor>) {
        let mut annotations = self.annotations.write().unwrap();
        if let Some(article_annotations) = annotations.get_mut(article_id) {
            if let Some(annotation) = article_annotations.iter_mut().find(|a| a.id == annotation_id) {
                if let Some(n) = note {
                    annotation.note = Some(n);
                }
                if let Some(c) = color {
                    annotation.color = c;
                }
                annotation.updated_at = Utc::now().timestamp();
            }
        }
    }
    
    pub fn delete_annotation(&self, article_id: &str, annotation_id: &str) -> bool {
        let mut annotations = self.annotations.write().unwrap();
        if let Some(article_annotations) = annotations.get_mut(article_id) {
            let len_before = article_annotations.len();
            article_annotations.retain(|a| a.id != annotation_id);
            
            if article_annotations.len() < len_before {
                // Update session annotation count
                let mut sessions = self.sessions.write().unwrap();
                if let Some(session) = sessions.get_mut(article_id) {
                    session.annotations_count = session.annotations_count.saturating_sub(1);
                }
                return true;
            }
        }
        false
    }
    
    pub fn get_annotations(&self, article_id: &str) -> Vec<Annotation> {
        self.annotations.read().unwrap()
            .get(article_id)
            .cloned()
            .unwrap_or_default()
    }
    
    pub fn get_all_annotations(&self) -> Vec<Annotation> {
        self.annotations.read().unwrap()
            .values()
            .flatten()
            .cloned()
            .collect()
    }
    
    pub fn export_annotations(&self, article_id: &str) -> String {
        let annotations = self.get_annotations(article_id);
        let article = self.get_article(article_id);
        
        let mut export = String::new();
        if let Some(a) = article {
            export.push_str(&format!("# Annotations for: {}\n", a.title));
            export.push_str(&format!("URL: {}\n\n", a.url));
        }
        
        for annotation in annotations {
            export.push_str(&format!("## {:?} ({:?})\n", annotation.annotation_type, annotation.color));
            export.push_str(&format!("> {}\n", annotation.selected_text));
            if let Some(note) = &annotation.note {
                export.push_str(&format!("\nNote: {}\n", note));
            }
            export.push('\n');
        }
        
        export
    }
    
    // ==================== TTS Control ====================
    
    pub fn start_tts(&self, article_id: &str) -> Result<TTSPlaybackState, String> {
        let article = self.get_article(article_id)
            .ok_or("Article not found")?;
        
        let paragraphs = article.text_content.split("\n\n").count() as u32;
        let words_per_minute = 150;
        let total_seconds = (article.word_count as f32 / words_per_minute as f32 * 60.0) as u64;
        
        let state = TTSPlaybackState {
            is_playing: true,
            is_paused: false,
            current_paragraph: 0,
            current_word: 0,
            total_paragraphs: paragraphs,
            elapsed_seconds: 0,
            remaining_seconds: total_seconds,
        };
        
        let mut tts_state = self.tts_state.write().unwrap();
        *tts_state = Some(state.clone());
        
        Ok(state)
    }
    
    pub fn pause_tts(&self) {
        let mut tts_state = self.tts_state.write().unwrap();
        if let Some(state) = tts_state.as_mut() {
            state.is_playing = false;
            state.is_paused = true;
        }
    }
    
    pub fn resume_tts(&self) {
        let mut tts_state = self.tts_state.write().unwrap();
        if let Some(state) = tts_state.as_mut() {
            state.is_playing = true;
            state.is_paused = false;
        }
    }
    
    pub fn stop_tts(&self) {
        let mut tts_state = self.tts_state.write().unwrap();
        *tts_state = None;
    }
    
    pub fn get_tts_state(&self) -> Option<TTSPlaybackState> {
        self.tts_state.read().unwrap().clone()
    }
    
    pub fn skip_to_paragraph(&self, paragraph: u32) {
        let mut tts_state = self.tts_state.write().unwrap();
        if let Some(state) = tts_state.as_mut() {
            state.current_paragraph = paragraph.min(state.total_paragraphs);
            state.current_word = 0;
        }
    }
    
    // ==================== Statistics ====================
    
    pub fn get_stats(&self) -> ReaderStats {
        self.stats.read().unwrap().clone()
    }
    
    pub fn reset_stats(&self) {
        let mut stats = self.stats.write().unwrap();
        *stats = ReaderStats::default();
    }
    
    // ==================== Utilities ====================
    
    pub fn generate_css(&self) -> String {
        let settings = self.settings.read().unwrap();
        let theme = self.get_theme(&format!("{:?}", settings.theme).to_lowercase())
            .unwrap_or_else(|| self.get_theme("light").unwrap());
        
        format!(
            r#"
            .reader-content {{
                background-color: {};
                color: {};
                font-family: {};
                font-size: {}px;
                line-height: {};
                max-width: {}px;
                text-align: {};
                margin: 0 auto;
                padding: 40px 20px;
            }}
            .reader-content a {{
                color: {};
            }}
            .reader-content ::selection {{
                background-color: {};
            }}
            .reader-content img {{
                display: {};
            }}
            "#,
            theme.background_color,
            theme.text_color,
            settings.font.css_value(),
            settings.font_size,
            settings.line_height,
            settings.content_width,
            match settings.text_alignment {
                TextAlignment::Left => "left",
                TextAlignment::Center => "center",
                TextAlignment::Justify => "justify",
            },
            theme.link_color,
            theme.selection_color,
            if settings.show_images { "block" } else { "none" },
        )
    }
    
    pub fn estimate_reading_time(&self, word_count: u32) -> u32 {
        // Average reading speed: 200-250 words per minute
        (word_count / 200).max(1)
    }
    
    pub fn format_reading_time(&self, minutes: u32) -> String {
        if minutes < 1 {
            "< 1 min read".to_string()
        } else if minutes == 1 {
            "1 min read".to_string()
        } else {
            format!("{} min read", minutes)
        }
    }
}

impl Default for BrowserReaderService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_default_settings() {
        let service = BrowserReaderService::new();
        let settings = service.get_settings();
        assert_eq!(settings.font_size, 18);
        assert_eq!(settings.theme, ReaderTheme::Light);
    }
    
    #[test]
    fn test_font_size_bounds() {
        let service = BrowserReaderService::new();
        service.set_font_size(100);
        assert_eq!(service.get_settings().font_size, 32);
        
        service.set_font_size(5);
        assert_eq!(service.get_settings().font_size, 12);
    }
    
    #[test]
    fn test_highlight_colors() {
        assert_eq!(HighlightColor::Yellow.hex_value(), "#fef08a");
        assert_eq!(HighlightColor::Purple.hex_value(), "#ddd6fe");
    }
}
