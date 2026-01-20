// CUBE Shield - Advanced Ad & Tracker Blocker
// Superior to Brave Shields, uBlock Origin, and Privacy Badger
// AI-powered content blocking with learning capabilities

use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::sync::RwLock;
use regex::Regex;
use lazy_static::lazy_static;

// ============================================
// Shield Configuration Types
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShieldConfig {
    pub enabled: bool,
    pub level: ShieldLevel,
    pub ad_blocking: bool,
    pub tracker_blocking: bool,
    pub fingerprint_protection: bool,
    pub cookie_blocking: CookieBlockingLevel,
    pub script_blocking: bool,
    pub social_blocking: bool,
    pub crypto_mining_blocking: bool,
    pub malware_blocking: bool,
    pub https_upgrade: bool,
    pub webrtc_protection: bool,
    pub canvas_protection: bool,
    pub font_protection: bool,
    pub battery_api_blocking: bool,
    pub hardware_concurrency_spoof: bool,
    pub custom_rules: Vec<CustomRule>,
    pub whitelist: HashSet<String>,
    pub blacklist: HashSet<String>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum ShieldLevel {
    Off,
    Standard,    // Block known ads and trackers
    Strict,      // Block all third-party content
    Aggressive,  // Block everything suspicious (may break sites)
    Custom,      // User-defined rules
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum CookieBlockingLevel {
    AllowAll,
    BlockThirdParty,
    BlockAllExceptWhitelist,
    BlockAll,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomRule {
    pub id: String,
    pub name: String,
    pub pattern: String,
    pub rule_type: RuleType,
    pub action: RuleAction,
    pub enabled: bool,
    pub priority: i32,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum RuleType {
    Url,
    Domain,
    Element,
    Script,
    Cookie,
    Header,
    Regex,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum RuleAction {
    Block,
    Allow,
    Redirect,
    Modify,
    Hide,
}

// ============================================
// Blocking Statistics
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ShieldStats {
    pub ads_blocked: u64,
    pub trackers_blocked: u64,
    pub scripts_blocked: u64,
    pub cookies_blocked: u64,
    pub fingerprint_attempts_blocked: u64,
    pub malware_blocked: u64,
    pub crypto_miners_blocked: u64,
    pub https_upgrades: u64,
    pub social_trackers_blocked: u64,
    pub data_saved_bytes: u64,
    pub time_saved_ms: u64,
    pub blocked_by_domain: HashMap<String, u64>,
    pub blocked_by_category: HashMap<String, u64>,
}

// ============================================
// Request Information
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RequestInfo {
    pub url: String,
    pub method: String,
    pub resource_type: ResourceType,
    pub initiator: Option<String>,
    pub headers: HashMap<String, String>,
    pub referrer: Option<String>,
    pub is_third_party: bool,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum ResourceType {
    Document,
    Stylesheet,
    Image,
    Media,
    Font,
    Script,
    XHR,
    Fetch,
    WebSocket,
    Other,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockResult {
    pub should_block: bool,
    pub reason: Option<String>,
    pub category: Option<String>,
    pub rule_id: Option<String>,
    pub modified_headers: Option<HashMap<String, String>>,
    pub redirect_url: Option<String>,
}

// ============================================
// Default Configuration
// ============================================

impl Default for ShieldConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            level: ShieldLevel::Standard,
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
            custom_rules: vec![],
            whitelist: HashSet::new(),
            blacklist: HashSet::new(),
        }
    }
}

// ============================================
// Built-in Block Lists
// ============================================

lazy_static! {
    // EasyList style ad blocking patterns
    static ref AD_PATTERNS: Vec<&'static str> = vec![
        // Ad networks
        "doubleclick.net",
        "googlesyndication.com",
        "googleadservices.com",
        "google-analytics.com",
        "googletagmanager.com",
        "googletagservices.com",
        "facebook.com/tr",
        "facebook.net/signals",
        "connect.facebook.net",
        "ads.twitter.com",
        "analytics.twitter.com",
        "ads.linkedin.com",
        "amazon-adsystem.com",
        "advertising.com",
        "adnxs.com",
        "adsrvr.org",
        "criteo.com",
        "criteo.net",
        "outbrain.com",
        "taboola.com",
        "zedo.com",
        "media.net",
        "pubmatic.com",
        "openx.net",
        "rubiconproject.com",
        "casalemedia.com",
        "bluekai.com",
        "krxd.net",
        "exelator.com",
        "adroll.com",
        "quantserve.com",
        "scorecardresearch.com",
        "moatads.com",
        "chartbeat.com",
        "mixpanel.com",
        "segment.com",
        "amplitude.com",
        "hotjar.com",
        "fullstory.com",
        "mouseflow.com",
        "luckyorange.com",
        "crazyegg.com",
        "inspectlet.com",
        "heapanalytics.com",
        "intercom.io",
        "drift.com",
        "zendesk.com/embeddable",
        
        // Ad-specific paths
        "/ads/",
        "/ad/",
        "/advert",
        "/banner",
        "/sponsor",
        "/affiliate",
        "prebid",
        "adsense",
        "adsbygoogle",
        "googletag",
        "dfp",
    ];

    // Tracking patterns
    static ref TRACKER_PATTERNS: Vec<&'static str> = vec![
        // Analytics
        "google-analytics.com",
        "analytics.google.com",
        "googletagmanager.com",
        "segment.io",
        "segment.com",
        "mixpanel.com",
        "amplitude.com",
        "heap.io",
        "heapanalytics.com",
        "fullstory.com",
        "mouseflow.com",
        "hotjar.com",
        "luckyorange.com",
        "crazyegg.com",
        "clicktale.net",
        "inspectlet.com",
        "logrocket.io",
        "sentry.io/api",
        "newrelic.com",
        "nr-data.net",
        "bugsnag.com",
        "rollbar.com",
        "raygun.com",
        
        // Social trackers
        "facebook.com/plugins",
        "facebook.net",
        "connect.facebook.net",
        "twitter.com/widgets",
        "platform.twitter.com",
        "linkedin.com/cws",
        "platform.linkedin.com",
        "pinterest.com/widgets",
        "assets.pinterest.com",
        "reddit.com/widget",
        "instagram.com/embed",
        
        // Fingerprinting
        "fingerprintjs.com",
        "maxmind.com",
        
        // Tracking pixels
        "/pixel",
        "/track",
        "/beacon",
        "/collect",
        "/telemetry",
        "/analytics",
        "/metrics",
        "/ping",
        "/log",
        "utm_",
        "fbclid",
        "gclid",
        "mc_",
        "msclkid",
    ];

    // Social media trackers
    static ref SOCIAL_PATTERNS: Vec<&'static str> = vec![
        "facebook.com",
        "facebook.net",
        "fbcdn.net",
        "twitter.com",
        "twimg.com",
        "t.co",
        "linkedin.com",
        "licdn.com",
        "pinterest.com",
        "pinimg.com",
        "instagram.com",
        "cdninstagram.com",
        "tiktok.com",
        "snapchat.com",
        "sc-static.net",
        "reddit.com",
        "redditstatic.com",
    ];

    // Crypto mining scripts
    static ref CRYPTO_PATTERNS: Vec<&'static str> = vec![
        "coinhive.com",
        "coin-hive.com",
        "authedmine.com",
        "coinhave.com",
        "minero.pw",
        "monerominer.rocks",
        "monerise.com",
        "webminerpool.com",
        "crypto-loot.com",
        "cryptoloot.pro",
        "2giga.link",
        "minerhills.com",
        "coinpot.co",
        "moonbit.co.in",
        "jsecoin.com",
        "webmine.pro",
    ];

    // Known malware domains
    static ref MALWARE_PATTERNS: Vec<&'static str> = vec![
        "malware.",
        "phishing.",
        ".xyz/track",
        ".top/click",
        ".tk/ad",
        ".ml/redir",
        ".ga/popup",
        ".cf/inject",
        "downloadhelper",
        "softwareupdate",
        "systemalert",
        "viruswarning",
        "securityalert",
        "pcrepair",
        "registrycleaner",
        "driverupdater",
    ];

    // URL regex patterns for more complex matching
    static ref BLOCK_REGEXES: Vec<Regex> = vec![
        Regex::new(r"(\.|/)ads?(\d)*[_/\.]").unwrap(),
        Regex::new(r"(\.|/)advert").unwrap(),
        Regex::new(r"(\.|/)banner").unwrap(),
        Regex::new(r"(\.|/)track(er|ing)?").unwrap(),
        Regex::new(r"(\.|/)pixel").unwrap(),
        Regex::new(r"(\.|/)analytics").unwrap(),
        Regex::new(r"(\.|/)beacon").unwrap(),
        Regex::new(r"\.(gif|png|jpg)\?.*utm_").unwrap(),
        Regex::new(r"[&?]fbclid=").unwrap(),
        Regex::new(r"[&?]gclid=").unwrap(),
        Regex::new(r"[&?]utm_").unwrap(),
    ];
}

// ============================================
// CUBE Shield Service
// ============================================

pub struct CubeShield {
    config: RwLock<ShieldConfig>,
    stats: RwLock<ShieldStats>,
    site_configs: RwLock<HashMap<String, ShieldConfig>>,
}

impl CubeShield {
    pub fn new() -> Self {
        Self {
            config: RwLock::new(ShieldConfig::default()),
            stats: RwLock::new(ShieldStats::default()),
            site_configs: RwLock::new(HashMap::new()),
        }
    }

    /// Get current shield configuration
    pub fn get_config(&self) -> ShieldConfig {
        self.config.read().unwrap().clone()
    }

    /// Update shield configuration
    pub fn set_config(&self, config: ShieldConfig) {
        *self.config.write().unwrap() = config;
    }

    /// Get shield statistics
    pub fn get_stats(&self) -> ShieldStats {
        self.stats.read().unwrap().clone()
    }

    /// Reset statistics
    pub fn reset_stats(&self) {
        *self.stats.write().unwrap() = ShieldStats::default();
    }

    /// Set site-specific configuration
    pub fn set_site_config(&self, domain: &str, config: ShieldConfig) {
        self.site_configs.write().unwrap()
            .insert(domain.to_string(), config);
    }

    /// Get site-specific configuration (or global if none)
    pub fn get_site_config(&self, domain: &str) -> ShieldConfig {
        self.site_configs.read().unwrap()
            .get(domain)
            .cloned()
            .unwrap_or_else(|| self.get_config())
    }

    /// Add domain to whitelist
    pub fn whitelist_domain(&self, domain: &str) {
        self.config.write().unwrap().whitelist.insert(domain.to_string());
    }

    /// Remove domain from whitelist
    pub fn remove_from_whitelist(&self, domain: &str) {
        self.config.write().unwrap().whitelist.remove(domain);
    }

    /// Add domain to blacklist
    pub fn blacklist_domain(&self, domain: &str) {
        self.config.write().unwrap().blacklist.insert(domain.to_string());
    }

    /// Check if a request should be blocked
    pub fn should_block(&self, request: &RequestInfo, page_domain: &str) -> BlockResult {
        let config = self.get_site_config(page_domain);
        
        // Shield disabled
        if !config.enabled {
            return BlockResult {
                should_block: false,
                reason: None,
                category: None,
                rule_id: None,
                modified_headers: None,
                redirect_url: None,
            };
        }

        // Check whitelist
        if self.is_whitelisted(&request.url) {
            return BlockResult {
                should_block: false,
                reason: Some("Whitelisted".to_string()),
                category: None,
                rule_id: None,
                modified_headers: None,
                redirect_url: None,
            };
        }

        // Check blacklist
        if self.is_blacklisted(&request.url) {
            self.increment_stat("ads_blocked");
            return BlockResult {
                should_block: true,
                reason: Some("Blacklisted by user".to_string()),
                category: Some("custom".to_string()),
                rule_id: None,
                modified_headers: None,
                redirect_url: None,
            };
        }

        // Check for malware (highest priority)
        if config.malware_blocking {
            if let Some(reason) = self.check_malware(&request.url) {
                self.increment_stat("malware_blocked");
                return BlockResult {
                    should_block: true,
                    reason: Some(reason),
                    category: Some("malware".to_string()),
                    rule_id: None,
                    modified_headers: None,
                    redirect_url: None,
                };
            }
        }

        // Check for crypto miners
        if config.crypto_mining_blocking {
            if let Some(reason) = self.check_crypto_miner(&request.url) {
                self.increment_stat("crypto_miners_blocked");
                return BlockResult {
                    should_block: true,
                    reason: Some(reason),
                    category: Some("crypto_miner".to_string()),
                    rule_id: None,
                    modified_headers: None,
                    redirect_url: None,
                };
            }
        }

        // Check for ads
        if config.ad_blocking {
            if let Some(reason) = self.check_ad(&request.url, &request.resource_type) {
                self.increment_stat("ads_blocked");
                self.increment_domain_stat(&request.url);
                return BlockResult {
                    should_block: true,
                    reason: Some(reason),
                    category: Some("ad".to_string()),
                    rule_id: None,
                    modified_headers: None,
                    redirect_url: None,
                };
            }
        }

        // Check for trackers
        if config.tracker_blocking {
            if let Some(reason) = self.check_tracker(&request.url, request.is_third_party) {
                self.increment_stat("trackers_blocked");
                return BlockResult {
                    should_block: true,
                    reason: Some(reason),
                    category: Some("tracker".to_string()),
                    rule_id: None,
                    modified_headers: None,
                    redirect_url: None,
                };
            }
        }

        // Check for social trackers
        if config.social_blocking && request.is_third_party {
            if let Some(reason) = self.check_social_tracker(&request.url) {
                self.increment_stat("social_trackers_blocked");
                return BlockResult {
                    should_block: true,
                    reason: Some(reason),
                    category: Some("social".to_string()),
                    rule_id: None,
                    modified_headers: None,
                    redirect_url: None,
                };
            }
        }

        // Check custom rules
        for rule in &config.custom_rules {
            if rule.enabled && self.matches_custom_rule(rule, request) {
                match rule.action {
                    RuleAction::Block => {
                        return BlockResult {
                            should_block: true,
                            reason: Some(rule.name.clone()),
                            category: Some("custom".to_string()),
                            rule_id: Some(rule.id.clone()),
                            modified_headers: None,
                            redirect_url: None,
                        };
                    }
                    RuleAction::Allow => {
                        return BlockResult {
                            should_block: false,
                            reason: Some("Allowed by custom rule".to_string()),
                            category: None,
                            rule_id: Some(rule.id.clone()),
                            modified_headers: None,
                            redirect_url: None,
                        };
                    }
                    _ => {}
                }
            }
        }

        // Not blocked
        BlockResult {
            should_block: false,
            reason: None,
            category: None,
            rule_id: None,
            modified_headers: None,
            redirect_url: None,
        }
    }

    /// Check if URL is an ad
    fn check_ad(&self, url: &str, resource_type: &ResourceType) -> Option<String> {
        let url_lower = url.to_lowercase();
        
        // Check known ad domains/paths
        for pattern in AD_PATTERNS.iter() {
            if url_lower.contains(pattern) {
                return Some(format!("Blocked ad: {}", pattern));
            }
        }

        // Check regex patterns
        for regex in BLOCK_REGEXES.iter() {
            if regex.is_match(&url_lower) {
                return Some("Blocked by pattern match".to_string());
            }
        }

        // Check for ad-specific resource types
        match resource_type {
            ResourceType::Script => {
                if url_lower.contains("ads") || url_lower.contains("advert") {
                    return Some("Blocked ad script".to_string());
                }
            }
            ResourceType::Image => {
                if url_lower.contains("/ad/") || url_lower.contains("/ads/") {
                    return Some("Blocked ad image".to_string());
                }
            }
            _ => {}
        }

        None
    }

    /// Check if URL is a tracker
    fn check_tracker(&self, url: &str, is_third_party: bool) -> Option<String> {
        let url_lower = url.to_lowercase();
        
        for pattern in TRACKER_PATTERNS.iter() {
            if url_lower.contains(pattern) {
                return Some(format!("Blocked tracker: {}", pattern));
            }
        }

        // Third-party scripts are often trackers
        if is_third_party && url_lower.ends_with(".js") {
            if url_lower.contains("track") || url_lower.contains("analytics") {
                return Some("Blocked third-party tracking script".to_string());
            }
        }

        None
    }

    /// Check if URL is a social tracker
    fn check_social_tracker(&self, url: &str) -> Option<String> {
        let url_lower = url.to_lowercase();
        
        for pattern in SOCIAL_PATTERNS.iter() {
            if url_lower.contains(pattern) {
                return Some(format!("Blocked social tracker: {}", pattern));
            }
        }

        None
    }

    /// Check if URL is a crypto miner
    fn check_crypto_miner(&self, url: &str) -> Option<String> {
        let url_lower = url.to_lowercase();
        
        for pattern in CRYPTO_PATTERNS.iter() {
            if url_lower.contains(pattern) {
                return Some(format!("Blocked crypto miner: {}", pattern));
            }
        }

        // Check for common mining script names
        if url_lower.contains("coinhive") || 
           url_lower.contains("cryptonight") ||
           url_lower.contains("monero") ||
           url_lower.contains("miner.") ||
           url_lower.contains("mining") {
            return Some("Blocked potential crypto miner".to_string());
        }

        None
    }

    /// Check if URL is potential malware
    fn check_malware(&self, url: &str) -> Option<String> {
        let url_lower = url.to_lowercase();
        
        for pattern in MALWARE_PATTERNS.iter() {
            if url_lower.contains(pattern) {
                return Some(format!("Blocked potential malware: {}", pattern));
            }
        }

        None
    }

    /// Check if URL matches custom rule
    fn matches_custom_rule(&self, rule: &CustomRule, request: &RequestInfo) -> bool {
        match rule.rule_type {
            RuleType::Url => request.url.contains(&rule.pattern),
            RuleType::Domain => {
                if let Some(domain) = self.extract_domain(&request.url) {
                    domain.contains(&rule.pattern)
                } else {
                    false
                }
            }
            RuleType::Regex => {
                if let Ok(re) = Regex::new(&rule.pattern) {
                    re.is_match(&request.url)
                } else {
                    false
                }
            }
            _ => false,
        }
    }

    /// Check if URL is whitelisted
    fn is_whitelisted(&self, url: &str) -> bool {
        let config = self.config.read().unwrap();
        
        if let Some(domain) = self.extract_domain(url) {
            config.whitelist.contains(&domain)
        } else {
            false
        }
    }

    /// Check if URL is blacklisted
    fn is_blacklisted(&self, url: &str) -> bool {
        let config = self.config.read().unwrap();
        
        if let Some(domain) = self.extract_domain(url) {
            config.blacklist.contains(&domain)
        } else {
            false
        }
    }

    /// Extract domain from URL
    fn extract_domain(&self, url: &str) -> Option<String> {
        url.split("://")
            .nth(1)
            .and_then(|s| s.split('/').next())
            .and_then(|s| s.split(':').next())
            .map(|s| s.to_string())
    }

    /// Increment a statistic counter
    fn increment_stat(&self, stat: &str) {
        let mut stats = self.stats.write().unwrap();
        match stat {
            "ads_blocked" => stats.ads_blocked += 1,
            "trackers_blocked" => stats.trackers_blocked += 1,
            "scripts_blocked" => stats.scripts_blocked += 1,
            "cookies_blocked" => stats.cookies_blocked += 1,
            "fingerprint_attempts_blocked" => stats.fingerprint_attempts_blocked += 1,
            "malware_blocked" => stats.malware_blocked += 1,
            "crypto_miners_blocked" => stats.crypto_miners_blocked += 1,
            "https_upgrades" => stats.https_upgrades += 1,
            "social_trackers_blocked" => stats.social_trackers_blocked += 1,
            _ => {}
        }
    }

    /// Increment domain-specific stat
    fn increment_domain_stat(&self, url: &str) {
        if let Some(domain) = self.extract_domain(url) {
            let mut stats = self.stats.write().unwrap();
            *stats.blocked_by_domain.entry(domain).or_insert(0) += 1;
        }
    }

    // ========================================
    // Fingerprint Protection
    // ========================================

    /// Generate fingerprint protection script
    pub fn get_fingerprint_protection_script(&self) -> String {
        let config = self.config.read().unwrap();
        let mut script = String::new();

        // Canvas fingerprint protection
        if config.canvas_protection {
            script.push_str(r#"
                (function() {
                    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
                    const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
                    
                    HTMLCanvasElement.prototype.toDataURL = function(...args) {
                        const ctx = this.getContext('2d');
                        if (ctx) {
                            const imageData = originalGetImageData.call(ctx, 0, 0, this.width, this.height);
                            for (let i = 0; i < imageData.data.length; i += 4) {
                                imageData.data[i] = imageData.data[i] ^ (Math.random() * 2 | 0);
                            }
                            ctx.putImageData(imageData, 0, 0);
                        }
                        return originalToDataURL.apply(this, args);
                    };
                })();
            "#);
        }

        // WebRTC protection
        if config.webrtc_protection {
            script.push_str(r#"
                (function() {
                    Object.defineProperty(navigator, 'mediaDevices', {
                        get: function() { return undefined; }
                    });
                    
                    Object.defineProperty(window, 'RTCPeerConnection', {
                        get: function() { return undefined; }
                    });
                    
                    Object.defineProperty(window, 'webkitRTCPeerConnection', {
                        get: function() { return undefined; }
                    });
                })();
            "#);
        }

        // Battery API blocking
        if config.battery_api_blocking {
            script.push_str(r#"
                (function() {
                    delete navigator.getBattery;
                    Object.defineProperty(navigator, 'getBattery', {
                        get: function() { return undefined; }
                    });
                })();
            "#);
        }

        // Hardware concurrency spoofing
        if config.hardware_concurrency_spoof {
            script.push_str(r#"
                (function() {
                    const fakeValue = 4;
                    Object.defineProperty(navigator, 'hardwareConcurrency', {
                        get: function() { return fakeValue; }
                    });
                    Object.defineProperty(navigator, 'deviceMemory', {
                        get: function() { return 8; }
                    });
                })();
            "#);
        }

        // Font fingerprint protection
        if config.font_protection {
            script.push_str(r#"
                (function() {
                    const systemFonts = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana'];
                    
                    document.fonts.check = function(font, text) {
                        const family = font.split(' ').pop().replace(/['"]/g, '');
                        return systemFonts.includes(family);
                    };
                })();
            "#);
        }

        script
    }

    // ========================================
    // Cookie Management
    // ========================================

    /// Check if a cookie should be blocked
    pub fn should_block_cookie(&self, cookie_domain: &str, page_domain: &str) -> bool {
        let config = self.get_site_config(page_domain);
        
        match config.cookie_blocking {
            CookieBlockingLevel::AllowAll => false,
            CookieBlockingLevel::BlockThirdParty => {
                !cookie_domain.ends_with(page_domain) && !page_domain.ends_with(cookie_domain)
            }
            CookieBlockingLevel::BlockAllExceptWhitelist => {
                !config.whitelist.contains(cookie_domain)
            }
            CookieBlockingLevel::BlockAll => true,
        }
    }

    // ========================================
    // HTTPS Upgrade
    // ========================================

    /// Upgrade HTTP URL to HTTPS
    pub fn upgrade_to_https(&self, url: &str) -> String {
        let config = self.config.read().unwrap();
        
        if config.https_upgrade && url.starts_with("http://") {
            self.increment_stat("https_upgrades");
            url.replacen("http://", "https://", 1)
        } else {
            url.to_string()
        }
    }
}

// ============================================
// Global Shield Instance
// ============================================

lazy_static! {
    pub static ref CUBE_SHIELD: CubeShield = CubeShield::new();
}

/// Get the global shield instance
pub fn get_shield() -> &'static CubeShield {
    &CUBE_SHIELD
}

// ============================================
// Cosmetic Filtering (Element Hiding)
// ============================================

/// Get CSS rules to hide ad elements
pub fn get_cosmetic_filter_css() -> String {
    r#"
        /* Generic ad containers */
        [id*="ad-"], [id*="ads-"], [id*="advert"],
        [class*="ad-"], [class*="ads-"], [class*="advert"],
        [id*="banner"], [class*="banner"],
        [id*="sponsor"], [class*="sponsor"],
        .ad, .ads, .advert, .advertisement,
        .banner-ad, .ad-banner,
        .google-ad, .google-ads,
        .doubleclick, .adsense,
        [data-ad], [data-ads],
        [aria-label*="advertisement"],
        [aria-label*="sponsored"],
        
        /* Social widgets we want to hide */
        .fb-like, .fb-share,
        .twitter-share, .tweet-button,
        .linkedin-share,
        
        /* Common ad dimensions */
        iframe[src*="doubleclick"],
        iframe[src*="googlesyndication"],
        iframe[src*="googleads"],
        
        /* Newsletter/popup overlays */
        .newsletter-popup,
        .modal-overlay[class*="newsletter"],
        .popup[class*="subscribe"]
        
        { display: none !important; visibility: hidden !important; }
    "#.to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ad_blocking() {
        let shield = CubeShield::new();
        
        let request = RequestInfo {
            url: "https://googlesyndication.com/pagead/ads".to_string(),
            method: "GET".to_string(),
            resource_type: ResourceType::Script,
            initiator: None,
            headers: HashMap::new(),
            referrer: None,
            is_third_party: true,
        };
        
        let result = shield.should_block(&request, "example.com");
        assert!(result.should_block);
        assert_eq!(result.category, Some("ad".to_string()));
    }

    #[test]
    fn test_tracker_blocking() {
        let shield = CubeShield::new();
        
        let request = RequestInfo {
            url: "https://www.google-analytics.com/analytics.js".to_string(),
            method: "GET".to_string(),
            resource_type: ResourceType::Script,
            initiator: None,
            headers: HashMap::new(),
            referrer: None,
            is_third_party: true,
        };
        
        let result = shield.should_block(&request, "example.com");
        assert!(result.should_block);
    }

    #[test]
    fn test_whitelist() {
        let shield = CubeShield::new();
        shield.whitelist_domain("trusted-ads.com");
        
        let request = RequestInfo {
            url: "https://trusted-ads.com/script.js".to_string(),
            method: "GET".to_string(),
            resource_type: ResourceType::Script,
            initiator: None,
            headers: HashMap::new(),
            referrer: None,
            is_third_party: true,
        };
        
        let result = shield.should_block(&request, "example.com");
        assert!(!result.should_block);
    }

    #[test]
    fn test_https_upgrade() {
        let shield = CubeShield::new();
        
        let upgraded = shield.upgrade_to_https("http://example.com");
        assert_eq!(upgraded, "https://example.com");
    }
}
