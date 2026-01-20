use tauri::State;
use std::sync::Arc;

use crate::services::slack::{
    SlackService, SlackMessage, SlackField, 
    SlackFileUpload, NotificationStatus as SlackStatus,
};
use crate::services::discord::{
    DiscordService, DiscordMessage, DiscordEmbed, DiscordEmbedField, DiscordFileUpload,
    NotificationStatus as DiscordStatus,
};

/// State for integration services
pub struct IntegrationState {
    pub slack: Arc<SlackService>,
    pub discord: Arc<DiscordService>,
}

impl IntegrationState {
    pub fn new() -> Self {
        Self {
            slack: Arc::new(SlackService::new()),
            discord: Arc::new(DiscordService::new()),
        }
    }
}

// ==================== SLACK COMMANDS ====================

/// Send a simple text message to Slack
#[tauri::command]
pub async fn slack_send_message(
    webhook_url: String,
    text: String,
    state: State<'_, IntegrationState>,
) -> Result<(), String> {
    state.slack.send_message(webhook_url, text).await
}

/// Send a formatted Slack message with full options
#[tauri::command]
pub async fn slack_send_message_full(
    webhook_url: String,
    message: SlackMessage,
    state: State<'_, IntegrationState>,
) -> Result<(), String> {
    state.slack.send_message_full(webhook_url, message).await
}

/// Send a Slack notification with status color
#[tauri::command]
pub async fn slack_send_notification(
    webhook_url: String,
    title: String,
    message: String,
    status: String,
    state: State<'_, IntegrationState>,
) -> Result<(), String> {
    let status_enum = SlackStatus::from_string(&status);
    state.slack.send_notification(webhook_url, title, message, status_enum).await
}

/// Send a Slack message with fields
#[tauri::command]
pub async fn slack_send_fields(
    webhook_url: String,
    title: String,
    fields: Vec<SlackField>,
    color: Option<String>,
    state: State<'_, IntegrationState>,
) -> Result<(), String> {
    state.slack.send_fields_message(webhook_url, title, fields, color).await
}

/// Upload a file to Slack
#[tauri::command]
pub async fn slack_upload_file(
    token: String,
    file_upload: SlackFileUpload,
    state: State<'_, IntegrationState>,
) -> Result<(), String> {
    state.slack.upload_file(token, file_upload).await
}

/// Send a Slack message with blocks
#[tauri::command]
pub async fn slack_send_blocks(
    webhook_url: String,
    text: String,
    blocks: Vec<serde_json::Value>,
    state: State<'_, IntegrationState>,
) -> Result<(), String> {
    state.slack.send_blocks_message(webhook_url, text, blocks).await
}

// ==================== DISCORD COMMANDS ====================

/// Send a simple text message to Discord
#[tauri::command]
pub async fn discord_send_message(
    webhook_url: String,
    content: String,
    state: State<'_, IntegrationState>,
) -> Result<(), String> {
    state.discord.send_message(webhook_url, content).await
}

/// Send a full Discord message with embeds
#[tauri::command]
pub async fn discord_send_message_full(
    webhook_url: String,
    message: DiscordMessage,
    state: State<'_, IntegrationState>,
) -> Result<(), String> {
    state.discord.send_message_full(webhook_url, message).await
}

/// Send a Discord embed
#[tauri::command]
pub async fn discord_send_embed(
    webhook_url: String,
    embed: DiscordEmbed,
    state: State<'_, IntegrationState>,
) -> Result<(), String> {
    state.discord.send_embed(webhook_url, embed).await
}

/// Send a Discord notification with status color
#[tauri::command]
pub async fn discord_send_notification(
    webhook_url: String,
    title: String,
    description: String,
    status: String,
    state: State<'_, IntegrationState>,
) -> Result<(), String> {
    let status_enum = DiscordStatus::from_string(&status);
    state.discord.send_notification(webhook_url, title, description, status_enum).await
}

/// Send a Discord message with fields
#[tauri::command]
pub async fn discord_send_fields(
    webhook_url: String,
    title: String,
    fields: Vec<DiscordEmbedField>,
    color: Option<u32>,
    state: State<'_, IntegrationState>,
) -> Result<(), String> {
    state.discord.send_fields_message(webhook_url, title, fields, color).await
}

/// Upload a file to Discord
#[tauri::command]
pub async fn discord_upload_file(
    webhook_url: String,
    file_upload: DiscordFileUpload,
    state: State<'_, IntegrationState>,
) -> Result<(), String> {
    state.discord.upload_file(webhook_url, file_upload).await
}

/// Send a rich Discord embed
#[tauri::command]
pub async fn discord_send_rich_embed(
    webhook_url: String,
    title: String,
    description: String,
    author_name: Option<String>,
    image_url: Option<String>,
    thumbnail_url: Option<String>,
    color: Option<u32>,
    state: State<'_, IntegrationState>,
) -> Result<(), String> {
    state.discord.send_rich_embed(
        webhook_url,
        title,
        description,
        author_name,
        image_url,
        thumbnail_url,
        color,
    ).await
}

/// Send multiple Discord embeds
#[tauri::command]
pub async fn discord_send_multiple_embeds(
    webhook_url: String,
    content: Option<String>,
    embeds: Vec<DiscordEmbed>,
    state: State<'_, IntegrationState>,
) -> Result<(), String> {
    state.discord.send_multiple_embeds(webhook_url, content, embeds).await
}
