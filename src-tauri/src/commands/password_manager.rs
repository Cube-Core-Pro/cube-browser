// ============================================================================
// PASSWORD MANAGER - Secure Credentials Storage
// ============================================================================
// Store passwords with AES-256-GCM encryption
// Master password required for encryption/decryption
// Auto-fill support for browser integration

use crate::AppState;
use data_encoding::HEXLOWER;
use ring::aead;
use ring::pbkdf2;
use ring::rand::{SecureRandom, SystemRandom};
use serde::{Deserialize, Serialize};
use std::num::NonZeroU32;
use tauri::State;

// ============================================================================
// CONSTANTS
// ============================================================================

const CREDENTIAL_LEN: usize = 32; // 256 bits
const SALT_LEN: usize = 32;
const NONCE_LEN: usize = 12;
const PBKDF2_ITERATIONS: u32 = 100_000;

// ============================================================================
// DATA STRUCTURES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordEntry {
    pub id: String,
    pub name: String,
    pub username: String,
    pub encrypted_password: String, // Hex-encoded encrypted data
    pub url: Option<String>,
    pub notes: Option<String>,
    pub category: String,
    pub date_created: u64,
    pub date_modified: u64,
    pub last_used: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MasterPasswordConfig {
    pub salt: String, // Hex-encoded salt for PBKDF2
    pub is_set: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordGeneratorConfig {
    pub length: usize,
    pub include_uppercase: bool,
    pub include_lowercase: bool,
    pub include_numbers: bool,
    pub include_symbols: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordStrength {
    pub score: u8, // 0-4
    pub feedback: Vec<String>,
    pub estimated_crack_time: String,
}

// ============================================================================
// ENCRYPTION UTILITIES
// ============================================================================

/// Derive encryption key from master password using PBKDF2
fn derive_key(master_password: &str, salt: &[u8]) -> [u8; CREDENTIAL_LEN] {
    let iterations = NonZeroU32::new(PBKDF2_ITERATIONS).unwrap();
    let mut key = [0u8; CREDENTIAL_LEN];

    pbkdf2::derive(
        pbkdf2::PBKDF2_HMAC_SHA256,
        iterations,
        salt,
        master_password.as_bytes(),
        &mut key,
    );

    key
}

/// Encrypt password using AES-256-GCM
fn encrypt_password(password: &str, master_password: &str, salt: &[u8]) -> Result<String, String> {
    let key = derive_key(master_password, salt);
    let unbound_key = aead::UnboundKey::new(&aead::AES_256_GCM, &key)
        .map_err(|e| format!("Failed to create key: {:?}", e))?;
    let sealing_key = aead::LessSafeKey::new(unbound_key);

    // Generate random nonce
    let rng = SystemRandom::new();
    let mut nonce_bytes = [0u8; NONCE_LEN];
    rng.fill(&mut nonce_bytes)
        .map_err(|e| format!("Failed to generate nonce: {:?}", e))?;

    let nonce = aead::Nonce::assume_unique_for_key(nonce_bytes);

    // Encrypt
    let mut in_out = password.as_bytes().to_vec();
    sealing_key
        .seal_in_place_append_tag(nonce, aead::Aad::empty(), &mut in_out)
        .map_err(|e| format!("Encryption failed: {:?}", e))?;

    // Combine nonce + ciphertext
    let mut result = nonce_bytes.to_vec();
    result.extend_from_slice(&in_out);

    Ok(HEXLOWER.encode(&result))
}

/// Decrypt password using AES-256-GCM
fn decrypt_password(
    encrypted_hex: &str,
    master_password: &str,
    salt: &[u8],
) -> Result<String, String> {
    let encrypted_data = HEXLOWER
        .decode(encrypted_hex.as_bytes())
        .map_err(|e| format!("Failed to decode hex: {}", e))?;

    if encrypted_data.len() < NONCE_LEN {
        return Err("Invalid encrypted data".to_string());
    }

    let (nonce_bytes, ciphertext) = encrypted_data.split_at(NONCE_LEN);
    let mut nonce_array = [0u8; NONCE_LEN];
    nonce_array.copy_from_slice(nonce_bytes);
    let nonce = aead::Nonce::assume_unique_for_key(nonce_array);

    let key = derive_key(master_password, salt);
    let unbound_key = aead::UnboundKey::new(&aead::AES_256_GCM, &key)
        .map_err(|e| format!("Failed to create key: {:?}", e))?;
    let opening_key = aead::LessSafeKey::new(unbound_key);

    let mut in_out = ciphertext.to_vec();
    let decrypted = opening_key
        .open_in_place(nonce, aead::Aad::empty(), &mut in_out)
        .map_err(|e| format!("Decryption failed: {:?}", e))?;

    String::from_utf8(decrypted.to_vec()).map_err(|e| format!("Invalid UTF-8: {}", e))
}

// ============================================================================
// PASSWORD GENERATOR
// ============================================================================

/// Generate random password based on config
fn generate_password_internal(config: &PasswordGeneratorConfig) -> Result<String, String> {
    let mut charset = String::new();

    if config.include_lowercase {
        charset.push_str("abcdefghijklmnopqrstuvwxyz");
    }
    if config.include_uppercase {
        charset.push_str("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    }
    if config.include_numbers {
        charset.push_str("0123456789");
    }
    if config.include_symbols {
        charset.push_str("!@#$%^&*()-_=+[]{}|;:,.<>?");
    }

    if charset.is_empty() {
        return Err("At least one character type must be selected".to_string());
    }

    let charset_bytes: Vec<u8> = charset.bytes().collect();
    let rng = SystemRandom::new();
    let mut password = String::new();

    for _ in 0..config.length {
        let mut random_byte = [0u8; 1];
        rng.fill(&mut random_byte)
            .map_err(|e| format!("Random generation failed: {:?}", e))?;

        let idx = (random_byte[0] as usize) % charset_bytes.len();
        password.push(charset_bytes[idx] as char);
    }

    Ok(password)
}

/// Analyze password strength
fn analyze_password_strength(password: &str) -> PasswordStrength {
    let mut score = 0u8;
    let mut feedback = Vec::new();

    // Length check
    if password.len() >= 12 {
        score += 1;
    } else {
        feedback.push("Password should be at least 12 characters".to_string());
    }

    // Character variety
    let has_lowercase = password.chars().any(|c| c.is_lowercase());
    let has_uppercase = password.chars().any(|c| c.is_uppercase());
    let has_numbers = password.chars().any(|c| c.is_numeric());
    let has_symbols = password.chars().any(|c| !c.is_alphanumeric());

    let variety = [has_lowercase, has_uppercase, has_numbers, has_symbols]
        .iter()
        .filter(|&&x| x)
        .count();

    if variety >= 3 {
        score += 1;
    } else {
        feedback.push("Use a mix of uppercase, lowercase, numbers, and symbols".to_string());
    }

    // Length bonus
    if password.len() >= 16 {
        score += 1;
    }
    if password.len() >= 20 {
        score += 1;
    }

    // Entropy estimation
    let estimated_crack_time = if score >= 4 {
        "Centuries".to_string()
    } else if score >= 3 {
        "Years".to_string()
    } else if score >= 2 {
        "Months".to_string()
    } else if score >= 1 {
        "Days".to_string()
    } else {
        "Minutes".to_string()
    };

    if feedback.is_empty() {
        feedback.push("Strong password!".to_string());
    }

    PasswordStrength {
        score,
        feedback,
        estimated_crack_time,
    }
}

// ============================================================================
// TAURI COMMANDS
// ============================================================================

#[tauri::command]
pub fn setup_master_password(
    _master_password: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    // Generate random salt
    let rng = SystemRandom::new();
    let mut salt = [0u8; SALT_LEN];
    rng.fill(&mut salt)
        .map_err(|e| format!("Failed to generate salt: {:?}", e))?;

    let config = MasterPasswordConfig {
        salt: HEXLOWER.encode(&salt),
        is_set: true,
    };

    state
        .tab_manager
        .set_master_password_config(config)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn verify_master_password(
    master_password: String,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let config = state
        .tab_manager
        .get_master_password_config()
        .map_err(|e| e.to_string())?;

    if !config.is_set {
        return Ok(false);
    }

    // Try to decrypt a test entry to verify password
    let entries = state
        .tab_manager
        .get_password_entries()
        .map_err(|e| e.to_string())?;

    if let Some(entry) = entries.first() {
        let salt = HEXLOWER
            .decode(config.salt.as_bytes())
            .map_err(|e| format!("Invalid salt: {}", e))?;

        match decrypt_password(&entry.encrypted_password, &master_password, &salt) {
            Ok(_) => Ok(true),
            Err(_) => Ok(false),
        }
    } else {
        // No entries yet, password is correct by default
        Ok(true)
    }
}

#[tauri::command]
pub fn save_password(
    name: String,
    username: String,
    password: String,
    url: Option<String>,
    notes: Option<String>,
    category: String,
    master_password: String,
    state: State<'_, AppState>,
) -> Result<PasswordEntry, String> {
    let config = state
        .tab_manager
        .get_master_password_config()
        .map_err(|e| e.to_string())?;

    if !config.is_set {
        return Err("Master password not set".to_string());
    }

    let salt = HEXLOWER
        .decode(config.salt.as_bytes())
        .map_err(|e| format!("Invalid salt: {}", e))?;

    let encrypted_password = encrypt_password(&password, &master_password, &salt)?;

    let id = uuid::Uuid::new_v4().to_string();
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let entry = PasswordEntry {
        id: id.clone(),
        name,
        username,
        encrypted_password,
        url,
        notes,
        category,
        date_created: now,
        date_modified: now,
        last_used: None,
    };

    state
        .tab_manager
        .add_password_entry(entry.clone())
        .map_err(|e| e.to_string())?;

    Ok(entry)
}

#[tauri::command]
pub fn get_passwords(state: State<'_, AppState>) -> Result<Vec<PasswordEntry>, String> {
    state
        .tab_manager
        .get_password_entries()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_password(
    entry_id: String,
    master_password: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let config = state
        .tab_manager
        .get_master_password_config()
        .map_err(|e| e.to_string())?;

    let entry = state
        .tab_manager
        .get_password_entry(&entry_id)
        .ok_or_else(|| "Password entry not found".to_string())?;

    let salt = HEXLOWER
        .decode(config.salt.as_bytes())
        .map_err(|e| format!("Invalid salt: {}", e))?;

    decrypt_password(&entry.encrypted_password, &master_password, &salt)
}

#[tauri::command]
pub fn update_password(
    entry_id: String,
    name: Option<String>,
    username: Option<String>,
    password: Option<String>,
    url: Option<String>,
    notes: Option<String>,
    category: Option<String>,
    master_password: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let config = state
        .tab_manager
        .get_master_password_config()
        .map_err(|e| e.to_string())?;

    let salt = HEXLOWER
        .decode(config.salt.as_bytes())
        .map_err(|e| format!("Invalid salt: {}", e))?;

    let encrypted_password = if let Some(pwd) = password {
        Some(encrypt_password(&pwd, &master_password, &salt)?)
    } else {
        None
    };

    state
        .tab_manager
        .update_password_entry(
            &entry_id,
            name,
            username,
            encrypted_password,
            url,
            notes,
            category,
        )
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_password(entry_id: String, state: State<'_, AppState>) -> Result<(), String> {
    state
        .tab_manager
        .delete_password_entry(&entry_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn generate_password(config: PasswordGeneratorConfig) -> Result<String, String> {
    generate_password_internal(&config)
}

#[tauri::command]
pub fn check_password_strength(password: String) -> Result<PasswordStrength, String> {
    Ok(analyze_password_strength(&password))
}

#[tauri::command]
pub fn search_passwords_by_url(
    url: String,
    state: State<'_, AppState>,
) -> Result<Vec<PasswordEntry>, String> {
    state
        .tab_manager
        .search_passwords_by_url(&url)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn mark_password_used(entry_id: String, state: State<'_, AppState>) -> Result<(), String> {
    state
        .tab_manager
        .mark_password_used(&entry_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_password_stats(state: State<'_, AppState>) -> Result<PasswordStats, String> {
    let entries = state
        .tab_manager
        .get_password_entries()
        .map_err(|e| e.to_string())?;

    let total = entries.len();
    let by_category: std::collections::HashMap<String, usize> =
        entries
            .iter()
            .fold(std::collections::HashMap::new(), |mut acc, entry| {
                *acc.entry(entry.category.clone()).or_insert(0) += 1;
                acc
            });

    Ok(PasswordStats { total, by_category })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordStats {
    pub total: usize,
    pub by_category: std::collections::HashMap<String, usize>,
}
