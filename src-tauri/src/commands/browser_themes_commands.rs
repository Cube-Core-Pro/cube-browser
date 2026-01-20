// CUBE Nexum - Browser Themes Commands
// Tauri commands for the theming system

use tauri::State;
use super::super::services::browser_themes::{
    BrowserThemesService, BrowserTheme, ThemeSettings,
    ThemeType, ThemeColors, ThemeFonts, ThemeUI, ThemeEffects,
    ThemeStats, ThemePreset, ThemeUpdate,
};

// ==================== Settings Commands ====================

#[tauri::command]
pub fn themes_get_settings(
    service: State<'_, BrowserThemesService>
) -> ThemeSettings {
    service.get_settings()
}

#[tauri::command]
pub fn themes_update_settings(
    settings: ThemeSettings,
    service: State<'_, BrowserThemesService>
) -> Result<(), String> {
    service.update_settings(settings);
    Ok(())
}

#[tauri::command]
pub fn themes_get_active(
    service: State<'_, BrowserThemesService>
) -> Option<BrowserTheme> {
    service.get_active_theme()
}

#[tauri::command]
pub fn themes_set_active(
    theme_id: String,
    service: State<'_, BrowserThemesService>
) -> Result<BrowserTheme, String> {
    service.set_active_theme(&theme_id)
}

// ==================== Theme CRUD Commands ====================

#[tauri::command]
pub fn themes_get_all(
    service: State<'_, BrowserThemesService>
) -> Vec<BrowserTheme> {
    service.get_all_themes()
}

#[tauri::command]
pub fn themes_get(
    theme_id: String,
    service: State<'_, BrowserThemesService>
) -> Option<BrowserTheme> {
    service.get_theme(&theme_id)
}

#[tauri::command]
pub fn themes_get_by_type(
    theme_type: ThemeType,
    service: State<'_, BrowserThemesService>
) -> Vec<BrowserTheme> {
    service.get_themes_by_type(theme_type)
}

#[tauri::command]
pub fn themes_get_favorites(
    service: State<'_, BrowserThemesService>
) -> Vec<BrowserTheme> {
    service.get_favorite_themes()
}

#[tauri::command]
pub fn themes_create(
    theme: BrowserTheme,
    service: State<'_, BrowserThemesService>
) -> Result<BrowserTheme, String> {
    service.create_theme(theme)
}

#[tauri::command]
pub fn themes_update(
    theme_id: String,
    updates: ThemeUpdate,
    service: State<'_, BrowserThemesService>
) -> Result<BrowserTheme, String> {
    service.update_theme(&theme_id, updates)
}

#[tauri::command]
pub fn themes_delete(
    theme_id: String,
    service: State<'_, BrowserThemesService>
) -> Result<(), String> {
    service.delete_theme(&theme_id)
}

#[tauri::command]
pub fn themes_duplicate(
    theme_id: String,
    new_name: String,
    service: State<'_, BrowserThemesService>
) -> Result<BrowserTheme, String> {
    service.duplicate_theme(&theme_id, new_name)
}

#[tauri::command]
pub fn themes_toggle_favorite(
    theme_id: String,
    service: State<'_, BrowserThemesService>
) -> Result<bool, String> {
    service.toggle_favorite(&theme_id)
}

// ==================== Color Commands ====================

#[tauri::command]
pub fn themes_update_colors(
    theme_id: String,
    colors: ThemeColors,
    service: State<'_, BrowserThemesService>
) -> Result<BrowserTheme, String> {
    service.update_theme(&theme_id, ThemeUpdate {
        name: None,
        description: None,
        colors: Some(colors),
        fonts: None,
        ui: None,
        effects: None,
        custom_css: None,
        tags: None,
        is_favorite: None,
    })
}

#[tauri::command]
pub fn themes_update_fonts(
    theme_id: String,
    fonts: ThemeFonts,
    service: State<'_, BrowserThemesService>
) -> Result<BrowserTheme, String> {
    service.update_theme(&theme_id, ThemeUpdate {
        name: None,
        description: None,
        colors: None,
        fonts: Some(fonts),
        ui: None,
        effects: None,
        custom_css: None,
        tags: None,
        is_favorite: None,
    })
}

#[tauri::command]
pub fn themes_update_ui(
    theme_id: String,
    ui: ThemeUI,
    service: State<'_, BrowserThemesService>
) -> Result<BrowserTheme, String> {
    service.update_theme(&theme_id, ThemeUpdate {
        name: None,
        description: None,
        colors: None,
        fonts: None,
        ui: Some(ui),
        effects: None,
        custom_css: None,
        tags: None,
        is_favorite: None,
    })
}

#[tauri::command]
pub fn themes_update_effects(
    theme_id: String,
    effects: ThemeEffects,
    service: State<'_, BrowserThemesService>
) -> Result<BrowserTheme, String> {
    service.update_theme(&theme_id, ThemeUpdate {
        name: None,
        description: None,
        colors: None,
        fonts: None,
        ui: None,
        effects: Some(effects),
        custom_css: None,
        tags: None,
        is_favorite: None,
    })
}

#[tauri::command]
pub fn themes_set_custom_css(
    theme_id: String,
    css: String,
    service: State<'_, BrowserThemesService>
) -> Result<BrowserTheme, String> {
    service.update_theme(&theme_id, ThemeUpdate {
        name: None,
        description: None,
        colors: None,
        fonts: None,
        ui: None,
        effects: None,
        custom_css: Some(css),
        tags: None,
        is_favorite: None,
    })
}

// ==================== Preset Commands ====================

#[tauri::command]
pub fn themes_get_presets(
    service: State<'_, BrowserThemesService>
) -> Vec<ThemePreset> {
    service.get_presets()
}

#[tauri::command]
pub fn themes_apply_preset(
    theme_id: String,
    preset_id: String,
    service: State<'_, BrowserThemesService>
) -> Result<BrowserTheme, String> {
    service.apply_preset(&theme_id, &preset_id)
}

// ==================== Search Commands ====================

#[tauri::command]
pub fn themes_search(
    query: String,
    service: State<'_, BrowserThemesService>
) -> Vec<BrowserTheme> {
    service.search_themes(&query)
}

// ==================== Export/Import Commands ====================

#[tauri::command]
pub fn themes_export(
    theme_id: String,
    service: State<'_, BrowserThemesService>
) -> Result<String, String> {
    service.export_theme(&theme_id)
}

#[tauri::command]
pub fn themes_import(
    json: String,
    service: State<'_, BrowserThemesService>
) -> Result<BrowserTheme, String> {
    service.import_theme(&json)
}

// ==================== CSS Generation Commands ====================

#[tauri::command]
pub fn themes_generate_css(
    theme_id: String,
    service: State<'_, BrowserThemesService>
) -> Result<String, String> {
    service.generate_css(&theme_id)
}

#[tauri::command]
pub fn themes_get_active_css(
    service: State<'_, BrowserThemesService>
) -> Result<String, String> {
    let settings = service.get_settings();
    service.generate_css(&settings.active_theme_id)
}

// ==================== Stats Commands ====================

#[tauri::command]
pub fn themes_get_stats(
    service: State<'_, BrowserThemesService>
) -> ThemeStats {
    service.get_stats()
}

// ==================== Quick Toggle Commands ====================

#[tauri::command]
pub fn themes_toggle_dark_mode(
    service: State<'_, BrowserThemesService>
) -> Result<BrowserTheme, String> {
    let settings = service.get_settings();
    let current = service.get_active_theme()
        .ok_or_else(|| "No active theme".to_string())?;

    let new_theme_id = if current.theme_type == ThemeType::Dark {
        settings.light_theme_id
    } else {
        settings.dark_theme_id
    };

    service.set_active_theme(&new_theme_id)
}

#[tauri::command]
pub fn themes_toggle_auto_switch(
    service: State<'_, BrowserThemesService>
) -> bool {
    let mut settings = service.get_settings();
    settings.auto_switch_enabled = !settings.auto_switch_enabled;
    let enabled = settings.auto_switch_enabled;
    service.update_settings(settings);
    enabled
}

#[tauri::command]
pub fn themes_toggle_system_sync(
    service: State<'_, BrowserThemesService>
) -> bool {
    let mut settings = service.get_settings();
    settings.sync_with_system = !settings.sync_with_system;
    let enabled = settings.sync_with_system;
    service.update_settings(settings);
    enabled
}

#[tauri::command]
pub fn themes_toggle_animations(
    service: State<'_, BrowserThemesService>
) -> bool {
    let mut settings = service.get_settings();
    settings.animations_enabled = !settings.animations_enabled;
    let enabled = settings.animations_enabled;
    service.update_settings(settings);
    enabled
}

#[tauri::command]
pub fn themes_toggle_reduce_motion(
    service: State<'_, BrowserThemesService>
) -> bool {
    let mut settings = service.get_settings();
    settings.reduce_motion = !settings.reduce_motion;
    let enabled = settings.reduce_motion;
    service.update_settings(settings);
    enabled
}

#[tauri::command]
pub fn themes_set_schedule(
    light_start: String,
    dark_start: String,
    service: State<'_, BrowserThemesService>
) -> Result<(), String> {
    let mut settings = service.get_settings();
    settings.light_start_time = light_start;
    settings.dark_start_time = dark_start;
    settings.schedule_enabled = true;
    service.update_settings(settings);
    Ok(())
}

#[tauri::command]
pub fn themes_reset_to_default(
    service: State<'_, BrowserThemesService>
) -> Result<BrowserTheme, String> {
    service.set_active_theme("cube-dark")
}
