// CUBE Web Engine Commands - Tauri commands for the embedded browser engine
// These commands interface between the frontend and the CUBE Web Engine

use crate::services::cube_web_engine::{
    CubeWebEngineConfig, CubeWebEngineState, CubeWebTab, DomCommand, FetchResponse,
    JsExecutionResult, PageContent, PrintOptions, ScreenshotOptions, TabBounds, TabUpdate,
    WebFetcher,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::RwLock;
use tauri::{AppHandle, Emitter, Manager, State};

/// Global state for the CUBE Web Engine
pub struct CubeWebEngineGlobalState {
    pub engine: CubeWebEngineState,
    pub fetcher: RwLock<Option<WebFetcher>>,
}

impl Default for CubeWebEngineGlobalState {
    fn default() -> Self {
        Self {
            engine: CubeWebEngineState::new(),
            fetcher: RwLock::new(Some(WebFetcher::new(CubeWebEngineConfig::default()))),
        }
    }
}

// ============================================
// Tab Management Commands
// ============================================

/// Create a new browser tab
#[tauri::command]
pub async fn cube_engine_create_tab(
    state: State<'_, CubeWebEngineGlobalState>,
    app: AppHandle,
    url: Option<String>,
    bounds: Option<TabBounds>,
) -> Result<CubeWebTab, String> {
    println!("🌐 [CUBE ENGINE] Creating tab with URL: {:?}", url);

    let tab = state.engine.create_tab(url.clone(), bounds.unwrap_or_default())?;

    // If URL provided, start fetching
    if let Some(url) = url {
        if url != "about:blank" && !url.is_empty() {
            // Start navigation in background
            let tab_id = tab.id.clone();
            let _engine_state = state.engine.get_tab(&tab_id).ok().flatten();
            
            // Emit navigation started event
            let _ = app.emit("cube-engine-navigation-started", serde_json::json!({
                "tabId": tab_id,
                "url": url
            }));
        }
    }

    // Emit tab created event
    let _ = app.emit("cube-engine-tab-created", &tab);

    Ok(tab)
}

/// Close a browser tab
#[tauri::command]
pub async fn cube_engine_close_tab(
    state: State<'_, CubeWebEngineGlobalState>,
    app: AppHandle,
    tab_id: String,
) -> Result<(), String> {
    println!("❌ [CUBE ENGINE] Closing tab: {}", tab_id);

    state.engine.close_tab(&tab_id)?;

    // Emit tab closed event
    let _ = app.emit("cube-engine-tab-closed", serde_json::json!({
        "tabId": tab_id
    }));

    Ok(())
}

/// Close all tabs
#[tauri::command]
pub async fn cube_engine_close_all_tabs(
    state: State<'_, CubeWebEngineGlobalState>,
    app: AppHandle,
) -> Result<(), String> {
    println!("❌ [CUBE ENGINE] Closing all tabs");

    let tabs = state.engine.get_tabs()?;
    for tab in tabs {
        state.engine.close_tab(&tab.id)?;
    }

    let _ = app.emit("cube-engine-all-tabs-closed", ());

    Ok(())
}

/// Get all tabs
#[tauri::command]
pub async fn cube_engine_get_tabs(
    state: State<'_, CubeWebEngineGlobalState>,
) -> Result<Vec<CubeWebTab>, String> {
    state.engine.get_tabs()
}

/// Get a specific tab
#[tauri::command]
pub async fn cube_engine_get_tab(
    state: State<'_, CubeWebEngineGlobalState>,
    tab_id: String,
) -> Result<Option<CubeWebTab>, String> {
    state.engine.get_tab(&tab_id)
}

/// Set active tab
#[tauri::command]
pub async fn cube_engine_set_active_tab(
    state: State<'_, CubeWebEngineGlobalState>,
    app: AppHandle,
    tab_id: String,
) -> Result<(), String> {
    println!("🔄 [CUBE ENGINE] Switching to tab: {}", tab_id);

    state.engine.set_active_tab(&tab_id)?;

    let _ = app.emit("cube-engine-tab-activated", serde_json::json!({
        "tabId": tab_id
    }));

    Ok(())
}

/// Get active tab ID
#[tauri::command]
pub async fn cube_engine_get_active_tab(
    state: State<'_, CubeWebEngineGlobalState>,
) -> Result<Option<String>, String> {
    state.engine.get_active_tab()
}

/// Update tab bounds (position and size)
#[tauri::command]
pub async fn cube_engine_update_bounds(
    state: State<'_, CubeWebEngineGlobalState>,
    tab_id: String,
    bounds: TabBounds,
) -> Result<(), String> {
    state.engine.update_bounds(&tab_id, bounds)
}

// ============================================
// Navigation Commands
// ============================================

/// Navigate to a URL
#[tauri::command]
pub async fn cube_engine_navigate(
    state: State<'_, CubeWebEngineGlobalState>,
    app: AppHandle,
    tab_id: String,
    url: String,
) -> Result<(), String> {
    println!("🔗 [CUBE ENGINE] Navigating {} to {}", tab_id, url);

    // Update tab state to loading
    state.engine.update_tab(&tab_id, TabUpdate {
        url: Some(url.clone()),
        is_loading: Some(true),
        ..Default::default()
    })?;

    // Emit navigation started
    let _ = app.emit("cube-engine-navigation-started", serde_json::json!({
        "tabId": tab_id,
        "url": url
    }));

    // Fetch the page content - clone fetcher to avoid holding lock across await
    let fetcher_opt = {
        let guard = state.fetcher.read().map_err(|e| format!("Lock error: {}", e))?;
        guard.clone()
    };
    
    if let Some(fetcher) = fetcher_opt.as_ref() {
        match fetcher.fetch_page(&url).await {
            Ok(content) => {
                // Cache the page content
                state.engine.cache_page(&tab_id, content.clone())?;

                // Add to history
                state.engine.add_history(&tab_id, &url, "Loading...")?;

                // Update tab state
                state.engine.update_tab(&tab_id, TabUpdate {
                    is_loading: Some(false),
                    can_go_back: Some(true),
                    ..Default::default()
                })?;

                // Emit navigation completed with content
                let _ = app.emit("cube-engine-navigation-completed", serde_json::json!({
                    "tabId": tab_id,
                    "url": url,
                    "html": content.html,
                    "baseUrl": content.base_url
                }));
            }
            Err(e) => {
                // Update tab state
                state.engine.update_tab(&tab_id, TabUpdate {
                    is_loading: Some(false),
                    ..Default::default()
                })?;

                // Emit navigation failed
                let _ = app.emit("cube-engine-navigation-failed", serde_json::json!({
                    "tabId": tab_id,
                    "url": url,
                    "error": e
                }));

                return Err(e);
            }
        }
    }

    Ok(())
}

/// Fetch a URL and return raw response (for iframe injection)
#[tauri::command]
pub async fn cube_engine_fetch_url(
    state: State<'_, CubeWebEngineGlobalState>,
    url: String,
    _headers: Option<HashMap<String, String>>,
) -> Result<FetchResponse, String> {
    println!("📥 [CUBE ENGINE] Fetching URL: {}", url);

    let fetcher_opt = {
        let guard = state.fetcher.read().map_err(|e| format!("Lock error: {}", e))?;
        guard.clone()
    };
    
    if let Some(fetcher) = fetcher_opt.as_ref() {
        fetcher.fetch(&url).await
    } else {
        Err("Fetcher not initialized".to_string())
    }
}

/// Fetch page content for rendering
#[tauri::command]
pub async fn cube_engine_fetch_page(
    state: State<'_, CubeWebEngineGlobalState>,
    url: String,
) -> Result<PageContent, String> {
    println!("📄 [CUBE ENGINE] Fetching page: {}", url);

    let fetcher_opt = {
        let guard = state.fetcher.read().map_err(|e| format!("Lock error: {}", e))?;
        guard.clone()
    };
    
    if let Some(fetcher) = fetcher_opt.as_ref() {
        fetcher.fetch_page(&url).await
    } else {
        Err("Fetcher not initialized".to_string())
    }
}

/// Go back in history
#[tauri::command]
pub async fn cube_engine_go_back(
    state: State<'_, CubeWebEngineGlobalState>,
    app: AppHandle,
    tab_id: String,
) -> Result<(), String> {
    println!("⬅️ [CUBE ENGINE] Going back in tab: {}", tab_id);

    // Get history
    let history = state.engine.get_history(&tab_id)?;
    
    if history.len() > 1 {
        // Navigate to previous entry
        let prev_entry = &history[history.len() - 2];
        
        // Update tab
        state.engine.update_tab(&tab_id, TabUpdate {
            url: Some(prev_entry.url.clone()),
            title: Some(prev_entry.title.clone()),
            is_loading: Some(true),
            ..Default::default()
        })?;

        // Emit event
        let _ = app.emit("cube-engine-navigation-started", serde_json::json!({
            "tabId": tab_id,
            "url": prev_entry.url
        }));
    }

    Ok(())
}

/// Go forward in history
#[tauri::command]
pub async fn cube_engine_go_forward(
    _state: State<'_, CubeWebEngineGlobalState>,
    _app: AppHandle,
    tab_id: String,
) -> Result<(), String> {
    println!("➡️ [CUBE ENGINE] Going forward in tab: {}", tab_id);
    // Implementation similar to go_back but with forward navigation
    Ok(())
}

/// Reload current page
#[tauri::command]
pub async fn cube_engine_reload(
    state: State<'_, CubeWebEngineGlobalState>,
    app: AppHandle,
    tab_id: String,
) -> Result<(), String> {
    println!("🔄 [CUBE ENGINE] Reloading tab: {}", tab_id);

    if let Some(tab) = state.engine.get_tab(&tab_id)? {
        // Re-navigate to current URL
        state.engine.update_tab(&tab_id, TabUpdate {
            is_loading: Some(true),
            ..Default::default()
        })?;

        // Trigger re-fetch
        let _ = app.emit("cube-engine-reload", serde_json::json!({
            "tabId": tab_id,
            "url": tab.url
        }));
    }

    Ok(())
}

/// Stop loading
#[tauri::command]
pub async fn cube_engine_stop(
    state: State<'_, CubeWebEngineGlobalState>,
    app: AppHandle,
    tab_id: String,
) -> Result<(), String> {
    println!("⏹️ [CUBE ENGINE] Stopping tab: {}", tab_id);

    state.engine.update_tab(&tab_id, TabUpdate {
        is_loading: Some(false),
        ..Default::default()
    })?;

    let _ = app.emit("cube-engine-stopped", serde_json::json!({
        "tabId": tab_id
    }));

    Ok(())
}

// ============================================
// Content & DOM Commands
// ============================================

/// Execute JavaScript in tab context
#[tauri::command]
pub async fn cube_engine_execute_script(
    _state: State<'_, CubeWebEngineGlobalState>,
    app: AppHandle,
    tab_id: String,
    script: String,
) -> Result<JsExecutionResult, String> {
    println!("📜 [CUBE ENGINE] Executing script in tab: {}", tab_id);

    // Emit script execution request to frontend
    let _ = app.emit("cube-engine-execute-script", serde_json::json!({
        "tabId": tab_id,
        "script": script
    }));

    // The actual execution happens in the frontend iframe
    // This command just coordinates the request
    Ok(JsExecutionResult {
        success: true,
        result: None,
        error: None,
    })
}

/// Execute DOM command
#[tauri::command]
pub async fn cube_engine_dom_command(
    _state: State<'_, CubeWebEngineGlobalState>,
    app: AppHandle,
    tab_id: String,
    command: DomCommand,
) -> Result<serde_json::Value, String> {
    println!("🎯 [CUBE ENGINE] DOM command in tab: {} - {:?}", tab_id, command);

    // Emit DOM command to frontend for execution in iframe
    let _ = app.emit("cube-engine-dom-command", serde_json::json!({
        "tabId": tab_id,
        "command": command
    }));

    Ok(serde_json::json!({ "success": true }))
}

/// Get page source
#[tauri::command]
pub async fn cube_engine_get_page_source(
    state: State<'_, CubeWebEngineGlobalState>,
    tab_id: String,
) -> Result<String, String> {
    if let Some(content) = state.engine.get_cached_page(&tab_id)? {
        Ok(content.html)
    } else {
        Err("Page not cached".to_string())
    }
}

/// Update tab info from frontend
#[tauri::command]
pub async fn cube_engine_update_tab_info(
    state: State<'_, CubeWebEngineGlobalState>,
    app: AppHandle,
    tab_id: String,
    title: Option<String>,
    url: Option<String>,
    favicon: Option<String>,
    is_loading: Option<bool>,
) -> Result<(), String> {
    state.engine.update_tab(&tab_id, TabUpdate {
        title,
        url,
        favicon,
        is_loading,
        ..Default::default()
    })?;

    // Get updated tab and emit event
    if let Some(tab) = state.engine.get_tab(&tab_id)? {
        let _ = app.emit("cube-engine-tab-updated", &tab);
    }

    Ok(())
}

// ============================================
// Configuration Commands
// ============================================

/// Get engine configuration
#[tauri::command]
pub async fn cube_engine_get_config(
    state: State<'_, CubeWebEngineGlobalState>,
) -> Result<CubeWebEngineConfig, String> {
    let config = state.engine.config.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(config.clone())
}

/// Update engine configuration
#[tauri::command]
pub async fn cube_engine_set_config(
    state: State<'_, CubeWebEngineGlobalState>,
    config: CubeWebEngineConfig,
) -> Result<(), String> {
    // Update config
    {
        let mut current = state.engine.config.write().map_err(|e| format!("Lock error: {}", e))?;
        *current = config.clone();
    }

    // Recreate fetcher with new config
    {
        let mut fetcher = state.fetcher.write().map_err(|e| format!("Lock error: {}", e))?;
        *fetcher = Some(WebFetcher::new(config));
    }

    Ok(())
}

/// Set custom headers for all requests
#[tauri::command]
pub async fn cube_engine_set_headers(
    state: State<'_, CubeWebEngineGlobalState>,
    headers: HashMap<String, String>,
) -> Result<(), String> {
    let mut config = state.engine.config.write().map_err(|e| format!("Lock error: {}", e))?;
    config.custom_headers = headers;
    
    // Recreate fetcher
    let new_config = config.clone();
    drop(config);
    
    let mut fetcher = state.fetcher.write().map_err(|e| format!("Lock error: {}", e))?;
    *fetcher = Some(WebFetcher::new(new_config));

    Ok(())
}

/// Set user agent
#[tauri::command]
pub async fn cube_engine_set_user_agent(
    state: State<'_, CubeWebEngineGlobalState>,
    user_agent: String,
) -> Result<(), String> {
    let mut config = state.engine.config.write().map_err(|e| format!("Lock error: {}", e))?;
    config.user_agent = user_agent;
    
    // Recreate fetcher
    let new_config = config.clone();
    drop(config);
    
    let mut fetcher = state.fetcher.write().map_err(|e| format!("Lock error: {}", e))?;
    *fetcher = Some(WebFetcher::new(new_config));

    Ok(())
}

// ============================================
// Zoom & Display Commands
// ============================================

/// Set zoom level for tab
#[tauri::command]
pub async fn cube_engine_set_zoom(
    state: State<'_, CubeWebEngineGlobalState>,
    app: AppHandle,
    tab_id: String,
    zoom_level: f64,
) -> Result<(), String> {
    let mut tabs = state.engine.tabs.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(tab) = tabs.get_mut(&tab_id) {
        tab.zoom_level = zoom_level.clamp(0.25, 5.0);
        
        let _ = app.emit("cube-engine-zoom-changed", serde_json::json!({
            "tabId": tab_id,
            "zoomLevel": tab.zoom_level
        }));
    }

    Ok(())
}

/// Get zoom level for tab
#[tauri::command]
pub async fn cube_engine_get_zoom(
    state: State<'_, CubeWebEngineGlobalState>,
    tab_id: String,
) -> Result<f64, String> {
    if let Some(tab) = state.engine.get_tab(&tab_id)? {
        Ok(tab.zoom_level)
    } else {
        Err("Tab not found".to_string())
    }
}

// ============================================
// History Commands
// ============================================

/// Get tab history
#[tauri::command]
pub async fn cube_engine_get_history(
    state: State<'_, CubeWebEngineGlobalState>,
    tab_id: String,
) -> Result<Vec<crate::services::cube_web_engine::HistoryEntry>, String> {
    state.engine.get_history(&tab_id)
}

/// Clear tab history
#[tauri::command]
pub async fn cube_engine_clear_history(
    state: State<'_, CubeWebEngineGlobalState>,
    tab_id: Option<String>,
) -> Result<(), String> {
    let mut history = state.engine.history.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(id) = tab_id {
        history.remove(&id);
    } else {
        history.clear();
    }

    Ok(())
}

// ============================================
// Screenshot & Print Commands
// ============================================

/// Take screenshot of tab (requires frontend coordination)
#[tauri::command]
pub async fn cube_engine_screenshot(
    _state: State<'_, CubeWebEngineGlobalState>,
    app: AppHandle,
    tab_id: String,
    options: Option<ScreenshotOptions>,
) -> Result<String, String> {
    let opts = options.unwrap_or_default();
    
    // Request screenshot from frontend
    let _ = app.emit("cube-engine-screenshot-request", serde_json::json!({
        "tabId": tab_id,
        "options": opts
    }));

    // The actual screenshot is taken by the frontend and returned via event
    Ok("Screenshot requested".to_string())
}

/// Print page to PDF (requires frontend coordination)
#[tauri::command]
pub async fn cube_engine_print_to_pdf(
    _state: State<'_, CubeWebEngineGlobalState>,
    app: AppHandle,
    tab_id: String,
    options: Option<PrintOptions>,
) -> Result<String, String> {
    let opts = options.unwrap_or_default();
    
    let _ = app.emit("cube-engine-print-request", serde_json::json!({
        "tabId": tab_id,
        "options": opts
    }));

    Ok("Print requested".to_string())
}

// ============================================
// DevTools Commands
// ============================================

/// Get DOM tree for DevTools
#[tauri::command]
pub async fn cube_engine_devtools_get_dom(
    _state: State<'_, CubeWebEngineGlobalState>,
    app: AppHandle,
    tab_id: String,
) -> Result<serde_json::Value, String> {
    let _ = app.emit("cube-engine-devtools-request", serde_json::json!({
        "tabId": tab_id,
        "type": "dom"
    }));

    Ok(serde_json::json!({ "requested": true }))
}

/// Get network requests for DevTools
#[tauri::command]
pub async fn cube_engine_devtools_get_network(
    _state: State<'_, CubeWebEngineGlobalState>,
    app: AppHandle,
    tab_id: String,
) -> Result<serde_json::Value, String> {
    let _ = app.emit("cube-engine-devtools-request", serde_json::json!({
        "tabId": tab_id,
        "type": "network"
    }));

    Ok(serde_json::json!({ "requested": true }))
}

/// Get console messages for DevTools
#[tauri::command]
pub async fn cube_engine_devtools_get_console(
    _state: State<'_, CubeWebEngineGlobalState>,
    app: AppHandle,
    tab_id: String,
) -> Result<serde_json::Value, String> {
    let _ = app.emit("cube-engine-devtools-request", serde_json::json!({
        "tabId": tab_id,
        "type": "console"
    }));

    Ok(serde_json::json!({ "requested": true }))
}
