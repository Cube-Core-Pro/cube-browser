// AI Commands - Tauri Interface
// Expose AI service to frontend
// Automatically uses Mock AI when no OpenAI API key is configured

use crate::services::ai_service::{AISelector, AIService, AIWorkflow};
use crate::services::mock_ai_service::MockAIService;
use std::env;
use std::sync::Arc;
use tauri::State;

/// Check if real OpenAI API key is configured
fn has_openai_key() -> bool {
    env::var("OPENAI_API_KEY")
        .ok()
        .filter(|key| !key.is_empty() && key.starts_with("sk-"))
        .is_some()
}

#[tauri::command]
pub async fn ai_suggest_selectors(
    element_description: String,
    page_html: String,
    ai: State<'_, Arc<AIService>>,
) -> Result<Vec<AISelector>, String> {
    if has_openai_key() {
        // Use real OpenAI API
        ai.suggest_selectors(&element_description, &page_html).await
    } else {
        // Use mock AI service for UI testing
        let mock = MockAIService::new();
        mock.suggest_selectors(&element_description, &page_html)
            .await
    }
}

#[tauri::command]
pub async fn ai_natural_language_to_workflow(
    description: String,
    ai: State<'_, Arc<AIService>>,
) -> Result<AIWorkflow, String> {
    if has_openai_key() {
        // Use real OpenAI API
        ai.natural_language_to_workflow(&description).await
    } else {
        // Use mock AI service for UI testing
        let mock = MockAIService::new();
        mock.natural_language_to_workflow(&description).await
    }
}

#[tauri::command]
pub async fn ai_improve_selector(
    current_selector: String,
    page_html: String,
    issue_description: String,
    ai: State<'_, Arc<AIService>>,
) -> Result<Vec<AISelector>, String> {
    if has_openai_key() {
        // Use real OpenAI API
        ai.improve_selector_advanced(&current_selector, &page_html, &issue_description)
            .await
    } else {
        // Use mock AI service for UI testing
        let mock = MockAIService::new();
        // Mock only takes selector and html, returns single result
        let result = mock.improve_selector(&current_selector, &page_html).await?;
        Ok(vec![result])
    }
}

#[tauri::command]
pub async fn ai_suggest_extraction_schema(
    page_html: String,
    extraction_goal: String,
    ai: State<'_, Arc<AIService>>,
) -> Result<String, String> {
    if has_openai_key() {
        // Use real OpenAI API
        ai.suggest_extraction_schema(&page_html, &extraction_goal)
            .await
    } else {
        // Use mock AI service for UI testing
        let mock = MockAIService::new();
        let schema = mock.suggest_extraction_schema(&extraction_goal).await?;
        Ok(serde_json::to_string_pretty(&schema).unwrap_or_else(|_| "{}".to_string()))
    }
}
