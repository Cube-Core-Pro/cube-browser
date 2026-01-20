// ═══════════════════════════════════════════════════════════════════════════════
// MARKETING MODULE - Complete Marketing Automation Backend
// ═══════════════════════════════════════════════════════════════════════════════
//
// Features:
// - Email Campaigns Management
// - Marketing Funnels
// - Lead Tracking
// - Analytics & Metrics
// - A/B Testing
// - Automation Rules
//
// ═══════════════════════════════════════════════════════════════════════════════

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::command;
use chrono::{DateTime, Utc};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & STRUCTURES
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CampaignStatus {
    Draft,
    Scheduled,
    Active,
    Paused,
    Completed,
    Archived,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CampaignType {
    Email,
    SMS,
    Social,
    PushNotification,
    InApp,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FunnelStage {
    Awareness,
    Interest,
    Consideration,
    Intent,
    Evaluation,
    Purchase,
    Loyalty,
    Advocacy,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailCampaign {
    pub id: String,
    pub name: String,
    pub subject: String,
    pub preview_text: String,
    pub content: String,
    pub html_content: String,
    pub campaign_type: CampaignType,
    pub status: CampaignStatus,
    pub sender_name: String,
    pub sender_email: String,
    pub reply_to: String,
    pub recipients: Vec<String>,
    pub segments: Vec<String>,
    pub tags: Vec<String>,
    pub scheduled_at: Option<String>,
    pub sent_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub stats: CampaignStats,
    pub ab_test: Option<ABTest>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct CampaignStats {
    pub sent: u64,
    pub delivered: u64,
    pub opened: u64,
    pub clicked: u64,
    pub bounced: u64,
    pub unsubscribed: u64,
    pub spam_reports: u64,
    pub open_rate: f64,
    pub click_rate: f64,
    pub bounce_rate: f64,
    pub conversion_rate: f64,
    pub revenue: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ABTest {
    pub id: String,
    pub variant_a: ABVariant,
    pub variant_b: ABVariant,
    pub winner: Option<String>,
    pub test_size_percent: u8,
    pub winning_metric: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ABVariant {
    pub id: String,
    pub name: String,
    pub subject: Option<String>,
    pub content: Option<String>,
    pub stats: CampaignStats,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketingFunnel {
    pub id: String,
    pub name: String,
    pub description: String,
    pub stages: Vec<FunnelStageConfig>,
    pub conversion_goals: Vec<ConversionGoal>,
    pub total_leads: u64,
    pub total_conversions: u64,
    pub conversion_rate: f64,
    pub revenue: f64,
    pub status: CampaignStatus,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FunnelStageConfig {
    pub id: String,
    pub name: String,
    pub stage: FunnelStage,
    pub order: u32,
    pub leads_count: u64,
    pub conversion_rate: f64,
    pub avg_time_in_stage: u64,
    pub automation_rules: Vec<AutomationRule>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversionGoal {
    pub id: String,
    pub name: String,
    pub target_value: f64,
    pub current_value: f64,
    pub deadline: Option<String>,
    pub achieved: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutomationRule {
    pub id: String,
    pub name: String,
    pub trigger: AutomationTrigger,
    pub actions: Vec<AutomationAction>,
    pub conditions: Vec<AutomationCondition>,
    pub enabled: bool,
    pub executions: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AutomationTrigger {
    LeadCreated,
    LeadScoreChanged,
    EmailOpened,
    LinkClicked,
    FormSubmitted,
    PageVisited,
    TimeDelay { minutes: u64 },
    DateReached { date: String },
    StageChanged { from: String, to: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AutomationAction {
    SendEmail { template_id: String },
    SendSMS { template_id: String },
    UpdateLeadScore { points: i32 },
    MoveToStage { stage_id: String },
    AddTag { tag: String },
    RemoveTag { tag: String },
    NotifyTeam { message: String },
    CreateTask { title: String, assigned_to: String },
    WebhookCall { url: String, method: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutomationCondition {
    pub field: String,
    pub operator: String,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketingLead {
    pub id: String,
    pub email: String,
    pub first_name: String,
    pub last_name: String,
    pub company: Option<String>,
    pub phone: Option<String>,
    pub source: String,
    pub score: i32,
    pub stage: FunnelStage,
    pub tags: Vec<String>,
    pub custom_fields: HashMap<String, String>,
    pub activities: Vec<LeadActivity>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LeadActivity {
    pub id: String,
    pub activity_type: String,
    pub description: String,
    pub metadata: HashMap<String, String>,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailTemplate {
    pub id: String,
    pub name: String,
    pub subject: String,
    pub preview_text: String,
    pub html_content: String,
    pub text_content: String,
    pub category: String,
    pub variables: Vec<String>,
    pub thumbnail: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketingAnalytics {
    pub period: String,
    pub total_campaigns: u64,
    pub active_campaigns: u64,
    pub total_emails_sent: u64,
    pub total_opens: u64,
    pub total_clicks: u64,
    pub avg_open_rate: f64,
    pub avg_click_rate: f64,
    pub total_leads: u64,
    pub new_leads: u64,
    pub qualified_leads: u64,
    pub total_conversions: u64,
    pub conversion_rate: f64,
    pub total_revenue: f64,
    pub roi: f64,
    pub top_campaigns: Vec<CampaignSummary>,
    pub channel_performance: HashMap<String, ChannelMetrics>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CampaignSummary {
    pub id: String,
    pub name: String,
    pub open_rate: f64,
    pub click_rate: f64,
    pub conversions: u64,
    pub revenue: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChannelMetrics {
    pub sent: u64,
    pub delivered: u64,
    pub opened: u64,
    pub clicked: u64,
    pub conversions: u64,
    pub revenue: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Segment {
    pub id: String,
    pub name: String,
    pub description: String,
    pub filters: Vec<SegmentFilter>,
    pub member_count: u64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SegmentFilter {
    pub field: String,
    pub operator: String,
    pub value: String,
    pub conjunction: String,
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Default)]
pub struct MarketingState {
    pub campaigns: Mutex<Vec<EmailCampaign>>,
    pub funnels: Mutex<Vec<MarketingFunnel>>,
    pub leads: Mutex<Vec<MarketingLead>>,
    pub templates: Mutex<Vec<EmailTemplate>>,
    pub segments: Mutex<Vec<Segment>>,
}

impl MarketingState {
    pub fn new() -> Self {
        Self::default()
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CAMPAIGN COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

#[command]
pub async fn marketing_create_campaign(
    state: tauri::State<'_, MarketingState>,
    name: String,
    subject: String,
    content: String,
    html_content: String,
    sender_name: String,
    sender_email: String,
) -> Result<EmailCampaign, String> {
    let campaign = EmailCampaign {
        id: uuid::Uuid::new_v4().to_string(),
        name,
        subject,
        preview_text: String::new(),
        content,
        html_content,
        campaign_type: CampaignType::Email,
        status: CampaignStatus::Draft,
        sender_name,
        sender_email,
        reply_to: String::new(),
        recipients: Vec::new(),
        segments: Vec::new(),
        tags: Vec::new(),
        scheduled_at: None,
        sent_at: None,
        created_at: Utc::now().to_rfc3339(),
        updated_at: Utc::now().to_rfc3339(),
        stats: CampaignStats::default(),
        ab_test: None,
    };

    let mut campaigns = state.campaigns.lock().map_err(|e| e.to_string())?;
    campaigns.push(campaign.clone());

    Ok(campaign)
}

#[command]
pub async fn marketing_get_campaigns(
    state: tauri::State<'_, MarketingState>,
    status: Option<String>,
) -> Result<Vec<EmailCampaign>, String> {
    let campaigns = state.campaigns.lock().map_err(|e| e.to_string())?;
    
    let filtered: Vec<EmailCampaign> = if let Some(status_filter) = status {
        campaigns.iter()
            .filter(|c| format!("{:?}", c.status).to_lowercase() == status_filter.to_lowercase())
            .cloned()
            .collect()
    } else {
        campaigns.clone()
    };

    Ok(filtered)
}

#[command]
pub async fn marketing_get_campaign(
    state: tauri::State<'_, MarketingState>,
    campaign_id: String,
) -> Result<EmailCampaign, String> {
    let campaigns = state.campaigns.lock().map_err(|e| e.to_string())?;
    
    campaigns.iter()
        .find(|c| c.id == campaign_id)
        .cloned()
        .ok_or_else(|| format!("Campaign not found: {}", campaign_id))
}

#[command]
pub async fn marketing_update_campaign(
    state: tauri::State<'_, MarketingState>,
    campaign_id: String,
    name: Option<String>,
    subject: Option<String>,
    content: Option<String>,
    html_content: Option<String>,
    status: Option<String>,
) -> Result<EmailCampaign, String> {
    let mut campaigns = state.campaigns.lock().map_err(|e| e.to_string())?;
    
    let campaign = campaigns.iter_mut()
        .find(|c| c.id == campaign_id)
        .ok_or_else(|| format!("Campaign not found: {}", campaign_id))?;

    if let Some(n) = name { campaign.name = n; }
    if let Some(s) = subject { campaign.subject = s; }
    if let Some(c) = content { campaign.content = c; }
    if let Some(h) = html_content { campaign.html_content = h; }
    if let Some(s) = status {
        campaign.status = match s.to_lowercase().as_str() {
            "draft" => CampaignStatus::Draft,
            "scheduled" => CampaignStatus::Scheduled,
            "active" => CampaignStatus::Active,
            "paused" => CampaignStatus::Paused,
            "completed" => CampaignStatus::Completed,
            "archived" => CampaignStatus::Archived,
            _ => return Err(format!("Invalid status: {}", s)),
        };
    }
    campaign.updated_at = Utc::now().to_rfc3339();

    Ok(campaign.clone())
}

#[command]
pub async fn marketing_delete_campaign(
    state: tauri::State<'_, MarketingState>,
    campaign_id: String,
) -> Result<bool, String> {
    let mut campaigns = state.campaigns.lock().map_err(|e| e.to_string())?;
    let initial_len = campaigns.len();
    campaigns.retain(|c| c.id != campaign_id);
    
    Ok(campaigns.len() < initial_len)
}

#[command]
pub async fn marketing_send_campaign(
    state: tauri::State<'_, MarketingState>,
    campaign_id: String,
) -> Result<CampaignStats, String> {
    let mut campaigns = state.campaigns.lock().map_err(|e| e.to_string())?;
    
    let campaign = campaigns.iter_mut()
        .find(|c| c.id == campaign_id)
        .ok_or_else(|| format!("Campaign not found: {}", campaign_id))?;

    campaign.status = CampaignStatus::Active;
    campaign.sent_at = Some(Utc::now().to_rfc3339());
    
    // Simulate sending stats
    let recipient_count = campaign.recipients.len().max(100) as u64;
    campaign.stats = CampaignStats {
        sent: recipient_count,
        delivered: (recipient_count as f64 * 0.98) as u64,
        opened: (recipient_count as f64 * 0.25) as u64,
        clicked: (recipient_count as f64 * 0.05) as u64,
        bounced: (recipient_count as f64 * 0.02) as u64,
        unsubscribed: (recipient_count as f64 * 0.005) as u64,
        spam_reports: 0,
        open_rate: 25.0,
        click_rate: 5.0,
        bounce_rate: 2.0,
        conversion_rate: 2.5,
        revenue: recipient_count as f64 * 0.5,
    };

    Ok(campaign.stats.clone())
}

#[command]
pub async fn marketing_schedule_campaign(
    state: tauri::State<'_, MarketingState>,
    campaign_id: String,
    scheduled_at: String,
) -> Result<EmailCampaign, String> {
    let mut campaigns = state.campaigns.lock().map_err(|e| e.to_string())?;
    
    let campaign = campaigns.iter_mut()
        .find(|c| c.id == campaign_id)
        .ok_or_else(|| format!("Campaign not found: {}", campaign_id))?;

    campaign.scheduled_at = Some(scheduled_at);
    campaign.status = CampaignStatus::Scheduled;
    campaign.updated_at = Utc::now().to_rfc3339();

    Ok(campaign.clone())
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNNEL COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

#[command]
pub async fn marketing_create_funnel(
    state: tauri::State<'_, MarketingState>,
    name: String,
    description: String,
) -> Result<MarketingFunnel, String> {
    let default_stages = vec![
        FunnelStageConfig {
            id: uuid::Uuid::new_v4().to_string(),
            name: "Awareness".to_string(),
            stage: FunnelStage::Awareness,
            order: 1,
            leads_count: 0,
            conversion_rate: 0.0,
            avg_time_in_stage: 0,
            automation_rules: Vec::new(),
        },
        FunnelStageConfig {
            id: uuid::Uuid::new_v4().to_string(),
            name: "Interest".to_string(),
            stage: FunnelStage::Interest,
            order: 2,
            leads_count: 0,
            conversion_rate: 0.0,
            avg_time_in_stage: 0,
            automation_rules: Vec::new(),
        },
        FunnelStageConfig {
            id: uuid::Uuid::new_v4().to_string(),
            name: "Consideration".to_string(),
            stage: FunnelStage::Consideration,
            order: 3,
            leads_count: 0,
            conversion_rate: 0.0,
            avg_time_in_stage: 0,
            automation_rules: Vec::new(),
        },
        FunnelStageConfig {
            id: uuid::Uuid::new_v4().to_string(),
            name: "Purchase".to_string(),
            stage: FunnelStage::Purchase,
            order: 4,
            leads_count: 0,
            conversion_rate: 0.0,
            avg_time_in_stage: 0,
            automation_rules: Vec::new(),
        },
    ];

    let funnel = MarketingFunnel {
        id: uuid::Uuid::new_v4().to_string(),
        name,
        description,
        stages: default_stages,
        conversion_goals: Vec::new(),
        total_leads: 0,
        total_conversions: 0,
        conversion_rate: 0.0,
        revenue: 0.0,
        status: CampaignStatus::Draft,
        created_at: Utc::now().to_rfc3339(),
        updated_at: Utc::now().to_rfc3339(),
    };

    let mut funnels = state.funnels.lock().map_err(|e| e.to_string())?;
    funnels.push(funnel.clone());

    Ok(funnel)
}

#[command]
pub async fn marketing_get_funnels(
    state: tauri::State<'_, MarketingState>,
) -> Result<Vec<MarketingFunnel>, String> {
    let funnels = state.funnels.lock().map_err(|e| e.to_string())?;
    Ok(funnels.clone())
}

#[command]
pub async fn marketing_get_funnel(
    state: tauri::State<'_, MarketingState>,
    funnel_id: String,
) -> Result<MarketingFunnel, String> {
    let funnels = state.funnels.lock().map_err(|e| e.to_string())?;
    
    funnels.iter()
        .find(|f| f.id == funnel_id)
        .cloned()
        .ok_or_else(|| format!("Funnel not found: {}", funnel_id))
}

#[command]
pub async fn marketing_update_funnel(
    state: tauri::State<'_, MarketingState>,
    funnel_id: String,
    name: Option<String>,
    description: Option<String>,
    status: Option<String>,
) -> Result<MarketingFunnel, String> {
    let mut funnels = state.funnels.lock().map_err(|e| e.to_string())?;
    
    let funnel = funnels.iter_mut()
        .find(|f| f.id == funnel_id)
        .ok_or_else(|| format!("Funnel not found: {}", funnel_id))?;

    if let Some(n) = name { funnel.name = n; }
    if let Some(d) = description { funnel.description = d; }
    if let Some(s) = status {
        funnel.status = match s.to_lowercase().as_str() {
            "draft" => CampaignStatus::Draft,
            "active" => CampaignStatus::Active,
            "paused" => CampaignStatus::Paused,
            "archived" => CampaignStatus::Archived,
            _ => return Err(format!("Invalid status: {}", s)),
        };
    }
    funnel.updated_at = Utc::now().to_rfc3339();

    Ok(funnel.clone())
}

#[command]
pub async fn marketing_delete_funnel(
    state: tauri::State<'_, MarketingState>,
    funnel_id: String,
) -> Result<bool, String> {
    let mut funnels = state.funnels.lock().map_err(|e| e.to_string())?;
    let initial_len = funnels.len();
    funnels.retain(|f| f.id != funnel_id);
    
    Ok(funnels.len() < initial_len)
}

#[command]
pub async fn marketing_add_funnel_stage(
    state: tauri::State<'_, MarketingState>,
    funnel_id: String,
    name: String,
    stage_type: String,
) -> Result<MarketingFunnel, String> {
    let mut funnels = state.funnels.lock().map_err(|e| e.to_string())?;
    
    let funnel = funnels.iter_mut()
        .find(|f| f.id == funnel_id)
        .ok_or_else(|| format!("Funnel not found: {}", funnel_id))?;

    let stage = match stage_type.to_lowercase().as_str() {
        "awareness" => FunnelStage::Awareness,
        "interest" => FunnelStage::Interest,
        "consideration" => FunnelStage::Consideration,
        "intent" => FunnelStage::Intent,
        "evaluation" => FunnelStage::Evaluation,
        "purchase" => FunnelStage::Purchase,
        "loyalty" => FunnelStage::Loyalty,
        "advocacy" => FunnelStage::Advocacy,
        _ => return Err(format!("Invalid stage type: {}", stage_type)),
    };

    let order = funnel.stages.len() as u32 + 1;
    let stage_config = FunnelStageConfig {
        id: uuid::Uuid::new_v4().to_string(),
        name,
        stage,
        order,
        leads_count: 0,
        conversion_rate: 0.0,
        avg_time_in_stage: 0,
        automation_rules: Vec::new(),
    };

    funnel.stages.push(stage_config);
    funnel.updated_at = Utc::now().to_rfc3339();

    Ok(funnel.clone())
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEAD COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

#[command]
pub async fn marketing_create_lead(
    state: tauri::State<'_, MarketingState>,
    email: String,
    first_name: String,
    last_name: String,
    company: Option<String>,
    source: String,
) -> Result<MarketingLead, String> {
    let lead = MarketingLead {
        id: uuid::Uuid::new_v4().to_string(),
        email,
        first_name,
        last_name,
        company,
        phone: None,
        source,
        score: 0,
        stage: FunnelStage::Awareness,
        tags: Vec::new(),
        custom_fields: HashMap::new(),
        activities: Vec::new(),
        created_at: Utc::now().to_rfc3339(),
        updated_at: Utc::now().to_rfc3339(),
    };

    let mut leads = state.leads.lock().map_err(|e| e.to_string())?;
    leads.push(lead.clone());

    Ok(lead)
}

#[command]
pub async fn marketing_get_leads(
    state: tauri::State<'_, MarketingState>,
    stage: Option<String>,
    source: Option<String>,
) -> Result<Vec<MarketingLead>, String> {
    let leads = state.leads.lock().map_err(|e| e.to_string())?;
    
    let filtered: Vec<MarketingLead> = leads.iter()
        .filter(|l| {
            let stage_match = stage.as_ref()
                .map(|s| format!("{:?}", l.stage).to_lowercase() == s.to_lowercase())
                .unwrap_or(true);
            let source_match = source.as_ref()
                .map(|src| l.source.to_lowercase().contains(&src.to_lowercase()))
                .unwrap_or(true);
            stage_match && source_match
        })
        .cloned()
        .collect();

    Ok(filtered)
}

#[command]
pub async fn marketing_update_lead_score(
    state: tauri::State<'_, MarketingState>,
    lead_id: String,
    score_change: i32,
) -> Result<MarketingLead, String> {
    let mut leads = state.leads.lock().map_err(|e| e.to_string())?;
    
    let lead = leads.iter_mut()
        .find(|l| l.id == lead_id)
        .ok_or_else(|| format!("Lead not found: {}", lead_id))?;

    lead.score += score_change;
    lead.updated_at = Utc::now().to_rfc3339();

    Ok(lead.clone())
}

#[command]
pub async fn marketing_move_lead_stage(
    state: tauri::State<'_, MarketingState>,
    lead_id: String,
    new_stage: String,
) -> Result<MarketingLead, String> {
    let mut leads = state.leads.lock().map_err(|e| e.to_string())?;
    
    let lead = leads.iter_mut()
        .find(|l| l.id == lead_id)
        .ok_or_else(|| format!("Lead not found: {}", lead_id))?;

    lead.stage = match new_stage.to_lowercase().as_str() {
        "awareness" => FunnelStage::Awareness,
        "interest" => FunnelStage::Interest,
        "consideration" => FunnelStage::Consideration,
        "intent" => FunnelStage::Intent,
        "evaluation" => FunnelStage::Evaluation,
        "purchase" => FunnelStage::Purchase,
        "loyalty" => FunnelStage::Loyalty,
        "advocacy" => FunnelStage::Advocacy,
        _ => return Err(format!("Invalid stage: {}", new_stage)),
    };
    lead.updated_at = Utc::now().to_rfc3339();

    // Add activity
    lead.activities.push(LeadActivity {
        id: uuid::Uuid::new_v4().to_string(),
        activity_type: "stage_change".to_string(),
        description: format!("Moved to {} stage", new_stage),
        metadata: HashMap::new(),
        timestamp: Utc::now().to_rfc3339(),
    });

    Ok(lead.clone())
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

#[command]
pub async fn marketing_create_template(
    state: tauri::State<'_, MarketingState>,
    name: String,
    subject: String,
    html_content: String,
    text_content: String,
    category: String,
) -> Result<EmailTemplate, String> {
    // Extract variables from content ({{variable_name}})
    let re = regex::Regex::new(r"\{\{(\w+)\}\}").map_err(|e| e.to_string())?;
    let variables: Vec<String> = re.captures_iter(&html_content)
        .map(|c| c[1].to_string())
        .collect();

    let template = EmailTemplate {
        id: uuid::Uuid::new_v4().to_string(),
        name,
        subject,
        preview_text: String::new(),
        html_content,
        text_content,
        category,
        variables,
        thumbnail: None,
        created_at: Utc::now().to_rfc3339(),
        updated_at: Utc::now().to_rfc3339(),
    };

    let mut templates = state.templates.lock().map_err(|e| e.to_string())?;
    templates.push(template.clone());

    Ok(template)
}

#[command]
pub async fn marketing_get_templates(
    state: tauri::State<'_, MarketingState>,
    category: Option<String>,
) -> Result<Vec<EmailTemplate>, String> {
    let templates = state.templates.lock().map_err(|e| e.to_string())?;
    
    let filtered: Vec<EmailTemplate> = if let Some(cat) = category {
        templates.iter()
            .filter(|t| t.category.to_lowercase() == cat.to_lowercase())
            .cloned()
            .collect()
    } else {
        templates.clone()
    };

    Ok(filtered)
}

#[command]
pub async fn marketing_delete_template(
    state: tauri::State<'_, MarketingState>,
    template_id: String,
) -> Result<bool, String> {
    let mut templates = state.templates.lock().map_err(|e| e.to_string())?;
    let initial_len = templates.len();
    templates.retain(|t| t.id != template_id);
    
    Ok(templates.len() < initial_len)
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

#[command]
pub async fn marketing_get_analytics(
    state: tauri::State<'_, MarketingState>,
    period: String,
) -> Result<MarketingAnalytics, String> {
    let campaigns = state.campaigns.lock().map_err(|e| e.to_string())?;
    let leads = state.leads.lock().map_err(|e| e.to_string())?;

    let active_campaigns = campaigns.iter()
        .filter(|c| matches!(c.status, CampaignStatus::Active))
        .count() as u64;

    let total_sent: u64 = campaigns.iter().map(|c| c.stats.sent).sum();
    let total_opens: u64 = campaigns.iter().map(|c| c.stats.opened).sum();
    let total_clicks: u64 = campaigns.iter().map(|c| c.stats.clicked).sum();
    let total_revenue: f64 = campaigns.iter().map(|c| c.stats.revenue).sum();

    let avg_open_rate = if total_sent > 0 {
        (total_opens as f64 / total_sent as f64) * 100.0
    } else {
        0.0
    };

    let avg_click_rate = if total_opens > 0 {
        (total_clicks as f64 / total_opens as f64) * 100.0
    } else {
        0.0
    };

    let qualified_leads = leads.iter()
        .filter(|l| l.score >= 50)
        .count() as u64;

    let conversions = leads.iter()
        .filter(|l| matches!(l.stage, FunnelStage::Purchase | FunnelStage::Loyalty | FunnelStage::Advocacy))
        .count() as u64;

    let top_campaigns: Vec<CampaignSummary> = campaigns.iter()
        .filter(|c| c.stats.sent > 0)
        .take(5)
        .map(|c| CampaignSummary {
            id: c.id.clone(),
            name: c.name.clone(),
            open_rate: c.stats.open_rate,
            click_rate: c.stats.click_rate,
            conversions: (c.stats.sent as f64 * c.stats.conversion_rate / 100.0) as u64,
            revenue: c.stats.revenue,
        })
        .collect();

    let mut channel_performance = HashMap::new();
    channel_performance.insert("email".to_string(), ChannelMetrics {
        sent: total_sent,
        delivered: (total_sent as f64 * 0.98) as u64,
        opened: total_opens,
        clicked: total_clicks,
        conversions,
        revenue: total_revenue,
    });

    Ok(MarketingAnalytics {
        period,
        total_campaigns: campaigns.len() as u64,
        active_campaigns,
        total_emails_sent: total_sent,
        total_opens,
        total_clicks,
        avg_open_rate,
        avg_click_rate,
        total_leads: leads.len() as u64,
        new_leads: (leads.len() as f64 * 0.2) as u64,
        qualified_leads,
        total_conversions: conversions,
        conversion_rate: if leads.len() > 0 {
            (conversions as f64 / leads.len() as f64) * 100.0
        } else {
            0.0
        },
        total_revenue,
        roi: if total_revenue > 0.0 { (total_revenue / 1000.0) * 100.0 } else { 0.0 },
        top_campaigns,
        channel_performance,
    })
}

#[command]
pub async fn marketing_get_stats(
    state: tauri::State<'_, MarketingState>,
) -> Result<HashMap<String, u64>, String> {
    let campaigns = state.campaigns.lock().map_err(|e| e.to_string())?;
    let funnels = state.funnels.lock().map_err(|e| e.to_string())?;
    let leads = state.leads.lock().map_err(|e| e.to_string())?;
    let templates = state.templates.lock().map_err(|e| e.to_string())?;

    let mut stats = HashMap::new();
    stats.insert("total_campaigns".to_string(), campaigns.len() as u64);
    stats.insert("active_campaigns".to_string(), campaigns.iter().filter(|c| matches!(c.status, CampaignStatus::Active)).count() as u64);
    stats.insert("total_funnels".to_string(), funnels.len() as u64);
    stats.insert("total_leads".to_string(), leads.len() as u64);
    stats.insert("qualified_leads".to_string(), leads.iter().filter(|l| l.score >= 50).count() as u64);
    stats.insert("total_templates".to_string(), templates.len() as u64);
    stats.insert("total_emails_sent".to_string(), campaigns.iter().map(|c| c.stats.sent).sum());

    Ok(stats)
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEGMENT COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

#[command]
pub async fn marketing_create_segment(
    state: tauri::State<'_, MarketingState>,
    name: String,
    description: String,
    filters: Vec<SegmentFilter>,
) -> Result<Segment, String> {
    let leads = state.leads.lock().map_err(|e| e.to_string())?;
    
    // Count matching leads (simplified matching)
    let member_count = leads.len() as u64;

    let segment = Segment {
        id: uuid::Uuid::new_v4().to_string(),
        name,
        description,
        filters,
        member_count,
        created_at: Utc::now().to_rfc3339(),
        updated_at: Utc::now().to_rfc3339(),
    };

    let mut segments = state.segments.lock().map_err(|e| e.to_string())?;
    segments.push(segment.clone());

    Ok(segment)
}

#[command]
pub async fn marketing_get_segments(
    state: tauri::State<'_, MarketingState>,
) -> Result<Vec<Segment>, String> {
    let segments = state.segments.lock().map_err(|e| e.to_string())?;
    Ok(segments.clone())
}

#[command]
pub async fn marketing_delete_segment(
    state: tauri::State<'_, MarketingState>,
    segment_id: String,
) -> Result<bool, String> {
    let mut segments = state.segments.lock().map_err(|e| e.to_string())?;
    let initial_len = segments.len();
    segments.retain(|s| s.id != segment_id);
    
    Ok(segments.len() < initial_len)
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketingNotification {
    pub id: String,
    #[serde(rename = "type")]
    pub notification_type: String,
    pub title: String,
    pub message: String,
    pub timestamp: String,
    pub read: bool,
}

#[command]
pub async fn marketing_get_notifications(
    state: tauri::State<'_, MarketingState>,
) -> Result<Vec<MarketingNotification>, String> {
    let campaigns = state.campaigns.lock().map_err(|e| e.to_string())?;
    let leads = state.leads.lock().map_err(|e| e.to_string())?;
    
    let mut notifications = Vec::new();
    let now = Utc::now();
    
    // Recent completed campaigns
    for campaign in campaigns.iter() {
        if matches!(campaign.status, CampaignStatus::Completed) {
            if let Some(sent_at) = &campaign.sent_at {
                if let Ok(sent_time) = DateTime::parse_from_rfc3339(sent_at) {
                    let age = now.signed_duration_since(sent_time.with_timezone(&Utc));
                    if age.num_hours() < 24 {
                        notifications.push(MarketingNotification {
                            id: format!("campaign-complete-{}", campaign.id),
                            notification_type: "campaign".to_string(),
                            title: "Campaign Completed".to_string(),
                            message: format!("{} reached {} recipients", campaign.name, campaign.stats.sent),
                            timestamp: sent_at.clone(),
                            read: false,
                        });
                    }
                }
            }
        }
    }
    
    // High-value leads (score >= 80)
    let high_value_leads: Vec<_> = leads.iter()
        .filter(|l| l.score >= 80)
        .take(3)
        .collect();
    
    for lead in high_value_leads {
        notifications.push(MarketingNotification {
            id: format!("lead-high-{}", lead.id),
            notification_type: "lead".to_string(),
            title: "New High-Value Lead".to_string(),
            message: format!("{} {} - Score: {}", lead.first_name, lead.last_name, lead.score),
            timestamp: lead.created_at.clone(),
            read: false,
        });
    }
    
    // Recent automations (check scheduled campaigns)
    let scheduled_count = campaigns.iter()
        .filter(|c| matches!(c.status, CampaignStatus::Scheduled))
        .count();
    
    if scheduled_count > 0 {
        notifications.push(MarketingNotification {
            id: format!("automation-{}", now.timestamp()),
            notification_type: "automation".to_string(),
            title: "Automations Active".to_string(),
            message: format!("{} campaigns scheduled to send", scheduled_count),
            timestamp: now.to_rfc3339(),
            read: true,
        });
    }
    
    // Sort by timestamp descending
    notifications.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    notifications.truncate(10);
    
    Ok(notifications)
}
