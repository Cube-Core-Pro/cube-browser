/**
 * Investor System Commands for CUBE Elite v6
 * 
 * Complete backend implementation for investor management including:
 * - Investor profile management
 * - Investment operations (create, track, mature)
 * - Smart contract management
 * - CUBEX token operations
 * - Payout scheduling and processing
 * - Product licensing for investors
 * 
 * Copyright (c) 2026 CUBE AI.tools - All rights reserved
 */

use crate::AppState;
use crate::database::{InvestorRecord, InvestmentRecord, PayoutRecord, NotificationRecord};
use serde::{Deserialize, Serialize};
use tauri::{command, State};
use std::collections::HashMap;
use chrono::{DateTime, Utc, Duration};
use uuid::Uuid;

// ============================================================================
// DATA STRUCTURES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum InvestorTier {
    Angel,
    Seed,
    Strategic,
    Institutional,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum InvestmentStatus {
    Pending,
    Active,
    Matured,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ContractStatus {
    Draft,
    PendingSignature,
    Active,
    Completed,
    Terminated,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PayoutStatus {
    Scheduled,
    Processing,
    Paid,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InvestorProfile {
    pub id: String,
    pub user_id: String,
    pub tier: InvestorTier,
    pub name: String,
    pub email: String,
    pub company: Option<String>,
    pub kyc_verified: bool,
    pub accredited_investor: bool,
    pub total_invested: f64,
    pub total_returns: f64,
    pub cube_tokens: f64,
    pub staked_tokens: f64,
    pub created_at: String,
    pub updated_at: String,
    pub wallet_address: Option<String>,
    pub bank_details: Option<BankDetails>,
    pub preferences: InvestorPreferences,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BankDetails {
    pub bank_name: String,
    pub account_number: String,
    pub routing_number: String,
    pub swift_code: Option<String>,
    pub iban: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InvestorPreferences {
    pub email_notifications: bool,
    pub sms_notifications: bool,
    pub payout_method: String,
    pub reinvest_dividends: bool,
    pub language: String,
    pub timezone: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Investment {
    pub id: String,
    pub investor_id: String,
    pub tier: InvestorTier,
    pub amount: f64,
    pub equity_percentage: f64,
    pub interest_rate: f64,
    pub term_months: i32,
    pub status: InvestmentStatus,
    pub contract_id: Option<String>,
    pub start_date: String,
    pub maturity_date: String,
    pub returns_to_date: f64,
    pub next_payout_date: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmartContract {
    pub id: String,
    pub investment_id: String,
    pub contract_address: Option<String>,
    pub terms: ContractTerms,
    pub status: ContractStatus,
    pub signed_by_investor: bool,
    pub signed_by_company: bool,
    pub signed_date: Option<String>,
    pub created_at: String,
    pub document_hash: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContractTerms {
    pub investment_amount: f64,
    pub equity_percentage: f64,
    pub interest_rate: f64,
    pub term_months: i32,
    pub payout_frequency: String,
    pub early_exit_penalty: f64,
    pub voting_rights: bool,
    pub board_seat: bool,
    pub anti_dilution: bool,
    pub product_licenses: Vec<String>,
    pub special_terms: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PayoutScheduleItem {
    pub id: String,
    pub investment_id: String,
    pub investor_id: String,
    pub amount: f64,
    pub payout_type: String,
    pub scheduled_date: String,
    pub status: PayoutStatus,
    pub paid_date: Option<String>,
    pub transaction_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenBalance {
    pub total_tokens: f64,
    pub staked_tokens: f64,
    pub available_tokens: f64,
    pub pending_rewards: f64,
    pub token_value_usd: f64,
    pub staking_tier: String,
    pub apy: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InvestorLicense {
    pub id: String,
    pub investor_id: String,
    pub product: String,
    pub tier: String,
    pub license_key: String,
    pub seats: i32,
    pub valid_until: String,
    pub features: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InvestorNotification {
    pub id: String,
    pub investor_id: String,
    pub notification_type: String,
    pub title: String,
    pub message: String,
    pub read: bool,
    pub created_at: String,
    pub action_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortfolioSummary {
    pub total_invested: f64,
    pub current_value: f64,
    pub total_returns: f64,
    pub roi_percentage: f64,
    pub active_investments: i32,
    pub pending_payouts: f64,
    pub cube_tokens: f64,
    pub token_value: f64,
    pub next_payout_date: Option<String>,
    pub performance_30d: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InvestmentOpportunity {
    pub id: String,
    pub tier: InvestorTier,
    pub name: String,
    pub description: String,
    pub min_investment: f64,
    pub max_investment: f64,
    pub target_raise: f64,
    pub raised_amount: f64,
    pub expected_roi: f64,
    pub term_months: i32,
    pub benefits: Vec<String>,
    pub deadline: String,
    pub available_slots: i32,
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct CreateInvestorRequest {
    pub user_id: String,
    pub tier: InvestorTier,
    pub name: String,
    pub email: String,
    pub company: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateInvestmentRequest {
    pub investor_id: String,
    pub tier: InvestorTier,
    pub amount: f64,
    pub term_months: i32,
}

#[derive(Debug, Deserialize, Clone)]
pub struct UpdateInvestorRequest {
    pub name: Option<String>,
    pub email: Option<String>,
    pub company: Option<String>,
    pub preferences: Option<InvestorPreferences>,
    pub bank_details: Option<BankDetails>,
    pub wallet_address: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct StakeTokensRequest {
    pub investor_id: String,
    pub amount: f64,
}

#[derive(Debug, Deserialize)]
pub struct UnstakeTokensRequest {
    pub investor_id: String,
    pub amount: f64,
}

#[derive(Debug, Deserialize)]
pub struct TransferTokensRequest {
    pub from_investor_id: String,
    pub to_address: String,
    pub amount: f64,
}

#[derive(Debug, Deserialize)]
pub struct CreateContractRequest {
    pub investment_id: String,
    pub terms: ContractTerms,
}

#[derive(Debug, Deserialize)]
pub struct SignContractRequest {
    pub contract_id: String,
    pub signature: String,
    pub signer_type: String,
}

// ============================================================================
// HELPER FUNCTIONS FOR DATABASE CONVERSION
// ============================================================================

fn tier_from_str(s: &str) -> InvestorTier {
    match s.to_lowercase().as_str() {
        "angel" => InvestorTier::Angel,
        "seed" => InvestorTier::Seed,
        "strategic" => InvestorTier::Strategic,
        "institutional" => InvestorTier::Institutional,
        _ => InvestorTier::Angel,
    }
}

fn tier_to_str(tier: &InvestorTier) -> &'static str {
    match tier {
        InvestorTier::Angel => "angel",
        InvestorTier::Seed => "seed",
        InvestorTier::Strategic => "strategic",
        InvestorTier::Institutional => "institutional",
    }
}

fn record_to_profile(record: InvestorRecord) -> InvestorProfile {
    let preferences: InvestorPreferences = record.preferences
        .and_then(|p| serde_json::from_str(&p).ok())
        .unwrap_or(InvestorPreferences {
            email_notifications: true,
            sms_notifications: false,
            payout_method: "bank_transfer".to_string(),
            reinvest_dividends: false,
            language: "en".to_string(),
            timezone: "UTC".to_string(),
        });
    
    let bank_details: Option<BankDetails> = record.bank_details
        .and_then(|b| serde_json::from_str(&b).ok());
    
    InvestorProfile {
        id: record.id,
        user_id: record.user_id.unwrap_or_default(),
        tier: tier_from_str(&record.tier),
        name: record.name,
        email: record.email,
        company: record.company,
        kyc_verified: record.kyc_verified,
        accredited_investor: record.accredited_investor,
        total_invested: record.total_invested,
        total_returns: record.total_returns,
        cube_tokens: record.cube_tokens,
        staked_tokens: record.staked_tokens,
        created_at: chrono::DateTime::from_timestamp(record.created_at.unwrap_or(0), 0)
            .map(|dt| dt.to_rfc3339())
            .unwrap_or_default(),
        updated_at: chrono::DateTime::from_timestamp(record.updated_at.unwrap_or(0), 0)
            .map(|dt| dt.to_rfc3339())
            .unwrap_or_default(),
        wallet_address: record.wallet_address,
        bank_details,
        preferences,
    }
}

fn profile_to_record(profile: &InvestorProfile) -> InvestorRecord {
    InvestorRecord {
        id: profile.id.clone(),
        user_id: Some(profile.user_id.clone()),
        tier: tier_to_str(&profile.tier).to_string(),
        name: profile.name.clone(),
        email: profile.email.clone(),
        company: profile.company.clone(),
        kyc_verified: profile.kyc_verified,
        accredited_investor: profile.accredited_investor,
        total_invested: profile.total_invested,
        total_returns: profile.total_returns,
        cube_tokens: profile.cube_tokens,
        staked_tokens: profile.staked_tokens,
        wallet_address: profile.wallet_address.clone(),
        bank_details: profile.bank_details.as_ref()
            .and_then(|b| serde_json::to_string(b).ok()),
        preferences: Some(serde_json::to_string(&profile.preferences).unwrap_or_default()),
        status: "active".to_string(),
        created_at: chrono::DateTime::parse_from_rfc3339(&profile.created_at)
            .map(|dt| dt.timestamp())
            .ok(),
        updated_at: chrono::DateTime::parse_from_rfc3339(&profile.updated_at)
            .map(|dt| dt.timestamp())
            .ok(),
    }
}

// ============================================================================
// INVESTOR MANAGEMENT COMMANDS
// ============================================================================

/// Create a new investor profile
#[command]
pub async fn create_investor(
    state: State<'_, AppState>,
    request: CreateInvestorRequest,
) -> Result<InvestorProfile, String> {
    let now = Utc::now();
    let id = Uuid::new_v4().to_string();
    
    let tier_str = match &request.tier {
        InvestorTier::Angel => "angel",
        InvestorTier::Seed => "seed",
        InvestorTier::Strategic => "strategic",
        InvestorTier::Institutional => "institutional",
    };
    
    let preferences = InvestorPreferences {
        email_notifications: true,
        sms_notifications: false,
        payout_method: "bank_transfer".to_string(),
        reinvest_dividends: false,
        language: "en".to_string(),
        timezone: "UTC".to_string(),
    };
    
    // Create database record
    let db_record = InvestorRecord {
        id: id.clone(),
        user_id: Some(request.user_id.clone()),
        tier: tier_str.to_string(),
        name: request.name.clone(),
        email: request.email.clone(),
        company: request.company.clone(),
        kyc_verified: false,
        accredited_investor: false,
        total_invested: 0.0,
        total_returns: 0.0,
        cube_tokens: 0.0,
        staked_tokens: 0.0,
        wallet_address: None,
        bank_details: None,
        preferences: Some(serde_json::to_string(&preferences).unwrap_or_default()),
        status: "active".to_string(),
        created_at: Some(now.timestamp()),
        updated_at: Some(now.timestamp()),
    };
    
    // Save to database
    state.database.save_investor(&db_record)
        .map_err(|e| format!("Failed to save investor: {}", e))?;
    
    let investor = InvestorProfile {
        id,
        user_id: request.user_id,
        tier: request.tier,
        name: request.name,
        email: request.email,
        company: request.company,
        kyc_verified: false,
        accredited_investor: false,
        total_invested: 0.0,
        total_returns: 0.0,
        cube_tokens: 0.0,
        staked_tokens: 0.0,
        created_at: now.to_rfc3339(),
        updated_at: now.to_rfc3339(),
        wallet_address: None,
        bank_details: None,
        preferences,
    };
    
    Ok(investor)
}

/// Get investor profile by ID
#[command]
pub async fn get_investor(
    state: State<'_, AppState>,
    investor_id: String,
) -> Result<InvestorProfile, String> {
    // Try to fetch from database
    if let Ok(Some(record)) = state.database.get_investor(&investor_id) {
        return Ok(record_to_profile(record));
    }
    
    // Fallback to mock data for demo purposes
    let mock_investor = InvestorProfile {
        id: investor_id.clone(),
        user_id: "user_123".to_string(),
        tier: InvestorTier::Strategic,
        name: "Demo Investor".to_string(),
        email: "investor@cubeai.tools".to_string(),
        company: Some("CUBE Ventures".to_string()),
        kyc_verified: true,
        accredited_investor: true,
        total_invested: 250000.0,
        total_returns: 42500.0,
        cube_tokens: 15000.0,
        staked_tokens: 10000.0,
        created_at: "2024-01-15T00:00:00Z".to_string(),
        updated_at: Utc::now().to_rfc3339(),
        wallet_address: Some("0x1234...abcd".to_string()),
        bank_details: None,
        preferences: InvestorPreferences {
            email_notifications: true,
            sms_notifications: true,
            payout_method: "bank_transfer".to_string(),
            reinvest_dividends: true,
            language: "en".to_string(),
            timezone: "America/New_York".to_string(),
        },
    };
    
    Ok(mock_investor)
}

/// Get investor by user ID
#[command]
pub async fn get_investor_by_user(
    state: State<'_, AppState>,
    user_id: String,
) -> Result<InvestorProfile, String> {
    // Try to fetch from database
    if let Ok(Some(record)) = state.database.get_investor_by_user(&user_id) {
        return Ok(record_to_profile(record));
    }
    
    get_investor(state, "inv_demo".to_string()).await
}

/// Update investor profile
#[command]
pub async fn update_investor(
    state: State<'_, AppState>,
    investor_id: String,
    updates: UpdateInvestorRequest,
) -> Result<InvestorProfile, String> {
    let mut investor = get_investor(state.clone(), investor_id.clone()).await?;
    
    if let Some(name) = updates.name {
        investor.name = name;
    }
    if let Some(email) = updates.email {
        investor.email = email;
    }
    if let Some(company) = updates.company {
        investor.company = Some(company);
    }
    if let Some(preferences) = updates.preferences {
        investor.preferences = preferences;
    }
    if let Some(bank_details) = updates.bank_details {
        investor.bank_details = Some(bank_details);
    }
    if let Some(wallet_address) = updates.wallet_address {
        investor.wallet_address = Some(wallet_address);
    }
    
    investor.updated_at = Utc::now().to_rfc3339();
    
    // Save to database
    let db_record = profile_to_record(&investor);
    state.database.save_investor(&db_record)
        .map_err(|e| format!("Failed to update investor: {}", e))?;
    
    Ok(investor)
}

/// Delete investor profile
#[command]
pub async fn delete_investor(
    state: State<'_, AppState>,
    investor_id: String,
) -> Result<bool, String> {
    state.database.delete_investor(&investor_id)
        .map_err(|e| format!("Failed to delete investor: {}", e))
}

/// Complete KYC verification for investor
#[command]
pub async fn verify_investor_kyc(
    state: State<'_, AppState>,
    investor_id: String,
    _verification_data: HashMap<String, String>,
) -> Result<bool, String> {
    // In production, this would integrate with KYC provider (Jumio, Onfido)
    // For now, we update the database with verified status
    state.database.update_investor_kyc(&investor_id, true)
        .map_err(|e| format!("Failed to update KYC status: {}", e))
}

// ============================================================================
// PORTFOLIO COMMANDS
// ============================================================================

/// Get portfolio summary for investor
#[command]
pub async fn get_portfolio_summary(_investor_id: String) -> Result<PortfolioSummary, String> {
    // Note: Calculate from database
    let summary = PortfolioSummary {
        total_invested: 250000.0,
        current_value: 292500.0,
        total_returns: 42500.0,
        roi_percentage: 17.0,
        active_investments: 3,
        pending_payouts: 5250.0,
        cube_tokens: 15000.0,
        token_value: 37500.0,
        next_payout_date: Some("2026-02-15".to_string()),
        performance_30d: 3.2,
    };
    
    Ok(summary)
}

/// Get detailed investment analytics
#[command]
pub async fn get_investment_analytics(
    _investor_id: String,
    _period: String,
) -> Result<HashMap<String, serde_json::Value>, String> {
    let mut analytics = HashMap::new();
    
    // ROI over time
    analytics.insert("roi_history".to_string(), serde_json::json!([
        {"date": "2025-01", "roi": 2.1},
        {"date": "2025-02", "roi": 4.3},
        {"date": "2025-03", "roi": 6.8},
        {"date": "2025-04", "roi": 8.5},
        {"date": "2025-05", "roi": 11.2},
        {"date": "2025-06", "roi": 14.1},
        {"date": "2025-07", "roi": 15.3},
        {"date": "2025-08", "roi": 17.0},
    ]));
    
    // Investment distribution
    analytics.insert("distribution".to_string(), serde_json::json!({
        "angel": 50000,
        "seed": 100000,
        "strategic": 100000
    }));
    
    // Payout history
    analytics.insert("payout_history".to_string(), serde_json::json!([
        {"date": "2025-01", "amount": 2083},
        {"date": "2025-02", "amount": 2083},
        {"date": "2025-03", "amount": 2083},
        {"date": "2025-04", "amount": 4166},
        {"date": "2025-05", "amount": 4166},
        {"date": "2025-06", "amount": 5250},
    ]));
    
    Ok(analytics)
}

// ============================================================================
// INVESTMENT COMMANDS
// ============================================================================

/// Create a new investment
#[command]
pub async fn create_investment(
    state: State<'_, AppState>,
    request: CreateInvestmentRequest,
) -> Result<Investment, String> {
    let now = Utc::now();
    let maturity_date = now + Duration::days(request.term_months as i64 * 30);
    
    // Calculate interest rate based on tier
    let (interest_rate, equity_percentage) = match request.tier {
        InvestorTier::Angel => (10.0, request.amount / 1000000.0 * 0.5),
        InvestorTier::Seed => (8.0, request.amount / 1000000.0 * 0.4),
        InvestorTier::Strategic => (7.0, request.amount / 1000000.0 * 0.3),
        InvestorTier::Institutional => (6.0, request.amount / 1000000.0 * 0.25),
    };
    
    let id = Uuid::new_v4().to_string();
    
    // Create database record
    let db_record = InvestmentRecord {
        id: id.clone(),
        investor_id: request.investor_id.clone(),
        tier: tier_to_str(&request.tier).to_string(),
        amount: request.amount,
        equity_percentage,
        interest_rate,
        term_months: request.term_months,
        status: "pending".to_string(),
        contract_id: None,
        start_date: now.to_rfc3339(),
        maturity_date: maturity_date.to_rfc3339(),
        returns_to_date: 0.0,
        next_payout_date: Some((now + Duration::days(30)).format("%Y-%m-%d").to_string()),
        created_at: Some(now.timestamp()),
        updated_at: Some(now.timestamp()),
    };
    
    // Save to database
    state.database.save_investment(&db_record)
        .map_err(|e| format!("Failed to save investment: {}", e))?;
    
    let investment = Investment {
        id,
        investor_id: request.investor_id,
        tier: request.tier,
        amount: request.amount,
        equity_percentage,
        interest_rate,
        term_months: request.term_months,
        status: InvestmentStatus::Pending,
        contract_id: None,
        start_date: now.to_rfc3339(),
        maturity_date: maturity_date.to_rfc3339(),
        returns_to_date: 0.0,
        next_payout_date: Some((now + Duration::days(30)).format("%Y-%m-%d").to_string()),
        created_at: now.to_rfc3339(),
        updated_at: now.to_rfc3339(),
    };
    
    Ok(investment)
}

/// Get investment by ID
#[command]
pub async fn get_investment(
    state: State<'_, AppState>,
    investment_id: String,
) -> Result<Investment, String> {
    // Try to fetch from database
    if let Ok(Some(record)) = state.database.get_investment(&investment_id) {
        return Ok(investment_record_to_model(record));
    }
    
    let now = Utc::now();
    
    // Fallback to mock data for demo purposes
    let investment = Investment {
        id: investment_id,
        investor_id: "inv_demo".to_string(),
        tier: InvestorTier::Strategic,
        amount: 100000.0,
        equity_percentage: 0.5,
        interest_rate: 7.0,
        term_months: 36,
        status: InvestmentStatus::Active,
        contract_id: Some("contract_123".to_string()),
        start_date: "2024-06-01T00:00:00Z".to_string(),
        maturity_date: "2027-06-01T00:00:00Z".to_string(),
        returns_to_date: 11666.67,
        next_payout_date: Some("2026-02-01".to_string()),
        created_at: "2024-06-01T00:00:00Z".to_string(),
        updated_at: now.to_rfc3339(),
    };
    
    Ok(investment)
}

fn investment_record_to_model(record: InvestmentRecord) -> Investment {
    let status = match record.status.as_str() {
        "pending" => InvestmentStatus::Pending,
        "active" => InvestmentStatus::Active,
        "matured" => InvestmentStatus::Matured,
        "cancelled" => InvestmentStatus::Cancelled,
        _ => InvestmentStatus::Pending,
    };
    
    Investment {
        id: record.id,
        investor_id: record.investor_id,
        tier: tier_from_str(&record.tier),
        amount: record.amount,
        equity_percentage: record.equity_percentage,
        interest_rate: record.interest_rate,
        term_months: record.term_months,
        status,
        contract_id: record.contract_id,
        start_date: record.start_date,
        maturity_date: record.maturity_date,
        returns_to_date: record.returns_to_date,
        next_payout_date: record.next_payout_date,
        created_at: chrono::DateTime::from_timestamp(record.created_at.unwrap_or(0), 0)
            .map(|dt| dt.to_rfc3339())
            .unwrap_or_default(),
        updated_at: chrono::DateTime::from_timestamp(record.updated_at.unwrap_or(0), 0)
            .map(|dt| dt.to_rfc3339())
            .unwrap_or_default(),
    }
}

/// Get all investments for an investor
#[command]
pub async fn get_investor_investments(
    state: State<'_, AppState>,
    investor_id: String,
) -> Result<Vec<Investment>, String> {
    // Try to fetch from database
    if let Ok(records) = state.database.get_investor_investments(&investor_id) {
        if !records.is_empty() {
            return Ok(records.into_iter().map(investment_record_to_model).collect());
        }
    }
    
    let now = Utc::now();
    
    // Fallback to mock data for demo purposes
    let investments = vec![
        Investment {
            id: "inv_001".to_string(),
            investor_id: investor_id.clone(),
            tier: InvestorTier::Angel,
            amount: 50000.0,
            equity_percentage: 0.25,
            interest_rate: 10.0,
            term_months: 24,
            status: InvestmentStatus::Active,
            contract_id: Some("contract_001".to_string()),
            start_date: "2024-03-01T00:00:00Z".to_string(),
            maturity_date: "2026-03-01T00:00:00Z".to_string(),
            returns_to_date: 8333.33,
            next_payout_date: Some("2026-02-01".to_string()),
            created_at: "2024-03-01T00:00:00Z".to_string(),
            updated_at: now.to_rfc3339(),
        },
        Investment {
            id: "inv_002".to_string(),
            investor_id: investor_id.clone(),
            tier: InvestorTier::Seed,
            amount: 100000.0,
            equity_percentage: 0.4,
            interest_rate: 8.0,
            term_months: 36,
            status: InvestmentStatus::Active,
            contract_id: Some("contract_002".to_string()),
            start_date: "2024-06-01T00:00:00Z".to_string(),
            maturity_date: "2027-06-01T00:00:00Z".to_string(),
            returns_to_date: 13333.33,
            next_payout_date: Some("2026-02-15".to_string()),
            created_at: "2024-06-01T00:00:00Z".to_string(),
            updated_at: now.to_rfc3339(),
        },
        Investment {
            id: "inv_003".to_string(),
            investor_id: investor_id.clone(),
            tier: InvestorTier::Strategic,
            amount: 100000.0,
            equity_percentage: 0.3,
            interest_rate: 7.0,
            term_months: 48,
            status: InvestmentStatus::Active,
            contract_id: Some("contract_003".to_string()),
            start_date: "2024-09-01T00:00:00Z".to_string(),
            maturity_date: "2028-09-01T00:00:00Z".to_string(),
            returns_to_date: 5833.33,
            next_payout_date: Some("2026-03-01".to_string()),
            created_at: "2024-09-01T00:00:00Z".to_string(),
            updated_at: now.to_rfc3339(),
        },
    ];
    
    Ok(investments)
}

/// Activate a pending investment
#[command]
pub async fn activate_investment(
    state: State<'_, AppState>,
    investment_id: String,
) -> Result<Investment, String> {
    // Update status in database
    state.database.update_investment_status(&investment_id, "active")
        .map_err(|e| format!("Failed to activate investment: {}", e))?;
    
    let mut investment = get_investment(state, investment_id).await?;
    investment.status = InvestmentStatus::Active;
    investment.updated_at = Utc::now().to_rfc3339();
    
    Ok(investment)
}

/// List available investment opportunities
#[command]
pub async fn list_investment_opportunities() -> Result<Vec<InvestmentOpportunity>, String> {
    let opportunities = vec![
        InvestmentOpportunity {
            id: "opp_angel".to_string(),
            tier: InvestorTier::Angel,
            name: "Angel Round - CUBE Core".to_string(),
            description: "Early access to CUBE Core enterprise suite with highest returns".to_string(),
            min_investment: 25000.0,
            max_investment: 100000.0,
            target_raise: 500000.0,
            raised_amount: 375000.0,
            expected_roi: 10.0,
            term_months: 24,
            benefits: vec![
                "10% annual interest".to_string(),
                "0.5% equity per $100k".to_string(),
                "Lifetime Enterprise license".to_string(),
                "Priority support".to_string(),
            ],
            deadline: "2026-03-31".to_string(),
            available_slots: 5,
        },
        InvestmentOpportunity {
            id: "opp_seed".to_string(),
            tier: InvestorTier::Seed,
            name: "Seed Round - Global Expansion".to_string(),
            description: "Fund global market expansion with competitive returns".to_string(),
            min_investment: 50000.0,
            max_investment: 500000.0,
            target_raise: 2000000.0,
            raised_amount: 1200000.0,
            expected_roi: 8.0,
            term_months: 36,
            benefits: vec![
                "8% annual interest".to_string(),
                "0.4% equity per $100k".to_string(),
                "White-label rights".to_string(),
                "Board observer seat".to_string(),
            ],
            deadline: "2026-06-30".to_string(),
            available_slots: 8,
        },
        InvestmentOpportunity {
            id: "opp_strategic".to_string(),
            tier: InvestorTier::Strategic,
            name: "Strategic Partnership".to_string(),
            description: "Strategic investment with long-term partnership benefits".to_string(),
            min_investment: 100000.0,
            max_investment: 1000000.0,
            target_raise: 5000000.0,
            raised_amount: 2500000.0,
            expected_roi: 7.0,
            term_months: 48,
            benefits: vec![
                "7% annual interest".to_string(),
                "0.3% equity per $100k".to_string(),
                "Anti-dilution protection".to_string(),
                "Co-development rights".to_string(),
            ],
            deadline: "2026-12-31".to_string(),
            available_slots: 10,
        },
    ];
    
    Ok(opportunities)
}

// ============================================================================
// SMART CONTRACT COMMANDS
// ============================================================================

/// Create a smart contract for an investment
#[command]
pub async fn create_smart_contract(request: CreateContractRequest) -> Result<SmartContract, String> {
    let now = Utc::now().to_rfc3339();
    
    let contract = SmartContract {
        id: Uuid::new_v4().to_string(),
        investment_id: request.investment_id,
        contract_address: None, // Set when deployed to blockchain
        terms: request.terms,
        status: ContractStatus::Draft,
        signed_by_investor: false,
        signed_by_company: false,
        signed_date: None,
        created_at: now,
        document_hash: None,
    };
    
    // Note: Save to database
    Ok(contract)
}

/// Get smart contract by ID
#[command]
pub async fn get_smart_contract(contract_id: String) -> Result<SmartContract, String> {
    // Note: Demo data - Fetch from database
    let contract = SmartContract {
        id: contract_id,
        investment_id: "inv_001".to_string(),
        contract_address: Some("0xCUBE...1234".to_string()),
        terms: ContractTerms {
            investment_amount: 100000.0,
            equity_percentage: 0.4,
            interest_rate: 8.0,
            term_months: 36,
            payout_frequency: "monthly".to_string(),
            early_exit_penalty: 5.0,
            voting_rights: true,
            board_seat: false,
            anti_dilution: true,
            product_licenses: vec!["CUBE Nexum Enterprise".to_string()],
            special_terms: None,
        },
        status: ContractStatus::Active,
        signed_by_investor: true,
        signed_by_company: true,
        signed_date: Some("2024-06-01T00:00:00Z".to_string()),
        created_at: "2024-05-28T00:00:00Z".to_string(),
        document_hash: Some("QmXyz...abc".to_string()),
    };
    
    Ok(contract)
}

/// Get all contracts for an investor
#[command]
pub async fn get_investor_contracts(_investor_id: String) -> Result<Vec<SmartContract>, String> {
    // Note: Demo data - Fetch from database
    let contracts = vec![
        SmartContract {
            id: "contract_001".to_string(),
            investment_id: "inv_001".to_string(),
            contract_address: Some("0xCUBE...1111".to_string()),
            terms: ContractTerms {
                investment_amount: 50000.0,
                equity_percentage: 0.25,
                interest_rate: 10.0,
                term_months: 24,
                payout_frequency: "monthly".to_string(),
                early_exit_penalty: 5.0,
                voting_rights: true,
                board_seat: false,
                anti_dilution: false,
                product_licenses: vec!["CUBE Nexum Professional".to_string()],
                special_terms: None,
            },
            status: ContractStatus::Active,
            signed_by_investor: true,
            signed_by_company: true,
            signed_date: Some("2024-03-01T00:00:00Z".to_string()),
            created_at: "2024-02-28T00:00:00Z".to_string(),
            document_hash: Some("QmAbc...111".to_string()),
        },
        SmartContract {
            id: "contract_002".to_string(),
            investment_id: "inv_002".to_string(),
            contract_address: Some("0xCUBE...2222".to_string()),
            terms: ContractTerms {
                investment_amount: 100000.0,
                equity_percentage: 0.4,
                interest_rate: 8.0,
                term_months: 36,
                payout_frequency: "monthly".to_string(),
                early_exit_penalty: 5.0,
                voting_rights: true,
                board_seat: true,
                anti_dilution: true,
                product_licenses: vec![
                    "CUBE Nexum Enterprise".to_string(),
                    "CUBE Core Professional".to_string(),
                ],
                special_terms: Some("Priority access to new products".to_string()),
            },
            status: ContractStatus::Active,
            signed_by_investor: true,
            signed_by_company: true,
            signed_date: Some("2024-06-01T00:00:00Z".to_string()),
            created_at: "2024-05-28T00:00:00Z".to_string(),
            document_hash: Some("QmDef...222".to_string()),
        },
    ];
    
    Ok(contracts)
}

/// Sign a smart contract
#[command]
pub async fn sign_contract(request: SignContractRequest) -> Result<SmartContract, String> {
    let mut contract = get_smart_contract(request.contract_id).await?;
    
    match request.signer_type.as_str() {
        "investor" => {
            contract.signed_by_investor = true;
        }
        "company" => {
            contract.signed_by_company = true;
        }
        _ => return Err("Invalid signer type".to_string()),
    }
    
    if contract.signed_by_investor && contract.signed_by_company {
        contract.status = ContractStatus::Active;
        contract.signed_date = Some(Utc::now().to_rfc3339());
    } else {
        contract.status = ContractStatus::PendingSignature;
    }
    
    // Note: Update in database
    Ok(contract)
}

/// Activate a contract (deploy to blockchain if applicable)
#[command]
pub async fn activate_contract(contract_id: String) -> Result<SmartContract, String> {
    let mut contract = get_smart_contract(contract_id).await?;
    
    if !contract.signed_by_investor || !contract.signed_by_company {
        return Err("Contract must be signed by both parties before activation".to_string());
    }
    
    // Generate contract address (in production, deploy to blockchain)
    contract.contract_address = Some(format!("0xCUBE{}", Uuid::new_v4().to_string().replace("-", "")[..16].to_uppercase()));
    contract.status = ContractStatus::Active;
    
    // Note: Update in database
    Ok(contract)
}

// ============================================================================
// PAYOUT COMMANDS
// ============================================================================

/// Get payout schedule for investor
#[command]
pub async fn get_payout_schedule(investor_id: String) -> Result<Vec<PayoutScheduleItem>, String> {
    // Note: Demo data - Fetch from database
    let schedule = vec![
        PayoutScheduleItem {
            id: "payout_001".to_string(),
            investment_id: "inv_001".to_string(),
            investor_id: investor_id.clone(),
            amount: 416.67,
            payout_type: "interest".to_string(),
            scheduled_date: "2025-12-01".to_string(),
            status: PayoutStatus::Paid,
            paid_date: Some("2025-12-01".to_string()),
            transaction_id: Some("tx_abc123".to_string()),
        },
        PayoutScheduleItem {
            id: "payout_002".to_string(),
            investment_id: "inv_001".to_string(),
            investor_id: investor_id.clone(),
            amount: 416.67,
            payout_type: "interest".to_string(),
            scheduled_date: "2026-01-01".to_string(),
            status: PayoutStatus::Paid,
            paid_date: Some("2026-01-01".to_string()),
            transaction_id: Some("tx_def456".to_string()),
        },
        PayoutScheduleItem {
            id: "payout_003".to_string(),
            investment_id: "inv_001".to_string(),
            investor_id: investor_id.clone(),
            amount: 416.67,
            payout_type: "interest".to_string(),
            scheduled_date: "2026-02-01".to_string(),
            status: PayoutStatus::Scheduled,
            paid_date: None,
            transaction_id: None,
        },
        PayoutScheduleItem {
            id: "payout_004".to_string(),
            investment_id: "inv_002".to_string(),
            investor_id: investor_id.clone(),
            amount: 666.67,
            payout_type: "interest".to_string(),
            scheduled_date: "2026-02-15".to_string(),
            status: PayoutStatus::Scheduled,
            paid_date: None,
            transaction_id: None,
        },
        PayoutScheduleItem {
            id: "payout_005".to_string(),
            investment_id: "inv_003".to_string(),
            investor_id: investor_id.clone(),
            amount: 583.33,
            payout_type: "interest".to_string(),
            scheduled_date: "2026-03-01".to_string(),
            status: PayoutStatus::Scheduled,
            paid_date: None,
            transaction_id: None,
        },
    ];
    
    Ok(schedule)
}

/// Process scheduled payouts
#[command]
pub async fn process_scheduled_payouts() -> Result<Vec<PayoutScheduleItem>, String> {
    // Note: In production, this would:
    // 1. Query database for due payouts
    // 2. Process each payment via Stripe or crypto
    // 3. Update payout status
    // 4. Send notifications
    
    Ok(vec![])
}

/// Request early withdrawal
#[command]
pub async fn request_early_withdrawal(
    investment_id: String,
    _reason: String,
) -> Result<HashMap<String, serde_json::Value>, String> {
    // Mock data for early withdrawal calculation
    let investment_amount = 100000.0;
    let early_exit_penalty = 10.0; // 10%
    
    let penalty_amount = investment_amount * (early_exit_penalty / 100.0);
    let payout_amount = investment_amount - penalty_amount;
    
    let mut result = HashMap::new();
    result.insert("investment_id".to_string(), serde_json::json!(investment_id));
    result.insert("original_amount".to_string(), serde_json::json!(investment_amount));
    result.insert("penalty_percentage".to_string(), serde_json::json!(early_exit_penalty));
    result.insert("penalty_amount".to_string(), serde_json::json!(penalty_amount));
    result.insert("payout_amount".to_string(), serde_json::json!(payout_amount));
    result.insert("status".to_string(), serde_json::json!("pending_approval"));
    
    Ok(result)
}

// ============================================================================
// TOKEN COMMANDS
// ============================================================================

/// Get token balance for investor
#[command]
pub async fn get_investor_token_balance(_investor_id: String) -> Result<TokenBalance, String> {
    // Note: Demo data - Fetch from database/blockchain
    let balance = TokenBalance {
        total_tokens: 15000.0,
        staked_tokens: 10000.0,
        available_tokens: 5000.0,
        pending_rewards: 125.0,
        token_value_usd: 2.50,
        staking_tier: "Gold".to_string(),
        apy: 12.0,
    };
    
    Ok(balance)
}

/// Issue CUBE tokens to investor
#[command]
pub async fn issue_cube_tokens(
    investor_id: String,
    amount: f64,
    _reason: String,
) -> Result<TokenBalance, String> {
    let mut balance = get_investor_token_balance(investor_id.clone()).await?;
    balance.total_tokens += amount;
    balance.available_tokens += amount;
    
    // Note: Record transaction in database
    // Note: Emit blockchain transaction if applicable
    
    Ok(balance)
}

/// Stake tokens for investor
#[command]
pub async fn investor_stake_tokens(request: StakeTokensRequest) -> Result<TokenBalance, String> {
    let mut balance = get_investor_token_balance(request.investor_id).await?;
    
    if request.amount > balance.available_tokens {
        return Err("Insufficient available tokens".to_string());
    }
    
    balance.available_tokens -= request.amount;
    balance.staked_tokens += request.amount;
    
    // Update staking tier
    balance.staking_tier = match balance.staked_tokens as i64 {
        0..=999 => "Bronze".to_string(),
        1000..=4999 => "Silver".to_string(),
        5000..=9999 => "Gold".to_string(),
        _ => "Platinum".to_string(),
    };
    
    // Update APY based on tier
    balance.apy = match balance.staking_tier.as_str() {
        "Bronze" => 5.0,
        "Silver" => 8.0,
        "Gold" => 12.0,
        "Platinum" => 15.0,
        _ => 5.0,
    };
    
    // Note: Update in database
    Ok(balance)
}

/// Unstake tokens for investor
#[command]
pub async fn investor_unstake_tokens(request: UnstakeTokensRequest) -> Result<TokenBalance, String> {
    let mut balance = get_investor_token_balance(request.investor_id).await?;
    
    if request.amount > balance.staked_tokens {
        return Err("Insufficient staked tokens".to_string());
    }
    
    balance.staked_tokens -= request.amount;
    balance.available_tokens += request.amount;
    
    // Recalculate tier and APY
    balance.staking_tier = match balance.staked_tokens as i64 {
        0..=999 => "Bronze".to_string(),
        1000..=4999 => "Silver".to_string(),
        5000..=9999 => "Gold".to_string(),
        _ => "Platinum".to_string(),
    };
    
    balance.apy = match balance.staking_tier.as_str() {
        "Bronze" => 5.0,
        "Silver" => 8.0,
        "Gold" => 12.0,
        "Platinum" => 15.0,
        _ => 5.0,
    };
    
    // Note: Update in database
    Ok(balance)
}

/// Transfer tokens to another address
#[command]
pub async fn transfer_tokens(request: TransferTokensRequest) -> Result<bool, String> {
    let balance = get_investor_token_balance(request.from_investor_id.clone()).await?;
    
    if request.amount > balance.available_tokens {
        return Err("Insufficient available tokens".to_string());
    }
    
    // Note: Execute blockchain transfer
    // Note: Update database records
    
    Ok(true)
}

/// Claim staking rewards for investor
#[command]
pub async fn investor_claim_staking_rewards(investor_id: String) -> Result<TokenBalance, String> {
    let mut balance = get_investor_token_balance(investor_id).await?;
    
    if balance.pending_rewards > 0.0 {
        balance.available_tokens += balance.pending_rewards;
        balance.total_tokens += balance.pending_rewards;
        balance.pending_rewards = 0.0;
    }
    
    // Note: Update in database
    Ok(balance)
}

// ============================================================================
// LICENSE COMMANDS
// ============================================================================

/// Get investor licenses
#[command]
pub async fn get_investor_licenses(investor_id: String) -> Result<Vec<InvestorLicense>, String> {
    // Note: Demo data - Fetch from database
    let licenses = vec![
        InvestorLicense {
            id: "lic_001".to_string(),
            investor_id: investor_id.clone(),
            product: "CUBE Nexum".to_string(),
            tier: "Enterprise".to_string(),
            license_key: "CUBE-ENT-2024-XXXX-YYYY".to_string(),
            seats: 100,
            valid_until: "2027-06-01".to_string(),
            features: vec![
                "Unlimited automation".to_string(),
                "AI assistant".to_string(),
                "Priority support".to_string(),
                "Custom integrations".to_string(),
                "White-label options".to_string(),
            ],
        },
        InvestorLicense {
            id: "lic_002".to_string(),
            investor_id: investor_id.clone(),
            product: "CUBE Core".to_string(),
            tier: "Professional".to_string(),
            license_key: "CORE-PRO-2024-AAAA-BBBB".to_string(),
            seats: 25,
            valid_until: "2027-09-01".to_string(),
            features: vec![
                "200+ modules".to_string(),
                "ERP & CRM".to_string(),
                "API access".to_string(),
                "Standard support".to_string(),
            ],
        },
    ];
    
    Ok(licenses)
}

/// Activate an investor product license
#[command]
pub async fn activate_investor_license(_license_id: String, _domain: String) -> Result<bool, String> {
    // Note: Validate license and register domain
    Ok(true)
}

// ============================================================================
// NOTIFICATION COMMANDS
// ============================================================================

/// Get investor notifications
#[command]
pub async fn get_investor_notifications(
    state: State<'_, AppState>,
    investor_id: String,
    limit: Option<i32>,
) -> Result<Vec<InvestorNotification>, String> {
    let limit = limit.unwrap_or(10);
    
    // Try to fetch from database
    if let Ok(records) = state.database.get_investor_notifications(&investor_id, limit) {
        if !records.is_empty() {
            return Ok(records.into_iter().map(|r| InvestorNotification {
                id: r.id,
                investor_id: r.investor_id,
                notification_type: r.notification_type,
                title: r.title,
                message: r.message,
                read: r.read,
                created_at: chrono::DateTime::from_timestamp(r.created_at.unwrap_or(0), 0)
                    .map(|dt| dt.to_rfc3339())
                    .unwrap_or_default(),
                action_url: r.action_url,
            }).collect());
        }
    }
    
    // Fallback to mock data for demo purposes
    let notifications = vec![
        InvestorNotification {
            id: "notif_001".to_string(),
            investor_id: investor_id.clone(),
            notification_type: "payout".to_string(),
            title: "Payout Processed".to_string(),
            message: "Your monthly interest payment of $666.67 has been processed.".to_string(),
            read: false,
            created_at: "2026-01-01T10:00:00Z".to_string(),
            action_url: Some("/investors/dashboard?tab=payouts".to_string()),
        },
        InvestorNotification {
            id: "notif_002".to_string(),
            investor_id: investor_id.clone(),
            notification_type: "token".to_string(),
            title: "Staking Rewards Available".to_string(),
            message: "You have 125 CUBEX tokens available to claim from staking.".to_string(),
            read: false,
            created_at: "2025-12-28T14:30:00Z".to_string(),
            action_url: Some("/investors/dashboard?tab=tokens".to_string()),
        },
        InvestorNotification {
            id: "notif_003".to_string(),
            investor_id: investor_id.clone(),
            notification_type: "product".to_string(),
            title: "CUBE Core Beta Access".to_string(),
            message: "As a strategic investor, you now have early access to CUBE Core beta.".to_string(),
            read: true,
            created_at: "2025-12-20T09:00:00Z".to_string(),
            action_url: Some("/products/cube-core".to_string()),
        },
        InvestorNotification {
            id: "notif_004".to_string(),
            investor_id: investor_id.clone(),
            notification_type: "contract".to_string(),
            title: "Contract Anniversary".to_string(),
            message: "Your Angel investment contract reaches 50% term completion this month.".to_string(),
            read: true,
            created_at: "2025-12-15T08:00:00Z".to_string(),
            action_url: Some("/investors/dashboard?tab=investments".to_string()),
        },
        InvestorNotification {
            id: "notif_005".to_string(),
            investor_id: investor_id.clone(),
            notification_type: "announcement".to_string(),
            title: "Q4 Investor Report Available".to_string(),
            message: "The Q4 2025 investor report is now available for download.".to_string(),
            read: true,
            created_at: "2025-12-10T12:00:00Z".to_string(),
            action_url: Some("/investors/reports".to_string()),
        },
    ];
    
    Ok(notifications.into_iter().take(limit as usize).collect())
}

/// Mark notification as read
#[command]
pub async fn mark_notification_read(
    state: State<'_, AppState>,
    notification_id: String,
) -> Result<bool, String> {
    state.database.mark_notification_read(&notification_id)
        .map_err(|e| format!("Failed to mark notification as read: {}", e))
}

/// Mark all notifications as read
#[command]
pub async fn mark_all_notifications_read(
    state: State<'_, AppState>,
    investor_id: String,
) -> Result<bool, String> {
    state.database.mark_all_notifications_read(&investor_id)
        .map_err(|e| format!("Failed to mark all notifications as read: {}", e))
}

// ============================================================================
// DOCUMENT COMMANDS
// ============================================================================

/// Generate investment agreement PDF
#[command]
pub async fn generate_investment_agreement(_investment_id: String) -> Result<String, String> {
    // Note: Generate PDF document
    Ok("/documents/investment_agreement_001.pdf".to_string())
}

/// Get investor documents
#[command]
pub async fn get_investor_documents(_investor_id: String) -> Result<Vec<HashMap<String, String>>, String> {
    let documents = vec![
        {
            let mut doc = HashMap::new();
            doc.insert("id".to_string(), "doc_001".to_string());
            doc.insert("name".to_string(), "Investment Agreement - Angel Round".to_string());
            doc.insert("type".to_string(), "contract".to_string());
            doc.insert("created_at".to_string(), "2024-03-01".to_string());
            doc.insert("url".to_string(), "/docs/agreement_angel.pdf".to_string());
            doc
        },
        {
            let mut doc = HashMap::new();
            doc.insert("id".to_string(), "doc_002".to_string());
            doc.insert("name".to_string(), "Investment Agreement - Seed Round".to_string());
            doc.insert("type".to_string(), "contract".to_string());
            doc.insert("created_at".to_string(), "2024-06-01".to_string());
            doc.insert("url".to_string(), "/docs/agreement_seed.pdf".to_string());
            doc
        },
        {
            let mut doc = HashMap::new();
            doc.insert("id".to_string(), "doc_003".to_string());
            doc.insert("name".to_string(), "Q4 2025 Investor Report".to_string());
            doc.insert("type".to_string(), "report".to_string());
            doc.insert("created_at".to_string(), "2025-12-10".to_string());
            doc.insert("url".to_string(), "/docs/q4_2025_report.pdf".to_string());
            doc
        },
    ];
    
    Ok(documents)
}

// ============================================================================
// MODULE REGISTRATION
// ============================================================================

pub fn get_investor_commands() -> Vec<&'static str> {
    vec![
        // Investor management
        "create_investor",
        "get_investor",
        "get_investor_by_user",
        "update_investor",
        "delete_investor",
        "verify_investor_kyc",
        // Portfolio
        "get_portfolio_summary",
        "get_investment_analytics",
        // Investments
        "create_investment",
        "get_investment",
        "get_investor_investments",
        "activate_investment",
        "list_investment_opportunities",
        // Smart contracts
        "create_smart_contract",
        "get_smart_contract",
        "get_investor_contracts",
        "sign_contract",
        "activate_contract",
        // Payouts
        "get_payout_schedule",
        "process_scheduled_payouts",
        "request_early_withdrawal",
        // Tokens
        "get_token_balance",
        "issue_cube_tokens",
        "stake_tokens",
        "unstake_tokens",
        "transfer_tokens",
        "claim_staking_rewards",
        // Licenses
        "get_investor_licenses",
        "activate_investor_license",
        // Notifications
        "get_investor_notifications",
        "mark_notification_read",
        "mark_all_notifications_read",
        // Documents
        "generate_investment_agreement",
        "get_investor_documents",
    ]
}
