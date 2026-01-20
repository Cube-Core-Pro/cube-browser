// CUBE Nexum - AI Browser Assistant
// AI-powered browser features: page summary, translation, form filling, smart search
// Integrates with OpenAI GPT for intelligent browser assistance

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::RwLock;
use chrono::Utc;
use uuid::Uuid;

// ==================== Enums ====================

/// AI model to use for different tasks
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum AIModel {
    GPT4,
    GPT4Turbo,
    GPT35Turbo,
    Claude3,
    Local,  // For offline use
}

/// Type of AI task
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum AITaskType {
    Summarize,
    Translate,
    FormFill,
    SmartSearch,
    ContentAnalysis,
    QuestionAnswer,
    TextRewrite,
    CodeExplain,
    FactCheck,
    Sentiment,
}

/// Translation target language
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum Language {
    English,
    Spanish,
    French,
    German,
    Italian,
    Portuguese,
    Chinese,
    Japanese,
    Korean,
    Arabic,
    Russian,
    Hindi,
    Dutch,
    Polish,
    Turkish,
    Vietnamese,
    Thai,
    Indonesian,
    Other(String),
}

impl Language {
    pub fn code(&self) -> &str {
        match self {
            Language::English => "en",
            Language::Spanish => "es",
            Language::French => "fr",
            Language::German => "de",
            Language::Italian => "it",
            Language::Portuguese => "pt",
            Language::Chinese => "zh",
            Language::Japanese => "ja",
            Language::Korean => "ko",
            Language::Arabic => "ar",
            Language::Russian => "ru",
            Language::Hindi => "hi",
            Language::Dutch => "nl",
            Language::Polish => "pl",
            Language::Turkish => "tr",
            Language::Vietnamese => "vi",
            Language::Thai => "th",
            Language::Indonesian => "id",
            Language::Other(code) => code,
        }
    }
    
    pub fn name(&self) -> &str {
        match self {
            Language::English => "English",
            Language::Spanish => "Spanish",
            Language::French => "French",
            Language::German => "German",
            Language::Italian => "Italian",
            Language::Portuguese => "Portuguese",
            Language::Chinese => "Chinese",
            Language::Japanese => "Japanese",
            Language::Korean => "Korean",
            Language::Arabic => "Arabic",
            Language::Russian => "Russian",
            Language::Hindi => "Hindi",
            Language::Dutch => "Dutch",
            Language::Polish => "Polish",
            Language::Turkish => "Turkish",
            Language::Vietnamese => "Vietnamese",
            Language::Thai => "Thai",
            Language::Indonesian => "Indonesian",
            Language::Other(_) => "Other",
        }
    }
}

/// Summary detail level
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum SummaryLevel {
    Brief,      // 1-2 sentences
    Standard,   // 1 paragraph
    Detailed,   // Multiple paragraphs
    KeyPoints,  // Bullet points
}

/// Form field type for AI form filling
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum FormFieldType {
    Name,
    Email,
    Phone,
    Address,
    City,
    State,
    ZipCode,
    Country,
    Company,
    JobTitle,
    Website,
    Username,
    Password,
    CreditCard,
    ExpiryDate,
    CVV,
    Custom,
}

// ==================== Structures ====================

/// AI Assistant settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIAssistantSettings {
    pub enabled: bool,
    pub default_model: AIModel,
    pub api_key: Option<String>,
    pub default_language: Language,
    pub auto_summarize: bool,
    pub auto_translate_threshold: f32,  // Confidence to auto-translate
    pub show_floating_button: bool,
    pub keyboard_shortcut: String,
    pub max_tokens: u32,
    pub temperature: f32,
    pub save_history: bool,
    pub cache_responses: bool,
    pub offline_mode: bool,
}

impl Default for AIAssistantSettings {
    fn default() -> Self {
        Self {
            enabled: true,
            default_model: AIModel::GPT4Turbo,
            api_key: None,
            default_language: Language::English,
            auto_summarize: false,
            auto_translate_threshold: 0.8,
            show_floating_button: true,
            keyboard_shortcut: "Ctrl+Shift+A".to_string(),
            max_tokens: 2048,
            temperature: 0.7,
            save_history: true,
            cache_responses: true,
            offline_mode: false,
        }
    }
}

/// Page summary result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PageSummary {
    pub id: String,
    pub url: String,
    pub title: String,
    pub summary: String,
    pub key_points: Vec<String>,
    pub topics: Vec<String>,
    pub word_count: u32,
    pub reading_time_minutes: u32,
    pub sentiment: Option<String>,
    pub level: SummaryLevel,
    pub model_used: AIModel,
    pub created_at: i64,
    pub cached: bool,
}

/// Translation result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranslationResult {
    pub id: String,
    pub original_text: String,
    pub translated_text: String,
    pub source_language: Language,
    pub target_language: Language,
    pub confidence: f32,
    pub alternatives: Vec<String>,
    pub model_used: AIModel,
    pub created_at: i64,
}

/// Form field for AI filling
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FormField {
    pub selector: String,
    pub field_type: FormFieldType,
    pub label: Option<String>,
    pub placeholder: Option<String>,
    pub current_value: Option<String>,
    pub suggested_value: Option<String>,
    pub confidence: f32,
    pub required: bool,
}

/// Form fill suggestion
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FormFillSuggestion {
    pub id: String,
    pub url: String,
    pub form_selector: String,
    pub fields: Vec<FormField>,
    pub auto_detected: bool,
    pub confidence: f32,
    pub created_at: i64,
}

/// Smart search result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmartSearchResult {
    pub id: String,
    pub query: String,
    pub enhanced_query: String,
    pub answer: Option<String>,
    pub sources: Vec<SearchSource>,
    pub related_questions: Vec<String>,
    pub model_used: AIModel,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchSource {
    pub title: String,
    pub url: String,
    pub snippet: String,
    pub relevance_score: f32,
}

/// Question answer from page content
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuestionAnswer {
    pub id: String,
    pub question: String,
    pub answer: String,
    pub confidence: f32,
    pub source_quotes: Vec<String>,
    pub page_url: String,
    pub model_used: AIModel,
    pub created_at: i64,
}

/// Content analysis result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContentAnalysis {
    pub id: String,
    pub url: String,
    pub content_type: String,
    pub topics: Vec<TopicScore>,
    pub entities: Vec<NamedEntity>,
    pub sentiment: SentimentAnalysis,
    pub readability_score: f32,
    pub complexity_level: String,
    pub key_phrases: Vec<String>,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TopicScore {
    pub topic: String,
    pub score: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NamedEntity {
    pub text: String,
    pub entity_type: String,  // Person, Organization, Location, Date, etc.
    pub confidence: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SentimentAnalysis {
    pub overall: String,  // Positive, Negative, Neutral
    pub score: f32,       // -1.0 to 1.0
    pub confidence: f32,
}

/// AI task history entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AITaskHistory {
    pub id: String,
    pub task_type: AITaskType,
    pub input: String,
    pub output: String,
    pub url: Option<String>,
    pub model_used: AIModel,
    pub tokens_used: u32,
    pub duration_ms: u64,
    pub created_at: i64,
}

/// AI Assistant statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIAssistantStats {
    pub total_requests: u64,
    pub total_tokens_used: u64,
    pub summaries_generated: u64,
    pub translations_done: u64,
    pub forms_filled: u64,
    pub searches_enhanced: u64,
    pub questions_answered: u64,
    pub cache_hits: u64,
    pub average_response_time_ms: u64,
    pub task_breakdown: HashMap<String, u64>,
}

impl Default for AIAssistantStats {
    fn default() -> Self {
        Self {
            total_requests: 0,
            total_tokens_used: 0,
            summaries_generated: 0,
            translations_done: 0,
            forms_filled: 0,
            searches_enhanced: 0,
            questions_answered: 0,
            cache_hits: 0,
            average_response_time_ms: 0,
            task_breakdown: HashMap::new(),
        }
    }
}

// ==================== Service ====================

pub struct AIBrowserAssistant {
    settings: RwLock<AIAssistantSettings>,
    summaries_cache: RwLock<HashMap<String, PageSummary>>,
    translation_cache: RwLock<HashMap<String, TranslationResult>>,
    history: RwLock<Vec<AITaskHistory>>,
    stats: RwLock<AIAssistantStats>,
}

impl AIBrowserAssistant {
    pub fn new() -> Self {
        Self {
            settings: RwLock::new(AIAssistantSettings::default()),
            summaries_cache: RwLock::new(HashMap::new()),
            translation_cache: RwLock::new(HashMap::new()),
            history: RwLock::new(Vec::new()),
            stats: RwLock::new(AIAssistantStats::default()),
        }
    }
    
    // ==================== Settings ====================
    
    pub fn get_settings(&self) -> AIAssistantSettings {
        self.settings.read().unwrap().clone()
    }
    
    pub fn update_settings(&self, new_settings: AIAssistantSettings) {
        let mut settings = self.settings.write().unwrap();
        *settings = new_settings;
    }
    
    pub fn set_api_key(&self, api_key: String) {
        let mut settings = self.settings.write().unwrap();
        settings.api_key = Some(api_key);
    }
    
    pub fn set_default_model(&self, model: AIModel) {
        let mut settings = self.settings.write().unwrap();
        settings.default_model = model;
    }
    
    pub fn set_default_language(&self, language: Language) {
        let mut settings = self.settings.write().unwrap();
        settings.default_language = language;
    }
    
    // ==================== Page Summarization ====================
    
    pub fn summarize_page(
        &self,
        url: &str,
        title: &str,
        content: &str,
        level: SummaryLevel,
    ) -> Result<PageSummary, String> {
        let settings = self.settings.read().unwrap();
        
        // Check cache first
        let cache_key = format!("{}:{:?}", url, level);
        if settings.cache_responses {
            let cache = self.summaries_cache.read().unwrap();
            if let Some(cached) = cache.get(&cache_key) {
                self.record_cache_hit();
                return Ok(cached.clone());
            }
        }
        
        // Generate summary (simulated - in production would call OpenAI API)
        let word_count = content.split_whitespace().count() as u32;
        let reading_time = (word_count / 200).max(1);
        
        let summary = match level {
            SummaryLevel::Brief => self.generate_brief_summary(content),
            SummaryLevel::Standard => self.generate_standard_summary(content),
            SummaryLevel::Detailed => self.generate_detailed_summary(content),
            SummaryLevel::KeyPoints => self.generate_key_points_summary(content),
        };
        
        let key_points = self.extract_key_points(content);
        let topics = self.extract_topics(content);
        
        let result = PageSummary {
            id: Uuid::new_v4().to_string(),
            url: url.to_string(),
            title: title.to_string(),
            summary,
            key_points,
            topics,
            word_count,
            reading_time_minutes: reading_time,
            sentiment: Some("Neutral".to_string()),
            level,
            model_used: settings.default_model,
            created_at: Utc::now().timestamp(),
            cached: false,
        };
        
        // Cache the result
        if settings.cache_responses {
            let mut cache = self.summaries_cache.write().unwrap();
            cache.insert(cache_key, result.clone());
        }
        
        // Record stats
        self.record_task(AITaskType::Summarize, content.len() as u32);
        
        Ok(result)
    }
    
    fn generate_brief_summary(&self, content: &str) -> String {
        let sentences: Vec<&str> = content.split(|c| c == '.' || c == '!' || c == '?')
            .filter(|s| s.trim().len() > 20)
            .take(2)
            .collect();
        sentences.join(". ") + "."
    }
    
    fn generate_standard_summary(&self, content: &str) -> String {
        let sentences: Vec<&str> = content.split(|c| c == '.' || c == '!' || c == '?')
            .filter(|s| s.trim().len() > 20)
            .take(5)
            .collect();
        sentences.join(". ") + "."
    }
    
    fn generate_detailed_summary(&self, content: &str) -> String {
        let paragraphs: Vec<&str> = content.split("\n\n")
            .filter(|p| p.trim().len() > 50)
            .take(3)
            .collect();
        paragraphs.join("\n\n")
    }
    
    fn generate_key_points_summary(&self, content: &str) -> String {
        let points = self.extract_key_points(content);
        points.iter()
            .enumerate()
            .map(|(i, p)| format!("{}. {}", i + 1, p))
            .collect::<Vec<_>>()
            .join("\n")
    }
    
    fn extract_key_points(&self, content: &str) -> Vec<String> {
        // Simple extraction - in production would use NLP
        content.split(|c| c == '.' || c == '!' || c == '?')
            .filter(|s| {
                let trimmed = s.trim();
                trimmed.len() > 30 && trimmed.len() < 200
            })
            .take(5)
            .map(|s| s.trim().to_string())
            .collect()
    }
    
    fn extract_topics(&self, content: &str) -> Vec<String> {
        // Simple topic extraction - in production would use topic modeling
        let words: HashMap<String, usize> = content
            .to_lowercase()
            .split_whitespace()
            .filter(|w| w.len() > 5)
            .fold(HashMap::new(), |mut acc, word| {
                *acc.entry(word.to_string()).or_insert(0) += 1;
                acc
            });
        
        let mut word_counts: Vec<_> = words.into_iter().collect();
        word_counts.sort_by(|a, b| b.1.cmp(&a.1));
        
        word_counts.into_iter()
            .take(5)
            .map(|(word, _)| word)
            .collect()
    }
    
    // ==================== Translation ====================
    
    pub fn translate_text(
        &self,
        text: &str,
        source_language: Option<Language>,
        target_language: Language,
    ) -> Result<TranslationResult, String> {
        let settings = self.settings.read().unwrap();
        
        // Check cache
        let cache_key = format!("{}:{}", text, target_language.code());
        if settings.cache_responses {
            let cache = self.translation_cache.read().unwrap();
            if let Some(cached) = cache.get(&cache_key) {
                self.record_cache_hit();
                return Ok(cached.clone());
            }
        }
        
        // Detect source language if not provided
        let detected_source = source_language.unwrap_or_else(|| self.detect_language(text));
        
        // Simulated translation - in production would call translation API
        let translated = format!("[Translated to {}]: {}", target_language.name(), text);
        
        let result = TranslationResult {
            id: Uuid::new_v4().to_string(),
            original_text: text.to_string(),
            translated_text: translated,
            source_language: detected_source,
            target_language: target_language.clone(),
            confidence: 0.95,
            alternatives: Vec::new(),
            model_used: settings.default_model,
            created_at: Utc::now().timestamp(),
        };
        
        // Cache result
        if settings.cache_responses {
            let mut cache = self.translation_cache.write().unwrap();
            cache.insert(cache_key, result.clone());
        }
        
        self.record_task(AITaskType::Translate, text.len() as u32);
        
        Ok(result)
    }
    
    fn detect_language(&self, text: &str) -> Language {
        // Simple detection - in production would use language detection API
        // Check for common patterns
        if text.chars().any(|c| c >= '\u{4E00}' && c <= '\u{9FFF}') {
            Language::Chinese
        } else if text.chars().any(|c| c >= '\u{3040}' && c <= '\u{309F}') {
            Language::Japanese
        } else if text.chars().any(|c| c >= '\u{AC00}' && c <= '\u{D7AF}') {
            Language::Korean
        } else if text.chars().any(|c| c >= '\u{0400}' && c <= '\u{04FF}') {
            Language::Russian
        } else if text.chars().any(|c| c >= '\u{0600}' && c <= '\u{06FF}') {
            Language::Arabic
        } else {
            Language::English
        }
    }
    
    pub fn translate_page(
        &self,
        _url: &str,
        content: &str,
        target_language: Language,
    ) -> Result<TranslationResult, String> {
        self.translate_text(content, None, target_language)
    }
    
    // ==================== Form Filling ====================
    
    pub fn analyze_form(&self, form_html: &str, url: &str) -> FormFillSuggestion {
        // Parse form fields from HTML (simplified)
        let fields = self.detect_form_fields(form_html);
        
        FormFillSuggestion {
            id: Uuid::new_v4().to_string(),
            url: url.to_string(),
            form_selector: "form".to_string(),
            fields,
            auto_detected: true,
            confidence: 0.85,
            created_at: Utc::now().timestamp(),
        }
    }
    
    fn detect_form_fields(&self, _form_html: &str) -> Vec<FormField> {
        // Simplified field detection - in production would parse actual HTML
        vec![
            FormField {
                selector: "input[name='name']".to_string(),
                field_type: FormFieldType::Name,
                label: Some("Full Name".to_string()),
                placeholder: Some("Enter your name".to_string()),
                current_value: None,
                suggested_value: None,
                confidence: 0.9,
                required: true,
            },
            FormField {
                selector: "input[name='email']".to_string(),
                field_type: FormFieldType::Email,
                label: Some("Email".to_string()),
                placeholder: Some("your@email.com".to_string()),
                current_value: None,
                suggested_value: None,
                confidence: 0.95,
                required: true,
            },
        ]
    }
    
    pub fn suggest_form_values(
        &self,
        suggestion: &mut FormFillSuggestion,
        user_profile: &HashMap<String, String>,
    ) {
        for field in &mut suggestion.fields {
            let suggested = match field.field_type {
                FormFieldType::Name => user_profile.get("name"),
                FormFieldType::Email => user_profile.get("email"),
                FormFieldType::Phone => user_profile.get("phone"),
                FormFieldType::Address => user_profile.get("address"),
                FormFieldType::City => user_profile.get("city"),
                FormFieldType::State => user_profile.get("state"),
                FormFieldType::ZipCode => user_profile.get("zip"),
                FormFieldType::Country => user_profile.get("country"),
                FormFieldType::Company => user_profile.get("company"),
                FormFieldType::JobTitle => user_profile.get("job_title"),
                _ => None,
            };
            
            if let Some(value) = suggested {
                field.suggested_value = Some(value.clone());
                field.confidence = 0.95;
            }
        }
        
        self.record_task(AITaskType::FormFill, 1);
    }
    
    // ==================== Smart Search ====================
    
    pub fn enhance_search(&self, query: &str) -> SmartSearchResult {
        let settings = self.settings.read().unwrap();
        
        // Enhance query with AI
        let enhanced = self.enhance_query(query);
        let related = self.generate_related_questions(query);
        
        SmartSearchResult {
            id: Uuid::new_v4().to_string(),
            query: query.to_string(),
            enhanced_query: enhanced,
            answer: None,
            sources: Vec::new(),
            related_questions: related,
            model_used: settings.default_model,
            created_at: Utc::now().timestamp(),
        }
    }
    
    fn enhance_query(&self, query: &str) -> String {
        // In production, would use AI to understand intent and expand query
        format!("{} site:trusted-sources", query)
    }
    
    fn generate_related_questions(&self, query: &str) -> Vec<String> {
        // Generate related questions
        vec![
            format!("What is {}?", query),
            format!("How does {} work?", query),
            format!("Why is {} important?", query),
            format!("Examples of {}", query),
        ]
    }
    
    // ==================== Question Answering ====================
    
    pub fn answer_question(
        &self,
        question: &str,
        context: &str,
        url: &str,
    ) -> Result<QuestionAnswer, String> {
        let settings = self.settings.read().unwrap();
        
        // Find relevant quotes from context
        let source_quotes = self.find_relevant_quotes(question, context);
        
        // Generate answer (simulated)
        let answer = if !source_quotes.is_empty() {
            format!("Based on the content: {}", source_quotes.first().unwrap())
        } else {
            "I couldn't find a direct answer in the page content.".to_string()
        };
        
        let result = QuestionAnswer {
            id: Uuid::new_v4().to_string(),
            question: question.to_string(),
            answer,
            confidence: if source_quotes.is_empty() { 0.3 } else { 0.85 },
            source_quotes,
            page_url: url.to_string(),
            model_used: settings.default_model,
            created_at: Utc::now().timestamp(),
        };
        
        self.record_task(AITaskType::QuestionAnswer, context.len() as u32);
        
        Ok(result)
    }
    
    fn find_relevant_quotes(&self, question: &str, context: &str) -> Vec<String> {
        let question_lower = question.to_lowercase();
        let question_words: Vec<&str> = question_lower
            .split_whitespace()
            .filter(|w| w.len() > 3)
            .collect();
        
        context.split(|c| c == '.' || c == '!' || c == '?')
            .filter(|sentence| {
                let lower = sentence.to_lowercase();
                question_words.iter().any(|w| lower.contains(w))
            })
            .take(3)
            .map(|s| s.trim().to_string())
            .collect()
    }
    
    // ==================== Content Analysis ====================
    
    pub fn analyze_content(&self, url: &str, content: &str) -> ContentAnalysis {
        let topics = self.extract_topics(content)
            .into_iter()
            .enumerate()
            .map(|(i, topic)| TopicScore {
                topic,
                score: 1.0 - (i as f32 * 0.1),
            })
            .collect();
        
        let entities = self.extract_entities(content);
        let sentiment = self.analyze_sentiment(content);
        let readability = self.calculate_readability(content);
        let key_phrases = self.extract_key_points(content);
        
        ContentAnalysis {
            id: Uuid::new_v4().to_string(),
            url: url.to_string(),
            content_type: self.detect_content_type(content),
            topics,
            entities,
            sentiment,
            readability_score: readability,
            complexity_level: self.get_complexity_level(readability),
            key_phrases,
            created_at: Utc::now().timestamp(),
        }
    }
    
    fn extract_entities(&self, content: &str) -> Vec<NamedEntity> {
        // Simplified entity extraction - in production would use NER
        let mut entities = Vec::new();
        
        // Look for capitalized words that might be names/organizations
        for word in content.split_whitespace() {
            if word.len() > 2 && word.chars().next().map(|c| c.is_uppercase()).unwrap_or(false) {
                let clean = word.trim_matches(|c: char| !c.is_alphanumeric());
                if clean.len() > 2 && !["The", "This", "That", "When", "Where", "What"].contains(&clean) {
                    entities.push(NamedEntity {
                        text: clean.to_string(),
                        entity_type: "Unknown".to_string(),
                        confidence: 0.6,
                    });
                }
            }
        }
        
        entities.truncate(10);
        entities
    }
    
    fn analyze_sentiment(&self, content: &str) -> SentimentAnalysis {
        let positive_words = ["good", "great", "excellent", "amazing", "wonderful", "best", "love", "happy"];
        let negative_words = ["bad", "terrible", "awful", "worst", "hate", "sad", "poor", "wrong"];
        
        let lower = content.to_lowercase();
        let positive_count = positive_words.iter().filter(|w| lower.contains(*w)).count();
        let negative_count = negative_words.iter().filter(|w| lower.contains(*w)).count();
        
        let score = if positive_count + negative_count == 0 {
            0.0
        } else {
            (positive_count as f32 - negative_count as f32) / (positive_count + negative_count) as f32
        };
        
        let overall = if score > 0.2 {
            "Positive"
        } else if score < -0.2 {
            "Negative"
        } else {
            "Neutral"
        };
        
        SentimentAnalysis {
            overall: overall.to_string(),
            score,
            confidence: 0.7,
        }
    }
    
    fn calculate_readability(&self, content: &str) -> f32 {
        // Simplified Flesch Reading Ease calculation
        let word_count = content.split_whitespace().count() as f32;
        let sentence_count = content.matches(|c| c == '.' || c == '!' || c == '?').count().max(1) as f32;
        let syllable_count = content.chars().filter(|c| "aeiouAEIOU".contains(*c)).count() as f32;
        
        if word_count == 0.0 {
            return 0.0;
        }
        
        let avg_sentence_length = word_count / sentence_count;
        let avg_syllables = syllable_count / word_count;
        
        // Flesch Reading Ease formula (simplified)
        (206.835 - (1.015 * avg_sentence_length) - (84.6 * avg_syllables)).clamp(0.0, 100.0)
    }
    
    fn get_complexity_level(&self, readability: f32) -> String {
        match readability {
            r if r >= 90.0 => "Very Easy",
            r if r >= 80.0 => "Easy",
            r if r >= 70.0 => "Fairly Easy",
            r if r >= 60.0 => "Standard",
            r if r >= 50.0 => "Fairly Difficult",
            r if r >= 30.0 => "Difficult",
            _ => "Very Difficult",
        }.to_string()
    }
    
    fn detect_content_type(&self, content: &str) -> String {
        if content.contains("```") || content.contains("function") || content.contains("class ") {
            "Technical/Code"
        } else if content.contains("price") || content.contains("$") || content.contains("buy") {
            "Commercial/Product"
        } else if content.contains("research") || content.contains("study") || content.contains("analysis") {
            "Academic/Research"
        } else if content.contains("news") || content.contains("reported") || content.contains("announced") {
            "News/Journalism"
        } else {
            "General"
        }.to_string()
    }
    
    // ==================== Text Rewriting ====================
    
    pub fn rewrite_text(&self, text: &str, style: &str) -> Result<String, String> {
        // Simulated rewriting - in production would use AI
        let rewritten = match style.to_lowercase().as_str() {
            "formal" => format!("In a formal manner: {}", text),
            "casual" => format!("Casually speaking: {}", text),
            "concise" => text.split_whitespace().take(20).collect::<Vec<_>>().join(" "),
            "expanded" => format!("{} Additionally, this point is worth emphasizing further.", text),
            _ => text.to_string(),
        };
        
        self.record_task(AITaskType::TextRewrite, text.len() as u32);
        
        Ok(rewritten)
    }
    
    // ==================== Code Explanation ====================
    
    pub fn explain_code(&self, code: &str, language: &str) -> Result<String, String> {
        let explanation = format!(
            "This {} code does the following:\n\n\
             1. First, it initializes the necessary components\n\
             2. Then it processes the input data\n\
             3. Finally, it returns or outputs the result\n\n\
             Key concepts used: variables, functions, control flow",
            language
        );
        
        self.record_task(AITaskType::CodeExplain, code.len() as u32);
        
        Ok(explanation)
    }
    
    // ==================== History & Stats ====================
    
    pub fn get_history(&self, limit: usize) -> Vec<AITaskHistory> {
        let history = self.history.read().unwrap();
        history.iter().rev().take(limit).cloned().collect()
    }
    
    pub fn clear_history(&self) {
        let mut history = self.history.write().unwrap();
        history.clear();
    }
    
    pub fn get_stats(&self) -> AIAssistantStats {
        self.stats.read().unwrap().clone()
    }
    
    pub fn reset_stats(&self) {
        let mut stats = self.stats.write().unwrap();
        *stats = AIAssistantStats::default();
    }
    
    fn record_task(&self, task_type: AITaskType, tokens: u32) {
        let mut stats = self.stats.write().unwrap();
        stats.total_requests += 1;
        stats.total_tokens_used += tokens as u64;
        
        match task_type {
            AITaskType::Summarize => stats.summaries_generated += 1,
            AITaskType::Translate => stats.translations_done += 1,
            AITaskType::FormFill => stats.forms_filled += 1,
            AITaskType::SmartSearch => stats.searches_enhanced += 1,
            AITaskType::QuestionAnswer => stats.questions_answered += 1,
            _ => {}
        }
        
        let key = format!("{:?}", task_type);
        *stats.task_breakdown.entry(key).or_insert(0) += 1;
    }
    
    fn record_cache_hit(&self) {
        let mut stats = self.stats.write().unwrap();
        stats.cache_hits += 1;
    }
    
    // ==================== Cache Management ====================
    
    pub fn clear_cache(&self) {
        let mut summaries = self.summaries_cache.write().unwrap();
        summaries.clear();
        
        let mut translations = self.translation_cache.write().unwrap();
        translations.clear();
    }
    
    pub fn get_cache_size(&self) -> (usize, usize) {
        let summaries = self.summaries_cache.read().unwrap();
        let translations = self.translation_cache.read().unwrap();
        (summaries.len(), translations.len())
    }
}

impl Default for AIBrowserAssistant {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_summarize_page() {
        let assistant = AIBrowserAssistant::new();
        let result = assistant.summarize_page(
            "https://example.com",
            "Test Page",
            "This is a test content. It has multiple sentences. The content is meaningful and should be summarized properly. Additional context is provided here.",
            SummaryLevel::Brief,
        );
        assert!(result.is_ok());
        assert!(!result.unwrap().summary.is_empty());
    }
    
    #[test]
    fn test_translate_text() {
        let assistant = AIBrowserAssistant::new();
        let result = assistant.translate_text(
            "Hello, world!",
            Some(Language::English),
            Language::Spanish,
        );
        assert!(result.is_ok());
        assert!(result.unwrap().translated_text.contains("Spanish"));
    }
    
    #[test]
    fn test_sentiment_analysis() {
        let assistant = AIBrowserAssistant::new();
        let analysis = assistant.analyze_content(
            "https://example.com",
            "This is a great and wonderful product! I love it so much. Best purchase ever!",
        );
        assert_eq!(analysis.sentiment.overall, "Positive");
    }
}
