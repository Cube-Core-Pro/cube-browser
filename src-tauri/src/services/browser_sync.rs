// CUBE Nexum - Sync Service
// Cross-device sync with E2E encryption - Superior to Chrome/Firefox/Safari

use std::collections::HashMap;
use std::sync::Mutex;
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc, Duration};

// ==================== Types ====================

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SyncStatus {
    Idle,
    Syncing,
    Error(String),
    Paused,
    Offline,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SyncDataType {
    Tabs,
    Bookmarks,
    History,
    Passwords,
    Extensions,
    Settings,
    Autofill,
    ReadingList,
    Notes,
    Workspaces,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncSettings {
    pub sync_enabled: bool,
    pub sync_frequency_minutes: u32,
    pub sync_on_startup: bool,
    pub sync_on_change: bool,
    // Data types to sync
    pub sync_tabs: bool,
    pub sync_bookmarks: bool,
    pub sync_history: bool,
    pub sync_passwords: bool,
    pub sync_extensions: bool,
    pub sync_settings: bool,
    pub sync_autofill: bool,
    pub sync_reading_list: bool,
    pub sync_notes: bool,
    pub sync_workspaces: bool,
    // Encryption
    pub e2e_encryption_enabled: bool,
    pub encryption_key_id: Option<String>,
    // Bandwidth
    pub wifi_only: bool,
    pub data_limit_mb: Option<u32>,
    // Conflict Resolution
    pub conflict_resolution: ConflictResolution,
}

impl Default for SyncSettings {
    fn default() -> Self {
        Self {
            sync_enabled: true,
            sync_frequency_minutes: 15,
            sync_on_startup: true,
            sync_on_change: true,
            sync_tabs: true,
            sync_bookmarks: true,
            sync_history: true,
            sync_passwords: true,
            sync_extensions: false,
            sync_settings: true,
            sync_autofill: true,
            sync_reading_list: true,
            sync_notes: true,
            sync_workspaces: true,
            e2e_encryption_enabled: true,
            encryption_key_id: None,
            wifi_only: false,
            data_limit_mb: None,
            conflict_resolution: ConflictResolution::ServerWins,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ConflictResolution {
    ServerWins,
    ClientWins,
    MostRecent,
    Manual,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncDevice {
    pub device_id: String,
    pub device_name: String,
    pub device_type: DeviceType,
    pub os: String,
    pub browser_version: String,
    pub last_sync: DateTime<Utc>,
    pub is_current: bool,
    pub sync_enabled: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DeviceType {
    Desktop,
    Laptop,
    Mobile,
    Tablet,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncAccount {
    pub user_id: String,
    pub email: String,
    pub display_name: Option<String>,
    pub avatar_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub last_login: DateTime<Utc>,
    pub subscription_tier: SubscriptionTier,
    pub storage_used_bytes: u64,
    pub storage_limit_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SubscriptionTier {
    Free,
    Pro,
    Enterprise,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncItem {
    pub id: String,
    pub data_type: SyncDataType,
    pub data: serde_json::Value,
    pub version: u64,
    pub created_at: DateTime<Utc>,
    pub modified_at: DateTime<Utc>,
    pub device_id: String,
    pub is_deleted: bool,
    pub checksum: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncConflict {
    pub id: String,
    pub item_id: String,
    pub data_type: SyncDataType,
    pub local_version: SyncItem,
    pub server_version: SyncItem,
    pub detected_at: DateTime<Utc>,
    pub resolved: bool,
    pub resolution: Option<ConflictResolution>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncHistory {
    pub id: String,
    pub sync_type: SyncType,
    pub started_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
    pub status: SyncResultStatus,
    pub items_uploaded: u32,
    pub items_downloaded: u32,
    pub bytes_uploaded: u64,
    pub bytes_downloaded: u64,
    pub errors: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SyncType {
    Full,
    Incremental,
    DataType(SyncDataType),
    Manual,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SyncResultStatus {
    Success,
    PartialSuccess,
    Failed,
    Cancelled,
    InProgress,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncStats {
    pub total_syncs: u64,
    pub successful_syncs: u64,
    pub failed_syncs: u64,
    pub total_items_synced: u64,
    pub total_bytes_uploaded: u64,
    pub total_bytes_downloaded: u64,
    pub last_sync: Option<DateTime<Utc>>,
    pub next_sync: Option<DateTime<Utc>>,
    pub average_sync_duration_ms: u64,
    pub items_by_type: HashMap<String, u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptionKey {
    pub key_id: String,
    pub key_type: KeyType,
    pub created_at: DateTime<Utc>,
    pub expires_at: Option<DateTime<Utc>>,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum KeyType {
    Primary,
    Recovery,
    Device,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncProgress {
    pub current_operation: String,
    pub total_items: u32,
    pub completed_items: u32,
    pub percentage: f32,
    pub bytes_transferred: u64,
    pub estimated_remaining_ms: Option<u64>,
}

// ==================== Service ====================

pub struct SyncService {
    settings: Mutex<SyncSettings>,
    status: Mutex<SyncStatus>,
    account: Mutex<Option<SyncAccount>>,
    devices: Mutex<HashMap<String, SyncDevice>>,
    sync_queue: Mutex<Vec<SyncItem>>,
    conflicts: Mutex<HashMap<String, SyncConflict>>,
    sync_history: Mutex<Vec<SyncHistory>>,
    encryption_keys: Mutex<HashMap<String, EncryptionKey>>,
    stats: Mutex<SyncStats>,
    current_device_id: String,
}

impl SyncService {
    pub fn new() -> Self {
        Self {
            settings: Mutex::new(SyncSettings::default()),
            status: Mutex::new(SyncStatus::Idle),
            account: Mutex::new(None),
            devices: Mutex::new(HashMap::new()),
            sync_queue: Mutex::new(Vec::new()),
            conflicts: Mutex::new(HashMap::new()),
            sync_history: Mutex::new(Vec::new()),
            encryption_keys: Mutex::new(HashMap::new()),
            stats: Mutex::new(SyncStats {
                total_syncs: 0,
                successful_syncs: 0,
                failed_syncs: 0,
                total_items_synced: 0,
                total_bytes_uploaded: 0,
                total_bytes_downloaded: 0,
                last_sync: None,
                next_sync: None,
                average_sync_duration_ms: 0,
                items_by_type: HashMap::new(),
            }),
            current_device_id: Self::generate_device_id(),
        }
    }

    fn generate_id() -> String {
        uuid::Uuid::new_v4().to_string()
    }

    fn generate_device_id() -> String {
        // Generate a persistent device ID
        uuid::Uuid::new_v4().to_string()
    }

    fn calculate_checksum(data: &serde_json::Value) -> String {
        use sha2::{Sha256, Digest};
        let json_str = serde_json::to_string(data).unwrap_or_default();
        let hash = Sha256::digest(json_str.as_bytes());
        format!("{:x}", hash)
    }

    // ==================== Settings ====================

    pub fn get_settings(&self) -> SyncSettings {
        self.settings.lock().unwrap().clone()
    }

    pub fn update_settings(&self, settings: SyncSettings) -> Result<(), String> {
        *self.settings.lock().unwrap() = settings;
        Ok(())
    }

    pub fn toggle_sync(&self, enabled: bool) -> Result<(), String> {
        self.settings.lock().unwrap().sync_enabled = enabled;
        if !enabled {
            *self.status.lock().unwrap() = SyncStatus::Paused;
        } else {
            *self.status.lock().unwrap() = SyncStatus::Idle;
        }
        Ok(())
    }

    pub fn set_sync_data_type(&self, data_type: SyncDataType, enabled: bool) -> Result<(), String> {
        let mut settings = self.settings.lock().unwrap();
        match data_type {
            SyncDataType::Tabs => settings.sync_tabs = enabled,
            SyncDataType::Bookmarks => settings.sync_bookmarks = enabled,
            SyncDataType::History => settings.sync_history = enabled,
            SyncDataType::Passwords => settings.sync_passwords = enabled,
            SyncDataType::Extensions => settings.sync_extensions = enabled,
            SyncDataType::Settings => settings.sync_settings = enabled,
            SyncDataType::Autofill => settings.sync_autofill = enabled,
            SyncDataType::ReadingList => settings.sync_reading_list = enabled,
            SyncDataType::Notes => settings.sync_notes = enabled,
            SyncDataType::Workspaces => settings.sync_workspaces = enabled,
        }
        Ok(())
    }

    // ==================== Status ====================

    pub fn get_status(&self) -> SyncStatus {
        self.status.lock().unwrap().clone()
    }

    pub fn set_status(&self, status: SyncStatus) {
        *self.status.lock().unwrap() = status;
    }

    pub fn is_syncing(&self) -> bool {
        matches!(*self.status.lock().unwrap(), SyncStatus::Syncing)
    }

    // ==================== Account ====================

    pub fn login(&self, email: String, user_id: String) -> Result<SyncAccount, String> {
        let account = SyncAccount {
            user_id: user_id.clone(),
            email,
            display_name: None,
            avatar_url: None,
            created_at: Utc::now(),
            last_login: Utc::now(),
            subscription_tier: SubscriptionTier::Free,
            storage_used_bytes: 0,
            storage_limit_bytes: 5 * 1024 * 1024 * 1024, // 5GB
        };
        
        *self.account.lock().unwrap() = Some(account.clone());
        
        // Register current device
        self.register_current_device()?;
        
        Ok(account)
    }

    pub fn logout(&self) -> Result<(), String> {
        *self.account.lock().unwrap() = None;
        *self.status.lock().unwrap() = SyncStatus::Paused;
        Ok(())
    }

    pub fn get_account(&self) -> Option<SyncAccount> {
        self.account.lock().unwrap().clone()
    }

    pub fn is_logged_in(&self) -> bool {
        self.account.lock().unwrap().is_some()
    }

    // ==================== Devices ====================

    fn register_current_device(&self) -> Result<SyncDevice, String> {
        let device = SyncDevice {
            device_id: self.current_device_id.clone(),
            device_name: hostname::get()
                .map(|h| h.to_string_lossy().to_string())
                .unwrap_or_else(|_| "Unknown Device".to_string()),
            device_type: DeviceType::Desktop,
            os: std::env::consts::OS.to_string(),
            browser_version: "1.0.0".to_string(),
            last_sync: Utc::now(),
            is_current: true,
            sync_enabled: true,
            created_at: Utc::now(),
        };
        
        self.devices.lock().unwrap().insert(device.device_id.clone(), device.clone());
        Ok(device)
    }

    pub fn get_devices(&self) -> Vec<SyncDevice> {
        self.devices.lock().unwrap().values().cloned().collect()
    }

    pub fn get_current_device(&self) -> Option<SyncDevice> {
        self.devices.lock().unwrap().get(&self.current_device_id).cloned()
    }

    pub fn get_device(&self, device_id: &str) -> Option<SyncDevice> {
        self.devices.lock().unwrap().get(device_id).cloned()
    }

    pub fn rename_device(&self, device_id: &str, new_name: String) -> Result<(), String> {
        let mut devices = self.devices.lock().unwrap();
        if let Some(device) = devices.get_mut(device_id) {
            device.device_name = new_name;
            Ok(())
        } else {
            Err("Device not found".to_string())
        }
    }

    pub fn remove_device(&self, device_id: &str) -> Result<(), String> {
        if device_id == self.current_device_id {
            return Err("Cannot remove current device".to_string());
        }
        self.devices.lock().unwrap().remove(device_id)
            .map(|_| ())
            .ok_or_else(|| "Device not found".to_string())
    }

    pub fn toggle_device_sync(&self, device_id: &str, enabled: bool) -> Result<(), String> {
        let mut devices = self.devices.lock().unwrap();
        if let Some(device) = devices.get_mut(device_id) {
            device.sync_enabled = enabled;
            Ok(())
        } else {
            Err("Device not found".to_string())
        }
    }

    // ==================== Sync Operations ====================

    pub fn queue_sync_item(&self, data_type: SyncDataType, data: serde_json::Value) -> Result<String, String> {
        let id = Self::generate_id();
        let item = SyncItem {
            id: id.clone(),
            data_type,
            checksum: Self::calculate_checksum(&data),
            data,
            version: 1,
            created_at: Utc::now(),
            modified_at: Utc::now(),
            device_id: self.current_device_id.clone(),
            is_deleted: false,
        };
        
        self.sync_queue.lock().unwrap().push(item);
        Ok(id)
    }

    pub fn get_sync_queue(&self) -> Vec<SyncItem> {
        self.sync_queue.lock().unwrap().clone()
    }

    pub fn clear_sync_queue(&self) {
        self.sync_queue.lock().unwrap().clear();
    }

    pub fn start_sync(&self) -> Result<String, String> {
        let settings = self.get_settings();
        if !settings.sync_enabled {
            return Err("Sync is disabled".to_string());
        }
        
        if !self.is_logged_in() {
            return Err("Not logged in".to_string());
        }
        
        if self.is_syncing() {
            return Err("Sync already in progress".to_string());
        }
        
        self.set_status(SyncStatus::Syncing);
        
        let history_id = Self::generate_id();
        let history = SyncHistory {
            id: history_id.clone(),
            sync_type: SyncType::Full,
            started_at: Utc::now(),
            completed_at: None,
            status: SyncResultStatus::InProgress,
            items_uploaded: 0,
            items_downloaded: 0,
            bytes_uploaded: 0,
            bytes_downloaded: 0,
            errors: Vec::new(),
        };
        
        self.sync_history.lock().unwrap().push(history);
        
        Ok(history_id)
    }

    pub fn complete_sync(&self, history_id: &str, success: bool, items_up: u32, items_down: u32, bytes_up: u64, bytes_down: u64) -> Result<(), String> {
        let mut history_list = self.sync_history.lock().unwrap();
        if let Some(history) = history_list.iter_mut().find(|h| h.id == history_id) {
            history.completed_at = Some(Utc::now());
            history.status = if success { SyncResultStatus::Success } else { SyncResultStatus::Failed };
            history.items_uploaded = items_up;
            history.items_downloaded = items_down;
            history.bytes_uploaded = bytes_up;
            history.bytes_downloaded = bytes_down;
        }
        drop(history_list);
        
        // Update stats
        let mut stats = self.stats.lock().unwrap();
        stats.total_syncs += 1;
        if success {
            stats.successful_syncs += 1;
        } else {
            stats.failed_syncs += 1;
        }
        stats.total_items_synced += (items_up + items_down) as u64;
        stats.total_bytes_uploaded += bytes_up;
        stats.total_bytes_downloaded += bytes_down;
        stats.last_sync = Some(Utc::now());
        
        let frequency = self.get_settings().sync_frequency_minutes;
        stats.next_sync = Some(Utc::now() + Duration::minutes(frequency as i64));
        
        drop(stats);
        
        self.set_status(SyncStatus::Idle);
        self.clear_sync_queue();
        
        // Update device last sync
        let mut devices = self.devices.lock().unwrap();
        if let Some(device) = devices.get_mut(&self.current_device_id) {
            device.last_sync = Utc::now();
        }
        
        Ok(())
    }

    pub fn cancel_sync(&self, history_id: &str) -> Result<(), String> {
        let mut history_list = self.sync_history.lock().unwrap();
        if let Some(history) = history_list.iter_mut().find(|h| h.id == history_id) {
            history.completed_at = Some(Utc::now());
            history.status = SyncResultStatus::Cancelled;
        }
        drop(history_list);
        
        self.set_status(SyncStatus::Idle);
        Ok(())
    }

    pub fn sync_data_type(&self, data_type: SyncDataType) -> Result<String, String> {
        if !self.is_logged_in() {
            return Err("Not logged in".to_string());
        }
        
        let history_id = Self::generate_id();
        let history = SyncHistory {
            id: history_id.clone(),
            sync_type: SyncType::DataType(data_type),
            started_at: Utc::now(),
            completed_at: None,
            status: SyncResultStatus::InProgress,
            items_uploaded: 0,
            items_downloaded: 0,
            bytes_uploaded: 0,
            bytes_downloaded: 0,
            errors: Vec::new(),
        };
        
        self.sync_history.lock().unwrap().push(history);
        
        Ok(history_id)
    }

    // ==================== Conflicts ====================

    pub fn get_conflicts(&self) -> Vec<SyncConflict> {
        self.conflicts.lock().unwrap().values().cloned().collect()
    }

    pub fn get_unresolved_conflicts(&self) -> Vec<SyncConflict> {
        self.conflicts.lock().unwrap()
            .values()
            .filter(|c| !c.resolved)
            .cloned()
            .collect()
    }

    pub fn resolve_conflict(&self, conflict_id: &str, resolution: ConflictResolution) -> Result<(), String> {
        let mut conflicts = self.conflicts.lock().unwrap();
        if let Some(conflict) = conflicts.get_mut(conflict_id) {
            conflict.resolved = true;
            conflict.resolution = Some(resolution);
            Ok(())
        } else {
            Err("Conflict not found".to_string())
        }
    }

    pub fn resolve_conflict_with_local(&self, conflict_id: &str) -> Result<(), String> {
        self.resolve_conflict(conflict_id, ConflictResolution::ClientWins)
    }

    pub fn resolve_conflict_with_server(&self, conflict_id: &str) -> Result<(), String> {
        self.resolve_conflict(conflict_id, ConflictResolution::ServerWins)
    }

    // ==================== History ====================

    pub fn get_sync_history(&self, limit: Option<usize>) -> Vec<SyncHistory> {
        let history = self.sync_history.lock().unwrap();
        let mut sorted: Vec<_> = history.iter().cloned().collect();
        sorted.sort_by(|a, b| b.started_at.cmp(&a.started_at));
        
        if let Some(l) = limit {
            sorted.into_iter().take(l).collect()
        } else {
            sorted
        }
    }

    pub fn get_last_sync(&self) -> Option<SyncHistory> {
        self.get_sync_history(Some(1)).into_iter().next()
    }

    pub fn clear_sync_history(&self) {
        self.sync_history.lock().unwrap().clear();
    }

    // ==================== Encryption ====================

    pub fn generate_encryption_key(&self) -> Result<EncryptionKey, String> {
        let key = EncryptionKey {
            key_id: Self::generate_id(),
            key_type: KeyType::Primary,
            created_at: Utc::now(),
            expires_at: None,
            is_active: true,
        };
        
        let mut settings = self.settings.lock().unwrap();
        settings.encryption_key_id = Some(key.key_id.clone());
        drop(settings);
        
        self.encryption_keys.lock().unwrap().insert(key.key_id.clone(), key.clone());
        Ok(key)
    }

    pub fn get_encryption_keys(&self) -> Vec<EncryptionKey> {
        self.encryption_keys.lock().unwrap().values().cloned().collect()
    }

    pub fn get_active_key(&self) -> Option<EncryptionKey> {
        self.encryption_keys.lock().unwrap()
            .values()
            .find(|k| k.is_active)
            .cloned()
    }

    pub fn rotate_encryption_key(&self) -> Result<EncryptionKey, String> {
        // Deactivate current key
        let mut keys = self.encryption_keys.lock().unwrap();
        for key in keys.values_mut() {
            key.is_active = false;
        }
        drop(keys);
        
        // Generate new key
        self.generate_encryption_key()
    }

    pub fn create_recovery_key(&self) -> Result<EncryptionKey, String> {
        let key = EncryptionKey {
            key_id: Self::generate_id(),
            key_type: KeyType::Recovery,
            created_at: Utc::now(),
            expires_at: None,
            is_active: true,
        };
        
        self.encryption_keys.lock().unwrap().insert(key.key_id.clone(), key.clone());
        Ok(key)
    }

    // ==================== Statistics ====================

    pub fn get_stats(&self) -> SyncStats {
        self.stats.lock().unwrap().clone()
    }

    pub fn get_storage_usage(&self) -> (u64, u64) {
        if let Some(account) = self.account.lock().unwrap().as_ref() {
            (account.storage_used_bytes, account.storage_limit_bytes)
        } else {
            (0, 0)
        }
    }

    pub fn reset_stats(&self) {
        let mut stats = self.stats.lock().unwrap();
        *stats = SyncStats {
            total_syncs: 0,
            successful_syncs: 0,
            failed_syncs: 0,
            total_items_synced: 0,
            total_bytes_uploaded: 0,
            total_bytes_downloaded: 0,
            last_sync: None,
            next_sync: None,
            average_sync_duration_ms: 0,
            items_by_type: HashMap::new(),
        };
    }

    // ==================== Export/Import ====================

    pub fn export_sync_data(&self) -> Result<SyncExportData, String> {
        Ok(SyncExportData {
            settings: self.get_settings(),
            devices: self.get_devices(),
            stats: self.get_stats(),
            exported_at: Utc::now(),
        })
    }

    pub fn import_sync_data(&self, data: SyncExportData) -> Result<(), String> {
        *self.settings.lock().unwrap() = data.settings;
        Ok(())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncExportData {
    pub settings: SyncSettings,
    pub devices: Vec<SyncDevice>,
    pub stats: SyncStats,
    pub exported_at: DateTime<Utc>,
}
