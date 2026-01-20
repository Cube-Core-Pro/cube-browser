// PTY Commands - Tauri commands for PTY service
// Real terminal execution with command output

use crate::services::pty_service::{PtyService, PtySession, CommandRequest, CommandResult, PtyConfig};
use log::info;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::State;

/// PTY state for Tauri
pub struct PtyState(pub Mutex<PtyService>);

/// Create PTY state
pub fn create_pty_state() -> PtyState {
    PtyState(Mutex::new(PtyService::new()))
}

// ============================================================================
// Session Management
// ============================================================================

/// Create a new PTY session
#[tauri::command]
pub async fn pty_create_session(
    state: State<'_, PtyState>,
    name: Option<String>,
    working_directory: Option<String>,
) -> Result<PtySession, String> {
    let service = state.0.lock()
        .map_err(|e| format!("Failed to lock PTY state: {}", e))?;
    
    service.create_session(name, working_directory)
}

/// Get a specific PTY session
#[tauri::command]
pub async fn pty_get_session(
    state: State<'_, PtyState>,
    session_id: String,
) -> Result<PtySession, String> {
    let service = state.0.lock()
        .map_err(|e| format!("Failed to lock PTY state: {}", e))?;
    
    service.get_session(&session_id)
}

/// Get all PTY sessions
#[tauri::command]
pub async fn pty_get_all_sessions(
    state: State<'_, PtyState>,
) -> Result<Vec<PtySession>, String> {
    let service = state.0.lock()
        .map_err(|e| format!("Failed to lock PTY state: {}", e))?;
    
    service.get_all_sessions()
}

/// Get active PTY sessions
#[tauri::command]
pub async fn pty_get_active_sessions(
    state: State<'_, PtyState>,
) -> Result<Vec<PtySession>, String> {
    let service = state.0.lock()
        .map_err(|e| format!("Failed to lock PTY state: {}", e))?;
    
    service.get_active_sessions()
}

/// Close a PTY session
#[tauri::command]
pub async fn pty_close_session(
    state: State<'_, PtyState>,
    session_id: String,
) -> Result<(), String> {
    let service = state.0.lock()
        .map_err(|e| format!("Failed to lock PTY state: {}", e))?;
    
    service.close_session(&session_id)
}

/// Delete a PTY session
#[tauri::command]
pub async fn pty_delete_session(
    state: State<'_, PtyState>,
    session_id: String,
) -> Result<(), String> {
    let service = state.0.lock()
        .map_err(|e| format!("Failed to lock PTY state: {}", e))?;
    
    service.delete_session(&session_id)
}

// ============================================================================
// Command Execution
// ============================================================================

/// Input for command execution
#[derive(Debug, Deserialize)]
pub struct ExecuteCommandInput {
    pub session_id: String,
    pub command: String,
    pub working_directory: Option<String>,
    pub environment: Option<HashMap<String, String>>,
    pub timeout_secs: Option<u64>,
}

/// Execute a command synchronously
#[tauri::command]
pub async fn pty_execute_command(
    state: State<'_, PtyState>,
    input: ExecuteCommandInput,
) -> Result<CommandResult, String> {
    let service = state.0.lock()
        .map_err(|e| format!("Failed to lock PTY state: {}", e))?;
    
    let request = CommandRequest {
        session_id: input.session_id,
        command: input.command,
        working_directory: input.working_directory,
        environment: input.environment,
        timeout_secs: input.timeout_secs,
    };
    
    service.execute_command(request)
}

/// Execute a builtin command
#[tauri::command]
pub async fn pty_execute_builtin(
    state: State<'_, PtyState>,
    session_id: String,
    command: String,
) -> Result<String, String> {
    let service = state.0.lock()
        .map_err(|e| format!("Failed to lock PTY state: {}", e))?;
    
    service.execute_builtin(&session_id, &command)
}

/// Execute multiple commands in batch
#[tauri::command]
pub async fn pty_execute_batch(
    state: State<'_, PtyState>,
    session_id: String,
    commands: Vec<String>,
) -> Result<Vec<CommandResult>, String> {
    let service = state.0.lock()
        .map_err(|e| format!("Failed to lock PTY state: {}", e))?;
    
    service.execute_batch(&session_id, commands)
}

/// Start streaming execution
#[tauri::command]
pub async fn pty_execute_streaming(
    state: State<'_, PtyState>,
    input: ExecuteCommandInput,
) -> Result<String, String> {
    let service = state.0.lock()
        .map_err(|e| format!("Failed to lock PTY state: {}", e))?;
    
    let request = CommandRequest {
        session_id: input.session_id,
        command: input.command,
        working_directory: input.working_directory,
        environment: input.environment,
        timeout_secs: input.timeout_secs,
    };
    
    service.execute_streaming(request)
}

/// Kill a running process
#[tauri::command]
pub async fn pty_kill_process(
    state: State<'_, PtyState>,
    session_id: String,
) -> Result<(), String> {
    let service = state.0.lock()
        .map_err(|e| format!("Failed to lock PTY state: {}", e))?;
    
    service.kill_process(&session_id)
}

/// Send input to running process
#[tauri::command]
pub async fn pty_send_input(
    state: State<'_, PtyState>,
    session_id: String,
    input: String,
) -> Result<(), String> {
    let service = state.0.lock()
        .map_err(|e| format!("Failed to lock PTY state: {}", e))?;
    
    service.send_input(&session_id, &input)
}

// ============================================================================
// Session Configuration
// ============================================================================

/// Update working directory
#[tauri::command]
pub async fn pty_update_working_directory(
    state: State<'_, PtyState>,
    session_id: String,
    directory: String,
) -> Result<(), String> {
    let service = state.0.lock()
        .map_err(|e| format!("Failed to lock PTY state: {}", e))?;
    
    service.update_working_directory(&session_id, &directory)
}

/// Resize PTY
#[tauri::command]
pub async fn pty_resize(
    state: State<'_, PtyState>,
    session_id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let service = state.0.lock()
        .map_err(|e| format!("Failed to lock PTY state: {}", e))?;
    
    service.resize(&session_id, cols, rows)
}

// ============================================================================
// Configuration
// ============================================================================

/// Get PTY configuration
#[tauri::command]
pub async fn pty_get_config(
    state: State<'_, PtyState>,
) -> Result<PtyConfig, String> {
    let service = state.0.lock()
        .map_err(|e| format!("Failed to lock PTY state: {}", e))?;
    
    service.get_config()
}

/// Update PTY configuration
#[tauri::command]
pub async fn pty_update_config(
    state: State<'_, PtyState>,
    config: PtyConfig,
) -> Result<(), String> {
    let service = state.0.lock()
        .map_err(|e| format!("Failed to lock PTY state: {}", e))?;
    
    service.update_config(config)
}

// ============================================================================
// System Information
// ============================================================================

/// Get environment variables
#[tauri::command]
pub async fn pty_get_environment() -> Result<HashMap<String, String>, String> {
    Ok(PtyService::get_environment())
}

/// Get system information
#[tauri::command]
pub async fn pty_get_system_info() -> Result<HashMap<String, String>, String> {
    PtyService::get_system_info()
}

/// Get PTY statistics
#[tauri::command]
pub async fn pty_get_stats(
    state: State<'_, PtyState>,
) -> Result<HashMap<String, serde_json::Value>, String> {
    let service = state.0.lock()
        .map_err(|e| format!("Failed to lock PTY state: {}", e))?;
    
    service.get_stats()
}

// ============================================================================
// File System Operations
// ============================================================================

/// List directory contents
#[tauri::command]
pub async fn pty_list_directory(
    directory: String,
) -> Result<Vec<FileEntry>, String> {
    let path = std::path::Path::new(&directory);
    
    if !path.exists() {
        return Err(format!("Directory does not exist: {}", directory));
    }
    
    if !path.is_dir() {
        return Err(format!("Not a directory: {}", directory));
    }
    
    let mut entries = Vec::new();
    
    let read_dir = std::fs::read_dir(path)
        .map_err(|e| format!("Failed to read directory: {}", e))?;
    
    for entry in read_dir {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let metadata = entry.metadata()
            .map_err(|e| format!("Failed to get metadata: {}", e))?;
        
        let file_type = if metadata.is_dir() {
            "directory"
        } else if metadata.is_symlink() {
            "symlink"
        } else {
            "file"
        };
        
        entries.push(FileEntry {
            name: entry.file_name().to_string_lossy().to_string(),
            path: entry.path().to_string_lossy().to_string(),
            file_type: file_type.to_string(),
            size: metadata.len(),
            modified: metadata.modified()
                .ok()
                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|d| d.as_secs()),
            permissions: format_permissions(&metadata),
        });
    }
    
    // Sort: directories first, then files, alphabetically
    entries.sort_by(|a, b| {
        match (&a.file_type[..], &b.file_type[..]) {
            ("directory", "directory") => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
            ("directory", _) => std::cmp::Ordering::Less,
            (_, "directory") => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });
    
    Ok(entries)
}

/// File entry information
#[derive(Debug, Clone, Serialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub file_type: String,
    pub size: u64,
    pub modified: Option<u64>,
    pub permissions: String,
}

/// Format permissions for display
#[cfg(unix)]
fn format_permissions(metadata: &std::fs::Metadata) -> String {
    use std::os::unix::fs::PermissionsExt;
    let mode = metadata.permissions().mode();
    format!("{:o}", mode & 0o777)
}

#[cfg(not(unix))]
fn format_permissions(metadata: &std::fs::Metadata) -> String {
    if metadata.permissions().readonly() {
        "r--".to_string()
    } else {
        "rw-".to_string()
    }
}

/// Read file content
#[tauri::command]
pub async fn pty_read_file(
    file_path: String,
    max_bytes: Option<usize>,
) -> Result<String, String> {
    let max = max_bytes.unwrap_or(1024 * 1024); // 1MB default
    
    let content = std::fs::read(&file_path)
        .map_err(|e| format!("Failed to read file: {}", e))?;
    
    if content.len() > max {
        return Err(format!("File too large: {} bytes (max {})", content.len(), max));
    }
    
    String::from_utf8(content)
        .map_err(|e| format!("File is not valid UTF-8: {}", e))
}

/// Write file content
#[tauri::command]
pub async fn pty_write_file(
    file_path: String,
    content: String,
) -> Result<(), String> {
    std::fs::write(&file_path, content)
        .map_err(|e| format!("Failed to write file: {}", e))
}

/// Create directory
#[tauri::command]
pub async fn pty_create_directory(
    directory: String,
) -> Result<(), String> {
    std::fs::create_dir_all(&directory)
        .map_err(|e| format!("Failed to create directory: {}", e))
}

/// Delete file or directory
#[tauri::command]
pub async fn pty_delete_path(
    path: String,
    recursive: bool,
) -> Result<(), String> {
    let p = std::path::Path::new(&path);
    
    if !p.exists() {
        return Err(format!("Path does not exist: {}", path));
    }
    
    if p.is_dir() {
        if recursive {
            std::fs::remove_dir_all(p)
                .map_err(|e| format!("Failed to remove directory: {}", e))
        } else {
            std::fs::remove_dir(p)
                .map_err(|e| format!("Failed to remove directory: {}", e))
        }
    } else {
        std::fs::remove_file(p)
            .map_err(|e| format!("Failed to remove file: {}", e))
    }
}

/// Rename/move file or directory
#[tauri::command]
pub async fn pty_rename_path(
    from: String,
    to: String,
) -> Result<(), String> {
    std::fs::rename(&from, &to)
        .map_err(|e| format!("Failed to rename: {}", e))
}

/// Copy file or directory
#[tauri::command]
pub async fn pty_copy_path(
    from: String,
    to: String,
) -> Result<(), String> {
    let from_path = std::path::Path::new(&from);
    
    if from_path.is_dir() {
        copy_dir_recursive(from_path, std::path::Path::new(&to))
            .map_err(|e| format!("Failed to copy directory: {}", e))
    } else {
        std::fs::copy(&from, &to)
            .map(|_| ())
            .map_err(|e| format!("Failed to copy file: {}", e))
    }
}

/// Recursively copy directory
fn copy_dir_recursive(src: &std::path::Path, dst: &std::path::Path) -> std::io::Result<()> {
    std::fs::create_dir_all(dst)?;
    
    for entry in std::fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        
        if ty.is_dir() {
            copy_dir_recursive(&entry.path(), &dst.join(entry.file_name()))?;
        } else {
            std::fs::copy(entry.path(), dst.join(entry.file_name()))?;
        }
    }
    
    Ok(())
}
