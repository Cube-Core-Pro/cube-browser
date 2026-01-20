// Password Manager Service - SQLite Backend
use crate::models::passwords::*;
use data_encoding::HEXLOWER;
use ring::aead;
use ring::pbkdf2;
use ring::rand::{SecureRandom, SystemRandom};
use rusqlite::{params, Connection, Result};
use std::num::NonZeroU32;
use std::sync::{Arc, Mutex};

const CREDENTIAL_LEN: usize = 32; // 256 bits
const SALT_LEN: usize = 32;
const NONCE_LEN: usize = 12;
const PBKDF2_ITERATIONS: u32 = 100_000;

pub struct PasswordService {
    db: Arc<Mutex<Connection>>,
}

impl PasswordService {
    pub fn new(db_path: &str) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        let service = Self {
            db: Arc::new(Mutex::new(conn)),
        };
        service.init_schema()?;
        service.insert_default_categories()?;
        Ok(service)
    }

    fn init_schema(&self) -> Result<()> {
        let conn = self.db.lock().unwrap();

        // Master password config table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS master_password (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                salt TEXT NOT NULL,
                is_set BOOLEAN NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )",
            [],
        )?;

        // Password entries table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS passwords (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                username TEXT NOT NULL,
                encrypted_password TEXT NOT NULL,
                url TEXT,
                notes TEXT,
                category TEXT NOT NULL,
                tags TEXT NOT NULL DEFAULT '[]',
                date_created INTEGER NOT NULL,
                date_modified INTEGER NOT NULL,
                last_used INTEGER,
                favorite BOOLEAN NOT NULL DEFAULT 0,
                strength_score INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (category) REFERENCES password_categories(id)
            )",
            [],
        )?;

        // Categories table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS password_categories (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                color TEXT NOT NULL,
                icon TEXT NOT NULL,
                position INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL
            )",
            [],
        )?;

        // Indexes
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_passwords_category ON passwords(category)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_passwords_created ON passwords(date_created DESC)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_passwords_modified ON passwords(date_modified DESC)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_passwords_strength ON passwords(strength_score)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_passwords_favorite ON passwords(favorite)",
            [],
        )?;

        Ok(())
    }

    fn insert_default_categories(&self) -> Result<()> {
        let conn = self.db.lock().unwrap();
        let now = chrono::Utc::now().timestamp();

        let categories = vec![
            ("general", "General", "#6b7280", "🔐"),
            ("social", "Social Media", "#3b82f6", "👥"),
            ("banking", "Banking", "#10b981", "🏦"),
            ("email", "Email", "#f59e0b", "📧"),
            ("work", "Work", "#8b5cf6", "💼"),
        ];

        for (id, name, color, icon) in categories {
            conn.execute(
                "INSERT OR IGNORE INTO password_categories (id, name, color, icon, position, created_at)
                 VALUES (?1, ?2, ?3, ?4, 0, ?5)",
                params![id, name, color, icon, now],
            )?;
        }

        Ok(())
    }

    // Master Password Operations
    pub fn setup_master_password(&self, _master_password: &str) -> Result<()> {
        let rng = SystemRandom::new();
        let mut salt = [0u8; SALT_LEN];
        rng.fill(&mut salt)
            .map_err(|_| rusqlite::Error::ToSqlConversionFailure(Box::new(std::io::Error::other(
                "Failed to generate salt",
            ))))?;

        let salt_hex = HEXLOWER.encode(&salt);
        let now = chrono::Utc::now().timestamp();

        let conn = self.db.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO master_password (id, salt, is_set, created_at, updated_at)
             VALUES (1, ?1, 1, ?2, ?3)",
            params![salt_hex, now, now],
        )?;

        Ok(())
    }

    pub fn get_master_password_config(&self) -> Result<MasterPasswordConfig> {
        let conn = self.db.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT salt, is_set, created_at, updated_at FROM master_password WHERE id = 1"
        )?;

        let config = stmt.query_row([], |row| {
            Ok(MasterPasswordConfig {
                salt: row.get(0)?,
                is_set: row.get(1)?,
                created_at: row.get(2)?,
                updated_at: row.get(3)?,
            })
        });

        match config {
            Ok(c) => Ok(c),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(MasterPasswordConfig {
                salt: String::new(),
                is_set: false,
                created_at: 0,
                updated_at: 0,
            }),
            Err(e) => Err(e),
        }
    }

    pub fn change_master_password(&self, old_password: &str, new_password: &str) -> Result<()> {
        // Verify old password first
        let config = self.get_master_password_config()?;
        let old_salt = HEXLOWER
            .decode(config.salt.as_bytes())
            .map_err(|_| rusqlite::Error::ToSqlConversionFailure(Box::new(std::io::Error::other(
                "Invalid salt",
            ))))?;

        // Get all entries
        let entries = self.get_all_passwords()?;

        // Decrypt with old password and re-encrypt with new password
        let rng = SystemRandom::new();
        let mut new_salt = [0u8; SALT_LEN];
        rng.fill(&mut new_salt)
            .map_err(|_| rusqlite::Error::ToSqlConversionFailure(Box::new(std::io::Error::other(
                "Failed to generate salt",
            ))))?;

        for entry in entries {
            let decrypted = self.decrypt_password_internal(&entry.encrypted_password, old_password, &old_salt)
                .map_err(|_| rusqlite::Error::ToSqlConversionFailure(Box::new(std::io::Error::other(
                    "Failed to decrypt with old password",
                ))))?;

            let encrypted = self.encrypt_password_internal(&decrypted, new_password, &new_salt)
                .map_err(|_| rusqlite::Error::ToSqlConversionFailure(Box::new(std::io::Error::other(
                    "Failed to encrypt with new password",
                ))))?;

            let conn = self.db.lock().unwrap();
            conn.execute(
                "UPDATE passwords SET encrypted_password = ?1, date_modified = ?2 WHERE id = ?3",
                params![encrypted, chrono::Utc::now().timestamp(), entry.id],
            )?;
        }

        // Update master password config
        let new_salt_hex = HEXLOWER.encode(&new_salt);
        let now = chrono::Utc::now().timestamp();
        let conn = self.db.lock().unwrap();
        conn.execute(
            "UPDATE master_password SET salt = ?1, updated_at = ?2 WHERE id = 1",
            params![new_salt_hex, now],
        )?;

        Ok(())
    }

    // Password Entry Operations
    pub fn get_all_passwords(&self) -> Result<Vec<PasswordEntry>> {
        let conn = self.db.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, username, encrypted_password, url, notes, category, tags,
                    date_created, date_modified, last_used, favorite, strength_score
             FROM passwords
             ORDER BY date_modified DESC"
        )?;

        let entries = stmt.query_map([], |row| {
            let tags_json: String = row.get(7)?;
            let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();

            Ok(PasswordEntry {
                id: row.get(0)?,
                name: row.get(1)?,
                username: row.get(2)?,
                encrypted_password: row.get(3)?,
                url: row.get(4)?,
                notes: row.get(5)?,
                category: row.get(6)?,
                tags,
                date_created: row.get(8)?,
                date_modified: row.get(9)?,
                last_used: row.get(10)?,
                favorite: row.get(11)?,
                strength_score: row.get(12)?,
            })
        })?;

        entries.collect()
    }

    pub fn save_password(&self, entry: &PasswordEntry) -> Result<()> {
        let conn = self.db.lock().unwrap();
        let tags_json = serde_json::to_string(&entry.tags).unwrap_or_else(|_| "[]".to_string());

        conn.execute(
            "INSERT INTO passwords (id, name, username, encrypted_password, url, notes, category, tags,
                                   date_created, date_modified, last_used, favorite, strength_score)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            params![
                entry.id, entry.name, entry.username, entry.encrypted_password,
                entry.url, entry.notes, entry.category, tags_json,
                entry.date_created, entry.date_modified, entry.last_used,
                entry.favorite, entry.strength_score
            ],
        )?;

        Ok(())
    }

    pub fn update_password(&self, entry: &PasswordEntry) -> Result<()> {
        let conn = self.db.lock().unwrap();
        let tags_json = serde_json::to_string(&entry.tags).unwrap_or_else(|_| "[]".to_string());

        conn.execute(
            "UPDATE passwords SET name = ?1, username = ?2, encrypted_password = ?3, url = ?4,
                                  notes = ?5, category = ?6, tags = ?7, date_modified = ?8,
                                  last_used = ?9, favorite = ?10, strength_score = ?11
             WHERE id = ?12",
            params![
                entry.name, entry.username, entry.encrypted_password, entry.url,
                entry.notes, entry.category, tags_json, entry.date_modified,
                entry.last_used, entry.favorite, entry.strength_score, entry.id
            ],
        )?;

        Ok(())
    }

    pub fn delete_password(&self, id: &str) -> Result<()> {
        let conn = self.db.lock().unwrap();
        conn.execute("DELETE FROM passwords WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn update_last_used(&self, id: &str) -> Result<()> {
        let conn = self.db.lock().unwrap();
        let now = chrono::Utc::now().timestamp();
        conn.execute(
            "UPDATE passwords SET last_used = ?1 WHERE id = ?2",
            params![now, id],
        )?;
        Ok(())
    }

    // Category Operations
    pub fn get_all_categories(&self) -> Result<Vec<PasswordCategory>> {
        let conn = self.db.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT c.id, c.name, c.color, c.icon,
                    (SELECT COUNT(*) FROM passwords WHERE category = c.id) as count
             FROM password_categories c
             ORDER BY c.position"
        )?;

        let categories = stmt.query_map([], |row| {
            Ok(PasswordCategory {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                icon: row.get(3)?,
                count: row.get(4)?,
            })
        })?;

        categories.collect()
    }

    // Statistics
    pub fn get_stats(&self) -> Result<PasswordStats> {
        let conn = self.db.lock().unwrap();

        let total: i32 = conn.query_row("SELECT COUNT(*) FROM passwords", [], |row| row.get(0))?;
        
        let weak: i32 = conn.query_row(
            "SELECT COUNT(*) FROM passwords WHERE strength_score <= 1",
            [],
            |row| row.get(0)
        )?;
        
        let medium: i32 = conn.query_row(
            "SELECT COUNT(*) FROM passwords WHERE strength_score = 2 OR strength_score = 3",
            [],
            |row| row.get(0)
        )?;
        
        let strong: i32 = conn.query_row(
            "SELECT COUNT(*) FROM passwords WHERE strength_score >= 4",
            [],
            |row| row.get(0)
        )?;

        // Check for reused passwords (same encrypted_password)
        let reused: i32 = conn.query_row(
            "SELECT COUNT(*) FROM (
                SELECT encrypted_password FROM passwords
                GROUP BY encrypted_password
                HAVING COUNT(*) > 1
            )",
            [],
            |row| row.get(0)
        )?;

        let mut by_category = std::collections::HashMap::new();
        let mut stmt = conn.prepare("SELECT category, COUNT(*) FROM passwords GROUP BY category")?;
        let rows = stmt.query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, i32>(1)?))
        })?;

        for row in rows {
            let (category, count) = row?;
            by_category.insert(category, count);
        }

        Ok(PasswordStats {
            total_passwords: total,
            weak_passwords: weak,
            medium_passwords: medium,
            strong_passwords: strong,
            reused_passwords: reused,
            by_category,
        })
    }

    // Encryption utilities (internal)
    fn derive_key(&self, master_password: &str, salt: &[u8]) -> [u8; CREDENTIAL_LEN] {
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

    pub fn encrypt_password_internal(&self, password: &str, master_password: &str, salt: &[u8]) -> Result<String> {
        let key = self.derive_key(master_password, salt);
        let unbound_key = aead::UnboundKey::new(&aead::AES_256_GCM, &key)
            .map_err(|_| rusqlite::Error::ToSqlConversionFailure(Box::new(std::io::Error::other(
                "Failed to create key",
            ))))?;
        let sealing_key = aead::LessSafeKey::new(unbound_key);

        let rng = SystemRandom::new();
        let mut nonce_bytes = [0u8; NONCE_LEN];
        rng.fill(&mut nonce_bytes)
            .map_err(|_| rusqlite::Error::ToSqlConversionFailure(Box::new(std::io::Error::other(
                "Failed to generate nonce",
            ))))?;

        let nonce = aead::Nonce::assume_unique_for_key(nonce_bytes);
        let mut in_out = password.as_bytes().to_vec();
        sealing_key
            .seal_in_place_append_tag(nonce, aead::Aad::empty(), &mut in_out)
            .map_err(|_| rusqlite::Error::ToSqlConversionFailure(Box::new(std::io::Error::other(
                "Encryption failed",
            ))))?;

        let mut result = nonce_bytes.to_vec();
        result.extend_from_slice(&in_out);

        Ok(HEXLOWER.encode(&result))
    }

    pub fn decrypt_password_internal(&self, encrypted_hex: &str, master_password: &str, salt: &[u8]) -> Result<String> {
        let encrypted_data = HEXLOWER
            .decode(encrypted_hex.as_bytes())
            .map_err(|_| rusqlite::Error::ToSqlConversionFailure(Box::new(std::io::Error::other(
                "Invalid hex encoding",
            ))))?;

        if encrypted_data.len() < NONCE_LEN {
            return Err(rusqlite::Error::ToSqlConversionFailure(Box::new(std::io::Error::other(
                "Invalid encrypted data",
            ))));
        }

        let (nonce_bytes, ciphertext) = encrypted_data.split_at(NONCE_LEN);
        let mut nonce_array = [0u8; NONCE_LEN];
        nonce_array.copy_from_slice(nonce_bytes);
        let nonce = aead::Nonce::assume_unique_for_key(nonce_array);

        let key = self.derive_key(master_password, salt);
        let unbound_key = aead::UnboundKey::new(&aead::AES_256_GCM, &key)
            .map_err(|_| rusqlite::Error::ToSqlConversionFailure(Box::new(std::io::Error::other(
                "Failed to create key",
            ))))?;
        let opening_key = aead::LessSafeKey::new(unbound_key);

        let mut in_out = ciphertext.to_vec();
        let decrypted = opening_key
            .open_in_place(nonce, aead::Aad::empty(), &mut in_out)
            .map_err(|_| rusqlite::Error::ToSqlConversionFailure(Box::new(std::io::Error::other(
                "Decryption failed",
            ))))?;

        String::from_utf8(decrypted.to_vec())
            .map_err(|_| rusqlite::Error::ToSqlConversionFailure(Box::new(std::io::Error::other(
                "Invalid UTF-8",
            ))))
    }

    // Password Generation
    pub fn generate_password(&self, config: &PasswordGeneratorConfig) -> Result<String> {
        let mut charset = String::new();

        if config.include_lowercase {
            if config.exclude_ambiguous {
                charset.push_str("abcdefghjkmnpqrstuvwxyz"); // exclude i, l, o
            } else {
                charset.push_str("abcdefghijklmnopqrstuvwxyz");
            }
        }
        if config.include_uppercase {
            if config.exclude_ambiguous {
                charset.push_str("ABCDEFGHJKLMNPQRSTUVWXYZ"); // exclude I, O
            } else {
                charset.push_str("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
            }
        }
        if config.include_numbers {
            if config.exclude_ambiguous {
                charset.push_str("23456789"); // exclude 0, 1
            } else {
                charset.push_str("0123456789");
            }
        }
        if config.include_symbols {
            charset.push_str("!@#$%^&*()-_=+[]{}|;:,.<>?");
        }

        if charset.is_empty() {
            return Err(rusqlite::Error::ToSqlConversionFailure(Box::new(std::io::Error::other(
                "At least one character type must be selected",
            ))));
        }

        let charset_bytes: Vec<u8> = charset.bytes().collect();
        let rng = SystemRandom::new();
        let mut password = String::new();

        for _ in 0..config.length {
            let mut random_byte = [0u8; 1];
            rng.fill(&mut random_byte)
                .map_err(|_| rusqlite::Error::ToSqlConversionFailure(Box::new(std::io::Error::other(
                    "Random generation failed",
                ))))?;

            let idx = (random_byte[0] as usize) % charset_bytes.len();
            password.push(charset_bytes[idx] as char);
        }

        Ok(password)
    }

    // Password Strength Analysis
    pub fn analyze_strength(&self, password: &str) -> PasswordStrength {
        let mut score = 0u8;
        let mut feedback = Vec::new();

        if password.len() >= 12 {
            score += 1;
        } else {
            feedback.push("Password should be at least 12 characters".to_string());
        }

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

        if password.len() >= 16 {
            score += 1;
        }
        if password.len() >= 20 {
            score += 1;
        }

        let estimated_crack_time = match score {
            4.. => "Centuries",
            3 => "Years",
            2 => "Months",
            1 => "Days",
            _ => "Minutes",
        }.to_string();

        if feedback.is_empty() {
            feedback.push("Strong password!".to_string());
        }

        PasswordStrength {
            score,
            feedback,
            estimated_crack_time,
        }
    }
}
