// Webview Commands - Tauri WebviewWindow Integration for Browser UI
// This replaces the iframe-based browser with native Tauri webview rendering

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, EventId, Listener, Manager, PhysicalPosition, PhysicalSize, WebviewUrl, WebviewWindowBuilder};
use tokio::sync::oneshot;
use tokio::time::{timeout, Duration};

// Webview state management
pub struct WebviewState {
    pub webviews: Mutex<HashMap<String, String>>, // tab_id -> webview_label
}

impl Default for WebviewState {
    fn default() -> Self {
        Self {
            webviews: Mutex::new(HashMap::new()),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebviewInfo {
    pub tab_id: String,
    pub label: String,
    pub url: String,
    pub title: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct WebviewLocationPayload {
    url: String,
    #[serde(default)]
    title: String,
    #[serde(default)]
    timestamp: Option<u64>,
}

/// Create a new webview window for a browser tab
/// HYBRID APPROACH: Creates separate window positioned as child of main window
#[tauri::command]
pub async fn webview_create(
    app: AppHandle,
    state: tauri::State<'_, WebviewState>,
    tab_id: String,
    url: String,
) -> Result<String, String> {
    println!("🔍 [WEBVIEW] Starting webview creation...");
    println!("🔍 [WEBVIEW] tab_id: {}", tab_id);
    println!("🔍 [WEBVIEW] url: {}", url);

    let label = format!("webview_{}", tab_id);
    println!("🔍 [WEBVIEW] Generated label: {}", label);

    // Get main window position and size to calculate child position
    println!("🔍 [WEBVIEW] Looking for main window...");
    let main_window = app.get_webview_window("main").ok_or_else(|| {
        println!("❌ [WEBVIEW] Main window not found!");
        "Main window not found".to_string()
    })?;
    println!("✅ [WEBVIEW] Found main window");

    println!("🔍 [WEBVIEW] Getting main window position...");
    let main_pos = main_window.outer_position().map_err(|e| {
        let err_msg = format!("Failed to get main window position: {}", e);
        println!("❌ [WEBVIEW] {}", err_msg);
        err_msg
    })?;
    println!(
        "✅ [WEBVIEW] Main position: x={}, y={}",
        main_pos.x, main_pos.y
    );

    println!("🔍 [WEBVIEW] Getting main window size...");
    let main_size = main_window.outer_size().map_err(|e| {
        let err_msg = format!("Failed to get main window size: {}", e);
        println!("❌ [WEBVIEW] {}", err_msg);
        err_msg
    })?;
    println!(
        "✅ [WEBVIEW] Main size: {}x{}",
        main_size.width, main_size.height
    );

    // Calculate browser content area (below toolbar: 180px for browser controls)
    let toolbar_height: u32 = 180;
    let child_x = main_pos.x;
    let child_y = main_pos.y + toolbar_height as i32;
    let child_width = main_size.width;
    let child_height = main_size.height.saturating_sub(toolbar_height);

    println!("🔍 [WEBVIEW] Calculated child window:");
    println!("   Position: x={}, y={}", child_x, child_y);
    println!("   Size: {}x{}", child_width, child_height);

    // Create webview window positioned as child
    println!("🔍 [WEBVIEW] Building webview window...");
    let _webview = WebviewWindowBuilder::new(
        &app,
        &label,
        WebviewUrl::External(url.parse().map_err(|e| {
            let err_msg = format!("Invalid URL: {}", e);
            println!("❌ [WEBVIEW] {}", err_msg);
            err_msg
        })?),
    )
    .title("CUBE Elite Browser Tab")
    .inner_size(child_width as f64, child_height as f64)
    .position(child_x as f64, child_y as f64)
    .resizable(false) // Controlled by main window
    .decorations(false) // No window decorations (frameless)
    .always_on_top(false)
    .visible(true)
    .skip_taskbar(true) // Don't show in taskbar
    .build()
    .map_err(|e| {
        let err_msg = format!("Failed to create webview: {}", e);
        println!("❌ [WEBVIEW] {}", err_msg);
        err_msg
    })?;

    println!("✅ [WEBVIEW] Webview window built successfully");

    // Store webview reference
    let mut webviews = state.webviews.lock().unwrap();
    webviews.insert(tab_id.clone(), label.clone());
    println!("✅ [WEBVIEW] Stored webview reference");

    println!("🎉 [WEBVIEW] COMPLETE - Created webview: {}", label);
    Ok(label)
}

/// Navigate webview to new URL
#[tauri::command]
pub async fn webview_navigate(
    app: AppHandle,
    state: tauri::State<'_, WebviewState>,
    tab_id: String,
    url: String,
) -> Result<(), String> {
    let webviews = state.webviews.lock().unwrap();
    let label = webviews.get(&tab_id).ok_or("Webview not found")?;

    let webview = app
        .get_webview_window(label)
        .ok_or("Webview window not found")?;

    // Navigate to URL
    webview
        .eval(format!("window.location.href = '{}'", url))
        .map_err(|e| format!("Navigation failed: {}", e))?;

    Ok(())
}

/// Get current URL from webview
#[tauri::command]
pub async fn webview_get_url(
    app: AppHandle,
    state: tauri::State<'_, WebviewState>,
    tab_id: String,
) -> Result<String, String> {
    let label = {
        let webviews = state.webviews.lock().unwrap();
        webviews.get(&tab_id).cloned()
    }
    .ok_or("Webview not found")?;

    let webview = app
        .get_webview_window(&label)
        .ok_or("Webview window not found")?;

    let event_channel = format!("cube://webview/location/{}", tab_id);
    let (sender, receiver) = oneshot::channel::<String>();
    let response_sender = Arc::new(Mutex::new(Some(sender)));
    let listener_sender = Arc::clone(&response_sender);
    let app_for_unlisten = app.clone();

    let listener_id: EventId = app.listen_any(event_channel.clone(), move |event| {
        if let Ok(mut guard) = listener_sender.lock() {
            if let Some(tx) = guard.take() {
                let payload = event.payload();
                if payload.is_empty() {
                    let _ = tx.send(String::new());
                } else {
                    let _ = tx.send(payload.to_string());
                }
            }
        }
    });

    let emit_script = format!(
        "(function() {{\n  try {{\n    var payload = JSON.stringify({{\n      url: window.location && window.location.href ? window.location.href : '',\n      title: document && document.title ? document.title : '',\n      timestamp: Date.now()\n    }});\n    if (window.__TAURI__ && window.__TAURI__.event && typeof window.__TAURI__.event.emit === 'function') {{\n      window.__TAURI__.event.emit('{channel}', payload);\n    }}\n  }} catch (error) {{\n    console.error('Failed to emit webview location', error);\n  }}\n}})();",
        channel = event_channel.replace("'", "\\'")
    );

    webview
        .eval(&emit_script)
        .map_err(|e| format!("Failed to request URL: {}", e))?;

    let response = match timeout(Duration::from_secs(2), receiver).await {
        Ok(Ok(payload)) => payload,
        Ok(Err(_)) => {
            app_for_unlisten.unlisten(listener_id);
            return Err("Failed to receive URL payload".to_string());
        }
        Err(_) => {
            app_for_unlisten.unlisten(listener_id);
            return Err("Timed out waiting for webview response".to_string());
        }
    };

    app_for_unlisten.unlisten(listener_id);

    if response.trim().is_empty() {
        return Ok(String::new());
    }

    let parsed: WebviewLocationPayload = serde_json::from_str(&response)
        .map_err(|e| format!("Invalid payload from webview: {}", e))?;

    Ok(parsed.url)
}

/// Close webview window
#[tauri::command]
pub async fn webview_close(
    app: AppHandle,
    state: tauri::State<'_, WebviewState>,
    tab_id: String,
) -> Result<(), String> {
    let mut webviews = state.webviews.lock().unwrap();
    let label = webviews.remove(&tab_id).ok_or("Webview not found")?;

    if let Some(webview) = app.get_webview_window(&label) {
        webview
            .close()
            .map_err(|e| format!("Failed to close webview: {}", e))?;
    }

    Ok(())
}

/// Go back in webview history
#[tauri::command]
pub async fn webview_go_back(
    app: AppHandle,
    state: tauri::State<'_, WebviewState>,
    tab_id: String,
) -> Result<(), String> {
    let webviews = state.webviews.lock().unwrap();
    let label = webviews.get(&tab_id).ok_or("Webview not found")?;

    let webview = app
        .get_webview_window(label)
        .ok_or("Webview window not found")?;

    webview
        .eval("window.history.back()")
        .map_err(|e| format!("Failed to go back: {}", e))?;

    Ok(())
}

/// Go forward in webview history
#[tauri::command]
pub async fn webview_go_forward(
    app: AppHandle,
    state: tauri::State<'_, WebviewState>,
    tab_id: String,
) -> Result<(), String> {
    let webviews = state.webviews.lock().unwrap();
    let label = webviews.get(&tab_id).ok_or("Webview not found")?;

    let webview = app
        .get_webview_window(label)
        .ok_or("Webview window not found")?;

    webview
        .eval("window.history.forward()")
        .map_err(|e| format!("Failed to go forward: {}", e))?;

    Ok(())
}

/// Reload webview
#[tauri::command]
pub async fn webview_reload(
    app: AppHandle,
    state: tauri::State<'_, WebviewState>,
    tab_id: String,
) -> Result<(), String> {
    let webviews = state.webviews.lock().unwrap();
    let label = webviews.get(&tab_id).ok_or("Webview not found")?;

    let webview = app
        .get_webview_window(label)
        .ok_or("Webview window not found")?;

    webview
        .eval("window.location.reload()")
        .map_err(|e| format!("Failed to reload: {}", e))?;

    Ok(())
}

/// Resize webview window
#[tauri::command]
pub async fn webview_resize(
    app: AppHandle,
    state: tauri::State<'_, WebviewState>,
    tab_id: String,
    width: f64,
    height: f64,
) -> Result<(), String> {
    let webviews = state.webviews.lock().unwrap();
    let label = webviews.get(&tab_id).ok_or("Webview not found")?;

    let webview = app
        .get_webview_window(label)
        .ok_or("Webview window not found")?;

    webview
        .set_size(PhysicalSize::new(width as u32, height as u32))
        .map_err(|e| format!("Failed to resize: {}", e))?;

    Ok(())
}

/// Move webview window
#[tauri::command]
pub async fn webview_move(
    app: AppHandle,
    state: tauri::State<'_, WebviewState>,
    tab_id: String,
    x: f64,
    y: f64,
) -> Result<(), String> {
    let webviews = state.webviews.lock().unwrap();
    let label = webviews.get(&tab_id).ok_or("Webview not found")?;

    let webview = app
        .get_webview_window(label)
        .ok_or("Webview window not found")?;

    webview
        .set_position(PhysicalPosition::new(x as i32, y as i32))
        .map_err(|e| format!("Failed to move: {}", e))?;

    Ok(())
}

/// Position and size a webview window relative to the main window's toolbar
#[tauri::command]
pub async fn position_browser_tab_window(
    app: AppHandle,
    state: tauri::State<'_, WebviewState>,
    tab_id: String,
    toolbar_height: Option<u32>,
) -> Result<(), String> {
    let toolbar_height = toolbar_height.unwrap_or(180);

    let label = {
        let webviews = state.webviews.lock().unwrap();
        webviews
            .get(&tab_id)
            .cloned()
            .ok_or_else(|| "Webview not found".to_string())?
    };

    let main_window = app
        .get_webview_window("main")
        .ok_or_else(|| "Main window not found".to_string())?;

    let main_position = main_window
        .outer_position()
        .map_err(|e| format!("Failed to get main window position: {}", e))?;
    let main_size = main_window
        .outer_size()
        .map_err(|e| format!("Failed to get main window size: {}", e))?;

    let child_window = app
        .get_webview_window(&label)
        .ok_or_else(|| "Webview window not found".to_string())?;

    let desired_y = main_position.y + toolbar_height as i32;
    let desired_height = (main_size.height).saturating_sub(toolbar_height).max(1);

    child_window
        .set_position(PhysicalPosition::new(main_position.x, desired_y))
        .map_err(|e| format!("Failed to position webview: {}", e))?;

    child_window
        .set_size(PhysicalSize::new(main_size.width, desired_height))
        .map_err(|e| format!("Failed to resize webview: {}", e))?;

    Ok(())
}

/// Show/hide webview window
#[tauri::command]
pub async fn webview_set_visible(
    app: AppHandle,
    state: tauri::State<'_, WebviewState>,
    tab_id: String,
    visible: bool,
) -> Result<(), String> {
    let webviews = state.webviews.lock().unwrap();
    let label = webviews.get(&tab_id).ok_or("Webview not found")?;

    let webview = app
        .get_webview_window(label)
        .ok_or("Webview window not found")?;

    if visible {
        webview
            .show()
            .map_err(|e| format!("Failed to show: {}", e))?;
    } else {
        webview
            .hide()
            .map_err(|e| format!("Failed to hide: {}", e))?;
    }

    Ok(())
}

/// Get all active webviews
#[tauri::command]
pub async fn webview_get_all(state: tauri::State<'_, WebviewState>) -> Result<Vec<String>, String> {
    let webviews = state.webviews.lock().unwrap();
    Ok(webviews.keys().cloned().collect())
}

/// Execute JavaScript in webview
#[tauri::command]
pub async fn webview_eval_js(
    app: AppHandle,
    state: tauri::State<'_, WebviewState>,
    tab_id: String,
    script: String,
) -> Result<String, String> {
    let webviews = state.webviews.lock().unwrap();
    let label = webviews.get(&tab_id).ok_or("Webview not found")?;

    let webview = app
        .get_webview_window(label)
        .ok_or("Webview window not found")?;

    webview
        .eval(&script)
        .map_err(|e| format!("Script execution failed: {}", e))?;

    Ok("Script executed successfully".to_string())
}
