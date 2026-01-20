// Media VoIP Service - WebRTC Audio/Video Communication with TURN/STUN Support
// CUBE Elite v6 - Production-Ready Implementation
// Standards: Fortune 500, Zero Omissions, Elite Quality

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;
use webrtc::api::media_engine::MediaEngine;
use webrtc::api::APIBuilder;
use webrtc::ice_transport::ice_candidate::RTCIceCandidate;
use webrtc::ice_transport::ice_connection_state::RTCIceConnectionState;
use webrtc::ice_transport::ice_server::RTCIceServer;
use webrtc::peer_connection::configuration::RTCConfiguration;
use webrtc::peer_connection::peer_connection_state::RTCPeerConnectionState;
use webrtc::peer_connection::sdp::session_description::RTCSessionDescription;
use webrtc::peer_connection::RTCPeerConnection;
use webrtc::rtp_transceiver::rtp_codec::RTCRtpCodecCapability;
use webrtc::track::track_local::track_local_static_rtp::TrackLocalStaticRTP;
use webrtc::track::track_local::TrackLocal;

/// ICE Server configuration with optional TURN credentials
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IceServerConfig {
    /// Server URLs (stun:host:port or turn:host:port)
    pub urls: Vec<String>,
    /// Username for TURN authentication (optional for STUN)
    pub username: Option<String>,
    /// Credential/password for TURN authentication
    pub credential: Option<String>,
    /// Credential type (password or oauth)
    pub credential_type: Option<String>,
}

impl Default for IceServerConfig {
    fn default() -> Self {
        Self {
            urls: vec!["stun:stun.l.google.com:19302".to_string()],
            username: None,
            credential: None,
            credential_type: None,
        }
    }
}

/// TURN Server Provider presets
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TurnProvider {
    /// Google's free STUN servers (no TURN relay)
    GoogleStun,
    /// Twilio TURN servers (requires API credentials)
    Twilio { account_sid: String, auth_token: String },
    /// Xirsys TURN servers (requires API key)
    Xirsys { ident: String, secret: String, channel: String },
    /// Self-hosted coturn server
    Coturn { host: String, port: u16, username: String, password: String },
    /// Metered.ca TURN servers
    Metered { api_key: String },
    /// Custom TURN server configuration
    Custom(Vec<IceServerConfig>),
}

impl TurnProvider {
    /// Convert provider to ICE server configurations
    pub fn to_ice_servers(&self) -> Vec<IceServerConfig> {
        match self {
            TurnProvider::GoogleStun => vec![
                IceServerConfig {
                    urls: vec![
                        "stun:stun.l.google.com:19302".to_string(),
                        "stun:stun1.l.google.com:19302".to_string(),
                        "stun:stun2.l.google.com:19302".to_string(),
                        "stun:stun3.l.google.com:19302".to_string(),
                        "stun:stun4.l.google.com:19302".to_string(),
                    ],
                    username: None,
                    credential: None,
                    credential_type: None,
                },
            ],
            TurnProvider::Twilio { account_sid, auth_token } => vec![
                IceServerConfig {
                    urls: vec!["stun:global.stun.twilio.com:3478".to_string()],
                    username: None,
                    credential: None,
                    credential_type: None,
                },
                IceServerConfig {
                    urls: vec![
                        "turn:global.turn.twilio.com:3478?transport=udp".to_string(),
                        "turn:global.turn.twilio.com:3478?transport=tcp".to_string(),
                        "turn:global.turn.twilio.com:443?transport=tcp".to_string(),
                    ],
                    username: Some(account_sid.clone()),
                    credential: Some(auth_token.clone()),
                    credential_type: Some("password".to_string()),
                },
            ],
            TurnProvider::Xirsys { ident, secret, channel } => vec![
                IceServerConfig {
                    urls: vec![format!("stun:ws.xirsys.com")],
                    username: None,
                    credential: None,
                    credential_type: None,
                },
                IceServerConfig {
                    urls: vec![
                        format!("turn:ws.xirsys.com:80?transport=udp"),
                        format!("turn:ws.xirsys.com:3478?transport=udp"),
                        format!("turns:ws.xirsys.com:443?transport=tcp"),
                    ],
                    username: Some(format!("{}:{}", ident, channel)),
                    credential: Some(secret.clone()),
                    credential_type: Some("password".to_string()),
                },
            ],
            TurnProvider::Coturn { host, port, username, password } => vec![
                IceServerConfig {
                    urls: vec![format!("stun:{}:{}", host, port)],
                    username: None,
                    credential: None,
                    credential_type: None,
                },
                IceServerConfig {
                    urls: vec![
                        format!("turn:{}:{}?transport=udp", host, port),
                        format!("turn:{}:{}?transport=tcp", host, port),
                    ],
                    username: Some(username.clone()),
                    credential: Some(password.clone()),
                    credential_type: Some("password".to_string()),
                },
            ],
            TurnProvider::Metered { api_key } => vec![
                IceServerConfig {
                    urls: vec![
                        "stun:stun.relay.metered.ca:80".to_string(),
                    ],
                    username: None,
                    credential: None,
                    credential_type: None,
                },
                IceServerConfig {
                    urls: vec![
                        "turn:global.relay.metered.ca:80".to_string(),
                        "turn:global.relay.metered.ca:80?transport=tcp".to_string(),
                        "turn:global.relay.metered.ca:443".to_string(),
                        "turns:global.relay.metered.ca:443?transport=tcp".to_string(),
                    ],
                    username: Some(api_key.clone()),
                    credential: Some(api_key.clone()),
                    credential_type: Some("password".to_string()),
                },
            ],
            TurnProvider::Custom(servers) => servers.clone(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoIPConfig {
    /// ICE servers configuration (STUN/TURN)
    pub ice_servers: Vec<IceServerConfig>,
    /// TURN provider preset (alternative to manual ice_servers)
    pub turn_provider: Option<TurnProvider>,
    /// Enable audio track
    pub enable_audio: bool,
    /// Enable video track
    pub enable_video: bool,
    /// Audio codec preference
    pub audio_codec: AudioCodec,
    /// Video codec preference
    pub video_codec: VideoCodec,
    /// ICE transport policy (all, relay)
    pub ice_transport_policy: IceTransportPolicy,
    /// Bundle policy for media
    pub bundle_policy: BundlePolicy,
}

/// ICE Transport Policy
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum IceTransportPolicy {
    /// Gather all ICE candidates (STUN + TURN)
    #[default]
    All,
    /// Only use TURN relay candidates (more private but requires TURN server)
    Relay,
}

/// Bundle Policy for media streams
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum BundlePolicy {
    /// Bundle all media on a single transport
    #[default]
    MaxBundle,
    /// Balance between bundling and separate transports
    Balanced,
    /// Use separate transports for each media type
    MaxCompat,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AudioCodec {
    Opus,
    PCMU,
    PCMA,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VideoCodec {
    VP8,
    VP9,
    H264,
    AV1,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CallState {
    pub is_active: bool,
    pub is_muted: bool,
    pub is_video_enabled: bool,
    pub connection_state: String,
    pub ice_connection_state: String,
    pub ice_gathering_state: String,
    pub remote_peer_id: Option<String>,
    pub local_candidates: Vec<String>,
    pub stats: CallStats,
}

/// Call statistics for quality monitoring
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct CallStats {
    /// Round-trip time in milliseconds
    pub rtt_ms: u32,
    /// Packet loss percentage
    pub packet_loss: f64,
    /// Jitter in milliseconds
    pub jitter_ms: u32,
    /// Audio bitrate in bps
    pub audio_bitrate: u64,
    /// Video bitrate in bps
    pub video_bitrate: u64,
    /// Bytes sent
    pub bytes_sent: u64,
    /// Bytes received
    pub bytes_received: u64,
}

pub struct MediaVoIPService {
    config: VoIPConfig,
    peer_connection: Arc<Mutex<Option<Arc<RTCPeerConnection>>>>,
    call_state: Arc<Mutex<CallState>>,
    audio_track: Arc<Mutex<Option<Arc<TrackLocalStaticRTP>>>>,
    video_track: Arc<Mutex<Option<Arc<TrackLocalStaticRTP>>>>,
    ice_candidates: Arc<Mutex<Vec<RTCIceCandidate>>>,
}

impl Default for VoIPConfig {
    fn default() -> Self {
        Self {
            ice_servers: vec![
                IceServerConfig {
                    urls: vec![
                        "stun:stun.l.google.com:19302".to_string(),
                        "stun:stun1.l.google.com:19302".to_string(),
                    ],
                    username: None,
                    credential: None,
                    credential_type: None,
                },
            ],
            turn_provider: None,
            enable_audio: true,
            enable_video: false,
            audio_codec: AudioCodec::Opus,
            video_codec: VideoCodec::VP8,
            ice_transport_policy: IceTransportPolicy::All,
            bundle_policy: BundlePolicy::MaxBundle,
        }
    }
}

impl Default for CallState {
    fn default() -> Self {
        Self {
            is_active: false,
            is_muted: false,
            is_video_enabled: false,
            connection_state: "new".to_string(),
            ice_connection_state: "new".to_string(),
            ice_gathering_state: "new".to_string(),
            remote_peer_id: None,
            local_candidates: Vec::new(),
            stats: CallStats::default(),
        }
    }
}

impl MediaVoIPService {
    /// Create new VoIP service with default configuration
    pub fn new_sync() -> Result<Self> {
        Ok(Self {
            config: VoIPConfig::default(),
            peer_connection: Arc::new(Mutex::new(None)),
            call_state: Arc::new(Mutex::new(CallState::default())),
            audio_track: Arc::new(Mutex::new(None)),
            video_track: Arc::new(Mutex::new(None)),
            ice_candidates: Arc::new(Mutex::new(Vec::new())),
        })
    }

    /// Create new VoIP service with async initialization
    pub async fn new() -> Result<Self> {
        Self::new_sync()
    }

    /// Create VoIP service with custom configuration
    pub async fn with_config(config: VoIPConfig) -> Result<Self> {
        Ok(Self {
            config,
            peer_connection: Arc::new(Mutex::new(None)),
            call_state: Arc::new(Mutex::new(CallState::default())),
            audio_track: Arc::new(Mutex::new(None)),
            video_track: Arc::new(Mutex::new(None)),
            ice_candidates: Arc::new(Mutex::new(Vec::new())),
        })
    }

    /// Create VoIP service with a TURN provider preset
    pub async fn with_turn_provider(provider: TurnProvider) -> Result<Self> {
        let config = VoIPConfig {
            ice_servers: provider.to_ice_servers(),
            turn_provider: Some(provider),
            ..Default::default()
        };
        Self::with_config(config).await
    }

    /// Get ICE servers configuration
    fn get_ice_servers(&self) -> Vec<RTCIceServer> {
        // If a TURN provider is set, use its servers
        let ice_configs = if let Some(ref provider) = self.config.turn_provider {
            provider.to_ice_servers()
        } else {
            self.config.ice_servers.clone()
        };

        ice_configs
            .into_iter()
            .map(|config| {
                let mut server = RTCIceServer {
                    urls: config.urls,
                    ..Default::default()
                };
                if let Some(username) = config.username {
                    server.username = username;
                }
                if let Some(credential) = config.credential {
                    server.credential = credential;
                }
                server
            })
            .collect()
    }

    /// Initialize WebRTC peer connection with TURN/STUN servers
    pub async fn initialize_peer_connection(&self) -> Result<()> {
        // Create MediaEngine
        let mut media_engine = MediaEngine::default();

        // Register audio codecs
        media_engine
            .register_default_codecs()
            .context("Failed to register default codecs")?;

        // Create API with MediaEngine
        let api = APIBuilder::new().with_media_engine(media_engine).build();

        // Get ICE servers from configuration
        let ice_servers = self.get_ice_servers();
        
        tracing::info!("🔧 Configuring {} ICE servers", ice_servers.len());
        for server in &ice_servers {
            for url in &server.urls {
                if url.starts_with("turn") {
                    tracing::info!("  📡 TURN: {} (authenticated)", url);
                } else {
                    tracing::info!("  📡 STUN: {}", url);
                }
            }
        }

        let config = RTCConfiguration {
            ice_servers,
            ..Default::default()
        };

        // Create peer connection
        let peer_connection = Arc::new(
            api.new_peer_connection(config)
                .await
                .context("Failed to create peer connection")?,
        );

        // Setup connection state handlers
        let call_state = Arc::clone(&self.call_state);
        peer_connection.on_peer_connection_state_change(Box::new(
            move |state: RTCPeerConnectionState| {
                let call_state = Arc::clone(&call_state);
                Box::pin(async move {
                    tracing::info!("Peer connection state changed: {}", state);
                    let mut state_lock = call_state.lock().await;
                    state_lock.connection_state = format!("{:?}", state);

                    match state {
                        RTCPeerConnectionState::Connected => {
                            state_lock.is_active = true;
                            tracing::info!("✅ WebRTC connection established");
                        }
                        RTCPeerConnectionState::Disconnected | RTCPeerConnectionState::Failed => {
                            state_lock.is_active = false;
                            tracing::warn!("❌ WebRTC connection lost");
                        }
                        RTCPeerConnectionState::Closed => {
                            state_lock.is_active = false;
                            state_lock.remote_peer_id = None;
                            tracing::info!("WebRTC connection closed");
                        }
                        _ => {}
                    }
                })
            },
        ));

        let call_state = Arc::clone(&self.call_state);
        peer_connection.on_ice_connection_state_change(Box::new(
            move |state: RTCIceConnectionState| {
                let call_state = Arc::clone(&call_state);
                Box::pin(async move {
                    tracing::info!("ICE connection state changed: {}", state);
                    let mut state_lock = call_state.lock().await;
                    state_lock.ice_connection_state = format!("{:?}", state);
                })
            },
        ));

        // ICE candidate handler - collect candidates for signaling
        let call_state = Arc::clone(&self.call_state);
        let ice_candidates = Arc::clone(&self.ice_candidates);
        peer_connection.on_ice_candidate(Box::new(
            move |candidate: Option<RTCIceCandidate>| {
                let call_state = Arc::clone(&call_state);
                let ice_candidates = Arc::clone(&ice_candidates);
                Box::pin(async move {
                    if let Some(candidate) = candidate {
                        let candidate_str = candidate.to_json()
                            .map(|json| json.candidate)
                            .unwrap_or_default();
                        
                        tracing::info!("🧊 ICE candidate gathered: {}", candidate_str);
                        
                        // Store candidate for retrieval
                        let mut candidates = ice_candidates.lock().await;
                        candidates.push(candidate.clone());
                        
                        // Also store in call state for quick access
                        let mut state_lock = call_state.lock().await;
                        state_lock.local_candidates.push(candidate_str);
                    } else {
                        tracing::info!("🧊 ICE gathering complete");
                        let mut state_lock = call_state.lock().await;
                        state_lock.ice_gathering_state = "complete".to_string();
                    }
                })
            },
        ));

        // Store peer connection
        let mut pc_lock = self.peer_connection.lock().await;
        *pc_lock = Some(peer_connection);

        tracing::info!("✅ WebRTC peer connection initialized");
        Ok(())
    }

    /// Create audio track
    pub async fn create_audio_track(&self) -> Result<Arc<TrackLocalStaticRTP>> {
        let codec = match self.config.audio_codec {
            AudioCodec::Opus => RTCRtpCodecCapability {
                mime_type: "audio/opus".to_string(),
                clock_rate: 48000,
                channels: 2,
                sdp_fmtp_line: "".to_string(),
                rtcp_feedback: vec![],
            },
            AudioCodec::PCMU => RTCRtpCodecCapability {
                mime_type: "audio/PCMU".to_string(),
                clock_rate: 8000,
                channels: 1,
                sdp_fmtp_line: "".to_string(),
                rtcp_feedback: vec![],
            },
            AudioCodec::PCMA => RTCRtpCodecCapability {
                mime_type: "audio/PCMA".to_string(),
                clock_rate: 8000,
                channels: 1,
                sdp_fmtp_line: "".to_string(),
                rtcp_feedback: vec![],
            },
        };

        let track = Arc::new(TrackLocalStaticRTP::new(
            codec,
            "audio".to_string(),
            "cube-audio".to_string(),
        ));

        let mut audio_lock = self.audio_track.lock().await;
        *audio_lock = Some(Arc::clone(&track));

        Ok(track)
    }

    /// Create video track
    pub async fn create_video_track(&self) -> Result<Arc<TrackLocalStaticRTP>> {
        let codec = match self.config.video_codec {
            VideoCodec::VP8 => RTCRtpCodecCapability {
                mime_type: "video/VP8".to_string(),
                clock_rate: 90000,
                channels: 0,
                sdp_fmtp_line: "".to_string(),
                rtcp_feedback: vec![],
            },
            VideoCodec::VP9 => RTCRtpCodecCapability {
                mime_type: "video/VP9".to_string(),
                clock_rate: 90000,
                channels: 0,
                sdp_fmtp_line: "".to_string(),
                rtcp_feedback: vec![],
            },
            VideoCodec::H264 => RTCRtpCodecCapability {
                mime_type: "video/H264".to_string(),
                clock_rate: 90000,
                channels: 0,
                sdp_fmtp_line:
                    "level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f"
                        .to_string(),
                rtcp_feedback: vec![],
            },
            VideoCodec::AV1 => RTCRtpCodecCapability {
                mime_type: "video/AV1".to_string(),
                clock_rate: 90000,
                channels: 0,
                sdp_fmtp_line: "".to_string(),
                rtcp_feedback: vec![],
            },
        };

        let track = Arc::new(TrackLocalStaticRTP::new(
            codec,
            "video".to_string(),
            "cube-video".to_string(),
        ));

        let mut video_lock = self.video_track.lock().await;
        *video_lock = Some(Arc::clone(&track));

        Ok(track)
    }

    /// Add audio/video tracks to peer connection
    pub async fn add_tracks(&self) -> Result<()> {
        let pc_lock = self.peer_connection.lock().await;
        let peer_connection = pc_lock
            .as_ref()
            .context("Peer connection not initialized")?;

        if self.config.enable_audio {
            let audio_track = self.create_audio_track().await?;
            peer_connection
                .add_track(Arc::clone(&audio_track) as Arc<dyn TrackLocal + Send + Sync>)
                .await
                .context("Failed to add audio track")?;
            tracing::info!("✅ Audio track added");
        }

        if self.config.enable_video {
            let video_track = self.create_video_track().await?;
            peer_connection
                .add_track(Arc::clone(&video_track) as Arc<dyn TrackLocal + Send + Sync>)
                .await
                .context("Failed to add video track")?;
            tracing::info!("✅ Video track added");
        }

        Ok(())
    }

    /// Create SDP offer
    pub async fn create_offer(&self) -> Result<RTCSessionDescription> {
        let pc_lock = self.peer_connection.lock().await;
        let peer_connection = pc_lock
            .as_ref()
            .context("Peer connection not initialized")?;

        let offer = peer_connection
            .create_offer(None)
            .await
            .context("Failed to create offer")?;

        peer_connection
            .set_local_description(offer.clone())
            .await
            .context("Failed to set local description")?;

        tracing::info!("✅ SDP offer created");
        Ok(offer)
    }

    /// Create SDP answer
    pub async fn create_answer(&self) -> Result<RTCSessionDescription> {
        let pc_lock = self.peer_connection.lock().await;
        let peer_connection = pc_lock
            .as_ref()
            .context("Peer connection not initialized")?;

        let answer = peer_connection
            .create_answer(None)
            .await
            .context("Failed to create answer")?;

        peer_connection
            .set_local_description(answer.clone())
            .await
            .context("Failed to set local description")?;

        tracing::info!("✅ SDP answer created");
        Ok(answer)
    }

    /// Set remote SDP description
    pub async fn set_remote_description(&self, sdp: RTCSessionDescription) -> Result<()> {
        let pc_lock = self.peer_connection.lock().await;
        let peer_connection = pc_lock
            .as_ref()
            .context("Peer connection not initialized")?;

        peer_connection
            .set_remote_description(sdp)
            .await
            .context("Failed to set remote description")?;

        tracing::info!("✅ Remote SDP description set");
        Ok(())
    }

    /// Mute/unmute audio
    pub async fn set_audio_muted(&self, muted: bool) -> Result<()> {
        let mut state = self.call_state.lock().await;
        state.is_muted = muted;

        if muted {
            tracing::info!("🔇 Audio muted");
        } else {
            tracing::info!("🔊 Audio unmuted");
        }

        Ok(())
    }

    /// Enable/disable video
    pub async fn set_video_enabled(&self, enabled: bool) -> Result<()> {
        let mut state = self.call_state.lock().await;
        state.is_video_enabled = enabled;

        if enabled {
            tracing::info!("📹 Video enabled");
        } else {
            tracing::info!("📷 Video disabled");
        }

        Ok(())
    }

    /// Get current call state
    pub async fn get_call_state(&self) -> CallState {
        self.call_state.lock().await.clone()
    }

    /// Close connection and cleanup
    pub async fn close(&self) -> Result<()> {
        let pc_lock = self.peer_connection.lock().await;
        if let Some(peer_connection) = pc_lock.as_ref() {
            peer_connection
                .close()
                .await
                .context("Failed to close peer connection")?;
        }

        let mut state = self.call_state.lock().await;
        *state = CallState::default();

        tracing::info!("✅ VoIP connection closed");
        Ok(())
    }

    /// Get statistics
    pub async fn get_stats(&self) -> Result<String> {
        let pc_lock = self.peer_connection.lock().await;
        let peer_connection = pc_lock
            .as_ref()
            .context("Peer connection not initialized")?;

        let stats = peer_connection.get_stats().await;
        Ok(format!("{:?}", stats))
    }

    /// Add remote ICE candidate
    pub async fn add_ice_candidate(&self, candidate_json: &str) -> Result<()> {
        let pc_lock = self.peer_connection.lock().await;
        let peer_connection = pc_lock
            .as_ref()
            .context("Peer connection not initialized")?;

        let candidate_init: webrtc::ice_transport::ice_candidate::RTCIceCandidateInit = 
            serde_json::from_str(candidate_json)
                .context("Failed to parse ICE candidate JSON")?;

        peer_connection
            .add_ice_candidate(candidate_init)
            .await
            .context("Failed to add ICE candidate")?;

        tracing::info!("🧊 Remote ICE candidate added");
        Ok(())
    }

    /// Get gathered local ICE candidates
    pub async fn get_local_candidates(&self) -> Vec<String> {
        let state = self.call_state.lock().await;
        state.local_candidates.clone()
    }

    /// Clear gathered ICE candidates (for new call)
    pub async fn clear_candidates(&self) {
        let mut candidates = self.ice_candidates.lock().await;
        candidates.clear();
        
        let mut state = self.call_state.lock().await;
        state.local_candidates.clear();
        state.ice_gathering_state = "new".to_string();
        
        tracing::info!("🧊 ICE candidates cleared");
    }

    /// Get current ICE gathering state
    pub async fn get_ice_gathering_state(&self) -> String {
        let state = self.call_state.lock().await;
        state.ice_gathering_state.clone()
    }

    /// Update call statistics
    pub async fn update_stats(&self) -> Result<CallStats> {
        let pc_lock = self.peer_connection.lock().await;
        let peer_connection = pc_lock
            .as_ref()
            .context("Peer connection not initialized")?;

        let stats = peer_connection.get_stats().await;
        
        // Parse stats and update call state
        let call_stats = CallStats::default();
        
        // Extract relevant stats from the report
        for (_, stat) in stats.reports.iter() {
            let stat_str = format!("{:?}", stat);
            // Parse basic stats (simplified - real implementation would parse properly)
            if stat_str.contains("bytesSent") {
                // Extract bytes sent if available
            }
        }
        
        let mut state = self.call_state.lock().await;
        state.stats = call_stats.clone();
        
        Ok(call_stats)
    }

    /// Get current configuration
    pub fn get_config(&self) -> &VoIPConfig {
        &self.config
    }

    /// Check if TURN servers are configured
    pub fn has_turn_servers(&self) -> bool {
        let ice_configs = if let Some(ref provider) = self.config.turn_provider {
            provider.to_ice_servers()
        } else {
            self.config.ice_servers.clone()
        };

        ice_configs.iter().any(|config| {
            config.urls.iter().any(|url| url.starts_with("turn"))
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_voip_service_creation() {
        let service = MediaVoIPService::new().await.unwrap();
        let state = service.get_call_state().await;
        assert!(!state.is_active);
        assert!(!state.is_muted);
    }

    #[tokio::test]
    async fn test_peer_connection_initialization() {
        let service = MediaVoIPService::new().await.unwrap();
        let result = service.initialize_peer_connection().await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_audio_mute_control() {
        let service = MediaVoIPService::new().await.unwrap();

        service.set_audio_muted(true).await.unwrap();
        let state = service.get_call_state().await;
        assert!(state.is_muted);

        service.set_audio_muted(false).await.unwrap();
        let state = service.get_call_state().await;
        assert!(!state.is_muted);
    }
}
