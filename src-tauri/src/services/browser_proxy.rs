// Browser Proxy Service - Bypasses X-Frame-Options and CSP restrictions
// This creates a local proxy server that fetches pages and removes restrictive headers
// INTEGRATED WITH: Autofill, Data Extraction, Document Detection, Automation
// V2.1: Full CORS bypass, URL rewriting, preflight handling

use actix_web::{web, App, HttpRequest, HttpResponse, HttpServer, http::Method};
use actix_cors::Cors;
use reqwest::Client;
use std::sync::Mutex;
use std::collections::HashMap;
use tokio::sync::oneshot;
use regex::Regex;
use lazy_static::lazy_static;

lazy_static! {
    // Regex for URL rewriting in HTML
    static ref HTML_URL_PATTERN: Regex = Regex::new(
        r#"(href|src|action|data-src|poster)=["'](https?://[^"']+)["']"#
    ).unwrap();
    
    static ref HTML_PROTOCOL_RELATIVE: Regex = Regex::new(
        r#"(href|src|action|data-src|poster)=["'](//[^"']+)["']"#
    ).unwrap();
    
    static ref CSS_URL_PATTERN: Regex = Regex::new(
        r#"url\(["']?(https?://[^"')]+)["']?\)"#
    ).unwrap();
}

/// State for the proxy server
pub struct BrowserProxyState {
    pub running: Mutex<bool>,
    pub port: Mutex<u16>,
    pub shutdown_tx: Mutex<Option<oneshot::Sender<()>>>,
    pub cache: Mutex<HashMap<String, CachedPage>>,
    pub autofill_profiles: Mutex<Vec<AutofillProfile>>,
    pub extraction_rules: Mutex<Vec<ExtractionRule>>,
}

#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct CachedPage {
    pub content: Vec<u8>,
    pub content_type: String,
    pub timestamp: u64,
}

#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct AutofillProfile {
    pub id: String,
    pub name: String,
    pub fields: HashMap<String, String>,
    pub domain_patterns: Vec<String>,
}

#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct ExtractionRule {
    pub id: String,
    pub name: String,
    pub domain_pattern: String,
    pub selectors: HashMap<String, String>,
    pub output_format: String,
}

impl Default for BrowserProxyState {
    fn default() -> Self {
        Self {
            running: Mutex::new(false),
            port: Mutex::new(9876),
            shutdown_tx: Mutex::new(None),
            cache: Mutex::new(HashMap::new()),
            autofill_profiles: Mutex::new(Vec::new()),
            extraction_rules: Mutex::new(Vec::new()),
        }
    }
}

/// Handle CORS preflight OPTIONS requests
async fn handle_options() -> HttpResponse {
    HttpResponse::Ok()
        .insert_header(("Access-Control-Allow-Origin", "*"))
        .insert_header(("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH"))
        .insert_header(("Access-Control-Allow-Headers", "*"))
        .insert_header(("Access-Control-Allow-Credentials", "true"))
        .insert_header(("Access-Control-Max-Age", "86400"))
        .finish()
}

/// Check if a URL should NOT be proxied (CDNs, images, videos, etc.)
fn should_skip_proxy(url: &str) -> bool {
    let url_lower = url.to_lowercase();
    
    // Skip image/video CDNs that work directly
    let skip_domains = [
        "ytimg.com",           // YouTube thumbnails
        "yt3.ggpht.com",       // YouTube channel images
        "i.ytimg.com",         // YouTube images
        "googlevideo.com",     // Google video
        "googleusercontent.com", // Google user content
        "gstatic.com",         // Google static
        "ggpht.com",           // Google photos
        "fbcdn.net",           // Facebook CDN
        "cdninstagram.com",    // Instagram CDN
        "twimg.com",           // Twitter images
        "pbs.twimg.com",       // Twitter images
        "cloudflare.com",      // Cloudflare
        "cloudfront.net",      // AWS CloudFront
        "akamaized.net",       // Akamai
        "fastly.net",          // Fastly
        "googleapis.com",      // Google APIs
        "fonts.googleapis.com", // Google Fonts
        "fonts.gstatic.com",   // Google Fonts static
    ];
    
    // Skip by file extension (images, media)
    let skip_extensions = [
        ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".ico", ".bmp",
        ".mp4", ".webm", ".m3u8", ".ts", ".mp3", ".ogg", ".wav",
        ".woff", ".woff2", ".ttf", ".eot",
    ];
    
    // Check domains
    for domain in skip_domains.iter() {
        if url_lower.contains(domain) {
            return true;
        }
    }
    
    // Check extensions
    for ext in skip_extensions.iter() {
        if url_lower.ends_with(ext) || url_lower.contains(&format!("{}?", ext)) {
            return true;
        }
    }
    
    false
}

/// Rewrite URLs in HTML to go through proxy
fn rewrite_html_urls(html: &str, proxy_base: &str) -> String {
    let mut result = html.to_string();
    
    // Rewrite absolute URLs (https://...)
    result = HTML_URL_PATTERN.replace_all(&result, |caps: &regex::Captures| {
        let attr = &caps[1];
        let url = &caps[2];
        // Don't proxy data:, blob:, javascript: URLs
        if url.starts_with("data:") || url.starts_with("blob:") || url.starts_with("javascript:") {
            return format!("{}=\"{}\"", attr, url);
        }
        // Don't proxy CDN/media URLs that work directly
        if should_skip_proxy(url) {
            return format!("{}=\"{}\"", attr, url);
        }
        let proxied = format!("{}/proxy?url={}", proxy_base, urlencoding::encode(url));
        format!("{}=\"{}\"", attr, proxied)
    }).to_string();
    
    // Rewrite protocol-relative URLs (//...)
    result = HTML_PROTOCOL_RELATIVE.replace_all(&result, |caps: &regex::Captures| {
        let attr = &caps[1];
        let url = &caps[2];
        let full_url = format!("https:{}", url);
        // Don't proxy CDN/media URLs
        if should_skip_proxy(&full_url) {
            return format!("{}=\"{}\"", attr, url);
        }
        let proxied = format!("{}/proxy?url={}", proxy_base, urlencoding::encode(&full_url));
        format!("{}=\"{}\"", attr, proxied)
    }).to_string();
    
    // Rewrite CSS url() in inline styles - but skip fonts/images
    result = CSS_URL_PATTERN.replace_all(&result, |caps: &regex::Captures| {
        let url = &caps[1];
        if should_skip_proxy(url) {
            return format!("url(\"{}\")", url);
        }
        let proxied = format!("{}/proxy?url={}", proxy_base, urlencoding::encode(url));
        format!("url(\"{}\")", proxied)
    }).to_string();
    
    result
}

/// Proxy handler - fetches the target URL and removes restrictive headers
async fn proxy_handler(
    req: HttpRequest,
    client: web::Data<Client>,
    _body: web::Bytes,
) -> HttpResponse {
    // Handle OPTIONS preflight immediately
    if req.method() == Method::OPTIONS {
        return handle_options().await;
    }

    // Get target URL from query parameter
    let query = req.query_string();
    let params: HashMap<String, String> = url::form_urlencoded::parse(query.as_bytes())
        .into_owned()
        .collect();
    
    let target_url = match params.get("url") {
        Some(url) => {
            // Decode URL if needed
            urlencoding::decode(url)
                .map(|s| s.into_owned())
                .unwrap_or_else(|_| url.clone())
        },
        None => {
            return HttpResponse::BadRequest()
                .insert_header(("Access-Control-Allow-Origin", "*"))
                .body("Missing 'url' query parameter");
        }
    };

    println!("🌐 [PROXY] Fetching: {}", target_url);
    
    // Proxy base for URL rewriting
    let proxy_base = "http://127.0.0.1:9876";
    
    // Check if this is a video/media site that needs special handling

    let is_video_site = target_url.contains("youtube.com") 
        || target_url.contains("youtu.be")
        || target_url.contains("googlevideo.com")
        || target_url.contains("vimeo.com")
        || target_url.contains("twitch.tv")
        || target_url.contains("dailymotion.com")
        || target_url.contains("tiktok.com")
        || target_url.contains("instagram.com")
        || target_url.contains("twitter.com")
        || target_url.contains("x.com");

    // Build the request with proper headers
    let mut request_builder = client.get(&target_url)
        .header("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8")
        .header("Accept-Language", "en-US,en;q=0.9")
        .header("Sec-Fetch-Dest", "document")
        .header("Sec-Fetch-Mode", "navigate")
        .header("Sec-Fetch-Site", "none")
        .header("Upgrade-Insecure-Requests", "1");
    
    // Forward Range header for video streaming support
    if let Some(range) = req.headers().get("Range") {
        if let Ok(range_str) = range.to_str() {
            request_builder = request_builder.header("Range", range_str);
            println!("🎬 [PROXY] Range request: {}", range_str);
        }
    }

    // Fetch the target URL (follows redirects automatically)
    let response = match request_builder.send().await {
        Ok(resp) => resp,
        Err(e) => {
            println!("❌ [PROXY] Fetch error: {}", e);
            return HttpResponse::BadGateway()
                .insert_header(("Access-Control-Allow-Origin", "*"))
                .body(format!("Failed to fetch URL: {}", e));
        }
    };
    
    // Get final URL after redirects
    let final_url = response.url().to_string();

    // Get content type
    let content_type = response
        .headers()
        .get("content-type")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("text/html")
        .to_string();

    // Get the response body
    let body = match response.bytes().await {
        Ok(b) => b,
        Err(e) => {
            return HttpResponse::BadGateway()
                .insert_header(("Access-Control-Allow-Origin", "*"))
                .body(format!("Failed to read response: {}", e));
        }
    };

    // If HTML, inject base tag and modify content
    let mut final_body = body.to_vec();
    if content_type.contains("text/html") {
        if let Ok(html) = String::from_utf8(body.to_vec()) {
            // Parse the URL to get the base
            let base_url = if let Ok(parsed) = url::Url::parse(&final_url) {
                format!("{}://{}", parsed.scheme(), parsed.host_str().unwrap_or(""))
            } else {
                final_url.clone()
            };

            // First rewrite all URLs to go through proxy
            let rewritten_html = rewrite_html_urls(&html, proxy_base);

            // For video sites, use light mode interceptor (no fetch/XHR interception)
            // For regular sites, use full interceptor
            let modified_html = if is_video_site {
                inject_light_interceptor(&rewritten_html, &base_url, &final_url, proxy_base)
            } else {
                inject_base_and_interceptor(&rewritten_html, &base_url, &final_url, proxy_base)
            };
            final_body = modified_html.into_bytes();
        }
    } else if content_type.contains("text/css") {
        // Rewrite URLs in CSS
        if let Ok(css) = String::from_utf8(body.to_vec()) {
            let rewritten_css = CSS_URL_PATTERN.replace_all(&css, |caps: &regex::Captures| {
                let url = &caps[1];
                let proxied = format!("{}/proxy?url={}", proxy_base, urlencoding::encode(url));
                format!("url(\"{}\")", proxied)
            }).to_string();
            final_body = rewritten_css.into_bytes();
        }
    }

    let mode = if is_video_site { "video-mode" } else { "full" };
    println!("✅ [PROXY] Served: {} ({} bytes, {})", final_url, final_body.len(), mode);

    // Return response with FULL CORS bypass - ALLOW EVERYTHING for iframe embedding
    HttpResponse::Ok()
        .content_type(content_type)
        // CORS headers - allow all origins
        .insert_header(("Access-Control-Allow-Origin", "*"))
        .insert_header(("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH"))
        .insert_header(("Access-Control-Allow-Headers", "*"))
        .insert_header(("Access-Control-Allow-Credentials", "true"))
        .insert_header(("Access-Control-Expose-Headers", "*"))
        .insert_header(("Access-Control-Max-Age", "86400"))
        // CRITICAL: Allow iframe embedding - remove restrictive headers
        .insert_header(("X-Frame-Options", "ALLOWALL"))
        // Permissive CSP that allows all content
        .insert_header(("Content-Security-Policy", "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline'; img-src * data: blob:; font-src * data:; connect-src *; media-src * blob:; frame-src *; frame-ancestors *;"))
        // Remove other restrictive headers
        .insert_header(("X-Content-Type-Options", "nosniff"))
        .insert_header(("Referrer-Policy", "no-referrer-when-downgrade"))
        .body(final_body)
}

/// Inject a LIGHT interceptor for video sites - minimal interference
fn inject_light_interceptor(html: &str, base_url: &str, current_url: &str, proxy_base: &str) -> String {
    let light_script = format!(r#"
<script data-cube-injected="true" data-cube-mode="video-light">
(function() {{
    'use strict';
    
    // ================================================================
    // CUBE BROWSER ELITE - VIDEO SITE LIGHT MODE
    // Minimal interference to allow video playback
    // Features: Navigation messaging only (no fetch/XHR interception)
    // ================================================================
    
    if (window.__CUBE_INITIALIZED__) return;
    window.__CUBE_INITIALIZED__ = true;
    
    const CUBE = {{
        VERSION: '6.0.0-video',
        MODE: 'video-light',
        BASE_URL: '{}',
        CURRENT_URL: '{}',
        PROXY_BASE: '{}',
        
        // Get proxied URL
        getProxiedUrl: function(url) {{
            if (!url || url.startsWith('javascript:') || url.startsWith('data:') || url.startsWith('blob:')) {{
                return url;
            }}
            if (url.startsWith(this.PROXY_BASE)) return url;
            return this.PROXY_BASE + '/proxy?url=' + encodeURIComponent(url);
        }},
        
        // Simple message passing only
        sendMessage: function(type, data) {{
            try {{
                window.parent.postMessage({{
                    source: 'cube-browser-light',
                    type: type,
                    data: data
                }}, '*');
            }} catch (e) {{
                console.debug('[CUBE Light] Message error:', e);
            }}
        }},
        
        // Navigation interception (clicks only, minimal)
        initNavigation: function() {{
            // Only intercept link clicks for navigation tracking
            document.addEventListener('click', function(e) {{
                const link = e.target.closest('a[href]');
                if (link && link.href && !link.href.startsWith('javascript:')) {{
                    const href = link.getAttribute('href');
                    // Intercept navigation to go through proxy
                    if (href && href.startsWith('http')) {{
                        e.preventDefault();
                        CUBE.sendMessage('CUBE_NAVIGATE', {{ url: link.href, newTab: e.ctrlKey || e.metaKey }});
                    }}
                }}
            }}, true);
        }},
        
        // Message handler
        handleMessage: function(event) {{
            if (!event.data || event.data.source !== 'cube-host') return;
            const {{ type, payload, id }} = event.data;
            
            switch (type) {{
                case 'CUBE_GET_INFO':
                    CUBE.sendMessage('CUBE_PAGE_INFO', {{
                        id,
                        title: document.title,
                        url: window.location.href,
                        mode: 'video-light'
                    }});
                    break;
            }}
        }},
        
        init: function() {{
            CUBE.initNavigation();
            window.addEventListener('message', CUBE.handleMessage);
            
            window.addEventListener('load', function() {{
                CUBE.sendMessage('CUBE_PAGE_READY', {{
                    title: document.title,
                    url: CUBE.CURRENT_URL,
                    mode: 'video-light',
                    favicon: document.querySelector('link[rel*="icon"]')?.href || ''
                }});
            }});
            
            console.log('🔷 CUBE Browser Light v' + CUBE.VERSION + ' - Video Mode Active');
        }}
    }};
    
    CUBE.init();
    window.__CUBE__ = CUBE;
}})();
</script>
"#, base_url, current_url, proxy_base);

    // Find <head> and inject after it
    if let Some(head_pos) = html.to_lowercase().find("<head") {
        if let Some(head_end) = html[head_pos..].find('>') {
            let insert_pos = head_pos + head_end + 1;
            let base_tag = format!(r#"<base href="{}/"/>"#, base_url);
            return format!(
                "{}{}{}{}",
                &html[..insert_pos],
                base_tag,
                light_script,
                &html[insert_pos..]
            );
        }
    }
    
    // Fallback: prepend to document
    format!("{}{}", light_script, html)
}

/// Inject base tag and interceptor script into HTML
fn inject_base_and_interceptor(html: &str, base_url: &str, current_url: &str, proxy_base: &str) -> String {
    let interceptor_script = format!(r#"
<script data-cube-injected="true">
(function() {{
    'use strict';
    
    // ================================================================
    // CUBE BROWSER ELITE - COMPLETE INTEGRATION SCRIPT
    // Features: Navigation, Autofill, Extraction, Documents, Automation
    // V6.1: Fixed form submission to work with Google Search
    // ================================================================
    
    const CUBE = {{
        BASE_URL: '{}',
        CURRENT_URL: '{}',
        PROXY_BASE: '{}',
        PROXY_PORT: 9876,
        VERSION: '6.1.0',
        
        // Sites that need special form handling (search engines, etc.)
        SEARCH_SITES: ['google.com', 'bing.com', 'duckduckgo.com', 'yahoo.com', 'baidu.com', 'yandex.com'],
        
        // State
        state: {{
            autofillReady: false,
            extractionReady: false,
            automationRunning: false,
            detectedForms: [],
            detectedDocuments: [],
            extractedData: {{}},
            consoleLog: [],
            networkLog: [],
            performanceMetrics: {{}}
        }},
        
        // Check if current site is a search engine
        isSearchSite: function() {{
            const host = window.location.hostname.toLowerCase();
            return CUBE.SEARCH_SITES.some(site => host.includes(site));
        }},
        
        // Get proxied URL
        getProxiedUrl: function(url) {{
            if (!url || url.startsWith('javascript:') || url.startsWith('data:') || url.startsWith('blob:')) {{
                return url;
            }}
            if (url.startsWith(this.PROXY_BASE)) return url;
            return this.PROXY_BASE + '/proxy?url=' + encodeURIComponent(url);
        }},
        
        // ============================================================
        // 1. NAVIGATION INTERCEPTION
        // ============================================================
        initNavigation: function() {{
            // Intercept link clicks
            document.addEventListener('click', function(e) {{
                const link = e.target.closest('a');
                if (link && link.href && !link.href.startsWith('javascript:')) {{
                    const href = link.href;
                    if (href.startsWith('http://') || href.startsWith('https://')) {{
                        e.preventDefault();
                        e.stopPropagation();
                        CUBE.navigate(href);
                    }}
                }}
            }}, true);
            
            // Intercept form submissions - but allow search engines to work
            document.addEventListener('submit', function(e) {{
                const form = e.target;
                if (form && form.tagName === 'FORM') {{
                    // For search sites, handle form submission properly through proxy
                    if (CUBE.isSearchSite()) {{
                        e.preventDefault();
                        e.stopPropagation();
                        CUBE.handleSearchFormSubmit(form);
                        return;
                    }}
                    
                    // For other sites, send to parent for handling
                    e.preventDefault();
                    CUBE.submitForm(form);
                }}
            }}, true);
            
            // Intercept window.open
            const originalOpen = window.open;
            window.open = function(url, target, features) {{
                if (url && (url.startsWith('http://') || url.startsWith('https://'))) {{
                    CUBE.openNewTab(url);
                    return null;
                }}
                return originalOpen.call(this, url, target, features);
            }};
            
            // Intercept history changes - safely handle when state is restricted
            try {{
                const originalPushState = history.pushState;
                history.pushState = function() {{
                    try {{
                        originalPushState.apply(this, arguments);
                        CUBE.sendMessage('CUBE_HISTORY_CHANGE', {{ url: arguments[2] }});
                    }} catch (e) {{
                        console.debug('[CUBE] History push blocked:', e);
                    }}
                }};
            }} catch (e) {{
                console.debug('[CUBE] History interception not available');
            }}
        }},
        
        // Handle search form submission (Google, Bing, etc.)
        handleSearchFormSubmit: function(form) {{
            const formData = new FormData(form);
            let action = form.action || window.location.href;
            const method = (form.method || 'GET').toUpperCase();
            
            // Build the URL with form data
            if (method === 'GET') {{
                const params = new URLSearchParams();
                for (const [key, value] of formData.entries()) {{
                    if (typeof value === 'string') {{
                        params.append(key, value);
                    }}
                }}
                
                // Handle action URL properly
                let targetUrl;
                try {{
                    const actionUrl = new URL(action, CUBE.BASE_URL);
                    actionUrl.search = params.toString();
                    targetUrl = actionUrl.toString();
                }} catch (e) {{
                    // Fallback: just append params
                    const separator = action.includes('?') ? '&' : '?';
                    targetUrl = action + separator + params.toString();
                }}
                
                console.log('🔍 [CUBE] Search navigation:', targetUrl);
                CUBE.navigate(targetUrl);
            }} else {{
                // POST forms - send as message for parent to handle
                CUBE.submitForm(form);
            }}
        }},
        
        navigate: function(url) {{
            CUBE.sendMessage('CUBE_NAVIGATE', {{ url: url }});
        }},
        
        submitForm: function(form) {{
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            const action = form.action || CUBE.CURRENT_URL;
            const method = (form.method || 'GET').toUpperCase();
            
            CUBE.sendMessage('CUBE_FORM_SUBMIT', {{
                url: action,
                method: method,
                data: data
            }});
        }},
        
        openNewTab: function(url) {{
            CUBE.sendMessage('CUBE_OPEN_TAB', {{ url: url }});
        }},
        
        // ============================================================
        // 2. AUTOFILL SYSTEM
        // ============================================================
        initAutofill: function() {{
            CUBE.detectForms();
            CUBE.observeNewForms();
            CUBE.state.autofillReady = true;
        }},
        
        detectForms: function() {{
            const forms = document.querySelectorAll('form');
            const inputs = document.querySelectorAll('input, select, textarea');
            
            CUBE.state.detectedForms = [];
            
            forms.forEach((form, index) => {{
                const formInfo = {{
                    id: form.id || `form-${{index}}`,
                    action: form.action,
                    method: form.method,
                    fields: []
                }};
                
                form.querySelectorAll('input, select, textarea').forEach(field => {{
                    formInfo.fields.push(CUBE.analyzeField(field));
                }});
                
                CUBE.state.detectedForms.push(formInfo);
            }});
            
            // Standalone inputs
            inputs.forEach(input => {{
                if (!input.closest('form')) {{
                    CUBE.state.detectedForms.push({{
                        id: 'standalone',
                        action: '',
                        method: '',
                        fields: [CUBE.analyzeField(input)]
                    }});
                }}
            }});
            
            CUBE.sendMessage('CUBE_FORMS_DETECTED', {{ forms: CUBE.state.detectedForms }});
        }},
        
        analyzeField: function(field) {{
            const name = field.name || field.id || '';
            const type = field.type || field.tagName.toLowerCase();
            const label = CUBE.findLabelText(field);
            const placeholder = field.placeholder || '';
            const autocomplete = field.autocomplete || '';
            
            // AI-powered field type detection
            const fieldType = CUBE.detectFieldType(name, label, placeholder, type, autocomplete);
            
            return {{
                element: field,
                selector: CUBE.generateSelector(field),
                name: name,
                type: type,
                fieldType: fieldType,
                label: label,
                placeholder: placeholder,
                autocomplete: autocomplete,
                required: field.required,
                value: field.value
            }};
        }},
        
        detectFieldType: function(name, label, placeholder, type, autocomplete) {{
            const text = (name + ' ' + label + ' ' + placeholder + ' ' + autocomplete).toLowerCase();
            
            // Email
            if (text.match(/email|correo|e-mail|mail/)) return 'email';
            
            // Phone
            if (text.match(/phone|tel|móvil|celular|teléfono/)) return 'phone';
            
            // Name fields
            if (text.match(/first.?name|nombre|given.?name/)) return 'firstName';
            if (text.match(/last.?name|apellido|family.?name|surname/)) return 'lastName';
            if (text.match(/full.?name|nombre.?completo/)) return 'fullName';
            
            // Address
            if (text.match(/street|calle|address|dirección|línea.?1/)) return 'streetAddress';
            if (text.match(/city|ciudad/)) return 'city';
            if (text.match(/state|estado|provincia|region/)) return 'state';
            if (text.match(/zip|postal|código.?postal|cp/)) return 'postalCode';
            if (text.match(/country|país/)) return 'country';
            
            // Payment
            if (text.match(/card.?number|número.?tarjeta|cc.?num/)) return 'cardNumber';
            if (text.match(/expir|vencimiento|exp.?date/)) return 'cardExpiry';
            if (text.match(/cvv|cvc|código.?seguridad/)) return 'cardCvv';
            
            // Credentials
            if (text.match(/username|usuario|user.?name/)) return 'username';
            if (text.match(/password|contraseña|pass/)) return 'password';
            
            // Personal
            if (text.match(/birth|nacimiento|fecha.?nac|dob/)) return 'birthDate';
            if (text.match(/ssn|social.?security|seguro.?social/)) return 'ssn';
            
            // Company
            if (text.match(/company|empresa|compañía|business/)) return 'company';
            if (text.match(/job|title|cargo|puesto/)) return 'jobTitle';
            
            // Default based on input type
            if (type === 'email') return 'email';
            if (type === 'tel') return 'phone';
            if (type === 'password') return 'password';
            
            return 'text';
        }},
        
        findLabelText: function(field) {{
            // Check for associated label
            if (field.id) {{
                const label = document.querySelector(`label[for="${{field.id}}"]`);
                if (label) return label.textContent.trim();
            }}
            
            // Check parent label
            const parentLabel = field.closest('label');
            if (parentLabel) return parentLabel.textContent.trim();
            
            // Check aria-label
            if (field.getAttribute('aria-label')) {{
                return field.getAttribute('aria-label');
            }}
            
            // Check preceding sibling text
            const prev = field.previousElementSibling;
            if (prev && prev.tagName === 'LABEL') {{
                return prev.textContent.trim();
            }}
            
            return '';
        }},
        
        generateSelector: function(element) {{
            if (element.id) {{
                return `#${{element.id}}`;
            }}
            if (element.name) {{
                const tag = element.tagName.toLowerCase();
                return `${{tag}}[name="${{element.name}}"]`;
            }}
            // Generate path-based selector
            const path = [];
            let el = element;
            while (el && el.tagName) {{
                let selector = el.tagName.toLowerCase();
                if (el.className) {{
                    const classes = el.className.split(' ').filter(c => c && !c.includes('{{'));
                    if (classes.length) {{
                        selector += '.' + classes.slice(0, 2).join('.');
                    }}
                }}
                path.unshift(selector);
                el = el.parentElement;
                if (path.length > 4) break;
            }}
            return path.join(' > ');
        }},
        
        fillField: function(selector, value) {{
            const field = document.querySelector(selector);
            if (field) {{
                field.focus();
                field.value = value;
                field.dispatchEvent(new Event('input', {{ bubbles: true }}));
                field.dispatchEvent(new Event('change', {{ bubbles: true }}));
                return true;
            }}
            return false;
        }},
        
        fillForm: function(profile) {{
            const filled = [];
            CUBE.state.detectedForms.forEach(form => {{
                form.fields.forEach(field => {{
                    if (profile[field.fieldType]) {{
                        if (CUBE.fillField(field.selector, profile[field.fieldType])) {{
                            filled.push(field.fieldType);
                        }}
                    }}
                }});
            }});
            CUBE.sendMessage('CUBE_AUTOFILL_COMPLETE', {{ filled: filled }});
        }},
        
        observeNewForms: function() {{
            const observer = new MutationObserver(mutations => {{
                let shouldRedetect = false;
                mutations.forEach(mutation => {{
                    mutation.addedNodes.forEach(node => {{
                        if (node.nodeType === 1) {{
                            if (node.tagName === 'FORM' || node.querySelector?.('form, input, select, textarea')) {{
                                shouldRedetect = true;
                            }}
                        }}
                    }});
                }});
                if (shouldRedetect) {{
                    setTimeout(() => CUBE.detectForms(), 100);
                }}
            }});
            observer.observe(document.body, {{ childList: true, subtree: true }});
        }},
        
        // ============================================================
        // 3. DATA EXTRACTION
        // ============================================================
        initExtraction: function() {{
            CUBE.state.extractionReady = true;
        }},
        
        extractData: function(rules) {{
            const results = {{}};
            
            rules.forEach(rule => {{
                try {{
                    const elements = document.querySelectorAll(rule.selector);
                    results[rule.name] = [];
                    
                    elements.forEach(el => {{
                        let value;
                        switch (rule.attribute) {{
                            case 'text':
                                value = el.textContent.trim();
                                break;
                            case 'html':
                                value = el.innerHTML;
                                break;
                            case 'href':
                                value = el.href;
                                break;
                            case 'src':
                                value = el.src;
                                break;
                            default:
                                value = el.getAttribute(rule.attribute) || el.textContent.trim();
                        }}
                        
                        if (value) {{
                            results[rule.name].push(value);
                        }}
                    }});
                }} catch (e) {{
                    results[rule.name] = {{ error: e.message }};
                }}
            }});
            
            CUBE.state.extractedData = results;
            return results;
        }},
        
        extractTable: function(selector) {{
            const table = document.querySelector(selector);
            if (!table) return null;
            
            const headers = [];
            const rows = [];
            
            // Get headers
            table.querySelectorAll('thead th, thead td, tr:first-child th, tr:first-child td').forEach(th => {{
                headers.push(th.textContent.trim());
            }});
            
            // Get rows
            table.querySelectorAll('tbody tr, tr').forEach((tr, index) => {{
                if (index === 0 && headers.length === 0) return; // Skip header row
                const row = {{}};
                tr.querySelectorAll('td, th').forEach((td, i) => {{
                    const key = headers[i] || `col_${{i}}`;
                    row[key] = td.textContent.trim();
                }});
                if (Object.keys(row).length) rows.push(row);
            }});
            
            return {{ headers, rows }};
        }},
        
        extractLinks: function(filter) {{
            const links = [];
            document.querySelectorAll('a[href]').forEach(a => {{
                const href = a.href;
                const text = a.textContent.trim();
                
                if (!filter || href.includes(filter) || text.toLowerCase().includes(filter.toLowerCase())) {{
                    links.push({{
                        url: href,
                        text: text,
                        title: a.title || ''
                    }});
                }}
            }});
            return links;
        }},
        
        extractImages: function() {{
            const images = [];
            document.querySelectorAll('img[src]').forEach(img => {{
                images.push({{
                    src: img.src,
                    alt: img.alt || '',
                    width: img.naturalWidth,
                    height: img.naturalHeight
                }});
            }});
            return images;
        }},
        
        // ============================================================
        // 4. DOCUMENT DETECTION
        // ============================================================
        initDocumentDetection: function() {{
            CUBE.detectDocuments();
        }},
        
        detectDocuments: function() {{
            const documents = [];
            
            // PDF links
            document.querySelectorAll('a[href$=".pdf"], a[href*=".pdf?"]').forEach(a => {{
                documents.push({{
                    type: 'pdf',
                    url: a.href,
                    name: a.textContent.trim() || CUBE.getFilenameFromUrl(a.href)
                }});
            }});
            
            // Excel/CSV links
            document.querySelectorAll('a[href$=".xlsx"], a[href$=".xls"], a[href$=".csv"]').forEach(a => {{
                const ext = a.href.split('.').pop().split('?')[0];
                documents.push({{
                    type: ext,
                    url: a.href,
                    name: a.textContent.trim() || CUBE.getFilenameFromUrl(a.href)
                }});
            }});
            
            // Images for OCR
            document.querySelectorAll('img[src]').forEach(img => {{
                if (img.naturalWidth > 100 && img.naturalHeight > 100) {{
                    documents.push({{
                        type: 'image',
                        url: img.src,
                        name: img.alt || CUBE.getFilenameFromUrl(img.src),
                        width: img.naturalWidth,
                        height: img.naturalHeight
                    }});
                }}
            }});
            
            // Embedded PDFs
            document.querySelectorAll('embed[type="application/pdf"], object[type="application/pdf"], iframe[src*=".pdf"]').forEach(el => {{
                documents.push({{
                    type: 'pdf-embedded',
                    url: el.src || el.data,
                    name: 'Embedded PDF'
                }});
            }});
            
            CUBE.state.detectedDocuments = documents;
            CUBE.sendMessage('CUBE_DOCUMENTS_DETECTED', {{ documents: documents }});
            return documents;
        }},
        
        getFilenameFromUrl: function(url) {{
            try {{
                const pathname = new URL(url).pathname;
                return pathname.split('/').pop() || 'unknown';
            }} catch {{
                return 'unknown';
            }}
        }},
        
        downloadDocument: function(url) {{
            CUBE.sendMessage('CUBE_DOWNLOAD_DOCUMENT', {{ url: url }});
        }},
        
        // ============================================================
        // 5. CONSOLE & NETWORK INTERCEPTION (DevTools)
        // ============================================================
        
        // Video/Media site detection - these sites need special handling
        VIDEO_SITES: ['youtube.com', 'youtu.be', 'vimeo.com', 'dailymotion.com', 'twitch.tv', 
                      'netflix.com', 'hulu.com', 'disneyplus.com', 'primevideo.com', 'hbomax.com',
                      'tiktok.com', 'instagram.com', 'facebook.com', 'twitter.com', 'x.com'],
        
        // Media URL patterns that should not be intercepted
        MEDIA_PATTERNS: [
            /\.googlevideo\.com/i,
            /videoplayback/i,
            /\.youtube\.com\/api\/stats/i,
            /\.youtube\.com\/youtubei\//i,
            /manifest\.googlevideo\.com/i,
            /\.mp4(\?|$)/i,
            /\.webm(\?|$)/i,
            /\.m3u8(\?|$)/i,
            /\.mpd(\?|$)/i,
            /\.ts(\?|$)/i,
            /range=/i,
            /blob:/i,
            /mediastream:/i
        ],
        
        isVideoSite: function() {{
            const host = window.location.hostname.toLowerCase();
            return CUBE.VIDEO_SITES.some(site => host.includes(site));
        }},
        
        isMediaUrl: function(url) {{
            if (!url) return false;
            const urlStr = String(url);
            return CUBE.MEDIA_PATTERNS.some(pattern => pattern.test(urlStr));
        }},
        
        initDevTools: function() {{
            // Check if this is a video site that needs special handling
            const isVideoSite = CUBE.isVideoSite();
            
            if (isVideoSite) {{
                console.log('🔷 CUBE: Video site detected - using non-intrusive mode');
            }}
            
            // Intercept console (safe for all sites)
            ['log', 'warn', 'error', 'info', 'debug'].forEach(method => {{
                const original = console[method];
                console[method] = function(...args) {{
                    CUBE.state.consoleLog.push({{
                        type: method,
                        args: args.map(a => {{
                            try {{ return JSON.stringify(a); }}
                            catch {{ return String(a); }}
                        }}),
                        timestamp: Date.now()
                    }});
                    if (CUBE.state.consoleLog.length > 1000) {{
                        CUBE.state.consoleLog = CUBE.state.consoleLog.slice(-1000);
                    }}
                    return original.apply(this, args);
                }};
            }});
            
            // Only intercept fetch/XHR on non-video sites to avoid breaking media playback
            if (!isVideoSite) {{
                // Intercept fetch
                const originalFetch = window.fetch;
                window.fetch = async function(...args) {{
                    const url = String(args[0]?.url || args[0]);
                    
                    // Don't intercept media URLs even on non-video sites
                    if (CUBE.isMediaUrl(url)) {{
                        return originalFetch.apply(this, args);
                    }}
                    
                    const startTime = performance.now();
                    const request = {{
                        type: 'fetch',
                        url: url,
                        method: args[1]?.method || 'GET',
                        timestamp: Date.now()
                    }};
                    
                    try {{
                        const response = await originalFetch.apply(this, args);
                        request.status = response.status;
                        request.duration = performance.now() - startTime;
                        request.contentType = response.headers.get('content-type');
                        CUBE.state.networkLog.push(request);
                        return response;
                    }} catch (error) {{
                        request.error = error.message;
                        request.duration = performance.now() - startTime;
                        CUBE.state.networkLog.push(request);
                        throw error;
                    }}
                }};
                
                // Intercept XHR
                const originalXHR = XMLHttpRequest.prototype.open;
                XMLHttpRequest.prototype.open = function(method, url) {{
                    // Don't track media URLs
                    if (!CUBE.isMediaUrl(url)) {{
                        this._cubeRequest = {{ type: 'xhr', method, url, timestamp: Date.now() }};
                    }}
                    return originalXHR.apply(this, arguments);
                }};
                
                const originalSend = XMLHttpRequest.prototype.send;
                XMLHttpRequest.prototype.send = function() {{
                    if (this._cubeRequest) {{
                        const startTime = performance.now();
                        this.addEventListener('loadend', () => {{
                            if (this._cubeRequest) {{
                                this._cubeRequest.status = this.status;
                                this._cubeRequest.duration = performance.now() - startTime;
                                CUBE.state.networkLog.push(this._cubeRequest);
                            }}
                        }});
                    }}
                    return originalSend.apply(this, arguments);
                }};
            }} else {{
                // For video sites, just log without intercepting
                console.log('🔷 CUBE: Network interception disabled for video compatibility');
            }}
        }},
        
        getConsoleLog: function() {{
            return CUBE.state.consoleLog;
        }},
        
        getNetworkLog: function() {{
            return CUBE.state.networkLog;
        }},
        
        executeScript: function(code) {{
            try {{
                return {{ success: true, result: eval(code) }};
            }} catch (e) {{
                return {{ success: false, error: e.message }};
            }}
        }},
        
        // ============================================================
        // 6. AUTOMATION HELPERS
        // ============================================================
        click: function(selector) {{
            const el = document.querySelector(selector);
            if (el) {{
                el.click();
                return true;
            }}
            return false;
        }},
        
        type: function(selector, text, delay = 50) {{
            const el = document.querySelector(selector);
            if (!el) return false;
            
            el.focus();
            el.value = '';
            
            // Simulate typing with delay
            return new Promise(resolve => {{
                let i = 0;
                const interval = setInterval(() => {{
                    if (i < text.length) {{
                        el.value += text[i];
                        el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                        i++;
                    }} else {{
                        clearInterval(interval);
                        el.dispatchEvent(new Event('change', {{ bubbles: true }}));
                        resolve(true);
                    }}
                }}, delay);
            }});
        }},
        
        waitFor: function(selector, timeout = 10000) {{
            return new Promise((resolve, reject) => {{
                const el = document.querySelector(selector);
                if (el) return resolve(el);
                
                const observer = new MutationObserver(() => {{
                    const el = document.querySelector(selector);
                    if (el) {{
                        observer.disconnect();
                        resolve(el);
                    }}
                }});
                
                observer.observe(document.body, {{ childList: true, subtree: true }});
                
                setTimeout(() => {{
                    observer.disconnect();
                    reject(new Error(`Timeout waiting for: ${{selector}}`));
                }}, timeout);
            }});
        }},
        
        scroll: function(selector, position) {{
            const el = selector ? document.querySelector(selector) : window;
            if (el) {{
                if (el === window) {{
                    window.scrollTo({{ top: position, behavior: 'smooth' }});
                }} else {{
                    el.scrollIntoView({{ behavior: 'smooth', block: 'center' }});
                }}
                return true;
            }}
            return false;
        }},
        
        screenshot: function() {{
            CUBE.sendMessage('CUBE_SCREENSHOT_REQUEST', {{ url: CUBE.CURRENT_URL }});
        }},
        
        // ============================================================
        // 7. MESSAGING
        // ============================================================
        sendMessage: function(type, payload) {{
            window.parent.postMessage({{ type, payload, timestamp: Date.now() }}, '*');
        }},
        
        handleMessage: function(event) {{
            if (!event.data || !event.data.type) return;
            
            const {{ type, payload, id }} = event.data;
            
            switch (type) {{
                case 'CUBE_FILL_FORM':
                    CUBE.fillForm(payload);
                    break;
                    
                case 'CUBE_EXTRACT_DATA':
                    const data = CUBE.extractData(payload.rules);
                    CUBE.sendMessage('CUBE_EXTRACT_RESULT', {{ id, data }});
                    break;
                    
                case 'CUBE_EXTRACT_TABLE':
                    const table = CUBE.extractTable(payload.selector);
                    CUBE.sendMessage('CUBE_EXTRACT_RESULT', {{ id, data: table }});
                    break;
                    
                case 'CUBE_EXECUTE':
                    const result = CUBE.executeScript(payload.code);
                    CUBE.sendMessage('CUBE_EXECUTE_RESULT', {{ id, ...result }});
                    break;
                    
                case 'CUBE_CLICK':
                    CUBE.click(payload.selector);
                    break;
                    
                case 'CUBE_TYPE':
                    CUBE.type(payload.selector, payload.text, payload.delay);
                    break;
                    
                case 'CUBE_GET_CONSOLE':
                    CUBE.sendMessage('CUBE_CONSOLE_DATA', {{ log: CUBE.getConsoleLog() }});
                    break;
                    
                case 'CUBE_GET_NETWORK':
                    CUBE.sendMessage('CUBE_NETWORK_DATA', {{ log: CUBE.getNetworkLog() }});
                    break;
                    
                case 'CUBE_GET_DOM':
                    CUBE.sendMessage('CUBE_DOM_DATA', {{ html: document.documentElement.outerHTML }});
                    break;
                    
                case 'CUBE_GET_FORMS':
                    CUBE.detectForms();
                    break;
                    
                case 'CUBE_GET_DOCUMENTS':
                    CUBE.detectDocuments();
                    break;
                    
                case 'CUBE_SCROLL':
                    CUBE.scroll(payload.selector, payload.position);
                    break;
            }}
        }},
        
        // ============================================================
        // 8. INITIALIZATION
        // ============================================================
        init: function() {{
            CUBE.initNavigation();
            CUBE.initAutofill();
            CUBE.initExtraction();
            CUBE.initDocumentDetection();
            CUBE.initDevTools();
            
            window.addEventListener('message', CUBE.handleMessage);
            
            // Report ready
            window.addEventListener('load', function() {{
                CUBE.sendMessage('CUBE_PAGE_READY', {{
                    title: document.title,
                    url: CUBE.CURRENT_URL,
                    favicon: document.querySelector('link[rel*="icon"]')?.href || '',
                    forms: CUBE.state.detectedForms.length,
                    documents: CUBE.state.detectedDocuments.length
                }});
            }});
            
            // Also report on DOMContentLoaded for faster response
            if (document.readyState === 'loading') {{
                document.addEventListener('DOMContentLoaded', function() {{
                    CUBE.sendMessage('CUBE_DOM_READY', {{ url: CUBE.CURRENT_URL }});
                }});
            }} else {{
                CUBE.sendMessage('CUBE_DOM_READY', {{ url: CUBE.CURRENT_URL }});
            }}
            
            console.log('🔷 CUBE Nexum v' + CUBE.VERSION + ' - All Systems Active');
        }}
    }};
    
    // Start CUBE
    CUBE.init();
    
    // Expose for debugging
    window.__CUBE__ = CUBE;
}})();
</script>
"#, base_url, current_url, proxy_base);

    // Find <head> and inject after it
    if let Some(head_pos) = html.to_lowercase().find("<head") {
        if let Some(head_end) = html[head_pos..].find('>') {
            let insert_pos = head_pos + head_end + 1;
            let base_tag = format!(r#"<base href="{}/"/>"#, base_url);
            return format!(
                "{}{}{}{}",
                &html[..insert_pos],
                base_tag,
                interceptor_script,
                &html[insert_pos..]
            );
        }
    }
    
    // Fallback: prepend to document
    format!("{}{}", interceptor_script, html)
}

/// Proxy asset handler for relative URLs
async fn proxy_asset_handler(
    req: HttpRequest,
    path: web::Path<String>,
    client: web::Data<Client>,
) -> HttpResponse {
    // Get base URL from referer
    let referer = req
        .headers()
        .get("referer")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");
    
    // Extract base URL from referer's ?url= parameter
    let base_url = if let Some(url_start) = referer.find("url=") {
        let url_encoded = &referer[url_start + 4..];
        let url_end = url_encoded.find('&').unwrap_or(url_encoded.len());
        urlencoding::decode(&url_encoded[..url_end])
            .map(|s| s.into_owned())
            .unwrap_or_default()
    } else {
        String::new()
    };

    if base_url.is_empty() {
        return HttpResponse::BadRequest().body("Cannot determine base URL");
    }

    // Construct full URL
    let asset_path = path.into_inner();
    let full_url = if asset_path.starts_with("http://") || asset_path.starts_with("https://") {
        asset_path
    } else if let Ok(base) = url::Url::parse(&base_url) {
        base.join(&asset_path)
            .map(|u| u.to_string())
            .unwrap_or(asset_path)
    } else {
        format!("{}/{}", base_url.trim_end_matches('/'), asset_path.trim_start_matches('/'))
    };

    // Fetch the asset
    let response = match client.get(&full_url)
        .header("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")
        .send()
        .await
    {
        Ok(resp) => resp,
        Err(e) => {
            return HttpResponse::BadGateway()
                .body(format!("Failed to fetch asset: {}", e));
        }
    };

    let content_type = response
        .headers()
        .get("content-type")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("application/octet-stream")
        .to_string();

    let body = match response.bytes().await {
        Ok(b) => b,
        Err(e) => {
            return HttpResponse::BadGateway()
                .body(format!("Failed to read asset: {}", e));
        }
    };

    HttpResponse::Ok()
        .content_type(content_type)
        .insert_header(("Access-Control-Allow-Origin", "*"))
        .body(body.to_vec())
}

/// Start the proxy server
pub async fn start_proxy_server(port: u16) -> Result<oneshot::Sender<()>, String> {
    let (shutdown_tx, shutdown_rx) = oneshot::channel::<()>();
    
    let client = Client::builder()
        .danger_accept_invalid_certs(true)
        .redirect(reqwest::redirect::Policy::limited(10))
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let client_data = web::Data::new(client);
    
    let server = HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .expose_any_header()
            .supports_credentials()
            .max_age(86400);

        App::new()
            .wrap(cors)
            .app_data(client_data.clone())
            .route("/proxy", web::method(Method::OPTIONS).to(handle_options))
            .route("/proxy", web::get().to(proxy_handler))
            .route("/proxy", web::post().to(proxy_handler))
            .route("/asset/{path:.*}", web::get().to(proxy_asset_handler))
            .route("/asset/{path:.*}", web::method(Method::OPTIONS).to(handle_options))
            .route("/health", web::get().to(|| async { HttpResponse::Ok().body("OK") }))
    })
    .bind(format!("127.0.0.1:{}", port))
    .map_err(|e| format!("Failed to bind proxy server: {}", e))?
    .disable_signals()
    .run();

    let server_handle = server.handle();
    
    // Spawn the server
    tokio::spawn(async move {
        tokio::select! {
            _ = server => {},
            _ = shutdown_rx => {
                server_handle.stop(true).await;
            }
        }
    });

    println!("🌐 [PROXY] Browser proxy server started on http://127.0.0.1:{}", port);
    
    Ok(shutdown_tx)
}

/// Stop the proxy server
pub async fn stop_proxy_server(shutdown_tx: oneshot::Sender<()>) -> Result<(), String> {
    shutdown_tx.send(()).map_err(|_| "Failed to send shutdown signal".to_string())?;
    println!("🛑 [PROXY] Browser proxy server stopped");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_inject_base_and_interceptor() {
        let html = r#"<!DOCTYPE html><html><head><title>Test</title></head><body>Hello</body></html>"#;
        let result = inject_base_and_interceptor(html, "https://example.com", "https://example.com/page", "http://127.0.0.1:9876");
        
        assert!(result.contains("<base href=\"https://example.com/\"/>"));
        assert!(result.contains("CUBE Browser"));
        assert!(result.contains("CUBE_NAVIGATE"));
    }
    
    #[test]
    fn test_rewrite_html_urls() {
        let html = r#"<a href="https://example.com/test">Link</a>"#;
        let result = rewrite_html_urls(html, "http://127.0.0.1:9876");
        assert!(result.contains("/proxy?url="));
    }
}
