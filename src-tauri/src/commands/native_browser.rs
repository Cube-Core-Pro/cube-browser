// Native Browser Commands - Full-featured WebviewWindow Browser
// This provides a native browser experience with full cookie, DRM, and auth support
// Used for YouTube, Netflix, banking, OAuth, and any site requiring full browser capabilities

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

/// State for managing native browser windows
pub struct NativeBrowserState {
    pub windows: Mutex<HashMap<String, NativeBrowserInfo>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NativeBrowserInfo {
    pub tab_id: String,
    pub window_label: String,
    pub url: String,
    pub title: String,
    pub visible: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NativeBrowserBounds {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

impl Default for NativeBrowserState {
    fn default() -> Self {
        Self {
            windows: Mutex::new(HashMap::new()),
        }
    }
}

/// Create a native browser window for full site access
/// This creates a WebviewWindow that can access any site with full cookie/auth support
#[tauri::command]
pub async fn native_browser_create(
    app: AppHandle,
    state: tauri::State<'_, NativeBrowserState>,
    tab_id: String,
    url: String,
    bounds: NativeBrowserBounds,
) -> Result<String, String> {
    println!("🌐 [NATIVE BROWSER] Creating window for tab: {}", tab_id);
    println!("🌐 [NATIVE BROWSER] URL: {}", url);
    println!("🌐 [NATIVE BROWSER] Bounds: x={}, y={}, w={}, h={}", 
             bounds.x, bounds.y, bounds.width, bounds.height);

    let window_label = format!("browser_{}", tab_id);

    // Check if window already exists
    {
        let windows = state.windows.lock().unwrap();
        if windows.contains_key(&tab_id) {
            println!("⚠️ [NATIVE BROWSER] Window already exists: {}", window_label);
            return Ok(window_label);
        }
    }

    // Parse URL
    let webview_url = if url.is_empty() || url == "about:blank" {
        WebviewUrl::App("about:blank".into())
    } else {
        WebviewUrl::External(url.parse().map_err(|e| format!("Invalid URL: {}", e))?)
    };

    // Create the browser window
    // This is a real WebviewWindow with full browser capabilities
    let webview = WebviewWindowBuilder::new(&app, &window_label, webview_url)
        .title(format!("CUBE Browser - {}", tab_id))
        .inner_size(bounds.width, bounds.height)
        .position(bounds.x, bounds.y)
        .decorations(false)           // Frameless to integrate with CUBE UI
        .resizable(false)             // Size controlled by CUBE
        .visible(true)
        .skip_taskbar(true)           // Don't clutter taskbar
        .focused(true)
        .build()
        .map_err(|e| format!("Failed to create browser window: {}", e))?;

    // Configure for full web access
    // Enable DevTools in debug mode
    #[cfg(debug_assertions)]
    {
        webview.open_devtools();
    }

    // Store window info
    let info = NativeBrowserInfo {
        tab_id: tab_id.clone(),
        window_label: window_label.clone(),
        url: url.clone(),
        title: "Loading...".to_string(),
        visible: true,
    };

    {
        let mut windows = state.windows.lock().unwrap();
        windows.insert(tab_id.clone(), info);
    }

    println!("✅ [NATIVE BROWSER] Created window: {}", window_label);
    Ok(window_label)
}

/// Navigate native browser to new URL
#[tauri::command]
pub async fn native_browser_navigate(
    app: AppHandle,
    state: tauri::State<'_, NativeBrowserState>,
    tab_id: String,
    url: String,
) -> Result<(), String> {
    println!("🔗 [NATIVE BROWSER] Navigating {} to: {}", tab_id, url);

    let window_label = format!("browser_{}", tab_id);
    
    let webview = app
        .get_webview_window(&window_label)
        .ok_or_else(|| format!("Browser window not found: {}", window_label))?;

    // Navigate using JavaScript to maintain session state
    let script = format!(
        "window.location.href = '{}';",
        url.replace("'", "\\'").replace("\\", "\\\\")
    );
    
    webview
        .eval(&script)
        .map_err(|e| format!("Navigation failed: {}", e))?;

    // Update state
    {
        let mut windows = state.windows.lock().unwrap();
        if let Some(info) = windows.get_mut(&tab_id) {
            info.url = url;
        }
    }

    Ok(())
}

/// Close native browser window
#[tauri::command]
pub async fn native_browser_close(
    app: AppHandle,
    state: tauri::State<'_, NativeBrowserState>,
    tab_id: String,
) -> Result<(), String> {
    println!("❌ [NATIVE BROWSER] Closing: {}", tab_id);

    let window_label = format!("browser_{}", tab_id);
    
    if let Some(webview) = app.get_webview_window(&window_label) {
        webview.close().map_err(|e| format!("Failed to close window: {}", e))?;
    }

    // Remove from state
    {
        let mut windows = state.windows.lock().unwrap();
        windows.remove(&tab_id);
    }

    Ok(())
}

/// Go back in browser history
#[tauri::command]
pub async fn native_browser_back(
    app: AppHandle,
    tab_id: String,
) -> Result<(), String> {
    let window_label = format!("browser_{}", tab_id);
    
    let webview = app
        .get_webview_window(&window_label)
        .ok_or_else(|| format!("Browser window not found: {}", window_label))?;

    webview
        .eval("window.history.back();")
        .map_err(|e| format!("Back navigation failed: {}", e))?;

    Ok(())
}

/// Go forward in browser history
#[tauri::command]
pub async fn native_browser_forward(
    app: AppHandle,
    tab_id: String,
) -> Result<(), String> {
    let window_label = format!("browser_{}", tab_id);
    
    let webview = app
        .get_webview_window(&window_label)
        .ok_or_else(|| format!("Browser window not found: {}", window_label))?;

    webview
        .eval("window.history.forward();")
        .map_err(|e| format!("Forward navigation failed: {}", e))?;

    Ok(())
}

/// Reload the browser page
#[tauri::command]
pub async fn native_browser_reload(
    app: AppHandle,
    tab_id: String,
) -> Result<(), String> {
    let window_label = format!("browser_{}", tab_id);
    
    let webview = app
        .get_webview_window(&window_label)
        .ok_or_else(|| format!("Browser window not found: {}", window_label))?;

    webview
        .eval("window.location.reload();")
        .map_err(|e| format!("Reload failed: {}", e))?;

    Ok(())
}

/// Update browser window bounds
#[tauri::command]
pub async fn native_browser_set_bounds(
    app: AppHandle,
    tab_id: String,
    bounds: NativeBrowserBounds,
) -> Result<(), String> {
    let window_label = format!("browser_{}", tab_id);
    
    let webview = app
        .get_webview_window(&window_label)
        .ok_or_else(|| format!("Browser window not found: {}", window_label))?;

    // Set position
    webview
        .set_position(tauri::Position::Physical(tauri::PhysicalPosition {
            x: bounds.x as i32,
            y: bounds.y as i32,
        }))
        .map_err(|e| format!("Failed to set position: {}", e))?;

    // Set size
    webview
        .set_size(tauri::Size::Physical(tauri::PhysicalSize {
            width: bounds.width as u32,
            height: bounds.height as u32,
        }))
        .map_err(|e| format!("Failed to set size: {}", e))?;

    Ok(())
}

/// Show or hide browser window
#[tauri::command]
pub async fn native_browser_set_visible(
    app: AppHandle,
    state: tauri::State<'_, NativeBrowserState>,
    tab_id: String,
    visible: bool,
) -> Result<(), String> {
    let window_label = format!("browser_{}", tab_id);
    
    let webview = app
        .get_webview_window(&window_label)
        .ok_or_else(|| format!("Browser window not found: {}", window_label))?;

    if visible {
        webview.show().map_err(|e| format!("Failed to show window: {}", e))?;
    } else {
        webview.hide().map_err(|e| format!("Failed to hide window: {}", e))?;
    }

    // Update state
    {
        let mut windows = state.windows.lock().unwrap();
        if let Some(info) = windows.get_mut(&tab_id) {
            info.visible = visible;
        }
    }

    Ok(())
}

/// Get current URL from browser
#[tauri::command]
pub async fn native_browser_get_url(
    app: AppHandle,
    tab_id: String,
) -> Result<String, String> {
    let window_label = format!("browser_{}", tab_id);
    
    let webview = app
        .get_webview_window(&window_label)
        .ok_or_else(|| format!("Browser window not found: {}", window_label))?;

    // Get URL via URL method
    let url = webview.url().map_err(|e| format!("Failed to get URL: {}", e))?;
    Ok(url.to_string())
}

/// Get page title from browser
#[tauri::command]
pub async fn native_browser_get_title(
    app: AppHandle,
    tab_id: String,
) -> Result<String, String> {
    let window_label = format!("browser_{}", tab_id);
    
    let webview = app
        .get_webview_window(&window_label)
        .ok_or_else(|| format!("Browser window not found: {}", window_label))?;

    let title = webview.title().map_err(|e| format!("Failed to get title: {}", e))?;
    Ok(title)
}

/// Execute JavaScript in browser
#[tauri::command]
pub async fn native_browser_eval(
    app: AppHandle,
    tab_id: String,
    script: String,
) -> Result<(), String> {
    let window_label = format!("browser_{}", tab_id);
    
    let webview = app
        .get_webview_window(&window_label)
        .ok_or_else(|| format!("Browser window not found: {}", window_label))?;

    webview
        .eval(&script)
        .map_err(|e| format!("Script execution failed: {}", e))?;

    Ok(())
}

/// Focus the browser window
#[tauri::command]
pub async fn native_browser_focus(
    app: AppHandle,
    tab_id: String,
) -> Result<(), String> {
    let window_label = format!("browser_{}", tab_id);
    
    let webview = app
        .get_webview_window(&window_label)
        .ok_or_else(|| format!("Browser window not found: {}", window_label))?;

    webview
        .set_focus()
        .map_err(|e| format!("Failed to focus window: {}", e))?;

    Ok(())
}

/// List all native browser windows
#[tauri::command]
pub async fn native_browser_list(
    state: tauri::State<'_, NativeBrowserState>,
) -> Result<Vec<NativeBrowserInfo>, String> {
    let windows = state.windows.lock().unwrap();
    Ok(windows.values().cloned().collect())
}

/// Close all native browser windows
#[tauri::command]
pub async fn native_browser_close_all(
    app: AppHandle,
    state: tauri::State<'_, NativeBrowserState>,
) -> Result<(), String> {
    let tab_ids: Vec<String> = {
        let windows = state.windows.lock().unwrap();
        windows.keys().cloned().collect()
    };

    for tab_id in tab_ids {
        let window_label = format!("browser_{}", tab_id);
        if let Some(webview) = app.get_webview_window(&window_label) {
            let _ = webview.close();
        }
    }

    // Clear state
    {
        let mut windows = state.windows.lock().unwrap();
        windows.clear();
    }

    println!("✅ [NATIVE BROWSER] Closed all browser windows");
    Ok(())
}
