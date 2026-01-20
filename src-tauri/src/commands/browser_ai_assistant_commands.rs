// CUBE Nexum - AI Assistant Commands
// Tauri commands for AI-powered browser features

use tauri::State;
use std::collections::HashMap;
use std::sync::Mutex;
use crate::services::browser_ai_assistant::{
    AIBrowserAssistant, AIAssistantSettings, AIModel, Language, SummaryLevel,
    PageSummary, TranslationResult, FormFillSuggestion, SmartSearchResult,
    QuestionAnswer, ContentAnalysis, AITaskHistory, AIAssistantStats,
};

pub struct AIAssistantState(pub Mutex<AIBrowserAssistant>);

// ==================== Settings Commands ====================

#[tauri::command]
pub fn ai_get_settings(state: State<AIAssistantState>) -> Result<AIAssistantSettings, String> {
    let assistant = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(assistant.get_settings())
}

#[tauri::command]
pub fn ai_update_settings(
    state: State<AIAssistantState>,
    settings: AIAssistantSettings,
) -> Result<(), String> {
    let assistant = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    assistant.update_settings(settings);
    Ok(())
}

#[tauri::command]
pub fn ai_set_api_key(
    state: State<AIAssistantState>,
    api_key: String,
) -> Result<(), String> {
    let assistant = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    assistant.set_api_key(api_key);
    Ok(())
}

#[tauri::command]
pub fn ai_set_default_model(
    state: State<AIAssistantState>,
    model: AIModel,
) -> Result<(), String> {
    let assistant = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    assistant.set_default_model(model);
    Ok(())
}

#[tauri::command]
pub fn ai_set_default_language(
    state: State<AIAssistantState>,
    language: Language,
) -> Result<(), String> {
    let assistant = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    assistant.set_default_language(language);
    Ok(())
}

// ==================== Summarization Commands ====================

#[tauri::command]
pub fn ai_summarize_page(
    state: State<AIAssistantState>,
    url: String,
    title: String,
    content: String,
    level: SummaryLevel,
) -> Result<PageSummary, String> {
    let assistant = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    assistant.summarize_page(&url, &title, &content, level)
}

#[tauri::command]
pub fn ai_summarize_brief(
    state: State<AIAssistantState>,
    url: String,
    title: String,
    content: String,
) -> Result<PageSummary, String> {
    let assistant = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    assistant.summarize_page(&url, &title, &content, SummaryLevel::Brief)
}

#[tauri::command]
pub fn ai_summarize_detailed(
    state: State<AIAssistantState>,
    url: String,
    title: String,
    content: String,
) -> Result<PageSummary, String> {
    let assistant = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    assistant.summarize_page(&url, &title, &content, SummaryLevel::Detailed)
}

#[tauri::command]
pub fn ai_get_key_points(
    state: State<AIAssistantState>,
    url: String,
    title: String,
    content: String,
) -> Result<PageSummary, String> {
    let assistant = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    assistant.summarize_page(&url, &title, &content, SummaryLevel::KeyPoints)
}

// ==================== Translation Commands ====================

#[tauri::command]
pub fn ai_translate_text(
    state: State<AIAssistantState>,
    text: String,
    source_language: Option<Language>,
    target_language: Language,
) -> Result<TranslationResult, String> {
    let assistant = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    assistant.translate_text(&text, source_language, target_language)
}

#[tauri::command]
pub fn ai_translate_page(
    state: State<AIAssistantState>,
    url: String,
    content: String,
    target_language: Language,
) -> Result<TranslationResult, String> {
    let assistant = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    assistant.translate_page(&url, &content, target_language)
}

#[tauri::command]
pub fn ai_translate_to_english(
    state: State<AIAssistantState>,
    text: String,
) -> Result<TranslationResult, String> {
    let assistant = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    assistant.translate_text(&text, None, Language::English)
}

#[tauri::command]
pub fn ai_translate_to_spanish(
    state: State<AIAssistantState>,
    text: String,
) -> Result<TranslationResult, String> {
    let assistant = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    assistant.translate_text(&text, None, Language::Spanish)
}

#[tauri::command]
pub fn ai_translate_to_french(
    state: State<AIAssistantState>,
    text: String,
) -> Result<TranslationResult, String> {
    let assistant = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    assistant.translate_text(&text, None, Language::French)
}

#[tauri::command]
pub fn ai_translate_to_german(
    state: State<AIAssistantState>,
    text: String,
) -> Result<TranslationResult, String> {
    let assistant = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    assistant.translate_text(&text, None, Language::German)
}

#[tauri::command]
pub fn ai_translate_to_chinese(
    state: State<AIAssistantState>,
    text: String,
) -> Result<TranslationResult, String> {
    let assistant = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    assistant.translate_text(&text, None, Language::Chinese)
}

#[tauri::command]
pub fn ai_translate_to_japanese(
    state: State<AIAssistantState>,
    text: String,
) -> Result<TranslationResult, String> {
    let assistant = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    assistant.translate_text(&text, None, Language::Japanese)
}

// ==================== Form Filling Commands ====================

#[tauri::command]
pub fn ai_analyze_form(
    state: State<AIAssistantState>,
    form_html: String,
    url: String,
) -> Result<FormFillSuggestion, String> {
    let assistant = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(assistant.analyze_form(&form_html, &url))
}

#[tauri::command]
pub fn ai_suggest_form_values(
    state: State<AIAssistantState>,
    form_html: String,
    url: String,
    user_profile: HashMap<String, String>,
) -> Result<FormFillSuggestion, String> {
    let assistant = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    let mut suggestion = assistant.analyze_form(&form_html, &url);
    assistant.suggest_form_values(&mut suggestion, &user_profile);
    Ok(suggestion)
}

// ==================== Smart Search Commands ====================

#[tauri::command]
pub fn ai_enhance_search(
    state: State<AIAssistantState>,
    query: String,
) -> Result<SmartSearchResult, String> {
    let assistant = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(assistant.enhance_search(&query))
}

// ==================== Question Answering Commands ====================

#[tauri::command]
pub fn ai_answer_question(
    state: State<AIAssistantState>,
    question: String,
    context: String,
    url: String,
) -> Result<QuestionAnswer, String> {
    let assistant = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    assistant.answer_question(&question, &context, &url)
}

// ==================== Content Analysis Commands ====================

#[tauri::command]
pub fn ai_analyze_content(
    state: State<AIAssistantState>,
    url: String,
    content: String,
) -> Result<ContentAnalysis, String> {
    let assistant = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(assistant.analyze_content(&url, &content))
}

// ==================== Text Rewriting Commands ====================

#[tauri::command]
pub fn ai_rewrite_text(
    state: State<AIAssistantState>,
    text: String,
    style: String,
) -> Result<String, String> {
    let assistant = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    assistant.rewrite_text(&text, &style)
}

#[tauri::command]
pub fn ai_make_formal(
    state: State<AIAssistantState>,
    text: String,
) -> Result<String, String> {
    let assistant = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    assistant.rewrite_text(&text, "formal")
}

#[tauri::command]
pub fn ai_make_casual(
    state: State<AIAssistantState>,
    text: String,
) -> Result<String, String> {
    let assistant = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    assistant.rewrite_text(&text, "casual")
}

#[tauri::command]
pub fn ai_make_concise(
    state: State<AIAssistantState>,
    text: String,
) -> Result<String, String> {
    let assistant = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    assistant.rewrite_text(&text, "concise")
}

// ==================== Code Explanation Commands ====================

#[tauri::command]
pub fn ai_explain_code(
    state: State<AIAssistantState>,
    code: String,
    language: String,
) -> Result<String, String> {
    let assistant = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    assistant.explain_code(&code, &language)
}

// ==================== History Commands ====================

#[tauri::command]
pub fn ai_get_history(
    state: State<AIAssistantState>,
    limit: usize,
) -> Result<Vec<AITaskHistory>, String> {
    let assistant = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(assistant.get_history(limit))
}

#[tauri::command]
pub fn ai_clear_history(state: State<AIAssistantState>) -> Result<(), String> {
    let assistant = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    assistant.clear_history();
    Ok(())
}

// ==================== Statistics Commands ====================

#[tauri::command]
pub fn ai_get_stats(state: State<AIAssistantState>) -> Result<AIAssistantStats, String> {
    let assistant = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(assistant.get_stats())
}

#[tauri::command]
pub fn ai_reset_stats(state: State<AIAssistantState>) -> Result<(), String> {
    let assistant = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    assistant.reset_stats();
    Ok(())
}

// ==================== Cache Commands ====================

#[tauri::command]
pub fn ai_clear_cache(state: State<AIAssistantState>) -> Result<(), String> {
    let assistant = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    assistant.clear_cache();
    Ok(())
}

#[tauri::command]
pub fn ai_get_cache_size(state: State<AIAssistantState>) -> Result<(usize, usize), String> {
    let assistant = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    Ok(assistant.get_cache_size())
}

// ==================== Quick Actions ====================

#[tauri::command]
pub fn ai_quick_summarize(
    state: State<AIAssistantState>,
    content: String,
) -> Result<String, String> {
    let assistant = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    let summary = assistant.summarize_page("", "", &content, SummaryLevel::Brief)?;
    Ok(summary.summary)
}

#[tauri::command]
pub fn ai_quick_translate(
    state: State<AIAssistantState>,
    text: String,
    target: String,
) -> Result<String, String> {
    let assistant = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    let language = match target.to_lowercase().as_str() {
        "en" | "english" => Language::English,
        "es" | "spanish" => Language::Spanish,
        "fr" | "french" => Language::French,
        "de" | "german" => Language::German,
        "it" | "italian" => Language::Italian,
        "pt" | "portuguese" => Language::Portuguese,
        "zh" | "chinese" => Language::Chinese,
        "ja" | "japanese" => Language::Japanese,
        "ko" | "korean" => Language::Korean,
        "ar" | "arabic" => Language::Arabic,
        "ru" | "russian" => Language::Russian,
        _ => Language::English,
    };
    let result = assistant.translate_text(&text, None, language)?;
    Ok(result.translated_text)
}

#[tauri::command]
pub fn ai_quick_answer(
    state: State<AIAssistantState>,
    question: String,
    context: String,
) -> Result<String, String> {
    let assistant = state.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    let answer = assistant.answer_question(&question, &context, "")?;
    Ok(answer.answer)
}

// ==================== Available Languages ====================

#[tauri::command]
pub fn ai_get_available_languages() -> Vec<(String, String)> {
    vec![
        ("en".to_string(), "English".to_string()),
        ("es".to_string(), "Spanish".to_string()),
        ("fr".to_string(), "French".to_string()),
        ("de".to_string(), "German".to_string()),
        ("it".to_string(), "Italian".to_string()),
        ("pt".to_string(), "Portuguese".to_string()),
        ("zh".to_string(), "Chinese".to_string()),
        ("ja".to_string(), "Japanese".to_string()),
        ("ko".to_string(), "Korean".to_string()),
        ("ar".to_string(), "Arabic".to_string()),
        ("ru".to_string(), "Russian".to_string()),
        ("hi".to_string(), "Hindi".to_string()),
        ("nl".to_string(), "Dutch".to_string()),
        ("pl".to_string(), "Polish".to_string()),
        ("tr".to_string(), "Turkish".to_string()),
        ("vi".to_string(), "Vietnamese".to_string()),
        ("th".to_string(), "Thai".to_string()),
        ("id".to_string(), "Indonesian".to_string()),
    ]
}

#[tauri::command]
pub fn ai_get_available_models() -> Vec<(String, String)> {
    vec![
        ("gpt4".to_string(), "GPT-4".to_string()),
        ("gpt4turbo".to_string(), "GPT-4 Turbo".to_string()),
        ("gpt35turbo".to_string(), "GPT-3.5 Turbo".to_string()),
        ("claude3".to_string(), "Claude 3".to_string()),
        ("local".to_string(), "Local (Offline)".to_string()),
    ]
}

#[tauri::command]
pub fn ai_get_summary_levels() -> Vec<(String, String)> {
    vec![
        ("brief".to_string(), "Brief (1-2 sentences)".to_string()),
        ("standard".to_string(), "Standard (1 paragraph)".to_string()),
        ("detailed".to_string(), "Detailed (Multiple paragraphs)".to_string()),
        ("keypoints".to_string(), "Key Points (Bullet list)".to_string()),
    ]
}
