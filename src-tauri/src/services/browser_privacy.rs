// CUBE Nexum - Privacy Dashboard Service
// Unified privacy controls superior to Brave, Firefox, Safari

use std::collections::HashMap;
use std::sync::Mutex;
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc, Duration};

// ==================== Types ====================

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PrivacyLevel {
    Standard,
    Strict,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TrackerType {
    Advertising,
    Analytics,
    Social,
    Cryptominer,
    Fingerprinting,
    ContentTracker,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CookiePolicy {
    AllowAll,
    BlockThirdParty,
    BlockAllCookies,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrivacySettings {
    pub privacy_level: PrivacyLevel,
    // Tracking Protection
    pub block_trackers: bool,
    pub block_ads: bool,
    pub block_social_trackers: bool,
    pub block_cryptominers: bool,
    pub block_fingerprinting: bool,
    // Cookies
    pub cookie_policy: CookiePolicy,
    pub block_third_party_cookies: bool,
    pub clear_cookies_on_exit: bool,
    pub cookie_lifetime_days: Option<u32>,
    // Fingerprinting
    pub randomize_canvas: bool,
    pub randomize_webgl: bool,
    pub randomize_audio: bool,
    pub spoof_user_agent: bool,
    pub spoof_timezone: bool,
    pub spoof_language: bool,
    pub spoof_screen_resolution: bool,
    // Network Privacy
    pub use_doh: bool,
    pub doh_provider: String,
    pub block_webrtc_leak: bool,
    pub disable_referrer: bool,
    pub send_dnt_header: bool,
    pub send_gpc_header: bool,
    // Data Clearing
    pub auto_clear_history: bool,
    pub auto_clear_downloads: bool,
    pub auto_clear_cache: bool,
    pub auto_clear_form_data: bool,
    pub auto_clear_passwords: bool,
    pub clear_interval_hours: u32,
    // HTTPS
    pub https_only_mode: bool,
    pub upgrade_insecure_requests: bool,
    // Permissions
    pub default_camera_permission: PermissionDefault,
    pub default_microphone_permission: PermissionDefault,
    pub default_location_permission: PermissionDefault,
    pub default_notification_permission: PermissionDefault,
    // Site-specific
    pub whitelisted_sites: Vec<String>,
    pub blacklisted_sites: Vec<String>,
}

impl Default for PrivacySettings {
    fn default() -> Self {
        Self {
            privacy_level: PrivacyLevel::Standard,
            block_trackers: true,
            block_ads: true,
            block_social_trackers: true,
            block_cryptominers: true,
            block_fingerprinting: true,
            cookie_policy: CookiePolicy::BlockThirdParty,
            block_third_party_cookies: true,
            clear_cookies_on_exit: false,
            cookie_lifetime_days: None,
            randomize_canvas: true,
            randomize_webgl: true,
            randomize_audio: true,
            spoof_user_agent: false,
            spoof_timezone: false,
            spoof_language: false,
            spoof_screen_resolution: false,
            use_doh: true,
            doh_provider: "https://cloudflare-dns.com/dns-query".to_string(),
            block_webrtc_leak: true,
            disable_referrer: true,
            send_dnt_header: true,
            send_gpc_header: true,
            auto_clear_history: false,
            auto_clear_downloads: false,
            auto_clear_cache: false,
            auto_clear_form_data: false,
            auto_clear_passwords: false,
            clear_interval_hours: 24,
            https_only_mode: true,
            upgrade_insecure_requests: true,
            default_camera_permission: PermissionDefault::Ask,
            default_microphone_permission: PermissionDefault::Ask,
            default_location_permission: PermissionDefault::Block,
            default_notification_permission: PermissionDefault::Ask,
            whitelisted_sites: Vec::new(),
            blacklisted_sites: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PermissionDefault {
    Allow,
    Block,
    Ask,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockedTracker {
    pub id: String,
    pub domain: String,
    pub tracker_type: TrackerType,
    pub company: Option<String>,
    pub blocked_count: u64,
    pub first_blocked: DateTime<Utc>,
    pub last_blocked: DateTime<Utc>,
    pub source_urls: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Cookie {
    pub domain: String,
    pub name: String,
    pub value: String,
    pub path: String,
    pub expires: Option<DateTime<Utc>>,
    pub secure: bool,
    pub http_only: bool,
    pub same_site: SameSite,
    pub is_third_party: bool,
    pub created_at: DateTime<Utc>,
    pub last_accessed: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SameSite {
    Strict,
    Lax,
    None,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FingerprintProtection {
    pub canvas_noise: f64,
    pub webgl_noise: f64,
    pub audio_noise: f64,
    pub font_list_randomized: bool,
    pub user_agent: Option<String>,
    pub timezone: Option<String>,
    pub language: Option<String>,
    pub screen_resolution: Option<(u32, u32)>,
    pub last_rotated: DateTime<Utc>,
}

impl Default for FingerprintProtection {
    fn default() -> Self {
        Self {
            canvas_noise: 0.0001,
            webgl_noise: 0.0001,
            audio_noise: 0.0001,
            font_list_randomized: true,
            user_agent: None,
            timezone: None,
            language: None,
            screen_resolution: None,
            last_rotated: Utc::now(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SitePermissions {
    pub domain: String,
    pub camera: Option<bool>,
    pub microphone: Option<bool>,
    pub location: Option<bool>,
    pub notifications: Option<bool>,
    pub clipboard: Option<bool>,
    pub autoplay: Option<bool>,
    pub popups: Option<bool>,
    pub javascript: Option<bool>,
    pub images: Option<bool>,
    pub cookies: Option<bool>,
    pub created_at: DateTime<Utc>,
    pub modified_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrivacyStats {
    pub trackers_blocked_today: u64,
    pub trackers_blocked_week: u64,
    pub trackers_blocked_month: u64,
    pub trackers_blocked_total: u64,
    pub ads_blocked_today: u64,
    pub ads_blocked_total: u64,
    pub cookies_blocked_total: u64,
    pub fingerprinting_attempts_blocked: u64,
    pub https_upgrades: u64,
    pub data_saved_bytes: u64,
    pub top_blocked_trackers: Vec<(String, u64)>,
    pub top_blocked_domains: Vec<(String, u64)>,
    pub protection_score: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrivacyReport {
    pub generated_at: DateTime<Utc>,
    pub period_start: DateTime<Utc>,
    pub period_end: DateTime<Utc>,
    pub stats: PrivacyStats,
    pub trackers_by_type: HashMap<String, u64>,
    pub trackers_by_company: HashMap<String, u64>,
    pub sites_with_most_trackers: Vec<(String, u64)>,
    pub recommendations: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DoHProvider {
    pub name: String,
    pub url: String,
    pub description: String,
    pub privacy_policy: Option<String>,
}

// ==================== Service ====================

pub struct PrivacyDashboardService {
    settings: Mutex<PrivacySettings>,
    blocked_trackers: Mutex<HashMap<String, BlockedTracker>>,
    cookies: Mutex<HashMap<String, Cookie>>,
    fingerprint_protection: Mutex<FingerprintProtection>,
    site_permissions: Mutex<HashMap<String, SitePermissions>>,
    stats: Mutex<PrivacyStats>,
}

impl PrivacyDashboardService {
    pub fn new() -> Self {
        Self {
            settings: Mutex::new(PrivacySettings::default()),
            blocked_trackers: Mutex::new(HashMap::new()),
            cookies: Mutex::new(HashMap::new()),
            fingerprint_protection: Mutex::new(FingerprintProtection::default()),
            site_permissions: Mutex::new(HashMap::new()),
            stats: Mutex::new(PrivacyStats {
                trackers_blocked_today: 0,
                trackers_blocked_week: 0,
                trackers_blocked_month: 0,
                trackers_blocked_total: 0,
                ads_blocked_today: 0,
                ads_blocked_total: 0,
                cookies_blocked_total: 0,
                fingerprinting_attempts_blocked: 0,
                https_upgrades: 0,
                data_saved_bytes: 0,
                top_blocked_trackers: Vec::new(),
                top_blocked_domains: Vec::new(),
                protection_score: 85,
            }),
        }
    }

    fn generate_id(&self) -> String {
        uuid::Uuid::new_v4().to_string()
    }

    // ==================== Settings ====================

    pub fn get_settings(&self) -> PrivacySettings {
        self.settings.lock().unwrap().clone()
    }

    pub fn update_settings(&self, settings: PrivacySettings) -> Result<(), String> {
        *self.settings.lock().unwrap() = settings;
        self.recalculate_protection_score();
        Ok(())
    }

    pub fn set_privacy_level(&self, level: PrivacyLevel) -> Result<(), String> {
        let mut settings = self.settings.lock().unwrap();
        
        match level {
            PrivacyLevel::Standard => {
                settings.block_trackers = true;
                settings.block_ads = true;
                settings.block_social_trackers = true;
                settings.block_cryptominers = true;
                settings.block_fingerprinting = true;
                settings.cookie_policy = CookiePolicy::BlockThirdParty;
                settings.https_only_mode = true;
            }
            PrivacyLevel::Strict => {
                settings.block_trackers = true;
                settings.block_ads = true;
                settings.block_social_trackers = true;
                settings.block_cryptominers = true;
                settings.block_fingerprinting = true;
                settings.cookie_policy = CookiePolicy::BlockThirdParty;
                settings.clear_cookies_on_exit = true;
                settings.randomize_canvas = true;
                settings.randomize_webgl = true;
                settings.randomize_audio = true;
                settings.spoof_user_agent = true;
                settings.https_only_mode = true;
                settings.block_webrtc_leak = true;
            }
            PrivacyLevel::Custom => {
                // Keep current settings
            }
        }
        
        settings.privacy_level = level;
        drop(settings);
        self.recalculate_protection_score();
        Ok(())
    }

    fn recalculate_protection_score(&self) {
        let settings = self.settings.lock().unwrap();
        let mut score: u8 = 0;
        
        if settings.block_trackers { score += 15; }
        if settings.block_ads { score += 10; }
        if settings.block_social_trackers { score += 10; }
        if settings.block_cryptominers { score += 5; }
        if settings.block_fingerprinting { score += 15; }
        if settings.block_third_party_cookies { score += 10; }
        if settings.https_only_mode { score += 10; }
        if settings.use_doh { score += 10; }
        if settings.block_webrtc_leak { score += 5; }
        if settings.send_gpc_header { score += 5; }
        if settings.send_dnt_header { score += 5; }
        
        drop(settings);
        
        let mut stats = self.stats.lock().unwrap();
        stats.protection_score = score.min(100);
    }

    // ==================== Tracker Blocking ====================

    pub fn record_blocked_tracker(&self, domain: String, tracker_type: TrackerType, source_url: String) {
        let id = self.generate_id();
        let now = Utc::now();
        
        let mut trackers = self.blocked_trackers.lock().unwrap();
        
        if let Some(tracker) = trackers.get_mut(&domain) {
            tracker.blocked_count += 1;
            tracker.last_blocked = now;
            if !tracker.source_urls.contains(&source_url) {
                tracker.source_urls.push(source_url);
            }
        } else {
            trackers.insert(domain.clone(), BlockedTracker {
                id,
                domain: domain.clone(),
                tracker_type,
                company: Self::get_company_for_domain(&domain),
                blocked_count: 1,
                first_blocked: now,
                last_blocked: now,
                source_urls: vec![source_url],
            });
        }
        
        drop(trackers);
        
        // Update stats
        let mut stats = self.stats.lock().unwrap();
        stats.trackers_blocked_today += 1;
        stats.trackers_blocked_week += 1;
        stats.trackers_blocked_month += 1;
        stats.trackers_blocked_total += 1;
    }

    fn get_company_for_domain(domain: &str) -> Option<String> {
        // Common tracker companies
        let companies: HashMap<&str, &str> = HashMap::from([
            ("google-analytics.com", "Google"),
            ("googletagmanager.com", "Google"),
            ("doubleclick.net", "Google"),
            ("facebook.com", "Meta"),
            ("facebook.net", "Meta"),
            ("fbcdn.net", "Meta"),
            ("amazon-adsystem.com", "Amazon"),
            ("criteo.com", "Criteo"),
            ("outbrain.com", "Outbrain"),
            ("taboola.com", "Taboola"),
            ("twitter.com", "Twitter"),
            ("linkedin.com", "LinkedIn"),
        ]);
        
        for (pattern, company) in companies {
            if domain.contains(pattern) {
                return Some(company.to_string());
            }
        }
        
        None
    }

    pub fn get_blocked_trackers(&self) -> Vec<BlockedTracker> {
        self.blocked_trackers.lock().unwrap().values().cloned().collect()
    }

    pub fn get_blocked_trackers_by_type(&self, tracker_type: TrackerType) -> Vec<BlockedTracker> {
        self.blocked_trackers.lock().unwrap()
            .values()
            .filter(|t| t.tracker_type == tracker_type)
            .cloned()
            .collect()
    }

    pub fn clear_blocked_trackers(&self) {
        self.blocked_trackers.lock().unwrap().clear();
    }

    // ==================== Cookie Management ====================

    pub fn add_cookie(&self, cookie: Cookie) -> Result<(), String> {
        let key = format!("{}:{}", cookie.domain, cookie.name);
        self.cookies.lock().unwrap().insert(key, cookie);
        Ok(())
    }

    pub fn get_cookies(&self) -> Vec<Cookie> {
        self.cookies.lock().unwrap().values().cloned().collect()
    }

    pub fn get_cookies_for_domain(&self, domain: &str) -> Vec<Cookie> {
        self.cookies.lock().unwrap()
            .values()
            .filter(|c| c.domain == domain || c.domain.ends_with(&format!(".{}", domain)))
            .cloned()
            .collect()
    }

    pub fn get_third_party_cookies(&self) -> Vec<Cookie> {
        self.cookies.lock().unwrap()
            .values()
            .filter(|c| c.is_third_party)
            .cloned()
            .collect()
    }

    pub fn delete_cookie(&self, domain: &str, name: &str) -> Result<(), String> {
        let key = format!("{}:{}", domain, name);
        self.cookies.lock().unwrap().remove(&key)
            .map(|_| ())
            .ok_or_else(|| "Cookie not found".to_string())
    }

    pub fn delete_cookies_for_domain(&self, domain: &str) -> u32 {
        let mut cookies = self.cookies.lock().unwrap();
        let keys_to_remove: Vec<String> = cookies.iter()
            .filter(|(_, c)| c.domain == domain || c.domain.ends_with(&format!(".{}", domain)))
            .map(|(k, _)| k.clone())
            .collect();
        
        let count = keys_to_remove.len() as u32;
        for key in keys_to_remove {
            cookies.remove(&key);
        }
        count
    }

    pub fn clear_all_cookies(&self) -> u32 {
        let mut cookies = self.cookies.lock().unwrap();
        let count = cookies.len() as u32;
        cookies.clear();
        count
    }

    pub fn clear_third_party_cookies(&self) -> u32 {
        let mut cookies = self.cookies.lock().unwrap();
        let keys_to_remove: Vec<String> = cookies.iter()
            .filter(|(_, c)| c.is_third_party)
            .map(|(k, _)| k.clone())
            .collect();
        
        let count = keys_to_remove.len() as u32;
        for key in keys_to_remove {
            cookies.remove(&key);
        }
        count
    }

    pub fn get_cookie_stats(&self) -> HashMap<String, u64> {
        let cookies = self.cookies.lock().unwrap();
        let mut stats = HashMap::new();
        
        stats.insert("total".to_string(), cookies.len() as u64);
        stats.insert("third_party".to_string(), 
            cookies.values().filter(|c| c.is_third_party).count() as u64);
        stats.insert("secure".to_string(), 
            cookies.values().filter(|c| c.secure).count() as u64);
        stats.insert("http_only".to_string(), 
            cookies.values().filter(|c| c.http_only).count() as u64);
        
        stats
    }

    // ==================== Fingerprint Protection ====================

    pub fn get_fingerprint_protection(&self) -> FingerprintProtection {
        self.fingerprint_protection.lock().unwrap().clone()
    }

    pub fn rotate_fingerprint(&self) -> Result<FingerprintProtection, String> {
        let mut protection = self.fingerprint_protection.lock().unwrap();
        
        // Generate new random values
        use rand::Rng;
        let mut rng = rand::thread_rng();
        
        protection.canvas_noise = rng.gen_range(0.0001..0.001);
        protection.webgl_noise = rng.gen_range(0.0001..0.001);
        protection.audio_noise = rng.gen_range(0.0001..0.001);
        protection.last_rotated = Utc::now();
        
        Ok(protection.clone())
    }

    pub fn set_spoofed_user_agent(&self, user_agent: Option<String>) -> Result<(), String> {
        self.fingerprint_protection.lock().unwrap().user_agent = user_agent;
        Ok(())
    }

    pub fn set_spoofed_timezone(&self, timezone: Option<String>) -> Result<(), String> {
        self.fingerprint_protection.lock().unwrap().timezone = timezone;
        Ok(())
    }

    pub fn set_spoofed_resolution(&self, resolution: Option<(u32, u32)>) -> Result<(), String> {
        self.fingerprint_protection.lock().unwrap().screen_resolution = resolution;
        Ok(())
    }

    // ==================== Site Permissions ====================

    pub fn get_site_permissions(&self, domain: &str) -> Option<SitePermissions> {
        self.site_permissions.lock().unwrap().get(domain).cloned()
    }

    pub fn set_site_permission(&self, domain: String, permission_type: &str, value: Option<bool>) -> Result<(), String> {
        let mut permissions = self.site_permissions.lock().unwrap();
        let now = Utc::now();
        
        let site = permissions.entry(domain.clone()).or_insert_with(|| SitePermissions {
            domain: domain.clone(),
            camera: None,
            microphone: None,
            location: None,
            notifications: None,
            clipboard: None,
            autoplay: None,
            popups: None,
            javascript: None,
            images: None,
            cookies: None,
            created_at: now,
            modified_at: now,
        });
        
        match permission_type {
            "camera" => site.camera = value,
            "microphone" => site.microphone = value,
            "location" => site.location = value,
            "notifications" => site.notifications = value,
            "clipboard" => site.clipboard = value,
            "autoplay" => site.autoplay = value,
            "popups" => site.popups = value,
            "javascript" => site.javascript = value,
            "images" => site.images = value,
            "cookies" => site.cookies = value,
            _ => return Err("Unknown permission type".to_string()),
        }
        
        site.modified_at = now;
        Ok(())
    }

    pub fn get_all_site_permissions(&self) -> Vec<SitePermissions> {
        self.site_permissions.lock().unwrap().values().cloned().collect()
    }

    pub fn clear_site_permissions(&self, domain: &str) -> Result<(), String> {
        self.site_permissions.lock().unwrap().remove(domain)
            .map(|_| ())
            .ok_or_else(|| "Site not found".to_string())
    }

    pub fn clear_all_site_permissions(&self) {
        self.site_permissions.lock().unwrap().clear();
    }

    // ==================== Whitelist/Blacklist ====================

    pub fn add_to_whitelist(&self, domain: String) -> Result<(), String> {
        let mut settings = self.settings.lock().unwrap();
        if !settings.whitelisted_sites.contains(&domain) {
            settings.whitelisted_sites.push(domain);
        }
        Ok(())
    }

    pub fn remove_from_whitelist(&self, domain: &str) -> Result<(), String> {
        let mut settings = self.settings.lock().unwrap();
        settings.whitelisted_sites.retain(|s| s != domain);
        Ok(())
    }

    pub fn add_to_blacklist(&self, domain: String) -> Result<(), String> {
        let mut settings = self.settings.lock().unwrap();
        if !settings.blacklisted_sites.contains(&domain) {
            settings.blacklisted_sites.push(domain);
        }
        Ok(())
    }

    pub fn remove_from_blacklist(&self, domain: &str) -> Result<(), String> {
        let mut settings = self.settings.lock().unwrap();
        settings.blacklisted_sites.retain(|s| s != domain);
        Ok(())
    }

    pub fn is_whitelisted(&self, domain: &str) -> bool {
        self.settings.lock().unwrap().whitelisted_sites.contains(&domain.to_string())
    }

    pub fn is_blacklisted(&self, domain: &str) -> bool {
        self.settings.lock().unwrap().blacklisted_sites.contains(&domain.to_string())
    }

    // ==================== Statistics ====================

    pub fn get_stats(&self) -> PrivacyStats {
        self.stats.lock().unwrap().clone()
    }

    pub fn get_protection_score(&self) -> u8 {
        self.stats.lock().unwrap().protection_score
    }

    pub fn reset_daily_stats(&self) {
        let mut stats = self.stats.lock().unwrap();
        stats.trackers_blocked_today = 0;
        stats.ads_blocked_today = 0;
    }

    pub fn reset_weekly_stats(&self) {
        let mut stats = self.stats.lock().unwrap();
        stats.trackers_blocked_week = 0;
    }

    pub fn reset_monthly_stats(&self) {
        let mut stats = self.stats.lock().unwrap();
        stats.trackers_blocked_month = 0;
    }

    // ==================== Reports ====================

    pub fn generate_report(&self, days: u32) -> PrivacyReport {
        let stats = self.get_stats();
        let trackers = self.get_blocked_trackers();
        let now = Utc::now();
        
        // Calculate trackers by type
        let mut by_type: HashMap<String, u64> = HashMap::new();
        let mut by_company: HashMap<String, u64> = HashMap::new();
        
        for tracker in &trackers {
            let type_key = format!("{:?}", tracker.tracker_type);
            *by_type.entry(type_key).or_insert(0) += tracker.blocked_count;
            
            if let Some(ref company) = tracker.company {
                *by_company.entry(company.clone()).or_insert(0) += tracker.blocked_count;
            }
        }
        
        // Generate recommendations
        let mut recommendations = Vec::new();
        let settings = self.get_settings();
        
        if !settings.block_fingerprinting {
            recommendations.push("Enable fingerprinting protection for better privacy".to_string());
        }
        if !settings.use_doh {
            recommendations.push("Enable DNS over HTTPS to encrypt your DNS queries".to_string());
        }
        if !settings.https_only_mode {
            recommendations.push("Enable HTTPS-Only mode for secure connections".to_string());
        }
        if !settings.block_webrtc_leak {
            recommendations.push("Block WebRTC leaks to hide your real IP address".to_string());
        }
        
        PrivacyReport {
            generated_at: now,
            period_start: now - Duration::days(days as i64),
            period_end: now,
            stats,
            trackers_by_type: by_type,
            trackers_by_company: by_company,
            sites_with_most_trackers: Vec::new(),
            recommendations,
        }
    }

    // ==================== DoH Providers ====================

    pub fn get_doh_providers() -> Vec<DoHProvider> {
        vec![
            DoHProvider {
                name: "Cloudflare".to_string(),
                url: "https://cloudflare-dns.com/dns-query".to_string(),
                description: "Fast and private DNS resolver by Cloudflare".to_string(),
                privacy_policy: Some("https://developers.cloudflare.com/1.1.1.1/privacy/".to_string()),
            },
            DoHProvider {
                name: "Google".to_string(),
                url: "https://dns.google/dns-query".to_string(),
                description: "Google Public DNS over HTTPS".to_string(),
                privacy_policy: Some("https://developers.google.com/speed/public-dns/privacy".to_string()),
            },
            DoHProvider {
                name: "Quad9".to_string(),
                url: "https://dns.quad9.net/dns-query".to_string(),
                description: "Security-focused DNS with malware blocking".to_string(),
                privacy_policy: Some("https://www.quad9.net/privacy/policy/".to_string()),
            },
            DoHProvider {
                name: "NextDNS".to_string(),
                url: "https://dns.nextdns.io".to_string(),
                description: "Customizable DNS with privacy features".to_string(),
                privacy_policy: Some("https://nextdns.io/privacy".to_string()),
            },
            DoHProvider {
                name: "AdGuard".to_string(),
                url: "https://dns.adguard.com/dns-query".to_string(),
                description: "Ad-blocking DNS resolver".to_string(),
                privacy_policy: Some("https://adguard.com/privacy/dns.html".to_string()),
            },
        ]
    }

    pub fn set_doh_provider(&self, url: String) -> Result<(), String> {
        self.settings.lock().unwrap().doh_provider = url;
        Ok(())
    }

    // ==================== Data Clearing ====================

    pub fn clear_browsing_data(&self, options: ClearDataOptions) -> ClearDataResult {
        let mut result = ClearDataResult {
            history_cleared: 0,
            downloads_cleared: 0,
            cookies_cleared: 0,
            cache_cleared_bytes: 0,
            form_data_cleared: 0,
            passwords_cleared: 0,
        };
        
        if options.cookies {
            result.cookies_cleared = self.clear_all_cookies();
        }
        
        // Other clearing would be handled by respective services
        
        result
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClearDataOptions {
    pub history: bool,
    pub downloads: bool,
    pub cookies: bool,
    pub cache: bool,
    pub form_data: bool,
    pub passwords: bool,
    pub time_range: Option<TimeRange>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TimeRange {
    LastHour,
    LastDay,
    LastWeek,
    LastMonth,
    AllTime,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClearDataResult {
    pub history_cleared: u64,
    pub downloads_cleared: u64,
    pub cookies_cleared: u32,
    pub cache_cleared_bytes: u64,
    pub form_data_cleared: u64,
    pub passwords_cleared: u64,
}
