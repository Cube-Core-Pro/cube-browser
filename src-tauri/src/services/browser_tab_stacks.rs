// CUBE Nexum - Tab Stacks Service
// Vivaldi-style tab stacking with advanced grouping and visual organization

use std::collections::HashMap;
use std::sync::RwLock;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// ==================== Types ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TabStack {
    pub id: String,
    pub name: String,
    pub color: String,
    pub icon: Option<String>,
    pub tab_ids: Vec<String>,
    pub active_tab_index: usize,
    pub is_expanded: bool,
    pub is_muted: bool,
    pub is_hibernated: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub position: i32,
    pub layout: StackLayout,
    pub auto_stack_rule: Option<AutoStackRule>,
    pub metadata: StackMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StackMetadata {
    pub total_visits: u64,
    pub total_time_seconds: u64,
    pub domain_distribution: HashMap<String, u32>,
    pub last_accessed: DateTime<Utc>,
    pub memory_estimate_mb: u32,
    pub favicon_urls: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum StackLayout {
    /// Standard accordion/dropdown view
    Accordion,
    /// Horizontal tab strip within stack
    Horizontal,
    /// Grid of thumbnails
    Grid,
    /// Two-level view (preview + tabs)
    TwoLevel,
    /// Compact - just shows count
    Compact,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutoStackRule {
    pub id: String,
    pub name: String,
    pub rule_type: AutoStackRuleType,
    pub pattern: String,
    pub is_enabled: bool,
    pub target_stack_id: Option<String>,
    pub create_new_stack: bool,
    pub priority: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AutoStackRuleType {
    /// Match by domain (e.g., "*.google.com")
    Domain,
    /// Match by URL pattern (e.g., "*/search/*")
    UrlPattern,
    /// Match by page title (e.g., "GitHub - *")
    TitlePattern,
    /// Match by tab opener (child tabs grouped with parent)
    Opener,
    /// Match by tab creation time (tabs created within X seconds)
    TimeWindow,
    /// Match by active workspace
    Workspace,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TabStackSettings {
    pub enabled: bool,
    pub default_layout: StackLayout,
    pub show_stacked_tab_indicator: bool,
    pub show_favicon_preview: bool,
    pub max_preview_favicons: u32,
    pub auto_stack_enabled: bool,
    pub auto_stack_by_domain: bool,
    pub auto_stack_by_opener: bool,
    pub auto_stack_time_window_seconds: u32,
    pub double_click_behavior: DoubleClickBehavior,
    pub middle_click_behavior: MiddleClickBehavior,
    pub rename_on_single_tab: bool,
    pub hibernate_inactive_stacks: bool,
    pub hibernate_after_minutes: u32,
    pub show_memory_usage: bool,
    pub enable_stack_gestures: bool,
    pub keyboard_shortcuts: StackKeyboardShortcuts,
    pub colors: StackColorPalette,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DoubleClickBehavior {
    /// Expand/collapse the stack
    ToggleExpand,
    /// Rename the stack
    Rename,
    /// Open all tabs in new window
    OpenInNewWindow,
    /// Split into individual tabs
    Unstack,
    /// Do nothing
    None,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum MiddleClickBehavior {
    /// Close entire stack
    CloseStack,
    /// Close active tab in stack
    CloseActiveTab,
    /// Duplicate stack
    DuplicateStack,
    /// Do nothing
    None,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StackKeyboardShortcuts {
    pub toggle_expand: String,
    pub next_tab_in_stack: String,
    pub prev_tab_in_stack: String,
    pub create_stack: String,
    pub rename_stack: String,
    pub close_stack: String,
    pub unstack: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StackColorPalette {
    pub colors: Vec<String>,
    pub auto_assign: bool,
    pub color_by_domain: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StackDragData {
    pub source_stack_id: Option<String>,
    pub tab_id: String,
    pub target_stack_id: Option<String>,
    pub target_position: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StackOperation {
    pub operation_type: StackOperationType,
    pub stack_id: String,
    pub tab_ids: Vec<String>,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum StackOperationType {
    Created,
    TabAdded,
    TabRemoved,
    TabsReordered,
    Expanded,
    Collapsed,
    Muted,
    Unmuted,
    Hibernated,
    Awakened,
    Renamed,
    ColorChanged,
    LayoutChanged,
    Deleted,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StackUpdate {
    pub name: Option<String>,
    pub color: Option<String>,
    pub icon: Option<String>,
    pub layout: Option<StackLayout>,
    pub is_expanded: Option<bool>,
    pub is_muted: Option<bool>,
    pub is_hibernated: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StackStats {
    pub total_stacks: u32,
    pub total_stacked_tabs: u32,
    pub expanded_stacks: u32,
    pub hibernated_stacks: u32,
    pub muted_stacks: u32,
    pub memory_saved_by_hibernation_mb: u32,
    pub most_tabs_in_stack: u32,
    pub avg_tabs_per_stack: f32,
    pub top_domains: Vec<(String, u32)>,
    pub auto_stacked_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StackSuggestion {
    pub suggestion_type: SuggestionType,
    pub tab_ids: Vec<String>,
    pub reason: String,
    pub suggested_name: String,
    pub suggested_color: String,
    pub confidence: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SuggestionType {
    /// Group tabs with same domain
    SameDomain,
    /// Group tabs opened from same parent
    SameOpener,
    /// Group tabs opened around same time
    SameTimeWindow,
    /// Group tabs with similar titles
    SimilarTitles,
    /// Group tabs from same project/workspace
    SameProject,
    /// Split large stack into smaller ones
    SplitLargeStack,
}

// ==================== Service Implementation ====================

pub struct BrowserTabStacksService {
    stacks: RwLock<HashMap<String, TabStack>>,
    settings: RwLock<TabStackSettings>,
    auto_stack_rules: RwLock<Vec<AutoStackRule>>,
    operation_history: RwLock<Vec<StackOperation>>,
    next_color_index: RwLock<usize>,
}

impl BrowserTabStacksService {
    pub fn new() -> Self {
        Self {
            stacks: RwLock::new(HashMap::new()),
            settings: RwLock::new(Self::default_settings()),
            auto_stack_rules: RwLock::new(Self::default_rules()),
            operation_history: RwLock::new(Vec::new()),
            next_color_index: RwLock::new(0),
        }
    }

    fn default_settings() -> TabStackSettings {
        TabStackSettings {
            enabled: true,
            default_layout: StackLayout::Accordion,
            show_stacked_tab_indicator: true,
            show_favicon_preview: true,
            max_preview_favicons: 4,
            auto_stack_enabled: true,
            auto_stack_by_domain: true,
            auto_stack_by_opener: true,
            auto_stack_time_window_seconds: 30,
            double_click_behavior: DoubleClickBehavior::ToggleExpand,
            middle_click_behavior: MiddleClickBehavior::CloseActiveTab,
            rename_on_single_tab: false,
            hibernate_inactive_stacks: true,
            hibernate_after_minutes: 30,
            show_memory_usage: true,
            enable_stack_gestures: true,
            keyboard_shortcuts: StackKeyboardShortcuts {
                toggle_expand: "Ctrl+Shift+S".to_string(),
                next_tab_in_stack: "Ctrl+Tab".to_string(),
                prev_tab_in_stack: "Ctrl+Shift+Tab".to_string(),
                create_stack: "Ctrl+Shift+G".to_string(),
                rename_stack: "F2".to_string(),
                close_stack: "Ctrl+Shift+W".to_string(),
                unstack: "Ctrl+Shift+U".to_string(),
            },
            colors: StackColorPalette {
                colors: vec![
                    "#6366f1".to_string(), // Indigo
                    "#8b5cf6".to_string(), // Violet
                    "#ec4899".to_string(), // Pink
                    "#ef4444".to_string(), // Red
                    "#f97316".to_string(), // Orange
                    "#f59e0b".to_string(), // Amber
                    "#84cc16".to_string(), // Lime
                    "#22c55e".to_string(), // Green
                    "#14b8a6".to_string(), // Teal
                    "#06b6d4".to_string(), // Cyan
                    "#3b82f6".to_string(), // Blue
                    "#a855f7".to_string(), // Purple
                ],
                auto_assign: true,
                color_by_domain: true,
            },
        }
    }

    fn default_rules() -> Vec<AutoStackRule> {
        vec![
            AutoStackRule {
                id: Uuid::new_v4().to_string(),
                name: "Social Media".to_string(),
                rule_type: AutoStackRuleType::Domain,
                pattern: "twitter.com|facebook.com|instagram.com|linkedin.com|x.com".to_string(),
                is_enabled: true,
                target_stack_id: None,
                create_new_stack: true,
                priority: 10,
            },
            AutoStackRule {
                id: Uuid::new_v4().to_string(),
                name: "Google Services".to_string(),
                rule_type: AutoStackRuleType::Domain,
                pattern: "*.google.com|google.com".to_string(),
                is_enabled: true,
                target_stack_id: None,
                create_new_stack: true,
                priority: 9,
            },
            AutoStackRule {
                id: Uuid::new_v4().to_string(),
                name: "Development".to_string(),
                rule_type: AutoStackRuleType::Domain,
                pattern: "github.com|gitlab.com|stackoverflow.com|localhost:*".to_string(),
                is_enabled: true,
                target_stack_id: None,
                create_new_stack: true,
                priority: 8,
            },
            AutoStackRule {
                id: Uuid::new_v4().to_string(),
                name: "Shopping".to_string(),
                rule_type: AutoStackRuleType::Domain,
                pattern: "amazon.com|ebay.com|aliexpress.com|etsy.com".to_string(),
                is_enabled: true,
                target_stack_id: None,
                create_new_stack: true,
                priority: 7,
            },
            AutoStackRule {
                id: Uuid::new_v4().to_string(),
                name: "Child Tabs".to_string(),
                rule_type: AutoStackRuleType::Opener,
                pattern: "".to_string(),
                is_enabled: true,
                target_stack_id: None,
                create_new_stack: false,
                priority: 5,
            },
        ]
    }

    fn get_next_color(&self) -> String {
        let settings = self.settings.read().unwrap();
        let colors = &settings.colors.colors;
        let mut index = self.next_color_index.write().unwrap();
        let color = colors[*index % colors.len()].clone();
        *index += 1;
        color
    }

    fn record_operation(&self, operation: StackOperation) {
        let mut history = self.operation_history.write().unwrap();
        history.push(operation);
        
        // Keep only last 1000 operations
        if history.len() > 1000 {
            history.drain(0..500);
        }
    }

    // ==================== Settings ====================

    pub fn get_settings(&self) -> TabStackSettings {
        self.settings.read().unwrap().clone()
    }

    pub fn update_settings(&self, new_settings: TabStackSettings) {
        let mut settings = self.settings.write().unwrap();
        *settings = new_settings;
    }

    // ==================== Stack Operations ====================

    pub fn create_stack(&self, name: String, tab_ids: Vec<String>) -> Result<TabStack, String> {
        if tab_ids.is_empty() {
            return Err("Cannot create stack with no tabs".to_string());
        }

        let now = Utc::now();
        let color = self.get_next_color();
        let settings = self.settings.read().unwrap();
        
        let stack = TabStack {
            id: Uuid::new_v4().to_string(),
            name: if name.is_empty() { format!("Stack ({})", tab_ids.len()) } else { name },
            color,
            icon: None,
            tab_ids: tab_ids.clone(),
            active_tab_index: 0,
            is_expanded: true,
            is_muted: false,
            is_hibernated: false,
            created_at: now,
            updated_at: now,
            position: self.stacks.read().unwrap().len() as i32,
            layout: settings.default_layout.clone(),
            auto_stack_rule: None,
            metadata: StackMetadata {
                total_visits: 0,
                total_time_seconds: 0,
                domain_distribution: HashMap::new(),
                last_accessed: now,
                memory_estimate_mb: 0,
                favicon_urls: Vec::new(),
            },
        };

        let stack_clone = stack.clone();
        self.stacks.write().unwrap().insert(stack.id.clone(), stack);

        self.record_operation(StackOperation {
            operation_type: StackOperationType::Created,
            stack_id: stack_clone.id.clone(),
            tab_ids,
            timestamp: now,
        });

        Ok(stack_clone)
    }

    pub fn create_stack_from_selected(&self, tab_ids: Vec<String>) -> Result<TabStack, String> {
        self.create_stack(String::new(), tab_ids)
    }

    pub fn get_stack(&self, stack_id: &str) -> Option<TabStack> {
        self.stacks.read().unwrap().get(stack_id).cloned()
    }

    pub fn get_all_stacks(&self) -> Vec<TabStack> {
        let stacks = self.stacks.read().unwrap();
        let mut result: Vec<_> = stacks.values().cloned().collect();
        result.sort_by(|a, b| a.position.cmp(&b.position));
        result
    }

    pub fn update_stack(&self, stack_id: &str, updates: StackUpdate) -> Result<TabStack, String> {
        let mut stacks = self.stacks.write().unwrap();
        let stack = stacks.get_mut(stack_id)
            .ok_or_else(|| "Stack not found".to_string())?;

        if let Some(name) = updates.name {
            stack.name = name;
            self.record_operation(StackOperation {
                operation_type: StackOperationType::Renamed,
                stack_id: stack_id.to_string(),
                tab_ids: vec![],
                timestamp: Utc::now(),
            });
        }
        
        if let Some(color) = updates.color {
            stack.color = color;
            self.record_operation(StackOperation {
                operation_type: StackOperationType::ColorChanged,
                stack_id: stack_id.to_string(),
                tab_ids: vec![],
                timestamp: Utc::now(),
            });
        }
        
        if let Some(icon) = updates.icon {
            stack.icon = Some(icon);
        }
        
        if let Some(layout) = updates.layout {
            stack.layout = layout;
            self.record_operation(StackOperation {
                operation_type: StackOperationType::LayoutChanged,
                stack_id: stack_id.to_string(),
                tab_ids: vec![],
                timestamp: Utc::now(),
            });
        }
        
        if let Some(expanded) = updates.is_expanded {
            stack.is_expanded = expanded;
            self.record_operation(StackOperation {
                operation_type: if expanded { 
                    StackOperationType::Expanded 
                } else { 
                    StackOperationType::Collapsed 
                },
                stack_id: stack_id.to_string(),
                tab_ids: vec![],
                timestamp: Utc::now(),
            });
        }
        
        if let Some(muted) = updates.is_muted {
            stack.is_muted = muted;
            self.record_operation(StackOperation {
                operation_type: if muted { 
                    StackOperationType::Muted 
                } else { 
                    StackOperationType::Unmuted 
                },
                stack_id: stack_id.to_string(),
                tab_ids: vec![],
                timestamp: Utc::now(),
            });
        }
        
        if let Some(hibernated) = updates.is_hibernated {
            stack.is_hibernated = hibernated;
            self.record_operation(StackOperation {
                operation_type: if hibernated { 
                    StackOperationType::Hibernated 
                } else { 
                    StackOperationType::Awakened 
                },
                stack_id: stack_id.to_string(),
                tab_ids: vec![],
                timestamp: Utc::now(),
            });
        }

        stack.updated_at = Utc::now();
        Ok(stack.clone())
    }

    pub fn delete_stack(&self, stack_id: &str) -> Result<Vec<String>, String> {
        let mut stacks = self.stacks.write().unwrap();
        let stack = stacks.remove(stack_id)
            .ok_or_else(|| "Stack not found".to_string())?;

        self.record_operation(StackOperation {
            operation_type: StackOperationType::Deleted,
            stack_id: stack_id.to_string(),
            tab_ids: stack.tab_ids.clone(),
            timestamp: Utc::now(),
        });

        Ok(stack.tab_ids)
    }

    // ==================== Tab Operations ====================

    pub fn add_tab_to_stack(&self, stack_id: &str, tab_id: String, position: Option<i32>) -> Result<TabStack, String> {
        let mut stacks = self.stacks.write().unwrap();
        let stack = stacks.get_mut(stack_id)
            .ok_or_else(|| "Stack not found".to_string())?;

        if stack.tab_ids.contains(&tab_id) {
            return Err("Tab already in stack".to_string());
        }

        match position {
            Some(pos) => {
                let pos = (pos as usize).min(stack.tab_ids.len());
                stack.tab_ids.insert(pos, tab_id.clone());
            }
            None => {
                stack.tab_ids.push(tab_id.clone());
            }
        }

        stack.updated_at = Utc::now();
        
        self.record_operation(StackOperation {
            operation_type: StackOperationType::TabAdded,
            stack_id: stack_id.to_string(),
            tab_ids: vec![tab_id],
            timestamp: Utc::now(),
        });

        Ok(stack.clone())
    }

    pub fn remove_tab_from_stack(&self, stack_id: &str, tab_id: &str) -> Result<(TabStack, bool), String> {
        let mut stacks = self.stacks.write().unwrap();
        let stack = stacks.get_mut(stack_id)
            .ok_or_else(|| "Stack not found".to_string())?;

        let position = stack.tab_ids.iter().position(|id| id == tab_id)
            .ok_or_else(|| "Tab not in stack".to_string())?;

        stack.tab_ids.remove(position);
        stack.updated_at = Utc::now();

        // Adjust active tab index if needed
        if stack.active_tab_index >= stack.tab_ids.len() && !stack.tab_ids.is_empty() {
            stack.active_tab_index = stack.tab_ids.len() - 1;
        }

        self.record_operation(StackOperation {
            operation_type: StackOperationType::TabRemoved,
            stack_id: stack_id.to_string(),
            tab_ids: vec![tab_id.to_string()],
            timestamp: Utc::now(),
        });

        // Check if stack should be deleted (single or no tabs)
        let should_delete = stack.tab_ids.len() <= 1;
        let stack_clone = stack.clone();

        if should_delete {
            // Return remaining tabs before deleting
            let _remaining = stacks.remove(stack_id);
        }

        Ok((stack_clone, should_delete))
    }

    pub fn move_tab_between_stacks(
        &self,
        from_stack_id: &str,
        to_stack_id: &str,
        tab_id: &str,
        position: Option<i32>
    ) -> Result<(), String> {
        let mut stacks = self.stacks.write().unwrap();

        // Remove from source stack
        let from_stack = stacks.get_mut(from_stack_id)
            .ok_or_else(|| "Source stack not found".to_string())?;
        
        let tab_position = from_stack.tab_ids.iter().position(|id| id == tab_id)
            .ok_or_else(|| "Tab not in source stack".to_string())?;
        
        from_stack.tab_ids.remove(tab_position);
        from_stack.updated_at = Utc::now();

        // Add to target stack
        let to_stack = stacks.get_mut(to_stack_id)
            .ok_or_else(|| "Target stack not found".to_string())?;

        match position {
            Some(pos) => {
                let pos = (pos as usize).min(to_stack.tab_ids.len());
                to_stack.tab_ids.insert(pos, tab_id.to_string());
            }
            None => {
                to_stack.tab_ids.push(tab_id.to_string());
            }
        }
        to_stack.updated_at = Utc::now();

        Ok(())
    }

    pub fn reorder_tabs_in_stack(&self, stack_id: &str, tab_ids: Vec<String>) -> Result<TabStack, String> {
        let mut stacks = self.stacks.write().unwrap();
        let stack = stacks.get_mut(stack_id)
            .ok_or_else(|| "Stack not found".to_string())?;

        // Verify all tabs exist in stack
        for tab_id in &tab_ids {
            if !stack.tab_ids.contains(tab_id) {
                return Err(format!("Tab {} not in stack", tab_id));
            }
        }

        stack.tab_ids = tab_ids;
        stack.updated_at = Utc::now();

        self.record_operation(StackOperation {
            operation_type: StackOperationType::TabsReordered,
            stack_id: stack_id.to_string(),
            tab_ids: stack.tab_ids.clone(),
            timestamp: Utc::now(),
        });

        Ok(stack.clone())
    }

    pub fn set_active_tab_in_stack(&self, stack_id: &str, tab_id: &str) -> Result<usize, String> {
        let mut stacks = self.stacks.write().unwrap();
        let stack = stacks.get_mut(stack_id)
            .ok_or_else(|| "Stack not found".to_string())?;

        let index = stack.tab_ids.iter().position(|id| id == tab_id)
            .ok_or_else(|| "Tab not in stack".to_string())?;

        stack.active_tab_index = index;
        stack.metadata.last_accessed = Utc::now();
        stack.updated_at = Utc::now();

        Ok(index)
    }

    pub fn get_next_tab_in_stack(&self, stack_id: &str) -> Option<String> {
        let stacks = self.stacks.read().unwrap();
        let stack = stacks.get(stack_id)?;

        if stack.tab_ids.is_empty() {
            return None;
        }

        let next_index = (stack.active_tab_index + 1) % stack.tab_ids.len();
        stack.tab_ids.get(next_index).cloned()
    }

    pub fn get_prev_tab_in_stack(&self, stack_id: &str) -> Option<String> {
        let stacks = self.stacks.read().unwrap();
        let stack = stacks.get(stack_id)?;

        if stack.tab_ids.is_empty() {
            return None;
        }

        let prev_index = if stack.active_tab_index == 0 {
            stack.tab_ids.len() - 1
        } else {
            stack.active_tab_index - 1
        };

        stack.tab_ids.get(prev_index).cloned()
    }

    // ==================== Stack Actions ====================

    pub fn toggle_expand(&self, stack_id: &str) -> Result<bool, String> {
        let mut stacks = self.stacks.write().unwrap();
        let stack = stacks.get_mut(stack_id)
            .ok_or_else(|| "Stack not found".to_string())?;

        stack.is_expanded = !stack.is_expanded;
        let expanded = stack.is_expanded;
        stack.updated_at = Utc::now();

        self.record_operation(StackOperation {
            operation_type: if expanded { 
                StackOperationType::Expanded 
            } else { 
                StackOperationType::Collapsed 
            },
            stack_id: stack_id.to_string(),
            tab_ids: vec![],
            timestamp: Utc::now(),
        });

        Ok(expanded)
    }

    pub fn toggle_mute(&self, stack_id: &str) -> Result<bool, String> {
        let mut stacks = self.stacks.write().unwrap();
        let stack = stacks.get_mut(stack_id)
            .ok_or_else(|| "Stack not found".to_string())?;

        stack.is_muted = !stack.is_muted;
        let muted = stack.is_muted;
        stack.updated_at = Utc::now();

        self.record_operation(StackOperation {
            operation_type: if muted { 
                StackOperationType::Muted 
            } else { 
                StackOperationType::Unmuted 
            },
            stack_id: stack_id.to_string(),
            tab_ids: vec![],
            timestamp: Utc::now(),
        });

        Ok(muted)
    }

    pub fn hibernate_stack(&self, stack_id: &str) -> Result<(), String> {
        let mut stacks = self.stacks.write().unwrap();
        let stack = stacks.get_mut(stack_id)
            .ok_or_else(|| "Stack not found".to_string())?;

        stack.is_hibernated = true;
        stack.updated_at = Utc::now();

        self.record_operation(StackOperation {
            operation_type: StackOperationType::Hibernated,
            stack_id: stack_id.to_string(),
            tab_ids: stack.tab_ids.clone(),
            timestamp: Utc::now(),
        });

        Ok(())
    }

    pub fn awaken_stack(&self, stack_id: &str) -> Result<(), String> {
        let mut stacks = self.stacks.write().unwrap();
        let stack = stacks.get_mut(stack_id)
            .ok_or_else(|| "Stack not found".to_string())?;

        stack.is_hibernated = false;
        stack.updated_at = Utc::now();

        self.record_operation(StackOperation {
            operation_type: StackOperationType::Awakened,
            stack_id: stack_id.to_string(),
            tab_ids: stack.tab_ids.clone(),
            timestamp: Utc::now(),
        });

        Ok(())
    }

    pub fn collapse_all(&self) {
        let mut stacks = self.stacks.write().unwrap();
        for stack in stacks.values_mut() {
            stack.is_expanded = false;
        }
    }

    pub fn expand_all(&self) {
        let mut stacks = self.stacks.write().unwrap();
        for stack in stacks.values_mut() {
            stack.is_expanded = true;
        }
    }

    // ==================== Auto-Stacking ====================

    pub fn get_auto_stack_rules(&self) -> Vec<AutoStackRule> {
        self.auto_stack_rules.read().unwrap().clone()
    }

    pub fn add_auto_stack_rule(&self, rule: AutoStackRule) -> Result<(), String> {
        let mut rules = self.auto_stack_rules.write().unwrap();
        rules.push(rule);
        rules.sort_by(|a, b| b.priority.cmp(&a.priority));
        Ok(())
    }

    pub fn update_auto_stack_rule(&self, rule_id: &str, updated_rule: AutoStackRule) -> Result<(), String> {
        let mut rules = self.auto_stack_rules.write().unwrap();
        let rule = rules.iter_mut().find(|r| r.id == rule_id)
            .ok_or_else(|| "Rule not found".to_string())?;
        
        *rule = updated_rule;
        rules.sort_by(|a, b| b.priority.cmp(&a.priority));
        Ok(())
    }

    pub fn delete_auto_stack_rule(&self, rule_id: &str) -> Result<(), String> {
        let mut rules = self.auto_stack_rules.write().unwrap();
        rules.retain(|r| r.id != rule_id);
        Ok(())
    }

    pub fn check_auto_stack(&self, url: &str, title: &str, opener_tab_id: Option<&str>) -> Option<String> {
        let settings = self.settings.read().unwrap();
        if !settings.auto_stack_enabled {
            return None;
        }

        let rules = self.auto_stack_rules.read().unwrap();
        let stacks = self.stacks.read().unwrap();

        for rule in rules.iter() {
            if !rule.is_enabled {
                continue;
            }

            let matches = match rule.rule_type {
                AutoStackRuleType::Domain => {
                    self.match_domain_pattern(url, &rule.pattern)
                }
                AutoStackRuleType::UrlPattern => {
                    self.match_url_pattern(url, &rule.pattern)
                }
                AutoStackRuleType::TitlePattern => {
                    self.match_title_pattern(title, &rule.pattern)
                }
                AutoStackRuleType::Opener => {
                    // Check if opener tab is in a stack
                    opener_tab_id.map(|id| {
                        stacks.values().any(|s| s.tab_ids.contains(&id.to_string()))
                    }).unwrap_or(false)
                }
                _ => false,
            };

            if matches {
                if let Some(target_id) = &rule.target_stack_id {
                    if stacks.contains_key(target_id) {
                        return Some(target_id.clone());
                    }
                }
                
                // For opener rule, return the stack containing the opener
                if rule.rule_type == AutoStackRuleType::Opener {
                    if let Some(opener_id) = opener_tab_id {
                        for stack in stacks.values() {
                            if stack.tab_ids.contains(&opener_id.to_string()) {
                                return Some(stack.id.clone());
                            }
                        }
                    }
                }
            }
        }

        None
    }

    fn match_domain_pattern(&self, url: &str, pattern: &str) -> bool {
        let domain = url.split("://")
            .nth(1)
            .and_then(|s| s.split('/').next())
            .unwrap_or("");

        for p in pattern.split('|') {
            let p = p.trim();
            if p.starts_with("*.") {
                // Wildcard subdomain match
                let base_domain = &p[2..];
                if domain == base_domain || domain.ends_with(&format!(".{}", base_domain)) {
                    return true;
                }
            } else if p.ends_with(":*") {
                // Port wildcard
                let base = &p[..p.len()-2];
                if domain.starts_with(base) {
                    return true;
                }
            } else if domain == p {
                return true;
            }
        }

        false
    }

    fn match_url_pattern(&self, url: &str, pattern: &str) -> bool {
        let pattern_regex = pattern
            .replace("*", ".*")
            .replace("?", ".");
        
        regex::Regex::new(&pattern_regex)
            .map(|re| re.is_match(url))
            .unwrap_or(false)
    }

    fn match_title_pattern(&self, title: &str, pattern: &str) -> bool {
        for p in pattern.split('|') {
            let p = p.trim();
            if p.contains("*") {
                let pattern_regex = p.replace("*", ".*");
                if regex::Regex::new(&pattern_regex)
                    .map(|re| re.is_match(title))
                    .unwrap_or(false) {
                    return true;
                }
            } else if title.contains(p) {
                return true;
            }
        }
        false
    }

    // ==================== Suggestions ====================

    pub fn get_stack_suggestions(&self, tabs: Vec<(String, String, String, Option<String>)>) -> Vec<StackSuggestion> {
        let mut suggestions = Vec::new();

        // Group by domain
        let mut domain_groups: HashMap<String, Vec<String>> = HashMap::new();
        for (tab_id, url, _title, _opener) in &tabs {
            let domain = url.split("://")
                .nth(1)
                .and_then(|s| s.split('/').next())
                .unwrap_or("unknown")
                .to_string();
            
            domain_groups.entry(domain.clone()).or_default().push(tab_id.clone());
        }

        // Suggest stacks for domains with 2+ tabs
        for (domain, tab_ids) in &domain_groups {
            if tab_ids.len() >= 2 {
                let existing_stacks = self.stacks.read().unwrap();
                let already_stacked = tab_ids.iter().any(|id| {
                    existing_stacks.values().any(|s| s.tab_ids.contains(id))
                });

                if !already_stacked {
                    suggestions.push(StackSuggestion {
                        suggestion_type: SuggestionType::SameDomain,
                        tab_ids: tab_ids.clone(),
                        reason: format!("Group {} tabs from {}", tab_ids.len(), domain),
                        suggested_name: self.humanize_domain(domain),
                        suggested_color: self.get_domain_color(domain),
                        confidence: 0.8,
                    });
                }
            }
        }

        // Group by opener
        let mut opener_groups: HashMap<String, Vec<String>> = HashMap::new();
        for (tab_id, _url, _title, opener) in &tabs {
            if let Some(opener_id) = opener {
                opener_groups.entry(opener_id.clone()).or_default().push(tab_id.clone());
            }
        }

        for (opener_id, child_ids) in &opener_groups {
            if child_ids.len() >= 2 {
                let existing_stacks = self.stacks.read().unwrap();
                let opener_in_stack = existing_stacks.values()
                    .find(|s| s.tab_ids.contains(opener_id));

                if opener_in_stack.is_none() {
                    let mut all_ids = vec![opener_id.clone()];
                    all_ids.extend(child_ids.clone());

                    suggestions.push(StackSuggestion {
                        suggestion_type: SuggestionType::SameOpener,
                        tab_ids: all_ids,
                        reason: format!("Group parent tab with {} child tabs", child_ids.len()),
                        suggested_name: "Related Tabs".to_string(),
                        suggested_color: self.get_next_color(),
                        confidence: 0.75,
                    });
                }
            }
        }

        // Sort by confidence
        suggestions.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap());
        suggestions
    }

    fn humanize_domain(&self, domain: &str) -> String {
        // Remove www. prefix and common TLDs for display
        let name = domain
            .trim_start_matches("www.")
            .split('.')
            .next()
            .unwrap_or(domain);
        
        // Capitalize first letter
        let mut chars = name.chars();
        match chars.next() {
            None => String::new(),
            Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
        }
    }

    fn get_domain_color(&self, domain: &str) -> String {
        let settings = self.settings.read().unwrap();
        let colors = &settings.colors.colors;
        
        // Use domain hash to consistently assign same color to same domain
        let hash = domain.bytes().fold(0u64, |acc, b| acc.wrapping_add(b as u64));
        colors[(hash % colors.len() as u64) as usize].clone()
    }

    // ==================== Stack Search ====================

    pub fn find_stack_for_tab(&self, tab_id: &str) -> Option<TabStack> {
        self.stacks.read().unwrap()
            .values()
            .find(|s| s.tab_ids.contains(&tab_id.to_string()))
            .cloned()
    }

    pub fn search_stacks(&self, query: &str) -> Vec<TabStack> {
        let query_lower = query.to_lowercase();
        self.stacks.read().unwrap()
            .values()
            .filter(|s| s.name.to_lowercase().contains(&query_lower))
            .cloned()
            .collect()
    }

    // ==================== Statistics ====================

    pub fn get_stats(&self) -> StackStats {
        let stacks = self.stacks.read().unwrap();
        
        let total_stacks = stacks.len() as u32;
        let total_stacked_tabs: usize = stacks.values().map(|s| s.tab_ids.len()).sum();
        let expanded_stacks = stacks.values().filter(|s| s.is_expanded).count() as u32;
        let hibernated_stacks = stacks.values().filter(|s| s.is_hibernated).count() as u32;
        let muted_stacks = stacks.values().filter(|s| s.is_muted).count() as u32;
        
        let memory_saved: u32 = stacks.values()
            .filter(|s| s.is_hibernated)
            .map(|s| s.metadata.memory_estimate_mb)
            .sum();

        let most_tabs = stacks.values()
            .map(|s| s.tab_ids.len() as u32)
            .max()
            .unwrap_or(0);

        let avg_tabs = if total_stacks > 0 {
            total_stacked_tabs as f32 / total_stacks as f32
        } else {
            0.0
        };

        // Aggregate domain distribution
        let mut domain_counts: HashMap<String, u32> = HashMap::new();
        for stack in stacks.values() {
            for (domain, count) in &stack.metadata.domain_distribution {
                *domain_counts.entry(domain.clone()).or_insert(0) += count;
            }
        }

        let mut top_domains: Vec<_> = domain_counts.into_iter().collect();
        top_domains.sort_by(|a, b| b.1.cmp(&a.1));
        top_domains.truncate(10);

        let auto_stacked: u32 = stacks.values()
            .filter(|s| s.auto_stack_rule.is_some())
            .count() as u32;

        StackStats {
            total_stacks,
            total_stacked_tabs: total_stacked_tabs as u32,
            expanded_stacks,
            hibernated_stacks,
            muted_stacks,
            memory_saved_by_hibernation_mb: memory_saved,
            most_tabs_in_stack: most_tabs,
            avg_tabs_per_stack: avg_tabs,
            top_domains,
            auto_stacked_count: auto_stacked,
        }
    }

    pub fn get_operation_history(&self, limit: usize) -> Vec<StackOperation> {
        let history = self.operation_history.read().unwrap();
        history.iter().rev().take(limit).cloned().collect()
    }

    // ==================== Export/Import ====================

    pub fn export_stacks(&self) -> Result<String, String> {
        let stacks: Vec<_> = self.stacks.read().unwrap().values().cloned().collect();
        let rules = self.auto_stack_rules.read().unwrap().clone();
        let settings = self.settings.read().unwrap().clone();

        let export = serde_json::json!({
            "version": "1.0",
            "stacks": stacks,
            "rules": rules,
            "settings": settings,
            "exported_at": Utc::now(),
        });

        serde_json::to_string_pretty(&export)
            .map_err(|e| format!("Export failed: {}", e))
    }

    pub fn import_stacks(&self, json: &str) -> Result<(u32, u32), String> {
        #[derive(Deserialize)]
        struct Import {
            stacks: Vec<TabStack>,
            rules: Option<Vec<AutoStackRule>>,
        }

        let import: Import = serde_json::from_str(json)
            .map_err(|e| format!("Import failed: {}", e))?;

        let mut stacks_imported = 0;
        let mut rules_imported = 0;

        let mut stacks = self.stacks.write().unwrap();
        for stack in import.stacks {
            stacks.insert(stack.id.clone(), stack);
            stacks_imported += 1;
        }

        if let Some(rules) = import.rules {
            let mut existing_rules = self.auto_stack_rules.write().unwrap();
            for rule in rules {
                if !existing_rules.iter().any(|r| r.id == rule.id) {
                    existing_rules.push(rule);
                    rules_imported += 1;
                }
            }
        }

        Ok((stacks_imported, rules_imported))
    }
}

impl Default for BrowserTabStacksService {
    fn default() -> Self {
        Self::new()
    }
}
