use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::process::{Command, Stdio};
use std::sync::{Arc, Mutex};
use tauri::AppHandle;

/// RDP Connection Quality
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum RdpQuality {
    Low,
    Medium,
    High,
    Automatic,
}

/// RDP Color Depth
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RdpColorDepth {
    Color15Bit,
    Color16Bit,
    Color24Bit,
    Color32Bit,
}

/// RDP Configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RdpConfig {
    pub id: String,
    pub name: String,
    pub host: String,
    pub port: u16, // Default: 3389
    pub username: String,
    pub password_encrypted: Option<String>,
    pub domain: Option<String>,
    pub fullscreen: bool,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub color_depth: RdpColorDepth,
    pub quality: RdpQuality,
    pub enable_audio: bool,
    pub enable_clipboard: bool,
    pub enable_file_transfer: bool,
    pub enable_printer: bool,
    pub multi_monitor: bool,
    pub gateway_enabled: bool,
    pub gateway_host: Option<String>,
    pub gateway_username: Option<String>,
    pub created_at: u64,
    pub last_used: Option<u64>,
}

/// RDP Session Status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum RdpStatus {
    Disconnected,
    Connecting,
    Connected,
    Reconnecting,
    Error,
}

/// RDP Session Information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RdpSession {
    pub session_id: String,
    pub config_id: String,
    pub status: RdpStatus,
    pub connected_at: Option<u64>,
    pub bytes_sent: u64,
    pub bytes_received: u64,
}

/// RDP Manager Service - Native Protocol Support
pub struct RdpManager {
    configs: Arc<Mutex<HashMap<String, RdpConfig>>>,
    active_sessions: Arc<Mutex<HashMap<String, RdpSession>>>,
    app_handle: AppHandle,
}

impl RdpManager {
    pub fn new(app_handle: AppHandle) -> Result<Self> {
        Ok(Self {
            configs: Arc::new(Mutex::new(HashMap::new())),
            active_sessions: Arc::new(Mutex::new(HashMap::new())),
            app_handle,
        })
    }

    /// Create new RDP configuration
    pub fn create_config(
        &self,
        name: String,
        host: String,
        port: Option<u16>,
        username: String,
        password: Option<String>,
        domain: Option<String>,
    ) -> Result<String> {
        let config_id = uuid::Uuid::new_v4().to_string();

        let password_encrypted = if let Some(pwd) = password {
            Some(self.encrypt_password(&pwd)?)
        } else {
            None
        };

        let config = RdpConfig {
            id: config_id.clone(),
            name,
            host,
            port: port.unwrap_or(3389),
            username,
            password_encrypted,
            domain,
            fullscreen: false,
            width: Some(1920),
            height: Some(1080),
            color_depth: RdpColorDepth::Color32Bit,
            quality: RdpQuality::High,
            enable_audio: true,
            enable_clipboard: true,
            enable_file_transfer: true,
            enable_printer: false,
            multi_monitor: false,
            gateway_enabled: false,
            gateway_host: None,
            gateway_username: None,
            created_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)?
                .as_secs(),
            last_used: None,
        };

        let mut configs = self.configs.lock().unwrap();
        configs.insert(config_id.clone(), config);

        Ok(config_id)
    }

    /// Connect to RDP session
    pub fn connect(&self, config_id: &str) -> Result<String> {
        let configs = self.configs.lock().unwrap();
        let config = configs
            .get(config_id)
            .context("RDP configuration not found")?
            .clone();
        drop(configs);

        let session_id = uuid::Uuid::new_v4().to_string();

        // Create session
        let session = RdpSession {
            session_id: session_id.clone(),
            config_id: config_id.to_string(),
            status: RdpStatus::Connecting,
            connected_at: None,
            bytes_sent: 0,
            bytes_received: 0,
        };

        {
            let mut sessions = self.active_sessions.lock().unwrap();
            sessions.insert(session_id.clone(), session);
        }

        // Platform-specific RDP connection
        #[cfg(target_os = "windows")]
        self.connect_windows_rdp(&config, &session_id)?;

        #[cfg(target_os = "macos")]
        self.connect_macos_rdp(&config, &session_id)?;

        #[cfg(target_os = "linux")]
        self.connect_linux_rdp(&config, &session_id)?;

        // Update session status
        {
            let mut sessions = self.active_sessions.lock().unwrap();
            if let Some(session) = sessions.get_mut(&session_id) {
                session.status = RdpStatus::Connected;
                session.connected_at = Some(
                    std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)?
                        .as_secs(),
                );
            }
        }

        Ok(session_id)
    }

    /// Disconnect RDP session
    pub fn disconnect(&self, session_id: &str) -> Result<()> {
        let mut sessions = self.active_sessions.lock().unwrap();
        if let Some(session) = sessions.remove(session_id) {
            // Platform-specific disconnect
            #[cfg(target_os = "windows")]
            self.disconnect_windows_rdp(&session)?;

            #[cfg(target_os = "macos")]
            self.disconnect_macos_rdp(&session)?;

            #[cfg(target_os = "linux")]
            self.disconnect_linux_rdp(&session)?;
        }

        Ok(())
    }

    /// Get all RDP configurations
    pub fn get_configs(&self) -> Vec<RdpConfig> {
        let configs = self.configs.lock().unwrap();
        configs.values().cloned().collect()
    }

    /// Get active RDP sessions
    pub fn get_active_sessions(&self) -> Vec<RdpSession> {
        let sessions = self.active_sessions.lock().unwrap();
        sessions.values().cloned().collect()
    }

    /// Delete RDP configuration
    pub fn delete_config(&self, config_id: &str) -> Result<()> {
        // Disconnect any active sessions using this config
        let sessions_to_disconnect: Vec<String> = {
            let sessions = self.active_sessions.lock().unwrap();
            sessions
                .iter()
                .filter(|(_, s)| s.config_id == config_id)
                .map(|(id, _)| id.clone())
                .collect()
        };

        for session_id in sessions_to_disconnect {
            self.disconnect(&session_id)?;
        }

        // Remove configuration
        let mut configs = self.configs.lock().unwrap();
        configs.remove(config_id);

        Ok(())
    }

    // ========================================================================
    // PLATFORM-SPECIFIC IMPLEMENTATIONS
    // ========================================================================

    #[cfg(target_os = "windows")]
    fn connect_windows_rdp(&self, config: &RdpConfig, _session_id: &str) -> Result<()> {
        // Use mstsc.exe (Microsoft Terminal Services Client)
        let mut args = vec![format!("/v:{}", config.host)];

        if config.fullscreen {
            args.push("/f".to_string());
        } else if let (Some(w), Some(h)) = (config.width, config.height) {
            args.push(format!("/w:{}", w));
            args.push(format!("/h:{}", h));
        }

        if config.multi_monitor {
            args.push("/multimon".to_string());
        }

        if !config.enable_audio {
            args.push("/audio-mode:2".to_string()); // Don't play audio
        }

        Command::new("mstsc.exe")
            .args(&args)
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()?;

        Ok(())
    }

    #[cfg(target_os = "macos")]
    fn connect_macos_rdp(&self, config: &RdpConfig, _session_id: &str) -> Result<()> {
        // Use FreeRDP or Microsoft Remote Desktop (if installed)
        let mut args = vec![
            format!("/v:{}:{}", config.host, config.port),
            format!("/u:{}", config.username),
        ];

        if let Some(domain) = &config.domain {
            args.push(format!("/d:{}", domain));
        }

        if config.fullscreen {
            args.push("/f".to_string());
        } else if let (Some(w), Some(h)) = (config.width, config.height) {
            args.push(format!("/size:{}x{}", w, h));
        }

        if config.enable_clipboard {
            args.push("+clipboard".to_string());
        }

        if config.enable_audio {
            args.push("/sound:sys:alsa".to_string());
        }

        // Try xfreerdp first, fall back to Microsoft Remote Desktop
        let result = Command::new("xfreerdp")
            .args(&args)
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn();

        if result.is_err() {
            // Try Microsoft Remote Desktop
            Command::new("open")
                .args([
                    "-a",
                    "Microsoft Remote Desktop",
                    &format!("rdp://{}:{}", config.host, config.port),
                ])
                .spawn()?;
        }

        Ok(())
    }

    #[cfg(target_os = "linux")]
    fn connect_linux_rdp(&self, config: &RdpConfig, _session_id: &str) -> Result<()> {
        // Use FreeRDP (xfreerdp) or rdesktop
        let mut args = vec![
            format!("/v:{}:{}", config.host, config.port),
            format!("/u:{}", config.username),
        ];

        if let Some(domain) = &config.domain {
            args.push(format!("/d:{}", domain));
        }

        if config.fullscreen {
            args.push("/f".to_string());
        } else if let (Some(w), Some(h)) = (config.width, config.height) {
            args.push(format!("/size:{}x{}", w, h));
        }

        if config.enable_clipboard {
            args.push("+clipboard".to_string());
        }

        if config.enable_audio {
            args.push("/sound:sys:alsa".to_string());
        }

        if config.enable_printer {
            args.push("+printer".to_string());
        }

        // Try xfreerdp
        let result = Command::new("xfreerdp")
            .args(&args)
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn();

        if result.is_err() {
            // Fall back to rdesktop
            let mut rdesktop_args = vec![
                "-u",
                &config.username,
                &format!("{}:{}", config.host, config.port),
            ];

            if config.fullscreen {
                rdesktop_args.push("-f");
            }

            Command::new("rdesktop").args(&rdesktop_args).spawn()?;
        }

        Ok(())
    }

    #[cfg(target_os = "windows")]
    fn disconnect_windows_rdp(&self, _session: &RdpSession) -> Result<()> {
        // Terminate mstsc process
        Command::new("taskkill")
            .args(&["/IM", "mstsc.exe", "/F"])
            .spawn()?;
        Ok(())
    }

    #[cfg(target_os = "macos")]
    fn disconnect_macos_rdp(&self, _session: &RdpSession) -> Result<()> {
        // Kill xfreerdp or Microsoft Remote Desktop
        Command::new("killall")
            .args(["xfreerdp", "Microsoft Remote Desktop"])
            .spawn()?;
        Ok(())
    }

    #[cfg(target_os = "linux")]
    fn disconnect_linux_rdp(&self, _session: &RdpSession) -> Result<()> {
        // Kill xfreerdp or rdesktop
        Command::new("killall")
            .args(&["xfreerdp", "rdesktop"])
            .spawn()?;
        Ok(())
    }

    /// Update RDP configuration display settings
    pub fn update_config(
        &self,
        config_id: &str,
        fullscreen: Option<bool>,
        width: Option<u32>,
        height: Option<u32>,
        color_depth: Option<RdpColorDepth>,
        quality: Option<RdpQuality>,
    ) -> Result<()> {
        let mut configs = self.configs.lock().unwrap();
        let config = configs
            .get_mut(config_id)
            .context("RDP configuration not found")?;

        if let Some(fs) = fullscreen {
            config.fullscreen = fs;
        }
        if let Some(w) = width {
            config.width = Some(w);
        }
        if let Some(h) = height {
            config.height = Some(h);
        }
        if let Some(cd) = color_depth {
            config.color_depth = cd;
        }
        if let Some(q) = quality {
            config.quality = q;
        }

        Ok(())
    }

    /// Test RDP connection by checking TCP port availability
    pub async fn test_connection(&self, config_id: &str) -> Result<bool> {
        let config = {
            let configs = self.configs.lock().unwrap();
            configs
                .get(config_id)
                .context("RDP configuration not found")?
                .clone()
        };

        // Test TCP connection to RDP port
        let addr = format!("{}:{}", config.host, config.port);
        
        match tokio::time::timeout(
            std::time::Duration::from_secs(5),
            tokio::net::TcpStream::connect(&addr),
        )
        .await
        {
            Ok(Ok(_)) => {
                log::info!("✅ RDP connection test successful: {}", addr);
                Ok(true)
            }
            Ok(Err(e)) => {
                log::warn!("❌ RDP connection test failed: {} - {}", addr, e);
                Ok(false)
            }
            Err(_) => {
                log::warn!("❌ RDP connection test timeout: {}", addr);
                Ok(false)
            }
        }
    }

    /// Update last used timestamp
    pub fn mark_config_used(&self, config_id: &str) -> Result<()> {
        let mut configs = self.configs.lock().unwrap();
        if let Some(config) = configs.get_mut(config_id) {
            config.last_used = Some(
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)?
                    .as_secs(),
            );
        }
        Ok(())
    }

    fn encrypt_password(&self, password: &str) -> Result<String> {
        // Use AES-256-GCM encryption (same as VPN and FTP manager)
        use aes_gcm::{
            aead::{Aead, KeyInit},
            Aes256Gcm,
        };
        use rand::Rng;
        use sha2::{Digest, Sha256};

        // Derive key from master password
        let master_password = std::env::var("CUBE_MASTER_PASSWORD")
            .unwrap_or_else(|_| "CUBE_ELITE_V6_RDP_KEY".to_string());

        let mut hasher = Sha256::new();
        hasher.update(master_password.as_bytes());
        let key_bytes = hasher.finalize();

        // Initialize AES-256-GCM cipher
        let cipher = Aes256Gcm::new(&key_bytes);

        // Generate random 12-byte nonce
        let mut rng = rand::thread_rng();
        let nonce_bytes: [u8; 12] = rng.gen();
        let nonce = (&nonce_bytes).into();

        // Encrypt password
        let ciphertext = cipher
            .encrypt(nonce, password.as_bytes())
            .map_err(|e| anyhow::anyhow!("Encryption failed: {}", e))?;

        // Combine nonce + ciphertext and encode base64
        let mut result = nonce_bytes.to_vec();
        result.extend_from_slice(&ciphertext);

        use base64::{engine::general_purpose, Engine as _};
        Ok(general_purpose::STANDARD.encode(&result))
    }
}
