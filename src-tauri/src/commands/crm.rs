// CUBE Nexum Elite - CRM Commands
// Complete CRM backend with contacts, companies, deals, activities, and AI insights

use serde::{Deserialize, Serialize};
use tauri::State;
use std::sync::Mutex;
use std::collections::HashMap;
use chrono::{DateTime, Utc, Duration};
use uuid::Uuid;

// ============================================================
// TYPES - CRM Data Structures
// ============================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Contact {
    pub id: String,
    pub first_name: String,
    pub last_name: String,
    pub email: String,
    pub phone: String,
    pub mobile: Option<String>,
    pub company: String,
    pub company_id: Option<String>,
    pub position: String,
    pub address: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub country: Option<String>,
    pub postal_code: Option<String>,
    pub source: String,
    pub status: ContactStatus,
    pub tags: Vec<String>,
    pub assigned_to: String,
    pub score: u32,
    pub last_contact: Option<DateTime<Utc>>,
    pub next_follow_up: Option<DateTime<Utc>>,
    pub total_deals: u32,
    pub total_value: u64,
    pub notes: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub favorite: bool,
    pub avatar: Option<String>,
    pub social_profiles: Option<SocialProfiles>,
    pub custom_fields: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ContactStatus {
    Lead,
    Prospect,
    Customer,
    Churned,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SocialProfiles {
    pub linkedin: Option<String>,
    pub twitter: Option<String>,
    pub facebook: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Company {
    pub id: String,
    pub name: String,
    pub industry: String,
    pub website: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub country: Option<String>,
    pub postal_code: Option<String>,
    pub size: CompanySize,
    pub annual_revenue: Option<u64>,
    pub employees: Option<u32>,
    pub description: Option<String>,
    pub logo: Option<String>,
    pub tags: Vec<String>,
    pub assigned_to: String,
    pub total_contacts: u32,
    pub total_deals: u32,
    pub total_value: u64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum CompanySize {
    Startup,
    Small,
    Medium,
    Large,
    Enterprise,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Deal {
    pub id: String,
    pub name: String,
    pub value: u64,
    pub stage: DealStage,
    pub probability: u32,
    pub contact_id: String,
    pub contact_name: String,
    pub company_id: Option<String>,
    pub company_name: String,
    pub expected_close: DateTime<Utc>,
    pub actual_close: Option<DateTime<Utc>>,
    pub assigned_to: String,
    pub source: String,
    pub description: Option<String>,
    pub products: Vec<DealProduct>,
    pub lost_reason: Option<String>,
    pub last_activity: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum DealStage {
    Lead,
    Qualified,
    Proposal,
    Negotiation,
    ClosedWon,
    ClosedLost,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DealProduct {
    pub name: String,
    pub quantity: u32,
    pub price: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Activity {
    pub id: String,
    pub activity_type: ActivityType,
    pub title: String,
    pub description: String,
    pub contact_id: Option<String>,
    pub contact_name: Option<String>,
    pub company_id: Option<String>,
    pub deal_id: Option<String>,
    pub assigned_to: String,
    pub due_date: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub status: ActivityStatus,
    pub priority: ActivityPriority,
    pub notes: Option<String>,
    pub outcome: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ActivityType {
    Call,
    Email,
    Meeting,
    Task,
    Note,
    Follow,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ActivityStatus {
    Pending,
    Completed,
    Overdue,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ActivityPriority {
    Low,
    Medium,
    High,
    Urgent,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Pipeline {
    pub id: String,
    pub name: String,
    pub stages: Vec<PipelineStage>,
    pub is_default: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PipelineStage {
    pub id: String,
    pub name: String,
    pub probability: u32,
    pub order: u32,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CRMStats {
    pub total_contacts: u64,
    pub contacts_this_month: u64,
    pub contacts_growth: f64,
    pub total_companies: u64,
    pub companies_growth: f64,
    pub total_deals: u64,
    pub open_deals: u64,
    pub deals_value: u64,
    pub deals_growth: f64,
    pub won_this_month: u64,
    pub won_value: u64,
    pub lost_this_month: u64,
    pub win_rate: f64,
    pub avg_deal_size: u64,
    pub avg_sales_cycle: u32,
    pub revenue_forecast: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIInsight {
    pub id: String,
    pub insight_type: InsightType,
    pub title: String,
    pub description: String,
    pub impact: ImpactLevel,
    pub actionable: bool,
    pub action: Option<String>,
    pub related_id: Option<String>,
    pub related_type: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum InsightType {
    Opportunity,
    Risk,
    Recommendation,
    Prediction,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ImpactLevel {
    Low,
    Medium,
    High,
    Critical,
}

// ============================================================
// STATE - CRM State Management
// ============================================================

pub struct CRMState {
    pub contacts: Mutex<HashMap<String, Contact>>,
    pub companies: Mutex<HashMap<String, Company>>,
    pub deals: Mutex<HashMap<String, Deal>>,
    pub activities: Mutex<HashMap<String, Activity>>,
    pub pipelines: Mutex<HashMap<String, Pipeline>>,
    pub insights: Mutex<Vec<AIInsight>>,
}

impl Default for CRMState {
    fn default() -> Self {
        let mut pipelines = HashMap::new();
        
        // Create default sales pipeline
        let default_pipeline = Pipeline {
            id: "default".to_string(),
            name: "Sales Pipeline".to_string(),
            stages: vec![
                PipelineStage { id: "lead".to_string(), name: "Lead".to_string(), probability: 10, order: 1, color: "#6b7280".to_string() },
                PipelineStage { id: "qualified".to_string(), name: "Qualified".to_string(), probability: 25, order: 2, color: "#3b82f6".to_string() },
                PipelineStage { id: "proposal".to_string(), name: "Proposal".to_string(), probability: 50, order: 3, color: "#f59e0b".to_string() },
                PipelineStage { id: "negotiation".to_string(), name: "Negotiation".to_string(), probability: 75, order: 4, color: "#8b5cf6".to_string() },
                PipelineStage { id: "closed_won".to_string(), name: "Closed Won".to_string(), probability: 100, order: 5, color: "#10b981".to_string() },
                PipelineStage { id: "closed_lost".to_string(), name: "Closed Lost".to_string(), probability: 0, order: 6, color: "#ef4444".to_string() },
            ],
            is_default: true,
            created_at: Utc::now(),
        };
        
        pipelines.insert(default_pipeline.id.clone(), default_pipeline);
        
        Self {
            contacts: Mutex::new(HashMap::new()),
            companies: Mutex::new(HashMap::new()),
            deals: Mutex::new(HashMap::new()),
            activities: Mutex::new(HashMap::new()),
            pipelines: Mutex::new(pipelines),
            insights: Mutex::new(Vec::new()),
        }
    }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

fn calculate_contact_score(contact: &Contact, deals: &HashMap<String, Deal>, activities: &HashMap<String, Activity>) -> u32 {
    let mut score: u32 = 50; // Base score
    
    // Engagement score (recent contact)
    if let Some(last_contact) = contact.last_contact {
        let days_since = (Utc::now() - last_contact).num_days();
        if days_since <= 7 { score += 20; }
        else if days_since <= 30 { score += 10; }
        else if days_since > 90 { score = score.saturating_sub(15); }
    }
    
    // Deal score
    let contact_deals: Vec<_> = deals.values()
        .filter(|d| d.contact_id == contact.id)
        .collect();
    
    score += (contact_deals.len() as u32) * 5;
    
    // Won deals bonus
    let won_deals = contact_deals.iter()
        .filter(|d| d.stage == DealStage::ClosedWon)
        .count();
    score += (won_deals as u32) * 10;
    
    // Value score
    if contact.total_value > 100000 { score += 15; }
    else if contact.total_value > 50000 { score += 10; }
    else if contact.total_value > 10000 { score += 5; }
    
    // Activity score
    let recent_activities = activities.values()
        .filter(|a| a.contact_id.as_ref() == Some(&contact.id))
        .filter(|a| (Utc::now() - a.created_at).num_days() <= 30)
        .count();
    score += (recent_activities as u32) * 2;
    
    // Status modifier
    match contact.status {
        ContactStatus::Customer => score += 15,
        ContactStatus::Prospect => score += 5,
        ContactStatus::Churned => score = score.saturating_sub(20),
        _ => {}
    }
    
    score.min(100)
}

fn generate_ai_insights(state: &CRMState) -> Vec<AIInsight> {
    let mut insights = Vec::new();
    let contacts = state.contacts.lock().unwrap();
    let deals = state.deals.lock().unwrap();
    let activities = state.activities.lock().unwrap();
    
    let now = Utc::now();
    
    // Find stagnant deals
    for deal in deals.values() {
        if deal.stage != DealStage::ClosedWon && deal.stage != DealStage::ClosedLost {
            let days_since_activity = (now - deal.last_activity).num_days();
            if days_since_activity > 14 {
                insights.push(AIInsight {
                    id: Uuid::new_v4().to_string(),
                    insight_type: InsightType::Risk,
                    title: format!("Deal at risk: {}", deal.name),
                    description: format!("No activity in {} days. Consider following up.", days_since_activity),
                    impact: ImpactLevel::High,
                    actionable: true,
                    action: Some("Schedule follow-up".to_string()),
                    related_id: Some(deal.id.clone()),
                    related_type: Some("deal".to_string()),
                    created_at: now,
                });
            }
        }
    }
    
    // Find high-value contacts without recent contact
    for contact in contacts.values() {
        if contact.total_value > 50000 && contact.status == ContactStatus::Customer {
            if let Some(last_contact) = contact.last_contact {
                let days_since = (now - last_contact).num_days();
                if days_since > 30 {
                    insights.push(AIInsight {
                        id: Uuid::new_v4().to_string(),
                        insight_type: InsightType::Opportunity,
                        title: format!("Re-engage {}", contact.first_name),
                        description: format!("High-value customer hasn't been contacted in {} days. Potential upsell opportunity.", days_since),
                        impact: ImpactLevel::Medium,
                        actionable: true,
                        action: Some("Schedule call".to_string()),
                        related_id: Some(contact.id.clone()),
                        related_type: Some("contact".to_string()),
                        created_at: now,
                    });
                }
            }
        }
    }
    
    // Find overdue activities
    let overdue_count = activities.values()
        .filter(|a| a.status == ActivityStatus::Overdue || 
                   (a.status == ActivityStatus::Pending && 
                    a.due_date.map_or(false, |d| d < now)))
        .count();
    
    if overdue_count > 0 {
        insights.push(AIInsight {
            id: Uuid::new_v4().to_string(),
            insight_type: InsightType::Risk,
            title: format!("{} overdue activities", overdue_count),
            description: "You have overdue tasks that need attention.".to_string(),
            impact: if overdue_count > 5 { ImpactLevel::High } else { ImpactLevel::Medium },
            actionable: true,
            action: Some("View overdue".to_string()),
            related_id: None,
            related_type: None,
            created_at: now,
        });
    }
    
    // Deals closing soon
    let closing_soon: Vec<_> = deals.values()
        .filter(|d| d.stage != DealStage::ClosedWon && d.stage != DealStage::ClosedLost)
        .filter(|d| (d.expected_close - now).num_days() <= 7 && (d.expected_close - now).num_days() >= 0)
        .collect();
    
    if !closing_soon.is_empty() {
        let total_value: u64 = closing_soon.iter().map(|d| d.value).sum();
        insights.push(AIInsight {
            id: Uuid::new_v4().to_string(),
            insight_type: InsightType::Prediction,
            title: format!("{} deals closing this week", closing_soon.len()),
            description: format!("Potential revenue of ${:.2}K this week.", total_value as f64 / 1000.0),
            impact: ImpactLevel::High,
            actionable: true,
            action: Some("Review deals".to_string()),
            related_id: None,
            related_type: None,
            created_at: now,
        });
    }
    
    insights
}

fn recalculate_stats(state: &CRMState) -> CRMStats {
    let contacts = state.contacts.lock().unwrap();
    let companies = state.companies.lock().unwrap();
    let deals = state.deals.lock().unwrap();
    
    let now = Utc::now();
    let month_ago = now - Duration::days(30);
    
    let total_contacts = contacts.len() as u64;
    let contacts_this_month = contacts.values()
        .filter(|c| c.created_at > month_ago)
        .count() as u64;
    
    let total_companies = companies.len() as u64;
    
    let total_deals = deals.len() as u64;
    let open_deals = deals.values()
        .filter(|d| d.stage != DealStage::ClosedWon && d.stage != DealStage::ClosedLost)
        .count() as u64;
    
    let deals_value: u64 = deals.values()
        .filter(|d| d.stage != DealStage::ClosedWon && d.stage != DealStage::ClosedLost)
        .map(|d| d.value)
        .sum();
    
    let won_this_month: Vec<_> = deals.values()
        .filter(|d| d.stage == DealStage::ClosedWon)
        .filter(|d| d.actual_close.map_or(false, |c| c > month_ago))
        .collect();
    
    let won_count = won_this_month.len() as u64;
    let won_value: u64 = won_this_month.iter().map(|d| d.value).sum();
    
    let lost_this_month = deals.values()
        .filter(|d| d.stage == DealStage::ClosedLost)
        .filter(|d| d.actual_close.map_or(false, |c| c > month_ago))
        .count() as u64;
    
    let win_rate = if won_count + lost_this_month > 0 {
        (won_count as f64 / (won_count + lost_this_month) as f64) * 100.0
    } else {
        0.0
    };
    
    let closed_deals: Vec<_> = deals.values()
        .filter(|d| d.stage == DealStage::ClosedWon)
        .collect();
    
    let avg_deal_size = if !closed_deals.is_empty() {
        closed_deals.iter().map(|d| d.value).sum::<u64>() / closed_deals.len() as u64
    } else {
        0
    };
    
    // Revenue forecast (weighted by probability)
    let revenue_forecast: u64 = deals.values()
        .filter(|d| d.stage != DealStage::ClosedWon && d.stage != DealStage::ClosedLost)
        .map(|d| (d.value as f64 * (d.probability as f64 / 100.0)) as u64)
        .sum();
    
    CRMStats {
        total_contacts,
        contacts_this_month,
        contacts_growth: if total_contacts > 0 { (contacts_this_month as f64 / total_contacts as f64) * 100.0 } else { 0.0 },
        total_companies,
        companies_growth: 0.0,
        total_deals,
        open_deals,
        deals_value,
        deals_growth: 0.0,
        won_this_month: won_count,
        won_value,
        lost_this_month,
        win_rate,
        avg_deal_size,
        avg_sales_cycle: 30,
        revenue_forecast,
    }
}

// ============================================================
// CONTACT COMMANDS
// ============================================================

#[derive(Debug, Deserialize)]
pub struct CreateContactRequest {
    pub first_name: String,
    pub last_name: String,
    pub email: String,
    pub phone: String,
    pub mobile: Option<String>,
    pub company: String,
    pub company_id: Option<String>,
    pub position: String,
    pub address: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub country: Option<String>,
    pub postal_code: Option<String>,
    pub source: String,
    pub status: ContactStatus,
    pub tags: Vec<String>,
    pub assigned_to: String,
    pub notes: String,
}

#[tauri::command]
pub async fn crm_create_contact(
    state: State<'_, CRMState>,
    request: CreateContactRequest,
) -> Result<Contact, String> {
    let contact = Contact {
        id: Uuid::new_v4().to_string(),
        first_name: request.first_name,
        last_name: request.last_name,
        email: request.email,
        phone: request.phone,
        mobile: request.mobile,
        company: request.company,
        company_id: request.company_id,
        position: request.position,
        address: request.address,
        city: request.city,
        state: request.state,
        country: request.country,
        postal_code: request.postal_code,
        source: request.source,
        status: request.status,
        tags: request.tags,
        assigned_to: request.assigned_to,
        score: 50,
        last_contact: None,
        next_follow_up: None,
        total_deals: 0,
        total_value: 0,
        notes: request.notes,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        favorite: false,
        avatar: None,
        social_profiles: None,
        custom_fields: HashMap::new(),
    };
    
    let mut contacts = state.contacts.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    // Check for duplicate email
    if contacts.values().any(|c| c.email == contact.email) {
        return Err("Contact with this email already exists".to_string());
    }
    
    contacts.insert(contact.id.clone(), contact.clone());
    
    Ok(contact)
}

#[tauri::command]
pub async fn crm_get_contacts(
    state: State<'_, CRMState>,
    status_filter: Option<String>,
    source_filter: Option<String>,
    assigned_to_filter: Option<String>,
    search_query: Option<String>,
    favorite_only: Option<bool>,
) -> Result<Vec<Contact>, String> {
    let contacts = state.contacts.lock().map_err(|e| format!("Lock error: {}", e))?;
    let deals = state.deals.lock().map_err(|e| format!("Lock error: {}", e))?;
    let activities = state.activities.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let mut result: Vec<Contact> = contacts.values()
        .filter(|c| {
            let status_match = status_filter.as_ref().map_or(true, |s| {
                s == "all" || format!("{:?}", c.status).to_lowercase() == s.to_lowercase()
            });
            
            let source_match = source_filter.as_ref().map_or(true, |s| {
                s == "all" || c.source.to_lowercase() == s.to_lowercase()
            });
            
            let assigned_match = assigned_to_filter.as_ref().map_or(true, |a| {
                a == "all" || c.assigned_to.to_lowercase().contains(&a.to_lowercase())
            });
            
            let search_match = search_query.as_ref().map_or(true, |q| {
                let q = q.to_lowercase();
                c.first_name.to_lowercase().contains(&q) ||
                c.last_name.to_lowercase().contains(&q) ||
                c.email.to_lowercase().contains(&q) ||
                c.company.to_lowercase().contains(&q) ||
                c.tags.iter().any(|t| t.to_lowercase().contains(&q))
            });
            
            let favorite_match = favorite_only.map_or(true, |f| !f || c.favorite);
            
            status_match && source_match && assigned_match && search_match && favorite_match
        })
        .map(|c| {
            let mut contact = c.clone();
            contact.score = calculate_contact_score(&contact, &deals, &activities);
            contact
        })
        .collect();
    
    result.sort_by(|a, b| b.score.cmp(&a.score));
    
    Ok(result)
}

#[tauri::command]
pub async fn crm_get_contact(
    state: State<'_, CRMState>,
    contact_id: String,
) -> Result<Contact, String> {
    let contacts = state.contacts.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    contacts.get(&contact_id)
        .cloned()
        .ok_or_else(|| "Contact not found".to_string())
}

#[derive(Debug, Deserialize)]
pub struct UpdateContactRequest {
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub mobile: Option<String>,
    pub company: Option<String>,
    pub position: Option<String>,
    pub status: Option<ContactStatus>,
    pub tags: Option<Vec<String>>,
    pub assigned_to: Option<String>,
    pub notes: Option<String>,
    pub next_follow_up: Option<String>,
    pub favorite: Option<bool>,
}

#[tauri::command]
pub async fn crm_update_contact(
    state: State<'_, CRMState>,
    contact_id: String,
    request: UpdateContactRequest,
) -> Result<Contact, String> {
    let mut contacts = state.contacts.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let contact = contacts.get_mut(&contact_id)
        .ok_or_else(|| "Contact not found".to_string())?;
    
    if let Some(first_name) = request.first_name { contact.first_name = first_name; }
    if let Some(last_name) = request.last_name { contact.last_name = last_name; }
    if let Some(email) = request.email { contact.email = email; }
    if let Some(phone) = request.phone { contact.phone = phone; }
    if let Some(mobile) = request.mobile { contact.mobile = Some(mobile); }
    if let Some(company) = request.company { contact.company = company; }
    if let Some(position) = request.position { contact.position = position; }
    if let Some(status) = request.status { contact.status = status; }
    if let Some(tags) = request.tags { contact.tags = tags; }
    if let Some(assigned_to) = request.assigned_to { contact.assigned_to = assigned_to; }
    if let Some(notes) = request.notes { contact.notes = notes; }
    if let Some(favorite) = request.favorite { contact.favorite = favorite; }
    if let Some(follow_up) = request.next_follow_up {
        if let Ok(dt) = DateTime::parse_from_rfc3339(&follow_up) {
            contact.next_follow_up = Some(dt.with_timezone(&Utc));
        }
    }
    
    contact.updated_at = Utc::now();
    
    Ok(contact.clone())
}

#[tauri::command]
pub async fn crm_delete_contact(
    state: State<'_, CRMState>,
    contact_id: String,
) -> Result<bool, String> {
    let mut contacts = state.contacts.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    if contacts.remove(&contact_id).is_some() {
        Ok(true)
    } else {
        Err("Contact not found".to_string())
    }
}

#[tauri::command]
pub async fn crm_toggle_favorite(
    state: State<'_, CRMState>,
    contact_id: String,
) -> Result<Contact, String> {
    let mut contacts = state.contacts.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let contact = contacts.get_mut(&contact_id)
        .ok_or_else(|| "Contact not found".to_string())?;
    
    contact.favorite = !contact.favorite;
    contact.updated_at = Utc::now();
    
    Ok(contact.clone())
}

#[tauri::command]
pub async fn crm_log_contact(
    state: State<'_, CRMState>,
    contact_id: String,
) -> Result<Contact, String> {
    let mut contacts = state.contacts.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let contact = contacts.get_mut(&contact_id)
        .ok_or_else(|| "Contact not found".to_string())?;
    
    contact.last_contact = Some(Utc::now());
    contact.updated_at = Utc::now();
    
    Ok(contact.clone())
}

// ============================================================
// COMPANY COMMANDS
// ============================================================

#[derive(Debug, Deserialize)]
pub struct CreateCompanyRequest {
    pub name: String,
    pub industry: String,
    pub website: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub country: Option<String>,
    pub size: CompanySize,
    pub employees: Option<u32>,
    pub description: Option<String>,
    pub tags: Vec<String>,
    pub assigned_to: String,
}

#[tauri::command]
pub async fn crm_create_company(
    state: State<'_, CRMState>,
    request: CreateCompanyRequest,
) -> Result<Company, String> {
    let company = Company {
        id: Uuid::new_v4().to_string(),
        name: request.name,
        industry: request.industry,
        website: request.website,
        phone: request.phone,
        email: request.email,
        address: request.address,
        city: request.city,
        state: request.state,
        country: request.country,
        postal_code: None,
        size: request.size,
        annual_revenue: None,
        employees: request.employees,
        description: request.description,
        logo: None,
        tags: request.tags,
        assigned_to: request.assigned_to,
        total_contacts: 0,
        total_deals: 0,
        total_value: 0,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };
    
    let mut companies = state.companies.lock().map_err(|e| format!("Lock error: {}", e))?;
    companies.insert(company.id.clone(), company.clone());
    
    Ok(company)
}

#[tauri::command]
pub async fn crm_get_companies(
    state: State<'_, CRMState>,
    industry_filter: Option<String>,
    size_filter: Option<String>,
    search_query: Option<String>,
) -> Result<Vec<Company>, String> {
    let companies = state.companies.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let mut result: Vec<Company> = companies.values()
        .filter(|c| {
            let industry_match = industry_filter.as_ref().map_or(true, |i| {
                i == "all" || c.industry.to_lowercase() == i.to_lowercase()
            });
            
            let size_match = size_filter.as_ref().map_or(true, |s| {
                s == "all" || format!("{:?}", c.size).to_lowercase() == s.to_lowercase()
            });
            
            let search_match = search_query.as_ref().map_or(true, |q| {
                let q = q.to_lowercase();
                c.name.to_lowercase().contains(&q) ||
                c.industry.to_lowercase().contains(&q)
            });
            
            industry_match && size_match && search_match
        })
        .cloned()
        .collect();
    
    result.sort_by(|a, b| b.total_value.cmp(&a.total_value));
    
    Ok(result)
}

#[tauri::command]
pub async fn crm_get_company(
    state: State<'_, CRMState>,
    company_id: String,
) -> Result<Company, String> {
    let companies = state.companies.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    companies.get(&company_id)
        .cloned()
        .ok_or_else(|| "Company not found".to_string())
}

#[tauri::command]
pub async fn crm_delete_company(
    state: State<'_, CRMState>,
    company_id: String,
) -> Result<bool, String> {
    let mut companies = state.companies.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    if companies.remove(&company_id).is_some() {
        Ok(true)
    } else {
        Err("Company not found".to_string())
    }
}

// ============================================================
// DEAL COMMANDS
// ============================================================

#[derive(Debug, Deserialize)]
pub struct CreateDealRequest {
    pub name: String,
    pub value: u64,
    pub stage: DealStage,
    pub contact_id: String,
    pub contact_name: String,
    pub company_id: Option<String>,
    pub company_name: String,
    pub expected_close: String,
    pub assigned_to: String,
    pub source: String,
    pub description: Option<String>,
    pub tags: Vec<String>,
}

#[tauri::command]
pub async fn crm_create_deal(
    state: State<'_, CRMState>,
    request: CreateDealRequest,
) -> Result<Deal, String> {
    let expected_close = DateTime::parse_from_rfc3339(&request.expected_close)
        .map_err(|_| "Invalid date format")?
        .with_timezone(&Utc);
    
    let probability = match request.stage {
        DealStage::Lead => 10,
        DealStage::Qualified => 25,
        DealStage::Proposal => 50,
        DealStage::Negotiation => 75,
        DealStage::ClosedWon => 100,
        DealStage::ClosedLost => 0,
    };
    
    let deal = Deal {
        id: Uuid::new_v4().to_string(),
        name: request.name,
        value: request.value,
        stage: request.stage,
        probability,
        contact_id: request.contact_id.clone(),
        contact_name: request.contact_name,
        company_id: request.company_id,
        company_name: request.company_name,
        expected_close,
        actual_close: None,
        assigned_to: request.assigned_to,
        source: request.source,
        description: request.description,
        products: Vec::new(),
        lost_reason: None,
        last_activity: Utc::now(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        tags: request.tags,
    };
    
    // Update contact stats
    {
        let mut contacts = state.contacts.lock().map_err(|e| format!("Lock error: {}", e))?;
        if let Some(contact) = contacts.get_mut(&request.contact_id) {
            contact.total_deals += 1;
            contact.total_value += deal.value;
            contact.updated_at = Utc::now();
        }
    }
    
    let mut deals = state.deals.lock().map_err(|e| format!("Lock error: {}", e))?;
    deals.insert(deal.id.clone(), deal.clone());
    
    Ok(deal)
}

#[tauri::command]
pub async fn crm_get_deals(
    state: State<'_, CRMState>,
    stage_filter: Option<String>,
    assigned_to_filter: Option<String>,
    search_query: Option<String>,
) -> Result<Vec<Deal>, String> {
    let deals = state.deals.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let mut result: Vec<Deal> = deals.values()
        .filter(|d| {
            let stage_match = stage_filter.as_ref().map_or(true, |s| {
                s == "all" || format!("{:?}", d.stage).to_lowercase() == s.to_lowercase()
            });
            
            let assigned_match = assigned_to_filter.as_ref().map_or(true, |a| {
                a == "all" || d.assigned_to.to_lowercase().contains(&a.to_lowercase())
            });
            
            let search_match = search_query.as_ref().map_or(true, |q| {
                let q = q.to_lowercase();
                d.name.to_lowercase().contains(&q) ||
                d.contact_name.to_lowercase().contains(&q) ||
                d.company_name.to_lowercase().contains(&q)
            });
            
            stage_match && assigned_match && search_match
        })
        .cloned()
        .collect();
    
    result.sort_by(|a, b| b.value.cmp(&a.value));
    
    Ok(result)
}

#[tauri::command]
pub async fn crm_get_deal(
    state: State<'_, CRMState>,
    deal_id: String,
) -> Result<Deal, String> {
    let deals = state.deals.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    deals.get(&deal_id)
        .cloned()
        .ok_or_else(|| "Deal not found".to_string())
}

#[tauri::command]
pub async fn crm_update_deal_stage(
    state: State<'_, CRMState>,
    deal_id: String,
    new_stage: DealStage,
    lost_reason: Option<String>,
) -> Result<Deal, String> {
    let mut deals = state.deals.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let deal = deals.get_mut(&deal_id)
        .ok_or_else(|| "Deal not found".to_string())?;
    
    deal.stage = new_stage.clone();
    deal.probability = match new_stage {
        DealStage::Lead => 10,
        DealStage::Qualified => 25,
        DealStage::Proposal => 50,
        DealStage::Negotiation => 75,
        DealStage::ClosedWon => 100,
        DealStage::ClosedLost => 0,
    };
    
    if new_stage == DealStage::ClosedWon || new_stage == DealStage::ClosedLost {
        deal.actual_close = Some(Utc::now());
    }
    
    if new_stage == DealStage::ClosedLost {
        deal.lost_reason = lost_reason;
    }
    
    deal.last_activity = Utc::now();
    deal.updated_at = Utc::now();
    
    Ok(deal.clone())
}

#[tauri::command]
pub async fn crm_delete_deal(
    state: State<'_, CRMState>,
    deal_id: String,
) -> Result<bool, String> {
    let mut deals = state.deals.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    if deals.remove(&deal_id).is_some() {
        Ok(true)
    } else {
        Err("Deal not found".to_string())
    }
}

// ============================================================
// ACTIVITY COMMANDS
// ============================================================

#[derive(Debug, Deserialize)]
pub struct CreateActivityRequest {
    pub activity_type: ActivityType,
    pub title: String,
    pub description: String,
    pub contact_id: Option<String>,
    pub contact_name: Option<String>,
    pub company_id: Option<String>,
    pub deal_id: Option<String>,
    pub assigned_to: String,
    pub due_date: Option<String>,
    pub priority: ActivityPriority,
    pub notes: Option<String>,
}

#[tauri::command]
pub async fn crm_create_activity(
    state: State<'_, CRMState>,
    request: CreateActivityRequest,
) -> Result<Activity, String> {
    let due_date = request.due_date.and_then(|d| {
        DateTime::parse_from_rfc3339(&d).ok().map(|dt| dt.with_timezone(&Utc))
    });
    
    let activity = Activity {
        id: Uuid::new_v4().to_string(),
        activity_type: request.activity_type,
        title: request.title,
        description: request.description,
        contact_id: request.contact_id,
        contact_name: request.contact_name,
        company_id: request.company_id,
        deal_id: request.deal_id,
        assigned_to: request.assigned_to,
        due_date,
        completed_at: None,
        status: ActivityStatus::Pending,
        priority: request.priority,
        notes: request.notes,
        outcome: None,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };
    
    let mut activities = state.activities.lock().map_err(|e| format!("Lock error: {}", e))?;
    activities.insert(activity.id.clone(), activity.clone());
    
    Ok(activity)
}

#[tauri::command]
pub async fn crm_get_activities(
    state: State<'_, CRMState>,
    contact_id: Option<String>,
    deal_id: Option<String>,
    status_filter: Option<String>,
    type_filter: Option<String>,
) -> Result<Vec<Activity>, String> {
    let activities = state.activities.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let now = Utc::now();
    
    let mut result: Vec<Activity> = activities.values()
        .filter(|a| {
            let contact_match = contact_id.as_ref().map_or(true, |id| {
                a.contact_id.as_ref() == Some(id)
            });
            
            let deal_match = deal_id.as_ref().map_or(true, |id| {
                a.deal_id.as_ref() == Some(id)
            });
            
            let status_match = status_filter.as_ref().map_or(true, |s| {
                s == "all" || format!("{:?}", a.status).to_lowercase() == s.to_lowercase()
            });
            
            let type_match = type_filter.as_ref().map_or(true, |t| {
                t == "all" || format!("{:?}", a.activity_type).to_lowercase() == t.to_lowercase()
            });
            
            contact_match && deal_match && status_match && type_match
        })
        .map(|a| {
            let mut activity = a.clone();
            // Update status based on due date
            if activity.status == ActivityStatus::Pending {
                if let Some(due) = activity.due_date {
                    if due < now {
                        activity.status = ActivityStatus::Overdue;
                    }
                }
            }
            activity
        })
        .collect();
    
    result.sort_by(|a, b| {
        match (&a.due_date, &b.due_date) {
            (Some(da), Some(db)) => da.cmp(db),
            (Some(_), None) => std::cmp::Ordering::Less,
            (None, Some(_)) => std::cmp::Ordering::Greater,
            (None, None) => b.created_at.cmp(&a.created_at),
        }
    });
    
    Ok(result)
}

#[tauri::command]
pub async fn crm_complete_activity(
    state: State<'_, CRMState>,
    activity_id: String,
    outcome: Option<String>,
) -> Result<Activity, String> {
    let mut activities = state.activities.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let activity = activities.get_mut(&activity_id)
        .ok_or_else(|| "Activity not found".to_string())?;
    
    activity.status = ActivityStatus::Completed;
    activity.completed_at = Some(Utc::now());
    activity.outcome = outcome;
    activity.updated_at = Utc::now();
    
    // Update contact's last_contact if applicable
    if let Some(contact_id) = &activity.contact_id {
        let mut contacts = state.contacts.lock().map_err(|e| format!("Lock error: {}", e))?;
        if let Some(contact) = contacts.get_mut(contact_id) {
            contact.last_contact = Some(Utc::now());
            contact.updated_at = Utc::now();
        }
    }
    
    Ok(activity.clone())
}

#[tauri::command]
pub async fn crm_delete_activity(
    state: State<'_, CRMState>,
    activity_id: String,
) -> Result<bool, String> {
    let mut activities = state.activities.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    if activities.remove(&activity_id).is_some() {
        Ok(true)
    } else {
        Err("Activity not found".to_string())
    }
}

// ============================================================
// PIPELINE COMMANDS
// ============================================================

#[tauri::command]
pub async fn crm_get_pipelines(
    state: State<'_, CRMState>,
) -> Result<Vec<Pipeline>, String> {
    let pipelines = state.pipelines.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(pipelines.values().cloned().collect())
}

#[tauri::command]
pub async fn crm_get_pipeline_deals(
    state: State<'_, CRMState>,
    _pipeline_id: Option<String>,
) -> Result<HashMap<String, Vec<Deal>>, String> {
    let deals = state.deals.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let mut by_stage: HashMap<String, Vec<Deal>> = HashMap::new();
    
    for stage in ["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"] {
        by_stage.insert(stage.to_string(), Vec::new());
    }
    
    for deal in deals.values() {
        let stage_key = format!("{:?}", deal.stage).to_lowercase().replace("closed", "closed_");
        if let Some(stage_deals) = by_stage.get_mut(&stage_key) {
            stage_deals.push(deal.clone());
        }
    }
    
    Ok(by_stage)
}

// ============================================================
// STATS & INSIGHTS COMMANDS
// ============================================================

#[tauri::command]
pub async fn crm_get_stats(
    state: State<'_, CRMState>,
) -> Result<CRMStats, String> {
    Ok(recalculate_stats(&state))
}

#[tauri::command]
pub async fn crm_get_insights(
    state: State<'_, CRMState>,
) -> Result<Vec<AIInsight>, String> {
    let insights = generate_ai_insights(&state);
    
    // Store insights
    if let Ok(mut stored) = state.insights.lock() {
        *stored = insights.clone();
    }
    
    Ok(insights)
}

// ============================================================
// IMPORT/EXPORT COMMANDS
// ============================================================

#[tauri::command]
pub async fn crm_export_contacts(
    state: State<'_, CRMState>,
    format: String,
) -> Result<String, String> {
    let contacts = state.contacts.lock().map_err(|e| format!("Lock error: {}", e))?;
    let data: Vec<&Contact> = contacts.values().collect();
    
    match format.as_str() {
        "json" => serde_json::to_string_pretty(&data).map_err(|e| e.to_string()),
        "csv" => {
            let mut csv = String::from("id,first_name,last_name,email,phone,company,position,status,score,created_at\n");
            for contact in data {
                csv.push_str(&format!(
                    "{},{},{},{},{},{},{},{:?},{},{}\n",
                    contact.id, contact.first_name, contact.last_name, contact.email,
                    contact.phone, contact.company, contact.position, contact.status,
                    contact.score, contact.created_at.to_rfc3339()
                ));
            }
            Ok(csv)
        }
        _ => Err("Unsupported format. Use 'json' or 'csv'".to_string())
    }
}

#[tauri::command]
pub async fn crm_export_deals(
    state: State<'_, CRMState>,
    format: String,
) -> Result<String, String> {
    let deals = state.deals.lock().map_err(|e| format!("Lock error: {}", e))?;
    let data: Vec<&Deal> = deals.values().collect();
    
    match format.as_str() {
        "json" => serde_json::to_string_pretty(&data).map_err(|e| e.to_string()),
        "csv" => {
            let mut csv = String::from("id,name,value,stage,probability,contact_name,company_name,expected_close,created_at\n");
            for deal in data {
                csv.push_str(&format!(
                    "{},{},{},{:?},{},{},{},{},{}\n",
                    deal.id, deal.name, deal.value, deal.stage, deal.probability,
                    deal.contact_name, deal.company_name, deal.expected_close.to_rfc3339(),
                    deal.created_at.to_rfc3339()
                ));
            }
            Ok(csv)
        }
        _ => Err("Unsupported format. Use 'json' or 'csv'".to_string())
    }
}

// ============================================================
// QUICK STATS & NOTIFICATIONS COMMANDS
// ============================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuickStats {
    pub total_contacts: u64,
    pub total_companies: u64,
    pub open_deals: u64,
    pub pipeline_value: f64,
    pub activities_due_today: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CRMNotification {
    pub id: String,
    #[serde(rename = "type")]
    pub notification_type: String,
    pub title: String,
    pub message: String,
    pub timestamp: String,
    pub read: bool,
}

#[tauri::command]
pub async fn crm_get_quick_stats(
    state: State<'_, CRMState>,
) -> Result<QuickStats, String> {
    let contacts = state.contacts.lock().map_err(|e| format!("Lock error: {}", e))?;
    let companies = state.companies.lock().map_err(|e| format!("Lock error: {}", e))?;
    let deals = state.deals.lock().map_err(|e| format!("Lock error: {}", e))?;
    let activities = state.activities.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let open_deals: Vec<&Deal> = deals.values()
        .filter(|d| !matches!(d.stage, DealStage::ClosedWon | DealStage::ClosedLost))
        .collect();
    
    let pipeline_value: f64 = open_deals.iter().map(|d| d.value as f64).sum();
    
    let today = chrono::Utc::now().date_naive();
    let activities_due_today = activities.values()
        .filter(|a| {
            if let Some(due) = a.due_date {
                due.date_naive() == today && a.completed_at.is_none()
            } else {
                false
            }
        })
        .count() as u64;
    
    Ok(QuickStats {
        total_contacts: contacts.len() as u64,
        total_companies: companies.len() as u64,
        open_deals: open_deals.len() as u64,
        pipeline_value,
        activities_due_today,
    })
}

#[tauri::command]
pub async fn crm_get_notifications(
    state: State<'_, CRMState>,
) -> Result<Vec<CRMNotification>, String> {
    let deals = state.deals.lock().map_err(|e| format!("Lock error: {}", e))?;
    let activities = state.activities.lock().map_err(|e| format!("Lock error: {}", e))?;
    let contacts = state.contacts.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let mut notifications = Vec::new();
    let now = chrono::Utc::now();
    
    // Recent won deals
    for deal in deals.values() {
        if matches!(deal.stage, DealStage::ClosedWon) {
            let age = now.signed_duration_since(deal.updated_at);
            if age.num_hours() < 24 {
                notifications.push(CRMNotification {
                    id: format!("deal-won-{}", deal.id),
                    notification_type: "deal".to_string(),
                    title: "Deal Won".to_string(),
                    message: format!("{} closed for ${:.0}", deal.name, deal.value),
                    timestamp: deal.updated_at.to_rfc3339(),
                    read: false,
                });
            }
        }
    }
    
    // Overdue activities
    let today = now.date_naive();
    let overdue_count = activities.values()
        .filter(|a| {
            if let Some(due) = a.due_date {
                due.date_naive() <= today && a.completed_at.is_none()
            } else {
                false
            }
        })
        .count();
    
    if overdue_count > 0 {
        notifications.push(CRMNotification {
            id: format!("activities-due-{}", today),
            notification_type: "activity".to_string(),
            title: "Follow-up Due".to_string(),
            message: format!("{} activities due today", overdue_count),
            timestamp: now.to_rfc3339(),
            read: false,
        });
    }
    
    // Recent new contacts
    for contact in contacts.values() {
        let age = now.signed_duration_since(contact.created_at);
        if age.num_hours() < 24 {
            notifications.push(CRMNotification {
                id: format!("contact-new-{}", contact.id),
                notification_type: "contact".to_string(),
                title: "New Lead".to_string(),
                message: format!("{} {} added", contact.first_name, contact.last_name),
                timestamp: contact.created_at.to_rfc3339(),
                read: true,
            });
        }
    }
    
    // Sort by timestamp descending
    notifications.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    
    // Limit to 10 notifications
    notifications.truncate(10);
    
    Ok(notifications)
}
