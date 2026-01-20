use tauri::State;
use crate::services::{AIService, StorageService, EncryptionService};

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct AIRequest {
    pub prompt: String,
    pub model: String,
    pub temperature: f32,
    pub max_tokens: Option<u32>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct AIResponse {
    pub content: String,
    pub model: String,
    pub usage: TokenUsage,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct TokenUsage {
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub total_tokens: u32,
}

// AI Service Commands

#[tauri::command]
pub async fn set_ai_api_key(
    ai_service: State<'_, AIService>,
    api_key: String,
) -> Result<(), String> {
    ai_service.set_api_key(api_key);
    Ok(())
}

#[tauri::command]
pub async fn has_ai_api_key(ai_service: State<'_, AIService>) -> Result<bool, String> {
    Ok(ai_service.has_api_key())
}

#[tauri::command]
pub async fn send_ai_request(
    ai_service: State<'_, AIService>,
    request: AIRequest,
) -> Result<AIResponse, String> {
    let ai_request = crate::services::ai_service::AIRequest {
        prompt: request.prompt,
        model: request.model,
        temperature: request.temperature,
        max_tokens: request.max_tokens,
    };

    let response = ai_service.send_request(ai_request).await?;

    Ok(AIResponse {
        content: response.content,
        model: response.model,
        usage: TokenUsage {
            prompt_tokens: response.usage.prompt_tokens,
            completion_tokens: response.usage.completion_tokens,
            total_tokens: response.usage.total_tokens,
        },
    })
}

#[tauri::command]
pub async fn generate_selector(
    ai_service: State<'_, AIService>,
    description: String,
    page_html: Option<String>,
) -> Result<String, String> {
    ai_service.generate_selector(description, page_html).await
}

#[tauri::command]
pub async fn improve_selector(
    ai_service: State<'_, AIService>,
    current_selector: String,
    issue: String,
) -> Result<String, String> {
    ai_service.improve_selector(current_selector, issue).await
}

#[tauri::command]
pub async fn generate_workflow(
    ai_service: State<'_, AIService>,
    description: String,
) -> Result<String, String> {
    ai_service.generate_workflow(description).await
}

// Storage Service Commands

#[tauri::command]
pub async fn storage_set(
    storage: State<'_, StorageService>,
    key: String,
    value: String,
) -> Result<(), String> {
    storage.set(key, value)
}

#[tauri::command]
pub async fn storage_get(
    storage: State<'_, StorageService>,
    key: String,
) -> Result<Option<String>, String> {
    storage.get(&key)
}

#[tauri::command]
pub async fn storage_remove(
    storage: State<'_, StorageService>,
    key: String,
) -> Result<bool, String> {
    storage.remove(&key)
}

#[tauri::command]
pub async fn storage_clear(storage: State<'_, StorageService>) -> Result<(), String> {
    storage.clear()
}

#[tauri::command]
pub async fn storage_keys(storage: State<'_, StorageService>) -> Result<Vec<String>, String> {
    storage.keys()
}

#[tauri::command]
pub async fn storage_has(
    storage: State<'_, StorageService>,
    key: String,
) -> Result<bool, String> {
    storage.has(&key)
}

// Encryption Service Commands

#[tauri::command]
pub async fn encrypt_data(
    encryption: State<'_, EncryptionService>,
    data: String,
    password: String,
) -> Result<String, String> {
    encryption.encrypt(data.as_bytes(), &password)
}

#[tauri::command]
pub async fn decrypt_data(
    encryption: State<'_, EncryptionService>,
    encrypted: String,
    password: String,
) -> Result<String, String> {
    let decrypted = encryption.decrypt(&encrypted, &password)?;
    String::from_utf8(decrypted).map_err(|e| format!("Invalid UTF-8: {}", e))
}

#[tauri::command]
pub async fn hash_data(
    encryption: State<'_, EncryptionService>,
    data: String,
) -> Result<String, String> {
    Ok(encryption.hash(data.as_bytes()))
}

#[tauri::command]
pub async fn generate_random_string(
    encryption: State<'_, EncryptionService>,
    length: usize,
) -> Result<String, String> {
    encryption.generate_random_string(length)
}
