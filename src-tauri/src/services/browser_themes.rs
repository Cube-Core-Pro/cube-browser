// CUBE Nexum - Browser Themes Service
// Advanced theming system with custom themes, editor, and community sharing

use std::collections::HashMap;
use std::sync::RwLock;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// ==================== Types ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrowserTheme {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub author: String,
    pub version: String,
    pub theme_type: ThemeType,
    pub colors: ThemeColors,
    pub fonts: ThemeFonts,
    pub ui: ThemeUI,
    pub effects: ThemeEffects,
    pub custom_css: Option<String>,
    pub preview_image: Option<String>,
    pub tags: Vec<String>,
    pub is_built_in: bool,
    pub is_favorite: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub install_count: u64,
    pub rating: f32,
    pub rating_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ThemeType {
    /// Light mode theme
    Light,
    /// Dark mode theme
    Dark,
    /// Follows system preference
    Auto,
    /// High contrast theme
    HighContrast,
    /// Custom color scheme
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeColors {
    // Primary colors
    pub primary: String,
    pub primary_hover: String,
    pub primary_active: String,
    pub primary_text: String,

    // Background colors
    pub background: String,
    pub background_secondary: String,
    pub background_tertiary: String,
    pub surface: String,
    pub surface_hover: String,
    pub surface_active: String,

    // Text colors
    pub text_primary: String,
    pub text_secondary: String,
    pub text_tertiary: String,
    pub text_disabled: String,
    pub text_inverse: String,

    // Border colors
    pub border: String,
    pub border_secondary: String,
    pub border_focus: String,

    // Accent colors
    pub accent: String,
    pub accent_hover: String,
    pub success: String,
    pub warning: String,
    pub error: String,
    pub info: String,

    // Tab bar
    pub tab_bar_background: String,
    pub tab_background: String,
    pub tab_background_active: String,
    pub tab_background_hover: String,
    pub tab_text: String,
    pub tab_text_active: String,
    pub tab_border: String,

    // Address bar
    pub address_bar_background: String,
    pub address_bar_text: String,
    pub address_bar_placeholder: String,
    pub address_bar_border: String,
    pub address_bar_focus_border: String,

    // Sidebar
    pub sidebar_background: String,
    pub sidebar_text: String,
    pub sidebar_active_background: String,
    pub sidebar_hover_background: String,
    pub sidebar_border: String,

    // Toolbar
    pub toolbar_background: String,
    pub toolbar_text: String,
    pub toolbar_button_hover: String,
    pub toolbar_button_active: String,

    // Scrollbar
    pub scrollbar_track: String,
    pub scrollbar_thumb: String,
    pub scrollbar_thumb_hover: String,

    // Selection
    pub selection_background: String,
    pub selection_text: String,

    // Shadow
    pub shadow_color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeFonts {
    pub ui_family: String,
    pub ui_size: u32,
    pub ui_weight: u32,
    pub monospace_family: String,
    pub monospace_size: u32,
    pub tab_size: u32,
    pub address_bar_size: u32,
    pub line_height: f32,
    pub letter_spacing: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeUI {
    // Border radius
    pub border_radius_small: u32,
    pub border_radius_medium: u32,
    pub border_radius_large: u32,
    pub border_radius_full: u32,

    // Tab bar
    pub tab_height: u32,
    pub tab_min_width: u32,
    pub tab_max_width: u32,
    pub tab_shape: TabShape,
    pub tab_close_button_position: CloseButtonPosition,
    pub show_tab_favicons: bool,
    pub show_tab_audio_indicator: bool,

    // Address bar
    pub address_bar_height: u32,
    pub address_bar_border_radius: u32,
    pub address_bar_style: AddressBarStyle,

    // Sidebar
    pub sidebar_width: u32,
    pub sidebar_position: SidebarPosition,
    pub sidebar_collapsed_width: u32,

    // Toolbar
    pub toolbar_height: u32,
    pub toolbar_icon_size: u32,
    pub toolbar_button_size: u32,
    pub toolbar_spacing: u32,

    // Spacing
    pub spacing_xs: u32,
    pub spacing_sm: u32,
    pub spacing_md: u32,
    pub spacing_lg: u32,
    pub spacing_xl: u32,

    // Compact mode
    pub compact_mode: bool,
    pub hide_toolbar_labels: bool,
    pub vertical_tabs: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TabShape {
    Square,
    Rounded,
    Pill,
    Trapezoid,
    Arc,
    Custom(String),
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CloseButtonPosition {
    Left,
    Right,
    Hidden,
    OnHover,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AddressBarStyle {
    Flat,
    Bordered,
    Floating,
    Pill,
    Minimal,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SidebarPosition {
    Left,
    Right,
    Hidden,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeEffects {
    pub enable_blur: bool,
    pub blur_amount: u32,
    pub enable_transparency: bool,
    pub transparency_level: f32,
    pub enable_shadows: bool,
    pub shadow_intensity: f32,
    pub enable_animations: bool,
    pub animation_speed: AnimationSpeed,
    pub enable_hover_effects: bool,
    pub enable_focus_ring: bool,
    pub focus_ring_width: u32,
    pub enable_gradients: bool,
    pub gradient_direction: GradientDirection,
    pub enable_backdrop_filter: bool,
    pub enable_glow_effects: bool,
    pub glow_color: String,
    pub glow_intensity: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AnimationSpeed {
    Instant,
    Fast,
    Normal,
    Slow,
    Custom(u32),
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum GradientDirection {
    ToRight,
    ToBottom,
    ToBottomRight,
    Radial,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeSettings {
    pub active_theme_id: String,
    pub auto_switch_enabled: bool,
    pub light_theme_id: String,
    pub dark_theme_id: String,
    pub schedule_enabled: bool,
    pub light_start_time: String,
    pub dark_start_time: String,
    pub sync_with_system: bool,
    pub apply_to_new_tab_page: bool,
    pub apply_to_devtools: bool,
    pub custom_css_enabled: bool,
    pub animations_enabled: bool,
    pub reduce_motion: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemePreset {
    pub id: String,
    pub name: String,
    pub colors: HashMap<String, String>,
    pub is_built_in: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeExport {
    pub version: String,
    pub theme: BrowserTheme,
    pub exported_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeStats {
    pub total_themes: u32,
    pub built_in_themes: u32,
    pub custom_themes: u32,
    pub favorite_themes: u32,
    pub active_theme_name: String,
    pub most_used_themes: Vec<(String, u64)>,
}

// ==================== Service Implementation ====================

pub struct BrowserThemesService {
    themes: RwLock<HashMap<String, BrowserTheme>>,
    settings: RwLock<ThemeSettings>,
    presets: RwLock<Vec<ThemePreset>>,
}

impl BrowserThemesService {
    pub fn new() -> Self {
        let mut themes = HashMap::new();
        let default_themes = Self::create_default_themes();
        for theme in default_themes {
            themes.insert(theme.id.clone(), theme);
        }

        Self {
            themes: RwLock::new(themes),
            settings: RwLock::new(Self::default_settings()),
            presets: RwLock::new(Self::default_presets()),
        }
    }

    fn default_settings() -> ThemeSettings {
        ThemeSettings {
            active_theme_id: "cube-dark".to_string(),
            auto_switch_enabled: true,
            light_theme_id: "cube-light".to_string(),
            dark_theme_id: "cube-dark".to_string(),
            schedule_enabled: false,
            light_start_time: "06:00".to_string(),
            dark_start_time: "18:00".to_string(),
            sync_with_system: true,
            apply_to_new_tab_page: true,
            apply_to_devtools: false,
            custom_css_enabled: true,
            animations_enabled: true,
            reduce_motion: false,
        }
    }

    fn default_presets() -> Vec<ThemePreset> {
        vec![
            ThemePreset {
                id: "nord".to_string(),
                name: "Nord".to_string(),
                colors: HashMap::from([
                    ("primary".to_string(), "#88c0d0".to_string()),
                    ("background".to_string(), "#2e3440".to_string()),
                    ("surface".to_string(), "#3b4252".to_string()),
                    ("text".to_string(), "#eceff4".to_string()),
                    ("accent".to_string(), "#81a1c1".to_string()),
                ]),
                is_built_in: true,
            },
            ThemePreset {
                id: "dracula".to_string(),
                name: "Dracula".to_string(),
                colors: HashMap::from([
                    ("primary".to_string(), "#bd93f9".to_string()),
                    ("background".to_string(), "#282a36".to_string()),
                    ("surface".to_string(), "#44475a".to_string()),
                    ("text".to_string(), "#f8f8f2".to_string()),
                    ("accent".to_string(), "#ff79c6".to_string()),
                ]),
                is_built_in: true,
            },
            ThemePreset {
                id: "solarized-dark".to_string(),
                name: "Solarized Dark".to_string(),
                colors: HashMap::from([
                    ("primary".to_string(), "#268bd2".to_string()),
                    ("background".to_string(), "#002b36".to_string()),
                    ("surface".to_string(), "#073642".to_string()),
                    ("text".to_string(), "#839496".to_string()),
                    ("accent".to_string(), "#2aa198".to_string()),
                ]),
                is_built_in: true,
            },
            ThemePreset {
                id: "monokai".to_string(),
                name: "Monokai".to_string(),
                colors: HashMap::from([
                    ("primary".to_string(), "#a6e22e".to_string()),
                    ("background".to_string(), "#272822".to_string()),
                    ("surface".to_string(), "#3e3d32".to_string()),
                    ("text".to_string(), "#f8f8f2".to_string()),
                    ("accent".to_string(), "#f92672".to_string()),
                ]),
                is_built_in: true,
            },
            ThemePreset {
                id: "github-dark".to_string(),
                name: "GitHub Dark".to_string(),
                colors: HashMap::from([
                    ("primary".to_string(), "#58a6ff".to_string()),
                    ("background".to_string(), "#0d1117".to_string()),
                    ("surface".to_string(), "#161b22".to_string()),
                    ("text".to_string(), "#c9d1d9".to_string()),
                    ("accent".to_string(), "#238636".to_string()),
                ]),
                is_built_in: true,
            },
            ThemePreset {
                id: "catppuccin-mocha".to_string(),
                name: "Catppuccin Mocha".to_string(),
                colors: HashMap::from([
                    ("primary".to_string(), "#cba6f7".to_string()),
                    ("background".to_string(), "#1e1e2e".to_string()),
                    ("surface".to_string(), "#313244".to_string()),
                    ("text".to_string(), "#cdd6f4".to_string()),
                    ("accent".to_string(), "#f5c2e7".to_string()),
                ]),
                is_built_in: true,
            },
        ]
    }

    fn create_default_themes() -> Vec<BrowserTheme> {
        vec![
            Self::create_cube_dark_theme(),
            Self::create_cube_light_theme(),
            Self::create_high_contrast_theme(),
            Self::create_ocean_theme(),
            Self::create_forest_theme(),
            Self::create_sunset_theme(),
        ]
    }

    fn create_cube_dark_theme() -> BrowserTheme {
        let now = Utc::now();
        BrowserTheme {
            id: "cube-dark".to_string(),
            name: "CUBE Nexum Dark".to_string(),
            description: Some("The signature CUBE Nexum dark theme with purple accents".to_string()),
            author: "CUBE Team".to_string(),
            version: "1.0.0".to_string(),
            theme_type: ThemeType::Dark,
            colors: ThemeColors {
                primary: "#8b5cf6".to_string(),
                primary_hover: "#7c3aed".to_string(),
                primary_active: "#6d28d9".to_string(),
                primary_text: "#ffffff".to_string(),
                background: "#0f0f23".to_string(),
                background_secondary: "#1a1a2e".to_string(),
                background_tertiary: "#16213e".to_string(),
                surface: "#1f1f3d".to_string(),
                surface_hover: "#2a2a4a".to_string(),
                surface_active: "#353557".to_string(),
                text_primary: "#e2e8f0".to_string(),
                text_secondary: "#94a3b8".to_string(),
                text_tertiary: "#64748b".to_string(),
                text_disabled: "#475569".to_string(),
                text_inverse: "#0f172a".to_string(),
                border: "#334155".to_string(),
                border_secondary: "#1e293b".to_string(),
                border_focus: "#8b5cf6".to_string(),
                accent: "#22d3ee".to_string(),
                accent_hover: "#06b6d4".to_string(),
                success: "#22c55e".to_string(),
                warning: "#f59e0b".to_string(),
                error: "#ef4444".to_string(),
                info: "#3b82f6".to_string(),
                tab_bar_background: "#0f0f23".to_string(),
                tab_background: "#1a1a2e".to_string(),
                tab_background_active: "#2a2a4a".to_string(),
                tab_background_hover: "#1f1f3d".to_string(),
                tab_text: "#94a3b8".to_string(),
                tab_text_active: "#e2e8f0".to_string(),
                tab_border: "#334155".to_string(),
                address_bar_background: "#1a1a2e".to_string(),
                address_bar_text: "#e2e8f0".to_string(),
                address_bar_placeholder: "#64748b".to_string(),
                address_bar_border: "#334155".to_string(),
                address_bar_focus_border: "#8b5cf6".to_string(),
                sidebar_background: "#0f0f23".to_string(),
                sidebar_text: "#94a3b8".to_string(),
                sidebar_active_background: "#8b5cf620".to_string(),
                sidebar_hover_background: "#1f1f3d".to_string(),
                sidebar_border: "#1e293b".to_string(),
                toolbar_background: "#1a1a2e".to_string(),
                toolbar_text: "#e2e8f0".to_string(),
                toolbar_button_hover: "#2a2a4a".to_string(),
                toolbar_button_active: "#353557".to_string(),
                scrollbar_track: "#1a1a2e".to_string(),
                scrollbar_thumb: "#334155".to_string(),
                scrollbar_thumb_hover: "#475569".to_string(),
                selection_background: "#8b5cf640".to_string(),
                selection_text: "#ffffff".to_string(),
                shadow_color: "#00000080".to_string(),
            },
            fonts: Self::default_fonts(),
            ui: Self::default_ui(),
            effects: Self::default_effects_dark(),
            custom_css: None,
            preview_image: None,
            tags: vec!["dark".to_string(), "purple".to_string(), "modern".to_string()],
            is_built_in: true,
            is_favorite: true,
            created_at: now,
            updated_at: now,
            install_count: 0,
            rating: 5.0,
            rating_count: 1000,
        }
    }

    fn create_cube_light_theme() -> BrowserTheme {
        let now = Utc::now();
        BrowserTheme {
            id: "cube-light".to_string(),
            name: "CUBE Nexum Light".to_string(),
            description: Some("Clean and bright theme for daytime use".to_string()),
            author: "CUBE Team".to_string(),
            version: "1.0.0".to_string(),
            theme_type: ThemeType::Light,
            colors: ThemeColors {
                primary: "#8b5cf6".to_string(),
                primary_hover: "#7c3aed".to_string(),
                primary_active: "#6d28d9".to_string(),
                primary_text: "#ffffff".to_string(),
                background: "#ffffff".to_string(),
                background_secondary: "#f8fafc".to_string(),
                background_tertiary: "#f1f5f9".to_string(),
                surface: "#ffffff".to_string(),
                surface_hover: "#f1f5f9".to_string(),
                surface_active: "#e2e8f0".to_string(),
                text_primary: "#0f172a".to_string(),
                text_secondary: "#475569".to_string(),
                text_tertiary: "#64748b".to_string(),
                text_disabled: "#94a3b8".to_string(),
                text_inverse: "#f8fafc".to_string(),
                border: "#e2e8f0".to_string(),
                border_secondary: "#f1f5f9".to_string(),
                border_focus: "#8b5cf6".to_string(),
                accent: "#0891b2".to_string(),
                accent_hover: "#0e7490".to_string(),
                success: "#16a34a".to_string(),
                warning: "#d97706".to_string(),
                error: "#dc2626".to_string(),
                info: "#2563eb".to_string(),
                tab_bar_background: "#f8fafc".to_string(),
                tab_background: "#ffffff".to_string(),
                tab_background_active: "#ffffff".to_string(),
                tab_background_hover: "#f1f5f9".to_string(),
                tab_text: "#475569".to_string(),
                tab_text_active: "#0f172a".to_string(),
                tab_border: "#e2e8f0".to_string(),
                address_bar_background: "#f1f5f9".to_string(),
                address_bar_text: "#0f172a".to_string(),
                address_bar_placeholder: "#94a3b8".to_string(),
                address_bar_border: "#e2e8f0".to_string(),
                address_bar_focus_border: "#8b5cf6".to_string(),
                sidebar_background: "#f8fafc".to_string(),
                sidebar_text: "#475569".to_string(),
                sidebar_active_background: "#8b5cf610".to_string(),
                sidebar_hover_background: "#f1f5f9".to_string(),
                sidebar_border: "#e2e8f0".to_string(),
                toolbar_background: "#ffffff".to_string(),
                toolbar_text: "#0f172a".to_string(),
                toolbar_button_hover: "#f1f5f9".to_string(),
                toolbar_button_active: "#e2e8f0".to_string(),
                scrollbar_track: "#f1f5f9".to_string(),
                scrollbar_thumb: "#cbd5e1".to_string(),
                scrollbar_thumb_hover: "#94a3b8".to_string(),
                selection_background: "#8b5cf630".to_string(),
                selection_text: "#0f172a".to_string(),
                shadow_color: "#0000001a".to_string(),
            },
            fonts: Self::default_fonts(),
            ui: Self::default_ui(),
            effects: Self::default_effects_light(),
            custom_css: None,
            preview_image: None,
            tags: vec!["light".to_string(), "clean".to_string(), "modern".to_string()],
            is_built_in: true,
            is_favorite: false,
            created_at: now,
            updated_at: now,
            install_count: 0,
            rating: 4.8,
            rating_count: 800,
        }
    }

    fn create_high_contrast_theme() -> BrowserTheme {
        let now = Utc::now();
        let mut theme = Self::create_cube_dark_theme();
        theme.id = "high-contrast".to_string();
        theme.name = "High Contrast".to_string();
        theme.description = Some("Accessibility-focused theme with maximum contrast".to_string());
        theme.theme_type = ThemeType::HighContrast;
        theme.colors.background = "#000000".to_string();
        theme.colors.text_primary = "#ffffff".to_string();
        theme.colors.border = "#ffffff".to_string();
        theme.colors.primary = "#00ff00".to_string();
        theme.tags = vec!["accessibility".to_string(), "high-contrast".to_string()];
        theme.is_favorite = false;
        theme.created_at = now;
        theme.updated_at = now;
        theme
    }

    fn create_ocean_theme() -> BrowserTheme {
        let now = Utc::now();
        let mut theme = Self::create_cube_dark_theme();
        theme.id = "ocean".to_string();
        theme.name = "Ocean Deep".to_string();
        theme.description = Some("Deep blue ocean-inspired theme".to_string());
        theme.colors.primary = "#0ea5e9".to_string();
        theme.colors.background = "#0c1929".to_string();
        theme.colors.surface = "#0f2744".to_string();
        theme.colors.accent = "#38bdf8".to_string();
        theme.tags = vec!["dark".to_string(), "blue".to_string(), "ocean".to_string()];
        theme.is_favorite = false;
        theme.created_at = now;
        theme.updated_at = now;
        theme
    }

    fn create_forest_theme() -> BrowserTheme {
        let now = Utc::now();
        let mut theme = Self::create_cube_dark_theme();
        theme.id = "forest".to_string();
        theme.name = "Forest Night".to_string();
        theme.description = Some("Natural green forest-inspired theme".to_string());
        theme.colors.primary = "#22c55e".to_string();
        theme.colors.background = "#0f1f0f".to_string();
        theme.colors.surface = "#1a2f1a".to_string();
        theme.colors.accent = "#4ade80".to_string();
        theme.tags = vec!["dark".to_string(), "green".to_string(), "nature".to_string()];
        theme.is_favorite = false;
        theme.created_at = now;
        theme.updated_at = now;
        theme
    }

    fn create_sunset_theme() -> BrowserTheme {
        let now = Utc::now();
        let mut theme = Self::create_cube_dark_theme();
        theme.id = "sunset".to_string();
        theme.name = "Sunset Glow".to_string();
        theme.description = Some("Warm sunset-inspired theme with orange accents".to_string());
        theme.colors.primary = "#f97316".to_string();
        theme.colors.background = "#1f1410".to_string();
        theme.colors.surface = "#2d1f1a".to_string();
        theme.colors.accent = "#fb923c".to_string();
        theme.tags = vec!["dark".to_string(), "orange".to_string(), "warm".to_string()];
        theme.is_favorite = false;
        theme.created_at = now;
        theme.updated_at = now;
        theme
    }

    fn default_fonts() -> ThemeFonts {
        ThemeFonts {
            ui_family: "Inter, system-ui, sans-serif".to_string(),
            ui_size: 13,
            ui_weight: 400,
            monospace_family: "JetBrains Mono, Fira Code, monospace".to_string(),
            monospace_size: 13,
            tab_size: 12,
            address_bar_size: 14,
            line_height: 1.5,
            letter_spacing: 0.0,
        }
    }

    fn default_ui() -> ThemeUI {
        ThemeUI {
            border_radius_small: 4,
            border_radius_medium: 8,
            border_radius_large: 12,
            border_radius_full: 9999,
            tab_height: 36,
            tab_min_width: 100,
            tab_max_width: 240,
            tab_shape: TabShape::Rounded,
            tab_close_button_position: CloseButtonPosition::Right,
            show_tab_favicons: true,
            show_tab_audio_indicator: true,
            address_bar_height: 40,
            address_bar_border_radius: 8,
            address_bar_style: AddressBarStyle::Pill,
            sidebar_width: 280,
            sidebar_position: SidebarPosition::Left,
            sidebar_collapsed_width: 48,
            toolbar_height: 44,
            toolbar_icon_size: 20,
            toolbar_button_size: 32,
            toolbar_spacing: 4,
            spacing_xs: 4,
            spacing_sm: 8,
            spacing_md: 16,
            spacing_lg: 24,
            spacing_xl: 32,
            compact_mode: false,
            hide_toolbar_labels: true,
            vertical_tabs: false,
        }
    }

    fn default_effects_dark() -> ThemeEffects {
        ThemeEffects {
            enable_blur: true,
            blur_amount: 20,
            enable_transparency: true,
            transparency_level: 0.95,
            enable_shadows: true,
            shadow_intensity: 0.3,
            enable_animations: true,
            animation_speed: AnimationSpeed::Normal,
            enable_hover_effects: true,
            enable_focus_ring: true,
            focus_ring_width: 2,
            enable_gradients: true,
            gradient_direction: GradientDirection::ToBottom,
            enable_backdrop_filter: true,
            enable_glow_effects: true,
            glow_color: "#8b5cf6".to_string(),
            glow_intensity: 0.2,
        }
    }

    fn default_effects_light() -> ThemeEffects {
        ThemeEffects {
            enable_blur: true,
            blur_amount: 16,
            enable_transparency: false,
            transparency_level: 1.0,
            enable_shadows: true,
            shadow_intensity: 0.1,
            enable_animations: true,
            animation_speed: AnimationSpeed::Normal,
            enable_hover_effects: true,
            enable_focus_ring: true,
            focus_ring_width: 2,
            enable_gradients: false,
            gradient_direction: GradientDirection::ToBottom,
            enable_backdrop_filter: false,
            enable_glow_effects: false,
            glow_color: "#8b5cf6".to_string(),
            glow_intensity: 0.0,
        }
    }

    // ==================== Settings ====================

    pub fn get_settings(&self) -> ThemeSettings {
        self.settings.read().unwrap().clone()
    }

    pub fn update_settings(&self, new_settings: ThemeSettings) {
        let mut settings = self.settings.write().unwrap();
        *settings = new_settings;
    }

    pub fn get_active_theme(&self) -> Option<BrowserTheme> {
        let settings = self.settings.read().unwrap();
        self.themes.read().unwrap().get(&settings.active_theme_id).cloned()
    }

    pub fn set_active_theme(&self, theme_id: &str) -> Result<BrowserTheme, String> {
        let themes = self.themes.read().unwrap();
        let theme = themes.get(theme_id)
            .ok_or_else(|| "Theme not found".to_string())?
            .clone();
        
        drop(themes);
        let mut settings = self.settings.write().unwrap();
        settings.active_theme_id = theme_id.to_string();
        
        Ok(theme)
    }

    // ==================== Theme CRUD ====================

    pub fn get_all_themes(&self) -> Vec<BrowserTheme> {
        self.themes.read().unwrap().values().cloned().collect()
    }

    pub fn get_theme(&self, theme_id: &str) -> Option<BrowserTheme> {
        self.themes.read().unwrap().get(theme_id).cloned()
    }

    pub fn get_themes_by_type(&self, theme_type: ThemeType) -> Vec<BrowserTheme> {
        self.themes.read().unwrap()
            .values()
            .filter(|t| t.theme_type == theme_type)
            .cloned()
            .collect()
    }

    pub fn get_favorite_themes(&self) -> Vec<BrowserTheme> {
        self.themes.read().unwrap()
            .values()
            .filter(|t| t.is_favorite)
            .cloned()
            .collect()
    }

    pub fn create_theme(&self, theme: BrowserTheme) -> Result<BrowserTheme, String> {
        let mut theme = theme;
        theme.id = Uuid::new_v4().to_string();
        theme.is_built_in = false;
        theme.created_at = Utc::now();
        theme.updated_at = Utc::now();

        let theme_clone = theme.clone();
        self.themes.write().unwrap().insert(theme.id.clone(), theme);
        Ok(theme_clone)
    }

    pub fn update_theme(&self, theme_id: &str, updates: ThemeUpdate) -> Result<BrowserTheme, String> {
        let mut themes = self.themes.write().unwrap();
        let theme = themes.get_mut(theme_id)
            .ok_or_else(|| "Theme not found".to_string())?;

        if theme.is_built_in && !updates.is_favorite.is_some() {
            return Err("Cannot modify built-in themes".to_string());
        }

        if let Some(name) = updates.name {
            theme.name = name;
        }
        if let Some(desc) = updates.description {
            theme.description = Some(desc);
        }
        if let Some(colors) = updates.colors {
            theme.colors = colors;
        }
        if let Some(fonts) = updates.fonts {
            theme.fonts = fonts;
        }
        if let Some(ui) = updates.ui {
            theme.ui = ui;
        }
        if let Some(effects) = updates.effects {
            theme.effects = effects;
        }
        if let Some(css) = updates.custom_css {
            theme.custom_css = Some(css);
        }
        if let Some(tags) = updates.tags {
            theme.tags = tags;
        }
        if let Some(fav) = updates.is_favorite {
            theme.is_favorite = fav;
        }

        theme.updated_at = Utc::now();
        Ok(theme.clone())
    }

    pub fn delete_theme(&self, theme_id: &str) -> Result<(), String> {
        let themes = self.themes.read().unwrap();
        let theme = themes.get(theme_id)
            .ok_or_else(|| "Theme not found".to_string())?;
        
        if theme.is_built_in {
            return Err("Cannot delete built-in themes".to_string());
        }

        drop(themes);
        self.themes.write().unwrap().remove(theme_id);
        Ok(())
    }

    pub fn duplicate_theme(&self, theme_id: &str, new_name: String) -> Result<BrowserTheme, String> {
        let themes = self.themes.read().unwrap();
        let source = themes.get(theme_id)
            .ok_or_else(|| "Theme not found".to_string())?
            .clone();
        drop(themes);

        let mut new_theme = source;
        new_theme.id = Uuid::new_v4().to_string();
        new_theme.name = new_name;
        new_theme.is_built_in = false;
        new_theme.created_at = Utc::now();
        new_theme.updated_at = Utc::now();
        new_theme.install_count = 0;
        new_theme.rating = 0.0;
        new_theme.rating_count = 0;

        let theme_clone = new_theme.clone();
        self.themes.write().unwrap().insert(new_theme.id.clone(), new_theme);
        Ok(theme_clone)
    }

    pub fn toggle_favorite(&self, theme_id: &str) -> Result<bool, String> {
        let mut themes = self.themes.write().unwrap();
        let theme = themes.get_mut(theme_id)
            .ok_or_else(|| "Theme not found".to_string())?;
        
        theme.is_favorite = !theme.is_favorite;
        theme.updated_at = Utc::now();
        Ok(theme.is_favorite)
    }

    // ==================== Presets ====================

    pub fn get_presets(&self) -> Vec<ThemePreset> {
        self.presets.read().unwrap().clone()
    }

    pub fn apply_preset(&self, theme_id: &str, preset_id: &str) -> Result<BrowserTheme, String> {
        let presets = self.presets.read().unwrap();
        let preset = presets.iter()
            .find(|p| p.id == preset_id)
            .ok_or_else(|| "Preset not found".to_string())?
            .clone();
        drop(presets);

        let mut themes = self.themes.write().unwrap();
        let theme = themes.get_mut(theme_id)
            .ok_or_else(|| "Theme not found".to_string())?;

        if theme.is_built_in {
            return Err("Cannot modify built-in themes".to_string());
        }

        // Apply preset colors
        if let Some(primary) = preset.colors.get("primary") {
            theme.colors.primary = primary.clone();
        }
        if let Some(background) = preset.colors.get("background") {
            theme.colors.background = background.clone();
        }
        if let Some(surface) = preset.colors.get("surface") {
            theme.colors.surface = surface.clone();
        }
        if let Some(text) = preset.colors.get("text") {
            theme.colors.text_primary = text.clone();
        }
        if let Some(accent) = preset.colors.get("accent") {
            theme.colors.accent = accent.clone();
        }

        theme.updated_at = Utc::now();
        Ok(theme.clone())
    }

    // ==================== Search ====================

    pub fn search_themes(&self, query: &str) -> Vec<BrowserTheme> {
        let query_lower = query.to_lowercase();
        self.themes.read().unwrap()
            .values()
            .filter(|t| {
                t.name.to_lowercase().contains(&query_lower) ||
                t.description.as_ref().map(|d| d.to_lowercase().contains(&query_lower)).unwrap_or(false) ||
                t.tags.iter().any(|tag| tag.to_lowercase().contains(&query_lower))
            })
            .cloned()
            .collect()
    }

    // ==================== Export/Import ====================

    pub fn export_theme(&self, theme_id: &str) -> Result<String, String> {
        let themes = self.themes.read().unwrap();
        let theme = themes.get(theme_id)
            .ok_or_else(|| "Theme not found".to_string())?;

        let export = ThemeExport {
            version: "1.0".to_string(),
            theme: theme.clone(),
            exported_at: Utc::now(),
        };

        serde_json::to_string_pretty(&export)
            .map_err(|e| format!("Export failed: {}", e))
    }

    pub fn import_theme(&self, json: &str) -> Result<BrowserTheme, String> {
        let export: ThemeExport = serde_json::from_str(json)
            .map_err(|e| format!("Import failed: {}", e))?;

        let mut theme = export.theme;
        theme.id = Uuid::new_v4().to_string();
        theme.is_built_in = false;
        theme.created_at = Utc::now();
        theme.updated_at = Utc::now();

        let theme_clone = theme.clone();
        self.themes.write().unwrap().insert(theme.id.clone(), theme);
        Ok(theme_clone)
    }

    // ==================== CSS Generation ====================

    pub fn generate_css(&self, theme_id: &str) -> Result<String, String> {
        let themes = self.themes.read().unwrap();
        let theme = themes.get(theme_id)
            .ok_or_else(|| "Theme not found".to_string())?;

        let mut css = String::from(":root {\n");
        
        // Colors
        css.push_str(&format!("  --color-primary: {};\n", theme.colors.primary));
        css.push_str(&format!("  --color-primary-hover: {};\n", theme.colors.primary_hover));
        css.push_str(&format!("  --color-background: {};\n", theme.colors.background));
        css.push_str(&format!("  --color-surface: {};\n", theme.colors.surface));
        css.push_str(&format!("  --color-text-primary: {};\n", theme.colors.text_primary));
        css.push_str(&format!("  --color-text-secondary: {};\n", theme.colors.text_secondary));
        css.push_str(&format!("  --color-border: {};\n", theme.colors.border));
        css.push_str(&format!("  --color-accent: {};\n", theme.colors.accent));
        
        // Fonts
        css.push_str(&format!("  --font-family-ui: {};\n", theme.fonts.ui_family));
        css.push_str(&format!("  --font-size-ui: {}px;\n", theme.fonts.ui_size));
        css.push_str(&format!("  --font-family-mono: {};\n", theme.fonts.monospace_family));
        
        // UI
        css.push_str(&format!("  --border-radius-sm: {}px;\n", theme.ui.border_radius_small));
        css.push_str(&format!("  --border-radius-md: {}px;\n", theme.ui.border_radius_medium));
        css.push_str(&format!("  --border-radius-lg: {}px;\n", theme.ui.border_radius_large));
        
        css.push_str("}\n");

        // Add custom CSS if present
        if let Some(custom) = &theme.custom_css {
            css.push_str("\n/* Custom CSS */\n");
            css.push_str(custom);
        }

        Ok(css)
    }

    // ==================== Statistics ====================

    pub fn get_stats(&self) -> ThemeStats {
        let themes = self.themes.read().unwrap();
        let settings = self.settings.read().unwrap();

        let total = themes.len() as u32;
        let built_in = themes.values().filter(|t| t.is_built_in).count() as u32;
        let custom = total - built_in;
        let favorites = themes.values().filter(|t| t.is_favorite).count() as u32;

        let active_name = themes.get(&settings.active_theme_id)
            .map(|t| t.name.clone())
            .unwrap_or_else(|| "Unknown".to_string());

        let mut usage: Vec<_> = themes.values()
            .map(|t| (t.name.clone(), t.install_count))
            .collect();
        usage.sort_by(|a, b| b.1.cmp(&a.1));
        usage.truncate(5);

        ThemeStats {
            total_themes: total,
            built_in_themes: built_in,
            custom_themes: custom,
            favorite_themes: favorites,
            active_theme_name: active_name,
            most_used_themes: usage,
        }
    }
}

impl Default for BrowserThemesService {
    fn default() -> Self {
        Self::new()
    }
}

// ==================== Update Types ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeUpdate {
    pub name: Option<String>,
    pub description: Option<String>,
    pub colors: Option<ThemeColors>,
    pub fonts: Option<ThemeFonts>,
    pub ui: Option<ThemeUI>,
    pub effects: Option<ThemeEffects>,
    pub custom_css: Option<String>,
    pub tags: Option<Vec<String>>,
    pub is_favorite: Option<bool>,
}
