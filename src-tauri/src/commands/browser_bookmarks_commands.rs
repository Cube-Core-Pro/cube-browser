// CUBE Nexum - Bookmarks Commands
// 55 Tauri commands for bookmark management

use tauri::State;
use crate::services::browser_bookmarks::{
    BrowserBookmarksService, Bookmark, BookmarkSettings, BookmarkTag,
    BookmarkStats, BookmarkFilter, BookmarkTreeNode, ImportResult,
    BookmarkType, SortOrder, ViewMode, BookmarkSource
};

// ==================== Settings Commands ====================

#[tauri::command]
pub fn browser_bookmarks_get_settings(
    service: State<'_, BrowserBookmarksService>
) -> Result<BookmarkSettings, String> {
    Ok(service.get_settings())
}

#[tauri::command]
pub fn browser_bookmarks_update_settings(
    settings: BookmarkSettings,
    service: State<'_, BrowserBookmarksService>
) -> Result<(), String> {
    service.update_settings(settings)
}

// ==================== CRUD Commands ====================

#[tauri::command]
pub fn browser_bookmarks_create(
    title: String,
    url: String,
    parent_id: Option<String>,
    service: State<'_, BrowserBookmarksService>
) -> Result<Bookmark, String> {
    service.create_bookmark(title, url, parent_id)
}

#[tauri::command]
pub fn browser_bookmarks_create_folder(
    title: String,
    parent_id: Option<String>,
    service: State<'_, BrowserBookmarksService>
) -> Result<Bookmark, String> {
    service.create_folder(title, parent_id)
}

#[tauri::command]
pub fn browser_bookmarks_get(
    id: String,
    service: State<'_, BrowserBookmarksService>
) -> Result<Option<Bookmark>, String> {
    Ok(service.get_bookmark(&id))
}

#[tauri::command]
pub fn browser_bookmarks_update(
    id: String,
    bookmark: Bookmark,
    service: State<'_, BrowserBookmarksService>
) -> Result<Bookmark, String> {
    service.update_bookmark(&id, bookmark)
}

#[tauri::command]
pub fn browser_bookmarks_delete(
    id: String,
    service: State<'_, BrowserBookmarksService>
) -> Result<(), String> {
    service.delete_bookmark(&id)
}

#[tauri::command]
pub fn browser_bookmarks_get_all(
    service: State<'_, BrowserBookmarksService>
) -> Result<Vec<Bookmark>, String> {
    Ok(service.get_all_bookmarks())
}

// ==================== Movement Commands ====================

#[tauri::command]
pub fn browser_bookmarks_move(
    id: String,
    new_parent_id: String,
    position: Option<u32>,
    service: State<'_, BrowserBookmarksService>
) -> Result<(), String> {
    service.move_bookmark(&id, &new_parent_id, position)
}

#[tauri::command]
pub fn browser_bookmarks_reorder(
    id: String,
    new_position: u32,
    service: State<'_, BrowserBookmarksService>
) -> Result<(), String> {
    service.reorder_bookmark(&id, new_position)
}

#[tauri::command]
pub fn browser_bookmarks_move_to_bar(
    id: String,
    service: State<'_, BrowserBookmarksService>
) -> Result<(), String> {
    service.move_bookmark(&id, "bookmarks_bar", None)
}

#[tauri::command]
pub fn browser_bookmarks_move_to_other(
    id: String,
    service: State<'_, BrowserBookmarksService>
) -> Result<(), String> {
    service.move_bookmark(&id, "other_bookmarks", None)
}

// ==================== Tag Commands ====================

#[tauri::command]
pub fn browser_bookmarks_add_tag(
    bookmark_id: String,
    tag_name: String,
    service: State<'_, BrowserBookmarksService>
) -> Result<(), String> {
    service.add_tag(&bookmark_id, tag_name)
}

#[tauri::command]
pub fn browser_bookmarks_remove_tag(
    bookmark_id: String,
    tag_name: String,
    service: State<'_, BrowserBookmarksService>
) -> Result<(), String> {
    service.remove_tag(&bookmark_id, &tag_name)
}

#[tauri::command]
pub fn browser_bookmarks_get_all_tags(
    service: State<'_, BrowserBookmarksService>
) -> Result<Vec<BookmarkTag>, String> {
    Ok(service.get_all_tags())
}

#[tauri::command]
pub fn browser_bookmarks_get_by_tag(
    tag_name: String,
    service: State<'_, BrowserBookmarksService>
) -> Result<Vec<Bookmark>, String> {
    Ok(service.get_bookmarks_by_tag(&tag_name))
}

#[tauri::command]
pub fn browser_bookmarks_set_tags(
    bookmark_id: String,
    tags: Vec<String>,
    service: State<'_, BrowserBookmarksService>
) -> Result<(), String> {
    // Get current tags
    if let Some(bookmark) = service.get_bookmark(&bookmark_id) {
        // Remove old tags
        for tag in &bookmark.tags {
            let _ = service.remove_tag(&bookmark_id, tag);
        }
    }
    
    // Add new tags
    for tag in tags {
        service.add_tag(&bookmark_id, tag)?;
    }
    
    Ok(())
}

// ==================== Favorites Commands ====================

#[tauri::command]
pub fn browser_bookmarks_toggle_favorite(
    id: String,
    service: State<'_, BrowserBookmarksService>
) -> Result<bool, String> {
    service.toggle_favorite(&id)
}

#[tauri::command]
pub fn browser_bookmarks_set_favorite(
    id: String,
    is_favorite: bool,
    service: State<'_, BrowserBookmarksService>
) -> Result<(), String> {
    if let Some(mut bookmark) = service.get_bookmark(&id) {
        bookmark.is_favorite = is_favorite;
        service.update_bookmark(&id, bookmark)?;
        Ok(())
    } else {
        Err("Bookmark not found".to_string())
    }
}

#[tauri::command]
pub fn browser_bookmarks_get_favorites(
    service: State<'_, BrowserBookmarksService>
) -> Result<Vec<Bookmark>, String> {
    Ok(service.get_favorites())
}

// ==================== Search & Filter Commands ====================

#[tauri::command]
pub fn browser_bookmarks_search(
    query: String,
    service: State<'_, BrowserBookmarksService>
) -> Result<Vec<Bookmark>, String> {
    Ok(service.search(&query))
}

#[tauri::command]
pub fn browser_bookmarks_filter(
    filter: BookmarkFilter,
    service: State<'_, BrowserBookmarksService>
) -> Result<Vec<Bookmark>, String> {
    Ok(service.filter(filter))
}

#[tauri::command]
pub fn browser_bookmarks_search_by_url(
    url: String,
    service: State<'_, BrowserBookmarksService>
) -> Result<Option<Bookmark>, String> {
    Ok(service.check_url_exists(&url))
}

#[tauri::command]
pub fn browser_bookmarks_search_in_folder(
    folder_id: String,
    query: String,
    service: State<'_, BrowserBookmarksService>
) -> Result<Vec<Bookmark>, String> {
    let filter = BookmarkFilter {
        query: Some(query),
        folder_id: Some(folder_id),
        tags: None,
        is_favorite: None,
        bookmark_type: None,
        source: None,
        date_from: None,
        date_to: None,
        min_visits: None,
        sort_by: SortOrder::Manual,
        limit: None,
    };
    Ok(service.filter(filter))
}

// ==================== Tree Commands ====================

#[tauri::command]
pub fn browser_bookmarks_get_folder_contents(
    folder_id: String,
    service: State<'_, BrowserBookmarksService>
) -> Result<Vec<Bookmark>, String> {
    Ok(service.get_folder_contents(&folder_id))
}

#[tauri::command]
pub fn browser_bookmarks_get_tree(
    root_id: Option<String>,
    service: State<'_, BrowserBookmarksService>
) -> Result<Option<BookmarkTreeNode>, String> {
    let id = root_id.unwrap_or_else(|| "root".to_string());
    Ok(service.get_bookmark_tree(&id))
}

#[tauri::command]
pub fn browser_bookmarks_get_all_folders(
    service: State<'_, BrowserBookmarksService>
) -> Result<Vec<Bookmark>, String> {
    Ok(service.get_all_folders())
}

#[tauri::command]
pub fn browser_bookmarks_get_bar(
    service: State<'_, BrowserBookmarksService>
) -> Result<Vec<Bookmark>, String> {
    Ok(service.get_folder_contents("bookmarks_bar"))
}

#[tauri::command]
pub fn browser_bookmarks_get_other(
    service: State<'_, BrowserBookmarksService>
) -> Result<Vec<Bookmark>, String> {
    Ok(service.get_folder_contents("other_bookmarks"))
}

#[tauri::command]
pub fn browser_bookmarks_get_mobile(
    service: State<'_, BrowserBookmarksService>
) -> Result<Vec<Bookmark>, String> {
    Ok(service.get_folder_contents("mobile_bookmarks"))
}

// ==================== Visit Tracking Commands ====================

#[tauri::command]
pub fn browser_bookmarks_record_visit(
    id: String,
    service: State<'_, BrowserBookmarksService>
) -> Result<(), String> {
    service.record_visit(&id)
}

#[tauri::command]
pub fn browser_bookmarks_get_most_visited(
    limit: Option<u32>,
    service: State<'_, BrowserBookmarksService>
) -> Result<Vec<Bookmark>, String> {
    Ok(service.get_most_visited(limit.unwrap_or(20)))
}

#[tauri::command]
pub fn browser_bookmarks_get_recently_added(
    limit: Option<u32>,
    service: State<'_, BrowserBookmarksService>
) -> Result<Vec<Bookmark>, String> {
    Ok(service.get_recently_added(limit.unwrap_or(20)))
}

#[tauri::command]
pub fn browser_bookmarks_get_recently_used(
    limit: Option<u32>,
    service: State<'_, BrowserBookmarksService>
) -> Result<Vec<Bookmark>, String> {
    Ok(service.get_recently_used(limit.unwrap_or(20)))
}

// ==================== Statistics Commands ====================

#[tauri::command]
pub fn browser_bookmarks_get_stats(
    service: State<'_, BrowserBookmarksService>
) -> Result<BookmarkStats, String> {
    Ok(service.get_stats())
}

#[tauri::command]
pub fn browser_bookmarks_get_count(
    service: State<'_, BrowserBookmarksService>
) -> Result<u64, String> {
    Ok(service.get_stats().total_bookmarks)
}

#[tauri::command]
pub fn browser_bookmarks_get_folder_count(
    service: State<'_, BrowserBookmarksService>
) -> Result<u64, String> {
    Ok(service.get_stats().total_folders)
}

// ==================== Import/Export Commands ====================

#[tauri::command]
pub fn browser_bookmarks_export_json(
    service: State<'_, BrowserBookmarksService>
) -> Result<String, String> {
    service.export_bookmarks()
}

#[tauri::command]
pub fn browser_bookmarks_export_html(
    service: State<'_, BrowserBookmarksService>
) -> Result<String, String> {
    service.export_html()
}

#[tauri::command]
pub fn browser_bookmarks_import_json(
    json: String,
    service: State<'_, BrowserBookmarksService>
) -> Result<ImportResult, String> {
    service.import_json(&json)
}

#[tauri::command]
pub async fn browser_bookmarks_import_from_file(
    path: String,
    service: State<'_, BrowserBookmarksService>
) -> Result<ImportResult, String> {
    let content = tokio::fs::read_to_string(&path).await
        .map_err(|e| format!("Failed to read file: {}", e))?;
    
    // Detect format
    if content.trim().starts_with('{') || content.trim().starts_with('[') {
        service.import_json(&content)
    } else {
        // Parse HTML bookmarks format (Netscape Bookmark File Format)
        service.import_html(&content)
    }
}

#[tauri::command]
pub async fn browser_bookmarks_export_to_file(
    path: String,
    format: String,
    service: State<'_, BrowserBookmarksService>
) -> Result<(), String> {
    let content = match format.as_str() {
        "json" => service.export_bookmarks()?,
        "html" => service.export_html()?,
        _ => return Err("Invalid format. Use 'json' or 'html'".to_string()),
    };
    
    tokio::fs::write(&path, content).await
        .map_err(|e| format!("Failed to write file: {}", e))
}

// ==================== Utility Commands ====================

#[tauri::command]
pub fn browser_bookmarks_check_url_exists(
    url: String,
    service: State<'_, BrowserBookmarksService>
) -> Result<Option<Bookmark>, String> {
    Ok(service.check_url_exists(&url))
}

#[tauri::command]
pub fn browser_bookmarks_find_duplicates(
    service: State<'_, BrowserBookmarksService>
) -> Result<Vec<(Bookmark, Bookmark)>, String> {
    Ok(service.find_duplicates())
}

#[tauri::command]
pub fn browser_bookmarks_cleanup_orphaned(
    service: State<'_, BrowserBookmarksService>
) -> Result<u32, String> {
    Ok(service.cleanup_orphaned())
}

// ==================== Quick Actions Commands ====================

#[tauri::command]
pub fn browser_bookmarks_quick_add(
    url: String,
    title: String,
    service: State<'_, BrowserBookmarksService>
) -> Result<Bookmark, String> {
    // Add to default folder (bookmarks bar)
    service.create_bookmark(title, url, None)
}

#[tauri::command]
pub fn browser_bookmarks_quick_add_to_folder(
    url: String,
    title: String,
    folder_name: String,
    service: State<'_, BrowserBookmarksService>
) -> Result<Bookmark, String> {
    // Find or create folder
    let folders = service.get_all_folders();
    let folder_id = folders.iter()
        .find(|f| f.title.to_lowercase() == folder_name.to_lowercase())
        .map(|f| f.id.clone());
    
    let target_folder = match folder_id {
        Some(id) => id,
        None => {
            // Create new folder
            let folder = service.create_folder(folder_name, Some("bookmarks_bar".to_string()))?;
            folder.id
        }
    };
    
    service.create_bookmark(title, url, Some(target_folder))
}

// ==================== Batch Operations Commands ====================

#[tauri::command]
pub fn browser_bookmarks_batch_delete(
    ids: Vec<String>,
    service: State<'_, BrowserBookmarksService>
) -> Result<u32, String> {
    let mut deleted = 0;
    for id in ids {
        if service.delete_bookmark(&id).is_ok() {
            deleted += 1;
        }
    }
    Ok(deleted)
}

#[tauri::command]
pub fn browser_bookmarks_batch_move(
    ids: Vec<String>,
    target_folder_id: String,
    service: State<'_, BrowserBookmarksService>
) -> Result<u32, String> {
    let mut moved = 0;
    for id in ids {
        if service.move_bookmark(&id, &target_folder_id, None).is_ok() {
            moved += 1;
        }
    }
    Ok(moved)
}

#[tauri::command]
pub fn browser_bookmarks_batch_add_tag(
    ids: Vec<String>,
    tag: String,
    service: State<'_, BrowserBookmarksService>
) -> Result<u32, String> {
    let mut tagged = 0;
    for id in ids {
        if service.add_tag(&id, tag.clone()).is_ok() {
            tagged += 1;
        }
    }
    Ok(tagged)
}

#[tauri::command]
pub fn browser_bookmarks_batch_set_favorite(
    ids: Vec<String>,
    is_favorite: bool,
    service: State<'_, BrowserBookmarksService>
) -> Result<u32, String> {
    let mut updated = 0;
    for id in ids {
        if let Some(mut bookmark) = service.get_bookmark(&id) {
            bookmark.is_favorite = is_favorite;
            if service.update_bookmark(&id, bookmark).is_ok() {
                updated += 1;
            }
        }
    }
    Ok(updated)
}
