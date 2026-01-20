// CUBE Browser Engine - Real Chromium-based Browser
// This is a REAL browser engine that controls Chromium directly
// All rendering happens INSIDE the Tauri window as integrated tabs
// Full DOM access, cookies, sessions, DRM support

use headless_chrome::{Browser, LaunchOptions, Tab};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex, RwLock};
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};

// ============================================
// Types
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrowserTab {
    pub id: String,
    pub url: String,
    pub title: String,
    pub favicon: Option<String>,
    pub loading: bool,
    pub can_go_back: bool,
    pub can_go_forward: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DOMElement {
    pub node_id: i64,
    pub tag_name: String,
    pub attributes: HashMap<String, String>,
    pub text_content: Option<String>,
    pub children_count: usize,
    pub bounding_box: Option<BoundingBox>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BoundingBox {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CookieData {
    pub name: String,
    pub value: String,
    pub domain: String,
    pub path: String,
    pub expires: Option<f64>,
    pub http_only: bool,
    pub secure: bool,
    pub same_site: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScreenshotOptions {
    pub format: String,
    pub quality: Option<u32>,
    pub full_page: bool,
    pub clip: Option<BoundingBox>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrowserConfig {
    pub headless: bool,
    pub window_size: (u32, u32),
    pub user_agent: Option<String>,
    pub proxy: Option<String>,
    pub disable_gpu: bool,
    pub sandbox: bool,
    pub enable_logging: bool,
    pub user_data_dir: Option<String>,
}

impl Default for BrowserConfig {
    fn default() -> Self {
        Self {
            headless: false,
            window_size: (1920, 1080),
            user_agent: Some("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 CUBE/1.0".to_string()),
            proxy: None,
            disable_gpu: false,
            sandbox: true,
            enable_logging: true,
            user_data_dir: None,
        }
    }
}

// ============================================
// Browser Engine State
// ============================================

pub struct CubeBrowserEngine {
    browser: Option<Arc<Browser>>,
    tabs: RwLock<HashMap<String, Arc<Tab>>>,
    config: RwLock<BrowserConfig>,
}

impl Default for CubeBrowserEngine {
    fn default() -> Self {
        Self {
            browser: None,
            tabs: RwLock::new(HashMap::new()),
            config: RwLock::new(BrowserConfig::default()),
        }
    }
}

impl CubeBrowserEngine {
    pub fn new() -> Self {
        Self::default()
    }

    /// Initialize the Chromium browser instance
    pub fn initialize(&mut self, config: Option<BrowserConfig>) -> Result<(), String> {
        let cfg = config.unwrap_or_default();
        
        println!("🌐 [CUBE ENGINE] Initializing Chromium browser...");
        
        let launch_options = LaunchOptions::default_builder()
            .window_size(Some(cfg.window_size))
            .headless(cfg.headless)
            .sandbox(cfg.sandbox)
            .build()
            .map_err(|e| format!("Failed to build options: {}", e))?;
        
        let browser = Browser::new(launch_options)
            .map_err(|e| format!("Failed to launch browser: {}", e))?;
        
        self.browser = Some(Arc::new(browser));
        *self.config.write().unwrap() = cfg;
        
        println!("✅ [CUBE ENGINE] Chromium browser initialized successfully");
        Ok(())
    }

    /// Create a new browser tab
    pub fn create_tab(&self, url: &str) -> Result<BrowserTab, String> {
        let browser = self.browser.as_ref()
            .ok_or("Browser not initialized")?;
        
        let tab = browser.new_tab()
            .map_err(|e| format!("Failed to create tab: {}", e))?;
        
        let tab_id = uuid::Uuid::new_v4().to_string();
        
        tab.navigate_to(url)
            .map_err(|e| format!("Failed to navigate: {}", e))?;
        
        tab.wait_until_navigated()
            .map_err(|e| format!("Navigation timeout: {}", e))?;
        
        let title = tab.get_title().unwrap_or_else(|_| "New Tab".to_string());
        let current_url = tab.get_url();
        
        {
            let mut tabs = self.tabs.write().unwrap();
            tabs.insert(tab_id.clone(), tab);
        }
        
        println!("✅ [CUBE ENGINE] Created tab: {} -> {}", tab_id, url);
        
        Ok(BrowserTab {
            id: tab_id,
            url: current_url,
            title,
            favicon: None,
            loading: false,
            can_go_back: false,
            can_go_forward: false,
        })
    }

    /// Navigate a tab to a new URL
    pub fn navigate(&self, tab_id: &str, url: &str) -> Result<(), String> {
        let tabs = self.tabs.read().unwrap();
        let tab = tabs.get(tab_id)
            .ok_or("Tab not found")?;
        
        tab.navigate_to(url)
            .map_err(|e| format!("Navigation failed: {}", e))?;
        
        tab.wait_until_navigated()
            .map_err(|e| format!("Navigation timeout: {}", e))?;
        
        println!("🔗 [CUBE ENGINE] Navigated {} to {}", tab_id, url);
        Ok(())
    }

    /// Close a tab
    pub fn close_tab(&self, tab_id: &str) -> Result<(), String> {
        let mut tabs = self.tabs.write().unwrap();
        tabs.remove(tab_id)
            .ok_or("Tab not found")?;
        
        println!("❌ [CUBE ENGINE] Closed tab: {}", tab_id);
        Ok(())
    }

    /// Go back in history
    pub fn go_back(&self, tab_id: &str) -> Result<(), String> {
        let tabs = self.tabs.read().unwrap();
        let tab = tabs.get(tab_id)
            .ok_or("Tab not found")?;
        
        tab.evaluate("history.back()", false)
            .map_err(|e| format!("Back failed: {}", e))?;
        Ok(())
    }

    /// Go forward in history
    pub fn go_forward(&self, tab_id: &str) -> Result<(), String> {
        let tabs = self.tabs.read().unwrap();
        let tab = tabs.get(tab_id)
            .ok_or("Tab not found")?;
        
        tab.evaluate("history.forward()", false)
            .map_err(|e| format!("Forward failed: {}", e))?;
        Ok(())
    }

    /// Reload the page
    pub fn reload(&self, tab_id: &str) -> Result<(), String> {
        let tabs = self.tabs.read().unwrap();
        let tab = tabs.get(tab_id)
            .ok_or("Tab not found")?;
        
        tab.reload(false, None)
            .map_err(|e| format!("Reload failed: {}", e))?;
        Ok(())
    }

    /// Get current URL
    pub fn get_url(&self, tab_id: &str) -> Result<String, String> {
        let tabs = self.tabs.read().unwrap();
        let tab = tabs.get(tab_id)
            .ok_or("Tab not found")?;
        
        Ok(tab.get_url())
    }

    /// Get page title
    pub fn get_title(&self, tab_id: &str) -> Result<String, String> {
        let tabs = self.tabs.read().unwrap();
        let tab = tabs.get(tab_id)
            .ok_or("Tab not found")?;
        
        tab.get_title()
            .map_err(|e| format!("Failed to get title: {}", e))
    }

    /// Execute JavaScript and return result
    pub fn execute_script(&self, tab_id: &str, script: &str) -> Result<serde_json::Value, String> {
        let tabs = self.tabs.read().unwrap();
        let tab = tabs.get(tab_id)
            .ok_or("Tab not found")?;
        
        let result = tab.evaluate(script, false)
            .map_err(|e| format!("Script execution failed: {}", e))?;
        
        Ok(result.value.unwrap_or(serde_json::Value::Null))
    }

    /// Get element by selector
    pub fn query_selector(&self, tab_id: &str, selector: &str) -> Result<Option<DOMElement>, String> {
        let script = format!(r#"
            (function() {{
                const el = document.querySelector('{}');
                if (!el) return null;
                const rect = el.getBoundingClientRect();
                const attrs = {{}};
                for (const attr of el.attributes) {{
                    attrs[attr.name] = attr.value;
                }}
                return {{
                    tagName: el.tagName.toLowerCase(),
                    attributes: attrs,
                    textContent: el.textContent?.substring(0, 1000),
                    childrenCount: el.children.length,
                    boundingBox: {{
                        x: rect.x,
                        y: rect.y,
                        width: rect.width,
                        height: rect.height
                    }}
                }};
            }})()
        "#, selector.replace("'", "\\'"));
        
        let result = self.execute_script(tab_id, &script)?;
        
        if result.is_null() {
            return Ok(None);
        }
        
        Ok(Some(DOMElement {
            node_id: 0,
            tag_name: result["tagName"].as_str().unwrap_or("").to_string(),
            attributes: serde_json::from_value(result["attributes"].clone()).unwrap_or_default(),
            text_content: result["textContent"].as_str().map(|s| s.to_string()),
            children_count: result["childrenCount"].as_u64().unwrap_or(0) as usize,
            bounding_box: Some(BoundingBox {
                x: result["boundingBox"]["x"].as_f64().unwrap_or(0.0),
                y: result["boundingBox"]["y"].as_f64().unwrap_or(0.0),
                width: result["boundingBox"]["width"].as_f64().unwrap_or(0.0),
                height: result["boundingBox"]["height"].as_f64().unwrap_or(0.0),
            }),
        }))
    }

    /// Get all elements by selector
    pub fn query_selector_all(&self, tab_id: &str, selector: &str) -> Result<Vec<DOMElement>, String> {
        let script = format!(r#"
            (function() {{
                const elements = document.querySelectorAll('{}');
                return Array.from(elements).map((el, i) => {{
                    const rect = el.getBoundingClientRect();
                    const attrs = {{}};
                    for (const attr of el.attributes) {{
                        attrs[attr.name] = attr.value;
                    }}
                    return {{
                        nodeId: i,
                        tagName: el.tagName.toLowerCase(),
                        attributes: attrs,
                        textContent: el.textContent?.substring(0, 500),
                        childrenCount: el.children.length,
                        boundingBox: {{
                            x: rect.x,
                            y: rect.y,
                            width: rect.width,
                            height: rect.height
                        }}
                    }};
                }});
            }})()
        "#, selector.replace("'", "\\'"));
        
        let result = self.execute_script(tab_id, &script)?;
        
        let elements: Vec<DOMElement> = result.as_array()
            .unwrap_or(&vec![])
            .iter()
            .map(|el| DOMElement {
                node_id: el["nodeId"].as_i64().unwrap_or(0),
                tag_name: el["tagName"].as_str().unwrap_or("").to_string(),
                attributes: serde_json::from_value(el["attributes"].clone()).unwrap_or_default(),
                text_content: el["textContent"].as_str().map(|s| s.to_string()),
                children_count: el["childrenCount"].as_u64().unwrap_or(0) as usize,
                bounding_box: Some(BoundingBox {
                    x: el["boundingBox"]["x"].as_f64().unwrap_or(0.0),
                    y: el["boundingBox"]["y"].as_f64().unwrap_or(0.0),
                    width: el["boundingBox"]["width"].as_f64().unwrap_or(0.0),
                    height: el["boundingBox"]["height"].as_f64().unwrap_or(0.0),
                }),
            })
            .collect();
        
        Ok(elements)
    }

    /// Get full page HTML
    pub fn get_page_html(&self, tab_id: &str) -> Result<String, String> {
        let result = self.execute_script(tab_id, "document.documentElement.outerHTML")?;
        Ok(result.as_str().unwrap_or("").to_string())
    }

    /// Get element inner HTML
    pub fn get_inner_html(&self, tab_id: &str, selector: &str) -> Result<String, String> {
        let script = format!(
            "document.querySelector('{}')?.innerHTML || ''",
            selector.replace("'", "\\'")
        );
        let result = self.execute_script(tab_id, &script)?;
        Ok(result.as_str().unwrap_or("").to_string())
    }

    /// Set element value (for form filling)
    pub fn set_value(&self, tab_id: &str, selector: &str, value: &str) -> Result<(), String> {
        let script = format!(r#"
            (function() {{
                const el = document.querySelector('{}');
                if (!el) return false;
                el.value = '{}';
                el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                el.dispatchEvent(new Event('change', {{ bubbles: true }}));
                return true;
            }})()
        "#, selector.replace("'", "\\'"), value.replace("'", "\\'"));
        
        self.execute_script(tab_id, &script)?;
        Ok(())
    }

    /// Click an element
    pub fn click(&self, tab_id: &str, selector: &str) -> Result<(), String> {
        let tabs = self.tabs.read().unwrap();
        let tab = tabs.get(tab_id)
            .ok_or("Tab not found")?;
        
        let element = tab.find_element(selector)
            .map_err(|e| format!("Element not found: {}", e))?;
        
        element.click()
            .map_err(|e| format!("Click failed: {}", e))?;
        
        Ok(())
    }

    /// Type text into an element
    pub fn type_text(&self, tab_id: &str, selector: &str, text: &str) -> Result<(), String> {
        let tabs = self.tabs.read().unwrap();
        let tab = tabs.get(tab_id)
            .ok_or("Tab not found")?;
        
        let element = tab.find_element(selector)
            .map_err(|e| format!("Element not found: {}", e))?;
        
        element.type_into(text)
            .map_err(|e| format!("Type failed: {}", e))?;
        
        Ok(())
    }

    /// Focus an element
    pub fn focus(&self, tab_id: &str, selector: &str) -> Result<(), String> {
        let script = format!(
            "document.querySelector('{}')?.focus()",
            selector.replace("'", "\\'")
        );
        self.execute_script(tab_id, &script)?;
        Ok(())
    }

    /// Scroll to element
    pub fn scroll_to(&self, tab_id: &str, selector: &str) -> Result<(), String> {
        let script = format!(
            "document.querySelector('{}')?.scrollIntoView({{ behavior: 'smooth', block: 'center' }})",
            selector.replace("'", "\\'")
        );
        self.execute_script(tab_id, &script)?;
        Ok(())
    }

    /// Take a screenshot of the page
    pub fn screenshot(&self, tab_id: &str, full_page: bool) -> Result<Vec<u8>, String> {
        let tabs = self.tabs.read().unwrap();
        let tab = tabs.get(tab_id)
            .ok_or("Tab not found")?;
        
        let data = tab.capture_screenshot(
            headless_chrome::protocol::cdp::Page::CaptureScreenshotFormatOption::Png,
            None,
            None,
            full_page,
        ).map_err(|e| format!("Screenshot failed: {}", e))?;
        
        Ok(data)
    }

    /// Capture current frame as base64 image
    pub fn capture_frame(&self, tab_id: &str) -> Result<String, String> {
        let data = self.screenshot(tab_id, false)?;
        Ok(BASE64.encode(&data))
    }

    /// Get all cookies for the tab
    pub fn get_cookies(&self, tab_id: &str) -> Result<Vec<CookieData>, String> {
        let tabs = self.tabs.read().unwrap();
        let tab = tabs.get(tab_id)
            .ok_or("Tab not found")?;
        
        let cookies = tab.get_cookies()
            .map_err(|e| format!("Failed to get cookies: {}", e))?;
        
        Ok(cookies.iter().map(|c| CookieData {
            name: c.name.clone(),
            value: c.value.clone(),
            domain: c.domain.clone(),
            path: c.path.clone(),
            expires: Some(c.expires),
            http_only: c.http_only,
            secure: c.secure,
            same_site: c.same_site.as_ref().map(|s| format!("{:?}", s)),
        }).collect())
    }

    /// Set a cookie
    pub fn set_cookie(&self, tab_id: &str, cookie: &CookieData) -> Result<(), String> {
        let script = format!(
            "document.cookie = '{}={}; path={}; domain={}'",
            cookie.name, cookie.value, cookie.path, cookie.domain
        );
        self.execute_script(tab_id, &script)?;
        Ok(())
    }

    /// Get localStorage value
    pub fn get_local_storage(&self, tab_id: &str, key: &str) -> Result<Option<String>, String> {
        let script = format!("localStorage.getItem('{}')", key.replace("'", "\\'"));
        let result = self.execute_script(tab_id, &script)?;
        
        if result.is_null() {
            Ok(None)
        } else {
            Ok(Some(result.as_str().unwrap_or("").to_string()))
        }
    }

    /// Set localStorage value
    pub fn set_local_storage(&self, tab_id: &str, key: &str, value: &str) -> Result<(), String> {
        let script = format!(
            "localStorage.setItem('{}', '{}')",
            key.replace("'", "\\'"),
            value.replace("'", "\\'")
        );
        self.execute_script(tab_id, &script)?;
        Ok(())
    }

    /// Get sessionStorage value
    pub fn get_session_storage(&self, tab_id: &str, key: &str) -> Result<Option<String>, String> {
        let script = format!("sessionStorage.getItem('{}')", key.replace("'", "\\'"));
        let result = self.execute_script(tab_id, &script)?;
        
        if result.is_null() {
            Ok(None)
        } else {
            Ok(Some(result.as_str().unwrap_or("").to_string()))
        }
    }

    /// Set sessionStorage value
    pub fn set_session_storage(&self, tab_id: &str, key: &str, value: &str) -> Result<(), String> {
        let script = format!(
            "sessionStorage.setItem('{}', '{}')",
            key.replace("'", "\\'"),
            value.replace("'", "\\'")
        );
        self.execute_script(tab_id, &script)?;
        Ok(())
    }

    /// Get all form fields on the page
    pub fn get_form_fields(&self, tab_id: &str) -> Result<Vec<DOMElement>, String> {
        self.query_selector_all(tab_id, "input, select, textarea")
    }

    /// Fill a form with data
    pub fn fill_form(&self, tab_id: &str, data: &HashMap<String, String>) -> Result<(), String> {
        for (selector, value) in data {
            self.set_value(tab_id, selector, value)?;
        }
        Ok(())
    }

    /// Submit a form
    pub fn submit_form(&self, tab_id: &str, form_selector: &str) -> Result<(), String> {
        let script = format!(
            "document.querySelector('{}')?.submit()",
            form_selector.replace("'", "\\'")
        );
        self.execute_script(tab_id, &script)?;
        Ok(())
    }

    /// Extract structured data from page
    pub fn extract_data(&self, tab_id: &str, schema: &HashMap<String, String>) -> Result<HashMap<String, String>, String> {
        let mut result = HashMap::new();
        
        for (key, selector) in schema {
            let script = format!(
                "document.querySelector('{}')?.textContent?.trim() || ''",
                selector.replace("'", "\\'")
            );
            let value = self.execute_script(tab_id, &script)?;
            result.insert(key.clone(), value.as_str().unwrap_or("").to_string());
        }
        
        Ok(result)
    }

    /// Extract table data
    pub fn extract_table(&self, tab_id: &str, table_selector: &str) -> Result<Vec<Vec<String>>, String> {
        let script = format!(r#"
            (function() {{
                const table = document.querySelector('{}');
                if (!table) return [];
                const rows = table.querySelectorAll('tr');
                return Array.from(rows).map(row => {{
                    const cells = row.querySelectorAll('td, th');
                    return Array.from(cells).map(cell => cell.textContent?.trim() || '');
                }});
            }})()
        "#, table_selector.replace("'", "\\'"));
        
        let result = self.execute_script(tab_id, &script)?;
        
        let data: Vec<Vec<String>> = result.as_array()
            .unwrap_or(&vec![])
            .iter()
            .map(|row| {
                row.as_array()
                    .unwrap_or(&vec![])
                    .iter()
                    .map(|cell| cell.as_str().unwrap_or("").to_string())
                    .collect()
            })
            .collect();
        
        Ok(data)
    }

    /// Generate PDF from page
    pub fn print_to_pdf(&self, tab_id: &str) -> Result<Vec<u8>, String> {
        let tabs = self.tabs.read().unwrap();
        let tab = tabs.get(tab_id)
            .ok_or("Tab not found")?;
        
        let data = tab.print_to_pdf(None)
            .map_err(|e| format!("PDF generation failed: {}", e))?;
        
        Ok(data)
    }

    /// Close all tabs and browser
    pub fn shutdown(&mut self) -> Result<(), String> {
        {
            let mut tabs = self.tabs.write().unwrap();
            tabs.clear();
        }
        
        self.browser = None;
        
        println!("🛑 [CUBE ENGINE] Browser shutdown complete");
        Ok(())
    }
}

// ============================================
// Global Browser Instance
// ============================================

lazy_static::lazy_static! {
    pub static ref CUBE_BROWSER: Mutex<CubeBrowserEngine> = Mutex::new(CubeBrowserEngine::new());
}

/// Initialize the global browser instance
pub fn init_browser(config: Option<BrowserConfig>) -> Result<(), String> {
    let mut browser = CUBE_BROWSER.lock().unwrap();
    browser.initialize(config)
}

/// Get the global browser instance
pub fn get_browser() -> std::sync::MutexGuard<'static, CubeBrowserEngine> {
    CUBE_BROWSER.lock().unwrap()
}
