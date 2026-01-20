// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY & COMPLIANCE COMMANDS - Enterprise Security Operations Center
// ═══════════════════════════════════════════════════════════════════════════════
//
// This module implements enterprise security and compliance commands:
// - Security alerts and incidents
// - Detection rules and playbooks
// - SIEM integration
// - Compliance framework management
// - Evidence collection and audit
//
// ═══════════════════════════════════════════════════════════════════════════════

#![allow(unused_variables)]

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::State;

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY TYPES
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityAlert {
    pub id: String,
    pub title: String,
    pub description: String,
    pub severity: AlertSeverity,
    pub status: AlertStatus,
    pub source: String,
    pub source_ip: Option<String>,
    pub target_resource: Option<String>,
    pub detection_rule_id: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
    pub acknowledged_at: Option<i64>,
    pub acknowledged_by: Option<String>,
    pub resolved_at: Option<i64>,
    pub resolved_by: Option<String>,
    pub notes: Vec<AlertNote>,
    pub related_events: Vec<String>,
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AlertSeverity {
    Critical,
    High,
    Medium,
    Low,
    Informational,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AlertStatus {
    Open,
    Acknowledged,
    Investigating,
    Resolved,
    FalsePositive,
    Escalated,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertNote {
    pub id: String,
    pub content: String,
    pub author: String,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityEvent {
    pub id: String,
    pub event_type: String,
    pub timestamp: i64,
    pub source: String,
    pub source_ip: Option<String>,
    pub user_id: Option<String>,
    pub resource: Option<String>,
    pub action: String,
    pub outcome: EventOutcome,
    pub details: HashMap<String, serde_json::Value>,
    pub raw_log: Option<String>,
    pub acknowledged: bool,
    pub acknowledged_by: Option<String>,
    pub acknowledged_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum EventOutcome {
    Success,
    Failure,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityIncident {
    pub id: String,
    pub title: String,
    pub description: String,
    pub severity: AlertSeverity,
    pub status: IncidentStatus,
    pub assigned_to: Option<String>,
    pub team: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
    pub closed_at: Option<i64>,
    pub closed_by: Option<String>,
    pub resolution: Option<String>,
    pub related_alerts: Vec<String>,
    pub timeline: Vec<TimelineEntry>,
    pub impact_assessment: Option<ImpactAssessment>,
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum IncidentStatus {
    New,
    Triaging,
    Investigating,
    Containing,
    Eradicating,
    Recovering,
    Closed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimelineEntry {
    pub id: String,
    pub timestamp: i64,
    pub entry_type: String,
    pub description: String,
    pub author: String,
    pub data: Option<HashMap<String, serde_json::Value>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImpactAssessment {
    pub affected_systems: Vec<String>,
    pub affected_users: i32,
    pub data_breach: bool,
    pub estimated_cost: Option<f64>,
    pub business_impact: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetectionRule {
    pub id: String,
    pub name: String,
    pub description: String,
    pub category: String,
    pub severity: AlertSeverity,
    pub enabled: bool,
    pub rule_type: RuleType,
    pub query: String,
    pub conditions: Vec<RuleCondition>,
    pub actions: Vec<RuleAction>,
    pub cooldown_minutes: i32,
    pub last_triggered_at: Option<i64>,
    pub trigger_count: i64,
    pub false_positive_count: i64,
    pub created_at: i64,
    pub updated_at: i64,
    pub created_by: String,
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RuleType {
    Threshold,
    Anomaly,
    Correlation,
    Pattern,
    Behavioral,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuleCondition {
    pub field: String,
    pub operator: String,
    pub value: serde_json::Value,
    pub logical_operator: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuleAction {
    pub action_type: ActionType,
    pub config: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ActionType {
    CreateAlert,
    SendEmail,
    SendSlack,
    RunPlaybook,
    BlockIp,
    DisableUser,
    Webhook,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityPlaybook {
    pub id: String,
    pub name: String,
    pub description: String,
    pub category: String,
    pub trigger_type: PlaybookTrigger,
    pub steps: Vec<PlaybookStep>,
    pub enabled: bool,
    pub execution_count: i64,
    pub last_executed_at: Option<i64>,
    pub avg_execution_time_seconds: f64,
    pub created_at: i64,
    pub updated_at: i64,
    pub created_by: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PlaybookTrigger {
    Manual,
    Alert,
    Schedule,
    Webhook,
    Event,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlaybookStep {
    pub id: String,
    pub order: i32,
    pub name: String,
    pub step_type: StepType,
    pub config: HashMap<String, serde_json::Value>,
    pub on_failure: OnFailure,
    pub timeout_seconds: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum StepType {
    Action,
    Condition,
    Parallel,
    Wait,
    Human,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum OnFailure {
    Continue,
    Stop,
    Retry,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlaybookExecution {
    pub id: String,
    pub playbook_id: String,
    pub status: ExecutionStatus,
    pub trigger_source: String,
    pub started_at: i64,
    pub completed_at: Option<i64>,
    pub current_step: i32,
    pub step_results: Vec<StepResult>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ExecutionStatus {
    Running,
    Completed,
    Failed,
    Cancelled,
    WaitingApproval,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StepResult {
    pub step_id: String,
    pub status: ExecutionStatus,
    pub started_at: i64,
    pub completed_at: Option<i64>,
    pub output: Option<serde_json::Value>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SIEMIntegration {
    pub id: String,
    pub name: String,
    pub siem_type: SIEMType,
    pub enabled: bool,
    pub endpoint: String,
    pub api_key: String,
    pub event_types: Vec<String>,
    pub last_sync_at: Option<i64>,
    pub events_sent: i64,
    pub last_error: Option<String>,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SIEMType {
    Splunk,
    ElasticSIEM,
    Sentinel,
    QRadar,
    Chronicle,
    Custom,
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPLIANCE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComplianceFramework {
    pub id: String,
    pub name: String,
    pub description: String,
    pub version: String,
    pub framework_type: FrameworkType,
    pub enabled: bool,
    pub requirements: Vec<ComplianceRequirement>,
    pub overall_score: f64,
    pub last_assessed_at: Option<i64>,
    pub next_assessment_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum FrameworkType {
    Soc2,
    Gdpr,
    Hipaa,
    Pci,
    Iso27001,
    Nist,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComplianceRequirement {
    pub id: String,
    pub code: String,
    pub title: String,
    pub description: String,
    pub category: String,
    pub status: RequirementStatus,
    pub evidence_ids: Vec<String>,
    pub notes: Option<String>,
    pub due_date: Option<i64>,
    pub assigned_to: Option<String>,
    pub last_reviewed_at: Option<i64>,
    pub reviewed_by: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RequirementStatus {
    NotStarted,
    InProgress,
    Compliant,
    NonCompliant,
    NotApplicable,
    NeedsReview,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComplianceEvidence {
    pub id: String,
    pub requirement_id: String,
    pub title: String,
    pub description: String,
    pub evidence_type: EvidenceType,
    pub file_url: Option<String>,
    pub file_name: Option<String>,
    pub file_size: Option<i64>,
    pub content: Option<String>,
    pub collected_at: i64,
    pub collected_by: String,
    pub expires_at: Option<i64>,
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum EvidenceType {
    Document,
    Screenshot,
    Log,
    Configuration,
    Report,
    Attestation,
    Other,
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════════════

pub struct SecurityComplianceState {
    pub alerts: Arc<Mutex<HashMap<String, SecurityAlert>>>,
    pub events: Arc<Mutex<HashMap<String, SecurityEvent>>>,
    pub incidents: Arc<Mutex<HashMap<String, SecurityIncident>>>,
    pub detection_rules: Arc<Mutex<HashMap<String, DetectionRule>>>,
    pub playbooks: Arc<Mutex<HashMap<String, SecurityPlaybook>>>,
    pub playbook_executions: Arc<Mutex<HashMap<String, PlaybookExecution>>>,
    pub siem_integrations: Arc<Mutex<HashMap<String, SIEMIntegration>>>,
    pub frameworks: Arc<Mutex<HashMap<String, ComplianceFramework>>>,
    pub evidence: Arc<Mutex<HashMap<String, ComplianceEvidence>>>,
}

impl SecurityComplianceState {
    pub fn new() -> Self {
        Self {
            alerts: Arc::new(Mutex::new(HashMap::new())),
            events: Arc::new(Mutex::new(HashMap::new())),
            incidents: Arc::new(Mutex::new(HashMap::new())),
            detection_rules: Arc::new(Mutex::new(HashMap::new())),
            playbooks: Arc::new(Mutex::new(HashMap::new())),
            playbook_executions: Arc::new(Mutex::new(HashMap::new())),
            siem_integrations: Arc::new(Mutex::new(HashMap::new())),
            frameworks: Arc::new(Mutex::new(HashMap::new())),
            evidence: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

impl Default for SecurityComplianceState {
    fn default() -> Self {
        Self::new()
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY ALERT COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

#[tauri::command]
pub async fn security_create_alert(
    state: State<'_, SecurityComplianceState>,
    alert: SecurityAlert,
) -> Result<String, String> {
    let mut alerts = state.alerts.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    let id = alert.id.clone();
    alerts.insert(id.clone(), alert);
    
    Ok(id)
}

#[tauri::command]
pub async fn security_get_alert(
    state: State<'_, SecurityComplianceState>,
    alert_id: String,
) -> Result<SecurityAlert, String> {
    let alerts = state.alerts.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    alerts.get(&alert_id)
        .cloned()
        .ok_or_else(|| format!("Alert not found: {}", alert_id))
}

#[tauri::command]
pub async fn security_list_alerts(
    state: State<'_, SecurityComplianceState>,
    status: Option<AlertStatus>,
    severity: Option<AlertSeverity>,
) -> Result<Vec<SecurityAlert>, String> {
    let alerts = state.alerts.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    Ok(alerts.values()
        .filter(|a| {
            let status_match = status.as_ref()
                .map(|s| std::mem::discriminant(&a.status) == std::mem::discriminant(s))
                .unwrap_or(true);
            let severity_match = severity.as_ref()
                .map(|s| std::mem::discriminant(&a.severity) == std::mem::discriminant(s))
                .unwrap_or(true);
            status_match && severity_match
        })
        .cloned()
        .collect())
}

#[tauri::command]
pub async fn security_acknowledge_alert(
    state: State<'_, SecurityComplianceState>,
    alert_id: String,
    user_id: String,
) -> Result<SecurityAlert, String> {
    let mut alerts = state.alerts.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    let alert = alerts.get_mut(&alert_id)
        .ok_or_else(|| format!("Alert not found: {}", alert_id))?;
    
    alert.status = AlertStatus::Acknowledged;
    alert.acknowledged_at = Some(chrono::Utc::now().timestamp());
    alert.acknowledged_by = Some(user_id);
    alert.updated_at = chrono::Utc::now().timestamp();
    
    Ok(alert.clone())
}

#[tauri::command]
pub async fn security_add_alert_note(
    state: State<'_, SecurityComplianceState>,
    alert_id: String,
    content: String,
    author: String,
) -> Result<SecurityAlert, String> {
    let mut alerts = state.alerts.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    let alert = alerts.get_mut(&alert_id)
        .ok_or_else(|| format!("Alert not found: {}", alert_id))?;
    
    alert.notes.push(AlertNote {
        id: format!("note_{}", chrono::Utc::now().timestamp_millis()),
        content,
        author,
        created_at: chrono::Utc::now().timestamp(),
    });
    alert.updated_at = chrono::Utc::now().timestamp();
    
    Ok(alert.clone())
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY EVENT COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

#[tauri::command]
pub async fn security_acknowledge_event(
    state: State<'_, SecurityComplianceState>,
    event_id: String,
    user_id: String,
) -> Result<SecurityEvent, String> {
    let mut events = state.events.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    let event = events.get_mut(&event_id)
        .ok_or_else(|| format!("Event not found: {}", event_id))?;
    
    event.acknowledged = true;
    event.acknowledged_by = Some(user_id);
    event.acknowledged_at = Some(chrono::Utc::now().timestamp());
    
    Ok(event.clone())
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY INCIDENT COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

#[tauri::command]
pub async fn security_create_incident(
    state: State<'_, SecurityComplianceState>,
    incident: SecurityIncident,
) -> Result<String, String> {
    let mut incidents = state.incidents.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    let id = incident.id.clone();
    incidents.insert(id.clone(), incident);
    
    Ok(id)
}

#[tauri::command]
pub async fn security_get_incident(
    state: State<'_, SecurityComplianceState>,
    incident_id: String,
) -> Result<SecurityIncident, String> {
    let incidents = state.incidents.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    incidents.get(&incident_id)
        .cloned()
        .ok_or_else(|| format!("Incident not found: {}", incident_id))
}

#[tauri::command]
pub async fn security_assign_incident(
    state: State<'_, SecurityComplianceState>,
    incident_id: String,
    user_id: String,
) -> Result<SecurityIncident, String> {
    let mut incidents = state.incidents.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    let incident = incidents.get_mut(&incident_id)
        .ok_or_else(|| format!("Incident not found: {}", incident_id))?;
    
    incident.assigned_to = Some(user_id.clone());
    incident.updated_at = chrono::Utc::now().timestamp();
    
    incident.timeline.push(TimelineEntry {
        id: format!("tl_{}", chrono::Utc::now().timestamp_millis()),
        timestamp: chrono::Utc::now().timestamp(),
        entry_type: "assignment".to_string(),
        description: format!("Incident assigned to {}", user_id),
        author: "system".to_string(),
        data: None,
    });
    
    Ok(incident.clone())
}

#[tauri::command]
pub async fn security_close_incident(
    state: State<'_, SecurityComplianceState>,
    incident_id: String,
    user_id: String,
    resolution: String,
) -> Result<SecurityIncident, String> {
    let mut incidents = state.incidents.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    let incident = incidents.get_mut(&incident_id)
        .ok_or_else(|| format!("Incident not found: {}", incident_id))?;
    
    incident.status = IncidentStatus::Closed;
    incident.closed_at = Some(chrono::Utc::now().timestamp());
    incident.closed_by = Some(user_id.clone());
    incident.resolution = Some(resolution.clone());
    incident.updated_at = chrono::Utc::now().timestamp();
    
    incident.timeline.push(TimelineEntry {
        id: format!("tl_{}", chrono::Utc::now().timestamp_millis()),
        timestamp: chrono::Utc::now().timestamp(),
        entry_type: "closure".to_string(),
        description: format!("Incident closed by {}. Resolution: {}", user_id, resolution),
        author: user_id,
        data: None,
    });
    
    Ok(incident.clone())
}

#[tauri::command]
pub async fn security_add_timeline_entry(
    state: State<'_, SecurityComplianceState>,
    incident_id: String,
    entry: TimelineEntry,
) -> Result<SecurityIncident, String> {
    let mut incidents = state.incidents.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    let incident = incidents.get_mut(&incident_id)
        .ok_or_else(|| format!("Incident not found: {}", incident_id))?;
    
    incident.timeline.push(entry);
    incident.updated_at = chrono::Utc::now().timestamp();
    
    Ok(incident.clone())
}

// ═══════════════════════════════════════════════════════════════════════════════
// DETECTION RULE COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

#[tauri::command]
pub async fn security_create_detection_rule(
    state: State<'_, SecurityComplianceState>,
    rule: DetectionRule,
) -> Result<String, String> {
    let mut rules = state.detection_rules.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    let id = rule.id.clone();
    rules.insert(id.clone(), rule);
    
    Ok(id)
}

#[tauri::command]
pub async fn security_get_detection_rule(
    state: State<'_, SecurityComplianceState>,
    rule_id: String,
) -> Result<DetectionRule, String> {
    let rules = state.detection_rules.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    rules.get(&rule_id)
        .cloned()
        .ok_or_else(|| format!("Rule not found: {}", rule_id))
}

#[tauri::command]
pub async fn security_list_detection_rules(
    state: State<'_, SecurityComplianceState>,
) -> Result<Vec<DetectionRule>, String> {
    let rules = state.detection_rules.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    Ok(rules.values().cloned().collect())
}

#[tauri::command]
pub async fn security_delete_detection_rule(
    state: State<'_, SecurityComplianceState>,
    rule_id: String,
) -> Result<(), String> {
    let mut rules = state.detection_rules.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    rules.remove(&rule_id)
        .ok_or_else(|| format!("Rule not found: {}", rule_id))?;
    
    Ok(())
}

#[tauri::command]
pub async fn security_import_rules(
    state: State<'_, SecurityComplianceState>,
    rules_json: String,
) -> Result<i32, String> {
    let new_rules: Vec<DetectionRule> = serde_json::from_str(&rules_json)
        .map_err(|e| format!("Failed to parse rules: {}", e))?;
    
    let mut rules = state.detection_rules.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    let count = new_rules.len() as i32;
    for rule in new_rules {
        rules.insert(rule.id.clone(), rule);
    }
    
    Ok(count)
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLAYBOOK COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

#[tauri::command]
pub async fn security_create_playbook(
    state: State<'_, SecurityComplianceState>,
    playbook: SecurityPlaybook,
) -> Result<String, String> {
    let mut playbooks = state.playbooks.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    let id = playbook.id.clone();
    playbooks.insert(id.clone(), playbook);
    
    Ok(id)
}

#[tauri::command]
pub async fn security_get_playbook(
    state: State<'_, SecurityComplianceState>,
    playbook_id: String,
) -> Result<SecurityPlaybook, String> {
    let playbooks = state.playbooks.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    playbooks.get(&playbook_id)
        .cloned()
        .ok_or_else(|| format!("Playbook not found: {}", playbook_id))
}

#[tauri::command]
pub async fn security_list_playbooks(
    state: State<'_, SecurityComplianceState>,
) -> Result<Vec<SecurityPlaybook>, String> {
    let playbooks = state.playbooks.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    Ok(playbooks.values().cloned().collect())
}

#[tauri::command]
pub async fn security_delete_playbook(
    state: State<'_, SecurityComplianceState>,
    playbook_id: String,
) -> Result<(), String> {
    let mut playbooks = state.playbooks.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    playbooks.remove(&playbook_id)
        .ok_or_else(|| format!("Playbook not found: {}", playbook_id))?;
    
    Ok(())
}

#[tauri::command]
pub async fn security_execute_playbook(
    state: State<'_, SecurityComplianceState>,
    playbook_id: String,
    trigger_source: String,
) -> Result<PlaybookExecution, String> {
    let playbooks = state.playbooks.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    let _playbook = playbooks.get(&playbook_id)
        .ok_or_else(|| format!("Playbook not found: {}", playbook_id))?;
    
    let execution = PlaybookExecution {
        id: format!("exec_{}", chrono::Utc::now().timestamp_millis()),
        playbook_id,
        status: ExecutionStatus::Running,
        trigger_source,
        started_at: chrono::Utc::now().timestamp(),
        completed_at: None,
        current_step: 0,
        step_results: Vec::new(),
        error: None,
    };
    
    let mut executions = state.playbook_executions.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    executions.insert(execution.id.clone(), execution.clone());
    
    Ok(execution)
}

#[tauri::command]
pub async fn security_approve_step(
    state: State<'_, SecurityComplianceState>,
    execution_id: String,
    step_id: String,
    approved: bool,
) -> Result<PlaybookExecution, String> {
    let mut executions = state.playbook_executions.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    let execution = executions.get_mut(&execution_id)
        .ok_or_else(|| format!("Execution not found: {}", execution_id))?;
    
    if approved {
        execution.status = ExecutionStatus::Running;
    } else {
        execution.status = ExecutionStatus::Cancelled;
        execution.completed_at = Some(chrono::Utc::now().timestamp());
        execution.error = Some("Step approval denied".to_string());
    }
    
    Ok(execution.clone())
}

#[tauri::command]
pub async fn security_cancel_execution(
    state: State<'_, SecurityComplianceState>,
    execution_id: String,
) -> Result<PlaybookExecution, String> {
    let mut executions = state.playbook_executions.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    let execution = executions.get_mut(&execution_id)
        .ok_or_else(|| format!("Execution not found: {}", execution_id))?;
    
    execution.status = ExecutionStatus::Cancelled;
    execution.completed_at = Some(chrono::Utc::now().timestamp());
    
    Ok(execution.clone())
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIEM INTEGRATION COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

#[tauri::command]
pub async fn security_create_siem_integration(
    state: State<'_, SecurityComplianceState>,
    integration: SIEMIntegration,
) -> Result<String, String> {
    let mut integrations = state.siem_integrations.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    let id = integration.id.clone();
    integrations.insert(id.clone(), integration);
    
    Ok(id)
}

#[tauri::command]
pub async fn security_get_siem_integration(
    state: State<'_, SecurityComplianceState>,
    integration_id: String,
) -> Result<SIEMIntegration, String> {
    let integrations = state.siem_integrations.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    integrations.get(&integration_id)
        .cloned()
        .ok_or_else(|| format!("Integration not found: {}", integration_id))
}

#[tauri::command]
pub async fn security_list_siem_integrations(
    state: State<'_, SecurityComplianceState>,
) -> Result<Vec<SIEMIntegration>, String> {
    let integrations = state.siem_integrations.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    Ok(integrations.values().cloned().collect())
}

#[tauri::command]
pub async fn security_delete_siem_integration(
    state: State<'_, SecurityComplianceState>,
    integration_id: String,
) -> Result<(), String> {
    let mut integrations = state.siem_integrations.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    integrations.remove(&integration_id)
        .ok_or_else(|| format!("Integration not found: {}", integration_id))?;
    
    Ok(())
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPLIANCE FRAMEWORK COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

#[tauri::command]
pub async fn compliance_create_framework(
    state: State<'_, SecurityComplianceState>,
    framework: ComplianceFramework,
) -> Result<String, String> {
    let mut frameworks = state.frameworks.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    let id = framework.id.clone();
    frameworks.insert(id.clone(), framework);
    
    Ok(id)
}

#[tauri::command]
pub async fn compliance_get_framework(
    state: State<'_, SecurityComplianceState>,
    framework_id: String,
) -> Result<ComplianceFramework, String> {
    let frameworks = state.frameworks.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    frameworks.get(&framework_id)
        .cloned()
        .ok_or_else(|| format!("Framework not found: {}", framework_id))
}

#[tauri::command]
pub async fn compliance_list_frameworks(
    state: State<'_, SecurityComplianceState>,
) -> Result<Vec<ComplianceFramework>, String> {
    let frameworks = state.frameworks.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    Ok(frameworks.values().cloned().collect())
}

#[tauri::command]
pub async fn compliance_set_framework_enabled(
    state: State<'_, SecurityComplianceState>,
    framework_id: String,
    enabled: bool,
) -> Result<ComplianceFramework, String> {
    let mut frameworks = state.frameworks.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    let framework = frameworks.get_mut(&framework_id)
        .ok_or_else(|| format!("Framework not found: {}", framework_id))?;
    
    framework.enabled = enabled;
    
    Ok(framework.clone())
}

#[tauri::command]
pub async fn compliance_update_requirement_status(
    state: State<'_, SecurityComplianceState>,
    framework_id: String,
    requirement_id: String,
    status: RequirementStatus,
) -> Result<ComplianceFramework, String> {
    let mut frameworks = state.frameworks.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    let framework = frameworks.get_mut(&framework_id)
        .ok_or_else(|| format!("Framework not found: {}", framework_id))?;
    
    let requirement = framework.requirements.iter_mut()
        .find(|r| r.id == requirement_id)
        .ok_or_else(|| format!("Requirement not found: {}", requirement_id))?;
    
    requirement.status = status;
    requirement.last_reviewed_at = Some(chrono::Utc::now().timestamp());
    
    // Recalculate overall score
    let total = framework.requirements.len() as f64;
    let compliant = framework.requirements.iter()
        .filter(|r| matches!(r.status, RequirementStatus::Compliant | RequirementStatus::NotApplicable))
        .count() as f64;
    
    framework.overall_score = if total > 0.0 { (compliant / total) * 100.0 } else { 0.0 };
    
    Ok(framework.clone())
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPLIANCE EVIDENCE COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

#[tauri::command]
pub async fn compliance_add_evidence(
    state: State<'_, SecurityComplianceState>,
    evidence: ComplianceEvidence,
) -> Result<String, String> {
    let mut evidences = state.evidence.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    let id = evidence.id.clone();
    
    // Update framework requirement with evidence
    let mut frameworks = state.frameworks.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    for framework in frameworks.values_mut() {
        for requirement in &mut framework.requirements {
            if requirement.id == evidence.requirement_id {
                if !requirement.evidence_ids.contains(&id) {
                    requirement.evidence_ids.push(id.clone());
                }
                break;
            }
        }
    }
    
    evidences.insert(id.clone(), evidence);
    
    Ok(id)
}

#[tauri::command]
pub async fn compliance_get_evidence(
    state: State<'_, SecurityComplianceState>,
    evidence_id: String,
) -> Result<ComplianceEvidence, String> {
    let evidences = state.evidence.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    evidences.get(&evidence_id)
        .cloned()
        .ok_or_else(|| format!("Evidence not found: {}", evidence_id))
}

#[tauri::command]
pub async fn compliance_list_evidence(
    state: State<'_, SecurityComplianceState>,
    requirement_id: Option<String>,
) -> Result<Vec<ComplianceEvidence>, String> {
    let evidences = state.evidence.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    Ok(evidences.values()
        .filter(|e| {
            requirement_id.as_ref()
                .map(|id| &e.requirement_id == id)
                .unwrap_or(true)
        })
        .cloned()
        .collect())
}

#[tauri::command]
pub async fn compliance_remove_evidence(
    state: State<'_, SecurityComplianceState>,
    evidence_id: String,
) -> Result<(), String> {
    let mut evidences = state.evidence.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    let evidence = evidences.remove(&evidence_id)
        .ok_or_else(|| format!("Evidence not found: {}", evidence_id))?;
    
    // Remove from framework requirement
    let mut frameworks = state.frameworks.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    for framework in frameworks.values_mut() {
        for requirement in &mut framework.requirements {
            if requirement.id == evidence.requirement_id {
                requirement.evidence_ids.retain(|id| id != &evidence_id);
                break;
            }
        }
    }
    
    Ok(())
}
