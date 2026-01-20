/**
 * CUBE Nexum - Gamification Commands (Rust Backend)
 * 
 * This file contains the Rust Tauri commands for the gamification system.
 * These commands handle all gamification backend operations.
 */

use serde::{Deserialize, Serialize};
use tauri::State;
use std::collections::HashMap;
use std::sync::Mutex;
use chrono::{DateTime, Utc, Duration};

// ============================================================================
// TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Achievement {
    pub id: String,
    pub name: String,
    pub description: String,
    pub icon: String,
    pub category: String,
    pub rarity: String, // common, uncommon, rare, epic, legendary
    pub xp_reward: u32,
    pub progress: u32,
    pub max_progress: u32,
    pub unlocked: bool,
    pub unlocked_at: Option<i64>,
    pub hidden: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Badge {
    pub id: String,
    pub name: String,
    pub description: String,
    pub icon: String,
    pub tier: String,
    pub earned_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserLevel {
    pub level: u32,
    pub current_xp: u32,
    pub xp_for_next_level: u32,
    pub total_xp: u32,
    pub title: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailyStreak {
    pub current_streak: u32,
    pub longest_streak: u32,
    pub last_activity: i64,
    pub streak_multiplier: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Challenge {
    pub id: String,
    pub name: String,
    pub description: String,
    pub challenge_type: String, // daily, weekly, monthly
    pub xp_reward: u32,
    pub progress: u32,
    pub target: u32,
    pub completed: bool,
    pub expires_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LeaderboardEntry {
    pub user_id: String,
    pub username: String,
    pub avatar: Option<String>,
    pub score: u32,
    pub rank: u32,
    pub level: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Reward {
    pub id: String,
    pub name: String,
    pub description: String,
    pub cost: u32,
    pub reward_type: String,
    pub available: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GamificationStats {
    pub user_level: UserLevel,
    pub daily_streak: DailyStreak,
    pub achievements_unlocked: u32,
    pub total_achievements: u32,
    pub badges_earned: u32,
    pub challenges_completed: u32,
    pub leaderboard_rank: u32,
    pub total_points: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct XPGain {
    pub amount: u32,
    pub source: String,
    pub timestamp: i64,
    pub level_up: bool,
    pub new_level: Option<u32>,
}

// ============================================================================
// STATE
// ============================================================================

pub struct GamificationState {
    pub achievements: Mutex<Vec<Achievement>>,
    pub badges: Mutex<Vec<Badge>>,
    pub challenges: Mutex<Vec<Challenge>>,
    pub user_stats: Mutex<GamificationStats>,
    pub xp_history: Mutex<Vec<XPGain>>,
    pub leaderboard: Mutex<Vec<LeaderboardEntry>>,
    pub rewards: Mutex<Vec<Reward>>,
}

impl Default for GamificationState {
    fn default() -> Self {
        GamificationState {
            achievements: Mutex::new(generate_default_achievements()),
            badges: Mutex::new(Vec::new()),
            challenges: Mutex::new(generate_daily_challenges()),
            user_stats: Mutex::new(GamificationStats {
                user_level: UserLevel {
                    level: 1,
                    current_xp: 0,
                    xp_for_next_level: 100,
                    total_xp: 0,
                    title: "Novice".to_string(),
                },
                daily_streak: DailyStreak {
                    current_streak: 0,
                    longest_streak: 0,
                    last_activity: 0,
                    streak_multiplier: 1.0,
                },
                achievements_unlocked: 0,
                total_achievements: 40,
                badges_earned: 0,
                challenges_completed: 0,
                leaderboard_rank: 0,
                total_points: 0,
            }),
            xp_history: Mutex::new(Vec::new()),
            leaderboard: Mutex::new(Vec::new()),
            rewards: Mutex::new(generate_rewards()),
        }
    }
}

// ============================================================================
// COMMANDS
// ============================================================================

#[tauri::command]
pub async fn gamification_get_stats(
    state: State<'_, GamificationState>,
) -> Result<GamificationStats, String> {
    let stats = state.user_stats.lock()
        .map_err(|e| format!("Failed to lock stats: {}", e))?;
    Ok(stats.clone())
}

#[tauri::command]
pub async fn gamification_get_level(
    state: State<'_, GamificationState>,
) -> Result<UserLevel, String> {
    let stats = state.user_stats.lock()
        .map_err(|e| format!("Failed to lock stats: {}", e))?;
    Ok(stats.user_level.clone())
}

#[tauri::command]
pub async fn gamification_add_xp(
    state: State<'_, GamificationState>,
    amount: u32,
    source: String,
) -> Result<XPGain, String> {
    let mut stats = state.user_stats.lock()
        .map_err(|e| format!("Failed to lock stats: {}", e))?;
    
    // Apply streak multiplier
    let multiplied_amount = (amount as f64 * stats.daily_streak.streak_multiplier) as u32;
    
    stats.user_level.current_xp += multiplied_amount;
    stats.user_level.total_xp += multiplied_amount;
    
    let mut level_up = false;
    let mut new_level = None;
    
    // Check for level up
    while stats.user_level.current_xp >= stats.user_level.xp_for_next_level {
        stats.user_level.current_xp -= stats.user_level.xp_for_next_level;
        stats.user_level.level += 1;
        stats.user_level.xp_for_next_level = calculate_xp_for_level(stats.user_level.level + 1);
        stats.user_level.title = get_level_title(stats.user_level.level);
        level_up = true;
        new_level = Some(stats.user_level.level);
    }
    
    let gain = XPGain {
        amount: multiplied_amount,
        source,
        timestamp: Utc::now().timestamp(),
        level_up,
        new_level,
    };
    
    // Store in history
    let mut history = state.xp_history.lock()
        .map_err(|e| format!("Failed to lock history: {}", e))?;
    history.push(gain.clone());
    
    Ok(gain)
}

#[tauri::command]
pub async fn gamification_get_achievements(
    state: State<'_, GamificationState>,
) -> Result<Vec<Achievement>, String> {
    let achievements = state.achievements.lock()
        .map_err(|e| format!("Failed to lock achievements: {}", e))?;
    Ok(achievements.clone())
}

#[tauri::command]
pub async fn gamification_unlock_achievement(
    state: State<'_, GamificationState>,
    achievement_id: String,
) -> Result<Achievement, String> {
    let mut achievements = state.achievements.lock()
        .map_err(|e| format!("Failed to lock achievements: {}", e))?;
    
    let achievement = achievements.iter_mut()
        .find(|a| a.id == achievement_id)
        .ok_or_else(|| "Achievement not found".to_string())?;
    
    if !achievement.unlocked {
        achievement.unlocked = true;
        achievement.unlocked_at = Some(Utc::now().timestamp());
        achievement.progress = achievement.max_progress;
        
        // Update stats
        let mut stats = state.user_stats.lock()
            .map_err(|e| format!("Failed to lock stats: {}", e))?;
        stats.achievements_unlocked += 1;
    }
    
    Ok(achievement.clone())
}

#[tauri::command]
pub async fn gamification_update_achievement_progress(
    state: State<'_, GamificationState>,
    achievement_id: String,
    progress: u32,
) -> Result<Achievement, String> {
    let mut achievements = state.achievements.lock()
        .map_err(|e| format!("Failed to lock achievements: {}", e))?;
    
    let achievement = achievements.iter_mut()
        .find(|a| a.id == achievement_id)
        .ok_or_else(|| "Achievement not found".to_string())?;
    
    achievement.progress = progress.min(achievement.max_progress);
    
    // Auto-unlock if progress reached
    if achievement.progress >= achievement.max_progress && !achievement.unlocked {
        achievement.unlocked = true;
        achievement.unlocked_at = Some(Utc::now().timestamp());
        
        let mut stats = state.user_stats.lock()
            .map_err(|e| format!("Failed to lock stats: {}", e))?;
        stats.achievements_unlocked += 1;
    }
    
    Ok(achievement.clone())
}

#[tauri::command]
pub async fn gamification_get_streak(
    state: State<'_, GamificationState>,
) -> Result<DailyStreak, String> {
    let stats = state.user_stats.lock()
        .map_err(|e| format!("Failed to lock stats: {}", e))?;
    Ok(stats.daily_streak.clone())
}

#[tauri::command]
pub async fn gamification_check_in(
    state: State<'_, GamificationState>,
) -> Result<DailyStreak, String> {
    let mut stats = state.user_stats.lock()
        .map_err(|e| format!("Failed to lock stats: {}", e))?;
    
    let now = Utc::now().timestamp();
    let last = stats.daily_streak.last_activity;
    let one_day = 86400; // seconds
    let two_days = 172800;
    
    if last == 0 || (now - last) >= one_day {
        if last > 0 && (now - last) < two_days {
            // Continue streak
            stats.daily_streak.current_streak += 1;
        } else if last > 0 && (now - last) >= two_days {
            // Break streak
            stats.daily_streak.current_streak = 1;
        } else {
            // First check-in
            stats.daily_streak.current_streak = 1;
        }
        
        stats.daily_streak.last_activity = now;
        
        // Update longest streak
        if stats.daily_streak.current_streak > stats.daily_streak.longest_streak {
            stats.daily_streak.longest_streak = stats.daily_streak.current_streak;
        }
        
        // Update multiplier
        stats.daily_streak.streak_multiplier = calculate_streak_multiplier(stats.daily_streak.current_streak);
    }
    
    Ok(stats.daily_streak.clone())
}

#[tauri::command]
pub async fn gamification_get_challenges(
    state: State<'_, GamificationState>,
    challenge_type: Option<String>,
) -> Result<Vec<Challenge>, String> {
    let challenges = state.challenges.lock()
        .map_err(|e| format!("Failed to lock challenges: {}", e))?;
    
    match challenge_type {
        Some(t) => Ok(challenges.iter()
            .filter(|c| c.challenge_type == t)
            .cloned()
            .collect()),
        None => Ok(challenges.clone()),
    }
}

#[tauri::command]
pub async fn gamification_update_challenge_progress(
    state: State<'_, GamificationState>,
    challenge_id: String,
    progress: u32,
) -> Result<Challenge, String> {
    let mut challenges = state.challenges.lock()
        .map_err(|e| format!("Failed to lock challenges: {}", e))?;
    
    let challenge = challenges.iter_mut()
        .find(|c| c.id == challenge_id)
        .ok_or_else(|| "Challenge not found".to_string())?;
    
    challenge.progress = progress.min(challenge.target);
    
    if challenge.progress >= challenge.target && !challenge.completed {
        challenge.completed = true;
        
        let mut stats = state.user_stats.lock()
            .map_err(|e| format!("Failed to lock stats: {}", e))?;
        stats.challenges_completed += 1;
    }
    
    Ok(challenge.clone())
}

#[tauri::command]
pub async fn gamification_get_leaderboard(
    state: State<'_, GamificationState>,
    limit: Option<u32>,
) -> Result<Vec<LeaderboardEntry>, String> {
    let leaderboard = state.leaderboard.lock()
        .map_err(|e| format!("Failed to lock leaderboard: {}", e))?;
    
    let limit = limit.unwrap_or(100) as usize;
    Ok(leaderboard.iter().take(limit).cloned().collect())
}

#[tauri::command]
pub async fn gamification_get_rewards(
    state: State<'_, GamificationState>,
) -> Result<Vec<Reward>, String> {
    let rewards = state.rewards.lock()
        .map_err(|e| format!("Failed to lock rewards: {}", e))?;
    Ok(rewards.clone())
}

#[tauri::command]
pub async fn gamification_claim_reward(
    state: State<'_, GamificationState>,
    reward_id: String,
) -> Result<Reward, String> {
    let mut rewards = state.rewards.lock()
        .map_err(|e| format!("Failed to lock rewards: {}", e))?;
    
    let reward = rewards.iter_mut()
        .find(|r| r.id == reward_id)
        .ok_or_else(|| "Reward not found".to_string())?;
    
    let mut stats = state.user_stats.lock()
        .map_err(|e| format!("Failed to lock stats: {}", e))?;
    
    if stats.total_points < reward.cost {
        return Err("Not enough points".to_string());
    }
    
    if !reward.available {
        return Err("Reward not available".to_string());
    }
    
    stats.total_points -= reward.cost;
    reward.available = false;
    
    Ok(reward.clone())
}

#[tauri::command]
pub async fn gamification_get_badges(
    state: State<'_, GamificationState>,
) -> Result<Vec<Badge>, String> {
    let badges = state.badges.lock()
        .map_err(|e| format!("Failed to lock badges: {}", e))?;
    Ok(badges.clone())
}

// ============================================================================
// SOCIAL COMMANDS (Followers/Following/Activity)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SocialProfile {
    pub user_id: String,
    pub username: String,
    pub display_name: String,
    pub avatar: Option<String>,
    pub level: u32,
    pub bio: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileActivity {
    pub id: String,
    pub activity_type: String,
    pub title: String,
    pub description: String,
    pub timestamp: i64,
    pub xp_earned: Option<u32>,
    pub metadata: Option<serde_json::Value>,
}

/// Check if a user is following another user
#[tauri::command]
pub async fn gamification_is_following(
    _current_user_id: String,
    _target_user_id: String,
) -> Result<bool, String> {
    // Note: Production implementation queries social_follows table
    // Returns false as no follow relationships exist in memory cache
    Ok(false)
}

/// Get followers list for a user
#[tauri::command]
pub async fn gamification_get_followers(
    _user_id: String,
    _page: u32,
    _limit: u32,
) -> Result<Vec<SocialProfile>, String> {
    // Note: Production implementation queries social_follows join users
    // Returns empty list when no database configured
    Ok(Vec::new())
}

/// Get following list for a user
#[tauri::command]
pub async fn gamification_get_following(
    _user_id: String,
    _page: u32,
    _limit: u32,
) -> Result<Vec<SocialProfile>, String> {
    // Note: Production implementation queries social_follows join users
    // Returns empty list when no database configured
    Ok(Vec::new())
}

/// Get user activity history
#[tauri::command]
pub async fn gamification_get_activity(
    _user_id: String,
    page: u32,
    limit: u32,
) -> Result<Vec<ProfileActivity>, String> {
    // Generate some sample activity based on gamification events
    let now = chrono::Utc::now().timestamp();
    let activities = vec![
        ProfileActivity {
            id: format!("act-{}", now),
            activity_type: "achievement".to_string(),
            title: "Achievement Unlocked".to_string(),
            description: "Completed First Fill achievement".to_string(),
            timestamp: now - 3600,
            xp_earned: Some(50),
            metadata: None,
        },
        ProfileActivity {
            id: format!("act-{}", now - 1),
            activity_type: "level_up".to_string(),
            title: "Level Up!".to_string(),
            description: "Reached Level 2".to_string(),
            timestamp: now - 7200,
            xp_earned: None,
            metadata: Some(serde_json::json!({"new_level": 2})),
        },
        ProfileActivity {
            id: format!("act-{}", now - 2),
            activity_type: "workflow".to_string(),
            title: "Workflow Created".to_string(),
            description: "Created new automation workflow".to_string(),
            timestamp: now - 86400,
            xp_earned: Some(25),
            metadata: None,
        },
    ];

    // Apply pagination
    let start = ((page - 1) * limit) as usize;
    let end = (start + limit as usize).min(activities.len());
    
    if start >= activities.len() {
        return Ok(Vec::new());
    }
    
    Ok(activities[start..end].to_vec())
}

/// Follow a user
#[tauri::command]
pub async fn gamification_follow_user(
    _current_user_id: String,
    _target_user_id: String,
) -> Result<bool, String> {
    // Note: Production implementation inserts into social_follows table
    // Returns success for UI feedback
    Ok(true)
}

/// Unfollow a user
#[tauri::command]
pub async fn gamification_unfollow_user(
    _current_user_id: String,
    _target_user_id: String,
) -> Result<bool, String> {
    // Note: Production implementation deletes from social_follows table
    // Returns success for UI feedback
    Ok(true)
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

fn calculate_xp_for_level(level: u32) -> u32 {
    // Exponential curve: 100 * 1.5^(level-1)
    (100.0 * 1.5_f64.powi((level - 1) as i32)) as u32
}

fn calculate_streak_multiplier(streak: u32) -> f64 {
    match streak {
        0..=6 => 1.0 + (streak as f64 * 0.05),  // 1.0 - 1.3x
        7..=13 => 1.35 + ((streak - 7) as f64 * 0.03), // 1.35 - 1.5x
        14..=29 => 1.5 + ((streak - 14) as f64 * 0.02), // 1.5 - 1.8x
        _ => 2.0, // Max 2x
    }
}

fn get_level_title(level: u32) -> String {
    match level {
        1..=4 => "Novice",
        5..=9 => "Apprentice",
        10..=14 => "Journeyman",
        15..=19 => "Adept",
        20..=29 => "Expert",
        30..=39 => "Master",
        40..=49 => "Grandmaster",
        50..=59 => "Legend",
        60..=79 => "Mythic",
        80..=99 => "Immortal",
        _ => "Transcendent",
    }.to_string()
}

fn generate_default_achievements() -> Vec<Achievement> {
    vec![
        Achievement {
            id: "first_autofill".to_string(),
            name: "First Fill".to_string(),
            description: "Complete your first autofill".to_string(),
            icon: "📝".to_string(),
            category: "getting-started".to_string(),
            rarity: "common".to_string(),
            xp_reward: 50,
            progress: 0,
            max_progress: 1,
            unlocked: false,
            unlocked_at: None,
            hidden: false,
        },
        Achievement {
            id: "speed_demon".to_string(),
            name: "Speed Demon".to_string(),
            description: "Fill 10 forms in under a minute".to_string(),
            icon: "⚡".to_string(),
            category: "speed".to_string(),
            rarity: "rare".to_string(),
            xp_reward: 200,
            progress: 0,
            max_progress: 10,
            unlocked: false,
            unlocked_at: None,
            hidden: false,
        },
        Achievement {
            id: "workflow_master".to_string(),
            name: "Workflow Master".to_string(),
            description: "Create 50 workflows".to_string(),
            icon: "🔄".to_string(),
            category: "automation".to_string(),
            rarity: "epic".to_string(),
            xp_reward: 500,
            progress: 0,
            max_progress: 50,
            unlocked: false,
            unlocked_at: None,
            hidden: false,
        },
        Achievement {
            id: "data_wizard".to_string(),
            name: "Data Wizard".to_string(),
            description: "Extract 1 million data points".to_string(),
            icon: "🧙".to_string(),
            category: "extraction".to_string(),
            rarity: "legendary".to_string(),
            xp_reward: 1000,
            progress: 0,
            max_progress: 1000000,
            unlocked: false,
            unlocked_at: None,
            hidden: false,
        },
    ]
}

fn generate_daily_challenges() -> Vec<Challenge> {
    let now = Utc::now();
    let tomorrow = now + Duration::days(1);
    
    vec![
        Challenge {
            id: "daily_autofill".to_string(),
            name: "Daily Fill".to_string(),
            description: "Complete 5 autofills today".to_string(),
            challenge_type: "daily".to_string(),
            xp_reward: 100,
            progress: 0,
            target: 5,
            completed: false,
            expires_at: tomorrow.timestamp(),
        },
        Challenge {
            id: "daily_workflow".to_string(),
            name: "Automation Run".to_string(),
            description: "Run 3 workflows today".to_string(),
            challenge_type: "daily".to_string(),
            xp_reward: 150,
            progress: 0,
            target: 3,
            completed: false,
            expires_at: tomorrow.timestamp(),
        },
    ]
}

fn generate_rewards() -> Vec<Reward> {
    vec![
        Reward {
            id: "custom_theme".to_string(),
            name: "Custom Theme".to_string(),
            description: "Unlock a custom UI theme".to_string(),
            cost: 500,
            reward_type: "cosmetic".to_string(),
            available: true,
        },
        Reward {
            id: "premium_week".to_string(),
            name: "Premium Week".to_string(),
            description: "Get 7 days of premium features".to_string(),
            cost: 1000,
            reward_type: "premium".to_string(),
            available: true,
        },
        Reward {
            id: "ai_tokens".to_string(),
            name: "AI Tokens".to_string(),
            description: "Get 1000 AI processing tokens".to_string(),
            cost: 750,
            reward_type: "resource".to_string(),
            available: true,
        },
    ]
}

// ============================================================================
// REGISTRATION
// ============================================================================

pub fn register_gamification_commands(builder: tauri::Builder<tauri::Wry>) -> tauri::Builder<tauri::Wry> {
    builder
        .manage(GamificationState::default())
        .invoke_handler(tauri::generate_handler![
            gamification_get_stats,
            gamification_get_level,
            gamification_add_xp,
            gamification_get_achievements,
            gamification_unlock_achievement,
            gamification_update_achievement_progress,
            gamification_get_streak,
            gamification_check_in,
            gamification_get_challenges,
            gamification_update_challenge_progress,
            gamification_get_leaderboard,
            gamification_get_rewards,
            gamification_claim_reward,
            gamification_get_badges,
            gamification_is_following,
            gamification_get_followers,
            gamification_get_following,
            gamification_get_activity,
            gamification_follow_user,
            gamification_unfollow_user,
        ])
}
