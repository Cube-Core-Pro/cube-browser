// Workflow Commands - Save, Load, Execute
// Backend support for visual workflow builder

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowData {
    pub id: String,
    pub name: String,
    pub nodes: Vec<serde_json::Value>,
    pub edges: Vec<serde_json::Value>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionResult {
    pub success: bool,
    pub workflow_id: String,
    pub duration_ms: u64,
    pub nodes_executed: usize,
    pub error: Option<String>,
}

/// Get workflows directory
fn get_workflows_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    
    let workflows_dir = app_data_dir.join("workflows_canvas");
    fs::create_dir_all(&workflows_dir)
        .map_err(|e| format!("Failed to create workflows directory: {}", e))?;
    
    Ok(workflows_dir)
}

#[tauri::command]
pub async fn canvas_save_workflow(
    app: AppHandle,
    workflow: WorkflowData,
) -> Result<String, String> {
    let workflows_dir = get_workflows_dir(&app)?;
    let workflow_path = workflows_dir.join(format!("{}.json", workflow.id));

    let json = serde_json::to_string_pretty(&workflow)
        .map_err(|e| format!("Failed to serialize workflow: {}", e))?;

    fs::write(&workflow_path, json)
        .map_err(|e| format!("Failed to write workflow: {}", e))?;

    Ok(workflow_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn canvas_load_workflow(
    app: AppHandle,
    workflow_id: String,
) -> Result<WorkflowData, String> {
    let workflows_dir = get_workflows_dir(&app)?;
    let workflow_path = workflows_dir.join(format!("{}.json", workflow_id));

    if !workflow_path.exists() {
        return Err(format!("Workflow not found: {}", workflow_id));
    }

    let json = fs::read_to_string(&workflow_path)
        .map_err(|e| format!("Failed to read workflow: {}", e))?;

    let workflow: WorkflowData = serde_json::from_str(&json)
        .map_err(|e| format!("Failed to parse workflow: {}", e))?;

    Ok(workflow)
}

#[tauri::command]
pub async fn canvas_list_workflows(app: AppHandle) -> Result<Vec<WorkflowData>, String> {
    let workflows_dir = get_workflows_dir(&app)?;
    let mut workflows = Vec::new();

    let entries = fs::read_dir(&workflows_dir)
        .map_err(|e| format!("Failed to read workflows directory: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();

        if path.extension().and_then(|s| s.to_str()) == Some("json") {
            if let Ok(json) = fs::read_to_string(&path) {
                if let Ok(workflow) = serde_json::from_str::<WorkflowData>(&json) {
                    workflows.push(workflow);
                }
            }
        }
    }

    // Sort by updated_at descending
    workflows.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));

    Ok(workflows)
}

#[tauri::command]
pub async fn canvas_delete_workflow(
    app: AppHandle,
    workflow_id: String,
) -> Result<(), String> {
    let workflows_dir = get_workflows_dir(&app)?;
    let workflow_path = workflows_dir.join(format!("{}.json", workflow_id));

    if workflow_path.exists() {
        fs::remove_file(&workflow_path)
            .map_err(|e| format!("Failed to delete workflow: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub async fn canvas_execute_workflow(
    _app: AppHandle,
    workflow_id: String,
    nodes: Vec<serde_json::Value>,
    _edges: Vec<serde_json::Value>,
) -> Result<ExecutionResult, String> {
    // Mock execution for now
    // Real implementation would:
    // 1. Topologically sort nodes based on edges
    // 2. Execute each node in order
    // 3. Pass data between nodes via edges
    // 4. Handle errors and retries
    // 5. Store execution logs

    let start_time = std::time::SystemTime::now();
    
    // Simulate execution
    tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
    
    let duration = start_time
        .elapsed()
        .map_err(|e| format!("Time error: {}", e))?
        .as_millis() as u64;

    Ok(ExecutionResult {
        success: true,
        workflow_id,
        duration_ms: duration,
        nodes_executed: nodes.len(),
        error: None,
    })
}

#[tauri::command]
pub async fn canvas_validate_workflow(
    nodes: Vec<serde_json::Value>,
    edges: Vec<serde_json::Value>,
) -> Result<Vec<String>, String> {
    let mut errors = Vec::new();

    // Check for trigger nodes
    let has_trigger = nodes.iter().any(|node| {
        node.get("type")
            .and_then(|t| t.as_str())
            .map(|t| t == "trigger")
            .unwrap_or(false)
    });

    if !has_trigger {
        errors.push("Workflow must have at least one trigger node".to_string());
    }

    // Check for orphan nodes (nodes with no connections)
    if nodes.len() > 1 {
        for node in &nodes {
            let node_id = node.get("id").and_then(|id| id.as_str());
            if let Some(id) = node_id {
                let has_connection = edges.iter().any(|edge| {
                    edge.get("source").and_then(|s| s.as_str()) == Some(id)
                        || edge.get("target").and_then(|t| t.as_str()) == Some(id)
                });

                if !has_connection {
                    errors.push(format!("Node '{}' is not connected", id));
                }
            }
        }
    }

    // Check for cycles (simplified check)
    // Real implementation would do proper cycle detection

    Ok(errors)
}
