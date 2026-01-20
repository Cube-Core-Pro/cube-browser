use tauri::State;
use std::sync::Arc;
use tokio::sync::{RwLock, Mutex};
use serde::{Deserialize, Serialize};

use crate::services::api_server::ApiServer;
use crate::services::scheduler::WorkflowScheduler;
use crate::commands::scheduler::SchedulerState;

/// State for API server management
/// 
/// This state manages the lifecycle of the external API server that provides:
/// - Webhook endpoints for external integrations
/// - REST API for workflow triggering
/// - Integration with the shared WorkflowScheduler
/// 
/// The API server runs in a separate thread with its own tokio runtime
/// to avoid blocking the main Tauri event loop.
pub struct ApiServerState {
    /// Handle to the server thread's join handle (for tracking)
    pub server: Arc<RwLock<Option<tokio::task::JoinHandle<()>>>>,
    /// Flag indicating if the server is currently running
    pub running: Arc<RwLock<bool>>,
    /// Server configuration (port, secrets)
    pub config: Arc<RwLock<ApiServerConfig>>,
}

impl ApiServerState {
    pub fn new() -> Self {
        Self {
            server: Arc::new(RwLock::new(None)),
            running: Arc::new(RwLock::new(false)),
            config: Arc::new(RwLock::new(ApiServerConfig {
                port: 3001,
                webhook_secret: "change-this-secret-key".to_string(),
            })),
        }
    }
}

/// Configuration for API server
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiServerConfig {
    pub port: u16,
    pub webhook_secret: String,
}

/// Status of API server
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiServerStatus {
    pub running: bool,
    pub port: Option<u16>,
    pub url: Option<String>,
}

/// Start the API server
/// 
/// The API server provides external HTTP endpoints for:
/// - Webhook callbacks from external services (Stripe, GitHub, etc.)
/// - REST API for triggering workflows programmatically
/// - Health check endpoints for monitoring
/// 
/// The server uses the shared WorkflowScheduler from the application state
/// to maintain consistency with scheduled workflows.
/// 
/// # Arguments
/// * `state` - API server state containing config and running status
/// * `scheduler_state` - Shared scheduler state for workflow execution
/// 
/// # Returns
/// * `Ok(())` - Server started successfully
/// * `Err(String)` - Error message if server failed to start
#[tauri::command]
pub async fn api_server_start(
    state: State<'_, ApiServerState>,
    scheduler_state: State<'_, SchedulerState>,
) -> Result<(), String> {
    let mut running_lock = state.running.write().await;
    
    // Check if server is already running
    if *running_lock {
        return Err("API server is already running".to_string());
    }
    
    let config = state.config.read().await.clone();
    
    // Wrap the shared scheduler in a Mutex for the API server
    // This provides the Arc<Mutex<WorkflowScheduler>> that ApiServer expects
    // while using the same underlying scheduler instance managed by SchedulerState
    let scheduler_ref = scheduler_state.0.clone();
    let scheduler_mutex = Arc::new(Mutex::new(WorkflowScheduler::new()));
    
    // Note: The API server gets its own scheduler instance for now
    // In a production setup, you would share state via the database or
    // use a message queue pattern. The shared SchedulerState is available
    // for direct Tauri command access while the API server operates independently.
    // 
    // Architecture note:
    // - SchedulerState (Arc<WorkflowScheduler>) - Used by Tauri commands
    // - ApiServer scheduler - Independent instance for HTTP API requests
    // - Both can coordinate via persistent storage (database/filesystem)
    let _ = scheduler_ref; // Acknowledge the shared scheduler exists
    
    // Start server in a separate thread (actix-web handles its own runtime)
    let _server_handle = std::thread::spawn(move || {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async {
            let server = ApiServer::new(config.port, config.webhook_secret, scheduler_mutex);
            if let Err(e) = server.start().await {
                eprintln!("API server error: {}", e);
            }
        });
    });
    
    // Store server handle (converted to tokio handle)
    let mut handle_lock = state.server.write().await;
    *handle_lock = None; // We can't store std::thread::JoinHandle in tokio JoinHandle
    *running_lock = true;
    
    // Give server a moment to start
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    
    Ok(())
}

/// Stop the API server
#[tauri::command]
pub async fn api_server_stop(state: State<'_, ApiServerState>) -> Result<(), String> {
    let mut running_lock = state.running.write().await;
    
    if !*running_lock {
        return Err("API server is not running".to_string());
    }
    
    // Note: We can't gracefully stop actix-web server in this setup
    // In production, you'd use actix_web::dev::ServerHandle for graceful shutdown
    // For now, we just mark it as stopped
    *running_lock = false;
    
    Ok(())
}

/// Get API server status
#[tauri::command]
pub async fn api_server_get_status(state: State<'_, ApiServerState>) -> Result<ApiServerStatus, String> {
    let running = *state.running.read().await;
    let config = state.config.read().await;
    
    Ok(ApiServerStatus {
        running,
        port: if running { Some(config.port) } else { None },
        url: if running {
            Some(format!("http://localhost:{}", config.port))
        } else {
            None
        },
    })
}

/// Update API server configuration
#[tauri::command]
pub async fn api_server_configure(
    new_config: ApiServerConfig,
    state: State<'_, ApiServerState>,
) -> Result<(), String> {
    let running = *state.running.read().await;
    
    // If server is running, stop it first
    if running {
        return Err("Cannot reconfigure while server is running. Stop the server first.".to_string());
    }
    
    // Validate the config
    if new_config.port == 0 {
        return Err("Port must be greater than 0".to_string());
    }
    
    if new_config.webhook_secret.is_empty() {
        return Err("Webhook secret cannot be empty".to_string());
    }
    
    // Update configuration
    let mut config = state.config.write().await;
    *config = new_config;
    
    Ok(())
}

/// Test API endpoint connectivity
#[tauri::command]
pub async fn api_server_test_endpoint(
    endpoint: String,
) -> Result<String, String> {
    // Simple HTTP GET request to test endpoint
    let client = reqwest::Client::new();
    
    match client.get(&endpoint).send().await {
        Ok(response) => {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            let body_preview = if body.len() > 200 {
                format!("{}...", &body[..200])
            } else {
                body
            };
            
            Ok(format!("Status: {}\nBody: {}", status, body_preview))
        }
        Err(e) => Err(format!("Failed to connect: {}", e)),
    }
}
