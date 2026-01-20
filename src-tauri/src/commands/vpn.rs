use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

// ============================================================================
// TYPES & STRUCTURES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VPNServer {
    pub id: String,
    pub name: String,
    pub country: String,
    pub city: String,
    pub ip: String,
    pub protocol: String, // "OpenVPN" | "WireGuard"
    pub load: u8,         // 0-100 (server load percentage)
    pub ping: u16,        // ms
    pub premium: bool,
}

// ============================================================================
// AD BLOCKER TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BlockCategory {
    pub id: String,
    pub name: String,
    pub description: String,
    pub enabled: bool,
    pub blocked_count: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WhitelistEntry {
    pub id: String,
    pub domain: String,
    pub added_at: u64,
    pub reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BlockingStats {
    pub total_blocked: u64,
    pub ads_blocked: u64,
    pub trackers_blocked: u64,
    pub cookie_notices_blocked: u64,
    pub social_widgets_blocked: u64,
    pub data_saved: u64,
    pub times_saved: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdBlockerConfig {
    pub enabled: bool,
    pub categories: Vec<BlockCategory>,
    pub whitelist: Vec<WhitelistEntry>,
    pub stats: BlockingStats,
}

// ============================================================================
// KILL SWITCH TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KillSwitchEvent {
    pub id: String,
    pub event_type: String,
    pub timestamp: u64,
    pub reason: String,
    pub app_blocked: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KillSwitchConfig {
    pub enabled: bool,
    pub mode: String, // "strict" | "app"
    pub triggered: bool,
    pub allowed_apps: Vec<SplitTunnelingApp>,
    pub events: Vec<KillSwitchEvent>,
}

// ============================================================================
// SPLIT TUNNELING TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SplitTunnelingApp {
    pub id: String,
    pub name: String,
    pub path: String,
    pub icon: Option<String>,
    pub is_included: bool,
    pub is_system: bool,
    pub category: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SplitTunnelingConfig {
    pub enabled: bool,
    pub mode: String, // "include" | "exclude"
    pub apps: Vec<SplitTunnelingApp>,
    pub websites: Vec<String>,
    pub ip_ranges: Vec<String>,
}

// ============================================================================
// DEDICATED IP TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DedicatedIPUsageStats {
    pub total_connections: u32,
    pub bytes_transferred: u64,
    pub total_data_transferred: u64,
    pub average_session_duration: f64,
    pub last_used: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DedicatedIP {
    pub id: String,
    pub ip: String,
    pub country: String,
    pub country_code: String,
    pub city: String,
    pub server: String,
    pub status: String,
    pub is_active: bool,
    pub assigned_at: u64,
    pub expires_at: u64,
    pub usage_stats: DedicatedIPUsageStats,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DedicatedIPLocation {
    pub country: String,
    pub country_code: String,
    pub cities: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DedicatedIPConfig {
    pub dedicated_ips: Vec<DedicatedIP>,
    pub available_locations: Vec<DedicatedIPLocation>,
}

// ============================================================================
// DOUBLE VPN TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DoubleVPNServer {
    pub id: String,
    pub name: String,
    pub country: String,
    pub country_code: String,
    pub city: String,
    pub hostname: String,
    pub ip: String,
    pub load: u8,
    pub latency: u32,
    pub features: Vec<String>,
    pub groups: Vec<String>,
    pub is_favorite: bool,
    pub is_recommended: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DoubleVPNPresetRoute {
    pub id: String,
    pub name: String,
    pub entry_country: String,
    pub exit_country: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DoubleVPNConfig {
    pub enabled: bool,
    pub entry_servers: Vec<DoubleVPNServer>,
    pub exit_servers: Vec<DoubleVPNServer>,
    pub preset_routes: Vec<DoubleVPNPresetRoute>,
    pub selected_entry: Option<String>,
    pub selected_exit: Option<String>,
}

// ============================================================================
// MESHNET TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeshnetPermissions {
    pub can_route_traffic: bool,
    pub can_access_local_network: bool,
    pub can_send_files: bool,
    pub can_be_discovered: bool,
    pub allow_inbound: bool,
    pub allow_outbound: bool,
    pub allow_routing: bool,
    pub allow_local_network: bool,
    pub allow_file_sharing: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeshnetDevice {
    pub id: String,
    pub name: String,
    pub hostname: String,
    pub platform: String,
    pub device_type: String,
    pub os: String,
    pub ip: String,
    pub public_key: String,
    pub is_online: bool,
    pub is_owned: bool,
    pub last_seen: u64,
    pub last_seen_at: u64,
    pub traffic_routing: bool,
    pub local_network_access: bool,
    pub permissions: MeshnetPermissions,
    pub connected_since: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeshnetInvitation {
    pub id: String,
    pub email: String,
    pub sent_at: u64,
    pub expires_at: u64,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MeshnetConfig {
    pub enabled: bool,
    pub devices: Vec<MeshnetDevice>,
    pub invitations: Vec<MeshnetInvitation>,
    pub device_name: String,
    pub device_ip: String,
}

// ============================================================================
// THREAT PROTECTION TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ThreatEvent {
    pub id: String,
    pub threat_type: String,
    pub severity: String,
    pub domain: String,
    pub url: String,
    pub timestamp: u64,
    pub blocked_at: u64,
    pub source: String,
    pub action: String,
    pub action_taken: String,
    pub category: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ThreatStats {
    pub malware_blocked: u32,
    pub trackers_blocked: u32,
    pub ads_blocked: u32,
    pub phishing_blocked: u32,
    pub crypto_miners_blocked: u32,
    pub total_threats_blocked: u32,
    pub last_updated: u64,
    pub period_start: u64,
    pub period_end: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DNSCategory {
    pub id: String,
    pub label: String,
    pub description: String,
    pub blocked: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ThreatProtectionConfig {
    pub enabled: bool,
    pub events: Vec<ThreatEvent>,
    pub stats: ThreatStats,
    pub dns_categories: Vec<DNSCategory>,
    pub whitelist: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VPNStatus {
    pub connected: bool,
    pub server: Option<VPNServer>,
    pub public_ip: String,
    pub connection_time: Option<u64>, // seconds since connection
    pub bytes_sent: u64,
    pub bytes_received: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VPNConfig {
    pub kill_switch_enabled: bool,
    pub auto_connect: bool,
    pub protocol: String, // "OpenVPN" | "WireGuard"
    pub dns_servers: Vec<String>,
    pub split_tunneling: SplitTunnelConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SplitTunnelConfig {
    pub enabled: bool,
    pub mode: String,         // "include" | "exclude"
    pub apps: Vec<String>,    // app bundle IDs or paths
    pub domains: Vec<String>, // domains for split tunneling
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionLog {
    pub timestamp: u64,
    pub event: String,
    pub server: Option<String>,
    pub success: bool,
    pub message: String,
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

pub struct VPNState {
    current_status: Mutex<VPNStatus>,
    config: Mutex<VPNConfig>,
    servers: Mutex<Vec<VPNServer>>,
    connection_logs: Mutex<Vec<ConnectionLog>>,
}

pub struct AdBlockerState {
    config: Mutex<AdBlockerConfig>,
}

impl Default for AdBlockerState {
    fn default() -> Self {
        Self {
            config: Mutex::new(AdBlockerConfig {
                enabled: true,
                categories: vec![
                    BlockCategory {
                        id: String::from("ads"),
                        name: String::from("Advertisements"),
                        description: String::from("Block banner ads, pop-ups, and video ads"),
                        enabled: true,
                        blocked_count: 12453,
                    },
                    BlockCategory {
                        id: String::from("trackers"),
                        name: String::from("Trackers"),
                        description: String::from("Block analytics and tracking scripts"),
                        enabled: true,
                        blocked_count: 8921,
                    },
                    BlockCategory {
                        id: String::from("cookies"),
                        name: String::from("Cookie Notices"),
                        description: String::from("Auto-dismiss cookie consent banners"),
                        enabled: true,
                        blocked_count: 2341,
                    },
                    BlockCategory {
                        id: String::from("social"),
                        name: String::from("Social Widgets"),
                        description: String::from("Block social media tracking buttons"),
                        enabled: true,
                        blocked_count: 3456,
                    },
                    BlockCategory {
                        id: String::from("fingerprinting"),
                        name: String::from("Fingerprinting"),
                        description: String::from("Prevent browser fingerprinting attempts"),
                        enabled: true,
                        blocked_count: 1234,
                    },
                    BlockCategory {
                        id: String::from("popups"),
                        name: String::from("Pop-ups & Overlays"),
                        description: String::from("Block intrusive pop-ups and modals"),
                        enabled: true,
                        blocked_count: 4567,
                    },
                    BlockCategory {
                        id: String::from("video"),
                        name: String::from("Video Ads"),
                        description: String::from("Block pre-roll and mid-roll video ads"),
                        enabled: true,
                        blocked_count: 987,
                    },
                    BlockCategory {
                        id: String::from("newsletter"),
                        name: String::from("Newsletter Pop-ups"),
                        description: String::from("Block email signup prompts"),
                        enabled: false,
                        blocked_count: 654,
                    },
                ],
                whitelist: vec![
                    WhitelistEntry {
                        id: String::from("1"),
                        domain: String::from("example.com"),
                        added_at: 1704067200,
                        reason: Some(String::from("Trusted site")),
                    },
                    WhitelistEntry {
                        id: String::from("2"),
                        domain: String::from("mybank.com"),
                        added_at: 1701475200,
                        reason: Some(String::from("Banking")),
                    },
                ],
                stats: BlockingStats {
                    total_blocked: 34613,
                    ads_blocked: 12453,
                    trackers_blocked: 8921,
                    cookie_notices_blocked: 2341,
                    social_widgets_blocked: 3456,
                    data_saved: 268435456,
                    times_saved: 9000.0,
                },
            }),
        }
    }
}

pub struct KillSwitchState {
    config: Mutex<KillSwitchConfig>,
}

impl Default for KillSwitchState {
    fn default() -> Self {
        Self {
            config: Mutex::new(KillSwitchConfig {
                enabled: true,
                mode: String::from("strict"),
                triggered: false,
                allowed_apps: vec![
                    SplitTunnelingApp {
                        id: String::from("ks-1"),
                        name: String::from("System Preferences"),
                        path: String::from("/System/Applications/System Preferences.app"),
                        icon: None,
                        is_included: true,
                        is_system: true,
                        category: String::from("system"),
                    },
                    SplitTunnelingApp {
                        id: String::from("ks-2"),
                        name: String::from("Safari"),
                        path: String::from("/Applications/Safari.app"),
                        icon: None,
                        is_included: true,
                        is_system: true,
                        category: String::from("browser"),
                    },
                ],
                events: vec![],
            }),
        }
    }
}

pub struct SplitTunnelState {
    config: Mutex<SplitTunnelingConfig>,
}

impl Default for SplitTunnelState {
    fn default() -> Self {
        Self {
            config: Mutex::new(SplitTunnelingConfig {
                enabled: false,
                mode: String::from("exclude"),
                apps: vec![
                    SplitTunnelingApp {
                        id: String::from("app-1"),
                        name: String::from("Google Chrome"),
                        path: String::from("/Applications/Google Chrome.app"),
                        icon: Some(String::from("chrome")),
                        is_included: true,
                        is_system: false,
                        category: String::from("browser"),
                    },
                    SplitTunnelingApp {
                        id: String::from("app-2"),
                        name: String::from("Safari"),
                        path: String::from("/Applications/Safari.app"),
                        icon: Some(String::from("safari")),
                        is_included: true,
                        is_system: true,
                        category: String::from("browser"),
                    },
                    SplitTunnelingApp {
                        id: String::from("app-3"),
                        name: String::from("Firefox"),
                        path: String::from("/Applications/Firefox.app"),
                        icon: Some(String::from("firefox")),
                        is_included: true,
                        is_system: false,
                        category: String::from("browser"),
                    },
                    SplitTunnelingApp {
                        id: String::from("app-4"),
                        name: String::from("Slack"),
                        path: String::from("/Applications/Slack.app"),
                        icon: Some(String::from("slack")),
                        is_included: true,
                        is_system: false,
                        category: String::from("communication"),
                    },
                    SplitTunnelingApp {
                        id: String::from("app-5"),
                        name: String::from("Microsoft Teams"),
                        path: String::from("/Applications/Microsoft Teams.app"),
                        icon: Some(String::from("teams")),
                        is_included: false,
                        is_system: false,
                        category: String::from("communication"),
                    },
                    SplitTunnelingApp {
                        id: String::from("app-6"),
                        name: String::from("Zoom"),
                        path: String::from("/Applications/zoom.us.app"),
                        icon: Some(String::from("zoom")),
                        is_included: false,
                        is_system: false,
                        category: String::from("communication"),
                    },
                    SplitTunnelingApp {
                        id: String::from("app-7"),
                        name: String::from("Spotify"),
                        path: String::from("/Applications/Spotify.app"),
                        icon: Some(String::from("spotify")),
                        is_included: false,
                        is_system: false,
                        category: String::from("media"),
                    },
                    SplitTunnelingApp {
                        id: String::from("app-8"),
                        name: String::from("Netflix"),
                        path: String::from("/Applications/Netflix.app"),
                        icon: Some(String::from("netflix")),
                        is_included: true,
                        is_system: false,
                        category: String::from("media"),
                    },
                    SplitTunnelingApp {
                        id: String::from("app-9"),
                        name: String::from("Steam"),
                        path: String::from("/Applications/Steam.app"),
                        icon: Some(String::from("steam")),
                        is_included: false,
                        is_system: false,
                        category: String::from("gaming"),
                    },
                    SplitTunnelingApp {
                        id: String::from("app-10"),
                        name: String::from("Discord"),
                        path: String::from("/Applications/Discord.app"),
                        icon: Some(String::from("discord")),
                        is_included: false,
                        is_system: false,
                        category: String::from("communication"),
                    },
                    SplitTunnelingApp {
                        id: String::from("app-11"),
                        name: String::from("VS Code"),
                        path: String::from("/Applications/Visual Studio Code.app"),
                        icon: Some(String::from("vscode")),
                        is_included: true,
                        is_system: false,
                        category: String::from("development"),
                    },
                    SplitTunnelingApp {
                        id: String::from("app-12"),
                        name: String::from("Terminal"),
                        path: String::from("/Applications/Utilities/Terminal.app"),
                        icon: Some(String::from("terminal")),
                        is_included: true,
                        is_system: true,
                        category: String::from("development"),
                    },
                    SplitTunnelingApp {
                        id: String::from("app-13"),
                        name: String::from("Dropbox"),
                        path: String::from("/Applications/Dropbox.app"),
                        icon: Some(String::from("dropbox")),
                        is_included: true,
                        is_system: false,
                        category: String::from("cloud"),
                    },
                    SplitTunnelingApp {
                        id: String::from("app-14"),
                        name: String::from("OneDrive"),
                        path: String::from("/Applications/OneDrive.app"),
                        icon: Some(String::from("onedrive")),
                        is_included: true,
                        is_system: false,
                        category: String::from("cloud"),
                    },
                    SplitTunnelingApp {
                        id: String::from("app-15"),
                        name: String::from("Transmission"),
                        path: String::from("/Applications/Transmission.app"),
                        icon: Some(String::from("transmission")),
                        is_included: true,
                        is_system: false,
                        category: String::from("download"),
                    },
                ],
                websites: vec![
                    String::from("netflix.com"),
                    String::from("spotify.com"),
                    String::from("hulu.com"),
                    String::from("disneyplus.com"),
                    String::from("primevideo.com"),
                ],
                ip_ranges: vec![
                    String::from("192.168.1.0/24"),
                    String::from("10.0.0.0/8"),
                ],
            }),
        }
    }
}

impl Default for VPNState {
    fn default() -> Self {
        Self {
            current_status: Mutex::new(VPNStatus {
                connected: false,
                server: None,
                public_ip: String::from("Unknown"),
                connection_time: None,
                bytes_sent: 0,
                bytes_received: 0,
            }),
            config: Mutex::new(VPNConfig {
                kill_switch_enabled: true,
                auto_connect: false,
                protocol: String::from("WireGuard"),
                dns_servers: vec![
                    String::from("1.1.1.1"), // Cloudflare
                    String::from("1.0.0.1"),
                    String::from("8.8.8.8"), // Google
                    String::from("8.8.4.4"),
                ],
                split_tunneling: SplitTunnelConfig {
                    enabled: false,
                    mode: String::from("exclude"),
                    apps: vec![],
                    domains: vec![],
                },
            }),
            servers: Mutex::new(Self::get_default_servers()),
            connection_logs: Mutex::new(vec![]),
        }
    }
}

impl VPNState {
    fn get_default_servers() -> Vec<VPNServer> {
        vec![
            VPNServer {
                id: String::from("us-ny-01"),
                name: String::from("New York #1"),
                country: String::from("United States"),
                city: String::from("New York"),
                ip: String::from("198.50.191.12"),
                protocol: String::from("WireGuard"),
                load: 23,
                ping: 15,
                premium: false,
            },
            VPNServer {
                id: String::from("us-la-01"),
                name: String::from("Los Angeles #1"),
                country: String::from("United States"),
                city: String::from("Los Angeles"),
                ip: String::from("45.87.214.25"),
                protocol: String::from("WireGuard"),
                load: 45,
                ping: 28,
                premium: false,
            },
            VPNServer {
                id: String::from("uk-ldn-01"),
                name: String::from("London #1"),
                country: String::from("United Kingdom"),
                city: String::from("London"),
                ip: String::from("89.238.130.65"),
                protocol: String::from("WireGuard"),
                load: 67,
                ping: 85,
                premium: false,
            },
            VPNServer {
                id: String::from("de-ber-01"),
                name: String::from("Berlin #1"),
                country: String::from("Germany"),
                city: String::from("Berlin"),
                ip: String::from("185.159.157.34"),
                protocol: String::from("WireGuard"),
                load: 12,
                ping: 92,
                premium: true,
            },
            VPNServer {
                id: String::from("jp-tok-01"),
                name: String::from("Tokyo #1"),
                country: String::from("Japan"),
                city: String::from("Tokyo"),
                ip: String::from("103.107.199.6"),
                protocol: String::from("WireGuard"),
                load: 78,
                ping: 165,
                premium: true,
            },
            VPNServer {
                id: String::from("au-syd-01"),
                name: String::from("Sydney #1"),
                country: String::from("Australia"),
                city: String::from("Sydney"),
                ip: String::from("103.231.89.12"),
                protocol: String::from("WireGuard"),
                load: 34,
                ping: 198,
                premium: true,
            },
            VPNServer {
                id: String::from("ca-tor-01"),
                name: String::from("Toronto #1"),
                country: String::from("Canada"),
                city: String::from("Toronto"),
                ip: String::from("198.144.189.45"),
                protocol: String::from("OpenVPN"),
                load: 56,
                ping: 42,
                premium: false,
            },
            VPNServer {
                id: String::from("fr-par-01"),
                name: String::from("Paris #1"),
                country: String::from("France"),
                city: String::from("Paris"),
                ip: String::from("195.154.173.78"),
                protocol: String::from("WireGuard"),
                load: 29,
                ping: 88,
                premium: false,
            },
        ]
    }

    fn add_log(&self, event: String, server: Option<String>, success: bool, message: String) {
        let log = ConnectionLog {
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            event,
            server,
            success,
            message,
        };

        if let Ok(mut logs) = self.connection_logs.lock() {
            logs.push(log);
            // Keep only last 100 logs
            if logs.len() > 100 {
                logs.remove(0);
            }
        }
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/// Get current public IP address
async fn get_public_ip() -> Result<String, String> {
    // Try multiple services for redundancy
    let services = vec![
        "https://api.ipify.org?format=text",
        "https://icanhazip.com",
        "https://checkip.amazonaws.com",
    ];

    for service in services {
        if let Ok(response) = reqwest::get(service).await {
            if let Ok(ip) = response.text().await {
                let ip = ip.trim().to_string();
                if !ip.is_empty() {
                    return Ok(ip);
                }
            }
        }
    }

    Err(String::from("Failed to retrieve public IP"))
}

/// Execute system command for VPN connection (simulated for now)
fn execute_vpn_command(action: &str, server: Option<&VPNServer>) -> Result<String, String> {
    // NOTE: This is a SIMULATION for development
    // In production, this would use actual VPN client commands like:
    // - macOS: networksetup, scutil
    // - Linux: nmcli, wg (WireGuard), openvpn
    // - Windows: rasdial, powershell

    match action {
        "connect" => {
            if let Some(srv) = server {
                // Simulate connection delay
                std::thread::sleep(std::time::Duration::from_millis(500));
                Ok(format!("Connected to {} ({})", srv.name, srv.ip))
            } else {
                Err(String::from("No server specified"))
            }
        }
        "disconnect" => {
            std::thread::sleep(std::time::Duration::from_millis(300));
            Ok(String::from("Disconnected successfully"))
        }
        "status" => Ok(String::from("VPN is ready")),
        _ => Err(format!("Unknown action: {}", action)),
    }
}

// ============================================================================
// TAURI COMMANDS
// ============================================================================

/// Get list of available VPN servers
#[tauri::command]
pub async fn get_vpn_servers(state: State<'_, VPNState>) -> Result<Vec<VPNServer>, String> {
    state
        .servers
        .lock()
        .map(|servers| servers.clone())
        .map_err(|e| format!("Failed to get servers: {}", e))
}

/// Get current VPN connection status
#[tauri::command]
pub async fn get_vpn_status(state: State<'_, VPNState>) -> Result<VPNStatus, String> {
    state
        .current_status
        .lock()
        .map(|status| status.clone())
        .map_err(|e| format!("Failed to get status: {}", e))
}

/// Connect to a VPN server
#[tauri::command]
pub async fn connect_vpn(
    server_id: String,
    state: State<'_, VPNState>,
) -> Result<VPNStatus, String> {
    // Find the server
    let server = {
        let servers = state
            .servers
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;
        servers
            .iter()
            .find(|s| s.id == server_id)
            .cloned()
            .ok_or_else(|| format!("Server not found: {}", server_id))?
    };

    // Check if already connected
    {
        let status = state
            .current_status
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;
        if status.connected {
            return Err(String::from("Already connected. Disconnect first."));
        }
    }

    // Execute connection
    match execute_vpn_command("connect", Some(&server)) {
        Ok(msg) => {
            // Get new public IP
            let new_ip = get_public_ip()
                .await
                .unwrap_or_else(|_| String::from("Unknown"));

            // Update status
            let new_status = VPNStatus {
                connected: true,
                server: Some(server.clone()),
                public_ip: new_ip,
                connection_time: Some(
                    std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap()
                        .as_secs(),
                ),
                bytes_sent: 0,
                bytes_received: 0,
            };

            {
                let mut status = state
                    .current_status
                    .lock()
                    .map_err(|e| format!("Lock error: {}", e))?;
                *status = new_status.clone();
            }

            // Log connection
            state.add_log(
                String::from("connect"),
                Some(server.name.clone()),
                true,
                msg,
            );

            Ok(new_status)
        }
        Err(e) => {
            state.add_log(
                String::from("connect"),
                Some(server.name.clone()),
                false,
                e.clone(),
            );
            Err(e)
        }
    }
}

/// Disconnect from VPN
#[tauri::command]
pub async fn disconnect_vpn(state: State<'_, VPNState>) -> Result<VPNStatus, String> {
    // Check if connected
    let was_connected = {
        let status = state
            .current_status
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;
        status.connected
    };

    if !was_connected {
        return Err(String::from("Not connected to any VPN"));
    }

    // Execute disconnection
    match execute_vpn_command("disconnect", None) {
        Ok(msg) => {
            // Get new public IP (real one)
            let new_ip = get_public_ip()
                .await
                .unwrap_or_else(|_| String::from("Unknown"));

            // Update status
            let new_status = VPNStatus {
                connected: false,
                server: None,
                public_ip: new_ip,
                connection_time: None,
                bytes_sent: 0,
                bytes_received: 0,
            };

            {
                let mut status = state
                    .current_status
                    .lock()
                    .map_err(|e| format!("Lock error: {}", e))?;
                *status = new_status.clone();
            }

            // Log disconnection
            state.add_log(String::from("disconnect"), None, true, msg);

            Ok(new_status)
        }
        Err(e) => {
            state.add_log(String::from("disconnect"), None, false, e.clone());
            Err(e)
        }
    }
}

/// Get current VPN configuration
#[tauri::command]
pub async fn get_vpn_config(state: State<'_, VPNState>) -> Result<VPNConfig, String> {
    state
        .config
        .lock()
        .map(|config| config.clone())
        .map_err(|e| format!("Failed to get config: {}", e))
}

/// Update VPN configuration
#[tauri::command]
pub async fn update_vpn_config(
    config: VPNConfig,
    state: State<'_, VPNState>,
) -> Result<VPNConfig, String> {
    let mut current_config = state
        .config
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    *current_config = config.clone();

    state.add_log(
        String::from("config_update"),
        None,
        true,
        String::from("Configuration updated"),
    );

    Ok(config)
}

/// Toggle kill switch
#[tauri::command]
pub async fn toggle_kill_switch(enabled: bool, state: State<'_, VPNState>) -> Result<bool, String> {
    let mut config = state
        .config
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    config.kill_switch_enabled = enabled;

    state.add_log(
        String::from("kill_switch"),
        None,
        true,
        format!(
            "Kill switch {}",
            if enabled { "enabled" } else { "disabled" }
        ),
    );

    Ok(enabled)
}

/// Configure split tunneling
#[tauri::command]
pub async fn configure_split_tunnel(
    split_config: SplitTunnelConfig,
    state: State<'_, VPNState>,
) -> Result<SplitTunnelConfig, String> {
    let mut config = state
        .config
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    config.split_tunneling = split_config.clone();

    state.add_log(
        String::from("split_tunnel"),
        None,
        true,
        format!(
            "Split tunneling {} ({} mode)",
            if split_config.enabled {
                "enabled"
            } else {
                "disabled"
            },
            split_config.mode
        ),
    );

    Ok(split_config)
}

/// Get current public IP (without VPN state)
#[tauri::command]
pub async fn get_current_ip() -> Result<String, String> {
    get_public_ip().await
}

/// Get connection logs
#[tauri::command]
pub async fn get_vpn_logs(state: State<'_, VPNState>) -> Result<Vec<ConnectionLog>, String> {
    state
        .connection_logs
        .lock()
        .map(|logs| logs.clone())
        .map_err(|e| format!("Failed to get logs: {}", e))
}

/// Refresh server list (simulated - would fetch from API in production)
#[tauri::command]
pub async fn refresh_vpn_servers(state: State<'_, VPNState>) -> Result<Vec<VPNServer>, String> {
    // In production, this would fetch from a real API
    // For now, just return the default list with updated ping/load values
    let mut servers = VPNState::get_default_servers();

    // Simulate network latency check and load updates
    for server in &mut servers {
        use rand::Rng;
        let mut rng = rand::thread_rng();
        server.ping = rng.gen_range(10..300);
        server.load = rng.gen_range(5..95);
    }

    {
        let mut state_servers = state
            .servers
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;
        *state_servers = servers.clone();
    }

    state.add_log(
        String::from("refresh_servers"),
        None,
        true,
        format!("Refreshed {} servers", servers.len()),
    );

    Ok(servers)
}

// ============================================================================
// PUREVPN AFFILIATE INTEGRATION
// ============================================================================

/// PureVPN Affiliate Link - CUBE Collective Partnership
const PUREVPN_AFFILIATE_URL: &str = "https://billing.purevpn.com/aff.php?aff=50653";
const PUREVPN_PROMO_CODE: &str = "CUBEELITE";

/// PureVPN affiliate information
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PureVPNAffiliateInfo {
    pub name: String,
    pub partner_id: String,
    pub signup_url: String,
    pub signup_url_with_promo: String,
    pub discount_percent: u8,
    pub promo_code: String,
    pub benefits: Vec<String>,
    pub monthly_price_usd: f32,
    pub yearly_price_usd: f32,
    pub money_back_days: u8,
}

/// VPN upgrade prompt for users
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VPNUpgradePrompt {
    pub show_prompt: bool,
    pub title: String,
    pub message: String,
    pub cube_pro_features: Vec<String>,
    pub cube_elite_features: Vec<String>,
    pub purevpn_features: Vec<String>,
    pub affiliate_url: String,
    pub discount_percent: u8,
    pub promo_code: String,
}

/// Get PureVPN affiliate information
#[tauri::command]
pub async fn get_purevpn_affiliate_info() -> Result<PureVPNAffiliateInfo, String> {
    Ok(PureVPNAffiliateInfo {
        name: "PureVPN".to_string(),
        partner_id: "50653".to_string(),
        signup_url: PUREVPN_AFFILIATE_URL.to_string(),
        signup_url_with_promo: format!("{}&promo={}", PUREVPN_AFFILIATE_URL, PUREVPN_PROMO_CODE),
        discount_percent: 82,
        promo_code: PUREVPN_PROMO_CODE.to_string(),
        benefits: vec![
            "6500+ Servers in 78 Countries".to_string(),
            "10 Multi-Logins".to_string(),
            "Split Tunneling".to_string(),
            "Kill Switch".to_string(),
            "No-Log Policy (Audited by KPMG)".to_string(),
            "P2P Optimized Servers".to_string(),
            "Streaming Optimized Servers".to_string(),
            "24/7 Customer Support".to_string(),
            "31-Day Money Back Guarantee".to_string(),
            "WireGuard Protocol".to_string(),
            "Dedicated IP Available".to_string(),
            "Port Forwarding".to_string(),
        ],
        monthly_price_usd: 10.95,
        yearly_price_usd: 1.99, // With 82% discount
        money_back_days: 31,
    })
}

/// Get PureVPN affiliate signup URL
#[tauri::command]
pub async fn get_purevpn_affiliate_url(with_promo: Option<bool>) -> Result<String, String> {
    if with_promo.unwrap_or(true) {
        Ok(format!("{}&promo={}", PUREVPN_AFFILIATE_URL, PUREVPN_PROMO_CODE))
    } else {
        Ok(PUREVPN_AFFILIATE_URL.to_string())
    }
}

/// Track affiliate click for analytics
#[tauri::command]
pub async fn track_purevpn_click(
    source: String,
    state: State<'_, VPNState>,
) -> Result<(), String> {
    state.add_log(
        String::from("affiliate_click"),
        None,
        true,
        format!("PureVPN affiliate click from: {}", source),
    );
    
    // Log for analytics (in production, send to analytics service)
    log::info!(
        "PureVPN affiliate click: source={}, timestamp={}",
        source,
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs()
    );
    
    Ok(())
}

/// Get VPN upgrade prompt based on user's license tier
#[tauri::command]
pub async fn get_vpn_upgrade_prompt(
    license_tier: String,
) -> Result<VPNUpgradePrompt, String> {
    let tier = license_tier.to_lowercase();
    
    let cube_pro_features = vec![
        "3 Free VPN Server Locations".to_string(),
        "WireGuard & OpenVPN Protocols".to_string(),
        "Basic Kill Switch".to_string(),
        "DNS Leak Protection".to_string(),
    ];
    
    let cube_elite_features = vec![
        "All Pro VPN Features".to_string(),
        "8 Premium Server Locations".to_string(),
        "Split Tunneling".to_string(),
        "Advanced Kill Switch".to_string(),
        "Custom DNS Servers".to_string(),
    ];
    
    let purevpn_features = vec![
        "6500+ Servers Worldwide".to_string(),
        "78 Countries".to_string(),
        "10 Simultaneous Connections".to_string(),
        "Streaming Optimized".to_string(),
        "P2P Optimized".to_string(),
        "No-Log Policy (KPMG Audited)".to_string(),
        "31-Day Money Back".to_string(),
    ];

    match tier.as_str() {
        "free" => Ok(VPNUpgradePrompt {
            show_prompt: true,
            title: "🔒 Unlock VPN Protection".to_string(),
            message: "Protect your privacy and access geo-restricted content. Upgrade to CUBE Pro for basic VPN access, or CUBE Elite for premium worldwide coverage.".to_string(),
            cube_pro_features,
            cube_elite_features,
            purevpn_features,
            affiliate_url: format!("{}&promo={}", PUREVPN_AFFILIATE_URL, PUREVPN_PROMO_CODE),
            discount_percent: 82,
            promo_code: PUREVPN_PROMO_CODE.to_string(),
        }),
        "pro" => Ok(VPNUpgradePrompt {
            show_prompt: true,
            title: "🚀 Upgrade to Premium VPN".to_string(),
            message: "Get access to 6500+ servers in 78 countries with our partner PureVPN. Exclusive 82% discount for CUBE users!".to_string(),
            cube_pro_features: Vec::new(),
            cube_elite_features,
            purevpn_features,
            affiliate_url: format!("{}&promo={}", PUREVPN_AFFILIATE_URL, PUREVPN_PROMO_CODE),
            discount_percent: 82,
            promo_code: PUREVPN_PROMO_CODE.to_string(),
        }),
        "elite" => Ok(VPNUpgradePrompt {
            show_prompt: false,
            title: String::new(),
            message: "You have full VPN access! Consider PureVPN for additional coverage.".to_string(),
            cube_pro_features: Vec::new(),
            cube_elite_features: Vec::new(),
            purevpn_features,
            affiliate_url: format!("{}&promo={}", PUREVPN_AFFILIATE_URL, PUREVPN_PROMO_CODE),
            discount_percent: 82,
            promo_code: PUREVPN_PROMO_CODE.to_string(),
        }),
        _ => Ok(VPNUpgradePrompt {
            show_prompt: true,
            title: "🔒 Get VPN Protection".to_string(),
            message: "Secure your connection with CUBE VPN.".to_string(),
            cube_pro_features,
            cube_elite_features,
            purevpn_features,
            affiliate_url: format!("{}&promo={}", PUREVPN_AFFILIATE_URL, PUREVPN_PROMO_CODE),
            discount_percent: 82,
            promo_code: PUREVPN_PROMO_CODE.to_string(),
        }),
    }
}

/// Open PureVPN affiliate link in browser
#[tauri::command]
pub async fn open_purevpn_affiliate(source: String) -> Result<(), String> {
    let url = format!("{}&promo={}", PUREVPN_AFFILIATE_URL, PUREVPN_PROMO_CODE);
    
    // Log the click
    log::info!("Opening PureVPN affiliate link from: {}", source);
    
    // Open in default browser
    open::that(&url).map_err(|e| format!("Failed to open browser: {}", e))?;
    
    Ok(())
}

// ============================================================================
// AD BLOCKER COMMANDS
// ============================================================================

/// Get ad blocker configuration
#[tauri::command]
pub async fn get_adblocker_config(state: State<'_, AdBlockerState>) -> Result<AdBlockerConfig, String> {
    state
        .config
        .lock()
        .map(|config| config.clone())
        .map_err(|e| format!("Failed to get ad blocker config: {}", e))
}

/// Update ad blocker configuration
#[tauri::command]
pub async fn update_adblocker_config(
    config: AdBlockerConfig,
    state: State<'_, AdBlockerState>,
) -> Result<AdBlockerConfig, String> {
    let mut current_config = state
        .config
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    *current_config = config.clone();
    Ok(config)
}

/// Toggle ad blocker enabled state
#[tauri::command]
pub async fn toggle_adblocker(enabled: bool, state: State<'_, AdBlockerState>) -> Result<bool, String> {
    let mut config = state
        .config
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    config.enabled = enabled;
    Ok(enabled)
}

/// Toggle ad blocker category
#[tauri::command]
pub async fn toggle_adblocker_category(
    category_id: String,
    enabled: bool,
    state: State<'_, AdBlockerState>,
) -> Result<BlockCategory, String> {
    let mut config = state
        .config
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    for cat in &mut config.categories {
        if cat.id == category_id {
            cat.enabled = enabled;
            return Ok(cat.clone());
        }
    }
    
    Err(format!("Category not found: {}", category_id))
}

/// Add domain to whitelist
#[tauri::command]
pub async fn add_whitelist_domain(
    domain: String,
    reason: Option<String>,
    state: State<'_, AdBlockerState>,
) -> Result<WhitelistEntry, String> {
    let mut config = state
        .config
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    // Check if already exists
    if config.whitelist.iter().any(|w| w.domain == domain) {
        return Err(String::from("Domain already in whitelist"));
    }
    
    let entry = WhitelistEntry {
        id: format!("{}", std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis()),
        domain,
        added_at: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        reason,
    };
    
    config.whitelist.push(entry.clone());
    Ok(entry)
}

/// Remove domain from whitelist
#[tauri::command]
pub async fn remove_whitelist_domain(
    id: String,
    state: State<'_, AdBlockerState>,
) -> Result<(), String> {
    let mut config = state
        .config
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    config.whitelist.retain(|w| w.id != id);
    Ok(())
}

/// Get ad blocker statistics
#[tauri::command]
pub async fn get_adblocker_stats(state: State<'_, AdBlockerState>) -> Result<BlockingStats, String> {
    state
        .config
        .lock()
        .map(|config| config.stats.clone())
        .map_err(|e| format!("Failed to get stats: {}", e))
}

// ============================================================================
// KILL SWITCH COMMANDS
// ============================================================================

/// Get kill switch configuration
#[tauri::command]
pub async fn get_killswitch_config(state: State<'_, KillSwitchState>) -> Result<KillSwitchConfig, String> {
    state
        .config
        .lock()
        .map(|config| config.clone())
        .map_err(|e| format!("Failed to get kill switch config: {}", e))
}

/// Update kill switch configuration
#[tauri::command]
pub async fn update_killswitch_config(
    config: KillSwitchConfig,
    state: State<'_, KillSwitchState>,
) -> Result<KillSwitchConfig, String> {
    let mut current_config = state
        .config
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    *current_config = config.clone();
    Ok(config)
}

/// Toggle kill switch mode
#[tauri::command]
pub async fn toggle_killswitch_mode(
    mode: String,
    state: State<'_, KillSwitchState>,
) -> Result<String, String> {
    let mut config = state
        .config
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    config.mode = mode.clone();
    Ok(mode)
}

/// Add allowed app to kill switch
#[tauri::command]
pub async fn add_killswitch_allowed_app(
    app: SplitTunnelingApp,
    state: State<'_, KillSwitchState>,
) -> Result<SplitTunnelingApp, String> {
    let mut config = state
        .config
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    config.allowed_apps.push(app.clone());
    Ok(app)
}

/// Remove allowed app from kill switch
#[tauri::command]
pub async fn remove_killswitch_allowed_app(
    app_id: String,
    state: State<'_, KillSwitchState>,
) -> Result<(), String> {
    let mut config = state
        .config
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    config.allowed_apps.retain(|a| a.id != app_id);
    Ok(())
}

/// Get kill switch events
#[tauri::command]
pub async fn get_killswitch_events(state: State<'_, KillSwitchState>) -> Result<Vec<KillSwitchEvent>, String> {
    state
        .config
        .lock()
        .map(|config| config.events.clone())
        .map_err(|e| format!("Failed to get events: {}", e))
}

// ============================================================================
// SPLIT TUNNELING COMMANDS
// ============================================================================

/// Get split tunneling configuration
#[tauri::command]
pub async fn get_split_tunneling_config(state: State<'_, SplitTunnelState>) -> Result<SplitTunnelingConfig, String> {
    state
        .config
        .lock()
        .map(|config| config.clone())
        .map_err(|e| format!("Failed to get split tunneling config: {}", e))
}

/// Update split tunneling configuration
#[tauri::command]
pub async fn update_split_tunneling_config(
    config: SplitTunnelingConfig,
    state: State<'_, SplitTunnelState>,
) -> Result<SplitTunnelingConfig, String> {
    let mut current_config = state
        .config
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    *current_config = config.clone();
    Ok(config)
}

/// Toggle split tunneling enabled state
#[tauri::command]
pub async fn toggle_split_tunneling(
    enabled: bool,
    state: State<'_, SplitTunnelState>,
) -> Result<bool, String> {
    let mut config = state
        .config
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    config.enabled = enabled;
    Ok(enabled)
}

/// Set split tunneling mode
#[tauri::command]
pub async fn set_split_tunneling_mode(
    mode: String,
    state: State<'_, SplitTunnelState>,
) -> Result<String, String> {
    let mut config = state
        .config
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    config.mode = mode.clone();
    Ok(mode)
}

/// Toggle app inclusion in split tunneling
#[tauri::command]
pub async fn toggle_split_tunneling_app(
    app_id: String,
    is_included: bool,
    state: State<'_, SplitTunnelState>,
) -> Result<SplitTunnelingApp, String> {
    let mut config = state
        .config
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    for app in &mut config.apps {
        if app.id == app_id {
            app.is_included = is_included;
            return Ok(app.clone());
        }
    }
    
    Err(format!("App not found: {}", app_id))
}

/// Add website to split tunneling
#[tauri::command]
pub async fn add_split_tunneling_website(
    website: String,
    state: State<'_, SplitTunnelState>,
) -> Result<String, String> {
    let mut config = state
        .config
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    if !config.websites.contains(&website) {
        config.websites.push(website.clone());
    }
    Ok(website)
}

/// Remove website from split tunneling
#[tauri::command]
pub async fn remove_split_tunneling_website(
    website: String,
    state: State<'_, SplitTunnelState>,
) -> Result<(), String> {
    let mut config = state
        .config
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    config.websites.retain(|w| w != &website);
    Ok(())
}

/// Add IP range to split tunneling
#[tauri::command]
pub async fn add_split_tunneling_ip_range(
    ip_range: String,
    state: State<'_, SplitTunnelState>,
) -> Result<String, String> {
    let mut config = state
        .config
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    
    if !config.ip_ranges.contains(&ip_range) {
        config.ip_ranges.push(ip_range.clone());
    }
    Ok(ip_range)
}

/// Remove IP range from split tunneling
#[tauri::command]
pub async fn remove_split_tunneling_ip_range(
    ip_range: String,
    state: State<'_, SplitTunnelState>,
) -> Result<(), String> {
    let mut config = state
        .config
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    config.ip_ranges.retain(|r| r != &ip_range);
    Ok(())
}

/// Get installed apps for split tunneling
#[tauri::command]
pub async fn get_split_tunneling_apps(state: State<'_, SplitTunnelState>) -> Result<Vec<SplitTunnelingApp>, String> {
    state
        .config
        .lock()
        .map(|config| config.apps.clone())
        .map_err(|e| format!("Failed to get apps: {}", e))
}

// ============================================================================
// DEDICATED IP STATE AND COMMANDS
// ============================================================================

pub struct DedicatedIPState {
    config: Mutex<DedicatedIPConfig>,
}

impl Default for DedicatedIPState {
    fn default() -> Self {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        Self {
            config: Mutex::new(DedicatedIPConfig {
                dedicated_ips: vec![
                    DedicatedIP {
                        id: String::from("dip-1"),
                        ip: String::from("203.0.113.45"),
                        country: String::from("United States"),
                        country_code: String::from("US"),
                        city: String::from("New York"),
                        server: String::from("us-ny-1.vpn.cube.io"),
                        status: String::from("active"),
                        is_active: true,
                        assigned_at: now - 30 * 24 * 60 * 60,
                        expires_at: now + 335 * 24 * 60 * 60,
                        usage_stats: DedicatedIPUsageStats {
                            total_connections: 156,
                            bytes_transferred: 1024 * 1024 * 1024 * 45,
                            total_data_transferred: 1024 * 1024 * 1024 * 45,
                            average_session_duration: 9000.0,
                            last_used: now - 2 * 60 * 60,
                        },
                    },
                    DedicatedIP {
                        id: String::from("dip-2"),
                        ip: String::from("198.51.100.78"),
                        country: String::from("United Kingdom"),
                        country_code: String::from("GB"),
                        city: String::from("London"),
                        server: String::from("uk-lon-1.vpn.cube.io"),
                        status: String::from("active"),
                        is_active: false,
                        assigned_at: now - 60 * 24 * 60 * 60,
                        expires_at: now + 305 * 24 * 60 * 60,
                        usage_stats: DedicatedIPUsageStats {
                            total_connections: 89,
                            bytes_transferred: 1024 * 1024 * 1024 * 23,
                            total_data_transferred: 1024 * 1024 * 1024 * 23,
                            average_session_duration: 6480.0,
                            last_used: now - 5 * 24 * 60 * 60,
                        },
                    },
                ],
                available_locations: vec![
                    DedicatedIPLocation { country: String::from("United States"), country_code: String::from("US"), cities: vec![String::from("New York"), String::from("Los Angeles"), String::from("Chicago"), String::from("Miami")] },
                    DedicatedIPLocation { country: String::from("United Kingdom"), country_code: String::from("GB"), cities: vec![String::from("London"), String::from("Manchester")] },
                    DedicatedIPLocation { country: String::from("Germany"), country_code: String::from("DE"), cities: vec![String::from("Frankfurt"), String::from("Berlin")] },
                    DedicatedIPLocation { country: String::from("Netherlands"), country_code: String::from("NL"), cities: vec![String::from("Amsterdam")] },
                    DedicatedIPLocation { country: String::from("Japan"), country_code: String::from("JP"), cities: vec![String::from("Tokyo"), String::from("Osaka")] },
                    DedicatedIPLocation { country: String::from("Australia"), country_code: String::from("AU"), cities: vec![String::from("Sydney"), String::from("Melbourne")] },
                ],
            }),
        }
    }
}

#[tauri::command]
pub async fn get_dedicated_ip_config(state: State<'_, DedicatedIPState>) -> Result<DedicatedIPConfig, String> {
    state.config.lock().map(|c| c.clone()).map_err(|e| format!("Lock error: {}", e))
}

#[tauri::command]
pub async fn activate_dedicated_ip(ip_id: String, state: State<'_, DedicatedIPState>) -> Result<DedicatedIP, String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    for ip in &mut config.dedicated_ips {
        ip.is_active = ip.id == ip_id;
    }
    config.dedicated_ips.iter().find(|ip| ip.id == ip_id).cloned().ok_or_else(|| String::from("IP not found"))
}

// ============================================================================
// DOUBLE VPN STATE AND COMMANDS
// ============================================================================

pub struct DoubleVPNState {
    config: Mutex<DoubleVPNConfig>,
}

impl Default for DoubleVPNState {
    fn default() -> Self {
        Self {
            config: Mutex::new(DoubleVPNConfig {
                enabled: false,
                entry_servers: vec![
                    DoubleVPNServer { id: String::from("dv-e1"), name: String::from("Netherlands #1"), country: String::from("Netherlands"), country_code: String::from("NL"), city: String::from("Amsterdam"), hostname: String::from("nl-ams-dv1.cube.vpn"), ip: String::from("198.51.100.20"), load: 35, latency: 45, features: vec![String::from("double_vpn")], groups: vec![String::from("Double VPN")], is_favorite: false, is_recommended: true },
                    DoubleVPNServer { id: String::from("dv-e2"), name: String::from("Switzerland #1"), country: String::from("Switzerland"), country_code: String::from("CH"), city: String::from("Zurich"), hostname: String::from("ch-zur-dv1.cube.vpn"), ip: String::from("198.51.100.21"), load: 28, latency: 55, features: vec![String::from("double_vpn")], groups: vec![String::from("Double VPN")], is_favorite: true, is_recommended: true },
                    DoubleVPNServer { id: String::from("dv-e3"), name: String::from("Sweden #1"), country: String::from("Sweden"), country_code: String::from("SE"), city: String::from("Stockholm"), hostname: String::from("se-sto-dv1.cube.vpn"), ip: String::from("198.51.100.22"), load: 42, latency: 65, features: vec![String::from("double_vpn")], groups: vec![String::from("Double VPN")], is_favorite: false, is_recommended: false },
                    DoubleVPNServer { id: String::from("dv-e4"), name: String::from("Iceland #1"), country: String::from("Iceland"), country_code: String::from("IS"), city: String::from("Reykjavik"), hostname: String::from("is-rey-dv1.cube.vpn"), ip: String::from("198.51.100.23"), load: 18, latency: 95, features: vec![String::from("double_vpn")], groups: vec![String::from("Double VPN")], is_favorite: false, is_recommended: false },
                ],
                exit_servers: vec![
                    DoubleVPNServer { id: String::from("dv-x1"), name: String::from("United States #1"), country: String::from("United States"), country_code: String::from("US"), city: String::from("New York"), hostname: String::from("us-ny-dv1.cube.vpn"), ip: String::from("198.51.100.30"), load: 45, latency: 85, features: vec![String::from("double_vpn")], groups: vec![String::from("Double VPN")], is_favorite: false, is_recommended: true },
                    DoubleVPNServer { id: String::from("dv-x2"), name: String::from("United Kingdom #1"), country: String::from("United Kingdom"), country_code: String::from("GB"), city: String::from("London"), hostname: String::from("uk-lon-dv1.cube.vpn"), ip: String::from("198.51.100.31"), load: 52, latency: 70, features: vec![String::from("double_vpn")], groups: vec![String::from("Double VPN")], is_favorite: true, is_recommended: true },
                    DoubleVPNServer { id: String::from("dv-x3"), name: String::from("Canada #1"), country: String::from("Canada"), country_code: String::from("CA"), city: String::from("Toronto"), hostname: String::from("ca-tor-dv1.cube.vpn"), ip: String::from("198.51.100.32"), load: 38, latency: 110, features: vec![String::from("double_vpn")], groups: vec![String::from("Double VPN")], is_favorite: false, is_recommended: false },
                    DoubleVPNServer { id: String::from("dv-x4"), name: String::from("Germany #1"), country: String::from("Germany"), country_code: String::from("DE"), city: String::from("Frankfurt"), hostname: String::from("de-fra-dv1.cube.vpn"), ip: String::from("198.51.100.33"), load: 61, latency: 60, features: vec![String::from("double_vpn")], groups: vec![String::from("Double VPN")], is_favorite: false, is_recommended: false },
                ],
                preset_routes: vec![
                    DoubleVPNPresetRoute { id: String::from("route-1"), name: String::from("Maximum Privacy"), entry_country: String::from("CH"), exit_country: String::from("IS"), description: String::from("Swiss entry, Iceland exit - strongest privacy laws") },
                    DoubleVPNPresetRoute { id: String::from("route-2"), name: String::from("Streaming Optimized"), entry_country: String::from("NL"), exit_country: String::from("US"), description: String::from("Fast route optimized for streaming services") },
                    DoubleVPNPresetRoute { id: String::from("route-3"), name: String::from("European Shield"), entry_country: String::from("SE"), exit_country: String::from("GB"), description: String::from("All-European route for GDPR compliance") },
                    DoubleVPNPresetRoute { id: String::from("route-4"), name: String::from("Journalist Route"), entry_country: String::from("IS"), exit_country: String::from("NL"), description: String::from("Maximum protection for sensitive communications") },
                ],
                selected_entry: None,
                selected_exit: None,
            }),
        }
    }
}

#[tauri::command]
pub async fn get_double_vpn_config(state: State<'_, DoubleVPNState>) -> Result<DoubleVPNConfig, String> {
    state.config.lock().map(|c| c.clone()).map_err(|e| format!("Lock error: {}", e))
}

#[tauri::command]
pub async fn set_double_vpn_route(entry_id: String, exit_id: String, state: State<'_, DoubleVPNState>) -> Result<DoubleVPNConfig, String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    config.selected_entry = Some(entry_id);
    config.selected_exit = Some(exit_id);
    Ok(config.clone())
}

#[tauri::command]
pub async fn toggle_double_vpn(enabled: bool, state: State<'_, DoubleVPNState>) -> Result<bool, String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    config.enabled = enabled;
    Ok(enabled)
}

// ============================================================================
// MESHNET STATE AND COMMANDS
// ============================================================================

pub struct MeshnetState {
    config: Mutex<MeshnetConfig>,
}

impl Default for MeshnetState {
    fn default() -> Self {
        let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
        Self {
            config: Mutex::new(MeshnetConfig {
                enabled: true,
                device_name: String::from("MacBook Pro"),
                device_ip: String::from("100.64.0.1"),
                devices: vec![
                    MeshnetDevice {
                        id: String::from("device-1"),
                        name: String::from("MacBook Pro"),
                        hostname: String::from("macbook-pro.local"),
                        platform: String::from("macos"),
                        device_type: String::from("laptop"),
                        os: String::from("macOS"),
                        ip: String::from("100.64.0.1"),
                        public_key: String::from("xK9a2b3c..."),
                        is_online: true,
                        is_owned: true,
                        last_seen: now,
                        last_seen_at: now,
                        traffic_routing: true,
                        local_network_access: true,
                        permissions: MeshnetPermissions { can_route_traffic: true, can_access_local_network: true, can_send_files: true, can_be_discovered: true, allow_inbound: true, allow_outbound: true, allow_routing: true, allow_local_network: true, allow_file_sharing: true },
                        connected_since: Some(now - 2 * 60 * 60),
                    },
                    MeshnetDevice {
                        id: String::from("device-2"),
                        name: String::from("iPhone 15 Pro"),
                        hostname: String::from("iphone-15-pro.local"),
                        platform: String::from("ios"),
                        device_type: String::from("mobile"),
                        os: String::from("iOS"),
                        ip: String::from("100.64.0.2"),
                        public_key: String::from("yL8b3c4d..."),
                        is_online: true,
                        is_owned: true,
                        last_seen: now,
                        last_seen_at: now,
                        traffic_routing: false,
                        local_network_access: true,
                        permissions: MeshnetPermissions { can_route_traffic: false, can_access_local_network: true, can_send_files: true, can_be_discovered: true, allow_inbound: true, allow_outbound: true, allow_routing: false, allow_local_network: true, allow_file_sharing: true },
                        connected_since: Some(now - 30 * 60),
                    },
                ],
                invitations: vec![],
            }),
        }
    }
}

#[tauri::command]
pub async fn get_meshnet_config(state: State<'_, MeshnetState>) -> Result<MeshnetConfig, String> {
    state.config.lock().map(|c| c.clone()).map_err(|e| format!("Lock error: {}", e))
}

#[tauri::command]
pub async fn toggle_meshnet(enabled: bool, state: State<'_, MeshnetState>) -> Result<bool, String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    config.enabled = enabled;
    Ok(enabled)
}

#[tauri::command]
pub async fn send_meshnet_invitation(email: String, state: State<'_, MeshnetState>) -> Result<MeshnetInvitation, String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
    let invitation = MeshnetInvitation {
        id: format!("inv-{}", now),
        email,
        sent_at: now,
        expires_at: now + 7 * 24 * 60 * 60,
        status: String::from("pending"),
    };
    config.invitations.push(invitation.clone());
    Ok(invitation)
}

// ============================================================================
// THREAT PROTECTION STATE AND COMMANDS
// ============================================================================

pub struct ThreatProtectionState {
    config: Mutex<ThreatProtectionConfig>,
}

impl Default for ThreatProtectionState {
    fn default() -> Self {
        let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
        Self {
            config: Mutex::new(ThreatProtectionConfig {
                enabled: true,
                events: vec![
                    ThreatEvent { id: String::from("te-1"), threat_type: String::from("malware"), severity: String::from("critical"), domain: String::from("malicious-download.xyz"), url: String::from("https://malicious-download.xyz/virus.exe"), timestamp: now - 5 * 60, blocked_at: now - 5 * 60, source: String::from("download"), action: String::from("blocked"), action_taken: String::from("blocked"), category: String::from("security"), description: String::from("Malware download blocked") },
                    ThreatEvent { id: String::from("te-2"), threat_type: String::from("tracker"), severity: String::from("low"), domain: String::from("analytics.trackernetwork.com"), url: String::from("https://analytics.trackernetwork.com/track.js"), timestamp: now - 15 * 60, blocked_at: now - 15 * 60, source: String::from("website"), action: String::from("blocked"), action_taken: String::from("blocked"), category: String::from("privacy"), description: String::from("Tracking script blocked") },
                    ThreatEvent { id: String::from("te-3"), threat_type: String::from("ad"), severity: String::from("low"), domain: String::from("ads.megaadserver.net"), url: String::from("https://ads.megaadserver.net/banner.jpg"), timestamp: now - 20 * 60, blocked_at: now - 20 * 60, source: String::from("website"), action: String::from("blocked"), action_taken: String::from("blocked"), category: String::from("ads"), description: String::from("Advertisement blocked") },
                    ThreatEvent { id: String::from("te-4"), threat_type: String::from("phishing"), severity: String::from("high"), domain: String::from("paypa1-secure.com"), url: String::from("https://paypa1-secure.com/login"), timestamp: now - 30 * 60, blocked_at: now - 30 * 60, source: String::from("website"), action: String::from("blocked"), action_taken: String::from("blocked"), category: String::from("security"), description: String::from("Phishing site blocked") },
                ],
                stats: ThreatStats {
                    malware_blocked: 47,
                    trackers_blocked: 3456,
                    ads_blocked: 8924,
                    phishing_blocked: 15,
                    crypto_miners_blocked: 23,
                    total_threats_blocked: 12465,
                    last_updated: now,
                    period_start: now - 30 * 24 * 60 * 60,
                    period_end: now,
                },
                dns_categories: vec![
                    DNSCategory { id: String::from("malware"), label: String::from("Malware & Ransomware"), description: String::from("Known malicious domains and threat actors"), blocked: true },
                    DNSCategory { id: String::from("phishing"), label: String::from("Phishing & Fraud"), description: String::from("Fake websites and scam attempts"), blocked: true },
                    DNSCategory { id: String::from("ads"), label: String::from("Advertising"), description: String::from("Ad networks and tracking pixels"), blocked: true },
                    DNSCategory { id: String::from("trackers"), label: String::from("Trackers & Analytics"), description: String::from("User tracking and fingerprinting"), blocked: true },
                    DNSCategory { id: String::from("crypto_mining"), label: String::from("Crypto Mining"), description: String::from("Browser-based cryptocurrency miners"), blocked: true },
                    DNSCategory { id: String::from("adult"), label: String::from("Adult Content"), description: String::from("Explicit and mature content"), blocked: false },
                    DNSCategory { id: String::from("gambling"), label: String::from("Gambling"), description: String::from("Betting and gambling sites"), blocked: false },
                    DNSCategory { id: String::from("social_media"), label: String::from("Social Media"), description: String::from("Social networking platforms"), blocked: false },
                ],
                whitelist: vec![],
            }),
        }
    }
}

#[tauri::command]
pub async fn get_threat_protection_config(state: State<'_, ThreatProtectionState>) -> Result<ThreatProtectionConfig, String> {
    state.config.lock().map(|c| c.clone()).map_err(|e| format!("Lock error: {}", e))
}

#[tauri::command]
pub async fn toggle_threat_protection(enabled: bool, state: State<'_, ThreatProtectionState>) -> Result<bool, String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    config.enabled = enabled;
    Ok(enabled)
}

#[tauri::command]
pub async fn toggle_dns_category(category_id: String, blocked: bool, state: State<'_, ThreatProtectionState>) -> Result<DNSCategory, String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    for cat in &mut config.dns_categories {
        if cat.id == category_id {
            cat.blocked = blocked;
            return Ok(cat.clone());
        }
    }
    Err(format!("Category not found: {}", category_id))
}

#[tauri::command]
pub async fn get_threat_stats(state: State<'_, ThreatProtectionState>) -> Result<ThreatStats, String> {
    state.config.lock().map(|c| c.stats.clone()).map_err(|e| format!("Lock error: {}", e))
}

#[tauri::command]
pub async fn get_threat_events(state: State<'_, ThreatProtectionState>) -> Result<Vec<ThreatEvent>, String> {
    state.config.lock().map(|c| c.events.clone()).map_err(|e| format!("Lock error: {}", e))
}