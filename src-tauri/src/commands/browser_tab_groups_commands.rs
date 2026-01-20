// browser_tab_groups_commands.rs
// CUBE Elite v6 - Tab Groups Tauri Commands
// Expose Tab Groups functionality to frontend

use tauri::State;
use std::sync::Mutex;
use crate::services::browser_tab_groups::{
    CubeTabGroups, TabGroup, TabMetadata, TabGroupsConfig,
    GroupSuggestion, GroupingRule, GroupColor, TabGroupsStats
};

pub struct TabGroupsState(pub Mutex<CubeTabGroups>);

// ============ Configuration Commands ============

#[tauri::command]
pub async fn tab_groups_get_config(
    state: State<'_, TabGroupsState>
) -> Result<TabGroupsConfig, String> {
    let groups = state.0.lock().map_err(|e| e.to_string())?;
    Ok(groups.get_config())
}

#[tauri::command]
pub async fn tab_groups_set_config(
    config: TabGroupsConfig,
    state: State<'_, TabGroupsState>
) -> Result<(), String> {
    let mut groups = state.0.lock().map_err(|e| e.to_string())?;
    groups.set_config(config);
    Ok(())
}

#[tauri::command]
pub async fn tab_groups_set_enabled(
    enabled: bool,
    state: State<'_, TabGroupsState>
) -> Result<(), String> {
    let mut groups = state.0.lock().map_err(|e| e.to_string())?;
    groups.set_enabled(enabled);
    Ok(())
}

#[tauri::command]
pub async fn tab_groups_set_auto_group(
    enabled: bool,
    state: State<'_, TabGroupsState>
) -> Result<(), String> {
    let mut groups = state.0.lock().map_err(|e| e.to_string())?;
    groups.set_auto_group_enabled(enabled);
    Ok(())
}

#[tauri::command]
pub async fn tab_groups_set_vertical_tabs(
    enabled: bool,
    state: State<'_, TabGroupsState>
) -> Result<(), String> {
    let mut groups = state.0.lock().map_err(|e| e.to_string())?;
    groups.set_vertical_tabs(enabled);
    Ok(())
}

#[tauri::command]
pub async fn tab_groups_set_stacking(
    enabled: bool,
    state: State<'_, TabGroupsState>
) -> Result<(), String> {
    let mut groups = state.0.lock().map_err(|e| e.to_string())?;
    groups.set_stacking_enabled(enabled);
    Ok(())
}

// ============ Group Management Commands ============

#[tauri::command]
pub async fn tab_groups_create(
    name: String,
    color: String,
    state: State<'_, TabGroupsState>
) -> Result<TabGroup, String> {
    let mut groups = state.0.lock().map_err(|e| e.to_string())?;
    let group_color = GroupColor::from_name(&color);
    Ok(groups.create_group(name, group_color))
}

#[tauri::command]
pub async fn tab_groups_get(
    group_id: String,
    state: State<'_, TabGroupsState>
) -> Result<Option<TabGroup>, String> {
    let groups = state.0.lock().map_err(|e| e.to_string())?;
    Ok(groups.get_group(&group_id).cloned())
}

#[tauri::command]
pub async fn tab_groups_get_all(
    state: State<'_, TabGroupsState>
) -> Result<Vec<TabGroup>, String> {
    let groups = state.0.lock().map_err(|e| e.to_string())?;
    Ok(groups.get_all_groups())
}

#[tauri::command]
pub async fn tab_groups_delete(
    group_id: String,
    state: State<'_, TabGroupsState>
) -> Result<bool, String> {
    let mut groups = state.0.lock().map_err(|e| e.to_string())?;
    Ok(groups.delete_group(&group_id))
}

#[tauri::command]
pub async fn tab_groups_rename(
    group_id: String,
    new_name: String,
    state: State<'_, TabGroupsState>
) -> Result<bool, String> {
    let mut groups = state.0.lock().map_err(|e| e.to_string())?;
    Ok(groups.rename_group(&group_id, new_name))
}

#[tauri::command]
pub async fn tab_groups_set_color(
    group_id: String,
    color: String,
    state: State<'_, TabGroupsState>
) -> Result<bool, String> {
    let mut groups = state.0.lock().map_err(|e| e.to_string())?;
    let group_color = GroupColor::from_name(&color);
    Ok(groups.set_group_color(&group_id, group_color))
}

#[tauri::command]
pub async fn tab_groups_toggle_collapsed(
    group_id: String,
    state: State<'_, TabGroupsState>
) -> Result<bool, String> {
    let mut groups = state.0.lock().map_err(|e| e.to_string())?;
    Ok(groups.toggle_group_collapsed(&group_id))
}

#[tauri::command]
pub async fn tab_groups_pin(
    group_id: String,
    pinned: bool,
    state: State<'_, TabGroupsState>
) -> Result<bool, String> {
    let mut groups = state.0.lock().map_err(|e| e.to_string())?;
    Ok(groups.pin_group(&group_id, pinned))
}

// ============ Tab Management Commands ============

#[tauri::command]
pub async fn tab_groups_register_tab(
    id: String,
    url: String,
    title: String,
    state: State<'_, TabGroupsState>
) -> Result<String, String> {
    let mut groups = state.0.lock().map_err(|e| e.to_string())?;
    let tab = TabMetadata::new(id, url, title);
    Ok(groups.register_tab(tab))
}

#[tauri::command]
pub async fn tab_groups_unregister_tab(
    tab_id: String,
    state: State<'_, TabGroupsState>
) -> Result<bool, String> {
    let mut groups = state.0.lock().map_err(|e| e.to_string())?;
    Ok(groups.unregister_tab(&tab_id))
}

#[tauri::command]
pub async fn tab_groups_get_tab(
    tab_id: String,
    state: State<'_, TabGroupsState>
) -> Result<Option<TabMetadata>, String> {
    let groups = state.0.lock().map_err(|e| e.to_string())?;
    Ok(groups.get_tab(&tab_id).cloned())
}

#[tauri::command]
pub async fn tab_groups_update_tab(
    tab_id: String,
    url: Option<String>,
    title: Option<String>,
    state: State<'_, TabGroupsState>
) -> Result<bool, String> {
    let mut groups = state.0.lock().map_err(|e| e.to_string())?;
    Ok(groups.update_tab(&tab_id, url, title))
}

#[tauri::command]
pub async fn tab_groups_move_tab(
    tab_id: String,
    group_id: String,
    state: State<'_, TabGroupsState>
) -> Result<bool, String> {
    let mut groups = state.0.lock().map_err(|e| e.to_string())?;
    Ok(groups.move_tab_to_group(&tab_id, &group_id))
}

#[tauri::command]
pub async fn tab_groups_ungroup_tab(
    tab_id: String,
    state: State<'_, TabGroupsState>
) -> Result<bool, String> {
    let mut groups = state.0.lock().map_err(|e| e.to_string())?;
    Ok(groups.ungroup_tab(&tab_id))
}

#[tauri::command]
pub async fn tab_groups_get_ungrouped(
    state: State<'_, TabGroupsState>
) -> Result<Vec<TabMetadata>, String> {
    let groups = state.0.lock().map_err(|e| e.to_string())?;
    Ok(groups.get_ungrouped_tabs().into_iter().cloned().collect())
}

// ============ Tab Stacking Commands ============

#[tauri::command]
pub async fn tab_groups_stack_tabs(
    tab_ids: Vec<String>,
    group_id: String,
    state: State<'_, TabGroupsState>
) -> Result<Option<String>, String> {
    let mut groups = state.0.lock().map_err(|e| e.to_string())?;
    Ok(groups.stack_tabs(tab_ids, &group_id))
}

#[tauri::command]
pub async fn tab_groups_unstack_tabs(
    stack_id: String,
    group_id: String,
    state: State<'_, TabGroupsState>
) -> Result<bool, String> {
    let mut groups = state.0.lock().map_err(|e| e.to_string())?;
    Ok(groups.unstack_tabs(&stack_id, &group_id))
}

#[tauri::command]
pub async fn tab_groups_add_to_stack(
    tab_id: String,
    stack_id: String,
    group_id: String,
    state: State<'_, TabGroupsState>
) -> Result<bool, String> {
    let mut groups = state.0.lock().map_err(|e| e.to_string())?;
    Ok(groups.add_tab_to_stack(&tab_id, &stack_id, &group_id))
}

// ============ AI Suggestions Commands ============

#[tauri::command]
pub async fn tab_groups_get_suggestions(
    state: State<'_, TabGroupsState>
) -> Result<Vec<GroupSuggestion>, String> {
    let groups = state.0.lock().map_err(|e| e.to_string())?;
    Ok(groups.get_ai_suggestions())
}

#[tauri::command]
pub async fn tab_groups_apply_suggestion(
    suggestion: GroupSuggestion,
    state: State<'_, TabGroupsState>
) -> Result<Option<String>, String> {
    let mut groups = state.0.lock().map_err(|e| e.to_string())?;
    Ok(groups.apply_suggestion(&suggestion))
}

// ============ Grouping Rules Commands ============

#[tauri::command]
pub async fn tab_groups_add_rule(
    rule: GroupingRule,
    state: State<'_, TabGroupsState>
) -> Result<String, String> {
    let mut groups = state.0.lock().map_err(|e| e.to_string())?;
    Ok(groups.add_rule(rule))
}

#[tauri::command]
pub async fn tab_groups_remove_rule(
    rule_id: String,
    state: State<'_, TabGroupsState>
) -> Result<bool, String> {
    let mut groups = state.0.lock().map_err(|e| e.to_string())?;
    Ok(groups.remove_rule(&rule_id))
}

#[tauri::command]
pub async fn tab_groups_update_rule(
    rule_id: String,
    rule: GroupingRule,
    state: State<'_, TabGroupsState>
) -> Result<bool, String> {
    let mut groups = state.0.lock().map_err(|e| e.to_string())?;
    Ok(groups.update_rule(&rule_id, rule))
}

// ============ Statistics Commands ============

#[tauri::command]
pub async fn tab_groups_get_stats(
    state: State<'_, TabGroupsState>
) -> Result<TabGroupsStats, String> {
    let groups = state.0.lock().map_err(|e| e.to_string())?;
    Ok(groups.get_statistics())
}
