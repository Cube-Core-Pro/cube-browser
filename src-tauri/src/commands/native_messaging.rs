// Native Messaging Commands - Chrome Extension Bridge
// CUBE Elite v2.0 - FASE 1 Implementation

use crate::services::native_messaging_bridge::{
    BrowserAutomationHandler, NativeMessage, NativeMessagingBridge, NativeResponse, PingHandler,
    TauriCommandHandler,
};
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;

pub struct NativeMessagingState {
    pub bridge: Arc<Mutex<Option<NativeMessagingBridge>>>,
}

impl NativeMessagingState {
    pub fn new() -> Self {
        Self {
            bridge: Arc::new(Mutex::new(None)),
        }
    }
}

/// Initialize Native Messaging Bridge
#[tauri::command]
pub async fn native_messaging_init(
    app_handle: tauri::AppHandle,
    state: State<'_, NativeMessagingState>,
) -> Result<String, String> {
    let mut bridge_lock = state.bridge.lock().await;

    if bridge_lock.is_some() {
        return Ok("Native Messaging Bridge already initialized".to_string());
    }

    let bridge = NativeMessagingBridge::new();

    // Register built-in handlers
    bridge.register_handler(Box::new(PingHandler)).await;
    bridge
        .register_handler(Box::new(TauriCommandHandler {
            app_handle: app_handle.clone(),
        }))
        .await;
    bridge
        .register_handler(Box::new(BrowserAutomationHandler))
        .await;

    *bridge_lock = Some(bridge);

    tracing::info!("✅ Native Messaging Bridge initialized");
    Ok("Native Messaging Bridge initialized successfully".to_string())
}

/// Start Native Messaging Bridge (blocking, run in separate thread)
/// NOTE: This is a placeholder. In production, the bridge should run
/// as a separate native messaging host process invoked by Chrome Extension
#[tauri::command]
pub async fn native_messaging_start(
    _state: State<'_, NativeMessagingState>,
) -> Result<String, String> {
    // In production, Chrome Extension will launch the native messaging host
    // as a separate process. This is just a marker that the bridge is configured.
    tracing::info!("📡 Native Messaging Bridge is ready for Chrome Extension connections");
    Ok(
        "Native Messaging Bridge configured. Chrome Extension will connect when needed."
            .to_string(),
    )
}

/// Send a message to Chrome Extension (for testing)
#[tauri::command]
pub async fn native_messaging_send(message: NativeMessage) -> Result<NativeResponse, String> {
    tracing::debug!("📤 Sending message: {:?}", message);

    NativeMessagingBridge::write_message(&NativeResponse {
        success: true,
        data: Some(serde_json::json!({
            "sent": true,
            "message": message,
        })),
        error: None,
        id: message.id.clone(),
    })
    .map_err(|e| format!("Failed to send message: {}", e))?;

    Ok(NativeResponse {
        success: true,
        data: Some(serde_json::json!({"sent": true})),
        error: None,
        id: message.id,
    })
}

/// Test Native Messaging connection
#[tauri::command]
pub async fn native_messaging_test(
    state: State<'_, NativeMessagingState>,
) -> Result<String, String> {
    let bridge_lock = state.bridge.lock().await;

    if bridge_lock.is_none() {
        return Err("Native Messaging Bridge not initialized".to_string());
    }

    Ok("Native Messaging Bridge is ready".to_string())
}

/// Get Native Messaging status
#[tauri::command]
pub async fn native_messaging_status(
    state: State<'_, NativeMessagingState>,
) -> Result<serde_json::Value, String> {
    let bridge_lock = state.bridge.lock().await;

    Ok(serde_json::json!({
        "initialized": bridge_lock.is_some(),
        "version": "2.0.0",
        "protocol": "chrome.runtime.connectNative",
        "handlers": ["ping", "tauri_command", "browser_automation"],
    }))
}

/// Process a single native message (for manual testing)
#[tauri::command]
pub async fn native_messaging_process(
    message: NativeMessage,
    state: State<'_, NativeMessagingState>,
) -> Result<NativeResponse, String> {
    let bridge_lock = state.bridge.lock().await;
    let bridge = bridge_lock
        .as_ref()
        .ok_or("Native Messaging Bridge not initialized")?;

    Ok(bridge.process_message(message).await)
}
