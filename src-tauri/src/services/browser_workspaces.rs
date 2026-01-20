// CUBE Nexum - Workspaces System
// Superior to Chrome Profiles, Arc Spaces, and Vivaldi Workspaces
// Organize tabs by project, context, or client with full isolation

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};

// ==================== Enums ====================

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum WorkspaceIcon {
    Emoji(String),
    Letter(char),
    Image(String),
    Preset(PresetIcon),
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PresetIcon {
    Work,
    Personal,
    Shopping,
    Research,
    Development,
    Design,
    Finance,
    Social,
    Entertainment,
    Education,
    Travel,
    Health,
    News,
    Gaming,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum WorkspaceColor {
    Blue,
    Green,
    Red,
    Purple,
    Orange,
    Pink,
    Teal,
    Yellow,
    Gray,
    Custom(String),
}

impl WorkspaceColor {
    pub fn hex_value(&self) -> &str {
        match self {
            WorkspaceColor::Blue => "#3b82f6",
            WorkspaceColor::Green => "#22c55e",
            WorkspaceColor::Red => "#ef4444",
            WorkspaceColor::Purple => "#a855f7",
            WorkspaceColor::Orange => "#f97316",
            WorkspaceColor::Pink => "#ec4899",
            WorkspaceColor::Teal => "#14b8a6",
            WorkspaceColor::Yellow => "#eab308",
            WorkspaceColor::Gray => "#6b7280",
            WorkspaceColor::Custom(hex) => hex,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum WorkspaceLayout {
    Tabs,
    Grid,
    List,
    Tree,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum WorkspaceStatus {
    Active,
    Sleeping,
    Archived,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SwitchAnimation {
    None,
    Fade,
    Slide,
    Scale,
}

// ==================== Structs ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceSettings {
    pub enabled: bool,
    pub show_workspace_bar: bool,
    pub workspace_bar_position: String, // "top", "left", "right"
    pub default_layout: WorkspaceLayout,
    pub switch_animation: SwitchAnimation,
    pub auto_sleep_minutes: u32,
    pub max_workspaces: usize,
    pub sync_across_devices: bool,
    pub remember_window_positions: bool,
    pub isolate_cookies: bool,
    pub isolate_storage: bool,
    pub isolate_cache: bool,
    pub show_tab_count: bool,
    pub keyboard_shortcuts: bool,
    pub quick_switch_enabled: bool,
}

impl Default for WorkspaceSettings {
    fn default() -> Self {
        Self {
            enabled: true,
            show_workspace_bar: true,
            workspace_bar_position: "left".to_string(),
            default_layout: WorkspaceLayout::Tabs,
            switch_animation: SwitchAnimation::Fade,
            auto_sleep_minutes: 30,
            max_workspaces: 20,
            sync_across_devices: true,
            remember_window_positions: true,
            isolate_cookies: true,
            isolate_storage: true,
            isolate_cache: false,
            show_tab_count: true,
            keyboard_shortcuts: true,
            quick_switch_enabled: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceTab {
    pub id: String,
    pub url: String,
    pub title: String,
    pub favicon: Option<String>,
    pub pinned: bool,
    pub muted: bool,
    pub position: usize,
    pub group_id: Option<String>,
    pub scroll_position: f64,
    pub last_accessed: u64,
    pub created_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceWindow {
    pub id: String,
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub maximized: bool,
    pub fullscreen: bool,
    pub tabs: Vec<String>, // Tab IDs
    pub active_tab: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Workspace {
    pub id: String,
    pub name: String,
    pub icon: WorkspaceIcon,
    pub color: WorkspaceColor,
    pub description: Option<String>,
    pub status: WorkspaceStatus,
    pub layout: WorkspaceLayout,
    pub tabs: Vec<WorkspaceTab>,
    pub windows: Vec<WorkspaceWindow>,
    pub active_tab_id: Option<String>,
    pub pinned: bool,
    pub locked: bool,
    pub default_url: Option<String>,
    pub allowed_domains: Vec<String>,
    pub blocked_domains: Vec<String>,
    pub custom_user_agent: Option<String>,
    pub proxy_config: Option<ProxyConfig>,
    pub container_id: Option<String>,
    pub keyboard_shortcut: Option<String>,
    pub position: usize,
    pub created_at: u64,
    pub last_accessed: u64,
    pub total_time_seconds: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxyConfig {
    pub enabled: bool,
    pub proxy_type: String, // "http", "https", "socks5"
    pub host: String,
    pub port: u16,
    pub username: Option<String>,
    pub password: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceTemplate {
    pub id: String,
    pub name: String,
    pub description: String,
    pub icon: WorkspaceIcon,
    pub color: WorkspaceColor,
    pub default_tabs: Vec<String>, // URLs
    pub allowed_domains: Vec<String>,
    pub is_builtin: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceSnapshot {
    pub id: String,
    pub workspace_id: String,
    pub name: String,
    pub tabs: Vec<WorkspaceTab>,
    pub windows: Vec<WorkspaceWindow>,
    pub created_at: u64,
    pub auto_created: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceStats {
    pub total_workspaces: usize,
    pub active_workspaces: usize,
    pub sleeping_workspaces: usize,
    pub archived_workspaces: usize,
    pub total_tabs: usize,
    pub total_time_hours: f64,
    pub most_used_workspace: Option<String>,
    pub switches_today: u32,
    pub tabs_opened_today: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuickSwitchItem {
    pub workspace_id: String,
    pub name: String,
    pub icon: WorkspaceIcon,
    pub color: WorkspaceColor,
    pub tab_count: usize,
    pub keyboard_shortcut: Option<String>,
    pub last_accessed: u64,
}

// ==================== Service ====================

pub struct BrowserWorkspacesService {
    settings: WorkspaceSettings,
    workspaces: HashMap<String, Workspace>,
    active_workspace_id: Option<String>,
    templates: Vec<WorkspaceTemplate>,
    snapshots: HashMap<String, Vec<WorkspaceSnapshot>>,
    stats: WorkspaceStats,
    switches_today: u32,
    tabs_opened_today: u32,
}

impl BrowserWorkspacesService {
    pub fn new() -> Self {
        let mut service = Self {
            settings: WorkspaceSettings::default(),
            workspaces: HashMap::new(),
            active_workspace_id: None,
            templates: Self::builtin_templates(),
            snapshots: HashMap::new(),
            stats: WorkspaceStats {
                total_workspaces: 0,
                active_workspaces: 0,
                sleeping_workspaces: 0,
                archived_workspaces: 0,
                total_tabs: 0,
                total_time_hours: 0.0,
                most_used_workspace: None,
                switches_today: 0,
                tabs_opened_today: 0,
            },
            switches_today: 0,
            tabs_opened_today: 0,
        };

        // Create default workspace
        let default_ws = service.create_default_workspace();
        let default_id = default_ws.id.clone();
        service.workspaces.insert(default_id.clone(), default_ws);
        service.active_workspace_id = Some(default_id);

        service
    }

    fn builtin_templates() -> Vec<WorkspaceTemplate> {
        vec![
            WorkspaceTemplate {
                id: "tpl_work".to_string(),
                name: "Work".to_string(),
                description: "Professional workspace for work-related tasks".to_string(),
                icon: WorkspaceIcon::Preset(PresetIcon::Work),
                color: WorkspaceColor::Blue,
                default_tabs: vec![
                    "https://mail.google.com".to_string(),
                    "https://calendar.google.com".to_string(),
                    "https://docs.google.com".to_string(),
                ],
                allowed_domains: vec![],
                is_builtin: true,
            },
            WorkspaceTemplate {
                id: "tpl_personal".to_string(),
                name: "Personal".to_string(),
                description: "Personal browsing and social media".to_string(),
                icon: WorkspaceIcon::Preset(PresetIcon::Personal),
                color: WorkspaceColor::Green,
                default_tabs: vec![],
                allowed_domains: vec![],
                is_builtin: true,
            },
            WorkspaceTemplate {
                id: "tpl_development".to_string(),
                name: "Development".to_string(),
                description: "Coding and development tools".to_string(),
                icon: WorkspaceIcon::Preset(PresetIcon::Development),
                color: WorkspaceColor::Purple,
                default_tabs: vec![
                    "https://github.com".to_string(),
                    "https://stackoverflow.com".to_string(),
                ],
                allowed_domains: vec![],
                is_builtin: true,
            },
            WorkspaceTemplate {
                id: "tpl_research".to_string(),
                name: "Research".to_string(),
                description: "Research and documentation".to_string(),
                icon: WorkspaceIcon::Preset(PresetIcon::Research),
                color: WorkspaceColor::Orange,
                default_tabs: vec![
                    "https://scholar.google.com".to_string(),
                    "https://wikipedia.org".to_string(),
                ],
                allowed_domains: vec![],
                is_builtin: true,
            },
            WorkspaceTemplate {
                id: "tpl_shopping".to_string(),
                name: "Shopping".to_string(),
                description: "Online shopping and deals".to_string(),
                icon: WorkspaceIcon::Preset(PresetIcon::Shopping),
                color: WorkspaceColor::Pink,
                default_tabs: vec![],
                allowed_domains: vec![],
                is_builtin: true,
            },
            WorkspaceTemplate {
                id: "tpl_entertainment".to_string(),
                name: "Entertainment".to_string(),
                description: "Videos, music, and streaming".to_string(),
                icon: WorkspaceIcon::Preset(PresetIcon::Entertainment),
                color: WorkspaceColor::Red,
                default_tabs: vec![
                    "https://youtube.com".to_string(),
                    "https://netflix.com".to_string(),
                ],
                allowed_domains: vec![],
                is_builtin: true,
            },
        ]
    }

    fn create_default_workspace(&self) -> Workspace {
        let now = Self::current_timestamp();
        Workspace {
            id: format!("ws_{}", now),
            name: "Default".to_string(),
            icon: WorkspaceIcon::Emoji("🏠".to_string()),
            color: WorkspaceColor::Blue,
            description: Some("Default workspace".to_string()),
            status: WorkspaceStatus::Active,
            layout: self.settings.default_layout.clone(),
            tabs: vec![],
            windows: vec![],
            active_tab_id: None,
            pinned: true,
            locked: false,
            default_url: Some("about:blank".to_string()),
            allowed_domains: vec![],
            blocked_domains: vec![],
            custom_user_agent: None,
            proxy_config: None,
            container_id: None,
            keyboard_shortcut: Some("Ctrl+1".to_string()),
            position: 0,
            created_at: now,
            last_accessed: now,
            total_time_seconds: 0,
        }
    }

    fn current_timestamp() -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs()
    }

    fn generate_id(&self, prefix: &str) -> String {
        format!("{}_{}", prefix, Self::current_timestamp())
    }

    // ==================== Settings ====================

    pub fn get_settings(&self) -> WorkspaceSettings {
        self.settings.clone()
    }

    pub fn update_settings(&mut self, settings: WorkspaceSettings) {
        self.settings = settings;
    }

    pub fn set_enabled(&mut self, enabled: bool) {
        self.settings.enabled = enabled;
    }

    pub fn set_workspace_bar_position(&mut self, position: String) {
        self.settings.workspace_bar_position = position;
    }

    pub fn set_default_layout(&mut self, layout: WorkspaceLayout) {
        self.settings.default_layout = layout;
    }

    pub fn set_switch_animation(&mut self, animation: SwitchAnimation) {
        self.settings.switch_animation = animation;
    }

    pub fn set_auto_sleep_minutes(&mut self, minutes: u32) {
        self.settings.auto_sleep_minutes = minutes;
    }

    pub fn set_isolation_settings(&mut self, cookies: bool, storage: bool, cache: bool) {
        self.settings.isolate_cookies = cookies;
        self.settings.isolate_storage = storage;
        self.settings.isolate_cache = cache;
    }

    // ==================== Workspace Management ====================

    pub fn create_workspace(&mut self, name: String, template_id: Option<String>) -> Result<Workspace, String> {
        if self.workspaces.len() >= self.settings.max_workspaces {
            return Err(format!("Maximum workspaces ({}) reached", self.settings.max_workspaces));
        }

        let now = Self::current_timestamp();
        let position = self.workspaces.len();

        let (icon, color, default_tabs, allowed_domains) = if let Some(tpl_id) = template_id {
            if let Some(template) = self.templates.iter().find(|t| t.id == tpl_id) {
                (
                    template.icon.clone(),
                    template.color.clone(),
                    template.default_tabs.clone(),
                    template.allowed_domains.clone(),
                )
            } else {
                (
                    WorkspaceIcon::Emoji("📁".to_string()),
                    WorkspaceColor::Gray,
                    vec![],
                    vec![],
                )
            }
        } else {
            (
                WorkspaceIcon::Emoji("📁".to_string()),
                WorkspaceColor::Gray,
                vec![],
                vec![],
            )
        };

        let tabs: Vec<WorkspaceTab> = default_tabs
            .iter()
            .enumerate()
            .map(|(i, url)| WorkspaceTab {
                id: format!("tab_{}_{}", now, i),
                url: url.clone(),
                title: url.clone(),
                favicon: None,
                pinned: false,
                muted: false,
                position: i,
                group_id: None,
                scroll_position: 0.0,
                last_accessed: now,
                created_at: now,
            })
            .collect();

        let workspace = Workspace {
            id: self.generate_id("ws"),
            name,
            icon,
            color,
            description: None,
            status: WorkspaceStatus::Active,
            layout: self.settings.default_layout.clone(),
            tabs,
            windows: vec![],
            active_tab_id: None,
            pinned: false,
            locked: false,
            default_url: None,
            allowed_domains,
            blocked_domains: vec![],
            custom_user_agent: None,
            proxy_config: None,
            container_id: Some(self.generate_id("container")),
            keyboard_shortcut: None,
            position,
            created_at: now,
            last_accessed: now,
            total_time_seconds: 0,
        };

        let ws_clone = workspace.clone();
        self.workspaces.insert(workspace.id.clone(), workspace);
        self.update_stats();

        Ok(ws_clone)
    }

    pub fn create_workspace_from_template(&mut self, template_id: String) -> Result<Workspace, String> {
        let template = self.templates
            .iter()
            .find(|t| t.id == template_id)
            .ok_or_else(|| "Template not found".to_string())?
            .clone();

        self.create_workspace(template.name, Some(template_id))
    }

    pub fn get_workspace(&self, workspace_id: &str) -> Option<Workspace> {
        self.workspaces.get(workspace_id).cloned()
    }

    pub fn get_all_workspaces(&self) -> Vec<Workspace> {
        let mut workspaces: Vec<_> = self.workspaces.values().cloned().collect();
        workspaces.sort_by_key(|w| w.position);
        workspaces
    }

    pub fn get_active_workspace(&self) -> Option<Workspace> {
        self.active_workspace_id
            .as_ref()
            .and_then(|id| self.workspaces.get(id).cloned())
    }

    pub fn get_active_workspace_id(&self) -> Option<String> {
        self.active_workspace_id.clone()
    }

    pub fn switch_workspace(&mut self, workspace_id: &str) -> Result<Workspace, String> {
        let workspace = self.workspaces
            .get_mut(workspace_id)
            .ok_or_else(|| "Workspace not found".to_string())?;

        workspace.status = WorkspaceStatus::Active;
        workspace.last_accessed = Self::current_timestamp();

        // Put previous workspace to sleep if auto-sleep is enabled
        if let Some(prev_id) = &self.active_workspace_id {
            if prev_id != workspace_id {
                if let Some(prev_ws) = self.workspaces.get_mut(prev_id) {
                    if self.settings.auto_sleep_minutes > 0 {
                        prev_ws.status = WorkspaceStatus::Sleeping;
                    }
                }
            }
        }

        self.active_workspace_id = Some(workspace_id.to_string());
        self.switches_today += 1;
        self.update_stats();

        Ok(self.workspaces.get(workspace_id).unwrap().clone())
    }

    pub fn update_workspace(&mut self, workspace_id: &str, name: Option<String>, description: Option<String>, icon: Option<WorkspaceIcon>, color: Option<WorkspaceColor>) -> Result<Workspace, String> {
        let workspace = self.workspaces
            .get_mut(workspace_id)
            .ok_or_else(|| "Workspace not found".to_string())?;

        if let Some(n) = name {
            workspace.name = n;
        }
        if let Some(d) = description {
            workspace.description = Some(d);
        }
        if let Some(i) = icon {
            workspace.icon = i;
        }
        if let Some(c) = color {
            workspace.color = c;
        }

        Ok(workspace.clone())
    }

    pub fn delete_workspace(&mut self, workspace_id: &str) -> Result<(), String> {
        let workspace = self.workspaces
            .get(workspace_id)
            .ok_or_else(|| "Workspace not found".to_string())?;

        if workspace.locked {
            return Err("Cannot delete locked workspace".to_string());
        }

        if workspace.pinned && self.workspaces.len() == 1 {
            return Err("Cannot delete the last pinned workspace".to_string());
        }

        self.workspaces.remove(workspace_id);
        self.snapshots.remove(workspace_id);

        // Switch to another workspace if deleting active
        if self.active_workspace_id.as_deref() == Some(workspace_id) {
            self.active_workspace_id = self.workspaces.keys().next().cloned();
        }

        self.update_stats();
        Ok(())
    }

    pub fn archive_workspace(&mut self, workspace_id: &str) -> Result<(), String> {
        let workspace = self.workspaces
            .get_mut(workspace_id)
            .ok_or_else(|| "Workspace not found".to_string())?;

        workspace.status = WorkspaceStatus::Archived;
        self.update_stats();
        Ok(())
    }

    pub fn unarchive_workspace(&mut self, workspace_id: &str) -> Result<(), String> {
        let workspace = self.workspaces
            .get_mut(workspace_id)
            .ok_or_else(|| "Workspace not found".to_string())?;

        workspace.status = WorkspaceStatus::Active;
        self.update_stats();
        Ok(())
    }

    pub fn pin_workspace(&mut self, workspace_id: &str, pinned: bool) -> Result<(), String> {
        let workspace = self.workspaces
            .get_mut(workspace_id)
            .ok_or_else(|| "Workspace not found".to_string())?;

        workspace.pinned = pinned;
        Ok(())
    }

    pub fn lock_workspace(&mut self, workspace_id: &str, locked: bool) -> Result<(), String> {
        let workspace = self.workspaces
            .get_mut(workspace_id)
            .ok_or_else(|| "Workspace not found".to_string())?;

        workspace.locked = locked;
        Ok(())
    }

    pub fn set_workspace_layout(&mut self, workspace_id: &str, layout: WorkspaceLayout) -> Result<(), String> {
        let workspace = self.workspaces
            .get_mut(workspace_id)
            .ok_or_else(|| "Workspace not found".to_string())?;

        workspace.layout = layout;
        Ok(())
    }

    pub fn set_workspace_shortcut(&mut self, workspace_id: &str, shortcut: Option<String>) -> Result<(), String> {
        let workspace = self.workspaces
            .get_mut(workspace_id)
            .ok_or_else(|| "Workspace not found".to_string())?;

        workspace.keyboard_shortcut = shortcut;
        Ok(())
    }

    pub fn reorder_workspaces(&mut self, workspace_ids: Vec<String>) -> Result<(), String> {
        for (position, id) in workspace_ids.iter().enumerate() {
            if let Some(workspace) = self.workspaces.get_mut(id) {
                workspace.position = position;
            }
        }
        Ok(())
    }

    // ==================== Tab Management ====================

    pub fn add_tab_to_workspace(&mut self, workspace_id: &str, url: String, title: Option<String>) -> Result<WorkspaceTab, String> {
        let workspace = self.workspaces
            .get_mut(workspace_id)
            .ok_or_else(|| "Workspace not found".to_string())?;

        let now = Self::current_timestamp();
        let tab = WorkspaceTab {
            id: format!("tab_{}", now),
            url: url.clone(),
            title: title.unwrap_or_else(|| url.clone()),
            favicon: None,
            pinned: false,
            muted: false,
            position: workspace.tabs.len(),
            group_id: None,
            scroll_position: 0.0,
            last_accessed: now,
            created_at: now,
        };

        workspace.tabs.push(tab.clone());
        workspace.active_tab_id = Some(tab.id.clone());
        self.tabs_opened_today += 1;
        self.update_stats();

        Ok(tab)
    }

    pub fn remove_tab_from_workspace(&mut self, workspace_id: &str, tab_id: &str) -> Result<(), String> {
        let workspace = self.workspaces
            .get_mut(workspace_id)
            .ok_or_else(|| "Workspace not found".to_string())?;

        workspace.tabs.retain(|t| t.id != tab_id);

        // Update active tab if needed
        if workspace.active_tab_id.as_deref() == Some(tab_id) {
            workspace.active_tab_id = workspace.tabs.first().map(|t| t.id.clone());
        }

        self.update_stats();
        Ok(())
    }

    pub fn update_tab(&mut self, workspace_id: &str, tab_id: &str, url: Option<String>, title: Option<String>, favicon: Option<String>) -> Result<WorkspaceTab, String> {
        let workspace = self.workspaces
            .get_mut(workspace_id)
            .ok_or_else(|| "Workspace not found".to_string())?;

        let tab = workspace.tabs
            .iter_mut()
            .find(|t| t.id == tab_id)
            .ok_or_else(|| "Tab not found".to_string())?;

        if let Some(u) = url {
            tab.url = u;
        }
        if let Some(t) = title {
            tab.title = t;
        }
        if let Some(f) = favicon {
            tab.favicon = Some(f);
        }
        tab.last_accessed = Self::current_timestamp();

        Ok(tab.clone())
    }

    pub fn move_tab_to_workspace(&mut self, from_workspace_id: &str, to_workspace_id: &str, tab_id: &str) -> Result<(), String> {
        // Get the tab from source workspace
        let tab = {
            let from_ws = self.workspaces
                .get_mut(from_workspace_id)
                .ok_or_else(|| "Source workspace not found".to_string())?;

            let tab_idx = from_ws.tabs
                .iter()
                .position(|t| t.id == tab_id)
                .ok_or_else(|| "Tab not found".to_string())?;

            from_ws.tabs.remove(tab_idx)
        };

        // Add to destination workspace
        let to_ws = self.workspaces
            .get_mut(to_workspace_id)
            .ok_or_else(|| "Destination workspace not found".to_string())?;

        let mut moved_tab = tab;
        moved_tab.position = to_ws.tabs.len();
        to_ws.tabs.push(moved_tab);

        Ok(())
    }

    pub fn set_active_tab(&mut self, workspace_id: &str, tab_id: &str) -> Result<(), String> {
        let workspace = self.workspaces
            .get_mut(workspace_id)
            .ok_or_else(|| "Workspace not found".to_string())?;

        if !workspace.tabs.iter().any(|t| t.id == tab_id) {
            return Err("Tab not found in workspace".to_string());
        }

        workspace.active_tab_id = Some(tab_id.to_string());
        
        // Update last accessed
        if let Some(tab) = workspace.tabs.iter_mut().find(|t| t.id == tab_id) {
            tab.last_accessed = Self::current_timestamp();
        }

        Ok(())
    }

    pub fn pin_tab(&mut self, workspace_id: &str, tab_id: &str, pinned: bool) -> Result<(), String> {
        let workspace = self.workspaces
            .get_mut(workspace_id)
            .ok_or_else(|| "Workspace not found".to_string())?;

        let tab = workspace.tabs
            .iter_mut()
            .find(|t| t.id == tab_id)
            .ok_or_else(|| "Tab not found".to_string())?;

        tab.pinned = pinned;
        Ok(())
    }

    pub fn mute_tab(&mut self, workspace_id: &str, tab_id: &str, muted: bool) -> Result<(), String> {
        let workspace = self.workspaces
            .get_mut(workspace_id)
            .ok_or_else(|| "Workspace not found".to_string())?;

        let tab = workspace.tabs
            .iter_mut()
            .find(|t| t.id == tab_id)
            .ok_or_else(|| "Tab not found".to_string())?;

        tab.muted = muted;
        Ok(())
    }

    // ==================== Domain Rules ====================

    pub fn add_allowed_domain(&mut self, workspace_id: &str, domain: String) -> Result<(), String> {
        let workspace = self.workspaces
            .get_mut(workspace_id)
            .ok_or_else(|| "Workspace not found".to_string())?;

        if !workspace.allowed_domains.contains(&domain) {
            workspace.allowed_domains.push(domain);
        }
        Ok(())
    }

    pub fn remove_allowed_domain(&mut self, workspace_id: &str, domain: &str) -> Result<(), String> {
        let workspace = self.workspaces
            .get_mut(workspace_id)
            .ok_or_else(|| "Workspace not found".to_string())?;

        workspace.allowed_domains.retain(|d| d != domain);
        Ok(())
    }

    pub fn add_blocked_domain(&mut self, workspace_id: &str, domain: String) -> Result<(), String> {
        let workspace = self.workspaces
            .get_mut(workspace_id)
            .ok_or_else(|| "Workspace not found".to_string())?;

        if !workspace.blocked_domains.contains(&domain) {
            workspace.blocked_domains.push(domain);
        }
        Ok(())
    }

    pub fn remove_blocked_domain(&mut self, workspace_id: &str, domain: &str) -> Result<(), String> {
        let workspace = self.workspaces
            .get_mut(workspace_id)
            .ok_or_else(|| "Workspace not found".to_string())?;

        workspace.blocked_domains.retain(|d| d != domain);
        Ok(())
    }

    pub fn is_domain_allowed(&self, workspace_id: &str, domain: &str) -> bool {
        if let Some(workspace) = self.workspaces.get(workspace_id) {
            // Check blocked first
            if workspace.blocked_domains.iter().any(|d| domain.contains(d)) {
                return false;
            }
            // If allowed list is empty, allow all
            if workspace.allowed_domains.is_empty() {
                return true;
            }
            // Check allowed
            workspace.allowed_domains.iter().any(|d| domain.contains(d))
        } else {
            true
        }
    }

    // ==================== Snapshots ====================

    pub fn create_snapshot(&mut self, workspace_id: &str, name: String, auto_created: bool) -> Result<WorkspaceSnapshot, String> {
        let workspace = self.workspaces
            .get(workspace_id)
            .ok_or_else(|| "Workspace not found".to_string())?;

        let snapshot = WorkspaceSnapshot {
            id: self.generate_id("snap"),
            workspace_id: workspace_id.to_string(),
            name,
            tabs: workspace.tabs.clone(),
            windows: workspace.windows.clone(),
            created_at: Self::current_timestamp(),
            auto_created,
        };

        self.snapshots
            .entry(workspace_id.to_string())
            .or_insert_with(Vec::new)
            .push(snapshot.clone());

        Ok(snapshot)
    }

    pub fn get_snapshots(&self, workspace_id: &str) -> Vec<WorkspaceSnapshot> {
        self.snapshots.get(workspace_id).cloned().unwrap_or_default()
    }

    pub fn restore_snapshot(&mut self, workspace_id: &str, snapshot_id: &str) -> Result<(), String> {
        let snapshot = self.snapshots
            .get(workspace_id)
            .and_then(|snaps| snaps.iter().find(|s| s.id == snapshot_id))
            .ok_or_else(|| "Snapshot not found".to_string())?
            .clone();

        let workspace = self.workspaces
            .get_mut(workspace_id)
            .ok_or_else(|| "Workspace not found".to_string())?;

        workspace.tabs = snapshot.tabs;
        workspace.windows = snapshot.windows;

        Ok(())
    }

    pub fn delete_snapshot(&mut self, workspace_id: &str, snapshot_id: &str) -> Result<(), String> {
        if let Some(snaps) = self.snapshots.get_mut(workspace_id) {
            snaps.retain(|s| s.id != snapshot_id);
        }
        Ok(())
    }

    // ==================== Templates ====================

    pub fn get_templates(&self) -> Vec<WorkspaceTemplate> {
        self.templates.clone()
    }

    pub fn create_template(&mut self, name: String, description: String, icon: WorkspaceIcon, color: WorkspaceColor, default_tabs: Vec<String>) -> WorkspaceTemplate {
        let template = WorkspaceTemplate {
            id: self.generate_id("tpl"),
            name,
            description,
            icon,
            color,
            default_tabs,
            allowed_domains: vec![],
            is_builtin: false,
        };

        self.templates.push(template.clone());
        template
    }

    pub fn delete_template(&mut self, template_id: &str) -> Result<(), String> {
        let template = self.templates
            .iter()
            .find(|t| t.id == template_id)
            .ok_or_else(|| "Template not found".to_string())?;

        if template.is_builtin {
            return Err("Cannot delete builtin template".to_string());
        }

        self.templates.retain(|t| t.id != template_id);
        Ok(())
    }

    // ==================== Quick Switch ====================

    pub fn get_quick_switch_items(&self) -> Vec<QuickSwitchItem> {
        self.workspaces
            .values()
            .filter(|w| w.status != WorkspaceStatus::Archived)
            .map(|w| QuickSwitchItem {
                workspace_id: w.id.clone(),
                name: w.name.clone(),
                icon: w.icon.clone(),
                color: w.color.clone(),
                tab_count: w.tabs.len(),
                keyboard_shortcut: w.keyboard_shortcut.clone(),
                last_accessed: w.last_accessed,
            })
            .collect()
    }

    pub fn quick_switch_next(&mut self) -> Option<Workspace> {
        let workspaces: Vec<_> = self.get_all_workspaces()
            .into_iter()
            .filter(|w| w.status != WorkspaceStatus::Archived)
            .collect();

        if workspaces.is_empty() {
            return None;
        }

        let current_idx = self.active_workspace_id
            .as_ref()
            .and_then(|id| workspaces.iter().position(|w| &w.id == id))
            .unwrap_or(0);

        let next_idx = (current_idx + 1) % workspaces.len();
        let next_id = workspaces[next_idx].id.clone();

        self.switch_workspace(&next_id).ok()
    }

    pub fn quick_switch_previous(&mut self) -> Option<Workspace> {
        let workspaces: Vec<_> = self.get_all_workspaces()
            .into_iter()
            .filter(|w| w.status != WorkspaceStatus::Archived)
            .collect();

        if workspaces.is_empty() {
            return None;
        }

        let current_idx = self.active_workspace_id
            .as_ref()
            .and_then(|id| workspaces.iter().position(|w| &w.id == id))
            .unwrap_or(0);

        let prev_idx = if current_idx == 0 {
            workspaces.len() - 1
        } else {
            current_idx - 1
        };

        let prev_id = workspaces[prev_idx].id.clone();
        self.switch_workspace(&prev_id).ok()
    }

    // ==================== Statistics ====================

    fn update_stats(&mut self) {
        let workspaces: Vec<_> = self.workspaces.values().collect();

        self.stats.total_workspaces = workspaces.len();
        self.stats.active_workspaces = workspaces.iter().filter(|w| w.status == WorkspaceStatus::Active).count();
        self.stats.sleeping_workspaces = workspaces.iter().filter(|w| w.status == WorkspaceStatus::Sleeping).count();
        self.stats.archived_workspaces = workspaces.iter().filter(|w| w.status == WorkspaceStatus::Archived).count();
        self.stats.total_tabs = workspaces.iter().map(|w| w.tabs.len()).sum();
        self.stats.total_time_hours = workspaces.iter().map(|w| w.total_time_seconds).sum::<u64>() as f64 / 3600.0;
        self.stats.most_used_workspace = workspaces
            .iter()
            .max_by_key(|w| w.total_time_seconds)
            .map(|w| w.name.clone());
        self.stats.switches_today = self.switches_today;
        self.stats.tabs_opened_today = self.tabs_opened_today;
    }

    pub fn get_stats(&self) -> WorkspaceStats {
        self.stats.clone()
    }

    pub fn reset_daily_stats(&mut self) {
        self.switches_today = 0;
        self.tabs_opened_today = 0;
        self.update_stats();
    }

    pub fn add_time_to_workspace(&mut self, workspace_id: &str, seconds: u64) {
        if let Some(workspace) = self.workspaces.get_mut(workspace_id) {
            workspace.total_time_seconds += seconds;
            self.update_stats();
        }
    }

    // ==================== Export/Import ====================

    pub fn export_workspace(&self, workspace_id: &str) -> Result<String, String> {
        let workspace = self.workspaces
            .get(workspace_id)
            .ok_or_else(|| "Workspace not found".to_string())?;

        serde_json::to_string_pretty(workspace)
            .map_err(|e| format!("Failed to export workspace: {}", e))
    }

    pub fn import_workspace(&mut self, json: &str) -> Result<Workspace, String> {
        let mut workspace: Workspace = serde_json::from_str(json)
            .map_err(|e| format!("Failed to parse workspace: {}", e))?;

        // Generate new ID to avoid conflicts
        workspace.id = self.generate_id("ws");
        workspace.position = self.workspaces.len();
        workspace.created_at = Self::current_timestamp();
        workspace.last_accessed = Self::current_timestamp();

        let ws_clone = workspace.clone();
        self.workspaces.insert(workspace.id.clone(), workspace);
        self.update_stats();

        Ok(ws_clone)
    }
}

impl Default for BrowserWorkspacesService {
    fn default() -> Self {
        Self::new()
    }
}
