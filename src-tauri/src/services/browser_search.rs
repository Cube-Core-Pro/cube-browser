// CUBE Nexum - Search Engine Service
// Custom search engines, smart address bar, quick shortcuts - Superior to all browsers

use std::collections::HashMap;
use std::sync::Mutex;
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

// ==================== Types ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchEngine {
    pub id: String,
    pub name: String,
    pub keyword: String,                    // Quick access keyword (e.g., @g, @yt)
    pub search_url: String,                 // URL with %s placeholder
    pub suggest_url: Option<String>,        // Autocomplete API URL
    pub favicon_url: Option<String>,
    pub is_default: bool,
    pub is_builtin: bool,
    pub is_enabled: bool,
    pub category: SearchCategory,
    pub use_count: u64,
    pub last_used: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SearchCategory {
    General,
    Video,
    Images,
    Maps,
    Shopping,
    News,
    Code,
    AI,
    Social,
    Reference,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchSettings {
    pub default_engine_id: String,
    pub show_suggestions: bool,
    pub show_search_history: bool,
    pub show_bookmarks_in_suggestions: bool,
    pub show_history_in_suggestions: bool,
    pub show_tabs_in_suggestions: bool,
    pub max_suggestions: u32,
    pub suggestion_delay_ms: u32,
    pub enable_quick_keywords: bool,
    pub enable_bang_commands: bool,         // !g, !yt style
    pub enable_calculator: bool,
    pub enable_unit_conversion: bool,
    pub enable_currency_conversion: bool,
    pub safe_search: SafeSearchLevel,
    pub region: Option<String>,
    pub language: Option<String>,
}

impl Default for SearchSettings {
    fn default() -> Self {
        Self {
            default_engine_id: "google".to_string(),
            show_suggestions: true,
            show_search_history: true,
            show_bookmarks_in_suggestions: true,
            show_history_in_suggestions: true,
            show_tabs_in_suggestions: true,
            max_suggestions: 8,
            suggestion_delay_ms: 150,
            enable_quick_keywords: true,
            enable_bang_commands: true,
            enable_calculator: true,
            enable_unit_conversion: true,
            enable_currency_conversion: true,
            safe_search: SafeSearchLevel::Moderate,
            region: None,
            language: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SafeSearchLevel {
    Off,
    Moderate,
    Strict,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchSuggestion {
    pub text: String,
    pub suggestion_type: SuggestionType,
    pub url: Option<String>,
    pub description: Option<String>,
    pub favicon: Option<String>,
    pub relevance_score: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SuggestionType {
    SearchSuggestion,
    Bookmark,
    History,
    OpenTab,
    QuickAction,
    Calculator,
    UnitConversion,
    CurrencyConversion,
    SearchEngine,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchHistoryItem {
    pub id: String,
    pub query: String,
    pub engine_id: String,
    pub searched_at: DateTime<Utc>,
    pub result_clicked: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuickAction {
    pub id: String,
    pub name: String,
    pub keyword: String,
    pub action_type: QuickActionType,
    pub icon: Option<String>,
    pub is_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum QuickActionType {
    OpenUrl(String),
    RunCommand(String),
    CopyToClipboard,
    OpenSettings,
    OpenBookmarks,
    OpenHistory,
    OpenDownloads,
    OpenExtensions,
    ClearData,
    NewTab,
    NewWindow,
    NewIncognito,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OmniboxResult {
    pub suggestions: Vec<SearchSuggestion>,
    pub quick_action: Option<QuickAction>,
    pub calculator_result: Option<String>,
    pub conversion_result: Option<ConversionResult>,
    pub matched_engine: Option<SearchEngine>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversionResult {
    pub input: String,
    pub output: String,
    pub conversion_type: ConversionType,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ConversionType {
    Unit,
    Currency,
    Temperature,
    Time,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchStats {
    pub total_searches: u64,
    pub searches_today: u64,
    pub searches_this_week: u64,
    pub searches_this_month: u64,
    pub searches_by_engine: HashMap<String, u64>,
    pub top_queries: Vec<(String, u64)>,
    pub calculator_uses: u64,
    pub conversion_uses: u64,
}

// ==================== Service ====================

pub struct SearchEngineService {
    settings: Mutex<SearchSettings>,
    engines: Mutex<HashMap<String, SearchEngine>>,
    search_history: Mutex<Vec<SearchHistoryItem>>,
    quick_actions: Mutex<HashMap<String, QuickAction>>,
    stats: Mutex<SearchStats>,
}

impl SearchEngineService {
    pub fn new() -> Self {
        let mut engines = HashMap::new();
        let mut quick_actions = HashMap::new();
        
        // Add default search engines
        let default_engines = Self::create_default_engines();
        for engine in default_engines {
            engines.insert(engine.id.clone(), engine);
        }
        
        // Add default quick actions
        let default_actions = Self::create_default_quick_actions();
        for action in default_actions {
            quick_actions.insert(action.id.clone(), action);
        }
        
        Self {
            settings: Mutex::new(SearchSettings::default()),
            engines: Mutex::new(engines),
            search_history: Mutex::new(Vec::new()),
            quick_actions: Mutex::new(quick_actions),
            stats: Mutex::new(SearchStats {
                total_searches: 0,
                searches_today: 0,
                searches_this_week: 0,
                searches_this_month: 0,
                searches_by_engine: HashMap::new(),
                top_queries: Vec::new(),
                calculator_uses: 0,
                conversion_uses: 0,
            }),
        }
    }

    fn generate_id() -> String {
        uuid::Uuid::new_v4().to_string()
    }

    fn create_default_engines() -> Vec<SearchEngine> {
        let now = Utc::now();
        vec![
            SearchEngine {
                id: "google".to_string(),
                name: "Google".to_string(),
                keyword: "@g".to_string(),
                search_url: "https://www.google.com/search?q=%s".to_string(),
                suggest_url: Some("https://suggestqueries.google.com/complete/search?client=chrome&q=%s".to_string()),
                favicon_url: Some("https://www.google.com/favicon.ico".to_string()),
                is_default: true,
                is_builtin: true,
                is_enabled: true,
                category: SearchCategory::General,
                use_count: 0,
                last_used: None,
                created_at: now,
            },
            SearchEngine {
                id: "duckduckgo".to_string(),
                name: "DuckDuckGo".to_string(),
                keyword: "@ddg".to_string(),
                search_url: "https://duckduckgo.com/?q=%s".to_string(),
                suggest_url: Some("https://duckduckgo.com/ac/?q=%s".to_string()),
                favicon_url: Some("https://duckduckgo.com/favicon.ico".to_string()),
                is_default: false,
                is_builtin: true,
                is_enabled: true,
                category: SearchCategory::General,
                use_count: 0,
                last_used: None,
                created_at: now,
            },
            SearchEngine {
                id: "bing".to_string(),
                name: "Bing".to_string(),
                keyword: "@b".to_string(),
                search_url: "https://www.bing.com/search?q=%s".to_string(),
                suggest_url: Some("https://api.bing.com/osjson.aspx?query=%s".to_string()),
                favicon_url: Some("https://www.bing.com/favicon.ico".to_string()),
                is_default: false,
                is_builtin: true,
                is_enabled: true,
                category: SearchCategory::General,
                use_count: 0,
                last_used: None,
                created_at: now,
            },
            SearchEngine {
                id: "youtube".to_string(),
                name: "YouTube".to_string(),
                keyword: "@yt".to_string(),
                search_url: "https://www.youtube.com/results?search_query=%s".to_string(),
                suggest_url: Some("https://suggestqueries.google.com/complete/search?client=youtube&q=%s".to_string()),
                favicon_url: Some("https://www.youtube.com/favicon.ico".to_string()),
                is_default: false,
                is_builtin: true,
                is_enabled: true,
                category: SearchCategory::Video,
                use_count: 0,
                last_used: None,
                created_at: now,
            },
            SearchEngine {
                id: "github".to_string(),
                name: "GitHub".to_string(),
                keyword: "@gh".to_string(),
                search_url: "https://github.com/search?q=%s".to_string(),
                suggest_url: None,
                favicon_url: Some("https://github.com/favicon.ico".to_string()),
                is_default: false,
                is_builtin: true,
                is_enabled: true,
                category: SearchCategory::Code,
                use_count: 0,
                last_used: None,
                created_at: now,
            },
            SearchEngine {
                id: "stackoverflow".to_string(),
                name: "Stack Overflow".to_string(),
                keyword: "@so".to_string(),
                search_url: "https://stackoverflow.com/search?q=%s".to_string(),
                suggest_url: None,
                favicon_url: Some("https://stackoverflow.com/favicon.ico".to_string()),
                is_default: false,
                is_builtin: true,
                is_enabled: true,
                category: SearchCategory::Code,
                use_count: 0,
                last_used: None,
                created_at: now,
            },
            SearchEngine {
                id: "wikipedia".to_string(),
                name: "Wikipedia".to_string(),
                keyword: "@w".to_string(),
                search_url: "https://en.wikipedia.org/wiki/Special:Search?search=%s".to_string(),
                suggest_url: Some("https://en.wikipedia.org/w/api.php?action=opensearch&search=%s".to_string()),
                favicon_url: Some("https://en.wikipedia.org/favicon.ico".to_string()),
                is_default: false,
                is_builtin: true,
                is_enabled: true,
                category: SearchCategory::Reference,
                use_count: 0,
                last_used: None,
                created_at: now,
            },
            SearchEngine {
                id: "amazon".to_string(),
                name: "Amazon".to_string(),
                keyword: "@a".to_string(),
                search_url: "https://www.amazon.com/s?k=%s".to_string(),
                suggest_url: None,
                favicon_url: Some("https://www.amazon.com/favicon.ico".to_string()),
                is_default: false,
                is_builtin: true,
                is_enabled: true,
                category: SearchCategory::Shopping,
                use_count: 0,
                last_used: None,
                created_at: now,
            },
            SearchEngine {
                id: "google_maps".to_string(),
                name: "Google Maps".to_string(),
                keyword: "@maps".to_string(),
                search_url: "https://www.google.com/maps/search/%s".to_string(),
                suggest_url: None,
                favicon_url: Some("https://www.google.com/maps/favicon.ico".to_string()),
                is_default: false,
                is_builtin: true,
                is_enabled: true,
                category: SearchCategory::Maps,
                use_count: 0,
                last_used: None,
                created_at: now,
            },
            SearchEngine {
                id: "google_images".to_string(),
                name: "Google Images".to_string(),
                keyword: "@img".to_string(),
                search_url: "https://www.google.com/search?tbm=isch&q=%s".to_string(),
                suggest_url: None,
                favicon_url: Some("https://www.google.com/favicon.ico".to_string()),
                is_default: false,
                is_builtin: true,
                is_enabled: true,
                category: SearchCategory::Images,
                use_count: 0,
                last_used: None,
                created_at: now,
            },
            SearchEngine {
                id: "twitter".to_string(),
                name: "X (Twitter)".to_string(),
                keyword: "@x".to_string(),
                search_url: "https://twitter.com/search?q=%s".to_string(),
                suggest_url: None,
                favicon_url: Some("https://twitter.com/favicon.ico".to_string()),
                is_default: false,
                is_builtin: true,
                is_enabled: true,
                category: SearchCategory::Social,
                use_count: 0,
                last_used: None,
                created_at: now,
            },
            SearchEngine {
                id: "chatgpt".to_string(),
                name: "ChatGPT".to_string(),
                keyword: "@ai".to_string(),
                search_url: "https://chat.openai.com/?q=%s".to_string(),
                suggest_url: None,
                favicon_url: Some("https://chat.openai.com/favicon.ico".to_string()),
                is_default: false,
                is_builtin: true,
                is_enabled: true,
                category: SearchCategory::AI,
                use_count: 0,
                last_used: None,
                created_at: now,
            },
            SearchEngine {
                id: "perplexity".to_string(),
                name: "Perplexity".to_string(),
                keyword: "@px".to_string(),
                search_url: "https://www.perplexity.ai/search?q=%s".to_string(),
                suggest_url: None,
                favicon_url: Some("https://www.perplexity.ai/favicon.ico".to_string()),
                is_default: false,
                is_builtin: true,
                is_enabled: true,
                category: SearchCategory::AI,
                use_count: 0,
                last_used: None,
                created_at: now,
            },
            SearchEngine {
                id: "reddit".to_string(),
                name: "Reddit".to_string(),
                keyword: "@r".to_string(),
                search_url: "https://www.reddit.com/search/?q=%s".to_string(),
                suggest_url: None,
                favicon_url: Some("https://www.reddit.com/favicon.ico".to_string()),
                is_default: false,
                is_builtin: true,
                is_enabled: true,
                category: SearchCategory::Social,
                use_count: 0,
                last_used: None,
                created_at: now,
            },
            SearchEngine {
                id: "npm".to_string(),
                name: "npm".to_string(),
                keyword: "@npm".to_string(),
                search_url: "https://www.npmjs.com/search?q=%s".to_string(),
                suggest_url: None,
                favicon_url: Some("https://www.npmjs.com/favicon.ico".to_string()),
                is_default: false,
                is_builtin: true,
                is_enabled: true,
                category: SearchCategory::Code,
                use_count: 0,
                last_used: None,
                created_at: now,
            },
        ]
    }

    fn create_default_quick_actions() -> Vec<QuickAction> {
        vec![
            QuickAction {
                id: "new_tab".to_string(),
                name: "New Tab".to_string(),
                keyword: "/new".to_string(),
                action_type: QuickActionType::NewTab,
                icon: Some("➕".to_string()),
                is_enabled: true,
            },
            QuickAction {
                id: "new_window".to_string(),
                name: "New Window".to_string(),
                keyword: "/window".to_string(),
                action_type: QuickActionType::NewWindow,
                icon: Some("🪟".to_string()),
                is_enabled: true,
            },
            QuickAction {
                id: "incognito".to_string(),
                name: "New Incognito Window".to_string(),
                keyword: "/incognito".to_string(),
                action_type: QuickActionType::NewIncognito,
                icon: Some("🕵️".to_string()),
                is_enabled: true,
            },
            QuickAction {
                id: "bookmarks".to_string(),
                name: "Bookmarks".to_string(),
                keyword: "/bookmarks".to_string(),
                action_type: QuickActionType::OpenBookmarks,
                icon: Some("⭐".to_string()),
                is_enabled: true,
            },
            QuickAction {
                id: "history".to_string(),
                name: "History".to_string(),
                keyword: "/history".to_string(),
                action_type: QuickActionType::OpenHistory,
                icon: Some("📜".to_string()),
                is_enabled: true,
            },
            QuickAction {
                id: "downloads".to_string(),
                name: "Downloads".to_string(),
                keyword: "/downloads".to_string(),
                action_type: QuickActionType::OpenDownloads,
                icon: Some("📥".to_string()),
                is_enabled: true,
            },
            QuickAction {
                id: "extensions".to_string(),
                name: "Extensions".to_string(),
                keyword: "/extensions".to_string(),
                action_type: QuickActionType::OpenExtensions,
                icon: Some("🧩".to_string()),
                is_enabled: true,
            },
            QuickAction {
                id: "settings".to_string(),
                name: "Settings".to_string(),
                keyword: "/settings".to_string(),
                action_type: QuickActionType::OpenSettings,
                icon: Some("⚙️".to_string()),
                is_enabled: true,
            },
            QuickAction {
                id: "clear_data".to_string(),
                name: "Clear Browsing Data".to_string(),
                keyword: "/clear".to_string(),
                action_type: QuickActionType::ClearData,
                icon: Some("🧹".to_string()),
                is_enabled: true,
            },
        ]
    }

    // ==================== Settings ====================

    pub fn get_settings(&self) -> SearchSettings {
        self.settings.lock().unwrap().clone()
    }

    pub fn update_settings(&self, settings: SearchSettings) -> Result<(), String> {
        *self.settings.lock().unwrap() = settings;
        Ok(())
    }

    // ==================== Search Engines ====================

    pub fn add_engine(&self, engine: SearchEngine) -> Result<String, String> {
        let id = engine.id.clone();
        
        // Validate keyword uniqueness
        let engines = self.engines.lock().unwrap();
        if engines.values().any(|e| e.keyword == engine.keyword && e.id != engine.id) {
            return Err("Keyword already in use".to_string());
        }
        drop(engines);
        
        self.engines.lock().unwrap().insert(id.clone(), engine);
        Ok(id)
    }

    pub fn update_engine(&self, id: &str, engine: SearchEngine) -> Result<(), String> {
        let mut engines = self.engines.lock().unwrap();
        if !engines.contains_key(id) {
            return Err("Engine not found".to_string());
        }
        
        // Check if built-in (can't modify certain fields)
        if let Some(existing) = engines.get(id) {
            if existing.is_builtin {
                let mut updated = engine;
                updated.is_builtin = true;
                updated.search_url = existing.search_url.clone();
                engines.insert(id.to_string(), updated);
                return Ok(());
            }
        }
        
        engines.insert(id.to_string(), engine);
        Ok(())
    }

    pub fn delete_engine(&self, id: &str) -> Result<(), String> {
        let engines = self.engines.lock().unwrap();
        if let Some(engine) = engines.get(id) {
            if engine.is_builtin {
                return Err("Cannot delete built-in engine".to_string());
            }
        }
        drop(engines);
        
        self.engines.lock().unwrap().remove(id)
            .map(|_| ())
            .ok_or_else(|| "Engine not found".to_string())
    }

    pub fn get_engine(&self, id: &str) -> Option<SearchEngine> {
        self.engines.lock().unwrap().get(id).cloned()
    }

    pub fn get_all_engines(&self) -> Vec<SearchEngine> {
        self.engines.lock().unwrap().values().cloned().collect()
    }

    pub fn get_enabled_engines(&self) -> Vec<SearchEngine> {
        self.engines.lock().unwrap()
            .values()
            .filter(|e| e.is_enabled)
            .cloned()
            .collect()
    }

    pub fn get_default_engine(&self) -> Option<SearchEngine> {
        let settings = self.get_settings();
        self.get_engine(&settings.default_engine_id)
    }

    pub fn set_default_engine(&self, id: &str) -> Result<(), String> {
        // Verify engine exists
        if !self.engines.lock().unwrap().contains_key(id) {
            return Err("Engine not found".to_string());
        }
        
        // Update old default
        let mut engines = self.engines.lock().unwrap();
        for engine in engines.values_mut() {
            engine.is_default = engine.id == id;
        }
        drop(engines);
        
        // Update settings
        self.settings.lock().unwrap().default_engine_id = id.to_string();
        Ok(())
    }

    pub fn toggle_engine(&self, id: &str, enabled: bool) -> Result<(), String> {
        let mut engines = self.engines.lock().unwrap();
        if let Some(engine) = engines.get_mut(id) {
            engine.is_enabled = enabled;
            Ok(())
        } else {
            Err("Engine not found".to_string())
        }
    }

    pub fn get_engine_by_keyword(&self, keyword: &str) -> Option<SearchEngine> {
        self.engines.lock().unwrap()
            .values()
            .find(|e| e.keyword == keyword || e.keyword == format!("@{}", keyword.trim_start_matches('@')))
            .cloned()
    }

    pub fn get_engines_by_category(&self, category: SearchCategory) -> Vec<SearchEngine> {
        self.engines.lock().unwrap()
            .values()
            .filter(|e| e.category == category)
            .cloned()
            .collect()
    }

    // ==================== Search ====================

    pub fn build_search_url(&self, query: &str, engine_id: Option<&str>) -> Result<String, String> {
        let engine = if let Some(id) = engine_id {
            self.get_engine(id).ok_or("Engine not found")?
        } else {
            self.get_default_engine().ok_or("No default engine")?
        };
        
        Ok(engine.search_url.replace("%s", &urlencoding::encode(query)))
    }

    pub fn record_search(&self, query: String, engine_id: String) {
        let id = Self::generate_id();
        let item = SearchHistoryItem {
            id,
            query: query.clone(),
            engine_id: engine_id.clone(),
            searched_at: Utc::now(),
            result_clicked: None,
        };
        
        self.search_history.lock().unwrap().push(item);
        
        // Update engine use count
        if let Some(engine) = self.engines.lock().unwrap().get_mut(&engine_id) {
            engine.use_count += 1;
            engine.last_used = Some(Utc::now());
        }
        
        // Update stats
        let mut stats = self.stats.lock().unwrap();
        stats.total_searches += 1;
        stats.searches_today += 1;
        stats.searches_this_week += 1;
        stats.searches_this_month += 1;
        *stats.searches_by_engine.entry(engine_id).or_insert(0) += 1;
    }

    // ==================== Omnibox ====================

    pub fn process_omnibox_input(&self, input: &str) -> OmniboxResult {
        let mut result = OmniboxResult {
            suggestions: Vec::new(),
            quick_action: None,
            calculator_result: None,
            conversion_result: None,
            matched_engine: None,
        };
        
        let settings = self.get_settings();
        let input_lower = input.to_lowercase().trim().to_string();
        
        // Check for quick action (starts with /)
        if input_lower.starts_with('/') {
            if let Some(action) = self.find_quick_action(&input_lower) {
                result.quick_action = Some(action);
            }
        }
        
        // Check for search engine keyword (@keyword query)
        if input_lower.starts_with('@') || input_lower.starts_with('!') {
            let parts: Vec<&str> = input.splitn(2, ' ').collect();
            if let Some(engine) = self.get_engine_by_keyword(parts[0]) {
                result.matched_engine = Some(engine);
            }
        }
        
        // Check for calculator
        if settings.enable_calculator {
            if let Some(calc_result) = self.try_calculate(input) {
                result.calculator_result = Some(calc_result);
            }
        }
        
        // Check for unit conversion
        if settings.enable_unit_conversion {
            if let Some(conversion) = self.try_convert(input) {
                result.conversion_result = Some(conversion);
            }
        }
        
        // Add search suggestions (placeholder - would call suggestion APIs)
        if settings.show_suggestions && input.len() >= 2 {
            result.suggestions.push(SearchSuggestion {
                text: format!("Search for \"{}\"", input),
                suggestion_type: SuggestionType::SearchSuggestion,
                url: None,
                description: None,
                favicon: None,
                relevance_score: 1.0,
            });
        }
        
        result
    }

    fn find_quick_action(&self, keyword: &str) -> Option<QuickAction> {
        self.quick_actions.lock().unwrap()
            .values()
            .find(|a| a.keyword == keyword && a.is_enabled)
            .cloned()
    }

    fn try_calculate(&self, input: &str) -> Option<String> {
        // Simple calculator - checks if input looks like math
        let math_chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '-', '*', '/', '(', ')', '.', ' '];
        if input.chars().all(|c| math_chars.contains(&c)) && input.chars().any(|c| ['+', '-', '*', '/'].contains(&c)) {
            // This would use a proper math parser in production
            // For now, return None - frontend can use JS eval or a proper library
            None
        } else {
            None
        }
    }

    fn try_convert(&self, input: &str) -> Option<ConversionResult> {
        // Simple pattern matching for common conversions
        let input_lower = input.to_lowercase();
        
        // Temperature: "100f to c", "37c to f"
        if input_lower.contains(" to ") && (input_lower.contains("f") || input_lower.contains("c")) {
            // Would implement actual conversion
            return None;
        }
        
        // Currency: "$100 to eur", "100 usd to gbp"
        if input_lower.contains(" to ") && (input_lower.contains("$") || input_lower.contains("usd") || input_lower.contains("eur")) {
            return None;
        }
        
        // Units: "10 km to miles", "100 lbs to kg"
        if input_lower.contains(" to ") {
            return None;
        }
        
        None
    }

    // ==================== Quick Actions ====================

    pub fn add_quick_action(&self, action: QuickAction) -> Result<String, String> {
        let id = action.id.clone();
        self.quick_actions.lock().unwrap().insert(id.clone(), action);
        Ok(id)
    }

    pub fn get_quick_actions(&self) -> Vec<QuickAction> {
        self.quick_actions.lock().unwrap().values().cloned().collect()
    }

    pub fn delete_quick_action(&self, id: &str) -> Result<(), String> {
        self.quick_actions.lock().unwrap().remove(id)
            .map(|_| ())
            .ok_or_else(|| "Action not found".to_string())
    }

    // ==================== History ====================

    pub fn get_search_history(&self, limit: Option<usize>) -> Vec<SearchHistoryItem> {
        let history = self.search_history.lock().unwrap();
        let mut sorted: Vec<_> = history.iter().cloned().collect();
        sorted.sort_by(|a, b| b.searched_at.cmp(&a.searched_at));
        
        if let Some(l) = limit {
            sorted.into_iter().take(l).collect()
        } else {
            sorted
        }
    }

    pub fn clear_search_history(&self) {
        self.search_history.lock().unwrap().clear();
    }

    pub fn delete_search_history_item(&self, id: &str) -> Result<(), String> {
        let mut history = self.search_history.lock().unwrap();
        let initial_len = history.len();
        history.retain(|h| h.id != id);
        
        if history.len() < initial_len {
            Ok(())
        } else {
            Err("Item not found".to_string())
        }
    }

    // ==================== Statistics ====================

    pub fn get_stats(&self) -> SearchStats {
        self.stats.lock().unwrap().clone()
    }

    pub fn reset_stats(&self) {
        let mut stats = self.stats.lock().unwrap();
        *stats = SearchStats {
            total_searches: 0,
            searches_today: 0,
            searches_this_week: 0,
            searches_this_month: 0,
            searches_by_engine: HashMap::new(),
            top_queries: Vec::new(),
            calculator_uses: 0,
            conversion_uses: 0,
        };
    }

    // ==================== Import/Export ====================

    pub fn export_engines(&self) -> Vec<SearchEngine> {
        self.get_all_engines()
    }

    pub fn import_engines(&self, engines: Vec<SearchEngine>) -> Result<u32, String> {
        let mut count = 0;
        for engine in engines {
            if !engine.is_builtin {
                self.engines.lock().unwrap().insert(engine.id.clone(), engine);
                count += 1;
            }
        }
        Ok(count)
    }
}
