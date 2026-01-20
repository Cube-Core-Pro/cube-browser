// CUBE Nexum - Web Scraper Commands
// Tauri commands for web scraping service

use tauri::State;
use crate::services::browser_web_scraper::{
    BrowserWebScraperService, ScraperSettings, ScrapingJob, DataSource, DataSelector,
    OutputFormat, JobUpdate, ScrapingResult, ScrapingTemplate, SelectorTest,
    SelectorTestResult, ScraperStats,
};

// ==================== Settings Commands ====================

#[tauri::command]
pub fn get_scraper_settings(
    service: State<'_, BrowserWebScraperService>
) -> ScraperSettings {
    service.get_settings()
}

#[tauri::command]
pub fn update_scraper_settings(
    service: State<'_, BrowserWebScraperService>,
    settings: ScraperSettings
) {
    service.update_settings(settings);
}

// ==================== Job Commands ====================

#[tauri::command]
pub fn create_scraping_job(
    service: State<'_, BrowserWebScraperService>,
    name: String,
    description: Option<String>,
    source: DataSource,
    selectors: Vec<DataSelector>,
    output_format: OutputFormat
) -> ScrapingJob {
    service.create_job(name, description, source, selectors, output_format)
}

#[tauri::command]
pub fn get_scraping_job(
    service: State<'_, BrowserWebScraperService>,
    job_id: String
) -> Option<ScrapingJob> {
    service.get_job(&job_id)
}

#[tauri::command]
pub fn get_all_scraping_jobs(
    service: State<'_, BrowserWebScraperService>
) -> Vec<ScrapingJob> {
    service.get_all_jobs()
}

#[tauri::command]
pub fn update_scraping_job(
    service: State<'_, BrowserWebScraperService>,
    job_id: String,
    updates: JobUpdate
) -> Result<ScrapingJob, String> {
    service.update_job(&job_id, updates)
}

#[tauri::command]
pub fn delete_scraping_job(
    service: State<'_, BrowserWebScraperService>,
    job_id: String
) -> Result<(), String> {
    service.delete_job(&job_id)
}

#[tauri::command]
pub fn run_scraping_job(
    service: State<'_, BrowserWebScraperService>,
    job_id: String
) -> Result<ScrapingJob, String> {
    service.run_job(&job_id)
}

#[tauri::command]
pub fn stop_scraping_job(
    service: State<'_, BrowserWebScraperService>,
    job_id: String
) -> Result<ScrapingJob, String> {
    service.stop_job(&job_id)
}

#[tauri::command]
pub fn get_scraping_job_results(
    service: State<'_, BrowserWebScraperService>,
    job_id: String
) -> Vec<ScrapingResult> {
    service.get_job_results(&job_id)
}

// ==================== Template Commands ====================

#[tauri::command]
pub fn get_scraping_template(
    service: State<'_, BrowserWebScraperService>,
    template_id: String
) -> Option<ScrapingTemplate> {
    service.get_template(&template_id)
}

#[tauri::command]
pub fn get_all_scraping_templates(
    service: State<'_, BrowserWebScraperService>
) -> Vec<ScrapingTemplate> {
    service.get_all_templates()
}

#[tauri::command]
pub fn create_scraping_template(
    service: State<'_, BrowserWebScraperService>,
    name: String,
    description: String,
    category: String,
    selectors: Vec<DataSelector>
) -> ScrapingTemplate {
    service.create_template(name, description, category, selectors)
}

#[tauri::command]
pub fn delete_scraping_template(
    service: State<'_, BrowserWebScraperService>,
    template_id: String
) -> Result<(), String> {
    service.delete_template(&template_id)
}

#[tauri::command]
pub fn create_job_from_scraping_template(
    service: State<'_, BrowserWebScraperService>,
    template_id: String,
    name: String,
    urls: Vec<String>
) -> Result<ScrapingJob, String> {
    service.create_job_from_template(&template_id, name, urls)
}

// ==================== Selector Testing Commands ====================

#[tauri::command]
pub fn test_scraping_selector(
    service: State<'_, BrowserWebScraperService>,
    test: SelectorTest
) -> SelectorTestResult {
    service.test_selector(test)
}

// ==================== Export Commands ====================

#[tauri::command]
pub fn export_scraping_result(
    service: State<'_, BrowserWebScraperService>,
    job_id: String,
    format: OutputFormat
) -> Result<String, String> {
    service.export_result(&job_id, format)
}

// ==================== Stats Commands ====================

#[tauri::command]
pub fn get_scraper_stats(
    service: State<'_, BrowserWebScraperService>
) -> ScraperStats {
    service.get_stats()
}
