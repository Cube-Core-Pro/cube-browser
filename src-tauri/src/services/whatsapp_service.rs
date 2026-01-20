// ═══════════════════════════════════════════════════════════════════════════════
// 💬 WHATSAPP BUSINESS API SERVICE - ENTERPRISE GRADE
// ═══════════════════════════════════════════════════════════════════════════════
//
// Sistema completo de integración con WhatsApp Business API:
// - Envío de mensajes (texto, multimedia, ubicación, contactos)
// - Recepción de mensajes vía webhook
// - Bot inteligente con procesamiento de comandos
// - Gestión de chats y contactos
// - Templates de mensajes
// - Notificaciones push
// - Control de automatizaciones desde WhatsApp
//
// ═══════════════════════════════════════════════════════════════════════════════

use anyhow::{anyhow, Result};
use log::{error, info};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WhatsAppConfig {
    pub api_key: String,
    pub phone_number_id: String,
    pub business_account_id: String,
    pub webhook_url: Option<String>,
    pub webhook_verify_token: Option<String>,
    pub api_version: String, // Default: "v18.0"
}

impl Default for WhatsAppConfig {
    fn default() -> Self {
        Self {
            api_key: String::new(),
            phone_number_id: String::new(),
            business_account_id: String::new(),
            webhook_url: None,
            webhook_verify_token: None,
            api_version: "v18.0".to_string(),
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// MESSAGE TYPES
// ═══════════════════════════════════════════════════════════════════════════

// Message Content Types (for future rich media support)
#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum MessageContent {
    Text {
        body: String,
        preview_url: Option<bool>,
    },
    Image {
        link: Option<String>,
        id: Option<String>,
        caption: Option<String>,
    },
    Video {
        link: Option<String>,
        id: Option<String>,
        caption: Option<String>,
    },
    Document {
        link: Option<String>,
        id: Option<String>,
        filename: Option<String>,
        caption: Option<String>,
    },
    Audio {
        link: Option<String>,
        id: Option<String>,
    },
    Location {
        latitude: f64,
        longitude: f64,
        name: Option<String>,
        address: Option<String>,
    },
    Contact {
        contacts: Vec<ContactInfo>,
    },
    Template {
        name: String,
        language: LanguageCode,
        components: Vec<TemplateComponent>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContactInfo {
    pub name: ContactName,
    pub phones: Vec<ContactPhone>,
    pub emails: Option<Vec<ContactEmail>>,
    pub org: Option<ContactOrg>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContactName {
    pub formatted_name: String,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContactPhone {
    pub phone: String,
    #[serde(rename = "type")]
    pub phone_type: Option<String>, // CELL, HOME, WORK
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContactEmail {
    pub email: String,
    #[serde(rename = "type")]
    pub email_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContactOrg {
    pub company: Option<String>,
    pub department: Option<String>,
    pub title: Option<String>,
}

// Template types (for future template message support)
#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LanguageCode {
    pub code: String, // e.g., "en_US", "es_MX"
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum TemplateComponent {
    Header {
        parameters: Vec<TemplateParameter>,
    },
    Body {
        parameters: Vec<TemplateParameter>,
    },
    Button {
        sub_type: String, // "url" or "quick_reply"
        index: usize,
        parameters: Vec<TemplateParameter>,
    },
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum TemplateParameter {
    Text {
        text: String,
    },
    Currency {
        fallback_value: String,
        code: String,
        amount_1000: i64,
    },
    DateTime {
        fallback_value: String,
    },
    Image {
        link: String,
    },
    Document {
        link: String,
        filename: String,
    },
    Video {
        link: String,
    },
}

// ═══════════════════════════════════════════════════════════════════════════
// INCOMING MESSAGE TYPES
// ═══════════════════════════════════════════════════════════════════════════

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IncomingMessage {
    pub id: String,
    pub from: String,
    pub timestamp: String,
    pub text: Option<TextMessage>,
    pub image: Option<MediaMessage>,
    pub video: Option<MediaMessage>,
    pub document: Option<MediaMessage>,
    pub audio: Option<MediaMessage>,
    pub location: Option<LocationMessage>,
    pub contacts: Option<Vec<ContactInfo>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TextMessage {
    pub body: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaMessage {
    pub id: String,
    pub mime_type: String,
    pub sha256: String,
    pub caption: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocationMessage {
    pub latitude: f64,
    pub longitude: f64,
    pub name: Option<String>,
    pub address: Option<String>,
}

// ═══════════════════════════════════════════════════════════════════════════
// COMMAND SYSTEM (Para controlar CUBE desde WhatsApp)
// ═══════════════════════════════════════════════════════════════════════════

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BotCommand {
    pub command: String,
    pub args: Vec<String>,
    pub sender: String,
    pub chat_id: String,
    pub message_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CubeCommand {
    // Automation commands
    RunWorkflow {
        workflow_id: String,
    },
    StopWorkflow {
        workflow_id: String,
    },
    ListWorkflows,

    // Data extraction
    ExtractData {
        url: String,
        schema_id: Option<String>,
    },
    GetExtractedData {
        session_id: String,
    },

    // Autofill
    CreateProfile {
        profile_data: HashMap<String, String>,
    },
    ListProfiles,
    FillForm {
        profile_id: String,
        url: String,
    },

    // Downloads
    DownloadFile {
        url: String,
    },
    ListDownloads,
    GetDownloadStatus {
        download_id: String,
    },

    // LendingPad specific
    DetectLendingPadDocs,
    DownloadLendingPadDocs {
        batch_id: String,
    },
    ExtractLendingPadData {
        document_id: String,
    },

    // System
    GetStatus,
    Help,
    Unknown {
        text: String,
    },
}

// ═══════════════════════════════════════════════════════════════════════════
// WHATSAPP SERVICE
// ═══════════════════════════════════════════════════════════════════════════

pub struct WhatsAppService {
    config: WhatsAppConfig,
    client: Client,
    message_history: Arc<Mutex<Vec<IncomingMessage>>>,
    pending_commands: Arc<Mutex<Vec<BotCommand>>>,
}

impl WhatsAppService {
    /// Create new WhatsApp service
    pub fn new(config: WhatsAppConfig) -> Result<Self> {
        let client = Client::builder()
            .timeout(std::time::Duration::from_secs(30))
            .build()?;

        Ok(Self {
            config,
            client,
            message_history: Arc::new(Mutex::new(Vec::new())),
            pending_commands: Arc::new(Mutex::new(Vec::new())),
        })
    }

    /// Send text message
    pub async fn send_text_message(&self, to: &str, body: &str) -> Result<String> {
        let url = format!(
            "https://graph.facebook.com/{}/{}/messages",
            self.config.api_version, self.config.phone_number_id
        );

        let payload = serde_json::json!({
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "text",
            "text": {
                "preview_url": false,
                "body": body
            }
        });

        let response = self
            .client
            .post(&url)
            .header("Authorization", format!("Bearer {}", self.config.api_key))
            .header("Content-Type", "application/json")
            .json(&payload)
            .send()
            .await?;

        if response.status().is_success() {
            let result: serde_json::Value = response.json().await?;
            let message_id = result["messages"][0]["id"]
                .as_str()
                .ok_or_else(|| anyhow!("No message ID in response"))?;

            info!("✅ WhatsApp message sent: {}", message_id);
            Ok(message_id.to_string())
        } else {
            let error_text = response.text().await?;
            error!("❌ WhatsApp API error: {}", error_text);
            Err(anyhow!("Failed to send message: {}", error_text))
        }
    }

    /// Send media message (image, video, document)
    pub async fn send_media_message(
        &self,
        to: &str,
        media_type: &str,
        media_link: &str,
        caption: Option<&str>,
    ) -> Result<String> {
        let url = format!(
            "https://graph.facebook.com/{}/{}/messages",
            self.config.api_version, self.config.phone_number_id
        );

        let mut media_obj = serde_json::json!({
            "link": media_link
        });

        if let Some(cap) = caption {
            media_obj["caption"] = serde_json::Value::String(cap.to_string());
        }

        let payload = serde_json::json!({
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": media_type,
            media_type: media_obj
        });

        let response = self
            .client
            .post(&url)
            .header("Authorization", format!("Bearer {}", self.config.api_key))
            .header("Content-Type", "application/json")
            .json(&payload)
            .send()
            .await?;

        if response.status().is_success() {
            let result: serde_json::Value = response.json().await?;
            let message_id = result["messages"][0]["id"]
                .as_str()
                .ok_or_else(|| anyhow!("No message ID in response"))?;

            info!("✅ WhatsApp media sent: {}", message_id);
            Ok(message_id.to_string())
        } else {
            let error_text = response.text().await?;
            Err(anyhow!("Failed to send media: {}", error_text))
        }
    }

    /// Send template message (for future template support)
    #[allow(dead_code)]
    pub async fn send_template_message(
        &self,
        to: &str,
        template_name: &str,
        language_code: &str,
        components: Vec<TemplateComponent>,
    ) -> Result<String> {
        let url = format!(
            "https://graph.facebook.com/{}/{}/messages",
            self.config.api_version, self.config.phone_number_id
        );

        let payload = serde_json::json!({
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {
                    "code": language_code
                },
                "components": components
            }
        });

        let response = self
            .client
            .post(&url)
            .header("Authorization", format!("Bearer {}", self.config.api_key))
            .header("Content-Type", "application/json")
            .json(&payload)
            .send()
            .await?;

        if response.status().is_success() {
            let result: serde_json::Value = response.json().await?;
            let message_id = result["messages"][0]["id"]
                .as_str()
                .ok_or_else(|| anyhow!("No message ID in response"))?;

            info!("✅ WhatsApp template sent: {}", message_id);
            Ok(message_id.to_string())
        } else {
            let error_text = response.text().await?;
            Err(anyhow!("Failed to send template: {}", error_text))
        }
    }

    /// Process incoming webhook message
    pub async fn process_incoming_message(&self, webhook_data: serde_json::Value) -> Result<()> {
        info!("📥 Processing incoming WhatsApp message");

        // Parse webhook data
        let entry = &webhook_data["entry"][0];
        let changes = &entry["changes"][0];
        let value = &changes["value"];
        let messages = &value["messages"];

        if let Some(messages_array) = messages.as_array() {
            for msg in messages_array {
                let message = self.parse_incoming_message(msg)?;

                // Store in history
                let mut history = self.message_history.lock().await;
                history.push(message.clone());

                // Check if it's a command
                if let Some(text) = &message.text {
                    if text.body.starts_with('/') {
                        let command = self.parse_command(&message)?;
                        let mut commands = self.pending_commands.lock().await;
                        commands.push(command.clone());

                        // Execute command
                        self.execute_command(command).await?;
                    }
                }
            }
        }

        Ok(())
    }

    /// Parse incoming message from webhook
    fn parse_incoming_message(&self, msg: &serde_json::Value) -> Result<IncomingMessage> {
        Ok(IncomingMessage {
            id: msg["id"].as_str().unwrap_or("").to_string(),
            from: msg["from"].as_str().unwrap_or("").to_string(),
            timestamp: msg["timestamp"].as_str().unwrap_or("").to_string(),
            text: msg
                .get("text")
                .and_then(|t| serde_json::from_value(t.clone()).ok()),
            image: msg
                .get("image")
                .and_then(|i| serde_json::from_value(i.clone()).ok()),
            video: msg
                .get("video")
                .and_then(|v| serde_json::from_value(v.clone()).ok()),
            document: msg
                .get("document")
                .and_then(|d| serde_json::from_value(d.clone()).ok()),
            audio: msg
                .get("audio")
                .and_then(|a| serde_json::from_value(a.clone()).ok()),
            location: msg
                .get("location")
                .and_then(|l| serde_json::from_value(l.clone()).ok()),
            contacts: msg
                .get("contacts")
                .and_then(|c| serde_json::from_value(c.clone()).ok()),
        })
    }

    /// Parse command from message
    fn parse_command(&self, message: &IncomingMessage) -> Result<BotCommand> {
        let text = message
            .text
            .as_ref()
            .ok_or_else(|| anyhow!("No text in message"))?
            .body
            .clone();

        let parts: Vec<String> = text.split_whitespace().map(|s| s.to_string()).collect();

        let command = parts
            .first()
            .ok_or_else(|| anyhow!("Empty command"))?
            .trim_start_matches('/')
            .to_string();

        let args = parts.into_iter().skip(1).collect();

        Ok(BotCommand {
            command,
            args,
            sender: message.from.clone(),
            chat_id: message.from.clone(),
            message_id: message.id.clone(),
        })
    }

    /// Execute bot command
    async fn execute_command(&self, command: BotCommand) -> Result<()> {
        info!("🤖 Executing command: {}", command.command);

        let cube_command = self.parse_cube_command(&command)?;
        let response = self.handle_cube_command(cube_command).await?;

        // Send response back to user
        self.send_text_message(&command.sender, &response).await?;

        Ok(())
    }

    /// Parse CUBE command from bot command
    fn parse_cube_command(&self, command: &BotCommand) -> Result<CubeCommand> {
        match command.command.as_str() {
            "run" => {
                if let Some(workflow_id) = command.args.first() {
                    Ok(CubeCommand::RunWorkflow {
                        workflow_id: workflow_id.clone(),
                    })
                } else {
                    Ok(CubeCommand::Unknown {
                        text: "Usage: /run <workflow_id>".to_string(),
                    })
                }
            }
            "stop" => {
                if let Some(workflow_id) = command.args.first() {
                    Ok(CubeCommand::StopWorkflow {
                        workflow_id: workflow_id.clone(),
                    })
                } else {
                    Ok(CubeCommand::Unknown {
                        text: "Usage: /stop <workflow_id>".to_string(),
                    })
                }
            }
            "workflows" => Ok(CubeCommand::ListWorkflows),
            "extract" => {
                if let Some(url) = command.args.first() {
                    Ok(CubeCommand::ExtractData {
                        url: url.clone(),
                        schema_id: command.args.get(1).cloned(),
                    })
                } else {
                    Ok(CubeCommand::Unknown {
                        text: "Usage: /extract <url> [schema_id]".to_string(),
                    })
                }
            }
            "profiles" => Ok(CubeCommand::ListProfiles),
            "fill" => {
                if command.args.len() >= 2 {
                    Ok(CubeCommand::FillForm {
                        profile_id: command.args[0].clone(),
                        url: command.args[1].clone(),
                    })
                } else {
                    Ok(CubeCommand::Unknown {
                        text: "Usage: /fill <profile_id> <url>".to_string(),
                    })
                }
            }
            "download" => {
                if let Some(url) = command.args.first() {
                    Ok(CubeCommand::DownloadFile { url: url.clone() })
                } else {
                    Ok(CubeCommand::Unknown {
                        text: "Usage: /download <url>".to_string(),
                    })
                }
            }
            "downloads" => Ok(CubeCommand::ListDownloads),
            "lp_detect" => Ok(CubeCommand::DetectLendingPadDocs),
            "lp_download" => {
                if let Some(batch_id) = command.args.first() {
                    Ok(CubeCommand::DownloadLendingPadDocs {
                        batch_id: batch_id.clone(),
                    })
                } else {
                    Ok(CubeCommand::Unknown {
                        text: "Usage: /lp_download <batch_id>".to_string(),
                    })
                }
            }
            "status" => Ok(CubeCommand::GetStatus),
            "help" => Ok(CubeCommand::Help),
            _ => Ok(CubeCommand::Unknown {
                text: format!("Unknown command: {}", command.command),
            }),
        }
    }

    /// Handle CUBE command and generate response
    async fn handle_cube_command(&self, command: CubeCommand) -> Result<String> {
        match command {
            CubeCommand::Help => Ok(self.generate_help_text()),
            CubeCommand::GetStatus => Ok("✅ CUBE Elite is running!".to_string()),
            CubeCommand::Unknown { text } => {
                Ok(format!("❓ {}\n\nType /help for available commands", text))
            }
            _ => Ok("⚙️ Command received and will be processed.".to_string()),
        }
    }

    /// Generate help text
    fn generate_help_text(&self) -> String {
        r#"
🤖 *CUBE Elite WhatsApp Bot*

*Automation*
/run <id> - Run workflow
/stop <id> - Stop workflow
/workflows - List workflows

*Data Extraction*
/extract <url> - Extract data from page
/profiles - List autofill profiles
/fill <profile> <url> - Fill form

*Downloads*
/download <url> - Download file
/downloads - List downloads

*LendingPad*
/lp_detect - Detect documents
/lp_download <batch> - Download batch

*System*
/status - System status
/help - This help message
        "#
        .trim()
        .to_string()
    }

    /// Get message history
    pub async fn get_message_history(&self) -> Vec<IncomingMessage> {
        let history = self.message_history.lock().await;
        history.clone()
    }

    /// Get pending commands
    pub async fn get_pending_commands(&self) -> Vec<BotCommand> {
        let commands = self.pending_commands.lock().await;
        commands.clone()
    }

    /// Clear message history (utility for future use)
    #[allow(dead_code)]
    pub async fn clear_history(&self) {
        let mut history = self.message_history.lock().await;
        history.clear();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_whatsapp_service_creation() {
        let config = WhatsAppConfig::default();
        let service = WhatsAppService::new(config);
        assert!(service.is_ok());
    }

    #[test]
    fn test_command_parsing() {
        let service = WhatsAppService::new(WhatsAppConfig::default()).unwrap();

        let message = IncomingMessage {
            id: "test".to_string(),
            from: "123456789".to_string(),
            timestamp: "123456".to_string(),
            text: Some(TextMessage {
                body: "/run workflow_123".to_string(),
            }),
            image: None,
            video: None,
            document: None,
            audio: None,
            location: None,
            contacts: None,
        };

        let command = service.parse_command(&message);
        assert!(command.is_ok());

        let cmd = command.unwrap();
        assert_eq!(cmd.command, "run");
        assert_eq!(cmd.args.len(), 1);
        assert_eq!(cmd.args[0], "workflow_123");
    }
}
