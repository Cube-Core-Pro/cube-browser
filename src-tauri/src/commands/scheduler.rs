// Scheduler Commands - Workflow scheduling with cron
// Enables automated workflow execution on schedules

use crate::services::scheduler::{
    ExecutionQueueItem, ScheduledWorkflow, WorkflowScheduler,
};
use std::sync::Arc;
use tauri::State;

pub struct SchedulerState(pub Arc<WorkflowScheduler>);

#[tauri::command]
pub async fn scheduler_add_schedule(
    state: State<'_, SchedulerState>,
    schedule: ScheduledWorkflow,
) -> Result<(), String> {
    state.0.add_schedule(schedule).await
}

#[tauri::command]
pub async fn scheduler_remove_schedule(
    state: State<'_, SchedulerState>,
    schedule_id: String,
) -> Result<(), String> {
    state.0.remove_schedule(&schedule_id).await
}

#[tauri::command]
pub async fn scheduler_toggle_schedule(
    state: State<'_, SchedulerState>,
    schedule_id: String,
    enabled: bool,
) -> Result<(), String> {
    state.0.toggle_schedule(&schedule_id, enabled).await
}

#[tauri::command]
pub async fn scheduler_get_schedules(
    state: State<'_, SchedulerState>,
) -> Result<Vec<ScheduledWorkflow>, String> {
    Ok(state.0.get_schedules().await)
}

#[tauri::command]
pub async fn scheduler_get_queue(
    state: State<'_, SchedulerState>,
) -> Result<Vec<ExecutionQueueItem>, String> {
    Ok(state.0.get_queue().await)
}

#[tauri::command]
pub async fn scheduler_start(state: State<'_, SchedulerState>) -> Result<(), String> {
    state.0.start().await;
    Ok(())
}

#[tauri::command]
pub async fn scheduler_stop(state: State<'_, SchedulerState>) -> Result<(), String> {
    state.0.stop().await;
    Ok(())
}

#[tauri::command]
pub async fn scheduler_clear_completed(state: State<'_, SchedulerState>) -> Result<(), String> {
    state.0.clear_completed().await;
    Ok(())
}

#[tauri::command]
pub async fn scheduler_cancel_execution(
    state: State<'_, SchedulerState>,
    execution_id: String,
) -> Result<(), String> {
    state.0.cancel_execution(&execution_id).await
}

#[tauri::command]
pub async fn scheduler_validate_cron(cron_expression: String) -> Result<Vec<String>, String> {
    use chrono::Utc;
    use cron::Schedule;
    use std::str::FromStr;

    let schedule = Schedule::from_str(&cron_expression)
        .map_err(|e| format!("Invalid cron expression: {}", e))?;

    // Get next 5 occurrences
    let upcoming: Vec<String> = schedule
        .upcoming(Utc)
        .take(5)
        .map(|dt| dt.format("%Y-%m-%d %H:%M:%S UTC").to_string())
        .collect();

    Ok(upcoming)
}
