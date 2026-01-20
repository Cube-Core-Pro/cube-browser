// CUBE Nexum Elite - Admin Helpdesk Management Commands
// Provides backend functionality for the Helpdesk Manager
// Features: Ticket management, customer support, SLA tracking

use serde::{Deserialize, Serialize};
use tauri::State;
use std::sync::Mutex;
use std::collections::HashMap;
use chrono::{DateTime, Utc, Duration, Datelike};
use uuid::Uuid;

// ============================================================
// TYPES - Helpdesk Data Structures
// ============================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Ticket {
    pub id: String,
    pub ticket_number: String,
    pub subject: String,
    pub description: String,
    pub category: TicketCategory,
    pub priority: TicketPriority,
    pub status: TicketStatus,
    pub customer: Customer,
    pub assignee: Option<Agent>,
    pub tags: Vec<String>,
    pub messages: Vec<TicketMessage>,
    pub attachments: Vec<Attachment>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub first_response_at: Option<DateTime<Utc>>,
    pub resolved_at: Option<DateTime<Utc>>,
    pub sla_status: SLAStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum TicketCategory {
    Technical,
    Billing,
    Feature,
    Bug,
    Account,
    General,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum TicketPriority {
    Low,
    Medium,
    High,
    Urgent,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum TicketStatus {
    Open,
    Pending,
    InProgress,
    OnHold,
    Resolved,
    Closed,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum SLAStatus {
    OnTrack,
    Warning,
    Breached,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Customer {
    pub id: String,
    pub name: String,
    pub email: String,
    pub company: Option<String>,
    pub plan: String,
    pub total_tickets: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Agent {
    pub id: String,
    pub name: String,
    pub email: String,
    pub role: AgentRole,
    pub status: AgentStatus,
    pub active_tickets: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum AgentRole {
    Agent,
    Senior,
    Lead,
    Manager,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum AgentStatus {
    Online,
    Away,
    Busy,
    Offline,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TicketMessage {
    pub id: String,
    pub content: String,
    pub sender: MessageSender,
    pub sender_name: String,
    pub created_at: DateTime<Utc>,
    pub is_internal: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum MessageSender {
    Customer,
    Agent,
    System,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Attachment {
    pub id: String,
    pub name: String,
    pub size: u64,
    pub mime_type: String,
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CannedResponse {
    pub id: String,
    pub title: String,
    pub content: String,
    pub category: String,
    pub tags: Vec<String>,
    pub usage_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HelpdeskStats {
    pub total_tickets: u64,
    pub open_tickets: u64,
    pub pending_tickets: u64,
    pub resolved_today: u64,
    pub avg_response_time: u64, // minutes
    pub avg_resolution_time: u64, // minutes
    pub customer_satisfaction: f64,
    pub sla_compliance: f64,
    pub tickets_by_category: HashMap<String, u64>,
    pub tickets_by_priority: HashMap<String, u64>,
}

// ============================================================
// STATE
// ============================================================

pub struct HelpdeskState {
    pub tickets: Mutex<HashMap<String, Ticket>>,
    pub agents: Mutex<HashMap<String, Agent>>,
    pub canned_responses: Mutex<Vec<CannedResponse>>,
    pub stats: Mutex<HelpdeskStats>,
    pub ticket_counter: Mutex<u32>,
}

impl Default for HelpdeskState {
    fn default() -> Self {
        let mut tickets = HashMap::new();
        let mut agents = HashMap::new();
        
        // Add sample agent
        let agent = Agent {
            id: "agent_1".to_string(),
            name: "Sarah Wilson".to_string(),
            email: "sarah@cubenexum.com".to_string(),
            role: AgentRole::Senior,
            status: AgentStatus::Online,
            active_tickets: 8,
        };
        agents.insert(agent.id.clone(), agent.clone());
        
        // Add sample ticket
        let ticket = Ticket {
            id: Uuid::new_v4().to_string(),
            ticket_number: "TKT-2024-001".to_string(),
            subject: "Cannot connect to browser automation".to_string(),
            description: "I am unable to connect to the browser automation feature.".to_string(),
            category: TicketCategory::Technical,
            priority: TicketPriority::High,
            status: TicketStatus::Open,
            customer: Customer {
                id: "cust_1".to_string(),
                name: "John Doe".to_string(),
                email: "john@example.com".to_string(),
                company: Some("Tech Corp".to_string()),
                plan: "Enterprise".to_string(),
                total_tickets: 5,
            },
            assignee: Some(agent),
            tags: vec!["browser".to_string(), "automation".to_string()],
            messages: vec![
                TicketMessage {
                    id: Uuid::new_v4().to_string(),
                    content: "I am unable to connect to the browser automation feature. It shows Connection timeout error.".to_string(),
                    sender: MessageSender::Customer,
                    sender_name: "John Doe".to_string(),
                    created_at: Utc::now() - Duration::hours(2),
                    is_internal: false,
                },
            ],
            attachments: Vec::new(),
            created_at: Utc::now() - Duration::hours(2),
            updated_at: Utc::now() - Duration::hours(1),
            first_response_at: None,
            resolved_at: None,
            sla_status: SLAStatus::OnTrack,
        };
        tickets.insert(ticket.id.clone(), ticket);
        
        // Sample canned responses
        let canned = vec![
            CannedResponse {
                id: Uuid::new_v4().to_string(),
                title: "Browser Connection Issue".to_string(),
                content: "Thank you for reaching out. Please try the following:\n1. Check your firewall settings\n2. Ensure port 9222 is not blocked\n3. Try disabling any VPN temporarily".to_string(),
                category: "technical".to_string(),
                tags: vec!["browser".to_string(), "connection".to_string()],
                usage_count: 45,
            },
            CannedResponse {
                id: Uuid::new_v4().to_string(),
                title: "License Upgrade Info".to_string(),
                content: "Thank you for your interest in upgrading! Here are the available plans:\n- Pro: $19/month\n- Elite: $49/month\n- Enterprise: Contact sales".to_string(),
                category: "billing".to_string(),
                tags: vec!["license".to_string(), "upgrade".to_string()],
                usage_count: 32,
            },
        ];
        
        Self {
            tickets: Mutex::new(tickets),
            agents: Mutex::new(agents),
            canned_responses: Mutex::new(canned),
            stats: Mutex::new(HelpdeskStats {
                total_tickets: 1,
                open_tickets: 1,
                pending_tickets: 0,
                resolved_today: 0,
                avg_response_time: 15,
                avg_resolution_time: 240,
                customer_satisfaction: 4.6,
                sla_compliance: 94.5,
                tickets_by_category: {
                    let mut m = HashMap::new();
                    m.insert("technical".to_string(), 1);
                    m
                },
                tickets_by_priority: {
                    let mut m = HashMap::new();
                    m.insert("high".to_string(), 1);
                    m
                },
            }),
            ticket_counter: Mutex::new(1),
        }
    }
}

// ============================================================
// COMMANDS
// ============================================================

#[derive(Debug, Deserialize)]
pub struct CreateTicketRequest {
    pub subject: String,
    pub description: String,
    pub category: TicketCategory,
    pub priority: TicketPriority,
    pub customer_id: String,
    pub customer_name: String,
    pub customer_email: String,
    pub tags: Option<Vec<String>>,
}

#[tauri::command]
pub async fn helpdesk_create_ticket(
    state: State<'_, HelpdeskState>,
    request: CreateTicketRequest,
) -> Result<Ticket, String> {
    let mut counter = state.ticket_counter.lock().map_err(|e| format!("Lock error: {}", e))?;
    *counter += 1;
    let ticket_number = format!("TKT-{}-{:03}", chrono::Utc::now().year(), *counter);
    drop(counter);
    
    let ticket = Ticket {
        id: Uuid::new_v4().to_string(),
        ticket_number,
        subject: request.subject,
        description: request.description.clone(),
        category: request.category.clone(),
        priority: request.priority.clone(),
        status: TicketStatus::Open,
        customer: Customer {
            id: request.customer_id,
            name: request.customer_name.clone(),
            email: request.customer_email,
            company: None,
            plan: "Unknown".to_string(),
            total_tickets: 1,
        },
        assignee: None,
        tags: request.tags.unwrap_or_default(),
        messages: vec![
            TicketMessage {
                id: Uuid::new_v4().to_string(),
                content: request.description,
                sender: MessageSender::Customer,
                sender_name: request.customer_name,
                created_at: Utc::now(),
                is_internal: false,
            }
        ],
        attachments: Vec::new(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        first_response_at: None,
        resolved_at: None,
        sla_status: SLAStatus::OnTrack,
    };
    
    let mut tickets = state.tickets.lock().map_err(|e| format!("Lock error: {}", e))?;
    let ticket_clone = ticket.clone();
    tickets.insert(ticket.id.clone(), ticket);
    
    // Update stats
    drop(tickets);
    let mut stats = state.stats.lock().map_err(|e| format!("Lock error: {}", e))?;
    stats.total_tickets += 1;
    stats.open_tickets += 1;
    
    let category_key = format!("{:?}", request.category).to_lowercase();
    *stats.tickets_by_category.entry(category_key).or_insert(0) += 1;
    
    let priority_key = format!("{:?}", request.priority).to_lowercase();
    *stats.tickets_by_priority.entry(priority_key).or_insert(0) += 1;
    
    Ok(ticket_clone)
}

#[tauri::command]
pub async fn helpdesk_get_tickets(
    state: State<'_, HelpdeskState>,
    status_filter: Option<String>,
    priority_filter: Option<String>,
    category_filter: Option<String>,
    assignee_filter: Option<String>,
    search_query: Option<String>,
) -> Result<Vec<Ticket>, String> {
    let tickets = state.tickets.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let filtered: Vec<Ticket> = tickets.values()
        .filter(|t| {
            let status_match = status_filter.as_ref()
                .map(|s| s == "all" || format!("{:?}", t.status).to_lowercase() == s.to_lowercase())
                .unwrap_or(true);
            let priority_match = priority_filter.as_ref()
                .map(|p| p == "all" || format!("{:?}", t.priority).to_lowercase() == p.to_lowercase())
                .unwrap_or(true);
            let category_match = category_filter.as_ref()
                .map(|c| c == "all" || format!("{:?}", t.category).to_lowercase() == c.to_lowercase())
                .unwrap_or(true);
            let assignee_match = assignee_filter.as_ref()
                .map(|a| a == "all" || t.assignee.as_ref().map(|ag| ag.id == *a).unwrap_or(false))
                .unwrap_or(true);
            let search_match = search_query.as_ref()
                .map(|q| {
                    let q_lower = q.to_lowercase();
                    t.subject.to_lowercase().contains(&q_lower) ||
                    t.ticket_number.to_lowercase().contains(&q_lower) ||
                    t.customer.name.to_lowercase().contains(&q_lower) ||
                    t.customer.email.to_lowercase().contains(&q_lower)
                })
                .unwrap_or(true);
            status_match && priority_match && category_match && assignee_match && search_match
        })
        .cloned()
        .collect();
    
    Ok(filtered)
}

#[tauri::command]
pub async fn helpdesk_get_ticket(
    state: State<'_, HelpdeskState>,
    ticket_id: String,
) -> Result<Option<Ticket>, String> {
    let tickets = state.tickets.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(tickets.get(&ticket_id).cloned())
}

#[tauri::command]
pub async fn helpdesk_assign_ticket(
    state: State<'_, HelpdeskState>,
    ticket_id: String,
    agent_id: String,
) -> Result<Ticket, String> {
    let agents = state.agents.lock().map_err(|e| format!("Lock error: {}", e))?;
    let agent = agents.get(&agent_id)
        .ok_or_else(|| "Agent not found".to_string())?
        .clone();
    drop(agents);
    
    let mut tickets = state.tickets.lock().map_err(|e| format!("Lock error: {}", e))?;
    let ticket = tickets.get_mut(&ticket_id)
        .ok_or_else(|| "Ticket not found".to_string())?;
    
    ticket.assignee = Some(agent);
    ticket.status = TicketStatus::InProgress;
    ticket.updated_at = Utc::now();
    
    Ok(ticket.clone())
}

#[tauri::command]
pub async fn helpdesk_add_reply(
    state: State<'_, HelpdeskState>,
    ticket_id: String,
    content: String,
    sender_id: String,
    sender_name: String,
    is_internal: bool,
) -> Result<Ticket, String> {
    let mut tickets = state.tickets.lock().map_err(|e| format!("Lock error: {}", e))?;
    let ticket = tickets.get_mut(&ticket_id)
        .ok_or_else(|| "Ticket not found".to_string())?;
    
    let is_agent = sender_id.starts_with("agent_");
    
    let message = TicketMessage {
        id: Uuid::new_v4().to_string(),
        content,
        sender: if is_agent { MessageSender::Agent } else { MessageSender::Customer },
        sender_name,
        created_at: Utc::now(),
        is_internal,
    };
    
    ticket.messages.push(message);
    ticket.updated_at = Utc::now();
    
    // Record first response time
    if is_agent && ticket.first_response_at.is_none() {
        ticket.first_response_at = Some(Utc::now());
    }
    
    // Update status if customer replied
    if !is_agent && ticket.status == TicketStatus::Pending {
        ticket.status = TicketStatus::Open;
    }
    
    Ok(ticket.clone())
}

#[tauri::command]
pub async fn helpdesk_update_status(
    state: State<'_, HelpdeskState>,
    ticket_id: String,
    new_status: TicketStatus,
) -> Result<Ticket, String> {
    let mut tickets = state.tickets.lock().map_err(|e| format!("Lock error: {}", e))?;
    let ticket = tickets.get_mut(&ticket_id)
        .ok_or_else(|| "Ticket not found".to_string())?;
    
    let old_status = ticket.status.clone();
    ticket.status = new_status.clone();
    ticket.updated_at = Utc::now();
    
    if new_status == TicketStatus::Resolved || new_status == TicketStatus::Closed {
        ticket.resolved_at = Some(Utc::now());
    }
    
    let ticket_clone = ticket.clone();
    drop(tickets);
    
    // Update stats
    let mut stats = state.stats.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    // Decrement old status count
    match old_status {
        TicketStatus::Open => if stats.open_tickets > 0 { stats.open_tickets -= 1; },
        TicketStatus::Pending => if stats.pending_tickets > 0 { stats.pending_tickets -= 1; },
        _ => {}
    }
    
    // Increment new status count
    match new_status {
        TicketStatus::Open => stats.open_tickets += 1,
        TicketStatus::Pending => stats.pending_tickets += 1,
        TicketStatus::Resolved | TicketStatus::Closed => stats.resolved_today += 1,
        _ => {}
    }
    
    Ok(ticket_clone)
}

#[tauri::command]
pub async fn helpdesk_update_priority(
    state: State<'_, HelpdeskState>,
    ticket_id: String,
    new_priority: TicketPriority,
) -> Result<Ticket, String> {
    let mut tickets = state.tickets.lock().map_err(|e| format!("Lock error: {}", e))?;
    let ticket = tickets.get_mut(&ticket_id)
        .ok_or_else(|| "Ticket not found".to_string())?;
    
    ticket.priority = new_priority;
    ticket.updated_at = Utc::now();
    
    Ok(ticket.clone())
}

#[tauri::command]
pub async fn helpdesk_get_agents(
    state: State<'_, HelpdeskState>,
) -> Result<Vec<Agent>, String> {
    let agents = state.agents.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(agents.values().cloned().collect())
}

#[tauri::command]
pub async fn helpdesk_get_canned_responses(
    state: State<'_, HelpdeskState>,
    category: Option<String>,
) -> Result<Vec<CannedResponse>, String> {
    let canned = state.canned_responses.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let filtered: Vec<CannedResponse> = canned.iter()
        .filter(|c| {
            category.as_ref()
                .map(|cat| cat == "all" || c.category == *cat)
                .unwrap_or(true)
        })
        .cloned()
        .collect();
    
    Ok(filtered)
}

#[tauri::command]
pub async fn helpdesk_create_canned_response(
    state: State<'_, HelpdeskState>,
    title: String,
    content: String,
    category: String,
    tags: Vec<String>,
) -> Result<CannedResponse, String> {
    let response = CannedResponse {
        id: Uuid::new_v4().to_string(),
        title,
        content,
        category,
        tags,
        usage_count: 0,
    };
    
    let response_clone = response.clone();
    
    let mut canned = state.canned_responses.lock().map_err(|e| format!("Lock error: {}", e))?;
    canned.push(response);
    
    Ok(response_clone)
}

#[tauri::command]
pub async fn helpdesk_use_canned_response(
    state: State<'_, HelpdeskState>,
    response_id: String,
) -> Result<CannedResponse, String> {
    let mut canned = state.canned_responses.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let response = canned.iter_mut()
        .find(|r| r.id == response_id)
        .ok_or_else(|| "Canned response not found".to_string())?;
    
    response.usage_count += 1;
    
    Ok(response.clone())
}

#[tauri::command]
pub async fn helpdesk_get_stats(
    state: State<'_, HelpdeskState>,
) -> Result<HelpdeskStats, String> {
    let stats = state.stats.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(stats.clone())
}

#[tauri::command]
pub async fn helpdesk_merge_tickets(
    state: State<'_, HelpdeskState>,
    primary_ticket_id: String,
    secondary_ticket_id: String,
) -> Result<Ticket, String> {
    let mut tickets = state.tickets.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let secondary = tickets.remove(&secondary_ticket_id)
        .ok_or_else(|| "Secondary ticket not found".to_string())?;
    
    let primary = tickets.get_mut(&primary_ticket_id)
        .ok_or_else(|| "Primary ticket not found".to_string())?;
    
    // Merge messages
    for msg in secondary.messages {
        let mut merged_msg = msg;
        merged_msg.content = format!("[Merged from {}] {}", secondary.ticket_number, merged_msg.content);
        primary.messages.push(merged_msg);
    }
    
    // Merge tags
    for tag in secondary.tags {
        if !primary.tags.contains(&tag) {
            primary.tags.push(tag);
        }
    }
    
    // Add system message about merge
    primary.messages.push(TicketMessage {
        id: Uuid::new_v4().to_string(),
        content: format!("Ticket {} was merged into this ticket.", secondary.ticket_number),
        sender: MessageSender::System,
        sender_name: "System".to_string(),
        created_at: Utc::now(),
        is_internal: true,
    });
    
    primary.updated_at = Utc::now();
    
    Ok(primary.clone())
}
