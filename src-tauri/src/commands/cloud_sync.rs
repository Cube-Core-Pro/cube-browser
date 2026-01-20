// src-tauri/src/commands/cloud_sync.rs
// CUBE Elite v6 - Cloud Synchronization System
// Synchronizes user settings, preferences, and data with centralized admin server

use serde::{Deserialize, Serialize};
use tauri::State;
use tokio::sync::Mutex;
use std::collections::HashMap;

// ============================================================================
// TYPES & STRUCTURES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserProfile {
    pub user_id: String,
    pub email: String,
    pub name: String,
    pub avatar_url: Option<String>,
    pub subscription_tier: String,
    pub created_at: String,
    pub last_login: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BillingInfo {
    pub plan_name: String,
    pub plan_id: String,
    pub status: String,
    pub billing_cycle: String,
    pub next_billing_date: Option<String>,
    pub amount: f64,
    pub currency: String,
    pub payment_method: Option<PaymentMethod>,
    pub invoices: Vec<Invoice>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentMethod {
    pub method_type: String,
    pub last_four: String,
    pub expiry_date: Option<String>,
    pub brand: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Invoice {
    pub invoice_id: String,
    pub date: String,
    pub amount: f64,
    pub currency: String,
    pub status: String,
    pub pdf_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncedDevice {
    pub device_id: String,
    pub device_name: String,
    pub device_type: String,
    pub platform: String,
    pub last_sync: String,
    pub is_current: bool,
    pub app_version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CloudBackup {
    pub backup_id: String,
    pub name: String,
    pub created_at: String,
    pub size_bytes: u64,
    pub data_types: Vec<String>,
    pub is_automatic: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncConfig {
    pub sync_enabled: bool,
    pub sync_settings: bool,
    pub sync_workflows: bool,
    pub sync_passwords: bool,
    pub sync_collections: bool,
    pub sync_history: bool,
    pub sync_frequency: String,
    pub last_sync: Option<String>,
    pub conflict_resolution: String,
}

impl Default for SyncConfig {
    fn default() -> Self {
        Self {
            sync_enabled: true,
            sync_settings: true,
            sync_workflows: true,
            sync_passwords: false,
            sync_collections: true,
            sync_history: true,
            sync_frequency: "realtime".to_string(),
            last_sync: None,
            conflict_resolution: "server_wins".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncResult {
    pub success: bool,
    pub synced_at: String,
    pub items_uploaded: u32,
    pub items_downloaded: u32,
    pub conflicts_resolved: u32,
    pub errors: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncedSettings {
    pub general: HashMap<String, serde_json::Value>,
    pub appearance: HashMap<String, serde_json::Value>,
    pub automation: HashMap<String, serde_json::Value>,
    pub browser: HashMap<String, serde_json::Value>,
    pub api_keys: HashMap<String, String>,
    pub custom: HashMap<String, serde_json::Value>,
}

pub struct CloudSyncState {
    pub config: Mutex<SyncConfig>,
    pub user_profile: Mutex<Option<UserProfile>>,
    pub devices: Mutex<Vec<SyncedDevice>>,
    pub auth_token: Mutex<Option<String>>,
}

impl Default for CloudSyncState {
    fn default() -> Self {
        Self {
            config: Mutex::new(SyncConfig::default()),
            user_profile: Mutex::new(None),
            devices: Mutex::new(Vec::new()),
            auth_token: Mutex::new(None),
        }
    }
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CLOUD_API_URL: &str = "https://admin.cube-elite.com/api/v1";
const CURRENT_VERSION: &str = env!("CARGO_PKG_VERSION");

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

fn get_device_id() -> String {
    use std::process::Command;
    
    #[cfg(target_os = "macos")]
    {
        if let Ok(output) = Command::new("ioreg")
            .args(["-rd1", "-c", "IOPlatformExpertDevice"])
            .output()
        {
            let stdout = String::from_utf8_lossy(&output.stdout);
            for line in stdout.lines() {
                if line.contains("IOPlatformUUID") {
                    if let Some(uuid) = line.split('"').nth(3) {
                        return uuid.to_string();
                    }
                }
            }
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        if let Ok(output) = Command::new("wmic")
            .args(["csproduct", "get", "UUID"])
            .output()
        {
            let stdout = String::from_utf8_lossy(&output.stdout);
            if let Some(line) = stdout.lines().nth(1) {
                return line.trim().to_string();
            }
        }
    }
    
    #[cfg(target_os = "linux")]
    {
        if let Ok(uuid) = std::fs::read_to_string("/etc/machine-id") {
            return uuid.trim().to_string();
        }
    }
    
    use std::hash::{Hash, Hasher};
    let mut hasher = std::collections::hash_map::DefaultHasher::new();
    
    if let Ok(hostname) = hostname::get() {
        hostname.to_string_lossy().hash(&mut hasher);
    }
    
    format!("cube-device-{:x}", hasher.finish())
}

async fn get_auth_token(state: &State<'_, CloudSyncState>) -> Result<String, String> {
    let token = state.auth_token.lock().await;
    token.clone().ok_or("Not authenticated".to_string())
}

// ============================================================================
// COMMANDS - AUTHENTICATION
// ============================================================================

#[tauri::command]
pub async fn cloud_authenticate(
    state: State<'_, CloudSyncState>,
    email: String,
    password: String,
) -> Result<UserProfile, String> {
    let client = reqwest::Client::new();
    
    let response = client
        .post(format!("{}/auth/login", CLOUD_API_URL))
        .json(&serde_json::json!({
            "email": email,
            "password": password
        }))
        .send()
        .await
        .map_err(|e| format!("Authentication failed: {}", e))?;
    
    if !response.status().is_success() {
        return Err("Invalid credentials".to_string());
    }
    
    #[derive(Deserialize)]
    struct AuthResponse {
        token: String,
        user: UserProfile,
    }
    
    let auth_response: AuthResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;
    
    {
        let mut token = state.auth_token.lock().await;
        *token = Some(auth_response.token);
    }
    
    {
        let mut profile = state.user_profile.lock().await;
        *profile = Some(auth_response.user.clone());
    }
    
    Ok(auth_response.user)
}

#[tauri::command]
pub async fn cloud_authenticate_oauth(
    state: State<'_, CloudSyncState>,
    oauth_token: String,
) -> Result<UserProfile, String> {
    let client = reqwest::Client::new();
    
    let response = client
        .post(format!("{}/auth/oauth-verify", CLOUD_API_URL))
        .header("Authorization", format!("Bearer {}", oauth_token))
        .send()
        .await
        .map_err(|e| format!("OAuth verification failed: {}", e))?;
    
    if !response.status().is_success() {
        return Err("Invalid OAuth token".to_string());
    }
    
    let user: UserProfile = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse user profile: {}", e))?;
    
    {
        let mut token = state.auth_token.lock().await;
        *token = Some(oauth_token);
    }
    
    {
        let mut profile = state.user_profile.lock().await;
        *profile = Some(user.clone());
    }
    
    Ok(user)
}

#[tauri::command]
pub async fn cloud_logout(state: State<'_, CloudSyncState>) -> Result<(), String> {
    {
        let mut token = state.auth_token.lock().await;
        *token = None;
    }
    
    {
        let mut profile = state.user_profile.lock().await;
        *profile = None;
    }
    
    {
        let mut devices = state.devices.lock().await;
        devices.clear();
    }
    
    Ok(())
}

#[tauri::command]
pub async fn cloud_is_authenticated(state: State<'_, CloudSyncState>) -> Result<bool, String> {
    let token = state.auth_token.lock().await;
    Ok(token.is_some())
}

// ============================================================================
// COMMANDS - USER PROFILE & BILLING
// ============================================================================

#[tauri::command]
pub async fn get_user_profile(
    state: State<'_, CloudSyncState>,
) -> Result<UserProfile, String> {
    let auth_token = get_auth_token(&state).await?;
    
    let client = reqwest::Client::new();
    let response = client
        .get(format!("{}/user/profile", CLOUD_API_URL))
        .header("Authorization", format!("Bearer {}", auth_token))
        .send()
        .await
        .map_err(|e| format!("Failed to fetch profile: {}", e))?;
    
    if !response.status().is_success() {
        return Err("Failed to fetch user profile".to_string());
    }
    
    let profile: UserProfile = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse profile: {}", e))?;
    
    {
        let mut stored_profile = state.user_profile.lock().await;
        *stored_profile = Some(profile.clone());
    }
    
    Ok(profile)
}

#[tauri::command]
pub async fn update_user_profile(
    state: State<'_, CloudSyncState>,
    name: Option<String>,
    avatar_url: Option<String>,
) -> Result<UserProfile, String> {
    let auth_token = get_auth_token(&state).await?;
    
    let mut updates = HashMap::new();
    if let Some(n) = name {
        updates.insert("name", n);
    }
    if let Some(a) = avatar_url {
        updates.insert("avatar_url", a);
    }
    
    let client = reqwest::Client::new();
    let response = client
        .patch(format!("{}/user/profile", CLOUD_API_URL))
        .header("Authorization", format!("Bearer {}", auth_token))
        .json(&updates)
        .send()
        .await
        .map_err(|e| format!("Failed to update profile: {}", e))?;
    
    if !response.status().is_success() {
        return Err("Failed to update profile".to_string());
    }
    
    let profile: UserProfile = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse profile: {}", e))?;
    
    Ok(profile)
}

#[tauri::command]
pub async fn get_billing_info(
    state: State<'_, CloudSyncState>,
) -> Result<BillingInfo, String> {
    let auth_token = get_auth_token(&state).await?;
    
    let client = reqwest::Client::new();
    let response = client
        .get(format!("{}/billing", CLOUD_API_URL))
        .header("Authorization", format!("Bearer {}", auth_token))
        .send()
        .await
        .map_err(|e| format!("Failed to fetch billing info: {}", e))?;
    
    if !response.status().is_success() {
        return Err("Failed to fetch billing information".to_string());
    }
    
    let billing: BillingInfo = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse billing info: {}", e))?;
    
    Ok(billing)
}

#[tauri::command]
pub async fn get_subscription_plans() -> Result<Vec<serde_json::Value>, String> {
    let client = reqwest::Client::new();
    let response = client
        .get(format!("{}/plans", CLOUD_API_URL))
        .send()
        .await
        .map_err(|e| format!("Failed to fetch plans: {}", e))?;
    
    if !response.status().is_success() {
        return Err("Failed to fetch subscription plans".to_string());
    }
    
    let plans: Vec<serde_json::Value> = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse plans: {}", e))?;
    
    Ok(plans)
}

#[tauri::command]
pub async fn update_subscription(
    state: State<'_, CloudSyncState>,
    plan_id: String,
) -> Result<BillingInfo, String> {
    let auth_token = get_auth_token(&state).await?;
    
    let client = reqwest::Client::new();
    let response = client
        .post(format!("{}/billing/upgrade", CLOUD_API_URL))
        .header("Authorization", format!("Bearer {}", auth_token))
        .json(&serde_json::json!({ "plan_id": plan_id }))
        .send()
        .await
        .map_err(|e| format!("Failed to update subscription: {}", e))?;
    
    if !response.status().is_success() {
        return Err("Failed to update subscription".to_string());
    }
    
    let billing: BillingInfo = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse billing info: {}", e))?;
    
    Ok(billing)
}

#[tauri::command]
pub async fn cancel_subscription(
    state: State<'_, CloudSyncState>,
    reason: Option<String>,
) -> Result<BillingInfo, String> {
    let auth_token = get_auth_token(&state).await?;
    
    let client = reqwest::Client::new();
    let response = client
        .post(format!("{}/billing/cancel", CLOUD_API_URL))
        .header("Authorization", format!("Bearer {}", auth_token))
        .json(&serde_json::json!({ "reason": reason }))
        .send()
        .await
        .map_err(|e| format!("Failed to cancel subscription: {}", e))?;
    
    if !response.status().is_success() {
        return Err("Failed to cancel subscription".to_string());
    }
    
    let billing: BillingInfo = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;
    
    Ok(billing)
}

// ============================================================================
// COMMANDS - SYNC OPERATIONS
// ============================================================================

#[tauri::command]
pub async fn sync_to_cloud(
    state: State<'_, CloudSyncState>,
    settings: SyncedSettings,
) -> Result<SyncResult, String> {
    let auth_token = get_auth_token(&state).await?;
    let device_id = get_device_id();
    
    let client = reqwest::Client::new();
    let response = client
        .post(format!("{}/sync/upload", CLOUD_API_URL))
        .header("Authorization", format!("Bearer {}", auth_token))
        .json(&serde_json::json!({
            "device_id": device_id,
            "app_version": CURRENT_VERSION,
            "platform": std::env::consts::OS,
            "settings": settings,
            "timestamp": chrono::Utc::now().to_rfc3339()
        }))
        .send()
        .await
        .map_err(|e| format!("Sync upload failed: {}", e))?;
    
    if !response.status().is_success() {
        return Err("Failed to sync to cloud".to_string());
    }
    
    let result: SyncResult = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse sync result: {}", e))?;
    
    {
        let mut config = state.config.lock().await;
        config.last_sync = Some(chrono::Utc::now().to_rfc3339());
    }
    
    Ok(result)
}

#[tauri::command]
pub async fn sync_from_cloud(
    state: State<'_, CloudSyncState>,
) -> Result<SyncedSettings, String> {
    let auth_token = get_auth_token(&state).await?;
    let device_id = get_device_id();
    
    let client = reqwest::Client::new();
    let response = client
        .get(format!("{}/sync/download", CLOUD_API_URL))
        .header("Authorization", format!("Bearer {}", auth_token))
        .query(&[("device_id", &device_id)])
        .send()
        .await
        .map_err(|e| format!("Sync download failed: {}", e))?;
    
    if !response.status().is_success() {
        return Err("Failed to sync from cloud".to_string());
    }
    
    let settings: SyncedSettings = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse settings: {}", e))?;
    
    Ok(settings)
}

#[tauri::command]
pub async fn get_sync_config(state: State<'_, CloudSyncState>) -> Result<SyncConfig, String> {
    let config = state.config.lock().await;
    Ok(config.clone())
}

#[tauri::command]
pub async fn set_sync_config(
    state: State<'_, CloudSyncState>,
    config: SyncConfig,
) -> Result<(), String> {
    let mut current = state.config.lock().await;
    *current = config;
    Ok(())
}

// ============================================================================
// COMMANDS - DEVICE MANAGEMENT
// ============================================================================

#[tauri::command]
pub async fn get_synced_devices(
    state: State<'_, CloudSyncState>,
) -> Result<Vec<SyncedDevice>, String> {
    let auth_token = get_auth_token(&state).await?;
    
    let client = reqwest::Client::new();
    let response = client
        .get(format!("{}/devices", CLOUD_API_URL))
        .header("Authorization", format!("Bearer {}", auth_token))
        .send()
        .await
        .map_err(|e| format!("Failed to fetch devices: {}", e))?;
    
    if !response.status().is_success() {
        return Err("Failed to fetch devices".to_string());
    }
    
    let mut devices: Vec<SyncedDevice> = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse devices: {}", e))?;
    
    let current_id = get_device_id();
    for device in &mut devices {
        device.is_current = device.device_id == current_id;
    }
    
    {
        let mut stored = state.devices.lock().await;
        *stored = devices.clone();
    }
    
    Ok(devices)
}

#[tauri::command]
pub async fn register_device(
    state: State<'_, CloudSyncState>,
    device_name: String,
) -> Result<SyncedDevice, String> {
    let auth_token = get_auth_token(&state).await?;
    let device_id = get_device_id();
    
    let client = reqwest::Client::new();
    let response = client
        .post(format!("{}/devices", CLOUD_API_URL))
        .header("Authorization", format!("Bearer {}", auth_token))
        .json(&serde_json::json!({
            "device_id": device_id,
            "device_name": device_name,
            "device_type": "desktop",
            "platform": std::env::consts::OS,
            "app_version": CURRENT_VERSION
        }))
        .send()
        .await
        .map_err(|e| format!("Failed to register device: {}", e))?;
    
    if !response.status().is_success() {
        return Err("Failed to register device".to_string());
    }
    
    let device: SyncedDevice = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse device: {}", e))?;
    
    Ok(device)
}

#[tauri::command]
pub async fn remove_device(
    state: State<'_, CloudSyncState>,
    device_id: String,
) -> Result<(), String> {
    let auth_token = get_auth_token(&state).await?;
    
    let client = reqwest::Client::new();
    let response = client
        .delete(format!("{}/devices/{}", CLOUD_API_URL, device_id))
        .header("Authorization", format!("Bearer {}", auth_token))
        .send()
        .await
        .map_err(|e| format!("Failed to remove device: {}", e))?;
    
    if !response.status().is_success() {
        return Err("Failed to remove device".to_string());
    }
    
    {
        let mut devices = state.devices.lock().await;
        devices.retain(|d| d.device_id != device_id);
    }
    
    Ok(())
}

// ============================================================================
// COMMANDS - CLOUD BACKUPS
// ============================================================================

#[tauri::command]
pub async fn get_cloud_backups(
    state: State<'_, CloudSyncState>,
) -> Result<Vec<CloudBackup>, String> {
    let auth_token = get_auth_token(&state).await?;
    
    let client = reqwest::Client::new();
    let response = client
        .get(format!("{}/backups", CLOUD_API_URL))
        .header("Authorization", format!("Bearer {}", auth_token))
        .send()
        .await
        .map_err(|e| format!("Failed to fetch backups: {}", e))?;
    
    if !response.status().is_success() {
        return Err("Failed to fetch backups".to_string());
    }
    
    let backups: Vec<CloudBackup> = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse backups: {}", e))?;
    
    Ok(backups)
}

#[tauri::command]
pub async fn create_cloud_backup(
    state: State<'_, CloudSyncState>,
    name: String,
    settings: SyncedSettings,
) -> Result<CloudBackup, String> {
    let auth_token = get_auth_token(&state).await?;
    
    let client = reqwest::Client::new();
    let response = client
        .post(format!("{}/backups", CLOUD_API_URL))
        .header("Authorization", format!("Bearer {}", auth_token))
        .json(&serde_json::json!({
            "name": name,
            "settings": settings,
            "is_automatic": false
        }))
        .send()
        .await
        .map_err(|e| format!("Failed to create backup: {}", e))?;
    
    if !response.status().is_success() {
        return Err("Failed to create backup".to_string());
    }
    
    let backup: CloudBackup = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse backup: {}", e))?;
    
    Ok(backup)
}

#[tauri::command]
pub async fn restore_cloud_backup(
    state: State<'_, CloudSyncState>,
    backup_id: String,
) -> Result<SyncedSettings, String> {
    let auth_token = get_auth_token(&state).await?;
    
    let client = reqwest::Client::new();
    let response = client
        .get(format!("{}/backups/{}/restore", CLOUD_API_URL, backup_id))
        .header("Authorization", format!("Bearer {}", auth_token))
        .send()
        .await
        .map_err(|e| format!("Failed to restore backup: {}", e))?;
    
    if !response.status().is_success() {
        return Err("Failed to restore backup".to_string());
    }
    
    let settings: SyncedSettings = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse settings: {}", e))?;
    
    Ok(settings)
}

#[tauri::command]
pub async fn delete_cloud_backup(
    state: State<'_, CloudSyncState>,
    backup_id: String,
) -> Result<(), String> {
    let auth_token = get_auth_token(&state).await?;
    
    let client = reqwest::Client::new();
    let response = client
        .delete(format!("{}/backups/{}", CLOUD_API_URL, backup_id))
        .header("Authorization", format!("Bearer {}", auth_token))
        .send()
        .await
        .map_err(|e| format!("Failed to delete backup: {}", e))?;
    
    if !response.status().is_success() {
        return Err("Failed to delete backup".to_string());
    }
    
    Ok(())
}
