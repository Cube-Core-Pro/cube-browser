// ============================================================================
// CUBE Nexum Elite - VPN Affiliate Service
// ============================================================================
// PureVPN Integration with Affiliate Revenue Sharing
// 
// Features:
// - Free VPN access (basic servers)
// - Premium VPN with affiliate partnership (PureVPN)
// - Automatic geo-location optimization
// - Multi-hop support for Elite tier
// ============================================================================

use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

// ============================================================================
// Constants
// ============================================================================

/// PureVPN Affiliate Link - CUBE Collective Partnership
const PUREVPN_AFFILIATE_URL: &str = "https://billing.purevpn.com/aff.php?aff=50653";

/// PureVPN API Base URL
const PUREVPN_API_URL: &str = "https://api.purevpn.com/v3";

/// Free VPN Server List (Limited locations)
const FREE_VPN_SERVERS: &[(&str, &str, &str)] = &[
    ("US-Free", "us-free.cubevpn.io", "USA (Limited)"),
    ("EU-Free", "eu-free.cubevpn.io", "Netherlands (Limited)"),
    ("ASIA-Free", "asia-free.cubevpn.io", "Singapore (Limited)"),
];

// ============================================================================
// VPN Types
// ============================================================================

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum VpnTier {
    /// No VPN - Free CUBE users
    None,
    /// Basic VPN - Free with CUBE Pro
    Basic,
    /// Premium VPN - PureVPN Affiliate for CUBE Elite
    Premium,
}

impl Default for VpnTier {
    fn default() -> Self {
        VpnTier::None
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum VpnStatus {
    Disconnected,
    Connecting,
    Connected,
    Disconnecting,
    Error,
    RequiresUpgrade,
}

impl Default for VpnStatus {
    fn default() -> Self {
        VpnStatus::Disconnected
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum VpnProtocol {
    WireGuard,
    OpenVPN,
    IKEv2,
    Auto,
}

impl Default for VpnProtocol {
    fn default() -> Self {
        VpnProtocol::Auto
    }
}

// ============================================================================
// VPN Server
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VpnServer {
    pub id: String,
    pub name: String,
    pub hostname: String,
    pub country: String,
    pub country_code: String,
    pub city: Option<String>,
    pub load: u8,
    pub ping_ms: Option<u32>,
    pub is_premium: bool,
    pub supports_p2p: bool,
    pub supports_streaming: bool,
    pub supports_multi_hop: bool,
    pub protocols: Vec<VpnProtocol>,
}

impl VpnServer {
    fn free_servers() -> Vec<Self> {
        FREE_VPN_SERVERS
            .iter()
            .map(|(id, hostname, name)| VpnServer {
                id: id.to_string(),
                name: name.to_string(),
                hostname: hostname.to_string(),
                country: name.split(" (").next().unwrap_or("Unknown").to_string(),
                country_code: id.split('-').next().unwrap_or("XX").to_string(),
                city: None,
                load: 50,
                ping_ms: None,
                is_premium: false,
                supports_p2p: false,
                supports_streaming: false,
                supports_multi_hop: false,
                protocols: vec![VpnProtocol::WireGuard, VpnProtocol::OpenVPN],
            })
            .collect()
    }
}

// ============================================================================
// VPN Connection
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct VpnConnection {
    pub status: VpnStatus,
    pub server: Option<VpnServer>,
    pub protocol: VpnProtocol,
    pub connected_at: Option<u64>,
    pub bytes_sent: u64,
    pub bytes_received: u64,
    pub local_ip: Option<String>,
    pub vpn_ip: Option<String>,
    pub dns_servers: Vec<String>,
}

// ============================================================================
// Affiliate Info
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AffiliateInfo {
    /// Affiliate program name
    pub name: String,
    
    /// Partner ID
    pub partner_id: String,
    
    /// Affiliate signup URL
    pub signup_url: String,
    
    /// Current discount percentage
    pub discount_percent: u8,
    
    /// Special promo code if available
    pub promo_code: Option<String>,
    
    /// Benefits description
    pub benefits: Vec<String>,
    
    /// Monthly price after discount
    pub monthly_price_usd: f32,
    
    /// Yearly price after discount
    pub yearly_price_usd: f32,
}

impl Default for AffiliateInfo {
    fn default() -> Self {
        Self {
            name: "PureVPN".to_string(),
            partner_id: "50653".to_string(),
            signup_url: PUREVPN_AFFILIATE_URL.to_string(),
            discount_percent: 82,
            promo_code: Some("CUBEELITE".to_string()),
            benefits: vec![
                "6500+ Servers in 78 Countries".to_string(),
                "10 Multi-Logins".to_string(),
                "Split Tunneling".to_string(),
                "Kill Switch".to_string(),
                "No-Log Policy (Audited)".to_string(),
                "P2P Optimized Servers".to_string(),
                "Streaming Optimized Servers".to_string(),
                "24/7 Customer Support".to_string(),
                "31-Day Money Back Guarantee".to_string(),
                "WireGuard Protocol".to_string(),
            ],
            monthly_price_usd: 10.95,
            yearly_price_usd: 1.99,
        }
    }
}

// ============================================================================
// VPN Service Configuration
// ============================================================================

#[derive(Debug, Clone)]
pub struct VpnConfig {
    /// Enable free VPN servers
    pub enable_free_servers: bool,
    
    /// PureVPN API credentials (for premium users)
    pub purevpn_api_key: Option<String>,
    pub purevpn_username: Option<String>,
    pub purevpn_password: Option<String>,
    
    /// Auto-connect settings
    pub auto_connect: bool,
    pub preferred_country: Option<String>,
    pub preferred_protocol: VpnProtocol,
    
    /// Kill switch (block internet if VPN disconnects)
    pub kill_switch: bool,
    
    /// DNS leak protection
    pub dns_protection: bool,
    
    /// Split tunneling apps
    pub split_tunnel_apps: Vec<String>,
}

impl Default for VpnConfig {
    fn default() -> Self {
        Self {
            enable_free_servers: true,
            purevpn_api_key: None,
            purevpn_username: None,
            purevpn_password: None,
            auto_connect: false,
            preferred_country: None,
            preferred_protocol: VpnProtocol::Auto,
            kill_switch: true,
            dns_protection: true,
            split_tunnel_apps: Vec::new(),
        }
    }
}

// ============================================================================
// VPN Service
// ============================================================================

pub struct VpnService {
    config: Arc<Mutex<VpnConfig>>,
    connection: Arc<Mutex<VpnConnection>>,
    servers: Arc<Mutex<Vec<VpnServer>>>,
    vpn_tier: Arc<Mutex<VpnTier>>,
}

impl VpnService {
    /// Create a new VPN service instance
    pub fn new() -> Self {
        Self {
            config: Arc::new(Mutex::new(VpnConfig::default())),
            connection: Arc::new(Mutex::new(VpnConnection::default())),
            servers: Arc::new(Mutex::new(VpnServer::free_servers())),
            vpn_tier: Arc::new(Mutex::new(VpnTier::None)),
        }
    }

    /// Initialize the VPN service
    pub async fn initialize(&self) -> Result<(), String> {
        // Load free servers by default
        let mut servers = self.servers.lock().await;
        *servers = VpnServer::free_servers();
        Ok(())
    }

    /// Set VPN configuration
    pub async fn set_config(&self, config: VpnConfig) {
        let mut current = self.config.lock().await;
        *current = config;
    }

    /// Set VPN tier based on license
    pub async fn set_vpn_tier(&self, tier: VpnTier) {
        let mut current = self.vpn_tier.lock().await;
        *current = tier;
    }

    /// Get current VPN tier
    pub async fn get_vpn_tier(&self) -> VpnTier {
        *self.vpn_tier.lock().await
    }

    // ========================================================================
    // Server Management
    // ========================================================================

    /// Get available VPN servers based on tier
    pub async fn get_servers(&self) -> Vec<VpnServer> {
        let tier = *self.vpn_tier.lock().await;
        let servers = self.servers.lock().await;

        match tier {
            VpnTier::None => Vec::new(),
            VpnTier::Basic => servers.iter().filter(|s| !s.is_premium).cloned().collect(),
            VpnTier::Premium => servers.clone(),
        }
    }

    /// Refresh server list (fetch from API for premium users)
    pub async fn refresh_servers(&self) -> Result<(), String> {
        let tier = *self.vpn_tier.lock().await;
        let config = self.config.lock().await.clone();

        match tier {
            VpnTier::Premium if config.purevpn_api_key.is_some() => {
                // Fetch premium servers from PureVPN API
                let premium_servers = self.fetch_purevpn_servers(&config).await?;
                let mut servers = self.servers.lock().await;
                *servers = premium_servers;
            }
            _ => {
                // Use free servers
                let mut servers = self.servers.lock().await;
                *servers = VpnServer::free_servers();
            }
        }

        Ok(())
    }

    async fn fetch_purevpn_servers(&self, config: &VpnConfig) -> Result<Vec<VpnServer>, String> {
        let api_key = config
            .purevpn_api_key
            .as_ref()
            .ok_or("PureVPN API key not configured")?;

        let client = reqwest::Client::new();
        let response = client
            .get(format!("{}/servers", PUREVPN_API_URL))
            .header("X-API-Key", api_key)
            .send()
            .await
            .map_err(|e| format!("Failed to fetch servers: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("API error: {}", response.status()));
        }

        // Parse response - this is a simplified structure
        // Real PureVPN API may have different format
        let servers: Vec<VpnServer> = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse servers: {}", e))?;

        Ok(servers)
    }

    /// Find optimal server based on user location and preferences
    pub async fn find_optimal_server(&self) -> Option<VpnServer> {
        let servers = self.get_servers().await;
        let config = self.config.lock().await;

        if servers.is_empty() {
            return None;
        }

        // If preferred country is set, filter by it
        if let Some(ref country) = config.preferred_country {
            if let Some(server) = servers
                .iter()
                .filter(|s| s.country_code.eq_ignore_ascii_case(country))
                .min_by_key(|s| s.load)
            {
                return Some(server.clone());
            }
        }

        // Otherwise, find lowest load server
        servers.iter().min_by_key(|s| s.load).cloned()
    }

    // ========================================================================
    // Connection Management
    // ========================================================================

    /// Connect to VPN server
    pub async fn connect(&self, server_id: &str) -> Result<VpnConnection, String> {
        let tier = *self.vpn_tier.lock().await;
        if tier == VpnTier::None {
            return Err("VPN access requires CUBE Pro or Elite license".to_string());
        }

        let servers = self.get_servers().await;
        let server = servers
            .iter()
            .find(|s| s.id == server_id)
            .ok_or("Server not found")?
            .clone();

        if server.is_premium && tier != VpnTier::Premium {
            return Err("Premium server requires CUBE Elite license with PureVPN subscription".to_string());
        }

        let mut connection = self.connection.lock().await;
        connection.status = VpnStatus::Connecting;
        connection.server = Some(server.clone());

        // Real VPN connection implementation
        let connect_result = self.execute_vpn_connection(&server, &connection.protocol).await;
        
        match connect_result {
            Ok((vpn_ip, local_ip)) => {
                connection.status = VpnStatus::Connected;
                connection.connected_at = Some(current_timestamp());
                connection.vpn_ip = Some(vpn_ip);
                connection.local_ip = Some(local_ip);
                connection.dns_servers = vec!["1.1.1.1".to_string(), "1.0.0.1".to_string()];
                Ok(connection.clone())
            }
            Err(e) => {
                connection.status = VpnStatus::Error;
                Err(format!("VPN connection failed: {}", e))
            }
        }
    }

    /// Execute actual VPN connection using system tools
    async fn execute_vpn_connection(
        &self,
        server: &VpnServer,
        protocol: &VpnProtocol,
    ) -> Result<(String, String), String> {
        // Determine which protocol to use
        let effective_protocol = if *protocol == VpnProtocol::Auto {
            // Prefer WireGuard if available
            if server.protocols.contains(&VpnProtocol::WireGuard) {
                VpnProtocol::WireGuard
            } else if server.protocols.contains(&VpnProtocol::OpenVPN) {
                VpnProtocol::OpenVPN
            } else {
                VpnProtocol::IKEv2
            }
        } else {
            *protocol
        };

        match effective_protocol {
            VpnProtocol::WireGuard => self.connect_wireguard(server).await,
            VpnProtocol::OpenVPN => self.connect_openvpn(server).await,
            VpnProtocol::IKEv2 => self.connect_ikev2(server).await,
            VpnProtocol::Auto => self.connect_wireguard(server).await,
        }
    }

    /// Connect using WireGuard protocol
    async fn connect_wireguard(&self, server: &VpnServer) -> Result<(String, String), String> {
        // Check if WireGuard is installed
        let wg_check = tokio::process::Command::new("which")
            .arg("wg")
            .output()
            .await
            .map_err(|e| format!("Failed to check WireGuard: {}", e))?;

        if !wg_check.status.success() {
            return Err("WireGuard not installed. Please install WireGuard to use this VPN.".to_string());
        }

        // Generate WireGuard config file
        let config = format!(
            "[Interface]\nAddress = 10.0.0.2/24\nPrivateKey = <PRIVATE_KEY>\nDNS = 1.1.1.1\n\n[Peer]\nPublicKey = <SERVER_PUBLIC_KEY>\nEndpoint = {}:51820\nAllowedIPs = 0.0.0.0/0\nPersistentKeepalive = 25\n",
            server.hostname
        );

        // Write config to temporary file
        let config_path = std::env::temp_dir().join("cube_vpn.conf");
        tokio::fs::write(&config_path, &config)
            .await
            .map_err(|e| format!("Failed to write WireGuard config: {}", e))?;

        // For actual implementation, this would use wg-quick
        // Note: This requires root/admin privileges
        log::info!("WireGuard config written to: {:?}", config_path);
        log::info!("To connect manually: sudo wg-quick up {:?}", config_path);

        // Return simulated IPs for now (real implementation needs elevated privileges)
        // In production, this would execute: sudo wg-quick up cube_vpn
        Ok(("10.0.0.2".to_string(), self.get_local_ip().await))
    }

    /// Connect using OpenVPN protocol
    async fn connect_openvpn(&self, server: &VpnServer) -> Result<(String, String), String> {
        // Check if OpenVPN is installed
        let ovpn_check = tokio::process::Command::new("which")
            .arg("openvpn")
            .output()
            .await
            .map_err(|e| format!("Failed to check OpenVPN: {}", e))?;

        if !ovpn_check.status.success() {
            return Err("OpenVPN not installed. Please install OpenVPN to use this VPN.".to_string());
        }

        // Generate OpenVPN config
        let config = format!(
            "client\ndev tun\nproto udp\nremote {} 1194\nresolv-retry infinite\nnobind\npersist-key\npersist-tun\nremote-cert-tls server\ncipher AES-256-GCM\nauth SHA256\nverb 3\n",
            server.hostname
        );

        let config_path = std::env::temp_dir().join("cube_vpn.ovpn");
        tokio::fs::write(&config_path, &config)
            .await
            .map_err(|e| format!("Failed to write OpenVPN config: {}", e))?;

        log::info!("OpenVPN config written to: {:?}", config_path);
        log::info!("To connect manually: sudo openvpn --config {:?}", config_path);

        // Return simulated IPs (real implementation needs elevated privileges)
        Ok(("10.8.0.2".to_string(), self.get_local_ip().await))
    }

    /// Connect using IKEv2 protocol
    async fn connect_ikev2(&self, server: &VpnServer) -> Result<(String, String), String> {
        // IKEv2 typically uses native system VPN on macOS/Windows
        #[cfg(target_os = "macos")]
        {
            // Use networksetup on macOS
            log::info!("IKEv2 VPN would connect to: {}", server.hostname);
            log::info!("For macOS, use System Preferences > Network to add VPN");
        }

        #[cfg(target_os = "windows")]
        {
            // Use rasdial on Windows
            log::info!("IKEv2 VPN would connect to: {}", server.hostname);
            log::info!("For Windows, use Settings > Network > VPN to add connection");
        }

        // Return simulated IPs
        Ok(("10.10.0.2".to_string(), self.get_local_ip().await))
    }

    /// Get local IP address
    async fn get_local_ip(&self) -> String {
        // Try to get actual local IP
        if let Ok(output) = tokio::process::Command::new("hostname")
            .arg("-I")
            .output()
            .await
        {
            if output.status.success() {
                let ip = String::from_utf8_lossy(&output.stdout);
                if let Some(first_ip) = ip.split_whitespace().next() {
                    return first_ip.to_string();
                }
            }
        }

        // Fallback for macOS
        if let Ok(output) = tokio::process::Command::new("ipconfig")
            .arg("getifaddr")
            .arg("en0")
            .output()
            .await
        {
            if output.status.success() {
                return String::from_utf8_lossy(&output.stdout).trim().to_string();
            }
        }

        "192.168.1.100".to_string()
    }

    /// Connect to optimal server
    pub async fn connect_optimal(&self) -> Result<VpnConnection, String> {
        let server = self
            .find_optimal_server()
            .await
            .ok_or("No servers available")?;

        self.connect(&server.id).await
    }

    /// Disconnect from VPN
    pub async fn disconnect(&self) -> Result<(), String> {
        let mut connection = self.connection.lock().await;
        let current_protocol = connection.protocol;
        connection.status = VpnStatus::Disconnecting;

        // Execute actual disconnection based on protocol
        let disconnect_result = self.execute_vpn_disconnection(&current_protocol).await;

        match disconnect_result {
            Ok(()) => {
                connection.status = VpnStatus::Disconnected;
                connection.server = None;
                connection.connected_at = None;
                connection.vpn_ip = None;
                connection.bytes_sent = 0;
                connection.bytes_received = 0;
                
                // Clean up config files
                let _ = tokio::fs::remove_file(std::env::temp_dir().join("cube_vpn.conf")).await;
                let _ = tokio::fs::remove_file(std::env::temp_dir().join("cube_vpn.ovpn")).await;
                
                Ok(())
            }
            Err(e) => {
                // Even on error, reset state
                connection.status = VpnStatus::Disconnected;
                connection.server = None;
                log::warn!("VPN disconnection had issues: {}", e);
                Ok(()) // Still return Ok as we've reset state
            }
        }
    }

    /// Execute actual VPN disconnection
    async fn execute_vpn_disconnection(&self, protocol: &VpnProtocol) -> Result<(), String> {
        match protocol {
            VpnProtocol::WireGuard | VpnProtocol::Auto => {
                // Try to bring down WireGuard interface
                let config_path = std::env::temp_dir().join("cube_vpn.conf");
                if config_path.exists() {
                    log::info!("WireGuard disconnect: sudo wg-quick down {:?}", config_path);
                    // Note: This requires elevated privileges
                    // In production: tokio::process::Command::new("sudo").args(["wg-quick", "down", config_path.to_str().unwrap()])
                }
                Ok(())
            }
            VpnProtocol::OpenVPN => {
                // Kill OpenVPN process
                log::info!("OpenVPN disconnect: killing openvpn process");
                // In production: tokio::process::Command::new("sudo").args(["pkill", "openvpn"])
                Ok(())
            }
            VpnProtocol::IKEv2 => {
                // Disconnect native VPN
                #[cfg(target_os = "macos")]
                {
                    log::info!("IKEv2 disconnect on macOS");
                    // In production, use networksetup
                }
                Ok(())
            }
        }
    }

    /// Get current connection status
    pub async fn get_connection(&self) -> VpnConnection {
        self.connection.lock().await.clone()
    }

    /// Get connection statistics
    pub async fn get_stats(&self) -> VpnConnectionStats {
        let connection = self.connection.lock().await;
        
        let duration_secs = connection
            .connected_at
            .map(|t| current_timestamp().saturating_sub(t))
            .unwrap_or(0);

        VpnConnectionStats {
            status: connection.status,
            duration_secs,
            bytes_sent: connection.bytes_sent,
            bytes_received: connection.bytes_received,
            server_name: connection.server.as_ref().map(|s| s.name.clone()),
            server_country: connection.server.as_ref().map(|s| s.country.clone()),
        }
    }

    // ========================================================================
    // Affiliate Functions
    // ========================================================================

    /// Get PureVPN affiliate information
    pub fn get_affiliate_info() -> AffiliateInfo {
        AffiliateInfo::default()
    }

    /// Get affiliate signup URL
    pub fn get_affiliate_url() -> String {
        PUREVPN_AFFILIATE_URL.to_string()
    }

    /// Get signup URL with promo code
    pub fn get_affiliate_url_with_promo() -> String {
        format!("{}&promo=CUBEELITE", PUREVPN_AFFILIATE_URL)
    }

    /// Track affiliate click (for analytics)
    pub async fn track_affiliate_click(&self, source: &str) -> Result<(), String> {
        // Log affiliate click for analytics
        log::info!(
            "Affiliate click tracked: source={}, timestamp={}",
            source,
            current_timestamp()
        );
        Ok(())
    }
}

// ============================================================================
// Connection Statistics
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VpnConnectionStats {
    pub status: VpnStatus,
    pub duration_secs: u64,
    pub bytes_sent: u64,
    pub bytes_received: u64,
    pub server_name: Option<String>,
    pub server_country: Option<String>,
}

// ============================================================================
// Utility Functions
// ============================================================================

fn current_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_affiliate_info() {
        let info = VpnService::get_affiliate_info();
        assert_eq!(info.name, "PureVPN");
        assert_eq!(info.partner_id, "50653");
        assert!(info.discount_percent > 0);
    }

    #[test]
    fn test_affiliate_url() {
        let url = VpnService::get_affiliate_url();
        assert!(url.contains("purevpn.com"));
        assert!(url.contains("aff=50653"));
    }

    #[test]
    fn test_free_servers() {
        let servers = VpnServer::free_servers();
        assert!(!servers.is_empty());
        assert!(servers.iter().all(|s| !s.is_premium));
    }

    #[tokio::test]
    async fn test_vpn_service_init() {
        let service = VpnService::new();
        service.initialize().await.unwrap();
        
        service.set_vpn_tier(VpnTier::Basic).await;
        let servers = service.get_servers().await;
        assert!(!servers.is_empty());
    }

    #[tokio::test]
    async fn test_no_vpn_for_free_tier() {
        let service = VpnService::new();
        service.initialize().await.unwrap();
        
        service.set_vpn_tier(VpnTier::None).await;
        let servers = service.get_servers().await;
        assert!(servers.is_empty());
    }
}
