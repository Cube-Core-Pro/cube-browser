/**
 * Anti-Detection Commands Module
 * 
 * Provides Tauri commands for all anti-detection features:
 * - Stealth (fingerprinting, user agents)
 * - Proxy (rotation, health checks)
 * - CAPTCHA (solving via 2Captcha)
 * - Rate limiting (delays, robots.txt)
 */

use crate::services::{
    stealth::{StealthService, StealthConfig, BrowserFingerprint},
    proxy::{ProxyService, ProxyConfig, ProxyType, RotationStrategy},
    captcha::{
        CaptchaService, CaptchaConfig, 
        RecaptchaV2Request, RecaptchaV3Request,
        HCaptchaRequest, ImageCaptchaRequest, CaptchaSolution
    },
    rate_limiter::{RateLimiterService, RateLimitConfig},
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;

pub struct StealthState {
    pub stealth: Arc<StealthService>,
    pub proxy: Arc<ProxyService>,
    pub captcha: Arc<CaptchaService>,
    pub rate_limiter: Arc<RateLimiterService>,
}

// ============================================================================
// STEALTH COMMANDS
// ============================================================================

#[tauri::command]
pub async fn stealth_set_config(
    state: State<'_, StealthState>,
    config: StealthConfig,
) -> Result<(), String> {
    state.stealth.set_config(config)
}

#[tauri::command]
pub async fn stealth_get_config(
    state: State<'_, StealthState>,
) -> Result<StealthConfig, String> {
    state.stealth.get_config()
}

#[tauri::command]
pub async fn stealth_generate_fingerprint(
    state: State<'_, StealthState>,
) -> Result<BrowserFingerprint, String> {
    state.stealth.generate_fingerprint()
}

#[tauri::command]
pub async fn stealth_get_fingerprint(
    state: State<'_, StealthState>,
) -> Result<Option<BrowserFingerprint>, String> {
    state.stealth.get_current_fingerprint()
}

#[tauri::command]
pub async fn stealth_get_script(
    state: State<'_, StealthState>,
) -> Result<String, String> {
    state.stealth.generate_stealth_script()
}

#[tauri::command]
pub async fn stealth_get_user_agent(
    state: State<'_, StealthState>,
) -> Result<String, String> {
    Ok(state.stealth.get_random_user_agent())
}

// ============================================================================
// PROXY COMMANDS
// ============================================================================

#[tauri::command]
pub async fn proxy_add(
    state: State<'_, StealthState>,
    config: ProxyConfig,
) -> Result<(), String> {
    state.proxy.add_proxy(config)
}

#[tauri::command]
pub async fn proxy_remove(
    state: State<'_, StealthState>,
    url: String,
) -> Result<(), String> {
    state.proxy.remove_proxy(url)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxyInfo {
    pub url: String,
    pub proxy_type: String,
    pub username: Option<String>,
    pub enabled: bool,
    pub total_requests: u64,
    pub failed_requests: u64,
    pub avg_response_time_ms: u64,
    pub last_used: Option<String>,
    pub last_success: Option<String>,
    pub last_failure: Option<String>,
    pub is_healthy: bool,
}

#[tauri::command]
pub async fn proxy_list(
    state: State<'_, StealthState>,
) -> Result<Vec<ProxyInfo>, String> {
    let proxies = state.proxy.list_proxies()?;
    
    Ok(proxies.into_iter().map(|(config, stats)| {
        ProxyInfo {
            url: config.url.clone(),
            proxy_type: match config.proxy_type {
                ProxyType::Http => "http".to_string(),
                ProxyType::Https => "https".to_string(),
                ProxyType::Socks5 => "socks5".to_string(),
            },
            username: config.username.clone(),
            enabled: config.enabled,
            total_requests: stats.total_requests,
            failed_requests: stats.failed_requests,
            avg_response_time_ms: stats.avg_response_time_ms,
            last_used: stats.last_used,
            last_success: stats.last_success,
            last_failure: stats.last_failure,
            is_healthy: stats.is_healthy,
        }
    }).collect())
}

#[tauri::command]
pub async fn proxy_set_strategy(
    state: State<'_, StealthState>,
    strategy: String,
) -> Result<(), String> {
    let strat = match strategy.to_lowercase().as_str() {
        "roundrobin" => RotationStrategy::RoundRobin,
        "random" => RotationStrategy::Random,
        "leastused" => RotationStrategy::LeastUsed,
        "fastestfirst" => RotationStrategy::FastestFirst,
        _ => return Err(format!("Invalid strategy: {}", strategy)),
    };
    
    state.proxy.set_strategy(strat)
}

#[tauri::command]
pub async fn proxy_get_next(
    state: State<'_, StealthState>,
) -> Result<ProxyConfig, String> {
    state.proxy.get_next_proxy()
}

#[tauri::command]
pub async fn proxy_check_health(
    state: State<'_, StealthState>,
    url: String,
) -> Result<(), String> {
    state.proxy.check_proxy_health(url).await?;
    Ok(())
}

#[tauri::command]
pub async fn proxy_toggle(
    state: State<'_, StealthState>,
    url: String,
    enabled: bool,
) -> Result<(), String> {
    state.proxy.toggle_proxy(url, enabled)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxyStats {
    pub total_requests: u64,
    pub failed_requests: u64,
    pub avg_response_time_ms: u64,
    pub last_used: Option<String>,
    pub last_success: Option<String>,
    pub last_failure: Option<String>,
    pub is_healthy: bool,
}

#[tauri::command]
pub async fn proxy_get_stats(
    state: State<'_, StealthState>,
    url: String,
) -> Result<ProxyStats, String> {
    let stats = state.proxy.get_proxy_stats(url)?;
    
    Ok(ProxyStats {
        total_requests: stats.total_requests,
        failed_requests: stats.failed_requests,
        avg_response_time_ms: stats.avg_response_time_ms,
        last_used: stats.last_used,
        last_success: stats.last_success,
        last_failure: stats.last_failure,
        is_healthy: stats.is_healthy,
    })
}

#[tauri::command]
pub async fn proxy_clear(
    state: State<'_, StealthState>,
) -> Result<(), String> {
    state.proxy.clear_all()
}

// ============================================================================
// CAPTCHA COMMANDS
// ============================================================================

#[tauri::command]
pub async fn captcha_configure(
    state: State<'_, StealthState>,
    config: CaptchaConfig,
) -> Result<(), String> {
    state.captcha.set_config(config);
    Ok(())
}

#[tauri::command]
pub async fn captcha_solve_recaptcha_v2(
    state: State<'_, StealthState>,
    request: RecaptchaV2Request,
) -> Result<CaptchaSolution, String> {
    state.captcha.solve_recaptcha_v2(request).await
}

#[tauri::command]
pub async fn captcha_solve_recaptcha_v3(
    state: State<'_, StealthState>,
    request: RecaptchaV3Request,
) -> Result<CaptchaSolution, String> {
    state.captcha.solve_recaptcha_v3(request).await
}

#[tauri::command]
pub async fn captcha_solve_hcaptcha(
    state: State<'_, StealthState>,
    request: HCaptchaRequest,
) -> Result<CaptchaSolution, String> {
    state.captcha.solve_hcaptcha(request).await
}

#[tauri::command]
pub async fn captcha_solve_image(
    state: State<'_, StealthState>,
    request: ImageCaptchaRequest,
) -> Result<CaptchaSolution, String> {
    state.captcha.solve_image_captcha(request).await
}

#[tauri::command]
pub async fn captcha_get_balance(
    state: State<'_, StealthState>,
) -> Result<f64, String> {
    state.captcha.get_balance().await
}

// ============================================================================
// RATE LIMITER COMMANDS
// ============================================================================

#[tauri::command]
pub async fn rate_limiter_set_config(
    state: State<'_, StealthState>,
    config: RateLimitConfig,
) -> Result<(), String> {
    state.rate_limiter.set_config(config)
}

#[tauri::command]
pub async fn rate_limiter_get_config(
    state: State<'_, StealthState>,
) -> Result<RateLimitConfig, String> {
    state.rate_limiter.get_config()
}

#[tauri::command]
pub async fn rate_limiter_wait(
    state: State<'_, StealthState>,
    url: String,
) -> Result<(), String> {
    state.rate_limiter.wait_before_request(&url).await
}

#[tauri::command]
pub async fn rate_limiter_complete(
    state: State<'_, StealthState>,
    url: String,
    status_code: u16,
) -> Result<(), String> {
    state.rate_limiter.request_completed(&url, status_code)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DomainStats {
    pub active_connections: usize,
    pub total_requests: usize,
    pub crawl_delay_ms: Option<u64>,
}

#[tauri::command]
pub async fn rate_limiter_get_stats(
    state: State<'_, StealthState>,
    domain: String,
) -> Result<Option<DomainStats>, String> {
    let stats_opt = state.rate_limiter.get_domain_stats(domain)?;
    
    Ok(stats_opt.map(|(active, total, delay)| DomainStats {
        active_connections: active,
        total_requests: total,
        crawl_delay_ms: delay,
    }))
}

#[tauri::command]
pub async fn rate_limiter_clear_stats(
    state: State<'_, StealthState>,
) -> Result<(), String> {
    state.rate_limiter.clear_stats()
}
