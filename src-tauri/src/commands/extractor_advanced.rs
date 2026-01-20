// ============================================================================
// DATA EXTRACTOR MODULE - Advanced Features Backend
// ============================================================================
// MultiPage Extractor, Captcha Handler, AI Auto Detector, Self-Healing Selectors, Extraction Templates

use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

// ============================================================================
// MULTI-PAGE EXTRACTOR TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExtractionJob {
    pub id: String,
    pub name: String,
    pub url_pattern: String,
    pub pages_extracted: u32,
    pub total_pages: u32,
    pub status: String,
    pub started_at: u64,
    pub records_found: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PaginationConfig {
    pub pagination_type: String,
    pub next_button_selector: Option<String>,
    pub page_url_pattern: Option<String>,
    pub max_pages: u32,
    pub delay_ms: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MultiPageExtractorConfig {
    pub jobs: Vec<ExtractionJob>,
    pub pagination: PaginationConfig,
    pub concurrent_pages: u32,
}

pub struct MultiPageExtractorState {
    config: Mutex<MultiPageExtractorConfig>,
}

impl Default for MultiPageExtractorState {
    fn default() -> Self {
        let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
        Self {
            config: Mutex::new(MultiPageExtractorConfig {
                concurrent_pages: 3,
                pagination: PaginationConfig {
                    pagination_type: String::from("next_button"),
                    next_button_selector: Some(String::from(".pagination .next")),
                    page_url_pattern: None,
                    max_pages: 50,
                    delay_ms: 1000,
                },
                jobs: vec![
                    ExtractionJob { id: String::from("job-1"), name: String::from("Product Catalog"), url_pattern: String::from("https://store.example.com/products?page=*"), pages_extracted: 45, total_pages: 50, status: String::from("running"), started_at: now - 3600, records_found: 2250 },
                    ExtractionJob { id: String::from("job-2"), name: String::from("News Articles"), url_pattern: String::from("https://news.example.com/archive/*"), pages_extracted: 100, total_pages: 100, status: String::from("completed"), started_at: now - 86400, records_found: 500 },
                    ExtractionJob { id: String::from("job-3"), name: String::from("Directory Listings"), url_pattern: String::from("https://directory.example.com/listings"), pages_extracted: 0, total_pages: 200, status: String::from("paused"), started_at: now - 7200, records_found: 0 },
                ],
            }),
        }
    }
}

#[tauri::command]
pub async fn get_multipage_extractor_config(state: State<'_, MultiPageExtractorState>) -> Result<MultiPageExtractorConfig, String> {
    state.config.lock().map(|c| c.clone()).map_err(|e| format!("Lock error: {}", e))
}

#[tauri::command]
pub async fn toggle_extraction_job(job_id: String, status: String, state: State<'_, MultiPageExtractorState>) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    if let Some(job) = config.jobs.iter_mut().find(|j| j.id == job_id) {
        job.status = status;
    }
    Ok(())
}

// ============================================================================
// CAPTCHA HANDLER TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CaptchaProvider {
    pub id: String,
    pub name: String,
    pub provider_type: String,
    pub api_key_set: bool,
    pub is_active: bool,
    pub success_rate: f64,
    pub avg_solve_time_ms: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CaptchaSolve {
    pub id: String,
    pub captcha_type: String,
    pub site: String,
    pub solved_at: u64,
    pub duration_ms: u32,
    pub provider_used: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CaptchaHandlerConfig {
    pub providers: Vec<CaptchaProvider>,
    pub recent_solves: Vec<CaptchaSolve>,
    pub auto_solve: bool,
    pub total_solved: u32,
    pub balance_usd: f64,
}

pub struct CaptchaHandlerState {
    config: Mutex<CaptchaHandlerConfig>,
}

impl Default for CaptchaHandlerState {
    fn default() -> Self {
        let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
        Self {
            config: Mutex::new(CaptchaHandlerConfig {
                auto_solve: true,
                total_solved: 1567,
                balance_usd: 24.50,
                providers: vec![
                    CaptchaProvider { id: String::from("cap-1"), name: String::from("2Captcha"), provider_type: String::from("human"), api_key_set: true, is_active: true, success_rate: 98.5, avg_solve_time_ms: 45000 },
                    CaptchaProvider { id: String::from("cap-2"), name: String::from("Anti-Captcha"), provider_type: String::from("human"), api_key_set: true, is_active: false, success_rate: 97.2, avg_solve_time_ms: 38000 },
                    CaptchaProvider { id: String::from("cap-3"), name: String::from("hCaptcha AI"), provider_type: String::from("ai"), api_key_set: false, is_active: false, success_rate: 85.0, avg_solve_time_ms: 5000 },
                ],
                recent_solves: vec![
                    CaptchaSolve { id: String::from("sol-1"), captcha_type: String::from("reCAPTCHA v2"), site: String::from("example.com"), solved_at: now - 300, duration_ms: 42000, provider_used: String::from("2Captcha") },
                    CaptchaSolve { id: String::from("sol-2"), captcha_type: String::from("hCaptcha"), site: String::from("store.example.com"), solved_at: now - 600, duration_ms: 38500, provider_used: String::from("2Captcha") },
                ],
            }),
        }
    }
}

#[tauri::command]
pub async fn get_captcha_handler_config(state: State<'_, CaptchaHandlerState>) -> Result<CaptchaHandlerConfig, String> {
    state.config.lock().map(|c| c.clone()).map_err(|e| format!("Lock error: {}", e))
}

#[tauri::command]
pub async fn toggle_captcha_provider(provider_id: String, active: bool, state: State<'_, CaptchaHandlerState>) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    if let Some(provider) = config.providers.iter_mut().find(|p| p.id == provider_id) {
        provider.is_active = active;
    }
    Ok(())
}

// ============================================================================
// AI AUTO DETECTOR TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DetectedElement {
    pub id: String,
    pub element_type: String,
    pub selector: String,
    pub confidence: f64,
    pub label: String,
    pub parent_context: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AIAutoDetectorConfig {
    pub detected_elements: Vec<DetectedElement>,
    pub is_scanning: bool,
    pub last_scan_at: Option<u64>,
    pub model_version: String,
    pub auto_label: bool,
}

pub struct AIAutoDetectorState {
    config: Mutex<AIAutoDetectorConfig>,
}

impl Default for AIAutoDetectorState {
    fn default() -> Self {
        let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
        Self {
            config: Mutex::new(AIAutoDetectorConfig {
                is_scanning: false,
                last_scan_at: Some(now - 3600),
                model_version: String::from("v2.1.0"),
                auto_label: true,
                detected_elements: vec![
                    DetectedElement { id: String::from("det-1"), element_type: String::from("input"), selector: String::from("#email-input"), confidence: 0.98, label: String::from("Email Field"), parent_context: Some(String::from("Login Form")) },
                    DetectedElement { id: String::from("det-2"), element_type: String::from("input"), selector: String::from("#password-input"), confidence: 0.97, label: String::from("Password Field"), parent_context: Some(String::from("Login Form")) },
                    DetectedElement { id: String::from("det-3"), element_type: String::from("button"), selector: String::from("button[type='submit']"), confidence: 0.95, label: String::from("Submit Button"), parent_context: Some(String::from("Login Form")) },
                    DetectedElement { id: String::from("det-4"), element_type: String::from("table"), selector: String::from(".data-table"), confidence: 0.92, label: String::from("Data Table"), parent_context: None },
                ],
            }),
        }
    }
}

#[tauri::command]
pub async fn get_ai_auto_detector_config(state: State<'_, AIAutoDetectorState>) -> Result<AIAutoDetectorConfig, String> {
    state.config.lock().map(|c| c.clone()).map_err(|e| format!("Lock error: {}", e))
}

#[tauri::command]
pub async fn start_ai_scan(state: State<'_, AIAutoDetectorState>) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    config.is_scanning = true;
    Ok(())
}

// ============================================================================
// SELF-HEALING SELECTORS TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SelectorHealth {
    pub id: String,
    pub name: String,
    pub primary_selector: String,
    pub fallback_selectors: Vec<String>,
    pub health_score: u32,
    pub last_healed_at: Option<u64>,
    pub heal_count: u32,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SelfHealingSelectorsConfig {
    pub selectors: Vec<SelectorHealth>,
    pub auto_heal: bool,
    pub heal_threshold: u32,
    pub total_heals: u32,
}

pub struct SelfHealingSelectorsState {
    config: Mutex<SelfHealingSelectorsConfig>,
}

impl Default for SelfHealingSelectorsState {
    fn default() -> Self {
        let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
        Self {
            config: Mutex::new(SelfHealingSelectorsConfig {
                auto_heal: true,
                heal_threshold: 70,
                total_heals: 145,
                selectors: vec![
                    SelectorHealth { id: String::from("sel-1"), name: String::from("Login Email"), primary_selector: String::from("#email"), fallback_selectors: vec![String::from("input[type='email']"), String::from("input[name='email']")], health_score: 100, last_healed_at: None, heal_count: 0, status: String::from("healthy") },
                    SelectorHealth { id: String::from("sel-2"), name: String::from("Submit Button"), primary_selector: String::from("#submit-btn"), fallback_selectors: vec![String::from("button[type='submit']"), String::from(".submit-button")], health_score: 85, last_healed_at: Some(now - 86400), heal_count: 3, status: String::from("healthy") },
                    SelectorHealth { id: String::from("sel-3"), name: String::from("Product Price"), primary_selector: String::from(".price-value"), fallback_selectors: vec![String::from("[data-price]"), String::from(".product-price")], health_score: 65, last_healed_at: Some(now - 3600), heal_count: 8, status: String::from("warning") },
                    SelectorHealth { id: String::from("sel-4"), name: String::from("Cart Count"), primary_selector: String::from("#cart-count"), fallback_selectors: vec![String::from(".cart-badge")], health_score: 30, last_healed_at: Some(now - 1800), heal_count: 15, status: String::from("critical") },
                ],
            }),
        }
    }
}

#[tauri::command]
pub async fn get_self_healing_selectors_config(state: State<'_, SelfHealingSelectorsState>) -> Result<SelfHealingSelectorsConfig, String> {
    state.config.lock().map(|c| c.clone()).map_err(|e| format!("Lock error: {}", e))
}

#[tauri::command]
pub async fn heal_selector(selector_id: String, state: State<'_, SelfHealingSelectorsState>) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
    if let Some(selector) = config.selectors.iter_mut().find(|s| s.id == selector_id) {
        selector.health_score = 100;
        selector.last_healed_at = Some(now);
        selector.heal_count += 1;
        selector.status = String::from("healthy");
        config.total_heals += 1;
    }
    Ok(())
}

// ============================================================================
// EXTRACTION TEMPLATES TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExtractionField {
    pub id: String,
    pub name: String,
    pub selector: String,
    pub field_type: String,
    pub is_required: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExtractionTemplate {
    pub id: String,
    pub name: String,
    pub description: String,
    pub category: String,
    pub fields: Vec<ExtractionField>,
    pub url_pattern: String,
    pub created_at: u64,
    pub usage_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExtractionTemplatesConfig {
    pub templates: Vec<ExtractionTemplate>,
    pub categories: Vec<String>,
}

pub struct ExtractionTemplatesState {
    config: Mutex<ExtractionTemplatesConfig>,
}

impl Default for ExtractionTemplatesState {
    fn default() -> Self {
        let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
        Self {
            config: Mutex::new(ExtractionTemplatesConfig {
                categories: vec![String::from("E-commerce"), String::from("Social Media"), String::from("News"), String::from("Directory")],
                templates: vec![
                    ExtractionTemplate {
                        id: String::from("extpl-1"),
                        name: String::from("Product Listing"),
                        description: String::from("Extract product details from e-commerce sites"),
                        category: String::from("E-commerce"),
                        url_pattern: String::from("*/product/*"),
                        created_at: now - 30 * 24 * 60 * 60,
                        usage_count: 256,
                        fields: vec![
                            ExtractionField { id: String::from("f1"), name: String::from("Title"), selector: String::from("h1.product-title"), field_type: String::from("text"), is_required: true },
                            ExtractionField { id: String::from("f2"), name: String::from("Price"), selector: String::from(".price"), field_type: String::from("number"), is_required: true },
                            ExtractionField { id: String::from("f3"), name: String::from("Description"), selector: String::from(".description"), field_type: String::from("text"), is_required: false },
                        ],
                    },
                    ExtractionTemplate {
                        id: String::from("extpl-2"),
                        name: String::from("Article Content"),
                        description: String::from("Extract article text and metadata"),
                        category: String::from("News"),
                        url_pattern: String::from("*/article/*"),
                        created_at: now - 60 * 24 * 60 * 60,
                        usage_count: 189,
                        fields: vec![
                            ExtractionField { id: String::from("f4"), name: String::from("Headline"), selector: String::from("h1"), field_type: String::from("text"), is_required: true },
                            ExtractionField { id: String::from("f5"), name: String::from("Author"), selector: String::from(".author"), field_type: String::from("text"), is_required: false },
                            ExtractionField { id: String::from("f6"), name: String::from("Content"), selector: String::from("article"), field_type: String::from("html"), is_required: true },
                        ],
                    },
                ],
            }),
        }
    }
}

#[tauri::command]
pub async fn get_extraction_templates_config(state: State<'_, ExtractionTemplatesState>) -> Result<ExtractionTemplatesConfig, String> {
    state.config.lock().map(|c| c.clone()).map_err(|e| format!("Lock error: {}", e))
}

#[tauri::command]
pub async fn delete_extraction_template(template_id: String, state: State<'_, ExtractionTemplatesState>) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    config.templates.retain(|t| t.id != template_id);
    Ok(())
}
