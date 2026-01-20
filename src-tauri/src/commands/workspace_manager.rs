// CUBE Nexum Elite - Workspace Commands
// Real-time workspace management with persistence
// Features: Layouts, tabs, panels, notes, tasks, collaboration

use serde::{Deserialize, Serialize};
use tauri::State;
use std::sync::Mutex;
use std::collections::HashMap;
use chrono::{DateTime, Utc};
use uuid::Uuid;

// ============================================================
// TYPES - Workspace Data Structures
// ============================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Workspace {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub layout: WorkspaceLayout,
    pub tabs: Vec<WorkspaceTab>,
    pub panels: Vec<WorkspacePanel>,
    pub is_default: bool,
    pub is_pinned: bool,
    pub last_accessed: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub settings: WorkspaceSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceLayout {
    pub layout_type: LayoutType,
    pub main_panel_width: f64,
    pub sidebar_width: f64,
    pub bottom_panel_height: f64,
    pub sidebar_position: SidebarPosition,
    pub show_sidebar: bool,
    pub show_bottom_panel: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum LayoutType {
    Single,
    SplitVertical,
    SplitHorizontal,
    Grid,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SidebarPosition {
    Left,
    Right,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceSettings {
    pub auto_save: bool,
    pub save_interval_ms: u32,
    pub sync_enabled: bool,
    pub show_minimap: bool,
    pub show_breadcrumbs: bool,
    pub theme: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceTab {
    pub id: String,
    pub title: String,
    pub tab_type: TabType,
    pub url: Option<String>,
    pub icon: Option<String>,
    pub is_active: bool,
    pub is_pinned: bool,
    pub is_muted: bool,
    pub panel_id: String,
    pub order: u32,
    pub state: Option<String>,  // Serialized component state
    pub created_at: DateTime<Utc>,
    pub last_accessed: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum TabType {
    Browser,
    Code,
    Terminal,
    Notes,
    Tasks,
    Chat,
    Video,
    Settings,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspacePanel {
    pub id: String,
    pub panel_type: PanelType,
    pub position: PanelPosition,
    pub width: f64,
    pub height: f64,
    pub min_width: f64,
    pub min_height: f64,
    pub is_collapsed: bool,
    pub is_maximized: bool,
    pub active_tab_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum PanelType {
    Main,
    Sidebar,
    Bottom,
    Floating,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PanelPosition {
    pub x: f64,
    pub y: f64,
    pub row: u32,
    pub col: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceNote {
    pub id: String,
    pub workspace_id: String,
    pub title: String,
    pub content: String,
    pub format: NoteFormat,
    pub tags: Vec<String>,
    pub is_pinned: bool,
    pub color: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum NoteFormat {
    Plain,
    Markdown,
    RichText,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceTask {
    pub id: String,
    pub workspace_id: String,
    pub title: String,
    pub description: Option<String>,
    pub status: TaskStatus,
    pub priority: TaskPriority,
    pub due_date: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub assigned_to: Option<String>,
    pub tags: Vec<String>,
    pub subtasks: Vec<SubTask>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum TaskStatus {
    Todo,
    InProgress,
    Review,
    Done,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum TaskPriority {
    Low,
    Medium,
    High,
    Urgent,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubTask {
    pub id: String,
    pub title: String,
    pub is_completed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceSession {
    pub id: String,
    pub workspace_id: String,
    pub name: String,
    pub snapshot: String,  // Serialized workspace state
    pub created_at: DateTime<Utc>,
}

// ============================================================
// STATE - Workspace State Management
// ============================================================

pub struct WorkspaceState {
    pub workspaces: Mutex<HashMap<String, Workspace>>,
    pub notes: Mutex<HashMap<String, WorkspaceNote>>,
    pub tasks: Mutex<HashMap<String, WorkspaceTask>>,
    pub sessions: Mutex<HashMap<String, WorkspaceSession>>,
    pub active_workspace_id: Mutex<Option<String>>,
}

impl Default for WorkspaceState {
    fn default() -> Self {
        let mut workspaces = HashMap::new();
        
        // Create default workspace
        let default_workspace = Workspace {
            id: "default".to_string(),
            name: "Main Workspace".to_string(),
            description: Some("Default workspace".to_string()),
            icon: Some("layout".to_string()),
            color: Some("#6366f1".to_string()),
            layout: WorkspaceLayout {
                layout_type: LayoutType::SplitVertical,
                main_panel_width: 70.0,
                sidebar_width: 300.0,
                bottom_panel_height: 200.0,
                sidebar_position: SidebarPosition::Left,
                show_sidebar: true,
                show_bottom_panel: false,
            },
            tabs: vec![
                WorkspaceTab {
                    id: "tab-1".to_string(),
                    title: "New Tab".to_string(),
                    tab_type: TabType::Browser,
                    url: Some("https://google.com".to_string()),
                    icon: None,
                    is_active: true,
                    is_pinned: false,
                    is_muted: false,
                    panel_id: "main".to_string(),
                    order: 0,
                    state: None,
                    created_at: Utc::now(),
                    last_accessed: Utc::now(),
                },
            ],
            panels: vec![
                WorkspacePanel {
                    id: "main".to_string(),
                    panel_type: PanelType::Main,
                    position: PanelPosition { x: 0.0, y: 0.0, row: 0, col: 0 },
                    width: 100.0,
                    height: 100.0,
                    min_width: 200.0,
                    min_height: 200.0,
                    is_collapsed: false,
                    is_maximized: false,
                    active_tab_id: Some("tab-1".to_string()),
                },
                WorkspacePanel {
                    id: "sidebar".to_string(),
                    panel_type: PanelType::Sidebar,
                    position: PanelPosition { x: 0.0, y: 0.0, row: 0, col: 0 },
                    width: 300.0,
                    height: 100.0,
                    min_width: 200.0,
                    min_height: 100.0,
                    is_collapsed: false,
                    is_maximized: false,
                    active_tab_id: None,
                },
            ],
            is_default: true,
            is_pinned: true,
            last_accessed: Utc::now(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
            settings: WorkspaceSettings {
                auto_save: true,
                save_interval_ms: 30000,
                sync_enabled: true,
                show_minimap: false,
                show_breadcrumbs: true,
                theme: "dark".to_string(),
            },
        };
        
        workspaces.insert(default_workspace.id.clone(), default_workspace);
        
        Self {
            workspaces: Mutex::new(workspaces),
            notes: Mutex::new(HashMap::new()),
            tasks: Mutex::new(HashMap::new()),
            sessions: Mutex::new(HashMap::new()),
            active_workspace_id: Mutex::new(Some("default".to_string())),
        }
    }
}

// ============================================================
// WORKSPACE COMMANDS
// ============================================================

#[derive(Debug, Deserialize)]
pub struct CreateWorkspaceRequest {
    pub name: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub layout_type: Option<LayoutType>,
}

#[tauri::command]
pub async fn ws_mgr_create(
    state: State<'_, WorkspaceState>,
    request: CreateWorkspaceRequest,
) -> Result<Workspace, String> {
    let workspace = Workspace {
        id: Uuid::new_v4().to_string(),
        name: request.name,
        description: request.description,
        icon: request.icon,
        color: request.color,
        layout: WorkspaceLayout {
            layout_type: request.layout_type.unwrap_or(LayoutType::Single),
            main_panel_width: 100.0,
            sidebar_width: 300.0,
            bottom_panel_height: 200.0,
            sidebar_position: SidebarPosition::Left,
            show_sidebar: true,
            show_bottom_panel: false,
        },
        tabs: vec![
            WorkspaceTab {
                id: Uuid::new_v4().to_string(),
                title: "New Tab".to_string(),
                tab_type: TabType::Browser,
                url: Some("https://google.com".to_string()),
                icon: None,
                is_active: true,
                is_pinned: false,
                is_muted: false,
                panel_id: "main".to_string(),
                order: 0,
                state: None,
                created_at: Utc::now(),
                last_accessed: Utc::now(),
            },
        ],
        panels: vec![
            WorkspacePanel {
                id: "main".to_string(),
                panel_type: PanelType::Main,
                position: PanelPosition { x: 0.0, y: 0.0, row: 0, col: 0 },
                width: 100.0,
                height: 100.0,
                min_width: 200.0,
                min_height: 200.0,
                is_collapsed: false,
                is_maximized: false,
                active_tab_id: None,
            },
        ],
        is_default: false,
        is_pinned: false,
        last_accessed: Utc::now(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        settings: WorkspaceSettings {
            auto_save: true,
            save_interval_ms: 30000,
            sync_enabled: true,
            show_minimap: false,
            show_breadcrumbs: true,
            theme: "dark".to_string(),
        },
    };
    
    let mut workspaces = state.workspaces.lock().map_err(|e| format!("Lock error: {}", e))?;
    workspaces.insert(workspace.id.clone(), workspace.clone());
    
    Ok(workspace)
}

#[tauri::command]
pub async fn ws_mgr_get_all(
    state: State<'_, WorkspaceState>,
) -> Result<Vec<Workspace>, String> {
    let workspaces = state.workspaces.lock().map_err(|e| format!("Lock error: {}", e))?;
    let mut result: Vec<Workspace> = workspaces.values().cloned().collect();
    result.sort_by(|a, b| b.last_accessed.cmp(&a.last_accessed));
    Ok(result)
}

#[tauri::command]
pub async fn ws_mgr_get(
    state: State<'_, WorkspaceState>,
    workspace_id: String,
) -> Result<Workspace, String> {
    let workspaces = state.workspaces.lock().map_err(|e| format!("Lock error: {}", e))?;
    workspaces.get(&workspace_id)
        .cloned()
        .ok_or_else(|| "Workspace not found".to_string())
}

#[tauri::command]
pub async fn ws_mgr_get_active(
    state: State<'_, WorkspaceState>,
) -> Result<Option<Workspace>, String> {
    let active_id = state.active_workspace_id.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(id) = active_id.as_ref() {
        let workspaces = state.workspaces.lock().map_err(|e| format!("Lock error: {}", e))?;
        Ok(workspaces.get(id).cloned())
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub async fn ws_mgr_set_active(
    state: State<'_, WorkspaceState>,
    workspace_id: String,
) -> Result<Workspace, String> {
    // Update active workspace ID
    {
        let mut active_id = state.active_workspace_id.lock().map_err(|e| format!("Lock error: {}", e))?;
        *active_id = Some(workspace_id.clone());
    }
    
    // Update last accessed
    let mut workspaces = state.workspaces.lock().map_err(|e| format!("Lock error: {}", e))?;
    let workspace = workspaces.get_mut(&workspace_id)
        .ok_or_else(|| "Workspace not found".to_string())?;
    
    workspace.last_accessed = Utc::now();
    
    Ok(workspace.clone())
}

#[tauri::command]
pub async fn ws_mgr_update(
    state: State<'_, WorkspaceState>,
    workspace_id: String,
    name: Option<String>,
    description: Option<String>,
    icon: Option<String>,
    color: Option<String>,
) -> Result<Workspace, String> {
    let mut workspaces = state.workspaces.lock().map_err(|e| format!("Lock error: {}", e))?;
    let workspace = workspaces.get_mut(&workspace_id)
        .ok_or_else(|| "Workspace not found".to_string())?;
    
    if let Some(n) = name { workspace.name = n; }
    if let Some(d) = description { workspace.description = Some(d); }
    if let Some(i) = icon { workspace.icon = Some(i); }
    if let Some(c) = color { workspace.color = Some(c); }
    
    workspace.updated_at = Utc::now();
    
    Ok(workspace.clone())
}

#[tauri::command]
pub async fn ws_mgr_delete(
    state: State<'_, WorkspaceState>,
    workspace_id: String,
) -> Result<bool, String> {
    let mut workspaces = state.workspaces.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    // Don't delete default workspace
    if let Some(ws) = workspaces.get(&workspace_id) {
        if ws.is_default {
            return Err("Cannot delete default workspace".to_string());
        }
    }
    
    if workspaces.remove(&workspace_id).is_some() {
        Ok(true)
    } else {
        Err("Workspace not found".to_string())
    }
}

// ============================================================
// TAB COMMANDS
// ============================================================

#[derive(Debug, Deserialize)]
pub struct CreateTabRequest {
    pub workspace_id: String,
    pub title: String,
    pub tab_type: TabType,
    pub url: Option<String>,
    pub panel_id: String,
}

#[tauri::command]
pub async fn ws_mgr_create_tab(
    state: State<'_, WorkspaceState>,
    request: CreateTabRequest,
) -> Result<WorkspaceTab, String> {
    let mut workspaces = state.workspaces.lock().map_err(|e| format!("Lock error: {}", e))?;
    let workspace = workspaces.get_mut(&request.workspace_id)
        .ok_or_else(|| "Workspace not found".to_string())?;
    
    let max_order = workspace.tabs.iter().map(|t| t.order).max().unwrap_or(0);
    
    let tab = WorkspaceTab {
        id: Uuid::new_v4().to_string(),
        title: request.title,
        tab_type: request.tab_type,
        url: request.url,
        icon: None,
        is_active: true,
        is_pinned: false,
        is_muted: false,
        panel_id: request.panel_id,
        order: max_order + 1,
        state: None,
        created_at: Utc::now(),
        last_accessed: Utc::now(),
    };
    
    // Deactivate other tabs
    for t in &mut workspace.tabs {
        t.is_active = false;
    }
    
    workspace.tabs.push(tab.clone());
    workspace.updated_at = Utc::now();
    
    Ok(tab)
}

#[tauri::command]
pub async fn ws_mgr_get_tabs(
    state: State<'_, WorkspaceState>,
    workspace_id: String,
) -> Result<Vec<WorkspaceTab>, String> {
    let workspaces = state.workspaces.lock().map_err(|e| format!("Lock error: {}", e))?;
    let workspace = workspaces.get(&workspace_id)
        .ok_or_else(|| "Workspace not found".to_string())?;
    
    let mut tabs = workspace.tabs.clone();
    tabs.sort_by(|a, b| a.order.cmp(&b.order));
    
    Ok(tabs)
}

#[tauri::command]
pub async fn ws_mgr_activate_tab(
    state: State<'_, WorkspaceState>,
    workspace_id: String,
    tab_id: String,
) -> Result<WorkspaceTab, String> {
    let mut workspaces = state.workspaces.lock().map_err(|e| format!("Lock error: {}", e))?;
    let workspace = workspaces.get_mut(&workspace_id)
        .ok_or_else(|| "Workspace not found".to_string())?;
    
    let mut activated_tab: Option<WorkspaceTab> = None;
    
    for tab in &mut workspace.tabs {
        if tab.id == tab_id {
            tab.is_active = true;
            tab.last_accessed = Utc::now();
            activated_tab = Some(tab.clone());
        } else {
            tab.is_active = false;
        }
    }
    
    workspace.updated_at = Utc::now();
    
    activated_tab.ok_or_else(|| "Tab not found".to_string())
}

#[tauri::command]
pub async fn ws_mgr_update_tab(
    state: State<'_, WorkspaceState>,
    workspace_id: String,
    tab_id: String,
    title: Option<String>,
    url: Option<String>,
    is_pinned: Option<bool>,
    is_muted: Option<bool>,
) -> Result<WorkspaceTab, String> {
    let mut workspaces = state.workspaces.lock().map_err(|e| format!("Lock error: {}", e))?;
    let workspace = workspaces.get_mut(&workspace_id)
        .ok_or_else(|| "Workspace not found".to_string())?;
    
    let tab = workspace.tabs.iter_mut().find(|t| t.id == tab_id)
        .ok_or_else(|| "Tab not found".to_string())?;
    
    if let Some(t) = title { tab.title = t; }
    if let Some(u) = url { tab.url = Some(u); }
    if let Some(p) = is_pinned { tab.is_pinned = p; }
    if let Some(m) = is_muted { tab.is_muted = m; }
    
    workspace.updated_at = Utc::now();
    
    Ok(tab.clone())
}

#[tauri::command]
pub async fn ws_mgr_close_tab(
    state: State<'_, WorkspaceState>,
    workspace_id: String,
    tab_id: String,
) -> Result<bool, String> {
    let mut workspaces = state.workspaces.lock().map_err(|e| format!("Lock error: {}", e))?;
    let workspace = workspaces.get_mut(&workspace_id)
        .ok_or_else(|| "Workspace not found".to_string())?;
    
    let was_active = workspace.tabs.iter().find(|t| t.id == tab_id).map(|t| t.is_active).unwrap_or(false);
    
    workspace.tabs.retain(|t| t.id != tab_id);
    
    // If closed tab was active, activate the last tab
    if was_active && !workspace.tabs.is_empty() {
        let last_idx = workspace.tabs.len() - 1;
        workspace.tabs[last_idx].is_active = true;
    }
    
    workspace.updated_at = Utc::now();
    
    Ok(true)
}

#[tauri::command]
pub async fn ws_mgr_reorder_tabs(
    state: State<'_, WorkspaceState>,
    workspace_id: String,
    tab_orders: Vec<(String, u32)>,
) -> Result<Vec<WorkspaceTab>, String> {
    let mut workspaces = state.workspaces.lock().map_err(|e| format!("Lock error: {}", e))?;
    let workspace = workspaces.get_mut(&workspace_id)
        .ok_or_else(|| "Workspace not found".to_string())?;
    
    for (tab_id, order) in tab_orders {
        if let Some(tab) = workspace.tabs.iter_mut().find(|t| t.id == tab_id) {
            tab.order = order;
        }
    }
    
    workspace.tabs.sort_by(|a, b| a.order.cmp(&b.order));
    workspace.updated_at = Utc::now();
    
    Ok(workspace.tabs.clone())
}

// ============================================================
// LAYOUT COMMANDS
// ============================================================

#[tauri::command]
pub async fn ws_mgr_update_layout(
    state: State<'_, WorkspaceState>,
    workspace_id: String,
    layout_type: Option<LayoutType>,
    main_panel_width: Option<f64>,
    sidebar_width: Option<f64>,
    bottom_panel_height: Option<f64>,
    show_sidebar: Option<bool>,
    show_bottom_panel: Option<bool>,
) -> Result<WorkspaceLayout, String> {
    let mut workspaces = state.workspaces.lock().map_err(|e| format!("Lock error: {}", e))?;
    let workspace = workspaces.get_mut(&workspace_id)
        .ok_or_else(|| "Workspace not found".to_string())?;
    
    if let Some(lt) = layout_type { workspace.layout.layout_type = lt; }
    if let Some(w) = main_panel_width { workspace.layout.main_panel_width = w; }
    if let Some(w) = sidebar_width { workspace.layout.sidebar_width = w; }
    if let Some(h) = bottom_panel_height { workspace.layout.bottom_panel_height = h; }
    if let Some(s) = show_sidebar { workspace.layout.show_sidebar = s; }
    if let Some(b) = show_bottom_panel { workspace.layout.show_bottom_panel = b; }
    
    workspace.updated_at = Utc::now();
    
    Ok(workspace.layout.clone())
}

// ============================================================
// NOTE COMMANDS
// ============================================================

#[derive(Debug, Deserialize)]
pub struct CreateNoteRequest {
    pub workspace_id: String,
    pub title: String,
    pub content: String,
    pub format: Option<NoteFormat>,
    pub tags: Vec<String>,
    pub color: Option<String>,
}

#[tauri::command]
pub async fn ws_mgr_create_note(
    state: State<'_, WorkspaceState>,
    request: CreateNoteRequest,
) -> Result<WorkspaceNote, String> {
    let note = WorkspaceNote {
        id: Uuid::new_v4().to_string(),
        workspace_id: request.workspace_id,
        title: request.title,
        content: request.content,
        format: request.format.unwrap_or(NoteFormat::Markdown),
        tags: request.tags,
        is_pinned: false,
        color: request.color,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };
    
    let mut notes = state.notes.lock().map_err(|e| format!("Lock error: {}", e))?;
    notes.insert(note.id.clone(), note.clone());
    
    Ok(note)
}

#[tauri::command]
pub async fn ws_mgr_get_notes(
    state: State<'_, WorkspaceState>,
    workspace_id: String,
) -> Result<Vec<WorkspaceNote>, String> {
    let notes = state.notes.lock().map_err(|e| format!("Lock error: {}", e))?;
    let mut result: Vec<WorkspaceNote> = notes.values()
        .filter(|n| n.workspace_id == workspace_id)
        .cloned()
        .collect();
    
    result.sort_by(|a, b| {
        match (a.is_pinned, b.is_pinned) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => b.updated_at.cmp(&a.updated_at),
        }
    });
    
    Ok(result)
}

#[tauri::command]
pub async fn ws_mgr_update_note(
    state: State<'_, WorkspaceState>,
    note_id: String,
    title: Option<String>,
    content: Option<String>,
    tags: Option<Vec<String>>,
    is_pinned: Option<bool>,
    color: Option<String>,
) -> Result<WorkspaceNote, String> {
    let mut notes = state.notes.lock().map_err(|e| format!("Lock error: {}", e))?;
    let note = notes.get_mut(&note_id)
        .ok_or_else(|| "Note not found".to_string())?;
    
    if let Some(t) = title { note.title = t; }
    if let Some(c) = content { note.content = c; }
    if let Some(t) = tags { note.tags = t; }
    if let Some(p) = is_pinned { note.is_pinned = p; }
    if let Some(c) = color { note.color = Some(c); }
    
    note.updated_at = Utc::now();
    
    Ok(note.clone())
}

#[tauri::command]
pub async fn ws_mgr_delete_note(
    state: State<'_, WorkspaceState>,
    note_id: String,
) -> Result<bool, String> {
    let mut notes = state.notes.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    if notes.remove(&note_id).is_some() {
        Ok(true)
    } else {
        Err("Note not found".to_string())
    }
}

// ============================================================
// TASK COMMANDS
// ============================================================

#[derive(Debug, Deserialize)]
pub struct CreateTaskRequest {
    pub workspace_id: String,
    pub title: String,
    pub description: Option<String>,
    pub priority: Option<TaskPriority>,
    pub due_date: Option<String>,
    pub assigned_to: Option<String>,
    pub tags: Vec<String>,
}

#[tauri::command]
pub async fn ws_mgr_create_task(
    state: State<'_, WorkspaceState>,
    request: CreateTaskRequest,
) -> Result<WorkspaceTask, String> {
    let due_date = request.due_date.and_then(|d| {
        DateTime::parse_from_rfc3339(&d).ok().map(|dt| dt.with_timezone(&Utc))
    });
    
    let task = WorkspaceTask {
        id: Uuid::new_v4().to_string(),
        workspace_id: request.workspace_id,
        title: request.title,
        description: request.description,
        status: TaskStatus::Todo,
        priority: request.priority.unwrap_or(TaskPriority::Medium),
        due_date,
        completed_at: None,
        assigned_to: request.assigned_to,
        tags: request.tags,
        subtasks: Vec::new(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };
    
    let mut tasks = state.tasks.lock().map_err(|e| format!("Lock error: {}", e))?;
    tasks.insert(task.id.clone(), task.clone());
    
    Ok(task)
}

#[tauri::command]
pub async fn ws_mgr_get_tasks(
    state: State<'_, WorkspaceState>,
    workspace_id: String,
    status_filter: Option<String>,
) -> Result<Vec<WorkspaceTask>, String> {
    let tasks = state.tasks.lock().map_err(|e| format!("Lock error: {}", e))?;
    let mut result: Vec<WorkspaceTask> = tasks.values()
        .filter(|t| t.workspace_id == workspace_id)
        .filter(|t| {
            status_filter.as_ref().map_or(true, |s| {
                s == "all" || format!("{:?}", t.status).to_lowercase() == s.to_lowercase()
            })
        })
        .cloned()
        .collect();
    
    // Sort by priority, then by due date
    result.sort_by(|a, b| {
        let priority_order = |p: &TaskPriority| match p {
            TaskPriority::Urgent => 0,
            TaskPriority::High => 1,
            TaskPriority::Medium => 2,
            TaskPriority::Low => 3,
        };
        
        match priority_order(&a.priority).cmp(&priority_order(&b.priority)) {
            std::cmp::Ordering::Equal => {
                match (&a.due_date, &b.due_date) {
                    (Some(da), Some(db)) => da.cmp(db),
                    (Some(_), None) => std::cmp::Ordering::Less,
                    (None, Some(_)) => std::cmp::Ordering::Greater,
                    (None, None) => b.created_at.cmp(&a.created_at),
                }
            }
            other => other,
        }
    });
    
    Ok(result)
}

#[tauri::command]
pub async fn ws_mgr_update_task(
    state: State<'_, WorkspaceState>,
    task_id: String,
    title: Option<String>,
    description: Option<String>,
    status: Option<TaskStatus>,
    priority: Option<TaskPriority>,
    due_date: Option<String>,
    tags: Option<Vec<String>>,
) -> Result<WorkspaceTask, String> {
    let mut tasks = state.tasks.lock().map_err(|e| format!("Lock error: {}", e))?;
    let task = tasks.get_mut(&task_id)
        .ok_or_else(|| "Task not found".to_string())?;
    
    if let Some(t) = title { task.title = t; }
    if let Some(d) = description { task.description = Some(d); }
    if let Some(s) = status { 
        task.status = s.clone();
        if s == TaskStatus::Done {
            task.completed_at = Some(Utc::now());
        }
    }
    if let Some(p) = priority { task.priority = p; }
    if let Some(d) = due_date {
        task.due_date = DateTime::parse_from_rfc3339(&d).ok().map(|dt| dt.with_timezone(&Utc));
    }
    if let Some(t) = tags { task.tags = t; }
    
    task.updated_at = Utc::now();
    
    Ok(task.clone())
}

#[tauri::command]
pub async fn ws_mgr_delete_task(
    state: State<'_, WorkspaceState>,
    task_id: String,
) -> Result<bool, String> {
    let mut tasks = state.tasks.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    if tasks.remove(&task_id).is_some() {
        Ok(true)
    } else {
        Err("Task not found".to_string())
    }
}

#[tauri::command]
pub async fn ws_mgr_add_subtask(
    state: State<'_, WorkspaceState>,
    task_id: String,
    title: String,
) -> Result<WorkspaceTask, String> {
    let mut tasks = state.tasks.lock().map_err(|e| format!("Lock error: {}", e))?;
    let task = tasks.get_mut(&task_id)
        .ok_or_else(|| "Task not found".to_string())?;
    
    task.subtasks.push(SubTask {
        id: Uuid::new_v4().to_string(),
        title,
        is_completed: false,
    });
    
    task.updated_at = Utc::now();
    
    Ok(task.clone())
}

#[tauri::command]
pub async fn ws_mgr_toggle_subtask(
    state: State<'_, WorkspaceState>,
    task_id: String,
    subtask_id: String,
) -> Result<WorkspaceTask, String> {
    let mut tasks = state.tasks.lock().map_err(|e| format!("Lock error: {}", e))?;
    let task = tasks.get_mut(&task_id)
        .ok_or_else(|| "Task not found".to_string())?;
    
    if let Some(subtask) = task.subtasks.iter_mut().find(|s| s.id == subtask_id) {
        subtask.is_completed = !subtask.is_completed;
    }
    
    task.updated_at = Utc::now();
    
    Ok(task.clone())
}

// ============================================================
// SESSION COMMANDS
// ============================================================

#[tauri::command]
pub async fn ws_mgr_save_session(
    state: State<'_, WorkspaceState>,
    workspace_id: String,
    name: String,
) -> Result<WorkspaceSession, String> {
    let workspaces = state.workspaces.lock().map_err(|e| format!("Lock error: {}", e))?;
    let workspace = workspaces.get(&workspace_id)
        .ok_or_else(|| "Workspace not found".to_string())?;
    
    let snapshot = serde_json::to_string(workspace).map_err(|e| e.to_string())?;
    
    let session = WorkspaceSession {
        id: Uuid::new_v4().to_string(),
        workspace_id,
        name,
        snapshot,
        created_at: Utc::now(),
    };
    
    drop(workspaces);
    
    let mut sessions = state.sessions.lock().map_err(|e| format!("Lock error: {}", e))?;
    sessions.insert(session.id.clone(), session.clone());
    
    Ok(session)
}

#[tauri::command]
pub async fn ws_mgr_get_sessions(
    state: State<'_, WorkspaceState>,
    workspace_id: String,
) -> Result<Vec<WorkspaceSession>, String> {
    let sessions = state.sessions.lock().map_err(|e| format!("Lock error: {}", e))?;
    let mut result: Vec<WorkspaceSession> = sessions.values()
        .filter(|s| s.workspace_id == workspace_id)
        .cloned()
        .collect();
    
    result.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    
    Ok(result)
}

#[tauri::command]
pub async fn ws_mgr_restore_session(
    state: State<'_, WorkspaceState>,
    session_id: String,
) -> Result<Workspace, String> {
    let sessions = state.sessions.lock().map_err(|e| format!("Lock error: {}", e))?;
    let session = sessions.get(&session_id)
        .ok_or_else(|| "Session not found".to_string())?;
    
    let workspace: Workspace = serde_json::from_str(&session.snapshot)
        .map_err(|e| format!("Failed to restore session: {}", e))?;
    
    drop(sessions);
    
    let mut workspaces = state.workspaces.lock().map_err(|e| format!("Lock error: {}", e))?;
    workspaces.insert(workspace.id.clone(), workspace.clone());
    
    Ok(workspace)
}

#[tauri::command]
pub async fn ws_mgr_delete_session(
    state: State<'_, WorkspaceState>,
    session_id: String,
) -> Result<bool, String> {
    let mut sessions = state.sessions.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    if sessions.remove(&session_id).is_some() {
        Ok(true)
    } else {
        Err("Session not found".to_string())
    }
}

// ============================================================
// EXPORT/IMPORT COMMANDS
// ============================================================

#[tauri::command]
pub async fn ws_mgr_export(
    state: State<'_, WorkspaceState>,
    workspace_id: String,
) -> Result<String, String> {
    let workspaces = state.workspaces.lock().map_err(|e| format!("Lock error: {}", e))?;
    let workspace = workspaces.get(&workspace_id)
        .ok_or_else(|| "Workspace not found".to_string())?;
    
    let notes = state.notes.lock().map_err(|e| format!("Lock error: {}", e))?;
    let workspace_notes: Vec<&WorkspaceNote> = notes.values()
        .filter(|n| n.workspace_id == workspace_id)
        .collect();
    
    let tasks = state.tasks.lock().map_err(|e| format!("Lock error: {}", e))?;
    let workspace_tasks: Vec<&WorkspaceTask> = tasks.values()
        .filter(|t| t.workspace_id == workspace_id)
        .collect();
    
    #[derive(Serialize)]
    struct WorkspaceExport<'a> {
        workspace: &'a Workspace,
        notes: Vec<&'a WorkspaceNote>,
        tasks: Vec<&'a WorkspaceTask>,
    }
    
    let export = WorkspaceExport {
        workspace,
        notes: workspace_notes,
        tasks: workspace_tasks,
    };
    
    serde_json::to_string_pretty(&export).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn ws_mgr_import(
    state: State<'_, WorkspaceState>,
    data: String,
) -> Result<Workspace, String> {
    #[derive(Deserialize)]
    struct WorkspaceImport {
        workspace: Workspace,
        notes: Vec<WorkspaceNote>,
        tasks: Vec<WorkspaceTask>,
    }
    
    let import: WorkspaceImport = serde_json::from_str(&data)
        .map_err(|e| format!("Invalid import data: {}", e))?;
    
    // Generate new ID to avoid conflicts
    let mut workspace = import.workspace;
    let _old_id = workspace.id.clone();
    workspace.id = Uuid::new_v4().to_string();
    workspace.is_default = false;
    workspace.created_at = Utc::now();
    workspace.updated_at = Utc::now();
    
    let mut workspaces = state.workspaces.lock().map_err(|e| format!("Lock error: {}", e))?;
    workspaces.insert(workspace.id.clone(), workspace.clone());
    
    drop(workspaces);
    
    // Import notes with new workspace ID
    let mut notes = state.notes.lock().map_err(|e| format!("Lock error: {}", e))?;
    for mut note in import.notes {
        note.id = Uuid::new_v4().to_string();
        note.workspace_id = workspace.id.clone();
        notes.insert(note.id.clone(), note);
    }
    
    drop(notes);
    
    // Import tasks with new workspace ID
    let mut tasks = state.tasks.lock().map_err(|e| format!("Lock error: {}", e))?;
    for mut task in import.tasks {
        task.id = Uuid::new_v4().to_string();
        task.workspace_id = workspace.id.clone();
        tasks.insert(task.id.clone(), task);
    }
    
    Ok(workspace)
}
