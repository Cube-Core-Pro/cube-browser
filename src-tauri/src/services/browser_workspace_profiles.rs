// CUBE Nexum - Workspace Profiles Service
// Multiple browser profiles with separate data isolation

use std::collections::HashMap;
use std::sync::RwLock;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// ==================== Types ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceProfile {
    pub id: String,
    pub name: String,
    pub icon: ProfileIcon,
    pub color: String,
    pub description: Option<String>,
    pub data_isolation: DataIsolation,
    pub privacy_settings: ProfilePrivacy,
    pub proxy_config: Option<ProxyConfig>,
    pub default_search_engine: String,
    pub homepage: String,
    pub user_agent: Option<String>,
    pub extensions: Vec<String>,
    pub bookmarks_folder: String,
    pub container_id: Option<String>,
    pub is_active: bool,
    pub is_locked: bool,
    pub lock_password_hash: Option<String>,
    pub shortcuts: ProfileShortcuts,
    pub created_at: DateTime<Utc>,
    pub last_used: DateTime<Utc>,
    pub stats: ProfileStats,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileIcon {
    pub icon_type: IconType,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum IconType {
    Emoji,
    Material,
    Custom,
    Initials,
    Image,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataIsolation {
    pub separate_cookies: bool,
    pub separate_storage: bool,
    pub separate_cache: bool,
    pub separate_history: bool,
    pub separate_passwords: bool,
    pub separate_bookmarks: bool,
    pub separate_extensions: bool,
    pub separate_downloads: bool,
    pub container_mode: ContainerMode,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ContainerMode {
    None,           // Shares with main profile
    Soft,           // Separate cookies only
    Hard,           // Full isolation
    Temporary,      // Clears on close
    Incognito,      // No persistence
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfilePrivacy {
    pub block_trackers: bool,
    pub block_ads: bool,
    pub block_third_party_cookies: bool,
    pub fingerprint_protection: FingerprintProtection,
    pub https_only: bool,
    pub clear_on_exit: ClearOnExit,
    pub do_not_track: bool,
    pub disable_webrtc_leak: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum FingerprintProtection {
    Off,
    Standard,
    Strict,
    Random,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClearOnExit {
    pub enabled: bool,
    pub clear_history: bool,
    pub clear_cookies: bool,
    pub clear_cache: bool,
    pub clear_downloads: bool,
    pub clear_form_data: bool,
    pub clear_passwords: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxyConfig {
    pub enabled: bool,
    pub proxy_type: ProxyType,
    pub host: String,
    pub port: u16,
    pub username: Option<String>,
    pub password: Option<String>,
    pub bypass_list: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ProxyType {
    Http,
    Https,
    Socks4,
    Socks5,
    Auto,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileShortcuts {
    pub switch_to: Option<String>,
    pub open_in: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileStats {
    pub total_sessions: u64,
    pub total_time_minutes: u64,
    pub sites_visited: u64,
    pub searches_made: u64,
    pub downloads_count: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileSettings {
    pub enabled: bool,
    pub default_profile_id: Option<String>,
    pub show_profile_selector: bool,
    pub show_profile_indicator: bool,
    pub allow_profile_import: bool,
    pub allow_profile_export: bool,
    pub max_profiles: u32,
    pub sync_profiles: bool,
    pub keyboard_shortcuts: ProfileKeyboardShortcuts,
    pub quick_switch_enabled: bool,
    pub show_in_toolbar: bool,
    pub profile_selector_position: SelectorPosition,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SelectorPosition {
    ToolbarLeft,
    ToolbarRight,
    AddressBarLeft,
    AddressBarRight,
    Hidden,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileKeyboardShortcuts {
    pub open_selector: String,
    pub next_profile: String,
    pub prev_profile: String,
    pub open_in_profile: String,
    pub new_window_in_profile: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileTemplate {
    pub id: String,
    pub name: String,
    pub description: String,
    pub icon: ProfileIcon,
    pub color: String,
    pub data_isolation: DataIsolation,
    pub privacy_settings: ProfilePrivacy,
    pub is_builtin: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileSession {
    pub id: String,
    pub profile_id: String,
    pub tabs: Vec<ProfileTab>,
    pub started_at: DateTime<Utc>,
    pub ended_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileTab {
    pub id: String,
    pub url: String,
    pub title: String,
    pub favicon: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileExport {
    pub profile: WorkspaceProfile,
    pub bookmarks: Option<String>,
    pub extensions: Vec<String>,
    pub settings: HashMap<String, String>,
    pub exported_at: DateTime<Utc>,
}

// ==================== Service Implementation ====================

pub struct BrowserWorkspaceProfilesService {
    profiles: RwLock<HashMap<String, WorkspaceProfile>>,
    settings: RwLock<ProfileSettings>,
    templates: RwLock<HashMap<String, ProfileTemplate>>,
    sessions: RwLock<HashMap<String, ProfileSession>>,
    active_profile_id: RwLock<Option<String>>,
}

impl BrowserWorkspaceProfilesService {
    pub fn new() -> Self {
        let service = Self {
            profiles: RwLock::new(HashMap::new()),
            settings: RwLock::new(Self::default_settings()),
            templates: RwLock::new(Self::default_templates()),
            sessions: RwLock::new(HashMap::new()),
            active_profile_id: RwLock::new(None),
        };

        // Create default profile
        service.create_default_profile();
        service
    }

    fn create_default_profile(&self) {
        let default = WorkspaceProfile {
            id: "default".to_string(),
            name: "Personal".to_string(),
            icon: ProfileIcon {
                icon_type: IconType::Emoji,
                value: "👤".to_string(),
            },
            color: "#3b82f6".to_string(),
            description: Some("Default personal profile".to_string()),
            data_isolation: DataIsolation {
                separate_cookies: false,
                separate_storage: false,
                separate_cache: false,
                separate_history: false,
                separate_passwords: false,
                separate_bookmarks: false,
                separate_extensions: false,
                separate_downloads: false,
                container_mode: ContainerMode::None,
            },
            privacy_settings: ProfilePrivacy {
                block_trackers: true,
                block_ads: true,
                block_third_party_cookies: false,
                fingerprint_protection: FingerprintProtection::Standard,
                https_only: false,
                clear_on_exit: ClearOnExit {
                    enabled: false,
                    clear_history: false,
                    clear_cookies: false,
                    clear_cache: false,
                    clear_downloads: false,
                    clear_form_data: false,
                    clear_passwords: false,
                },
                do_not_track: true,
                disable_webrtc_leak: false,
            },
            proxy_config: None,
            default_search_engine: "google".to_string(),
            homepage: "about:newtab".to_string(),
            user_agent: None,
            extensions: Vec::new(),
            bookmarks_folder: "personal".to_string(),
            container_id: None,
            is_active: true,
            is_locked: false,
            lock_password_hash: None,
            shortcuts: ProfileShortcuts {
                switch_to: Some("Ctrl+1".to_string()),
                open_in: None,
            },
            created_at: Utc::now(),
            last_used: Utc::now(),
            stats: ProfileStats {
                total_sessions: 0,
                total_time_minutes: 0,
                sites_visited: 0,
                searches_made: 0,
                downloads_count: 0,
            },
        };

        self.profiles.write().unwrap().insert("default".to_string(), default);
        *self.active_profile_id.write().unwrap() = Some("default".to_string());
    }

    fn default_settings() -> ProfileSettings {
        ProfileSettings {
            enabled: true,
            default_profile_id: Some("default".to_string()),
            show_profile_selector: true,
            show_profile_indicator: true,
            allow_profile_import: true,
            allow_profile_export: true,
            max_profiles: 20,
            sync_profiles: false,
            keyboard_shortcuts: ProfileKeyboardShortcuts {
                open_selector: "Ctrl+Shift+M".to_string(),
                next_profile: "Ctrl+Shift+]".to_string(),
                prev_profile: "Ctrl+Shift+[".to_string(),
                open_in_profile: "Ctrl+Shift+O".to_string(),
                new_window_in_profile: "Ctrl+Shift+N".to_string(),
            },
            quick_switch_enabled: true,
            show_in_toolbar: true,
            profile_selector_position: SelectorPosition::ToolbarRight,
        }
    }

    fn default_templates() -> HashMap<String, ProfileTemplate> {
        let mut templates = HashMap::new();

        templates.insert("work".to_string(), ProfileTemplate {
            id: "work".to_string(),
            name: "Work".to_string(),
            description: "Professional work profile with strict privacy".to_string(),
            icon: ProfileIcon {
                icon_type: IconType::Emoji,
                value: "💼".to_string(),
            },
            color: "#10b981".to_string(),
            data_isolation: DataIsolation {
                separate_cookies: true,
                separate_storage: true,
                separate_cache: true,
                separate_history: true,
                separate_passwords: true,
                separate_bookmarks: true,
                separate_extensions: true,
                separate_downloads: true,
                container_mode: ContainerMode::Hard,
            },
            privacy_settings: ProfilePrivacy {
                block_trackers: true,
                block_ads: true,
                block_third_party_cookies: true,
                fingerprint_protection: FingerprintProtection::Strict,
                https_only: true,
                clear_on_exit: ClearOnExit {
                    enabled: false,
                    clear_history: false,
                    clear_cookies: false,
                    clear_cache: false,
                    clear_downloads: false,
                    clear_form_data: false,
                    clear_passwords: false,
                },
                do_not_track: true,
                disable_webrtc_leak: true,
            },
            is_builtin: true,
        });

        templates.insert("private".to_string(), ProfileTemplate {
            id: "private".to_string(),
            name: "Private Browsing".to_string(),
            description: "Maximum privacy with no data persistence".to_string(),
            icon: ProfileIcon {
                icon_type: IconType::Emoji,
                value: "🔒".to_string(),
            },
            color: "#8b5cf6".to_string(),
            data_isolation: DataIsolation {
                separate_cookies: true,
                separate_storage: true,
                separate_cache: true,
                separate_history: true,
                separate_passwords: true,
                separate_bookmarks: false,
                separate_extensions: false,
                separate_downloads: true,
                container_mode: ContainerMode::Temporary,
            },
            privacy_settings: ProfilePrivacy {
                block_trackers: true,
                block_ads: true,
                block_third_party_cookies: true,
                fingerprint_protection: FingerprintProtection::Random,
                https_only: true,
                clear_on_exit: ClearOnExit {
                    enabled: true,
                    clear_history: true,
                    clear_cookies: true,
                    clear_cache: true,
                    clear_downloads: true,
                    clear_form_data: true,
                    clear_passwords: true,
                },
                do_not_track: true,
                disable_webrtc_leak: true,
            },
            is_builtin: true,
        });

        templates.insert("shopping".to_string(), ProfileTemplate {
            id: "shopping".to_string(),
            name: "Shopping".to_string(),
            description: "For online shopping with price tracking".to_string(),
            icon: ProfileIcon {
                icon_type: IconType::Emoji,
                value: "🛒".to_string(),
            },
            color: "#f59e0b".to_string(),
            data_isolation: DataIsolation {
                separate_cookies: true,
                separate_storage: true,
                separate_cache: false,
                separate_history: true,
                separate_passwords: true,
                separate_bookmarks: true,
                separate_extensions: true,
                separate_downloads: true,
                container_mode: ContainerMode::Soft,
            },
            privacy_settings: ProfilePrivacy {
                block_trackers: true,
                block_ads: false,
                block_third_party_cookies: false,
                fingerprint_protection: FingerprintProtection::Standard,
                https_only: true,
                clear_on_exit: ClearOnExit {
                    enabled: false,
                    clear_history: false,
                    clear_cookies: false,
                    clear_cache: false,
                    clear_downloads: false,
                    clear_form_data: false,
                    clear_passwords: false,
                },
                do_not_track: false,
                disable_webrtc_leak: false,
            },
            is_builtin: true,
        });

        templates.insert("social".to_string(), ProfileTemplate {
            id: "social".to_string(),
            name: "Social Media".to_string(),
            description: "Isolated profile for social networks".to_string(),
            icon: ProfileIcon {
                icon_type: IconType::Emoji,
                value: "📱".to_string(),
            },
            color: "#ec4899".to_string(),
            data_isolation: DataIsolation {
                separate_cookies: true,
                separate_storage: true,
                separate_cache: true,
                separate_history: true,
                separate_passwords: true,
                separate_bookmarks: true,
                separate_extensions: false,
                separate_downloads: false,
                container_mode: ContainerMode::Hard,
            },
            privacy_settings: ProfilePrivacy {
                block_trackers: true,
                block_ads: true,
                block_third_party_cookies: true,
                fingerprint_protection: FingerprintProtection::Standard,
                https_only: true,
                clear_on_exit: ClearOnExit {
                    enabled: false,
                    clear_history: false,
                    clear_cookies: false,
                    clear_cache: false,
                    clear_downloads: false,
                    clear_form_data: false,
                    clear_passwords: false,
                },
                do_not_track: true,
                disable_webrtc_leak: true,
            },
            is_builtin: true,
        });

        templates.insert("banking".to_string(), ProfileTemplate {
            id: "banking".to_string(),
            name: "Banking".to_string(),
            description: "Secure profile for financial sites".to_string(),
            icon: ProfileIcon {
                icon_type: IconType::Emoji,
                value: "🏦".to_string(),
            },
            color: "#059669".to_string(),
            data_isolation: DataIsolation {
                separate_cookies: true,
                separate_storage: true,
                separate_cache: true,
                separate_history: true,
                separate_passwords: true,
                separate_bookmarks: true,
                separate_extensions: true,
                separate_downloads: true,
                container_mode: ContainerMode::Hard,
            },
            privacy_settings: ProfilePrivacy {
                block_trackers: true,
                block_ads: true,
                block_third_party_cookies: true,
                fingerprint_protection: FingerprintProtection::Off, // Banks may need fingerprinting
                https_only: true,
                clear_on_exit: ClearOnExit {
                    enabled: true,
                    clear_history: true,
                    clear_cookies: true,
                    clear_cache: true,
                    clear_downloads: false,
                    clear_form_data: true,
                    clear_passwords: false, // Keep passwords
                },
                do_not_track: true,
                disable_webrtc_leak: true,
            },
            is_builtin: true,
        });

        templates
    }

    // ==================== Settings ====================

    pub fn get_settings(&self) -> ProfileSettings {
        self.settings.read().unwrap().clone()
    }

    pub fn update_settings(&self, new_settings: ProfileSettings) {
        let mut settings = self.settings.write().unwrap();
        *settings = new_settings;
    }

    // ==================== Profile Management ====================

    pub fn create_profile(&self, name: String, template_id: Option<String>) -> Result<WorkspaceProfile, String> {
        let settings = self.settings.read().unwrap();
        let profiles = self.profiles.read().unwrap();

        if profiles.len() >= settings.max_profiles as usize {
            return Err(format!("Maximum {} profiles allowed", settings.max_profiles));
        }
        drop(profiles);

        let template = template_id
            .and_then(|id| self.templates.read().unwrap().get(&id).cloned());

        let (data_isolation, privacy_settings, color, icon) = if let Some(t) = template {
            (t.data_isolation, t.privacy_settings, t.color, t.icon)
        } else {
            (
                DataIsolation {
                    separate_cookies: true,
                    separate_storage: true,
                    separate_cache: false,
                    separate_history: false,
                    separate_passwords: true,
                    separate_bookmarks: true,
                    separate_extensions: false,
                    separate_downloads: false,
                    container_mode: ContainerMode::Soft,
                },
                ProfilePrivacy {
                    block_trackers: true,
                    block_ads: true,
                    block_third_party_cookies: false,
                    fingerprint_protection: FingerprintProtection::Standard,
                    https_only: false,
                    clear_on_exit: ClearOnExit {
                        enabled: false,
                        clear_history: false,
                        clear_cookies: false,
                        clear_cache: false,
                        clear_downloads: false,
                        clear_form_data: false,
                        clear_passwords: false,
                    },
                    do_not_track: true,
                    disable_webrtc_leak: false,
                },
                "#6366f1".to_string(),
                ProfileIcon {
                    icon_type: IconType::Initials,
                    value: name.chars().take(2).collect::<String>().to_uppercase(),
                },
            )
        };

        let profile = WorkspaceProfile {
            id: Uuid::new_v4().to_string(),
            name,
            icon,
            color,
            description: None,
            data_isolation,
            privacy_settings,
            proxy_config: None,
            default_search_engine: "google".to_string(),
            homepage: "about:newtab".to_string(),
            user_agent: None,
            extensions: Vec::new(),
            bookmarks_folder: Uuid::new_v4().to_string(),
            container_id: Some(Uuid::new_v4().to_string()),
            is_active: false,
            is_locked: false,
            lock_password_hash: None,
            shortcuts: ProfileShortcuts {
                switch_to: None,
                open_in: None,
            },
            created_at: Utc::now(),
            last_used: Utc::now(),
            stats: ProfileStats {
                total_sessions: 0,
                total_time_minutes: 0,
                sites_visited: 0,
                searches_made: 0,
                downloads_count: 0,
            },
        };

        let id = profile.id.clone();
        self.profiles.write().unwrap().insert(id, profile.clone());

        Ok(profile)
    }

    pub fn get_profile(&self, profile_id: &str) -> Option<WorkspaceProfile> {
        self.profiles.read().unwrap().get(profile_id).cloned()
    }

    pub fn get_all_profiles(&self) -> Vec<WorkspaceProfile> {
        self.profiles.read().unwrap().values().cloned().collect()
    }

    pub fn get_active_profile(&self) -> Option<WorkspaceProfile> {
        let active_id = self.active_profile_id.read().unwrap().clone();
        active_id.and_then(|id| self.get_profile(&id))
    }

    pub fn update_profile(&self, profile_id: &str, updates: ProfileUpdate) -> Result<WorkspaceProfile, String> {
        let mut profiles = self.profiles.write().unwrap();
        let profile = profiles.get_mut(profile_id)
            .ok_or_else(|| "Profile not found".to_string())?;

        if let Some(name) = updates.name {
            profile.name = name;
        }
        if let Some(icon) = updates.icon {
            profile.icon = icon;
        }
        if let Some(color) = updates.color {
            profile.color = color;
        }
        if let Some(description) = updates.description {
            profile.description = Some(description);
        }
        if let Some(homepage) = updates.homepage {
            profile.homepage = homepage;
        }
        if let Some(search_engine) = updates.default_search_engine {
            profile.default_search_engine = search_engine;
        }
        if let Some(user_agent) = updates.user_agent {
            profile.user_agent = Some(user_agent);
        }
        if let Some(privacy) = updates.privacy_settings {
            profile.privacy_settings = privacy;
        }
        if let Some(isolation) = updates.data_isolation {
            profile.data_isolation = isolation;
        }
        if let Some(proxy) = updates.proxy_config {
            profile.proxy_config = Some(proxy);
        }

        Ok(profile.clone())
    }

    pub fn delete_profile(&self, profile_id: &str) -> Result<(), String> {
        if profile_id == "default" {
            return Err("Cannot delete default profile".to_string());
        }

        let mut profiles = self.profiles.write().unwrap();
        profiles.remove(profile_id)
            .ok_or_else(|| "Profile not found".to_string())?;

        // If this was the active profile, switch to default
        let mut active = self.active_profile_id.write().unwrap();
        if active.as_deref() == Some(profile_id) {
            *active = Some("default".to_string());
        }

        Ok(())
    }

    pub fn switch_profile(&self, profile_id: &str) -> Result<WorkspaceProfile, String> {
        let mut profiles = self.profiles.write().unwrap();
        
        // Check if profile exists
        if !profiles.contains_key(profile_id) {
            return Err("Profile not found".to_string());
        }

        // Deactivate current profile
        for profile in profiles.values_mut() {
            profile.is_active = false;
        }

        // Activate new profile
        let profile = profiles.get_mut(profile_id).unwrap();
        profile.is_active = true;
        profile.last_used = Utc::now();
        profile.stats.total_sessions += 1;

        *self.active_profile_id.write().unwrap() = Some(profile_id.to_string());

        Ok(profile.clone())
    }

    pub fn lock_profile(&self, profile_id: &str, password: &str) -> Result<(), String> {
        let mut profiles = self.profiles.write().unwrap();
        let profile = profiles.get_mut(profile_id)
            .ok_or_else(|| "Profile not found".to_string())?;

        // In real implementation, would use proper hashing
        profile.lock_password_hash = Some(format!("hash:{}", password));
        profile.is_locked = true;

        Ok(())
    }

    pub fn unlock_profile(&self, profile_id: &str, password: &str) -> Result<(), String> {
        let mut profiles = self.profiles.write().unwrap();
        let profile = profiles.get_mut(profile_id)
            .ok_or_else(|| "Profile not found".to_string())?;

        if let Some(hash) = &profile.lock_password_hash {
            if hash == &format!("hash:{}", password) {
                profile.is_locked = false;
                Ok(())
            } else {
                Err("Incorrect password".to_string())
            }
        } else {
            Err("Profile is not locked".to_string())
        }
    }

    // ==================== Templates ====================

    pub fn get_template(&self, template_id: &str) -> Option<ProfileTemplate> {
        self.templates.read().unwrap().get(template_id).cloned()
    }

    pub fn get_all_templates(&self) -> Vec<ProfileTemplate> {
        self.templates.read().unwrap().values().cloned().collect()
    }

    pub fn create_custom_template(&self, name: String, from_profile_id: &str) -> Result<ProfileTemplate, String> {
        let profiles = self.profiles.read().unwrap();
        let profile = profiles.get(from_profile_id)
            .ok_or_else(|| "Profile not found".to_string())?;

        let template = ProfileTemplate {
            id: Uuid::new_v4().to_string(),
            name,
            description: format!("Template based on {}", profile.name),
            icon: profile.icon.clone(),
            color: profile.color.clone(),
            data_isolation: profile.data_isolation.clone(),
            privacy_settings: profile.privacy_settings.clone(),
            is_builtin: false,
        };

        drop(profiles);
        let id = template.id.clone();
        self.templates.write().unwrap().insert(id, template.clone());

        Ok(template)
    }

    // ==================== Export/Import ====================

    pub fn export_profile(&self, profile_id: &str) -> Result<ProfileExport, String> {
        let profiles = self.profiles.read().unwrap();
        let profile = profiles.get(profile_id)
            .ok_or_else(|| "Profile not found".to_string())?
            .clone();

        Ok(ProfileExport {
            profile,
            bookmarks: None,
            extensions: Vec::new(),
            settings: HashMap::new(),
            exported_at: Utc::now(),
        })
    }

    pub fn import_profile(&self, export: ProfileExport) -> Result<WorkspaceProfile, String> {
        let settings = self.settings.read().unwrap();
        
        if !settings.allow_profile_import {
            return Err("Profile import is disabled".to_string());
        }

        let profiles = self.profiles.read().unwrap();
        if profiles.len() >= settings.max_profiles as usize {
            return Err(format!("Maximum {} profiles allowed", settings.max_profiles));
        }
        drop(profiles);

        let mut profile = export.profile;
        profile.id = Uuid::new_v4().to_string();
        profile.name = format!("{} (Imported)", profile.name);
        profile.created_at = Utc::now();
        profile.last_used = Utc::now();
        profile.is_active = false;
        profile.stats = ProfileStats {
            total_sessions: 0,
            total_time_minutes: 0,
            sites_visited: 0,
            searches_made: 0,
            downloads_count: 0,
        };

        let id = profile.id.clone();
        self.profiles.write().unwrap().insert(id, profile.clone());

        Ok(profile)
    }

    // ==================== Stats ====================

    pub fn update_profile_stats(&self, profile_id: &str, sites_visited: u64, searches: u64, downloads: u64, time_minutes: u64) {
        if let Some(profile) = self.profiles.write().unwrap().get_mut(profile_id) {
            profile.stats.sites_visited += sites_visited;
            profile.stats.searches_made += searches;
            profile.stats.downloads_count += downloads;
            profile.stats.total_time_minutes += time_minutes;
        }
    }

    pub fn get_profile_stats(&self, profile_id: &str) -> Option<ProfileStats> {
        self.profiles.read().unwrap()
            .get(profile_id)
            .map(|p| p.stats.clone())
    }
}

// ==================== Update Types ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileUpdate {
    pub name: Option<String>,
    pub icon: Option<ProfileIcon>,
    pub color: Option<String>,
    pub description: Option<String>,
    pub homepage: Option<String>,
    pub default_search_engine: Option<String>,
    pub user_agent: Option<String>,
    pub privacy_settings: Option<ProfilePrivacy>,
    pub data_isolation: Option<DataIsolation>,
    pub proxy_config: Option<ProxyConfig>,
}

impl Default for BrowserWorkspaceProfilesService {
    fn default() -> Self {
        Self::new()
    }
}
