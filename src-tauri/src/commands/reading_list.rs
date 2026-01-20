use crate::models::reading_list::{Article, ArticleStats, ArticleFilter};
use crate::services::reading_list_service::ReadingListService;
use tauri::State;

// Type alias for backwards compatibility with browser_tab_manager and session_manager
pub type ReadingListItem = Article;

#[tauri::command]
pub async fn get_all_articles(
    state: State<'_, ReadingListService>,
) -> Result<Vec<Article>, String> {
    state.get_all_articles()
}

#[tauri::command]
pub async fn get_article(
    id: String,
    state: State<'_, ReadingListService>,
) -> Result<Option<Article>, String> {
    state.get_article(&id)
}

#[tauri::command]
pub async fn add_article(
    article: Article,
    state: State<'_, ReadingListService>,
) -> Result<(), String> {
    state.add_article(&article)
}

#[tauri::command]
pub async fn update_article(
    article: Article,
    state: State<'_, ReadingListService>,
) -> Result<(), String> {
    state.update_article(&article)
}

#[tauri::command]
pub async fn delete_article(
    id: String,
    state: State<'_, ReadingListService>,
) -> Result<(), String> {
    state.delete_article(&id)
}

#[tauri::command]
pub async fn mark_article_as_read(
    id: String,
    state: State<'_, ReadingListService>,
) -> Result<(), String> {
    state.mark_as_read(&id)
}

#[tauri::command]
pub async fn mark_article_as_unread(
    id: String,
    state: State<'_, ReadingListService>,
) -> Result<(), String> {
    state.mark_as_unread(&id)
}

#[tauri::command]
pub async fn update_article_progress(
    id: String,
    progress: f32,
    state: State<'_, ReadingListService>,
) -> Result<(), String> {
    state.update_progress(&id, progress)
}

#[tauri::command]
pub async fn toggle_article_favorite(
    id: String,
    state: State<'_, ReadingListService>,
) -> Result<bool, String> {
    state.toggle_favorite(&id)
}

#[tauri::command]
pub async fn search_reading_list(
    filter: ArticleFilter,
    state: State<'_, ReadingListService>,
) -> Result<Vec<Article>, String> {
    state.search_articles(&filter)
}

#[tauri::command]
pub async fn get_reading_list_stats(
    state: State<'_, ReadingListService>,
) -> Result<ArticleStats, String> {
    state.get_stats()
}

#[tauri::command]
pub async fn get_reading_list_tags(
    state: State<'_, ReadingListService>,
) -> Result<Vec<String>, String> {
    state.get_all_tags()
}
