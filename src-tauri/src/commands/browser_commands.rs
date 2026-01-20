// Browser Commands - Tauri Integration for Headless Chrome
use crate::services::browser_service::{BrowserService, ElementInfo, TabInfo};
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub async fn browser_launch(browser: State<'_, Arc<BrowserService>>) -> Result<String, String> {
    browser.launch().map_err(|e| e.to_string())?;
    Ok("Browser launched successfully".to_string())
}

#[tauri::command]
pub async fn browser_is_running(browser: State<'_, Arc<BrowserService>>) -> Result<bool, String> {
    Ok(browser.is_running())
}

#[tauri::command]
pub async fn browser_close(browser: State<'_, Arc<BrowserService>>) -> Result<(), String> {
    browser.close().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn browser_new_tab(browser: State<'_, Arc<BrowserService>>) -> Result<String, String> {
    browser.new_tab().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn browser_close_tab(
    browser: State<'_, Arc<BrowserService>>,
    tab_id: String,
) -> Result<(), String> {
    browser.close_tab(&tab_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn browser_get_tabs(
    browser: State<'_, Arc<BrowserService>>,
) -> Result<Vec<TabInfo>, String> {
    browser.get_tabs().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn browser_navigate(
    browser: State<'_, Arc<BrowserService>>,
    tab_id: String,
    url: String,
) -> Result<(), String> {
    browser.navigate(&tab_id, &url).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn browser_reload(
    browser: State<'_, Arc<BrowserService>>,
    tab_id: String,
) -> Result<(), String> {
    browser.reload(&tab_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn browser_go_back(
    browser: State<'_, Arc<BrowserService>>,
    tab_id: String,
) -> Result<(), String> {
    browser.go_back(&tab_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn browser_go_forward(
    browser: State<'_, Arc<BrowserService>>,
    tab_id: String,
) -> Result<(), String> {
    browser.go_forward(&tab_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn browser_wait_for_element(
    browser: State<'_, Arc<BrowserService>>,
    tab_id: String,
    selector: String,
    timeout_ms: Option<u64>,
) -> Result<(), String> {
    browser
        .wait_for_element(&tab_id, &selector, timeout_ms)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn browser_click(
    browser: State<'_, Arc<BrowserService>>,
    tab_id: String,
    selector: String,
) -> Result<(), String> {
    browser.click(&tab_id, &selector).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn browser_type(
    browser: State<'_, Arc<BrowserService>>,
    tab_id: String,
    selector: String,
    text: String,
) -> Result<(), String> {
    browser
        .type_text(&tab_id, &selector, &text)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn browser_get_text(
    browser: State<'_, Arc<BrowserService>>,
    tab_id: String,
    selector: String,
) -> Result<String, String> {
    browser
        .get_text(&tab_id, &selector)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn browser_get_attribute(
    browser: State<'_, Arc<BrowserService>>,
    tab_id: String,
    selector: String,
    attribute: String,
) -> Result<Option<String>, String> {
    browser
        .get_attribute(&tab_id, &selector, &attribute)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn browser_get_element_info(
    browser: State<'_, Arc<BrowserService>>,
    tab_id: String,
    selector: String,
) -> Result<ElementInfo, String> {
    browser
        .get_element_info(&tab_id, &selector)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn browser_screenshot(
    browser: State<'_, Arc<BrowserService>>,
    tab_id: String,
) -> Result<Vec<u8>, String> {
    browser.screenshot(&tab_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn browser_screenshot_element(
    browser: State<'_, Arc<BrowserService>>,
    tab_id: String,
    selector: String,
) -> Result<Vec<u8>, String> {
    browser
        .screenshot_element(&tab_id, &selector)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn browser_evaluate(
    browser: State<'_, Arc<BrowserService>>,
    tab_id: String,
    script: String,
) -> Result<serde_json::Value, String> {
    browser
        .evaluate(&tab_id, &script)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn browser_get_html(
    browser: State<'_, Arc<BrowserService>>,
    tab_id: String,
) -> Result<String, String> {
    browser.get_html(&tab_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn browser_get_title(
    browser: State<'_, Arc<BrowserService>>,
    tab_id: String,
) -> Result<String, String> {
    browser.get_title(&tab_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn browser_get_url(
    browser: State<'_, Arc<BrowserService>>,
    tab_id: String,
) -> Result<String, String> {
    browser.get_url(&tab_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn browser_find_elements(
    browser: State<'_, Arc<BrowserService>>,
    tab_id: String,
    selector: String,
) -> Result<Vec<String>, String> {
    browser
        .find_elements(&tab_id, &selector)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn browser_count_elements(
    browser: State<'_, Arc<BrowserService>>,
    tab_id: String,
    selector: String,
) -> Result<usize, String> {
    browser
        .count_elements(&tab_id, &selector)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_page_html(
    browser: State<'_, Arc<BrowserService>>,
    tab_id: String,
) -> Result<String, String> {
    browser.get_page_html(&tab_id).map_err(|e| e.to_string())
}
