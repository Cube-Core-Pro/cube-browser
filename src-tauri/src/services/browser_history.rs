// CUBE Nexum - History Service
// Superior to Chrome, Firefox, Safari, Brave history systems
// Advanced history management with sessions, analytics, and smart search

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

// ==================== Enums ====================

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum VisitType {
    Link,
    Typed,
    Bookmark,
    Redirect,
    Reload,
    FormSubmit,
    ContextMenu,
    Generated,
    StartPage,
    Restore,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PageType {
    Article,
    Video,
    Image,
    Document,
    Social,
    Shopping,
    News,
    Search,
    Email,
    Forum,
    Wiki,
    Blog,
    Entertainment,
    Education,
    Business,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SessionStatus {
    Active,
    Closed,
    Crashed,
    Restored,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TimeRange {
    LastHour,
    Today,
    Yesterday,
    LastWeek,
    LastMonth,
    LastThreeMonths,
    LastSixMonths,
    LastYear,
    AllTime,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SortOrder {
    DateDesc,
    DateAsc,
    VisitCountDesc,
    TitleAsc,
    DurationDesc,
}

// ==================== Structs ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistorySettings {
    pub enabled: bool,
    pub retention_days: u32,
    pub max_entries: u64,
    pub track_visit_duration: bool,
    pub track_scroll_position: bool,
    pub save_page_content: bool,
    pub sync_enabled: bool,
    pub excluded_domains: Vec<String>,
    pub excluded_patterns: Vec<String>,
    pub private_mode_history: bool,
    pub auto_delete_on_close: bool,
    pub group_by_domain: bool,
    pub show_previews: bool,
    pub analytics_enabled: bool,
}

impl Default for HistorySettings {
    fn default() -> Self {
        Self {
            enabled: true,
            retention_days: 90,
            max_entries: 100000,
            track_visit_duration: true,
            track_scroll_position: true,
            save_page_content: false,
            sync_enabled: true,
            excluded_domains: Vec::new(),
            excluded_patterns: vec!["*://localhost/*".to_string()],
            private_mode_history: false,
            auto_delete_on_close: false,
            group_by_domain: true,
            show_previews: true,
            analytics_enabled: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryEntry {
    pub id: String,
    pub url: String,
    pub title: String,
    pub favicon_url: Option<String>,
    pub domain: String,
    pub page_type: PageType,
    pub visit_count: u32,
    pub first_visit: u64,
    pub last_visit: u64,
    pub total_duration_ms: u64,
    pub scroll_position: Option<f64>,
    pub search_query: Option<String>,
    pub referrer: Option<String>,
    pub tags: Vec<String>,
    pub starred: bool,
    pub preview_image: Option<String>,
    pub preview_text: Option<String>,
    pub visits: Vec<Visit>,
}

impl HistoryEntry {
    pub fn new(url: String, title: String) -> Self {
        let domain = Self::extract_domain(&url);
        let page_type = Self::detect_page_type(&url, &title);
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        Self {
            id: format!("hist_{}", now),
            url,
            title,
            favicon_url: None,
            domain,
            page_type,
            visit_count: 1,
            first_visit: now,
            last_visit: now,
            total_duration_ms: 0,
            scroll_position: None,
            search_query: None,
            referrer: None,
            tags: Vec::new(),
            starred: false,
            preview_image: None,
            preview_text: None,
            visits: Vec::new(),
        }
    }

    fn extract_domain(url: &str) -> String {
        url.replace("https://", "")
            .replace("http://", "")
            .split('/')
            .next()
            .unwrap_or("unknown")
            .to_string()
    }

    fn detect_page_type(url: &str, title: &str) -> PageType {
        let url_lower = url.to_lowercase();
        let title_lower = title.to_lowercase();
        
        if url_lower.contains("youtube.com") || url_lower.contains("vimeo.com") || url_lower.contains("twitch.tv") {
            PageType::Video
        } else if url_lower.contains("twitter.com") || url_lower.contains("facebook.com") || url_lower.contains("instagram.com") || url_lower.contains("linkedin.com") {
            PageType::Social
        } else if url_lower.contains("amazon.com") || url_lower.contains("ebay.com") || url_lower.contains("shopify") || title_lower.contains("shop") || title_lower.contains("buy") {
            PageType::Shopping
        } else if url_lower.contains("news") || url_lower.contains("cnn.com") || url_lower.contains("bbc.") || title_lower.contains("news") {
            PageType::News
        } else if url_lower.contains("google.com/search") || url_lower.contains("bing.com/search") || url_lower.contains("duckduckgo.com") {
            PageType::Search
        } else if url_lower.contains("gmail.com") || url_lower.contains("outlook.com") || url_lower.contains("mail") {
            PageType::Email
        } else if url_lower.contains("wikipedia.org") || url_lower.contains("wiki") {
            PageType::Wiki
        } else if url_lower.contains("reddit.com") || url_lower.contains("stackoverflow.com") || url_lower.contains("forum") {
            PageType::Forum
        } else if url_lower.contains("medium.com") || url_lower.contains("blog") || title_lower.contains("blog") {
            PageType::Blog
        } else if url_lower.contains(".edu") || title_lower.contains("course") || title_lower.contains("learn") || title_lower.contains("tutorial") {
            PageType::Education
        } else if url_lower.contains(".pdf") || url_lower.contains("docs.google") {
            PageType::Document
        } else if url_lower.contains("netflix.com") || url_lower.contains("spotify.com") || url_lower.contains("hulu") {
            PageType::Entertainment
        } else {
            PageType::Unknown
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Visit {
    pub id: String,
    pub timestamp: u64,
    pub visit_type: VisitType,
    pub duration_ms: u64,
    pub from_url: Option<String>,
    pub session_id: Option<String>,
    pub tab_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrowsingSession {
    pub id: String,
    pub name: Option<String>,
    pub started_at: u64,
    pub ended_at: Option<u64>,
    pub status: SessionStatus,
    pub entry_ids: Vec<String>,
    pub tabs_count: u32,
    pub windows_count: u32,
    pub total_duration_ms: u64,
    pub device_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DomainStats {
    pub domain: String,
    pub visit_count: u64,
    pub total_duration_ms: u64,
    pub first_visit: u64,
    pub last_visit: u64,
    pub entry_count: u32,
    pub average_duration_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryStats {
    pub total_entries: u64,
    pub total_visits: u64,
    pub total_duration_ms: u64,
    pub unique_domains: u64,
    pub visits_today: u64,
    pub visits_this_week: u64,
    pub visits_this_month: u64,
    pub most_visited_domains: Vec<DomainStats>,
    pub page_type_distribution: HashMap<String, u64>,
    pub hourly_distribution: Vec<u64>,
    pub daily_average_visits: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryFilter {
    pub search_query: Option<String>,
    pub domains: Vec<String>,
    pub page_types: Vec<PageType>,
    pub time_range: TimeRange,
    pub date_from: Option<u64>,
    pub date_to: Option<u64>,
    pub min_visits: Option<u32>,
    pub min_duration_ms: Option<u64>,
    pub starred_only: bool,
    pub tags: Vec<String>,
    pub sort_by: SortOrder,
    pub limit: Option<u32>,
    pub offset: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub entry: HistoryEntry,
    pub score: f64,
    pub matched_fields: Vec<String>,
    pub snippet: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrequentSite {
    pub domain: String,
    pub title: String,
    pub url: String,
    pub favicon_url: Option<String>,
    pub visit_count: u64,
    pub last_visit: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecentlyClosed {
    pub id: String,
    pub url: String,
    pub title: String,
    pub favicon_url: Option<String>,
    pub closed_at: u64,
    pub tab_id: Option<String>,
    pub session_id: Option<String>,
}

// ==================== Service ====================

pub struct BrowserHistoryService {
    settings: Mutex<HistorySettings>,
    entries: Mutex<HashMap<String, HistoryEntry>>,
    sessions: Mutex<HashMap<String, BrowsingSession>>,
    recently_closed: Mutex<Vec<RecentlyClosed>>,
    current_session_id: Mutex<Option<String>>,
    domain_stats: Mutex<HashMap<String, DomainStats>>,
}

impl BrowserHistoryService {
    pub fn new() -> Self {
        Self {
            settings: Mutex::new(HistorySettings::default()),
            entries: Mutex::new(HashMap::new()),
            sessions: Mutex::new(HashMap::new()),
            recently_closed: Mutex::new(Vec::new()),
            current_session_id: Mutex::new(None),
            domain_stats: Mutex::new(HashMap::new()),
        }
    }

    fn generate_id(&self, prefix: &str) -> String {
        format!("{}_{}", prefix, SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis())
    }

    fn now(&self) -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs()
    }

    // ==================== Settings ====================

    pub fn get_settings(&self) -> HistorySettings {
        self.settings.lock().unwrap().clone()
    }

    pub fn update_settings(&self, settings: HistorySettings) -> Result<(), String> {
        *self.settings.lock().unwrap() = settings;
        Ok(())
    }

    pub fn add_excluded_domain(&self, domain: String) -> Result<(), String> {
        let mut settings = self.settings.lock().unwrap();
        if !settings.excluded_domains.contains(&domain) {
            settings.excluded_domains.push(domain);
        }
        Ok(())
    }

    pub fn remove_excluded_domain(&self, domain: &str) -> Result<(), String> {
        self.settings.lock().unwrap().excluded_domains.retain(|d| d != domain);
        Ok(())
    }

    pub fn set_retention_days(&self, days: u32) -> Result<(), String> {
        if days == 0 {
            return Err("Retention days must be greater than 0".to_string());
        }
        self.settings.lock().unwrap().retention_days = days;
        Ok(())
    }

    // ==================== Entry Operations ====================

    pub fn add_entry(&self, url: String, title: String, visit_type: VisitType) -> Result<HistoryEntry, String> {
        let settings = self.settings.lock().unwrap();
        
        if !settings.enabled {
            return Err("History is disabled".to_string());
        }

        let domain = HistoryEntry::extract_domain(&url);
        if settings.excluded_domains.contains(&domain) {
            return Err("Domain is excluded from history".to_string());
        }

        drop(settings);

        let mut entries = self.entries.lock().unwrap();
        
        // Check if URL already exists
        if let Some(existing) = entries.values_mut().find(|e| e.url == url) {
            existing.visit_count += 1;
            existing.last_visit = self.now();
            existing.title = title; // Update title in case it changed
            
            let visit = Visit {
                id: self.generate_id("visit"),
                timestamp: self.now(),
                visit_type,
                duration_ms: 0,
                from_url: None,
                session_id: self.current_session_id.lock().unwrap().clone(),
                tab_id: None,
            };
            existing.visits.push(visit);
            
            let entry = existing.clone();
            drop(entries);
            self.update_domain_stats(&entry.domain);
            return Ok(entry);
        }

        // Create new entry
        let mut entry = HistoryEntry::new(url, title);
        let visit = Visit {
            id: self.generate_id("visit"),
            timestamp: self.now(),
            visit_type,
            duration_ms: 0,
            from_url: None,
            session_id: self.current_session_id.lock().unwrap().clone(),
            tab_id: None,
        };
        entry.visits.push(visit);
        
        let entry_id = entry.id.clone();
        let domain = entry.domain.clone();
        entries.insert(entry_id, entry.clone());
        
        drop(entries);
        self.update_domain_stats(&domain);
        
        Ok(entry)
    }

    pub fn update_entry(&self, entry_id: &str, updates: HistoryEntry) -> Result<HistoryEntry, String> {
        let mut entries = self.entries.lock().unwrap();
        let entry = entries.get_mut(entry_id)
            .ok_or("Entry not found")?;
        
        entry.title = updates.title;
        entry.favicon_url = updates.favicon_url;
        entry.tags = updates.tags;
        entry.starred = updates.starred;
        entry.preview_image = updates.preview_image;
        entry.preview_text = updates.preview_text;
        
        Ok(entry.clone())
    }

    pub fn update_duration(&self, entry_id: &str, duration_ms: u64) -> Result<(), String> {
        let mut entries = self.entries.lock().unwrap();
        let entry = entries.get_mut(entry_id)
            .ok_or("Entry not found")?;
        
        entry.total_duration_ms += duration_ms;
        
        if let Some(last_visit) = entry.visits.last_mut() {
            last_visit.duration_ms = duration_ms;
        }
        
        Ok(())
    }

    pub fn update_scroll_position(&self, entry_id: &str, position: f64) -> Result<(), String> {
        let mut entries = self.entries.lock().unwrap();
        let entry = entries.get_mut(entry_id)
            .ok_or("Entry not found")?;
        entry.scroll_position = Some(position);
        Ok(())
    }

    pub fn delete_entry(&self, entry_id: &str) -> Result<(), String> {
        self.entries.lock().unwrap().remove(entry_id)
            .ok_or("Entry not found")?;
        Ok(())
    }

    pub fn delete_entries(&self, entry_ids: Vec<String>) -> Result<u32, String> {
        let mut entries = self.entries.lock().unwrap();
        let mut count = 0;
        for id in entry_ids {
            if entries.remove(&id).is_some() {
                count += 1;
            }
        }
        Ok(count)
    }

    fn update_domain_stats(&self, domain: &str) {
        let entries = self.entries.lock().unwrap();
        let domain_entries: Vec<&HistoryEntry> = entries.values()
            .filter(|e| &e.domain == domain)
            .collect();

        if domain_entries.is_empty() {
            self.domain_stats.lock().unwrap().remove(domain);
            return;
        }

        let visit_count: u64 = domain_entries.iter().map(|e| e.visit_count as u64).sum();
        let total_duration: u64 = domain_entries.iter().map(|e| e.total_duration_ms).sum();
        let first_visit = domain_entries.iter().map(|e| e.first_visit).min().unwrap_or(0);
        let last_visit = domain_entries.iter().map(|e| e.last_visit).max().unwrap_or(0);
        let entry_count = domain_entries.len() as u32;

        let stats = DomainStats {
            domain: domain.to_string(),
            visit_count,
            total_duration_ms: total_duration,
            first_visit,
            last_visit,
            entry_count,
            average_duration_ms: if visit_count > 0 { total_duration / visit_count } else { 0 },
        };

        self.domain_stats.lock().unwrap().insert(domain.to_string(), stats);
    }

    // ==================== Retrieval ====================

    pub fn get_entry(&self, entry_id: &str) -> Option<HistoryEntry> {
        self.entries.lock().unwrap().get(entry_id).cloned()
    }

    pub fn get_entry_by_url(&self, url: &str) -> Option<HistoryEntry> {
        self.entries.lock().unwrap()
            .values()
            .find(|e| e.url == url)
            .cloned()
    }

    pub fn get_all_entries(&self) -> Vec<HistoryEntry> {
        let mut entries: Vec<HistoryEntry> = self.entries.lock().unwrap()
            .values()
            .cloned()
            .collect();
        entries.sort_by(|a, b| b.last_visit.cmp(&a.last_visit));
        entries
    }

    pub fn get_recent_entries(&self, limit: u32) -> Vec<HistoryEntry> {
        let mut entries = self.get_all_entries();
        entries.truncate(limit as usize);
        entries
    }

    pub fn get_entries_by_domain(&self, domain: &str) -> Vec<HistoryEntry> {
        self.entries.lock().unwrap()
            .values()
            .filter(|e| e.domain == domain)
            .cloned()
            .collect()
    }

    pub fn get_entries_by_page_type(&self, page_type: PageType) -> Vec<HistoryEntry> {
        self.entries.lock().unwrap()
            .values()
            .filter(|e| e.page_type == page_type)
            .cloned()
            .collect()
    }

    pub fn get_starred_entries(&self) -> Vec<HistoryEntry> {
        self.entries.lock().unwrap()
            .values()
            .filter(|e| e.starred)
            .cloned()
            .collect()
    }

    pub fn filter_entries(&self, filter: HistoryFilter) -> Vec<HistoryEntry> {
        let now = self.now();
        let entries = self.entries.lock().unwrap();
        
        let (time_from, time_to) = match filter.time_range {
            TimeRange::LastHour => (now - 3600, now),
            TimeRange::Today => (now - 86400, now),
            TimeRange::Yesterday => (now - 172800, now - 86400),
            TimeRange::LastWeek => (now - 604800, now),
            TimeRange::LastMonth => (now - 2592000, now),
            TimeRange::LastThreeMonths => (now - 7776000, now),
            TimeRange::LastSixMonths => (now - 15552000, now),
            TimeRange::LastYear => (now - 31536000, now),
            TimeRange::AllTime => (0, now),
            TimeRange::Custom => (filter.date_from.unwrap_or(0), filter.date_to.unwrap_or(now)),
        };

        let mut results: Vec<HistoryEntry> = entries.values()
            .filter(|e| {
                // Time range filter
                if e.last_visit < time_from || e.last_visit > time_to {
                    return false;
                }
                
                // Search query
                if let Some(ref query) = filter.search_query {
                    let q = query.to_lowercase();
                    if !e.title.to_lowercase().contains(&q) && 
                       !e.url.to_lowercase().contains(&q) &&
                       !e.domain.to_lowercase().contains(&q) {
                        return false;
                    }
                }
                
                // Domain filter
                if !filter.domains.is_empty() && !filter.domains.contains(&e.domain) {
                    return false;
                }
                
                // Page type filter
                if !filter.page_types.is_empty() && !filter.page_types.contains(&e.page_type) {
                    return false;
                }
                
                // Min visits
                if let Some(min) = filter.min_visits {
                    if e.visit_count < min {
                        return false;
                    }
                }
                
                // Min duration
                if let Some(min) = filter.min_duration_ms {
                    if e.total_duration_ms < min {
                        return false;
                    }
                }
                
                // Starred only
                if filter.starred_only && !e.starred {
                    return false;
                }
                
                // Tags
                if !filter.tags.is_empty() && !filter.tags.iter().any(|t| e.tags.contains(t)) {
                    return false;
                }
                
                true
            })
            .cloned()
            .collect();

        // Sort
        match filter.sort_by {
            SortOrder::DateDesc => results.sort_by(|a, b| b.last_visit.cmp(&a.last_visit)),
            SortOrder::DateAsc => results.sort_by(|a, b| a.last_visit.cmp(&b.last_visit)),
            SortOrder::VisitCountDesc => results.sort_by(|a, b| b.visit_count.cmp(&a.visit_count)),
            SortOrder::TitleAsc => results.sort_by(|a, b| a.title.to_lowercase().cmp(&b.title.to_lowercase())),
            SortOrder::DurationDesc => results.sort_by(|a, b| b.total_duration_ms.cmp(&a.total_duration_ms)),
        }

        // Pagination
        if let Some(offset) = filter.offset {
            results = results.into_iter().skip(offset as usize).collect();
        }
        if let Some(limit) = filter.limit {
            results.truncate(limit as usize);
        }

        results
    }

    // ==================== Search ====================

    pub fn search(&self, query: &str) -> Vec<SearchResult> {
        let q = query.to_lowercase();
        let entries = self.entries.lock().unwrap();
        
        let mut results: Vec<SearchResult> = entries.values()
            .filter_map(|e| {
                let mut score = 0.0;
                let mut matched_fields = Vec::new();
                
                // Title match (highest weight)
                if e.title.to_lowercase().contains(&q) {
                    score += 10.0;
                    matched_fields.push("title".to_string());
                    if e.title.to_lowercase().starts_with(&q) {
                        score += 5.0;
                    }
                }
                
                // URL match
                if e.url.to_lowercase().contains(&q) {
                    score += 5.0;
                    matched_fields.push("url".to_string());
                }
                
                // Domain match
                if e.domain.to_lowercase().contains(&q) {
                    score += 3.0;
                    matched_fields.push("domain".to_string());
                }
                
                // Tags match
                if e.tags.iter().any(|t| t.to_lowercase().contains(&q)) {
                    score += 4.0;
                    matched_fields.push("tags".to_string());
                }
                
                // Boost by visit count
                score += (e.visit_count as f64).ln();
                
                // Boost recent entries
                let age_days = (self.now() - e.last_visit) / 86400;
                if age_days < 7 {
                    score += 2.0;
                }

                if score > 0.0 {
                    Some(SearchResult {
                        entry: e.clone(),
                        score,
                        matched_fields,
                        snippet: e.preview_text.clone(),
                    })
                } else {
                    None
                }
            })
            .collect();

        results.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));
        results
    }

    pub fn suggest(&self, query: &str, limit: u32) -> Vec<String> {
        let q = query.to_lowercase();
        let entries = self.entries.lock().unwrap();
        
        let mut suggestions: Vec<(String, u32)> = entries.values()
            .filter(|e| e.url.to_lowercase().contains(&q) || e.title.to_lowercase().contains(&q))
            .map(|e| (e.url.clone(), e.visit_count))
            .collect();

        suggestions.sort_by(|a, b| b.1.cmp(&a.1));
        suggestions.truncate(limit as usize);
        suggestions.into_iter().map(|(url, _)| url).collect()
    }

    // ==================== Tags ====================

    pub fn add_tag(&self, entry_id: &str, tag: String) -> Result<(), String> {
        let mut entries = self.entries.lock().unwrap();
        let entry = entries.get_mut(entry_id)
            .ok_or("Entry not found")?;
        if !entry.tags.contains(&tag) {
            entry.tags.push(tag);
        }
        Ok(())
    }

    pub fn remove_tag(&self, entry_id: &str, tag: &str) -> Result<(), String> {
        let mut entries = self.entries.lock().unwrap();
        let entry = entries.get_mut(entry_id)
            .ok_or("Entry not found")?;
        entry.tags.retain(|t| t != tag);
        Ok(())
    }

    pub fn toggle_starred(&self, entry_id: &str) -> Result<bool, String> {
        let mut entries = self.entries.lock().unwrap();
        let entry = entries.get_mut(entry_id)
            .ok_or("Entry not found")?;
        entry.starred = !entry.starred;
        Ok(entry.starred)
    }

    pub fn get_all_tags(&self) -> Vec<String> {
        let entries = self.entries.lock().unwrap();
        let mut tags: Vec<String> = entries.values()
            .flat_map(|e| e.tags.clone())
            .collect();
        tags.sort();
        tags.dedup();
        tags
    }

    // ==================== Sessions ====================

    pub fn start_session(&self, device_name: String) -> Result<BrowsingSession, String> {
        let session = BrowsingSession {
            id: self.generate_id("session"),
            name: None,
            started_at: self.now(),
            ended_at: None,
            status: SessionStatus::Active,
            entry_ids: Vec::new(),
            tabs_count: 0,
            windows_count: 1,
            total_duration_ms: 0,
            device_name,
        };
        
        let session_id = session.id.clone();
        *self.current_session_id.lock().unwrap() = Some(session_id.clone());
        self.sessions.lock().unwrap().insert(session_id, session.clone());
        
        Ok(session)
    }

    pub fn end_session(&self) -> Result<BrowsingSession, String> {
        let session_id = self.current_session_id.lock().unwrap()
            .clone()
            .ok_or("No active session")?;
        
        let mut sessions = self.sessions.lock().unwrap();
        let session = sessions.get_mut(&session_id)
            .ok_or("Session not found")?;
        
        let now = self.now();
        session.ended_at = Some(now);
        session.status = SessionStatus::Closed;
        session.total_duration_ms = (now - session.started_at) * 1000;
        
        let result = session.clone();
        drop(sessions);
        
        *self.current_session_id.lock().unwrap() = None;
        
        Ok(result)
    }

    pub fn get_current_session(&self) -> Option<BrowsingSession> {
        let session_id = self.current_session_id.lock().unwrap().clone()?;
        self.sessions.lock().unwrap().get(&session_id).cloned()
    }

    pub fn get_session(&self, session_id: &str) -> Option<BrowsingSession> {
        self.sessions.lock().unwrap().get(session_id).cloned()
    }

    pub fn get_all_sessions(&self) -> Vec<BrowsingSession> {
        let mut sessions: Vec<BrowsingSession> = self.sessions.lock().unwrap()
            .values()
            .cloned()
            .collect();
        sessions.sort_by(|a, b| b.started_at.cmp(&a.started_at));
        sessions
    }

    pub fn get_recent_sessions(&self, limit: u32) -> Vec<BrowsingSession> {
        let mut sessions = self.get_all_sessions();
        sessions.truncate(limit as usize);
        sessions
    }

    pub fn restore_session(&self, session_id: &str) -> Result<Vec<String>, String> {
        let sessions = self.sessions.lock().unwrap();
        let session = sessions.get(session_id)
            .ok_or("Session not found")?;
        
        Ok(session.entry_ids.clone())
    }

    pub fn rename_session(&self, session_id: &str, name: String) -> Result<(), String> {
        let mut sessions = self.sessions.lock().unwrap();
        let session = sessions.get_mut(session_id)
            .ok_or("Session not found")?;
        session.name = Some(name);
        Ok(())
    }

    pub fn delete_session(&self, session_id: &str) -> Result<(), String> {
        self.sessions.lock().unwrap().remove(session_id)
            .ok_or("Session not found")?;
        Ok(())
    }

    // ==================== Recently Closed ====================

    pub fn add_recently_closed(&self, url: String, title: String, tab_id: Option<String>) -> Result<(), String> {
        let closed = RecentlyClosed {
            id: self.generate_id("closed"),
            url,
            title,
            favicon_url: None,
            closed_at: self.now(),
            tab_id,
            session_id: self.current_session_id.lock().unwrap().clone(),
        };
        
        let mut recently = self.recently_closed.lock().unwrap();
        recently.insert(0, closed);
        
        // Keep only last 100
        if recently.len() > 100 {
            recently.truncate(100);
        }
        
        Ok(())
    }

    pub fn get_recently_closed(&self, limit: u32) -> Vec<RecentlyClosed> {
        let recently = self.recently_closed.lock().unwrap();
        recently.iter().take(limit as usize).cloned().collect()
    }

    pub fn restore_recently_closed(&self, id: &str) -> Result<RecentlyClosed, String> {
        let mut recently = self.recently_closed.lock().unwrap();
        let index = recently.iter().position(|r| r.id == id)
            .ok_or("Not found in recently closed")?;
        Ok(recently.remove(index))
    }

    pub fn clear_recently_closed(&self) -> Result<(), String> {
        self.recently_closed.lock().unwrap().clear();
        Ok(())
    }

    // ==================== Frequent Sites ====================

    pub fn get_frequent_sites(&self, limit: u32) -> Vec<FrequentSite> {
        let domain_stats = self.domain_stats.lock().unwrap();
        let entries = self.entries.lock().unwrap();
        
        let mut stats: Vec<&DomainStats> = domain_stats.values().collect();
        stats.sort_by(|a, b| b.visit_count.cmp(&a.visit_count));
        
        stats.iter()
            .take(limit as usize)
            .filter_map(|s| {
                entries.values()
                    .filter(|e| e.domain == s.domain)
                    .max_by_key(|e| e.visit_count)
                    .map(|e| FrequentSite {
                        domain: s.domain.clone(),
                        title: e.title.clone(),
                        url: e.url.clone(),
                        favicon_url: e.favicon_url.clone(),
                        visit_count: s.visit_count,
                        last_visit: s.last_visit,
                    })
            })
            .collect()
    }

    // ==================== Statistics ====================

    pub fn get_stats(&self) -> HistoryStats {
        let entries = self.entries.lock().unwrap();
        let domain_stats = self.domain_stats.lock().unwrap();
        let now = self.now();
        
        let total_entries = entries.len() as u64;
        let total_visits: u64 = entries.values().map(|e| e.visit_count as u64).sum();
        let total_duration: u64 = entries.values().map(|e| e.total_duration_ms).sum();
        let unique_domains = domain_stats.len() as u64;
        
        let today_start = now - 86400;
        let week_start = now - 604800;
        let month_start = now - 2592000;
        
        let visits_today: u64 = entries.values()
            .filter(|e| e.last_visit >= today_start)
            .map(|e| e.visit_count as u64)
            .sum();
        
        let visits_this_week: u64 = entries.values()
            .filter(|e| e.last_visit >= week_start)
            .map(|e| e.visit_count as u64)
            .sum();
        
        let visits_this_month: u64 = entries.values()
            .filter(|e| e.last_visit >= month_start)
            .map(|e| e.visit_count as u64)
            .sum();

        let mut page_type_distribution: HashMap<String, u64> = HashMap::new();
        for entry in entries.values() {
            let key = format!("{:?}", entry.page_type);
            *page_type_distribution.entry(key).or_insert(0) += 1;
        }

        let mut most_visited: Vec<DomainStats> = domain_stats.values().cloned().collect();
        most_visited.sort_by(|a, b| b.visit_count.cmp(&a.visit_count));
        most_visited.truncate(10);

        // Calculate hourly distribution (visits per hour of day)
        let mut hourly_distribution = vec![0u64; 24];
        for entry in entries.values() {
            for visit in &entry.visits {
                let hour = ((visit.timestamp % 86400) / 3600) as usize;
                if hour < 24 {
                    hourly_distribution[hour] += 1;
                }
            }
        }

        let settings = self.settings.lock().unwrap();
        let days = settings.retention_days as f64;
        let daily_average = if days > 0.0 { total_visits as f64 / days } else { 0.0 };

        HistoryStats {
            total_entries,
            total_visits,
            total_duration_ms: total_duration,
            unique_domains,
            visits_today,
            visits_this_week,
            visits_this_month,
            most_visited_domains: most_visited,
            page_type_distribution,
            hourly_distribution,
            daily_average_visits: daily_average,
        }
    }

    pub fn get_domain_stats(&self, domain: &str) -> Option<DomainStats> {
        self.domain_stats.lock().unwrap().get(domain).cloned()
    }

    pub fn get_all_domains(&self) -> Vec<String> {
        self.domain_stats.lock().unwrap().keys().cloned().collect()
    }

    // ==================== Cleanup ====================

    pub fn clear_history(&self, time_range: TimeRange) -> Result<u32, String> {
        let now = self.now();
        let (from, to) = match time_range {
            TimeRange::LastHour => (now - 3600, now),
            TimeRange::Today => (now - 86400, now),
            TimeRange::Yesterday => (now - 172800, now - 86400),
            TimeRange::LastWeek => (now - 604800, now),
            TimeRange::LastMonth => (now - 2592000, now),
            TimeRange::AllTime => (0, now),
            _ => (0, now),
        };

        let mut entries = self.entries.lock().unwrap();
        let to_remove: Vec<String> = entries.values()
            .filter(|e| e.last_visit >= from && e.last_visit <= to)
            .map(|e| e.id.clone())
            .collect();
        
        let count = to_remove.len() as u32;
        for id in to_remove {
            entries.remove(&id);
        }
        
        Ok(count)
    }

    pub fn clear_domain(&self, domain: &str) -> Result<u32, String> {
        let mut entries = self.entries.lock().unwrap();
        let to_remove: Vec<String> = entries.values()
            .filter(|e| e.domain == domain)
            .map(|e| e.id.clone())
            .collect();
        
        let count = to_remove.len() as u32;
        for id in to_remove {
            entries.remove(&id);
        }
        
        drop(entries);
        self.domain_stats.lock().unwrap().remove(domain);
        
        Ok(count)
    }

    pub fn cleanup_old_entries(&self) -> Result<u32, String> {
        let settings = self.settings.lock().unwrap();
        let retention_seconds = (settings.retention_days as u64) * 86400;
        drop(settings);
        
        let cutoff = self.now() - retention_seconds;
        
        let mut entries = self.entries.lock().unwrap();
        let to_remove: Vec<String> = entries.values()
            .filter(|e| e.last_visit < cutoff)
            .map(|e| e.id.clone())
            .collect();
        
        let count = to_remove.len() as u32;
        for id in to_remove {
            entries.remove(&id);
        }
        
        Ok(count)
    }

    // ==================== Export/Import ====================

    pub fn export_history(&self) -> Result<String, String> {
        let entries: Vec<HistoryEntry> = self.entries.lock().unwrap()
            .values()
            .cloned()
            .collect();
        
        serde_json::to_string_pretty(&entries)
            .map_err(|e| format!("Failed to export: {}", e))
    }

    pub fn import_history(&self, json: &str) -> Result<u32, String> {
        let imports: Vec<HistoryEntry> = serde_json::from_str(json)
            .map_err(|e| format!("Failed to parse: {}", e))?;
        
        let count = imports.len() as u32;
        let mut entries = self.entries.lock().unwrap();
        
        for entry in imports {
            entries.insert(entry.id.clone(), entry);
        }
        
        Ok(count)
    }
}

impl Default for BrowserHistoryService {
    fn default() -> Self {
        Self::new()
    }
}
