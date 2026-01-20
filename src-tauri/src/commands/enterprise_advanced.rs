// ============================================================================
// ENTERPRISE MODULE - Advanced Features Backend
// ============================================================================
// Pipeline Builder

use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

// ============================================================================
// PIPELINE BUILDER TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PipelineNode {
    pub id: String,
    pub node_type: String,
    pub name: String,
    pub config: serde_json::Value,
    pub position_x: f64,
    pub position_y: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PipelineConnection {
    pub id: String,
    pub source_node_id: String,
    pub source_port: String,
    pub target_node_id: String,
    pub target_port: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Pipeline {
    pub id: String,
    pub name: String,
    pub description: String,
    pub nodes: Vec<PipelineNode>,
    pub connections: Vec<PipelineConnection>,
    pub status: String,
    pub created_at: u64,
    pub last_run_at: Option<u64>,
    pub run_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PipelineBuilderConfig {
    pub pipelines: Vec<Pipeline>,
    pub available_node_types: Vec<String>,
}

pub struct PipelineBuilderState {
    config: Mutex<PipelineBuilderConfig>,
}

impl Default for PipelineBuilderState {
    fn default() -> Self {
        let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
        Self {
            config: Mutex::new(PipelineBuilderConfig {
                available_node_types: vec![
                    String::from("trigger"),
                    String::from("http_request"),
                    String::from("data_transform"),
                    String::from("condition"),
                    String::from("loop"),
                    String::from("database"),
                    String::from("notification"),
                    String::from("ai_process"),
                ],
                pipelines: vec![
                    Pipeline {
                        id: String::from("pipe-1"),
                        name: String::from("Daily Data Sync"),
                        description: String::from("Synchronizes data from external APIs daily"),
                        status: String::from("active"),
                        created_at: now - 30 * 24 * 60 * 60,
                        last_run_at: Some(now - 3600),
                        run_count: 180,
                        nodes: vec![
                            PipelineNode { id: String::from("n1"), node_type: String::from("trigger"), name: String::from("Schedule Trigger"), config: serde_json::json!({"schedule": "0 0 * * *"}), position_x: 100.0, position_y: 200.0 },
                            PipelineNode { id: String::from("n2"), node_type: String::from("http_request"), name: String::from("Fetch Data"), config: serde_json::json!({"url": "https://api.example.com/data", "method": "GET"}), position_x: 300.0, position_y: 200.0 },
                            PipelineNode { id: String::from("n3"), node_type: String::from("data_transform"), name: String::from("Transform"), config: serde_json::json!({"mapping": {}}), position_x: 500.0, position_y: 200.0 },
                            PipelineNode { id: String::from("n4"), node_type: String::from("database"), name: String::from("Save to DB"), config: serde_json::json!({"table": "sync_data"}), position_x: 700.0, position_y: 200.0 },
                        ],
                        connections: vec![
                            PipelineConnection { id: String::from("c1"), source_node_id: String::from("n1"), source_port: String::from("out"), target_node_id: String::from("n2"), target_port: String::from("in") },
                            PipelineConnection { id: String::from("c2"), source_node_id: String::from("n2"), source_port: String::from("out"), target_node_id: String::from("n3"), target_port: String::from("in") },
                            PipelineConnection { id: String::from("c3"), source_node_id: String::from("n3"), source_port: String::from("out"), target_node_id: String::from("n4"), target_port: String::from("in") },
                        ],
                    },
                    Pipeline {
                        id: String::from("pipe-2"),
                        name: String::from("Lead Notification"),
                        description: String::from("Sends notifications when new leads arrive"),
                        status: String::from("active"),
                        created_at: now - 15 * 24 * 60 * 60,
                        last_run_at: Some(now - 7200),
                        run_count: 45,
                        nodes: vec![
                            PipelineNode { id: String::from("n5"), node_type: String::from("trigger"), name: String::from("Webhook"), config: serde_json::json!({"path": "/leads"}), position_x: 100.0, position_y: 200.0 },
                            PipelineNode { id: String::from("n6"), node_type: String::from("condition"), name: String::from("Score Check"), config: serde_json::json!({"condition": "score > 70"}), position_x: 300.0, position_y: 200.0 },
                            PipelineNode { id: String::from("n7"), node_type: String::from("notification"), name: String::from("Send Alert"), config: serde_json::json!({"channel": "slack", "message": "New hot lead!"}), position_x: 500.0, position_y: 200.0 },
                        ],
                        connections: vec![
                            PipelineConnection { id: String::from("c4"), source_node_id: String::from("n5"), source_port: String::from("out"), target_node_id: String::from("n6"), target_port: String::from("in") },
                            PipelineConnection { id: String::from("c5"), source_node_id: String::from("n6"), source_port: String::from("true"), target_node_id: String::from("n7"), target_port: String::from("in") },
                        ],
                    },
                ],
            }),
        }
    }
}

#[tauri::command]
pub async fn get_pipeline_builder_config(state: State<'_, PipelineBuilderState>) -> Result<PipelineBuilderConfig, String> {
    state.config.lock().map(|c| c.clone()).map_err(|e| format!("Lock error: {}", e))
}

#[tauri::command]
pub async fn delete_enterprise_pipeline(pipeline_id: String, state: State<'_, PipelineBuilderState>) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    config.pipelines.retain(|p| p.id != pipeline_id);
    Ok(())
}

#[tauri::command]
pub async fn toggle_enterprise_pipeline(pipeline_id: String, status: String, state: State<'_, PipelineBuilderState>) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    if let Some(pipeline) = config.pipelines.iter_mut().find(|p| p.id == pipeline_id) {
        pipeline.status = status;
    }
    Ok(())
}
