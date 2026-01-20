// ============================================================================
// CUBE Elite Remote Desktop v2 - Production Command Layer
// ============================================================================
// Bridges the enterprise-grade remote engine found under src/remote/* with the
// Tauri command interface consumed by the React UI. All session management,
// WebRTC signaling, encryption, streaming, and remote input logic lives here.
// ============================================================================

use std::collections::HashMap;
use std::sync::Arc;

use chrono::{DateTime, Utc};
use screenshots::Screen;
use serde::{Deserialize, Serialize};
use tauri::State;
use tokio::sync::{Mutex, RwLock};

use crate::remote::{
    ConnectionStatus, RemoteConnection, RemoteManager,
    desktop::DesktopConnection,
    encryption::SecureChannel,
    input::{validate_input_event, RemoteInputController, MouseButton},
    streaming::ScreenStreamer,
    IceServerConfig,
    RemoteError,
    SessionStats as EngineSessionStats,
    StreamConfig as EngineStreamConfig,
    StreamQuality,
    VideoCodec,
    RemoteInputEvent,
};

// ============================================================================
// PUBLIC STATE
// ============================================================================

/// Shared remote desktop state registered in main.rs
pub struct RemoteDesktopState {
    sessions: Arc<RwLock<HashMap<String, RemoteSession>>>,
    connections: Arc<RwLock<RemoteManager>>,
}

impl RemoteDesktopState {
    pub fn new() -> Self {
        Self {
            sessions: Arc::new(RwLock::new(HashMap::new())),
            connections: Arc::new(RwLock::new(RemoteManager::new())),
        }
    }
}

impl Default for RemoteDesktopState {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// DATA TRANSFER OBJECTS
// ============================================================================

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "PascalCase")]
pub enum SessionStatus {
    Created,
    Connecting,
    Connected,
    Disconnected,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SessionStatsPayload {
    pub frames_sent: u64,
    pub frames_received: u64,
    pub bytes_sent: u64,
    pub bytes_received: u64,
    pub current_fps: f32,
    pub current_bitrate: u64,
    pub average_latency: f32,
    pub packet_loss: f32,
}

impl SessionStatsPayload {
    fn update_from_engine(&mut self, stats: &EngineSessionStats) {
        self.frames_sent = self.frames_sent.saturating_add(stats.fps as u64);
        self.frames_received = self.frames_sent;
        let delta_bytes = (stats.bitrate / 8) as u64;
        self.bytes_sent = self.bytes_sent.saturating_add(delta_bytes);
        self.bytes_received = self.bytes_sent;
        self.current_fps = stats.fps as f32;
        self.current_bitrate = stats.bitrate;
        self.average_latency = stats.latency as f32;
        self.packet_loss = stats.packet_loss;
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionInfoResponse {
    pub id: String,
    pub peer_id: String,
    pub status: SessionStatus,
    pub started_at: DateTime<Utc>,
    pub duration: u64,
    pub streaming: bool,
    pub input_enabled: bool,
    pub ice_candidates: Vec<IceCandidate>,
    pub local_sdp: Option<String>,
    pub remote_sdp: Option<String>,
    pub encryption_ready: bool,
    pub stats: SessionStatsPayload,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IceCandidate {
    pub candidate: String,
    pub sdp_mid: Option<String>,
    #[serde(alias = "sdpMlineIndex", alias = "sdpMLineIndex")]
    pub sdp_mline_index: Option<u16>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RemoteScreenInfo {
    pub id: usize,
    pub name: String,
    pub width: u32,
    pub height: u32,
    pub x: i32,
    pub y: i32,
    pub is_primary: bool,
    pub scale_factor: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StreamingConfig {
    #[serde(default)]
    pub screen_index: usize,
    pub width: u32,
    pub height: u32,
    #[serde(alias = "fps")]
    pub framerate: u32,
    #[serde(default)]
    pub quality: QualitySetting,
    #[serde(default)]
    pub bitrate: Option<u64>,
    #[serde(default)]
    pub codec: Option<VideoCodecPreference>,
}

impl Default for StreamingConfig {
    fn default() -> Self {
        Self {
            screen_index: 0,
            width: 1920,
            height: 1080,
            framerate: 30,
            quality: QualitySetting::Preset(StreamQuality::High),
            bitrate: None,
            codec: Some(VideoCodecPreference::H264),
        }
    }
}

impl StreamingConfig {
    fn to_engine_config(&self) -> EngineStreamConfig {
        let mut config = EngineStreamConfig::default();
        config.resolution = (self.width, self.height);
        config.fps = self.framerate;
        config.quality = self.quality.to_stream_quality();
        let codec = self
            .codec
            .clone()
            .unwrap_or(VideoCodecPreference::H264);
        config.codec = codec.into();

        config.bitrate = if let Some(bitrate) = self.bitrate {
            bitrate
        } else {
            self.quality.estimate_bitrate(config.bitrate)
        };

        config
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum VideoCodecPreference {
    H264,
    VP8,
    VP9,
}

impl Default for VideoCodecPreference {
    fn default() -> Self {
        VideoCodecPreference::H264
    }
}

impl From<VideoCodecPreference> for VideoCodec {
    fn from(value: VideoCodecPreference) -> Self {
        match value {
            VideoCodecPreference::H264 => VideoCodec::H264,
            VideoCodecPreference::VP8 => VideoCodec::VP8,
            VideoCodecPreference::VP9 => VideoCodec::VP9,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum QualitySetting {
    Preset(StreamQuality),
    Label(String),
    Numeric(u32),
}

impl Default for QualitySetting {
    fn default() -> Self {
        QualitySetting::Preset(StreamQuality::High)
    }
}

impl QualitySetting {
    fn to_stream_quality(&self) -> StreamQuality {
        match self {
            QualitySetting::Preset(q) => q.clone(),
            QualitySetting::Label(label) => match label.to_lowercase().as_str() {
                "low" => StreamQuality::Low,
                "medium" => StreamQuality::Medium,
                "ultra" => StreamQuality::Ultra,
                "extreme" => StreamQuality::Extreme,
                _ => StreamQuality::High,
            },
            QualitySetting::Numeric(value) => match *value {
                0..=40 => StreamQuality::Low,
                41..=65 => StreamQuality::Medium,
                66..=85 => StreamQuality::High,
                86..=95 => StreamQuality::Ultra,
                _ => StreamQuality::Extreme,
            },
        }
    }

    fn estimate_bitrate(&self, fallback: u64) -> u64 {
        match self.to_stream_quality() {
            StreamQuality::Low => 2_000_000,
            StreamQuality::Medium => 3_000_000,
            StreamQuality::High => 5_000_000,
            StreamQuality::Ultra => 8_000_000,
            StreamQuality::Extreme => 15_000_000,
        }
        .max(fallback)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum InputEvent {
    MouseMove { x: f64, y: f64 },
    MouseClick { button: MouseButtonType },
    MouseDoubleClick { button: MouseButtonType },
    MouseDown { button: MouseButtonType },
    MouseUp { button: MouseButtonType },
    MouseScroll { delta_x: f64, delta_y: f64 },
    KeyDown { key: String },
    KeyUp { key: String },
    KeyPress { key: String },
    Text { text: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum MouseButtonType {
    Left,
    Right,
    Middle,
}

impl MouseButtonType {
    fn to_engine(&self) -> MouseButton {
        match self {
            MouseButtonType::Left => MouseButton::Left,
            MouseButtonType::Right => MouseButton::Right,
            MouseButtonType::Middle => MouseButton::Middle,
        }
    }
}

impl InputEvent {
    fn to_engine(&self) -> RemoteInputEvent {
        match self {
            InputEvent::MouseMove { x, y } => RemoteInputEvent::MouseMove {
                x: *x as i32,
                y: *y as i32,
            },
            InputEvent::MouseClick { button } => RemoteInputEvent::MouseClick {
                button: button.to_engine(),
            },
            InputEvent::MouseDoubleClick { button } => RemoteInputEvent::MouseDoubleClick {
                button: button.to_engine(),
            },
            InputEvent::MouseDown { button } => RemoteInputEvent::MouseDown {
                button: button.to_engine(),
            },
            InputEvent::MouseUp { button } => RemoteInputEvent::MouseUp {
                button: button.to_engine(),
            },
            InputEvent::MouseScroll { delta_x, delta_y } => RemoteInputEvent::MouseScroll {
                delta_x: *delta_x as i32,
                delta_y: *delta_y as i32,
            },
            InputEvent::KeyDown { key } => RemoteInputEvent::KeyDown { key: key.clone() },
            InputEvent::KeyUp { key } => RemoteInputEvent::KeyUp { key: key.clone() },
            InputEvent::KeyPress { key } => RemoteInputEvent::KeyPress { key: key.clone() },
            InputEvent::Text { text } => RemoteInputEvent::Text { text: text.clone() },
        }
    }
}

// ============================================================================
// INTERNAL SESSION STRUCTURE
// ============================================================================

struct RemoteSession {
    session_id: String,
    peer_id: String,
    status: SessionStatus,
    created_at: DateTime<Utc>,
    ice_candidates: Vec<IceCandidate>,
    local_sdp: Option<String>,
    remote_sdp: Option<String>,
    streaming: bool,
    input_enabled: bool,
    encryption_ready: bool,
    stats: SessionStatsPayload,
    connection: Arc<DesktopConnection>,
    streamer: Option<Arc<Mutex<ScreenStreamer>>>,
    input_controller: Arc<Mutex<RemoteInputController>>,
    secure_channel: Arc<Mutex<SecureChannel>>,
    engine_stream_config: EngineStreamConfig,
    active_screen_index: usize,
}

impl RemoteSession {
    fn new(
        session_id: String,
        peer_id: String,
        connection: Arc<DesktopConnection>,
        engine_stream_config: EngineStreamConfig,
        active_screen_index: usize,
    ) -> Self {
        Self {
            session_id: session_id.clone(),
            peer_id,
            status: SessionStatus::Created,
            created_at: Utc::now(),
            ice_candidates: Vec::new(),
            local_sdp: None,
            remote_sdp: None,
            streaming: false,
            input_enabled: false,
            encryption_ready: false,
            stats: SessionStatsPayload::default(),
            connection,
            streamer: None,
            input_controller: Arc::new(Mutex::new(RemoteInputController::new())),
            secure_channel: Arc::new(Mutex::new(SecureChannel::new(session_id))),
            engine_stream_config,
            active_screen_index,
        }
    }

    fn snapshot(&self) -> SessionInfoResponse {
        SessionInfoResponse {
            id: self.session_id.clone(),
            peer_id: self.peer_id.clone(),
            status: self.status,
            started_at: self.created_at,
            duration: (Utc::now() - self.created_at).num_seconds().max(0) as u64,
            streaming: self.streaming,
            input_enabled: self.input_enabled,
            ice_candidates: self.ice_candidates.clone(),
            local_sdp: self.local_sdp.clone(),
            remote_sdp: self.remote_sdp.clone(),
            encryption_ready: self.encryption_ready,
            stats: self.stats.clone(),
        }
    }
}

// ============================================================================
// COMMAND HELPERS
// ============================================================================

fn remote_error(err: RemoteError) -> String {
    err.to_string()
}

fn session_not_found(id: &str) -> String {
    format!("Session not found: {}", id)
}

// ============================================================================
// SESSION COMMANDS
// ============================================================================

#[tauri::command]
pub async fn create_remote_session(
    peer_id: String,
    ice_servers: Option<Vec<IceServerConfig>>,
    config: Option<StreamingConfig>,
    state: State<'_, RemoteDesktopState>,
) -> Result<SessionInfoResponse, String> {
    if peer_id.trim().is_empty() {
        return Err("Peer ID is required".to_string());
    }

    let session_id = uuid::Uuid::new_v4().to_string();
    let streaming_config = config.unwrap_or_default();
    let engine_config = streaming_config.to_engine_config();
    let servers = ice_servers.unwrap_or_else(|| vec![IceServerConfig::default()]);

    let connection = DesktopConnection::new(
        session_id.clone(),
        servers,
        engine_config.clone(),
    )
    .await
    .map_err(remote_error)?;

    let session = RemoteSession::new(
        session_id.clone(),
        peer_id,
        Arc::new(connection),
        engine_config,
        streaming_config.screen_index,
    );

    {
        let mut sessions = state.sessions.write().await;
        sessions.insert(session_id.clone(), session);
    }

    get_remote_session(session_id, state).await
}

#[tauri::command]
pub async fn get_remote_session(
    session_id: String,
    state: State<'_, RemoteDesktopState>,
) -> Result<SessionInfoResponse, String> {
    let sessions = state.sessions.read().await;
    sessions
        .get(&session_id)
        .map(|session| session.snapshot())
        .ok_or_else(|| session_not_found(&session_id))
}

#[tauri::command]
pub async fn list_remote_sessions(
    state: State<'_, RemoteDesktopState>,
) -> Result<Vec<SessionInfoResponse>, String> {
    let sessions = state.sessions.read().await;
    Ok(sessions.values().map(|s| s.snapshot()).collect())
}

#[tauri::command]
pub async fn close_remote_session(
    session_id: String,
    state: State<'_, RemoteDesktopState>,
) -> Result<(), String> {
    let session = {
        let mut sessions = state.sessions.write().await;
        sessions.remove(&session_id)
    };

    if let Some(mut session) = session {
        if let Some(streamer) = session.streamer.take() {
            let guard = streamer.lock().await;
            guard.stop().await.map_err(remote_error)?;
        }

        session
            .connection
            .close()
            .await
            .map_err(remote_error)?;
    }

    Ok(())
}

// ============================================================================
// SCREEN COMMANDS
// ============================================================================

#[tauri::command]
pub async fn remote_get_available_screens() -> Result<Vec<RemoteScreenInfo>, String> {
    let screens = Screen::all().map_err(|e| format!("Failed to list screens: {}", e))?;

    Ok(screens
        .into_iter()
        .enumerate()
        .map(|(idx, screen)| RemoteScreenInfo {
            id: idx,
            name: format!("Screen {}", idx + 1),
            width: screen.display_info.width,
            height: screen.display_info.height,
            x: screen.display_info.x,
            y: screen.display_info.y,
            is_primary: screen.display_info.is_primary,
            scale_factor: screen.display_info.scale_factor,
        })
        .collect())
}

#[tauri::command]
pub async fn start_screen_streaming(
    session_id: String,
    screen_id: Option<usize>,
    config: Option<StreamingConfig>,
    state: State<'_, RemoteDesktopState>,
) -> Result<(), String> {
    let (streamer, selected_screen, engine_config) = {
        let mut sessions = state.sessions.write().await;
        let session = sessions
            .get_mut(&session_id)
            .ok_or_else(|| session_not_found(&session_id))?;

        if let Some(new_config) = config {
            session.engine_stream_config = new_config.to_engine_config();
            session.active_screen_index = new_config.screen_index;
        }

        let streamer = match &session.streamer {
            Some(existing) => Arc::clone(existing),
            None => {
                let new_streamer = ScreenStreamer::new(session.engine_stream_config.clone())
                    .map_err(remote_error)?;
                let handle = Arc::new(Mutex::new(new_streamer));
                session.streamer = Some(Arc::clone(&handle));
                handle
            }
        };

        session.streaming = true;
        session.status = SessionStatus::Connected;

        let selected = if let Some(id) = screen_id {
            session.active_screen_index = id;
            id
        } else {
            session.active_screen_index
        };

        (streamer, selected, session.engine_stream_config.clone())
    };

    {
        let mut guard = streamer.lock().await;
        guard.update_config(engine_config);
        guard
            .select_screen(selected_screen)
            .map_err(remote_error)?;
        guard.start().await.map_err(remote_error)?;
    }

    Ok(())
}

#[tauri::command]
pub async fn stop_screen_streaming(
    session_id: String,
    state: State<'_, RemoteDesktopState>,
) -> Result<(), String> {
    let streamer = {
        let mut sessions = state.sessions.write().await;
        let session = sessions
            .get_mut(&session_id)
            .ok_or_else(|| session_not_found(&session_id))?;

        session.streaming = false;
        session
            .streamer
            .as_ref()
            .map(|handle| Arc::clone(handle))
    };

    if let Some(handle) = streamer {
        let guard = handle.lock().await;
        guard.stop().await.map_err(remote_error)?;
    }

    Ok(())
}

#[tauri::command]
pub async fn get_streaming_stats(
    session_id: String,
    state: State<'_, RemoteDesktopState>,
) -> Result<SessionStatsPayload, String> {
    let streamer = {
        let sessions = state.sessions.read().await;
        let session = sessions
            .get(&session_id)
            .ok_or_else(|| session_not_found(&session_id))?;
        (session.streamer.as_ref().map(|s| Arc::clone(s)), session.stats.clone())
    };

    let (streamer, mut snapshot) = streamer;

    if let Some(handle) = streamer {
        let guard = handle.lock().await;
        let stats = guard.get_stats().await;
        snapshot.update_from_engine(&stats);

        let mut sessions = state.sessions.write().await;
        if let Some(session) = sessions.get_mut(&session_id) {
            session.stats = snapshot.clone();
        }
    }

    Ok(snapshot)
}

// ============================================================================
// INPUT COMMANDS
// ============================================================================

#[tauri::command]
pub async fn execute_remote_input(
    session_id: String,
    event: InputEvent,
    state: State<'_, RemoteDesktopState>,
) -> Result<(), String> {
    let controller: Arc<Mutex<RemoteInputController>> = {
        let sessions = state.sessions.read().await;
        let session = sessions
            .get(&session_id)
            .ok_or_else(|| session_not_found(&session_id))?;

        if !session.input_enabled {
            return Err("Remote input is disabled for this session".to_string());
        }

        Arc::clone(&session.input_controller)
    };

    let engine_event = event.to_engine();
    validate_input_event(&engine_event).map_err(remote_error)?;

    let mut guard = controller.lock().await;
    guard.execute_event(engine_event).map_err(remote_error)
}

#[tauri::command]
pub async fn set_remote_input_enabled(
    session_id: String,
    enabled: bool,
    state: State<'_, RemoteDesktopState>,
) -> Result<(), String> {
    let controller: Arc<Mutex<RemoteInputController>> = {
        let mut sessions = state.sessions.write().await;
        let session = sessions
            .get_mut(&session_id)
            .ok_or_else(|| session_not_found(&session_id))?;
        session.input_enabled = enabled;
        Arc::clone(&session.input_controller)
    };

    let mut guard = controller.lock().await;
    guard.set_allow_input(enabled);
    Ok(())
}

// ============================================================================
// ENCRYPTION COMMANDS
// ============================================================================

#[tauri::command]
pub async fn generate_encryption_keypair(
    session_id: String,
    state: State<'_, RemoteDesktopState>,
) -> Result<Vec<u8>, String> {
    let channel: Arc<Mutex<SecureChannel>> = {
        let sessions = state.sessions.read().await;
        let session = sessions
            .get(&session_id)
            .ok_or_else(|| session_not_found(&session_id))?;
        Arc::clone(&session.secure_channel)
    };

    let mut guard = channel.lock().await;
    guard
        .initialize_as_initiator()
        .map_err(remote_error)
}

#[tauri::command]
pub async fn exchange_encryption_keys(
    session_id: String,
    peer_public_key: Vec<u8>,
    state: State<'_, RemoteDesktopState>,
) -> Result<(), String> {
    let channel: Arc<Mutex<SecureChannel>> = {
        let sessions = state.sessions.read().await;
        let session = sessions
            .get(&session_id)
            .ok_or_else(|| session_not_found(&session_id))?;
        Arc::clone(&session.secure_channel)
    };

    {
        let mut guard = channel.lock().await;
        guard
            .complete_as_initiator(&peer_public_key)
            .map_err(remote_error)?;
    }

    let mut sessions = state.sessions.write().await;
    if let Some(session) = sessions.get_mut(&session_id) {
        session.encryption_ready = true;
    }

    Ok(())
}

// ============================================================================
// WEBRTC COMMANDS
// ============================================================================

#[tauri::command]
pub async fn create_webrtc_offer(
    session_id: String,
    state: State<'_, RemoteDesktopState>,
) -> Result<String, String> {
    let connection: Arc<DesktopConnection> = {
        let sessions = state.sessions.read().await;
        let session = sessions
            .get(&session_id)
            .ok_or_else(|| session_not_found(&session_id))?;
        Arc::clone(&session.connection)
    };

    let offer = connection.create_offer().await.map_err(remote_error)?;

    let mut sessions = state.sessions.write().await;
    if let Some(session) = sessions.get_mut(&session_id) {
        session.local_sdp = Some(offer.clone());
        session.status = SessionStatus::Connecting;
    }

    Ok(offer)
}

#[tauri::command]
pub async fn create_webrtc_answer(
    session_id: String,
    remote_sdp: Option<String>,
    answer_sdp: Option<String>,
    state: State<'_, RemoteDesktopState>,
) -> Result<String, String> {
    let connection: Arc<DesktopConnection> = {
        let sessions = state.sessions.read().await;
        let session = sessions
            .get(&session_id)
            .ok_or_else(|| session_not_found(&session_id))?;
        Arc::clone(&session.connection)
    };

    let mut peer_offer: Option<String> = None;
    let mut local_answer: Option<String> = None;

    let result = if let Some(remote) = remote_sdp {
        peer_offer = Some(remote.clone());
        connection
            .set_remote_description(remote, "offer")
            .await
            .map_err(remote_error)?;
        let answer = connection.create_answer().await.map_err(remote_error)?;
        local_answer = Some(answer.clone());
        answer
    } else if let Some(answer) = answer_sdp {
        connection
            .set_remote_description(answer.clone(), "answer")
            .await
            .map_err(remote_error)?;
        answer
    } else {
        return Err("Either remote_sdp or answer_sdp must be provided".to_string());
    };

    let mut sessions = state.sessions.write().await;
    if let Some(session) = sessions.get_mut(&session_id) {
        if let Some(remote_offer) = peer_offer {
            session.remote_sdp = Some(remote_offer);
        } else {
            session.remote_sdp = Some(result.clone());
        }

        if let Some(local) = local_answer {
            session.local_sdp = Some(local);
        }
        session.status = SessionStatus::Connected;
    }

    Ok(result)
}

#[tauri::command]
pub async fn set_remote_description(
    session_id: String,
    sdp: String,
    sdp_type: String,
    state: State<'_, RemoteDesktopState>,
) -> Result<(), String> {
    let connection: Arc<DesktopConnection> = {
        let sessions = state.sessions.read().await;
        let session = sessions
            .get(&session_id)
            .ok_or_else(|| session_not_found(&session_id))?;
        Arc::clone(&session.connection)
    };

    connection
        .set_remote_description(sdp.clone(), &sdp_type)
        .await
        .map_err(remote_error)?;

    let mut sessions = state.sessions.write().await;
    if let Some(session) = sessions.get_mut(&session_id) {
        session.remote_sdp = Some(sdp);
    }

    Ok(())
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IceCandidateArgs {
    pub session_id: String,
    pub candidate: String,
    pub sdp_mid: Option<String>,
    #[serde(alias = "sdpMlineIndex", alias = "sdpMLineIndex")]
    pub sdp_mline_index: Option<u16>,
}

#[tauri::command]
pub async fn add_ice_candidate(
    args: IceCandidateArgs,
    state: State<'_, RemoteDesktopState>,
) -> Result<(), String> {
    let connection: Arc<DesktopConnection> = {
        let sessions = state.sessions.read().await;
        let session = sessions
            .get(&args.session_id)
            .ok_or_else(|| session_not_found(&args.session_id))?;
        Arc::clone(&session.connection)
    };

    connection
        .add_ice_candidate(
            args.candidate.clone(),
            args.sdp_mid.clone(),
            args.sdp_mline_index,
        )
        .await
        .map_err(remote_error)?;

    let mut sessions = state.sessions.write().await;
    if let Some(session) = sessions.get_mut(&args.session_id) {
        session.ice_candidates.push(IceCandidate {
            candidate: args.candidate,
            sdp_mid: args.sdp_mid,
            sdp_mline_index: args.sdp_mline_index,
        });
    }

    Ok(())
}

// ============================================================================
// CONNECTION REGISTRY COMMANDS
// ============================================================================

#[tauri::command]
pub async fn get_remote_connections(
    state: State<'_, RemoteDesktopState>,
) -> Result<Vec<RemoteConnection>, String> {
    let connections = state.connections.read().await;
    Ok(connections.connections.clone())
}

#[tauri::command]
pub async fn get_connected_remotes(
    state: State<'_, RemoteDesktopState>,
) -> Result<Vec<RemoteConnection>, String> {
    let connections = state.connections.read().await;
    Ok(
        connections
            .connections
            .iter()
            .filter(|conn| matches!(conn.status(), ConnectionStatus::Connected))
            .cloned()
            .collect(),
    )
}

#[tauri::command]
pub async fn add_remote_connection(
    connection_type: String,
    host: String,
    port: u16,
    state: State<'_, RemoteDesktopState>,
) -> Result<String, String> {
    let connection = match connection_type.to_lowercase().as_str() {
        "vpn" => RemoteConnection::VPN {
            config_id: format!("vpn_{}", host),
            provider: host.clone(),
            status: ConnectionStatus::Disconnected,
        },
        "rdp" => RemoteConnection::RDP {
            config_id: format!("rdp_{}_{}", host, port),
            host: host.clone(),
            port,
            status: ConnectionStatus::Disconnected,
        },
        "ftp" => RemoteConnection::FTP {
            site_id: format!("ftp_{}", host),
            host: host.clone(),
            protocol: "FTP".to_string(),
            status: ConnectionStatus::Disconnected,
        },
        "ssh" => RemoteConnection::SSH {
            session_id: format!("ssh_{}_{}", host, port),
            host: host.clone(),
            port,
            status: ConnectionStatus::Disconnected,
        },
        other => return Err(format!("Unknown connection type: {}", other)),
    };

    {
        let mut manager = state.connections.write().await;
        manager.add_connection(connection.clone());
    }

    Ok(connection.name())
}
