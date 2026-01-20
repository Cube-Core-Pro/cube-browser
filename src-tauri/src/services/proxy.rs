/**
 * Proxy Management Service
 * 
 * Provides proxy rotation and management:
 * - Proxy pool with health monitoring
 * - Multiple rotation strategies (RoundRobin, Random, LeastUsed)
 * - Health checks (ping, speed test)
 * - Support for HTTP, HTTPS, SOCKS5 proxies
 * - Residential and datacenter proxy support
 * - Automatic failover on proxy failure
 */

use serde::{Deserialize, Serialize};
use std::sync::{Arc, RwLock};
use std::collections::HashMap;
use std::time::{Duration, Instant};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxyConfig {
    pub url: String,
    pub proxy_type: ProxyType,
    pub username: Option<String>,
    pub password: Option<String>,
    pub enabled: bool,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum ProxyType {
    Http,
    Https,
    Socks5,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum RotationStrategy {
    RoundRobin,
    Random,
    LeastUsed,
    FastestFirst,
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

struct ProxyEntry {
    config: ProxyConfig,
    stats: ProxyStats,
    last_check: Option<Instant>,
}

pub struct ProxyService {
    proxies: Arc<RwLock<HashMap<String, ProxyEntry>>>,
    strategy: Arc<RwLock<RotationStrategy>>,
    current_index: Arc<RwLock<usize>>,
    client: reqwest::Client,
}

impl ProxyService {
    pub fn new() -> Self {
        Self {
            proxies: Arc::new(RwLock::new(HashMap::new())),
            strategy: Arc::new(RwLock::new(RotationStrategy::RoundRobin)),
            current_index: Arc::new(RwLock::new(0)),
            client: reqwest::Client::builder()
                .timeout(Duration::from_secs(10))
                .build()
                .unwrap(),
        }
    }

    /// Add a proxy to the pool
    pub fn add_proxy(&self, config: ProxyConfig) -> Result<(), String> {
        let mut proxies = self.proxies.write()
            .map_err(|e| format!("Failed to acquire proxies lock: {}", e))?;

        let entry = ProxyEntry {
            config: config.clone(),
            stats: ProxyStats {
                total_requests: 0,
                failed_requests: 0,
                avg_response_time_ms: 0,
                last_used: None,
                last_success: None,
                last_failure: None,
                is_healthy: true,
            },
            last_check: None,
        };

        proxies.insert(config.url.clone(), entry);
        Ok(())
    }

    /// Remove a proxy from the pool
    pub fn remove_proxy(&self, url: String) -> Result<(), String> {
        let mut proxies = self.proxies.write()
            .map_err(|e| format!("Failed to acquire proxies lock: {}", e))?;

        if proxies.remove(&url).is_none() {
            return Err(format!("Proxy not found: {}", url));
        }

        Ok(())
    }

    /// Get all proxies with their stats
    pub fn list_proxies(&self) -> Result<Vec<(ProxyConfig, ProxyStats)>, String> {
        let proxies = self.proxies.read()
            .map_err(|e| format!("Failed to acquire proxies lock: {}", e))?;

        let result = proxies.values()
            .map(|entry| (entry.config.clone(), entry.stats.clone()))
            .collect();

        Ok(result)
    }

    /// Set rotation strategy
    pub fn set_strategy(&self, strategy: RotationStrategy) -> Result<(), String> {
        let mut strat = self.strategy.write()
            .map_err(|e| format!("Failed to acquire strategy lock: {}", e))?;
        *strat = strategy;
        Ok(())
    }

    /// Get next proxy based on rotation strategy
    pub fn get_next_proxy(&self) -> Result<ProxyConfig, String> {
        let proxies = self.proxies.read()
            .map_err(|e| format!("Failed to acquire proxies lock: {}", e))?;

        if proxies.is_empty() {
            return Err("No proxies available".to_string());
        }

        // Filter enabled and healthy proxies
        let available: Vec<&ProxyEntry> = proxies.values()
            .filter(|p| p.config.enabled && p.stats.is_healthy)
            .collect();

        if available.is_empty() {
            return Err("No healthy proxies available".to_string());
        }

        let strategy = self.strategy.read()
            .map_err(|e| format!("Failed to acquire strategy lock: {}", e))?;

        let selected = match *strategy {
            RotationStrategy::RoundRobin => {
                let mut index = self.current_index.write()
                    .map_err(|e| format!("Failed to acquire index lock: {}", e))?;
                let proxy = &available[*index % available.len()];
                *index += 1;
                proxy
            }
            RotationStrategy::Random => {
                let mut rng = rand::thread_rng();
                use rand::Rng;
                let idx = rng.gen_range(0..available.len());
                &available[idx]
            }
            RotationStrategy::LeastUsed => {
                available.iter()
                    .min_by_key(|p| p.stats.total_requests)
                    .unwrap()
            }
            RotationStrategy::FastestFirst => {
                available.iter()
                    .min_by_key(|p| p.stats.avg_response_time_ms)
                    .unwrap()
            }
        };

        Ok(selected.config.clone())
    }

    /// Check proxy health
    pub async fn check_proxy_health(&self, url: String) -> Result<bool, String> {
        let test_url = "https://www.google.com";
        
        // Build proxy URL with auth if needed
        let proxy_config = {
            let proxies = self.proxies.read()
                .map_err(|e| format!("Failed to acquire proxies lock: {}", e))?;
            
            proxies.get(&url)
                .ok_or_else(|| format!("Proxy not found: {}", url))?
                .config.clone()
        };

        let proxy_url = if let (Some(user), Some(pass)) = (proxy_config.username, proxy_config.password) {
            format!("{}://{}:{}@{}", 
                match proxy_config.proxy_type {
                    ProxyType::Http => "http",
                    ProxyType::Https => "https",
                    ProxyType::Socks5 => "socks5",
                },
                user, pass, url
            )
        } else {
            url.clone()
        };

        // Create client with proxy
        let proxy = reqwest::Proxy::all(&proxy_url)
            .map_err(|e| format!("Invalid proxy URL: {}", e))?;

        let client = reqwest::Client::builder()
            .proxy(proxy)
            .timeout(Duration::from_secs(10))
            .build()
            .map_err(|e| format!("Failed to build client: {}", e))?;

        // Test request
        let start = Instant::now();
        let result = client.get(test_url).send().await;
        let duration = start.elapsed();

        let is_healthy = result.is_ok();

        // Update stats
        let mut proxies = self.proxies.write()
            .map_err(|e| format!("Failed to acquire proxies lock: {}", e))?;

        if let Some(entry) = proxies.get_mut(&url) {
            entry.stats.is_healthy = is_healthy;
            entry.last_check = Some(Instant::now());
            
            if is_healthy {
                entry.stats.avg_response_time_ms = duration.as_millis() as u64;
                entry.stats.last_success = Some(chrono::Utc::now().to_rfc3339());
            } else {
                entry.stats.last_failure = Some(chrono::Utc::now().to_rfc3339());
            }
        }

        Ok(is_healthy)
    }

    /// Record proxy usage
    pub fn record_usage(&self, url: String, success: bool, response_time_ms: u64) -> Result<(), String> {
        let mut proxies = self.proxies.write()
            .map_err(|e| format!("Failed to acquire proxies lock: {}", e))?;

        if let Some(entry) = proxies.get_mut(&url) {
            entry.stats.total_requests += 1;
            if !success {
                entry.stats.failed_requests += 1;
            }
            
            // Update average response time (simple moving average)
            let total = entry.stats.total_requests;
            let old_avg = entry.stats.avg_response_time_ms;
            entry.stats.avg_response_time_ms = ((old_avg * (total - 1)) + response_time_ms) / total;
            
            entry.stats.last_used = Some(chrono::Utc::now().to_rfc3339());
            
            if success {
                entry.stats.last_success = Some(chrono::Utc::now().to_rfc3339());
            } else {
                entry.stats.last_failure = Some(chrono::Utc::now().to_rfc3339());
            }

            // Mark as unhealthy if failure rate is high
            let failure_rate = entry.stats.failed_requests as f64 / entry.stats.total_requests as f64;
            if failure_rate > 0.5 && entry.stats.total_requests > 5 {
                entry.stats.is_healthy = false;
            }
        }

        Ok(())
    }

    /// Enable/disable a proxy
    pub fn toggle_proxy(&self, url: String, enabled: bool) -> Result<(), String> {
        let mut proxies = self.proxies.write()
            .map_err(|e| format!("Failed to acquire proxies lock: {}", e))?;

        if let Some(entry) = proxies.get_mut(&url) {
            entry.config.enabled = enabled;
            Ok(())
        } else {
            Err(format!("Proxy not found: {}", url))
        }
    }

    /// Clear all proxies
    pub fn clear_all(&self) -> Result<(), String> {
        let mut proxies = self.proxies.write()
            .map_err(|e| format!("Failed to acquire proxies lock: {}", e))?;
        proxies.clear();
        Ok(())
    }

    /// Get proxy statistics
    pub fn get_proxy_stats(&self, url: String) -> Result<ProxyStats, String> {
        let proxies = self.proxies.read()
            .map_err(|e| format!("Failed to acquire proxies lock: {}", e))?;

        proxies.get(&url)
            .map(|entry| entry.stats.clone())
            .ok_or_else(|| format!("Proxy not found: {}", url))
    }
}
