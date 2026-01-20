/**
 * Execution Metrics Service
 * 
 * Tracks workflow execution metrics including:
 * - Execution duration and timing
 * - Success/failure rates
 * - Node-level performance
 * - Resource usage (CPU, memory, network)
 * - Historical trends
 * 
 * Provides real-time metrics for monitoring dashboard.
 */

use chrono::{DateTime, Utc, Duration};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use log::info;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionMetrics {
    pub execution_id: String,
    pub workflow_id: String,
    pub workflow_name: String,
    pub start_time: DateTime<Utc>,
    pub end_time: Option<DateTime<Utc>>,
    pub duration_ms: u64,
    pub status: ExecutionStatus,
    pub nodes_executed: usize,
    pub nodes_total: usize,
    pub nodes_failed: usize,
    pub current_node: Option<String>,
    pub error: Option<String>,
    pub resource_usage: ResourceUsage,
    pub node_metrics: Vec<NodeMetric>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ExecutionStatus {
    Running,
    Completed,
    Failed,
    Cancelled,
    Paused,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceUsage {
    pub cpu_percent: f32,
    pub memory_mb: u64,
    pub network_kb: u64,
    pub disk_io_kb: u64,
}

impl Default for ResourceUsage {
    fn default() -> Self {
        Self {
            cpu_percent: 0.0,
            memory_mb: 0,
            network_kb: 0,
            disk_io_kb: 0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeMetric {
    pub node_id: String,
    pub node_type: String,
    pub start_time: DateTime<Utc>,
    pub end_time: Option<DateTime<Utc>>,
    pub duration_ms: u64,
    pub success: bool,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowStats {
    pub workflow_id: String,
    pub workflow_name: String,
    pub total_executions: usize,
    pub successful_executions: usize,
    pub failed_executions: usize,
    pub average_duration_ms: u64,
    pub min_duration_ms: u64,
    pub max_duration_ms: u64,
    pub last_execution: Option<DateTime<Utc>>,
    pub success_rate: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemStats {
    pub total_executions: usize,
    pub active_executions: usize,
    pub executions_today: usize,
    pub executions_this_week: usize,
    pub average_execution_time_ms: u64,
    pub success_rate: f32,
    pub uptime_seconds: u64,
}

pub struct MetricsService {
    executions: Arc<RwLock<HashMap<String, ExecutionMetrics>>>,
    workflow_history: Arc<RwLock<HashMap<String, Vec<ExecutionMetrics>>>>,
    start_time: DateTime<Utc>,
}

impl MetricsService {
    pub fn new() -> Self {
        info!("📊 Initializing MetricsService");
        Self {
            executions: Arc::new(RwLock::new(HashMap::new())),
            workflow_history: Arc::new(RwLock::new(HashMap::new())),
            start_time: Utc::now(),
        }
    }

    /// Start tracking a new execution
    pub fn start_execution(
        &self,
        execution_id: String,
        workflow_id: String,
        workflow_name: String,
        nodes_total: usize,
    ) -> Result<(), String> {
        let metrics = ExecutionMetrics {
            execution_id: execution_id.clone(),
            workflow_id,
            workflow_name,
            start_time: Utc::now(),
            end_time: None,
            duration_ms: 0,
            status: ExecutionStatus::Running,
            nodes_executed: 0,
            nodes_total,
            nodes_failed: 0,
            current_node: None,
            error: None,
            resource_usage: ResourceUsage::default(),
            node_metrics: Vec::new(),
        };

        let mut executions = self.executions.write().map_err(|e| format!("Lock error: {}", e))?;
        executions.insert(execution_id.clone(), metrics);
        info!("📊 Started tracking execution: {}", execution_id);
        Ok(())
    }

    /// Update current node being executed
    pub fn update_current_node(
        &self,
        execution_id: &str,
        node_id: String,
    ) -> Result<(), String> {
        let mut executions = self.executions.write().map_err(|e| format!("Lock error: {}", e))?;
        if let Some(metrics) = executions.get_mut(execution_id) {
            metrics.current_node = Some(node_id);
            metrics.nodes_executed += 1;
        }
        Ok(())
    }

    /// Record node execution metrics
    pub fn record_node_execution(
        &self,
        execution_id: &str,
        node_id: String,
        node_type: String,
        duration_ms: u64,
        success: bool,
        error: Option<String>,
    ) -> Result<(), String> {
        let mut executions = self.executions.write().map_err(|e| format!("Lock error: {}", e))?;
        if let Some(metrics) = executions.get_mut(execution_id) {
            let node_metric = NodeMetric {
                node_id,
                node_type,
                start_time: Utc::now() - Duration::milliseconds(duration_ms as i64),
                end_time: Some(Utc::now()),
                duration_ms,
                success,
                error,
            };
            metrics.node_metrics.push(node_metric);
            if !success {
                metrics.nodes_failed += 1;
            }
        }
        Ok(())
    }

    /// Update resource usage
    pub fn update_resource_usage(
        &self,
        execution_id: &str,
        cpu_percent: f32,
        memory_mb: u64,
        network_kb: u64,
        disk_io_kb: u64,
    ) -> Result<(), String> {
        let mut executions = self.executions.write().map_err(|e| format!("Lock error: {}", e))?;
        if let Some(metrics) = executions.get_mut(execution_id) {
            metrics.resource_usage = ResourceUsage {
                cpu_percent,
                memory_mb,
                network_kb,
                disk_io_kb,
            };
        }
        Ok(())
    }

    /// Complete execution tracking
    pub fn complete_execution(
        &self,
        execution_id: &str,
        success: bool,
        error: Option<String>,
    ) -> Result<(), String> {
        let mut executions = self.executions.write().map_err(|e| format!("Lock error: {}", e))?;
        if let Some(metrics) = executions.get_mut(execution_id) {
            metrics.end_time = Some(Utc::now());
            metrics.duration_ms = (metrics.end_time.unwrap() - metrics.start_time).num_milliseconds() as u64;
            metrics.status = if success {
                ExecutionStatus::Completed
            } else {
                ExecutionStatus::Failed
            };
            metrics.error = error;

            // Archive to history
            let workflow_id = metrics.workflow_id.clone();
            let metrics_clone = metrics.clone();
            drop(executions);

            let mut history = self.workflow_history.write().map_err(|e| format!("Lock error: {}", e))?;
            history.entry(workflow_id)
                .or_insert_with(Vec::new)
                .push(metrics_clone);

            info!("📊 Completed execution: {} ({})", execution_id, if success { "success" } else { "failed" });
        }
        Ok(())
    }

    /// Get current execution metrics
    pub fn get_execution(&self, execution_id: &str) -> Result<Option<ExecutionMetrics>, String> {
        let executions = self.executions.read().map_err(|e| format!("Lock error: {}", e))?;
        Ok(executions.get(execution_id).cloned())
    }

    /// Get all active executions
    pub fn get_active_executions(&self) -> Result<Vec<ExecutionMetrics>, String> {
        let executions = self.executions.read().map_err(|e| format!("Lock error: {}", e))?;
        Ok(executions.values()
            .filter(|m| matches!(m.status, ExecutionStatus::Running))
            .cloned()
            .collect())
    }

    /// Get workflow statistics
    pub fn get_workflow_stats(&self, workflow_id: &str) -> Result<Option<WorkflowStats>, String> {
        let history = self.workflow_history.read().map_err(|e| format!("Lock error: {}", e))?;
        
        if let Some(executions) = history.get(workflow_id) {
            if executions.is_empty() {
                return Ok(None);
            }

            let total = executions.len();
            let successful = executions.iter()
                .filter(|e| matches!(e.status, ExecutionStatus::Completed))
                .count();
            let failed = executions.iter()
                .filter(|e| matches!(e.status, ExecutionStatus::Failed))
                .count();

            let durations: Vec<u64> = executions.iter()
                .filter(|e| e.end_time.is_some())
                .map(|e| e.duration_ms)
                .collect();

            let average = if !durations.is_empty() {
                durations.iter().sum::<u64>() / durations.len() as u64
            } else {
                0
            };

            let min = durations.iter().min().copied().unwrap_or(0);
            let max = durations.iter().max().copied().unwrap_or(0);

            let last_execution = executions.iter()
                .filter_map(|e| e.end_time)
                .max();

            let success_rate = if total > 0 {
                (successful as f32 / total as f32) * 100.0
            } else {
                0.0
            };

            let workflow_name = executions.first()
                .map(|e| e.workflow_name.clone())
                .unwrap_or_default();

            Ok(Some(WorkflowStats {
                workflow_id: workflow_id.to_string(),
                workflow_name,
                total_executions: total,
                successful_executions: successful,
                failed_executions: failed,
                average_duration_ms: average,
                min_duration_ms: min,
                max_duration_ms: max,
                last_execution,
                success_rate,
            }))
        } else {
            Ok(None)
        }
    }

    /// Get system-wide statistics
    pub fn get_system_stats(&self) -> Result<SystemStats, String> {
        let executions = self.executions.read().map_err(|e| format!("Lock error: {}", e))?;
        let history = self.workflow_history.read().map_err(|e| format!("Lock error: {}", e))?;

        let active_executions = executions.values()
            .filter(|m| matches!(m.status, ExecutionStatus::Running))
            .count();

        let all_executions: Vec<&ExecutionMetrics> = history.values()
            .flat_map(|v| v.iter())
            .collect();

        let total_executions = all_executions.len();

        let now = Utc::now();
        let today_start = now.date_naive().and_hms_opt(0, 0, 0).unwrap().and_utc();
        let week_start = now - Duration::days(7);

        let executions_today = all_executions.iter()
            .filter(|e| e.start_time >= today_start)
            .count();

        let executions_this_week = all_executions.iter()
            .filter(|e| e.start_time >= week_start)
            .count();

        let completed_executions: Vec<&&ExecutionMetrics> = all_executions.iter()
            .filter(|e| e.end_time.is_some())
            .collect();

        let average_execution_time = if !completed_executions.is_empty() {
            completed_executions.iter()
                .map(|e| e.duration_ms)
                .sum::<u64>() / completed_executions.len() as u64
        } else {
            0
        };

        let successful = all_executions.iter()
            .filter(|e| matches!(e.status, ExecutionStatus::Completed))
            .count();

        let success_rate = if total_executions > 0 {
            (successful as f32 / total_executions as f32) * 100.0
        } else {
            0.0
        };

        let uptime_seconds = (now - self.start_time).num_seconds() as u64;

        Ok(SystemStats {
            total_executions,
            active_executions,
            executions_today,
            executions_this_week,
            average_execution_time_ms: average_execution_time,
            success_rate,
            uptime_seconds,
        })
    }

    /// Clear old metrics (keep last 1000 per workflow)
    pub fn cleanup_old_metrics(&self) -> Result<(), String> {
        let mut history = self.workflow_history.write().map_err(|e| format!("Lock error: {}", e))?;
        
        for executions in history.values_mut() {
            if executions.len() > 1000 {
                executions.sort_by(|a, b| b.start_time.cmp(&a.start_time));
                executions.truncate(1000);
            }
        }

        info!("📊 Cleaned up old metrics");
        Ok(())
    }
}
