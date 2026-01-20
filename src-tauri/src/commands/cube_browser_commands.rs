// CUBE Browser Engine - Tauri Commands
// Exposes the full Chromium browser engine to the frontend
// All commands provide complete access to DOM, cookies, storage, and more

use crate::services::cube_browser_engine::{
    BrowserConfig, BrowserTab, CookieData, DOMElement, 
    ScreenshotOptions, CUBE_BROWSER
};
use std::collections::HashMap;
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};

// ============================================
// Browser Lifecycle Commands
// ============================================

/// Initialize the CUBE Browser Engine
#[tauri::command]
pub async fn cube_engine_init(config: Option<BrowserConfig>) -> Result<String, String> {
    let mut browser = CUBE_BROWSER.lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    browser.initialize(config)?;
    
    Ok("CUBE Browser Engine initialized successfully".to_string())
}

/// Shutdown the CUBE Browser Engine
#[tauri::command]
pub async fn cube_engine_shutdown() -> Result<String, String> {
    let mut browser = CUBE_BROWSER.lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    browser.shutdown()?;
    
    Ok("CUBE Browser Engine shutdown complete".to_string())
}

// ============================================
// Tab Management Commands
// ============================================

/// Create a new browser tab
#[tauri::command]
pub async fn cube_create_tab(url: String) -> Result<BrowserTab, String> {
    let browser = CUBE_BROWSER.lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    browser.create_tab(&url)
}

/// Navigate a tab to a URL
#[tauri::command]
pub async fn cube_navigate(tab_id: String, url: String) -> Result<(), String> {
    let browser = CUBE_BROWSER.lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    browser.navigate(&tab_id, &url)
}

/// Close a tab
#[tauri::command]
pub async fn cube_close_tab(tab_id: String) -> Result<(), String> {
    let browser = CUBE_BROWSER.lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    browser.close_tab(&tab_id)
}

/// Go back in history
#[tauri::command]
pub async fn cube_go_back(tab_id: String) -> Result<(), String> {
    let browser = CUBE_BROWSER.lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    browser.go_back(&tab_id)
}

/// Go forward in history
#[tauri::command]
pub async fn cube_go_forward(tab_id: String) -> Result<(), String> {
    let browser = CUBE_BROWSER.lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    browser.go_forward(&tab_id)
}

/// Reload the page
#[tauri::command]
pub async fn cube_reload(tab_id: String) -> Result<(), String> {
    let browser = CUBE_BROWSER.lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    browser.reload(&tab_id)
}

/// Get current URL
#[tauri::command]
pub async fn cube_get_url(tab_id: String) -> Result<String, String> {
    let browser = CUBE_BROWSER.lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    browser.get_url(&tab_id)
}

/// Get page title
#[tauri::command]
pub async fn cube_get_title(tab_id: String) -> Result<String, String> {
    let browser = CUBE_BROWSER.lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    browser.get_title(&tab_id)
}

// ============================================
// DOM Access Commands
// ============================================

/// Execute JavaScript on the page
#[tauri::command]
pub async fn cube_execute_script(tab_id: String, script: String) -> Result<serde_json::Value, String> {
    let browser = CUBE_BROWSER.lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    browser.execute_script(&tab_id, &script)
}

/// Query selector for single element
#[tauri::command]
pub async fn cube_query_selector(tab_id: String, selector: String) -> Result<Option<DOMElement>, String> {
    let browser = CUBE_BROWSER.lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    browser.query_selector(&tab_id, &selector)
}

/// Query selector for multiple elements
#[tauri::command]
pub async fn cube_query_selector_all(tab_id: String, selector: String) -> Result<Vec<DOMElement>, String> {
    let browser = CUBE_BROWSER.lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    browser.query_selector_all(&tab_id, &selector)
}

/// Get full page HTML
#[tauri::command]
pub async fn cube_get_page_html(tab_id: String) -> Result<String, String> {
    let browser = CUBE_BROWSER.lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    browser.get_page_html(&tab_id)
}

/// Get element inner HTML
#[tauri::command]
pub async fn cube_get_inner_html(tab_id: String, selector: String) -> Result<String, String> {
    let browser = CUBE_BROWSER.lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    browser.get_inner_html(&tab_id, &selector)
}

/// Set element value
#[tauri::command]
pub async fn cube_set_value(tab_id: String, selector: String, value: String) -> Result<(), String> {
    let browser = CUBE_BROWSER.lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    browser.set_value(&tab_id, &selector, &value)
}

/// Click an element
#[tauri::command]
pub async fn cube_click(tab_id: String, selector: String) -> Result<(), String> {
    let browser = CUBE_BROWSER.lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    browser.click(&tab_id, &selector)
}

/// Type text into element
#[tauri::command]
pub async fn cube_type_text(tab_id: String, selector: String, text: String) -> Result<(), String> {
    let browser = CUBE_BROWSER.lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    browser.type_text(&tab_id, &selector, &text)
}

/// Focus an element
#[tauri::command]
pub async fn cube_focus(tab_id: String, selector: String) -> Result<(), String> {
    let browser = CUBE_BROWSER.lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    browser.focus(&tab_id, &selector)
}

/// Scroll to element
#[tauri::command]
pub async fn cube_scroll_to(tab_id: String, selector: String) -> Result<(), String> {
    let browser = CUBE_BROWSER.lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    browser.scroll_to(&tab_id, &selector)
}

// ============================================
// Screenshot & Capture Commands
// ============================================

/// Take a screenshot (returns base64)
#[tauri::command]
pub async fn cube_screenshot(tab_id: String, full_page: Option<bool>) -> Result<String, String> {
    let browser = CUBE_BROWSER.lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    let data = browser.screenshot(&tab_id, full_page.unwrap_or(false))?;
    Ok(BASE64.encode(&data))
}

/// Capture current frame as base64
#[tauri::command]
pub async fn cube_capture_frame(tab_id: String) -> Result<String, String> {
    let browser = CUBE_BROWSER.lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    browser.capture_frame(&tab_id)
}

// ============================================
// Cookie & Storage Commands
// ============================================

/// Get all cookies
#[tauri::command]
pub async fn cube_get_cookies(tab_id: String) -> Result<Vec<CookieData>, String> {
    let browser = CUBE_BROWSER.lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    browser.get_cookies(&tab_id)
}

/// Set a cookie
#[tauri::command]
pub async fn cube_set_cookie(tab_id: String, cookie: CookieData) -> Result<(), String> {
    let browser = CUBE_BROWSER.lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    browser.set_cookie(&tab_id, &cookie)
}

/// Get localStorage value
#[tauri::command]
pub async fn cube_get_local_storage(tab_id: String, key: String) -> Result<Option<String>, String> {
    let browser = CUBE_BROWSER.lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    browser.get_local_storage(&tab_id, &key)
}

/// Set localStorage value
#[tauri::command]
pub async fn cube_set_local_storage(tab_id: String, key: String, value: String) -> Result<(), String> {
    let browser = CUBE_BROWSER.lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    browser.set_local_storage(&tab_id, &key, &value)
}

/// Get sessionStorage value
#[tauri::command]
pub async fn cube_get_session_storage(tab_id: String, key: String) -> Result<Option<String>, String> {
    let browser = CUBE_BROWSER.lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    browser.get_session_storage(&tab_id, &key)
}

/// Set sessionStorage value
#[tauri::command]
pub async fn cube_set_session_storage(tab_id: String, key: String, value: String) -> Result<(), String> {
    let browser = CUBE_BROWSER.lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    browser.set_session_storage(&tab_id, &key, &value)
}

// ============================================
// Form Commands (for Autofill)
// ============================================

/// Get all form fields
#[tauri::command]
pub async fn cube_get_form_fields(tab_id: String) -> Result<Vec<DOMElement>, String> {
    let browser = CUBE_BROWSER.lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    browser.get_form_fields(&tab_id)
}

/// Fill form with data
#[tauri::command]
pub async fn cube_fill_form(tab_id: String, data: HashMap<String, String>) -> Result<(), String> {
    let browser = CUBE_BROWSER.lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    browser.fill_form(&tab_id, &data)
}

/// Submit a form
#[tauri::command]
pub async fn cube_submit_form(tab_id: String, form_selector: String) -> Result<(), String> {
    let browser = CUBE_BROWSER.lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    browser.submit_form(&tab_id, &form_selector)
}

// ============================================
// Data Extraction Commands
// ============================================

/// Extract structured data
#[tauri::command]
pub async fn cube_extract_data(tab_id: String, schema: HashMap<String, String>) -> Result<HashMap<String, String>, String> {
    let browser = CUBE_BROWSER.lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    browser.extract_data(&tab_id, &schema)
}

/// Extract table data
#[tauri::command]
pub async fn cube_extract_table(tab_id: String, table_selector: String) -> Result<Vec<Vec<String>>, String> {
    let browser = CUBE_BROWSER.lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    browser.extract_table(&tab_id, &table_selector)
}

// ============================================
// PDF Generation Command
// ============================================

/// Generate PDF (returns base64)
#[tauri::command]
pub async fn cube_print_to_pdf(tab_id: String) -> Result<String, String> {
    let browser = CUBE_BROWSER.lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    let data = browser.print_to_pdf(&tab_id)?;
    Ok(BASE64.encode(&data))
}
