use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VpnConnection {
    pub id: String,
    pub name: String,
    pub server: String,
    pub port: u16,
    pub protocol: String, // "openvpn", "wireguard", "ipsec"
    pub username: Option<String>,
    pub password: Option<String>, // Encrypted
    pub config_file_path: Option<String>,
    pub is_connected: bool,
    pub is_auto_connect: bool,
    pub last_connected_at: Option<i64>,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VpnStatus {
    pub is_connected: bool,
    pub connection_id: Option<String>,
    pub server: Option<String>,
    pub ip_address: Option<String>,
    pub location: Option<String>,
    pub connected_since: Option<i64>,
    pub bytes_sent: i64,
    pub bytes_received: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VpnServer {
    pub id: String,
    pub name: String,
    pub country: String,
    pub city: String,
    pub ip_address: String,
    pub load_percentage: i32,
    pub ping_ms: i32,
    pub is_premium: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VpnStats {
    pub total_connections: i32,
    pub active_connection: Option<String>,
    pub total_bytes_sent: i64,
    pub total_bytes_received: i64,
    pub total_connection_time_seconds: i64,
}
