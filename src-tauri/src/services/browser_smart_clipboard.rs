// CUBE Nexum - Smart Clipboard Service
// Intelligent clipboard history with categories, search, and sync

use std::collections::HashMap;
use std::sync::RwLock;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// ==================== Types ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipboardEntry {
    pub id: String,
    pub content: ClipboardContent,
    pub source_url: Option<String>,
    pub source_app: Option<String>,
    pub source_title: Option<String>,
    pub category: ClipboardCategory,
    pub tags: Vec<String>,
    pub is_pinned: bool,
    pub is_favorite: bool,
    pub is_sensitive: bool,
    pub created_at: DateTime<Utc>,
    pub last_used: DateTime<Utc>,
    pub use_count: u32,
    pub expires_at: Option<DateTime<Utc>>,
    pub metadata: ClipboardMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ClipboardContent {
    Text(String),
    RichText { plain: String, html: String },
    Image { data: String, format: String, width: u32, height: u32 },
    File { name: String, path: String, mime_type: String, size: u64 },
    Files { paths: Vec<String> },
    Url { url: String, title: Option<String>, favicon: Option<String> },
    Color { hex: String, rgb: (u8, u8, u8), hsl: (f32, f32, f32) },
    Code { code: String, language: Option<String> },
    Email { email: String, name: Option<String> },
    Phone { number: String, formatted: Option<String> },
    Address { raw: String, formatted: Option<String> },
    Custom { content_type: String, data: String },
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ClipboardCategory {
    Text,
    Code,
    Url,
    Image,
    File,
    Email,
    Phone,
    Color,
    Address,
    Password,
    Sensitive,
    Other,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipboardMetadata {
    pub char_count: Option<u32>,
    pub word_count: Option<u32>,
    pub line_count: Option<u32>,
    pub detected_language: Option<String>,
    pub preview: Option<String>,
    pub thumbnail: Option<String>,
    pub dimensions: Option<(u32, u32)>,
    pub file_size: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipboardSettings {
    pub enabled: bool,
    pub max_history_size: u32,
    pub max_item_size_kb: u32,
    pub retain_for_days: u32,
    pub auto_categorize: bool,
    pub detect_sensitive: bool,
    pub blur_sensitive: bool,
    pub exclude_passwords: bool,
    pub exclude_apps: Vec<String>,
    pub exclude_urls: Vec<String>,
    pub sync_enabled: bool,
    pub sync_sensitive: bool,
    pub deduplicate: bool,
    pub dedupe_threshold_seconds: u32,
    pub show_notifications: bool,
    pub sound_enabled: bool,
    pub keyboard_shortcuts: ClipboardShortcuts,
    pub quick_paste_enabled: bool,
    pub quick_paste_trigger: QuickPasteTrigger,
    pub preview_lines: u32,
    pub preview_chars: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipboardShortcuts {
    pub show_history: String,
    pub paste_plain: String,
    pub paste_previous: String,
    pub search: String,
    pub clear_history: String,
    pub toggle_pin: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum QuickPasteTrigger {
    DoubleCtrlV,
    CtrlShiftV,
    Custom(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipboardSearchResult {
    pub entry: ClipboardEntry,
    pub match_score: f32,
    pub matched_in: Vec<String>,
    pub highlight_ranges: Vec<(usize, usize)>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipboardStats {
    pub total_entries: u32,
    pub total_size_kb: u64,
    pub entries_by_category: HashMap<String, u32>,
    pub entries_by_source: HashMap<String, u32>,
    pub most_used: Vec<(String, u32)>,
    pub pinned_count: u32,
    pub favorite_count: u32,
    pub sensitive_count: u32,
    pub expired_count: u32,
    pub avg_entry_size_kb: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasteTemplate {
    pub id: String,
    pub name: String,
    pub content: String,
    pub variables: Vec<TemplateVariable>,
    pub category: String,
    pub shortcut: Option<String>,
    pub use_count: u32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplateVariable {
    pub name: String,
    pub default_value: Option<String>,
    pub description: Option<String>,
    pub var_type: VariableType,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum VariableType {
    Text,
    Number,
    Date,
    Time,
    DateTime,
    Choice(Vec<String>),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmartPaste {
    pub original: String,
    pub transformed: String,
    pub transform_type: TransformType,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TransformType {
    None,
    PlainText,
    Uppercase,
    Lowercase,
    TitleCase,
    CamelCase,
    SnakeCase,
    KebabCase,
    Trimmed,
    SingleLine,
    NoWhitespace,
    UrlEncoded,
    UrlDecoded,
    HtmlEncoded,
    HtmlDecoded,
    Base64Encode,
    Base64Decode,
    Slugify,
    Reverse,
}

// ==================== Service Implementation ====================

pub struct BrowserSmartClipboardService {
    entries: RwLock<Vec<ClipboardEntry>>,
    templates: RwLock<HashMap<String, PasteTemplate>>,
    settings: RwLock<ClipboardSettings>,
    last_copy_hash: RwLock<Option<u64>>,
}

impl BrowserSmartClipboardService {
    pub fn new() -> Self {
        Self {
            entries: RwLock::new(Vec::new()),
            templates: RwLock::new(HashMap::new()),
            settings: RwLock::new(Self::default_settings()),
            last_copy_hash: RwLock::new(None),
        }
    }

    fn default_settings() -> ClipboardSettings {
        ClipboardSettings {
            enabled: true,
            max_history_size: 1000,
            max_item_size_kb: 5120, // 5MB
            retain_for_days: 30,
            auto_categorize: true,
            detect_sensitive: true,
            blur_sensitive: true,
            exclude_passwords: true,
            exclude_apps: vec!["1Password".to_string(), "Bitwarden".to_string(), "LastPass".to_string()],
            exclude_urls: vec!["*://*/login*".to_string(), "*://*/password*".to_string()],
            sync_enabled: false,
            sync_sensitive: false,
            deduplicate: true,
            dedupe_threshold_seconds: 5,
            show_notifications: false,
            sound_enabled: false,
            keyboard_shortcuts: ClipboardShortcuts {
                show_history: "Ctrl+Shift+V".to_string(),
                paste_plain: "Ctrl+Shift+P".to_string(),
                paste_previous: "Ctrl+Shift+Z".to_string(),
                search: "Ctrl+Shift+F".to_string(),
                clear_history: "Ctrl+Shift+Delete".to_string(),
                toggle_pin: "Ctrl+Shift+I".to_string(),
            },
            quick_paste_enabled: true,
            quick_paste_trigger: QuickPasteTrigger::DoubleCtrlV,
            preview_lines: 3,
            preview_chars: 200,
        }
    }

    // ==================== Settings ====================

    pub fn get_settings(&self) -> ClipboardSettings {
        self.settings.read().unwrap().clone()
    }

    pub fn update_settings(&self, new_settings: ClipboardSettings) {
        let mut settings = self.settings.write().unwrap();
        *settings = new_settings;
    }

    // ==================== Entry Management ====================

    pub fn add_entry(&self, content: ClipboardContent, source_url: Option<String>, source_app: Option<String>) -> Result<ClipboardEntry, String> {
        let settings = self.settings.read().unwrap();
        
        if !settings.enabled {
            return Err("Clipboard history is disabled".to_string());
        }

        // Check if should be excluded
        if let Some(app) = &source_app {
            if settings.exclude_apps.iter().any(|e| app.contains(e)) {
                return Err("App is excluded from clipboard history".to_string());
            }
        }

        // Check size limit
        let size = self.estimate_content_size(&content);
        if size > (settings.max_item_size_kb as u64 * 1024) {
            return Err("Content exceeds size limit".to_string());
        }

        // Deduplicate
        if settings.deduplicate {
            let hash = self.hash_content(&content);
            let last_hash = self.last_copy_hash.read().unwrap();
            if last_hash.as_ref() == Some(&hash) {
                return Err("Duplicate content".to_string());
            }
            drop(last_hash);
            *self.last_copy_hash.write().unwrap() = Some(hash);
        }

        let now = Utc::now();
        let category = if settings.auto_categorize {
            self.categorize_content(&content)
        } else {
            ClipboardCategory::Other
        };

        let is_sensitive = settings.detect_sensitive && self.detect_sensitive(&content);
        let metadata = self.extract_metadata(&content);
        let preview = self.generate_preview(&content, settings.preview_chars as usize);

        let entry = ClipboardEntry {
            id: Uuid::new_v4().to_string(),
            content,
            source_url,
            source_app,
            source_title: None,
            category,
            tags: Vec::new(),
            is_pinned: false,
            is_favorite: false,
            is_sensitive,
            created_at: now,
            last_used: now,
            use_count: 0,
            expires_at: Some(now + chrono::Duration::days(settings.retain_for_days as i64)),
            metadata: ClipboardMetadata {
                preview: Some(preview),
                ..metadata
            },
        };

        drop(settings);

        let mut entries = self.entries.write().unwrap();
        entries.insert(0, entry.clone());

        // Enforce size limit
        let max_size = self.settings.read().unwrap().max_history_size as usize;
        while entries.len() > max_size {
            // Remove oldest non-pinned entry
            if let Some(pos) = entries.iter().rposition(|e| !e.is_pinned) {
                entries.remove(pos);
            } else {
                break;
            }
        }

        Ok(entry)
    }

    fn estimate_content_size(&self, content: &ClipboardContent) -> u64 {
        match content {
            ClipboardContent::Text(s) => s.len() as u64,
            ClipboardContent::RichText { plain, html } => (plain.len() + html.len()) as u64,
            ClipboardContent::Image { data, .. } => data.len() as u64,
            ClipboardContent::File { size, .. } => *size,
            ClipboardContent::Files { paths } => paths.iter().map(|p| p.len() as u64).sum(),
            ClipboardContent::Url { url, title, .. } => url.len() as u64 + title.as_ref().map(|t| t.len()).unwrap_or(0) as u64,
            ClipboardContent::Code { code, .. } => code.len() as u64,
            ClipboardContent::Color { .. } => 50,
            ClipboardContent::Email { email, .. } => email.len() as u64,
            ClipboardContent::Phone { number, .. } => number.len() as u64,
            ClipboardContent::Address { raw, .. } => raw.len() as u64,
            ClipboardContent::Custom { data, .. } => data.len() as u64,
        }
    }

    fn hash_content(&self, content: &ClipboardContent) -> u64 {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        
        let mut hasher = DefaultHasher::new();
        match content {
            ClipboardContent::Text(s) => s.hash(&mut hasher),
            ClipboardContent::RichText { plain, .. } => plain.hash(&mut hasher),
            ClipboardContent::Url { url, .. } => url.hash(&mut hasher),
            ClipboardContent::Code { code, .. } => code.hash(&mut hasher),
            ClipboardContent::Email { email, .. } => email.hash(&mut hasher),
            ClipboardContent::Phone { number, .. } => number.hash(&mut hasher),
            _ => 0u64.hash(&mut hasher),
        }
        hasher.finish()
    }

    fn categorize_content(&self, content: &ClipboardContent) -> ClipboardCategory {
        match content {
            ClipboardContent::Text(s) => {
                // Check for patterns
                if self.looks_like_url(s) { ClipboardCategory::Url }
                else if self.looks_like_email(s) { ClipboardCategory::Email }
                else if self.looks_like_phone(s) { ClipboardCategory::Phone }
                else if self.looks_like_color(s) { ClipboardCategory::Color }
                else if self.looks_like_code(s) { ClipboardCategory::Code }
                else { ClipboardCategory::Text }
            }
            ClipboardContent::RichText { .. } => ClipboardCategory::Text,
            ClipboardContent::Image { .. } => ClipboardCategory::Image,
            ClipboardContent::File { .. } | ClipboardContent::Files { .. } => ClipboardCategory::File,
            ClipboardContent::Url { .. } => ClipboardCategory::Url,
            ClipboardContent::Code { .. } => ClipboardCategory::Code,
            ClipboardContent::Color { .. } => ClipboardCategory::Color,
            ClipboardContent::Email { .. } => ClipboardCategory::Email,
            ClipboardContent::Phone { .. } => ClipboardCategory::Phone,
            ClipboardContent::Address { .. } => ClipboardCategory::Address,
            ClipboardContent::Custom { .. } => ClipboardCategory::Other,
        }
    }

    fn looks_like_url(&self, s: &str) -> bool {
        s.starts_with("http://") || s.starts_with("https://") || s.starts_with("www.")
    }

    fn looks_like_email(&self, s: &str) -> bool {
        let s = s.trim();
        s.contains('@') && s.contains('.') && !s.contains(' ') && s.len() < 100
    }

    fn looks_like_phone(&self, s: &str) -> bool {
        let digits: String = s.chars().filter(|c| c.is_ascii_digit()).collect();
        digits.len() >= 10 && digits.len() <= 15
    }

    fn looks_like_color(&self, s: &str) -> bool {
        let s = s.trim();
        (s.starts_with('#') && (s.len() == 4 || s.len() == 7 || s.len() == 9)) ||
        s.starts_with("rgb(") || s.starts_with("rgba(") ||
        s.starts_with("hsl(") || s.starts_with("hsla(")
    }

    fn looks_like_code(&self, s: &str) -> bool {
        let code_indicators = [
            "function", "const ", "let ", "var ", "class ", "import ",
            "export ", "return ", "if (", "for (", "while (", "=>",
            "def ", "async ", "await ", "pub fn", "fn ", "struct ",
        ];
        code_indicators.iter().any(|&ind| s.contains(ind))
    }

    fn detect_sensitive(&self, content: &ClipboardContent) -> bool {
        let text = match content {
            ClipboardContent::Text(s) => s.as_str(),
            ClipboardContent::RichText { plain, .. } => plain.as_str(),
            ClipboardContent::Code { code, .. } => code.as_str(),
            _ => return false,
        };

        let sensitive_patterns = [
            "password", "secret", "api_key", "apikey", "token",
            "private_key", "credential", "auth", "bearer",
        ];

        sensitive_patterns.iter().any(|&p| text.to_lowercase().contains(p))
    }

    fn extract_metadata(&self, content: &ClipboardContent) -> ClipboardMetadata {
        match content {
            ClipboardContent::Text(s) | ClipboardContent::Code { code: s, .. } => {
                ClipboardMetadata {
                    char_count: Some(s.len() as u32),
                    word_count: Some(s.split_whitespace().count() as u32),
                    line_count: Some(s.lines().count() as u32),
                    detected_language: None,
                    preview: None,
                    thumbnail: None,
                    dimensions: None,
                    file_size: None,
                }
            }
            ClipboardContent::Image { width, height, data, .. } => {
                ClipboardMetadata {
                    char_count: None,
                    word_count: None,
                    line_count: None,
                    detected_language: None,
                    preview: None,
                    thumbnail: Some(data.clone()), // In real impl, would generate thumbnail
                    dimensions: Some((*width, *height)),
                    file_size: Some(data.len() as u64),
                }
            }
            ClipboardContent::File { size, .. } => {
                ClipboardMetadata {
                    char_count: None,
                    word_count: None,
                    line_count: None,
                    detected_language: None,
                    preview: None,
                    thumbnail: None,
                    dimensions: None,
                    file_size: Some(*size),
                }
            }
            _ => ClipboardMetadata {
                char_count: None,
                word_count: None,
                line_count: None,
                detected_language: None,
                preview: None,
                thumbnail: None,
                dimensions: None,
                file_size: None,
            },
        }
    }

    fn generate_preview(&self, content: &ClipboardContent, max_chars: usize) -> String {
        let text = match content {
            ClipboardContent::Text(s) => s.clone(),
            ClipboardContent::RichText { plain, .. } => plain.clone(),
            ClipboardContent::Code { code, .. } => code.clone(),
            ClipboardContent::Url { url, title, .. } => {
                title.as_ref().unwrap_or(url).clone()
            }
            ClipboardContent::Email { email, name, .. } => {
                name.as_ref().unwrap_or(email).clone()
            }
            ClipboardContent::Phone { formatted, number, .. } => {
                formatted.as_ref().unwrap_or(number).clone()
            }
            ClipboardContent::Color { hex, .. } => hex.clone(),
            ClipboardContent::Image { .. } => "[Image]".to_string(),
            ClipboardContent::File { name, .. } => name.clone(),
            ClipboardContent::Files { paths } => {
                format!("{} files", paths.len())
            }
            ClipboardContent::Address { raw, .. } => raw.clone(),
            ClipboardContent::Custom { content_type, .. } => {
                format!("[{}]", content_type)
            }
        };

        if text.len() > max_chars {
            format!("{}...", &text[..max_chars])
        } else {
            text
        }
    }

    pub fn get_entry(&self, entry_id: &str) -> Option<ClipboardEntry> {
        self.entries.read().unwrap()
            .iter()
            .find(|e| e.id == entry_id)
            .cloned()
    }

    pub fn get_all_entries(&self) -> Vec<ClipboardEntry> {
        self.entries.read().unwrap().clone()
    }

    pub fn get_recent_entries(&self, limit: usize) -> Vec<ClipboardEntry> {
        let entries = self.entries.read().unwrap();
        entries.iter().take(limit).cloned().collect()
    }

    pub fn get_entries_by_category(&self, category: ClipboardCategory) -> Vec<ClipboardEntry> {
        self.entries.read().unwrap()
            .iter()
            .filter(|e| e.category == category)
            .cloned()
            .collect()
    }

    pub fn get_pinned_entries(&self) -> Vec<ClipboardEntry> {
        self.entries.read().unwrap()
            .iter()
            .filter(|e| e.is_pinned)
            .cloned()
            .collect()
    }

    pub fn get_favorite_entries(&self) -> Vec<ClipboardEntry> {
        self.entries.read().unwrap()
            .iter()
            .filter(|e| e.is_favorite)
            .cloned()
            .collect()
    }

    pub fn update_entry(&self, entry_id: &str, updates: EntryUpdate) -> Result<ClipboardEntry, String> {
        let mut entries = self.entries.write().unwrap();
        let entry = entries.iter_mut()
            .find(|e| e.id == entry_id)
            .ok_or_else(|| "Entry not found".to_string())?;

        if let Some(is_pinned) = updates.is_pinned {
            entry.is_pinned = is_pinned;
        }
        if let Some(is_favorite) = updates.is_favorite {
            entry.is_favorite = is_favorite;
        }
        if let Some(tags) = updates.tags {
            entry.tags = tags;
        }
        if let Some(category) = updates.category {
            entry.category = category;
        }

        Ok(entry.clone())
    }

    pub fn delete_entry(&self, entry_id: &str) -> Result<(), String> {
        let mut entries = self.entries.write().unwrap();
        let initial_len = entries.len();
        entries.retain(|e| e.id != entry_id);
        
        if entries.len() == initial_len {
            Err("Entry not found".to_string())
        } else {
            Ok(())
        }
    }

    pub fn use_entry(&self, entry_id: &str) -> Result<ClipboardContent, String> {
        let mut entries = self.entries.write().unwrap();
        let entry = entries.iter_mut()
            .find(|e| e.id == entry_id)
            .ok_or_else(|| "Entry not found".to_string())?;

        entry.use_count += 1;
        entry.last_used = Utc::now();

        Ok(entry.content.clone())
    }

    pub fn clear_history(&self, keep_pinned: bool) {
        let mut entries = self.entries.write().unwrap();
        if keep_pinned {
            entries.retain(|e| e.is_pinned);
        } else {
            entries.clear();
        }
    }

    pub fn delete_expired(&self) -> u32 {
        let now = Utc::now();
        let mut entries = self.entries.write().unwrap();
        let initial = entries.len();
        
        entries.retain(|e| {
            e.is_pinned || e.expires_at.map(|exp| exp > now).unwrap_or(true)
        });

        (initial - entries.len()) as u32
    }

    // ==================== Search ====================

    pub fn search(&self, query: &str) -> Vec<ClipboardSearchResult> {
        let query_lower = query.to_lowercase();
        let entries = self.entries.read().unwrap();

        entries.iter()
            .filter_map(|entry| {
                let text = self.content_to_text(&entry.content);
                let text_lower = text.to_lowercase();

                if let Some(pos) = text_lower.find(&query_lower) {
                    Some(ClipboardSearchResult {
                        entry: entry.clone(),
                        match_score: 1.0,
                        matched_in: vec!["content".to_string()],
                        highlight_ranges: vec![(pos, pos + query.len())],
                    })
                } else if entry.tags.iter().any(|t| t.to_lowercase().contains(&query_lower)) {
                    Some(ClipboardSearchResult {
                        entry: entry.clone(),
                        match_score: 0.8,
                        matched_in: vec!["tags".to_string()],
                        highlight_ranges: Vec::new(),
                    })
                } else {
                    None
                }
            })
            .collect()
    }

    fn content_to_text(&self, content: &ClipboardContent) -> String {
        match content {
            ClipboardContent::Text(s) => s.clone(),
            ClipboardContent::RichText { plain, .. } => plain.clone(),
            ClipboardContent::Code { code, .. } => code.clone(),
            ClipboardContent::Url { url, .. } => url.clone(),
            ClipboardContent::Email { email, .. } => email.clone(),
            ClipboardContent::Phone { number, .. } => number.clone(),
            ClipboardContent::Color { hex, .. } => hex.clone(),
            ClipboardContent::Address { raw, .. } => raw.clone(),
            ClipboardContent::File { name, .. } => name.clone(),
            ClipboardContent::Files { paths } => paths.join(", "),
            ClipboardContent::Image { .. } => String::new(),
            ClipboardContent::Custom { data, .. } => data.clone(),
        }
    }

    // ==================== Transformations ====================

    pub fn transform(&self, entry_id: &str, transform_type: TransformType) -> Result<SmartPaste, String> {
        let entries = self.entries.read().unwrap();
        let entry = entries.iter()
            .find(|e| e.id == entry_id)
            .ok_or_else(|| "Entry not found".to_string())?;

        let original = self.content_to_text(&entry.content);
        let transformed = self.apply_transform(&original, &transform_type);

        Ok(SmartPaste {
            original,
            transformed,
            transform_type,
        })
    }

    fn apply_transform(&self, text: &str, transform_type: &TransformType) -> String {
        match transform_type {
            TransformType::None => text.to_string(),
            TransformType::PlainText => text.to_string(),
            TransformType::Uppercase => text.to_uppercase(),
            TransformType::Lowercase => text.to_lowercase(),
            TransformType::TitleCase => self.to_title_case(text),
            TransformType::CamelCase => self.to_camel_case(text),
            TransformType::SnakeCase => self.to_snake_case(text),
            TransformType::KebabCase => self.to_kebab_case(text),
            TransformType::Trimmed => text.trim().to_string(),
            TransformType::SingleLine => text.lines().collect::<Vec<_>>().join(" "),
            TransformType::NoWhitespace => text.chars().filter(|c| !c.is_whitespace()).collect(),
            TransformType::UrlEncoded => urlencoding::encode(text).to_string(),
            TransformType::UrlDecoded => urlencoding::decode(text).unwrap_or_else(|_| text.into()).to_string(),
            TransformType::HtmlEncoded => self.html_encode(text),
            TransformType::HtmlDecoded => self.html_decode(text),
            TransformType::Base64Encode => {
                use base64::{Engine as _, engine::general_purpose};
                general_purpose::STANDARD.encode(text.as_bytes())
            }
            TransformType::Base64Decode => {
                use base64::{Engine as _, engine::general_purpose};
                general_purpose::STANDARD.decode(text)
                    .ok()
                    .and_then(|bytes| String::from_utf8(bytes).ok())
                    .unwrap_or_else(|| text.to_string())
            }
            TransformType::Slugify => self.slugify(text),
            TransformType::Reverse => text.chars().rev().collect(),
        }
    }

    fn html_encode(&self, s: &str) -> String {
        s.replace('&', "&amp;")
            .replace('<', "&lt;")
            .replace('>', "&gt;")
            .replace('"', "&quot;")
            .replace('\'', "&#x27;")
    }

    fn html_decode(&self, s: &str) -> String {
        s.replace("&amp;", "&")
            .replace("&lt;", "<")
            .replace("&gt;", ">")
            .replace("&quot;", "\"")
            .replace("&#x27;", "'")
            .replace("&#39;", "'")
    }

    fn to_title_case(&self, s: &str) -> String {
        s.split_whitespace()
            .map(|word| {
                let mut chars = word.chars();
                match chars.next() {
                    None => String::new(),
                    Some(first) => first.to_uppercase().collect::<String>() + chars.as_str().to_lowercase().as_str(),
                }
            })
            .collect::<Vec<_>>()
            .join(" ")
    }

    fn to_camel_case(&self, s: &str) -> String {
        let words: Vec<_> = s.split(|c: char| !c.is_alphanumeric())
            .filter(|s| !s.is_empty())
            .collect();
        
        if words.is_empty() {
            return String::new();
        }

        let mut result = words[0].to_lowercase();
        for word in &words[1..] {
            result.push_str(&self.to_title_case(word));
        }
        result
    }

    fn to_snake_case(&self, s: &str) -> String {
        let mut result = String::new();
        for (i, c) in s.chars().enumerate() {
            if c.is_uppercase() && i > 0 {
                result.push('_');
            }
            result.push(c.to_lowercase().next().unwrap_or(c));
        }
        result
    }

    fn to_kebab_case(&self, s: &str) -> String {
        self.to_snake_case(s).replace('_', "-")
    }

    fn slugify(&self, s: &str) -> String {
        s.to_lowercase()
            .chars()
            .map(|c| if c.is_alphanumeric() { c } else { '-' })
            .collect::<String>()
            .split('-')
            .filter(|s| !s.is_empty())
            .collect::<Vec<_>>()
            .join("-")
    }

    // ==================== Templates ====================

    pub fn create_template(&self, name: String, content: String, variables: Vec<TemplateVariable>) -> PasteTemplate {
        let template = PasteTemplate {
            id: Uuid::new_v4().to_string(),
            name,
            content,
            variables,
            category: "general".to_string(),
            shortcut: None,
            use_count: 0,
            created_at: Utc::now(),
        };

        let id = template.id.clone();
        self.templates.write().unwrap().insert(id, template.clone());
        template
    }

    pub fn get_template(&self, template_id: &str) -> Option<PasteTemplate> {
        self.templates.read().unwrap().get(template_id).cloned()
    }

    pub fn get_all_templates(&self) -> Vec<PasteTemplate> {
        self.templates.read().unwrap().values().cloned().collect()
    }

    pub fn delete_template(&self, template_id: &str) -> Result<(), String> {
        self.templates.write().unwrap()
            .remove(template_id)
            .ok_or_else(|| "Template not found".to_string())?;
        Ok(())
    }

    pub fn apply_template(&self, template_id: &str, values: HashMap<String, String>) -> Result<String, String> {
        let mut templates = self.templates.write().unwrap();
        let template = templates.get_mut(template_id)
            .ok_or_else(|| "Template not found".to_string())?;

        template.use_count += 1;

        let mut result = template.content.clone();
        for (name, value) in values {
            result = result.replace(&format!("{{{{{}}}}}", name), &value);
        }

        // Replace remaining variables with defaults
        for var in &template.variables {
            let placeholder = format!("{{{{{}}}}}", var.name);
            if result.contains(&placeholder) {
                let default = var.default_value.as_deref().unwrap_or("");
                result = result.replace(&placeholder, default);
            }
        }

        Ok(result)
    }

    // ==================== Statistics ====================

    pub fn get_stats(&self) -> ClipboardStats {
        let entries = self.entries.read().unwrap();
        let now = Utc::now();

        let total = entries.len() as u32;
        let total_size: u64 = entries.iter()
            .map(|e| self.estimate_content_size(&e.content))
            .sum();

        let mut by_category: HashMap<String, u32> = HashMap::new();
        let mut by_source: HashMap<String, u32> = HashMap::new();
        let mut pinned = 0u32;
        let mut favorite = 0u32;
        let mut sensitive = 0u32;
        let mut expired = 0u32;

        for entry in entries.iter() {
            let cat_key = format!("{:?}", entry.category);
            *by_category.entry(cat_key).or_insert(0) += 1;

            if let Some(source) = &entry.source_app {
                *by_source.entry(source.clone()).or_insert(0) += 1;
            }

            if entry.is_pinned { pinned += 1; }
            if entry.is_favorite { favorite += 1; }
            if entry.is_sensitive { sensitive += 1; }
            if entry.expires_at.map(|e| e < now).unwrap_or(false) { expired += 1; }
        }

        let mut most_used: Vec<_> = entries.iter()
            .map(|e| (e.id.clone(), e.use_count))
            .collect();
        most_used.sort_by(|a, b| b.1.cmp(&a.1));
        most_used.truncate(10);

        let avg_size = if total > 0 {
            (total_size as f32) / (total as f32) / 1024.0
        } else {
            0.0
        };

        ClipboardStats {
            total_entries: total,
            total_size_kb: total_size / 1024,
            entries_by_category: by_category,
            entries_by_source: by_source,
            most_used,
            pinned_count: pinned,
            favorite_count: favorite,
            sensitive_count: sensitive,
            expired_count: expired,
            avg_entry_size_kb: avg_size,
        }
    }
}

// ==================== Update Types ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntryUpdate {
    pub is_pinned: Option<bool>,
    pub is_favorite: Option<bool>,
    pub tags: Option<Vec<String>>,
    pub category: Option<ClipboardCategory>,
}

impl Default for BrowserSmartClipboardService {
    fn default() -> Self {
        Self::new()
    }
}
