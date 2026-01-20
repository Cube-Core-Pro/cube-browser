// CUBE Nexum - Vertical Tabs Service
// Edge/Arc style vertical tab management with tree view and customization

use std::collections::HashMap;
use std::sync::RwLock;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// ==================== Types ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerticalTab {
    pub id: String,
    pub title: String,
    pub url: String,
    pub favicon_url: Option<String>,
    pub parent_id: Option<String>,
    pub children_ids: Vec<String>,
    pub depth: u32,
    pub is_expanded: bool,
    pub is_pinned: bool,
    pub is_muted: bool,
    pub is_playing_audio: bool,
    pub is_loading: bool,
    pub is_hibernated: bool,
    pub workspace_id: Option<String>,
    pub color_tag: Option<String>,
    pub custom_title: Option<String>,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub last_accessed: DateTime<Utc>,
    pub access_count: u32,
    pub memory_usage_mb: f32,
    pub cpu_usage_percent: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerticalTabSettings {
    pub enabled: bool,
    pub position: TabBarPosition,
    pub width: u32,
    pub collapsed_width: u32,
    pub is_collapsed: bool,
    pub auto_collapse: bool,
    pub auto_collapse_delay_ms: u32,
    pub show_on_hover: bool,
    pub tree_view_enabled: bool,
    pub indent_size: u32,
    pub max_depth: u32,
    pub show_close_button: CloseButtonVisibility,
    pub show_favicon: bool,
    pub show_title: bool,
    pub show_url_preview: bool,
    pub show_audio_indicator: bool,
    pub show_loading_indicator: bool,
    pub show_memory_usage: bool,
    pub show_tab_count: bool,
    pub compact_mode: bool,
    pub tab_height: u32,
    pub tab_spacing: u32,
    pub group_by: GroupBy,
    pub sort_by: SortBy,
    pub auto_group_by_domain: bool,
    pub auto_suspend_tabs: bool,
    pub suspend_after_minutes: u32,
    pub pin_behavior: PinBehavior,
    pub new_tab_position: NewTabPosition,
    pub close_behavior: CloseBehavior,
    pub drag_behavior: DragBehavior,
    pub scroll_behavior: ScrollBehavior,
    pub keyboard_shortcuts: VerticalTabShortcuts,
    pub theme: VerticalTabTheme,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TabBarPosition {
    Left,
    Right,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CloseButtonVisibility {
    Always,
    OnHover,
    Never,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum GroupBy {
    None,
    Domain,
    Workspace,
    ColorTag,
    CreatedDate,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SortBy {
    Default,
    Title,
    Url,
    LastAccessed,
    Created,
    MemoryUsage,
    AccessCount,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PinBehavior {
    TopOfList,
    TopOfWorkspace,
    Separate,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum NewTabPosition {
    End,
    AfterActive,
    AsChild,
    AtTop,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CloseBehavior {
    SelectPrevious,
    SelectNext,
    SelectParent,
    SelectLastActive,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DragBehavior {
    Reorder,
    CreateTree,
    Both,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ScrollBehavior {
    Smooth,
    Instant,
    Natural,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerticalTabShortcuts {
    pub toggle_sidebar: String,
    pub collapse_sidebar: String,
    pub next_tab: String,
    pub prev_tab: String,
    pub close_tab: String,
    pub new_tab: String,
    pub duplicate_tab: String,
    pub pin_tab: String,
    pub mute_tab: String,
    pub hibernate_tab: String,
    pub expand_tree: String,
    pub collapse_tree: String,
    pub move_up: String,
    pub move_down: String,
    pub move_to_parent: String,
    pub make_child: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerticalTabTheme {
    pub background: String,
    pub tab_background: String,
    pub tab_background_hover: String,
    pub tab_background_active: String,
    pub tab_text: String,
    pub tab_text_active: String,
    pub separator_color: String,
    pub scroll_thumb_color: String,
    pub badge_background: String,
    pub badge_text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TabTreeNode {
    pub tab: VerticalTab,
    pub children: Vec<TabTreeNode>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TabGroup {
    pub id: String,
    pub name: String,
    pub color: String,
    pub tab_ids: Vec<String>,
    pub is_expanded: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerticalTabStats {
    pub total_tabs: u32,
    pub pinned_tabs: u32,
    pub hibernated_tabs: u32,
    pub playing_audio: u32,
    pub loading: u32,
    pub total_memory_mb: f32,
    pub avg_memory_per_tab_mb: f32,
    pub tabs_by_depth: HashMap<u32, u32>,
    pub tabs_by_workspace: HashMap<String, u32>,
    pub most_accessed_tabs: Vec<(String, u32)>,
    pub memory_saved_by_hibernation_mb: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TabSearchResult {
    pub tab: VerticalTab,
    pub match_score: f32,
    pub matched_field: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TabUpdate {
    pub title: Option<String>,
    pub custom_title: Option<String>,
    pub color_tag: Option<String>,
    pub notes: Option<String>,
    pub is_pinned: Option<bool>,
    pub is_muted: Option<bool>,
    pub is_hibernated: Option<bool>,
    pub workspace_id: Option<String>,
    pub parent_id: Option<String>,
}

// ==================== Service Implementation ====================

pub struct BrowserVerticalTabsService {
    tabs: RwLock<HashMap<String, VerticalTab>>,
    tab_order: RwLock<Vec<String>>,
    groups: RwLock<HashMap<String, TabGroup>>,
    settings: RwLock<VerticalTabSettings>,
    active_tab_id: RwLock<Option<String>>,
}

impl BrowserVerticalTabsService {
    pub fn new() -> Self {
        Self {
            tabs: RwLock::new(HashMap::new()),
            tab_order: RwLock::new(Vec::new()),
            groups: RwLock::new(HashMap::new()),
            settings: RwLock::new(Self::default_settings()),
            active_tab_id: RwLock::new(None),
        }
    }

    fn default_settings() -> VerticalTabSettings {
        VerticalTabSettings {
            enabled: true,
            position: TabBarPosition::Left,
            width: 280,
            collapsed_width: 48,
            is_collapsed: false,
            auto_collapse: false,
            auto_collapse_delay_ms: 1000,
            show_on_hover: true,
            tree_view_enabled: true,
            indent_size: 16,
            max_depth: 5,
            show_close_button: CloseButtonVisibility::OnHover,
            show_favicon: true,
            show_title: true,
            show_url_preview: true,
            show_audio_indicator: true,
            show_loading_indicator: true,
            show_memory_usage: false,
            show_tab_count: true,
            compact_mode: false,
            tab_height: 36,
            tab_spacing: 2,
            group_by: GroupBy::None,
            sort_by: SortBy::Default,
            auto_group_by_domain: false,
            auto_suspend_tabs: true,
            suspend_after_minutes: 30,
            pin_behavior: PinBehavior::TopOfList,
            new_tab_position: NewTabPosition::End,
            close_behavior: CloseBehavior::SelectPrevious,
            drag_behavior: DragBehavior::Both,
            scroll_behavior: ScrollBehavior::Smooth,
            keyboard_shortcuts: VerticalTabShortcuts {
                toggle_sidebar: "Alt+S".to_string(),
                collapse_sidebar: "Alt+C".to_string(),
                next_tab: "Ctrl+Tab".to_string(),
                prev_tab: "Ctrl+Shift+Tab".to_string(),
                close_tab: "Ctrl+W".to_string(),
                new_tab: "Ctrl+T".to_string(),
                duplicate_tab: "Ctrl+Shift+D".to_string(),
                pin_tab: "Ctrl+Shift+P".to_string(),
                mute_tab: "Ctrl+M".to_string(),
                hibernate_tab: "Ctrl+H".to_string(),
                expand_tree: "Ctrl+Right".to_string(),
                collapse_tree: "Ctrl+Left".to_string(),
                move_up: "Ctrl+Shift+Up".to_string(),
                move_down: "Ctrl+Shift+Down".to_string(),
                move_to_parent: "Ctrl+Shift+Left".to_string(),
                make_child: "Ctrl+Shift+Right".to_string(),
            },
            theme: VerticalTabTheme {
                background: "#1a1a2e".to_string(),
                tab_background: "transparent".to_string(),
                tab_background_hover: "#2a2a4a".to_string(),
                tab_background_active: "#3a3a5a".to_string(),
                tab_text: "#94a3b8".to_string(),
                tab_text_active: "#e2e8f0".to_string(),
                separator_color: "#334155".to_string(),
                scroll_thumb_color: "#475569".to_string(),
                badge_background: "#8b5cf6".to_string(),
                badge_text: "#ffffff".to_string(),
            },
        }
    }

    // ==================== Settings ====================

    pub fn get_settings(&self) -> VerticalTabSettings {
        self.settings.read().unwrap().clone()
    }

    pub fn update_settings(&self, new_settings: VerticalTabSettings) {
        let mut settings = self.settings.write().unwrap();
        *settings = new_settings;
    }

    pub fn toggle_sidebar(&self) -> bool {
        let mut settings = self.settings.write().unwrap();
        settings.is_collapsed = !settings.is_collapsed;
        settings.is_collapsed
    }

    pub fn set_width(&self, width: u32) {
        let mut settings = self.settings.write().unwrap();
        settings.width = width;
    }

    pub fn set_position(&self, position: TabBarPosition) {
        let mut settings = self.settings.write().unwrap();
        settings.position = position;
    }

    // ==================== Tab CRUD ====================

    pub fn create_tab(&self, url: String, title: String, parent_id: Option<String>) -> Result<VerticalTab, String> {
        let now = Utc::now();
        let settings = self.settings.read().unwrap();
        
        let depth = if let Some(ref parent) = parent_id {
            let tabs = self.tabs.read().unwrap();
            tabs.get(parent).map(|p| p.depth + 1).unwrap_or(0)
        } else {
            0
        };

        if depth > settings.max_depth {
            return Err(format!("Maximum tree depth ({}) exceeded", settings.max_depth));
        }

        let tab = VerticalTab {
            id: Uuid::new_v4().to_string(),
            title,
            url,
            favicon_url: None,
            parent_id: parent_id.clone(),
            children_ids: Vec::new(),
            depth,
            is_expanded: true,
            is_pinned: false,
            is_muted: false,
            is_playing_audio: false,
            is_loading: true,
            is_hibernated: false,
            workspace_id: None,
            color_tag: None,
            custom_title: None,
            notes: None,
            created_at: now,
            last_accessed: now,
            access_count: 0,
            memory_usage_mb: 0.0,
            cpu_usage_percent: 0.0,
        };

        let tab_id = tab.id.clone();
        let tab_clone = tab.clone();

        // Add to parent's children if has parent
        if let Some(ref parent) = parent_id {
            let mut tabs = self.tabs.write().unwrap();
            if let Some(parent_tab) = tabs.get_mut(parent) {
                parent_tab.children_ids.push(tab_id.clone());
            }
            tabs.insert(tab_id.clone(), tab);
        } else {
            self.tabs.write().unwrap().insert(tab_id.clone(), tab);
        }

        // Add to order
        let mut order = self.tab_order.write().unwrap();
        match settings.new_tab_position {
            NewTabPosition::End => order.push(tab_id),
            NewTabPosition::AtTop => order.insert(0, tab_id),
            NewTabPosition::AfterActive => {
                let active = self.active_tab_id.read().unwrap();
                if let Some(active_id) = active.as_ref() {
                    if let Some(pos) = order.iter().position(|id| id == active_id) {
                        order.insert(pos + 1, tab_id);
                    } else {
                        order.push(tab_id);
                    }
                } else {
                    order.push(tab_id);
                }
            }
            NewTabPosition::AsChild => {
                // Already handled above with parent_id
                if parent_id.is_none() {
                    order.push(tab_id);
                }
            }
        }

        Ok(tab_clone)
    }

    pub fn get_tab(&self, tab_id: &str) -> Option<VerticalTab> {
        self.tabs.read().unwrap().get(tab_id).cloned()
    }

    pub fn get_all_tabs(&self) -> Vec<VerticalTab> {
        let tabs = self.tabs.read().unwrap();
        let order = self.tab_order.read().unwrap();
        
        order.iter()
            .filter_map(|id| tabs.get(id).cloned())
            .collect()
    }

    pub fn get_visible_tabs(&self) -> Vec<VerticalTab> {
        let tabs = self.tabs.read().unwrap();
        let settings = self.settings.read().unwrap();

        if !settings.tree_view_enabled {
            return tabs.values().cloned().collect();
        }

        // Build tree and return visible tabs (non-collapsed parents' children)
        let mut visible = Vec::new();
        let root_tabs: Vec<_> = tabs.values()
            .filter(|t| t.parent_id.is_none())
            .collect();

        for tab in root_tabs {
            self.collect_visible_tabs(tab, &tabs, &mut visible);
        }

        visible
    }

    fn collect_visible_tabs(&self, tab: &VerticalTab, tabs: &HashMap<String, VerticalTab>, result: &mut Vec<VerticalTab>) {
        result.push(tab.clone());
        
        if tab.is_expanded {
            for child_id in &tab.children_ids {
                if let Some(child) = tabs.get(child_id) {
                    self.collect_visible_tabs(child, tabs, result);
                }
            }
        }
    }

    pub fn update_tab(&self, tab_id: &str, updates: TabUpdate) -> Result<VerticalTab, String> {
        let mut tabs = self.tabs.write().unwrap();
        let tab = tabs.get_mut(tab_id)
            .ok_or_else(|| "Tab not found".to_string())?;

        if let Some(title) = updates.title {
            tab.title = title;
        }
        if let Some(custom_title) = updates.custom_title {
            tab.custom_title = Some(custom_title);
        }
        if let Some(color_tag) = updates.color_tag {
            tab.color_tag = Some(color_tag);
        }
        if let Some(notes) = updates.notes {
            tab.notes = Some(notes);
        }
        if let Some(pinned) = updates.is_pinned {
            tab.is_pinned = pinned;
        }
        if let Some(muted) = updates.is_muted {
            tab.is_muted = muted;
        }
        if let Some(hibernated) = updates.is_hibernated {
            tab.is_hibernated = hibernated;
        }
        if let Some(workspace_id) = updates.workspace_id {
            tab.workspace_id = Some(workspace_id);
        }

        Ok(tab.clone())
    }

    pub fn delete_tab(&self, tab_id: &str, close_children: bool) -> Result<Vec<String>, String> {
        let mut closed_ids = Vec::new();
        
        // Get children first
        let children: Vec<String> = {
            let tabs = self.tabs.read().unwrap();
            tabs.get(tab_id)
                .map(|t| t.children_ids.clone())
                .unwrap_or_default()
        };

        // Close children if requested
        if close_children {
            for child_id in children {
                if let Ok(mut ids) = self.delete_tab(&child_id, true) {
                    closed_ids.append(&mut ids);
                }
            }
        } else {
            // Move children to parent level
            let parent_id = {
                let tabs = self.tabs.read().unwrap();
                tabs.get(tab_id).and_then(|t| t.parent_id.clone())
            };

            let mut tabs = self.tabs.write().unwrap();
            for child_id in &children {
                if let Some(child) = tabs.get_mut(child_id) {
                    child.parent_id = parent_id.clone();
                    child.depth = child.depth.saturating_sub(1);
                }
            }
        }

        // Remove from parent's children
        {
            let parent_id_opt = {
                let tabs_read = self.tabs.read().unwrap();
                tabs_read.get(tab_id).and_then(|tab| tab.parent_id.clone())
            };
            if let Some(parent_id) = parent_id_opt {
                let mut tabs = self.tabs.write().unwrap();
                if let Some(parent) = tabs.get_mut(&parent_id) {
                    parent.children_ids.retain(|id| id != tab_id);
                }
            }
        }

        // Remove the tab
        self.tabs.write().unwrap().remove(tab_id);
        self.tab_order.write().unwrap().retain(|id| id != tab_id);
        closed_ids.push(tab_id.to_string());

        // Update active tab if needed
        {
            let active = self.active_tab_id.read().unwrap();
            if active.as_ref() == Some(&tab_id.to_string()) {
                drop(active);
                self.select_adjacent_tab(tab_id);
            }
        }

        Ok(closed_ids)
    }

    fn select_adjacent_tab(&self, closed_tab_id: &str) {
        let settings = self.settings.read().unwrap();
        let order = self.tab_order.read().unwrap();
        
        if let Some(pos) = order.iter().position(|id| id == closed_tab_id) {
            let new_active: Option<String> = match settings.close_behavior {
                CloseBehavior::SelectPrevious => {
                    if pos > 0 { order.get(pos - 1).cloned() } else { order.get(1).cloned() }
                }
                CloseBehavior::SelectNext => {
                    order.get(pos + 1).or_else(|| order.get(pos.saturating_sub(1))).cloned()
                }
                CloseBehavior::SelectParent => {
                    let tabs = self.tabs.read().unwrap();
                    let parent_id = tabs.get(closed_tab_id)
                        .and_then(|t| t.parent_id.clone());
                    drop(tabs);
                    parent_id.or_else(|| order.get(pos.saturating_sub(1)).cloned())
                }
                CloseBehavior::SelectLastActive => {
                    // Would need history tracking, fall back to previous
                    if pos > 0 { order.get(pos - 1).cloned() } else { order.get(1).cloned() }
                }
            };

            if let Some(id) = new_active {
                drop(settings);
                drop(order);
                *self.active_tab_id.write().unwrap() = Some(id);
            }
        }
    }

    // ==================== Tab Actions ====================

    pub fn set_active_tab(&self, tab_id: &str) -> Result<(), String> {
        let mut tabs = self.tabs.write().unwrap();
        let tab = tabs.get_mut(tab_id)
            .ok_or_else(|| "Tab not found".to_string())?;
        
        tab.last_accessed = Utc::now();
        tab.access_count += 1;
        
        drop(tabs);
        *self.active_tab_id.write().unwrap() = Some(tab_id.to_string());
        Ok(())
    }

    pub fn get_active_tab(&self) -> Option<VerticalTab> {
        let active = self.active_tab_id.read().unwrap();
        active.as_ref().and_then(|id| self.get_tab(id))
    }

    pub fn toggle_pin(&self, tab_id: &str) -> Result<bool, String> {
        let mut tabs = self.tabs.write().unwrap();
        let tab = tabs.get_mut(tab_id)
            .ok_or_else(|| "Tab not found".to_string())?;
        
        tab.is_pinned = !tab.is_pinned;
        
        // Reorder if needed
        let pinned = tab.is_pinned;
        let settings = self.settings.read().unwrap();
        
        if settings.pin_behavior == PinBehavior::TopOfList {
            drop(tabs);
            let mut order = self.tab_order.write().unwrap();
            if let Some(pos) = order.iter().position(|id| id == tab_id) {
                let id = order.remove(pos);
                if pinned {
                    // Find first non-pinned tab
                    let tabs = self.tabs.read().unwrap();
                    let first_unpinned = order.iter()
                        .position(|id| tabs.get(id).map(|t| !t.is_pinned).unwrap_or(true))
                        .unwrap_or(0);
                    order.insert(first_unpinned, id);
                } else {
                    order.push(id);
                }
            }
        }

        Ok(pinned)
    }

    pub fn toggle_mute(&self, tab_id: &str) -> Result<bool, String> {
        let mut tabs = self.tabs.write().unwrap();
        let tab = tabs.get_mut(tab_id)
            .ok_or_else(|| "Tab not found".to_string())?;
        
        tab.is_muted = !tab.is_muted;
        Ok(tab.is_muted)
    }

    pub fn hibernate_tab(&self, tab_id: &str) -> Result<(), String> {
        let mut tabs = self.tabs.write().unwrap();
        let tab = tabs.get_mut(tab_id)
            .ok_or_else(|| "Tab not found".to_string())?;
        
        tab.is_hibernated = true;
        Ok(())
    }

    pub fn wake_tab(&self, tab_id: &str) -> Result<(), String> {
        let mut tabs = self.tabs.write().unwrap();
        let tab = tabs.get_mut(tab_id)
            .ok_or_else(|| "Tab not found".to_string())?;
        
        tab.is_hibernated = false;
        tab.is_loading = true;
        Ok(())
    }

    pub fn duplicate_tab(&self, tab_id: &str) -> Result<VerticalTab, String> {
        let tab = self.get_tab(tab_id)
            .ok_or_else(|| "Tab not found".to_string())?;
        
        self.create_tab(tab.url, tab.title, tab.parent_id)
    }

    // ==================== Tree Operations ====================

    pub fn toggle_expand(&self, tab_id: &str) -> Result<bool, String> {
        let mut tabs = self.tabs.write().unwrap();
        let tab = tabs.get_mut(tab_id)
            .ok_or_else(|| "Tab not found".to_string())?;
        
        tab.is_expanded = !tab.is_expanded;
        Ok(tab.is_expanded)
    }

    pub fn expand_all(&self) {
        let mut tabs = self.tabs.write().unwrap();
        for tab in tabs.values_mut() {
            tab.is_expanded = true;
        }
    }

    pub fn collapse_all(&self) {
        let mut tabs = self.tabs.write().unwrap();
        for tab in tabs.values_mut() {
            if !tab.children_ids.is_empty() {
                tab.is_expanded = false;
            }
        }
    }

    pub fn make_child_of(&self, tab_id: &str, parent_id: &str) -> Result<(), String> {
        if tab_id == parent_id {
            return Err("Cannot make tab a child of itself".to_string());
        }

        let mut tabs = self.tabs.write().unwrap();
        let settings = self.settings.read().unwrap();
        
        // Check depth
        let parent_depth = tabs.get(parent_id)
            .map(|t| t.depth)
            .ok_or_else(|| "Parent tab not found".to_string())?;
        
        if parent_depth + 1 > settings.max_depth {
            return Err("Maximum tree depth exceeded".to_string());
        }

        // Remove from current parent
        let old_parent = {
            let tab = tabs.get(tab_id)
                .ok_or_else(|| "Tab not found".to_string())?;
            tab.parent_id.clone()
        };

        if let Some(old_parent_id) = old_parent {
            if let Some(old_parent) = tabs.get_mut(&old_parent_id) {
                old_parent.children_ids.retain(|id| id != tab_id);
            }
        }

        // Add to new parent
        if let Some(parent) = tabs.get_mut(parent_id) {
            parent.children_ids.push(tab_id.to_string());
        }

        // Update tab
        if let Some(tab) = tabs.get_mut(tab_id) {
            tab.parent_id = Some(parent_id.to_string());
            tab.depth = parent_depth + 1;
        }

        // Update children depths recursively
        self.update_children_depth(tab_id, parent_depth + 1, &mut tabs);

        Ok(())
    }

    fn update_children_depth(&self, tab_id: &str, new_depth: u32, tabs: &mut HashMap<String, VerticalTab>) {
        if let Some(tab) = tabs.get(tab_id) {
            let children = tab.children_ids.clone();
            for child_id in children {
                if let Some(child) = tabs.get_mut(&child_id) {
                    child.depth = new_depth + 1;
                }
                self.update_children_depth(&child_id, new_depth + 1, tabs);
            }
        }
    }

    pub fn detach_from_parent(&self, tab_id: &str) -> Result<(), String> {
        let mut tabs = self.tabs.write().unwrap();
        
        let parent_id = {
            let tab = tabs.get(tab_id)
                .ok_or_else(|| "Tab not found".to_string())?;
            tab.parent_id.clone()
        };

        if let Some(parent_id) = parent_id {
            if let Some(parent) = tabs.get_mut(&parent_id) {
                parent.children_ids.retain(|id| id != tab_id);
            }
        }

        if let Some(tab) = tabs.get_mut(tab_id) {
            tab.parent_id = None;
            tab.depth = 0;
        }

        self.update_children_depth(tab_id, 0, &mut tabs);

        Ok(())
    }

    pub fn get_tree(&self) -> Vec<TabTreeNode> {
        let tabs = self.tabs.read().unwrap();
        let root_tabs: Vec<_> = tabs.values()
            .filter(|t| t.parent_id.is_none())
            .collect();

        root_tabs.iter()
            .map(|tab| self.build_tree_node(tab, &tabs))
            .collect()
    }

    fn build_tree_node(&self, tab: &VerticalTab, tabs: &HashMap<String, VerticalTab>) -> TabTreeNode {
        let children = tab.children_ids.iter()
            .filter_map(|id| tabs.get(id))
            .map(|child| self.build_tree_node(child, tabs))
            .collect();

        TabTreeNode {
            tab: tab.clone(),
            children,
        }
    }

    // ==================== Reordering ====================

    pub fn move_tab(&self, tab_id: &str, new_index: usize) -> Result<(), String> {
        let mut order = self.tab_order.write().unwrap();
        
        let current_index = order.iter()
            .position(|id| id == tab_id)
            .ok_or_else(|| "Tab not found".to_string())?;

        let id = order.remove(current_index);
        let new_index = new_index.min(order.len());
        order.insert(new_index, id);

        Ok(())
    }

    pub fn move_up(&self, tab_id: &str) -> Result<(), String> {
        let order = self.tab_order.read().unwrap();
        if let Some(pos) = order.iter().position(|id| id == tab_id) {
            if pos > 0 {
                drop(order);
                return self.move_tab(tab_id, pos - 1);
            }
        }
        Ok(())
    }

    pub fn move_down(&self, tab_id: &str) -> Result<(), String> {
        let order = self.tab_order.read().unwrap();
        if let Some(pos) = order.iter().position(|id| id == tab_id) {
            if pos < order.len() - 1 {
                drop(order);
                return self.move_tab(tab_id, pos + 1);
            }
        }
        Ok(())
    }

    // ==================== Search & Filter ====================

    pub fn search(&self, query: &str) -> Vec<TabSearchResult> {
        let query_lower = query.to_lowercase();
        let tabs = self.tabs.read().unwrap();

        tabs.values()
            .filter_map(|tab| {
                let mut score = 0.0f32;
                let mut matched_field = String::new();

                // Match custom title first
                if let Some(custom) = &tab.custom_title {
                    if custom.to_lowercase().contains(&query_lower) {
                        score = 4.0;
                        matched_field = "custom_title".to_string();
                    }
                }

                // Match title
                if score == 0.0 && tab.title.to_lowercase().contains(&query_lower) {
                    score = 3.0;
                    matched_field = "title".to_string();
                }

                // Match URL
                if score == 0.0 && tab.url.to_lowercase().contains(&query_lower) {
                    score = 2.0;
                    matched_field = "url".to_string();
                }

                // Match notes
                if score == 0.0 {
                    if let Some(notes) = &tab.notes {
                        if notes.to_lowercase().contains(&query_lower) {
                            score = 1.0;
                            matched_field = "notes".to_string();
                        }
                    }
                }

                if score > 0.0 {
                    Some(TabSearchResult {
                        tab: tab.clone(),
                        match_score: score,
                        matched_field,
                    })
                } else {
                    None
                }
            })
            .collect()
    }

    pub fn filter_by_workspace(&self, workspace_id: &str) -> Vec<VerticalTab> {
        self.tabs.read().unwrap()
            .values()
            .filter(|t| t.workspace_id.as_ref() == Some(&workspace_id.to_string()))
            .cloned()
            .collect()
    }

    pub fn filter_by_domain(&self, domain: &str) -> Vec<VerticalTab> {
        let domain_lower = domain.to_lowercase();
        self.tabs.read().unwrap()
            .values()
            .filter(|t| t.url.to_lowercase().contains(&domain_lower))
            .cloned()
            .collect()
    }

    pub fn get_pinned_tabs(&self) -> Vec<VerticalTab> {
        self.tabs.read().unwrap()
            .values()
            .filter(|t| t.is_pinned)
            .cloned()
            .collect()
    }

    pub fn get_hibernated_tabs(&self) -> Vec<VerticalTab> {
        self.tabs.read().unwrap()
            .values()
            .filter(|t| t.is_hibernated)
            .cloned()
            .collect()
    }

    pub fn get_audio_playing_tabs(&self) -> Vec<VerticalTab> {
        self.tabs.read().unwrap()
            .values()
            .filter(|t| t.is_playing_audio)
            .cloned()
            .collect()
    }

    // ==================== Statistics ====================

    pub fn get_stats(&self) -> VerticalTabStats {
        let tabs = self.tabs.read().unwrap();

        let total = tabs.len() as u32;
        let pinned = tabs.values().filter(|t| t.is_pinned).count() as u32;
        let hibernated = tabs.values().filter(|t| t.is_hibernated).count() as u32;
        let playing_audio = tabs.values().filter(|t| t.is_playing_audio).count() as u32;
        let loading = tabs.values().filter(|t| t.is_loading).count() as u32;

        let total_memory: f32 = tabs.values().map(|t| t.memory_usage_mb).sum();
        let avg_memory = if total > 0 { total_memory / total as f32 } else { 0.0 };

        let mut tabs_by_depth: HashMap<u32, u32> = HashMap::new();
        for tab in tabs.values() {
            *tabs_by_depth.entry(tab.depth).or_insert(0) += 1;
        }

        let mut tabs_by_workspace: HashMap<String, u32> = HashMap::new();
        for tab in tabs.values() {
            if let Some(ws) = &tab.workspace_id {
                *tabs_by_workspace.entry(ws.clone()).or_insert(0) += 1;
            }
        }

        let mut access_counts: Vec<_> = tabs.values()
            .map(|t| (t.title.clone(), t.access_count))
            .collect();
        access_counts.sort_by(|a, b| b.1.cmp(&a.1));
        access_counts.truncate(10);

        let memory_saved: f32 = tabs.values()
            .filter(|t| t.is_hibernated)
            .map(|t| t.memory_usage_mb)
            .sum();

        VerticalTabStats {
            total_tabs: total,
            pinned_tabs: pinned,
            hibernated_tabs: hibernated,
            playing_audio,
            loading,
            total_memory_mb: total_memory,
            avg_memory_per_tab_mb: avg_memory,
            tabs_by_depth,
            tabs_by_workspace,
            most_accessed_tabs: access_counts,
            memory_saved_by_hibernation_mb: memory_saved,
        }
    }

    // ==================== Bulk Operations ====================

    pub fn close_all_but_pinned(&self) -> Vec<String> {
        let to_close: Vec<_> = self.tabs.read().unwrap()
            .values()
            .filter(|t| !t.is_pinned)
            .map(|t| t.id.clone())
            .collect();

        for id in &to_close {
            let _ = self.delete_tab(id, true);
        }

        to_close
    }

    pub fn hibernate_all_but_active(&self) -> u32 {
        let active = self.active_tab_id.read().unwrap().clone();
        let mut count = 0;

        let mut tabs = self.tabs.write().unwrap();
        for tab in tabs.values_mut() {
            if Some(&tab.id) != active.as_ref() && !tab.is_hibernated {
                tab.is_hibernated = true;
                count += 1;
            }
        }

        count
    }

    pub fn close_duplicates(&self) -> Vec<String> {
        let tabs = self.tabs.read().unwrap();
        let mut url_to_id: HashMap<String, String> = HashMap::new();
        let mut duplicates = Vec::new();

        for tab in tabs.values() {
            if let Some(_existing_id) = url_to_id.get(&tab.url) {
                duplicates.push(tab.id.clone());
            } else {
                url_to_id.insert(tab.url.clone(), tab.id.clone());
            }
        }

        drop(tabs);

        for id in &duplicates {
            let _ = self.delete_tab(id, false);
        }

        duplicates
    }
}

impl Default for BrowserVerticalTabsService {
    fn default() -> Self {
        Self::new()
    }
}
