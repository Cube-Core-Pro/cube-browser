// CUBE Engine DevTools Complete
// Network inspector, Console, Elements inspector, Performance profiler

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::RwLock;
use tauri::{AppHandle, Emitter, State};

// ============================================
// DevTools State
// ============================================

pub struct CubeDevToolsState {
    pub network_logs: RwLock<HashMap<String, Vec<NetworkRequest>>>,
    pub console_logs: RwLock<HashMap<String, Vec<ConsoleMessage>>>,
    pub dom_snapshots: RwLock<HashMap<String, DOMSnapshot>>,
    pub profiler_data: RwLock<HashMap<String, ProfilerSession>>,
    pub breakpoints: RwLock<HashMap<String, Vec<Breakpoint>>>,
    pub watches: RwLock<HashMap<String, Vec<WatchExpression>>>,
    pub config: RwLock<DevToolsConfig>,
}

impl Default for CubeDevToolsState {
    fn default() -> Self {
        Self {
            network_logs: RwLock::new(HashMap::new()),
            console_logs: RwLock::new(HashMap::new()),
            dom_snapshots: RwLock::new(HashMap::new()),
            profiler_data: RwLock::new(HashMap::new()),
            breakpoints: RwLock::new(HashMap::new()),
            watches: RwLock::new(HashMap::new()),
            config: RwLock::new(DevToolsConfig::default()),
        }
    }
}

// ============================================
// Network Inspector
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkRequest {
    pub id: String,
    pub tab_id: String,
    pub url: String,
    pub method: String,
    pub status: u16,
    pub status_text: String,
    pub request_headers: HashMap<String, String>,
    pub response_headers: HashMap<String, String>,
    pub request_body: Option<String>,
    pub response_body: Option<String>,
    pub response_size: u64,
    pub timing: NetworkTiming,
    pub initiator: RequestInitiator,
    pub resource_type: String,
    pub from_cache: bool,
    pub from_service_worker: bool,
    pub protocol: String,
    pub security_state: SecurityState,
    pub started_at: i64,
    pub completed_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct NetworkTiming {
    pub blocked: f64,
    pub dns: f64,
    pub connect: f64,
    pub ssl: f64,
    pub send: f64,
    pub wait: f64,
    pub receive: f64,
    pub total: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RequestInitiator {
    pub initiator_type: InitiatorType,
    pub url: Option<String>,
    pub line_number: Option<u32>,
    pub column_number: Option<u32>,
    pub stack_trace: Option<Vec<StackFrame>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum InitiatorType {
    #[default]
    Other,
    Parser,
    Script,
    Preload,
    SignedExchange,
    Preflight,
    Navigation,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StackFrame {
    pub function_name: String,
    pub script_id: String,
    pub url: String,
    pub line_number: u32,
    pub column_number: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum SecurityState {
    #[default]
    Unknown,
    Neutral,
    Insecure,
    Secure,
    InsecureBroken,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkFilter {
    pub resource_types: Option<Vec<String>>,
    pub status_codes: Option<Vec<u16>>,
    pub methods: Option<Vec<String>>,
    pub url_pattern: Option<String>,
    pub has_response_body: Option<bool>,
}

// ============================================
// Console
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConsoleMessage {
    pub id: String,
    pub tab_id: String,
    pub level: ConsoleLevel,
    pub message: String,
    pub source: ConsoleSource,
    pub url: Option<String>,
    pub line: Option<u32>,
    pub column: Option<u32>,
    pub stack_trace: Option<Vec<StackFrame>>,
    pub timestamp: i64,
    pub count: u32,
    pub parameters: Vec<ConsoleParameter>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum ConsoleLevel {
    #[default]
    Log,
    Debug,
    Info,
    Warning,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum ConsoleSource {
    #[default]
    JavaScript,
    Network,
    ConsoleAPI,
    Storage,
    Security,
    Violation,
    Intervention,
    Recommendation,
    Other,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConsoleParameter {
    pub param_type: String,
    pub value: String,
    pub preview: Option<String>,
}

// ============================================
// Elements Inspector (DOM)
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DOMSnapshot {
    pub tab_id: String,
    pub root: DOMNode,
    pub captured_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DOMNode {
    pub node_id: u32,
    pub node_type: u32,
    pub node_name: String,
    pub local_name: String,
    pub node_value: Option<String>,
    pub attributes: HashMap<String, String>,
    pub children: Vec<DOMNode>,
    pub computed_style: Option<HashMap<String, String>>,
    pub bounding_box: Option<BoundingBox>,
    pub is_visible: bool,
    pub pseudo_type: Option<String>,
    pub shadow_root_type: Option<String>,
    pub content_document: Option<Box<DOMNode>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct BoundingBox {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DOMModification {
    pub node_id: u32,
    pub modification_type: DOMModificationType,
    pub attribute_name: Option<String>,
    pub new_value: Option<String>,
    pub timestamp: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DOMModificationType {
    AttributeModified,
    AttributeRemoved,
    CharacterDataModified,
    ChildNodeInserted,
    ChildNodeRemoved,
    SubtreeModified,
}

// ============================================
// Performance Profiler
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfilerSession {
    pub id: String,
    pub tab_id: String,
    pub profile_type: ProfileType,
    pub started_at: i64,
    pub ended_at: Option<i64>,
    pub samples: Vec<ProfileSample>,
    pub call_tree: Option<CallTreeNode>,
    pub flame_graph: Option<Vec<FlameGraphEntry>>,
    pub summary: ProfileSummary,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum ProfileType {
    #[default]
    CPU,
    Memory,
    Timeline,
    Coverage,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileSample {
    pub timestamp: f64,
    pub stack_trace: Vec<u32>,
    pub duration: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CallTreeNode {
    pub id: u32,
    pub function_name: String,
    pub url: String,
    pub line_number: u32,
    pub column_number: u32,
    pub self_time: f64,
    pub total_time: f64,
    pub hit_count: u32,
    pub children: Vec<CallTreeNode>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlameGraphEntry {
    pub name: String,
    pub value: f64,
    pub depth: u32,
    pub start: f64,
    pub children: Vec<FlameGraphEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ProfileSummary {
    pub total_time_ms: f64,
    pub scripting_time_ms: f64,
    pub rendering_time_ms: f64,
    pub painting_time_ms: f64,
    pub idle_time_ms: f64,
    pub gc_time_ms: f64,
    pub function_count: u32,
    pub sample_count: u32,
}

// ============================================
// Debugger
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Breakpoint {
    pub id: String,
    pub tab_id: String,
    pub url: String,
    pub line_number: u32,
    pub column_number: Option<u32>,
    pub condition: Option<String>,
    pub is_enabled: bool,
    pub hit_count: u32,
    pub breakpoint_type: BreakpointType,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum BreakpointType {
    #[default]
    Line,
    Conditional,
    LogPoint,
    DOM,
    XHR,
    EventListener,
    Exception,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WatchExpression {
    pub id: String,
    pub expression: String,
    pub result: Option<String>,
    pub is_error: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DebuggerPausedState {
    pub tab_id: String,
    pub reason: PauseReason,
    pub call_frames: Vec<CallFrame>,
    pub hit_breakpoints: Vec<String>,
    pub data: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum PauseReason {
    #[default]
    Breakpoint,
    Exception,
    Assert,
    DebugCommand,
    DOM,
    EventListener,
    XHR,
    PromiseRejection,
    OOM,
    Other,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CallFrame {
    pub call_frame_id: String,
    pub function_name: String,
    pub location: SourceLocation,
    pub scope_chain: Vec<Scope>,
    pub this_object: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SourceLocation {
    pub script_id: String,
    pub line_number: u32,
    pub column_number: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Scope {
    pub scope_type: ScopeType,
    pub name: Option<String>,
    pub object: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum ScopeType {
    #[default]
    Global,
    Local,
    With,
    Closure,
    Catch,
    Block,
    Script,
    Eval,
    Module,
    WasmExpressionStack,
}

// ============================================
// DevTools Config
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DevToolsConfig {
    pub network_log_limit: usize,
    pub console_log_limit: usize,
    pub preserve_log: bool,
    pub disable_cache: bool,
    pub emulate_offline: bool,
    pub throttle_preset: Option<ThrottlePreset>,
    pub show_timestamps: bool,
    pub group_similar: bool,
    pub verbose_logging: bool,
}

impl Default for DevToolsConfig {
    fn default() -> Self {
        Self {
            network_log_limit: 1000,
            console_log_limit: 1000,
            preserve_log: false,
            disable_cache: false,
            emulate_offline: false,
            throttle_preset: None,
            show_timestamps: true,
            group_similar: true,
            verbose_logging: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ThrottlePreset {
    Slow3G,
    Fast3G,
    Offline,
    Custom { download_kbps: u32, upload_kbps: u32, latency_ms: u32 },
}

// ============================================
// Tauri Commands - Network Inspector
// ============================================

#[tauri::command]
pub async fn network_log_request(
    state: State<'_, CubeDevToolsState>,
    app: AppHandle,
    request: NetworkRequest,
) -> Result<(), String> {
    let mut logs = state.network_logs.write().map_err(|e| format!("Lock error: {}", e))?;
    let config = state.config.read().map_err(|e| format!("Lock error: {}", e))?;
    
    let tab_logs = logs.entry(request.tab_id.clone()).or_insert_with(Vec::new);
    
    if tab_logs.len() >= config.network_log_limit {
        tab_logs.remove(0);
    }
    
    tab_logs.push(request.clone());
    
    let _ = app.emit("network-request-logged", &request);
    
    Ok(())
}

#[tauri::command]
pub async fn network_get_logs(
    state: State<'_, CubeDevToolsState>,
    tab_id: String,
    filter: Option<NetworkFilter>,
) -> Result<Vec<NetworkRequest>, String> {
    let logs = state.network_logs.read().map_err(|e| format!("Lock error: {}", e))?;
    
    let tab_logs = logs.get(&tab_id).cloned().unwrap_or_default();
    
    if let Some(f) = filter {
        let filtered: Vec<NetworkRequest> = tab_logs.into_iter().filter(|req| {
            let mut matches = true;
            
            if let Some(ref types) = f.resource_types {
                matches = matches && types.contains(&req.resource_type);
            }
            if let Some(ref codes) = f.status_codes {
                matches = matches && codes.contains(&req.status);
            }
            if let Some(ref methods) = f.methods {
                matches = matches && methods.contains(&req.method);
            }
            if let Some(ref pattern) = f.url_pattern {
                matches = matches && req.url.contains(pattern);
            }
            
            matches
        }).collect();
        
        return Ok(filtered);
    }
    
    Ok(tab_logs)
}

#[tauri::command]
pub async fn network_clear_logs(
    state: State<'_, CubeDevToolsState>,
    tab_id: String,
) -> Result<(), String> {
    let mut logs = state.network_logs.write().map_err(|e| format!("Lock error: {}", e))?;
    logs.remove(&tab_id);
    Ok(())
}

#[tauri::command]
pub async fn network_get_request(
    state: State<'_, CubeDevToolsState>,
    tab_id: String,
    request_id: String,
) -> Result<Option<NetworkRequest>, String> {
    let logs = state.network_logs.read().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(tab_logs) = logs.get(&tab_id) {
        return Ok(tab_logs.iter().find(|r| r.id == request_id).cloned());
    }
    
    Ok(None)
}

// ============================================
// Tauri Commands - Console
// ============================================

#[tauri::command]
pub async fn console_log_message(
    state: State<'_, CubeDevToolsState>,
    app: AppHandle,
    message: ConsoleMessage,
) -> Result<(), String> {
    let mut logs = state.console_logs.write().map_err(|e| format!("Lock error: {}", e))?;
    let config = state.config.read().map_err(|e| format!("Lock error: {}", e))?;
    
    let tab_logs = logs.entry(message.tab_id.clone()).or_insert_with(Vec::new);
    
    if config.group_similar {
        if let Some(last) = tab_logs.last_mut() {
            if last.message == message.message && last.level.clone() as u8 == message.level.clone() as u8 {
                last.count += 1;
                let updated = last.clone();
                let _ = app.emit("console-message-updated", updated);
                return Ok(());
            }
        }
    }
    
    if tab_logs.len() >= config.console_log_limit {
        tab_logs.remove(0);
    }
    
    tab_logs.push(message.clone());
    
    let _ = app.emit("console-message-logged", &message);
    
    Ok(())
}

#[tauri::command]
pub async fn console_get_logs(
    state: State<'_, CubeDevToolsState>,
    tab_id: String,
    level: Option<ConsoleLevel>,
) -> Result<Vec<ConsoleMessage>, String> {
    let logs = state.console_logs.read().map_err(|e| format!("Lock error: {}", e))?;
    
    let tab_logs = logs.get(&tab_id).cloned().unwrap_or_default();
    
    if let Some(lvl) = level {
        let filtered: Vec<ConsoleMessage> = tab_logs.into_iter()
            .filter(|m| std::mem::discriminant(&m.level) == std::mem::discriminant(&lvl))
            .collect();
        return Ok(filtered);
    }
    
    Ok(tab_logs)
}

#[tauri::command]
pub async fn console_clear(
    state: State<'_, CubeDevToolsState>,
    tab_id: String,
) -> Result<(), String> {
    let mut logs = state.console_logs.write().map_err(|e| format!("Lock error: {}", e))?;
    logs.remove(&tab_id);
    Ok(())
}

#[tauri::command]
pub async fn console_execute(
    _state: State<'_, CubeDevToolsState>,
    app: AppHandle,
    tab_id: String,
    expression: String,
) -> Result<String, String> {
    let _ = app.emit("console-execute-request", serde_json::json!({
        "tabId": tab_id,
        "expression": expression
    }));
    
    Ok("Execution requested".to_string())
}

// ============================================
// Tauri Commands - Elements Inspector
// ============================================

#[tauri::command]
pub async fn dom_capture_snapshot(
    state: State<'_, CubeDevToolsState>,
    tab_id: String,
    root: DOMNode,
) -> Result<(), String> {
    let snapshot = DOMSnapshot {
        tab_id: tab_id.clone(),
        root,
        captured_at: chrono::Utc::now().timestamp_millis(),
    };
    
    let mut snapshots = state.dom_snapshots.write().map_err(|e| format!("Lock error: {}", e))?;
    snapshots.insert(tab_id, snapshot);
    
    Ok(())
}

#[tauri::command]
pub async fn dom_get_snapshot(
    state: State<'_, CubeDevToolsState>,
    tab_id: String,
) -> Result<Option<DOMSnapshot>, String> {
    let snapshots = state.dom_snapshots.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(snapshots.get(&tab_id).cloned())
}

#[tauri::command]
pub async fn dom_get_node(
    state: State<'_, CubeDevToolsState>,
    tab_id: String,
    node_id: u32,
) -> Result<Option<DOMNode>, String> {
    let snapshots = state.dom_snapshots.read().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(snapshot) = snapshots.get(&tab_id) {
        fn find_node(node: &DOMNode, target_id: u32) -> Option<DOMNode> {
            if node.node_id == target_id {
                return Some(node.clone());
            }
            for child in &node.children {
                if let Some(found) = find_node(child, target_id) {
                    return Some(found);
                }
            }
            None
        }
        
        return Ok(find_node(&snapshot.root, node_id));
    }
    
    Ok(None)
}

#[tauri::command]
pub async fn dom_highlight_node(
    _state: State<'_, CubeDevToolsState>,
    app: AppHandle,
    tab_id: String,
    node_id: u32,
) -> Result<(), String> {
    let _ = app.emit("dom-highlight-node", serde_json::json!({
        "tabId": tab_id,
        "nodeId": node_id
    }));
    
    Ok(())
}

#[tauri::command]
pub async fn dom_set_attribute(
    _state: State<'_, CubeDevToolsState>,
    app: AppHandle,
    tab_id: String,
    node_id: u32,
    name: String,
    value: String,
) -> Result<(), String> {
    let _ = app.emit("dom-set-attribute", serde_json::json!({
        "tabId": tab_id,
        "nodeId": node_id,
        "name": name,
        "value": value
    }));
    
    Ok(())
}

// ============================================
// Tauri Commands - Performance Profiler
// ============================================

#[tauri::command]
pub async fn profiler_start(
    state: State<'_, CubeDevToolsState>,
    app: AppHandle,
    tab_id: String,
    profile_type: Option<ProfileType>,
) -> Result<String, String> {
    let session_id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp_millis();
    
    let session = ProfilerSession {
        id: session_id.clone(),
        tab_id: tab_id.clone(),
        profile_type: profile_type.unwrap_or_default(),
        started_at: now,
        ended_at: None,
        samples: Vec::new(),
        call_tree: None,
        flame_graph: None,
        summary: ProfileSummary::default(),
    };
    
    let mut data = state.profiler_data.write().map_err(|e| format!("Lock error: {}", e))?;
    data.insert(session_id.clone(), session);
    
    let _ = app.emit("profiler-started", serde_json::json!({
        "tabId": tab_id,
        "sessionId": session_id
    }));
    
    Ok(session_id)
}

#[tauri::command]
pub async fn profiler_stop(
    state: State<'_, CubeDevToolsState>,
    app: AppHandle,
    session_id: String,
) -> Result<ProfilerSession, String> {
    let mut data = state.profiler_data.write().map_err(|e| format!("Lock error: {}", e))?;
    
    let session = data.get_mut(&session_id).ok_or("Session not found")?;
    session.ended_at = Some(chrono::Utc::now().timestamp_millis());
    
    let result = session.clone();
    
    let _ = app.emit("profiler-stopped", &result);
    
    Ok(result)
}

#[tauri::command]
pub async fn profiler_add_sample(
    state: State<'_, CubeDevToolsState>,
    session_id: String,
    sample: ProfileSample,
) -> Result<(), String> {
    let mut data = state.profiler_data.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(session) = data.get_mut(&session_id) {
        session.samples.push(sample);
        session.summary.sample_count += 1;
    }
    
    Ok(())
}

#[tauri::command]
pub async fn profiler_get_session(
    state: State<'_, CubeDevToolsState>,
    session_id: String,
) -> Result<Option<ProfilerSession>, String> {
    let data = state.profiler_data.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(data.get(&session_id).cloned())
}

// ============================================
// Tauri Commands - Debugger
// ============================================

#[tauri::command]
pub async fn debugger_set_breakpoint(
    state: State<'_, CubeDevToolsState>,
    app: AppHandle,
    breakpoint: Breakpoint,
) -> Result<String, String> {
    let mut breakpoints = state.breakpoints.write().map_err(|e| format!("Lock error: {}", e))?;
    
    let tab_bp = breakpoints.entry(breakpoint.tab_id.clone()).or_insert_with(Vec::new);
    tab_bp.push(breakpoint.clone());
    
    let _ = app.emit("breakpoint-set", &breakpoint);
    
    Ok(breakpoint.id)
}

#[tauri::command]
pub async fn debugger_remove_breakpoint(
    state: State<'_, CubeDevToolsState>,
    app: AppHandle,
    tab_id: String,
    breakpoint_id: String,
) -> Result<(), String> {
    let mut breakpoints = state.breakpoints.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(tab_bp) = breakpoints.get_mut(&tab_id) {
        tab_bp.retain(|bp| bp.id != breakpoint_id);
    }
    
    let _ = app.emit("breakpoint-removed", serde_json::json!({
        "tabId": tab_id,
        "breakpointId": breakpoint_id
    }));
    
    Ok(())
}

#[tauri::command]
pub async fn debugger_get_breakpoints(
    state: State<'_, CubeDevToolsState>,
    tab_id: String,
) -> Result<Vec<Breakpoint>, String> {
    let breakpoints = state.breakpoints.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(breakpoints.get(&tab_id).cloned().unwrap_or_default())
}

#[tauri::command]
pub async fn debugger_add_watch(
    state: State<'_, CubeDevToolsState>,
    tab_id: String,
    expression: String,
) -> Result<String, String> {
    let watch_id = uuid::Uuid::new_v4().to_string();
    
    let watch = WatchExpression {
        id: watch_id.clone(),
        expression,
        result: None,
        is_error: false,
    };
    
    let mut watches = state.watches.write().map_err(|e| format!("Lock error: {}", e))?;
    let tab_watches = watches.entry(tab_id).or_insert_with(Vec::new);
    tab_watches.push(watch);
    
    Ok(watch_id)
}

#[tauri::command]
pub async fn debugger_remove_watch(
    state: State<'_, CubeDevToolsState>,
    tab_id: String,
    watch_id: String,
) -> Result<(), String> {
    let mut watches = state.watches.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(tab_watches) = watches.get_mut(&tab_id) {
        tab_watches.retain(|w| w.id != watch_id);
    }
    
    Ok(())
}

#[tauri::command]
pub async fn debugger_resume(
    _state: State<'_, CubeDevToolsState>,
    app: AppHandle,
    tab_id: String,
) -> Result<(), String> {
    let _ = app.emit("debugger-resume", serde_json::json!({ "tabId": tab_id }));
    Ok(())
}

#[tauri::command]
pub async fn debugger_step_over(
    _state: State<'_, CubeDevToolsState>,
    app: AppHandle,
    tab_id: String,
) -> Result<(), String> {
    let _ = app.emit("debugger-step-over", serde_json::json!({ "tabId": tab_id }));
    Ok(())
}

#[tauri::command]
pub async fn debugger_step_into(
    _state: State<'_, CubeDevToolsState>,
    app: AppHandle,
    tab_id: String,
) -> Result<(), String> {
    let _ = app.emit("debugger-step-into", serde_json::json!({ "tabId": tab_id }));
    Ok(())
}

#[tauri::command]
pub async fn debugger_step_out(
    _state: State<'_, CubeDevToolsState>,
    app: AppHandle,
    tab_id: String,
) -> Result<(), String> {
    let _ = app.emit("debugger-step-out", serde_json::json!({ "tabId": tab_id }));
    Ok(())
}

// ============================================
// Tauri Commands - DevTools Config
// ============================================

#[tauri::command]
pub async fn devtools_get_config(
    state: State<'_, CubeDevToolsState>,
) -> Result<DevToolsConfig, String> {
    let config = state.config.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(config.clone())
}

#[tauri::command]
pub async fn devtools_set_config(
    state: State<'_, CubeDevToolsState>,
    config: DevToolsConfig,
) -> Result<(), String> {
    let mut current = state.config.write().map_err(|e| format!("Lock error: {}", e))?;
    *current = config;
    Ok(())
}

#[tauri::command]
pub async fn devtools_set_throttling(
    state: State<'_, CubeDevToolsState>,
    preset: Option<ThrottlePreset>,
) -> Result<(), String> {
    let mut config = state.config.write().map_err(|e| format!("Lock error: {}", e))?;
    config.throttle_preset = preset;
    Ok(())
}
