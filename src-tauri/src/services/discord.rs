/**
 * Discord Integration Service
 * 
 * Provides Discord API integration for workflow automation:
 * - Send messages to channels via webhook
 * - Send rich embedded messages with colors and fields
 * - Upload files to channels
 * - Post messages with multiple embeds
 * 
 * Uses Discord Webhooks (no OAuth required for basic messaging).
 */

use serde::{Deserialize, Serialize};
use reqwest::header::CONTENT_TYPE;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscordMessage {
    pub content: Option<String>,
    pub username: Option<String>,
    pub avatar_url: Option<String>,
    pub tts: Option<bool>,
    pub embeds: Option<Vec<DiscordEmbed>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscordEmbed {
    pub title: Option<String>,
    pub description: Option<String>,
    pub url: Option<String>,
    pub color: Option<u32>, // Decimal color code
    pub timestamp: Option<String>, // ISO 8601 timestamp
    pub footer: Option<DiscordEmbedFooter>,
    pub image: Option<DiscordEmbedImage>,
    pub thumbnail: Option<DiscordEmbedThumbnail>,
    pub author: Option<DiscordEmbedAuthor>,
    pub fields: Option<Vec<DiscordEmbedField>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscordEmbedFooter {
    pub text: String,
    pub icon_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscordEmbedImage {
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscordEmbedThumbnail {
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscordEmbedAuthor {
    pub name: String,
    pub url: Option<String>,
    pub icon_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscordEmbedField {
    pub name: String,
    pub value: String,
    pub inline: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscordFileUpload {
    pub file_path: String,
    pub content: Option<String>,
    pub embeds: Option<Vec<DiscordEmbed>>,
}

pub struct DiscordService {
    client: reqwest::Client,
}

impl DiscordService {
    pub fn new() -> Self {
        Self {
            client: reqwest::Client::new(),
        }
    }

    /// Send a simple text message to Discord webhook
    pub async fn send_message(
        &self,
        webhook_url: String,
        content: String,
    ) -> Result<(), String> {
        let message = DiscordMessage {
            content: Some(content),
            username: None,
            avatar_url: None,
            tts: None,
            embeds: None,
        };

        self.send_message_full(webhook_url, message).await
    }

    /// Send a full Discord message with embeds
    pub async fn send_message_full(
        &self,
        webhook_url: String,
        message: DiscordMessage,
    ) -> Result<(), String> {
        let response = self.client
            .post(&webhook_url)
            .header(CONTENT_TYPE, "application/json")
            .json(&message)
            .send()
            .await
            .map_err(|e| format!("Failed to send Discord message: {}", e))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(format!("Discord API error: {}", error_text));
        }

        Ok(())
    }

    /// Send a message with a single embed
    pub async fn send_embed(
        &self,
        webhook_url: String,
        embed: DiscordEmbed,
    ) -> Result<(), String> {
        let message = DiscordMessage {
            content: None,
            username: None,
            avatar_url: None,
            tts: None,
            embeds: Some(vec![embed]),
        };

        self.send_message_full(webhook_url, message).await
    }

    /// Send a notification with status color
    pub async fn send_notification(
        &self,
        webhook_url: String,
        title: String,
        description: String,
        status: NotificationStatus,
    ) -> Result<(), String> {
        let color = match status {
            NotificationStatus::Success => 0x00FF00, // Green
            NotificationStatus::Warning => 0xFFFF00, // Yellow
            NotificationStatus::Error => 0xFF0000,   // Red
            NotificationStatus::Info => 0x3498db,    // Blue
        };

        let embed = DiscordEmbed {
            title: Some(title),
            description: Some(description),
            url: None,
            color: Some(color),
            timestamp: Some(chrono::Utc::now().to_rfc3339()),
            footer: Some(DiscordEmbedFooter {
                text: "CUBE Elite Automation".to_string(),
                icon_url: None,
            }),
            image: None,
            thumbnail: None,
            author: None,
            fields: None,
        };

        self.send_embed(webhook_url, embed).await
    }

    /// Send a message with multiple fields
    pub async fn send_fields_message(
        &self,
        webhook_url: String,
        title: String,
        fields: Vec<DiscordEmbedField>,
        color: Option<u32>,
    ) -> Result<(), String> {
        let embed = DiscordEmbed {
            title: Some(title),
            description: None,
            url: None,
            color,
            timestamp: Some(chrono::Utc::now().to_rfc3339()),
            footer: Some(DiscordEmbedFooter {
                text: "CUBE Elite".to_string(),
                icon_url: None,
            }),
            image: None,
            thumbnail: None,
            author: None,
            fields: Some(fields),
        };

        self.send_embed(webhook_url, embed).await
    }

    /// Upload a file with optional message
    pub async fn upload_file(
        &self,
        webhook_url: String,
        file_upload: DiscordFileUpload,
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
        let mut form = reqwest::multipart::Form::new()
            .part(
                "file",
                reqwest::multipart::Part::bytes(file_content)
                    .file_name(file_name.to_string()),
            );

        // Add optional content
        if let Some(content) = file_upload.content {
            form = form.text("content", content);
        }

        // Add optional embeds as JSON
        if let Some(embeds) = file_upload.embeds {
            let embeds_json = serde_json::to_string(&embeds)
                .map_err(|e| format!("Failed to serialize embeds: {}", e))?;
            form = form.text("embeds", embeds_json);
        }

        // Send request
        let response = self.client
            .post(&webhook_url)
            .multipart(form)
            .send()
            .await
            .map_err(|e| format!("Failed to upload file: {}", e))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(format!("Discord file upload error: {}", error_text));
        }

        Ok(())
    }

    /// Send a rich embed with author, image, and thumbnail
    pub async fn send_rich_embed(
        &self,
        webhook_url: String,
        title: String,
        description: String,
        author_name: Option<String>,
        image_url: Option<String>,
        thumbnail_url: Option<String>,
        color: Option<u32>,
    ) -> Result<(), String> {
        let embed = DiscordEmbed {
            title: Some(title),
            description: Some(description),
            url: None,
            color,
            timestamp: Some(chrono::Utc::now().to_rfc3339()),
            footer: Some(DiscordEmbedFooter {
                text: "CUBE Elite".to_string(),
                icon_url: None,
            }),
            image: image_url.map(|url| DiscordEmbedImage { url }),
            thumbnail: thumbnail_url.map(|url| DiscordEmbedThumbnail { url }),
            author: author_name.map(|name| DiscordEmbedAuthor {
                name,
                url: None,
                icon_url: None,
            }),
            fields: None,
        };

        self.send_embed(webhook_url, embed).await
    }

    /// Send multiple embeds in a single message
    pub async fn send_multiple_embeds(
        &self,
        webhook_url: String,
        content: Option<String>,
        embeds: Vec<DiscordEmbed>,
    ) -> Result<(), String> {
        let message = DiscordMessage {
            content,
            username: None,
            avatar_url: None,
            tts: None,
            embeds: Some(embeds),
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
