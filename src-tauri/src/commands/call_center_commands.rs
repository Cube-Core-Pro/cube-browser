// CUBE Nexum - AI Virtual Call Center Commands
// 
// Tauri commands for the AI-powered virtual call center
// that competes with RingCentral, Aircall, Five9, etc.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::RwLock;
use tauri::State;
use chrono::{DateTime, Utc};

// =============================================================================
// TYPES
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ChannelType {
    Voice,
    Sms,
    Whatsapp,
    Webchat,
    Email,
    Facebook,
    Instagram,
    Twitter,
    Telegram,
    Slack,
    Teams,
    Video,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ConversationStatus {
    Waiting,
    Active,
    OnHold,
    Transferred,
    Escalated,
    Resolved,
    Abandoned,
    Spam,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AgentType {
    Ai,
    Human,
    Hybrid,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AgentStatus {
    Available,
    Busy,
    Away,
    Offline,
    Dnd,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Priority {
    Low,
    Normal,
    High,
    Urgent,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Customer {
    pub id: String,
    pub external_id: Option<String>,
    pub name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub avatar: Option<String>,
    pub language: String,
    pub timezone: Option<String>,
    pub total_conversations: u32,
    pub average_sentiment: f32,
    pub last_contact_at: Option<String>,
    pub crm_id: Option<String>,
    pub custom_fields: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Message {
    pub id: String,
    pub conversation_id: String,
    pub sender_id: String,
    pub sender_type: String,
    pub sender_name: String,
    pub message_type: String,
    pub content: String,
    pub attachments: Vec<Attachment>,
    pub status: String,
    pub delivered_at: Option<String>,
    pub read_at: Option<String>,
    pub ai_generated: bool,
    pub ai_confidence: Option<f32>,
    pub sentiment: Option<f32>,
    pub timestamp: String,
    pub metadata: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Attachment {
    pub id: String,
    pub attachment_type: String,
    pub url: String,
    pub filename: String,
    pub mime_type: String,
    pub size: u64,
    pub thumbnail: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SentimentAnalysis {
    pub score: f32,
    pub magnitude: f32,
    pub label: String,
    pub confidence: f32,
    pub trend: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EmotionDetection {
    pub primary: String,
    pub secondary: Option<String>,
    pub confidence: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IntentDetection {
    pub primary: String,
    pub confidence: f32,
    pub alternatives: Vec<IntentAlternative>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IntentAlternative {
    pub intent: String,
    pub confidence: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AIAgent {
    pub id: String,
    pub name: String,
    pub agent_type: AgentType,
    pub status: AgentStatus,
    pub avatar: Option<String>,
    pub ai_config: Option<AIAgentConfig>,
    pub skills: Vec<AgentSkill>,
    pub knowledge_base: Vec<String>,
    pub metrics: AgentMetrics,
    pub assigned_channels: Vec<ChannelType>,
    pub assigned_queues: Vec<String>,
    pub max_concurrent_chats: u32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AIAgentConfig {
    pub enabled: bool,
    pub provider: String,
    pub model: String,
    pub personality: String,
    pub custom_personality: Option<String>,
    pub temperature: f32,
    pub max_tokens: u32,
    pub response_delay: u32,
    pub typing_indicator: bool,
    pub emotion_detection: bool,
    pub sentiment_adjustment: bool,
    pub escalation_threshold: f32,
    pub escalation_keywords: Vec<String>,
    pub auto_escalate_on_request: bool,
    pub primary_language: String,
    pub supported_languages: Vec<String>,
    pub auto_detect_language: bool,
    pub auto_translate: bool,
    pub content_filtering: bool,
    pub max_conversation_length: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentSkill {
    pub id: String,
    pub name: String,
    pub category: String,
    pub proficiency_level: u8,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentMetrics {
    pub total_conversations: u32,
    pub resolved_conversations: u32,
    pub escalated_conversations: u32,
    pub average_response_time: u64,
    pub average_handle_time: u64,
    pub customer_satisfaction: f32,
    pub sentiment_score: f32,
    pub first_contact_resolution: f32,
    pub conversions_generated: u32,
    pub revenue_generated: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Conversation {
    pub id: String,
    pub channel: ChannelType,
    pub channel_id: String,
    pub customer: Customer,
    pub agent: Option<AIAgent>,
    pub previous_agents: Vec<String>,
    pub status: ConversationStatus,
    pub priority: Priority,
    pub tags: Vec<String>,
    pub labels: Vec<String>,
    pub queue_id: Option<String>,
    pub queue_position: Option<u32>,
    pub wait_time: u64,
    pub messages: Vec<Message>,
    pub unread_count: u32,
    pub sentiment: SentimentAnalysis,
    pub intent: IntentDetection,
    pub summary: Option<String>,
    pub started_at: String,
    pub last_message_at: String,
    pub resolved_at: Option<String>,
    pub metadata: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Queue {
    pub id: String,
    pub name: String,
    pub description: String,
    pub channels: Vec<ChannelType>,
    pub routing_strategy: String,
    pub assigned_agents: Vec<String>,
    pub ai_agent_id: Option<String>,
    pub status: String,
    pub current_size: u32,
    pub average_wait_time: u64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CallCenterConfig {
    pub id: String,
    pub name: String,
    pub organization_id: String,
    pub default_language: String,
    pub supported_languages: Vec<String>,
    pub timezone: String,
    pub created_at: String,
    pub updated_at: String,
}

// =============================================================================
// STATE
// =============================================================================

pub struct CallCenterState {
    pub config: RwLock<Option<CallCenterConfig>>,
    pub conversations: RwLock<HashMap<String, Conversation>>,
    pub agents: RwLock<HashMap<String, AIAgent>>,
    pub queues: RwLock<HashMap<String, Queue>>,
}

impl Default for CallCenterState {
    fn default() -> Self {
        Self {
            config: RwLock::new(None),
            conversations: RwLock::new(HashMap::new()),
            agents: RwLock::new(HashMap::new()),
            queues: RwLock::new(HashMap::new()),
        }
    }
}

// =============================================================================
// COMMANDS - INITIALIZATION
// =============================================================================

#[tauri::command]
pub async fn call_center_load_config(
    organization_id: String,
    state: State<'_, CallCenterState>,
) -> Result<CallCenterConfig, String> {
    // In production, this would load from database/API
    let config = CallCenterConfig {
        id: format!("cc_{}", uuid::Uuid::new_v4()),
        name: "CUBE Call Center".to_string(),
        organization_id,
        default_language: "en".to_string(),
        supported_languages: vec!["en".to_string(), "es".to_string(), "pt".to_string()],
        timezone: "UTC".to_string(),
        created_at: Utc::now().to_rfc3339(),
        updated_at: Utc::now().to_rfc3339(),
    };

    *state.config.write().map_err(|e| e.to_string())? = Some(config.clone());
    
    Ok(config)
}

#[tauri::command]
pub async fn call_center_update_config(
    updates: serde_json::Value,
    state: State<'_, CallCenterState>,
) -> Result<(), String> {
    let mut config_guard = state.config.write().map_err(|e| e.to_string())?;
    
    if let Some(config) = config_guard.as_mut() {
        if let Some(name) = updates.get("name").and_then(|v| v.as_str()) {
            config.name = name.to_string();
        }
        if let Some(language) = updates.get("defaultLanguage").and_then(|v| v.as_str()) {
            config.default_language = language.to_string();
        }
        config.updated_at = Utc::now().to_rfc3339();
    }
    
    Ok(())
}

// =============================================================================
// COMMANDS - CONVERSATIONS
// =============================================================================

#[tauri::command]
pub async fn call_center_get_conversations(
    filters: Option<serde_json::Value>,
    pagination: Option<serde_json::Value>,
    state: State<'_, CallCenterState>,
) -> Result<serde_json::Value, String> {
    let conversations = state.conversations.read().map_err(|e| e.to_string())?;
    
    let mut result: Vec<&Conversation> = conversations.values().collect();
    
    // Apply filters
    if let Some(filters) = filters {
        if let Some(channel) = filters.get("channel").and_then(|v| v.as_str()) {
            result.retain(|c| {
                let channel_str = serde_json::to_string(&c.channel).unwrap_or_default();
                channel_str.contains(channel)
            });
        }
        if let Some(status) = filters.get("status").and_then(|v| v.as_str()) {
            result.retain(|c| {
                let status_str = serde_json::to_string(&c.status).unwrap_or_default();
                status_str.contains(status)
            });
        }
    }
    
    let total = result.len();
    
    // Apply pagination
    if let Some(pagination) = pagination {
        let page = pagination.get("page").and_then(|v| v.as_u64()).unwrap_or(1) as usize;
        let limit = pagination.get("limit").and_then(|v| v.as_u64()).unwrap_or(20) as usize;
        let start = (page - 1) * limit;
        result = result.into_iter().skip(start).take(limit).collect();
    }
    
    Ok(serde_json::json!({
        "conversations": result,
        "total": total
    }))
}

#[tauri::command]
pub async fn call_center_get_conversation(
    conversation_id: String,
    state: State<'_, CallCenterState>,
) -> Result<Conversation, String> {
    let conversations = state.conversations.read().map_err(|e| e.to_string())?;
    
    conversations
        .get(&conversation_id)
        .cloned()
        .ok_or_else(|| "Conversation not found".to_string())
}

#[tauri::command]
pub async fn call_center_start_conversation(
    channel: ChannelType,
    customer: serde_json::Value,
    initial_message: Option<String>,
    context: Option<serde_json::Value>,
    state: State<'_, CallCenterState>,
) -> Result<Conversation, String> {
    let conversation_id = format!("conv_{}", uuid::Uuid::new_v4());
    let now = Utc::now().to_rfc3339();
    
    let customer_data = Customer {
        id: format!("cust_{}", uuid::Uuid::new_v4()),
        external_id: customer.get("externalId").and_then(|v| v.as_str()).map(String::from),
        name: customer.get("name").and_then(|v| v.as_str()).map(String::from),
        email: customer.get("email").and_then(|v| v.as_str()).map(String::from),
        phone: customer.get("phone").and_then(|v| v.as_str()).map(String::from),
        avatar: None,
        language: customer.get("language").and_then(|v| v.as_str()).unwrap_or("en").to_string(),
        timezone: None,
        total_conversations: 1,
        average_sentiment: 0.0,
        last_contact_at: Some(now.clone()),
        crm_id: None,
        custom_fields: HashMap::new(),
    };
    
    let mut messages = Vec::new();
    
    if let Some(content) = initial_message {
        messages.push(Message {
            id: format!("msg_{}", uuid::Uuid::new_v4()),
            conversation_id: conversation_id.clone(),
            sender_id: customer_data.id.clone(),
            sender_type: "customer".to_string(),
            sender_name: customer_data.name.clone().unwrap_or_else(|| "Customer".to_string()),
            message_type: "text".to_string(),
            content,
            attachments: Vec::new(),
            status: "delivered".to_string(),
            delivered_at: Some(now.clone()),
            read_at: None,
            ai_generated: false,
            ai_confidence: None,
            sentiment: Some(0.0),
            timestamp: now.clone(),
            metadata: HashMap::new(),
        });
    }
    
    let conversation = Conversation {
        id: conversation_id.clone(),
        channel,
        channel_id: format!("ch_{}", uuid::Uuid::new_v4()),
        customer: customer_data,
        agent: None,
        previous_agents: Vec::new(),
        status: ConversationStatus::Waiting,
        priority: Priority::Normal,
        tags: Vec::new(),
        labels: Vec::new(),
        queue_id: None,
        queue_position: None,
        wait_time: 0,
        messages,
        unread_count: 1,
        sentiment: SentimentAnalysis {
            score: 0.0,
            magnitude: 0.0,
            label: "neutral".to_string(),
            confidence: 0.5,
            trend: "stable".to_string(),
        },
        intent: IntentDetection {
            primary: "general_inquiry".to_string(),
            confidence: 0.5,
            alternatives: Vec::new(),
        },
        summary: None,
        started_at: now.clone(),
        last_message_at: now,
        resolved_at: None,
        metadata: HashMap::new(),
    };
    
    state.conversations.write().map_err(|e| e.to_string())?
        .insert(conversation_id, conversation.clone());
    
    Ok(conversation)
}

#[tauri::command]
pub async fn call_center_update_conversation_status(
    conversation_id: String,
    status: ConversationStatus,
    resolution: Option<String>,
    state: State<'_, CallCenterState>,
) -> Result<(), String> {
    let mut conversations = state.conversations.write().map_err(|e| e.to_string())?;
    
    if let Some(conversation) = conversations.get_mut(&conversation_id) {
        conversation.status = status.clone();
        
        if matches!(status, ConversationStatus::Resolved) {
            conversation.resolved_at = Some(Utc::now().to_rfc3339());
            if let Some(res) = resolution {
                conversation.summary = Some(res);
            }
        }
        
        Ok(())
    } else {
        Err("Conversation not found".to_string())
    }
}

#[tauri::command]
pub async fn call_center_assign_conversation(
    conversation_id: String,
    agent_id: String,
    state: State<'_, CallCenterState>,
) -> Result<(), String> {
    let agents = state.agents.read().map_err(|e| e.to_string())?;
    let agent = agents.get(&agent_id).cloned();
    drop(agents);
    
    let mut conversations = state.conversations.write().map_err(|e| e.to_string())?;
    
    if let Some(conversation) = conversations.get_mut(&conversation_id) {
        conversation.agent = agent;
        conversation.status = ConversationStatus::Active;
        Ok(())
    } else {
        Err("Conversation not found".to_string())
    }
}

#[tauri::command]
pub async fn call_center_escalate_conversation(
    conversation_id: String,
    reason: String,
    state: State<'_, CallCenterState>,
) -> Result<(), String> {
    let mut conversations = state.conversations.write().map_err(|e| e.to_string())?;
    
    if let Some(conversation) = conversations.get_mut(&conversation_id) {
        conversation.status = ConversationStatus::Escalated;
        conversation.tags.push(format!("escalated:{}", reason));
        Ok(())
    } else {
        Err("Conversation not found".to_string())
    }
}

// =============================================================================
// COMMANDS - MESSAGES
// =============================================================================

#[tauri::command]
pub async fn call_center_send_message(
    conversation_id: String,
    content: String,
    message_type: Option<String>,
    attachments: Option<Vec<serde_json::Value>>,
    metadata: Option<serde_json::Value>,
    state: State<'_, CallCenterState>,
) -> Result<Message, String> {
    let mut conversations = state.conversations.write().map_err(|e| e.to_string())?;
    
    if let Some(conversation) = conversations.get_mut(&conversation_id) {
        let now = Utc::now().to_rfc3339();
        
        let message = Message {
            id: format!("msg_{}", uuid::Uuid::new_v4()),
            conversation_id: conversation_id.clone(),
            sender_id: conversation.agent.as_ref()
                .map(|a| a.id.clone())
                .unwrap_or_else(|| "system".to_string()),
            sender_type: "agent".to_string(),
            sender_name: conversation.agent.as_ref()
                .map(|a| a.name.clone())
                .unwrap_or_else(|| "Agent".to_string()),
            message_type: message_type.unwrap_or_else(|| "text".to_string()),
            content,
            attachments: Vec::new(),
            status: "sent".to_string(),
            delivered_at: None,
            read_at: None,
            ai_generated: false,
            ai_confidence: None,
            sentiment: None,
            timestamp: now.clone(),
            metadata: HashMap::new(),
        };
        
        conversation.messages.push(message.clone());
        conversation.last_message_at = now;
        
        Ok(message)
    } else {
        Err("Conversation not found".to_string())
    }
}

#[tauri::command]
pub async fn call_center_generate_ai_response(
    conversation_id: String,
    auto_send: bool,
    state: State<'_, CallCenterState>,
) -> Result<serde_json::Value, String> {
    // In production, this would call OpenAI/Claude API
    let conversations = state.conversations.read().map_err(|e| e.to_string())?;
    
    if let Some(conversation) = conversations.get(&conversation_id) {
        let last_message = conversation.messages.last()
            .map(|m| m.content.clone())
            .unwrap_or_default();
        
        // Mock AI response - in production this would use actual LLM
        let response = format!(
            "Thank you for reaching out! I understand you're asking about '{}'. How can I help you further?",
            last_message.chars().take(50).collect::<String>()
        );
        
        let confidence = 0.85;
        let suggestions = vec![
            "Would you like me to transfer you to a specialist?".to_string(),
            "Is there anything else I can help with?".to_string(),
            "Let me check our knowledge base for more information.".to_string(),
        ];
        
        if auto_send {
            drop(conversations);
            let mut conversations = state.conversations.write().map_err(|e| e.to_string())?;
            
            if let Some(conv) = conversations.get_mut(&conversation_id) {
                let now = Utc::now().to_rfc3339();
                
                let message = Message {
                    id: format!("msg_{}", uuid::Uuid::new_v4()),
                    conversation_id: conversation_id.clone(),
                    sender_id: conv.agent.as_ref()
                        .map(|a| a.id.clone())
                        .unwrap_or_else(|| "ai".to_string()),
                    sender_type: "agent".to_string(),
                    sender_name: conv.agent.as_ref()
                        .map(|a| a.name.clone())
                        .unwrap_or_else(|| "AI Assistant".to_string()),
                    message_type: "text".to_string(),
                    content: response.clone(),
                    attachments: Vec::new(),
                    status: "sent".to_string(),
                    delivered_at: None,
                    read_at: None,
                    ai_generated: true,
                    ai_confidence: Some(confidence),
                    sentiment: None,
                    timestamp: now.clone(),
                    metadata: HashMap::new(),
                };
                
                conv.messages.push(message);
                conv.last_message_at = now;
            }
        }
        
        Ok(serde_json::json!({
            "response": response,
            "confidence": confidence,
            "suggestions": suggestions
        }))
    } else {
        Err("Conversation not found".to_string())
    }
}

// =============================================================================
// COMMANDS - AGENTS
// =============================================================================

#[tauri::command]
pub async fn call_center_get_agents(
    filters: Option<serde_json::Value>,
    state: State<'_, CallCenterState>,
) -> Result<Vec<AIAgent>, String> {
    let agents = state.agents.read().map_err(|e| e.to_string())?;
    
    let mut result: Vec<AIAgent> = agents.values().cloned().collect();
    
    if let Some(filters) = filters {
        if let Some(agent_type) = filters.get("type").and_then(|v| v.as_str()) {
            result.retain(|a| {
                let type_str = serde_json::to_string(&a.agent_type).unwrap_or_default();
                type_str.contains(agent_type)
            });
        }
        if let Some(status) = filters.get("status").and_then(|v| v.as_str()) {
            result.retain(|a| {
                let status_str = serde_json::to_string(&a.status).unwrap_or_default();
                status_str.contains(status)
            });
        }
    }
    
    Ok(result)
}

#[tauri::command]
pub async fn call_center_update_agent_status(
    agent_id: String,
    status: AgentStatus,
    state: State<'_, CallCenterState>,
) -> Result<(), String> {
    let mut agents = state.agents.write().map_err(|e| e.to_string())?;
    
    if let Some(agent) = agents.get_mut(&agent_id) {
        agent.status = status;
        agent.updated_at = Utc::now().to_rfc3339();
        Ok(())
    } else {
        Err("Agent not found".to_string())
    }
}

#[tauri::command]
pub async fn call_center_create_ai_agent(
    config: serde_json::Value,
    state: State<'_, CallCenterState>,
) -> Result<AIAgent, String> {
    let now = Utc::now().to_rfc3339();
    let agent_id = format!("agent_{}", uuid::Uuid::new_v4());
    
    let agent = AIAgent {
        id: agent_id.clone(),
        name: config.get("name").and_then(|v| v.as_str()).unwrap_or("AI Agent").to_string(),
        agent_type: AgentType::Ai,
        status: AgentStatus::Available,
        avatar: None,
        ai_config: Some(AIAgentConfig {
            enabled: true,
            provider: "openai".to_string(),
            model: "gpt-4-turbo".to_string(),
            personality: "professional".to_string(),
            custom_personality: None,
            temperature: 0.7,
            max_tokens: 500,
            response_delay: 1000,
            typing_indicator: true,
            emotion_detection: true,
            sentiment_adjustment: true,
            escalation_threshold: -0.5,
            escalation_keywords: vec!["human".to_string(), "agent".to_string(), "supervisor".to_string()],
            auto_escalate_on_request: true,
            primary_language: "en".to_string(),
            supported_languages: vec!["en".to_string(), "es".to_string()],
            auto_detect_language: true,
            auto_translate: false,
            content_filtering: true,
            max_conversation_length: 100,
        }),
        skills: Vec::new(),
        knowledge_base: Vec::new(),
        metrics: AgentMetrics {
            total_conversations: 0,
            resolved_conversations: 0,
            escalated_conversations: 0,
            average_response_time: 0,
            average_handle_time: 0,
            customer_satisfaction: 0.0,
            sentiment_score: 0.0,
            first_contact_resolution: 0.0,
            conversions_generated: 0,
            revenue_generated: 0.0,
        },
        assigned_channels: vec![ChannelType::Webchat, ChannelType::Whatsapp],
        assigned_queues: Vec::new(),
        max_concurrent_chats: 10,
        created_at: now.clone(),
        updated_at: now,
    };
    
    state.agents.write().map_err(|e| e.to_string())?
        .insert(agent_id, agent.clone());
    
    Ok(agent)
}

#[tauri::command]
pub async fn call_center_update_ai_agent(
    agent_id: String,
    updates: serde_json::Value,
    state: State<'_, CallCenterState>,
) -> Result<(), String> {
    let mut agents = state.agents.write().map_err(|e| e.to_string())?;
    
    if let Some(agent) = agents.get_mut(&agent_id) {
        if let Some(name) = updates.get("name").and_then(|v| v.as_str()) {
            agent.name = name.to_string();
        }
        agent.updated_at = Utc::now().to_rfc3339();
        Ok(())
    } else {
        Err("Agent not found".to_string())
    }
}

// =============================================================================
// COMMANDS - QUEUES
// =============================================================================

#[tauri::command]
pub async fn call_center_get_queues(
    state: State<'_, CallCenterState>,
) -> Result<Vec<Queue>, String> {
    let queues = state.queues.read().map_err(|e| e.to_string())?;
    Ok(queues.values().cloned().collect())
}

#[tauri::command]
pub async fn call_center_create_queue(
    config: serde_json::Value,
    state: State<'_, CallCenterState>,
) -> Result<Queue, String> {
    let now = Utc::now().to_rfc3339();
    let queue_id = format!("queue_{}", uuid::Uuid::new_v4());
    
    let queue = Queue {
        id: queue_id.clone(),
        name: config.get("name").and_then(|v| v.as_str()).unwrap_or("New Queue").to_string(),
        description: config.get("description").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        channels: vec![ChannelType::Webchat],
        routing_strategy: "round_robin".to_string(),
        assigned_agents: Vec::new(),
        ai_agent_id: None,
        status: "active".to_string(),
        current_size: 0,
        average_wait_time: 0,
        created_at: now.clone(),
        updated_at: now,
    };
    
    state.queues.write().map_err(|e| e.to_string())?
        .insert(queue_id, queue.clone());
    
    Ok(queue)
}

#[tauri::command]
pub async fn call_center_update_queue(
    queue_id: String,
    updates: serde_json::Value,
    state: State<'_, CallCenterState>,
) -> Result<(), String> {
    let mut queues = state.queues.write().map_err(|e| e.to_string())?;
    
    if let Some(queue) = queues.get_mut(&queue_id) {
        if let Some(name) = updates.get("name").and_then(|v| v.as_str()) {
            queue.name = name.to_string();
        }
        queue.updated_at = Utc::now().to_rfc3339();
        Ok(())
    } else {
        Err("Queue not found".to_string())
    }
}

#[tauri::command]
pub async fn call_center_queue_stats(
    queue_id: String,
    state: State<'_, CallCenterState>,
) -> Result<serde_json::Value, String> {
    let queues = state.queues.read().map_err(|e| e.to_string())?;
    
    if let Some(queue) = queues.get(&queue_id) {
        Ok(serde_json::json!({
            "waiting": queue.current_size,
            "active": 0,
            "averageWaitTime": queue.average_wait_time,
            "slaCompliance": 95.0
        }))
    } else {
        Err("Queue not found".to_string())
    }
}

// =============================================================================
// COMMANDS - ANALYTICS
// =============================================================================

#[tauri::command]
pub async fn call_center_get_analytics(
    period: String,
    start_date: Option<String>,
    end_date: Option<String>,
    state: State<'_, CallCenterState>,
) -> Result<serde_json::Value, String> {
    // Mock analytics data - in production this would query actual metrics
    Ok(serde_json::json!({
        "period": period,
        "overview": {
            "totalConversations": 1234,
            "totalMessages": 5678,
            "uniqueCustomers": 890,
            "resolvedConversations": 1100,
            "escalatedConversations": 50,
            "abandonedConversations": 84,
            "averageFirstResponseTime": 23000,
            "averageHandleTime": 180000,
            "averageWaitTime": 45000,
            "aiHandledConversations": 900,
            "aiResolutionRate": 0.78,
            "aiAccuracyScore": 0.92,
            "csat": 4.6,
            "nps": 45,
            "sentiment": 0.35,
            "conversions": 123,
            "revenue": 45000.0,
            "costSavings": 12000.0
        }
    }))
}

#[tauri::command]
pub async fn call_center_agent_performance(
    agent_id: String,
    period: String,
    state: State<'_, CallCenterState>,
) -> Result<serde_json::Value, String> {
    let agents = state.agents.read().map_err(|e| e.to_string())?;
    
    if let Some(agent) = agents.get(&agent_id) {
        Ok(serde_json::json!({
            "conversations": agent.metrics.total_conversations,
            "resolutionRate": agent.metrics.first_contact_resolution,
            "averageHandleTime": agent.metrics.average_handle_time,
            "customerSatisfaction": agent.metrics.customer_satisfaction,
            "sentimentScore": agent.metrics.sentiment_score
        }))
    } else {
        Err("Agent not found".to_string())
    }
}

#[tauri::command]
pub async fn call_center_realtime_dashboard(
    state: State<'_, CallCenterState>,
) -> Result<serde_json::Value, String> {
    let conversations = state.conversations.read().map_err(|e| e.to_string())?;
    let agents = state.agents.read().map_err(|e| e.to_string())?;
    
    let active = conversations.values()
        .filter(|c| matches!(c.status, ConversationStatus::Active))
        .count();
    
    let waiting = conversations.values()
        .filter(|c| matches!(c.status, ConversationStatus::Waiting))
        .count();
    
    let online = agents.values()
        .filter(|a| matches!(a.status, AgentStatus::Available | AgentStatus::Busy))
        .count();
    
    Ok(serde_json::json!({
        "activeConversations": active,
        "waitingInQueue": waiting,
        "onlineAgents": online,
        "averageWaitTime": 45000,
        "currentSentiment": 0.35
    }))
}

// =============================================================================
// COMMANDS - MESSAGE ANALYSIS
// =============================================================================

#[tauri::command]
pub async fn call_center_analyze_message(
    message: String,
) -> Result<serde_json::Value, String> {
    // Mock analysis - in production this would use NLP/AI
    Ok(serde_json::json!({
        "sentiment": {
            "score": 0.2,
            "magnitude": 0.4,
            "label": "neutral",
            "confidence": 0.85,
            "trend": "stable"
        },
        "emotion": {
            "primary": "neutral",
            "secondary": null,
            "confidence": 0.75
        },
        "intent": {
            "primary": "inquiry",
            "confidence": 0.9,
            "alternatives": []
        }
    }))
}

#[tauri::command]
pub async fn call_center_sentiment_trend(
    conversation_id: String,
    state: State<'_, CallCenterState>,
) -> Result<serde_json::Value, String> {
    let conversations = state.conversations.read().map_err(|e| e.to_string())?;
    
    if let Some(conversation) = conversations.get(&conversation_id) {
        let trend: Vec<serde_json::Value> = conversation.messages.iter()
            .filter_map(|m| m.sentiment.map(|s| serde_json::json!({
                "timestamp": m.timestamp,
                "sentiment": s
            })))
            .collect();
        
        Ok(serde_json::json!({
            "trend": trend,
            "average": conversation.sentiment.score,
            "label": conversation.sentiment.label
        }))
    } else {
        Err("Conversation not found".to_string())
    }
}

// =============================================================================
// COMMANDS - VOICE (TWILIO)
// =============================================================================

#[tauri::command]
pub async fn call_center_initiate_call(
    phone_number: String,
    agent_id: Option<String>,
) -> Result<serde_json::Value, String> {
    // In production, this would use Twilio API
    Ok(serde_json::json!({
        "callSid": format!("CA{}", uuid::Uuid::new_v4().to_string().replace("-", "")),
        "status": "initiated"
    }))
}

#[tauri::command]
pub async fn call_center_answer_call(
    call_sid: String,
    agent_id: String,
) -> Result<(), String> {
    // In production, this would use Twilio API
    Ok(())
}

#[tauri::command]
pub async fn call_center_end_call(
    call_sid: String,
) -> Result<(), String> {
    // In production, this would use Twilio API
    Ok(())
}

#[tauri::command]
pub async fn call_center_transfer_call(
    call_sid: String,
    target_agent_id: String,
) -> Result<(), String> {
    // In production, this would use Twilio API
    Ok(())
}

#[tauri::command]
pub async fn call_center_call_transcription(
    call_sid: String,
) -> Result<serde_json::Value, String> {
    // In production, this would use speech-to-text API
    Ok(serde_json::json!({
        "transcript": "Hello, thank you for calling...",
        "segments": []
    }))
}

// =============================================================================
// COMMANDS - WHATSAPP
// =============================================================================

#[tauri::command]
pub async fn call_center_send_whatsapp_template(
    to: String,
    template_name: String,
    template_params: HashMap<String, String>,
    language: String,
) -> Result<serde_json::Value, String> {
    // In production, this would use WhatsApp Business API
    Ok(serde_json::json!({
        "messageId": format!("wamid.{}", uuid::Uuid::new_v4())
    }))
}

#[tauri::command]
pub async fn call_center_get_whatsapp_templates() -> Result<Vec<serde_json::Value>, String> {
    // In production, this would fetch from WhatsApp Business API
    Ok(vec![
        serde_json::json!({
            "name": "welcome_message",
            "language": "en",
            "status": "approved",
            "category": "MARKETING",
            "components": []
        }),
        serde_json::json!({
            "name": "order_confirmation",
            "language": "en",
            "status": "approved",
            "category": "TRANSACTIONAL",
            "components": []
        })
    ])
}

// =============================================================================
// COMMANDS - KNOWLEDGE BASE
// =============================================================================

#[tauri::command]
pub async fn call_center_search_knowledge(
    query: String,
    limit: u32,
) -> Result<Vec<serde_json::Value>, String> {
    // In production, this would use vector search/embeddings
    Ok(vec![
        serde_json::json!({
            "id": "kb_001",
            "title": "Getting Started Guide",
            "content": "Welcome to CUBE...",
            "relevance": 0.95
        }),
        serde_json::json!({
            "id": "kb_002",
            "title": "Pricing FAQ",
            "content": "Our pricing plans include...",
            "relevance": 0.87
        })
    ])
}

#[tauri::command]
pub async fn call_center_suggested_responses(
    conversation_id: String,
    state: State<'_, CallCenterState>,
) -> Result<Vec<serde_json::Value>, String> {
    // In production, this would use AI to generate suggestions
    Ok(vec![
        serde_json::json!({
            "response": "Thank you for your patience. Let me look into this for you.",
            "confidence": 0.92,
            "source": "ai"
        }),
        serde_json::json!({
            "response": "I'd be happy to help you with that!",
            "confidence": 0.88,
            "source": "template"
        }),
        serde_json::json!({
            "response": "Based on our documentation, the recommended approach is...",
            "confidence": 0.85,
            "source": "knowledge_base"
        })
    ])
}

// =============================================================================
// COMMANDS - ATTACHMENTS
// =============================================================================

#[tauri::command]
pub async fn call_center_upload_attachment(
    filename: String,
    mime_type: String,
    size: u64,
) -> Result<serde_json::Value, String> {
    // In production, this would upload to S3/cloud storage
    Ok(serde_json::json!({
        "url": format!("https://storage.cube.io/attachments/{}", uuid::Uuid::new_v4())
    }))
}
