// Password Manager Models
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordEntry {
    pub id: String,
    pub name: String,
    pub username: String,
    pub encrypted_password: String, // Hex-encoded encrypted data
    pub url: Option<String>,
    pub notes: Option<String>,
    pub category: String,
    pub tags: Vec<String>,
    pub date_created: i64,
    pub date_modified: i64,
    pub last_used: Option<i64>,
    pub favorite: bool,
    pub strength_score: u8, // 0-4
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MasterPasswordConfig {
    pub salt: String, // Hex-encoded salt for PBKDF2
    pub is_set: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordGeneratorConfig {
    pub length: usize,
    pub include_uppercase: bool,
    pub include_lowercase: bool,
    pub include_numbers: bool,
    pub include_symbols: bool,
    pub exclude_ambiguous: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordStrength {
    pub score: u8, // 0-4
    pub feedback: Vec<String>,
    pub estimated_crack_time: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordCategory {
    pub id: String,
    pub name: String,
    pub color: String,
    pub icon: String,
    pub count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordStats {
    pub total_passwords: i32,
    pub weak_passwords: i32,
    pub medium_passwords: i32,
    pub strong_passwords: i32,
    pub reused_passwords: i32,
    pub by_category: std::collections::HashMap<String, i32>,
}

impl Default for PasswordGeneratorConfig {
    fn default() -> Self {
        Self {
            length: 16,
            include_uppercase: true,
            include_lowercase: true,
            include_numbers: true,
            include_symbols: true,
            exclude_ambiguous: false,
        }
    }
}
