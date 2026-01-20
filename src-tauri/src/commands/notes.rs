// Notes & Tasks Commands
use crate::models::notes::*;
use crate::services::notes_service::NotesService;
use std::sync::Mutex;
use tauri::State;

pub struct NotesState {
    pub service: Mutex<NotesService>,
}

#[tauri::command]
pub async fn get_all_notes(state: State<'_, NotesState>) -> Result<Vec<Note>, String> {
    let service = state.service.lock().map_err(|e| e.to_string())?;
    service.get_all_notes().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_note(note: Note, state: State<'_, NotesState>) -> Result<(), String> {
    let service = state.service.lock().map_err(|e| e.to_string())?;
    service.create_note(&note).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_note(note: Note, state: State<'_, NotesState>) -> Result<(), String> {
    let service = state.service.lock().map_err(|e| e.to_string())?;
    service.update_note(&note).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_note(note_id: String, state: State<'_, NotesState>) -> Result<(), String> {
    let service = state.service.lock().map_err(|e| e.to_string())?;
    service.delete_note(&note_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_all_tasks(state: State<'_, NotesState>) -> Result<Vec<Task>, String> {
    let service = state.service.lock().map_err(|e| e.to_string())?;
    service.get_all_tasks().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_task(task: Task, state: State<'_, NotesState>) -> Result<(), String> {
    let service = state.service.lock().map_err(|e| e.to_string())?;
    service.create_task(&task).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_task(task: Task, state: State<'_, NotesState>) -> Result<(), String> {
    let service = state.service.lock().map_err(|e| e.to_string())?;
    service.update_task(&task).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_all_categories(state: State<'_, NotesState>) -> Result<Vec<Category>, String> {
    let service = state.service.lock().map_err(|e| e.to_string())?;
    service.get_all_categories().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_notes_stats(state: State<'_, NotesState>) -> Result<NotesStats, String> {
    let service = state.service.lock().map_err(|e| e.to_string())?;
    service.get_stats().map_err(|e| e.to_string())
}
