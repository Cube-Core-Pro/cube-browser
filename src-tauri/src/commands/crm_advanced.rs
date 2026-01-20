// ============================================================================
// CRM MODULE - Advanced Features Backend
// ============================================================================
// Email Writer, Lead Scoring, Pipeline, AI Sales Assistant

use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

// ============================================================================
// EMAIL WRITER TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EmailTemplate {
    pub id: String,
    pub name: String,
    pub subject: String,
    pub body: String,
    pub category: String,
    pub variables: Vec<String>,
    pub usage_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EmailWriterConfig {
    pub templates: Vec<EmailTemplate>,
    pub signatures: Vec<EmailSignature>,
    pub recent_emails: Vec<RecentEmail>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EmailSignature {
    pub id: String,
    pub name: String,
    pub content: String,
    pub is_default: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecentEmail {
    pub id: String,
    pub to: String,
    pub subject: String,
    pub sent_at: u64,
}

pub struct EmailWriterState {
    config: Mutex<EmailWriterConfig>,
}

impl Default for EmailWriterState {
    fn default() -> Self {
        let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
        Self {
            config: Mutex::new(EmailWriterConfig {
                templates: vec![
                    EmailTemplate { id: String::from("etpl-1"), name: String::from("Follow-up Email"), subject: String::from("Following up on our conversation"), body: String::from("Hi {{name}},\n\nI wanted to follow up on our recent conversation about {{topic}}.\n\nBest regards"), category: String::from("Sales"), variables: vec![String::from("name"), String::from("topic")], usage_count: 145 },
                    EmailTemplate { id: String::from("etpl-2"), name: String::from("Meeting Request"), subject: String::from("Meeting Request: {{topic}}"), body: String::from("Hi {{name}},\n\nI would like to schedule a meeting to discuss {{topic}}.\n\nWould {{time}} work for you?"), category: String::from("Scheduling"), variables: vec![String::from("name"), String::from("topic"), String::from("time")], usage_count: 89 },
                    EmailTemplate { id: String::from("etpl-3"), name: String::from("Thank You"), subject: String::from("Thank you for your time"), body: String::from("Dear {{name}},\n\nThank you for taking the time to meet with me today. I appreciated the opportunity to discuss {{topic}}."), category: String::from("General"), variables: vec![String::from("name"), String::from("topic")], usage_count: 67 },
                ],
                signatures: vec![
                    EmailSignature { id: String::from("sig-1"), name: String::from("Professional"), content: String::from("Best regards,\n{{your_name}}\n{{your_title}}\n{{company}}"), is_default: true },
                    EmailSignature { id: String::from("sig-2"), name: String::from("Casual"), content: String::from("Thanks!\n{{your_name}}"), is_default: false },
                ],
                recent_emails: vec![
                    RecentEmail { id: String::from("re-1"), to: String::from("john@company.com"), subject: String::from("Q4 Proposal"), sent_at: now - 3600 },
                    RecentEmail { id: String::from("re-2"), to: String::from("sarah@client.com"), subject: String::from("Follow-up meeting"), sent_at: now - 7200 },
                ],
            }),
        }
    }
}

#[tauri::command]
pub async fn get_email_writer_config(state: State<'_, EmailWriterState>) -> Result<EmailWriterConfig, String> {
    state.config.lock().map(|c| c.clone()).map_err(|e| format!("Lock error: {}", e))
}

#[tauri::command]
pub async fn delete_email_template(template_id: String, state: State<'_, EmailWriterState>) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    config.templates.retain(|t| t.id != template_id);
    Ok(())
}

// ============================================================================
// LEAD SCORING TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Lead {
    pub id: String,
    pub name: String,
    pub email: String,
    pub company: String,
    pub score: u32,
    pub status: String,
    pub source: String,
    pub last_activity: u64,
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScoringRule {
    pub id: String,
    pub name: String,
    pub condition: String,
    pub points: i32,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LeadScoringConfig {
    pub leads: Vec<Lead>,
    pub scoring_rules: Vec<ScoringRule>,
}

pub struct LeadScoringState {
    config: Mutex<LeadScoringConfig>,
}

impl Default for LeadScoringState {
    fn default() -> Self {
        let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
        Self {
            config: Mutex::new(LeadScoringConfig {
                leads: vec![
                    Lead { id: String::from("lead-1"), name: String::from("John Smith"), email: String::from("john@enterprise.com"), company: String::from("Enterprise Corp"), score: 85, status: String::from("hot"), source: String::from("website"), last_activity: now - 1800, tags: vec![String::from("enterprise"), String::from("demo-requested")] },
                    Lead { id: String::from("lead-2"), name: String::from("Sarah Johnson"), email: String::from("sarah@startup.io"), company: String::from("Startup.io"), score: 72, status: String::from("warm"), source: String::from("referral"), last_activity: now - 86400, tags: vec![String::from("startup"), String::from("pricing")] },
                    Lead { id: String::from("lead-3"), name: String::from("Mike Williams"), email: String::from("mike@tech.co"), company: String::from("TechCo"), score: 45, status: String::from("cold"), source: String::from("linkedin"), last_activity: now - 604800, tags: vec![String::from("tech")] },
                ],
                scoring_rules: vec![
                    ScoringRule { id: String::from("rule-1"), name: String::from("Email Opened"), condition: String::from("email.opened"), points: 5, is_active: true },
                    ScoringRule { id: String::from("rule-2"), name: String::from("Demo Requested"), condition: String::from("demo.requested"), points: 25, is_active: true },
                    ScoringRule { id: String::from("rule-3"), name: String::from("Pricing Page Visit"), condition: String::from("page.pricing"), points: 15, is_active: true },
                ],
            }),
        }
    }
}

#[tauri::command]
pub async fn get_lead_scoring_config(state: State<'_, LeadScoringState>) -> Result<LeadScoringConfig, String> {
    state.config.lock().map(|c| c.clone()).map_err(|e| format!("Lock error: {}", e))
}

#[tauri::command]
pub async fn toggle_scoring_rule(rule_id: String, active: bool, state: State<'_, LeadScoringState>) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    if let Some(rule) = config.scoring_rules.iter_mut().find(|r| r.id == rule_id) {
        rule.is_active = active;
    }
    Ok(())
}

// ============================================================================
// PIPELINE TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PipelineDeal {
    pub id: String,
    pub name: String,
    pub company: String,
    pub value: f64,
    pub stage: String,
    pub probability: u32,
    pub owner: String,
    pub created_at: u64,
    pub expected_close: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PipelineStage {
    pub id: String,
    pub name: String,
    pub order: u32,
    pub probability: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PipelineConfig {
    pub deals: Vec<PipelineDeal>,
    pub stages: Vec<PipelineStage>,
    pub total_value: f64,
}

pub struct PipelineState {
    config: Mutex<PipelineConfig>,
}

impl Default for PipelineState {
    fn default() -> Self {
        let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
        Self {
            config: Mutex::new(PipelineConfig {
                total_value: 247500.0,
                stages: vec![
                    PipelineStage { id: String::from("stage-1"), name: String::from("Prospecting"), order: 1, probability: 10 },
                    PipelineStage { id: String::from("stage-2"), name: String::from("Qualification"), order: 2, probability: 25 },
                    PipelineStage { id: String::from("stage-3"), name: String::from("Proposal"), order: 3, probability: 50 },
                    PipelineStage { id: String::from("stage-4"), name: String::from("Negotiation"), order: 4, probability: 75 },
                    PipelineStage { id: String::from("stage-5"), name: String::from("Closed Won"), order: 5, probability: 100 },
                ],
                deals: vec![
                    PipelineDeal { id: String::from("deal-1"), name: String::from("Enterprise License"), company: String::from("BigCorp Inc"), value: 125000.0, stage: String::from("Negotiation"), probability: 75, owner: String::from("John D."), created_at: now - 30 * 24 * 60 * 60, expected_close: now + 14 * 24 * 60 * 60 },
                    PipelineDeal { id: String::from("deal-2"), name: String::from("Team Package"), company: String::from("StartupXYZ"), value: 35000.0, stage: String::from("Proposal"), probability: 50, owner: String::from("Sarah M."), created_at: now - 15 * 24 * 60 * 60, expected_close: now + 30 * 24 * 60 * 60 },
                    PipelineDeal { id: String::from("deal-3"), name: String::from("Pro Subscription"), company: String::from("MidMarket Co"), value: 87500.0, stage: String::from("Qualification"), probability: 25, owner: String::from("Mike R."), created_at: now - 7 * 24 * 60 * 60, expected_close: now + 45 * 24 * 60 * 60 },
                ],
            }),
        }
    }
}

#[tauri::command]
pub async fn get_pipeline_config(state: State<'_, PipelineState>) -> Result<PipelineConfig, String> {
    state.config.lock().map(|c| c.clone()).map_err(|e| format!("Lock error: {}", e))
}

#[tauri::command]
pub async fn move_deal_stage(deal_id: String, stage_id: String, state: State<'_, PipelineState>) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    if let Some(deal) = config.deals.iter_mut().find(|d| d.id == deal_id) {
        deal.stage = stage_id;
    }
    Ok(())
}

// ============================================================================
// AI SALES ASSISTANT TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AISuggestion {
    pub id: String,
    pub suggestion_type: String,
    pub title: String,
    pub description: String,
    pub priority: String,
    pub related_lead_id: Option<String>,
    pub created_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AIInsight {
    pub id: String,
    pub insight_type: String,
    pub title: String,
    pub data: String,
    pub trend: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AISalesAssistantConfig {
    pub suggestions: Vec<AISuggestion>,
    pub insights: Vec<AIInsight>,
    pub is_enabled: bool,
}

pub struct AISalesAssistantState {
    config: Mutex<AISalesAssistantConfig>,
}

impl Default for AISalesAssistantState {
    fn default() -> Self {
        let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
        Self {
            config: Mutex::new(AISalesAssistantConfig {
                is_enabled: true,
                suggestions: vec![
                    AISuggestion { id: String::from("sug-1"), suggestion_type: String::from("follow-up"), title: String::from("Follow up with John Smith"), description: String::from("Last contacted 3 days ago, engagement score increased by 15%"), priority: String::from("high"), related_lead_id: Some(String::from("lead-1")), created_at: now - 3600 },
                    AISuggestion { id: String::from("sug-2"), suggestion_type: String::from("meeting"), title: String::from("Schedule demo with Enterprise Corp"), description: String::from("They visited pricing page 5 times this week"), priority: String::from("high"), related_lead_id: Some(String::from("lead-1")), created_at: now - 7200 },
                    AISuggestion { id: String::from("sug-3"), suggestion_type: String::from("content"), title: String::from("Send case study to Sarah"), description: String::from("Based on her industry, the FinTech case study may resonate"), priority: String::from("medium"), related_lead_id: Some(String::from("lead-2")), created_at: now - 10800 },
                ],
                insights: vec![
                    AIInsight { id: String::from("ins-1"), insight_type: String::from("metric"), title: String::from("Win Rate"), data: String::from("34%"), trend: String::from("up") },
                    AIInsight { id: String::from("ins-2"), insight_type: String::from("metric"), title: String::from("Avg Deal Size"), data: String::from("$45,000"), trend: String::from("up") },
                    AIInsight { id: String::from("ins-3"), insight_type: String::from("metric"), title: String::from("Avg Sales Cycle"), data: String::from("42 days"), trend: String::from("down") },
                ],
            }),
        }
    }
}

#[tauri::command]
pub async fn get_ai_sales_assistant_config(state: State<'_, AISalesAssistantState>) -> Result<AISalesAssistantConfig, String> {
    state.config.lock().map(|c| c.clone()).map_err(|e| format!("Lock error: {}", e))
}

#[tauri::command]
pub async fn dismiss_ai_suggestion(suggestion_id: String, state: State<'_, AISalesAssistantState>) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    config.suggestions.retain(|s| s.id != suggestion_id);
    Ok(())
}
