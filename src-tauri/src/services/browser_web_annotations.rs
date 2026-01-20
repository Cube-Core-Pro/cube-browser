// CUBE Nexum - Web Annotations Service
// Page annotations, highlights, and notes

use std::collections::HashMap;
use std::sync::RwLock;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// ==================== Types ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PageAnnotation {
    pub id: String,
    pub url: String,
    pub page_title: String,
    pub annotation_type: AnnotationType,
    pub content: AnnotationContent,
    pub position: AnnotationPosition,
    pub style: AnnotationStyle,
    pub tags: Vec<String>,
    pub is_private: bool,
    pub is_favorite: bool,
    pub reactions: Vec<Reaction>,
    pub replies: Vec<AnnotationReply>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub synced: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AnnotationType {
    Highlight,
    Note,
    Bookmark,
    Drawing,
    Screenshot,
    TextSelection,
    ElementPin,
    VoiceMemo,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnnotationContent {
    pub text: Option<String>,
    pub html: Option<String>,
    pub note: Option<String>,
    pub image_data: Option<String>,
    pub audio_data: Option<String>,
    pub drawing_data: Option<DrawingData>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DrawingData {
    pub strokes: Vec<Stroke>,
    pub width: u32,
    pub height: u32,
    pub background_color: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Stroke {
    pub points: Vec<Point>,
    pub color: String,
    pub width: f32,
    pub opacity: f32,
    pub tool: DrawingTool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Point {
    pub x: f32,
    pub y: f32,
    pub pressure: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DrawingTool {
    Pen,
    Highlighter,
    Eraser,
    Arrow,
    Rectangle,
    Circle,
    Line,
    Text,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnnotationPosition {
    pub selector_type: SelectorType,
    pub selector: String,
    pub start_offset: Option<u32>,
    pub end_offset: Option<u32>,
    pub rect: Option<Rect>,
    pub scroll_position: Option<ScrollPosition>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SelectorType {
    CssSelector,
    XPath,
    TextQuote,
    TextPosition,
    RangeSelector,
    FragmentSelector,
    SvgSelector,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Rect {
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScrollPosition {
    pub x: f32,
    pub y: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnnotationStyle {
    pub color: String,
    pub background_color: Option<String>,
    pub font_size: Option<u32>,
    pub underline: bool,
    pub strikethrough: bool,
    pub icon: Option<String>,
    pub opacity: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Reaction {
    pub user_id: String,
    pub emoji: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnnotationReply {
    pub id: String,
    pub user_id: String,
    pub text: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnnotationSettings {
    pub enabled: bool,
    pub default_highlight_color: String,
    pub default_note_color: String,
    pub show_toolbar: bool,
    pub toolbar_position: ToolbarPosition,
    pub auto_show_on_selection: bool,
    pub sync_enabled: bool,
    pub keyboard_shortcuts: AnnotationShortcuts,
    pub highlight_colors: Vec<String>,
    pub drawing_colors: Vec<String>,
    pub pen_sizes: Vec<f32>,
    pub default_pen_size: f32,
    pub show_annotations_indicator: bool,
    pub group_overlapping: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ToolbarPosition {
    Top,
    Bottom,
    Left,
    Right,
    Floating,
    Hidden,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnnotationShortcuts {
    pub toggle_toolbar: String,
    pub create_highlight: String,
    pub create_note: String,
    pub create_screenshot: String,
    pub toggle_drawing: String,
    pub delete_selected: String,
    pub next_annotation: String,
    pub prev_annotation: String,
    pub export_annotations: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnnotationCollection {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub color: String,
    pub icon: String,
    pub annotations: Vec<String>,
    pub is_shared: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnnotationExport {
    pub annotations: Vec<PageAnnotation>,
    pub collections: Vec<AnnotationCollection>,
    pub format: ExportFormat,
    pub exported_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ExportFormat {
    Json,
    Html,
    Markdown,
    Pdf,
    HypothesIs, // Hypothes.is compatible format
    Notion,
    Roam,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnnotationSearch {
    pub query: String,
    pub url_filter: Option<String>,
    pub type_filter: Option<Vec<AnnotationType>>,
    pub tag_filter: Option<Vec<String>>,
    pub date_from: Option<DateTime<Utc>>,
    pub date_to: Option<DateTime<Utc>>,
    pub sort_by: SortBy,
    pub limit: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SortBy {
    DateCreated,
    DateUpdated,
    Url,
    Type,
    Relevance,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnnotationStats {
    pub total_annotations: u64,
    pub annotations_by_type: HashMap<String, u32>,
    pub annotations_by_domain: HashMap<String, u32>,
    pub most_annotated_pages: Vec<(String, u32)>,
    pub total_highlights: u64,
    pub total_notes: u64,
    pub total_drawings: u64,
    pub total_collections: u32,
    pub annotations_this_week: u32,
}

// ==================== Service Implementation ====================

pub struct BrowserWebAnnotationsService {
    annotations: RwLock<HashMap<String, PageAnnotation>>,
    collections: RwLock<HashMap<String, AnnotationCollection>>,
    settings: RwLock<AnnotationSettings>,
    by_url: RwLock<HashMap<String, Vec<String>>>,
}

impl BrowserWebAnnotationsService {
    pub fn new() -> Self {
        Self {
            annotations: RwLock::new(HashMap::new()),
            collections: RwLock::new(HashMap::new()),
            settings: RwLock::new(Self::default_settings()),
            by_url: RwLock::new(HashMap::new()),
        }
    }

    fn default_settings() -> AnnotationSettings {
        AnnotationSettings {
            enabled: true,
            default_highlight_color: "#FFEB3B".to_string(),
            default_note_color: "#FFC107".to_string(),
            show_toolbar: true,
            toolbar_position: ToolbarPosition::Floating,
            auto_show_on_selection: true,
            sync_enabled: false,
            keyboard_shortcuts: AnnotationShortcuts {
                toggle_toolbar: "Alt+A".to_string(),
                create_highlight: "Alt+H".to_string(),
                create_note: "Alt+N".to_string(),
                create_screenshot: "Alt+S".to_string(),
                toggle_drawing: "Alt+D".to_string(),
                delete_selected: "Delete".to_string(),
                next_annotation: "Alt+]".to_string(),
                prev_annotation: "Alt+[".to_string(),
                export_annotations: "Alt+E".to_string(),
            },
            highlight_colors: vec![
                "#FFEB3B".to_string(), // Yellow
                "#4CAF50".to_string(), // Green
                "#2196F3".to_string(), // Blue
                "#E91E63".to_string(), // Pink
                "#FF9800".to_string(), // Orange
                "#9C27B0".to_string(), // Purple
            ],
            drawing_colors: vec![
                "#000000".to_string(), // Black
                "#FF0000".to_string(), // Red
                "#0000FF".to_string(), // Blue
                "#00FF00".to_string(), // Green
                "#FFFFFF".to_string(), // White
            ],
            pen_sizes: vec![2.0, 4.0, 6.0, 8.0, 12.0],
            default_pen_size: 4.0,
            show_annotations_indicator: true,
            group_overlapping: true,
        }
    }

    // ==================== Settings ====================

    pub fn get_settings(&self) -> AnnotationSettings {
        self.settings.read().unwrap().clone()
    }

    pub fn update_settings(&self, new_settings: AnnotationSettings) {
        let mut settings = self.settings.write().unwrap();
        *settings = new_settings;
    }

    // ==================== Annotation Management ====================

    pub fn create_annotation(&self, 
        url: &str,
        page_title: &str,
        annotation_type: AnnotationType,
        content: AnnotationContent,
        position: AnnotationPosition,
    ) -> PageAnnotation {
        let settings = self.settings.read().unwrap();
        let now = Utc::now();

        let style = match annotation_type {
            AnnotationType::Highlight => AnnotationStyle {
                color: settings.default_highlight_color.clone(),
                background_color: Some(settings.default_highlight_color.clone()),
                font_size: None,
                underline: false,
                strikethrough: false,
                icon: None,
                opacity: 0.5,
            },
            AnnotationType::Note => AnnotationStyle {
                color: settings.default_note_color.clone(),
                background_color: Some("#FFFFFF".to_string()),
                font_size: Some(14),
                underline: false,
                strikethrough: false,
                icon: Some("📝".to_string()),
                opacity: 1.0,
            },
            _ => AnnotationStyle {
                color: "#000000".to_string(),
                background_color: None,
                font_size: None,
                underline: false,
                strikethrough: false,
                icon: None,
                opacity: 1.0,
            },
        };

        let annotation = PageAnnotation {
            id: Uuid::new_v4().to_string(),
            url: url.to_string(),
            page_title: page_title.to_string(),
            annotation_type,
            content,
            position,
            style,
            tags: Vec::new(),
            is_private: true,
            is_favorite: false,
            reactions: Vec::new(),
            replies: Vec::new(),
            created_at: now,
            updated_at: now,
            synced: false,
        };

        let id = annotation.id.clone();
        let url_key = url.to_string();

        self.annotations.write().unwrap().insert(id.clone(), annotation.clone());
        self.by_url.write().unwrap()
            .entry(url_key)
            .or_insert_with(Vec::new)
            .push(id);

        annotation
    }

    pub fn get_annotation(&self, annotation_id: &str) -> Option<PageAnnotation> {
        self.annotations.read().unwrap().get(annotation_id).cloned()
    }

    pub fn get_annotations_for_url(&self, url: &str) -> Vec<PageAnnotation> {
        let by_url = self.by_url.read().unwrap();
        let annotations = self.annotations.read().unwrap();

        by_url.get(url)
            .map(|ids| {
                ids.iter()
                    .filter_map(|id| annotations.get(id).cloned())
                    .collect()
            })
            .unwrap_or_default()
    }

    pub fn get_all_annotations(&self) -> Vec<PageAnnotation> {
        self.annotations.read().unwrap().values().cloned().collect()
    }

    pub fn update_annotation(&self, annotation_id: &str, updates: AnnotationUpdate) -> Result<PageAnnotation, String> {
        let mut annotations = self.annotations.write().unwrap();
        let annotation = annotations.get_mut(annotation_id)
            .ok_or_else(|| "Annotation not found".to_string())?;

        if let Some(content) = updates.content {
            annotation.content = content;
        }
        if let Some(style) = updates.style {
            annotation.style = style;
        }
        if let Some(tags) = updates.tags {
            annotation.tags = tags;
        }
        if let Some(is_private) = updates.is_private {
            annotation.is_private = is_private;
        }
        if let Some(is_favorite) = updates.is_favorite {
            annotation.is_favorite = is_favorite;
        }

        annotation.updated_at = Utc::now();
        annotation.synced = false;

        Ok(annotation.clone())
    }

    pub fn delete_annotation(&self, annotation_id: &str) -> Result<(), String> {
        let mut annotations = self.annotations.write().unwrap();
        let annotation = annotations.remove(annotation_id)
            .ok_or_else(|| "Annotation not found".to_string())?;

        // Remove from URL index
        let mut by_url = self.by_url.write().unwrap();
        if let Some(ids) = by_url.get_mut(&annotation.url) {
            ids.retain(|id| id != annotation_id);
        }

        Ok(())
    }

    pub fn add_tag(&self, annotation_id: &str, tag: &str) -> Result<PageAnnotation, String> {
        let mut annotations = self.annotations.write().unwrap();
        let annotation = annotations.get_mut(annotation_id)
            .ok_or_else(|| "Annotation not found".to_string())?;

        if !annotation.tags.contains(&tag.to_string()) {
            annotation.tags.push(tag.to_string());
            annotation.updated_at = Utc::now();
        }

        Ok(annotation.clone())
    }

    pub fn remove_tag(&self, annotation_id: &str, tag: &str) -> Result<PageAnnotation, String> {
        let mut annotations = self.annotations.write().unwrap();
        let annotation = annotations.get_mut(annotation_id)
            .ok_or_else(|| "Annotation not found".to_string())?;

        annotation.tags.retain(|t| t != tag);
        annotation.updated_at = Utc::now();

        Ok(annotation.clone())
    }

    pub fn add_reply(&self, annotation_id: &str, user_id: &str, text: &str) -> Result<AnnotationReply, String> {
        let mut annotations = self.annotations.write().unwrap();
        let annotation = annotations.get_mut(annotation_id)
            .ok_or_else(|| "Annotation not found".to_string())?;

        let reply = AnnotationReply {
            id: Uuid::new_v4().to_string(),
            user_id: user_id.to_string(),
            text: text.to_string(),
            created_at: Utc::now(),
        };

        annotation.replies.push(reply.clone());
        annotation.updated_at = Utc::now();

        Ok(reply)
    }

    pub fn add_reaction(&self, annotation_id: &str, user_id: &str, emoji: &str) -> Result<PageAnnotation, String> {
        let mut annotations = self.annotations.write().unwrap();
        let annotation = annotations.get_mut(annotation_id)
            .ok_or_else(|| "Annotation not found".to_string())?;

        // Remove existing reaction from same user
        annotation.reactions.retain(|r| r.user_id != user_id);

        annotation.reactions.push(Reaction {
            user_id: user_id.to_string(),
            emoji: emoji.to_string(),
            created_at: Utc::now(),
        });

        annotation.updated_at = Utc::now();

        Ok(annotation.clone())
    }

    // ==================== Collections ====================

    pub fn create_collection(&self, name: String, description: Option<String>) -> AnnotationCollection {
        let collection = AnnotationCollection {
            id: Uuid::new_v4().to_string(),
            name,
            description,
            color: "#3b82f6".to_string(),
            icon: "📁".to_string(),
            annotations: Vec::new(),
            is_shared: false,
            created_at: Utc::now(),
        };

        let id = collection.id.clone();
        self.collections.write().unwrap().insert(id, collection.clone());

        collection
    }

    pub fn get_collection(&self, collection_id: &str) -> Option<AnnotationCollection> {
        self.collections.read().unwrap().get(collection_id).cloned()
    }

    pub fn get_all_collections(&self) -> Vec<AnnotationCollection> {
        self.collections.read().unwrap().values().cloned().collect()
    }

    pub fn add_to_collection(&self, collection_id: &str, annotation_id: &str) -> Result<AnnotationCollection, String> {
        // Verify annotation exists
        if !self.annotations.read().unwrap().contains_key(annotation_id) {
            return Err("Annotation not found".to_string());
        }

        let mut collections = self.collections.write().unwrap();
        let collection = collections.get_mut(collection_id)
            .ok_or_else(|| "Collection not found".to_string())?;

        if !collection.annotations.contains(&annotation_id.to_string()) {
            collection.annotations.push(annotation_id.to_string());
        }

        Ok(collection.clone())
    }

    pub fn remove_from_collection(&self, collection_id: &str, annotation_id: &str) -> Result<AnnotationCollection, String> {
        let mut collections = self.collections.write().unwrap();
        let collection = collections.get_mut(collection_id)
            .ok_or_else(|| "Collection not found".to_string())?;

        collection.annotations.retain(|id| id != annotation_id);

        Ok(collection.clone())
    }

    pub fn delete_collection(&self, collection_id: &str) -> Result<(), String> {
        self.collections.write().unwrap()
            .remove(collection_id)
            .ok_or_else(|| "Collection not found".to_string())?;
        Ok(())
    }

    // ==================== Search ====================

    pub fn search(&self, search: AnnotationSearch) -> Vec<PageAnnotation> {
        let annotations = self.annotations.read().unwrap();
        let query_lower = search.query.to_lowercase();

        let mut results: Vec<PageAnnotation> = annotations.values()
            .filter(|a| {
                // Text search
                let text_match = a.content.text.as_ref()
                    .map(|t| t.to_lowercase().contains(&query_lower))
                    .unwrap_or(false) ||
                    a.content.note.as_ref()
                    .map(|n| n.to_lowercase().contains(&query_lower))
                    .unwrap_or(false) ||
                    a.page_title.to_lowercase().contains(&query_lower);

                // URL filter
                let url_match = search.url_filter.as_ref()
                    .map(|f| a.url.contains(f))
                    .unwrap_or(true);

                // Type filter
                let type_match = search.type_filter.as_ref()
                    .map(|types| types.contains(&a.annotation_type))
                    .unwrap_or(true);

                // Tag filter
                let tag_match = search.tag_filter.as_ref()
                    .map(|tags| tags.iter().any(|t| a.tags.contains(t)))
                    .unwrap_or(true);

                // Date filter
                let date_match = {
                    let after = search.date_from
                        .map(|d| a.created_at >= d)
                        .unwrap_or(true);
                    let before = search.date_to
                        .map(|d| a.created_at <= d)
                        .unwrap_or(true);
                    after && before
                };

                text_match && url_match && type_match && tag_match && date_match
            })
            .cloned()
            .collect();

        // Sort
        match search.sort_by {
            SortBy::DateCreated => results.sort_by(|a, b| b.created_at.cmp(&a.created_at)),
            SortBy::DateUpdated => results.sort_by(|a, b| b.updated_at.cmp(&a.updated_at)),
            SortBy::Url => results.sort_by(|a, b| a.url.cmp(&b.url)),
            SortBy::Type => results.sort_by(|a, b| format!("{:?}", a.annotation_type).cmp(&format!("{:?}", b.annotation_type))),
            SortBy::Relevance => {} // Already sorted by relevance (text match first)
        }

        // Limit
        if let Some(limit) = search.limit {
            results.truncate(limit as usize);
        }

        results
    }

    pub fn get_annotations_by_tag(&self, tag: &str) -> Vec<PageAnnotation> {
        self.annotations.read().unwrap()
            .values()
            .filter(|a| a.tags.contains(&tag.to_string()))
            .cloned()
            .collect()
    }

    pub fn get_all_tags(&self) -> Vec<String> {
        let mut tags: Vec<String> = self.annotations.read().unwrap()
            .values()
            .flat_map(|a| a.tags.clone())
            .collect();
        
        tags.sort();
        tags.dedup();
        tags
    }

    // ==================== Export ====================

    pub fn export(&self, format: ExportFormat, annotation_ids: Option<Vec<String>>) -> AnnotationExport {
        let annotations = self.annotations.read().unwrap();
        let collections = self.collections.read().unwrap();

        let export_annotations: Vec<PageAnnotation> = if let Some(ids) = annotation_ids {
            ids.iter()
                .filter_map(|id| annotations.get(id).cloned())
                .collect()
        } else {
            annotations.values().cloned().collect()
        };

        AnnotationExport {
            annotations: export_annotations,
            collections: collections.values().cloned().collect(),
            format,
            exported_at: Utc::now(),
        }
    }

    pub fn import(&self, export: AnnotationExport) -> (u32, u32) {
        let mut imported_annotations = 0u32;
        let mut imported_collections = 0u32;

        for annotation in export.annotations {
            let id = Uuid::new_v4().to_string();
            let url = annotation.url.clone();

            let mut new_annotation = annotation;
            new_annotation.id = id.clone();
            new_annotation.synced = false;

            self.annotations.write().unwrap().insert(id.clone(), new_annotation);
            self.by_url.write().unwrap()
                .entry(url)
                .or_insert_with(Vec::new)
                .push(id);

            imported_annotations += 1;
        }

        for collection in export.collections {
            let id = Uuid::new_v4().to_string();
            let mut new_collection = collection;
            new_collection.id = id.clone();

            self.collections.write().unwrap().insert(id, new_collection);
            imported_collections += 1;
        }

        (imported_annotations, imported_collections)
    }

    // ==================== Stats ====================

    pub fn get_stats(&self) -> AnnotationStats {
        let annotations = self.annotations.read().unwrap();
        let collections = self.collections.read().unwrap();

        let mut by_type: HashMap<String, u32> = HashMap::new();
        let mut by_domain: HashMap<String, u32> = HashMap::new();
        let mut page_counts: HashMap<String, u32> = HashMap::new();
        let mut highlights = 0u64;
        let mut notes = 0u64;
        let mut drawings = 0u64;

        let week_ago = Utc::now() - chrono::Duration::days(7);
        let mut this_week = 0u32;

        for annotation in annotations.values() {
            // Count by type
            let type_key = format!("{:?}", annotation.annotation_type);
            *by_type.entry(type_key).or_insert(0) += 1;

            // Count by domain
            if let Some(domain) = annotation.url.split("://").nth(1).and_then(|s| s.split('/').next()) {
                *by_domain.entry(domain.to_string()).or_insert(0) += 1;
            }

            // Count by page
            *page_counts.entry(annotation.url.clone()).or_insert(0) += 1;

            // Count specific types
            match annotation.annotation_type {
                AnnotationType::Highlight => highlights += 1,
                AnnotationType::Note => notes += 1,
                AnnotationType::Drawing => drawings += 1,
                _ => {}
            }

            // Count this week
            if annotation.created_at > week_ago {
                this_week += 1;
            }
        }

        let mut most_annotated: Vec<(String, u32)> = page_counts.into_iter().collect();
        most_annotated.sort_by(|a, b| b.1.cmp(&a.1));
        most_annotated.truncate(10);

        AnnotationStats {
            total_annotations: annotations.len() as u64,
            annotations_by_type: by_type,
            annotations_by_domain: by_domain,
            most_annotated_pages: most_annotated,
            total_highlights: highlights,
            total_notes: notes,
            total_drawings: drawings,
            total_collections: collections.len() as u32,
            annotations_this_week: this_week,
        }
    }
}

// ==================== Update Types ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnnotationUpdate {
    pub content: Option<AnnotationContent>,
    pub style: Option<AnnotationStyle>,
    pub tags: Option<Vec<String>>,
    pub is_private: Option<bool>,
    pub is_favorite: Option<bool>,
}

impl Default for BrowserWebAnnotationsService {
    fn default() -> Self {
        Self::new()
    }
}
