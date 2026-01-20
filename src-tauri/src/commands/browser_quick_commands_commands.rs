// CUBE Nexum - Quick Commands Commands
// Tauri commands for the command palette system

use tauri::State;
use super::super::services::browser_quick_commands::{
    BrowserQuickCommandsService, QuickCommand, QuickCommandSettings,
    QuickCommandStats, CommandResult, SearchContext, CommandAction,
    CommandUpdate, CommandCategory, CommandType,
};

// ==================== Settings Commands ====================

#[tauri::command]
pub fn quick_commands_get_settings(
    service: State<'_, BrowserQuickCommandsService>
) -> QuickCommandSettings {
    service.get_settings()
}

#[tauri::command]
pub fn quick_commands_update_settings(
    settings: QuickCommandSettings,
    service: State<'_, BrowserQuickCommandsService>
) -> Result<(), String> {
    service.update_settings(settings);
    Ok(())
}

// ==================== Search Commands ====================

#[tauri::command]
pub fn quick_commands_search(
    query: String,
    context: Option<SearchContext>,
    service: State<'_, BrowserQuickCommandsService>
) -> Vec<CommandResult> {
    service.search(&query, context.unwrap_or_default())
}

#[tauri::command]
pub fn quick_commands_get_recent(
    service: State<'_, BrowserQuickCommandsService>
) -> Vec<QuickCommand> {
    service.get_recent_commands()
}

// ==================== Execution Commands ====================

#[tauri::command]
pub fn quick_commands_execute(
    command_id: String,
    service: State<'_, BrowserQuickCommandsService>
) -> Result<CommandAction, String> {
    service.execute(&command_id)
}

// ==================== Command CRUD ====================

#[tauri::command]
pub fn quick_commands_get_all(
    service: State<'_, BrowserQuickCommandsService>
) -> Vec<QuickCommand> {
    service.get_all_commands()
}

#[tauri::command]
pub fn quick_commands_get_by_id(
    command_id: String,
    service: State<'_, BrowserQuickCommandsService>
) -> Option<QuickCommand> {
    service.get_command(&command_id)
}

#[tauri::command]
pub fn quick_commands_create(
    id: String,
    name: String,
    description: String,
    category: CommandCategory,
    command_type: CommandType,
    icon: String,
    keywords: Vec<String>,
    shortcut: Option<String>,
    action: CommandAction,
    service: State<'_, BrowserQuickCommandsService>
) -> Result<QuickCommand, String> {
    let command = QuickCommand {
        id,
        name,
        description,
        category,
        command_type,
        icon,
        keywords,
        shortcut,
        action,
        is_system: false,
        usage_count: 0,
        last_used: None,
        score_boost: 0.0,
        context_filter: None,
    };
    service.create_custom_command(command)
}

#[tauri::command]
pub fn quick_commands_update(
    command_id: String,
    updates: CommandUpdate,
    service: State<'_, BrowserQuickCommandsService>
) -> Result<QuickCommand, String> {
    service.update_custom_command(&command_id, updates)
}

#[tauri::command]
pub fn quick_commands_delete(
    command_id: String,
    service: State<'_, BrowserQuickCommandsService>
) -> Result<(), String> {
    service.delete_custom_command(&command_id)
}

// ==================== Stats Commands ====================

#[tauri::command]
pub fn quick_commands_get_stats(
    service: State<'_, BrowserQuickCommandsService>
) -> QuickCommandStats {
    service.get_stats()
}

// ==================== Import/Export Commands ====================

#[tauri::command]
pub fn quick_commands_export(
    service: State<'_, BrowserQuickCommandsService>
) -> Result<String, String> {
    service.export_custom_commands()
}

#[tauri::command]
pub fn quick_commands_import(
    json: String,
    service: State<'_, BrowserQuickCommandsService>
) -> Result<u32, String> {
    service.import_custom_commands(&json)
}

// ==================== Quick Access Commands ====================

#[tauri::command]
pub fn quick_commands_set_shortcut(
    shortcut: String,
    service: State<'_, BrowserQuickCommandsService>
) -> Result<(), String> {
    let mut settings = service.get_settings();
    settings.shortcut = shortcut;
    service.update_settings(settings);
    Ok(())
}

#[tauri::command]
pub fn quick_commands_set_max_results(
    max_results: usize,
    service: State<'_, BrowserQuickCommandsService>
) -> Result<(), String> {
    let mut settings = service.get_settings();
    settings.max_results = max_results;
    service.update_settings(settings);
    Ok(())
}

#[tauri::command]
pub fn quick_commands_toggle_fuzzy_matching(
    service: State<'_, BrowserQuickCommandsService>
) -> bool {
    let mut settings = service.get_settings();
    settings.fuzzy_matching = !settings.fuzzy_matching;
    let enabled = settings.fuzzy_matching;
    service.update_settings(settings);
    enabled
}

#[tauri::command]
pub fn quick_commands_toggle_ai_suggestions(
    service: State<'_, BrowserQuickCommandsService>
) -> bool {
    let mut settings = service.get_settings();
    settings.ai_suggestions = !settings.ai_suggestions;
    let enabled = settings.ai_suggestions;
    service.update_settings(settings);
    enabled
}

#[tauri::command]
pub fn quick_commands_get_by_category(
    category: CommandCategory,
    service: State<'_, BrowserQuickCommandsService>
) -> Vec<QuickCommand> {
    service.get_all_commands()
        .into_iter()
        .filter(|c| c.category == category)
        .collect()
}
