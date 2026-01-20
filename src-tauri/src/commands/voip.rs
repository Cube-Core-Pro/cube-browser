// VoIP Commands - WebRTC Audio/Video Communication with TURN/STUN Support
// CUBE Elite v6 - Production-Ready Implementation
// Standards: Fortune 500, Zero Omissions, Elite Quality

use crate::services::media_voip_service::{
    AudioCodec, CallState, CallStats, IceServerConfig, IceTransportPolicy,
    BundlePolicy, MediaVoIPService, TurnProvider, VideoCodec, VoIPConfig,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;

/// VoIP state managed by Tauri
pub struct VoIPState {
    pub service: Arc<Mutex<Option<MediaVoIPService>>>,
}

impl VoIPState {
    pub fn new() -> Self {
        Self {
            service: Arc::new(Mutex::new(None)),
        }
    }
}

/// TURN provider configuration for frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TurnProviderConfig {
    /// Provider type: "google_stun", "twilio", "xirsys", "coturn", "metered", "custom"
    pub provider_type: String,
    /// Twilio credentials
    pub twilio_account_sid: Option<String>,
    pub twilio_auth_token: Option<String>,
    /// Xirsys credentials  
    pub xirsys_ident: Option<String>,
    pub xirsys_secret: Option<String>,
    pub xirsys_channel: Option<String>,
    /// Coturn credentials
    pub coturn_host: Option<String>,
    pub coturn_port: Option<u16>,
    pub coturn_username: Option<String>,
    pub coturn_password: Option<String>,
    /// Metered credentials
    pub metered_api_key: Option<String>,
    /// Custom servers
    pub custom_servers: Option<Vec<IceServerConfig>>,
}

impl TurnProviderConfig {
    /// Convert to TurnProvider enum
    pub fn to_turn_provider(&self) -> Option<TurnProvider> {
        match self.provider_type.as_str() {
            "google_stun" => Some(TurnProvider::GoogleStun),
            "twilio" => {
                if let (Some(sid), Some(token)) = (&self.twilio_account_sid, &self.twilio_auth_token) {
                    Some(TurnProvider::Twilio {
                        account_sid: sid.clone(),
                        auth_token: token.clone(),
                    })
                } else {
                    None
                }
            }
            "xirsys" => {
                if let (Some(ident), Some(secret), Some(channel)) = 
                    (&self.xirsys_ident, &self.xirsys_secret, &self.xirsys_channel) {
                    Some(TurnProvider::Xirsys {
                        ident: ident.clone(),
                        secret: secret.clone(),
                        channel: channel.clone(),
                    })
                } else {
                    None
                }
            }
            "coturn" => {
                if let (Some(host), Some(port), Some(user), Some(pass)) = 
                    (&self.coturn_host, &self.coturn_port, &self.coturn_username, &self.coturn_password) {
                    Some(TurnProvider::Coturn {
                        host: host.clone(),
                        port: *port,
                        username: user.clone(),
                        password: pass.clone(),
                    })
                } else {
                    None
                }
            }
            "metered" => {
                if let Some(api_key) = &self.metered_api_key {
                    Some(TurnProvider::Metered {
                        api_key: api_key.clone(),
                    })
                } else {
                    None
                }
            }
            "custom" => {
                if let Some(servers) = &self.custom_servers {
                    Some(TurnProvider::Custom(servers.clone()))
                } else {
                    None
                }
            }
            _ => None,
        }
    }
}

/// Initialize VoIP service with configuration
#[tauri::command]
pub async fn voip_initialize(
    config: VoIPConfig,
    state: State<'_, VoIPState>,
) -> Result<String, String> {
    let service = MediaVoIPService::with_config(config)
        .await
        .map_err(|e| format!("Failed to create VoIP service: {}", e))?;

    service
        .initialize_peer_connection()
        .await
        .map_err(|e| format!("Failed to initialize peer connection: {}", e))?;

    service
        .add_tracks()
        .await
        .map_err(|e| format!("Failed to add tracks: {}", e))?;

    let has_turn = service.has_turn_servers();
    
    let mut service_lock = state.service.lock().await;
    *service_lock = Some(service);

    if has_turn {
        Ok("VoIP service initialized with TURN servers".to_string())
    } else {
        Ok("VoIP service initialized with STUN only (NAT traversal may be limited)".to_string())
    }
}

/// Initialize VoIP with a TURN provider preset
#[tauri::command]
pub async fn voip_initialize_with_provider(
    provider_config: TurnProviderConfig,
    enable_audio: bool,
    enable_video: bool,
    state: State<'_, VoIPState>,
) -> Result<String, String> {
    let provider = provider_config.to_turn_provider()
        .ok_or("Invalid TURN provider configuration")?;

    let config = VoIPConfig {
        ice_servers: provider.to_ice_servers(),
        turn_provider: Some(provider),
        enable_audio,
        enable_video,
        audio_codec: AudioCodec::Opus,
        video_codec: VideoCodec::VP8,
        ice_transport_policy: IceTransportPolicy::All,
        bundle_policy: BundlePolicy::MaxBundle,
    };

    voip_initialize(config, state).await
}

/// Create SDP offer for outgoing call
#[tauri::command]
pub async fn voip_create_offer(state: State<'_, VoIPState>) -> Result<String, String> {
    let service_lock = state.service.lock().await;
    let service = service_lock
        .as_ref()
        .ok_or("VoIP service not initialized")?;

    let offer = service
        .create_offer()
        .await
        .map_err(|e| format!("Failed to create offer: {}", e))?;

    serde_json::to_string(&offer).map_err(|e| format!("Failed to serialize offer: {}", e))
}

/// Create SDP answer for incoming call
#[tauri::command]
pub async fn voip_create_answer(state: State<'_, VoIPState>) -> Result<String, String> {
    let service_lock = state.service.lock().await;
    let service = service_lock
        .as_ref()
        .ok_or("VoIP service not initialized")?;

    let answer = service
        .create_answer()
        .await
        .map_err(|e| format!("Failed to create answer: {}", e))?;

    serde_json::to_string(&answer).map_err(|e| format!("Failed to serialize answer: {}", e))
}

/// Set remote SDP description
#[tauri::command]
pub async fn voip_set_remote_description(
    sdp_json: String,
    state: State<'_, VoIPState>,
) -> Result<String, String> {
    let service_lock = state.service.lock().await;
    let service = service_lock
        .as_ref()
        .ok_or("VoIP service not initialized")?;

    let sdp = serde_json::from_str(&sdp_json).map_err(|e| format!("Failed to parse SDP: {}", e))?;

    service
        .set_remote_description(sdp)
        .await
        .map_err(|e| format!("Failed to set remote description: {}", e))?;

    Ok("Remote description set successfully".to_string())
}

/// Add remote ICE candidate
#[tauri::command]
pub async fn voip_add_ice_candidate(
    candidate_json: String,
    state: State<'_, VoIPState>,
) -> Result<String, String> {
    let service_lock = state.service.lock().await;
    let service = service_lock
        .as_ref()
        .ok_or("VoIP service not initialized")?;

    service
        .add_ice_candidate(&candidate_json)
        .await
        .map_err(|e| format!("Failed to add ICE candidate: {}", e))?;

    Ok("ICE candidate added successfully".to_string())
}

/// Get local ICE candidates
#[tauri::command]
pub async fn voip_get_ice_candidates(state: State<'_, VoIPState>) -> Result<Vec<String>, String> {
    let service_lock = state.service.lock().await;
    let service = service_lock
        .as_ref()
        .ok_or("VoIP service not initialized")?;

    Ok(service.get_local_candidates().await)
}

/// Clear ICE candidates (for new call)
#[tauri::command]
pub async fn voip_clear_candidates(state: State<'_, VoIPState>) -> Result<String, String> {
    let service_lock = state.service.lock().await;
    let service = service_lock
        .as_ref()
        .ok_or("VoIP service not initialized")?;

    service.clear_candidates().await;
    Ok("ICE candidates cleared".to_string())
}

/// Mute or unmute audio
#[tauri::command]
pub async fn voip_set_audio_muted(
    muted: bool,
    state: State<'_, VoIPState>,
) -> Result<String, String> {
    let service_lock = state.service.lock().await;
    let service = service_lock
        .as_ref()
        .ok_or("VoIP service not initialized")?;

    service
        .set_audio_muted(muted)
        .await
        .map_err(|e| format!("Failed to set audio muted: {}", e))?;

    Ok(if muted {
        "Audio muted".to_string()
    } else {
        "Audio unmuted".to_string()
    })
}

/// Enable or disable video
#[tauri::command]
pub async fn voip_set_video_enabled(
    enabled: bool,
    state: State<'_, VoIPState>,
) -> Result<String, String> {
    let service_lock = state.service.lock().await;
    let service = service_lock
        .as_ref()
        .ok_or("VoIP service not initialized")?;

    service
        .set_video_enabled(enabled)
        .await
        .map_err(|e| format!("Failed to set video enabled: {}", e))?;

    Ok(if enabled {
        "Video enabled".to_string()
    } else {
        "Video disabled".to_string()
    })
}

/// Get current call state
#[tauri::command]
pub async fn voip_get_call_state(state: State<'_, VoIPState>) -> Result<CallState, String> {
    let service_lock = state.service.lock().await;
    let service = service_lock
        .as_ref()
        .ok_or("VoIP service not initialized")?;

    Ok(service.get_call_state().await)
}

/// Get connection statistics
#[tauri::command]
pub async fn voip_get_stats(state: State<'_, VoIPState>) -> Result<String, String> {
    let service_lock = state.service.lock().await;
    let service = service_lock
        .as_ref()
        .ok_or("VoIP service not initialized")?;

    service
        .get_stats()
        .await
        .map_err(|e| format!("Failed to get stats: {}", e))
}

/// Get call quality statistics
#[tauri::command]
pub async fn voip_get_call_stats(state: State<'_, VoIPState>) -> Result<CallStats, String> {
    let service_lock = state.service.lock().await;
    let service = service_lock
        .as_ref()
        .ok_or("VoIP service not initialized")?;

    service
        .update_stats()
        .await
        .map_err(|e| format!("Failed to get call stats: {}", e))
}

/// Check if TURN servers are configured
#[tauri::command]
pub async fn voip_has_turn_servers(state: State<'_, VoIPState>) -> Result<bool, String> {
    let service_lock = state.service.lock().await;
    let service = service_lock
        .as_ref()
        .ok_or("VoIP service not initialized")?;

    Ok(service.has_turn_servers())
}

/// Close VoIP connection
#[tauri::command]
pub async fn voip_close(state: State<'_, VoIPState>) -> Result<String, String> {
    let service_lock = state.service.lock().await;
    let service = service_lock
        .as_ref()
        .ok_or("VoIP service not initialized")?;

    service
        .close()
        .await
        .map_err(|e| format!("Failed to close connection: {}", e))?;

    Ok("VoIP connection closed".to_string())
}

/// Quick start call with default config (STUN only)
#[tauri::command]
pub async fn voip_quick_start(
    enable_video: bool,
    state: State<'_, VoIPState>,
) -> Result<String, String> {
    let config = VoIPConfig {
        enable_audio: true,
        enable_video,
        audio_codec: AudioCodec::Opus,
        video_codec: VideoCodec::VP8,
        ..Default::default()
    };

    voip_initialize(config, state).await
}

/// Quick start with Twilio TURN servers
#[tauri::command]
pub async fn voip_quick_start_twilio(
    account_sid: String,
    auth_token: String,
    enable_video: bool,
    state: State<'_, VoIPState>,
) -> Result<String, String> {
    let provider = TurnProvider::Twilio { account_sid, auth_token };
    let config = VoIPConfig {
        ice_servers: provider.to_ice_servers(),
        turn_provider: Some(provider),
        enable_audio: true,
        enable_video,
        audio_codec: AudioCodec::Opus,
        video_codec: VideoCodec::VP8,
        ice_transport_policy: IceTransportPolicy::All,
        bundle_policy: BundlePolicy::MaxBundle,
    };

    voip_initialize(config, state).await
}

/// Quick start with Metered TURN servers (free tier available)
#[tauri::command]
pub async fn voip_quick_start_metered(
    api_key: String,
    enable_video: bool,
    state: State<'_, VoIPState>,
) -> Result<String, String> {
    let provider = TurnProvider::Metered { api_key };
    let config = VoIPConfig {
        ice_servers: provider.to_ice_servers(),
        turn_provider: Some(provider),
        enable_audio: true,
        enable_video,
        audio_codec: AudioCodec::Opus,
        video_codec: VideoCodec::VP8,
        ice_transport_policy: IceTransportPolicy::All,
        bundle_policy: BundlePolicy::MaxBundle,
    };

    voip_initialize(config, state).await
}

// ============================================================================
// Contact Management Commands
// ============================================================================

/// VoIP Contact for addressbook
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoIPContact {
    pub id: String,
    pub name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub sip_uri: Option<String>,
    pub avatar: Option<String>,
    pub status: String,
    pub favorite: bool,
    pub tags: Vec<String>,
}

/// VoIP Contacts State
pub struct VoIPContactsState {
    pub contacts: Arc<Mutex<Vec<VoIPContact>>>,
}

impl VoIPContactsState {
    pub fn new() -> Self {
        Self {
            contacts: Arc::new(Mutex::new(Vec::new())),
        }
    }
}

/// Get all VoIP contacts
#[tauri::command]
pub async fn voip_get_contacts(
    state: State<'_, VoIPContactsState>,
) -> Result<Vec<VoIPContact>, String> {
    let contacts = state.contacts.lock().await;
    Ok(contacts.clone())
}

/// Add a new VoIP contact
#[tauri::command]
pub async fn voip_add_contact(
    contact: VoIPContact,
    state: State<'_, VoIPContactsState>,
) -> Result<VoIPContact, String> {
    let mut contacts = state.contacts.lock().await;
    
    // Generate ID if not provided
    let mut new_contact = contact;
    if new_contact.id.is_empty() {
        new_contact.id = uuid::Uuid::new_v4().to_string();
    }
    
    contacts.push(new_contact.clone());
    Ok(new_contact)
}

/// Delete a VoIP contact
#[tauri::command]
pub async fn voip_delete_contact(
    contact_id: String,
    state: State<'_, VoIPContactsState>,
) -> Result<(), String> {
    let mut contacts = state.contacts.lock().await;
    let initial_len = contacts.len();
    contacts.retain(|c| c.id != contact_id);
    
    if contacts.len() == initial_len {
        return Err(format!("Contact with ID {} not found", contact_id));
    }
    
    Ok(())
}

/// Update a VoIP contact
#[tauri::command]
pub async fn voip_update_contact(
    contact: VoIPContact,
    state: State<'_, VoIPContactsState>,
) -> Result<VoIPContact, String> {
    let mut contacts = state.contacts.lock().await;
    
    if let Some(existing) = contacts.iter_mut().find(|c| c.id == contact.id) {
        *existing = contact.clone();
        Ok(contact)
    } else {
        Err(format!("Contact with ID {} not found", contact.id))
    }
}

// ============================================================================
// Call History Commands
// ============================================================================

/// VoIP Call History Entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoIPCallHistoryEntry {
    pub id: String,
    pub contact_id: Option<String>,
    pub contact_name: String,
    pub phone: Option<String>,
    #[serde(rename = "type")]
    pub call_type: String, // "incoming", "outgoing", "missed"
    pub status: String, // "completed", "missed", "rejected", "failed"
    pub start_time: u64,
    pub end_time: Option<u64>,
    pub duration: u64,
    pub is_video: bool,
}

/// VoIP Call History State
pub struct VoIPCallHistoryState {
    pub history: Arc<Mutex<Vec<VoIPCallHistoryEntry>>>,
}

impl VoIPCallHistoryState {
    pub fn new() -> Self {
        Self {
            history: Arc::new(Mutex::new(Vec::new())),
        }
    }
}

/// Get call history
#[tauri::command]
pub async fn voip_get_call_history(
    limit: Option<usize>,
    state: State<'_, VoIPCallHistoryState>,
) -> Result<Vec<VoIPCallHistoryEntry>, String> {
    let history = state.history.lock().await;
    let limit = limit.unwrap_or(50);
    
    // Return most recent calls first
    let mut entries: Vec<_> = history.iter().cloned().collect();
    entries.sort_by(|a, b| b.start_time.cmp(&a.start_time));
    entries.truncate(limit);
    
    Ok(entries)
}

/// Add call to history
#[tauri::command]
pub async fn voip_add_call_history(
    entry: VoIPCallHistoryEntry,
    state: State<'_, VoIPCallHistoryState>,
) -> Result<VoIPCallHistoryEntry, String> {
    let mut history = state.history.lock().await;
    
    // Generate ID if not provided
    let mut new_entry = entry;
    if new_entry.id.is_empty() {
        new_entry.id = uuid::Uuid::new_v4().to_string();
    }
    
    history.push(new_entry.clone());
    Ok(new_entry)
}

/// Clear call history
#[tauri::command]
pub async fn voip_clear_call_history(
    state: State<'_, VoIPCallHistoryState>,
) -> Result<(), String> {
    let mut history = state.history.lock().await;
    history.clear();
    Ok(())
}

/// Delete specific call from history
#[tauri::command]
pub async fn voip_delete_call_history_entry(
    entry_id: String,
    state: State<'_, VoIPCallHistoryState>,
) -> Result<(), String> {
    let mut history = state.history.lock().await;
    let initial_len = history.len();
    history.retain(|e| e.id != entry_id);
    
    if history.len() == initial_len {
        return Err(format!("Call history entry with ID {} not found", entry_id));
    }
    
    Ok(())
}

// ============================================================================
// Audio Device Commands
// ============================================================================

/// VoIP Audio Device
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoIPAudioDevice {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub device_type: String, // "input" or "output"
    pub is_default: bool,
}

/// VoIP Audio Devices State
pub struct VoIPAudioDevicesState {
    pub input_device: Arc<Mutex<Option<String>>>,
    pub output_device: Arc<Mutex<Option<String>>>,
}

impl VoIPAudioDevicesState {
    pub fn new() -> Self {
        Self {
            input_device: Arc::new(Mutex::new(None)),
            output_device: Arc::new(Mutex::new(None)),
        }
    }
}

/// Get available audio devices
/// Note: In a real implementation, this would enumerate system audio devices
/// using platform-specific APIs (CoreAudio on macOS, WASAPI on Windows, ALSA on Linux)
#[tauri::command]
pub async fn voip_get_audio_devices() -> Result<Vec<VoIPAudioDevice>, String> {
    // For now, return common default devices
    // In production, integrate with cpal or rodio crate for real device enumeration
    let devices = vec![
        VoIPAudioDevice {
            id: "default_input".to_string(),
            name: "Default Microphone".to_string(),
            device_type: "input".to_string(),
            is_default: true,
        },
        VoIPAudioDevice {
            id: "default_output".to_string(),
            name: "Default Speakers".to_string(),
            device_type: "output".to_string(),
            is_default: true,
        },
    ];
    
    // NOTE: Real audio device enumeration via cpal is disabled.
    // To enable, add "audio-devices" feature to Cargo.toml with cpal dependency.
    // #[cfg(feature = "audio-devices")]
    // {
    //     use cpal::traits::{DeviceTrait, HostTrait};
    //     
    //     let host = cpal::default_host();
    //     let mut real_devices = Vec::new();
    //     
    //     // Input devices
    //     if let Ok(input_devices) = host.input_devices() {
    //         for (idx, device) in input_devices.enumerate() {
    //             if let Ok(name) = device.name() {
    //                 real_devices.push(VoIPAudioDevice {
    //                     id: format!("input_{}", idx),
    //                     name,
    //                     device_type: "input".to_string(),
    //                     is_default: idx == 0,
    //                 });
    //             }
    //         }
    //     }
    //     
    //     // Output devices
    //     if let Ok(output_devices) = host.output_devices() {
    //         for (idx, device) in output_devices.enumerate() {
    //             if let Ok(name) = device.name() {
    //                 real_devices.push(VoIPAudioDevice {
    //                     id: format!("output_{}", idx),
    //                     name,
    //                     device_type: "output".to_string(),
    //                     is_default: idx == 0,
    //                 });
    //             }
    //         }
    //     }
    //     
    //     if !real_devices.is_empty() {
    //         return Ok(real_devices);
    //     }
    // }
    
    Ok(devices)
}

/// Set active input device
#[tauri::command]
pub async fn voip_set_input_device(
    device_id: String,
    state: State<'_, VoIPAudioDevicesState>,
) -> Result<(), String> {
    let mut input_device = state.input_device.lock().await;
    *input_device = Some(device_id.clone());
    
    tracing::info!("Set VoIP input device to: {}", device_id);
    Ok(())
}

/// Set active output device
#[tauri::command]
pub async fn voip_set_output_device(
    device_id: String,
    state: State<'_, VoIPAudioDevicesState>,
) -> Result<(), String> {
    let mut output_device = state.output_device.lock().await;
    *output_device = Some(device_id.clone());
    
    tracing::info!("Set VoIP output device to: {}", device_id);
    Ok(())
}

/// Get current active input device
#[tauri::command]
pub async fn voip_get_input_device(
    state: State<'_, VoIPAudioDevicesState>,
) -> Result<Option<String>, String> {
    let input_device = state.input_device.lock().await;
    Ok(input_device.clone())
}

/// Get current active output device
#[tauri::command]
pub async fn voip_get_output_device(
    state: State<'_, VoIPAudioDevicesState>,
) -> Result<Option<String>, String> {
    let output_device = state.output_device.lock().await;
    Ok(output_device.clone())
}
