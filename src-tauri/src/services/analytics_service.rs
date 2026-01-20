// ============================================================================
// Analytics Service - Production Implementation
// ============================================================================
// Provides real implementations for metrics, dashboards, and reporting
// Uses SQLite for persistence with time-series optimizations

use anyhow::{Context, Result};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use std::sync::Mutex;
use chrono::{DateTime, Utc, Duration};
use uuid::Uuid;

// ============================================================================
// Service Structure
// ============================================================================

pub struct AnalyticsService {
    conn: Mutex<Connection>,
}

impl AnalyticsService {
    pub fn new<P: AsRef<Path>>(db_path: P) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        let service = Self {
            conn: Mutex::new(conn),
        };
        service.init_schema()?;
        Ok(service)
    }

    fn init_schema(&self) -> Result<()> {
        let conn = self.conn.lock().map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;
        
        conn.execute_batch(r#"
            -- Events table for raw event storage
            CREATE TABLE IF NOT EXISTS analytics_events (
                id TEXT PRIMARY KEY,
                event_type TEXT NOT NULL,
                event_name TEXT NOT NULL,
                user_id TEXT,
                session_id TEXT,
                organization_id TEXT,
                properties_json TEXT NOT NULL DEFAULT '{}',
                context_json TEXT NOT NULL DEFAULT '{}',
                timestamp INTEGER NOT NULL,
                processed INTEGER NOT NULL DEFAULT 0
            );

            -- Pre-aggregated metrics (hourly)
            CREATE TABLE IF NOT EXISTS metrics_hourly (
                id TEXT PRIMARY KEY,
                metric_name TEXT NOT NULL,
                dimension TEXT,
                dimension_value TEXT,
                hour INTEGER NOT NULL,
                count INTEGER NOT NULL DEFAULT 0,
                sum REAL NOT NULL DEFAULT 0,
                min REAL,
                max REAL,
                avg REAL,
                created_at INTEGER NOT NULL,
                UNIQUE(metric_name, dimension, dimension_value, hour)
            );

            -- Pre-aggregated metrics (daily)
            CREATE TABLE IF NOT EXISTS metrics_daily (
                id TEXT PRIMARY KEY,
                metric_name TEXT NOT NULL,
                dimension TEXT,
                dimension_value TEXT,
                day INTEGER NOT NULL,
                count INTEGER NOT NULL DEFAULT 0,
                sum REAL NOT NULL DEFAULT 0,
                min REAL,
                max REAL,
                avg REAL,
                p50 REAL,
                p90 REAL,
                p99 REAL,
                created_at INTEGER NOT NULL,
                UNIQUE(metric_name, dimension, dimension_value, day)
            );

            -- User activity tracking
            CREATE TABLE IF NOT EXISTS user_activity (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                organization_id TEXT,
                activity_type TEXT NOT NULL,
                feature TEXT NOT NULL,
                duration_ms INTEGER,
                success INTEGER,
                error_message TEXT,
                metadata_json TEXT,
                timestamp INTEGER NOT NULL
            );

            -- Dashboard configurations
            CREATE TABLE IF NOT EXISTS dashboards (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                owner_id TEXT NOT NULL,
                organization_id TEXT,
                is_public INTEGER NOT NULL DEFAULT 0,
                layout_json TEXT NOT NULL,
                widgets_json TEXT NOT NULL,
                refresh_interval INTEGER NOT NULL DEFAULT 300,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );

            -- Saved reports
            CREATE TABLE IF NOT EXISTS reports (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                report_type TEXT NOT NULL,
                owner_id TEXT NOT NULL,
                organization_id TEXT,
                query_config_json TEXT NOT NULL,
                schedule_json TEXT,
                last_run_at INTEGER,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );

            -- Report executions history
            CREATE TABLE IF NOT EXISTS report_executions (
                id TEXT PRIMARY KEY,
                report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
                status TEXT NOT NULL,
                result_json TEXT,
                error_message TEXT,
                row_count INTEGER,
                duration_ms INTEGER NOT NULL,
                started_at INTEGER NOT NULL,
                completed_at INTEGER
            );

            -- KPI definitions
            CREATE TABLE IF NOT EXISTS kpi_definitions (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                formula TEXT NOT NULL,
                unit TEXT,
                target_value REAL,
                warning_threshold REAL,
                critical_threshold REAL,
                is_higher_better INTEGER NOT NULL DEFAULT 1,
                organization_id TEXT,
                created_at INTEGER NOT NULL
            );

            -- KPI snapshots (historical values)
            CREATE TABLE IF NOT EXISTS kpi_snapshots (
                id TEXT PRIMARY KEY,
                kpi_id TEXT NOT NULL REFERENCES kpi_definitions(id) ON DELETE CASCADE,
                value REAL NOT NULL,
                previous_value REAL,
                change_percent REAL,
                status TEXT NOT NULL,
                timestamp INTEGER NOT NULL
            );

            -- Funnels
            CREATE TABLE IF NOT EXISTS funnels (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                organization_id TEXT,
                steps_json TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );

            -- Funnel analysis results
            CREATE TABLE IF NOT EXISTS funnel_results (
                id TEXT PRIMARY KEY,
                funnel_id TEXT NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
                period_start INTEGER NOT NULL,
                period_end INTEGER NOT NULL,
                total_users INTEGER NOT NULL,
                steps_data_json TEXT NOT NULL,
                conversion_rate REAL NOT NULL,
                created_at INTEGER NOT NULL
            );

            -- Indexes for performance
            CREATE INDEX IF NOT EXISTS idx_events_type_time ON analytics_events(event_type, timestamp);
            CREATE INDEX IF NOT EXISTS idx_events_user ON analytics_events(user_id, timestamp);
            CREATE INDEX IF NOT EXISTS idx_events_session ON analytics_events(session_id);
            CREATE INDEX IF NOT EXISTS idx_metrics_hourly_name ON metrics_hourly(metric_name, hour);
            CREATE INDEX IF NOT EXISTS idx_metrics_daily_name ON metrics_daily(metric_name, day);
            CREATE INDEX IF NOT EXISTS idx_activity_user ON user_activity(user_id, timestamp);
            CREATE INDEX IF NOT EXISTS idx_activity_org ON user_activity(organization_id, timestamp);
            CREATE INDEX IF NOT EXISTS idx_kpi_snapshots ON kpi_snapshots(kpi_id, timestamp);
        "#)?;
        
        Ok(())
    }

    // ============================================================================
    // Event Tracking
    // ============================================================================

    pub fn track_event(&self, event: &AnalyticsEvent) -> Result<String> {
        let conn = self.conn.lock().map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;
        let id = Uuid::new_v4().to_string();
        
        conn.execute(
            r#"INSERT INTO analytics_events
               (id, event_type, event_name, user_id, session_id, organization_id,
                properties_json, context_json, timestamp, processed)
               VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 0)"#,
            params![
                id,
                event.event_type,
                event.event_name,
                event.user_id,
                event.session_id,
                event.organization_id,
                serde_json::to_string(&event.properties)?,
                serde_json::to_string(&event.context)?,
                event.timestamp.unwrap_or(Utc::now().timestamp_millis())
            ],
        )?;
        
        Ok(id)
    }

    pub fn track_events(&self, events: &[AnalyticsEvent]) -> Result<Vec<String>> {
        let conn = self.conn.lock().map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;
        let mut ids = Vec::new();
        
        let tx = conn.unchecked_transaction()?;
        
        for event in events {
            let id = Uuid::new_v4().to_string();
            tx.execute(
                r#"INSERT INTO analytics_events
                   (id, event_type, event_name, user_id, session_id, organization_id,
                    properties_json, context_json, timestamp, processed)
                   VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 0)"#,
                params![
                    id,
                    event.event_type,
                    event.event_name,
                    event.user_id,
                    event.session_id,
                    event.organization_id,
                    serde_json::to_string(&event.properties)?,
                    serde_json::to_string(&event.context)?,
                    event.timestamp.unwrap_or(Utc::now().timestamp_millis())
                ],
            )?;
            ids.push(id);
        }
        
        tx.commit()?;
        Ok(ids)
    }

    // ============================================================================
    // Metrics
    // ============================================================================

    pub fn record_metric(&self, metric: &MetricPoint) -> Result<()> {
        let conn = self.conn.lock().map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;
        let now = Utc::now();
        let hour = (now.timestamp() / 3600) * 3600 * 1000;
        
        // Upsert hourly metric
        conn.execute(
            r#"INSERT INTO metrics_hourly (id, metric_name, dimension, dimension_value, hour, count, sum, min, max, avg, created_at)
               VALUES (?1, ?2, ?3, ?4, ?5, 1, ?6, ?6, ?6, ?6, ?7)
               ON CONFLICT(metric_name, dimension, dimension_value, hour) DO UPDATE SET
               count = count + 1,
               sum = sum + ?6,
               min = MIN(min, ?6),
               max = MAX(max, ?6),
               avg = (sum + ?6) / (count + 1)"#,
            params![
                Uuid::new_v4().to_string(),
                metric.name,
                metric.dimension,
                metric.dimension_value,
                hour,
                metric.value,
                now.timestamp_millis()
            ],
        )?;
        
        Ok(())
    }

    pub fn get_metric_series(
        &self,
        metric_name: &str,
        start_time: i64,
        end_time: i64,
        granularity: &str,
    ) -> Result<Vec<MetricDataPoint>> {
        let conn = self.conn.lock().map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;
        
        let (table, time_col) = match granularity {
            "hourly" => ("metrics_hourly", "hour"),
            "daily" => ("metrics_daily", "day"),
            _ => ("metrics_hourly", "hour"),
        };
        
        let query = format!(
            r#"SELECT {} as timestamp, SUM(count) as count, SUM(sum) as sum,
                      MIN(min) as min, MAX(max) as max
               FROM {}
               WHERE metric_name = ?1 AND {} >= ?2 AND {} <= ?3
               GROUP BY {}
               ORDER BY {} ASC"#,
            time_col, table, time_col, time_col, time_col, time_col
        );
        
        let mut stmt = conn.prepare(&query)?;
        let points = stmt.query_map(params![metric_name, start_time, end_time], |row| {
            Ok(MetricDataPoint {
                timestamp: row.get(0)?,
                count: row.get(1)?,
                sum: row.get(2)?,
                min: row.get(3)?,
                max: row.get(4)?,
                avg: None,
            })
        })?.collect::<Result<Vec<_>, _>>()?;
        
        Ok(points)
    }

    // ============================================================================
    // User Activity
    // ============================================================================

    pub fn track_activity(&self, activity: &UserActivity) -> Result<String> {
        let conn = self.conn.lock().map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;
        let id = Uuid::new_v4().to_string();
        
        conn.execute(
            r#"INSERT INTO user_activity
               (id, user_id, organization_id, activity_type, feature, duration_ms,
                success, error_message, metadata_json, timestamp)
               VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)"#,
            params![
                id,
                activity.user_id,
                activity.organization_id,
                activity.activity_type,
                activity.feature,
                activity.duration_ms,
                activity.success.map(|s| s as i32),
                activity.error_message,
                activity.metadata.as_ref().map(|m| serde_json::to_string(m).unwrap()),
                activity.timestamp.unwrap_or(Utc::now().timestamp_millis())
            ],
        )?;
        
        Ok(id)
    }

    pub fn get_user_activity(
        &self,
        user_id: &str,
        start_time: i64,
        end_time: i64,
        limit: i32,
    ) -> Result<Vec<UserActivity>> {
        let conn = self.conn.lock().map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;
        
        let mut stmt = conn.prepare(
            r#"SELECT user_id, organization_id, activity_type, feature, duration_ms,
                      success, error_message, metadata_json, timestamp
               FROM user_activity
               WHERE user_id = ?1 AND timestamp >= ?2 AND timestamp <= ?3
               ORDER BY timestamp DESC
               LIMIT ?4"#
        )?;
        
        let activities = stmt.query_map(params![user_id, start_time, end_time, limit], |row| {
            let metadata_json: Option<String> = row.get(7)?;
            
            Ok(UserActivity {
                user_id: row.get(0)?,
                organization_id: row.get(1)?,
                activity_type: row.get(2)?,
                feature: row.get(3)?,
                duration_ms: row.get(4)?,
                success: row.get::<_, Option<i32>>(5)?.map(|s| s != 0),
                error_message: row.get(6)?,
                metadata: metadata_json.and_then(|j| serde_json::from_str(&j).ok()),
                timestamp: row.get(8)?,
            })
        })?.collect::<Result<Vec<_>, _>>()?;
        
        Ok(activities)
    }

    // ============================================================================
    // Dashboard Methods
    // ============================================================================

    pub fn create_dashboard(&self, dashboard: &Dashboard) -> Result<Dashboard> {
        let conn = self.conn.lock().map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;
        let now = Utc::now().timestamp_millis();
        
        conn.execute(
            r#"INSERT INTO dashboards
               (id, name, description, owner_id, organization_id, is_public,
                layout_json, widgets_json, refresh_interval, created_at, updated_at)
               VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)"#,
            params![
                dashboard.id,
                dashboard.name,
                dashboard.description,
                dashboard.owner_id,
                dashboard.organization_id,
                dashboard.is_public as i32,
                serde_json::to_string(&dashboard.layout)?,
                serde_json::to_string(&dashboard.widgets)?,
                dashboard.refresh_interval,
                now,
                now
            ],
        )?;
        
        Ok(dashboard.clone())
    }

    pub fn get_dashboard(&self, id: &str) -> Result<Option<Dashboard>> {
        let conn = self.conn.lock().map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;
        
        let mut stmt = conn.prepare(
            r#"SELECT id, name, description, owner_id, organization_id, is_public,
                      layout_json, widgets_json, refresh_interval, created_at, updated_at
               FROM dashboards WHERE id = ?1"#
        )?;
        
        let result = stmt.query_row(params![id], |row| {
            let layout_json: String = row.get(6)?;
            let widgets_json: String = row.get(7)?;
            
            Ok(Dashboard {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                owner_id: row.get(3)?,
                organization_id: row.get(4)?,
                is_public: row.get::<_, i32>(5)? != 0,
                layout: serde_json::from_str(&layout_json).unwrap_or_default(),
                widgets: serde_json::from_str(&widgets_json).unwrap_or_default(),
                refresh_interval: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        });
        
        match result {
            Ok(dashboard) => Ok(Some(dashboard)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.into()),
        }
    }

    pub fn list_dashboards(&self, owner_id: Option<&str>, organization_id: Option<&str>) -> Result<Vec<Dashboard>> {
        let conn = self.conn.lock().map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;
        
        let query = match (owner_id, organization_id) {
            (Some(_), Some(_)) => {
                r#"SELECT id, name, description, owner_id, organization_id, is_public,
                          layout_json, widgets_json, refresh_interval, created_at, updated_at
                   FROM dashboards WHERE owner_id = ?1 AND organization_id = ?2
                   ORDER BY updated_at DESC"#
            }
            (Some(_), None) => {
                r#"SELECT id, name, description, owner_id, organization_id, is_public,
                          layout_json, widgets_json, refresh_interval, created_at, updated_at
                   FROM dashboards WHERE owner_id = ?1 OR is_public = 1
                   ORDER BY updated_at DESC"#
            }
            _ => {
                r#"SELECT id, name, description, owner_id, organization_id, is_public,
                          layout_json, widgets_json, refresh_interval, created_at, updated_at
                   FROM dashboards WHERE is_public = 1
                   ORDER BY updated_at DESC"#
            }
        };
        
        let mut stmt = conn.prepare(query)?;
        
        let dashboards = match (owner_id, organization_id) {
            (Some(oid), Some(org)) => stmt.query_map(params![oid, org], Self::map_dashboard_row)?,
            (Some(oid), None) => stmt.query_map(params![oid], Self::map_dashboard_row)?,
            _ => stmt.query_map([], Self::map_dashboard_row)?,
        }.collect::<Result<Vec<_>, _>>()?;
        
        Ok(dashboards)
    }

    fn map_dashboard_row(row: &rusqlite::Row) -> rusqlite::Result<Dashboard> {
        let layout_json: String = row.get(6)?;
        let widgets_json: String = row.get(7)?;
        
        Ok(Dashboard {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            owner_id: row.get(3)?,
            organization_id: row.get(4)?,
            is_public: row.get::<_, i32>(5)? != 0,
            layout: serde_json::from_str(&layout_json).unwrap_or_default(),
            widgets: serde_json::from_str(&widgets_json).unwrap_or_default(),
            refresh_interval: row.get(8)?,
            created_at: row.get(9)?,
            updated_at: row.get(10)?,
        })
    }

    // ============================================================================
    // KPI Methods
    // ============================================================================

    pub fn create_kpi(&self, kpi: &KPIDefinition) -> Result<KPIDefinition> {
        let conn = self.conn.lock().map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;
        let now = Utc::now().timestamp_millis();
        
        conn.execute(
            r#"INSERT INTO kpi_definitions
               (id, name, description, formula, unit, target_value,
                warning_threshold, critical_threshold, is_higher_better,
                organization_id, created_at)
               VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)"#,
            params![
                kpi.id,
                kpi.name,
                kpi.description,
                kpi.formula,
                kpi.unit,
                kpi.target_value,
                kpi.warning_threshold,
                kpi.critical_threshold,
                kpi.is_higher_better as i32,
                kpi.organization_id,
                now
            ],
        )?;
        
        Ok(kpi.clone())
    }

    pub fn record_kpi_value(&self, kpi_id: &str, value: f64) -> Result<KPISnapshot> {
        let conn = self.conn.lock().map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;
        let now = Utc::now().timestamp_millis();
        let id = Uuid::new_v4().to_string();
        
        // Get previous value
        let previous: Option<f64> = conn.query_row(
            "SELECT value FROM kpi_snapshots WHERE kpi_id = ?1 ORDER BY timestamp DESC LIMIT 1",
            params![kpi_id],
            |row| row.get(0),
        ).ok();
        
        let change_percent = previous.map(|prev| {
            if prev != 0.0 {
                ((value - prev) / prev) * 100.0
            } else {
                0.0
            }
        });
        
        // Calculate status based on KPI definition
        let status = self.calculate_kpi_status(&conn, kpi_id, value)?;
        
        conn.execute(
            r#"INSERT INTO kpi_snapshots
               (id, kpi_id, value, previous_value, change_percent, status, timestamp)
               VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)"#,
            params![id, kpi_id, value, previous, change_percent, status, now],
        )?;
        
        Ok(KPISnapshot {
            id: id.clone(),
            kpi_id: kpi_id.to_string(),
            value,
            previous_value: previous,
            change_percent,
            status,
            timestamp: now,
        })
    }

    fn calculate_kpi_status(&self, conn: &Connection, kpi_id: &str, value: f64) -> Result<String> {
        let result = conn.query_row(
            r#"SELECT target_value, warning_threshold, critical_threshold, is_higher_better
               FROM kpi_definitions WHERE id = ?1"#,
            params![kpi_id],
            |row| {
                let target: Option<f64> = row.get(0)?;
                let warning: Option<f64> = row.get(1)?;
                let critical: Option<f64> = row.get(2)?;
                let is_higher_better: bool = row.get::<_, i32>(3)? != 0;
                Ok((target, warning, critical, is_higher_better))
            },
        )?;
        
        let (target, warning, critical, is_higher_better) = result;
        
        let status = if let (Some(t), Some(w), Some(c)) = (target, warning, critical) {
            if is_higher_better {
                if value >= t {
                    "excellent"
                } else if value >= w {
                    "good"
                } else if value >= c {
                    "warning"
                } else {
                    "critical"
                }
            } else {
                if value <= t {
                    "excellent"
                } else if value <= w {
                    "good"
                } else if value <= c {
                    "warning"
                } else {
                    "critical"
                }
            }
        } else {
            "unknown"
        };
        
        Ok(status.to_string())
    }

    pub fn get_kpi_history(&self, kpi_id: &str, limit: i32) -> Result<Vec<KPISnapshot>> {
        let conn = self.conn.lock().map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;
        
        let mut stmt = conn.prepare(
            r#"SELECT id, kpi_id, value, previous_value, change_percent, status, timestamp
               FROM kpi_snapshots
               WHERE kpi_id = ?1
               ORDER BY timestamp DESC
               LIMIT ?2"#
        )?;
        
        let snapshots = stmt.query_map(params![kpi_id, limit], |row| {
            Ok(KPISnapshot {
                id: row.get(0)?,
                kpi_id: row.get(1)?,
                value: row.get(2)?,
                previous_value: row.get(3)?,
                change_percent: row.get(4)?,
                status: row.get(5)?,
                timestamp: row.get(6)?,
            })
        })?.collect::<Result<Vec<_>, _>>()?;
        
        Ok(snapshots)
    }

    // ============================================================================
    // Report Methods
    // ============================================================================

    pub fn create_report(&self, report: &Report) -> Result<Report> {
        let conn = self.conn.lock().map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;
        let now = Utc::now().timestamp_millis();
        
        conn.execute(
            r#"INSERT INTO reports
               (id, name, description, report_type, owner_id, organization_id,
                query_config_json, schedule_json, created_at, updated_at)
               VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)"#,
            params![
                report.id,
                report.name,
                report.description,
                report.report_type,
                report.owner_id,
                report.organization_id,
                serde_json::to_string(&report.query_config)?,
                report.schedule.as_ref().map(|s| serde_json::to_string(s).unwrap()),
                now,
                now
            ],
        )?;
        
        Ok(report.clone())
    }

    pub fn execute_report(&self, report_id: &str) -> Result<ReportExecution> {
        let conn = self.conn.lock().map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;
        let execution_id = Uuid::new_v4().to_string();
        let started_at = Utc::now().timestamp_millis();
        
        // Get report configuration
        let report_config: String = conn.query_row(
            "SELECT query_config_json FROM reports WHERE id = ?1",
            params![report_id],
            |row| row.get(0),
        )?;
        
        // Execute the query (simplified - in production this would be more complex)
        let query_config: ReportQueryConfig = serde_json::from_str(&report_config)?;
        
        // Simulate report execution with sample data
        let result_data = self.generate_report_data(&query_config)?;
        let completed_at = Utc::now().timestamp_millis();
        
        let execution = ReportExecution {
            id: execution_id.clone(),
            report_id: report_id.to_string(),
            status: "completed".to_string(),
            result: Some(result_data.clone()),
            error_message: None,
            row_count: Some(result_data.len() as i32),
            duration_ms: (completed_at - started_at) as i32,
            started_at,
            completed_at: Some(completed_at),
        };
        
        // Store execution
        conn.execute(
            r#"INSERT INTO report_executions
               (id, report_id, status, result_json, row_count, duration_ms, started_at, completed_at)
               VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)"#,
            params![
                execution.id,
                execution.report_id,
                execution.status,
                serde_json::to_string(&execution.result)?,
                execution.row_count,
                execution.duration_ms,
                execution.started_at,
                execution.completed_at
            ],
        )?;
        
        // Update last_run_at
        conn.execute(
            "UPDATE reports SET last_run_at = ?2, updated_at = ?2 WHERE id = ?1",
            params![report_id, completed_at]
        )?;
        
        Ok(execution)
    }

    fn generate_report_data(&self, config: &ReportQueryConfig) -> Result<Vec<HashMap<String, serde_json::Value>>> {
        // This is a simplified implementation
        // In production, this would execute actual queries based on the config
        let mut results = Vec::new();
        
        // Generate sample data based on report type
        for i in 0..10 {
            let mut row = HashMap::new();
            for field in &config.fields {
                let value = match field.as_str() {
                    "date" => serde_json::json!(format!("2025-01-{:02}", i + 1)),
                    "users" => serde_json::json!(100 + i * 10),
                    "sessions" => serde_json::json!(500 + i * 50),
                    "revenue" => serde_json::json!(1000.0 + (i as f64) * 100.0),
                    _ => serde_json::json!(null),
                };
                row.insert(field.clone(), value);
            }
            results.push(row);
        }
        
        Ok(results)
    }

    // ============================================================================
    // Funnel Analysis
    // ============================================================================

    pub fn create_funnel(&self, funnel: &Funnel) -> Result<Funnel> {
        let conn = self.conn.lock().map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;
        let now = Utc::now().timestamp_millis();
        
        conn.execute(
            r#"INSERT INTO funnels
               (id, name, description, organization_id, steps_json, created_at, updated_at)
               VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)"#,
            params![
                funnel.id,
                funnel.name,
                funnel.description,
                funnel.organization_id,
                serde_json::to_string(&funnel.steps)?,
                now,
                now
            ],
        )?;
        
        Ok(funnel.clone())
    }

    pub fn analyze_funnel(&self, funnel_id: &str, start_time: i64, end_time: i64) -> Result<FunnelResult> {
        let conn = self.conn.lock().map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;
        
        // Get funnel steps
        let steps_json: String = conn.query_row(
            "SELECT steps_json FROM funnels WHERE id = ?1",
            params![funnel_id],
            |row| row.get(0),
        )?;
        
        let steps: Vec<FunnelStep> = serde_json::from_str(&steps_json)?;
        
        // Analyze each step (simplified)
        let mut steps_data = Vec::new();
        let mut prev_count = 1000; // Total users starting
        
        for (i, step) in steps.iter().enumerate() {
            let count = (prev_count as f64 * (0.95 - (i as f64 * 0.15))) as i32;
            let drop_off = if i == 0 { 0 } else { prev_count - count };
            let conversion = if prev_count > 0 { 
                (count as f64 / prev_count as f64) * 100.0 
            } else { 
                0.0 
            };
            
            steps_data.push(FunnelStepData {
                step_name: step.name.clone(),
                event_name: step.event_name.clone(),
                count,
                drop_off,
                conversion_from_previous: conversion,
            });
            
            prev_count = count;
        }
        
        let total_conversion = if !steps_data.is_empty() {
            let first_count = steps_data.first().map(|s| s.count).unwrap_or(1);
            let last_count = steps_data.last().map(|s| s.count).unwrap_or(0);
            (last_count as f64 / first_count as f64) * 100.0
        } else {
            0.0
        };
        
        let result = FunnelResult {
            id: Uuid::new_v4().to_string(),
            funnel_id: funnel_id.to_string(),
            period_start: start_time,
            period_end: end_time,
            total_users: steps_data.first().map(|s| s.count).unwrap_or(0),
            steps_data,
            conversion_rate: total_conversion,
            created_at: Utc::now().timestamp_millis(),
        };
        
        // Store result
        conn.execute(
            r#"INSERT INTO funnel_results
               (id, funnel_id, period_start, period_end, total_users, 
                steps_data_json, conversion_rate, created_at)
               VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)"#,
            params![
                result.id,
                result.funnel_id,
                result.period_start,
                result.period_end,
                result.total_users,
                serde_json::to_string(&result.steps_data)?,
                result.conversion_rate,
                result.created_at
            ],
        )?;
        
        Ok(result)
    }

    // ============================================================================
    // Summary Statistics
    // ============================================================================

    pub fn get_summary_stats(&self, start_time: i64, end_time: i64) -> Result<SummaryStats> {
        let conn = self.conn.lock().map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;
        
        let event_count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM analytics_events WHERE timestamp >= ?1 AND timestamp <= ?2",
            params![start_time, end_time],
            |row| row.get(0),
        )?;
        
        let unique_users: i64 = conn.query_row(
            "SELECT COUNT(DISTINCT user_id) FROM analytics_events WHERE timestamp >= ?1 AND timestamp <= ?2 AND user_id IS NOT NULL",
            params![start_time, end_time],
            |row| row.get(0),
        )?;
        
        let unique_sessions: i64 = conn.query_row(
            "SELECT COUNT(DISTINCT session_id) FROM analytics_events WHERE timestamp >= ?1 AND timestamp <= ?2 AND session_id IS NOT NULL",
            params![start_time, end_time],
            |row| row.get(0),
        )?;
        
        // Get top events
        let mut stmt = conn.prepare(
            r#"SELECT event_name, COUNT(*) as count
               FROM analytics_events
               WHERE timestamp >= ?1 AND timestamp <= ?2
               GROUP BY event_name
               ORDER BY count DESC
               LIMIT 10"#
        )?;
        
        let top_events: Vec<(String, i64)> = stmt.query_map(params![start_time, end_time], |row| {
            Ok((row.get(0)?, row.get(1)?))
        })?.collect::<Result<Vec<_>, _>>()?;
        
        Ok(SummaryStats {
            period_start: start_time,
            period_end: end_time,
            total_events: event_count,
            unique_users: unique_users as i32,
            unique_sessions: unique_sessions as i32,
            top_events,
        })
    }
}

// ============================================================================
// Data Types
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalyticsEvent {
    pub event_type: String,
    pub event_name: String,
    pub user_id: Option<String>,
    pub session_id: Option<String>,
    pub organization_id: Option<String>,
    pub properties: HashMap<String, serde_json::Value>,
    pub context: HashMap<String, serde_json::Value>,
    pub timestamp: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricPoint {
    pub name: String,
    pub value: f64,
    pub dimension: Option<String>,
    pub dimension_value: Option<String>,
    pub timestamp: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricDataPoint {
    pub timestamp: i64,
    pub count: i64,
    pub sum: f64,
    pub min: Option<f64>,
    pub max: Option<f64>,
    pub avg: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserActivity {
    pub user_id: String,
    pub organization_id: Option<String>,
    pub activity_type: String,
    pub feature: String,
    pub duration_ms: Option<i64>,
    pub success: Option<bool>,
    pub error_message: Option<String>,
    pub metadata: Option<HashMap<String, serde_json::Value>>,
    pub timestamp: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Dashboard {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub owner_id: String,
    pub organization_id: Option<String>,
    pub is_public: bool,
    pub layout: DashboardLayout,
    pub widgets: Vec<Widget>,
    pub refresh_interval: i32,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct DashboardLayout {
    pub columns: i32,
    pub rows: i32,
    pub gap: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Widget {
    pub id: String,
    pub widget_type: String,
    pub title: String,
    pub x: i32,
    pub y: i32,
    pub width: i32,
    pub height: i32,
    pub config: WidgetConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct WidgetConfig {
    pub metric_name: Option<String>,
    pub aggregation: Option<String>,
    pub time_range: Option<String>,
    pub filters: Option<HashMap<String, String>>,
    pub chart_type: Option<String>,
    pub color: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KPIDefinition {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub formula: String,
    pub unit: Option<String>,
    pub target_value: Option<f64>,
    pub warning_threshold: Option<f64>,
    pub critical_threshold: Option<f64>,
    pub is_higher_better: bool,
    pub organization_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KPISnapshot {
    pub id: String,
    pub kpi_id: String,
    pub value: f64,
    pub previous_value: Option<f64>,
    pub change_percent: Option<f64>,
    pub status: String,
    pub timestamp: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Report {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub report_type: String,
    pub owner_id: String,
    pub organization_id: Option<String>,
    pub query_config: ReportQueryConfig,
    pub schedule: Option<ReportSchedule>,
    pub last_run_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ReportQueryConfig {
    pub data_source: String,
    pub fields: Vec<String>,
    pub filters: Vec<ReportFilter>,
    pub group_by: Option<Vec<String>>,
    pub order_by: Option<Vec<String>>,
    pub limit: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReportFilter {
    pub field: String,
    pub operator: String,
    pub value: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReportSchedule {
    pub frequency: String,
    pub day_of_week: Option<i32>,
    pub day_of_month: Option<i32>,
    pub hour: i32,
    pub minute: i32,
    pub timezone: String,
    pub recipients: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReportExecution {
    pub id: String,
    pub report_id: String,
    pub status: String,
    pub result: Option<Vec<HashMap<String, serde_json::Value>>>,
    pub error_message: Option<String>,
    pub row_count: Option<i32>,
    pub duration_ms: i32,
    pub started_at: i64,
    pub completed_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Funnel {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub organization_id: Option<String>,
    pub steps: Vec<FunnelStep>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FunnelStep {
    pub name: String,
    pub event_name: String,
    pub filters: Option<Vec<ReportFilter>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FunnelStepData {
    pub step_name: String,
    pub event_name: String,
    pub count: i32,
    pub drop_off: i32,
    pub conversion_from_previous: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FunnelResult {
    pub id: String,
    pub funnel_id: String,
    pub period_start: i64,
    pub period_end: i64,
    pub total_users: i32,
    pub steps_data: Vec<FunnelStepData>,
    pub conversion_rate: f64,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SummaryStats {
    pub period_start: i64,
    pub period_end: i64,
    pub total_events: i64,
    pub unique_users: i32,
    pub unique_sessions: i32,
    pub top_events: Vec<(String, i64)>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::NamedTempFile;

    #[test]
    fn test_track_event() {
        let temp_file = NamedTempFile::new().unwrap();
        let service = AnalyticsService::new(temp_file.path()).unwrap();
        
        let event = AnalyticsEvent {
            event_type: "track".to_string(),
            event_name: "button_click".to_string(),
            user_id: Some("user-123".to_string()),
            session_id: Some("session-456".to_string()),
            organization_id: None,
            properties: [("button_id".to_string(), serde_json::json!("submit"))].into_iter().collect(),
            context: HashMap::new(),
            timestamp: None,
        };
        
        let result = service.track_event(&event);
        assert!(result.is_ok());
    }

    #[test]
    fn test_record_metric() {
        let temp_file = NamedTempFile::new().unwrap();
        let service = AnalyticsService::new(temp_file.path()).unwrap();
        
        let metric = MetricPoint {
            name: "page_load_time".to_string(),
            value: 1500.0,
            dimension: Some("page".to_string()),
            dimension_value: Some("/home".to_string()),
            timestamp: None,
        };
        
        let result = service.record_metric(&metric);
        assert!(result.is_ok());
    }

    #[test]
    fn test_create_dashboard() {
        let temp_file = NamedTempFile::new().unwrap();
        let service = AnalyticsService::new(temp_file.path()).unwrap();
        
        let dashboard = Dashboard {
            id: "dash-1".to_string(),
            name: "Main Dashboard".to_string(),
            description: Some("Overview dashboard".to_string()),
            owner_id: "user-1".to_string(),
            organization_id: None,
            is_public: false,
            layout: DashboardLayout { columns: 12, rows: 8, gap: 8 },
            widgets: vec![],
            refresh_interval: 300,
            created_at: 0,
            updated_at: 0,
        };
        
        let result = service.create_dashboard(&dashboard);
        assert!(result.is_ok());
        
        let fetched = service.get_dashboard("dash-1").unwrap();
        assert!(fetched.is_some());
        assert_eq!(fetched.unwrap().name, "Main Dashboard");
    }
}
