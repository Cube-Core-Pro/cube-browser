use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use uuid::Uuid;

// ============================================================================
// Types
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceTab {
    pub id: String,
    pub title: String,
    pub url: String,
    pub favicon: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub r#type: Option<String>, // Optional: browser, automation, ai, whatsapp, monday, planius, etc.
    pub is_active: bool,
    pub is_pinned: bool,
    #[serde(with = "chrono::serde::ts_seconds")]
    pub last_accessed: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceSplitPanel {
    pub id: String,
    pub tabs: Vec<WorkspaceTab>,
    pub active_tab_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum LayoutMode {
    #[serde(rename = "1:1")]
    OneOne,
    #[serde(rename = "2:1")]
    TwoOne,
    #[serde(rename = "1:2")]
    OneTwo,
    #[serde(rename = "2x2")]
    TwoByTwo,
    Single,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceLayout {
    pub mode: LayoutMode,
    pub panels: Vec<WorkspaceSplitPanel>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Workspace {
    pub id: String,
    pub name: String,
    pub icon: String,
    pub color: String,
    pub layout: WorkspaceLayout,
    #[serde(with = "chrono::serde::ts_seconds")]
    pub created_at: DateTime<Utc>,
    #[serde(with = "chrono::serde::ts_seconds")]
    pub last_accessed: DateTime<Utc>,
    pub is_focus_mode: bool,
    pub auto_archive_hours: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceListResponse {
    pub workspaces: Vec<Workspace>,
    pub active_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceUpdates {
    pub name: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub is_focus_mode: Option<bool>,
    pub auto_archive_hours: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TabUpdates {
    pub title: Option<String>,
    pub url: Option<String>,
    pub favicon: Option<String>,
    pub is_pinned: Option<bool>,
}

// ============================================================================
// Service
// ============================================================================

pub struct WorkspaceService {
    workspaces: Arc<Mutex<HashMap<String, Workspace>>>,
    active_workspace_id: Arc<Mutex<Option<String>>>,
}

impl WorkspaceService {
    pub fn new() -> Self {
        Self {
            workspaces: Arc::new(Mutex::new(HashMap::new())),
            active_workspace_id: Arc::new(Mutex::new(None)),
        }
    }

    pub fn initialize_with_default(&self) -> Result<(), String> {
        let mut workspaces = self
            .workspaces
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;

        if workspaces.is_empty() {
            let default_workspace = self.create_default_workspace();
            let id = default_workspace.id.clone();
            workspaces.insert(id.clone(), default_workspace);

            let mut active_id = self
                .active_workspace_id
                .lock()
                .map_err(|e| format!("Lock error: {}", e))?;
            *active_id = Some(id);
        }

        Ok(())
    }

    fn create_default_workspace(&self) -> Workspace {
        let id = Uuid::new_v4().to_string();
        let panel_id = Uuid::new_v4().to_string();
        let tab_id = Uuid::new_v4().to_string();

        let default_tab = WorkspaceTab {
            id: tab_id.clone(),
            title: "New Tab".to_string(),
            url: "about:blank".to_string(),
            favicon: None,
            r#type: None,
            is_active: true,
            is_pinned: false,
            last_accessed: Utc::now(),
        };

        let default_panel = WorkspaceSplitPanel {
            id: panel_id,
            tabs: vec![default_tab],
            active_tab_id: tab_id,
        };

        Workspace {
            id,
            name: "Default".to_string(),
            icon: "🗂️".to_string(),
            color: "#6366f1".to_string(),
            layout: WorkspaceLayout {
                mode: LayoutMode::Single,
                panels: vec![default_panel],
            },
            created_at: Utc::now(),
            last_accessed: Utc::now(),
            is_focus_mode: false,
            auto_archive_hours: None,
        }
    }

    // ========================================================================
    // CRUD Operations
    // ========================================================================

    pub fn list(&self) -> Result<WorkspaceListResponse, String> {
        let workspaces = self
            .workspaces
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;

        let active_id = self
            .active_workspace_id
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;

        let mut workspace_list: Vec<Workspace> = workspaces.values().cloned().collect();
        workspace_list.sort_by(|a, b| b.last_accessed.cmp(&a.last_accessed));

        Ok(WorkspaceListResponse {
            workspaces: workspace_list,
            active_id: active_id.clone(),
        })
    }

    pub fn create(&self, name: String, icon: String, color: String) -> Result<Workspace, String> {
        let id = Uuid::new_v4().to_string();
        let panel_id = Uuid::new_v4().to_string();
        let tab_id = Uuid::new_v4().to_string();

        let default_tab = WorkspaceTab {
            id: tab_id.clone(),
            title: "New Tab".to_string(),
            url: "about:blank".to_string(),
            favicon: None,
            r#type: None,
            is_active: true,
            is_pinned: false,
            last_accessed: Utc::now(),
        };

        let default_panel = WorkspaceSplitPanel {
            id: panel_id,
            tabs: vec![default_tab],
            active_tab_id: tab_id,
        };

        let workspace = Workspace {
            id: id.clone(),
            name,
            icon,
            color,
            layout: WorkspaceLayout {
                mode: LayoutMode::Single,
                panels: vec![default_panel],
            },
            created_at: Utc::now(),
            last_accessed: Utc::now(),
            is_focus_mode: false,
            auto_archive_hours: None,
        };

        let mut workspaces = self
            .workspaces
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;

        workspaces.insert(id, workspace.clone());

        Ok(workspace)
    }

    pub fn update(&self, id: String, updates: WorkspaceUpdates) -> Result<(), String> {
        let mut workspaces = self
            .workspaces
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;

        let workspace = workspaces
            .get_mut(&id)
            .ok_or_else(|| format!("Workspace not found: {}", id))?;

        if let Some(name) = updates.name {
            workspace.name = name;
        }
        if let Some(icon) = updates.icon {
            workspace.icon = icon;
        }
        if let Some(color) = updates.color {
            workspace.color = color;
        }
        if let Some(is_focus_mode) = updates.is_focus_mode {
            workspace.is_focus_mode = is_focus_mode;
        }
        if let Some(hours) = updates.auto_archive_hours {
            workspace.auto_archive_hours = Some(hours);
        }

        workspace.last_accessed = Utc::now();

        Ok(())
    }

    pub fn delete(&self, id: String) -> Result<(), String> {
        let mut workspaces = self
            .workspaces
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;

        workspaces
            .remove(&id)
            .ok_or_else(|| format!("Workspace not found: {}", id))?;

        let mut active_id = self
            .active_workspace_id
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;

        if active_id.as_ref() == Some(&id) {
            *active_id = workspaces.keys().next().cloned();
        }

        Ok(())
    }

    pub fn switch(&self, id: String) -> Result<(), String> {
        let mut workspaces = self
            .workspaces
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;

        let workspace = workspaces
            .get_mut(&id)
            .ok_or_else(|| format!("Workspace not found: {}", id))?;

        workspace.last_accessed = Utc::now();

        let mut active_id = self
            .active_workspace_id
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;

        *active_id = Some(id);

        Ok(())
    }

    pub fn duplicate(&self, id: String) -> Result<Workspace, String> {
        let workspaces = self
            .workspaces
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;

        let original = workspaces
            .get(&id)
            .ok_or_else(|| format!("Workspace not found: {}", id))?
            .clone(); // Clone immediately

        drop(workspaces); // Drop lock before creating new workspace

        let new_id = Uuid::new_v4().to_string();
        let mut new_workspace = original;
        new_workspace.id = new_id.clone();
        new_workspace.name = format!("{} (Copy)", new_workspace.name);
        new_workspace.created_at = Utc::now();
        new_workspace.last_accessed = Utc::now();

        // Generate new IDs for panels and tabs
        new_workspace.layout.panels = new_workspace
            .layout
            .panels
            .iter()
            .map(|panel| {
                let new_panel_id = Uuid::new_v4().to_string();
                let new_tabs: Vec<WorkspaceTab> = panel
                    .tabs
                    .iter()
                    .map(|tab| WorkspaceTab {
                        id: Uuid::new_v4().to_string(),
                        ..tab.clone()
                    })
                    .collect();

                WorkspaceSplitPanel {
                    id: new_panel_id,
                    tabs: new_tabs.clone(),
                    active_tab_id: new_tabs.first().map(|t| t.id.clone()).unwrap_or_default(),
                }
            })
            .collect();

        let mut workspaces = self
            .workspaces
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;

        workspaces.insert(new_id, new_workspace.clone());

        Ok(new_workspace)
    }

    // ========================================================================
    // Tab Management
    // ========================================================================

    pub fn add_tab(
        &self,
        workspace_id: String,
        panel_id: String,
        url: String,
        title: String,
    ) -> Result<WorkspaceTab, String> {
        let mut workspaces = self
            .workspaces
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;

        let workspace = workspaces
            .get_mut(&workspace_id)
            .ok_or_else(|| format!("Workspace not found: {}", workspace_id))?;

        let panel = workspace
            .layout
            .panels
            .iter_mut()
            .find(|p| p.id == panel_id)
            .ok_or_else(|| format!("Panel not found: {}", panel_id))?;

        let tab = WorkspaceTab {
            id: Uuid::new_v4().to_string(),
            title,
            url,
            favicon: None,
            r#type: None,
            is_active: false,
            is_pinned: false,
            last_accessed: Utc::now(),
        };

        panel.tabs.push(tab.clone());

        Ok(tab)
    }

    pub fn remove_tab(
        &self,
        workspace_id: String,
        panel_id: String,
        tab_id: String,
    ) -> Result<(), String> {
        let mut workspaces = self
            .workspaces
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;

        let workspace = workspaces
            .get_mut(&workspace_id)
            .ok_or_else(|| format!("Workspace not found: {}", workspace_id))?;

        let panel = workspace
            .layout
            .panels
            .iter_mut()
            .find(|p| p.id == panel_id)
            .ok_or_else(|| format!("Panel not found: {}", panel_id))?;

        panel.tabs.retain(|t| t.id != tab_id);

        if panel.active_tab_id == tab_id {
            panel.active_tab_id = panel.tabs.first().map(|t| t.id.clone()).unwrap_or_default();
        }

        Ok(())
    }

    pub fn update_tab(
        &self,
        workspace_id: String,
        panel_id: String,
        tab_id: String,
        updates: TabUpdates,
    ) -> Result<(), String> {
        let mut workspaces = self
            .workspaces
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;

        let workspace = workspaces
            .get_mut(&workspace_id)
            .ok_or_else(|| format!("Workspace not found: {}", workspace_id))?;

        let panel = workspace
            .layout
            .panels
            .iter_mut()
            .find(|p| p.id == panel_id)
            .ok_or_else(|| format!("Panel not found: {}", panel_id))?;

        let tab = panel
            .tabs
            .iter_mut()
            .find(|t| t.id == tab_id)
            .ok_or_else(|| format!("Tab not found: {}", tab_id))?;

        if let Some(title) = updates.title {
            tab.title = title;
        }
        if let Some(url) = updates.url {
            tab.url = url;
        }
        if let Some(favicon) = updates.favicon {
            tab.favicon = Some(favicon);
        }
        if let Some(is_pinned) = updates.is_pinned {
            tab.is_pinned = is_pinned;
        }

        tab.last_accessed = Utc::now();

        Ok(())
    }

    pub fn pin_tab(
        &self,
        workspace_id: String,
        panel_id: String,
        tab_id: String,
    ) -> Result<(), String> {
        let mut workspaces = self
            .workspaces
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;

        let workspace = workspaces
            .get_mut(&workspace_id)
            .ok_or_else(|| format!("Workspace not found: {}", workspace_id))?;

        let panel = workspace
            .layout
            .panels
            .iter_mut()
            .find(|p| p.id == panel_id)
            .ok_or_else(|| format!("Panel not found: {}", panel_id))?;

        let tab = panel
            .tabs
            .iter_mut()
            .find(|t| t.id == tab_id)
            .ok_or_else(|| format!("Tab not found: {}", tab_id))?;

        tab.is_pinned = !tab.is_pinned;

        Ok(())
    }

    pub fn switch_tab(
        &self,
        workspace_id: String,
        panel_id: String,
        tab_id: String,
    ) -> Result<(), String> {
        let mut workspaces = self
            .workspaces
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;

        let workspace = workspaces
            .get_mut(&workspace_id)
            .ok_or_else(|| format!("Workspace not found: {}", workspace_id))?;

        let panel = workspace
            .layout
            .panels
            .iter_mut()
            .find(|p| p.id == panel_id)
            .ok_or_else(|| format!("Panel not found: {}", panel_id))?;

        // Set all tabs to inactive
        for tab in panel.tabs.iter_mut() {
            tab.is_active = false;
        }

        // Set target tab to active
        let tab = panel
            .tabs
            .iter_mut()
            .find(|t| t.id == tab_id)
            .ok_or_else(|| format!("Tab not found: {}", tab_id))?;

        tab.is_active = true;
        tab.last_accessed = Utc::now();
        panel.active_tab_id = tab_id;

        Ok(())
    }

    // ========================================================================
    // Layout Management
    // ========================================================================

    pub fn set_layout(&self, workspace_id: String, mode: LayoutMode) -> Result<(), String> {
        let mut workspaces = self
            .workspaces
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;

        let workspace = workspaces
            .get_mut(&workspace_id)
            .ok_or_else(|| format!("Workspace not found: {}", workspace_id))?;

        workspace.layout.mode = mode;

        Ok(())
    }

    pub fn add_panel(&self, workspace_id: String) -> Result<WorkspaceSplitPanel, String> {
        let mut workspaces = self
            .workspaces
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;

        let workspace = workspaces
            .get_mut(&workspace_id)
            .ok_or_else(|| format!("Workspace not found: {}", workspace_id))?;

        let panel_id = Uuid::new_v4().to_string();
        let tab_id = Uuid::new_v4().to_string();

        let default_tab = WorkspaceTab {
            id: tab_id.clone(),
            title: "New Tab".to_string(),
            url: "about:blank".to_string(),
            favicon: None,
            r#type: None,
            is_active: true,
            is_pinned: false,
            last_accessed: Utc::now(),
        };

        let panel = WorkspaceSplitPanel {
            id: panel_id,
            tabs: vec![default_tab],
            active_tab_id: tab_id,
        };

        workspace.layout.panels.push(panel.clone());

        Ok(panel)
    }

    pub fn remove_panel(&self, workspace_id: String, panel_id: String) -> Result<(), String> {
        let mut workspaces = self
            .workspaces
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;

        let workspace = workspaces
            .get_mut(&workspace_id)
            .ok_or_else(|| format!("Workspace not found: {}", workspace_id))?;

        if workspace.layout.panels.len() <= 1 {
            return Err("Cannot remove last panel".to_string());
        }

        workspace.layout.panels.retain(|p| p.id != panel_id);

        Ok(())
    }

    // ========================================================================
    // Focus Mode
    // ========================================================================

    pub fn toggle_focus_mode(&self, workspace_id: String) -> Result<(), String> {
        let mut workspaces = self
            .workspaces
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;

        let workspace = workspaces
            .get_mut(&workspace_id)
            .ok_or_else(|| format!("Workspace not found: {}", workspace_id))?;

        workspace.is_focus_mode = !workspace.is_focus_mode;

        Ok(())
    }

    // ========================================================================
    // Auto-Archive
    // ========================================================================

    pub fn set_auto_archive(&self, workspace_id: String, hours: Option<i64>) -> Result<(), String> {
        let mut workspaces = self
            .workspaces
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;

        let workspace = workspaces
            .get_mut(&workspace_id)
            .ok_or_else(|| format!("Workspace not found: {}", workspace_id))?;

        workspace.auto_archive_hours = hours;

        Ok(())
    }

    pub fn check_auto_archive(&self) -> Result<(), String> {
        let mut workspaces = self
            .workspaces
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;

        let now = Utc::now();
        let active_id = self
            .active_workspace_id
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;

        workspaces.retain(|id, workspace| {
            if let Some(hours) = workspace.auto_archive_hours {
                let threshold = Duration::hours(hours);
                let elapsed = now.signed_duration_since(workspace.last_accessed);

                // Don't archive active workspace
                if Some(id) == active_id.as_ref() {
                    return true;
                }

                elapsed < threshold
            } else {
                true
            }
        });

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_service_creation() {
        let service = WorkspaceService::new();
        assert!(service.initialize_with_default().is_ok());

        let list = service.list().unwrap();
        assert_eq!(list.workspaces.len(), 1);
        assert!(list.active_id.is_some());
    }

    #[test]
    fn test_workspace_crud() {
        let service = WorkspaceService::new();
        service.initialize_with_default().unwrap();

        let workspace = service
            .create("Test".to_string(), "📁".to_string(), "#ff0000".to_string())
            .unwrap();
        assert_eq!(workspace.name, "Test");

        let list = service.list().unwrap();
        assert_eq!(list.workspaces.len(), 2);

        service.delete(workspace.id).unwrap();
        let list = service.list().unwrap();
        assert_eq!(list.workspaces.len(), 1);
    }

    #[test]
    fn test_tab_management() {
        let service = WorkspaceService::new();
        service.initialize_with_default().unwrap();

        let list = service.list().unwrap();
        let workspace_id = list.workspaces[0].id.clone();
        let panel_id = list.workspaces[0].layout.panels[0].id.clone();

        let tab = service
            .add_tab(
                workspace_id.clone(),
                panel_id.clone(),
                "https://example.com".to_string(),
                "Example".to_string(),
            )
            .unwrap();

        assert_eq!(tab.url, "https://example.com");

        service
            .pin_tab(workspace_id.clone(), panel_id.clone(), tab.id.clone())
            .unwrap();

        let list = service.list().unwrap();
        let panel = &list.workspaces[0].layout.panels[0];
        let pinned_tab = panel.tabs.iter().find(|t| t.id == tab.id).unwrap();
        assert!(pinned_tab.is_pinned);
    }
}
