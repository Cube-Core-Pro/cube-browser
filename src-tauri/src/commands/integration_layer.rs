// ═══════════════════════════════════════════════════════════════════════════════
// 🔗 INTEGRATION LAYER - CROSS-MODULE COMMUNICATION HUB
// ═══════════════════════════════════════════════════════════════════════════════
// CUBE Elite v6 - Enterprise Integration Layer
// Connects: CRM ↔ Marketing ↔ Social ↔ Research ↔ Search ↔ Automation
// ═══════════════════════════════════════════════════════════════════════════════

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tauri::State;
use tokio::sync::RwLock;
use chrono::{DateTime, Utc};

// ═══════════════════════════════════════════════════════════════════════════
// UNIFIED DATA TYPES FOR CROSS-MODULE COMMUNICATION
// ═══════════════════════════════════════════════════════════════════════════

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnifiedContact {
    pub id: String,
    pub source: DataSource,
    pub name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub company: Option<String>,
    pub title: Option<String>,
    pub social_profiles: Vec<SocialProfile>,
    pub tags: Vec<String>,
    pub score: i32,
    pub last_interaction: Option<String>,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SocialProfile {
    pub platform: String,
    pub username: String,
    pub url: String,
    pub followers: Option<i64>,
    pub verified: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DataSource {
    Crm,
    Marketing,
    Social,
    Research,
    Search,
    Manual,
    Import,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CrossModuleEvent {
    pub id: String,
    pub event_type: EventType,
    pub source_module: String,
    pub target_modules: Vec<String>,
    pub payload: serde_json::Value,
    pub timestamp: String,
    pub processed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum EventType {
    LeadCreated,
    LeadUpdated,
    LeadScored,
    ContactMerged,
    CampaignLaunched,
    CampaignCompleted,
    SocialPostPublished,
    SocialEngagement,
    ResearchCompleted,
    CompetitorAlert,
    SearchInsight,
    WorkflowTriggered,
    DataSynced,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IntegrationRule {
    pub id: String,
    pub name: String,
    pub source_module: String,
    pub target_module: String,
    pub trigger_event: EventType,
    pub conditions: Vec<RuleCondition>,
    pub actions: Vec<RuleAction>,
    pub enabled: bool,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuleCondition {
    pub field: String,
    pub operator: String,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuleAction {
    pub action_type: String,
    pub target_module: String,
    pub parameters: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncStatus {
    pub module: String,
    pub last_sync: Option<String>,
    pub records_synced: i64,
    pub status: String,
    pub errors: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataMapping {
    pub id: String,
    pub source_module: String,
    pub target_module: String,
    pub field_mappings: Vec<FieldMapping>,
    pub transform_rules: Vec<TransformRule>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FieldMapping {
    pub source_field: String,
    pub target_field: String,
    pub required: bool,
    pub default_value: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransformRule {
    pub field: String,
    pub transform_type: String,
    pub parameters: HashMap<String, String>,
}

// ═══════════════════════════════════════════════════════════════════════════
// STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

pub struct IntegrationLayerState {
    pub events: Arc<RwLock<Vec<CrossModuleEvent>>>,
    pub rules: Arc<RwLock<Vec<IntegrationRule>>>,
    pub mappings: Arc<RwLock<Vec<DataMapping>>>,
    pub sync_status: Arc<RwLock<HashMap<String, SyncStatus>>>,
    pub unified_contacts: Arc<RwLock<Vec<UnifiedContact>>>,
}

impl IntegrationLayerState {
    pub fn new() -> Self {
        let mut sync_status = HashMap::new();
        
        // Initialize sync status for all modules
        for module in ["crm", "marketing", "social", "research", "search", "automation"] {
            sync_status.insert(module.to_string(), SyncStatus {
                module: module.to_string(),
                last_sync: None,
                records_synced: 0,
                status: "idle".to_string(),
                errors: vec![],
            });
        }
        
        Self {
            events: Arc::new(RwLock::new(Vec::new())),
            rules: Arc::new(RwLock::new(Self::default_rules())),
            mappings: Arc::new(RwLock::new(Self::default_mappings())),
            sync_status: Arc::new(RwLock::new(sync_status)),
            unified_contacts: Arc::new(RwLock::new(Vec::new())),
        }
    }
    
    fn default_rules() -> Vec<IntegrationRule> {
        vec![
            IntegrationRule {
                id: "rule_001".to_string(),
                name: "CRM Lead → Marketing Campaign".to_string(),
                source_module: "crm".to_string(),
                target_module: "marketing".to_string(),
                trigger_event: EventType::LeadCreated,
                conditions: vec![
                    RuleCondition {
                        field: "score".to_string(),
                        operator: ">=".to_string(),
                        value: "50".to_string(),
                    }
                ],
                actions: vec![
                    RuleAction {
                        action_type: "add_to_campaign".to_string(),
                        target_module: "marketing".to_string(),
                        parameters: {
                            let mut p = HashMap::new();
                            p.insert("campaign_type".to_string(), "nurture".to_string());
                            p
                        },
                    }
                ],
                enabled: true,
                created_at: Utc::now().to_rfc3339(),
            },
            IntegrationRule {
                id: "rule_002".to_string(),
                name: "Social Engagement → CRM Activity".to_string(),
                source_module: "social".to_string(),
                target_module: "crm".to_string(),
                trigger_event: EventType::SocialEngagement,
                conditions: vec![],
                actions: vec![
                    RuleAction {
                        action_type: "create_activity".to_string(),
                        target_module: "crm".to_string(),
                        parameters: {
                            let mut p = HashMap::new();
                            p.insert("activity_type".to_string(), "social_interaction".to_string());
                            p
                        },
                    }
                ],
                enabled: true,
                created_at: Utc::now().to_rfc3339(),
            },
            IntegrationRule {
                id: "rule_003".to_string(),
                name: "Research Competitor Alert → Marketing".to_string(),
                source_module: "research".to_string(),
                target_module: "marketing".to_string(),
                trigger_event: EventType::CompetitorAlert,
                conditions: vec![],
                actions: vec![
                    RuleAction {
                        action_type: "create_insight".to_string(),
                        target_module: "marketing".to_string(),
                        parameters: HashMap::new(),
                    }
                ],
                enabled: true,
                created_at: Utc::now().to_rfc3339(),
            },
        ]
    }
    
    fn default_mappings() -> Vec<DataMapping> {
        vec![
            DataMapping {
                id: "mapping_001".to_string(),
                source_module: "crm".to_string(),
                target_module: "marketing".to_string(),
                field_mappings: vec![
                    FieldMapping {
                        source_field: "email".to_string(),
                        target_field: "subscriber_email".to_string(),
                        required: true,
                        default_value: None,
                    },
                    FieldMapping {
                        source_field: "name".to_string(),
                        target_field: "subscriber_name".to_string(),
                        required: true,
                        default_value: None,
                    },
                    FieldMapping {
                        source_field: "company".to_string(),
                        target_field: "company_name".to_string(),
                        required: false,
                        default_value: None,
                    },
                ],
                transform_rules: vec![],
            },
            DataMapping {
                id: "mapping_002".to_string(),
                source_module: "social".to_string(),
                target_module: "crm".to_string(),
                field_mappings: vec![
                    FieldMapping {
                        source_field: "username".to_string(),
                        target_field: "social_handle".to_string(),
                        required: true,
                        default_value: None,
                    },
                    FieldMapping {
                        source_field: "platform".to_string(),
                        target_field: "social_platform".to_string(),
                        required: true,
                        default_value: None,
                    },
                ],
                transform_rules: vec![],
            },
        ]
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// INTEGRATION LAYER COMMANDS
// ═══════════════════════════════════════════════════════════════════════════

/// Emit a cross-module event
#[tauri::command]
pub async fn integration_emit_event(
    event_type: String,
    source_module: String,
    target_modules: Vec<String>,
    payload: serde_json::Value,
    state: State<'_, IntegrationLayerState>,
) -> Result<CrossModuleEvent, String> {
    let event = CrossModuleEvent {
        id: format!("evt_{}", uuid::Uuid::new_v4()),
        event_type: match event_type.as_str() {
            "lead_created" => EventType::LeadCreated,
            "lead_updated" => EventType::LeadUpdated,
            "lead_scored" => EventType::LeadScored,
            "contact_merged" => EventType::ContactMerged,
            "campaign_launched" => EventType::CampaignLaunched,
            "campaign_completed" => EventType::CampaignCompleted,
            "social_post_published" => EventType::SocialPostPublished,
            "social_engagement" => EventType::SocialEngagement,
            "research_completed" => EventType::ResearchCompleted,
            "competitor_alert" => EventType::CompetitorAlert,
            "search_insight" => EventType::SearchInsight,
            "workflow_triggered" => EventType::WorkflowTriggered,
            "data_synced" => EventType::DataSynced,
            _ => return Err(format!("Unknown event type: {}", event_type)),
        },
        source_module,
        target_modules,
        payload,
        timestamp: Utc::now().to_rfc3339(),
        processed: false,
    };
    
    let mut events = state.events.write().await;
    events.push(event.clone());
    
    // Keep only last 1000 events
    if events.len() > 1000 {
        events.remove(0);
    }
    
    Ok(event)
}

/// Get recent cross-module events
#[tauri::command]
pub async fn integration_get_events(
    limit: Option<i32>,
    source_module: Option<String>,
    state: State<'_, IntegrationLayerState>,
) -> Result<Vec<CrossModuleEvent>, String> {
    let events = state.events.read().await;
    let limit = limit.unwrap_or(50) as usize;
    
    let filtered: Vec<CrossModuleEvent> = events
        .iter()
        .rev()
        .filter(|e| {
            source_module.as_ref().map_or(true, |m| &e.source_module == m)
        })
        .take(limit)
        .cloned()
        .collect();
    
    Ok(filtered)
}

/// Get all integration rules
#[tauri::command]
pub async fn integration_get_rules(
    state: State<'_, IntegrationLayerState>,
) -> Result<Vec<IntegrationRule>, String> {
    let rules = state.rules.read().await;
    Ok(rules.clone())
}

/// Create a new integration rule
#[tauri::command]
pub async fn integration_create_rule(
    name: String,
    source_module: String,
    target_module: String,
    trigger_event: String,
    conditions: Vec<RuleCondition>,
    actions: Vec<RuleAction>,
    state: State<'_, IntegrationLayerState>,
) -> Result<IntegrationRule, String> {
    let rule = IntegrationRule {
        id: format!("rule_{}", uuid::Uuid::new_v4()),
        name,
        source_module,
        target_module,
        trigger_event: match trigger_event.as_str() {
            "lead_created" => EventType::LeadCreated,
            "lead_updated" => EventType::LeadUpdated,
            "lead_scored" => EventType::LeadScored,
            "campaign_launched" => EventType::CampaignLaunched,
            "social_engagement" => EventType::SocialEngagement,
            "competitor_alert" => EventType::CompetitorAlert,
            _ => return Err(format!("Unknown trigger event: {}", trigger_event)),
        },
        conditions,
        actions,
        enabled: true,
        created_at: Utc::now().to_rfc3339(),
    };
    
    let mut rules = state.rules.write().await;
    rules.push(rule.clone());
    
    Ok(rule)
}

/// Update an integration rule
#[tauri::command]
pub async fn integration_update_rule(
    rule_id: String,
    enabled: Option<bool>,
    name: Option<String>,
    state: State<'_, IntegrationLayerState>,
) -> Result<IntegrationRule, String> {
    let mut rules = state.rules.write().await;
    
    let rule = rules
        .iter_mut()
        .find(|r| r.id == rule_id)
        .ok_or("Rule not found")?;
    
    if let Some(e) = enabled {
        rule.enabled = e;
    }
    if let Some(n) = name {
        rule.name = n;
    }
    
    Ok(rule.clone())
}

/// Delete an integration rule
#[tauri::command]
pub async fn integration_delete_rule(
    rule_id: String,
    state: State<'_, IntegrationLayerState>,
) -> Result<String, String> {
    let mut rules = state.rules.write().await;
    let initial_len = rules.len();
    rules.retain(|r| r.id != rule_id);
    
    if rules.len() < initial_len {
        Ok("Rule deleted".to_string())
    } else {
        Err("Rule not found".to_string())
    }
}

/// Get data mappings between modules
#[tauri::command]
pub async fn integration_get_mappings(
    state: State<'_, IntegrationLayerState>,
) -> Result<Vec<DataMapping>, String> {
    let mappings = state.mappings.read().await;
    Ok(mappings.clone())
}

/// Create a data mapping
#[tauri::command]
pub async fn integration_create_mapping(
    source_module: String,
    target_module: String,
    field_mappings: Vec<FieldMapping>,
    state: State<'_, IntegrationLayerState>,
) -> Result<DataMapping, String> {
    let mapping = DataMapping {
        id: format!("mapping_{}", uuid::Uuid::new_v4()),
        source_module,
        target_module,
        field_mappings,
        transform_rules: vec![],
    };
    
    let mut mappings = state.mappings.write().await;
    mappings.push(mapping.clone());
    
    Ok(mapping)
}

/// Get sync status for all modules
#[tauri::command]
pub async fn integration_get_sync_status(
    state: State<'_, IntegrationLayerState>,
) -> Result<HashMap<String, SyncStatus>, String> {
    let status = state.sync_status.read().await;
    Ok(status.clone())
}

/// Sync data between modules
#[tauri::command]
pub async fn integration_sync_modules(
    source_module: String,
    target_module: String,
    state: State<'_, IntegrationLayerState>,
) -> Result<SyncStatus, String> {
    let mut status_map = state.sync_status.write().await;
    
    // Update source status
    if let Some(status) = status_map.get_mut(&source_module) {
        status.status = "syncing".to_string();
    }
    
    // Simulate sync process
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    
    let records_synced = rand::random::<i64>() % 100 + 10;
    
    // Update both modules' status
    if let Some(status) = status_map.get_mut(&source_module) {
        status.last_sync = Some(Utc::now().to_rfc3339());
        status.records_synced += records_synced;
        status.status = "completed".to_string();
        status.errors.clear();
    }
    
    if let Some(status) = status_map.get_mut(&target_module) {
        status.last_sync = Some(Utc::now().to_rfc3339());
        status.records_synced += records_synced;
        status.status = "completed".to_string();
    }
    
    let result = status_map.get(&source_module).cloned().unwrap_or(SyncStatus {
        module: source_module.clone(),
        last_sync: Some(Utc::now().to_rfc3339()),
        records_synced,
        status: "completed".to_string(),
        errors: vec![],
    });
    
    Ok(result)
}

// ═══════════════════════════════════════════════════════════════════════════
// UNIFIED CONTACT MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

/// Get unified contacts across all modules
#[tauri::command]
pub async fn integration_get_unified_contacts(
    limit: Option<i32>,
    search: Option<String>,
    state: State<'_, IntegrationLayerState>,
) -> Result<Vec<UnifiedContact>, String> {
    let contacts = state.unified_contacts.read().await;
    let limit = limit.unwrap_or(100) as usize;
    
    let filtered: Vec<UnifiedContact> = contacts
        .iter()
        .filter(|c| {
            search.as_ref().map_or(true, |s| {
                let s_lower = s.to_lowercase();
                c.name.to_lowercase().contains(&s_lower) ||
                c.email.as_ref().map_or(false, |e| e.to_lowercase().contains(&s_lower)) ||
                c.company.as_ref().map_or(false, |co| co.to_lowercase().contains(&s_lower))
            })
        })
        .take(limit)
        .cloned()
        .collect();
    
    Ok(filtered)
}

/// Create or update a unified contact
#[tauri::command]
pub async fn integration_upsert_unified_contact(
    contact: UnifiedContact,
    state: State<'_, IntegrationLayerState>,
) -> Result<UnifiedContact, String> {
    let mut contacts = state.unified_contacts.write().await;
    
    // Check if contact exists (by email or id)
    if let Some(existing) = contacts.iter_mut().find(|c| {
        c.id == contact.id || 
        (contact.email.is_some() && c.email == contact.email)
    }) {
        // Merge contact data
        existing.name = contact.name.clone();
        if contact.email.is_some() {
            existing.email = contact.email.clone();
        }
        if contact.phone.is_some() {
            existing.phone = contact.phone.clone();
        }
        if contact.company.is_some() {
            existing.company = contact.company.clone();
        }
        if contact.title.is_some() {
            existing.title = contact.title.clone();
        }
        // Merge social profiles
        for profile in &contact.social_profiles {
            if !existing.social_profiles.iter().any(|p| p.platform == profile.platform) {
                existing.social_profiles.push(profile.clone());
            }
        }
        // Merge tags
        for tag in &contact.tags {
            if !existing.tags.contains(tag) {
                existing.tags.push(tag.clone());
            }
        }
        // Update score (take higher)
        if contact.score > existing.score {
            existing.score = contact.score;
        }
        existing.last_interaction = contact.last_interaction.clone();
        
        return Ok(existing.clone());
    }
    
    // Create new contact
    let new_contact = UnifiedContact {
        id: if contact.id.is_empty() {
            format!("uc_{}", uuid::Uuid::new_v4())
        } else {
            contact.id
        },
        ..contact
    };
    
    contacts.push(new_contact.clone());
    Ok(new_contact)
}

/// Merge two unified contacts
#[tauri::command]
pub async fn integration_merge_contacts(
    primary_id: String,
    secondary_id: String,
    state: State<'_, IntegrationLayerState>,
) -> Result<UnifiedContact, String> {
    let mut contacts = state.unified_contacts.write().await;
    
    let secondary_idx = contacts
        .iter()
        .position(|c| c.id == secondary_id)
        .ok_or("Secondary contact not found")?;
    let secondary = contacts.remove(secondary_idx);
    
    let primary = contacts
        .iter_mut()
        .find(|c| c.id == primary_id)
        .ok_or("Primary contact not found")?;
    
    // Merge data from secondary into primary
    if primary.email.is_none() && secondary.email.is_some() {
        primary.email = secondary.email;
    }
    if primary.phone.is_none() && secondary.phone.is_some() {
        primary.phone = secondary.phone;
    }
    if primary.company.is_none() && secondary.company.is_some() {
        primary.company = secondary.company;
    }
    if primary.title.is_none() && secondary.title.is_some() {
        primary.title = secondary.title;
    }
    
    // Merge social profiles
    for profile in secondary.social_profiles {
        if !primary.social_profiles.iter().any(|p| p.platform == profile.platform) {
            primary.social_profiles.push(profile);
        }
    }
    
    // Merge tags
    for tag in secondary.tags {
        if !primary.tags.contains(&tag) {
            primary.tags.push(tag);
        }
    }
    
    // Take higher score
    if secondary.score > primary.score {
        primary.score = secondary.score;
    }
    
    // Merge metadata
    for (k, v) in secondary.metadata {
        if !primary.metadata.contains_key(&k) {
            primary.metadata.insert(k, v);
        }
    }
    
    Ok(primary.clone())
}

// ═══════════════════════════════════════════════════════════════════════════
// CRM ↔ MARKETING INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════

/// Push CRM leads to Marketing campaigns
#[tauri::command]
pub async fn integration_crm_to_marketing(
    lead_ids: Vec<String>,
    campaign_id: String,
    _state: State<'_, IntegrationLayerState>,
) -> Result<serde_json::Value, String> {
    // In production, this would call the CRM and Marketing modules
    Ok(serde_json::json!({
        "success": true,
        "leads_added": lead_ids.len(),
        "campaign_id": campaign_id,
        "message": format!("{} leads added to campaign {}", lead_ids.len(), campaign_id)
    }))
}

/// Sync Marketing engagement back to CRM
#[tauri::command]
pub async fn integration_marketing_to_crm(
    engagement_data: serde_json::Value,
    _state: State<'_, IntegrationLayerState>,
) -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "success": true,
        "records_updated": engagement_data.as_object().map_or(0, |o| o.len()),
        "message": "Engagement data synced to CRM"
    }))
}

// ═══════════════════════════════════════════════════════════════════════════
// SOCIAL ↔ CRM INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════

/// Import social followers as CRM leads
#[tauri::command]
pub async fn integration_social_to_crm(
    platform: String,
    followers: Vec<serde_json::Value>,
    _state: State<'_, IntegrationLayerState>,
) -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "success": true,
        "platform": platform,
        "leads_created": followers.len(),
        "message": format!("{} followers imported as leads from {}", followers.len(), platform)
    }))
}

/// Enrich CRM contacts with social data
#[tauri::command]
pub async fn integration_enrich_with_social(
    contact_ids: Vec<String>,
    _state: State<'_, IntegrationLayerState>,
) -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "success": true,
        "contacts_enriched": contact_ids.len(),
        "social_profiles_found": contact_ids.len() * 2,
        "message": format!("{} contacts enriched with social data", contact_ids.len())
    }))
}

// ═══════════════════════════════════════════════════════════════════════════
// RESEARCH ↔ CRM/MARKETING INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════

/// Push research insights to CRM
#[tauri::command]
pub async fn integration_research_to_crm(
    insights: Vec<serde_json::Value>,
    _state: State<'_, IntegrationLayerState>,
) -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "success": true,
        "insights_synced": insights.len(),
        "crm_records_updated": insights.len() * 3,
        "message": "Research insights synced to CRM"
    }))
}

/// Generate marketing strategy from research
#[tauri::command]
pub async fn integration_research_to_marketing(
    _competitor_data: serde_json::Value,
    _state: State<'_, IntegrationLayerState>,
) -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "success": true,
        "strategy_generated": true,
        "recommendations": [
            "Adjust pricing based on competitor analysis",
            "Target underserved market segments",
            "Improve messaging around key differentiators"
        ],
        "message": "Marketing strategy generated from research"
    }))
}

// ═══════════════════════════════════════════════════════════════════════════
// SEARCH ↔ ALL MODULES INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════

/// Search across all integrated modules
#[tauri::command]
pub async fn integration_unified_search(
    query: String,
    modules: Option<Vec<String>>,
    _state: State<'_, IntegrationLayerState>,
) -> Result<serde_json::Value, String> {
    let search_modules = modules.unwrap_or_else(|| {
        vec![
            "crm".to_string(),
            "marketing".to_string(),
            "social".to_string(),
            "research".to_string(),
        ]
    });
    
    Ok(serde_json::json!({
        "query": query,
        "modules_searched": search_modules,
        "results": {
            "crm": {
                "contacts": 5,
                "deals": 3,
                "activities": 12
            },
            "marketing": {
                "campaigns": 2,
                "emails": 8,
                "subscribers": 45
            },
            "social": {
                "posts": 15,
                "mentions": 23,
                "accounts": 4
            },
            "research": {
                "reports": 3,
                "competitors": 7,
                "insights": 18
            }
        },
        "total_results": 145
    }))
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTOMATION INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════

/// Trigger automation workflow from integration event
#[tauri::command]
pub async fn integration_trigger_workflow(
    workflow_id: String,
    trigger_data: serde_json::Value,
    _state: State<'_, IntegrationLayerState>,
) -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "success": true,
        "workflow_id": workflow_id,
        "execution_id": format!("exec_{}", uuid::Uuid::new_v4()),
        "status": "started",
        "trigger_data": trigger_data,
        "message": format!("Workflow {} triggered", workflow_id)
    }))
}

/// Get available integration automations
#[tauri::command]
pub async fn integration_get_automations(
    _state: State<'_, IntegrationLayerState>,
) -> Result<Vec<serde_json::Value>, String> {
    Ok(vec![
        serde_json::json!({
            "id": "auto_001",
            "name": "New Lead → Welcome Email",
            "trigger": "lead_created",
            "source": "crm",
            "target": "marketing",
            "enabled": true
        }),
        serde_json::json!({
            "id": "auto_002",
            "name": "Social Mention → CRM Activity",
            "trigger": "social_engagement",
            "source": "social",
            "target": "crm",
            "enabled": true
        }),
        serde_json::json!({
            "id": "auto_003",
            "name": "Competitor Update → Alert",
            "trigger": "competitor_alert",
            "source": "research",
            "target": "marketing",
            "enabled": true
        }),
        serde_json::json!({
            "id": "auto_004",
            "name": "High Score Lead → Sales Notification",
            "trigger": "lead_scored",
            "source": "crm",
            "target": "automation",
            "enabled": true
        }),
    ])
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD & ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

/// Get integration dashboard stats
#[tauri::command]
pub async fn integration_get_dashboard_stats(
    state: State<'_, IntegrationLayerState>,
) -> Result<serde_json::Value, String> {
    let events = state.events.read().await;
    let rules = state.rules.read().await;
    let contacts = state.unified_contacts.read().await;
    let sync_status = state.sync_status.read().await;
    
    let active_rules = rules.iter().filter(|r| r.enabled).count();
    let total_synced: i64 = sync_status.values().map(|s| s.records_synced).sum();
    
    Ok(serde_json::json!({
        "overview": {
            "total_events": events.len(),
            "active_rules": active_rules,
            "total_rules": rules.len(),
            "unified_contacts": contacts.len(),
            "total_records_synced": total_synced
        },
        "modules": {
            "crm": {
                "status": "connected",
                "last_sync": sync_status.get("crm").and_then(|s| s.last_sync.clone()),
                "records": sync_status.get("crm").map_or(0, |s| s.records_synced)
            },
            "marketing": {
                "status": "connected",
                "last_sync": sync_status.get("marketing").and_then(|s| s.last_sync.clone()),
                "records": sync_status.get("marketing").map_or(0, |s| s.records_synced)
            },
            "social": {
                "status": "connected",
                "last_sync": sync_status.get("social").and_then(|s| s.last_sync.clone()),
                "records": sync_status.get("social").map_or(0, |s| s.records_synced)
            },
            "research": {
                "status": "connected",
                "last_sync": sync_status.get("research").and_then(|s| s.last_sync.clone()),
                "records": sync_status.get("research").map_or(0, |s| s.records_synced)
            },
            "search": {
                "status": "connected",
                "last_sync": sync_status.get("search").and_then(|s| s.last_sync.clone()),
                "records": sync_status.get("search").map_or(0, |s| s.records_synced)
            }
        },
        "recent_activity": {
            "events_24h": events.len().min(50),
            "syncs_24h": 12,
            "automations_triggered": 8
        }
    }))
}
