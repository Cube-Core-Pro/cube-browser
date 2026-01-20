use anyhow::{Context, Result};
use base64::{engine::general_purpose, Engine as _};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager};

/// VPN Connection Types - Enterprise Support
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum VpnType {
    OpenVPN,   // .ovpn files
    WireGuard, // .conf files
    SOCKS5,    // SOCKS5 proxy
    L2TP,      // L2TP/IPSec
    PPTP,      // PPTP (legacy)
    IKEv2,     // IKEv2/IPSec
    SSTP,      // SSTP (Microsoft)
}

/// VPN Configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VpnConfig {
    pub id: String,
    pub name: String,
    pub vpn_type: VpnType,
    pub config_file: Option<PathBuf>,
    pub server: String,
    pub port: u16,
    pub username: Option<String>,
    pub password_encrypted: Option<String>, // AES-256 encrypted
    pub auto_reconnect: bool,
    pub kill_switch: bool,
    pub dns_leak_protection: bool,
    pub split_tunneling: bool,
    pub split_tunnel_apps: Vec<String>,
    pub created_at: u64,
    pub last_used: Option<u64>,
}

/// VPN Connection Status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum VpnStatus {
    Disconnected,
    Connecting,
    Connected,
    Disconnecting,
    Reconnecting,
    Error,
}

/// VPN Statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VpnStats {
    pub bytes_sent: u64,
    pub bytes_received: u64,
    pub connection_time: u64,
    pub ip_address: Option<String>,
    pub server_location: Option<String>,
}

/// VPN Manager Service - Enterprise Level
pub struct VpnManager {
    configs: Arc<Mutex<HashMap<String, VpnConfig>>>,
    active_connection: Arc<Mutex<Option<String>>>,
    connection_status: Arc<Mutex<VpnStatus>>,
    connection_stats: Arc<Mutex<VpnStats>>,
    app_handle: AppHandle,
    config_dir: PathBuf,
}

impl VpnManager {
    pub fn new(app_handle: AppHandle) -> Result<Self> {
        // Get app data directory for VPN configs
        let config_dir = app_handle
            .path()
            .app_data_dir()
            .context("Failed to get app data directory")?
            .join("vpn_configs");

        // Create directory if it doesn't exist
        fs::create_dir_all(&config_dir)?;

        Ok(Self {
            configs: Arc::new(Mutex::new(HashMap::new())),
            active_connection: Arc::new(Mutex::new(None)),
            connection_status: Arc::new(Mutex::new(VpnStatus::Disconnected)),
            connection_stats: Arc::new(Mutex::new(VpnStats {
                bytes_sent: 0,
                bytes_received: 0,
                connection_time: 0,
                ip_address: None,
                server_location: None,
            })),
            app_handle,
            config_dir,
        })
    }

    /// Import VPN configuration from file
    pub fn import_config(&self, file_path: PathBuf, name: String) -> Result<String> {
        let config_id = uuid::Uuid::new_v4().to_string();

        // Detect VPN type from file extension
        let vpn_type = self.detect_vpn_type(&file_path)?;

        // Copy config file to app data directory
        let dest_path = self.config_dir.join(format!("{}.conf", config_id));
        fs::copy(&file_path, &dest_path)?;

        // Parse config for server/port
        let (server, port) = self.parse_config_file(&dest_path, &vpn_type)?;

        let config = VpnConfig {
            id: config_id.clone(),
            name,
            vpn_type,
            config_file: Some(dest_path),
            server,
            port,
            username: None,
            password_encrypted: None,
            auto_reconnect: true,
            kill_switch: true,
            dns_leak_protection: true,
            split_tunneling: false,
            split_tunnel_apps: Vec::new(),
            created_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)?
                .as_secs(),
            last_used: None,
        };

        let mut configs = self.configs.lock().unwrap();
        configs.insert(config_id.clone(), config);

        Ok(config_id)
    }

    /// Create manual VPN configuration (SOCKS5, L2TP, etc.)
    pub fn create_manual_config(
        &self,
        name: String,
        vpn_type: VpnType,
        server: String,
        port: u16,
        username: Option<String>,
        password: Option<String>,
    ) -> Result<String> {
        let config_id = uuid::Uuid::new_v4().to_string();

        // Encrypt password if provided
        let password_encrypted = if let Some(pwd) = password {
            Some(self.encrypt_password(&pwd)?)
        } else {
            None
        };

        let config = VpnConfig {
            id: config_id.clone(),
            name,
            vpn_type,
            config_file: None,
            server,
            port,
            username,
            password_encrypted,
            auto_reconnect: true,
            kill_switch: true,
            dns_leak_protection: true,
            split_tunneling: false,
            split_tunnel_apps: Vec::new(),
            created_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)?
                .as_secs(),
            last_used: None,
        };

        let mut configs = self.configs.lock().unwrap();
        configs.insert(config_id.clone(), config);

        Ok(config_id)
    }

    /// Connect to VPN
    pub fn connect(&self, config_id: &str) -> Result<()> {
        let configs = self.configs.lock().unwrap();
        let config = configs
            .get(config_id)
            .context("VPN configuration not found")?
            .clone();
        drop(configs);

        // Update status
        {
            let mut status = self.connection_status.lock().unwrap();
            *status = VpnStatus::Connecting;
        }

        // Connect based on VPN type
        match config.vpn_type {
            VpnType::OpenVPN => self.connect_openvpn(&config)?,
            VpnType::WireGuard => self.connect_wireguard(&config)?,
            VpnType::SOCKS5 => self.connect_socks5(&config)?,
            VpnType::L2TP => self.connect_l2tp(&config)?,
            VpnType::PPTP => self.connect_pptp(&config)?,
            VpnType::IKEv2 => self.connect_ikev2(&config)?,
            VpnType::SSTP => self.connect_sstp(&config)?,
        }

        // Update active connection
        {
            let mut active = self.active_connection.lock().unwrap();
            *active = Some(config_id.to_string());
        }

        // Update status to connected
        {
            let mut status = self.connection_status.lock().unwrap();
            *status = VpnStatus::Connected;
        }

        // Update last used
        {
            let mut configs = self.configs.lock().unwrap();
            if let Some(cfg) = configs.get_mut(config_id) {
                cfg.last_used = Some(
                    std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap()
                        .as_secs(),
                );
            }
        }

        Ok(())
    }

    /// Disconnect from VPN
    pub fn disconnect(&self) -> Result<()> {
        let active = self.active_connection.lock().unwrap().clone();

        if let Some(config_id) = active {
            let configs = self.configs.lock().unwrap();
            if let Some(config) = configs.get(&config_id) {
                // Update status
                {
                    let mut status = self.connection_status.lock().unwrap();
                    *status = VpnStatus::Disconnecting;
                }

                // Disconnect based on VPN type
                match config.vpn_type {
                    VpnType::OpenVPN => self.disconnect_openvpn()?,
                    VpnType::WireGuard => self.disconnect_wireguard()?,
                    VpnType::SOCKS5 => self.disconnect_socks5()?,
                    _ => {} // Other types
                }
            }
        }

        // Clear active connection
        {
            let mut active = self.active_connection.lock().unwrap();
            *active = None;
        }

        // Update status
        {
            let mut status = self.connection_status.lock().unwrap();
            *status = VpnStatus::Disconnected;
        }

        Ok(())
    }

    /// Get all VPN configurations
    pub fn get_configs(&self) -> Vec<VpnConfig> {
        let configs = self.configs.lock().unwrap();
        configs.values().cloned().collect()
    }

    /// Get VPN status
    pub fn get_status(&self) -> VpnStatus {
        self.connection_status.lock().unwrap().clone()
    }

    /// Get connection statistics
    pub fn get_stats(&self) -> VpnStats {
        self.connection_stats.lock().unwrap().clone()
    }

    /// Delete VPN configuration
    pub fn delete_config(&self, config_id: &str) -> Result<()> {
        // Disconnect if active
        let active = self.active_connection.lock().unwrap().clone();
        if active == Some(config_id.to_string()) {
            self.disconnect()?;
        }

        // Remove config file
        let mut configs = self.configs.lock().unwrap();
        if let Some(config) = configs.remove(config_id) {
            if let Some(config_file) = config.config_file {
                let _ = fs::remove_file(config_file);
            }
        }

        Ok(())
    }

    // ========================================================================
    // PRIVATE HELPER METHODS
    // ========================================================================

    fn detect_vpn_type(&self, file_path: &PathBuf) -> Result<VpnType> {
        let extension = file_path
            .extension()
            .and_then(|s| s.to_str())
            .context("Invalid file extension")?;

        match extension {
            "ovpn" => Ok(VpnType::OpenVPN),
            "conf" => Ok(VpnType::WireGuard),
            _ => Err(anyhow::anyhow!("Unsupported VPN file type")),
        }
    }

    fn parse_config_file(&self, file_path: &PathBuf, vpn_type: &VpnType) -> Result<(String, u16)> {
        let content = fs::read_to_string(file_path)?;

        match vpn_type {
            VpnType::OpenVPN => self.parse_openvpn_config(&content),
            VpnType::WireGuard => self.parse_wireguard_config(&content),
            _ => Ok(("unknown".to_string(), 0)),
        }
    }

    fn parse_openvpn_config(&self, content: &str) -> Result<(String, u16)> {
        let mut server = String::new();
        let mut port = 1194u16;

        for line in content.lines() {
            let line = line.trim();
            if line.starts_with("remote ") {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 2 {
                    server = parts[1].to_string();
                }
                if parts.len() >= 3 {
                    port = parts[2].parse().unwrap_or(1194);
                }
            }
        }

        Ok((server, port))
    }

    fn parse_wireguard_config(&self, content: &str) -> Result<(String, u16)> {
        let mut server = String::new();
        let mut port = 51820u16;

        for line in content.lines() {
            let line = line.trim();
            if line.starts_with("Endpoint") {
                if let Some(value) = line.split('=').nth(1) {
                    let value = value.trim();
                    let parts: Vec<&str> = value.split(':').collect();
                    if !parts.is_empty() {
                        server = parts[0].to_string();
                    }
                    if parts.len() >= 2 {
                        port = parts[1].parse().unwrap_or(51820);
                    }
                }
            }
        }

        Ok((server, port))
    }

    fn encrypt_password(&self, password: &str) -> Result<String> {
        use aes_gcm::{
            aead::{Aead, KeyInit},
            Aes256Gcm,
        };
        use rand::Rng;
        use sha2::{Digest, Sha256};

        // Derive key from master password (or use env var)
        let master_password = std::env::var("CUBE_MASTER_PASSWORD")
            .unwrap_or_else(|_| "CUBE_ELITE_V6_DEFAULT_KEY".to_string());

        let mut hasher = Sha256::new();
        hasher.update(master_password.as_bytes());
        let key_bytes = hasher.finalize();

        // Initialize cipher
        let cipher = Aes256Gcm::new(&key_bytes);

        // Generate random nonce
        let mut rng = rand::thread_rng();
        let nonce_bytes: [u8; 12] = rng.gen();
        let nonce = (&nonce_bytes).into();

        // Encrypt password
        let ciphertext = cipher
            .encrypt(nonce, password.as_bytes())
            .map_err(|e| anyhow::anyhow!("Encryption failed: {}", e))?;

        // Combine nonce + ciphertext and encode
        let mut result = nonce_bytes.to_vec();
        result.extend_from_slice(&ciphertext);
        Ok(general_purpose::STANDARD.encode(&result))
    }

    // VPN Connection Methods
    fn connect_openvpn(&self, config: &VpnConfig) -> Result<()> {
        #[cfg(target_os = "macos")]
        {
            // macOS: Use openvpn3 or tunnelblick
            if let Some(config_file) = &config.config_file {
                Command::new("openvpn3")
                    .args(["session-start", "--config", config_file.to_str().unwrap()])
                    .stdout(Stdio::null())
                    .stderr(Stdio::null())
                    .spawn()?;
            }
        }

        #[cfg(target_os = "windows")]
        {
            // Windows: Use OpenVPN
            if let Some(config_file) = &config.config_file {
                Command::new("openvpn")
                    .args(&["--config", config_file.to_str().unwrap()])
                    .stdout(Stdio::null())
                    .stderr(Stdio::null())
                    .spawn()?;
            }
        }

        #[cfg(target_os = "linux")]
        {
            // Linux: Use openvpn
            if let Some(config_file) = &config.config_file {
                Command::new("openvpn")
                    .args(&["--config", config_file.to_str().unwrap()])
                    .stdout(Stdio::null())
                    .stderr(Stdio::null())
                    .spawn()?;
            }
        }

        Ok(())
    }

    fn connect_wireguard(&self, config: &VpnConfig) -> Result<()> {
        #[cfg(any(target_os = "macos", target_os = "linux"))]
        {
            if let Some(config_file) = &config.config_file {
                Command::new("wg-quick")
                    .args(["up", config_file.to_str().unwrap()])
                    .stdout(Stdio::null())
                    .stderr(Stdio::null())
                    .spawn()?;
            }
        }

        #[cfg(target_os = "windows")]
        {
            // Windows: Use wireguard-go or wireguard.exe
            if let Some(config_file) = &config.config_file {
                Command::new("wireguard")
                    .args(&["/installtunnelservice", config_file.to_str().unwrap()])
                    .stdout(Stdio::null())
                    .stderr(Stdio::null())
                    .spawn()?;
            }
        }

        Ok(())
    }

    fn connect_socks5(&self, config: &VpnConfig) -> Result<()> {
        // Set system SOCKS5 proxy
        #[cfg(target_os = "macos")]
        {
            Command::new("networksetup")
                .args([
                    "-setsocksfirewallproxy",
                    "Wi-Fi",
                    &config.server,
                    &config.port.to_string(),
                ])
                .spawn()?;
        }

        #[cfg(target_os = "windows")]
        {
            // Windows: Set registry proxy settings
            Command::new("reg")
                .args(&[
                    "add",
                    "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings",
                    "/v",
                    "ProxyServer",
                    "/t",
                    "REG_SZ",
                    "/d",
                    &format!("socks={}:{}", config.server, config.port),
                    "/f",
                ])
                .spawn()?;
        }

        Ok(())
    }

    fn connect_l2tp(&self, config: &VpnConfig) -> Result<()> {
        // Platform-specific L2TP connection
        #[cfg(target_os = "macos")]
        {
            // Use scutil to create VPN connection
            Command::new("scutil")
                .args(["--nc", "start", &config.name])
                .spawn()?;
        }

        #[cfg(target_os = "windows")]
        {
            // Use rasdial
            Command::new("rasdial")
                .args(&[
                    &config.name,
                    config.username.as_ref().unwrap_or(&String::new()),
                ])
                .spawn()?;
        }

        Ok(())
    }

    fn connect_pptp(&self, _config: &VpnConfig) -> Result<()> {
        // PPTP implementation (legacy, not recommended)
        Ok(())
    }

    fn connect_ikev2(&self, _config: &VpnConfig) -> Result<()> {
        // IKEv2 implementation
        Ok(())
    }

    fn connect_sstp(&self, _config: &VpnConfig) -> Result<()> {
        // SSTP implementation (Microsoft)
        Ok(())
    }

    fn disconnect_openvpn(&self) -> Result<()> {
        #[cfg(any(target_os = "macos", target_os = "linux"))]
        {
            Command::new("killall").args(["openvpn"]).spawn()?;
        }

        #[cfg(target_os = "windows")]
        {
            Command::new("taskkill")
                .args(&["/IM", "openvpn.exe", "/F"])
                .spawn()?;
        }

        Ok(())
    }

    fn disconnect_wireguard(&self) -> Result<()> {
        #[cfg(any(target_os = "macos", target_os = "linux"))]
        {
            Command::new("wg-quick").args(["down", "all"]).spawn()?;
        }

        #[cfg(target_os = "windows")]
        {
            Command::new("wireguard")
                .args(&["/uninstalltunnelservice", "*"])
                .spawn()?;
        }

        Ok(())
    }

    fn disconnect_socks5(&self) -> Result<()> {
        #[cfg(target_os = "macos")]
        {
            Command::new("networksetup")
                .args(["-setsocksfirewallproxystate", "Wi-Fi", "off"])
                .spawn()?;
        }

        #[cfg(target_os = "windows")]
        {
            Command::new("reg")
                .args(&[
                    "delete",
                    "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings",
                    "/v",
                    "ProxyServer",
                    "/f",
                ])
                .spawn()?;
        }

        Ok(())
    }
}
