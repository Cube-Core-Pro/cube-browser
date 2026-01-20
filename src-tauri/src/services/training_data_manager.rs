// Training Data Management - SQLite Database
// Stores analysis sessions, frame metadata, labels, and training datasets

use chrono::Utc;
use rusqlite::{params, Connection, Result as SqlResult};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

// ============================================================================
// DATA MODELS
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrainingSession {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub video_path: String,
    pub created_at: String,
    pub updated_at: String,
    pub frames_count: i32,
    pub analyzed_count: i32,
    pub labeled_count: i32,
    pub status: String, // "active", "completed", "archived"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameMetadata {
    pub id: i64,
    pub session_id: i64,
    pub frame_path: String,
    pub frame_number: i32,
    pub timestamp_seconds: f64,
    pub file_size_bytes: i64,
    pub analyzed: bool,
    pub labeled: bool,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameAnalysisRecord {
    pub id: i64,
    pub frame_id: i64,
    pub features: String, // JSON array
    pub ai_description: Option<String>,
    pub confidence: f32,
    pub analyzed_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameLabel {
    pub id: i64,
    pub frame_id: i64,
    pub label_type: String, // "category", "bounding_box", "keypoint", "custom"
    pub label_value: String, // JSON data
    pub created_by: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrainingDataset {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub session_ids: String, // JSON array of session IDs
    pub frames_count: i32,
    pub export_format: String, // "coco", "yolo", "tensorflow", "pytorch", "custom"
    pub created_at: String,
    pub exported_at: Option<String>,
}

// ============================================================================
// DATABASE MANAGER
// ============================================================================

pub struct TrainingDataManager {
    db_path: PathBuf,
}

impl TrainingDataManager {
    pub fn new(db_path: PathBuf) -> SqlResult<Self> {
        let manager = Self { db_path };
        manager.initialize_database()?;
        Ok(manager)
    }

    fn get_connection(&self) -> SqlResult<Connection> {
        Connection::open(&self.db_path)
    }

    fn initialize_database(&self) -> SqlResult<()> {
        let conn = self.get_connection()?;

        // Training Sessions table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS training_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                video_path TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                frames_count INTEGER DEFAULT 0,
                analyzed_count INTEGER DEFAULT 0,
                labeled_count INTEGER DEFAULT 0,
                status TEXT DEFAULT 'active'
            )",
            [],
        )?;

        // Frame Metadata table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS frame_metadata (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                frame_path TEXT NOT NULL,
                frame_number INTEGER NOT NULL,
                timestamp_seconds REAL NOT NULL,
                file_size_bytes INTEGER NOT NULL,
                analyzed BOOLEAN DEFAULT 0,
                labeled BOOLEAN DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY (session_id) REFERENCES training_sessions(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // Frame Analysis table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS frame_analysis (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                frame_id INTEGER NOT NULL,
                features TEXT NOT NULL,
                ai_description TEXT,
                confidence REAL NOT NULL,
                analyzed_at TEXT NOT NULL,
                FOREIGN KEY (frame_id) REFERENCES frame_metadata(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // Frame Labels table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS frame_labels (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                frame_id INTEGER NOT NULL,
                label_type TEXT NOT NULL,
                label_value TEXT NOT NULL,
                created_by TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (frame_id) REFERENCES frame_metadata(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // Training Datasets table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS training_datasets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                session_ids TEXT NOT NULL,
                frames_count INTEGER DEFAULT 0,
                export_format TEXT NOT NULL,
                created_at TEXT NOT NULL,
                exported_at TEXT
            )",
            [],
        )?;

        // Create indexes for better performance
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_frames_session ON frame_metadata(session_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_analysis_frame ON frame_analysis(frame_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_labels_frame ON frame_labels(frame_id)",
            [],
        )?;

        Ok(())
    }

    // ============================================================================
    // TRAINING SESSION OPERATIONS
    // ============================================================================

    pub fn create_session(
        &self,
        name: String,
        description: Option<String>,
        video_path: String,
    ) -> SqlResult<i64> {
        let conn = self.get_connection()?;
        let now = Utc::now().to_rfc3339();

        conn.execute(
            "INSERT INTO training_sessions (name, description, video_path, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![name, description, video_path, now, now],
        )?;

        Ok(conn.last_insert_rowid())
    }

    pub fn get_session(&self, session_id: i64) -> SqlResult<TrainingSession> {
        let conn = self.get_connection()?;
        let mut stmt = conn.prepare(
            "SELECT id, name, description, video_path, created_at, updated_at,
                    frames_count, analyzed_count, labeled_count, status
             FROM training_sessions WHERE id = ?1",
        )?;

        let session = stmt.query_row(params![session_id], |row| {
            Ok(TrainingSession {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                video_path: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
                frames_count: row.get(6)?,
                analyzed_count: row.get(7)?,
                labeled_count: row.get(8)?,
                status: row.get(9)?,
            })
        })?;

        Ok(session)
    }

    pub fn list_sessions(&self, status: Option<String>) -> SqlResult<Vec<TrainingSession>> {
        let conn = self.get_connection()?;

        let query = if let Some(status_filter) = status {
            format!(
                "SELECT id, name, description, video_path, created_at, updated_at,
                        frames_count, analyzed_count, labeled_count, status
                 FROM training_sessions WHERE status = '{}' ORDER BY created_at DESC",
                status_filter
            )
        } else {
            "SELECT id, name, description, video_path, created_at, updated_at,
                    frames_count, analyzed_count, labeled_count, status
             FROM training_sessions ORDER BY created_at DESC"
                .to_string()
        };

        let mut stmt = conn.prepare(&query)?;
        let sessions = stmt.query_map([], |row| {
            Ok(TrainingSession {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                video_path: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
                frames_count: row.get(6)?,
                analyzed_count: row.get(7)?,
                labeled_count: row.get(8)?,
                status: row.get(9)?,
            })
        })?;

        sessions.collect()
    }

    pub fn update_session_status(&self, session_id: i64, status: String) -> SqlResult<()> {
        let conn = self.get_connection()?;
        let now = Utc::now().to_rfc3339();

        conn.execute(
            "UPDATE training_sessions SET status = ?1, updated_at = ?2 WHERE id = ?3",
            params![status, now, session_id],
        )?;

        Ok(())
    }

    pub fn delete_session(&self, session_id: i64) -> SqlResult<()> {
        let conn = self.get_connection()?;
        conn.execute(
            "DELETE FROM training_sessions WHERE id = ?1",
            params![session_id],
        )?;
        Ok(())
    }

    // ============================================================================
    // FRAME METADATA OPERATIONS
    // ============================================================================

    pub fn add_frame(
        &self,
        session_id: i64,
        frame_path: String,
        frame_number: i32,
        timestamp_seconds: f64,
        file_size_bytes: i64,
    ) -> SqlResult<i64> {
        let conn = self.get_connection()?;
        let now = Utc::now().to_rfc3339();

        conn.execute(
            "INSERT INTO frame_metadata 
             (session_id, frame_path, frame_number, timestamp_seconds, file_size_bytes, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                session_id,
                frame_path,
                frame_number,
                timestamp_seconds,
                file_size_bytes,
                now
            ],
        )?;

        // Update session frames count
        conn.execute(
            "UPDATE training_sessions 
             SET frames_count = (SELECT COUNT(*) FROM frame_metadata WHERE session_id = ?1),
                 updated_at = ?2
             WHERE id = ?1",
            params![session_id, now],
        )?;

        Ok(conn.last_insert_rowid())
    }

    pub fn get_session_frames(&self, session_id: i64) -> SqlResult<Vec<FrameMetadata>> {
        let conn = self.get_connection()?;
        let mut stmt = conn.prepare(
            "SELECT id, session_id, frame_path, frame_number, timestamp_seconds,
                    file_size_bytes, analyzed, labeled, created_at
             FROM frame_metadata WHERE session_id = ?1 ORDER BY frame_number",
        )?;

        let frames = stmt.query_map(params![session_id], |row| {
            Ok(FrameMetadata {
                id: row.get(0)?,
                session_id: row.get(1)?,
                frame_path: row.get(2)?,
                frame_number: row.get(3)?,
                timestamp_seconds: row.get(4)?,
                file_size_bytes: row.get(5)?,
                analyzed: row.get(6)?,
                labeled: row.get(7)?,
                created_at: row.get(8)?,
            })
        })?;

        frames.collect()
    }

    // ============================================================================
    // FRAME ANALYSIS OPERATIONS
    // ============================================================================

    pub fn save_analysis(
        &self,
        frame_id: i64,
        features: Vec<String>,
        ai_description: Option<String>,
        confidence: f32,
    ) -> SqlResult<i64> {
        let conn = self.get_connection()?;
        let now = Utc::now().to_rfc3339();
        let features_json = serde_json::to_string(&features).unwrap_or_else(|_| "[]".to_string());

        conn.execute(
            "INSERT INTO frame_analysis (frame_id, features, ai_description, confidence, analyzed_at)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![frame_id, features_json, ai_description, confidence, now],
        )?;

        // Mark frame as analyzed
        conn.execute(
            "UPDATE frame_metadata SET analyzed = 1 WHERE id = ?1",
            params![frame_id],
        )?;

        // Update session analyzed count
        conn.execute(
            "UPDATE training_sessions 
             SET analyzed_count = (
                 SELECT COUNT(*) FROM frame_metadata 
                 WHERE session_id = (SELECT session_id FROM frame_metadata WHERE id = ?1)
                   AND analyzed = 1
             )
             WHERE id = (SELECT session_id FROM frame_metadata WHERE id = ?1)",
            params![frame_id],
        )?;

        Ok(conn.last_insert_rowid())
    }

    pub fn get_frame_analysis(&self, frame_id: i64) -> SqlResult<Option<FrameAnalysisRecord>> {
        let conn = self.get_connection()?;
        let mut stmt = conn.prepare(
            "SELECT id, frame_id, features, ai_description, confidence, analyzed_at
             FROM frame_analysis WHERE frame_id = ?1",
        )?;

        let mut rows = stmt.query(params![frame_id])?;

        if let Some(row) = rows.next()? {
            Ok(Some(FrameAnalysisRecord {
                id: row.get(0)?,
                frame_id: row.get(1)?,
                features: row.get(2)?,
                ai_description: row.get(3)?,
                confidence: row.get(4)?,
                analyzed_at: row.get(5)?,
            }))
        } else {
            Ok(None)
        }
    }

    // ============================================================================
    // FRAME LABELING OPERATIONS
    // ============================================================================

    pub fn add_label(
        &self,
        frame_id: i64,
        label_type: String,
        label_value: String,
        created_by: Option<String>,
    ) -> SqlResult<i64> {
        let conn = self.get_connection()?;
        let now = Utc::now().to_rfc3339();

        conn.execute(
            "INSERT INTO frame_labels (frame_id, label_type, label_value, created_by, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![frame_id, label_type, label_value, created_by, now],
        )?;

        // Mark frame as labeled
        conn.execute(
            "UPDATE frame_metadata SET labeled = 1 WHERE id = ?1",
            params![frame_id],
        )?;

        // Update session labeled count
        conn.execute(
            "UPDATE training_sessions 
             SET labeled_count = (
                 SELECT COUNT(*) FROM frame_metadata 
                 WHERE session_id = (SELECT session_id FROM frame_metadata WHERE id = ?1)
                   AND labeled = 1
             )
             WHERE id = (SELECT session_id FROM frame_metadata WHERE id = ?1)",
            params![frame_id],
        )?;

        Ok(conn.last_insert_rowid())
    }

    pub fn get_frame_labels(&self, frame_id: i64) -> SqlResult<Vec<FrameLabel>> {
        let conn = self.get_connection()?;
        let mut stmt = conn.prepare(
            "SELECT id, frame_id, label_type, label_value, created_by, created_at
             FROM frame_labels WHERE frame_id = ?1 ORDER BY created_at",
        )?;

        let labels = stmt.query_map(params![frame_id], |row| {
            Ok(FrameLabel {
                id: row.get(0)?,
                frame_id: row.get(1)?,
                label_type: row.get(2)?,
                label_value: row.get(3)?,
                created_by: row.get(4)?,
                created_at: row.get(5)?,
            })
        })?;

        labels.collect()
    }

    // ============================================================================
    // TRAINING DATASET OPERATIONS
    // ============================================================================

    pub fn create_dataset(
        &self,
        name: String,
        description: Option<String>,
        session_ids: Vec<i64>,
        export_format: String,
    ) -> SqlResult<i64> {
        let conn = self.get_connection()?;
        let now = Utc::now().to_rfc3339();
        let session_ids_json =
            serde_json::to_string(&session_ids).unwrap_or_else(|_| "[]".to_string());

        // Count total frames
        let frames_count: i32 = session_ids
            .iter()
            .map(|sid| {
                conn.query_row(
                    "SELECT frames_count FROM training_sessions WHERE id = ?1",
                    params![sid],
                    |row| row.get(0),
                )
                .unwrap_or(0)
            })
            .sum();

        conn.execute(
            "INSERT INTO training_datasets (name, description, session_ids, frames_count, export_format, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![name, description, session_ids_json, frames_count, export_format, now],
        )?;

        Ok(conn.last_insert_rowid())
    }

    pub fn list_datasets(&self) -> SqlResult<Vec<TrainingDataset>> {
        let conn = self.get_connection()?;
        let mut stmt = conn.prepare(
            "SELECT id, name, description, session_ids, frames_count, export_format, created_at, exported_at
             FROM training_datasets ORDER BY created_at DESC"
        )?;

        let datasets = stmt.query_map([], |row| {
            Ok(TrainingDataset {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                session_ids: row.get(3)?,
                frames_count: row.get(4)?,
                export_format: row.get(5)?,
                created_at: row.get(6)?,
                exported_at: row.get(7)?,
            })
        })?;

        datasets.collect()
    }

    pub fn mark_dataset_exported(&self, dataset_id: i64) -> SqlResult<()> {
        let conn = self.get_connection()?;
        let now = Utc::now().to_rfc3339();

        conn.execute(
            "UPDATE training_datasets SET exported_at = ?1 WHERE id = ?2",
            params![now, dataset_id],
        )?;

        Ok(())
    }

    // ============================================================================
    // SEARCH AND FILTERING
    // ============================================================================

    pub fn search_frames_by_features(
        &self,
        features: Vec<String>,
    ) -> SqlResult<Vec<FrameMetadata>> {
        let conn = self.get_connection()?;

        // Build query with LIKE conditions for each feature
        let feature_conditions: Vec<String> = features
            .iter()
            .map(|f| format!("features LIKE '%{}%'", f))
            .collect();

        let where_clause = feature_conditions.join(" OR ");

        let query = format!(
            "SELECT DISTINCT fm.id, fm.session_id, fm.frame_path, fm.frame_number, 
                    fm.timestamp_seconds, fm.file_size_bytes, fm.analyzed, fm.labeled, fm.created_at
             FROM frame_metadata fm
             JOIN frame_analysis fa ON fm.id = fa.frame_id
             WHERE {}
             ORDER BY fm.created_at DESC",
            where_clause
        );

        let mut stmt = conn.prepare(&query)?;
        let frames = stmt.query_map([], |row| {
            Ok(FrameMetadata {
                id: row.get(0)?,
                session_id: row.get(1)?,
                frame_path: row.get(2)?,
                frame_number: row.get(3)?,
                timestamp_seconds: row.get(4)?,
                file_size_bytes: row.get(5)?,
                analyzed: row.get(6)?,
                labeled: row.get(7)?,
                created_at: row.get(8)?,
            })
        })?;

        frames.collect()
    }

    pub fn get_statistics(&self) -> SqlResult<TrainingStatistics> {
        let conn = self.get_connection()?;

        let total_sessions: i32 =
            conn.query_row("SELECT COUNT(*) FROM training_sessions", [], |row| {
                row.get(0)
            })?;

        let total_frames: i32 =
            conn.query_row("SELECT COUNT(*) FROM frame_metadata", [], |row| row.get(0))?;

        let analyzed_frames: i32 = conn.query_row(
            "SELECT COUNT(*) FROM frame_metadata WHERE analyzed = 1",
            [],
            |row| row.get(0),
        )?;

        let labeled_frames: i32 = conn.query_row(
            "SELECT COUNT(*) FROM frame_metadata WHERE labeled = 1",
            [],
            |row| row.get(0),
        )?;

        let total_datasets: i32 =
            conn.query_row("SELECT COUNT(*) FROM training_datasets", [], |row| {
                row.get(0)
            })?;

        Ok(TrainingStatistics {
            total_sessions,
            total_frames,
            analyzed_frames,
            labeled_frames,
            total_datasets,
        })
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrainingStatistics {
    pub total_sessions: i32,
    pub total_frames: i32,
    pub analyzed_frames: i32,
    pub labeled_frames: i32,
    pub total_datasets: i32,
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    #[test]
    fn test_database_initialization() {
        let temp_dir = env::temp_dir();
        let db_path = temp_dir.join("test_training_data.db");

        let manager = TrainingDataManager::new(db_path.clone());
        assert!(manager.is_ok());

        // Cleanup
        std::fs::remove_file(db_path).ok();
    }

    #[test]
    fn test_session_creation() {
        let temp_dir = env::temp_dir();
        let db_path = temp_dir.join("test_training_data_session.db");

        let manager = TrainingDataManager::new(db_path.clone()).unwrap();
        let session_id = manager.create_session(
            "Test Session".to_string(),
            Some("Test description".to_string()),
            "/path/to/video.mp4".to_string(),
        );

        assert!(session_id.is_ok());

        // Cleanup
        std::fs::remove_file(db_path).ok();
    }
}
