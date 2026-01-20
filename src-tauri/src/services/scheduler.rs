// Workflow Scheduler Service
// Manages cron-based and event-based workflow execution

use chrono::{DateTime, Utc};
use cron::Schedule;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::str::FromStr;
use std::sync::Arc;
use tokio::sync::RwLock;
use tokio::time::{interval, Duration};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScheduledWorkflow {
    pub id: String,
    pub workflow_id: String,
    pub workflow_name: String,
    pub schedule_type: ScheduleType,
    pub cron_expression: Option<String>,
    pub enabled: bool,
    pub last_run: Option<DateTime<Utc>>,
    pub next_run: Option<DateTime<Utc>>,
    pub run_count: u64,
    pub retry_policy: RetryPolicy,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum ScheduleType {
    Cron { expression: String },
    Interval { seconds: u64 },
    Once { at: DateTime<Utc> },
    Event { event_type: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetryPolicy {
    pub max_retries: u32,
    pub retry_delay_seconds: u64,
    pub exponential_backoff: bool,
}

impl Default for RetryPolicy {
    fn default() -> Self {
        Self {
            max_retries: 3,
            retry_delay_seconds: 60,
            exponential_backoff: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionQueueItem {
    pub id: String,
    pub workflow_id: String,
    pub workflow_name: String,
    pub scheduled_id: String,
    pub scheduled_time: DateTime<Utc>,
    pub status: ExecutionStatus,
    pub parameters: serde_json::Value,
    pub result: Option<serde_json::Value>,
    pub retry_count: u32,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ExecutionStatus {
    Queued,
    Running,
    Completed,
    Failed,
    Retrying,
    Cancelled,
}

pub struct WorkflowScheduler {
    schedules: Arc<RwLock<HashMap<String, ScheduledWorkflow>>>,
    execution_queue: Arc<RwLock<Vec<ExecutionQueueItem>>>,
    running: Arc<RwLock<bool>>,
}

impl WorkflowScheduler {
    pub fn new() -> Self {
        Self {
            schedules: Arc::new(RwLock::new(HashMap::new())),
            execution_queue: Arc::new(RwLock::new(Vec::new())),
            running: Arc::new(RwLock::new(false)),
        }
    }

    /// Add a new scheduled workflow
    pub async fn add_schedule(&self, schedule: ScheduledWorkflow) -> Result<(), String> {
        let mut schedules = self.schedules.write().await;
        
        // Validate cron expression if present
        if let Some(ref expr) = schedule.cron_expression {
            Schedule::from_str(expr)
                .map_err(|e| format!("Invalid cron expression: {}", e))?;
        }

        schedules.insert(schedule.id.clone(), schedule);
        Ok(())
    }

    /// Remove a scheduled workflow
    pub async fn remove_schedule(&self, schedule_id: &str) -> Result<(), String> {
        let mut schedules = self.schedules.write().await;
        schedules.remove(schedule_id)
            .ok_or_else(|| format!("Schedule not found: {}", schedule_id))?;
        Ok(())
    }

    /// Enable/disable a schedule
    pub async fn toggle_schedule(&self, schedule_id: &str, enabled: bool) -> Result<(), String> {
        let mut schedules = self.schedules.write().await;
        let schedule = schedules.get_mut(schedule_id)
            .ok_or_else(|| format!("Schedule not found: {}", schedule_id))?;
        schedule.enabled = enabled;
        Ok(())
    }

    /// Get all schedules
    pub async fn get_schedules(&self) -> Vec<ScheduledWorkflow> {
        let schedules = self.schedules.read().await;
        schedules.values().cloned().collect()
    }

    /// Get execution queue
    pub async fn get_queue(&self) -> Vec<ExecutionQueueItem> {
        let queue = self.execution_queue.read().await;
        queue.clone()
    }

    /// Start the scheduler loop
    pub async fn start(&self) {
        let mut is_running = self.running.write().await;
        if *is_running {
            return;
        }
        *is_running = true;
        drop(is_running);

        let schedules = Arc::clone(&self.schedules);
        let queue = Arc::clone(&self.execution_queue);
        let running = Arc::clone(&self.running);

        tokio::spawn(async move {
            let mut tick_interval = interval(Duration::from_secs(60)); // Check every minute

            loop {
                tick_interval.tick().await;

                let is_running = running.read().await;
                if !*is_running {
                    break;
                }
                drop(is_running);

                // Check schedules
                let now = Utc::now();
                let mut schedules_guard = schedules.write().await;

                for (_, schedule) in schedules_guard.iter_mut() {
                    if !schedule.enabled {
                        continue;
                    }

                    let should_run = match &schedule.schedule_type {
                        ScheduleType::Cron { expression } => {
                            if let Ok(cron_schedule) = Schedule::from_str(expression) {
                                if let Some(next_run) = schedule.next_run {
                                    now >= next_run
                                } else {
                                    // Calculate first run
                                    if let Some(next) = cron_schedule.upcoming(Utc).next() {
                                        schedule.next_run = Some(next);
                                        false
                                    } else {
                                        false
                                    }
                                }
                            } else {
                                false
                            }
                        }
                        ScheduleType::Interval { seconds } => {
                            if let Some(last_run) = schedule.last_run {
                                (now - last_run).num_seconds() >= *seconds as i64
                            } else {
                                true // First run
                            }
                        }
                        ScheduleType::Once { at } => {
                            now >= *at && schedule.last_run.is_none()
                        }
                        ScheduleType::Event { .. } => false, // Events are triggered externally
                    };

                    if should_run {
                        // Add to execution queue
                        let queue_item = ExecutionQueueItem {
                            id: format!("exec-{}-{}", schedule.id, now.timestamp()),
                            workflow_id: schedule.workflow_id.clone(),
                            workflow_name: schedule.workflow_name.clone(),
                            scheduled_id: schedule.id.clone(),
                            scheduled_time: now,
                            status: ExecutionStatus::Queued,
                            parameters: serde_json::Value::Null,
                            result: None,
                            retry_count: 0,
                            error: None,
                        };

                        let mut queue_guard = queue.write().await;
                        queue_guard.push(queue_item);
                        drop(queue_guard);

                        // Update schedule
                        schedule.last_run = Some(now);
                        schedule.run_count += 1;

                        // Calculate next run for cron
                        if let ScheduleType::Cron { expression } = &schedule.schedule_type {
                            if let Ok(cron_schedule) = Schedule::from_str(expression) {
                                schedule.next_run = cron_schedule.upcoming(Utc).next();
                            }
                        }
                    }
                }

                drop(schedules_guard);

                // Process execution queue (mock execution for now)
                let mut queue_guard = queue.write().await;
                for item in queue_guard.iter_mut() {
                    if item.status == ExecutionStatus::Queued {
                        item.status = ExecutionStatus::Running;
                        // Real execution would happen here via invoke('canvas_execute_workflow')
                        // For now, mark as completed
                        tokio::time::sleep(Duration::from_secs(1)).await;
                        item.status = ExecutionStatus::Completed;
                    }
                }
                drop(queue_guard);
            }
        });
    }

    /// Manually trigger a workflow execution
    pub async fn trigger_workflow(
        &self,
        workflow_id: &str,
        parameters: Option<serde_json::Value>,
    ) -> Result<String, String> {
        let mut queue = self.execution_queue.write().await;
        let execution_id = format!("manual-{}-{}", workflow_id, chrono::Utc::now().timestamp_millis());
        
        let queue_item = ExecutionQueueItem {
            id: execution_id.clone(),
            workflow_id: workflow_id.to_string(),
            workflow_name: format!("Workflow {}", workflow_id),
            scheduled_id: String::from("manual"),
            scheduled_time: chrono::Utc::now(),
            status: ExecutionStatus::Queued,
            parameters: parameters.unwrap_or(serde_json::Value::Null),
            result: None,
            retry_count: 0,
            error: None,
        };
        
        queue.push(queue_item);
        
        Ok(execution_id)
    }

    /// Stop the scheduler loop
    pub async fn stop(&self) {
        let mut is_running = self.running.write().await;
        *is_running = false;
    }

    /// Clear completed items from queue
    pub async fn clear_completed(&self) {
        let mut queue = self.execution_queue.write().await;
        queue.retain(|item| item.status != ExecutionStatus::Completed);
    }

    /// Cancel a queued/running execution
    pub async fn cancel_execution(&self, execution_id: &str) -> Result<(), String> {
        let mut queue = self.execution_queue.write().await;
        let item = queue.iter_mut()
            .find(|i| i.id == execution_id)
            .ok_or_else(|| format!("Execution not found: {}", execution_id))?;
        
        if item.status == ExecutionStatus::Queued || item.status == ExecutionStatus::Running {
            item.status = ExecutionStatus::Cancelled;
            Ok(())
        } else {
            Err("Cannot cancel execution in current status".to_string())
        }
    }
}
