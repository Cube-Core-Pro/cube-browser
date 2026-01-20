// Automation System - Backend Commands
// Flow execution, storage, and recording

use crate::services::browser_service::BrowserService;
use base64::{engine::general_purpose::STANDARD, Engine as _};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::State;

// ============================================================================
// TYPES (matching TypeScript frontend)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum NodeType {
    Trigger,
    Action,
    Condition,
    Loop,
    Data,
    Api,
    Wait,
    Notification,
    Storage,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TriggerType {
    Manual,
    Schedule,
    Webhook,
    BrowserEvent,
    FileWatch,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ActionType {
    Navigate,
    Click,
    Type,
    Select,
    Extract,
    Screenshot,
    Upload,
    Download,
    ExecuteJs,
    WaitElement,
    Scroll,
    Wait,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlowNode {
    pub id: String,
    #[serde(rename = "type")]
    pub node_type: NodeType,
    pub position: Position,
    pub data: FlowNodeData,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlowNodeData {
    pub label: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub config: NodeConfig,
    pub status: Option<String>,
    pub error: Option<String>,
    pub output: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeConfig {
    // Trigger config
    pub trigger_type: Option<TriggerType>,
    pub schedule: Option<String>,
    pub webhook_url: Option<String>,

    // Action config
    pub action_type: Option<ActionType>,
    pub url: Option<String>,
    pub selector: Option<String>,
    pub text: Option<String>,
    pub value: Option<String>,
    pub file_path: Option<String>,
    pub javascript: Option<String>,
    pub wait_time: Option<u64>,

    // Condition config
    pub condition: Option<String>,
    pub operator: Option<String>,
    pub compare_value: Option<String>,

    // Loop config
    pub loop_type: Option<String>,
    pub iterations: Option<u32>,
    pub items: Option<Vec<serde_json::Value>>,

    // Additional config
    #[serde(flatten)]
    pub extra: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlowEdge {
    pub id: String,
    pub source: String,
    pub target: String,
    #[serde(rename = "sourceHandle")]
    pub source_handle: Option<String>,
    #[serde(rename = "targetHandle")]
    pub target_handle: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Flow {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub nodes: Vec<FlowNode>,
    pub edges: Vec<FlowEdge>,
    pub variables: Vec<FlowVariable>,
    pub secrets: Vec<FlowSecret>,
    pub settings: FlowSettings,
    pub created: Option<String>,
    pub modified: Option<String>,
    pub version: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlowVariable {
    pub name: String,
    pub value: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlowSecret {
    pub name: String,
    pub encrypted_value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlowSettings {
    #[serde(rename = "maxRetries")]
    pub max_retries: u32,
    #[serde(rename = "retryDelay")]
    pub retry_delay: u64,
    pub timeout: u64,
    #[serde(rename = "continueOnError")]
    pub continue_on_error: bool,
    #[serde(rename = "logLevel")]
    pub log_level: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlowExecution {
    pub id: String,
    #[serde(rename = "flowId")]
    pub flow_id: String,
    pub status: ExecutionStatus,
    #[serde(rename = "startedAt")]
    pub started_at: String,
    #[serde(rename = "completedAt")]
    pub completed_at: Option<String>,
    pub duration: Option<u64>,
    pub steps: Vec<ExecutionStep>,
    pub error: Option<ExecutionError>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ExecutionStatus {
    Pending,
    Running,
    Completed,
    Failed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionStep {
    #[serde(rename = "nodeId")]
    pub node_id: String,
    pub label: String,
    pub status: String,
    #[serde(rename = "startedAt")]
    pub started_at: String,
    #[serde(rename = "completedAt")]
    pub completed_at: Option<String>,
    pub duration: Option<u64>,
    pub output: Option<serde_json::Value>,
    pub error: Option<String>,
    #[serde(rename = "retryCount")]
    pub retry_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionError {
    pub code: String,
    pub message: String,
    #[serde(rename = "nodeId")]
    pub node_id: Option<String>,
    #[serde(rename = "stackTrace")]
    pub stack_trace: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecordedAction {
    #[serde(rename = "type")]
    pub action_type: String,
    pub selector: String,
    pub xpath: Option<String>,
    pub value: Option<String>,
    pub timestamp: u64,
    pub url: String,
    pub screenshot: Option<String>,
}

// ============================================================================
// STATE
// ============================================================================

pub struct AutomationState {
    pub flows: Arc<Mutex<HashMap<String, Flow>>>,
    pub executions: Arc<Mutex<HashMap<String, FlowExecution>>>,
    pub recording_session: Arc<Mutex<Option<RecordingSession>>>,
}

#[derive(Debug, Clone)]
pub struct RecordingSession {
    pub id: String,
    pub started_at: u64,
    pub actions: Vec<RecordedAction>,
}

impl AutomationState {
    pub fn new() -> Self {
        Self {
            flows: Arc::new(Mutex::new(HashMap::new())),
            executions: Arc::new(Mutex::new(HashMap::new())),
            recording_session: Arc::new(Mutex::new(None)),
        }
    }
}

// ============================================================================
// FLOW STORAGE
// ============================================================================

use std::fs;
use std::path::PathBuf;

fn get_flows_dir() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Could not find home directory")?;
    let flows_dir = home.join(".cube_omnifill").join("automation").join("flows");

    if !flows_dir.exists() {
        fs::create_dir_all(&flows_dir)
            .map_err(|e| format!("Failed to create flows directory: {}", e))?;
    }

    Ok(flows_dir)
}

fn save_flow_to_disk(flow: &Flow) -> Result<(), String> {
    let flows_dir = get_flows_dir()?;
    let file_path = flows_dir.join(format!("{}.json", flow.id));

    let json = serde_json::to_string_pretty(flow)
        .map_err(|e| format!("Failed to serialize flow: {}", e))?;

    fs::write(&file_path, json).map_err(|e| format!("Failed to write flow file: {}", e))?;

    Ok(())
}

fn load_flows_from_disk() -> Result<Vec<Flow>, String> {
    let flows_dir = get_flows_dir()?;
    let mut flows = Vec::new();

    if !flows_dir.exists() {
        return Ok(flows);
    }

    let entries =
        fs::read_dir(&flows_dir).map_err(|e| format!("Failed to read flows directory: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let path = entry.path();

        if path.extension().and_then(|s| s.to_str()) == Some("json") {
            let content = fs::read_to_string(&path)
                .map_err(|e| format!("Failed to read flow file: {}", e))?;

            let flow: Flow = serde_json::from_str(&content)
                .map_err(|e| format!("Failed to parse flow: {}", e))?;

            flows.push(flow);
        }
    }

    Ok(flows)
}

fn delete_flow_from_disk(flow_id: &str) -> Result<(), String> {
    let flows_dir = get_flows_dir()?;
    let file_path = flows_dir.join(format!("{}.json", flow_id));

    if file_path.exists() {
        fs::remove_file(&file_path).map_err(|e| format!("Failed to delete flow file: {}", e))?;
    }

    Ok(())
}

// ============================================================================
// FLOW EXECUTOR
// ============================================================================

async fn execute_node(
    node: &FlowNode,
    context: &mut ExecutionContext,
) -> Result<serde_json::Value, String> {
    match node.node_type {
        NodeType::Trigger => {
            // Trigger nodes don't execute, they just start the flow
            Ok(serde_json::json!({ "triggered": true }))
        }
        NodeType::Action => execute_action(node, context).await,
        NodeType::Condition => execute_condition(node, context).await,
        NodeType::Loop => execute_loop(node, context).await,
        NodeType::Data => execute_data_transform(node, context).await,
        NodeType::Wait => execute_wait(node, context).await,
        NodeType::Api => execute_api_call(node, context).await,
        NodeType::Notification => execute_notification(node, context).await,
        NodeType::Storage => execute_storage(node, context).await,
    }
}

struct ExecutionContext {
    variables: HashMap<String, serde_json::Value>,
    node_outputs: HashMap<String, serde_json::Value>,
    storage: HashMap<String, serde_json::Value>, // Persistent storage for get/set/delete operations
    browser_service: Option<Arc<BrowserService>>,
    browser_tab_id: Option<String>,
}

impl ExecutionContext {
    fn new(variables: Vec<FlowVariable>) -> Self {
        let mut vars = HashMap::new();
        for var in variables {
            vars.insert(var.name, var.value);
        }

        Self {
            variables: vars,
            node_outputs: HashMap::new(),
            storage: HashMap::new(), // Initialize empty storage
            browser_service: None,
            browser_tab_id: None,
        }
    }

    fn with_browser(mut self, browser: Arc<BrowserService>, tab_id: String) -> Self {
        self.browser_service = Some(browser);
        self.browser_tab_id = Some(tab_id);
        self
    }
}

async fn execute_action(
    node: &FlowNode,
    context: &mut ExecutionContext,
) -> Result<serde_json::Value, String> {
    let config = &node.data.config;

    match config.action_type.as_ref() {
        Some(ActionType::Navigate) => {
            let url = config
                .url
                .as_ref()
                .ok_or("URL is required for navigate action")?;

            // Try to use real browser if available in context
            if let Some(tab_id) = &context.browser_tab_id {
                if let Some(browser) = &context.browser_service {
                    browser.navigate(tab_id, url).map_err(|e| e.to_string())?;
                    return Ok(serde_json::json!({
                        "action": "navigate",
                        "url": url,
                        "status": "success",
                        "real_browser": true
                    }));
                }
            }

            // Fallback to mock response
            Ok(serde_json::json!({
                "action": "navigate",
                "url": url,
                "status": "mock",
                "real_browser": false
            }))
        }
        Some(ActionType::Click) => {
            let selector = config
                .selector
                .as_ref()
                .ok_or("Selector is required for click action")?;

            // Try to use real browser
            if let Some(tab_id) = &context.browser_tab_id {
                if let Some(browser) = &context.browser_service {
                    browser.click(tab_id, selector).map_err(|e| e.to_string())?;
                    return Ok(serde_json::json!({
                        "action": "click",
                        "selector": selector,
                        "status": "success",
                        "real_browser": true
                    }));
                }
            }

            Ok(serde_json::json!({
                "action": "click",
                "selector": selector,
                "status": "mock",
                "real_browser": false
            }))
        }
        Some(ActionType::Type) => {
            let selector = config.selector.as_ref().ok_or("Selector is required")?;
            let text = config.text.as_ref().ok_or("Text is required")?;

            // Try to use real browser
            if let Some(tab_id) = &context.browser_tab_id {
                if let Some(browser) = &context.browser_service {
                    browser
                        .type_text(tab_id, selector, text)
                        .map_err(|e| e.to_string())?;
                    return Ok(serde_json::json!({
                        "action": "type",
                        "selector": selector,
                        "text": text,
                        "status": "success",
                        "real_browser": true
                    }));
                }
            }

            Ok(serde_json::json!({
                "action": "type",
                "selector": selector,
                "text": text,
                "status": "mock",
                "real_browser": false
            }))
        }
        Some(ActionType::Extract) => {
            let selector = config.selector.as_ref().ok_or("Selector is required")?;

            // Try to use real browser
            if let Some(tab_id) = &context.browser_tab_id {
                if let Some(browser) = &context.browser_service {
                    let extracted = browser
                        .get_text(tab_id, selector)
                        .map_err(|e| e.to_string())?;
                    return Ok(serde_json::json!({
                        "action": "extract",
                        "selector": selector,
                        "data": extracted,
                        "status": "success",
                        "real_browser": true
                    }));
                }
            }

            Ok(serde_json::json!({
                "action": "extract",
                "selector": selector,
                "data": "mock_extracted_data",
                "status": "mock",
                "real_browser": false
            }))
        }
        Some(ActionType::Screenshot) => {
            // Try to use real browser
            if let Some(tab_id) = &context.browser_tab_id {
                if let Some(browser) = &context.browser_service {
                    let screenshot_data = browser.screenshot(tab_id).map_err(|e| e.to_string())?;
                    let base64_data = STANDARD.encode(&screenshot_data);
                    return Ok(serde_json::json!({
                        "action": "screenshot",
                        "data": base64_data,
                        "format": "png",
                        "status": "success",
                        "real_browser": true
                    }));
                }
            }

            Ok(serde_json::json!({
                "action": "screenshot",
                "status": "mock",
                "real_browser": false
            }))
        }
        Some(ActionType::WaitElement) => {
            let selector = config.selector.as_ref().ok_or("Selector is required")?;
            let timeout = config.wait_time.unwrap_or(30000);

            // Try to use real browser
            if let Some(tab_id) = &context.browser_tab_id {
                if let Some(browser) = &context.browser_service {
                    browser
                        .wait_for_element(tab_id, selector, Some(timeout))
                        .map_err(|e| e.to_string())?;
                    return Ok(serde_json::json!({
                        "action": "wait_element",
                        "selector": selector,
                        "timeout": timeout,
                        "status": "success",
                        "real_browser": true
                    }));
                }
            }

            Ok(serde_json::json!({
                "action": "wait_element",
                "selector": selector,
                "status": "mock",
                "real_browser": false
            }))
        }
        Some(ActionType::Wait) => {
            let wait_time = config.wait_time.unwrap_or(1000);
            tokio::time::sleep(tokio::time::Duration::from_millis(wait_time)).await;
            Ok(serde_json::json!({ "action": "wait", "duration": wait_time }))
        }
        Some(ActionType::ExecuteJs) => {
            let script = config
                .javascript
                .as_ref()
                .ok_or("JavaScript code is required")?;

            // Try to use real browser
            if let Some(tab_id) = &context.browser_tab_id {
                if let Some(browser) = &context.browser_service {
                    let result = browser
                        .evaluate(tab_id, script)
                        .map_err(|e| e.to_string())?;
                    return Ok(serde_json::json!({
                        "action": "execute_js",
                        "script": script,
                        "result": result,
                        "status": "success",
                        "real_browser": true
                    }));
                }
            }

            Ok(serde_json::json!({
                "action": "execute_js",
                "script": script,
                "status": "mock",
                "real_browser": false
            }))
        }
        _ => Err("Unsupported action type".to_string()),
    }
}

async fn execute_condition(
    node: &FlowNode,
    context: &mut ExecutionContext,
) -> Result<serde_json::Value, String> {
    let config = &node.data.config;
    let condition = config.condition.as_ref().ok_or("Condition is required")?;

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 1: Parse condition expression (supports variable substitution)
    // ═══════════════════════════════════════════════════════════════════════
    let mut resolved_condition = condition.clone();

    // Replace variables from context: {{variable_name}}
    for (var_name, var_value) in &context.variables {
        let placeholder = format!("{{{{{}}}}}", var_name);
        if let Some(value_str) = var_value.as_str() {
            resolved_condition = resolved_condition.replace(&placeholder, value_str);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 2: Evaluate condition (basic operators)
    // ═══════════════════════════════════════════════════════════════════════
    let result = evaluate_simple_condition(&resolved_condition)?;

    // Store result in context for downstream nodes
    context
        .variables
        .insert(format!("{}_result", node.id), serde_json::json!(result));

    log::debug!("Condition '{}' evaluated to: {}", condition, result);

    Ok(serde_json::json!({
        "condition": condition,
        "resolved": resolved_condition,
        "result": result
    }))
}

// Helper: Simple condition evaluator (==, !=, >, <, >=, <=, contains)
fn evaluate_simple_condition(expr: &str) -> Result<bool, String> {
    let expr = expr.trim();

    // Check for comparison operators
    if expr.contains("==") {
        let parts: Vec<&str> = expr.split("==").collect();
        if parts.len() == 2 {
            return Ok(parts[0].trim() == parts[1].trim());
        }
    } else if expr.contains("!=") {
        let parts: Vec<&str> = expr.split("!=").collect();
        if parts.len() == 2 {
            return Ok(parts[0].trim() != parts[1].trim());
        }
    } else if expr.contains("contains") {
        let parts: Vec<&str> = expr.split("contains").collect();
        if parts.len() == 2 {
            return Ok(parts[0].trim().contains(parts[1].trim()));
        }
    }

    // Default: check if string is "true"
    Ok(expr.to_lowercase() == "true")
}

async fn execute_loop(
    node: &FlowNode,
    context: &mut ExecutionContext,
) -> Result<serde_json::Value, String> {
    let config = &node.data.config;
    let iterations = config.iterations.unwrap_or(1);

    // Store loop metadata in context
    context.variables.insert(
        format!("{}_iterations", node.id),
        serde_json::json!(iterations),
    );

    log::debug!(
        "Loop node {} configured for {} iterations",
        node.id,
        iterations
    );

    Ok(serde_json::json!({
        "loop": "completed",
        "iterations": iterations,
        "node_id": node.id
    }))
}

async fn execute_data_transform(
    node: &FlowNode,
    context: &mut ExecutionContext,
) -> Result<serde_json::Value, String> {
    let config = &node.data.config;

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 1: Get source data from context or config (using extra fields)
    // ═══════════════════════════════════════════════════════════════════════
    let source_key = config
        .extra
        .get("source_key")
        .and_then(|v| v.as_str())
        .ok_or("source_key required in config.extra for data transformation")?;

    let source_data = context
        .variables
        .get(source_key)
        .ok_or_else(|| format!("Source data '{}' not found in context", source_key))?
        .clone();

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 2: Apply transformation (basic transformations)
    // ═══════════════════════════════════════════════════════════════════════
    let transform_type = config
        .extra
        .get("transform_type")
        .and_then(|v| v.as_str())
        .unwrap_or("passthrough");

    let transformed = match transform_type {
        "uppercase" => {
            if let Some(s) = source_data.as_str() {
                serde_json::json!(s.to_uppercase())
            } else {
                source_data
            }
        }
        "lowercase" => {
            if let Some(s) = source_data.as_str() {
                serde_json::json!(s.to_lowercase())
            } else {
                source_data
            }
        }
        "trim" => {
            if let Some(s) = source_data.as_str() {
                serde_json::json!(s.trim())
            } else {
                source_data
            }
        }
        "to_number" => {
            if let Some(s) = source_data.as_str() {
                match s.parse::<f64>() {
                    Ok(n) => serde_json::json!(n),
                    Err(_) => source_data,
                }
            } else {
                source_data
            }
        }
        _ => source_data, // passthrough
    };

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 3: Store result in context
    // ═══════════════════════════════════════════════════════════════════════
    let output_key = config
        .extra
        .get("output_key")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .unwrap_or_else(|| format!("{}_output", node.id));

    context
        .variables
        .insert(output_key.clone(), transformed.clone());

    log::debug!(
        "Data transform: {} -> {} (type: {})",
        source_key,
        output_key,
        transform_type
    );

    Ok(serde_json::json!({
        "transform": "completed",
        "source_key": source_key,
        "output_key": output_key,
        "transform_type": transform_type,
        "result": transformed
    }))
}

async fn execute_wait(
    node: &FlowNode,
    context: &mut ExecutionContext,
) -> Result<serde_json::Value, String> {
    let config = &node.data.config;
    let wait_time = config.wait_time.unwrap_or(1000);

    log::debug!("Waiting {} ms (node: {})", wait_time, node.id);
    tokio::time::sleep(tokio::time::Duration::from_millis(wait_time)).await;

    // Store wait completion in context
    context.variables.insert(
        format!("{}_completed_at", node.id),
        serde_json::json!(chrono::Utc::now().to_rfc3339()),
    );

    Ok(serde_json::json!({
        "waited": wait_time,
        "node_id": node.id
    }))
}

async fn execute_api_call(
    node: &FlowNode,
    context: &mut ExecutionContext,
) -> Result<serde_json::Value, String> {
    let config = &node.data.config;
    let url = config.url.as_ref().ok_or("URL is required for API call")?;

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 1: Build HTTP request with context variable substitution
    // ═══════════════════════════════════════════════════════════════════════
    let mut resolved_url = url.clone();

    // Replace variables: {{variable_name}}
    for (var_name, var_value) in &context.variables {
        let placeholder = format!("{{{{{}}}}}", var_name);
        if let Some(value_str) = var_value.as_str() {
            resolved_url = resolved_url.replace(&placeholder, value_str);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 2: Get HTTP method and body from extra config
    // ═══════════════════════════════════════════════════════════════════════
    let method = config
        .extra
        .get("method")
        .and_then(|v| v.as_str())
        .unwrap_or("GET");

    let body = config
        .extra
        .get("body")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 3: Execute HTTP request using reqwest
    // ═══════════════════════════════════════════════════════════════════════
    log::info!("API Call: {} {}", method, resolved_url);

    let client = reqwest::Client::new();
    let request = match method.to_uppercase().as_str() {
        "GET" => client.get(&resolved_url),
        "POST" => {
            let mut req = client.post(&resolved_url);
            if let Some(body_data) = body {
                req = req.body(body_data);
            }
            req
        }
        "PUT" => {
            let mut req = client.put(&resolved_url);
            if let Some(body_data) = body {
                req = req.body(body_data);
            }
            req
        }
        "DELETE" => client.delete(&resolved_url),
        _ => return Err(format!("Unsupported HTTP method: {}", method)),
    };

    let response = request
        .send()
        .await
        .map_err(|e| format!("HTTP request failed: {}", e))?;

    let status = response.status().as_u16();
    let response_body = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response body: {}", e))?;

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 4: Store response in context
    // ═══════════════════════════════════════════════════════════════════════
    context.variables.insert(
        format!("{}_response", node.id),
        serde_json::json!({
            "status": status,
            "body": response_body
        }),
    );

    log::info!("API Call completed: {} (status: {})", resolved_url, status);

    Ok(serde_json::json!({
        "api_call": "completed",
        "url": resolved_url,
        "method": method,
        "status": status,
        "body": response_body
    }))
}

async fn execute_notification(
    node: &FlowNode,
    context: &mut ExecutionContext,
) -> Result<serde_json::Value, String> {
    let config = &node.data.config;

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 1: Extract notification details from extra config
    // ═══════════════════════════════════════════════════════════════════════
    let title = config
        .extra
        .get("title")
        .and_then(|v| v.as_str())
        .unwrap_or("Automation Notification");

    let message = config
        .extra
        .get("message")
        .and_then(|v| v.as_str())
        .unwrap_or("A workflow step completed");

    let notification_type = config
        .extra
        .get("type")
        .and_then(|v| v.as_str())
        .unwrap_or("info"); // info, success, warning, error

    // Variable substitution in title and message
    let mut resolved_title = title.to_string();
    let mut resolved_message = message.to_string();

    for (var_name, var_value) in &context.variables {
        let placeholder = format!("{{{{{}}}}}", var_name);
        if let Some(value_str) = var_value.as_str() {
            resolved_title = resolved_title.replace(&placeholder, value_str);
            resolved_message = resolved_message.replace(&placeholder, value_str);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 2: Log notification (in production, this would use Tauri's notification API)
    // ═══════════════════════════════════════════════════════════════════════
    match notification_type {
        "success" => log::info!("✅ Notification: {} - {}", resolved_title, resolved_message),
        "warning" => log::warn!("⚠️ Notification: {} - {}", resolved_title, resolved_message),
        "error" => log::error!("❌ Notification: {} - {}", resolved_title, resolved_message),
        _ => log::info!("📢 Notification: {} - {}", resolved_title, resolved_message),
    }

    // Store notification in context for tracking
    context.variables.insert(
        format!("{}_notification", node.id),
        serde_json::json!({
            "title": resolved_title,
            "message": resolved_message,
            "type": notification_type,
            "sent_at": chrono::Utc::now().to_rfc3339()
        }),
    );

    Ok(serde_json::json!({
        "notification": "sent",
        "title": resolved_title,
        "message": resolved_message,
        "type": notification_type
    }))
}

async fn execute_storage(
    node: &FlowNode,
    context: &mut ExecutionContext,
) -> Result<serde_json::Value, String> {
    let config = &node.data.config;

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 1: Get storage operation type
    // ═══════════════════════════════════════════════════════════════════════
    let operation = config
        .extra
        .get("operation")
        .and_then(|v| v.as_str())
        .ok_or("operation required in config.extra (get, set, delete)")?;

    let key = config
        .extra
        .get("key")
        .and_then(|v| v.as_str())
        .ok_or("key required in config.extra for storage operation")?;

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 2: Execute storage operation on context.storage
    // ═══════════════════════════════════════════════════════════════════════
    let result = match operation {
        "get" => {
            // Get value from storage
            let value = context
                .storage
                .get(key)
                .ok_or_else(|| format!("Key '{}' not found in storage", key))?
                .clone();

            // Store in variables for downstream nodes
            let default_var_name = format!("{}_value", node.id);
            let var_name = config
                .extra
                .get("output_var")
                .and_then(|v| v.as_str())
                .unwrap_or(&default_var_name);

            context
                .variables
                .insert(var_name.to_string(), value.clone());

            log::debug!("Storage GET: {} -> {}", key, var_name);

            serde_json::json!({
                "operation": "get",
                "key": key,
                "value": value,
                "output_var": var_name
            })
        }
        "set" => {
            // Get value from variables or config
            let value = if let Some(source_var) =
                config.extra.get("value_from_var").and_then(|v| v.as_str())
            {
                context
                    .variables
                    .get(source_var)
                    .ok_or_else(|| format!("Variable '{}' not found", source_var))?
                    .clone()
            } else if let Some(value_literal) = config.extra.get("value") {
                value_literal.clone()
            } else {
                return Err("value or value_from_var required for set operation".to_string());
            };

            // Store value
            context.storage.insert(key.to_string(), value.clone());

            log::debug!("Storage SET: {} = {:?}", key, value);

            serde_json::json!({
                "operation": "set",
                "key": key,
                "value": value
            })
        }
        "delete" => {
            // Delete key from storage
            let removed = context.storage.remove(key);

            log::debug!("Storage DELETE: {} (existed: {})", key, removed.is_some());

            serde_json::json!({
                "operation": "delete",
                "key": key,
                "existed": removed.is_some()
            })
        }
        _ => return Err(format!("Unknown storage operation: {}", operation)),
    };

    Ok(result)
}

// ============================================================================
// COMMANDS
// ============================================================================

#[tauri::command]
pub async fn automation_execute_flow(
    flow: Flow,
    state: State<'_, AutomationState>,
    browser: State<'_, Arc<BrowserService>>,
) -> Result<FlowExecution, String> {
    let execution_id = format!("exec_{}", chrono::Utc::now().timestamp_millis());
    let started_at = chrono::Utc::now().to_rfc3339();

    let mut execution = FlowExecution {
        id: execution_id.clone(),
        flow_id: flow.id.clone(),
        status: ExecutionStatus::Running,
        started_at: started_at.clone(),
        completed_at: None,
        duration: None,
        steps: Vec::new(),
        error: None,
    };

    // Store execution
    {
        let mut executions = state.executions.lock().unwrap();
        executions.insert(execution_id.clone(), execution.clone());
    }

    // Initialize browser tab for the flow
    let tab_id = browser
        .new_tab()
        .map_err(|e| format!("Failed to create browser tab: {}", e))?;

    // Build execution context with browser support
    let mut context = ExecutionContext::new(flow.variables.clone())
        .with_browser(browser.inner().clone(), tab_id.clone());

    // Sort nodes in topological order (simple BFS for now)
    let mut executed_nodes = std::collections::HashSet::new();
    let nodes_to_execute = flow.nodes.clone();

    // Find start nodes (trigger nodes or nodes without incoming edges)
    let nodes_with_incoming: std::collections::HashSet<String> =
        flow.edges.iter().map(|e| e.target.clone()).collect();

    let start_nodes: Vec<FlowNode> = nodes_to_execute
        .iter()
        .filter(|n| !nodes_with_incoming.contains(&n.id))
        .cloned()
        .collect();

    // Execute nodes
    for node in start_nodes {
        let step_start = chrono::Utc::now();

        let mut step = ExecutionStep {
            node_id: node.id.clone(),
            label: node.data.label.clone(),
            status: "running".to_string(),
            started_at: step_start.to_rfc3339(),
            completed_at: None,
            duration: None,
            output: None,
            error: None,
            retry_count: 0,
        };

        // Execute with retry logic
        let max_retries = flow.settings.max_retries;
        let mut retry_count = 0;
        let mut last_error = None;

        while retry_count <= max_retries {
            match execute_node(&node, &mut context).await {
                Ok(output) => {
                    context.node_outputs.insert(node.id.clone(), output.clone());
                    step.output = Some(output);
                    step.status = "success".to_string();
                    break;
                }
                Err(e) => {
                    last_error = Some(e.clone());
                    retry_count += 1;

                    if retry_count <= max_retries {
                        tokio::time::sleep(tokio::time::Duration::from_millis(
                            flow.settings.retry_delay,
                        ))
                        .await;
                    }
                }
            }
        }

        if let Some(error) = last_error {
            step.status = "error".to_string();
            step.error = Some(error.clone());

            if !flow.settings.continue_on_error {
                execution.status = ExecutionStatus::Failed;
                execution.error = Some(ExecutionError {
                    code: "NODE_EXECUTION_FAILED".to_string(),
                    message: error,
                    node_id: Some(node.id.clone()),
                    stack_trace: None,
                });
                break;
            }
        }

        let step_end = chrono::Utc::now();
        step.completed_at = Some(step_end.to_rfc3339());
        step.duration = Some((step_end - step_start).num_milliseconds() as u64);
        step.retry_count = retry_count;

        execution.steps.push(step);
        executed_nodes.insert(node.id.clone());
    }

    // Complete execution
    let completed_at = chrono::Utc::now();
    execution.completed_at = Some(completed_at.to_rfc3339());

    let started = chrono::DateTime::parse_from_rfc3339(&started_at)
        .map_err(|e| format!("Failed to parse start time: {}", e))?;
    let started_utc = started.with_timezone(&chrono::Utc);
    execution.duration = Some((completed_at - started_utc).num_milliseconds() as u64);

    if execution.status == ExecutionStatus::Running {
        execution.status = ExecutionStatus::Completed;
    }

    // Cleanup: close browser tab
    if let Err(e) = browser.close_tab(&tab_id) {
        eprintln!("Warning: Failed to close browser tab {}: {}", tab_id, e);
    }

    // Update stored execution
    {
        let mut executions = state.executions.lock().unwrap();
        executions.insert(execution_id.clone(), execution.clone());
    }

    Ok(execution)
}

#[tauri::command]
pub async fn automation_save_flow(
    flow: Flow,
    state: State<'_, AutomationState>,
) -> Result<String, String> {
    // Save to disk
    save_flow_to_disk(&flow)?;

    // Update in-memory state
    {
        let mut flows = state.flows.lock().unwrap();
        flows.insert(flow.id.clone(), flow.clone());
    }

    Ok(flow.id)
}

#[tauri::command]
pub async fn automation_load_flows(state: State<'_, AutomationState>) -> Result<Vec<Flow>, String> {
    let flows = load_flows_from_disk()?;

    // Update in-memory state
    {
        let mut flows_map = state.flows.lock().unwrap();
        flows_map.clear();
        for flow in flows.iter() {
            flows_map.insert(flow.id.clone(), flow.clone());
        }
    }

    Ok(flows)
}

#[tauri::command]
pub async fn automation_delete_flow(
    flow_id: String,
    state: State<'_, AutomationState>,
) -> Result<(), String> {
    // Delete from disk
    delete_flow_from_disk(&flow_id)?;

    // Remove from in-memory state
    {
        let mut flows = state.flows.lock().unwrap();
        flows.remove(&flow_id);
    }

    Ok(())
}

#[tauri::command]
pub async fn automation_start_recording(
    state: State<'_, AutomationState>,
) -> Result<String, String> {
    let session_id = format!("rec_{}", chrono::Utc::now().timestamp_millis());
    let started_at = chrono::Utc::now().timestamp_millis() as u64;

    let session = RecordingSession {
        id: session_id.clone(),
        started_at,
        actions: Vec::new(),
    };

    {
        let mut recording = state.recording_session.lock().unwrap();
        *recording = Some(session);
    }

    Ok(session_id)
}

#[tauri::command]
pub async fn automation_stop_recording(
    state: State<'_, AutomationState>,
) -> Result<Vec<RecordedAction>, String> {
    let mut recording = state.recording_session.lock().unwrap();

    match recording.take() {
        Some(session) => Ok(session.actions),
        None => Err("No recording session active".to_string()),
    }
}

#[tauri::command]
pub async fn automation_record_action(
    action: RecordedAction,
    state: State<'_, AutomationState>,
) -> Result<(), String> {
    let mut recording = state.recording_session.lock().unwrap();

    match recording.as_mut() {
        Some(session) => {
            session.actions.push(action);
            Ok(())
        }
        None => Err("No recording session active".to_string()),
    }
}
