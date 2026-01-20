// browser_tab_groups.rs
// CUBE Elite v6 - Advanced Tab Management System
// Superior to Chrome/Opera/Vivaldi with AI-powered auto-grouping

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use uuid::Uuid;

/// Tab group color options - comprehensive palette
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum GroupColor {
    Grey,
    Blue,
    Red,
    Yellow,
    Green,
    Pink,
    Purple,
    Cyan,
    Orange,
    Teal,
    Indigo,
    Amber,
    Lime,
    Rose,
    Violet,
    Custom(String),
}

impl Default for GroupColor {
    fn default() -> Self {
        GroupColor::Blue
    }
}

impl GroupColor {
    pub fn to_hex(&self) -> String {
        match self {
            GroupColor::Grey => "#6b7280".to_string(),
            GroupColor::Blue => "#3b82f6".to_string(),
            GroupColor::Red => "#ef4444".to_string(),
            GroupColor::Yellow => "#eab308".to_string(),
            GroupColor::Green => "#22c55e".to_string(),
            GroupColor::Pink => "#ec4899".to_string(),
            GroupColor::Purple => "#a855f7".to_string(),
            GroupColor::Cyan => "#06b6d4".to_string(),
            GroupColor::Orange => "#f97316".to_string(),
            GroupColor::Teal => "#14b8a6".to_string(),
            GroupColor::Indigo => "#6366f1".to_string(),
            GroupColor::Amber => "#f59e0b".to_string(),
            GroupColor::Lime => "#84cc16".to_string(),
            GroupColor::Rose => "#f43f5e".to_string(),
            GroupColor::Violet => "#8b5cf6".to_string(),
            GroupColor::Custom(hex) => hex.clone(),
        }
    }

    pub fn from_name(name: &str) -> Self {
        match name.to_lowercase().as_str() {
            "grey" | "gray" => GroupColor::Grey,
            "blue" => GroupColor::Blue,
            "red" => GroupColor::Red,
            "yellow" => GroupColor::Yellow,
            "green" => GroupColor::Green,
            "pink" => GroupColor::Pink,
            "purple" => GroupColor::Purple,
            "cyan" => GroupColor::Cyan,
            "orange" => GroupColor::Orange,
            "teal" => GroupColor::Teal,
            "indigo" => GroupColor::Indigo,
            "amber" => GroupColor::Amber,
            "lime" => GroupColor::Lime,
            "rose" => GroupColor::Rose,
            "violet" => GroupColor::Violet,
            _ => {
                if name.starts_with('#') {
                    GroupColor::Custom(name.to_string())
                } else {
                    GroupColor::Blue
                }
            }
        }
    }
}

/// Tab stack - Vivaldi-style tab stacking
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TabStack {
    pub id: String,
    pub tab_ids: Vec<String>,
    pub active_tab_index: usize,
    pub created_at: i64,
}

impl TabStack {
    pub fn new(tab_ids: Vec<String>) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            tab_ids,
            active_tab_index: 0,
            created_at: chrono::Utc::now().timestamp_millis(),
        }
    }

    pub fn add_tab(&mut self, tab_id: String) {
        if !self.tab_ids.contains(&tab_id) {
            self.tab_ids.push(tab_id);
        }
    }

    pub fn remove_tab(&mut self, tab_id: &str) -> bool {
        if let Some(pos) = self.tab_ids.iter().position(|id| id == tab_id) {
            self.tab_ids.remove(pos);
            if self.active_tab_index >= self.tab_ids.len() && !self.tab_ids.is_empty() {
                self.active_tab_index = self.tab_ids.len() - 1;
            }
            true
        } else {
            false
        }
    }

    pub fn get_active_tab(&self) -> Option<&String> {
        self.tab_ids.get(self.active_tab_index)
    }

    pub fn set_active_tab(&mut self, tab_id: &str) -> bool {
        if let Some(pos) = self.tab_ids.iter().position(|id| id == tab_id) {
            self.active_tab_index = pos;
            true
        } else {
            false
        }
    }
}

/// Tab group with all metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TabGroup {
    pub id: String,
    pub name: String,
    pub color: GroupColor,
    pub tab_ids: Vec<String>,
    pub collapsed: bool,
    pub pinned: bool,
    pub created_at: i64,
    pub updated_at: i64,
    pub auto_generated: bool,
    pub category: Option<String>,
    pub icon: Option<String>,
    pub stacks: Vec<TabStack>,
}

impl TabGroup {
    pub fn new(name: String, color: GroupColor) -> Self {
        let now = chrono::Utc::now().timestamp_millis();
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            color,
            tab_ids: Vec::new(),
            collapsed: false,
            pinned: false,
            created_at: now,
            updated_at: now,
            auto_generated: false,
            category: None,
            icon: None,
            stacks: Vec::new(),
        }
    }

    pub fn add_tab(&mut self, tab_id: String) {
        if !self.tab_ids.contains(&tab_id) {
            self.tab_ids.push(tab_id);
            self.updated_at = chrono::Utc::now().timestamp_millis();
        }
    }

    pub fn remove_tab(&mut self, tab_id: &str) -> bool {
        if let Some(pos) = self.tab_ids.iter().position(|id| id == tab_id) {
            self.tab_ids.remove(pos);
            self.updated_at = chrono::Utc::now().timestamp_millis();
            
            // Also remove from any stacks
            for stack in &mut self.stacks {
                stack.remove_tab(tab_id);
            }
            
            // Clean up empty stacks
            self.stacks.retain(|s| !s.tab_ids.is_empty());
            
            true
        } else {
            false
        }
    }

    pub fn create_stack(&mut self, tab_ids: Vec<String>) -> String {
        let stack = TabStack::new(tab_ids);
        let stack_id = stack.id.clone();
        self.stacks.push(stack);
        self.updated_at = chrono::Utc::now().timestamp_millis();
        stack_id
    }

    pub fn get_stack_mut(&mut self, stack_id: &str) -> Option<&mut TabStack> {
        self.stacks.iter_mut().find(|s| s.id == stack_id)
    }
}

/// Tab metadata for grouping decisions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TabMetadata {
    pub id: String,
    pub url: String,
    pub title: String,
    pub domain: String,
    pub favicon: Option<String>,
    pub group_id: Option<String>,
    pub stack_id: Option<String>,
    pub position: usize,
    pub pinned: bool,
    pub muted: bool,
    pub playing_audio: bool,
    pub created_at: i64,
    pub last_accessed: i64,
}

impl TabMetadata {
    pub fn new(id: String, url: String, title: String) -> Self {
        let domain = Self::extract_domain(&url);
        let now = chrono::Utc::now().timestamp_millis();
        Self {
            id,
            url,
            title,
            domain,
            favicon: None,
            group_id: None,
            stack_id: None,
            position: 0,
            pinned: false,
            muted: false,
            playing_audio: false,
            created_at: now,
            last_accessed: now,
        }
    }

    fn extract_domain(url: &str) -> String {
        url.trim_start_matches("http://")
            .trim_start_matches("https://")
            .split('/')
            .next()
            .unwrap_or("")
            .to_string()
    }
}

/// AI-suggested grouping
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GroupSuggestion {
    pub id: String,
    pub name: String,
    pub color: GroupColor,
    pub tab_ids: Vec<String>,
    pub confidence: f32,
    pub reason: String,
    pub category: String,
}

/// Tab grouping rules for auto-grouping
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GroupingRule {
    pub id: String,
    pub name: String,
    pub enabled: bool,
    pub rule_type: GroupingRuleType,
    pub pattern: String,
    pub group_name: String,
    pub group_color: GroupColor,
    pub priority: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum GroupingRuleType {
    Domain,
    UrlPattern,
    TitlePattern,
    Category,
}

/// Tab Groups configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TabGroupsConfig {
    pub enabled: bool,
    pub auto_group_enabled: bool,
    pub auto_group_by_domain: bool,
    pub auto_collapse_inactive: bool,
    pub show_group_names: bool,
    pub show_tab_count: bool,
    pub sync_across_windows: bool,
    pub ai_suggestions_enabled: bool,
    pub vertical_tabs_enabled: bool,
    pub stacking_enabled: bool,
    pub grouping_rules: Vec<GroupingRule>,
}

impl Default for TabGroupsConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            auto_group_enabled: true,
            auto_group_by_domain: true,
            auto_collapse_inactive: false,
            show_group_names: true,
            show_tab_count: true,
            sync_across_windows: true,
            ai_suggestions_enabled: true,
            vertical_tabs_enabled: false,
            stacking_enabled: true,
            grouping_rules: Self::default_rules(),
        }
    }
}

impl TabGroupsConfig {
    fn default_rules() -> Vec<GroupingRule> {
        vec![
            GroupingRule {
                id: Uuid::new_v4().to_string(),
                name: "Social Media".to_string(),
                enabled: true,
                rule_type: GroupingRuleType::Domain,
                pattern: "facebook.com|twitter.com|instagram.com|linkedin.com|tiktok.com".to_string(),
                group_name: "Social".to_string(),
                group_color: GroupColor::Pink,
                priority: 10,
            },
            GroupingRule {
                id: Uuid::new_v4().to_string(),
                name: "Work Apps".to_string(),
                enabled: true,
                rule_type: GroupingRuleType::Domain,
                pattern: "slack.com|notion.so|asana.com|trello.com|monday.com|jira.atlassian.com".to_string(),
                group_name: "Work".to_string(),
                group_color: GroupColor::Blue,
                priority: 10,
            },
            GroupingRule {
                id: Uuid::new_v4().to_string(),
                name: "Development".to_string(),
                enabled: true,
                rule_type: GroupingRuleType::Domain,
                pattern: "github.com|gitlab.com|stackoverflow.com|npmjs.com|crates.io".to_string(),
                group_name: "Dev".to_string(),
                group_color: GroupColor::Green,
                priority: 10,
            },
            GroupingRule {
                id: Uuid::new_v4().to_string(),
                name: "Entertainment".to_string(),
                enabled: true,
                rule_type: GroupingRuleType::Domain,
                pattern: "youtube.com|netflix.com|spotify.com|twitch.tv|reddit.com".to_string(),
                group_name: "Entertainment".to_string(),
                group_color: GroupColor::Red,
                priority: 10,
            },
            GroupingRule {
                id: Uuid::new_v4().to_string(),
                name: "Shopping".to_string(),
                enabled: true,
                rule_type: GroupingRuleType::Domain,
                pattern: "amazon.com|ebay.com|etsy.com|walmart.com|aliexpress.com".to_string(),
                group_name: "Shopping".to_string(),
                group_color: GroupColor::Orange,
                priority: 10,
            },
            GroupingRule {
                id: Uuid::new_v4().to_string(),
                name: "News".to_string(),
                enabled: true,
                rule_type: GroupingRuleType::Domain,
                pattern: "news.google.com|cnn.com|bbc.com|reuters.com|nytimes.com".to_string(),
                group_name: "News".to_string(),
                group_color: GroupColor::Grey,
                priority: 10,
            },
        ]
    }
}

/// Domain category mapping for AI suggestions
#[derive(Debug, Clone)]
pub struct DomainCategory {
    pub domain_patterns: Vec<&'static str>,
    pub category: &'static str,
    pub suggested_color: GroupColor,
    pub icon: &'static str,
}

/// CUBE Tab Groups Manager - Main service
pub struct CubeTabGroups {
    groups: HashMap<String, TabGroup>,
    tabs: HashMap<String, TabMetadata>,
    ungrouped_tabs: Vec<String>,
    config: TabGroupsConfig,
    domain_categories: Vec<DomainCategory>,
}

impl CubeTabGroups {
    pub fn new() -> Self {
        Self {
            groups: HashMap::new(),
            tabs: HashMap::new(),
            ungrouped_tabs: Vec::new(),
            config: TabGroupsConfig::default(),
            domain_categories: Self::init_domain_categories(),
        }
    }

    fn init_domain_categories() -> Vec<DomainCategory> {
        vec![
            DomainCategory {
                domain_patterns: vec!["google.com", "bing.com", "duckduckgo.com", "yahoo.com"],
                category: "Search",
                suggested_color: GroupColor::Blue,
                icon: "🔍",
            },
            DomainCategory {
                domain_patterns: vec!["github.com", "gitlab.com", "bitbucket.org", "stackoverflow.com", "npmjs.com", "crates.io", "pypi.org"],
                category: "Development",
                suggested_color: GroupColor::Green,
                icon: "💻",
            },
            DomainCategory {
                domain_patterns: vec!["facebook.com", "twitter.com", "instagram.com", "linkedin.com", "tiktok.com", "pinterest.com"],
                category: "Social",
                suggested_color: GroupColor::Pink,
                icon: "👥",
            },
            DomainCategory {
                domain_patterns: vec!["youtube.com", "netflix.com", "spotify.com", "twitch.tv", "hulu.com", "disneyplus.com"],
                category: "Entertainment",
                suggested_color: GroupColor::Red,
                icon: "🎬",
            },
            DomainCategory {
                domain_patterns: vec!["amazon.com", "ebay.com", "etsy.com", "walmart.com", "aliexpress.com", "shopify.com"],
                category: "Shopping",
                suggested_color: GroupColor::Orange,
                icon: "🛒",
            },
            DomainCategory {
                domain_patterns: vec!["gmail.com", "outlook.com", "mail.google.com", "protonmail.com"],
                category: "Email",
                suggested_color: GroupColor::Teal,
                icon: "📧",
            },
            DomainCategory {
                domain_patterns: vec!["docs.google.com", "notion.so", "evernote.com", "dropbox.com", "drive.google.com"],
                category: "Productivity",
                suggested_color: GroupColor::Indigo,
                icon: "📝",
            },
            DomainCategory {
                domain_patterns: vec!["slack.com", "discord.com", "teams.microsoft.com", "zoom.us"],
                category: "Communication",
                suggested_color: GroupColor::Purple,
                icon: "💬",
            },
            DomainCategory {
                domain_patterns: vec!["news.google.com", "cnn.com", "bbc.com", "reuters.com", "nytimes.com", "theguardian.com"],
                category: "News",
                suggested_color: GroupColor::Grey,
                icon: "📰",
            },
            DomainCategory {
                domain_patterns: vec!["chase.com", "bankofamerica.com", "paypal.com", "venmo.com", "mint.com"],
                category: "Finance",
                suggested_color: GroupColor::Amber,
                icon: "💰",
            },
        ]
    }

    // ============ Configuration Methods ============

    pub fn get_config(&self) -> TabGroupsConfig {
        self.config.clone()
    }

    pub fn set_config(&mut self, config: TabGroupsConfig) {
        self.config = config;
    }

    pub fn set_enabled(&mut self, enabled: bool) {
        self.config.enabled = enabled;
    }

    pub fn set_auto_group_enabled(&mut self, enabled: bool) {
        self.config.auto_group_enabled = enabled;
    }

    pub fn set_vertical_tabs(&mut self, enabled: bool) {
        self.config.vertical_tabs_enabled = enabled;
    }

    pub fn set_stacking_enabled(&mut self, enabled: bool) {
        self.config.stacking_enabled = enabled;
    }

    // ============ Group Management ============

    pub fn create_group(&mut self, name: String, color: GroupColor) -> TabGroup {
        let group = TabGroup::new(name, color);
        let result = group.clone();
        self.groups.insert(group.id.clone(), group);
        result
    }

    pub fn get_group(&self, group_id: &str) -> Option<&TabGroup> {
        self.groups.get(group_id)
    }

    pub fn get_group_mut(&mut self, group_id: &str) -> Option<&mut TabGroup> {
        self.groups.get_mut(group_id)
    }

    pub fn get_all_groups(&self) -> Vec<TabGroup> {
        self.groups.values().cloned().collect()
    }

    pub fn delete_group(&mut self, group_id: &str) -> bool {
        if let Some(group) = self.groups.remove(group_id) {
            // Move tabs back to ungrouped
            for tab_id in group.tab_ids {
                if let Some(tab) = self.tabs.get_mut(&tab_id) {
                    tab.group_id = None;
                    tab.stack_id = None;
                }
                self.ungrouped_tabs.push(tab_id);
            }
            true
        } else {
            false
        }
    }

    pub fn rename_group(&mut self, group_id: &str, new_name: String) -> bool {
        if let Some(group) = self.groups.get_mut(group_id) {
            group.name = new_name;
            group.updated_at = chrono::Utc::now().timestamp_millis();
            true
        } else {
            false
        }
    }

    pub fn set_group_color(&mut self, group_id: &str, color: GroupColor) -> bool {
        if let Some(group) = self.groups.get_mut(group_id) {
            group.color = color;
            group.updated_at = chrono::Utc::now().timestamp_millis();
            true
        } else {
            false
        }
    }

    pub fn toggle_group_collapsed(&mut self, group_id: &str) -> bool {
        if let Some(group) = self.groups.get_mut(group_id) {
            group.collapsed = !group.collapsed;
            group.updated_at = chrono::Utc::now().timestamp_millis();
            true
        } else {
            false
        }
    }

    pub fn pin_group(&mut self, group_id: &str, pinned: bool) -> bool {
        if let Some(group) = self.groups.get_mut(group_id) {
            group.pinned = pinned;
            group.updated_at = chrono::Utc::now().timestamp_millis();
            true
        } else {
            false
        }
    }

    // ============ Tab Management ============

    pub fn register_tab(&mut self, tab: TabMetadata) -> String {
        let tab_id = tab.id.clone();
        
        // Auto-group if enabled
        if self.config.auto_group_enabled {
            let group_id = self.find_or_create_group_for_tab(&tab);
            let mut tab = tab;
            tab.group_id = group_id.clone();
            
            if let Some(gid) = &group_id {
                if let Some(group) = self.groups.get_mut(gid) {
                    group.add_tab(tab_id.clone());
                }
            } else {
                self.ungrouped_tabs.push(tab_id.clone());
            }
            
            self.tabs.insert(tab_id.clone(), tab);
        } else {
            self.tabs.insert(tab_id.clone(), tab);
            self.ungrouped_tabs.push(tab_id.clone());
        }
        
        tab_id
    }

    pub fn unregister_tab(&mut self, tab_id: &str) -> bool {
        if let Some(tab) = self.tabs.remove(tab_id) {
            // Remove from group if any
            if let Some(group_id) = &tab.group_id {
                if let Some(group) = self.groups.get_mut(group_id) {
                    group.remove_tab(tab_id);
                }
            }
            
            // Remove from ungrouped
            self.ungrouped_tabs.retain(|id| id != tab_id);
            
            true
        } else {
            false
        }
    }

    pub fn get_tab(&self, tab_id: &str) -> Option<&TabMetadata> {
        self.tabs.get(tab_id)
    }

    pub fn update_tab(&mut self, tab_id: &str, url: Option<String>, title: Option<String>) -> bool {
        // First, check if tab exists and gather info we need
        let (old_group_id, should_regroup) = {
            let tab = match self.tabs.get(tab_id) {
                Some(t) => t,
                None => return false,
            };
            
            let should_regroup = if let Some(ref new_url) = url {
                let new_domain = TabMetadata::new("".to_string(), new_url.clone(), "".to_string()).domain;
                tab.domain != new_domain && self.config.auto_group_enabled
            } else {
                false
            };
            
            (tab.group_id.clone(), should_regroup)
        };

        // Update the tab's basic info
        if let Some(tab) = self.tabs.get_mut(tab_id) {
            if let Some(ref new_url) = url {
                let new_domain = TabMetadata::new("".to_string(), new_url.clone(), "".to_string()).domain;
                tab.url = new_url.clone();
                tab.domain = new_domain;
            }
            
            if let Some(new_title) = title {
                tab.title = new_title;
            }
            
            tab.last_accessed = chrono::Utc::now().timestamp_millis();
        }

        // Now handle regrouping if needed (tab borrow is released)
        if should_regroup {
            // Remove from current group
            if let Some(group_id) = &old_group_id {
                if let Some(group) = self.groups.get_mut(group_id) {
                    group.remove_tab(tab_id);
                }
            }
            
            // Find new group (need to clone tab data for this)
            let tab_clone = self.tabs.get(tab_id).cloned();
            if let Some(tab) = tab_clone {
                let new_group_id = self.find_or_create_group_for_tab(&tab);
                
                // Update tab's group_id
                if let Some(t) = self.tabs.get_mut(tab_id) {
                    t.group_id = new_group_id.clone();
                }
                
                // Add to new group
                if let Some(gid) = &new_group_id {
                    if let Some(group) = self.groups.get_mut(gid) {
                        group.add_tab(tab_id.to_string());
                    }
                }
            }
        }

        true
    }

    pub fn move_tab_to_group(&mut self, tab_id: &str, group_id: &str) -> bool {
        let tab = match self.tabs.get_mut(tab_id) {
            Some(t) => t,
            None => return false,
        };

        // Remove from current group
        if let Some(old_group_id) = tab.group_id.take() {
            if let Some(old_group) = self.groups.get_mut(&old_group_id) {
                old_group.remove_tab(tab_id);
            }
        }
        
        // Remove from ungrouped
        self.ungrouped_tabs.retain(|id| id != tab_id);

        // Add to new group
        if let Some(new_group) = self.groups.get_mut(group_id) {
            new_group.add_tab(tab_id.to_string());
            if let Some(tab) = self.tabs.get_mut(tab_id) {
                tab.group_id = Some(group_id.to_string());
            }
            true
        } else {
            false
        }
    }

    pub fn ungroup_tab(&mut self, tab_id: &str) -> bool {
        if let Some(tab) = self.tabs.get_mut(tab_id) {
            if let Some(group_id) = tab.group_id.take() {
                if let Some(group) = self.groups.get_mut(&group_id) {
                    group.remove_tab(tab_id);
                }
            }
            tab.stack_id = None;
            self.ungrouped_tabs.push(tab_id.to_string());
            true
        } else {
            false
        }
    }

    pub fn get_ungrouped_tabs(&self) -> Vec<&TabMetadata> {
        self.ungrouped_tabs
            .iter()
            .filter_map(|id| self.tabs.get(id))
            .collect()
    }

    // ============ Tab Stacking (Vivaldi-style) ============

    pub fn stack_tabs(&mut self, tab_ids: Vec<String>, group_id: &str) -> Option<String> {
        let group = self.groups.get_mut(group_id)?;
        
        // Verify all tabs are in this group
        for tab_id in &tab_ids {
            if !group.tab_ids.contains(tab_id) {
                return None;
            }
        }
        
        // Create stack
        let stack_id = group.create_stack(tab_ids.clone());
        
        // Update tab metadata
        for tab_id in &tab_ids {
            if let Some(tab) = self.tabs.get_mut(tab_id) {
                tab.stack_id = Some(stack_id.clone());
            }
        }
        
        Some(stack_id)
    }

    pub fn unstack_tabs(&mut self, stack_id: &str, group_id: &str) -> bool {
        let group = match self.groups.get_mut(group_id) {
            Some(g) => g,
            None => return false,
        };

        // Find and remove stack
        if let Some(pos) = group.stacks.iter().position(|s| s.id == stack_id) {
            let stack = group.stacks.remove(pos);
            
            // Update tab metadata
            for tab_id in &stack.tab_ids {
                if let Some(tab) = self.tabs.get_mut(tab_id) {
                    tab.stack_id = None;
                }
            }
            
            true
        } else {
            false
        }
    }

    pub fn add_tab_to_stack(&mut self, tab_id: &str, stack_id: &str, group_id: &str) -> bool {
        // First move tab to group if not already there
        if let Some(tab) = self.tabs.get(tab_id) {
            if tab.group_id.as_deref() != Some(group_id) {
                self.move_tab_to_group(tab_id, group_id);
            }
        }
        
        // Add to stack
        if let Some(group) = self.groups.get_mut(group_id) {
            if let Some(stack) = group.get_stack_mut(stack_id) {
                stack.add_tab(tab_id.to_string());
                if let Some(tab) = self.tabs.get_mut(tab_id) {
                    tab.stack_id = Some(stack_id.to_string());
                }
                return true;
            }
        }
        
        false
    }

    // ============ Auto-Grouping ============

    fn find_or_create_group_for_tab(&mut self, tab: &TabMetadata) -> Option<String> {
        if !self.config.auto_group_enabled {
            return None;
        }

        // First check custom rules
        for rule in &self.config.grouping_rules {
            if !rule.enabled {
                continue;
            }
            
            let matches = match rule.rule_type {
                GroupingRuleType::Domain => {
                    rule.pattern.split('|').any(|p| tab.domain.contains(p))
                }
                GroupingRuleType::UrlPattern => {
                    tab.url.contains(&rule.pattern)
                }
                GroupingRuleType::TitlePattern => {
                    tab.title.to_lowercase().contains(&rule.pattern.to_lowercase())
                }
                GroupingRuleType::Category => false, // Handled below
            };
            
            if matches {
                // Find existing group with this name or create new
                let existing = self.groups.values()
                    .find(|g| g.name == rule.group_name)
                    .map(|g| g.id.clone());
                
                if let Some(gid) = existing {
                    return Some(gid);
                } else {
                    let group = self.create_group(rule.group_name.clone(), rule.group_color.clone());
                    return Some(group.id);
                }
            }
        }

        // Check domain categories
        for cat in &self.domain_categories {
            if cat.domain_patterns.iter().any(|p| tab.domain.contains(p)) {
                // Find existing group with this category or create new
                let existing = self.groups.values()
                    .find(|g| g.category.as_deref() == Some(cat.category))
                    .map(|g| g.id.clone());
                
                if let Some(gid) = existing {
                    return Some(gid);
                } else {
                    let mut group = TabGroup::new(cat.category.to_string(), cat.suggested_color.clone());
                    group.category = Some(cat.category.to_string());
                    group.icon = Some(cat.icon.to_string());
                    group.auto_generated = true;
                    let gid = group.id.clone();
                    self.groups.insert(gid.clone(), group);
                    return Some(gid);
                }
            }
        }

        // Auto-group by domain if enabled
        if self.config.auto_group_by_domain {
            let domain = &tab.domain;
            
            // Find existing group for this domain
            let existing = self.groups.values()
                .find(|g| g.auto_generated && g.name == *domain)
                .map(|g| g.id.clone());
            
            if let Some(gid) = existing {
                return Some(gid);
            }
            
            // Create new group for domain only if multiple tabs from same domain
            let same_domain_count = self.tabs.values()
                .filter(|t| t.domain == *domain)
                .count();
            
            if same_domain_count >= 2 {
                let mut group = TabGroup::new(domain.clone(), GroupColor::Blue);
                group.auto_generated = true;
                let gid = group.id.clone();
                self.groups.insert(gid.clone(), group);
                return Some(gid);
            }
        }

        None
    }

    // ============ AI Suggestions ============

    pub fn get_ai_suggestions(&self) -> Vec<GroupSuggestion> {
        if !self.config.ai_suggestions_enabled {
            return Vec::new();
        }

        let mut suggestions = Vec::new();

        // Analyze ungrouped tabs
        let ungrouped: Vec<_> = self.ungrouped_tabs
            .iter()
            .filter_map(|id| self.tabs.get(id))
            .collect();

        // Group by domain
        let mut domain_groups: HashMap<String, Vec<&TabMetadata>> = HashMap::new();
        for tab in &ungrouped {
            domain_groups.entry(tab.domain.clone())
                .or_insert_with(Vec::new)
                .push(tab);
        }

        // Suggest groups for domains with multiple tabs
        for (domain, tabs) in domain_groups {
            if tabs.len() >= 2 {
                let category = self.categorize_domain(&domain);
                
                suggestions.push(GroupSuggestion {
                    id: Uuid::new_v4().to_string(),
                    name: domain.clone(),
                    color: category.1,
                    tab_ids: tabs.iter().map(|t| t.id.clone()).collect(),
                    confidence: 0.8,
                    reason: format!("You have {} tabs from {}", tabs.len(), domain),
                    category: category.0.to_string(),
                });
            }
        }

        // Suggest merging similar groups
        let groups: Vec<_> = self.groups.values().collect();
        for i in 0..groups.len() {
            for j in (i + 1)..groups.len() {
                let g1 = &groups[i];
                let g2 = &groups[j];
                
                // Check if groups have similar tabs (same domain)
                let g1_domains: Vec<_> = g1.tab_ids.iter()
                    .filter_map(|id| self.tabs.get(id))
                    .map(|t| &t.domain)
                    .collect();
                let g2_domains: Vec<_> = g2.tab_ids.iter()
                    .filter_map(|id| self.tabs.get(id))
                    .map(|t| &t.domain)
                    .collect();
                
                let overlap = g1_domains.iter()
                    .filter(|d| g2_domains.contains(d))
                    .count();
                
                if overlap > 0 && g1.auto_generated && g2.auto_generated {
                    suggestions.push(GroupSuggestion {
                        id: Uuid::new_v4().to_string(),
                        name: format!("{} + {}", g1.name, g2.name),
                        color: g1.color.clone(),
                        tab_ids: [g1.tab_ids.clone(), g2.tab_ids.clone()].concat(),
                        confidence: 0.6,
                        reason: "These groups have overlapping content".to_string(),
                        category: "Merge".to_string(),
                    });
                }
            }
        }

        suggestions
    }

    fn categorize_domain(&self, domain: &str) -> (&'static str, GroupColor) {
        for cat in &self.domain_categories {
            if cat.domain_patterns.iter().any(|p| domain.contains(p)) {
                return (cat.category, cat.suggested_color.clone());
            }
        }
        ("Other", GroupColor::Grey)
    }

    pub fn apply_suggestion(&mut self, suggestion: &GroupSuggestion) -> Option<String> {
        let group = self.create_group(suggestion.name.clone(), suggestion.color.clone());
        let group_id = group.id.clone();
        
        for tab_id in &suggestion.tab_ids {
            self.move_tab_to_group(tab_id, &group_id);
        }
        
        Some(group_id)
    }

    // ============ Grouping Rules ============

    pub fn add_rule(&mut self, rule: GroupingRule) -> String {
        let id = rule.id.clone();
        self.config.grouping_rules.push(rule);
        id
    }

    pub fn remove_rule(&mut self, rule_id: &str) -> bool {
        if let Some(pos) = self.config.grouping_rules.iter().position(|r| r.id == rule_id) {
            self.config.grouping_rules.remove(pos);
            true
        } else {
            false
        }
    }

    pub fn update_rule(&mut self, rule_id: &str, rule: GroupingRule) -> bool {
        if let Some(existing) = self.config.grouping_rules.iter_mut().find(|r| r.id == rule_id) {
            *existing = rule;
            true
        } else {
            false
        }
    }

    // ============ Statistics ============

    pub fn get_statistics(&self) -> TabGroupsStats {
        TabGroupsStats {
            total_tabs: self.tabs.len(),
            total_groups: self.groups.len(),
            ungrouped_count: self.ungrouped_tabs.len(),
            stacked_tabs: self.tabs.values().filter(|t| t.stack_id.is_some()).count(),
            auto_generated_groups: self.groups.values().filter(|g| g.auto_generated).count(),
            collapsed_groups: self.groups.values().filter(|g| g.collapsed).count(),
            pinned_groups: self.groups.values().filter(|g| g.pinned).count(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TabGroupsStats {
    pub total_tabs: usize,
    pub total_groups: usize,
    pub ungrouped_count: usize,
    pub stacked_tabs: usize,
    pub auto_generated_groups: usize,
    pub collapsed_groups: usize,
    pub pinned_groups: usize,
}

/// Thread-safe wrapper for CubeTabGroups
pub struct TabGroupsService {
    inner: Arc<Mutex<CubeTabGroups>>,
}

impl TabGroupsService {
    pub fn new() -> Self {
        Self {
            inner: Arc::new(Mutex::new(CubeTabGroups::new())),
        }
    }

    pub fn get_inner(&self) -> Arc<Mutex<CubeTabGroups>> {
        Arc::clone(&self.inner)
    }
}

impl Default for TabGroupsService {
    fn default() -> Self {
        Self::new()
    }
}
