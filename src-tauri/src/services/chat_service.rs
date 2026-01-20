// Native Chat Service - Enterprise Messaging System
// CUBE Elite v6 - Production-Ready Implementation
// Standards: Fortune 500, Zero Omissions, Elite Quality

use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use anyhow::{bail, Context, Result};
use base64::{engine::general_purpose, Engine as _};
use chrono::{DateTime, Utc};
use rand::Rng;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::sync::Mutex;
use uuid::Uuid;

/// Chat room with participants and messages
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatRoom {
    /// Unique room identifier
    pub room_id: String,
    /// Room name
    pub room_name: String,
    /// Room type
    pub room_type: RoomType,
    /// Room owner ID
    pub owner_id: String,
    /// Participant IDs
    pub participant_ids: Vec<String>,
    /// Creation timestamp
    pub created_at: DateTime<Utc>,
    /// Last message timestamp
    pub last_message_at: Option<DateTime<Utc>>,
    /// Unread count per participant
    pub unread_counts: HashMap<String, usize>,
    /// Room settings
    pub settings: ChatRoomSettings,
    /// End-to-end encryption enabled
    pub is_encrypted: bool,
}

/// Room type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum RoomType {
    Direct,  // 1-on-1 chat
    Group,   // Group chat
    Channel, // Broadcast channel
}

/// Room settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatRoomSettings {
    /// Allow file attachments
    pub allow_attachments: bool,
    /// Allow voice messages
    pub allow_voice: bool,
    /// Allow video messages
    pub allow_video: bool,
    /// Message retention days (0 = forever)
    pub retention_days: u32,
    /// Max message length
    pub max_message_length: usize,
    /// Require admin approval for new members
    pub require_approval: bool,
}

/// Chat message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    /// Unique message identifier
    pub message_id: String,
    /// Room ID
    pub room_id: String,
    /// Sender ID
    pub sender_id: String,
    /// Sender display name
    pub sender_name: String,
    /// Message type
    pub message_type: MessageType,
    /// Message content
    pub content: String,
    /// Is encrypted
    pub is_encrypted: bool,
    /// Reply to message ID
    pub reply_to: Option<String>,
    /// Attachments
    pub attachments: Vec<Attachment>,
    /// Reactions
    pub reactions: HashMap<String, Vec<String>>,
    /// Mentions
    pub mentions: Vec<String>,
    /// Timestamp
    pub timestamp: DateTime<Utc>,
    /// Edit timestamp
    pub edited_at: Option<DateTime<Utc>>,
    /// Delivery status
    pub status: MessageStatus,
    /// Read by participant IDs
    pub read_by: Vec<String>,
}

/// Message type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum MessageType {
    Text,
    Image,
    Video,
    Audio,
    File,
    Voice,
    System,
}

/// Message status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[derive(Default)]
pub enum MessageStatus {
    #[default]
    Sending,
    Sent,
    Delivered,
    Read,
    Failed,
}

/// Message attachment
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Attachment {
    /// Attachment ID
    pub attachment_id: String,
    /// File name
    pub file_name: String,
    /// MIME type
    pub mime_type: String,
    /// File size in bytes
    pub file_size: u64,
    /// File path or URL
    pub file_path: String,
    /// Thumbnail path (for images/videos)
    pub thumbnail_path: Option<String>,
    /// Duration in seconds (for audio/video)
    pub duration_seconds: Option<u32>,
}

/// Chat participant
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatParticipant {
    /// User ID
    pub user_id: String,
    /// Display name
    pub display_name: String,
    /// Avatar URL
    pub avatar_url: Option<String>,
    /// Status
    pub status: UserStatus,
    /// Last seen timestamp
    pub last_seen: DateTime<Utc>,
    /// Typing status
    pub is_typing: bool,
    /// Role in room
    pub role: ParticipantRole,
}

/// User status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum UserStatus {
    Online,
    Away,
    Busy,
    Offline,
}

/// Participant role
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ParticipantRole {
    Owner,
    Admin,
    Member,
    Guest,
}

/// Typing indicator
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TypingIndicator {
    pub room_id: String,
    pub user_id: String,
    pub display_name: String,
    pub timestamp: DateTime<Utc>,
}

impl Default for ChatRoomSettings {
    fn default() -> Self {
        Self {
            allow_attachments: true,
            allow_voice: true,
            allow_video: true,
            retention_days: 0, // Keep forever
            max_message_length: 10000,
            require_approval: false,
        }
    }
}


/// Native Chat Service
pub struct ChatService {
    /// Active chat rooms
    rooms: Arc<Mutex<HashMap<String, ChatRoom>>>,
    /// Messages by room ID
    messages: Arc<Mutex<HashMap<String, Vec<ChatMessage>>>>,
    /// Participants by user ID
    participants: Arc<Mutex<HashMap<String, ChatParticipant>>>,
    /// Typing indicators by room ID
    typing_indicators: Arc<Mutex<HashMap<String, Vec<TypingIndicator>>>>,
    /// Encryption keys by room ID
    encryption_keys: Arc<Mutex<HashMap<String, Vec<u8>>>>,
    /// App handle for events
    app_handle: AppHandle,
}

impl ChatService {
    /// Create new chat service
    pub fn new(app_handle: AppHandle) -> Self {
        Self {
            rooms: Arc::new(Mutex::new(HashMap::new())),
            messages: Arc::new(Mutex::new(HashMap::new())),
            participants: Arc::new(Mutex::new(HashMap::new())),
            typing_indicators: Arc::new(Mutex::new(HashMap::new())),
            encryption_keys: Arc::new(Mutex::new(HashMap::new())),
            app_handle,
        }
    }

    /// Create a new chat room
    pub async fn create_room(
        &self,
        room_name: String,
        room_type: RoomType,
        owner_id: String,
        participant_ids: Vec<String>,
        settings: Option<ChatRoomSettings>,
        enable_encryption: bool,
    ) -> Result<ChatRoom> {
        let room_id = Uuid::new_v4().to_string();

        let mut all_participants = participant_ids.clone();
        if !all_participants.contains(&owner_id) {
            all_participants.push(owner_id.clone());
        }

        let room = ChatRoom {
            room_id: room_id.clone(),
            room_name,
            room_type,
            owner_id,
            participant_ids: all_participants.clone(),
            created_at: Utc::now(),
            last_message_at: None,
            unread_counts: all_participants.iter().map(|id| (id.clone(), 0)).collect(),
            settings: settings.unwrap_or_default(),
            is_encrypted: enable_encryption,
        };

        // Generate encryption key if enabled
        if enable_encryption {
            let key = self.generate_encryption_key();
            let mut keys = self.encryption_keys.lock().await;
            keys.insert(room_id.clone(), key);
        }

        let mut rooms = self.rooms.lock().await;
        rooms.insert(room_id.clone(), room.clone());

        // Initialize message list for this room
        let mut messages = self.messages.lock().await;
        messages.insert(room_id.clone(), Vec::new());

        // Emit event
        let _ = self.app_handle.emit("chat:room_created", &room);

        tracing::info!("✅ Chat room created: {} ({})", room.room_name, room_id);
        Ok(room)
    }

    /// Join a chat room
    pub async fn join_room(
        &self,
        room_id: String,
        user_id: String,
        display_name: String,
    ) -> Result<ChatRoom> {
        let mut rooms = self.rooms.lock().await;
        let room = rooms.get_mut(&room_id).context("Room not found")?;

        // Check if already a member
        if room.participant_ids.contains(&user_id) {
            return Ok(room.clone());
        }

        // Add participant
        room.participant_ids.push(user_id.clone());
        room.unread_counts.insert(user_id.clone(), 0);

        // Register participant
        let mut participants = self.participants.lock().await;
        participants.insert(
            user_id.clone(),
            ChatParticipant {
                user_id: user_id.clone(),
                display_name: display_name.clone(),
                avatar_url: None,
                status: UserStatus::Online,
                last_seen: Utc::now(),
                is_typing: false,
                role: ParticipantRole::Member,
            },
        );

        // Emit event
        let _ = self.app_handle.emit(
            "chat:participant_joined",
            serde_json::json!({
                "room_id": room_id,
                "user_id": user_id,
                "display_name": display_name,
            }),
        );

        tracing::info!("✅ User {} joined room {}", display_name, room_id);
        Ok(room.clone())
    }

    /// Leave a chat room
    pub async fn leave_room(&self, room_id: String, user_id: String) -> Result<()> {
        let mut rooms = self.rooms.lock().await;
        let room = rooms.get_mut(&room_id).context("Room not found")?;

        // Remove participant
        room.participant_ids.retain(|id| id != &user_id);
        room.unread_counts.remove(&user_id);

        // Emit event
        let _ = self.app_handle.emit(
            "chat:participant_left",
            serde_json::json!({
                "room_id": room_id,
                "user_id": user_id,
            }),
        );

        tracing::info!("✅ User {} left room {}", user_id, room_id);

        // Delete room if empty
        if room.participant_ids.is_empty() {
            rooms.remove(&room_id);
            let mut messages = self.messages.lock().await;
            messages.remove(&room_id);
            tracing::info!("🗑️ Empty room {} deleted", room_id);
        }

        Ok(())
    }

    /// Send a message
    pub async fn send_message(
        &self,
        room_id: String,
        sender_id: String,
        sender_name: String,
        message_type: MessageType,
        content: String,
        reply_to: Option<String>,
        attachments: Vec<Attachment>,
        mentions: Vec<String>,
    ) -> Result<ChatMessage> {
        let rooms = self.rooms.lock().await;
        let room = rooms.get(&room_id).context("Room not found")?;

        // Verify sender is participant
        if !room.participant_ids.contains(&sender_id) {
            bail!("User is not a member of this room");
        }

        // Check message length
        if content.len() > room.settings.max_message_length {
            bail!(
                "Message exceeds maximum length of {} characters",
                room.settings.max_message_length
            );
        }

        let message_id = Uuid::new_v4().to_string();
        let mut message_content = content.clone();

        // Encrypt message if room has encryption enabled
        if room.is_encrypted {
            message_content = self.encrypt_message(&room_id, &content).await?;
        }

        let message = ChatMessage {
            message_id: message_id.clone(),
            room_id: room_id.clone(),
            sender_id: sender_id.clone(),
            sender_name,
            message_type,
            content: message_content,
            is_encrypted: room.is_encrypted,
            reply_to,
            attachments,
            reactions: HashMap::new(),
            mentions,
            timestamp: Utc::now(),
            edited_at: None,
            status: MessageStatus::Sent,
            read_by: vec![sender_id.clone()],
        };

        // Store message
        let mut messages = self.messages.lock().await;
        let room_messages = messages.entry(room_id.clone()).or_insert_with(Vec::new);
        room_messages.push(message.clone());

        // Update room last message time
        drop(rooms);
        let mut rooms = self.rooms.lock().await;
        if let Some(room) = rooms.get_mut(&room_id) {
            room.last_message_at = Some(Utc::now());

            // Increment unread count for other participants
            for participant_id in &room.participant_ids {
                if participant_id != &sender_id {
                    *room
                        .unread_counts
                        .entry(participant_id.clone())
                        .or_insert(0) += 1;
                }
            }
        }

        // Emit event
        let _ = self.app_handle.emit("chat:message_sent", &message);

        tracing::info!("📨 Message sent in room {}", room_id);
        Ok(message)
    }

    /// Get messages from a room
    pub async fn get_messages(
        &self,
        room_id: String,
        limit: Option<usize>,
        before: Option<String>,
    ) -> Result<Vec<ChatMessage>> {
        let messages = self.messages.lock().await;
        let room_messages = messages.get(&room_id).context("Room not found")?;

        let mut filtered_messages = room_messages.clone();

        // Filter by before timestamp if provided
        if let Some(before_id) = before {
            if let Some(pos) = filtered_messages
                .iter()
                .position(|m| m.message_id == before_id)
            {
                filtered_messages = filtered_messages[..pos].to_vec();
            }
        }

        // Apply limit
        let limit = limit.unwrap_or(50);
        let start = filtered_messages.len().saturating_sub(limit);
        filtered_messages = filtered_messages[start..].to_vec();

        // Decrypt messages if needed
        let rooms = self.rooms.lock().await;
        if let Some(room) = rooms.get(&room_id) {
            if room.is_encrypted {
                for message in &mut filtered_messages {
                    if message.is_encrypted {
                        message.content = self.decrypt_message(&room_id, &message.content).await?;
                    }
                }
            }
        }

        Ok(filtered_messages)
    }

    /// Mark message as read
    pub async fn mark_as_read(
        &self,
        room_id: String,
        user_id: String,
        message_id: String,
    ) -> Result<()> {
        let mut messages = self.messages.lock().await;
        let room_messages = messages.get_mut(&room_id).context("Room not found")?;

        if let Some(message) = room_messages
            .iter_mut()
            .find(|m| m.message_id == message_id)
        {
            if !message.read_by.contains(&user_id) {
                message.read_by.push(user_id.clone());
            }
        }

        // Update unread count
        let mut rooms = self.rooms.lock().await;
        if let Some(room) = rooms.get_mut(&room_id) {
            if let Some(count) = room.unread_counts.get_mut(&user_id) {
                *count = count.saturating_sub(1);
            }
        }

        // Emit event
        let _ = self.app_handle.emit(
            "chat:message_read",
            serde_json::json!({
                "room_id": room_id,
                "user_id": user_id,
                "message_id": message_id,
            }),
        );

        Ok(())
    }

    /// Add reaction to message
    pub async fn add_reaction(
        &self,
        room_id: String,
        message_id: String,
        user_id: String,
        emoji: String,
    ) -> Result<()> {
        let mut messages = self.messages.lock().await;
        let room_messages = messages.get_mut(&room_id).context("Room not found")?;

        if let Some(message) = room_messages
            .iter_mut()
            .find(|m| m.message_id == message_id)
        {
            let reactions = message
                .reactions
                .entry(emoji.clone())
                .or_insert_with(Vec::new);
            if !reactions.contains(&user_id) {
                reactions.push(user_id.clone());
            }

            // Emit event
            let _ = self.app_handle.emit(
                "chat:reaction_added",
                serde_json::json!({
                    "room_id": room_id,
                    "message_id": message_id,
                    "user_id": user_id,
                    "emoji": emoji,
                }),
            );
        }

        Ok(())
    }

    /// Remove reaction from message
    pub async fn remove_reaction(
        &self,
        room_id: String,
        message_id: String,
        user_id: String,
        emoji: String,
    ) -> Result<()> {
        let mut messages = self.messages.lock().await;
        let room_messages = messages.get_mut(&room_id).context("Room not found")?;

        if let Some(message) = room_messages
            .iter_mut()
            .find(|m| m.message_id == message_id)
        {
            if let Some(reactions) = message.reactions.get_mut(&emoji) {
                reactions.retain(|id| id != &user_id);
                if reactions.is_empty() {
                    message.reactions.remove(&emoji);
                }
            }

            // Emit event
            let _ = self.app_handle.emit(
                "chat:reaction_removed",
                serde_json::json!({
                    "room_id": room_id,
                    "message_id": message_id,
                    "user_id": user_id,
                    "emoji": emoji,
                }),
            );
        }

        Ok(())
    }

    /// Edit message
    pub async fn edit_message(
        &self,
        room_id: String,
        message_id: String,
        sender_id: String,
        new_content: String,
    ) -> Result<ChatMessage> {
        let mut messages = self.messages.lock().await;
        let room_messages = messages.get_mut(&room_id).context("Room not found")?;

        let message = room_messages
            .iter_mut()
            .find(|m| m.message_id == message_id)
            .context("Message not found")?;

        // Verify sender
        if message.sender_id != sender_id {
            bail!("Only the sender can edit this message");
        }

        // Update content
        let content = if message.is_encrypted {
            self.encrypt_message(&room_id, &new_content).await?
        } else {
            new_content
        };

        message.content = content;
        message.edited_at = Some(Utc::now());

        // Emit event
        let _ = self.app_handle.emit("chat:message_edited", message.clone());

        tracing::info!("✏️ Message {} edited", message_id);
        Ok(message.clone())
    }

    /// Delete message
    pub async fn delete_message(
        &self,
        room_id: String,
        message_id: String,
        user_id: String,
    ) -> Result<()> {
        let mut messages = self.messages.lock().await;
        let room_messages = messages.get_mut(&room_id).context("Room not found")?;

        if let Some(pos) = room_messages
            .iter()
            .position(|m| m.message_id == message_id)
        {
            let message = &room_messages[pos];

            // Verify sender or admin
            if message.sender_id != user_id {
                // Check if user is admin
                let rooms = self.rooms.lock().await;
                if let Some(room) = rooms.get(&room_id) {
                    if room.owner_id != user_id {
                        bail!("Only the sender or room admin can delete this message");
                    }
                }
            }

            room_messages.remove(pos);

            // Emit event
            let _ = self.app_handle.emit(
                "chat:message_deleted",
                serde_json::json!({
                    "room_id": room_id,
                    "message_id": message_id,
                }),
            );

            tracing::info!("🗑️ Message {} deleted", message_id);
        }

        Ok(())
    }

    /// Set typing indicator
    pub async fn set_typing(
        &self,
        room_id: String,
        user_id: String,
        display_name: String,
        is_typing: bool,
    ) -> Result<()> {
        let mut typing_indicators = self.typing_indicators.lock().await;
        let indicators = typing_indicators
            .entry(room_id.clone())
            .or_insert_with(Vec::new);

        if is_typing {
            // Add or update indicator
            if let Some(indicator) = indicators.iter_mut().find(|i| i.user_id == user_id) {
                indicator.timestamp = Utc::now();
            } else {
                indicators.push(TypingIndicator {
                    room_id: room_id.clone(),
                    user_id: user_id.clone(),
                    display_name: display_name.clone(),
                    timestamp: Utc::now(),
                });
            }
        } else {
            // Remove indicator
            indicators.retain(|i| i.user_id != user_id);
        }

        // Emit event
        let _ = self.app_handle.emit(
            "chat:typing",
            serde_json::json!({
                "room_id": room_id,
                "user_id": user_id,
                "display_name": display_name,
                "is_typing": is_typing,
            }),
        );

        Ok(())
    }

    /// Get typing indicators for a room
    pub async fn get_typing_indicators(&self, room_id: String) -> Vec<TypingIndicator> {
        let typing_indicators = self.typing_indicators.lock().await;
        typing_indicators.get(&room_id).cloned().unwrap_or_default()
    }

    /// Get room details
    pub async fn get_room(&self, room_id: String) -> Result<ChatRoom> {
        let rooms = self.rooms.lock().await;
        rooms.get(&room_id).cloned().context("Room not found")
    }

    /// List all rooms for a user
    pub async fn list_rooms(&self, user_id: String) -> Vec<ChatRoom> {
        let rooms = self.rooms.lock().await;
        rooms
            .values()
            .filter(|room| room.participant_ids.contains(&user_id))
            .cloned()
            .collect()
    }

    /// Search messages
    pub async fn search_messages(
        &self,
        room_id: String,
        query: String,
        limit: usize,
    ) -> Result<Vec<ChatMessage>> {
        let messages = self.messages.lock().await;
        let room_messages = messages.get(&room_id).context("Room not found")?;

        let query_lower = query.to_lowercase();
        let results: Vec<ChatMessage> = room_messages
            .iter()
            .filter(|m| m.content.to_lowercase().contains(&query_lower))
            .rev()
            .take(limit)
            .cloned()
            .collect();

        Ok(results)
    }

    /// Update participant status
    pub async fn update_status(&self, user_id: String, status: UserStatus) -> Result<()> {
        let mut participants = self.participants.lock().await;
        if let Some(participant) = participants.get_mut(&user_id) {
            participant.status = status.clone();
            participant.last_seen = Utc::now();

            // Emit event
            let _ = self.app_handle.emit(
                "chat:status_updated",
                serde_json::json!({
                    "user_id": user_id,
                    "status": status,
                }),
            );
        }

        Ok(())
    }

    /// Generate encryption key (AES-256)
    fn generate_encryption_key(&self) -> Vec<u8> {
        use rand::RngCore;
        let mut key = vec![0u8; 32]; // 256 bits
        let mut rng = rand::thread_rng();
        rng.fill_bytes(&mut key);
        key
    }

    /// Encrypt message content
    async fn encrypt_message(&self, room_id: &str, content: &str) -> Result<String> {
        let keys = self.encryption_keys.lock().await;
        let key = keys.get(room_id).context("Encryption key not found")?;

        let cipher = Aes256Gcm::new_from_slice(key)
            .map_err(|e| anyhow::anyhow!("Failed to create cipher: {}", e))?;

        // Generate random nonce
        let mut nonce_bytes = [0u8; 12];
        let mut rng = rand::thread_rng();
        rng.fill(&mut nonce_bytes);
        let nonce = Nonce::from(nonce_bytes);

        let ciphertext = cipher
            .encrypt(&nonce, content.as_bytes())
            .map_err(|e| anyhow::anyhow!("Encryption failed: {}", e))?;

        // Prepend nonce to ciphertext
        let mut result = nonce_bytes.to_vec();
        result.extend_from_slice(&ciphertext);

        // Base64 encode
        Ok(general_purpose::STANDARD.encode(&result))
    }

    /// Decrypt message content
    async fn decrypt_message(&self, room_id: &str, encrypted: &str) -> Result<String> {
        let keys = self.encryption_keys.lock().await;
        let key = keys.get(room_id).context("Encryption key not found")?;

        // Base64 decode
        let data = general_purpose::STANDARD
            .decode(encrypted)
            .map_err(|e| anyhow::anyhow!("Base64 decode failed: {}", e))?;

        if data.len() < 12 {
            bail!("Invalid encrypted data");
        }

        // Extract nonce and ciphertext
        let nonce_bytes: [u8; 12] = data[..12].try_into()?;
        let nonce = Nonce::from(nonce_bytes);
        let ciphertext = &data[12..];

        let cipher = Aes256Gcm::new_from_slice(key)
            .map_err(|e| anyhow::anyhow!("Failed to create cipher: {}", e))?;

        let plaintext = cipher
            .decrypt(&nonce, ciphertext)
            .map_err(|e| anyhow::anyhow!("Decryption failed: {}", e))?;

        Ok(String::from_utf8(plaintext)?)
    }
}
