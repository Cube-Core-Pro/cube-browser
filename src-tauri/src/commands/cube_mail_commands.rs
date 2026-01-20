// ═══════════════════════════════════════════════════════════════════════════════
// CUBE MAIL COMMANDS - Tauri Command Interface
// ═══════════════════════════════════════════════════════════════════════════════
//
// Exposes CUBE Mail functionality to the frontend via Tauri commands.
// All commands follow the pattern:
// - Input validation
// - Business logic delegation to service
// - Error handling with meaningful messages
//
// ═══════════════════════════════════════════════════════════════════════════════

use tauri::State;
use serde::{Deserialize, Serialize};
use log::{info, error};

use crate::services::cube_mail_service::{
    CubeMailServiceState,
    MailAccount,
    MailProvider,
    MailFolder,
    Email,
    MailLabel,
    ComposeDraft,
    EmailAddress,
    EmailAttachment,
    ScreenerConfig,
    ScreenerDecision,
    ScreenerSender,
    MailSearchQuery,
    SyncStatus,
    ImapConfig,
    SmtpConfig,
};

// ═══════════════════════════════════════════════════════════════════════════════
// ACCOUNT COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

/// Add a new email account
#[tauri::command]
pub async fn cube_mail_add_account(
    state: State<'_, CubeMailServiceState>,
    email: String,
    name: String,
    provider: String,
    imap_host: String,
    imap_port: u16,
    smtp_host: String,
    smtp_port: u16,
    username: String,
    password: String,
) -> Result<MailAccount, String> {
    info!("📬 Adding email account: {}", email);
    
    // Parse provider
    let provider_enum = match provider.to_lowercase().as_str() {
        "gmail" => MailProvider::Gmail,
        "outlook" | "hotmail" => MailProvider::Outlook,
        "yahoo" => MailProvider::Yahoo,
        "icloud" => MailProvider::Icloud,
        "protonmail" => MailProvider::Protonmail,
        "cubemail" => MailProvider::CubeMail,
        _ => MailProvider::Custom,
    };
    
    // Create account
    let mut account = MailAccount::new(email.clone(), name, provider_enum);
    
    // Configure IMAP
    account.imap = ImapConfig {
        host: imap_host,
        port: imap_port,
        use_ssl: imap_port == 993,
        use_starttls: imap_port != 993,
        username: username.clone(),
        password: password.clone(),
        oauth2_token: None,
        oauth2_refresh_token: None,
        oauth2_expires_at: None,
    };
    
    // Configure SMTP
    account.smtp = SmtpConfig {
        host: smtp_host,
        port: smtp_port,
        use_ssl: smtp_port == 465,
        use_starttls: smtp_port != 465,
        username,
        password,
        oauth2_token: None,
    };
    
    state.add_account(account).await
}

/// Add account with OAuth2
#[tauri::command]
pub async fn cube_mail_add_account_oauth(
    state: State<'_, CubeMailServiceState>,
    email: String,
    name: String,
    provider: String,
    access_token: String,
    refresh_token: Option<String>,
) -> Result<MailAccount, String> {
    info!("📬 Adding OAuth account: {} ({})", email, provider);
    
    let provider_enum = match provider.to_lowercase().as_str() {
        "gmail" => MailProvider::Gmail,
        "outlook" | "hotmail" => MailProvider::Outlook,
        _ => return Err(format!("OAuth not supported for provider: {}", provider)),
    };
    
    let mut account = MailAccount::new(email.clone(), name, provider_enum.clone());
    
    // Set OAuth2 tokens
    match provider_enum {
        MailProvider::Gmail => {
            account.imap = ImapConfig {
                host: "imap.gmail.com".to_string(),
                port: 993,
                use_ssl: true,
                use_starttls: false,
                username: email.clone(),
                password: String::new(),
                oauth2_token: Some(access_token.clone()),
                oauth2_refresh_token: refresh_token.clone(),
                oauth2_expires_at: None,
            };
            account.smtp = SmtpConfig {
                host: "smtp.gmail.com".to_string(),
                port: 587,
                use_ssl: false,
                use_starttls: true,
                username: email,
                password: String::new(),
                oauth2_token: Some(access_token),
            };
        }
        MailProvider::Outlook => {
            account.imap = ImapConfig {
                host: "outlook.office365.com".to_string(),
                port: 993,
                use_ssl: true,
                use_starttls: false,
                username: email.clone(),
                password: String::new(),
                oauth2_token: Some(access_token.clone()),
                oauth2_refresh_token: refresh_token.clone(),
                oauth2_expires_at: None,
            };
            account.smtp = SmtpConfig {
                host: "smtp.office365.com".to_string(),
                port: 587,
                use_ssl: false,
                use_starttls: true,
                username: email,
                password: String::new(),
                oauth2_token: Some(access_token),
            };
        }
        _ => {}
    }
    
    state.add_account(account).await
}

/// Get all email accounts
#[tauri::command]
pub async fn cube_mail_get_accounts(
    state: State<'_, CubeMailServiceState>,
) -> Result<Vec<MailAccount>, String> {
    Ok(state.get_accounts().await)
}

/// Get single account by ID
#[tauri::command]
pub async fn cube_mail_get_account(
    state: State<'_, CubeMailServiceState>,
    account_id: String,
) -> Result<Option<MailAccount>, String> {
    Ok(state.get_account(&account_id).await)
}

/// Remove email account
#[tauri::command]
pub async fn cube_mail_remove_account(
    state: State<'_, CubeMailServiceState>,
    account_id: String,
) -> Result<(), String> {
    info!("📬 Removing email account: {}", account_id);
    state.remove_account(&account_id).await
}

/// Test account connection
#[tauri::command]
pub async fn cube_mail_test_connection(
    state: State<'_, CubeMailServiceState>,
    account_id: String,
) -> Result<(), String> {
    let account = state.get_account(&account_id).await
        .ok_or_else(|| format!("Account {} not found", account_id))?;
    
    state.test_connection(&account).await
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

/// Fetch emails from a folder
#[tauri::command]
pub async fn cube_mail_fetch_emails(
    state: State<'_, CubeMailServiceState>,
    account_id: String,
    folder: String,
    limit: Option<u32>,
    offset: Option<u32>,
) -> Result<Vec<Email>, String> {
    let folder_enum = parse_folder(&folder);
    
    let query = MailSearchQuery {
        limit: limit.unwrap_or(50),
        offset: offset.unwrap_or(0),
        ..Default::default()
    };
    
    state.fetch_emails(&account_id, folder_enum, query).await
}

/// Get single email by ID
#[tauri::command]
pub async fn cube_mail_get_email(
    state: State<'_, CubeMailServiceState>,
    account_id: String,
    email_id: String,
) -> Result<Option<Email>, String> {
    Ok(state.get_email(&account_id, &email_id).await)
}

/// Mark emails as read/unread
#[tauri::command]
pub async fn cube_mail_mark_as_read(
    state: State<'_, CubeMailServiceState>,
    account_id: String,
    email_ids: Vec<String>,
    is_read: bool,
) -> Result<(), String> {
    state.mark_as_read(&account_id, email_ids, is_read).await
}

/// Set starred status
#[tauri::command]
pub async fn cube_mail_set_starred(
    state: State<'_, CubeMailServiceState>,
    account_id: String,
    email_ids: Vec<String>,
    is_starred: bool,
) -> Result<(), String> {
    state.set_starred(&account_id, email_ids, is_starred).await
}

/// Move emails to folder
#[tauri::command]
pub async fn cube_mail_move_to_folder(
    state: State<'_, CubeMailServiceState>,
    account_id: String,
    email_ids: Vec<String>,
    folder: String,
) -> Result<(), String> {
    let folder_enum = parse_folder(&folder);
    state.move_to_folder(&account_id, email_ids, folder_enum).await
}

/// Archive emails
#[tauri::command]
pub async fn cube_mail_archive_emails(
    state: State<'_, CubeMailServiceState>,
    account_id: String,
    email_ids: Vec<String>,
) -> Result<(), String> {
    state.archive_emails(&account_id, email_ids).await
}

/// Delete emails
#[tauri::command]
pub async fn cube_mail_delete_emails(
    state: State<'_, CubeMailServiceState>,
    account_id: String,
    email_ids: Vec<String>,
    permanent: bool,
) -> Result<(), String> {
    state.delete_emails(&account_id, email_ids, permanent).await
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSE & SEND COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

/// Send email
#[tauri::command]
pub async fn cube_mail_send_email(
    state: State<'_, CubeMailServiceState>,
    account_id: String,
    to: Vec<EmailAddressInput>,
    cc: Option<Vec<EmailAddressInput>>,
    bcc: Option<Vec<EmailAddressInput>>,
    subject: String,
    body: String,
    body_format: Option<String>,
    attachments: Option<Vec<AttachmentInput>>,
    encryption_enabled: Option<bool>,
    in_reply_to: Option<String>,
) -> Result<Email, String> {
    info!("📬 Sending email from account: {}", account_id);
    
    let draft = ComposeDraft {
        id: uuid::Uuid::new_v4().to_string(),
        account_id,
        to: to.into_iter().map(|a| a.into()).collect(),
        cc: cc.unwrap_or_default().into_iter().map(|a| a.into()).collect(),
        bcc: bcc.unwrap_or_default().into_iter().map(|a| a.into()).collect(),
        subject,
        body,
        body_format: body_format.unwrap_or_else(|| "html".to_string()),
        attachments: attachments.unwrap_or_default().into_iter().map(|a| a.into()).collect(),
        in_reply_to,
        references: Vec::new(),
        encryption_enabled: encryption_enabled.unwrap_or(false),
        read_receipt: false,
        scheduled_send: None,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    
    state.send_email(draft).await
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCREENER COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

/// Get screener configuration
#[tauri::command]
pub async fn cube_mail_get_screener_config(
    state: State<'_, CubeMailServiceState>,
    account_id: String,
) -> Result<Option<ScreenerConfig>, String> {
    Ok(state.get_screener_config(&account_id).await)
}

/// Update screener configuration
#[tauri::command]
pub async fn cube_mail_update_screener_config(
    state: State<'_, CubeMailServiceState>,
    account_id: String,
    config: ScreenerConfig,
) -> Result<(), String> {
    state.update_screener_config(&account_id, config).await
}

/// Get pending screener senders
#[tauri::command]
pub async fn cube_mail_get_screener_pending(
    state: State<'_, CubeMailServiceState>,
    account_id: String,
) -> Result<Vec<ScreenerSender>, String> {
    Ok(state.get_screener_pending(&account_id).await)
}

/// Process screener decision
#[tauri::command]
pub async fn cube_mail_screener_decision(
    state: State<'_, CubeMailServiceState>,
    account_id: String,
    sender_id: String,
    decision: String,
    move_existing: String,
) -> Result<(), String> {
    info!("📬 Processing screener decision: {} -> {}", sender_id, decision);
    
    let screener_decision = ScreenerDecision {
        sender_id,
        decision,
        move_existing,
        timestamp: chrono::Utc::now(),
    };
    
    state.screener_decision(&account_id, screener_decision).await
}

// ═══════════════════════════════════════════════════════════════════════════════
// LABELS COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

/// Get labels for account
#[tauri::command]
pub async fn cube_mail_get_labels(
    state: State<'_, CubeMailServiceState>,
    account_id: String,
) -> Result<Vec<MailLabel>, String> {
    Ok(state.get_labels(&account_id).await)
}

/// Create label
#[tauri::command]
pub async fn cube_mail_create_label(
    state: State<'_, CubeMailServiceState>,
    account_id: String,
    name: String,
    color: String,
) -> Result<MailLabel, String> {
    state.create_label(&account_id, name, color).await
}

/// Apply labels to emails
#[tauri::command]
pub async fn cube_mail_apply_labels(
    state: State<'_, CubeMailServiceState>,
    account_id: String,
    email_ids: Vec<String>,
    label_ids: Vec<String>,
) -> Result<(), String> {
    state.apply_labels(&account_id, email_ids, label_ids).await
}

// ═══════════════════════════════════════════════════════════════════════════════
// SYNC COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

/// Sync account
#[tauri::command]
pub async fn cube_mail_sync_account(
    state: State<'_, CubeMailServiceState>,
    account_id: String,
) -> Result<SyncStatus, String> {
    info!("📬 Syncing account: {}", account_id);
    state.sync_account(&account_id).await
}

/// Get sync status
#[tauri::command]
pub async fn cube_mail_get_sync_status(
    state: State<'_, CubeMailServiceState>,
    account_id: String,
) -> Result<Option<SyncStatus>, String> {
    Ok(state.get_sync_status(&account_id).await)
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEARCH COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

/// Search emails
#[tauri::command]
pub async fn cube_mail_search_emails(
    state: State<'_, CubeMailServiceState>,
    account_id: String,
    query: Option<String>,
    from: Option<String>,
    to: Option<String>,
    subject: Option<String>,
    folder: Option<String>,
    has_attachment: Option<bool>,
    is_unread: Option<bool>,
    is_starred: Option<bool>,
    date_from: Option<String>,
    date_to: Option<String>,
    limit: Option<u32>,
    offset: Option<u32>,
) -> Result<Vec<Email>, String> {
    let search_query = MailSearchQuery {
        query,
        from,
        to,
        subject,
        folder: folder.map(|f| parse_folder(&f)),
        has_attachment,
        is_unread,
        is_starred,
        category: None,
        labels: None,
        date_from: date_from.and_then(|d| chrono::DateTime::parse_from_rfc3339(&d).ok().map(|dt| dt.with_timezone(&chrono::Utc))),
        date_to: date_to.and_then(|d| chrono::DateTime::parse_from_rfc3339(&d).ok().map(|dt| dt.with_timezone(&chrono::Utc))),
        limit: limit.unwrap_or(50),
        offset: offset.unwrap_or(0),
    };
    
    state.search_emails(&account_id, search_query).await
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

/// Get AI suggestions for email reply
#[tauri::command]
pub async fn cube_mail_ai_suggest_reply(
    state: State<'_, CubeMailServiceState>,
    account_id: String,
    email_id: String,
) -> Result<Vec<String>, String> {
    let email = state.get_email(&account_id, &email_id).await
        .ok_or_else(|| format!("Email {} not found", email_id))?;
    
    Ok(state.ai_suggest_reply(&email).await)
}

/// Get AI summary of email
#[tauri::command]
pub async fn cube_mail_ai_summarize(
    state: State<'_, CubeMailServiceState>,
    account_id: String,
    email_id: String,
) -> Result<String, String> {
    let email = state.get_email(&account_id, &email_id).await
        .ok_or_else(|| format!("Email {} not found", email_id))?;
    
    Ok(state.ai_summarize(&email).await)
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

fn parse_folder(folder: &str) -> MailFolder {
    match folder.to_lowercase().as_str() {
        "inbox" => MailFolder::Inbox,
        "sent" => MailFolder::Sent,
        "drafts" => MailFolder::Drafts,
        "starred" => MailFolder::Starred,
        "archive" => MailFolder::Archive,
        "spam" => MailFolder::Spam,
        "trash" => MailFolder::Trash,
        "screener" => MailFolder::Screener,
        _ => MailFolder::Custom(folder.to_string()),
    }
}

// Input types for command parameters
#[derive(Debug, Clone, Deserialize)]
pub struct EmailAddressInput {
    pub email: String,
    pub name: Option<String>,
}

impl From<EmailAddressInput> for EmailAddress {
    fn from(input: EmailAddressInput) -> Self {
        EmailAddress {
            email: input.email,
            name: input.name,
            avatar: None,
            is_verified: false,
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
pub struct AttachmentInput {
    pub filename: String,
    pub mime_type: String,
    pub content: String, // Base64 encoded
    pub size: u64,
}

impl From<AttachmentInput> for EmailAttachment {
    fn from(input: AttachmentInput) -> Self {
        EmailAttachment {
            id: uuid::Uuid::new_v4().to_string(),
            filename: input.filename,
            mime_type: input.mime_type,
            size: input.size,
            content_id: None,
            is_inline: false,
            encrypted: false,
            download_url: None,
            local_path: None,
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OAUTH2 COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

use crate::services::oauth2_service::{OAuth2ServiceState, OAuth2Config, OAuth2Tokens, UserInfo};

/// Register OAuth2 provider configuration
#[tauri::command]
pub async fn cube_mail_oauth2_register(
    oauth2_state: State<'_, OAuth2ServiceState>,
    provider: String,
    client_id: String,
    client_secret: String,
    redirect_uri: String,
) -> Result<(), String> {
    info!("🔐 Registering OAuth2 config for provider: {}", provider);
    
    let config = match provider.to_lowercase().as_str() {
        "google" | "gmail" => OAuth2Config::google(client_id, client_secret, redirect_uri),
        "microsoft" | "outlook" | "hotmail" => OAuth2Config::microsoft(client_id, client_secret, redirect_uri),
        "yahoo" => OAuth2Config::yahoo(client_id, client_secret, redirect_uri),
        _ => return Err(format!("Unsupported OAuth2 provider: {}", provider)),
    };
    
    oauth2_state.register_config(&provider.to_lowercase(), config).await;
    Ok(())
}

/// Generate OAuth2 authorization URL
#[tauri::command]
pub async fn cube_mail_oauth2_get_auth_url(
    oauth2_state: State<'_, OAuth2ServiceState>,
    provider: String,
) -> Result<OAuth2AuthUrlResponse, String> {
    info!("🔐 Generating OAuth2 auth URL for provider: {}", provider);
    
    let (url, state) = oauth2_state.generate_auth_url(&provider.to_lowercase()).await?;
    
    Ok(OAuth2AuthUrlResponse {
        authorization_url: url,
        state,
    })
}

#[derive(Debug, Serialize)]
pub struct OAuth2AuthUrlResponse {
    pub authorization_url: String,
    pub state: String,
}

/// Exchange authorization code for tokens
#[tauri::command]
pub async fn cube_mail_oauth2_exchange_code(
    oauth2_state: State<'_, OAuth2ServiceState>,
    provider: String,
    code: String,
    state: String,
) -> Result<OAuth2TokensResponse, String> {
    info!("🔐 Exchanging OAuth2 code for tokens: {}", provider);
    
    let tokens = oauth2_state.exchange_code(&provider.to_lowercase(), &code, &state).await?;
    
    // Parse user info if ID token is present
    let user_info = if let Some(ref id_token) = tokens.id_token {
        oauth2_state.parse_id_token(id_token).await.ok()
    } else {
        None
    };
    
    Ok(OAuth2TokensResponse {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
        user_email: user_info.as_ref().and_then(|u| u.email.clone()),
        user_name: user_info.as_ref().and_then(|u| u.name.clone()),
    })
}

#[derive(Debug, Serialize)]
pub struct OAuth2TokensResponse {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_in: Option<i64>,
    pub user_email: Option<String>,
    pub user_name: Option<String>,
}

/// Refresh OAuth2 tokens
#[tauri::command]
pub async fn cube_mail_oauth2_refresh(
    oauth2_state: State<'_, OAuth2ServiceState>,
    provider: String,
    refresh_token: String,
) -> Result<OAuth2TokensResponse, String> {
    info!("🔐 Refreshing OAuth2 tokens for provider: {}", provider);
    
    let tokens = oauth2_state.refresh_tokens(&provider.to_lowercase(), &refresh_token).await?;
    
    Ok(OAuth2TokensResponse {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
        user_email: None,
        user_name: None,
    })
}

/// Add email account with OAuth2 tokens (complete flow)
#[tauri::command]
pub async fn cube_mail_add_account_with_oauth(
    mail_state: State<'_, CubeMailServiceState>,
    email: String,
    name: String,
    provider: String,
    access_token: String,
    refresh_token: Option<String>,
) -> Result<MailAccount, String> {
    info!("📬 Adding OAuth2 email account: {}", email);
    
    // Parse provider and get server settings
    let (provider_enum, imap_host, imap_port, smtp_host, smtp_port) = match provider.to_lowercase().as_str() {
        "google" | "gmail" => (
            MailProvider::Gmail,
            "imap.gmail.com".to_string(), 993,
            "smtp.gmail.com".to_string(), 587,
        ),
        "microsoft" | "outlook" | "hotmail" => (
            MailProvider::Outlook,
            "outlook.office365.com".to_string(), 993,
            "smtp.office365.com".to_string(), 587,
        ),
        "yahoo" => (
            MailProvider::Yahoo,
            "imap.mail.yahoo.com".to_string(), 993,
            "smtp.mail.yahoo.com".to_string(), 587,
        ),
        _ => return Err(format!("Unsupported OAuth2 provider for email: {}", provider)),
    };
    
    // Create account
    let mut account = MailAccount::new(email.clone(), name, provider_enum);
    
    // Configure IMAP with OAuth2
    account.imap = ImapConfig {
        host: imap_host,
        port: imap_port,
        use_ssl: true,
        use_starttls: false,
        username: email.clone(),
        password: String::new(), // Not used with OAuth2
        oauth2_token: Some(access_token.clone()),
        oauth2_refresh_token: refresh_token.clone(),
        oauth2_expires_at: None, // Should be set based on token response
    };
    
    // Configure SMTP with OAuth2
    account.smtp = SmtpConfig {
        host: smtp_host,
        port: smtp_port,
        use_ssl: false,
        use_starttls: true,
        username: email,
        password: String::new(),
        oauth2_token: Some(access_token),
    };
    
    mail_state.add_account(account).await
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATABASE SEARCH COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

/// Full-text search response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResultsResponse {
    pub emails: Vec<Email>,
    pub total_count: u32,
    pub page: u32,
    pub page_size: u32,
    pub has_more: bool,
}

/// Search emails using FTS5 full-text search
#[tauri::command]
pub async fn cube_mail_search_fts(
    state: State<'_, CubeMailServiceState>,
    account_id: String,
    query: String,
    folder: Option<String>,
    page: Option<u32>,
    page_size: Option<u32>,
) -> Result<SearchResultsResponse, String> {
    info!("📬 FTS Search: '{}' in account {}", query, account_id);
    
    let page = page.unwrap_or(1);
    let page_size = page_size.unwrap_or(50);
    let offset = (page - 1) * page_size;
    
    // Parse folder if provided
    let folder_enum = folder.map(|f| match f.to_lowercase().as_str() {
        "inbox" => MailFolder::Inbox,
        "sent" => MailFolder::Sent,
        "drafts" => MailFolder::Drafts,
        "starred" => MailFolder::Starred,
        "archive" => MailFolder::Archive,
        "spam" => MailFolder::Spam,
        "trash" => MailFolder::Trash,
        "screener" => MailFolder::Screener,
        _ => MailFolder::Custom(f),
    });
    
    // Use the service's search with proper MailSearchQuery
    let search_query = MailSearchQuery {
        query: Some(query),
        from: None,
        to: None,
        subject: None,
        folder: folder_enum,
        has_attachment: None,
        is_unread: None,
        is_starred: None,
        category: None,
        labels: None,
        date_from: None,
        date_to: None,
        limit: page_size,
        offset,
    };
    
    let emails = state.search_emails(&account_id, search_query).await
        .map_err(|e| format!("Search failed: {}", e))?;
    
    let total_count = emails.len() as u32;
    
    Ok(SearchResultsResponse {
        emails,
        total_count,
        page,
        page_size,
        has_more: total_count == page_size,
    })
}

/// Advanced search with multiple filters
#[tauri::command]
pub async fn cube_mail_search_advanced(
    state: State<'_, CubeMailServiceState>,
    account_id: String,
    from: Option<String>,
    to: Option<String>,
    subject: Option<String>,
    body: Option<String>,
    has_attachment: Option<bool>,
    is_unread: Option<bool>,
    date_from: Option<String>,
    date_to: Option<String>,
    labels: Option<Vec<String>>,
    folder: Option<String>,
    page: Option<u32>,
    page_size: Option<u32>,
) -> Result<SearchResultsResponse, String> {
    info!("📬 Advanced Search in account {}", account_id);
    
    let page = page.unwrap_or(1);
    let page_size = page_size.unwrap_or(50);
    let offset = (page - 1) * page_size;
    
    // Parse folder if provided
    let folder_enum = folder.map(|f| match f.to_lowercase().as_str() {
        "inbox" => MailFolder::Inbox,
        "sent" => MailFolder::Sent,
        "drafts" => MailFolder::Drafts,
        "starred" => MailFolder::Starred,
        "archive" => MailFolder::Archive,
        "spam" => MailFolder::Spam,
        "trash" => MailFolder::Trash,
        "screener" => MailFolder::Screener,
        _ => MailFolder::Custom(f),
    });
    
    // Parse dates
    let date_from_parsed = date_from.and_then(|d| {
        chrono::DateTime::parse_from_rfc3339(&d)
            .ok()
            .map(|dt| dt.with_timezone(&chrono::Utc))
    });
    
    let date_to_parsed = date_to.and_then(|d| {
        chrono::DateTime::parse_from_rfc3339(&d)
            .ok()
            .map(|dt| dt.with_timezone(&chrono::Utc))
    });
    
    let search_query = MailSearchQuery {
        query: body,
        from,
        to,
        subject,
        folder: folder_enum,
        has_attachment,
        is_unread,
        is_starred: None,
        category: None,
        labels,
        date_from: date_from_parsed,
        date_to: date_to_parsed,
        limit: page_size,
        offset,
    };
    
    let emails = state.search_emails(&account_id, search_query).await
        .map_err(|e| format!("Search failed: {}", e))?;
    
    let total_count = emails.len() as u32;
    
    Ok(SearchResultsResponse {
        emails,
        total_count,
        page,
        page_size,
        has_more: total_count == page_size,
    })
}

/// Get email statistics for an account
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MailStatistics {
    pub total_emails: u32,
    pub unread_count: u32,
    pub starred_count: u32,
    pub inbox_count: u32,
    pub sent_count: u32,
    pub drafts_count: u32,
    pub spam_count: u32,
    pub trash_count: u32,
    pub archive_count: u32,
    pub screener_count: u32,
    pub storage_used_bytes: u64,
}

#[tauri::command]
pub async fn cube_mail_get_statistics(
    state: State<'_, CubeMailServiceState>,
    account_id: String,
) -> Result<MailStatistics, String> {
    info!("📬 Getting statistics for account {}", account_id);
    
    // Helper function to count emails by folder
    async fn count_folder(state: &CubeMailServiceState, account_id: &str, folder: MailFolder) -> u32 {
        let query = MailSearchQuery {
            folder: Some(folder),
            limit: 10000,
            ..Default::default()
        };
        state.search_emails(account_id, query).await
            .map(|e| e.len() as u32)
            .unwrap_or(0)
    }
    
    let inbox = count_folder(&state, &account_id, MailFolder::Inbox).await;
    let sent = count_folder(&state, &account_id, MailFolder::Sent).await;
    let drafts = count_folder(&state, &account_id, MailFolder::Drafts).await;
    let spam = count_folder(&state, &account_id, MailFolder::Spam).await;
    let trash = count_folder(&state, &account_id, MailFolder::Trash).await;
    let archive = count_folder(&state, &account_id, MailFolder::Archive).await;
    let starred = count_folder(&state, &account_id, MailFolder::Starred).await;
    let screener = count_folder(&state, &account_id, MailFolder::Screener).await;
    
    // Calculate totals
    let total = inbox + sent + drafts + spam + trash + archive + screener;
    
    // Get account storage info
    let account = state.get_account(&account_id).await;
    let storage = account.map(|a| a.storage_used).unwrap_or(0);
    
    Ok(MailStatistics {
        total_emails: total,
        unread_count: 0, // Would need proper count
        starred_count: starred,
        inbox_count: inbox,
        sent_count: sent,
        drafts_count: drafts,
        spam_count: spam,
        trash_count: trash,
        archive_count: archive,
        screener_count: screener,
        storage_used_bytes: storage,
    })
}

/// Batch mark emails as read/unread
#[tauri::command]
pub async fn cube_mail_batch_mark_read(
    state: State<'_, CubeMailServiceState>,
    account_id: String,
    email_ids: Vec<String>,
    is_read: bool,
) -> Result<u32, String> {
    info!("📬 Batch mark {} emails as read={}", email_ids.len(), is_read);
    
    let count = email_ids.len() as u32;
    
    // Use the service's mark_as_read which takes Vec<String>
    state.mark_as_read(&account_id, email_ids, is_read).await
        .map_err(|e| format!("Failed to mark emails: {}", e))?;
    
    Ok(count)
}

/// Batch move emails to folder
#[tauri::command]
pub async fn cube_mail_batch_move(
    state: State<'_, CubeMailServiceState>,
    account_id: String,
    email_ids: Vec<String>,
    folder: String,
) -> Result<u32, String> {
    info!("📬 Batch move {} emails to {}", email_ids.len(), folder);
    
    let folder_enum = match folder.to_lowercase().as_str() {
        "inbox" => MailFolder::Inbox,
        "sent" => MailFolder::Sent,
        "drafts" => MailFolder::Drafts,
        "starred" => MailFolder::Starred,
        "archive" => MailFolder::Archive,
        "spam" => MailFolder::Spam,
        "trash" => MailFolder::Trash,
        "screener" => MailFolder::Screener,
        _ => MailFolder::Custom(folder),
    };
    
    // Use the service's move_to_folder which takes account_id, email_ids, and folder
    state.move_to_folder(&account_id, email_ids.clone(), folder_enum).await
        .map_err(|e| format!("Failed to move emails: {}", e))?;
    
    Ok(email_ids.len() as u32)
}

/// Batch delete emails permanently
#[tauri::command]
pub async fn cube_mail_batch_delete(
    state: State<'_, CubeMailServiceState>,
    account_id: String,
    email_ids: Vec<String>,
    permanent: bool,
) -> Result<u32, String> {
    info!("📬 Batch delete {} emails (permanent={})", email_ids.len(), permanent);
    
    state.delete_emails(&account_id, email_ids.clone(), permanent).await
        .map_err(|e| format!("Failed to delete emails: {}", e))?;
    
    Ok(email_ids.len() as u32)
}

/// Batch add labels to emails
#[tauri::command]
pub async fn cube_mail_batch_add_labels(
    state: State<'_, CubeMailServiceState>,
    account_id: String,
    email_ids: Vec<String>,
    labels: Vec<String>,
) -> Result<u32, String> {
    info!("📬 Batch add {} labels to {} emails", labels.len(), email_ids.len());
    
    state.apply_labels(&account_id, email_ids.clone(), labels).await
        .map_err(|e| format!("Failed to add labels: {}", e))?;
    
    Ok(email_ids.len() as u32)
}

/// Batch remove labels from emails
#[tauri::command]
pub async fn cube_mail_batch_remove_labels(
    state: State<'_, CubeMailServiceState>,
    account_id: String,
    email_ids: Vec<String>,
    labels: Vec<String>,
) -> Result<u32, String> {
    info!("📬 Batch remove {} labels from {} emails", labels.len(), email_ids.len());
    
    state.remove_labels(&account_id, email_ids.clone(), labels).await
        .map_err(|e| format!("Failed to remove labels: {}", e))?;
    
    Ok(email_ids.len() as u32)
}
