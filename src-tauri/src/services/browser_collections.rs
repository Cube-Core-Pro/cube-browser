// CUBE Nexum - Collections Service
// Edge Collections style - save and organize groups of tabs for later

use std::collections::HashMap;
use std::sync::RwLock;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// ==================== Types ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Collection {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub icon: CollectionIcon,
    pub color: String,
    pub items: Vec<CollectionItem>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub is_pinned: bool,
    pub is_archived: bool,
    pub is_shared: bool,
    pub share_url: Option<String>,
    pub share_password: Option<String>,
    pub tags: Vec<String>,
    pub folder_id: Option<String>,
    pub view_count: u32,
    pub export_count: u32,
    pub collaborators: Vec<Collaborator>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollectionItem {
    pub id: String,
    pub item_type: CollectionItemType,
    pub title: String,
    pub url: Option<String>,
    pub favicon_url: Option<String>,
    pub thumbnail_url: Option<String>,
    pub content: Option<String>,
    pub notes: Option<String>,
    pub tags: Vec<String>,
    pub color: Option<String>,
    pub position: u32,
    pub created_at: DateTime<Utc>,
    pub metadata: CollectionItemMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CollectionItemType {
    Tab,
    Link,
    Note,
    Image,
    Document,
    Code,
    Quote,
    Task,
    Separator,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollectionItemMetadata {
    pub site_name: Option<String>,
    pub author: Option<String>,
    pub published_date: Option<DateTime<Utc>>,
    pub reading_time_minutes: Option<u32>,
    pub word_count: Option<u32>,
    pub language: Option<String>,
    pub excerpt: Option<String>,
    pub og_image: Option<String>,
    pub og_title: Option<String>,
    pub og_description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CollectionIcon {
    Default,
    Bookmark,
    Star,
    Heart,
    Folder,
    Document,
    Code,
    Image,
    Video,
    Music,
    Link,
    Calendar,
    Clock,
    Tag,
    Custom(String),
    Emoji(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollectionFolder {
    pub id: String,
    pub name: String,
    pub icon: CollectionIcon,
    pub color: String,
    pub parent_id: Option<String>,
    pub position: u32,
    pub collection_ids: Vec<String>,
    pub is_expanded: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Collaborator {
    pub id: String,
    pub name: String,
    pub email: String,
    pub avatar_url: Option<String>,
    pub role: CollaboratorRole,
    pub added_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CollaboratorRole {
    Owner,
    Editor,
    Viewer,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollectionSettings {
    pub default_view: CollectionView,
    pub sort_by: CollectionSort,
    pub sort_ascending: bool,
    pub show_thumbnails: bool,
    pub show_descriptions: bool,
    pub show_dates: bool,
    pub show_tags: bool,
    pub auto_save_tabs: bool,
    pub auto_extract_metadata: bool,
    pub default_sharing: SharingDefault,
    pub confirm_delete: bool,
    pub show_archived: bool,
    pub items_per_page: u32,
    pub thumbnail_size: ThumbnailSize,
    pub keyboard_shortcuts: CollectionShortcuts,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CollectionView {
    Grid,
    List,
    Compact,
    Board,
    Timeline,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CollectionSort {
    Manual,
    Title,
    DateAdded,
    DateModified,
    SiteName,
    ItemType,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SharingDefault {
    Private,
    LinkOnly,
    Public,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ThumbnailSize {
    Small,
    Medium,
    Large,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollectionShortcuts {
    pub new_collection: String,
    pub add_current_tab: String,
    pub add_all_tabs: String,
    pub open_collection: String,
    pub search: String,
    pub delete_item: String,
    pub edit_item: String,
    pub share: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollectionExport {
    pub collection: Collection,
    pub format: ExportFormat,
    pub data: String,
    pub exported_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ExportFormat {
    Json,
    Html,
    Markdown,
    Csv,
    Bookmarks,    // Browser bookmarks format
    OneTab,       // OneTab compatible
    Raindrop,     // Raindrop.io format
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollectionImport {
    pub source: ImportSource,
    pub data: String,
    pub items_found: u32,
    pub items_imported: u32,
    pub errors: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ImportSource {
    Json,
    Html,
    Csv,
    Bookmarks,
    OneTab,
    Raindrop,
    Pocket,
    Instapaper,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollectionSearchResult {
    pub collection_id: String,
    pub collection_name: String,
    pub item: CollectionItem,
    pub match_score: f32,
    pub matched_fields: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollectionStats {
    pub total_collections: u32,
    pub total_items: u32,
    pub total_folders: u32,
    pub items_by_type: HashMap<String, u32>,
    pub collections_by_tag: HashMap<String, u32>,
    pub shared_collections: u32,
    pub archived_collections: u32,
    pub total_views: u32,
    pub total_exports: u32,
    pub avg_items_per_collection: f32,
    pub most_used_tags: Vec<(String, u32)>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuickSaveResult {
    pub collection_id: String,
    pub items_added: u32,
    pub message: String,
}

// ==================== Service Implementation ====================

pub struct BrowserCollectionsService {
    collections: RwLock<HashMap<String, Collection>>,
    folders: RwLock<HashMap<String, CollectionFolder>>,
    settings: RwLock<CollectionSettings>,
    recent_collection_id: RwLock<Option<String>>,
}

impl BrowserCollectionsService {
    pub fn new() -> Self {
        Self {
            collections: RwLock::new(HashMap::new()),
            folders: RwLock::new(HashMap::new()),
            settings: RwLock::new(Self::default_settings()),
            recent_collection_id: RwLock::new(None),
        }
    }

    fn default_settings() -> CollectionSettings {
        CollectionSettings {
            default_view: CollectionView::Grid,
            sort_by: CollectionSort::DateModified,
            sort_ascending: false,
            show_thumbnails: true,
            show_descriptions: true,
            show_dates: true,
            show_tags: true,
            auto_save_tabs: false,
            auto_extract_metadata: true,
            default_sharing: SharingDefault::Private,
            confirm_delete: true,
            show_archived: false,
            items_per_page: 50,
            thumbnail_size: ThumbnailSize::Medium,
            keyboard_shortcuts: CollectionShortcuts {
                new_collection: "Ctrl+Shift+N".to_string(),
                add_current_tab: "Ctrl+D".to_string(),
                add_all_tabs: "Ctrl+Shift+D".to_string(),
                open_collection: "Ctrl+Shift+O".to_string(),
                search: "Ctrl+F".to_string(),
                delete_item: "Delete".to_string(),
                edit_item: "E".to_string(),
                share: "Ctrl+Shift+S".to_string(),
            },
        }
    }

    // ==================== Settings ====================

    pub fn get_settings(&self) -> CollectionSettings {
        self.settings.read().unwrap().clone()
    }

    pub fn update_settings(&self, new_settings: CollectionSettings) {
        let mut settings = self.settings.write().unwrap();
        *settings = new_settings;
    }

    // ==================== Collection CRUD ====================

    pub fn create_collection(&self, name: String, description: Option<String>) -> Collection {
        let now = Utc::now();
        let collection = Collection {
            id: Uuid::new_v4().to_string(),
            name,
            description,
            icon: CollectionIcon::Default,
            color: "#8b5cf6".to_string(),
            items: Vec::new(),
            created_at: now,
            updated_at: now,
            is_pinned: false,
            is_archived: false,
            is_shared: false,
            share_url: None,
            share_password: None,
            tags: Vec::new(),
            folder_id: None,
            view_count: 0,
            export_count: 0,
            collaborators: Vec::new(),
        };

        let id = collection.id.clone();
        self.collections.write().unwrap().insert(id.clone(), collection.clone());
        *self.recent_collection_id.write().unwrap() = Some(id);

        collection
    }

    pub fn get_collection(&self, collection_id: &str) -> Option<Collection> {
        let mut collections = self.collections.write().unwrap();
        if let Some(collection) = collections.get_mut(collection_id) {
            collection.view_count += 1;
            Some(collection.clone())
        } else {
            None
        }
    }

    pub fn get_all_collections(&self) -> Vec<Collection> {
        let settings = self.settings.read().unwrap();
        let collections = self.collections.read().unwrap();
        
        let mut result: Vec<Collection> = collections.values()
            .filter(|c| settings.show_archived || !c.is_archived)
            .cloned()
            .collect();

        // Sort
        match settings.sort_by {
            CollectionSort::Title => result.sort_by(|a, b| {
                if settings.sort_ascending {
                    a.name.cmp(&b.name)
                } else {
                    b.name.cmp(&a.name)
                }
            }),
            CollectionSort::DateAdded => result.sort_by(|a, b| {
                if settings.sort_ascending {
                    a.created_at.cmp(&b.created_at)
                } else {
                    b.created_at.cmp(&a.created_at)
                }
            }),
            CollectionSort::DateModified => result.sort_by(|a, b| {
                if settings.sort_ascending {
                    a.updated_at.cmp(&b.updated_at)
                } else {
                    b.updated_at.cmp(&a.updated_at)
                }
            }),
            _ => {}
        }

        // Pinned first
        result.sort_by(|a, b| b.is_pinned.cmp(&a.is_pinned));

        result
    }

    pub fn get_recent_collection(&self) -> Option<Collection> {
        let recent_id = self.recent_collection_id.read().unwrap();
        recent_id.as_ref().and_then(|id| self.get_collection(id))
    }

    pub fn update_collection(&self, collection_id: &str, updates: CollectionUpdate) -> Result<Collection, String> {
        let mut collections = self.collections.write().unwrap();
        let collection = collections.get_mut(collection_id)
            .ok_or_else(|| "Collection not found".to_string())?;

        if let Some(name) = updates.name {
            collection.name = name;
        }
        if let Some(description) = updates.description {
            collection.description = Some(description);
        }
        if let Some(icon) = updates.icon {
            collection.icon = icon;
        }
        if let Some(color) = updates.color {
            collection.color = color;
        }
        if let Some(tags) = updates.tags {
            collection.tags = tags;
        }
        if let Some(is_pinned) = updates.is_pinned {
            collection.is_pinned = is_pinned;
        }
        if let Some(is_archived) = updates.is_archived {
            collection.is_archived = is_archived;
        }
        if let Some(folder_id) = updates.folder_id {
            collection.folder_id = Some(folder_id);
        }

        collection.updated_at = Utc::now();

        Ok(collection.clone())
    }

    pub fn delete_collection(&self, collection_id: &str) -> Result<(), String> {
        self.collections.write().unwrap()
            .remove(collection_id)
            .ok_or_else(|| "Collection not found".to_string())?;
        Ok(())
    }

    pub fn duplicate_collection(&self, collection_id: &str) -> Result<Collection, String> {
        let original = self.get_collection(collection_id)
            .ok_or_else(|| "Collection not found".to_string())?;

        let mut new_collection = original.clone();
        new_collection.id = Uuid::new_v4().to_string();
        new_collection.name = format!("{} (Copy)", original.name);
        new_collection.created_at = Utc::now();
        new_collection.updated_at = Utc::now();
        new_collection.is_shared = false;
        new_collection.share_url = None;
        new_collection.view_count = 0;
        new_collection.export_count = 0;

        // Update item IDs
        for item in &mut new_collection.items {
            item.id = Uuid::new_v4().to_string();
        }

        let id = new_collection.id.clone();
        self.collections.write().unwrap().insert(id, new_collection.clone());

        Ok(new_collection)
    }

    // ==================== Items ====================

    pub fn add_item(&self, collection_id: &str, item_type: CollectionItemType, title: String, url: Option<String>) -> Result<CollectionItem, String> {
        let mut collections = self.collections.write().unwrap();
        let collection = collections.get_mut(collection_id)
            .ok_or_else(|| "Collection not found".to_string())?;

        let position = collection.items.len() as u32;
        let now = Utc::now();

        let item = CollectionItem {
            id: Uuid::new_v4().to_string(),
            item_type,
            title,
            url: url.clone(),
            favicon_url: url.as_ref().and_then(|u| self.extract_favicon_url(u)),
            thumbnail_url: None,
            content: None,
            notes: None,
            tags: Vec::new(),
            color: None,
            position,
            created_at: now,
            metadata: CollectionItemMetadata {
                site_name: None,
                author: None,
                published_date: None,
                reading_time_minutes: None,
                word_count: None,
                language: None,
                excerpt: None,
                og_image: None,
                og_title: None,
                og_description: None,
            },
        };

        collection.items.push(item.clone());
        collection.updated_at = now;

        Ok(item)
    }

    fn extract_favicon_url(&self, url: &str) -> Option<String> {
        if let Ok(parsed) = url::Url::parse(url) {
            if let Some(host) = parsed.host_str() {
                return Some(format!("https://www.google.com/s2/favicons?domain={}&sz=32", host));
            }
        }
        None
    }

    pub fn add_multiple_items(&self, collection_id: &str, items: Vec<(CollectionItemType, String, Option<String>)>) -> Result<Vec<CollectionItem>, String> {
        let mut result = Vec::new();
        for (item_type, title, url) in items {
            let item = self.add_item(collection_id, item_type, title, url)?;
            result.push(item);
        }
        Ok(result)
    }

    pub fn update_item(&self, collection_id: &str, item_id: &str, updates: CollectionItemUpdate) -> Result<CollectionItem, String> {
        let mut collections = self.collections.write().unwrap();
        let collection = collections.get_mut(collection_id)
            .ok_or_else(|| "Collection not found".to_string())?;

        let item = collection.items.iter_mut()
            .find(|i| i.id == item_id)
            .ok_or_else(|| "Item not found".to_string())?;

        if let Some(title) = updates.title {
            item.title = title;
        }
        if let Some(url) = updates.url {
            item.url = Some(url);
        }
        if let Some(content) = updates.content {
            item.content = Some(content);
        }
        if let Some(notes) = updates.notes {
            item.notes = Some(notes);
        }
        if let Some(tags) = updates.tags {
            item.tags = tags;
        }
        if let Some(color) = updates.color {
            item.color = Some(color);
        }
        if let Some(thumbnail_url) = updates.thumbnail_url {
            item.thumbnail_url = Some(thumbnail_url);
        }

        collection.updated_at = Utc::now();

        Ok(item.clone())
    }

    pub fn delete_item(&self, collection_id: &str, item_id: &str) -> Result<(), String> {
        let mut collections = self.collections.write().unwrap();
        let collection = collections.get_mut(collection_id)
            .ok_or_else(|| "Collection not found".to_string())?;

        let initial_len = collection.items.len();
        collection.items.retain(|i| i.id != item_id);

        if collection.items.len() == initial_len {
            return Err("Item not found".to_string());
        }

        // Reorder positions
        for (i, item) in collection.items.iter_mut().enumerate() {
            item.position = i as u32;
        }

        collection.updated_at = Utc::now();

        Ok(())
    }

    pub fn move_item(&self, collection_id: &str, item_id: &str, new_position: u32) -> Result<(), String> {
        let mut collections = self.collections.write().unwrap();
        let collection = collections.get_mut(collection_id)
            .ok_or_else(|| "Collection not found".to_string())?;

        let current_pos = collection.items.iter()
            .position(|i| i.id == item_id)
            .ok_or_else(|| "Item not found".to_string())?;

        let item = collection.items.remove(current_pos);
        let new_pos = (new_position as usize).min(collection.items.len());
        collection.items.insert(new_pos, item);

        // Reorder positions
        for (i, item) in collection.items.iter_mut().enumerate() {
            item.position = i as u32;
        }

        collection.updated_at = Utc::now();

        Ok(())
    }

    pub fn move_item_to_collection(&self, source_id: &str, item_id: &str, target_id: &str) -> Result<CollectionItem, String> {
        let item = {
            let mut collections = self.collections.write().unwrap();
            let source = collections.get_mut(source_id)
                .ok_or_else(|| "Source collection not found".to_string())?;

            let pos = source.items.iter()
                .position(|i| i.id == item_id)
                .ok_or_else(|| "Item not found".to_string())?;

            let item = source.items.remove(pos);
            source.updated_at = Utc::now();
            item
        };

        let mut collections = self.collections.write().unwrap();
        let target = collections.get_mut(target_id)
            .ok_or_else(|| "Target collection not found".to_string())?;

        let mut moved_item = item.clone();
        moved_item.position = target.items.len() as u32;
        target.items.push(moved_item.clone());
        target.updated_at = Utc::now();

        Ok(moved_item)
    }

    // ==================== Quick Save ====================

    pub fn quick_save_tab(&self, title: String, url: String) -> Result<QuickSaveResult, String> {
        let collection_id = {
            let recent = self.recent_collection_id.read().unwrap();
            recent.clone().unwrap_or_else(|| {
                drop(recent);
                let new_collection = self.create_collection("Quick Saves".to_string(), Some("Quickly saved tabs".to_string()));
                new_collection.id
            })
        };

        self.add_item(&collection_id, CollectionItemType::Tab, title, Some(url))?;

        Ok(QuickSaveResult {
            collection_id: collection_id.clone(),
            items_added: 1,
            message: "Tab saved successfully".to_string(),
        })
    }

    pub fn quick_save_all_tabs(&self, tabs: Vec<(String, String)>) -> Result<QuickSaveResult, String> {
        let now = Utc::now();
        let collection_name = format!("Tabs - {}", now.format("%Y-%m-%d %H:%M"));
        let collection = self.create_collection(collection_name, Some("All open tabs".to_string()));

        let items: Vec<_> = tabs.into_iter()
            .map(|(title, url)| (CollectionItemType::Tab, title, Some(url)))
            .collect();

        let count = items.len() as u32;
        self.add_multiple_items(&collection.id, items)?;

        Ok(QuickSaveResult {
            collection_id: collection.id,
            items_added: count,
            message: format!("Saved {} tabs", count),
        })
    }

    // ==================== Folders ====================

    pub fn create_folder(&self, name: String, parent_id: Option<String>) -> CollectionFolder {
        let folders = self.folders.read().unwrap();
        let position = folders.len() as u32;
        drop(folders);

        let folder = CollectionFolder {
            id: Uuid::new_v4().to_string(),
            name,
            icon: CollectionIcon::Folder,
            color: "#6366f1".to_string(),
            parent_id,
            position,
            collection_ids: Vec::new(),
            is_expanded: true,
            created_at: Utc::now(),
        };

        let id = folder.id.clone();
        self.folders.write().unwrap().insert(id, folder.clone());

        folder
    }

    pub fn get_all_folders(&self) -> Vec<CollectionFolder> {
        self.folders.read().unwrap().values().cloned().collect()
    }

    pub fn update_folder(&self, folder_id: &str, name: Option<String>, icon: Option<CollectionIcon>, color: Option<String>) -> Result<CollectionFolder, String> {
        let mut folders = self.folders.write().unwrap();
        let folder = folders.get_mut(folder_id)
            .ok_or_else(|| "Folder not found".to_string())?;

        if let Some(n) = name {
            folder.name = n;
        }
        if let Some(i) = icon {
            folder.icon = i;
        }
        if let Some(c) = color {
            folder.color = c;
        }

        Ok(folder.clone())
    }

    pub fn delete_folder(&self, folder_id: &str, move_collections_to_root: bool) -> Result<(), String> {
        if move_collections_to_root {
            let collection_ids = {
                let folders = self.folders.read().unwrap();
                folders.get(folder_id)
                    .map(|f| f.collection_ids.clone())
                    .unwrap_or_default()
            };

            let mut collections = self.collections.write().unwrap();
            for id in collection_ids {
                if let Some(collection) = collections.get_mut(&id) {
                    collection.folder_id = None;
                }
            }
        }

        self.folders.write().unwrap()
            .remove(folder_id)
            .ok_or_else(|| "Folder not found".to_string())?;

        Ok(())
    }

    pub fn add_collection_to_folder(&self, collection_id: &str, folder_id: &str) -> Result<(), String> {
        let mut folders = self.folders.write().unwrap();
        let folder = folders.get_mut(folder_id)
            .ok_or_else(|| "Folder not found".to_string())?;

        if !folder.collection_ids.contains(&collection_id.to_string()) {
            folder.collection_ids.push(collection_id.to_string());
        }

        drop(folders);

        let mut collections = self.collections.write().unwrap();
        if let Some(collection) = collections.get_mut(collection_id) {
            collection.folder_id = Some(folder_id.to_string());
        }

        Ok(())
    }

    // ==================== Search ====================

    pub fn search(&self, query: &str) -> Vec<CollectionSearchResult> {
        let query_lower = query.to_lowercase();
        let collections = self.collections.read().unwrap();
        let mut results = Vec::new();

        for collection in collections.values() {
            for item in &collection.items {
                let mut score = 0.0f32;
                let mut matched_fields = Vec::new();

                // Title match
                if item.title.to_lowercase().contains(&query_lower) {
                    score += 3.0;
                    matched_fields.push("title".to_string());
                }

                // URL match
                if let Some(url) = &item.url {
                    if url.to_lowercase().contains(&query_lower) {
                        score += 2.0;
                        matched_fields.push("url".to_string());
                    }
                }

                // Notes match
                if let Some(notes) = &item.notes {
                    if notes.to_lowercase().contains(&query_lower) {
                        score += 1.5;
                        matched_fields.push("notes".to_string());
                    }
                }

                // Tags match
                for tag in &item.tags {
                    if tag.to_lowercase().contains(&query_lower) {
                        score += 1.0;
                        matched_fields.push("tags".to_string());
                        break;
                    }
                }

                // Content match
                if let Some(content) = &item.content {
                    if content.to_lowercase().contains(&query_lower) {
                        score += 0.5;
                        matched_fields.push("content".to_string());
                    }
                }

                if score > 0.0 {
                    results.push(CollectionSearchResult {
                        collection_id: collection.id.clone(),
                        collection_name: collection.name.clone(),
                        item: item.clone(),
                        match_score: score,
                        matched_fields,
                    });
                }
            }
        }

        results.sort_by(|a, b| b.match_score.partial_cmp(&a.match_score).unwrap());
        results
    }

    pub fn search_by_tag(&self, tag: &str) -> Vec<CollectionSearchResult> {
        let tag_lower = tag.to_lowercase();
        let collections = self.collections.read().unwrap();
        let mut results = Vec::new();

        for collection in collections.values() {
            for item in &collection.items {
                if item.tags.iter().any(|t| t.to_lowercase() == tag_lower) {
                    results.push(CollectionSearchResult {
                        collection_id: collection.id.clone(),
                        collection_name: collection.name.clone(),
                        item: item.clone(),
                        match_score: 1.0,
                        matched_fields: vec!["tags".to_string()],
                    });
                }
            }
        }

        results
    }

    // ==================== Export/Import ====================

    pub fn export_collection(&self, collection_id: &str, format: ExportFormat) -> Result<CollectionExport, String> {
        let mut collections = self.collections.write().unwrap();
        let collection = collections.get_mut(collection_id)
            .ok_or_else(|| "Collection not found".to_string())?;

        collection.export_count += 1;

        let data = match format {
            ExportFormat::Json => serde_json::to_string_pretty(collection)
                .map_err(|e| format!("JSON export failed: {}", e))?,
            ExportFormat::Markdown => self.export_to_markdown(collection),
            ExportFormat::Html => self.export_to_html(collection),
            ExportFormat::Csv => self.export_to_csv(collection),
            ExportFormat::Bookmarks => self.export_to_bookmarks(collection),
            ExportFormat::OneTab => self.export_to_onetab(collection),
            ExportFormat::Raindrop => self.export_to_raindrop(collection),
        };

        Ok(CollectionExport {
            collection: collection.clone(),
            format,
            data,
            exported_at: Utc::now(),
        })
    }

    fn export_to_markdown(&self, collection: &Collection) -> String {
        let mut md = format!("# {}\n\n", collection.name);
        
        if let Some(desc) = &collection.description {
            md.push_str(&format!("{}\n\n", desc));
        }

        for item in &collection.items {
            if let Some(url) = &item.url {
                md.push_str(&format!("- [{}]({})\n", item.title, url));
            } else {
                md.push_str(&format!("- {}\n", item.title));
            }
            if let Some(notes) = &item.notes {
                md.push_str(&format!("  > {}\n", notes));
            }
        }

        md
    }

    fn export_to_html(&self, collection: &Collection) -> String {
        let mut html = format!(
            "<!DOCTYPE html>\n<html>\n<head>\n<title>{}</title>\n</head>\n<body>\n<h1>{}</h1>\n",
            collection.name, collection.name
        );

        if let Some(desc) = &collection.description {
            html.push_str(&format!("<p>{}</p>\n", desc));
        }

        html.push_str("<ul>\n");
        for item in &collection.items {
            if let Some(url) = &item.url {
                html.push_str(&format!("<li><a href=\"{}\">{}</a></li>\n", url, item.title));
            } else {
                html.push_str(&format!("<li>{}</li>\n", item.title));
            }
        }
        html.push_str("</ul>\n</body>\n</html>");

        html
    }

    fn export_to_csv(&self, collection: &Collection) -> String {
        let mut csv = "Title,URL,Notes,Tags,Created\n".to_string();
        
        for item in &collection.items {
            let url = item.url.as_deref().unwrap_or("");
            let notes = item.notes.as_deref().unwrap_or("").replace(',', ";");
            let tags = item.tags.join(";");
            csv.push_str(&format!(
                "\"{}\",\"{}\",\"{}\",\"{}\",\"{}\"\n",
                item.title.replace('"', "\"\""),
                url,
                notes,
                tags,
                item.created_at.to_rfc3339()
            ));
        }

        csv
    }

    fn export_to_bookmarks(&self, collection: &Collection) -> String {
        let mut html = "<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<META HTTP-EQUIV=\"Content-Type\" CONTENT=\"text/html; charset=UTF-8\">\n<TITLE>Bookmarks</TITLE>\n<H1>Bookmarks</H1>\n<DL><p>\n".to_string();
        
        html.push_str(&format!("<DT><H3>{}</H3>\n<DL><p>\n", collection.name));
        
        for item in &collection.items {
            if let Some(url) = &item.url {
                html.push_str(&format!("<DT><A HREF=\"{}\">{}</A>\n", url, item.title));
            }
        }
        
        html.push_str("</DL><p>\n</DL><p>\n");
        html
    }

    fn export_to_onetab(&self, collection: &Collection) -> String {
        let mut output = String::new();
        for item in &collection.items {
            if let Some(url) = &item.url {
                output.push_str(&format!("{} | {}\n", url, item.title));
            }
        }
        output
    }

    fn export_to_raindrop(&self, collection: &Collection) -> String {
        serde_json::to_string_pretty(collection).unwrap_or_default()
    }

    pub fn import_collection(&self, source: ImportSource, data: &str) -> Result<CollectionImport, String> {
        match source {
            ImportSource::Json => self.import_from_json(data),
            ImportSource::OneTab => self.import_from_onetab(data),
            _ => Err("Import format not yet supported".to_string()),
        }
    }

    fn import_from_json(&self, data: &str) -> Result<CollectionImport, String> {
        let collection: Collection = serde_json::from_str(data)
            .map_err(|e| format!("JSON parse error: {}", e))?;

        let items_found = collection.items.len() as u32;
        
        // Create with new ID
        let mut new_collection = collection.clone();
        new_collection.id = Uuid::new_v4().to_string();
        new_collection.created_at = Utc::now();
        new_collection.updated_at = Utc::now();

        self.collections.write().unwrap().insert(new_collection.id.clone(), new_collection);

        Ok(CollectionImport {
            source: ImportSource::Json,
            data: data.to_string(),
            items_found,
            items_imported: items_found,
            errors: Vec::new(),
        })
    }

    fn import_from_onetab(&self, data: &str) -> Result<CollectionImport, String> {
        let collection = self.create_collection("Imported from OneTab".to_string(), None);
        let mut items_imported = 0;
        let mut errors = Vec::new();

        for line in data.lines() {
            let parts: Vec<&str> = line.split(" | ").collect();
            if parts.len() >= 2 {
                let url = parts[0].trim().to_string();
                let title = parts[1].trim().to_string();
                
                if let Err(e) = self.add_item(&collection.id, CollectionItemType::Tab, title, Some(url)) {
                    errors.push(e);
                } else {
                    items_imported += 1;
                }
            }
        }

        Ok(CollectionImport {
            source: ImportSource::OneTab,
            data: data.to_string(),
            items_found: data.lines().count() as u32,
            items_imported,
            errors,
        })
    }

    // ==================== Sharing ====================

    pub fn share_collection(&self, collection_id: &str, password: Option<String>) -> Result<String, String> {
        let mut collections = self.collections.write().unwrap();
        let collection = collections.get_mut(collection_id)
            .ok_or_else(|| "Collection not found".to_string())?;

        let share_id = Uuid::new_v4().to_string()[..8].to_string();
        let share_url = format!("https://cube.nexum/collections/share/{}", share_id);

        collection.is_shared = true;
        collection.share_url = Some(share_url.clone());
        collection.share_password = password;
        collection.updated_at = Utc::now();

        Ok(share_url)
    }

    pub fn unshare_collection(&self, collection_id: &str) -> Result<(), String> {
        let mut collections = self.collections.write().unwrap();
        let collection = collections.get_mut(collection_id)
            .ok_or_else(|| "Collection not found".to_string())?;

        collection.is_shared = false;
        collection.share_url = None;
        collection.share_password = None;
        collection.updated_at = Utc::now();

        Ok(())
    }

    // ==================== Statistics ====================

    pub fn get_stats(&self) -> CollectionStats {
        let collections = self.collections.read().unwrap();
        let folders = self.folders.read().unwrap();

        let total_collections = collections.len() as u32;
        let total_folders = folders.len() as u32;
        let total_items: u32 = collections.values().map(|c| c.items.len() as u32).sum();

        let mut items_by_type: HashMap<String, u32> = HashMap::new();
        let mut collections_by_tag: HashMap<String, u32> = HashMap::new();
        let mut all_tags: HashMap<String, u32> = HashMap::new();

        let mut shared = 0u32;
        let mut archived = 0u32;
        let mut total_views = 0u32;
        let mut total_exports = 0u32;

        for collection in collections.values() {
            if collection.is_shared { shared += 1; }
            if collection.is_archived { archived += 1; }
            total_views += collection.view_count;
            total_exports += collection.export_count;

            for tag in &collection.tags {
                *collections_by_tag.entry(tag.clone()).or_insert(0) += 1;
            }

            for item in &collection.items {
                let type_key = format!("{:?}", item.item_type);
                *items_by_type.entry(type_key).or_insert(0) += 1;

                for tag in &item.tags {
                    *all_tags.entry(tag.clone()).or_insert(0) += 1;
                }
            }
        }

        let avg_items = if total_collections > 0 {
            total_items as f32 / total_collections as f32
        } else {
            0.0
        };

        let mut most_used_tags: Vec<_> = all_tags.into_iter().collect();
        most_used_tags.sort_by(|a, b| b.1.cmp(&a.1));
        most_used_tags.truncate(10);

        CollectionStats {
            total_collections,
            total_items,
            total_folders,
            items_by_type,
            collections_by_tag,
            shared_collections: shared,
            archived_collections: archived,
            total_views,
            total_exports,
            avg_items_per_collection: avg_items,
            most_used_tags,
        }
    }
}

// ==================== Update Types ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollectionUpdate {
    pub name: Option<String>,
    pub description: Option<String>,
    pub icon: Option<CollectionIcon>,
    pub color: Option<String>,
    pub tags: Option<Vec<String>>,
    pub is_pinned: Option<bool>,
    pub is_archived: Option<bool>,
    pub folder_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollectionItemUpdate {
    pub title: Option<String>,
    pub url: Option<String>,
    pub content: Option<String>,
    pub notes: Option<String>,
    pub tags: Option<Vec<String>>,
    pub color: Option<String>,
    pub thumbnail_url: Option<String>,
}

impl Default for BrowserCollectionsService {
    fn default() -> Self {
        Self::new()
    }
}
