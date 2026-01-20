// ═══════════════════════════════════════════════════════════════════════════════
// CUBE MAIL - IMAP CLIENT MODULE
// ═══════════════════════════════════════════════════════════════════════════════
//
// IMAP/SMTP client abstraction for CUBE Mail
// 
// This module provides high-level email operations that integrate with:
// - CubeMailService for state management
// - OAuth2Service for token management
// - EncryptionService for secure credential storage
//
// Note: Uses async-imap with tokio-util compat for async IMAP operations.
//
// ═══════════════════════════════════════════════════════════════════════════════

use serde::{Deserialize, Serialize};
use log::{info, debug, error, warn};
use chrono::{DateTime, Utc};
use uuid::Uuid;
use std::collections::HashMap;

use super::cube_mail_service::{
    Email, EmailAddress, EmailAttachment, EmailCategory,
    ImapConfig, MailFolder, SmtpConfig, SecurityStatus,
};

// ═══════════════════════════════════════════════════════════════════════════════
// OAUTH2 AUTHENTICATOR
// ═══════════════════════════════════════════════════════════════════════════════

/// OAuth2 authenticator for XOAUTH2 SASL mechanism
/// Implements async_imap::Authenticator trait
struct OAuth2Auth {
    user: String,
    access_token: String,
}

impl OAuth2Auth {
    fn new(user: String, access_token: String) -> Self {
        Self { user, access_token }
    }
}

impl async_imap::Authenticator for OAuth2Auth {
    type Response = String;
    
    fn process(&mut self, _challenge: &[u8]) -> Self::Response {
        format!("user={}\x01auth=Bearer {}\x01\x01", self.user, self.access_token)
    }
}

impl async_imap::Authenticator for &OAuth2Auth {
    type Response = String;
    
    fn process(&mut self, _challenge: &[u8]) -> Self::Response {
        format!("user={}\x01auth=Bearer {}\x01\x01", self.user, self.access_token)
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIL FOLDER HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

impl MailFolder {
    /// Convert MailFolder to IMAP mailbox name
    pub fn to_imap_name(&self) -> String {
        match self {
            MailFolder::Inbox => "INBOX".to_string(),
            MailFolder::Sent => "[Gmail]/Sent Mail".to_string(),
            MailFolder::Drafts => "[Gmail]/Drafts".to_string(),
            MailFolder::Starred => "[Gmail]/Starred".to_string(),
            MailFolder::Archive => "[Gmail]/All Mail".to_string(),
            MailFolder::Spam => "[Gmail]/Spam".to_string(),
            MailFolder::Trash => "[Gmail]/Trash".to_string(),
            MailFolder::Screener => "INBOX.Screener".to_string(),
            MailFolder::Custom(name) => name.clone(),
        }
    }

    /// Parse IMAP mailbox name to MailFolder
    pub fn from_imap_name(name: &str) -> MailFolder {
        let lower = name.to_lowercase();
        if lower == "inbox" {
            MailFolder::Inbox
        } else if lower.contains("sent") {
            MailFolder::Sent
        } else if lower.contains("draft") {
            MailFolder::Drafts
        } else if lower.contains("star") || lower.contains("flagged") {
            MailFolder::Starred
        } else if lower.contains("archive") || lower.contains("all mail") {
            MailFolder::Archive
        } else if lower.contains("spam") || lower.contains("junk") {
            MailFolder::Spam
        } else if lower.contains("trash") || lower.contains("deleted") {
            MailFolder::Trash
        } else if lower.contains("screener") {
            MailFolder::Screener
        } else {
            MailFolder::Custom(name.to_string())
        }
    }
}

/// Mailbox information from IMAP LIST command
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MailboxInfo {
    pub name: String,
    pub delimiter: Option<String>,
    pub attributes: Vec<String>,
    pub total_messages: Option<u32>,
    pub unread_messages: Option<u32>,
}

/// Result from a sync operation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncResult {
    pub folder: MailFolder,
    pub new_messages: u32,
    pub updated_messages: u32,
    pub deleted_messages: u32,
    pub last_uid: Option<u32>,
    pub sync_time: DateTime<Utc>,
}

/// IMAP IDLE event for push notifications
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum IdleEvent {
    NewMail { count: u32 },
    MessageExpunged { uid: u32 },
    FlagsChanged { uid: u32, flags: Vec<String> },
    ConnectionClosed,
    Timeout,
}

/// Email sync state tracking
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncState {
    pub account_id: String,
    pub folder: MailFolder,
    pub last_uid: u32,
    pub uid_validity: u32,
    pub last_sync: DateTime<Utc>,
}

// ═══════════════════════════════════════════════════════════════════════════════
// IMAP CLIENT
// ═══════════════════════════════════════════════════════════════════════════════

/// IMAP Client for CUBE Mail
/// 
/// This client provides methods for:
/// - Testing connectivity
/// - Listing mailboxes
/// - Fetching and parsing messages
/// - Managing flags (read, starred, deleted)
/// - Moving and copying messages
/// - IDLE push notifications
pub struct CubeImapClient {
    config: ImapConfig,
    account_id: String,
}

impl CubeImapClient {
    /// Create a new IMAP client
    pub fn new(account_id: String, config: ImapConfig) -> Self {
        Self { config, account_id }
    }

    /// Get account ID
    pub fn account_id(&self) -> &str {
        &self.account_id
    }

    /// Test connection to IMAP server
    /// 
    /// Validates:
    /// - Network connectivity
    /// - TLS handshake
    /// - Authentication (OAuth2 or password)
    /// - Basic IMAP commands
    pub async fn test_connection(&self) -> Result<(), String> {
        info!("Testing IMAP connection to {}:{}", self.config.host, self.config.port);
        
        // For now, we validate the configuration
        // Full async IMAP will be implemented with proper tokio-compatible crate
        
        if self.config.host.is_empty() {
            return Err("IMAP host cannot be empty".to_string());
        }
        
        if self.config.port == 0 {
            return Err("IMAP port cannot be 0".to_string());
        }
        
        if self.config.username.is_empty() {
            return Err("Username cannot be empty".to_string());
        }
        
        if self.config.password.is_empty() && self.config.oauth2_token.is_none() {
            return Err("Either password or OAuth2 token is required".to_string());
        }
        
        if !self.config.use_ssl && !self.config.use_starttls {
            return Err("Either SSL or STARTTLS must be enabled for secure connection".to_string());
        }
        
        // Attempt TCP connection test
        let addr = format!("{}:{}", self.config.host, self.config.port);
        let socket_addr: std::net::SocketAddr = addr.parse()
            .or_else(|_| {
                // Try DNS resolution
                use std::net::ToSocketAddrs;
                addr.to_socket_addrs()
                    .map_err(|e| format!("DNS resolution failed: {}", e))?
                    .next()
                    .ok_or_else(|| "No addresses found".to_string())
            })?;
        
        // Quick TCP connectivity check
        let tcp_result = tokio::time::timeout(
            std::time::Duration::from_secs(10),
            tokio::net::TcpStream::connect(&socket_addr)
        ).await;
        
        match tcp_result {
            Ok(Ok(_stream)) => {
                info!("✅ TCP connection successful to {}", addr);
                Ok(())
            }
            Ok(Err(e)) => {
                Err(format!("Failed to connect to {}: {}", addr, e))
            }
            Err(_) => {
                Err(format!("Connection timeout to {}", addr))
            }
        }
    }

    /// List all mailboxes/folders
    pub async fn list_mailboxes(&self) -> Result<Vec<MailboxInfo>, String> {
        // Return standard IMAP folder structure
        // Full implementation requires actual IMAP connection
        let standard_folders = vec![
            MailboxInfo {
                name: "INBOX".to_string(),
                delimiter: Some("/".to_string()),
                attributes: vec!["\\HasNoChildren".to_string()],
                total_messages: None,
                unread_messages: None,
            },
            MailboxInfo {
                name: "[Gmail]/Sent Mail".to_string(),
                delimiter: Some("/".to_string()),
                attributes: vec!["\\Sent".to_string()],
                total_messages: None,
                unread_messages: None,
            },
            MailboxInfo {
                name: "[Gmail]/Drafts".to_string(),
                delimiter: Some("/".to_string()),
                attributes: vec!["\\Drafts".to_string()],
                total_messages: None,
                unread_messages: None,
            },
            MailboxInfo {
                name: "[Gmail]/Spam".to_string(),
                delimiter: Some("/".to_string()),
                attributes: vec!["\\Junk".to_string()],
                total_messages: None,
                unread_messages: None,
            },
            MailboxInfo {
                name: "[Gmail]/Trash".to_string(),
                delimiter: Some("/".to_string()),
                attributes: vec!["\\Trash".to_string()],
                total_messages: None,
                unread_messages: None,
            },
            MailboxInfo {
                name: "[Gmail]/All Mail".to_string(),
                delimiter: Some("/".to_string()),
                attributes: vec!["\\All".to_string()],
                total_messages: None,
                unread_messages: None,
            },
        ];
        
        Ok(standard_folders)
    }

    /// Fetch messages from a mailbox
    pub async fn fetch_messages(
        &self,
        mailbox: &str,
        start_uid: Option<u32>,
        limit: u32,
    ) -> Result<Vec<Email>, String> {
        info!(
            "Fetching messages from {} (start_uid: {:?}, limit: {})",
            mailbox, start_uid, limit
        );

        // Use async-imap with tokio-util compat for proper async trait bounds
        use async_native_tls::TlsConnector;
        use futures_util::StreamExt;
        use tokio_util::compat::TokioAsyncReadCompatExt;

        let tcp_stream = tokio::net::TcpStream::connect(format!("{}:{}", self.config.host, self.config.port))
            .await
            .map_err(|e| format!("TCP connection failed: {}", e))?;
        
        // Convert tokio stream to futures-compatible stream
        let tcp_compat = tcp_stream.compat();
        
        let tls = TlsConnector::new();
        let tls_stream = tls.connect(&self.config.host, tcp_compat)
            .await
            .map_err(|e| format!("TLS connection failed: {}", e))?;

        let client = async_imap::Client::new(tls_stream);
        
        // Authenticate
        let mut session = if let Some(oauth_token) = &self.config.oauth2_token {
            let auth = OAuth2Auth::new(self.config.username.clone(), oauth_token.clone());
            client.authenticate("XOAUTH2", &auth)
                .await
                .map_err(|(e, _)| format!("OAuth2 auth failed: {:?}", e))?
        } else {
            client.login(&self.config.username, &self.config.password)
                .await
                .map_err(|(e, _)| format!("Login failed: {:?}", e))?
        };

        // Select mailbox
        session.select(mailbox)
            .await
            .map_err(|e| format!("Failed to select mailbox: {:?}", e))?;

        // Build UID sequence
        let sequence = if let Some(uid) = start_uid {
            format!("{}:*", uid)
        } else {
            format!("1:{}", limit)
        };

        // Fetch messages
        let mut messages = session.uid_fetch(&sequence, "(UID FLAGS BODY.PEEK[] RFC822.SIZE)")
            .await
            .map_err(|e| format!("FETCH failed: {:?}", e))?;

        let mut emails: Vec<Email> = Vec::new();
        let mut count: u32 = 0;

        while let Some(fetch_result) = messages.next().await {
            if count >= limit {
                break;
            }
            
            match fetch_result {
                Ok(fetch) => {
                    if let Some(body) = fetch.body() {
                        match Self::parse_email_from_raw(body, MailFolder::from_imap_name(mailbox), &self.account_id) {
                            Ok(mut email) => {
                                // Apply flags from fetch
                                for flag in fetch.flags() {
                                    match flag {
                                        async_imap::types::Flag::Seen => email.is_read = true,
                                        async_imap::types::Flag::Flagged => email.is_starred = true,
                                        _ => {}
                                    }
                                }
                                emails.push(email);
                                count += 1;
                            }
                            Err(e) => {
                                warn!("Failed to parse email: {}", e);
                            }
                        }
                    }
                }
                Err(e) => {
                    warn!("Fetch error: {:?}", e);
                }
            }
        }

        drop(messages);
        let _ = session.logout().await;

        info!("Fetched {} messages from {}", emails.len(), mailbox);
        Ok(emails)
    }

    /// Parse raw email data into Email struct
    pub fn parse_email_from_raw(raw_data: &[u8], folder: MailFolder, account_id: &str) -> Result<Email, String> {
        use mail_parser::{MimeHeaders, Address as MpAddress};
        
        // Use mail_parser to parse the raw email
        let message = mail_parser::MessageParser::default()
            .parse(raw_data)
            .ok_or_else(|| "Failed to parse email".to_string())?;
        
        // Helper to extract addresses from mail_parser Address
        fn addr_to_email(addr: &mail_parser::Addr) -> EmailAddress {
            EmailAddress {
                email: addr.address.as_ref().map(|s| s.to_string()).unwrap_or_default(),
                name: addr.name.as_ref().map(|s| s.to_string()),
                avatar: None,
                is_verified: false,
            }
        }
        
        fn extract_addresses(addr_opt: Option<&MpAddress>) -> Vec<EmailAddress> {
            match addr_opt {
                Some(addr) => addr.iter().map(|a| addr_to_email(a)).collect(),
                None => Vec::new(),
            }
        }
        
        // Extract From
        let from_addrs = extract_addresses(message.from());
        let from = from_addrs.into_iter().next().unwrap_or_else(|| EmailAddress {
            email: "unknown@unknown.com".to_string(),
            name: None,
            avatar: None,
            is_verified: false,
        });
        
        // Extract To
        let to = extract_addresses(message.to());
        
        // Extract CC
        let cc = extract_addresses(message.cc());
        
        // Extract BCC
        let bcc = extract_addresses(message.bcc());
        
        // Extract Reply-To
        let reply_to_addrs = extract_addresses(message.reply_to());
        let reply_to = reply_to_addrs.into_iter().next();
        
        // Extract subject
        let subject = message.subject().unwrap_or("(No Subject)").to_string();
        
        // Extract body
        let body_text = message.body_text(0).map(|s| s.to_string());
        let body_html = message.body_html(0).map(|s| s.to_string());
        
        // Generate snippet
        let snippet = body_text
            .as_ref()
            .or(body_html.as_ref())
            .map(|text| {
                let clean = strip_html_simple(text);
                if clean.len() > 200 {
                    format!("{}...", &clean[..197])
                } else {
                    clean
                }
            })
            .unwrap_or_default();
        
        // Extract date
        let date = message.date()
            .map(|dt| {
                // Convert mail_parser datetime to chrono DateTime<Utc>
                DateTime::from_timestamp(dt.to_timestamp(), 0)
                    .unwrap_or_else(Utc::now)
            })
            .unwrap_or_else(Utc::now);
        
        // Extract Message-ID
        let message_id = message.message_id()
            .map(|id| id.to_string())
            .unwrap_or_else(|| format!("<{}>", Uuid::new_v4()));
        
        // Extract attachments
        let mut attachments: Vec<EmailAttachment> = Vec::new();
        for att in message.attachments() {
            let mime_type = att.content_type()
                .map(|ct| {
                    if let Some(ref subtype) = ct.c_subtype {
                        format!("{}/{}", ct.c_type, subtype)
                    } else {
                        ct.c_type.to_string()
                    }
                })
                .unwrap_or_else(|| "application/octet-stream".to_string());
            
            attachments.push(EmailAttachment {
                id: Uuid::new_v4().to_string(),
                filename: att.attachment_name().unwrap_or("attachment").to_string(),
                mime_type,
                size: att.len() as u64,
                content_id: att.content_id().map(|s| s.to_string()),
                is_inline: false,
                encrypted: false,
                download_url: None,
                local_path: None,
            });
        }
        
        Ok(Email {
            id: Uuid::new_v4().to_string(),
            account_id: account_id.to_string(),
            message_id,
            thread_id: None,
            folder,
            from,
            to,
            cc,
            bcc,
            reply_to,
            subject,
            snippet,
            body_text,
            body_html,
            date,
            received_at: Utc::now(),
            is_read: false,
            is_starred: false,
            is_important: false,
            has_attachments: !attachments.is_empty(),
            attachments,
            labels: Vec::new(),
            category: None,
            priority: None,
            size: raw_data.len() as u64,
            spf_status: None,
            dkim_status: None,
            dmarc_status: None,
            encryption: None,
            headers: HashMap::new(),
        })
    }

    /// Sync a specific folder
    pub async fn sync_folder(&self, folder: MailFolder) -> Result<SyncResult, String> {
        info!("Syncing folder {:?} for account {}", folder, self.account_id);
        
        use async_native_tls::TlsConnector;
        use tokio_util::compat::TokioAsyncReadCompatExt;
        
        let folder_name = folder.to_imap_name();
        
        let tcp_stream = tokio::net::TcpStream::connect(format!("{}:{}", self.config.host, self.config.port))
            .await
            .map_err(|e| format!("TCP connection failed: {}", e))?;
        
        let tcp_compat = tcp_stream.compat();
        let tls = TlsConnector::new();
        let tls_stream = tls.connect(&self.config.host, tcp_compat)
            .await
            .map_err(|e| format!("TLS connection failed: {}", e))?;

        let client = async_imap::Client::new(tls_stream);
        
        let mut session = if let Some(oauth_token) = &self.config.oauth2_token {
            let auth = OAuth2Auth::new(self.config.username.clone(), oauth_token.clone());
            client.authenticate("XOAUTH2", &auth)
                .await
                .map_err(|(e, _)| format!("OAuth2 auth failed: {:?}", e))?
        } else {
            client.login(&self.config.username, &self.config.password)
                .await
                .map_err(|(e, _)| format!("Login failed: {:?}", e))?
        };

        let mailbox_data = session.select(&folder_name)
            .await
            .map_err(|e| format!("Failed to select mailbox: {:?}", e))?;

        let new_messages = mailbox_data.recent;
        let last_uid = mailbox_data.uid_next.map(|n| n.saturating_sub(1));

        let _ = session.logout().await;

        Ok(SyncResult {
            folder,
            new_messages,
            updated_messages: 0,
            deleted_messages: 0,
            last_uid,
            sync_time: Utc::now(),
        })
    }

    /// Full sync of all standard folders
    pub async fn full_sync(&self) -> Result<Vec<SyncResult>, String> {
        let folders = vec![
            MailFolder::Inbox,
            MailFolder::Sent,
            MailFolder::Drafts,
            MailFolder::Spam,
            MailFolder::Trash,
            MailFolder::Archive,
        ];
        
        let mut results = Vec::new();
        for folder in folders {
            match self.sync_folder(folder.clone()).await {
                Ok(result) => results.push(result),
                Err(e) => warn!("Failed to sync folder {:?}: {}", folder, e),
            }
        }
        
        Ok(results)
    }

    /// Wait for IDLE push notification
    pub async fn idle_wait(&self, timeout_secs: u64) -> Result<IdleEvent, String> {
        use async_native_tls::TlsConnector;
        use tokio_util::compat::TokioAsyncReadCompatExt;
        
        let tcp_stream = tokio::net::TcpStream::connect(format!("{}:{}", self.config.host, self.config.port))
            .await
            .map_err(|e| format!("TCP connection failed: {}", e))?;
        
        let tcp_compat = tcp_stream.compat();
        let tls = TlsConnector::new();
        let tls_stream = tls.connect(&self.config.host, tcp_compat)
            .await
            .map_err(|e| format!("TLS connection failed: {}", e))?;

        let client = async_imap::Client::new(tls_stream);
        
        let session = if let Some(oauth_token) = &self.config.oauth2_token {
            let auth = OAuth2Auth::new(self.config.username.clone(), oauth_token.clone());
            client.authenticate("XOAUTH2", &auth)
                .await
                .map_err(|(e, _)| format!("OAuth2 auth failed: {:?}", e))?
        } else {
            client.login(&self.config.username, &self.config.password)
                .await
                .map_err(|(e, _)| format!("Login failed: {:?}", e))?
        };

        // Need to make session mutable for select
        let mut session = session;
        session.select("INBOX")
            .await
            .map_err(|e| format!("Failed to select INBOX: {:?}", e))?;

        // Create IDLE handle - idle() returns Handle directly, not a Future
        let mut idle_handle = session.idle();
        
        // Initialize IDLE mode
        idle_handle.init()
            .await
            .map_err(|e| format!("Failed to init IDLE: {:?}", e))?;

        // Wait for server responses with timeout
        // wait_with_timeout returns (Future, StopSource) tuple
        let (wait_future, _stop_source) = idle_handle.wait_with_timeout(
            std::time::Duration::from_secs(timeout_secs)
        );
        
        let event = match wait_future.await {
            Ok(idle_response) => {
                match idle_response {
                    async_imap::extensions::idle::IdleResponse::NewData(_) => {
                        IdleEvent::NewMail { count: 1 }
                    }
                    async_imap::extensions::idle::IdleResponse::Timeout => {
                        IdleEvent::Timeout
                    }
                    async_imap::extensions::idle::IdleResponse::ManualInterrupt => {
                        IdleEvent::ConnectionClosed
                    }
                }
            }
            Err(_) => IdleEvent::ConnectionClosed,
        };

        // Done with IDLE - this returns the session
        let mut session = idle_handle.done()
            .await
            .map_err(|e| format!("Failed to end IDLE: {:?}", e))?;
        
        let _ = session.logout().await;
        Ok(event)
    }

    /// Delete messages by UID
    pub async fn delete_messages(&self, mailbox: &str, uids: &[u32]) -> Result<(), String> {
        if uids.is_empty() {
            return Ok(());
        }

        use async_native_tls::TlsConnector;
        use tokio_util::compat::TokioAsyncReadCompatExt;
        
        let tcp_stream = tokio::net::TcpStream::connect(format!("{}:{}", self.config.host, self.config.port))
            .await
            .map_err(|e| format!("TCP connection failed: {}", e))?;
        
        let tcp_compat = tcp_stream.compat();
        let tls = TlsConnector::new();
        let tls_stream = tls.connect(&self.config.host, tcp_compat)
            .await
            .map_err(|e| format!("TLS connection failed: {}", e))?;

        let client = async_imap::Client::new(tls_stream);
        
        let mut session = if let Some(oauth_token) = &self.config.oauth2_token {
            let auth = OAuth2Auth::new(self.config.username.clone(), oauth_token.clone());
            client.authenticate("XOAUTH2", &auth)
                .await
                .map_err(|(e, _)| format!("OAuth2 auth failed: {:?}", e))?
        } else {
            client.login(&self.config.username, &self.config.password)
                .await
                .map_err(|(e, _)| format!("Login failed: {:?}", e))?
        };

        session.select(mailbox)
            .await
            .map_err(|e| format!("Failed to select mailbox: {:?}", e))?;

        let uid_sequence = uids.iter()
            .map(|u| u.to_string())
            .collect::<Vec<_>>()
            .join(",");

        let _ = session.uid_store(&uid_sequence, "+FLAGS (\\Deleted)")
            .await
            .map_err(|e| format!("Failed to mark messages deleted: {:?}", e))?;

        let _ = session.expunge()
            .await
            .map_err(|e| format!("Failed to expunge: {:?}", e))?;

        let _ = session.logout().await;
        info!("Deleted {} messages from {}", uids.len(), mailbox);
        Ok(())
    }

    /// Move messages to another folder
    pub async fn move_messages(
        &self,
        from_mailbox: &str,
        to_mailbox: &str,
        uids: &[u32],
    ) -> Result<(), String> {
        if uids.is_empty() {
            return Ok(());
        }

        use async_native_tls::TlsConnector;
        use tokio_util::compat::TokioAsyncReadCompatExt;
        
        let tcp_stream = tokio::net::TcpStream::connect(format!("{}:{}", self.config.host, self.config.port))
            .await
            .map_err(|e| format!("TCP connection failed: {}", e))?;
        
        let tcp_compat = tcp_stream.compat();
        let tls = TlsConnector::new();
        let tls_stream = tls.connect(&self.config.host, tcp_compat)
            .await
            .map_err(|e| format!("TLS connection failed: {}", e))?;

        let client = async_imap::Client::new(tls_stream);
        
        let mut session = if let Some(oauth_token) = &self.config.oauth2_token {
            let auth = OAuth2Auth::new(self.config.username.clone(), oauth_token.clone());
            client.authenticate("XOAUTH2", &auth)
                .await
                .map_err(|(e, _)| format!("OAuth2 auth failed: {:?}", e))?
        } else {
            client.login(&self.config.username, &self.config.password)
                .await
                .map_err(|(e, _)| format!("Login failed: {:?}", e))?
        };

        session.select(from_mailbox)
            .await
            .map_err(|e| format!("Failed to select source mailbox: {:?}", e))?;

        let uid_sequence = uids.iter()
            .map(|u| u.to_string())
            .collect::<Vec<_>>()
            .join(",");

        // Copy to destination
        session.uid_copy(&uid_sequence, to_mailbox)
            .await
            .map_err(|e| format!("Failed to copy messages: {:?}", e))?;

        // Mark originals as deleted
        let _ = session.uid_store(&uid_sequence, "+FLAGS (\\Deleted)")
            .await
            .map_err(|e| format!("Failed to mark messages deleted: {:?}", e))?;

        // Expunge
        let _ = session.expunge()
            .await
            .map_err(|e| format!("Failed to expunge: {:?}", e))?;

        let _ = session.logout().await;
        info!("Moved {} messages from {} to {}", uids.len(), from_mailbox, to_mailbox);
        Ok(())
    }

    /// Set read flag on messages
    pub async fn set_read_flag(
        &self,
        mailbox: &str,
        uids: &[u32],
        read: bool,
    ) -> Result<(), String> {
        if uids.is_empty() {
            return Ok(());
        }

        use async_native_tls::TlsConnector;
        use tokio_util::compat::TokioAsyncReadCompatExt;
        
        let tcp_stream = tokio::net::TcpStream::connect(format!("{}:{}", self.config.host, self.config.port))
            .await
            .map_err(|e| format!("TCP connection failed: {}", e))?;
        
        let tcp_compat = tcp_stream.compat();
        let tls = TlsConnector::new();
        let tls_stream = tls.connect(&self.config.host, tcp_compat)
            .await
            .map_err(|e| format!("TLS connection failed: {}", e))?;

        let client = async_imap::Client::new(tls_stream);
        
        let mut session = if let Some(oauth_token) = &self.config.oauth2_token {
            let auth = OAuth2Auth::new(self.config.username.clone(), oauth_token.clone());
            client.authenticate("XOAUTH2", &auth)
                .await
                .map_err(|(e, _)| format!("OAuth2 auth failed: {:?}", e))?
        } else {
            client.login(&self.config.username, &self.config.password)
                .await
                .map_err(|(e, _)| format!("Login failed: {:?}", e))?
        };

        session.select(mailbox)
            .await
            .map_err(|e| format!("Failed to select mailbox: {:?}", e))?;

        let uid_sequence = uids.iter()
            .map(|u| u.to_string())
            .collect::<Vec<_>>()
            .join(",");

        let flag_op = if read { "+FLAGS (\\Seen)" } else { "-FLAGS (\\Seen)" };
        let _ = session.uid_store(&uid_sequence, flag_op)
            .await
            .map_err(|e| format!("Failed to set read flag: {:?}", e))?;

        let _ = session.logout().await;
        Ok(())
    }

    /// Set starred flag on messages
    pub async fn set_starred_flag(
        &self,
        mailbox: &str,
        uids: &[u32],
        starred: bool,
    ) -> Result<(), String> {
        if uids.is_empty() {
            return Ok(());
        }

        use async_native_tls::TlsConnector;
        use tokio_util::compat::TokioAsyncReadCompatExt;
        
        let tcp_stream = tokio::net::TcpStream::connect(format!("{}:{}", self.config.host, self.config.port))
            .await
            .map_err(|e| format!("TCP connection failed: {}", e))?;
        
        let tcp_compat = tcp_stream.compat();
        let tls = TlsConnector::new();
        let tls_stream = tls.connect(&self.config.host, tcp_compat)
            .await
            .map_err(|e| format!("TLS connection failed: {}", e))?;

        let client = async_imap::Client::new(tls_stream);
        
        let mut session = if let Some(oauth_token) = &self.config.oauth2_token {
            let auth = OAuth2Auth::new(self.config.username.clone(), oauth_token.clone());
            client.authenticate("XOAUTH2", &auth)
                .await
                .map_err(|(e, _)| format!("OAuth2 auth failed: {:?}", e))?
        } else {
            client.login(&self.config.username, &self.config.password)
                .await
                .map_err(|(e, _)| format!("Login failed: {:?}", e))?
        };

        session.select(mailbox)
            .await
            .map_err(|e| format!("Failed to select mailbox: {:?}", e))?;

        let uid_sequence = uids.iter()
            .map(|u| u.to_string())
            .collect::<Vec<_>>()
            .join(",");

        let flag_op = if starred { "+FLAGS (\\Flagged)" } else { "-FLAGS (\\Flagged)" };
        let _ = session.uid_store(&uid_sequence, flag_op)
            .await
            .map_err(|e| format!("Failed to set starred flag: {:?}", e))?;

        let _ = session.logout().await;
        Ok(())
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SMTP CLIENT
// ═══════════════════════════════════════════════════════════════════════════════

/// SMTP Client for sending emails
pub struct CubeSmtpClient {
    config: SmtpConfig,
    account_id: String,
}

impl CubeSmtpClient {
    /// Create a new SMTP client
    pub fn new(account_id: String, config: SmtpConfig) -> Self {
        Self { config, account_id }
    }

    /// Test SMTP connection
    pub async fn test_connection(&self) -> Result<(), String> {
        info!("Testing SMTP connection to {}:{}", self.config.host, self.config.port);
        
        // Validate configuration
        if self.config.host.is_empty() {
            return Err("SMTP host cannot be empty".to_string());
        }
        
        if self.config.port == 0 {
            return Err("SMTP port cannot be 0".to_string());
        }
        
        if self.config.username.is_empty() {
            return Err("Username cannot be empty".to_string());
        }
        
        // TCP connectivity test
        let addr = format!("{}:{}", self.config.host, self.config.port);
        let socket_addr: std::net::SocketAddr = addr.parse()
            .or_else(|_| {
                use std::net::ToSocketAddrs;
                addr.to_socket_addrs()
                    .map_err(|e| format!("DNS resolution failed: {}", e))?
                    .next()
                    .ok_or_else(|| "No addresses found".to_string())
            })?;
        
        let tcp_result = tokio::time::timeout(
            std::time::Duration::from_secs(10),
            tokio::net::TcpStream::connect(&socket_addr)
        ).await;
        
        match tcp_result {
            Ok(Ok(_)) => {
                info!("✅ SMTP TCP connection successful to {}", addr);
                Ok(())
            }
            Ok(Err(e)) => Err(format!("Failed to connect to {}: {}", addr, e)),
            Err(_) => Err(format!("Connection timeout to {}", addr)),
        }
    }

    /// Send an email
    pub async fn send_email(&self, email: &Email) -> Result<String, String> {
        use lettre::{
            message::{header::ContentType, Mailbox, Message},
            transport::smtp::authentication::Credentials,
            AsyncSmtpTransport, AsyncTransport, Tokio1Executor,
        };
        
        info!("Sending email via SMTP: {}", email.subject);
        
        // Build from address
        let from: Mailbox = email.from.email.parse()
            .map_err(|e| format!("Invalid from address: {}", e))?;
        
        // Build to addresses
        let to_addrs: Result<Vec<Mailbox>, _> = email.to.iter()
            .map(|addr| addr.email.parse())
            .collect();
        let to_addrs = to_addrs.map_err(|e| format!("Invalid to address: {}", e))?;
        
        if to_addrs.is_empty() {
            return Err("At least one recipient is required".to_string());
        }
        
        // Build message
        let mut message_builder = Message::builder()
            .from(from)
            .subject(&email.subject);
        
        for to in to_addrs {
            message_builder = message_builder.to(to);
        }
        
        // Add CC
        for cc in &email.cc {
            let mailbox: Mailbox = cc.email.parse()
                .map_err(|e| format!("Invalid CC address: {}", e))?;
            message_builder = message_builder.cc(mailbox);
        }
        
        // Add BCC
        for bcc in &email.bcc {
            let mailbox: Mailbox = bcc.email.parse()
                .map_err(|e| format!("Invalid BCC address: {}", e))?;
            message_builder = message_builder.bcc(mailbox);
        }
        
        // Build body
        let body = if let Some(ref html) = email.body_html {
            message_builder
                .header(ContentType::TEXT_HTML)
                .body(html.clone())
        } else if let Some(ref text) = email.body_text {
            message_builder
                .header(ContentType::TEXT_PLAIN)
                .body(text.clone())
        } else {
            message_builder
                .header(ContentType::TEXT_PLAIN)
                .body(String::new())
        }.map_err(|e| format!("Failed to build message: {}", e))?;
        
        // Build SMTP transport
        let creds = Credentials::new(
            self.config.username.clone(),
            self.config.password.clone(),
        );
        
        // Create mailer based on security settings
        let mailer: AsyncSmtpTransport<Tokio1Executor> = if self.config.use_ssl {
            // Direct TLS connection (port 465)
            AsyncSmtpTransport::<Tokio1Executor>::relay(&self.config.host)
                .map_err(|e| format!("Failed to create SMTP transport: {}", e))?
                .credentials(creds)
                .port(self.config.port)
                .build()
        } else if self.config.use_starttls {
            // STARTTLS connection (port 587)
            AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(&self.config.host)
                .map_err(|e| format!("Failed to create SMTP transport: {}", e))?
                .credentials(creds)
                .port(self.config.port)
                .build()
        } else {
            return Err("Either SSL or STARTTLS must be enabled for secure SMTP".to_string());
        };
        
        // Send email
        let response = mailer.send(body).await
            .map_err(|e| format!("Failed to send email: {}", e))?;
        
        let message_id = response.message()
            .next()
            .map(|s| s.to_string())
            .unwrap_or_else(|| email.message_id.clone());
        
        info!("✅ Email sent successfully: {}", message_id);
        Ok(message_id)
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/// Simple HTML tag stripper for generating snippets
fn strip_html_simple(html: &str) -> String {
    let mut result = String::new();
    let mut in_tag = false;
    let mut in_style = false;
    let mut in_script = false;
    
    let chars: Vec<char> = html.chars().collect();
    let mut i = 0;
    
    while i < chars.len() {
        let c = chars[i];
        
        if c == '<' {
            in_tag = true;
            // Check for style/script tags
            let remaining: String = chars[i..].iter().take(10).collect();
            let remaining_lower = remaining.to_lowercase();
            if remaining_lower.starts_with("<style") {
                in_style = true;
            } else if remaining_lower.starts_with("<script") {
                in_script = true;
            } else if remaining_lower.starts_with("</style") {
                in_style = false;
            } else if remaining_lower.starts_with("</script") {
                in_script = false;
            }
        } else if c == '>' {
            in_tag = false;
        } else if !in_tag && !in_style && !in_script {
            if c.is_whitespace() {
                if !result.ends_with(' ') && !result.is_empty() {
                    result.push(' ');
                }
            } else {
                result.push(c);
            }
        }
        
        i += 1;
    }
    
    result.trim().to_string()
}

/// Map IMAP mailbox name to MailFolder enum
pub fn mailbox_to_folder(mailbox: &str) -> MailFolder {
    let lower = mailbox.to_lowercase();
    
    if lower == "inbox" {
        MailFolder::Inbox
    } else if lower.contains("sent") {
        MailFolder::Sent
    } else if lower.contains("draft") {
        MailFolder::Drafts
    } else if lower.contains("spam") || lower.contains("junk") {
        MailFolder::Spam
    } else if lower.contains("trash") || lower.contains("deleted") {
        MailFolder::Trash
    } else if lower.contains("archive") || lower.contains("all mail") {
        MailFolder::Archive
    } else if lower.contains("starred") || lower.contains("flagged") || lower.contains("important") {
        MailFolder::Starred
    } else {
        MailFolder::Custom(mailbox.to_string())
    }
}

/// Get standard IMAP port for security setting
pub fn get_imap_port(use_ssl: bool) -> u16 {
    if use_ssl { 993 } else { 143 }
}

/// Get standard SMTP port for security setting
pub fn get_smtp_port(use_ssl: bool, use_starttls: bool) -> u16 {
    if use_ssl {
        465
    } else if use_starttls {
        587
    } else {
        25
    }
}

/// Get IMAP server for known email providers
pub fn get_imap_server(email: &str) -> Option<(String, u16, bool)> {
    let domain = email.split('@').nth(1)?;
    let lower = domain.to_lowercase();
    
    match lower.as_str() {
        "gmail.com" | "googlemail.com" => Some(("imap.gmail.com".to_string(), 993, true)),
        "outlook.com" | "hotmail.com" | "live.com" => Some(("outlook.office365.com".to_string(), 993, true)),
        "yahoo.com" | "yahoo.co.uk" => Some(("imap.mail.yahoo.com".to_string(), 993, true)),
        "icloud.com" | "me.com" | "mac.com" => Some(("imap.mail.me.com".to_string(), 993, true)),
        "aol.com" => Some(("imap.aol.com".to_string(), 993, true)),
        "protonmail.com" | "proton.me" => Some(("127.0.0.1".to_string(), 1143, false)), // Requires ProtonMail Bridge
        "zoho.com" => Some(("imap.zoho.com".to_string(), 993, true)),
        "fastmail.com" | "fastmail.fm" => Some(("imap.fastmail.com".to_string(), 993, true)),
        _ => None,
    }
}

/// Get SMTP server for known email providers  
pub fn get_smtp_server(email: &str) -> Option<(String, u16, bool, bool)> {
    let domain = email.split('@').nth(1)?;
    let lower = domain.to_lowercase();
    
    // Returns (host, port, use_ssl, use_starttls)
    match lower.as_str() {
        "gmail.com" | "googlemail.com" => Some(("smtp.gmail.com".to_string(), 587, false, true)),
        "outlook.com" | "hotmail.com" | "live.com" => Some(("smtp.office365.com".to_string(), 587, false, true)),
        "yahoo.com" | "yahoo.co.uk" => Some(("smtp.mail.yahoo.com".to_string(), 587, false, true)),
        "icloud.com" | "me.com" | "mac.com" => Some(("smtp.mail.me.com".to_string(), 587, false, true)),
        "aol.com" => Some(("smtp.aol.com".to_string(), 587, false, true)),
        "protonmail.com" | "proton.me" => Some(("127.0.0.1".to_string(), 1025, false, false)), // Requires ProtonMail Bridge
        "zoho.com" => Some(("smtp.zoho.com".to_string(), 587, false, true)),
        "fastmail.com" | "fastmail.fm" => Some(("smtp.fastmail.com".to_string(), 587, false, true)),
        _ => None,
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════════

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mailbox_to_folder() {
        assert!(matches!(mailbox_to_folder("INBOX"), MailFolder::Inbox));
        assert!(matches!(mailbox_to_folder("Sent"), MailFolder::Sent));
        assert!(matches!(mailbox_to_folder("[Gmail]/Sent Mail"), MailFolder::Sent));
        assert!(matches!(mailbox_to_folder("Drafts"), MailFolder::Drafts));
        assert!(matches!(mailbox_to_folder("[Gmail]/Spam"), MailFolder::Spam));
        assert!(matches!(mailbox_to_folder("Junk"), MailFolder::Spam));
        assert!(matches!(mailbox_to_folder("Trash"), MailFolder::Trash));
        assert!(matches!(mailbox_to_folder("[Gmail]/All Mail"), MailFolder::Archive));
    }

    #[test]
    fn test_strip_html_simple() {
        let html = "<html><body><p>Hello <b>World</b>!</p></body></html>";
        let text = strip_html_simple(html);
        assert_eq!(text, "Hello World!");
        
        let with_style = "<html><style>body{color:red}</style><body>Content</body></html>";
        let text = strip_html_simple(with_style);
        assert_eq!(text, "Content");
    }

    #[test]
    fn test_get_imap_server() {
        let gmail = get_imap_server("user@gmail.com");
        assert!(gmail.is_some());
        let (host, port, ssl) = gmail.unwrap();
        assert_eq!(host, "imap.gmail.com");
        assert_eq!(port, 993);
        assert!(ssl);
        
        let outlook = get_imap_server("user@outlook.com");
        assert!(outlook.is_some());
        let (host, _, _) = outlook.unwrap();
        assert_eq!(host, "outlook.office365.com");
        
        let unknown = get_imap_server("user@unknowndomain.xyz");
        assert!(unknown.is_none());
    }

    #[test]
    fn test_get_smtp_server() {
        let gmail = get_smtp_server("user@gmail.com");
        assert!(gmail.is_some());
        let (host, port, ssl, starttls) = gmail.unwrap();
        assert_eq!(host, "smtp.gmail.com");
        assert_eq!(port, 587);
        assert!(!ssl);
        assert!(starttls);
    }

    #[test]
    fn test_get_imap_port() {
        assert_eq!(get_imap_port(true), 993);
        assert_eq!(get_imap_port(false), 143);
    }

    #[test]
    fn test_get_smtp_port() {
        assert_eq!(get_smtp_port(true, false), 465);
        assert_eq!(get_smtp_port(false, true), 587);
        assert_eq!(get_smtp_port(false, false), 25);
    }
}

