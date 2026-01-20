use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaItem {
    pub id: String,
    pub title: String,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub duration_seconds: i32,
    pub file_path: String,
    pub file_size: i64,
    pub media_type: String, // "audio" or "video"
    pub format: String, // "mp3", "mp4", "wav", etc.
    pub thumbnail_path: Option<String>,
    pub play_count: i32,
    pub last_played_at: Option<i64>,
    pub added_at: i64,
    pub is_favorite: bool,
    pub playlist_ids: Vec<String>,
    pub metadata: Option<String>, // JSON string for additional metadata
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Playlist {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub thumbnail_path: Option<String>,
    pub media_ids: Vec<String>,
    pub total_duration_seconds: i32,
    pub item_count: i32,
    pub created_at: i64,
    pub updated_at: i64,
    pub is_favorite: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaStats {
    pub total_media: i32,
    pub total_audio: i32,
    pub total_video: i32,
    pub total_playlists: i32,
    pub total_duration_seconds: i64,
    pub total_storage_bytes: i64,
    pub most_played: Vec<MediaItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaFilter {
    pub media_type: Option<String>,
    pub playlist_id: Option<String>,
    pub is_favorite: Option<bool>,
    pub query: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlaybackState {
    pub media_id: String,
    pub position_seconds: f64,
    pub volume: f64, // 0.0 to 1.0
    pub is_playing: bool,
    pub is_muted: bool,
    pub playback_rate: f64, // 0.5, 1.0, 1.5, 2.0, etc.
    pub repeat_mode: String, // "none", "one", "all"
    pub shuffle: bool,
}
