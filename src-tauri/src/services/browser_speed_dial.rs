// CUBE Nexum - Speed Dial System
// Superior to Opera Speed Dial with live previews, smart suggestions, and AI organization

use std::collections::HashMap;
use std::sync::{Mutex, RwLock};
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

// ==================== Types ====================

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SpeedDialSize {
    Small,      // 2x3 grid item
    Medium,     // 3x4 grid item  
    Large,      // 4x5 grid item
    Wide,       // Double width
    Tall,       // Double height
    Custom(u32, u32), // Custom width x height
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ThumbnailType {
    Screenshot,     // Live webpage screenshot
    Favicon,        // Enlarged favicon
    CustomImage,    // User uploaded image
    Color,          // Solid color with icon
    Pattern,        // Pattern background
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpeedDialEntry {
    pub id: String,
    pub title: String,
    pub url: String,
    pub thumbnail_type: ThumbnailType,
    pub thumbnail_url: Option<String>,
    pub thumbnail_color: Option<String>,
    pub favicon_url: Option<String>,
    pub size: SpeedDialSize,
    pub position: u32,
    pub folder_id: Option<String>,
    pub is_pinned: bool,
    pub visit_count: u64,
    pub last_visited: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub tags: Vec<String>,
    pub notes: Option<String>,
    pub auto_refresh: bool,
    pub refresh_interval: u32,  // minutes
    pub last_refresh: Option<DateTime<Utc>>,
}

impl SpeedDialEntry {
    pub fn new(title: String, url: String) -> Self {
        let now = Utc::now();
        Self {
            id: format!("sd_{}", uuid::Uuid::new_v4()),
            title,
            url,
            thumbnail_type: ThumbnailType::Screenshot,
            thumbnail_url: None,
            thumbnail_color: None,
            favicon_url: None,
            size: SpeedDialSize::Medium,
            position: 0,
            folder_id: None,
            is_pinned: false,
            visit_count: 0,
            last_visited: None,
            created_at: now,
            updated_at: now,
            tags: Vec::new(),
            notes: None,
            auto_refresh: false,
            refresh_interval: 60,
            last_refresh: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpeedDialFolder {
    pub id: String,
    pub name: String,
    pub icon: String,
    pub color: String,
    pub position: u32,
    pub is_expanded: bool,
    pub created_at: DateTime<Utc>,
}

impl SpeedDialFolder {
    pub fn new(name: String) -> Self {
        Self {
            id: format!("sdf_{}", uuid::Uuid::new_v4()),
            name,
            icon: "📁".to_string(),
            color: "#3b82f6".to_string(),
            position: 0,
            is_expanded: true,
            created_at: Utc::now(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpeedDialSettings {
    pub enabled: bool,
    pub show_on_new_tab: bool,
    pub columns: u32,
    pub rows: u32,
    pub show_titles: bool,
    pub show_visit_count: bool,
    pub animation_enabled: bool,
    pub background_type: BackgroundType,
    pub background_value: String,
    pub blur_background: bool,
    pub grid_gap: u32,
    pub border_radius: u32,
    pub shadow_enabled: bool,
    pub live_preview_enabled: bool,
    pub preview_on_hover: bool,
    pub suggestions_enabled: bool,
    pub max_suggestions: usize,
    pub default_size: SpeedDialSize,
}

impl Default for SpeedDialSettings {
    fn default() -> Self {
        Self {
            enabled: true,
            show_on_new_tab: true,
            columns: 5,
            rows: 3,
            show_titles: true,
            show_visit_count: false,
            animation_enabled: true,
            background_type: BackgroundType::Gradient,
            background_value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)".to_string(),
            blur_background: false,
            grid_gap: 16,
            border_radius: 12,
            shadow_enabled: true,
            live_preview_enabled: true,
            preview_on_hover: true,
            suggestions_enabled: true,
            max_suggestions: 6,
            default_size: SpeedDialSize::Medium,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum BackgroundType {
    Solid,
    Gradient,
    Image,
    DailyWallpaper,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpeedDialSuggestion {
    pub url: String,
    pub title: String,
    pub favicon_url: Option<String>,
    pub visit_count: u64,
    pub source: SuggestionSource,
    pub score: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SuggestionSource {
    History,
    Bookmarks,
    Popular,
    AI,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpeedDialStats {
    pub total_entries: usize,
    pub total_folders: usize,
    pub total_visits: u64,
    pub most_visited: Vec<SpeedDialEntry>,
    pub recently_added: Vec<SpeedDialEntry>,
    pub entries_per_folder: HashMap<String, usize>,
}

// ==================== Service ====================

pub struct BrowserSpeedDialService {
    settings: RwLock<SpeedDialSettings>,
    entries: RwLock<HashMap<String, SpeedDialEntry>>,
    folders: RwLock<HashMap<String, SpeedDialFolder>>,
    thumbnail_cache: Mutex<HashMap<String, String>>,  // url -> thumbnail data
}

impl BrowserSpeedDialService {
    pub fn new() -> Self {
        let service = Self {
            settings: RwLock::new(SpeedDialSettings::default()),
            entries: RwLock::new(HashMap::new()),
            folders: RwLock::new(HashMap::new()),
            thumbnail_cache: Mutex::new(HashMap::new()),
        };
        service.init_defaults();
        service
    }

    fn init_defaults(&self) {
        // Add some default speed dial entries
        let defaults = vec![
            ("Google", "https://www.google.com"),
            ("YouTube", "https://www.youtube.com"),
            ("Gmail", "https://mail.google.com"),
            ("GitHub", "https://github.com"),
            ("Reddit", "https://www.reddit.com"),
            ("Twitter", "https://twitter.com"),
        ];

        let mut entries = self.entries.write().unwrap();
        for (i, (title, url)) in defaults.iter().enumerate() {
            let mut entry = SpeedDialEntry::new(title.to_string(), url.to_string());
            entry.position = i as u32;
            entries.insert(entry.id.clone(), entry);
        }
    }

    // ==================== Settings ====================

    pub fn get_settings(&self) -> SpeedDialSettings {
        self.settings.read().unwrap().clone()
    }

    pub fn update_settings(&self, settings: SpeedDialSettings) {
        *self.settings.write().unwrap() = settings;
    }

    pub fn set_grid_size(&self, columns: u32, rows: u32) {
        let mut settings = self.settings.write().unwrap();
        settings.columns = columns;
        settings.rows = rows;
    }

    pub fn set_background(&self, bg_type: BackgroundType, value: String) {
        let mut settings = self.settings.write().unwrap();
        settings.background_type = bg_type;
        settings.background_value = value;
    }

    // ==================== Entry Management ====================

    pub fn get_all_entries(&self) -> Vec<SpeedDialEntry> {
        let mut entries: Vec<_> = self.entries.read().unwrap()
            .values()
            .cloned()
            .collect();
        entries.sort_by_key(|e| e.position);
        entries
    }

    pub fn get_entry(&self, entry_id: &str) -> Option<SpeedDialEntry> {
        self.entries.read().unwrap().get(entry_id).cloned()
    }

    pub fn get_entries_in_folder(&self, folder_id: Option<&str>) -> Vec<SpeedDialEntry> {
        let mut entries: Vec<_> = self.entries.read().unwrap()
            .values()
            .filter(|e| e.folder_id.as_deref() == folder_id)
            .cloned()
            .collect();
        entries.sort_by_key(|e| e.position);
        entries
    }

    pub fn create_entry(&self, title: String, url: String) -> Result<SpeedDialEntry, String> {
        // Validate URL
        if !url.starts_with("http://") && !url.starts_with("https://") {
            return Err("Invalid URL format".to_string());
        }

        // Check for duplicates
        {
            let entries = self.entries.read().unwrap();
            if entries.values().any(|e| e.url == url) {
                return Err("URL already exists in speed dial".to_string());
            }
        }

        let settings = self.settings.read().unwrap();
        let mut entry = SpeedDialEntry::new(title, url);
        entry.size = settings.default_size.clone();
        
        // Set position to end
        let entries = self.entries.read().unwrap();
        entry.position = entries.len() as u32;
        drop(entries);

        let mut entries = self.entries.write().unwrap();
        entries.insert(entry.id.clone(), entry.clone());
        
        Ok(entry)
    }

    pub fn update_entry(&self, entry_id: &str, updates: SpeedDialUpdate) -> Result<SpeedDialEntry, String> {
        let mut entries = self.entries.write().unwrap();
        let entry = entries.get_mut(entry_id)
            .ok_or("Entry not found")?;

        if let Some(title) = updates.title {
            entry.title = title;
        }
        if let Some(url) = updates.url {
            entry.url = url;
        }
        if let Some(thumbnail_type) = updates.thumbnail_type {
            entry.thumbnail_type = thumbnail_type;
        }
        if let Some(thumbnail_url) = updates.thumbnail_url {
            entry.thumbnail_url = thumbnail_url;
        }
        if let Some(thumbnail_color) = updates.thumbnail_color {
            entry.thumbnail_color = thumbnail_color;
        }
        if let Some(size) = updates.size {
            entry.size = size;
        }
        if let Some(folder_id) = updates.folder_id {
            entry.folder_id = folder_id;
        }
        if let Some(is_pinned) = updates.is_pinned {
            entry.is_pinned = is_pinned;
        }
        if let Some(tags) = updates.tags {
            entry.tags = tags;
        }
        if let Some(notes) = updates.notes {
            entry.notes = notes;
        }
        if let Some(auto_refresh) = updates.auto_refresh {
            entry.auto_refresh = auto_refresh;
        }
        if let Some(refresh_interval) = updates.refresh_interval {
            entry.refresh_interval = refresh_interval;
        }

        entry.updated_at = Utc::now();
        Ok(entry.clone())
    }

    pub fn delete_entry(&self, entry_id: &str) -> Result<(), String> {
        let mut entries = self.entries.write().unwrap();
        entries.remove(entry_id)
            .ok_or("Entry not found")?;
        Ok(())
    }

    pub fn reorder_entries(&self, entry_ids: Vec<String>) -> Result<(), String> {
        let mut entries = self.entries.write().unwrap();
        
        for (i, id) in entry_ids.iter().enumerate() {
            if let Some(entry) = entries.get_mut(id) {
                entry.position = i as u32;
            }
        }
        
        Ok(())
    }

    pub fn move_to_folder(&self, entry_id: &str, folder_id: Option<String>) -> Result<(), String> {
        let mut entries = self.entries.write().unwrap();
        let entry = entries.get_mut(entry_id)
            .ok_or("Entry not found")?;
        
        entry.folder_id = folder_id;
        entry.updated_at = Utc::now();
        Ok(())
    }

    pub fn toggle_pin(&self, entry_id: &str) -> Result<bool, String> {
        let mut entries = self.entries.write().unwrap();
        let entry = entries.get_mut(entry_id)
            .ok_or("Entry not found")?;
        
        entry.is_pinned = !entry.is_pinned;
        Ok(entry.is_pinned)
    }

    pub fn record_visit(&self, entry_id: &str) -> Result<(), String> {
        let mut entries = self.entries.write().unwrap();
        let entry = entries.get_mut(entry_id)
            .ok_or("Entry not found")?;
        
        entry.visit_count += 1;
        entry.last_visited = Some(Utc::now());
        Ok(())
    }

    // ==================== Folder Management ====================

    pub fn get_all_folders(&self) -> Vec<SpeedDialFolder> {
        let mut folders: Vec<_> = self.folders.read().unwrap()
            .values()
            .cloned()
            .collect();
        folders.sort_by_key(|f| f.position);
        folders
    }

    pub fn get_folder(&self, folder_id: &str) -> Option<SpeedDialFolder> {
        self.folders.read().unwrap().get(folder_id).cloned()
    }

    pub fn create_folder(&self, name: String) -> Result<SpeedDialFolder, String> {
        let folder = SpeedDialFolder::new(name);
        
        let mut folders = self.folders.write().unwrap();
        folders.insert(folder.id.clone(), folder.clone());
        
        Ok(folder)
    }

    pub fn update_folder(&self, folder_id: &str, updates: FolderUpdate) -> Result<SpeedDialFolder, String> {
        let mut folders = self.folders.write().unwrap();
        let folder = folders.get_mut(folder_id)
            .ok_or("Folder not found")?;

        if let Some(name) = updates.name {
            folder.name = name;
        }
        if let Some(icon) = updates.icon {
            folder.icon = icon;
        }
        if let Some(color) = updates.color {
            folder.color = color;
        }
        if let Some(is_expanded) = updates.is_expanded {
            folder.is_expanded = is_expanded;
        }

        Ok(folder.clone())
    }

    pub fn delete_folder(&self, folder_id: &str, move_entries: bool) -> Result<(), String> {
        // Move or delete entries in folder
        {
            let mut entries = self.entries.write().unwrap();
            if move_entries {
                for entry in entries.values_mut() {
                    if entry.folder_id.as_deref() == Some(folder_id) {
                        entry.folder_id = None;
                    }
                }
            } else {
                entries.retain(|_, e| e.folder_id.as_deref() != Some(folder_id));
            }
        }
        
        let mut folders = self.folders.write().unwrap();
        folders.remove(folder_id)
            .ok_or("Folder not found")?;
        
        Ok(())
    }

    pub fn reorder_folders(&self, folder_ids: Vec<String>) -> Result<(), String> {
        let mut folders = self.folders.write().unwrap();
        
        for (i, id) in folder_ids.iter().enumerate() {
            if let Some(folder) = folders.get_mut(id) {
                folder.position = i as u32;
            }
        }
        
        Ok(())
    }

    pub fn toggle_folder_expanded(&self, folder_id: &str) -> Result<bool, String> {
        let mut folders = self.folders.write().unwrap();
        let folder = folders.get_mut(folder_id)
            .ok_or("Folder not found")?;
        
        folder.is_expanded = !folder.is_expanded;
        Ok(folder.is_expanded)
    }

    // ==================== Thumbnails ====================

    pub fn update_thumbnail(&self, entry_id: &str, thumbnail_data: String) -> Result<(), String> {
        let mut entries = self.entries.write().unwrap();
        let entry = entries.get_mut(entry_id)
            .ok_or("Entry not found")?;
        
        entry.thumbnail_url = Some(thumbnail_data.clone());
        entry.last_refresh = Some(Utc::now());
        
        // Cache thumbnail
        let mut cache = self.thumbnail_cache.lock().unwrap();
        cache.insert(entry.url.clone(), thumbnail_data);
        
        Ok(())
    }

    pub fn get_cached_thumbnail(&self, url: &str) -> Option<String> {
        self.thumbnail_cache.lock().unwrap().get(url).cloned()
    }

    pub fn clear_thumbnail_cache(&self) {
        self.thumbnail_cache.lock().unwrap().clear();
    }

    pub fn get_entries_needing_refresh(&self) -> Vec<SpeedDialEntry> {
        let now = Utc::now();
        self.entries.read().unwrap()
            .values()
            .filter(|e| {
                if !e.auto_refresh {
                    return false;
                }
                match e.last_refresh {
                    None => true,
                    Some(last) => {
                        let diff = now.signed_duration_since(last);
                        diff.num_minutes() >= e.refresh_interval as i64
                    }
                }
            })
            .cloned()
            .collect()
    }

    // ==================== Suggestions ====================

    pub fn get_suggestions(&self, history: Vec<(String, String, u64)>, bookmarks: Vec<(String, String)>) -> Vec<SpeedDialSuggestion> {
        let settings = self.settings.read().unwrap();
        if !settings.suggestions_enabled {
            return Vec::new();
        }

        let entries = self.entries.read().unwrap();
        let existing_urls: std::collections::HashSet<_> = entries.values()
            .map(|e| e.url.as_str())
            .collect();

        let mut suggestions = Vec::new();

        // Add from history (not already in speed dial)
        for (url, title, visit_count) in history {
            if !existing_urls.contains(url.as_str()) {
                suggestions.push(SpeedDialSuggestion {
                    url,
                    title,
                    favicon_url: None,
                    visit_count,
                    source: SuggestionSource::History,
                    score: visit_count as f64,
                });
            }
        }

        // Add from bookmarks
        for (url, title) in bookmarks {
            if !existing_urls.contains(url.as_str()) && 
               !suggestions.iter().any(|s| s.url == url) {
                suggestions.push(SpeedDialSuggestion {
                    url,
                    title,
                    favicon_url: None,
                    visit_count: 0,
                    source: SuggestionSource::Bookmarks,
                    score: 50.0,
                });
            }
        }

        // Sort by score
        suggestions.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());
        suggestions.truncate(settings.max_suggestions);

        suggestions
    }

    // ==================== Search ====================

    pub fn search(&self, query: &str) -> Vec<SpeedDialEntry> {
        let query_lower = query.to_lowercase();
        let entries = self.entries.read().unwrap();
        
        entries.values()
            .filter(|e| {
                e.title.to_lowercase().contains(&query_lower) ||
                e.url.to_lowercase().contains(&query_lower) ||
                e.tags.iter().any(|t| t.to_lowercase().contains(&query_lower))
            })
            .cloned()
            .collect()
    }

    // ==================== Stats ====================

    pub fn get_stats(&self) -> SpeedDialStats {
        let entries = self.entries.read().unwrap();
        let folders = self.folders.read().unwrap();
        
        let total_visits: u64 = entries.values().map(|e| e.visit_count).sum();
        
        let mut most_visited: Vec<_> = entries.values().cloned().collect();
        most_visited.sort_by(|a, b| b.visit_count.cmp(&a.visit_count));
        most_visited.truncate(10);
        
        let mut recently_added: Vec<_> = entries.values().cloned().collect();
        recently_added.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        recently_added.truncate(10);
        
        let mut entries_per_folder: HashMap<String, usize> = HashMap::new();
        for entry in entries.values() {
            let folder_key = entry.folder_id.clone().unwrap_or_else(|| "root".to_string());
            *entries_per_folder.entry(folder_key).or_insert(0) += 1;
        }
        
        SpeedDialStats {
            total_entries: entries.len(),
            total_folders: folders.len(),
            total_visits,
            most_visited,
            recently_added,
            entries_per_folder,
        }
    }

    // ==================== Import/Export ====================

    pub fn export_data(&self) -> Result<String, String> {
        let entries: Vec<_> = self.entries.read().unwrap().values().cloned().collect();
        let folders: Vec<_> = self.folders.read().unwrap().values().cloned().collect();
        
        let data = serde_json::json!({
            "entries": entries,
            "folders": folders,
            "version": "1.0"
        });
        
        serde_json::to_string_pretty(&data)
            .map_err(|e| format!("Export failed: {}", e))
    }

    pub fn import_data(&self, json: &str) -> Result<(u32, u32), String> {
        let data: serde_json::Value = serde_json::from_str(json)
            .map_err(|e| format!("Invalid JSON: {}", e))?;
        
        let mut entries_count = 0;
        let mut folders_count = 0;
        
        if let Some(folders_arr) = data["folders"].as_array() {
            let mut folders = self.folders.write().unwrap();
            for folder_val in folders_arr {
                if let Ok(folder) = serde_json::from_value::<SpeedDialFolder>(folder_val.clone()) {
                    folders.insert(folder.id.clone(), folder);
                    folders_count += 1;
                }
            }
        }
        
        if let Some(entries_arr) = data["entries"].as_array() {
            let mut entries = self.entries.write().unwrap();
            for entry_val in entries_arr {
                if let Ok(entry) = serde_json::from_value::<SpeedDialEntry>(entry_val.clone()) {
                    entries.insert(entry.id.clone(), entry);
                    entries_count += 1;
                }
            }
        }
        
        Ok((entries_count, folders_count))
    }

    pub fn import_from_bookmarks(&self, bookmarks: Vec<(String, String)>) -> Result<u32, String> {
        let mut count = 0;
        
        for (url, title) in bookmarks {
            if self.create_entry(title, url).is_ok() {
                count += 1;
            }
        }
        
        Ok(count)
    }
}

impl Default for BrowserSpeedDialService {
    fn default() -> Self {
        Self::new()
    }
}

// ==================== Update Types ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpeedDialUpdate {
    pub title: Option<String>,
    pub url: Option<String>,
    pub thumbnail_type: Option<ThumbnailType>,
    pub thumbnail_url: Option<Option<String>>,
    pub thumbnail_color: Option<Option<String>>,
    pub size: Option<SpeedDialSize>,
    pub folder_id: Option<Option<String>>,
    pub is_pinned: Option<bool>,
    pub tags: Option<Vec<String>>,
    pub notes: Option<Option<String>>,
    pub auto_refresh: Option<bool>,
    pub refresh_interval: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FolderUpdate {
    pub name: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub is_expanded: Option<bool>,
}
