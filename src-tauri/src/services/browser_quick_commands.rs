// CUBE Nexum - Quick Commands System
// Superior to Arc's command bar with AI-powered fuzzy search and context awareness
// Integrates all browser features in one universal command palette

use std::collections::HashMap;
use std::sync::RwLock;
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

// ==================== Types ====================

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CommandCategory {
    Navigation,
    Tabs,
    Bookmarks,
    History,
    Downloads,
    Settings,
    Extensions,
    DevTools,
    Privacy,
    AI,
    Workspaces,
    Split,
    Screenshot,
    Reader,
    Gestures,
    Search,
    Window,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CommandType {
    Action,         // Execute immediately
    Navigation,     // Navigate to URL/page
    Toggle,         // Toggle a setting
    Menu,           // Open submenu
    Search,         // Search within context
    Input,          // Requires text input
    Shortcut,       // Keyboard shortcut reference
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuickCommand {
    pub id: String,
    pub name: String,
    pub description: String,
    pub category: CommandCategory,
    pub command_type: CommandType,
    pub icon: String,
    pub keywords: Vec<String>,
    pub shortcut: Option<String>,
    pub action: CommandAction,
    pub is_system: bool,
    pub usage_count: u64,
    pub last_used: Option<DateTime<Utc>>,
    pub score_boost: f64,       // Manual relevance boost
    pub context_filter: Option<ContextFilter>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CommandAction {
    // Navigation
    GoBack,
    GoForward,
    Reload,
    ReloadHard,
    Stop,
    Home,
    OpenUrl(String),
    
    // Tabs
    NewTab,
    CloseTab,
    CloseOtherTabs,
    CloseTabsToRight,
    CloseTabsToLeft,
    ReopenClosedTab,
    DuplicateTab,
    PinTab,
    UnpinTab,
    MuteTab,
    NextTab,
    PreviousTab,
    MoveTabToNewWindow,
    
    // Bookmarks
    BookmarkPage,
    OpenBookmarkManager,
    OpenBookmark(String),
    SearchBookmarks,
    
    // History
    OpenHistory,
    ClearHistory,
    SearchHistory,
    
    // Downloads
    OpenDownloads,
    ClearDownloads,
    PauseAllDownloads,
    ResumeAllDownloads,
    
    // Settings
    OpenSettings,
    OpenSettingsSection(String),
    ToggleDarkMode,
    ToggleCompactMode,
    
    // Extensions
    OpenExtensions,
    ToggleExtension(String),
    OpenExtensionOptions(String),
    
    // DevTools
    OpenDevTools,
    OpenDevToolsConsole,
    OpenDevToolsNetwork,
    OpenDevToolsElements,
    ToggleDevTools,
    
    // Privacy
    OpenPrivacyDashboard,
    ClearBrowsingData,
    ToggleShield,
    ToggleTrackingProtection,
    OpenIncognito,
    
    // AI
    OpenAIAssistant,
    SummarizePage,
    TranslatePage,
    AskQuestion,
    
    // Workspaces
    OpenWorkspaces,
    CreateWorkspace,
    SwitchWorkspace(String),
    
    // Split View
    ToggleSplitView,
    SplitHorizontal,
    SplitVertical,
    SplitGrid,
    
    // Screenshot
    TakeScreenshot,
    ScreenshotFullPage,
    ScreenshotSelection,
    OpenScreenshotEditor,
    
    // Reader
    ToggleReaderMode,
    StartTTS,
    StopTTS,
    
    // Window
    NewWindow,
    CloseWindow,
    ToggleFullscreen,
    Minimize,
    Maximize,
    ToggleSidebar,
    
    // Search
    FocusSearchBar,
    SearchInPage,
    SearchSelectedText,
    
    // Custom
    RunScript(String),
    ExecuteTauri(String),
    OpenMenu(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContextFilter {
    pub require_tab: bool,
    pub require_url_pattern: Option<String>,
    pub require_selection: bool,
    pub require_media: bool,
    pub require_form: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandResult {
    pub command: QuickCommand,
    pub score: f64,
    pub match_ranges: Vec<(usize, usize)>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuickCommandSettings {
    pub enabled: bool,
    pub shortcut: String,
    pub max_results: usize,
    pub show_recent: bool,
    pub show_shortcuts: bool,
    pub show_categories: bool,
    pub fuzzy_matching: bool,
    pub ai_suggestions: bool,
    pub theme: PaletteTheme,
    pub position: PalettePosition,
    pub width: u32,
}

impl Default for QuickCommandSettings {
    fn default() -> Self {
        Self {
            enabled: true,
            shortcut: "Cmd+K".to_string(),
            max_results: 10,
            show_recent: true,
            show_shortcuts: true,
            show_categories: true,
            fuzzy_matching: true,
            ai_suggestions: true,
            theme: PaletteTheme::Auto,
            position: PalettePosition::Top,
            width: 600,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PaletteTheme {
    Auto,
    Light,
    Dark,
    HighContrast,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PalettePosition {
    Top,
    Center,
    TopRight,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchContext {
    pub current_url: Option<String>,
    pub page_title: Option<String>,
    pub has_selection: bool,
    pub has_media: bool,
    pub has_form: bool,
    pub current_workspace: Option<String>,
}

impl Default for SearchContext {
    fn default() -> Self {
        Self {
            current_url: None,
            page_title: None,
            has_selection: false,
            has_media: false,
            has_form: false,
            current_workspace: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuickCommandStats {
    pub total_searches: u64,
    pub total_executions: u64,
    pub most_used_commands: Vec<(String, u64)>,
    pub most_searched_terms: Vec<(String, u64)>,
    pub average_search_time: f64,
}

// ==================== Service ====================

pub struct BrowserQuickCommandsService {
    settings: RwLock<QuickCommandSettings>,
    commands: RwLock<HashMap<String, QuickCommand>>,
    recent_commands: RwLock<Vec<String>>,
    search_history: RwLock<Vec<String>>,
    stats: RwLock<QuickCommandStats>,
}

impl BrowserQuickCommandsService {
    pub fn new() -> Self {
        let service = Self {
            settings: RwLock::new(QuickCommandSettings::default()),
            commands: RwLock::new(HashMap::new()),
            recent_commands: RwLock::new(Vec::new()),
            search_history: RwLock::new(Vec::new()),
            stats: RwLock::new(QuickCommandStats {
                total_searches: 0,
                total_executions: 0,
                most_used_commands: Vec::new(),
                most_searched_terms: Vec::new(),
                average_search_time: 0.0,
            }),
        };
        service.init_system_commands();
        service
    }

    fn init_system_commands(&self) {
        let commands = vec![
            // Navigation
            Self::cmd("nav_back", "Go Back", "Navigate to previous page", 
                CommandCategory::Navigation, "←", vec!["back", "previous"],
                Some("Cmd+["), CommandAction::GoBack),
            Self::cmd("nav_forward", "Go Forward", "Navigate to next page",
                CommandCategory::Navigation, "→", vec!["forward", "next"],
                Some("Cmd+]"), CommandAction::GoForward),
            Self::cmd("nav_reload", "Reload Page", "Refresh current page",
                CommandCategory::Navigation, "🔄", vec!["refresh", "reload"],
                Some("Cmd+R"), CommandAction::Reload),
            Self::cmd("nav_reload_hard", "Hard Reload", "Reload bypassing cache",
                CommandCategory::Navigation, "🔄", vec!["refresh", "cache", "hard"],
                Some("Cmd+Shift+R"), CommandAction::ReloadHard),
            Self::cmd("nav_stop", "Stop Loading", "Stop page loading",
                CommandCategory::Navigation, "⏹", vec!["stop", "cancel"],
                Some("Esc"), CommandAction::Stop),
            Self::cmd("nav_home", "Go Home", "Navigate to home page",
                CommandCategory::Navigation, "🏠", vec!["home", "start"],
                Some("Cmd+Shift+H"), CommandAction::Home),

            // Tabs
            Self::cmd("tab_new", "New Tab", "Open a new tab",
                CommandCategory::Tabs, "➕", vec!["new", "create", "tab"],
                Some("Cmd+T"), CommandAction::NewTab),
            Self::cmd("tab_close", "Close Tab", "Close current tab",
                CommandCategory::Tabs, "✖️", vec!["close", "tab"],
                Some("Cmd+W"), CommandAction::CloseTab),
            Self::cmd("tab_close_others", "Close Other Tabs", "Close all except current",
                CommandCategory::Tabs, "✖️", vec!["close", "other", "tabs"],
                None, CommandAction::CloseOtherTabs),
            Self::cmd("tab_reopen", "Reopen Closed Tab", "Restore last closed tab",
                CommandCategory::Tabs, "↩️", vec!["reopen", "restore", "undo"],
                Some("Cmd+Shift+T"), CommandAction::ReopenClosedTab),
            Self::cmd("tab_duplicate", "Duplicate Tab", "Create copy of current tab",
                CommandCategory::Tabs, "📋", vec!["duplicate", "copy", "clone"],
                None, CommandAction::DuplicateTab),
            Self::cmd("tab_pin", "Pin Tab", "Pin current tab",
                CommandCategory::Tabs, "📌", vec!["pin", "stick"],
                None, CommandAction::PinTab),
            Self::cmd("tab_mute", "Mute Tab", "Mute/unmute tab audio",
                CommandCategory::Tabs, "🔇", vec!["mute", "audio", "sound"],
                Some("Cmd+Shift+M"), CommandAction::MuteTab),
            Self::cmd("tab_next", "Next Tab", "Switch to next tab",
                CommandCategory::Tabs, "→", vec!["next", "tab", "switch"],
                Some("Ctrl+Tab"), CommandAction::NextTab),
            Self::cmd("tab_prev", "Previous Tab", "Switch to previous tab",
                CommandCategory::Tabs, "←", vec!["previous", "tab", "switch"],
                Some("Ctrl+Shift+Tab"), CommandAction::PreviousTab),

            // Bookmarks
            Self::cmd("bm_add", "Bookmark Page", "Add current page to bookmarks",
                CommandCategory::Bookmarks, "⭐", vec!["bookmark", "add", "save", "favorite"],
                Some("Cmd+D"), CommandAction::BookmarkPage),
            Self::cmd("bm_manager", "Open Bookmarks", "Open bookmark manager",
                CommandCategory::Bookmarks, "📚", vec!["bookmarks", "manage", "library"],
                Some("Cmd+Shift+B"), CommandAction::OpenBookmarkManager),
            Self::cmd("bm_search", "Search Bookmarks", "Search in bookmarks",
                CommandCategory::Bookmarks, "🔍", vec!["search", "find", "bookmarks"],
                None, CommandAction::SearchBookmarks),

            // History
            Self::cmd("hist_open", "Open History", "View browsing history",
                CommandCategory::History, "📜", vec!["history", "visited"],
                Some("Cmd+Y"), CommandAction::OpenHistory),
            Self::cmd("hist_clear", "Clear History", "Clear browsing history",
                CommandCategory::History, "🗑️", vec!["clear", "delete", "history"],
                None, CommandAction::ClearHistory),
            Self::cmd("hist_search", "Search History", "Search in history",
                CommandCategory::History, "🔍", vec!["search", "find", "history"],
                None, CommandAction::SearchHistory),

            // Downloads
            Self::cmd("dl_open", "Open Downloads", "View downloads",
                CommandCategory::Downloads, "📥", vec!["downloads", "files"],
                Some("Cmd+J"), CommandAction::OpenDownloads),
            Self::cmd("dl_clear", "Clear Downloads", "Clear download list",
                CommandCategory::Downloads, "🗑️", vec!["clear", "downloads"],
                None, CommandAction::ClearDownloads),
            Self::cmd("dl_pause", "Pause All Downloads", "Pause all active downloads",
                CommandCategory::Downloads, "⏸️", vec!["pause", "downloads"],
                None, CommandAction::PauseAllDownloads),
            Self::cmd("dl_resume", "Resume All Downloads", "Resume paused downloads",
                CommandCategory::Downloads, "▶️", vec!["resume", "downloads"],
                None, CommandAction::ResumeAllDownloads),

            // Settings
            Self::cmd("set_open", "Open Settings", "Open browser settings",
                CommandCategory::Settings, "⚙️", vec!["settings", "preferences", "options"],
                Some("Cmd+,"), CommandAction::OpenSettings),
            Self::cmd("set_dark", "Toggle Dark Mode", "Switch dark/light theme",
                CommandCategory::Settings, "🌙", vec!["dark", "light", "theme", "mode"],
                None, CommandAction::ToggleDarkMode),

            // DevTools
            Self::cmd("dev_open", "Open DevTools", "Open developer tools",
                CommandCategory::DevTools, "🛠️", vec!["devtools", "inspect", "developer"],
                Some("Cmd+Option+I"), CommandAction::OpenDevTools),
            Self::cmd("dev_console", "Open Console", "Open DevTools console",
                CommandCategory::DevTools, "📟", vec!["console", "log", "devtools"],
                Some("Cmd+Option+J"), CommandAction::OpenDevToolsConsole),
            Self::cmd("dev_network", "Open Network Tab", "Open network inspector",
                CommandCategory::DevTools, "🌐", vec!["network", "requests", "devtools"],
                None, CommandAction::OpenDevToolsNetwork),
            Self::cmd("dev_elements", "Open Elements", "Open DOM inspector",
                CommandCategory::DevTools, "📄", vec!["elements", "dom", "html", "devtools"],
                Some("Cmd+Option+C"), CommandAction::OpenDevToolsElements),

            // Privacy
            Self::cmd("priv_dashboard", "Privacy Dashboard", "Open privacy settings",
                CommandCategory::Privacy, "🔒", vec!["privacy", "security", "protection"],
                None, CommandAction::OpenPrivacyDashboard),
            Self::cmd("priv_clear", "Clear Browsing Data", "Clear cookies, cache, history",
                CommandCategory::Privacy, "🧹", vec!["clear", "data", "cookies", "cache"],
                Some("Cmd+Shift+Delete"), CommandAction::ClearBrowsingData),
            Self::cmd("priv_shield", "Toggle Shield", "Enable/disable ad blocker",
                CommandCategory::Privacy, "🛡️", vec!["shield", "adblock", "blocker"],
                None, CommandAction::ToggleShield),
            Self::cmd("priv_incognito", "New Incognito Window", "Open private browsing",
                CommandCategory::Privacy, "🕵️", vec!["incognito", "private", "anonymous"],
                Some("Cmd+Shift+N"), CommandAction::OpenIncognito),

            // AI
            Self::cmd("ai_assistant", "Open AI Assistant", "Open AI chat assistant",
                CommandCategory::AI, "🤖", vec!["ai", "assistant", "chat", "gpt"],
                Some("Cmd+Shift+A"), CommandAction::OpenAIAssistant),
            Self::cmd("ai_summarize", "Summarize Page", "AI summary of current page",
                CommandCategory::AI, "📝", vec!["summarize", "summary", "tldr", "ai"],
                None, CommandAction::SummarizePage),
            Self::cmd("ai_translate", "Translate Page", "AI translation",
                CommandCategory::AI, "🌍", vec!["translate", "language", "ai"],
                None, CommandAction::TranslatePage),
            Self::cmd("ai_ask", "Ask AI", "Ask a question about the page",
                CommandCategory::AI, "❓", vec!["ask", "question", "ai"],
                None, CommandAction::AskQuestion),

            // Workspaces
            Self::cmd("ws_open", "Open Workspaces", "Manage workspaces",
                CommandCategory::Workspaces, "🗂️", vec!["workspaces", "spaces", "organize"],
                None, CommandAction::OpenWorkspaces),
            Self::cmd("ws_create", "Create Workspace", "Create new workspace",
                CommandCategory::Workspaces, "➕", vec!["new", "workspace", "create"],
                None, CommandAction::CreateWorkspace),

            // Split View
            Self::cmd("split_toggle", "Toggle Split View", "Enable/disable split view",
                CommandCategory::Split, "⬛", vec!["split", "view", "panel"],
                None, CommandAction::ToggleSplitView),
            Self::cmd("split_h", "Split Horizontal", "Split tabs horizontally",
                CommandCategory::Split, "➖", vec!["split", "horizontal"],
                None, CommandAction::SplitHorizontal),
            Self::cmd("split_v", "Split Vertical", "Split tabs vertically",
                CommandCategory::Split, "➕", vec!["split", "vertical"],
                None, CommandAction::SplitVertical),

            // Screenshot
            Self::cmd("ss_take", "Take Screenshot", "Capture visible area",
                CommandCategory::Screenshot, "📸", vec!["screenshot", "capture", "snap"],
                Some("Cmd+Shift+S"), CommandAction::TakeScreenshot),
            Self::cmd("ss_full", "Full Page Screenshot", "Capture entire page",
                CommandCategory::Screenshot, "📜", vec!["screenshot", "full", "page"],
                None, CommandAction::ScreenshotFullPage),
            Self::cmd("ss_select", "Screenshot Selection", "Capture selected area",
                CommandCategory::Screenshot, "✂️", vec!["screenshot", "select", "crop"],
                None, CommandAction::ScreenshotSelection),

            // Reader
            Self::cmd("reader_toggle", "Toggle Reader Mode", "Enable/disable reader",
                CommandCategory::Reader, "📖", vec!["reader", "read", "clean"],
                Some("Cmd+Shift+R"), CommandAction::ToggleReaderMode),
            Self::cmd("reader_tts", "Read Aloud", "Start text-to-speech",
                CommandCategory::Reader, "🔊", vec!["read", "aloud", "tts", "speak"],
                None, CommandAction::StartTTS),

            // Window
            Self::cmd("win_new", "New Window", "Open new browser window",
                CommandCategory::Window, "🪟", vec!["window", "new"],
                Some("Cmd+N"), CommandAction::NewWindow),
            Self::cmd("win_close", "Close Window", "Close current window",
                CommandCategory::Window, "✖️", vec!["close", "window"],
                Some("Cmd+Shift+W"), CommandAction::CloseWindow),
            Self::cmd("win_fullscreen", "Toggle Fullscreen", "Enter/exit fullscreen",
                CommandCategory::Window, "⛶", vec!["fullscreen", "maximize"],
                Some("Cmd+Ctrl+F"), CommandAction::ToggleFullscreen),
            Self::cmd("win_sidebar", "Toggle Sidebar", "Show/hide sidebar",
                CommandCategory::Window, "☰", vec!["sidebar", "panel"],
                Some("Cmd+B"), CommandAction::ToggleSidebar),

            // Search
            Self::cmd("search_focus", "Focus Search Bar", "Focus the address bar",
                CommandCategory::Search, "🔍", vec!["search", "address", "url", "omnibox"],
                Some("Cmd+L"), CommandAction::FocusSearchBar),
            Self::cmd("search_page", "Find in Page", "Search text on current page",
                CommandCategory::Search, "🔎", vec!["find", "search", "page"],
                Some("Cmd+F"), CommandAction::SearchInPage),
        ];

        let mut cmd_map = self.commands.write().unwrap();
        for cmd in commands {
            cmd_map.insert(cmd.id.clone(), cmd);
        }
    }

    fn cmd(
        id: &str, name: &str, description: &str,
        category: CommandCategory, icon: &str, keywords: Vec<&str>,
        shortcut: Option<&str>, action: CommandAction,
    ) -> QuickCommand {
        QuickCommand {
            id: id.to_string(),
            name: name.to_string(),
            description: description.to_string(),
            category,
            command_type: CommandType::Action,
            icon: icon.to_string(),
            keywords: keywords.iter().map(|s| s.to_string()).collect(),
            shortcut: shortcut.map(|s| s.to_string()),
            action,
            is_system: true,
            usage_count: 0,
            last_used: None,
            score_boost: 0.0,
            context_filter: None,
        }
    }

    // ==================== Settings ====================

    pub fn get_settings(&self) -> QuickCommandSettings {
        self.settings.read().unwrap().clone()
    }

    pub fn update_settings(&self, settings: QuickCommandSettings) {
        *self.settings.write().unwrap() = settings;
    }

    // ==================== Search ====================

    pub fn search(&self, query: &str, context: SearchContext) -> Vec<CommandResult> {
        let settings = self.settings.read().unwrap();
        let commands = self.commands.read().unwrap();
        let recent = self.recent_commands.read().unwrap();
        
        // Update search stats
        {
            let mut stats = self.stats.write().unwrap();
            stats.total_searches += 1;
        }
        
        // Record search term
        {
            let mut history = self.search_history.write().unwrap();
            if !query.is_empty() {
                history.push(query.to_string());
                if history.len() > 100 {
                    history.remove(0);
                }
            }
        }

        let query_lower = query.to_lowercase();
        let mut results: Vec<CommandResult> = Vec::new();

        for command in commands.values() {
            // Check context filter
            if let Some(ref filter) = command.context_filter {
                if filter.require_selection && !context.has_selection {
                    continue;
                }
                if filter.require_media && !context.has_media {
                    continue;
                }
                if filter.require_form && !context.has_form {
                    continue;
                }
            }

            let mut score = 0.0;
            let mut match_ranges = Vec::new();

            // Exact name match
            if command.name.to_lowercase() == query_lower {
                score = 100.0;
                match_ranges.push((0, query.len()));
            }
            // Name starts with query
            else if command.name.to_lowercase().starts_with(&query_lower) {
                score = 80.0;
                match_ranges.push((0, query.len()));
            }
            // Name contains query
            else if let Some(pos) = command.name.to_lowercase().find(&query_lower) {
                score = 60.0;
                match_ranges.push((pos, pos + query.len()));
            }
            // Fuzzy match on name
            else if settings.fuzzy_matching {
                let fuzzy_score = self.fuzzy_match(&query_lower, &command.name.to_lowercase());
                if fuzzy_score > 0.5 {
                    score = fuzzy_score * 50.0;
                }
            }

            // Keyword matches
            for keyword in &command.keywords {
                if keyword.to_lowercase().starts_with(&query_lower) {
                    score += 20.0;
                    break;
                }
                if keyword.to_lowercase().contains(&query_lower) {
                    score += 10.0;
                    break;
                }
            }

            // Category match
            let category_name = format!("{:?}", command.category).to_lowercase();
            if category_name.contains(&query_lower) {
                score += 15.0;
            }

            // Boost for recent usage
            if recent.contains(&command.id) {
                let recency_index = recent.iter().position(|id| id == &command.id).unwrap();
                score += (recent.len() - recency_index) as f64 * 5.0;
            }

            // Usage frequency boost
            score += (command.usage_count as f64).ln().max(0.0) * 3.0;

            // Manual score boost
            score += command.score_boost;

            if score > 0.0 {
                results.push(CommandResult {
                    command: command.clone(),
                    score,
                    match_ranges,
                });
            }
        }

        // Sort by score descending
        results.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());

        // Limit results
        results.truncate(settings.max_results);

        results
    }

    fn fuzzy_match(&self, pattern: &str, text: &str) -> f64 {
        let pattern_chars: Vec<char> = pattern.chars().collect();
        let text_chars: Vec<char> = text.chars().collect();
        
        if pattern_chars.is_empty() {
            return 1.0;
        }
        if text_chars.is_empty() {
            return 0.0;
        }

        let mut pattern_idx = 0;
        let mut matches = 0;

        for text_char in text_chars.iter() {
            if pattern_idx < pattern_chars.len() && *text_char == pattern_chars[pattern_idx] {
                matches += 1;
                pattern_idx += 1;
            }
        }

        if pattern_idx == pattern_chars.len() {
            matches as f64 / pattern_chars.len() as f64
        } else {
            0.0
        }
    }

    pub fn get_recent_commands(&self) -> Vec<QuickCommand> {
        let recent = self.recent_commands.read().unwrap();
        let commands = self.commands.read().unwrap();
        
        recent.iter()
            .filter_map(|id| commands.get(id).cloned())
            .collect()
    }

    // ==================== Execution ====================

    pub fn execute(&self, command_id: &str) -> Result<CommandAction, String> {
        let mut commands = self.commands.write().unwrap();
        let command = commands.get_mut(command_id)
            .ok_or("Command not found")?;
        
        // Update usage stats
        command.usage_count += 1;
        command.last_used = Some(Utc::now());
        
        let action = command.action.clone();
        drop(commands);

        // Update recent commands
        let mut recent = self.recent_commands.write().unwrap();
        recent.retain(|id| id != command_id);
        recent.insert(0, command_id.to_string());
        if recent.len() > 20 {
            recent.pop();
        }

        // Update stats
        let mut stats = self.stats.write().unwrap();
        stats.total_executions += 1;

        Ok(action)
    }

    // ==================== Custom Commands ====================

    pub fn create_custom_command(&self, command: QuickCommand) -> Result<QuickCommand, String> {
        if command.id.is_empty() {
            return Err("Command ID cannot be empty".to_string());
        }
        
        let mut commands = self.commands.write().unwrap();
        if commands.contains_key(&command.id) {
            return Err("Command ID already exists".to_string());
        }
        
        let mut new_command = command;
        new_command.is_system = false;
        commands.insert(new_command.id.clone(), new_command.clone());
        
        Ok(new_command)
    }

    pub fn update_custom_command(&self, command_id: &str, updates: CommandUpdate) -> Result<QuickCommand, String> {
        let mut commands = self.commands.write().unwrap();
        let command = commands.get_mut(command_id)
            .ok_or("Command not found")?;
        
        if command.is_system {
            return Err("Cannot modify system commands".to_string());
        }
        
        if let Some(name) = updates.name {
            command.name = name;
        }
        if let Some(description) = updates.description {
            command.description = description;
        }
        if let Some(icon) = updates.icon {
            command.icon = icon;
        }
        if let Some(keywords) = updates.keywords {
            command.keywords = keywords;
        }
        if let Some(shortcut) = updates.shortcut {
            command.shortcut = shortcut;
        }
        if let Some(action) = updates.action {
            command.action = action;
        }
        if let Some(score_boost) = updates.score_boost {
            command.score_boost = score_boost;
        }
        
        Ok(command.clone())
    }

    pub fn delete_custom_command(&self, command_id: &str) -> Result<(), String> {
        let mut commands = self.commands.write().unwrap();
        let command = commands.get(command_id)
            .ok_or("Command not found")?;
        
        if command.is_system {
            return Err("Cannot delete system commands".to_string());
        }
        
        commands.remove(command_id);
        Ok(())
    }

    // ==================== Stats ====================

    pub fn get_stats(&self) -> QuickCommandStats {
        let mut stats = self.stats.read().unwrap().clone();
        
        // Calculate most used commands
        let commands = self.commands.read().unwrap();
        let mut usage: Vec<_> = commands.values()
            .filter(|c| c.usage_count > 0)
            .map(|c| (c.name.clone(), c.usage_count))
            .collect();
        usage.sort_by(|a, b| b.1.cmp(&a.1));
        usage.truncate(10);
        stats.most_used_commands = usage;
        
        // Calculate most searched terms
        let history = self.search_history.read().unwrap();
        let mut term_counts: HashMap<String, u64> = HashMap::new();
        for term in history.iter() {
            *term_counts.entry(term.clone()).or_insert(0) += 1;
        }
        let mut terms: Vec<_> = term_counts.into_iter().collect();
        terms.sort_by(|a, b| b.1.cmp(&a.1));
        terms.truncate(10);
        stats.most_searched_terms = terms;
        
        stats
    }

    // ==================== Export/Import ====================

    pub fn export_custom_commands(&self) -> Result<String, String> {
        let commands = self.commands.read().unwrap();
        let custom: Vec<_> = commands.values()
            .filter(|c| !c.is_system)
            .cloned()
            .collect();
        
        serde_json::to_string_pretty(&custom)
            .map_err(|e| format!("Export failed: {}", e))
    }

    pub fn import_custom_commands(&self, json: &str) -> Result<u32, String> {
        let imported: Vec<QuickCommand> = serde_json::from_str(json)
            .map_err(|e| format!("Invalid JSON: {}", e))?;
        
        let mut count = 0;
        let mut commands = self.commands.write().unwrap();
        
        for mut command in imported {
            command.is_system = false;
            if !commands.contains_key(&command.id) {
                commands.insert(command.id.clone(), command);
                count += 1;
            }
        }
        
        Ok(count)
    }

    pub fn get_all_commands(&self) -> Vec<QuickCommand> {
        self.commands.read().unwrap().values().cloned().collect()
    }

    pub fn get_command(&self, command_id: &str) -> Option<QuickCommand> {
        self.commands.read().unwrap().get(command_id).cloned()
    }
}

impl Default for BrowserQuickCommandsService {
    fn default() -> Self {
        Self::new()
    }
}

// ==================== Update Types ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandUpdate {
    pub name: Option<String>,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub keywords: Option<Vec<String>>,
    pub shortcut: Option<Option<String>>,
    pub action: Option<CommandAction>,
    pub score_boost: Option<f64>,
}
