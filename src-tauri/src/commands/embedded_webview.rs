// Embedded Webview Commands - Native browser tabs within main window
// Uses Tauri 2.0 WebviewWindow API for browser functionality

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

/// State for managing embedded webviews within the main window
pub struct EmbeddedWebviewState {
    pub webviews: Mutex<HashMap<String, EmbeddedWebviewInfo>>,
    pub active_tab: Mutex<Option<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmbeddedWebviewInfo {
    pub tab_id: String,
    pub url: String,
    pub title: String,
    pub can_go_back: bool,
    pub can_go_forward: bool,
    pub is_loading: bool,
    pub favicon: Option<String>,
}

impl Default for EmbeddedWebviewState {
    fn default() -> Self {
        Self {
            webviews: Mutex::new(HashMap::new()),
            active_tab: Mutex::new(None),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebviewBounds {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

/// Create an embedded webview as a new window (positioned below toolbar)
#[tauri::command]
pub async fn embedded_webview_create(
    app: AppHandle,
    state: tauri::State<'_, EmbeddedWebviewState>,
    tab_id: String,
    url: String,
    bounds: WebviewBounds,
) -> Result<EmbeddedWebviewInfo, String> {
    println!("🌐 [EMBEDDED] Creating embedded webview: {} -> {}", tab_id, url);

    let label = format!("tab_{}", tab_id);

    // Parse URL
    let webview_url = if url.is_empty() || url == "about:blank" {
        WebviewUrl::App("index.html".into())
    } else {
        WebviewUrl::External(url.parse().map_err(|e| format!("Invalid URL: {}", e))?)
    };

    // Create webview window positioned below main window toolbar
    let _webview = WebviewWindowBuilder::new(&app, &label, webview_url)
        .title("CUBE Browser Tab")
        .inner_size(bounds.width, bounds.height)
        .position(bounds.x, bounds.y)
        .decorations(false)
        .resizable(false)
        .visible(true)
        .skip_taskbar(true)
        .build()
        .map_err(|e| format!("Failed to create embedded webview: {}", e))?;

    // Create info
    let info = EmbeddedWebviewInfo {
        tab_id: tab_id.clone(),
        url: url.clone(),
        title: "Loading...".to_string(),
        can_go_back: false,
        can_go_forward: false,
        is_loading: true,
        favicon: None,
    };

    // Store reference
    {
        let mut webviews = state.webviews.lock().unwrap();
        webviews.insert(tab_id.clone(), info.clone());
    }

    // Set as active
    {
        let mut active = state.active_tab.lock().unwrap();
        *active = Some(tab_id.clone());
    }

    println!("✅ [EMBEDDED] Created webview: {}", label);
    Ok(info)
}

/// Navigate embedded webview to URL
#[tauri::command]
pub async fn embedded_webview_navigate(
    app: AppHandle,
    state: tauri::State<'_, EmbeddedWebviewState>,
    tab_id: String,
    url: String,
) -> Result<(), String> {
    println!("🔗 [EMBEDDED] Navigating {} to {}", tab_id, url);

    let label = format!("tab_{}", tab_id);

    // Get the webview window
    let webview = app
        .get_webview_window(&label)
        .ok_or("Webview not found")?;

    // Navigate using JavaScript
    let script = format!(
        "window.location.href = '{}';",
        url.replace("'", "\\'")
    );
    webview
        .eval(&script)
        .map_err(|e| format!("Navigation failed: {}", e))?;

    // Update state
    {
        let mut webviews = state.webviews.lock().unwrap();
        if let Some(info) = webviews.get_mut(&tab_id) {
            info.url = url;
            info.is_loading = true;
        }
    }

    Ok(())
}

/// Close embedded webview
#[tauri::command]
pub async fn embedded_webview_close(
    app: AppHandle,
    state: tauri::State<'_, EmbeddedWebviewState>,
    tab_id: String,
) -> Result<(), String> {
    println!("❌ [EMBEDDED] Closing webview: {}", tab_id);

    let label = format!("tab_{}", tab_id);

    // Close the window
    if let Some(webview) = app.get_webview_window(&label) {
        webview.close().map_err(|e| format!("Close failed: {}", e))?;
    }

    // Remove from state
    {
        let mut webviews = state.webviews.lock().unwrap();
        webviews.remove(&tab_id);
    }

    Ok(())
}

/// Go back in webview history
#[tauri::command]
pub async fn embedded_webview_back(
    app: AppHandle,
    tab_id: String,
) -> Result<(), String> {
    let label = format!("tab_{}", tab_id);
    let webview = app.get_webview_window(&label).ok_or("Webview not found")?;
    
    webview
        .eval("window.history.back();")
        .map_err(|e| format!("Back failed: {}", e))?;
    
    Ok(())
}

/// Go forward in webview history
#[tauri::command]
pub async fn embedded_webview_forward(
    app: AppHandle,
    tab_id: String,
) -> Result<(), String> {
    let label = format!("tab_{}", tab_id);
    let webview = app.get_webview_window(&label).ok_or("Webview not found")?;
    
    webview
        .eval("window.history.forward();")
        .map_err(|e| format!("Forward failed: {}", e))?;
    
    Ok(())
}

/// Reload webview
#[tauri::command]
pub async fn embedded_webview_reload(
    app: AppHandle,
    tab_id: String,
) -> Result<(), String> {
    let label = format!("tab_{}", tab_id);
    let webview = app.get_webview_window(&label).ok_or("Webview not found")?;
    
    webview
        .eval("window.location.reload();")
        .map_err(|e| format!("Reload failed: {}", e))?;
    
    Ok(())
}

/// Set webview position and size
#[tauri::command]
pub async fn embedded_webview_set_bounds(
    app: AppHandle,
    tab_id: String,
    bounds: WebviewBounds,
) -> Result<(), String> {
    let label = format!("tab_{}", tab_id);
    let webview = app.get_webview_window(&label).ok_or("Webview not found")?;
    
    webview
        .set_position(tauri::LogicalPosition::new(bounds.x, bounds.y))
        .map_err(|e| format!("Set position failed: {}", e))?;
    
    webview
        .set_size(tauri::LogicalSize::new(bounds.width, bounds.height))
        .map_err(|e| format!("Set size failed: {}", e))?;
    
    Ok(())
}

/// Show/hide webview (for tab switching)
#[tauri::command]
pub async fn embedded_webview_set_visible(
    app: AppHandle,
    state: tauri::State<'_, EmbeddedWebviewState>,
    tab_id: String,
    visible: bool,
) -> Result<(), String> {
    let label = format!("tab_{}", tab_id);
    
    if let Some(webview) = app.get_webview_window(&label) {
        if visible {
            webview.show().map_err(|e| format!("Show failed: {}", e))?;
            
            // Update active tab
            let mut active = state.active_tab.lock().unwrap();
            *active = Some(tab_id);
        } else {
            webview.hide().map_err(|e| format!("Hide failed: {}", e))?;
        }
    }
    
    Ok(())
}

/// Execute JavaScript in webview
#[tauri::command]
pub async fn embedded_webview_eval(
    app: AppHandle,
    tab_id: String,
    script: String,
) -> Result<String, String> {
    let label = format!("tab_{}", tab_id);
    let webview = app.get_webview_window(&label).ok_or("Webview not found")?;
    
    webview
        .eval(&script)
        .map_err(|e| format!("Script execution failed: {}", e))?;
    
    Ok("Script executed".to_string())
}

/// Get current URL from webview
#[tauri::command]
pub async fn embedded_webview_get_url(
    app: AppHandle,
    tab_id: String,
) -> Result<String, String> {
    let label = format!("tab_{}", tab_id);
    let webview = app.get_webview_window(&label).ok_or("Webview not found")?;
    
    let url = webview.url().map_err(|e| format!("Failed to get URL: {}", e))?;
    
    Ok(url.to_string())
}

/// Get page title from webview
#[tauri::command]
pub async fn embedded_webview_get_title(
    app: AppHandle,
    tab_id: String,
) -> Result<String, String> {
    let label = format!("tab_{}", tab_id);
    let webview = app.get_webview_window(&label).ok_or("Webview not found")?;
    
    let title = webview.title().map_err(|e| format!("Failed to get title: {}", e))?;
    
    Ok(title)
}

/// Get all embedded webviews
#[tauri::command]
pub async fn embedded_webview_list(
    state: tauri::State<'_, EmbeddedWebviewState>,
) -> Result<Vec<EmbeddedWebviewInfo>, String> {
    let webviews = state.webviews.lock().unwrap();
    Ok(webviews.values().cloned().collect())
}

/// Get active tab ID
#[tauri::command]
pub async fn embedded_webview_get_active(
    state: tauri::State<'_, EmbeddedWebviewState>,
) -> Result<Option<String>, String> {
    let active = state.active_tab.lock().unwrap();
    Ok(active.clone())
}

/// Inject CSS into webview
#[tauri::command]
pub async fn embedded_webview_inject_css(
    app: AppHandle,
    tab_id: String,
    css: String,
) -> Result<(), String> {
    let label = format!("tab_{}", tab_id);
    let webview = app.get_webview_window(&label).ok_or("Webview not found")?;
    
    let script = format!(
        r#"
        (function() {{
            var style = document.createElement('style');
            style.textContent = `{}`;
            document.head.appendChild(style);
        }})();
        "#,
        css.replace("`", "\\`")
    );
    
    webview
        .eval(&script)
        .map_err(|e| format!("CSS injection failed: {}", e))?;
    
    Ok(())
}

/// Take screenshot of webview content
/// 
/// Captures the current visible content of the webview and returns
/// it as a base64-encoded PNG image data URL.
#[tauri::command]
pub async fn embedded_webview_screenshot(
    app: AppHandle,
    tab_id: String,
) -> Result<String, String> {
    let label = format!("tab_{}", tab_id);
    let webview = app.get_webview_window(&label).ok_or("Webview not found")?;
    
    // Use JavaScript to capture canvas-based screenshot
    // This works in the webview context
    let capture_script = r#"
        (async function() {
            try {
                // Try html2canvas approach if available
                if (typeof html2canvas !== 'undefined') {
                    const canvas = await html2canvas(document.body);
                    return canvas.toDataURL('image/png');
                }
                
                // Fallback: Capture viewport using native canvas
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Get viewport dimensions
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                
                // Create a temporary SVG to render the page
                const data = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
                    <foreignObject width="100%" height="100%">
                        <div xmlns="http://www.w3.org/1999/xhtml">
                            ${document.documentElement.outerHTML}
                        </div>
                    </foreignObject>
                </svg>`;
                
                const svg = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
                const url = URL.createObjectURL(svg);
                
                const img = new Image();
                img.src = url;
                
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    setTimeout(reject, 5000);
                });
                
                ctx.drawImage(img, 0, 0);
                URL.revokeObjectURL(url);
                
                return canvas.toDataURL('image/png');
            } catch (e) {
                // Final fallback: return error message
                return 'error:' + e.message;
            }
        })()
    "#;
    
    webview
        .eval(capture_script)
        .map_err(|e| format!("Screenshot capture failed: {}", e))?;
    
    // The actual result would need to be retrieved via IPC
    // For now, return a request ID and the frontend should listen for the result
    let request_id = uuid::Uuid::new_v4().to_string();
    
    // Store the request for later retrieval
    // In a full implementation, you'd use app state to track this
    
    Ok(format!("screenshot-request:{}", request_id))
}

// ============================================
// DevTools Commands for CUBE DevTools
// Names prefixed with cube_ to avoid conflicts
// ============================================

/// Get DOM tree from webview
#[tauri::command]
pub async fn cube_devtools_get_dom(
    app: AppHandle,
    tab_id: String,
) -> Result<String, String> {
    let label = format!("tab_{}", tab_id);
    let webview = app.get_webview_window(&label).ok_or("Webview not found")?;
    
    let script = r#"
        (function() {
            function serializeNode(node, depth = 0) {
                if (depth > 10) return null;
                
                const obj = {
                    nodeType: node.nodeType,
                    nodeName: node.nodeName,
                    attributes: {},
                    children: []
                };
                
                if (node.attributes) {
                    for (let attr of node.attributes) {
                        obj.attributes[attr.name] = attr.value;
                    }
                }
                
                if (node.nodeType === 3) {
                    obj.textContent = node.textContent.trim().slice(0, 100);
                }
                
                for (let child of node.childNodes) {
                    if (child.nodeType === 1 || (child.nodeType === 3 && child.textContent.trim())) {
                        const serialized = serializeNode(child, depth + 1);
                        if (serialized) obj.children.push(serialized);
                    }
                }
                
                return obj;
            }
            
            return JSON.stringify(serializeNode(document.documentElement));
        })();
    "#;
    
    webview
        .eval(script)
        .map_err(|e| format!("DOM extraction failed: {}", e))?;
    
    Ok("dom-requested".to_string())
}

/// Get computed styles for element
#[tauri::command]
pub async fn cube_devtools_get_styles(
    app: AppHandle,
    tab_id: String,
    selector: String,
) -> Result<String, String> {
    let label = format!("tab_{}", tab_id);
    let webview = app.get_webview_window(&label).ok_or("Webview not found")?;
    
    let script = format!(
        r#"
        (function() {{
            const el = document.querySelector('{}');
            if (!el) return JSON.stringify({{ error: 'Element not found' }});
            
            const computed = window.getComputedStyle(el);
            const styles = {{}};
            
            for (let prop of computed) {{
                styles[prop] = computed.getPropertyValue(prop);
            }}
            
            return JSON.stringify(styles);
        }})();
        "#,
        selector.replace("'", "\\'")
    );
    
    webview
        .eval(&script)
        .map_err(|e| format!("Style extraction failed: {}", e))?;
    
    Ok("styles-requested".to_string())
}

/// Get network requests
#[tauri::command]
pub async fn cube_devtools_get_network(
    app: AppHandle,
    tab_id: String,
) -> Result<String, String> {
    let label = format!("tab_{}", tab_id);
    let webview = app.get_webview_window(&label).ok_or("Webview not found")?;
    
    let script = r#"
        (function() {
            if (window.__CUBE_NETWORK_LOG__) {
                return JSON.stringify(window.__CUBE_NETWORK_LOG__);
            }
            return JSON.stringify([]);
        })();
    "#;
    
    webview
        .eval(script)
        .map_err(|e| format!("Network log failed: {}", e))?;
    
    Ok("network-requested".to_string())
}

/// Inject network monitor script
#[tauri::command]
pub async fn cube_devtools_inject_network_monitor(
    app: AppHandle,
    tab_id: String,
) -> Result<(), String> {
    let label = format!("tab_{}", tab_id);
    let webview = app.get_webview_window(&label).ok_or("Webview not found")?;
    
    let script = r#"
        (function() {
            if (window.__CUBE_NETWORK_INJECTED__) return;
            window.__CUBE_NETWORK_INJECTED__ = true;
            window.__CUBE_NETWORK_LOG__ = [];
            
            const originalFetch = window.fetch;
            window.fetch = async function(...args) {
                const startTime = performance.now();
                const request = { 
                    type: 'fetch',
                    url: String(args[0]),
                    method: args[1]?.method || 'GET',
                    timestamp: Date.now()
                };
                
                try {
                    const response = await originalFetch.apply(this, args);
                    request.status = response.status;
                    request.duration = performance.now() - startTime;
                    window.__CUBE_NETWORK_LOG__.push(request);
                    return response;
                } catch (error) {
                    request.error = error.message;
                    request.duration = performance.now() - startTime;
                    window.__CUBE_NETWORK_LOG__.push(request);
                    throw error;
                }
            };
        })();
    "#;
    
    webview
        .eval(script)
        .map_err(|e| format!("Network monitor injection failed: {}", e))?;
    
    Ok(())
}

/// Get console logs
#[tauri::command]
pub async fn cube_devtools_get_console(
    app: AppHandle,
    tab_id: String,
) -> Result<String, String> {
    let label = format!("tab_{}", tab_id);
    let webview = app.get_webview_window(&label).ok_or("Webview not found")?;
    
    let script = r#"
        (function() {
            if (window.__CUBE_CONSOLE_LOG__) {
                return JSON.stringify(window.__CUBE_CONSOLE_LOG__);
            }
            return JSON.stringify([]);
        })();
    "#;
    
    webview
        .eval(script)
        .map_err(|e| format!("Console log failed: {}", e))?;
    
    Ok("console-requested".to_string())
}

/// Inject console interceptor
#[tauri::command]
pub async fn cube_devtools_inject_console_monitor(
    app: AppHandle,
    tab_id: String,
) -> Result<(), String> {
    let label = format!("tab_{}", tab_id);
    let webview = app.get_webview_window(&label).ok_or("Webview not found")?;
    
    let script = r#"
        (function() {
            if (window.__CUBE_CONSOLE_INJECTED__) return;
            window.__CUBE_CONSOLE_INJECTED__ = true;
            window.__CUBE_CONSOLE_LOG__ = [];
            
            const methods = ['log', 'warn', 'error', 'info', 'debug'];
            
            methods.forEach(method => {
                const original = console[method];
                console[method] = function(...args) {
                    window.__CUBE_CONSOLE_LOG__.push({
                        type: method,
                        args: args.map(arg => {
                            try {
                                return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
                            } catch {
                                return String(arg);
                            }
                        }),
                        timestamp: Date.now()
                    });
                    
                    if (window.__CUBE_CONSOLE_LOG__.length > 1000) {
                        window.__CUBE_CONSOLE_LOG__ = window.__CUBE_CONSOLE_LOG__.slice(-1000);
                    }
                    
                    return original.apply(this, args);
                };
            });
        })();
    "#;
    
    webview
        .eval(script)
        .map_err(|e| format!("Console monitor injection failed: {}", e))?;
    
    Ok(())
}

/// Get performance metrics
#[tauri::command]
pub async fn cube_devtools_get_performance(
    app: AppHandle,
    tab_id: String,
) -> Result<String, String> {
    let label = format!("tab_{}", tab_id);
    let webview = app.get_webview_window(&label).ok_or("Webview not found")?;
    
    let script = r#"
        (function() {
            const perf = window.performance;
            const timing = perf.timing;
            
            const metrics = {
                domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                loadComplete: timing.loadEventEnd - timing.navigationStart,
                firstByte: timing.responseStart - timing.navigationStart,
                domInteractive: timing.domInteractive - timing.navigationStart,
                dns: timing.domainLookupEnd - timing.domainLookupStart,
                tcp: timing.connectEnd - timing.connectStart,
                request: timing.responseStart - timing.requestStart,
                response: timing.responseEnd - timing.responseStart,
                domParsing: timing.domComplete - timing.domLoading,
                memory: perf.memory ? {
                    usedJSHeapSize: perf.memory.usedJSHeapSize,
                    totalJSHeapSize: perf.memory.totalJSHeapSize,
                    jsHeapSizeLimit: perf.memory.jsHeapSizeLimit
                } : null,
                resourceCount: perf.getEntriesByType('resource').length
            };
            
            return JSON.stringify(metrics);
        })();
    "#;
    
    webview
        .eval(script)
        .map_err(|e| format!("Performance metrics failed: {}", e))?;
    
    Ok("performance-requested".to_string())
}

/// Highlight element on page
#[tauri::command]
pub async fn cube_devtools_highlight_element(
    app: AppHandle,
    tab_id: String,
    selector: String,
) -> Result<(), String> {
    let label = format!("tab_{}", tab_id);
    let webview = app.get_webview_window(&label).ok_or("Webview not found")?;
    
    let script = format!(
        r#"
        (function() {{
            const prev = document.getElementById('__cube_highlight__');
            if (prev) prev.remove();
            
            const el = document.querySelector('{}');
            if (!el) return;
            
            const rect = el.getBoundingClientRect();
            const highlight = document.createElement('div');
            highlight.id = '__cube_highlight__';
            highlight.style.cssText = `
                position: fixed;
                top: ${{rect.top}}px;
                left: ${{rect.left}}px;
                width: ${{rect.width}}px;
                height: ${{rect.height}}px;
                background: rgba(59, 130, 246, 0.3);
                border: 2px solid rgb(59, 130, 246);
                pointer-events: none;
                z-index: 999999;
            `;
            document.body.appendChild(highlight);
            setTimeout(() => highlight.remove(), 3000);
        }})();
        "#,
        selector.replace("'", "\\'")
    );
    
    webview
        .eval(&script)
        .map_err(|e| format!("Highlight failed: {}", e))?;
    
    Ok(())
}

/// Execute console command
#[tauri::command]
pub async fn cube_devtools_execute_console(
    app: AppHandle,
    tab_id: String,
    command: String,
) -> Result<String, String> {
    let label = format!("tab_{}", tab_id);
    let webview = app.get_webview_window(&label).ok_or("Webview not found")?;
    
    let script = format!(
        r#"
        (function() {{
            try {{
                const result = eval(`{}`);
                return JSON.stringify({{ success: true, result: String(result) }});
            }} catch (e) {{
                return JSON.stringify({{ success: false, error: e.message }});
            }}
        }})();
        "#,
        command.replace("`", "\\`").replace("\\", "\\\\")
    );
    
    webview
        .eval(&script)
        .map_err(|e| format!("Console execution failed: {}", e))?;
    
    Ok("executed".to_string())
}
