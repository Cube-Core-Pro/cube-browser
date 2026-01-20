// CUBE Engine Security & Privacy
// CSP, certificates, tracker blocking, fingerprint protection

use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::sync::RwLock;
use tauri::{AppHandle, Emitter, State};

// ============================================
// Security State
// ============================================

pub struct CubeSecurityState {
    pub csp_policies: RwLock<HashMap<String, ContentSecurityPolicy>>,
    pub certificates: RwLock<HashMap<String, CertificateInfo>>,
    pub tracker_lists: RwLock<TrackerDatabase>,
    pub fingerprint_config: RwLock<FingerprintProtection>,
    pub permissions: RwLock<HashMap<String, SitePermissions>>,
    pub blocked_requests: RwLock<Vec<BlockedRequest>>,
    pub security_config: RwLock<SecurityConfig>,
}

impl Default for CubeSecurityState {
    fn default() -> Self {
        Self {
            csp_policies: RwLock::new(HashMap::new()),
            certificates: RwLock::new(HashMap::new()),
            tracker_lists: RwLock::new(TrackerDatabase::default()),
            fingerprint_config: RwLock::new(FingerprintProtection::default()),
            permissions: RwLock::new(HashMap::new()),
            blocked_requests: RwLock::new(Vec::new()),
            security_config: RwLock::new(SecurityConfig::default()),
        }
    }
}

// ============================================
// Content Security Policy
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContentSecurityPolicy {
    pub origin: String,
    pub default_src: Vec<String>,
    pub script_src: Vec<String>,
    pub style_src: Vec<String>,
    pub img_src: Vec<String>,
    pub font_src: Vec<String>,
    pub connect_src: Vec<String>,
    pub media_src: Vec<String>,
    pub object_src: Vec<String>,
    pub frame_src: Vec<String>,
    pub frame_ancestors: Vec<String>,
    pub form_action: Vec<String>,
    pub base_uri: Vec<String>,
    pub upgrade_insecure_requests: bool,
    pub block_all_mixed_content: bool,
    pub report_uri: Option<String>,
    pub report_only: bool,
}

impl Default for ContentSecurityPolicy {
    fn default() -> Self {
        Self {
            origin: String::new(),
            default_src: vec!["'self'".to_string()],
            script_src: vec!["'self'".to_string()],
            style_src: vec!["'self'".to_string(), "'unsafe-inline'".to_string()],
            img_src: vec!["'self'".to_string(), "data:".to_string(), "https:".to_string()],
            font_src: vec!["'self'".to_string(), "https:".to_string()],
            connect_src: vec!["'self'".to_string()],
            media_src: vec!["'self'".to_string()],
            object_src: vec!["'none'".to_string()],
            frame_src: vec!["'self'".to_string()],
            frame_ancestors: vec!["'self'".to_string()],
            form_action: vec!["'self'".to_string()],
            base_uri: vec!["'self'".to_string()],
            upgrade_insecure_requests: true,
            block_all_mixed_content: true,
            report_uri: None,
            report_only: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CSPViolation {
    pub document_uri: String,
    pub violated_directive: String,
    pub blocked_uri: String,
    pub source_file: Option<String>,
    pub line_number: Option<u32>,
    pub column_number: Option<u32>,
    pub timestamp: i64,
}

// ============================================
// Certificate Handling
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CertificateInfo {
    pub domain: String,
    pub issuer: String,
    pub subject: String,
    pub valid_from: i64,
    pub valid_to: i64,
    pub fingerprint_sha256: String,
    pub public_key_algorithm: String,
    pub signature_algorithm: String,
    pub is_ev: bool,
    pub is_valid: bool,
    pub chain: Vec<CertificateChainItem>,
    pub ct_compliance: bool,
    pub hsts_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CertificateChainItem {
    pub subject: String,
    pub issuer: String,
    pub fingerprint: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CertificateStatus {
    Valid,
    Expired,
    NotYetValid,
    Revoked,
    SelfSigned,
    UntrustedRoot,
    NameMismatch,
    WeakSignature,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CertificateException {
    pub domain: String,
    pub fingerprint: String,
    pub reason: String,
    pub created_at: i64,
    pub expires_at: Option<i64>,
}

// ============================================
// Tracker Blocking
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackerDatabase {
    pub domains: HashSet<String>,
    pub patterns: Vec<TrackerPattern>,
    pub categories: HashMap<String, TrackerCategory>,
    pub last_updated: i64,
    pub version: String,
}

impl Default for TrackerDatabase {
    fn default() -> Self {
        let mut domains = HashSet::new();
        
        // Common trackers
        let common_trackers = [
            "google-analytics.com", "googletagmanager.com", "doubleclick.net",
            "facebook.com/tr", "facebook.net", "connect.facebook.net",
            "ads.twitter.com", "analytics.twitter.com",
            "pixel.facebook.com", "www.facebook.com/plugins",
            "mc.yandex.ru", "counter.yadro.ru",
            "hotjar.com", "fullstory.com", "mouseflow.com",
            "mixpanel.com", "segment.io", "amplitude.com",
            "adservice.google.com", "pagead2.googlesyndication.com",
            "criteo.com", "criteo.net", "taboola.com", "outbrain.com",
            "adsrvr.org", "adnxs.com", "rubiconproject.com",
        ];
        
        for tracker in common_trackers {
            domains.insert(tracker.to_string());
        }
        
        Self {
            domains,
            patterns: vec![
                TrackerPattern {
                    pattern: r".*google.*analytics.*".to_string(),
                    category: "analytics".to_string(),
                },
                TrackerPattern {
                    pattern: r".*facebook.*pixel.*".to_string(),
                    category: "advertising".to_string(),
                },
                TrackerPattern {
                    pattern: r".*doubleclick.*".to_string(),
                    category: "advertising".to_string(),
                },
            ],
            categories: HashMap::from([
                ("analytics".to_string(), TrackerCategory {
                    name: "Analytics".to_string(),
                    description: "Website analytics and tracking".to_string(),
                    blocked_by_default: true,
                }),
                ("advertising".to_string(), TrackerCategory {
                    name: "Advertising".to_string(),
                    description: "Ad networks and retargeting".to_string(),
                    blocked_by_default: true,
                }),
                ("social".to_string(), TrackerCategory {
                    name: "Social Media".to_string(),
                    description: "Social media widgets and tracking".to_string(),
                    blocked_by_default: true,
                }),
            ]),
            last_updated: chrono::Utc::now().timestamp_millis(),
            version: "1.0.0".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackerPattern {
    pub pattern: String,
    pub category: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackerCategory {
    pub name: String,
    pub description: String,
    pub blocked_by_default: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockedRequest {
    pub url: String,
    pub tab_id: String,
    pub reason: BlockReason,
    pub category: Option<String>,
    pub timestamp: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BlockReason {
    Tracker,
    Ad,
    Malware,
    Phishing,
    MixedContent,
    CSPViolation,
    UserBlocked,
}

// ============================================
// Fingerprint Protection
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FingerprintProtection {
    pub enabled: bool,
    pub level: FingerprintProtectionLevel,
    pub canvas_noise: bool,
    pub webgl_noise: bool,
    pub audio_noise: bool,
    pub font_fingerprint: bool,
    pub screen_resolution: bool,
    pub timezone_spoofing: bool,
    pub language_spoofing: bool,
    pub hardware_concurrency: Option<u32>,
    pub device_memory: Option<f64>,
    pub spoofed_user_agent: Option<String>,
    pub spoofed_platform: Option<String>,
}

impl Default for FingerprintProtection {
    fn default() -> Self {
        Self {
            enabled: true,
            level: FingerprintProtectionLevel::Standard,
            canvas_noise: true,
            webgl_noise: true,
            audio_noise: true,
            font_fingerprint: true,
            screen_resolution: false,
            timezone_spoofing: false,
            language_spoofing: false,
            hardware_concurrency: None,
            device_memory: None,
            spoofed_user_agent: None,
            spoofed_platform: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum FingerprintProtectionLevel {
    Off,
    #[default]
    Standard,
    Strict,
    Maximum,
}

// ============================================
// Site Permissions
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SitePermissions {
    pub origin: String,
    pub camera: PermissionState,
    pub microphone: PermissionState,
    pub geolocation: PermissionState,
    pub notifications: PermissionState,
    pub clipboard_read: PermissionState,
    pub clipboard_write: PermissionState,
    pub midi: PermissionState,
    pub usb: PermissionState,
    pub serial: PermissionState,
    pub bluetooth: PermissionState,
    pub storage_access: PermissionState,
    pub autoplay: PermissionState,
    pub popups: PermissionState,
    pub cookies: CookiePermission,
    pub javascript: bool,
    pub images: bool,
    pub plugins: bool,
}

impl Default for SitePermissions {
    fn default() -> Self {
        Self {
            origin: String::new(),
            camera: PermissionState::Prompt,
            microphone: PermissionState::Prompt,
            geolocation: PermissionState::Prompt,
            notifications: PermissionState::Prompt,
            clipboard_read: PermissionState::Prompt,
            clipboard_write: PermissionState::Granted,
            midi: PermissionState::Prompt,
            usb: PermissionState::Prompt,
            serial: PermissionState::Prompt,
            bluetooth: PermissionState::Prompt,
            storage_access: PermissionState::Prompt,
            autoplay: PermissionState::Granted,
            popups: PermissionState::Denied,
            cookies: CookiePermission::AllowAll,
            javascript: true,
            images: true,
            plugins: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum PermissionState {
    Granted,
    Denied,
    #[default]
    Prompt,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum CookiePermission {
    #[default]
    AllowAll,
    BlockThirdParty,
    BlockAll,
    SessionOnly,
}

// ============================================
// Security Config
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityConfig {
    pub https_only: bool,
    pub block_mixed_content: bool,
    pub safe_browsing: bool,
    pub do_not_track: bool,
    pub global_privacy_control: bool,
    pub clear_on_exit: ClearOnExitConfig,
    pub password_manager: bool,
    pub auto_fill: bool,
    pub phishing_protection: bool,
    pub malware_protection: bool,
    pub ssl_error_override: bool,
}

impl Default for SecurityConfig {
    fn default() -> Self {
        Self {
            https_only: false,
            block_mixed_content: true,
            safe_browsing: true,
            do_not_track: true,
            global_privacy_control: true,
            clear_on_exit: ClearOnExitConfig::default(),
            password_manager: true,
            auto_fill: true,
            phishing_protection: true,
            malware_protection: true,
            ssl_error_override: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ClearOnExitConfig {
    pub enabled: bool,
    pub cookies: bool,
    pub cache: bool,
    pub history: bool,
    pub downloads: bool,
    pub form_data: bool,
    pub passwords: bool,
    pub site_settings: bool,
}

// ============================================
// Tauri Commands - CSP
// ============================================

#[tauri::command]
pub async fn csp_set_policy(
    state: State<'_, CubeSecurityState>,
    origin: String,
    policy: ContentSecurityPolicy,
) -> Result<(), String> {
    let mut policies = state.csp_policies.write().map_err(|e| format!("Lock error: {}", e))?;
    policies.insert(origin, policy);
    Ok(())
}

#[tauri::command]
pub async fn csp_get_policy(
    state: State<'_, CubeSecurityState>,
    origin: String,
) -> Result<Option<ContentSecurityPolicy>, String> {
    let policies = state.csp_policies.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(policies.get(&origin).cloned())
}

#[tauri::command]
pub async fn csp_check_request(
    state: State<'_, CubeSecurityState>,
    origin: String,
    request_url: String,
    resource_type: String,
) -> Result<bool, String> {
    let policies = state.csp_policies.read().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(policy) = policies.get(&origin) {
        let allowed_sources = match resource_type.as_str() {
            "script" => &policy.script_src,
            "style" => &policy.style_src,
            "image" => &policy.img_src,
            "font" => &policy.font_src,
            "connect" => &policy.connect_src,
            "media" => &policy.media_src,
            "frame" => &policy.frame_src,
            _ => &policy.default_src,
        };
        
        let is_allowed = allowed_sources.iter().any(|src| {
            src == "'self'" || src == "*" || request_url.contains(src)
        });
        
        return Ok(is_allowed);
    }
    
    Ok(true)
}

#[tauri::command]
pub async fn csp_report_violation(
    _state: State<'_, CubeSecurityState>,
    app: AppHandle,
    violation: CSPViolation,
) -> Result<(), String> {
    let _ = app.emit("csp-violation", &violation);
    Ok(())
}

// ============================================
// Tauri Commands - Certificates
// ============================================

#[tauri::command]
pub async fn cert_get_info(
    state: State<'_, CubeSecurityState>,
    domain: String,
) -> Result<Option<CertificateInfo>, String> {
    let certs = state.certificates.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(certs.get(&domain).cloned())
}

#[tauri::command]
pub async fn cert_store_info(
    state: State<'_, CubeSecurityState>,
    info: CertificateInfo,
) -> Result<(), String> {
    let mut certs = state.certificates.write().map_err(|e| format!("Lock error: {}", e))?;
    certs.insert(info.domain.clone(), info);
    Ok(())
}

#[tauri::command]
pub async fn cert_verify(
    state: State<'_, CubeSecurityState>,
    domain: String,
) -> Result<CertificateStatus, String> {
    let certs = state.certificates.read().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(cert) = certs.get(&domain) {
        let now = chrono::Utc::now().timestamp_millis();
        
        if now < cert.valid_from {
            return Ok(CertificateStatus::NotYetValid);
        }
        if now > cert.valid_to {
            return Ok(CertificateStatus::Expired);
        }
        if cert.is_valid {
            return Ok(CertificateStatus::Valid);
        }
    }
    
    Ok(CertificateStatus::Unknown)
}

#[tauri::command]
pub async fn cert_add_exception(
    _state: State<'_, CubeSecurityState>,
    _exception: CertificateException,
) -> Result<(), String> {
    Ok(())
}

// ============================================
// Tauri Commands - Tracker Blocking
// ============================================

#[tauri::command]
pub async fn tracker_check_url(
    state: State<'_, CubeSecurityState>,
    url: String,
) -> Result<bool, String> {
    let db = state.tracker_lists.read().map_err(|e| format!("Lock error: {}", e))?;
    
    for domain in &db.domains {
        if url.contains(domain) {
            return Ok(true);
        }
    }
    
    for pattern in &db.patterns {
        if let Ok(regex) = regex::Regex::new(&pattern.pattern) {
            if regex.is_match(&url) {
                return Ok(true);
            }
        }
    }
    
    Ok(false)
}

#[tauri::command]
pub async fn tracker_block_request(
    state: State<'_, CubeSecurityState>,
    app: AppHandle,
    url: String,
    tab_id: String,
    category: Option<String>,
) -> Result<(), String> {
    let blocked = BlockedRequest {
        url: url.clone(),
        tab_id,
        reason: BlockReason::Tracker,
        category,
        timestamp: chrono::Utc::now().timestamp_millis(),
    };
    
    let mut requests = state.blocked_requests.write().map_err(|e| format!("Lock error: {}", e))?;
    requests.push(blocked.clone());
    
    let _ = app.emit("request-blocked", &blocked);
    
    Ok(())
}

#[tauri::command]
pub async fn tracker_get_blocked(
    state: State<'_, CubeSecurityState>,
    tab_id: Option<String>,
) -> Result<Vec<BlockedRequest>, String> {
    let requests = state.blocked_requests.read().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(id) = tab_id {
        Ok(requests.iter().filter(|r| r.tab_id == id).cloned().collect())
    } else {
        Ok(requests.clone())
    }
}

#[tauri::command]
pub async fn tracker_get_stats(
    state: State<'_, CubeSecurityState>,
) -> Result<TrackerStats, String> {
    let requests = state.blocked_requests.read().map_err(|e| format!("Lock error: {}", e))?;
    
    let mut by_category: HashMap<String, u32> = HashMap::new();
    
    for req in requests.iter() {
        if let Some(cat) = &req.category {
            *by_category.entry(cat.clone()).or_insert(0) += 1;
        }
    }
    
    Ok(TrackerStats {
        total_blocked: requests.len() as u32,
        by_category,
        today_blocked: requests.iter()
            .filter(|r| {
                let today_start = chrono::Utc::now().date_naive().and_hms_opt(0, 0, 0)
                    .map(|dt| dt.and_utc().timestamp_millis())
                    .unwrap_or(0);
                r.timestamp >= today_start
            })
            .count() as u32,
    })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackerStats {
    pub total_blocked: u32,
    pub by_category: HashMap<String, u32>,
    pub today_blocked: u32,
}

#[tauri::command]
pub async fn tracker_update_database(
    state: State<'_, CubeSecurityState>,
    domains: Vec<String>,
    patterns: Vec<TrackerPattern>,
) -> Result<(), String> {
    let mut db = state.tracker_lists.write().map_err(|e| format!("Lock error: {}", e))?;
    
    for domain in domains {
        db.domains.insert(domain);
    }
    db.patterns.extend(patterns);
    db.last_updated = chrono::Utc::now().timestamp_millis();
    
    Ok(())
}

// ============================================
// Tauri Commands - Fingerprint Protection
// ============================================

#[tauri::command]
pub async fn fingerprint_get_config(
    state: State<'_, CubeSecurityState>,
) -> Result<FingerprintProtection, String> {
    let config = state.fingerprint_config.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(config.clone())
}

#[tauri::command]
pub async fn fingerprint_set_config(
    state: State<'_, CubeSecurityState>,
    config: FingerprintProtection,
) -> Result<(), String> {
    let mut current = state.fingerprint_config.write().map_err(|e| format!("Lock error: {}", e))?;
    *current = config;
    Ok(())
}

#[tauri::command]
pub async fn fingerprint_set_level(
    state: State<'_, CubeSecurityState>,
    level: FingerprintProtectionLevel,
) -> Result<(), String> {
    let mut config = state.fingerprint_config.write().map_err(|e| format!("Lock error: {}", e))?;
    
    config.level = level.clone();
    
    match level {
        FingerprintProtectionLevel::Off => {
            config.enabled = false;
            config.canvas_noise = false;
            config.webgl_noise = false;
            config.audio_noise = false;
        }
        FingerprintProtectionLevel::Standard => {
            config.enabled = true;
            config.canvas_noise = true;
            config.webgl_noise = true;
            config.audio_noise = true;
            config.font_fingerprint = true;
        }
        FingerprintProtectionLevel::Strict => {
            config.enabled = true;
            config.canvas_noise = true;
            config.webgl_noise = true;
            config.audio_noise = true;
            config.font_fingerprint = true;
            config.screen_resolution = true;
            config.timezone_spoofing = true;
        }
        FingerprintProtectionLevel::Maximum => {
            config.enabled = true;
            config.canvas_noise = true;
            config.webgl_noise = true;
            config.audio_noise = true;
            config.font_fingerprint = true;
            config.screen_resolution = true;
            config.timezone_spoofing = true;
            config.language_spoofing = true;
            config.hardware_concurrency = Some(4);
            config.device_memory = Some(8.0);
        }
    }
    
    Ok(())
}

#[tauri::command]
pub async fn fingerprint_get_noise_value(
    _state: State<'_, CubeSecurityState>,
    fingerprint_type: String,
) -> Result<f64, String> {
    use std::hash::{Hash, Hasher};
    use std::collections::hash_map::DefaultHasher;
    
    let mut hasher = DefaultHasher::new();
    fingerprint_type.hash(&mut hasher);
    chrono::Utc::now().timestamp().hash(&mut hasher);
    
    let hash = hasher.finish();
    let noise = (hash % 1000) as f64 / 10000.0;
    
    Ok(noise)
}

// ============================================
// Tauri Commands - Site Permissions
// ============================================

#[tauri::command]
pub async fn permission_get(
    state: State<'_, CubeSecurityState>,
    origin: String,
) -> Result<SitePermissions, String> {
    let permissions = state.permissions.read().map_err(|e| format!("Lock error: {}", e))?;
    
    Ok(permissions.get(&origin).cloned().unwrap_or_else(|| {
        let mut perms = SitePermissions::default();
        perms.origin = origin;
        perms
    }))
}

#[tauri::command]
pub async fn permission_set(
    state: State<'_, CubeSecurityState>,
    origin: String,
    permission_type: String,
    permission_state: PermissionState,
) -> Result<(), String> {
    let mut permissions = state.permissions.write().map_err(|e| format!("Lock error: {}", e))?;
    
    let perms = permissions.entry(origin.clone()).or_insert_with(|| {
        let mut p = SitePermissions::default();
        p.origin = origin;
        p
    });
    
    match permission_type.as_str() {
        "camera" => perms.camera = permission_state,
        "microphone" => perms.microphone = permission_state,
        "geolocation" => perms.geolocation = permission_state,
        "notifications" => perms.notifications = permission_state,
        "clipboard_read" => perms.clipboard_read = permission_state,
        "clipboard_write" => perms.clipboard_write = permission_state,
        "midi" => perms.midi = permission_state,
        "usb" => perms.usb = permission_state,
        "serial" => perms.serial = permission_state,
        "bluetooth" => perms.bluetooth = permission_state,
        "storage_access" => perms.storage_access = permission_state,
        "autoplay" => perms.autoplay = permission_state,
        "popups" => perms.popups = permission_state,
        _ => return Err(format!("Unknown permission type: {}", permission_type)),
    }
    
    Ok(())
}

#[tauri::command]
pub async fn permission_reset(
    state: State<'_, CubeSecurityState>,
    origin: String,
) -> Result<(), String> {
    let mut permissions = state.permissions.write().map_err(|e| format!("Lock error: {}", e))?;
    permissions.remove(&origin);
    Ok(())
}

#[tauri::command]
pub async fn permission_get_all(
    state: State<'_, CubeSecurityState>,
) -> Result<Vec<SitePermissions>, String> {
    let permissions = state.permissions.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(permissions.values().cloned().collect())
}

// ============================================
// Tauri Commands - Security Config
// ============================================

#[tauri::command]
pub async fn security_get_config(
    state: State<'_, CubeSecurityState>,
) -> Result<SecurityConfig, String> {
    let config = state.security_config.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(config.clone())
}

#[tauri::command]
pub async fn security_set_config(
    state: State<'_, CubeSecurityState>,
    config: SecurityConfig,
) -> Result<(), String> {
    let mut current = state.security_config.write().map_err(|e| format!("Lock error: {}", e))?;
    *current = config;
    Ok(())
}

#[tauri::command]
pub async fn security_set_https_only(
    state: State<'_, CubeSecurityState>,
    enabled: bool,
) -> Result<(), String> {
    let mut config = state.security_config.write().map_err(|e| format!("Lock error: {}", e))?;
    config.https_only = enabled;
    Ok(())
}

#[tauri::command]
pub async fn security_set_dnt(
    state: State<'_, CubeSecurityState>,
    enabled: bool,
) -> Result<(), String> {
    let mut config = state.security_config.write().map_err(|e| format!("Lock error: {}", e))?;
    config.do_not_track = enabled;
    Ok(())
}

#[tauri::command]
pub async fn security_check_safe_browsing(
    _state: State<'_, CubeSecurityState>,
    _url: String,
) -> Result<SafeBrowsingResult, String> {
    Ok(SafeBrowsingResult {
        is_safe: true,
        threat_type: None,
        platform_type: None,
    })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SafeBrowsingResult {
    pub is_safe: bool,
    pub threat_type: Option<String>,
    pub platform_type: Option<String>,
}
