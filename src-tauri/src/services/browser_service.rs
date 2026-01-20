// Browser Service - Headless Chrome Integration
use anyhow::{anyhow, Result};
use headless_chrome::protocol::cdp::Page;
use headless_chrome::{Browser, LaunchOptions, Tab};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex as StdMutex};
use tauri::AppHandle;

/// Tab Information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TabInfo {
    pub id: String,
    pub url: String,
    pub title: String,
    pub loading: bool,
}

/// Element Information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ElementInfo {
    #[serde(rename = "tagName")]
    pub tag_name: String,
    pub text: String,
    pub html: String,
    pub attributes: HashMap<String, String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub visible: Option<bool>,
    pub bounds: ElementBounds,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ElementBounds {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

/// Browser Service - Enterprise Headless Chrome Integration
pub struct BrowserService {
    browser: Arc<StdMutex<Option<Browser>>>,
    tabs: Arc<StdMutex<HashMap<String, Arc<Tab>>>>,
    #[allow(dead_code)]
    app_handle: Option<AppHandle>,
}

impl BrowserService {
    /// Create new browser service
    pub fn new(app_handle: AppHandle) -> Self {
        Self {
            browser: Arc::new(StdMutex::new(None)),
            tabs: Arc::new(StdMutex::new(HashMap::new())),
            app_handle: Some(app_handle),
        }
    }

    #[cfg(test)]
    pub fn new_for_tests() -> Self {
        Self {
            browser: Arc::new(StdMutex::new(None)),
            tabs: Arc::new(StdMutex::new(HashMap::new())),
            app_handle: None,
        }
    }

    /// Launch headless browser
    pub fn launch(&self) -> Result<()> {
        let launch_options = LaunchOptions::default_builder()
            .headless(true)
            .build()
            .map_err(|e| anyhow!("Failed to build launch options: {}", e))?;

        let browser =
            Browser::new(launch_options).map_err(|e| anyhow!("Failed to launch browser: {}", e))?;

        let mut browser_guard = self.browser.lock().unwrap();
        *browser_guard = Some(browser);

        Ok(())
    }

    /// Check if browser is running
    pub fn is_running(&self) -> bool {
        self.browser.lock().unwrap().is_some()
    }

    /// Close browser and all tabs
    pub fn close(&self) -> Result<()> {
        let mut tabs_guard = self.tabs.lock().unwrap();
        tabs_guard.clear();

        let mut browser_guard = self.browser.lock().unwrap();
        *browser_guard = None;

        Ok(())
    }

    /// Create new tab
    pub fn new_tab(&self) -> Result<String> {
        let browser_guard = self.browser.lock().unwrap();
        let browser = browser_guard
            .as_ref()
            .ok_or_else(|| anyhow!("Browser not launched"))?;

        let tab = browser
            .new_tab()
            .map_err(|e| anyhow!("Failed to create tab: {}", e))?;

        let tab_id = uuid::Uuid::new_v4().to_string();

        let mut tabs_guard = self.tabs.lock().unwrap();
        tabs_guard.insert(tab_id.clone(), tab);

        Ok(tab_id)
    }

    /// Close specific tab
    pub fn close_tab(&self, tab_id: &str) -> Result<()> {
        let mut tabs_guard = self.tabs.lock().unwrap();
        tabs_guard
            .remove(tab_id)
            .ok_or_else(|| anyhow!("Tab not found"))?;

        Ok(())
    }

    /// Get all tabs
    pub fn get_tabs(&self) -> Result<Vec<TabInfo>> {
        let tabs_guard = self.tabs.lock().unwrap();
        let mut tab_infos = Vec::new();

        for (tab_id, tab) in tabs_guard.iter() {
            let url = tab.get_url();
            let title = tab.get_title().unwrap_or_else(|_| "Untitled".to_string());
            let ready_state = tab
                .evaluate("document.readyState", false)
                .ok()
                .and_then(|result| result.value)
                .and_then(|value| value.as_str().map(|state| state.to_lowercase()));

            let loading = match ready_state.as_deref() {
                Some("complete") => false,
                Some("interactive") | Some("loading") | Some("uninitialized") => true,
                _ => false,
            };

            tab_infos.push(TabInfo {
                id: tab_id.clone(),
                url,
                title,
                loading,
            });
        }

        Ok(tab_infos)
    }

    /// Navigate to URL
    pub fn navigate(&self, tab_id: &str, url: &str) -> Result<()> {
        let tabs_guard = self.tabs.lock().unwrap();
        let tab = tabs_guard
            .get(tab_id)
            .ok_or_else(|| anyhow!("Tab not found"))?;

        tab.navigate_to(url)
            .map_err(|e| anyhow!("Navigation failed: {}", e))?;

        // Wait for page load
        tab.wait_until_navigated()
            .map_err(|e| anyhow!("Wait for navigation failed: {}", e))?;

        Ok(())
    }

    /// Reload page
    pub fn reload(&self, tab_id: &str) -> Result<()> {
        let tabs_guard = self.tabs.lock().unwrap();
        let tab = tabs_guard
            .get(tab_id)
            .ok_or_else(|| anyhow!("Tab not found"))?;

        tab.reload(false, None)
            .map_err(|e| anyhow!("Reload failed: {}", e))?;

        Ok(())
    }

    /// Go back
    pub fn go_back(&self, tab_id: &str) -> Result<()> {
        // headless_chrome doesn't support go_back directly
        // Use JavaScript instead
        self.evaluate(tab_id, "window.history.back()")?;
        Ok(())
    }

    /// Go forward
    pub fn go_forward(&self, tab_id: &str) -> Result<()> {
        // headless_chrome doesn't support go_forward directly
        // Use JavaScript instead
        self.evaluate(tab_id, "window.history.forward()")?;
        Ok(())
    }

    /// Wait for element to exist
    pub fn wait_for_element(
        &self,
        tab_id: &str,
        selector: &str,
        timeout_ms: Option<u64>,
    ) -> Result<()> {
        let tabs_guard = self.tabs.lock().unwrap();
        let tab = tabs_guard
            .get(tab_id)
            .ok_or_else(|| anyhow!("Tab not found"))?;

        let timeout = timeout_ms.unwrap_or(30000);

        tab.wait_for_element_with_custom_timeout(
            selector,
            std::time::Duration::from_millis(timeout),
        )
        .map_err(|e| anyhow!("Element not found: {}", e))?;

        Ok(())
    }

    /// Click element
    pub fn click(&self, tab_id: &str, selector: &str) -> Result<()> {
        let tabs_guard = self.tabs.lock().unwrap();
        let tab = tabs_guard
            .get(tab_id)
            .ok_or_else(|| anyhow!("Tab not found"))?;

        let element = tab
            .wait_for_element(selector)
            .map_err(|e| anyhow!("Element not found: {}", e))?;

        element
            .click()
            .map_err(|e| anyhow!("Click failed: {}", e))?;

        Ok(())
    }

    /// Type text into element
    pub fn type_text(&self, tab_id: &str, selector: &str, text: &str) -> Result<()> {
        let tabs_guard = self.tabs.lock().unwrap();
        let tab = tabs_guard
            .get(tab_id)
            .ok_or_else(|| anyhow!("Tab not found"))?;

        let element = tab
            .wait_for_element(selector)
            .map_err(|e| anyhow!("Element not found: {}", e))?;

        element
            .click()
            .map_err(|e| anyhow!("Click failed: {}", e))?;

        element
            .type_into(text)
            .map_err(|e| anyhow!("Type failed: {}", e))?;

        Ok(())
    }

    /// Get element text
    pub fn get_text(&self, tab_id: &str, selector: &str) -> Result<String> {
        let tabs_guard = self.tabs.lock().unwrap();
        let tab = tabs_guard
            .get(tab_id)
            .ok_or_else(|| anyhow!("Tab not found"))?;

        let element = tab
            .wait_for_element(selector)
            .map_err(|e| anyhow!("Element not found: {}", e))?;

        let text = element
            .get_inner_text()
            .map_err(|e| anyhow!("Get text failed: {}", e))?;

        Ok(text)
    }

    /// Get element attribute
    pub fn get_attribute(
        &self,
        tab_id: &str,
        selector: &str,
        attr: &str,
    ) -> Result<Option<String>> {
        let tabs_guard = self.tabs.lock().unwrap();
        let tab = tabs_guard
            .get(tab_id)
            .ok_or_else(|| anyhow!("Tab not found"))?;

        let element = tab
            .wait_for_element(selector)
            .map_err(|e| anyhow!("Element not found: {}", e))?;

        let value = element
            .get_attribute_value(attr)
            .map_err(|e| anyhow!("Get attribute failed: {}", e))?;

        Ok(value)
    }

    /// Get element information
    pub fn get_element_info(&self, tab_id: &str, selector: &str) -> Result<ElementInfo> {
        let tabs_guard = self.tabs.lock().unwrap();
        let tab = tabs_guard
            .get(tab_id)
            .ok_or_else(|| anyhow!("Tab not found"))?;

        let _element = tab
            .wait_for_element(selector)
            .map_err(|e| anyhow!("Element not found: {}", e))?;

        // Use JavaScript to get element info
        let script = format!(
            r#"
            (function() {{
                let el = document.querySelector('{}');
                if (!el) return null;
                let rect = el.getBoundingClientRect();
                return {{
                    tagName: el.tagName.toLowerCase(),
                    text: el.textContent || '',
                    html: el.innerHTML || '',
                    attributes: Object.fromEntries(
                        Array.from(el.attributes).map(a => [a.name, a.value])
                    ),
                    bounds: {{
                        x: rect.x,
                        y: rect.y,
                        width: rect.width,
                        height: rect.height
                    }}
                }};
            }})()
            "#,
            selector.replace('\'', "\\'")
        );

        let result = tab
            .evaluate(&script, false)
            .map_err(|e| anyhow!("Get element info failed: {}", e))?;

        let value = result.value.ok_or_else(|| anyhow!("No value returned"))?;

        let info: ElementInfo = serde_json::from_value(value)
            .map_err(|e| anyhow!("Parse element info failed: {}", e))?;

        Ok(info)
    }

    /// Capture screenshot (PNG format)
    pub fn screenshot(&self, tab_id: &str) -> Result<Vec<u8>> {
        let tabs_guard = self.tabs.lock().unwrap();
        let tab = tabs_guard
            .get(tab_id)
            .ok_or_else(|| anyhow!("Tab not found"))?;

        let screenshot = tab
            .capture_screenshot(Page::CaptureScreenshotFormatOption::Png, None, None, true)
            .map_err(|e| anyhow!("Screenshot failed: {}", e))?;

        Ok(screenshot)
    }

    /// Capture element screenshot
    pub fn screenshot_element(&self, tab_id: &str, selector: &str) -> Result<Vec<u8>> {
        let tabs_guard = self.tabs.lock().unwrap();
        let tab = tabs_guard
            .get(tab_id)
            .ok_or_else(|| anyhow!("Tab not found"))?;

        let element = tab
            .wait_for_element(selector)
            .map_err(|e| anyhow!("Element not found: {}", e))?;

        let screenshot = element
            .capture_screenshot(Page::CaptureScreenshotFormatOption::Png)
            .map_err(|e| anyhow!("Screenshot failed: {}", e))?;

        Ok(screenshot)
    }

    /// Execute JavaScript
    pub fn evaluate(&self, tab_id: &str, script: &str) -> Result<serde_json::Value> {
        let tabs_guard = self.tabs.lock().unwrap();
        let tab = tabs_guard
            .get(tab_id)
            .ok_or_else(|| anyhow!("Tab not found"))?;

        let result = tab
            .evaluate(script, false)
            .map_err(|e| anyhow!("JavaScript evaluation failed: {}", e))?;

        Ok(result.value.unwrap_or(serde_json::Value::Null))
    }

    /// Get page HTML
    pub fn get_html(&self, tab_id: &str) -> Result<String> {
        let tabs_guard = self.tabs.lock().unwrap();
        let tab = tabs_guard
            .get(tab_id)
            .ok_or_else(|| anyhow!("Tab not found"))?;

        let html = tab
            .get_content()
            .map_err(|e| anyhow!("Get HTML failed: {}", e))?;

        Ok(html)
    }

    /// Get page title
    pub fn get_title(&self, tab_id: &str) -> Result<String> {
        let tabs_guard = self.tabs.lock().unwrap();
        let tab = tabs_guard
            .get(tab_id)
            .ok_or_else(|| anyhow!("Tab not found"))?;

        let title = tab
            .get_title()
            .map_err(|e| anyhow!("Get title failed: {}", e))?;

        Ok(title)
    }

    /// Get current URL
    pub fn get_url(&self, tab_id: &str) -> Result<String> {
        let tabs_guard = self.tabs.lock().unwrap();
        let tab = tabs_guard
            .get(tab_id)
            .ok_or_else(|| anyhow!("Tab not found"))?;

        Ok(tab.get_url())
    }

    /// Find all elements matching selector
    pub fn find_elements(&self, tab_id: &str, selector: &str) -> Result<Vec<String>> {
        let script = format!(
            r#"
            Array.from(document.querySelectorAll('{}'))
                .map(el => el.outerHTML)
            "#,
            selector.replace('\'', "\\'")
        );

        let result = self.evaluate(tab_id, &script)?;

        let elements: Vec<String> =
            serde_json::from_value(result).map_err(|e| anyhow!("Parse elements failed: {}", e))?;

        Ok(elements)
    }

    /// Count elements matching selector
    pub fn count_elements(&self, tab_id: &str, selector: &str) -> Result<usize> {
        let script = format!(
            "document.querySelectorAll('{}').length",
            selector.replace('\'', "\\'")
        );

        let result = self.evaluate(tab_id, &script)?;

        let count: usize =
            serde_json::from_value(result).map_err(|e| anyhow!("Parse count failed: {}", e))?;

        Ok(count)
    }

    /// Get full HTML content of the page
    pub fn get_page_html(&self, tab_id: &str) -> Result<String> {
        let script = "document.documentElement.outerHTML";
        let result = self.evaluate(tab_id, script)?;

        let html: String =
            serde_json::from_value(result).map_err(|e| anyhow!("Failed to parse HTML: {}", e))?;

        Ok(html)
    }

    /// Evaluate selector and return matching elements
    /// 
    /// Navigates to URL if not already there and evaluates the CSS selector
    /// to find all matching elements with their full information.
    pub async fn evaluate_selector(&self, url: &str, selector: &str) -> Result<Vec<ElementInfo>> {
        // First ensure browser is running
        if !self.is_running() {
            self.launch()?;
        }
        
        // Create or reuse a tab
        let tab_id = self.new_tab()?;
        
        // Navigate to the URL
        self.navigate(&tab_id, url)?;
        
        // Wait a bit for dynamic content
        tokio::time::sleep(std::time::Duration::from_millis(500)).await;
        
        // Evaluate selector and get element info
        let script = format!(
            r#"
            (function() {{
                const elements = document.querySelectorAll('{}');
                return Array.from(elements).map(el => {{
                    const rect = el.getBoundingClientRect();
                    const style = window.getComputedStyle(el);
                    return {{
                        tagName: el.tagName.toLowerCase(),
                        text: el.textContent?.trim()?.substring(0, 500) || '',
                        html: el.outerHTML.substring(0, 2000),
                        attributes: Object.fromEntries(
                            Array.from(el.attributes).map(a => [a.name, a.value])
                        ),
                        visible: style.display !== 'none' && 
                                 style.visibility !== 'hidden' && 
                                 rect.width > 0 && rect.height > 0,
                        bounds: {{
                            x: rect.x,
                            y: rect.y,
                            width: rect.width,
                            height: rect.height
                        }}
                    }};
                }});
            }})()
            "#,
            selector.replace('\\', "\\\\").replace('\'', "\\'").replace('"', "\\\"")
        );
        
        let result = self.evaluate(&tab_id, &script)?;
        
        // Parse results
        let elements: Vec<ElementInfo> = serde_json::from_value(result)
            .unwrap_or_default();
        
        // Close the tab when done
        let _ = self.close_tab(&tab_id);
        
        Ok(elements)
    }

    /// Inject selector picker UI into page
    /// 
    /// Creates a new tab, navigates to the URL, and injects an interactive
    /// element picker that allows users to visually select elements.
    /// Returns the tab ID for further interaction.
    pub async fn inject_selector_picker(&self, url: &str) -> Result<String> {
        // Ensure browser is running
        if !self.is_running() {
            self.launch()?;
        }
        
        // Create a new tab for the picker
        let tab_id = self.new_tab()?;
        
        // Navigate to the target URL
        self.navigate(&tab_id, url)?;
        
        // Wait for page to load
        tokio::time::sleep(std::time::Duration::from_millis(1000)).await;
        
        // Inject the selector picker UI JavaScript
        let picker_script = r#"
        (function() {
            // Prevent multiple injections
            if (window.__cubeSelectorPicker) return;
            window.__cubeSelectorPicker = true;
            window.__cubeSelectedElement = null;
            
            // Create overlay highlight element
            const highlight = document.createElement('div');
            highlight.id = '__cube_highlight';
            highlight.style.cssText = `
                position: fixed;
                pointer-events: none;
                background: rgba(59, 130, 246, 0.2);
                border: 2px solid #3b82f6;
                border-radius: 4px;
                z-index: 999999;
                display: none;
                transition: all 0.1s ease;
            `;
            document.body.appendChild(highlight);
            
            // Create info tooltip
            const tooltip = document.createElement('div');
            tooltip.id = '__cube_tooltip';
            tooltip.style.cssText = `
                position: fixed;
                background: #1f2937;
                color: white;
                padding: 6px 10px;
                border-radius: 4px;
                font-size: 12px;
                font-family: monospace;
                z-index: 1000000;
                display: none;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                max-width: 400px;
                word-break: break-all;
            `;
            document.body.appendChild(tooltip);
            
            // Generate optimal CSS selector for element
            function generateSelector(el) {
                if (el.id) return '#' + CSS.escape(el.id);
                
                const path = [];
                while (el && el.nodeType === Node.ELEMENT_NODE) {
                    let selector = el.tagName.toLowerCase();
                    
                    if (el.id) {
                        selector = '#' + CSS.escape(el.id);
                        path.unshift(selector);
                        break;
                    }
                    
                    if (el.className && typeof el.className === 'string') {
                        const classes = el.className.trim().split(/\s+/)
                            .filter(c => c && !c.startsWith('__cube'))
                            .slice(0, 2);
                        if (classes.length > 0) {
                            selector += '.' + classes.map(c => CSS.escape(c)).join('.');
                        }
                    }
                    
                    // Add nth-child if needed for uniqueness
                    const parent = el.parentElement;
                    if (parent) {
                        const siblings = Array.from(parent.children)
                            .filter(c => c.tagName === el.tagName);
                        if (siblings.length > 1) {
                            const index = siblings.indexOf(el) + 1;
                            selector += `:nth-child(${index})`;
                        }
                    }
                    
                    path.unshift(selector);
                    el = el.parentElement;
                    
                    // Stop if we have a good enough selector
                    if (path.length >= 4) break;
                }
                
                return path.join(' > ');
            }
            
            // Handle mouse movement
            document.addEventListener('mousemove', function(e) {
                const el = document.elementFromPoint(e.clientX, e.clientY);
                if (!el || el.id?.startsWith('__cube')) return;
                
                const rect = el.getBoundingClientRect();
                highlight.style.display = 'block';
                highlight.style.left = rect.left + 'px';
                highlight.style.top = rect.top + 'px';
                highlight.style.width = rect.width + 'px';
                highlight.style.height = rect.height + 'px';
                
                const selector = generateSelector(el);
                tooltip.textContent = selector;
                tooltip.style.display = 'block';
                tooltip.style.left = Math.min(e.clientX + 10, window.innerWidth - 420) + 'px';
                tooltip.style.top = (e.clientY + 20) + 'px';
            }, true);
            
            // Handle click to select
            document.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const el = document.elementFromPoint(e.clientX, e.clientY);
                if (!el || el.id?.startsWith('__cube')) return;
                
                const rect = el.getBoundingClientRect();
                const style = window.getComputedStyle(el);
                
                window.__cubeSelectedElement = {
                    tagName: el.tagName.toLowerCase(),
                    text: el.textContent?.trim()?.substring(0, 500) || '',
                    html: el.outerHTML.substring(0, 2000),
                    attributes: Object.fromEntries(
                        Array.from(el.attributes).map(a => [a.name, a.value])
                    ),
                    visible: style.display !== 'none' && 
                             style.visibility !== 'hidden' && 
                             rect.width > 0 && rect.height > 0,
                    bounds: {
                        x: rect.x,
                        y: rect.y,
                        width: rect.width,
                        height: rect.height
                    },
                    selector: generateSelector(el)
                };
                
                // Visual feedback
                highlight.style.background = 'rgba(34, 197, 94, 0.3)';
                highlight.style.borderColor = '#22c55e';
            }, true);
            
            console.log('[CUBE] Selector picker injected successfully');
        })();
        "#;
        
        self.evaluate(&tab_id, picker_script)?;
        
        Ok(tab_id)
    }

    /// Get selected element from picker
    /// 
    /// Returns the element that was selected by the user in the picker UI.
    /// Returns None if no element has been selected yet.
    pub async fn get_selected_element(&self) -> Result<Option<ElementInfo>> {
        // Get all tabs and check each for selected element
        let tabs = self.get_tabs()?;
        
        for tab_info in tabs {
            let result = self.evaluate(&tab_info.id, "window.__cubeSelectedElement")?;
            
            if !result.is_null() {
                // Parse the selected element
                if let Ok(element) = serde_json::from_value::<ElementInfo>(result) {
                    return Ok(Some(element));
                }
            }
        }
        
        Ok(None)
    }
}

#[cfg(test)]
mod tests {
    use super::BrowserService;

    fn create_service() -> BrowserService {
        BrowserService::new_for_tests()
    }

    #[test]
    #[ignore = "Requires local Chromium/Chrome installation"]
    fn headless_browser_smoke() {
        let service = create_service();
        service.launch().expect("Browser should launch");

        let tab_id = service.new_tab().expect("Tab creation should succeed");
        service
            .navigate(&tab_id, "https://example.com")
            .expect("Navigation should succeed");

        let title = service.get_title(&tab_id).expect("Should fetch title");
        assert!(
            title.to_lowercase().contains("example"),
            "Expected title to mention example, got {}",
            title
        );

        let paragraph_count = service
            .count_elements(&tab_id, "p")
            .expect("Should count paragraph elements");
        assert!(paragraph_count > 0, "Expected at least one paragraph");

        service.close().expect("Browser should close cleanly");
    }
}
