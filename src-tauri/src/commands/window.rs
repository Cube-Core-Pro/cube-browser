use tauri::Window;

#[tauri::command]
pub async fn minimize_window(window: Window) -> Result<(), String> {
    window
        .minimize()
        .map_err(|e| format!("Failed to minimize window: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn maximize_window(window: Window) -> Result<(), String> {
    window
        .maximize()
        .map_err(|e| format!("Failed to maximize window: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn unmaximize_window(window: Window) -> Result<(), String> {
    window
        .unmaximize()
        .map_err(|e| format!("Failed to unmaximize window: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn close_window(window: Window) -> Result<(), String> {
    window
        .close()
        .map_err(|e| format!("Failed to close window: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn is_window_maximized(window: Window) -> Result<bool, String> {
    window
        .is_maximized()
        .map_err(|e| format!("Failed to check window state: {}", e))
}

#[tauri::command]
pub async fn toggle_fullscreen(window: Window) -> Result<(), String> {
    let is_fullscreen = window
        .is_fullscreen()
        .map_err(|e| format!("Failed to check fullscreen state: {}", e))?;
    
    window
        .set_fullscreen(!is_fullscreen)
        .map_err(|e| format!("Failed to toggle fullscreen: {}", e))?;
    
    Ok(())
}

#[tauri::command]
pub async fn set_window_title(window: Window, title: String) -> Result<(), String> {
    window
        .set_title(&title)
        .map_err(|e| format!("Failed to set window title: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn get_window_size(window: Window) -> Result<(u32, u32), String> {
    let size = window
        .inner_size()
        .map_err(|e| format!("Failed to get window size: {}", e))?;
    
    Ok((size.width, size.height))
}

#[tauri::command]
pub async fn set_window_size(window: Window, width: u32, height: u32) -> Result<(), String> {
    use tauri::Size;
    
    window
        .set_size(Size::Physical(tauri::PhysicalSize { width, height }))
        .map_err(|e| format!("Failed to set window size: {}", e))?;
    
    Ok(())
}

#[tauri::command]
pub async fn center_window(window: Window) -> Result<(), String> {
    window
        .center()
        .map_err(|e| format!("Failed to center window: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn show_window(window: Window) -> Result<(), String> {
    window
        .show()
        .map_err(|e| format!("Failed to show window: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn hide_window(window: Window) -> Result<(), String> {
    window
        .hide()
        .map_err(|e| format!("Failed to hide window: {}", e))?;
    Ok(())
}

/// Opens a URL in the system's default browser
/// This bypasses iframe restrictions (X-Frame-Options) that block sites like google.com
#[tauri::command]
#[allow(deprecated)]
pub async fn open_external_url(app: tauri::AppHandle, url: String) -> Result<(), String> {
    use tauri_plugin_shell::ShellExt;
    
    // Validate URL format
    if !url.starts_with("http://") && !url.starts_with("https://") {
        return Err("Invalid URL: must start with http:// or https://".to_string());
    }
    
    app.shell()
        .open(&url, None)
        .map_err(|e| format!("Failed to open URL in browser: {}", e))?;
    
    Ok(())
}
