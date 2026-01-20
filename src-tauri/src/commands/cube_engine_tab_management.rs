// CUBE Engine Advanced Tab Management
// Tab hibernation, groups, PiP, previews, and advanced tab features

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::RwLock;
use tauri::{AppHandle, Emitter, State};

// ============================================
// Tab Management State
// ============================================

pub struct CubeTabManagementState {
    pub hibernated_tabs: RwLock<HashMap<String, HibernatedTab>>,
    pub tab_groups: RwLock<HashMap<String, TabGroup>>,
    pub pip_windows: RwLock<HashMap<String, PipWindow>>,
    pub tab_previews: RwLock<HashMap<String, TabPreview>>,
    pub tab_stacks: RwLock<HashMap<String, TabStack>>,
    pub tab_sessions: RwLock<HashMap<String, TabSession>>,
    pub config: RwLock<TabManagementConfig>,
}

impl Default for CubeTabManagementState {
    fn default() -> Self {
        Self {
            hibernated_tabs: RwLock::new(HashMap::new()),
            tab_groups: RwLock::new(HashMap::new()),
            pip_windows: RwLock::new(HashMap::new()),
            tab_previews: RwLock::new(HashMap::new()),
            tab_stacks: RwLock::new(HashMap::new()),
            tab_sessions: RwLock::new(HashMap::new()),
            config: RwLock::new(TabManagementConfig::default()),
        }
    }
}

// ============================================
// Tab Hibernation/Suspend
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HibernatedTab {
    pub tab_id: String,
    pub url: String,
    pub title: String,
    pub favicon: Option<String>,
    pub scroll_position: ScrollPosition,
    pub form_data: HashMap<String, String>,
    pub session_storage: HashMap<String, String>,
    pub hibernated_at: i64,
    pub memory_saved_mb: f64,
    pub reason: HibernationReason,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ScrollPosition {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum HibernationReason {
    #[default]
    Manual,
    AutoIdle,
    MemoryPressure,
    TabLimit,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TabSuspendConfig {
    pub auto_suspend_enabled: bool,
    pub idle_timeout_minutes: u32,
    pub exclude_pinned: bool,
    pub exclude_playing_media: bool,
    pub exclude_active_downloads: bool,
    pub max_active_tabs: u32,
    pub memory_threshold_mb: u32,
}

impl Default for TabSuspendConfig {
    fn default() -> Self {
        Self {
            auto_suspend_enabled: true,
            idle_timeout_minutes: 30,
            exclude_pinned: true,
            exclude_playing_media: true,
            exclude_active_downloads: true,
            max_active_tabs: 10,
            memory_threshold_mb: 2048,
        }
    }
}

// ============================================
// Tab Groups
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TabGroup {
    pub id: String,
    pub name: String,
    pub color: TabGroupColor,
    pub tab_ids: Vec<String>,
    pub is_collapsed: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum TabGroupColor {
    #[default]
    Grey,
    Blue,
    Red,
    Yellow,
    Green,
    Pink,
    Purple,
    Cyan,
    Orange,
}

impl TabGroupColor {
    pub fn to_hex(&self) -> &str {
        match self {
            TabGroupColor::Grey => "#5f6368",
            TabGroupColor::Blue => "#1a73e8",
            TabGroupColor::Red => "#d93025",
            TabGroupColor::Yellow => "#f9ab00",
            TabGroupColor::Green => "#1e8e3e",
            TabGroupColor::Pink => "#d01884",
            TabGroupColor::Purple => "#9334e6",
            TabGroupColor::Cyan => "#007b83",
            TabGroupColor::Orange => "#e8710a",
        }
    }
}

// ============================================
// Picture-in-Picture
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PipWindow {
    pub id: String,
    pub tab_id: String,
    pub media_element_id: String,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub is_playing: bool,
    pub volume: f64,
    pub is_muted: bool,
    pub duration: f64,
    pub current_time: f64,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PipConfig {
    pub default_width: f64,
    pub default_height: f64,
    pub always_on_top: bool,
    pub auto_pip_enabled: bool,
    pub remember_position: bool,
    pub show_controls: bool,
}

impl Default for PipConfig {
    fn default() -> Self {
        Self {
            default_width: 400.0,
            default_height: 225.0,
            always_on_top: true,
            auto_pip_enabled: false,
            remember_position: true,
            show_controls: true,
        }
    }
}

// ============================================
// Tab Previews
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TabPreview {
    pub tab_id: String,
    pub thumbnail_data: String,
    pub thumbnail_width: u32,
    pub thumbnail_height: u32,
    pub captured_at: i64,
    pub is_stale: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TabPreviewConfig {
    pub enabled: bool,
    pub thumbnail_width: u32,
    pub thumbnail_height: u32,
    pub capture_interval_ms: u32,
    pub hover_delay_ms: u32,
    pub cache_duration_minutes: u32,
}

impl Default for TabPreviewConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            thumbnail_width: 200,
            thumbnail_height: 150,
            capture_interval_ms: 5000,
            hover_delay_ms: 300,
            cache_duration_minutes: 30,
        }
    }
}

// ============================================
// Tab Stacks (Vivaldi-style)
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TabStack {
    pub id: String,
    pub name: String,
    pub tab_ids: Vec<String>,
    pub active_tab_index: usize,
    pub layout: TabStackLayout,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum TabStackLayout {
    #[default]
    Horizontal,
    Vertical,
    Grid,
}

// ============================================
// Tab Sessions
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TabSession {
    pub id: String,
    pub name: String,
    pub tabs: Vec<SessionTab>,
    pub created_at: i64,
    pub updated_at: i64,
    pub is_auto_save: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionTab {
    pub url: String,
    pub title: String,
    pub favicon: Option<String>,
    pub pinned: bool,
    pub group_id: Option<String>,
    pub scroll_position: ScrollPosition,
}

// ============================================
// Tab Management Config
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TabManagementConfig {
    pub suspend: TabSuspendConfig,
    pub preview: TabPreviewConfig,
    pub pip: PipConfig,
    pub vertical_tabs: bool,
    pub tab_search_enabled: bool,
    pub duplicate_detection: bool,
    pub auto_discard_duplicates: bool,
    pub max_tabs_warning: u32,
    pub close_tabs_to_right: bool,
    pub close_other_tabs: bool,
    pub reopen_closed_tab: bool,
    pub max_recently_closed: u32,
}

impl Default for TabManagementConfig {
    fn default() -> Self {
        Self {
            suspend: TabSuspendConfig::default(),
            preview: TabPreviewConfig::default(),
            pip: PipConfig::default(),
            vertical_tabs: false,
            tab_search_enabled: true,
            duplicate_detection: true,
            auto_discard_duplicates: false,
            max_tabs_warning: 50,
            close_tabs_to_right: true,
            close_other_tabs: true,
            reopen_closed_tab: true,
            max_recently_closed: 25,
        }
    }
}

// ============================================
// Tauri Commands - Tab Hibernation
// ============================================

#[tauri::command]
pub async fn tab_hibernate(
    state: State<'_, CubeTabManagementState>,
    app: AppHandle,
    tab_id: String,
    url: String,
    title: String,
    favicon: Option<String>,
    scroll_position: Option<ScrollPosition>,
    form_data: Option<HashMap<String, String>>,
) -> Result<HibernatedTab, String> {
    let now = chrono::Utc::now().timestamp_millis();
    
    let hibernated = HibernatedTab {
        tab_id: tab_id.clone(),
        url,
        title,
        favicon,
        scroll_position: scroll_position.unwrap_or_default(),
        form_data: form_data.unwrap_or_default(),
        session_storage: HashMap::new(),
        hibernated_at: now,
        memory_saved_mb: 50.0,
        reason: HibernationReason::Manual,
    };
    
    let mut tabs = state.hibernated_tabs.write().map_err(|e| format!("Lock error: {}", e))?;
    tabs.insert(tab_id.clone(), hibernated.clone());
    
    let _ = app.emit("tab-hibernated", &hibernated);
    
    Ok(hibernated)
}

#[tauri::command]
pub async fn tab_wake(
    state: State<'_, CubeTabManagementState>,
    app: AppHandle,
    tab_id: String,
) -> Result<Option<HibernatedTab>, String> {
    let mut tabs = state.hibernated_tabs.write().map_err(|e| format!("Lock error: {}", e))?;
    let hibernated = tabs.remove(&tab_id);
    
    if let Some(ref h) = hibernated {
        let _ = app.emit("tab-woken", h);
    }
    
    Ok(hibernated)
}

#[tauri::command]
pub async fn tab_get_hibernated(
    state: State<'_, CubeTabManagementState>,
) -> Result<Vec<HibernatedTab>, String> {
    let tabs = state.hibernated_tabs.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(tabs.values().cloned().collect())
}

#[tauri::command]
pub async fn tab_is_hibernated(
    state: State<'_, CubeTabManagementState>,
    tab_id: String,
) -> Result<bool, String> {
    let tabs = state.hibernated_tabs.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(tabs.contains_key(&tab_id))
}

#[tauri::command]
pub async fn tab_auto_hibernate_check(
    state: State<'_, CubeTabManagementState>,
    active_tab_ids: Vec<String>,
    tab_last_accessed: HashMap<String, i64>,
) -> Result<Vec<String>, String> {
    let config = state.config.read().map_err(|e| format!("Lock error: {}", e))?;
    
    if !config.suspend.auto_suspend_enabled {
        return Ok(vec![]);
    }
    
    let now = chrono::Utc::now().timestamp_millis();
    let timeout_ms = (config.suspend.idle_timeout_minutes as i64) * 60 * 1000;
    
    let mut to_hibernate = Vec::new();
    
    for (tab_id, last_accessed) in tab_last_accessed {
        if !active_tab_ids.contains(&tab_id) && (now - last_accessed) > timeout_ms {
            to_hibernate.push(tab_id);
        }
    }
    
    Ok(to_hibernate)
}

// ============================================
// Tauri Commands - Tab Groups
// ============================================

#[tauri::command]
pub async fn tab_group_create(
    state: State<'_, CubeTabManagementState>,
    app: AppHandle,
    name: String,
    color: Option<TabGroupColor>,
    tab_ids: Option<Vec<String>>,
) -> Result<TabGroup, String> {
    let group_id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp_millis();
    
    let group = TabGroup {
        id: group_id.clone(),
        name,
        color: color.unwrap_or_default(),
        tab_ids: tab_ids.unwrap_or_default(),
        is_collapsed: false,
        created_at: now,
        updated_at: now,
    };
    
    let mut groups = state.tab_groups.write().map_err(|e| format!("Lock error: {}", e))?;
    groups.insert(group_id, group.clone());
    
    let _ = app.emit("tab-group-created", &group);
    
    Ok(group)
}

#[tauri::command]
pub async fn tab_group_get(
    state: State<'_, CubeTabManagementState>,
    group_id: String,
) -> Result<Option<TabGroup>, String> {
    let groups = state.tab_groups.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(groups.get(&group_id).cloned())
}

#[tauri::command]
pub async fn tab_group_list(
    state: State<'_, CubeTabManagementState>,
) -> Result<Vec<TabGroup>, String> {
    let groups = state.tab_groups.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(groups.values().cloned().collect())
}

#[tauri::command]
pub async fn tab_group_update(
    state: State<'_, CubeTabManagementState>,
    app: AppHandle,
    group_id: String,
    name: Option<String>,
    color: Option<TabGroupColor>,
) -> Result<TabGroup, String> {
    let mut groups = state.tab_groups.write().map_err(|e| format!("Lock error: {}", e))?;
    
    let group = groups.get_mut(&group_id).ok_or("Group not found")?;
    
    if let Some(n) = name {
        group.name = n;
    }
    if let Some(c) = color {
        group.color = c;
    }
    group.updated_at = chrono::Utc::now().timestamp_millis();
    
    let updated = group.clone();
    let _ = app.emit("tab-group-updated", &updated);
    
    Ok(updated)
}

#[tauri::command]
pub async fn tab_group_delete(
    state: State<'_, CubeTabManagementState>,
    app: AppHandle,
    group_id: String,
) -> Result<(), String> {
    let mut groups = state.tab_groups.write().map_err(|e| format!("Lock error: {}", e))?;
    groups.remove(&group_id);
    
    let _ = app.emit("tab-group-deleted", serde_json::json!({ "groupId": group_id }));
    
    Ok(())
}

#[tauri::command]
pub async fn tab_group_add_tab(
    state: State<'_, CubeTabManagementState>,
    app: AppHandle,
    group_id: String,
    tab_id: String,
) -> Result<(), String> {
    let mut groups = state.tab_groups.write().map_err(|e| format!("Lock error: {}", e))?;
    
    let group = groups.get_mut(&group_id).ok_or("Group not found")?;
    
    if !group.tab_ids.contains(&tab_id) {
        group.tab_ids.push(tab_id.clone());
        group.updated_at = chrono::Utc::now().timestamp_millis();
    }
    
    let _ = app.emit("tab-added-to-group", serde_json::json!({
        "groupId": group_id,
        "tabId": tab_id
    }));
    
    Ok(())
}

#[tauri::command]
pub async fn tab_group_remove_tab(
    state: State<'_, CubeTabManagementState>,
    app: AppHandle,
    group_id: String,
    tab_id: String,
) -> Result<(), String> {
    let mut groups = state.tab_groups.write().map_err(|e| format!("Lock error: {}", e))?;
    
    let group = groups.get_mut(&group_id).ok_or("Group not found")?;
    group.tab_ids.retain(|id| id != &tab_id);
    group.updated_at = chrono::Utc::now().timestamp_millis();
    
    let _ = app.emit("tab-removed-from-group", serde_json::json!({
        "groupId": group_id,
        "tabId": tab_id
    }));
    
    Ok(())
}

#[tauri::command]
pub async fn tab_group_toggle_collapse(
    state: State<'_, CubeTabManagementState>,
    app: AppHandle,
    group_id: String,
) -> Result<bool, String> {
    let mut groups = state.tab_groups.write().map_err(|e| format!("Lock error: {}", e))?;
    
    let group = groups.get_mut(&group_id).ok_or("Group not found")?;
    group.is_collapsed = !group.is_collapsed;
    
    let _ = app.emit("tab-group-collapse-toggled", serde_json::json!({
        "groupId": group_id,
        "isCollapsed": group.is_collapsed
    }));
    
    Ok(group.is_collapsed)
}

// ============================================
// Tauri Commands - Picture-in-Picture
// ============================================

#[tauri::command]
pub async fn pip_create(
    state: State<'_, CubeTabManagementState>,
    app: AppHandle,
    tab_id: String,
    media_element_id: String,
    x: Option<f64>,
    y: Option<f64>,
) -> Result<PipWindow, String> {
    let config = state.config.read().map_err(|e| format!("Lock error: {}", e))?;
    let pip_id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp_millis();
    
    let pip = PipWindow {
        id: pip_id.clone(),
        tab_id,
        media_element_id,
        x: x.unwrap_or(100.0),
        y: y.unwrap_or(100.0),
        width: config.pip.default_width,
        height: config.pip.default_height,
        is_playing: true,
        volume: 1.0,
        is_muted: false,
        duration: 0.0,
        current_time: 0.0,
        created_at: now,
    };
    
    let mut windows = state.pip_windows.write().map_err(|e| format!("Lock error: {}", e))?;
    windows.insert(pip_id, pip.clone());
    
    let _ = app.emit("pip-created", &pip);
    
    Ok(pip)
}

#[tauri::command]
pub async fn pip_close(
    state: State<'_, CubeTabManagementState>,
    app: AppHandle,
    pip_id: String,
) -> Result<(), String> {
    let mut windows = state.pip_windows.write().map_err(|e| format!("Lock error: {}", e))?;
    windows.remove(&pip_id);
    
    let _ = app.emit("pip-closed", serde_json::json!({ "pipId": pip_id }));
    
    Ok(())
}

#[tauri::command]
pub async fn engine_pip_update_position(
    state: State<'_, CubeTabManagementState>,
    pip_id: String,
    x: f64,
    y: f64,
) -> Result<(), String> {
    let mut windows = state.pip_windows.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(pip) = windows.get_mut(&pip_id) {
        pip.x = x;
        pip.y = y;
    }
    
    Ok(())
}

#[tauri::command]
pub async fn engine_pip_update_size(
    state: State<'_, CubeTabManagementState>,
    pip_id: String,
    width: f64,
    height: f64,
) -> Result<(), String> {
    let mut windows = state.pip_windows.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(pip) = windows.get_mut(&pip_id) {
        pip.width = width;
        pip.height = height;
    }
    
    Ok(())
}

#[tauri::command]
pub async fn pip_toggle_play(
    state: State<'_, CubeTabManagementState>,
    app: AppHandle,
    pip_id: String,
) -> Result<bool, String> {
    let mut windows = state.pip_windows.write().map_err(|e| format!("Lock error: {}", e))?;
    
    let pip = windows.get_mut(&pip_id).ok_or("PiP not found")?;
    pip.is_playing = !pip.is_playing;
    
    let _ = app.emit("pip-play-toggled", serde_json::json!({
        "pipId": pip_id,
        "isPlaying": pip.is_playing
    }));
    
    Ok(pip.is_playing)
}

#[tauri::command]
pub async fn engine_pip_set_volume(
    state: State<'_, CubeTabManagementState>,
    pip_id: String,
    volume: f64,
) -> Result<(), String> {
    let mut windows = state.pip_windows.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(pip) = windows.get_mut(&pip_id) {
        pip.volume = volume.clamp(0.0, 1.0);
        pip.is_muted = pip.volume == 0.0;
    }
    
    Ok(())
}

#[tauri::command]
pub async fn pip_get_all(
    state: State<'_, CubeTabManagementState>,
) -> Result<Vec<PipWindow>, String> {
    let windows = state.pip_windows.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(windows.values().cloned().collect())
}

// ============================================
// Tauri Commands - Tab Previews
// ============================================

#[tauri::command]
pub async fn engine_tab_preview_capture(
    state: State<'_, CubeTabManagementState>,
    tab_id: String,
    thumbnail_data: String,
    width: u32,
    height: u32,
) -> Result<TabPreview, String> {
    let now = chrono::Utc::now().timestamp_millis();
    
    let preview = TabPreview {
        tab_id: tab_id.clone(),
        thumbnail_data,
        thumbnail_width: width,
        thumbnail_height: height,
        captured_at: now,
        is_stale: false,
    };
    
    let mut previews = state.tab_previews.write().map_err(|e| format!("Lock error: {}", e))?;
    previews.insert(tab_id, preview.clone());
    
    Ok(preview)
}

#[tauri::command]
pub async fn engine_tab_preview_get(
    state: State<'_, CubeTabManagementState>,
    tab_id: String,
) -> Result<Option<TabPreview>, String> {
    let previews = state.tab_previews.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(previews.get(&tab_id).cloned())
}

#[tauri::command]
pub async fn tab_preview_invalidate(
    state: State<'_, CubeTabManagementState>,
    tab_id: String,
) -> Result<(), String> {
    let mut previews = state.tab_previews.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(preview) = previews.get_mut(&tab_id) {
        preview.is_stale = true;
    }
    
    Ok(())
}

#[tauri::command]
pub async fn tab_preview_clear_all(
    state: State<'_, CubeTabManagementState>,
) -> Result<usize, String> {
    let mut previews = state.tab_previews.write().map_err(|e| format!("Lock error: {}", e))?;
    let count = previews.len();
    previews.clear();
    Ok(count)
}

// ============================================
// Tauri Commands - Tab Sessions
// ============================================

#[tauri::command]
pub async fn tab_session_save(
    state: State<'_, CubeTabManagementState>,
    name: String,
    tabs: Vec<SessionTab>,
    is_auto_save: bool,
) -> Result<TabSession, String> {
    let session_id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp_millis();
    
    let session = TabSession {
        id: session_id.clone(),
        name,
        tabs,
        created_at: now,
        updated_at: now,
        is_auto_save,
    };
    
    let mut sessions = state.tab_sessions.write().map_err(|e| format!("Lock error: {}", e))?;
    sessions.insert(session_id, session.clone());
    
    Ok(session)
}

#[tauri::command]
pub async fn tab_session_get(
    state: State<'_, CubeTabManagementState>,
    session_id: String,
) -> Result<Option<TabSession>, String> {
    let sessions = state.tab_sessions.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(sessions.get(&session_id).cloned())
}

#[tauri::command]
pub async fn tab_session_list(
    state: State<'_, CubeTabManagementState>,
) -> Result<Vec<TabSession>, String> {
    let sessions = state.tab_sessions.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(sessions.values().cloned().collect())
}

#[tauri::command]
pub async fn tab_session_delete(
    state: State<'_, CubeTabManagementState>,
    session_id: String,
) -> Result<(), String> {
    let mut sessions = state.tab_sessions.write().map_err(|e| format!("Lock error: {}", e))?;
    sessions.remove(&session_id);
    Ok(())
}

#[tauri::command]
pub async fn tab_session_update(
    state: State<'_, CubeTabManagementState>,
    session_id: String,
    name: Option<String>,
    tabs: Option<Vec<SessionTab>>,
) -> Result<TabSession, String> {
    let mut sessions = state.tab_sessions.write().map_err(|e| format!("Lock error: {}", e))?;
    
    let session = sessions.get_mut(&session_id).ok_or("Session not found")?;
    
    if let Some(n) = name {
        session.name = n;
    }
    if let Some(t) = tabs {
        session.tabs = t;
    }
    session.updated_at = chrono::Utc::now().timestamp_millis();
    
    Ok(session.clone())
}

// ============================================
// Tauri Commands - Tab Management Config
// ============================================

#[tauri::command]
pub async fn tab_mgmt_get_config(
    state: State<'_, CubeTabManagementState>,
) -> Result<TabManagementConfig, String> {
    let config = state.config.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(config.clone())
}

#[tauri::command]
pub async fn tab_mgmt_set_config(
    state: State<'_, CubeTabManagementState>,
    config: TabManagementConfig,
) -> Result<(), String> {
    let mut current = state.config.write().map_err(|e| format!("Lock error: {}", e))?;
    *current = config;
    Ok(())
}

#[tauri::command]
pub async fn tab_mgmt_set_vertical_tabs(
    state: State<'_, CubeTabManagementState>,
    enabled: bool,
) -> Result<(), String> {
    let mut config = state.config.write().map_err(|e| format!("Lock error: {}", e))?;
    config.vertical_tabs = enabled;
    Ok(())
}

#[tauri::command]
pub async fn tab_mgmt_find_duplicates(
    _state: State<'_, CubeTabManagementState>,
    tabs: Vec<SessionTab>,
) -> Result<Vec<Vec<usize>>, String> {
    let mut url_to_indices: HashMap<String, Vec<usize>> = HashMap::new();
    
    for (i, tab) in tabs.iter().enumerate() {
        url_to_indices.entry(tab.url.clone()).or_default().push(i);
    }
    
    let duplicates: Vec<Vec<usize>> = url_to_indices
        .into_values()
        .filter(|indices| indices.len() > 1)
        .collect();
    
    Ok(duplicates)
}
