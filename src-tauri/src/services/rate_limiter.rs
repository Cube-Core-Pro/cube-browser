/**
 * Rate Limiter Service
 * 
 * Provides rate limiting and throttling features:
 * - Request delays (fixed and random)
 * - Per-domain rate limiting
 * - Concurrent connection limits
 * - robots.txt respect
 * - Burst protection
 * - Adaptive throttling based on response codes
 */

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use std::time::{Duration, Instant};
use tokio::time::sleep;
use url::Url;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RateLimitConfig {
    pub enabled: bool,
    pub min_delay_ms: u64,
    pub max_delay_ms: u64,
    pub max_concurrent_per_domain: usize,
    pub respect_robots_txt: bool,
    pub burst_limit: u32,
    pub burst_window_seconds: u64,
}

impl Default for RateLimitConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            min_delay_ms: 1000,
            max_delay_ms: 3000,
            max_concurrent_per_domain: 5,
            respect_robots_txt: true,
            burst_limit: 10,
            burst_window_seconds: 60,
        }
    }
}

#[derive(Debug, Clone)]
#[derive(Default)]
struct DomainStats {
    active_connections: usize,
    request_times: Vec<Instant>,
    crawl_delay_ms: Option<u64>,
    last_request: Option<Instant>,
}


pub struct RateLimiterService {
    config: Arc<RwLock<RateLimitConfig>>,
    domain_stats: Arc<RwLock<HashMap<String, DomainStats>>>,
    robots_cache: Arc<RwLock<HashMap<String, RobotsTxt>>>,
    client: reqwest::Client,
}

#[derive(Debug, Clone)]
struct RobotsTxt {
    crawl_delay: Option<u64>,
    disallowed_paths: Vec<String>,
    fetched_at: Instant,
}

impl RateLimiterService {
    pub fn new() -> Self {
        Self {
            config: Arc::new(RwLock::new(RateLimitConfig::default())),
            domain_stats: Arc::new(RwLock::new(HashMap::new())),
            robots_cache: Arc::new(RwLock::new(HashMap::new())),
            client: reqwest::Client::new(),
        }
    }

    /// Set rate limit configuration
    pub fn set_config(&self, config: RateLimitConfig) -> Result<(), String> {
        let mut cfg = self.config.write()
            .map_err(|e| format!("Failed to acquire config lock: {}", e))?;
        *cfg = config;
        Ok(())
    }

    /// Get current configuration
    pub fn get_config(&self) -> Result<RateLimitConfig, String> {
        let cfg = self.config.read()
            .map_err(|e| format!("Failed to acquire config lock: {}", e))?;
        Ok(cfg.clone())
    }

    /// Wait before making a request (applies rate limiting)
    pub async fn wait_before_request(&self, url: &str) -> Result<(), String> {
        let config = self.get_config()?;
        
        if !config.enabled {
            return Ok(());
        }

        let domain = Self::extract_domain(url)?;

        // Check robots.txt if enabled
        if config.respect_robots_txt {
            self.check_robots_txt(&domain, url).await?;
        }

        // Wait for available connection slot
        self.wait_for_connection_slot(&domain).await?;

        // Check burst limit
        self.check_burst_limit(&domain)?;

        // Apply delay
        self.apply_delay(&domain).await?;

        // Update stats
        self.record_request_start(&domain)?;

        Ok(())
    }

    /// Notify completion of request
    pub fn request_completed(&self, url: &str, status_code: u16) -> Result<(), String> {
        let domain = Self::extract_domain(url)?;

        let mut stats = self.domain_stats.write()
            .map_err(|e| format!("Failed to acquire stats lock: {}", e))?;

        if let Some(domain_stats) = stats.get_mut(&domain) {
            if domain_stats.active_connections > 0 {
                domain_stats.active_connections -= 1;
            }

            // Adaptive throttling based on status code
            if status_code == 429 || status_code == 503 {
                // Too Many Requests or Service Unavailable
                domain_stats.crawl_delay_ms = Some(
                    domain_stats.crawl_delay_ms.unwrap_or(1000) * 2
                );
            }
        }

        Ok(())
    }

    /// Wait for available connection slot for domain
    async fn wait_for_connection_slot(&self, domain: &str) -> Result<(), String> {
        let config = self.get_config()?;
        let max_attempts = 60; // Wait up to 60 seconds

        for _ in 0..max_attempts {
            {
                let stats = self.domain_stats.read()
                    .map_err(|e| format!("Failed to acquire stats lock: {}", e))?;

                if let Some(domain_stats) = stats.get(domain) {
                    if domain_stats.active_connections < config.max_concurrent_per_domain {
                        return Ok(());
                    }
                } else {
                    return Ok(()); // First request to this domain
                }
            }

            sleep(Duration::from_secs(1)).await;
        }

        Err(format!("Timeout waiting for connection slot for {}", domain))
    }

    /// Check burst limit
    fn check_burst_limit(&self, domain: &str) -> Result<(), String> {
        let config = self.get_config()?;
        let mut stats = self.domain_stats.write()
            .map_err(|e| format!("Failed to acquire stats lock: {}", e))?;

        let domain_stats = stats.entry(domain.to_string())
            .or_insert_with(DomainStats::default);

        let cutoff = Instant::now() - Duration::from_secs(config.burst_window_seconds);
        
        // Remove old requests
        domain_stats.request_times.retain(|&time| time > cutoff);

        // Check if burst limit exceeded
        if domain_stats.request_times.len() >= config.burst_limit as usize {
            return Err(format!(
                "Burst limit exceeded for {}: {} requests in {} seconds",
                domain, config.burst_limit, config.burst_window_seconds
            ));
        }

        Ok(())
    }

    /// Apply delay based on configuration and domain stats
    async fn apply_delay(&self, domain: &str) -> Result<(), String> {
        let config = self.get_config()?;
        
        // Get delay_ms before any await to avoid holding lock across await
        let delay_ms = {
            let stats = self.domain_stats.read()
                .map_err(|e| format!("Failed to acquire stats lock: {}", e))?;

            if let Some(domain_stats) = stats.get(domain) {
                // Use crawl-delay from robots.txt if available
                if let Some(crawl_delay) = domain_stats.crawl_delay_ms {
                    crawl_delay
                } else {
                    // Random delay between min and max
                    let mut rng = rand::thread_rng();
                    use rand::Rng;
                    rng.gen_range(config.min_delay_ms..=config.max_delay_ms)
                }
            } else {
                config.min_delay_ms
            }
        }; // RwLock guard dropped here

        sleep(Duration::from_millis(delay_ms)).await;
        Ok(())
    }

    /// Record request start
    fn record_request_start(&self, domain: &str) -> Result<(), String> {
        let mut stats = self.domain_stats.write()
            .map_err(|e| format!("Failed to acquire stats lock: {}", e))?;

        let domain_stats = stats.entry(domain.to_string())
            .or_insert_with(DomainStats::default);

        domain_stats.active_connections += 1;
        domain_stats.request_times.push(Instant::now());
        domain_stats.last_request = Some(Instant::now());

        Ok(())
    }

    /// Fetch and parse robots.txt
    async fn check_robots_txt(&self, domain: &str, url: &str) -> Result<(), String> {
        // Check cache first
        {
            let cache = self.robots_cache.read()
                .map_err(|e| format!("Failed to acquire cache lock: {}", e))?;

            if let Some(robots) = cache.get(domain) {
                // Cache valid for 1 hour
                if robots.fetched_at.elapsed() < Duration::from_secs(3600) {
                    return self.validate_against_robots(robots, url);
                }
            }
        }

        // Fetch robots.txt
        let robots_url = format!("https://{}/robots.txt", domain);
        
        match self.client.get(&robots_url).send().await {
            Ok(response) => {
                if response.status().is_success() {
                    let text = response.text().await.unwrap_or_default();
                    let robots = self.parse_robots_txt(&text);
                    
                    // Update cache
                    let mut cache = self.robots_cache.write()
                        .map_err(|e| format!("Failed to acquire cache lock: {}", e))?;
                    cache.insert(domain.to_string(), robots.clone());
                    
                    // Update domain stats with crawl-delay
                    if let Some(delay) = robots.crawl_delay {
                        let mut stats = self.domain_stats.write()
                            .map_err(|e| format!("Failed to acquire stats lock: {}", e))?;
                        stats.entry(domain.to_string())
                            .or_insert_with(DomainStats::default)
                            .crawl_delay_ms = Some(delay * 1000); // Convert to ms
                    }
                    
                    self.validate_against_robots(&robots, url)
                } else {
                    Ok(()) // No robots.txt, allow all
                }
            }
            Err(_) => Ok(()), // Failed to fetch, allow request
        }
    }

    /// Parse robots.txt content
    fn parse_robots_txt(&self, content: &str) -> RobotsTxt {
        let mut crawl_delay = None;
        let mut disallowed_paths = Vec::new();
        let mut user_agent_match = false;

        for line in content.lines() {
            let line = line.trim();
            
            if line.starts_with("User-agent:") {
                let agent = line["User-agent:".len()..].trim();
                user_agent_match = agent == "*" || agent.to_lowercase().contains("cube");
            }
            
            if user_agent_match {
                if line.starts_with("Disallow:") {
                    let path = line["Disallow:".len()..].trim();
                    if !path.is_empty() {
                        disallowed_paths.push(path.to_string());
                    }
                } else if line.starts_with("Crawl-delay:") {
                    if let Ok(delay) = line["Crawl-delay:".len()..].trim().parse::<u64>() {
                        crawl_delay = Some(delay);
                    }
                }
            }
        }

        RobotsTxt {
            crawl_delay,
            disallowed_paths,
            fetched_at: Instant::now(),
        }
    }

    /// Validate URL against robots.txt rules
    fn validate_against_robots(&self, robots: &RobotsTxt, url: &str) -> Result<(), String> {
        let parsed_url = Url::parse(url)
            .map_err(|e| format!("Invalid URL: {}", e))?;
        
        let path = parsed_url.path();
        
        for disallowed in &robots.disallowed_paths {
            if path.starts_with(disallowed) {
                return Err(format!("Path blocked by robots.txt: {}", path));
            }
        }
        
        Ok(())
    }

    /// Extract domain from URL
    fn extract_domain(url: &str) -> Result<String, String> {
        let parsed = Url::parse(url)
            .map_err(|e| format!("Invalid URL: {}", e))?;
        
        parsed.host_str()
            .map(|h| h.to_string())
            .ok_or_else(|| "No host in URL".to_string())
    }

    /// Get statistics for a domain
    pub fn get_domain_stats(&self, domain: String) -> Result<Option<(usize, usize, Option<u64>)>, String> {
        let stats = self.domain_stats.read()
            .map_err(|e| format!("Failed to acquire stats lock: {}", e))?;

        Ok(stats.get(&domain).map(|s| {
            (s.active_connections, s.request_times.len(), s.crawl_delay_ms)
        }))
    }

    /// Clear all statistics
    pub fn clear_stats(&self) -> Result<(), String> {
        let mut stats = self.domain_stats.write()
            .map_err(|e| format!("Failed to acquire stats lock: {}", e))?;
        stats.clear();
        Ok(())
    }
}
