// Collections Models
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Collection {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub icon: String,
    pub color: String,
    pub parent_id: Option<String>,
    pub page_count: i32,
    pub created_at: i64,
    pub updated_at: i64,
    pub is_shared: bool,
    pub is_favorite: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollectionPage {
    pub id: String,
    pub collection_id: String,
    pub url: String,
    pub title: String,
    pub screenshot: Option<String>,
    pub notes: Option<String>,
    pub tags: Vec<String>,
    pub added_at: i64,
    pub last_visited: Option<i64>,
    pub visit_count: i32,
    pub is_favorite: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollectionStats {
    pub total_collections: i32,
    pub total_pages: i32,
    pub shared_collections: i32,
    pub favorite_collections: i32,
    pub favorite_pages: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollectionShare {
    pub id: String,
    pub collection_id: String,
    pub share_token: String,
    pub password: Option<String>,
    pub expires_at: Option<i64>,
    pub created_at: i64,
    pub view_count: i32,
    pub max_views: Option<i32>,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollectionFilter {
    pub parent_id: Option<String>,
    pub search: Option<String>,
    pub shared_only: bool,
    pub favorites_only: bool,
}
