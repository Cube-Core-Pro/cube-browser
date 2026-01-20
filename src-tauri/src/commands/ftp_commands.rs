use crate::services::ftp_manager::{FtpManager, FtpProtocol};
use std::path::PathBuf;
use tauri::State;

/// Create FTP site configuration
#[tauri::command]
pub async fn create_ftp_site(
    site: serde_json::Value,
    ftp_manager: State<'_, FtpManager>,
) -> Result<serde_json::Value, String> {
    // Accept a JSON object from the frontend and map to the existing create_site API
    let name = site
        .get("name")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    let protocol = site
        .get("protocol")
        .and_then(|v| v.as_str())
        .unwrap_or("sftp")
        .to_string();
    let host = site
        .get("host")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    let port = site.get("port").and_then(|v| v.as_u64()).map(|p| p as u16);
    let username = site
        .get("username")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    // Frontend currently sends password in `password_encrypted` field (plain text for now)
    let password = site
        .get("password_encrypted")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    let ssh_key_path = site
        .get("ssh_key_path")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let proto = match protocol.to_lowercase().as_str() {
        "ftp" => FtpProtocol::FTP,
        "ftps" => FtpProtocol::FTPS,
        "sftp" => FtpProtocol::SFTP,
        "ftpes" => FtpProtocol::FTPES,
        _ => return Err("Invalid protocol. Use: ftp, ftps, sftp, ftpes".to_string()),
    };

    let key = ssh_key_path.map(PathBuf::from);

    let site_id = ftp_manager
        .create_site(name, proto, host, port, username, password, key)
        .map_err(|e| e.to_string())?;

    // return the created site as JSON so the UI can immediately use it
    let created = ftp_manager
        .get_sites()
        .into_iter()
        .find(|s| s.id == site_id)
        .map(|s| serde_json::to_value(s).unwrap());

    match created {
        Some(v) => Ok(v),
        None => Err("Failed to return created site".to_string()),
    }
}

/// Get all FTP sites
#[tauri::command]
pub async fn get_ftp_sites(
    ftp_manager: State<'_, FtpManager>,
) -> Result<Vec<serde_json::Value>, String> {
    Ok(ftp_manager
        .get_sites()
        .into_iter()
        .map(|s| serde_json::to_value(s).unwrap())
        .collect())
}

/// Delete FTP site
#[tauri::command]
pub async fn delete_ftp_site(
    site_id: String,
    ftp_manager: State<'_, FtpManager>,
) -> Result<(), String> {
    ftp_manager.delete_site(&site_id).map_err(|e| e.to_string())
}

/// List directory contents
#[tauri::command]
pub async fn list_ftp_directory(
    params: serde_json::Value,
    ftp_manager: State<'_, FtpManager>,
) -> Result<Vec<serde_json::Value>, String> {
    let site_id = params
        .get("siteId")
        .or_else(|| params.get("site_id"))
        .and_then(|v| v.as_str())
        .ok_or_else(|| "Missing siteId".to_string())?
        .to_string();

    let path = params
        .get("path")
        .and_then(|v| v.as_str())
        .unwrap_or("/")
        .to_string();

    ftp_manager
        .list_directory(&site_id, &path)
        .map(|entries| {
            entries
                .into_iter()
                .map(|e| serde_json::to_value(e).unwrap())
                .collect()
        })
        .map_err(|e| e.to_string())
}

/// Upload file
#[tauri::command]
pub async fn upload_ftp_file(
    params: serde_json::Value,
    ftp_manager: State<'_, FtpManager>,
) -> Result<String, String> {
    let site_id = params
        .get("siteId")
        .or_else(|| params.get("site_id"))
        .and_then(|v| v.as_str())
        .ok_or_else(|| "Missing siteId".to_string())?
        .to_string();

    let local_path = params
        .get("localPath")
        .or_else(|| params.get("local_path"))
        .and_then(|v| v.as_str())
        .ok_or_else(|| "Missing localPath".to_string())?
        .to_string();

    let remote_path = params
        .get("remotePath")
        .or_else(|| params.get("remote_path"))
        .and_then(|v| v.as_str())
        .ok_or_else(|| "Missing remotePath".to_string())?
        .to_string();

    let local = PathBuf::from(local_path);
    ftp_manager
        .upload_file(&site_id, local, remote_path)
        .map_err(|e| e.to_string())
}

/// Download file
#[tauri::command]
pub async fn download_ftp_file(
    params: serde_json::Value,
    ftp_manager: State<'_, FtpManager>,
) -> Result<String, String> {
    let site_id = params
        .get("siteId")
        .or_else(|| params.get("site_id"))
        .and_then(|v| v.as_str())
        .ok_or_else(|| "Missing siteId".to_string())?
        .to_string();

    let remote_path = params
        .get("remotePath")
        .or_else(|| params.get("remote_path"))
        .and_then(|v| v.as_str())
        .ok_or_else(|| "Missing remotePath".to_string())?
        .to_string();

    let local_path = params
        .get("localPath")
        .or_else(|| params.get("local_path"))
        .and_then(|v| v.as_str())
        .ok_or_else(|| "Missing localPath".to_string())?
        .to_string();

    let local = PathBuf::from(local_path);
    ftp_manager
        .download_file(&site_id, remote_path, local)
        .map_err(|e| e.to_string())
}

/// Get transfer queue
#[tauri::command]
pub async fn get_ftp_transfer_queue(
    ftp_manager: State<'_, FtpManager>,
) -> Result<Vec<serde_json::Value>, String> {
    Ok(ftp_manager
        .get_transfer_queue()
        .into_iter()
        .map(|t| serde_json::to_value(t).unwrap())
        .collect())
}

/// Pause transfer
#[tauri::command]
pub async fn pause_ftp_transfer(
    params: serde_json::Value,
    ftp_manager: State<'_, FtpManager>,
) -> Result<(), String> {
    let transfer_id = params
        .get("transferId")
        .or_else(|| params.get("transfer_id"))
        .and_then(|v| v.as_str())
        .ok_or_else(|| "Missing transferId".to_string())?
        .to_string();

    ftp_manager
        .pause_transfer(&transfer_id)
        .map_err(|e| e.to_string())
}

/// Resume transfer
#[tauri::command]
pub async fn resume_ftp_transfer(
    params: serde_json::Value,
    ftp_manager: State<'_, FtpManager>,
) -> Result<(), String> {
    let transfer_id = params
        .get("transferId")
        .or_else(|| params.get("transfer_id"))
        .and_then(|v| v.as_str())
        .ok_or_else(|| "Missing transferId".to_string())?
        .to_string();

    ftp_manager
        .resume_transfer(&transfer_id)
        .map_err(|e| e.to_string())
}

/// Cancel transfer
#[tauri::command]
pub async fn cancel_ftp_transfer(
    params: serde_json::Value,
    ftp_manager: State<'_, FtpManager>,
) -> Result<(), String> {
    let transfer_id = params
        .get("transferId")
        .or_else(|| params.get("transfer_id"))
        .and_then(|v| v.as_str())
        .ok_or_else(|| "Missing transferId".to_string())?
        .to_string();

    ftp_manager
        .cancel_transfer(&transfer_id)
        .map_err(|e| e.to_string())
}

/// Start FTP server
#[tauri::command]
pub async fn start_ftp_server(
    params: serde_json::Value,
    ftp_manager: State<'_, FtpManager>,
) -> Result<(), String> {
    // Accept a `config` object from frontend (support camelCase or snake_case)
    let config_val = params
        .get("config")
        .or_else(|| params.get("serverConfig"))
        .ok_or_else(|| "Missing config object".to_string())?
        .clone();

    let port = config_val
        .get("port")
        .and_then(|v| v.as_u64())
        .map(|p| p as u16)
        .unwrap_or(21);

    let passive_start = config_val
        .get("passive_ports")
        .and_then(|v| v.get(0))
        .and_then(|v| v.as_u64())
        .map(|p| p as u16)
        .unwrap_or(50000);

    let passive_end = config_val
        .get("passive_ports")
        .and_then(|v| v.get(1))
        .and_then(|v| v.as_u64())
        .map(|p| p as u16)
        .unwrap_or(50100);

    let max_connections = config_val
        .get("max_connections")
        .or_else(|| config_val.get("maxConnections"))
        .and_then(|v| v.as_u64())
        .map(|v| v as u32)
        .unwrap_or(10);

    let anonymous_allowed = config_val
        .get("anonymous_allowed")
        .or_else(|| config_val.get("anonymousAllowed"))
        .and_then(|v| v.as_bool())
        .unwrap_or(false);

    let root_directory = config_val
        .get("root_directory")
        .or_else(|| config_val.get("rootDirectory"))
        .and_then(|v| v.as_str())
        .unwrap_or("/tmp/ftp")
        .to_string();

    let config = crate::services::ftp_manager::FtpServerConfig {
        enabled: true,
        port,
        passive_ports: (passive_start, passive_end),
        max_connections,
        anonymous_allowed,
        root_directory: PathBuf::from(root_directory),
        users: Vec::new(),
    };

    ftp_manager.start_server(config).map_err(|e| e.to_string())
}

/// Stop FTP server
#[tauri::command]
pub async fn stop_ftp_server(ftp_manager: State<'_, FtpManager>) -> Result<(), String> {
    ftp_manager.stop_server().map_err(|e| e.to_string())
}

/// Get FTP server status
#[tauri::command]
pub async fn get_ftp_server_status(
    ftp_manager: State<'_, FtpManager>,
) -> Result<serde_json::Value, String> {
    Ok(serde_json::to_value(ftp_manager.get_server_status()).unwrap())
}

/// Test FTP connection
#[tauri::command]
pub async fn test_ftp_connection(
    params: serde_json::Value,
    ftp_manager: State<'_, FtpManager>,
) -> Result<bool, String> {
    let site_id = params
        .get("siteId")
        .or_else(|| params.get("site_id"))
        .and_then(|v| v.as_str())
        .ok_or_else(|| "Missing siteId".to_string())?
        .to_string();

    // Try to list the root directory as a basic connectivity check
    match ftp_manager.list_directory(&site_id, "/") {
        Ok(_) => Ok(true),
        Err(e) => Err(e.to_string()),
    }
}

/// Update site settings (accept full site object from frontend)
#[tauri::command]
pub async fn update_ftp_site(
    site: serde_json::Value,
    ftp_manager: State<'_, FtpManager>,
) -> Result<serde_json::Value, String> {
    // Deserialize into the internal FtpSite representation
    let site_obj: crate::services::ftp_manager::FtpSite =
        serde_json::from_value(site.clone()).map_err(|e| format!("Invalid site object: {}", e))?;

    ftp_manager
        .update_site(site_obj)
        .map_err(|e| e.to_string())?;

    // Return the updated site
    Ok(site)
}

/// Change file permissions (chmod) - SFTP only
#[tauri::command]
pub async fn ftp_chmod(
    params: serde_json::Value,
    ftp_manager: State<'_, FtpManager>,
) -> Result<(), String> {
    let site_id = params
        .get("siteId")
        .or_else(|| params.get("site_id"))
        .and_then(|v| v.as_str())
        .ok_or_else(|| "Missing siteId".to_string())?
        .to_string();

    let remote_path = params
        .get("remotePath")
        .or_else(|| params.get("remote_path"))
        .and_then(|v| v.as_str())
        .ok_or_else(|| "Missing remotePath".to_string())?
        .to_string();

    let mode = params
        .get("mode")
        .and_then(|v| v.as_u64())
        .ok_or_else(|| "Missing mode".to_string())? as u32;

    ftp_manager
        .chmod(&site_id, &remote_path, mode)
        .map_err(|e| e.to_string())
}

/// Delete remote file or directory
#[tauri::command]
pub async fn ftp_delete(
    params: serde_json::Value,
    ftp_manager: State<'_, FtpManager>,
) -> Result<(), String> {
    let site_id = params
        .get("siteId")
        .or_else(|| params.get("site_id"))
        .and_then(|v| v.as_str())
        .ok_or_else(|| "Missing siteId".to_string())?
        .to_string();

    let remote_path = params
        .get("remotePath")
        .or_else(|| params.get("remote_path"))
        .and_then(|v| v.as_str())
        .ok_or_else(|| "Missing remotePath".to_string())?
        .to_string();

    let is_directory = params
        .get("isDirectory")
        .or_else(|| params.get("is_directory"))
        .and_then(|v| v.as_bool())
        .unwrap_or(false);

    ftp_manager
        .delete_remote(&site_id, &remote_path, is_directory)
        .map_err(|e| e.to_string())
}

/// Rename remote file or directory
#[tauri::command]
pub async fn ftp_rename(
    params: serde_json::Value,
    ftp_manager: State<'_, FtpManager>,
) -> Result<(), String> {
    let site_id = params
        .get("siteId")
        .or_else(|| params.get("site_id"))
        .and_then(|v| v.as_str())
        .ok_or_else(|| "Missing siteId".to_string())?
        .to_string();

    let old_path = params
        .get("oldPath")
        .or_else(|| params.get("old_path"))
        .and_then(|v| v.as_str())
        .ok_or_else(|| "Missing oldPath".to_string())?
        .to_string();

    let new_path = params
        .get("newPath")
        .or_else(|| params.get("new_path"))
        .and_then(|v| v.as_str())
        .ok_or_else(|| "Missing newPath".to_string())?
        .to_string();

    ftp_manager
        .rename_remote(&site_id, &old_path, &new_path)
        .map_err(|e| e.to_string())
}

/// Create remote directory
#[tauri::command]
pub async fn ftp_mkdir(
    params: serde_json::Value,
    ftp_manager: State<'_, FtpManager>,
) -> Result<(), String> {
    let site_id = params
        .get("siteId")
        .or_else(|| params.get("site_id"))
        .and_then(|v| v.as_str())
        .ok_or_else(|| "Missing siteId".to_string())?
        .to_string();

    let remote_path = params
        .get("remotePath")
        .or_else(|| params.get("remote_path"))
        .and_then(|v| v.as_str())
        .ok_or_else(|| "Missing remotePath".to_string())?
        .to_string();

    ftp_manager
        .create_directory(&site_id, &remote_path)
        .map_err(|e| e.to_string())
}
