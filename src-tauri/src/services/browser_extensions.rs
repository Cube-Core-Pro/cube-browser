// CUBE Nexum - Extensions Manager Service
// Chrome extension compatibility layer with advanced management

use std::collections::HashMap;
use std::sync::Mutex;
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

// ==================== Types ====================

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ExtensionSource {
    ChromeWebStore,
    Firefox,
    LocalFile,
    Developer,
    Enterprise,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ExtensionStatus {
    Enabled,
    Disabled,
    NeedsUpdate,
    Error,
    Installing,
    Uninstalling,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ExtensionPermission {
    ActiveTab,
    Alarms,
    Background,
    Bookmarks,
    BrowsingData,
    Clipboards,
    ContentSettings,
    ContextMenus,
    Cookies,
    Debugger,
    DeclarativeContent,
    DeclarativeNetRequest,
    DesktopCapture,
    Downloads,
    Enterprise,
    FontSettings,
    Gcm,
    Geolocation,
    History,
    Identity,
    Idle,
    Management,
    NativeMessaging,
    Notifications,
    PageCapture,
    Power,
    Privacy,
    Proxy,
    Sessions,
    Storage,
    System,
    TabCapture,
    Tabs,
    TopSites,
    Tts,
    TtsEngine,
    Unlimitedstrorage,
    WebNavigation,
    WebRequest,
    WebRequestBlocking,
    AllUrls,
    SpecificHosts(Vec<String>),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtensionSettings {
    pub allow_developer_mode: bool,
    pub auto_update: bool,
    pub update_check_interval_hours: u32,
    pub allow_incognito: bool,
    pub show_access_requests: bool,
    pub enterprise_policy_enabled: bool,
    pub blocked_extensions: Vec<String>,
    pub allowed_hosts_default: Vec<String>,
}

impl Default for ExtensionSettings {
    fn default() -> Self {
        Self {
            allow_developer_mode: true,
            auto_update: true,
            update_check_interval_hours: 24,
            allow_incognito: false,
            show_access_requests: true,
            enterprise_policy_enabled: false,
            blocked_extensions: Vec::new(),
            allowed_hosts_default: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Extension {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: String,
    pub author: Option<String>,
    pub homepage: Option<String>,
    pub icon: Option<String>,
    pub icon_128: Option<String>,
    pub source: ExtensionSource,
    pub status: ExtensionStatus,
    pub permissions: Vec<ExtensionPermission>,
    pub optional_permissions: Vec<ExtensionPermission>,
    pub granted_optional_permissions: Vec<ExtensionPermission>,
    pub host_permissions: Vec<String>,
    pub content_scripts: Vec<ContentScript>,
    pub background_script: Option<BackgroundScript>,
    pub browser_action: Option<BrowserAction>,
    pub page_action: Option<PageAction>,
    pub options_page: Option<String>,
    pub options_ui: Option<OptionsUI>,
    pub allow_incognito: bool,
    pub allow_file_access: bool,
    pub is_pinned: bool,
    pub is_recommended: bool,
    pub install_date: DateTime<Utc>,
    pub last_updated: DateTime<Utc>,
    pub store_url: Option<String>,
    pub rating: Option<f32>,
    pub users: Option<u64>,
    pub size_bytes: u64,
    pub error_message: Option<String>,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContentScript {
    pub matches: Vec<String>,
    pub exclude_matches: Vec<String>,
    pub js: Vec<String>,
    pub css: Vec<String>,
    pub run_at: ScriptRunAt,
    pub all_frames: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ScriptRunAt {
    DocumentStart,
    DocumentEnd,
    DocumentIdle,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackgroundScript {
    pub scripts: Vec<String>,
    pub persistent: bool,
    pub service_worker: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrowserAction {
    pub title: String,
    pub icon: Option<String>,
    pub popup: Option<String>,
    pub badge_text: Option<String>,
    pub badge_color: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PageAction {
    pub title: String,
    pub icon: Option<String>,
    pub popup: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OptionsUI {
    pub page: String,
    pub open_in_tab: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtensionStats {
    pub total_extensions: u32,
    pub enabled_count: u32,
    pub disabled_count: u32,
    pub developer_count: u32,
    pub total_permissions: u32,
    pub extensions_by_source: HashMap<String, u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtensionUpdateInfo {
    pub extension_id: String,
    pub current_version: String,
    pub new_version: String,
    pub changelog: Option<String>,
    pub release_date: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstallResult {
    pub success: bool,
    pub extension_id: Option<String>,
    pub error_message: Option<String>,
    pub new_permissions: Vec<ExtensionPermission>,
}

// ==================== Service ====================

pub struct ExtensionsManagerService {
    settings: Mutex<ExtensionSettings>,
    extensions: Mutex<HashMap<String, Extension>>,
    pending_updates: Mutex<HashMap<String, ExtensionUpdateInfo>>,
}

impl ExtensionsManagerService {
    pub fn new() -> Self {
        let service = Self {
            settings: Mutex::new(ExtensionSettings::default()),
            extensions: Mutex::new(HashMap::new()),
            pending_updates: Mutex::new(HashMap::new()),
        };
        
        // Add some recommended extensions
        service.add_recommended_extensions();
        
        service
    }

    fn add_recommended_extensions(&self) {
        let mut extensions = self.extensions.lock().unwrap();
        
        // uBlock Origin (Ad Blocker)
        let ublock = Extension {
            id: "cjpalhdlnbpafiamejdnhcphjbkeiagm".to_string(),
            name: "uBlock Origin".to_string(),
            version: "1.55.0".to_string(),
            description: "Finally, an efficient wide-spectrum content blocker.".to_string(),
            author: Some("Raymond Hill".to_string()),
            homepage: Some("https://github.com/gorhill/uBlock".to_string()),
            icon: Some("icons/icon_48.png".to_string()),
            icon_128: Some("icons/icon_128.png".to_string()),
            source: ExtensionSource::ChromeWebStore,
            status: ExtensionStatus::Disabled,
            permissions: vec![
                ExtensionPermission::WebRequest,
                ExtensionPermission::WebRequestBlocking,
                ExtensionPermission::Storage,
                ExtensionPermission::Tabs,
            ],
            optional_permissions: Vec::new(),
            granted_optional_permissions: Vec::new(),
            host_permissions: vec!["<all_urls>".to_string()],
            content_scripts: Vec::new(),
            background_script: Some(BackgroundScript {
                scripts: vec!["background.js".to_string()],
                persistent: true,
                service_worker: None,
            }),
            browser_action: Some(BrowserAction {
                title: "uBlock Origin".to_string(),
                icon: Some("icons/icon_19.png".to_string()),
                popup: Some("popup.html".to_string()),
                badge_text: None,
                badge_color: None,
            }),
            page_action: None,
            options_page: Some("dashboard.html".to_string()),
            options_ui: None,
            allow_incognito: false,
            allow_file_access: false,
            is_pinned: false,
            is_recommended: true,
            install_date: Utc::now(),
            last_updated: Utc::now(),
            store_url: Some("https://chrome.google.com/webstore/detail/ublock-origin/cjpalhdlnbpafiamejdnhcphjbkeiagm".to_string()),
            rating: Some(4.8),
            users: Some(30_000_000),
            size_bytes: 2_500_000,
            error_message: None,
            metadata: HashMap::new(),
        };
        extensions.insert(ublock.id.clone(), ublock);
        
        // Bitwarden (Password Manager)
        let bitwarden = Extension {
            id: "nngceckbapebfimnlniiiahkandclblb".to_string(),
            name: "Bitwarden - Password Manager".to_string(),
            version: "2024.1.0".to_string(),
            description: "A secure and free password manager for all of your devices.".to_string(),
            author: Some("Bitwarden Inc.".to_string()),
            homepage: Some("https://bitwarden.com".to_string()),
            icon: Some("icons/icon_48.png".to_string()),
            icon_128: Some("icons/icon_128.png".to_string()),
            source: ExtensionSource::ChromeWebStore,
            status: ExtensionStatus::Disabled,
            permissions: vec![
                ExtensionPermission::Storage,
                ExtensionPermission::Tabs,
                ExtensionPermission::ContextMenus,
                ExtensionPermission::Notifications,
            ],
            optional_permissions: Vec::new(),
            granted_optional_permissions: Vec::new(),
            host_permissions: vec!["<all_urls>".to_string()],
            content_scripts: vec![ContentScript {
                matches: vec!["<all_urls>".to_string()],
                exclude_matches: Vec::new(),
                js: vec!["content.js".to_string()],
                css: Vec::new(),
                run_at: ScriptRunAt::DocumentEnd,
                all_frames: true,
            }],
            background_script: Some(BackgroundScript {
                scripts: Vec::new(),
                persistent: false,
                service_worker: Some("background.js".to_string()),
            }),
            browser_action: Some(BrowserAction {
                title: "Bitwarden".to_string(),
                icon: Some("icons/icon_19.png".to_string()),
                popup: Some("popup.html".to_string()),
                badge_text: None,
                badge_color: None,
            }),
            page_action: None,
            options_page: None,
            options_ui: Some(OptionsUI {
                page: "popup.html".to_string(),
                open_in_tab: true,
            }),
            allow_incognito: false,
            allow_file_access: false,
            is_pinned: false,
            is_recommended: true,
            install_date: Utc::now(),
            last_updated: Utc::now(),
            store_url: Some("https://chrome.google.com/webstore/detail/bitwarden/nngceckbapebfimnlniiiahkandclblb".to_string()),
            rating: Some(4.7),
            users: Some(4_000_000),
            size_bytes: 8_000_000,
            error_message: None,
            metadata: HashMap::new(),
        };
        extensions.insert(bitwarden.id.clone(), bitwarden);
        
        // Dark Reader
        let dark_reader = Extension {
            id: "eimadpbcbfnmbkopoojfekhnkhdbieeh".to_string(),
            name: "Dark Reader".to_string(),
            version: "4.9.80".to_string(),
            description: "Dark mode for every website. Take care of your eyes.".to_string(),
            author: Some("Alexander Shutau".to_string()),
            homepage: Some("https://darkreader.org".to_string()),
            icon: Some("icons/icon_48.png".to_string()),
            icon_128: Some("icons/icon_128.png".to_string()),
            source: ExtensionSource::ChromeWebStore,
            status: ExtensionStatus::Disabled,
            permissions: vec![
                ExtensionPermission::Storage,
                ExtensionPermission::Tabs,
                ExtensionPermission::ContextMenus,
            ],
            optional_permissions: Vec::new(),
            granted_optional_permissions: Vec::new(),
            host_permissions: vec!["<all_urls>".to_string()],
            content_scripts: Vec::new(),
            background_script: Some(BackgroundScript {
                scripts: vec!["background.js".to_string()],
                persistent: false,
                service_worker: None,
            }),
            browser_action: Some(BrowserAction {
                title: "Dark Reader".to_string(),
                icon: Some("icons/icon_19.png".to_string()),
                popup: Some("popup.html".to_string()),
                badge_text: None,
                badge_color: None,
            }),
            page_action: None,
            options_page: None,
            options_ui: None,
            allow_incognito: false,
            allow_file_access: false,
            is_pinned: false,
            is_recommended: true,
            install_date: Utc::now(),
            last_updated: Utc::now(),
            store_url: Some("https://chrome.google.com/webstore/detail/dark-reader/eimadpbcbfnmbkopoojfekhnkhdbieeh".to_string()),
            rating: Some(4.6),
            users: Some(6_000_000),
            size_bytes: 1_500_000,
            error_message: None,
            metadata: HashMap::new(),
        };
        extensions.insert(dark_reader.id.clone(), dark_reader);
    }

    fn generate_id(&self) -> String {
        uuid::Uuid::new_v4().to_string().replace("-", "")[..32].to_string()
    }

    // ==================== Settings ====================

    pub fn get_settings(&self) -> ExtensionSettings {
        self.settings.lock().unwrap().clone()
    }

    pub fn update_settings(&self, settings: ExtensionSettings) -> Result<(), String> {
        *self.settings.lock().unwrap() = settings;
        Ok(())
    }

    pub fn toggle_developer_mode(&self) -> Result<bool, String> {
        let mut settings = self.settings.lock().unwrap();
        settings.allow_developer_mode = !settings.allow_developer_mode;
        Ok(settings.allow_developer_mode)
    }

    // ==================== Extension Management ====================

    pub fn install_extension(&self, id: String, name: String, source: ExtensionSource) -> Result<InstallResult, String> {
        // Check if blocked
        {
            let settings = self.settings.lock().unwrap();
            if settings.blocked_extensions.contains(&id) {
                return Ok(InstallResult {
                    success: false,
                    extension_id: None,
                    error_message: Some("Extension is blocked by policy".to_string()),
                    new_permissions: Vec::new(),
                });
            }
        }
        
        // Check if already installed
        {
            let extensions = self.extensions.lock().unwrap();
            if extensions.contains_key(&id) {
                return Ok(InstallResult {
                    success: false,
                    extension_id: Some(id),
                    error_message: Some("Extension is already installed".to_string()),
                    new_permissions: Vec::new(),
                });
            }
        }
        
        // Create extension entry
        let extension = Extension {
            id: id.clone(),
            name,
            version: "1.0.0".to_string(),
            description: String::new(),
            author: None,
            homepage: None,
            icon: None,
            icon_128: None,
            source,
            status: ExtensionStatus::Installing,
            permissions: Vec::new(),
            optional_permissions: Vec::new(),
            granted_optional_permissions: Vec::new(),
            host_permissions: Vec::new(),
            content_scripts: Vec::new(),
            background_script: None,
            browser_action: None,
            page_action: None,
            options_page: None,
            options_ui: None,
            allow_incognito: false,
            allow_file_access: false,
            is_pinned: false,
            is_recommended: false,
            install_date: Utc::now(),
            last_updated: Utc::now(),
            store_url: None,
            rating: None,
            users: None,
            size_bytes: 0,
            error_message: None,
            metadata: HashMap::new(),
        };
        
        let mut extensions = self.extensions.lock().unwrap();
        extensions.insert(id.clone(), extension);
        
        // Mark as enabled after "installation"
        if let Some(ext) = extensions.get_mut(&id) {
            ext.status = ExtensionStatus::Enabled;
        }
        
        Ok(InstallResult {
            success: true,
            extension_id: Some(id),
            error_message: None,
            new_permissions: Vec::new(),
        })
    }

    pub fn uninstall_extension(&self, id: &str) -> Result<(), String> {
        let mut extensions = self.extensions.lock().unwrap();
        extensions.remove(id)
            .map(|_| ())
            .ok_or_else(|| "Extension not found".to_string())
    }

    pub fn enable_extension(&self, id: &str) -> Result<(), String> {
        let mut extensions = self.extensions.lock().unwrap();
        if let Some(ext) = extensions.get_mut(id) {
            ext.status = ExtensionStatus::Enabled;
            Ok(())
        } else {
            Err("Extension not found".to_string())
        }
    }

    pub fn disable_extension(&self, id: &str) -> Result<(), String> {
        let mut extensions = self.extensions.lock().unwrap();
        if let Some(ext) = extensions.get_mut(id) {
            ext.status = ExtensionStatus::Disabled;
            Ok(())
        } else {
            Err("Extension not found".to_string())
        }
    }

    pub fn toggle_extension(&self, id: &str) -> Result<ExtensionStatus, String> {
        let mut extensions = self.extensions.lock().unwrap();
        if let Some(ext) = extensions.get_mut(id) {
            ext.status = match ext.status {
                ExtensionStatus::Enabled => ExtensionStatus::Disabled,
                _ => ExtensionStatus::Enabled,
            };
            Ok(ext.status.clone())
        } else {
            Err("Extension not found".to_string())
        }
    }

    // ==================== Query Operations ====================

    pub fn get_extension(&self, id: &str) -> Option<Extension> {
        self.extensions.lock().unwrap().get(id).cloned()
    }

    pub fn get_all_extensions(&self) -> Vec<Extension> {
        self.extensions.lock().unwrap().values().cloned().collect()
    }

    pub fn get_enabled_extensions(&self) -> Vec<Extension> {
        self.extensions.lock().unwrap()
            .values()
            .filter(|e| e.status == ExtensionStatus::Enabled)
            .cloned()
            .collect()
    }

    pub fn get_disabled_extensions(&self) -> Vec<Extension> {
        self.extensions.lock().unwrap()
            .values()
            .filter(|e| e.status == ExtensionStatus::Disabled)
            .cloned()
            .collect()
    }

    pub fn get_recommended_extensions(&self) -> Vec<Extension> {
        self.extensions.lock().unwrap()
            .values()
            .filter(|e| e.is_recommended)
            .cloned()
            .collect()
    }

    pub fn search_extensions(&self, query: &str) -> Vec<Extension> {
        let query_lower = query.to_lowercase();
        self.extensions.lock().unwrap()
            .values()
            .filter(|e| {
                e.name.to_lowercase().contains(&query_lower) ||
                e.description.to_lowercase().contains(&query_lower) ||
                e.id.to_lowercase().contains(&query_lower)
            })
            .cloned()
            .collect()
    }

    // ==================== Permissions ====================

    pub fn get_extension_permissions(&self, id: &str) -> Result<Vec<ExtensionPermission>, String> {
        let extensions = self.extensions.lock().unwrap();
        extensions.get(id)
            .map(|e| e.permissions.clone())
            .ok_or_else(|| "Extension not found".to_string())
    }

    pub fn grant_optional_permission(&self, id: &str, permission: ExtensionPermission) -> Result<(), String> {
        let mut extensions = self.extensions.lock().unwrap();
        if let Some(ext) = extensions.get_mut(id) {
            if ext.optional_permissions.contains(&permission) {
                if !ext.granted_optional_permissions.contains(&permission) {
                    ext.granted_optional_permissions.push(permission);
                }
                Ok(())
            } else {
                Err("Permission is not in optional permissions".to_string())
            }
        } else {
            Err("Extension not found".to_string())
        }
    }

    pub fn revoke_optional_permission(&self, id: &str, permission: &ExtensionPermission) -> Result<(), String> {
        let mut extensions = self.extensions.lock().unwrap();
        if let Some(ext) = extensions.get_mut(id) {
            ext.granted_optional_permissions.retain(|p| p != permission);
            Ok(())
        } else {
            Err("Extension not found".to_string())
        }
    }

    pub fn set_incognito_access(&self, id: &str, allow: bool) -> Result<(), String> {
        let mut extensions = self.extensions.lock().unwrap();
        if let Some(ext) = extensions.get_mut(id) {
            ext.allow_incognito = allow;
            Ok(())
        } else {
            Err("Extension not found".to_string())
        }
    }

    pub fn set_file_access(&self, id: &str, allow: bool) -> Result<(), String> {
        let mut extensions = self.extensions.lock().unwrap();
        if let Some(ext) = extensions.get_mut(id) {
            ext.allow_file_access = allow;
            Ok(())
        } else {
            Err("Extension not found".to_string())
        }
    }

    // ==================== Pinning & UI ====================

    pub fn toggle_pin(&self, id: &str) -> Result<bool, String> {
        let mut extensions = self.extensions.lock().unwrap();
        if let Some(ext) = extensions.get_mut(id) {
            ext.is_pinned = !ext.is_pinned;
            Ok(ext.is_pinned)
        } else {
            Err("Extension not found".to_string())
        }
    }

    pub fn get_pinned_extensions(&self) -> Vec<Extension> {
        self.extensions.lock().unwrap()
            .values()
            .filter(|e| e.is_pinned && e.status == ExtensionStatus::Enabled)
            .cloned()
            .collect()
    }

    // ==================== Updates ====================

    pub fn check_for_updates(&self) -> Vec<ExtensionUpdateInfo> {
        // In production, this would check against store APIs
        self.pending_updates.lock().unwrap().values().cloned().collect()
    }

    pub fn update_extension(&self, id: &str) -> Result<(), String> {
        let mut extensions = self.extensions.lock().unwrap();
        let mut pending_updates = self.pending_updates.lock().unwrap();
        
        if let Some(update) = pending_updates.remove(id) {
            if let Some(ext) = extensions.get_mut(id) {
                ext.version = update.new_version;
                ext.last_updated = Utc::now();
                ext.status = ExtensionStatus::Enabled;
                Ok(())
            } else {
                Err("Extension not found".to_string())
            }
        } else {
            Err("No update available".to_string())
        }
    }

    pub fn update_all_extensions(&self) -> u32 {
        let update_ids: Vec<String> = self.pending_updates.lock().unwrap()
            .keys()
            .cloned()
            .collect();
        
        let mut updated = 0;
        for id in update_ids {
            if self.update_extension(&id).is_ok() {
                updated += 1;
            }
        }
        updated
    }

    // ==================== Statistics ====================

    pub fn get_stats(&self) -> ExtensionStats {
        let extensions = self.extensions.lock().unwrap();
        
        let enabled_count = extensions.values()
            .filter(|e| e.status == ExtensionStatus::Enabled)
            .count() as u32;
        
        let disabled_count = extensions.values()
            .filter(|e| e.status == ExtensionStatus::Disabled)
            .count() as u32;
        
        let developer_count = extensions.values()
            .filter(|e| e.source == ExtensionSource::Developer || e.source == ExtensionSource::LocalFile)
            .count() as u32;
        
        let total_permissions = extensions.values()
            .map(|e| e.permissions.len())
            .sum::<usize>() as u32;
        
        let mut by_source: HashMap<String, u32> = HashMap::new();
        for ext in extensions.values() {
            let source = format!("{:?}", ext.source);
            *by_source.entry(source).or_insert(0) += 1;
        }
        
        ExtensionStats {
            total_extensions: extensions.len() as u32,
            enabled_count,
            disabled_count,
            developer_count,
            total_permissions,
            extensions_by_source: by_source,
        }
    }

    // ==================== Import/Export ====================

    pub fn export_extensions(&self) -> Result<String, String> {
        let extensions = self.extensions.lock().unwrap();
        serde_json::to_string_pretty(&*extensions)
            .map_err(|e| format!("Export failed: {}", e))
    }

    pub fn import_extensions(&self, json: &str) -> Result<u32, String> {
        let imported: HashMap<String, Extension> = serde_json::from_str(json)
            .map_err(|e| format!("Invalid JSON: {}", e))?;
        
        let mut extensions = self.extensions.lock().unwrap();
        let count = imported.len() as u32;
        
        for (id, ext) in imported {
            extensions.insert(id, ext);
        }
        
        Ok(count)
    }

    pub fn get_extension_list(&self) -> Vec<String> {
        self.extensions.lock().unwrap()
            .iter()
            .filter(|(_, e)| e.status == ExtensionStatus::Enabled)
            .map(|(_, e)| e.id.clone())
            .collect()
    }
}
