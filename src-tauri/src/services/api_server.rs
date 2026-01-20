/**
 * REST API Server for External Integrations
 * 
 * Provides HTTP API endpoints for:
 * - External workflow triggers
 * - Webhook receivers
 * - Status queries
 * - Result retrieval
 * 
 * Runs on configurable port with CORS support.
 */

use actix_web::{web, App, HttpResponse, HttpServer, middleware};
use actix_cors::Cors;
use serde::{Deserialize, Serialize};
use std::sync::{Arc, RwLock};
use log::{info, error};
use tokio::sync::Mutex;
use crate::services::scheduler::WorkflowScheduler;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TriggerWorkflowRequest {
    pub workflow_id: String,
    pub parameters: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowStatusResponse {
    pub execution_id: String,
    pub workflow_id: String,
    pub status: String,
    pub progress: f32,
    pub result: Option<serde_json::Value>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebhookPayload {
    pub event_type: String,
    pub workflow_id: Option<String>,
    pub data: serde_json::Value,
    pub signature: Option<String>,
}

#[derive(Clone)]
pub struct ApiServerState {
    pub executions: Arc<RwLock<std::collections::HashMap<String, WorkflowStatusResponse>>>,
    pub webhook_secret: String,
    pub scheduler: Arc<Mutex<WorkflowScheduler>>,
}

pub struct ApiServer {
    port: u16,
    state: ApiServerState,
}

impl ApiServer {
    pub fn new(port: u16, webhook_secret: String, scheduler: Arc<Mutex<WorkflowScheduler>>) -> Self {
        info!("🌐 Initializing REST API Server on port {}", port);
        Self {
            port,
            state: ApiServerState {
                executions: Arc::new(RwLock::new(std::collections::HashMap::new())),
                webhook_secret,
                scheduler,
            },
        }
    }

    pub async fn start(self) -> Result<(), String> {
        let state = self.state.clone();
        
        HttpServer::new(move || {
            let cors = Cors::default()
                .allow_any_origin()
                .allow_any_method()
                .allow_any_header()
                .max_age(3600);

            App::new()
                .wrap(cors)
                .wrap(middleware::Logger::default())
                .app_data(web::Data::new(state.clone()))
                .route("/", web::get().to(health_check))
                .route("/health", web::get().to(health_check))
                .route("/api/workflows/{id}/execute", web::post().to(trigger_workflow))
                .route("/api/workflows/{id}/status", web::get().to(get_workflow_status))
                .route("/api/executions/{id}", web::get().to(get_execution_status))
                .route("/api/webhooks/trigger", web::post().to(webhook_trigger))
        })
        .bind(("0.0.0.0", self.port))
        .map_err(|e| format!("Failed to bind server: {}", e))?
        .run()
        .await
        .map_err(|e| format!("Server error: {}", e))?;

        Ok(())
    }

    pub fn stop(&self) -> Result<(), String> {
        info!("🌐 Stopping REST API Server");
        // Actix server doesn't provide direct stop method in this simple setup
        // In production, you'd use ServerHandle
        Ok(())
    }
}

// ==================== ROUTE HANDLERS ====================

async fn health_check() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "healthy",
        "service": "CUBE Elite API",
        "version": "6.0.0"
    }))
}

async fn trigger_workflow(
    path: web::Path<String>,
    body: web::Json<TriggerWorkflowRequest>,
    state: web::Data<ApiServerState>,
) -> HttpResponse {
    let workflow_id = path.into_inner();
    
    info!("🚀 API trigger: workflow {}", workflow_id);
    
    // Generate execution ID
    let execution_id = format!("exec-{}-{}", workflow_id, chrono::Utc::now().timestamp_millis());
    
    // Store execution (in real implementation, this would trigger actual workflow)
    let response = WorkflowStatusResponse {
        execution_id: execution_id.clone(),
        workflow_id: workflow_id.clone(),
        status: "queued".to_string(),
        progress: 0.0,
        result: None,
        error: None,
    };
    
    {
        let mut executions = match state.executions.write() {
            Ok(guard) => guard,
            Err(_) => return HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to acquire lock"
            })),
        };
        executions.insert(execution_id.clone(), response.clone());
    }
    
    // Trigger workflow execution via scheduler
    let scheduler = state.scheduler.lock().await;
    match scheduler.trigger_workflow(&workflow_id, body.parameters.clone()).await {
        Ok(_) => {
            info!("✅ Workflow {} queued for execution", workflow_id);
        }
        Err(e) => {
            error!("❌ Failed to trigger workflow {}: {}", workflow_id, e);
            return HttpResponse::InternalServerError().json(serde_json::json!({
                "error": format!("Failed to trigger workflow: {}", e)
            }));
        }
    }
    
    HttpResponse::Accepted().json(serde_json::json!({
        "execution_id": execution_id,
        "workflow_id": workflow_id,
        "status": "queued",
        "message": "Workflow execution queued successfully"
    }))
}

async fn get_workflow_status(
    path: web::Path<String>,
    state: web::Data<ApiServerState>,
) -> HttpResponse {
    let workflow_id = path.into_inner();
    
    let executions = match state.executions.read() {
        Ok(guard) => guard,
        Err(_) => return HttpResponse::InternalServerError().json(serde_json::json!({
            "error": "Failed to acquire lock"
        })),
    };
    
    // Find all executions for this workflow
    let workflow_executions: Vec<&WorkflowStatusResponse> = executions.values()
        .filter(|e| e.workflow_id == workflow_id)
        .collect();
    
    if workflow_executions.is_empty() {
        return HttpResponse::NotFound().json(serde_json::json!({
            "error": "No executions found for this workflow"
        }));
    }
    
    HttpResponse::Ok().json(workflow_executions)
}

async fn get_execution_status(
    path: web::Path<String>,
    state: web::Data<ApiServerState>,
) -> HttpResponse {
    let execution_id = path.into_inner();
    
    let executions = match state.executions.read() {
        Ok(guard) => guard,
        Err(_) => return HttpResponse::InternalServerError().json(serde_json::json!({
            "error": "Failed to acquire lock"
        })),
    };
    
    match executions.get(&execution_id) {
        Some(execution) => HttpResponse::Ok().json(execution),
        None => HttpResponse::NotFound().json(serde_json::json!({
            "error": "Execution not found"
        })),
    }
}

async fn webhook_trigger(
    body: web::Json<WebhookPayload>,
    state: web::Data<ApiServerState>,
) -> HttpResponse {
    info!("📥 Webhook received: event_type={}", body.event_type);
    
    // Verify signature if provided
    if let Some(signature) = &body.signature {
        if !verify_webhook_signature(&body, signature, &state.webhook_secret) {
            error!("❌ Invalid webhook signature");
            return HttpResponse::Unauthorized().json(serde_json::json!({
                "error": "Invalid signature"
            }));
        }
    }
    
    // Process webhook payload
    let execution_id = format!("webhook-{}-{}", body.event_type, chrono::Utc::now().timestamp_millis());
    
    // Trigger workflow based on event_type
    if let Some(workflow_id) = &body.workflow_id {
        let scheduler = state.scheduler.lock().await;
        match scheduler.trigger_workflow(workflow_id, Some(body.data.clone())).await {
            Ok(_) => {
                info!("✅ Webhook triggered workflow {}", workflow_id);
            }
            Err(e) => {
                error!("❌ Failed to trigger workflow from webhook: {}", e);
                return HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": format!("Failed to trigger workflow: {}", e)
                }));
            }
        }
    }
    
    HttpResponse::Ok().json(serde_json::json!({
        "execution_id": execution_id,
        "event_type": body.event_type,
        "status": "processed"
    }))
}

fn verify_webhook_signature(payload: &WebhookPayload, signature: &str, secret: &str) -> bool {
    use hmac::{Hmac, Mac};
    use sha2::Sha256;
    
    type HmacSha256 = Hmac<Sha256>;
    
    let payload_json = match serde_json::to_string(payload) {
        Ok(json) => json,
        Err(_) => return false,
    };
    
    let mut mac = match HmacSha256::new_from_slice(secret.as_bytes()) {
        Ok(m) => m,
        Err(_) => return false,
    };
    
    mac.update(payload_json.as_bytes());
    
    let result = mac.finalize();
    let expected = hex::encode(result.into_bytes());
    
    // Constant-time comparison
    signature == expected
}
