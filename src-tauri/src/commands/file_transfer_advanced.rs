// ============================================================================
// FILE TRANSFER - Advanced Features Backend
// ============================================================================
// P2P Sync, Bandwidth Control, Version History, LAN Transfer, Selective Sync

use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

// ============================================================================
// P2P SYNC TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct P2PPeer {
    pub id: String,
    pub name: String,
    pub public_key: String,
    pub addresses: Vec<String>,
    pub is_online: bool,
    pub last_seen: u64,
    pub shared_folders: Vec<String>,
    pub bandwidth_upload: u32,
    pub bandwidth_download: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ShareableLink {
    pub id: String,
    pub file_id: String,
    pub file_name: String,
    pub url: String,
    pub short_url: String,
    pub password: Option<String>,
    pub expires_at: u64,
    pub download_count: u32,
    pub download_limit: Option<u32>,
    pub created_at: u64,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct P2PSyncConfig {
    pub peers: Vec<P2PPeer>,
    pub links: Vec<ShareableLink>,
    pub is_p2p_enabled: bool,
}

pub struct P2PSyncState {
    config: Mutex<P2PSyncConfig>,
}

impl Default for P2PSyncState {
    fn default() -> Self {
        let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
        Self {
            config: Mutex::new(P2PSyncConfig {
                is_p2p_enabled: true,
                peers: vec![
                    P2PPeer { id: String::from("peer-1"), name: String::from("MacBook Pro - Work"), public_key: String::from("ed25519:abc123..."), addresses: vec![String::from("/ip4/192.168.1.100/tcp/4001")], is_online: true, last_seen: now, shared_folders: vec![String::from("/Documents"), String::from("/Projects")], bandwidth_upload: 50, bandwidth_download: 120 },
                    P2PPeer { id: String::from("peer-2"), name: String::from("Desktop PC - Home"), public_key: String::from("ed25519:def456..."), addresses: vec![String::from("/ip4/192.168.1.101/tcp/4001")], is_online: true, last_seen: now - 300, shared_folders: vec![String::from("/Backup"), String::from("/Media")], bandwidth_upload: 200, bandwidth_download: 200 },
                    P2PPeer { id: String::from("peer-3"), name: String::from("iPhone 15 Pro"), public_key: String::from("ed25519:ghi789..."), addresses: vec![], is_online: false, last_seen: now - 7200, shared_folders: vec![String::from("/Photos")], bandwidth_upload: 10, bandwidth_download: 50 },
                ],
                links: vec![
                    ShareableLink { id: String::from("link-1"), file_id: String::from("file-1"), file_name: String::from("Project_Proposal.pdf"), url: String::from("https://cube.link/abc123"), short_url: String::from("cube.link/abc123"), password: None, expires_at: now + 7 * 24 * 60 * 60, download_count: 5, download_limit: Some(10), created_at: now - 2 * 24 * 60 * 60, is_active: true },
                    ShareableLink { id: String::from("link-2"), file_id: String::from("file-2"), file_name: String::from("Team_Photos.zip"), url: String::from("https://cube.link/def456"), short_url: String::from("cube.link/def456"), password: Some(String::from("****")), expires_at: now + 30 * 24 * 60 * 60, download_count: 12, download_limit: None, created_at: now - 5 * 24 * 60 * 60, is_active: true },
                ],
            }),
        }
    }
}

#[tauri::command]
pub async fn get_p2p_sync_config(state: State<'_, P2PSyncState>) -> Result<P2PSyncConfig, String> {
    state.config.lock().map(|c| c.clone()).map_err(|e| format!("Lock error: {}", e))
}

#[tauri::command]
pub async fn remove_p2p_peer(peer_id: String, state: State<'_, P2PSyncState>) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    config.peers.retain(|p| p.id != peer_id);
    Ok(())
}

#[tauri::command]
pub async fn delete_shareable_link(link_id: String, state: State<'_, P2PSyncState>) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    config.links.retain(|l| l.id != link_id);
    Ok(())
}

// ============================================================================
// BANDWIDTH CONTROL TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BandwidthRule {
    pub id: String,
    pub name: String,
    pub upload_limit_mbps: Option<u32>,
    pub download_limit_mbps: Option<u32>,
    pub schedule_enabled: bool,
    pub schedule_start: String,
    pub schedule_end: String,
    pub days: Vec<String>,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BandwidthStats {
    pub current_upload_mbps: f64,
    pub current_download_mbps: f64,
    pub total_uploaded_gb: f64,
    pub total_downloaded_gb: f64,
    pub peak_upload_mbps: f64,
    pub peak_download_mbps: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BandwidthConfig {
    pub rules: Vec<BandwidthRule>,
    pub stats: BandwidthStats,
    pub global_upload_limit: Option<u32>,
    pub global_download_limit: Option<u32>,
}

pub struct BandwidthControlState {
    config: Mutex<BandwidthConfig>,
}

impl Default for BandwidthControlState {
    fn default() -> Self {
        Self {
            config: Mutex::new(BandwidthConfig {
                rules: vec![
                    BandwidthRule { id: String::from("rule-1"), name: String::from("Work Hours"), upload_limit_mbps: Some(50), download_limit_mbps: Some(100), schedule_enabled: true, schedule_start: String::from("09:00"), schedule_end: String::from("18:00"), days: vec![String::from("mon"), String::from("tue"), String::from("wed"), String::from("thu"), String::from("fri")], is_active: true },
                    BandwidthRule { id: String::from("rule-2"), name: String::from("Night Backup"), upload_limit_mbps: None, download_limit_mbps: None, schedule_enabled: true, schedule_start: String::from("00:00"), schedule_end: String::from("06:00"), days: vec![String::from("mon"), String::from("tue"), String::from("wed"), String::from("thu"), String::from("fri"), String::from("sat"), String::from("sun")], is_active: true },
                ],
                stats: BandwidthStats { current_upload_mbps: 12.5, current_download_mbps: 45.2, total_uploaded_gb: 128.5, total_downloaded_gb: 512.3, peak_upload_mbps: 95.0, peak_download_mbps: 180.0 },
                global_upload_limit: Some(100),
                global_download_limit: Some(200),
            }),
        }
    }
}

#[tauri::command]
pub async fn get_bandwidth_config(state: State<'_, BandwidthControlState>) -> Result<BandwidthConfig, String> {
    state.config.lock().map(|c| c.clone()).map_err(|e| format!("Lock error: {}", e))
}

#[tauri::command]
pub async fn toggle_bandwidth_rule(rule_id: String, enabled: bool, state: State<'_, BandwidthControlState>) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    if let Some(rule) = config.rules.iter_mut().find(|r| r.id == rule_id) {
        rule.is_active = enabled;
    }
    Ok(())
}

// ============================================================================
// VERSION HISTORY TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileVersion {
    pub id: String,
    pub file_id: String,
    pub file_name: String,
    pub version_number: u32,
    pub size_bytes: u64,
    pub modified_at: u64,
    pub modified_by: String,
    pub hash: String,
    pub is_current: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VersionHistoryConfig {
    pub versions: Vec<FileVersion>,
    pub retention_days: u32,
    pub max_versions_per_file: u32,
}

pub struct VersionHistoryState {
    config: Mutex<VersionHistoryConfig>,
}

impl Default for VersionHistoryState {
    fn default() -> Self {
        let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
        Self {
            config: Mutex::new(VersionHistoryConfig {
                retention_days: 30,
                max_versions_per_file: 50,
                versions: vec![
                    FileVersion { id: String::from("v-1"), file_id: String::from("file-1"), file_name: String::from("report.docx"), version_number: 3, size_bytes: 125000, modified_at: now, modified_by: String::from("You"), hash: String::from("sha256:abc123"), is_current: true },
                    FileVersion { id: String::from("v-2"), file_id: String::from("file-1"), file_name: String::from("report.docx"), version_number: 2, size_bytes: 120000, modified_at: now - 3600, modified_by: String::from("You"), hash: String::from("sha256:def456"), is_current: false },
                    FileVersion { id: String::from("v-3"), file_id: String::from("file-1"), file_name: String::from("report.docx"), version_number: 1, size_bytes: 115000, modified_at: now - 86400, modified_by: String::from("You"), hash: String::from("sha256:ghi789"), is_current: false },
                ],
            }),
        }
    }
}

#[tauri::command]
pub async fn get_version_history(state: State<'_, VersionHistoryState>) -> Result<VersionHistoryConfig, String> {
    state.config.lock().map(|c| c.clone()).map_err(|e| format!("Lock error: {}", e))
}

#[tauri::command]
pub async fn restore_version(version_id: String, state: State<'_, VersionHistoryState>) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    // Find the version to restore
    if let Some(version) = config.versions.iter().find(|v| v.id == version_id) {
        let file_id = version.file_id.clone();
        
        // Mark all versions of this file as not current
        for v in &mut config.versions {
            if v.file_id == file_id {
                v.is_current = false;
            }
        }
        
        // Mark the restored version as current
        if let Some(v) = config.versions.iter_mut().find(|v| v.id == version_id) {
            v.is_current = true;
        }
    }
    
    Ok(())
}

// ============================================================================
// LAN TRANSFER TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LANDevice {
    pub id: String,
    pub name: String,
    pub ip_address: String,
    pub device_type: String,
    pub os: String,
    pub is_trusted: bool,
    pub last_transfer: Option<u64>,
    pub total_transferred_mb: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LANTransferConfig {
    pub devices: Vec<LANDevice>,
    pub is_discoverable: bool,
    pub require_confirmation: bool,
    pub allowed_file_types: Vec<String>,
}

pub struct LANTransferState {
    config: Mutex<LANTransferConfig>,
}

impl Default for LANTransferState {
    fn default() -> Self {
        let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
        Self {
            config: Mutex::new(LANTransferConfig {
                is_discoverable: true,
                require_confirmation: true,
                allowed_file_types: vec![String::from("*")],
                devices: vec![
                    LANDevice { id: String::from("dev-1"), name: String::from("MacBook Pro"), ip_address: String::from("192.168.1.100"), device_type: String::from("laptop"), os: String::from("macOS"), is_trusted: true, last_transfer: Some(now - 3600), total_transferred_mb: 5240 },
                    LANDevice { id: String::from("dev-2"), name: String::from("Windows Desktop"), ip_address: String::from("192.168.1.101"), device_type: String::from("desktop"), os: String::from("Windows 11"), is_trusted: true, last_transfer: Some(now - 86400), total_transferred_mb: 12800 },
                    LANDevice { id: String::from("dev-3"), name: String::from("iPhone 15 Pro"), ip_address: String::from("192.168.1.102"), device_type: String::from("phone"), os: String::from("iOS"), is_trusted: false, last_transfer: None, total_transferred_mb: 0 },
                ],
            }),
        }
    }
}

#[tauri::command]
pub async fn get_lan_transfer_config(state: State<'_, LANTransferState>) -> Result<LANTransferConfig, String> {
    state.config.lock().map(|c| c.clone()).map_err(|e| format!("Lock error: {}", e))
}

#[tauri::command]
pub async fn toggle_lan_device_trust(device_id: String, trusted: bool, state: State<'_, LANTransferState>) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    if let Some(device) = config.devices.iter_mut().find(|d| d.id == device_id) {
        device.is_trusted = trusted;
    }
    Ok(())
}

// ============================================================================
// SELECTIVE SYNC TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncFolder {
    pub id: String,
    pub path: String,
    pub name: String,
    pub size_bytes: u64,
    pub file_count: u32,
    pub is_synced: bool,
    pub sync_status: String,
    pub last_sync: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SelectiveSyncConfig {
    pub folders: Vec<SyncFolder>,
    pub total_local_size_gb: f64,
    pub total_cloud_size_gb: f64,
    pub sync_all_by_default: bool,
}

pub struct SelectiveSyncState {
    config: Mutex<SelectiveSyncConfig>,
}

impl Default for SelectiveSyncState {
    fn default() -> Self {
        let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
        Self {
            config: Mutex::new(SelectiveSyncConfig {
                sync_all_by_default: false,
                total_local_size_gb: 45.2,
                total_cloud_size_gb: 128.5,
                folders: vec![
                    SyncFolder { id: String::from("folder-1"), path: String::from("/Documents"), name: String::from("Documents"), size_bytes: 5_000_000_000, file_count: 1250, is_synced: true, sync_status: String::from("synced"), last_sync: Some(now - 300) },
                    SyncFolder { id: String::from("folder-2"), path: String::from("/Projects"), name: String::from("Projects"), size_bytes: 15_000_000_000, file_count: 8500, is_synced: true, sync_status: String::from("syncing"), last_sync: Some(now - 60) },
                    SyncFolder { id: String::from("folder-3"), path: String::from("/Media"), name: String::from("Media"), size_bytes: 80_000_000_000, file_count: 25000, is_synced: false, sync_status: String::from("cloud_only"), last_sync: None },
                    SyncFolder { id: String::from("folder-4"), path: String::from("/Backups"), name: String::from("Backups"), size_bytes: 25_000_000_000, file_count: 500, is_synced: true, sync_status: String::from("synced"), last_sync: Some(now - 86400) },
                ],
            }),
        }
    }
}

#[tauri::command]
pub async fn get_selective_sync_config(state: State<'_, SelectiveSyncState>) -> Result<SelectiveSyncConfig, String> {
    state.config.lock().map(|c| c.clone()).map_err(|e| format!("Lock error: {}", e))
}

#[tauri::command]
pub async fn toggle_folder_sync(folder_id: String, synced: bool, state: State<'_, SelectiveSyncState>) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    if let Some(folder) = config.folders.iter_mut().find(|f| f.id == folder_id) {
        folder.is_synced = synced;
        folder.sync_status = if synced { String::from("syncing") } else { String::from("cloud_only") };
    }
    Ok(())
}
