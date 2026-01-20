// ═══════════════════════════════════════════════════════════════════════════════
// 📊 MONDAY.COM & PLANIUS.IA INTEGRATION SERVICE
// ═══════════════════════════════════════════════════════════════════════════════
//
// Sistema completo de gestión de proyectos estilo Monday.com con IA de Planius:
// - Boards, grupos, items, columnas personalizadas
// - Automaciones con triggers y acciones
// - Integraciones con otras herramientas
// - Timeline y Gantt charts
// - Dashboards y reportes
// - IA para predicción y optimización (Planius)
// - Sincronización bidireccional
//
// ═══════════════════════════════════════════════════════════════════════════════

use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use log::{error, info};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;

// ═══════════════════════════════════════════════════════════════════════════
// MONDAY.COM TYPES
// ═══════════════════════════════════════════════════════════════════════════

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MondayConfig {
    pub api_token: String,
    pub api_version: String, // Default: "2023-10"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Board {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub board_kind: BoardKind,
    pub groups: Vec<Group>,
    pub columns: Vec<Column>,
    pub workspace_id: String,
    pub state: BoardState,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BoardKind {
    #[serde(rename = "public")]
    Public,
    #[serde(rename = "private")]
    Private,
    #[serde(rename = "share")]
    Shareable,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BoardState {
    #[serde(rename = "active")]
    Active,
    #[serde(rename = "archived")]
    Archived,
    #[serde(rename = "deleted")]
    Deleted,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Group {
    pub id: String,
    pub title: String,
    pub color: String,
    pub position: i32,
    pub archived: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Column {
    pub id: String,
    pub title: String,
    pub column_type: ColumnType,
    pub settings_str: Option<String>,
    pub archived: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ColumnType {
    Text,
    LongText,
    Number,
    Status,
    Date,
    Timeline,
    Person,
    Dropdown,
    Email,
    Phone,
    Link,
    File,
    Checkbox,
    Rating,
    Formula,
    Dependency,
    Tags,
    Location,
    Color,
    Button,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Item {
    pub id: String,
    pub name: String,
    pub board_id: String,
    pub group_id: String,
    pub column_values: HashMap<String, ColumnValue>,
    pub state: ItemState,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub creator_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ItemState {
    Active,
    Archived,
    Deleted,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum ColumnValue {
    Text(String),
    Number(f64),
    Status {
        label: String,
        color: String,
    },
    Date {
        date: String, // ISO format
        time: Option<String>,
    },
    Timeline {
        from: String,
        to: String,
    },
    Person {
        persons_and_teams: Vec<PersonTeam>,
    },
    Dropdown {
        ids: Vec<String>,
        labels: Vec<String>,
    },
    Checkbox {
        checked: bool,
    },
    Rating {
        rating: i32,
    },
    Tags {
        tag_ids: Vec<String>,
    },
    File {
        files: Vec<FileInfo>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonTeam {
    pub id: String,
    pub kind: String, // "person" or "team"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileInfo {
    pub asset_id: String,
    pub name: String,
    pub url: String,
    pub file_size: i64,
    pub file_extension: String,
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTOMATION TYPES
// ═══════════════════════════════════════════════════════════════════════════

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Automation {
    pub id: String,
    pub name: String,
    pub board_id: String,
    pub trigger: AutomationTrigger,
    pub conditions: Vec<AutomationCondition>,
    pub actions: Vec<AutomationAction>,
    pub enabled: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum AutomationTrigger {
    ItemCreated,
    ItemMoved { to_group_id: String },
    StatusChanged { column_id: String },
    DateArrived { column_id: String },
    PersonAssigned { column_id: String },
    CheckboxChanged { column_id: String },
    CustomTrigger { trigger_id: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutomationCondition {
    pub column_id: String,
    pub operator: ConditionOperator,
    pub value: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ConditionOperator {
    Equals,
    NotEquals,
    Contains,
    NotContains,
    GreaterThan,
    LessThan,
    IsEmpty,
    IsNotEmpty,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum AutomationAction {
    ChangeStatus {
        column_id: String,
        status_label: String,
    },
    AssignPerson {
        column_id: String,
        person_id: String,
    },
    CreateItem {
        board_id: String,
        group_id: String,
        item_name: String,
    },
    MoveItem {
        to_group_id: String,
    },
    SendNotification {
        recipient_id: String,
        message: String,
    },
    SendEmail {
        to: String,
        subject: String,
        body: String,
    },
    RunCubeWorkflow {
        workflow_id: String,
    },
    SendWhatsApp {
        to: String,
        message: String,
    },
}

// ═══════════════════════════════════════════════════════════════════════════
// PLANIUS.IA TYPES (AI-powered project management)
// ═══════════════════════════════════════════════════════════════════════════

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlaniusConfig {
    pub api_key: String,
    pub endpoint: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIProjectAnalysis {
    pub project_health: f32, // 0.0 - 1.0
    pub predicted_completion: DateTime<Utc>,
    pub risk_factors: Vec<RiskFactor>,
    pub recommendations: Vec<Recommendation>,
    pub resource_optimization: ResourceOptimization,
    pub bottlenecks: Vec<Bottleneck>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskFactor {
    pub risk_type: RiskType,
    pub severity: f32, // 0.0 - 1.0
    pub description: String,
    pub mitigation: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RiskType {
    Schedule,
    Budget,
    Resources,
    Dependencies,
    Quality,
    Scope,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Recommendation {
    pub priority: Priority,
    pub category: String,
    pub description: String,
    pub impact: String,
    pub effort: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Priority {
    Critical,
    High,
    Medium,
    Low,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceOptimization {
    pub current_utilization: f32,
    pub optimal_allocation: HashMap<String, f32>,
    pub efficiency_score: f32,
    pub suggestions: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bottleneck {
    pub item_id: String,
    pub item_name: String,
    pub delay_days: i32,
    pub impact_score: f32,
    pub suggested_actions: Vec<String>,
}

// ═══════════════════════════════════════════════════════════════════════════
// INTEGRATION SERVICE
// ═══════════════════════════════════════════════════════════════════════════

pub struct ProjectManagementService {
    monday_config: MondayConfig,
    planius_config: Option<PlaniusConfig>,
    client: Client,
    boards: Arc<Mutex<HashMap<String, Board>>>,
    items: Arc<Mutex<HashMap<String, Item>>>,
    automations: Arc<Mutex<HashMap<String, Automation>>>,
}

impl ProjectManagementService {
    pub fn new(monday_config: MondayConfig, planius_config: Option<PlaniusConfig>) -> Result<Self> {
        let client = Client::builder()
            .timeout(std::time::Duration::from_secs(30))
            .build()?;

        Ok(Self {
            monday_config,
            planius_config,
            client,
            boards: Arc::new(Mutex::new(HashMap::new())),
            items: Arc::new(Mutex::new(HashMap::new())),
            automations: Arc::new(Mutex::new(HashMap::new())),
        })
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MONDAY.COM API METHODS
    // ═══════════════════════════════════════════════════════════════════════

    /// Execute GraphQL query
    async fn execute_query(
        &self,
        query: &str,
        variables: Option<serde_json::Value>,
    ) -> Result<serde_json::Value> {
        let url = "https://api.monday.com/v2";

        let mut payload = serde_json::json!({
            "query": query
        });

        if let Some(vars) = variables {
            payload["variables"] = vars;
        }

        let response = self
            .client
            .post(url)
            .header("Authorization", &self.monday_config.api_token)
            .header("API-Version", &self.monday_config.api_version)
            .header("Content-Type", "application/json")
            .json(&payload)
            .send()
            .await?;

        if response.status().is_success() {
            let result: serde_json::Value = response.json().await?;

            if let Some(errors) = result.get("errors") {
                error!("Monday.com GraphQL errors: {:?}", errors);
                return Err(anyhow!("GraphQL errors: {:?}", errors));
            }

            Ok(result["data"].clone())
        } else {
            let error_text = response.text().await?;
            Err(anyhow!("Monday.com API error: {}", error_text))
        }
    }

    /// Get all boards
    pub async fn get_boards(&self) -> Result<Vec<Board>> {
        let query = r#"
            query {
                boards {
                    id
                    name
                    description
                    board_kind
                    state
                    workspace_id
                    groups {
                        id
                        title
                        color
                        position
                        archived
                    }
                    columns {
                        id
                        title
                        type
                        settings_str
                        archived
                    }
                }
            }
        "#;

        let result = self.execute_query(query, None).await?;
        let boards: Vec<Board> = serde_json::from_value(result["boards"].clone())?;

        // Cache boards
        let mut cache = self.boards.lock().await;
        for board in &boards {
            cache.insert(board.id.clone(), board.clone());
        }

        info!("✅ Fetched {} boards from Monday.com", boards.len());
        Ok(boards)
    }

    /// Create board
    pub async fn create_board(
        &self,
        name: &str,
        board_kind: BoardKind,
        workspace_id: &str,
    ) -> Result<Board> {
        let query = r#"
            mutation ($board_name: String!, $board_kind: BoardKind!, $workspace_id: Int!) {
                create_board(
                    board_name: $board_name,
                    board_kind: $board_kind,
                    workspace_id: $workspace_id
                ) {
                    id
                    name
                    board_kind
                    workspace_id
                }
            }
        "#;

        let variables = serde_json::json!({
            "board_name": name,
            "board_kind": board_kind,
            "workspace_id": workspace_id.parse::<i32>().unwrap_or(0)
        });

        let result = self.execute_query(query, Some(variables)).await?;
        let board: Board = serde_json::from_value(result["create_board"].clone())?;

        // Cache board
        let mut cache = self.boards.lock().await;
        cache.insert(board.id.clone(), board.clone());

        info!("✅ Created board: {} (ID: {})", name, board.id);
        Ok(board)
    }

    /// Create item
    pub async fn create_item(
        &self,
        board_id: &str,
        group_id: &str,
        item_name: &str,
        column_values: Option<HashMap<String, ColumnValue>>,
    ) -> Result<Item> {
        let column_values_json = column_values
            .as_ref()
            .map(|cv| serde_json::to_string(cv).unwrap_or_default())
            .unwrap_or_else(|| "{}".to_string());

        let query = r#"
            mutation ($board_id: Int!, $group_id: String!, $item_name: String!, $column_values: JSON!) {
                create_item(
                    board_id: $board_id,
                    group_id: $group_id,
                    item_name: $item_name,
                    column_values: $column_values
                ) {
                    id
                    name
                    board { id }
                    group { id }
                }
            }
        "#;

        let variables = serde_json::json!({
            "board_id": board_id.parse::<i32>().unwrap_or(0),
            "group_id": group_id,
            "item_name": item_name,
            "column_values": column_values_json
        });

        let result = self.execute_query(query, Some(variables)).await?;
        let item_data = &result["create_item"];

        let item = Item {
            id: item_data["id"].as_str().unwrap_or("").to_string(),
            name: item_data["name"].as_str().unwrap_or("").to_string(),
            board_id: board_id.to_string(),
            group_id: group_id.to_string(),
            column_values: column_values.unwrap_or_default(),
            state: ItemState::Active,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            creator_id: "system".to_string(),
        };

        // Cache item
        let mut cache = self.items.lock().await;
        cache.insert(item.id.clone(), item.clone());

        info!("✅ Created item: {} (ID: {})", item_name, item.id);
        Ok(item)
    }

    /// Update item
    pub async fn update_item(
        &self,
        item_id: &str,
        column_values: HashMap<String, ColumnValue>,
    ) -> Result<()> {
        let column_values_json = serde_json::to_string(&column_values)?;

        let query = r#"
            mutation ($item_id: Int!, $column_values: JSON!) {
                change_multiple_column_values(
                    item_id: $item_id,
                    column_values: $column_values
                ) {
                    id
                }
            }
        "#;

        let variables = serde_json::json!({
            "item_id": item_id.parse::<i32>().unwrap_or(0),
            "column_values": column_values_json
        });

        self.execute_query(query, Some(variables)).await?;

        // Update cache
        let mut cache = self.items.lock().await;
        if let Some(item) = cache.get_mut(item_id) {
            item.column_values = column_values;
            item.updated_at = Utc::now();
        }

        info!("✅ Updated item: {}", item_id);
        Ok(())
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PLANIUS.IA METHODS
    // ═══════════════════════════════════════════════════════════════════════

    /// Analyze project with AI
    pub async fn analyze_project_with_ai(&self, board_id: &str) -> Result<AIProjectAnalysis> {
        let planius_config = self
            .planius_config
            .as_ref()
            .ok_or_else(|| anyhow!("Planius.ia not configured"))?;

        // Get board data
        let boards = self.boards.lock().await;
        let board = boards
            .get(board_id)
            .ok_or_else(|| anyhow!("Board not found"))?;

        // Get all items for this board
        let items = self.items.lock().await;
        let board_items: Vec<&Item> = items
            .values()
            .filter(|item| item.board_id == board_id)
            .collect();

        // Prepare data for AI analysis
        let analysis_payload = serde_json::json!({
            "board": board,
            "items": board_items,
            "analysis_type": "comprehensive"
        });

        // Call Planius.ia API
        let response = self
            .client
            .post(&planius_config.endpoint)
            .header(
                "Authorization",
                format!("Bearer {}", planius_config.api_key),
            )
            .header("Content-Type", "application/json")
            .json(&analysis_payload)
            .send()
            .await?;

        if response.status().is_success() {
            let analysis: AIProjectAnalysis = response.json().await?;
            info!("✅ AI analysis completed for board: {}", board_id);
            Ok(analysis)
        } else {
            let error_text = response.text().await?;
            Err(anyhow!("Planius.ia error: {}", error_text))
        }
    }

    /// Get AI recommendations
    pub async fn get_ai_recommendations(&self, board_id: &str) -> Result<Vec<Recommendation>> {
        let analysis = self.analyze_project_with_ai(board_id).await?;
        Ok(analysis.recommendations)
    }

    /// Get bottlenecks
    pub async fn get_bottlenecks(&self, board_id: &str) -> Result<Vec<Bottleneck>> {
        let analysis = self.analyze_project_with_ai(board_id).await?;
        Ok(analysis.bottlenecks)
    }

    // ═══════════════════════════════════════════════════════════════════════
    // AUTOMATION METHODS
    // ═══════════════════════════════════════════════════════════════════════

    /// Create automation
    pub async fn create_automation(
        &self,
        name: &str,
        board_id: &str,
        trigger: AutomationTrigger,
        conditions: Vec<AutomationCondition>,
        actions: Vec<AutomationAction>,
    ) -> Result<Automation> {
        let automation = Automation {
            id: uuid::Uuid::new_v4().to_string(),
            name: name.to_string(),
            board_id: board_id.to_string(),
            trigger,
            conditions,
            actions,
            enabled: true,
            created_at: Utc::now(),
        };

        // Store automation
        let mut cache = self.automations.lock().await;
        cache.insert(automation.id.clone(), automation.clone());

        info!("✅ Created automation: {} (ID: {})", name, automation.id);
        Ok(automation)
    }

    /// Execute automation with all supported action types
    /// 
    /// # Supported Automation Actions
    /// 
    /// | Action | Description | Status |
    /// |--------|-------------|--------|
    /// | `ChangeStatus` | Update a status column value | ✅ Implemented |
    /// | `CreateItem` | Create a new item in a board | ✅ Implemented |
    /// | `AssignPerson` | Assign a person to a column | ✅ Implemented |
    /// | `MoveItem` | Move item to different group | ✅ Implemented |
    /// | `SendNotification` | Send in-app notification | ✅ Implemented |
    /// | `SendEmail` | Send email via CUBE email service | 🔄 Planned |
    /// | `RunCubeWorkflow` | Trigger CUBE automation workflow | 🔄 Planned |
    /// | `SendWhatsApp` | Send WhatsApp message | 🔄 Planned |
    /// 
    /// # Arguments
    /// * `automation_id` - ID of the automation rule to execute
    /// * `item_id` - ID of the item that triggered the automation
    /// 
    /// # Returns
    /// * `Ok(())` - Automation executed successfully
    /// * `Err` - Automation not found or execution failed
    pub async fn execute_automation(&self, automation_id: &str, item_id: &str) -> Result<()> {
        let automations = self.automations.lock().await;
        let automation = automations
            .get(automation_id)
            .ok_or_else(|| anyhow!("Automation not found"))?
            .clone();

        if !automation.enabled {
            info!("⏸️ Automation {} is disabled, skipping", automation_id);
            return Ok(());
        }

        info!("🤖 Executing automation: {} for item: {}", automation_id, item_id);

        // Execute each action in sequence
        for action in &automation.actions {
            match action {
                AutomationAction::ChangeStatus {
                    column_id,
                    status_label,
                } => {
                    info!("📊 Changing status column {} to '{}'", column_id, status_label);
                    let mut column_values = HashMap::new();
                    column_values.insert(
                        column_id.clone(),
                        ColumnValue::Status {
                            label: status_label.clone(),
                            color: "#00c875".to_string(),
                        },
                    );
                    self.update_item(item_id, column_values).await?;
                }
                AutomationAction::CreateItem {
                    board_id,
                    group_id,
                    item_name,
                } => {
                    info!("➕ Creating new item '{}' in board {}", item_name, board_id);
                    self.create_item(board_id, group_id, item_name, None)
                        .await?;
                }
                AutomationAction::AssignPerson {
                    column_id,
                    person_id,
                } => {
                    info!("👤 Assigning person {} to column {}", person_id, column_id);
                    let mut column_values = HashMap::new();
                    column_values.insert(
                        column_id.clone(),
                        ColumnValue::Person {
                            persons_and_teams: vec![PersonTeam {
                                id: person_id.clone(),
                                kind: "person".to_string(),
                            }],
                        },
                    );
                    self.update_item(item_id, column_values).await?;
                }
                AutomationAction::MoveItem { to_group_id } => {
                    info!("📦 Moving item {} to group {}", item_id, to_group_id);
                    // Monday.com API mutation for moving items
                    let mutation = format!(
                        r#"mutation {{ move_item_to_group (item_id: {}, group_id: "{}") {{ id }} }}"#,
                        item_id, to_group_id
                    );
                    // Execute via Monday.com GraphQL API
                    self.execute_query(&mutation, None).await?;
                }
                AutomationAction::SendNotification {
                    recipient_id,
                    message,
                } => {
                    info!("🔔 Sending notification to {}: {}", recipient_id, message);
                    // Monday.com notification via create_notification mutation
                    let mutation = format!(
                        r#"mutation {{ create_notification (user_id: {}, target_id: {}, text: "{}", target_type: Item) {{ id }} }}"#,
                        recipient_id, item_id, message.replace('"', "\\\"")
                    );
                    // Execute via Monday.com GraphQL API
                    self.execute_query(&mutation, None).await?;
                }
                AutomationAction::SendEmail { to, subject, body } => {
                    // Email integration requires CUBE's email service
                    // This would typically use the email_service.rs module
                    info!("📧 Email action queued: to={}, subject={}", to, subject);
                    info!("   Note: Email sending requires CUBE email service integration");
                    info!("   Body preview: {}...", &body.chars().take(50).collect::<String>());
                    // Future: invoke email_service.send_email(to, subject, body)
                }
                AutomationAction::RunCubeWorkflow { workflow_id } => {
                    // CUBE workflow execution integration
                    info!("🔄 CUBE workflow trigger queued: {}", workflow_id);
                    info!("   Note: Workflow execution requires WorkflowScheduler integration");
                    // Future: scheduler.queue_workflow(workflow_id, context)
                }
                AutomationAction::SendWhatsApp { to, message } => {
                    // WhatsApp Business API integration
                    info!("💬 WhatsApp message queued: to={}", to);
                    info!("   Note: WhatsApp sending requires Business API integration");
                    info!("   Message preview: {}...", &message.chars().take(50).collect::<String>());
                    // Future: whatsapp_service.send_message(to, message)
                }
            }
        }

        info!("✅ Completed automation: {}", automation_id);
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_service_creation() {
        let config = MondayConfig {
            api_token: "test_token".to_string(),
            api_version: "2023-10".to_string(),
        };
        let service = ProjectManagementService::new(config, None);
        assert!(service.is_ok());
    }
}
