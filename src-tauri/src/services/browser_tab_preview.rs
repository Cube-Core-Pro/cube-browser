// CUBE Nexum - Tab Preview Service
// Rich tab previews with thumbnails, instant preview on hover, and visual search

use std::collections::HashMap;
use std::sync::RwLock;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// ==================== Types ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TabPreview {
    pub id: String,
    pub tab_id: String,
    pub thumbnail_data: Option<String>,  // Base64 encoded image
    pub thumbnail_url: Option<String>,   // URL to cached thumbnail
    pub preview_html: Option<String>,    // Simplified HTML preview
    pub preview_text: Option<String>,    // Text content preview
    pub meta_title: String,
    pub meta_description: Option<String>,
    pub meta_image: Option<String>,      // OG image
    pub favicon_url: Option<String>,
    pub color_dominant: Option<String>,  // Extracted dominant color
    pub color_palette: Vec<String>,      // Color palette from page
    pub scroll_position: f32,            // 0.0 - 1.0
    pub zoom_level: f32,
    pub page_width: u32,
    pub page_height: u32,
    pub captured_at: DateTime<Utc>,
    pub is_stale: bool,
    pub capture_quality: CaptureQuality,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TabPreviewSettings {
    pub enabled: bool,
    pub trigger: PreviewTrigger,
    pub delay_ms: u32,
    pub thumbnail_width: u32,
    pub thumbnail_height: u32,
    pub thumbnail_quality: u8,          // 1-100
    pub capture_quality: CaptureQuality,
    pub show_on_hover: bool,
    pub show_on_ctrl_tab: bool,
    pub show_in_search: bool,
    pub cache_enabled: bool,
    pub cache_max_size_mb: u32,
    pub auto_refresh_interval_ms: u32,
    pub stale_after_ms: u64,
    pub show_scroll_position: bool,
    pub show_loading_state: bool,
    pub show_audio_indicator: bool,
    pub animation: PreviewAnimation,
    pub position: PreviewPosition,
    pub size: PreviewSize,
    pub blur_background: bool,
    pub show_favicon: bool,
    pub show_title: bool,
    pub show_url: bool,
    pub show_color_bar: bool,
    pub show_metadata: bool,
    pub keyboard_navigation: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PreviewTrigger {
    Hover,
    Click,
    CtrlHover,
    RightClick,
    MiddleClick,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CaptureQuality {
    Low,        // 320x240, fast
    Medium,     // 640x480, balanced
    High,       // 1280x960, quality
    Full,       // Full resolution
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PreviewAnimation {
    None,
    Fade,
    Scale,
    Slide,
    Zoom,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PreviewPosition {
    Above,
    Below,
    Left,
    Right,
    Auto,
    Center,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PreviewSize {
    Small,      // 200x150
    Medium,     // 320x240
    Large,      // 480x360
    ExtraLarge, // 640x480
    Custom(u32, u32),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PreviewCard {
    pub preview: TabPreview,
    pub is_active: bool,
    pub is_pinned: bool,
    pub is_muted: bool,
    pub is_playing_audio: bool,
    pub workspace_color: Option<String>,
    pub badges: Vec<PreviewBadge>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PreviewBadge {
    pub badge_type: BadgeType,
    pub label: String,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum BadgeType {
    Audio,
    Muted,
    Pinned,
    Loading,
    Error,
    Updated,
    Permission,
    Download,
    Recording,
    Custom(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VisualTabSearch {
    pub query: String,
    pub results: Vec<VisualSearchResult>,
    pub search_mode: VisualSearchMode,
    pub total_matches: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VisualSearchResult {
    pub tab_id: String,
    pub preview: TabPreview,
    pub match_score: f32,
    pub match_highlights: Vec<MatchHighlight>,
    pub matched_in: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MatchHighlight {
    pub text: String,
    pub start: u32,
    pub end: u32,
    pub field: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum VisualSearchMode {
    Title,
    Content,
    Url,
    All,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TabCarousel {
    pub tabs: Vec<PreviewCard>,
    pub active_index: usize,
    pub is_visible: bool,
    pub animation_direction: CarouselDirection,
    pub filter: Option<CarouselFilter>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CarouselDirection {
    None,
    Left,
    Right,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CarouselFilter {
    pub filter_type: CarouselFilterType,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CarouselFilterType {
    All,
    Workspace,
    Domain,
    Recent,
    Pinned,
    AudioPlaying,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PreviewGrid {
    pub previews: Vec<PreviewCard>,
    pub columns: u32,
    pub rows: u32,
    pub selected_index: Option<usize>,
    pub show_empty_slots: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThumbnailCache {
    pub tab_id: String,
    pub data: String,           // Base64
    pub size_bytes: u64,
    pub created_at: DateTime<Utc>,
    pub last_accessed: DateTime<Utc>,
    pub access_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PreviewStats {
    pub total_previews: u32,
    pub cache_size_mb: f32,
    pub cache_hit_rate: f32,
    pub avg_capture_time_ms: f32,
    pub stale_previews: u32,
    pub previews_by_quality: HashMap<String, u32>,
}

// ==================== Service Implementation ====================

pub struct BrowserTabPreviewService {
    previews: RwLock<HashMap<String, TabPreview>>,
    cache: RwLock<HashMap<String, ThumbnailCache>>,
    settings: RwLock<TabPreviewSettings>,
    carousel: RwLock<TabCarousel>,
    stats: RwLock<PreviewServiceStats>,
}

#[derive(Debug, Default)]
struct PreviewServiceStats {
    cache_hits: u64,
    cache_misses: u64,
    total_captures: u64,
    total_capture_time_ms: u64,
}

impl BrowserTabPreviewService {
    pub fn new() -> Self {
        Self {
            previews: RwLock::new(HashMap::new()),
            cache: RwLock::new(HashMap::new()),
            settings: RwLock::new(Self::default_settings()),
            carousel: RwLock::new(TabCarousel {
                tabs: Vec::new(),
                active_index: 0,
                is_visible: false,
                animation_direction: CarouselDirection::None,
                filter: None,
            }),
            stats: RwLock::new(PreviewServiceStats::default()),
        }
    }

    fn default_settings() -> TabPreviewSettings {
        TabPreviewSettings {
            enabled: true,
            trigger: PreviewTrigger::Hover,
            delay_ms: 300,
            thumbnail_width: 320,
            thumbnail_height: 240,
            thumbnail_quality: 80,
            capture_quality: CaptureQuality::Medium,
            show_on_hover: true,
            show_on_ctrl_tab: true,
            show_in_search: true,
            cache_enabled: true,
            cache_max_size_mb: 100,
            auto_refresh_interval_ms: 60000,
            stale_after_ms: 300000, // 5 minutes
            show_scroll_position: true,
            show_loading_state: true,
            show_audio_indicator: true,
            animation: PreviewAnimation::Scale,
            position: PreviewPosition::Auto,
            size: PreviewSize::Medium,
            blur_background: true,
            show_favicon: true,
            show_title: true,
            show_url: true,
            show_color_bar: true,
            show_metadata: false,
            keyboard_navigation: true,
        }
    }

    // ==================== Settings ====================

    pub fn get_settings(&self) -> TabPreviewSettings {
        self.settings.read().unwrap().clone()
    }

    pub fn update_settings(&self, new_settings: TabPreviewSettings) {
        let mut settings = self.settings.write().unwrap();
        *settings = new_settings;
    }

    pub fn set_trigger(&self, trigger: PreviewTrigger) {
        let mut settings = self.settings.write().unwrap();
        settings.trigger = trigger;
    }

    pub fn set_quality(&self, quality: CaptureQuality) {
        let mut settings = self.settings.write().unwrap();
        settings.capture_quality = quality;
    }

    pub fn set_size(&self, size: PreviewSize) {
        let mut settings = self.settings.write().unwrap();
        settings.size = size;
    }

    pub fn set_animation(&self, animation: PreviewAnimation) {
        let mut settings = self.settings.write().unwrap();
        settings.animation = animation;
    }

    // ==================== Preview CRUD ====================

    pub fn capture_preview(&self, tab_id: &str, title: String, url: &str) -> Result<TabPreview, String> {
        let settings = self.settings.read().unwrap();
        let now = Utc::now();

        let preview = TabPreview {
            id: Uuid::new_v4().to_string(),
            tab_id: tab_id.to_string(),
            thumbnail_data: None, // Would be captured from actual browser
            thumbnail_url: None,
            preview_html: None,
            preview_text: None,
            meta_title: title,
            meta_description: None,
            meta_image: None,
            favicon_url: self.extract_favicon_url(url),
            color_dominant: None,
            color_palette: Vec::new(),
            scroll_position: 0.0,
            zoom_level: 1.0,
            page_width: 1920,
            page_height: 1080,
            captured_at: now,
            is_stale: false,
            capture_quality: settings.capture_quality.clone(),
        };

        self.previews.write().unwrap().insert(tab_id.to_string(), preview.clone());

        // Update stats
        {
            let mut stats = self.stats.write().unwrap();
            stats.total_captures += 1;
        }

        Ok(preview)
    }

    fn extract_favicon_url(&self, url: &str) -> Option<String> {
        // Extract domain and construct favicon URL
        if let Ok(parsed) = url::Url::parse(url) {
            if let Some(host) = parsed.host_str() {
                return Some(format!("https://www.google.com/s2/favicons?domain={}&sz=64", host));
            }
        }
        None
    }

    pub fn get_preview(&self, tab_id: &str) -> Option<TabPreview> {
        let mut stats = self.stats.write().unwrap();
        
        if let Some(preview) = self.previews.read().unwrap().get(tab_id) {
            stats.cache_hits += 1;
            Some(preview.clone())
        } else {
            stats.cache_misses += 1;
            None
        }
    }

    pub fn get_all_previews(&self) -> Vec<TabPreview> {
        self.previews.read().unwrap().values().cloned().collect()
    }

    pub fn update_preview(&self, tab_id: &str, updates: PreviewUpdate) -> Result<TabPreview, String> {
        let mut previews = self.previews.write().unwrap();
        let preview = previews.get_mut(tab_id)
            .ok_or_else(|| "Preview not found".to_string())?;

        if let Some(thumbnail_data) = updates.thumbnail_data {
            preview.thumbnail_data = Some(thumbnail_data);
        }
        if let Some(preview_text) = updates.preview_text {
            preview.preview_text = Some(preview_text);
        }
        if let Some(meta_description) = updates.meta_description {
            preview.meta_description = Some(meta_description);
        }
        if let Some(meta_image) = updates.meta_image {
            preview.meta_image = Some(meta_image);
        }
        if let Some(color_dominant) = updates.color_dominant {
            preview.color_dominant = Some(color_dominant);
        }
        if let Some(color_palette) = updates.color_palette {
            preview.color_palette = color_palette;
        }
        if let Some(scroll_position) = updates.scroll_position {
            preview.scroll_position = scroll_position;
        }
        if let Some(zoom_level) = updates.zoom_level {
            preview.zoom_level = zoom_level;
        }

        preview.captured_at = Utc::now();
        preview.is_stale = false;

        Ok(preview.clone())
    }

    pub fn delete_preview(&self, tab_id: &str) {
        self.previews.write().unwrap().remove(tab_id);
        self.cache.write().unwrap().remove(tab_id);
    }

    pub fn mark_stale(&self, tab_id: &str) {
        if let Some(preview) = self.previews.write().unwrap().get_mut(tab_id) {
            preview.is_stale = true;
        }
    }

    pub fn mark_all_stale(&self) {
        let mut previews = self.previews.write().unwrap();
        for preview in previews.values_mut() {
            preview.is_stale = true;
        }
    }

    pub fn get_stale_previews(&self) -> Vec<String> {
        let settings = self.settings.read().unwrap();
        let now = Utc::now();
        let stale_threshold = chrono::Duration::milliseconds(settings.stale_after_ms as i64);

        self.previews.read().unwrap()
            .iter()
            .filter(|(_, p)| p.is_stale || (now - p.captured_at) > stale_threshold)
            .map(|(id, _)| id.clone())
            .collect()
    }

    // ==================== Cache Management ====================

    pub fn cache_thumbnail(&self, tab_id: &str, data: String) -> Result<(), String> {
        let settings = self.settings.read().unwrap();
        if !settings.cache_enabled {
            return Ok(());
        }

        let now = Utc::now();
        let size_bytes = data.len() as u64;

        // Check cache size limit
        self.enforce_cache_limit(&settings)?;

        let cache_entry = ThumbnailCache {
            tab_id: tab_id.to_string(),
            data,
            size_bytes,
            created_at: now,
            last_accessed: now,
            access_count: 1,
        };

        self.cache.write().unwrap().insert(tab_id.to_string(), cache_entry);

        Ok(())
    }

    fn enforce_cache_limit(&self, settings: &TabPreviewSettings) -> Result<(), String> {
        let max_bytes = (settings.cache_max_size_mb as u64) * 1024 * 1024;
        let mut cache = self.cache.write().unwrap();
        
        let current_size: u64 = cache.values().map(|c| c.size_bytes).sum();
        
        if current_size >= max_bytes {
            // Remove oldest entries
            let mut entries: Vec<_> = cache.iter()
                .map(|(k, v)| (k.clone(), v.last_accessed))
                .collect();
            entries.sort_by(|a, b| a.1.cmp(&b.1));

            let mut freed = 0u64;
            let target = current_size - max_bytes + (max_bytes / 10); // Free 10% extra

            for (key, _) in entries {
                if freed >= target {
                    break;
                }
                if let Some(entry) = cache.remove(&key) {
                    freed += entry.size_bytes;
                }
            }
        }

        Ok(())
    }

    pub fn get_cached_thumbnail(&self, tab_id: &str) -> Option<String> {
        let mut cache = self.cache.write().unwrap();
        if let Some(entry) = cache.get_mut(tab_id) {
            entry.last_accessed = Utc::now();
            entry.access_count += 1;
            Some(entry.data.clone())
        } else {
            None
        }
    }

    pub fn clear_cache(&self) {
        self.cache.write().unwrap().clear();
    }

    pub fn get_cache_size(&self) -> f32 {
        let total_bytes: u64 = self.cache.read().unwrap()
            .values()
            .map(|c| c.size_bytes)
            .sum();
        
        (total_bytes as f32) / (1024.0 * 1024.0)
    }

    // ==================== Visual Search ====================

    pub fn visual_search(&self, query: &str, mode: VisualSearchMode) -> VisualTabSearch {
        let query_lower = query.to_lowercase();
        let previews = self.previews.read().unwrap();

        let results: Vec<VisualSearchResult> = previews.values()
            .filter_map(|preview| {
                let mut score = 0.0f32;
                let mut highlights = Vec::new();
                let mut matched_in = Vec::new();

                // Search in title
                if mode == VisualSearchMode::All || mode == VisualSearchMode::Title {
                    if let Some(pos) = preview.meta_title.to_lowercase().find(&query_lower) {
                        score += 3.0;
                        matched_in.push("title".to_string());
                        highlights.push(MatchHighlight {
                            text: preview.meta_title.clone(),
                            start: pos as u32,
                            end: (pos + query.len()) as u32,
                            field: "title".to_string(),
                        });
                    }
                }

                // Search in content
                if mode == VisualSearchMode::All || mode == VisualSearchMode::Content {
                    if let Some(text) = &preview.preview_text {
                        if let Some(pos) = text.to_lowercase().find(&query_lower) {
                            score += 2.0;
                            matched_in.push("content".to_string());
                            highlights.push(MatchHighlight {
                                text: text[pos.saturating_sub(20)..(pos + query.len() + 20).min(text.len())].to_string(),
                                start: 20.min(pos) as u32,
                                end: (20.min(pos) + query.len()) as u32,
                                field: "content".to_string(),
                            });
                        }
                    }
                }

                // Search in description
                if mode == VisualSearchMode::All || mode == VisualSearchMode::Content {
                    if let Some(desc) = &preview.meta_description {
                        if desc.to_lowercase().contains(&query_lower) {
                            score += 1.5;
                            matched_in.push("description".to_string());
                        }
                    }
                }

                if score > 0.0 {
                    Some(VisualSearchResult {
                        tab_id: preview.tab_id.clone(),
                        preview: preview.clone(),
                        match_score: score,
                        match_highlights: highlights,
                        matched_in,
                    })
                } else {
                    None
                }
            })
            .collect();

        let total = results.len() as u32;

        VisualTabSearch {
            query: query.to_string(),
            results,
            search_mode: mode,
            total_matches: total,
        }
    }

    // ==================== Carousel ====================

    pub fn show_carousel(&self, tabs: Vec<PreviewCard>) {
        let mut carousel = self.carousel.write().unwrap();
        carousel.tabs = tabs;
        carousel.active_index = 0;
        carousel.is_visible = true;
        carousel.animation_direction = CarouselDirection::None;
    }

    pub fn hide_carousel(&self) {
        let mut carousel = self.carousel.write().unwrap();
        carousel.is_visible = false;
    }

    pub fn carousel_next(&self) -> Option<PreviewCard> {
        let mut carousel = self.carousel.write().unwrap();
        if carousel.tabs.is_empty() {
            return None;
        }

        carousel.active_index = (carousel.active_index + 1) % carousel.tabs.len();
        carousel.animation_direction = CarouselDirection::Right;
        carousel.tabs.get(carousel.active_index).cloned()
    }

    pub fn carousel_prev(&self) -> Option<PreviewCard> {
        let mut carousel = self.carousel.write().unwrap();
        if carousel.tabs.is_empty() {
            return None;
        }

        carousel.active_index = if carousel.active_index == 0 {
            carousel.tabs.len() - 1
        } else {
            carousel.active_index - 1
        };
        carousel.animation_direction = CarouselDirection::Left;
        carousel.tabs.get(carousel.active_index).cloned()
    }

    pub fn carousel_select(&self, index: usize) -> Option<PreviewCard> {
        let mut carousel = self.carousel.write().unwrap();
        if index < carousel.tabs.len() {
            carousel.active_index = index;
            carousel.animation_direction = CarouselDirection::None;
            carousel.tabs.get(index).cloned()
        } else {
            None
        }
    }

    pub fn get_carousel(&self) -> TabCarousel {
        self.carousel.read().unwrap().clone()
    }

    pub fn set_carousel_filter(&self, filter: CarouselFilter) {
        let mut carousel = self.carousel.write().unwrap();
        carousel.filter = Some(filter);
    }

    pub fn clear_carousel_filter(&self) {
        let mut carousel = self.carousel.write().unwrap();
        carousel.filter = None;
    }

    // ==================== Preview Grid ====================

    pub fn create_preview_grid(&self, tab_ids: Vec<String>, columns: u32) -> PreviewGrid {
        let previews = self.previews.read().unwrap();

        let cards: Vec<PreviewCard> = tab_ids.iter()
            .filter_map(|id| previews.get(id))
            .map(|preview| PreviewCard {
                preview: preview.clone(),
                is_active: false,
                is_pinned: false,
                is_muted: false,
                is_playing_audio: false,
                workspace_color: None,
                badges: Vec::new(),
            })
            .collect();

        let total = cards.len() as u32;
        let rows = (total + columns - 1) / columns;

        PreviewGrid {
            previews: cards,
            columns,
            rows,
            selected_index: None,
            show_empty_slots: false,
        }
    }

    pub fn grid_navigate(&self, current: usize, direction: GridDirection, columns: u32, total: usize) -> usize {
        match direction {
            GridDirection::Up => {
                if current >= columns as usize {
                    current - columns as usize
                } else {
                    current
                }
            }
            GridDirection::Down => {
                let next = current + columns as usize;
                if next < total { next } else { current }
            }
            GridDirection::Left => {
                if current > 0 { current - 1 } else { current }
            }
            GridDirection::Right => {
                if current + 1 < total { current + 1 } else { current }
            }
        }
    }

    // ==================== Statistics ====================

    pub fn get_stats(&self) -> PreviewStats {
        let previews = self.previews.read().unwrap();
        let stats = self.stats.read().unwrap();

        let cache_size = self.get_cache_size();
        let hit_rate = if stats.cache_hits + stats.cache_misses > 0 {
            (stats.cache_hits as f32) / ((stats.cache_hits + stats.cache_misses) as f32)
        } else {
            0.0
        };
        let avg_capture_time = if stats.total_captures > 0 {
            (stats.total_capture_time_ms as f32) / (stats.total_captures as f32)
        } else {
            0.0
        };

        let stale_count = previews.values().filter(|p| p.is_stale).count() as u32;

        let mut by_quality: HashMap<String, u32> = HashMap::new();
        for preview in previews.values() {
            let key = format!("{:?}", preview.capture_quality);
            *by_quality.entry(key).or_insert(0) += 1;
        }

        PreviewStats {
            total_previews: previews.len() as u32,
            cache_size_mb: cache_size,
            cache_hit_rate: hit_rate,
            avg_capture_time_ms: avg_capture_time,
            stale_previews: stale_count,
            previews_by_quality: by_quality,
        }
    }

    // ==================== Batch Operations ====================

    pub fn refresh_all_previews(&self) -> Vec<String> {
        self.get_stale_previews()
    }

    pub fn delete_old_previews(&self, max_age_hours: u32) -> u32 {
        let now = Utc::now();
        let max_age = chrono::Duration::hours(max_age_hours as i64);
        let mut count = 0;

        let to_delete: Vec<_> = self.previews.read().unwrap()
            .iter()
            .filter(|(_, p)| (now - p.captured_at) > max_age)
            .map(|(id, _)| id.clone())
            .collect();

        let mut previews = self.previews.write().unwrap();
        for id in to_delete {
            previews.remove(&id);
            count += 1;
        }

        count
    }
}

// ==================== Additional Types ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PreviewUpdate {
    pub thumbnail_data: Option<String>,
    pub preview_text: Option<String>,
    pub meta_description: Option<String>,
    pub meta_image: Option<String>,
    pub color_dominant: Option<String>,
    pub color_palette: Option<Vec<String>>,
    pub scroll_position: Option<f32>,
    pub zoom_level: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum GridDirection {
    Up,
    Down,
    Left,
    Right,
}

impl Default for BrowserTabPreviewService {
    fn default() -> Self {
        Self::new()
    }
}
