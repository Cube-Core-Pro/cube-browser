use crate::models::terminal::{TerminalSession, CommandHistory, TerminalConfig, TerminalStats};
use crate::services::terminal_service::TerminalService;
use tauri::State;

#[tauri::command]
pub async fn create_terminal_session(
    session: TerminalSession,
    terminal_service: State<'_, TerminalService>,
) -> Result<(), String> {
    terminal_service.create_session(&session)
}

#[tauri::command]
pub async fn get_all_terminal_sessions(
    terminal_service: State<'_, TerminalService>,
) -> Result<Vec<TerminalSession>, String> {
    terminal_service.get_all_sessions()
}

#[tauri::command]
pub async fn get_active_terminal_sessions(
    terminal_service: State<'_, TerminalService>,
) -> Result<Vec<TerminalSession>, String> {
    terminal_service.get_active_sessions()
}

#[tauri::command]
pub async fn update_terminal_session_activity(
    session_id: String,
    terminal_service: State<'_, TerminalService>,
) -> Result<(), String> {
    terminal_service.update_session_activity(&session_id)
}

#[tauri::command]
pub async fn close_terminal_session(
    session_id: String,
    terminal_service: State<'_, TerminalService>,
) -> Result<(), String> {
    terminal_service.close_session(&session_id)
}

#[tauri::command]
pub async fn delete_terminal_session(
    session_id: String,
    terminal_service: State<'_, TerminalService>,
) -> Result<(), String> {
    terminal_service.delete_session(&session_id)
}

#[tauri::command]
pub async fn add_terminal_command_history(
    history: CommandHistory,
    terminal_service: State<'_, TerminalService>,
) -> Result<(), String> {
    terminal_service.add_command_history(&history)
}

#[tauri::command]
pub async fn get_terminal_session_history(
    session_id: String,
    limit: i32,
    terminal_service: State<'_, TerminalService>,
) -> Result<Vec<CommandHistory>, String> {
    terminal_service.get_session_history(&session_id, limit)
}

#[tauri::command]
pub async fn search_terminal_history(
    query: String,
    limit: i32,
    terminal_service: State<'_, TerminalService>,
) -> Result<Vec<CommandHistory>, String> {
    terminal_service.search_history(&query, limit)
}

#[tauri::command]
pub async fn clear_terminal_session_history(
    session_id: String,
    terminal_service: State<'_, TerminalService>,
) -> Result<(), String> {
    terminal_service.clear_session_history(&session_id)
}

#[tauri::command]
pub async fn get_terminal_config(
    terminal_service: State<'_, TerminalService>,
) -> Result<TerminalConfig, String> {
    terminal_service.get_config()
}

#[tauri::command]
pub async fn update_terminal_config(
    config: TerminalConfig,
    terminal_service: State<'_, TerminalService>,
) -> Result<(), String> {
    terminal_service.update_config(&config)
}

#[tauri::command]
pub async fn get_terminal_stats(
    terminal_service: State<'_, TerminalService>,
) -> Result<TerminalStats, String> {
    terminal_service.get_stats()
}
