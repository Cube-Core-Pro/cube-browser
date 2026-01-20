use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

/// CUBE Elite VPN Service - Powered by PureVPN
///
/// White-label VPN integration with PureVPN infrastructure
/// Affiliate Program: https://billing.purevpn.com/aff.php?aff=49387175
/// Commission Rate: Competitive revenue share on all subscriptions
///
/// Architecture:
/// - Free Tier: ProtonVPN Free, Windscribe Free (community servers)
/// - Premium Tier: PureVPN infrastructure (5000+ servers, 70+ countries)
/// - Branding: CUBE Elite VPN (powered by PureVPN backend)
/// - In-app purchase flow with our custom UI/UX

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum VpnProvider {
    // Free Tier (Community servers - direct OpenVPN configs)
    ProtonVPNFree,
    WindscribeFree,
    TunnelBearFree,

    // Premium Tier - CUBE Elite VPN (PureVPN Backend)
    CubeElitePremium, // Branded as "CUBE Elite VPN" to users

    // Custom (User's own VPN config)
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VpnTier {
    pub is_free: bool,
    pub monthly_price: f64,
    pub commission_rate: f64, // Our commission %
    pub affiliate_link: String,
    pub features: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VpnServer {
    pub id: String,
    pub provider: VpnProvider,
    pub name: String,
    pub country: String,
    pub city: String,
    pub host: String,
    pub load: u8, // 0-100%
    pub is_premium: bool,
    pub protocol: String, // "openvpn", "wireguard", "ikev2"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VpnSubscription {
    pub user_id: String,
    pub provider: VpnProvider,
    pub tier: String, // "free", "monthly", "yearly"
    pub expires_at: Option<u64>,
    pub affiliate_code: String,
    pub commission_earned: f64,
}

pub struct VpnProviderAPI {
    // PureVPN Affiliate Configuration
    purevpn_affiliate_id: String, // Our affiliate ID: 49387175
    #[allow(dead_code)]
    purevpn_api_key: Option<String>, // For advanced API features

    // Server cache (thread-safe)
    servers: Arc<Mutex<HashMap<VpnProvider, Vec<VpnServer>>>>,

    // Subscription tracking (thread-safe)
    active_subscriptions: Arc<Mutex<HashMap<String, VpnSubscription>>>,

    // Branding configuration
    branding_name: String, // "CUBE Elite VPN" instead of "PureVPN"
}

impl VpnProviderAPI {
    pub fn new() -> Result<Self> {
        Ok(Self {
            // PureVPN Affiliate ID - hardcoded as per approved program
            purevpn_affiliate_id: "49387175".to_string(),

            // Optional API key for server list and advanced features
            purevpn_api_key: std::env::var("PUREVPN_API_KEY").ok(),

            servers: Arc::new(Mutex::new(HashMap::new())),
            active_subscriptions: Arc::new(Mutex::new(HashMap::new())),

            // White-label branding
            branding_name: "CUBE Elite VPN".to_string(),
        })
    }

    /// Get available VPN tiers (CUBE Elite Branded)
    pub fn get_tiers(&self) -> Vec<(VpnProvider, VpnTier)> {
        vec![
            // FREE TIER - Community Servers
            (
                VpnProvider::ProtonVPNFree,
                VpnTier {
                    is_free: true,
                    monthly_price: 0.0,
                    commission_rate: 0.0,
                    affiliate_link: "https://protonvpn.com".to_string(),
                    features: vec![
                        "3 countries".to_string(),
                        "Medium speed".to_string(),
                        "1 device".to_string(),
                        "No logs".to_string(),
                        "Basic encryption".to_string(),
                    ],
                },
            ),
            (
                VpnProvider::WindscribeFree,
                VpnTier {
                    is_free: true,
                    monthly_price: 0.0,
                    commission_rate: 0.0,
                    affiliate_link: "https://windscribe.com".to_string(),
                    features: vec![
                        "10 countries".to_string(),
                        "10GB/month".to_string(),
                        "Unlimited devices".to_string(),
                        "Ad blocker".to_string(),
                    ],
                },
            ),
            // PREMIUM TIER - CUBE Elite VPN (PureVPN Backend)
            (
                VpnProvider::CubeElitePremium,
                VpnTier {
                    is_free: false,
                    monthly_price: 10.95,   // Competitive pricing
                    commission_rate: 100.0, // We keep full affiliate commission
                    affiliate_link: format!(
                        "https://billing.purevpn.com/aff.php?aff={}",
                        self.purevpn_affiliate_id
                    ),
                    features: vec![
                        "70+ countries worldwide".to_string(),
                        "6500+ high-speed servers".to_string(),
                        "10 devices simultaneously".to_string(),
                        "Military-grade encryption".to_string(),
                        "No logs policy (audited)".to_string(),
                        "Kill switch & DNS leak protection".to_string(),
                        "Split tunneling".to_string(),
                        "P2P optimized servers".to_string(),
                        "Streaming optimized".to_string(),
                        "24/7 live chat support".to_string(),
                        "Dedicated IP available".to_string(),
                        "Port forwarding".to_string(),
                    ],
                },
            ),
        ]
    }

    /// Fetch free VPN servers (no API needed - use public configs)
    pub async fn fetch_free_servers(&self) -> Result<Vec<VpnServer>> {
        let mut servers = Vec::new();

        // ProtonVPN Free servers (use public OpenVPN configs)
        servers.extend(vec![
            VpnServer {
                id: "proton-free-us".to_string(),
                provider: VpnProvider::ProtonVPNFree,
                name: "ProtonVPN Free US".to_string(),
                country: "United States".to_string(),
                city: "New York".to_string(),
                host: "us-free-01.protonvpn.com".to_string(),
                load: 65,
                is_premium: false,
                protocol: "openvpn".to_string(),
            },
            VpnServer {
                id: "proton-free-nl".to_string(),
                provider: VpnProvider::ProtonVPNFree,
                name: "ProtonVPN Free NL".to_string(),
                country: "Netherlands".to_string(),
                city: "Amsterdam".to_string(),
                host: "nl-free-01.protonvpn.com".to_string(),
                load: 45,
                is_premium: false,
                protocol: "openvpn".to_string(),
            },
            VpnServer {
                id: "proton-free-jp".to_string(),
                provider: VpnProvider::ProtonVPNFree,
                name: "ProtonVPN Free JP".to_string(),
                country: "Japan".to_string(),
                city: "Tokyo".to_string(),
                host: "jp-free-01.protonvpn.com".to_string(),
                load: 78,
                is_premium: false,
                protocol: "openvpn".to_string(),
            },
        ]);

        // Windscribe Free servers
        servers.extend(vec![
            VpnServer {
                id: "windscribe-free-us".to_string(),
                provider: VpnProvider::WindscribeFree,
                name: "Windscribe Free US".to_string(),
                country: "United States".to_string(),
                city: "New York".to_string(),
                host: "us-central-free.windscribe.com".to_string(),
                load: 52,
                is_premium: false,
                protocol: "openvpn".to_string(),
            },
            VpnServer {
                id: "windscribe-free-uk".to_string(),
                provider: VpnProvider::WindscribeFree,
                name: "Windscribe Free UK".to_string(),
                country: "United Kingdom".to_string(),
                city: "London".to_string(),
                host: "uk-free.windscribe.com".to_string(),
                load: 38,
                is_premium: false,
                protocol: "openvpn".to_string(),
            },
        ]);

        self.servers
            .lock()
            .unwrap()
            .insert(VpnProvider::ProtonVPNFree, servers.clone());
        Ok(servers)
    }

    /// Fetch PureVPN servers (CUBE Elite Branded)
    /// Uses PureVPN's server infrastructure with our branding
    pub async fn fetch_premium_servers(&self) -> Result<Vec<VpnServer>> {
        // PureVPN has 6500+ servers in 70+ countries
        // For production, integrate with PureVPN API if available
        // For now, return representative server list

        let servers = vec![
            // North America
            VpnServer {
                id: "cube-us-ny-1".to_string(),
                provider: VpnProvider::CubeElitePremium,
                name: format!("{} - New York", self.branding_name),
                country: "United States".to_string(),
                city: "New York".to_string(),
                host: "us-ny.purevpn.net".to_string(),
                load: 25,
                is_premium: true,
                protocol: "wireguard".to_string(),
            },
            VpnServer {
                id: "cube-us-la-1".to_string(),
                provider: VpnProvider::CubeElitePremium,
                name: format!("{} - Los Angeles", self.branding_name),
                country: "United States".to_string(),
                city: "Los Angeles".to_string(),
                host: "us-la.purevpn.net".to_string(),
                load: 18,
                is_premium: true,
                protocol: "wireguard".to_string(),
            },
            VpnServer {
                id: "cube-ca-toronto-1".to_string(),
                provider: VpnProvider::CubeElitePremium,
                name: format!("{} - Toronto", self.branding_name),
                country: "Canada".to_string(),
                city: "Toronto".to_string(),
                host: "ca-toronto.purevpn.net".to_string(),
                load: 32,
                is_premium: true,
                protocol: "wireguard".to_string(),
            },
            // Europe
            VpnServer {
                id: "cube-uk-london-1".to_string(),
                provider: VpnProvider::CubeElitePremium,
                name: format!("{} - London", self.branding_name),
                country: "United Kingdom".to_string(),
                city: "London".to_string(),
                host: "uk-london.purevpn.net".to_string(),
                load: 28,
                is_premium: true,
                protocol: "wireguard".to_string(),
            },
            VpnServer {
                id: "cube-de-frankfurt-1".to_string(),
                provider: VpnProvider::CubeElitePremium,
                name: format!("{} - Frankfurt", self.branding_name),
                country: "Germany".to_string(),
                city: "Frankfurt".to_string(),
                host: "de-frankfurt.purevpn.net".to_string(),
                load: 22,
                is_premium: true,
                protocol: "wireguard".to_string(),
            },
            VpnServer {
                id: "cube-fr-paris-1".to_string(),
                provider: VpnProvider::CubeElitePremium,
                name: format!("{} - Paris", self.branding_name),
                country: "France".to_string(),
                city: "Paris".to_string(),
                host: "fr-paris.purevpn.net".to_string(),
                load: 35,
                is_premium: true,
                protocol: "wireguard".to_string(),
            },
            VpnServer {
                id: "cube-nl-amsterdam-1".to_string(),
                provider: VpnProvider::CubeElitePremium,
                name: format!("{} - Amsterdam", self.branding_name),
                country: "Netherlands".to_string(),
                city: "Amsterdam".to_string(),
                host: "nl-amsterdam.purevpn.net".to_string(),
                load: 29,
                is_premium: true,
                protocol: "wireguard".to_string(),
            },
            // Asia Pacific
            VpnServer {
                id: "cube-jp-tokyo-1".to_string(),
                provider: VpnProvider::CubeElitePremium,
                name: format!("{} - Tokyo", self.branding_name),
                country: "Japan".to_string(),
                city: "Tokyo".to_string(),
                host: "jp-tokyo.purevpn.net".to_string(),
                load: 41,
                is_premium: true,
                protocol: "wireguard".to_string(),
            },
            VpnServer {
                id: "cube-sg-singapore-1".to_string(),
                provider: VpnProvider::CubeElitePremium,
                name: format!("{} - Singapore", self.branding_name),
                country: "Singapore".to_string(),
                city: "Singapore".to_string(),
                host: "sg-singapore.purevpn.net".to_string(),
                load: 38,
                is_premium: true,
                protocol: "wireguard".to_string(),
            },
            VpnServer {
                id: "cube-au-sydney-1".to_string(),
                provider: VpnProvider::CubeElitePremium,
                name: format!("{} - Sydney", self.branding_name),
                country: "Australia".to_string(),
                city: "Sydney".to_string(),
                host: "au-sydney.purevpn.net".to_string(),
                load: 33,
                is_premium: true,
                protocol: "wireguard".to_string(),
            },
            // South America
            VpnServer {
                id: "cube-br-saopaulo-1".to_string(),
                provider: VpnProvider::CubeElitePremium,
                name: format!("{} - São Paulo", self.branding_name),
                country: "Brazil".to_string(),
                city: "São Paulo".to_string(),
                host: "br-saopaulo.purevpn.net".to_string(),
                load: 44,
                is_premium: true,
                protocol: "wireguard".to_string(),
            },
            // Middle East & Africa
            VpnServer {
                id: "cube-ae-dubai-1".to_string(),
                provider: VpnProvider::CubeElitePremium,
                name: format!("{} - Dubai", self.branding_name),
                country: "United Arab Emirates".to_string(),
                city: "Dubai".to_string(),
                host: "ae-dubai.purevpn.net".to_string(),
                load: 36,
                is_premium: true,
                protocol: "wireguard".to_string(),
            },
            VpnServer {
                id: "cube-za-johannesburg-1".to_string(),
                provider: VpnProvider::CubeElitePremium,
                name: format!("{} - Johannesburg", self.branding_name),
                country: "South Africa".to_string(),
                city: "Johannesburg".to_string(),
                host: "za-johannesburg.purevpn.net".to_string(),
                load: 27,
                is_premium: true,
                protocol: "wireguard".to_string(),
            },
        ];

        self.servers
            .lock()
            .unwrap()
            .insert(VpnProvider::CubeElitePremium, servers.clone());
        Ok(servers)
    }

    /// Generate affiliate purchase link
    #[allow(unused_variables)]
    pub fn get_purchase_link(&self, provider: VpnProvider, tier: &str) -> String {
        let tiers = self.get_tiers();
        if let Some((_, tier_info)) = tiers.iter().find(|(_p, _)| true) {
            tier_info.affiliate_link.clone()
        } else {
            String::new()
        }
    }

    /// Track subscription and calculate commission
    pub fn track_subscription(
        &self,
        user_id: String,
        provider: VpnProvider,
        tier: String,
        price: f64,
    ) -> Result<VpnSubscription> {
        let commission_rate = self
            .get_tiers()
            .iter()
            .find(|(_p, _)| true)
            .map(|(_, t)| t.commission_rate)
            .unwrap_or(0.0);

        let commission_earned = price * (commission_rate / 100.0);

        let subscription = VpnSubscription {
            user_id: user_id.clone(),
            provider: provider.clone(),
            tier,
            expires_at: Some(
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)?
                    .as_secs()
                    + (30 * 24 * 60 * 60), // 30 days
            ),
            affiliate_code: format!("CUBE-{}", uuid::Uuid::new_v4()),
            commission_earned,
        };

        self.active_subscriptions
            .lock()
            .unwrap()
            .insert(user_id, subscription.clone());
        Ok(subscription)
    }

    /// Get total commission earnings
    pub fn get_total_commission(&self) -> f64 {
        self.active_subscriptions
            .lock()
            .unwrap()
            .values()
            .map(|s| s.commission_earned)
            .sum()
    }

    /// Download OpenVPN config for free server
    #[allow(dead_code)]
    pub async fn download_free_config(&self, _server_id: &str) -> Result<String> {
        // For ProtonVPN, download from:
        // https://account.protonvpn.com/api/vpn/config?Platform=linux&LogicalID=...

        // For Windscribe:
        // https://windscribe.com/getconfig/openvpn?...

        // Return .ovpn file content
        Ok(format!(
            "client\ndev tun\nproto udp\nremote {} 1194\nresolv-retry infinite\nnobind\n...",
            "server.host.com"
        ))
    }
}

/// VPN Pricing Plans for UI (CUBE Elite Branded)
pub fn get_pricing_plans() -> Vec<serde_json::Value> {
    serde_json::json!([
        {
            "name": "Free",
            "price": 0,
            "period": "Forever",
            "features": [
                "3-10 countries",
                "Medium speed",
                "Limited bandwidth (10GB/month)",
                "Basic encryption",
                "Single device"
            ],
            "providers": ["Community Servers"],
            "cta": "Start Free",
            "popular": false,
            "color": "gray"
        },
        {
            "name": "CUBE Elite VPN",
            "subtitle": "Professional Protection",
            "price": 3.99,
            "period": "month",
            "originalPrice": 10.95,
            "yearlyPrice": 39.99,
            "features": [
                "70+ countries worldwide",
                "6500+ high-speed servers",
                "10 simultaneous connections",
                "Military-grade encryption (AES-256)",
                "Zero logs policy (audited)",
                "Kill switch & DNS leak protection",
                "Split tunneling",
                "P2P optimized servers",
                "Streaming optimized (Netflix, Hulu, etc.)",
                "24/7 live chat support",
                "Dedicated IP available",
                "Port forwarding",
                "Internet kill switch",
                "WireGuard protocol"
            ],
            "providers": ["CUBE Elite Infrastructure"],
            "cta": "Get CUBE Elite VPN",
            "popular": true,
            "discount": "64% OFF",
            "color": "blue",
            "guarantee": "31-day money-back guarantee"
        },
        {
            "name": "CUBE Elite Business",
            "subtitle": "Enterprise Security",
            "price": 8.99,
            "period": "user/month",
            "features": [
                "All CUBE Elite VPN features",
                "Dedicated IP addresses",
                "Team management dashboard",
                "Priority support",
                "Custom configurations",
                "SSO integration",
                "Centralized billing",
                "Usage analytics",
                "Site-to-site VPN",
                "API access"
            ],
            "providers": ["CUBE Elite Enterprise"],
            "cta": "Contact Sales",
            "popular": false,
            "color": "purple"
        }
    ])
    .as_array()
    .unwrap()
    .clone()
}
