// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL COMMANDS - Tauri Commands for Email Service
// ═══════════════════════════════════════════════════════════════════════════════
//
// Provides Tauri command wrappers for:
// - Email configuration (SMTP/SendGrid)
// - Sending emails (single and batch)
// - Connection testing
// - Rate limiting management
//
// ═══════════════════════════════════════════════════════════════════════════════

use serde::{Deserialize, Serialize};
use tauri::command;
use crate::services::email_service::{
    EmailServiceState, EmailConfig, EmailProvider, SmtpConfig, SendGridConfig,
    SmtpEncryption, EmailMessage, EmailRecipient, EmailAttachment,
    EmailSendResult, EmailBatchResult, EmailTestResult,
    send_email, send_batch_emails, test_email_connection, send_test_email,
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

#[command]
pub async fn email_get_config(
    state: tauri::State<'_, EmailServiceState>,
) -> Result<EmailConfig, String> {
    let config = state.config.read().await;
    
    // Return config without sensitive data
    let mut safe_config = config.clone();
    safe_config.smtp.password = if config.smtp.password.is_empty() {
        String::new()
    } else {
        "********".to_string()
    };
    safe_config.sendgrid.api_key = if config.sendgrid.api_key.is_empty() {
        String::new()
    } else {
        format!("{}********", &config.sendgrid.api_key[..8.min(config.sendgrid.api_key.len())])
    };
    
    Ok(safe_config)
}

#[command]
pub async fn email_set_active_provider(
    state: tauri::State<'_, EmailServiceState>,
    provider: String,
) -> Result<EmailConfig, String> {
    let mut config = state.config.write().await;
    
    config.active_provider = match provider.to_lowercase().as_str() {
        "smtp" => EmailProvider::SMTP,
        "sendgrid" => EmailProvider::SendGrid,
        "none" => EmailProvider::None,
        _ => return Err(format!("Invalid provider: {}. Use 'smtp', 'sendgrid', or 'none'", provider)),
    };
    
    let result = config.clone();
    Ok(result)
}

#[command]
pub async fn email_configure_smtp(
    state: tauri::State<'_, EmailServiceState>,
    host: String,
    port: u16,
    username: String,
    password: String,
    encryption: String,
    from_email: String,
    from_name: String,
    reply_to: Option<String>,
) -> Result<EmailConfig, String> {
    let mut config = state.config.write().await;
    
    let enc = match encryption.to_lowercase().as_str() {
        "tls" | "ssl" => SmtpEncryption::Tls,
        "starttls" => SmtpEncryption::StartTls,
        "none" => SmtpEncryption::None,
        _ => return Err(format!("Invalid encryption: {}. Use 'tls', 'starttls', or 'none'", encryption)),
    };
    
    config.smtp = SmtpConfig {
        host,
        port,
        username,
        password,
        encryption: enc,
        from_email: from_email.clone(),
        from_name: from_name.clone(),
        reply_to,
    };
    
    // Update defaults if not set
    if config.default_from_email.is_empty() {
        config.default_from_email = from_email;
    }
    if config.default_from_name.is_empty() {
        config.default_from_name = from_name;
    }
    
    let result = config.clone();
    Ok(result)
}

#[command]
pub async fn email_configure_sendgrid(
    state: tauri::State<'_, EmailServiceState>,
    api_key: String,
    from_email: String,
    from_name: String,
    reply_to: Option<String>,
    tracking_enabled: bool,
    sandbox_mode: bool,
) -> Result<EmailConfig, String> {
    let mut config = state.config.write().await;
    
    config.sendgrid = SendGridConfig {
        api_key,
        from_email: from_email.clone(),
        from_name: from_name.clone(),
        reply_to,
        tracking_enabled,
        sandbox_mode,
    };
    
    // Update defaults if not set
    if config.default_from_email.is_empty() {
        config.default_from_email = from_email;
    }
    if config.default_from_name.is_empty() {
        config.default_from_name = from_name;
    }
    
    let result = config.clone();
    Ok(result)
}

#[command]
pub async fn email_set_rate_limits(
    state: tauri::State<'_, EmailServiceState>,
    per_minute: u32,
    per_hour: u32,
) -> Result<EmailConfig, String> {
    let mut config = state.config.write().await;
    
    config.rate_limit_per_minute = per_minute;
    config.rate_limit_per_hour = per_hour;
    
    let result = config.clone();
    Ok(result)
}

#[command]
pub async fn email_set_retry_settings(
    state: tauri::State<'_, EmailServiceState>,
    attempts: u32,
    delay_seconds: u32,
) -> Result<EmailConfig, String> {
    let mut config = state.config.write().await;
    
    config.retry_attempts = attempts;
    config.retry_delay_seconds = delay_seconds;
    
    let result = config.clone();
    Ok(result)
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTING COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

#[command]
pub async fn email_test_connection(
    state: tauri::State<'_, EmailServiceState>,
    provider: Option<String>,
) -> Result<EmailTestResult, String> {
    let config = state.config.read().await;
    
    let test_provider = if let Some(p) = provider {
        match p.to_lowercase().as_str() {
            "smtp" => EmailProvider::SMTP,
            "sendgrid" => EmailProvider::SendGrid,
            _ => config.active_provider.clone(),
        }
    } else {
        config.active_provider.clone()
    };
    
    drop(config); // Release read lock
    
    test_email_connection(&state, test_provider).await
}

#[command]
pub async fn email_send_test(
    state: tauri::State<'_, EmailServiceState>,
    to_email: String,
) -> Result<EmailSendResult, String> {
    send_test_email(&state, to_email).await
}

// ═══════════════════════════════════════════════════════════════════════════════
// SENDING COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SendEmailParams {
    pub to: Vec<EmailRecipientInput>,
    pub cc: Option<Vec<EmailRecipientInput>>,
    pub bcc: Option<Vec<EmailRecipientInput>>,
    pub subject: String,
    pub html_content: String,
    pub text_content: Option<String>,
    pub from_email: Option<String>,
    pub from_name: Option<String>,
    pub reply_to: Option<String>,
    pub headers: Option<std::collections::HashMap<String, String>>,
    pub attachments: Option<Vec<AttachmentInput>>,
    pub template_variables: Option<std::collections::HashMap<String, String>>,
    pub tracking_id: Option<String>,
    pub campaign_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailRecipientInput {
    pub email: String,
    pub name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttachmentInput {
    pub filename: String,
    pub content: String,
    pub content_type: String,
}

impl From<EmailRecipientInput> for EmailRecipient {
    fn from(input: EmailRecipientInput) -> Self {
        EmailRecipient {
            email: input.email,
            name: input.name,
        }
    }
}

impl From<AttachmentInput> for EmailAttachment {
    fn from(input: AttachmentInput) -> Self {
        EmailAttachment {
            filename: input.filename,
            content: input.content,
            content_type: input.content_type,
        }
    }
}

#[command]
pub async fn email_send(
    state: tauri::State<'_, EmailServiceState>,
    params: SendEmailParams,
) -> Result<EmailSendResult, String> {
    let message = EmailMessage {
        to: params.to.into_iter().map(|r| r.into()).collect(),
        cc: params.cc.map(|v| v.into_iter().map(|r| r.into()).collect()),
        bcc: params.bcc.map(|v| v.into_iter().map(|r| r.into()).collect()),
        subject: params.subject,
        html_content: params.html_content,
        text_content: params.text_content,
        from_email: params.from_email,
        from_name: params.from_name,
        reply_to: params.reply_to,
        headers: params.headers,
        attachments: params.attachments.map(|v| v.into_iter().map(|a| a.into()).collect()),
        template_variables: params.template_variables,
        tracking_id: params.tracking_id,
        campaign_id: params.campaign_id,
    };
    
    send_email(&state, message).await
}

#[command]
pub async fn email_send_batch(
    state: tauri::State<'_, EmailServiceState>,
    emails: Vec<SendEmailParams>,
) -> Result<EmailBatchResult, String> {
    let messages: Vec<EmailMessage> = emails.into_iter().map(|params| {
        EmailMessage {
            to: params.to.into_iter().map(|r| r.into()).collect(),
            cc: params.cc.map(|v| v.into_iter().map(|r| r.into()).collect()),
            bcc: params.bcc.map(|v| v.into_iter().map(|r| r.into()).collect()),
            subject: params.subject,
            html_content: params.html_content,
            text_content: params.text_content,
            from_email: params.from_email,
            from_name: params.from_name,
            reply_to: params.reply_to,
            headers: params.headers,
            attachments: params.attachments.map(|v| v.into_iter().map(|a| a.into()).collect()),
            template_variables: params.template_variables,
            tracking_id: params.tracking_id,
            campaign_id: params.campaign_id,
        }
    }).collect();
    
    send_batch_emails(&state, messages).await
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIMPLE SEND COMMAND (for quick sending)
// ═══════════════════════════════════════════════════════════════════════════════

#[command]
pub async fn email_send_simple(
    state: tauri::State<'_, EmailServiceState>,
    to_email: String,
    to_name: Option<String>,
    subject: String,
    html_content: String,
    text_content: Option<String>,
) -> Result<EmailSendResult, String> {
    let message = EmailMessage {
        to: vec![EmailRecipient {
            email: to_email,
            name: to_name,
        }],
        cc: None,
        bcc: None,
        subject,
        html_content,
        text_content,
        from_email: None,
        from_name: None,
        reply_to: None,
        headers: None,
        attachments: None,
        template_variables: None,
        tracking_id: Some(format!("simple-{}", uuid::Uuid::new_v4())),
        campaign_id: None,
    };
    
    send_email(&state, message).await
}

// ═══════════════════════════════════════════════════════════════════════════════
// CAMPAIGN EMAIL COMMAND
// ═══════════════════════════════════════════════════════════════════════════════

#[command]
pub async fn email_send_campaign(
    state: tauri::State<'_, EmailServiceState>,
    campaign_id: String,
    recipients: Vec<EmailRecipientInput>,
    subject: String,
    html_content: String,
    text_content: Option<String>,
    from_email: Option<String>,
    from_name: Option<String>,
    template_variables: Option<std::collections::HashMap<String, String>>,
) -> Result<EmailBatchResult, String> {
    let messages: Vec<EmailMessage> = recipients.into_iter().map(|recipient| {
        // Each recipient gets their own message for personalization
        let mut vars = template_variables.clone().unwrap_or_default();
        if let Some(name) = &recipient.name {
            vars.insert("recipient_name".to_string(), name.clone());
            vars.insert("first_name".to_string(), name.split_whitespace().next().unwrap_or(name).to_string());
        }
        vars.insert("recipient_email".to_string(), recipient.email.clone());
        
        EmailMessage {
            to: vec![EmailRecipient {
                email: recipient.email,
                name: recipient.name,
            }],
            cc: None,
            bcc: None,
            subject: subject.clone(),
            html_content: html_content.clone(),
            text_content: text_content.clone(),
            from_email: from_email.clone(),
            from_name: from_name.clone(),
            reply_to: None,
            headers: None,
            attachments: None,
            template_variables: Some(vars),
            tracking_id: Some(format!("campaign-{}-{}", campaign_id, uuid::Uuid::new_v4())),
            campaign_id: Some(campaign_id.clone()),
        }
    }).collect();
    
    send_batch_emails(&state, messages).await
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATUS COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailServiceStatus {
    pub configured: bool,
    pub active_provider: EmailProvider,
    pub smtp_configured: bool,
    pub sendgrid_configured: bool,
    pub rate_limit_per_minute: u32,
    pub rate_limit_per_hour: u32,
    pub emails_sent_this_minute: u32,
    pub emails_sent_this_hour: u32,
}

#[command]
pub async fn email_get_status(
    state: tauri::State<'_, EmailServiceState>,
) -> Result<EmailServiceStatus, String> {
    let config = state.config.read().await;
    
    let smtp_configured = !config.smtp.host.is_empty() && !config.smtp.username.is_empty();
    let sendgrid_configured = !config.sendgrid.api_key.is_empty();
    
    let emails_minute = *state.emails_sent_this_minute.lock().map_err(|e| e.to_string())?;
    let emails_hour = *state.emails_sent_this_hour.lock().map_err(|e| e.to_string())?;
    
    Ok(EmailServiceStatus {
        configured: config.active_provider != EmailProvider::None && (smtp_configured || sendgrid_configured),
        active_provider: config.active_provider.clone(),
        smtp_configured,
        sendgrid_configured,
        rate_limit_per_minute: config.rate_limit_per_minute,
        rate_limit_per_hour: config.rate_limit_per_hour,
        emails_sent_this_minute: emails_minute,
        emails_sent_this_hour: emails_hour,
    })
}

#[command]
pub async fn email_reset_rate_counters(
    state: tauri::State<'_, EmailServiceState>,
) -> Result<(), String> {
    *state.emails_sent_this_minute.lock().map_err(|e| e.to_string())? = 0;
    *state.emails_sent_this_hour.lock().map_err(|e| e.to_string())? = 0;
    *state.last_minute_reset.lock().map_err(|e| e.to_string())? = chrono::Utc::now();
    *state.last_hour_reset.lock().map_err(|e| e.to_string())? = chrono::Utc::now();
    Ok(())
}
