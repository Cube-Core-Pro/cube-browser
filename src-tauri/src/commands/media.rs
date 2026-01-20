use crate::models::media::{MediaItem, Playlist, MediaStats, MediaFilter};
use crate::services::media_service::MediaService;
use tauri::State;

#[tauri::command]
pub async fn get_all_media(
    filter: Option<MediaFilter>,
    media_service: State<'_, MediaService>,
) -> Result<Vec<MediaItem>, String> {
    media_service.get_all_media(filter.as_ref())
}

#[tauri::command]
pub async fn get_media_item(
    id: String,
    media_service: State<'_, MediaService>,
) -> Result<Option<MediaItem>, String> {
    media_service.get_media_item(&id)
}

#[tauri::command]
pub async fn add_media_item(
    media: MediaItem,
    media_service: State<'_, MediaService>,
) -> Result<(), String> {
    media_service.add_media_item(&media)
}

#[tauri::command]
pub async fn update_media_item(
    media: MediaItem,
    media_service: State<'_, MediaService>,
) -> Result<(), String> {
    media_service.update_media_item(&media)
}

#[tauri::command]
pub async fn delete_media_item(
    id: String,
    media_service: State<'_, MediaService>,
) -> Result<(), String> {
    media_service.delete_media_item(&id)
}

#[tauri::command]
pub async fn increment_play_count(
    id: String,
    media_service: State<'_, MediaService>,
) -> Result<(), String> {
    media_service.increment_play_count(&id)
}

#[tauri::command]
pub async fn toggle_favorite_media(
    id: String,
    media_service: State<'_, MediaService>,
) -> Result<(), String> {
    media_service.toggle_favorite(&id)
}

#[tauri::command]
pub async fn get_all_playlists(
    media_service: State<'_, MediaService>,
) -> Result<Vec<Playlist>, String> {
    media_service.get_all_playlists()
}

#[tauri::command]
pub async fn create_playlist(
    playlist: Playlist,
    media_service: State<'_, MediaService>,
) -> Result<(), String> {
    media_service.create_playlist(&playlist)
}

#[tauri::command]
pub async fn add_to_playlist(
    playlist_id: String,
    media_id: String,
    media_service: State<'_, MediaService>,
) -> Result<(), String> {
    media_service.add_to_playlist(&playlist_id, &media_id)
}

#[tauri::command]
pub async fn remove_from_playlist(
    playlist_id: String,
    media_id: String,
    media_service: State<'_, MediaService>,
) -> Result<(), String> {
    media_service.remove_from_playlist(&playlist_id, &media_id)
}

#[tauri::command]
pub async fn get_media_stats(
    media_service: State<'_, MediaService>,
) -> Result<MediaStats, String> {
    media_service.get_stats()
}
