// CUBE Nexum Elite - Admin Affiliate Management Commands
// Provides backend functionality for the Affiliate Manager
// Features: Affiliate creation, tracking, commissions, payouts

use serde::{Deserialize, Serialize};
use tauri::State;
use std::sync::Mutex;
use std::collections::HashMap;
use chrono::{DateTime, Utc, Duration, Datelike};
use uuid::Uuid;

// ============================================================
// TYPES - Affiliate Data Structures
// ============================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Affiliate {
    pub id: String,
    pub user_id: String,
    pub name: String,
    pub email: String,
    pub company: Option<String>,
    pub website: Option<String>,
    pub status: AffiliateStatus,
    pub tier: AffiliateTier,
    pub referral_code: String,
    pub referral_link: String,
    pub joined_at: DateTime<Utc>,
    pub last_activity_at: DateTime<Utc>,
    pub stats: AffiliateStats,
    pub payment_info: PaymentInfo,
    pub marketing_materials: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum AffiliateStatus {
    Active,
    Inactive,
    Pending,
    Suspended,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum AffiliateTier {
    Bronze,
    Silver,
    Gold,
    Platinum,
    Diamond,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AffiliateStats {
    pub total_clicks: u64,
    pub total_signups: u64,
    pub total_sales: u64,
    pub total_revenue: u64,      // cents
    pub total_commission: u64,   // cents
    pub pending_commission: u64, // cents
    pub paid_commission: u64,    // cents
    pub conversion_rate: f64,
    pub avg_order_value: f64,
    pub lifetime_value: f64,
    pub monthly_clicks: u64,
    pub monthly_signups: u64,
    pub monthly_sales: u64,
    pub monthly_commission: u64, // cents
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentInfo {
    pub method: PaymentMethod,
    pub paypal_email: Option<String>,
    pub bank_account: Option<String>,
    pub bank_routing: Option<String>,
    pub crypto_address: Option<String>,
    pub minimum_payout: u64, // cents
    pub payout_frequency: PayoutFrequency,
    pub currency: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum PaymentMethod {
    PayPal,
    BankTransfer,
    Crypto,
    Check,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum PayoutFrequency {
    Weekly,
    BiWeekly,
    Monthly,
    Quarterly,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Payout {
    pub id: String,
    pub affiliate_id: String,
    pub affiliate_name: String,
    pub amount: u64, // cents
    pub currency: String,
    pub method: PaymentMethod,
    pub status: PayoutStatus,
    pub created_at: DateTime<Utc>,
    pub processed_at: Option<DateTime<Utc>>,
    pub transaction_id: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum PayoutStatus {
    Pending,
    Processing,
    Completed,
    Failed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Referral {
    pub id: String,
    pub affiliate_id: String,
    pub customer_email: String,
    pub customer_name: String,
    pub referral_type: ReferralType,
    pub amount: u64, // cents (if sale)
    pub commission: u64, // cents
    pub status: ReferralStatus,
    pub created_at: DateTime<Utc>,
    pub converted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ReferralType {
    Click,
    Signup,
    Sale,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ReferralStatus {
    Pending,
    Qualified,
    Converted,
    Rejected,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AffiliateGlobalStats {
    pub total_affiliates: u64,
    pub active_affiliates: u64,
    pub total_revenue: u64,
    pub total_commissions_paid: u64,
    pub pending_payouts: u64,
    pub avg_commission_rate: f64,
    pub top_performer_id: Option<String>,
}

// ============================================================
// STATE
// ============================================================

pub struct AffiliateState {
    pub affiliates: Mutex<HashMap<String, Affiliate>>,
    pub payouts: Mutex<Vec<Payout>>,
    pub referrals: Mutex<Vec<Referral>>,
    pub stats: Mutex<AffiliateGlobalStats>,
}

impl Default for AffiliateState {
    fn default() -> Self {
        let mut affiliates = HashMap::new();
        
        // Add sample affiliates
        let affiliate1 = Affiliate {
            id: Uuid::new_v4().to_string(),
            user_id: "user_1".to_string(),
            name: "John Smith".to_string(),
            email: "john@techblog.com".to_string(),
            company: Some("TechBlog Inc".to_string()),
            website: Some("https://techblog.com".to_string()),
            status: AffiliateStatus::Active,
            tier: AffiliateTier::Gold,
            referral_code: "JOHN2024".to_string(),
            referral_link: "https://cubenexum.com/ref/JOHN2024".to_string(),
            joined_at: Utc::now() - Duration::days(180),
            last_activity_at: Utc::now() - Duration::hours(2),
            stats: AffiliateStats {
                total_clicks: 45200,
                total_signups: 1850,
                total_sales: 425,
                total_revenue: 8450000, // $84,500
                total_commission: 1690000, // $16,900
                pending_commission: 245000, // $2,450
                paid_commission: 1445000, // $14,450
                conversion_rate: 23.0,
                avg_order_value: 198.82,
                lifetime_value: 45.67,
                monthly_clicks: 3200,
                monthly_signups: 145,
                monthly_sales: 38,
                monthly_commission: 152000, // $1,520
            },
            payment_info: PaymentInfo {
                method: PaymentMethod::PayPal,
                paypal_email: Some("payments@techblog.com".to_string()),
                bank_account: None,
                bank_routing: None,
                crypto_address: None,
                minimum_payout: 10000, // $100
                payout_frequency: PayoutFrequency::Monthly,
                currency: "USD".to_string(),
            },
            marketing_materials: vec!["banner_728x90".to_string(), "banner_300x250".to_string()],
        };
        affiliates.insert(affiliate1.id.clone(), affiliate1);
        
        Self {
            affiliates: Mutex::new(affiliates),
            payouts: Mutex::new(Vec::new()),
            referrals: Mutex::new(Vec::new()),
            stats: Mutex::new(AffiliateGlobalStats {
                total_affiliates: 1,
                active_affiliates: 1,
                total_revenue: 8450000,
                total_commissions_paid: 1445000,
                pending_payouts: 245000,
                avg_commission_rate: 20.0,
                top_performer_id: None,
            }),
        }
    }
}

// ============================================================
// COMMANDS
// ============================================================

#[derive(Debug, Deserialize)]
pub struct CreateAffiliateRequest {
    pub email: String,
    pub name: String,
    pub company: Option<String>,
    pub website: Option<String>,
    pub tier: AffiliateTier,
}

fn generate_referral_code(name: &str) -> String {
    let clean_name: String = name.chars()
        .filter(|c| c.is_alphanumeric())
        .take(6)
        .collect::<String>()
        .to_uppercase();
    format!("{}{}", clean_name, chrono::Utc::now().year())
}

#[tauri::command]
pub async fn admin_create_affiliate(
    state: State<'_, AffiliateState>,
    request: CreateAffiliateRequest,
) -> Result<Affiliate, String> {
    let referral_code = generate_referral_code(&request.name);
    
    let affiliate = Affiliate {
        id: Uuid::new_v4().to_string(),
        user_id: format!("user_{}", Uuid::new_v4().to_string().split('-').next().unwrap_or("0")),
        name: request.name,
        email: request.email,
        company: request.company,
        website: request.website,
        status: AffiliateStatus::Pending,
        tier: request.tier,
        referral_code: referral_code.clone(),
        referral_link: format!("https://cubenexum.com/ref/{}", referral_code),
        joined_at: Utc::now(),
        last_activity_at: Utc::now(),
        stats: AffiliateStats {
            total_clicks: 0,
            total_signups: 0,
            total_sales: 0,
            total_revenue: 0,
            total_commission: 0,
            pending_commission: 0,
            paid_commission: 0,
            conversion_rate: 0.0,
            avg_order_value: 0.0,
            lifetime_value: 0.0,
            monthly_clicks: 0,
            monthly_signups: 0,
            monthly_sales: 0,
            monthly_commission: 0,
        },
        payment_info: PaymentInfo {
            method: PaymentMethod::PayPal,
            paypal_email: None,
            bank_account: None,
            bank_routing: None,
            crypto_address: None,
            minimum_payout: 10000,
            payout_frequency: PayoutFrequency::Monthly,
            currency: "USD".to_string(),
        },
        marketing_materials: Vec::new(),
    };
    
    let mut affiliates = state.affiliates.lock().map_err(|e| format!("Lock error: {}", e))?;
    let affiliate_clone = affiliate.clone();
    affiliates.insert(affiliate.id.clone(), affiliate);
    
    // Update stats
    let mut stats = state.stats.lock().map_err(|e| format!("Lock error: {}", e))?;
    stats.total_affiliates += 1;
    
    Ok(affiliate_clone)
}

#[tauri::command]
pub async fn admin_get_affiliates(
    state: State<'_, AffiliateState>,
    status_filter: Option<String>,
    tier_filter: Option<String>,
    search_query: Option<String>,
) -> Result<Vec<Affiliate>, String> {
    let affiliates = state.affiliates.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let filtered: Vec<Affiliate> = affiliates.values()
        .filter(|a| {
            let status_match = status_filter.as_ref()
                .map(|s| s == "all" || format!("{:?}", a.status).to_lowercase() == s.to_lowercase())
                .unwrap_or(true);
            let tier_match = tier_filter.as_ref()
                .map(|t| t == "all" || format!("{:?}", a.tier).to_lowercase() == t.to_lowercase())
                .unwrap_or(true);
            let search_match = search_query.as_ref()
                .map(|q| {
                    let q_lower = q.to_lowercase();
                    a.name.to_lowercase().contains(&q_lower) ||
                    a.email.to_lowercase().contains(&q_lower) ||
                    a.referral_code.to_lowercase().contains(&q_lower)
                })
                .unwrap_or(true);
            status_match && tier_match && search_match
        })
        .cloned()
        .collect();
    
    Ok(filtered)
}

#[tauri::command]
pub async fn admin_get_affiliate(
    state: State<'_, AffiliateState>,
    affiliate_id: String,
) -> Result<Option<Affiliate>, String> {
    let affiliates = state.affiliates.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(affiliates.get(&affiliate_id).cloned())
}

#[tauri::command]
pub async fn admin_approve_affiliate(
    state: State<'_, AffiliateState>,
    affiliate_id: String,
) -> Result<Affiliate, String> {
    let mut affiliates = state.affiliates.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let affiliate = affiliates.get_mut(&affiliate_id)
        .ok_or_else(|| "Affiliate not found".to_string())?;
    
    affiliate.status = AffiliateStatus::Active;
    affiliate.last_activity_at = Utc::now();
    
    let affiliate_clone = affiliate.clone();
    
    // Update stats
    drop(affiliates);
    let mut stats = state.stats.lock().map_err(|e| format!("Lock error: {}", e))?;
    stats.active_affiliates += 1;
    
    Ok(affiliate_clone)
}

#[tauri::command]
pub async fn admin_suspend_affiliate(
    state: State<'_, AffiliateState>,
    affiliate_id: String,
    reason: String,
) -> Result<Affiliate, String> {
    let mut affiliates = state.affiliates.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let affiliate = affiliates.get_mut(&affiliate_id)
        .ok_or_else(|| "Affiliate not found".to_string())?;
    
    let was_active = affiliate.status == AffiliateStatus::Active;
    affiliate.status = AffiliateStatus::Suspended;
    affiliate.last_activity_at = Utc::now();
    
    let affiliate_clone = affiliate.clone();
    
    // Update stats
    drop(affiliates);
    if was_active {
        let mut stats = state.stats.lock().map_err(|e| format!("Lock error: {}", e))?;
        if stats.active_affiliates > 0 {
            stats.active_affiliates -= 1;
        }
    }
    
    // Log the reason (in production, this would be stored)
    println!("Affiliate {} suspended: {}", affiliate_id, reason);
    
    Ok(affiliate_clone)
}

#[tauri::command]
pub async fn admin_update_affiliate_tier(
    state: State<'_, AffiliateState>,
    affiliate_id: String,
    new_tier: AffiliateTier,
) -> Result<Affiliate, String> {
    let mut affiliates = state.affiliates.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let affiliate = affiliates.get_mut(&affiliate_id)
        .ok_or_else(|| "Affiliate not found".to_string())?;
    
    affiliate.tier = new_tier;
    affiliate.last_activity_at = Utc::now();
    
    Ok(affiliate.clone())
}

#[tauri::command]
pub async fn admin_update_affiliate_payment(
    state: State<'_, AffiliateState>,
    affiliate_id: String,
    payment_info: PaymentInfo,
) -> Result<Affiliate, String> {
    let mut affiliates = state.affiliates.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let affiliate = affiliates.get_mut(&affiliate_id)
        .ok_or_else(|| "Affiliate not found".to_string())?;
    
    affiliate.payment_info = payment_info;
    affiliate.last_activity_at = Utc::now();
    
    Ok(affiliate.clone())
}

#[tauri::command]
pub async fn admin_create_payout(
    state: State<'_, AffiliateState>,
    affiliate_id: String,
    amount: u64,
) -> Result<Payout, String> {
    let affiliates = state.affiliates.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let affiliate = affiliates.get(&affiliate_id)
        .ok_or_else(|| "Affiliate not found".to_string())?;
    
    if amount > affiliate.stats.pending_commission {
        return Err("Payout amount exceeds pending commission".to_string());
    }
    
    let payout = Payout {
        id: Uuid::new_v4().to_string(),
        affiliate_id: affiliate_id.clone(),
        affiliate_name: affiliate.name.clone(),
        amount,
        currency: affiliate.payment_info.currency.clone(),
        method: affiliate.payment_info.method.clone(),
        status: PayoutStatus::Pending,
        created_at: Utc::now(),
        processed_at: None,
        transaction_id: None,
        notes: None,
    };
    
    let payout_clone = payout.clone();
    
    drop(affiliates);
    
    let mut payouts = state.payouts.lock().map_err(|e| format!("Lock error: {}", e))?;
    payouts.push(payout);
    
    Ok(payout_clone)
}

#[tauri::command]
pub async fn admin_process_payout(
    state: State<'_, AffiliateState>,
    payout_id: String,
    transaction_id: String,
) -> Result<Payout, String> {
    let mut payouts = state.payouts.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let payout = payouts.iter_mut()
        .find(|p| p.id == payout_id)
        .ok_or_else(|| "Payout not found".to_string())?;
    
    payout.status = PayoutStatus::Completed;
    payout.processed_at = Some(Utc::now());
    payout.transaction_id = Some(transaction_id);
    
    let payout_clone = payout.clone();
    let affiliate_id = payout.affiliate_id.clone();
    let amount = payout.amount;
    
    drop(payouts);
    
    // Update affiliate stats
    let mut affiliates = state.affiliates.lock().map_err(|e| format!("Lock error: {}", e))?;
    if let Some(affiliate) = affiliates.get_mut(&affiliate_id) {
        if affiliate.stats.pending_commission >= amount {
            affiliate.stats.pending_commission -= amount;
        }
        affiliate.stats.paid_commission += amount;
    }
    
    // Update global stats
    drop(affiliates);
    let mut stats = state.stats.lock().map_err(|e| format!("Lock error: {}", e))?;
    stats.total_commissions_paid += amount;
    if stats.pending_payouts >= amount {
        stats.pending_payouts -= amount;
    }
    
    Ok(payout_clone)
}

#[tauri::command]
pub async fn admin_get_payouts(
    state: State<'_, AffiliateState>,
    affiliate_id: Option<String>,
    status_filter: Option<String>,
) -> Result<Vec<Payout>, String> {
    let payouts = state.payouts.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let filtered: Vec<Payout> = payouts.iter()
        .filter(|p| {
            let affiliate_match = affiliate_id.as_ref()
                .map(|id| p.affiliate_id == *id)
                .unwrap_or(true);
            let status_match = status_filter.as_ref()
                .map(|s| s == "all" || format!("{:?}", p.status).to_lowercase() == s.to_lowercase())
                .unwrap_or(true);
            affiliate_match && status_match
        })
        .cloned()
        .collect();
    
    Ok(filtered)
}

#[tauri::command]
pub async fn admin_get_affiliate_stats(
    state: State<'_, AffiliateState>,
) -> Result<AffiliateGlobalStats, String> {
    let stats = state.stats.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(stats.clone())
}

#[tauri::command]
pub async fn admin_record_referral(
    state: State<'_, AffiliateState>,
    affiliate_id: String,
    customer_email: String,
    customer_name: String,
    referral_type: ReferralType,
    amount: Option<u64>,
) -> Result<Referral, String> {
    // Calculate commission based on tier
    let affiliates = state.affiliates.lock().map_err(|e| format!("Lock error: {}", e))?;
    let affiliate = affiliates.get(&affiliate_id)
        .ok_or_else(|| "Affiliate not found".to_string())?;
    
    let commission_rate = match affiliate.tier {
        AffiliateTier::Bronze => 0.10,
        AffiliateTier::Silver => 0.15,
        AffiliateTier::Gold => 0.20,
        AffiliateTier::Platinum => 0.25,
        AffiliateTier::Diamond => 0.30,
    };
    
    let commission = amount.map(|a| (a as f64 * commission_rate) as u64).unwrap_or(0);
    
    drop(affiliates);
    
    let referral = Referral {
        id: Uuid::new_v4().to_string(),
        affiliate_id: affiliate_id.clone(),
        customer_email,
        customer_name,
        referral_type: referral_type.clone(),
        amount: amount.unwrap_or(0),
        commission,
        status: ReferralStatus::Pending,
        created_at: Utc::now(),
        converted_at: None,
    };
    
    let referral_clone = referral.clone();
    
    let mut referrals = state.referrals.lock().map_err(|e| format!("Lock error: {}", e))?;
    referrals.push(referral);
    
    // Update affiliate stats
    drop(referrals);
    let mut affiliates = state.affiliates.lock().map_err(|e| format!("Lock error: {}", e))?;
    if let Some(affiliate) = affiliates.get_mut(&affiliate_id) {
        match referral_type {
            ReferralType::Click => {
                affiliate.stats.total_clicks += 1;
                affiliate.stats.monthly_clicks += 1;
            },
            ReferralType::Signup => {
                affiliate.stats.total_signups += 1;
                affiliate.stats.monthly_signups += 1;
            },
            ReferralType::Sale => {
                affiliate.stats.total_sales += 1;
                affiliate.stats.monthly_sales += 1;
                affiliate.stats.total_revenue += amount.unwrap_or(0);
                affiliate.stats.total_commission += commission;
                affiliate.stats.pending_commission += commission;
                affiliate.stats.monthly_commission += commission;
            },
        }
        affiliate.last_activity_at = Utc::now();
    }
    
    Ok(referral_clone)
}
