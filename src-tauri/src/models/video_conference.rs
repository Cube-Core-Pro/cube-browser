use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoConference {
    pub id: String,
    pub title: String,
    pub host_name: String,
    pub room_url: String,
    pub status: String, // "scheduled", "active", "ended"
    pub scheduled_at: i64,
    pub started_at: Option<i64>,
    pub ended_at: Option<i64>,
    pub duration_seconds: i32,
    pub participant_count: i32,
    pub is_recording: bool,
    pub recording_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConferenceParticipant {
    pub id: String,
    pub conference_id: String,
    pub name: String,
    pub email: Option<String>,
    pub avatar_url: Option<String>,
    pub joined_at: i64,
    pub left_at: Option<i64>,
    pub is_host: bool,
    pub is_muted: bool,
    pub is_video_enabled: bool,
    pub is_screen_sharing: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConferenceSettings {
    pub id: String,
    pub default_camera: String,
    pub default_microphone: String,
    pub default_speaker: String,
    pub video_quality: String, // "low", "medium", "high", "hd"
    pub background_blur: bool,
    pub virtual_background_path: Option<String>,
    pub auto_mute_on_join: bool,
    pub auto_record: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConferenceStats {
    pub total_conferences: i32,
    pub active_conferences: i32,
    pub total_participants: i32,
    pub total_duration_seconds: i64,
    pub total_recordings: i32,
    pub total_recording_size_bytes: i64,
}
