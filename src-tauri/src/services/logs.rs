/**
 * Execution Logs Service
 * 
 * Manages workflow execution logs with:
 * - Structured logging (DEBUG, INFO, WARN, ERROR)
 * - Searchable by workflow, execution, date range
 * - Log filtering by level and keywords
 * - Export to file (JSON, CSV, TXT)
 * - Real-time log streaming
 */

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::File;
use std::io::Write;
use std::path::PathBuf;
use std::sync::{Arc, RwLock};
use log::info;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
pub enum LogLevel {
    Debug,
    Info,
    Warn,
    Error,
}

impl LogLevel {
    pub fn as_str(&self) -> &str {
        match self {
            LogLevel::Debug => "DEBUG",
            LogLevel::Info => "INFO",
            LogLevel::Warn => "WARN",
            LogLevel::Error => "ERROR",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEntry {
    pub id: String,
    pub timestamp: DateTime<Utc>,
    pub level: LogLevel,
    pub workflow_id: Option<String>,
    pub execution_id: Option<String>,
    pub node_id: Option<String>,
    pub message: String,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogFilter {
    pub workflow_id: Option<String>,
    pub execution_id: Option<String>,
    pub level: Option<LogLevel>,
    pub start_time: Option<DateTime<Utc>>,
    pub end_time: Option<DateTime<Utc>>,
    pub keyword: Option<String>,
    pub limit: Option<usize>,
}

pub struct LogsService {
    logs: Arc<RwLock<Vec<LogEntry>>>,
    max_logs: usize,
}

impl LogsService {
    pub fn new() -> Self {
        info!("📝 Initializing LogsService");
        Self {
            logs: Arc::new(RwLock::new(Vec::new())),
            max_logs: 10000, // Keep last 10,000 logs in memory
        }
    }

    /// Add a log entry
    pub fn log(
        &self,
        level: LogLevel,
        message: String,
        workflow_id: Option<String>,
        execution_id: Option<String>,
        node_id: Option<String>,
        metadata: HashMap<String, String>,
    ) -> Result<String, String> {
        let log_id = format!("log-{}-{}", Utc::now().timestamp_millis(), uuid::Uuid::new_v4());
        
        let entry = LogEntry {
            id: log_id.clone(),
            timestamp: Utc::now(),
            level: level.clone(),
            workflow_id,
            execution_id,
            node_id,
            message: message.clone(),
            metadata,
        };

        let mut logs = self.logs.write().map_err(|e| format!("Lock error: {}", e))?;
        logs.push(entry);

        // Trim if exceeds max
        if logs.len() > self.max_logs {
            let excess = logs.len() - self.max_logs;
            logs.drain(0..excess);
        }

        // Also log to console
        match level {
            LogLevel::Debug => log::debug!("{}", message),
            LogLevel::Info => log::info!("{}", message),
            LogLevel::Warn => log::warn!("{}", message),
            LogLevel::Error => log::error!("{}", message),
        }

        Ok(log_id)
    }

    /// Convenience methods for different log levels
    pub fn debug(
        &self,
        message: String,
        workflow_id: Option<String>,
        execution_id: Option<String>,
        node_id: Option<String>,
    ) -> Result<String, String> {
        self.log(LogLevel::Debug, message, workflow_id, execution_id, node_id, HashMap::new())
    }

    pub fn info(
        &self,
        message: String,
        workflow_id: Option<String>,
        execution_id: Option<String>,
        node_id: Option<String>,
    ) -> Result<String, String> {
        self.log(LogLevel::Info, message, workflow_id, execution_id, node_id, HashMap::new())
    }

    pub fn warn(
        &self,
        message: String,
        workflow_id: Option<String>,
        execution_id: Option<String>,
        node_id: Option<String>,
    ) -> Result<String, String> {
        self.log(LogLevel::Warn, message, workflow_id, execution_id, node_id, HashMap::new())
    }

    pub fn error(
        &self,
        message: String,
        workflow_id: Option<String>,
        execution_id: Option<String>,
        node_id: Option<String>,
    ) -> Result<String, String> {
        self.log(LogLevel::Error, message, workflow_id, execution_id, node_id, HashMap::new())
    }

    /// Get logs with filtering
    pub fn get_logs(&self, filter: LogFilter) -> Result<Vec<LogEntry>, String> {
        let logs = self.logs.read().map_err(|e| format!("Lock error: {}", e))?;
        
        let mut filtered: Vec<LogEntry> = logs.iter()
            .filter(|log| {
                // Filter by workflow_id
                if let Some(ref wf_id) = filter.workflow_id {
                    if log.workflow_id.as_ref() != Some(wf_id) {
                        return false;
                    }
                }

                // Filter by execution_id
                if let Some(ref exec_id) = filter.execution_id {
                    if log.execution_id.as_ref() != Some(exec_id) {
                        return false;
                    }
                }

                // Filter by level (minimum level)
                if let Some(ref min_level) = filter.level {
                    if &log.level < min_level {
                        return false;
                    }
                }

                // Filter by start_time
                if let Some(ref start) = filter.start_time {
                    if log.timestamp < *start {
                        return false;
                    }
                }

                // Filter by end_time
                if let Some(ref end) = filter.end_time {
                    if log.timestamp > *end {
                        return false;
                    }
                }

                // Filter by keyword (case-insensitive)
                if let Some(ref keyword) = filter.keyword {
                    let keyword_lower = keyword.to_lowercase();
                    if !log.message.to_lowercase().contains(&keyword_lower) {
                        return false;
                    }
                }

                true
            })
            .cloned()
            .collect();

        // Sort by timestamp descending (newest first)
        filtered.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));

        // Apply limit
        if let Some(limit) = filter.limit {
            filtered.truncate(limit);
        }

        Ok(filtered)
    }

    /// Get recent logs (last N)
    pub fn get_recent_logs(&self, count: usize) -> Result<Vec<LogEntry>, String> {
        let logs = self.logs.read().map_err(|e| format!("Lock error: {}", e))?;
        
        let start = if logs.len() > count {
            logs.len() - count
        } else {
            0
        };

        let mut recent: Vec<LogEntry> = logs[start..].to_vec();
        recent.reverse(); // Newest first
        Ok(recent)
    }

    /// Export logs to JSON file
    pub fn export_to_json(&self, filter: LogFilter, path: PathBuf) -> Result<String, String> {
        let logs = self.get_logs(filter)?;
        
        let json = serde_json::to_string_pretty(&logs)
            .map_err(|e| format!("JSON serialization failed: {}", e))?;
        
        let mut file = File::create(&path)
            .map_err(|e| format!("Failed to create file: {}", e))?;
        
        file.write_all(json.as_bytes())
            .map_err(|e| format!("Failed to write file: {}", e))?;
        
        info!("📝 Exported {} logs to {:?}", logs.len(), path);
        Ok(path.to_string_lossy().to_string())
    }

    /// Export logs to CSV file
    pub fn export_to_csv(&self, filter: LogFilter, path: PathBuf) -> Result<String, String> {
        let logs = self.get_logs(filter)?;
        let log_count = logs.len();
        
        let mut file = File::create(&path)
            .map_err(|e| format!("Failed to create file: {}", e))?;
        
        // Write CSV header
        writeln!(file, "Timestamp,Level,Workflow ID,Execution ID,Node ID,Message")
            .map_err(|e| format!("Failed to write header: {}", e))?;
        
        // Write rows
        for log in &logs {
            writeln!(
                file,
                "{},{},{},{},{},\"{}\"",
                log.timestamp.to_rfc3339(),
                log.level.as_str(),
                log.workflow_id.as_ref().unwrap_or(&String::new()),
                log.execution_id.as_ref().unwrap_or(&String::new()),
                log.node_id.as_ref().unwrap_or(&String::new()),
                log.message.replace('"', "\"\"") // Escape quotes
            ).map_err(|e| format!("Failed to write row: {}", e))?;
        }
        
        info!("📝 Exported {} logs to CSV: {:?}", log_count, path);
        Ok(path.to_string_lossy().to_string())
    }

    /// Export logs to plain text file
    pub fn export_to_txt(&self, filter: LogFilter, path: PathBuf) -> Result<String, String> {
        let logs = self.get_logs(filter)?;
        let log_count = logs.len();
        
        let mut file = File::create(&path)
            .map_err(|e| format!("Failed to create file: {}", e))?;
        
        for log in &logs {
            writeln!(
                file,
                "[{}] {} {} {}",
                log.timestamp.format("%Y-%m-%d %H:%M:%S"),
                log.level.as_str(),
                log.workflow_id.as_deref().unwrap_or("N/A"),
                log.message
            ).map_err(|e| format!("Failed to write line: {}", e))?;
        }
        
        info!("📝 Exported {} logs to TXT: {:?}", log_count, path);
        Ok(path.to_string_lossy().to_string())
    }

    /// Clear all logs
    pub fn clear_logs(&self) -> Result<usize, String> {
        let mut logs = self.logs.write().map_err(|e| format!("Lock error: {}", e))?;
        let count = logs.len();
        logs.clear();
        info!("📝 Cleared {} logs", count);
        Ok(count)
    }

    /// Get log statistics
    pub fn get_stats(&self) -> Result<LogStats, String> {
        let logs = self.logs.read().map_err(|e| format!("Lock error: {}", e))?;
        
        let total = logs.len();
        let debug = logs.iter().filter(|l| matches!(l.level, LogLevel::Debug)).count();
        let info = logs.iter().filter(|l| matches!(l.level, LogLevel::Info)).count();
        let warn = logs.iter().filter(|l| matches!(l.level, LogLevel::Warn)).count();
        let error = logs.iter().filter(|l| matches!(l.level, LogLevel::Error)).count();
        
        Ok(LogStats {
            total,
            debug,
            info,
            warn,
            error,
        })
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogStats {
    pub total: usize,
    pub debug: usize,
    pub info: usize,
    pub warn: usize,
    pub error: usize,
}
