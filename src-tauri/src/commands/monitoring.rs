/**
 * Monitoring Commands
 * 
 * Tauri commands for monitoring dashboard:
 * - Real-time execution metrics
 * - Workflow statistics
 * - System-wide stats
 * - Log management
 * - Alert configuration
 */

use tauri::State;
use std::sync::Arc;
use std::path::PathBuf;

use crate::services::metrics::{MetricsService, ExecutionMetrics, WorkflowStats, SystemStats};
use crate::services::logs::{LogsService, LogEntry, LogFilter, LogLevel, LogStats};
use crate::services::alerts::{AlertsService, AlertRule, AlertEvent};

pub struct MonitoringState {
    pub metrics: Arc<MetricsService>,
    pub logs: Arc<LogsService>,
    pub alerts: Arc<AlertsService>,
}

// ==================== METRICS COMMANDS ====================

#[tauri::command]
pub async fn metrics_get_execution(
    execution_id: String,
    state: State<'_, MonitoringState>,
) -> Result<Option<ExecutionMetrics>, String> {
    state.metrics.get_execution(&execution_id)
}

#[tauri::command]
pub async fn metrics_get_active_executions(
    state: State<'_, MonitoringState>,
) -> Result<Vec<ExecutionMetrics>, String> {
    state.metrics.get_active_executions()
}

#[tauri::command]
pub async fn metrics_get_workflow_stats(
    workflow_id: String,
    state: State<'_, MonitoringState>,
) -> Result<Option<WorkflowStats>, String> {
    state.metrics.get_workflow_stats(&workflow_id)
}

#[tauri::command]
pub async fn metrics_get_system_stats(
    state: State<'_, MonitoringState>,
) -> Result<SystemStats, String> {
    state.metrics.get_system_stats()
}

#[tauri::command]
pub async fn metrics_cleanup(
    state: State<'_, MonitoringState>,
) -> Result<(), String> {
    state.metrics.cleanup_old_metrics()
}

// ==================== LOGS COMMANDS ====================

#[tauri::command]
pub async fn logs_add(
    level: String,
    message: String,
    workflow_id: Option<String>,
    execution_id: Option<String>,
    node_id: Option<String>,
    state: State<'_, MonitoringState>,
) -> Result<String, String> {
    let log_level = match level.to_lowercase().as_str() {
        "debug" => LogLevel::Debug,
        "info" => LogLevel::Info,
        "warn" => LogLevel::Warn,
        "error" => LogLevel::Error,
        _ => LogLevel::Info,
    };

    state.logs.log(
        log_level,
        message,
        workflow_id,
        execution_id,
        node_id,
        std::collections::HashMap::new(),
    )
}

#[tauri::command]
pub async fn logs_get(
    filter: LogFilter,
    state: State<'_, MonitoringState>,
) -> Result<Vec<LogEntry>, String> {
    state.logs.get_logs(filter)
}

#[tauri::command]
pub async fn logs_get_recent(
    count: usize,
    state: State<'_, MonitoringState>,
) -> Result<Vec<LogEntry>, String> {
    state.logs.get_recent_logs(count)
}

#[tauri::command]
pub async fn logs_export_json(
    filter: LogFilter,
    path: String,
    state: State<'_, MonitoringState>,
) -> Result<String, String> {
    state.logs.export_to_json(filter, PathBuf::from(path))
}

#[tauri::command]
pub async fn logs_export_csv(
    filter: LogFilter,
    path: String,
    state: State<'_, MonitoringState>,
) -> Result<String, String> {
    state.logs.export_to_csv(filter, PathBuf::from(path))
}

#[tauri::command]
pub async fn logs_export_txt(
    filter: LogFilter,
    path: String,
    state: State<'_, MonitoringState>,
) -> Result<String, String> {
    state.logs.export_to_txt(filter, PathBuf::from(path))
}

#[tauri::command]
pub async fn logs_clear(
    state: State<'_, MonitoringState>,
) -> Result<usize, String> {
    state.logs.clear_logs()
}

#[tauri::command]
pub async fn logs_get_stats(
    state: State<'_, MonitoringState>,
) -> Result<LogStats, String> {
    state.logs.get_stats()
}

// ==================== ALERTS COMMANDS ====================

#[tauri::command]
pub async fn alerts_add_rule(
    rule: AlertRule,
    state: State<'_, MonitoringState>,
) -> Result<(), String> {
    state.alerts.add_rule(rule)
}

#[tauri::command]
pub async fn alerts_remove_rule(
    rule_id: String,
    state: State<'_, MonitoringState>,
) -> Result<(), String> {
    state.alerts.remove_rule(&rule_id)
}

#[tauri::command]
pub async fn alerts_toggle_rule(
    rule_id: String,
    enabled: bool,
    state: State<'_, MonitoringState>,
) -> Result<(), String> {
    state.alerts.toggle_rule(&rule_id, enabled)
}

#[tauri::command]
pub async fn alerts_get_rules(
    state: State<'_, MonitoringState>,
) -> Result<Vec<AlertRule>, String> {
    state.alerts.get_rules()
}

#[tauri::command]
pub async fn alerts_get_history(
    limit: Option<usize>,
    state: State<'_, MonitoringState>,
) -> Result<Vec<AlertEvent>, String> {
    state.alerts.get_history(limit)
}

#[tauri::command]
pub async fn alerts_clear_history(
    state: State<'_, MonitoringState>,
) -> Result<usize, String> {
    state.alerts.clear_history()
}

#[tauri::command]
pub async fn alerts_test_channel(
    channel: crate::services::alerts::AlertChannel,
    state: State<'_, MonitoringState>,
) -> Result<(), String> {
    // Send test alert
    let test_event = AlertEvent {
        id: format!("test-{}", chrono::Utc::now().timestamp_millis()),
        rule_id: "test".to_string(),
        workflow_id: "test".to_string(),
        workflow_name: "Test Workflow".to_string(),
        execution_id: "test".to_string(),
        timestamp: chrono::Utc::now(),
        message: "This is a test alert from CUBE Elite v6".to_string(),
        severity: crate::services::alerts::AlertSeverity::Info,
        metadata: std::collections::HashMap::new(),
    };

    state.alerts.send_to_channel(&channel, &test_event).await
}
