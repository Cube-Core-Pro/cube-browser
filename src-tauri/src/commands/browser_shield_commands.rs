// CUBE Shield - Tauri Commands
// Exposes the CUBE Shield ad/tracker blocker to the frontend

use crate::services::browser_shield::{
    CUBE_SHIELD, ShieldConfig, ShieldStats, ShieldLevel, 
    CookieBlockingLevel, CustomRule, RequestInfo, ResourceType, BlockResult,
    get_cosmetic_filter_css
};

// ============================================
// Configuration Commands
// ============================================

/// Get current shield configuration
#[tauri::command]
pub async fn shield_get_config() -> Result<ShieldConfig, String> {
    Ok(CUBE_SHIELD.get_config())
}

/// Set shield configuration
#[tauri::command]
pub async fn shield_set_config(config: ShieldConfig) -> Result<(), String> {
    CUBE_SHIELD.set_config(config);
    Ok(())
}

/// Enable/disable shield
#[tauri::command]
pub async fn shield_set_enabled(enabled: bool) -> Result<(), String> {
    let mut config = CUBE_SHIELD.get_config();
    config.enabled = enabled;
    CUBE_SHIELD.set_config(config);
    Ok(())
}

/// Set shield level
#[tauri::command]
pub async fn shield_set_level(level: String) -> Result<(), String> {
    let shield_level = match level.to_lowercase().as_str() {
        "off" => ShieldLevel::Off,
        "standard" => ShieldLevel::Standard,
        "strict" => ShieldLevel::Strict,
        "aggressive" => ShieldLevel::Aggressive,
        "custom" => ShieldLevel::Custom,
        _ => return Err(format!("Invalid shield level: {}", level)),
    };
    
    let mut config = CUBE_SHIELD.get_config();
    config.level = shield_level;
    CUBE_SHIELD.set_config(config);
    Ok(())
}

/// Toggle individual protection features
#[tauri::command]
pub async fn shield_toggle_feature(feature: String, enabled: bool) -> Result<(), String> {
    let mut config = CUBE_SHIELD.get_config();
    
    match feature.to_lowercase().as_str() {
        "ad_blocking" => config.ad_blocking = enabled,
        "tracker_blocking" => config.tracker_blocking = enabled,
        "fingerprint_protection" => config.fingerprint_protection = enabled,
        "script_blocking" => config.script_blocking = enabled,
        "social_blocking" => config.social_blocking = enabled,
        "crypto_mining_blocking" => config.crypto_mining_blocking = enabled,
        "malware_blocking" => config.malware_blocking = enabled,
        "https_upgrade" => config.https_upgrade = enabled,
        "webrtc_protection" => config.webrtc_protection = enabled,
        "canvas_protection" => config.canvas_protection = enabled,
        "font_protection" => config.font_protection = enabled,
        "battery_api_blocking" => config.battery_api_blocking = enabled,
        "hardware_concurrency_spoof" => config.hardware_concurrency_spoof = enabled,
        _ => return Err(format!("Unknown feature: {}", feature)),
    }
    
    CUBE_SHIELD.set_config(config);
    Ok(())
}

/// Set cookie blocking level
#[tauri::command]
pub async fn shield_set_cookie_blocking(level: String) -> Result<(), String> {
    let cookie_level = match level.to_lowercase().as_str() {
        "allow_all" | "allowall" => CookieBlockingLevel::AllowAll,
        "block_third_party" | "blockthirdparty" => CookieBlockingLevel::BlockThirdParty,
        "block_all_except_whitelist" | "blockallexceptwhitelist" => CookieBlockingLevel::BlockAllExceptWhitelist,
        "block_all" | "blockall" => CookieBlockingLevel::BlockAll,
        _ => return Err(format!("Invalid cookie blocking level: {}", level)),
    };
    
    let mut config = CUBE_SHIELD.get_config();
    config.cookie_blocking = cookie_level;
    CUBE_SHIELD.set_config(config);
    Ok(())
}

// ============================================
// Site-Specific Configuration Commands
// ============================================

/// Set site-specific shield configuration
#[tauri::command]
pub async fn shield_set_site_config(domain: String, config: ShieldConfig) -> Result<(), String> {
    CUBE_SHIELD.set_site_config(&domain, config);
    Ok(())
}

/// Get site-specific shield configuration
#[tauri::command]
pub async fn shield_get_site_config(domain: String) -> Result<ShieldConfig, String> {
    Ok(CUBE_SHIELD.get_site_config(&domain))
}

// ============================================
// Whitelist/Blacklist Commands
// ============================================

/// Add domain to whitelist
#[tauri::command]
pub async fn shield_whitelist_add(domain: String) -> Result<(), String> {
    CUBE_SHIELD.whitelist_domain(&domain);
    println!("✅ [SHIELD] Whitelisted domain: {}", domain);
    Ok(())
}

/// Remove domain from whitelist
#[tauri::command]
pub async fn shield_whitelist_remove(domain: String) -> Result<(), String> {
    CUBE_SHIELD.remove_from_whitelist(&domain);
    println!("❌ [SHIELD] Removed from whitelist: {}", domain);
    Ok(())
}

/// Get whitelist
#[tauri::command]
pub async fn shield_whitelist_get() -> Result<Vec<String>, String> {
    let config = CUBE_SHIELD.get_config();
    Ok(config.whitelist.into_iter().collect())
}

/// Add domain to blacklist
#[tauri::command]
pub async fn shield_blacklist_add(domain: String) -> Result<(), String> {
    CUBE_SHIELD.blacklist_domain(&domain);
    println!("🚫 [SHIELD] Blacklisted domain: {}", domain);
    Ok(())
}

/// Get blacklist
#[tauri::command]
pub async fn shield_blacklist_get() -> Result<Vec<String>, String> {
    let config = CUBE_SHIELD.get_config();
    Ok(config.blacklist.into_iter().collect())
}

// ============================================
// Custom Rules Commands
// ============================================

/// Add custom blocking rule
#[tauri::command]
pub async fn shield_add_custom_rule(rule: CustomRule) -> Result<(), String> {
    let mut config = CUBE_SHIELD.get_config();
    config.custom_rules.push(rule.clone());
    CUBE_SHIELD.set_config(config);
    println!("➕ [SHIELD] Added custom rule: {}", rule.name);
    Ok(())
}

/// Remove custom rule by ID
#[tauri::command]
pub async fn shield_remove_custom_rule(rule_id: String) -> Result<(), String> {
    let mut config = CUBE_SHIELD.get_config();
    config.custom_rules.retain(|r| r.id != rule_id);
    CUBE_SHIELD.set_config(config);
    println!("➖ [SHIELD] Removed custom rule: {}", rule_id);
    Ok(())
}

/// Get all custom rules
#[tauri::command]
pub async fn shield_get_custom_rules() -> Result<Vec<CustomRule>, String> {
    let config = CUBE_SHIELD.get_config();
    Ok(config.custom_rules)
}

/// Toggle custom rule enabled state
#[tauri::command]
pub async fn shield_toggle_custom_rule(rule_id: String, enabled: bool) -> Result<(), String> {
    let mut config = CUBE_SHIELD.get_config();
    
    if let Some(rule) = config.custom_rules.iter_mut().find(|r| r.id == rule_id) {
        rule.enabled = enabled;
        CUBE_SHIELD.set_config(config);
        Ok(())
    } else {
        Err(format!("Rule not found: {}", rule_id))
    }
}

// ============================================
// Statistics Commands
// ============================================

/// Get shield statistics
#[tauri::command]
pub async fn shield_get_stats() -> Result<ShieldStats, String> {
    Ok(CUBE_SHIELD.get_stats())
}

/// Reset shield statistics
#[tauri::command]
pub async fn shield_reset_stats() -> Result<(), String> {
    CUBE_SHIELD.reset_stats();
    println!("🔄 [SHIELD] Statistics reset");
    Ok(())
}

// ============================================
// Blocking Check Commands
// ============================================

/// Check if a request should be blocked
#[tauri::command]
pub async fn shield_should_block(
    url: String,
    method: String,
    resource_type: String,
    initiator: Option<String>,
    is_third_party: bool,
    page_domain: String,
) -> Result<BlockResult, String> {
    let res_type = match resource_type.to_lowercase().as_str() {
        "document" => ResourceType::Document,
        "stylesheet" | "css" => ResourceType::Stylesheet,
        "image" | "img" => ResourceType::Image,
        "media" | "video" | "audio" => ResourceType::Media,
        "font" => ResourceType::Font,
        "script" | "js" => ResourceType::Script,
        "xhr" | "xmlhttprequest" => ResourceType::XHR,
        "fetch" => ResourceType::Fetch,
        "websocket" | "ws" => ResourceType::WebSocket,
        _ => ResourceType::Other,
    };
    
    let request = RequestInfo {
        url,
        method,
        resource_type: res_type,
        initiator,
        headers: std::collections::HashMap::new(),
        referrer: None,
        is_third_party,
    };
    
    Ok(CUBE_SHIELD.should_block(&request, &page_domain))
}

/// Check if a cookie should be blocked
#[tauri::command]
pub async fn shield_should_block_cookie(
    cookie_domain: String,
    page_domain: String,
) -> Result<bool, String> {
    Ok(CUBE_SHIELD.should_block_cookie(&cookie_domain, &page_domain))
}

// ============================================
// Protection Script Commands
// ============================================

/// Get fingerprint protection JavaScript
#[tauri::command]
pub async fn shield_get_fingerprint_script() -> Result<String, String> {
    Ok(CUBE_SHIELD.get_fingerprint_protection_script())
}

/// Get CSS for hiding ad elements
#[tauri::command]
pub async fn shield_get_cosmetic_css() -> Result<String, String> {
    Ok(get_cosmetic_filter_css())
}

/// Upgrade HTTP to HTTPS
#[tauri::command]
pub async fn shield_upgrade_https(url: String) -> Result<String, String> {
    Ok(CUBE_SHIELD.upgrade_to_https(&url))
}

// ============================================
// Preset Configurations
// ============================================

/// Apply preset configuration
#[tauri::command]
pub async fn shield_apply_preset(preset: String) -> Result<ShieldConfig, String> {
    let config = match preset.to_lowercase().as_str() {
        "privacy_focused" => ShieldConfig {
            enabled: true,
            level: ShieldLevel::Strict,
            ad_blocking: true,
            tracker_blocking: true,
            fingerprint_protection: true,
            cookie_blocking: CookieBlockingLevel::BlockThirdParty,
            script_blocking: false,
            social_blocking: true,
            crypto_mining_blocking: true,
            malware_blocking: true,
            https_upgrade: true,
            webrtc_protection: true,
            canvas_protection: true,
            font_protection: true,
            battery_api_blocking: true,
            hardware_concurrency_spoof: true,
            ..Default::default()
        },
        "balanced" => ShieldConfig {
            enabled: true,
            level: ShieldLevel::Standard,
            ad_blocking: true,
            tracker_blocking: true,
            fingerprint_protection: true,
            cookie_blocking: CookieBlockingLevel::BlockThirdParty,
            script_blocking: false,
            social_blocking: false,
            crypto_mining_blocking: true,
            malware_blocking: true,
            https_upgrade: true,
            webrtc_protection: false,
            canvas_protection: false,
            font_protection: false,
            battery_api_blocking: false,
            hardware_concurrency_spoof: false,
            ..Default::default()
        },
        "performance" => ShieldConfig {
            enabled: true,
            level: ShieldLevel::Standard,
            ad_blocking: true,
            tracker_blocking: false,
            fingerprint_protection: false,
            cookie_blocking: CookieBlockingLevel::AllowAll,
            script_blocking: false,
            social_blocking: false,
            crypto_mining_blocking: true,
            malware_blocking: true,
            https_upgrade: true,
            webrtc_protection: false,
            canvas_protection: false,
            font_protection: false,
            battery_api_blocking: false,
            hardware_concurrency_spoof: false,
            ..Default::default()
        },
        "maximum_protection" => ShieldConfig {
            enabled: true,
            level: ShieldLevel::Aggressive,
            ad_blocking: true,
            tracker_blocking: true,
            fingerprint_protection: true,
            cookie_blocking: CookieBlockingLevel::BlockAllExceptWhitelist,
            script_blocking: true,
            social_blocking: true,
            crypto_mining_blocking: true,
            malware_blocking: true,
            https_upgrade: true,
            webrtc_protection: true,
            canvas_protection: true,
            font_protection: true,
            battery_api_blocking: true,
            hardware_concurrency_spoof: true,
            ..Default::default()
        },
        "disabled" => ShieldConfig {
            enabled: false,
            ..Default::default()
        },
        _ => return Err(format!("Unknown preset: {}. Available: privacy_focused, balanced, performance, maximum_protection, disabled", preset)),
    };
    
    CUBE_SHIELD.set_config(config.clone());
    println!("🛡️ [SHIELD] Applied preset: {}", preset);
    Ok(config)
}

// ============================================
// Import/Export Commands
// ============================================

/// Export shield configuration as JSON
#[tauri::command]
pub async fn shield_export_config() -> Result<String, String> {
    let config = CUBE_SHIELD.get_config();
    serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))
}

/// Import shield configuration from JSON
#[tauri::command]
pub async fn shield_import_config(json: String) -> Result<(), String> {
    let config: ShieldConfig = serde_json::from_str(&json)
        .map_err(|e| format!("Failed to parse config: {}", e))?;
    
    CUBE_SHIELD.set_config(config);
    println!("📥 [SHIELD] Imported configuration");
    Ok(())
}
