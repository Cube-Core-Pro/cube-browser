use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoipCall {
    pub id: String,
    pub contact_name: String,
    pub contact_number: String,
    pub direction: String, // "incoming" or "outgoing"
    pub status: String, // "ringing", "active", "on_hold", "ended", "missed", "rejected"
    pub started_at: i64,
    pub answered_at: Option<i64>,
    pub ended_at: Option<i64>,
    pub duration_seconds: i32,
    pub is_video: bool,
    pub quality_rating: Option<i32>, // 1-5 stars
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoipContact {
    pub id: String,
    pub name: String,
    pub phone_number: String,
    pub email: Option<String>,
    pub avatar_url: Option<String>,
    pub is_favorite: bool,
    pub last_call_at: Option<i64>,
    pub total_calls: i32,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoipSettings {
    pub id: String,
    pub sip_server: String,
    pub sip_username: String,
    pub sip_password: String, // Encrypted
    pub port: u16,
    pub codec: String, // "g711", "g729", "opus"
    pub auto_answer: bool,
    pub ringtone_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoipStats {
    pub total_calls: i32,
    pub incoming_calls: i32,
    pub outgoing_calls: i32,
    pub missed_calls: i32,
    pub total_duration_seconds: i64,
    pub average_call_duration_seconds: i32,
}
