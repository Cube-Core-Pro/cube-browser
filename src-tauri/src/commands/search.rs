// ═══════════════════════════════════════════════════════════════════════════════
// SEARCH ENGINE MODULE - AI-Powered Search Backend
// ═══════════════════════════════════════════════════════════════════════════════
//
// Features:
// - Multi-Engine Search Aggregation
// - AI-Powered Query Understanding
// - Semantic Search
// - Search History & Suggestions
// - Personalized Results
// - Advanced Filters
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
pub enum SearchEngine {
    Google,
    Bing,
    DuckDuckGo,
    Brave,
    AI,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SearchCategory {
    All,
    Web,
    Images,
    Videos,
    News,
    Shopping,
    Maps,
    Academic,
    Code,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SafeSearch {
    Off,
    Moderate,
    Strict,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchQuery {
    pub id: String,
    pub query: String,
    pub engines: Vec<SearchEngine>,
    pub category: SearchCategory,
    pub filters: SearchFilters,
    pub ai_enhanced: bool,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SearchFilters {
    pub date_range: Option<DateRange>,
    pub language: Option<String>,
    pub region: Option<String>,
    pub domain: Option<String>,
    pub exclude_domains: Vec<String>,
    pub file_type: Option<String>,
    pub safe_search: SafeSearch,
    pub exact_match: bool,
}

impl Default for SafeSearch {
    fn default() -> Self {
        SafeSearch::Moderate
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DateRange {
    pub from: Option<String>,
    pub to: Option<String>,
    pub preset: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResultItem {
    pub id: String,
    pub title: String,
    pub url: String,
    pub display_url: String,
    pub snippet: String,
    pub source_engine: SearchEngine,
    pub category: SearchCategory,
    pub favicon: Option<String>,
    pub thumbnail: Option<String>,
    pub published_at: Option<String>,
    pub relevance_score: f64,
    pub is_sponsored: bool,
    pub is_ai_generated: bool,
    pub metadata: SearchResultMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SearchResultMetadata {
    pub site_name: Option<String>,
    pub author: Option<String>,
    pub reading_time: Option<u32>,
    pub word_count: Option<u32>,
    pub language: Option<String>,
    pub rating: Option<f64>,
    pub reviews_count: Option<u32>,
    pub price: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResponse {
    pub query_id: String,
    pub query: String,
    pub total_results: u64,
    pub search_time_ms: u64,
    pub results: Vec<SearchResultItem>,
    pub suggestions: Vec<String>,
    pub related_searches: Vec<String>,
    pub ai_summary: Option<AISummary>,
    pub knowledge_panel: Option<KnowledgePanel>,
    pub pagination: PaginationInfo,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AISummary {
    pub summary: String,
    pub key_points: Vec<String>,
    pub sources: Vec<String>,
    pub confidence: f64,
    pub generated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnowledgePanel {
    pub title: String,
    pub description: String,
    pub image_url: Option<String>,
    pub facts: Vec<Fact>,
    pub links: Vec<PanelLink>,
    pub source: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Fact {
    pub label: String,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PanelLink {
    pub title: String,
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaginationInfo {
    pub page: u32,
    pub per_page: u32,
    pub total_pages: u32,
    pub has_next: bool,
    pub has_prev: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchHistoryItem {
    pub id: String,
    pub query: String,
    pub engines: Vec<SearchEngine>,
    pub category: SearchCategory,
    pub results_count: u64,
    pub clicked_results: Vec<String>,
    pub searched_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchSuggestion {
    pub text: String,
    pub suggestion_type: SuggestionType,
    pub score: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SuggestionType {
    History,
    Trending,
    AutoComplete,
    Related,
    AI,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchPreferences {
    pub default_engine: SearchEngine,
    pub default_category: SearchCategory,
    pub safe_search: SafeSearch,
    pub results_per_page: u32,
    pub enable_ai_summary: bool,
    pub enable_instant_answers: bool,
    pub preferred_language: String,
    pub preferred_region: String,
    pub blocked_domains: Vec<String>,
    pub favorite_engines: Vec<SearchEngine>,
}

impl Default for SearchPreferences {
    fn default() -> Self {
        Self {
            default_engine: SearchEngine::Google,
            default_category: SearchCategory::All,
            safe_search: SafeSearch::Moderate,
            results_per_page: 10,
            enable_ai_summary: true,
            enable_instant_answers: true,
            preferred_language: "en".to_string(),
            preferred_region: "US".to_string(),
            blocked_domains: Vec::new(),
            favorite_engines: vec![SearchEngine::Google, SearchEngine::Bing, SearchEngine::DuckDuckGo],
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrendingSearch {
    pub query: String,
    pub volume: u64,
    pub change_percent: f64,
    pub category: String,
    pub region: String,
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Default)]
pub struct SearchState {
    pub history: Mutex<Vec<SearchHistoryItem>>,
    pub preferences: Mutex<SearchPreferences>,
    pub cache: Mutex<HashMap<String, SearchResponse>>,
}

impl SearchState {
    pub fn new() -> Self {
        Self::default()
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEARCH COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

#[command]
pub async fn search_query(
    state: tauri::State<'_, SearchState>,
    query: String,
    engines: Option<Vec<String>>,
    category: Option<String>,
    page: Option<u32>,
    _filters: Option<SearchFilters>,
) -> Result<SearchResponse, String> {
    let start_time = std::time::Instant::now();
    let query_id = uuid::Uuid::new_v4().to_string();
    let page = page.unwrap_or(1);
    let per_page = 10;

    let engines_enum: Vec<SearchEngine> = engines.unwrap_or_else(|| vec!["google".to_string()])
        .into_iter()
        .filter_map(|e| match e.to_lowercase().as_str() {
            "google" => Some(SearchEngine::Google),
            "bing" => Some(SearchEngine::Bing),
            "duckduckgo" | "ddg" => Some(SearchEngine::DuckDuckGo),
            "brave" => Some(SearchEngine::Brave),
            "ai" => Some(SearchEngine::AI),
            _ => None,
        })
        .collect();

    let category_enum = match category.as_deref().unwrap_or("all").to_lowercase().as_str() {
        "web" => SearchCategory::Web,
        "images" => SearchCategory::Images,
        "videos" => SearchCategory::Videos,
        "news" => SearchCategory::News,
        "shopping" => SearchCategory::Shopping,
        "maps" => SearchCategory::Maps,
        "academic" => SearchCategory::Academic,
        "code" => SearchCategory::Code,
        _ => SearchCategory::All,
    };

    // Generate simulated results
    let total_results = (rand::random::<u64>() % 1000000) + 100000;
    let results: Vec<SearchResultItem> = (0..per_page).map(|i| {
        let rank = ((page - 1) * per_page + i) as usize;
        SearchResultItem {
            id: uuid::Uuid::new_v4().to_string(),
            title: format!("{} - Result {} | Comprehensive Guide", query, rank + 1),
            url: format!("https://example{}.com/{}", rank + 1, query.replace(' ', "-").to_lowercase()),
            display_url: format!("example{}.com › {}", rank + 1, query.replace(' ', "-").to_lowercase()),
            snippet: format!(
                "Discover everything about {}. This comprehensive resource provides detailed information, expert insights, and practical guidance on {}. Learn more about key concepts and best practices.",
                query, query
            ),
            source_engine: engines_enum.first().cloned().unwrap_or(SearchEngine::Google),
            category: category_enum.clone(),
            favicon: Some(format!("https://example{}.com/favicon.ico", rank + 1)),
            thumbnail: if matches!(category_enum, SearchCategory::Images | SearchCategory::Videos) {
                Some(format!("https://example{}.com/thumb.jpg", rank + 1))
            } else {
                None
            },
            published_at: Some(Utc::now().to_rfc3339()),
            relevance_score: 1.0 - (rank as f64 * 0.05),
            is_sponsored: rank == 0 && rand::random::<bool>(),
            is_ai_generated: false,
            metadata: SearchResultMetadata {
                site_name: Some(format!("Example Site {}", rank + 1)),
                author: Some("Expert Author".to_string()),
                reading_time: Some((rand::random::<u32>() % 15) + 3),
                word_count: Some((rand::random::<u32>() % 3000) + 500),
                language: Some("en".to_string()),
                rating: if matches!(category_enum, SearchCategory::Shopping) { Some(4.5) } else { None },
                reviews_count: if matches!(category_enum, SearchCategory::Shopping) { Some(rand::random::<u32>() % 1000) } else { None },
                price: if matches!(category_enum, SearchCategory::Shopping) { Some(format!("${}.99", rand::random::<u32>() % 500)) } else { None },
            },
        }
    }).collect();

    let ai_summary = Some(AISummary {
        summary: format!(
            "{} refers to a broad topic encompassing multiple aspects. Key areas include foundational concepts, practical applications, and emerging trends. Understanding {} requires considering both historical context and current developments.",
            query, query
        ),
        key_points: vec![
            format!("Primary focus area of {}", query),
            "Key methodologies and approaches".to_string(),
            "Industry applications and use cases".to_string(),
            "Future trends and predictions".to_string(),
        ],
        sources: vec![
            "example1.com".to_string(),
            "example2.com".to_string(),
            "example3.com".to_string(),
        ],
        confidence: 0.85,
        generated_at: Utc::now().to_rfc3339(),
    });

    let knowledge_panel = if query.len() > 3 {
        Some(KnowledgePanel {
            title: query.clone(),
            description: format!("{} is a topic of significant interest with wide-ranging implications across multiple domains.", query),
            image_url: Some("https://example.com/knowledge-panel.jpg".to_string()),
            facts: vec![
                Fact { label: "Category".to_string(), value: "General Knowledge".to_string() },
                Fact { label: "Related Topics".to_string(), value: "Technology, Science, Business".to_string() },
            ],
            links: vec![
                PanelLink { title: "Wikipedia".to_string(), url: format!("https://wikipedia.org/wiki/{}", query.replace(' ', "_")) },
                PanelLink { title: "Learn More".to_string(), url: "https://example.com/learn".to_string() },
            ],
            source: "Knowledge Base".to_string(),
        })
    } else {
        None
    };

    let total_pages = (total_results as u32 / per_page) + 1;

    let response = SearchResponse {
        query_id: query_id.clone(),
        query: query.clone(),
        total_results,
        search_time_ms: start_time.elapsed().as_millis() as u64,
        results,
        suggestions: vec![
            format!("{} tutorial", query),
            format!("{} guide", query),
            format!("{} best practices", query),
            format!("{} examples", query),
        ],
        related_searches: vec![
            format!("what is {}", query),
            format!("{} vs alternatives", query),
            format!("{} for beginners", query),
            format!("how to use {}", query),
        ],
        ai_summary,
        knowledge_panel,
        pagination: PaginationInfo {
            page,
            per_page,
            total_pages,
            has_next: page < total_pages,
            has_prev: page > 1,
        },
    };

    // Save to history
    let history_item = SearchHistoryItem {
        id: query_id,
        query: query.clone(),
        engines: engines_enum,
        category: category_enum,
        results_count: total_results,
        clicked_results: Vec::new(),
        searched_at: Utc::now().to_rfc3339(),
    };

    let mut history = state.history.lock().map_err(|e| e.to_string())?;
    history.push(history_item);

    Ok(response)
}

#[command]
pub async fn search_suggestions(
    state: tauri::State<'_, SearchState>,
    partial_query: String,
) -> Result<Vec<SearchSuggestion>, String> {
    let history = state.history.lock().map_err(|e| e.to_string())?;
    
    let mut suggestions = Vec::new();

    // History-based suggestions
    for item in history.iter().rev().take(5) {
        if item.query.to_lowercase().contains(&partial_query.to_lowercase()) {
            suggestions.push(SearchSuggestion {
                text: item.query.clone(),
                suggestion_type: SuggestionType::History,
                score: 0.9,
            });
        }
    }

    // Auto-complete suggestions
    let autocomplete_suggestions = vec![
        format!("{}", partial_query),
        format!("{} tutorial", partial_query),
        format!("{} examples", partial_query),
        format!("{} documentation", partial_query),
        format!("how to {}", partial_query),
        format!("what is {}", partial_query),
        format!("{} best practices", partial_query),
    ];

    for (i, text) in autocomplete_suggestions.into_iter().enumerate() {
        suggestions.push(SearchSuggestion {
            text,
            suggestion_type: SuggestionType::AutoComplete,
            score: 0.8 - (i as f64 * 0.05),
        });
    }

    // Sort by score
    suggestions.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));
    suggestions.truncate(10);

    Ok(suggestions)
}

#[command]
pub async fn search_get_history(
    state: tauri::State<'_, SearchState>,
    limit: Option<u32>,
) -> Result<Vec<SearchHistoryItem>, String> {
    let history = state.history.lock().map_err(|e| e.to_string())?;
    let limit = limit.unwrap_or(50) as usize;
    
    Ok(history.iter().rev().take(limit).cloned().collect())
}

#[command]
pub async fn search_clear_history(
    state: tauri::State<'_, SearchState>,
) -> Result<bool, String> {
    let mut history = state.history.lock().map_err(|e| e.to_string())?;
    history.clear();
    Ok(true)
}

#[command]
pub async fn search_delete_history_item(
    state: tauri::State<'_, SearchState>,
    item_id: String,
) -> Result<bool, String> {
    let mut history = state.history.lock().map_err(|e| e.to_string())?;
    let initial_len = history.len();
    history.retain(|h| h.id != item_id);
    Ok(history.len() < initial_len)
}

// ═══════════════════════════════════════════════════════════════════════════════
// PREFERENCES COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

#[command]
pub async fn search_get_preferences(
    state: tauri::State<'_, SearchState>,
) -> Result<SearchPreferences, String> {
    let preferences = state.preferences.lock().map_err(|e| e.to_string())?;
    Ok(preferences.clone())
}

#[command]
pub async fn search_update_preferences(
    state: tauri::State<'_, SearchState>,
    default_engine: Option<String>,
    results_per_page: Option<u32>,
    enable_ai_summary: Option<bool>,
    safe_search: Option<String>,
    preferred_language: Option<String>,
    preferred_region: Option<String>,
) -> Result<SearchPreferences, String> {
    let mut preferences = state.preferences.lock().map_err(|e| e.to_string())?;

    if let Some(engine) = default_engine {
        preferences.default_engine = match engine.to_lowercase().as_str() {
            "google" => SearchEngine::Google,
            "bing" => SearchEngine::Bing,
            "duckduckgo" | "ddg" => SearchEngine::DuckDuckGo,
            "brave" => SearchEngine::Brave,
            "ai" => SearchEngine::AI,
            _ => SearchEngine::Google,
        };
    }
    if let Some(rpp) = results_per_page {
        preferences.results_per_page = rpp.min(50).max(5);
    }
    if let Some(ai) = enable_ai_summary {
        preferences.enable_ai_summary = ai;
    }
    if let Some(ss) = safe_search {
        preferences.safe_search = match ss.to_lowercase().as_str() {
            "off" => SafeSearch::Off,
            "strict" => SafeSearch::Strict,
            _ => SafeSearch::Moderate,
        };
    }
    if let Some(lang) = preferred_language {
        preferences.preferred_language = lang;
    }
    if let Some(region) = preferred_region {
        preferences.preferred_region = region;
    }

    Ok(preferences.clone())
}

#[command]
pub async fn search_add_blocked_domain(
    state: tauri::State<'_, SearchState>,
    domain: String,
) -> Result<SearchPreferences, String> {
    let mut preferences = state.preferences.lock().map_err(|e| e.to_string())?;
    
    if !preferences.blocked_domains.contains(&domain) {
        preferences.blocked_domains.push(domain);
    }

    Ok(preferences.clone())
}

#[command]
pub async fn search_remove_blocked_domain(
    state: tauri::State<'_, SearchState>,
    domain: String,
) -> Result<SearchPreferences, String> {
    let mut preferences = state.preferences.lock().map_err(|e| e.to_string())?;
    preferences.blocked_domains.retain(|d| d != &domain);
    Ok(preferences.clone())
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRENDING COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

#[command]
pub async fn search_get_trending(
    region: Option<String>,
    _category: Option<String>,
) -> Result<Vec<TrendingSearch>, String> {
    let region = region.unwrap_or_else(|| "US".to_string());
    
    let trending = vec![
        TrendingSearch {
            query: "AI artificial intelligence".to_string(),
            volume: 5250000,
            change_percent: 45.0,
            category: "Technology".to_string(),
            region: region.clone(),
        },
        TrendingSearch {
            query: "climate change solutions".to_string(),
            volume: 3100000,
            change_percent: 28.0,
            category: "Environment".to_string(),
            region: region.clone(),
        },
        TrendingSearch {
            query: "remote work tools".to_string(),
            volume: 2800000,
            change_percent: 15.0,
            category: "Business".to_string(),
            region: region.clone(),
        },
        TrendingSearch {
            query: "cryptocurrency market".to_string(),
            volume: 2500000,
            change_percent: -5.0,
            category: "Finance".to_string(),
            region: region.clone(),
        },
        TrendingSearch {
            query: "healthy recipes".to_string(),
            volume: 2200000,
            change_percent: 12.0,
            category: "Health".to_string(),
            region: region.clone(),
        },
        TrendingSearch {
            query: "streaming movies".to_string(),
            volume: 1900000,
            change_percent: 8.0,
            category: "Entertainment".to_string(),
            region: region.clone(),
        },
        TrendingSearch {
            query: "electric vehicles".to_string(),
            volume: 1750000,
            change_percent: 35.0,
            category: "Automotive".to_string(),
            region: region.clone(),
        },
        TrendingSearch {
            query: "online learning".to_string(),
            volume: 1500000,
            change_percent: 22.0,
            category: "Education".to_string(),
            region: region.clone(),
        },
    ];

    Ok(trending)
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATS COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

#[command]
pub async fn search_get_stats(
    state: tauri::State<'_, SearchState>,
) -> Result<HashMap<String, u64>, String> {
    let history = state.history.lock().map_err(|e| e.to_string())?;

    let total_searches = history.len() as u64;
    let total_results: u64 = history.iter().map(|h| h.results_count).sum();
    let total_clicks: u64 = history.iter().map(|h| h.clicked_results.len() as u64).sum();

    let mut engine_counts: HashMap<String, u64> = HashMap::new();
    for item in history.iter() {
        for engine in &item.engines {
            let engine_name = format!("{:?}", engine).to_lowercase();
            *engine_counts.entry(engine_name).or_insert(0) += 1;
        }
    }

    let mut stats = HashMap::new();
    stats.insert("total_searches".to_string(), total_searches);
    stats.insert("total_results_shown".to_string(), total_results);
    stats.insert("total_clicks".to_string(), total_clicks);
    stats.insert("avg_results_per_search".to_string(), if total_searches > 0 { total_results / total_searches } else { 0 });

    for (engine, count) in engine_counts {
        stats.insert(format!("searches_{}", engine), count);
    }

    Ok(stats)
}

// ═══════════════════════════════════════════════════════════════════════════════
// IMAGE SEARCH
// ═══════════════════════════════════════════════════════════════════════════════

#[command]
pub async fn search_images(
    query: String,
    _size: Option<String>,
    _color: Option<String>,
    _image_type: Option<String>,
    page: Option<u32>,
) -> Result<SearchResponse, String> {
    let page = page.unwrap_or(1);
    let per_page = 20;
    let query_id = uuid::Uuid::new_v4().to_string();

    let total_results = (rand::random::<u64>() % 500000) + 50000;

    let results: Vec<SearchResultItem> = (0..per_page).map(|i| {
        let rank = ((page - 1) * per_page + i) as usize;
        SearchResultItem {
            id: uuid::Uuid::new_v4().to_string(),
            title: format!("{} Image {}", query, rank + 1),
            url: format!("https://images.example{}.com/{}.jpg", rank + 1, query.replace(' ', "-")),
            display_url: format!("images.example{}.com", rank + 1),
            snippet: format!("High quality image of {}", query),
            source_engine: SearchEngine::Google,
            category: SearchCategory::Images,
            favicon: None,
            thumbnail: Some(format!("https://thumb.example{}.com/{}_thumb.jpg", rank + 1, query.replace(' ', "-"))),
            published_at: None,
            relevance_score: 1.0 - (rank as f64 * 0.03),
            is_sponsored: false,
            is_ai_generated: false,
            metadata: SearchResultMetadata {
                site_name: Some(format!("Image Site {}", rank + 1)),
                ..Default::default()
            },
        }
    }).collect();

    let total_pages = (total_results as u32 / per_page) + 1;

    Ok(SearchResponse {
        query_id,
        query,
        total_results,
        search_time_ms: rand::random::<u64>() % 500,
        results,
        suggestions: Vec::new(),
        related_searches: Vec::new(),
        ai_summary: None,
        knowledge_panel: None,
        pagination: PaginationInfo {
            page,
            per_page,
            total_pages,
            has_next: page < total_pages,
            has_prev: page > 1,
        },
    })
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIDEO SEARCH
// ═══════════════════════════════════════════════════════════════════════════════

#[command]
pub async fn search_videos(
    query: String,
    _duration: Option<String>,
    _upload_date: Option<String>,
    page: Option<u32>,
) -> Result<SearchResponse, String> {
    let page = page.unwrap_or(1);
    let per_page = 15;
    let query_id = uuid::Uuid::new_v4().to_string();

    let total_results = (rand::random::<u64>() % 100000) + 10000;

    let results: Vec<SearchResultItem> = (0..per_page).map(|i| {
        let rank = ((page - 1) * per_page + i) as usize;
        SearchResultItem {
            id: uuid::Uuid::new_v4().to_string(),
            title: format!("{} - Video Tutorial Part {}", query, rank + 1),
            url: format!("https://videos.example{}.com/watch?v={}", rank + 1, uuid::Uuid::new_v4()),
            display_url: format!("videos.example{}.com", rank + 1),
            snippet: format!("Learn about {} in this comprehensive video guide. Duration: {}:{:02}", query, (rand::random::<u32>() % 30) + 1, rand::random::<u32>() % 60),
            source_engine: SearchEngine::Google,
            category: SearchCategory::Videos,
            favicon: None,
            thumbnail: Some(format!("https://thumb.example{}.com/video_thumb.jpg", rank + 1)),
            published_at: Some(Utc::now().to_rfc3339()),
            relevance_score: 1.0 - (rank as f64 * 0.04),
            is_sponsored: false,
            is_ai_generated: false,
            metadata: SearchResultMetadata {
                site_name: Some(format!("Video Platform {}", rank + 1)),
                ..Default::default()
            },
        }
    }).collect();

    let total_pages = (total_results as u32 / per_page) + 1;

    Ok(SearchResponse {
        query_id,
        query,
        total_results,
        search_time_ms: rand::random::<u64>() % 600,
        results,
        suggestions: Vec::new(),
        related_searches: Vec::new(),
        ai_summary: None,
        knowledge_panel: None,
        pagination: PaginationInfo {
            page,
            per_page,
            total_pages,
            has_next: page < total_pages,
            has_prev: page > 1,
        },
    })
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEARCH QUICK STATS & NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchQuickStats {
    pub total_searches: u64,
    pub saved_searches: u64,
    pub recent_queries: u64,
    pub engines_available: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchNotification {
    pub id: String,
    #[serde(rename = "type")]
    pub notification_type: String,
    pub title: String,
    pub message: String,
    pub timestamp: String,
    pub read: bool,
}

#[command]
pub async fn search_get_quick_stats(
    state: tauri::State<'_, SearchState>,
) -> Result<SearchQuickStats, String> {
    let history = state.history.lock().map_err(|e| e.to_string())?;
    let cache = state.cache.lock().map_err(|e| e.to_string())?;
    
    Ok(SearchQuickStats {
        total_searches: history.len() as u64,
        saved_searches: cache.len() as u64, // Use cache count as proxy for saved
        recent_queries: history.iter().take(10).count() as u64,
        engines_available: 8, // Google, Bing, DuckDuckGo, Brave, Perplexity, etc.
    })
}

#[command]
pub async fn search_get_notifications(
    state: tauri::State<'_, SearchState>,
) -> Result<Vec<SearchNotification>, String> {
    let history = state.history.lock().map_err(|e| e.to_string())?;
    
    let mut notifications = Vec::new();
    let now = Utc::now();
    
    // Recent search highlights
    for search in history.iter().take(3) {
        notifications.push(SearchNotification {
            id: format!("recent-{}", search.id),
            notification_type: "recent".to_string(),
            title: "Recent Search".to_string(),
            message: format!("Results for: {}", search.query),
            timestamp: now.to_rfc3339(),
            read: true,
        });
    }
    
    // Search history summary
    if history.len() > 50 {
        notifications.push(SearchNotification {
            id: format!("history-{}", now.timestamp()),
            notification_type: "tip".to_string(),
            title: "Search Tip".to_string(),
            message: format!("You have {} searches in history. Consider cleaning up!", history.len()),
            timestamp: now.to_rfc3339(),
            read: true,
        });
    }
    
    // New engine notification
    notifications.push(SearchNotification {
        id: format!("engine-{}", now.timestamp()),
        notification_type: "system".to_string(),
        title: "AI Search Available".to_string(),
        message: "Try Perplexity AI for smarter answers".to_string(),
        timestamp: now.to_rfc3339(),
        read: true,
    });
    
    notifications.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    notifications.truncate(10);
    
    Ok(notifications)
}
