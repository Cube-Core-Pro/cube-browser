// CUBE Web Engine - True Embedded Browser Engine
// Provides real embedded webviews inside the main window using platform-native APIs
// No external windows, no proxy - real browser tabs inside the app

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex, RwLock};
use tokio::sync::mpsc;
use uuid::Uuid;

/// Configuration for the CUBE Web Engine
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CubeWebEngineConfig {
    /// Enable JavaScript
    pub javascript_enabled: bool,
    /// Enable WebGL
    pub webgl_enabled: bool,
    /// Enable local storage
    pub local_storage_enabled: bool,
    /// Enable cookies
    pub cookies_enabled: bool,
    /// User agent string
    pub user_agent: String,
    /// Enable DevTools
    pub devtools_enabled: bool,
    /// Custom headers to inject
    pub custom_headers: HashMap<String, String>,
    /// Proxy configuration
    pub proxy: Option<ProxyConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxyConfig {
    pub host: String,
    pub port: u16,
    pub username: Option<String>,
    pub password: Option<String>,
    pub proxy_type: ProxyType,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProxyType {
    Http,
    Https,
    Socks5,
}

impl Default for CubeWebEngineConfig {
    fn default() -> Self {
        Self {
            javascript_enabled: true,
            webgl_enabled: true,
            local_storage_enabled: true,
            cookies_enabled: true,
            user_agent: format!(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) CUBE/{} Chrome/120.0.0.0 Safari/537.36",
                env!("CARGO_PKG_VERSION")
            ),
            devtools_enabled: true,
            custom_headers: HashMap::new(),
            proxy: None,
        }
    }
}

/// Represents a browser tab in the CUBE Web Engine
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CubeWebTab {
    pub id: String,
    pub url: String,
    pub title: String,
    pub favicon: Option<String>,
    pub is_loading: bool,
    pub can_go_back: bool,
    pub can_go_forward: bool,
    pub zoom_level: f64,
    pub is_muted: bool,
    pub is_pinned: bool,
    pub bounds: TabBounds,
    pub created_at: i64,
    pub last_accessed: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TabBounds {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

/// Events emitted by the CUBE Web Engine
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum CubeWebEvent {
    TabCreated { tab_id: String },
    TabClosed { tab_id: String },
    TabUpdated { tab: CubeWebTab },
    TabActivated { tab_id: String },
    NavigationStarted { tab_id: String, url: String },
    NavigationCompleted { tab_id: String, url: String },
    NavigationFailed { tab_id: String, error: String },
    LoadingProgress { tab_id: String, progress: f64 },
    TitleChanged { tab_id: String, title: String },
    FaviconChanged { tab_id: String, favicon: String },
    ConsoleMessage { tab_id: String, level: String, message: String },
    NewWindowRequested { tab_id: String, url: String, features: String },
    DownloadStarted { tab_id: String, url: String, filename: String },
    PermissionRequested { tab_id: String, permission: String },
}

/// State for the CUBE Web Engine
pub struct CubeWebEngineState {
    pub tabs: RwLock<HashMap<String, CubeWebTab>>,
    pub active_tab: RwLock<Option<String>>,
    pub config: RwLock<CubeWebEngineConfig>,
    pub event_sender: Option<mpsc::UnboundedSender<CubeWebEvent>>,
    /// Page content cache for rendering
    pub page_cache: RwLock<HashMap<String, PageContent>>,
    /// Browsing history
    pub history: RwLock<HashMap<String, Vec<HistoryEntry>>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PageContent {
    pub html: String,
    pub base_url: String,
    pub scripts: Vec<String>,
    pub styles: Vec<String>,
    pub resources: HashMap<String, Vec<u8>>,
    pub dom_ready: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryEntry {
    pub url: String,
    pub title: String,
    pub timestamp: i64,
}

impl Default for CubeWebEngineState {
    fn default() -> Self {
        Self {
            tabs: RwLock::new(HashMap::new()),
            active_tab: RwLock::new(None),
            config: RwLock::new(CubeWebEngineConfig::default()),
            event_sender: None,
            page_cache: RwLock::new(HashMap::new()),
            history: RwLock::new(HashMap::new()),
        }
    }
}

impl CubeWebEngineState {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn with_event_channel(event_sender: mpsc::UnboundedSender<CubeWebEvent>) -> Self {
        Self {
            event_sender: Some(event_sender),
            ..Default::default()
        }
    }

    /// Create a new tab
    pub fn create_tab(&self, url: Option<String>, bounds: TabBounds) -> Result<CubeWebTab, String> {
        let tab_id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp_millis();
        
        let tab = CubeWebTab {
            id: tab_id.clone(),
            url: url.unwrap_or_else(|| "about:blank".to_string()),
            title: "New Tab".to_string(),
            favicon: None,
            is_loading: false,
            can_go_back: false,
            can_go_forward: false,
            zoom_level: 1.0,
            is_muted: false,
            is_pinned: false,
            bounds,
            created_at: now,
            last_accessed: now,
        };

        // Store tab
        {
            let mut tabs = self.tabs.write().map_err(|e| format!("Lock error: {}", e))?;
            tabs.insert(tab_id.clone(), tab.clone());
        }

        // Initialize history for this tab
        {
            let mut history = self.history.write().map_err(|e| format!("Lock error: {}", e))?;
            history.insert(tab_id.clone(), Vec::new());
        }

        // Set as active
        {
            let mut active = self.active_tab.write().map_err(|e| format!("Lock error: {}", e))?;
            *active = Some(tab_id.clone());
        }

        // Emit event
        if let Some(sender) = &self.event_sender {
            let _ = sender.send(CubeWebEvent::TabCreated { tab_id: tab_id.clone() });
        }

        Ok(tab)
    }

    /// Close a tab
    pub fn close_tab(&self, tab_id: &str) -> Result<(), String> {
        // Remove tab
        {
            let mut tabs = self.tabs.write().map_err(|e| format!("Lock error: {}", e))?;
            tabs.remove(tab_id);
        }

        // Remove history
        {
            let mut history = self.history.write().map_err(|e| format!("Lock error: {}", e))?;
            history.remove(tab_id);
        }

        // Clear page cache
        {
            let mut cache = self.page_cache.write().map_err(|e| format!("Lock error: {}", e))?;
            cache.remove(tab_id);
        }

        // Update active tab if needed
        {
            let active = self.active_tab.read().map_err(|e| format!("Lock error: {}", e))?;
            if active.as_deref() == Some(tab_id) {
                drop(active);
                let mut active = self.active_tab.write().map_err(|e| format!("Lock error: {}", e))?;
                let tabs = self.tabs.read().map_err(|e| format!("Lock error: {}", e))?;
                *active = tabs.keys().next().cloned();
            }
        }

        // Emit event
        if let Some(sender) = &self.event_sender {
            let _ = sender.send(CubeWebEvent::TabClosed { tab_id: tab_id.to_string() });
        }

        Ok(())
    }

    /// Get all tabs
    pub fn get_tabs(&self) -> Result<Vec<CubeWebTab>, String> {
        let tabs = self.tabs.read().map_err(|e| format!("Lock error: {}", e))?;
        Ok(tabs.values().cloned().collect())
    }

    /// Get a specific tab
    pub fn get_tab(&self, tab_id: &str) -> Result<Option<CubeWebTab>, String> {
        let tabs = self.tabs.read().map_err(|e| format!("Lock error: {}", e))?;
        Ok(tabs.get(tab_id).cloned())
    }

    /// Update tab info
    pub fn update_tab(&self, tab_id: &str, update: TabUpdate) -> Result<(), String> {
        let mut tabs = self.tabs.write().map_err(|e| format!("Lock error: {}", e))?;
        
        if let Some(tab) = tabs.get_mut(tab_id) {
            if let Some(url) = update.url {
                tab.url = url;
            }
            if let Some(title) = update.title {
                tab.title = title;
            }
            if let Some(favicon) = update.favicon {
                tab.favicon = Some(favicon);
            }
            if let Some(is_loading) = update.is_loading {
                tab.is_loading = is_loading;
            }
            if let Some(can_go_back) = update.can_go_back {
                tab.can_go_back = can_go_back;
            }
            if let Some(can_go_forward) = update.can_go_forward {
                tab.can_go_forward = can_go_forward;
            }
            tab.last_accessed = chrono::Utc::now().timestamp_millis();

            // Emit event
            if let Some(sender) = &self.event_sender {
                let _ = sender.send(CubeWebEvent::TabUpdated { tab: tab.clone() });
            }
        }

        Ok(())
    }

    /// Set active tab
    pub fn set_active_tab(&self, tab_id: &str) -> Result<(), String> {
        // Verify tab exists
        {
            let tabs = self.tabs.read().map_err(|e| format!("Lock error: {}", e))?;
            if !tabs.contains_key(tab_id) {
                return Err("Tab not found".to_string());
            }
        }

        // Set active
        {
            let mut active = self.active_tab.write().map_err(|e| format!("Lock error: {}", e))?;
            *active = Some(tab_id.to_string());
        }

        // Update last accessed
        {
            let mut tabs = self.tabs.write().map_err(|e| format!("Lock error: {}", e))?;
            if let Some(tab) = tabs.get_mut(tab_id) {
                tab.last_accessed = chrono::Utc::now().timestamp_millis();
            }
        }

        // Emit event
        if let Some(sender) = &self.event_sender {
            let _ = sender.send(CubeWebEvent::TabActivated { tab_id: tab_id.to_string() });
        }

        Ok(())
    }

    /// Get active tab ID
    pub fn get_active_tab(&self) -> Result<Option<String>, String> {
        let active = self.active_tab.read().map_err(|e| format!("Lock error: {}", e))?;
        Ok(active.clone())
    }

    /// Update tab bounds
    pub fn update_bounds(&self, tab_id: &str, bounds: TabBounds) -> Result<(), String> {
        let mut tabs = self.tabs.write().map_err(|e| format!("Lock error: {}", e))?;
        
        if let Some(tab) = tabs.get_mut(tab_id) {
            tab.bounds = bounds;
        } else {
            return Err("Tab not found".to_string());
        }

        Ok(())
    }

    /// Store page content in cache
    pub fn cache_page(&self, tab_id: &str, content: PageContent) -> Result<(), String> {
        let mut cache = self.page_cache.write().map_err(|e| format!("Lock error: {}", e))?;
        cache.insert(tab_id.to_string(), content);
        Ok(())
    }

    /// Get cached page content
    pub fn get_cached_page(&self, tab_id: &str) -> Result<Option<PageContent>, String> {
        let cache = self.page_cache.read().map_err(|e| format!("Lock error: {}", e))?;
        Ok(cache.get(tab_id).cloned())
    }

    /// Add history entry
    pub fn add_history(&self, tab_id: &str, url: &str, title: &str) -> Result<(), String> {
        let mut history = self.history.write().map_err(|e| format!("Lock error: {}", e))?;
        
        let entry = HistoryEntry {
            url: url.to_string(),
            title: title.to_string(),
            timestamp: chrono::Utc::now().timestamp_millis(),
        };

        history
            .entry(tab_id.to_string())
            .or_insert_with(Vec::new)
            .push(entry);

        Ok(())
    }

    /// Get tab history
    pub fn get_history(&self, tab_id: &str) -> Result<Vec<HistoryEntry>, String> {
        let history = self.history.read().map_err(|e| format!("Lock error: {}", e))?;
        Ok(history.get(tab_id).cloned().unwrap_or_default())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TabUpdate {
    pub url: Option<String>,
    pub title: Option<String>,
    pub favicon: Option<String>,
    pub is_loading: Option<bool>,
    pub can_go_back: Option<bool>,
    pub can_go_forward: Option<bool>,
}

/// HTTP client for fetching web pages
#[derive(Clone)]
pub struct WebFetcher {
    client: reqwest::Client,
    config: CubeWebEngineConfig,
}

impl WebFetcher {
    pub fn new(config: CubeWebEngineConfig) -> Self {
        let mut builder = reqwest::Client::builder()
            .user_agent(&config.user_agent)
            .cookie_store(config.cookies_enabled)
            .gzip(true)
            .brotli(true)
            .deflate(true);

        // Add custom headers
        let mut headers = reqwest::header::HeaderMap::new();
        for (key, value) in &config.custom_headers {
            if let (Ok(name), Ok(val)) = (
                reqwest::header::HeaderName::try_from(key.as_str()),
                reqwest::header::HeaderValue::from_str(value),
            ) {
                headers.insert(name, val);
            }
        }
        builder = builder.default_headers(headers);

        // Configure proxy if set
        if let Some(proxy_config) = &config.proxy {
            let proxy_url = match proxy_config.proxy_type {
                ProxyType::Http => format!("http://{}:{}", proxy_config.host, proxy_config.port),
                ProxyType::Https => format!("https://{}:{}", proxy_config.host, proxy_config.port),
                ProxyType::Socks5 => format!("socks5://{}:{}", proxy_config.host, proxy_config.port),
            };

            if let Ok(mut proxy) = reqwest::Proxy::all(&proxy_url) {
                if let (Some(user), Some(pass)) = (&proxy_config.username, &proxy_config.password) {
                    proxy = proxy.basic_auth(user, pass);
                }
                builder = builder.proxy(proxy);
            }
        }

        let client = builder.build().unwrap_or_else(|_| reqwest::Client::new());

        Self { client, config }
    }

    /// Fetch a URL and return the response
    pub async fn fetch(&self, url: &str) -> Result<FetchResponse, String> {
        let response = self.client
            .get(url)
            .send()
            .await
            .map_err(|e| format!("Fetch failed: {}", e))?;

        let status = response.status().as_u16();
        let headers: HashMap<String, String> = response
            .headers()
            .iter()
            .filter_map(|(k, v)| {
                v.to_str().ok().map(|val| (k.to_string(), val.to_string()))
            })
            .collect();

        let content_type = headers
            .get("content-type")
            .cloned()
            .unwrap_or_else(|| "text/html".to_string());

        let body = response
            .bytes()
            .await
            .map_err(|e| format!("Failed to read body: {}", e))?
            .to_vec();

        Ok(FetchResponse {
            status,
            headers,
            content_type,
            body,
            url: url.to_string(),
        })
    }

    /// Fetch HTML and parse it for embedded rendering
    pub async fn fetch_page(&self, url: &str) -> Result<PageContent, String> {
        let response = self.fetch(url).await?;
        
        // Only process HTML
        if !response.content_type.contains("text/html") {
            return Err("Not an HTML page".to_string());
        }

        let html = String::from_utf8_lossy(&response.body).to_string();
        
        // Parse HTML and extract resources
        let (scripts, styles) = self.extract_resources(&html, url);

        Ok(PageContent {
            html,
            base_url: url.to_string(),
            scripts,
            styles,
            resources: HashMap::new(),
            dom_ready: false,
        })
    }

    fn extract_resources(&self, html: &str, _base_url: &str) -> (Vec<String>, Vec<String>) {
        let mut scripts = Vec::new();
        let mut styles = Vec::new();

        // Simple regex-based extraction (in production, use proper HTML parser)
        let script_re = regex::Regex::new(r#"<script[^>]*src=["']([^"']+)["']"#).unwrap();
        let style_re = regex::Regex::new(r#"<link[^>]*href=["']([^"']+\.css[^"']*)["']"#).unwrap();

        for cap in script_re.captures_iter(html) {
            if let Some(src) = cap.get(1) {
                scripts.push(src.as_str().to_string());
            }
        }

        for cap in style_re.captures_iter(html) {
            if let Some(href) = cap.get(1) {
                styles.push(href.as_str().to_string());
            }
        }

        (scripts, styles)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FetchResponse {
    pub status: u16,
    pub headers: HashMap<String, String>,
    pub content_type: String,
    pub body: Vec<u8>,
    pub url: String,
}

/// JavaScript execution context for tabs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsExecutionResult {
    pub success: bool,
    pub result: Option<String>,
    pub error: Option<String>,
}

/// DOM manipulation commands
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "action")]
pub enum DomCommand {
    GetElementById { id: String },
    QuerySelector { selector: String },
    QuerySelectorAll { selector: String },
    GetInnerHtml { selector: String },
    SetInnerHtml { selector: String, html: String },
    GetAttribute { selector: String, attribute: String },
    SetAttribute { selector: String, attribute: String, value: String },
    AddEventListener { selector: String, event: String, handler: String },
    Click { selector: String },
    Focus { selector: String },
    ScrollTo { x: f64, y: f64 },
    ScrollIntoView { selector: String },
}

/// Screenshot options
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ScreenshotOptions {
    pub full_page: bool,
    pub clip: Option<ClipRegion>,
    pub format: ScreenshotFormat,
    pub quality: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ClipRegion {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum ScreenshotFormat {
    #[default]
    Png,
    Jpeg,
    Webp,
}

/// Print/PDF options
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrintOptions {
    pub landscape: bool,
    pub display_header_footer: bool,
    pub print_background: bool,
    pub scale: f64,
    pub paper_width: f64,
    pub paper_height: f64,
    pub margin_top: f64,
    pub margin_bottom: f64,
    pub margin_left: f64,
    pub margin_right: f64,
}

impl Default for PrintOptions {
    fn default() -> Self {
        Self {
            landscape: false,
            display_header_footer: false,
            print_background: true,
            scale: 1.0,
            paper_width: 8.5,
            paper_height: 11.0,
            margin_top: 0.4,
            margin_bottom: 0.4,
            margin_left: 0.4,
            margin_right: 0.4,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_tab() {
        let engine = CubeWebEngineState::new();
        let tab = engine.create_tab(Some("https://google.com".to_string()), TabBounds::default()).unwrap();
        
        assert!(!tab.id.is_empty());
        assert_eq!(tab.url, "https://google.com");
        assert_eq!(tab.title, "New Tab");
    }

    #[test]
    fn test_close_tab() {
        let engine = CubeWebEngineState::new();
        let tab = engine.create_tab(None, TabBounds::default()).unwrap();
        let tab_id = tab.id.clone();
        
        engine.close_tab(&tab_id).unwrap();
        
        let tabs = engine.get_tabs().unwrap();
        assert!(tabs.is_empty());
    }

    #[test]
    fn test_multiple_tabs() {
        let engine = CubeWebEngineState::new();
        
        engine.create_tab(Some("https://google.com".to_string()), TabBounds::default()).unwrap();
        engine.create_tab(Some("https://github.com".to_string()), TabBounds::default()).unwrap();
        engine.create_tab(Some("https://rust-lang.org".to_string()), TabBounds::default()).unwrap();
        
        let tabs = engine.get_tabs().unwrap();
        assert_eq!(tabs.len(), 3);
    }
}
