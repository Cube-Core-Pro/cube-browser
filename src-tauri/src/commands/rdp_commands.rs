use crate::services::rdp_manager::{RdpColorDepth, RdpManager, RdpQuality};
use tauri::State;

/// Create RDP configuration
#[tauri::command]
pub async fn create_rdp_config(
    name: String,
    host: String,
    port: Option<u16>,
    username: String,
    password: Option<String>,
    domain: Option<String>,
    rdp_manager: State<'_, RdpManager>,
) -> Result<String, String> {
    rdp_manager
        .create_config(name, host, port, username, password, domain)
        .map_err(|e| e.to_string())
}

/// Connect RDP session
#[tauri::command]
pub async fn connect_rdp(
    config_id: String,
    rdp_manager: State<'_, RdpManager>,
) -> Result<String, String> {
    rdp_manager.connect(&config_id).map_err(|e| e.to_string())
}

/// Disconnect RDP session
#[tauri::command]
pub async fn disconnect_rdp(
    session_id: String,
    rdp_manager: State<'_, RdpManager>,
) -> Result<(), String> {
    rdp_manager
        .disconnect(&session_id)
        .map_err(|e| e.to_string())
}

/// Get all RDP configurations
#[tauri::command]
pub async fn get_rdp_configs(
    rdp_manager: State<'_, RdpManager>,
) -> Result<Vec<serde_json::Value>, String> {
    Ok(rdp_manager
        .get_configs()
        .into_iter()
        .map(|c| serde_json::to_value(c).unwrap())
        .collect())
}

/// Get active RDP sessions
#[tauri::command]
pub async fn get_active_rdp_sessions(
    rdp_manager: State<'_, RdpManager>,
) -> Result<Vec<serde_json::Value>, String> {
    Ok(rdp_manager
        .get_active_sessions()
        .into_iter()
        .map(|s| serde_json::to_value(s).unwrap())
        .collect())
}

/// Delete RDP configuration
#[tauri::command]
pub async fn delete_rdp_config(
    config_id: String,
    rdp_manager: State<'_, RdpManager>,
) -> Result<(), String> {
    rdp_manager
        .delete_config(&config_id)
        .map_err(|e| e.to_string())
}

/// Update RDP configuration display settings
#[tauri::command]
pub async fn update_rdp_display(
    config_id: String,
    fullscreen: Option<bool>,
    width: Option<u32>,
    height: Option<u32>,
    color_depth: Option<String>,
    quality: Option<String>,
    rdp_manager: State<'_, RdpManager>,
) -> Result<(), String> {
    let color = if let Some(depth) = color_depth {
        Some(match depth.as_str() {
            "15" => RdpColorDepth::Color15Bit,
            "16" => RdpColorDepth::Color16Bit,
            "24" => RdpColorDepth::Color24Bit,
            "32" => RdpColorDepth::Color32Bit,
            _ => return Err("Invalid color depth. Use: 15, 16, 24, 32".to_string()),
        })
    } else {
        None
    };

    let qual = if let Some(q) = quality {
        Some(match q.to_lowercase().as_str() {
            "low" => RdpQuality::Low,
            "medium" => RdpQuality::Medium,
            "high" => RdpQuality::High,
            "automatic" => RdpQuality::Automatic,
            _ => return Err("Invalid quality. Use: low, medium, high, automatic".to_string()),
        })
    } else {
        None
    };

    rdp_manager
        .update_config(&config_id, fullscreen, width, height, color, qual)
        .map_err(|e| e.to_string())
}

/// Test RDP connection by checking TCP port availability
#[tauri::command]
pub async fn test_rdp_connection(
    config_id: String,
    rdp_manager: State<'_, RdpManager>,
) -> Result<bool, String> {
    rdp_manager
        .test_connection(&config_id)
        .await
        .map_err(|e| e.to_string())
}
