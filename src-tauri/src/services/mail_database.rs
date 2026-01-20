// ═══════════════════════════════════════════════════════════════════════════════
// CUBE MAIL - DATABASE MODULE
// ═══════════════════════════════════════════════════════════════════════════════
//
// SQLite database operations for CUBE Mail including:
// - Email storage
// - Full-text search (FTS5)
// - Account settings
// - Sync state tracking
// - Label management
//
// ═══════════════════════════════════════════════════════════════════════════════

use chrono::{DateTime, Utc};
use log::{debug, error, info};
use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

use crate::services::cube_mail_service::{
    Email, EmailAddress, EmailAttachment, EmailCategory, EmailEncryption,
    MailAccount, MailFolder, MailLabel, MailProvider, SecurityStatus,
    ScreenerConfig, SyncStatus, ImapConfig, SmtpConfig,
};

// ═══════════════════════════════════════════════════════════════════════════════
// DATABASE MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

/// CUBE Mail database manager
pub struct MailDatabase {
    conn: Arc<Mutex<Connection>>,
}

impl MailDatabase {
    /// Create a new mail database instance
    pub fn new(app_data_dir: PathBuf) -> Result<Self> {
        let db_path = app_data_dir.join("cube_mail.db");
        let conn = Connection::open(db_path)?;
        
        // Enable foreign keys and WAL mode for better concurrency
        conn.execute("PRAGMA foreign_keys = ON", [])?;
        conn.execute("PRAGMA journal_mode = WAL", [])?;
        
        // Create tables
        Self::create_tables(&conn)?;
        
        info!("📬 CUBE Mail database initialized");
        
        Ok(Self {
            conn: Arc::new(Mutex::new(conn)),
        })
    }
    
    /// Create all database tables including FTS5
    fn create_tables(conn: &Connection) -> Result<()> {
        // Email accounts table
        conn.execute(
            r#"
            CREATE TABLE IF NOT EXISTS mail_accounts (
                id TEXT PRIMARY KEY,
                email TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                provider TEXT NOT NULL,
                imap_config TEXT NOT NULL,
                smtp_config TEXT NOT NULL,
                is_active INTEGER DEFAULT 1,
                last_sync_at INTEGER,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )
            "#,
            [],
        )?;
        
        // Emails table
        conn.execute(
            r#"
            CREATE TABLE IF NOT EXISTS emails (
                id TEXT PRIMARY KEY,
                account_id TEXT NOT NULL,
                message_id TEXT NOT NULL,
                thread_id TEXT,
                folder TEXT NOT NULL,
                from_email TEXT NOT NULL,
                from_name TEXT,
                subject TEXT NOT NULL,
                snippet TEXT,
                body_text TEXT,
                body_html TEXT,
                date INTEGER NOT NULL,
                received_at INTEGER NOT NULL,
                is_read INTEGER DEFAULT 0,
                is_starred INTEGER DEFAULT 0,
                is_important INTEGER DEFAULT 0,
                has_attachments INTEGER DEFAULT 0,
                size INTEGER DEFAULT 0,
                raw_headers TEXT,
                imap_uid INTEGER,
                FOREIGN KEY (account_id) REFERENCES mail_accounts(id) ON DELETE CASCADE
            )
            "#,
            [],
        )?;
        
        // Email recipients table (To, CC, BCC)
        conn.execute(
            r#"
            CREATE TABLE IF NOT EXISTS email_recipients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email_id TEXT NOT NULL,
                recipient_type TEXT NOT NULL,
                email TEXT NOT NULL,
                name TEXT,
                FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE
            )
            "#,
            [],
        )?;
        
        // Email attachments table
        conn.execute(
            r#"
            CREATE TABLE IF NOT EXISTS email_attachments (
                id TEXT PRIMARY KEY,
                email_id TEXT NOT NULL,
                filename TEXT NOT NULL,
                mime_type TEXT NOT NULL,
                size INTEGER NOT NULL,
                content_id TEXT,
                is_inline INTEGER DEFAULT 0,
                encrypted INTEGER DEFAULT 0,
                local_path TEXT,
                FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE
            )
            "#,
            [],
        )?;
        
        // Email labels table
        conn.execute(
            r#"
            CREATE TABLE IF NOT EXISTS email_labels (
                email_id TEXT NOT NULL,
                label TEXT NOT NULL,
                PRIMARY KEY (email_id, label),
                FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE
            )
            "#,
            [],
        )?;
        
        // Labels definition table
        conn.execute(
            r#"
            CREATE TABLE IF NOT EXISTS mail_labels (
                id TEXT PRIMARY KEY,
                account_id TEXT NOT NULL,
                name TEXT NOT NULL,
                color TEXT,
                parent_id TEXT,
                FOREIGN KEY (account_id) REFERENCES mail_accounts(id) ON DELETE CASCADE
            )
            "#,
            [],
        )?;
        
        // Screener config table
        conn.execute(
            r#"
            CREATE TABLE IF NOT EXISTS screener_config (
                account_id TEXT PRIMARY KEY,
                enabled INTEGER DEFAULT 1,
                approved_senders TEXT,
                blocked_senders TEXT,
                auto_approve_contacts INTEGER DEFAULT 1,
                auto_approve_replied INTEGER DEFAULT 1,
                ai_suggestions_enabled INTEGER DEFAULT 1,
                FOREIGN KEY (account_id) REFERENCES mail_accounts(id) ON DELETE CASCADE
            )
            "#,
            [],
        )?;
        
        // Sync state table
        conn.execute(
            r#"
            CREATE TABLE IF NOT EXISTS sync_state (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                account_id TEXT NOT NULL,
                folder TEXT NOT NULL,
                last_uid INTEGER,
                uid_validity INTEGER,
                last_sync_at INTEGER NOT NULL,
                UNIQUE(account_id, folder),
                FOREIGN KEY (account_id) REFERENCES mail_accounts(id) ON DELETE CASCADE
            )
            "#,
            [],
        )?;
        
        // OAuth tokens table (encrypted storage)
        conn.execute(
            r#"
            CREATE TABLE IF NOT EXISTS oauth_tokens (
                account_id TEXT PRIMARY KEY,
                provider TEXT NOT NULL,
                encrypted_access_token TEXT NOT NULL,
                encrypted_refresh_token TEXT,
                expires_at INTEGER,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY (account_id) REFERENCES mail_accounts(id) ON DELETE CASCADE
            )
            "#,
            [],
        )?;
        
        // Create indexes for performance
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_emails_account_folder ON emails(account_id, folder)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_emails_date ON emails(date DESC)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_emails_message_id ON emails(message_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_emails_thread_id ON emails(thread_id)",
            [],
        )?;
        
        // Create FTS5 virtual table for full-text search
        conn.execute(
            r#"
            CREATE VIRTUAL TABLE IF NOT EXISTS emails_fts USING fts5(
                id,
                subject,
                snippet,
                body_text,
                from_email,
                from_name,
                content=emails,
                content_rowid=rowid
            )
            "#,
            [],
        )?;
        
        // Create triggers to keep FTS index synchronized
        conn.execute(
            r#"
            CREATE TRIGGER IF NOT EXISTS emails_ai AFTER INSERT ON emails BEGIN
                INSERT INTO emails_fts(rowid, id, subject, snippet, body_text, from_email, from_name)
                VALUES (NEW.rowid, NEW.id, NEW.subject, NEW.snippet, NEW.body_text, NEW.from_email, NEW.from_name);
            END
            "#,
            [],
        )?;
        
        conn.execute(
            r#"
            CREATE TRIGGER IF NOT EXISTS emails_ad AFTER DELETE ON emails BEGIN
                INSERT INTO emails_fts(emails_fts, rowid, id, subject, snippet, body_text, from_email, from_name)
                VALUES ('delete', OLD.rowid, OLD.id, OLD.subject, OLD.snippet, OLD.body_text, OLD.from_email, OLD.from_name);
            END
            "#,
            [],
        )?;
        
        conn.execute(
            r#"
            CREATE TRIGGER IF NOT EXISTS emails_au AFTER UPDATE ON emails BEGIN
                INSERT INTO emails_fts(emails_fts, rowid, id, subject, snippet, body_text, from_email, from_name)
                VALUES ('delete', OLD.rowid, OLD.id, OLD.subject, OLD.snippet, OLD.body_text, OLD.from_email, OLD.from_name);
                INSERT INTO emails_fts(rowid, id, subject, snippet, body_text, from_email, from_name)
                VALUES (NEW.rowid, NEW.id, NEW.subject, NEW.snippet, NEW.body_text, NEW.from_email, NEW.from_name);
            END
            "#,
            [],
        )?;
        
        Ok(())
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // EMAIL OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /// Insert or update an email
    pub fn save_email(&self, email: &Email) -> Result<()> {
        let conn = self.conn.lock().map_err(|_| rusqlite::Error::InvalidQuery)?;
        let _now = Utc::now().timestamp();
        
        conn.execute(
            r#"
            INSERT OR REPLACE INTO emails (
                id, account_id, message_id, thread_id, folder,
                from_email, from_name, subject, snippet, body_text, body_html,
                date, received_at, is_read, is_starred, is_important,
                has_attachments, size, raw_headers, imap_uid
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            params![
                email.id,
                email.account_id,
                email.message_id,
                email.thread_id,
                format!("{:?}", email.folder).to_lowercase(),
                email.from.email,
                email.from.name,
                email.subject,
                email.snippet,
                email.body_text,
                email.body_html,
                email.date.timestamp(),
                email.received_at.timestamp(),
                email.is_read as i32,
                email.is_starred as i32,
                email.is_important as i32,
                email.has_attachments as i32,
                email.size as i64,
                serde_json::to_string(&email.headers).ok(),
                email.attachments.len() as i64, // Using as placeholder for imap_uid
            ],
        )?;
        
        // Save recipients
        for recipient in &email.to {
            self.save_recipient(&conn, &email.id, "to", recipient)?;
        }
        for recipient in &email.cc {
            self.save_recipient(&conn, &email.id, "cc", recipient)?;
        }
        for recipient in &email.bcc {
            self.save_recipient(&conn, &email.id, "bcc", recipient)?;
        }
        
        // Save attachments
        for attachment in &email.attachments {
            self.save_attachment(&conn, &email.id, attachment)?;
        }
        
        // Save labels
        for label in &email.labels {
            conn.execute(
                "INSERT OR IGNORE INTO email_labels (email_id, label) VALUES (?, ?)",
                params![email.id, label],
            )?;
        }
        
        Ok(())
    }
    
    fn save_recipient(&self, conn: &Connection, email_id: &str, recipient_type: &str, addr: &EmailAddress) -> Result<()> {
        conn.execute(
            "INSERT INTO email_recipients (email_id, recipient_type, email, name) VALUES (?, ?, ?, ?)",
            params![email_id, recipient_type, addr.email, addr.name],
        )?;
        Ok(())
    }
    
    fn save_attachment(&self, conn: &Connection, email_id: &str, att: &EmailAttachment) -> Result<()> {
        conn.execute(
            r#"
            INSERT OR REPLACE INTO email_attachments (
                id, email_id, filename, mime_type, size, content_id, is_inline, encrypted, local_path
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            params![
                att.id,
                email_id,
                att.filename,
                att.mime_type,
                att.size as i64,
                att.content_id,
                att.is_inline as i32,
                att.encrypted as i32,
                att.local_path,
            ],
        )?;
        Ok(())
    }
    
    /// Get email by ID
    pub fn get_email(&self, id: &str) -> Result<Option<Email>> {
        let conn = self.conn.lock().map_err(|_| rusqlite::Error::InvalidQuery)?;
        
        let mut stmt = conn.prepare(
            r#"
            SELECT id, account_id, message_id, thread_id, folder,
                   from_email, from_name, subject, snippet, body_text, body_html,
                   date, received_at, is_read, is_starred, is_important,
                   has_attachments, size, raw_headers
            FROM emails WHERE id = ?
            "#,
        )?;
        
        let email = stmt.query_row(params![id], |row| {
            Ok(self.row_to_email(row)?)
        });
        
        match email {
            Ok(e) => Ok(Some(e)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }
    
    fn row_to_email(&self, row: &rusqlite::Row) -> Result<Email> {
        let folder_str: String = row.get(4)?;
        let folder = match folder_str.as_str() {
            "inbox" => MailFolder::Inbox,
            "sent" => MailFolder::Sent,
            "drafts" => MailFolder::Drafts,
            "starred" => MailFolder::Starred,
            "archive" => MailFolder::Archive,
            "spam" => MailFolder::Spam,
            "trash" => MailFolder::Trash,
            "screener" => MailFolder::Screener,
            _ => MailFolder::Custom(folder_str),
        };
        
        let date_ts: i64 = row.get(11)?;
        let received_ts: i64 = row.get(12)?;
        
        Ok(Email {
            id: row.get(0)?,
            account_id: row.get(1)?,
            message_id: row.get(2)?,
            thread_id: row.get(3)?,
            folder,
            from: EmailAddress {
                email: row.get(5)?,
                name: row.get(6)?,
                avatar: None,
                is_verified: false,
            },
            to: Vec::new(), // Will be populated separately
            cc: Vec::new(),
            bcc: Vec::new(),
            reply_to: None,
            subject: row.get(7)?,
            snippet: row.get(8)?,
            body_text: row.get(9)?,
            body_html: row.get(10)?,
            date: DateTime::from_timestamp(date_ts, 0).unwrap_or_else(Utc::now),
            received_at: DateTime::from_timestamp(received_ts, 0).unwrap_or_else(Utc::now),
            is_read: row.get::<_, i32>(13)? != 0,
            is_starred: row.get::<_, i32>(14)? != 0,
            is_important: row.get::<_, i32>(15)? != 0,
            has_attachments: row.get::<_, i32>(16)? != 0,
            attachments: Vec::new(), // Will be populated separately
            labels: Vec::new(),
            category: None,
            priority: None,
            size: row.get::<_, i64>(17)? as u64,
            spf_status: None,
            dkim_status: None,
            dmarc_status: None,
            encryption: None,
            headers: HashMap::new(),
        })
    }
    
    /// Get emails by folder with pagination
    pub fn get_emails_by_folder(
        &self,
        account_id: &str,
        folder: &MailFolder,
        page: u32,
        page_size: u32,
    ) -> Result<Vec<Email>> {
        let conn = self.conn.lock().map_err(|_| rusqlite::Error::InvalidQuery)?;
        let folder_str = format!("{:?}", folder).to_lowercase();
        let offset = (page - 1) * page_size;
        
        let mut stmt = conn.prepare(
            r#"
            SELECT id, account_id, message_id, thread_id, folder,
                   from_email, from_name, subject, snippet, body_text, body_html,
                   date, received_at, is_read, is_starred, is_important,
                   has_attachments, size, raw_headers
            FROM emails
            WHERE account_id = ? AND folder = ?
            ORDER BY date DESC
            LIMIT ? OFFSET ?
            "#,
        )?;
        
        let emails = stmt.query_map(params![account_id, folder_str, page_size, offset], |row| {
            self.row_to_email(row)
        })?;
        
        emails.collect()
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // FULL-TEXT SEARCH
    // ═══════════════════════════════════════════════════════════════════════════
    
    /// Search emails using FTS5
    pub fn search_emails(
        &self,
        account_id: &str,
        query: &str,
        folder: Option<&MailFolder>,
        page: u32,
        page_size: u32,
    ) -> Result<Vec<Email>> {
        let conn = self.conn.lock().map_err(|_| rusqlite::Error::InvalidQuery)?;
        let offset = (page - 1) * page_size;
        
        // Build the search query with FTS5
        let fts_query = format!("\"{}\"", query.replace("\"", "\"\"")); // Escape quotes
        
        let sql = if let Some(f) = folder {
            let _folder_str = format!("{:?}", f).to_lowercase();
            format!(
                r#"
                SELECT e.id, e.account_id, e.message_id, e.thread_id, e.folder,
                       e.from_email, e.from_name, e.subject, e.snippet, e.body_text, e.body_html,
                       e.date, e.received_at, e.is_read, e.is_starred, e.is_important,
                       e.has_attachments, e.size, e.raw_headers
                FROM emails e
                INNER JOIN emails_fts fts ON e.id = fts.id
                WHERE e.account_id = ? AND e.folder = ? AND emails_fts MATCH ?
                ORDER BY rank
                LIMIT ? OFFSET ?
                "#
            )
        } else {
            format!(
                r#"
                SELECT e.id, e.account_id, e.message_id, e.thread_id, e.folder,
                       e.from_email, e.from_name, e.subject, e.snippet, e.body_text, e.body_html,
                       e.date, e.received_at, e.is_read, e.is_starred, e.is_important,
                       e.has_attachments, e.size, e.raw_headers
                FROM emails e
                INNER JOIN emails_fts fts ON e.id = fts.id
                WHERE e.account_id = ? AND emails_fts MATCH ?
                ORDER BY rank
                LIMIT ? OFFSET ?
                "#
            )
        };
        
        let mut stmt = conn.prepare(&sql)?;
        
        let emails: Result<Vec<Email>> = if folder.is_some() {
            let folder_str = format!("{:?}", folder.unwrap()).to_lowercase();
            stmt.query_map(params![account_id, folder_str, fts_query, page_size, offset], |row| {
                self.row_to_email(row)
            })?.collect()
        } else {
            stmt.query_map(params![account_id, fts_query, page_size, offset], |row| {
                self.row_to_email(row)
            })?.collect()
        };
        
        emails
    }
    
    /// Search with advanced options
    pub fn search_emails_advanced(
        &self,
        account_id: &str,
        from: Option<&str>,
        _to: Option<&str>,
        subject: Option<&str>,
        body: Option<&str>,
        has_attachment: Option<bool>,
        is_unread: Option<bool>,
        date_from: Option<DateTime<Utc>>,
        date_to: Option<DateTime<Utc>>,
        page: u32,
        page_size: u32,
    ) -> Result<Vec<Email>> {
        let conn = self.conn.lock().map_err(|_| rusqlite::Error::InvalidQuery)?;
        let offset = (page - 1) * page_size;
        
        let mut conditions = vec!["account_id = ?1".to_string()];
        let mut param_idx = 2;
        let mut params: Vec<Box<dyn rusqlite::ToSql>> = vec![Box::new(account_id.to_string())];
        
        if let Some(f) = from {
            conditions.push(format!("(from_email LIKE ?{} OR from_name LIKE ?{})", param_idx, param_idx));
            params.push(Box::new(format!("%{}%", f)));
            param_idx += 1;
        }
        
        if let Some(s) = subject {
            conditions.push(format!("subject LIKE ?{}", param_idx));
            params.push(Box::new(format!("%{}%", s)));
            param_idx += 1;
        }
        
        if let Some(b) = body {
            conditions.push(format!("(body_text LIKE ?{} OR body_html LIKE ?{})", param_idx, param_idx));
            params.push(Box::new(format!("%{}%", b)));
            param_idx += 1;
        }
        
        if let Some(has_att) = has_attachment {
            conditions.push(format!("has_attachments = ?{}", param_idx));
            params.push(Box::new(has_att as i32));
            param_idx += 1;
        }
        
        if let Some(unread) = is_unread {
            conditions.push(format!("is_read = ?{}", param_idx));
            params.push(Box::new((!unread) as i32));
            param_idx += 1;
        }
        
        if let Some(df) = date_from {
            conditions.push(format!("date >= ?{}", param_idx));
            params.push(Box::new(df.timestamp()));
            param_idx += 1;
        }
        
        if let Some(dt) = date_to {
            conditions.push(format!("date <= ?{}", param_idx));
            params.push(Box::new(dt.timestamp()));
            param_idx += 1;
        }
        
        params.push(Box::new(page_size as i64));
        params.push(Box::new(offset as i64));
        
        let sql = format!(
            r#"
            SELECT id, account_id, message_id, thread_id, folder,
                   from_email, from_name, subject, snippet, body_text, body_html,
                   date, received_at, is_read, is_starred, is_important,
                   has_attachments, size, raw_headers
            FROM emails
            WHERE {}
            ORDER BY date DESC
            LIMIT ?{} OFFSET ?{}
            "#,
            conditions.join(" AND "),
            param_idx,
            param_idx + 1
        );
        
        let mut stmt = conn.prepare(&sql)?;
        let params_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
        
        let emails = stmt.query_map(params_refs.as_slice(), |row| {
            self.row_to_email(row)
        })?;
        
        emails.collect()
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // UPDATE OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /// Mark emails as read/unread
    pub fn set_read(&self, email_ids: &[String], is_read: bool) -> Result<usize> {
        let conn = self.conn.lock().map_err(|_| rusqlite::Error::InvalidQuery)?;
        
        let mut count = 0;
        let is_read_val = is_read as i32;
        for id in email_ids {
            count += conn.execute(
                "UPDATE emails SET is_read = ? WHERE id = ?",
                params![is_read_val, id],
            )?;
        }
        
        Ok(count)
    }
    
    /// Set starred status
    pub fn set_starred(&self, email_ids: &[String], is_starred: bool) -> Result<usize> {
        let conn = self.conn.lock().map_err(|_| rusqlite::Error::InvalidQuery)?;
        
        let mut count = 0;
        let is_starred_val = is_starred as i32;
        for id in email_ids {
            count += conn.execute(
                "UPDATE emails SET is_starred = ? WHERE id = ?",
                params![is_starred_val, id],
            )?;
        }
        
        Ok(count)
    }
    
    /// Move emails to folder
    pub fn move_to_folder(&self, email_ids: &[String], folder: &MailFolder) -> Result<usize> {
        let conn = self.conn.lock().map_err(|_| rusqlite::Error::InvalidQuery)?;
        let folder_str = format!("{:?}", folder).to_lowercase();
        
        let mut count = 0;
        for id in email_ids {
            count += conn.execute(
                "UPDATE emails SET folder = ? WHERE id = ?",
                params![folder_str, id],
            )?;
        }
        
        Ok(count)
    }
    
    /// Delete emails permanently
    pub fn delete_emails(&self, email_ids: &[String]) -> Result<usize> {
        let conn = self.conn.lock().map_err(|_| rusqlite::Error::InvalidQuery)?;
        
        let mut count = 0;
        for id in email_ids {
            count += conn.execute(
                "DELETE FROM emails WHERE id = ?",
                params![id],
            )?;
        }
        
        Ok(count)
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ACCOUNT OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /// Save mail account
    pub fn save_account(&self, account: &MailAccount) -> Result<()> {
        let conn = self.conn.lock().map_err(|_| rusqlite::Error::InvalidQuery)?;
        let _now = Utc::now().timestamp();
        
        let imap_config = serde_json::to_string(&account.imap)
            .map_err(|_| rusqlite::Error::InvalidQuery)?;
        let smtp_config = serde_json::to_string(&account.smtp)
            .map_err(|_| rusqlite::Error::InvalidQuery)?;
        
        conn.execute(
            r#"
            INSERT OR REPLACE INTO mail_accounts (
                id, email, name, provider, imap_config, smtp_config,
                is_active, last_sync_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            params![
                account.id,
                account.email,
                account.name,
                format!("{:?}", account.provider),
                imap_config,
                smtp_config,
                account.is_enabled as i32,
                account.last_sync.map(|d| d.timestamp()),
                account.created_at.timestamp(),
                account.updated_at.timestamp(),
            ],
        )?;
        
        Ok(())
    }
    
    /// Get account by ID
    pub fn get_account(&self, id: &str) -> Result<Option<MailAccount>> {
        let conn = self.conn.lock().map_err(|_| rusqlite::Error::InvalidQuery)?;
        
        let mut stmt = conn.prepare(
            "SELECT id, email, name, provider, imap_config, smtp_config, is_active, last_sync_at FROM mail_accounts WHERE id = ?",
        )?;
        
        let account = stmt.query_row(params![id], |row| {
            self.row_to_account(row)
        });
        
        match account {
            Ok(a) => Ok(Some(a)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }
    
    /// Get all accounts
    pub fn get_all_accounts(&self) -> Result<Vec<MailAccount>> {
        let conn = self.conn.lock().map_err(|_| rusqlite::Error::InvalidQuery)?;
        
        let mut stmt = conn.prepare(
            "SELECT id, email, name, provider, imap_config, smtp_config, is_active, last_sync_at FROM mail_accounts ORDER BY email",
        )?;
        
        let accounts = stmt.query_map([], |row| {
            self.row_to_account(row)
        })?;
        
        accounts.collect()
    }
    
    fn row_to_account(&self, row: &rusqlite::Row) -> Result<MailAccount> {
        let provider_str: String = row.get(3)?;
        let provider = match provider_str.as_str() {
            "Gmail" => MailProvider::Gmail,
            "Outlook" => MailProvider::Outlook,
            "Yahoo" => MailProvider::Yahoo,
            "Icloud" => MailProvider::Icloud,
            "Protonmail" => MailProvider::Protonmail,
            "CubeMail" => MailProvider::CubeMail,
            _ => MailProvider::Custom,
        };
        
        let imap_json: String = row.get(4)?;
        let smtp_json: String = row.get(5)?;
        
        let imap: ImapConfig = serde_json::from_str(&imap_json)
            .unwrap_or_default();
        let smtp: SmtpConfig = serde_json::from_str(&smtp_json)
            .unwrap_or_default();
        
        let last_sync_ts: Option<i64> = row.get(7)?;
        let now = Utc::now();
        
        Ok(MailAccount {
            id: row.get(0)?,
            email: row.get(1)?,
            name: row.get(2)?,
            provider,
            imap,
            smtp,
            signature: None,
            is_primary: false,
            is_enabled: row.get::<_, i32>(6)? != 0,
            sync_interval_minutes: 5,
            last_sync: last_sync_ts.and_then(|ts| DateTime::from_timestamp(ts, 0)),
            storage_used: 0,
            storage_limit: 15 * 1024 * 1024 * 1024,
            color: None,
            created_at: now,
            updated_at: now,
        })
    }
    
    /// Delete account and all associated data
    pub fn delete_account(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().map_err(|_| rusqlite::Error::InvalidQuery)?;
        conn.execute("DELETE FROM mail_accounts WHERE id = ?", params![id])?;
        Ok(())
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // STATISTICS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /// Get email count by folder
    pub fn get_folder_counts(&self, account_id: &str) -> Result<HashMap<String, u32>> {
        let conn = self.conn.lock().map_err(|_| rusqlite::Error::InvalidQuery)?;
        
        let mut stmt = conn.prepare(
            "SELECT folder, COUNT(*) FROM emails WHERE account_id = ? GROUP BY folder",
        )?;
        
        let mut counts = HashMap::new();
        let rows = stmt.query_map(params![account_id], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, u32>(1)?))
        })?;
        
        for row in rows {
            let (folder, count) = row?;
            counts.insert(folder, count);
        }
        
        Ok(counts)
    }
    
    /// Get unread count
    pub fn get_unread_count(&self, account_id: &str) -> Result<u32> {
        let conn = self.conn.lock().map_err(|_| rusqlite::Error::InvalidQuery)?;
        
        let count: u32 = conn.query_row(
            "SELECT COUNT(*) FROM emails WHERE account_id = ? AND is_read = 0",
            params![account_id],
            |row| row.get(0),
        )?;
        
        Ok(count)
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════════

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;
    
    fn create_test_email(id: &str, account_id: &str, subject: &str) -> Email {
        Email {
            id: id.to_string(),
            account_id: account_id.to_string(),
            message_id: format!("<{}@test>", id),
            thread_id: None,
            folder: MailFolder::Inbox,
            from: EmailAddress {
                email: "sender@test.com".to_string(),
                name: Some("Test Sender".to_string()),
                avatar: None,
                is_verified: false,
            },
            to: vec![EmailAddress {
                email: "recipient@test.com".to_string(),
                name: None,
                avatar: None,
                is_verified: false,
            }],
            cc: Vec::new(),
            bcc: Vec::new(),
            reply_to: None,
            subject: subject.to_string(),
            snippet: "Test snippet".to_string(),
            body_text: Some("Test body text".to_string()),
            body_html: None,
            date: Utc::now(),
            received_at: Utc::now(),
            is_read: false,
            is_starred: false,
            is_important: false,
            has_attachments: false,
            attachments: Vec::new(),
            labels: Vec::new(),
            category: None,
            priority: None,
            size: 1000,
            spf_status: None,
            dkim_status: None,
            dmarc_status: None,
            encryption: None,
            headers: HashMap::new(),
        }
    }
    
    #[test]
    fn test_database_initialization() {
        let temp_dir = env::temp_dir().join("cube_mail_test");
        std::fs::create_dir_all(&temp_dir).unwrap();
        
        let db = MailDatabase::new(temp_dir.clone()).unwrap();
        
        // Cleanup
        std::fs::remove_dir_all(&temp_dir).ok();
    }
    
    #[test]
    fn test_save_and_get_email() {
        let temp_dir = env::temp_dir().join("cube_mail_test_email");
        std::fs::create_dir_all(&temp_dir).unwrap();
        
        let db = MailDatabase::new(temp_dir.clone()).unwrap();
        let email = create_test_email("test-1", "account-1", "Test Subject");
        
        db.save_email(&email).unwrap();
        
        let retrieved = db.get_email("test-1").unwrap();
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().subject, "Test Subject");
        
        // Cleanup
        std::fs::remove_dir_all(&temp_dir).ok();
    }
}
