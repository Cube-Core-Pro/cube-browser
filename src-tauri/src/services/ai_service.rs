// AI Service - OpenAI Integration
// Smart selector suggestions, NLP to workflows, element detection

use async_openai::{
    types::{
        ChatCompletionRequestMessage, ChatCompletionRequestSystemMessageArgs,
        ChatCompletionRequestUserMessageArgs, CreateChatCompletionRequestArgs,
    },
    Client,
};
use serde::{Deserialize, Serialize};
use std::env;
use std::sync::Mutex;

// ============================================================================
// TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIRequest {
    pub prompt: String,
    pub model: String,
    pub temperature: f32,
    pub max_tokens: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIResponse {
    pub content: String,
    pub model: String,
    pub usage: TokenUsage,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIGenerateResponse {
    pub result: String,
    pub model: String,
    pub usage: TokenUsage,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenUsage {
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub total_tokens: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AISelector {
    pub selector: String,
    pub strategy: String, // "single", "multiple", "table", "list", "nested"
    pub confidence: f32,
    pub reasoning: String,
    pub example_values: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowStep {
    pub action: String, // "navigate", "click", "type", "extract", etc.
    pub selector: Option<String>,
    pub value: Option<String>,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIWorkflow {
    pub name: String,
    pub description: String,
    pub steps: Vec<WorkflowStep>,
    pub confidence: f32,
}

// ============================================================================
// AI SERVICE
// ============================================================================

pub struct AIService {
    client: Mutex<Client<async_openai::config::OpenAIConfig>>,
    api_key: Mutex<Option<String>>,
}

impl AIService {
    pub fn new() -> Self {
        let api_key = env::var("OPENAI_API_KEY").ok();

        let config = if let Some(ref key) = api_key {
            async_openai::config::OpenAIConfig::new().with_api_key(key.clone())
        } else {
            async_openai::config::OpenAIConfig::new()
        };

        let client = Client::with_config(config);

        Self {
            client: Mutex::new(client),
            api_key: Mutex::new(api_key),
        }
    }

    // ===== Basic API Key Management =====
    
    pub fn set_api_key(&self, key: String) {
        // Update the API key
        let mut api_key = self.api_key.lock().unwrap();
        *api_key = Some(key.clone());
        
        // CRITICAL FIX: Recreate client with new API key
        let config = async_openai::config::OpenAIConfig::new().with_api_key(key);
        let new_client = Client::with_config(config);
        
        let mut client = self.client.lock().unwrap();
        *client = new_client;
    }

    pub fn has_api_key(&self) -> bool {
        let api_key = self.api_key.lock().unwrap();
        api_key.is_some()
    }

    pub fn get_api_key(&self) -> Option<String> {
        let api_key = self.api_key.lock().unwrap();
        api_key.clone()
    }

    // ===== Simple Request Method =====
    
    pub async fn send_request(&self, request: AIRequest) -> Result<AIResponse, String> {
        let api_key = match self.get_api_key() {
            Some(key) => key,
            None => return Err("OpenAI API key not configured".to_string()),
        };

        let client = reqwest::Client::new();

        let body = serde_json::json!({
            "model": request.model,
            "messages": [
                {
                    "role": "user",
                    "content": request.prompt
                }
            ],
            "temperature": request.temperature,
            "max_tokens": request.max_tokens,
        });

        let response = client
            .post("https://api.openai.com/v1/chat/completions")
            .header("Authorization", format!("Bearer {}", api_key))
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Failed to send request: {}", e))?;

        if !response.status().is_success() {
            let error_text = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            return Err(format!("API request failed: {}", error_text));
        }

        let response_data: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        let content = response_data["choices"][0]["message"]["content"]
            .as_str()
            .unwrap_or("")
            .to_string();

        let usage = TokenUsage {
            prompt_tokens: response_data["usage"]["prompt_tokens"]
                .as_u64()
                .unwrap_or(0) as u32,
            completion_tokens: response_data["usage"]["completion_tokens"]
                .as_u64()
                .unwrap_or(0) as u32,
            total_tokens: response_data["usage"]["total_tokens"]
                .as_u64()
                .unwrap_or(0) as u32,
        };

        Ok(AIResponse {
            content,
            model: request.model,
            usage,
        })
    }

    /// Generic generate method for AI responses
    /// Used by advanced_selector and workflow_commands
    pub async fn generate(&self, request: &AIRequest) -> Result<AIGenerateResponse, String> {
        let response = self.send_request(request.clone()).await?;
        Ok(AIGenerateResponse {
            result: response.content,
            model: response.model,
            usage: response.usage,
        })
    }

    // ===== Simple Wrapper Methods (for backward compatibility) =====
    
    pub async fn generate_selector(
        &self,
        description: String,
        page_html: Option<String>,
    ) -> Result<String, String> {
        let mut prompt = format!(
            "Generate a CSS selector for the following element description: {}",
            description
        );

        if let Some(html) = page_html {
            prompt.push_str(&format!("\n\nPage HTML (truncated):\n{}", &html[..html.len().min(1000)]));
        }

        prompt.push_str("\n\nRespond with ONLY the CSS selector, no explanation.");

        let request = AIRequest {
            prompt,
            model: "gpt-5.2".to_string(),
            temperature: 0.1,
            max_tokens: Some(100),
        };

        let response = self.send_request(request).await?;
        Ok(response.content.trim().to_string())
    }

    pub async fn improve_selector(
        &self,
        current_selector: String,
        issue: String,
    ) -> Result<String, String> {
        let prompt = format!(
            "Improve this CSS selector: {}\n\nIssue: {}\n\nRespond with ONLY the improved selector, no explanation.",
            current_selector, issue
        );

        let request = AIRequest {
            prompt,
            model: "gpt-5.2".to_string(),
            temperature: 0.1,
            max_tokens: Some(100),
        };

        let response = self.send_request(request).await?;
        Ok(response.content.trim().to_string())
    }

    pub async fn generate_workflow(
        &self,
        description: String,
    ) -> Result<String, String> {
        let prompt = format!(
            "Create a web automation workflow for: {}\n\nRespond with a JSON workflow definition including nodes and edges.",
            description
        );

        let request = AIRequest {
            prompt,
            model: "gpt-5.2".to_string(),
            temperature: 0.3,
            max_tokens: Some(1000),
        };

        let response = self.send_request(request).await?;
        Ok(response.content)
    }

    // ===== Advanced AI Methods =====

    /// Generate smart CSS selector suggestions for a given HTML element description
    pub async fn suggest_selectors(
        &self,
        element_description: &str,
        page_html: &str,
    ) -> Result<Vec<AISelector>, String> {
        let system_prompt = r#"You are an expert web scraping assistant specialized in CSS selectors. 
Your task is to analyze HTML and suggest the best CSS selectors for extracting specific elements.

Rules:
1. Prefer stable selectors (IDs, semantic classes, data attributes)
2. Avoid index-based selectors unless necessary
3. Provide multiple alternatives with confidence scores
4. Explain your reasoning
5. Suggest extraction strategy (single, multiple, table, list, nested)

Output format (JSON array):
[
  {
    "selector": "CSS selector string",
    "strategy": "single|multiple|table|list|nested",
    "confidence": 0.0-1.0,
    "reasoning": "Why this selector is good",
    "example_values": ["example1", "example2"]
  }
]"#;

        let user_prompt = format!(
            "Element to extract: {}\n\nPage HTML (first 2000 chars):\n{}\n\nProvide 3 best CSS selectors as JSON array.",
            element_description,
            &page_html.chars().take(2000).collect::<String>()
        );

        let messages = vec![
            ChatCompletionRequestMessage::System(
                ChatCompletionRequestSystemMessageArgs::default()
                    .content(system_prompt)
                    .build()
                    .map_err(|e| e.to_string())?,
            ),
            ChatCompletionRequestMessage::User(
                ChatCompletionRequestUserMessageArgs::default()
                    .content(user_prompt)
                    .build()
                    .map_err(|e| e.to_string())?,
            ),
        ];

        let request = CreateChatCompletionRequestArgs::default()
            .model("gpt-5.2") // Advanced model for intelligent selector generation
            .messages(messages)
            .temperature(0.2) // Lower temp for more precise selectors
            .max_tokens(2000u32) // More tokens for complex selectors
            .build()
            .map_err(|e| e.to_string())?;

        // Clone the client to avoid holding lock across await
        let client_clone = {
            let client = self.client.lock().unwrap();
            client.clone()
        };

        let response = client_clone
            .chat()
            .create(request)
            .await
            .map_err(|e| format!("OpenAI API error: {}", e))?;

        let content = response
            .choices
            .first()
            .and_then(|choice| choice.message.content.as_ref())
            .ok_or("No response from AI")?;

        // Parse JSON response
        let selectors: Vec<AISelector> = serde_json::from_str(content)
            .map_err(|e| format!("Failed to parse AI response: {}", e))?;

        Ok(selectors)
    }

    /// Convert natural language description to automation workflow
    pub async fn natural_language_to_workflow(
        &self,
        description: &str,
    ) -> Result<AIWorkflow, String> {
        let system_prompt = r#"You are an expert at converting natural language descriptions into web automation workflows.

Your task is to create a step-by-step workflow from a user's description.

Available actions:
- navigate: Go to URL
- click: Click element
- type: Type text into input
- extract: Extract data from element
- screenshot: Take screenshot
- wait: Wait for time/element
- execute_js: Execute JavaScript

Output format (JSON):
{
  "name": "Workflow name",
  "description": "What this workflow does",
  "steps": [
    {
      "action": "action_type",
      "selector": "CSS selector (if needed)",
      "value": "value/text/url (if needed)",
      "description": "What this step does"
    }
  ],
  "confidence": 0.0-1.0
}"#;

        let user_prompt = format!(
            "User wants to automate: {}\n\nCreate a workflow as JSON.",
            description
        );

        let messages = vec![
            ChatCompletionRequestMessage::System(
                ChatCompletionRequestSystemMessageArgs::default()
                    .content(system_prompt)
                    .build()
                    .map_err(|e| e.to_string())?,
            ),
            ChatCompletionRequestMessage::User(
                ChatCompletionRequestUserMessageArgs::default()
                    .content(user_prompt)
                    .build()
                    .map_err(|e| e.to_string())?,
            ),
        ];

        let request = CreateChatCompletionRequestArgs::default()
            .model("gpt-5.2") // Advanced model for workflow generation
            .messages(messages)
            .temperature(0.3)
            .max_tokens(1500u32)
            .build()
            .map_err(|e| e.to_string())?;

        // Clone the client to avoid holding lock across await
        let client_clone = {
            let client = self.client.lock().unwrap();
            client.clone()
        };

        let response = client_clone
            .chat()
            .create(request)
            .await
            .map_err(|e| format!("OpenAI API error: {}", e))?;

        let content = response
            .choices
            .first()
            .and_then(|choice| choice.message.content.as_ref())
            .ok_or("No response from AI")?;

        // Parse JSON response
        let workflow: AIWorkflow = serde_json::from_str(content)
            .map_err(|e| format!("Failed to parse AI response: {}", e))?;

        Ok(workflow)
    }

    /// Improve an existing selector using AI with HTML context
    pub async fn improve_selector_advanced(
        &self,
        current_selector: &str,
        page_html: &str,
        issue_description: &str,
    ) -> Result<Vec<AISelector>, String> {
        let system_prompt = r#"You are an expert at fixing and improving CSS selectors for web scraping.

Your task is to analyze a problematic selector and suggest better alternatives.

Common issues:
- Selector too fragile (uses generated classes)
- Selector not specific enough (matches wrong elements)
- Selector breaks when page changes
- Selector is too complex

Provide improved selectors with explanations."#;

        let user_prompt = format!(
            "Current selector: {}\nIssue: {}\n\nPage HTML (first 2000 chars):\n{}\n\nSuggest 3 improved selectors as JSON array.",
            current_selector,
            issue_description,
            &page_html.chars().take(2000).collect::<String>()
        );

        let messages = vec![
            ChatCompletionRequestMessage::System(
                ChatCompletionRequestSystemMessageArgs::default()
                    .content(system_prompt)
                    .build()
                    .map_err(|e| e.to_string())?,
            ),
            ChatCompletionRequestMessage::User(
                ChatCompletionRequestUserMessageArgs::default()
                    .content(user_prompt)
                    .build()
                    .map_err(|e| e.to_string())?,
            ),
        ];

        let request = CreateChatCompletionRequestArgs::default()
            .model("gpt-5.2") // Best model for complex selector improvements
            .messages(messages)
            .temperature(0.3)
            .max_tokens(1000u32)
            .build()
            .map_err(|e| e.to_string())?;

        // Clone the client to avoid holding lock across await
        let client_clone = {
            let client = self.client.lock().unwrap();
            client.clone()
        };

        let response = client_clone
            .chat()
            .create(request)
            .await
            .map_err(|e| format!("OpenAI API error: {}", e))?;

        let content = response
            .choices
            .first()
            .and_then(|choice| choice.message.content.as_ref())
            .ok_or("No response from AI")?;

        // Parse JSON response
        let selectors: Vec<AISelector> = serde_json::from_str(content)
            .map_err(|e| format!("Failed to parse AI response: {}", e))?;

        Ok(selectors)
    }

    /// Analyze page structure and suggest extraction schema
    pub async fn suggest_extraction_schema(
        &self,
        page_html: &str,
        extraction_goal: &str,
    ) -> Result<String, String> {
        let system_prompt = r#"You are an expert at analyzing web pages and creating data extraction schemas.

Your task is to analyze HTML and suggest a complete extraction schema with:
- Fields to extract
- CSS selectors for each field
- Extraction strategies
- Data transformations
- Validation rules

Output should be a complete JSON schema ready to use."#;

        let user_prompt = format!(
            "Extraction goal: {}\n\nPage HTML (first 3000 chars):\n{}\n\nCreate complete extraction schema as JSON.",
            extraction_goal,
            &page_html.chars().take(3000).collect::<String>()
        );

        let messages = vec![
            ChatCompletionRequestMessage::System(
                ChatCompletionRequestSystemMessageArgs::default()
                    .content(system_prompt)
                    .build()
                    .map_err(|e| e.to_string())?,
            ),
            ChatCompletionRequestMessage::User(
                ChatCompletionRequestUserMessageArgs::default()
                    .content(user_prompt)
                    .build()
                    .map_err(|e| e.to_string())?,
            ),
        ];

        let request = CreateChatCompletionRequestArgs::default()
            .model("gpt-5.2") // Advanced model for schema generation
            .messages(messages)
            .temperature(0.2)
            .max_tokens(2000u32)
            .build()
            .map_err(|e| e.to_string())?;

        // Clone the client to avoid holding lock across await
        let client_clone = {
            let client = self.client.lock().unwrap();
            client.clone()
        };

        let response = client_clone
            .chat()
            .create(request)
            .await
            .map_err(|e| format!("OpenAI API error: {}", e))?;

        let content = response
            .choices
            .first()
            .and_then(|choice| choice.message.content.as_ref())
            .ok_or("No response from AI")?
            .clone();

        Ok(content)
    }

    /// Analyze video frame with OpenAI Vision API
    pub async fn analyze_frame(
        &self,
        frame_path: &str,
        analysis_prompt: Option<String>,
    ) -> Result<FrameAnalysisResult, String> {
        use base64::{engine::general_purpose, Engine as _};
        use std::fs;

        // Read and encode image to base64
        let image_bytes =
            fs::read(frame_path).map_err(|e| format!("Failed to read frame: {}", e))?;

        let base64_image = general_purpose::STANDARD.encode(&image_bytes);
        let image_url = format!("data:image/jpeg;base64,{}", base64_image);

        let default_prompt = "Analyze this video frame in detail. Describe:
1. Main UI elements visible (buttons, inputs, menus, etc.)
2. Actions being performed (clicks, typing, navigation, etc.)
3. Visual state (loading, error, success, etc.)
4. Text content visible
5. Any automation-relevant patterns

Provide structured output with features array and detailed description.";

        let prompt = analysis_prompt.unwrap_or_else(|| default_prompt.to_string());

        // Build messages with image
        let messages = vec![ChatCompletionRequestMessage::User(
            ChatCompletionRequestUserMessageArgs::default()
                .content(vec![
                    async_openai::types::ChatCompletionRequestMessageContentPart::Text(
                        async_openai::types::ChatCompletionRequestMessageContentPartText {
                            text: prompt.clone(),
                        },
                    ),
                    async_openai::types::ChatCompletionRequestMessageContentPart::ImageUrl(
                        async_openai::types::ChatCompletionRequestMessageContentPartImage {
                            image_url: async_openai::types::ImageUrl {
                                url: image_url,
                                detail: Some(async_openai::types::ImageDetail::High),
                            },
                        },
                    ),
                ])
                .build()
                .map_err(|e| e.to_string())?,
        )];

        let request = CreateChatCompletionRequestArgs::default()
            .model("gpt-5.2") // Vision-capable model for element identification
            .messages(messages)
            .temperature(0.2) // Precise element identification
            .max_tokens(2000u32) // More tokens for detailed analysis
            .build()
            .map_err(|e| e.to_string())?;

        // Clone the client to avoid holding the lock across await
        let client_clone = {
            let client = self.client.lock().unwrap();
            client.clone()
        };

        let response = client_clone
            .chat()
            .create(request)
            .await
            .map_err(|e| format!("OpenAI Vision API error: {}", e))?;

        let content = response
            .choices
            .first()
            .and_then(|choice| choice.message.content.as_ref())
            .ok_or("No response from AI")?
            .clone();

        // Parse response to extract features
        let features = self.extract_features_from_description(&content);
        let confidence = 0.95; // High confidence for GPT-5 vision analysis

        Ok(FrameAnalysisResult {
            frame_path: frame_path.to_string(),
            features,
            ai_description: Some(content),
            confidence,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        })
    }

    /// Analyze multiple frames in batch
    pub async fn analyze_frames_batch(
        &self,
        frame_paths: Vec<String>,
        analysis_prompt: Option<String>,
    ) -> Result<Vec<FrameAnalysisResult>, String> {
        let mut results = Vec::new();

        for frame_path in frame_paths {
            match self
                .analyze_frame(&frame_path, analysis_prompt.clone())
                .await
            {
                Ok(result) => results.push(result),
                Err(e) => {
                    log::error!("Failed to analyze frame {}: {}", frame_path, e);
                    // Continue with other frames even if one fails
                }
            }
        }

        if results.is_empty() {
            return Err("Failed to analyze any frames".to_string());
        }

        Ok(results)
    }

    /// Extract structured features from AI description
    fn extract_features_from_description(&self, description: &str) -> Vec<String> {
        let mut features = Vec::new();

        // Keywords to look for in description
        let keywords = vec![
            "button",
            "input",
            "form",
            "menu",
            "navigation",
            "modal",
            "dialog",
            "table",
            "list",
            "card",
            "dropdown",
            "checkbox",
            "radio",
            "toggle",
            "search",
            "filter",
            "sort",
            "pagination",
            "tab",
            "accordion",
            "loading",
            "error",
            "success",
            "warning",
            "notification",
            "click",
            "type",
            "scroll",
            "hover",
            "drag",
            "drop",
            "login",
            "signup",
            "submit",
            "cancel",
            "save",
            "delete",
            "edit",
        ];

        let description_lower = description.to_lowercase();
        for keyword in keywords {
            if description_lower.contains(keyword) {
                features.push(keyword.to_string());
            }
        }

        // If no features found, add generic one
        if features.is_empty() {
            features.push("general_ui".to_string());
        }

        features
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameAnalysisResult {
    pub frame_path: String,
    pub features: Vec<String>,
    pub ai_description: Option<String>,
    pub confidence: f64,
    pub timestamp: u64,
}
