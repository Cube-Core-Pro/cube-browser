use crate::services::ssh_manager::{PortForward, SshAuthMethod, SshKeyType, SshManager};
use tauri::State;

/// Create SSH configuration
#[tauri::command]
pub async fn create_ssh_config(
    name: String,
    host: String,
    port: Option<u16>,
    username: String,
    auth_method: String,
    password: Option<String>,
    private_key_path: Option<String>,
    ssh_manager: State<'_, SshManager>,
) -> Result<String, String> {
    let auth = match auth_method.to_lowercase().as_str() {
        "password" => SshAuthMethod::Password,
        "publickey" => SshAuthMethod::PublicKey,
        "both" => SshAuthMethod::Both,
        _ => return Err("Invalid auth method. Use: password, publickey, both".to_string()),
    };

    let key_path = private_key_path.map(std::path::PathBuf::from);

    ssh_manager
        .create_config(name, host, port, username, auth, password, key_path)
        .map_err(|e| e.to_string())
}

/// Connect SSH session
#[tauri::command]
pub async fn connect_ssh(
    config_id: String,
    ssh_manager: State<'_, SshManager>,
) -> Result<String, String> {
    ssh_manager.connect(&config_id).map_err(|e| e.to_string())
}

/// Execute command on SSH session
#[tauri::command]
pub async fn execute_ssh_command(
    session_id: String,
    command: String,
    ssh_manager: State<'_, SshManager>,
) -> Result<serde_json::Value, String> {
    ssh_manager
        .execute_command(&session_id, &command)
        .map(|output| serde_json::to_value(output).unwrap())
        .map_err(|e| e.to_string())
}

/// Disconnect SSH session
#[tauri::command]
pub async fn disconnect_ssh(
    session_id: String,
    ssh_manager: State<'_, SshManager>,
) -> Result<(), String> {
    ssh_manager
        .disconnect(&session_id)
        .map_err(|e| e.to_string())
}

/// Get all SSH configurations
#[tauri::command]
pub async fn get_ssh_configs(
    ssh_manager: State<'_, SshManager>,
) -> Result<Vec<serde_json::Value>, String> {
    Ok(ssh_manager
        .get_configs()
        .into_iter()
        .map(|c| serde_json::to_value(c).unwrap())
        .collect())
}

/// Get active SSH sessions
#[tauri::command]
pub async fn get_active_ssh_sessions(
    ssh_manager: State<'_, SshManager>,
) -> Result<Vec<serde_json::Value>, String> {
    Ok(ssh_manager
        .get_active_sessions()
        .into_iter()
        .map(|s| serde_json::to_value(s).unwrap())
        .collect())
}

/// Delete SSH configuration
#[tauri::command]
pub async fn delete_ssh_config(
    config_id: String,
    ssh_manager: State<'_, SshManager>,
) -> Result<(), String> {
    ssh_manager
        .delete_config(&config_id)
        .map_err(|e| e.to_string())
}

/// Generate SSH key pair
#[tauri::command]
pub async fn generate_ssh_key(
    name: String,
    key_type: String,
    comment: Option<String>,
    ssh_manager: State<'_, SshManager>,
) -> Result<String, String> {
    let key_type_enum = match key_type.to_lowercase().as_str() {
        "rsa2048" => SshKeyType::RSA2048,
        "rsa4096" => SshKeyType::RSA4096,
        "ed25519" => SshKeyType::ED25519,
        "ecdsa" => SshKeyType::ECDSA,
        _ => return Err("Invalid key type. Use: rsa2048, rsa4096, ed25519, ecdsa".to_string()),
    };

    ssh_manager
        .generate_key_pair(name, key_type_enum, comment)
        .map_err(|e| e.to_string())
}

/// Get all SSH key pairs
#[tauri::command]
pub async fn get_ssh_keys(
    ssh_manager: State<'_, SshManager>,
) -> Result<Vec<serde_json::Value>, String> {
    Ok(ssh_manager
        .get_key_pairs()
        .into_iter()
        .map(|k| serde_json::to_value(k).unwrap())
        .collect())
}

/// Delete SSH key pair
#[tauri::command]
pub async fn delete_ssh_key(
    key_id: String,
    ssh_manager: State<'_, SshManager>,
) -> Result<(), String> {
    ssh_manager
        .delete_key_pair(&key_id)
        .map_err(|e| e.to_string())
}

/// Get command history
#[tauri::command]
pub async fn get_ssh_command_history(
    limit: Option<usize>,
    ssh_manager: State<'_, SshManager>,
) -> Result<Vec<String>, String> {
    Ok(ssh_manager.get_command_history(limit))
}

/// Clear command history
#[tauri::command]
pub async fn clear_ssh_command_history(ssh_manager: State<'_, SshManager>) -> Result<(), String> {
    ssh_manager
        .clear_command_history()
        .map_err(|e| e.to_string())
}

/// Setup port forwarding
#[tauri::command]
pub async fn setup_ssh_port_forward(
    session_id: String,
    local_host: String,
    local_port: u16,
    remote_host: String,
    remote_port: u16,
    ssh_manager: State<'_, SshManager>,
) -> Result<(), String> {
    let forward = PortForward {
        local_host,
        local_port,
        remote_host,
        remote_port,
    };

    ssh_manager
        .setup_port_forward(&session_id, forward)
        .map_err(|e| e.to_string())
}
