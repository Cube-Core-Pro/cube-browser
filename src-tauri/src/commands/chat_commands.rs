// Chat Commands - Tauri Interface
// CUBE Elite v6 - Production-Ready Implementation

use crate::services::chat_service::{
    Attachment, ChatMessage, ChatRoom, ChatRoomSettings, ChatService, MessageType, RoomType,
    TypingIndicator, UserStatus,
};
use std::sync::Arc;
use tauri::State;

/// Create a new chat room
#[tauri::command]
pub async fn chat_create_room(
    service: State<'_, Arc<ChatService>>,
    room_name: String,
    room_type: RoomType,
    owner_id: String,
    participant_ids: Vec<String>,
    settings: Option<ChatRoomSettings>,
    enable_encryption: bool,
) -> Result<ChatRoom, String> {
    service
        .create_room(
            room_name,
            room_type,
            owner_id,
            participant_ids,
            settings,
            enable_encryption,
        )
        .await
        .map_err(|e| e.to_string())
}

/// Join a chat room
#[tauri::command]
pub async fn chat_join_room(
    service: State<'_, Arc<ChatService>>,
    room_id: String,
    user_id: String,
    display_name: String,
) -> Result<ChatRoom, String> {
    service
        .join_room(room_id, user_id, display_name)
        .await
        .map_err(|e| e.to_string())
}

/// Leave a chat room
#[tauri::command]
pub async fn chat_leave_room(
    service: State<'_, Arc<ChatService>>,
    room_id: String,
    user_id: String,
) -> Result<(), String> {
    service
        .leave_room(room_id, user_id)
        .await
        .map_err(|e| e.to_string())
}

/// Send a message
#[tauri::command]
pub async fn chat_send_message(
    service: State<'_, Arc<ChatService>>,
    room_id: String,
    sender_id: String,
    sender_name: String,
    message_type: MessageType,
    content: String,
    reply_to: Option<String>,
    attachments: Vec<Attachment>,
    mentions: Vec<String>,
) -> Result<ChatMessage, String> {
    service
        .send_message(
            room_id,
            sender_id,
            sender_name,
            message_type,
            content,
            reply_to,
            attachments,
            mentions,
        )
        .await
        .map_err(|e| e.to_string())
}

/// Get messages from a room
#[tauri::command]
pub async fn chat_get_messages(
    service: State<'_, Arc<ChatService>>,
    room_id: String,
    limit: Option<usize>,
    before: Option<String>,
) -> Result<Vec<ChatMessage>, String> {
    service
        .get_messages(room_id, limit, before)
        .await
        .map_err(|e| e.to_string())
}

/// Mark message as read
#[tauri::command]
pub async fn chat_mark_as_read(
    service: State<'_, Arc<ChatService>>,
    room_id: String,
    user_id: String,
    message_id: String,
) -> Result<(), String> {
    service
        .mark_as_read(room_id, user_id, message_id)
        .await
        .map_err(|e| e.to_string())
}

/// Add reaction to message
#[tauri::command]
pub async fn chat_add_reaction(
    service: State<'_, Arc<ChatService>>,
    room_id: String,
    message_id: String,
    user_id: String,
    emoji: String,
) -> Result<(), String> {
    service
        .add_reaction(room_id, message_id, user_id, emoji)
        .await
        .map_err(|e| e.to_string())
}

/// Remove reaction from message
#[tauri::command]
pub async fn chat_remove_reaction(
    service: State<'_, Arc<ChatService>>,
    room_id: String,
    message_id: String,
    user_id: String,
    emoji: String,
) -> Result<(), String> {
    service
        .remove_reaction(room_id, message_id, user_id, emoji)
        .await
        .map_err(|e| e.to_string())
}

/// Edit message
#[tauri::command]
pub async fn chat_edit_message(
    service: State<'_, Arc<ChatService>>,
    room_id: String,
    message_id: String,
    sender_id: String,
    new_content: String,
) -> Result<ChatMessage, String> {
    service
        .edit_message(room_id, message_id, sender_id, new_content)
        .await
        .map_err(|e| e.to_string())
}

/// Delete message
#[tauri::command]
pub async fn chat_delete_message(
    service: State<'_, Arc<ChatService>>,
    room_id: String,
    message_id: String,
    user_id: String,
) -> Result<(), String> {
    service
        .delete_message(room_id, message_id, user_id)
        .await
        .map_err(|e| e.to_string())
}

/// Set typing indicator
#[tauri::command]
pub async fn chat_set_typing(
    service: State<'_, Arc<ChatService>>,
    room_id: String,
    user_id: String,
    display_name: String,
    is_typing: bool,
) -> Result<(), String> {
    service
        .set_typing(room_id, user_id, display_name, is_typing)
        .await
        .map_err(|e| e.to_string())
}

/// Get typing indicators for a room
#[tauri::command]
pub async fn chat_get_typing_indicators(
    service: State<'_, Arc<ChatService>>,
    room_id: String,
) -> Result<Vec<TypingIndicator>, String> {
    Ok(service.get_typing_indicators(room_id).await)
}

/// Get room details
#[tauri::command]
pub async fn chat_get_room(
    service: State<'_, Arc<ChatService>>,
    room_id: String,
) -> Result<ChatRoom, String> {
    service.get_room(room_id).await.map_err(|e| e.to_string())
}

/// List all rooms for a user
#[tauri::command]
pub async fn chat_list_rooms(
    service: State<'_, Arc<ChatService>>,
    user_id: String,
) -> Result<Vec<ChatRoom>, String> {
    Ok(service.list_rooms(user_id).await)
}

/// Search messages
#[tauri::command]
pub async fn chat_search_messages(
    service: State<'_, Arc<ChatService>>,
    room_id: String,
    query: String,
    limit: usize,
) -> Result<Vec<ChatMessage>, String> {
    service
        .search_messages(room_id, query, limit)
        .await
        .map_err(|e| e.to_string())
}

/// Update participant status
#[tauri::command]
pub async fn chat_update_status(
    service: State<'_, Arc<ChatService>>,
    user_id: String,
    status: UserStatus,
) -> Result<(), String> {
    service
        .update_status(user_id, status)
        .await
        .map_err(|e| e.to_string())
}
