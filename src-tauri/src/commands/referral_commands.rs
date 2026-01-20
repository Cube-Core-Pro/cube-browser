/**
 * CUBE Nexum - Referral Commands (Rust Backend)
 * 
 * This file contains the Rust Tauri commands for the viral referral system.
 */

use serde::{Deserialize, Serialize};
use tauri::State;
use std::sync::Mutex;
use chrono::{DateTime, Utc, Datelike, Timelike};
use uuid::Uuid;

// ============================================================================
// TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReferralCode {
    pub code: String,
    pub user_id: String,
    pub created_at: i64,
    pub expires_at: Option<i64>,
    pub uses: u32,
    pub max_uses: Option<u32>,
    pub tier: String, // bronze, silver, gold, platinum, diamond
    pub custom_reward: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Referral {
    pub id: String,
    pub referrer_id: String,
    pub referee_id: String,
    pub code_used: String,
    pub status: String, // pending, completed, rewarded, expired
    pub reward_amount: u32,
    pub created_at: i64,
    pub completed_at: Option<i64>,
    pub rewarded_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReferralStats {
    pub total_referrals: u32,
    pub successful_referrals: u32,
    pub pending_referrals: u32,
    pub total_rewards_earned: u32,
    pub current_tier: String,
    pub referrals_to_next_tier: u32,
    pub lifetime_referrals: u32,
    pub this_month_referrals: u32,
    pub this_month_earnings: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Campaign {
    pub id: String,
    pub name: String,
    pub description: String,
    pub multiplier: f64,
    pub bonus_xp: u32,
    pub starts_at: i64,
    pub ends_at: i64,
    pub active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LeaderboardUser {
    pub user_id: String,
    pub username: String,
    pub avatar: Option<String>,
    pub referral_count: u32,
    pub tier: String,
    pub rank: u32,
}

// ============================================================================
// STATE
// ============================================================================

pub struct ReferralState {
    pub codes: Mutex<Vec<ReferralCode>>,
    pub referrals: Mutex<Vec<Referral>>,
    pub campaigns: Mutex<Vec<Campaign>>,
    pub user_stats: Mutex<ReferralStats>,
    pub leaderboard: Mutex<Vec<LeaderboardUser>>,
}

impl Default for ReferralState {
    fn default() -> Self {
        ReferralState {
            codes: Mutex::new(Vec::new()),
            referrals: Mutex::new(Vec::new()),
            campaigns: Mutex::new(generate_default_campaigns()),
            user_stats: Mutex::new(ReferralStats {
                total_referrals: 0,
                successful_referrals: 0,
                pending_referrals: 0,
                total_rewards_earned: 0,
                current_tier: "bronze".to_string(),
                referrals_to_next_tier: 5,
                lifetime_referrals: 0,
                this_month_referrals: 0,
                this_month_earnings: 0,
            }),
            leaderboard: Mutex::new(Vec::new()),
        }
    }
}

// ============================================================================
// TIER CONFIGURATION
// ============================================================================

const TIER_REQUIREMENTS: &[(&str, u32)] = &[
    ("bronze", 0),
    ("silver", 5),
    ("gold", 15),
    ("platinum", 50),
    ("diamond", 100),
];

const TIER_REWARDS: &[(&str, u32, u32, u32)] = &[
    // (tier, xp_per_referral, credits_per_referral, premium_days)
    ("bronze", 100, 50, 0),
    ("silver", 150, 75, 3),
    ("gold", 200, 100, 7),
    ("platinum", 300, 150, 14),
    ("diamond", 500, 250, 30),
];

// ============================================================================
// COMMANDS
// ============================================================================

#[tauri::command]
pub async fn referral_generate_code(
    state: State<'_, ReferralState>,
    user_id: String,
) -> Result<ReferralCode, String> {
    let mut codes = state.codes.lock()
        .map_err(|e| format!("Failed to lock codes: {}", e))?;
    
    // Check if user already has a code
    if let Some(existing) = codes.iter().find(|c| c.user_id == user_id) {
        return Ok(existing.clone());
    }
    
    // Generate new code
    let code = ReferralCode {
        code: generate_unique_code(&user_id),
        user_id: user_id.clone(),
        created_at: Utc::now().timestamp(),
        expires_at: None,
        uses: 0,
        max_uses: None,
        tier: "bronze".to_string(),
        custom_reward: None,
    };
    
    codes.push(code.clone());
    Ok(code)
}

#[tauri::command]
pub async fn referral_get_code(
    state: State<'_, ReferralState>,
    user_id: String,
) -> Result<Option<ReferralCode>, String> {
    let codes = state.codes.lock()
        .map_err(|e| format!("Failed to lock codes: {}", e))?;
    
    Ok(codes.iter().find(|c| c.user_id == user_id).cloned())
}

#[tauri::command]
pub async fn referral_validate_code(
    state: State<'_, ReferralState>,
    code: String,
) -> Result<bool, String> {
    let codes = state.codes.lock()
        .map_err(|e| format!("Failed to lock codes: {}", e))?;
    
    if let Some(ref_code) = codes.iter().find(|c| c.code == code) {
        // Check expiration
        if let Some(expires_at) = ref_code.expires_at {
            if Utc::now().timestamp() > expires_at {
                return Ok(false);
            }
        }
        
        // Check max uses
        if let Some(max_uses) = ref_code.max_uses {
            if ref_code.uses >= max_uses {
                return Ok(false);
            }
        }
        
        return Ok(true);
    }
    
    Ok(false)
}

#[tauri::command]
pub async fn referral_apply_code(
    state: State<'_, ReferralState>,
    code: String,
    referee_id: String,
) -> Result<Referral, String> {
    let mut codes = state.codes.lock()
        .map_err(|e| format!("Failed to lock codes: {}", e))?;
    
    let ref_code = codes.iter_mut()
        .find(|c| c.code == code)
        .ok_or_else(|| "Invalid referral code".to_string())?;
    
    // Validate
    if let Some(expires_at) = ref_code.expires_at {
        if Utc::now().timestamp() > expires_at {
            return Err("Code has expired".to_string());
        }
    }
    
    if let Some(max_uses) = ref_code.max_uses {
        if ref_code.uses >= max_uses {
            return Err("Code has reached maximum uses".to_string());
        }
    }
    
    if ref_code.user_id == referee_id {
        return Err("Cannot use your own referral code".to_string());
    }
    
    // Create referral
    let reward = get_tier_reward(&ref_code.tier);
    let referral = Referral {
        id: Uuid::new_v4().to_string(),
        referrer_id: ref_code.user_id.clone(),
        referee_id,
        code_used: code.clone(),
        status: "pending".to_string(),
        reward_amount: reward,
        created_at: Utc::now().timestamp(),
        completed_at: None,
        rewarded_at: None,
    };
    
    ref_code.uses += 1;
    
    let mut referrals = state.referrals.lock()
        .map_err(|e| format!("Failed to lock referrals: {}", e))?;
    referrals.push(referral.clone());
    
    // Update stats
    let mut stats = state.user_stats.lock()
        .map_err(|e| format!("Failed to lock stats: {}", e))?;
    stats.total_referrals += 1;
    stats.pending_referrals += 1;
    
    Ok(referral)
}

#[tauri::command]
pub async fn referral_complete(
    state: State<'_, ReferralState>,
    referral_id: String,
) -> Result<Referral, String> {
    let mut referrals = state.referrals.lock()
        .map_err(|e| format!("Failed to lock referrals: {}", e))?;
    
    let referral = referrals.iter_mut()
        .find(|r| r.id == referral_id)
        .ok_or_else(|| "Referral not found".to_string())?;
    
    if referral.status != "pending" {
        return Err("Referral already processed".to_string());
    }
    
    referral.status = "completed".to_string();
    referral.completed_at = Some(Utc::now().timestamp());
    
    let mut stats = state.user_stats.lock()
        .map_err(|e| format!("Failed to lock stats: {}", e))?;
    stats.successful_referrals += 1;
    stats.pending_referrals = stats.pending_referrals.saturating_sub(1);
    stats.lifetime_referrals += 1;
    
    // Check for tier upgrade
    update_tier(&mut stats);
    
    Ok(referral.clone())
}

#[tauri::command]
pub async fn referral_claim_reward(
    state: State<'_, ReferralState>,
    referral_id: String,
) -> Result<Referral, String> {
    let mut referrals = state.referrals.lock()
        .map_err(|e| format!("Failed to lock referrals: {}", e))?;
    
    let referral = referrals.iter_mut()
        .find(|r| r.id == referral_id)
        .ok_or_else(|| "Referral not found".to_string())?;
    
    if referral.status != "completed" {
        return Err("Referral not yet completed".to_string());
    }
    
    referral.status = "rewarded".to_string();
    referral.rewarded_at = Some(Utc::now().timestamp());
    
    let mut stats = state.user_stats.lock()
        .map_err(|e| format!("Failed to lock stats: {}", e))?;
    stats.total_rewards_earned += referral.reward_amount;
    
    Ok(referral.clone())
}

#[tauri::command]
pub async fn referral_get_stats(
    state: State<'_, ReferralState>,
) -> Result<ReferralStats, String> {
    let mut stats = state.user_stats.lock()
        .map_err(|e| format!("Failed to lock stats: {}", e))?;
    
    // Calculate this month's stats from referrals
    let referrals = state.referrals.lock()
        .map_err(|e| format!("Failed to lock referrals: {}", e))?;
    
    let now = Utc::now();
    let start_of_month = now
        .with_day(1).unwrap_or(now)
        .with_hour(0).unwrap_or(now)
        .with_minute(0).unwrap_or(now)
        .with_second(0).unwrap_or(now)
        .timestamp();
    
    let (month_referrals, month_earnings) = referrals.iter()
        .filter(|r| r.created_at >= start_of_month)
        .fold((0u32, 0u32), |(count, earnings), r| {
            (count + 1, earnings + r.reward_amount)
        });
    
    stats.this_month_referrals = month_referrals;
    stats.this_month_earnings = month_earnings;
    
    Ok(stats.clone())
}

#[tauri::command]
pub async fn referral_get_referrals(
    state: State<'_, ReferralState>,
    user_id: Option<String>,
    status: Option<String>,
) -> Result<Vec<Referral>, String> {
    let referrals = state.referrals.lock()
        .map_err(|e| format!("Failed to lock referrals: {}", e))?;
    
    let filtered: Vec<Referral> = referrals.iter()
        .filter(|r| {
            let user_match = user_id.as_ref()
                .map_or(true, |id| &r.referrer_id == id || &r.referee_id == id);
            let status_match = status.as_ref()
                .map_or(true, |s| &r.status == s);
            user_match && status_match
        })
        .cloned()
        .collect();
    
    Ok(filtered)
}

#[tauri::command]
pub async fn referral_get_campaigns(
    state: State<'_, ReferralState>,
    active_only: Option<bool>,
) -> Result<Vec<Campaign>, String> {
    let campaigns = state.campaigns.lock()
        .map_err(|e| format!("Failed to lock campaigns: {}", e))?;
    
    let now = Utc::now().timestamp();
    
    let filtered: Vec<Campaign> = campaigns.iter()
        .filter(|c| {
            if active_only.unwrap_or(false) {
                c.active && now >= c.starts_at && now <= c.ends_at
            } else {
                true
            }
        })
        .cloned()
        .collect();
    
    Ok(filtered)
}

#[tauri::command]
pub async fn referral_get_leaderboard(
    state: State<'_, ReferralState>,
    _period: Option<String>,
    limit: Option<u32>,
) -> Result<Vec<LeaderboardUser>, String> {
    let leaderboard = state.leaderboard.lock()
        .map_err(|e| format!("Failed to lock leaderboard: {}", e))?;
    
    let limit = limit.unwrap_or(100) as usize;
    Ok(leaderboard.iter().take(limit).cloned().collect())
}

#[tauri::command]
pub async fn referral_get_share_content(
    code: String,
    platform: String,
) -> Result<String, String> {
    let message = match platform.as_str() {
        "twitter" => format!(
            "🚀 I'm using CUBE Nexum to automate my work and it's amazing! \
            Join me with my code {} and get premium features FREE! \
            #CUBENexum #Productivity #Automation",
            code
        ),
        "linkedin" => format!(
            "I've been using CUBE Nexum for browser automation and it's \
            transformed my workflow. If you're looking to boost your \
            productivity, use my referral code {} for bonus features!",
            code
        ),
        "email" => format!(
            "Hey!\n\nI wanted to share CUBE Nexum with you - it's an amazing \
            browser automation tool I've been using.\n\nUse my referral code: {}\n\n\
            You'll get premium features and I'll earn rewards too!\n\n\
            Check it out: https://cubenexum.com/invite/{}",
            code, code
        ),
        _ => format!(
            "Join me on CUBE Nexum! Use my code {} for bonus features: \
            https://cubenexum.com/invite/{}",
            code, code
        ),
    };
    
    Ok(message)
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

fn generate_unique_code(user_id: &str) -> String {
    let timestamp = Utc::now().timestamp() % 10000;
    let user_part: String = user_id.chars().take(4).collect();
    let random: String = Uuid::new_v4().to_string().chars().take(4).collect();
    format!("CUBE-{}{}{}", user_part.to_uppercase(), timestamp, random.to_uppercase())
}

fn get_tier_reward(tier: &str) -> u32 {
    TIER_REWARDS.iter()
        .find(|(t, _, _, _)| *t == tier)
        .map(|(_, _, credits, _)| *credits)
        .unwrap_or(50)
}

fn update_tier(stats: &mut ReferralStats) {
    let count = stats.lifetime_referrals;
    
    for (tier, requirement) in TIER_REQUIREMENTS.iter().rev() {
        if count >= *requirement {
            stats.current_tier = tier.to_string();
            
            // Calculate referrals to next tier
            if let Some(next) = TIER_REQUIREMENTS.iter()
                .find(|(_, req)| *req > count) {
                stats.referrals_to_next_tier = next.1 - count;
            } else {
                stats.referrals_to_next_tier = 0;
            }
            
            break;
        }
    }
}

fn generate_default_campaigns() -> Vec<Campaign> {
    let now = Utc::now();
    
    vec![
        Campaign {
            id: "launch_2025".to_string(),
            name: "Launch Celebration".to_string(),
            description: "Double rewards for all referrals!".to_string(),
            multiplier: 2.0,
            bonus_xp: 100,
            starts_at: now.timestamp(),
            ends_at: (now + chrono::Duration::days(30)).timestamp(),
            active: true,
        },
        Campaign {
            id: "summer_blast".to_string(),
            name: "Summer Blast".to_string(),
            description: "50% extra rewards this summer!".to_string(),
            multiplier: 1.5,
            bonus_xp: 50,
            starts_at: (now + chrono::Duration::days(60)).timestamp(),
            ends_at: (now + chrono::Duration::days(90)).timestamp(),
            active: false,
        },
    ]
}

// ============================================================================
// REGISTRATION
// ============================================================================

pub fn register_referral_commands(builder: tauri::Builder<tauri::Wry>) -> tauri::Builder<tauri::Wry> {
    builder
        .manage(ReferralState::default())
        .invoke_handler(tauri::generate_handler![
            referral_generate_code,
            referral_get_code,
            referral_validate_code,
            referral_apply_code,
            referral_complete,
            referral_claim_reward,
            referral_get_stats,
            referral_get_referrals,
            referral_get_campaigns,
            referral_get_leaderboard,
            referral_get_share_content,
        ])
}
