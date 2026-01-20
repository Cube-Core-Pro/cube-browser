use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Article {
    pub id: String,
    pub url: String,
    pub title: String,
    pub author: Option<String>,
    pub excerpt: Option<String>,
    pub content: Option<String>,
    pub thumbnail: Option<String>,
    pub tags: Vec<String>,
    pub reading_time_minutes: Option<i32>,
    pub progress_percentage: f32,
    pub is_read: bool,
    pub is_favorite: bool,
    pub added_at: i64,
    pub read_at: Option<i64>,
    pub last_opened_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArticleStats {
    pub total_articles: i32,
    pub unread_articles: i32,
    pub read_articles: i32,
    pub favorite_articles: i32,
    pub total_reading_time_minutes: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArticleFilter {
    pub status: Option<String>, // "read", "unread", "all"
    pub tag: Option<String>,
    pub favorites_only: bool,
    pub search_query: Option<String>,
}
