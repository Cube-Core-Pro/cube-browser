// Video Conference Commands - Tauri Interface
// CUBE Elite v6 - Production-Ready Implementation

use crate::services::video_conference_service::{
    ConferenceRoom, MediaStreamConfig, NetworkStats, Participant, RecordingSession, RoomSettings,
    VideoConferenceService,
};
use std::sync::Arc;
use tauri::State;

/// Create a new conference room
#[tauri::command]
pub async fn conference_create_room(
    service: State<'_, Arc<VideoConferenceService>>,
    room_name: String,
    host_id: String,
    max_participants: usize,
    settings: Option<RoomSettings>,
) -> Result<ConferenceRoom, String> {
    service
        .create_room(room_name, host_id, max_participants, settings)
        .await
        .map_err(|e| e.to_string())
}

/// Join a conference room
#[tauri::command]
pub async fn conference_join_room(
    service: State<'_, Arc<VideoConferenceService>>,
    access_code: String,
    display_name: String,
    user_id: Option<String>,
    password: Option<String>,
) -> Result<(ConferenceRoom, Participant), String> {
    service
        .join_room(access_code, display_name, user_id, password)
        .await
        .map_err(|e| e.to_string())
}

/// Leave a conference room
#[tauri::command]
pub async fn conference_leave_room(
    service: State<'_, Arc<VideoConferenceService>>,
    room_id: String,
    participant_id: String,
) -> Result<(), String> {
    service
        .leave_room(room_id, participant_id)
        .await
        .map_err(|e| e.to_string())
}

/// Toggle audio mute
#[tauri::command]
pub async fn conference_toggle_audio(
    service: State<'_, Arc<VideoConferenceService>>,
    room_id: String,
    participant_id: String,
    muted: bool,
) -> Result<(), String> {
    service
        .toggle_audio(room_id, participant_id, muted)
        .await
        .map_err(|e| e.to_string())
}

/// Toggle video
#[tauri::command]
pub async fn conference_toggle_video(
    service: State<'_, Arc<VideoConferenceService>>,
    room_id: String,
    participant_id: String,
    enabled: bool,
) -> Result<(), String> {
    service
        .toggle_video(room_id, participant_id, enabled)
        .await
        .map_err(|e| e.to_string())
}

/// Start screen sharing
#[tauri::command]
pub async fn conference_start_screen_share(
    service: State<'_, Arc<VideoConferenceService>>,
    room_id: String,
    participant_id: String,
) -> Result<String, String> {
    service
        .start_screen_share(room_id, participant_id)
        .await
        .map_err(|e| e.to_string())
}

/// Stop screen sharing
#[tauri::command]
pub async fn conference_stop_screen_share(
    service: State<'_, Arc<VideoConferenceService>>,
    room_id: String,
    participant_id: String,
) -> Result<(), String> {
    service
        .stop_screen_share(room_id, participant_id)
        .await
        .map_err(|e| e.to_string())
}

/// Toggle hand raised
#[tauri::command]
pub async fn conference_toggle_hand(
    service: State<'_, Arc<VideoConferenceService>>,
    room_id: String,
    participant_id: String,
    raised: bool,
) -> Result<(), String> {
    service
        .toggle_hand(room_id, participant_id, raised)
        .await
        .map_err(|e| e.to_string())
}

/// Start recording
#[tauri::command]
pub async fn conference_start_recording(
    service: State<'_, Arc<VideoConferenceService>>,
    room_id: String,
    output_path: String,
) -> Result<String, String> {
    service
        .start_recording(room_id, output_path)
        .await
        .map_err(|e| e.to_string())
}

/// Stop recording
#[tauri::command]
pub async fn conference_stop_recording(
    service: State<'_, Arc<VideoConferenceService>>,
    recording_id: String,
) -> Result<RecordingSession, String> {
    service
        .stop_recording(recording_id)
        .await
        .map_err(|e| e.to_string())
}

/// Get room details
#[tauri::command]
pub async fn conference_get_room(
    service: State<'_, Arc<VideoConferenceService>>,
    room_id: String,
) -> Result<ConferenceRoom, String> {
    service.get_room(room_id).await.map_err(|e| e.to_string())
}

/// List all active rooms
#[tauri::command]
pub async fn conference_list_rooms(
    service: State<'_, Arc<VideoConferenceService>>,
) -> Result<Vec<ConferenceRoom>, String> {
    Ok(service.list_rooms().await)
}

/// Get participants in a room
#[tauri::command]
pub async fn conference_get_participants(
    service: State<'_, Arc<VideoConferenceService>>,
    room_id: String,
) -> Result<Vec<Participant>, String> {
    service
        .get_participants(room_id)
        .await
        .map_err(|e| e.to_string())
}

/// Get media streams in a room
#[tauri::command]
pub async fn conference_get_streams(
    service: State<'_, Arc<VideoConferenceService>>,
    room_id: String,
) -> Result<Vec<MediaStreamConfig>, String> {
    service
        .get_streams(room_id)
        .await
        .map_err(|e| e.to_string())
}

/// Update participant network statistics
#[tauri::command]
pub async fn conference_update_stats(
    service: State<'_, Arc<VideoConferenceService>>,
    room_id: String,
    participant_id: String,
    stats: NetworkStats,
) -> Result<(), String> {
    service
        .update_participant_stats(room_id, participant_id, stats)
        .await
        .map_err(|e| e.to_string())
}

/// Get ICE servers configuration
#[tauri::command]
pub async fn conference_get_ice_servers(
    service: State<'_, Arc<VideoConferenceService>>,
) -> Result<serde_json::Value, String> {
    Ok(service.get_ice_servers())
}
