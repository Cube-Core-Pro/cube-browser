// ═══════════════════════════════════════════════════════════════════════════════
// RESEARCH & INTELLIGENCE MODULE - Complete Research Backend
// ═══════════════════════════════════════════════════════════════════════════════
//
// Features:
// - Web Scraping & Data Collection
// - Competitive Intelligence
// - Market Research
// - Trend Analysis
// - Report Generation
// - Data Enrichment
//
// ═══════════════════════════════════════════════════════════════════════════════

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::command;
use chrono::{DateTime, Utc};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & STRUCTURES
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ResearchType {
    Competitor,
    Market,
    Industry,
    Product,
    Customer,
    Technology,
    News,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ResearchStatus {
    Pending,
    InProgress,
    Completed,
    Failed,
    Archived,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResearchProject {
    pub id: String,
    pub name: String,
    pub description: String,
    pub research_type: ResearchType,
    pub status: ResearchStatus,
    pub keywords: Vec<String>,
    pub sources: Vec<ResearchSource>,
    pub findings: Vec<ResearchFinding>,
    pub competitors: Vec<Competitor>,
    pub insights: Vec<Insight>,
    pub reports: Vec<Report>,
    pub scheduled_updates: Option<ScheduledUpdate>,
    pub created_at: String,
    pub updated_at: String,
    pub last_run: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResearchSource {
    pub id: String,
    pub name: String,
    pub url: String,
    pub source_type: SourceType,
    pub last_scraped: Option<String>,
    pub scrape_frequency: String,
    pub enabled: bool,
    pub credentials: Option<SourceCredentials>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SourceType {
    Website,
    API,
    RSS,
    SocialMedia,
    Database,
    Document,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SourceCredentials {
    pub api_key: Option<String>,
    pub username: Option<String>,
    pub password: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResearchFinding {
    pub id: String,
    pub source_id: String,
    pub title: String,
    pub content: String,
    pub url: Option<String>,
    pub category: String,
    pub sentiment: Sentiment,
    pub relevance_score: f64,
    pub entities: Vec<Entity>,
    pub metadata: HashMap<String, String>,
    pub discovered_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Sentiment {
    Positive,
    Negative,
    Neutral,
    Mixed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Entity {
    pub name: String,
    pub entity_type: String,
    pub mentions: u32,
    pub sentiment: Sentiment,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Competitor {
    pub id: String,
    pub name: String,
    pub website: String,
    pub industry: String,
    pub description: String,
    pub strengths: Vec<String>,
    pub weaknesses: Vec<String>,
    pub products: Vec<CompetitorProduct>,
    pub pricing: Option<PricingInfo>,
    pub market_share: Option<f64>,
    pub social_presence: HashMap<String, String>,
    pub recent_news: Vec<NewsItem>,
    pub last_updated: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompetitorProduct {
    pub name: String,
    pub description: String,
    pub price: Option<f64>,
    pub features: Vec<String>,
    pub url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PricingInfo {
    pub model: String,
    pub tiers: Vec<PricingTier>,
    pub currency: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PricingTier {
    pub name: String,
    pub price: f64,
    pub billing_period: String,
    pub features: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewsItem {
    pub title: String,
    pub url: String,
    pub source: String,
    pub published_at: String,
    pub summary: Option<String>,
    pub sentiment: Sentiment,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Insight {
    pub id: String,
    pub title: String,
    pub description: String,
    pub insight_type: InsightType,
    pub priority: Priority,
    pub impact: Impact,
    pub recommendations: Vec<String>,
    pub supporting_data: Vec<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum InsightType {
    Opportunity,
    Threat,
    Trend,
    Anomaly,
    Recommendation,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Priority {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Impact {
    Minimal,
    Moderate,
    Significant,
    Transformative,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Report {
    pub id: String,
    pub name: String,
    pub report_type: ReportType,
    pub content: String,
    pub format: ReportFormat,
    pub sections: Vec<ReportSection>,
    pub generated_at: String,
    pub file_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ReportType {
    CompetitorAnalysis,
    MarketOverview,
    TrendReport,
    ExecutiveSummary,
    DetailedAnalysis,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ReportFormat {
    PDF,
    HTML,
    Markdown,
    JSON,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReportSection {
    pub title: String,
    pub content: String,
    pub charts: Vec<ChartData>,
    pub tables: Vec<TableData>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChartData {
    pub chart_type: String,
    pub title: String,
    pub data: Vec<DataPoint>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataPoint {
    pub label: String,
    pub value: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableData {
    pub headers: Vec<String>,
    pub rows: Vec<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScheduledUpdate {
    pub frequency: String,
    pub next_run: String,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrendData {
    pub keyword: String,
    pub volume: u64,
    pub change_percent: f64,
    pub trend_direction: String,
    pub related_terms: Vec<String>,
    pub geographic_interest: HashMap<String, f64>,
    pub time_series: Vec<TimeSeriesPoint>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeSeriesPoint {
    pub date: String,
    pub value: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub id: String,
    pub title: String,
    pub url: String,
    pub snippet: String,
    pub source: String,
    pub published_at: Option<String>,
    pub relevance_score: f64,
    pub category: String,
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Default)]
pub struct ResearchState {
    pub projects: Mutex<Vec<ResearchProject>>,
    pub search_history: Mutex<Vec<SearchResult>>,
}

impl ResearchState {
    pub fn new() -> Self {
        Self::default()
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

#[command]
pub async fn research_create_project(
    state: tauri::State<'_, ResearchState>,
    name: String,
    description: String,
    research_type: String,
    keywords: Vec<String>,
) -> Result<ResearchProject, String> {
    let research_type_enum = match research_type.to_lowercase().as_str() {
        "competitor" => ResearchType::Competitor,
        "market" => ResearchType::Market,
        "industry" => ResearchType::Industry,
        "product" => ResearchType::Product,
        "customer" => ResearchType::Customer,
        "technology" => ResearchType::Technology,
        "news" => ResearchType::News,
        _ => ResearchType::Market,
    };

    let project = ResearchProject {
        id: uuid::Uuid::new_v4().to_string(),
        name,
        description,
        research_type: research_type_enum,
        status: ResearchStatus::Pending,
        keywords,
        sources: Vec::new(),
        findings: Vec::new(),
        competitors: Vec::new(),
        insights: Vec::new(),
        reports: Vec::new(),
        scheduled_updates: None,
        created_at: Utc::now().to_rfc3339(),
        updated_at: Utc::now().to_rfc3339(),
        last_run: None,
    };

    let mut projects = state.projects.lock().map_err(|e| e.to_string())?;
    projects.push(project.clone());

    Ok(project)
}

#[command]
pub async fn research_get_projects(
    state: tauri::State<'_, ResearchState>,
    research_type: Option<String>,
    status: Option<String>,
) -> Result<Vec<ResearchProject>, String> {
    let projects = state.projects.lock().map_err(|e| e.to_string())?;
    
    let filtered: Vec<ResearchProject> = projects.iter()
        .filter(|p| {
            let type_match = research_type.as_ref()
                .map(|t| format!("{:?}", p.research_type).to_lowercase() == t.to_lowercase())
                .unwrap_or(true);
            let status_match = status.as_ref()
                .map(|s| format!("{:?}", p.status).to_lowercase() == s.to_lowercase())
                .unwrap_or(true);
            type_match && status_match
        })
        .cloned()
        .collect();

    Ok(filtered)
}

#[command]
pub async fn research_get_project(
    state: tauri::State<'_, ResearchState>,
    project_id: String,
) -> Result<ResearchProject, String> {
    let projects = state.projects.lock().map_err(|e| e.to_string())?;
    
    projects.iter()
        .find(|p| p.id == project_id)
        .cloned()
        .ok_or_else(|| format!("Project not found: {}", project_id))
}

#[command]
pub async fn research_update_project(
    state: tauri::State<'_, ResearchState>,
    project_id: String,
    name: Option<String>,
    description: Option<String>,
    keywords: Option<Vec<String>>,
    status: Option<String>,
) -> Result<ResearchProject, String> {
    let mut projects = state.projects.lock().map_err(|e| e.to_string())?;
    
    let project = projects.iter_mut()
        .find(|p| p.id == project_id)
        .ok_or_else(|| format!("Project not found: {}", project_id))?;

    if let Some(n) = name { project.name = n; }
    if let Some(d) = description { project.description = d; }
    if let Some(k) = keywords { project.keywords = k; }
    if let Some(s) = status {
        project.status = match s.to_lowercase().as_str() {
            "pending" => ResearchStatus::Pending,
            "inprogress" | "in_progress" => ResearchStatus::InProgress,
            "completed" => ResearchStatus::Completed,
            "failed" => ResearchStatus::Failed,
            "archived" => ResearchStatus::Archived,
            _ => return Err(format!("Invalid status: {}", s)),
        };
    }
    project.updated_at = Utc::now().to_rfc3339();

    Ok(project.clone())
}

#[command]
pub async fn research_delete_project(
    state: tauri::State<'_, ResearchState>,
    project_id: String,
) -> Result<bool, String> {
    let mut projects = state.projects.lock().map_err(|e| e.to_string())?;
    let initial_len = projects.len();
    projects.retain(|p| p.id != project_id);
    
    Ok(projects.len() < initial_len)
}

#[command]
pub async fn research_run_project(
    state: tauri::State<'_, ResearchState>,
    project_id: String,
) -> Result<ResearchProject, String> {
    let mut projects = state.projects.lock().map_err(|e| e.to_string())?;
    
    let project = projects.iter_mut()
        .find(|p| p.id == project_id)
        .ok_or_else(|| format!("Project not found: {}", project_id))?;

    project.status = ResearchStatus::InProgress;
    project.last_run = Some(Utc::now().to_rfc3339());

    // Simulate research findings
    let finding = ResearchFinding {
        id: uuid::Uuid::new_v4().to_string(),
        source_id: "web".to_string(),
        title: format!("Analysis for: {}", project.keywords.first().unwrap_or(&"general".to_string())),
        content: "Comprehensive analysis based on multiple sources indicates significant market opportunity.".to_string(),
        url: Some("https://example.com/analysis".to_string()),
        category: "Market Analysis".to_string(),
        sentiment: Sentiment::Positive,
        relevance_score: 0.85,
        entities: vec![
            Entity {
                name: "Market Trend".to_string(),
                entity_type: "trend".to_string(),
                mentions: 15,
                sentiment: Sentiment::Positive,
            },
        ],
        metadata: HashMap::new(),
        discovered_at: Utc::now().to_rfc3339(),
    };
    project.findings.push(finding);

    // Generate insight
    let insight = Insight {
        id: uuid::Uuid::new_v4().to_string(),
        title: "Growth Opportunity Identified".to_string(),
        description: "Analysis reveals untapped market segment with high potential.".to_string(),
        insight_type: InsightType::Opportunity,
        priority: Priority::High,
        impact: Impact::Significant,
        recommendations: vec![
            "Expand product offering to target segment".to_string(),
            "Increase marketing spend in identified channels".to_string(),
        ],
        supporting_data: vec!["Finding-1".to_string()],
        created_at: Utc::now().to_rfc3339(),
    };
    project.insights.push(insight);

    project.status = ResearchStatus::Completed;
    project.updated_at = Utc::now().to_rfc3339();

    Ok(project.clone())
}

// ═══════════════════════════════════════════════════════════════════════════════
// SOURCE COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

#[command]
pub async fn research_add_source(
    state: tauri::State<'_, ResearchState>,
    project_id: String,
    name: String,
    url: String,
    source_type: String,
) -> Result<ResearchSource, String> {
    let mut projects = state.projects.lock().map_err(|e| e.to_string())?;
    
    let project = projects.iter_mut()
        .find(|p| p.id == project_id)
        .ok_or_else(|| format!("Project not found: {}", project_id))?;

    let source_type_enum = match source_type.to_lowercase().as_str() {
        "website" => SourceType::Website,
        "api" => SourceType::API,
        "rss" => SourceType::RSS,
        "socialmedia" | "social" => SourceType::SocialMedia,
        "database" => SourceType::Database,
        "document" => SourceType::Document,
        _ => SourceType::Website,
    };

    let source = ResearchSource {
        id: uuid::Uuid::new_v4().to_string(),
        name,
        url,
        source_type: source_type_enum,
        last_scraped: None,
        scrape_frequency: "daily".to_string(),
        enabled: true,
        credentials: None,
    };

    project.sources.push(source.clone());
    project.updated_at = Utc::now().to_rfc3339();

    Ok(source)
}

#[command]
pub async fn research_remove_source(
    state: tauri::State<'_, ResearchState>,
    project_id: String,
    source_id: String,
) -> Result<bool, String> {
    let mut projects = state.projects.lock().map_err(|e| e.to_string())?;
    
    let project = projects.iter_mut()
        .find(|p| p.id == project_id)
        .ok_or_else(|| format!("Project not found: {}", project_id))?;

    let initial_len = project.sources.len();
    project.sources.retain(|s| s.id != source_id);
    project.updated_at = Utc::now().to_rfc3339();
    
    Ok(project.sources.len() < initial_len)
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPETITOR COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

#[command]
pub async fn research_add_competitor(
    state: tauri::State<'_, ResearchState>,
    project_id: String,
    name: String,
    website: String,
    industry: String,
    description: String,
) -> Result<Competitor, String> {
    let mut projects = state.projects.lock().map_err(|e| e.to_string())?;
    
    let project = projects.iter_mut()
        .find(|p| p.id == project_id)
        .ok_or_else(|| format!("Project not found: {}", project_id))?;

    let competitor = Competitor {
        id: uuid::Uuid::new_v4().to_string(),
        name,
        website,
        industry,
        description,
        strengths: Vec::new(),
        weaknesses: Vec::new(),
        products: Vec::new(),
        pricing: None,
        market_share: None,
        social_presence: HashMap::new(),
        recent_news: Vec::new(),
        last_updated: Utc::now().to_rfc3339(),
    };

    project.competitors.push(competitor.clone());
    project.updated_at = Utc::now().to_rfc3339();

    Ok(competitor)
}

#[command]
pub async fn research_get_competitors(
    state: tauri::State<'_, ResearchState>,
    project_id: String,
) -> Result<Vec<Competitor>, String> {
    let projects = state.projects.lock().map_err(|e| e.to_string())?;
    
    let project = projects.iter()
        .find(|p| p.id == project_id)
        .ok_or_else(|| format!("Project not found: {}", project_id))?;

    Ok(project.competitors.clone())
}

#[command]
pub async fn research_analyze_competitor(
    state: tauri::State<'_, ResearchState>,
    project_id: String,
    competitor_id: String,
) -> Result<Competitor, String> {
    let mut projects = state.projects.lock().map_err(|e| e.to_string())?;
    
    let project = projects.iter_mut()
        .find(|p| p.id == project_id)
        .ok_or_else(|| format!("Project not found: {}", project_id))?;

    let competitor = project.competitors.iter_mut()
        .find(|c| c.id == competitor_id)
        .ok_or_else(|| format!("Competitor not found: {}", competitor_id))?;

    // Simulate analysis
    competitor.strengths = vec![
        "Strong brand recognition".to_string(),
        "Wide product range".to_string(),
        "Established customer base".to_string(),
    ];
    competitor.weaknesses = vec![
        "Higher pricing".to_string(),
        "Slower innovation cycle".to_string(),
        "Limited international presence".to_string(),
    ];
    competitor.market_share = Some((rand::random::<f64>() * 30.0).min(30.0));
    competitor.recent_news = vec![
        NewsItem {
            title: format!("{} Announces New Product Line", competitor.name),
            url: "https://example.com/news/1".to_string(),
            source: "Industry News".to_string(),
            published_at: Utc::now().to_rfc3339(),
            summary: Some("Company expands offering to new market segment.".to_string()),
            sentiment: Sentiment::Positive,
        },
    ];
    competitor.last_updated = Utc::now().to_rfc3339();

    Ok(competitor.clone())
}

#[command]
pub async fn research_remove_competitor(
    state: tauri::State<'_, ResearchState>,
    project_id: String,
    competitor_id: String,
) -> Result<bool, String> {
    let mut projects = state.projects.lock().map_err(|e| e.to_string())?;
    
    let project = projects.iter_mut()
        .find(|p| p.id == project_id)
        .ok_or_else(|| format!("Project not found: {}", project_id))?;

    let initial_len = project.competitors.len();
    project.competitors.retain(|c| c.id != competitor_id);
    project.updated_at = Utc::now().to_rfc3339();
    
    Ok(project.competitors.len() < initial_len)
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPORT COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

#[command]
pub async fn research_generate_report(
    state: tauri::State<'_, ResearchState>,
    project_id: String,
    report_type: String,
    format: String,
) -> Result<Report, String> {
    let mut projects = state.projects.lock().map_err(|e| e.to_string())?;
    
    let project = projects.iter_mut()
        .find(|p| p.id == project_id)
        .ok_or_else(|| format!("Project not found: {}", project_id))?;

    let report_type_enum = match report_type.to_lowercase().as_str() {
        "competitor" | "competitor_analysis" => ReportType::CompetitorAnalysis,
        "market" | "market_overview" => ReportType::MarketOverview,
        "trend" | "trend_report" => ReportType::TrendReport,
        "executive" | "executive_summary" => ReportType::ExecutiveSummary,
        _ => ReportType::DetailedAnalysis,
    };

    let format_enum = match format.to_lowercase().as_str() {
        "pdf" => ReportFormat::PDF,
        "html" => ReportFormat::HTML,
        "markdown" | "md" => ReportFormat::Markdown,
        "json" => ReportFormat::JSON,
        _ => ReportFormat::PDF,
    };

    let report = Report {
        id: uuid::Uuid::new_v4().to_string(),
        name: format!("{} Report - {}", format!("{:?}", report_type_enum), project.name),
        report_type: report_type_enum,
        content: format!(
            "# Research Report: {}\n\n## Executive Summary\n\nThis report provides comprehensive analysis based on {} findings and {} insights.\n\n## Key Findings\n\n- Market shows positive growth trajectory\n- Competition analysis reveals opportunities\n- Recommended actions for strategic advantage",
            project.name,
            project.findings.len(),
            project.insights.len()
        ),
        format: format_enum,
        sections: vec![
            ReportSection {
                title: "Overview".to_string(),
                content: format!("Research project: {} with {} keywords tracked.", project.name, project.keywords.len()),
                charts: vec![
                    ChartData {
                        chart_type: "bar".to_string(),
                        title: "Key Metrics".to_string(),
                        data: vec![
                            DataPoint { label: "Findings".to_string(), value: project.findings.len() as f64 },
                            DataPoint { label: "Insights".to_string(), value: project.insights.len() as f64 },
                            DataPoint { label: "Competitors".to_string(), value: project.competitors.len() as f64 },
                        ],
                    },
                ],
                tables: Vec::new(),
            },
        ],
        generated_at: Utc::now().to_rfc3339(),
        file_url: Some(format!("/reports/{}.pdf", uuid::Uuid::new_v4())),
    };

    project.reports.push(report.clone());
    project.updated_at = Utc::now().to_rfc3339();

    Ok(report)
}

#[command]
pub async fn research_get_reports(
    state: tauri::State<'_, ResearchState>,
    project_id: String,
) -> Result<Vec<Report>, String> {
    let projects = state.projects.lock().map_err(|e| e.to_string())?;
    
    let project = projects.iter()
        .find(|p| p.id == project_id)
        .ok_or_else(|| format!("Project not found: {}", project_id))?;

    Ok(project.reports.clone())
}

// ═══════════════════════════════════════════════════════════════════════════════
// TREND COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

#[command]
pub async fn research_get_trends(
    keywords: Vec<String>,
    _period: String,
) -> Result<Vec<TrendData>, String> {
    let trends: Vec<TrendData> = keywords.into_iter()
        .map(|keyword| {
            let base_volume = (rand::random::<u64>() % 100000) + 10000;
            TrendData {
                keyword: keyword.clone(),
                volume: base_volume,
                change_percent: (rand::random::<f64>() * 50.0) - 25.0,
                trend_direction: if rand::random::<bool>() { "up".to_string() } else { "down".to_string() },
                related_terms: vec![
                    format!("{} trends", keyword),
                    format!("{} analysis", keyword),
                    format!("{} market", keyword),
                ],
                geographic_interest: {
                    let mut map = HashMap::new();
                    map.insert("United States".to_string(), 85.0);
                    map.insert("United Kingdom".to_string(), 65.0);
                    map.insert("Canada".to_string(), 55.0);
                    map.insert("Australia".to_string(), 45.0);
                    map
                },
                time_series: (0..12).map(|i| {
                    TimeSeriesPoint {
                        date: format!("2024-{:02}-01", i + 1),
                        value: (base_volume as f64 * (1.0 + (rand::random::<f64>() * 0.4) - 0.2)) as f64,
                    }
                }).collect(),
            }
        })
        .collect();

    Ok(trends)
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEARCH COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

#[command]
pub async fn research_search(
    state: tauri::State<'_, ResearchState>,
    query: String,
    _sources: Option<Vec<String>>,
    limit: Option<u32>,
) -> Result<Vec<SearchResult>, String> {
    let limit = limit.unwrap_or(20) as usize;
    
    // Simulate search results
    let results: Vec<SearchResult> = (0..limit.min(10)).map(|i| {
        SearchResult {
            id: uuid::Uuid::new_v4().to_string(),
            title: format!("{} - Result {}", query, i + 1),
            url: format!("https://example.com/result/{}", i + 1),
            snippet: format!("Relevant information about {} found in this comprehensive resource covering key aspects and latest developments.", query),
            source: match i % 4 {
                0 => "Web".to_string(),
                1 => "News".to_string(),
                2 => "Academic".to_string(),
                _ => "Industry".to_string(),
            },
            published_at: Some(Utc::now().to_rfc3339()),
            relevance_score: 1.0 - (i as f64 * 0.08),
            category: "Research".to_string(),
        }
    }).collect();

    // Store in history
    let mut history = state.search_history.lock().map_err(|e| e.to_string())?;
    history.extend(results.clone());

    Ok(results)
}

#[command]
pub async fn research_get_stats(
    state: tauri::State<'_, ResearchState>,
) -> Result<HashMap<String, u64>, String> {
    let projects = state.projects.lock().map_err(|e| e.to_string())?;
    let history = state.search_history.lock().map_err(|e| e.to_string())?;

    let total_findings: usize = projects.iter().map(|p| p.findings.len()).sum();
    let total_insights: usize = projects.iter().map(|p| p.insights.len()).sum();
    let total_competitors: usize = projects.iter().map(|p| p.competitors.len()).sum();
    let total_reports: usize = projects.iter().map(|p| p.reports.len()).sum();

    let mut stats = HashMap::new();
    stats.insert("total_projects".to_string(), projects.len() as u64);
    stats.insert("active_projects".to_string(), projects.iter().filter(|p| matches!(p.status, ResearchStatus::InProgress)).count() as u64);
    stats.insert("completed_projects".to_string(), projects.iter().filter(|p| matches!(p.status, ResearchStatus::Completed)).count() as u64);
    stats.insert("total_findings".to_string(), total_findings as u64);
    stats.insert("total_insights".to_string(), total_insights as u64);
    stats.insert("total_competitors".to_string(), total_competitors as u64);
    stats.insert("total_reports".to_string(), total_reports as u64);
    stats.insert("total_searches".to_string(), history.len() as u64);

    Ok(stats)
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK STATS & NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResearchQuickStats {
    pub total_projects: u64,
    pub active_projects: u64,
    pub total_findings: u64,
    pub total_insights: u64,
    pub competitors_tracked: u64,
    pub reports_generated: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResearchNotification {
    pub id: String,
    #[serde(rename = "type")]
    pub notification_type: String,
    pub title: String,
    pub message: String,
    pub timestamp: String,
    pub read: bool,
}

#[command]
pub async fn research_get_quick_stats(
    state: tauri::State<'_, ResearchState>,
) -> Result<ResearchQuickStats, String> {
    let projects = state.projects.lock().map_err(|e| e.to_string())?;
    
    let total_findings: usize = projects.iter().map(|p| p.findings.len()).sum();
    let total_insights: usize = projects.iter().map(|p| p.insights.len()).sum();
    let total_competitors: usize = projects.iter().map(|p| p.competitors.len()).sum();
    let total_reports: usize = projects.iter().map(|p| p.reports.len()).sum();
    
    Ok(ResearchQuickStats {
        total_projects: projects.len() as u64,
        active_projects: projects.iter().filter(|p| matches!(p.status, ResearchStatus::InProgress)).count() as u64,
        total_findings: total_findings as u64,
        total_insights: total_insights as u64,
        competitors_tracked: total_competitors as u64,
        reports_generated: total_reports as u64,
    })
}

#[command]
pub async fn research_get_notifications(
    state: tauri::State<'_, ResearchState>,
) -> Result<Vec<ResearchNotification>, String> {
    let projects = state.projects.lock().map_err(|e| e.to_string())?;
    
    let mut notifications = Vec::new();
    let now = Utc::now();
    
    // Projects that need attention
    for project in projects.iter() {
        if matches!(project.status, ResearchStatus::InProgress) {
            if let Ok(updated) = chrono::DateTime::parse_from_rfc3339(&project.updated_at) {
                let age = now.signed_duration_since(updated.with_timezone(&Utc));
                if age.num_days() > 7 {
                    notifications.push(ResearchNotification {
                        id: format!("stale-{}", project.id),
                        notification_type: "project".to_string(),
                        title: "Project Needs Update".to_string(),
                        message: format!("{} hasn't been updated in {} days", project.name, age.num_days()),
                        timestamp: project.updated_at.clone(),
                        read: false,
                    });
                }
            }
        }
    }
    
    // Recent findings
    for project in projects.iter() {
        let recent_findings: Vec<_> = project.findings.iter()
            .filter(|f| {
                if let Ok(created) = chrono::DateTime::parse_from_rfc3339(&f.discovered_at) {
                    let age = now.signed_duration_since(created.with_timezone(&Utc));
                    age.num_hours() < 24
                } else {
                    false
                }
            })
            .collect();
        
        if !recent_findings.is_empty() {
            notifications.push(ResearchNotification {
                id: format!("findings-{}-{}", project.id, now.timestamp()),
                notification_type: "finding".to_string(),
                title: "New Findings".to_string(),
                message: format!("{} new findings in {}", recent_findings.len(), project.name),
                timestamp: now.to_rfc3339(),
                read: false,
            });
        }
    }
    
    // Competitor updates - check for recent activity
    for project in projects.iter() {
        for competitor in &project.competitors {
            // Check if competitor was recently updated
            if let Ok(updated) = chrono::DateTime::parse_from_rfc3339(&competitor.last_updated) {
                let age = now.signed_duration_since(updated.with_timezone(&Utc));
                if age.num_hours() < 48 {
                    notifications.push(ResearchNotification {
                        id: format!("competitor-update-{}", competitor.id),
                        notification_type: "competitor".to_string(),
                        title: "Competitor Update".to_string(),
                        message: format!("Recent activity detected for {}", competitor.name),
                        timestamp: competitor.last_updated.clone(),
                        read: false,
                    });
                }
            }
        }
    }
    
    notifications.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    notifications.truncate(10);
    
    Ok(notifications)
}
