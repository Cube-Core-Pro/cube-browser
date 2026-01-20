use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::AppHandle;

/// SSH Key Type
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SshKeyType {
    RSA2048,
    RSA4096,
    ED25519,
    ECDSA,
}

/// SSH Connection Configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SshConfig {
    pub id: String,
    pub name: String,
    pub host: String,
    pub port: u16, // Default: 22
    pub username: String,
    pub auth_method: SshAuthMethod,
    pub password_encrypted: Option<String>,
    pub private_key_path: Option<PathBuf>,
    pub passphrase_encrypted: Option<String>,
    pub jump_host: Option<String>, // SSH Proxy Jump
    pub local_forwards: Vec<PortForward>,
    pub remote_forwards: Vec<PortForward>,
    pub dynamic_forward: Option<u16>, // SOCKS proxy port
    pub compression: bool,
    pub keep_alive: bool,
    pub timeout_seconds: u32,
    pub created_at: u64,
    pub last_used: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SshAuthMethod {
    Password,
    PublicKey,
    Both,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortForward {
    pub local_host: String,
    pub local_port: u16,
    pub remote_host: String,
    pub remote_port: u16,
}

/// SSH Session
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SshSession {
    pub session_id: String,
    pub config_id: String,
    pub status: SshStatus,
    pub connected_at: Option<u64>,
    pub current_directory: String,
    pub history: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SshStatus {
    Disconnected,
    Connecting,
    Connected,
    Reconnecting,
    Error,
}

/// SSH Command Output
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SshCommandOutput {
    pub command: String,
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
    pub duration_ms: u64,
}

/// SSH Key Pair
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SshKeyPair {
    pub id: String,
    pub name: String,
    pub key_type: SshKeyType,
    pub public_key_path: PathBuf,
    pub private_key_path: PathBuf,
    pub fingerprint: String,
    pub comment: Option<String>,
    pub created_at: u64,
}

/// SSH Manager Service - Enterprise Terminal
pub struct SshManager {
    configs: Arc<Mutex<HashMap<String, SshConfig>>>,
    active_sessions: Arc<Mutex<HashMap<String, SshSession>>>,
    key_pairs: Arc<Mutex<HashMap<String, SshKeyPair>>>,
    command_history: Arc<Mutex<Vec<String>>>,
    app_handle: AppHandle,
}

impl SshManager {
    pub fn new(app_handle: AppHandle) -> Result<Self> {
        Ok(Self {
            configs: Arc::new(Mutex::new(HashMap::new())),
            active_sessions: Arc::new(Mutex::new(HashMap::new())),
            key_pairs: Arc::new(Mutex::new(HashMap::new())),
            command_history: Arc::new(Mutex::new(Vec::new())),
            app_handle,
        })
    }

    /// Create new SSH configuration
    pub fn create_config(
        &self,
        name: String,
        host: String,
        port: Option<u16>,
        username: String,
        auth_method: SshAuthMethod,
        password: Option<String>,
        private_key: Option<PathBuf>,
    ) -> Result<String> {
        let config_id = uuid::Uuid::new_v4().to_string();

        let password_encrypted = if let Some(pwd) = password {
            Some(self.encrypt_password(&pwd)?)
        } else {
            None
        };

        let config = SshConfig {
            id: config_id.clone(),
            name,
            host,
            port: port.unwrap_or(22),
            username,
            auth_method,
            password_encrypted,
            private_key_path: private_key,
            passphrase_encrypted: None,
            jump_host: None,
            local_forwards: Vec::new(),
            remote_forwards: Vec::new(),
            dynamic_forward: None,
            compression: true,
            keep_alive: true,
            timeout_seconds: 30,
            created_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)?
                .as_secs(),
            last_used: None,
        };

        let mut configs = self.configs.lock().unwrap();
        configs.insert(config_id.clone(), config);

        Ok(config_id)
    }

    /// Connect SSH session
    pub fn connect(&self, config_id: &str) -> Result<String> {
        let configs = self.configs.lock().unwrap();
        let config = configs
            .get(config_id)
            .context("SSH configuration not found")?
            .clone();
        drop(configs);

        let session_id = uuid::Uuid::new_v4().to_string();

        let session = SshSession {
            session_id: session_id.clone(),
            config_id: config_id.to_string(),
            status: SshStatus::Connecting,
            connected_at: None,
            current_directory: "~".to_string(),
            history: Vec::new(),
        };

        {
            let mut sessions = self.active_sessions.lock().unwrap();
            sessions.insert(session_id.clone(), session);
        }

        // Implement actual SSH connection using ssh2 crate
        use ssh2::Session as Ssh2Session;
        use std::net::TcpStream;

        let tcp = TcpStream::connect(format!("{}:{}", config.host, config.port))
            .map_err(|e| anyhow::anyhow!("TCP connection failed: {}", e))?;

        let mut sess = Ssh2Session::new()
            .map_err(|e| anyhow::anyhow!("SSH session creation failed: {}", e))?;

        sess.set_tcp_stream(tcp);
        sess.handshake()
            .map_err(|e| anyhow::anyhow!("SSH handshake failed: {}", e))?;

        // Authenticate based on method
        match config.auth_method {
            SshAuthMethod::Password | SshAuthMethod::Both => {
                if let Some(password_enc) = &config.password_encrypted {
                    // In production: decrypt password
                    // For now: assume it's the actual password
                    sess.userauth_password(&config.username, password_enc)
                        .map_err(|e| anyhow::anyhow!("Password authentication failed: {}", e))?;
                }
            }
            SshAuthMethod::PublicKey => {
                if let Some(key_path) = &config.private_key_path {
                    let passphrase = config.passphrase_encrypted.as_deref();
                    sess.userauth_pubkey_file(&config.username, None, key_path, passphrase)
                        .map_err(|e| anyhow::anyhow!("Public key authentication failed: {}", e))?;
                }
            }
        }

        if !sess.authenticated() {
            return Err(anyhow::anyhow!("SSH authentication failed"));
        }

        // Update session status
        {
            let mut sessions = self.active_sessions.lock().unwrap();
            if let Some(session) = sessions.get_mut(&session_id) {
                session.status = SshStatus::Connected;
                session.connected_at = Some(
                    std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)?
                        .as_secs(),
                );
            }
        }

        Ok(session_id)
    }

    /// Execute command on SSH session
    pub fn execute_command(&self, session_id: &str, command: &str) -> Result<SshCommandOutput> {
        use ssh2::Session as Ssh2Session;
        use std::io::Read;
        use std::net::TcpStream;

        let start = std::time::Instant::now();

        // Add to history
        {
            let mut history = self.command_history.lock().unwrap();
            history.push(command.to_string());
        }

        // Get session config
        let sessions = self.active_sessions.lock().unwrap();
        let session = sessions
            .get(session_id)
            .ok_or_else(|| anyhow::anyhow!("Session not found"))?;

        let config_id = session.config_id.clone();
        drop(sessions);

        // Get the actual config
        let configs = self.configs.lock().unwrap();
        let config = configs
            .get(&config_id)
            .ok_or_else(|| anyhow::anyhow!("Config not found"))?
            .clone();
        drop(configs);

        // Reconnect and execute (in production, keep connection alive)
        let tcp = TcpStream::connect(format!("{}:{}", config.host, config.port))?;
        let mut sess = Ssh2Session::new()?;
        sess.set_tcp_stream(tcp);
        sess.handshake()?;

        // Re-authenticate based on method
        match config.auth_method {
            SshAuthMethod::Password | SshAuthMethod::Both => {
                if let Some(password_enc) = &config.password_encrypted {
                    sess.userauth_password(&config.username, password_enc)?;
                }
            }
            SshAuthMethod::PublicKey => {
                if let Some(key_path) = &config.private_key_path {
                    let passphrase = config.passphrase_encrypted.as_deref();
                    sess.userauth_pubkey_file(&config.username, None, key_path, passphrase)?;
                }
            }
        }

        // Execute command
        let mut channel = sess.channel_session()?;
        channel.exec(command)?;

        let mut stdout = String::new();
        channel.read_to_string(&mut stdout)?;

        let mut stderr = String::new();
        channel.stderr().read_to_string(&mut stderr)?;

        channel.wait_close()?;
        let exit_code = channel.exit_status()?;

        let output = SshCommandOutput {
            command: command.to_string(),
            stdout,
            stderr,
            exit_code,
            duration_ms: start.elapsed().as_millis() as u64,
        };

        Ok(output)
    }

    /// Disconnect SSH session
    pub fn disconnect(&self, session_id: &str) -> Result<()> {
        let mut sessions = self.active_sessions.lock().unwrap();
        sessions.remove(session_id);
        Ok(())
    }

    /// Get all SSH configurations
    pub fn get_configs(&self) -> Vec<SshConfig> {
        let configs = self.configs.lock().unwrap();
        configs.values().cloned().collect()
    }

    /// Get active sessions
    pub fn get_active_sessions(&self) -> Vec<SshSession> {
        let sessions = self.active_sessions.lock().unwrap();
        sessions.values().cloned().collect()
    }

    /// Delete SSH configuration
    pub fn delete_config(&self, config_id: &str) -> Result<()> {
        // Disconnect any active sessions
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

        let mut configs = self.configs.lock().unwrap();
        configs.remove(config_id);

        Ok(())
    }

    /// Generate SSH key pair
    pub fn generate_key_pair(
        &self,
        name: String,
        key_type: SshKeyType,
        comment: Option<String>,
    ) -> Result<String> {
        let key_id = uuid::Uuid::new_v4().to_string();

        let ssh_dir = dirs::home_dir()
            .context("Could not find home directory")?
            .join(".ssh");

        std::fs::create_dir_all(&ssh_dir)?;

        let key_name = format!("cube_elite_{}", key_id);
        let private_key_path = ssh_dir.join(&key_name);
        let public_key_path = ssh_dir.join(format!("{}.pub", key_name));

        // Generate key pair using ssh-keygen
        let key_type_arg = match key_type {
            SshKeyType::RSA2048 => ("rsa", "2048"),
            SshKeyType::RSA4096 => ("rsa", "4096"),
            SshKeyType::ED25519 => ("ed25519", "256"),
            SshKeyType::ECDSA => ("ecdsa", "521"),
        };

        std::process::Command::new("ssh-keygen")
            .args([
                "-t",
                key_type_arg.0,
                "-b",
                key_type_arg.1,
                "-f",
                private_key_path.to_str().unwrap(),
                "-N",
                "", // No passphrase
                "-C",
                comment.as_deref().unwrap_or("CUBE Elite SSH Key"),
            ])
            .output()?;

        // Get fingerprint
        let fingerprint_output = std::process::Command::new("ssh-keygen")
            .args(["-lf", public_key_path.to_str().unwrap()])
            .output()?;

        let fingerprint = String::from_utf8_lossy(&fingerprint_output.stdout)
            .split_whitespace()
            .nth(1)
            .unwrap_or("unknown")
            .to_string();

        let key_pair = SshKeyPair {
            id: key_id.clone(),
            name,
            key_type,
            public_key_path,
            private_key_path,
            fingerprint,
            comment,
            created_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)?
                .as_secs(),
        };

        let mut keys = self.key_pairs.lock().unwrap();
        keys.insert(key_id.clone(), key_pair);

        Ok(key_id)
    }

    /// Get all key pairs
    pub fn get_key_pairs(&self) -> Vec<SshKeyPair> {
        let keys = self.key_pairs.lock().unwrap();
        keys.values().cloned().collect()
    }

    /// Delete key pair
    pub fn delete_key_pair(&self, key_id: &str) -> Result<()> {
        let mut keys = self.key_pairs.lock().unwrap();
        if let Some(key_pair) = keys.remove(key_id) {
            // Delete key files
            let _ = std::fs::remove_file(&key_pair.private_key_path);
            let _ = std::fs::remove_file(&key_pair.public_key_path);
        }
        Ok(())
    }

    /// Get command history
    pub fn get_command_history(&self, limit: Option<usize>) -> Vec<String> {
        let history = self.command_history.lock().unwrap();
        let limit = limit.unwrap_or(100);
        history.iter().rev().take(limit).cloned().collect()
    }

    /// Clear command history
    pub fn clear_command_history(&self) -> Result<()> {
        let mut history = self.command_history.lock().unwrap();
        history.clear();
        Ok(())
    }

    /// Setup port forwarding for an SSH session
    /// 
    /// # Architecture Notes
    /// Port forwarding in a Tauri/Desktop context is implemented by:
    /// 1. Adding the forward config to the session's SSH connection arguments
    /// 2. When connecting, the ssh command includes -L (local) or -R (remote) flags
    /// 3. The forwarding is active for the duration of the SSH connection
    /// 
    /// This method stores the forwarding configuration and updates the connection
    /// parameters. The actual forwarding happens through the system SSH process.
    /// 
    /// # Arguments
    /// * `session_id` - The ID of the active SSH session
    /// * `forward` - The port forwarding configuration
    /// 
    /// # Returns
    /// * `Ok(())` if the forwarding config was stored successfully
    /// * `Err` if the session doesn't exist
    pub fn setup_port_forward(&self, session_id: &str, forward: PortForward) -> Result<()> {
        use log::info;
        
        // Validate the port forward configuration
        if forward.local_port == 0 || forward.remote_port == 0 {
            return Err(anyhow::anyhow!("Invalid port: ports must be non-zero"));
        }
        
        // Find the session and its associated config
        let sessions = self.active_sessions.lock().unwrap();
        let session = sessions.get(session_id)
            .ok_or_else(|| anyhow::anyhow!("Session not found: {}", session_id))?;
        
        let config_id = session.config_id.clone();
        drop(sessions);
        
        // Add the forward to the connection config
        let mut configs = self.configs.lock().unwrap();
        if let Some(config) = configs.get_mut(&config_id) {
            // Check for duplicate forwards
            let duplicate = config.local_forwards.iter().any(|f| 
                f.local_port == forward.local_port && f.local_host == forward.local_host
            );
            
            if duplicate {
                return Err(anyhow::anyhow!(
                    "Port forward already exists for {}:{}", 
                    forward.local_host, forward.local_port
                ));
            }
            
            info!(
                "📡 Adding port forward: {}:{} -> {}:{} for session {}",
                forward.local_host, forward.local_port,
                forward.remote_host, forward.remote_port,
                session_id
            );
            
            config.local_forwards.push(forward);
            
            // Note: For an active session, the user needs to restart the connection
            // for the new forward to take effect. In a more advanced implementation,
            // we could use SSH multiplexing (ControlMaster) to add forwards dynamically.
        } else {
            return Err(anyhow::anyhow!("Config not found for session: {}", session_id));
        }
        
        Ok(())
    }
    
    /// Remove a port forward from a session
    pub fn remove_port_forward(&self, session_id: &str, local_port: u16) -> Result<()> {
        use log::info;
        
        let sessions = self.active_sessions.lock().unwrap();
        let session = sessions.get(session_id)
            .ok_or_else(|| anyhow::anyhow!("Session not found: {}", session_id))?;
        
        let config_id = session.config_id.clone();
        drop(sessions);
        
        let mut configs = self.configs.lock().unwrap();
        if let Some(config) = configs.get_mut(&config_id) {
            let before_len = config.local_forwards.len();
            config.local_forwards.retain(|f| f.local_port != local_port);
            
            if config.local_forwards.len() == before_len {
                return Err(anyhow::anyhow!("No forward found on port {}", local_port));
            }
            
            info!("🚫 Removed port forward on port {} for session {}", local_port, session_id);
        }
        
        Ok(())
    }
    
    /// Get all port forwards for a session
    pub fn get_port_forwards(&self, session_id: &str) -> Result<Vec<PortForward>> {
        let sessions = self.active_sessions.lock().unwrap();
        let session = sessions.get(session_id)
            .ok_or_else(|| anyhow::anyhow!("Session not found: {}", session_id))?;
        
        let config_id = session.config_id.clone();
        drop(sessions);
        
        let configs = self.configs.lock().unwrap();
        if let Some(config) = configs.get(&config_id) {
            Ok(config.local_forwards.clone())
        } else {
            Ok(vec![])
        }
    }
    
    /// Build SSH command arguments including port forwards
    /// This is a helper that would be used when spawning the SSH process
    pub fn build_ssh_args(&self, config_id: &str) -> Result<Vec<String>> {
        let configs = self.configs.lock().unwrap();
        let config = configs.get(config_id)
            .ok_or_else(|| anyhow::anyhow!("Config not found: {}", config_id))?;
        
        let mut args = Vec::new();
        
        // Add host and user
        args.push(format!("{}@{}", config.username, config.host));
        
        // Add port if non-standard
        if config.port != 22 {
            args.push("-p".to_string());
            args.push(config.port.to_string());
        }
        
        // Add local forwards (-L local_host:local_port:remote_host:remote_port)
        for forward in &config.local_forwards {
            args.push("-L".to_string());
            args.push(format!(
                "{}:{}:{}:{}",
                forward.local_host, forward.local_port,
                forward.remote_host, forward.remote_port
            ));
        }
        
        // Add remote forwards (-R remote_host:remote_port:local_host:local_port)
        for forward in &config.remote_forwards {
            args.push("-R".to_string());
            args.push(format!(
                "{}:{}:{}:{}",
                forward.remote_host, forward.remote_port,
                forward.local_host, forward.local_port
            ));
        }
        
        // Add dynamic forward (SOCKS proxy) if configured (-D port)
        if let Some(socks_port) = config.dynamic_forward {
            args.push("-D".to_string());
            args.push(socks_port.to_string());
        }
        
        // Add jump host if configured (-J jump_host)
        if let Some(ref jump_host) = config.jump_host {
            args.push("-J".to_string());
            args.push(jump_host.clone());
        }
        
        // Add private key path if using key auth (-i path)
        if let Some(ref key_path) = config.private_key_path {
            args.push("-i".to_string());
            args.push(key_path.to_string_lossy().to_string());
        }
        
        // Add compression flag (-C)
        if config.compression {
            args.push("-C".to_string());
        }
        
        // Add keep-alive options (-o ServerAliveInterval=60)
        if config.keep_alive {
            args.push("-o".to_string());
            args.push("ServerAliveInterval=60".to_string());
            args.push("-o".to_string());
            args.push("ServerAliveCountMax=3".to_string());
        }
        
        // Add connection timeout (-o ConnectTimeout=N)
        if config.timeout_seconds > 0 {
            args.push("-o".to_string());
            args.push(format!("ConnectTimeout={}", config.timeout_seconds));
        }
        
        Ok(args)
    }

    // ========================================================================
    // PRIVATE HELPERS
    // ========================================================================

    fn encrypt_password(&self, password: &str) -> Result<String> {
        // Use AES-256-GCM encryption (same as VPN, FTP, RDP)
        use aes_gcm::{
            aead::{Aead, KeyInit},
            Aes256Gcm,
        };
        use rand::Rng;
        use sha2::{Digest, Sha256};

        // Derive key from master password
        let master_password = std::env::var("CUBE_MASTER_PASSWORD")
            .unwrap_or_else(|_| "CUBE_ELITE_V6_SSH_KEY".to_string());

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
