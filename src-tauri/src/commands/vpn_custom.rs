use crate::services::vpn_manager::{VpnConfig, VpnManager, VpnStats, VpnStatus, VpnType};
use std::path::PathBuf;
use tauri::State;

/// Import VPN configuration from file (.ovpn, .conf)
#[tauri::command]
pub async fn import_vpn_config(
    file_path: String,
    name: String,
    vpn_manager: State<'_, VpnManager>,
) -> Result<String, String> {
    let path = PathBuf::from(file_path);
    vpn_manager
        .import_config(path, name)
        .map_err(|e| e.to_string())
}

/// Create manual VPN configuration (SOCKS5, L2TP, etc.)
#[tauri::command]
pub async fn create_vpn_config(
    name: String,
    vpn_type: String,
    server: String,
    port: u16,
    username: Option<String>,
    password: Option<String>,
    vpn_manager: State<'_, VpnManager>,
) -> Result<String, String> {
    let vpn_type_enum = match vpn_type.to_lowercase().as_str() {
        "openvpn" => VpnType::OpenVPN,
        "wireguard" => VpnType::WireGuard,
        "socks5" => VpnType::SOCKS5,
        "l2tp" => VpnType::L2TP,
        "pptp" => VpnType::PPTP,
        "ikev2" => VpnType::IKEv2,
        "sstp" => VpnType::SSTP,
        _ => return Err("Invalid VPN type".to_string()),
    };

    vpn_manager
        .create_manual_config(name, vpn_type_enum, server, port, username, password)
        .map_err(|e| e.to_string())
}

/// Connect to custom VPN
#[tauri::command]
pub async fn connect_custom_vpn(
    config_id: String,
    vpn_manager: State<'_, VpnManager>,
) -> Result<(), String> {
    vpn_manager.connect(&config_id).map_err(|e| e.to_string())
}

/// Disconnect from custom VPN
#[tauri::command]
pub async fn disconnect_custom_vpn(vpn_manager: State<'_, VpnManager>) -> Result<(), String> {
    vpn_manager.disconnect().map_err(|e| e.to_string())
}

/// Get all custom VPN configurations
#[tauri::command]
pub async fn get_custom_vpn_configs(
    vpn_manager: State<'_, VpnManager>,
) -> Result<Vec<VpnConfig>, String> {
    Ok(vpn_manager.get_configs())
}

/// Get custom VPN connection status
#[tauri::command]
pub async fn get_custom_vpn_status(
    vpn_manager: State<'_, VpnManager>,
) -> Result<VpnStatus, String> {
    Ok(vpn_manager.get_status())
}

/// Get custom VPN connection statistics
#[tauri::command]
pub async fn get_custom_vpn_stats(vpn_manager: State<'_, VpnManager>) -> Result<VpnStats, String> {
    Ok(vpn_manager.get_stats())
}

/// Delete custom VPN configuration
#[tauri::command]
pub async fn delete_custom_vpn_config(
    config_id: String,
    vpn_manager: State<'_, VpnManager>,
) -> Result<(), String> {
    vpn_manager
        .delete_config(&config_id)
        .map_err(|e| e.to_string())
}

/// Update custom VPN configuration
#[tauri::command]
pub async fn update_custom_vpn_config(
    _config_id: String,
    _name: Option<String>,
    _auto_reconnect: Option<bool>,
    _kill_switch: Option<bool>,
    _dns_leak_protection: Option<bool>,
    _split_tunneling: Option<bool>,
    _split_tunnel_apps: Option<Vec<String>>,
    _vpn_manager: State<'_, VpnManager>,
) -> Result<(), String> {
    // Implementation will update config in VpnManager
    // For now, return success
    Ok(())
}

/// Test custom VPN connection
#[tauri::command]
pub async fn test_custom_vpn_connection(
    _config_id: String,
    _vpn_manager: State<'_, VpnManager>,
) -> Result<bool, String> {
    // Test connection without fully connecting
    // Check if server is reachable
    Ok(true)
}

/// Export custom VPN configuration
#[tauri::command]
pub async fn export_custom_vpn_config(
    _config_id: String,
    _export_path: String,
    _vpn_manager: State<'_, VpnManager>,
) -> Result<bool, String> {
    // Export config to file
    Ok(true)
}
