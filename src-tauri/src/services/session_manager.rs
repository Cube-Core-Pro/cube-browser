use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager};

// Import types
use crate::commands::browser::TabGroup;
use crate::commands::reading_list::ReadingListItem;
use crate::models::collections::Collection;
use crate::models::passwords::PasswordEntry;


#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrowserSession {
    pub version: String,
    pub last_saved: u64,
    pub tab_groups: Vec<TabGroup>,
    pub reading_list: Vec<ReadingListItem>,
    pub collections: Vec<Collection>,
    pub passwords: Vec<PasswordEntry>,
}

impl Default for BrowserSession {
    fn default() -> Self {
        Self {
            version: "1.0.0".to_string(),
            last_saved: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            tab_groups: Vec::new(),
            reading_list: Vec::new(),
            collections: Vec::new(),
            passwords: Vec::new(),
        }
    }
}

pub struct SessionManager {
    app_handle: AppHandle,
    session: Arc<Mutex<BrowserSession>>,
    session_file: PathBuf,
}

impl SessionManager {
    pub fn new(app_handle: AppHandle) -> Result<Self, String> {
        // Get app data directory
        let app_data_dir = app_handle
            .path()
            .app_data_dir()
            .map_err(|e| format!("Failed to get app data dir: {}", e))?;

        // Create directory if it doesn't exist
        fs::create_dir_all(&app_data_dir)
            .map_err(|e| format!("Failed to create app data dir: {}", e))?;

        let session_file = app_data_dir.join("browser_session.json");

        Ok(Self {
            app_handle,
            session: Arc::new(Mutex::new(BrowserSession::default())),
            session_file,
        })
    }

    /// Load session from disk
    pub fn load_session(&self) -> Result<BrowserSession, String> {
        if !self.session_file.exists() {
            return Ok(BrowserSession::default());
        }

        let content = fs::read_to_string(&self.session_file)
            .map_err(|e| format!("Failed to read session file: {}", e))?;

        let session: BrowserSession = serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse session: {}", e))?;

        // Update in-memory session
        let mut current_session = self.session.lock().unwrap();
        *current_session = session.clone();

        Ok(session)
    }

    /// Save current session to disk
    pub fn save_session(&self, session: &BrowserSession) -> Result<(), String> {
        let mut current_session = self.session.lock().unwrap();
        *current_session = session.clone();
        drop(current_session);

        let json = serde_json::to_string_pretty(&session)
            .map_err(|e| format!("Failed to serialize session: {}", e))?;

        fs::write(&self.session_file, json)
            .map_err(|e| format!("Failed to write session file: {}", e))?;

        Ok(())
    }

    /// Update tab groups in session
    pub fn update_tab_groups(&self, groups: Vec<TabGroup>) -> Result<(), String> {
        let mut session = self.session.lock().unwrap();
        session.tab_groups = groups;
        session.last_saved = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let session_clone = session.clone();
        drop(session);

        self.save_session(&session_clone)
    }

    /// Update reading list in session
    pub fn update_reading_list(&self, items: Vec<ReadingListItem>) -> Result<(), String> {
        let mut session = self.session.lock().unwrap();
        session.reading_list = items;
        session.last_saved = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let session_clone = session.clone();
        drop(session);

        self.save_session(&session_clone)
    }

    // ========================================================================
    // DEPRECATED: Collections Storage (Migrated to CollectionsService)
    // ========================================================================
    // Collections are now managed by the dedicated CollectionsService which
    // provides:
    // - PostgreSQL-backed persistent storage
    // - Hierarchical folder organization
    // - Rich metadata and tagging
    // - Sharing and collaboration features
    //
    // SessionManager now focuses solely on browser session state (tabs, 
    // history, reading list). For collections, use CollectionsService.
    // ========================================================================

    // ========================================================================
    // DEPRECATED: Password Storage (Migrated to PasswordService)
    // ========================================================================
    // Password storage has been migrated to the PasswordService which provides:
    // - AES-256-GCM encryption at rest
    // - Secure key derivation (PBKDF2/Argon2)
    // - Autofill integration
    // - Breach monitoring via Have I Been Pwned API
    // - 2FA token storage
    //
    // SessionManager should NOT store passwords. All password operations
    // must go through PasswordService for security compliance.
    // ========================================================================

    /// Get current session
    pub fn get_session(&self) -> BrowserSession {
        let session = self.session.lock().unwrap();
        session.clone()
    }

    /// Delete session file
    pub fn clear_session(&self) -> Result<(), String> {
        if self.session_file.exists() {
            fs::remove_file(&self.session_file)
                .map_err(|e| format!("Failed to delete session file: {}", e))?;
        }

        let mut session = self.session.lock().unwrap();
        *session = BrowserSession::default();

        Ok(())
    }
}
