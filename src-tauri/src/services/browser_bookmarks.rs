// CUBE Nexum - Bookmarks Service
// Advanced bookmark management system superior to Chrome, Firefox, Safari

use std::collections::{HashMap, HashSet};
use std::sync::Mutex;
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

// ==================== Types ====================

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum BookmarkType {
    Url,
    Folder,
    Separator,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum BookmarkSource {
    Manual,
    Import,
    Sync,
    Extension,
    ReadingList,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BookmarkSettings {
    pub sync_enabled: bool,
    pub auto_thumbnail: bool,
    pub track_visits: bool,
    pub show_favicons: bool,
    pub default_folder_id: String,
    pub sort_order: SortOrder,
    pub view_mode: ViewMode,
    pub show_tags_bar: bool,
    pub max_recent: u32,
    pub backup_enabled: bool,
    pub backup_interval_hours: u32,
}

impl Default for BookmarkSettings {
    fn default() -> Self {
        Self {
            sync_enabled: true,
            auto_thumbnail: true,
            track_visits: true,
            show_favicons: true,
            default_folder_id: "bookmarks_bar".to_string(),
            sort_order: SortOrder::Manual,
            view_mode: ViewMode::List,
            show_tags_bar: true,
            max_recent: 50,
            backup_enabled: true,
            backup_interval_hours: 24,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SortOrder {
    Manual,
    Alphabetical,
    DateAdded,
    DateModified,
    VisitCount,
    RecentlyUsed,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ViewMode {
    List,
    Grid,
    Compact,
    Cards,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bookmark {
    pub id: String,
    pub bookmark_type: BookmarkType,
    pub title: String,
    pub url: Option<String>,
    pub description: Option<String>,
    pub favicon: Option<String>,
    pub thumbnail: Option<String>,
    pub parent_id: Option<String>,
    pub position: u32,
    pub tags: Vec<String>,
    pub is_favorite: bool,
    pub is_pinned: bool,
    pub color: Option<String>,
    pub icon: Option<String>,
    pub source: BookmarkSource,
    pub visit_count: u64,
    pub last_visited: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub modified_at: DateTime<Utc>,
    pub synced_at: Option<DateTime<Utc>>,
    pub metadata: HashMap<String, String>,
}

impl Bookmark {
    pub fn new_folder(id: String, title: String, parent_id: Option<String>) -> Self {
        let now = Utc::now();
        Self {
            id,
            bookmark_type: BookmarkType::Folder,
            title,
            url: None,
            description: None,
            favicon: None,
            thumbnail: None,
            parent_id,
            position: 0,
            tags: Vec::new(),
            is_favorite: false,
            is_pinned: false,
            color: None,
            icon: Some("📁".to_string()),
            source: BookmarkSource::Manual,
            visit_count: 0,
            last_visited: None,
            created_at: now,
            modified_at: now,
            synced_at: None,
            metadata: HashMap::new(),
        }
    }

    pub fn new_bookmark(id: String, title: String, url: String, parent_id: Option<String>) -> Self {
        let now = Utc::now();
        Self {
            id,
            bookmark_type: BookmarkType::Url,
            title,
            url: Some(url),
            description: None,
            favicon: None,
            thumbnail: None,
            parent_id,
            position: 0,
            tags: Vec::new(),
            is_favorite: false,
            is_pinned: false,
            color: None,
            icon: None,
            source: BookmarkSource::Manual,
            visit_count: 0,
            last_visited: None,
            created_at: now,
            modified_at: now,
            synced_at: None,
            metadata: HashMap::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BookmarkFolder {
    pub bookmark: Bookmark,
    pub children: Vec<String>, // Child bookmark IDs
    pub is_expanded: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BookmarkTag {
    pub name: String,
    pub color: String,
    pub bookmark_count: u32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BookmarkStats {
    pub total_bookmarks: u64,
    pub total_folders: u64,
    pub total_tags: u64,
    pub most_visited: Vec<Bookmark>,
    pub recently_added: Vec<Bookmark>,
    pub favorites_count: u64,
    pub orphaned_count: u64,
    pub duplicate_count: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BookmarkFilter {
    pub query: Option<String>,
    pub folder_id: Option<String>,
    pub tags: Option<Vec<String>>,
    pub is_favorite: Option<bool>,
    pub bookmark_type: Option<BookmarkType>,
    pub source: Option<BookmarkSource>,
    pub date_from: Option<DateTime<Utc>>,
    pub date_to: Option<DateTime<Utc>>,
    pub min_visits: Option<u64>,
    pub sort_by: SortOrder,
    pub limit: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportResult {
    pub imported_count: u32,
    pub folders_count: u32,
    pub duplicates_skipped: u32,
    pub errors: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BookmarkTreeNode {
    pub bookmark: Bookmark,
    pub children: Vec<BookmarkTreeNode>,
}

// ==================== Service ====================

pub struct BrowserBookmarksService {
    settings: Mutex<BookmarkSettings>,
    bookmarks: Mutex<HashMap<String, Bookmark>>,
    tags: Mutex<HashMap<String, BookmarkTag>>,
    folder_children: Mutex<HashMap<String, Vec<String>>>,
}

impl BrowserBookmarksService {
    pub fn new() -> Self {
        let service = Self {
            settings: Mutex::new(BookmarkSettings::default()),
            bookmarks: Mutex::new(HashMap::new()),
            tags: Mutex::new(HashMap::new()),
            folder_children: Mutex::new(HashMap::new()),
        };
        
        // Initialize default folders
        service.initialize_default_folders();
        
        service
    }

    fn initialize_default_folders(&self) {
        let mut bookmarks = self.bookmarks.lock().unwrap();
        let mut folder_children = self.folder_children.lock().unwrap();
        
        // Root folder
        let root = Bookmark::new_folder("root".to_string(), "Bookmarks".to_string(), None);
        bookmarks.insert("root".to_string(), root);
        folder_children.insert("root".to_string(), vec![
            "bookmarks_bar".to_string(),
            "other_bookmarks".to_string(),
            "mobile_bookmarks".to_string(),
        ]);
        
        // Bookmarks Bar
        let bar = Bookmark::new_folder("bookmarks_bar".to_string(), "Bookmarks Bar".to_string(), Some("root".to_string()));
        bookmarks.insert("bookmarks_bar".to_string(), bar);
        folder_children.insert("bookmarks_bar".to_string(), Vec::new());
        
        // Other Bookmarks
        let other = Bookmark::new_folder("other_bookmarks".to_string(), "Other Bookmarks".to_string(), Some("root".to_string()));
        bookmarks.insert("other_bookmarks".to_string(), other);
        folder_children.insert("other_bookmarks".to_string(), Vec::new());
        
        // Mobile Bookmarks (for sync)
        let mobile = Bookmark::new_folder("mobile_bookmarks".to_string(), "Mobile Bookmarks".to_string(), Some("root".to_string()));
        bookmarks.insert("mobile_bookmarks".to_string(), mobile);
        folder_children.insert("mobile_bookmarks".to_string(), Vec::new());
    }

    fn generate_id(&self) -> String {
        uuid::Uuid::new_v4().to_string()
    }

    // ==================== Settings ====================

    pub fn get_settings(&self) -> BookmarkSettings {
        self.settings.lock().unwrap().clone()
    }

    pub fn update_settings(&self, settings: BookmarkSettings) -> Result<(), String> {
        *self.settings.lock().unwrap() = settings;
        Ok(())
    }

    // ==================== CRUD Operations ====================

    pub fn create_bookmark(&self, title: String, url: String, parent_id: Option<String>) -> Result<Bookmark, String> {
        let id = self.generate_id();
        let parent = parent_id.unwrap_or_else(|| {
            self.settings.lock().unwrap().default_folder_id.clone()
        });
        
        // Validate parent exists and is a folder
        {
            let bookmarks = self.bookmarks.lock().unwrap();
            if let Some(parent_bookmark) = bookmarks.get(&parent) {
                if parent_bookmark.bookmark_type != BookmarkType::Folder {
                    return Err("Parent is not a folder".to_string());
                }
            } else {
                return Err("Parent folder not found".to_string());
            }
        }
        
        let mut bookmark = Bookmark::new_bookmark(id.clone(), title, url, Some(parent.clone()));
        
        // Set position
        let position = {
            let folder_children = self.folder_children.lock().unwrap();
            folder_children.get(&parent).map(|c| c.len() as u32).unwrap_or(0)
        };
        bookmark.position = position;
        
        // Add to bookmarks
        {
            let mut bookmarks = self.bookmarks.lock().unwrap();
            bookmarks.insert(id.clone(), bookmark.clone());
        }
        
        // Add to parent's children
        {
            let mut folder_children = self.folder_children.lock().unwrap();
            folder_children.entry(parent).or_insert_with(Vec::new).push(id);
        }
        
        Ok(bookmark)
    }

    pub fn create_folder(&self, title: String, parent_id: Option<String>) -> Result<Bookmark, String> {
        let id = self.generate_id();
        let parent = parent_id.unwrap_or_else(|| "bookmarks_bar".to_string());
        
        // Validate parent
        {
            let bookmarks = self.bookmarks.lock().unwrap();
            if let Some(parent_bookmark) = bookmarks.get(&parent) {
                if parent_bookmark.bookmark_type != BookmarkType::Folder {
                    return Err("Parent is not a folder".to_string());
                }
            } else {
                return Err("Parent folder not found".to_string());
            }
        }
        
        let mut folder = Bookmark::new_folder(id.clone(), title, Some(parent.clone()));
        
        // Set position
        let position = {
            let folder_children = self.folder_children.lock().unwrap();
            folder_children.get(&parent).map(|c| c.len() as u32).unwrap_or(0)
        };
        folder.position = position;
        
        // Add to bookmarks
        {
            let mut bookmarks = self.bookmarks.lock().unwrap();
            bookmarks.insert(id.clone(), folder.clone());
        }
        
        // Initialize folder's children list
        {
            let mut folder_children = self.folder_children.lock().unwrap();
            folder_children.insert(id.clone(), Vec::new());
            folder_children.entry(parent).or_insert_with(Vec::new).push(id);
        }
        
        Ok(folder)
    }

    pub fn get_bookmark(&self, id: &str) -> Option<Bookmark> {
        self.bookmarks.lock().unwrap().get(id).cloned()
    }

    pub fn update_bookmark(&self, id: &str, updates: Bookmark) -> Result<Bookmark, String> {
        let mut bookmarks = self.bookmarks.lock().unwrap();
        
        if let Some(bookmark) = bookmarks.get_mut(id) {
            bookmark.title = updates.title;
            bookmark.url = updates.url;
            bookmark.description = updates.description;
            bookmark.favicon = updates.favicon;
            bookmark.thumbnail = updates.thumbnail;
            bookmark.tags = updates.tags;
            bookmark.is_favorite = updates.is_favorite;
            bookmark.is_pinned = updates.is_pinned;
            bookmark.color = updates.color;
            bookmark.icon = updates.icon;
            bookmark.metadata = updates.metadata;
            bookmark.modified_at = Utc::now();
            
            Ok(bookmark.clone())
        } else {
            Err("Bookmark not found".to_string())
        }
    }

    pub fn delete_bookmark(&self, id: &str) -> Result<(), String> {
        // Don't allow deleting system folders
        if ["root", "bookmarks_bar", "other_bookmarks", "mobile_bookmarks"].contains(&id) {
            return Err("Cannot delete system folder".to_string());
        }
        
        // Get bookmark and its parent
        let (parent_id, is_folder) = {
            let bookmarks = self.bookmarks.lock().unwrap();
            if let Some(bookmark) = bookmarks.get(id) {
                (bookmark.parent_id.clone(), bookmark.bookmark_type == BookmarkType::Folder)
            } else {
                return Err("Bookmark not found".to_string());
            }
        };
        
        // If folder, recursively delete children
        if is_folder {
            let children: Vec<String> = {
                let folder_children = self.folder_children.lock().unwrap();
                folder_children.get(id).cloned().unwrap_or_default()
            };
            
            for child_id in children {
                let _ = self.delete_bookmark(&child_id);
            }
            
            // Remove from folder_children
            self.folder_children.lock().unwrap().remove(id);
        }
        
        // Remove from parent's children
        if let Some(parent) = parent_id {
            let mut folder_children = self.folder_children.lock().unwrap();
            if let Some(children) = folder_children.get_mut(&parent) {
                children.retain(|c| c != id);
            }
        }
        
        // Remove bookmark
        self.bookmarks.lock().unwrap().remove(id);
        
        Ok(())
    }

    // ==================== Movement & Organization ====================

    pub fn move_bookmark(&self, id: &str, new_parent_id: &str, position: Option<u32>) -> Result<(), String> {
        // Validate new parent is a folder
        {
            let bookmarks = self.bookmarks.lock().unwrap();
            if let Some(parent) = bookmarks.get(new_parent_id) {
                if parent.bookmark_type != BookmarkType::Folder {
                    return Err("Target is not a folder".to_string());
                }
            } else {
                return Err("Target folder not found".to_string());
            }
        }
        
        // Get old parent
        let old_parent = {
            let bookmarks = self.bookmarks.lock().unwrap();
            bookmarks.get(id).and_then(|b| b.parent_id.clone())
        };
        
        // Remove from old parent
        if let Some(old_parent_id) = old_parent {
            let mut folder_children = self.folder_children.lock().unwrap();
            if let Some(children) = folder_children.get_mut(&old_parent_id) {
                children.retain(|c| c != id);
            }
        }
        
        // Add to new parent
        {
            let mut folder_children = self.folder_children.lock().unwrap();
            let children = folder_children.entry(new_parent_id.to_string()).or_insert_with(Vec::new);
            
            let pos = position.unwrap_or(children.len() as u32) as usize;
            if pos >= children.len() {
                children.push(id.to_string());
            } else {
                children.insert(pos, id.to_string());
            }
        }
        
        // Update bookmark's parent
        {
            let mut bookmarks = self.bookmarks.lock().unwrap();
            if let Some(bookmark) = bookmarks.get_mut(id) {
                bookmark.parent_id = Some(new_parent_id.to_string());
                bookmark.position = position.unwrap_or(0);
                bookmark.modified_at = Utc::now();
            }
        }
        
        Ok(())
    }

    pub fn reorder_bookmark(&self, id: &str, new_position: u32) -> Result<(), String> {
        let parent_id = {
            let bookmarks = self.bookmarks.lock().unwrap();
            bookmarks.get(id).and_then(|b| b.parent_id.clone())
        };
        
        if let Some(parent) = parent_id {
            let mut folder_children = self.folder_children.lock().unwrap();
            if let Some(children) = folder_children.get_mut(&parent) {
                // Remove from current position
                children.retain(|c| c != id);
                
                // Insert at new position
                let pos = (new_position as usize).min(children.len());
                children.insert(pos, id.to_string());
            }
        }
        
        Ok(())
    }

    // ==================== Tags ====================

    pub fn add_tag(&self, bookmark_id: &str, tag_name: String) -> Result<(), String> {
        // Add tag to bookmark
        {
            let mut bookmarks = self.bookmarks.lock().unwrap();
            if let Some(bookmark) = bookmarks.get_mut(bookmark_id) {
                if !bookmark.tags.contains(&tag_name) {
                    bookmark.tags.push(tag_name.clone());
                    bookmark.modified_at = Utc::now();
                }
            } else {
                return Err("Bookmark not found".to_string());
            }
        }
        
        // Update or create tag
        {
            let mut tags = self.tags.lock().unwrap();
            tags.entry(tag_name.clone())
                .and_modify(|t| t.bookmark_count += 1)
                .or_insert_with(|| BookmarkTag {
                    name: tag_name,
                    color: "#6366f1".to_string(),
                    bookmark_count: 1,
                    created_at: Utc::now(),
                });
        }
        
        Ok(())
    }

    pub fn remove_tag(&self, bookmark_id: &str, tag_name: &str) -> Result<(), String> {
        // Remove from bookmark
        {
            let mut bookmarks = self.bookmarks.lock().unwrap();
            if let Some(bookmark) = bookmarks.get_mut(bookmark_id) {
                bookmark.tags.retain(|t| t != tag_name);
                bookmark.modified_at = Utc::now();
            }
        }
        
        // Update tag count
        {
            let mut tags = self.tags.lock().unwrap();
            if let Some(tag) = tags.get_mut(tag_name) {
                tag.bookmark_count = tag.bookmark_count.saturating_sub(1);
            }
        }
        
        Ok(())
    }

    pub fn get_all_tags(&self) -> Vec<BookmarkTag> {
        self.tags.lock().unwrap().values().cloned().collect()
    }

    pub fn get_bookmarks_by_tag(&self, tag_name: &str) -> Vec<Bookmark> {
        self.bookmarks.lock().unwrap()
            .values()
            .filter(|b| b.tags.contains(&tag_name.to_string()))
            .cloned()
            .collect()
    }

    // ==================== Favorites ====================

    pub fn toggle_favorite(&self, id: &str) -> Result<bool, String> {
        let mut bookmarks = self.bookmarks.lock().unwrap();
        if let Some(bookmark) = bookmarks.get_mut(id) {
            bookmark.is_favorite = !bookmark.is_favorite;
            bookmark.modified_at = Utc::now();
            Ok(bookmark.is_favorite)
        } else {
            Err("Bookmark not found".to_string())
        }
    }

    pub fn get_favorites(&self) -> Vec<Bookmark> {
        self.bookmarks.lock().unwrap()
            .values()
            .filter(|b| b.is_favorite)
            .cloned()
            .collect()
    }

    // ==================== Search & Filter ====================

    pub fn search(&self, query: &str) -> Vec<Bookmark> {
        let query_lower = query.to_lowercase();
        self.bookmarks.lock().unwrap()
            .values()
            .filter(|b| {
                b.title.to_lowercase().contains(&query_lower) ||
                b.url.as_ref().map(|u| u.to_lowercase().contains(&query_lower)).unwrap_or(false) ||
                b.description.as_ref().map(|d| d.to_lowercase().contains(&query_lower)).unwrap_or(false) ||
                b.tags.iter().any(|t| t.to_lowercase().contains(&query_lower))
            })
            .cloned()
            .collect()
    }

    pub fn filter(&self, filter: BookmarkFilter) -> Vec<Bookmark> {
        let mut results: Vec<Bookmark> = self.bookmarks.lock().unwrap()
            .values()
            .filter(|b| {
                // Query filter
                if let Some(ref query) = filter.query {
                    let query_lower = query.to_lowercase();
                    if !b.title.to_lowercase().contains(&query_lower) &&
                       !b.url.as_ref().map(|u| u.to_lowercase().contains(&query_lower)).unwrap_or(false) {
                        return false;
                    }
                }
                
                // Folder filter
                if let Some(ref folder_id) = filter.folder_id {
                    if b.parent_id.as_ref() != Some(folder_id) {
                        return false;
                    }
                }
                
                // Tags filter
                if let Some(ref tags) = filter.tags {
                    if !tags.iter().any(|t| b.tags.contains(t)) {
                        return false;
                    }
                }
                
                // Favorite filter
                if let Some(is_fav) = filter.is_favorite {
                    if b.is_favorite != is_fav {
                        return false;
                    }
                }
                
                // Type filter
                if let Some(ref btype) = filter.bookmark_type {
                    if b.bookmark_type != *btype {
                        return false;
                    }
                }
                
                // Date range
                if let Some(ref from) = filter.date_from {
                    if b.created_at < *from {
                        return false;
                    }
                }
                if let Some(ref to) = filter.date_to {
                    if b.created_at > *to {
                        return false;
                    }
                }
                
                // Min visits
                if let Some(min) = filter.min_visits {
                    if b.visit_count < min {
                        return false;
                    }
                }
                
                true
            })
            .cloned()
            .collect();
        
        // Sort
        match filter.sort_by {
            SortOrder::Alphabetical => results.sort_by(|a, b| a.title.cmp(&b.title)),
            SortOrder::DateAdded => results.sort_by(|a, b| b.created_at.cmp(&a.created_at)),
            SortOrder::DateModified => results.sort_by(|a, b| b.modified_at.cmp(&a.modified_at)),
            SortOrder::VisitCount => results.sort_by(|a, b| b.visit_count.cmp(&a.visit_count)),
            SortOrder::RecentlyUsed => results.sort_by(|a, b| b.last_visited.cmp(&a.last_visited)),
            SortOrder::Manual => results.sort_by(|a, b| a.position.cmp(&b.position)),
        }
        
        // Limit
        if let Some(limit) = filter.limit {
            results.truncate(limit as usize);
        }
        
        results
    }

    // ==================== Tree Operations ====================

    pub fn get_folder_contents(&self, folder_id: &str) -> Vec<Bookmark> {
        let children_ids = {
            let folder_children = self.folder_children.lock().unwrap();
            folder_children.get(folder_id).cloned().unwrap_or_default()
        };
        
        let bookmarks = self.bookmarks.lock().unwrap();
        children_ids.iter()
            .filter_map(|id| bookmarks.get(id).cloned())
            .collect()
    }

    pub fn get_bookmark_tree(&self, root_id: &str) -> Option<BookmarkTreeNode> {
        let bookmarks = self.bookmarks.lock().unwrap();
        let folder_children = self.folder_children.lock().unwrap();
        
        fn build_tree(
            id: &str,
            bookmarks: &HashMap<String, Bookmark>,
            folder_children: &HashMap<String, Vec<String>>
        ) -> Option<BookmarkTreeNode> {
            let bookmark = bookmarks.get(id)?;
            
            let children = if bookmark.bookmark_type == BookmarkType::Folder {
                folder_children.get(id)
                    .map(|children_ids| {
                        children_ids.iter()
                            .filter_map(|child_id| build_tree(child_id, bookmarks, folder_children))
                            .collect()
                    })
                    .unwrap_or_default()
            } else {
                Vec::new()
            };
            
            Some(BookmarkTreeNode {
                bookmark: bookmark.clone(),
                children,
            })
        }
        
        build_tree(root_id, &bookmarks, &folder_children)
    }

    pub fn get_all_folders(&self) -> Vec<Bookmark> {
        self.bookmarks.lock().unwrap()
            .values()
            .filter(|b| b.bookmark_type == BookmarkType::Folder)
            .cloned()
            .collect()
    }

    // ==================== Visit Tracking ====================

    pub fn record_visit(&self, id: &str) -> Result<(), String> {
        let mut bookmarks = self.bookmarks.lock().unwrap();
        if let Some(bookmark) = bookmarks.get_mut(id) {
            bookmark.visit_count += 1;
            bookmark.last_visited = Some(Utc::now());
            Ok(())
        } else {
            Err("Bookmark not found".to_string())
        }
    }

    pub fn get_most_visited(&self, limit: u32) -> Vec<Bookmark> {
        let mut results: Vec<Bookmark> = self.bookmarks.lock().unwrap()
            .values()
            .filter(|b| b.bookmark_type == BookmarkType::Url && b.visit_count > 0)
            .cloned()
            .collect();
        
        results.sort_by(|a, b| b.visit_count.cmp(&a.visit_count));
        results.truncate(limit as usize);
        results
    }

    pub fn get_recently_added(&self, limit: u32) -> Vec<Bookmark> {
        let mut results: Vec<Bookmark> = self.bookmarks.lock().unwrap()
            .values()
            .filter(|b| b.bookmark_type == BookmarkType::Url)
            .cloned()
            .collect();
        
        results.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        results.truncate(limit as usize);
        results
    }

    pub fn get_recently_used(&self, limit: u32) -> Vec<Bookmark> {
        let mut results: Vec<Bookmark> = self.bookmarks.lock().unwrap()
            .values()
            .filter(|b| b.bookmark_type == BookmarkType::Url && b.last_visited.is_some())
            .cloned()
            .collect();
        
        results.sort_by(|a, b| b.last_visited.cmp(&a.last_visited));
        results.truncate(limit as usize);
        results
    }

    // ==================== Statistics ====================

    pub fn get_stats(&self) -> BookmarkStats {
        let bookmarks = self.bookmarks.lock().unwrap();
        let tags = self.tags.lock().unwrap();
        
        let url_bookmarks: Vec<&Bookmark> = bookmarks.values()
            .filter(|b| b.bookmark_type == BookmarkType::Url)
            .collect();
        
        let folder_count = bookmarks.values()
            .filter(|b| b.bookmark_type == BookmarkType::Folder)
            .count() as u64;
        
        let favorites_count = bookmarks.values()
            .filter(|b| b.is_favorite)
            .count() as u64;
        
        let mut most_visited: Vec<Bookmark> = url_bookmarks.iter()
            .filter(|b| b.visit_count > 0)
            .map(|b| (*b).clone())
            .collect();
        most_visited.sort_by(|a, b| b.visit_count.cmp(&a.visit_count));
        most_visited.truncate(10);
        
        let mut recently_added: Vec<Bookmark> = url_bookmarks.iter()
            .map(|b| (*b).clone())
            .collect();
        recently_added.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        recently_added.truncate(10);
        
        BookmarkStats {
            total_bookmarks: url_bookmarks.len() as u64,
            total_folders: folder_count,
            total_tags: tags.len() as u64,
            most_visited,
            recently_added,
            favorites_count,
            orphaned_count: self.count_orphaned() as u64,
            duplicate_count: self.find_duplicates().len() as u64,
        }
    }

    // ==================== Import/Export ====================

    pub fn export_bookmarks(&self) -> Result<String, String> {
        let tree = self.get_bookmark_tree("root");
        serde_json::to_string_pretty(&tree)
            .map_err(|e| format!("Export failed: {}", e))
    }

    pub fn export_html(&self) -> Result<String, String> {
        let mut html = String::from("<!DOCTYPE NETSCAPE-Bookmark-file-1>\n");
        html.push_str("<META HTTP-EQUIV=\"Content-Type\" CONTENT=\"text/html; charset=UTF-8\">\n");
        html.push_str("<TITLE>Bookmarks</TITLE>\n");
        html.push_str("<H1>Bookmarks</H1>\n");
        html.push_str("<DL><p>\n");
        
        fn export_node(node: &BookmarkTreeNode, indent: usize) -> String {
            let mut html = String::new();
            let indent_str = "    ".repeat(indent);
            
            match node.bookmark.bookmark_type {
                BookmarkType::Folder => {
                    html.push_str(&format!("{}<DT><H3>{}</H3>\n", indent_str, node.bookmark.title));
                    html.push_str(&format!("{}<DL><p>\n", indent_str));
                    for child in &node.children {
                        html.push_str(&export_node(child, indent + 1));
                    }
                    html.push_str(&format!("{}</DL><p>\n", indent_str));
                }
                BookmarkType::Url => {
                    if let Some(ref url) = node.bookmark.url {
                        html.push_str(&format!(
                            "{}<DT><A HREF=\"{}\">{}</A>\n",
                            indent_str, url, node.bookmark.title
                        ));
                    }
                }
                BookmarkType::Separator => {
                    html.push_str(&format!("{}<HR>\n", indent_str));
                }
            }
            
            html
        }
        
        if let Some(tree) = self.get_bookmark_tree("root") {
            for child in &tree.children {
                html.push_str(&export_node(child, 1));
            }
        }
        
        html.push_str("</DL><p>\n");
        
        Ok(html)
    }

    pub fn import_json(&self, json: &str) -> Result<ImportResult, String> {
        let tree: BookmarkTreeNode = serde_json::from_str(json)
            .map_err(|e| format!("Invalid JSON: {}", e))?;
        
        let mut result = ImportResult {
            imported_count: 0,
            folders_count: 0,
            duplicates_skipped: 0,
            errors: Vec::new(),
        };
        
        fn import_node(
            service: &BrowserBookmarksService,
            node: &BookmarkTreeNode,
            parent_id: &str,
            result: &mut ImportResult
        ) {
            match node.bookmark.bookmark_type {
                BookmarkType::Folder => {
                    match service.create_folder(node.bookmark.title.clone(), Some(parent_id.to_string())) {
                        Ok(folder) => {
                            result.folders_count += 1;
                            for child in &node.children {
                                import_node(service, child, &folder.id, result);
                            }
                        }
                        Err(e) => result.errors.push(e),
                    }
                }
                BookmarkType::Url => {
                    if let Some(ref url) = node.bookmark.url {
                        match service.create_bookmark(
                            node.bookmark.title.clone(),
                            url.clone(),
                            Some(parent_id.to_string())
                        ) {
                            Ok(_) => result.imported_count += 1,
                            Err(e) => result.errors.push(e),
                        }
                    }
                }
                _ => {}
            }
        }
        
        // Import under bookmarks_bar by default
        for child in &tree.children {
            import_node(self, child, "bookmarks_bar", &mut result);
        }
        
        Ok(result)
    }

    // ==================== Utility ====================

    pub fn get_all_bookmarks(&self) -> Vec<Bookmark> {
        self.bookmarks.lock().unwrap().values().cloned().collect()
    }

    pub fn check_url_exists(&self, url: &str) -> Option<Bookmark> {
        self.bookmarks.lock().unwrap()
            .values()
            .find(|b| b.url.as_ref() == Some(&url.to_string()))
            .cloned()
    }

    pub fn find_duplicates(&self) -> Vec<(Bookmark, Bookmark)> {
        let bookmarks = self.bookmarks.lock().unwrap();
        let mut duplicates = Vec::new();
        let mut seen: HashMap<String, &Bookmark> = HashMap::new();
        
        for bookmark in bookmarks.values() {
            if let Some(ref url) = bookmark.url {
                if let Some(existing) = seen.get(url) {
                    duplicates.push(((*existing).clone(), bookmark.clone()));
                } else {
                    seen.insert(url.clone(), bookmark);
                }
            }
        }
        
        duplicates
    }

    pub fn cleanup_orphaned(&self) -> u32 {
        let mut bookmarks = self.bookmarks.lock().unwrap();
        let folder_ids: HashSet<String> = bookmarks
            .values()
            .filter(|b| b.bookmark_type == BookmarkType::Folder)
            .map(|b| b.id.clone())
            .collect();
        
        // Add default folder IDs
        let mut valid_parents: HashSet<String> = folder_ids;
        valid_parents.insert("root".to_string());
        valid_parents.insert("bookmarks_bar".to_string());
        valid_parents.insert("other_bookmarks".to_string());
        valid_parents.insert("mobile_bookmarks".to_string());
        
        let orphaned_ids: Vec<String> = bookmarks
            .values()
            .filter(|b| {
                if let Some(ref parent_id) = b.parent_id {
                    !valid_parents.contains(parent_id) && b.id != "root"
                } else {
                    false
                }
            })
            .map(|b| b.id.clone())
            .collect();
        
        let count = orphaned_ids.len() as u32;
        for id in orphaned_ids {
            bookmarks.remove(&id);
        }
        
        count
    }

    fn count_orphaned(&self) -> usize {
        let bookmarks = self.bookmarks.lock().unwrap();
        let folder_ids: HashSet<String> = bookmarks
            .values()
            .filter(|b| b.bookmark_type == BookmarkType::Folder)
            .map(|b| b.id.clone())
            .collect();
        
        let mut valid_parents: HashSet<String> = folder_ids;
        valid_parents.insert("root".to_string());
        valid_parents.insert("bookmarks_bar".to_string());
        valid_parents.insert("other_bookmarks".to_string());
        valid_parents.insert("mobile_bookmarks".to_string());
        
        bookmarks
            .values()
            .filter(|b| {
                if let Some(ref parent_id) = b.parent_id {
                    !valid_parents.contains(parent_id) && b.id != "root"
                } else {
                    false
                }
            })
            .count()
    }

    /// Import bookmarks from HTML format (Netscape Bookmark File Format)
    pub fn import_html(&self, html: &str) -> Result<ImportResult, String> {
        let mut result = ImportResult {
            imported_count: 0,
            folders_count: 0,
            duplicates_skipped: 0,
            errors: Vec::new(),
        };

        // Stack to track current folder hierarchy
        let mut folder_stack: Vec<String> = vec!["bookmarks_bar".to_string()];
        
        for line in html.lines() {
            let trimmed = line.trim();
            
            // Parse folder (H3 tag)
            if let Some(start) = trimmed.find("<H3") {
                if let Some(end) = trimmed.find("</H3>") {
                    let content_start = trimmed[start..].find('>').map(|i| start + i + 1);
                    if let Some(content_start) = content_start {
                        let folder_name = &trimmed[content_start..end];
                        let folder_name = html_decode(folder_name);
                        let parent_id = folder_stack.last().cloned().unwrap_or("bookmarks_bar".to_string());
                        
                        match self.create_folder(folder_name.clone(), Some(parent_id)) {
                            Ok(folder) => {
                                result.folders_count += 1;
                                folder_stack.push(folder.id);
                            }
                            Err(e) => result.errors.push(format!("Folder '{}': {}", folder_name, e)),
                        }
                    }
                }
            }
            
            // Parse bookmark (A tag with HREF)
            if let Some(href_start) = trimmed.find("HREF=\"") {
                let url_start = href_start + 6;
                if let Some(url_end) = trimmed[url_start..].find('"') {
                    let url = &trimmed[url_start..url_start + url_end];
                    
                    // Get title
                    let title = if let Some(tag_end) = trimmed.find('>') {
                        if let Some(close_tag) = trimmed.find("</A>") {
                            html_decode(&trimmed[tag_end + 1..close_tag])
                        } else {
                            "Untitled".to_string()
                        }
                    } else {
                        "Untitled".to_string()
                    };
                    
                    let parent_id = folder_stack.last().cloned().unwrap_or("bookmarks_bar".to_string());
                    
                    // Check for duplicates
                    if self.check_url_exists(url).is_some() {
                        result.duplicates_skipped += 1;
                        continue;
                    }
                    
                    match self.create_bookmark(title.clone(), url.to_string(), Some(parent_id)) {
                        Ok(_) => result.imported_count += 1,
                        Err(e) => result.errors.push(format!("Bookmark '{}': {}", title, e)),
                    }
                }
            }
            
            // Close folder (</DL> tag)
            if trimmed.contains("</DL>") && folder_stack.len() > 1 {
                folder_stack.pop();
            }
        }
        
        Ok(result)
    }
}

/// Decode HTML entities
fn html_decode(s: &str) -> String {
    s.replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&#39;", "'")
        .replace("&apos;", "'")
}
