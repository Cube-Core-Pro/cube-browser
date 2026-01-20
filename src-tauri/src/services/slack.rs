/**
 * Slack Integration Service
 * 
 * Provides Slack API integration for workflow automation:
 * - Send messages to channels via webhook
 * - Send rich formatted messages with attachments
 * - Upload files to channels
 * - Post messages with interactive blocks
 * 
 * Uses Slack Incoming Webhooks (no OAuth required for basic messaging).
 */

use serde::{Deserialize, Serialize};
use reqwest::header::CONTENT_TYPE;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SlackMessage {
    pub text: String,
    pub channel: Option<String>,
    pub username: Option<String>,
    pub icon_emoji: Option<String>,
    pub attachments: Option<Vec<SlackAttachment>>,
    pub blocks: Option<Vec<serde_json::Value>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SlackAttachment {
    pub fallback: String,
    pub color: Option<String>, // "good", "warning", "danger", or hex color
    pub pretext: Option<String>,
    pub author_name: Option<String>,
    pub author_link: Option<String>,
    pub author_icon: Option<String>,
    pub title: Option<String>,
    pub title_link: Option<String>,
    pub text: Option<String>,
    pub fields: Option<Vec<SlackField>>,
    pub image_url: Option<String>,
    pub thumb_url: Option<String>,
    pub footer: Option<String>,
    pub footer_icon: Option<String>,
    pub ts: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SlackField {
    pub title: String,
    pub value: String,
    pub short: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SlackFileUpload {
    pub file_path: String,
    pub channels: Vec<String>,
    pub title: Option<String>,
    pub initial_comment: Option<String>,
}

pub struct SlackService {
    client: reqwest::Client,
}

impl SlackService {
    pub fn new() -> Self {
        Self {
            client: reqwest::Client::new(),
        }
    }

    /// Send a simple text message to Slack webhook
    pub async fn send_message(
        &self,
        webhook_url: String,
        text: String,
    ) -> Result<(), String> {
        let message = SlackMessage {
            text,
            channel: None,
            username: None,
            icon_emoji: None,
            attachments: None,
            blocks: None,
        };

        self.send_message_full(webhook_url, message).await
    }

    /// Send a formatted message with attachments
    pub async fn send_message_full(
        &self,
        webhook_url: String,
        message: SlackMessage,
    ) -> Result<(), String> {
        let response = self.client
            .post(&webhook_url)
            .header(CONTENT_TYPE, "application/json")
            .json(&message)
            .send()
            .await
            .map_err(|e| format!("Failed to send Slack message: {}", e))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(format!("Slack API error: {}", error_text));
        }

        Ok(())
    }

    /// Send a message with a single attachment
    pub async fn send_message_with_attachment(
        &self,
        webhook_url: String,
        text: String,
        attachment: SlackAttachment,
    ) -> Result<(), String> {
        let message = SlackMessage {
            text,
            channel: None,
            username: None,
            icon_emoji: None,
            attachments: Some(vec![attachment]),
            blocks: None,
        };

        self.send_message_full(webhook_url, message).await
    }

    /// Send a notification with status color
    pub async fn send_notification(
        &self,
        webhook_url: String,
        title: String,
        message: String,
        status: NotificationStatus,
    ) -> Result<(), String> {
        let color = match status {
            NotificationStatus::Success => "good",
            NotificationStatus::Warning => "warning",
            NotificationStatus::Error => "danger",
            NotificationStatus::Info => "#3498db",
        };

        let attachment = SlackAttachment {
            fallback: format!("{}: {}", title, message),
            color: Some(color.to_string()),
            pretext: None,
            author_name: None,
            author_link: None,
            author_icon: None,
            title: Some(title),
            title_link: None,
            text: Some(message),
            fields: None,
            image_url: None,
            thumb_url: None,
            footer: Some("CUBE Elite Automation".to_string()),
            footer_icon: None,
            ts: Some(chrono::Utc::now().timestamp()),
        };

        self.send_message_with_attachment(webhook_url, "".to_string(), attachment).await
    }

    /// Send a message with multiple fields
    pub async fn send_fields_message(
        &self,
        webhook_url: String,
        title: String,
        fields: Vec<SlackField>,
        color: Option<String>,
    ) -> Result<(), String> {
        let attachment = SlackAttachment {
            fallback: title.clone(),
            color,
            pretext: None,
            author_name: None,
            author_link: None,
            author_icon: None,
            title: Some(title),
            title_link: None,
            text: None,
            fields: Some(fields),
            image_url: None,
            thumb_url: None,
            footer: Some("CUBE Elite".to_string()),
            footer_icon: None,
            ts: Some(chrono::Utc::now().timestamp()),
        };

        self.send_message_with_attachment(webhook_url, "".to_string(), attachment).await
    }

    /// Upload a file to Slack (requires OAuth token, not webhook)
    pub async fn upload_file(
        &self,
        token: String,
        file_upload: SlackFileUpload,
    ) -> Result<(), String> {
        // Read file
        let file_path = Path::new(&file_upload.file_path);
        if !file_path.exists() {
            return Err(format!("File not found: {}", file_upload.file_path));
        }

        let file_content = tokio::fs::read(&file_path)
            .await
            .map_err(|e| format!("Failed to read file: {}", e))?;

        let file_name = file_path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("file");

        // Create multipart form
        let form = reqwest::multipart::Form::new()
            .text("channels", file_upload.channels.join(","))
            .part(
                "file",
                reqwest::multipart::Part::bytes(file_content)
                    .file_name(file_name.to_string()),
            );

        let form = if let Some(title) = file_upload.title {
            form.text("title", title)
        } else {
            form
        };

        let form = if let Some(comment) = file_upload.initial_comment {
            form.text("initial_comment", comment)
        } else {
            form
        };

        // Send request
        let response = self.client
            .post("https://slack.com/api/files.upload")
            .header("Authorization", format!("Bearer {}", token))
            .multipart(form)
            .send()
            .await
            .map_err(|e| format!("Failed to upload file: {}", e))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(format!("Slack file upload error: {}", error_text));
        }

        let json: serde_json::Value = response.json().await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        if !json["ok"].as_bool().unwrap_or(false) {
            let error = json["error"].as_str().unwrap_or("unknown error");
            return Err(format!("Slack API error: {}", error));
        }

        Ok(())
    }

    /// Send a message with interactive blocks (Block Kit)
    pub async fn send_blocks_message(
        &self,
        webhook_url: String,
        text: String,
        blocks: Vec<serde_json::Value>,
    ) -> Result<(), String> {
        let message = SlackMessage {
            text,
            channel: None,
            username: None,
            icon_emoji: None,
            attachments: None,
            blocks: Some(blocks),
        };

        self.send_message_full(webhook_url, message).await
    }
}

#[derive(Debug, Clone, Copy)]
pub enum NotificationStatus {
    Success,
    Warning,
    Error,
    Info,
}

impl NotificationStatus {
    pub fn from_string(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "success" => Self::Success,
            "warning" => Self::Warning,
            "error" => Self::Error,
            _ => Self::Info,
        }
    }
}
