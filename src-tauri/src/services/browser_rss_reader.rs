// CUBE Nexum - RSS Feed Reader Service
// Built-in RSS/Atom feed reader with smart features

use std::collections::HashMap;
use std::sync::RwLock;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// ==================== Types ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RssReaderSettings {
    pub enabled: bool,
    pub auto_refresh: bool,
    pub refresh_interval_minutes: u32,
    pub default_view: FeedView,
    pub mark_read_on_scroll: bool,
    pub show_images: bool,
    pub open_links_in_new_tab: bool,
    pub notification_enabled: bool,
    pub notification_sound: bool,
    pub max_articles_per_feed: u32,
    pub auto_delete_after_days: Option<u32>,
    pub sync_enabled: bool,
    pub sync_read_status: bool,
    pub keyboard_shortcuts: RssShortcuts,
    pub themes: RssThemeSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum FeedView {
    List,
    Cards,
    Magazine,
    Headlines,
    Split,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RssShortcuts {
    pub next_article: String,
    pub prev_article: String,
    pub toggle_read: String,
    pub toggle_star: String,
    pub open_article: String,
    pub refresh_feeds: String,
    pub mark_all_read: String,
    pub add_feed: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RssThemeSettings {
    pub font_family: String,
    pub font_size: u32,
    pub line_height: f32,
    pub content_width: ContentWidth,
    pub show_feed_icons: bool,
    pub show_article_images: bool,
    pub image_position: ImagePosition,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ContentWidth {
    Narrow,
    Medium,
    Wide,
    Full,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ImagePosition {
    Left,
    Right,
    Top,
    Hidden,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RssFeed {
    pub id: String,
    pub url: String,
    pub title: String,
    pub description: Option<String>,
    pub site_url: Option<String>,
    pub icon_url: Option<String>,
    pub feed_type: FeedType,
    pub category_id: Option<String>,
    pub unread_count: u32,
    pub total_count: u32,
    pub error_count: u32,
    pub last_error: Option<String>,
    pub last_fetched: Option<DateTime<Utc>>,
    pub last_updated: Option<DateTime<Utc>>,
    pub custom_title: Option<String>,
    pub is_muted: bool,
    pub fetch_full_content: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum FeedType {
    RSS,
    Atom,
    JSON,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RssArticle {
    pub id: String,
    pub feed_id: String,
    pub guid: String,
    pub title: String,
    pub link: String,
    pub author: Option<String>,
    pub published: Option<DateTime<Utc>>,
    pub updated: Option<DateTime<Utc>>,
    pub summary: Option<String>,
    pub content: Option<String>,
    pub image_url: Option<String>,
    pub categories: Vec<String>,
    pub enclosures: Vec<Enclosure>,
    pub is_read: bool,
    pub is_starred: bool,
    pub read_at: Option<DateTime<Utc>>,
    pub read_position: Option<f32>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Enclosure {
    pub url: String,
    pub media_type: String,
    pub length: Option<u64>,
    pub title: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeedCategory {
    pub id: String,
    pub name: String,
    pub color: String,
    pub icon: String,
    pub parent_id: Option<String>,
    pub feed_count: u32,
    pub unread_count: u32,
    pub sort_order: u32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmartFolder {
    pub id: String,
    pub name: String,
    pub icon: String,
    pub filter: ArticleFilter,
    pub sort_by: ArticleSort,
    pub is_system: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArticleFilter {
    pub query: Option<String>,
    pub feed_ids: Option<Vec<String>>,
    pub category_ids: Option<Vec<String>>,
    pub is_read: Option<bool>,
    pub is_starred: Option<bool>,
    pub has_enclosure: Option<bool>,
    pub date_from: Option<DateTime<Utc>>,
    pub date_to: Option<DateTime<Utc>>,
    pub author: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ArticleSort {
    DateDesc,
    DateAsc,
    TitleAsc,
    TitleDesc,
    FeedAsc,
    FeedDesc,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RssStats {
    pub total_feeds: u32,
    pub total_articles: u64,
    pub unread_articles: u64,
    pub starred_articles: u64,
    pub articles_today: u32,
    pub articles_this_week: u32,
    pub most_active_feeds: Vec<(String, u32)>,
    pub reading_time_minutes: u64,
    pub articles_by_category: HashMap<String, u32>,
    pub feeds_with_errors: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpmlExport {
    pub feeds: Vec<RssFeed>,
    pub categories: Vec<FeedCategory>,
    pub exported_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeedDiscovery {
    pub url: String,
    pub feeds: Vec<DiscoveredFeed>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscoveredFeed {
    pub url: String,
    pub title: String,
    pub feed_type: FeedType,
}

// ==================== Service Implementation ====================

pub struct BrowserRssReaderService {
    settings: RwLock<RssReaderSettings>,
    feeds: RwLock<HashMap<String, RssFeed>>,
    articles: RwLock<HashMap<String, RssArticle>>,
    categories: RwLock<HashMap<String, FeedCategory>>,
    smart_folders: RwLock<HashMap<String, SmartFolder>>,
    articles_by_feed: RwLock<HashMap<String, Vec<String>>>,
}

impl BrowserRssReaderService {
    pub fn new() -> Self {
        let mut smart_folders = HashMap::new();
        
        // Create default smart folders
        let all = SmartFolder {
            id: "all".to_string(),
            name: "All Articles".to_string(),
            icon: "📰".to_string(),
            filter: ArticleFilter {
                query: None,
                feed_ids: None,
                category_ids: None,
                is_read: None,
                is_starred: None,
                has_enclosure: None,
                date_from: None,
                date_to: None,
                author: None,
            },
            sort_by: ArticleSort::DateDesc,
            is_system: true,
            created_at: Utc::now(),
        };

        let unread = SmartFolder {
            id: "unread".to_string(),
            name: "Unread".to_string(),
            icon: "📬".to_string(),
            filter: ArticleFilter {
                query: None,
                feed_ids: None,
                category_ids: None,
                is_read: Some(false),
                is_starred: None,
                has_enclosure: None,
                date_from: None,
                date_to: None,
                author: None,
            },
            sort_by: ArticleSort::DateDesc,
            is_system: true,
            created_at: Utc::now(),
        };

        let starred = SmartFolder {
            id: "starred".to_string(),
            name: "Starred".to_string(),
            icon: "⭐".to_string(),
            filter: ArticleFilter {
                query: None,
                feed_ids: None,
                category_ids: None,
                is_read: None,
                is_starred: Some(true),
                has_enclosure: None,
                date_from: None,
                date_to: None,
                author: None,
            },
            sort_by: ArticleSort::DateDesc,
            is_system: true,
            created_at: Utc::now(),
        };

        let today = SmartFolder {
            id: "today".to_string(),
            name: "Today".to_string(),
            icon: "📅".to_string(),
            filter: ArticleFilter {
                query: None,
                feed_ids: None,
                category_ids: None,
                is_read: None,
                is_starred: None,
                has_enclosure: None,
                date_from: Some(Utc::now() - chrono::Duration::days(1)),
                date_to: None,
                author: None,
            },
            sort_by: ArticleSort::DateDesc,
            is_system: true,
            created_at: Utc::now(),
        };

        smart_folders.insert("all".to_string(), all);
        smart_folders.insert("unread".to_string(), unread);
        smart_folders.insert("starred".to_string(), starred);
        smart_folders.insert("today".to_string(), today);

        Self {
            settings: RwLock::new(Self::default_settings()),
            feeds: RwLock::new(HashMap::new()),
            articles: RwLock::new(HashMap::new()),
            categories: RwLock::new(HashMap::new()),
            smart_folders: RwLock::new(smart_folders),
            articles_by_feed: RwLock::new(HashMap::new()),
        }
    }

    fn default_settings() -> RssReaderSettings {
        RssReaderSettings {
            enabled: true,
            auto_refresh: true,
            refresh_interval_minutes: 30,
            default_view: FeedView::List,
            mark_read_on_scroll: true,
            show_images: true,
            open_links_in_new_tab: true,
            notification_enabled: true,
            notification_sound: false,
            max_articles_per_feed: 100,
            auto_delete_after_days: Some(30),
            sync_enabled: false,
            sync_read_status: true,
            keyboard_shortcuts: RssShortcuts {
                next_article: "j".to_string(),
                prev_article: "k".to_string(),
                toggle_read: "m".to_string(),
                toggle_star: "s".to_string(),
                open_article: "Enter".to_string(),
                refresh_feeds: "r".to_string(),
                mark_all_read: "Shift+A".to_string(),
                add_feed: "a".to_string(),
            },
            themes: RssThemeSettings {
                font_family: "system-ui".to_string(),
                font_size: 16,
                line_height: 1.6,
                content_width: ContentWidth::Medium,
                show_feed_icons: true,
                show_article_images: true,
                image_position: ImagePosition::Left,
            },
        }
    }

    // ==================== Settings ====================

    pub fn get_settings(&self) -> RssReaderSettings {
        self.settings.read().unwrap().clone()
    }

    pub fn update_settings(&self, new_settings: RssReaderSettings) {
        let mut settings = self.settings.write().unwrap();
        *settings = new_settings;
    }

    // ==================== Feed Management ====================

    pub fn subscribe(&self, url: String, category_id: Option<String>) -> RssFeed {
        let now = Utc::now();

        let feed = RssFeed {
            id: Uuid::new_v4().to_string(),
            url: url.clone(),
            title: url.clone(), // Will be updated after fetch
            description: None,
            site_url: None,
            icon_url: None,
            feed_type: FeedType::Unknown,
            category_id,
            unread_count: 0,
            total_count: 0,
            error_count: 0,
            last_error: None,
            last_fetched: None,
            last_updated: None,
            custom_title: None,
            is_muted: false,
            fetch_full_content: false,
            created_at: now,
        };

        let id = feed.id.clone();
        self.feeds.write().unwrap().insert(id.clone(), feed.clone());
        self.articles_by_feed.write().unwrap().insert(id, Vec::new());

        feed
    }

    pub fn unsubscribe(&self, feed_id: &str) -> Result<(), String> {
        // Remove all articles for this feed
        if let Some(article_ids) = self.articles_by_feed.write().unwrap().remove(feed_id) {
            let mut articles = self.articles.write().unwrap();
            for id in article_ids {
                articles.remove(&id);
            }
        }

        self.feeds.write().unwrap()
            .remove(feed_id)
            .ok_or_else(|| "Feed not found".to_string())?;

        Ok(())
    }

    pub fn get_feed(&self, feed_id: &str) -> Option<RssFeed> {
        self.feeds.read().unwrap().get(feed_id).cloned()
    }

    pub fn get_all_feeds(&self) -> Vec<RssFeed> {
        self.feeds.read().unwrap().values().cloned().collect()
    }

    pub fn update_feed(&self, feed_id: &str, updates: FeedUpdate) -> Result<RssFeed, String> {
        let mut feeds = self.feeds.write().unwrap();
        let feed = feeds.get_mut(feed_id)
            .ok_or_else(|| "Feed not found".to_string())?;

        if let Some(custom_title) = updates.custom_title {
            feed.custom_title = custom_title;
        }
        if let Some(category_id) = updates.category_id {
            feed.category_id = category_id;
        }
        if let Some(is_muted) = updates.is_muted {
            feed.is_muted = is_muted;
        }
        if let Some(fetch_full_content) = updates.fetch_full_content {
            feed.fetch_full_content = fetch_full_content;
        }

        Ok(feed.clone())
    }

    pub fn refresh_feed(&self, feed_id: &str) -> Result<Vec<RssArticle>, String> {
        let feeds = self.feeds.read().unwrap();
        let _feed = feeds.get(feed_id)
            .ok_or_else(|| "Feed not found".to_string())?;

        // In real implementation, this would fetch and parse the feed
        // For now, return empty list
        Ok(Vec::new())
    }

    pub fn refresh_all_feeds(&self) -> HashMap<String, Result<u32, String>> {
        let feeds = self.feeds.read().unwrap();
        let mut results = HashMap::new();

        for feed_id in feeds.keys() {
            // In real implementation, fetch each feed
            results.insert(feed_id.clone(), Ok(0));
        }

        results
    }

    // ==================== Article Management ====================

    pub fn get_article(&self, article_id: &str) -> Option<RssArticle> {
        self.articles.read().unwrap().get(article_id).cloned()
    }

    pub fn get_articles(&self, filter: ArticleFilter, sort: ArticleSort, limit: Option<u32>) -> Vec<RssArticle> {
        let articles = self.articles.read().unwrap();

        let mut results: Vec<RssArticle> = articles.values()
            .filter(|a| {
                // Query filter
                let query_match = filter.query.as_ref()
                    .map(|q| {
                        let q_lower = q.to_lowercase();
                        a.title.to_lowercase().contains(&q_lower) ||
                        a.summary.as_ref().map(|s| s.to_lowercase().contains(&q_lower)).unwrap_or(false) ||
                        a.content.as_ref().map(|c| c.to_lowercase().contains(&q_lower)).unwrap_or(false)
                    })
                    .unwrap_or(true);

                // Feed filter
                let feed_match = filter.feed_ids.as_ref()
                    .map(|ids| ids.contains(&a.feed_id))
                    .unwrap_or(true);

                // Read status filter
                let read_match = filter.is_read
                    .map(|r| a.is_read == r)
                    .unwrap_or(true);

                // Starred filter
                let starred_match = filter.is_starred
                    .map(|s| a.is_starred == s)
                    .unwrap_or(true);

                // Enclosure filter
                let enclosure_match = filter.has_enclosure
                    .map(|has| has == !a.enclosures.is_empty())
                    .unwrap_or(true);

                // Date filter
                let date_match = {
                    let published = a.published.unwrap_or(a.created_at);
                    let after = filter.date_from
                        .map(|d| published >= d)
                        .unwrap_or(true);
                    let before = filter.date_to
                        .map(|d| published <= d)
                        .unwrap_or(true);
                    after && before
                };

                // Author filter
                let author_match = filter.author.as_ref()
                    .map(|auth| a.author.as_ref().map(|a| a.contains(auth)).unwrap_or(false))
                    .unwrap_or(true);

                query_match && feed_match && read_match && starred_match && 
                enclosure_match && date_match && author_match
            })
            .cloned()
            .collect();

        // Sort
        match sort {
            ArticleSort::DateDesc => results.sort_by(|a, b| {
                let da = a.published.unwrap_or(a.created_at);
                let db = b.published.unwrap_or(b.created_at);
                db.cmp(&da)
            }),
            ArticleSort::DateAsc => results.sort_by(|a, b| {
                let da = a.published.unwrap_or(a.created_at);
                let db = b.published.unwrap_or(b.created_at);
                da.cmp(&db)
            }),
            ArticleSort::TitleAsc => results.sort_by(|a, b| a.title.cmp(&b.title)),
            ArticleSort::TitleDesc => results.sort_by(|a, b| b.title.cmp(&a.title)),
            ArticleSort::FeedAsc => results.sort_by(|a, b| a.feed_id.cmp(&b.feed_id)),
            ArticleSort::FeedDesc => results.sort_by(|a, b| b.feed_id.cmp(&a.feed_id)),
        }

        // Limit
        if let Some(limit) = limit {
            results.truncate(limit as usize);
        }

        results
    }

    pub fn mark_as_read(&self, article_id: &str) -> Result<RssArticle, String> {
        let mut articles = self.articles.write().unwrap();
        let article = articles.get_mut(article_id)
            .ok_or_else(|| "Article not found".to_string())?;

        if !article.is_read {
            article.is_read = true;
            article.read_at = Some(Utc::now());

            // Update feed unread count
            let mut feeds = self.feeds.write().unwrap();
            if let Some(feed) = feeds.get_mut(&article.feed_id) {
                if feed.unread_count > 0 {
                    feed.unread_count -= 1;
                }
            }
        }

        Ok(article.clone())
    }

    pub fn mark_as_unread(&self, article_id: &str) -> Result<RssArticle, String> {
        let mut articles = self.articles.write().unwrap();
        let article = articles.get_mut(article_id)
            .ok_or_else(|| "Article not found".to_string())?;

        if article.is_read {
            article.is_read = false;
            article.read_at = None;

            // Update feed unread count
            let mut feeds = self.feeds.write().unwrap();
            if let Some(feed) = feeds.get_mut(&article.feed_id) {
                feed.unread_count += 1;
            }
        }

        Ok(article.clone())
    }

    pub fn toggle_starred(&self, article_id: &str) -> Result<RssArticle, String> {
        let mut articles = self.articles.write().unwrap();
        let article = articles.get_mut(article_id)
            .ok_or_else(|| "Article not found".to_string())?;

        article.is_starred = !article.is_starred;

        Ok(article.clone())
    }

    pub fn mark_all_as_read(&self, feed_id: Option<&str>) -> u32 {
        let mut articles = self.articles.write().unwrap();
        let mut feeds = self.feeds.write().unwrap();
        let mut count = 0u32;

        for article in articles.values_mut() {
            if feed_id.map(|id| id == article.feed_id).unwrap_or(true) && !article.is_read {
                article.is_read = true;
                article.read_at = Some(Utc::now());
                count += 1;
            }
        }

        // Update feed unread counts
        if let Some(feed_id) = feed_id {
            if let Some(feed) = feeds.get_mut(feed_id) {
                feed.unread_count = 0;
            }
        } else {
            for feed in feeds.values_mut() {
                feed.unread_count = 0;
            }
        }

        count
    }

    pub fn save_reading_position(&self, article_id: &str, position: f32) -> Result<(), String> {
        let mut articles = self.articles.write().unwrap();
        let article = articles.get_mut(article_id)
            .ok_or_else(|| "Article not found".to_string())?;

        article.read_position = Some(position);

        Ok(())
    }

    // ==================== Categories ====================

    pub fn create_category(&self, name: String, parent_id: Option<String>) -> FeedCategory {
        let categories = self.categories.read().unwrap();
        let sort_order = categories.len() as u32;
        drop(categories);

        let category = FeedCategory {
            id: Uuid::new_v4().to_string(),
            name,
            color: "#3b82f6".to_string(),
            icon: "📁".to_string(),
            parent_id,
            feed_count: 0,
            unread_count: 0,
            sort_order,
            created_at: Utc::now(),
        };

        let id = category.id.clone();
        self.categories.write().unwrap().insert(id, category.clone());

        category
    }

    pub fn get_category(&self, category_id: &str) -> Option<FeedCategory> {
        self.categories.read().unwrap().get(category_id).cloned()
    }

    pub fn get_all_categories(&self) -> Vec<FeedCategory> {
        let mut categories: Vec<FeedCategory> = self.categories.read().unwrap()
            .values().cloned().collect();
        categories.sort_by_key(|c| c.sort_order);
        categories
    }

    pub fn update_category(&self, category_id: &str, name: Option<String>, color: Option<String>, icon: Option<String>) -> Result<FeedCategory, String> {
        let mut categories = self.categories.write().unwrap();
        let category = categories.get_mut(category_id)
            .ok_or_else(|| "Category not found".to_string())?;

        if let Some(n) = name {
            category.name = n;
        }
        if let Some(c) = color {
            category.color = c;
        }
        if let Some(i) = icon {
            category.icon = i;
        }

        Ok(category.clone())
    }

    pub fn delete_category(&self, category_id: &str, move_feeds_to: Option<String>) -> Result<(), String> {
        // Move feeds to another category or uncategorized
        let mut feeds = self.feeds.write().unwrap();
        for feed in feeds.values_mut() {
            if feed.category_id.as_ref() == Some(&category_id.to_string()) {
                feed.category_id = move_feeds_to.clone();
            }
        }

        self.categories.write().unwrap()
            .remove(category_id)
            .ok_or_else(|| "Category not found".to_string())?;

        Ok(())
    }

    // ==================== Smart Folders ====================

    pub fn create_smart_folder(&self, name: String, filter: ArticleFilter, sort_by: ArticleSort) -> SmartFolder {
        let folder = SmartFolder {
            id: Uuid::new_v4().to_string(),
            name,
            icon: "🔍".to_string(),
            filter,
            sort_by,
            is_system: false,
            created_at: Utc::now(),
        };

        let id = folder.id.clone();
        self.smart_folders.write().unwrap().insert(id, folder.clone());

        folder
    }

    pub fn get_smart_folder(&self, folder_id: &str) -> Option<SmartFolder> {
        self.smart_folders.read().unwrap().get(folder_id).cloned()
    }

    pub fn get_all_smart_folders(&self) -> Vec<SmartFolder> {
        self.smart_folders.read().unwrap().values().cloned().collect()
    }

    pub fn delete_smart_folder(&self, folder_id: &str) -> Result<(), String> {
        let folders = self.smart_folders.read().unwrap();
        if folders.get(folder_id).map(|f| f.is_system).unwrap_or(false) {
            return Err("Cannot delete system folder".to_string());
        }
        drop(folders);

        self.smart_folders.write().unwrap()
            .remove(folder_id)
            .ok_or_else(|| "Folder not found".to_string())?;

        Ok(())
    }

    // ==================== Discovery ====================

    pub fn discover_feeds(&self, url: &str) -> FeedDiscovery {
        // In real implementation, this would:
        // 1. Fetch the URL
        // 2. Parse HTML for feed links
        // 3. Try common feed URLs
        
        FeedDiscovery {
            url: url.to_string(),
            feeds: Vec::new(),
        }
    }

    // ==================== Import/Export ====================

    pub fn export_opml(&self) -> OpmlExport {
        OpmlExport {
            feeds: self.feeds.read().unwrap().values().cloned().collect(),
            categories: self.categories.read().unwrap().values().cloned().collect(),
            exported_at: Utc::now(),
        }
    }

    pub fn import_opml(&self, opml: OpmlExport) -> (u32, u32) {
        let mut imported_feeds = 0u32;
        let mut imported_categories = 0u32;

        // Import categories first
        for category in opml.categories {
            let id = Uuid::new_v4().to_string();
            let mut new_category = category;
            new_category.id = id.clone();
            self.categories.write().unwrap().insert(id, new_category);
            imported_categories += 1;
        }

        // Import feeds
        for feed in opml.feeds {
            let id = Uuid::new_v4().to_string();
            let mut new_feed = feed;
            new_feed.id = id.clone();
            self.feeds.write().unwrap().insert(id.clone(), new_feed);
            self.articles_by_feed.write().unwrap().insert(id, Vec::new());
            imported_feeds += 1;
        }

        (imported_feeds, imported_categories)
    }

    // ==================== Stats ====================

    pub fn get_stats(&self) -> RssStats {
        let feeds = self.feeds.read().unwrap();
        let articles = self.articles.read().unwrap();
        let categories = self.categories.read().unwrap();

        let mut unread = 0u64;
        let mut starred = 0u64;
        let mut today_count = 0u32;
        let mut week_count = 0u32;
        let mut by_category: HashMap<String, u32> = HashMap::new();

        let now = Utc::now();
        let today = now - chrono::Duration::days(1);
        let week_ago = now - chrono::Duration::days(7);

        for article in articles.values() {
            if !article.is_read {
                unread += 1;
            }
            if article.is_starred {
                starred += 1;
            }

            let published = article.published.unwrap_or(article.created_at);
            if published >= today {
                today_count += 1;
            }
            if published >= week_ago {
                week_count += 1;
            }
        }

        for (category_id, _) in categories.iter() {
            let count = feeds.values()
                .filter(|f| f.category_id.as_ref() == Some(category_id))
                .map(|f| f.total_count)
                .sum();
            by_category.insert(category_id.clone(), count);
        }

        let mut most_active: Vec<(String, u32)> = feeds.values()
            .map(|f| (f.title.clone(), f.total_count))
            .collect();
        most_active.sort_by(|a, b| b.1.cmp(&a.1));
        most_active.truncate(10);

        let feeds_with_errors = feeds.values()
            .filter(|f| f.error_count > 0)
            .count() as u32;

        RssStats {
            total_feeds: feeds.len() as u32,
            total_articles: articles.len() as u64,
            unread_articles: unread,
            starred_articles: starred,
            articles_today: today_count,
            articles_this_week: week_count,
            most_active_feeds: most_active,
            reading_time_minutes: 0, // Would track actual reading time
            articles_by_category: by_category,
            feeds_with_errors,
        }
    }
}

// ==================== Update Types ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeedUpdate {
    pub custom_title: Option<Option<String>>,
    pub category_id: Option<Option<String>>,
    pub is_muted: Option<bool>,
    pub fetch_full_content: Option<bool>,
}

impl Default for BrowserRssReaderService {
    fn default() -> Self {
        Self::new()
    }
}
