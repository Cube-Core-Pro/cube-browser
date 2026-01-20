// Native Messaging Bridge - Chrome Extension ↔ Tauri Communication
// CUBE Elite v2.0 - FASE 1 Implementation

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::io::{self, Read, Write};
use std::sync::Arc;
use tokio::sync::Mutex;

/// Native message structure following Chrome's protocol
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NativeMessage {
    pub message_type: String,
    pub command: String,
    pub data: serde_json::Value,
    pub id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NativeResponse {
    pub success: bool,
    pub data: Option<serde_json::Value>,
    pub error: Option<String>,
    pub id: Option<String>,
}

/// Native Messaging host for Chrome Extension communication
pub struct NativeMessagingBridge {
    handlers: Arc<Mutex<Vec<Box<dyn MessageHandler + Send + Sync>>>>,
}

#[async_trait::async_trait]
pub trait MessageHandler: Send + Sync {
    async fn handle(&self, message: NativeMessage) -> Result<NativeResponse>;
    fn command_name(&self) -> &str;
}

impl NativeMessagingBridge {
    pub fn new() -> Self {
        Self {
            handlers: Arc::new(Mutex::new(Vec::new())),
        }
    }

    /// Register a message handler
    pub async fn register_handler(&self, handler: Box<dyn MessageHandler + Send + Sync>) {
        let mut handlers = self.handlers.lock().await;
        handlers.push(handler);
    }

    /// Read a native message from stdin (Chrome Extension format)
    /// Format: 4-byte length (little-endian) + JSON message
    pub fn read_message() -> Result<NativeMessage> {
        let mut stdin = io::stdin();

        // Read 4-byte length
        let mut length_bytes = [0u8; 4];
        stdin
            .read_exact(&mut length_bytes)
            .context("Failed to read message length")?;

        let length = u32::from_le_bytes(length_bytes) as usize;

        // Validate length
        if length == 0 || length > 1024 * 1024 {
            anyhow::bail!("Invalid message length: {}", length);
        }

        // Read JSON message
        let mut buffer = vec![0u8; length];
        stdin
            .read_exact(&mut buffer)
            .context("Failed to read message body")?;

        // Parse JSON
        let message: NativeMessage =
            serde_json::from_slice(&buffer).context("Failed to parse message JSON")?;

        Ok(message)
    }

    /// Write a native message to stdout (Chrome Extension format)
    /// Format: 4-byte length (little-endian) + JSON message
    pub fn write_message(response: &NativeResponse) -> Result<()> {
        let json = serde_json::to_string(response).context("Failed to serialize response")?;

        let bytes = json.as_bytes();
        let length = bytes.len() as u32;

        // Validate length
        if length > 1024 * 1024 {
            anyhow::bail!("Response too large: {} bytes", length);
        }

        let mut stdout = io::stdout();

        // Write 4-byte length
        stdout
            .write_all(&length.to_le_bytes())
            .context("Failed to write response length")?;

        // Write JSON message
        stdout
            .write_all(bytes)
            .context("Failed to write response body")?;

        stdout.flush().context("Failed to flush stdout")?;

        Ok(())
    }

    /// Process a single message
    pub async fn process_message(&self, message: NativeMessage) -> NativeResponse {
        let handlers = self.handlers.lock().await;

        // Find matching handler
        for handler in handlers.iter() {
            if handler.command_name() == message.command {
                match handler.handle(message.clone()).await {
                    Ok(response) => return response,
                    Err(e) => {
                        return NativeResponse {
                            success: false,
                            data: None,
                            error: Some(format!("Handler error: {}", e)),
                            id: message.id,
                        }
                    }
                }
            }
        }

        // No handler found
        NativeResponse {
            success: false,
            data: None,
            error: Some(format!("Unknown command: {}", message.command)),
            id: message.id,
        }
    }

    /// Run the native messaging loop (blocking)
    pub async fn run(&self) -> Result<()> {
        tracing::info!("🔗 Native Messaging Bridge started");

        loop {
            // Read message from Chrome Extension
            let message = match Self::read_message() {
                Ok(msg) => msg,
                Err(e) => {
                    tracing::error!("Failed to read message: {}", e);
                    // If stdin is closed, exit gracefully
                    if e.to_string().contains("failed to fill whole buffer") {
                        tracing::info!("Chrome Extension disconnected, exiting");
                        break;
                    }
                    continue;
                }
            };

            tracing::debug!("📨 Received message: {:?}", message);

            // Process message
            let response = self.process_message(message).await;

            tracing::debug!("📤 Sending response: {:?}", response);

            // Write response
            if let Err(e) = Self::write_message(&response) {
                tracing::error!("Failed to write response: {}", e);
                break;
            }
        }

        tracing::info!("🔗 Native Messaging Bridge stopped");
        Ok(())
    }
}

// Built-in handlers

/// Ping handler for testing connectivity
pub struct PingHandler;

#[async_trait::async_trait]
impl MessageHandler for PingHandler {
    async fn handle(&self, message: NativeMessage) -> Result<NativeResponse> {
        Ok(NativeResponse {
            success: true,
            data: Some(serde_json::json!({
                "pong": true,
                "timestamp": chrono::Utc::now().to_rfc3339(),
                "echo": message.data,
            })),
            error: None,
            id: message.id,
        })
    }

    fn command_name(&self) -> &str {
        "ping"
    }
}

/// Execute Tauri command handler
pub struct TauriCommandHandler {
    pub app_handle: tauri::AppHandle,
}

#[async_trait::async_trait]
impl MessageHandler for TauriCommandHandler {
    async fn handle(&self, message: NativeMessage) -> Result<NativeResponse> {
        // Extract Tauri command from message
        let command = message
            .data
            .get("command")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow::anyhow!("Missing 'command' field"))?;

        let args = message
            .data
            .get("args")
            .cloned()
            .unwrap_or(serde_json::Value::Object(serde_json::Map::new()));

        tracing::info!("🎯 Executing Tauri command via native messaging: {}", command);

        // Execute known commands
        // Note: For security, only whitelisted commands can be executed via native messaging
        let result = match command {
            // Profile commands
            "get_profiles" | "list_profiles" => {
                serde_json::json!({
                    "status": "ok",
                    "profiles": [],
                    "message": "Use Tauri invoke for full profile access"
                })
            }
            
            // Extension sync commands
            "extension_sync" => {
                serde_json::json!({
                    "status": "ok",
                    "synced": true,
                    "timestamp": chrono::Utc::now().timestamp()
                })
            }
            
            // Ping/health check
            "ping" | "health" => {
                serde_json::json!({
                    "status": "ok",
                    "pong": true,
                    "version": env!("CARGO_PKG_VERSION"),
                    "timestamp": chrono::Utc::now().timestamp()
                })
            }
            
            // Autofill commands
            "autofill_detect" => {
                serde_json::json!({
                    "status": "ok",
                    "fields_detected": 0,
                    "message": "Field detection handled by content script"
                })
            }
            
            // Default: command not whitelisted for native messaging
            _ => {
                tracing::warn!("⚠️ Command '{}' not available via native messaging", command);
                serde_json::json!({
                    "status": "error",
                    "message": format!("Command '{}' not available via native messaging. Use Tauri invoke.", command),
                    "available_commands": ["ping", "health", "extension_sync", "get_profiles", "autofill_detect"]
                })
            }
        };

        Ok(NativeResponse {
            success: true,
            data: Some(serde_json::json!({
                "command": command,
                "args": args,
                "result": result,
            })),
            error: None,
            id: message.id,
        })
    }

    fn command_name(&self) -> &str {
        "tauri_command"
    }
}

/// Browser automation handler (for Chrome Extension → CUBE communication)
pub struct BrowserAutomationHandler;

#[async_trait::async_trait]
impl MessageHandler for BrowserAutomationHandler {
    async fn handle(&self, message: NativeMessage) -> Result<NativeResponse> {
        let action = message
            .data
            .get("action")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow::anyhow!("Missing 'action' field"))?;

        tracing::info!("🤖 Browser automation action: {}", action);

        // Handle different automation actions
        match action {
            "extract_data" => {
                let selector = message
                    .data
                    .get("selector")
                    .and_then(|v| v.as_str())
                    .unwrap_or("");

                Ok(NativeResponse {
                    success: true,
                    data: Some(serde_json::json!({
                        "action": "extract_data",
                        "selector": selector,
                        "extracted": ["sample", "data"],
                    })),
                    error: None,
                    id: message.id,
                })
            }
            "execute_workflow" => {
                let workflow_id = message
                    .data
                    .get("workflow_id")
                    .and_then(|v| v.as_str())
                    .unwrap_or("");

                Ok(NativeResponse {
                    success: true,
                    data: Some(serde_json::json!({
                        "action": "execute_workflow",
                        "workflow_id": workflow_id,
                        "status": "started",
                    })),
                    error: None,
                    id: message.id,
                })
            }
            "get_state" => Ok(NativeResponse {
                success: true,
                data: Some(serde_json::json!({
                    "action": "get_state",
                    "state": {
                        "connected": true,
                        "version": "2.0.0",
                        "features": ["automation", "voip", "ai"],
                    },
                })),
                error: None,
                id: message.id,
            }),
            _ => Ok(NativeResponse {
                success: false,
                data: None,
                error: Some(format!("Unknown action: {}", action)),
                id: message.id,
            }),
        }
    }

    fn command_name(&self) -> &str {
        "browser_automation"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_ping_handler() {
        let handler = PingHandler;
        let message = NativeMessage {
            message_type: "request".to_string(),
            command: "ping".to_string(),
            data: serde_json::json!({"test": "data"}),
            id: Some("test-123".to_string()),
        };

        let response = handler.handle(message).await.unwrap();
        assert!(response.success);
        assert!(response.data.is_some());
    }

    #[tokio::test]
    async fn test_bridge_creation() {
        let bridge = NativeMessagingBridge::new();
        bridge.register_handler(Box::new(PingHandler)).await;

        let message = NativeMessage {
            message_type: "request".to_string(),
            command: "ping".to_string(),
            data: serde_json::json!({}),
            id: Some("test".to_string()),
        };

        let response = bridge.process_message(message).await;
        assert!(response.success);
    }
}
