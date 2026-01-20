// ═══════════════════════════════════════════════════════════════════════════════
// PROXY POOL & ANTIBAN COMMANDS - Enterprise Proxy Management System
// ═══════════════════════════════════════════════════════════════════════════════
//
// This module implements the missing proxy and anti-ban commands:
// - Proxy Pool management (health, rotation, sessions)
// - Proxy Provider integration
// - Anti-ban configuration
// - Rate limit management
// - Ban reporting and recovery
//
// ═══════════════════════════════════════════════════════════════════════════════

#![allow(unused_variables)]

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::State;

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxyPoolConfig {
    pub id: String,
    pub name: String,
    pub proxies: Vec<PoolProxy>,
    pub rotation_strategy: RotationStrategy,
    pub health_check_interval_seconds: i32,
    pub max_failures_before_disable: i32,
    pub auto_ban_detection: bool,
    pub cooldown_seconds: i32,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PoolProxy {
    pub id: String,
    pub url: String,
    pub proxy_type: ProxyType,
    pub username: Option<String>,
    pub password: Option<String>,
    pub country: Option<String>,
    pub city: Option<String>,
    pub isp: Option<String>,
    pub is_residential: bool,
    pub enabled: bool,
    pub stats: ProxyStats,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ProxyType {
    Http,
    Https,
    Socks4,
    Socks5,
    Residential,
    Datacenter,
    Mobile,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RotationStrategy {
    RoundRobin,
    Random,
    LeastUsed,
    FastestFirst,
    LocationBased,
    Sticky,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxyStats {
    pub total_requests: i64,
    pub successful_requests: i64,
    pub failed_requests: i64,
    pub avg_response_time_ms: i64,
    pub last_used_at: Option<i64>,
    pub last_success_at: Option<i64>,
    pub last_failure_at: Option<i64>,
    pub last_failure_reason: Option<String>,
    pub ban_count: i32,
    pub is_banned: bool,
    pub banned_until: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxyHealthReport {
    pub pool_id: String,
    pub timestamp: i64,
    pub total_proxies: i32,
    pub healthy_proxies: i32,
    pub unhealthy_proxies: i32,
    pub banned_proxies: i32,
    pub average_response_time_ms: i64,
    pub success_rate: f64,
    pub proxies: Vec<ProxyHealthStatus>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxyHealthStatus {
    pub proxy_id: String,
    pub url: String,
    pub is_healthy: bool,
    pub response_time_ms: Option<i64>,
    pub error: Option<String>,
    pub checked_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxySession {
    pub id: String,
    pub proxy_id: String,
    pub pool_id: String,
    pub started_at: i64,
    pub ended_at: Option<i64>,
    pub requests_count: i32,
    pub bytes_transferred: i64,
    pub target_domain: Option<String>,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxyProvider {
    pub id: String,
    pub name: String,
    pub api_key: String,
    pub api_endpoint: String,
    pub provider_type: ProviderType,
    pub enabled: bool,
    pub auto_refresh: bool,
    pub refresh_interval_minutes: i32,
    pub last_refreshed_at: Option<i64>,
    pub proxy_count: i32,
    pub monthly_bandwidth_gb: Option<f64>,
    pub bandwidth_used_gb: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ProviderType {
    BrightData,
    Smartproxy,
    OxylabsResidential,
    OxylabsDatacenter,
    IPRoyal,
    ProxyEmpire,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AntiBanConfig {
    pub id: String,
    pub name: String,
    pub enabled: bool,
    pub request_delay_min_ms: i32,
    pub request_delay_max_ms: i32,
    pub respect_robots_txt: bool,
    pub max_requests_per_minute: i32,
    pub max_requests_per_domain: i32,
    pub retry_on_ban: bool,
    pub max_retries: i32,
    pub retry_delay_seconds: i32,
    pub user_agent_rotation: bool,
    pub fingerprint_rotation: bool,
    pub cookie_clearing_enabled: bool,
    pub ban_detection_patterns: Vec<BanDetectionPattern>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BanDetectionPattern {
    pub id: String,
    pub name: String,
    pub pattern_type: PatternType,
    pub pattern: String,
    pub action: BanAction,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PatternType {
    HttpStatus,
    ResponseBody,
    ResponseHeader,
    Captcha,
    RateLimit,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum BanAction {
    SwitchProxy,
    Cooldown,
    SolveCaptcha,
    Abort,
    Retry,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BanReport {
    pub id: String,
    pub proxy_id: String,
    pub domain: String,
    pub ban_type: String,
    pub detection_method: String,
    pub reported_at: i64,
    pub response_code: Option<i32>,
    pub response_snippet: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RateLimitStatus {
    pub domain: String,
    pub requests_in_window: i32,
    pub window_start: i64,
    pub max_requests: i32,
    pub next_allowed_request: i64,
    pub is_rate_limited: bool,
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════════════

pub struct ProxyPoolState {
    pub pools: Arc<Mutex<HashMap<String, ProxyPoolConfig>>>,
    pub providers: Arc<Mutex<HashMap<String, ProxyProvider>>>,
    pub sessions: Arc<Mutex<HashMap<String, ProxySession>>>,
    pub antiban_configs: Arc<Mutex<HashMap<String, AntiBanConfig>>>,
    pub ban_reports: Arc<Mutex<Vec<BanReport>>>,
    pub rate_limits: Arc<Mutex<HashMap<String, RateLimitStatus>>>,
}

impl ProxyPoolState {
    pub fn new() -> Self {
        Self {
            pools: Arc::new(Mutex::new(HashMap::new())),
            providers: Arc::new(Mutex::new(HashMap::new())),
            sessions: Arc::new(Mutex::new(HashMap::new())),
            antiban_configs: Arc::new(Mutex::new(HashMap::new())),
            ban_reports: Arc::new(Mutex::new(Vec::new())),
            rate_limits: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

impl Default for ProxyPoolState {
    fn default() -> Self {
        Self::new()
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROXY POOL COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

#[tauri::command]
pub async fn proxy_pool_create(
    state: State<'_, ProxyPoolState>,
    config: ProxyPoolConfig,
) -> Result<String, String> {
    let mut pools = state.pools.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    let id = config.id.clone();
    pools.insert(id.clone(), config);
    
    Ok(id)
}

#[tauri::command]
pub async fn proxy_pool_get(
    state: State<'_, ProxyPoolState>,
    pool_id: String,
) -> Result<ProxyPoolConfig, String> {
    let pools = state.pools.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    pools.get(&pool_id)
        .cloned()
        .ok_or_else(|| format!("Pool not found: {}", pool_id))
}

#[tauri::command]
pub async fn proxy_pool_list(
    state: State<'_, ProxyPoolState>,
) -> Result<Vec<ProxyPoolConfig>, String> {
    let pools = state.pools.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    Ok(pools.values().cloned().collect())
}

#[tauri::command]
pub async fn proxy_pool_update(
    state: State<'_, ProxyPoolState>,
    pool_id: String,
    config: ProxyPoolConfig,
) -> Result<ProxyPoolConfig, String> {
    let mut pools = state.pools.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    pools.insert(pool_id.clone(), config.clone());
    
    Ok(config)
}

#[tauri::command]
pub async fn proxy_pool_delete(
    state: State<'_, ProxyPoolState>,
    pool_id: String,
) -> Result<(), String> {
    let mut pools = state.pools.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    pools.remove(&pool_id)
        .ok_or_else(|| format!("Pool not found: {}", pool_id))?;
    
    Ok(())
}

#[tauri::command]
pub async fn proxy_check_pool_health(
    state: State<'_, ProxyPoolState>,
    pool_id: String,
) -> Result<ProxyHealthReport, String> {
    let pools = state.pools.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    let pool = pools.get(&pool_id)
        .ok_or_else(|| format!("Pool not found: {}", pool_id))?;
    
    let now = chrono::Utc::now().timestamp();
    let mut health_statuses = Vec::new();
    let mut healthy_count = 0;
    let mut banned_count = 0;
    let mut total_response_time: i64 = 0;
    let mut total_success: i64 = 0;
    let mut total_requests: i64 = 0;
    
    for proxy in &pool.proxies {
        let is_healthy = proxy.enabled && !proxy.stats.is_banned;
        if is_healthy {
            healthy_count += 1;
        }
        if proxy.stats.is_banned {
            banned_count += 1;
        }
        total_response_time += proxy.stats.avg_response_time_ms;
        total_success += proxy.stats.successful_requests;
        total_requests += proxy.stats.total_requests;
        
        health_statuses.push(ProxyHealthStatus {
            proxy_id: proxy.id.clone(),
            url: proxy.url.clone(),
            is_healthy,
            response_time_ms: Some(proxy.stats.avg_response_time_ms),
            error: proxy.stats.last_failure_reason.clone(),
            checked_at: now,
        });
    }
    
    let proxy_count = pool.proxies.len() as i32;
    
    Ok(ProxyHealthReport {
        pool_id,
        timestamp: now,
        total_proxies: proxy_count,
        healthy_proxies: healthy_count,
        unhealthy_proxies: proxy_count - healthy_count,
        banned_proxies: banned_count,
        average_response_time_ms: if proxy_count > 0 { total_response_time / proxy_count as i64 } else { 0 },
        success_rate: if total_requests > 0 { (total_success as f64 / total_requests as f64) * 100.0 } else { 0.0 },
        proxies: health_statuses,
    })
}

#[tauri::command]
pub async fn proxy_add_multiple(
    state: State<'_, ProxyPoolState>,
    pool_id: String,
    proxies: Vec<PoolProxy>,
) -> Result<i32, String> {
    let mut pools = state.pools.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    let pool = pools.get_mut(&pool_id)
        .ok_or_else(|| format!("Pool not found: {}", pool_id))?;
    
    let count = proxies.len() as i32;
    pool.proxies.extend(proxies);
    pool.updated_at = chrono::Utc::now().timestamp();
    
    Ok(count)
}

#[tauri::command]
pub async fn proxy_delete_multiple(
    state: State<'_, ProxyPoolState>,
    pool_id: String,
    proxy_ids: Vec<String>,
) -> Result<i32, String> {
    let mut pools = state.pools.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    let pool = pools.get_mut(&pool_id)
        .ok_or_else(|| format!("Pool not found: {}", pool_id))?;
    
    let before_count = pool.proxies.len();
    pool.proxies.retain(|p| !proxy_ids.contains(&p.id));
    pool.updated_at = chrono::Utc::now().timestamp();
    
    Ok((before_count - pool.proxies.len()) as i32)
}

#[tauri::command]
pub async fn proxy_import_from_text(
    state: State<'_, ProxyPoolState>,
    pool_id: String,
    text: String,
    proxy_type: ProxyType,
) -> Result<i32, String> {
    let mut pools = state.pools.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    let pool = pools.get_mut(&pool_id)
        .ok_or_else(|| format!("Pool not found: {}", pool_id))?;
    
    let mut imported = 0;
    for line in text.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        
        // Parse formats: url, url:port, user:pass@url:port
        let proxy = parse_proxy_line(line, &proxy_type)?;
        pool.proxies.push(proxy);
        imported += 1;
    }
    
    pool.updated_at = chrono::Utc::now().timestamp();
    
    Ok(imported)
}

#[tauri::command]
pub async fn proxy_reset_stats(
    state: State<'_, ProxyPoolState>,
    pool_id: String,
    proxy_id: Option<String>,
) -> Result<(), String> {
    let mut pools = state.pools.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    let pool = pools.get_mut(&pool_id)
        .ok_or_else(|| format!("Pool not found: {}", pool_id))?;
    
    for proxy in &mut pool.proxies {
        if proxy_id.as_ref().map(|id| id == &proxy.id).unwrap_or(true) {
            proxy.stats = ProxyStats {
                total_requests: 0,
                successful_requests: 0,
                failed_requests: 0,
                avg_response_time_ms: 0,
                last_used_at: None,
                last_success_at: None,
                last_failure_at: None,
                last_failure_reason: None,
                ban_count: 0,
                is_banned: false,
                banned_until: None,
            };
        }
    }
    
    Ok(())
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROXY SESSION COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

#[tauri::command]
pub async fn proxy_session_start(
    state: State<'_, ProxyPoolState>,
    pool_id: String,
    target_domain: Option<String>,
) -> Result<ProxySession, String> {
    let pools = state.pools.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    let pool = pools.get(&pool_id)
        .ok_or_else(|| format!("Pool not found: {}", pool_id))?;
    
    // Get next available proxy based on rotation strategy
    let proxy = pool.proxies.iter()
        .filter(|p| p.enabled && !p.stats.is_banned)
        .next()
        .ok_or("No available proxies in pool")?;
    
    let session = ProxySession {
        id: format!("session_{}", chrono::Utc::now().timestamp_millis()),
        proxy_id: proxy.id.clone(),
        pool_id: pool_id.clone(),
        started_at: chrono::Utc::now().timestamp(),
        ended_at: None,
        requests_count: 0,
        bytes_transferred: 0,
        target_domain,
        is_active: true,
    };
    
    let mut sessions = state.sessions.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    sessions.insert(session.id.clone(), session.clone());
    
    Ok(session)
}

#[tauri::command]
pub async fn proxy_session_end(
    state: State<'_, ProxyPoolState>,
    session_id: String,
) -> Result<ProxySession, String> {
    let mut sessions = state.sessions.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    let session = sessions.get_mut(&session_id)
        .ok_or_else(|| format!("Session not found: {}", session_id))?;
    
    session.ended_at = Some(chrono::Utc::now().timestamp());
    session.is_active = false;
    
    Ok(session.clone())
}

#[tauri::command]
pub async fn proxy_session_end_all(
    state: State<'_, ProxyPoolState>,
) -> Result<i32, String> {
    let mut sessions = state.sessions.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    let now = chrono::Utc::now().timestamp();
    let mut count = 0;
    
    for session in sessions.values_mut() {
        if session.is_active {
            session.ended_at = Some(now);
            session.is_active = false;
            count += 1;
        }
    }
    
    Ok(count)
}

#[tauri::command]
pub async fn proxy_session_list(
    state: State<'_, ProxyPoolState>,
    active_only: Option<bool>,
) -> Result<Vec<ProxySession>, String> {
    let sessions = state.sessions.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    let active = active_only.unwrap_or(false);
    
    Ok(sessions.values()
        .filter(|s| !active || s.is_active)
        .cloned()
        .collect())
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROXY PROVIDER COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

#[tauri::command]
pub async fn proxy_provider_add(
    state: State<'_, ProxyPoolState>,
    provider: ProxyProvider,
) -> Result<String, String> {
    let mut providers = state.providers.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    let id = provider.id.clone();
    providers.insert(id.clone(), provider);
    
    Ok(id)
}

#[tauri::command]
pub async fn proxy_provider_get(
    state: State<'_, ProxyPoolState>,
    provider_id: String,
) -> Result<ProxyProvider, String> {
    let providers = state.providers.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    providers.get(&provider_id)
        .cloned()
        .ok_or_else(|| format!("Provider not found: {}", provider_id))
}

#[tauri::command]
pub async fn proxy_provider_list(
    state: State<'_, ProxyPoolState>,
) -> Result<Vec<ProxyProvider>, String> {
    let providers = state.providers.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    Ok(providers.values().cloned().collect())
}

#[tauri::command]
pub async fn proxy_provider_update(
    state: State<'_, ProxyPoolState>,
    provider_id: String,
    provider: ProxyProvider,
) -> Result<ProxyProvider, String> {
    let mut providers = state.providers.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    providers.insert(provider_id, provider.clone());
    
    Ok(provider)
}

#[tauri::command]
pub async fn proxy_provider_delete(
    state: State<'_, ProxyPoolState>,
    provider_id: String,
) -> Result<(), String> {
    let mut providers = state.providers.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    providers.remove(&provider_id)
        .ok_or_else(|| format!("Provider not found: {}", provider_id))?;
    
    Ok(())
}

#[tauri::command]
pub async fn proxy_provider_refresh(
    state: State<'_, ProxyPoolState>,
    provider_id: String,
) -> Result<Vec<PoolProxy>, String> {
    let mut providers = state.providers.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    let provider = providers.get_mut(&provider_id)
        .ok_or_else(|| format!("Provider not found: {}", provider_id))?;
    
    provider.last_refreshed_at = Some(chrono::Utc::now().timestamp());
    
    // In production, this would fetch from the provider API
    // For now, return mock data
    Ok(vec![
        PoolProxy {
            id: format!("proxy_{}", chrono::Utc::now().timestamp_millis()),
            url: "http://proxy.example.com:8080".to_string(),
            proxy_type: ProxyType::Http,
            username: None,
            password: None,
            country: Some("US".to_string()),
            city: Some("New York".to_string()),
            isp: Some("Example ISP".to_string()),
            is_residential: false,
            enabled: true,
            stats: ProxyStats {
                total_requests: 0,
                successful_requests: 0,
                failed_requests: 0,
                avg_response_time_ms: 0,
                last_used_at: None,
                last_success_at: None,
                last_failure_at: None,
                last_failure_reason: None,
                ban_count: 0,
                is_banned: false,
                banned_until: None,
            },
        },
    ])
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANTI-BAN COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

#[tauri::command]
pub async fn antiban_create_config(
    state: State<'_, ProxyPoolState>,
    config: AntiBanConfig,
) -> Result<String, String> {
    let mut configs = state.antiban_configs.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    let id = config.id.clone();
    configs.insert(id.clone(), config);
    
    Ok(id)
}

#[tauri::command]
pub async fn antiban_get_config(
    state: State<'_, ProxyPoolState>,
    config_id: String,
) -> Result<AntiBanConfig, String> {
    let configs = state.antiban_configs.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    configs.get(&config_id)
        .cloned()
        .ok_or_else(|| format!("Config not found: {}", config_id))
}

#[tauri::command]
pub async fn antiban_list_configs(
    state: State<'_, ProxyPoolState>,
) -> Result<Vec<AntiBanConfig>, String> {
    let configs = state.antiban_configs.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    Ok(configs.values().cloned().collect())
}

#[tauri::command]
pub async fn antiban_apply_config(
    state: State<'_, ProxyPoolState>,
    config_id: String,
    pool_id: String,
) -> Result<(), String> {
    let configs = state.antiban_configs.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    let _config = configs.get(&config_id)
        .ok_or_else(|| format!("Config not found: {}", config_id))?;
    
    let pools = state.pools.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    let _pool = pools.get(&pool_id)
        .ok_or_else(|| format!("Pool not found: {}", pool_id))?;
    
    // In production, this would apply the anti-ban config to the pool
    Ok(())
}

#[tauri::command]
pub async fn antiban_delete_config(
    state: State<'_, ProxyPoolState>,
    config_id: String,
) -> Result<(), String> {
    let mut configs = state.antiban_configs.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    configs.remove(&config_id)
        .ok_or_else(|| format!("Config not found: {}", config_id))?;
    
    Ok(())
}

#[tauri::command]
pub async fn antiban_report_ban(
    state: State<'_, ProxyPoolState>,
    report: BanReport,
) -> Result<String, String> {
    let mut reports = state.ban_reports.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    let id = report.id.clone();
    reports.push(report);
    
    // Update proxy ban status
    let mut pools = state.pools.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    for pool in pools.values_mut() {
        for proxy in &mut pool.proxies {
            if proxy.id == id {
                proxy.stats.is_banned = true;
                proxy.stats.ban_count += 1;
                proxy.stats.banned_until = Some(chrono::Utc::now().timestamp() + 3600); // 1 hour cooldown
                break;
            }
        }
    }
    
    Ok(id)
}

#[tauri::command]
pub async fn antiban_get_rate_limit_status(
    state: State<'_, ProxyPoolState>,
    domain: String,
) -> Result<RateLimitStatus, String> {
    let rate_limits = state.rate_limits.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    let now = chrono::Utc::now().timestamp();
    
    rate_limits.get(&domain)
        .cloned()
        .ok_or_else(|| {
            // Return default if not found
            format!("No rate limit data for domain: {}", domain)
        })
}

#[tauri::command]
pub async fn proxy_clear_ban(
    state: State<'_, ProxyPoolState>,
    pool_id: String,
    proxy_id: String,
) -> Result<(), String> {
    let mut pools = state.pools.lock()
        .map_err(|e| format!("Failed to acquire lock: {}", e))?;
    
    let pool = pools.get_mut(&pool_id)
        .ok_or_else(|| format!("Pool not found: {}", pool_id))?;
    
    for proxy in &mut pool.proxies {
        if proxy.id == proxy_id {
            proxy.stats.is_banned = false;
            proxy.stats.banned_until = None;
            return Ok(());
        }
    }
    
    Err(format!("Proxy not found: {}", proxy_id))
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

fn parse_proxy_line(line: &str, proxy_type: &ProxyType) -> Result<PoolProxy, String> {
    let id = format!("proxy_{}", chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0));
    
    // Parse format: [user:pass@]host:port
    let (credentials, host_port) = if line.contains('@') {
        let parts: Vec<&str> = line.splitn(2, '@').collect();
        (Some(parts[0]), parts[1])
    } else {
        (None, line)
    };
    
    let (username, password) = if let Some(creds) = credentials {
        let parts: Vec<&str> = creds.splitn(2, ':').collect();
        if parts.len() == 2 {
            (Some(parts[0].to_string()), Some(parts[1].to_string()))
        } else {
            (Some(parts[0].to_string()), None)
        }
    } else {
        (None, None)
    };
    
    let url = format!("http://{}", host_port);
    
    Ok(PoolProxy {
        id,
        url,
        proxy_type: proxy_type.clone(),
        username,
        password,
        country: None,
        city: None,
        isp: None,
        is_residential: false,
        enabled: true,
        stats: ProxyStats {
            total_requests: 0,
            successful_requests: 0,
            failed_requests: 0,
            avg_response_time_ms: 0,
            last_used_at: None,
            last_success_at: None,
            last_failure_at: None,
            last_failure_reason: None,
            ban_count: 0,
            is_banned: false,
            banned_until: None,
        },
    })
}
