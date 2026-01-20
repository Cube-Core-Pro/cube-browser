/**
 * Alerts Service
 * 
 * Enterprise alerting system with multiple channels:
 * - Email (SMTP)
 * - Slack webhooks
 * - Discord webhooks
 * - Custom webhooks
 * 
 * Alert triggers:
 * - Workflow failure
 * - Workflow success
 * - Duration threshold exceeded
 * - Error pattern matching
 * - Resource usage thresholds
 */

use chrono::{DateTime, Utc};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use log::{info, warn, error};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertRule {
    pub id: String,
    pub name: String,
    pub workflow_id: Option<String>, // None = all workflows
    pub trigger: AlertTrigger,
    pub channels: Vec<AlertChannel>,
    pub enabled: bool,
    pub cooldown_minutes: u32, // Prevent alert spam
    pub last_triggered: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AlertTrigger {
    OnFailure,
    OnSuccess,
    OnDurationExceeds { seconds: u64 },
    OnErrorPattern { regex: String },
    OnNodeFailure { node_type: String },
    OnResourceThreshold { cpu_percent: Option<f32>, memory_mb: Option<u64> },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AlertChannel {
    Email {
        to: String,
        smtp_server: String,
        smtp_port: u16,
        smtp_username: String,
        smtp_password: String,
        from: String,
    },
    Slack {
        webhook_url: String,
    },
    Discord {
        webhook_url: String,
    },
    Webhook {
        url: String,
        method: String,
        headers: HashMap<String, String>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertEvent {
    pub id: String,
    pub rule_id: String,
    pub workflow_id: String,
    pub workflow_name: String,
    pub execution_id: String,
    pub timestamp: DateTime<Utc>,
    pub message: String,
    pub severity: AlertSeverity,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AlertSeverity {
    Info,
    Warning,
    Error,
    Critical,
}

impl AlertSeverity {
    pub fn as_str(&self) -> &str {
        match self {
            AlertSeverity::Info => "INFO",
            AlertSeverity::Warning => "WARNING",
            AlertSeverity::Error => "ERROR",
            AlertSeverity::Critical => "CRITICAL",
        }
    }

    pub fn color(&self) -> &str {
        match self {
            AlertSeverity::Info => "#3b82f6",     // Blue
            AlertSeverity::Warning => "#f59e0b",  // Orange
            AlertSeverity::Error => "#ef4444",    // Red
            AlertSeverity::Critical => "#dc2626", // Dark red
        }
    }
}

pub struct AlertsService {
    rules: Arc<RwLock<HashMap<String, AlertRule>>>,
    history: Arc<RwLock<Vec<AlertEvent>>>,
    client: Client,
}

impl AlertsService {
    pub fn new() -> Self {
        info!("🚨 Initializing AlertsService");
        Self {
            rules: Arc::new(RwLock::new(HashMap::new())),
            history: Arc::new(RwLock::new(Vec::new())),
            client: Client::new(),
        }
    }

    /// Add alert rule
    pub fn add_rule(&self, rule: AlertRule) -> Result<(), String> {
        let mut rules = self.rules.write().map_err(|e| format!("Lock error: {}", e))?;
        rules.insert(rule.id.clone(), rule.clone());
        info!("🚨 Added alert rule: {} ({})", rule.name, rule.id);
        Ok(())
    }

    /// Remove alert rule
    pub fn remove_rule(&self, rule_id: &str) -> Result<(), String> {
        let mut rules = self.rules.write().map_err(|e| format!("Lock error: {}", e))?;
        rules.remove(rule_id);
        info!("🚨 Removed alert rule: {}", rule_id);
        Ok(())
    }

    /// Toggle rule enabled/disabled
    pub fn toggle_rule(&self, rule_id: &str, enabled: bool) -> Result<(), String> {
        let mut rules = self.rules.write().map_err(|e| format!("Lock error: {}", e))?;
        if let Some(rule) = rules.get_mut(rule_id) {
            rule.enabled = enabled;
            info!("🚨 Toggled alert rule: {} ({})", rule_id, if enabled { "enabled" } else { "disabled" });
        }
        Ok(())
    }

    /// Get all rules
    pub fn get_rules(&self) -> Result<Vec<AlertRule>, String> {
        let rules = self.rules.read().map_err(|e| format!("Lock error: {}", e))?;
        Ok(rules.values().cloned().collect())
    }

    /// Check if workflow execution should trigger alerts
    pub async fn check_execution(
        &self,
        workflow_id: &str,
        workflow_name: &str,
        execution_id: &str,
        success: bool,
        duration_ms: u64,
        error: Option<&str>,
    ) -> Result<(), String> {
        let rules = self.rules.read().map_err(|e| format!("Lock error: {}", e))?.clone();
        
        for rule in rules.values() {
            if !rule.enabled {
                continue;
            }

            // Check if rule applies to this workflow
            if let Some(ref rule_wf_id) = rule.workflow_id {
                if rule_wf_id != workflow_id {
                    continue;
                }
            }

            // Check cooldown
            if let Some(last_triggered) = rule.last_triggered {
                let elapsed_minutes = (Utc::now() - last_triggered).num_minutes();
                if elapsed_minutes < rule.cooldown_minutes as i64 {
                    continue; // Still in cooldown
                }
            }

            // Check trigger conditions
            let should_alert = match &rule.trigger {
                AlertTrigger::OnFailure => !success,
                AlertTrigger::OnSuccess => success,
                AlertTrigger::OnDurationExceeds { seconds } => {
                    duration_ms > (*seconds * 1000)
                }
                AlertTrigger::OnErrorPattern { regex } => {
                    if let Some(err_msg) = error {
                        regex::Regex::new(regex)
                            .map(|re| re.is_match(err_msg))
                            .unwrap_or(false)
                    } else {
                        false
                    }
                }
                _ => false, // Other triggers checked elsewhere
            };

            if should_alert {
                let severity = if !success {
                    AlertSeverity::Error
                } else if duration_ms > 60000 {
                    AlertSeverity::Warning
                } else {
                    AlertSeverity::Info
                };

                let message = if !success {
                    format!("Workflow '{}' failed: {}", workflow_name, error.unwrap_or("Unknown error"))
                } else if duration_ms > 60000 {
                    format!("Workflow '{}' took {} seconds (threshold exceeded)", workflow_name, duration_ms / 1000)
                } else {
                    format!("Workflow '{}' completed successfully", workflow_name)
                };

                self.trigger_alert(
                    rule,
                    workflow_id,
                    workflow_name,
                    execution_id,
                    &message,
                    severity,
                    HashMap::new(),
                ).await?;
            }
        }

        Ok(())
    }

    /// Trigger alert
    async fn trigger_alert(
        &self,
        rule: &AlertRule,
        workflow_id: &str,
        workflow_name: &str,
        execution_id: &str,
        message: &str,
        severity: AlertSeverity,
        metadata: HashMap<String, String>,
    ) -> Result<(), String> {
        let event = AlertEvent {
            id: format!("alert-{}", Utc::now().timestamp_millis()),
            rule_id: rule.id.clone(),
            workflow_id: workflow_id.to_string(),
            workflow_name: workflow_name.to_string(),
            execution_id: execution_id.to_string(),
            timestamp: Utc::now(),
            message: message.to_string(),
            severity: severity.clone(),
            metadata,
        };

        // Archive event
        {
            let mut history = self.history.write().map_err(|e| format!("Lock error: {}", e))?;
            history.push(event.clone());
            
            // Keep last 1000 alerts
            if history.len() > 1000 {
                let excess = history.len() - 1000;
                history.drain(0..excess);
            }
        }

        // Update last_triggered
        {
            let mut rules = self.rules.write().map_err(|e| format!("Lock error: {}", e))?;
            if let Some(rule_mut) = rules.get_mut(&rule.id) {
                rule_mut.last_triggered = Some(Utc::now());
            }
        }

        // Send to all channels
        for channel in &rule.channels {
            if let Err(e) = self.send_to_channel(channel, &event).await {
                error!("Failed to send alert to channel: {}", e);
            }
        }

        info!("🚨 Alert triggered: {} ({})", rule.name, event.id);
        Ok(())
    }

    /// Send alert to specific channel (public for testing)
    pub async fn send_to_channel(&self, channel: &AlertChannel, event: &AlertEvent) -> Result<(), String> {
        match channel {
            AlertChannel::Slack { webhook_url } => {
                self.send_to_slack(webhook_url, event).await
            }
            AlertChannel::Discord { webhook_url } => {
                self.send_to_discord(webhook_url, event).await
            }
            AlertChannel::Webhook { url, method, headers } => {
                self.send_to_webhook(url, method, headers, event).await
            }
            AlertChannel::Email { to, smtp_server, smtp_port, smtp_username, smtp_password, from } => {
                self.send_email_alert(to, smtp_server, *smtp_port, smtp_username, smtp_password, from, event).await
            }
        }
    }

    /// Send to Slack
    async fn send_to_slack(&self, webhook_url: &str, event: &AlertEvent) -> Result<(), String> {
        let payload = serde_json::json!({
            "text": format!("🚨 {} Alert", event.severity.as_str()),
            "attachments": [{
                "color": event.severity.color(),
                "title": event.workflow_name,
                "text": event.message,
                "fields": [
                    {
                        "title": "Execution ID",
                        "value": event.execution_id,
                        "short": true
                    },
                    {
                        "title": "Timestamp",
                        "value": event.timestamp.to_rfc3339(),
                        "short": true
                    }
                ]
            }]
        });

        self.client
            .post(webhook_url)
            .json(&payload)
            .send()
            .await
            .map_err(|e| format!("Slack webhook failed: {}", e))?;

        Ok(())
    }

    /// Send to Discord
    async fn send_to_discord(&self, webhook_url: &str, event: &AlertEvent) -> Result<(), String> {
        let color = match event.severity {
            AlertSeverity::Info => 3447003,      // Blue
            AlertSeverity::Warning => 16497928,  // Orange
            AlertSeverity::Error => 15158332,    // Red
            AlertSeverity::Critical => 10038562, // Dark red
        };

        let payload = serde_json::json!({
            "embeds": [{
                "title": format!("🚨 {} Alert", event.severity.as_str()),
                "description": event.message,
                "color": color,
                "fields": [
                    {
                        "name": "Workflow",
                        "value": event.workflow_name,
                        "inline": true
                    },
                    {
                        "name": "Execution ID",
                        "value": event.execution_id,
                        "inline": true
                    },
                    {
                        "name": "Timestamp",
                        "value": event.timestamp.to_rfc3339(),
                        "inline": false
                    }
                ]
            }]
        });

        self.client
            .post(webhook_url)
            .json(&payload)
            .send()
            .await
            .map_err(|e| format!("Discord webhook failed: {}", e))?;

        Ok(())
    }

    /// Send to custom webhook
    async fn send_to_webhook(
        &self,
        url: &str,
        method: &str,
        headers: &HashMap<String, String>,
        event: &AlertEvent,
    ) -> Result<(), String> {
        let mut request = match method.to_uppercase().as_str() {
            "POST" => self.client.post(url),
            "PUT" => self.client.put(url),
            _ => return Err(format!("Unsupported method: {}", method)),
        };

        // Add custom headers
        for (key, value) in headers {
            request = request.header(key, value);
        }

        // Send event as JSON payload
        request
            .json(event)
            .send()
            .await
            .map_err(|e| format!("Webhook failed: {}", e))?;

        Ok(())
    }

    /// Send email alert via SMTP
    async fn send_email_alert(
        &self,
        to: &str,
        smtp_server: &str,
        smtp_port: u16,
        smtp_username: &str,
        smtp_password: &str,
        from: &str,
        event: &AlertEvent,
    ) -> Result<(), String> {
        use lettre::{
            message::{header::ContentType, Message},
            transport::smtp::authentication::Credentials,
            AsyncSmtpTransport, AsyncTransport, Tokio1Executor,
        };

        // Build HTML email body
        let html_body = format!(
            r#"<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }}
        .alert-box {{ padding: 20px; border-radius: 8px; margin: 20px; }}
        .critical {{ background: #fee2e2; border-left: 4px solid #ef4444; }}
        .warning {{ background: #fef3c7; border-left: 4px solid #f59e0b; }}
        .info {{ background: #dbeafe; border-left: 4px solid #3b82f6; }}
        .success {{ background: #d1fae5; border-left: 4px solid #10b981; }}
        h2 {{ margin: 0 0 10px 0; color: #1f2937; }}
        .details {{ background: #f3f4f6; padding: 15px; border-radius: 4px; margin-top: 15px; }}
        .detail-row {{ margin: 5px 0; }}
        .label {{ font-weight: 600; color: #4b5563; }}
    </style>
</head>
<body>
    <div class="alert-box {}">
        <h2>🚨 {} Alert: {}</h2>
        <p>{}</p>
        <div class="details">
            <div class="detail-row"><span class="label">Workflow:</span> {}</div>
            <div class="detail-row"><span class="label">Execution ID:</span> {}</div>
            <div class="detail-row"><span class="label">Timestamp:</span> {}</div>
            <div class="detail-row"><span class="label">Alert ID:</span> {}</div>
        </div>
    </div>
    <p style="color: #6b7280; font-size: 12px;">
        This alert was sent by CUBE Automation Platform
    </p>
</body>
</html>"#,
            event.severity.as_str().to_lowercase(),
            event.severity.as_str(),
            event.workflow_name,
            event.message,
            event.workflow_name,
            event.execution_id,
            event.timestamp.format("%Y-%m-%d %H:%M:%S UTC"),
            event.id
        );

        // Build email message
        let email = Message::builder()
            .from(from.parse().map_err(|e| format!("Invalid from address: {}", e))?)
            .to(to.parse().map_err(|e| format!("Invalid to address: {}", e))?)
            .subject(format!(
                "[CUBE Alert] {} - {}",
                event.severity.as_str(),
                event.workflow_name
            ))
            .header(ContentType::TEXT_HTML)
            .body(html_body)
            .map_err(|e| format!("Failed to build email: {}", e))?;

        // Create SMTP transport
        let creds = Credentials::new(smtp_username.to_string(), smtp_password.to_string());

        let mailer: AsyncSmtpTransport<Tokio1Executor> = if smtp_port == 465 {
            // SSL/TLS on port 465
            AsyncSmtpTransport::<Tokio1Executor>::relay(smtp_server)
                .map_err(|e| format!("Failed to create SMTP transport: {}", e))?
                .credentials(creds)
                .build()
        } else {
            // STARTTLS on other ports (587, 25, etc.)
            AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(smtp_server)
                .map_err(|e| format!("Failed to create SMTP transport: {}", e))?
                .credentials(creds)
                .port(smtp_port)
                .build()
        };

        // Send email
        mailer
            .send(email)
            .await
            .map_err(|e| format!("Failed to send email: {}", e))?;

        info!("📧 Email alert sent to {}", to);
        Ok(())
    }

    /// Get alert history
    pub fn get_history(&self, limit: Option<usize>) -> Result<Vec<AlertEvent>, String> {
        let history = self.history.read().map_err(|e| format!("Lock error: {}", e))?;
        
        let mut events: Vec<AlertEvent> = history.clone();
        events.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        
        if let Some(limit) = limit {
            events.truncate(limit);
        }
        
        Ok(events)
    }

    /// Clear alert history
    pub fn clear_history(&self) -> Result<usize, String> {
        let mut history = self.history.write().map_err(|e| format!("Lock error: {}", e))?;
        let count = history.len();
        history.clear();
        info!("🚨 Cleared {} alert events", count);
        Ok(count)
    }
}
