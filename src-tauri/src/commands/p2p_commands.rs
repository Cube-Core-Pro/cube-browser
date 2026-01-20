/**
 * CUBE Elite - P2P File Sharing Commands
 *
 * Tauri commands for P2P file transfer functionality
 */
use crate::services::p2p_service::{P2PRoom, P2PService, P2PTransfer};
use std::path::PathBuf;
use std::sync::Arc;
use tauri::State;

/// Create new P2P room as host
#[tauri::command]
pub async fn p2p_create_room(
    max_peers: usize,
    service: State<'_, Arc<P2PService>>,
) -> Result<P2PRoom, String> {
    service
        .create_room(max_peers)
        .await
        .map_err(|e| format!("Failed to create room: {}", e))
}

/// Join existing room with code
#[tauri::command]
pub async fn p2p_join_room(
    room_code: String,
    service: State<'_, Arc<P2PService>>,
) -> Result<P2PRoom, String> {
    service
        .join_room(room_code)
        .await
        .map_err(|e| format!("Failed to join room: {}", e))
}

/// Leave room
#[tauri::command]
pub async fn p2p_leave_room(
    room_id: String,
    service: State<'_, Arc<P2PService>>,
) -> Result<(), String> {
    service
        .leave_room(room_id)
        .await
        .map_err(|e| format!("Failed to leave room: {}", e))
}

/// Send file to peers in room
#[tauri::command]
pub async fn p2p_send_file(
    room_id: String,
    file_path: String,
    service: State<'_, Arc<P2PService>>,
) -> Result<String, String> {
    let path = PathBuf::from(file_path);
    service
        .send_file(room_id, path)
        .await
        .map_err(|e| format!("Failed to send file: {}", e))
}

/// Receive file from peer
#[tauri::command]
pub async fn p2p_receive_file(
    transfer_id: String,
    save_path: String,
    service: State<'_, Arc<P2PService>>,
) -> Result<(), String> {
    let path = PathBuf::from(save_path);
    service
        .receive_file(transfer_id, path)
        .await
        .map_err(|e| format!("Failed to receive file: {}", e))
}

/// Cancel transfer
#[tauri::command]
pub async fn p2p_cancel_transfer(
    transfer_id: String,
    service: State<'_, Arc<P2PService>>,
) -> Result<(), String> {
    service
        .cancel_transfer(transfer_id)
        .await
        .map_err(|e| format!("Failed to cancel transfer: {}", e))
}

/// Get transfer details
#[tauri::command]
pub async fn p2p_get_transfer(
    transfer_id: String,
    service: State<'_, Arc<P2PService>>,
) -> Result<P2PTransfer, String> {
    service
        .get_transfer(&transfer_id)
        .ok_or_else(|| "Transfer not found".to_string())
}

/// List all active transfers
#[tauri::command]
pub async fn p2p_list_transfers(
    service: State<'_, Arc<P2PService>>,
) -> Result<Vec<P2PTransfer>, String> {
    Ok(service.list_transfers())
}

/// Get room details
#[tauri::command]
pub async fn p2p_get_room(
    room_id: String,
    service: State<'_, Arc<P2PService>>,
) -> Result<P2PRoom, String> {
    service
        .get_room(&room_id)
        .ok_or_else(|| "Room not found".to_string())
}

/// List all active rooms
#[tauri::command]
pub async fn p2p_list_rooms(service: State<'_, Arc<P2PService>>) -> Result<Vec<P2PRoom>, String> {
    Ok(service.list_rooms())
}

/// Get STUN/TURN server configuration
#[tauri::command]
pub async fn p2p_get_ice_servers(
    _service: State<'_, Arc<P2PService>>,
) -> Result<serde_json::Value, String> {
    // Return ICE server configuration for WebRTC
    let stun_servers = vec![
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun.mozilla.org:3478",
    ];

    let turn_servers = vec![serde_json::json!({
        "urls": "turn:numb.viagenie.ca",
        "username": "webrtc@live.com",
        "credential": "muazkh"
    })];

    Ok(serde_json::json!({
        "stun": stun_servers,
        "turn": turn_servers
    }))
}

/// Get downloads directory path
#[tauri::command]
pub async fn get_downloads_dir() -> Result<String, String> {
    dirs::download_dir()
        .and_then(|p| p.to_str().map(|s| s.to_string()))
        .ok_or_else(|| "Failed to get downloads directory".to_string())
}
