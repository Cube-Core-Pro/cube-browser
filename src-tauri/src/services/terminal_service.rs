use crate::models::terminal::{TerminalSession, CommandHistory, TerminalConfig, TerminalStats, CommandFrequency};
use log::info;
use rusqlite::{params, Connection, Result as SqliteResult};
use std::sync::{Arc, Mutex};

pub struct TerminalService {
    conn: Arc<Mutex<Connection>>,
}

impl TerminalService {
    pub fn new(db_path: &str) -> Result<Self, String> {
        let conn = Connection::open(db_path)
            .map_err(|e| format!("Failed to open terminal database: {}", e))?;
        
        let service = Self {
            conn: Arc::new(Mutex::new(conn)),
        };
        
        service.init_database()?;
        info!("💻 Terminal Service initialized");
        
        Ok(service)
    }
    
    fn init_database(&self) -> Result<(), String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        conn.execute(
            "CREATE TABLE IF NOT EXISTS terminal_sessions (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                working_directory TEXT NOT NULL,
                shell TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                last_used_at INTEGER NOT NULL,
                is_active INTEGER NOT NULL DEFAULT 1,
                environment_vars TEXT
            )",
            [],
        ).map_err(|e| format!("Failed to create terminal_sessions table: {}", e))?;
        
        conn.execute(
            "CREATE TABLE IF NOT EXISTS command_history (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                command TEXT NOT NULL,
                output TEXT,
                exit_code INTEGER NOT NULL,
                executed_at INTEGER NOT NULL,
                duration_ms INTEGER NOT NULL,
                working_directory TEXT NOT NULL,
                FOREIGN KEY (session_id) REFERENCES terminal_sessions(id) ON DELETE CASCADE
            )",
            [],
        ).map_err(|e| format!("Failed to create command_history table: {}", e))?;
        
        conn.execute(
            "CREATE TABLE IF NOT EXISTS terminal_config (
                id TEXT PRIMARY KEY,
                font_family TEXT NOT NULL,
                font_size INTEGER NOT NULL,
                theme TEXT NOT NULL,
                cursor_style TEXT NOT NULL,
                cursor_blink INTEGER NOT NULL,
                scrollback_lines INTEGER NOT NULL,
                bell_enabled INTEGER NOT NULL
            )",
            [],
        ).map_err(|e| format!("Failed to create terminal_config table: {}", e))?;
        
        // Create indexes
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_sessions_active ON terminal_sessions(is_active, last_used_at DESC)",
            [],
        ).map_err(|e| format!("Failed to create index: {}", e))?;
        
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_history_session ON command_history(session_id, executed_at DESC)",
            [],
        ).map_err(|e| format!("Failed to create index: {}", e))?;
        
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_history_command ON command_history(command)",
            [],
        ).map_err(|e| format!("Failed to create index: {}", e))?;
        
        // Insert default config if not exists
        conn.execute(
            "INSERT OR IGNORE INTO terminal_config (id, font_family, font_size, theme, cursor_style, cursor_blink, scrollback_lines, bell_enabled)
             VALUES ('default', 'JetBrains Mono', 14, 'dark', 'block', 1, 10000, 0)",
            [],
        ).map_err(|e| format!("Failed to insert default config: {}", e))?;
        
        Ok(())
    }
    
    // Session methods
    
    pub fn create_session(&self, session: &TerminalSession) -> Result<(), String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        conn.execute(
            "INSERT INTO terminal_sessions (id, name, working_directory, shell, created_at, last_used_at, is_active, environment_vars)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                session.id,
                session.name,
                session.working_directory,
                session.shell,
                session.created_at,
                session.last_used_at,
                if session.is_active { 1 } else { 0 },
                session.environment_vars,
            ],
        ).map_err(|e| format!("Failed to create session: {}", e))?;
        
        Ok(())
    }
    
    pub fn get_all_sessions(&self) -> Result<Vec<TerminalSession>, String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        let mut stmt = conn.prepare(
            "SELECT id, name, working_directory, shell, created_at, last_used_at, is_active, environment_vars
             FROM terminal_sessions
             ORDER BY last_used_at DESC"
        ).map_err(|e| format!("Failed to prepare statement: {}", e))?;
        
        let sessions = stmt.query_map([], |row| {
            Ok(TerminalSession {
                id: row.get(0)?,
                name: row.get(1)?,
                working_directory: row.get(2)?,
                shell: row.get(3)?,
                created_at: row.get(4)?,
                last_used_at: row.get(5)?,
                is_active: row.get::<_, i32>(6)? != 0,
                environment_vars: row.get(7)?,
            })
        }).map_err(|e| format!("Failed to query sessions: {}", e))?;
        
        sessions
            .collect::<SqliteResult<Vec<_>>>()
            .map_err(|e| format!("Failed to collect sessions: {}", e))
    }
    
    pub fn get_active_sessions(&self) -> Result<Vec<TerminalSession>, String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        let mut stmt = conn.prepare(
            "SELECT id, name, working_directory, shell, created_at, last_used_at, is_active, environment_vars
             FROM terminal_sessions
             WHERE is_active = 1
             ORDER BY last_used_at DESC"
        ).map_err(|e| format!("Failed to prepare statement: {}", e))?;
        
        let sessions = stmt.query_map([], |row| {
            Ok(TerminalSession {
                id: row.get(0)?,
                name: row.get(1)?,
                working_directory: row.get(2)?,
                shell: row.get(3)?,
                created_at: row.get(4)?,
                last_used_at: row.get(5)?,
                is_active: row.get::<_, i32>(6)? != 0,
                environment_vars: row.get(7)?,
            })
        }).map_err(|e| format!("Failed to query active sessions: {}", e))?;
        
        sessions
            .collect::<SqliteResult<Vec<_>>>()
            .map_err(|e| format!("Failed to collect active sessions: {}", e))
    }
    
    pub fn update_session_activity(&self, session_id: &str) -> Result<(), String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        let now = chrono::Utc::now().timestamp();
        
        conn.execute(
            "UPDATE terminal_sessions SET last_used_at = ?2 WHERE id = ?1",
            params![session_id, now],
        ).map_err(|e| format!("Failed to update session activity: {}", e))?;
        
        Ok(())
    }
    
    pub fn close_session(&self, session_id: &str) -> Result<(), String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        conn.execute(
            "UPDATE terminal_sessions SET is_active = 0 WHERE id = ?1",
            params![session_id],
        ).map_err(|e| format!("Failed to close session: {}", e))?;
        
        Ok(())
    }
    
    pub fn delete_session(&self, session_id: &str) -> Result<(), String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        conn.execute("DELETE FROM terminal_sessions WHERE id = ?1", params![session_id])
            .map_err(|e| format!("Failed to delete session: {}", e))?;
        
        Ok(())
    }
    
    // Command history methods
    
    pub fn add_command_history(&self, history: &CommandHistory) -> Result<(), String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        conn.execute(
            "INSERT INTO command_history (id, session_id, command, output, exit_code, executed_at, duration_ms, working_directory)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                history.id,
                history.session_id,
                history.command,
                history.output,
                history.exit_code,
                history.executed_at,
                history.duration_ms,
                history.working_directory,
            ],
        ).map_err(|e| format!("Failed to add command history: {}", e))?;
        
        Ok(())
    }
    
    pub fn get_session_history(&self, session_id: &str, limit: i32) -> Result<Vec<CommandHistory>, String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        let mut stmt = conn.prepare(
            "SELECT id, session_id, command, output, exit_code, executed_at, duration_ms, working_directory
             FROM command_history
             WHERE session_id = ?1
             ORDER BY executed_at DESC
             LIMIT ?2"
        ).map_err(|e| format!("Failed to prepare statement: {}", e))?;
        
        let history = stmt.query_map(params![session_id, limit], |row| {
            Ok(CommandHistory {
                id: row.get(0)?,
                session_id: row.get(1)?,
                command: row.get(2)?,
                output: row.get(3)?,
                exit_code: row.get(4)?,
                executed_at: row.get(5)?,
                duration_ms: row.get(6)?,
                working_directory: row.get(7)?,
            })
        }).map_err(|e| format!("Failed to query history: {}", e))?;
        
        history
            .collect::<SqliteResult<Vec<_>>>()
            .map_err(|e| format!("Failed to collect history: {}", e))
    }
    
    pub fn search_history(&self, query: &str, limit: i32) -> Result<Vec<CommandHistory>, String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        let pattern = format!("%{}%", query);
        
        let mut stmt = conn.prepare(
            "SELECT id, session_id, command, output, exit_code, executed_at, duration_ms, working_directory
             FROM command_history
             WHERE command LIKE ?1
             ORDER BY executed_at DESC
             LIMIT ?2"
        ).map_err(|e| format!("Failed to prepare statement: {}", e))?;
        
        let history = stmt.query_map(params![pattern, limit], |row| {
            Ok(CommandHistory {
                id: row.get(0)?,
                session_id: row.get(1)?,
                command: row.get(2)?,
                output: row.get(3)?,
                exit_code: row.get(4)?,
                executed_at: row.get(5)?,
                duration_ms: row.get(6)?,
                working_directory: row.get(7)?,
            })
        }).map_err(|e| format!("Failed to query history: {}", e))?;
        
        history
            .collect::<SqliteResult<Vec<_>>>()
            .map_err(|e| format!("Failed to collect history: {}", e))
    }
    
    pub fn clear_session_history(&self, session_id: &str) -> Result<(), String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        conn.execute("DELETE FROM command_history WHERE session_id = ?1", params![session_id])
            .map_err(|e| format!("Failed to clear history: {}", e))?;
        
        Ok(())
    }
    
    // Config methods
    
    pub fn get_config(&self) -> Result<TerminalConfig, String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        let config = conn.query_row(
            "SELECT id, font_family, font_size, theme, cursor_style, cursor_blink, scrollback_lines, bell_enabled
             FROM terminal_config
             WHERE id = 'default'",
            [],
            |row| {
                Ok(TerminalConfig {
                    id: row.get(0)?,
                    font_family: row.get(1)?,
                    font_size: row.get(2)?,
                    theme: row.get(3)?,
                    cursor_style: row.get(4)?,
                    cursor_blink: row.get::<_, i32>(5)? != 0,
                    scrollback_lines: row.get(6)?,
                    bell_enabled: row.get::<_, i32>(7)? != 0,
                })
            },
        ).map_err(|e| format!("Failed to get config: {}", e))?;
        
        Ok(config)
    }
    
    pub fn update_config(&self, config: &TerminalConfig) -> Result<(), String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        conn.execute(
            "UPDATE terminal_config SET
                font_family = ?2, font_size = ?3, theme = ?4,
                cursor_style = ?5, cursor_blink = ?6, scrollback_lines = ?7, bell_enabled = ?8
             WHERE id = ?1",
            params![
                config.id,
                config.font_family,
                config.font_size,
                config.theme,
                config.cursor_style,
                if config.cursor_blink { 1 } else { 0 },
                config.scrollback_lines,
                if config.bell_enabled { 1 } else { 0 },
            ],
        ).map_err(|e| format!("Failed to update config: {}", e))?;
        
        Ok(())
    }
    
    // Stats methods
    
    pub fn get_stats(&self) -> Result<TerminalStats, String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        let total_sessions: i32 = conn.query_row(
            "SELECT COUNT(*) FROM terminal_sessions",
            [],
            |row| row.get(0),
        ).unwrap_or(0);
        
        let active_sessions: i32 = conn.query_row(
            "SELECT COUNT(*) FROM terminal_sessions WHERE is_active = 1",
            [],
            |row| row.get(0),
        ).unwrap_or(0);
        
        let total_commands: i32 = conn.query_row(
            "SELECT COUNT(*) FROM command_history",
            [],
            |row| row.get(0),
        ).unwrap_or(0);
        
        // Get most used commands
        let mut stmt = conn.prepare(
            "SELECT command, COUNT(*) as count
             FROM command_history
             GROUP BY command
             ORDER BY count DESC
             LIMIT 10"
        ).map_err(|e| format!("Failed to prepare statement: {}", e))?;
        
        let most_used = stmt.query_map([], |row| {
            Ok(CommandFrequency {
                command: row.get(0)?,
                count: row.get(1)?,
            })
        }).map_err(|e| format!("Failed to query most used commands: {}", e))?
            .collect::<SqliteResult<Vec<_>>>()
            .map_err(|e| format!("Failed to collect most used commands: {}", e))?;
        
        Ok(TerminalStats {
            total_sessions,
            active_sessions,
            total_commands,
            most_used_commands: most_used,
        })
    }
}
