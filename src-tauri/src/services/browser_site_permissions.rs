// CUBE Nexum - Site Permissions Manager Service
// Granular permission control for websites

use std::collections::HashMap;
use std::sync::RwLock;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// ==================== Types ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionsSettings {
    pub enabled: bool,
    pub default_permissions: DefaultPermissions,
    pub ask_before_granting: bool,
    pub show_permission_indicator: bool,
    pub block_known_trackers: bool,
    pub auto_revoke_unused_days: Option<u32>,
    pub notification_settings: NotificationSettings,
    pub content_settings: ContentSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DefaultPermissions {
    pub location: PermissionDefault,
    pub camera: PermissionDefault,
    pub microphone: PermissionDefault,
    pub notifications: PermissionDefault,
    pub midi: PermissionDefault,
    pub usb: PermissionDefault,
    pub serial: PermissionDefault,
    pub bluetooth: PermissionDefault,
    pub clipboard_read: PermissionDefault,
    pub clipboard_write: PermissionDefault,
    pub payment_handler: PermissionDefault,
    pub background_sync: PermissionDefault,
    pub sensors: PermissionDefault,
    pub screen_wake_lock: PermissionDefault,
    pub idle_detection: PermissionDefault,
    pub file_system: PermissionDefault,
    pub local_fonts: PermissionDefault,
    pub hid: PermissionDefault,
    pub window_management: PermissionDefault,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PermissionDefault {
    Ask,
    Allow,
    Block,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationSettings {
    pub default: PermissionDefault,
    pub quiet_hours_enabled: bool,
    pub quiet_hours_start: String,
    pub quiet_hours_end: String,
    pub show_preview: bool,
    pub play_sound: bool,
    pub max_visible: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContentSettings {
    pub javascript: ContentDefault,
    pub images: ContentDefault,
    pub popups: ContentDefault,
    pub ads: ContentDefault,
    pub cookies: CookieSettings,
    pub autoplay: AutoplaySettings,
    pub sound: ContentDefault,
    pub pdf_viewer: ContentDefault,
    pub protocol_handlers: ContentDefault,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ContentDefault {
    Allow,
    Block,
    AskOnce,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CookieSettings {
    pub default: CookieDefault,
    pub third_party: CookieDefault,
    pub clear_on_exit: bool,
    pub block_tracking_cookies: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CookieDefault {
    Allow,
    Block,
    BlockThirdParty,
    SessionOnly,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutoplaySettings {
    pub default: AutoplayDefault,
    pub limit_data_usage: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AutoplayDefault {
    Allow,
    Block,
    BlockAudio,
    DocumentUserActivation,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SitePermissions {
    pub id: String,
    pub origin: String,
    pub permissions: HashMap<String, PermissionState>,
    pub content_settings: HashMap<String, ContentState>,
    pub storage_access: StorageAccess,
    pub created_at: DateTime<Utc>,
    pub last_visited: DateTime<Utc>,
    pub visit_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionState {
    pub permission_type: PermissionType,
    pub state: PermissionValue,
    pub granted_at: Option<DateTime<Utc>>,
    pub expires_at: Option<DateTime<Utc>>,
    pub usage_count: u32,
    pub last_used: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PermissionType {
    Location,
    Camera,
    Microphone,
    Notifications,
    Midi,
    Usb,
    Serial,
    Bluetooth,
    ClipboardRead,
    ClipboardWrite,
    PaymentHandler,
    BackgroundSync,
    Sensors,
    ScreenWakeLock,
    IdleDetection,
    FileSystem,
    LocalFonts,
    Hid,
    WindowManagement,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PermissionValue {
    Granted,
    Denied,
    Prompt,
    Expired,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContentState {
    pub content_type: ContentType,
    pub state: ContentValue,
    pub exceptions: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ContentType {
    JavaScript,
    Images,
    Popups,
    Ads,
    Cookies,
    Autoplay,
    Sound,
    PdfViewer,
    ProtocolHandlers,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ContentValue {
    Allow,
    Block,
    SessionOnly,
    BlockThirdParty,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageAccess {
    pub cookies: StorageState,
    pub local_storage: StorageState,
    pub session_storage: StorageState,
    pub indexed_db: StorageState,
    pub cache_storage: StorageState,
    pub service_workers: StorageState,
    pub storage_quota_mb: Option<u64>,
    pub used_storage_mb: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum StorageState {
    Allowed,
    Blocked,
    SessionOnly,
    Limited,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionRequest {
    pub id: String,
    pub origin: String,
    pub permission_type: PermissionType,
    pub requested_at: DateTime<Utc>,
    pub status: RequestStatus,
    pub frame_url: Option<String>,
    pub user_gesture: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum RequestStatus {
    Pending,
    Granted,
    Denied,
    Dismissed,
    Expired,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionGroup {
    pub id: String,
    pub name: String,
    pub description: String,
    pub origins: Vec<String>,
    pub permissions: HashMap<String, PermissionValue>,
    pub content_settings: HashMap<String, ContentValue>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionAuditLog {
    pub id: String,
    pub origin: String,
    pub permission_type: String,
    pub action: AuditAction,
    pub old_value: Option<String>,
    pub new_value: String,
    pub reason: Option<String>,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AuditAction {
    Granted,
    Denied,
    Revoked,
    Expired,
    AutoRevoked,
    Reset,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionStats {
    pub total_sites: u64,
    pub sites_with_permissions: u64,
    pub permissions_by_type: HashMap<String, PermissionTypeStats>,
    pub most_requested: Vec<(String, u32)>,
    pub most_granted: Vec<(String, u32)>,
    pub most_denied: Vec<(String, u32)>,
    pub recent_requests: Vec<PermissionRequest>,
    pub storage_usage_mb: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionTypeStats {
    pub granted: u32,
    pub denied: u32,
    pub prompt: u32,
}

// ==================== Service Implementation ====================

pub struct BrowserSitePermissionsService {
    settings: RwLock<PermissionsSettings>,
    site_permissions: RwLock<HashMap<String, SitePermissions>>,
    permission_groups: RwLock<HashMap<String, PermissionGroup>>,
    pending_requests: RwLock<HashMap<String, PermissionRequest>>,
    audit_log: RwLock<Vec<PermissionAuditLog>>,
}

impl BrowserSitePermissionsService {
    pub fn new() -> Self {
        Self {
            settings: RwLock::new(Self::default_settings()),
            site_permissions: RwLock::new(HashMap::new()),
            permission_groups: RwLock::new(HashMap::new()),
            pending_requests: RwLock::new(HashMap::new()),
            audit_log: RwLock::new(Vec::new()),
        }
    }

    fn default_settings() -> PermissionsSettings {
        PermissionsSettings {
            enabled: true,
            default_permissions: DefaultPermissions {
                location: PermissionDefault::Ask,
                camera: PermissionDefault::Ask,
                microphone: PermissionDefault::Ask,
                notifications: PermissionDefault::Ask,
                midi: PermissionDefault::Ask,
                usb: PermissionDefault::Block,
                serial: PermissionDefault::Block,
                bluetooth: PermissionDefault::Ask,
                clipboard_read: PermissionDefault::Ask,
                clipboard_write: PermissionDefault::Allow,
                payment_handler: PermissionDefault::Ask,
                background_sync: PermissionDefault::Allow,
                sensors: PermissionDefault::Ask,
                screen_wake_lock: PermissionDefault::Ask,
                idle_detection: PermissionDefault::Ask,
                file_system: PermissionDefault::Ask,
                local_fonts: PermissionDefault::Ask,
                hid: PermissionDefault::Block,
                window_management: PermissionDefault::Ask,
            },
            ask_before_granting: true,
            show_permission_indicator: true,
            block_known_trackers: true,
            auto_revoke_unused_days: Some(90),
            notification_settings: NotificationSettings {
                default: PermissionDefault::Ask,
                quiet_hours_enabled: false,
                quiet_hours_start: "22:00".to_string(),
                quiet_hours_end: "08:00".to_string(),
                show_preview: true,
                play_sound: true,
                max_visible: 3,
            },
            content_settings: ContentSettings {
                javascript: ContentDefault::Allow,
                images: ContentDefault::Allow,
                popups: ContentDefault::Block,
                ads: ContentDefault::Block,
                cookies: CookieSettings {
                    default: CookieDefault::Allow,
                    third_party: CookieDefault::BlockThirdParty,
                    clear_on_exit: false,
                    block_tracking_cookies: true,
                },
                autoplay: AutoplaySettings {
                    default: AutoplayDefault::BlockAudio,
                    limit_data_usage: false,
                },
                sound: ContentDefault::Allow,
                pdf_viewer: ContentDefault::Allow,
                protocol_handlers: ContentDefault::AskOnce,
            },
        }
    }

    // ==================== Settings ====================

    pub fn get_settings(&self) -> PermissionsSettings {
        self.settings.read().unwrap().clone()
    }

    pub fn update_settings(&self, new_settings: PermissionsSettings) {
        let mut settings = self.settings.write().unwrap();
        *settings = new_settings;
    }

    // ==================== Site Permissions ====================

    pub fn get_site_permissions(&self, origin: &str) -> Option<SitePermissions> {
        self.site_permissions.read().unwrap().get(origin).cloned()
    }

    pub fn get_all_site_permissions(&self) -> Vec<SitePermissions> {
        self.site_permissions.read().unwrap().values().cloned().collect()
    }

    pub fn set_permission(&self, origin: &str, permission_type: PermissionType, value: PermissionValue) -> SitePermissions {
        let now = Utc::now();
        let permission_key = format!("{:?}", permission_type);

        let mut sites = self.site_permissions.write().unwrap();
        
        let site = sites.entry(origin.to_string()).or_insert_with(|| {
            SitePermissions {
                id: Uuid::new_v4().to_string(),
                origin: origin.to_string(),
                permissions: HashMap::new(),
                content_settings: HashMap::new(),
                storage_access: StorageAccess {
                    cookies: StorageState::Allowed,
                    local_storage: StorageState::Allowed,
                    session_storage: StorageState::Allowed,
                    indexed_db: StorageState::Allowed,
                    cache_storage: StorageState::Allowed,
                    service_workers: StorageState::Allowed,
                    storage_quota_mb: None,
                    used_storage_mb: 0,
                },
                created_at: now,
                last_visited: now,
                visit_count: 0,
            }
        });

        let old_value = site.permissions.get(&permission_key).map(|p| format!("{:?}", p.state));

        site.permissions.insert(permission_key.clone(), PermissionState {
            permission_type: permission_type.clone(),
            state: value.clone(),
            granted_at: if value == PermissionValue::Granted { Some(now) } else { None },
            expires_at: None,
            usage_count: 0,
            last_used: None,
        });

        // Log the change
        drop(sites);
        self.log_permission_change(origin, &permission_key, old_value, format!("{:?}", value), None);

        self.site_permissions.read().unwrap().get(origin).cloned().unwrap()
    }

    pub fn revoke_permission(&self, origin: &str, permission_type: PermissionType) -> Result<(), String> {
        let permission_key = format!("{:?}", permission_type);
        let mut sites = self.site_permissions.write().unwrap();
        
        let site = sites.get_mut(origin)
            .ok_or_else(|| "Site not found".to_string())?;

        let old_value = site.permissions.get(&permission_key).map(|p| format!("{:?}", p.state));
        site.permissions.remove(&permission_key);

        drop(sites);
        self.log_permission_change(origin, &permission_key, old_value, "Revoked".to_string(), Some("Manual revocation".to_string()));

        Ok(())
    }

    pub fn reset_site_permissions(&self, origin: &str) -> Result<(), String> {
        self.site_permissions.write().unwrap()
            .remove(origin)
            .ok_or_else(|| "Site not found".to_string())?;

        self.log_permission_change(origin, "All", None, "Reset".to_string(), Some("Full reset".to_string()));

        Ok(())
    }

    pub fn set_content_setting(&self, origin: &str, content_type: ContentType, value: ContentValue) -> SitePermissions {
        let now = Utc::now();
        let content_key = format!("{:?}", content_type);

        let mut sites = self.site_permissions.write().unwrap();
        
        let site = sites.entry(origin.to_string()).or_insert_with(|| {
            SitePermissions {
                id: Uuid::new_v4().to_string(),
                origin: origin.to_string(),
                permissions: HashMap::new(),
                content_settings: HashMap::new(),
                storage_access: StorageAccess {
                    cookies: StorageState::Allowed,
                    local_storage: StorageState::Allowed,
                    session_storage: StorageState::Allowed,
                    indexed_db: StorageState::Allowed,
                    cache_storage: StorageState::Allowed,
                    service_workers: StorageState::Allowed,
                    storage_quota_mb: None,
                    used_storage_mb: 0,
                },
                created_at: now,
                last_visited: now,
                visit_count: 0,
            }
        });

        site.content_settings.insert(content_key, ContentState {
            content_type,
            state: value,
            exceptions: Vec::new(),
        });

        site.clone()
    }

    pub fn set_storage_access(&self, origin: &str, storage_access: StorageAccess) -> Result<SitePermissions, String> {
        let mut sites = self.site_permissions.write().unwrap();
        let site = sites.get_mut(origin)
            .ok_or_else(|| "Site not found".to_string())?;

        site.storage_access = storage_access;

        Ok(site.clone())
    }

    // ==================== Permission Requests ====================

    pub fn create_permission_request(&self, origin: &str, permission_type: PermissionType, frame_url: Option<String>, user_gesture: bool) -> PermissionRequest {
        let request = PermissionRequest {
            id: Uuid::new_v4().to_string(),
            origin: origin.to_string(),
            permission_type,
            requested_at: Utc::now(),
            status: RequestStatus::Pending,
            frame_url,
            user_gesture,
        };

        let id = request.id.clone();
        self.pending_requests.write().unwrap().insert(id, request.clone());

        request
    }

    pub fn get_pending_requests(&self) -> Vec<PermissionRequest> {
        self.pending_requests.read().unwrap().values().cloned().collect()
    }

    pub fn respond_to_request(&self, request_id: &str, grant: bool) -> Result<PermissionRequest, String> {
        let mut requests = self.pending_requests.write().unwrap();
        let request = requests.get_mut(request_id)
            .ok_or_else(|| "Request not found".to_string())?;

        request.status = if grant { RequestStatus::Granted } else { RequestStatus::Denied };

        let request_clone = request.clone();

        // Apply the permission
        drop(requests);
        
        let value = if grant { PermissionValue::Granted } else { PermissionValue::Denied };
        self.set_permission(&request_clone.origin, request_clone.permission_type.clone(), value);

        // Remove from pending
        self.pending_requests.write().unwrap().remove(request_id);

        Ok(request_clone)
    }

    pub fn dismiss_request(&self, request_id: &str) -> Result<(), String> {
        self.pending_requests.write().unwrap()
            .remove(request_id)
            .ok_or_else(|| "Request not found".to_string())?;
        Ok(())
    }

    // ==================== Permission Groups ====================

    pub fn create_permission_group(&self, name: String, description: String) -> PermissionGroup {
        let group = PermissionGroup {
            id: Uuid::new_v4().to_string(),
            name,
            description,
            origins: Vec::new(),
            permissions: HashMap::new(),
            content_settings: HashMap::new(),
            created_at: Utc::now(),
        };

        let id = group.id.clone();
        self.permission_groups.write().unwrap().insert(id, group.clone());

        group
    }

    pub fn get_permission_group(&self, group_id: &str) -> Option<PermissionGroup> {
        self.permission_groups.read().unwrap().get(group_id).cloned()
    }

    pub fn get_all_permission_groups(&self) -> Vec<PermissionGroup> {
        self.permission_groups.read().unwrap().values().cloned().collect()
    }

    pub fn add_site_to_group(&self, group_id: &str, origin: &str) -> Result<PermissionGroup, String> {
        // First, get the group permissions we need to apply
        let permissions_to_apply: Vec<(String, PermissionValue)> = {
            let groups = self.permission_groups.read().unwrap();
            let group = groups.get(group_id)
                .ok_or_else(|| "Group not found".to_string())?;
            group.permissions.iter()
                .map(|(k, v)| (k.clone(), v.clone()))
                .collect()
        };

        // Add site to group
        {
            let mut groups = self.permission_groups.write().unwrap();
            let group = groups.get_mut(group_id)
                .ok_or_else(|| "Group not found".to_string())?;

            if !group.origins.contains(&origin.to_string()) {
                group.origins.push(origin.to_string());
            }
        }

        // Apply permissions without holding the groups lock
        for (perm_type, value) in permissions_to_apply {
            if let Ok(permission_type) = Self::parse_permission_type(&perm_type) {
                self.set_permission(origin, permission_type, value);
            }
        }

        // Return the updated group
        let groups = self.permission_groups.read().unwrap();
        Ok(groups.get(group_id).cloned().unwrap())
    }

    pub fn remove_site_from_group(&self, group_id: &str, origin: &str) -> Result<PermissionGroup, String> {
        let mut groups = self.permission_groups.write().unwrap();
        let group = groups.get_mut(group_id)
            .ok_or_else(|| "Group not found".to_string())?;

        group.origins.retain(|o| o != origin);

        Ok(group.clone())
    }

    pub fn set_group_permission(&self, group_id: &str, permission_type: PermissionType, value: PermissionValue) -> Result<PermissionGroup, String> {
        let mut groups = self.permission_groups.write().unwrap();
        let group = groups.get_mut(group_id)
            .ok_or_else(|| "Group not found".to_string())?;

        let permission_key = format!("{:?}", permission_type);
        group.permissions.insert(permission_key, value.clone());

        // Apply to all sites in group
        let origins = group.origins.clone();
        drop(groups);

        for origin in origins {
            self.set_permission(&origin, permission_type.clone(), value.clone());
        }

        Ok(self.permission_groups.read().unwrap().get(group_id).cloned().unwrap())
    }

    pub fn delete_permission_group(&self, group_id: &str) -> Result<(), String> {
        self.permission_groups.write().unwrap()
            .remove(group_id)
            .ok_or_else(|| "Group not found".to_string())?;
        Ok(())
    }

    // ==================== Audit Log ====================

    fn log_permission_change(&self, origin: &str, permission_type: &str, old_value: Option<String>, new_value: String, reason: Option<String>) {
        let log_entry = PermissionAuditLog {
            id: Uuid::new_v4().to_string(),
            origin: origin.to_string(),
            permission_type: permission_type.to_string(),
            action: if new_value == "Revoked" { AuditAction::Revoked }
                    else if new_value == "Reset" { AuditAction::Reset }
                    else if new_value.contains("Granted") { AuditAction::Granted }
                    else { AuditAction::Denied },
            old_value,
            new_value,
            reason,
            timestamp: Utc::now(),
        };

        let mut log = self.audit_log.write().unwrap();
        log.insert(0, log_entry);

        // Keep only last 10000 entries
        if log.len() > 10000 {
            log.truncate(10000);
        }
    }

    pub fn get_audit_log(&self, limit: Option<u32>, origin_filter: Option<&str>) -> Vec<PermissionAuditLog> {
        let log = self.audit_log.read().unwrap();
        let limit = limit.unwrap_or(100) as usize;

        log.iter()
            .filter(|entry| {
                origin_filter.map(|o| entry.origin.contains(o)).unwrap_or(true)
            })
            .take(limit)
            .cloned()
            .collect()
    }

    // ==================== Auto-Revoke ====================

    pub fn auto_revoke_unused(&self) -> u32 {
        let settings = self.settings.read().unwrap();
        let days = match settings.auto_revoke_unused_days {
            Some(d) => d,
            None => return 0,
        };
        drop(settings);

        let threshold = Utc::now() - chrono::Duration::days(days as i64);
        let mut revoked = 0u32;

        let mut sites = self.site_permissions.write().unwrap();
        
        for site in sites.values_mut() {
            let permissions_to_revoke: Vec<String> = site.permissions
                .iter()
                .filter(|(_, perm)| {
                    perm.state == PermissionValue::Granted &&
                    perm.last_used.map(|d| d < threshold).unwrap_or(true)
                })
                .map(|(k, _)| k.clone())
                .collect();

            for key in permissions_to_revoke {
                site.permissions.remove(&key);
                revoked += 1;
            }
        }

        revoked
    }

    // ==================== Stats ====================

    pub fn get_stats(&self) -> PermissionStats {
        let sites = self.site_permissions.read().unwrap();
        let requests = self.pending_requests.read().unwrap();

        let mut by_type: HashMap<String, PermissionTypeStats> = HashMap::new();
        let mut request_counts: HashMap<String, u32> = HashMap::new();
        let mut granted_counts: HashMap<String, u32> = HashMap::new();
        let mut denied_counts: HashMap<String, u32> = HashMap::new();
        let mut storage_total = 0u64;

        for site in sites.values() {
            storage_total += site.storage_access.used_storage_mb;

            for (perm_type, perm) in &site.permissions {
                let stats = by_type.entry(perm_type.clone()).or_insert(PermissionTypeStats {
                    granted: 0,
                    denied: 0,
                    prompt: 0,
                });

                match perm.state {
                    PermissionValue::Granted => {
                        stats.granted += 1;
                        *granted_counts.entry(site.origin.clone()).or_insert(0) += 1;
                    }
                    PermissionValue::Denied => {
                        stats.denied += 1;
                        *denied_counts.entry(site.origin.clone()).or_insert(0) += 1;
                    }
                    PermissionValue::Prompt => stats.prompt += 1,
                    _ => {}
                }

                *request_counts.entry(perm_type.clone()).or_insert(0) += 1;
            }
        }

        let sites_with_permissions = sites.values()
            .filter(|s| !s.permissions.is_empty())
            .count() as u64;

        let mut most_requested: Vec<(String, u32)> = request_counts.into_iter().collect();
        most_requested.sort_by(|a, b| b.1.cmp(&a.1));
        most_requested.truncate(10);

        let mut most_granted: Vec<(String, u32)> = granted_counts.into_iter().collect();
        most_granted.sort_by(|a, b| b.1.cmp(&a.1));
        most_granted.truncate(10);

        let mut most_denied: Vec<(String, u32)> = denied_counts.into_iter().collect();
        most_denied.sort_by(|a, b| b.1.cmp(&a.1));
        most_denied.truncate(10);

        let recent_requests: Vec<PermissionRequest> = requests.values()
            .take(10)
            .cloned()
            .collect();

        PermissionStats {
            total_sites: sites.len() as u64,
            sites_with_permissions,
            permissions_by_type: by_type,
            most_requested,
            most_granted,
            most_denied,
            recent_requests,
            storage_usage_mb: storage_total,
        }
    }

    // ==================== Helper ====================

    fn parse_permission_type(s: &str) -> Result<PermissionType, String> {
        match s {
            "Location" => Ok(PermissionType::Location),
            "Camera" => Ok(PermissionType::Camera),
            "Microphone" => Ok(PermissionType::Microphone),
            "Notifications" => Ok(PermissionType::Notifications),
            "Midi" => Ok(PermissionType::Midi),
            "Usb" => Ok(PermissionType::Usb),
            "Serial" => Ok(PermissionType::Serial),
            "Bluetooth" => Ok(PermissionType::Bluetooth),
            "ClipboardRead" => Ok(PermissionType::ClipboardRead),
            "ClipboardWrite" => Ok(PermissionType::ClipboardWrite),
            "PaymentHandler" => Ok(PermissionType::PaymentHandler),
            "BackgroundSync" => Ok(PermissionType::BackgroundSync),
            "Sensors" => Ok(PermissionType::Sensors),
            "ScreenWakeLock" => Ok(PermissionType::ScreenWakeLock),
            "IdleDetection" => Ok(PermissionType::IdleDetection),
            "FileSystem" => Ok(PermissionType::FileSystem),
            "LocalFonts" => Ok(PermissionType::LocalFonts),
            "Hid" => Ok(PermissionType::Hid),
            "WindowManagement" => Ok(PermissionType::WindowManagement),
            _ => Err(format!("Unknown permission type: {}", s)),
        }
    }
}

impl Default for BrowserSitePermissionsService {
    fn default() -> Self {
        Self::new()
    }
}
