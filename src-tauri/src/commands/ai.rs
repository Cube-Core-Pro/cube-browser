use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct AIRequest {
    pub prompt: String,
    pub model: Option<String>,
    pub temperature: Option<f32>,
    pub max_tokens: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AIResponse {
    pub content: String,
    pub model: String,
    pub tokens_used: u32,
}

/// OpenAI completion command
#[command]
pub async fn openai_completion(api_key: String, request: AIRequest) -> Result<AIResponse, String> {
    let client = reqwest::Client::new();

    let model = request.model.unwrap_or_else(|| "gpt-5.2".to_string()); // Default to GPT-5.2

    let body = serde_json::json!({
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": request.prompt
            }
        ],
        "temperature": request.temperature.unwrap_or(0.7),
        "max_tokens": request.max_tokens.unwrap_or(2000)
    });

    let response = client
        .post("https://api.openai.com/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !response.status().is_success() {
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("OpenAI API error: {}", error_text));
    }

    let response_data: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    let content = response_data["choices"][0]["message"]["content"]
        .as_str()
        .unwrap_or("")
        .to_string();

    let tokens_used = response_data["usage"]["total_tokens"].as_u64().unwrap_or(0) as u32;

    Ok(AIResponse {
        content,
        model,
        tokens_used,
    })
}

/// Claude (Anthropic) completion command
#[command]
pub async fn claude_completion(api_key: String, request: AIRequest) -> Result<AIResponse, String> {
    let client = reqwest::Client::new();

    let model = request
        .model
        .unwrap_or_else(|| "claude-3-5-sonnet-20241022".to_string());

    let body = serde_json::json!({
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": request.prompt
            }
        ],
        "max_tokens": request.max_tokens.unwrap_or(4000),
        "temperature": request.temperature.unwrap_or(0.7)
    });

    let response = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !response.status().is_success() {
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("Claude API error: {}", error_text));
    }

    let response_data: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    let content = response_data["content"][0]["text"]
        .as_str()
        .unwrap_or("")
        .to_string();

    let tokens_used = response_data["usage"]["input_tokens"].as_u64().unwrap_or(0) as u32
        + response_data["usage"]["output_tokens"]
            .as_u64()
            .unwrap_or(0) as u32;

    Ok(AIResponse {
        content,
        model,
        tokens_used,
    })
}

/// Google Gemini completion command
#[command]
pub async fn gemini_completion(api_key: String, request: AIRequest) -> Result<AIResponse, String> {
    let client = reqwest::Client::new();

    let model = request
        .model
        .unwrap_or_else(|| "gemini-2.0-flash-exp".to_string());

    let body = serde_json::json!({
        "contents": [{
            "parts": [{
                "text": request.prompt
            }]
        }],
        "generationConfig": {
            "temperature": request.temperature.unwrap_or(0.7),
            "maxOutputTokens": request.max_tokens.unwrap_or(2000)
        }
    });

    let url = format!(
        "https://generativelanguage.googleapis.com/v1/models/{}:generateContent?key={}",
        model, api_key
    );

    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !response.status().is_success() {
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("Gemini API error: {}", error_text));
    }

    let response_data: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    let content = response_data["candidates"][0]["content"]["parts"][0]["text"]
        .as_str()
        .unwrap_or("")
        .to_string();

    // Gemini doesn't return token count in the same way, estimate it
    let tokens_used = (content.len() / 4) as u32;

    Ok(AIResponse {
        content,
        model,
        tokens_used,
    })
}
