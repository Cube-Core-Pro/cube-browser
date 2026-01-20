// Collections Commands - Tauri Interface
use crate::models::collections::*;
use crate::services::collections_service::CollectionsService;
use std::sync::Mutex;
use tauri::State;

pub struct CollectionsState {
    pub service: Mutex<CollectionsService>,
}

// ============================================================================
// COLLECTION COMMANDS
// ============================================================================

#[tauri::command]
pub async fn get_all_collections(
    state: State<'_, CollectionsState>,
) -> Result<Vec<Collection>, String> {
    state
        .service
        .lock()
        .map_err(|e| e.to_string())?
        .get_all_collections()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_collection(
    id: String,
    state: State<'_, CollectionsState>,
) -> Result<Option<Collection>, String> {
    state
        .service
        .lock()
        .map_err(|e| e.to_string())?
        .get_collection(&id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_root_collections(
    state: State<'_, CollectionsState>,
) -> Result<Vec<Collection>, String> {
    state
        .service
        .lock()
        .map_err(|e| e.to_string())?
        .get_root_collections()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_child_collections(
    parent_id: String,
    state: State<'_, CollectionsState>,
) -> Result<Vec<Collection>, String> {
    state
        .service
        .lock()
        .map_err(|e| e.to_string())?
        .get_child_collections(&parent_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_collection(
    collection: Collection,
    state: State<'_, CollectionsState>,
) -> Result<(), String> {
    state
        .service
        .lock()
        .map_err(|e| e.to_string())?
        .create_collection(&collection)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_collection(
    collection: Collection,
    state: State<'_, CollectionsState>,
) -> Result<(), String> {
    state
        .service
        .lock()
        .map_err(|e| e.to_string())?
        .update_collection(&collection)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_collection(
    id: String,
    state: State<'_, CollectionsState>,
) -> Result<(), String> {
    state
        .service
        .lock()
        .map_err(|e| e.to_string())?
        .delete_collection(&id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn move_collection(
    id: String,
    new_parent_id: Option<String>,
    state: State<'_, CollectionsState>,
) -> Result<(), String> {
    state
        .service
        .lock()
        .map_err(|e| e.to_string())?
        .move_collection(&id, new_parent_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_collection_position(
    id: String,
    position: i32,
    state: State<'_, CollectionsState>,
) -> Result<(), String> {
    state
        .service
        .lock()
        .map_err(|e| e.to_string())?
        .update_collection_position(&id, position)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_favorite_collections(
    state: State<'_, CollectionsState>,
) -> Result<Vec<Collection>, String> {
    state
        .service
        .lock()
        .map_err(|e| e.to_string())?
        .get_favorite_collections()
        .map_err(|e| e.to_string())
}

// ============================================================================
// PAGE COMMANDS
// ============================================================================

#[tauri::command]
pub async fn get_collection_pages(
    collection_id: String,
    state: State<'_, CollectionsState>,
) -> Result<Vec<CollectionPage>, String> {
    state
        .service
        .lock()
        .map_err(|e| e.to_string())?
        .get_collection_pages(&collection_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_page(
    id: String,
    state: State<'_, CollectionsState>,
) -> Result<Option<CollectionPage>, String> {
    state
        .service
        .lock()
        .map_err(|e| e.to_string())?
        .get_page(&id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_page(
    page: CollectionPage,
    state: State<'_, CollectionsState>,
) -> Result<(), String> {
    state
        .service
        .lock()
        .map_err(|e| e.to_string())?
        .add_page(&page)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_page(
    page: CollectionPage,
    state: State<'_, CollectionsState>,
) -> Result<(), String> {
    state
        .service
        .lock()
        .map_err(|e| e.to_string())?
        .update_page(&page)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_page(
    id: String,
    state: State<'_, CollectionsState>,
) -> Result<(), String> {
    state
        .service
        .lock()
        .map_err(|e| e.to_string())?
        .delete_page(&id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn move_page(
    page_id: String,
    new_collection_id: String,
    state: State<'_, CollectionsState>,
) -> Result<(), String> {
    state
        .service
        .lock()
        .map_err(|e| e.to_string())?
        .move_page(&page_id, &new_collection_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_page_position(
    id: String,
    position: i32,
    state: State<'_, CollectionsState>,
) -> Result<(), String> {
    state
        .service
        .lock()
        .map_err(|e| e.to_string())?
        .update_page_position(&id, position)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn track_page_visit(
    id: String,
    state: State<'_, CollectionsState>,
) -> Result<(), String> {
    state
        .service
        .lock()
        .map_err(|e| e.to_string())?
        .track_page_visit(&id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_favorite_pages(
    state: State<'_, CollectionsState>,
) -> Result<Vec<CollectionPage>, String> {
    state
        .service
        .lock()
        .map_err(|e| e.to_string())?
        .get_favorite_pages()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_recent_pages(
    limit: i32,
    state: State<'_, CollectionsState>,
) -> Result<Vec<CollectionPage>, String> {
    state
        .service
        .lock()
        .map_err(|e| e.to_string())?
        .get_recent_pages(limit)
        .map_err(|e| e.to_string())
}

// ============================================================================
// SHARING COMMANDS
// ============================================================================

#[tauri::command]
pub async fn create_share(
    share: CollectionShare,
    state: State<'_, CollectionsState>,
) -> Result<(), String> {
    state
        .service
        .lock()
        .map_err(|e| e.to_string())?
        .create_share(&share)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_share_by_token(
    token: String,
    state: State<'_, CollectionsState>,
) -> Result<Option<CollectionShare>, String> {
    state
        .service
        .lock()
        .map_err(|e| e.to_string())?
        .get_share_by_token(&token)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_collection_shares(
    collection_id: String,
    state: State<'_, CollectionsState>,
) -> Result<Vec<CollectionShare>, String> {
    state
        .service
        .lock()
        .map_err(|e| e.to_string())?
        .get_collection_shares(&collection_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn increment_share_views(
    share_id: String,
    state: State<'_, CollectionsState>,
) -> Result<(), String> {
    state
        .service
        .lock()
        .map_err(|e| e.to_string())?
        .increment_share_views(&share_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn revoke_share(
    share_id: String,
    state: State<'_, CollectionsState>,
) -> Result<(), String> {
    state
        .service
        .lock()
        .map_err(|e| e.to_string())?
        .revoke_share(&share_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_share(
    share_id: String,
    state: State<'_, CollectionsState>,
) -> Result<(), String> {
    state
        .service
        .lock()
        .map_err(|e| e.to_string())?
        .delete_share(&share_id)
        .map_err(|e| e.to_string())
}

// ============================================================================
// SEARCH & STATISTICS COMMANDS
// ============================================================================

#[tauri::command]
pub async fn search_pages(
    query: String,
    state: State<'_, CollectionsState>,
) -> Result<Vec<CollectionPage>, String> {
    state
        .service
        .lock()
        .map_err(|e| e.to_string())?
        .search_pages(&query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_collections_stats(
    state: State<'_, CollectionsState>,
) -> Result<CollectionStats, String> {
    state
        .service
        .lock()
        .map_err(|e| e.to_string())?
        .get_stats()
        .map_err(|e| e.to_string())
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

#[tauri::command]
pub async fn bulk_add_pages(
    pages: Vec<CollectionPage>,
    state: State<'_, CollectionsState>,
) -> Result<BulkOperationResult, String> {
    let service = state.service.lock().map_err(|e| e.to_string())?;
    
    let mut succeeded = 0;
    let mut failed = 0;
    let mut errors = Vec::new();

    for page in pages {
        match service.add_page(&page) {
            Ok(_) => succeeded += 1,
            Err(e) => {
                failed += 1;
                errors.push(format!("Failed to add {}: {}", page.title, e));
            }
        }
    }

    Ok(BulkOperationResult {
        succeeded,
        failed,
        errors,
    })
}

#[tauri::command]
pub async fn bulk_delete_pages(
    page_ids: Vec<String>,
    state: State<'_, CollectionsState>,
) -> Result<BulkOperationResult, String> {
    let service = state.service.lock().map_err(|e| e.to_string())?;
    
    let mut succeeded = 0;
    let mut failed = 0;
    let mut errors = Vec::new();

    for id in page_ids {
        match service.delete_page(&id) {
            Ok(_) => succeeded += 1,
            Err(e) => {
                failed += 1;
                errors.push(format!("Failed to delete page {}: {}", id, e));
            }
        }
    }

    Ok(BulkOperationResult {
        succeeded,
        failed,
        errors,
    })
}

#[tauri::command]
pub async fn bulk_move_pages(
    page_ids: Vec<String>,
    target_collection_id: String,
    state: State<'_, CollectionsState>,
) -> Result<BulkOperationResult, String> {
    let service = state.service.lock().map_err(|e| e.to_string())?;
    
    let mut succeeded = 0;
    let mut failed = 0;
    let mut errors = Vec::new();

    for id in page_ids {
        match service.move_page(&id, &target_collection_id) {
            Ok(_) => succeeded += 1,
            Err(e) => {
                failed += 1;
                errors.push(format!("Failed to move page {}: {}", id, e));
            }
        }
    }

    Ok(BulkOperationResult {
        succeeded,
        failed,
        errors,
    })
}

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BulkOperationResult {
    pub succeeded: i32,
    pub failed: i32,
    pub errors: Vec<String>,
}
