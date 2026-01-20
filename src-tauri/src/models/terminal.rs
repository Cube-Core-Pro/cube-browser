use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TerminalSession {
    pub id: String,
    pub name: String,
    pub working_directory: String,
    pub shell: String, // "bash", "zsh", "fish", etc.
    pub created_at: i64,
    pub last_used_at: i64,
    pub is_active: bool,
    pub environment_vars: Option<String>, // JSON string
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandHistory {
    pub id: String,
    pub session_id: String,
    pub command: String,
    pub output: Option<String>,
    pub exit_code: i32,
    pub executed_at: i64,
    pub duration_ms: i64,
    pub working_directory: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TerminalConfig {
    pub id: String,
    pub font_family: String,
    pub font_size: i32,
    pub theme: String, // "dark", "light", etc.
    pub cursor_style: String, // "block", "line", "underline"
    pub cursor_blink: bool,
    pub scrollback_lines: i32,
    pub bell_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TerminalStats {
    pub total_sessions: i32,
    pub active_sessions: i32,
    pub total_commands: i32,
    pub most_used_commands: Vec<CommandFrequency>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandFrequency {
    pub command: String,
    pub count: i32,
}
