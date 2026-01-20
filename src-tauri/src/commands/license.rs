// ============================================================================
// CUBE Nexum Elite - License Commands
// ============================================================================
// Tauri commands for license management
// ============================================================================

use tauri::State;
use serde::{Deserialize, Serialize};
use crate::services::license_service::{
    LicenseService, License, LicenseTier, LicenseStatus, LicenseConfig,
    LicenseInfo as ServiceLicenseInfo, TrialInfo, TrialInfoResponse,
};

// ============================================================================
// Response Types
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LicenseInfoResponse {
    pub has_license: bool,
    pub tier: String,
    pub status: String,
    pub user_email: Option<String>,
    pub expires_at: Option<u64>,
    pub days_remaining: Option<i64>,
    pub device_id: String,
    pub is_offline_mode: bool,
    pub trial: Option<TrialInfoResponse>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeatureAccess {
    pub feature: String,
    pub allowed: bool,
    pub required_tier: String,
    pub current_tier: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrialStartResponse {
    pub success: bool,
    pub days_remaining: i64,
    pub trial_end_date: String,
    pub message: String,
}

// ============================================================================
// License Validation Commands
// ============================================================================

/// Validate the current license (checks cache and server)
#[tauri::command]
pub async fn validate_license(
    license_service: State<'_, LicenseService>,
) -> Result<LicenseInfoResponse, String> {
    match license_service.validate_license().await {
        Ok(license) => Ok(license_to_info(license, &license_service).await),
        Err(_e) => {
            // Check if there's an active trial
            let trial = license_service.get_trial_info().await;
            let device_id = license_service.get_device_id().await;
            
            if let Some(ref trial_info) = trial {
                if trial_info.is_active {
                    return Ok(LicenseInfoResponse {
                        has_license: true,
                        tier: "elite".to_string(),
                        status: "trial".to_string(),
                        user_email: None,
                        expires_at: Some(trial_info.expires_at),
                        days_remaining: Some(trial_info.days_remaining),
                        device_id,
                        is_offline_mode: false,
                        trial: Some(TrialInfoResponse {
                            is_active: true,
                            days_remaining: trial_info.days_remaining,
                            trial_end_date: trial_info.get_end_date_string(),
                            trial_tier: "elite".to_string(),
                        }),
                    });
                }
            }
            
            // Return free tier info on error
            Ok(LicenseInfoResponse {
                has_license: false,
                tier: "free".to_string(),
                status: "not_activated".to_string(),
                user_email: None,
                expires_at: None,
                days_remaining: None,
                device_id,
                is_offline_mode: false,
                trial: None,
            })
        }
    }
}

/// Activate a new license with license key
#[tauri::command]
pub async fn activate_license(
    license_key: String,
    user_email: String,
    license_service: State<'_, LicenseService>,
) -> Result<LicenseInfoResponse, String> {
    let license = license_service.activate_license(&license_key, &user_email).await?;
    Ok(license_to_info(license, &license_service).await)
}

/// Deactivate the current license (for switching devices)
#[tauri::command]
pub async fn deactivate_license(
    license_service: State<'_, LicenseService>,
) -> Result<(), String> {
    license_service.deactivate_license().await
}

/// Get current license status without server validation
#[tauri::command]
pub async fn get_license_status(
    license_service: State<'_, LicenseService>,
) -> Result<LicenseInfoResponse, String> {
    let device_id = license_service.get_device_id().await;
    
    match license_service.get_current_license().await {
        Some(license) => Ok(license_to_info(license, &license_service).await),
        None => {
            // Check for trial
            let trial = license_service.get_trial_info().await;
            
            if let Some(ref trial_info) = trial {
                if trial_info.is_active {
                    return Ok(LicenseInfoResponse {
                        has_license: true,
                        tier: "elite".to_string(),
                        status: "trial".to_string(),
                        user_email: None,
                        expires_at: Some(trial_info.expires_at),
                        days_remaining: Some(trial_info.days_remaining),
                        device_id,
                        is_offline_mode: false,
                        trial: Some(TrialInfoResponse {
                            is_active: true,
                            days_remaining: trial_info.days_remaining,
                            trial_end_date: trial_info.get_end_date_string(),
                            trial_tier: "elite".to_string(),
                        }),
                    });
                }
            }
            
            Ok(LicenseInfoResponse {
                has_license: false,
                tier: "free".to_string(),
                status: "not_activated".to_string(),
                user_email: None,
                expires_at: None,
                days_remaining: None,
                device_id,
                is_offline_mode: false,
                trial: None,
            })
        },
    }
}

/// Get the current tier (for quick checks)
#[tauri::command]
pub async fn get_license_tier(
    license_service: State<'_, LicenseService>,
) -> Result<String, String> {
    let tier = license_service.get_effective_tier().await;
    Ok(tier.to_string())
}

/// Get device ID (for display to user)
#[tauri::command]
pub async fn get_device_id(
    license_service: State<'_, LicenseService>,
) -> Result<String, String> {
    Ok(license_service.get_device_id().await)
}

// ============================================================================
// Trial System Commands
// ============================================================================

/// Start a new 30-day Elite trial
#[tauri::command]
pub async fn start_trial(
    _tier: String, // Always starts as Elite, but kept for future flexibility
    license_service: State<'_, LicenseService>,
) -> Result<TrialStartResponse, String> {
    let trial = license_service.start_trial().await?;
    
    Ok(TrialStartResponse {
        success: true,
        days_remaining: trial.days_remaining,
        trial_end_date: trial.get_end_date_string(),
        message: "Your 30-day Elite trial has started! Enjoy all premium features.".to_string(),
    })
}

/// Get current trial status
#[tauri::command]
pub async fn get_trial_status(
    license_service: State<'_, LicenseService>,
) -> Result<Option<TrialInfoResponse>, String> {
    match license_service.get_trial_info().await {
        Some(trial) => Ok(Some(TrialInfoResponse {
            is_active: trial.is_active,
            days_remaining: trial.days_remaining,
            trial_end_date: trial.get_end_date_string(),
            trial_tier: "elite".to_string(),
        })),
        None => Ok(None),
    }
}

/// Get comprehensive license info (for pricing page)
#[tauri::command]
pub async fn get_license_info(
    license_service: State<'_, LicenseService>,
) -> Result<ServiceLicenseInfo, String> {
    Ok(license_service.get_license_info().await)
}

/// Check if trial is active
#[tauri::command]
pub async fn is_trial_active(
    license_service: State<'_, LicenseService>,
) -> Result<bool, String> {
    Ok(license_service.is_trial_active().await)
}

// ============================================================================
// Feature Access Commands
// ============================================================================

/// Check if a specific feature is allowed
#[tauri::command]
pub async fn check_feature_access(
    feature: String,
    license_service: State<'_, LicenseService>,
) -> Result<FeatureAccess, String> {
    let allowed = license_service.is_feature_allowed(&feature).await;
    let current_tier = license_service.get_tier().await;
    
    let required_tier = get_required_tier(&feature);
    
    Ok(FeatureAccess {
        feature,
        allowed,
        required_tier,
        current_tier: current_tier.to_string(),
    })
}

/// Check multiple features at once
#[tauri::command]
pub async fn check_features_access(
    features: Vec<String>,
    license_service: State<'_, LicenseService>,
) -> Result<Vec<FeatureAccess>, String> {
    let current_tier = license_service.get_tier().await;
    let mut results = Vec::new();
    
    for feature in features {
        let allowed = license_service.is_feature_allowed(&feature).await;
        let required_tier = get_required_tier(&feature);
        
        results.push(FeatureAccess {
            feature,
            allowed,
            required_tier,
            current_tier: current_tier.to_string(),
        });
    }
    
    Ok(results)
}

// ============================================================================
// Configuration Commands
// ============================================================================

/// Set license server configuration (called on app startup)
#[tauri::command]
pub async fn set_license_config(
    server_url: String,
    server_public_key: Option<String>,
    app_secret: String,
    debug_mode: Option<bool>,
    timeout_secs: Option<u64>,
    license_service: State<'_, LicenseService>,
) -> Result<(), String> {
    use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
    
    let app_secret_bytes = BASE64.decode(&app_secret)
        .map_err(|e| format!("Invalid app secret encoding: {}", e))?;
    
    let config = LicenseConfig {
        server_url,
        server_public_key: server_public_key.unwrap_or_default(),
        app_secret: app_secret_bytes,
        timeout_secs: timeout_secs.unwrap_or(30),
        debug_mode: debug_mode.unwrap_or(false),
    };
    
    license_service.set_config(config).await;
    Ok(())
}

// ============================================================================
// Stripe Integration Commands
// ============================================================================

/// Create license after successful Stripe payment
/// This should be called from your webhook handler
#[tauri::command]
pub async fn create_license_from_stripe(
    _stripe_customer_id: String,
    _stripe_subscription_id: String,
    _user_email: String,
    _tier: String,
    _license_service: State<'_, LicenseService>,
) -> Result<ServiceLicenseInfo, String> {
    // This command should only be called by your server after verifying the Stripe webhook
    // The actual license creation happens on your license server
    
    // For now, we'll just validate any existing license
    // The real flow is:
    // 1. Stripe webhook → Your server
    // 2. Your server creates license in database
    // 3. User enters license key or it's automatically activated via email
    
    Err("License creation should happen on the license server after Stripe webhook verification".to_string())
}

// ============================================================================
// Helper Functions
// ============================================================================

async fn license_to_info(license: License, service: &LicenseService) -> LicenseInfoResponse {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    
    let days_remaining = if license.expires_at > now {
        Some(((license.expires_at - now) / (24 * 60 * 60)) as i64)
    } else {
        Some(0)
    };
    
    let is_offline_mode = matches!(license.status, LicenseStatus::OfflineGracePeriod);
    
    // Check for active trial
    let trial = service.get_trial_info().await.and_then(|t| {
        if t.is_active {
            Some(TrialInfoResponse {
                is_active: true,
                days_remaining: t.days_remaining,
                trial_end_date: t.get_end_date_string(),
                trial_tier: "elite".to_string(),
            })
        } else {
            None
        }
    });
    
    LicenseInfoResponse {
        has_license: true,
        tier: license.tier.to_string(),
        status: license.status.to_string(),
        user_email: Some(license.user_email),
        expires_at: Some(license.expires_at),
        days_remaining,
        device_id: service.get_device_id().await,
        is_offline_mode,
        trial,
    }
}

fn get_required_tier(feature: &str) -> String {
    match feature {
        // Free features
        "basic_automation" | "basic_forms" | "basic_browser" => "free",
        
        // Pro features
        "ai_assistant" | "vpn_basic" | "unlimited_workflows" | 
        "advanced_extraction" | "priority_support" => "pro",
        
        // Elite features
        "vpn_premium" | "collaboration" | "api_access" | 
        "custom_branding" | "enterprise_sso" | "audit_logs" |
        "video_conference" | "p2p_transfer" | "security_lab" => "elite",
        
        _ => "unknown",
    }.to_string()
}
