// CUBE Nexum - Web Scraper Service
// Data extraction and scraping engine

use std::collections::HashMap;
use std::sync::RwLock;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// ==================== Types ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScraperSettings {
    pub enabled: bool,
    pub max_concurrent_requests: u32,
    pub request_delay_ms: u32,
    pub respect_robots_txt: bool,
    pub default_user_agent: String,
    pub timeout_seconds: u32,
    pub retry_count: u32,
    pub proxy_settings: Option<ProxySettings>,
    pub auto_save: bool,
    pub save_location: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxySettings {
    pub enabled: bool,
    pub url: String,
    pub username: Option<String>,
    pub password: Option<String>,
    pub rotate: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScrapingJob {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub source: DataSource,
    pub selectors: Vec<DataSelector>,
    pub output_format: OutputFormat,
    pub schedule: Option<JobSchedule>,
    pub status: JobStatus,
    pub result: Option<ScrapingResult>,
    pub error: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub last_run: Option<DateTime<Utc>>,
    pub run_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataSource {
    pub source_type: SourceType,
    pub urls: Vec<String>,
    pub url_pattern: Option<String>,
    pub pagination: Option<PaginationConfig>,
    pub authentication: Option<AuthConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SourceType {
    SinglePage,
    MultiPage,
    Sitemap,
    Api,
    Feed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaginationConfig {
    pub pagination_type: PaginationType,
    pub selector: Option<String>,
    pub url_parameter: Option<String>,
    pub max_pages: u32,
    pub page_delay_ms: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PaginationType {
    NextButton,
    PageNumbers,
    LoadMore,
    InfiniteScroll,
    UrlParameter,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthConfig {
    pub auth_type: AuthType,
    pub credentials: HashMap<String, String>,
    pub login_url: Option<String>,
    pub login_selectors: Option<LoginSelectors>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AuthType {
    None,
    BasicAuth,
    BearerToken,
    Cookie,
    FormLogin,
    OAuth,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoginSelectors {
    pub username_selector: String,
    pub password_selector: String,
    pub submit_selector: String,
    pub success_indicator: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataSelector {
    pub id: String,
    pub name: String,
    pub selector_type: SelectorType,
    pub selector: String,
    pub attribute: Option<String>,
    pub data_type: DataType,
    pub required: bool,
    pub multiple: bool,
    pub transform: Option<TransformRule>,
    pub children: Vec<DataSelector>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SelectorType {
    Css,
    XPath,
    Regex,
    JsonPath,
    Text,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DataType {
    Text,
    Number,
    Boolean,
    Date,
    Url,
    Image,
    Html,
    Json,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransformRule {
    pub transform_type: TransformType,
    pub parameters: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TransformType {
    Trim,
    Lowercase,
    Uppercase,
    Replace,
    Extract,
    Split,
    Join,
    Format,
    ParseDate,
    ParseNumber,
    Truncate,
    Default,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum OutputFormat {
    Json,
    Csv,
    Excel,
    Xml,
    Markdown,
    Html,
    Sqlite,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JobSchedule {
    pub schedule_type: ScheduleType,
    pub interval_minutes: Option<u32>,
    pub cron_expression: Option<String>,
    pub next_run: Option<DateTime<Utc>>,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ScheduleType {
    Once,
    Interval,
    Daily,
    Weekly,
    Cron,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum JobStatus {
    Idle,
    Queued,
    Running,
    Completed,
    Failed,
    Cancelled,
    Paused,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScrapingResult {
    pub job_id: String,
    pub data: Vec<HashMap<String, serde_json::Value>>,
    pub total_items: u32,
    pub pages_scraped: u32,
    pub start_time: DateTime<Utc>,
    pub end_time: DateTime<Utc>,
    pub duration_ms: u64,
    pub errors: Vec<ScrapingError>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScrapingError {
    pub url: String,
    pub error_type: ErrorType,
    pub message: String,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ErrorType {
    NetworkError,
    Timeout,
    ParseError,
    SelectorNotFound,
    AuthError,
    RateLimited,
    Blocked,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScrapingTemplate {
    pub id: String,
    pub name: String,
    pub description: String,
    pub category: String,
    pub selectors: Vec<DataSelector>,
    pub sample_url: Option<String>,
    pub is_public: bool,
    pub use_count: u32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScraperStats {
    pub total_jobs: u64,
    pub total_items_scraped: u64,
    pub total_pages_scraped: u64,
    pub jobs_by_status: HashMap<String, u32>,
    pub items_this_week: u32,
    pub most_scraped_domains: Vec<(String, u32)>,
    pub average_job_duration_ms: u64,
    pub error_rate: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SelectorTest {
    pub url: String,
    pub selector: DataSelector,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SelectorTestResult {
    pub matches: Vec<String>,
    pub match_count: u32,
    pub success: bool,
    pub error: Option<String>,
}

// ==================== Service Implementation ====================

pub struct BrowserWebScraperService {
    settings: RwLock<ScraperSettings>,
    jobs: RwLock<HashMap<String, ScrapingJob>>,
    templates: RwLock<HashMap<String, ScrapingTemplate>>,
    results: RwLock<HashMap<String, Vec<ScrapingResult>>>,
}

impl BrowserWebScraperService {
    pub fn new() -> Self {
        Self {
            settings: RwLock::new(Self::default_settings()),
            jobs: RwLock::new(HashMap::new()),
            templates: RwLock::new(Self::default_templates()),
            results: RwLock::new(HashMap::new()),
        }
    }

    fn default_settings() -> ScraperSettings {
        ScraperSettings {
            enabled: true,
            max_concurrent_requests: 3,
            request_delay_ms: 1000,
            respect_robots_txt: true,
            default_user_agent: "CUBE Nexum Scraper/1.0".to_string(),
            timeout_seconds: 30,
            retry_count: 3,
            proxy_settings: None,
            auto_save: true,
            save_location: None,
        }
    }

    fn default_templates() -> HashMap<String, ScrapingTemplate> {
        let mut templates = HashMap::new();

        templates.insert("article".to_string(), ScrapingTemplate {
            id: "article".to_string(),
            name: "Article Extractor".to_string(),
            description: "Extract article content from news sites".to_string(),
            category: "News".to_string(),
            selectors: vec![
                DataSelector {
                    id: "title".to_string(),
                    name: "Title".to_string(),
                    selector_type: SelectorType::Css,
                    selector: "article h1, .article-title, h1.title".to_string(),
                    attribute: None,
                    data_type: DataType::Text,
                    required: true,
                    multiple: false,
                    transform: Some(TransformRule {
                        transform_type: TransformType::Trim,
                        parameters: HashMap::new(),
                    }),
                    children: Vec::new(),
                },
                DataSelector {
                    id: "content".to_string(),
                    name: "Content".to_string(),
                    selector_type: SelectorType::Css,
                    selector: "article p, .article-body p, .content p".to_string(),
                    attribute: None,
                    data_type: DataType::Text,
                    required: true,
                    multiple: true,
                    transform: None,
                    children: Vec::new(),
                },
                DataSelector {
                    id: "author".to_string(),
                    name: "Author".to_string(),
                    selector_type: SelectorType::Css,
                    selector: ".author, .byline, [rel='author']".to_string(),
                    attribute: None,
                    data_type: DataType::Text,
                    required: false,
                    multiple: false,
                    transform: Some(TransformRule {
                        transform_type: TransformType::Trim,
                        parameters: HashMap::new(),
                    }),
                    children: Vec::new(),
                },
                DataSelector {
                    id: "date".to_string(),
                    name: "Publication Date".to_string(),
                    selector_type: SelectorType::Css,
                    selector: "time, .date, .publish-date".to_string(),
                    attribute: Some("datetime".to_string()),
                    data_type: DataType::Date,
                    required: false,
                    multiple: false,
                    transform: None,
                    children: Vec::new(),
                },
            ],
            sample_url: None,
            is_public: true,
            use_count: 0,
            created_at: Utc::now(),
        });

        templates.insert("product".to_string(), ScrapingTemplate {
            id: "product".to_string(),
            name: "Product Extractor".to_string(),
            description: "Extract product information from e-commerce sites".to_string(),
            category: "E-commerce".to_string(),
            selectors: vec![
                DataSelector {
                    id: "name".to_string(),
                    name: "Product Name".to_string(),
                    selector_type: SelectorType::Css,
                    selector: "h1.product-title, .product-name, [itemprop='name']".to_string(),
                    attribute: None,
                    data_type: DataType::Text,
                    required: true,
                    multiple: false,
                    transform: Some(TransformRule {
                        transform_type: TransformType::Trim,
                        parameters: HashMap::new(),
                    }),
                    children: Vec::new(),
                },
                DataSelector {
                    id: "price".to_string(),
                    name: "Price".to_string(),
                    selector_type: SelectorType::Css,
                    selector: ".price, [itemprop='price'], .product-price".to_string(),
                    attribute: None,
                    data_type: DataType::Number,
                    required: true,
                    multiple: false,
                    transform: Some(TransformRule {
                        transform_type: TransformType::ParseNumber,
                        parameters: HashMap::new(),
                    }),
                    children: Vec::new(),
                },
                DataSelector {
                    id: "image".to_string(),
                    name: "Product Image".to_string(),
                    selector_type: SelectorType::Css,
                    selector: ".product-image img, [itemprop='image']".to_string(),
                    attribute: Some("src".to_string()),
                    data_type: DataType::Image,
                    required: false,
                    multiple: false,
                    transform: None,
                    children: Vec::new(),
                },
                DataSelector {
                    id: "description".to_string(),
                    name: "Description".to_string(),
                    selector_type: SelectorType::Css,
                    selector: ".product-description, [itemprop='description']".to_string(),
                    attribute: None,
                    data_type: DataType::Text,
                    required: false,
                    multiple: false,
                    transform: None,
                    children: Vec::new(),
                },
            ],
            sample_url: None,
            is_public: true,
            use_count: 0,
            created_at: Utc::now(),
        });

        templates.insert("links".to_string(), ScrapingTemplate {
            id: "links".to_string(),
            name: "Link Extractor".to_string(),
            description: "Extract all links from a page".to_string(),
            category: "General".to_string(),
            selectors: vec![
                DataSelector {
                    id: "url".to_string(),
                    name: "URL".to_string(),
                    selector_type: SelectorType::Css,
                    selector: "a[href]".to_string(),
                    attribute: Some("href".to_string()),
                    data_type: DataType::Url,
                    required: true,
                    multiple: true,
                    transform: None,
                    children: Vec::new(),
                },
                DataSelector {
                    id: "text".to_string(),
                    name: "Link Text".to_string(),
                    selector_type: SelectorType::Css,
                    selector: "a[href]".to_string(),
                    attribute: None,
                    data_type: DataType::Text,
                    required: false,
                    multiple: true,
                    transform: Some(TransformRule {
                        transform_type: TransformType::Trim,
                        parameters: HashMap::new(),
                    }),
                    children: Vec::new(),
                },
            ],
            sample_url: None,
            is_public: true,
            use_count: 0,
            created_at: Utc::now(),
        });

        templates
    }

    // ==================== Settings ====================

    pub fn get_settings(&self) -> ScraperSettings {
        self.settings.read().unwrap().clone()
    }

    pub fn update_settings(&self, new_settings: ScraperSettings) {
        let mut settings = self.settings.write().unwrap();
        *settings = new_settings;
    }

    // ==================== Job Management ====================

    pub fn create_job(&self, name: String, description: Option<String>, source: DataSource, selectors: Vec<DataSelector>, output_format: OutputFormat) -> ScrapingJob {
        let now = Utc::now();

        let job = ScrapingJob {
            id: Uuid::new_v4().to_string(),
            name,
            description,
            source,
            selectors,
            output_format,
            schedule: None,
            status: JobStatus::Idle,
            result: None,
            error: None,
            created_at: now,
            updated_at: now,
            last_run: None,
            run_count: 0,
        };

        let id = job.id.clone();
        self.jobs.write().unwrap().insert(id, job.clone());

        job
    }

    pub fn get_job(&self, job_id: &str) -> Option<ScrapingJob> {
        self.jobs.read().unwrap().get(job_id).cloned()
    }

    pub fn get_all_jobs(&self) -> Vec<ScrapingJob> {
        self.jobs.read().unwrap().values().cloned().collect()
    }

    pub fn update_job(&self, job_id: &str, updates: JobUpdate) -> Result<ScrapingJob, String> {
        let mut jobs = self.jobs.write().unwrap();
        let job = jobs.get_mut(job_id)
            .ok_or_else(|| "Job not found".to_string())?;

        if let Some(name) = updates.name {
            job.name = name;
        }
        if let Some(description) = updates.description {
            job.description = description;
        }
        if let Some(source) = updates.source {
            job.source = source;
        }
        if let Some(selectors) = updates.selectors {
            job.selectors = selectors;
        }
        if let Some(output_format) = updates.output_format {
            job.output_format = output_format;
        }
        if let Some(schedule) = updates.schedule {
            job.schedule = schedule;
        }

        job.updated_at = Utc::now();

        Ok(job.clone())
    }

    pub fn delete_job(&self, job_id: &str) -> Result<(), String> {
        self.jobs.write().unwrap()
            .remove(job_id)
            .ok_or_else(|| "Job not found".to_string())?;
        
        // Also remove results
        self.results.write().unwrap().remove(job_id);
        
        Ok(())
    }

    pub fn run_job(&self, job_id: &str) -> Result<ScrapingJob, String> {
        let mut jobs = self.jobs.write().unwrap();
        let job = jobs.get_mut(job_id)
            .ok_or_else(|| "Job not found".to_string())?;

        if job.status == JobStatus::Running {
            return Err("Job is already running".to_string());
        }

        job.status = JobStatus::Running;
        job.last_run = Some(Utc::now());
        job.run_count += 1;

        // In real implementation, this would start the actual scraping
        // For now, simulate completion
        let result = ScrapingResult {
            job_id: job_id.to_string(),
            data: Vec::new(),
            total_items: 0,
            pages_scraped: 0,
            start_time: Utc::now(),
            end_time: Utc::now(),
            duration_ms: 0,
            errors: Vec::new(),
        };

        job.status = JobStatus::Completed;
        job.result = Some(result.clone());
        job.updated_at = Utc::now();

        // Store result
        drop(jobs);
        self.results.write().unwrap()
            .entry(job_id.to_string())
            .or_insert_with(Vec::new)
            .push(result);

        Ok(self.jobs.read().unwrap().get(job_id).cloned().unwrap())
    }

    pub fn stop_job(&self, job_id: &str) -> Result<ScrapingJob, String> {
        let mut jobs = self.jobs.write().unwrap();
        let job = jobs.get_mut(job_id)
            .ok_or_else(|| "Job not found".to_string())?;

        if job.status != JobStatus::Running {
            return Err("Job is not running".to_string());
        }

        job.status = JobStatus::Cancelled;
        job.updated_at = Utc::now();

        Ok(job.clone())
    }

    pub fn get_job_results(&self, job_id: &str) -> Vec<ScrapingResult> {
        self.results.read().unwrap()
            .get(job_id)
            .cloned()
            .unwrap_or_default()
    }

    // ==================== Templates ====================

    pub fn get_template(&self, template_id: &str) -> Option<ScrapingTemplate> {
        self.templates.read().unwrap().get(template_id).cloned()
    }

    pub fn get_all_templates(&self) -> Vec<ScrapingTemplate> {
        self.templates.read().unwrap().values().cloned().collect()
    }

    pub fn create_template(&self, name: String, description: String, category: String, selectors: Vec<DataSelector>) -> ScrapingTemplate {
        let template = ScrapingTemplate {
            id: Uuid::new_v4().to_string(),
            name,
            description,
            category,
            selectors,
            sample_url: None,
            is_public: false,
            use_count: 0,
            created_at: Utc::now(),
        };

        let id = template.id.clone();
        self.templates.write().unwrap().insert(id, template.clone());

        template
    }

    pub fn delete_template(&self, template_id: &str) -> Result<(), String> {
        self.templates.write().unwrap()
            .remove(template_id)
            .ok_or_else(|| "Template not found".to_string())?;
        Ok(())
    }

    pub fn create_job_from_template(&self, template_id: &str, name: String, urls: Vec<String>) -> Result<ScrapingJob, String> {
        let mut templates = self.templates.write().unwrap();
        let template = templates.get_mut(template_id)
            .ok_or_else(|| "Template not found".to_string())?;

        template.use_count += 1;
        let selectors = template.selectors.clone();
        drop(templates);

        let source = DataSource {
            source_type: if urls.len() > 1 { SourceType::MultiPage } else { SourceType::SinglePage },
            urls,
            url_pattern: None,
            pagination: None,
            authentication: None,
        };

        Ok(self.create_job(name, None, source, selectors, OutputFormat::Json))
    }

    // ==================== Selector Testing ====================

    pub fn test_selector(&self, _test: SelectorTest) -> SelectorTestResult {
        // In real implementation, this would fetch the URL and test the selector
        // For now, return a mock result
        SelectorTestResult {
            matches: Vec::new(),
            match_count: 0,
            success: true,
            error: None,
        }
    }

    // ==================== Export ====================

    pub fn export_result(&self, job_id: &str, format: OutputFormat) -> Result<String, String> {
        let results = self.results.read().unwrap();
        let job_results = results.get(job_id)
            .ok_or_else(|| "No results found".to_string())?;

        let latest = job_results.last()
            .ok_or_else(|| "No results found".to_string())?;

        // In real implementation, convert data to requested format
        match format {
            OutputFormat::Json => {
                serde_json::to_string_pretty(&latest.data)
                    .map_err(|e| format!("Serialization error: {}", e))
            }
            OutputFormat::Csv => {
                // Would convert to CSV format
                Ok("CSV export not yet implemented".to_string())
            }
            _ => Ok("Format not yet supported".to_string()),
        }
    }

    // ==================== Stats ====================

    pub fn get_stats(&self) -> ScraperStats {
        let jobs = self.jobs.read().unwrap();
        let results = self.results.read().unwrap();

        let mut by_status: HashMap<String, u32> = HashMap::new();
        let mut total_items = 0u64;
        let mut total_pages = 0u64;
        let mut total_duration = 0u64;
        let mut total_errors = 0u32;
        let mut domain_counts: HashMap<String, u32> = HashMap::new();

        let week_ago = Utc::now() - chrono::Duration::days(7);
        let mut items_this_week = 0u32;

        for job in jobs.values() {
            *by_status.entry(format!("{:?}", job.status)).or_insert(0) += 1;

            // Extract domain from URLs
            for url in &job.source.urls {
                if let Some(domain) = url.split("://").nth(1).and_then(|s| s.split('/').next()) {
                    *domain_counts.entry(domain.to_string()).or_insert(0) += 1;
                }
            }
        }

        for job_results in results.values() {
            for result in job_results {
                total_items += result.total_items as u64;
                total_pages += result.pages_scraped as u64;
                total_duration += result.duration_ms;
                total_errors += result.errors.len() as u32;

                if result.end_time > week_ago {
                    items_this_week += result.total_items;
                }
            }
        }

        let result_count = results.values().map(|v| v.len()).sum::<usize>();
        let avg_duration = if result_count > 0 {
            total_duration / result_count as u64
        } else {
            0
        };

        let total_requests = total_items + total_errors as u64;
        let error_rate = if total_requests > 0 {
            total_errors as f32 / total_requests as f32
        } else {
            0.0
        };

        let mut most_scraped: Vec<(String, u32)> = domain_counts.into_iter().collect();
        most_scraped.sort_by(|a, b| b.1.cmp(&a.1));
        most_scraped.truncate(10);

        ScraperStats {
            total_jobs: jobs.len() as u64,
            total_items_scraped: total_items,
            total_pages_scraped: total_pages,
            jobs_by_status: by_status,
            items_this_week,
            most_scraped_domains: most_scraped,
            average_job_duration_ms: avg_duration,
            error_rate,
        }
    }
}

// ==================== Update Types ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JobUpdate {
    pub name: Option<String>,
    pub description: Option<Option<String>>,
    pub source: Option<DataSource>,
    pub selectors: Option<Vec<DataSelector>>,
    pub output_format: Option<OutputFormat>,
    pub schedule: Option<Option<JobSchedule>>,
}

impl Default for BrowserWebScraperService {
    fn default() -> Self {
        Self::new()
    }
}
