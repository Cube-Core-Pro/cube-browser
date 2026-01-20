// Embedded Browser - Webviews within main Tauri window as tabs
// This module provides tabbed browsing INSIDE the main application window
// Using Tauri 2.0's WebviewWindow with proper positioning

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder};

/// State for managing embedded browser tabs
pub struct EmbeddedBrowserState {
    pub tabs: Mutex<HashMap<String, EmbeddedTab>>,
    pub active_tab_id: Mutex<Option<String>>,
    pub tab_order: Mutex<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmbeddedTab {
    pub id: String,
    pub url: String,
    pub title: String,
    pub favicon: Option<String>,
    pub is_loading: bool,
    pub can_go_back: bool,
    pub can_go_forward: bool,
    pub is_visible: bool,
    pub webview_label: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmbeddedTabBounds {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

impl Default for EmbeddedBrowserState {
    fn default() -> Self {
        Self {
            tabs: Mutex::new(HashMap::new()),
            active_tab_id: Mutex::new(None),
            tab_order: Mutex::new(Vec::new()),
        }
    }
}

impl EmbeddedBrowserState {
    pub fn new() -> Self {
        Self::default()
    }
}

/// Create a new embedded browser tab
#[tauri::command]
pub async fn embedded_create_tab(
    app: AppHandle,
    state: tauri::State<'_, EmbeddedBrowserState>,
    tab_id: String,
    url: String,
    bounds: EmbeddedTabBounds,
) -> Result<EmbeddedTab, String> {
    println!("🌐 [EMBEDDED BROWSER] Creating tab: {} at {}", tab_id, url);

    let webview_label = format!("embed_tab_{}", tab_id);

    // Check if tab already exists
    {
        let tabs = state.tabs.lock().map_err(|e| e.to_string())?;
        if tabs.contains_key(&tab_id) {
            return Err(format!("Tab {} already exists", tab_id));
        }
    }

    // Prepare URL
    let webview_url = if url.is_empty() || url == "about:blank" || url == "cube://newtab" {
        WebviewUrl::App("browser/newtab.html".into())
    } else if url.starts_with("http://") || url.starts_with("https://") {
        WebviewUrl::External(url.parse().map_err(|e| format!("Invalid URL: {}", e))?)
    } else if url.contains('.') && !url.contains(' ') {
        let full_url = format!("https://{}", url);
        WebviewUrl::External(full_url.parse().map_err(|e| format!("Invalid URL: {}", e))?)
    } else {
        let search_url = format!(
            "https://www.google.com/search?q={}",
            urlencoding::encode(&url)
        );
        WebviewUrl::External(
            search_url
                .parse()
                .map_err(|e| format!("Invalid search URL: {}", e))?,
        )
    };

    // Get the main window to use as parent
    let main_window = app
        .get_webview_window("main")
        .ok_or("Main window not found - cannot create child window")?;

    // Create webview window as CHILD of main window
    // Using .parent() makes it a true child window that:
    // - Moves with the parent
    // - Hides when parent minimizes  
    // - Appears as part of the app
    let webview_window = WebviewWindowBuilder::new(&app, &webview_label, webview_url)
        .title(&format!("Tab: {}", tab_id))
        .inner_size(bounds.width, bounds.height)
        .position(bounds.x, bounds.y)
        .decorations(false) // No title bar - looks embedded
        .always_on_top(false)
        .resizable(false) // Parent controls size
        .skip_taskbar(true) // Don't show in taskbar
        .shadow(false) // No shadow for cleaner embedding
        .visible(true)
        .focused(true)
        .parent(&main_window) // KEY: Make this a child of main window
        .map_err(|e| format!("Failed to set parent: {}", e))?
        .build()
        .map_err(|e| format!("Failed to create webview: {}", e))?;

    // Inject script to track navigation
    let init_script = r#"
        window.addEventListener('load', function() {
            if (window.__TAURI__) {
                window.__TAURI__.event.emit('embedded-page-loaded', {
                    url: window.location.href,
                    title: document.title
                });
            }
        });
    "#;

    webview_window.eval(init_script).ok();

    // Create tab info
    let tab = EmbeddedTab {
        id: tab_id.clone(),
        url: url.clone(),
        title: "New Tab".to_string(),
        favicon: None,
        is_loading: true,
        can_go_back: false,
        can_go_forward: false,
        is_visible: true,
        webview_label: webview_label.clone(),
    };

    // Store tab
    {
        let mut tabs = state.tabs.lock().map_err(|e| e.to_string())?;
        tabs.insert(tab_id.clone(), tab.clone());
    }

    // Add to order
    {
        let mut order = state.tab_order.lock().map_err(|e| e.to_string())?;
        order.push(tab_id.clone());
    }

    // Set as active
    {
        let mut active = state.active_tab_id.lock().map_err(|e| e.to_string())?;
        // Hide previous active tab
        if let Some(prev_id) = active.as_ref() {
            if let Ok(tabs) = state.tabs.lock() {
                if let Some(prev_tab) = tabs.get(prev_id) {
                    if let Some(prev_window) = app.get_webview_window(&prev_tab.webview_label) {
                        prev_window.hide().ok();
                    }
                }
            }
        }
        *active = Some(tab_id.clone());
    }

    app.emit("embedded-tab-created", &tab).ok();
    println!("✅ [EMBEDDED BROWSER] Created tab: {}", webview_label);
    Ok(tab)
}

/// Navigate embedded tab to URL
#[tauri::command]
pub async fn embedded_navigate(
    app: AppHandle,
    state: tauri::State<'_, EmbeddedBrowserState>,
    tab_id: String,
    url: String,
) -> Result<(), String> {
    println!("🔗 [EMBEDDED BROWSER] Navigate {} to {}", tab_id, url);

    let webview_label = {
        let tabs = state.tabs.lock().map_err(|e| e.to_string())?;
        tabs.get(&tab_id)
            .map(|t| t.webview_label.clone())
            .ok_or(format!("Tab {} not found", tab_id))?
    };

    let window = app
        .get_webview_window(&webview_label)
        .ok_or(format!("Webview {} not found", webview_label))?;

    // Format URL
    let final_url = if url.is_empty() || url == "about:blank" {
        "about:blank".to_string()
    } else if url.starts_with("http://") || url.starts_with("https://") {
        url.clone()
    } else if url.contains('.') && !url.contains(' ') {
        format!("https://{}", url)
    } else {
        format!(
            "https://www.google.com/search?q={}",
            urlencoding::encode(&url)
        )
    };

    // Navigate using JavaScript
    let script = format!("window.location.href = '{}';", final_url.replace("'", "\\'"));
    window.eval(&script).map_err(|e| e.to_string())?;

    // Update tab state
    {
        let mut tabs = state.tabs.lock().map_err(|e| e.to_string())?;
        if let Some(tab) = tabs.get_mut(&tab_id) {
            tab.url = final_url.clone();
            tab.is_loading = true;
        }
    }

    app.emit(
        "embedded-tab-navigating",
        serde_json::json!({
            "tabId": tab_id,
            "url": final_url
        }),
    )
    .ok();

    Ok(())
}

/// Close an embedded tab
#[tauri::command]
pub async fn embedded_close_tab(
    app: AppHandle,
    state: tauri::State<'_, EmbeddedBrowserState>,
    tab_id: String,
) -> Result<(), String> {
    println!("❌ [EMBEDDED BROWSER] Closing tab: {}", tab_id);

    let webview_label = {
        let mut tabs = state.tabs.lock().map_err(|e| e.to_string())?;
        let tab = tabs.remove(&tab_id).ok_or(format!("Tab {} not found", tab_id))?;
        tab.webview_label
    };

    // Close the webview window
    if let Some(window) = app.get_webview_window(&webview_label) {
        window.close().map_err(|e| e.to_string())?;
    }

    // Remove from order
    {
        let mut order = state.tab_order.lock().map_err(|e| e.to_string())?;
        order.retain(|id| id != &tab_id);
    }

    // If this was active, switch to another tab
    {
        let mut active = state.active_tab_id.lock().map_err(|e| e.to_string())?;
        if active.as_ref() == Some(&tab_id) {
            let order = state.tab_order.lock().map_err(|e| e.to_string())?;
            *active = order.last().cloned();

            // Show new active tab
            if let Some(new_active_id) = active.as_ref() {
                if let Ok(tabs) = state.tabs.lock() {
                    if let Some(tab) = tabs.get(new_active_id) {
                        if let Some(window) = app.get_webview_window(&tab.webview_label) {
                            window.show().ok();
                            window.set_focus().ok();
                        }
                    }
                }
            }
        }
    }

    app.emit(
        "embedded-tab-closed",
        serde_json::json!({ "tabId": tab_id }),
    )
    .ok();

    Ok(())
}

/// Switch to a specific tab
#[tauri::command]
pub async fn embedded_switch_tab(
    app: AppHandle,
    state: tauri::State<'_, EmbeddedBrowserState>,
    tab_id: String,
) -> Result<(), String> {
    println!("🔄 [EMBEDDED BROWSER] Switching to tab: {}", tab_id);

    let tabs = state.tabs.lock().map_err(|e| e.to_string())?;
    let _tab = tabs.get(&tab_id).ok_or(format!("Tab {} not found", tab_id))?;

    // Hide all other tabs, show this one
    for (id, t) in tabs.iter() {
        if let Some(window) = app.get_webview_window(&t.webview_label) {
            if id == &tab_id {
                window.show().ok();
                window.set_focus().ok();
            } else {
                window.hide().ok();
            }
        }
    }

    drop(tabs);

    // Update active
    {
        let mut active = state.active_tab_id.lock().map_err(|e| e.to_string())?;
        *active = Some(tab_id.clone());
    }

    app.emit(
        "embedded-tab-switched",
        serde_json::json!({ "tabId": tab_id }),
    )
    .ok();

    Ok(())
}

/// Update tab bounds (position and size)
#[tauri::command]
pub async fn embedded_update_bounds(
    app: AppHandle,
    state: tauri::State<'_, EmbeddedBrowserState>,
    tab_id: String,
    bounds: EmbeddedTabBounds,
) -> Result<(), String> {
    let webview_label = {
        let tabs = state.tabs.lock().map_err(|e| e.to_string())?;
        tabs.get(&tab_id)
            .map(|t| t.webview_label.clone())
            .ok_or(format!("Tab {} not found", tab_id))?
    };

    if let Some(window) = app.get_webview_window(&webview_label) {
        window
            .set_position(tauri::Position::Logical(tauri::LogicalPosition::new(
                bounds.x, bounds.y,
            )))
            .ok();
        window
            .set_size(tauri::Size::Logical(tauri::LogicalSize::new(
                bounds.width,
                bounds.height,
            )))
            .ok();
    }

    Ok(())
}

/// Go back in history
#[tauri::command]
pub async fn embedded_go_back(
    app: AppHandle,
    state: tauri::State<'_, EmbeddedBrowserState>,
    tab_id: String,
) -> Result<(), String> {
    let webview_label = {
        let tabs = state.tabs.lock().map_err(|e| e.to_string())?;
        tabs.get(&tab_id)
            .map(|t| t.webview_label.clone())
            .ok_or(format!("Tab {} not found", tab_id))?
    };

    if let Some(window) = app.get_webview_window(&webview_label) {
        window.eval("history.back()").map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// Go forward in history
#[tauri::command]
pub async fn embedded_go_forward(
    app: AppHandle,
    state: tauri::State<'_, EmbeddedBrowserState>,
    tab_id: String,
) -> Result<(), String> {
    let webview_label = {
        let tabs = state.tabs.lock().map_err(|e| e.to_string())?;
        tabs.get(&tab_id)
            .map(|t| t.webview_label.clone())
            .ok_or(format!("Tab {} not found", tab_id))?
    };

    if let Some(window) = app.get_webview_window(&webview_label) {
        window
            .eval("history.forward()")
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// Reload current page
#[tauri::command]
pub async fn embedded_reload(
    app: AppHandle,
    state: tauri::State<'_, EmbeddedBrowserState>,
    tab_id: String,
) -> Result<(), String> {
    let webview_label = {
        let tabs = state.tabs.lock().map_err(|e| e.to_string())?;
        tabs.get(&tab_id)
            .map(|t| t.webview_label.clone())
            .ok_or(format!("Tab {} not found", tab_id))?
    };

    if let Some(window) = app.get_webview_window(&webview_label) {
        window
            .eval("location.reload()")
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// Stop loading
#[tauri::command]
pub async fn embedded_stop(
    app: AppHandle,
    state: tauri::State<'_, EmbeddedBrowserState>,
    tab_id: String,
) -> Result<(), String> {
    let webview_label = {
        let tabs = state.tabs.lock().map_err(|e| e.to_string())?;
        tabs.get(&tab_id)
            .map(|t| t.webview_label.clone())
            .ok_or(format!("Tab {} not found", tab_id))?
    };

    if let Some(window) = app.get_webview_window(&webview_label) {
        window.eval("window.stop()").map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// Get all tabs
#[tauri::command]
pub async fn embedded_get_tabs(
    state: tauri::State<'_, EmbeddedBrowserState>,
) -> Result<Vec<EmbeddedTab>, String> {
    let tabs = state.tabs.lock().map_err(|e| e.to_string())?;
    let order = state.tab_order.lock().map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for id in order.iter() {
        if let Some(tab) = tabs.get(id) {
            result.push(tab.clone());
        }
    }

    Ok(result)
}

/// Get active tab ID
#[tauri::command]
pub async fn embedded_get_active_tab(
    state: tauri::State<'_, EmbeddedBrowserState>,
) -> Result<Option<String>, String> {
    let active = state.active_tab_id.lock().map_err(|e| e.to_string())?;
    Ok(active.clone())
}

/// Execute JavaScript in a tab
#[tauri::command]
pub async fn embedded_execute_script(
    app: AppHandle,
    state: tauri::State<'_, EmbeddedBrowserState>,
    tab_id: String,
    script: String,
) -> Result<(), String> {
    let webview_label = {
        let tabs = state.tabs.lock().map_err(|e| e.to_string())?;
        tabs.get(&tab_id)
            .map(|t| t.webview_label.clone())
            .ok_or(format!("Tab {} not found", tab_id))?
    };

    if let Some(window) = app.get_webview_window(&webview_label) {
        window.eval(&script).map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// Get current URL
#[tauri::command]
pub async fn embedded_get_url(
    state: tauri::State<'_, EmbeddedBrowserState>,
    tab_id: String,
) -> Result<String, String> {
    let tabs = state.tabs.lock().map_err(|e| e.to_string())?;
    let tab = tabs.get(&tab_id).ok_or(format!("Tab {} not found", tab_id))?;
    Ok(tab.url.clone())
}

/// Update tab info (title, favicon, etc.)
#[tauri::command]
pub async fn embedded_update_tab_info(
    app: AppHandle,
    state: tauri::State<'_, EmbeddedBrowserState>,
    tab_id: String,
    title: Option<String>,
    url: Option<String>,
    favicon: Option<String>,
    is_loading: Option<bool>,
) -> Result<(), String> {
    {
        let mut tabs = state.tabs.lock().map_err(|e| e.to_string())?;
        if let Some(tab) = tabs.get_mut(&tab_id) {
            if let Some(t) = title {
                tab.title = t;
            }
            if let Some(u) = url {
                tab.url = u;
            }
            if let Some(f) = favicon {
                tab.favicon = Some(f);
            }
            if let Some(l) = is_loading {
                tab.is_loading = l;
            }
        }
    }

    let tabs = state.tabs.lock().map_err(|e| e.to_string())?;
    if let Some(tab) = tabs.get(&tab_id) {
        app.emit("embedded-tab-updated", tab).ok();
    }

    Ok(())
}

/// Close all tabs
#[tauri::command]
pub async fn embedded_close_all_tabs(
    app: AppHandle,
    state: tauri::State<'_, EmbeddedBrowserState>,
) -> Result<(), String> {
    println!("🗑️ [EMBEDDED BROWSER] Closing all tabs");

    let tabs = {
        let mut tabs = state.tabs.lock().map_err(|e| e.to_string())?;
        let all_tabs: Vec<_> = tabs.drain().collect();
        all_tabs
    };

    // Close all webview windows
    for (_, tab) in tabs {
        if let Some(window) = app.get_webview_window(&tab.webview_label) {
            window.close().ok();
        }
    }

    // Clear state
    {
        let mut order = state.tab_order.lock().map_err(|e| e.to_string())?;
        order.clear();
    }
    {
        let mut active = state.active_tab_id.lock().map_err(|e| e.to_string())?;
        *active = None;
    }

    app.emit("embedded-all-tabs-closed", ()).ok();

    Ok(())
}
