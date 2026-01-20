// ============================================================================
// CUBE Nexum Elite - Enterprise License Service
// ============================================================================
// Fortune 500 Grade Cryptographic License Protection
// 
// Security Features:
// - Ed25519 digital signatures (128-bit security)
// - ChaCha20-Poly1305 authenticated encryption
// - Argon2id key derivation (memory-hard)
// - BLAKE3 cryptographic hashing
// - Multi-factor device fingerprinting
// - Anti-tampering & integrity verification
// - Constant-time comparisons (timing attack resistant)
// - Secure memory handling with zeroization
// ============================================================================

use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH, Duration};
use std::path::PathBuf;
use std::fs;

// Cryptographic imports
use ed25519_dalek::{Signature, Verifier, VerifyingKey};
use chacha20poly1305::{
    aead::{Aead, KeyInit, OsRng},
    ChaCha20Poly1305, Nonce,
};
use argon2::{Argon2, password_hash::SaltString, PasswordHasher};
use zeroize::Zeroize;
use rand::RngCore;
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};

// System info for device fingerprinting
use sysinfo::System;
use mac_address::get_mac_address;
use hostname::get as get_hostname;
use whoami;

// ============================================================================
// Constants
// ============================================================================

/// Application identifier for key derivation
const APP_IDENTIFIER: &[u8] = b"CUBE_NEXUM_ELITE_v7_LICENSE_2025";

/// Magic bytes for encrypted license files
const LICENSE_MAGIC: &[u8] = &[0x43, 0x55, 0x42, 0x45, 0x4C, 0x49, 0x43]; // "CUBELIC"

/// Current license format version
const LICENSE_FORMAT_VERSION: u8 = 2;

/// Minimum offline grace period (3 days)
const MIN_OFFLINE_GRACE_PERIOD: u64 = 3 * 24 * 60 * 60;

/// Maximum offline grace period (30 days for Elite)
const MAX_OFFLINE_GRACE_PERIOD: u64 = 30 * 24 * 60 * 60;

/// Nonce size for ChaCha20-Poly1305
const NONCE_SIZE: usize = 12;

/// Salt size for Argon2
const SALT_SIZE: usize = 16;

// ============================================================================
// License Tier Enum
// ============================================================================

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "lowercase")]
pub enum LicenseTier {
    Free,
    Pro,
    Elite,
}

impl Default for LicenseTier {
    fn default() -> Self {
        LicenseTier::Free
    }
}

impl std::fmt::Display for LicenseTier {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LicenseTier::Free => write!(f, "free"),
            LicenseTier::Pro => write!(f, "pro"),
            LicenseTier::Elite => write!(f, "elite"),
        }
    }
}

impl From<&str> for LicenseTier {
    fn from(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "pro" => LicenseTier::Pro,
            "elite" => LicenseTier::Elite,
            _ => LicenseTier::Free,
        }
    }
}

impl LicenseTier {
    /// Get the offline grace period for this tier
    pub fn offline_grace_period(&self) -> u64 {
        match self {
            LicenseTier::Free => MIN_OFFLINE_GRACE_PERIOD,
            LicenseTier::Pro => 7 * 24 * 60 * 60,  // 7 days
            LicenseTier::Elite => MAX_OFFLINE_GRACE_PERIOD, // 30 days
        }
    }

    /// Get maximum allowed devices for this tier
    pub fn max_devices(&self) -> u32 {
        match self {
            LicenseTier::Free => 1,
            LicenseTier::Pro => 3,
            LicenseTier::Elite => 10,
        }
    }

    /// Get cache duration for this tier
    pub fn cache_duration(&self) -> u64 {
        match self {
            LicenseTier::Free => 30 * 60,        // 30 minutes
            LicenseTier::Pro => 60 * 60,         // 1 hour
            LicenseTier::Elite => 4 * 60 * 60,   // 4 hours
        }
    }
}

// ============================================================================
// Trial System
// ============================================================================

/// Trial duration: 30 days in seconds
const TRIAL_DURATION_SECS: u64 = 30 * 24 * 60 * 60;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrialInfo {
    /// Whether the trial is currently active
    pub is_active: bool,
    
    /// Timestamp when trial was started (Unix timestamp)
    pub started_at: u64,
    
    /// Timestamp when trial expires (Unix timestamp)
    pub expires_at: u64,
    
    /// Days remaining in the trial
    pub days_remaining: i64,
    
    /// The tier granted during trial (always Elite)
    pub trial_tier: LicenseTier,
    
    /// Device ID where trial was started
    pub device_id: String,
    
    /// Integrity checksum for anti-tampering
    pub checksum: String,
}

impl TrialInfo {
    /// Create a new trial starting now
    pub fn start(device_id: &str) -> Self {
        let now = current_timestamp();
        let expires_at = now + TRIAL_DURATION_SECS;
        let days_remaining = 30;
        
        let mut trial = Self {
            is_active: true,
            started_at: now,
            expires_at,
            days_remaining,
            trial_tier: LicenseTier::Elite,
            device_id: device_id.to_string(),
            checksum: String::new(),
        };
        
        trial.checksum = trial.calculate_checksum();
        trial
    }
    
    /// Calculate integrity checksum
    fn calculate_checksum(&self) -> String {
        let key = blake3::hash(APP_IDENTIFIER);
        let key_bytes: [u8; 32] = key.as_bytes()[..32].try_into().unwrap();
        let mut data = Vec::new();
        data.extend_from_slice(&self.started_at.to_le_bytes());
        data.extend_from_slice(&self.expires_at.to_le_bytes());
        data.extend_from_slice(self.device_id.as_bytes());
        data.extend_from_slice(self.trial_tier.to_string().as_bytes());
        let hash = blake3::keyed_hash(&key_bytes, &data);
        hex::encode(&hash.as_bytes()[..16])
    }
    
    /// Verify the trial integrity
    pub fn verify_integrity(&self) -> bool {
        let expected = self.calculate_checksum();
        constant_time_eq(&expected, &self.checksum)
    }
    
    /// Update the trial status based on current time
    pub fn update_status(&mut self) {
        let now = current_timestamp();
        
        if now >= self.expires_at {
            self.is_active = false;
            self.days_remaining = 0;
        } else {
            self.is_active = true;
            let remaining_secs = self.expires_at - now;
            self.days_remaining = (remaining_secs / (24 * 60 * 60)) as i64;
        }
    }
    
    /// Check if trial is expired
    pub fn is_expired(&self) -> bool {
        current_timestamp() >= self.expires_at
    }
    
    /// Get trial end date as ISO string
    pub fn get_end_date_string(&self) -> String {
        use std::time::{UNIX_EPOCH, Duration};
        let duration = Duration::from_secs(self.expires_at);
        let datetime = UNIX_EPOCH + duration;
        format!("{:?}", datetime)
    }
}

/// Response structure for get_license_info command
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LicenseInfo {
    pub tier: LicenseTier,
    pub trial: Option<TrialInfoResponse>,
    pub expires_at: Option<String>,
    pub status: LicenseStatus,
    pub device_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrialInfoResponse {
    pub is_active: bool,
    pub days_remaining: i64,
    pub trial_end_date: String,
    pub trial_tier: String,
}

// ============================================================================
// License Status Enum
// ============================================================================

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum LicenseStatus {
    Valid,
    Expired,
    Revoked,
    Invalid,
    NotActivated,
    ServerError,
    OfflineGracePeriod,
    Tampered,
    DeviceMismatch,
    MaxDevicesReached,
}

impl Default for LicenseStatus {
    fn default() -> Self {
        LicenseStatus::NotActivated
    }
}

impl std::fmt::Display for LicenseStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LicenseStatus::Valid => write!(f, "valid"),
            LicenseStatus::Expired => write!(f, "expired"),
            LicenseStatus::Revoked => write!(f, "revoked"),
            LicenseStatus::Invalid => write!(f, "invalid"),
            LicenseStatus::NotActivated => write!(f, "not_activated"),
            LicenseStatus::ServerError => write!(f, "server_error"),
            LicenseStatus::OfflineGracePeriod => write!(f, "offline_grace_period"),
            LicenseStatus::Tampered => write!(f, "tampered"),
            LicenseStatus::DeviceMismatch => write!(f, "device_mismatch"),
            LicenseStatus::MaxDevicesReached => write!(f, "max_devices_reached"),
        }
    }
}

// ============================================================================
// Device Fingerprint
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceFingerprint {
    /// Primary device identifier (BLAKE3 hash of hardware info)
    pub device_id: String,
    
    /// Hardware-based fingerprint components
    pub hardware_id: String,
    
    /// OS fingerprint
    pub os_fingerprint: String,
    
    /// Machine name hash
    pub machine_hash: String,
    
    /// User identifier hash
    pub user_hash: String,
    
    /// Timestamp of fingerprint generation
    pub generated_at: u64,
    
    /// HMAC of all fingerprint components
    pub integrity_hash: String,
}

impl DeviceFingerprint {
    /// Generate a new device fingerprint with multiple hardware factors
    pub fn generate() -> Self {
        let mut sys = System::new_all();
        sys.refresh_all();

        // Collect hardware identifiers
        let hostname = get_hostname()
            .map(|h| h.to_string_lossy().to_string())
            .unwrap_or_else(|_| "unknown".to_string());

        let mac_addr = get_mac_address()
            .ok()
            .flatten()
            .map(|m| m.to_string())
            .unwrap_or_else(|| "00:00:00:00:00:00".to_string());

        let username = whoami::username();
        let realname = whoami::realname();
        let os_name = System::name().unwrap_or_else(|| "unknown".to_string());
        let os_version = System::os_version().unwrap_or_else(|| "unknown".to_string());
        let kernel_version = System::kernel_version().unwrap_or_else(|| "unknown".to_string());
        
        // Get CPU info
        let cpu_brand = sys.cpus().first()
            .map(|c| c.brand().to_string())
            .unwrap_or_else(|| "unknown".to_string());
        let cpu_count = sys.cpus().len();
        
        // Get total memory
        let total_memory = sys.total_memory();

        // Generate hardware ID using BLAKE3
        let mut hardware_data = Vec::new();
        hardware_data.extend_from_slice(mac_addr.as_bytes());
        hardware_data.extend_from_slice(cpu_brand.as_bytes());
        hardware_data.extend_from_slice(&cpu_count.to_le_bytes());
        hardware_data.extend_from_slice(&total_memory.to_le_bytes());
        let hardware_hash = blake3::hash(&hardware_data);
        let hardware_id = hex::encode(&hardware_hash.as_bytes()[..16]);

        // Generate OS fingerprint
        let mut os_data = Vec::new();
        os_data.extend_from_slice(os_name.as_bytes());
        os_data.extend_from_slice(os_version.as_bytes());
        os_data.extend_from_slice(kernel_version.as_bytes());
        let os_hash = blake3::hash(&os_data);
        let os_fingerprint = hex::encode(&os_hash.as_bytes()[..16]);

        // Generate machine hash
        let mut machine_data = Vec::new();
        machine_data.extend_from_slice(hostname.as_bytes());
        machine_data.extend_from_slice(APP_IDENTIFIER);
        let machine_hash_result = blake3::hash(&machine_data);
        let machine_hash = hex::encode(&machine_hash_result.as_bytes()[..16]);

        // Generate user hash
        let mut user_data = Vec::new();
        user_data.extend_from_slice(username.as_bytes());
        user_data.extend_from_slice(realname.as_bytes());
        let user_hash_result = blake3::hash(&user_data);
        let user_hash = hex::encode(&user_hash_result.as_bytes()[..16]);

        // Generate primary device ID (combination of all factors)
        let mut device_data = Vec::new();
        device_data.extend_from_slice(hardware_id.as_bytes());
        device_data.extend_from_slice(os_fingerprint.as_bytes());
        device_data.extend_from_slice(machine_hash.as_bytes());
        device_data.extend_from_slice(user_hash.as_bytes());
        device_data.extend_from_slice(APP_IDENTIFIER);
        let device_hash = blake3::hash(&device_data);
        let device_id = format!("CUBE-{}", hex::encode(&device_hash.as_bytes()[..12]));

        let generated_at = current_timestamp();

        // Generate integrity HMAC using keyed BLAKE3
        let key = blake3::hash(APP_IDENTIFIER);
        let key_bytes: [u8; 32] = key.as_bytes()[..32].try_into().unwrap();
        let mut integrity_data = Vec::new();
        integrity_data.extend_from_slice(device_id.as_bytes());
        integrity_data.extend_from_slice(hardware_id.as_bytes());
        integrity_data.extend_from_slice(os_fingerprint.as_bytes());
        integrity_data.extend_from_slice(machine_hash.as_bytes());
        integrity_data.extend_from_slice(user_hash.as_bytes());
        integrity_data.extend_from_slice(&generated_at.to_le_bytes());
        let integrity_hasher = blake3::keyed_hash(&key_bytes, &integrity_data);
        let integrity_hash = hex::encode(integrity_hasher.as_bytes());

        Self {
            device_id,
            hardware_id,
            os_fingerprint,
            machine_hash,
            user_hash,
            generated_at,
            integrity_hash,
        }
    }

    /// Verify the integrity of this fingerprint
    pub fn verify_integrity(&self) -> bool {
        let key = blake3::hash(APP_IDENTIFIER);
        let key_bytes: [u8; 32] = key.as_bytes()[..32].try_into().unwrap();
        let mut integrity_data = Vec::new();
        integrity_data.extend_from_slice(self.device_id.as_bytes());
        integrity_data.extend_from_slice(self.hardware_id.as_bytes());
        integrity_data.extend_from_slice(self.os_fingerprint.as_bytes());
        integrity_data.extend_from_slice(self.machine_hash.as_bytes());
        integrity_data.extend_from_slice(self.user_hash.as_bytes());
        integrity_data.extend_from_slice(&self.generated_at.to_le_bytes());
        let integrity_hasher = blake3::keyed_hash(&key_bytes, &integrity_data);
        let expected = hex::encode(integrity_hasher.as_bytes());

        // Constant-time comparison
        constant_time_eq(&expected, &self.integrity_hash)
    }

    /// Check if this fingerprint matches another (with tolerance for minor changes)
    pub fn matches(&self, other: &DeviceFingerprint) -> bool {
        // Hardware ID must match exactly
        if !constant_time_eq(&self.hardware_id, &other.hardware_id) {
            return false;
        }

        // At least 2 of 3 other factors must match
        let mut matches = 0;
        if constant_time_eq(&self.os_fingerprint, &other.os_fingerprint) {
            matches += 1;
        }
        if constant_time_eq(&self.machine_hash, &other.machine_hash) {
            matches += 1;
        }
        if constant_time_eq(&self.user_hash, &other.user_hash) {
            matches += 1;
        }

        matches >= 2
    }
}

// ============================================================================
// License Structure
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct License {
    /// Unique license key (format: XXXX-XXXX-XXXX-XXXX)
    pub license_key: String,

    /// User identification
    pub user_id: String,
    pub user_email: String,
    pub user_name: Option<String>,

    /// License details
    pub tier: LicenseTier,
    pub status: LicenseStatus,

    /// Timestamps (Unix timestamps in seconds)
    pub issued_at: u64,
    pub expires_at: u64,
    pub activated_at: u64,
    pub last_validated: u64,

    /// Stripe integration
    pub stripe_customer_id: Option<String>,
    pub stripe_subscription_id: Option<String>,

    /// Device binding
    pub device_fingerprint: DeviceFingerprint,
    pub max_devices: u32,
    pub activated_devices: Vec<ActivatedDevice>,

    /// Features & capabilities
    pub features: Vec<String>,
    pub custom_limits: Option<CustomLimits>,

    /// Cryptographic signature from license server (Ed25519)
    pub signature: String,

    /// License format version
    pub version: u8,

    /// Anti-tampering: hash of critical fields
    pub integrity_checksum: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivatedDevice {
    pub device_id: String,
    pub device_name: String,
    pub activated_at: u64,
    pub last_seen: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomLimits {
    pub max_workflows: Option<u32>,
    pub max_automations: Option<u32>,
    pub max_data_sources: Option<u32>,
    pub ai_requests_per_day: Option<u32>,
    pub storage_gb: Option<u32>,
}

impl Default for License {
    fn default() -> Self {
        let fingerprint = DeviceFingerprint::generate();
        let now = current_timestamp();
        
        Self {
            license_key: String::new(),
            user_id: String::new(),
            user_email: String::new(),
            user_name: None,
            tier: LicenseTier::Free,
            status: LicenseStatus::NotActivated,
            issued_at: now,
            expires_at: 0,
            activated_at: 0,
            last_validated: 0,
            stripe_customer_id: None,
            stripe_subscription_id: None,
            device_fingerprint: fingerprint,
            max_devices: 1,
            activated_devices: Vec::new(),
            features: Vec::new(),
            custom_limits: None,
            signature: String::new(),
            version: LICENSE_FORMAT_VERSION,
            integrity_checksum: String::new(),
        }
    }
}

impl License {
    /// Calculate the integrity checksum for this license
    pub fn calculate_integrity_checksum(&self) -> String {
        let key = blake3::hash(APP_IDENTIFIER);
        let key_bytes: [u8; 32] = key.as_bytes()[..32].try_into().unwrap();
        let mut data = Vec::new();
        data.extend_from_slice(self.license_key.as_bytes());
        data.extend_from_slice(self.user_id.as_bytes());
        data.extend_from_slice(self.user_email.as_bytes());
        data.extend_from_slice(self.tier.to_string().as_bytes());
        data.extend_from_slice(&self.issued_at.to_le_bytes());
        data.extend_from_slice(&self.expires_at.to_le_bytes());
        data.extend_from_slice(&self.activated_at.to_le_bytes());
        data.extend_from_slice(self.device_fingerprint.device_id.as_bytes());
        data.extend_from_slice(&self.max_devices.to_le_bytes());
        data.push(self.version);
        let hash = blake3::keyed_hash(&key_bytes, &data);
        hex::encode(hash.as_bytes())
    }

    /// Verify the integrity of this license
    pub fn verify_integrity(&self) -> bool {
        let expected = self.calculate_integrity_checksum();
        constant_time_eq(&expected, &self.integrity_checksum)
    }

    /// Check if the license is currently valid
    pub fn is_valid(&self) -> bool {
        let now = current_timestamp();
        
        self.status == LicenseStatus::Valid
            && self.expires_at > now
            && self.verify_integrity()
            && self.device_fingerprint.verify_integrity()
    }

    /// Check if within offline grace period
    pub fn is_within_grace_period(&self) -> bool {
        let now = current_timestamp();
        let grace_period = self.tier.offline_grace_period();
        
        self.last_validated + grace_period > now
    }

    /// Get the message to be signed/verified
    pub fn get_signable_message(&self) -> Vec<u8> {
        let mut message = Vec::new();
        message.extend_from_slice(self.license_key.as_bytes());
        message.extend_from_slice(b":");
        message.extend_from_slice(self.user_id.as_bytes());
        message.extend_from_slice(b":");
        message.extend_from_slice(self.user_email.as_bytes());
        message.extend_from_slice(b":");
        message.extend_from_slice(self.tier.to_string().as_bytes());
        message.extend_from_slice(b":");
        message.extend_from_slice(&self.issued_at.to_le_bytes());
        message.extend_from_slice(b":");
        message.extend_from_slice(&self.expires_at.to_le_bytes());
        message.extend_from_slice(b":");
        message.extend_from_slice(self.device_fingerprint.device_id.as_bytes());
        message.extend_from_slice(b":");
        message.extend_from_slice(&self.max_devices.to_le_bytes());
        message
    }
}

// ============================================================================
// API Request/Response Types
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LicenseValidationRequest {
    pub license_key: String,
    pub device_fingerprint: DeviceFingerprint,
    pub app_version: String,
    pub timestamp: u64,
    pub request_signature: String,
    pub nonce: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LicenseValidationResponse {
    pub valid: bool,
    pub license: Option<License>,
    pub error: Option<String>,
    pub error_code: Option<String>,
    pub server_time: u64,
    pub signature: String,
    pub nonce: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LicenseActivationRequest {
    pub license_key: String,
    pub user_email: String,
    pub device_fingerprint: DeviceFingerprint,
    pub device_name: String,
    pub app_version: String,
    pub timestamp: u64,
    pub nonce: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LicenseActivationResponse {
    pub success: bool,
    pub license: Option<License>,
    pub error: Option<String>,
    pub error_code: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LicenseDeactivationRequest {
    pub license_key: String,
    pub device_id: String,
    pub timestamp: u64,
    pub signature: String,
}

// ============================================================================
// License Service Configuration
// ============================================================================

#[derive(Debug, Clone)]
pub struct LicenseConfig {
    /// License server URL
    pub server_url: String,

    /// Server's Ed25519 public key for signature verification (Base64 encoded)
    pub server_public_key: String,

    /// Application secret for request signing
    pub app_secret: Vec<u8>,

    /// Connection timeout in seconds
    pub timeout_secs: u64,

    /// Enable debug mode (skip signature verification - NEVER in production)
    pub debug_mode: bool,
}

impl Default for LicenseConfig {
    fn default() -> Self {
        Self {
            server_url: "https://api.cubeai.tools/v1/license".to_string(),
            server_public_key: String::new(),
            app_secret: Vec::new(),
            timeout_secs: 30,
            debug_mode: false,
        }
    }
}

// ============================================================================
// Encrypted License Cache
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
struct EncryptedLicenseCache {
    /// Magic bytes for file identification
    magic: [u8; 7],
    
    /// Format version
    version: u8,
    
    /// Argon2 salt for key derivation
    salt: [u8; SALT_SIZE],
    
    /// ChaCha20-Poly1305 nonce
    nonce: [u8; NONCE_SIZE],
    
    /// Encrypted license data
    ciphertext: Vec<u8>,
    
    /// BLAKE3 hash of device fingerprint (for integrity)
    device_hash: [u8; 32],
    
    /// Timestamp of cache creation
    created_at: u64,
}

// ============================================================================
// License Service
// ============================================================================

pub struct LicenseService {
    config: Arc<Mutex<LicenseConfig>>,
    current_license: Arc<Mutex<Option<License>>>,
    device_fingerprint: Arc<Mutex<DeviceFingerprint>>,
    trial_info: Arc<Mutex<Option<TrialInfo>>>,
    cache_path: PathBuf,
    trial_path: PathBuf,
    #[allow(dead_code)]
    encryption_key: Arc<Mutex<Option<[u8; 32]>>>,
}

impl LicenseService {
    /// Create a new license service instance
    pub fn new(app_data_dir: PathBuf) -> Self {
        let cache_path = app_data_dir.join("license.cube");
        let trial_path = app_data_dir.join("trial.cube");
        let fingerprint = DeviceFingerprint::generate();

        Self {
            config: Arc::new(Mutex::new(LicenseConfig::default())),
            current_license: Arc::new(Mutex::new(None)),
            device_fingerprint: Arc::new(Mutex::new(fingerprint)),
            trial_info: Arc::new(Mutex::new(None)),
            cache_path,
            trial_path,
            encryption_key: Arc::new(Mutex::new(None)),
        }
    }

    /// Initialize the license service
    pub async fn initialize(&self) -> Result<(), String> {
        // Generate encryption key from device fingerprint
        let fingerprint = self.device_fingerprint.lock().await;
        let key = self.derive_encryption_key(&fingerprint).await?;
        
        let mut enc_key = self.encryption_key.lock().await;
        *enc_key = Some(key);
        
        // Try to load cached license
        drop(enc_key);
        drop(fingerprint);
        
        // Load trial info
        if let Ok(Some(trial)) = self.load_trial_info().await {
            let mut trial_lock = self.trial_info.lock().await;
            *trial_lock = Some(trial);
        }
        
        if let Ok(Some(license)) = self.load_cached_license().await {
            if license.is_valid() || license.is_within_grace_period() {
                let mut current = self.current_license.lock().await;
                *current = Some(license);
            }
        }
        
        Ok(())
    }

    /// Set the license server configuration
    pub async fn set_config(&self, config: LicenseConfig) {
        let mut current_config = self.config.lock().await;
        *current_config = config;
    }

    /// Get the device fingerprint
    pub async fn get_device_fingerprint(&self) -> DeviceFingerprint {
        self.device_fingerprint.lock().await.clone()
    }

    /// Get the device ID (short form)
    pub async fn get_device_id(&self) -> String {
        self.device_fingerprint.lock().await.device_id.clone()
    }

    // ========================================================================
    // Key Derivation
    // ========================================================================

    async fn derive_encryption_key(&self, fingerprint: &DeviceFingerprint) -> Result<[u8; 32], String> {
        // Create a unique password from device fingerprint
        let mut password = Vec::new();
        password.extend_from_slice(fingerprint.device_id.as_bytes());
        password.extend_from_slice(fingerprint.hardware_id.as_bytes());
        password.extend_from_slice(APP_IDENTIFIER);

        // Use BLAKE3 to create initial key material
        let key_material = blake3::hash(&password);

        // Use the hash as the key (32 bytes)
        let mut key = [0u8; 32];
        key.copy_from_slice(key_material.as_bytes());

        // Zeroize password
        password.zeroize();

        Ok(key)
    }

    async fn derive_cache_key(&self, salt: &[u8]) -> Result<[u8; 32], String> {
        let fingerprint = self.device_fingerprint.lock().await;
        
        // Create password from fingerprint
        let mut password = fingerprint.device_id.as_bytes().to_vec();
        password.extend_from_slice(fingerprint.hardware_id.as_bytes());
        password.extend_from_slice(APP_IDENTIFIER);

        // Use Argon2id for key derivation
        let argon2 = Argon2::default();
        let salt_string = SaltString::encode_b64(salt)
            .map_err(|e| format!("Salt encoding error: {}", e))?;

        let hash = argon2
            .hash_password(&password, &salt_string)
            .map_err(|e| format!("Key derivation error: {}", e))?;

        // Extract the hash output
        let hash_bytes = hash.hash.ok_or("No hash output")?;
        let hash_slice = hash_bytes.as_bytes();

        let mut key = [0u8; 32];
        if hash_slice.len() >= 32 {
            key.copy_from_slice(&hash_slice[..32]);
        } else {
            // Pad with BLAKE3 if needed
            let extended = blake3::hash(hash_slice);
            key.copy_from_slice(extended.as_bytes());
        }

        password.zeroize();
        Ok(key)
    }

    // ========================================================================
    // License Validation
    // ========================================================================

    /// Validate the current license
    pub async fn validate_license(&self) -> Result<License, String> {
        // 1. Check for cached license
        if let Some(license) = self.current_license.lock().await.clone() {
            let now = current_timestamp();
            let cache_duration = license.tier.cache_duration();

            // Check if cache is still fresh
            if license.last_validated + cache_duration > now {
                if license.is_valid() {
                    return Ok(license);
                }
            }

            // Try to validate with server
            match self.validate_with_server(&license.license_key).await {
                Ok(updated_license) => {
                    self.cache_license(&updated_license).await?;
                    let mut current = self.current_license.lock().await;
                    *current = Some(updated_license.clone());
                    return Ok(updated_license);
                }
                Err(e) => {
                    // Server unavailable, check grace period
                    if license.is_within_grace_period() {
                        let mut grace_license = license.clone();
                        grace_license.status = LicenseStatus::OfflineGracePeriod;
                        return Ok(grace_license);
                    }
                    return Err(format!("License validation failed: {}", e));
                }
            }
        }

        // 2. Try to load from cache
        if let Ok(Some(license)) = self.load_cached_license().await {
            // Verify device fingerprint
            let current_fingerprint = self.device_fingerprint.lock().await;
            if !current_fingerprint.matches(&license.device_fingerprint) {
                return Err("Device fingerprint mismatch. License may have been copied.".to_string());
            }
            drop(current_fingerprint);

            // Verify integrity
            if !license.verify_integrity() {
                return Err("License integrity check failed. File may be corrupted or tampered.".to_string());
            }

            // Try to validate with server
            match self.validate_with_server(&license.license_key).await {
                Ok(updated_license) => {
                    self.cache_license(&updated_license).await?;
                    let mut current = self.current_license.lock().await;
                    *current = Some(updated_license.clone());
                    return Ok(updated_license);
                }
                Err(_) => {
                    // Server unavailable, use cached if within grace period
                    if license.is_within_grace_period() {
                        let mut grace_license = license.clone();
                        grace_license.status = LicenseStatus::OfflineGracePeriod;
                        let mut current = self.current_license.lock().await;
                        *current = Some(grace_license.clone());
                        return Ok(grace_license);
                    }
                }
            }
        }

        Err("No valid license found. Please activate your license.".to_string())
    }

    async fn validate_with_server(&self, license_key: &str) -> Result<License, String> {
        let config = self.config.lock().await.clone();
        let fingerprint = self.device_fingerprint.lock().await.clone();

        let timestamp = current_timestamp();
        let nonce = generate_nonce_string();

        // Create request signature
        let request_signature = self.sign_request(
            license_key,
            &fingerprint.device_id,
            timestamp,
            &nonce,
            &config.app_secret,
        );

        let request = LicenseValidationRequest {
            license_key: license_key.to_string(),
            device_fingerprint: fingerprint,
            app_version: env!("CARGO_PKG_VERSION").to_string(),
            timestamp,
            request_signature,
            nonce,
        };

        let client = reqwest::Client::new();
        let response = client
            .post(format!("{}/validate", config.server_url))
            .json(&request)
            .timeout(Duration::from_secs(config.timeout_secs))
            .send()
            .await
            .map_err(|e| format!("Network error: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Server error: HTTP {}", response.status()));
        }

        let validation_response: LicenseValidationResponse = response
            .json()
            .await
            .map_err(|e| format!("Invalid server response: {}", e))?;

        if !validation_response.valid {
            return Err(validation_response.error.unwrap_or_else(|| "License validation failed".to_string()));
        }

        // Verify server signature (unless in debug mode)
        if !config.debug_mode {
            self.verify_server_signature(&validation_response, &config.server_public_key)?;
        }

        let mut license = validation_response
            .license
            .ok_or_else(|| "No license data in response".to_string())?;

        // Update last validated timestamp
        license.last_validated = current_timestamp();
        license.integrity_checksum = license.calculate_integrity_checksum();

        Ok(license)
    }

    // ========================================================================
    // License Activation
    // ========================================================================

    /// Activate a license with the given key and email
    pub async fn activate_license(
        &self,
        license_key: &str,
        user_email: &str,
    ) -> Result<License, String> {
        let config = self.config.lock().await.clone();
        let fingerprint = self.device_fingerprint.lock().await.clone();

        let device_name = get_hostname()
            .map(|h| h.to_string_lossy().to_string())
            .unwrap_or_else(|_| format!("{}'s Device", whoami::username()));

        let request = LicenseActivationRequest {
            license_key: license_key.to_string(),
            user_email: user_email.to_string(),
            device_fingerprint: fingerprint.clone(),
            device_name,
            app_version: env!("CARGO_PKG_VERSION").to_string(),
            timestamp: current_timestamp(),
            nonce: generate_nonce_string(),
        };

        let client = reqwest::Client::new();
        let response = client
            .post(format!("{}/activate", config.server_url))
            .json(&request)
            .timeout(Duration::from_secs(config.timeout_secs))
            .send()
            .await
            .map_err(|e| format!("Network error: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Server error: HTTP {}", response.status()));
        }

        let activation_response: LicenseActivationResponse = response
            .json()
            .await
            .map_err(|e| format!("Invalid server response: {}", e))?;

        if !activation_response.success {
            return Err(activation_response.error.unwrap_or_else(|| "Activation failed".to_string()));
        }

        let mut license = activation_response
            .license
            .ok_or_else(|| "No license data in response".to_string())?;

        // Set local device fingerprint
        license.device_fingerprint = fingerprint;
        license.activated_at = current_timestamp();
        license.last_validated = current_timestamp();
        license.status = LicenseStatus::Valid;
        license.integrity_checksum = license.calculate_integrity_checksum();

        // Cache the license
        self.cache_license(&license).await?;

        // Update current license
        let mut current = self.current_license.lock().await;
        *current = Some(license.clone());

        Ok(license)
    }

    // ========================================================================
    // License Deactivation
    // ========================================================================

    /// Deactivate the current license from this device
    pub async fn deactivate_license(&self) -> Result<(), String> {
        let current_license = self.current_license.lock().await.clone();

        if let Some(license) = current_license {
            let config = self.config.lock().await.clone();
            let fingerprint = self.device_fingerprint.lock().await.clone();

            let timestamp = current_timestamp();
            let signature = self.sign_request(
                &license.license_key,
                &fingerprint.device_id,
                timestamp,
                "deactivate",
                &config.app_secret,
            );

            let request = LicenseDeactivationRequest {
                license_key: license.license_key,
                device_id: fingerprint.device_id,
                timestamp,
                signature,
            };

            // Notify server (best effort)
            let client = reqwest::Client::new();
            let _ = client
                .post(format!("{}/deactivate", config.server_url))
                .json(&request)
                .timeout(Duration::from_secs(10))
                .send()
                .await;
        }

        // Clear local cache
        self.clear_cache().await?;

        // Clear current license
        let mut current = self.current_license.lock().await;
        *current = None;

        Ok(())
    }

    // ========================================================================
    // Status & Feature Checks
    // ========================================================================

    /// Get the current license (if any)
    pub async fn get_current_license(&self) -> Option<License> {
        self.current_license.lock().await.clone()
    }

    /// Get the current tier
    pub async fn get_tier(&self) -> LicenseTier {
        match self.current_license.lock().await.as_ref() {
            Some(license) if license.status == LicenseStatus::Valid
                || license.status == LicenseStatus::OfflineGracePeriod =>
            {
                license.tier
            }
            _ => LicenseTier::Free,
        }
    }

    /// Check if a specific feature is allowed
    pub async fn is_feature_allowed(&self, feature: &str) -> bool {
        let tier = self.get_tier().await;

        match feature {
            // Free features
            "basic_automation" | "basic_forms" | "basic_browser" | "basic_notes" => true,

            // Pro features
            "ai_assistant" | "vpn_basic" | "unlimited_workflows" | "advanced_extraction"
            | "priority_support" | "cloud_sync" | "api_basic" => {
                matches!(tier, LicenseTier::Pro | LicenseTier::Elite)
            }

            // Elite features
            "vpn_premium" | "collaboration" | "api_unlimited" | "custom_branding"
            | "enterprise_sso" | "audit_logs" | "video_conference" | "p2p_transfer"
            | "security_lab" | "white_label" | "dedicated_support" | "sla_guarantee" => {
                matches!(tier, LicenseTier::Elite)
            }

            _ => false,
        }
    }

    // ========================================================================
    // Cryptographic Operations
    // ========================================================================

    fn sign_request(
        &self,
        license_key: &str,
        device_id: &str,
        timestamp: u64,
        nonce: &str,
        app_secret: &[u8],
    ) -> String {
        let key_hash = blake3::hash(app_secret);
        let key_bytes: [u8; 32] = key_hash.as_bytes()[..32].try_into().unwrap();
        let mut data = Vec::new();
        data.extend_from_slice(license_key.as_bytes());
        data.extend_from_slice(b":");
        data.extend_from_slice(device_id.as_bytes());
        data.extend_from_slice(b":");
        data.extend_from_slice(&timestamp.to_le_bytes());
        data.extend_from_slice(b":");
        data.extend_from_slice(nonce.as_bytes());
        let hash = blake3::keyed_hash(&key_bytes, &data);
        BASE64.encode(hash.as_bytes())
    }

    fn verify_server_signature(
        &self,
        response: &LicenseValidationResponse,
        public_key_b64: &str,
    ) -> Result<(), String> {
        if public_key_b64.is_empty() {
            return Err("Server public key not configured".to_string());
        }

        // Decode public key
        let public_key_bytes = BASE64
            .decode(public_key_b64)
            .map_err(|e| format!("Invalid public key encoding: {}", e))?;

        let public_key = VerifyingKey::from_bytes(
            public_key_bytes.as_slice().try_into()
                .map_err(|_| "Invalid public key length")?
        ).map_err(|e| format!("Invalid public key: {}", e))?;

        // Create the message that was signed
        let mut message = Vec::new();
        message.extend_from_slice(if response.valid { b"true" } else { b"false" });
        message.extend_from_slice(b":");
        message.extend_from_slice(&response.server_time.to_le_bytes());
        message.extend_from_slice(b":");
        message.extend_from_slice(response.nonce.as_bytes());

        if let Some(ref license) = response.license {
            message.extend_from_slice(b":");
            message.extend_from_slice(license.license_key.as_bytes());
        }

        // Decode and verify signature
        let signature_bytes = BASE64
            .decode(&response.signature)
            .map_err(|e| format!("Invalid signature encoding: {}", e))?;

        let signature = Signature::from_bytes(
            signature_bytes.as_slice().try_into()
                .map_err(|_| "Invalid signature length")?
        );

        public_key
            .verify(&message, &signature)
            .map_err(|_| "Signature verification failed".to_string())
    }

    #[allow(dead_code)]
    fn verify_license_signature(&self, license: &License, public_key_b64: &str) -> Result<(), String> {
        if public_key_b64.is_empty() {
            return Err("Public key not configured".to_string());
        }

        let public_key_bytes = BASE64
            .decode(public_key_b64)
            .map_err(|e| format!("Invalid public key encoding: {}", e))?;

        let public_key = VerifyingKey::from_bytes(
            public_key_bytes.as_slice().try_into()
                .map_err(|_| "Invalid public key length")?
        ).map_err(|e| format!("Invalid public key: {}", e))?;

        let message = license.get_signable_message();

        let signature_bytes = BASE64
            .decode(&license.signature)
            .map_err(|e| format!("Invalid signature encoding: {}", e))?;

        let signature = Signature::from_bytes(
            signature_bytes.as_slice().try_into()
                .map_err(|_| "Invalid signature length")?
        );

        public_key
            .verify(&message, &signature)
            .map_err(|_| "License signature verification failed".to_string())
    }

    // ========================================================================
    // Cache Operations (Encrypted)
    // ========================================================================

    async fn cache_license(&self, license: &License) -> Result<(), String> {
        // Serialize license to JSON
        let json = serde_json::to_vec(license)
            .map_err(|e| format!("Serialization error: {}", e))?;

        // Generate random salt and nonce
        let mut salt = [0u8; SALT_SIZE];
        let mut nonce = [0u8; NONCE_SIZE];
        OsRng.fill_bytes(&mut salt);
        OsRng.fill_bytes(&mut nonce);

        // Derive encryption key
        let key = self.derive_cache_key(&salt).await?;

        // Encrypt with ChaCha20-Poly1305
        let cipher = ChaCha20Poly1305::new_from_slice(&key)
            .map_err(|e| format!("Cipher initialization error: {}", e))?;

        let ciphertext = cipher
            .encrypt(Nonce::from_slice(&nonce), json.as_ref())
            .map_err(|e| format!("Encryption error: {}", e))?;

        // Create device hash for integrity
        let fingerprint = self.device_fingerprint.lock().await;
        let device_hash = blake3::hash(fingerprint.device_id.as_bytes());
        let mut device_hash_bytes = [0u8; 32];
        device_hash_bytes.copy_from_slice(device_hash.as_bytes());

        // Create cache structure
        let cache = EncryptedLicenseCache {
            magic: LICENSE_MAGIC.try_into().unwrap(),
            version: LICENSE_FORMAT_VERSION,
            salt,
            nonce,
            ciphertext,
            device_hash: device_hash_bytes,
            created_at: current_timestamp(),
        };

        // Serialize and write to file
        let cache_data = bincode::serialize(&cache)
            .map_err(|e| format!("Cache serialization error: {}", e))?;

        // Ensure directory exists
        if let Some(parent) = self.cache_path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create cache directory: {}", e))?;
        }

        fs::write(&self.cache_path, cache_data)
            .map_err(|e| format!("Failed to write cache file: {}", e))?;

        Ok(())
    }

    async fn load_cached_license(&self) -> Result<Option<License>, String> {
        if !self.cache_path.exists() {
            return Ok(None);
        }

        // Read cache file
        let cache_data = fs::read(&self.cache_path)
            .map_err(|e| format!("Failed to read cache file: {}", e))?;

        // Deserialize cache structure
        let cache: EncryptedLicenseCache = bincode::deserialize(&cache_data)
            .map_err(|e| format!("Cache deserialization error: {}", e))?;

        // Verify magic bytes
        if cache.magic != LICENSE_MAGIC {
            return Err("Invalid cache file format".to_string());
        }

        // Verify version
        if cache.version != LICENSE_FORMAT_VERSION {
            return Err("Incompatible cache version".to_string());
        }

        // Verify device hash
        let fingerprint = self.device_fingerprint.lock().await;
        let current_device_hash = blake3::hash(fingerprint.device_id.as_bytes());
        if !constant_time_eq_bytes(&cache.device_hash, current_device_hash.as_bytes()) {
            return Err("Cache device mismatch - possible tampering detected".to_string());
        }

        // Derive decryption key
        let key = self.derive_cache_key(&cache.salt).await?;

        // Decrypt
        let cipher = ChaCha20Poly1305::new_from_slice(&key)
            .map_err(|e| format!("Cipher initialization error: {}", e))?;

        let plaintext = cipher
            .decrypt(Nonce::from_slice(&cache.nonce), cache.ciphertext.as_ref())
            .map_err(|_| "Decryption failed - cache may be corrupted or tampered".to_string())?;

        // Deserialize license
        let license: License = serde_json::from_slice(&plaintext)
            .map_err(|e| format!("License deserialization error: {}", e))?;

        // Verify license integrity
        if !license.verify_integrity() {
            return Err("License integrity check failed".to_string());
        }

        Ok(Some(license))
    }

    async fn clear_cache(&self) -> Result<(), String> {
        if self.cache_path.exists() {
            // Overwrite with random data before deleting (secure delete)
            let file_size = fs::metadata(&self.cache_path)
                .map(|m| m.len() as usize)
                .unwrap_or(1024);

            let mut random_data = vec![0u8; file_size];
            OsRng.fill_bytes(&mut random_data);
            
            let _ = fs::write(&self.cache_path, &random_data);
            random_data.zeroize();

            fs::remove_file(&self.cache_path)
                .map_err(|e| format!("Failed to delete cache: {}", e))?;
        }
        Ok(())
    }
    
    // ========================================================================
    // Trial System Operations
    // ========================================================================
    
    /// Start a new 30-day Elite trial
    pub async fn start_trial(&self) -> Result<TrialInfo, String> {
        // Check if trial already exists
        if let Some(ref existing) = *self.trial_info.lock().await {
            if !existing.is_expired() {
                return Err("Trial already active. Cannot start a new trial.".to_string());
            }
            // Trial expired, don't allow another trial
            return Err("Trial already used. Please upgrade to Pro or Elite.".to_string());
        }
        
        // Check if trial file exists (prevent re-trial after reinstall)
        if self.trial_path.exists() {
            return Err("Trial already used on this device. Please upgrade to continue.".to_string());
        }
        
        let fingerprint = self.device_fingerprint.lock().await;
        let trial = TrialInfo::start(&fingerprint.device_id);
        drop(fingerprint);
        
        // Save trial to disk
        self.save_trial_info(&trial).await?;
        
        // Update in-memory trial
        let mut trial_lock = self.trial_info.lock().await;
        *trial_lock = Some(trial.clone());
        
        Ok(trial)
    }
    
    /// Get current trial info
    pub async fn get_trial_info(&self) -> Option<TrialInfo> {
        let trial_lock = self.trial_info.lock().await;
        if let Some(ref mut trial) = trial_lock.clone() {
            trial.update_status();
            return Some(trial.clone());
        }
        None
    }
    
    /// Check if trial is currently active
    pub async fn is_trial_active(&self) -> bool {
        if let Some(trial) = self.get_trial_info().await {
            return trial.is_active && !trial.is_expired() && trial.verify_integrity();
        }
        false
    }
    
    /// Get license info (for frontend consumption)
    pub async fn get_license_info(&self) -> LicenseInfo {
        let device_id = self.get_device_id().await;
        
        // Check for paid license first
        if let Some(license) = self.get_current_license().await {
            if license.is_valid() {
                return LicenseInfo {
                    tier: license.tier,
                    trial: None,
                    expires_at: Some(format_timestamp(license.expires_at)),
                    status: license.status,
                    device_id,
                };
            }
        }
        
        // Check for active trial
        if let Some(mut trial) = self.get_trial_info().await {
            trial.update_status();
            if trial.is_active {
                return LicenseInfo {
                    tier: LicenseTier::Elite, // Trial gives Elite access
                    trial: Some(TrialInfoResponse {
                        is_active: true,
                        days_remaining: trial.days_remaining,
                        trial_end_date: format_timestamp(trial.expires_at),
                        trial_tier: "elite".to_string(),
                    }),
                    expires_at: Some(format_timestamp(trial.expires_at)),
                    status: LicenseStatus::Valid,
                    device_id,
                };
            }
        }
        
        // Default to free tier
        LicenseInfo {
            tier: LicenseTier::Free,
            trial: None,
            expires_at: None,
            status: LicenseStatus::NotActivated,
            device_id,
        }
    }
    
    /// Get effective tier (considering trial)
    pub async fn get_effective_tier(&self) -> LicenseTier {
        // Check paid license first
        if let Some(license) = self.get_current_license().await {
            if license.is_valid() || license.is_within_grace_period() {
                return license.tier;
            }
        }
        
        // Check trial
        if self.is_trial_active().await {
            return LicenseTier::Elite;
        }
        
        LicenseTier::Free
    }
    
    /// Save trial info to encrypted file
    async fn save_trial_info(&self, trial: &TrialInfo) -> Result<(), String> {
        let json = serde_json::to_vec(trial)
            .map_err(|e| format!("Trial serialization error: {}", e))?;
        
        // Generate random salt and nonce
        let mut salt = [0u8; SALT_SIZE];
        let mut nonce = [0u8; NONCE_SIZE];
        OsRng.fill_bytes(&mut salt);
        OsRng.fill_bytes(&mut nonce);
        
        // Derive encryption key
        let key = self.derive_cache_key(&salt).await?;
        
        // Encrypt with ChaCha20-Poly1305
        let cipher = ChaCha20Poly1305::new_from_slice(&key)
            .map_err(|e| format!("Cipher initialization error: {}", e))?;
        
        let ciphertext = cipher
            .encrypt(Nonce::from_slice(&nonce), json.as_ref())
            .map_err(|e| format!("Encryption error: {}", e))?;
        
        // Create device hash for integrity
        let fingerprint = self.device_fingerprint.lock().await;
        let device_hash = blake3::hash(fingerprint.device_id.as_bytes());
        let mut device_hash_bytes = [0u8; 32];
        device_hash_bytes.copy_from_slice(device_hash.as_bytes());
        
        // Create cache structure (reusing EncryptedLicenseCache)
        let cache = EncryptedLicenseCache {
            magic: LICENSE_MAGIC.try_into().unwrap(),
            version: LICENSE_FORMAT_VERSION,
            salt,
            nonce,
            ciphertext,
            device_hash: device_hash_bytes,
            created_at: current_timestamp(),
        };
        
        // Serialize and write to file
        let cache_data = bincode::serialize(&cache)
            .map_err(|e| format!("Trial cache serialization error: {}", e))?;
        
        // Ensure directory exists
        if let Some(parent) = self.trial_path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create cache directory: {}", e))?;
        }
        
        fs::write(&self.trial_path, cache_data)
            .map_err(|e| format!("Failed to write trial file: {}", e))?;
        
        Ok(())
    }
    
    /// Load trial info from encrypted file
    async fn load_trial_info(&self) -> Result<Option<TrialInfo>, String> {
        if !self.trial_path.exists() {
            return Ok(None);
        }
        
        // Read cache file
        let cache_data = fs::read(&self.trial_path)
            .map_err(|e| format!("Failed to read trial file: {}", e))?;
        
        // Deserialize cache structure
        let cache: EncryptedLicenseCache = bincode::deserialize(&cache_data)
            .map_err(|e| format!("Trial cache deserialization error: {}", e))?;
        
        // Verify magic bytes
        if cache.magic != LICENSE_MAGIC {
            return Err("Invalid trial file format".to_string());
        }
        
        // Verify device hash
        let fingerprint = self.device_fingerprint.lock().await;
        let current_device_hash = blake3::hash(fingerprint.device_id.as_bytes());
        if !constant_time_eq_bytes(&cache.device_hash, current_device_hash.as_bytes()) {
            return Err("Trial device mismatch - possible tampering detected".to_string());
        }
        
        // Derive decryption key
        let key = self.derive_cache_key(&cache.salt).await?;
        
        // Decrypt
        let cipher = ChaCha20Poly1305::new_from_slice(&key)
            .map_err(|e| format!("Cipher initialization error: {}", e))?;
        
        let plaintext = cipher
            .decrypt(Nonce::from_slice(&cache.nonce), cache.ciphertext.as_ref())
            .map_err(|_| "Decryption failed - trial may be corrupted".to_string())?;
        
        // Deserialize trial
        let trial: TrialInfo = serde_json::from_slice(&plaintext)
            .map_err(|e| format!("Trial deserialization error: {}", e))?;
        
        // Verify trial integrity
        if !trial.verify_integrity() {
            return Err("Trial integrity check failed".to_string());
        }
        
        Ok(Some(trial))
    }
}

/// Format Unix timestamp to ISO string
fn format_timestamp(timestamp: u64) -> String {
    use std::time::{UNIX_EPOCH, Duration};
    let datetime = UNIX_EPOCH + Duration::from_secs(timestamp);
    // Simple ISO format
    format!("{:?}", datetime)
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

fn generate_nonce_string() -> String {
    let mut nonce = [0u8; 16];
    OsRng.fill_bytes(&mut nonce);
    hex::encode(nonce)
}

/// Constant-time string comparison
fn constant_time_eq(a: &str, b: &str) -> bool {
    if a.len() != b.len() {
        return false;
    }
    
    let mut result: u8 = 0;
    for (x, y) in a.bytes().zip(b.bytes()) {
        result |= x ^ y;
    }
    result == 0
}

/// Constant-time byte slice comparison
fn constant_time_eq_bytes(a: &[u8], b: &[u8]) -> bool {
    if a.len() != b.len() {
        return false;
    }
    
    let mut result: u8 = 0;
    for (x, y) in a.iter().zip(b.iter()) {
        result |= x ^ y;
    }
    result == 0
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_device_fingerprint_generation() {
        let fp = DeviceFingerprint::generate();
        assert!(fp.device_id.starts_with("CUBE-"));
        assert!(!fp.hardware_id.is_empty());
        assert!(fp.verify_integrity());
    }

    #[test]
    fn test_device_fingerprint_integrity() {
        let mut fp = DeviceFingerprint::generate();
        assert!(fp.verify_integrity());

        // Tamper with data
        fp.hardware_id = "tampered".to_string();
        assert!(!fp.verify_integrity());
    }

    #[test]
    fn test_license_tier_conversion() {
        assert_eq!(LicenseTier::from("pro"), LicenseTier::Pro);
        assert_eq!(LicenseTier::from("ELITE"), LicenseTier::Elite);
        assert_eq!(LicenseTier::from("unknown"), LicenseTier::Free);
    }

    #[test]
    fn test_license_tier_limits() {
        assert_eq!(LicenseTier::Free.max_devices(), 1);
        assert_eq!(LicenseTier::Pro.max_devices(), 3);
        assert_eq!(LicenseTier::Elite.max_devices(), 10);
    }

    #[test]
    fn test_license_integrity() {
        let mut license = License::default();
        license.license_key = "TEST-1234-5678-ABCD".to_string();
        license.user_id = "user123".to_string();
        license.user_email = "test@example.com".to_string();
        license.tier = LicenseTier::Elite;
        license.integrity_checksum = license.calculate_integrity_checksum();

        assert!(license.verify_integrity());

        // Tamper with data
        license.tier = LicenseTier::Free;
        assert!(!license.verify_integrity());
    }

    #[test]
    fn test_constant_time_comparison() {
        assert!(constant_time_eq("hello", "hello"));
        assert!(!constant_time_eq("hello", "world"));
        assert!(!constant_time_eq("hello", "hell"));
    }

    #[tokio::test]
    async fn test_encryption_roundtrip() {
        let temp_dir = std::env::temp_dir().join("cube_license_test");
        let _ = fs::create_dir_all(&temp_dir);

        let service = LicenseService::new(temp_dir.clone());
        service.initialize().await.unwrap();

        let mut license = License::default();
        license.license_key = "TEST-1234-5678-ABCD".to_string();
        license.user_id = "user123".to_string();
        license.user_email = "test@example.com".to_string();
        license.tier = LicenseTier::Elite;
        license.status = LicenseStatus::Valid;
        license.expires_at = current_timestamp() + 86400;
        license.last_validated = current_timestamp();
        license.integrity_checksum = license.calculate_integrity_checksum();

        // Cache and reload
        service.cache_license(&license).await.unwrap();
        let loaded = service.load_cached_license().await.unwrap().unwrap();

        assert_eq!(loaded.license_key, license.license_key);
        assert_eq!(loaded.tier, license.tier);
        assert!(loaded.verify_integrity());

        // Cleanup
        let _ = fs::remove_dir_all(&temp_dir);
    }
}
