use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageEntry {
    pub key: String,
    pub value: String,
    pub created_at: String,
    pub updated_at: String,
}

pub struct StorageService {
    entries: Mutex<HashMap<String, StorageEntry>>,
}

impl StorageService {
    pub fn new() -> Self {
        Self {
            entries: Mutex::new(HashMap::new()),
        }
    }

    pub fn set(&self, key: String, value: String) -> Result<(), String> {
        let mut entries = self.entries.lock().unwrap();
        let now = chrono::Utc::now().to_rfc3339();

        let entry = if let Some(mut existing) = entries.get(&key).cloned() {
            existing.value = value;
            existing.updated_at = now;
            existing
        } else {
            StorageEntry {
                key: key.clone(),
                value,
                created_at: now.clone(),
                updated_at: now,
            }
        };

        entries.insert(key, entry);
        Ok(())
    }

    pub fn get(&self, key: &str) -> Result<Option<String>, String> {
        let entries = self.entries.lock().unwrap();
        Ok(entries.get(key).map(|entry| entry.value.clone()))
    }

    pub fn remove(&self, key: &str) -> Result<bool, String> {
        let mut entries = self.entries.lock().unwrap();
        Ok(entries.remove(key).is_some())
    }

    pub fn clear(&self) -> Result<(), String> {
        let mut entries = self.entries.lock().unwrap();
        entries.clear();
        Ok(())
    }

    pub fn keys(&self) -> Result<Vec<String>, String> {
        let entries = self.entries.lock().unwrap();
        Ok(entries.keys().cloned().collect())
    }

    pub fn has(&self, key: &str) -> Result<bool, String> {
        let entries = self.entries.lock().unwrap();
        Ok(entries.contains_key(key))
    }

    pub fn get_all(&self) -> Result<HashMap<String, String>, String> {
        let entries = self.entries.lock().unwrap();
        Ok(entries
            .iter()
            .map(|(k, v)| (k.clone(), v.value.clone()))
            .collect())
    }

    pub fn size(&self) -> Result<usize, String> {
        let entries = self.entries.lock().unwrap();
        Ok(entries.len())
    }
}

impl Default for StorageService {
    fn default() -> Self {
        Self::new()
    }
}
