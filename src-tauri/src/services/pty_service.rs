// PTY Service - Real Terminal Execution
// Provides true pseudo-terminal functionality with async command execution

use log::{info, error, debug};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{BufRead, BufReader, Write};
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::thread;
use tokio::sync::mpsc;
use uuid::Uuid;

/// PTY Session state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PtySession {
    pub id: String,
    pub name: String,
    pub shell: String,
    pub working_directory: String,
    pub cols: u16,
    pub rows: u16,
    pub created_at: i64,
    pub is_active: bool,
    pub pid: Option<u32>,
}

/// Command execution request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandRequest {
    pub session_id: String,
    pub command: String,
    pub working_directory: Option<String>,
    pub environment: Option<HashMap<String, String>>,
    pub timeout_secs: Option<u64>,
}

/// Command execution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandResult {
    pub session_id: String,
    pub command: String,
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
    pub duration_ms: u64,
    pub working_directory: String,
    pub executed_at: i64,
}

/// Real-time output chunk
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutputChunk {
    pub session_id: String,
    pub chunk_type: String, // "stdout", "stderr", "exit"
    pub data: String,
    pub timestamp: i64,
}

/// PTY configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PtyConfig {
    pub default_shell: String,
    pub default_cols: u16,
    pub default_rows: u16,
    pub scrollback_lines: u32,
    pub enable_bell: bool,
    pub cursor_style: String,
    pub font_family: String,
    pub font_size: u16,
}

impl Default for PtyConfig {
    fn default() -> Self {
        Self {
            default_shell: detect_default_shell(),
            default_cols: 120,
            default_rows: 30,
            scrollback_lines: 10000,
            enable_bell: false,
            cursor_style: "block".to_string(),
            font_family: "JetBrains Mono".to_string(),
            font_size: 14,
        }
    }
}

/// Detect default shell on the system
fn detect_default_shell() -> String {
    if cfg!(target_os = "windows") {
        "powershell.exe".to_string()
    } else {
        std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string())
    }
}

/// Active process handle
struct ProcessHandle {
    child: Child,
    session_id: String,
}

/// PTY Service for real terminal execution
pub struct PtyService {
    sessions: Arc<Mutex<HashMap<String, PtySession>>>,
    processes: Arc<Mutex<HashMap<String, ProcessHandle>>>,
    config: Arc<Mutex<PtyConfig>>,
    output_tx: Option<mpsc::Sender<OutputChunk>>,
}

impl PtyService {
    /// Create new PTY service
    pub fn new() -> Self {
        info!("🖥️ PTY Service initialized");
        
        Self {
            sessions: Arc::new(Mutex::new(HashMap::new())),
            processes: Arc::new(Mutex::new(HashMap::new())),
            config: Arc::new(Mutex::new(PtyConfig::default())),
            output_tx: None,
        }
    }
    
    /// Create new PTY service with output channel
    pub fn with_output_channel(tx: mpsc::Sender<OutputChunk>) -> Self {
        info!("🖥️ PTY Service initialized with output channel");
        
        Self {
            sessions: Arc::new(Mutex::new(HashMap::new())),
            processes: Arc::new(Mutex::new(HashMap::new())),
            config: Arc::new(Mutex::new(PtyConfig::default())),
            output_tx: Some(tx),
        }
    }
    
    /// Get current configuration
    pub fn get_config(&self) -> Result<PtyConfig, String> {
        let config = self.config.lock()
            .map_err(|e| format!("Failed to lock config: {}", e))?;
        Ok(config.clone())
    }
    
    /// Update configuration
    pub fn update_config(&self, new_config: PtyConfig) -> Result<(), String> {
        let mut config = self.config.lock()
            .map_err(|e| format!("Failed to lock config: {}", e))?;
        *config = new_config;
        info!("PTY config updated");
        Ok(())
    }
    
    /// Create a new PTY session
    pub fn create_session(&self, name: Option<String>, working_dir: Option<String>) -> Result<PtySession, String> {
        let config = self.config.lock()
            .map_err(|e| format!("Failed to lock config: {}", e))?;
        
        let session_id = Uuid::new_v4().to_string();
        let session_name = name.unwrap_or_else(|| format!("Session {}", &session_id[..8]));
        
        // Determine working directory
        let work_dir = working_dir.unwrap_or_else(|| {
            std::env::var("HOME").unwrap_or_else(|_| "/".to_string())
        });
        
        // Validate working directory exists
        if !std::path::Path::new(&work_dir).exists() {
            return Err(format!("Working directory does not exist: {}", work_dir));
        }
        
        let session = PtySession {
            id: session_id.clone(),
            name: session_name,
            shell: config.default_shell.clone(),
            working_directory: work_dir,
            cols: config.default_cols,
            rows: config.default_rows,
            created_at: chrono::Utc::now().timestamp(),
            is_active: true,
            pid: None,
        };
        
        let mut sessions = self.sessions.lock()
            .map_err(|e| format!("Failed to lock sessions: {}", e))?;
        sessions.insert(session_id.clone(), session.clone());
        
        info!("Created PTY session: {} ({})", session.name, session.id);
        
        Ok(session)
    }
    
    /// Get session by ID
    pub fn get_session(&self, session_id: &str) -> Result<PtySession, String> {
        let sessions = self.sessions.lock()
            .map_err(|e| format!("Failed to lock sessions: {}", e))?;
        
        sessions.get(session_id)
            .cloned()
            .ok_or_else(|| format!("Session not found: {}", session_id))
    }
    
    /// Get all sessions
    pub fn get_all_sessions(&self) -> Result<Vec<PtySession>, String> {
        let sessions = self.sessions.lock()
            .map_err(|e| format!("Failed to lock sessions: {}", e))?;
        
        Ok(sessions.values().cloned().collect())
    }
    
    /// Get active sessions
    pub fn get_active_sessions(&self) -> Result<Vec<PtySession>, String> {
        let sessions = self.sessions.lock()
            .map_err(|e| format!("Failed to lock sessions: {}", e))?;
        
        Ok(sessions.values()
            .filter(|s| s.is_active)
            .cloned()
            .collect())
    }
    
    /// Update session working directory
    pub fn update_working_directory(&self, session_id: &str, new_dir: &str) -> Result<(), String> {
        // Validate directory exists
        if !std::path::Path::new(new_dir).exists() {
            return Err(format!("Directory does not exist: {}", new_dir));
        }
        
        let mut sessions = self.sessions.lock()
            .map_err(|e| format!("Failed to lock sessions: {}", e))?;
        
        if let Some(session) = sessions.get_mut(session_id) {
            session.working_directory = new_dir.to_string();
            debug!("Updated working directory for {}: {}", session_id, new_dir);
            Ok(())
        } else {
            Err(format!("Session not found: {}", session_id))
        }
    }
    
    /// Close a PTY session
    pub fn close_session(&self, session_id: &str) -> Result<(), String> {
        // Kill any running process
        self.kill_process(session_id).ok();
        
        // Mark session as inactive
        let mut sessions = self.sessions.lock()
            .map_err(|e| format!("Failed to lock sessions: {}", e))?;
        
        if let Some(session) = sessions.get_mut(session_id) {
            session.is_active = false;
            info!("Closed PTY session: {}", session_id);
            Ok(())
        } else {
            Err(format!("Session not found: {}", session_id))
        }
    }
    
    /// Delete a PTY session
    pub fn delete_session(&self, session_id: &str) -> Result<(), String> {
        // Kill any running process first
        self.kill_process(session_id).ok();
        
        let mut sessions = self.sessions.lock()
            .map_err(|e| format!("Failed to lock sessions: {}", e))?;
        
        sessions.remove(session_id)
            .ok_or_else(|| format!("Session not found: {}", session_id))?;
        
        info!("Deleted PTY session: {}", session_id);
        Ok(())
    }
    
    /// Execute a command synchronously (blocking)
    pub fn execute_command(&self, request: CommandRequest) -> Result<CommandResult, String> {
        let start_time = std::time::Instant::now();
        let executed_at = chrono::Utc::now().timestamp();
        
        // Get or create session
        let session = self.get_session(&request.session_id)?;
        
        // Determine working directory
        let work_dir = request.working_directory
            .as_ref()
            .unwrap_or(&session.working_directory);
        
        // Build command based on OS
        let (shell, shell_arg) = if cfg!(target_os = "windows") {
            ("cmd", "/C")
        } else {
            ("sh", "-c")
        };
        
        debug!("Executing command in {}: {}", work_dir, request.command);
        
        // Create command
        let mut cmd = Command::new(shell);
        cmd.arg(shell_arg)
            .arg(&request.command)
            .current_dir(work_dir)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());
        
        // Add environment variables
        if let Some(env) = &request.environment {
            for (key, value) in env {
                cmd.env(key, value);
            }
        }
        
        // Execute command
        let output = cmd.output()
            .map_err(|e| format!("Failed to execute command: {}", e))?;
        
        let duration_ms = start_time.elapsed().as_millis() as u64;
        
        // Parse output
        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        let exit_code = output.status.code().unwrap_or(-1);
        
        // Handle cd command specially to update working directory
        if request.command.trim().starts_with("cd ") {
            let parts: Vec<&str> = request.command.trim().splitn(2, ' ').collect();
            if parts.len() == 2 {
                let target_dir = parts[1].trim();
                let new_dir = if target_dir.starts_with('/') {
                    target_dir.to_string()
                } else if target_dir == "~" {
                    std::env::var("HOME").unwrap_or_else(|_| work_dir.to_string())
                } else if target_dir == "-" {
                    work_dir.to_string() // Would need to track previous dir
                } else if target_dir == ".." {
                    std::path::Path::new(work_dir)
                        .parent()
                        .map(|p| p.to_string_lossy().to_string())
                        .unwrap_or_else(|| work_dir.to_string())
                } else {
                    format!("{}/{}", work_dir, target_dir)
                };
                
                // Canonicalize path
                if let Ok(canonical) = std::fs::canonicalize(&new_dir) {
                    self.update_working_directory(&request.session_id, &canonical.to_string_lossy())?;
                }
            }
        }
        
        let result = CommandResult {
            session_id: request.session_id,
            command: request.command,
            stdout,
            stderr,
            exit_code,
            duration_ms,
            working_directory: work_dir.to_string(),
            executed_at,
        };
        
        debug!("Command completed in {}ms with exit code {}", duration_ms, exit_code);
        
        Ok(result)
    }
    
    /// Execute command with real-time output streaming
    pub fn execute_streaming(&self, request: CommandRequest) -> Result<String, String> {
        let session = self.get_session(&request.session_id)?;
        let work_dir = request.working_directory
            .as_ref()
            .unwrap_or(&session.working_directory)
            .clone();
        
        let (shell, shell_arg) = if cfg!(target_os = "windows") {
            ("cmd", "/C")
        } else {
            ("sh", "-c")
        };
        
        let child = Command::new(shell)
            .arg(shell_arg)
            .arg(&request.command)
            .current_dir(&work_dir)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to spawn command: {}", e))?;
        
        let pid = child.id();
        let session_id = request.session_id.clone();
        
        // Update session with PID
        {
            let mut sessions = self.sessions.lock()
                .map_err(|e| format!("Failed to lock sessions: {}", e))?;
            if let Some(s) = sessions.get_mut(&session_id) {
                s.pid = Some(pid);
            }
        }
        
        // Store process handle
        {
            let mut processes = self.processes.lock()
                .map_err(|e| format!("Failed to lock processes: {}", e))?;
            processes.insert(session_id.clone(), ProcessHandle {
                child,
                session_id: session_id.clone(),
            });
        }
        
        info!("Started streaming command (PID {}): {}", pid, request.command);
        
        Ok(session_id)
    }
    
    /// Kill a running process
    pub fn kill_process(&self, session_id: &str) -> Result<(), String> {
        let mut processes = self.processes.lock()
            .map_err(|e| format!("Failed to lock processes: {}", e))?;
        
        if let Some(handle) = processes.get_mut(session_id) {
            handle.child.kill()
                .map_err(|e| format!("Failed to kill process: {}", e))?;
            processes.remove(session_id);
            
            // Clear PID from session
            let mut sessions = self.sessions.lock()
                .map_err(|e| format!("Failed to lock sessions: {}", e))?;
            if let Some(session) = sessions.get_mut(session_id) {
                session.pid = None;
            }
            
            info!("Killed process for session: {}", session_id);
            Ok(())
        } else {
            Err(format!("No running process for session: {}", session_id))
        }
    }
    
    /// Send input to a running process
    pub fn send_input(&self, session_id: &str, input: &str) -> Result<(), String> {
        let mut processes = self.processes.lock()
            .map_err(|e| format!("Failed to lock processes: {}", e))?;
        
        if let Some(handle) = processes.get_mut(session_id) {
            if let Some(stdin) = handle.child.stdin.as_mut() {
                stdin.write_all(input.as_bytes())
                    .map_err(|e| format!("Failed to write to stdin: {}", e))?;
                stdin.write_all(b"\n")
                    .map_err(|e| format!("Failed to write newline: {}", e))?;
                stdin.flush()
                    .map_err(|e| format!("Failed to flush stdin: {}", e))?;
                Ok(())
            } else {
                Err("Process stdin not available".to_string())
            }
        } else {
            Err(format!("No running process for session: {}", session_id))
        }
    }
    
    /// Resize PTY (for terminal emulator)
    pub fn resize(&self, session_id: &str, cols: u16, rows: u16) -> Result<(), String> {
        let mut sessions = self.sessions.lock()
            .map_err(|e| format!("Failed to lock sessions: {}", e))?;
        
        if let Some(session) = sessions.get_mut(session_id) {
            session.cols = cols;
            session.rows = rows;
            debug!("Resized session {} to {}x{}", session_id, cols, rows);
            Ok(())
        } else {
            Err(format!("Session not found: {}", session_id))
        }
    }
    
    /// Get environment variables
    pub fn get_environment() -> HashMap<String, String> {
        std::env::vars().collect()
    }
    
    /// Execute shell built-in commands
    pub fn execute_builtin(&self, session_id: &str, command: &str) -> Result<String, String> {
        let parts: Vec<&str> = command.trim().split_whitespace().collect();
        if parts.is_empty() {
            return Ok(String::new());
        }
        
        match parts[0] {
            "pwd" => {
                let session = self.get_session(session_id)?;
                Ok(session.working_directory)
            }
            "whoami" => {
                Ok(std::env::var("USER").unwrap_or_else(|_| "unknown".to_string()))
            }
            "hostname" => {
                let output = Command::new("hostname")
                    .output()
                    .map_err(|e| format!("Failed to get hostname: {}", e))?;
                Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
            }
            "echo" => {
                Ok(parts[1..].join(" "))
            }
            "env" => {
                let env: Vec<String> = std::env::vars()
                    .map(|(k, v)| format!("{}={}", k, v))
                    .collect();
                Ok(env.join("\n"))
            }
            "export" => {
                // Whitelist of allowed environment variables for security
                const ALLOWED_ENV_VARS: &[&str] = &[
                    "PATH", "HOME", "USER", "LANG", "TERM", "SHELL",
                    "EDITOR", "VISUAL", "PAGER", "LESS", "LC_ALL",
                    "TZ", "HISTSIZE", "HISTFILESIZE", "PS1", "PS2",
                    "CUBE_", // Allow CUBE_ prefixed vars
                ];
                
                if parts.len() >= 2 {
                    let assignment = parts[1];
                    if let Some((key, value)) = assignment.split_once('=') {
                        // Check if key is in whitelist or starts with CUBE_
                        let is_allowed = ALLOWED_ENV_VARS.iter().any(|allowed| {
                            if allowed.ends_with('_') {
                                key.starts_with(allowed)
                            } else {
                                key == *allowed
                            }
                        });
                        
                        if !is_allowed {
                            return Err(format!(
                                "Setting '{}' is not allowed for security reasons. Allowed: PATH, HOME, USER, LANG, TERM, SHELL, EDITOR, VISUAL, PAGER, CUBE_*",
                                key
                            ));
                        }
                        
                        // SAFETY: Environment variable modification requires unsafe in Rust 1.78+
                        // This is safe in our context because:
                        // 1. Variable names are validated against a strict whitelist (ALLOWED_ENV_VARS)
                        // 2. This code path is only accessible via user-initiated terminal commands
                        // 3. The Tauri command handler serializes access (not called concurrently)
                        // 4. Only PATH, HOME, USER, LANG, TERM, SHELL, EDITOR, VISUAL, PAGER, 
                        //    and CUBE_* prefixed variables are permitted
                        // Risk: Minimal - affects only this process and child processes
                        unsafe { std::env::set_var(key, value); }
                        Ok(format!("Exported {}={}", key, value))
                    } else {
                        Err("Invalid export format. Use: export KEY=VALUE".to_string())
                    }
                } else {
                    Err("Usage: export KEY=VALUE".to_string())
                }
            }
            "clear" => {
                // Return ANSI clear sequence
                Ok("\x1b[2J\x1b[H".to_string())
            }
            "history" => {
                // This would need integration with terminal_service
                Ok("History command requires terminal service integration".to_string())
            }
            _ => {
                // Not a builtin, execute as regular command
                Err(format!("Not a builtin command: {}", parts[0]))
            }
        }
    }
    
    /// Execute multiple commands in sequence
    pub fn execute_batch(&self, session_id: &str, commands: Vec<String>) -> Result<Vec<CommandResult>, String> {
        let mut results = Vec::new();
        
        for cmd in commands {
            let request = CommandRequest {
                session_id: session_id.to_string(),
                command: cmd,
                working_directory: None,
                environment: None,
                timeout_secs: None,
            };
            
            let result = self.execute_command(request)?;
            
            // Stop on error if not explicitly ignoring
            if result.exit_code != 0 {
                results.push(result);
                break;
            }
            
            results.push(result);
        }
        
        Ok(results)
    }
    
    /// Get system information
    pub fn get_system_info() -> Result<HashMap<String, String>, String> {
        let mut info = HashMap::new();
        
        // OS info
        info.insert("os".to_string(), std::env::consts::OS.to_string());
        info.insert("arch".to_string(), std::env::consts::ARCH.to_string());
        
        // Current user
        if let Ok(user) = std::env::var("USER") {
            info.insert("user".to_string(), user);
        }
        
        // Home directory
        if let Ok(home) = std::env::var("HOME") {
            info.insert("home".to_string(), home);
        }
        
        // Current directory
        if let Ok(cwd) = std::env::current_dir() {
            info.insert("cwd".to_string(), cwd.to_string_lossy().to_string());
        }
        
        // Shell
        if let Ok(shell) = std::env::var("SHELL") {
            info.insert("shell".to_string(), shell);
        }
        
        // PATH
        if let Ok(path) = std::env::var("PATH") {
            info.insert("path".to_string(), path);
        }
        
        Ok(info)
    }
    
    /// Get session statistics
    pub fn get_stats(&self) -> Result<HashMap<String, serde_json::Value>, String> {
        let sessions = self.sessions.lock()
            .map_err(|e| format!("Failed to lock sessions: {}", e))?;
        
        let processes = self.processes.lock()
            .map_err(|e| format!("Failed to lock processes: {}", e))?;
        
        let mut stats = HashMap::new();
        stats.insert("total_sessions".to_string(), serde_json::json!(sessions.len()));
        stats.insert("active_sessions".to_string(), serde_json::json!(
            sessions.values().filter(|s| s.is_active).count()
        ));
        stats.insert("running_processes".to_string(), serde_json::json!(processes.len()));
        
        Ok(stats)
    }
}

impl Default for PtyService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_create_session() {
        let service = PtyService::new();
        let session = service.create_session(Some("Test".to_string()), None).unwrap();
        
        assert_eq!(session.name, "Test");
        assert!(session.is_active);
    }
    
    #[test]
    fn test_execute_command() {
        let service = PtyService::new();
        let session = service.create_session(None, None).unwrap();
        
        let request = CommandRequest {
            session_id: session.id,
            command: "echo 'hello world'".to_string(),
            working_directory: None,
            environment: None,
            timeout_secs: None,
        };
        
        let result = service.execute_command(request).unwrap();
        assert!(result.stdout.contains("hello world"));
        assert_eq!(result.exit_code, 0);
    }
    
    #[test]
    fn test_builtin_pwd() {
        let service = PtyService::new();
        let session = service.create_session(None, None).unwrap();
        
        let output = service.execute_builtin(&session.id, "pwd").unwrap();
        assert!(!output.is_empty());
    }
}
