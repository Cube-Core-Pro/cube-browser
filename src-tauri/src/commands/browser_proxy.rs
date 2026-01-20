// Browser Proxy Commands - Control the local proxy server for browsing
// This allows the browser to load any website by proxying through localhost

use tauri::State;
use crate::services::browser_proxy::{BrowserProxyState, start_proxy_server, stop_proxy_server};

/// Start the browser proxy server
#[tauri::command]
pub async fn browser_proxy_start(
    state: State<'_, BrowserProxyState>,
    port: Option<u16>,
) -> Result<u16, String> {
    let port = port.unwrap_or(9876);
    
    // Check if already running
    {
        let running = state.running.lock().unwrap();
        if *running {
            let current_port = *state.port.lock().unwrap();
            return Ok(current_port);
        }
    }

    // Start the proxy server
    let shutdown_tx = start_proxy_server(port).await?;

    // Update state
    {
        let mut running = state.running.lock().unwrap();
        *running = true;
    }
    {
        let mut saved_port = state.port.lock().unwrap();
        *saved_port = port;
    }
    {
        let mut tx = state.shutdown_tx.lock().unwrap();
        *tx = Some(shutdown_tx);
    }

    println!("✅ [BROWSER] Proxy server started on port {}", port);
    Ok(port)
}

/// Stop the browser proxy server
#[tauri::command]
pub async fn browser_proxy_stop(
    state: State<'_, BrowserProxyState>,
) -> Result<(), String> {
    let shutdown_tx = {
        let mut tx = state.shutdown_tx.lock().unwrap();
        tx.take()
    };

    if let Some(tx) = shutdown_tx {
        stop_proxy_server(tx).await?;
    }

    // Update state
    {
        let mut running = state.running.lock().unwrap();
        *running = false;
    }

    println!("🛑 [BROWSER] Proxy server stopped");
    Ok(())
}

/// Check if proxy is running
#[tauri::command]
pub async fn browser_proxy_status(
    state: State<'_, BrowserProxyState>,
) -> Result<BrowserProxyStatus, String> {
    let running = *state.running.lock().unwrap();
    let port = *state.port.lock().unwrap();
    
    Ok(BrowserProxyStatus {
        running,
        port,
        proxy_url: if running {
            Some(format!("http://127.0.0.1:{}/proxy", port))
        } else {
            None
        },
    })
}

/// Get the proxy URL for a target URL
#[tauri::command]
pub async fn browser_proxy_get_url(
    state: State<'_, BrowserProxyState>,
    target_url: String,
) -> Result<String, String> {
    let running = *state.running.lock().unwrap();
    if !running {
        return Err("Proxy server not running. Call browser_proxy_start first.".to_string());
    }
    
    let port = *state.port.lock().unwrap();
    let encoded_url = urlencoding::encode(&target_url);
    
    Ok(format!("http://127.0.0.1:{}/proxy?url={}", port, encoded_url))
}

#[derive(serde::Serialize)]
pub struct BrowserProxyStatus {
    pub running: bool,
    pub port: u16,
    pub proxy_url: Option<String>,
}
