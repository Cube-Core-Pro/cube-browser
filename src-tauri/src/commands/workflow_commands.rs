use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;
use crate::services::browser_service::BrowserService;
use crate::services::ai_service::{AIService, AIRequest};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowNode {
    pub id: String,
    pub node_type: String,
    pub data: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowEdge {
    pub id: String,
    pub source: String,
    pub target: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Workflow {
    pub id: String,
    pub name: String,
    pub nodes: Vec<WorkflowNode>,
    pub edges: Vec<WorkflowEdge>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeResult {
    pub success: bool,
    pub data: serde_json::Value,
    pub error: Option<String>,
}

pub struct WorkflowState {
    workflows: Arc<Mutex<HashMap<String, Workflow>>>,
    executions: Arc<Mutex<HashMap<String, Vec<NodeResult>>>>,
}

impl WorkflowState {
    pub fn new() -> Self {
        Self {
            workflows: Arc::new(Mutex::new(HashMap::new())),
            executions: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

#[tauri::command]
pub async fn execute_workflow_node(
    node: WorkflowNode,
    _state: State<'_, WorkflowState>,
    browser: State<'_, Arc<BrowserService>>,
    ai_service: State<'_, AIService>,
) -> Result<NodeResult, String> {
    log::info!("Executing workflow node: {} (type: {})", node.id, node.node_type);

    match node.node_type.as_str() {
        "browserAction" => execute_browser_action(node, browser).await,
        "dataExtraction" => execute_data_extraction(node, browser).await,
        "aiProcessing" => execute_ai_processing(node, ai_service).await,
        "condition" => execute_condition(node).await,
        "loop" => execute_loop(node).await,
        _ => Ok(NodeResult {
            success: true,
            data: serde_json::json!({
                "message": format!("Node type '{}' executed (mock)", node.node_type)
            }),
            error: None,
        }),
    }
}

async fn execute_browser_action(
    node: WorkflowNode,
    browser: State<'_, Arc<BrowserService>>,
) -> Result<NodeResult, String> {
    let action = node.data.get("action").and_then(|v| v.as_str()).unwrap_or("");
    let target = node.data.get("target").and_then(|v| v.as_str()).unwrap_or("");
    let text = node.data.get("text").and_then(|v| v.as_str()).unwrap_or("");
    
    log::info!("Browser action: {} on {}", action, target);

    // Use default tab or create one
    let tab_id = "workflow_default";
    
    // Execute real browser action
    let result_data = match action {
        "navigate" => {
            browser.navigate(tab_id, target)
                .map_err(|e| format!("Navigation failed: {}", e))?;
            
            serde_json::json!({
                "action": "navigate",
                "url": target,
                "executed": true,
                "tab_id": tab_id
            })
        }
        "click" => {
            browser.click(tab_id, target)
                .map_err(|e| format!("Click failed: {}", e))?;
            
            serde_json::json!({
                "action": "click",
                "selector": target,
                "executed": true,
                "tab_id": tab_id
            })
        }
        "type" => {
            browser.type_text(tab_id, target, text)
                .map_err(|e| format!("Type failed: {}", e))?;
            
            serde_json::json!({
                "action": "type",
                "selector": target,
                "text": text,
                "executed": true,
                "tab_id": tab_id
            })
        }
        "screenshot" => {
            let screenshot_data = browser.screenshot(tab_id)
                .map_err(|e| format!("Screenshot failed: {}", e))?;
            
            serde_json::json!({
                "action": "screenshot",
                "captured": true,
                "size": screenshot_data.len(),
                "tab_id": tab_id
            })
        }
        _ => {
            return Err(format!("Unknown browser action: {}", action));
        }
    };

    Ok(NodeResult {
        success: true,
        data: result_data,
        error: None,
    })
}

async fn execute_data_extraction(
    node: WorkflowNode,
    browser: State<'_, Arc<BrowserService>>,
) -> Result<NodeResult, String> {
    let selector = node.data.get("selector").and_then(|v| v.as_str()).unwrap_or("");
    let attribute = node.data.get("attribute").and_then(|v| v.as_str()).unwrap_or("text");
    
    log::info!("Data extraction: selector={}, attribute={}", selector, attribute);

    // Get HTML from current browser tab
    let tab_id = "workflow_default";
    let html = browser.get_html(tab_id)
        .map_err(|e| format!("Failed to get HTML: {}", e))?;
    
    // Parse HTML with scraper
    use scraper::{Html, Selector as ScraperSelector};
    
    let document = Html::parse_document(&html);
    let scraper_selector = ScraperSelector::parse(selector)
        .map_err(|e| format!("Invalid CSS selector: {:?}", e))?;
    
    // Extract data based on attribute
    let extracted: Vec<String> = document
        .select(&scraper_selector)
        .map(|element| {
            match attribute {
                "text" => element.text().collect::<Vec<_>>().join(" "),
                "html" => element.html(),
                _ => element.value().attr(attribute).unwrap_or("").to_string(),
            }
        })
        .filter(|s| !s.trim().is_empty())
        .collect();

    log::info!("Extracted {} elements", extracted.len());

    Ok(NodeResult {
        success: true,
        data: serde_json::json!({
            "selector": selector,
            "attribute": attribute,
            "extracted": extracted,
            "count": extracted.len()
        }),
        error: None,
    })
}

async fn execute_ai_processing(
    node: WorkflowNode,
    ai_service: State<'_, AIService>,
) -> Result<NodeResult, String> {
    let prompt = node.data.get("prompt").and_then(|v| v.as_str()).unwrap_or("");
    let model = node.data.get("model").and_then(|v| v.as_str()).unwrap_or("gpt-5-mini");
    let temperature = node.data.get("temperature")
        .and_then(|v| v.as_f64())
        .unwrap_or(0.7) as f32;
    
    log::info!("AI processing with prompt: {}", prompt);

    // Check if API key is configured
    if !ai_service.has_api_key() {
        return Err("OpenAI API key not configured. Please set OPENAI_API_KEY.".to_string());
    }

    // Create AI request
    let request = AIRequest {
        prompt: prompt.to_string(),
        model: model.to_string(),
        temperature,
        max_tokens: Some(1000),
    };

    // Call OpenAI API
    let response = ai_service.send_request(request).await
        .map_err(|e| format!("AI processing failed: {}", e))?;

    log::info!("AI response received: {} tokens", response.usage.total_tokens);

    Ok(NodeResult {
        success: true,
        data: serde_json::json!({
            "prompt": prompt,
            "response": response.content,
            "model": response.model,
            "tokens": {
                "prompt": response.usage.prompt_tokens,
                "completion": response.usage.completion_tokens,
                "total": response.usage.total_tokens
            }
        }),
        error: None,
    })
}

async fn execute_condition(node: WorkflowNode) -> Result<NodeResult, String> {
    let field = node.data.get("field").and_then(|v| v.as_str()).unwrap_or("");
    let operator = node.data.get("operator").and_then(|v| v.as_str()).unwrap_or("equals");
    let value = node.data.get("value").and_then(|v| v.as_str()).unwrap_or("");
    
    log::info!("Condition: {} {} {}", field, operator, value);

    // Mock condition evaluation
    let result = true; // Simplified for now
    
    Ok(NodeResult {
        success: true,
        data: serde_json::json!({
            "condition": format!("{} {} {}", field, operator, value),
            "result": result,
            "branch": if result { "true" } else { "false" }
        }),
        error: None,
    })
}

async fn execute_loop(node: WorkflowNode) -> Result<NodeResult, String> {
    let iterations = node.data.get("iterations")
        .and_then(|v| v.as_u64())
        .unwrap_or(1);
    
    log::info!("Loop: {} iterations", iterations);

    Ok(NodeResult {
        success: true,
        data: serde_json::json!({
            "iterations": iterations,
            "current": 1,
            "completed": false
        }),
        error: None,
    })
}

#[tauri::command]
pub async fn workflow_save(
    workflow: Workflow,
    state: State<'_, WorkflowState>,
) -> Result<(), String> {
    log::info!("Saving workflow: {} ({})", workflow.name, workflow.id);

    let mut workflows = state.workflows.lock().await;
    workflows.insert(workflow.id.clone(), workflow);

    Ok(())
}

#[tauri::command]
pub async fn workflow_load_all(
    state: State<'_, WorkflowState>,
) -> Result<Vec<Workflow>, String> {
    log::info!("Loading all workflows");

    let workflows = state.workflows.lock().await;
    Ok(workflows.values().cloned().collect())
}

#[tauri::command]
pub async fn workflow_load(
    id: String,
    state: State<'_, WorkflowState>,
) -> Result<Workflow, String> {
    log::info!("Loading workflow: {}", id);

    let workflows = state.workflows.lock().await;
    workflows
        .get(&id)
        .cloned()
        .ok_or_else(|| format!("Workflow not found: {}", id))
}

#[tauri::command]
pub async fn workflow_delete(
    id: String,
    state: State<'_, WorkflowState>,
) -> Result<(), String> {
    log::info!("Deleting workflow: {}", id);

    let mut workflows = state.workflows.lock().await;
    workflows.remove(&id);

    Ok(())
}

#[tauri::command]
pub async fn optimize_workflow_with_ai(
    workflow: Workflow,
    ai_service: State<'_, Arc<Mutex<AIService>>>,
) -> Result<Workflow, String> {
    log::info!("Optimizing workflow with AI: {}", workflow.name);

    let ai = ai_service.lock().await;
    
    let optimization_prompt = format!(
        "Analyze and optimize this automation workflow. Suggest improvements for efficiency, error handling, and best practices:\n\n\
        Workflow Name: {}\n\
        Nodes: {} nodes\n\
        Edges: {} connections\n\n\
        Current Structure:\n{}\n\n\
        Provide specific optimization recommendations.",
        workflow.name,
        workflow.nodes.len(),
        workflow.edges.len(),
        serde_json::to_string_pretty(&workflow).unwrap_or_default()
    );

    let request = AIRequest {
        prompt: optimization_prompt,
        model: "gpt-4".to_string(),
        temperature: 0.3,
        max_tokens: Some(1500),
    };

    match ai.generate(&request).await {
        Ok(response) => {
            log::info!("AI optimization suggestions: {}", response.result);
            // For now, return the original workflow with AI suggestions in logs
            // In production, parse AI response and apply optimizations
            Ok(workflow)
        }
        Err(e) => {
            log::error!("Failed to optimize workflow with AI: {}", e);
            Err(format!("AI optimization failed: {}", e))
        }
    }
}

#[tauri::command]
pub async fn generate_workflow_from_description(
    description: String,
    ai_service: State<'_, Arc<Mutex<AIService>>>,
) -> Result<Workflow, String> {
    log::info!("Generating workflow from description: {}", description);

    let ai = ai_service.lock().await;
    
    let generation_prompt = format!(
        "Generate a complete automation workflow in JSON format based on this description:\n\n\
        {}\n\n\
        Return a valid JSON object with this structure:\n\
        {{\n  \
          \"name\": \"Workflow Name\",\n  \
          \"nodes\": [\n    \
            {{\"id\": \"unique-id\", \"node_type\": \"start|action|condition|end\", \"data\": {{}}}}\n  \
          ],\n  \
          \"edges\": [\n    \
            {{\"id\": \"edge-id\", \"source\": \"source-node-id\", \"target\": \"target-node-id\"}}\n  \
          ]\n\
        }}\n\n\
        Include appropriate node types: start, navigate, click, extract, condition, loop, end.",
        description
    );

    let request = AIRequest {
        prompt: generation_prompt,
        model: "gpt-4".to_string(),
        temperature: 0.7,
        max_tokens: Some(2000),
    };

    match ai.generate(&request).await {
        Ok(response) => {
            // Try to parse AI response as workflow JSON
            match serde_json::from_str::<serde_json::Value>(&response.result) {
                Ok(json) => {
                    // Extract workflow data from JSON
                    let workflow = Workflow {
                        id: uuid::Uuid::new_v4().to_string(),
                        name: json.get("name")
                            .and_then(|v| v.as_str())
                            .unwrap_or("Generated Workflow")
                            .to_string(),
                        nodes: json.get("nodes")
                            .and_then(|v| serde_json::from_value(v.clone()).ok())
                            .unwrap_or_else(|| vec![
                                WorkflowNode {
                                    id: "start-1".to_string(),
                                    node_type: "start".to_string(),
                                    data: serde_json::json!({}),
                                },
                                WorkflowNode {
                                    id: "end-1".to_string(),
                                    node_type: "end".to_string(),
                                    data: serde_json::json!({}),
                                },
                            ]),
                        edges: json.get("edges")
                            .and_then(|v| serde_json::from_value(v.clone()).ok())
                            .unwrap_or_else(|| vec![WorkflowEdge {
                                id: "edge-1".to_string(),
                                source: "start-1".to_string(),
                                target: "end-1".to_string(),
                            }]),
                        created_at: chrono::Utc::now().to_rfc3339(),
                        updated_at: chrono::Utc::now().to_rfc3339(),
                    };
                    
                    log::info!("Successfully generated workflow: {}", workflow.name);
                    Ok(workflow)
                }
                Err(e) => {
                    log::error!("Failed to parse AI workflow JSON: {}", e);
                    // Return fallback workflow
                    Ok(Workflow {
                        id: uuid::Uuid::new_v4().to_string(),
                        name: "Generated Workflow".to_string(),
                        nodes: vec![
                            WorkflowNode {
                                id: "start-1".to_string(),
                                node_type: "start".to_string(),
                                data: serde_json::json!({}),
                            },
                            WorkflowNode {
                                id: "end-1".to_string(),
                                node_type: "end".to_string(),
                                data: serde_json::json!({}),
                            },
                        ],
                        edges: vec![WorkflowEdge {
                            id: "edge-1".to_string(),
                            source: "start-1".to_string(),
                            target: "end-1".to_string(),
                        }],
                        created_at: chrono::Utc::now().to_rfc3339(),
                        updated_at: chrono::Utc::now().to_rfc3339(),
                    })
                }
            }
        }
        Err(e) => {
            log::error!("Failed to generate workflow with AI: {}", e);
            Err(format!("AI workflow generation failed: {}", e))
        }
    }
}
