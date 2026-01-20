// CUBE Nexum - Tab Stacks Commands
// Tauri commands for the tab stacking system

use tauri::State;
use super::super::services::browser_tab_stacks::{
    BrowserTabStacksService, TabStack, TabStackSettings,
    AutoStackRule, StackStats, StackSuggestion, StackUpdate,
    StackLayout, DoubleClickBehavior, MiddleClickBehavior,
};

// ==================== Settings Commands ====================

#[tauri::command]
pub fn tab_stacks_get_settings(
    service: State<'_, BrowserTabStacksService>
) -> TabStackSettings {
    service.get_settings()
}

#[tauri::command]
pub fn tab_stacks_update_settings(
    settings: TabStackSettings,
    service: State<'_, BrowserTabStacksService>
) -> Result<(), String> {
    service.update_settings(settings);
    Ok(())
}

#[tauri::command]
pub fn tab_stacks_set_default_layout(
    layout: StackLayout,
    service: State<'_, BrowserTabStacksService>
) -> Result<(), String> {
    let mut settings = service.get_settings();
    settings.default_layout = layout;
    service.update_settings(settings);
    Ok(())
}

#[tauri::command]
pub fn tab_stacks_set_double_click_behavior(
    behavior: DoubleClickBehavior,
    service: State<'_, BrowserTabStacksService>
) -> Result<(), String> {
    let mut settings = service.get_settings();
    settings.double_click_behavior = behavior;
    service.update_settings(settings);
    Ok(())
}

#[tauri::command]
pub fn tab_stacks_set_middle_click_behavior(
    behavior: MiddleClickBehavior,
    service: State<'_, BrowserTabStacksService>
) -> Result<(), String> {
    let mut settings = service.get_settings();
    settings.middle_click_behavior = behavior;
    service.update_settings(settings);
    Ok(())
}

// ==================== Stack CRUD Commands ====================

#[tauri::command]
pub fn tab_stacks_get_all(
    service: State<'_, BrowserTabStacksService>
) -> Vec<TabStack> {
    service.get_all_stacks()
}

#[tauri::command]
pub fn tab_stacks_get(
    stack_id: String,
    service: State<'_, BrowserTabStacksService>
) -> Option<TabStack> {
    service.get_stack(&stack_id)
}

#[tauri::command]
pub fn tab_stacks_create(
    name: String,
    tab_ids: Vec<String>,
    service: State<'_, BrowserTabStacksService>
) -> Result<TabStack, String> {
    service.create_stack(name, tab_ids)
}

#[tauri::command]
pub fn tab_stacks_create_from_selected(
    tab_ids: Vec<String>,
    service: State<'_, BrowserTabStacksService>
) -> Result<TabStack, String> {
    service.create_stack_from_selected(tab_ids)
}

#[tauri::command]
pub fn tab_stacks_update(
    stack_id: String,
    updates: StackUpdate,
    service: State<'_, BrowserTabStacksService>
) -> Result<TabStack, String> {
    service.update_stack(&stack_id, updates)
}

#[tauri::command]
pub fn tab_stacks_rename(
    stack_id: String,
    name: String,
    service: State<'_, BrowserTabStacksService>
) -> Result<TabStack, String> {
    service.update_stack(&stack_id, StackUpdate {
        name: Some(name),
        color: None,
        icon: None,
        layout: None,
        is_expanded: None,
        is_muted: None,
        is_hibernated: None,
    })
}

#[tauri::command]
pub fn tab_stacks_set_color(
    stack_id: String,
    color: String,
    service: State<'_, BrowserTabStacksService>
) -> Result<TabStack, String> {
    service.update_stack(&stack_id, StackUpdate {
        name: None,
        color: Some(color),
        icon: None,
        layout: None,
        is_expanded: None,
        is_muted: None,
        is_hibernated: None,
    })
}

#[tauri::command]
pub fn tab_stacks_set_layout(
    stack_id: String,
    layout: StackLayout,
    service: State<'_, BrowserTabStacksService>
) -> Result<TabStack, String> {
    service.update_stack(&stack_id, StackUpdate {
        name: None,
        color: None,
        icon: None,
        layout: Some(layout),
        is_expanded: None,
        is_muted: None,
        is_hibernated: None,
    })
}

#[tauri::command]
pub fn tab_stacks_delete(
    stack_id: String,
    service: State<'_, BrowserTabStacksService>
) -> Result<Vec<String>, String> {
    service.delete_stack(&stack_id)
}

// ==================== Tab Management Commands ====================

#[tauri::command]
pub fn tab_stacks_add_tab(
    stack_id: String,
    tab_id: String,
    position: Option<i32>,
    service: State<'_, BrowserTabStacksService>
) -> Result<TabStack, String> {
    service.add_tab_to_stack(&stack_id, tab_id, position)
}

#[tauri::command]
pub fn tab_stacks_remove_tab(
    stack_id: String,
    tab_id: String,
    service: State<'_, BrowserTabStacksService>
) -> Result<(TabStack, bool), String> {
    service.remove_tab_from_stack(&stack_id, &tab_id)
}

#[tauri::command]
pub fn tab_stacks_move_tab(
    from_stack_id: String,
    to_stack_id: String,
    tab_id: String,
    position: Option<i32>,
    service: State<'_, BrowserTabStacksService>
) -> Result<(), String> {
    service.move_tab_between_stacks(&from_stack_id, &to_stack_id, &tab_id, position)
}

#[tauri::command]
pub fn tab_stacks_reorder_tabs(
    stack_id: String,
    tab_ids: Vec<String>,
    service: State<'_, BrowserTabStacksService>
) -> Result<TabStack, String> {
    service.reorder_tabs_in_stack(&stack_id, tab_ids)
}

#[tauri::command]
pub fn tab_stacks_set_active_tab(
    stack_id: String,
    tab_id: String,
    service: State<'_, BrowserTabStacksService>
) -> Result<usize, String> {
    service.set_active_tab_in_stack(&stack_id, &tab_id)
}

#[tauri::command]
pub fn tab_stacks_next_tab(
    stack_id: String,
    service: State<'_, BrowserTabStacksService>
) -> Option<String> {
    service.get_next_tab_in_stack(&stack_id)
}

#[tauri::command]
pub fn tab_stacks_prev_tab(
    stack_id: String,
    service: State<'_, BrowserTabStacksService>
) -> Option<String> {
    service.get_prev_tab_in_stack(&stack_id)
}

#[tauri::command]
pub fn tab_stacks_find_for_tab(
    tab_id: String,
    service: State<'_, BrowserTabStacksService>
) -> Option<TabStack> {
    service.find_stack_for_tab(&tab_id)
}

// ==================== Stack Actions Commands ====================

#[tauri::command]
pub fn tab_stacks_toggle_expand(
    stack_id: String,
    service: State<'_, BrowserTabStacksService>
) -> Result<bool, String> {
    service.toggle_expand(&stack_id)
}

#[tauri::command]
pub fn tab_stacks_toggle_mute(
    stack_id: String,
    service: State<'_, BrowserTabStacksService>
) -> Result<bool, String> {
    service.toggle_mute(&stack_id)
}

#[tauri::command]
pub fn tab_stacks_hibernate(
    stack_id: String,
    service: State<'_, BrowserTabStacksService>
) -> Result<(), String> {
    service.hibernate_stack(&stack_id)
}

#[tauri::command]
pub fn tab_stacks_awaken(
    stack_id: String,
    service: State<'_, BrowserTabStacksService>
) -> Result<(), String> {
    service.awaken_stack(&stack_id)
}

#[tauri::command]
pub fn tab_stacks_collapse_all(
    service: State<'_, BrowserTabStacksService>
) -> Result<(), String> {
    service.collapse_all();
    Ok(())
}

#[tauri::command]
pub fn tab_stacks_expand_all(
    service: State<'_, BrowserTabStacksService>
) -> Result<(), String> {
    service.expand_all();
    Ok(())
}

// ==================== Auto-Stacking Commands ====================

#[tauri::command]
pub fn tab_stacks_get_rules(
    service: State<'_, BrowserTabStacksService>
) -> Vec<AutoStackRule> {
    service.get_auto_stack_rules()
}

#[tauri::command]
pub fn tab_stacks_add_rule(
    rule: AutoStackRule,
    service: State<'_, BrowserTabStacksService>
) -> Result<(), String> {
    service.add_auto_stack_rule(rule)
}

#[tauri::command]
pub fn tab_stacks_update_rule(
    rule_id: String,
    rule: AutoStackRule,
    service: State<'_, BrowserTabStacksService>
) -> Result<(), String> {
    service.update_auto_stack_rule(&rule_id, rule)
}

#[tauri::command]
pub fn tab_stacks_delete_rule(
    rule_id: String,
    service: State<'_, BrowserTabStacksService>
) -> Result<(), String> {
    service.delete_auto_stack_rule(&rule_id)
}

#[tauri::command]
pub fn tab_stacks_check_auto_stack(
    url: String,
    title: String,
    opener_tab_id: Option<String>,
    service: State<'_, BrowserTabStacksService>
) -> Option<String> {
    service.check_auto_stack(&url, &title, opener_tab_id.as_deref())
}

#[tauri::command]
pub fn tab_stacks_toggle_auto_stack(
    service: State<'_, BrowserTabStacksService>
) -> bool {
    let mut settings = service.get_settings();
    settings.auto_stack_enabled = !settings.auto_stack_enabled;
    let enabled = settings.auto_stack_enabled;
    service.update_settings(settings);
    enabled
}

#[tauri::command]
pub fn tab_stacks_toggle_auto_stack_by_domain(
    service: State<'_, BrowserTabStacksService>
) -> bool {
    let mut settings = service.get_settings();
    settings.auto_stack_by_domain = !settings.auto_stack_by_domain;
    let enabled = settings.auto_stack_by_domain;
    service.update_settings(settings);
    enabled
}

#[tauri::command]
pub fn tab_stacks_toggle_auto_stack_by_opener(
    service: State<'_, BrowserTabStacksService>
) -> bool {
    let mut settings = service.get_settings();
    settings.auto_stack_by_opener = !settings.auto_stack_by_opener;
    let enabled = settings.auto_stack_by_opener;
    service.update_settings(settings);
    enabled
}

// ==================== Suggestions Commands ====================

#[tauri::command]
pub fn tab_stacks_get_suggestions(
    tabs: Vec<(String, String, String, Option<String>)>,
    service: State<'_, BrowserTabStacksService>
) -> Vec<StackSuggestion> {
    service.get_stack_suggestions(tabs)
}

// ==================== Search Commands ====================

#[tauri::command]
pub fn tab_stacks_search(
    query: String,
    service: State<'_, BrowserTabStacksService>
) -> Vec<TabStack> {
    service.search_stacks(&query)
}

// ==================== Stats Commands ====================

#[tauri::command]
pub fn tab_stacks_get_stats(
    service: State<'_, BrowserTabStacksService>
) -> StackStats {
    service.get_stats()
}

// ==================== Export/Import Commands ====================

#[tauri::command]
pub fn tab_stacks_export(
    service: State<'_, BrowserTabStacksService>
) -> Result<String, String> {
    service.export_stacks()
}

#[tauri::command]
pub fn tab_stacks_import(
    json: String,
    service: State<'_, BrowserTabStacksService>
) -> Result<(u32, u32), String> {
    service.import_stacks(&json)
}

// ==================== Quick Toggle Commands ====================

#[tauri::command]
pub fn tab_stacks_toggle_favicon_preview(
    service: State<'_, BrowserTabStacksService>
) -> bool {
    let mut settings = service.get_settings();
    settings.show_favicon_preview = !settings.show_favicon_preview;
    let show = settings.show_favicon_preview;
    service.update_settings(settings);
    show
}

#[tauri::command]
pub fn tab_stacks_toggle_memory_usage(
    service: State<'_, BrowserTabStacksService>
) -> bool {
    let mut settings = service.get_settings();
    settings.show_memory_usage = !settings.show_memory_usage;
    let show = settings.show_memory_usage;
    service.update_settings(settings);
    show
}

#[tauri::command]
pub fn tab_stacks_toggle_hibernate_inactive(
    service: State<'_, BrowserTabStacksService>
) -> bool {
    let mut settings = service.get_settings();
    settings.hibernate_inactive_stacks = !settings.hibernate_inactive_stacks;
    let enabled = settings.hibernate_inactive_stacks;
    service.update_settings(settings);
    enabled
}

#[tauri::command]
pub fn tab_stacks_set_hibernate_timeout(
    minutes: u32,
    service: State<'_, BrowserTabStacksService>
) -> Result<(), String> {
    let mut settings = service.get_settings();
    settings.hibernate_after_minutes = minutes;
    service.update_settings(settings);
    Ok(())
}
