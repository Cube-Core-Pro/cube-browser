// CUBE Nexum - Web Apps (PWA) Service
// Progressive Web App manager with installation, updates, and shortcuts

use std::collections::HashMap;
use std::sync::RwLock;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// ==================== Types ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebApp {
    pub id: String,
    pub name: String,
    pub short_name: Option<String>,
    pub description: Option<String>,
    pub start_url: String,
    pub scope: String,
    pub manifest_url: Option<String>,
    pub icons: Vec<WebAppIcon>,
    pub theme_color: Option<String>,
    pub background_color: Option<String>,
    pub display_mode: DisplayMode,
    pub orientation: Orientation,
    pub categories: Vec<String>,
    pub shortcuts: Vec<WebAppShortcut>,
    pub screenshots: Vec<WebAppScreenshot>,
    pub share_target: Option<ShareTarget>,
    pub launch_handler: LaunchHandler,
    pub window_controls_overlay: bool,
    pub installed_at: DateTime<Utc>,
    pub last_launched: Option<DateTime<Utc>>,
    pub launch_count: u32,
    pub is_pinned: bool,
    pub is_favorite: bool,
    pub custom_icon: Option<String>,
    pub custom_name: Option<String>,
    pub window_bounds: Option<WindowBounds>,
    pub notifications_enabled: bool,
    pub badge_count: u32,
    pub offline_enabled: bool,
    pub update_available: bool,
    pub version: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebAppIcon {
    pub src: String,
    pub sizes: String,
    pub icon_type: Option<String>,
    pub purpose: IconPurpose,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum IconPurpose {
    Any,
    Maskable,
    Monochrome,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DisplayMode {
    Fullscreen,
    Standalone,
    MinimalUi,
    Browser,
    WindowControlsOverlay,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Orientation {
    Any,
    Natural,
    Landscape,
    Portrait,
    LandscapePrimary,
    LandscapeSecondary,
    PortraitPrimary,
    PortraitSecondary,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebAppShortcut {
    pub name: String,
    pub short_name: Option<String>,
    pub description: Option<String>,
    pub url: String,
    pub icons: Vec<WebAppIcon>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebAppScreenshot {
    pub src: String,
    pub sizes: String,
    pub screenshot_type: Option<String>,
    pub platform: Option<String>,
    pub label: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShareTarget {
    pub action: String,
    pub method: ShareMethod,
    pub enctype: String,
    pub params: ShareTargetParams,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ShareMethod {
    Get,
    Post,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShareTargetParams {
    pub title: Option<String>,
    pub text: Option<String>,
    pub url: Option<String>,
    pub files: Vec<ShareTargetFile>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShareTargetFile {
    pub name: String,
    pub accept: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LaunchHandler {
    pub client_mode: ClientMode,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ClientMode {
    Auto,
    Navigate,
    FocusExisting,
    NavigateNew,
    NavigateExisting,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowBounds {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub maximized: bool,
    pub fullscreen: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebAppManifest {
    pub name: String,
    pub short_name: Option<String>,
    pub description: Option<String>,
    pub start_url: String,
    pub scope: Option<String>,
    pub icons: Vec<WebAppIcon>,
    pub theme_color: Option<String>,
    pub background_color: Option<String>,
    pub display: Option<String>,
    pub orientation: Option<String>,
    pub categories: Option<Vec<String>>,
    pub shortcuts: Option<Vec<WebAppShortcut>>,
    pub screenshots: Option<Vec<WebAppScreenshot>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebAppSettings {
    pub auto_check_updates: bool,
    pub check_interval_hours: u32,
    pub show_install_prompt: bool,
    pub default_display_mode: DisplayMode,
    pub open_links_in: OpenLinksIn,
    pub enable_notifications: bool,
    pub enable_badges: bool,
    pub enable_shortcuts: bool,
    pub create_desktop_shortcut: bool,
    pub create_dock_icon: bool,
    pub remember_window_position: bool,
    pub separate_profile_per_app: bool,
    pub cache_offline: bool,
    pub max_cache_size_mb: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum OpenLinksIn {
    App,
    Browser,
    Ask,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstallableApp {
    pub url: String,
    pub name: String,
    pub description: Option<String>,
    pub icons: Vec<WebAppIcon>,
    pub manifest_url: String,
    pub is_installable: bool,
    pub install_prompt_available: bool,
    pub already_installed: bool,
    pub install_criteria: InstallCriteria,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstallCriteria {
    pub has_manifest: bool,
    pub has_service_worker: bool,
    pub has_icons: bool,
    pub is_https: bool,
    pub has_start_url: bool,
    pub has_display_mode: bool,
    pub meets_requirements: bool,
    pub missing_requirements: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebAppUpdate {
    pub app_id: String,
    pub current_version: Option<String>,
    pub new_version: Option<String>,
    pub changes: Vec<String>,
    pub update_type: UpdateType,
    pub discovered_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum UpdateType {
    Minor,       // Icon/color changes
    Major,       // New features/shortcuts
    Critical,    // Security update
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebAppStats {
    pub total_apps: u32,
    pub pinned_apps: u32,
    pub favorite_apps: u32,
    pub total_launches: u32,
    pub apps_with_updates: u32,
    pub apps_by_display_mode: HashMap<String, u32>,
    pub most_used_apps: Vec<(String, u32)>,
    pub recently_launched: Vec<String>,
    pub cache_size_mb: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebAppCategory {
    pub name: String,
    pub icon: String,
    pub app_ids: Vec<String>,
}

// ==================== Service Implementation ====================

pub struct BrowserWebAppsService {
    apps: RwLock<HashMap<String, WebApp>>,
    categories: RwLock<HashMap<String, WebAppCategory>>,
    pending_updates: RwLock<Vec<WebAppUpdate>>,
    settings: RwLock<WebAppSettings>,
}

impl BrowserWebAppsService {
    pub fn new() -> Self {
        Self {
            apps: RwLock::new(HashMap::new()),
            categories: RwLock::new(Self::default_categories()),
            pending_updates: RwLock::new(Vec::new()),
            settings: RwLock::new(Self::default_settings()),
        }
    }

    fn default_settings() -> WebAppSettings {
        WebAppSettings {
            auto_check_updates: true,
            check_interval_hours: 24,
            show_install_prompt: true,
            default_display_mode: DisplayMode::Standalone,
            open_links_in: OpenLinksIn::App,
            enable_notifications: true,
            enable_badges: true,
            enable_shortcuts: true,
            create_desktop_shortcut: true,
            create_dock_icon: true,
            remember_window_position: true,
            separate_profile_per_app: false,
            cache_offline: true,
            max_cache_size_mb: 500,
        }
    }

    fn default_categories() -> HashMap<String, WebAppCategory> {
        let mut categories = HashMap::new();
        
        let default_cats = vec![
            ("productivity", "Productivity", "📊"),
            ("social", "Social", "💬"),
            ("entertainment", "Entertainment", "🎬"),
            ("games", "Games", "🎮"),
            ("utilities", "Utilities", "🔧"),
            ("shopping", "Shopping", "🛒"),
            ("news", "News", "📰"),
            ("finance", "Finance", "💰"),
            ("education", "Education", "📚"),
            ("health", "Health", "🏥"),
        ];

        for (id, name, icon) in default_cats {
            categories.insert(id.to_string(), WebAppCategory {
                name: name.to_string(),
                icon: icon.to_string(),
                app_ids: Vec::new(),
            });
        }

        categories
    }

    // ==================== Settings ====================

    pub fn get_settings(&self) -> WebAppSettings {
        self.settings.read().unwrap().clone()
    }

    pub fn update_settings(&self, new_settings: WebAppSettings) {
        let mut settings = self.settings.write().unwrap();
        *settings = new_settings;
    }

    // ==================== App Installation ====================

    pub fn install_app(&self, manifest: WebAppManifest, url: &str) -> Result<WebApp, String> {
        let now = Utc::now();
        let settings = self.settings.read().unwrap();

        let app = WebApp {
            id: Uuid::new_v4().to_string(),
            name: manifest.name.clone(),
            short_name: manifest.short_name,
            description: manifest.description,
            start_url: manifest.start_url.clone(),
            scope: manifest.scope.unwrap_or_else(|| {
                // Default scope to origin
                if let Ok(parsed) = url::Url::parse(url) {
                    format!("{}://{}/", parsed.scheme(), parsed.host_str().unwrap_or(""))
                } else {
                    "/".to_string()
                }
            }),
            manifest_url: Some(url.to_string()),
            icons: manifest.icons,
            theme_color: manifest.theme_color,
            background_color: manifest.background_color,
            display_mode: manifest.display.as_ref()
                .and_then(|d| self.parse_display_mode(d))
                .unwrap_or(settings.default_display_mode.clone()),
            orientation: manifest.orientation.as_ref()
                .and_then(|o| self.parse_orientation(o))
                .unwrap_or(Orientation::Any),
            categories: manifest.categories.unwrap_or_default(),
            shortcuts: manifest.shortcuts.unwrap_or_default(),
            screenshots: manifest.screenshots.unwrap_or_default(),
            share_target: None,
            launch_handler: LaunchHandler {
                client_mode: ClientMode::NavigateExisting,
            },
            window_controls_overlay: false,
            installed_at: now,
            last_launched: None,
            launch_count: 0,
            is_pinned: false,
            is_favorite: false,
            custom_icon: None,
            custom_name: None,
            window_bounds: None,
            notifications_enabled: settings.enable_notifications,
            badge_count: 0,
            offline_enabled: settings.cache_offline,
            update_available: false,
            version: None,
        };

        let id = app.id.clone();
        self.apps.write().unwrap().insert(id.clone(), app.clone());

        // Auto-categorize
        for category in &app.categories {
            self.add_to_category(&id, category);
        }

        Ok(app)
    }

    fn parse_display_mode(&self, mode: &str) -> Option<DisplayMode> {
        match mode.to_lowercase().as_str() {
            "fullscreen" => Some(DisplayMode::Fullscreen),
            "standalone" => Some(DisplayMode::Standalone),
            "minimal-ui" => Some(DisplayMode::MinimalUi),
            "browser" => Some(DisplayMode::Browser),
            "window-controls-overlay" => Some(DisplayMode::WindowControlsOverlay),
            _ => None,
        }
    }

    fn parse_orientation(&self, orientation: &str) -> Option<Orientation> {
        match orientation.to_lowercase().as_str() {
            "any" => Some(Orientation::Any),
            "natural" => Some(Orientation::Natural),
            "landscape" => Some(Orientation::Landscape),
            "portrait" => Some(Orientation::Portrait),
            "landscape-primary" => Some(Orientation::LandscapePrimary),
            "landscape-secondary" => Some(Orientation::LandscapeSecondary),
            "portrait-primary" => Some(Orientation::PortraitPrimary),
            "portrait-secondary" => Some(Orientation::PortraitSecondary),
            _ => None,
        }
    }

    pub fn check_installable(&self, url: &str, has_manifest: bool, has_service_worker: bool, manifest: Option<WebAppManifest>) -> InstallableApp {
        let is_https = url.starts_with("https://");
        let already_installed = self.is_url_installed(url);

        let (name, description, icons, manifest_url, has_icons, has_start_url, has_display_mode) = 
            if let Some(m) = manifest {
                (
                    m.name.clone(),
                    m.description.clone(),
                    m.icons.clone(),
                    format!("{}/manifest.json", url),
                    !m.icons.is_empty(),
                    !m.start_url.is_empty(),
                    m.display.is_some(),
                )
            } else {
                // Extract from URL
                let parsed_name = url::Url::parse(url)
                    .ok()
                    .and_then(|u| u.host_str().map(|h| h.to_string()))
                    .unwrap_or_else(|| "Unknown".to_string());
                
                (parsed_name, None, Vec::new(), String::new(), false, false, false)
            };

        let mut missing = Vec::new();
        if !has_manifest { missing.push("Web App Manifest".to_string()); }
        if !has_service_worker { missing.push("Service Worker".to_string()); }
        if !is_https { missing.push("HTTPS".to_string()); }
        if !has_icons { missing.push("App Icons".to_string()); }
        if !has_start_url { missing.push("Start URL".to_string()); }

        let meets_requirements = has_manifest && has_service_worker && is_https && has_icons && has_start_url;

        InstallableApp {
            url: url.to_string(),
            name,
            description,
            icons,
            manifest_url,
            is_installable: meets_requirements,
            install_prompt_available: meets_requirements && !already_installed,
            already_installed,
            install_criteria: InstallCriteria {
                has_manifest,
                has_service_worker,
                has_icons,
                is_https,
                has_start_url,
                has_display_mode,
                meets_requirements,
                missing_requirements: missing,
            },
        }
    }

    fn is_url_installed(&self, url: &str) -> bool {
        let apps = self.apps.read().unwrap();
        apps.values().any(|app| {
            app.start_url == url || app.scope.contains(url) || url.starts_with(&app.scope)
        })
    }

    pub fn uninstall_app(&self, app_id: &str) -> Result<(), String> {
        // Remove from categories
        let mut categories = self.categories.write().unwrap();
        for category in categories.values_mut() {
            category.app_ids.retain(|id| id != app_id);
        }
        drop(categories);

        self.apps.write().unwrap()
            .remove(app_id)
            .ok_or_else(|| "App not found".to_string())?;

        Ok(())
    }

    // ==================== App CRUD ====================

    pub fn get_app(&self, app_id: &str) -> Option<WebApp> {
        self.apps.read().unwrap().get(app_id).cloned()
    }

    pub fn get_all_apps(&self) -> Vec<WebApp> {
        let mut apps: Vec<_> = self.apps.read().unwrap().values().cloned().collect();
        
        // Sort: pinned first, then favorites, then by launch count
        apps.sort_by(|a, b| {
            if a.is_pinned != b.is_pinned {
                return b.is_pinned.cmp(&a.is_pinned);
            }
            if a.is_favorite != b.is_favorite {
                return b.is_favorite.cmp(&a.is_favorite);
            }
            b.launch_count.cmp(&a.launch_count)
        });

        apps
    }

    pub fn get_pinned_apps(&self) -> Vec<WebApp> {
        self.apps.read().unwrap()
            .values()
            .filter(|app| app.is_pinned)
            .cloned()
            .collect()
    }

    pub fn get_favorite_apps(&self) -> Vec<WebApp> {
        self.apps.read().unwrap()
            .values()
            .filter(|app| app.is_favorite)
            .cloned()
            .collect()
    }

    pub fn update_app(&self, app_id: &str, updates: WebAppUpdate_) -> Result<WebApp, String> {
        let mut apps = self.apps.write().unwrap();
        let app = apps.get_mut(app_id)
            .ok_or_else(|| "App not found".to_string())?;

        if let Some(name) = updates.custom_name {
            app.custom_name = Some(name);
        }
        if let Some(icon) = updates.custom_icon {
            app.custom_icon = Some(icon);
        }
        if let Some(pinned) = updates.is_pinned {
            app.is_pinned = pinned;
        }
        if let Some(favorite) = updates.is_favorite {
            app.is_favorite = favorite;
        }
        if let Some(notifications) = updates.notifications_enabled {
            app.notifications_enabled = notifications;
        }
        if let Some(display_mode) = updates.display_mode {
            app.display_mode = display_mode;
        }
        if let Some(bounds) = updates.window_bounds {
            app.window_bounds = Some(bounds);
        }

        Ok(app.clone())
    }

    // ==================== Launch ====================

    pub fn launch_app(&self, app_id: &str) -> Result<WebApp, String> {
        let mut apps = self.apps.write().unwrap();
        let app = apps.get_mut(app_id)
            .ok_or_else(|| "App not found".to_string())?;

        app.launch_count += 1;
        app.last_launched = Some(Utc::now());

        Ok(app.clone())
    }

    pub fn launch_shortcut(&self, app_id: &str, shortcut_index: usize) -> Result<String, String> {
        let apps = self.apps.read().unwrap();
        let app = apps.get(app_id)
            .ok_or_else(|| "App not found".to_string())?;

        let shortcut = app.shortcuts.get(shortcut_index)
            .ok_or_else(|| "Shortcut not found".to_string())?;

        Ok(shortcut.url.clone())
    }

    // ==================== Categories ====================

    pub fn get_categories(&self) -> Vec<WebAppCategory> {
        self.categories.read().unwrap().values().cloned().collect()
    }

    pub fn get_apps_by_category(&self, category_id: &str) -> Vec<WebApp> {
        let categories = self.categories.read().unwrap();
        let apps = self.apps.read().unwrap();

        if let Some(category) = categories.get(category_id) {
            category.app_ids.iter()
                .filter_map(|id| apps.get(id).cloned())
                .collect()
        } else {
            Vec::new()
        }
    }

    pub fn add_to_category(&self, app_id: &str, category_id: &str) {
        let mut categories = self.categories.write().unwrap();
        if let Some(category) = categories.get_mut(category_id) {
            if !category.app_ids.contains(&app_id.to_string()) {
                category.app_ids.push(app_id.to_string());
            }
        }
    }

    pub fn remove_from_category(&self, app_id: &str, category_id: &str) {
        let mut categories = self.categories.write().unwrap();
        if let Some(category) = categories.get_mut(category_id) {
            category.app_ids.retain(|id| id != app_id);
        }
    }

    pub fn create_category(&self, name: String, icon: String) -> WebAppCategory {
        let id = name.to_lowercase().replace(' ', "_");
        let category = WebAppCategory {
            name,
            icon,
            app_ids: Vec::new(),
        };

        self.categories.write().unwrap().insert(id, category.clone());
        category
    }

    // ==================== Updates ====================

    pub fn check_for_updates(&self) -> Vec<WebAppUpdate> {
        // In a real implementation, this would fetch manifests and compare
        let pending = self.pending_updates.read().unwrap();
        pending.clone()
    }

    pub fn register_update(&self, app_id: &str, new_version: Option<String>, changes: Vec<String>, update_type: UpdateType) {
        let apps = self.apps.read().unwrap();
        if let Some(app) = apps.get(app_id) {
            let update = WebAppUpdate {
                app_id: app_id.to_string(),
                current_version: app.version.clone(),
                new_version,
                changes,
                update_type,
                discovered_at: Utc::now(),
            };

            drop(apps);
            self.pending_updates.write().unwrap().push(update);

            // Mark app as having update
            let mut apps = self.apps.write().unwrap();
            if let Some(app) = apps.get_mut(app_id) {
                app.update_available = true;
            }
        }
    }

    pub fn apply_update(&self, app_id: &str, new_manifest: WebAppManifest) -> Result<WebApp, String> {
        let mut apps = self.apps.write().unwrap();
        let app = apps.get_mut(app_id)
            .ok_or_else(|| "App not found".to_string())?;

        // Update fields from new manifest
        app.name = new_manifest.name;
        app.short_name = new_manifest.short_name;
        app.description = new_manifest.description;
        app.icons = new_manifest.icons;
        app.theme_color = new_manifest.theme_color;
        app.background_color = new_manifest.background_color;
        app.shortcuts = new_manifest.shortcuts.unwrap_or_default();
        app.screenshots = new_manifest.screenshots.unwrap_or_default();
        app.update_available = false;

        drop(apps);

        // Remove from pending updates
        self.pending_updates.write().unwrap().retain(|u| u.app_id != app_id);

        Ok(self.get_app(app_id).unwrap())
    }

    pub fn dismiss_update(&self, app_id: &str) {
        self.pending_updates.write().unwrap().retain(|u| u.app_id != app_id);
        
        let mut apps = self.apps.write().unwrap();
        if let Some(app) = apps.get_mut(app_id) {
            app.update_available = false;
        }
    }

    // ==================== Badges & Notifications ====================

    pub fn set_badge(&self, app_id: &str, count: u32) -> Result<(), String> {
        let mut apps = self.apps.write().unwrap();
        let app = apps.get_mut(app_id)
            .ok_or_else(|| "App not found".to_string())?;

        app.badge_count = count;
        Ok(())
    }

    pub fn clear_badge(&self, app_id: &str) -> Result<(), String> {
        self.set_badge(app_id, 0)
    }

    pub fn toggle_notifications(&self, app_id: &str) -> Result<bool, String> {
        let mut apps = self.apps.write().unwrap();
        let app = apps.get_mut(app_id)
            .ok_or_else(|| "App not found".to_string())?;

        app.notifications_enabled = !app.notifications_enabled;
        Ok(app.notifications_enabled)
    }

    // ==================== Search ====================

    pub fn search(&self, query: &str) -> Vec<WebApp> {
        let query_lower = query.to_lowercase();
        let apps = self.apps.read().unwrap();

        apps.values()
            .filter(|app| {
                app.name.to_lowercase().contains(&query_lower) ||
                app.short_name.as_ref().map(|n| n.to_lowercase().contains(&query_lower)).unwrap_or(false) ||
                app.description.as_ref().map(|d| d.to_lowercase().contains(&query_lower)).unwrap_or(false) ||
                app.start_url.to_lowercase().contains(&query_lower)
            })
            .cloned()
            .collect()
    }

    // ==================== Statistics ====================

    pub fn get_stats(&self) -> WebAppStats {
        let apps = self.apps.read().unwrap();
        let pending = self.pending_updates.read().unwrap();

        let total = apps.len() as u32;
        let pinned = apps.values().filter(|a| a.is_pinned).count() as u32;
        let favorite = apps.values().filter(|a| a.is_favorite).count() as u32;
        let total_launches: u32 = apps.values().map(|a| a.launch_count).sum();
        let with_updates = pending.len() as u32;

        let mut by_display: HashMap<String, u32> = HashMap::new();
        for app in apps.values() {
            let key = format!("{:?}", app.display_mode);
            *by_display.entry(key).or_insert(0) += 1;
        }

        let mut most_used: Vec<_> = apps.values()
            .map(|a| (a.name.clone(), a.launch_count))
            .collect();
        most_used.sort_by(|a, b| b.1.cmp(&a.1));
        most_used.truncate(10);

        let mut recently_launched: Vec<_> = apps.values()
            .filter_map(|a| a.last_launched.map(|t| (a.id.clone(), t)))
            .collect();
        recently_launched.sort_by(|a, b| b.1.cmp(&a.1));
        let recently_launched: Vec<_> = recently_launched.into_iter()
            .take(10)
            .map(|(id, _)| id)
            .collect();

        WebAppStats {
            total_apps: total,
            pinned_apps: pinned,
            favorite_apps: favorite,
            total_launches,
            apps_with_updates: with_updates,
            apps_by_display_mode: by_display,
            most_used_apps: most_used,
            recently_launched,
            cache_size_mb: 0.0, // Would need actual cache measurement
        }
    }
}

// ==================== Update Types ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebAppUpdate_ {
    pub custom_name: Option<String>,
    pub custom_icon: Option<String>,
    pub is_pinned: Option<bool>,
    pub is_favorite: Option<bool>,
    pub notifications_enabled: Option<bool>,
    pub display_mode: Option<DisplayMode>,
    pub window_bounds: Option<WindowBounds>,
}

impl Default for BrowserWebAppsService {
    fn default() -> Self {
        Self::new()
    }
}
