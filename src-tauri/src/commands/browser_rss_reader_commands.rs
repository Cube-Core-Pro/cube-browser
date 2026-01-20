// CUBE Nexum - RSS Reader Commands
// Tauri commands for RSS feed reader service

use tauri::State;
use std::collections::HashMap;
use crate::services::browser_rss_reader::{
    BrowserRssReaderService, RssReaderSettings, RssFeed, RssArticle, FeedCategory,
    SmartFolder, ArticleFilter, ArticleSort, FeedUpdate, FeedDiscovery, OpmlExport,
    RssStats,
};

// ==================== Settings Commands ====================

#[tauri::command]
pub fn get_rss_settings(
    service: State<'_, BrowserRssReaderService>
) -> RssReaderSettings {
    service.get_settings()
}

#[tauri::command]
pub fn update_rss_settings(
    service: State<'_, BrowserRssReaderService>,
    settings: RssReaderSettings
) {
    service.update_settings(settings);
}

// ==================== Feed Commands ====================

#[tauri::command]
pub fn subscribe_to_feed(
    service: State<'_, BrowserRssReaderService>,
    url: String,
    category_id: Option<String>
) -> RssFeed {
    service.subscribe(url, category_id)
}

#[tauri::command]
pub fn unsubscribe_from_feed(
    service: State<'_, BrowserRssReaderService>,
    feed_id: String
) -> Result<(), String> {
    service.unsubscribe(&feed_id)
}

#[tauri::command]
pub fn get_rss_feed(
    service: State<'_, BrowserRssReaderService>,
    feed_id: String
) -> Option<RssFeed> {
    service.get_feed(&feed_id)
}

#[tauri::command]
pub fn get_all_rss_feeds(
    service: State<'_, BrowserRssReaderService>
) -> Vec<RssFeed> {
    service.get_all_feeds()
}

#[tauri::command]
pub fn update_rss_feed(
    service: State<'_, BrowserRssReaderService>,
    feed_id: String,
    updates: FeedUpdate
) -> Result<RssFeed, String> {
    service.update_feed(&feed_id, updates)
}

#[tauri::command]
pub fn refresh_rss_feed(
    service: State<'_, BrowserRssReaderService>,
    feed_id: String
) -> Result<Vec<RssArticle>, String> {
    service.refresh_feed(&feed_id)
}

#[tauri::command]
pub fn refresh_all_rss_feeds(
    service: State<'_, BrowserRssReaderService>
) -> HashMap<String, Result<u32, String>> {
    service.refresh_all_feeds()
}

// ==================== Article Commands ====================

#[tauri::command]
pub fn get_rss_article(
    service: State<'_, BrowserRssReaderService>,
    article_id: String
) -> Option<RssArticle> {
    service.get_article(&article_id)
}

#[tauri::command]
pub fn get_rss_articles(
    service: State<'_, BrowserRssReaderService>,
    filter: ArticleFilter,
    sort: ArticleSort,
    limit: Option<u32>
) -> Vec<RssArticle> {
    service.get_articles(filter, sort, limit)
}

#[tauri::command]
pub fn rss_mark_article_as_read(
    service: State<'_, BrowserRssReaderService>,
    article_id: String
) -> Result<RssArticle, String> {
    service.mark_as_read(&article_id)
}

#[tauri::command]
pub fn rss_mark_article_as_unread(
    service: State<'_, BrowserRssReaderService>,
    article_id: String
) -> Result<RssArticle, String> {
    service.mark_as_unread(&article_id)
}

#[tauri::command]
pub fn rss_toggle_article_starred(
    service: State<'_, BrowserRssReaderService>,
    article_id: String
) -> Result<RssArticle, String> {
    service.toggle_starred(&article_id)
}

#[tauri::command]
pub fn mark_all_articles_as_read(
    service: State<'_, BrowserRssReaderService>,
    feed_id: Option<String>
) -> u32 {
    service.mark_all_as_read(feed_id.as_deref())
}

#[tauri::command]
pub fn save_article_reading_position(
    service: State<'_, BrowserRssReaderService>,
    article_id: String,
    position: f32
) -> Result<(), String> {
    service.save_reading_position(&article_id, position)
}

// ==================== Category Commands ====================

#[tauri::command]
pub fn create_rss_category(
    service: State<'_, BrowserRssReaderService>,
    name: String,
    parent_id: Option<String>
) -> FeedCategory {
    service.create_category(name, parent_id)
}

#[tauri::command]
pub fn get_rss_category(
    service: State<'_, BrowserRssReaderService>,
    category_id: String
) -> Option<FeedCategory> {
    service.get_category(&category_id)
}

#[tauri::command]
pub fn get_all_rss_categories(
    service: State<'_, BrowserRssReaderService>
) -> Vec<FeedCategory> {
    service.get_all_categories()
}

#[tauri::command]
pub fn update_rss_category(
    service: State<'_, BrowserRssReaderService>,
    category_id: String,
    name: Option<String>,
    color: Option<String>,
    icon: Option<String>
) -> Result<FeedCategory, String> {
    service.update_category(&category_id, name, color, icon)
}

#[tauri::command]
pub fn delete_rss_category(
    service: State<'_, BrowserRssReaderService>,
    category_id: String,
    move_feeds_to: Option<String>
) -> Result<(), String> {
    service.delete_category(&category_id, move_feeds_to)
}

// ==================== Smart Folder Commands ====================

#[tauri::command]
pub fn create_rss_smart_folder(
    service: State<'_, BrowserRssReaderService>,
    name: String,
    filter: ArticleFilter,
    sort_by: ArticleSort
) -> SmartFolder {
    service.create_smart_folder(name, filter, sort_by)
}

#[tauri::command]
pub fn get_rss_smart_folder(
    service: State<'_, BrowserRssReaderService>,
    folder_id: String
) -> Option<SmartFolder> {
    service.get_smart_folder(&folder_id)
}

#[tauri::command]
pub fn get_all_rss_smart_folders(
    service: State<'_, BrowserRssReaderService>
) -> Vec<SmartFolder> {
    service.get_all_smart_folders()
}

#[tauri::command]
pub fn delete_rss_smart_folder(
    service: State<'_, BrowserRssReaderService>,
    folder_id: String
) -> Result<(), String> {
    service.delete_smart_folder(&folder_id)
}

// ==================== Discovery Commands ====================

#[tauri::command]
pub fn discover_rss_feeds(
    service: State<'_, BrowserRssReaderService>,
    url: String
) -> FeedDiscovery {
    service.discover_feeds(&url)
}

// ==================== Import/Export Commands ====================

#[tauri::command]
pub fn export_rss_opml(
    service: State<'_, BrowserRssReaderService>
) -> OpmlExport {
    service.export_opml()
}

#[tauri::command]
pub fn import_rss_opml(
    service: State<'_, BrowserRssReaderService>,
    opml: OpmlExport
) -> (u32, u32) {
    service.import_opml(opml)
}

// ==================== Stats Commands ====================

#[tauri::command]
pub fn get_rss_stats(
    service: State<'_, BrowserRssReaderService>
) -> RssStats {
    service.get_stats()
}
